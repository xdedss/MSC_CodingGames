



//(╯‵□′)╯︵┻━┻
// 后端通信


define([], function(){
    
    function sleep(ms){
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
    
    async function ajaxPostAsync(url, dataObj, useUrlParams){
        if (useUrlParams){
            var query = '';
            for (var k in dataObj){
                query += k + '=' + encodeURIComponent(dataObj[k].toString());
                query += '&';
            }
            if (query.length != 0){
                url += '?' + query.substring(0, query.length - 1);
            }
            console.log(url);
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: url,
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(dataObj),
                success: (data) => {
                    try{
                        // data直接就是js object
                        let res = data; //JSON.parse(data);
                        resolve(res);
                    }
                    catch(e){
                        //reject({status:'JSON parse error', e:e});
                        console.log(data);
                        resolve({code : 0, msg : 'JSON parse error', e : e});
                    }
                },
                error: (xhr, msg, e) => {
                    //reject({status:xhr.status, e:e});
                    resolve({code : xhr.status, msg:e});
                },
            });
        });
    }
    
    
//    // retrun uid & token
//    async function register(uname, pwd){
//        
//    }
    
    let baseUrl = 'http://zzstudios.cn:8848';
    
    // 没有后端 编一些数数模拟
    let dummyDebug = false; //location.href.indexOf('file://') != -1;
    let dummyUser = 'user';
    let dummyPass = MD5('www');
    let dummyToken = '1145141';
    let dummyRank = [{username : 'user1', score : 123 }, {username : 'user2', score : 233 }];
    
    // return token
    async function login(username, password){
        try{
            var passwordmd5 = MD5(password);
            var postData = {username : username, pass : passwordmd5 };
            
            var res;
            if (!dummyDebug){
                res = await ajaxPostAsync(baseUrl + '/login', postData, true);
                res.success = res.code == 200;
                res.token = res.data;
            }
            else{
                res = await (async function(){ //dummy server
                    await sleep(1000);
                    if (username == dummyUser && passwordmd5 == dummyPass){
                        return { success : true, token : dummyToken };
                    }
                    else{
                        return { success : false, msg : '用户名或密码错误' };
                    }
                })();
            }
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false, msg : "unknown error" };
        }
    }
    
    // return 登录状态是否有效
    async function validate(token){
        try{
            var postData = {token};
            
            var res;
            if (!dummyDebug){
                res = await ajaxPostAsync(baseUrl + '/user/validate', postData, true);
                res.success = res.code == 200;
            }
            else{
                res = await (async function(){
                    await sleep(1000);
                    if (token == dummyToken) {
                        return { success : true };
                    }
                    else{
                        return { success : false, msg : '登录已失效' };
                    }
                })();
            }
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false, msg : "unknown error" };
        }
    }
    
    // 传入
    async function uploadScore(token, levelName, params, score, code){
        try{
            if (code.length > 1 * 1024 * 1024){
                return {success:false, msg:"code is too long"};
            }
            var postData = {
                "token" : token,
                "levelname" : levelName,
                "params" : JSON.stringify(params),
                "score" : score,
                "code" : code
            };
            
            var res;
            if (!dummyDebug){
                res = await ajaxPostAsync(baseUrl + '/score/upload', postData);
                res.success = res.code == 200;
            }
            else{
                res = await (async function(){
                    await sleep(1000);
                    if (token == dummyToken) {
                        console.log(JSON.stringify(postData));
                        return { success : true };
                    }
                    else {
                        return { success : false , msg : '未登录' };
                    }
                })();
            }
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false, msg : "unknown error" };
        }
    }
    
    // 加载排行榜 不需要认证
    async function getRank(levelName){
        try{
            var postData = {levelname : levelName};
            
            var res;
            if (!dummyDebug){
                res = await ajaxPostAsync(baseUrl + '/score/getall', postData, true);
                res.success = res.code == 200;
                res.rank = res.data;
                for (var i = 0; i < res.rank.length; i++){
                    res.rank[i].score = parseFloat(res.rank[i].score);
                }
            }
            else{
                res = await (async function(){
                    await sleep(1000);
                    return { success : true, rank : dummyRank };
                })();
            }
            
            //console.log(res);
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false, msg : "unknown error" };
        }
    }
    
    return {
        login,
        validate,
        uploadScore,
        getRank,
    }
    
    
});