<header class="main-header col-lg-12">
    <span class="logo-mid"><img src="components/p6-logo.png"/>Pick6</span>
    <?php if (isset($_SESSION["user"])) : ?>
    <div class="fa fa-gears" id="settings_bar"></div>
    <div class="user-profile">
        <span>
            <?php echo $_SESSION["user"]; ?></br><?php echo $_SESSION["type"]; ?>
        </span>
        <div class="mini-user fa fa-user-circle"></div>
    </div>
    <div class="fa fa-envelope notification-icon" id="icon_bar">
        <span class="label bg-orange">0</span> 
    </div>
    <?php endif; ?>
</header>
