



//(╯‵□′)╯︵┻━┻
// 后端通信


define([], function(){
    
    function sleep(ms){
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
    
    async function ajaxPostAsync(url, dataObj){
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: url,
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(dataObj),
                success: (data) => {
                    try{
                        let res = JSON.parse(data);
                        resolve(res);
                    }
                    catch(e){
                        reject({status:'JSON parse error', e:e});
                    }
                },
                error: (xhr, msg, e) => {
                    reject({status:xhr.status, e:e});
                },
            });
        });
    }
    
    
//    // retrun uid & token
//    async function register(uname, pwd){
//        
//    }
    
    // 没有后端 编一些数数模拟
    let dummyUser = 'user';
    let dummyPass = MD5('www');
    let dummyToken = '114514';
    let dummyRank = [{username : 'user1', score : 123 }, {username : 'user2', score : 233 }];
    
    // return token
    async function login(username, password){
        try{
            var passwordmd5 = MD5(password);
            var postData = {username : username, pass : passwordmd5 };
            
            // var res = await ajaxPostAsync('xxx', postData);
            var res = await (async function(){ //dummy server
                await sleep(1000);
                if (username == dummyUser && passwordmd5 == dummyPass){
                    return { success : true, token : dummyToken };
                }
                else{
                    return { success : false };
                }
            })();
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false };
        }
    }
    
    // return 登录状态是否有效
    async function validate(token){
        try{
            var postData = {token};
            
            // var res = await ajaxPostAsync('xxx', postData);
            var res = await (async function(){
                await sleep(1000);
                if (token == dummyToken) {
                    return { success : true };
                }
                else{
                    return { success : false };
                }
            })();
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false };
        }
    }
    
    // 传入
    async function uploadScore(token, levelName, score, code){
        try{
            var postData = {
                "token" : token,
                "levelname" : levelName,
                "score" : score,
                "code" : code
            };
            
            // var res = await ajaxPostAsync('xxx', postData);
            var res = await (async function(){
                await sleep(1000);
                if (token == dummyToken) {
                    console.log(JSON.stringify({token, levelname : levelName, score, code}));
                    return { success : true };
                }
                else {
                    return { success : false };
                }
            })();
            
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false };
        }
    }
    
    // 加载排行榜 不需要认证
    async function getRank(levelName){
        try{
            var postData = {levelname : levelName};
            
            // var res = await ajaxPostAsync('xxx', postData);
            var res = await (async function(){
                await sleep(1000);
                return { success : true, rank : dummyRank };
            })();
            
            console.log(res);
            return res;
        }
        catch(e){
            console.log(e);
            return { success : false };
        }
    }
    
    return {
        login,
        validate,
        uploadScore,
        getRank,
    }
    
    
});