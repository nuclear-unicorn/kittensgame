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

test("Markers & Black Sky Challenge reward", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Default state
	expect(religion.getCorruptionPerTick()).toBeCloseTo(0, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(0, PRECISION);

	//Kickstart necrocorn production
	let markers = religion.getZU("marker");
	markers.on = markers.val = 1;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);

	//With 1 Marker
	expect(religion.getCorruptionPerTick()).toBeCloseTo(1 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(1 / 1e5, PRECISION);

	//Random number from 1 to 100
	markers.on = markers.val = 17;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	expect(religion.getCorruptionPerTick()).toBeCloseTo(17 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(17 / 1e5, PRECISION);

	//Random number from 1 to 15
	let bsk = game.challenges.getChallenge("blackSky");
	bsk.on = 14;
	bsk.researched = true;
	game.upgrade({ challenges: ["blackSky"], zigguratUpgrades: ["marker"]});
	expect(religion.getCorruptionPerTick()).toBeCloseTo(40.8 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(40.8 / 1e5, PRECISION);
});

test("Necrocorn penalty & Unicorn Necropoli", () => {
	var religion = game.religion;
	var pacts = game.religion.pactsManager;
	const PRECISION = 8; //It takes 6 digits of precision to distinguish between 0/1 Markers.

	//Random number from 300 to 500
	let markers = religion.getZU("marker");
	markers.on = markers.val = 317;
	game.upgrade({ "zigguratUpgrades": ["marker"] });
	game.resPool.addResEvent("alicorn", 100);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 1e5, PRECISION);

	//If we have more than 0 necrocorns, it should slow down by a factor of 4
	game.resPool.addResEvent("necrocorn", 0.001);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 4e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 4e5, PRECISION);

	//Necropoli should reduce the corruption penalty.
	//Random number from 1 to 30
	let necropoli = religion.getZU("unicornNecropolis");
	necropoli.on = necropoli.val = 6;
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTick()).toBeCloseTo(507.2 / 4e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(507.2 / 4e5, PRECISION);

	//Necropolis bonus should NOT apply if we are at exactly 0 necrocorns
	game.resPool.addResEvent("necrocorn", -100);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 1e5, PRECISION);

	//30 Necropoli should exactly cancel out the corruption penalty.
	game.resPool.addResEvent("necrocorn", 15);
	necropoli.on = necropoli.val = 30;
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 1e5, PRECISION);

	//With more than 30 Necropoli, we should get a net bonus!
	//Random number from 50 to 100
	necropoli.on = necropoli.val = 75; //Chosen by fair RNG.  Guaranteed to be random.
	game.upgrade({ "zigguratUpgrades": ["unicornNecropolis"] });
	expect(religion.getCorruptionPerTick()).toBeCloseTo(673.625 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(673.625 / 1e5, PRECISION);

	//Again, Necropolis bonus should NOT apply if we are at exactly 0 necrocorns
	game.resPool.addResEvent("necrocorn", -100);
	expect(religion.getCorruptionPerTick()).toBeCloseTo(317 / 1e6, PRECISION);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(317 / 1e5, PRECISION);
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
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(100 / 1e5 * blsBoost, PRECISION);

	//Let's pick 3 different random numbers from 1 to 100
	markers.on = markers.val = 74;
	radiance.on = radiance.val = 14;
	game.resPool.get("sorrow").value = 71;
	game.upgrade({ "zigguratUpgrades": ["marker"], "transcendenceUpgrades": ["blackRadiance"] });
	blsBoost = 1 + Math.sqrt(11928 / 10000);
	expect(game.getResourcePerDay("necrocorn")).toBeCloseTo(74 / 1e5 * blsBoost, PRECISION);
});

var fastForwardTestCases = [
	//Test nothing
	{ startDeficit: 1.7, startCorruption: 0.3, startNCorns: 12, pactsActive: 0, threshold: 0, markers: 0,
		daysSimulated: 250000, ticksSimulated: 175000, endDeficit: 1.7, endCorruption: 0.3, endNCorns: 12 },
	//Test corruption with no Pacts
	{ startDeficit: 0, startCorruption: 0, startNCorns: 0, pactsActive: 0, threshold: 2 /*penalty kicks in when we go from 2->3*/, markers: 50,
		daysSimulated: 0, ticksSimulated: 100000, endDeficit: 0, endCorruption: 0.5, endNCorns: 3 },
	{ startDeficit: 0, startCorruption: 0.5, startNCorns: 0.5, pactsActive: 0, threshold: 0, markers: 100,
		daysSimulated: 0, ticksSimulated: 40000, endDeficit: 0, endCorruption: 0.5, endNCorns: 1.5 },
	//Test Pacts with no corruption
	{ startDeficit: 0, startCorruption: 0, startNCorns: 1, pactsActive: 20, threshold: 0, markers: 0,
		daysSimulated: 200, ticksSimulated: 0, endDeficit: 1, endCorruption: 0, endNCorns: 0 },
	//Test Pacts with corruption but always above the threshold
	{ startDeficit: 0, startCorruption: 0, startNCorns: 150, pactsActive: 20, threshold: 0, markers: 100,
		daysSimulated: 200, ticksSimulated: 2000, endDeficit: 0, endCorruption: 0.05, endNCorns: 148 },
	{ startDeficit: 0, startCorruption: 0, startNCorns: 150, pactsActive: 20, threshold: 0, markers: 100,
		daysSimulated: 200, ticksSimulated: 200000, endDeficit: 0, endCorruption: 0, endNCorns: 153 },
	//Test Pacts with corruption but we go above the threshold partway through
	{ startDeficit: 0, startCorruption: 0.9, startNCorns: 1, pactsActive: 1, threshold: 1, markers: 100,
		daysSimulated: 1000, ticksSimulated: 10000, endDeficit: 0, endCorruption: 0.225, endNCorns: 1.5 },
	//Test Pacts with corruption but we fall below the threshold
	{ startDeficit: 0, startCorruption: 0, startNCorns: 1.5, pactsActive: 20, threshold: 1, markers: 100,
		//After 50 days (1000 ticks), we dip below the threshold while corruption goes from 0 -> 0.025
		//After 50 more days (1000 ticks), we've consumed another half-necrocorn & made 0.1 more corruption
		daysSimulated: 100, ticksSimulated: 2000, endDeficit: 0, endCorruption: 0.125, endNCorns: 0.5 },
	//Test Pacts with corruption but we're constantly hovering around the threshold
	//With 1 day = 1 tick, 500 Markers produces exactly as much as 1 Pact consumes.
	{ startDeficit: 0, startCorruption: 0.5, startNCorns: 1, pactsActive: 1, threshold: 1, markers: 500,
		//After 1000 days/ticks, Pacts consume a half necrocorn & we go from 0.5 to 1 corruption, taking us from 0.5 to 1.5 necrocorns
		//After 1000 more days/ticks, Pacts consume a half necrocorn & we go below the threshold (hitting 0.9999), meanwhile we've only corrupted 0.125
		//After 1000 more days/ticks, Pacts consume half a necrocorn (taking us from 1 -> 0.5) &  we go from 0.125 to 0.625 corruption
		daysSimulated: 3000, ticksSimulated: 3000, endDeficit: 0, endCorruption: 0.625, endNCorns: 0.5 }
];
//We can use this "test.each" functionality to inject the parameters of the scenario into the name of the test
// so that if a test case fails, we know exactly which one failed!
test.each(fastForwardTestCases)("Test necrocorn fast-forward without Siphoning (%j)", (scenario) => {
	var religion = game.religion;
	var pacts = religion.pactsManager;
	var necrocornRes = game.resPool.get("necrocorn");
	const PRECISION = 4; //I don't know why, but due to rounding errors, these tests fail if we insist on super high precision.

	let pactOfDestruction = religion.getPact("pactOfDestruction");
	let marker = religion.getZU("marker");

	//Setup:
	pacts.necrocornDeficit = scenario.startDeficit;
	religion.corruption = scenario.startCorruption;
	necrocornRes.value = scenario.startNCorns;
	pactOfDestruction.on = pactOfDestruction.val = scenario.pactsActive;
	religion.getExistNecrocornThreshold = function() { return scenario.threshold; }; //The code was designed to work with the threshold set at any arbitrary positive value.
	marker.on = marker.val = scenario.markers;
	game.calculateAllEffects(); //Apply effects of Pacts & Markers
	game.resPool.addResEvent("alicorn", 100); //Necrocorns will not corrupt unless we have a few of these lying around

	//Run calculations:
	religion.necrocornFastForward(scenario.daysSimulated, scenario.ticksSimulated);

	//End state:
	expect(pacts.necrocornDeficit).toBeCloseTo(scenario.endDeficit, PRECISION);
	expect(religion.corruption).toBeCloseTo(scenario.endCorruption, PRECISION);
	expect(necrocornRes.value).toBeCloseTo(scenario.endNCorns, PRECISION);
});

fastForwardTestCases = [
	//Test nothing
	{ startDeficit: 1.7, startCorruption: 0.3, startNCorns: 12, pactsActive: 0, threshold: 0, markers: 0,
		daysSimulated: 250000, ticksSimulated: 175000, endDeficit: 1.7, endCorruption: 0.3, endNCorns: 12 },
	//Test corruption with no Pacts
	{ startDeficit: 0, startCorruption: 0, startNCorns: 0, pactsActive: 0, threshold: 2 /*penalty kicks in when we go from 2->3*/, markers: 50,
		daysSimulated: 0, ticksSimulated: 100000, endDeficit: 0, endCorruption: 0.5, endNCorns: 3 },
	{ startDeficit: 0, startCorruption: 0.5, startNCorns: 0.5, pactsActive: 0, threshold: 0, markers: 100,
		daysSimulated: 0, ticksSimulated: 40000, endDeficit: 0, endCorruption: 0.5, endNCorns: 1.5 },
	//Test Pacts with no corruption
	{ startDeficit: 0, startCorruption: 0, startNCorns: 1, pactsActive: 20, threshold: 0, markers: 0,
		daysSimulated: 200, ticksSimulated: 0, endDeficit: 2, endCorruption: 0, endNCorns: 1 },
	//Test Pacts with corruption but always above the threshold
	{ startDeficit: 0, startCorruption: 0, startNCorns: 150, pactsActive: 20, threshold: 0, markers: 100,
		daysSimulated: 200, ticksSimulated: 2000, endDeficit: 2, endCorruption: 0.05, endNCorns: 150 },
	{ startDeficit: 0, startCorruption: 0, startNCorns: 150, pactsActive: 20, threshold: 0, markers: 100,
		daysSimulated: 200, ticksSimulated: 200000, endDeficit: 0, endCorruption: 0, endNCorns: 153 },
	//Test Pacts with corruption but we go above the threshold, can't pay for upkeep, & accumulate debt
	//With 1 day = 1 tick, 500 Markers produces exactly as much as 1 Pact consumes.
	{ startDeficit: 1.5, startCorruption: 0, startNCorns: 0, pactsActive: 1, threshold: 0, markers: 1000,
		//After 1000 days/ticks, we produce 1 necrocorn, which is immediately consumed to lower debt from 2 to 1
		//After 1000 more days/ticks, we lower debt from 1.5 to 0.5
		//After 1000 more days/ticks, we lower debt from 1 to 0
		//After 1000 more days/ticks, debt is 0.5, so we can produce 1 necrocorn & go above the threshold
		//After 4000 more days/ticks, we produce another necrocorn & lower debt from 2.5 to 1.5
		//After 2000 more days/ticks, corruption is at 0.5 & debt is at 2.5
		daysSimulated: 10000, ticksSimulated: 10000, endDeficit: 2.5, endCorruption: 0.5, endNCorns: 1 },
	//Test Pacts with corruption but we are below the threshold & can't pay for upkeep so we accumulate debt
	{ startDeficit: 0, startCorruption: 0, startNCorns: 0, pactsActive: 1, threshold: 0, markers: 100,
		daysSimulated: 75000, ticksSimulated: 75000, endDeficit: 30.5, endCorruption: 0.5, endNCorns: 0 },
	//Test Pacts with corruption but we go above the threshold & keep producing necrocorns
	{ startDeficit: 1.5, startCorruption: 0, startNCorns: 0, pactsActive: 1, threshold: 0, markers: 1000,
		//After 1000 ticks (100 days), we produce 1 necrocorn, which is immediately consumed to lower debt from 1.55 to 0.55
		//After 1000 more ticks (100 days), debt is 0.6 & we produce a necrocorn to go above the threshold
		//After 4000 more ticks (400 days), debt goes up to 0.8 & we produce a necrocorn (at 2 now)
		//After 4000 ticks again, debt is at 1 & we don't produce a necrocorn
		//Then we go into a cycle lasting 20,000 ticks (2000 days) where we produce 5 necrocorns &
		// 1 is siphoned away to pay off debt, for an effective +4 necro per cycle
		//We'll do this cycle 4 times (going from 2->18 necrocorns)
		//Then let's simulate 100 more ticks (10 days) so that if any rounding errors happen, there's tolerance in the numbers
		daysSimulated: 9010, ticksSimulated: 90100, endDeficit: 0.005, endCorruption: 0.025, endNCorns: 18 }
];
test.each(fastForwardTestCases)("Test necrocorn fast-forward with Siphoning (%j)", (scenario) => {
	var religion = game.religion;
	var pacts = religion.pactsManager;
	var necrocornRes = game.resPool.get("necrocorn");
	const PRECISION = 4; //I don't know why, but due to rounding errors, these tests fail if we insist on super high precision.

	game.science.getPolicy("siphoning").researched = true;
	let pactOfDestruction = religion.getPact("pactOfDestruction");
	let marker = religion.getZU("marker");

	//Setup:
	pacts.necrocornDeficit = scenario.startDeficit;
	religion.corruption = scenario.startCorruption;
	necrocornRes.value = scenario.startNCorns;
	pactOfDestruction.on = pactOfDestruction.val = scenario.pactsActive;
	religion.getExistNecrocornThreshold = function() { return scenario.threshold; }; //The code was designed to work with the threshold set at any arbitrary positive value.
	marker.on = marker.val = scenario.markers;
	game.calculateAllEffects(); //Apply effects of Pacts & Markers
	game.resPool.addResEvent("alicorn", 100); //Necrocorns will not corrupt unless we have a few of these lying around

	//Run calculations:
	religion.necrocornFastForward(scenario.daysSimulated, scenario.ticksSimulated);

	//End state:
	expect(pacts.necrocornDeficit).toBeCloseTo(scenario.endDeficit, PRECISION);
	expect(religion.corruption).toBeCloseTo(scenario.endCorruption, PRECISION);
	expect(necrocornRes.value).toBeCloseTo(scenario.endNCorns, PRECISION);
});