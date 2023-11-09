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