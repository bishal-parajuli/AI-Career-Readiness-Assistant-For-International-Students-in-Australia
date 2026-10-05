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

$sessionId = isset($data["session_id"])
    ? (int) $data["session_id"]
    : 0;
    $sessionStatus = $data["session_status"] ?? "completed";

$allowedStatuses = ["completed", "ended_early"];

if (!in_array($sessionStatus, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid interview session status."
    ]);
    exit;
}

if ($sessionId <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Valid session ID is required."
    ]);
    exit;
}

try {
    $checkStatement = $pdo->prepare(
        "SELECT session_id, session_status
         FROM interview_session
         WHERE session_id = ?
         LIMIT 1"
    );

    $checkStatement->execute([$sessionId]);
    $session = $checkStatement->fetch();

    if (!$session) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Interview session not found."
        ]);
        exit;
    }
$updateStatement = $pdo->prepare(
    "UPDATE interview_session
     SET session_status = ?,
         completed_at = CURRENT_TIMESTAMP
     WHERE session_id = ?"
);

$updateStatement->execute([
    $sessionStatus,
    $sessionId
]);
    
echo json_encode([
    "status" => "success",
    "message" => $sessionStatus === "ended_early"
        ? "Interview session ended early."
        : "Interview session completed.",
    "session_id" => $sessionId,
    "session_status" => $sessionStatus
]);
   
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Unable to complete interview session."
    ]);
}