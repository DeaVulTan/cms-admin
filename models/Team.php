<?php

/**
 * @Persist(teams) 
 */
class Team extends Model
{
    use ActiveMongo2\Query;

    /** @String @Required @List */
    public $name;

    /** @String @Required @List */
    public $role;

    /** @String */
    public $twitter;
    
    /** @String */
    public $linkedIn;

    /** @ReferenceOne("files") @Label('Photo') @ExpectType(image) */
    public $avatar;

    public static function prepare()
    {
        $members = array();
        $deps    = array();
        foreach (self::find([]) as $team) {
            $avatar = Blob::storeFile($team->avatar, Blob::IMAGE);
            $deps[] = $avatar;
            $members[] = [
                'name' => $team->name,
                'role' => $team->role,
                'linkedin' => $team->linkedIn,
                'twitter'  => $team->twitter,
                'avatar'   => bin2hex(base64_decode($avatar->id)),
            ];
        }
        $team = Blob::storeBytes(template('team', compact('members')), Blob::HTML, 'team');
        $team->dependencies = $deps;
        $team->save();
    }
}
