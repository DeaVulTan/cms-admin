<?php

/**
 *  @persist(deploy_keys)
 */
class Deploy
{
    use ActiveMongo2\Query;

    /** @Id */
    public $id;

    /** @Array */
    public $scope = array();

    /** @String */
    public $privKey;

    /** @String @Unique */
    public $passAes;
}
