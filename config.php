<?php

use crodas\FileUtil\File;

require __DIR__ . '/vendor/autoload.php';

function template($name, Array $args)
{
    return Templates::get($name)
        ->render($args, true);

}

function base64url_encode($base64url)
{
    $base64 = base64_encode($base64url);
    $base64 = strtr($base64, '+/', '-_');
    return $base64;
}

function base64url_decode($base64url)
{
    $base64 = strtr($base64url, '-_', '+/');
    $plainText = base64_decode($base64);
    return ($plainText);
}

File::overrideFilepathGenerator(function($f) {
    return __DIR__ . '/tmp/' . $f . '/';
});

$mongoDb = new ActiveMongo2\Client(
    new MongoClient,
    'cmsadmin',
    __DIR__ . '/models'
);
