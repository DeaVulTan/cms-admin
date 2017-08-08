<?php

/**
 *  @Persist(revisions)
 *  @Autoincrement
 */
class Revision
{
    use ActiveMongo2\Query;

    /** @Id */
    public $changeId;

    /** @String @Required @Index */
    public $type;

    /** @Reference(Revision) */
    public $parent;

    /** @Reference(user) */
    public $user;

    /** @Embed */
    public $data;
}
