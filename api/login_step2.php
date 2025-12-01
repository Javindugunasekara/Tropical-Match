<?php
// api/login_step2.php
header('Content-Type: application/json');
require 'db_connect.php';
session_start();

$input = json_decode(file_get_contents('php://input'), true);

$email = isset($input['email']) ? trim($input['email']) : '';
$otp   = isset($input['otp'])   ? trim($input['otp'])   : '';

if ($email === '' || $otp === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Email and OTP are required.'
    ]);
    exit;
}

// Load user with OTP
$sql = "SELECT id, name, email, otp_code, otp_expires_at
        FROM users
        WHERE email = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'DB error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if (!$user = $result->fetch_assoc()) {
    echo json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]);
    exit;
}

// Check OTP
if ($user['otp_code'] !== $otp) {
    echo json_encode([
        'success' => false,
        'message' => 'Incorrect OTP.'
    ]);
    exit;
}

// Check OTP expiry
if (!empty($user['otp_expires_at'])) {
    $now = new DateTime();
    $exp = new DateTime($user['otp_expires_at']);
    if ($now > $exp) {
        echo json_encode([
            'success' => false,
            'message' => 'OTP has expired. Please login again.'
        ]);
        exit;
    }
}

// ✅ OTP OK → generate login token
$token = bin2hex(random_bytes(32)); // 64-char token
$tokenExpiresAt = (new DateTime('+1 day'))->format('Y-m-d H:i:s');

$update = $conn->prepare(
    "UPDATE users
     SET api_token = ?, api_token_expires_at = ?, otp_code = NULL, otp_expires_at = NULL
     WHERE id = ?"
);
if (!$update) {
    echo json_encode([
        'success' => false,
        'message' => 'DB error: ' . $conn->error
    ]);
    exit;
}

$update->bind_param('ssi', $token, $tokenExpiresAt, $user['id']);
$update->execute();

// Optional PHP session
$_SESSION['user_id'] = $user['id'];

echo json_encode([
    'success' => true,
    'message' => 'OTP verified successfully.',
    'email'   => $user['email'],
    'name'    => $user['name'],
    'token'   => $token
]);
