dojo.declare("classes.managers.ChallengesManager", com.nuclearunicorn.core.TabManager, {

	constructor: function(game){
		this.game = game;
		//Register the metas with a custom provider.
		this.registerMeta(false, this.challenges, { getEffect: function(challenge, effectName) {
			if (!challenge.effects) {
				//Challenge has no effects defined, so just return 0 for "no effect."
				return 0;
			}
			//Get the base amount for the effect:
			var amt = challenge.effects[effectName] || 0;
			var stackOptions = (challenge.stackOptions || {})[effectName] || {}; //Get the stack options for this effect.  If it doesn't exist, get an empty object instead.
			if (stackOptions.noStack) {
				//This effect doesn't stack; use value directly from the Challenge data.
				return amt;
			}
			//Else, the effect stacks with Challenge completions.
			amt *= challenge.on;
			if (stackOptions.LDRLimit) {
				amt = game.getLimitedDR(amt, stackOptions.LDRLimit);
			}
			if (stackOptions.capMagnitude) {
				//Used for weapon efficiency in the Pacifism Challenge.
				//Clamp amt so its magnitude is no greater than capMagnitude.
				amt = Math.max(-stackOptions.capMagnitude, Math.min(stackOptions.capMagnitude, amt));
			}
			return amt;
		}});
		this.setEffectsCachedExisting();
		this.reserves = new classes.reserveMan(game);
	},

	currentChallenge: null,

	//Challenges have an optional property named "stackOptions".
	//stackOptions is a table where the keys are the names of effects & the values are objects with parameters that control how that effect behaves when the challenge has been completed multiple times.
	//	noStack - If true, the effect is used directly from the Challenge data with no modifications at all.
	//	LDRLimit - Applies Limited Diminishing Returns (LDR) specifying the asymptotic limit.
	//	capMagnitude - The magnitude of the effect will be clamped to this value, but the sign of the effect will not be changed.
	//			If capMagnitude is combined with LDRLimit, the LDR will be applied first, then the magnitude will be capped afterwards.
    challenges:[
    {
		name: "ironWill",
		label: $I("challendge.ironWill.label"),
		description: $I("challendge.ironWill.desc"),
		effectDesc: $I("challendge.ironWill.effect.desc"),
		defaultUnlocked: true
	},{
		name: "winterIsComing",
		label: $I("challendge.winterIsComing.label"),
		description: $I("challendge.winterIsComing.desc"),
		effectDesc: $I("challendge.winterIsComing.effect.desc"),
		defaultUnlocked: true,
		upgrades: {
			buildings: ["pasture"]
		},
		effects: {
			"springCatnipRatio": 0.05,
			"summerSolarFarmRatio": 0.05,
			"coldChance": 0,
			"coldHarshness": 0
		},
		stackOptions: {
			"springCatnipRatio": { LDRLimit: 2 },
			"summerSolarFarmRatio": { LDRLimit: 2 },
			"coldChance": { LDRLimit: 0.825 },
			"coldHarshness": { LDRLimit: 1 }
		},
		calculateEffects: function(self, game){
			if (self.active) {
				self.effects["springCatnipRatio"] = 0;
				self.effects["summerSolarFarmRatio"] = 0;
				self.effects["coldChance"] = 0.05;
				self.effects["coldHarshness"] = -0.02;
			}else{
				self.effects["springCatnipRatio"] = 0.05;
                self.effects["summerSolarFarmRatio"] = 0.05;
				self.effects["coldChance"] = 0;
				self.effects["coldHarshness"] = 0;
			}
		},
		checkCompletionCondition: function(game){
			return game.space.getPlanet("helios").reached;
		}
	},{
		name: "anarchy",
		label: $I("challendge.anarchy.label"),
		description: $I("challendge.anarchy.desc"),
		effectDesc: $I("challendge.anarchy.effect.desc"),
		defaultUnlocked: true,
        effects: {
			"masterSkillMultiplier": 0.2,
			"kittenLaziness": 0
        },
		stackOptions: {
			"masterSkillMultiplier": { LDRLimit: 4 },
			"kittenLaziness": { LDRLimit: 0.25, noStack: true }
		},
		calculateEffects: function(self, game){
			if (self.active) {
				self.effects["masterSkillMultiplier"] = 0;
				self.effects["kittenLaziness"] = 0.5 + game.getLimitedDR(0.05 * self.on, self.stackOptions["kittenLaziness"].LDRLimit);
			}else{
				self.effects["masterSkillMultiplier"] = 0.2;
				self.effects["kittenLaziness"] = 0;
			}
		},
		checkCompletionCondition: function(game){
			return game.bld.get("aiCore").val > 0;
		},
		actionOnCompletion: function(game) {
			game.villageTab.requestCensusRefresh(); //Just in case the player is looking at the village tab when it happens.
		}
	},{
		name: "energy",
		label: $I("challendge.energy.label"),
		description: $I("challendge.energy.desc"),
		effectDesc: $I("challendge.energy.effect.desc"),
		effects: {
			"energyConsumptionRatio": -0.02,
			"energyConsumptionIncrease": 0
		},
		stackOptions: {
			"energyConsumptionRatio": { LDRLimit: 1 }
		},
		calculateEffects: function(self, game){
			if (self.active) {
				self.effects["energyConsumptionRatio"] = 0;
				self.effects["energyConsumptionIncrease"] = 0.1;
			}else{
				self.effects["energyConsumptionRatio"] = -0.02;
				self.effects["energyConsumptionIncrease"] = 0;
			}
		},
		checkCompletionCondition: function(game){
			return(
				(game.bld.get("pasture").val > 0 && game.bld.get("pasture").stage == 1) &&
				(game.bld.get("aqueduct").val > 0 && game.bld.get("aqueduct").stage == 1) &&
				game.bld.get("steamworks").val > 0 &&
				game.bld.get("magneto").val > 0 &&
				game.bld.get("reactor").val > 0 &&
				(game.space.getBuilding("sattelite").val > 0 && game.workshop.get("solarSatellites").researched) &&
				game.space.getBuilding("sunlifter").val > 0 &&
				game.space.getBuilding("tectonic").val > 0 &&
				game.space.getBuilding("hrHarvester").val > 0
				);
		}
	},{
		name: "atheism",
		label: $I("challendge.atheism.label"),
		description: $I("challendge.atheism.desc"),
		effectDesc: $I("challendge.atheism.effect.desc"),
		effects: {
			"faithSolarRevolutionBoost": 0.1,
			"cultureMaxChallenge": 0,
			"scienceMaxChallenge": 0,
			"manpowerMaxChallenge": 0,
			"challengeHappiness": 0
		},
		stackOptions: {
			"faithSolarRevolutionBoost": { LDRLimit: 4 }
		},
		calculateEffects: function(self, game) {
            if (self.active) {
				self.effects["faithSolarRevolutionBoost"] = 0;
				self.effects["cultureMaxChallenge"] = -250;
				self.effects["scienceMaxChallenge"] = -500;
				self.effects["challengeHappiness"] = -0.5;
				self.effects["manpowerMaxChallenge"] = -125;
			}else{
				self.effects["faithSolarRevolutionBoost"] = 0.1;
				self.effects["cultureMaxChallenge"] = 0;
				self.effects["scienceMaxChallenge"] = 0;
				self.effects["challengeHappiness"] = 0;
				self.effects["manpowerMaxChallenge"] = 0;
			}
		},
		checkCompletionConditionOnReset: function(game){
			return game.time.getVSU("cryochambers").on > 0;
		},
		reserveDelay: true
	},{
		name: "1000Years",
		label: $I("challendge.1000Years.label"),
		description: $I("challendge.1000Years.desc"),
		effectDesc: $I("challendge.1000Years.effect.desc"),
        effects: {
			"shatterCostReduction": -0.02,
			"shatterCostIncreaseChallenge": 0,
			"shatterVoidCost": 0,
			"temporalPressCap" : 0,
			"heatEfficiency": 0.1,
			"heatCompression": 0.05
        },
		stackOptions: {
			"shatterCostReduction": { LDRLimit: 1 },
			"heatEfficiency": { capMagnitude: 3 }
		},
        calculateEffects: function(self, game){
            if (self.active) {
        	    self.effects["shatterCostReduction"] = 0;
                self.effects["shatterCostIncreaseChallenge"] = 0.5;
                self.effects["shatterVoidCost"] = 0.4;
                self.effects["temporalPressCap"] = 0;
                self.effects["heatEfficiency"] = 0;
                self.effects["heatCompression"] = 0;
             }else{
				self.effects["shatterCostReduction"] = -0.02;
				self.effects["shatterCostIncreaseChallenge"] = 0;
				self.effects["shatterVoidCost"] = 0;
				self.effects["temporalPressCap"] = 10;
				self.effects["heatEfficiency"] = 0.1;
                self.effects["heatCompression"] = 0.05;
			}
			game.upgrade(self.upgrades); //this is a hack, might need to think of a better sollution later
		},
		upgrades:{
			chronoforge: ["temporalPress"]
		},
		unlocks: {
			chronoforge: ["temporalPress"]
		}
	},{
		name: "blackSky",
		label: $I("challendge.blackSky.label"),
		description: $I("challendge.blackSky.desc"),
		effectDesc: $I("challendge.blackSky.effect.desc"),
        effects: {
			"corruptionBoostRatioChallenge": 0.1,
			"bskSattelitePenalty": 0
        },
		stackOptions: {
			"corruptionBoostRatioChallenge": { LDRLimit: 2 },
			"bskSattelitePenalty": { LDRLimit: 30 }
		},
        calculateEffects: function(self, game){
            if (self.active) {
                self.effects["corruptionBoostRatioChallenge"] = 0;
                self.effects["bskSattelitePenalty"] = 0.1 * (game.ironWill ? 0 : (self.on || 0));
            }else{
				self.effects["corruptionBoostRatioChallenge"] = 0.1;
				self.effects["bskSattelitePenalty"] = 0;
			}
			game.upgrade(self.upgrades);
        },
		checkCompletionCondition: function(game){
			return game.space.getBuilding("spaceBeacon").val > (game.challenges.getChallenge("blackSky").on || 0) ;
		},
		upgrades:{
			zigguratUpgrades: ["marker"]
		},
	},{
		name: "pacifism",
		label: $I("challendge.pacifism.label"),
		description: $I("challendge.pacifism.desc"),
		effectDesc: $I("challendge.pacifism.effect.desc"),
        effects: {
			"alicornPerTickRatio": 0.1,
			"tradeKnowledge": 1,
			"weaponEfficency": 0,
			"policyFakeBought": 0,
			"embassyFakeBought": 0,
			"steamworksFakeBought": 0,
			"tradeKnowledgeRatio": 0
        },
		stackOptions: {
			"tradeKnowledgeRatio": { noStack: true },
			"weaponEfficency": { capMagnitude: 1 }
		},
        calculateEffects: function(self, game){
            if (self.active) {
                self.effects["alicornPerTickRatio"] = 0;
                self.effects["tradeKnowledge"] = 0;
				self.effects["weaponEfficency"] = -0.1; //after 10 completions weapons WILL be useles; no LDR >:3
                self.effects["policyFakeBought"] = 1;
				self.effects["embassyFakeBought"] = 1;
				self.effects["steamworksFakeBought"] = Math.floor(1.5 * self.on || 1)/ (self.on || 1);
                self.effects["tradeKnowledgeRatio"] = 0;
            }else{
				self.effects["alicornPerTickRatio"] = 0.1;
				self.effects["tradeKnowledge"] = 1;
                self.effects["weaponEfficency"] = 0;
                self.effects["policyFakeBought"] = 0;
				self.effects["embassyFakeBought"] = 0;
				self.effects["steamworksFakeBought"] = 0;
                self.effects["tradeKnowledgeRatio"] = self.getTradeBonusEffect(game);
			}
			game.upgrade(self.upgrades); //this is a hack, might need to think of a better sollution later
		},
		updateTradeKnowledgeRatio: function(self, game){
			self.effects["tradeKnowledgeRatio"] = self.getTradeBonusEffect(game);
		},
		checkCompletionConditionOnReset: function(game){
			if(game.diplomacy.baseManpowerCost > 0) { // BSK+IW precaution
				if(!game.village.sim.hadKittenHunters && game.stats.getStatCurrent("totalTrades").val > 0){
					game.achievements.unlockBadge("cleanPaws"); //hack
				}
			}
			return game.science.getPolicy("outerSpaceTreaty").researched;
		},
		upgrades: {
			upgrades: ["compositeBow", "crossbow", "railgun"]
		},
		reserveDelay: true,
		getTradeBonusEffect: function(game){
			var self = game.challenges.getChallenge("pacifism");
			if(!self.on || game.challenges.isActive("pacifism")){
				return 0;
			}
			var tradepost = game.bld.getBuildingExt("tradepost").meta;
			var tradeKnowledge = game.getEffect("tradeKnowledge");
			var tradepostLimit = (7 + tradeKnowledge * 3) * (0.99 + tradeKnowledge * 0.01);
			var tradepostRatioLimit = game.getLimitedDR(0.099 + tradeKnowledge * 0.0075, 0.25);
			return (tradepost.effects["tradeRatio"] * Math.min(tradepostLimit, tradepost.val * tradepostRatioLimit));
		}
	},{
		name: "unicornTears",
		label: $I("challendge.unicornTears.label"),
		description: $I("challendge.unicornTears.desc"),
		effectDesc: $I("challendge.unicornTears.effect.desc"),
		effects: {
			"bonfireTearsPriceRatioChallenge": 0,
			"scienceTearsPricesChallenge": 0,
			"workshopTearsPricesChallenge": 0,
			"cathPollutionPerTearOvercapped": 0, //Overcapped unicorn tears evaporate into a smoky substance
			"unicornsMax": 0,
			"tearsMax": 0,
			"alicornMax": 0,
			//Reward amounts are chosen such that building less than 20 buildings gets *more* expensive,
			//	but building more than 20 buildings is less expensive than before.
			"zigguratIvoryPriceRatio": -0.001,
			"zigguratIvoryCostIncrease": 0.01
		},
		calculateEffects: function(self, game) {
			if(!game.getFeatureFlag("UNICORN_TEARS_CHALLENGE")) {
				for (var key in self.effects) {
					self.effects[key] = 0;
				}
				return;
			}
			if (self.active) {
				//Base challenge: Price ratio of ×1.2 determining added costs in the Bonfire tab.
				//Increasing challenge: +0.03 to the price ratio for each additional completion.
				//Diminishing returns starts after 23 completions
				//Price ratio exceeds ×2 after 28 completions
				//LDR limit is at a price ratio of ×2.5
				self.effects["bonfireTearsPriceRatioChallenge"] =
					game.getLimitedDR(1.2 + 0.03 * self.on, self.stackOptions["bonfireTearsPriceRatioChallenge"].LDRLimit);
				//Increasing challenge: Multiplier to prices in the Science tab.
				self.effects["scienceTearsPricesChallenge"] = 0.25;
				//Increasing challenge: Multiplier to prices in the Workshop tab.
				self.effects["workshopTearsPricesChallenge"] = 0.01;
				self.effects["cathPollutionPerTearOvercapped"] = 3;
				//Base resource storage:
				self.effects["unicornsMax"] = 10;
				self.effects["tearsMax"] = 1;
				self.effects["alicornMax"] = 0.2;
				//Disable the reward:
				self.effects["zigguratIvoryPriceRatio"] = 0;
				self.effects["zigguratIvoryCostIncrease"] = 0;
			} else {
				self.effects["bonfireTearsPriceRatioChallenge"] = 0;
				self.effects["scienceTearsPricesChallenge"] = 0;
				self.effects["workshopTearsPricesChallenge"] = 0;
				self.effects["cathPollutionPerTearOvercapped"] = 0;
				self.effects["unicornsMax"] = 0;
				self.effects["tearsMax"] = 0;
				self.effects["alicornMax"] = 0;
				//Enable the reward:
				self.effects["zigguratIvoryPriceRatio"] = -0.001;
				self.effects["zigguratIvoryCostIncrease"] = 0.01;
			}
		},
		stackOptions: {
			"bonfireTearsPriceRatioChallenge": { noStack: true, LDRLimit: 2.5 },
			"scienceTearsPricesChallenge": { LDRLimit: 75 },
			"workshopTearsPricesChallenge": { LDRLimit: 1 },
			"cathPollutionPerTearOvercapped": { noStack: true },
			"unicornsMax": { noStack: true },
			"tearsMax": { noStack: true },
			"alicornMax": { noStack: true },
			"zigguratIvoryPriceRatio": { LDRLimit: 0.15 },
			"zigguratIvoryCostIncrease": { LDRLimit: 1 }
		},
		leviEnergyToUnlock: 25, //Used by the unlock condition logic
		/**
		 * Calculate the total weight of all resources involved in the price of an item.
		 * @param prices A prices object, which is an array where each element has the format: { name: "slab", val: 1000 }
		 * @return A number.  It could be positive, negative, or infinite, but it will NOT be NaN.
		 */
		sumPricesWeighted: function(prices) {
			var total = 0;
			var lineValue = 0;
			for (var i = 0; i < prices.length; i += 1) {
				lineValue = this._getResWeight(prices[i].name) * prices[i].val;
				//Indeterminate forms such as 0*Infinity could give us NaN here.
				//NaNs are contagious, so get rid of them ASAP.
				total += isNaN(lineValue) ? 0 : lineValue;
			}
			//Indeterminate forms such as Infinity-Infinity could give us NaN here.
			return isNaN(total) ? 0 : total;
		},
		//Helper function to look up a resource's weight value from a table:
		_getResWeight: function(resName) {
			if (typeof(this.resWeights[resName]) == "number") {
				return this.resWeights[resName];
			}
			return this.resWeights["default"];
		},
		resWeights: {
			//---Normal---//
			"catnip": 0,
			"wood": 0.5,
			"minerals": 0.35,
			"iron": 1,
			"titanium": 200, //Starting in the titanium era, each new resource we unlock is vastly more weighty than the previous
			"uranium": 150000,
			"unobtainium": 1e6,
			"antimatter": 1e10,
			"starchart": 200,
			"spice": 250,
			//---Craftables---//
			"beam": 0.75,
			"slab": 0.75,
			"plate": 5,
			"concrate": 25,
			"gear": 20,
			"alloy": 300,
			"eludium": 1e8,
			"ship": 1500,
			"tanker": 150000,
			"kerosene": 7000,
			"parchment": 2,
			"compedium": 20,
			"blueprint": 50,
			"thorium": 180000,
			//---Other---//
			"unicorns": -Infinity, //Used to prevent a building that already costs this resource from having its price modified
			"alicorns": -Infinity,
			"tears": -Infinity,
			"megalith": -Infinity,
			"default": 10 //Used for any resource not explicitly specified
		},
		checkCompletionCondition: function(game) {
			return game.resPool.get("necrocorn").value >= 1;
		}
	},{
		name: "postApocalypse",
		label: $I("challendge.postApocalypse.label"),
		description: $I("challendge.postApocalypse.desc"),
		effectDesc: $I("challendge.postApocalypse.effect.desc"),
		flavor: $I("challendge.postApocalypse.flavor"),
        effects: {
			"arrivalSlowdown": 0, //additive with pollution
			"cryochamberSupport": 1
        },
		calculateEffects: function(self, game){
			if(self.active){
				self.effects["arrivalSlowdown"] = 10;
				self.effects["cryochamberSupport"] = 1; //this is a quick fix for cryochamber cap when resetting into PA; does not make PA easier so it's ok
			}else{
				self.effects["arrivalSlowdown"] = 0;
				self.effects["cryochamberSupport"] = 1;
			}
		},
		findRuins: function (self, game) {
			
		},
		checkCompletionCondition: function(game){
			return game.bld.cathPollution == 0;
		},
		actionOnCompletion: function(game){
			game.bld.effectsBase["hutFakeBought"] = 0;
			game.bld.effectsBase["logHouseFakeBought"] = 0;
			game.bld.effectsBase["mansionFakeBought"] = 0; //in case of some laggy redshift 
			game.bld.pollutionEffects["pollutionDissipationRatio"] = 1e-7; //putting it back to default at the end of the challenge is enough
			//policies unlocked ONLY after winning this challenge!
			//After the challenge is won player gets two options: make terraforming stations stronger; or get usedCryochamber ONCE.
			//In case of taking the cryochaimber, both policies become not unlocked and extraction policy becomes NOT researched
			game.science.getPolicy("terraformingInsight").unlocked = true; //policy which helpes to get more paragon this run
			game.science.getPolicy("cryochamberExtraction").unlocked = true; //single use policy; gets not researched after player gets the bonus
		}
	}],

	game: null,

	resetState: function(){
		for (var i = 0; i < this.challenges.length; i++){
			this.resetStateStackable(this.challenges[i]);
		}
		this.currentChallenge = null;
		this.reserves.resetState();
	},

	/**
	 * The parent class's resetStateStackable, defined in core.js, is designed for buildings.
	 * Challenges are so fundamentally different that I felt it was best to write custom logic for them.
	 * That way, if someone decides to call this function, it'll have well-defined behavior.
	 * @param challenge The Challenge whose state will be reset to default values.
	 * @return Nothing
	 */
	resetStateStackable: function(challenge) {
		challenge.unlocked = Boolean(challenge.defaultUnlocked);
		challenge.pending = false;
		challenge.active = false;
		challenge.researched = false;
		challenge.on = 0;
	},

	save: function(saveData){
		saveData.challenges = {
			challenges: this.filterMetadata(this.challenges, [
				"name", 
				"researched", 	//deprecated
				"on", 
				"unlocked", 
				"active"		//if currently active or not
			])
		};
		var kittens = [];
		for (var i in this.game.challenges.reserves.reserveKittens){
			var _kitten = this.game.challenges.reserves.reserveKittens[i].save(this.game.opts.compressSaveFile, this.game.village.jobNames);
			kittens.push(_kitten);
		}
		saveData.challenges.reserves = this.reserves.getSaveData();
	},

	load: function(saveData){
		if (!saveData.challenges){
			return;
		}

		this.loadMetadata(this.challenges, saveData.challenges.challenges);

		//legacy saves compatibility mode
		var currentChallenge = saveData.challenges.currentChallenge;
		if (currentChallenge){
			this.getChallenge(currentChallenge).active = true;
		}

		for (var i = 0; i < this.challenges.length; i++) {
			if (this.challenges[i].researched && !this.challenges[i].on) {
				this.challenges[i].on = 1;
			}
			if(this.challenges[i].unlocks && this.challenges[i].on && !this.challenges[i].active){
				this.game.unlock(this.challenges[i].unlocks);
			}
		}
		if (saveData.challenges.reserves){
			var kittens = saveData.challenges.reserves.reserveKittens;
	
				var reserveKittens = [];
	
				for (var i = kittens.length - 1; i >= 0; i--) {
					var kitten = kittens[i];
	
					var newKitten = new com.nuclearunicorn.game.village.Kitten();
					newKitten.load(kitten, this.game.village.jobNames);
					reserveKittens.unshift(newKitten);
				}
				this.game.challenges.reserves.reserveKittens = reserveKittens;
				this.game.challenges.reserves.reserveResources = saveData.challenges.reserves.reserveResources;
				this.game.challenges.reserves.reserveCryochambers = saveData.challenges.reserves.reserveCryochambers||kittens.length;
		}
	},

	update: function(){
		//Disable challenge if the feature flag for it is disabled
		if (!this.game.getFeatureFlag("UNICORN_TEARS_CHALLENGE")) {
			var chall = this.getChallenge("unicornTears");
			//Lock the challenge, kick the player out of it, & don't let them re-enter it.
			chall.active = false;
			chall.pending = false;
			chall.unlocked = false;
		}

		//Iron Will has special rules.  Just make the UI more obvious when the game is in IW mode:
		this.getChallenge("ironWill").active = this.game.ironWill;

		//checkCompletionCondition for functions tested for completion here
		for(var i = 0; i < this.challenges.length; i++){
			if(this.challenges[i].active && this.challenges[i].checkCompletionCondition && this.challenges[i].checkCompletionCondition(this.game)){
				this.researchChallenge(this.challenges[i].name);
			}
		}
	},

	getChallenge: function(name){
		return this.getMeta(name, this.challenges);
	},
	anyChallengeActive: function(){
		var challengeActive = false;
		for(var i in this.challenges){
			if (this.isActive(this.challenges[i].name)){
				challengeActive = true;
			}
		}
		return challengeActive;
	},
	/*
		returns true if challenge currently in progress
	*/
	isActive: function(name){
		return !!this.getChallenge(name).active;
	},
	/**
	 * Returns the number of Challenges currently marked as pending.
	 */
	getCountPending: function() {
		var count = 0;
		dojo.forEach(this.challenges, function(challenge) {
				count += challenge.pending ? 1 : 0;
			});
		return count;
	},
	/**
	 * Returns the total number of Challenge completions.
	 */
	getCountCompletions: function() {
		var total = 0;
		for(var i = 0; i < this.challenges.length; i += 1) {
		    total += this.challenges[i].on;
		}
		return total;
	},
	/**
	 * Returns the number of different Challenges completed.
	 */
	getCountUniqueCompletions: function() {
		var total = 0;
		for(var i = 0; i < this.challenges.length; i += 1) {
		    total += 1 * this.challenges[i].researched;
		}
		return total;
	},

	researchChallenge: function(challenge) {
		if (this.isActive(challenge)){
			this.getChallenge(challenge).researched = true;
			this.getChallenge(challenge).on += 1;
			this.getChallenge(challenge).active = false;
			this.game.msg($I("challendge.btn.log.message.on.complete", [this.getChallenge(challenge).label]));
			if(this.getChallenge(challenge).actionOnCompletion){
				this.getChallenge(challenge).actionOnCompletion(this.game);
			}
			/*if(!this.anyChallengeActive() && !this.game.ironWill && !this.getChallenge(challenge).reserveDelay){
				this.reserves.addReserves();
			}*/
			if (this.getChallenge(challenge).unlocks) {
				this.game.unlock(this.getChallenge(challenge).unlocks);
			}
			this.game.calculateAllEffects();
		}
	},
	onRunReset: function(){
		for(var i = 0; i < this.challenges.length; i++){
			if(this.challenges[i].active && this.challenges[i].checkCompletionConditionOnReset && this.challenges[i].checkCompletionConditionOnReset(this.game)){
				this.researchChallenge(this.challenges[i].name);
			}
		}
	},
	/**
	 * Apply challenges marked by player as pending
	 * 
	 * @isIronWillPending true if we try to apply pending ironWill challenge
	 */
	applyPending: function(isIronWillPending){
		var game = this.game;
		var winterAndPA = (game.challenges.getChallenge("postApocalypse").pending && 
			game.challenges.getChallenge("winterIsComing").pending &&
			!isIronWillPending && game.time.getVSU("cryochambers").val);
		var WPA_warning = $I("challendge.btn.confirmation_postApocalypse_winterIsComing.msg");
		game.ui.confirm(
			$I("challendge.btn.confirmation.title"), 
			((winterAndPA)? ($I("challendge.btn.confirmation.msg") + WPA_warning) :$I("challendge.btn.confirmation.msg")), function() 
		{
			// Reset with any benefit of chronosphere (resources, kittens, etc...)
			// Should put resources and kittens to reserve HERE!
			// Kittens won't be put into reserve in post apocalypcis!
			game.challenges.onRunReset();
			game.challenges.reserves.calculateReserves(isIronWillPending);
			game.bld.get("chronosphere").val = 0;
			game.bld.get("chronosphere").on = 0;
			if(!game.challenges.getChallenge("postApocalypse").pending || isIronWillPending){
				game.time.getVSU("cryochambers").val = 0;
				game.time.getVSU("cryochambers").on = 0;
			}else if(game.challenges.getChallenge("anarchy").pending && this.game.village.leader){
				this.game.village.leader.isLeader = false;
				this.game.village.leader = null;
			}
			game.resetAutomatic();
		}, function() {
		});
	},
});

dojo.declare("classes.reserveMan", null,{
	constructor: function(game){
		this.game = game;
		this.reserveResources = null;
		this.reserveKittens = null;
		this.reserveCryochambers = 0;
	},
	resetState: function(){
		this.reserveResources = {};
		this.reserveKittens = [];
		this.reserveCryochambers = 0;
	},
	calculateReserveResources: function(){
		var saveRatio = this.game.bld.get("chronosphere").val > 0 ? this.game.getEffect("resStasisRatio") : 0;
		if(!saveRatio){
			return;
		}
		var reserveResources = this.game.challenges.reserves.reserveResources;
		for (var i in this.game.resPool.resources) {
			var res = this.game.resPool.resources[i];
			if(res.name == "timeCrystal"){
				continue;
			}
			var fluxCondensator = this.game.workshop.get("fluxCondensator");
			if (res.persists === false
			 || (res.craftable && res.name != "wood" && !fluxCondensator.researched)) {
				continue;	//>:
			}
			var value = 0;

			if (!res.persists){
				if (!res.craftable || res.name == "wood") {
					value = res.value * saveRatio;
					if (res.name == "void") {
						value = Math.floor(value);
					}
				} else if (res.value > 0) {
					value = Math.sqrt(res.value) * saveRatio * 100;
				}
			}

			if (value > 0) {
				reserveResources[res.name] = Math.max(reserveResources[res.name] || 0, Math.min(value, Number.MAX_VALUE));
			}
		}
		this.game.challenges.reserves.reserveResources = reserveResources;
	},
	calculateReserveKittens: function(){
		// Kittens won't be put into reserve in post apocalypcis!
		var reserveKittens = [];
		var cryochambers = this.game.time.getVSU("cryochambers").on;
		
		if (cryochambers > 0) {
			this.game.village.sim.sortKittensByExp();
			reserveKittens = this.game.village.sim.kittens.slice(-cryochambers);
			for (var i in reserveKittens) {
				delete reserveKittens[i].job;
				delete reserveKittens[i].isLeader; //two leaders at the same time would break things probably
				delete reserveKittens[i].engineerSpeciality;
			}
		}
		this.game.challenges.reserves.reserveKittens = 
		this.game.challenges.reserves.reserveKittens.concat(reserveKittens);
	},
	/*
		@isIronWillPending - true if we try to apply ironWill challenge
	*/
	calculateReserves: function(isIronWillPending){
		this.game.challenges.reserves.calculateReserveResources();
		if(!this.game.challenges.getChallenge("postApocalypse").pending || isIronWillPending){
			this.game.challenges.reserves.calculateReserveKittens();
			this.reserveCryochambers += this.game.time.getVSU("cryochambers").on;
		}
	},
	addReserves: function(){
		for (var i in this.reserveResources){
			if(i == "timeCrystal"){
				delete this.reserveResources[i];
				continue;
			}
			var resCap = this.game.resPool.get(i).maxValue;
			if(!resCap){
				this.game.resPool.get(i).value = Math.min(this.game.resPool.get(i).value + this.reserveResources[i], Number.MAX_VALUE);
			}else{
				this.game.resPool.get(i).value = Math.max(this.game.resPool.get(i).value, this.reserveResources[i]);
			}
			delete this.reserveResources[i];
		}

		for(var i in this.reserveKittens){
			this.game.village.sim.kittens.push(this.reserveKittens[i]);
		}
		this.game.time.getVSU("usedCryochambers").val += this.reserveCryochambers;
		this.game.time.getVSU("usedCryochambers").on += this.reserveCryochambers;
		this.reserveCryochambers = 0;
		this.reserveKittens = [];
		if (this.game.time.getVSU("usedCryochambers").val > 0) {
			this.game.time.getVSU("usedCryochambers").unlocked = true;
		}
		this.game.msg($I("challendge.reservesReclaimed.msg"));
		//Invalidate achievements that require the player not to use Chronospheres this run.
		this.game.startedWithoutChronospheres = false;
	},

	getSaveData: function(){
		var kittens = [];
		for (var i in this.game.challenges.reserves.reserveKittens){
			var _kitten = this.game.challenges.reserves.reserveKittens[i].save(this.game.opts.compressSaveFile, this.game.village.jobNames);
			kittens.push(_kitten);
		}
		return {
			reserveKittens: kittens,
			reserveResources: this.game.challenges.reserves.reserveResources,
			ironWillClaim: this.ironWillClaim,
			reserveCryochambers: this.reserveCryochambers
		};
	},
	reservesExist: function(){
		return (Object.keys(this.reserveResources).length || this.reserveKittens.length);
	}
});
dojo.declare("classes.ui.ChallengeBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {

	initModel: function(options) {
		var model = this.inherited(arguments);
		model.multiplyEffects = true; //When the player holds the SHIFT key, it'll multiply Challenge effects by number of times completed.
		return model;
	},

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.challenges.getChallenge(model.options.id);
        }
        return model.metaCached;
    },

	getDescription: function(model) {
		if (model.metadata.name == "ironWill") { //Show the "your game will be reset" bit for Iron Will only
			var msgChronosphere = (this.game.bld.get("chronosphere").val > 0) ? $I("challendge.btn.chronosphere.with.ironWill.desc") : "";
			return this.inherited(arguments) + $I("challendge.btn.desc", [model.metadata.effectDesc, msgChronosphere]);
		}
		return this.inherited(arguments) + $I("challendge.btn.desc.new", [model.metadata.effectDesc]);
	},

	getName: function(model){

		var meta = model.metadata;
		var name = meta.label;
		if (meta.active || meta.name == this.game.challenges.active) {
			name = $I("challendge.btn.name.current", [meta.label]);
		} else if (meta.researched){
			name = $I("challendge.btn.name.complete", [meta.label]);
		} 
		if (meta.pending){
			name += " (" + $I("challendge.pending") + ")";
		}
		if (meta.on) {
			name += " (" + meta.on + ")";
		}
		return name;
	},

	getPrices: function(model) {
		return $.extend(true, [], model.metadata.prices); // Create a new array to keep original values
	},

	buyItem: function(model, event) {
		this.togglePending(model);
		return {
			itemBought: true,
			reason: "item-is-free" /*It costs no resources to gather catnip, so we can't fail to buy it*/
		};
	},

	togglePending: function(model){
		if (model.metadata.name == "ironWill") {
			this.game.challenges.applyPending(true	/*isIronWillPending*/);
			return;
		}
		model.metadata.pending = !model.metadata.pending;
	},

	updateVisible: function(model){
		model.visible = model.metadata.unlocked;
	},

	updateEnabled: function(model){
		model.enabled = true;
	}
});

dojo.declare("classes.ui.ChallengePanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,

	constructor: function(){
		this.resetMessage = null;
	},

	render: function(container){
		var content = this.inherited(arguments);
		this.updateResetMessage();

		var self = this;
		var controller = new classes.ui.ChallengeBtnController(self.game);
		dojo.forEach(this.game.challenges.challenges, function(challenge, i){
			var button = new com.nuclearunicorn.game.ui.BuildingBtn({id: challenge.name, controller: controller}, self.game);
			button.render(content);
			self.addChild(button);
		});
	},

	update: function() {
		this.inherited(arguments);
		this.updateResetMessage();
	},

	updateResetMessage: function() {
		var numPending = this.game.challenges.getCountPending();

		if (!this.resetMessage) {
			//Create the reset message if it doesn't exist.
			this.resetMessage = dojo.create("span", { style: "display: inline-block; margin-bottom: 16px" }, this.contentDiv);
		}

		//Set the text inside the reset message.
		var msgText = $I("challendge.panel.pending", [numPending]);
		if (this.game.bld.get("chronosphere").val > 0) {
			msgText += $I("challendge.btn.chronosphere.desc");
		}

		//Don't update every frame, just update if something has changed since last update:
		if (this.resetMessage.innerHTML != msgText) {
			this.resetMessage.innerHTML = msgText;
		}

		//Hide the reset message if zero Challenges are pending:
		dojo.style(this.resetMessage, "display", numPending > 0 ? "inline-block" : "none");
	}

});

dojo.declare("classes.ui.ReservesPanel", com.nuclearunicorn.game.ui.Panel, {

	statics: { //i.e. shared between all instances of this class
		maxKittensToDisplayIndividually: 30 //If there are more than this many kittens, don't show any more.
	},

	constructor: function() {
		this.reclaimReservesBtn = null;
		this.reclaimInstructionsText = null;
	},

	render: function(container) {
		var content = this.inherited(arguments);
		
		this.reclaimInstructionsText = dojo.create("span", {
			innerHTML: $I("challendge.reserves.panel.summary"), style: "display: inline-block; margin-bottom: 16px" }, content);
		
		this.reclaimReservesBtn = new com.nuclearunicorn.game.ui.ButtonModern({
			name: $I("challendge.reclaimReserves.label"),
			description: $I("challendge.reclaimReserves.desc"),
			handler: dojo.hitch(this, function(){
				this.game.challenges.reserves.addReserves();
				this.game.ui.render();
			}),
			controller: new com.nuclearunicorn.game.ui.ButtonController(this.game, {
				updateVisible: function (model) {
					model.visible = (!this.game.challenges.anyChallengeActive() && !this.game.ironWill &&
					this.game.challenges.reserves.reservesExist());
				},
			})
		}, this.game);
		this.reclaimReservesBtn.render(content);

		this.reclaimInstructionsText = dojo.create("span", {
			innerHTML: $I("challendge.reserves.panel.reclaim.instructions"), style: "margin-bottom: 16px" }, content);
		//Set visible if & only if we are in at least 1 challenge & have reserves to claim.
		dojo.style(this.reclaimInstructionsText, "display",
			(this.game.challenges.reserves.reservesExist() && (this.game.challenges.anyChallengeActive() || this.game.ironWill)) ?
			"block" : "none");

		var table = dojo.create("table", {}, content);
		var resPanel = dojo.create("td", { className: "craftStuffPanel", style: "width: 40%" }, table);
		var kittensPanel = dojo.create("td", { className: "craftStuffPanel", style: "width: 60%" }, table);

		this.renderReservedResources(resPanel);
		this.renderReservedKittens(kittensPanel);
	},

	//If there are no resources, displays a message saying as such.
	renderReservedResources: function(panelContainer) {
		var resRes = this.game.challenges.reserves.reserveResources;
		var numReservedTypes = Object.keys(resRes).length; //How many different types of resources are in reserves.
		if (numReservedTypes < 1) {
			dojo.create("span", { innerHTML: $I("challendge.reserves.resources.none") }, panelContainer);
			return;
		}
		
		//Create a list of all resources stored in reserves:
		var label = dojo.create("span", { innerHTML: $I("challendge.reserves.resources.label") }, panelContainer);

		if (!this.game.prestige.getPerk("ascoh").researched) {
			//Give the player a vague sense of how many resources are in reserves based on how many *types* of resources there are:
			var keyToUse = "challendge.reserves.resources.lessThan10";
			if (numReservedTypes >= 30) {
				var keyToUse = "challendge.reserves.resources.30orMore";
			} else if (numReservedTypes >= 20) {
				var keyToUse = "challendge.reserves.resources.20orMore";
			} else if (numReservedTypes >= 10) {
				var keyToUse = "challendge.reserves.resources.10orMore";
			}
			label.innerHTML += " " + $I(keyToUse);
			return;
		}

		//Create a list of all resources stored in reserves:
		var resTable = dojo.create("table", {}, panelContainer);
		var numCraftables = 0;
		var numNonCraftables = 0;
		//Iterate through resources in the order that they're stored in the resource manager:
		for (var i in this.game.resPool.resources) {
			var resObj = this.game.resPool.resources[i]; //Object with all data about that resource
			var resAmt = resRes[resObj.name] || 0; //Amount of that resource in reserves.
			if (!resAmt) {
				continue; //Skip resources whose value (stored in reserves) is zero
			}
			//The first time through, skip all craftable resources.
			if (resObj.craftable && resObj.name != "wood") {
				continue;
			}
			this.createSingleResourceRow(resObj, resAmt, resRes, resTable);
			numNonCraftables += 1;
		}
		var breakRow = dojo.create("tr", {}, resTable);
		dojo.create("td", { innerHTML: "<hr />" }, breakRow);
		for (var i in this.game.resPool.resources) {
			var resObj = this.game.resPool.resources[i]; //Object with all data about that resource
			var resAmt = resRes[resObj.name] || 0; //Amount of that resource in reserves.
			if (!resAmt) {
				continue; //Skip resources whose value (stored in reserves) is zero
			}
			//The second time through, skip all non-craftable resources.
			if (!resObj.craftable || resObj.name == "wood") {
				continue;
			}
			this.createSingleResourceRow(resObj, resAmt, resRes, resTable);
			numCraftables += 1;
		}

		if (numCraftables == 0 || numNonCraftables == 0) {
			//Show a horizontal line in the table ONLY IF there are craftables & non-craftables to separate from each other.
			dojo.destroy(breakRow);
		}
	},

	//Helper function for internal use.
	createSingleResourceRow: function(resourceObj, resourceAmount, reservedResources, tableContainer) {
		if (typeof(resourceAmount) !== "number") {
			console.error("Invalid resourceAmount passed to createSingleResourceRow!");
		}
		//Shamelessly copied from left.jsx.js:
		//This is the code that makes all resoruces be displayed in their color.
		var resNameCss = {};
		if (resourceObj.type == "uncommon"){
			resNameCss = {
				color: "Coral"
			};
		}
		if (resourceObj.type == "rare"){
			resNameCss = {
				color: "orange",
				textShadow: "1px 0px 10px Coral"
			};
		}
		if (resourceObj.color){
			resNameCss = {
				color: resourceObj.color,
			};
		} 
		if (resourceObj.style){
			for (var styleKey in resourceObj.style){
				resNameCss[styleKey] = resourceObj.style[styleKey];
			}
		}

		var tr = dojo.create("tr", {}, tableContainer);
		dojo.create("td", { innerHTML: resourceObj.title || resourceObj.name + ":", style: resNameCss }, tr);
		dojo.create("td", { innerHTML: this.game.getDisplayValueExt(resourceAmount) }, tr);
	},

	//If there are no kittens or cryochambers, displays nothing.
	renderReservedKittens: function(panelContainer) {
		var numResCryos = this.game.challenges.reserves.reserveCryochambers; //Number of cryochambers
		var resKit = this.game.challenges.reserves.reserveKittens; //Array of kittens
		var numDisplayedSoFar = 0;

		if (numResCryos) {
			dojo.create("span", { innerHTML: $I("challendge.reserves.cryochambers.label", [numResCryos]) }, panelContainer);
		}
		
		if (resKit.length && this.game.prestige.getPerk("ascoh").researched) {
			//Create a list of all the cryochambers we have stored in reserved & all kittens in them:
			var kittensTable = dojo.create("table", {}, panelContainer);
			for (var i = 0; i < resKit.length; i += 1) {
				var kitten = resKit[i];
	
				var tr = dojo.create("tr", {}, kittensTable);
				if (numDisplayedSoFar >= this.statics.maxKittensToDisplayIndividually) {
					dojo.create("td", { innerHTML: "..." }, tr);
					dojo.create("td", { innerHTML: "..." }, tr);
					dojo.create("td", { innerHTML: "..." }, tr);
					break;
				}
				//Otherwise, we still can display more kittens:
				dojo.create("td", { innerHTML: this.game.village.getStyledName(kitten, false /*is leader panel*/), style: "padding-right: 8px" }, tr);
				var traitLabel = kitten.trait.title;
				var rank = kitten.rank;
				//Note that if we are fractured, the name will be randomized, & we'll obscure other info as well.
				if (this.game.religion.getPact("fractured").val && this.game.getFeatureFlag("MAUSOLEUM_PACTS")) {
					traitLabel = "???"; //Unknown trait
					rank = this.game.rand(4) * 2; //Random rank in range [0,7] with a bias towards even numbers.
					if (this.game.rand(100) < 25) {
						rank += 1;
					}
				}
				dojo.create("td", { innerHTML: traitLabel, style: "white-space: nowrap; overflow: clip" }, tr);
				dojo.create("td", { innerHTML: (rank == 0 ? "" : " (" + $I("village.census.rank") + " " + rank + ")"), style: "white-space: nowrap; overflow: clip" }, tr);
				numDisplayedSoFar += 1;
			}
		}
	},

	update: function() {
		var hasReserves = this.game.challenges.reserves.reservesExist();
		this.inherited(arguments);

		//If the player doesn't have Chronophysics, they probably don't have Chronospheres & therefore won't use reserves.
		//But if they have reserves, show this panel anyways.
		this.setVisible(Boolean(hasReserves || this.game.science.get("chronophysics").researched));

		if (this.reclaimReservesBtn) {
			this.reclaimReservesBtn.update();
		}
		if (this.reclaimInstructionsText) {
			//Set visible if & only if we are in at least 1 challenge & have reserves to claim.
			dojo.style(this.reclaimInstructionsText, "display",
				(hasReserves && (this.game.challenges.anyChallengeActive() || this.game.ironWill)) ?
				"block" : "none");
		}
	}
});

dojo.declare("classes.ui.ChallengeEffectsPanel", com.nuclearunicorn.game.ui.Panel, {
	//The name of the Challenge that this panel lists the effects of:
	challengeName: "",

	constructor: function() {
		this.listElement = null;
	},

	//Links this panel up with the correct Challenge internally & sets the title to be "effects of [challengeName]":
	setChallengeName: function(challengeName) {
		this.challengeName = challengeName;
		this.name = $I("challendge.effects.panel.label", [this.game.challenges.getChallenge(challengeName).label]);
	},

	render: function(container) {
		var content = this.inherited(arguments);
		this.listElement = dojo.create("ul", { style: "margin-top: 0px; margin-bottom: 0px;" }, content);
		this.generateEffectsList();
	},

	/**
	 * Populates the list of the Challenge's effects and/or updates it with the most recent information.
	 * This function goes out of its way to only modify UI elements exactly as needed--no more, no less.
	 * The list of Challenge effects will be empty if the Challenge in question isn't unlocked yet.
	 */
	generateEffectsList: function() {
		var challengeData = this.game.challenges.getChallenge(this.challengeName);
		if (!challengeData.unlocked) {
			//Challenge isn't unlocked yet, so don't display any effects for it.
			if (this.listElement.hasChildNodes()) {
				dojo.empty(this.listElement);
			}
			return;
		}
		//Else, the Challenge is unlocked.
		var childNodes = this.listElement.childNodes;
		var i = 0;
		for (var effectName in challengeData.effects) {
			var displayParams = this.game.getEffectDisplayParams(effectName, challengeData.totalEffectsCached[effectName], false /*showIfZero*/);
			//displayParams could be null if this is the sort of effect that's supposed to be hidden.
			if (!displayParams) {
				continue;
			}
			//Else, non-null therefore display this effect:
			var textToDisplay = displayParams.displayEffectName + ": " + displayParams.displayEffectValue;
			if (childNodes.length <= i) {
				//Create a DOM node only if we need to.
				dojo.create("li", { innerHTML: textToDisplay }, this.listElement);
			} else if(dojo.attr(childNodes[i], "innerHTML") != textToDisplay) {
				//Modify an existing DOM node only if we need to.
				dojo.attr(childNodes[i], "innerHTML", textToDisplay);
			}
			i += 1;
		}
		while (i < childNodes.length) {
			//Destroy any unnecessary DOM nodes.
			dojo.destroy(childNodes[childNodes.length - 1]);
		}
	},

	update: function() {
		this.inherited(arguments);
		this.generateEffectsList();

		//Update visible/invisible status:
		//Show effects panel only if the game is set to show them && there is at least 1 effect to show.
		this.setVisible(Boolean(this.game.detailedChallengeInfo) && this.listElement.hasChildNodes());
	}
});

dojo.declare("classes.tab.ChallengesTab", com.nuclearunicorn.game.ui.tab, {
	render: function(container){
		this.challengesPanel = new classes.ui.ChallengePanel($I("challendge.panel.label"), this.game.challenges);
		this.challengesPanel.game = this.game;
		this.challengesPanel.render(container);

		//consition panel to be reviewed

		/*this.conditionsPanel = new classes.ui.ConditionPanel($I("challendge.condition.panel.label"), this.game.challenges);
		this.conditionsPanel.game = this.game;
		this.conditionsPanel.render(container);*/

		dojo.create("div", { style: {
				marginBottom: "15px"
		} }, container);

		var applyPendingBtn = new com.nuclearunicorn.game.ui.ButtonModern({
			name: $I("challendge.applyPending.label"),
			description: $I("challendge.applyPending.desc"),
			handler: dojo.hitch(this, function(){
				this.game.challenges.applyPending();
			}),
			controller: new com.nuclearunicorn.game.ui.ButtonController(this.game, {
				updateVisible: function (model) {
					model.visible = this.game.challenges.getCountPending() > 0;
				}, 
				getName: function(){
					return $I("challendge.applyPending.label", [this.game.challenges.getCountPending()]);
				}
			})
		}, this.game);
		applyPendingBtn.render(container);
		this.applyPendingBtn = applyPendingBtn;

		this.reservesPanel = new classes.ui.ReservesPanel($I("challendge.reserves.panel.label"), this.game.challenges);
		this.reservesPanel.game = this.game;
		this.reservesPanel.render(container);
		dojo.create("div", { style: {
				marginBottom: "15px"
		} }, container);

		var showChallengeEffectsBtn = new com.nuclearunicorn.game.ui.ButtonModern({
			name: $I("challendge.effects.show.label"),
			description: $I("challendge.effects.toggle.desc"),
			handler: dojo.hitch(this, function() {
				this.game.detailedChallengeInfo = !this.game.detailedChallengeInfo;
			}),
			controller: new com.nuclearunicorn.game.ui.ButtonController(this.game, {
				updateVisible: function (model) {
					var effectsPanels = this.game.challengesTab.challengeEffects; //Array of UI panels that list the Challenge effects
					if (effectsPanels) {
						//The button to toggle Challenge effects is visible only if there is at least 1 effect to display right now:
						model.visible = effectsPanels.some(function(challengeEffectsPanel) {
							return challengeEffectsPanel.listElement.hasChildNodes();
						});
					} else {
						model.visible = false;
					}
				},
				getName: function() {
					return this.game.detailedChallengeInfo ? $I("challendge.effects.hide.label") : $I("challendge.effects.show.label");
				}
			})
		}, this.game);
		showChallengeEffectsBtn.render(container);
		this.showChallengeEffectsBtn = showChallengeEffectsBtn;

		//Summary of total Challenge effects:
		this.challengeEffects = [];
		for (var i = 0; i < this.game.challenges.challenges.length; i += 1) {
			var effectPanel = new classes.ui.ChallengeEffectsPanel("", this.game.challenges);
			effectPanel.game = this.game;
			effectPanel.setChallengeName(this.game.challenges.challenges[i].name);
			effectPanel.render(container);
			this.challengeEffects.push(effectPanel);
		}
	},

	update: function(){
		this.challengesPanel.update();
		//this.conditionsPanel.update();
		this.applyPendingBtn.update();
		this.reservesPanel.update();
		this.showChallengeEffectsBtn.update();
		for (var i = 0; i < this.challengeEffects.length; i += 1) {
			this.challengeEffects[i].update();
		}
	}
});
