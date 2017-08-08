<?php

/** 
 * @Persist(files) 
 * @GridFs
 */
class File
{
    use ActiveMongo2\Query;

    /** @Id */
    public $id;

    /** @String */
    public $name;

    /** @String */
    public $mime;

    /** @Int */
    public $length;

    /** @Stream  @Ignore */
    public $stream;
}
