<?php
// Set error reporting
require 'db_login.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

session_start();

if (isset($_POST["username"]) && isset($_POST["password"])) {
    $user = trim($_POST["username"]);
    $pass = $_POST["password"];

    // Validate input length
    if (strlen($user) > 32 || strlen($pass) > 128) {
        header("Location: ../login.php?error=*incorrect+username+or+password");
        header("Location: ../login.php");
        exit();
    }
    
    $conn = connectToDatabase();

    // Prepare the SQL statement with a parameterized query
    $sql = "SELECT * FROM `PlayerAuth` WHERE username=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if ($row["sha256"] === 1) {
            $user_entered_hash = hash("sha256", $pass);
            $isPasswordCorrect = hash_equals($user_entered_hash, $row["password"]);
        } else {
            $isPasswordCorrect = password_verify($pass, $row["password"]);
        }
        
        if ($isPasswordCorrect) {
            if ($row["is_active"] === 0) {
                header("Location: ../login.php?error=*account+has+been+deactivated");
            }
            session_regenerate_id(true);
            $_SESSION = array();
            $_SESSION["user"] = $row["username"];
            $_SESSION["type"] = $row["type"];
            $_SESSION["auth_id"] = $row["auth_id"];
            header("Location: ../teams.php");
        }
        else {
            // Log an error if password is incorrect
            header("Location: ../login.php?error=*incorrect+username+or+password");
            exit();
        }
    } else {
        // Log an error if user is not in database
        header("Location: ../login.php?error=*incorrect+username+or+password");
        exit();
    }
} else {
    // user has not posted any valid data
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>
