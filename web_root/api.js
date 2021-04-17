



//(�s�F����)�s��ߩ���
// ���ͨ��


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
    
    // û�к�� ��һЩ����ģ��
    let dummyUser = 'user';
    let dummyPass = MD5('www');
    let dummyToken = '114514';
    let dummyRank = [{username : 'user1', score : 123 }, {username : 'user2', score : 233 }];
    
    // return token
    async function login(username, password){
        var passwordmd5 = MD5(password);
        
        // var res = await ajaxPostAsync('xxx', {username : username, pass : passwordmd5 });
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
    
    // return ��¼״̬�Ƿ���Ч
    async function validate(token){
        
        // var res = await ajaxPostAsync('xxx', {token});
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
    
    // ����
    async function uploadScore(token, levelName, score, code){
        await sleep(1000);
        if (token == dummyToken) {
            console.log(JSON.stringify({token, levelname : levelName, score, code}));
            return { success : true };
        }
        else {
            return { success : false };
        }
    }
    
    // �������а� ����Ҫ��֤
    async function getRank(levelName){
        var postData = {levelname : levelName};
        await sleep(1000);
        return { success : true, rank : dummyRank };
    }
    
    return {
        login,
        validate,
        uploadScore,
        getRank,
    }
    
    
});