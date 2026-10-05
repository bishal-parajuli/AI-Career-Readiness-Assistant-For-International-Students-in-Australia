<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8443');
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

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $sessionId = (int) ($input['session_id'] ?? 0);
    $questions = $input['questions'] ?? [];

    if ($sessionId <= 0 || !is_array($questions) || count($questions) === 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid interview question data.'
        ]);
        exit;
    }

    $sessionStatement = $pdo->prepare(
        'SELECT session_id, question_count
         FROM interview_session
         WHERE session_id = ?'
    );
    $sessionStatement->execute([$sessionId]);

    $session = $sessionStatement->fetch();

    if (!$session) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Interview session not found.'
        ]);
        exit;
    }

    if (count($questions) !== (int) $session['question_count']) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Question count does not match the interview session.'
        ]);
        exit;
    }

    $pdo->beginTransaction();

    $insertStatement = $pdo->prepare(
        'INSERT INTO interview_question
        (
            session_id,
            question_type,
            question_text,
            guidance_text,
            sample_answer,
            question_order
        )
        VALUES (?, ?, ?, ?, ?, ?)'
    );

    $savedQuestions = [];

    foreach ($questions as $index => $question) {
        $questionType = trim($question['type'] ?? '');
        $questionText = trim($question['q'] ?? '');
        $guidanceText = trim($question['guidance'] ?? '');
        $sampleAnswer = trim($question['sampleAnswer'] ?? '');

        if ($questionType === '' || $questionText === '') {
            throw new RuntimeException('Invalid question data.');
        }

        $questionOrder = $index + 1;

        $insertStatement->execute([
            $sessionId,
            $questionType,
            $questionText,
            $guidanceText !== '' ? $guidanceText : null,
            $sampleAnswer !== '' ? $sampleAnswer : null,
            $questionOrder
        ]);

        $savedQuestions[] = [
            'question_id' => (int) $pdo->lastInsertId(),
            'question_order' => $questionOrder
        ];
    }

    $pdo->commit();

    http_response_code(201);

    echo json_encode([
        'status' => 'success',
        'message' => 'Interview questions stored.',
        'questions' => $savedQuestions
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to store interview questions.'
    ]);
}