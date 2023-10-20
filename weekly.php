<?php
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
$sort = isset($_GET["sort"]) ? $_GET["sort"] : "";
$sort2 = isset($_GET["sort2"]) ? $_GET["sort2"] : "";

$sql = "SELECT DISTINCT
subquery.stat_id,
subquery.name,
subquery.gp,
subquery.group_number,
subquery.player_id,
subquery.season_number,
subquery.week_number,
subquery.rank,
subquery.won,
subquery.lost,
subquery.played,
subquery.win_percentage,

CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 1 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 1), ', ', -1)
    ELSE NULL
END AS pick1,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 2 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 2), ', ', -1)
    ELSE NULL
END AS pick2,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 3 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 3), ', ', -1)
    ELSE NULL
END AS pick3,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 4 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 4), ', ', -1)
    ELSE NULL
END AS pick4,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 >= 5 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 5), ', ', -1)
    ELSE NULL
END AS pick5,
CASE
    WHEN LENGTH(subquery.selected_teams) - LENGTH(REPLACE(subquery.selected_teams, ',', '')) + 1 = 6 THEN 
    SUBSTRING_INDEX(SUBSTRING_INDEX(subquery.selected_teams, ', ', 6), ', ', -1)
    ELSE NULL
END AS pick6
FROM (
SELECT
    pw.stat_id,
    p.name,
    pw.gp,
    pw.group_number,
    pw.player_id,
    pw.season_number,
    pw.week_number,
    pw.rank,
    pw.won,
    pw.lost,
    pw.played,
    pw.win_percentage,
    (
        SELECT GROUP_CONCAT(t.team_name ORDER BY ps.selection_id SEPARATOR ', ')
        FROM PlayerSelections AS ps
        INNER JOIN Games AS g ON ps.game_id = g.game_id
        INNER JOIN Teams AS t ON ps.selected_team_id = t.team_id
        WHERE ps.player_id = pw.player_id
            AND g.season_number = pw.season_number
            AND g.week_number = pw.week_number
    ) AS selected_teams
FROM
    PlayerWeekStats pw
INNER JOIN
    Players p ON pw.player_id = p.player_id
WHERE
    pw.season_number = ? 
    AND pw.week_number = ? 
) AS subquery
INNER JOIN PlayerSelections AS ps ON subquery.player_id = ps.player_id
INNER JOIN Games AS g ON ps.game_id = g.game_id
WHERE g.season_number = ? 
AND g.week_number = ?
ORDER BY
    CASE
        WHEN ? = 'asc' THEN subquery.rank
    END ASC,
    CASE
        WHEN ? = 'desc' THEN subquery.rank
    END DESC,
    CASE
        WHEN ? = 'gp' THEN subquery.gp
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'gp' THEN subquery.gp
    END DESC,
    CASE
        WHEN ? = 'group_number' THEN subquery.group_number
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'group_number' THEN subquery.group_number
    END DESC,
    CASE
        WHEN ? = 'gp' THEN subquery.gp
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'gp' THEN subquery.gp
    END DESC,
    CASE
        WHEN ? = 'group_number' THEN subquery.group_number
    END ASC,
    CASE
        WHEN ? = 'desc' AND ? = 'group_number' THEN subquery.group_number
    END DESC;
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiiissssssssssssss", $_GET["season"], $_GET["week"], $_GET["season"], $_GET["week"], $order,$order,$sort,$order,$sort,$sort,$order,$sort,$sort2,$order,$sort2,$sort2,$order,$sort2);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

$sql = "SELECT * FROM Weeks";
$stmt = $conn->prepare($sql);
$stmt->execute();
$result2 = $stmt->get_result();
$stmt->close();

$sql = "SELECT COUNT(game_id) FROM Games AS game_count WHERE week_number = ? AND season_number = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $_GET["week"], $_GET["season"]);
$stmt->execute();
$result3 = $stmt->get_result();
$gameCount = intval($result3->fetch_row()[0]);
$stmt->close();

// display only 6 picks per week
if ($gameCount >= 6) 
    $gameCount = 6;
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
                    <h1 id="weekly_header">
                        Pick6 -
                        <small>All Picks</small></br>
                        <small>Week <?php echo $week; ?> of Season <?php echo $season; ?></small><br>
						<label style="font-size: medium;">Select Week</label>
                        <select id="dropdown">
                            <?php while ($row2 = $result2->fetch_assoc()) : ?>
                            <option value="Week <?php echo $row2["week_number"]; ?> of Season <?php echo $row2["season_number"]; ?>">Week <?php echo $row2["week_number"]; ?> of Season <?php echo $row2["season_number"]; ?></option>
                            <?php endwhile;?>
                        </select>
                        <br><label id="asc"style="font-size: medium;">Ascending:</label>
                        <input type="checkbox" name="ascCheckbox" data-url="weekly" id="ascCheckbox">
                        <label id="desc"style="font-size: medium;">Descending:</label>
                        <input type="checkbox" name="descCheckbox" data-url="weekly" id="descCheckbox">
                        <label id="gpLabel"style="font-size: medium;">GP:</label>
                        <input type="checkbox" name="gpCheckbox" data-url="weekly" id="gpCheckbox">
                        <label id="groupLabel"style="font-size: medium;">Group Number</label>
                        <input type="checkbox" name="groupCheckbox" data-url="season" id="groupCheckbox">
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    
                    <table id="weeks_table">
                        <tr>
                            <th>Rank</th>
                            <th>#</th>
                            <th>GP</th>
                            <th>Player</th>
                            <th>Won</th>
                            <th>Played</th>
                            <th>%</th>
                            <!-- for loop for how many picks -->
                            <?php for ($i = 1; $i <= $gameCount; $i++) :  ?>
                            <th>Pick <?php echo $i;?></th>
                            <?php endfor;?>
                        </tr>
                        <?php while ($row = $result->fetch_assoc()) : ?>
                        <tr>
                            <td><?php echo $row["rank"];?></td>
                            <td><?php echo $row["group_number"];?></td>
                            <td><?php echo $row["gp"];?></td>
                            <td>
                                <?php 
                                    $name = $row["name"];
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
                            <?php for ($i = 1; $i <= $gameCount; $i++) :  ?>
                            <td><?php echo $row["pick$i"];?></td>
                            <?php endfor;?>
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
    </body>
</html>
