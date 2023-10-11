<?php
require_once "db_login.php";
require_once "week_timer.php";
session_status() === PHP_SESSION_NONE ? session_start() : null;
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
        $conn = connectToDatabase();
        $configManager = new ConfigManager();
        $season = $configManager->getSeason();
        $week = $configManager->getWeek();

        $contentLength = (int) $_SERVER['CONTENT_LENGTH'];
        $maxPostSizeBytes = 8 * 1024 * 1024; // 8 MB in bytes  
        
        if ($contentLength > $maxPostSizeBytes) {
            $_SESSION["message"] = "Warning: POST Content-Length exceeds the limit of 8 MB";
            header("Location: ../admin_utility.php");
            exit();
        }

        if ($season === 0 || $week === 0 ) {
            $_SESSION["message"] = "The week/season needs to be set to a value greater than 0 before users can be created.";
            header("Location: ../admin_utility.php");
            exit();
        }

        $sql = "SELECT * FROM Weeks WHERE season_number = ? AND week_number = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $season, $week);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        if ($num_rows === 0) {
            $_SESSION["message"] = "The week/season needs to be set to a value greater than 0 before users can be created.";
            header("Location: ../admin_utility.php");
            exit();
        }
        $stmt->close();

        // Single user insertion
        if (!empty($_POST["username"]) && !empty($_POST["password"]) && !empty($_POST["userType"]) && !empty($_POST["userGp"])) {
            $username = $_POST["username"];
            $username = trim($username);
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $username));
            $password = $_POST["password"];
            $userType = strtolower($_POST["userType"]);
            $userGp = strtoupper($_POST["userGp"]);

            if (!preg_match('/^[a-zA-Z0-9]+$/', $username)) {
                $_SESSION["message"] = "Username can only contain letters and numbers";
                header("Location: ../admin_utility.php");
                exit();
            }

            if ($userType !== "user" && $userType !== "admin") {
                $_SESSION["message"] = "User type must be either an admin or a user";
                header("Location: ../admin_utility.php");
                exit();
            }

            $sql = "SELECT * FROM PlayerAuth WHERE username = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $_SESSION["message"] = "user already exists";
                header("Location: ../admin_utility.php");
                exit();
            }

            $stmt->close();

            if (strlen($password) > 255) {
                $_SESSION["message"] = "password must be 255 characters or less";
                header("Location: ../admin_utility.php");
                exit();
            }

            if(!preg_match('/^(?=.*[A-Z])(?=.*\d).{6,}$/', $password)) {
                $_SESSION["message"] = "password must contain at least 6 characters, 1 uppercase letter and 1 number";
                header("Location: ../admin_utility.php");
                exit();
            }

        
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO PlayerAuth (type, username, password) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sss", $userType, $username, $hashed_password);
            $stmt->execute();
            $stmt->close();

            $sql = "SELECT auth_id FROM PlayerAuth WHERE username = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();

            $row = $result->fetch_assoc();
            $authID = $row["auth_id"];
            $stmt->close();
            
            $sql = "INSERT INTO Players (player_id, name, gp) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iss", $authID, $username, $userGp);
            $stmt->execute();
            $stmt->close();

            $sql = "INSERT INTO PlayerSeasonStats (player_id, season_number) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $authID, $season);
            $stmt->execute();
            $stmt->close();

            $sql = "INSERT INTO PlayerWeekStats (player_id, season_number, week_number) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iii", $authID, $season, $week);
            $stmt->execute();
            $stmt->close();

            $_SESSION["message"] = "Successfully created user: " . $username;
            header("Location: ../admin_utility.php");
            exit();
        } else if (isset($_FILES["file"]["tmp_name"]) && !empty($_FILES["file"]["tmp_name"])) {
                $file = $_FILES["file"]["tmp_name"];
                $fileName = $_FILES["file"]["name"];
                $file_extension = pathinfo($fileName, PATHINFO_EXTENSION);
                
                if ($file_extension !== 'txt' && $file_extension !== "csv") {
                    $_SESSION["message"] = "Invalid file format. Only .txt and .csv files are allowed.";
                    header("Location: ../admin_utility.php");
                    exit();
                }
                
                //first empty out temp inserts
                $sql = "TRUNCATE TABLE TempPlayerAuth";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $stmt->close();

                $createdUsers = array();

                $sql = "SELECT MAX(auth_id) AS auth_id FROM PlayerAuth";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($row = $result->fetch_assoc()) {
                    $authID = $row["auth_id"];
                } else {
                    $authID = 0;
                }
                
                $currentAuthID = $authID + 1;
                $createTempUserSql = "INSERT INTO TempPlayerAuth (username) VALUES ";
                $createTempValues = [];
                $createUserSql = "INSERT IGNORE INTO PlayerAuth (type, username, password) VALUES ";
                $createUserValues = [];
                $createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp) VALUES ";
                $createPlayerValues = [];
                $createStatSql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number) VALUES ";
                $createStatValues = [];
                $createWeekStatSql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number) VALUES ";
                $createWeekStatValues = [];

                $skippedLines = array();
                $successfulEntries = array();
                $handle = fopen($file, "r");
                while (($line = fgets($handle)) !== false) {
                    $line = trim($line);
                    if (preg_match('/^[a-zA-Z0-9]+,[a-zA-Z0-9]+,[a-zA-Z0-9]+,(admin|user)$/', $line)) {
                        $userData = explode(",", $line);
                        $username = strtolower(trim($userData[0]));
                        $password = trim($userData[1]);

                        if(!preg_match('/^(?=.*[A-Z])(?=.*\d).{6,}$/', $password)) {
                            $skippedLines[] = $line . "(password must contain at least 6 characters, 1 uppercase letter and 1 number)";
                            continue;
                        }

                        $userGp = trim($userData[2]);
                        $user_type = trim($userData[3]);
                                                
                        if (!isset($createdUsers[$username])) {
                            $createdUsers[$username] = [
                                "username" => $username,
                                "password" => $password,
                                "type" => $user_type,
                                "gp" => $userGp
                            ];
                            $createTempValues[] = "('$username')";
                        }  
                    } else {
                        $skippedLines[] = $line . "(Invalid format)";
                    }
                }
                
                fclose($handle);

                if (count($createdUsers) > 0) {
                    $batchSize = 1000000;
                    for ($i = 0; $i < count($createTempValues); $i += $batchSize) {
                        $batch = array_slice($createTempValues, $i, $batchSize);
                        $sql = $createTempUserSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }

                    // Identify which users to be inserted which are duplicates
                    $sql = "SELECT ta.username
                    FROM TempPlayerAuth ta
                    LEFT JOIN PlayerAuth pa
                    ON ta.username = pa.username
                    WHERE pa.username IS NOT NULL";
                    $stmt = $conn->prepare($sql);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    while ($row = $result->fetch_assoc()) {
                        $existingUser = $row["username"];
                        $skippedLines[] = $existingUser . "(Username Already Exists)";
                        if (isset($createdUsers[$existingUser]))
                            unset($createdUsers[$existingUser]);
                    }

                    $stmt->close();

                    foreach ($createdUsers as $user) {
                        $type = $user["type"];
                        $username = $user["username"];
                        $password = $user["password"];
                        $password_hash = password_hash($password, PASSWORD_DEFAULT);
                        $gp = $user["gp"];
                        $createUserValues[] = "('$type', '$username', '$password_hash')";
                        $createPlayerValues[] = "('$currentAuthID', '$username', '$gp')";
                        $createStatValues[] = "('$currentAuthID', '$season')";
                        $createWeekStatValues[] = "('$currentAuthID', '$season', '$week')";
                        $currentAuthID++;
                        $successfulEntries[] = $username;
                    }
                    
                    for ($i = 0; $i < count($createUserValues); $i += $batchSize) {
                        $batch = array_slice($createUserValues, $i, $batchSize);
                        $sql = $createUserSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }
                    
                    for ($i = 0; $i < count($createPlayerValues); $i += $batchSize) {
                        $batch = array_slice($createPlayerValues, $i, $batchSize);
                        $sql = $createPlayerSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }

                    for ($i = 0; $i < count($createStatValues); $i += $batchSize) {
                        $batch = array_slice($createStatValues, $i, $batchSize);
                        $sql = $createStatSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }

                    for ($i = 0; $i < count($createWeekStatValues); $i += $batchSize) {
                        $batch = array_slice($createWeekStatValues, $i, $batchSize);
                        $sql = $createWeekStatSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }
                }

                if (empty($skippedLines) && count($successfulEntries) >= 1) {
                    $_SESSION["message"] = "All users from file created:\n" . implode("\n", $successfulEntries);
                }
                
                else if (!empty($skippedLines) && count($successfulEntries) >= 1) {
                    $_SESSION["message"] = "Users from file created: "  . implode("\n", $successfulEntries) . "\nSome users from file were not processed. Format is (user,password,gp,type) \n Skipped lines:\n" . implode("\n", $skippedLines);
                } 

                else {
                    $_SESSION["message"] = "No users from file processed. Format is (user,password,gp,type) per line \n Skipped lines:\n" . implode("\n", $skippedLines);
                }
                
                header("Location: ../admin_utility.php");
                exit();
        } else {
            $_SESSION["message"] = "Not every required input was filled";
            header("Location: ../admin_utility.php");
            exit();
        }
    }  else {
        // user has not posted any valid data
        header('HTTP/1.1 401 Unauthorized');
        echo '401 Unauthorized - Access Denied';
        exit();
    }
?>
