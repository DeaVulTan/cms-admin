<?php

use Symfony\Component\DomCrawler\Crawler;


/**
 *  @Cli("import:team")
 *  @Arg("webclient", REQUIRED)
 */
function import_team() {
    global $mongoDb;

    $dir  = getcwd() . '/../webclient/';
    $path = $dir . '/html/about.html';
    if (!is_file($path)) {
        throw new RuntimeException("$path is not a valid path");
    }
    Model::setCurrentUser($mongoDb->users->findOne());

    $mongoDb->teams->drop();

    $crawler = new Crawler(file_get_contents($path));
    foreach ($crawler->filter('.team-person-block') as $block) {
        $block = new Crawler($block);
        $avatar = $block->filter('.team-person-avatar img')->attr('src');
        $avatar = str_replace('{staticpath}', $dir, $avatar);
        $fileObject = new File;
        $fileObject->mime = 'image/png';
        $mongoDb->file($fileObject)->storeBytes(file_get_contents($avatar));

        $team = new Team;
        $team->name = trim($block->filter('.team-person-name')->text());
        $team->role = trim($block->filter('.team-person-occupation')->text());
        $team->avatar = $fileObject;

        try {
            $team->twitter = $block->filter('a.twitter')->attr('href');
        } catch (Exception $e) {}
        try {
            $team->linkedIn = $block->filter('a.linkedin')->attr('href');
        } catch (Exception $e) {}
        $team->save();
        echo "Added {$team->name}\n";
    }

}
