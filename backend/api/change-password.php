<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:8443");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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

$input = json_decode(file_get_contents("php://input"), true);

$userId = isset($input["user_id"]) ? (int) $input["user_id"] : 0;
$currentPassword = $input["current_password"] ?? "";
$newPassword = $input["new_password"] ?? "";

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "A valid user is required."
    ]);
    exit;
}

if ($currentPassword === "") {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Current password is required."
    ]);
    exit;
}

if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "New password must be at least 8 characters."
    ]);
    exit;
}

if ($currentPassword === $newPassword) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "New password must be different from the current password."
    ]);
    exit;
}

try {
    $statement = $pdo->prepare(
        "SELECT password_hash
         FROM user
         WHERE user_id = ?
         LIMIT 1"
    );

    $statement->execute([$userId]);
    $user = $statement->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "User not found."
        ]);
        exit;
    }

    if (!password_verify($currentPassword, $user["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Current password is incorrect."
        ]);
        exit;
    }

    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    if ($newPasswordHash === false) {
        throw new RuntimeException("Unable to hash new password.");
    }

    $updateStatement = $pdo->prepare(
        "UPDATE user
         SET password_hash = ?
         WHERE user_id = ?"
    );

    $updateStatement->execute([
        $newPasswordHash,
        $userId
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Password changed successfully."
    ]);

} catch (Throwable $exception) {
    error_log("Change password error: " . $exception->getMessage());

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Unable to change password."
    ]);
}
