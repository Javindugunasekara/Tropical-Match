<?php
// api/login.php
header("Content-Type: application/json");
require_once "../db_connect.php";
session_start();

// Read JSON input (frontend sends JSON)
$input = json_decode(file_get_contents("php://input"), true);

$email    = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Basic checks
if ($email === '' || $password === '') {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required"
    ]);
    exit;
}

// Look up user by email
$sql = "SELECT id, name, email, password
        FROM users
        WHERE email = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "DB error: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {

    if (password_verify($password, $user['password'])) {
        // ✅ Generate a random token (no JWT)
        $token = bin2hex(random_bytes(32)); // 64-char hex

        // Optional: set expiry (e.g. +1 day)
        $expiresAt = (new DateTime('+1 day'))->format('Y-m-d H:i:s');

        // Save token to DB
        $update = $conn->prepare(
            "UPDATE users
             SET api_token = ?, api_token_expires_at = ?
             WHERE id = ?"
        );
        if (!$update) {
            echo json_encode([
                "success" => false,
                "message" => "DB error: " . $conn->error
            ]);
            exit;
        }

        $update->bind_param("ssi", $token, $expiresAt, $user['id']);
        $update->execute();

        // Optional: PHP session
        $_SESSION['user_id'] = $user['id'];

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "email"   => $user['email'],
            "name"    => $user['name'],
            "token"   => $token
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Incorrect password"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "User not found"
    ]);
}

$stmt->close();
$conn->close();
