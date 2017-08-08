<?php

require __DIR__ . '/../config.php';

$api = new JSONful\Server(__DIR__ . '/../controller/');
$api['session_storage'] = 'Session';
$api['db'] = $api->share(function() {
    global $mongoDb;
    return $mongoDb;
});
$api->run();
