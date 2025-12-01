<?php
// api/update_game_stats.php
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

$token     = isset($input['token']) ? trim($input['token']) : '';
$correct   = !empty($input['correct']);              // bool
$timeTaken = isset($input['timeTaken']) ? (int)$input['timeTaken'] : 0;
$score     = isset($input['score']) ? (int)$input['score'] : 0;

if ($token === '') {
    echo json_encode([
        'success' => false,
        'message' => 'No token provided'
    ]);
    exit;
}

// 1) Find user by token (and check expiry like get_user.php)
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

// Check token expiry if set
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

// 2) Read existing stats row
$check = $conn->prepare("
    SELECT id, games_played, games_won, best_time
    FROM user_game_stats
    WHERE user_id = ?
");
$check->bind_param('i', $userId);
$check->execute();
$statsResult = $check->get_result();

if ($row = $statsResult->fetch_assoc()) {
    // Update existing stats
    $gamesPlayed = (int)$row['games_played'] + 1;
    $gamesWon    = (int)$row['games_won'] + ($correct ? 1 : 0);

    if (is_null($row['best_time']) || $row['best_time'] == 0) {
        $bestTime = $timeTaken;
    } else {
        $bestTime = min((int)$row['best_time'], $timeTaken);
    }

    $update = $conn->prepare("
        UPDATE user_game_stats
        SET games_played = ?, games_won = ?, best_time = ?,
            last_score = ?, last_time = ?
        WHERE id = ?
    ");
    $id = (int)$row['id'];
    $update->bind_param(
        'iiiiii',
        $gamesPlayed,
        $gamesWon,
        $bestTime,
        $score,
        $timeTaken,
        $id
    );
    $update->execute();
} else {
    // Insert first stats row for this user
    $gamesPlayed = 1;
    $gamesWon    = $correct ? 1 : 0;
    $bestTime    = $timeTaken;

    $insert = $conn->prepare("
        INSERT INTO user_game_stats
            (user_id, games_played, games_won, best_time, last_score, last_time)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $insert->bind_param(
        'iiiiii',
        $userId,
        $gamesPlayed,
        $gamesWon,
        $bestTime,
        $score,
        $timeTaken
    );
    $insert->execute();
}

// 3) Return updated stats
echo json_encode([
    'success' => true,
    'stats' => [
        'games_played' => $gamesPlayed,
        'games_won'    => $gamesWon,
        'best_time'    => $bestTime,
        'last_score'   => $score,
        'last_time'    => $timeTaken,
    ]
]);
