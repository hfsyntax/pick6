<?php
function connectToDatabase() {
    // Load the configuration settings from the .env file
    $config = parse_ini_file("");

    $servername = $config['DB_SERVERNAME'];
    $username = $config['DB_USERNAME'];
    $password = $config['DB_PASSWORD'];
    $dbname = $config['DB_DBNAME'];

    try {
    $conn = new mysqli($servername, $username, $password, $dbname);
        return $conn;
    } catch (Exception $e) {
        header("Location: logoff.php?error=*database+connection+error.");
        exit();
    }
}
?>