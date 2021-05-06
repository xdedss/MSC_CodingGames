

// °

define([
    'image!levels/res/circle_cyan.png', 'image!levels/res/circle_yellow.png', 'image!levels/res/circle_grey.png', 
    'image!levels/res/arrowx3.png',
], function(){
    
    function setSpritePath(body, path) {
        body.render.sprite.texture = path;
    }
    
    function setSpriteSize(body, srcSize, tgtSize) {
        var sc = tgtSize / srcSize;
        body.render.sprite.xScale = sc;
        body.render.sprite.yScale = sc;
    }
    
    function distance(p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    
    // 在Level中使用
    class Checkpoint {
                
        constructor(size) {
            
            this.size = size;
            
            this.body = Matter.Bodies.rectangle(0, 0, size, size, {
                
            });
            this.body.collisionFilter.mask = 0;
            Matter.Body.setStatic(this.body, true);
            setSpriteSize(this.body, 128, size);
            
            this.arrow = Matter.Bodies.rectangle(0, 0, size, size, {
                
            });
            this.arrow.collisionFilter.mask = 0;
            Matter.Body.setStatic(this.arrow, true);
            setSpriteSize(this.arrow, 128, size / 2);
            setSpritePath(this.arrow, 'levels/res/arrowx3.png');
            
            this.state = -1;
            this.markState(this.state);
            this.pointTowards(null);
        }
        
        get position(){
            return this.body.position;
        }
        set position(v){
            Matter.Body.setPosition(this.body, v);
        }
        
        check(pos) {
            return distance(pos, this.position) < (this.size / 2);
        }
        
        // -1=passed 0=current 1=future
        markState(state) {
            switch(state) {
                case -1:
                    setSpritePath(this.body, 'levels/res/circle_cyan.png')
                    break;
                case 0:
                    setSpritePath(this.body, 'levels/res/circle_yellow.png')
                    break;
                case 1:
                    setSpritePath(this.body, 'levels/res/circle_grey.png')
                    break;
                default:
                    throw 'unknown state ' + state;
            }
            this.state = state;
        }
        
        pointTowards(pos) {
            if (pos == null) {
                this.arrow.render.visible = false;
            }
            else {
                this.arrow.render.visible = true;
                var dx = pos.x - this.body.position.x;
                var dy = pos.y - this.body.position.y;
                var mag = Math.sqrt(dx * dx + dy * dy);
                dx /= mag; dy /= mag;
                var x = this.body.position.x + dx * this.size;
                var y = this.body.position.y + dy * this.size;
                Matter.Body.setPosition(this.arrow, { x, y });
                Matter.Body.setAngle(this.arrow, Math.atan2(dx, -dy))
            }
        }
        
        init(engine) {
            this.engine = engine;
            Matter.World.add(engine.world, [this.body, this.arrow]);
        }
        
        uninit(){
            
            Matter.Composite.remove(this.engine.world, this.body);
            Matter.Composite.remove(this.engine.world, this.arrow);
        }
            
    }
    
    return Checkpoint;
    
});


