/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */
(function() {
var classes = {
    "p" : "small-pad-paragraph",
    "pre": "code",
};

CKEDITOR.editorConfig = function( config ) {
    // Define changes to default configuration here. For example:
    config.language = 'en';
    //config.uiColor = '#AADC6E';
    config.toolbar = [
        { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
        { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
        { name: 'styles', items: ['Format', 'FontSize' ] },
        { name: 'links', items: [ 'Link', 'Unlink', 'Source' ] },
        '/',
        { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
        { name: 'insert', items: [ 'Image', 'Table', 'HorizontalRule', 'Smiley',] },
        { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll', ] },
        { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
    ];
    config.ignoreEmptyParapgraph = true;
    config.extraPlugins = 'tableresize,uploadimage,image2,table';
    config.height = 300;
    config.disableNativeSpellChecker = false;

    config.image2_alignClasses = [ 'image-align-left', 'image-align-center', 'image-align-right' ];
    config.image2_disableResizer = true;


    //config.removeDialogTabs = 'image2:info';
    config.format_tags = 'p;h1;h2;h3;pre';
    config.removeButtons = 'Underline,Subscript,Superscript';

    config.uploadUrl = "/upload.php";
    config.filebrowserUploadUrl = '/upload.php?command=QuickUpload&type=Files';
};

CKEDITOR.on('instanceReady', function (ev) {
    ev.editor.dataProcessor.htmlFilter.addRules( {
        elements : {
            $ : function( element ) {
                if (classes[element.name] && !(element.attributes.class||"").match(new RegExp(classes[element.name]))) {
                    element.attributes.class = (element.attributes.class ||"") + " " + classes[element.name]; 
                }
            }
        }
    });
});

})();
