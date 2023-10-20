<?php
require_once "php/check_session.php";
require_once "php/week_timer.php";
if ($_SESSION["type"] === "user") {
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}

if (isset($_SESSION["message"])) {
    echo '<script>alert("' . str_replace("\n", "\\n", $_SESSION['message']) . '");</script>';
    unset($_SESSION['message']);
}

if (isset($_SESSION["download"])) {
    unset($_SESSION['download']);
    echo "
    <script>
        setTimeout(()=>{
            window.location.href='php/download_credentials.php'
        }, 2000) 
    </script>";
}

$configManager = new ConfigManager();
$season = $configManager->getSeason();
$week = $configManager->getWeek();
$timerState = $configManager->stringTimerState();
$timeRemaining = $configManager->stringResetTime();
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
                        <small>Admin Utility</small></br>
                        <small style="font-size: small;">Current Season: <?php echo $season; ?> </small>
                        <small style="font-size: small;">Current Week: <?php echo $week; ?> </small></br>
                        <small style="font-size: small;">Timer Status: <?php echo $timerState; ?> </small>
                        <small style="font-size: small;">Timer Ends: <?php echo $timeRemaining; ?> </small>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <form id="utilityForm" action="" method="post" enctype="multipart/form-data">
                        <label style="font-weight: bold; font-size: 12px;">Select Task:</label>
                        <select id="operations">
                            <option value="Upload Games" form-url="php/upload_games.php">Upload Games</option>
                            <option value="Upload Picks" form-url="php/upload_picks.php">Upload Picks</option>
                            <option value="Toggle Timer" form-url="php/timer_validate.php">Toggle Timer</option>
                            <option value="Enter Winners"  form-url="php/winners_validate.php">Enter Winners</option>
                            <option value="Edit Timer"  form-url="php/timer_validate.php">Edit Timer</option>
                            <option value="Insert User" form-url="php/insert_user.php">Insert User(s)</option>
                            <option value="Delete User" form-url="php/delete_user.php">Delete User(s)</option>
                            <option value="Upload Old Data" form-url="php/process_old.php">Upload Old Data</option>
                            <option value="Set Week/Season" form-url="php/timer_validate.php">Set Week/Season</option>
                        </select>
                        <span id="format" style="display: block; max-width: 210px; word-wrap: break-word; font-size: 12px;">Uploads games for the current week from a week xlsx file.</span>
                        <label id="fileLabel" style="display: none;">From File:</label>
                        <input type="checkbox" id="fileCheckbox" style="display: none;">
                        <label id="deleteLabel" name="deleteLabel" style="display: none;">Hard Delete</label>
                        <input type="checkbox" id="deleteCheckbox" name="deleteCheckbox" style="display: none;">
                        <input type="hidden" name="timerState" value="<?php echo (new ConfigManager())->getTimerState() ? '0' : '1'; ?>">
                        <input type="hidden" name="selectedOption" id="selectedOption" value="">
                        <label id="usernameLabel" style="display: none;">Username</label>
                        <input id="usernameInput" type="text" name="username" style="display: none;"></input>
                        <label id="passwordLabel" style="display: none;">Password</label>
                        <input id="passwordInput" type="password" name="password" style="display: none;"></input>
                        <label id="userTypeLabel" style="display: none;">User Type:</label>
                        <input id="userTypeInput" type="text" name="userType" style="display: none;"></input>
                        <label id="userGpLabel" style="display: none;">GP:</label>
                        <input id="userGpInput" type="text" name="userGp" style="display: none;"></input>
                        <label id="userGpNumberLabel" style="display: none;">#:</label>
                        <input id="userGpNumberInput" type="text" name="userGpNumber" style="display: none;"></input>
                        <label id="timerLabel" style="display: none;">Enter Time:</label>
                        <input id="timerInput" type="text" name="timerEdit" style="display: none;"></input>
                        <label id="seasonLabel" style="display: none;">Season Number:</label>
                        <input id="seasonInput" type="text" name="seasonEdit" style="display: none;" placeholder="can be empty"></input>
                        <label id="weekLabel" style="display: none;">Week Number:</label>
                        <input id="weekInput" type="text" name="weekEdit" style="display: none;" placeholder="can be empty"></input>
                        <input id="fileInput" type="file" name="file" style="display: block; margin-top: 5px;"></input>
                        <input type="submit" id="process" style="margin-top: 5px;">
                        <br><span id="output"></span>
                    </form>
                    <script>
                        document.addEventListener("DOMContentLoaded", function() {
                            const form = document.getElementById("utilityForm");
                            const operations = document.getElementById("operations");
                            const selectedOptionInput = document.getElementById("selectedOption");

                            form.onsubmit = function(event) {
                                const selectedOption = operations[operations.selectedIndex];
                                const selectedURL = selectedOption.getAttribute("form-url");
                                selectedOptionInput.value = selectedOption.value;
                                form.action = selectedURL; 
                            };
                        })
                    </script>    
                </section><!-- /.content -->
            </div><!-- /.content-wrapper -->
          <!-- Control Sidebar -->
          <?php include 'components/profile_hover.php'; ?>
          <?php include 'components/profile_settings.php'; ?>  
        </div>
        <script src="js/pagination.js"></script>  
        <script src="js/adminLoader.js"></script>
        <script src="js/sessionTimer.js"></script>
    </body>
</html>
