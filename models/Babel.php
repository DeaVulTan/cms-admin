<?php

class Babel
{
    private static $_tables = array('Help');

    public static function hash($string)
    {
        return substr(sha1(preg_replace("/\s+/smU", "", strtolower($string))), 0, 8);
    }

    private static function filter($text) {
        $text = preg_replace('/!\[[^\)]+\)/', '', $text);
        preg_match_all('!https?://\S+!', $text, $matches);
        if (!empty($matches[0])) {
            $urls = [];
            foreach (array_unique(array_map(function($url) {
                return trim(trim($url, ').'));
            }, $matches[0])) as $url) {
                $url = BabelLink::find_or_create_by(array('url' => $url));
                $url->save();
                $urls[$url->url] = '$' . $url->id;
            }
            $text = str_replace(array_keys($urls), array_values($urls), $text);
        }

        return trim($text);
    }

    protected static function getStrings()
    {
        $strings = array();
        foreach (self::$_tables as $table) {
            foreach ($table::getBabelStrings() as $string) {
                if (!is_array($string) || empty($string['text']) || empty($string['context'])) {
                    throw new RuntimeException("Invalid response from $table::getBabelStrings()");
                }
                $string['text'] = self::filter($string['text']);
                if (empty($string['text'])) {
                    continue;
                }
                $string['id'] = self::hash($string['text']);
                $strings[$string['id']] = $string;
            }
        }

        return $strings;
    }

    public static function getNewStrings()
    {
        $strings = self::getStrings();
        foreach (BabelString::where(array('_id' => array('$in' => array_keys($strings)))) as $string) {
            unset($strings[$string->id]);
        }

       
        return array_values($strings);
    }

    public static function upload()
    {
        $ch = curl_init("http://192.168.33.1:8085/service.php");

        $data = self::getNewStrings();
        if (empty($data)) {
            return false;
        }

        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => array(
                'action' => 'cms2',
                'json' => json_encode($data),
                'auth' => '154bb399bdda65',
            )
        ));
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);

        foreach ($response as $trans) {
            $r = new BabelString;
            $r->id = Babel::hash($trans['text']);
            $r->babelId = $trans['id']+0;
            $r->text    = $trans['text'];
            $r->context = $trans['context'];
            $r->translations = $trans['trans'];
            $r->save();
        }

        return true;
    }

    public static function status()
    {
        $strings = array();
        foreach (self::$_tables as $table) {
            $strings = array_merge($strings, self::checkResponse($table::getBabelStrings(), $table));
        }

        return $strings;
    }
}

/**
 *  @persist(babel_links)
 *  @autoincrement
 */
class BabelLink
{
    use ActiveMongo2\Query;

    /** @Id */
    public $id;
    
    /** @String @Required @Unique */
    public $url;
}

/**
 *  @Persist(babel_strings)
 *
 *  @Info("Here we preview all the strings that are ready to send to babel")
 */
class BabelString
{
    use ActiveMongo2\Query;

    /** @Id @Ignore */
    public $id;

    /** @Index @Int @Ignore */
    public $babelId = 0;

    /** @String @Required @List @Label("text") @LongText */
    public $text;

    /** @String @Required @LongText */
    public $context;

    /** @Array @Ignore */
    public $translations;

    public static function translate($text)
    {
        die($text);
    }
}
