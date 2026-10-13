<?php

// Configure secure session handling before starting the session.
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

session_name('ai_career_session');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
