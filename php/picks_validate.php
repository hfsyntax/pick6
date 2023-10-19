<?php 
require "db_login.php";
require "week_timer.php";
require_once "check_session.php";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_SESSION["user"])) {
    $configManager = new ConfigManager();
    $season = $configManager->getSeason();
    $week = $configManager->getWeek();
    $timerStatus = $configManager->stringTimerState();
    $endTime = $configManager->getResetTime();
    $conn = connectToDatabase();
    
    if ($season === 0 ) {
        $_SESSION["message"] = "The season needs to be set to a value greater than 0 before picks can be processed.";
        header("Location: ../teams.php");
        exit();
    } else if ($week === 0 ) {
        $_SESSION["message"] = "The week needs to be set to a value greater than 0 before picks can be processed.";
        header("Location: ../teams.php");
        exit();
    }
    
    if ($timerStatus === "paused" || time() >= $endTime) {
        $_SESSION["message"] = "Error: Can't select teams while the timer is paused/negative.";
        header("Location: ../teams.php");
        exit();
    }
    
    $sql = "SELECT COUNT(game_id) AS game_count FROM Games WHERE season_number = ? AND week_number = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $season, $week);
    $stmt->execute();
    $result = $stmt->get_result();
    $gameCount = intval($result->fetch_row()[0]);
    $stmt->close();
    
    if ($gameCount === 0) {
        $_SESSION["message"] = "Error: No games are available for Season " . $season . " Week " . $week;
        header("Location: ../teams.php");
        exit();
    }

    if ($gameCount < 6 && count($_POST) !== $gameCount) {
        $_SESSION["message"] = "Error: The number of picks you selected is not " . $gameCount . " picks!";
        header("Location: ../teams.php");
        exit();
    }

    if ($gameCount >= 6 && count($_POST) !== 6) {
        $_SESSION["message"] = "Error: The number of picks you selected is not 6 picks!";
        header("Location: ../teams.php");
        exit();
    }

    //get max game id for the week to ensure it is selected
    $sql = "SELECT MAX(game_id) AS max_game_id FROM Games WHERE season_number = ? AND week_number = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $season, $week);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $maxGameID = $row["max_game_id"];
    $stmt->close();

    $selections = array();

    foreach ($_POST as $key => $value) {
        if (preg_match('/^game_(\d+)_(favorite|underdog)$/', $key, $matches)) {
            $gameID = $matches[1];
            $selectedType = $matches[2];

            if (!isset($selections[$gameID])) {
                $selections[$gameID] = $value;
            } else {
                $_SESSION["message"] = "Error: Multiple teams were selected for one of your picks!";
                header("Location: ../teams.php");
                exit();
            }
        }
            
    }

    if (!isset($selections[$maxGameID])) {
        $_SESSION["message"] = "Error: No team was selected for the last game (max game id: $maxGameID)!";
        header("Location: ../teams.php");
        exit();
    }

    //clear previous selection made by player
    $sql = "DELETE ps
    FROM PlayerSelections ps
    JOIN Games g ON ps.game_id = g.game_id
    WHERE ps.player_id = ?
      AND g.week_number = ?
      AND g.season_number = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii", $_SESSION["auth_id"], $week, $season);
    $stmt->execute();

    //ensure player has stats entries created
    $sql = "INSERT IGNORE INTO PlayerSeasonStats (player_id, season_number) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $_SESSION["auth_id"], $season);
    $stmt->execute();
    $stmt->close();

    $sql = "INSERT IGNORE INTO PlayerWeekStats (player_id, season_number, week_number) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii",  $_SESSION["auth_id"], $season, $week);
    $stmt->execute();
    $stmt->close();

    foreach ($selections as $gameID => $teamID) {
        $sql = "INSERT INTO PlayerSelections (player_id, game_id, selected_team_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE selected_team_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiii", $_SESSION["auth_id"], $gameID, $teamID, $teamID);
        $stmt->execute();
    }

    $_SESSION["message"] = "Successfully set picks for Season " . $season . " Week " . $week;
    header("Location: ../teams.php");
    exit();
     
} else {
    // user has not posted any valid data
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>
