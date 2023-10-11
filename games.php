<?php
//require_once "php/check_session.php";
require_once "php/week_timer.php";
require_once "php/db_login.php";
$configManager = new ConfigManager();
$season = $configManager->getSeason();
$week = $configManager->getWeek();
if (empty($_SERVER["QUERY_STRING"]) || !isset($_GET["season"]) || !isset($_GET["week"])) {
    $newParams = array(
        "season" => $season,
        "week" => $week
    );
    $newUrl = $_SERVER['PHP_SELF'] . '?' . http_build_query($newParams);
    header("Location: $newUrl");
    exit();
}

$weekNumber = $_GET["week"];
$seasonNumber = $_GET["season"];


$conn = connectToDatabase();
$order = isset($_GET["order"]) ? $_GET["order"] : "";

// display games for the current week
$sql = "SELECT
(@counter := @counter + 1) AS game_number,
t1.team_name AS favorite,
g.spread,
t2.team_name AS underdog,
t3.team_name AS winner,
g.favorite_score,
g.underdog_score
FROM
(SELECT * FROM Games WHERE week_number = ? AND season_number = ? ORDER BY game_id) AS g
JOIN
Teams t1 ON g.favorite = t1.team_id
JOIN
Teams t2 ON g.underdog = t2.team_id
LEFT JOIN
Teams t3 ON g.winner = t3.team_id,
(SELECT @counter := 0) AS c";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $_GET["week"], $_GET["season"]);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

$sql = "SELECT * FROM Weeks";
$stmt = $conn->prepare($sql);
$stmt->execute();
$result2 = $stmt->get_result();
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
                        <small>Games</small></br>
                        <small>Week <?php echo $week; ?> of Season <?php echo $season; ?></small><br>
						<label style="font-size: medium;">Select Week</label>
                        <select id="dropdown">
                            <?php while ($row2 = $result2->fetch_assoc()) : ?>
                            <option value="Week <?php echo $row2["week_number"]; ?> of Season <?php echo $row2["season_number"]; ?>">Week <?php echo $row2["week_number"]; ?> of Season <?php echo $row2["season_number"]; ?></option>
                            <?php endwhile;?>
                        </select>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    
                    <table>
                        <tr>
                            <th>#</th>
                            <th>Pts</th>
                            <th>Favorite</th>
                            <th>Spread</th>
                            <th>Underdog</th>
                            <th>Pts</th>
                            <th>Covering Team</th>   
                        </tr>
                        <?php while ($row = $result->fetch_assoc()) : ?>
                        <tr>
                        <td><?php echo $row["game_number"];?></td>
                            <td><?php echo $row["favorite_score"];?></td>
                            <td><?php echo $row["favorite"];?></td>
                            <td><?php echo $row["spread"];?></td>
                            <td><?php echo $row["underdog"];?></td>
                            <td><?php echo $row["underdog_score"];?></td>
                            <td><?php echo $row["winner"];?></td>
                        </tr>
                        <?php endwhile;?>
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