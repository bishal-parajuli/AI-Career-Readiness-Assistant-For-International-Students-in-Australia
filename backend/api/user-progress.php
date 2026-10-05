<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:8443");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once __DIR__ . "/../config/database.php";

$userId = filter_input(INPUT_GET, "user_id", FILTER_VALIDATE_INT);

if (!$userId || $userId <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "A valid user_id is required."
    ]);
    exit;
}

try {
    // Verify that the user exists.
    $userStatement = $pdo->prepare(
        "SELECT user_id
         FROM user
         WHERE user_id = ?
         LIMIT 1"
    );
    $userStatement->execute([$userId]);

    if (!$userStatement->fetch()) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "User not found."
        ]);
        exit;
    }

    // Retrieve persisted resume submissions.
    $resumeStatement = $pdo->prepare(
        "SELECT
            resume_id,
            target_role,
            file_name,
            input_method,
            uploaded_at
         FROM resume
         WHERE user_id = ?
         ORDER BY uploaded_at DESC"
    );
    $resumeStatement->execute([$userId]);

    $resumeReviews = [];

    foreach ($resumeStatement->fetchAll() as $resume) {
        $resumeReviews[] = [
            "resume_id" => (int) $resume["resume_id"],
            "date" => $resume["uploaded_at"],
            "role" => $resume["target_role"],
            "file" => $resume["file_name"] ?: "Pasted resume",
            "input_method" => $resume["input_method"]
        ];
    }

    // Retrieve interview sessions and count persisted responses.
    $interviewStatement = $pdo->prepare(
        "SELECT
            s.session_id,
            s.target_role,
            s.question_count,
            s.started_at,
            s.completed_at,
            s.session_status,
            COUNT(r.response_id) AS questions_answered
         FROM interview_session s
         LEFT JOIN interview_question q
            ON q.session_id = s.session_id
         LEFT JOIN interview_response r
            ON r.question_id = q.question_id
         WHERE s.user_id = ?
         GROUP BY
            s.session_id,
            s.target_role,
            s.question_count,
            s.started_at,
            s.completed_at,
            s.session_status
         ORDER BY s.started_at DESC"
    );
    $interviewStatement->execute([$userId]);

    $interviewSessions = [];

    foreach ($interviewStatement->fetchAll() as $session) {
        $interviewSessions[] = [
            "session_id" => (int) $session["session_id"],
            "date" => $session["started_at"],
            "role" => $session["target_role"],
            "questionsAnswered" => (int) $session["questions_answered"],
            "total" => (int) $session["question_count"],
            "status" => $session["session_status"],
            "completed_at" => $session["completed_at"]
        ];
    }

    echo json_encode([
        "status" => "success",
        "resumeReviews" => $resumeReviews,
        "interviewSessions" => $interviewSessions
    ]);

} catch (Throwable $exception) {
    error_log("User progress error: " . $exception->getMessage());

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Unable to retrieve progress information."
    ]);
}