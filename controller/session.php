<?php

class Session implements JSONful\Session\Storage
{
    protected $id;
    protected $file;
    protected $data = array();

    public function __construct($id)
    {
        if (preg_match("/[^a-z0-9]/i", $id)) {
            $id = null;
        }

        if (strlen($id) < 30) {
            $id = str_replace(['+', '/', '='], '', base64_encode(openssl_random_pseudo_bytes(40)));
        }
        $this->id = $id;
        $this->file = '/tmp/ses_' . $this->id;
        if (is_file($this->file)) {
            $this->data = unserialize(file_get_contents($this->file));
        }
    }

    public function getSessionId()
    {
        return $this->id;
    }

    public function __destruct()
    {
        file_put_contents($this->file, serialize($this->data));
    }

    public function set($name, $value)
    {
        $this->data[$name] = $value;
    }

    public function get($name)
    {
        if (empty($this->data[$name])) {
            return null;
        }

        return $this->data[$name];
    }

    public function destroy()
    {
        unlink($this->file);
    }

    public function getAll()
    {
        return $this->data;
    }
        
}


