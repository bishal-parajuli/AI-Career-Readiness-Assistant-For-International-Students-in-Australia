<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:8443");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once __DIR__ . "/../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$questionId = isset($data["question_id"])
    ? (int) $data["question_id"]
    : 0;

$responseText = trim($data["response_text"] ?? "");

if ($questionId <= 0 || $responseText === "") {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Question ID and response text are required."
    ]);
    exit;
}

try {
    // Confirm that the interview question exists.
    $questionStatement = $pdo->prepare(
        "SELECT question_id
         FROM interview_question
         WHERE question_id = ?
         LIMIT 1"
    );

    $questionStatement->execute([$questionId]);

    if (!$questionStatement->fetch()) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Interview question not found."
        ]);
        exit;
    }

    // Each interview question can have at most one response.
    $existingStatement = $pdo->prepare(
        "SELECT response_id
         FROM interview_response
         WHERE question_id = ?
         LIMIT 1"
    );

    $existingStatement->execute([$questionId]);

    if ($existingStatement->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "A response has already been submitted for this question."
        ]);
        exit;
    }

    $insertStatement = $pdo->prepare(
        "INSERT INTO interview_response
            (question_id, response_text)
         VALUES
            (?, ?)"
    );

    $insertStatement->execute([
        $questionId,
        $responseText
    ]);

    http_response_code(201);

    echo json_encode([
        "status" => "success",
        "message" => "Interview response stored.",
        "response_id" => (int) $pdo->lastInsertId(),
        "question_id" => $questionId
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Unable to store interview response."
    ]);
}