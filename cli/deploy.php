<?php

/**
 *  @Cli("deploy")
 */
function deploy_binary()
{
    Blob::publish(__DIR__ . '/../blobs/');
}
