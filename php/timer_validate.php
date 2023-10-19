<?php 
require_once "week_timer.php";
require_once "db_login.php";
require_once "check_session.php";
if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin" && isset($_POST["selectedOption"])) {
    if (isset($_POST['timerState']) && $_POST["selectedOption"] === "Toggle Timer") {
        $newState = $_POST['timerState'];
        $configManager = new ConfigManager();
        $configManager->setTimerState($newState);
        $_SESSION["message"] = "Successfully " . $configManager->stringTimerState() . " the timer";
        header("Location: ../admin_utility.php");
        exit();
    }
    
    else if (!empty($_POST['timerEdit']) && $_POST["selectedOption"] === "Edit Timer") {
        $newResetTime = $_POST['timerEdit'];
        $targetResetTime = strtotime($newResetTime);
        if ($targetResetTime === false) {
            $_SESSION["message"] = "Invalid time string provided for strtotime.";
        } else {
            $configManager = new ConfigManager();
            $configManager->setTargetResetTime($targetResetTime);
            $_SESSION["message"] = "Successfully changed the timers time to " . $configManager->stringResetTime();
            header("Location: ../admin_utility.php");
            exit();
        }
    }

    else if (isset($_POST['seasonEdit']) && isset($_POST["weekEdit"]) && $_POST["selectedOption"] === "Set Week/Season") {
        $targetSeason = $_POST['seasonEdit'];
        $targetWeek = $_POST["weekEdit"];
        $configManager = new ConfigManager();
        $conn = connectToDatabase();
        
        if ($conn->connect_error) {
            $_SESSION["message"] = "Error connecting to database";
            header("Location: ../admin_utility.php");
            exit();
         }

        // case 1 season input empty
        if (empty($targetSeason)) {
            if ($configManager->getSeason() <= 0) {
                $_SESSION["message"] = "The season environment variable must be greater than 0.";
                header("Location: ../admin_utility.php");
                exit();
            } else {
                $sql = "INSERT IGNORE INTO Seasons (season_number) VALUES (?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $configManager->getSeason());
                $stmt->execute();
                
                if ($stmt->affected_rows > 0) {
                    $_SESSION["message"] .= "Inserted Season Entry " . $configManager->getSeason() . " \n";
                }
            }
        } 
        // case 2 season input not empty
        else {
            if ($targetSeason <= 0) {
                $_SESSION["message"] = "The specified season must be greater than 0.";
                header("Location: ../admin_utility.php");
                exit();
            }
        
            $sql = "INSERT IGNORE INTO Seasons (season_number) VALUES (?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $targetSeason);
            $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted Season Entry " . $targetSeason . " \n";
            }

            $configManager->setSeason($targetSeason);
            $_SESSION["message"] .= "Set Season to " . $configManager->getSeason() . " \n";
        }

        // case 3 week input empty
        if (empty($targetWeek)) {
            if ($configManager->getWeek() <= 0) {
                $_SESSION["message"] = "The week environment variable must be greater than 0.";
                header("Location: ../admin_utility.php");
                exit();
            }

            $sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $configManager->getWeek(), $configManager->getSeason());
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted Week Entry " . $configManager->getWeek() . " for Season " .$configManager->getSeason() .  "\n";
            }
            
        } 
        // case 4 week input not empty
        else {
            if ($targetWeek <= 0) {
                $_SESSION["message"] = "The specified week must be greater than 0.";
                header("Location: ../admin_utility.php");
                exit();
            }
            
            $sql = "INSERT IGNORE INTO Weeks (week_number, season_number) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $targetWeek, $configManager->getSeason());
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                $_SESSION["message"] .= "Inserted Week Entry " . $targetWeek . " for Season " . $configManager->getSeason() .  "\n";
            }

            $configManager->setWeek($targetWeek);
            $_SESSION["message"] .= "Set Week to " . $configManager->getWeek() . " for Season " . $configManager->getSeason() . "\n";
        }

        $conn->close();
        if (!isset($_SESSION["message"])) {
            $_SESSION["message"] = "No Season/Week Changed \n";
            $_SESSION["message"] .= "Inputted Season: " . $targetSeason . "\n";
            $_SESSION["message"] .= "Inputted Week: " . $targetWeek . "\n";
            $_SESSION["message"] .= "Current Season: " . $configManager->getSeason() . "\n";
            $_SESSION["message"] .= "Current Week: " . $configManager->getWeek();
        }

        header("Location: ../admin_utility.php");
        exit();
    }
    else {
        $_SESSION["message"] = "Inputs cannot be empty!";
        header("Location: ../admin_utility.php");
        exit();
    }
} else {
    // user has not posted any valid data
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
}
?>
