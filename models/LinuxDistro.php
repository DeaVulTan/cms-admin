<?php

/**
 *  @Persist(linux_distros)
 */
class LinuxDistros
{
    use ActiveMongo2\Query;

    /** @Id */
    public $id;

    /** @String @List */
    public $name;

    /** @Markdown @String */
    public $helpText;
}
