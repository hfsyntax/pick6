<?php
require_once "php/check_session.php";
require_once "php/week_timer.php";
if (!isset($_SESSION["user"])) {
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
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
                        <small>Change Password</small></br>
                    </h1>
                </section>
    
                <!-- Main content -->
                <section class="content">
                    <form action="php/changePassword_validate.php" method="post" enctype="multipart/form-data">
                        <label">Original Password</label>
                        <input type="password" name="originalPassword"></input>
                        <br><br><label>New Password</label>
                        <input type="password" name="newPassword"></input>
                        <br><input type="submit" style="margin-top: 5px;">
                    </form>   
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