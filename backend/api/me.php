<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . 'http:' . chr(47) . chr(47) . 'localhost:8443');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

require_once __DIR__ . '/../config/auth.php';

$authenticatedUserId = requireAuth();

try {
    require_once __DIR__ . '/../config/database.php';

    $statement = $pdo->prepare(
        'SELECT user_id, preferred_name, email, created_at
         FROM user
         WHERE user_id = :user_id
         LIMIT 1'
    );

    $statement->execute([
        'user_id' => $authenticatedUserId
    ]);

    $user = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Profile not found'
        ]);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'user' => $user
    ]);

} catch (Throwable $error) {
    error_log($error->getMessage());

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to retrieve profile'
    ]);
}
