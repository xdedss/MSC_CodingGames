
// localstorage相关


define([], function(){
    
    function randHex (num){
        var hexChar = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'];
        var res = '';
        for (var i = 0; i < num; i++){
            res += hexChar[Math.floor(Math.random() * 16)];
        }
        return res;
    }
    
    class PrefixStorage{
        constructor(prefix){
            this.prefix = prefix;
        }
        save(key, value){
            if (value == null) return;
            key = this.prefix + key;
            localStorage.setItem(key, value);
        }
        remove(key){
            key = this.prefix + key;
            localStorage.removeItem(key);
        }
        load(key){
            key = this.prefix + key;
            return localStorage.getItem(key);
        }
        has(key){
            var names = this.all();
            return (names.indexOf(key) != -1);
        }
        all(){
            var res = [];
            for (var i = 0; i < localStorage.length; i++){
                var key = localStorage.key(i);
                if (key.startsWith(this.prefix)){
                    res.push(key.substring(this.prefix.length));
                }
            }
            return res;
        }
        clear(){
            this.all().forEach(key => this.remove(key));
        }
    }
    
    var misc = new PrefixStorage('storage_misc_');
    var code = new PrefixStorage('storage_code_');
    var level = new PrefixStorage('storage_level_');
    
    var isFirstOpen = function(){
        if (misc.load('opened') == null){
            misc.save('opened', 'yes');
            return true;
        }
        else{
            return false;
        }
    }
    
    return {
        code,
        level,
        misc,
        isFirstOpen,
    }
    
});


