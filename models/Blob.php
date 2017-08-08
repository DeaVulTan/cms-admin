<?php

/**
 *  @Persist(blobs)
 */
class Blob
{
    const IMAGE = 1;
    const JSON  = 2;
    const HTML  = 3;
    const DOWNLOAD = 4;

    use ActiveMongo2\Query;

    /** @Id */
    public $id;

    /** @Reference(files) */
    public $file;

    /** @String @Index */
    public $name;

    /** @BinBase64 */
    public $signature;

    /** @Boolean */
    public $old = false;

    /** @Int */
    public $mime = self::HTML;

    /** @Reference(Blob) */
    public $parent;

    /** @ReferenceMany(Blob) @UniqueBy('$id') */
    public $dependencies = array();

    public function __toString()
    {
        return bin2hex(base64_decode($this->id));
    }

    public static function publish($address)
    {
        if (!is_dir($address . '/unsigned/')) {
            mkdir($address . '/unsigned/');
        }
        foreach (self::find(array('signature' => array('$ne' => null))) as $doc) {
            $hash = bin2hex(base64_decode($doc->id));
            if ($doc->name) {
                file_put_contents($address . '/' . $doc->name . '.redirect', '/' . $hash);
                file_put_contents($address . '/unsigned/' . $doc->name . '.redirect', '/unsigned/' . $hash);
            }
            $fp = fopen($address. '/' . $hash, 'w');
            fwrite($fp, chr(1));
            fwrite($fp, chr($doc->mime)); 
            fwrite($fp, chr(strlen($doc->name)));
            fwrite($fp, base64_decode($doc->signature));
            fwrite($fp, $doc->name);
            stream_copy_to_stream($doc->file->stream, $fp);
            fclose($fp);

            $fp = fopen($address . '/unsigned/' . $hash,  'w');
            fseek($doc->file->stream, 0);
            stream_copy_to_stream($doc->file->stream, $fp);
            fclose($fp);
        }

        foreach (glob('/tmp/cache/*/*/*') as $file) {
            unlink($file);
        }
    }

    public function getArray()
    {
        $deps = array();
        foreach ($this->dependencies as $dep) {
            if (!$dep->signature) {
                $deps[] = $dep->getArray();
            }
        }
        return array(
            'file_id' => (string)$this->file->id,
            'name' => (string) ($this->name ?: $this->file->id),
            'hash' => $this->id,
            'size' => $this->file->length,
            'mime' => $this->file->mime,
            'deps' => $deps,
        );
    }

    /**
     *  @preSave
     */
    protected function _setDeps()
    {
        if (empty($this->dependencies)) {
            return true;
        }
        foreach ($this->dependencies as $dep) {
            $dep->parent = $this;
        }
        if ($this->signature) {
            foreach ($this->dependencies as $dep) {
                if (!$dep->signature) {
                    $this->signature = null;
                    break;
                }
            }
        }
    }

    public static function storeFile($file, $mime, $name = null)
    {
        $data = self::findOne(array('file.$id' => $file->id));
        if ($name) {
            foreach (self::where(array('name' => $name, 'signature' => null)) as $obj) {
                if ($data->id !== $obj->id) {
                    $mongoDb->delete($obj);
                }
            }
        }

        if (!empty($data)) {
            return $data;
        }
        $ctx = hash_init('sha256');
        while ($bytes = fread($file->stream, 8096)) {
            hash_update($ctx, $bytes);
        }

        $hash = base64_encode(hash_final($ctx, true));

        if ($data = self::findOne(array('_id' => $hash))) {
            return $data;
        }

        $data = new self;
        $data->id   = $hash;
        $data->mime = $mime;
        $data->file = $file;
        $data->name = $name;
        $data->save();
        return $data;
    }

    public static function storeBytes($bytes, $mime, $name = null)
    {
        global $mongoDb;
        if (!is_scalar($bytes)) {
            $bytes = json_encode($bytes);
        }
        $hash = base64_encode(hash('sha256', $bytes, true));
        $data = self::findOne(array('_id' => $hash));

        if ($name) {
            foreach (self::where(array('name' => $name, 'signature' => null)) as $obj) {
                if ($data->id !== $obj->id) {
                    $mongoDb->delete($obj);
                }
            }
        }

        if (!empty($data)) {
            return $data;
        }

        $data = new self;
        $data->id = $hash;
        $data->file = new File;
        $data->mime = $mime;
        $data->file->mime = $mime;
        $data->name = $name;
        $mongoDb->file($data->file)->storeBytes($bytes);

        $data->save();
        return $data;
    }
}
