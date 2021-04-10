

// demo场景


define([
    'level', 'sandbox-wrap', 'levels/utils/launchpads', 'levels/utils/falconvessel', 
], function(Level, SandboxWrap, LaunchpadsScene, Vessel){
    
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
    
    const massUnit = 100000;
    const startMass = 32 * 1000;
    
    class LevelFalcon extends Level {
        
        // 初始化
        init() {
            console.log('falcon init');
            
            // launchpad background
            this.addObject(this.launchpads = new LaunchpadsScene(6000, {x:0, y:0}));
            
            // Rocket
            this.addObject(this.vessel = new Vessel(massUnit));
            
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
            
            // cam limit
            this.matter.engine.camLimit.maxSize = 200;
            this.matter.engine.camLimit.minSize = 30;
            
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
            console.log('falcon reset');
            
            this.time = 0;
            
            this.matter.engine.camTarget.x = 250;
            this.matter.engine.camTarget.y = -5800;
            this.matter.engine.camTarget.size = 200;
            
            var pauseFlag = false;
            if (this.matter.engine.paused) {
                this.matter.engine.resume();
                pauseFlag = true;
            }
            
            this.vessel.position = icoor(250, 5800);
            this.vessel.angle = -2 * Math.PI / 180;
            this.vessel.velocity = {x:5, y:320};
            this.vessel.angularVelocity = 0;
            this.vessel.reset();
            this.vessel.mass = startMass;
            //this.vessel.gearDown = 1;
            //this.vessel.gearDownTarget = 1;
            
            if (pauseFlag){
                this.matter.engine.pause();
            }
            
            this.ctrlbuf = {
                throttle : 0,
                gimbal : 0,
                fin : 0,
            }
            
            // mouse position reset
            this.mousePosition = {x : 0, y : 0};
            
            // marker reset
            Matter.Body.setPosition(this.marker, {x : -100, y : 0});
            this.markerPos = {x : -100, y : 0};
            
            // landed
            this.landedCounter = 0;
            this.landed = false;

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
                if (this.sandbox != null && !this.vessel.isDestroyed){
                    // ---- prepare input variables
                    var pos = icoor(this.vessel.position);
                    var vel = icoor(this.vessel.velocity);
                    this.sandbox.setGlobal('vessel', {
                        position : pos,
                        velocity : vel,
                        angle : Math.PI / 2 - this.vessel.angle,
                        angularVelocity : -this.vessel.angularVelocity,
                        mass : this.vessel.mass,
                        dryMass : this.vessel.dryMass,
                        isp : this.vessel.Isp,
                        height : this.vessel.height,
                        width : this.vessel.width,
                        centerHeight : this.vessel.centerHeight,
                        maxThrust : this.vessel.maxThrust,
                        maxGimbal : this.vessel.maxGimbal,
                        maxFin : this.vessel.maxFin,
                    });
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
                    this.vessel.throttle = (isNaN(this.ctrlbuf.throttle) || this.ctrlbuf.throttle == null) ? 0 : clamp(this.ctrlbuf.throttle, 0, 1);
                    this.vessel.gimbal = (isNaN(this.ctrlbuf.gimbal) || this.ctrlbuf.gimbal == null) ? 0 : clamp(-this.ctrlbuf.gimbal, -1, 1);
                    this.vessel.fin = (isNaN(this.ctrlbuf.fin) || this.ctrlbuf.fin == null) ? 0 : clamp(-this.ctrlbuf.fin, -1, 1);
                }
                else {
                    // no control
                    this.vessel.throttle = 0;
                    this.vessel.gimbal = 0;
                    this.vessel.fin = 0;
                }
                
                //cam
                this.matter.engine.camTarget.x = this.vessel.position.x;
                this.matter.engine.camTarget.y = this.vessel.position.y;
                
                // marker
                this.marker.x = (isNaN(this.markerPos.x) || this.markerPos.x == null) ? -100 : this.markerPos.x;
                this.marker.y = (isNaN(this.markerPos.y) || this.markerPos.y == null) ? -100 : this.markerPos.y;
                Matter.Body.setPosition(this.marker, icoor(this.markerPos));
                
                // check landed
                if ((!this.isDestroyed) && this.vessel.throttle == 0 && Math.abs(this.vessel.velocity.y) < 0.01){
                    this.landedCounter++;
                    if (this.landedCounter >= 30 && !this.landed){
                        this.landed = true;
                        this.ui.log(`successfully landed. fuel consumed = ${((startMass - this.vessel.mass)/1000).toFixed(8)}t, errorX = ${Math.abs(this.launchpads.landingPads[1].x - this.vessel.position.x)}.`, 3);
                    }
                }
                else{
                    this.landedCounter = 0;
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
                this.sandbox.defFunc('setThrottle', [0.1], v => this.ctrlbuf.throttle = v);
                this.sandbox.defFunc('setGimbal', [0.1], v => this.ctrlbuf.gimbal = v);
                this.sandbox.defFunc('setFin', [0.1], v => this.ctrlbuf.fin = v);
                this.sandbox.defFunc('setMarker', [0.1, 0.1], (x, y) => this.markerPos = {x, y});
                this.sandbox.defFunc('gearDown', [], v => this.vessel.gearDownTarget = 1);
                this.sandbox.defFunc('gearUp', [], v => this.vessel.gearDownTarget = 0);
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
// 示例代码
var phase = 0;
function update(){
    
    // height control
    var groundHeight = vessel.centerHeight; // 落地时重心高度
    var h = vessel.position.y - groundHeight;
    // 预估落地所需加速度和推力
    var estAcc = Math.pow(vessel.velocity.y, 2) / (2 * h) + 9.81;
    var maxAcc = vessel.maxThrust / vessel.mass;
    var estThr = estAcc / maxAcc;
    
    if (phase == 0){
        if (estThr > 0.95){
            phase = 1;
        }
        //console.log(time);
        console.log('est : ' + estThr + ' h: ' + h);
    }
    else if (phase == 1){
        
        var targetX = 175; 
        setMarker(targetX, vessel.position.y);
        console.log('est : ' + estThr + ' h: ' + h + ' mass: ' + vessel.mass);
        // 反馈控制
        setThrottle(0.95 + (estThr - 0.95) * 5);
        
        // x control
        var xErr = targetX  - vessel.position.x;
        var vxErr = 0 - vessel.velocity.x;
        var targetAngle = (90 - 0.3 * (xErr + vxErr*5)) * Math.PI / 180;

        // angle control
        var angleErr = targetAngle - vessel.angle;
        var avelErr = 0 - vessel.angularVelocity;
        setGimbal(- 20 *(angleErr + avelErr * 1.5));
        setFin(- 100 *(angleErr + avelErr * 1.5));
        
        if (h < 30) {
            gearDown();
        }
        //结束条件
        if (vessel.position.y <= groundHeight + 0.01){
            console.log('landed');
            setThrottle(0);
            phase = 2;
        }
    }
}
`,
            py : `
# 示例代码：暂无
def update():
    pass
`,
            cpp : `
// 示例代码：暂无
void update(){
    
}
`,
        }
        
        // 场景描述，会显示在场景信息里面
        desc =  `
<p>此场景中一个火箭正在以300m/s的速度从6km高空下落。火箭总重32t，其中约6t为燃料，发动机比冲为277s。（以上数字的精确值可以在全局变量里获取）</p>
<p>在燃料有限的情况下，请控制火箭安全着陆到位于<b>x坐标175</b>的着陆平台上。</p>
<p>如果着陆成功，控制台里将会以绿色字体输出成功信息，燃料消耗量和落点偏差。这个游戏的最终目标就是<b>尽量降低燃料消耗和误差</b>。</p>
<p>值得注意的是该火箭使用的发动机最低只能稳定输出40%的最大推力，如果继续降低就会直接熄火。setThrottle传入的数值会被自动规范化到[0.4, 1.0]的区间内。这也意味着推重比永远大于一，在落点附近悬停调整水平位置是不现实的，需要想其他办法来增加水平精度。</p>
<p>注：如果忘记放着陆架或者着陆速度大于5m/s会导致<b><i>Rapid Unscheduled Disassembly</i></b></p>
<p>注2：由于物理引擎是固定时间步长，所以同样的初始条件+同样的代码能保证得出同样的结果。以相同初始条件运行，也可以粗略地比较出不同算法之间的性能优劣</p>`;
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
            setFin : {
                type : 'function',
                desc : '设置格栅偏转角度。格栅能够提供的气动力和速度平方成正比',
                params : {
                    throttle : {
                        type : 'float',
                        desc : '1代表逆时针最大摆角，-1代表顺时针最大摆角，超出范围的值会自动限制到范围内',
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
            gearUp : {
                type : 'function',
                desc : '收着陆架',
            },
            gearDown : {
                type : 'function',
                desc : '放着陆架',
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
                        desc : '火箭质量（含燃料质量），单位kg',
                    },
                    dryMass : {
                        type : 'float',
                        desc : '火箭干质量（不含燃料），单位kg',
                    },
                    isp : {
                        type : 'float',
                        desc : '发动机比冲，单位m/s',
                    },
                    maxThrust : {
                        type : 'float',
                        desc : '发动机最大推力，单位N',
                    },
                    maxGimbal : {
                        type : 'float',
                        desc : '发动机喷口最大偏转角度，单位rad',
                    },
                    maxFin : {
                        type : 'float',
                        desc : '格栅最大偏转角度，单位rad',
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
    return LevelFalcon;
    
});


