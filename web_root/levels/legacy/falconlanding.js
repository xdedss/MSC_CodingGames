

// demo场景


define([
    'level', 'levels/utils/launchpads', 'sandbox-wrap', 
    'image!levels/res/f9_d.png', 'image!levels/res/f9.png', 'image!levels/res/plume.png'
], function(Level, launchpads, SandboxWrap){
    
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
    
    function moveTowards(f, target, maxdelta){
        if (target > f) {
            return Math.min(target, f + maxdelta);
        }
        else{
            return Math.max(target, f - maxdelta);
        }
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
    
    function localToWorld(body, x, y){
        var pos = body.position;
        var angle = body.angle;
        var dx = x * Math.cos(angle) - y * Math.sin(angle);
        var dy = x * Math.sin(angle) + y * Math.cos(angle);
        return {x : pos.x + dx + body.velocity.x, y : pos.y + dy + body.velocity.y};
    }
    
    function limitMinThr(thr, minthr){
        if (thr < minthr / 2) return 0;
        else return Math.max(thr, minthr);
    }
    
    const massUnit = 100000;
    // N = kg * m / s^2
    const maxGimbal = 15 * Math.PI / 180;
    const maxThrust = 800 * 1000 / massUnit;
    const mass = 32 * 1000 / massUnit;
    const dryMass = 25.6 * 1000 / massUnit;
    const minThrottle = 0.4;
    const Isp = 2770; // m/s
    const frictionAir = 0.0003;
    const plumeOffset = 15.5;
    const gearOffset = 14;
    const gearSep = 3;
    const gearWidth = 1;
    const gearLength = 4;
    const centerOffset = 9.5;
    const rocketHeight = 35;
    const rocketWidth = 3;
    
    class LevelStarhopper extends Level {
        
        // 初始化
        init() {
            console.log('f9 init');
            // launchpad background
            launchpads.setup(this, 6000); // start from 6km
            
            // Rocket
            this.scene.rocket = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight, {
                frictionAir : frictionAir,
                friction : 0.8,
            });
            Matter.Body.setCentre(this.scene.rocket, {x:0, y:centerOffset}, true);
            Matter.Body.setMass(this.scene.rocket, mass);
            this.scene.rocket.render.sprite.yOffset = centerOffset / rocketHeight + 0.5;
            // landing gear
            this.scene.gearl = Matter.Bodies.rectangle(0, 0, gearLength, gearWidth, {
                isStatic : true,
                render : { 
                    fillStyle : '#888',
                },
                collisionFilter : {
                    mask : 0
                },
                zindex : 1,
            });
            this.scene.gearr = Matter.Bodies.rectangle(0, 0, gearLength, gearWidth, {
                isStatic : true,
                render : { 
                    fillStyle : '#888',
                },
                collisionFilter : {
                    mask : 0
                },
                zindex : 1,
            });
            this.setGear = function(angle){
                var localOffX = gearLength / 2 * Math.sin(angle);
                var localOffY = gearLength / 2 * Math.cos(angle) + centerOffset;
                var gearlWorld = localToWorld(this.scene.rocket, -gearSep / 2 - localOffX, gearOffset - localOffY);
                var gearrWorld = localToWorld(this.scene.rocket, gearSep / 2 + localOffX, gearOffset - localOffY);
                Matter.Body.setPosition(this.scene.gearl, gearlWorld);
                Matter.Body.setAngle(this.scene.gearl, this.scene.rocket.angle + Math.PI / 2 - angle);
                Matter.Body.setPosition(this.scene.gearr, gearrWorld);
                Matter.Body.setAngle(this.scene.gearr, this.scene.rocket.angle + Math.PI / 2 + angle);
            }
            // Plume
            this.scene.plume = Matter.Bodies.rectangle(0, 2, 1, 1, {
                isStatic : true,
                collisionFilter : {
                    mask : 0
                },
                zindex : -1,
            });
            setSprite(this.scene.plume, 32, 4, 'levels/res/plume.png');
            this.scene.plume.render.sprite.yOffset = 0;
            // marker
            this.scene.marker = Matter.Bodies.circle(-100, 0, 2, {
                isStatic : true,
                render : { 
                    fillStyle : '#f00',
                    opacity : 0.5,
                },
                collisionFilter : {
                    mask : 0
                },
                zindex : 10,
            });
            
            // cam limit
            this.matter.engine.camLimit.maxSize = 200;
            this.matter.engine.camLimit.minSize = 40;
            
            // mouse
            ((that) => {
                this._mousemove = function(event) {
                    that.mousePosition = event.mouse.position;
                };
            })(this);
            Matter.Events.on(this.matter.mConstraint, "mousemove", this._mousemove);
            
        }
        
        // 重置场景
        reset() {
            console.log('f9 reset');
            var engine = this.matter.engine;
            
            this.time = 0;
            
            engine.camTarget.x = 250;
            engine.camTarget.y = -5800;
            engine.camTarget.size = 200;
            
            var pauseFlag = false;
            if (engine.paused) {
                engine.resume();
                pauseFlag = true;
            }
            
            //Matter.Body.setPosition(this.scene.rocket, icoor(134.5, rocketHeight / 2 + 0.01));
            Matter.Body.setPosition(this.scene.rocket, icoor(250, 5800));
            Matter.Body.setAngle(this.scene.rocket, -2 * Math.PI / 180);
            Matter.Body.setVelocity(this.scene.rocket, {x:5/60, y:320/60});
            Matter.Body.setAngularVelocity(this.scene.rocket, 0)
            Matter.Body.setMass(this.scene.rocket, mass);
            setSprite(this.scene.rocket, 165, rocketHeight, 'levels/res/f9.png');
            
            //if (pauseFlag){
                engine.pause();
            //}
            
            this.scene.plume.render.sprite.targetSize(0);
            
            this.isDestroyed = false;
            this.mousePosition = {x : 0, y : 0};
            
            Matter.Body.setPosition(this.scene.marker, {x : -100, y : 0});
            this.marker = {x : -100, y : 0};
            
            this.gearPosition = 0;
            this.gearPositionTarget = 0;
            
            this.landedCounter = 0;
            this.landed = false;

            this.sandbox = null;
        }
        
        destruct(){
            Matter.Events.off(this.matter.mConstraint, "mousemove", this._mousemove);
        }
        
        // 物理帧
        tick() {
            var { engine, world, render, mouse, mConstraint } = this.matter;
            this.time += 1 / 60;
            //console.log('tick');
            
            if (!engine.paused){
                // cam
                this.matter.engine.camTarget.x = this.scene.rocket.position.x;
                this.matter.engine.camTarget.y = this.scene.rocket.position.y;
                // control
                if (this.sandbox != null && !this.isDestroyed){
                    // ---- prepare input variables
                    var pos = icoor(this.scene.rocket.position);
                    var vel = icoor(this.scene.rocket.velocity);
                    vel.x *= 60; vel.y *= 60; // 转换为m/s
                    this.sandbox.setGlobal('vessel', {
                        position : pos,
                        velocity : vel,
                        angle : Math.PI / 2 - this.scene.rocket.angle,
                        angularVelocity : -this.scene.rocket.angularVelocity * 60,
                        mass : this.scene.rocket.mass * massUnit,
                        dryMass : dryMass * massUnit,
                        isp : Isp,
                        maxThrust : maxThrust * massUnit,
                        maxGimbal : maxGimbal,
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
                    this.throttle = (isNaN(this.throttle) || this.throttle == null) ? 0 : clamp(this.throttle, 0, 1);
                    this.throttle = limitMinThr(this.throttle, minThrottle);
                    this.gimbal = (isNaN(this.gimbal) || this.gimbal == null) ? 0 : clamp(-this.gimbal, -1, 1);
                }
                else {
                    // no control
                    this.throttle = 0;
                    this.gimbal = 0;
                    // no plume;
                    this.scene.plume.render.sprite.targetSize(0);
                }
                
                // plume
                var rocketPos = this.scene.rocket.position;
                var rocketRot = this.scene.rocket.angle;
                var plumeRot = rocketRot + lerp(0, maxGimbal, this.gimbal);
                var thrust = clamp(this.throttle * maxThrust, 0, (this.scene.rocket.mass - dryMass) * Isp / (1/60)); // thrust = 0 if theres no fuel
                this.scene.plume.render.sprite.targetSize(lerp(0, 5, thrust / maxThrust));
                var newMass = this.scene.rocket.mass - 1/60 * thrust / Isp;//console.log(newMass);
                Matter.Body.setPosition(this.scene.plume, { 
                    x : rocketPos.x + this.scene.rocket.velocity.x - (plumeOffset - centerOffset) * Math.sin(rocketRot), 
                    y : rocketPos.y + this.scene.rocket.velocity.y + (plumeOffset - centerOffset) * Math.cos(rocketRot) 
                });
                Matter.Body.setAngle(this.scene.plume, plumeRot);
                // thrust
                Matter.Body.applyForce(this.scene.rocket, this.scene.plume.position, 
                    { x : thrust * Math.sin(plumeRot) * 1e-6, y : -thrust * Math.cos(plumeRot) * 1e-6 });
                Matter.Body.setMass(this.scene.rocket, newMass);
                
                // marker
                this.marker.x = (isNaN(this.marker.x) || this.marker.x == null) ? -100 : this.marker.x;
                this.marker.y = (isNaN(this.marker.y) || this.marker.y == null) ? -100 : this.marker.y;
                Matter.Body.setPosition(this.scene.marker, icoor(this.marker));
                
                // check landed
                if ((!this.isDestroyed) && this.throttle == 0 && Math.abs(this.scene.rocket.speed) < 0.01){
                    this.landedCounter++;
                    if (this.landedCounter >= 30 && !this.landed){
                        this.landed = true;
                        this.ui.log(`successfully landed. fuel consumed = ${((mass - this.scene.rocket.mass)*massUnit/1000).toFixed(8)}t, errorX = ${Math.abs(175 - this.scene.rocket.position.x)}.`, 3);
                    }
                }
                else{
                    this.landedCounter = 0;
                }
            }
            // gear
            this.gearPosition = moveTowards(this.gearPosition, this.gearPositionTarget, 1/60);
            this.setGear(lerp(0, Math.PI / 4 * 3, this.gearPosition));
        }
        
        onCollision(pairs) {
            // rocket explosion
            pairs.forEach(({ bodyA, bodyB }) => {
                //console.log(bodyA, bodyB);
                if ((!this.isDestroyed) && (bodyA == this.scene.rocket || bodyB == this.scene.rocket)){
                    var other = bodyA == this.scene.rocket ? bodyB : bodyA;
                    if (other.isBorder){
                        ui.log('vessel is out of border', 1);
                        this.isDestroyed = true;
                    }
                    else{
                        var vi = this.scene.rocket.speed * 60;
                        if (vi > 5 || this.gearPosition < 0.95){
                            ui.log('vessel destroyed, impact velocity = ' + vi, 1);
                            setSprite(this.scene.rocket, 165, rocketHeight, 'levels/res/f9_d.png');
                            this.isDestroyed = true;
                        }
                       // console.log(vi);
                    }
                }
            });
        }
        
        exec(code, langtype) {
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
                this.sandbox.defFunc('setMarker', [0.1, 0.1], (x, y) => this.marker = {x, y});
                this.sandbox.defFunc('extendGear', [], () => this.gearPositionTarget = 1);
                this.sandbox.defFunc('retractGear', [], () => this.gearPositionTarget = 0);
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
// 示例代码：横向级联速度反馈
var phase = 0;
function update(){
    
    // height control
    var groundHeight = 8.01; // 落地时重心高度
    var h = vessel.position.y - groundHeight;
    // 预估落地所需加速度和推力
    var estAcc = Math.pow(vessel.velocity.y, 2) / (2 * h) + 9.81;
    var maxAcc = vessel.maxThrust / vessel.mass;
    var estThr = estAcc / maxAcc;
    
    if (phase == 0){
        if (estThr > 0.95){
            phase = 1;
        }
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
        var targetAngle = (90 - 0.25 * (xErr + vxErr*5)) * Math.PI / 180;

        // angle control
        var angleErr = targetAngle - vessel.angle;
        var avelErr = 0 - vessel.angularVelocity;
        setGimbal(- 100 *(angleErr + avelErr * 1.5));
        
        if (h < 30) {
            extendGear();
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
# 示例代码：横向级联速度反馈
phase = 0
def update():
    # TODO : do some calculations
    setThrottle(1)
    setGimbal(0)
`,
            cpp : `
// 示例代码：咕咕咕
void update(){
    // TODO : do some calculations
    setThrottle(1);
    setGimbal(0);
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
<p>注2：运行的时候先重置场景，再上传代码，再恢复暂停，这样可以保证每次初始条件完全相同。由于物理引擎是固定时间步长，所以同样的初始条件+同样的代码能保证得出同样的结果。以相同初始条件运行，也可以比较出不同算法之间的性能优劣</p>`;
        // 全局变量描述
        documentation = {
            setGimbal : {
                type : 'function',
                desc : '设置推力矢量角度',
                params : {
                    gimbal : {
                        type : 'float',
                        desc : '喷口摆动的角度，1代表逆时针最大摆角，-1代表顺时针最大摆角',
                    },
                },
            },
            setThrottle : {
                type : 'function',
                desc : '设置节流阀百分比',
                params : {
                    throttle : {
                        type : 'float',
                        desc : '节流阀百分比，0表示无推力，1表示最大推力',
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
            retractGear : {
                type : 'function',
                desc : '收着陆架',
            },
            extendGear : {
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
                    mass : {
                        type : 'float',
                        desc : '火箭总质量（含剩余燃料质量），单位kg',
                    },
                    dryMass : {
                        type : 'float',
                        desc : '火箭干质量，单位kg',
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


