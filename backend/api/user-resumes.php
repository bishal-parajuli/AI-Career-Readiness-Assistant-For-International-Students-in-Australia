<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8443');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed.'
    ]);
    exit;
}

try {
    $userId = $_GET['user_id'] ?? null;

    if (!$userId || !filter_var($userId, FILTER_VALIDATE_INT)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'A valid user ID is required.'
        ]);
        exit;
    }

    $userId = (int) $userId;

    $userCheck = $pdo->prepare(
        'SELECT user_id FROM user WHERE user_id = ?'
    );
    $userCheck->execute([$userId]);

    if (!$userCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found.'
        ]);
        exit;
    }

    $statement = $pdo->prepare(
        'SELECT
            resume_id,
            input_method,
            file_name,
            target_role,
            uploaded_at
         FROM resume
         WHERE user_id = ?
         ORDER BY uploaded_at DESC'
    );

    $statement->execute([$userId]);
    $resumes = $statement->fetchAll();

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'resumes' => $resumes
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to retrieve resumes.'
    ]);
}