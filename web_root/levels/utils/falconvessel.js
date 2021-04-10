

define([
'levels/utils/animatedbody',
'image!levels/res/f9.png', 'image!levels/res/f9_d.png', 'image!levels/res/plume.png'
], function(AnimatedBody){
    
    function setSpritePath(body, path){
        body.render.sprite.texture = path;
    }
    
    function setSpriteSize(body, srcSize, tgtSize){
        var sc = tgtSize / srcSize;
        body.render.sprite.xScale = sc;
        body.render.sprite.yScale = sc;
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
    
    function l2w(body, l){
        var {x, y} = body.position;
        var c = Math.cos(body.angle);
        var s = Math.sin(body.angle);
        var dx = l.x * c - l.y * s;
        var dy = l.x * s + l.y * c;
        return {x : x + dx, y : y + dy};
    }
    
    function rot(l, angle){
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var dx = l.x * c - l.y * s;
        var dy = l.x * s + l.y * c;
        return {x : dx, y : dy};
    }
    
    function moveTowards(f, target, maxdelta){
        if (target > f) {
            return Math.min(target, f + maxdelta);
        }
        else{
            return Math.max(target, f - maxdelta);
        }
    }
    
    function sqrMag(v){
        return v.x*v.x + v.y*v.y;
    }
    
    // N = kg * m / s^2
    const maxGimbalAngle = 15 * Math.PI / 180;
    const maxThrust = 800 * 1000;
    const maxFinAngle = 15 * Math.PI / 180;
    //const mass = 32 * 1000;
    const dryMass = 25.6 * 1000;
    const minThrottle = 0.4;
    const Isp = 2770; // m/s
    const frictionAir = 0.0003;
    const friction = 0.8;
    const thrustOffset = {x : 0, y : 6};
    const gearOffset = 14;
    const gearSep = 3;
    const gearWidth = 1;
    const gearLength = 4;
    const finOffset = 24.5;
    const finCoeff = 2; // N  per  ((m/s)^2)
    
    const centerOffset = 9.5;
    const rocketHeight = 35;
    const rocketWidth = 3;
    
    const rocketImgHeight = 165;
    const plumeImgHeight = 32;
    
    // 在Level中使用
    // 使用例：
    // this.addObject(this.hopper = new Hopper(massUnit));
    // 之后
    // this.hopper.gimbal = xxx;
    // this.hopper.throttle = xxx;
    // this.hopper.position = xxx;
    class FalconVessel{
        
        constructor(massUnit){
            this.massUnit = massUnit || 100000;
            this.params = {};
            
            // build rocket entity
            this.rocket = new AnimatedBody((() => {
                var body = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight, {
                    frictionAir : frictionAir,
                    friction : friction,
                });
                Matter.Body.setCentre(body, {x:0, y:centerOffset}, true);
                Matter.Body.setMass(body, dryMass / this.massUnit);
                return body;
            })());
            
            // rocket sprite
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight * 2);
                setSpriteSize(body, rocketImgHeight, rocketHeight);
                body.render.sprite.yOffset = centerOffset / rocketHeight + 0.5;
                return body;
            })(), ['isDestroyed'], (body, params) => {
                if (params.isDestroyed){
                    setSpritePath(body, 'levels/res/f9_d.png');
                }
                else{
                    setSpritePath(body, 'levels/res/f9.png');
                }
            }, 0);
            
            //fin
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, 1.5, 0.5, {
                    render : { 
                        fillStyle : '#777',
                    },
                });
                body.localPos = { x : 0, y : -finOffset, angle : 0};
                return body;
            })(), ['fin'], (body, params) => {
                var gearAngle = lerp(0, maxFinAngle, params.fin);
                body.localPos.angle = gearAngle;
            }, 1);
            
            // gears
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, gearLength, gearWidth, {
                    render : { 
                        fillStyle : '#777',
                    },
                });
                return body;
            })(), ['gearDown'], (body, params) => {
                var gearAngle = lerp(0, 140, params.gearDown) * Math.PI / 180;
                var localOffX = gearLength / 2 * Math.sin(gearAngle);
                var localOffY = gearLength / 2 * Math.cos(gearAngle) + centerOffset;
                body.localPos.x = localOffX + gearSep / 2;
                body.localPos.y = gearOffset - localOffY;
                body.localPos.angle = Math.PI / 2 + gearAngle;
            }, 1);
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, gearLength, gearWidth, {
                    render : { 
                        fillStyle : '#777',
                    },
                });
                return body;
            })(), ['gearDown'], (body, params) => {
                var gearAngle = lerp(0, 140, params.gearDown) * Math.PI / 180;
                var localOffX = gearLength / 2 * Math.sin(gearAngle);
                var localOffY = gearLength / 2 * Math.cos(gearAngle) + centerOffset;
                body.localPos.x = -localOffX - gearSep / 2;
                body.localPos.y = gearOffset - localOffY;
                body.localPos.angle = Math.PI / 2 - gearAngle;
            }, 1);
            
            // plume
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, 1, 1);
                setSpritePath(body, 'levels/res/plume.png');
                body.render.sprite.yOffset = 0;
                body.localPos = { x : thrustOffset.x, y : thrustOffset.y, angle : 0};
                return body;
            })(), ['throttle', 'gimbal'], (body, params) => {
                setSpriteSize(body, plumeImgHeight, lerp(0, 5, params.throttle));
                body.localPos.angle = lerp(0, maxGimbalAngle, params.gimbal);
            }, -1);
            
            this.reset();
        }
        
        reset(){
            this.params = {
                isDestroyed : false,
                isOut : false,
                throttle : 0,
                gimbal : 0,
                fin : 0,
                gearDown : 0,
                gearDownTarget : 0,
                mass : dryMass,
            };
            this.rocket.set(this.params); // reset appearance
            
        }
        
        // 非常无聊的属性套娃
        get physicalBody(){
            return this.rocket.physicalBody;
        }
        
        get isOut(){
            return this.params.isOut;
        }
        get isDestroyed(){
            return this.params.isDestroyed;
        }
        
        get throttle(){
            return this.params.throttle;
        }
        set throttle(v){
            this.params.throttle = this.isDestroyed ? 0 : clamp(v, 0, 1);
        }
        
        get gimbal(){
            return this.params.gimbal;
        }
        set gimbal(v){
            this.params.gimbal = this.isDestroyed ? 0 : clamp(v, -1, 1);
        }
        
        get fin(){
            return this.params.fin;
        }
        set fin(v){
            this.params.fin = this.isDestroyed ? 0 : clamp(v, -1, 1);
        }
        
        get gearDown(){
            return this.params.gearDown;
        }
        set gearDown(v){
            this.params.gearDown = clamp(v, 0, 1);
        }
        
        get gearDownTarget(){
            return this.params.gearDownTarget;
        }
        set gearDownTarget(v){
            this.params.gearDownTarget = clamp(v, 0, 1);
        }
        
        get maxThrust(){
            return maxThrust;
        }
        get maxGimbal(){
            return maxGimbalAngle;
        }
        get maxFin(){
            return maxFinAngle;
        }
        
        get height(){
            return rocketHeight;
        }
        get width(){
            return rocketWidth;
        }
        get centerHeight(){
            return rocketHeight / 2 - centerOffset;
        }
        get mass(){
            return this.params.mass;
        }
        set mass(v){
            this.params.mass = Math.max(dryMass, v);
        }
        get dryMass(){
            return dryMass;
        }
        get Isp(){
            return Isp;
        }
        
        get position(){
            return this.physicalBody.position;
        }
        set position(v){
            Matter.Body.setPosition(this.physicalBody, v);
        }
        
        get velocity(){
            var v = this.physicalBody.velocity;
            return {x : v.x * 60, y : v.y * 60};
        }
        set velocity(v){
            Matter.Body.setVelocity(this.physicalBody, {x : v.x / 60, y : v.y / 60});
        }
        
        get angle(){
            return this.physicalBody.angle;
        }
        set angle(v){
            Matter.Body.setAngle(this.physicalBody, v);
        }
        
        get angularVelocity(){
            return this.physicalBody.angularVelocity * 60;
        }
        set angularVelocity(v){
            Matter.Body.setAngularVelocity(this.physicalBody, v / 60);
        }
        
        // initialization
        init(engine){
            this.engine = engine;
            this._ontick = () => {
                if (this.isDestroyed) {
                    this.throttle = 0;
                }
                else{
                        
                    if (!this.engine.paused){
                        // thrust
                        this.params.throttle = clamp(this.params.throttle, 0, (this.mass - dryMass) * Isp / (1/60) / maxThrust);
                        var thrust = this.params.throttle * maxThrust;
                        Matter.Body.applyForce(this.rocket.physicalBody, l2w(this.rocket.physicalBody, thrustOffset), 
                            rot({x : 0, y : - thrust / this.massUnit * 1e-6}, this.rocket.physicalBody.angle + lerp(0, maxGimbalAngle, this.params.gimbal)));
                        this.mass -= 1/60 * thrust / Isp;
                        Matter.Body.setMass(this.physicalBody, this.mass / this.massUnit);
                        // aero
                        var vel = this.velocity;
                        var finAngleWorld = this.params.fin * maxFinAngle + this.angle;
                        var aoa = Math.atan2(vel.x, -vel.y) - finAngleWorld;
                        var aeroForce = Math.sin(aoa) * sqrMag(this.velocity) * finCoeff;
                        //console.log(finAngleWorld, aoa, aeroForce);
                        Matter.Body.applyForce(this.rocket.physicalBody, l2w(this.rocket.physicalBody, {x:0, y:-finOffset}), 
                            rot({x : -aeroForce / this.massUnit * 1e-6, y : 0}, finAngleWorld));
                        
                        //gear
                        this.params.gearDown = moveTowards(this.params.gearDown, this.gearDownTarget, 1/60);
                        //console.log(this.params.gearDown, this.params.gearDownTarget);
                    }
                }
                this.rocket.set(this.params); // update appearance
            };
            this._oncollision = ({pairs}) => {
                pairs.forEach(({ bodyA, bodyB }) => {
                    //console.log(bodyA, bodyB);
                    if ((!this.params.isDestroyed) && (!this.params.isOut) && (bodyA == this.rocket.physicalBody || bodyB == this.rocket.physicalBody)){
                        var other = bodyA == this.rocket.physicalBody ? bodyB : bodyA;
                        if (other.isSensor) return;
                        if (other.isBorder){
                            //ui.log('vessel is out of border', 1);
                            this.params.isOut = true;
                        }
                        else{
                            var vi = this.rocket.physicalBody.speed * 60;
                            if (vi > 5 || this.params.gearDown < 0.95){
                                if (this.onDestroyed != null){
                                    this.onDestroyed(vi);
                                }
                                //console.log(vi, this.params.gearDown);
                                //ui.log('vessel destroyed, impact velocity = ' + vi, 1);
                                this.params.isDestroyed = true;
                            }
                           // console.log(vi);
                        }
                    }
                });
            };
            Matter.Events.on(engine, 'tick', this._ontick);
            Matter.Events.on(engine, 'collisionStart', this._oncollision);
            this.rocket.init(engine);
        }
        
        // undo initialization
        uninit(){
            Matter.Events.off(this.engine, 'tick', this._ontick);
            Matter.Events.off(this.engine, 'collisionStart', this._oncollision);
            this.rocket.uninit();
        }
        
    }
    
    return FalconVessel;
    
});




