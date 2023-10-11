<?php
require "php/check_session.php";
?>
<html>
  <head>
    <link rel="stylesheet" href="css/login.css">
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h2>Login</h2>
        <form action="php/login_validate.php" method="post">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" placeholder="Enter your username" required> 
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required> 
          <button type="submit">Login</button>
        </form>
        <?php if (isset($_GET["error"])): ?>
          <span style="color: red;"><?php echo urldecode($_GET['error']); ?></span> 
        <?php endif; ?>
      </div>
    </div>
  </body>
</html>