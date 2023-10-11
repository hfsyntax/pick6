<?php 
require_once "db_login.php";
session_status() === PHP_SESSION_NONE ? session_start() : null;
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_SESSION["user"]) && isset($_FILES["file"]["tmp_name"]) && !empty($_FILES["file"]["tmp_name"]) ) {
    $file = $_FILES["file"]["tmp_name"];
    $fileName = $_FILES["file"]["name"];
    $file_extension = pathinfo($fileName, PATHINFO_EXTENSION);
    $photo_directory = "../profile_pictures/";
    $allowedExtensions = array("jpeg", "jpg", "png");
    if (!in_array($file_extension, $allowedExtensions)) {
        $_SESSION["message"] = "Profile picture image must be png, jpg or jpeg.";
        header("Location: ../profile.php");
        exit();
    }
    $conn = connectToDatabase();
    $uniqueFileName = $_SESSION["user"] . ".png";
    $newFileName = $photo_directory . $uniqueFileName;
    if ($file_extension === "jpeg" || $file_extension === "jpg") {
        $originalImage = imagecreatefromjpeg($file);
    } else if ($file_extension === "png") {
        $originalImage = imagecreatefrompng($file);
    }
    if ($originalImage) {
        imagepng($originalImage, $newFileName);
        $sql = "UPDATE Players SET picture_url = ? WHERE player_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $uniqueFileName, $_SESSION["auth_id"]);
        $stmt->execute();
        $stmt->close();
        imagedestroy($originalImage);
        $_SESSION["message"] = "Successfully changed profile picture";
        header("Location: ../profile.php");
    } else {
        $_SESSION["message"] = "Failed to upload the profile picture.";
        header("Location: ../profile.php");
        exit();
    }
} else {
    header('HTTP/1.1 401 Unauthorized');
    echo '401 Unauthorized - Access Denied';
    exit();
}
?>