<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "tropical_match"; // ✅ change this to your real DB name

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}
?>
