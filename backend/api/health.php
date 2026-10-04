<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query('SELECT DATABASE() AS database_name');
    $result = $stmt->fetch();

    http_response_code(200);

    echo json_encode([
        'status' => 'success',
        'message' => 'Backend API is running',
        'database' => 'connected',
        'database_name' => $result['database_name']
    ]);
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'Backend service is unavailable'
    ]);
}
