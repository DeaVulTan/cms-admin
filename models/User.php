<?php

/**
 *  @persist(users)
 */
class User
{
    use ActiveMongo2\Query;

    /** @Id */
    public $id;

    /** @Index @String */
    public $registerHash;

    /** @Boolean */
    public $isAdmin;
    
    /** @String @Email @Unique */
    public $email;

    /** @String @Unique */
    public $loginKey;

    /** @String @Unique */
    public $publicKey;

    /** @String @Unique */
    public $secretKey;

    /** @BinBase64 */
    public $userData;

    /** @Array */
    public $permissions = array('');
}
