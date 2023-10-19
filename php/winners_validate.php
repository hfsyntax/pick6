<?php
require_once "week_timer.php";
require_once "db_login.php";
require_once "check_session.php";
if ($_SERVER["REQUEST_METHOD"] === "POST" && $_SESSION["type"] === "admin") {
    if (isset($_FILES["file"]["tmp_name"]) && !empty($_FILES["file"]["tmp_name"])) {
        
        $contentLength = (int) $_SERVER['CONTENT_LENGTH'];
        $maxPostSizeBytes = 8 * 1024 * 1024; // 8 MB in bytes
        if ($contentLength > $maxPostSizeBytes) {
            $_SESSION["message"] = "Warning: POST Content-Length exceeds the limit of 8 MB";
            header("Location: ../admin_utility.php");
            exit();
        }
        
        $file = $_FILES["file"]["tmp_name"];
        $fileName = $_FILES["file"]["name"];
        $file_extension = pathinfo($fileName, PATHINFO_EXTENSION);
        
        if ($file_extension !== 'csv') {
            $_SESSION["message"] = "Invalid file format. Only .csv files are allowed.";
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
            $_SESSION["message"] = "The season/week needs to be set to a value greater than 0 before winners can be processed.";
            header("Location: ../admin_utility.php");
            exit();
        }
        
        if ($timerStatus === "unpaused" && time() < $resetTime) {
            $_SESSION["message"] = "The timer needs to be paused or finished before winners can be processed.";
            header("Location: ../admin_utility.php");
            exit();
        }

        $conn = connectToDatabase();

        //ensure there are games for week
        $sql = "SELECT COUNT(game_id) FROM Games AS game_count WHERE week_number = ? AND season_number = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $week, $season);
        $stmt->execute();
        $result = $stmt->get_result();
        $gameCount = intval($result->fetch_row()[0]);
        if ($gameCount === 0) {
            $_SESSION["message"] = "no games have been created for this week";
            header("Location: ../admin_utility.php");
            exit();
        }
        $stmt->close();

        //first empty out temp inserts
        $sql = "TRUNCATE TABLE TempGames";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $stmt->close();

        $createdGames = array();

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

        $createTempGamesSql = "INSERT IGNORE INTO TempGames (season_number, week_number, favorite, underdog, winner, favorite_score, underdog_score) VALUES ";
        $createTempValues = [];

        //here
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
                        $skippedLines[] = "favorite: $favorite for row: $rowNumber (team does not exist)";
                        $rowNumber++;
                        continue;
                    } else if (!isset($teamIDs[$underdog])) {
                        $skippedLines[] = "underdog: $underdog for row: $rowNumber (team does not exist)";
                        $rowNumber++;
                        continue;
                    } else if ($spread === "" || !is_numeric($spread)) {
                        $skippedLines[] = "spread for row: $rowNumber is either empty or not a number";
                        $rowNumber++;
                        continue;
                    } else if ($favoriteScore === "" || !is_numeric($favoriteScore)) {
                        $skippedLines[] = "favorite score for row: $rowNumber is either empty or not a number";
                        $rowNumber++;
                        continue;
                    } else if ($underdogScore === "" || !is_numeric($underdogScore)) {
                        $skippedLines[] = "underdog score for row: $rowNumber is either empty or not a number";
                        $rowNumber++;
                        continue;
                    } else {
                        if ($favoriteScore - $underdogScore > $spread) {
                            $winner = $favorite;
                        } else if ($favoriteScore < $underdogScore || $favoriteScore - $underdogScore < $spread) {
                            $winner = $underdog;
                        } else if ($favoriteScore - $underdogScore === $spread) {
                            $winner = "Push";
                        }
    
                        if (!isset($createdGames[$favorite])) {
                            $createdGames[$favorite] = [
                                "underdog" => $underdog,
                                "winner" => $winner
                            ];
                            $favoriteID = $teamIDs[$favorite];
                            $underdogID = $teamIDs[$underdog];
                            $winnerID = $teamIDs[$winner];
                            $createTempValues[] = "('$season', '$week', '$favoriteID', '$underdogID', '$winnerID', '$favoriteScore', '$underdogScore')";
                        }
                    } 
                }
                $rowNumber++; 
            }
            fclose($csvFile);
            
        } else {
            echo "Failed to open: $file";
        }

        if (count($createdGames) > 0) {
            $batchSize = 1000000;
            for ($i = 0; $i < count($createTempValues); $i += $batchSize) {
                $batch = array_slice($createTempValues, $i, $batchSize);
                $sql = $createTempGamesSql . implode(',', $batch);
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $stmt->close();
            }

            // Identify which games don't exist
            $sql = "SELECT tg.favorite, tg.underdog
            FROM TempGames tg
            LEFT JOIN Games g
            ON tg.season_number = g.season_number
            AND tg.week_number = g.week_number
            AND tg.favorite = g.favorite
            AND tg.underdog = g.underdog
            WHERE g.game_id IS NULL
            AND tg.season_number = ?
            AND tg.week_number = ?;
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $season, $week);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $favorite = $row["favorite"];
                $underdog = $row["underdog"];
                $skippedLines[] = "line $favorite and underdog $underdog (Game doesn't exist)";    
            }
            $stmt->close();

            // set winners and scores for all games that exist
            $sql = "UPDATE Games g
            JOIN TempGames tg
            ON g.season_number = tg.season_number
            AND g.week_number = tg.week_number
            AND g.favorite = tg.favorite
            AND g.underdog = tg.underdog
            SET g.winner = tg.winner,
            g.favorite_score = tg.favorite_score,
            g.underdog_score = tg.underdog_score
            WHERE g.winner IS NULL
            AND tg.winner IS NOT NULL
            AND g.season_number = ?
            AND g.week_number = ? 
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $season, $week);
            $stmt->execute();
            $stmt->close();

            //log successful game winner insertions $successfulEntries++;
            $sql = "SELECT g.week_number, g.season_number, g.favorite, g.underdog
            FROM Games g
            JOIN TempGames tg
            ON g.week_number = tg.week_number
            AND g.season_number = tg.season_number
            AND g.favorite = tg.favorite
            AND g.underdog = tg.underdog;
            ";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $successfulEntries++;
            }
            $stmt->close();

            if (empty($skippedLines)) {
                if ($successfulEntries > 0) {
                    $_SESSION["message"] = "All games winners from file created. \n";
                } else {
                    $_SESSION["message"] = "No games winners from file created. \n";
                }
            } else {
                if ($successfulEntries > 0) {
                    $_SESSION["message"] = "(need to reprocess) Some games winners not processed. \n Skipped lines:\n" . implode("\n", $skippedLines);
                    header("Location: ../admin_utility.php");
                    exit();
                } else {
                    $_SESSION["message"] = "(need to reprocess) No games winners from file processed. \n Skipped lines:\n" . implode("\n", $skippedLines);
                    header("Location: ../admin_utility.php");
                    exit();
                }
            }

            //insert new week
            $sql = "INSERT IGNORE INTO Weeks (season_number, week_number) VALUES (?, ?)";
            $weekNumber = $week + 1;
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $season, $weekNumber);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted week for next week: Week: " . $weekNumber . "\n";
            }
            $stmt->close();

            //insert playerweekstats entry for next week for players who have not made selections
            $sql = "INSERT IGNORE INTO PlayerWeekStats (player_id, gp, group_number, season_number, week_number, rank, won, lost, played, win_percentage)
            SELECT
                p.player_id,
                p.gp,
                p.group_number,
                ? AS season_number,
                ? AS week_number, -- next week
                COALESCE(pws.rank, 0) AS rank,
                COALESCE(pws.won, 0) AS won,
                COALESCE(pws.lost, 0) + ? AS lost,
                COALESCE(pws.played, 0) + ? AS played,
                COALESCE(pws.won, 0) / (COALESCE(pws.played, 0) + ?) AS win_percentage
            FROM Players p
            LEFT JOIN PlayerWeekStats pws ON p.player_id = pws.player_id AND pws.season_number = ? AND pws.week_number = ?
            WHERE p.player_id IN (
                SELECT pws.player_id
                FROM PlayerWeekStats pws
                WHERE pws.season_number = ? AND pws.week_number = ?
            )
            AND p.player_id NOT IN (
                SELECT ps.player_id
                FROM PlayerSelections ps
                JOIN Games g ON ps.game_id = g.game_id
                WHERE g.season_number = ? AND g.week_number = ?
            )";
            $stmt = $conn->prepare($sql);
            $lossesToAdd = 0;
            if ($gameCount >= 6) {
                $lossesToAdd = 6;
            } else {
                $lossesToAdd = $gameCount;
            }
            $stmt->bind_param("iiiiiiiiiii", $season, $weekNumber, $lossesToAdd, $lossesToAdd, $lossesToAdd, $season, $week, $season, $week, $season, $week);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Created new player week stats entries for players who didn't make selections for week $week \n";
            }
            $stmt->close();

            //insert playerweekstats entry for next week for players who have made selections
            $sql = "INSERT IGNORE INTO PlayerWeekStats (player_id, gp, group_number, season_number, week_number, rank, won, lost, played, win_percentage)
            SELECT
                pws.player_id,
                p.gp,
                p.group_number,
                ?, -- current season_number
                ?, -- next week_number
                pws.rank,
                COALESCE(pws.won, 0) + week_data.won,
                COALESCE(pws.lost, 0) + week_data.lost,
                COALESCE(pws.played, 0) + week_data.played,
                CASE WHEN (COALESCE(pws.played, 0) + week_data.played) > 0 THEN (COALESCE(pws.won, 0) + week_data.won) / (COALESCE(pws.played, 0) + week_data.played) ELSE 0 END
            FROM PlayerWeekStats pws
            LEFT JOIN (
                SELECT
                    ps.player_id,
                    SUM(CASE WHEN g.winner = ps.selected_team_id THEN 1 ELSE 0 END) AS won,
                    SUM(CASE WHEN g.winner != ps.selected_team_id THEN 1 ELSE 0 END) AS lost,
                    COUNT(*) AS played
                FROM PlayerSelections ps
                JOIN Games g ON ps.game_id = g.game_id
                WHERE g.season_number = ? -- current season_number
                    AND g.week_number = ? -- current week_number
                GROUP BY ps.player_id
            ) AS week_data ON pws.player_id = week_data.player_id
            JOIN Players p ON pws.player_id = p.player_id
            WHERE pws.season_number = ? -- current season_number
                AND pws.week_number = ?; -- current week_number            
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiiiii", $season, $weekNumber, $season, $week, $season, $week);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Created new player week stats entries for next week week $weekNumber who have made selections\n";
            }
            $stmt->close();

            //update ranks for next week weekstats
            $sql = "UPDATE PlayerWeekStats pws
            JOIN (
              SELECT
                p1.player_id,
                p1.season_number,
                p1.week_number,
                p1.won,
                p1.lost,
                p1.played,
                p1.win_percentage,
                (
                  SELECT COUNT(*) + 1
                  FROM PlayerWeekStats p2
                  WHERE p2.season_number = p1.season_number
                    AND p2.week_number = p1.week_number
                    AND p2.win_percentage > p1.win_percentage
                ) AS new_rank
              FROM PlayerWeekStats p1
              WHERE p1.season_number = ?
                AND p1.week_number = ?    
            ) AS new_stats ON pws.player_id = new_stats.player_id
            AND pws.season_number = new_stats.season_number
            AND pws.week_number = new_stats.week_number
            SET pws.rank = new_stats.new_rank;";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $season, $weekNumber);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Updated player ranks for next weeks stats week $weekNumber \n";
            }
            $stmt->close();

            //update playerseasonstats
            $sql = "UPDATE PlayerSeasonStats pss
            JOIN (
                SELECT
                    pws.player_id,
                    pws.season_number,
                    pws.won,
                    pws.lost,
                    pws.played,
                    pws.rank,
                    CASE WHEN pws.played > 0 THEN pws.won / pws.played ELSE 0 END AS win_percentage
                FROM PlayerWeekStats pws
                WHERE pws.season_number = ?
                    AND pws.week_number = ? -- next week_number
            ) AS week_data ON pss.player_id = week_data.player_id AND pss.season_number = week_data.season_number
            SET
                pss.won = week_data.won,
                pss.lost = week_data.lost,
                pss.played = week_data.played,
                pss.rank = week_data.rank,
                pss.win_percentage = week_data.win_percentage
            WHERE
                pss.season_number = ?;
            ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iii", $season, $weekNumber, $season);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Updated player season stats entries for season $season \n";     
            }
            $stmt->close();

            //insert winners
            $sql = "INSERT IGNORE INTO Winners (player_id, season_number, week_number)
            SELECT subquery.player_id, ?, ? 
            FROM (
                SELECT ps.player_id,
                       SUM(CASE WHEN g.winner IS NULL THEN 0
                                WHEN ps.selected_team_id = g.winner THEN 1
                                ELSE 0 END) AS games_won,
                       COUNT(*) AS games_played
                FROM PlayerSelections ps
                INNER JOIN Games g ON ps.game_id = g.game_id
                INNER JOIN Teams t ON g.winner = t.team_id
                WHERE g.season_number = ? AND g.week_number = ?
                GROUP BY ps.player_id
                HAVING (games_won = games_played AND games_played > 0)
            ) AS subquery;";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiii", $season, $week, $season, $week);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted winners for week $week\n";
            }
            $stmt->close();

            //insert losers who have made selections
            $sql = "INSERT IGNORE INTO Losers (player_id, season_number, week_number)
            SELECT subquery.player_id, ?, ? 
            FROM (
                SELECT ps.player_id,
                       SUM(CASE WHEN g.winner IS NULL THEN 0
                                WHEN ps.selected_team_id != g.winner THEN 1
                                ELSE 0 END) AS games_lost,
                       COUNT(*) AS games_played
                FROM PlayerSelections ps
                INNER JOIN Games g ON ps.game_id = g.game_id
                INNER JOIN Teams t ON g.winner = t.team_id
                WHERE g.season_number = ? AND g.week_number = ?
                GROUP BY ps.player_id
                HAVING (games_lost = games_played AND games_played > 0) 
            ) AS subquery;";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiii", $season, $week, $season, $week);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted losers for week $week\n";
            }
            $stmt->close();

            //insert into losers players who have not made selections
            $sql = "INSERT IGNORE INTO Losers (player_id, season_number, week_number)
            SELECT
                ps.player_id,
                ? AS season_number,
                ? AS week_number
            FROM PlayerSeasonStats ps
            WHERE ps.season_number = ? 
              AND ps.player_id NOT IN (
                SELECT DISTINCT ps2.player_id
                FROM PlayerSelections ps2
                INNER JOIN Games g ON ps2.game_id = g.game_id
                WHERE g.week_number = ? 
                  AND g.season_number = ?
            );";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiiii", $season, $week, $season, $week, $season);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted losers for week $week who didn't make selections\n";
            }
            $stmt->close();

            $configManager->setWeek($weekNumber);
            $sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $season, $weekNumber);
            $stmt->execute();
            $stmt->close();
            $_SESSION["message"] .= "Set the week from week $week to week $weekNumber\n";
            header("Location: ../admin_utility.php");
            exit();
        } else {
            $_SESSION["message"] .= "No games processed from file.";
            header("Location: ../admin_utility.php");
            exit();
        }
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
