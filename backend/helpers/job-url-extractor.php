
<?php

function extractJobTextFromUrl(string $url): string
{
    $url = trim($url);

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        throw new RuntimeException('Please enter a valid job advertisement URL.');
    }

    $parts = parse_url($url);
    $scheme = strtolower($parts['scheme'] ?? '');
    $host = $parts['host'] ?? '';

    if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
        throw new RuntimeException('Only HTTP and HTTPS job links are supported.');
    }
// Reject custom ports and embedded URL credentials.
$port = $parts['port'] ?? null;
$expectedPort = $scheme === 'https' ? 443 : 80;

if ($port !== null && $port !== $expectedPort) {
    throw new RuntimeException(
        'Job advertisement URLs must use standard HTTP or HTTPS ports.'
    );
}

if (isset($parts['user']) || isset($parts['pass'])) {
    throw new RuntimeException(
        'Job advertisement URLs must not contain login credentials.'
    );
}
    // Reject IP addresses and hostnames that are not public DNS names.
    if (filter_var($host, FILTER_VALIDATE_IP) ||
        !str_contains($host, '.') ||
        str_ends_with(strtolower($host), '.local')) {
        throw new RuntimeException('Please use a public job advertisement website.');
    }

    // Resolve the hostname and require every returned address to be public.
    $records = dns_get_record($host, DNS_A + DNS_AAAA);
    $addresses = [];

    foreach ($records ?: [] as $record) {
        $ip = $record['ip'] ?? $record['ipv6'] ?? null;
        if ($ip === null ||
            !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            throw new RuntimeException('The job advertisement URL is not publicly accessible.');
        }
        $addresses[] = $ip;
    }

    if (!$addresses) {
        throw new RuntimeException('Unable to resolve the job advertisement website.');
    }

    $ch = curl_init($url);
    $html = '';
    $tooLarge = false;

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'CareerReadinessAssistant/1.0',
        CURLOPT_HTTPHEADER => ['Accept: text/html'],
        CURLOPT_RESOLVE => [
            $host . ':' . ($scheme === 'https' ? '443' : '80') . ':' . $addresses[0]
        ],
        CURLOPT_WRITEFUNCTION => function ($handle, $chunk) use (&$html, &$tooLarge) {
            if (strlen($html) + strlen($chunk) > 1024 * 1024) {
                $tooLarge = true;
                return 0;
            }
            $html .= $chunk;
            return strlen($chunk);
        },
    ]);

    $success = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: '';
    curl_close($ch);

    if ($tooLarge) {
        throw new RuntimeException('The job advertisement page is too large.');
    }

    if (!$success || $status !== 200 || !str_starts_with(strtolower($contentType), 'text/html')) {
        throw new RuntimeException(
            'Unable to retrieve this job advertisement. Please paste the job description instead.'
        );
    }

    $document = new DOMDocument();
    $previous = libxml_use_internal_errors(true);
    $loaded = $document->loadHTML($html, LIBXML_NONET);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if (!$loaded) {
        throw new RuntimeException('Unable to read the job advertisement page.');
    }

    $xpath = new DOMXPath($document);

    foreach ($xpath->query('//script|//style|//nav|//footer|//header|//noscript') as $node) {
        $node->parentNode?->removeChild($node);
    }

    $main = $xpath->query('//main|//article')?->item(0);
    $text = $main ? $main->textContent : $document->textContent;

    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text) ?? '';
    $text = trim($text);

    if (mb_strlen($text) < 100) {
        throw new RuntimeException(
            'Could not extract enough job information. Please paste the job description instead.'
        );
    }

    return mb_substr($text, 0, 30000);
}
