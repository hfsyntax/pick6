<?php
require_once "db_login.php";
require_once "check_session.php";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_SESSION["user"])) {
        $conn = connectToDatabase();

        if (!empty($_POST["originalPassword"]) && !empty($_POST["newPassword"])) {
            $oldPassword = $_POST["originalPassword"];
            $newPassword = $_POST["newPassword"];
            
            if (strlen($oldPassword) > 255 || strlen($newPassword) > 255) {
                $_SESSION["message"] = "password must be 255 characters or less";
                header("Location: ../change_password.php");
                exit();
            }

            if ($newPassword === $oldPassword) {
                $_SESSION["message"] = "new password cannot be the same as the old password";
                header("Location: ../change_password.php");
                exit();
            }

            if(!preg_match('/^(?=.*[A-Z])(?=.*\d).{6,}$/', $newPassword)) {
                $_SESSION["message"] = "password must contain at least 6 characters, 1 uppercase letter and 1 number";
                header("Location: ../change_password.php");
                exit();
            }
            
            $sql = "SELECT * FROM `PlayerAuth` WHERE username=?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $_SESSION["user"]);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();    
                if ($row["sha256"]) {
                    $user_entered_hash = hash("sha256", $oldPassword);
                    $isPasswordCorrect = hash_equals($user_entered_hash, $row["password"]);
                } else {
                    $isPasswordCorrect = password_verify($oldPassword, $row["password"]);
                }
                if ($isPasswordCorrect) {
                    $hashed_password = password_hash($newPassword, PASSWORD_DEFAULT);
                    $sql2 = "UPDATE PlayerAuth SET password = ?, sha256 = 0 WHERE username = ?";
                    $stmt2 = $conn->prepare($sql2);
                    $stmt2->bind_param("ss", $hashed_password, $_SESSION["user"]);
                    $stmt2->execute();
                    $stmt2->close();
                    $_SESSION["message"] = "Successfully changed password";
                }
                else {
                    $_SESSION["message"] = "old password is incorrect";
                    header("Location: ../change_password.php");
                    exit();
                }
                $stmt->close();
                header("Location: ../profile.php");
                exit();
            } else {
                header('HTTP/1.1 401 Unauthorized');
                echo '401 Unauthorized - Access Denied';
                exit();
            }
            $stmt->close();
        } else {
            $_SESSION["message"] = "Not every required input was filled";
            header("Location: ../change_password.php");
            exit();
        }
    }  else {
        header('HTTP/1.1 401 Unauthorized');
        echo '401 Unauthorized - Access Denied';
        exit();
    }
?>
