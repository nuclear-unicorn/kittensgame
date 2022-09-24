/* global

    test,
    expect,
    game,
    LCstorage
*/


beforeEach(() => {
    global.gamePage = global.game = new com.nuclearunicorn.game.ui.GamePage();
    global.newrelic = {
        addPageAction: jest.fn(),
        addRelease: jest.fn(),
        setCustomAttribute: jest.fn(),
        setErrorHandler: jest.fn()
    }

    //TODO: use special UI system specifically for unit tests
    game.setUI(new classes.ui.UISystem("gameContainerId"));
});

afterEach(() => {
    jest.clearAllMocks();
});

test("basic sanity check, game must load hoglasave without crashing", () => {
    var hoglasave = require("./res/save.js");
    LCstorage["com.nuclearunicorn.kittengame.savedata"] = hoglasave;

    var loadResult = game.load();
    expect(loadResult).toBe(true);
    game.resetState(); // drop state to avoid messing up future tests
});

// HELPER FUNCTIONS TO REDUCE BOILERPLATE
var _build = function(id, val){
    var undo = game.registerUndoChange();
    undo.addEvent("building", {
        action:"build",
        metaId: id,
        val: val
    });
};

//--------------------------------
//      Basic faith stuff
//--------------------------------
test("Faith praising should correctly discard faith resoruce and update religion.faith", () => {
    game.resPool.get("faith").value = 1000;
    game.religion.praise();

    expect(game.resPool.get("faith").value).toBe( 0.0001);
    expect(game.religion.faith).toBe(1000);
});


//--------------------------------
//      Ecology tests
//--------------------------------
test("Pollution values must be sane", () => {
    //TODO: please add other effects there

    var bld = game.bld;
    var POL_LBASE = bld.getPollutionLevelBase();


    expect(POL_LBASE).toBeGreaterThanOrEqual(100000);

    bld.cathPollution = 100000;
    bld.update();

    let effects = bld.pollutionEffects;
    expect(effects["catnipPollutionRatio"]).toBe(0);
    expect(effects["pollutionHappines"]).toBe(0);

    //----------------------
    //level 0.5
    //----------------------

    bld.cathPollution = POL_LBASE/2;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(0);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.1);
    expect(effects["pollutionHappines"]).toBe(0);

    //----------------------
    //~lvl 1
    //----------------------
    bld.cathPollution = POL_LBASE;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(1);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.2);
    expect(effects["pollutionHappines"]).toBe(0);

    //----------------------
    //  level 1.5
    //----------------------
    bld.cathPollution = POL_LBASE * 10 / 2;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(1);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.225);
    expect(effects["pollutionHappines"]).toBe(-0);  //wtf

    //1.75
    bld.cathPollution = POL_LBASE * 10 * 0.75;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(1);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-10);  //wtf

    //1.99
    //edge cases for high pollution/happiness
    bld.cathPollution = 95574995;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(1);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-15);
    expect(effects["pollutionArrivalSlowdown"]).toBe(0);

    //----------------------
    //~lvl 2
    //----------------------
    bld.cathPollution = POL_LBASE * 10;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(2);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.25);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-20);
    expect(effects["pollutionArrivalSlowdown"]).toBe(0);

    //----------------------
    //~lvl 3
    //----------------------
    bld.cathPollution = POL_LBASE * 100;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(3);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.275);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-25);
    expect(effects["pollutionArrivalSlowdown"]).toBeLessThanOrEqual(10);

    //----------------------
    //~lvl 4
    //----------------------
    bld.cathPollution = POL_LBASE * 1000;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(4);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.3);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-30);
    expect(effects["pollutionArrivalSlowdown"]).toBeLessThanOrEqual(12);
    expect(effects["solarRevolutionPollution"]).toBe(-0);

     //----------------------
    //~lvl 4.9999999999
    //----------------------
    bld.cathPollution = POL_LBASE * 1000 * 100;
    bld.update();
    expect(bld.getPollutionLevel()).toBe(6);
    expect(effects["catnipPollutionRatio"]).toBeGreaterThanOrEqual(-0.35);
    expect(effects["pollutionHappines"]).toBeGreaterThanOrEqual(-35);
    expect(effects["pollutionArrivalSlowdown"]).toBeLessThanOrEqual(15);
    expect(effects["solarRevolutionPollution"]).toBeLessThanOrEqual(-1); //should never be > -1

});

//--------------------------------
//      Reset test
//--------------------------------
test("Reset should assign a correct ammount of paragon and preserve certain upgrades", () => {
    //========= GENERAL RESET AND PARAGON ============
    game.resPool.get("faith").value = 100000;
    _build("hut", 100);

    for (var i = 0; i < 100; i++){
        game.village.sim.addKitten();
    }

    game.updateModel();

    expect(game.village.sim.kittens.length).toBe(100);
    var saveData = game._resetInternal();

    //TODO: whatever assertions we want to do over save data
    expect(saveData.resources.length).toBe(1);
    expect(saveData.resources[0].name).toBe("paragon");
    expect(saveData.resources[0].value).toBe(30);

    game.load();
    expect(game.resPool.get("paragon").value).toBe(30);
    //TBD: please add more reset test cases there


    //========= HOLY GENOCIDE ==================
    game.religion.getTU("holyGenocide").val = 2;
    game.religion.getTU("holyGenocide").on = 2;

    expect(game.religion.activeHolyGenocide).toBe(0);
    expect(game.getEffect("maxKittensRatio")).toBe(0);

    var saveData = game._resetInternal();
    expect(saveData.religion.activeHolyGenocide).toBe(2);
    game.load();

    game.globalEffectsCached = {};

    _build("hut", 100);
    for (var i = 0; i < 100; i++){
        game.village.sim.addKitten();
    }

    game.updateModel();
    game.updateCaches();

    //-------- test effects scaling on population ---------
    game.village.sim.assignJob("woodcutter", 100);
    game.updateResources();

    var hgProduction = game.getResourcePerTick("wood");
    var baselineProduction = game.village.getResProduction()["wood"];


    //HG-boosted production should be reasonably high, but not too high (25%, ~= of expected 0.02 * 10 bonus)
    expect(hgProduction).toBeGreaterThanOrEqual(0);
    expect(hgProduction).toBeGreaterThanOrEqual(baselineProduction);

    //do not forget to include paragon
    var paragonProductionRatio = game.prestige.getParagonProductionRatio();
    expect(hgProduction).toBeLessThanOrEqual(baselineProduction * (1 + paragonProductionRatio) * 100);
    //-----------------------------------------------------

    expect(game.religion.getTU("holyGenocide").val).toBe(2);
    expect(game.getEffect("maxKittensRatio")).toBe(-0.02);
    expect(game.getEffect("simScalingRatio")).toBe(0.04);
    //game.village.maxKittensRatioApplied = true;
    //expect(game.resPool.get("kittens").maxValue).toBe(1);

    var saveData = game._resetInternal();
    game.load();

    expect(game.resPool.get("paragon").value).toBe(64);

    //TODO: test on all ranges of HG, including 0, 10, 100, 1K and 4K, use helper function to set up HG vals
});

//--------------------------------
//      Reset test
//--------------------------------
test("Safe infinity tests", () => {
    // -------- toDisplaySeconds ---------
    const tdsVector = [
        [55,     "55$unit.s$ "],
        [100000, "1$unit.d$ 3$unit.h$ 46$unit.m$ 40$unit.s$ "],
        [-5,     "-1$unit.y$ 364$unit.d$ "], // we don't judge, we just want it to terminate
        [1e20,   "3.17T$unit.y$ 167$unit.d$ "],
        [1e308,  "1$unit.s$ "], // it's getting hard not to judge
        [2e308,  "&infin;"]
    ]
    for (const [seconds,display] of tdsVector) {
        expect(game.toDisplaySeconds(seconds)).toBe(display);
    }

    // we'd like a test of _resetInternal here
    // it should do a reset with some chronospheres and
    // somehow manage to test that resources work out???
    // maybe we can just do the reserves step?

    // -------- (Inverse) Unlimited Diminishing Returns --------
    oldUDR = function(value, stripe) {
        return (Math.sqrt(1 + 8 * value / stripe) - 1) / 2;
    };
    oldIUDR = function(value, stripe) {
        return value * (value + 1) * stripe / 2;
    };

    const udrVector = [0, 10, 100, 1e9, 1e100, 1e307, Infinity];
    const stripe = 75;
    for (const tv of udrVector) {
        expect(game.getUnlimitedDR(tv,stripe)).toBe(oldUDR(tv,stripe));
        expect(game.getInverseUnlimitedDR(tv,stripe)).toBe(oldIUDR(tv,stripe));
    }
    const nearlyInfinity = [5e307, 1e308, 1.7e308];
    for (const tv of nearlyInfinity) {
        expect(game.getUnlimitedDR(tv,stripe)).toBeLessThan(Math.sqrt(Number.MAX_VALUE));
        expect(game.getUnlimitedDR(tv,stripe)).toBeGreaterThan(Math.sqrt(1e150));
    }
    const halfInfinity = [1e150, 5e151, 7e152, 2e153];
    for (const tv of halfInfinity) {
        expect(game.getInverseUnlimitedDR(tv,stripe)).toBeLessThan(Number.MAX_VALUE);
        expect(game.getInverseUnlimitedDR(tv,stripe)).toBeGreaterThan(1e300);
    }

    // -------- buyBcoin / sellBcoin --------
    let reserves = new classes.reserveMan(game);
    const price = game.calendar.cryptoPrice;
    const chronoVector = [
        [2e6/price,   2e6,   2e6*price],
        [4e12/price,  4e12,  4e12*price],
        [7e153/price, 7e153, 7e153*price],
        [1e308/price, 1e308, Number.MAX_VALUE],
    ];
    game.workshop.unlock("fluxCondensator");
    for (const [low,tv,high] of chronoVector) {
        game.resPool.get("relic").value = tv;
        game.resPool.get("blackcoin").value = 0;
        game.diplomacy.buyBcoin();
        expect(game.resPool.get("blackcoin").value).toBe(low);
        game.diplomacy.sellBcoin();
        expect(game.resPool.get("relic").value).toBe(low*price);

        game.resPool.get("relic").value = 0;
        game.resPool.get("blackcoin").value = tv;
        game.diplomacy.sellBcoin();
        expect(game.resPool.get("relic").value).toBe(high);
        game.diplomacy.buyBcoin();
        expect(game.resPool.get("blackcoin").value).toBe(high/price);
    }

    // -------- faith, worship, and epiphany --------
    const faithVector = [
        [777, 777*2],
        [1e21, 1e21*2],
        [1e300, 1e300*2],
        [1e308, Number.MAX_VALUE],
    ];
    expect(game.religion.getApocryphaBonus()).toBe(0); // sanity checking
    for (const [f,w] of faithVector) {
        game.resPool.get("faith").value = f;
        game.religion.praise();
        game.resPool.get("faith").value = f;
        game.religion.praise();
        expect(game.religion.faith).toBe(w); // game.religion.faith is "worship"
    }
    const epiphanyVector = [
        [777,   1e9,   777 * 1e3],
        [1e21,  1e12,  1e21 * 1e6],
        [1e200, 1e100, 1e200 * 1e94],
        [1e300, 1e15,  Number.MAX_VALUE],
        [1e306, 1e9,   Number.MAX_VALUE],
    ];
    expect(game.religion.faithRatio).toBe(0); // epiphany, sanity checking
    expect(game.religion.transcendenceTier).toBe(0); // sanity checking
    for (const [w,bonus,e] of epiphanyVector) {
        game.religion.faith = w;
        game.religion.resetFaith(bonus, false);
        expect(game.religion.faithRatio).toBe(e); // game.religion.faithRatio is "epiphany"
        game.religion.faithRatio = 0; // clean up for next loop
    }

    // -------- basic resources code --------
    const resourceVector = [
        ["catnip", 1000, 2000, false, 3000],
        ["catnip", 2000, 4000, false, 5000], // initial cap
        ["catnip", 1e308, 4000, false, 1e308],
        ["catnip", 2000, 1e308, false, 5000],
        ["catnip", 1e308, 1e308, false, 1e308],
        ["catnip", Infinity, 4000, false, Number.MAX_VALUE],
        ["catnip", 2000, Infinity, false, 5000],
        ["catnip", 2000, Infinity, true, Number.MAX_VALUE],
        ["catnip", 1e308, 1e308, true, Number.MAX_VALUE],

        ["beam", 1000, 2000, false, 3000],
        ["beam", 2000, 4000, false, 6000],
        ["beam", 1e308, 4000, false, 1e308], // rounding
        ["beam", 2000, 1e308, false, 1e308],
        ["beam", 1e308, 1e308, false, Number.MAX_VALUE],
        ["beam", Infinity, 4000, false, Number.MAX_VALUE],
        ["beam", 2000, Infinity, false, Number.MAX_VALUE],
        ["beam", 2000, Infinity, true, Number.MAX_VALUE],
        ["beam", 1e308, 1e308, true, Number.MAX_VALUE],
    ];
    game.updateCaches(); // update resource limits: effectBase -> catnipMax
    expect(game.getEffect("catnipMax")).toBe(5000);
    game.resPool.update(); // update resource limits: catnipMax -> catnip.maxValue
    expect(game.resPool.get("catnip").maxValue).toBe(5000);
    for (const [resName,before,add,noLimit,after] of resourceVector) {
        const res = game.resPool.get(resName);
        res.value = before
        expect(res.value).toBe(before);
        game.resPool.addRes(res, add, true, noLimit);
        expect(res.value).toBe(after);
        res.value = 0; // clear for future
    }

    // -------- storage limits --------
    const priceVector = [
        [[{name:"catnip", val:4000}], false],
        [[{name:"catnip", val:6000}], true],
        [[{name:"catnip", val:Infinity}], true],
        [[{name:"beam", val:6000}], false],
        [[{name:"beam", val:1e308}], false],
        [[{name:"beam", val:Number.MAX_VALUE}], false],
        [[{name:"beam", val:Infinity}], true],
    ]
    for (const [price,limited] of priceVector) {
        expect(game.resPool.isStorageLimited(price)).toBe(limited);
    }

    // We perhaps should test the changes to game.resPool.update(), but that
    // code shouldn't actually do anything, because it's not possible to get
    // resource limits up past P, even with endgame tech.
});

test("Test NR calls", () => {
    game.heartbeat();
    expect(newrelic.addPageAction).toHaveBeenCalledWith("heartbeat", expect.any(Object));
    expect(newrelic.addPageAction).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    game.opts.disableTelemetry = true;
    game.heartbeat();
    expect(newrelic.addPageAction).toHaveBeenCalledTimes(0);
});

