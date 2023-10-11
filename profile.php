<?php
require_once "php/check_session.php";
require_once "php/db_login.php";
require_once "php/week_timer.php";
$configManager = new ConfigManager();
$season = $configManager->getSeason();
$conn = connectToDatabase();

$sql = "SELECT
p.name AS name,
p.gp AS gp,
(
    SELECT rank
    FROM PlayerSeasonStats
    WHERE player_id = ? AND season_number = ?
) AS rank,
SUM(pss.won) AS won,
SUM(pss.played) AS played,
FORMAT(SUM(pss.win_percentage * pss.played) / SUM(pss.played), 2) AS win_percentage
FROM
PlayerSeasonStats pss
INNER JOIN
Players p ON pss.player_id = p.player_id
WHERE
p.player_id = ?
GROUP BY
p.name";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $_SESSION["auth_id"], $season, $_SESSION["auth_id"]);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

if (isset($_SESSION["message"])) {
    echo '<script>alert("' . str_replace("\n", "\\n", $_SESSION['message']) . '");</script>';
    unset($_SESSION['message']);
}

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
                        <small>Profile</small></br>
                        <input type="submit" name="changePassword" value="change password" onclick="location.href='change_password.php';"/>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                
                    <label id="profile" style="background-image: url('profile_pictures/<?php echo $_SESSION['user']?>.png'); background-size: cover;">
                        <form method="post" id="profileForm" action="php/profile_picture.php" enctype="multipart/form-data">
                            <input type="file" name="file" id="fileInput" style="display:none">
                            <i class="fa-solid fa-pencil" id="edit_profile_photo"></i>
                        </form>
                        <script>
                            const fileInput = document.getElementById("fileInput");
                            const form = document.getElementById("profileForm")
                            fileInput.onchange = function() {
                                form.submit(); 
                            }
                        </script>
                    </label><br>
                    <table id="profile_table">
                        <tr>
                            <th># (current season)</th>
                            <th>GP</th>
                            <th>Player</th>
                            <th>Won</th>
                            <th>Played</th>
                            <th>%</th>
                        </tr>
                        <?php while ($row = $result->fetch_assoc()) : ?>
                        <tr>
                            <td><?php echo $row["rank"]; ?></td>
                            <td><?php echo $row["gp"]; ?></td>
                            <td><?php echo $row["name"]; ?></td>
                            <td><?php echo $row["won"]; ?></td>
                            <td><?php echo $row["played"]; ?></td>
                            <td><?php echo $row["win_percentage"]; ?></td>
                        </tr>
                        <?php endwhile; ?>
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