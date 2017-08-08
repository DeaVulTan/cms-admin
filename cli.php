<?php

require __DIR__ . '/config.php';

$cli = new crodas\cli\Cli;
$cli->addDirectory(__DIR__ . '/cli');
$cli->main();
