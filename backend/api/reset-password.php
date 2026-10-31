
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
        'message' => 'Method not allowed.'
    ]);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

$token = $input['token'] ?? null;
$password = $input['password'] ?? null;

if (
    !is_string($token) ||
    !preg_match('/^[a-f0-9]{64}$/', $token) ||
    !is_string($password) ||
    strlen($password) < 8 ||
    strlen($password) > 1024
) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid reset token or password. Password must be at least 8 characters.'
    ]);
    exit;
}

// This reset mechanism is restricted to local development.
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

if (
    ($_ENV['APP_ENV'] ?? '') !== 'development' ||
    !$isLocalServer
) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Development password recovery is disabled.'
    ]);
    exit;
}

try {
    $tokenHash = hash('sha256', $token);
    $newPasswordHash = password_hash($password, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'SELECT reset_id, user_id
         FROM password_reset_tokens
         WHERE token_hash = :token_hash
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1
         FOR UPDATE'
    );

    $stmt->execute(['token_hash' => $tokenHash]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Reset link is invalid or has expired.'
        ]);
        exit;
    }

    $updateUser = $pdo->prepare(
        'UPDATE user
         SET password_hash = :password_hash
         WHERE user_id = :user_id'
    );

    $updateUser->execute([
        'password_hash' => $newPasswordHash,
        'user_id' => $reset['user_id']
    ]);

    // Invalidate every outstanding reset token for this user.
    $invalidate = $pdo->prepare(
        'UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE user_id = :user_id
           AND used_at IS NULL'
    );

    $invalidate->execute([
        'user_id' => $reset['user_id']
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Password reset successfully. You can now log in.'
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to reset password.'
    ]);
}
