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

    $resumeId = $data['resume_id'] ?? null;

    if (!$resumeId || !filter_var($resumeId, FILTER_VALIDATE_INT)) {
        http_response_code(400);

        echo json_encode([
            'status' => 'error',
            'message' => 'A valid resume ID is required'
        ]);
        exit;
    }

    $statement = $pdo->prepare(
        'SELECT
            r.resume_id,
            r.user_id,
            r.resume_text,
            r.target_role,
            r.input_method,
            r.file_name
         FROM resume r
         WHERE r.resume_id = :resume_id
         LIMIT 1'
    );

    $statement->execute([
        'resume_id' => $resumeId
    ]);

    $resume = $statement->fetch();

    if (!$resume) {
        http_response_code(404);

        echo json_encode([
            'status' => 'error',
            'message' => 'Resume not found'
        ]);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Resume ready for AI analysis',
        'resume' => [
            'resume_id' => (int) $resume['resume_id'],
            'user_id' => (int) $resume['user_id'],
            'resume_text' => $resume['resume_text'],
            'target_role' => $resume['target_role'],
            'input_method' => $resume['input_method'],
            'file_name' => $resume['file_name']
        ]
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to prepare resume feedback'
    ]);
}
