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


//--------------------------------
//       Winter Challenge
//--------------------------------
test("Winter Challenge--Effects should have correct values", () => {
    //TODO: implement tests to make sure the cold chance works correctly.  I wasn't sure how to write a test for it given that it's non-deterministic.

    //Save constant references to objects we're going to be accessing frequently:
    const winterChallenge = game.challenges.getChallenge("winterIsComing");
    const calendar = game.calendar;
    const solarFarm = game.bld.get("pasture").stages[1];
    const catnipResource = game.resPool.get("catnip");

    //Helper functions:
    const catnipModifier = function() { return calendar.getWeatherMod(catnipResource); };
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["winterIsComing"]}); };

    winterChallenge.researched = false;
    winterChallenge.on = 0;
    winterChallenge.active = false;
    calendar.season = 0; //We will conduct this entire test in spring (which transforms into Winter I during the Winter Challenge)

    calculateWhatIsRelevant();
    //With 0 Winter Challenges attempted/completed, Solar Farms should produce 2/2.666667/2/1.5 energy.
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo(2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);

    //Catnip production in spring should be +50% by default, ±15% for weather.
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(1.35);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(1.5);

    //Activate the first Winter Challenge -> endless winter
    winterChallenge.active = true;
    calculateWhatIsRelevant();
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Winter I*/)).toBeCloseTo(1.5);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Winter II*/)).toBeCloseTo(1.5);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Winter III*/)).toBeCloseTo(1.5);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter IV*/)).toBeCloseTo(1.5);

    //Catnip production in Winter I should be -75% by default, ±15% for weather.
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(0.1);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(0.4);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(0.25);

    //Complete the first Winter Challenge -> 5% more energy in summer
    winterChallenge.researched = true;
    winterChallenge.on = 1;
    winterChallenge.active = false;
    calculateWhatIsRelevant();
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo(1.05 * 2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);

    //With 1 Winter Challenge completion, catnip is boosted by 5%
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(1.05 * 1.35);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(1.05 * 1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(1.05 * 1.5);

    winterChallenge.on = 5; //5 completions -> 25% more energy in summer
    calculateWhatIsRelevant();
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo(1.25 * 2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);

    //With 5 completions we can expect a 25% bonus.
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(1.25 * 1.35);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(1.25 * 1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(1.25 * 1.5);

    winterChallenge.active = true;
    calculateWhatIsRelevant();
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Winter I*/)).toBeCloseTo(1.5); //Cold harshness affects catnip, not solar power
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Winter II*/)).toBeCloseTo(1.5);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Winter III*/)).toBeCloseTo(1.5);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter IV*/)).toBeCloseTo(1.5);
    
    //We can expect cold weather to be 10% harsher
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(0.9 * 0.1);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(0.4);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(0.25);

    winterChallenge.on = 37; //We should not yet be into LDR for cold harshness
    calculateWhatIsRelevant();
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(0.26 * 0.1); //-74%
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(0.4);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(0.25);

    winterChallenge.on = 38; //That puts us into LDR for cold harshness.
    calculateWhatIsRelevant();
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo((1 - game.getLimitedDR(0.76,1)) * 0.1);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(0.4);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(0.25);

    //With 30 Winter completions we are back out of LDR for cold harshness.
    winterChallenge.on = 30;
    calculateWhatIsRelevant();
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(0.4 * 0.1); //-60%
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(0.4);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(0.25);

    winterChallenge.active = false;
    calculateWhatIsRelevant();
    //30 completions -> 150% more energy in summer
    //We should be 1 completion away from entering LDR
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo(2.5 * 2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(2.5 * 1.35); //Also 150% more catnip in spring
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(2.5 * 1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(2.5 * 1.5);

    winterChallenge.on = 31; //31 completions -> more than 150% more energy, but less than 155%
    calculateWhatIsRelevant();
    //We should be just entering LDR territory now
    let theBonus = 1 + game.getLimitedDR(1.55,2);
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo(theBonus * 2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.35);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.5);

    winterChallenge.on = 100;
    calculateWhatIsRelevant();
    //Well into LDR territory
    theBonus = 1 + game.getLimitedDR(5,2);
    expect(solarFarm.calculateEnergyProduction(game, 0 /*Spring*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 1 /*Summer*/)).toBeCloseTo((1 + game.getLimitedDR(5,2)) * 2.666667);
    expect(solarFarm.calculateEnergyProduction(game, 2 /*Autumn*/)).toBe(2);
    expect(solarFarm.calculateEnergyProduction(game, 3 /*Winter*/)).toBeCloseTo(1.5);
    calendar.weather = "cold";
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.35);
    calendar.weather = "warm";
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.65);
    calendar.weather = null; //Normal weather
    expect(catnipModifier()).toBeCloseTo(theBonus * 1.5);
});

//--------------------------------
//       Anarchy Challenge
//--------------------------------
test("Anarchy Challenge--Effects should have correct values", () => {
    //Save constant references to objects we're going to be accessing frequently:
    const anarchyChallenge = game.challenges.getChallenge("anarchy");
    const village = game.village;

    //Helper functions:
    const masterSkill = function() { return village.getValueModifierPerSkill(9001); };
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["anarchy"]}); };

    //Let's add 300 kittens for testing purposes:
    //300 is a lot but we need the precision for some LDR checks.
    for (let i = 0; i < 300; i++){
        village.sim.addKitten();
    }
    expect(village.getKittens()).toBe(300);

    anarchyChallenge.researched = false;
    anarchyChallenge.on = 0;
    anarchyChallenge.active = false;
    calculateWhatIsRelevant();

    //0 Anarchy Challenges attempted, 0 completed should leave 300 kittens available for work:
    //Master skill effect should be unchanged:
    expect(village.getFreeKittens()).toBe(300);
    expect(masterSkill()).toBeCloseTo(0.1875);

    //Start the first Anarchy Challenge:
    anarchyChallenge.active = true;
    calculateWhatIsRelevant();
    //Half of all kittens should be lazy:
    expect(village.getFreeKittens()).toBe(150);
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    //With 1 Anarchy Challenges completed, 5% more kittens should be lazy:
    anarchyChallenge.researched = true;
    anarchyChallenge.on = 1;
    calculateWhatIsRelevant();
    expect(village.getFreeKittens()).toBe(135);
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    anarchyChallenge.on = 2; //2 completions
    calculateWhatIsRelevant();
    expect(village.getFreeKittens()).toBe(120);
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    anarchyChallenge.on = 3; //3 completions
    calculateWhatIsRelevant();
    expect(village.getFreeKittens()).toBe(105);
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    anarchyChallenge.on = 4; //4 completions
    calculateWhatIsRelevant();
    //We should be getting to the very beginning of LDR
    expect(village.getFreeKittens()).toBe(Math.round(90.625)); //i.e. 91 kittens
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    anarchyChallenge.on = 5; //5 completions
    calculateWhatIsRelevant();
    //LDR is active
    expect(village.getFreeKittens()).toBe(Math.round(84.375)); //i.e. 84 kittens
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    anarchyChallenge.on = 40; //40 completions
    calculateWhatIsRelevant();
    expect(village.getFreeKittens()).toBe(Math.round(75.625)); //i.e. 76 kittens
    expect(masterSkill()).toBe(0); //Skills have no effect in Anarchy

    //With Anarchy Challenge inactive, no kittens should be lazy:
    anarchyChallenge.active = false;
    calculateWhatIsRelevant();
    expect(village.getFreeKittens()).toBe(300);
    //Now test the Master skill effect at 40 completions:
    expect(masterSkill()).toBeCloseTo(0.1875 * (1 + game.getLimitedDR(8,4)));

    anarchyChallenge.on = 20; //20 completions
    calculateWhatIsRelevant();
    expect(masterSkill()).toBeCloseTo(0.1875 * (1 + game.getLimitedDR(4,4)));

    anarchyChallenge.on = 15; //15 completions
    calculateWhatIsRelevant();
    //We're outisde of LDR now:
    expect(masterSkill()).toBeCloseTo(0.1875 * 4);

    anarchyChallenge.on = 10; //10 completions
    calculateWhatIsRelevant();
    expect(masterSkill()).toBeCloseTo(0.1875 * 3);

    anarchyChallenge.on = 1; //1 completion
    calculateWhatIsRelevant();
    expect(masterSkill()).toBeCloseTo(0.1875 * 1.2);
});

//--------------------------------
//       Energy Challenge
//--------------------------------
test("Energy Challenge--Effects should have correct values", () => {
    //Save constant references to objects we're going to be accessing frequently:
    const energyChallenge = game.challenges.getChallenge("energy");
    const resPool = game.resPool;

    //Helper function:
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["energy"]}); };

    energyChallenge.researched = false;
    energyChallenge.active = false;
    energyChallenge.on = 0;
    calculateWhatIsRelevant();

    //With 0 Energy Challenges completed & the Challenge inactive, there should be no effect:
    expect(resPool.getEnergyConsumptionRatio()).toBe(1);

    energyChallenge.active = true;
    calculateWhatIsRelevant();
    //With Energy Challenge active, but 0 completions, energy consumption should be doubled:
    expect(resPool.getEnergyConsumptionRatio()).toBe(2);

    game.challenges.researchChallenge("energy");
    calculateWhatIsRelevant();
    //Energy Challenge should be inactive, researched, & have 1 completion for a 0.98 energy consumption value:
    expect(energyChallenge.researched).toBe(true);
    expect(energyChallenge.active).toBe(false);
    expect(energyChallenge.on).toBe(1);
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(0.98);

    energyChallenge.active = true;
    energyChallenge.on = 1;
    calculateWhatIsRelevant();
    //With Energy Challenge active, but 1 completion, energy consumption increase should be 10%, then consumption is doubled.
    expect(game.challenges.getChallenge("energy")).toBe(energyChallenge);
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(1.1 * 2);

    game.challenges.researchChallenge("energy");
    calculateWhatIsRelevant();
    //Energy Challenge should be inactive, researched, & have 2 completions for a 0.96 energy consumption value:
    expect(energyChallenge.researched).toBe(true);
    expect(energyChallenge.active).toBe(false);
    expect(energyChallenge.on).toBe(2);
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(0.96);

    energyChallenge.active = true;
    energyChallenge.on = 100;
    calculateWhatIsRelevant();
    //With Energy Challenge active, but 100 completions, energy consumption increase should be 10%*100 = 1000% = ×11
    expect(game.challenges.getChallenge("energy")).toBe(energyChallenge);
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(11 * 2);

    energyChallenge.active = false;
    energyChallenge.on = 10;
    calculateWhatIsRelevant();
    //With Energy Challenge inactive & 10 completions at 2% reduction per level we should have -20% consumption:
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(0.8);

    energyChallenge.on = 37;
    calculateWhatIsRelevant();
    //With 37 completions at 2% reduction per level we should have -74% consumption; LDR hasn't kicked in yet:
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(0.26);

    energyChallenge.on = 38;
    calculateWhatIsRelevant();
    //With 38 completions at 2% reduction per level we should have -76% consumption; beginnings of LDR:
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(1 + game.getLimitedDR(-0.76,1));

    energyChallenge.on = 100;
    calculateWhatIsRelevant();
    //With 100 completions at 2% reduction per level we should be well into LDR:
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(1 + game.getLimitedDR(-2,1));

    energyChallenge.on = 10000;
    calculateWhatIsRelevant();
    //With 10k completions at 2% reduction per level we should be well into LDR:
    expect(resPool.getEnergyConsumptionRatio()).toBeCloseTo(1 + game.getLimitedDR(-200,1));
});

//--------------------------------
//       Atheism Challenge
//--------------------------------
test("Atheism Challenge--Solar Revolution limit should have correct value", () => {
    //Save constant references to objects we're going to be accessing frequently:
    const religionManager = game.religion;
    const solarRevolutionUpgrade = religionManager.getRU("solarRevolution");
    const atheismChallenge = game.challenges.getChallenge("atheism");

    //Helper functions:
    const getSR = function() { return religionManager.getSolarRevolutionRatio(); };
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["atheism"]}); };

    //We need to enable SR to calculate its bonus.
    solarRevolutionUpgrade.on = 1;
    solarRevolutionUpgrade.val = 1;

    //religionManager.faith is the amount of worship you have; set it to a really big number so it's very close to the limits.
    religionManager.faith = Math.pow(10,50);
    religionManager.transcendenceTier = 15;
    atheismChallenge.on = 0;
    atheismChallenge.researched = false;
    atheismChallenge.active = false;
    calculateWhatIsRelevant();

    //Test that with 0 Atheism completions the SR limit is at 1000%.
    expect(getSR()).toBeCloseTo(10);

    //Test that with 1 Atheism completion the SR limit is boosted by 100% per TT, then multiplicatively by 10%.
    atheismChallenge.on = 1;
    atheismChallenge.researched = true;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(25 * 1.1);

    //Test that with 2 Atheism completions the SR limit is boosted by 100% per TT, then multiplicatively by 20%.
    atheismChallenge.on = 2;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(25 * 1.2);

    //Test that with 15 Atheism completions the SR limit is boosted by 100% per TT, then multiplicatively by 150%.
    atheismChallenge.on = 15;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(25 * 2.5);

    //Test that it really is 100% per TT.
    religionManager.transcendenceTier = 3;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(13 * 2.5);

    //Test that with 30 Atheism completions the SR limit is boosted by 100% per TT, then multiplicatively by 300%.
    atheismChallenge.on = 30;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(13 * 4);

    //Test that with 31 Atheism completions we start dipping into LDR.
    atheismChallenge.on = 31;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(13 * (1 + game.getLimitedDR(3.1,4)));

    //Test that with 70 Atheism completions we really are into LDR.
    atheismChallenge.on = 70;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(13 * (1 + game.getLimitedDR(7,4)));

    //Test that with infinite Atheism completions we reach the LDR cap.
    atheismChallenge.on = Infinity;
    calculateWhatIsRelevant();
    expect(getSR()).toBeCloseTo(13 * 5);
});

//--------------------------------
//       Black Sky Challenge
//--------------------------------
test("Black Sky Challenge--Corruption bonus should have correct value", () => {
    //Save constant references to objects we're going to be accessing frequently:
    const bskChallenge = game.challenges.getChallenge("blackSky");
    const markers = game.religion.getZU("marker"); //The religion building that is affected by BSK corruption bonus
    const CORRUPTION_FROM_1_MARKER = 0.000001; //Copied directly from religion.js
    
    //Helper function:
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["blackSky"], zigguratUpgrades: ["marker"]}); };

    markers.val = 1;
    markers.on = 1;
    bskChallenge.on = 0;
    bskChallenge.researched = false;
    bskChallenge.active = false;
    calculateWhatIsRelevant();

    //With 0 BSK attempts & completions, markers' effective value should be 1, & corruption ratio should be unchanged:
    expect(markers.effects["corruptionRatio"]).toBe(CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1);

    //Try with 1 BSK completion:
    bskChallenge.on = 1;
    bskChallenge.researched = true;
    calculateWhatIsRelevant();
    //Numbers should be boosted by 10%:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo(1.1 * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1.1);

    //5 BSK completions:
    bskChallenge.on = 5;
    calculateWhatIsRelevant();
    //Expect a 50% bonus:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo(1.5 * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1.5);

    //Try BSK active with 5 previous completions:
    bskChallenge.active = true;
    calculateWhatIsRelevant();
    //Bonus should be disabled while Challenge is active:
    expect(markers.effects["corruptionRatio"]).toBe(CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1);

    //15 BSK completions, Challenge completed:
    bskChallenge.on = 15;
    bskChallenge.active = false;
    calculateWhatIsRelevant();
    //Expect a 150% bonus because we aren't into LDR yet:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo(2.5 * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(2.5);

    //16 BSK completions:
    bskChallenge.on = 16;
    calculateWhatIsRelevant();
    //Beginnings of LDR:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo((1 + game.getLimitedDR(1.6,2)) * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1 + game.getLimitedDR(1.6,2));

    //99 BSK completions:
    bskChallenge.on = 99;
    calculateWhatIsRelevant();
    //Well into LDR:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo((1 + game.getLimitedDR(9.9,2)) * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(1 + game.getLimitedDR(9.9,2));

    //Infinitely many BSK completions:
    bskChallenge.on = Infinity;
    calculateWhatIsRelevant();
    //Completely to the end of LDR:
    expect(markers.effects["corruptionRatio"]).toBeCloseTo(3 * CORRUPTION_FROM_1_MARKER);
    expect(markers.getEffectiveValue(game)).toBe(3);
});

//--------------------------------
//       Pacifism Challenge
//--------------------------------
test("Pacifism Challenge--Weapon upgrades should have correct values", () => {
    //Save constant references to objects we're going to be accessing frequently:
    const pacifismChallenge = game.challenges.getChallenge("pacifism");
    const weaponUpgrades = [game.workshop.get("compositeBow"), game.workshop.get("crossbow"), game.workshop.get("railgun")];
    
    //Helper function:
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["pacifism"], upgrades: ["compositeBow", "crossbow", "railgun"]}); };

    pacifismChallenge.on = 500;
    pacifismChallenge.researched = true;
    pacifismChallenge.active = false;
    calculateWhatIsRelevant();

    //With Pacifism inactive, the number of completions shouldn't matter for weapon upgrades:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0.5);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0.25);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0.25);

    pacifismChallenge.on = 2;
    calculateWhatIsRelevant();
    //Test that the number of completions actually doesn't matter by checking with a different number of completions:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0.5);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0.25);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0.25);

    //What's more interesting is when Pacifism is active.  How about the first time it's attempted?
    pacifismChallenge.on = 0;
    pacifismChallenge.researched = false;
    pacifismChallenge.active = true;
    calculateWhatIsRelevant();
    //We expect numbers to be unchanged:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0.5);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0.25);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0.25);

    //How about the 2nd Pacifism run?
    pacifismChallenge.on = 1;
    pacifismChallenge.researched = true;
    calculateWhatIsRelevant();
    //Weapon efficency should be diminished by 10%:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBeCloseTo(0.9 * 0.5); //Use toBeCloseTo because we might have floating-point rounding errorrs
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBeCloseTo(0.9 * 0.25);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBeCloseTo(0.9 * 0.25);

    //7th Pacifism run:
    pacifismChallenge.on = 7;
    calculateWhatIsRelevant();
    //Weapon efficency should be diminished by 70%:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBeCloseTo(0.3 * 0.5);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBeCloseTo(0.3 * 0.25);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBeCloseTo(0.3 * 0.25);

    //10th Pacifism run:
    pacifismChallenge.on = 10;
    calculateWhatIsRelevant();
    //No LDR on the effect "weaponEfficency" (yes, it's misspelled) so we're at -100%:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0);

    pacifismChallenge.on = 11;
    calculateWhatIsRelevant();
    //But it doesn't go below 0:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0);
    
    pacifismChallenge.on = 134769; //If you can correctly guess what this number is a reference to, I'll be impressed.
    calculateWhatIsRelevant();
    //Still, effect shouldn't dip below 0:
    expect(weaponUpgrades[0].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[1].effects["manpowerJobRatio"]).toBe(0);
    expect(weaponUpgrades[2].effects["manpowerJobRatio"]).toBe(0);
});


//--------------------------------
//    Unicorn Tears Challenge
//--------------------------------
test("Unicorn Tears Challenge--Weighted price algorithm should behave nicely with zero, infinity, & NaN", () => {
    const unicornTearsChallenge = game.challenges.getChallenge("unicornTears");
    expect(typeof(unicornTearsChallenge.sumPricesWeighted)).toBe("function");
    const sumPricesWeighted = unicornTearsChallenge.sumPricesWeighted.bind(unicornTearsChallenge);

    //Default weight should be 10, which should work for nonexistent resources:
    expect(sumPricesWeighted([{ name: "notARealResourceName", val: 19 }])).toBeCloseTo(190);

    //Catnip should have a weight of 0:
    expect(sumPricesWeighted([{ name: "catnip", val: 11 }])).toBe(0);

    //Resources should sum together:
    expect(sumPricesWeighted([{ name: "res1", val: 13 }, { name: "res2", val: 44 }])).toBeCloseTo(570);
    expect(sumPricesWeighted([{ name: "catnip", val: 9 }, { name: "res1", val: 19 }, { name: "catnip", val: 18 }, { name: "res1", val: 94 }])).toBeCloseTo(1130);

    //Test zero times infinity:
    expect(sumPricesWeighted([{ name: "catnip", val: Infinity }])).not.toBeNaN();
    expect(sumPricesWeighted([{ name: "catnip", val: Infinity }])).toBe(0);

    //Unicorns should have a weight of negative infinity.
    //We will add a tiny amount of unicorns to a huge amount of a default resource.
    expect(sumPricesWeighted([{ name: "unicorns", val: 1e-25 }, { name: "res1", val: 1e93 }])).toBe(-Infinity);

    //Test NaN of a resource, test fractional resources, test infinite resources, test negative resources:
    expect(sumPricesWeighted([{ name: "res1", val: NaN }])).not.toBeNaN();
    expect(sumPricesWeighted([{ name: "res1", val: NaN }])).toBe(0);
    expect(sumPricesWeighted([{ name: "res1", val: 70 }, { name: "res2", val: NaN }])).toBeCloseTo(700);
    expect(sumPricesWeighted([{ name: "res1", val: 0.051 }, { name: "catnip", val: NaN }])).toBeCloseTo(0.51);
    expect(sumPricesWeighted([{ name: "res1", val: 8 }, { name: "catnip", val: Infinity }])).toBeCloseTo(80);
    expect(sumPricesWeighted([{ name: "res1", val: 6.5e6 }, { name: "catnip", val: -Infinity }])).toBeCloseTo(6.5e7);
    expect(sumPricesWeighted([{ name: "unicorns", val: NaN }, { name: "unicorns", val: -Infinity }])).toBe(Infinity); //negative infinity times negative infinity equals positive infinity
    expect(sumPricesWeighted([{ name: "unicorns", val: Infinity }, { name: "unicorns", val: -Infinity }])).toBe(0); //negative infinity plus infinity gives NaN but we want zero instead
    expect(sumPricesWeighted([{ name: "res1", val: Infinity }, { name: "res1", val: -Infinity }])).toBe(0);
    expect(sumPricesWeighted([{ name: "res1", val: Infinity }, { name: "unicorns", val: -Infinity }])).toBe(Infinity);
    expect(sumPricesWeighted([{ name: "res1", val: Infinity }, { name: "catnip", val: -Infinity }, { name: "unicorns", val: -Infinity }])).toBe(Infinity);
    expect(sumPricesWeighted([{ name: "res1", val: Math.SQRT2 }])).toBeCloseTo(14.1421);
    expect(sumPricesWeighted([{ name: "res1", val: -39 }, { name: "res2", val: 63 }, { name: "res3", val: -23.5 }])).toBeCloseTo(5);
    expect(sumPricesWeighted([{ name: "res1", val: -39 }, { name: "res2", val: -97 }, { name: "res3", val: 3 }])).toBeCloseTo(-1330);

    //Zero prices should not contribute:
    expect(sumPricesWeighted([{ name: "unicorns", val: 0 }])).toBe(0);
    expect(sumPricesWeighted([{ name: "catnip", val: 0 }])).toBe(0);
    expect(sumPricesWeighted([{ name: "res1", val: 0.4 }, { name: "unicorns", val: 0 }, { name: "res1", val: 0 }, { name: "res2", val: 0 }])).toBeCloseTo(4);

    //Empty price should be zero:
    expect(sumPricesWeighted([])).toBe(0);
});
test("Unicorn Tears Challenge--Resource caps should be enforced, & unicorn sacrifice should respect them", () => {
    //Save references to resPool objects we'll use often:
    const unic = game.resPool.get("unicorns");
    const tear = game.resPool.get("tears");
    const alic = game.resPool.get("alicorn");
    expect(game.bld.cathPollution).toBe(0) //Expect to start at 0 pollution

    //Outside of any Challenge, unicorn-related resources wouldn't have a cap:
    expect(game.challenges.isActive("unicornTears")).toBe(false);
    game.resPool.addResEvent("unicorns", 500.1);
    expect(unic.value).toBeCloseTo(500.1);
    game.resPool.addResEvent("tears", 500.1);
    expect(tear.value).toBeCloseTo(500.1);
    game.resPool.addResEvent("alicorn", 500.1);
    expect(alic.value).toBeCloseTo(500.1);

    //Activate Unicorn Tears Challenge, then test that caps are enforced:
    //While we're at it, let's add some paragon points (should NOT affect the caps at all)
    const unicornTearsChallenge = game.challenges.getChallenge("unicornTears");
    unicornTearsChallenge.active = true;
    unicornTearsChallenge.on = 83;
    game.resPool.addResEvent("paragon", 8026);
    game.upgrade({ challenges: ["unicornTears"]});
    game.updateModel(); //To apply resource limits
    game.calendar.onNewDay(); //This is when extra resources are drained

    expect(unic.maxValue).toBe(10);
    expect(unic.value).toBeCloseTo(9.1); //Unicorns disappear in integer amounts
    expect(tear.maxValue).toBe(1);
    expect(tear.value).toBeCloseTo(1);
    expect(tear.value == tear.maxValue).toBe(true); //Should be exactly equal
    expect(game.bld.cathPollution).toBeCloseTo(1497.3 /* (500.1-1)*3 */); //Produced 3 pollution per tear overcapped
    expect(alic.maxValue).toBe(0.2);
    expect(alic.value).toBeCloseTo(0.1); //Alicorns also disappear in integer amounts

    //Build some Ziggurats, then test unicorn sacrifice:
    const ziggurat = game.bld.get("ziggurat");
    ziggurat.val = 36;
    ziggurat.on = 36;
    game.updateModel(); //To apply resource limits

    unic.value = 1e12; //Enough unicorns to do hundreds of transformations if we want to
    tear.value = tear.maxValue - 110; //3 transformations + 2 tears away from the cap

    //Copied from religion.js
    //I kind of wish there were a better way to make fully functional "buttons" for these test cases
    let unicornsSacrificed = 0;
    let controller = new classes.ui.religion.TransformBtnController(game, {
        gainMultiplier: function() {
            return this.game.bld.get("ziggurat").on;
        },
        gainedResource: "tears",
        applyAtGain: function(priceCount) {
            unicornsSacrificed += priceCount; //Count the number of unicorns we sacrificed
        },
    });
    let model = controller.fetchModel({ prices: [{ name: "unicorns", val: 2500}]});
    let callbackFunction = function() {};

    //The smart "sacrifice all unicorns" algorithm should have sacrificed 4 batches to give us 110 tears plus (34*3) pollution
    expect(controller._canAfford(model)).toBe(4);
    controller.transform(model, 1 /*divider, 1 means "all"*/, null /*event*/, callbackFunction);
    expect(unicornsSacrificed).toBe(10000); //4 batches' worth
    expect(tear.value == tear.maxValue).toBe(true);
    expect(game.bld.cathPollution).toBeCloseTo(1497.3 + 102); //Previous pollution plus what we just made

    //Even though we're at max tears, we should still be able to sacrifice 1 batch of unicorns for no gain:
    expect(controller._canAfford(model)).toBe(1);
    controller.transform(model, 1 /*divider, 1 means "all"*/, null /*event*/, callbackFunction);
    expect(unicornsSacrificed).toBe(12500); //+1 batch
    expect(tear.value == tear.maxValue).toBe(true);
    expect(game.bld.cathPollution).toBeCloseTo(1497.3 + 102 + 108); //Previous pollution plus what we just made
});

//--------------------------------
//       Shatter TC Prices
//--------------------------------
//I put this in the testing suite for challenges because we're going to try different combinations of the 1000 Years Challenge.
test("Shatter TC Prices should be correct (in a variety of 1kY states)", () => {
    const oneKYChallenge = game.challenges.getChallenge("1000Years");
    
    let controller = new classes.ui.time.ShatterTCBtnController(game);
    let model = controller.fetchModel({ prices: [{name: "timeCrystal", val: 1}] });
    let pricesResult = null;

    //Function to calculate the price of shattering TCs.
    const calcPrices = function(shatters, startHeat, startYear) {
        game.time.heat = startHeat;
        game.calendar.year = startYear;
        pricesResult = controller.getPricesMultiple(model, shatters);
    }
    const calculateWhatIsRelevant = function() { game.upgrade({ challenges: ["1000Years"]}); };

    //We're going to assume from here on out that the max amount of heat is 100 units:
    calculateWhatIsRelevant();
    expect(game.getEffect("heatMax")).toBeCloseTo(100, 5 /*5 digits of precision*/);

    //Starting at year 0 with no heat & no modifiers, shattering 1 TC should cost 1 TC.
    calcPrices(1 /*shatters*/, 0 /*heat*/, 0 /*year*/);
    expect(pricesResult.timeCrystal).toBe(1);
    expect(pricesResult.void).toBe(0);

    //If each shatter generates 10 units of heat, we should be able to shatter 10 times without hitting the heat penalty:
    //Ah--but after exactly 10 shatters, we are at 100 heat, which is 0 units over the max, so the 11th shatter has its price increased by 0%
    calcPrices(11 /*shatters*/, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo(10 + 1, 5);
    expect(pricesResult.void).toBe(0);

    //After 11 shatters, we are at 110 heat, so the 12th costs 10% more
    calcPrices(12, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo(10 + 1 + 1.1, 5);
    expect(pricesResult.void).toBe(0);

    //After 12 shatters, the next one costs 20% more
    calcPrices(13, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo(10 + 1 + 1.1 + 1.2, 5);
    expect(pricesResult.void).toBe(0);

    //But what if we start with, say, 5 units of heat already?  The 10th shatter should be unaffected, but the 11th should cost 5% more:
    calcPrices(10 /*shatters*/, 5 /*heat*/, 0 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo(10, 5);
    expect(pricesResult.void).toBe(0);
    calcPrices(11 /*shatters*/, 5 /*heat*/, 0 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo(10 + 1.05, 5);
    expect(pricesResult.void).toBe(0);

    //...& the 12th should cost 15% more:
    calcPrices(12, 5, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo(10 + 1.05 + 1.15, 5);
    expect(pricesResult.void).toBe(0);

    //Now, let's do it again, but with 1kY reward active.
    oneKYChallenge.researched = true; //Reward: shatters generate 5 heat instead of 10
    oneKYChallenge.on = 1; //Reward: shatters cost 2% fewer TCs
    oneKYChallenge.active = false;
    calculateWhatIsRelevant();

    //Shatters generate 5 units of heat now--so we should be able to shatter 20 times with no penalty.
    //But shatters cost 2% fewer TCs now
    calcPrices(20, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo((20) * 0.98, 5);
    expect(pricesResult.void).toBe(0);

    //21st shatter costs 0% more, 22nd costs 5% more, etc.
    calcPrices(23, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo((20 + 1 + 1.05 + 1.1) * 0.98, 5);
    expect(pricesResult.void).toBe(0);

    //Let's try shattering, but we start with some heat already.
    //I picked 73 heat because 73 is not divisible by 5.
    //After 6 shatters, we are at 103 heat, so the 7th shatter should be 3% more expensive
    calcPrices(7 /*shatters*/, 73 /*heat*/, 0 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo((6 + 1.03) * 0.98, 5);
    expect(pricesResult.void).toBe(0);

    //The next few shatters after this should be 8%, then 13%, then 18%, etc. more expensive
    calcPrices(12 /*shatters*/, 73 /*heat*/, 0 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo((6 + 1.03 + 1.08 + 1.13 + 1.18 + 1.23 + 1.28) * 0.98, 5);
    expect(pricesResult.void).toBe(0);

    //Now, let's test that prices are MORE expensive with 1kY active, but that the half-heat reward still applies:
    oneKYChallenge.researched = true; //Reward: shatters generate 5 heat instead of 10
    oneKYChallenge.on = 8; //Increasing challenge: shatters cost 4 more TCs & 3.2 more void each.
    oneKYChallenge.active = true;
    calculateWhatIsRelevant();
    
    //Shatters still generate 5 units of heat, so starting at 0 heat with 25 shatters, the 21st costs 0% more, then 5% more, then 10% more, etc.
    //But the base price of shatters is now 5 TCs + 3.2 void.
    calcPrices(25, 0, 0);
    expect(pricesResult.timeCrystal).toBeCloseTo(100 + 5 + 5.25 + 5.5 + 5.75 + 6, 5);
    expect(pricesResult.void).toBeCloseTo(64 + 3.2 + 3.36 + 3.52 + 3.68 + 3.84);

    //Now let's test Dark Future (DF).
    //Since the 1kY Challenge is completed before you reach Dark Future, we will NOT test DF + 1kY, only DF outside of 1kY.
    oneKYChallenge.researched = true; //Reward: shatters generate 5 heat instead of 10
    oneKYChallenge.on = 8; //Reward: shatters cost 16% fewer TCs
    oneKYChallenge.active = false;
    calculateWhatIsRelevant();

    //Shatter prices should be 1% more expensive for each 1000 years we are into Dark Future.
    calcPrices(1 /*shatters*/, 0 /*heat*/, 41000 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo((1.01) * 0.84, 5);
    expect(pricesResult.void).toBe(0);
    
    //Each further year we skip needs to be 1/1000th of 1% more expensive
    calcPrices(2 /*shatters*/, 0 /*heat*/, 41000 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo((1.01 + 1.01001) * 0.84, 5 /*We REQUIRE high precision for this */);
    expect(pricesResult.void).toBe(0);
    calcPrices(3 /*shatters*/, 0 /*heat*/, 41000 /*year*/);
    expect(pricesResult.timeCrystal).toBeCloseTo((1.01 + 1.01001 + 1.01002) * 0.84, 5 /*We REQUIRE high precision for this */);
    expect(pricesResult.void).toBe(0);
    
    //At this point, I'm going to do the math on a calculator
    calcPrices(20, 0, 41000);
    expect(pricesResult.timeCrystal).toBeCloseTo((20.2019) * 0.84, 5);
    expect(pricesResult.void).toBe(0);

    //But remember, shatters generate heat--so the 21st shatter costs 0% more heat on top of everything, then 5%, then 10%, etc.
    calcPrices(25, 0, 41000);
    expect(pricesResult.timeCrystal).toBeCloseTo((20.2019 + 1.0102 + 1.0607205 + 1.111242 + 1.1617645 + 1.212288) * 0.84, 5);
    expect(pricesResult.void).toBe(0);

    //Let's test hitting the heat limit BEFORE hitting the DF penalty.
    calcPrices(1000, 0, 39000);
    expect(pricesResult.timeCrystal).toBeCloseTo((20 + 24965.5) * 0.84, 5);
    expect(pricesResult.void).toBe(0);
    calcPrices(1002, 0, 39000);
    expect(pricesResult.timeCrystal).toBeCloseTo((20 + 24965.5 + 50 + 50.0505005) * 0.84, 5);
    expect(pricesResult.void).toBe(0);
    calcPrices(2000, 0, 39000);
    expect(pricesResult.timeCrystal).toBeCloseTo((20 + 24965.5 + 75391.16675) * 0.84, 5);
    expect(pricesResult.void).toBe(0);

    //Let's test hitting the heat limit exactly at the same time as the DF penalty.
    calcPrices(1020, 0, 39980);
    expect(pricesResult.timeCrystal).toBeCloseTo((20 + 26146.41175) * 0.84, 5);
    expect(pricesResult.void).toBe(0);
});