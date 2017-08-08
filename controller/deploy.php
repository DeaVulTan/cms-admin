<?php

/**
 *  @API register-deploy-key
 *  @Admin
 */
function register_deploy($args, $server)
{
    $deploy = new Deploy;
    $deploy->id      = $args['id'];
    $deploy->privKey = $args['privKey'];
    $deploy->passAes = $args['passAes'];
    $deploy->scope   = (array)$args['scope'];
    $deploy->save();
    
    return array('id' => $deploy->id);
}

/**
 *  @API deploy-keys
 *  @Auth
 */
function deploy_keys($args, $server)
{
    $doc = Deploy::findOne(array('passAes' => $args['pass']));
    if (empty($doc)) {
        throw new RuntimeException("Invalid deploy password");
    }
    return $doc;
}

/**
 *  @Auth
 *  @API get_js_embed
 *
 *  Get the javascript code to embed in the webclient
 */
function get_js_embed()
{
    $keys = [
        '__global' => [
            'gVbVNtVJf210qJLe+GxWX8w9mC+WPnTPiUDjBCv9tr4='
        ]
    ];
    foreach (Deploy::find([]) as $key) {
        $scope = array_filter($key->scope);
        if (empty($scope)) {
            $keys['__global'][] = $key->id;
        } else {
            foreach (array_filter($key->scope) as $scope) {
                $keys[$scope][] = $key->id;
            }
        }
    }

    $code  = "/** Our trusted public keys {{{ */\n";
    $code .= "var signPubKey = " . json_encode($keys, JSON_PRETTY_PRINT | JSON_PRETTY_PRINT) . ";\n";
    $code .= "/** }}} */";

    return compact('code');
}

/**
 *  @Admin
 *  @API sign
 */
function deploy_sign($args, $server)
{
    $dest = __DIR__ . '/../blobs/';
    if (!is_writable($dest)) {
        $dest = '/var/www/blobs';
    }
    if (!is_writable($dest)) {
        throw new RuntimeException("$dest is not writable");
    }

    $table = $server['db']->getCollection('blob');
    $notif = array();
    foreach ($args as $key => $signs) {
        $doc = Blob::byId($key);
        if ($doc->name) {
            $table->update(['name' => $doc->name], ['$set' => ['signature' => null, 'old' => true]], ['multi' => true]);
            $notif[] = $doc->name;
        }
        $doc->signature = $signs;
        $doc->save();
    }
    Blob::publish($dest);

    foreach ($notif as $name) {
        Mega::notification($name);
    }

    return true;
}

/**
 *  @API deploy
 *  @Admin
 */
function prepare_deploy($args, $server)
{
    Blog::prepare();
    Help::prepare();
    Team::prepare();
    Corporate::prepare();

    return array_values(array_map(function($obj) {
        return $obj->getArray();
    }, iterator_to_array(Blob::find(['signature' => null, 'parent' => null]))));
}
