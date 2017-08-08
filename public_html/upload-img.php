<?php

require __DIR__ . '/../config.php';

$session = new JSONful\Session\Native($_REQUEST['sessionId']);
try {
    $user = $session->get('user_id');
    $server['user'] = User::findById($user);
} catch (\Exception $e) {
    exit;
}

Model::setCurrentUser($user);

file_put_contents('/tmp/foo.txt', print_r($_FILES, true));
$obj = new File;
$obj->mime = $_FILES['upload']['type'];
$mongoDb->file($obj)->storeUpload('upload');
?>
<script>
    window.parent.CKEDITOR.tools.callFunction("<?php echo intval($_REQUEST['CKEditorFuncNum'])?>", "/attach.php?id=<?php echo $obj->id?>", "Image is uploaded correctly");
</script>

