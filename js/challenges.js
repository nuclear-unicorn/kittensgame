dojo.declare("classes.managers.ChallengesManager", com.nuclearunicorn.core.TabManager, {

	constructor: function(game){
		this.game = game;
		this.registerMeta("stackable", this.challenges, null);
		this.setEffectsCachedExisting();
		this.reserves = new classes.reserveMan(game);
	},

	currentChallenge: null,

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
        calculateEffects: function(self, game){
            if (self.active) {
            	self.effects["masterSkillMultiplier"] = 0;
            	self.effects["kittenLaziness"] = 0.05;
            }else{
				self.effects["masterSkillMultiplier"] = 0.2;
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
		upgrades: {
			buildings: ["library", "biolab", "calciner", "oilWell", "factory", "accelerator", "chronosphere", "aiCore"],
			spaceBuilding: ["sattelite", "spaceStation", "moonOutpost", "moonBase", "orbitalArray", "containmentChamber"],
			voidSpace: ["chronocontrol"]
		},
		effects: {
			"energyConsumptionRatio": -0.02,
			"energyConsumptionIncrease": 0
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
			"temporalPressCap" : 0
        },
        calculateEffects: function(self, game){
            if (self.active) {
        	    self.effects["shatterCostReduction"] = 0;
                self.effects["shatterCostIncreaseChallenge"] = 0.5;
                self.effects["shatterVoidCost"] = 0.4;
                self.effects["temporalPressCap"] = 0;
             }else{
				self.effects["shatterCostReduction"] = -0.02;
				self.effects["shatterCostIncreaseChallenge"] = 0;
				self.effects["shatterVoidCost"] = 0;
				self.effects["temporalPressCap"] = 5;
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
            "corruptionBoostRatioChallenge": 0.1
        },
        calculateEffects: function(self, game){
            if (self.active) {
                self.effects["corruptionBoostRatioChallenge"] = 0;
            }else{
				self.effects["corruptionBoostRatioChallenge"] = 0.1;
			}
        },
		checkCompletionCondition: function(game){
			return game.space.getBuilding("spaceBeacon").val > (game.challenges.getChallenge("blackSky").on || 0) ;
		}
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
			"steamworksFakeBought": 0
        },
        calculateEffects: function(self, game){
            if (self.active) {
                self.effects["alicornPerTickRatio"] = 0;
                self.effects["tradeKnowledge"] = 0;
				self.effects["weaponEfficency"] = -0.1; //after 10 completions weapons WILL be useles; no LDR >:3
                self.effects["policyFakeBought"] = 1;
				self.effects["embassyFakeBought"] = 1;
				self.effects["steamworksFakeBought"] = Math.floor(1.5 * self.on || 1)/ (self.on || 1);
            }else{
				self.effects["alicornPerTickRatio"] = 0.1;
				self.effects["tradeKnowledge"] = 1;
                self.effects["weaponEfficency"] = 0;
                self.effects["policyFakeBought"] = 0;
				self.effects["embassyFakeBought"] = 0;
				self.effects["steamworksFakeBought"] = 0;
			}
			game.upgrade(self.upgrades); //this is a hack, might need to think of a better sollution later
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
	},{
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
		}
	},

	update: function(){
		// energy
		if (this.getChallenge("energy").unlocked == false) {
			if (this.game.resPool.energyProd != 0 || this.game.resPool.energyCons != 0) {
				this.getChallenge("energy").unlocked = true;
			}
		} 
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
	},
	resetState: function(){
		this.reserveResources = {};
		this.reserveKittens = [];
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
				reserveResources[res.name] = Math.max(reserveResources[res.name] || 0, value);
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
				this.game.resPool.get(i).value += this.reserveResources[i];
			}else{
				this.game.resPool.get(i).value = Math.max(this.game.resPool.get(i).value, this.reserveResources[i]);
			}
			delete this.reserveResources[i];
		}

		for(var i in this.reserveKittens){
			this.game.village.sim.kittens.push(this.reserveKittens[i]);
		}
		this.game.time.getVSU("usedCryochambers").val += this.reserveKittens.length;
		this.game.time.getVSU("usedCryochambers").on += this.reserveKittens.length;
		this.reserveKittens = [];
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
			ironWillClaim: this.ironWillClaim
		};
	},
	reservesExist: function(){
		return (Object.keys(this.reserveResources).length || this.reserveKittens.length);
	}
});
dojo.declare("classes.ui.ChallengeBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {

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
		/*if (model.metadata.name == this.game.challenges.currentChallenge
		 || (!model.enabled && !this.game.devMode)) {
			callback(false);
			return;
		}

		var game = this.game;
		game.ui.confirm($I("challendge.btn.confirmation.title"), $I("challendge.btn.confirmation.msg"), function() {
			// Set the challenge for after reset
			game.challenges.currentChallenge = model.metadata.name == "ironWill"
				? null
				: model.metadata.name;
			// Reset with any benefit of chronosphere (resources, kittens, etc...)
			game.bld.get("chronosphere").val = 0;
			game.bld.get("chronosphere").on = 0;
			game.time.getVSU("cryochambers").val = 0;
			game.time.getVSU("cryochambers").on = 0;
			game.resetAutomatic();
			callback(true);
		}, function() {
			callback(false);
		});*/

		this.togglePending(model);
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
	},

	update: function(){
		this.challengesPanel.update();
		//this.conditionsPanel.update();
		this.applyPendingBtn.update();
	}
});
