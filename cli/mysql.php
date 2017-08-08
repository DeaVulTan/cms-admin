<?php

use ForceUTF8\Encoding;
use League\HTMLToMarkdown\HtmlConverter;
use Symfony\Component\DomCrawler\Crawler;

require __DIR__ . '/about_us.php';

/**
 *  @Cli("import:mysql")
 *  @Arg("connection_string", REQUIRED)
 */
function import_mysql($input, $output)
{
    global $mongoDb;
    Model::setCurrentUser($mongoDb->users->findOne());
    $addr = parse_url($input->getArgument('connection_string'));
    $addr['path'] = trim($addr['path'], '/');
    $addr['user'] = empty($addr['user']) ? '': $addr['user'];
    $addr['pass'] = empty($addr['pass']) ? '': $addr['pass'];
    $pdo  = new PDO("mysql:dbname={$addr['path']};host={$addr['host']}", $addr['user'] ?: '', $addr['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 

    $attach = $pdo->prepare("SELECT 
        b.* 
    FROM 
        attachblogs a 
    INNER JOIN attaches b ON (a.attach_id = b.attach_id) WHERE a.blog_id = ?");

    $attach2 = $pdo->prepare("SELECT 
        b.* 
    FROM 
        attachhelp2s a
    INNER JOIN attaches b ON (a.attach_id = b.attach_id) WHERE a.help2_id = ?");

    $dontDelete = array('users', 'deploy_keys');
    foreach ($mongoDb->GetCollections() as $collection) {
        if (!in_array($collection->rawCollection()->getName(), $dontDelete)) {
            $collection->drop();
        }
    }

    $pdo->query("set character_set_client = 'latin1'");
    $pdo->query("set character_set_connection = 'latin1'");
    $pdo->query("set character_set_database = 'latin1'");
    $pdo->query("set character_set_filesystem = 'binary'");
    $pdo->query("set character_set_results = 'latin1'");
    $pdo->query("set character_set_results = 'latin1'");

    $converter = new HtmlConverter(array('strip_tags' => true));

    foreach ($pdo->query("SELECT * FROM pages where saved = 1") as $row) {
        $corporate = new Corporate;
        $corporate->title = $row['title'];
        $markdown = "";
        $pageId = $row['page_id'];
        foreach ($pdo->query("SELECT * FROM sections WHERE page_id = {$pageId}") as $row) {
            $markdown .= "## " . $row['section_title'] . "\n";
            if ($row['type'] == 1) {
                $markdown .= $converter->convert($row['section_content']) . "\n\n";
            } else {
                $markdown .= "[download=" . strip_tags($row['section_content']) . "]\n\n";
            }

        }

        foreach ($pdo->query("
            select * from attachpages a
            INNER JOIN attaches b ON (a.attach_id = b.attach_id) 
            where page_id = '{$pageId}'
        ") as $file) {
            $fileObject = new File;
            $fileObject->mime = $file['type'];
            $fileObject->name = $file['label'];
            $mongoDb->file($fileObject)->StoreBytes($file['content']);
            $corporate->downloads[] = $fileObject;
        }

        $corporate->body = $markdown;
        $corporate->isReady = 1;
        $corporate->save();
    }

    foreach ($pdo->query("SELECT * FROM help2s where saved = 1") as $row) {
        $help = new Help;
        $help->name = $row['section_name'];
        $help->title = $row['title'];
        $help->description = $row['description'];
        $help->popularQuestion = $row['popular_question'];
        $help->enabled = preg_match("/disable/i", $row['title']) ? 0 : 1;

        $attach2->Execute(array($row['help2_id']));
        $body = preg_replace("/(#+)([a-z0-9])/i", "$1 $2", $row['body']);

        $markdown = new Parsedown();
        $html = $markdown->parse($body);
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');

        $html = Model::replaceImages($html, function($src) use ($pdo, $mongoDb) {
            if (preg_match("@/attach/([0-9]+)@", $src, $matches)) {
                foreach ($pdo->query("SELECT * FROM attaches WHERE attach_id = {$matches[1]}") as $file) {
                    $fileObject = new File;
                    $fileObject->mime = $file['type'];
                    $mongoDb->file($fileObject)->StoreBytes($file['content']);
                    return "/attach.php?id={$fileObject->id}";
                }
            }
        });

        $html = new Crawler($html);
        $nodes = array();
        foreach ($html->filter('p,a,h2') as $dom) {
            if ($dom->tagName === 'h2') {
                if (!empty($title)) {
                    $section = new HelpSection;
                    $section->question = trim($title);
                    $section->answer   = trim($text);
                    $nodes[] = $section;
                }
                $title = $dom->nodeValue;
                $text  = "";
            } else {
                $dom = new Crawler($dom);
                $text .= "<p>" . $dom->html() . "</p>\n";
            }
        }

        $help->questions = $nodes;
        $mongoDb->save($help);
    }

    foreach ($pdo->query("SELECT * FROM blogs where saved = 1") as $row) {
        $blog = new Blog;
        $blog->summary = $row['introtxt'];
        foreach ($row as $k => $v) {
            $blog->$k = $v;
        }

        $blog->body = Model::replaceImages($blog->body, function($src) use ($pdo, $mongoDb) {
            if (preg_match("@/attach/([0-9]+)@", $src, $matches)) {
                foreach ($pdo->query("SELECT * FROM attaches WHERE attach_id = {$matches[1]}") as $file) {
                    $fileObject = new File;
                    $fileObject->mime = $file['type'];
                    $mongoDb->file($fileObject)->StoreBytes($file['content']);
                    return "/attach.php?id={$fileObject->id}";
                }
            }

            $src = str_replace('{staticpath}', __DIR__ . '/../../webclient/', $src);
            if (!is_file($src)) {
                throw new RuntimeException("$src is not a valid file");
            }

            $fileObject = new File;
            $fileObject->mime = mime_content_type($src);
            $mongoDb->file($fileObject)->storeFile($src);
            return "/attach.php?id={$fileObject->id}";
        });

        $blog->enabled = in_array($row['blog_id'], [35,40]) ? 0:  1;
    
        $attach->execute(array($row['blog_id']));
        foreach ($attach as $file) {
            $fileObject = new File;
            $fileObject->mime = $file['type'];
            $mongoDb->file($fileObject)->StoreBytes($file['content']);
            $blog->{$file['label']} = $fileObject;
        }
        $blog->tags = explode(",", $blog->tags);
        

        $mongoDb->save($blog);
    }

    $rel = array();
    foreach ($pdo->query("SELECT * FROM sync_os where !isnull(os)") as $row) {
        $os = new LinuxDistros;
        $os->name = $row['os'];
        $os->helpText = $row['help_text'];
        $os->save();

        $tos = str_replace('.', '_', $os->name);
        $rel[$tos] = array();
        foreach (['64', '64n', '32', '32n'] as $type) {
            $rel[$tos][$type] = $row['url' . $type];
        }
    }

    $sync = new SyncRelease;
    $sync->os = $rel;
    $sync->versionName = "1.0";
    $sync->save();

    import_team();
}
