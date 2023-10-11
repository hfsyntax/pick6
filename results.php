<?php
require_once "php/check_session.php";
require_once "php/week_timer.php";
require_once "php/db_login.php";
$configManager = new ConfigManager();
$season = $configManager->getSeason();
$week = $configManager->getWeek();
if (empty($_SERVER["QUERY_STRING"]) || !isset($_GET["season"])) {
    $newParams = array(
        "season" => $season
    );
    $newUrl = $_SERVER['PHP_SELF'] . '?' . http_build_query($newParams);
    header("Location: $newUrl");
    exit();
}

$conn = connectToDatabase();

$sql = "SELECT * FROM Seasons";
$stmt = $conn->prepare($sql);
$stmt->execute();
$seasons = $stmt->get_result();
$stmt->close();

//fetch winners and losers from their respective tables and populate them in table
$sql = "SELECT
w.week_number,
COALESCE(GROUP_CONCAT(DISTINCT pw.name ORDER BY w.week_number ASC SEPARATOR '<br>'), 'ROLL-OVER!!!') AS winner_names,
COALESCE(GROUP_CONCAT(DISTINCT pl.name ORDER BY w.week_number ASC SEPARATOR '<br>'), 'NONE!!!') AS loser_names
FROM
Weeks w
LEFT JOIN
Winners wn ON w.season_number = wn.season_number AND w.week_number = wn.week_number
LEFT JOIN
Losers ls ON w.season_number = ls.season_number AND w.week_number = ls.week_number
LEFT JOIN
Players pw ON wn.player_id = pw.player_id
LEFT JOIN
Players pl ON ls.player_id = pl.player_id
WHERE
(w.season_number = ? AND w.week_number != ?) OR (w.season_number = ? AND w.season_number != ?) 
GROUP BY
w.week_number
ORDER BY
w.week_number ASC;
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiii", $_GET["season"], $week, $_GET["season"], $season);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();
?>
<html>
    <head>
		
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
                        <small>Results</small></br>
                        <small>Week <?php echo $week; ?> of Season <?php echo $season; ?></small><br>
                        <label style="font-size: medium;">Select Week</label>
                        <select id="dropdown">
                            <?php while ($seasonsRow = $seasons->fetch_assoc()) : ?>
                                <option value="Season <?php echo $seasonsRow["season_number"]; ?>">Season <?php echo $seasonsRow["season_number"]; ?></option>
                            <?php endwhile;?>
                        </select>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <table class="center">
                        <tr>
                            <th>Week #</th>
                            <th>0'fers</th>
                            <th>Winners</th>
                        </tr>
                            <?php if (($season === $_GET["season"] && $week !== "1") || $season !== $_GET["season"]) : ?>
                                <?php while ($row = $result->fetch_assoc()) : ?>
                                    <tr>
                                        <td><?php echo $row["week_number"]; ?></td>
                                        <td>
                                            <?php
                                            $loserNames = explode('<br>', $row["loser_names"]);
                                            foreach ($loserNames as $loser) {
                                                if ($loser !== "NONE!!!" && file_exists("profile_pictures/$loser.png")) {
                                                    echo "<img src='profile_pictures/$loser.png' width: 25 height: 25>$loser<br>";
                                                } else {
                                                    echo "$loser<br>";
                                                } 
                                            }
                                            ?>
                                        </td>
                                        <td>
                                            <?php
                                            $winnerNames = explode('<br>', $row["winner_names"]);
                                            foreach ($winnerNames as $winner) {
                                                if ($winner !== "ROLL-OVER!!!" && file_exists("profile_pictures/$winner.png")) {
                                                    echo "<img src='profile_pictures/$winner.png' width: 25 height: 25>$winner<br>";
                                                } else {
                                                    echo "$winner<br>"; 
                                                }
                                            }
                                            ?>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>
                            <?php endif; ?>
                    </table>
                </section><!-- /.content -->
            </div><!-- /.content-wrapper -->
          <!-- Control Sidebar -->
          <?php include 'components/profile_hover.php'; ?>
          <?php include 'components/profile_settings.php'; ?>              
        </div>
        <script src="js/pagination.js"></script>
        <script src="js/sessionTimer.js"></script>
    </body>
</html>