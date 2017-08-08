<?php

require __DIR__ . '/../config.php';

$doc = $mongoDb->files->getById($_REQUEST['id']);
header("Content-Type: {$doc->mime}");

fpassthru($doc->stream);
