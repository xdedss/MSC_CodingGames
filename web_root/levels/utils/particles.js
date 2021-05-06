

// °

define([], function(){
    
    function setSpritePath(body, path){
        body.render.sprite.texture = path;
    }
    
    function setSpriteSize(body, srcSize, tgtSize){
        var sc = tgtSize / srcSize;
        body.render.sprite.xScale = sc;
        body.render.sprite.yScale = sc;
    }
    
    
    
    
    // 在Level中使用
    class ParticleSystem {
        
        lifeMax = 1;
        lifeMin = 1;
        
        constructor(maxAmount, accelFunc, sizeOverTime) {
            if (accelFunc == null) {
                accelFunc = function(pos, vel) {
                    return { x : 0, y : 0 };
                }
            }
            else if (typeof(accelFunc) != 'function'){
                var accelVal = accelFunc;
                accelFunc = () => accelVal;
            }
            if (sizeOverTime == null) {
                sizeOverTime = function(t) {
                    return 1 - t * t;
                }
            }
            else if (typeof(sizeOverTime) != 'function'){
                var sizeVal = sizeOverTime;
                sizeOverTime = () => sizeVal;
            }
            this.accelFunc = accelFunc;
            this.sizeOverTime = sizeOverTime;
            this.spriteOriginal = 1;
            this.pool = [];
            this.poolAvailable = new Set();
            for (var i = 0; i < maxAmount; i++) {
                var body = Matter.Bodies.rectangle(0, 0, 100, 100, {
                    
                });
                body.render.visible = false;
                body.collisionFilter.mask = 0;
                Matter.Body.setStatic(body, true);
                this.pool.push(body);
                this.poolAvailable.add(body);
                // some flags
                body.isAlive = false;
            }
        }
        
        setLife(life1, life2) {
            if (life2 == null){
                this.lifeMin = life1;
                this.lifeMax = life1;
            }
            else{
                this.lifeMin = life1;
                this.lifeMax = life2;
            }
        }
        
        setSprite(spritePath, spriteOriginal) {
            for (var i = 0; i < this.pool.length; i++){
                var body = this.pool[i];
                setSpritePath(body, spritePath);
                this.spriteOriginal = spriteOriginal;
            }
        }
        
        emit(worldPos, worldVel) {
            worldVel = worldVel || {x:0, y:0};
            // find sleeping particle
            var body = null;
            if (this.poolAvailable.size > 0) {
                // take out first
                body = this.poolAvailable.values().next().value;
                this.poolAvailable.delete(body);
            }
            else {
                // no available grab random
                body = this.pool[Math.floor(Math.random() * this.pool.length)];
            }
            // emit
            body.age = 0;
            body.life = this.lifeMin + (this.lifeMax - this.lifeMin) * Math.random();
            Matter.Body.setPosition(body, worldPos);
            body.virtualVel = worldVel;
            body.isAlive = true;
            // visible
            body.render.visible = true;
            // size
            setSpriteSize(body, this.spriteOriginal, this.sizeOverTime(0));
        }
        
        clear() {
            for (var i = 0; i < this.pool.length; i++){
                var body = this.pool[i];
                if (body.isAlive) {
                    body.isAlive = false;
                    body.render.visible = false;
                    this.poolAvailable.add(body);
                }
            }
        }
        
        init(engine) {
            this.engine = engine;
            this._ontick = () => {
                if (!engine.paused){
                    // check life
                    for (var i = 0; i < this.pool.length; i++){
                        var body = this.pool[i];
                        if (body.isAlive){
                            body.age += 1 / 60.0;
                            if (body.life > 0 && body.age > body.life) {
                                body.isAlive = false;
                                body.render.visible = false;
                                this.poolAvailable.add(body);
                                continue;
                            }
                            // dynaimcs
                            var accel = this.accelFunc(body.position, body.virtualVel);
                            body.virtualVel.x += (accel.x) / 60.0;
                            body.virtualVel.y += (accel.y) / 60.0;
                            var x = body.position.x + (body.virtualVel.x) / 60.0;
                            var y = body.position.y + (body.virtualVel.y) / 60.0;
                            Matter.Body.setPosition(body, {x, y});
                            // size
                            setSpriteSize(body, this.spriteOriginal, this.sizeOverTime(body.age / body.life));
                        }
                        
                    }
                }
            };
            Matter.Events.on(engine, 'tick', this._ontick);
            
            Matter.World.add(engine.world, this.pool);
        }
        
        uninit(){
            Matter.Events.off(this.engine, 'tick', this._ontick);
            
            for (var i = 0; i < this.pool.length; i++){
                Matter.Composite.remove(this.engine.world, this.pool[i]);
            }
        }
            
    }
    
    return ParticleSystem;
    
});


