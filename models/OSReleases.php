<?php

/**
 *  @persist(sync_releases)
 */
class SyncRelease extends Model
{
    use ActiveMongo2\Query;

    /** @Array */
    public $os;

    /** @Required @String @Version @List */
    public $versionName;

    /** @Markdown @String @Label('Changelog') */
    public $changeLog;

    public static function getInputs(Array $form, Array $doc)
    {
        $nform = [];
        foreach (self::getDistroList() as $os) {
            $tos = str_replace('.', '_', $os->name);
            foreach (['64', '64n', '32', '32n'] as $type) {
                $nform[] = [
                    'type' => 'text',
                    'label' => $os->name . ' ' . $type . ' download URL',
                    'name' => 'os.' . $tos . '.' . $type,
                    'value' => empty($doc['os'][$tos]) ? '' : $doc['os'][$tos][$type],
                ];
            }
        }

        array_shift($form);
        return array_merge($form, $nform);
    }

    public static function getDistroList()
    {
        return LinuxDistros::find([]);
    }
}
