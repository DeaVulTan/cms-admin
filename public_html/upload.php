<?php

require __DIR__ . '/../config.php';

$session = new JSONful\Session\Native($_REQUEST['sessionId']);
try {
    $user = $session->get('user_id');
    $user = User::findById($user);
} catch (\Exception $e) {
    exit;
}

Model::setCurrentUser($user);

$doc = $mongoDb->{$_REQUEST['table']}->getById($_REQUEST['id']);

$ids = array();
foreach (array_keys($_FILES) as $field) {
    $obj = new File;
    $obj->mime = $_FILES[$field]['type'];
    $mongoDb->file($obj)->storeUpload($field);
    if (empty($_GET['m']) || $_GET['m'] != 1) {
        $doc->$field = $obj;
        $ids[] = (string)$obj->id;
    } else {
        $doc->{$field}[] = $obj;
    }
    $mongoDb->save($doc);
}

foreach ($doc->$field as $file) {
    $ids[] = array('id' => (String)$file->id, 'mime' => $file->mime);
}

$mongoDb->save($doc);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Allow-Methods: POST');

echo json_encode($ids);
