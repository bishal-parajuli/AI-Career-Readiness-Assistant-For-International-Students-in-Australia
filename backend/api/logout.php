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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
    exit;
}

require_once __DIR__ . '/../config/auth.php';

// Only authenticated students can log out.
requireAuth();

// Clear all session data.
$_SESSION = [];

// Delete the session cookie.
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite']
    ]);
}

// Invalidate the server-side session.
session_destroy();

http_response_code(200);

echo json_encode([
    'status' => 'success',
    'message' => 'Logout successful'
]);
