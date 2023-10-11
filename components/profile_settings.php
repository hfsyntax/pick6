<?php if (isset($_SESSION["user"])) : ?>
<nav id="settings">
    <div class="menu">
        <span>Settings</span>
        <li>
            <p>Option 1</p><label class="switch units"><input id="switch" type="checkbox" value=""/><div class="slider round"></div></label>
        </li>
    </div>
</nav>
<div class="popup-overlay" id="profile-overlay"></div>
<div class="popup-overlay" id="settings-overlay"></div>
<?php endif; ?>