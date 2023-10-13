<?php
require_once "db_login.php";
error_reporting(E_ALL);
ini_set('display_errors', '1');
session_status() === PHP_SESSION_NONE ? session_start() : null;

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
            header("Location: ../admin_utility.php");
            exit();
        }

        $file = $_FILES["file"]["tmp_name"];
        $file_name = $_FILES["file"]["name"];
        $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);

        if ($file_extension !== 'zip') {
            $_SESSION["message"] = "Invalid file format. Only .zip files are allowed.";
            header("Location: ../admin_utility.php");
            exit();
        }

        $zip = new ZipArchive();
        $orderedFiles = array();

        // Open the uploaded ZIP file
        if ($zip->open($file) === TRUE) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $file_name = $zip->getNameIndex($i);
                if (!preg_match("/^(Week)(\d+)_(Games|Picks)_([0-9]+)\.(csv)$/i", $file_name, $matches)) {
                    $_SESSION["message"] = "Error: Invalid file name found: " . $file_name . " File name must be Week#_games_SEASON#.csv or Week#_picks_SEASON#.csv";
                    header("Location: ../admin_utility.php");
                    exit();
                }
                
                $weekNumber = intval($matches[2]);
                $sheetType = $matches[3];
                $seasonNumber = intval($matches[4]);
    
                if (!isset($orderedFiles[$seasonNumber])) {
                    $orderedFiles[$seasonNumber] = array();
                }

                if (!isset($orderedFiles[$seasonNumber][$weekNumber])) {
                    $orderedFiles[$seasonNumber][$weekNumber] = array();
                }

                // insert and check for duplicates
                if (!isset($orderedFiles[$seasonNumber][$weekNumber][$sheetType])) {
                    $orderedFiles[$seasonNumber][$weekNumber][$sheetType] = $file_name;
                } else {
                    $_SESSION["message"] = "Error: Duplicate week $weekNumber found for season $seasonNumber file: $file_name!";
                    header("Location: ../admin_utility.php");
                    exit();
                }
                
                // extract files
                $full_path = __DIR__ . '/' . $file_name;
                if (!file_exists($full_path)) {
                    copy("zip://$file#$file_name", $full_path);
                }

            }
            $zip->close();
        } else {
            $_SESSION["message"] = "Error: Failed to open the ZIP file";
            header("Location: ../admin_utility.php");
            exit();
        }

        // sort by season
        ksort($orderedFiles);

        //sort by week in each season
        foreach ($orderedFiles as &$season) {
            ksort($season);
        }

        $conn = connectToDatabase();

        if ($conn->connect_error) {
            die("Database Connection failed: " . $conn->connect_error);
        }

        $createdUsers = array();
        
        $createTempUserSql = "INSERT INTO TempPlayerAuth (username, password, sha256) VALUES ";
        $createTempUserValues = [];
        $createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp) VALUES ";
        $createPlayerValues = [];
        echo "adding new users if they don't exist <br>";
        flush();
        foreach ($orderedFiles as $seasonNumber => $weeks) {
            foreach ($weeks as $weekNumber => $weekFile) {
                $picksFile = $weekFile['Picks'];
                $csvFile = fopen($picksFile, 'r');

                // set active sheet to process users
                if ($csvFile !== false) {
                    $rowNumber = 1;
                    $startRow = 2;
                    while (($row = fgetcsv($csvFile)) !== false) {
                        if ($rowNumber < $startRow) {
                            $rowNumber++; 
                            continue;  
                        }

                        $gp = $row[1];
                        $playerName = strtolower(preg_replace('/[^a-zA-Z0-9$]/', '', $row[2]));
                        $originalName = $row[2];
                        
                        // skip completely empty rows
                        if (empty($row[0])) {
                            $rowNumber++;
                            continue;
                        }

                        // log non-empty names that were skipped because of regex
                        if (empty($playerName)) {
                            echo "found empty row: $rowNumber for Week $weekNumber of Season $seasonNumber name: $originalName <br>";
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
                                "new" => false
                            ];
                            $createTempUserValues[] = "('$playerName', '$password_hash', '1')";
                        }

                        $rowNumber++; 
                    }
                    fclose($csvFile);
                    
                } else {
                    // Handle any error if the file couldn't be opened
                    echo "Failed to open: $picksFile";
                }
            }
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
            if ($createdUsers[$user]["new"]) {
                $gp = $createdUsers[$user]["gp"];
                $createPlayerValues[] = "('$authID', '$user', '$gp')";
            }    
        }
        $stmt->close();

        //empty out temp inserts after processing users
        $sql = "TRUNCATE TABLE TempPlayerAuth";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $stmt->close();

        // update game pointer 
        $sql = "SELECT MAX(game_id) FROM Games";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_row()[0];
        if ($row !== NULL) {
            $currentGameID = $row + 1;
        } else {
            $currentGameID = 1;
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
        $createSeasonsSql = "INSERT IGNORE INTO Seasons (season_number) VALUES ";
        $createSeasonsValues = [];
        $createWeeksSql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES ";
        $createWeeksValues = [];
        $createGamesSql = "INSERT IGNORE INTO Games (season_number, week_number, favorite, spread, underdog, winner, favorite_score, underdog_score) VALUES ";
        $createGamesValues = [];
        $createPicksSql = "INSERT IGNORE INTO PlayerSelections (player_id, game_id, selected_team_id) VALUES ";
        $createPicksValues = [];
        $createWinnerSql = "INSERT IGNORE INTO Winners (player_id, season_number, week_number) VALUES ";
        $createWinnerValues = [];
        $createLoserSql = "INSERT IGNORE INTO Losers (player_id, season_number, week_number) VALUES ";
        $createLoserValues = [];
        $createStatSql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number, rank, won, lost, played, win_percentage) VALUES ";
        $createStatValues = [];
        $createWeekStatSql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number, rank, won, lost, played, win_percentage) VALUES ";
        $createWeekStatValues = [];
        echo "<script>
            setInterval(function() {  
                window.scrollTo(0,document.body.scrollHeight)
            }, 10);
        </script>";
        flush();
        echo "Processing " . count($orderedFiles) . " Seasons <br>";
        flush();
        //start of foreach
        foreach ($orderedFiles as $seasonNumber => $weeks) {
            echo "Processing Season " . $seasonNumber . " with " . count($weeks)  ." Weeks<br>";
            flush();
            $createSeasonsValues[] = "('$seasonNumber')" ;
            foreach ($weeks as $weekNumber => $weekFile) {
                echo "Processing Week" . $weekNumber . "<br>";
                flush(); 
                $createWeeksValues[] = "('$weekNumber', '$seasonNumber')";
                $picksFile = $weekFile['Picks'];
                $gamesFile = $weekFile['Games'];
                $gamesArray = array();
                $csvFile = fopen($gamesFile, 'r');

                // set active sheet to process games
                if ($csvFile !== false) {
                    $rowNumber = 1;
                    $startRow = 4;
                    while (($row = fgetcsv($csvFile)) !== false) {
                        if ($rowNumber < $startRow) {
                            $rowNumber++; 
                            continue;  
                        }

                        $favoriteScore = floatval(trim($row[1]));
                        $favorite = trim($row[2]);
                        $spread = floatval(trim($row[3]));
                        $underdog = trim($row[4]);
                        $underdogScore = floatval(trim($row[5]));
                        $coveringTeam = trim($row[8]);
                        
                        // skip completely empty game rows
                        if ($row[0] === "" || empty($favorite) || empty($underdog)) {
                            $rowNumber++;
                            continue;
                        }

                        if ($favorite !== "Bye" && $underdog !== "Bye" && $favorite !== "Omitted" && $underdog !== "Omitted") {
                            if (!isset($teamIDs[$favorite])) {
                                echo "found non-existent favorite team for row: $rowNumber for Week $weekNumber of Season $seasonNumber <br>";
                                flush();
                                $rowNumber++;
                                continue;
                            } else if (!isset($teamIDs[$underdog])) {
                                echo "found non-existent underdog team for row: $rowNumber for Week $weekNumber of Season $seasonNumber <br>";
                                flush();
                                $rowNumber++;
                                continue;
                            } 
                            
                            $favoriteID = $teamIDs[$favorite];
                            $underdogID = $teamIDs[$underdog];
                            $gamesArray[$favorite] = array();
                            $gamesArray[$favorite]["team_id"] = $favoriteID;
                            $gamesArray[$underdog] = array();
                            $gamesArray[$underdog]["team_id"] = $underdogID;
                            $winnerID = 0;

                            if ($spread === "") {
                                if (!empty($coveringTeam)) {
                                    $winnerID = $teamIDs[$coveringTeam];
                                    echo "set winner for $rowNumber for Week $weekNumber of Season $seasonNumber to covering team since no spread <br>";
                                    flush();
                                } else {
                                    echo "found empty spread without a covering team for row: $rowNumber for Week $weekNumber of Season $seasonNumber <br>";
                                    flush();
                                    $rowNumber++;
                                    continue;
                                }                                
                            }

                            if ($favoriteScore === "" || $underdogScore === "") {
                                if (empty($coveringTeam) || $coveringTeam === "NL") {
                                    $gamesArray[$favorite]["removed"] = true;
                                    $gamesArray[$underdog]["removed"] = true;
                                    $rowNumber++;
                                    continue;
                                } else {
                                    echo "found empty favorite or underdog score with a covering team for row: $rowNumber for Week $weekNumber of Season $seasonNumber <br>";
                                    flush();
                                    echo "covering team is: $coveringTeam <br>";
                                    flush();
                                    $rowNumber++;
                                    continue;
                                }
                                
                            }
                        
                            if ($favoriteScore - $underdogScore > $spread) {
                                $winnerID = $favoriteID;
                            } else if ($favoriteScore < $underdogScore || $favoriteScore - $underdogScore < $spread) {
                                $winnerID = $underdogID;
                            } else if ($favoriteScore - $underdogScore === $spread) {
                                $winnerID = $teamIDs["Push"];
                            }

                            $gamesArray[$favorite]["game_id"] = $currentGameID;
                            $gamesArray[$underdog]["game_id"] = $currentGameID; 
                            $createGamesValues[] = "('$seasonNumber', '$weekNumber', '$favoriteID', '$spread', '$underdogID', '$winnerID', '$favoriteScore', '$underdogScore')";
                            $currentGameID++;
                        }
                        $rowNumber++; 
                    }
                    fclose($csvFile);
                    
                } else {
                    echo "Failed to open: $gamesFile";
                }
                
                // set active sheet to process picks
                $playerSelections = array(); //track duplicate playerselections
                $csvFile = fopen($picksFile, 'r');
                if ($csvFile !== false) {
                    $rowNumber = 1;
                    $startRow = 2;
                    while (($row = fgetcsv($csvFile)) !== false) {
                        if ($rowNumber < $startRow) {
                            $rowNumber++; 
                            continue;  
                        }

                        $rank = 0;
                        $playerName = strtolower(preg_replace('/[^a-zA-Z0-9$]/', '', $row[2]));
                        $won = intval(trim($row[3]));
                        $played = intval(trim($row[4]));
                        $win_percentage = floatval(trim($row[5]));
                        $pick1 = trim($row[6]);
                        $pick2 = trim($row[7]);
                        $pick3 = trim($row[8]);
                        $pick4 = trim($row[9]);
                        $pick5 = trim($row[10]);
                        $pick6 = trim($row[11]);
                        $weekWins = intval(trim($row[12]));
                        $weekLosses = intval(trim($row[13]));
                        
                        // skip completely empty player rows
                        if (empty($row[0])) {
                            $rowNumber++;
                            continue;
                        } 

                        if (empty($playerName)) {
                            echo "found empty player name at row $rowNumber in Week $weekNumber of Season $seasonNumber <br>";
                            $rowNumber++;
                            continue;
                        }

                        $lost = $played - $won;
                        $playerID = $createdUsers[$playerName]["auth_id"];
                        $createWeekStatValues[] = "('$playerID', '$seasonNumber', '$weekNumber', '$rank', '$won', '$lost', '$played', '$win_percentage')";
                        $picks = [$pick1, $pick2, $pick3, $pick4, $pick5, $pick6];
                        foreach ($picks as $pick) {
                            if (!empty($pick)) {
                                // correct cases where pick is not exact team on schedule
                                if ($pick === "Jags")
                                    $pick = "Jaguars";
                                else if ($pick === "Niners") {
                                    $pick = "49ers";
                                }
                                // ensure player picked a team on schedule and game not canceled
                                if (isset($gamesArray[$pick]) && !isset($gamesArray[$pick]["removed"])){
                                    $playerID = $createdUsers[$playerName]["auth_id"];
                                    $gameID = $gamesArray[$pick]["game_id"];
                                    $teamID = $gamesArray[$pick]["team_id"];
                                    // ensure player did not pick more than one team for the same game
                                    if (!isset($playerSelections[$playerID][$gameID])) {
                                        $playerSelections[$playerID][$gameID] = $teamID;
                                        $createPicksValues[] = "('$playerID', '$gameID', '$teamID')";
                                    }                                 
                                }
                            }
                        }
                        
                        if ($weekWins > 0 && $weekLosses === 0) {
                            $createWinnerValues[] = "('$playerID', '$seasonNumber', '$weekNumber')";
                        } else if ($weekWins === 0) {
                            $createLoserValues[] = "('$playerID', '$seasonNumber', '$weekNumber')";
                        }
                    
                        // set season stats if last week
                        if ($weekNumber === count($weeks) - 1) {
                            $playerID = $createdUsers[$playerName]["auth_id"];
                            $won += $weekWins;
                            $played += $weekWins + $weekLosses;
                            $lost = $played - $won;
                            $win_percentage = floatval($won / $played);
                            $createStatValues[] = "('$playerID', '$seasonNumber', '$rank', '$won', '$lost', '$played', '$win_percentage')";
                        }
                        
                        $rowNumber++; 
                    }
                    fclose($csvFile);
                    
                } else {
                    echo "Failed to open: $gamesFile";
                }
                
                unlink($picksFile);
                unlink($gamesFile);
            }
        }

        //start of batches
        echo "processing seasons <br>";
        flush();
        for ($i = 0; $i < count($createSeasonsValues); $i += $batchSize) {
            $batch = array_slice($createSeasonsValues, $i, $batchSize);
            $sql = $createSeasonsSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing weeks <br>";
        flush();
        for ($i = 0; $i < count($createWeeksValues); $i += $batchSize) {
            $batch = array_slice($createWeeksValues, $i, $batchSize);
            $sql = $createWeeksSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing games <br>";
        flush();
        for ($i = 0; $i < count($createGamesValues); $i += $batchSize) {
            $batch = array_slice($createGamesValues, $i, $batchSize);
            $sql = $createGamesSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
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
        echo "processing picks <br>";
        flush();
        for ($i = 0; $i < count($createPicksValues); $i += $batchSize) {
            $batch = array_slice($createPicksValues, $i, $batchSize);
            $sql = $createPicksSql . implode(',', $batch);;
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
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
        echo "processing winners<br>";
        flush();
        for ($i = 0; $i < count($createWinnerValues); $i += $batchSize) {
            $batch = array_slice($createWinnerValues, $i, $batchSize);
            $sql = $createWinnerSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing losers<br>";
        flush();
        for ($i = 0; $i < count($createLoserValues); $i += $batchSize) {
            $batch = array_slice($createLoserValues, $i, $batchSize);
            $sql = $createLoserSql . implode(',', $batch);
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $stmt->close();
        }
        echo "processing ranks<br>";
        flush();
        //compute rank per season
        foreach ($orderedFiles as $seasonNumber => $weeks) {
            $updateRankSql = "UPDATE PlayerSeasonStats p1
            JOIN (
                SELECT
                    stat_id,
                    win_percentage,
                    (
                        SELECT COUNT(DISTINCT win_percentage) + 1
                        FROM PlayerSeasonStats p2
                        WHERE p2.win_percentage > p1.win_percentage
                        AND p2.season_number = ?
                    ) AS new_rank
                FROM PlayerSeasonStats p1
                WHERE season_number = ?
            ) ranked_stats ON p1.stat_id = ranked_stats.stat_id
            SET p1.rank = ranked_stats.new_rank
            WHERE p1.season_number = ?;
            ";
            $stmt = $conn->prepare($updateRankSql);
            $stmt->bind_param("iii", $seasonNumber, $seasonNumber, $seasonNumber);  
            $stmt->execute();
            $stmt->close();
            
            // compute rank per week
            foreach ($weeks as $weekNumber => $weekFile) {
                $updateRankSql = "UPDATE PlayerWeekStats p1
                JOIN (
                    SELECT
                        stat_id,
                        win_percentage,
                        (
                            SELECT COUNT(DISTINCT win_percentage) + 1
                            FROM PlayerWeekStats p2
                            WHERE p2.win_percentage > p1.win_percentage
                            AND p2.season_number = ? AND p2.week_number = ?
                        ) AS new_rank
                    FROM PlayerWeekStats p1
                    WHERE season_number = ? AND week_number = ?
                ) ranked_stats ON p1.stat_id = ranked_stats.stat_id
                SET p1.rank = ranked_stats.new_rank
                WHERE p1.season_number = ? AND p1.week_number = ?;
                ";
                $stmt = $conn->prepare($updateRankSql);
                $stmt->bind_param("iiiiii", $seasonNumber, $weekNumber, $seasonNumber, $weekNumber, $seasonNumber, $weekNumber);  
                $stmt->execute();
                $stmt->close();  
            } 
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
        
        echo "<script>window.location.href = '../admin_utility.php'</script>";
    }
} else {
    // user has not posted any valid data
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>