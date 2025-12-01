<?php
// api/get_user.php
require "db_connect.php";
header('Content-Type: application/json');

// Read token from POST (JSON or form) or GET
$token = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input) && !empty($input['token'])) {
        $token = trim($input['token']);
    } elseif (!empty($_POST['token'])) {
        $token = trim($_POST['token']);
    }
} elseif (!empty($_GET['token'])) {
    $token = trim($_GET['token']);
}

if ($token === '') {
    echo json_encode([
        'success' => false,
        'message' => 'No token provided'
    ]);
    exit;
}

$sql = "SELECT id, name, email, api_token_expires_at
        FROM users
        WHERE api_token = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'DB error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if (!$user = $result->fetch_assoc()) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid token'
    ]);
    exit;
}

// Optional: check expiry
if (!empty($user['api_token_expires_at'])) {
    $now = new DateTime();
    $exp = new DateTime($user['api_token_expires_at']);
    if ($now > $exp) {
        echo json_encode([
            'success' => false,
            'message' => 'Token expired'
        ]);
        exit;
    }
}

echo json_encode([
    'success' => true,
    'user' => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
    ]
]);
