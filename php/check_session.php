<?php
// Start or resume the session
session_start();
$currentPage = basename($_SERVER["SCRIPT_FILENAME"], '.php');

function getRemainingTime() {
    $timeout = 15 * 60; // 15 minutes (adjust as needed)
    if (isset($_SESSION['last_activity'])) {
        $remainingTime = $timeout - (time() - $_SESSION['last_activity']);
        return max(0, $remainingTime);
    }
    return 0;
}

// Check if the user is logged in
if (!isset($_SESSION['user'])) {
    if ($currentPage !== "login") {
        $cur_dir = explode('\\', getcwd());
        $cur_dir = $cur_dir[count($cur_dir)-1];
        if ($cur_dir === "php") {
            header("Location: ../login.php");
        } else {
            header("Location: login.php");
        }
        exit();
    }
} else {
    // Check if the user is already logged in and trying to access the login page.
    if ($currentPage === "login") {
        header("Location: teams.php");
        exit();
    }

    // Check if it's an AJAX request
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        $remainingTime = getRemainingTime();
        if ($remainingTime <= 0) {
            http_response_code(401); 
            header("X-Redirect: php/logoff.php?error=*session+timeout");
            exit();
        } else {
            echo json_encode(array('remaining_time' => $remainingTime));
            exit();
        }
    }

    if (isset($_SESSION["last_activity"]) && getRemainingTime() <= 0) {
        header("location: php/logoff.php?error=*session+timeout");
        exit();
    } 
    
    // Regular page load, update the last activity time
    $_SESSION['last_activity'] = time();
    
}
?>
