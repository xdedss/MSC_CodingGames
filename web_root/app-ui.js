
// DOM元素操作相关

define([], function(){
    
    function dateFormat(fmt, date) {
        let ret;
        const opt = {
            "Y+": date.getFullYear().toString(),        // 年
            "m+": (date.getMonth() + 1).toString(),     // 月
            "d+": date.getDate().toString(),            // 日
            "H+": date.getHours().toString(),           // 时
            "M+": date.getMinutes().toString(),         // 分
            "S+": date.getSeconds().toString(),          // 秒
            "f+": date.getMilliseconds().toString(),          // ms
        };
        for (let k in opt) {
            ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
            };
        };
        return fmt;
    }
    
    class ListenerGroup{
        constructor(){
            this.listeners = {};
        }
        on(e, l){
            if (this.listeners[e] == null){
                this.listeners[e] = [l];
            }
            else{
                this.listeners[e].push(l);
            }
        }
        invoke(e, ...par){
            if (this.listeners[e] != null){
                this.listeners[e].forEach(l => l(...par));
            }
            else{
                console.log('warn: no listeners : ' + e);
            }
        }
    }
    
    return function(){
        
        // listeners
        var listeners = new ListenerGroup();
        
        // log in virtual console
        var maxLogs = 250;
        var logClass = ['log-msg', 'log-warn', 'log-err', 'log-green'];
        var log = function(m, type, listener){
            if (type == null) type = 0;
            // prepare message
            var mstr;
            if (typeof(m) == 'string'){
                mstr = m;
            }
            else{
                try{
                    mstr = JSON.stringify(m);
                }
                catch(e){
                    mstr = m.toString();
                }
            }
            // prepare timestamp
            var datestr = dateFormat('[HH:MM:SS.fff]', new Date());
            
            // element
            var ele = $(`<tr> <td><pre>${datestr}</pre></td> <td class="${logClass[type]}"><pre>${mstr}</pre></td> </tr>`);
            if (listener != null){
                ele.on('dblclick', listener);
            }
            $('#console tbody').prepend(ele);
        };
        
        var logError = function(m) {
            markStatus('2', 'error');
            log(m.toString(), 2, e => {
                listeners.invoke('traceerror', m);
            });
        }
        
        // status badge
        var statusClass = ['label-success', 'label-warning', 'label-error'];
        var markStatus = function(index, m) {
            var ele = $('#status');
            if (m !== undefined){
                ele.text(m);
            }
            for (var i = 0; i < statusClass.length; i++){
                if (i == index){
                    ele.addClass(statusClass[i]);
                }
                else{
                    ele.removeClass(statusClass[i]);
                }
            }
        };
        
        
        // generate help doc
        var childFormat;
        var describeDocObject = function(myname, depth, docObj) {
            var titleStr = myname;
            if (docObj.type == 'function'){
                var paramNames = [];
                if (docObj.params != null){
                    for (var param in docObj.params){
                        paramNames.push(param);
                    }
                }
                titleStr += '(' + paramNames.join(', ') + ')';
            }
            var res = $(`<div class="help-frame d${depth}"></div>`);
            res.append(`<h5 class="help-title d${depth}">${titleStr} <span class="help-type">[${docObj.type}]</span> </h5>`);
            if (docObj.desc != null){
                res.append(`<p class="help-desc d${depth}">${docObj.desc}</p>`);
            }
            if (docObj.type == 'function'){
                if (docObj.params != null){
                    //res.append('<p class="help-subtitle d${depth}">参数：</p>');
                    for (var param in docObj.params){
                        res.append(describeDocObject(param, depth + 1, docObj.params[param]));
                    }
                }
            }
            else if (docObj.type == 'array'){
                res.append(describeDocObject(myname + '[i]', depth + 1, docObj.item));
            }
            else if (docObj.children != null){
                //res.append('<p class="help-subtitle d${depth}">属性：</p>');
                for (var child in docObj.children){
                    res.append(describeDocObject(myname + childFormat(child), depth + 1, docObj.children[child]));
                }
            }
            return res;
        }
        var setHelp = function(level, lang) {
            //console.log(lang);
            switch(lang){
                case 'js':
                case 'cpp':
                default:
                    childFormat = name => '.' + name;
                    break;
                case 'py':
                    childFormat = name => '[\'' + name + '\']';
                    break;
            }
            var documentation = level.documentation;
            $('#globalvars').html('');
            //console.log(documentation);
            for (var k in documentation){
                var content = documentation[k];
                $('#globalvars').append(describeDocObject(k, 0, content));
            }
            $('#leveldesc').html(level.desc);
        }
        
        // 更新语言选择列表
        var listLang = function(langList){
            $('#langlist').html('');
            for (var i = 0; i < langList.length; i++){
                var ele = $(`<li class="menu-item" lang="${langList[i]}"><a href="#">${langList[i]}</a></li>`);
                (function(name){
                    ele.on('click', e=> {
                        listeners.invoke('changelang', name);
                    });
                })(langList[i]);
                $('#langlist').append(ele);
            }
        }
        
        // 更新场景列表
        var listLevel = function(levelList, extraLevelList){
            $('#levellist').html('');
            $('#levellist').append('<li class="divider" data-content="Built-in"></li>');
            for (var i = 0; i < levelList.length; i++){
                var lname = levelList[i];
                var ele = $(`<li class="menu-item" levelname="${lname}"><a href="#">${lname}</a></li>`);
                (function(name){
                    ele.on('click', e=> {
                        listeners.invoke('changelevel', name, false);
                    });
                })(lname);
                $('#levellist').append(ele);
            }
            $('#levellist').append('<li class="divider" data-content="Extra"></li>');
            for (var i = 0; i < extraLevelList.length; i++){
                var lname = extraLevelList[i];
                var ele = $(`
                <li class="menu-item" levelname="${lname}">
                    <a href="#">${lname}</a>
                    <div class="menu-badge"><label class="label ">-</label></div>
                </li>
                `);
                (function(name){
                    ele.find('a').on('click', e=> {
                        listeners.invoke('changelevel', name, false);
                    });
                    ele.find('div').on('click', e=> {
                        listeners.invoke('removelevel', name);
                    });
                })(lname);
                $('#levellist').append(ele);
            }
            var addBtn = $('<li class="menu-item text-gray"><a href="#">添加...</a></li>');
            addBtn.on('click', e => listeners.invoke('addlevel'));
            $('#levellist').append(addBtn);
        }
        
        var markLevel = function(lname){
            $('#levelname').text(lname);
            $(`#levellist li[levelname]`).removeClass('text-primary bg-gray');
            $(`#levellist li[levelname="${lname}"]`).addClass('text-primary bg-gray');
        }
        
        var markLang = function(lname){
            $('#langname').text(lname);
            $(`#langlist li[lang]`).removeClass('text-primary bg-gray');
            $(`#langlist li[lang="${lname}"]`).addClass('text-primary bg-gray');
        }
        
        // 编辑状态提示
        var markSave = function(unsaved){
            if (unsaved){
                $('#btn-save').addClass('badge');
            }
            else{
                $('#btn-save').removeClass('badge');
            }
        }
        var markExec = function(changed){
//            if (changed){
//                $('#btn-run').addClass('badge');
//            }
//            else{
//                $('#btn-run').removeClass('badge');
//            }
        }
        // 按暂停状态隐藏按钮
        var markPaused = function(paused){
            if (paused){
                $('#btn-resume').css('display', '');
                $('#btn-pause').css('display', 'none');
                $('#timestamp').addClass('bg-warning').removeClass('bg-gray');
            }
            else {
                $('#btn-resume').css('display', 'none');
                $('#btn-pause').css('display', '');
                $('#timestamp').removeClass('bg-warning').addClass('bg-gray');
            }
        }
        
        //显示加载转圈圈
        var markLoading = function(loading){
            if (loading){
                $('#loaded-container').addClass('loading');
            }
            else{
                $('#loaded-container').removeClass('loading');
            }
        }
        
        // 显示时间戳
        var markTime = function(seconds){
            $('#timestamp').text('t+' + seconds.toFixed(2));
        }
        
        // 显示登录用户名
        var markLogin = function(username){
            if (username === null){
                $('#login').css('display', '');
                $('#btn-login').css('display', '');
                $('#btn-logout').css('display', 'none');
                $('#btn-username').css('display', 'none');
                
            }
            else{
                $('#login').css('display', 'none');
                $('#btn-login').css('display', 'none');
                $('#btn-logout').css('display', '');
                $('#btn-username').css('display', '');
                $('#btn-username span').text(username);
            }
        }
        
        // 显示登录错误
        var markLoginError = function(error){
            if (error === null){
                $('#logincontent .text-error').text('');
            }
            else{
                $('#logincontent .text-error').text(error);
            }
        }
        // 登录中
        var markLoginLoading = function(isLoading){
            if (isLoading){
                $('#login-login').addClass('disabled loading');
            }
            else{
                $('#login-login').removeClass('disabled loading');
            }
        }
        
        // 初始化排名面板
        var markRankCat = function(rankCat){
            if (rankCat == null || Object.keys(rankCat).length == 0){
                $('#rankcontent').css('display', 'none');
                $('#select-rank').html('<option>无可用排名</option>');
            }
            else{
                $('#rankcontent').css('display', '');
                $('#select-rank').html('');
                for (var k in rankCat){
                    $('#select-rank').append(`<option value="${k}">${rankCat[k].name}</option>`);
                }
                var defaultRank = Object.keys(rankCat)[0];
                $('#select-rank').val(defaultRank);
                listeners.invoke('rankchange', defaultRank);
            }
            
        }
        
        // 显示我的成绩
        var markRankScore = function(score){
            if (score == null){
                $('#btn-uploadscore').addClass('disabled');
                $('#myscore').text('无');
            }
            else{
                $('#btn-uploadscore').removeClass('disabled');
                $('#myscore').text(score);
            }
        }
        
        // 上传中
        var markRankUploading = function(isUploading){
            if (isUploading){
                $('#btn-uploadscore').addClass('loading');
            }
            else{
                $('#btn-uploadscore').removeClass('loading');
            }
        }
        // 上传成功
        var markRankUploadSuccessful = function(isSuccessful){
            if (isSuccessful == null){
                $('#btn-uploadscore').html('上传当前结果').removeClass('btn-error');
            }
            else{
                if (isSuccessful){
                    $('#btn-uploadscore').html('上传成功<i class="icon icon-check"></i>');
                }
                else{
                    $('#btn-uploadscore').html('上传失败<i class="icon icon-cross"></i>').addClass('btn-error');
                }
            }
        }
        
        // rank为数组[{username:'xxx', score:xxx}, ...]    null表示加载中
        var listRank = function(rank){
            if (rank === null){
                $('#rankcontent table').addClass('loading');
            }
            else{
                $('#rankcontent table').removeClass('loading');
                $('#rankcontent tbody').html('');
                rank.forEach(({username, score}) => {
                    var tabrow = $(`<tr><td username></td><td score></td></tr>`);
                    tabrow.find('td[username]').text(username);
                    tabrow.find('td[score]').text(score.toFixed(10));
                    $('#rankcontent tbody').append(tabrow);
                });
            }
        }
        
        // 场景设置面板初始化
        var listedParameters = null;
        var listParameters = function(parameters){
            listedParameters = parameters;
            if (Object.keys(parameters).length == 0){
                $('#scenesettings').text('无');
                $('#btn-savesettings').css('display', 'none');
                return;
            }
            $('#scenesettings').html('');
            for (var k in parameters){
                var param = parameters[k];
                var hid = 'scene-settings-' + k;
                switch(param.type){
                    case 'int':
                    case 'float':
                        var elem = $(`<div class="form-group">
                            <div class="col-3"><label class="form-label" for="${hid}">${k}:</label></div>
                            <div class="col-9"><input class="form-input" type="number" value="${param.value}" id="${hid}"></div>
                        </div>`);
                        $('#scenesettings').append(elem);
                        break;
                    case 'bool':
                        var elem = $(`<div class="form-group">
                            <div class="col-3"><label class="form-label" for="${hid}">${k}:</label></div>
                            <div class="col-9">
                            <label class="form-switch">
                                <input type="checkbox" id="${hid}" checked="${param.value}"><i class="form-icon"></i>
                            </label>
                        </div>`);
                        $('#scenesettings').append(elem);
                        break;
                    default:
                        throw 'unknown parameter type : ' + param.type;
                        break;
                }
            }
            $('#btn-savesettings').css('display', '');
        }
        $('#btn-savesettings').on('click', e => {
            //var parametersDict = {};
            for (var k in listedParameters){
                var param = listedParameters[k];
                var hid = 'scene-settings-' + k;
                switch(param.type){
                    case 'int':
                        var v = parseInt($('#'+hid).val());
                        if (isNaN(v)){
                            alert(k + ' is not a integer');
                        }
                        param.value = v;
                        break;
                    case 'float':
                        var v = parseFloat($('#'+hid).val());
                        if (isNaN(v)){
                            alert(k + ' is not a float');
                        }
                        param.value = v;
                        break;
                    case 'bool':
                        var v = !!($('#'+hid).prop('checked'));
                        param.value = v;
                        break;
                }
                
            }
            //listeners.invoke('settingssave', parametersDict);
        });
        
        // listen click
        $('#btn-save').on('click', e => listeners.invoke('save'));
        $('#btn-load').on('click', e => listeners.invoke('load'));
        $('#btn-reset').on('click', e => listeners.invoke('reset'));
        $('#btn-run').on('click', e => listeners.invoke('run'));
        $('#btn-stop').on('click', e => listeners.invoke('stop'));
        $('#btn-resetsim').on('click', e => listeners.invoke('resetsim'));
        $('#btn-pause').on('click', e => listeners.invoke('pause'));
        $('#btn-resume').on('click', e => listeners.invoke('resume'));
        $('#login-login').on('click', e => listeners.invoke('login', $('#login-username').val(), $('#login-password').val()));
        $('#btn-logout').on('click', e => listeners.invoke('logout'));
        $('#btn-rank').on('click', e => listeners.invoke('rank'));
        $('#btn-login').on('click', e => listeners.invoke('loginopen'));
        $('#login-password').on('keypress', e => {
            if (e.keyCode == 13) listeners.invoke('login', $('#login-username').val(), $('#login-password').val());
        });
        $('#btn-settings').on('click', e => listeners.invoke('settingsopen'));
        $('#select-rank').on('change', e => listeners.invoke('rankchange', $('#select-rank').val()));
        $('#btn-uploadscore').on('click', e => listeners.invoke('uploadscore', $('#select-rank').val()));
        var on = function(e, f){
            listeners.on(e, f);
        }
        
        // hotkeys
        $(document).on('keydown', e => {
            console.log(e);
            if (e.ctrlKey && e.keyCode == 83){ // ctrl+S
                e.preventDefault();
                $('#btn-save').click();
            }
            if (e.ctrlKey && e.keyCode == 79){ // ctrl+O
                e.preventDefault();
                $('#btn-load').click();
            }
            if (e.keyCode == 112){ // f1
                e.preventDefault();
                location.hash = 'help';
            }
        });
        
        $('#btn-clearconsole').on('click', e => {
            $('#console tbody tr').remove();
        });
        
        setInterval(function(){
            // check log count and clear
            var elementCount = $('#console tbody')[0].childElementCount;
            if (elementCount > maxLogs) {
                $('#console tbody tr:gt(' + maxLogs + ')').remove();
            }
        }, 1000);
        
        return {
            log,
            logError,
            setHelp,
            markStatus, // deprecated
            markTime,
            markSave,
            markExec, // deprecated
            markPaused,
            markLoading,
            markLevel,
            markLang,
            markLogin,
            markLoginError,
            markLoginLoading,
            markRankCat,
            markRankScore,
            markRankUploading,
            markRankUploadSuccessful,
            listParameters,
            listRank,
            listLevel,
            listLang,
            on,
        }
    }
});



