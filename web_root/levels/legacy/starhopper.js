

// demo场景


define([
    'level', 'levels/utils/launchpads', 'sandbox-wrap', 
    'image!levels/res/watertower.png', 'image!levels/res/watertower_d.png', 'image!levels/res/plume.png'
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
    // N = kg * m / s^2
    const maxGimbal = 15 * Math.PI / 180;
    const maxThrust = 1500 * 1000 / massUnit;
    const mass = 100 * 1000 / massUnit;
    const frictionAir = 0.001;
    const plumeOffset = 4;
    const rocketHeight = 12;
    const rocketWidth = 9;
    
    class LevelStarhopper extends Level {
        
        // 初始化
        init() {
            console.log('starhopper init');
            // launchpad background
            launchpads.setup(this);
            
            // Rocket
            this.scene.rocket = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight, {
                frictionAir : frictionAir,
                friction : 0.8,
            });
            Matter.Body.setMass(this.scene.rocket, mass);
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
            this.matter.engine.camLimit.minSize = 30;
            
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
            console.log('starhopper reset');
            var engine = this.matter.engine;
            
            this.time = 0;
            
            engine.camTarget.x = 134;
            engine.camTarget.y = -40;
            engine.camTarget.size = 100;
            
            var pauseFlag = false;
            if (engine.paused) {
                engine.resume();
                pauseFlag = true;
            }
            
            Matter.Body.setPosition(this.scene.rocket, icoor(134.5, rocketHeight / 2 + 0.01));
            Matter.Body.setAngle(this.scene.rocket, 0);
            Matter.Body.setVelocity(this.scene.rocket, {x:0, y:0});
            Matter.Body.setAngularVelocity(this.scene.rocket, 0)
            setSprite(this.scene.rocket, 111, rocketHeight, 'levels/res/watertower.png');
            
            if (pauseFlag){
                engine.pause();
            }
            
            this.scene.plume.render.sprite.targetSize(0);
            
            this.isDestroyed = false;
            this.mousePosition = {x : 0, y : 0};
            
            Matter.Body.setPosition(this.scene.marker, {x : -100, y : 0});
            this.marker = {x : -100, y : 0};

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
                this.scene.plume.render.sprite.targetSize(lerp(0, 3, this.throttle));
                var rocketPos = this.scene.rocket.position;
                var rocketRot = this.scene.rocket.angle;
                var plumeRot = rocketRot + lerp(0, maxGimbal, this.gimbal);
                Matter.Body.setPosition(this.scene.plume, { x : rocketPos.x - plumeOffset * Math.sin(rocketRot), y : rocketPos.y + plumeOffset * Math.cos(rocketRot) });
                Matter.Body.setAngle(this.scene.plume, plumeRot);
                // thrust
                Matter.Body.applyForce(this.scene.rocket, this.scene.plume.position, 
                    { x : this.throttle * maxThrust * Math.sin(plumeRot) * 1e-6, y : -this.throttle * maxThrust * Math.cos(plumeRot) * 1e-6 });
                
                // marker
                this.marker.x = (isNaN(this.marker.x) || this.marker.x == null) ? -100 : this.marker.x;
                this.marker.y = (isNaN(this.marker.y) || this.marker.y == null) ? -100 : this.marker.y;
                Matter.Body.setPosition(this.scene.marker, icoor(this.marker));
                
            }
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
                        if (vi > 5){
                            ui.log('vessel destroyed, impact velocity = ' + vi, 1);
                            setSprite(this.scene.rocket, 111, rocketHeight, 'levels/res/watertower_d.png');
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
<p>这是一个demo场景，只是一个沙盒，没有设置目标。在这里你可以通过setThrottle和setGimbal控制一个<del>水塔</del>火箭起飞、悬停和降落。</p>
<p>为了方便测试，这个飞行器安装了不消耗燃料、推力连续可调的魔法发动机。</p>
<p>每个物理帧会调用一次代码中的update函数，可以通过全局变量获取火箭当前的状态，计算并施加节流阀和推力矢量的控制。</p>
<p>⚠Fly Safe——碰撞速度大于5m/s会导致<b>Rapid Unscheduled Disassembly</b></p>`;
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


