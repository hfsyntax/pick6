<?php $currentFile = basename($_SERVER["SCRIPT_FILENAME"], '.php'); ?>
<div class="leftMenu">
    <ul class="leftMenuList">
        <li class="tooltip_nav point01 <?php if ($currentFile === "teams") echo "active"; ?>">
            <?php if (isset($_SESSION["user"])) : ?>
            <a href="teams.php">
            <?php endif; ?>
            <?php if (!isset($_SESSION["user"])) : ?>
            <a href="">
            <?php endif; ?>
            <i class="fa fa-user-plus" aria-hidden="true"></i>
            <span>Select Teams</span>
            <p>Select Teams</p>
            </a>
        </li>
        <li class="tooltip_nav point02 <?php if ($currentFile === "weekly") echo "active"; ?>">
            <a href="weekly.php">
            <i class="fa fa-users" aria-hidden="true"></i>
            <span>All Picks</span>
            <p>All Picks</p>
            </a>
        </li>
        <li class="tooltip_nav point03 <?php if ($currentFile === "season") echo 'active'; ?>">
            <a href="season.php">
            <i class="fa fa-chart-simple" aria-hidden="true"></i>
            <span>Season Stats</span>
            <p>Season Stats</p>
            </a>
        </li>
        <li class="tooltip_nav point04 <?php if ($currentFile == "results") echo "active"; ?>">
            <a href="results.php">
            <i class="fa fa-flag-checkered" aria-hidden="true"></i>
            <span>Winners & 0'fers</span>
            <p>Winners & 0'fers</p>
            </a>
        </li>
        <li class="tooltip_nav point05 <?php if ($currentFile === "games") echo "active"; ?>">
            <a href="games.php">
            <i class="fa fa-calendar-days" aria-hidden="true"></i>
            <span>Games</span>
            <p>Games</p>
            </a>
        </li>
        <?php if (isset($_SESSION["type"]) && $_SESSION["type"] == "admin") : ?>
        <li class="tooltip_nav point05 <?php if ($currentFile == "admin_utility") echo "active"; ?>">
            <a href="admin_utility.php">
            <i class="fa fa-solid fa-wrench" aria-hidden="true"></i>
            <span>Admin Utility</span>
            <p>Admin Utility</p>
            </a>
        </li>
        <?php endif; ?>
    </ul>
</div>
