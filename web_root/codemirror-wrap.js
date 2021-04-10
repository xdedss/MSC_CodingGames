
//°

define([
    "cm",
    "cm/mode/javascript/javascript",
    "cm/mode/python/python",
    "cm/mode/clike/clike",
    "cm/addon/selection/active-line",
    "cm/addon/fold/brace-fold",
    "cm/addon/fold/foldcode",
    "cm/addon/fold/foldgutter",
    "cm/addon/edit/matchbrackets",
    "cm/addon/edit/closebrackets",
    "cm/addon/hint/show-hint",
    "cm/addon/hint/javascript-hint",
    //"https://cdn.jsdelivr.net/npm/jshint@2.10.1/dist/jshint.js",
    "cm/addon/lint/lint",
    "lib/javascript-lint",
], function(CodeMirror) {
    
    return function(element, width, height) {
        // codemirror editor setup
        var editor = CodeMirror(element, {
            value : "console.log('hello world!');",
            mode : "javascript",
            lineNumbers : true,
            //lineWrapping: true,
            styleActiveLine : true,
            indentUnit : 4,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
            extraKeys: {"Ctrl-Space": "autocomplete"},
            matchBrackets : true,
            autoCloseBrackets : true,
            lint: true,
        });
        //console.log(width);
        $('.CodeMirror').css('height', height);//.css('max-width', width);
        $('#editorframe').css('overflow', 'hidden');
        
        // editor width workaround
//        $(window).on('resize', e => {
//            $('.CodeMirror').css('width', '0');
//            //$('.CodeMirror').css('width', '')
//            setTimeout(() => {
//                $('.CodeMirror').css('width', '');
//                $('.CodeMirror').css('height', height).css('max-width', width);
//            }, 10);
//        });
        
        editor.setLang = function(lang){
            switch(lang){
                case 'js':
                    editor.setOption('mode', 'javascript');
                    editor.setOption('lint', true);
                    break;
                case 'py':
                    editor.setOption('mode', 'python');
                    editor.setOption('lint', false);
                    break;
                case 'cpp':
                    editor.setOption('mode', 'clike');
                    editor.setOption('lint', false);
                    break;
                default:
                    throw "language not supported : " + lang;
                    break;
            }
        }
//        editor.on("keypress", function() {
//            // Show smart tips
//            editor.showHint();
//        });
        
        return editor;
    }
});








