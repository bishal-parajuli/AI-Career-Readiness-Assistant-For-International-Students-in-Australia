
<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8443');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$genericMessage = 'If this email is registered, password reset instructions have been generated.';

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || !is_string($input['email'] ?? null)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'A valid email address is required.'
    ]);
    exit;
}

$email = trim($input['email']);

if (strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please enter a valid email address.'
    ]);
    exit;
}

// Development-only: require explicit opt-in and a local server.
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$serverAddress = $_SERVER['SERVER_ADDR'] ?? '';

$isLocalServer = in_array(
    $serverName,
    ['localhost', '127.0.0.1', '::1'],
    true
) && (
    $serverAddress === '' ||
    in_array($serverAddress, ['127.0.0.1', '::1'], true)
);

if (($_ENV['APP_ENV'] ?? '') !== 'development' || !$isLocalServer) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Development password recovery is disabled.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT user_id FROM user WHERE email = :email LIMIT 1'
    );
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if ($user) {
        $userId = (int) $user['user_id'];

        // Limit reset requests to one per account every 60 seconds.
        $rateStmt = $pdo->prepare(
            'SELECT reset_id FROM password_reset_tokens
             WHERE user_id = :user_id
             AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
             LIMIT 1'
        );
        $rateStmt->execute(['user_id' => $userId]);

        if (!$rateStmt->fetch()) {
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);

            $pdo->beginTransaction();

            // Invalidate earlier reset links for this account.
            $invalidate = $pdo->prepare(
                'UPDATE password_reset_tokens
                 SET used_at = NOW()
                 WHERE user_id = :user_id AND used_at IS NULL'
            );
            $invalidate->execute(['user_id' => $userId]);

            $insert = $pdo->prepare(
                'INSERT INTO password_reset_tokens
                 (user_id, token_hash, expires_at)
                 VALUES (:user_id, :token_hash,
                         DATE_ADD(NOW(), INTERVAL 15 MINUTE))'
            );
            $insert->execute([
                'user_id' => $userId,
                'token_hash' => $tokenHash
            ]);

            $pdo->commit();

            $resetUrl = 'http://localhost:8443/reset-password?token='
                . urlencode($token);

            // Store the link outside the PHP document root.
            $logDirectory = dirname(__DIR__, 2) . '/dev-logs';
            $logFile = $logDirectory . '/password-resets.log';

            if (!is_dir($logDirectory) || is_link($logDirectory)) {
                throw new RuntimeException('Private log directory unavailable.');
            }

            $line = date('c') . ' | User ID: ' . $userId
                . ' | Reset URL: ' . $resetUrl . PHP_EOL;

            if (file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX) === false) {
                throw new RuntimeException('Unable to write reset log.');
            }

            chmod($logFile, 0600);
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => $genericMessage
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to process password reset request.'
    ]);
}
