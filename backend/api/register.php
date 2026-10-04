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

// Registration must use POST.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Read JSON sent by the frontend.
$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validate required fields.
if ($email === '' || $password === '') {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Email and password are required'
    ]);
    exit;
}

// Validate email format.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Please enter a valid email address'
    ]);
    exit;
}

// Basic password requirement.
if (strlen($password) < 8) {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Password must be at least 8 characters'
    ]);
    exit;
}

try {
    // Check whether the email already exists.
    $check = $pdo->prepare(
        'SELECT user_id FROM user WHERE email = :email LIMIT 1'
    );

    $check->execute([
        'email' => $email
    ]);

    if ($check->fetch()) {
        http_response_code(409);

        echo json_encode([
            'status' => 'error',
            'message' => 'An account with this email already exists'
        ]);
        exit;
    }

    // Never store the original password.
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO user (email, password_hash)
         VALUES (:email, :password_hash)'
    );

    $stmt->execute([
        'email' => $email,
        'password_hash' => $passwordHash
    ]);

    http_response_code(201);

    echo json_encode([
        'status' => 'success',
        'message' => 'Account created successfully',
        'user' => [
            'user_id' => (int) $pdo->lastInsertId(),
            'email' => $email
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to create account'
    ]);
}
