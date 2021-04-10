
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
                $('#loading-container').css('display', 'block');
                $('#loaded-container').css('display', 'none');
            }
            else{
                $('#loading-container').css('display', 'none');
                $('#loaded-container').css('display', 'block');
            }
        }
        
        // 显示时间戳
        var markTime = function(seconds){
            $('#timestamp').text('t+' + seconds.toFixed(2));
        }
        
        // listen click
        $('#btn-save').on('click', e => listeners.invoke('save'));
        $('#btn-load').on('click', e => listeners.invoke('load'));
        $('#btn-reset').on('click', e => listeners.invoke('reset'));
        $('#btn-run').on('click', e => listeners.invoke('run'));
        $('#btn-stop').on('click', e => listeners.invoke('stop'));
        $('#btn-resetsim').on('click', e => listeners.invoke('resetsim'));
        $('#btn-pause').on('click', e => listeners.invoke('pause'));
        $('#btn-resume').on('click', e => listeners.invoke('resume'));
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
            listLevel,
            listLang,
            on,
        }
    }
});



