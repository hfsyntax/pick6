<?php
session_status() === PHP_SESSION_NONE ? session_start() : null;

if (isset($_SESSION['error'])) {
    $errorMessage = $_SESSION['error'];
    unset($_SESSION['error']);
}

else if (isset($_GET["error"])) {
    $errorMessage = $_GET['error'];
}

// Destroy the session
$_SESSION = array();
session_unset();
session_destroy();

// Redirect the user to the login page and pass the error message as a query parameter
if (isset($errorMessage)) {
    header("Location: ../login.php?error=" . $errorMessage);
    exit(); 
} else {
    header("Location: ../login.php");
    exit(); 
}
?>