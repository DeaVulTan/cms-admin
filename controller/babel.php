<?php

/**
 *  @API babel
 *  @Admin
 */
function babel_service(Array $args, $server)
{
    $markdown = new Parsedown();
    return array_map(function($record) use ($markdown) {
        $record['text'] = $markdown->text($record['text']);
        return $record;
    }, Babel::getNewStrings(false));
}

/**
 *  @API babel_push
 *  @Admin
 */ 
function babel_push(Array $args, $server)
{
    Babel::upload();
    return babel_service($args, $server);
}
