<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8443');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? (int) $data['user_id'] : 0;
    $jobAdText = trim($data['job_ad_text'] ?? '');
    $jobUrl = trim($data['job_url'] ?? '');
    $jobTitle = trim($data['job_title'] ?? '');
    $companyName = trim($data['company_name'] ?? '');

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'A valid user is required.'
        ]);
        exit;
    }

    if ($jobAdText === '') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Job advertisement text is required for analysis.'
        ]);
        exit;
    }

    if ($jobUrl !== '' && filter_var($jobUrl, FILTER_VALIDATE_URL) === false) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'The job advertisement URL is not valid.'
        ]);
        exit;
    }

    $userStatement = $pdo->prepare(
        'SELECT user_id FROM user WHERE user_id = ?'
    );
    $userStatement->execute([$userId]);

    if (!$userStatement->fetch()) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found.'
        ]);
        exit;
    }

    $inputMethod = $jobUrl !== '' ? 'paste_with_url' : 'paste';

    $statement = $pdo->prepare(
        'INSERT INTO job_advertisement
            (user_id, input_method, job_url, job_ad_text, job_title, company_name)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    $statement->execute([
        $userId,
        $inputMethod,
        $jobUrl !== '' ? $jobUrl : null,
        $jobAdText,
        $jobTitle !== '' ? $jobTitle : null,
        $companyName !== '' ? $companyName : null
    ]);

    $jobAdId = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Job advertisement saved successfully.',
        'job_ad_id' => $jobAdId
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to save the job advertisement.'
    ]);
}