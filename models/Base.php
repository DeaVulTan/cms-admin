<?php

use Symfony\Component\DomCrawler\Crawler;

/**
 *  @persist
 *  @timetable
 */
class Model
{
    /** @Id */
    public $id;

    private static $user;

    public static function setCurrentUser($user)
    {
        self::$user = $user;
    }

    protected function checkHtmlImages($html)
    {
        self::replaceImages($html, function($src) {
            if (!preg_match('/[a-f0-9]{24}/', $src, $id)) {
                throw new RuntimeException("Image ($src) is an external image. Please upload it through the editor");
            }
            return $src;
        });
    }

    public static function replaceImages($html, Callable $replacer)
    {
        $replace = array();
        $dom = new Crawler($html);
        foreach ($dom->filter('img') as $img) {
            $img = new Crawler($img);
            $src = $img->attr('src');
            $new = $replacer($src);
            $img->getNode(0)->setAttribute('src', $replacer($src));
        }

        foreach ($dom->filter('a') as $link) {
            $link = new Crawler($link);
            $href = $link->attr('href');
            if (preg_match("/\.(?:jpe?g|png|gif)$|[a-f0-9]{24}/i", $href)) {
                $link->getNode(0)->setAttribute('href', $replacer($href, true));
            }
        }

        $html = $dom->html();
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        return $html;
    }

    public static function getPublicHtml($html, &$deps)
    {
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        return self::replaceImages($html, function($src, $isLink = false) use (&$deps) {
            if (preg_match('/[a-f0-9]{24}/', $src, $id)) {
                $image  = Blob::storeFile(File::byId($id[0]), Blob::IMAGE);
                $deps[] = $image;
                $path = bin2hex(base64_decode($image->id));
                if ($isLink) {
                    $path .= "/image.png";
                }

                return '{cmspath}unsigned/' . $path;
            }
            return $src;
        });
    }

    /**
     *  @presave
     */
    public function presave_checkuser()
    {
        if (empty(self::$user)) {
            throw new \Exception("cannot save without any user. Call Model::setCurrentUser()");
        }

        foreach ($this as $key => $value) {
            if ($value && is_string($value) && !is_numeric($key)) {
                $this->checkHtmlImages($value);
            }
        }
    }

    /**
     *  @postSave
     */
    public function createRevision($doc, $args, $connection) 
    {
        $rev = new Revision;
        $rev->parent = Revision::findOne(array('parent' => null, 'type' => get_class($this)));
        $rev->type = get_class($this);
        $rev->data = $this;
        $rev->user = self::$user;
        $connection->save($rev);
    }
}
