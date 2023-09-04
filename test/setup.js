/**
 * ======================================
 *  Welcome to the JEST KG bootloader!
 * 
 *  dojo is problematic to load in the headless jest context,
 *  given that it is a bunch of AMD modules with a lot of XHR request in the .xd. wrapper we use
 * 
 *  Until this problem is fixed (and trust me, it's not straightforward), we will use the mocked dojo
 * 
 *  To at least load the game core, we are relying on the portable dojo.declare version and some fuckery with
 *  global namespaces
 * =======================================
 */

console.log("==== starting jest bootloader ====");

/* global 

    global,
    require,
    gamePage
*/
try {
    global.React = require("../lib/react.min.js");
    require("../lib/jQuery");

    //todo: make portable dojo for jest bootloader
    var createNamespace = require("./declare");

    //---------- inventing creative workarounds since 20XX -------
    var namespace = { com: {}, classes: {}, mixin: {} };
    var dojo = createNamespace(namespace);
    global.com = namespace.com;
    global.classes = namespace.classes;
    global.mixin = namespace.mixin;

    //-------------------------------------------------------------
    //we can't load dojo so let's just mock it (what could possibly go wrong)
    global.dojo = {
        version: {minor: 6},
        declare: dojo.declare,
        destroy: function(){},
        empty: function(){},
        byId: function(){},
        forEach: function(array, predicate){
            for (var i in array){
                predicate(array[i]);
            }
        },
        clone: function(mixin){return Object.assign({}, mixin);},
        hitch: function(ctx, method){ return method.bind(ctx, arguments);},
        connect: function(){},
        publish: function(){},
        subscribe: function(){},
        mixin: function(obj, mixin){return Object.assign(obj, mixin); }
    };

    var xhrMock = {
        done: function(){return this},
        fail: function(){return this},
    }
    global.$ = {
        ajax: function(){ return xhrMock; }
    }

    global.LZString = require("../lib/lz-string.js");
    require("../lib/dropbox_v2.js");
    require("../lib/system.js");

    global.LCstorage = window.localStorage;
    if (document.all && !window.localStorage) {
        global.LCstorage = {};
        global.LCstorage.removeItem = function () { };
    }

    require("../config");
    require("../i18n");

    //mock $I
    global.$I = function(key, args) {
        return "$" + key + "$";
    };

    require("../core");

    require("../js/resources");
    require("../js/calendar");
    require("../js/buildings");
    require("../js/village");
    require("../js/science");
    require("../js/workshop");
    require("../js/diplomacy");
    require("../js/religion");

    require("../js/achievements");
    require("../js/space");
    require("../js/prestige");
    require("../js/time");
    require("../js/stats");
    require("../js/challenges");
    require("../js/void");
    require("../js/math");
    require("../game");
    require("../js/jsx/left.jsx");
    require("../js/ui");
    require("../js/toolbar");


    jest.spyOn(global.console, "log").mockImplementation(() => jest.fn());
    jest.spyOn(global.console, "trace").mockImplementation(() => jest.fn());
    jest.spyOn(global.console, "warn").mockImplementation(() => jest.fn());
}
catch (e) {
    console.log("oh no big error");
    console.error(e);
}