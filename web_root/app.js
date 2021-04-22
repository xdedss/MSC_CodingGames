


//(╯‵□′)╯︵┻━┻

$(function(){
    
    $('#loaded').css('display', 'none');
    
    // {-----utils-------
    
    function fakeClick(obj) {
        var ev = document.createEvent("MouseEvents");
        ev.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        obj.dispatchEvent(ev);
    }
    
    // 给用户下载文本文件
    function exportRaw(name, data) {
        var urlObject = window.URL || window.webkitURL || window;
        var export_blob = new Blob([data]);
        var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
        save_link.href = urlObject.createObjectURL(export_blob);
        save_link.download = name;
        fakeClick(save_link);
    }
    
    // 请求用户上传文件
    function importRaw(onload, accept) {
        var ele = $('#fileselect')[0];
        $('#fileselect').val('').attr('accept', accept);
        ele.onchange = function (e) {
            //console.log(ele.files);
            if (ele.files != null && ele.files.length > 0){
                var fname = ele.files[0].name;
                fname = fname.substr(0, fname.lastIndexOf('.'));
                var reader = new FileReader();
                reader.onload = function() {
                    if(reader.result) {
                        onload(reader.result, fname);
                    }
                };
                reader.readAsText(ele.files[0]);
            }
        }
        $('#fileselect').click();
    }
    
    function getParams() {
        //url = url == null ? window.location.href : url;
        var url = location.search;
        var paramIndex = url.lastIndexOf("?");
        if (paramIndex == -1) return {};
        var paramStr = url.substring(paramIndex + 1).split('&');
        var res = {};
        for (var i = 0; i < paramStr.length; i++){
            var pair = paramStr[i].split('=');
            if (pair.length == 2){
                res[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
        }
        return res;
    }
    
    class ChangedValue { // 监听变化的值
        constructor(initial, onchange){
            this.cache = initial;
            this.onchange = onchange;
        }
        set(v){
            if (v != this.cache){
                this.onchange(this.cache, v);
                this.cache = v;
            }
        }
        get(){
            return this.cache;
        }
    }
    // -----utils-------}
    
    
    // load codemirror and matter.js
    require(['require.config'], function(){
        require(['app-ui', 'codemirror-wrap', 'matter-wrap', 'sandbox-wrap', 'storage', 'api'], function(UISetup, CodeMirrorSetup, MatterSetup, Sandbox, storage, api) {
            
            //loaded
            console.log('loaded');
            window.storage = storage;
            
            // params
            var globalDebug = true;
            var width = Math.min(720, $('#main').width());
            var height = 400;
            var langNames = ['js', 'py', 'cpp'];
            var currentLang = null;
            var levelNamesBuiltin = ['hopper', 'falcon'];
            var levelNamesExtra = storage.level.all();
            var currentLevel = null;
            
            // setup
            var ui = UISetup();
            var matter = MatterSetup($('#world')[0], width, height);
            var editor = CodeMirrorSetup($('#jseditor')[0], $('#editorframe').width(), height);
            
            // 运行的代码有没有改动
            var changedSave = new ChangedValue(false, (prev, next) => {
                ui.markSave(next);
            }); 
            //保存的代码有没有改动
            var changedExec = new ChangedValue(false, (prev, next) => {
                ui.markExec(next);
            }); 
            // 暂停状态改动
            var enginePaused = new ChangedValue(null, (prev, next) => {
                if (next) {
                    ui.markStatus(1, 'paused');
                }
                else {
                    ui.markStatus(0, 'running');
                }
                ui.markPaused(next);
            });
            
            // 编辑器键入
            editor.on('change', e => {
                //console.log('changed');
                changedSave.set(true);
                changedExec.set(true);
            });
            
            // 物理帧
            Matter.Events.on(matter.engine, 'tick', function(event) {
                if (currentLevel != null){
                    ui.markTime(currentLevel.time);
                }
                //check pause
                enginePaused.set(matter.engine.paused);
                
            });
            
            // save&load
            var exts = { js : 'js', py : 'py', cpp : 'cpp' };
            ui.on('save', function(){
                var ext = exts[currentLang] || '*';
                exportRaw('controller.' + ext, editor.getValue());
                changedSave.set(false);
            });
            ui.on('load', function(){
                var ext = exts[currentLang] || '*';
                importRaw(code => {
                    editor.setValue(code);
                    changedExec.set(true);
                    changedSave.set(false);
                }, '.' + ext);
            });
            
            // reset code
            ui.on('reset', function(){
                if (currentLevel != null && ((!changedSave.get()) || confirm("注意：这将会清除当前编辑器中的代码"))) {
                    editor.setValue(level.template[currentLang]);
                    changedSave.set(false);
                    changedExec.set(true);
                }
            });
            
            // run code
            ui.on('run', function(){
                if (currentLevel != null){
                    currentLevel.exec(editor.getValue(), currentLang);
                    changedExec.set(false);
                }
            });
//            // stop code
//            ui.on('stop', function(){
//                if (currentLevel != null){
//                    currentLevel.exec(null, currentLang);
//                    changedExec.set(false);
//                }
//            });
            
            ui.on('resetsim', function(){
                if (currentLevel != null){
                    ui.log('level reset', 1);
                    currentLevel.currentParameters = {};
                    for (var k in currentLevel.parameters){
                        currentLevel.currentParameters[k] = currentLevel.parameters[k].value;
                    }
                    currentLevel.reset();
                    //changedExec.set(true);
                    // also run code
                    currentLevel.exec(editor.getValue(), currentLang);
                    //changedExec.set(false);
                }
            });
            
            // pause & resume
            ui.on('pause', function(){
                if (currentLevel != null) {
                    matter.engine.pause();
                    ui.log('paused', 1);
                }
            });
            ui.on('resume', function(){
                if (currentLevel != null) {
                    matter.engine.resume();
                    ui.log('resumed', 1);
                }
            });
            
            // settings open
            ui.on('settingsopen', function(){
                if (currentLevel != null){
                    ui.listParameters(currentLevel.parameters);
                }
            });
            
            // 双击错误信息
            ui.on('traceerror', function(err){
                console.log('trace error');
                console.log([err]);
                if (err.loc != null){
                    // esper
                    if (currentLang == 'js'){
                        var loc = err.loc;
                        editor.setSelection({line:loc.start.line-1, ch:loc.start.column}, {line:loc.end.line-1, ch:loc.end.column});
                    }
                }
                else if (err.traceback != null){
                    // skulpt
                    if (currentLang == 'py'){
                        var pos = err.traceback[0];
                        editor.setSelection({line:pos.lineno-1, ch:pos.colno});
                    }
                }
            });
            
            // level switch ui
            ui.listLevel(levelNamesBuiltin, levelNamesExtra);
            ui.on('changelevel', function(lname, isExtra){
                if (currentLevel == null || lname != currentLevel.name){
                    cacheCurrentCode();
                    loadLevel(lname, isExtra);
                }
            });
            ui.on('removelevel', function(lname){
                if (levelNamesExtra.indexOf(lname) != -1){
                    storage.level.remove(lname);
                    levelNamesExtra = levelNamesExtra.filter(n => n != lname);
                    ui.listLevel(levelNamesBuiltin, levelNamesExtra);
                }
                console.log('remove level ' + lname);
            });
            ui.on('addlevel', function(lname){
                //storage.level.save('test', 'foo');
                //console.log('not implemented');
                importRaw((code, fname) => {
                    storage.level.save(fname, code);
                    levelNamesExtra.push(fname);
                    ui.listLevel(levelNamesBuiltin, levelNamesExtra);
                }, '.js');
            });
            
            // lang switch ui
            ui.listLang(langNames);
            ui.on('changelang', function(lname){
                if (lname != currentLang){
                    cacheCurrentCode();
                    setLang(lname);
                    ui.setHelp(level, currentLang);
                }
            });
            
            // lang switching
            function setLang(lang){
                if (currentLevel != null){
                    var compatibleLang = [];
                    for (var k in currentLevel.template){
                        compatibleLang.push(k);
                    }
                    if (langNames.indexOf(lang) != -1 && compatibleLang.indexOf(lang) != -1){
                        currentLang = lang;
                        if (storage.code.has(currentLevel.name + lang)){
                            editor.setValue(storage.code.load(currentLevel.name + lang));
                            //ui.log(lang + ' code for level "' + currentLevel.name + '" loaded from cache');
                        }
                        else{
                            editor.setValue(currentLevel.template[lang]);
                        }
                        editor.setLang(lang);
                        //ui.listLang()
                        ui.markLang(lang);
                        changedSave.set(false);
                        changedExec.set(true);
                    }
                    else{
                        //editor.setValue('not supported');
                        ui.log('language "' + lang + '" is not supported in this scene', 1);
                    }
                }
 
            }
            
            // level loading and updating
            function loadLevelAuto(name){
                if (levelNamesBuiltin.indexOf(name) != -1){
                    loadLevel(name, false);
                }
                else if (levelNamesExtra.indexOf(name) != -1){
                    loadLevel(name, true);
                }
                else {
                    console.log('level not found : ' + name + ' . fall back to default');
                    loadLevel(levelNamesBuiltin[0], false); // default
                }
            }
            function loadLevel(name, isExtra){
                console.log('loading level ' + name);
                // clear previous level
                var prevName = 'none';
                if (currentLevel != null){
                    prevName = currentLevel.name;
                    matter.engine.resume();
                    currentLevel.terminate();
                    currentLevel = null;
                }
                // find what to require
                var requireTarget;
                if (isExtra){
                    var levelCode = storage.level.load(name);
                    requireTarget = 'load-string!' + levelCode;
                }
                else{
                    requireTarget = 'levels/' + name;
                }
                requirejs([requireTarget], function(Level){
                    
                    level = new Level({ui, matter, api, storage});
                    level.postInit();
                    level.name = name;
                    currentLevel = level;
                    // set editor content
                    setLang(currentLang || 'js');
                    // set documentations
                    ui.setHelp(level, currentLang);
                    // hide self
                    //ui.listLevel();
                    ui.markLevel(name);
                    
                    currentLevel.currentParameters = {};
                    for (var k in currentLevel.parameters){
                        currentLevel.currentParameters[k] = currentLevel.parameters[k].value;
                    }
                    ui.log('[LoadLevel] level "' + name + '" loaded', 3);
                    
                    // also run code
                    currentLevel.exec(editor.getValue(), currentLang);
                    
                    ui.markLoading(false);
                    
                    //debug
                    if (globalDebug){
                        window.ui = ui;
                        window.api = api;
                        window.level = level;
                        window.editor = editor;
                        window.matter = matter;
                    }
                }, function(e){ // error
                    ui.log('[LoadLevel] can not load ' + (isExtra ? 'extra' : 'builtin') + ' level "' + name + '". Try ctrl+F5 force refresh. F12 for more info', 2);
                    console.log(e);
                    //ui.listLevel();
                    //ui.markLevel(prevName);
                });
            }
            
            // local storage
            function cacheCurrentCode(){
                if (currentLevel != null){
                    storage.code.save(currentLevel.name + currentLang, editor.getValue());
                }
            }
            
            // exit prompt
            window.onbeforeunload = function(e) {
                cacheCurrentCode();
                storage.misc.save('lastlang', currentLang);
                if (changedSave.get()){
                    // Cancel the event
                    e.preventDefault();
                    // Chrome requires returnValue to be set
                    e.returnValue = '';
                }
                else{
                    delete e['returnValue'];
                }
            }
            
            // load level according to url
            var p = getParams();
            var getLevelName = p['level'];
            var getLangName = p['lang'];
            currentLang = getLangName || storage.misc.load('lastlang');
            console.log('language : ' + currentLang);
            
            
            // login
            // auto login
            (async function(){
                ui.markLogin(null);
                if (storage.misc.has('token')){
                    var res = await api.validate(storage.misc.load('token'));
                    if (res.success){
                        ui.markLogin(storage.misc.load('username'));
                        loadLevelAuto(getLevelName);
                        return;
                    }
                    else{
                        console.log(res);
                    }
                }
                // not logged in
                location.hash = 'login';
            })();
            
            // init login panel 用户打开登录面板
            ui.on('loginopen', function(){
                ui.markLoginLoading(false);
                ui.markLoginError(null);
            });
            
            // login action 用户点击登录面板上的登录按钮
            ui.on('login', async function(username, password) {
                // check values
                //console.log(username, password);
                if (username.length == 0){
                    ui.markLoginError('用户名不能为空');
                    return;
                }
                if (password.length == 0){
                    ui.markLoginError('密码不能为空');
                    return;
                }
                if (username.length > 233 || password.length > 233){
                    ui.markLoginError('用户名或密码太长了😅');
                    return;
                }
                // send request
                ui.markLoginLoading(true);
                ui.markLoginError(null);
                var res = await api.login(username, password).then(w => w, e => {success : false});
                // console.log(res);
                if (res.success){
                    ui.markLoginLoading(false);
                    ui.markLogin(username);
                    storage.misc.save('username', username);
                    storage.misc.save('token', res.token);
                    loadLevelAuto(getLevelName);
                    
                    // open help
                    if (storage.isFirstOpen()){
                        console.log('first');
                        location.hash = 'help';
                    }
                    else{
                        //console.log('not first');
                    }
                }
                else{
                    ui.markLoginLoading(false);
                    ui.markLoginError('登录失败：' + res.msg);
                }
            });
            
            // 用户点击退出登录
            ui.on('logout', function(){
                storage.misc.remove('token');
                storage.misc.remove('username');
                ui.markLogin(null);
                ui.markLoginLoading(false);
                ui.markLoginError(null);
                location.reload(); // reload
            });
            
            //用户点击排行榜
            ui.on('rank', function(){
                if (currentLevel != null) {
                    ui.markRankCat(currentLevel.rank);
                }
            });
            
            // 用户选择当前查看的排行榜
            ui.on('rankchange', async function(rankname){
                console.log(rankname);
                ui.listRank(null); //加载中
                if (currentLevel != null && currentLevel.rank[rankname] != null) {
                    ui.markRankScore(currentLevel.rank[rankname].myScore);
                    var res = await api.getRank(rankname).then(w => w, e => {success : false});
                    if (res.success){
                        ui.listRank(res.rank);
                    }
                    else{
                        // ???
                        console.log('rank loading failed');
                        console.log(res);
                    }
                }
                
            });
            
            // 用户点击上传代码
            ui.on('uploadscore', async function(rankname){
                if (currentLevel != null && storage.misc.has('token')){
                    ui.markRankUploading(true);
                    var res = await api.uploadScore(storage.misc.load('token'), rankname, currentLevel.currentParameters, currentLevel.rank[rankname].myScore, currentLevel.currentCode);
                    ui.markRankUploading(false);
                    if (res.success){
                        ui.markRankUploadSuccessful(true);
                    }
                    else{
                        ui.markRankUploadSuccessful(false);
                        console.log(res);
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    ui.markRankUploadSuccessful(null);
                }
            });
                
        });
    });
    
});

