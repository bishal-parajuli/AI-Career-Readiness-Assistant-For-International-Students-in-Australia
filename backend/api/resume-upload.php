<?php
header('Access-Control-Allow-Origin: ' . 'http:' . chr(47) . chr(47) . 'localhost:8443');
header('Access-Control-Allow-Credentials: true');
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

if (!isset($_FILES['resume'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No resume file was provided.'
    ]);
    exit;
}

$file = $_FILES['resume'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'The resume file could not be uploaded.'
    ]);
    exit;
}
if ($file['size'] === 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'The resume file is empty. Please upload a file containing your resume.'
    ]);
    exit;
}
$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'The resume file must be 5 MB or smaller.'
    ]);
    exit;
}

$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($extension, ['pdf', 'docx'], true)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unsupported file type. Please upload a PDF or DOCX file.'
    ]);
    exit;
}
if ($extension === 'docx') {
    $zip = new ZipArchive();

    if ($zip->open($file['tmp_name']) !== true) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'The DOCX file could not be read.'
        ]);
        exit;
    }

    $documentXml = $zip->getFromName('word/document.xml');
    $zip->close();

    if ($documentXml === false) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'No readable document content was found in the DOCX file.'
        ]);
        exit;
    }

    $documentXml = str_replace(
        ['</w:p>', '</w:tr>', '<w:tab/>'],
        ["\n", "\n", "\t"],
        $documentXml
    );

    $resumeText = trim(
        html_entity_decode(
            strip_tags($documentXml),
            ENT_QUOTES | ENT_XML1,
            'UTF-8'
        )
    );

    if ($resumeText === '') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'No readable text was found in the DOCX file.'
        ]);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'file_name' => basename($file['name']),
        'resume_text' => $resumeText
    ]);
    exit;
}
if ($extension === 'pdf') {
    $signature = file_get_contents($file['tmp_name'], false, null, 0, 5);

    if ($signature !== '%PDF-') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'The uploaded file is not a valid PDF.'
        ]);
        exit;
    }

    $pdfExtractor = '/opt/homebrew/bin/pdftotext';

    if (!is_executable($pdfExtractor)) {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'PDF processing is temporarily unavailable.'
        ]);
        exit;
    }

    $outputFile = tempnam(sys_get_temp_dir(), 'resume_pdf_');

    if ($outputFile === false) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Could not prepare PDF extraction.'
        ]);
        exit;
    }

    try {
        $command = escapeshellarg($pdfExtractor)
            . ' -enc UTF-8 '
            . escapeshellarg($file['tmp_name'])
            . ' '
            . escapeshellarg($outputFile)
            . ' 2>/dev/null';

        exec($command, $unusedOutput, $exitCode);

        if ($exitCode !== 0) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'The PDF file could not be read.'
            ]);
            exit;
        }

        $resumeText = trim(file_get_contents($outputFile) ?: '');

        if ($resumeText === '') {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'No readable text was found. Scanned PDFs are not supported.'
            ]);
            exit;
        }

        echo json_encode([
            'status' => 'success',
            'file_name' => basename($file['name']),
            'resume_text' => $resumeText
        ]);
        exit;

    } finally {
        if (is_file($outputFile)) {
            unlink($outputFile);
        }
    }
}
