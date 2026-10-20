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
require_once __DIR__ . '/../config/auth.php';
$authenticatedUserId = requireAuth();
try {
    $input = json_decode(file_get_contents('php://input'), true);
if (
    json_last_error() !== JSON_ERROR_NONE ||
    !is_array($input) ||
    ($input !== [] && array_is_list($input))
) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please submit valid interview session details.'
    ]);
    exit;
}

foreach (['target_role', 'industry', 'interview_type', 'difficulty_level'] as $field) {
    if (isset($input[$field]) && !is_string($input[$field])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Please enter valid text for ' . str_replace('_', ' ', $field) . '.'
        ]);
        exit;
    }
}

if (
    !isset($input['question_count']) ||
    !is_int($input['question_count']) ||
    !in_array($input['question_count'], [3, 5, 10], true)
) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please select 3, 5 or 10 interview questions.'
    ]);
    exit;
}
    $userId = $authenticatedUserId;
    $targetRole = trim($input['target_role'] ?? '');
    $industry = trim($input['industry'] ?? '');
    $interviewType = trim($input['interview_type'] ?? '');
    $difficultyLevel = trim($input['difficulty_level'] ?? '');
    $questionCount = (int) ($input['question_count'] ?? 0);
    $useCareerProfile = !empty($input['use_career_profile']) ? 1 : 0;

    if (
        !$userId ||
        $targetRole === '' ||
        $interviewType === '' ||
        $difficultyLevel === '' ||
        !in_array($questionCount, [3, 5, 10], true)
    ) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid interview session details.'
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

    $statement = $pdo->prepare(
        'INSERT INTO interview_session
        (
            user_id,
            target_role,
            industry,
            interview_type,
            difficulty_level,
            question_count,
            use_career_profile,
            session_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $statement->execute([
        $userId,
        $targetRole,
        $industry !== '' ? $industry : null,
        $interviewType,
        $difficultyLevel,
        $questionCount,
        $useCareerProfile,
        'in_progress'
    ]);

    $sessionId = (int) $pdo->lastInsertId();

    http_response_code(201);

    echo json_encode([
        'status' => 'success',
        'message' => 'Interview session created.',
        'session_id' => $sessionId
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to create interview session.'
    ]);
}
