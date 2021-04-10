
// Level的基类

define([], function(){
    
    // is matter.js body
    function isBody(obj){
        return obj.hasOwnProperty('render') && obj.hasOwnProperty('parent');
    }
    
    // can be safely initialized and added to world
    function isAddable(obj){
        return typeof(obj.init) == 'function' && typeof(obj.uninit) == 'function';
    }
    
    class Level{
        constructor(app) {
            var {ui, matter} = app;
            this.matter = matter;
            this.ui = ui;
            this._objectsToAdd = [];
            
            this.time = 0;
            this._ontick = () => {
                if (!this.matter.engine.paused){
                    this.time += 1/60;
                }
                this.tick();
            };
            Matter.Events.on(this.matter.engine, 'tick', this._ontick);
            
            this.init();
            this.postInit();
        }
        
        // 初始化 给子类用，子类在这里调用 this.addObject();
        init () {
            
        }
        
        // 后初始化
        postInit () {
            // add all bodies to world
            this._objectsToAdd.sort((a, b) => {
                return a.zindex - b.zindex;
            });
            //console.log(this._objectsToAdd);
            // 调用各个物体的init
            for (var i = 0; i < this._objectsToAdd.length; i++){
                var obj = this._objectsToAdd[i].obj;
                if (isBody(obj)){
                    Matter.World.add(this.matter.world, [obj]);
                }
                else if (isAddable(obj)){
                    obj.init(this.matter.engine);
                }
            }
            // add collision listener
            
            ((that) => {
                this._collision = function({ pairs }) {
                    that.onCollision(pairs);
                };
            })(this);
            Matter.Events.on(this.matter.engine, 'collisionStart', this._collision);
            this.reset();
        }
        
        // 对于matterjs的body对象或者实现了init和uninit的对象，只需一次加载，自动管理生命周期
        addObject(obj, zindex){
            zindex = zindex || 0;
            if (isBody(obj) || isAddable(obj)){
                this._objectsToAdd.push({obj, zindex});
            }
            else {
                throw new Exception('can not add object to world');
                console.log(obj);
            }
        }
        
        // 重设各个物体的位置
        reset () {
            
        }
        
        // undo初始化里面干的事情
        terminate () {
            // 调用各个物体的uninit
            for (var i = 0; i < this._objectsToAdd.length; i++){
                var obj = this._objectsToAdd[i].obj;
                if (isBody(obj)){
                    Matter.Composite.remove(this.matter.world, obj);
                }
                else if (isAddable(obj)){
                    obj.uninit();
                }
            }
            Matter.Events.off(this.matter.engine, 'collisionStart', this._collision);
            Matter.Events.off(this.matter.engine, 'tick', this._ontick);
            this.uninit();
        }
        
        // terminate后调用 给子类用
        uninit (){
            
        }
        
        // 物理帧
        tick() {
            
        }
        
        // 碰撞
        onCollision(pairs) {
            
        }
        
        // 用户提交代码
        exec (code, factory) {
            
        }
        
        template = "\nconsole.log('hello world');\n";
        desc = "no description provided.";
        documentation = {
            foo : {
                type : 'function',
                desc : 'some function',
                params : {
                    bar : {
                        type : 'float',
                        desc : 'some parameter',
                    },
                },
            },
            obj : {
                type : 'object',
                desc : 'some object',
                children : {
                    x : {
                        type : 'float',
                        desc : 'child of obj',
                    },
                },
            },
        };
    }
    return Level;
});


