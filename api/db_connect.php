<?php
$host = "localhost";
$user = "root";  // WAMP default
$pass = "";      // WAMP default has no password
$db   = "tropical_match";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>


