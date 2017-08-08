<?php

/**
 *  @Cli("babel:dump")
 */
function dump_babel()
{
    Babel::getNewStrings();
    Babel::upload();
}
