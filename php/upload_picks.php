<?php
require_once "week_timer.php";
require_once "db_login.php";
require_once "check_session.php";

function random_password() {
    $str = '';
    $length = 12;
    $keyspace = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $max = mb_strlen($keyspace, '8bit') - 1;
    if ($max < 1) {
        throw new Exception('$keyspace must be at least two characters long');
    }
    for ($i = 0; $i < $length; ++$i) {
        $str .= $keyspace[random_int(0, $max)];
    }
    return $str;
}

if ($_SERVER["REQUEST_METHOD"] === "POST" && $_SESSION["type"] === "admin") {
    if (isset($_FILES["file"]["tmp_name"]) && !empty($_FILES["file"]["tmp_name"])) {
        ob_implicit_flush(true);
        ob_end_flush();
        $contentLength = (int) $_SERVER['CONTENT_LENGTH'];
        $maxPostSizeBytes = 8 * 1024 * 1024; // 8 MB in bytes  
        
        if ($contentLength > $maxPostSizeBytes) {
            $_SESSION["message"] = "Warning: POST Content-Length exceeds the limit of 8 MB";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            flush();
            exit();
        }

        $file = $_FILES["file"]["tmp_name"];
        $file_name = $_FILES["file"]["name"];
        $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);

        if ($file_extension !== 'csv') {
            $_SESSION["message"] = "Invalid file format. Only .csv files are allowed.";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
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
            $_SESSION["message"] = "The week/season needs to be set to a value greater than 0 before picks can be created.";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            exit();
        }

        if ($timerStatus === "paused" || time() > $resetTime) {
            $_SESSION["message"] = "The timer needs to be unpaused or non-negative before picks can be created.";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            exit();
        }

        $conn = connectToDatabase();

        if ($conn->connect_error) {
            die("Database Connection failed: " . $conn->connect_error);
        }

        $createdUsers = array();
        
        $createTempUserSql = "INSERT INTO TempPlayerAuth (username, password, sha256) VALUES ";
        $createTempUserValues = [];
        $createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES ";
        $createPlayerValues = [];
        $createStatSql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number, rank, won, lost, played, win_percentage, gp, group_number) VALUES ";
        $createStatValues = [];
        $createWeekStatSql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number, rank, won, lost, played, win_percentage, gp, group_number) VALUES ";
        $createWeekStatValues = [];
        echo "adding new users if they don't exist <br>";
        flush();
        $csvFile = fopen($file, 'r');

        // set active sheet to process users
        if ($csvFile !== false) {
            $rowNumber = 1;
            $startRow = 2;
            while (($row = fgetcsv($csvFile)) !== false) {
                if ($rowNumber < $startRow) {
                    $rowNumber++; 
                    continue;  
                }
                
                // skip completely empty rows
                if (empty($row[0])) {
                    $rowNumber++;
                    continue;
                }

                $groupNumber = trim(round($row[0]));
                $gp = $row[1];
                $playerName = strtolower(preg_replace('/[^a-zA-Z0-9$]/', '', $row[2]));
                $originalName = $row[2];

                // log non-empty names that were skipped because of regex
                if (empty($playerName)) {
                    $skippedLines[] = "found rejected player name on row $rowNumber for Week $weekNumber of Season $seasonNumber name: $originalName <br>";
                    $rowNumber++;
                    continue;
                }

                if (!isset($createdUsers[$playerName])) {
                    $user_password = random_password();
                    $password_hash = hash("sha256", $user_password);
                    $createdUsers[$playerName] = [
                        "auth_id" => "",
                        "username" => $playerName,
                        "password" => $user_password,
                        "gp" => $gp,
                        "group_number" => $groupNumber,
                        "new" => false
                    ];
                    $createTempUserValues[] = "('$playerName', '$password_hash', '1')";
                }

                $rowNumber++; 
            }

            fclose($csvFile);
            
        } else {
            // Handle any error if the file couldn't be opened
            $_SESSION["message"] = "Failed to open: $file";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            flush();
        }
        

        //empty out temp inserts before processing users
        $sql = "TRUNCATE TABLE TempPlayerAuth";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $stmt->close();
        
        $batchSize = 1000000;
        for ($i = 0; $i < count($createTempUserValues); $i += $batchSize) {
            $batch = array_slice($createTempUserValues, $i, $batchSize);
            $sql = $createTempUserSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }

        // mark new players
        $newUsers = array();
        $sql = "SELECT ta.username FROM TempPlayerAuth ta
        LEFT JOIN PlayerAuth pa ON ta.username = pa.username
        WHERE pa.username IS NULL";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $user = $row["username"];
            $createdUsers[$user]["new"] = true;
            $user_password = $createdUsers[$user]["password"];
            $newUsers[] = ["username" => $user, "password" => $user_password]; 
        }
        $stmt->close();
        
        // insert new players
        $sql = "INSERT IGNORE INTO PlayerAuth (type, username, password, sha256)
        SELECT 'user', ta.username, ta.password, 1
        FROM TempPlayerAuth ta
        LEFT JOIN PlayerAuth pa ON ta.username = pa.username
        WHERE pa.username IS NULL";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $stmt->close();

        // set auth_id for all players
        $sql = "SELECT username, auth_id, sha256
        FROM PlayerAuth
        WHERE (username) IN (
            SELECT username
            FROM TempPlayerAuth
        )";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $user = $row["username"];
            $authID = $row["auth_id"];
            $createdUsers[$user]["auth_id"] = $authID;
            $groupNumber = $createdUsers[$user]["group_number"];
            if ($createdUsers[$user]["new"]) {
                $gp = $createdUsers[$user]["gp"];
                $createPlayerValues[] = "('$authID', '$user', '$gp', '$groupNumber')";
                $createStatValues[] = "('$authID', '$season', '0', '0', '0', '0', '0', '$gp', '$groupNumber')";
                $createWeekStatValues[] = "('$authID', '$season', '$week', '0', '0', '0', '0', '0', '$gp', '$groupNumber')";
            }    
        }
        $stmt->close();

        //empty out temp inserts after processing users
        $sql = "TRUNCATE TABLE TempPlayerAuth";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $stmt->close();

        // get games for the week
        $gamesArray = array(); 
        $sql = "SELECT
        g.game_id,
        t1.team_id AS favorite,
        t2.team_id AS underdog
        FROM
        (SELECT * FROM Games WHERE week_number = ? AND season_number = ? ORDER BY game_id) AS g
        JOIN
        Teams t1 ON g.favorite = t1.team_id
        JOIN
        Teams t2 ON g.underdog = t2.team_id";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $week, $season);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $favoriteID = $row["favorite"];
                $underdogID = $row["underdog"];
                $gameID = $row["game_id"];
                // set existing games
                $gamesArray[$favoriteID] = $gameID;
                $gamesArray[$underdogID] = $gameID;
            } 
        } else {
            $_SESSION["message"] = "No games have been uploaded for Week $week of Season $season";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            flush();
            exit();
        }
        
        
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

        // Bulk insert queries
        $createPicksSql = "INSERT IGNORE INTO PlayerSelections (player_id, game_id, selected_team_id) VALUES ";
        $createPicksValues = [];
        
        echo "<script>
            setInterval(function() {  
                window.scrollTo(0,document.body.scrollHeight)
            }, 10);
        </script>";
        flush();
        //start of foreach
        
        echo "Processing Week $week <br>";
        flush();
        
        // set active sheet to process picks
        $playerSelections = array(); //track duplicate playerselections
        $csvFile = fopen($file, 'r');
        if ($csvFile !== false) {
            $rowNumber = 1;
            $startRow = 2;
            while (($row = fgetcsv($csvFile)) !== false) {
                if ($rowNumber < $startRow) {
                    $rowNumber++; 
                    continue;  
                }
                
                // skip completely empty player rows
                if (empty($row[0])) {
                    $rowNumber++;
                    continue;
                } 

                $playerName = strtolower(preg_replace('/[^a-zA-Z0-9$]/', '', $row[2]));
                $pick1 = trim($row[6]);
                $pick2 = trim($row[7]);
                $pick3 = trim($row[8]);
                $pick4 = trim($row[9]);
                $pick5 = trim($row[10]);
                $pick6 = trim($row[11]);

                if (isset($createdUsers[$playerName])) {
                    $picks = [$pick1, $pick2, $pick3, $pick4, $pick5, $pick6];
                    foreach ($picks as $pick) {
                        if (!empty($pick)) {
                            // correct cases where pick is not exact team on schedule
                            if ($pick === "Jags")
                                $pick = "Jaguars";
                            else if ($pick === "Niners") {
                                $pick = "49ers";
                            }
                            // ensure player picked a team on schedule
                            $teamID = $teamIDs[$pick];
                            if (isset($gamesArray[$teamID])){
                                $playerID = $createdUsers[$playerName]["auth_id"];
                                $gameID = $gamesArray[$teamID];
                                // ensure player did not pick more than one team for the same game
                                if (!isset($playerSelections[$playerID][$gameID])) {
                                    $playerSelections[$playerID][$gameID] = $teamID;
                                    $createPicksValues[] = "('$playerID', '$gameID', '$teamID')";
                                    $successfulEntries++;
                                } else {
                                    // found 2 picks for 1 game
                                    $skippedLines[] = "found duplicate pick $pick for the same game on row $rowNumber";
                                }                                 
                            } else {
                                // found pick where not on schedule
                                $skippedLines[] = "found pick $pick that is not on game schedule on row $rowNumber";
                            }
                        }
                    }
                }
                
                $rowNumber++; 
            }
            
            fclose($csvFile);
            
        } else {
            $_SESSION["message"] = "Failed to open: $file";
            echo "<script>window.location.href = '../admin_utility.php'</script>";
            flush();
        }

        //start of batches
        echo "processing new players if they exist <br>";
        flush();
        if (!empty($newUsers)) {
            for ($i = 0; $i < count($createPlayerValues); $i += $batchSize) {
                $batch = array_slice($createPlayerValues, $i, $batchSize);
                $sql = $createPlayerSql . implode(',', $batch);
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $stmt->close();
            }
        }
        echo "processing season stats <br>";
        flush();
        for ($i = 0; $i < count($createStatValues); $i += $batchSize) {
            $batch = array_slice($createStatValues, $i, $batchSize);
            $sql = $createStatSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing week stats <br>";
        flush();
        for ($i = 0; $i < count($createWeekStatValues); $i += $batchSize) {
            $batch = array_slice($createWeekStatValues, $i, $batchSize);
            $sql = $createWeekStatSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing picks <br>";
        flush();
        for ($i = 0; $i < count($createPicksValues); $i += $batchSize) {
            $batch = array_slice($createPicksValues, $i, $batchSize);
            $sql = $createPicksSql . implode(',', $batch);;
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
         
        if (!empty($newUsers)) {
            $csvFilePath = '../user_credentials.csv';
            // Open the CSV file for writing
            $file = fopen($csvFilePath, 'w');
            fputcsv($file, array("Username", "Password"));
            foreach ($newUsers as $user) {
                fputcsv($file, array($user["username"], $user["password"]));
            }
            fclose($file);
            $_SESSION["download"] = 1;
        } 
        
        if (empty($skippedLines)) {
            if ($successfulEntries > 0) {
                $_SESSION["message"] = "All picks from file created. \n";
            } else {
                $_SESSION["message"] = "All picks from file already created. \n";  
            }
        } else {
            if ($successfulEntries > 0) {
                $_SESSION["message"] = "Some picks not created. \n Skipped lines:\n" . implode("\n", $skippedLines);
            } else {
                $_SESSION["message"] = "No picks were created. \n Skipped lines:\n" . implode("\n", $skippedLines);
            }
        }

        echo "finished processing <br>";
        flush();

        echo "<script>window.location.href = '../admin_utility.php'</script>";
        flush();
        
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
