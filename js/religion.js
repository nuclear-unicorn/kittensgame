/**
 * Behold the bringer of light!
 */
dojo.declare("classes.managers.ReligionManager", com.nuclearunicorn.core.TabManager, {

	game: null,
	pactsManager: null,

	//your TT level!
	transcendenceTier: 0,

	//an amount of faith temporarily moved to a praised pool (aka worship)
	faith: 0,

	//an amount of converted faith obtained through the faith reset (aka eupyphany)
	faithRatio : 0,

	corruption: 0,

	alicornCounter: 0,

	//the amount of currently active HG buildings (typically refils during reset)
	activeHolyGenocide: 0,

	constructor: function(game){
		this.game = game;
		this.registerMeta(/*"stackable"*/false, this.zigguratUpgrades, {
			getEffect : function(bld, effect){
				if(bld.name == "blackPyramid") {
					return (bld.effects) ? bld.effects[effect] * bld.getEffectiveValue(game) : 0;
				}
				return (bld.effects) ? bld.effects[effect] * bld.on : 0;
			}
		});
		this.registerMeta("stackable", this.religionUpgrades, null);
		this.registerMeta(/*"stackable"*/false, this.transcendenceUpgrades, {
			getEffect: function(bld, effectName){
				var effectValue = bld.effects[effectName] || 0;
				if (bld.name == "holyGenocide"){
					return effectValue * game.religion.activeHolyGenocide;
				}
				return effectValue * bld.on;
			}
		});
		this.pactsManager = new classes.religion.pactsManager(game);
		this.registerMeta("stackable", this.pactsManager.pacts, null);
		this.setEffectsCachedExisting();
	},

	resetState: function(){
		this.faith = 0;
		this.corruption = 0;
		this.transcendenceTier = 0;
		this.faithRatio = 0;

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
		this.pactsManager.resetState();
	},

	save: function(saveData){
		saveData.religion = {
			faith: this.faith,
			corruption: this.corruption,
			faithRatio: this.faithRatio,
			transcendenceTier: this.transcendenceTier,
			activeHolyGenocide: this.activeHolyGenocide,
			necrocornDeficit: this.pactsManager.necrocornDeficit,

			// Duplicated save, for older versions like mobile
			tcratio: this._getTranscendTotalPrice(this.transcendenceTier),
			zu: this.filterMetadata(this.zigguratUpgrades, ["name", "val", "on", "unlocked"]),
			ru: this.filterMetadata(this.religionUpgrades, ["name", "val", "on"]),
			tu: this.filterMetadata(this.transcendenceUpgrades, ["name", "val", "on", "unlocked"]),
			pact: this.filterMetadata(this.pactsManager.pacts, ["name", "val", "on", "unlocked"])

		};
	},

	load: function(saveData){
		if (!saveData.religion){
			return;
		}

		var _data = saveData.religion;

		this.faith = _data.faith || 0;
		this.corruption = _data.corruption || 0;
		this.faithRatio = _data.faithRatio || 0;
		this.transcendenceTier = _data.transcendenceTier || 0;
		this.activeHolyGenocide = _data.activeHolyGenocide || 0;
		this.pactsManager.necrocornDeficit = saveData.religion.necrocornDeficit || 0;

		// Read old save
		if (this.transcendenceTier == 0 && _data.tcratio > 0) {
			this.transcendenceTier = Math.max(0, Math.round(Math.log(10 * this.game.getUnlimitedDR(_data.tcratio, 0.1))));
		}

		this.loadMetadata(this.zigguratUpgrades, _data.zu);
		this.loadMetadata(this.religionUpgrades, _data.ru);
		this.loadMetadata(this.transcendenceUpgrades, _data.tu);
		this.loadMetadata(this.pactsManager.pacts, _data.pact);

		for (var i = 0; i < this.transcendenceUpgrades.length; i++){
			var tu = this.transcendenceUpgrades[i];
			if (this.transcendenceTier >= tu.tier) {
				tu.unlocked = true;
			}
			if(tu.val > 0 && tu.unlocks){
				this.game.unlock(tu.unlocks);
			}
		}
		//necrocorn deficit affecting 
		var pacts = this.pactsManager.pacts;
		for(var i = 0; i < pacts.length; i++){
			pacts[i].calculateEffects(pacts[i], this.game);
		}
		this.getZU("blackPyramid").updateEffects(this.getZU("blackPyramid"), this.game);
		console.log("pactsAdjustment");
		if(!this.getPact("fractured").researched && this.getZU("blackPyramid").val > 0 && (this.game.religion.getTU("mausoleum").val > 0 || this.game.science.getPolicy("radicalXenophobia").researched)){
			this.game.unlock({
				pacts: ["pactOfCleansing", "pactOfDestruction",  "pactOfExtermination", "pactOfPurity"]
			});
		}
	},

	update: function(){
		if (this.game.resPool.get("faith").value > 0 || this.game.challenges.isActive("atheism") && this.game.bld.get("ziggurat").val > 0){
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
				this.game.msg($I("religion.msg.corruption"), "important", "alicornCorruption");
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

	// Converts the equivalent of 10 % (improved by Void Resonators) of produced faith, but with only a quarter of apocrypha bonus
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
			"riftChance" : 0.0005
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
			"ivoryMeteorChance" : 0.0005
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
				"alicornChance" : 0.0001,
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
				"alicornChance" : 0.00015,
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
				"alicornChance" : 0.0003,
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
			self.effects["corruptionRatio"] = 0.000001 * (1 + game.getLimitedDR(game.getEffect("corruptionBoostRatioChallenge"), 2));
		},
		unlocked: false,
		getEffectiveValue: function(game) {
			return this.val * (1 + game.getLimitedDR(game.getEffect("corruptionBoostRatioChallenge"), 2));
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
		effectsPreDeficit: {},
		jammed: false,
		effects: {
			"pyramidGlobalResourceRatio" : 0,
			"pyramidGlobalProductionRatio" : 0,
			"pyramidFaithRatio" : 0,
			"deficitRecoveryRatio": 0,
			"blackLibraryBonus": 0
		},
		simpleEffectNames:[
			"GlobalResourceRatio",
			"RecoveryRatio",
			"GlobalProductionRatio",
			"FaithRatio"
		],
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		calculateEffects: function(self, game) {
			self.togglable = false;
			if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
				for (var eff in self.effects){
					self.effects[eff] = 0;
				}
				return;
			}
			var pacts = game.religion.pactsManager.pacts;
			for(var i = 0; i < pacts.length; i++){
				if(pacts[i].updatePreDeficitEffects){
					pacts[i].updatePreDeficitEffects(game);
				}
			}
		},
		cashPreDeficitEffects: function (game) {
			var transcendenceTierModifier = Math.max(game.religion.transcendenceTier - 25, 1);
			var self = game.religion.getZU("blackPyramid");
			for(var counter in self.simpleEffectNames){
				self.effectsPreDeficit["pyramid" + self.simpleEffectNames[counter]] = game.getEffect("pact" + self.simpleEffectNames[counter]) * transcendenceTierModifier;
			}
			self.effectsPreDeficit["deficitRecoveryRatio"] = game.getEffect("pactDeficitRecoveryRatio");
			var pactBlackLibraryBoost = game.getEffect("pactBlackLibraryBoost") * transcendenceTierModifier;
			if(pactBlackLibraryBoost) {
				var unicornGraveyard = game.religion.getZU("unicornGraveyard");
				self.effectsPreDeficit["blackLibraryBonus"] = pactBlackLibraryBoost * unicornGraveyard.effects["blackLibraryBonus"] * (1 + unicornGraveyard.on);
			}
		},
		updateEffects: function(self, game){
			if(!self.jammed){
				self.cashPreDeficitEffects(game);
				self.jammed = true;
			}
			self.effects["deficitRecoveryRatio"] = self.effectsPreDeficit["deficitRecoveryRatio"];
			//applying deficit
			var deficiteModifier = (1 - game.religion.pactsManager.necrocornDeficit/50);
			var existsDifference = false;
			//console.warn(deficiteModifier);
			for(var name in self.effectsPreDeficit){
				if(name != "deficitRecoveryRatio"){
					var old = self.effects[name];
					self.effects[name] = self.effectsPreDeficit[name] * deficiteModifier;
					if(self.effects[name] != old){
						existsDifference = true;
					}
				}
			}
			if(existsDifference) {
				game.upgrade(self.upgrades);
			}
		},
		unlocked: false,
		flavor: $I("religion.zu.blackPyramid.flavor"),
		getEffectiveValue: function(game) {
			return this.val + (game.challenges.getChallenge("blackSky").researched && !game.challenges.isActive("blackSky") ? 1 : 0);
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
			"solarRevolutionRatio": 0
		},
		calculateEffects: function(self, game) {
			self.effects["solarRevolutionRatio"] = game.religion.getSolarRevolutionRatio();
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
		effects: {
			"solarRevolutionLimit": 0.05
		},
		calculateEffects: function(self, game) {
			self.effects["solarRevolutionLimit"] = 0.05 * game.religion.transcendenceTier;
		},
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
		flavor: $I("religion.tu.blackLibrary.flavor")
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
	},
		//pacts can go to the TT23
	{
		name: "mausoleum",
		label: $I("religion.tu.mausoleum.label"),
		description: $I("religion.tu.mausoleum.desc"),
		tier: 23,
		priceRatio: 1.15,
		prices: [
			{ name : "relic", val: 50000 },
			{ name : "void", val: 12500 },
			{ name: "necrocorn", val: 10}
		],
		effects: {
			"pactsAvailable": 1
		},
		upgrades: {
			pacts: ["fractured"]
		},
		unlocked: false,
		unlocks: {
			pacts: ["pactOfCleansing", "pactOfDestruction",  "pactOfExtermination", "pactOfPurity"]
		},
		calculateEffects: function (self, game){
			if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
				self.effects["pactsAvailable"] = 0;
				self.unlocked = false;
				game.updateCaches();
				return;
			}
			self.effects = {
				"pactsAvailable": 1 + game.getEffect("mausoleumBonus")
			};
			if(game.religion.getPact("fractured").on >= 1){
				self.effects["pactsAvailable"] = 0;
			}
			game.updateCaches();
		},
		evaluateLocks: function(game){
			return game.getFeatureFlag("MAUSOLEUM_PACTS");
		}
		//flavor: $I("religion.tu.mausoleum.flavor")
	},
	{
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
			"maxKittensRatio": 0.01,
			"simScalingRatio": 0.02,
			"activeHG": 0
		},
		unlocked: false,
		unlocks: {
			challenges: ["postApocalypse"]
		},
		calculateEffects: function(self, game){
			self.effects["activeHG"] = game.religion.activeHolyGenocide;
		},
		togglable: true,
		flavor: $I("religion.tu.holyGenocide.flavor")
	},
		//Holy Memecide
	],
	necrocornDeficitPunishment: function(){
		for(var kitten in this.game.village.sim.kittens){
			var skills = this.game.village.sim.kittens[kitten].skills;
			for(var job in skills){
				skills[job] = 0;
			}
		}
		this.game.religion.getPact("fractured").on = 1;
		this.game.religion.getPact("fractured").val = 1;
		this.game.upgrade(
			{
				transcendenceUpgrades:["mausoleum"],
				policies:["radicalXenophobia"],
				pacts:["fractured"]
			}
		);
		//this.game.religion.getPact("fractured").calculateEffects(this.game.religion.getPact("fractured"), this.game);
		this.game.religion.necrocornDeficit = 0;
		this.game.msg($I("msg.pacts.fractured", [Math.round(100 * this.game.resPool.get("alicorn").value)/100]),"alert", "ai");
		this.game.resPool.get("alicorn").value = 0;
		var blackPyramid = this.game.religion.getZU("blackPyramid");
		for (var i in blackPyramid.effectsPreDeficit){
			blackPyramid.effectsPreDeficit[i] = 0;
		}
		this.game.religion.getZU("blackPyramid").updateEffects(this.game.religion.getZU("blackPyramid"), this.game);
	},


	effectsBase: {
		"kittensKarmaPerMinneliaRatio" : 0.0001, //unspent pacts can make karma
		"pactNecrocornConsumption" : -0.0005
	},

	getZU: function(name){
		return this.getMeta(name, this.zigguratUpgrades);
	},

	getRU: function(name){
		return this.getMeta(name, this.religionUpgrades);
	},

	getTU: function(name){
		return this.getMeta(name, this.transcendenceUpgrades);
	},
	getPact: function(name){
		return this.getMeta(name, this.pactsManager.pacts);
	},
	getSolarRevolutionRatio: function() {
		var uncappedBonus = this.getRU("solarRevolution").on ? this.game.getUnlimitedDR(this.faith, 1000) / 100 : 0;
		return this.game.getLimitedDR(uncappedBonus, 10 + this.game.getEffect("solarRevolutionLimit") + (this.game.challenges.getChallenge("atheism").researched ? (this.game.religion.transcendenceTier) : 0)) * (1 + this.game.getLimitedDR(this.game.getEffect("faithSolarRevolutionBoost"), 4));
	},

	getApocryphaBonus: function(){
		return this.game.getUnlimitedDR(this.faithRatio, 0.1) * 0.1;
	},

	getHGScalingBonus: function(){
		//TODO: test this
		var scalingRatio = this.game.getLimitedDR(this.game.getEffect("simScalingRatio"), 1);
		if (!scalingRatio /*|| !this.game.village.maxKittensRatioApplied*/){
			return 1;
		}

		return (1 /
			(
				(1 - this.game.getLimitedDR(this.game.getEffect("maxKittensRatio"), 1))
			)
		) *(1 + scalingRatio);
	},

	praise: function(){
		var faith = this.game.resPool.get("faith");
		this.faith += faith.value * (1 + this.getApocryphaBonus()); //starting up from 100% ratio will work surprisingly bad
		this.game.msg($I("religion.praise.msg", [this.game.getDisplayValueExt(faith.value, false, false, 0)]), "", "faith");
		faith.value = 0.0001;	//have a nice autoclicking

	},

	getApocryphaResetBonus: function(bonusRatio){
		//100% Bonus per Transcendence Level
		if (this.getRU("transcendence").on) {
			bonusRatio *= Math.pow((1 + this.transcendenceTier), 2);
		}
		return (this.faith / 100000) * 0.1 * bonusRatio;
	},


	resetFaith: function(bonusRatio, withConfirmation) {
		if (withConfirmation && !this.game.opts.noConfirm) {
			var self = this;
			this.game.ui.confirm("", $I("religion.adore.confirmation.msg"), function() {
				self._resetFaithInternal(bonusRatio);
			});
		} else {
			this._resetFaithInternal(bonusRatio);
		}
	},

	_resetFaithInternal: function(bonusRatio) {
		var ttPlus1 = (this.game.religion.getRU("transcendence").on ? this.game.religion.transcendenceTier : 0) + 1;
		this.faithRatio += this.faith / 1000000 * ttPlus1 * ttPlus1 * bonusRatio;
		this.faith = 0.01;
	},

	transcend: function(){
		var religion = this.game.religion;
		if (!religion.getRU("transcendence").on) {
			return; // :3
		}

		var game = this.game;
		game.ui.confirm($I("religion.transcend.confirmation.title"), $I("religion.transcend.confirmation.msg"), function() {
			//Transcend one Level at a time
			var needNextLevel = 
				religion._getTranscendTotalPrice(religion.transcendenceTier + 1) - 
				religion._getTranscendTotalPrice(religion.transcendenceTier);

			if (religion.faithRatio > needNextLevel) {
				religion.faithRatio -= needNextLevel;
				religion.tcratio += needNextLevel;
				religion.transcendenceTier += 1;

				var atheism = game.challenges.getChallenge("atheism");
				atheism.calculateEffects(atheism, game);
				var blackObelisk = religion.getTU("blackObelisk");
				blackObelisk.calculateEffects(blackObelisk, game);

				game.msg($I("religion.transcend.msg.success", [religion.transcendenceTier]));
			} else {
				game.msg($I("religion.transcend.msg.failure", [
					game.toDisplayPercentage(religion.faithRatio / needNextLevel, 2, true)
				]));
			}
		});
	},

	_getTranscendTotalPrice: function(tier) {
		return this.game.getInverseUnlimitedDR(Math.exp(tier) / 10, 0.1);
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

		for (var i in this.pacts){
			this.pacts[i].unlocked = true;
		}

		this.faith = 1000000;
		this.transcendenceTier = 25;

		this.game.msg("All religion upgrades are unlocked!");
	},

	undo: function(data){
		var resPool = this.game.resPool;
		if (data.action == "refine"){
			/*
			  undo.addEvent("religion", {
				action:"refine",
				resFrom: model.prices[0].name,
				resTo: this.controllerOpts.gainedResource,
				valFrom: priceCount,
				valTo: gainCount
			*/
			var resConverted = resPool.get(data.resTo);
			/*
				if you still have refined resources, roll them back
				of course the correct way would be to call addResEvent(data.resTo, -data.valTo), 
				find out actual remaining value
				and refund it proportionally, but I am to lazy to code it in 
			*/
			if (resConverted.value > data.valTo) {
				this.game.resPool.addResEvent(data.resFrom, data.valFrom);
				this.game.resPool.addResEvent(data.resTo, -data.valTo);
			}
		}
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
			return model.options.name + " [" + this.game.getDisplayValueExt(this.game.religion.getApocryphaBonus() * 100, true, false, 3) + "%]";
		} else {
			return model.options.name;
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.ResetFaithBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		var ttPlus1 = this.game.religion.transcendenceTier + 1;
		return model.options.name + (this.game.religion.getRU("transcendence").on ? " [×" + (ttPlus1 * ttPlus1) + "]" : "");
	},

	updateVisible: function (model) {
		model.visible = this.game.religion.getRU("apocripha").on;
	}
});

dojo.declare("com.nuclearunicorn.game.ui.TranscendBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		return model.options.name + (this.game.religion.transcendenceTier > 0 ? " [" + this.game.religion.transcendenceTier + "]" : "");
	},

	updateVisible: function (model) {
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

	buyItem: function(model, event, callback) {
		if (model.enabled && this.hasResources(model)) {
			var batchSize = event.ctrlKey ? this.game.opts.batchSize : 1;
			callback(this._transform(model, batchSize));
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

		var undo = this.game.registerUndoChange();
        undo.addEvent("religion", {
			action:"refine",
			resFrom: model.prices[0].name,
			resTo: this.controllerOpts.gainedResource,
			valFrom: priceCount,
			valTo: gainCount
		});

		this.game.msg($I(this.controllerOpts.logTextID, [this.game.getDisplayValueExt(priceCount), this.game.getDisplayValueExt(gainCount)]), this.controllerOpts.logfilterID);

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

	fetchModel: function (options) {
		var model = this.inherited(arguments);
		model.fiveLink = this._newLink(model, 5);
		model.twentyFiveLink = this._newLink(model, 25);
		model.hundredLink = this._newLink(model, 100);
		return model;
	},

	_newLink: function (model, count) {
		var self = this;
		return {
			visible: this.game.opts.showNonApplicableButtons
				|| this.game.resPool.get("sorrow").value <= this.game.resPool.get("sorrow").maxValue - count
				&& self._canAfford(model, count) >= count,
			title: "x" + count,
			handler: function (event) {
				self.buyItem(model, {}, this.update.bind(this), count);
			}
		};
	},

	_canAfford: function(model, count) {
		return Math.floor(this.game.resPool.get(model.prices[0].name).value / model.prices[0].val);
	},

	buyItem: function(model, event, callback, count){
		if (model.enabled && this.hasResources(model)) {
			if (this.game.resPool.get("sorrow").value >= this.game.resPool.get("sorrow").maxValue){
				this.game.msg($I("religion.refineTearsBtn.refine.msg.failure"));
				callback(false);
				return;
			}

			for (var batchSize = count || (event.ctrlKey ? this.game.opts.batchSize : 1);
				 batchSize > 0
				 && this.hasResources(model)
				 && this.game.resPool.get("sorrow").value < this.game.resPool.get("sorrow").maxValue;
				 batchSize--) {
				this.payPrice(model);
				this.refine();
			}

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

dojo.declare("classes.ui.PactsWGT", [mixin.IChildrenAware, mixin.IGameAware], {
	constructor: function(game){
		var self = this;
		var controller = com.nuclearunicorn.game.ui.PactsBtnController(game);
		dojo.forEach(game.religion.pactsManager.pacts, function(tu, i){
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
		var span1 = dojo.create("span", {innerHTML: this.game.religion.pactsManager.getPactsTextSum()}, div);
		var btnsContainer = dojo.create("div", null, div);
		var span2 = dojo.create("span", {innerHTML: this.game.religion.pactsManager.getPactsTextDeficit()}, div);
		this.inherited(arguments, [btnsContainer]);
	},

	update: function(){
		this.inherited(arguments);
	}
});
dojo.declare("classes.ui.PactsPanel", com.nuclearunicorn.game.ui.Panel, {
	visible: false
});

/**
 * A button controller for pacts upgrade
 */
 dojo.declare("com.nuclearunicorn.game.ui.PactsBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		return result;
	},
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getPact(model.options.id);
		}
        return model.metaCached;
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if(this.game.getEffect("pactsAvailable")<=0 && model.metadata.effects["pactsAvailable"] != 0){
			model.enabled = false;
		}
	},
	shouldBeBough: function(model, game){
		return game.getEffect("pactsAvailable") + model.metadata.effects["pactsAvailable"]>=0;
	},
	buyItem: function(model, event, callback) {
		this.game.updateCaches();
		this.updateEnabled(model);
		if ((this.hasResources(model)) || this.game.devMode){
			if(!this.shouldBeBough(model, this.game)){
				callback(false);
				return;
			}
			this._buyItem_step2(model, event, callback);
		}else{
			callback(false);
		}
	},

	build: function(model, maxBld){
		var meta = model.metadata;
		var counter = 0;
		if (typeof meta.limitBuild == "number" && meta.limitBuild - meta.val < maxBld){
			maxBld = meta.limitBuild - meta.val;
		}
		if(meta.effects["pactsAvailable"] != 0){
			maxBld = Math.min(maxBld, this.game.getEffect("pactsAvailable")/(-meta.effects["pactsAvailable"]));
		}
        if (model.enabled && this.hasResources(model) || this.game.devMode ){
	        while (this.hasResources(model) && maxBld > 0){
				this.incrementValue(model);
				this.payPrice(model);
	            counter++;
	            maxBld--;
	        }

			if(!meta.notAddDeficit){
				this.game.religion.pactsManager.necrocornDeficit += 0.5 * counter;
			}
	        if (counter > 1) {
		        this.game.msg(meta.label + " x" + counter + " constructed.", "notice");
			}

			if (meta.breakIronWill) {
				this.game.ironWill = false;
			}

			if (meta.unlocks) {
				this.game.unlock(meta.unlocks);
			}

			if (meta.unlockScheme && meta.val >= meta.unlockScheme.threshold) {
				this.game.ui.unlockScheme(meta.unlockScheme.name);
			}

			if (meta.upgrades) {
				if (meta.updateEffects) {
					meta.updateEffects(meta, this.game);
				}
				this.game.upgrade(meta.upgrades);
			}
			if(meta.updatePreDeficitEffects){
				meta.updatePreDeficitEffects(this.game);
			}
			if(!meta.special){
				this.game.upgrade(
					{pacts: ["payDebt"]}
					);
			}
			if(meta.name != "payDebt"){
				this.game.religion.getZU("blackPyramid").jammed = false;
			}
        }

		return counter;
    },

});

dojo.declare("classes.ui.religion.RefineBtn", com.nuclearunicorn.game.ui.ButtonModern, {
	renderLinks: function () {
		this.hundred = this.addLink(this.model.hundredLink);
		this.twentyFive = this.addLink(this.model.twentyFiveLink);
		this.five = this.addLink(this.model.fiveLink);
	},

	update: function () {
		this.inherited(arguments);

		dojo.style(this.five.link, "display", this.model.fiveLink.visible ? "" : "none");
		dojo.style(this.twentyFive.link, "display", this.model.twentyFiveLink.visible ? "" : "none");
		dojo.style(this.hundred.link, "display", this.model.hundredLink.visible ? "" : "none");
	}
});

dojo.declare("classes.religion.pactsManager", null, {
	game: null,
	necrocornDeficit: 0,
	fractureNecrocornDeficit: 50,
	pacts: [
		{
			name: "pactOfCleansing",
			label: $I("religion.pact.pactOfCleansing.label"),
			description: $I("religion.pact.pactOfCleansing.desc"),
			prices: [				
				{ name : "relic", val: 100},
			],
			unlocks: {
				//"pacts": ["pactOfFanaticism"]
			},
			priceRatio: 1,
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay" : 0,
				"pactDeficitRecoveryRatio": 0.003,
				"pactGlobalResourceRatio" : 0.0005,
				//"cathPollutionPerTickCon" : -5
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfDestruction",
			label: $I("religion.pact.pactOfDestruction.label"),
			description: $I("religion.pact.pactOfDestruction.desc"),
			prices: [				
				{ name : "relic", val: 100},
			],
			priceRatio: 1,
			unlocks: {
				//"pacts": ["pactOfGlowing"] will deal with this later
			},
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay": 0,
				"pactDeficitRecoveryRatio": -0.0001,
				"pactGlobalProductionRatio": 0.0005,
				//"cathPollutionPerTickProd" : 10
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfExtermination",
			label: $I("religion.pact.pactOfExtermination.label"),
			description: $I("religion.pact.pactOfExtermination.desc"),
			prices: [
				{ name : "relic", val: 100},
			],
			priceRatio: 1.02,
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay" : 0,
				"pactFaithRatio": 0.001
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfPurity",
			label: $I("religion.pact.pactOfPurity.label"),
			description: $I("religion.pact.pactOfPurity.desc"),
			prices: [
				{ name : "relic", val: 100},
			],
			//unlocks: {
				//"pacts": ["pactOfFlame", "pactOfFanaticism"]
			//},
			priceRatio: 1,
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay": 0,
				"pactDeficitRecoveryRatio": 0.005,
				"pactBlackLibraryBoost": 0.0005,
				//"cathPollutionPerTickCon" : -7
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
				game.religion.getZU("blackPyramid").jammed = false;
			}
		},{
			name: "payDebt",
			label: $I("religion.pact.payDebt.label"),
			description: $I("religion.pact.payDebt.desc"),
			prices: [
				{ name : "necrocorn", val: 0},
			],
			upgrades: {
				pacts: ["payDebt"]
			},
			priceRatio: 1,
			effects: {
				"pactsAvailable": 0,
			},
			special: true,
			unlocked: false,
			calculateEffects: function(self, game){
				self.onNewDay(game);
				if(self.val > 0){
					self.on = 0;
					self.val = 0;
					game.religion.pactsManager.necrocornDeficit = 0;
					self.unlocked = false;
				}
			},
			onNewDay: function(game){
				var self = game.religion.getPact("payDebt");
				self.prices[0].val = Math.ceil(game.religion.pactsManager.necrocornDeficit);
				self.unlocked = this.evaluateLocks(game);
			},
			limitBuild: 1,
			notAddDeficit: true,
			evaluateLocks: function(game){
				return game.religion.pactsManager.necrocornDeficit > 0 && game.getFeatureFlag("MAUSOLEUM_PACTS");
			},
		},{
			name: "fractured",
			label: $I("religion.pact.fractured.label"),
			description: $I("religion.pact.fractured.desc"),
			prices: [
				{ name : "catnip", val: 1 }
			],
			effects: {
				"pyramidGlobalResourceRatio" : -0.5,
				"pyramidGlobalProductionRatio" : -0.5,
				"pyramidFaithRatio" : -0.5,
				"pactsAvailable": 0,
			},
			limitBuild: 1,
			special: true,
			unlocked: false,
			calculateEffects: function(self, game){
				if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					self.effects = {
						"pyramidGlobalResourceRatio" : 0,
						"pyramidGlobalProductionRatio" : 0,
						"pyramidFaithRatio" : 0,
						"pactsAvailable": 0,
					};
					return;
				}
				if(self.on>=1){
					for(var i = 0; i<game.religion.pactsManager.pacts.length; i++){
						game.religion.pactsManager.pacts[i].on = 0;
						game.religion.pactsManager.pacts[i].val = 0;
						game.religion.pactsManager.pacts[i].unlocked = game.religion.pactsManager.pacts[i].name =="fractured";
					}
					self.val = 1;
					self.on = 1;
				}
			}
		}
	],
	necrocornDeficitPunishment: function(){
		for(var kitten in this.game.village.sim.kittens){
			var skills = this.game.village.sim.kittens[kitten].skills;
			for(var job in skills){
				skills[job] = 0;
			}
		}
		this.game.religion.getPact("fractured").on = 1;
		this.game.religion.getPact("fractured").val = 1;
		this.game.upgrade(
			{
				transcendenceUpgrades:["mausoleum"],
				policies:["radicalXenophobia"],
				pacts:["fractured"]
			}
		);
		//this.game.religion.getPact("fractured").calculateEffects(this.game.religion.getPact("fractured"), this.game);
		this.game.religion.pactsManager.necrocornDeficit = 0;
		this.game.msg($I("msg.pacts.fractured", [Math.round(100 * this.game.resPool.get("alicorn").value)/100]),"alert", "ai");
		this.game.resPool.get("alicorn").value = 0;
		var blackPyramid = this.game.religion.getZU("blackPyramid");
		for (var i in blackPyramid.effectsPreDeficit){
			blackPyramid.effectsPreDeficit[i] = 0;
		}
		this.game.religion.getZU("blackPyramid").updateEffects(this.game.religion.getZU("blackPyramid"), this.game);
	},
	constructor: function(game){
		this.game = game;
	},
	resetState: function(){
		//console.warn(this)
		//console.warn(this.game.religion.pactsManager)
		console.warn(this.game.religion.pactsManager.pacts);
		for(var i in this.game.religion.pactsManager.pacts){
			this.game.religion.pactsManager.pacts[i].on = 0;
			this.game.religion.pactsManager.pacts[i].val = 0;
			this.game.religion.pactsManager.pacts[i].unlocked = false;
		}
	},
	getPactsTextSum: function(){
		return $I("msg.pacts.info", [this.game.getEffect("pactsAvailable"), -this.game.getEffect("pactNecrocornConsumption")]); //Every TT above 25 adds 100% to pact effects (not consumption) and 10% to karma per millenia effect
	},
	getPactsTextDeficit: function(){
		if(this.game.religion.pactsManager.necrocornDeficit > 0){
			return $I("msg.necrocornDeficit.info", [Math.round(this.game.religion.pactsManager.necrocornDeficit * 10000)/10000, 
				-Math.round(100*
				((this.game.religion.pactsManager.necrocornDeficit/50))),
				Math.round(10000*
					(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio")/2)))/100,
					-Math.round((this.game.getEffect("necrocornPerDay") *(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio"))))*1000000)/1000000
				]);
			}else{
				return "";
			}
	},
	necrocornConsumptionDays: function(days){
		//------------------------- necrocorns pacts -------------------------
		//deficit changing
		var necrocornDeficitRepaymentModifier = 1;
		var necrocornPerDay = this.game.getEffect("necrocornPerDay");
		if(this.necrocornDeficit > 0){
			necrocornDeficitRepaymentModifier = 1 + 0.15 * (1 + this.game.getEffect("deficitRecoveryRatio")/2);
		}
		if((this.game.resPool.get("necrocorn").value + necrocornPerDay * days * necrocornDeficitRepaymentModifier) < 0){
			this.necrocornDeficit += Math.max(-necrocornPerDay * days - this.game.resPool.get("necrocorn").value, 0);
			necrocornDeficitRepaymentModifier = 1;
		}else if(this.necrocornDeficit > 0){
			this.necrocornDeficit += necrocornPerDay *(0.15 * (1 + this.game.getEffect("deficitRecoveryRatio")) * days);
			this.necrocornDeficit = Math.max(this.necrocornDeficit, 0);
		}
		this.game.resPool.addResPerTick("necrocorn", necrocornPerDay * necrocornDeficitRepaymentModifier);
	},
	pactsMilleniumKarmaKittens: function(millenium){
		//pacts karma effect
		/*
		unspent pacts generate karma each 1000 years based on kitten numbers
		pactsAvailable are created by mausoleum cryptotheology and radicalXenophobia
		this function adds appropriate karmaKittens and returns change in karma; temporary logs karma generation
		TODO: maybe make HG bonus play into this
		*/
		var kittens = this.game.resPool.get("kittens").value;
		if (kittens > 35 && this.game.getEffect("pactsAvailable") > 0){
			var oldKarmaKittens = this.game.karmaKittens;
			var kittensKarmaPerMinneliaRatio = this.game.getEffect("kittensKarmaPerMinneliaRatio");
			this.game.karmaKittens += millenium * this.game._getKarmaKittens(kittens) *
				this.game.getUnlimitedDR(
					kittensKarmaPerMinneliaRatio * 
					Math.max(1 + 0.1 * this.game.religion.transcendenceTier - 25, 1)*
					(this.game.getEffect("pactsAvailable"))
				, 100);
			var karmaOld = this.game.resPool.get("karma").value;
			this.game.updateKarma();
			console.log("produced " + String(this.game.resPool.get("karma").value - karmaOld) + " karma");
			console.log("produced " + String(this.game.karmaKittens - oldKarmaKittens) + " karmaKittens"); //for testing purposes - comment over before merging into ML
			return this.game.resPool.get("karma").value - karmaOld;
		}
		return 0;
	},
});
dojo.declare("com.nuclearunicorn.game.ui.tab.ReligionTab", com.nuclearunicorn.game.ui.tab, {

	sacrificeBtn : null,
	sacrificeAlicornsBtn: null,

	zgUpgradeButtons: null,
	rUpgradeButtons: null,
	pactUpgradeButtons: null,

	constructor: function(){
		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];
		this.pactUpgradeButtons = [];

		var ctPanel = new classes.ui.CryptotheologyPanel($I("religion.panel.cryptotheology.label"));
		ctPanel.game = this.game;

		this.addChild(ctPanel);
		this.ctPanel = ctPanel;

		var wgt = new classes.ui.CryptotheologyWGT(this.game);
		wgt.setGame(this.game);
		ctPanel.addChild(wgt);

		var ptPanel = new classes.ui.PactsPanel("Pacts");
		ptPanel.game = this.game;
		this.addChild(ptPanel);
		this.ptPanel = ptPanel;
		var wgtP = new classes.ui.PactsWGT(this.game);
		wgtP.setGame(this.game);
		ptPanel.addChild(wgtP);
	},

	render: function(container) {
		var game = this.game;

		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];
		this.pactUpgradeButtons = [];

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
						return this.game.bld.get("ziggurat").on;
					},
					gainedResource: "tears",
					applyAtGain: function(priceCount) {
						this.game.stats.getStat("unicornsSacrificed").val += priceCount;
					},
					logTextID: "religion.sacrificeBtn.sacrifice.msg",
					logfilterID: "unicornSacrifice"
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
					logTextID: "religion.sacrificeAlicornsBtn.sacrifice.msg",
					logfilterID: "alicornSacrifice"
				})
			}, game);
			sacrificeAlicornsBtn.render(content);
			this.sacrificeAlicornsBtn = sacrificeAlicornsBtn;

			var refineBtn = new classes.ui.religion.RefineBtn({
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
					logTextID: "religion.refineTCsBtn.refine.msg",
					logfilterID: "tcRefine"
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

		if (!game.challenges.isActive("atheism")) {
			//------------------- religion -------------------
			var religionPanel = new com.nuclearunicorn.game.ui.Panel($I("religion.panel.orderOfTheSun.label"), game.religion);
			var content = religionPanel.render(container);

			var faithCount = dojo.create("span", { style: { display: "inline-block", marginBottom: "10px"}}, content);
			this.faithCount = faithCount;

			this.praiseBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.praiseBtn.label"),
				description: $I("religion.praiseBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.PraiseBtnController(game),
				handler: function() {
					game.religion.praise();	//sigh, enjoy your automation scripts
				}
			}, game);

			this.adoreBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.adoreBtn.label"),
				description: $I("religion.adoreBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.ResetFaithBtnController(game),
				handler: function(btn) {
					game.religion.resetFaith(1.01, true);
				}
			}, game);

			this.transcendBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.transcendBtn.label"),
				description: $I("religion.transcendBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.TranscendBtnController(game),
				handler: function(btn) {
					game.religion.transcend();
					var transcendenceLevel = game.religion.transcendenceTier;
					for (var i = 0; i < game.religion.transcendenceUpgrades.length; i++) {
						if (transcendenceLevel >= game.religion.transcendenceUpgrades[i].tier) {
							game.religion.transcendenceUpgrades[i].unlocked = true;
						}
					}
				}
			}, game);

			var buttonAssociations = {
				"transcendence": this.transcendBtn
			};

			this.praiseBtn.render(content);
			this.adoreBtn.render(content);

			var controller = new com.nuclearunicorn.game.ui.ReligionBtnController(game);
			var upgrades = game.religion.religionUpgrades;
			for (var i = 0; i < upgrades.length; i++) {
				var upgr = upgrades[i];

				var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
					id: upgr.name,
					name: upgr.label,
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
				var associatedButton = buttonAssociations[upgr.name];
				if (associatedButton) {
					associatedButton.render(content);
				}
				this.rUpgradeButtons.push(button);
			}
		}
		this.inherited(arguments);
		this.update();
	},

	update: function(){
		this.inherited(arguments);

		var religion = this.game.religion;

		if (this.sacrificeBtn) {
			this.sacrificeBtn.update();
		}

		if (this.sacrificeAlicornsBtn) {
			this.sacrificeAlicornsBtn.update();
		}

		if (this.refineBtn) {
			this.refineBtn.update();
		}

		if (this.refineTCBtn) {
			this.refineTCBtn.update();
		}

		if (!this.game.challenges.isActive("atheism")) {
			if (this.praiseBtn) {
				this.praiseBtn.update();
			}

			var sr = this.game.religion.getRU("solarRevolution");
			sr.calculateEffects(sr, this.game);

			if (this.adoreBtn) {
				this.adoreBtn.update();
			}

			if (this.transcendBtn) {
				this.transcendBtn.update();
			}

			if (religion.faith && this.faithCount){
				this.faithCount.innerHTML = $I("religion.faithCount.pool", [this.game.getDisplayValueExt(religion.faith)]);
			} else {
				this.faithCount.innerHTML = "";
			}

			var bonus = religion.getSolarRevolutionRatio();
			if (bonus != 0) {
				this.faithCount.innerHTML += ( " (+" + this.game.getDisplayValueExt(100 * bonus) + "% " + $I("religion.faithCount.bonus") + ")" );
			}

			dojo.forEach(this.rUpgradeButtons,  function(e, i){ e.update(); });	
		}
		var hasCT = this.game.science.get("cryptotheology").researched && this.game.religion.transcendenceTier > 0;
		if (hasCT){
			this.ctPanel.setVisible(true);
		}

		dojo.forEach(this.zgUpgradeButtons, function(e, i){ e.update(); });
		var canSeePacts = !this.game.religion.getPact("fractured").researched && this.game.religion.getZU("blackPyramid").val > 0 && (this.game.religion.getTU("mausoleum").val > 0 || this.game.science.getPolicy("radicalXenophobia").researched);
		canSeePacts = canSeePacts && this.game.getFeatureFlag("MAUSOLEUM_PACTS");
		if(canSeePacts){
			this.ptPanel.setVisible(true);
		}
		//dojo.forEach(this.pactUpgradeButtons, function(e, i){ e.update(); });
		/*if(this.necrocornDeficitMsgBox){
			if(this.game.religion.necrocornDeficit > 0){
				this.necrocornDeficitMsgBox.innerHTML = $I("msg.necrocornDeficit.info", [Math.round(this.game.religion.necrocornDeficit * 10000)/10000, 
					-Math.round(100*
					((1 - this.game.religion.necrocornDeficit/50) > 0 ? 
					(this.game.religion.necrocornDeficit/50) * 100: 
					this.game.getLimitedDR(this.game.religion.necrocornDeficit*2, 500))
				)/100|| 0, Math.round(10000*
					(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio")/2)))/100,
					-Math.round((this.game.getEffect("necrocornPerDay") *(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio"))))*1000000)/1000000
				]);
			}
			else {
				this.necrocornDeficitMsgBox.innerHTML = null;
			}
		}*/
	}

});
