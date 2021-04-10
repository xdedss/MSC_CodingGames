
//°

require.config({
    packages: [
        {
            name: "cm",
            location: "https://cdn.jsdelivr.net/npm/codemirror@5.60.0",
            main: "lib/codemirror"
        },
    ],
    paths : {
        "esper" : "https://cdn.jsdelivr.net/npm/esper.js@0.4.0/dist/esper.min",
        "matter" : "https://cdn.jsdelivr.net/npm/matter-js@0.14.2/build/matter.min",
        //"jspython" : "https://cdn.jsdelivr.net/npm/jspython-interpreter@2.1.3/dist/jspython-interpreter.min",
        "skulpt" : "lib/sk.merge",
        //"jscpp" : "https://cdn.jsdelivr.net/npm/JSCPP@2.0.6/dist/JSCPP.es5",
        "level" : "levels/utils/level",
        "load-string" : "lib/load-string",
        "image" : "lib/image",
    }
});


define([''], function(){
    
});
