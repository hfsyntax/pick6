<div class="profile-hover">
    <div class="user-profile-icon fa fa-user-circle"></div>
    <div class="user-profile">
    <?php if (isset($_SESSION["user"])) : ?>
        <span class=""><?php echo $_SESSION["user"]; ?></span></br>
        <span class=""><?php echo $_SESSION["type"]; ?></span>
        <h1 id="logoff">LogOut</h1> 	
    </div>
    <?php endif; ?>
</div>
