
// 让body更好用

define([], function(){
    
    // 使用例：在Level子类中
    // this.addObject(this.xxx = new Body('circle', x, y, r, [options]);
    // this.xxx.position = xxx;
    // this.xxx.angle = xxx;
    // this.xxx.setSpritePath('xxx');
    class Body{
        constructor(type){
            if (typeof(type) !== 'string'){
                throw new Exception('invalid type');
            }
            var params = Array.from(arguments);
            params.shift();
            switch (type){
                case 'circle':
                    this.body = Matter.Bodies.circle(..params);
                    break;
                case 'polygon':
                    this.body = Matter.Bodies.polygon(..params);
                    break;
                case 'rectangle':
                    this.body = Matter.Bodies.rectangle(..params);
                    break;
                case 'trapezoid':
                    this.body = Matter.Bodies.trapezoid(..params);
                    break;
            }
        }
        
        
        get position(){
            return this.body.position;
        }
        set position(v){
            Matter.Body.setPosition(this.body, v);
        }
        
        get velocity(){
            var v = this.body.velocity;
            return {x : v.x * 60, y : v.y * 60};
        }
        set velocity(v){
            Matter.Body.setVelocity(this.body, {x : v.x / 60, y : v.y / 60});
        }
        
        get angle(){
            return this.body.angle;
        }
        set angle(v){
            Matter.Body.setAngle(this.body, v);
        }
        
        get angularVelocity(){
            return this.body.angularVelocity;
        }
        set angularVelocity(v){
            Matter.Body.setAngularVelocity(this.body, v);
        }
        
        
        
        setSpritePath( path){
            this.body.render.sprite.texture = path;
        }
        
        setSpriteSize(srcSize, tgtSize){
            var sc = tgtSize / srcSize;
            this.body.render.sprite.xScale = sc;
            this.body.render.sprite.yScale = sc;
        }
        
        
        
        init(engine){
            Matter.World.add(engine.world, [this.body]);
        }
        
        uninit(engine){
            Matter.Composite.remove(engine.world, this.body);
        }
        
    }
    
    return Body;
    
});




