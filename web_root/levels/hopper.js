

// demo场景


define([
    'level', 'sandbox-wrap', 'levels/utils/launchpads', 'levels/utils/hoppervessel', 'levels/utils/checkpoint',
], function(Level, SandboxWrap, LaunchpadsScene, HopperVessel, Checkpoint){
    
    function setSprite(body, srcSize, tgtSize, path){
        body.render.sprite.texture = path;
        body.render.sprite.xScale = tgtSize / srcSize;
        body.render.sprite.yScale = tgtSize / srcSize;
        body.render.sprite.srcSize = srcSize;
        body.render.sprite.targetSize = function(size) {
            this.xScale = size / this.srcSize;
            this.yScale = size / this.srcSize;
        };
    }
    
    function clamp(num, min, max){
        if (min > max) return clamp(num, max, min);
        if (num > max) return max;
        if (num < min) return min;
        return num;
    }
    
    function lerp(f1, f2, t){
        return f1 * (1-t) + f2 * t;
    }
    
    function icoor(x, y){
        if (y === undefined){
            return { x : x.x, y : -x.y };
        }
        return { x : x, y : -y};
    }
    
    class RankItem{
        constructor(name, reversed){
            this.name = name;
            this.reversed = reversed;
            this.myScore_ = null;
        }
        
        get myScore(){
            return this.myScore_;
        }
        set myScore(v){
            if (typeof(this.onChange) == 'function'){
                this.onChange(v);
            }
            this.myScore_ = v;
        }
    }
    
    const massUnit = 100000;
    const checkpointPosition = [
        { x : 135, y : -50 },
        { x : 240, y : -120 },
        { x : 360, y : -160 },
        { x : 400, y : -100 },
        { x : 340, y : -50 },
        { x : 240, y : -55 },
        { x : 175, y : -30 },
    ];
    
    class LevelStarhopper extends Level {
        
        // 初始化
        init() {
            console.log('starhopper init');
            
            // launchpad background
            this.addObject(this.launchpads = new LaunchpadsScene(500, {x:0, y:0}));
            
            // Rocket
            this.addObject(this.hopper = new HopperVessel(massUnit));
            
            // marker
            this.addObject(this.marker = Matter.Bodies.circle(-100, 0, 2, {
                isStatic : true,
                render : { 
                    fillStyle : '#f00',
                    opacity : 0.5,
                },
                collisionFilter : {
                    mask : 0
                },
            }), 10);
            
            // checkpoints
            this.checkpoints = [];
            for (var i = 0; i < checkpointPosition.length; i++) {
                var ckp = new Checkpoint(20);
                ckp.position = checkpointPosition[i];
                this.checkpoints.push(ckp);
                this.addObject(ckp, 5);
                if (i < checkpointPosition.length - 1) {
                    ckp.pointTowards(checkpointPosition[i + 1])
                }
            }
            
            
            // cam limit
            this.matter.engine.camLimit.maxSize = 200;
            this.matter.engine.camLimit.minSize = 30;
            
            // gravity setup
            this.matter.world.gravity.x = 0;
            this.matter.world.gravity.y = 9.81;
            
            // get mouse position
            ((that) => {
                this._mousemove = function(event) {
                    that.mousePosition = event.mouse.position;
                };
            })(this);
            Matter.Events.on(this.matter.mConstraint, "mousemove", this._mousemove);
            
        }
        
        // 重置场景
        reset() {
            console.log('starhopper reset');
            
            this.time = 0;
            
            this.matter.engine.camTarget.x = 134;
            this.matter.engine.camTarget.y = -40;
            this.matter.engine.camTarget.size = 100;
            
            // finish state
            this.finished = false;
            
            // checkpoints
            for (var i = 0; i < this.checkpoints.length; i++) {
                this.checkpoints[i].markState(1);
                this.checkpointPassed = 0;
            }
            
            var pauseFlag = false;
            if (this.matter.engine.paused) {
                this.matter.engine.resume();
                pauseFlag = true;
            }
            
            this.hopper.position = icoor(this.launchpads.landingPads[0].x, this.hopper.centerHeight + 0.01);
            this.hopper.angle = 0;
            this.hopper.velocity = {x:0, y:0};
            this.hopper.angularVelocity = 0;
            this.hopper.reset();
            
            if (pauseFlag){
                this.matter.engine.pause();
            }
            
            this.throttle = 0;
            this.gimbal = 0;
            
            this.mousePosition = {x : 0, y : 0};
            
            Matter.Body.setPosition(this.marker, {x : -100, y : 0});
            this.markerPos = {x : -100, y : 0};

            this.sandbox = null;
        }
        
        uninit(){
            Matter.Events.off(this.matter.mConstraint, "mousemove", this._mousemove);
        }
        
        // 物理帧
        tick() {
            var { engine, world, render, mouse, mConstraint } = this.matter;
            //console.log('tick');
            
            if (!engine.paused){
                // control
                if (this.sandbox != null && !this.hopper.isDestroyed &&  !this.finished){
                    // ---- prepare input variables
                    var pos = icoor(this.hopper.position);
                    var vel = icoor(this.hopper.velocity);
                    this.sandbox.setGlobal('vessel', {
                        position : pos,
                        velocity : vel,
                        angle : Math.PI / 2 - this.hopper.angle,
                        angularVelocity : -this.hopper.angularVelocity,
                        mass : this.hopper.mass,
                        height : this.hopper.height,
                        width : this.hopper.width,
                        centerHeight : this.hopper.centerHeight,
                        maxThrust : this.hopper.maxThrust,
                        maxGimbal : this.hopper.maxGimbal,
                    });
                    this.sandbox.setGlobal('target', icoor(checkpointPosition[Math.min(this.checkpointPassed, this.checkpoints.length - 1)]));
                    this.sandbox.setGlobal('mouse', icoor(this.mousePosition));
                    this.sandbox.setGlobal('time', this.time);
                    this.sandbox.setGlobal('dt', 1/60);
                    // try update
                    try {
                        this.sandbox.callHook('update', []);
                    }
                    catch (e) {
                        this.ui.logError(e);
                    }
                    // clamp value
                    this.hopper.throttle = (isNaN(this.throttle) || this.throttle == null) ? 0 : clamp(this.throttle, 0, 1);
                    this.hopper.gimbal = (isNaN(this.gimbal) || this.gimbal == null) ? 0 : clamp(-this.gimbal, -1, 1);
                }
                else {
                    // no control
                    this.hopper.throttle = 0;
                    this.hopper.gimbal = 0;
                }
                
                // marker
                this.marker.x = (isNaN(this.markerPos.x) || this.markerPos.x == null) ? -100 : this.markerPos.x;
                this.marker.y = (isNaN(this.markerPos.y) || this.markerPos.y == null) ? -100 : this.markerPos.y;
                Matter.Body.setPosition(this.marker, icoor(this.markerPos));
                
                // checkpoint
                var currentCkp = this.checkpoints[this.checkpointPassed];
                if (currentCkp == null) {
                    if (!this.finished) {
                        this.finished = true;
                        this.ui.log(`finished. t = ${this.time} sec.`, 3);
                        this.rank.hopper_time.myScore = this.time;
                    }
                }
                else {
                    currentCkp.markState(0);
                    if (currentCkp.check(this.hopper.position)) {
                        currentCkp.markState(-1);
                        this.ui.log(`checkpoint ${this.checkpointPassed} passed. t = ${this.time} sec.`, 3);
                        this.checkpointPassed++;
                    }
                }
                
            }
        }
        
        onCollision(pairs) {
            
        }
        
        exec(code, langtype) {
            if (code == null){
                this.sandbox = null;
                return;
            }
            this.currentCode = code;
            this.currentLang = langtype;
            switch (langtype){
                case 'js':
                    this.sandbox = SandboxWrap.createJs();
                    break;
                case 'py':
                    this.sandbox = SandboxWrap.createPy();
                    break;
                case 'cpp':
                    this.sandbox = SandboxWrap.createCpp();
                    break;
                default:
                    this.ui.logError(`language "${langtype}" is not supported`);
                    this.sandbox = null;
                    break;
            }
            if (this.sandbox != null){
                this.sandbox.defHook('update', []);
                var log = m => this.ui.log(m);
                this.sandbox.onStdout = log;
                this.sandbox.defFunc('setThrottle', [0.1], v => this.throttle = v);
                this.sandbox.defFunc('setGimbal', [0.1], v => this.gimbal = v);
                this.sandbox.defFunc('setMarker', [0.1, 0.1], (x, y) => this.markerPos = {x, y});
                this.sandbox.defGlobal('landingPads', this.launchpads.landingPads);
                try{
                    this.sandbox.init(code);
                }
                catch(e){
                    this.ui.logError(e);
                    this.sandbox = null;
                }
            }
        }
        
        template = {
            js : `
// 示例代码：50m悬停
function update(){
    var heightErr = 50 - vessel.position.y;
    var velErr = 0 - vessel.velocity.y;
    console.log('height error : ' + heightErr);
    setThrottle(heightErr + velErr);
    setGimbal(0);
}
`,
            py : `
# 示例代码：50m悬停
def update():
    heightErr = 50 - vessel['position']['y']
    velErr = 0 - vessel['velocity']['y']
    print('height error : %f' % heightErr)
    setThrottle(heightErr + velErr)
    setGimbal(0)
`,
            cpp : `
// 示例代码：50m悬停
void update(){
    float heightErr = 50 - getFloat("vessel.position.y");
    float velErr = 0 - getFloat("vessel.velocity.y");
    printf("height error : %f", heightErr);
    setThrottle(heightErr + velErr);
    setGimbal(0);
}
`,
        }
        
        // 场景描述，会显示在场景信息里面
        desc =  `
<p>任务目标：依次飞过检查点，耗时越短越好（不用着陆）。</p>
<p>提示：每过一个物理帧代码中的update函数就会被调用一次，可以通过vessel变量获取飞行器自身的各项信息，通过target变量获取下一个检查点的位置，通过setThrottle和setGimbal控制推理大小和推力矢量的角度。</p>
<p>为了方便测试，这个飞行器安装了不消耗燃料、推力连续可调的魔法发动机。</p>`;
        // 场景中涉及到的排名
        rank = {
            hopper_time : new RankItem('完成耗时', true/*true表示越小越好*/),
        };
        // 全局变量描述
        documentation = {
            setGimbal : {
                type : 'function',
                desc : '设置发动机喷口摆动',
                params : {
                    gimbal : {
                        type : 'float',
                        desc : '喷口摆动的幅度，1代表逆时针最大摆角，-1代表顺时针最大摆角，超出范围的值会自动限制到范围内',
                    },
                },
            },
            setThrottle : {
                type : 'function',
                desc : '设置节流阀大小',
                params : {
                    throttle : {
                        type : 'float',
                        desc : '节流阀大小，0表示无推力，1表示最大推力，超出范围的值会自动限制到范围内',
                    },
                },
            },
            setMarker : {
                type : 'function',
                desc : '在画面上指定位置显示一个圆形标记，可以用来debug',
                params : {
                    x : {
                        type : 'float',
                        desc : 'x坐标',
                    },
                    y : {
                        type : 'float',
                        desc : 'x坐标',
                    },
                },
            },
            vessel : {
                type : 'object',
                desc : '火箭的状态信息',
                children : {
                    position : {
                        type : 'vector',
                        desc : '位置坐标，单位为m',
                        children : {
                            x : {
                                type : 'float',
                            },
                            y : {
                                type : 'float',
                            },
                        },
                    },
                    velocity : {
                        type : 'vector',
                        desc : '速度向量，单位为m/s',
                        children : {
                            x : {
                                type : 'float',
                            },
                            y : {
                                type : 'float',
                            },
                        },
                    },
                    angle : {
                        type : 'float',
                        desc : '火箭角度，单位为rad，逆时针为正',
                    },
                    angularVelocity : {
                        type : 'float',
                        desc : '火箭角速度，单位为rad/s，逆时针为正',
                    },
                    width : {
                        type : 'float',
                        desc : '火箭宽度，单位m',
                    },
                    height : {
                        type : 'float',
                        desc : '火箭高度，单位m',
                    },
                    centerHeight : {
                        type : 'float',
                        desc : '火箭质心高度，单位m',
                    },
                    mass : {
                        type : 'float',
                        desc : '火箭质量，单位kg',
                    },
                    maxThrust : {
                        type : 'float',
                        desc : '发动机最大推力，单位N',
                    },
                    maxGimbal : {
                        type : 'float',
                        desc : '发动机喷口最大偏转角度，单位rad',
                    },
                },
            },
            target : {
                type : 'vector',
                desc : '下一个检查点的位置',
                children : {
                    x : {
                        type : 'float',
                    },
                    y : {
                        type : 'float',
                    },
                },
            },
            landingPads : {
                type : 'array',
                desc : '所landingpad的坐标',
                item : {
                    type : 'vector',
                    children : {
                        x : {
                            type : 'float',
                        },
                        y : {
                            type : 'float',
                        },
                    },
                },
            },
            time : {
                type : 'float',
                desc : '从场景重置开始经过的时间，单位秒',
            },
            dt : {
                type : 'float',
                desc : '一帧的时间间隔，一般是固定值1/60秒',
            },
            mouse : {
                type : 'vector',
                desc : '鼠标的坐标',
                children : {
                    x : {
                        type : 'float',
                    },
                    y : {
                        type : 'float',
                    },
                },
            },
        };
    }
    return LevelStarhopper;
    
});


