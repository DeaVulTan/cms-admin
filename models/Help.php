<?php

function _t($text) {
    return $text;
}

/** @Persist(help_sections) */
class HelpSection extends Model
{
    /** @String @List */
    public $question;

    /** @String @HTML */
    public $answer;

}

/**
 *  @persist(helps)
 *  @Sluggable(["title"], "name")
 */
class Help extends Model implements Translatable
{
    use ActiveMongo2\Query;

    public function name()
    {
        $expected = array(
            "sharing", "sync", "ios", "security", "android", "blackberry", 
            "android", "blackberry", "windows" => "windows-phone"
        );
        $name = strtolower(trim($this->title));
        foreach ($expected as $i => $e) {
            if (preg_match("/(?:" . $e . "|" . $i . ")/i", $name)) {
                return $e;
            }
        }
        return $name;
    }

    /** @Required @String @List */
    public $title;

    /** @String @LongText */
    public $description;

    /** @String */
    public $popularQuestion;

    /** @Int @Label("Ready?") @Enum("No", "Yes") */
    public $enabled = 0;

    /** @ReferenceMany(HelpSection) */
    public $questions;
    

    public static function getBabelStrings()
    {
        $data = array();
        foreach (Help::find(array('babelReady' => 1, 'enabled' => 1)) as $help) {
            $data[] = array(
                'text' => $help->title,
                'context' => 'HELP/FAQ section title',
            );
            $parts = preg_split("/((^|\n)*##\s)/", $help->body, -1);
            $parts = array_filter(array_map('trim', $parts));
            $title = null;
            foreach ($parts as $sentence) {
                $data[] = array(
                    'text' => '## ' . preg_replace("/\n+/", "\n\n", $sentence),
                    'context' => 'Question in section ' . $help->title,
                );
            }
        }

        return $data;
    }

    public static function prepare()
    {
        $data = self::where(array('enabled' => 1));
        $html = template('helps', compact('data'));

        $deps = array();
        $html = '((TOP))' . self::getPublicHtml($html, $deps);


        $deps[] = Blob::storeBytes([], Blob::HTML, 'help.en.json');
        $blob = Blob::storeBytes($html, Blob::HTML, 'help.en');
        $blob->dependencies = $deps;
        $blob->save();
    }
}
