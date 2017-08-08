<?php

/**
 *  @Persist(corporates)
 */
class Corporate extends Model
{
    use ActiveMongo2\Query;
    
    /** @Id */
    public $id;

    /** @String @Required @List */
    public $title;

    /** @String @Markdown */
    public $body;

    /** @ReferenceMany(files) */
    public $downloads;

    /** @Int @Label("Section ready?") @Enum("No", "Yes") */
    public $isReady;

    public function getHtml()
    {
        $markdown = new Parsedown();
        $html = $markdown->text($this->body);
        $self = $this;
        return preg_replace_callback('/\[download\s*=\s*([^\]]+)\]/', function($match) use ($self) {
            $files = array();
            foreach ($self->downloads as $file) {
                if (strpos($file->mime, $match[1]) !== false) {
                    $file->xid = (string)Blob::storeFile($file, 0);
                    $files[] = $file;
                }
            }
            return template('download', compact('files', 'type'));
        }, $html);
    }

    public static function prepare()
    {
        $data = self::where(array('isReady' => 1));
        $html = template('pages', compact('data'));

        $blob = Blob::storeBytes($html, Blob::HTML, 'corporate');
        foreach ($data as $self) {
            if (empty($self->downloads)) continue;
            foreach ($self->downloads as $file) {
                $blob->dependencies[] = Blob::storeFile($file, 0);
            }
        }
        $blob->save();
    }
}
