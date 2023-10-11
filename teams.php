<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once "php/check_session.php";
require_once "php/week_timer.php";
require_once "php/db_login.php";
if (isset($_SESSION["message"])) {
    echo '<script>alert("' . str_replace("\n", "\\n", $_SESSION['message']) . '");</script>';
    unset($_SESSION['message']);
}
$configManager = new ConfigManager();
$season = $configManager->getSeason();
$week = $configManager->getWeek();
$timerStatus = $configManager->stringTimerState();
$conn = connectToDatabase();

// display games for current week
$sql = "SELECT G.game_id,
T1.team_id AS favorite_team_id,
T1.team_name AS favorite_team,
T2.team_id AS underdog_team_id,
T2.team_name AS underdog_team,
G.spread
FROM Games G
INNER JOIN Teams T1 ON G.favorite = T1.team_id
INNER JOIN Teams T2 ON G.underdog = T2.team_id
INNER JOIN Weeks W ON G.week_number = W.week_number AND G.season_number = W.season_number
WHERE W.week_number = ? AND W.season_number = ?
ORDER BY G.game_id ASC
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $week, $season);
$stmt->execute();
$result = $stmt->get_result();
$selectionCount = 0;

if ($result->num_rows > 0) {
    $gameID = $result->fetch_assoc()["game_id"]; //used as a reference to see if a user has already made selections
    $result->data_seek(0);
    $stmt->close();

    $sql = "SELECT COUNT(player_id) AS player_count FROM PlayerSelections WHERE game_id = ? AND player_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $gameID, $_SESSION["auth_id"]);
    $stmt->execute();
    $result2 = $stmt->get_result();
    $selectionCount = intval($result2->fetch_row()[0]);
    $stmt->close();
}
?>
<html>
    <head>
        <script src="js/timer.js"></script>
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                const timeUntilReset = <?php echo (new ConfigManager())->calculateTimeUntilResetInMilliseconds(); ?>;
                updateCountdown(timeUntilReset, <?php echo (new ConfigManager())->getTimerState(); ?>);
                handleCheckboxStorage(<?php echo $selectionCount; ?>, '<?php echo $_SESSION["user"]; ?>');
            });
        </script>
        <link rel="stylesheet" href="css/main.css">
    </head>
    <body class="skin-blue-black">
        <div class="wrapper">
        <?php include 'components/topbar.php'; ?>
            <?php include 'components/navbar.php'; ?>
            <!-- Content Wrapper. Contains page content -->
            <div class="content-wrapper">
                <!-- Content Header (Page header) -->
                <section class="content-header">
                    <h1>
                        Pick6 -
                        <small>Select Teams</small></br>
                        <small>Week <?php echo $week; ?> of Season <?php echo $season; ?></small></br>
						<small>Time Remaining: <span id="countdown"></span></small>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <form method="post" action="php/picks_validate.php">
                        <button type="submit" <?php if ($timerStatus === "paused") echo 'disabled'; ?>>Submit</button>
                        <table>
                            <tr>
                                <th>Game</th>
                                <th>Favorite</th>
                                <th>Spread</th>
                                <th>Underdog</th>
                            </tr>
                            <?php
                            $game = 0;
                            while ($row = $result->fetch_assoc()) : ?>
                            <tr>
                                <td><?php echo ++$game; ?></td>
                                <td><input type="checkbox" name="game_<?php echo $row['game_id']; ?>_favorite" value="<?php echo $row['favorite_team_id']; ?>"><?php echo $row["favorite_team"]?></td>
                                <td><?php echo $row["spread"]; ?></td>
                                <td><input type="checkbox" name="game_<?php echo $row['game_id']; ?>_underdog" value="<?php echo $row['underdog_team_id']; ?>"><?php echo $row["underdog_team"]?></td>
                            </tr>
                            <?php endwhile; ?>

                        </table>
                    </form>
                </section><!-- /.content -->
            </div><!-- /.content-wrapper -->
          <!-- Control Sidebar -->
          <?php include 'components/profile_hover.php'; ?>
          <?php include 'components/profile_settings.php'; ?>  
        </div>
        <script src="js/pagination.js"></script>
        <script src="js/sessionTimer.js"></script>
        <script src="js/savePicks.js"></script>
    </body>
</html>