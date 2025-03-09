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

test("Are Pacts enabled?", () => {
	//I wrote this file specifically to ensure that Siphoning works.
	//If Pacts are disabled, then we should probaly skip this test suite.
	expect(game.getFeatureFlag("MAUSOLEUM_PACTS")).toBeTruthy();
});

test("Without Siphoning, corruption should work properly", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Default state
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(0, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Kickstart necrocorn production
	let markers = religion.getZU("marker");
	markers.on = markers.val = 1;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);

	//With 1 Marker
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(1 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(1 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(1 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Random number from 1 to 100
	markers.on = markers.val = 17;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(17 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(17 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(17 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Random number from 1 to 15
	let bsk = game.challenges.getChallenge("blackSky");
	bsk.on = 14;
	bsk.researched = true;
	game.upgrade({ challenges: ["blackSky"], zigguratUpgrades: ["marker"]});
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(40.8 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(40.8 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(40.8 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Add some Pacts
	let testPact = religion.getPact("pactOfCleansing");
	testPact.on = testPact.val = 5;
	game.upgrade({ "pacts": ["pactOfCleansing"]});
	expect(religion.effectsBase["pactNecrocornConsumption"]).toBeCloseTo(-1 / 2000, PRECISION);
	expect(game.getEffect("necrocornPerDay")).toBeCloseTo(-5 / 2000, PRECISION);

	//Now, test necrocorn values again.
	//A bunch of these will still be 0 due to them being specific to Siphoning, which isn't active right now.
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(40.8 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(40.8 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(-209.2 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);
});

test("With Siphoning, corruption should work properly", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Kickstart necrocorn production
	let markers = religion.getZU("marker");
	markers.on = markers.val = 1;
	game.science.getPolicy("siphoning").researched = true;
	game.upgrade({ "policies": ["siphoning"], "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);

	//With 1 Marker
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(1 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(1 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(1 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Random number from 1 to 100
	markers.on = markers.val = 53;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(53 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(53 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(53 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Random number from 1 to 15
	let bsk = game.challenges.getChallenge("blackSky");
	bsk.on = 15;
	bsk.researched = true;
	game.upgrade({ challenges: ["blackSky"], zigguratUpgrades: ["marker"]});
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(132.5 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(132.5 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(132.5 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Add some Pacts
	let testPact = religion.getPact("pactOfCleansing");
	testPact.on = testPact.val = 5;
	game.upgrade({ "pacts": ["pactOfCleansing"]});
	expect(religion.effectsBase["pactNecrocornConsumption"]).toBeCloseTo(-1 / 2000, PRECISION);
	expect(game.getEffect("necrocornPerDay")).toBeCloseTo(-5 / 2000, PRECISION);

	//Now, test necrocorn values again
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(132.5 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(117.5 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(-117.5 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(132.5 / 1e5, PRECISION);
});

test("Siphoning should work if we CAN afford to pay in full", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Kickstart necrocorn production
	//250 Markers should exactly balance out Pact requirements
	let markers = religion.getZU("marker");
	markers.on = markers.val = 250;
	game.science.getPolicy("siphoning").researched = true;
	game.upgrade({ "policies": ["siphoning"], "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);

	//Add some Pacts
	let testPact = religion.getPact("pactOfCleansing");
	testPact.on = testPact.val = 5;
	game.upgrade({ "pacts": ["pactOfCleansing"]});
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(250 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(0, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);

	//Random number from 300 to 500
	markers.on = markers.val = 383;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(383 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(133 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(133 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);
});

test("Necrocorn penalty & unicorn necropoli", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Random number from 300 to 500
	let markers = religion.getZU("marker");
	markers.on = markers.val = 317;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//If we have more than 0 necrocorns, it should slow down by a factor of 4
	game.resPool.addResEvent("necrocorn", 0.001);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 4e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 4e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 4e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(0, PRECISION);

	//Add Pacts & Siphoning
	let testPact = religion.getPact("pactOfCleansing");
	testPact.on = testPact.val = 5;
	game.science.getPolicy("siphoning").researched = true;
	game.upgrade({ "pacts": ["pactOfCleansing"], "policies": ["siphoning"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 4e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-1000 / 4e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(683 / 4e6, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(-683 / 4e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(317 / 4e5, PRECISION);

	//Necropoli should reduce the corruption penalty.
	//Random number from 1 to 30
	let necropoli = religion.getZU("unicornNecropolis");
	necropoli.on = necropoli.val = 6;
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(507.2 / 4e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-1000 / 4e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(492.8 / 4e6, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(-492.8 / 4e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(507.2 / 4e5, PRECISION);

	//Necropolis bonus should NOT apply if we are at exactly 0 necrocorns
	game.resPool.addResEvent("necrocorn", -100);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(67 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(67 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);

	//30 Necropoli should exactly cancel out the corruption penalty.
	game.resPool.addResEvent("necrocorn", 15);
	necropoli.on = necropoli.val = 30;
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(67 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(67 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);

	//With more than 30 Necropoli, we should get a net bonus!
	//Random number from 50 to 100
	necropoli.on = necropoli.val = 75; //Chosen by fair RNG.  Guaranteed to be random.
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(673.625 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(423.625 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(423.625 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);

	//Again, necropolis bonus should NOT apply if we are at exactly 0 necrocorns
	game.resPool.addResEvent("necrocorn", -100);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(religion.getCorruptionPerTickConsumption()).toBeCloseTo(-250 / 1e6, PRECISION);
	expect(religion.getCorruptionDeficitPerTick()).toBeCloseTo(0, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(67 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(67 / 1e5, PRECISION);
	expect(pacts.getSiphonedCorruption(1)).toBeCloseTo(250 / 1e5, PRECISION);
});

test("Black Radiances", () => {
	var religion = game.religion;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Random number from 1 to 100
	let markers = religion.getZU("marker");
	markers.on = markers.val = 100; //I wasn't expecting this to happen, but we'll roll with it
 	//All these numbers are hardcoded, so we assume Black Radiance is EXACTLY *this* strong
	let radiance = religion.getTU("blackRadiance");
	expect(radiance.effects["blsCorruptionRatio"]).toBeCloseTo(12 / 10000, PRECISION);
	//Random number from 1 to 100
	radiance.on = radiance.val = 83;
	//Random number from 1 to 100
	game.resPool.get("sorrow").value = 62; //Bypass storage limits because we don't care in this scenario
	game.resPool.addResEvent("alicorn", 100);
	game.upgrade({ "zigguratUpgrades": ["marker"], "transcendenceUpgrades": ["blackRadiance"] });

	let blsBoost = 1 + Math.sqrt(61752 / 10000);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(100 / 1e6 * blsBoost, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(100 / 1e6 * blsBoost, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(100 / 1e5 * blsBoost, PRECISION);

	//Let's pick 3 different random numbers from 1 to 100
	markers.on = markers.val = 74;
	radiance.on = radiance.val = 14;
	game.resPool.get("sorrow").value = 71;
	game.upgrade({ "zigguratUpgrades": ["marker"], "transcendenceUpgrades": ["blackRadiance"] });
	blsBoost = 1 + Math.sqrt(11928 / 10000);
	expect(religion.getCorruptionPerTickProduction()).toBeCloseTo(74 / 1e6 * blsBoost, PRECISION);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(74 / 1e6 * blsBoost, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(74 / 1e5 * blsBoost, PRECISION);
});