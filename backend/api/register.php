<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . 'http:' . chr(47) . chr(47) . 'localhost:8443');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';

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
// Reject malformed JSON and non-object input.
if (
    json_last_error() !== JSON_ERROR_NONE ||
    !is_array($input) ||
    ($input !== [] && array_is_list($input))
) {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request data. Please submit a valid JSON object.'
    ]);
    exit;
}

// Reject fields with unexpected data types.
foreach (['preferred_name', 'email', 'password'] as $field) {
    if (isset($input[$field]) && !is_string($input[$field])) {
        http_response_code(400);

        echo json_encode([
            'status' => 'error',
            'message' => 'Preferred name, email and password must be text values.'
        ]);
        exit;
    }
}
$preferredName = trim($input['preferred_name'] ?? '');

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validate required fields.
if ($preferredName === '' || $email === '' || $password === '') {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Preferred name, email and password are required'
    ]);
    exit;
}
// Preferred name must not exceed the database limit.
if (mb_strlen($preferredName, 'UTF-8') > 100) {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Preferred name must not exceed 100 characters.'
    ]);
    exit;
}
// Reject email addresses exceeding the database limit.
if (strlen($email) > 255) {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Email address must not exceed 255 characters.'
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
// Reject passwords containing only whitespace.
if (trim($password) === '') {
    http_response_code(400);

    echo json_encode([
        'status' => 'error',
        'message' => 'Please enter a password. Spaces alone are not allowed.'
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
    'INSERT INTO user (preferred_name, email, password_hash)
     VALUES (:preferred_name, :email, :password_hash)'
);

$stmt->execute([
    'preferred_name' => $preferredName,
    'email' => $email,
    'password_hash' => $passwordHash
]);

    $newUserId = (int) $pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION["user_id"] = $newUserId;
    $_SESSION["authenticated_at"] = time();

    http_response_code(201);

    echo json_encode([
        'status' => 'success',
        'message' => 'Account created successfully',
        'user' => [
    'user_id' => (int) $pdo->lastInsertId(),
    'preferred_name' => $preferredName,
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
