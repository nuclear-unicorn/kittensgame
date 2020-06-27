/**
 * Behold the bringer of light!
 */
dojo.declare("classes.managers.ReligionManager", com.nuclearunicorn.core.TabManager, {

	game: null,

	faith: 0,
	faithRatio : 0,
	faithRatioReserve: 0,
	tcratio: 0,
	tcratioReserve: 0,
	corruption: 0,

	alicornCounter: 0,

	constructor: function(game){
		this.game = game;
		this.registerMeta("stackable", this.zigguratUpgrades, null);
		this.registerMeta("stackable", this.religionUpgrades, null);
		this.registerMeta("stackable", this.transcendenceUpgrades, null);
		this.setEffectsCachedExisting();
	},

	resetState: function(){
		this.faith = 0;
		this.corruption = 0;
		this.faithRatio = 0;
		this.faithRatioReserve = 0;
		this.tcratio = 0;
		this.tcratioReserve = 0;

		for (var i = 0; i < this.zigguratUpgrades.length; i++){
			var zu = this.zigguratUpgrades[i];
			zu.unlocked = zu.defaultUnlocked || false;
			this.resetStateStackable(zu);
		}

		for (i = 0; i < this.religionUpgrades.length; i++){
			var ru = this.religionUpgrades[i];
			this.resetStateStackable(ru);
		}

		for (i = 0; i < this.transcendenceUpgrades.length; i++){
			var tu = this.transcendenceUpgrades[i];
			tu.unlocked = false;
			this.resetStateStackable(tu);
		}
	},

	save: function(saveData){
		saveData.religion = {
			faith: this.faith,
			corruption: this.corruption,
			faithRatio: this.faithRatio,
			faithRatioReserve: this.faithRatioReserve,
			tcratio: this.tcratio,
			tcratioReserve: this.tcratioReserve,
			zu: this.filterMetadata(this.zigguratUpgrades, ["name", "val", "on", "unlocked"]),
			ru: this.filterMetadata(this.religionUpgrades, ["name", "val", "on"]),
			tu: this.filterMetadata(this.transcendenceUpgrades, ["name", "val", "on", "reserve", "unlocked"])
		};
	},

	load: function(saveData){
		if (!saveData.religion){
			return;
		}

		this.faith = saveData.religion.faith || 0;
		this.corruption = saveData.religion.corruption || 0;
		this.faithRatio = saveData.religion.faithRatio || 0;
		this.faithRatioReserve = saveData.religion.faithRatioReserve || 0;
		this.tcratio = saveData.religion.tcratio || 0;
		this.tcratioReserve = saveData.religion.tcratioReserve || 0;
		this.loadMetadata(this.zigguratUpgrades, saveData.religion.zu);
		this.loadMetadata(this.religionUpgrades, saveData.religion.ru);
		this.loadMetadata(this.transcendenceUpgrades, saveData.religion.tu);

		this.tclevel = this.getTranscendenceLevel();

		for (var i = 0; i < this.transcendenceUpgrades.length; i++){
			var tu = this.transcendenceUpgrades[i];
			if (this.tclevel >= tu.tier) {
				tu.unlocked = true;
			}
		}
	},

	update: function(){
		if (this.game.resPool.get("faith").value > 0 || this.game.challenges.getChallenge("atheism").on && this.game.bld.get("ziggurat").val > 0){
			this.game.religionTab.visible = true;
		}

		//safe switch for a certain type of pesky bugs with conversion
		if (isNaN(this.faith)){
			this.faith = 0;
		}

		var alicorns = this.game.resPool.get("alicorn");
		if (alicorns.value > 0) {
			//30% bls * 20 Radiance should yield ~ 50-75% boost rate which is laughable but we can always buff it
			var blsBoost = 1 + Math.sqrt(this.game.resPool.get("sorrow").value * this.game.getEffect("blsCorruptionRatio"));
			var corruptionBoost = this.game.resPool.get("necrocorn").value > 0
				? 0.25 * (1 + this.game.getEffect("corruptionBoostRatio")) // 75% penalty
				: 1;
			this.corruption += this.game.getEffect("corruptionRatio") * blsBoost * corruptionBoost;
		} else {
			this.corruption = 0;
		}

		if (this.corruption >= 1) {
			if (alicorns.value > 1) {
				this.corruption--;
				alicorns.value--;
				this.game.resPool.get("necrocorn").value++;
				this.game.upgrade({
					zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
				});
				this.game.msg($I("religion.msg.corruption"), "important");
			} else {
				this.corruption = 1;
			}
		}

		if (this.game.calendar.day >= 0) {
			this.triggerOrderOfTheVoid(1);
		}
	},

	fastforward: function(daysOffset) {
		var times = daysOffset * this.game.calendar.ticksPerDay;
		//safe switch for a certain type of pesky bugs with conversion
		if (isNaN(this.faith)){
			this.faith = 0;
		}
		var alicorns = this.game.resPool.get("alicorn");
		if (alicorns.value > 0) {
			//30% bls * 20 Radiance should yield ~ 50-75% boost rate which is laughable but we can always buff it
			var blsBoost = 1 + Math.sqrt(this.game.resPool.get("sorrow").value * this.game.getEffect("blsCorruptionRatio"));
			var corruptionPerTickBeforeFirstNecrocorn = this.game.getEffect("corruptionRatio") * blsBoost;
			var ticksBeforeFirstNecrocorn = this.game.resPool.get("necrocorn").value < 1
				// this.corruption is <= 1 at this point, no need to check if 1-this.corruption is negative
				? Math.min(Math.ceil((1 - this.corruption) / corruptionPerTickBeforeFirstNecrocorn), times)
				: 0;
			var ticksAfterFirstNecrocorn = times - ticksBeforeFirstNecrocorn;
			var corruptionBoost = 0.25 * (1 + this.game.getEffect("corruptionBoostRatio")); // 75% penalty
			this.corruption += corruptionPerTickBeforeFirstNecrocorn * (ticksBeforeFirstNecrocorn + ticksAfterFirstNecrocorn * corruptionBoost);
		} else {
			this.corruption = 0;
		}

		// Prevents alicorn count to fall to 0, which would stop the per-tick generation
		var maxAlicornsToCorrupt = Math.ceil(alicorns.value) - 1;
		var alicornsToCorrupt = Math.floor(Math.min(this.corruption, maxAlicornsToCorrupt));
		if (alicornsToCorrupt > 0) {
			this.corruption -= alicornsToCorrupt;
			alicorns.value -= alicornsToCorrupt;
			this.game.resPool.get("necrocorn").value += alicornsToCorrupt;
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}
		if (this.corruption >= 1) {
			this.corruption = 1;
		}

		this.triggerOrderOfTheVoid(times);
	},

	// Accumulates the equivalent of 10 % (improved by Void Resonators) of produced faith, but with only a quarter of apocrypha bonus
	triggerOrderOfTheVoid: function(numberOfTicks) {
		if (this.game.prestige.getPerk("voidOrder").researched) {
			var convertedFaith = numberOfTicks * this.game.calcResourcePerTick("faith") * 0.1 * (1 + this.game.getEffect("voidResonance"));
			this.faith += convertedFaith * (1 + this.getApocryphaBonus() / 4);
		}
	},

	zigguratUpgrades: [{
		name: "unicornTomb",
		label: $I("religion.zu.unicornTomb.label"),
		description: $I("religion.zu.unicornTomb.desc"),
		prices: [
			{ name : "ivory", val: 500 },
			{ name : "tears", val: 5 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.05
		},
		unlocked: true,
		defaultUnlocked: true,
		unlocks: {
			"zigguratUpgrades": ["ivoryTower"]
		}
	},{
		name: "ivoryTower",
		label: $I("religion.zu.ivoryTower.label"),
		description: $I("religion.zu.ivoryTower.desc"),
		prices: [
			{ name : "ivory", val: 25000 },
			{ name : "tears", val: 25 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.1,
			"riftChance" : 5
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["ivoryCitadel"]
		}
	},{
		name: "ivoryCitadel",
		label: $I("religion.zu.ivoryCitadel.label"),
		description: $I("religion.zu.ivoryCitadel.desc"),
		prices: [
			{ name : "ivory", val: 50000 },
			{ name : "tears", val: 50 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.25,
			"ivoryMeteorChance" : 5
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["skyPalace"]
		}
	},{
		name: "skyPalace",
		label: $I("religion.zu.skyPalace.label"),
		description: $I("religion.zu.skyPalace.desc"),
		prices: [
			{ name : "ivory", val: 125000 },
			{ name : "tears", val: 500 },
			{ name : "megalith", val: 5 }
		],
		priceRatio: 1.15,
		effects: {
			"goldMaxRatio": 0,
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"ivoryMeteorRatio" : 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"goldMaxRatio": 0.01,
				"unicornsRatioReligion" : 0.5,
				"alicornChance" : 10,
				"alicornPerTick" : 0,
				"ivoryMeteorRatio" : 0.05
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.00002;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["unicornUtopia"]
		}
	},{
		name: "unicornUtopia",
		label: $I("religion.zu.unicornUtopia.label"),
		description: $I("religion.zu.unicornUtopia.desc"),
		prices: [
			{ name : "gold", val: 500 },
			{ name : "ivory", val: 1000000 },
			{ name : "tears", val: 5000 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"tcRefineRatio" : 0,
			"ivoryMeteorRatio" : 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"unicornsRatioReligion" : 2.5,
				"alicornChance" : 15,
				"alicornPerTick" : 0,
				"tcRefineRatio" : 0.05,
				"ivoryMeteorRatio" : 0.15
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.000025;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["sunspire"]
		},
		unlockScheme: {
			name: "unicorn",
			threshold: 1
		}
	},{
		name: "sunspire",
		label: $I("religion.zu.sunspire.label"),

		//TODO: make SSPIRE make something really interesting
		description: $I("religion.zu.sunspire.desc"),
		prices: [
			{ name : "gold", val: 1250 },
			{ name : "ivory", val: 750000 },
			{ name : "tears", val: 25000 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"tcRefineRatio": 0,
			"ivoryMeteorRatio" : 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"unicornsRatioReligion" : 5,
				"alicornChance" : 30,
				"alicornPerTick" : 0,
				"tcRefineRatio" : 0.1,
				"ivoryMeteorRatio" : 0.5
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.00005;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false
	},{
		name: "marker",
		label: $I("religion.zu.marker.label"),
		description: $I("religion.zu.marker.desc"),
		prices: [
			{ name : "unobtainium", val: 2500 },
			{ name : "spice", val: 50000 },
			{ name : "tears", val: 5000 },
			{ name : "megalith", val: 750 }
		],
		priceRatio: 1.15,
		effects: {
			"corruptionRatio" : 0.000001
		},
		calculateEffects: function(self, game) {
			self.effects["corruptionRatio"] = 0.000001 * (game.challenges.getChallengeReward("blackSky"));
		},
		unlocked: false,
		getEffectiveValue: function(game) {
			return this.val * (game.challenges.getChallengeReward("blackSky"));
		}
	},{
		name: "unicornGraveyard",
		label: $I("religion.zu.unicornGraveyard.label"),
		description: $I("religion.zu.unicornGraveyard.desc"),
		prices: [
			{ name : "necrocorn", val: 5 },
			{ name : "megalith", val: 1000 }
		],
		priceRatio: 1.15,
		effects: {
			"cultureMaxRatioBonus" : 0.01,
			"blackLibraryBonus": 0.02
		},
		upgrades: {
			buildings: ["ziggurat"]
		},
		unlocks: {
			"zigguratUpgrades": ["unicornNecropolis"]
		},
		unlocked: false
	},{
		name: "unicornNecropolis",
		label: $I("religion.zu.unicornNecropolis.label"),
		description: $I("religion.zu.unicornNecropolis.desc"),
		prices: [
			{ name : "alicorn", val: 100 },
			{ name : "necrocorn", val: 15 },
			{ name : "void", val: 5 },
			{ name : "megalith", val: 2500 }
		],
		priceRatio: 1.15,
		effects: {
			"corruptionBoostRatio" : 0.10
		},
		unlocked: false
	},{
		name: "blackPyramid",
		label: $I("religion.zu.blackPyramid.label"),
		description: $I("religion.zu.blackPyramid.desc"),
		prices: [
			{ name : "unobtainium", val: 5000 },
			{ name : "spice", val: 150000 },
			{ name : "sorrow", val: 5 },
			{ name : "megalith", val: 2500 }
		],
		priceRatio: 1.15,
		effects: {
		},
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		unlocked: false,
		flavor: $I("religion.zu.blackPyramid.flavor"),
		getEffectiveValue: function(game) {
			return this.val + (game.challenges.getChallengeResearched("blackSky") ? 1 : 0);
		}
	}],

	religionUpgrades:[{
		name: "solarchant",
		label: $I("religion.ru.solarchant.label"),
		description: $I("religion.ru.solarchant.desc"),
		prices: [
			{ name : "faith", val: 100 }
		],
		faith: 150,	//total faith required to unlock the upgrade
		effects: {
			"faithRatioReligion" : 0.1
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "scholasticism",
		label: $I("religion.ru.scholasticism.label"),
		description: $I("religion.ru.scholasticism.desc"),
		prices: [
			{ name : "faith", val: 250 }
		],
		faith: 300,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "goldenSpire",
		label: $I("religion.ru.goldenSpire.label"),
		description: $I("religion.ru.goldenSpire.desc"),
		prices: [
			{ name : "gold",  val: 150 },
			{ name : "faith", val: 350 }
		],
		faith: 500,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5,
		flavor: $I("religion.ru.goldenSpire.flavor")
	},{
		name: "sunAltar",
		label: $I("religion.ru.sunAltar.label"),
		description: $I("religion.ru.sunAltar.desc"),
		prices: [
			{ name : "gold",  val: 250 },
			{ name : "faith", val: 500 }
		],
		faith: 750,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "stainedGlass",
		label: $I("religion.ru.stainedGlass.label"),
		description: $I("religion.ru.stainedGlass.desc"),
		prices: [
			{ name : "gold",  val: 250 },
			{ name : "faith", val: 500 }
		],
		faith: 750,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "solarRevolution",
		label: $I("religion.ru.solarRevolution.label"),
		description: $I("religion.ru.solarRevolution.desc"),
		prices: [
			{ name : "gold",  val: 500 },
			{ name : "faith", val: 750 }
		],
		faith: 1000,
		effects: {
			//none
		},
		noStackable: true
	},{
		name: "basilica",
		label: $I("religion.ru.basilica.label"),
		description: $I("religion.ru.basilica.desc"),
		prices: [
			{ name : "gold",  val: 750 },
			{ name : "faith", val: 1250 }
		],
		faith: 10000,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "templars",
		label: $I("religion.ru.templars.label"),
		description: $I("religion.ru.templars.desc"),
		prices: [
			{ name : "gold",  val: 3000 },
			{ name : "faith", val: 3500 }
		],
		faith: 75000,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "apocripha",
		label: $I("religion.ru.apocripha.label"),
		description: $I("religion.ru.apocripha.desc"),
		prices: [
			{ name : "gold",  val: 5000 },
			{ name : "faith", val: 5000 }
		],
		faith: 100000,
		effects: {
			//none
		},
		noStackable: true
	},{
		name: "transcendence",
		label: $I("religion.ru.transcendence.label"),
		description: $I("religion.ru.transcendence.desc"),
		prices: [
			{ name : "gold",  val: 7500 },
			{ name : "faith", val: 7500 }
		],
		faith: 125000,
		effects: {
			//none
		},
		upgrades: {
			religion: ["solarchant", "scholasticism", "goldenSpire", "sunAltar", "stainedGlass", "basilica", "templars"]
		},
		noStackable: true
	}],

	transcendenceUpgrades: [
	{
		name: "blackObelisk",
		label: $I("religion.tu.blackObelisk.label"),
		description: $I("religion.tu.blackObelisk.desc"),
		prices: [
			{ name : "relic", val: 100 }
		],
		tier: 1,
		priceRatio: 1.15,
		effects: {},
		unlocked: false,
		flavor: $I("religion.tu.blackObelisk.flavor")
	},{
		name: "blackNexus",
		label: $I("religion.tu.blackNexus.label"),
		description: $I("religion.tu.blackNexus.desc"),
		prices: [
			{ name : "relic", val: 5000 }
		],
		tier: 3,
		priceRatio: 1.15,
		effects: {
			"relicRefineRatio" : 1.0
		},
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		unlocked: false,
		flavor: $I("religion.tu.blackNexus.flavor")
	},{
		name: "blackCore",
		label: $I("religion.tu.blackCore.label"),
		description: $I("religion.tu.blackCore.desc"),
		prices: [
			{ name : "relic", val: 10000 }
		],
		tier: 5,
		priceRatio: 1.15,
		effects: {
			"blsLimit" : 1
		},
		unlocked: false,
		flavor: $I("religion.tu.blackCore.flavor")
	},{
		name: "singularity",
		label: $I("religion.tu.singularity.label"),
		description: $I("religion.tu.singularity.desc"),
		prices: [
			{ name : "relic", val: 25000 }
		],
		tier: 7,
		priceRatio: 1.15,
		effects: {
			"globalResourceRatio" : 0.10
		},
		unlocked: false,
		flavor: $I("religion.tu.singularity.flavor")
	},{
		name: "blackLibrary",
		label: $I("religion.tu.blackLibrary.label"),
		description: $I("religion.tu.blackLibrary.desc"),
		prices: [
			{ name : "relic", val: 30000 }
		],
		tier: 9,
		priceRatio: 1.15,
		effects: {
			"compendiaTTBoostRatio" : 0.02
		},
		unlocked: false,
		flavor: $I("religion.tu.blackLibary.flavor")
	},{
		name: "blackRadiance",
		label: $I("religion.tu.blackRadiance.label"),
		description: $I("religion.tu.blackRadiance.desc"),
		prices: [
			{ name : "relic", val: 37500 }
		],
		tier: 12,
		priceRatio: 1.15,
		effects: {
			"blsCorruptionRatio" : 0.0012
		},
		unlocked: false,
		flavor: $I("religion.tu.blackRadiance.flavor")
	},{
		name: "blazar",
		label: $I("religion.tu.blazar.label"),
		description: $I("religion.tu.blazar.desc"),
		prices: [
			{ name : "relic", val: 50000 }
		],
		tier: 15,
		priceRatio: 1.15,
		effects: {
			//Should at least improve impedance scaling by some value (5%? 10%). Probably something else
			"timeRatio" : 0.10,
			"rrRatio" : 0.02
		},
		upgrades: {
			chronoforge: ["temporalImpedance"]
		},
		unlocked: false,
		flavor: $I("religion.tu.blazar.flavor")
	},{
		name: "darkNova",
		label: $I("religion.tu.darkNova.label"),
		description: $I("religion.tu.darkNova.desc"),
		prices: [
			{ name : "relic", val: 75000 },
			{ name : "void",  val: 7500 }
		],
		tier: 20,
		priceRatio: 1.15,
		effects: {
			"energyProductionRatio": 0.02
		},
		unlocked: false,
		flavor: $I("religion.tu.darkNova.flavor")
	},{
		name: "holyGenocide",
		label: $I("religion.tu.holyGenocide.label"),
		description: $I("religion.tu.holyGenocide.desc"),
		prices: [
			{ name : "relic", val: 100000 },
			{ name : "void", val: 25000 }
		],
		tier: 25,
		priceRatio: 1.15,
		effects: {
		},
		unlocked: false,
		flavor: $I("religion.tu.holyGenocide.flavor")
	}
		//Holy Memecide
	],

	getZU: function(name){
		return this.getMeta(name, this.zigguratUpgrades);
	},

	getRU: function(name){
		return this.getMeta(name, this.religionUpgrades);
	},

	getTU: function(name){
		return this.getMeta(name, this.transcendenceUpgrades);
	},

	getProductionBonus: function(){
		var rate = this.getRU("solarRevolution").on ? this.game.getTriValue(this.faith, 1000) : 0;
		//Solar Revolution capped to 1000% so it doesn't become game-breaking
		var atheismBonus = this.game.challenges.getChallengeResearched("atheism") ? this.getTranscendenceLevel() * 0.1 : 0;
		var blackObeliskBonus = this.getTranscendenceLevel() * this.getTU("blackObelisk").val * 0.005;
		rate = this.game.getHyperbolicEffect(rate, 1000) * (1 + atheismBonus + blackObeliskBonus);
		return rate;
	},

	getApocryphaBonus: function(){
		return this.getTriValueReligion(this.faithRatio);
	},

	getTriValueReligion: function(ratio){
		return this.game.getTriValue(ratio, 0.1)*0.1;
	},

	praise: function(){
		var faith = this.game.resPool.get("faith");
		this.faith += this.game.resPool.getTotal("faith") * (1 + this.getApocryphaBonus()); //starting up from 100% ratio will work surprisingly bad
		this.game.msg($I("religion.praise.msg", [this.game.getDisplayValueExt(this.game.resPool.getTotal("faith"), false, false, 0)]), "", "faith");
		faith.value = 0.0001;	//have a nice autoclicking
		faith.reserve = 0;

	},

	getApocryphaResetBonus: function(bonusRatio){
		//100% Bonus per Transcendence Level
		if (this.getRU("transcendence").on) {
			bonusRatio *= Math.pow((1 + this.getTranscendenceLevel()), 2);
		}
		return (this.faith/100000) * 0.1 * bonusRatio;
	},

	transcend: function(){
		var religion = this.game.religion;
		if (!religion.getRU("transcendence").on) {
			return; // :3
		}

		var game = this.game;
		game.ui.confirm($I("religion.transcend.confirmation.title"), $I("religion.transcend.confirmation.msg"), function() {
			var tclevel = religion.getTranscendenceLevel();
			//Transcend one Level at a time
			var needNextLevel = religion.getTranscendenceRatio(tclevel+1) - religion.getTranscendenceRatio(tclevel);
			if (religion.faithRatio > needNextLevel) {
				religion.faithRatio -= needNextLevel;
				religion.tcratio += needNextLevel;
				religion.tclevel += 1;
				game.msg($I("religion.transcend.msg.success", [religion.tclevel]));
			} else {
				var progressPercentage = game.toDisplayPercentage(religion.faithRatio / needNextLevel, 2, true);
				var leftNumber = (religion.faithRatio / needNextLevel) * (religion.tclevel + 1) - 1;
				if (leftNumber < 0) {
					leftNumber = 0;
				}
				var progressNumber = leftNumber.toFixed(0) + " / " + (religion.tclevel + 1);
				game.msg($I("religion.transcend.msg.failure", [progressNumber, progressPercentage]));
			}
		});
	},

	getTranscendenceLevel: function(){
		var bonus = this.getTriValueReligion(this.tcratio) * 100;
		bonus = Math.round(Math.log(bonus));
			if (bonus < 0) {
				bonus = 0;
			}
		return bonus;
	},

    getTranscendenceRatio: function(level){
            var bonus = Math.exp(level);
            return (Math.pow(bonus/5+1,2)-1)/80;
    },

	unlockAll: function(){
		for (var i in this.religionUpgrades){
			this.religionUpgrades[i].unlocked = true;
			this.religionUpgrades[i].researched = true;
		}

		for (var i in this.zigguratUpgrades){
			this.zigguratUpgrades[i].unlocked = true;
		}

		for (var i in this.transcendenceUpgrades){
			this.transcendenceUpgrades[i].unlocked = true;
		}

		this.faith = 1000000;
		this.tcratio = 100000000;

		this.game.msg("All religion upgrades are unlocked!");
	}

});

/**
 * A button for ziggurat upgrade
 */
dojo.declare("com.nuclearunicorn.game.ui.ZigguratBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getZU(model.options.id);
        }
        return model.metaCached;
    },

    getName: function(model){
		if (model.metadata.name == "marker" && model.metadata.val > 0){
			var progress = this.game.toDisplayPercentage(this.game.religion.corruption, 0, true);
			return model.metadata.label + " [" + progress + "%] (" + model.metadata.val + ")";
		} else {
			return this.inherited(arguments);
		}
	}
});


/**
 * A button for religion upgrade
 */
dojo.declare("com.nuclearunicorn.game.ui.ReligionBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getRU(model.options.id);
        }
        return model.metaCached;
    },

    hasSellLink: function(model){
		return !this.game.opts.hideSell && !model.metadata.noStackable && model.metadata.val > 1;
	},

	getPrices: function(model){
		return this.game.village.getEffectLeader("wise", this.inherited(arguments));
	},

	updateVisible: function(model){
		model.visible = model.metadata.on > 0 || this.game.religion.faith >= model.metadata.faith;
	}
});


dojo.declare("classes.ui.TranscendenceBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getTU(model.options.id);
        }
        return model.metaCached;
    }
});

dojo.declare("com.nuclearunicorn.game.ui.PraiseBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		if (this.game.religion.faithRatio > 0){
			return model.options.name + " [" + this.game.getDisplayValueExt(this.game.religion.getApocryphaBonus()*100, true, false, 3) + "%]";
		} else {
			return model.options.name;
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.TranscendBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {

	getName: function(model) {
		if (this.game.religion.tclevel > 0){
			return model.options.name + " [" + this.game.religion.tclevel + "]";
		} else {
			return model.options.name;
		}
	},

	updateVisible: function (model){
		model.visible = this.game.religion.getRU("transcendence").on;
	}
});

dojo.declare("classes.ui.religion.TransformBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.hasResourceHover = true;
		result.simplePrices = false;
		return result;
	},

	fetchModel: function(options) {
		var model = this.inherited(arguments);
		model.fifthLink = this._newLink(model, 5);
		model.halfLink = this._newLink(model, 2);
		model.allLink = this._newLink(model, 1);
		return model;
	},

	_newLink: function(model, divider) {
		var transformations = Math.floor(this._canAfford(model) / divider);
		var self = this;
		return {
			visible: this.game.opts.showNonApplicableButtons || transformations > 1,
			title: divider == 1
				? $I("religion.sacrificeBtn.all")
				: this.game.opts.usePercentageConsumptionValues
					? (100 / divider) + "%"
					: "x" + this.game.getDisplayValueExt(transformations, null, false, 0),
			tooltip:  divider == 1 || this.game.opts.usePercentageConsumptionValues ? "x" + this.game.getDisplayValueExt(transformations, null, false, 0) : (100 / divider) + "%",
			handler: function(event, callback) {
				self.transform(model, divider, event, callback);
			}
		};
	},

	buyItem: function(model, event, callback){
		if (model.enabled && this.hasResources(model)) {
			callback(this._transform(model, 1));
		}
		callback(false);
	},

	_canAfford: function(model) {
		return Math.floor(this.game.resPool.get(model.prices[0].name).value / model.prices[0].val);
	},

	transform: function(model, divider, event, callback) {
		var amt = Math.floor(this._canAfford(model) / divider);
		if (model.enabled && amt >= 1) {
			callback(this._transform(model, amt));
		}
		callback(false);
	},

	_transform: function(model, amt) {
		var priceCount = model.prices[0].val * amt;
		if (priceCount > this.game.resPool.get(model.prices[0].name).value) {
			return false;
		}

		var gainCount = this.controllerOpts.gainMultiplier.call(this) * amt;

		this.game.resPool.addResEvent(model.prices[0].name, -priceCount);
		this.game.resPool.addResEvent(this.controllerOpts.gainedResource, gainCount);

		if (this.controllerOpts.applyAtGain) {
			this.controllerOpts.applyAtGain.call(this, priceCount);
		}

		this.game.msg($I(this.controllerOpts.logTextID, [this.game.getDisplayValueExt(priceCount), this.game.getDisplayValueExt(gainCount)]));
		return true;
	}
});

dojo.declare("classes.ui.religion.MultiLinkBtn", com.nuclearunicorn.game.ui.ButtonModern, {
	renderLinks: function() {
		this.all = this.addLink(this.model.allLink);
		this.half = this.addLink(this.model.halfLink);
		this.fifth = this.addLink(this.model.fifthLink);
	},

	update: function() {
		this.inherited(arguments);
		this.updateLink(this.fifth, this.model.fifthLink);
		this.updateLink(this.half, this.model.halfLink);
		this.updateLink(this.all, this.model.allLink);
	}
});

dojo.declare("classes.ui.religion.RefineTearsBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);

		result.hasResourceHover = true;
		return result;
	},

	buyItem: function(model, event, callback){
		if (model.enabled && this.hasResources(model)) {
			if (this.game.resPool.get("sorrow").value >= this.game.resPool.get("sorrow").maxValue){
				this.game.msg($I("religion.refineTearsBtn.refine.msg.failure"));
				callback(false);
				return;
			}

			this.payPrice(model);
			this.refine();

			callback(true);
		}
		callback(false);
	},

	refine: function(){
		this.game.resPool.get("sorrow").value++; //resPool.update() force below maxValue
	}
});

dojo.declare("classes.ui.CryptotheologyWGT", [mixin.IChildrenAware, mixin.IGameAware], {
	constructor: function(game){
		var self = this;
		var controller = classes.ui.TranscendenceBtnController(game);
		dojo.forEach(game.religion.transcendenceUpgrades, function(tu, i){
			var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
				id: 		tu.name,
				name: 		tu.label,
				description: tu.description,
				controller: controller
			}, game);
			self.addChild(button);
		});
	},

	render: function(container){
		var div = dojo.create("div", null, container);
		var btnsContainer = dojo.create("div", null, div);
		this.inherited(arguments, [btnsContainer]);
	},

	update: function(){
		this.inherited(arguments);
	}
});

dojo.declare("classes.ui.CryptotheologyPanel", com.nuclearunicorn.game.ui.Panel, {
	visible: false,
});

dojo.declare("com.nuclearunicorn.game.ui.tab.ReligionTab", com.nuclearunicorn.game.ui.tab, {

	sacrificeBtn : null,
	sacrificeAlicornsBtn: null,
	faithResetBtn: null,

	zgUpgradeButtons: null,
	rUpgradeButtons: null,

	constructor: function(){
		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];

		var ctPanel = new classes.ui.CryptotheologyPanel($I("religion.panel.cryptotheology.label"));
		ctPanel.game = this.game;

		this.addChild(ctPanel);
		this.ctPanel = ctPanel;

		var wgt = new classes.ui.CryptotheologyWGT(this.game);
		wgt.setGame(this.game);
		ctPanel.addChild(wgt);
	},

	render: function(container) {
		var game = this.game;

		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];

		var zigguratCount = game.bld.get("ziggurat").on;
		if (zigguratCount > 0){
			var zigguratPanel = new com.nuclearunicorn.game.ui.Panel($I("religion.panel.ziggurat.label"), game.religion);
			var content = zigguratPanel.render(container);

			var sacrificeBtn = new classes.ui.religion.MultiLinkBtn({
				name: $I("religion.sacrificeBtn.label"),
				description: $I("religion.sacrificeBtn.desc"),
				prices: [{ name: "unicorns", val: 2500}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					gainMultiplier: function() {
						return this.game.bld.get("ziggurat").on * (this.game.challenges.getChallenge("atheism").on ? this.game.challenges.getChallengeEffect("atheism") : 1);
					},
					gainedResource: "tears",
					applyAtGain: function(priceCount) {
						this.game.stats.getStat("unicornsSacrificed").val += priceCount;
					},
					logTextID: "religion.sacrificeBtn.sacrifice.msg"
				})
			}, game);
			sacrificeBtn.render(content);
			this.sacrificeBtn = sacrificeBtn;

			var sacrificeAlicornsBtn = classes.ui.religion.MultiLinkBtn({
				name: $I("religion.sacrificeAlicornsBtn.label"),
				description: $I("religion.sacrificeAlicornsBtn.desc"),
				prices: [{ name: "alicorn", val: 25}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.hasResources(model) || (this.game.resPool.get("alicorn").value > 0 && this.game.resPool.get("timeCrystal").unlocked);
					},
					gainMultiplier: function() {
						return 1 + this.game.getEffect("tcRefineRatio");
					},
					gainedResource: "timeCrystal",
					applyAtGain: function() {
						this.game.upgrade({
							zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
						});
					},
					logTextID: "religion.sacrificeAlicornsBtn.sacrifice.msg"
				})
			}, game);
			sacrificeAlicornsBtn.render(content);
			this.sacrificeAlicornsBtn = sacrificeAlicornsBtn;

			var refineBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.refineTearsBtn.label"),
				description: $I("religion.refineTearsBtn.desc"),
				prices: [{ name: "tears", val: 10000}],
				controller: new classes.ui.religion.RefineTearsBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.game.religion.getZU("blackPyramid").unlocked;
					}
				})
			}, game);
			refineBtn.render(content);
			this.refineBtn = refineBtn;

			var refineTCBtn = new classes.ui.religion.MultiLinkBtn({
				name: $I("religion.refineTCsBtn.label"),
				description: $I("religion.refineTCsBtn.desc"),
				prices: [{ name: "timeCrystal", val: 25}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.hasResources(model);
					},
					gainMultiplier: function() {
						return 1 + this.game.getEffect("relicRefineRatio") * this.game.religion.getZU("blackPyramid").getEffectiveValue(this.game);
					},
					gainedResource: "relic",
					logTextID: "religion.refineTCsBtn.refine.msg"
				})
			}, game);
			refineTCBtn.render(content);
			this.refineTCBtn = refineTCBtn;

			//TODO: all the dark miracles there
			var zigguratController = new com.nuclearunicorn.game.ui.ZigguratBtnController(game);
			var upgrades = game.religion.zigguratUpgrades;
			for (var i = 0; i < upgrades.length; i++){
				var upgr = upgrades[i];

				var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
					id: 		upgr.name,
					name: upgr.label,
					description: upgr.description,
					prices: upgr.prices,
					controller: zigguratController,
					handler: upgr.handler
				}, game);

				button.render(content);
				this.zgUpgradeButtons.push(button);
			}
		}	//eo zg upgrades

		if (!game.challenges.getChallenge("atheism").on) {
			//------------------- religion -------------------
			var religionPanel = new com.nuclearunicorn.game.ui.Panel($I("religion.panel.orderOfTheSun.label"), game.religion);
			var content = religionPanel.render(container);

			var faithCount = dojo.create("span", { style: { display: "inline-block", marginBottom: "10px"}}, content);
			this.faithCount = faithCount;

			//----------------------- reset -----------------------
			var faithResetBtn = dojo.create("a", { style: { paddingLeft: "10px", marginBottom: "10px", display: "none"},
				href: "#",
				innerHTML: $I("religion.faithResetBtn.label")
			}, content);
			this.faithResetBtn = faithResetBtn;
			dojo.connect(this.faithResetBtn, "onclick", this, "resetFaith");

			var praiseBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.praiseBtn.label"),
				description: $I("religion.praiseBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.PraiseBtnController(game),
				handler: function(){
					this.game.religion.praise();	//sigh, enjoy your automation scripts
				}
			}, game);

			praiseBtn.render(content);
			this.praiseBtn = praiseBtn;
			var controller = new com.nuclearunicorn.game.ui.ReligionBtnController(game);
			var upgrades = game.religion.religionUpgrades;
			for (var i = 0; i < upgrades.length; i++){
				var upgr = upgrades[i];

				var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
					id: 		upgr.name,
					name: 		upgr.label,
					description: upgr.description,
					prices: upgr.prices,
					controller: controller,
					handler: function(btn){
						var upgrade = btn.model.metadata;
						if (upgrade.upgrades){
							game.upgrade(upgrade.upgrades);
						}
					}
				}, game);
				button.render(content);
				this.rUpgradeButtons.push(button);
			}

			var transcendBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.transcendBtn.label"),
				description: $I("religion.transcendBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.TranscendBtnController(game),
				handler: function(btn) {
					game.religion.transcend();
					var transcendenceLevel = game.religion.getTranscendenceLevel();
					for (var i = 0; i < game.religion.transcendenceUpgrades.length; i++) {
						if (transcendenceLevel >= game.religion.transcendenceUpgrades[i].tier) {
							game.religion.transcendenceUpgrades[i].unlocked = true;
						}
					}
				}
			}, game);

			transcendBtn.render(content);
			this.transcendBtn = transcendBtn;
		}

		this.inherited(arguments);
		this.update();
	},

	update: function(){
		this.inherited(arguments);

		var religion = this.game.religion;

		if (this.sacrificeBtn){
			this.sacrificeBtn.update();
		}

		if (this.sacrificeAlicornsBtn){
			this.sacrificeAlicornsBtn.update();
		}

		if (this.refineBtn){
			this.refineBtn.update();
		}

		if (this.refineTCBtn){
			this.refineTCBtn.update();
		}

		if (!this.game.challenges.getChallenge("atheism").on) {
			if (this.praiseBtn){
				this.praiseBtn.update();
			}

			if (this.transcendBtn){
				this.transcendBtn.update();
			}

			if (religion.faith && this.faithCount){
				this.faithCount.innerHTML = $I("religion.faithCount.pool", [this.game.getDisplayValueExt(religion.faith)]);
			} else {
				this.faithCount.innerHTML = "";
			}

			var bonus = religion.getProductionBonus();
			if (bonus != 0) {
				this.faithCount.innerHTML += ( " (+" + this.game.getDisplayValueExt(bonus) + "% " + $I("religion.faithCount.bonus") + ")" );
			}

			if (religion.getRU("apocripha").on){
				dojo.style(this.faithResetBtn, "display", "");
			}

			dojo.forEach(this.rUpgradeButtons,  function(e, i){ e.update(); });

			var hasCT = this.game.science.get("cryptotheology").researched && this.game.religion.tclevel > 0;
			if (hasCT){
				this.ctPanel.setVisible(true);
			}
		}

		dojo.forEach(this.zgUpgradeButtons, function(e, i){ e.update(); });

	},

	resetFaith: function(event){
		event.preventDefault();
		if (this.game.religion.getRU("apocripha").on) { // trust no one
			var self = this;
			this.game.ui.confirm("", $I("religion.resetFaith.confirmation.msg"), function() {
				self.resetFaithInternal(1.01);
			});
		}
	},

    resetFaithInternal: function(bonusRatio){
        this.game.religion.faithRatio += this.game.religion.getApocryphaResetBonus(bonusRatio);
		this.game.religion.faith = 0.01;
    }
});
