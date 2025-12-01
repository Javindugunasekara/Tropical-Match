<?php
// api/get_game_stats.php
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

$token = isset($input['token']) ? trim($input['token']) : '';

if ($token === '') {
    echo json_encode([
        'success' => false,
        'message' => 'No token provided'
    ]);
    exit;
}

// Find user by token
$sql = "SELECT id, api_token_expires_at
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

$stmt->bind_param('s', $token);
$stmt->execute();
$result = $stmt->get_result();

if (!$user = $result->fetch_assoc()) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid token'
    ]);
    exit;
}

// Check token expiry
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

$userId = (int)$user['id'];

// Load stats row
$statsStmt = $conn->prepare("
    SELECT games_played, games_won, best_time, last_score, last_time
    FROM user_game_stats
    WHERE user_id = ?
");
$statsStmt->bind_param('i', $userId);
$statsStmt->execute();
$statsRes = $statsStmt->get_result();

if ($row = $statsRes->fetch_assoc()) {
    echo json_encode([
        'success' => true,
        'stats' => [
            'games_played' => (int)$row['games_played'],
            'games_won'    => (int)$row['games_won'],
            'best_time'    => is_null($row['best_time']) ? null : (int)$row['best_time'],
            'last_score'   => (int)$row['last_score'],
            'last_time'    => is_null($row['last_time']) ? null : (int)$row['last_time'],
        ]
    ]);
} else {
    // No stats yet for this user
    echo json_encode([
        'success' => true,
        'stats' => [
            'games_played' => 0,
            'games_won'    => 0,
            'best_time'    => null,
            'last_score'   => 0,
            'last_time'    => null,
        ]
    ]);
}
