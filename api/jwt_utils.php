<?php
// jwt_utils.php

// 🔐 Change this to a long random secret and KEEP IT SECRET
const JWT_SECRET = 'change_this_to_a_long_random_secret_string_1234567890';

// Base64 URL helpers
function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Create a HS256 JWT token
 *
 * @param array $payload  (e.g. ['sub' => user_id, 'email' => user_email])
 * @param int   $ttl      Time-to-live in seconds (default 4 hours)
 */
function create_jwt(array $payload, int $ttl = 14400): string
{
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];

    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + $ttl;

    $base64Header  = base64url_encode(json_encode($header));
    $base64Payload = base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = base64url_encode($signature);

    return "$base64Header.$base64Payload.$base64Signature";
}

/**
 * Validate a JWT token and return payload array or null
 */
function validate_jwt(string $jwt): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $expectedSignature = base64url_encode(
        hash_hmac('sha256', "$headerB64.$payloadB64", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSignature, $signatureB64)) {
        return null; // invalid signature
    }

    $payloadJson = base64url_decode($payloadB64);
    $payload = json_decode($payloadJson, true);

    if (!is_array($payload)) {
        return null;
    }

    if (isset($payload['exp']) && time() >= $payload['exp']) {
        return null; // expired
    }

    return $payload;
}
