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

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = $data['user_id'] ?? null;
    $resumeText = trim($data['resume_text'] ?? '');
    $targetRole = trim($data['target_role'] ?? '');
    $inputMethod = $data['input_method'] ?? 'paste';
$fileName = isset($data['file_name']) && $data['file_name'] !== ''
    ? basename($data['file_name'])
    : null;

    if (!$userId || $resumeText === '' || $targetRole === '') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'User, resume text and target role are required'
        ]);
        exit;
    }

    if (!filter_var($userId, FILTER_VALIDATE_INT)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid user ID'
        ]);
        exit;
    }

    $userCheck = $pdo->prepare(
        'SELECT user_id FROM user WHERE user_id = :user_id'
    );

    $userCheck->execute([
        'user_id' => $userId
    ]);

    if (!$userCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found'
        ]);
        exit;
    }

    $statement = $pdo->prepare(
        'INSERT INTO resume
        (user_id, input_method, file_name, resume_text, target_role)
        VALUES
        (:user_id, :input_method, :file_name, :resume_text, :target_role)'
    );

    $statement->execute([
    'user_id' => $userId,
    'input_method' => $inputMethod,
    'file_name' => $fileName,
    'resume_text' => $resumeText,
    'target_role' => $targetRole
]);
    $resumeId = (int) $pdo->lastInsertId();

    http_response_code(201);

    echo json_encode([
        'status' => 'success',
        'message' => 'Resume submitted successfully',
        'resume_id' => $resumeId
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to submit resume'
    ]);
}
