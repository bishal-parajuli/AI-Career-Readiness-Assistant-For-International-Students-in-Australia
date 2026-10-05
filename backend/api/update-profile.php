<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8443');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$userId = (int) ($input['user_id'] ?? 0);
$preferredName = trim($input['preferred_name'] ?? '');
$email = trim($input['email'] ?? '');

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'A valid user is required.'
    ]);
    exit;
}

if ($preferredName === '') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Name cannot be empty.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please enter a valid email address.'
    ]);
    exit;
}

try {
    $userCheck = $pdo->prepare(
        'SELECT user_id FROM user WHERE user_id = :user_id LIMIT 1'
    );

    $userCheck->execute([
        'user_id' => $userId
    ]);

    if (!$userCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found.'
        ]);
        exit;
    }

    $emailCheck = $pdo->prepare(
        'SELECT user_id
         FROM user
         WHERE email = :email
           AND user_id <> :user_id
         LIMIT 1'
    );

    $emailCheck->execute([
        'email' => $email,
        'user_id' => $userId
    ]);

    if ($emailCheck->fetch()) {
        http_response_code(409);
        echo json_encode([
            'status' => 'error',
            'message' => 'An account with this email already exists.'
        ]);
        exit;
    }

    $update = $pdo->prepare(
        'UPDATE user
         SET preferred_name = :preferred_name,
             email = :email
         WHERE user_id = :user_id'
    );

    $update->execute([
        'preferred_name' => $preferredName,
        'email' => $email,
        'user_id' => $userId
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully.',
        'user' => [
            'user_id' => $userId,
            'preferred_name' => $preferredName,
            'email' => $email
        ]
    ]);

} catch (Throwable $e) {
    error_log('Update profile error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to update profile.'
    ]);
}