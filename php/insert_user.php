<?php
require_once "db_login.php";
require_once "week_timer.php";
require_once "check_session.php";
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
        if (!empty($_POST["username"]) &&
            !empty($_POST["password"]) &&
            !empty($_POST["userType"]) &&
            !empty($_POST["userGp"]) && 
            !empty($_POST["userGpNumber"])) {
            $username = $_POST["username"];
            $username = trim($username);
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $username));
            $password = $_POST["password"];
            $userType = strtolower($_POST["userType"]);
            $userGp = strtoupper($_POST["userGp"]);
            $groupNumber = $_POST["userGpNumber"];

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

            $sql = "SELECT username FROM PlayerAuth WHERE username = ?";
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

            if (!is_numeric($groupNumber)) {
                $_SESSION["message"] = "group number must be a number";
                header("Location: ../admin_utility.php");
                exit();
            }

        
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT IGNORE INTO PlayerAuth (type, username, password) VALUES (?, ?, ?)";
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
            
            $sql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("issi", $authID, $username, $userGp, $groupNumber);
            $stmt->execute();
            $stmt->close();

            $sql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number, gp, group_number) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iisi", $authID, $season, $userGp, $groupNumber);
            $stmt->execute();
            $stmt->close();

            $sql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number, gp, group_number) VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiisi", $authID, $season, $week, $userGp, $groupNumber);
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
                $createTempUserSql = "INSERT INTO TempPlayerAuth (type, username, password, sha256) VALUES ";
                $createTempValues = [];
                $createPlayerSql = "INSERT IGNORE INTO Players (player_id, name, gp, group_number) VALUES ";
                $createPlayerValues = [];
                $createStatSql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number, gp, group_number) VALUES ";
                $createStatValues = [];
                $createWeekStatSql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number, gp, group_number) VALUES ";
                $createWeekStatValues = [];

                $skippedLines = array();
                $successfulEntries = array();
                $handle = fopen($file, "r");
                while (($line = fgets($handle)) !== false) {
                    $line = trim($line);
                    if (preg_match('/^[a-zA-Z0-9]+,[a-zA-Z0-9]+,[a-zA-Z0-9]+,(admin|user),[0-9]+$/', $line)) {
                        $userData = explode(",", $line);
                        $username = strtolower(trim($userData[0]));
                        $password = trim($userData[1]);

                        if(!preg_match('/^(?=.*[A-Z])(?=.*\d).{6,}$/', $password)) {
                            $skippedLines[] = $line . "(password must contain at least 6 characters, 1 uppercase letter and 1 number)";
                            continue;
                        }
                        
                        $password_hash = hash("sha256", $password);
                        $userGp = trim($userData[2]);
                        $userType = trim($userData[3]);
                        $groupNumber = trim($userData[4]);
                                                
                        if (!isset($createdUsers[$username])) {
                            $createdUsers[$username] = [
                                "username" => $username,
                                "password" => $password_hash,
                                "type" => $userType,
                                "gp" => $userGp,
                                "group_number" => $groupNumber,
                                "auth_id" => ""
                            ];

                            $createTempValues[] = "('$userType', '$username', '$password_hash', '1')";
                        }  
                    } else {
                        $skippedLines[] = $line . "(Invalid format)";
                    }
                }
                
                fclose($handle);

                echo var_dump($createdUsers);
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
                    }

                    $stmt->close();

                    // insert new players
                    $sql = "INSERT IGNORE INTO PlayerAuth (type, username, password, sha256)
                    SELECT ta.type, ta.username, ta.password, 1
                    FROM TempPlayerAuth ta
                    LEFT JOIN PlayerAuth pa ON ta.username = pa.username
                    WHERE pa.username IS NULL";
                    $stmt = $conn->prepare($sql);
                    $stmt->execute();
                    $stmt->close();

                    // set auth_id for all new users
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
                        $gp = $createdUsers[$user]["gp"];
                        $groupNumber = $createdUsers[$user]["group_number"];
                        $createPlayerValues[] = "('$authID', '$user', '$gp', '$groupNumber')";
                        $createStatValues[] = "('$authID', '$season', '$gp', '$groupNumber')";
                        $createWeekStatValues[] = "('$authID', '$season', '$week', '$gp', '$groupNumber')";
                        $successfulEntries[] = $user;
                    }
                    $stmt->close();

                    //empty out temp inserts after processing users
                    $sql = "TRUNCATE TABLE TempPlayerAuth";
                    $stmt = $conn->prepare($sql);
                    $stmt->execute();
                    $stmt->close();
                    
                    for ($i = 0; $i < count($createPlayerValues); $i += $batchSize) {
                        $batch = array_slice($createPlayerValues, $i, $batchSize);
                        $sql = $createPlayerSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }

                    for ($i = 0; $i < count($createStatValues); $i += $batchSize) {
                        $batch = array_slice($createStatValues, $i, $batchSize);
                        $sql = $createStatSql . implode(',', $batch);;
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

                if (empty($skippedLines)) {
                    $_SESSION["message"] = "All users from file created. \n";
                    header("Location: ../admin_utility.php");
                    exit();
                } else {
                    if ($successfulEntries > 0) {
                        $_SESSION["message"] = "Some users not created. \n Skipped lines:\n" . implode("\n", $skippedLines);
                        header("Location: ../admin_utility.php");
                        exit();
                    } else {
                        $_SESSION["message"] = "No users were created. \n Skipped lines:\n" . implode("\n", $skippedLines);
                        header("Location: ../admin_utility.php");
                        exit();
                    }
                }
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
