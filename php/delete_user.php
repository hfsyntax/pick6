<?php
require "db_login.php";
require_once "check_session.php";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {

        $conn = connectToDatabase();

        $contentLength = (int) $_SERVER['CONTENT_LENGTH'];
        $maxPostSizeBytes = 8 * 1024 * 1024; // 8 MB in bytes  
        
        if ($contentLength > $maxPostSizeBytes) {
            $_SESSION["message"] = "Warning: POST Content-Length exceeds the limit of 8 MB";
            header("Location: ../admin_utility.php");
            exit();
        }

        if (!empty($_POST["username"])) {
            // Single user deletion
            $username = $_POST["username"];

            $sql = "SELECT auth_id FROM PlayerAuth WHERE username = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_row(); 
            $auth_id = $row[0];
            $stmt->close();
            
            if (empty($auth_id)) {
                $_SESSION["message"] = $username . " does not exist";
                header("Location: ../admin_utility.php");
                exit();
            } 

            // check if its a soft or hard delete
            if (isset($_POST["deleteCheckbox"])) {
                $sql = "DELETE FROM PlayerAuth WHERE auth_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $auth_id);
                $stmt->execute();
                $stmt->close();
                $_SESSION["message"] = "Successfully deleted user: " . $username;
                header("Location: ../admin_utility.php");
                exit();
            } else {
                // soft delete mark user as inactive
                $sql = "UPDATE PlayerAuth SET is_active = ? WHERE auth_id = ?";
                $stmt = $conn->prepare($sql);
                $active = 0;
                $stmt->bind_param("ii", $active, $auth_id);
                $stmt->execute();
                $stmt->close();

                $_SESSION["message"] = "Successfully set user: " . $username . " as inactive";
                header("Location: ../admin_utility.php");
                exit();
            }
               
                       
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

                $skippedLines = array();
                $successfulEntries = array();
                $createdUsers = array();
                $createTempUserSql = "INSERT INTO TempPlayerAuth (username, is_active) VALUES ";
                $createTempValues = [];
                $deleteUserSql = "DELETE FROM PlayerAuth WHERE username IN (";
                $deleteUserValues = [];
                $batchSize = 1000000;
                $fileContent = file_get_contents($file);
                $users = explode(',', $fileContent);
                
                foreach ($users as $user) {
                    $user = trim($user);
                    if (!empty($user) && !isset($createdUsers[$user])) {
                        $createdUsers[$user] = $user;
                        $createTempValues[] = "('$user', 'false')";       
                    }   
                }

                if (count($createdUsers) > 0) {
                    for ($i = 0; $i < count($createTempValues); $i += $batchSize) {
                        $batch = array_slice($createTempValues, $i, $batchSize);
                        $sql = $createTempUserSql . implode(',', $batch);
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                        $stmt->close();
                    }
    
                    // Identify which users to be altered dont exist
                    $sql = "SELECT ta.username
                    FROM TempPlayerAuth ta
                    LEFT JOIN PlayerAuth pa
                    ON ta.username = pa.username
                    WHERE pa.username IS NULL";
                    $stmt = $conn->prepare($sql);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    while ($row = $result->fetch_assoc()) {
                        $nonExistingUser = $row["username"];
                        $skippedLines[] = $nonExistingUser . " (User doesn't exist)";
                        if (isset($createdUsers[$nonExistingUser]))
                            unset($createdUsers[$nonExistingUser]);
                    }
                    $stmt->close();

                    foreach ($createdUsers as $user) {
                        $deleteUserValues[] = "('$user')";
                        $successfulEntries[] = $user;
                    }
                    
                    if (isset($_POST["deleteCheckbox"])) {
                        for ($i = 0; $i < count($deleteUserValues); $i += $batchSize) {
                            $batch = array_slice($deleteUserValues, $i, $batchSize);
                            $sql = $deleteUserSql . implode(',', $batch) . ")";
                            $stmt = $conn->prepare($sql);
                            $stmt->execute();
                            $stmt->close();
                        }
                    } else {
                        $sql = "UPDATE PlayerAuth AS pa
                        JOIN TempPlayerAuth AS ta ON pa.username = ta.username
                        SET pa.is_active = ta.is_active;";
                        $stmt = $conn->prepare($sql);
                        $stmt->execute();
                    }
                }

                $operation = "";
                if (isset($_POST["deleteCheckbox"])) {
                    $operation = "hard deleted";
                } else {
                    $operation = "soft deleted";
                }
                
                if (empty($skippedLines) && count($successfulEntries) >= 1) {
                    $_SESSION["message"] = "All users from file " . $operation . " : " . implode("\n", $successfulEntries);
                }
                
                else if (!empty($skippedLines) && count($successfulEntries) >= 1) {
                    $_SESSION["message"] = "Users from file " . $operation . " : "  . implode("\n", $successfulEntries) . "\nSome users from file were not processed. Format is (user,) \n Skipped lines:\n" . implode("\n", $skippedLines);
                } 

                else {
                    $_SESSION["message"] = "No users from file " . $operation . ". Format is (user,) \n Skipped lines:\n" . implode("\n", $skippedLines);
                }
                
                exit(); // used for debugging
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
