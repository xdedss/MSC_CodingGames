

// (╯‵□′)╯︵┻━┻

define(function() {
    
    //utils
    function clamp(num, min, max){
        if (min > max) return clamp(num, max, min);
        if (num > max) return max;
        if (num < min) return min;
        return num;
    }
    
    function lerp(f1, f2, t){
        return f1 * (1-t) + f2 * t;
    }
    
    // init function
    return function (element, width, height) {
        // Matter.js initialization
        var debug = false;
        console.log('matter.js initialization with ' + width + ' x ' + height);

        // create an engine
        var engine = Matter.Engine.create({
            enableSleeping : false,
        });
        
        // world
        var world = engine.world;
        
        world.gravity.scale = 0.000001;
        world.gravity.x = 0;
        world.gravity.y = 9.81;

        // create a renderer
        var render = Matter.Render.create({
            element : element,
            engine : engine,
            options : {
                width : width,
                height : height,
                pixelRatio : 'auto',
                background : '#9ef',
                wireframe : debug,
                hasBounds : false,
                enabled : true,
                wireframes : debug,
                showSleeping : debug,
                showDebug : debug,
                showBroadphase : false,
                showBounds : false,
                showVelocity : debug,
                showCollisions : debug,
                showSeparations : false,
                showAxes : false,
                showPositions : false,
                showAngleIndicator : debug,
                showIds : false,
                showShadows : false,
                showVertexNumbers : false,
                showConvexHulls : debug,
                showInternalEdges : false,
                showMousePosition : false
            }
        });
    //            Matter.Events.on(engine, 'collisionStart', ({ pairs }) => {
    //                pairs.forEach(({ bodyA, bodyB }) => {
    //                    if (bodyA.ballSize != null && bodyB.ballSize != null){
    //                        //console.log(bodyA);
    //                        if (bodyA.ballSize == bodyB.ballSize && bodyA.ballSize < bodies.length - 1){
    //                            startMerge(bodyA, bodyB);
    //                        }
    //                        
    //                    }
    //                });
    //            });
        
        //mouse listener
        var mouse = Matter.Mouse.create(element.querySelector('canvas'));
        var mConstraint = Matter.MouseConstraint.create(engine, { mouse: mouse });
        
        // run the engine
        Matter.Engine.run(engine);

        // run the renderer
        Matter.Render.run(render);
        
        // pause functionality
        engine.paused = false; // flag
        var pausedBodies;
        engine.pause = function(){
            if (!engine.paused){
                pausedBodies = [];
                Matter.Composite.allBodies(world).forEach(body=>{
                    if (!body.isStatic){
                        pausedBodies.push({
                            body : body,
                            vx : body.velocity.x,
                            vy : body.velocity.y,
                            vr : body.angularVelocity,
                        });
                        Matter.Body.setStatic(body, true);
                    }
                });
                engine.paused = true;
            }
        };
        engine.resume = function(){
            if (engine.paused){
                pausedBodies.forEach(body => {
                    Matter.Body.setStatic(body.body, false);
                    Matter.Body.setVelocity(body.body, {x : body.vx, y : body.vy});
                    Matter.Body.setAngularVelocity(body.body, body.vr);
                });
                pausedBodies = null;
                engine.paused = false;
            }
        };
        
        
        engine.cam = {
            x : 0,
            y : 0,
            size : 10,
        };
        engine.camTarget = {
            x : 0,
            y : 0,
            size : 10,
            t : 0.05,
        };
        engine.camLimit = {
            minX : 0,
            maxX : 100,
            minY : -100,
            maxY : 20,
            minSize : 10,
            maxSize : 50,
        };
        var drag = {
            x : 0, y : 0, down : false,
        };
        
        // mousemove
        Matter.Events.on(mConstraint, "mousemove", function(event) {
            //console.log(event.mouse);
            //var {x, y} = event.mouse.position;
            var absx = event.mouse.absolute.x;
            var absy = event.mouse.absolute.y;
            if (drag.down) {
                var ratio = engine.cam.size / height / render.options.pixelRatio * mouse.pixelRatio;
                engine.camTarget.x += (- absx + drag.x) * ratio;
                engine.camTarget.y += (- absy + drag.y) * ratio;
                drag.x = absx; drag.y = absy;
            }
        });
        // mousedown
        Matter.Events.on(mConstraint, "mousedown", function(event) {
            //console.log(event.mouse);
            //var {x, y} = event.mouse.position;
            var absx = event.mouse.absolute.x;
            var absy = event.mouse.absolute.y;
            drag.down = true;
            drag.x = absx; drag.y = absy;
        });
        // mouseup
        $(document).on('mouseup', e => {
            drag.down = false;
        });
        Matter.Events.on(mConstraint, "mouseup", function(event) {
            //console.log(event.mouse);
            var {x, y} = event.mouse.position;
            var absx = event.mouse.absolute.x;
            var absy = event.mouse.absolute.y;
            drag.down = false;
            //Matter.World.add(world, [Matter.Bodies.circle(x, y, 0.5, {frictionAir : 0})]);
        });
        $(element).find('canvas').on("mousewheel", function(event) {
            //console.log(event.originalEvent.deltaY);
            //console.log(mouse.position);
            var scaleFac = (event.originalEvent.deltaY > 0) ? 1.2 : (1/1.2);
            scaleFac = clamp(scaleFac, engine.camLimit.minSize / engine.camTarget.size, engine.camLimit.maxSize / engine.camTarget.size);
            engine.camTarget.x += (mouse.position.x - engine.camTarget.x) * (1-scaleFac);
            engine.camTarget.y += (mouse.position.y - engine.camTarget.y) * (1-scaleFac);
            engine.camTarget.size *= scaleFac;
        });
        var lastPause = null;
        Matter.Events.on(engine, 'tick', function(event) {
            // cam limit
            var aspect = width / height;
            engine.camTarget.size = clamp(engine.camTarget.size, engine.camLimit.minSize, engine.camLimit.maxSize);
            engine.camTarget.x = clamp(engine.camTarget.x, engine.camLimit.minX + engine.camTarget.size * aspect / 2, engine.camLimit.maxX - engine.camTarget.size * aspect / 2);
            engine.camTarget.y = clamp(engine.camTarget.y, engine.camLimit.minY + engine.camTarget.size / 2, engine.camLimit.maxY - engine.camTarget.size / 2);
            
            // move camera and mouse listeners
            var lerpT = 1-Math.exp(-1/60.0 / engine.camTarget.t);
            engine.cam.x += (engine.camTarget.x - engine.cam.x) * lerpT;
            engine.cam.y += (engine.camTarget.y - engine.cam.y) * lerpT;
            engine.cam.size *= Math.pow((engine.camTarget.size / engine.cam.size), lerpT);
            Matter.Render.lookAt(render, { x : engine.cam.x, y : engine.cam.y }, { x: engine.cam.size/2, y: engine.cam.size/2 });
            Matter.Mouse.setOffset(mouse, render.bounds.min);
            var mouseScale = engine.cam.size / height / render.options.pixelRatio * mouse.pixelRatio;
            Matter.Mouse.setScale(mouse, { x : mouseScale, y : mouseScale });
        });
        
        return {
            engine,
            world,
            render,
            mouse,
            mConstraint
        }
    };
});


