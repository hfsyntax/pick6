<?php
require_once "check_session.php";
if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
    $csvFilePath = '../user_credentials.csv';
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="user_credentials.csv"');
    readfile($csvFilePath);
    $fileHandle = fopen($csvFilePath, 'w');
    fclose($fileHandle);
} else {
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>
