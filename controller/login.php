<?php

/**
 *  @API login
 */
function do_login(Array $args, $server)
{
    $user = User::findOne(array('loginKey' => $args['hash']));
    if (empty($user)) {
        return array('error' => true);
    }

    $server['session']->set('user_id', $user->id);
    return array('error' => false, 'publicKey' => $user->publicKey, 'secretKey' => $user->secretKey);
}

/**
 *  @API register
 */ 
function do_register(Array $args, $server)
{
    if (empty($args['hash']) || !($user = User::findOne(['registerHash' => $args['hash']]))) {
        throw new Exception("Invalid hash"); 
    }

    return array('id' => (string)$user->id, 'email' => $user->email);
}


/**
 *  @API confirm_registration
 */
function do_confirm(Array $args, $server)
{
    if (empty($args['hash']) || !($user = User::findOne(['registerHash' => $args['hash']]))) {
        throw new Exception("Invalid hash"); 
    }
    if ((String)$user->id !== $args['id']) {
        throw new Exception('Invalid user id');
    }
    $user->registerHash = '';
    $user->publicKey    = $args['publicKey'];
    $user->secretKey    = $args['secretKey'];
    $user->loginKey     = $args['login_hash'];
    $user->save();
    return array('success' => true);
}

/**
 *  @API store
 *  @Auth
 */
function do_store($args, $server)
{
    $server['user']->userData = $args['data'];
    $server['user']->save();
    return ['stored' => true];
}

/**
 *  @API logout
 *  @Auth
 */
function do_logout($args, $server)
{
    $server['session']->set('user_id', null);
    $server['session']->destroy();
    return array();
}
