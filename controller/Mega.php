<?php
    
class Mega
{
    public static $config = array(
        'devel' => array(
            'server' => 'api-sandbox3.developers.mega.co.nz',
            'sid' => 'rtzWC_HXDw56ryfKsIBuk0FEenAtRFBYYU84oPvLoxPBTCEwWTjRyNd5uw',
            'root' => 'aA0DxYzI'
        ),  
        'stage' => array(
            'server' => 'staging.api.mega.co.nz',
            'sid' => "om13WYwRblghJV8YYCGuxmtKNFNGTXFjOHA00DMDsOJq5KD9qiMSdMOuDg",
            'root' =>  "Nc4AFJZK",
        ),
        'prod' => array(
            'server' => "eu.api.mega.co.nz",
            'sid' => "om13WYwRblghJV8YYCGuxmtKNFNGTXFjOHA00DMDsOJq5KD9qiMSdMOuDg",
            'root' =>  "Nc4AFJZK",
        ),
    );

    public static function notification($message, $server = 'prod')
    {
        return self::api(['a' => 'te', 'e' => bin2hex('.cms.' . $message)], ['e' => self::$config[$server]['root']], $server);
    }

    public static function doPost($url, $body)
    {
        if (is_callable('curl_init')) {
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_VERBOSE, true);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($curl, CURLOPT_HTTPHEADER, array(
                'User-Agent: CMS/1.0.0 Pusher',
                'Content-Type: application/x-www-form-urlencoded',
            ));
            curl_setopt($curl, CURLOPT_POSTFIELDS, $body);;
            $response = curl_exec($curl);
            curl_close($curl);

            return $response;
        }

        $params = array('http' => array(
            'method' => 'POST',
            'content' => $body,
            'header' => "User-Agent: CMS-withoutCurl-1.0.1 Pusher\r\nContent-type: application/x-www-form-urlencoded",
        ));

        $ctx = stream_context_create($params);

        return file_get_contents($url, false, $ctx);
    }

    protected static function api(Array $message, Array $extra = array(), $server = 'prod')
    {
        if (empty(self::$config[$server])) {
            throw new \RuntimeException("Failed to get {$server} config");
        }

        $args = array_merge($extra, ['id' => -1 * mt_rand(), 'sid' => self::$config[$server]['sid']]);

        $response = self::doPost(
            "https://" . self::$config[$server]['server'] . "/cs?" . http_build_query($args),
            json_encode([$message])
        );
        
        $response = json_decode($response, true);

        if (is_numeric($response)) {
            return false;
        }

        return current($response);
    }
}
