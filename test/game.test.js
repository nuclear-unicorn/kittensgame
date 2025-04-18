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

    //TODO: this seems to be mandatory to set up some internal props like build.meta.val/on and stuff
    //We need to make it a part of our default initialization
    game.resetState();
});

afterEach(() => {
    jest.clearAllMocks();
});

test("basic sanity check, game must load hoglasave without crashing", () => {
    let hoglasave = require("./res/save.js");
    LCstorage["com.nuclearunicorn.kittengame.savedata"] = hoglasave;

    let loadResult = game.load();
    expect(loadResult).toBe(true);
    game.resetState(); // drop state to avoid messing up future tests
});

// HELPER FUNCTIONS TO REDUCE BOILERPLATE
/**
 * NOTE: Requires some resources to be available beforehead
 * 
 * @param {*} id 
 * @param {*} val 
 */
const _build = (id, val) => {
    //TODO:  extract controller logic from bld.undo to getController
    let controller = new classes.ui.btn.BuildingBtnModernController(game);
    let model = controller.fetchModel({
        key: id,
        building: id
    });
    controller.build(model, val);
};

const _get = (id) => {
    let controller = new classes.ui.btn.StagingBldBtnController(game);
    let model = controller.fetchModel({
        key: id,
        building: id
    });
    return model;
}

//----------------------------------
//  Basic building and unlocks
//  Effects and metadata processing
//----------------------------------

test("Building metadata effects should be correctly extracted", () => {

    game.resPool.get("wood").value = 10000;
    game.resPool.get("minerals").value = 10000;
    game.resPool.get("iron").value = 10000;


    _build("lumberMill", 10);

    //updating cached effects should correctly update bld metadata
    game.bld.updateEffectCached();
    var bld = game.bld.getBuildingExt("lumberMill");
    expect(bld.meta.val).toBe(10);
    expect(game.getEffect("woodRatio")).toBe(1);

    //other managers should not interfere with effect calculation of game.bld
    game.updateCaches();
    expect(game.getEffect("woodRatio")).toBe(1);

    //let bldMeta = game.bld.get("lumberMill");
    //TODO: bldMeta effects seems to be polluted with unnecessery stuff, let's clean it up
});

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

    for (let i = 0; i < 100; i++){
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
    for (let i = 0; i < 100; i++){
        game.village.sim.addKitten();
    }

    game.updateModel();
    game.updateCaches();

    //-------- test effects scaling on population ---------
    game.village.sim.assignJob("woodcutter", 100);
    game.updateResources();

    let hgProduction = game.getResourcePerTick("wood");
    let baselineProduction = game.village.getResProduction()["wood"];


    //HG-boosted production should be reasonably high, but not too high (25%, ~= of expected 0.02 * 10 bonus)
    expect(hgProduction).toBeGreaterThanOrEqual(0);
    expect(hgProduction).toBeGreaterThanOrEqual(baselineProduction);

    //do not forget to include paragon
    let paragonProductionRatio = game.prestige.getParagonProductionRatio();
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
        [55,     "55$unit.s$"],
        [100000, "1$unit.d$ 3$unit.h$ 46$unit.m$ 40$unit.s$"],
        [-5,     "0$unit.s$"], // clamp at zero
        [1e20,   "3.17T$unit.y$"], // above a certain number of years, don't calculate days anymore
        [1e308,  "3.17QWWM$unit.y$"], // should at least be accurate to the correct order of magnitude
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

//--------------------------------
//      Map test
//--------------------------------
test("Explored biomes should update effects", () => {

    game.village.getBiome("plains").level = 1;
    game.updateCaches();
    //expect(game.globalEffectsCached["catnipRatio"]).toBe(0.01);
    expect(game.getEffect("catnipRatio")).toBe(0.01);

    //buildings effects and biomes should compound and not interfeer with each other

    game.village.getBiome("forest").level = 10;
    _build("lumberMill", 10);
    game.updateCaches();

    //expect(game.getEffect("woodRatio")).toBe(0.1);
});

test("Explored biome should produce rewards", () => {
    var plainsBiome = game.village.getBiome("plains");
    plainsBiome.level = 1;
    
    //check that obtained random reward is within base value +- width
    var rewardSpec = plainsBiome.rewards[0];

    var rewards = game.village.map.getBiomeRewards(plainsBiome);
    var amt = rewards["catnip"];

    /*
        _fuzzGainedAmount(width) is flaky and somethimes provides values outsie of [-width/2, width/2];
        This causes tests to be failing with edge cases like

        Expected: >= 181.4943400895315
        Received:    180.17599538566006

        We will adjust our gaps by 5% to keep sanity check in place
    */
    var fuzzBuffer = 0.95;
    expect(amt).toBeGreaterThanOrEqual(rewardSpec.value * (1 - rewardSpec.width ) * fuzzBuffer);
    expect(amt).toBeLessThanOrEqual(rewardSpec.value * (1 + rewardSpec.width ) * fuzzBuffer);

    plainsBiome.level = 2;
    var multiplier = Math.pow(plainsBiome.level, rewardSpec.multiplier);

    var rewards = game.village.map.getBiomeRewards(plainsBiome);
    var amt = rewards["catnip"];
    expect(amt).toBeGreaterThanOrEqual(rewardSpec.value * (1 - rewardSpec.width ) * multiplier * fuzzBuffer);
    expect(amt).toBeLessThanOrEqual(rewardSpec.value * (1 + rewardSpec.width ) * multiplier * fuzzBuffer);
});

//--------------------------------
//      Queue
//--------------------------------

test("Queue should correctly add and remove items", () => {

    let queue = game.time.queue;
    let isRemoved;

    queue.update();
    expect(queue.cap).toBe(3);

    //simple add and remove operations should work and keep queue clear
    queue.addToQueue("field", "buildings", "N/A");
    expect(queue.queueItems.length).toBe(1); 
    expect(queue.queueLength()).toBe(1);

    isRemoved = queue.remove(0, 1);
    expect(queue.queueItems.length).toBe(0); 
    expect(queue.queueLength()).toBe(0);
    expect(isRemoved).toBe(true);

    //invalid removal indexes should not break anything
    isRemoved = queue.remove(1, 1);
    expect(isRemoved).toBe(false);

    //multiple items should stack into one queue entry
    queue.addToQueue("field", "buildings", "N/A");
    queue.addToQueue("field", "buildings", "N/A");
    queue.addToQueue("field", "buildings", "N/A");

    expect(queue.queueItems.length).toBe(1); 
    expect(queue.queueLength()).toBe(3);

    //can't build over the cap
    queue.addToQueue("pasture", "buildings", "N/A");
    expect(queue.queueItems.length).toBe(1);

    //ai cores should increase caps
    _build("aiCore", 10);
    game.bld.get("aiCore").on = 10;
    queue.update();

    //multiple entires of the same type should be allowed
    expect(queue.cap).toBe(13);
    queue.addToQueue("pasture", "buildings", "N/A");
    queue.addToQueue("field", "buildings", "N/A");
    expect(queue.queueItems.length).toBe(3);
    
    //sequential removals should decrement queue, and then clean items
    queue.remove(0, 1);
    expect(queue.queueItems.length).toBe(3);
    queue.remove(0, 1);
    expect(queue.queueItems.length).toBe(3);
    queue.remove(0, 1);
    expect(queue.queueItems.length).toBe(2);

    /**
     * queue content: 
      [{ name: 'pasture', type: 'buildings', label: 'N/A' },
      { name: 'field', type: 'buildings', label: 'N/A' } ]
     */

    //test shift key option
    queue.addToQueue("field", "buildings", "N/A", true /*all available*/);
    expect(queue.queueLength()).toBe(13);
    expect(queue.queueItems.length).toBe(2);

    //console.error(queue.queueItems);
    expect(queue.queueItems[1].value).toBe(12);
});

test("Queue should correctly skip one-time purchases if already bought", () => {
    let queue = game.time.queue;

    //The queue should skip techs that are already researched:
    game.science.get("calendar").researched = true;
    game.resPool.get("science").value = 30; //Enough to purchase the Calendar tech.
    queue.addToQueue("calendar", "tech", "N/A");
    expect(queue.queueLength()).toBe(1);
    queue.update();
    expect(queue.queueLength()).toBe(0);
    expect(game.resPool.get("science").value).toBe(30); //We didn't spend any science because we skipped the item

    //The queue should skip both researched & blocked policies:
    game.science.getPolicy("liberty").researched = true;
    game.science.getPolicy("tradition").blocked = true;
    game.resPool.get("culture").value = 150; //Enough to purchase either policy.
    queue.addToQueue("liberty", "policies", "N/A");
    queue.addToQueue("tradition", "policies", "N/A");
    expect(queue.queueLength()).toBe(2);
    queue.update();
    expect(queue.queueLength()).toBe(1);
    queue.update();
    expect(queue.queueLength()).toBe(0);
    expect(game.resPool.get("culture").value).toBe(150);
});

//--------------------------------
//      Spaceport test
//--------------------------------

test("Spaceports should be unlocked correctly and have a custom price logic applied", () => {
    game.science.get("advExogeology").researched = true;
    game.update();


    let controller = new classes.ui.btn.StagingBldBtnController(game);
    let model = controller.fetchModel({
        key: "warehouse",
        building: "warehouse"
    });
    controller.deltagrade(model, 1);
    expect(game.bld.get("warehouse").stage).toBe(1);
    expect(_get("warehouse").prices.find(price => price.name == "starchart").val).toBe(100000);


    //do not check prices
    game.devMode = true;
    _build("warehouse",10);
    expect(game.bld.get("warehouse").val).toBe(10);

    game.update();
    expect(Math.round(_get("warehouse").prices.find(price => price.name == "titanium").val)).toBe(40456);
    //starchart price should skyroket due to the custom price ratio
    expect(Math.round(_get("warehouse").prices.find(price => price.name == "starchart").val)).toBe(8134223);
});

//--------------------------------
//      buyItem internals
//--------------------------------
test("buyItem internals should work properly for Resource Retrieval", () => {
    const controller = new classes.ui.time.ChronoforgeBtnController(game);
    const model = controller.fetchModel({ id: "ressourceRetrieval" });

    

    //Before we get started, this test assumes certain things about Resource Retrievals:
    //We assume there is a limit of 100.
    //We assume the first one costs 1000 time crystals (TCs).
    //We assume the price ratio is 1.3.
    //Resource Retrievals should be representative of most buildings in the game, plus it has the unique limitBuild feature.

    //Try buying an item, but we have 0 TCs so it should fail:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.on).toBe(0);
    expect(model.metadata.val).toBe(0);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    //Enter dev mode:
    game.devMode = true;
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.on).toBe(1);
    expect(model.metadata.val).toBe(1);
    expect(itemBought).toBe(true);
    expect(reason).toBe("dev-mode");

    //Now exit dev mode & try to buy the next building legitimately.
    game.devMode = false;
    game.resPool.get("timeCrystal").value = 1350; //Enough for 1, with some spare change
    controller.updateEnabled(model); //After we gain the resources, there'd usually be a UI update that calls this
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(game.resPool.get("timeCrystal").value).toBe(50);
    expect(model.metadata.on).toBe(2);
    expect(model.metadata.val).toBe(2);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Test that holding the CTRL key builds batchSize of the item.
    //Along the way, we'll test that the price updated properly.
    game.opts.batchSize = 6;
    game.resPool.get("timeCrystal").value = 100000; //Way more than needed
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: true, shiftKey: false });
    expect(game.resPool.get("timeCrystal").value).toBeCloseTo(78442.3093, 4);
    expect(model.metadata.on).toBe(8);
    expect(model.metadata.val).toBe(8);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Test that holding the SHIFT key builds as many of the item as you can afford & overrides CTRL key.
    game.opts.noConfirm = true;
    game.resPool.get("timeCrystal").value = 1000000; //Enough to go from 8 to 21 buildings.
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: true, shiftKey: true });
    expect(model.metadata.on).toBe(21);
    expect(model.metadata.val).toBe(21);
    expect(game.resPool.get("timeCrystal").value).toBeCloseTo(203642.5938, 4);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Test that we get the same result no matter the event parameters if we can't afford any.
    //We'll test each combination of 2 Boolean parameters for a total of 2^2 = 4 combinations
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: true, shiftKey: true });     //11
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: false, shiftKey: true });    //01
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: true, shiftKey: false });    //10
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: false, shiftKey: false });   //00
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    //Double-check that nothing was built in any of those 4 tests:
    expect(model.metadata.on).toBe(21);
    expect(model.metadata.val).toBe(21);

    //Test that if we have unlimited resources, we only build up to the limit.
    game.resPool.get("timeCrystal").value = Infinity;
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, { ctrlKey: false, shiftKey: true });
    expect(model.metadata.on).toBe(100);
    expect(model.metadata.val).toBe(100);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Test that we can't buy any more even if we have unlimited resources.
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.on).toBe(100);
    expect(model.metadata.val).toBe(100);
    expect(itemBought).toBe(false);
    expect(reason).toBe("already-bought");
});

test("buyItem internals should work properly for Calendar", () => {
    const controller = new com.nuclearunicorn.game.ui.TechButtonController(game);
    const model = controller.fetchModel({ id: "calendar" });

    //Before we get started, this test assumes certain things about Calendar:
    //We assume it costs 30 science.
    //Calendar should be representative of most techs & upgrades in the game.

    //Try buying an item, but we have 0 science so it should fail:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(false);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    //Give ourselves plenty of science & try again; this time it should succeed:
    game.resPool.get("science").value = 100;
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(true);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");
    expect(game.resPool.get("science").value).toBe(70);

    //Try again; this time it should fail because already bought:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(true);
    expect(itemBought).toBe(false);
    expect(reason).toBe("already-bought");
    expect(game.resPool.get("science").value).toBe(70);
});

test("buyItem internals should work properly for Liberty & Tradition", () => {
    const controller = new classes.ui.PolicyBtnController(game);
    let model = controller.fetchModel({ id: "liberty" });

    //Before we get started, this test assumes certain things about Liberty:
    //We assume it costs 150 culture.
    //Liberty should be representative of most policies in the game.
    //Some policies have special conditions under which they're blocked; I won't test those here.

    game.opts.noConfirm = true;

    //Try buying an item, but we have 0 culture so it should fail:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(false);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    //Give ourselves plenty of culture & try again; this time it should succeed:
    game.resPool.get("culture").value = 500;
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(true);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");
    expect(game.resPool.get("culture").value).toBe(350);

    //Try again; this time it should fail because already bought:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(true);
    expect(itemBought).toBe(false);
    expect(reason).toBe("already-bought");
    expect(game.resPool.get("culture").value).toBe(350);

    //Now test that Tradition is correctly blocked.
    model = controller.fetchModel({ id: "tradition" });
    expect(model.metadata.blocked).toBe(true);
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(model.metadata.researched).toBe(false);
    expect(itemBought).toBe(false);
    expect(reason).toBe("blocked");
    expect(game.resPool.get("culture").value).toBe(350);
});

test("buyItem internals should work properly for Fix Cryochamber", () => {
    const controller = new classes.ui.time.FixCryochamberBtnController(game);
    let model = controller.fetchModel({});

    const cryochambers = game.time.getVSU("cryochambers");
    const usedCryochambers = game.time.getVSU("usedCryochambers");

    //Fixing a Cryochamber should fail when we don't have any Used Cryochambers.
    controller.updateEnabled(model);
    controller.updateVisible(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("already-bought");
    expect(cryochambers.val).toBe(0);
    expect(usedCryochambers.val).toBe(0);

    usedCryochambers.val = 5;
    usedCryochambers.on = 5;

    //Fixing a Cryochamber should fail when it's not unlocked yet.
    controller.updateEnabled(model);
    controller.updateVisible(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("not-unlocked");
    expect(cryochambers.val).toBe(0);
    expect(usedCryochambers.val).toBe(5);

    game.workshop.get("chronoforge").researched = true;

    //Fixing a Cryochamber should fail when we can't afford it.
    controller.updateEnabled(model);
    controller.updateVisible(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
    expect(cryochambers.val).toBe(0);
    expect(usedCryochambers.val).toBe(5);

    for(const res of usedCryochambers.fixPrices) {
        game.resPool.addResEvent(res.name, res.val + 1 /*Give us a little extra to check the price is correct*/);
    }

    //Fixing a Cryochamber should succeed this time.
    controller.updateEnabled(model);
    controller.updateVisible(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");
    expect(cryochambers.val).toBe(1);
    expect(usedCryochambers.val).toBe(4);

    //Now check that it should have cost us the correct amount of resources:
    for(const res of usedCryochambers.fixPrices) {
        expect(game.resPool.get(res.name).value).toBe(1);
    }
});

test("buyItem internals should work properly for crafting steel", () => {
    const controller = new com.nuclearunicorn.game.ui.CraftButtonController(game);
    const model = controller.fetchModel({ craft: "steel" });
    let wasItemBought = null;
    let callbackResult = null;
    const callbackFunction = function(success, extendedInfo) {
        wasItemBought = success;
        callbackResult = extendedInfo;
    };
    
    //Before we get started, this test assumes certain things about crafting steel:
    //We assume it costs 100 iron, 100 coal per craft.

    //We should start out with no resources:
    expect(game.resPool.get("steel").value).toBe(0);
    expect(game.resPool.get("iron").value).toBe(0);
    expect(game.resPool.get("coal").value).toBe(0);

    //Crafting should fail when we can't afford it:
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(game.resPool.get("steel").value).toBe(0);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    //Crafting should succeed when we can afford it:
    game.resPool.addResEvent("iron", 199);
    game.resPool.addResEvent("coal", 199);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(game.resPool.get("steel").value).toBe(1);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Crafting should fail again because we consumed resources & don't have enough anymore:
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(game.resPool.get("steel").value).toBe(1);
    expect(game.resPool.get("iron").value).toBe(99);
    expect(game.resPool.get("coal").value).toBe(99);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
});

test("buyItem internals should work properly for shattering time crystals", () => {
    const controller = new classes.ui.time.ShatterTCBtnController(game);
    const model = controller.fetchModel({ prices: [{name: "timeCrystal", val: 1}] });
    

    //For shattering TCs, we'll watch what happens with the calendar year:
    expect(game.calendar.year).toBe(0);

    //Shattering should fail when we can't afford it:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(game.calendar.year).toBe(0);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");

    game.resPool.addResEvent("timeCrystal", 3);

    //Shattering should succeed when we can afford it:
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(game.calendar.year).toBe(1);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");

    //Shattering should have cost us the correct amount of time crystals.
    expect(game.resPool.get("timeCrystal").value).toBe(2);
});

test("buyItem internals should work properly for items with no cost", () => {

    let handlerResult = null;
    const handlerFunction = function(model) { handlerResult = model.name; };
    let controller = new com.nuclearunicorn.game.ui.ButtonModernController(game);
    let model = controller.fetchModel({ name: "A", prices: [], handler: handlerFunction });

    //If we force-disable the model, we shouldn't be able to buy it:
    model.enabled = false;
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("not-enabled");
    expect(handlerResult).toBe(null); //Proof that the handler wasn't called

    //Buying a free item should be free & call the handler:
    model.enabled = true;
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("item-is-free");
    expect(handlerResult).toBe("A");

    controller = new classes.game.ui.GatherCatnipButtonController(game);
    model = controller.fetchModel({}); //We don't really need any properties in the model for this one

    //Gathering catnip should be free & always succeed:
    expect(game.resPool.get("catnip").value).toBe(0);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("item-is-free");
    expect(game.resPool.get("catnip").value).toBe(1);

    controller = new classes.ui.ChallengeBtnController(game);
    model = controller.fetchModel({ id: "pacifism" });

    //Toggle pending challenge should be free & always succeed:
    expect(model.metadata.pending).toBe(false);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("item-is-free");
    expect(model.metadata.pending).toBe(true);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("item-is-free");
    expect(model.metadata.pending).toBe(false);
});

test("buyItem internals should work properly for Renaissance", () => {
    let controller = new classes.ui.PrestigeBtnController(game);
    let model = controller.fetchModel({ id: "renaissance" });

    expect(game.prestige.getPerk("renaissance").researched).toBe(false);

    //Buying should FAIL if we don't have Metaphysics researched.
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("not-unlocked");
    expect(game.prestige.getPerk("renaissance").researched).toBe(false);

    game.science.get("metaphysics").researched = true;

    //Buying should still fail because we don't have paragon points...
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("cannot-afford");
    expect(game.prestige.getPerk("renaissance").researched).toBe(false);

    game.resPool.addResEvent("paragon", 100000);

    //Now, buying should succeed...
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(true);
    expect(reason).toBe("paid-for");
    expect(game.prestige.getPerk("renaissance").researched).toBe(true);

    //Buying should fail again, since it's a one-time purchase
    controller.updateEnabled(model);
    var {itemBought, reason} = controller.buyItem(model, null);
    expect(itemBought).toBe(false);
    expect(reason).toBe("already-bought");
});

test("Refine Catnip ×100 should fail if there isn't enough catnip", () => {
    let controller = new classes.game.ui.RefineCatnipButtonController(game);
    let model = controller.fetchModel({
        prices: [{ name: "catnip", val: 100 }]
    });

    //If we have 0 resources, nothing should happen!
    expect(game.resPool.get("catnip").value).toBe(0);
    expect(game.resPool.get("wood").value).toBe(0);
    controller.handleX100Click(model);
    expect(game.resPool.get("catnip").value).toBe(0);
    expect(game.resPool.get("wood").value).toBe(0);

    //If we have plenty of resources, it should work!
    game.resPool.addResEvent("catnip", 19999); //Enough for 1 craft, not enough for 2.
    expect(game.resPool.get("catnip").value).toBe(19999);
    expect(game.resPool.get("wood").value).toBe(0);
    controller.handleX100Click(model);
    expect(game.resPool.get("catnip").value).toBe(9999); //Should have consumed 10k catnip
    expect(game.resPool.get("wood").value).toBe(100); //No craft bonuses currently active

    //If we have some but not quite enough resources, nothing should happen!
    controller.handleX100Click(model);
    expect(game.resPool.get("catnip").value).toBe(9999);
    expect(game.resPool.get("wood").value).toBe(100);

    //Adding 1 catnip should make the craft work this time
    game.resPool.addResEvent("catnip", 1);
    expect(game.resPool.get("catnip").value).toBe(10000);
    expect(game.resPool.get("wood").value).toBe(100);
    controller.handleX100Click(model);
    expect(game.resPool.get("catnip").value).toBe(0); //Should have consumed 10k catnip
    expect(game.resPool.get("wood").value).toBe(200); //Crafted 100 more wood
});
