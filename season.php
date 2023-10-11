<?php
require_once "php/check_session.php";
require_once "php/week_timer.php";
require_once "php/db_login.php";
$configManager = new ConfigManager();
$season = $configManager->getSeason();
if (empty($_SERVER["QUERY_STRING"]) || !isset($_GET["season"])) {
    $newParams = array(
        "season" => $season
    );
    $newUrl = $_SERVER['PHP_SELF'] . '?' . http_build_query($newParams);
    header("Location: $newUrl");
    exit();
}

$order = isset($_GET["order"]) ? $_GET["order"] : "";
$sort = isset($_GET["sort"]) ? $_GET["sort"] : "";

$conn = connectToDatabase();

$sql = "SELECT p.name AS player_name,
ps.rank,
p.gp,
ps.won,
ps.played,
ps.win_percentage
FROM PlayerSeasonStats ps
JOIN Players p ON ps.player_id = p.player_id
WHERE ps.season_number = ?
GROUP BY p.name, ps.rank, p.gp, ps.won, ps.played, ps.win_percentage
ORDER BY
    CASE
        WHEN ? = 'asc' THEN ps.rank
    END ASC,
    CASE
        WHEN ? = 'desc' THEN ps.rank
    END DESC,
    CASE
        WHEN ? = 'gp' THEN p.gp
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'gp' THEN p.gp
    END DESC;
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("isssss", $_GET["season"], $order,$order,$sort,$order,$sort);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

$sql = "SELECT * FROM Seasons";
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
                    <h1 id="seasons_header">
                        Pick6 -
                        <small>Season <?php echo $season; ?> Stats</small></br>
                        <label style="font-size: medium;">Select Season</label>
                        <select id="dropdown">
                            <?php while ($row2 = $result2->fetch_assoc()) : ?>
                                <option value="Season <?php echo $row2["season_number"];?>">Season <?php echo $row2["season_number"]; ?></option>
                            <?php endwhile;?>
                        </select>
						<br><label id="asc"style="font-size: medium;">Ascending:</label>
                        <input type="checkbox" name="ascCheckbox" data-url="season" id="ascCheckbox">
                        <label id="desc"style="font-size: medium;">Descending:</label>
                        <input type="checkbox" name="descCheckbox" data-url="season" id="descCheckbox">
                        <label id="gpLabel"style="font-size: medium;">GP:</label>
                        <input type="checkbox" name="gpCheckbox" data-url="season" id="gpCheckbox">
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <table id="seasons_table">
                        <tr>
                            <th>#</th>
                            <th>GP</th>
                            <th>Player</th>
                            <th>Won</th>
                            <th>Played</th>
                            <th>%</th>
                        </tr>
                        <?php while ($row = $result->fetch_assoc()) : ?>
                        <tr>
                            <td><?php echo $row["rank"];?></td>
                            <td><?php echo $row["gp"];?></td>
                            <td>
                                <?php 
                                    $name = $row["player_name"];
                                    if (file_exists("profile_pictures/$name.png")) {
                                        echo "<img src='profile_pictures/$name.png' width='25' height='25'>$name"; 
                                    } else {
                                        echo "$name<br>";
                                    }
                                ?>
                            </td>
                            <td><?php echo $row["won"];?></td>
                            <td><?php echo $row["played"];?></td>
                            <td><?php echo $row["win_percentage"];?></td>
                        </tr>
                        <?php endwhile;?>
                    </table>
                </section><!-- /.content -->
            </div><!-- /.content-wrapper -->
          <!-- Control Sidebar -->
          <?php include 'components/profile_hover.php'; ?>
          <?php include 'components/profile_settings.php'; ?>              
        </div>
        <script src="js/savePicks.js"></script>
        <script src="js/pagination.js"></script>
        <script src="js/sessionTimer.js"></script>
    </body>
</html>