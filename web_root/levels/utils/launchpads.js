


// 发射台场景基本setup

define(['image!levels/res/launchpads.png'], function(){
    
    function setSprite(body, srcSize, tgtSize, path){
        body.render.sprite.texture = path;
        body.render.sprite.xScale = tgtSize / srcSize;
        body.render.sprite.yScale = tgtSize / srcSize;
        body.render.sprite.srcSize = srcSize;
    }
    
    class LaunchpadsScene{
        
        constructor(borderHeight, offset){
            
            if (borderHeight === undefined) borderHeight = 500;
            if (offset === undefined) offset = {x : 0, y : 0};
            const bgImg = 'levels/res/launchpads.png';
            const originalH = 1920;
            const originalW = 1920;
            const bgWidth = 500;
            const bgHeight = 500 * originalH / originalW;
            const groundLevel = 76 * bgHeight / originalH;
            const minX = 1 + offset.x;
            const maxX = bgWidth - 1 + offset.x;
            const minY = -borderHeight + 1 + groundLevel + offset.y;
            const maxY = groundLevel - 1 + offset.y;
            
            this.bgimg = Matter.Bodies.rectangle(bgWidth / 2 + offset.x, -bgHeight / 2 + groundLevel + offset.y, bgWidth, bgHeight, {
                isStatic : true,
                collisionFilter : {
                    mask : 0
                },
            });
            setSprite(this.bgimg, originalW, bgWidth, bgImg);
            
            this.bgextend = Matter.Bodies.rectangle(bgWidth / 2 + offset.x, -borderHeight / 2 + offset.y , bgWidth, borderHeight, {
                isStatic : true,
                render : {
                    fillStyle : '#4580f0',
                },
                collisionFilter : {
                    mask : 0
                },
            });
            
            // background and walls
            this.walls = [];
            this.walls.push( Matter.Bodies.rectangle(bgWidth / 2 + offset.x, 100, bgWidth + 200 + offset.y, 200, {
                isStatic : true,
                render : { 
                    fillStyle : 'transparent',
                },
                friction : 0.8,
            }) );
            this.walls.push( Matter.Bodies.rectangle(-100 + offset.x, -borderHeight / 2 + offset.y, 200, borderHeight, {
                isStatic : true,
                isSensor : true,
                render : { 
                    fillStyle : 'transparent',
                },
                friction : 0.0,
                isBorder : true,
            }) );
            this.walls.push( Matter.Bodies.rectangle(bgWidth+100 + offset.x, -borderHeight / 2 + offset.y, 200, borderHeight, {
                isStatic : true,
                isSensor : true,
                render : { 
                    fillStyle : 'transparent',
                },
                friction : 0.0,
                isBorder : true,
            }) );
            this.walls.push( Matter.Bodies.rectangle(bgWidth / 2 + offset.x, -borderHeight + groundLevel - 100 + offset.y, bgWidth + 200, 200, {
                isStatic : true,
                isSensor : true,
                render : { 
                    fillStyle : 'transparent',
                },
                friction : 0.0,
                isBorder : true,
            }) );
            
            this.minX = minX;
            this.maxX = maxX;
            this.minY = minY;
            this.maxY = maxY;
            
            this.landingPads = [
                { x : 134.75 + offset.x, y : 0 + offset.y},
                { x : 175.50 + offset.x, y : 0 + offset.y},
                { x : 431.20 + offset.x, y : 0 + offset.y},
            ];
            
        }
        
        init(engine){
            this.engine = engine;
            Matter.World.add(engine.world, [this.bgextend, this.bgimg]);
            Matter.World.add(engine.world, this.walls);
            
            // cam limit
            engine.camLimit.maxX = this.maxX;
            engine.camLimit.minX = this.minX;
            engine.camLimit.maxY = this.maxY;
            engine.camLimit.minY = this.minY;
            engine.camLimit.maxSize = 200;
            engine.camLimit.minSize = 50;
        }
        
        uninit(){
            Matter.Composite.remove(this.engine.world, this.bgextend);
            Matter.Composite.remove(this.engine.world, this.bgimg);
            for (var i = 0; i < this.walls.length; i++){
                Matter.Composite.remove(this.engine.world, this.walls[i]);
            }
        }
        
    }
    
    return LaunchpadsScene;
    
//    
//    var setup = function(self, borderHeight) {
//        
//        if (borderHeight === undefined) borderHeight = 500;
//        const bgImg = 'levels/res/launchpads.png';
//        const originalH = 1920;
//        const originalW = 1920;
//        const bgWidth = 500;
//        const bgHeight = 500 * originalH / originalW;
//        //const borderHeight = 1000;
//        const groundLevel = 76 * bgHeight / originalH;
//        const minX = 1;
//        const maxX = bgWidth - 1;
//        const minY = -borderHeight + 1 + groundLevel;
//        const maxY = groundLevel - 1;
//        
//        ((function(){
//            var bgimg = Matter.Bodies.rectangle(bgWidth / 2, -bgHeight / 2 + groundLevel, bgWidth, bgHeight, {
//                isStatic : true,
//                collisionFilter : {
//                    mask : 0
//                },
//            });
//            setSprite(bgimg, originalW, bgWidth, bgImg);
//            this.addObject(bgimg, -10);
//            
//            this.addObject( Matter.Bodies.rectangle(bgWidth / 2, -borderHeight / 2 , bgWidth, borderHeight, {
//                isStatic : true,
//                render : {
//                    fillStyle : '#4580f0',
//                },
//                collisionFilter : {
//                    mask : 0
//                },
//            }), -20);
//            
//            // background and walls
//            this.addObject( Matter.Bodies.rectangle(bgWidth / 2, 100, bgWidth + 200, 200, {
//                isStatic : true,
//                render : { 
//                    fillStyle : 'transparent',
//                },
//                friction : 0.8,
//            }) );
//            this.addObject( Matter.Bodies.rectangle(-100, -borderHeight / 2, 200, borderHeight, {
//                isStatic : true,
//                isSensor : true,
//                render : { 
//                    fillStyle : 'none',
//                },
//                friction : 0.0,
//                isBorder : true,
//            }) );
//            this.addObject( Matter.Bodies.rectangle(bgWidth+100, -borderHeight / 2, 200, borderHeight, {
//                isStatic : true,
//                isSensor : true,
//                render : { 
//                    fillStyle : 'none',
//                },
//                friction : 0.0,
//                isBorder : true,
//            }) );
//            this.addObject( Matter.Bodies.rectangle(bgWidth / 2, -borderHeight + groundLevel - 100, bgWidth + 200, 200, {
//                isStatic : true,
//                isSensor : true,
//                render : { 
//                    fillStyle : 'none',
//                },
//                friction : 0.0,
//                isBorder : true,
//            }) );
//            
//            // cam limit
//            this.matter.engine.camLimit.maxX = maxX;
//            this.matter.engine.camLimit.minX = minX;
//            this.matter.engine.camLimit.maxY = maxY;
//            this.matter.engine.camLimit.minY = minY;
//            this.matter.engine.camLimit.maxSize = 200;
//            this.matter.engine.camLimit.minSize = 50;
//        }).bind(self))();
//    };
//    return {
//        setup,
//    };
});


