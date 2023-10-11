<?php if (isset($_SESSION["user"])) : ?>
<div class="profile-hover">
    <div class="user-profile-icon fa fa-user-circle"></div>
    <div class="user-profile">
        <span class=""><?php echo $_SESSION["user"]; ?></span></br>
        <span class=""><?php echo $_SESSION["type"]; ?></span>
        <h1 id="logoff">LogOut</h1> 	
    </div>
</div>
<?php endif; ?>