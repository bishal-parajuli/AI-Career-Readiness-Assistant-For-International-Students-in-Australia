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
    $jobAdId = isset($data['job_ad_id']) ? (int) $data['job_ad_id'] : 0;
    $resumeId = isset($data['resume_id']) ? (int) $data['resume_id'] : 0;

    if ($userId <= 0 || $jobAdId <= 0 || $resumeId <= 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'A valid user, job advertisement and resume are required.'
        ]);
        exit;
    }

    /*
     * Verify that the job advertisement belongs to the supplied user.
     */
    $jobStatement = $pdo->prepare(
        'SELECT job_ad_id, job_ad_text, job_title, company_name
         FROM job_advertisement
         WHERE job_ad_id = ? AND user_id = ?'
    );
    $jobStatement->execute([$jobAdId, $userId]);
    $jobAdvertisement = $jobStatement->fetch();

    if (!$jobAdvertisement) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Job advertisement not found for this user.'
        ]);
        exit;
    }

    /*
     * Verify that the resume also belongs to the supplied user.
     */
    $resumeStatement = $pdo->prepare(
        'SELECT resume_id, resume_text, target_role
         FROM resume
         WHERE resume_id = ? AND user_id = ?'
    );
    $resumeStatement->execute([$resumeId, $userId]);
    $resume = $resumeStatement->fetch();

    if (!$resume) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Resume not found for this user.'
        ]);
        exit;
    }

    /*
     * Responsible AI safeguard:
     * Do not generate or store fabricated job-match analysis when the
     * external AI service is not configured.
     */
    $openAiKey = trim($_ENV['OPENAI_API_KEY'] ?? '');

    if (
        $openAiKey === '' ||
        $openAiKey === 'your_openai_api_key_here'
    ) {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'code' => 'AI_SERVICE_NOT_CONFIGURED',
            'message' => 'Job match analysis is temporarily unavailable because the AI service is not configured.'
        ]);
        exit;
    }

    /*
     * Live OpenAI analysis will be implemented here once the external
     * service is configured. Only successfully validated AI output should
     * be inserted into job_match_analysis.
     */

    http_response_code(501);
    echo json_encode([
        'status' => 'error',
        'code' => 'AI_ANALYSIS_NOT_IMPLEMENTED',
        'message' => 'Live job match analysis has not yet been implemented.'
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to complete the job match analysis.'
    ]);
}
