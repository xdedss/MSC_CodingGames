

define([
'levels/utils/animatedbody',
'image!levels/res/watertower.png', 'image!levels/res/watertower_d.png', 'image!levels/res/plume.png'
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
    
    // N = kg * m / s^2
    const maxGimbalAngle = 15 * Math.PI / 180;
    const maxThrust = 1500 * 1000;
    const mass = 100 * 1000;
    const frictionAir = 0.001;
    const friction = 0.8;
    const thrustOffset = {x : 0, y : 4};
    
    const rocketHeight = 12;
    const rocketWidth = 9;
    
    const rocketImgHeight = 111;
    const plumeImgHeight = 32;
    
    // 在Level中使用
    // 使用例：
    // this.addObject(this.hopper = new Hopper(massUnit));
    // 之后
    // this.hopper.gimbal = xxx;
    // this.hopper.throttle = xxx;
    // this.hopper.position = xxx;
    class HopperVessel{
        
        constructor(massUnit){
            this.massUnit = massUnit || 100000;
            this.params = {};
            
            // build rocket entity
            this.rocket = new AnimatedBody((() => {
                var body = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight, {
                    frictionAir : frictionAir,
                    friction : friction,
                });
                Matter.Body.setMass(body, mass / this.massUnit);
                return body;
            })());
            
            // rocket sprite
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, rocketWidth, rocketHeight);
                setSpriteSize(body, rocketImgHeight, rocketHeight);
                return body;
            })(), ['isDestroyed'], (body, params) => {
                if (params.isDestroyed){
                    setSpritePath(body, 'levels/res/watertower_d.png');
                }
                else{
                    setSpritePath(body, 'levels/res/watertower.png');
                }
            }, 0);
            
            // plume
            this.rocket.addPart((()=>{
                var body = Matter.Bodies.rectangle(0, 0, 1, 1);
                setSpritePath(body, 'levels/res/plume.png');
                body.render.sprite.yOffset = 0;
                body.localPos = { x : thrustOffset.x, y : thrustOffset.y, angle : 0};
                return body;
            })(), ['throttle', 'gimbal'], (body, params) => {
                setSpriteSize(body, plumeImgHeight, lerp(0, 4, params.throttle));
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
                mass : mass,
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
        
        get maxThrust(){
            return maxThrust;
        }
        get maxGimbal(){
            return maxGimbalAngle;
        }
        
        get height(){
            return rocketHeight;
        }
        get width(){
            return rocketWidth;
        }
        get centerHeight(){
            return rocketHeight / 2;
        }
        get mass(){
            return this.params.mass;
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
                if (this.isDestroyed) this.throttle = 0;
                if (!this.engine.paused){
                    Matter.Body.applyForce(this.rocket.physicalBody, l2w(this.rocket.physicalBody, thrustOffset), 
                        rot({x : 0, y : -this.params.throttle * maxThrust  / this.massUnit * 1e-6}, this.rocket.physicalBody.angle + lerp(0, maxGimbalAngle, this.params.gimbal)));
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
                            if (vi > 5){
                                if (this.onDestroyed != null){
                                    this.onDestroyed(vi);
                                }
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
    
    return HopperVessel;
    
});




