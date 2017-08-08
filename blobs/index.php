<?php

$file = trim($_SERVER['REQUEST_URI'], "/") . '.redirect';

$unsigned = strpos($file, "unsigned/") === 0;

if ((basename($file) === $file || $unsigned) && is_file($file)) {
    /** Redirect */
    header("Location: " . file_Get_contents($file));
    exit;

}

// Not found
header("HTTP/1.0 404 Not Found");
exit;

