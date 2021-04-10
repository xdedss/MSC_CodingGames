

// Matter.js body+可动贴图

(function(){
    
    define([], function() {
        
        function setLocalPos(body, parent, localPos){
            var {x, y} = parent.position;
            var c = Math.cos(parent.angle);
            var s = Math.sin(parent.angle);
            var dx = localPos.x * c - localPos.y * s;
            var dy = localPos.x * s + localPos.y * c;
            Matter.Body.setPosition(body, {x : x + dx, y : y + dy});
            Matter.Body.setAngle(body, localPos.angle + parent.angle);
        }
        
        class AnimatedBody{
            
            constructor(physicalBody){
                physicalBody.render.visible = false;
                this.physicalBody = physicalBody;
                this.parts = [];
                this.params = {};
            }
            
            // 添加部件
            // part : Matter.Body
            // relatedParams : Array of string
            // onconfig : (part, params) => void
            // behind : bool
            addPart(part, relatedParams, onconfig, zindex){
                zindex = (zindex == null) ? 0 : zindex;
                part.collisionFilter.mask = 0;
                Matter.Body.setStatic(part, true);
                part.localPos = part.localPos || {x:0,y:0,angle:0};
                this.parts.push({part, relatedParams, onconfig, zindex});
            }
            
            // 设置属性
            // pairs : {key : value}
            set(pairs){
                // handle calls like set(key, value);
                if (arguments.length >= 2){
                    var pair = [];
                    pair[arguments[0]] = arguments[1];
                    return this.set(pair);
                }
                // normal conditions
                var changed = new Set();
                for (var k in pairs){
                    if (this.params[k] !== pairs[k]){
                        this.params[k] = pairs[k];
                        changed.add(k);
                    }
                }
                for (var i = 0; i < this.parts.length; i++){
                    var {part, relatedParams, onconfig} = this.parts[i];
                    var needUpdate = false;
                    for (var j = 0; j < relatedParams.length; j++){
                        if (changed.has(relatedParams[j])) {
                            needUpdate = true;
                            break;
                        }
                    }
                    if (needUpdate) {
                        onconfig(part, this.params);
                    }
                }
            }
            
            init(engine){
                this.engine = engine;
                this._ontick = () => {
                    for (var i = 0; i < this.parts.length; i++){
                        setLocalPos(this.parts[i].part, this.physicalBody, this.parts[i].part.localPos);
                    }
                };
                Matter.Events.on(engine, 'tick', this._ontick);
                
                this.parts.sort((a, b) => {
                    return a.zindex - b.zindex;
                });
                Matter.World.add(engine.world, [this.physicalBody]);
                Matter.World.add(engine.world, this.parts.map(p => p.part));
            }
            
            uninit(){
                Matter.Events.off(this.engine, 'tick', this._ontick);
                
                Matter.Composite.remove(this.engine.world, this.physicalBody);
                for (var i = 0; i < this.parts.length; i++){
                    Matter.Composite.remove(this.engine.world, this.parts[i].part);
                }
            }
            
        }
        
        return AnimatedBody;
        
    });
    
})();


