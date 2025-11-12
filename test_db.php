<?php
// Include the db_connect.php from the api folder
$path = __DIR__ . '/api/db_connect.php';
if (!file_exists($path)) {
    die("❌ db_connect.php not found in folder: " . $path);
}
include $path;

// Check connection
if (!isset($conn)) {
    die("❌ Connection variable \$conn is not defined.");
}

if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
} else {
    echo "✅ Connected successfully!";
}
?>
