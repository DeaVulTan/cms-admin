<?php

/**
 *  @Cli("user:master")
 */
function create_master_user() {
}

/**
 *  @Cli("user:register")
 *  @Option("admin")
 *  @Prompt("email", "Email", validate=FILTER_VALIDATE_EMAIL)
 *  @Prompt("permissions", "Permissions")
 */
function create_user($input)
{
    $email = $input->getOption('email');
    $user = new User;
    $user->isAdmin  = $input->getOption('admin');
    $user->email    = $email;
    foreach (explode(",", trim($input->getOption('permissions'))) as $perm) {
        $user->permissions[] = trim($perm);
    }
    $user->loginKey = base64url_encode(openssl_random_pseudo_bytes(32));
    $user->publicKey = base64url_encode(openssl_random_pseudo_bytes(32));
    $user->secretKey = base64url_encode(openssl_random_pseudo_bytes(32));
    $user->registerHash = base64url_encode(openssl_random_pseudo_bytes(128));
    $user->save();
    echo "https://cms.rodas.me/#register/{$user->registerHash}\n";
    echo "https://admin.cms.mega.nz/#register/{$user->registerHash}\n";
    echo "https://admin.cms.mega.local/#register/{$user->registerHash}\n";
}
