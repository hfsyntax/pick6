<?php
require_once "php/check_session.php";
if ($_SESSION["type"] === "user") {
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
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
                        <small>Admin Guide</small></br>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <ol style="font-size: 15px; text-align: center; list-style-position: inside; max-width:900px;">
                        <li>If you have any old season data run process_seasons.bat file in the same directory containing each of your seasons folders. If the batch file does not create
                        a zip you will need to move the files from the seasons folder into a zip file. Select Process Old Data option and wait for the process to be finished.
                        New users created will be downloaded in a file called user_credentials.csv. It is strongly recommended they change their password by navigating to their profile since the non-bulk password hashing algorithm password_hash DEFAULT is more secure.</li>
                        <li>If you would like to create new users select Insert User(s). From a csv/text file the format is (user,password,gp,type,group_number) per line.</li>
                        <li>If you would like to delete users select Delete User(s). From a csv/text file the format is each user seperated by a commma. Checking hard delete deletes their data soft delete only prevents them from logging in.</li>
                        <li>To pause/unpause the timer select the Toggle Timer option</li>
                        <li>Before any seasons/weeks can be created select Set Week/Season option and enter your desired start season and week.</li>
                        <li>To upload games ensure the timer is paused and convert the games sheet from histo check.xlsm to a csv file. Select Upload Games option and select the csv file.</li>
                        <li>Enter the desired time to set the timer to for players to make picks see <a href="https://www.php.net/manual/en/function.strtotime.php#example-2174" target="_blank">https://www.php.net/manual/en/function.strtotime.php#example-2174</a> for formats. </li>
                        <li>To upload picks ensure the timer is unpaused and convert the picks sheet from histo check.xlsm to a csv file. Select Upload Picks option and select the csv file.</li>
                        <li>To process the game scores and winners/losers ensure the timer is paused. Then convert the games sheet from histo check.xlsm to a csv file. Select Enter Winners option and select the csv file. The week number will be advanced automatically after this process.</li>
                        <li>Repeat steps 6-9 each week.</li>
                    </ol>    
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