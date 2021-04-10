
// AMD

define(['sandbox-wrap'], function(Sandbox){
    
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
    
    
    var originalH = 1920;
    var originalW = 1920;
    var bgWidth = 500;
    var bgHeight = 500 * originalH / originalW;
    var groundLevel = 76 * bgHeight / originalH;
    var minX = 1;
    var maxX = bgWidth - 1;
    var minY = -bgHeight + 1 + groundLevel;
    var maxY = groundLevel - 1;
    
    var maxGimbal = 15 * Math.PI / 180;
    var maxThrust = 15000;
    var mass = 1000;
    
    return {
        // 初始化 向matter场景里面添加东西
        init : function(app) {
            var {ui, matter} = app;
            this.matter = matter;
            this.ui = ui;
            var { engine, world, render, mouse, mConstraint } = this.matter;
            console.log('init');
            
            
            // add objects to scene
            this.scene = {};
            
            this.scene.background = Matter.Bodies.rectangle(500 / 2, -bgHeight / 2 + groundLevel, bgWidth, bgHeight, {
                isStatic : true,
                collisionFilter : {
                    mask : 0
                },
                zindex : -10,
            })
            setSprite(this.scene.background, originalW, bgWidth, 'levels/launchpads.png');
            
            this.scene.ground = Matter.Bodies.rectangle(bgWidth / 2, 100, bgWidth + 200, 200, {
                isStatic : true,
                render : { 
                    fillStyle : 'none',
                },
            });
            this.scene.lborder = Matter.Bodies.rectangle(-100, -bgHeight / 2, 200, bgHeight, {
                isStatic : true,
                render : { 
                    fillStyle : 'none',
                },
                destructive : true,
            });
            this.scene.rborder = Matter.Bodies.rectangle(bgWidth+100, -bgHeight / 2, 200, bgHeight, {
                isStatic : true,
                render : { 
                    fillStyle : 'none',
                },
                destructive : true,
            });
            this.scene.uborder = Matter.Bodies.rectangle(bgWidth / 2, -bgHeight + groundLevel - 100, bgWidth + 200, 200, {
                isStatic : true,
                render : { 
                    fillStyle : 'none',
                },
                destructive : true,
            });
            // Rocket
            this.scene.rocket = Matter.Bodies.rectangle(0, 0, 6, 8, {
                frictionAir : 0.001,
            });
            setSprite(this.scene.rocket, 111, 8, 'levels/watertower.png');
            Matter.Body.setMass(this.scene.rocket, mass);
            // Plume
            this.scene.plume = Matter.Bodies.rectangle(0, 2, 1, 1, {
                isStatic : true,
                collisionFilter : {
                    mask : 0
                },
                zindex : -1,
            });
            setSprite(this.scene.plume, 32, 3, 'levels/plume.png');
            this.scene.plume.render.sprite.yOffset = 0;
            
            // add all into scene
            var bodies = [];
            for (var k in this.scene) {
                if (this.scene[k].parent == this.scene[k]){
                    bodies.push(this.scene[k]);
                }
            }
            bodies.sort((a, b) => {
                a = (a.zindex == null) ? 0 : a.zindex;
                b = (b.zindex == null) ? 0 : b.zindex;
                return a - b;
            });
            Matter.World.add(world, bodies);
            
            // cam limit
            engine.camLimit.maxX = maxX;
            engine.camLimit.minX = minX;
            engine.camLimit.maxY = maxY;
            engine.camLimit.minY = minY;
            engine.camLimit.maxSize = 200;
            engine.camLimit.minSize = 50;
            
            this.reset();
        }
        ,
        // 重置 重设各个物体的位置
        reset : function() {
            var { engine, world, render, mouse, mConstraint } = this.matter;
            console.log('reset');
            
            this.time = 0;
            
            engine.camTarget.x = 134;
            engine.camTarget.y = -40;
            engine.camTarget.size = 100;
            
            var pauseFlag = false;
            if (engine.paused) {
                engine.resume();
                pauseFlag = true;
            }
            
            Matter.Body.setPosition(this.scene.rocket, icoor(134.5, 4.1));
            Matter.Body.setAngle(this.scene.rocket, 0);
            Matter.Body.setVelocity(this.scene.rocket, {x:0, y:0});
            Matter.Body.setAngularVelocity(this.scene.rocket, 0)
            
            if (pauseFlag){
                engine.pause();
            }
            
            this.scene.plume.render.sprite.targetSize(0);
            
//            // reset code as well
//            if (this.currentCode != null){
//                this.exec(this.currentCode);
//            }

            this.sandbox = null;
        }
        ,
        // clean up 之前添加的物体全部清除
        terminate : function(){
            var { engine, world, render, mouse, mConstraint } = this.matter;
            for (var k in this.scene) {
                Matter.Composite.remove(world, this.scene[k]);
            }
            
        }
        ,
        // 物理帧
        tick : function() {
            var { engine, world, render, mouse, mConstraint } = this.matter;
            this.time += 1 / 60;
            //console.log('tick');
            
            if (!engine.paused){
                // control
                if (this.sandbox != null){
                    // ---- prepare input variables
                    var pos = icoor(this.scene.rocket.position);
                    var vel = icoor(this.scene.rocket.velocity);
                    vel.x *= 60; vel.y *= 60; // 转换为m/s
                    this.sandbox.addGlobal('vessel', {
                        position : pos,
                        velocity : vel,
                        angle : Math.PI / 2 - this.scene.rocket.angle,
                        angularVelocity : -this.scene.rocket.angularVelocity * 60,
                        mass : this.scene.rocket.mass,
                        maxThrust : maxThrust,
                        maxGimbal : maxGimbal,
                    });
                    this.sandbox.addGlobal('time', this.time);
                    this.sandbox.addGlobal('dt', 1/60);
                    // try update
                    try {
                        this.sandbox.evalSync('update()');
                    }
                    catch (e) {
                        this.ui.logError(e);
                    }
                    // clamp value
                    this.throttle = (isNaN(this.throttle) || this.throttle == null) ? 0 : clamp(this.throttle, 0, 1);
                    this.gimbal = (isNaN(this.gimbal) || this.gimbal == null) ? 0 : clamp(-this.gimbal, -1, 1);
                    // plume
                    this.scene.plume.render.sprite.targetSize(lerp(0, 3, this.throttle));
                    var rocketPos = this.scene.rocket.position;
                    var rocketRot = this.scene.rocket.angle;
                    var plumeOffset = 2.5;
                    var plumeRot = rocketRot + lerp(0, maxGimbal, this.gimbal);
                    Matter.Body.setPosition(this.scene.plume, { x : rocketPos.x - plumeOffset * Math.sin(rocketRot), y : rocketPos.y + plumeOffset * Math.cos(rocketRot) });
                    Matter.Body.setAngle(this.scene.plume, plumeRot);
                    // thrust
                    Matter.Body.applyForce(this.scene.rocket, this.scene.plume.position, 
                        { x : this.throttle * maxThrust * Math.sin(plumeRot) * 1e-6, y : -this.throttle * maxThrust * Math.cos(plumeRot) * 1e-6 });
                }
                else {
                    // no control
                    this.throttle = 0;
                    this.gimbal = 0;
                    // no plume;
                    this.scene.plume.render.sprite.targetSize(0);
                }
                
            }
        }
        ,
        // 接收用户代码
        exec : function(code, factory){
            this.currentCode = code;
            // sandbox setup
            this.sandbox = factory();
            var log = m => this.ui.log(m);
            this.sandbox.addGlobal('log', log);
            this.sandbox.addGlobal('console', {log : log});
            this.sandbox.addGlobal('setThrottle', v => this.throttle = v);
            this.sandbox.addGlobal('setGimbal', v => this.gimbal = v);
            try{
                this.sandbox.runSync(code);
                var updateFunc = this.sandbox.evalSync('update');
                if (typeof(updateFunc) != 'function'){
                    ui.log('Error: update is not a function', 2);
                    this.sandbox = null;
                }
            }
            catch(e){
                this.ui.logError(e);
                this.sandbox = null;
            }
        },
        
        
        
        
        // 默认代码模板
        template : "\nfunction update() {\n    setThrottle(1);\n    setGimbal(0);\n}\n",
        // level描述信息
        desc : `
<p>这是一个demo场景，只是一个沙盒，没有设置目标，在这里你可以通过setThrottle和setGimbal控制一个<del>水塔</del>火箭起飞、悬停和降落。</p>
<p>每个物理帧会调用一次代码中的update函数，可以通过全局变量获取火箭当前的状态，计算并施加节流阀和推力矢量的控制。</p>`,
        // 文档帮助信息 描述该level给使用者提供的环境变量
        documentation : {
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
            console : {
                type : 'object',
                children : {
                    log : {
                        type : 'function',
                        desc : 'console.log打印调试信息',
                        params : {
                            message : {
                                type : 'any',
                                desc : '要打印的信息',
                            },
                        },
                    },
                },
            },
        },
        
        
    };
    // end of return
});





