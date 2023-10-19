<?php
require_once "week_timer.php";
require_once "db_login.php";
require_once "check_session.php";
if ($_SERVER["REQUEST_METHOD"] === "POST" && $_SESSION["type"] === "admin") {    
    if (isset($_FILES["file"]["tmp_name"]) && !empty($_FILES["file"]["tmp_name"])) {
        $file = $_FILES["file"]["tmp_name"];
        $fileName = $_FILES["file"]["name"];
        $file_extension = pathinfo($fileName, PATHINFO_EXTENSION);

        if ($file_extension !== 'csv') {
            $_SESSION["message"] = "Invalid file format. Only .csv files are allowed.";
            header("Location: ../admin_utility.php");
            exit();
        }

        $contentLength = (int) $_SERVER['CONTENT_LENGTH'];
        $maxPostSizeBytes = 8 * 1024 * 1024; // 8 MB in bytes  
        
        if ($contentLength > $maxPostSizeBytes) {
            $_SESSION["message"] = "Warning: POST Content-Length exceeds the limit of 8 MB";
            header("Location: ../admin_utility.php");
            exit();
        }

        $skippedLines = array();
        $successfulEntries = 0;
        $configManager = new ConfigManager();
        $season = $configManager->getSeason();
        $week = $configManager->getWeek();
        $timerStatus = $configManager->stringTimerState();
        $resetTime = $configManager->getResetTime();

        //check that the current season and week are not 0
        if ($season === 0 || $week === 0 ) {
            $_SESSION["message"] = "The week/season needs to be set to a value greater than 0 before games can be created.";
            header("Location: ../admin_utility.php");
            exit();
        }

        if ($timerStatus === "unpaused" && time() < $resetTime) {
            $_SESSION["message"] = "The timer needs to be paused or negative before games can be created.";
            header("Location: ../admin_utility.php");
            exit();
        }

        $conn = connectToDatabase();
        
        $sql = "SELECT * FROM Weeks WHERE season_number = ? AND week_number = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $season, $week);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        if ($num_rows === 0) {
            $_SESSION["message"] = "The week/season needs to be set to a value greater than 0 before games can be created.";
            header("Location: ../admin_utility.php");
            exit();
        }
        $stmt->close();

        //remove previous games and player selections for current week
        $sql = "DELETE Games, PlayerSelections
        FROM Games
        LEFT JOIN PlayerSelections ON Games.game_id = PlayerSelections.game_id
        WHERE Games.week_number = ? AND Games.season_number = ?;
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $week, $season);
        $stmt->execute();  

        $teamIDs = [
            "Bills" => 4, "Rams" => 19, "Dolphins" => 20, "Patriots" => 22,
            "Eagles" => 26, "Lions" => 11, "Niners" => 28, "49ers" => 28,
            "Bears" => 6, "Cmdrs" => 33, "Jags" => 15, "Jaguars" => 15,
            "Panthers" => 5, "Browns" => 8, "Colts" => 14, "Texans" => 13,
            "Bengals" => 7, "Steelers" => 27, "Saints" => 23, "Falcons" => 2,
            "Ravens" => 3, "Jets" => 25, "Chargers" => 18, "Raiders" => 17,
            "Packers" => 12, "Vikings" => 21, "Chiefs" => 16, "Cardinals" => 1,
            "Titans" => 31, "Giants" => 24, "Bucs" => 30, "Cowboys" => 9,
            "Broncos" => 10, "Seahawks" => 29, "WFT" => 33, "Redskins" => 33, "Push" => 32
        ];

        $createGamesSql = "INSERT IGNORE INTO Games (season_number, week_number, favorite, spread, underdog) VALUES ";
        $createGamesValues = [];

        $csvFile = fopen($file, 'r');

        // set active sheet to process games
        if ($csvFile !== false) {
            $rowNumber = 1;
            $startRow = 4;
            while (($row = fgetcsv($csvFile)) !== false) {
                if ($rowNumber < $startRow) {
                    $rowNumber++; 
                    continue;  
                }

                $favorite = trim($row[2]);
                $spread = floatval(trim($row[3]));
                $underdog = trim($row[4]);
                
                // skip completely empty game rows
                if ($row[0] === "" || empty($favorite) || empty($underdog)) {
                    $rowNumber++;
                    continue;
                }

                if ($favorite !== "Bye" && $underdog !== "Bye" && $favorite !== "Omitted" && $underdog !== "Omitted") {
                    if (!isset($teamIDs[$favorite])) {
                        $skippedLines[] = "favorite: $favorite for row: $rowNumber (team does not exist)";
                        $rowNumber++;
                        continue;
                    } else if (!isset($teamIDs[$underdog])) {
                        $skippedLines[] = "underdog: $underdog for row: $rowNumber (team does not exist)";
                        $rowNumber++;
                        continue;
                    } else {
                        $favoriteID = $teamIDs[$favorite];
                        $underdogID = $teamIDs[$underdog];                       
                        $createGamesValues[] = "('$season', '$week', '$favoriteID', '$spread', '$underdogID')";  
                        $successfulEntries++;
                    } 
                }
                $rowNumber++; 
            }
            fclose($csvFile);
            
        } else {
            echo "Failed to open: $file";
        }

        $batchSize = 1000000;
        for ($i = 0; $i < count($createGamesValues); $i += $batchSize) {
            $batch = array_slice($createGamesValues, $i, $batchSize);
            $sql = $createGamesSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close(); 
        }
        
        if (empty($skippedLines) && $successfulEntries >= 1) {
            $_SESSION["message"] .= "All games from file created.";
        }
        
        else if (!empty($skippedLines) && $successfulEntries >= 1) {
            $_SESSION["message"] .= "Some games not created. \n Skipped lines:\n" . implode("\n", $skippedLines);
        } 

        else {
            $_SESSION["message"] .= "No games from file created. \n Skipped lines:\n" . implode("\n", $skippedLines);
        }

        header("Location: ../admin_utility.php");
        exit();
    } else {
        $_SESSION["message"] = "file input cannot be empty!";
        header("Location: ../admin_utility.php");
        exit();
    }
} else {
    // user has not posted any valid data
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>