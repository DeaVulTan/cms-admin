<?php

use Symfony\Component\DomCrawler\Crawler;

/**
 *  @Persist(blogs)
 */
class Blog extends Model
{
    use ActiveMongo2\Query;

    /** @String @Required @List */
    public $title;

    /** 
     * @String
     * @Required
     * @LongText
     * @List
     */
    public $summary;

    /** @String @HTML */
    public $body;

    /** @Array * /
    public $tags;
    /* */

    /**
     * @ReferenceOne("files")
     * @Label('Big Image')
     * @ExpectType(image)
     * @Group("files")
     */
    public $bimg;

    /** 
     * @ReferenceOne("files")
     * @Label('Small Image')
     * @ExpectType(image)
     * @Group("files") 
     */
    public $simg;

    /** @Int @Label("Ready?") @Enum("No", "Yes") @Group("ready") */
    public $enabled = 0;

    /** @Date @Group("ready") */
    public $created;

    /**
     *  @preSave
     */
    public function preSave()
    {
        if (empty($this->created)) {
            $this->created = time();
        }

        //$this->tags = array_filter(preg_split("/[,\n]+/", $this->tags));
    }

    public static function prepare()
    {
        $blogs = array();
        $index = array();
        $deps  = array();
        foreach (self::where(array('enabled' => 1))->sort(array('_id' => 1)) as $blog) {
            $blogArray = array(
                'by' => null,
                'h' => $blog->title,
                'introtxt' => $blog->summary,
                't' => $blog->created->sec,
                'c' => self::getPublicHtml($blog->body, $deps),
                'attaches' => array(),
            );


            foreach (array('bimg', 'simg') as $prop) {
                if (!empty($blog->$prop)) {
                    $image  = Blob::storeFile($blog->$prop, Blob::IMAGE);
                    $deps[] = $image;
                    $blogArray['attaches'][$prop] = bin2hex(base64_decode($image->id));
                }
            }

            if (empty($blogArray['attaches'])) {
                continue;
            }
            $index[] = $blogArray;
        }

        uasort($index, function($a, $b) {
            return $b['t'] - $a['t'];
        });

        $max = count($index);
        foreach ($index as $value) {
            $value['id'] = $max;
            $blogs['post_' . ($max--)] = $value;
        }


        $blog = Blob::storeBytes($blogs, Blob::JSON, 'blog');
        $blog->dependencies = $deps;
        $blog->save();
    }
}
