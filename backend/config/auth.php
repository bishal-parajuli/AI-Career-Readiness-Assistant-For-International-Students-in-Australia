<?php

require_once __DIR__ . '/session.php';

function requireAuth(): int
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json');

        echo json_encode([
            'status' => 'error',
            'message' => 'Authentication required'
        ]);

        exit;
    }

    return (int) $_SESSION['user_id'];
}
