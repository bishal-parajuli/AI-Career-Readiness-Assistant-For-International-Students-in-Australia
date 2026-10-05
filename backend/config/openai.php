<?php

/**
 * Shared OpenAI API helper.
 *
 * The API key is loaded from backend/.env by database.php.
 * Never expose the API key to the frontend.
 */
function callOpenAI(
    string $instructions,
    string $input,
    int $maxOutputTokens = 1200
): array {
    $apiKey = trim($_ENV['OPENAI_API_KEY'] ?? '');

    if ($apiKey === '' || $apiKey === 'your_openai_api_key_here') {
        throw new RuntimeException('AI_SERVICE_NOT_CONFIGURED');
    }

    $payload = [
        'model' => 'gpt-5-mini',
        'instructions' => $instructions,
        'input' => $input,
        'max_output_tokens' => $maxOutputTokens
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        ),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60
    ]);

    $responseBody = curl_exec($ch);

    if ($responseBody === false) {
        $curlError = curl_error($ch);
        curl_close($ch);

        error_log('OpenAI connection error: ' . $curlError);

        throw new RuntimeException('AI_SERVICE_UNAVAILABLE');
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    $response = json_decode($responseBody, true);

    if (
        $statusCode < 200 ||
        $statusCode >= 300 ||
        !is_array($response)
    ) {
        error_log(
            'OpenAI API request failed. HTTP status: ' . $statusCode
        );

        throw new RuntimeException('AI_SERVICE_UNAVAILABLE');
    }

    /*
     * Responses API output can contain multiple output items.
     * Find the first output_text content item instead of assuming
     * a fixed array position.
     */
    foreach ($response['output'] ?? [] as $outputItem) {
        foreach ($outputItem['content'] ?? [] as $contentItem) {
            if (
                ($contentItem['type'] ?? '') === 'output_text' &&
                isset($contentItem['text'])
            ) {
                return [
                    'text' => trim($contentItem['text']),
                    'response_id' => $response['id'] ?? null
                ];
            }
        }
    }

   error_log(
    'OpenAI response status: ' .
    ($response['status'] ?? 'unknown') .
    ' | model: ' .
    ($response['model'] ?? 'unknown') .
    ' | output types: ' .
    implode(
        ', ',
        array_map(
            fn($item) => $item['type'] ?? 'unknown',
            $response['output'] ?? []
        )
    ) .
    ' | incomplete reason: ' .
    ($response['incomplete_details']['reason'] ?? 'none')
);

throw new RuntimeException('AI_INVALID_RESPONSE'); 
}