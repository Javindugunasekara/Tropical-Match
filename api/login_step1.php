<?php
// api/login_step1.php
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

$email    = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if ($email === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.'
    ]);
    exit;
}

$sql = "SELECT id, name, email, password FROM users WHERE email = ?";
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

// Check password
if (!password_verify($password, $user['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Incorrect password.'
    ]);
    exit;
}

// ✅ Password OK → generate 6-digit OTP
$otp = random_int(100000, 999999);

// OTP valid for 5 minutes
$expiresAt = (new DateTime('+5 minutes'))->format('Y-m-d H:i:s');

$update = $conn->prepare(
    "UPDATE users
     SET otp_code = ?, otp_expires_at = ?
     WHERE id = ?"
);
if (!$update) {
    echo json_encode([
        'success' => false,
        'message' => 'DB error: ' . $conn->error
    ]);
    exit;
}

$update->bind_param('ssi', $otp, $expiresAt, $user['id']);
$update->execute();

// TODO: send OTP via email in real app.
// For now we return it as debug_otp so you can test.

echo json_encode([
    'success'   => true,
    'message'   => 'Password correct. OTP sent.',
    'email'     => $user['email'],
    'debug_otp' => $otp  // ⚠️ remove later in production
]);
