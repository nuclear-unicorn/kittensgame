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
				//This effect doesn't stack.  The Challenge calculates it itself.
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
	//			If noStack is combined with another option, noStack overrides all other options & the effect doesn't stack.
	//	LDRLimit - Applies Limited Diminishing Returns (LDR) specifying the asymptotic limit.
	//	capMagnitude - The magnitude of the effect will be clamped to this value, but the sign of the effect will not be changed.
	//			If capMagnitude is combined with LDRLimit, the LDR will be applied first, then the magnitude will be capped afterwards.
    challenges:[
    {
		name: "ironWill",
		label: $I("challendge.ironWill.label"),
		description: $I("challendge.ironWill.desc"),
		effectDesc: $I("challendge.ironWill.effect.desc"),
        researched: false,
        unlocked: true
	},{
		name: "winterIsComing",
		label: $I("challendge.winterIsComing.label"),
		description: $I("challendge.winterIsComing.desc"),
		effectDesc: $I("challendge.winterIsComing.effect.desc"),
		researched: false,
		unlocked: true,
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
		researched: false,
		unlocked: true,
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
		}
	},{
		name: "energy",
		label: $I("challendge.energy.label"),
		description: $I("challendge.energy.desc"),
		effectDesc: $I("challendge.energy.effect.desc"),
        researched: false,
		unlocked: false,
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
		researched: false,
		reserveDelay: true,
        unlocked: false
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
			"heatEfficiency": 0.1
        },
		stackOptions: {
			"shatterCostReduction": { LDRLimit: 1 }
		},
        calculateEffects: function(self, game){
            if (self.active) {
        	    self.effects["shatterCostReduction"] = 0;
                self.effects["shatterCostIncreaseChallenge"] = 0.5;
                self.effects["shatterVoidCost"] = 0.4;
                self.effects["temporalPressCap"] = 0;
                self.effects["heatEfficiency"] = 0;
             }else{
				self.effects["shatterCostReduction"] = -0.02;
				self.effects["shatterCostIncreaseChallenge"] = 0;
				self.effects["shatterVoidCost"] = 0;
				self.effects["temporalPressCap"] = 10;
				self.effects["heatEfficiency"] = 0.1;
			}
			game.upgrade(self.upgrades); //this is a hack, might need to think of a better sollution later
		},
		researched: false,
		unlocked: false,
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
		researched: false,
		unlocked: false,
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
		researched: false,
		reserveDelay: true,
		unlocked: false,
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
	}, {
		name: "unicornTears",
		label: $I("challendge.unicornTears.label"),
		description: $I("challendge.unicornTears.desc"),
		effectDesc: $I("challendge.unicornTears.effect.desc"),
		researched: false,
		unlocked: false,
		effects: {
			"zigguratIvoryPriceRatio": -0.025,
			"bonfireBaseTearsCost": 0,
			"workshopBaseTearsCost": 0,
			"markerCostIncrease": 0
		},
		calculateEffects: function(self, game) {
			if (self.active) {
				self.effects["bonfireBaseTearsCost"] = (self.on < 4) ? (self.on + 2) : (6 + Math.sqrt(this.on - 4));
				//First Challenge (0 prior completions): 2
				//Second Challenge i.e. first repeat (1 prior completion): 3
				//Third Challenge i.e. second repeat (2 prior completions): 4
				//After that: 5, 6, 7, 7.4, 7.7, 8, 8.2, 8.4, 8.6, 8.8, 9, 9.2, 9.3, etc., increasing with square root.
				switch(self.on) {
				case 0:
					self.effects["workshopBaseTearsCost"] = 0;
					break;
				case 1:
					self.effects["workshopBaseTearsCost"] = 0.01;
					break;
				case 2:
					self.effects["workshopBaseTearsCost"] = 0.5;
					break;
				default:
					self.effects["workshopBaseTearsCost"] = 1;
				}
				//First Challenge (0 prior completions): 0 * 0 = 0
				//Second Challenge i.e. first repeat (1 prior completion): 0.01 * 1 = 0.01
				//Third Challenge i.e. second repeat (2 prior completions): 0.5 * 2 = 1
				//Fourth Challenge (3 prior completions): 1 * 3 = 3
				//After that: 1 * N = N, where N is the number of prior completions
				self.effects["markerCostIncrease"] = 0.75;
				self.effects["zigguratIvoryPriceRatio"] = 0;
			} else {
				self.effects["bonfireBaseTearsCost"] = 0;
				self.effects["workshopBaseTearsCost"] = 0;
				self.effects["markerCostIncrease"] = 0;
				self.effects["zigguratIvoryPriceRatio"] = -0.025;
			}
		},
		stackOptions: {
			"zigguratIvoryPriceRatio": { LDRLimit: 0.15 },
			"bonfireBaseTearsCost": { noStack: true },
			"markerCostIncrease": { LDRLimit: 9 }
		},
		checkCompletionCondition: function(game) {
			return game.resPool.get("necrocorn").value >= 1;
		},
		actionOnCompletion: function(game) {
			//Block any policies that are useless outside the Unicorn Tears Challenge:
			var ritualCalendar = game.science.getPolicy("ritualCalendar");
			if (!ritualCalendar.researched) {
				ritualCalendar.blocked = true;
			}
			var persistence = game.science.getPolicy("persistence");
			if (!persistence.researched) {
				persistence.blocked = true;
			}
		},
		//A list of buildings in the bonfire tab whose prices we won't add unicorn tears to:
		//Any building that has a truthy value associated with it will be unaffected.
		//For staged buildings, you can specify the stages separately from each other by providing an array.
		dontChangeThesePrices: {
			"field": true,
			"pasture": [/*Pastures don't cost tears*/ true, /*Solar Farms DO cost tears*/ false],
			"hut": true,
			"library": [/*Libraries don't cost tears*/ true, /*Data Centers DO cost tears*/ false],
			"observatory": true, //Because the Challenge is already slow enough without good starchart income
			"barn": true,
			"warehouse": [true, false], //Warehouse doesn't cost tears, Spaceport does
			"smelter": true,
			"calciner": true,
			"oilWell": true,
			"amphitheatre": [true, false], //Amphitheatre doesn't cost tears, Broadcast Tower does
			"workshop": true, //Because we want players to actually have fun
			"unicornPasture": true,
			"ziggurat": true,
			"goldOre": true, //Technically, these are workshop upgrades; remind me to update the documentation later.
			"coalFurnace": true,
			"printingPress": false //I'll need to change this to true (& possibly some others) to make this compatible with Pacifism
		},
		//A list of buildings in the bonfire tab where the first one costs 0 unicorn tears, but subsequent ones cost more tears.
		isFirstOneFree: {
			"library": true, //Make it so the first Data Center doesn't require tears.
			"mine": true,
			"lumberMill": true,
			"biolab": true,
			"temple": true,
			"tradepost": true
		},
		/**
		 * Decides whether or not to add some unicorn tears to the base price of a building.
		 * @param bldName	String.  The name of a building in the bonfire tab.
		 * @param game		The game object; needed to check for more complex conditions.
		 * @param bldStage	Number (optional).  Compares a specific stage of the building.  Ignored if wrong type.
		 * @return	Boolean value.
		 */
		getShouldBldCostExtraTears: function(bldName, game, bldStage) {
			if (typeof(game) !== "object") {
				throw "Missing parameter \"game\" in getShouldBldCostExtraTears";
			}
			if (bldName === "steamworks") {
				//The reason for this is that there's a circular dependency where if Steamworks cost tears, then...
				//...obtaining tears requires Theology, which costs manuscripts, which are produced by Steamworks...
				//...alternatively, build a Mint to get crafting material, but the Mint tech requires already having manuscripts.
				return !game.challenges.isActive("pacifism"); //Avoid circular dependency
			}
			var rawVal = this.dontChangeThesePrices[bldName];
			if (typeof(rawVal) == "boolean") {
				return !rawVal;
			}
			if (rawVal instanceof Array && typeof(bldStage) == "number") {
				return !rawVal[bldStage];
			}
			//Else, rawVal is not defined, so default to making the building cost tears.
			return true;
		},
		/**
		 * For some buildings, they DO cost unicorn tears, but only if you've already built 1 of that building.
		 * So the first one won't have its price changed.
		 * @param bldName	String.  The name of a building in the bonfire tab.
		 * @param game		The game object; not used for anything right now but included just in case a future dev wants this.
		 * @param bldStage	Number (optional).  Currently not supported yet.
		 * @return	Boolean value.
		 */
		getIsFirstBldExempt: function(bldName, game, bldStage) {
			if (typeof(game) !== "object") {
				throw "Missing parameter \"game\" in getIsFirstBldExempt";
			}
			return this.isFirstOneFree[bldName];
		}
	}, {
		name: "postApocalypse",
		label: $I("challendge.postApocalypse.label"),
		description: $I("challendge.postApocalypse.desc"),
		effectDesc: $I("challendge.postApocalypse.effect.desc"),
		researched: false,
		unlocked: false,
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

	effectsBase: {
		"unicornsMax": 0, //Used by the Unicorn Tears Challenge
		"tearsMax": 0,
		"zigguratTearsMax": 0
	},

	game: null,

	resetState: function(){
		for (var i = 0; i < this.challenges.length; i++){
			var challenge = this.challenges[i];
			challenge.enabled = false;
			challenge.pending = false;
			challenge.active = false;
			this.resetStateStackable(challenge);
		}
		this.currentChallenge = null;
		this.reserves.resetState();
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
		// energy
		if (this.getChallenge("energy").unlocked == false) {
			if (this.game.resPool.energyProd != 0 || this.game.resPool.energyCons != 0) {
				this.getChallenge("energy").unlocked = true;
			}
		} 

		//Iron Will has special rules.  Just make the UI more obvious when the game is in IW mode:
		this.getChallenge("ironWill").active = this.game.ironWill;

		//checkCompletionCondition for functions tested for completion here
		for(var i = 0; i < this.challenges.length; i++){
			if(this.challenges[i].active && this.challenges[i].checkCompletionCondition && this.challenges[i].checkCompletionCondition(this.game)){
				this.researchChallenge(this.challenges[i].name);
			}
		}
		
		//Hack for the Unicorn Tears Challenge.
		var effectsBase = this.effectsBase;
		if (this.isActive("unicornTears")) {
			effectsBase["unicornsMax"] = 10;
			effectsBase["tearsMax"] = 1;

			//Don't call game.upgrade every tick--only call it when we actually need to apply a change.
			if (effectsBase["zigguratTearsMax"] != 2) {
				effectsBase["zigguratTearsMax"] = 2;
				this.game.upgrade({buildings: ["ziggurat"]});
			}
		} else {
			effectsBase["unicornsMax"] = 0;
			effectsBase["tearsMax"] = 0;

			//Don't call game.upgrade every tick--only call it when we actually need to apply a change.
			if (effectsBase["zigguratTearsMax"] != 0) {
				effectsBase["zigguratTearsMax"] = 0;
				this.game.upgrade({buildings: ["ziggurat"]});
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

	//TODO: rewrite using the general getEffect logic

	/*getChallengeEffect: function(name, type) {
		var challenge = this.getChallenge(name);
		if (name == "energy") {
			return 2 + 0.1 * challenge.val;
		}
	},*/

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
		if (this.game.bld.get("chronosphere").val > 0) {
			var msgChronosphere = model.metadata.name == "ironWill" ? $I("challendge.btn.chronosphere.with.ironWill.desc") : $I("challendge.btn.chronosphere.desc");
		} else {
			var msgChronosphere = "";
		}
		return this.inherited(arguments) + $I("challendge.btn.desc", [model.metadata.effectDesc, msgChronosphere]) ;
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

	updateVisible: function(model){
		model.visible = model.metadata.unlocked;
	},

	getPrices: function(model) {
		return $.extend(true, [], model.metadata.prices); // Create a new array to keep original values
	},

	buyItem: function(model, event, callback) {
		this.togglePending(model);
		callback(true /*itemBought*/, {reason: "item-is-free" /*We just toggled the pending state; simple, really*/});
	},

	togglePending: function(model){
		if (model.metadata.name == "ironWill") {
			this.game.challenges.applyPending(true	/*isIronWillPending*/);
			return;
		}
		model.metadata.pending = !model.metadata.pending;
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if (model.metadata.researched){
			model.enabled = false;
		}
	}
});

dojo.declare("classes.ui.ChallengePanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,

	constructor: function(){
	},

    render: function(container){
		var content = this.inherited(arguments);
		var self = this;
		var controller = new classes.ui.ChallengeBtnController(self.game);
		dojo.forEach(this.game.challenges.challenges, function(challenge, i){
			var button = new com.nuclearunicorn.game.ui.BuildingBtn({id: challenge.name, controller: controller}, self.game);
			button.render(content);
			self.addChild(button);
		});

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
					model.visible = false;
					for (var i = 0; i < this.game.challenges.challenges.length; i++){
						if (this.game.challenges.challenges[i].pending){
							model.visible = true;
						}
					}
				}, 
				getName: function(){
					var numPending = 0;
					for (var i = 0; i < this.game.challenges.challenges.length; i++){
						if (this.game.challenges.challenges[i].pending){
							numPending++;
						}
					}
					return $I("challendge.applyPending.label", [numPending]);
				}
			})
		}, this.game);
		applyPendingBtn.render(container);
		this.applyPendingBtn = applyPendingBtn;


		var reclaimReservesBtn = new com.nuclearunicorn.game.ui.ButtonModern({
			name: $I("challendge.reclaimReserves.label"),
			description: $I("challendge.reclaimReserves.desc"),
			handler: dojo.hitch(this, function(){
				this.game.challenges.reserves.addReserves();
			}),
			controller: new com.nuclearunicorn.game.ui.ButtonController(this.game, {
				updateVisible: function (model) {
					model.visible = (!this.game.challenges.anyChallengeActive() && !this.game.ironWill &&
					this.game.challenges.reserves.reservesExist());
				},
			})
		}, this.game);
		reclaimReservesBtn.render(container);
		this.reclaimReservesBtn = reclaimReservesBtn;

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
		this.showChallengeEffectsBtn.update();
		for (var i = 0; i < this.challengeEffects.length; i += 1) {
			this.challengeEffects[i].update();
		}
	}
});
