dojo.declare("classes.managers.ChallengesManager", com.nuclearunicorn.core.TabManager, {

	constructor: function(game){
		this.game = game;
		this.registerMeta("research", this.challenges, null);
		this.setEffectsCachedExisting();
	},

    challenges:[
    {
		name: "ironWill",
		label: $I("challendge.ironWill.label"),
		description: $I("challendge.ironWill.desc"),
		effectDesc: $I("challendge.ironWill.effect.desc"),
		difficulty: 100,
        researched: 0,
        unlocked: true
	},{
		name: "winterIsComing",
		label: $I("challendge.winterIsComing.label"),
		description: $I("challendge.winterIsComing.desc"),
		effectDesc: $I("challendge.winterIsComing.effect.desc"),
		repeatEffectDesc: $I("challendge.winterIsComing.repeatEffect.desc"),
		res: "void",
		resAmt: 1000,
		difficulty: 1,
		researched: 0,
		unlocked: true
	},{
		name: "anarchy",
		label: $I("challendge.anarchy.label"),
		description: $I("challendge.anarchy.desc"),
		effectDesc: $I("challendge.anarchy.effect.desc"),
		repeatEffectDesc: $I("challendge.anarchy.repeatEffect.desc"),
		res: "relic",
		resAmt: 10000,
		difficulty: 5,
		researched: 0,
		unlocked: true
	},{
		name: "energy",
		label: $I("challendge.energy.label"),
		description: $I("challendge.energy.desc"),
		effectDesc: $I("challendge.energy.effect.desc"),
		repeatEffectDesc: $I("challendge.energy.repeatEffect.desc"),
		res: "antimatter",
		resAmt: 5000,
		difficulty: 10,
        researched: 0,
		unlocked: false,
		upgrades: {
			buildings: ["library", "biolab", "calciner", "oilWell", "factory", "accelerator", "chronosphere", "aiCore"],
			spaceBuilding: ["sattelite", "spaceStation", "moonOutpost", "moonBase", "orbitalArray", "containmentChamber"],
			voidSpace: ["chronocontrol"]
		}
	},{
		name: "atheism",
		label: $I("challendge.atheism.label"),
		description: $I("challendge.atheism.desc"),
		effectDesc: $I("challendge.atheism.effect.desc"),
		repeatEffectDesc: $I("challendge.atheism.repeatEffect.desc"),
		res: "faith",
		resAmt: 1000000,
		difficulty: 15,
        researched: 0,
        unlocked: false,
		upgrades: {
			buildings: ["chapel", "temple"]
		}
	},{
		name: "1000Years",
		label: $I("challendge.1000Years.label"),
		description: $I("challendge.1000Years.desc"),
		effectDesc: $I("challendge.1000Years.effect.desc"),
		repeatEffectDesc: $I("challendge.1000Years.repeatEffect.desc"),
		res: "timeCrystal",
		resAmt: 20000,
		difficulty: 3,
        researched: 0,
        unlocked: false
	}],

	conditions:[
	{
		name: "disableChrono",
		label: $I("challendge.condition.disableChrono.label"),
		description: $I("challendge.condition.disableChrono.desc"),
	},{
		name: "disableParagon",
		label: $I("challendge.condition.disableParagon.label"),
		description: $I("challendge.condition.disableParagon.desc"),
		bonus: 5
	},{
		name: "disableMetaphysics",
		label: $I("challendge.condition.disableMetaphysics.label"),
		description: $I("challendge.condition.disableMetaphysics.desc"),
		bonus: 10
	},{
		name: "disableApo",
		label: $I("challendge.condition.disableApo.label"),
		description: $I("challendge.condition.disableApo.desc"),
		bonus: 20
	},{
		name: "disableRewards",
		label: $I("challendge.condition.disableRewards.label"),
		description: $I("challendge.condition.disableRewards.desc"),
		bonus: 3
	},{
		name: "disableMisc",
		label: $I("challendge.condition.disableMisc.label"),
		description: $I("challendge.condition.disableMisc.desc"),
		bonus: 1
 	}],

	game: null,
	rewardable: false,
	rewarded: false,

	resetState: function(){
		for (var i = 0; i < this.challenges.length; i++){
			var challenge = this.challenges[i];
			challenge.enabled = false;
			challenge.on = false;
			challenge.pending = false;
			challenge.rewardable = false;
			challenge.rewarded = false;
		}

		for (var i = 0; i < this.conditions.length; i++){
			var condition = this.conditions[i];
			condition.on = 0;
			condition.pending = false;
			condition.rewardable = false;
			condition.resets = 0;
		}

		this.rewardable = false;
		this.rewarded = false;
	},

	save: function(saveData){
		saveData.challenges = {
			challenges: this.filterMetadata(this.challenges, ["name", "researched", "unlocked", "on", "pending", "rewardable", "rewarded"]),
			conditions: this.filterMetadata(this.conditions, ["name", "on", "pending", "rewardable", "resets"]),
			rewardable: this.rewardable,
			rewarded: this.rewarded
		};
	},

	load: function(saveData){
		if (!saveData.challenges){
			return;
		}

		this.loadMetadata(this.challenges, saveData.challenges.challenges);
		if (saveData.challenges.conditions){
			this.loadMetadata(this.conditions, saveData.challenges.conditions);
		}
		if (saveData.challenges.rewardable) {
			this.rewardable = saveData.challenges.rewardable;
		}
		if (saveData.challenges.rewarded) {
			this.rewarded = saveData.challenges.rewarded;
		}
	},

	update: function(){
		if (this.game.ironWill && this.game.bld.get("library").on > 0) {
			this.getChallenge("ironWill").on = true;
			this.getChallenge("ironWill").rewardable = true;
		} else if (!this.game.ironWill) {
			this.getChallenge("ironWill").on = false;
			this.getChallenge("ironWill").rewardable = false;
		}

		// energy
		if (this.getChallenge("energy").unlocked == false) {
			if (this.game.resPool.energyProd != 0 || this.game.resPool.energyCons != 0) {
				this.getChallenge("energy").unlocked = true;
			}
		} else if (this.getChallenge("energy").on) {
			if (
				(this.game.bld.get("pasture").val > 0 && this.game.bld.get("pasture").stage == 1) &&
				(this.game.bld.get("aqueduct").val > 0 && this.game.bld.get("aqueduct").stage == 1) &&
				this.game.bld.get("steamworks").val > 0 &&
				this.game.bld.get("magneto").val > 0 &&
				this.game.bld.get("reactor").val > 0 &&
				(this.game.space.getBuilding("sattelite").val > 0 && this.game.workshop.get("solarSatellites").researched) &&
				this.game.space.getBuilding("sunlifter").val > 0 &&
				this.game.space.getBuilding("tectonic").val > 0 &&
				this.game.space.getBuilding("hrHarvester").val > 0
			) {
				this.researchChallenge("energy");
			}
		}
		if (this.getChallenge("anarchy").on) {
			if (this.game.bld.get("aiCore").val > 0){
				this.researchChallenge("anarchy");
			}
		}

		// winterIsComing
		if (this.getChallenge("winterIsComing").on) {
			if (this.game.space.getPlanet("helios").reached){
				this.researchChallenge("winterIsComing");
			}
		}

		if (this.getChallenge("atheism").on) {
			if (this.game.time.getVSU("cryochambers").on > 0){
				this.researchChallenge("atheism");

				if (this.game.ironWill){
					this.game.achievements.unlockHat("ivoryTowerHat");
				}
			}
		}

		var noChallenge = true;
		for (var i = 0; i < this.challenges.length; i++) {
			if (this.challenges[i].on && this.challenges[i].name != "ironWill") {
				noChallenge = false;
			}
		}

		if (noChallenge && this.game.space.getPlanet("moon").unlocked) {
			this.researchChallenge();
		}


	},

	getChallenge: function(name){
		return this.getMeta(name, this.challenges);
	},

	getCondition: function(name){
		return this.getMeta(name, this.conditions);
	},

	researchChallenge: function(name) {
		var apotheosis = 0;
		var res;
		var resAmt = 0;
		var challenge;
		if (name) {
			var challenge = this.getChallenge(name);
			if (challenge.rewardable && !challenge.rewarded) {
				var res = this.game.resPool.get(challenge.res);
				var resAmt = (challenge.resAmt * Math.pow(2, Math.sqrt(challenge.researched)));

				var challengeTotal = 0;
				var challengeNumber = 0;
				for (var i = 0; i < this.challenges.length; i++) {
					if (this.challenges[i].rewardable) {
						challengeTotal += Math.pow(this.challenges[i].difficulty, 2);
						if (this.challenges[i].name != "ironWill")
							challengeNumber++;
					}
				}

				apotheosis += Math.sqrt(challengeTotal) / challengeNumber;
			}
		}
		else if (this.rewardable && !this.rewarded) {
			if (this.getChallenge("ironWill").rewardable && !this.getChallenge("ironWill").rewarded) {
				apotheosis = 100;
				this.getChallenge("ironWill").rewarded = true;
			}
			else {
				apotheosis = 1;
			}
			this.rewarded = true;
		}

		if (!apotheosis) {
			return;
		}

		var conditionTotal = 0;
		for (var i = 0; i < this.conditions.length; i++) {
			if (this.conditions[i].on && this.conditions[i].bonus) {
				conditionTotal += Math.pow(this.conditions[i].bonus * (1 - this.game.getHyperbolicEffect(this.conditions[i].resets / 10, 1)), 2);
			}
		}

		if (conditionTotal != 0) {
			resAmt *= Math.sqrt(conditionTotal);
			apotheosis *= Math.sqrt(conditionTotal);
		}

		if (res) {
			if (res.maxValue && res.value + resAmt > res.maxValue) {
				res.reserve = res.value + resAmt - res.maxValue;
				res.value = res.maxValue;
			} else {
				res.value += resAmt;
			}
		}

		this.game.resPool.addRes(this.game.resPool.get("apotheosis"), Math.floor(apotheosis), true);

		if (challenge) {
			challenge.researched++;
			challenge.rewarded = true;
			this.game.msg($I("challendge.btn.log.message.on.complete", [challenge.label, resAmt, res.title, Math.floor(apotheosis)]));
		} else {
			this.game.msg($I("challendge.btn.log.message.on.complete.noChallenge", [apotheosis]));
		}

		this.game.calculateAllEffects();
	},

	getChallengeResearched: function(name, alwaysUse) {
		var challenge = this.getChallenge(name);
		return (challenge.researched && ((!challenge.on && !this.getCondition("disableRewards").on) || alwaysUse));
	},

	getChallengeEffect: function(name, type) {
		var challenge = this.getChallenge(name)

		if (name == "winterIsComing") {
			if (type == "frequency") {
				return this.game.getHyperbolicEffect(challenge.researched * 50, 825);
			} else {
				return 1 - this.game.getHyperbolicEffect(challenge.researched * 0.1, 1);
			}
		} else if (name == "anarchy") {
			return 0.5 - this.game.getHyperbolicEffect(challenge.researched * 0.05, 0.4);
		} else if (name == "energy") {
			return 2 + 0.1 * challenge.researched;
		} else if (name == "atheism") {
			return 1 - this.game.getHyperbolicEffect(challenge.researched * 0.1, 1);
		} else if (name == "1000Years") {
			return 1 + 0.5 * challenge.researched;
		}
	},

	getChallengeReward: function(name) {
		var challenge = this.getChallenge(name);

		if (challenge.on || this.getCondition("disableRewards").on) {
			return 1;
		}

		if (name == "winterIsComing") {
			var amt = 0.2;
			var limit = 2;
		} else if (name == "anarchy") {
			var amt = 0.5;
			var limit = 4;
		} else if (name == "energy") {
			var amt = -0.1;
			var limit = 1;
		} else if (name == "atheism") {
			var amt = 0.25;
			var limit = 4;
		} else if (name == "1000Years") {
			var amt = -0.1;
			var limit = 1;
		}

		return 1 + this.game.getHyperbolicEffect(challenge.researched * amt, limit);
	},

	getEnergyMod: function() {
		return (game.challenges.getChallenge("energy").on ? this.getChallengeEffect("energy") : 1) * this.getChallengeReward("energy");
	},

	handleChallengeToggle: function(name, on) {
		if (!on) {
			this.getChallenge(name).rewardable = false;
		}

		if (name == "anarchy") {
			if (this.game.village.getFreeKittens() < 0 ){
				this.game.village.clearJobs(true);	//sorry, just a stupid solution for this problem
			}
			this.game.villageTab.updateTab();
		} else if (name == "atheism") {
			this.game.village.getJob("priest").unlocked = !on;
			if (on) {
				for (var i = 0; i < this.game.village.sim.kittens.length; i++) {
					if (this.game.village.sim.kittens[i].job == "priest") {
						this.game.village.unassignJob(this.game.village.sim.kittens[i]);
					}
				}
				this.game.villageTab.updateTab();
			}
		}
	},

	handleConditionToggle: function(name, on) {
		if (!on) {
			this.getCondition(name).rewardable = false;
			this.getCondition(name).resets = 0;
		}

		if (name == "disableChrono" && !on) {
			this.game.ironWill = false;

			for (var i = 0; i < this.challenges.length; i++) {
				this.challenges[i].rewardable = false;
			}

			this.rewardable = false;

                        var uncappedRes = ["starchart", "relic", "void", "blackcoin", "bloodstone"];
                        for (var i = 0; i < this.game.resPool.resources.length; i++) {
                          var res = this.game.resPool.resources[i];

                          if (res.craftable || uncappedRes.indexOf(res.name) >= 0) {
                            res.value += res.reserve;
                            res.reserve = 0;
                          }
                        }

			if (this.game.prestige.getPerk("anachronomancy").researched) {
				var chronophysics = this.game.science.get("chronophysics");
				chronophysics.researched = true;
				this.game.unlock(chronophysics.unlocks);

				var timeCrystal = this.game.resPool.get("timeCrystal");
				timeCrystal.value += timeCrystal.reserve;
				timeCrystal.reserve = 0;
			}

			this.game.time.getVSU("usedCryochambers").val = this.game.village.sim.reserve.length;
			this.game.time.getVSU("usedCryochambers").on = this.game.village.sim.reserve.length;
			for (var i = 0; i < this.game.village.sim.reserve.length; i++) {
				this.game.village.sim.kittens.push(this.game.village.sim.reserve[i]);
			}

			this.game.village.sim.reserve = [];
		}

		if (name == "disableParagon") {
			if (on) {
				var metaRes = ["karma", "paragon", "burnedParagon", "apotheosis"];
				for (var i = 0; i < metaRes.length; i++) {
					var res = this.game.resPool.get(metaRes[i]);

					if (res.name == "karma") {
						this.game.karmaKittensReserve = this.game.karmaKittens;
						this.game.karmaKittens = 0;
						res.value = 0;
					} else {
						res.reserve = res.value;
						res.value = 0;
					}
				}
				
				if (this.getCondition("disableMetaphysics").on) {
					for (var i = 0; i < this.game.prestige.perks.length; i++) {
						var perk = this.game.prestige.perks[i];

						if (perk.defaultUnlocked) {
							perk.unlocked = true;
						}
					}
				}
			} else {
				var metaRes = ["karma", "paragon", "burnedParagon", "apotheosis"];
				for (var i = 0; i < metaRes.length; i++) {
					var res = this.game.resPool.get(metaRes[i]);

					if (res.name == "karma") {
						this.game.karmaKittens += this.game.karmaKittensReserve;
						this.game.karmaKittensReserve = 0;
						res.value = this.game.getTriValue(this.game.karmaKittens, 5);
					} else {
						res.value += res.reserve;
						res.reserve = 0;
					}
				}

				if (this.getCondition("disableMetaphysics").on) {
					for (var i = 0; i < this.game.prestige.perks.length; i++) {
						var perk = this.game.prestige.perks[i];

						if (!perk.researched) {
							perk.unlocked = false;
						}
					}
				}
			}
		}

		if (name == "disableMetaphysics") {
			if (on) {
				for (var i = 0; i < this.game.prestige.perks.length; i++) {
					var perk = this.game.prestige.perks[i];
					perk.reserve = perk.researched;
					perk.researched = false;
					perk.unlocked = this.getCondition("disableParagon").on && perk.defaultUnlocked;
				}
			} else {
				for (var i = 0; i < this.game.prestige.perks.length; i++) {
					var perk = this.game.prestige.perks[i];

					if (perk.reserve) {
						if (perk.researched) {
							for (var j = 0; j < perk.prices.length; j++) {
								this.game.resPool.addResEvent(perk.prices[j].name, perk.prices[j].val);
							}
						} else {
							perk.unlocked = true;
							perk.researched = true;
							this.game.unlock(perk.unlocks);
							perk.reserve = false;
						}
					}
				}
			}
		}

		if (name == "disableApo") {
			if (on) {
				this.game.religion.faithRatioReserve = this.game.religion.faithRatio;
				this.game.religion.faithRatio = 0;
				this.game.religion.tcratioReserve = this.game.religion.tcratio;
				this.game.religion.tcratio = 0;
				this.game.religion.tclevel = 0;

				for (var i = 0; i < this.game.religion.transcendenceUpgrades.length; i++) {
					this.game.religion.transcendenceUpgrades[i].reserve = this.game.religion.transcendenceUpgrades[i].val;
					this.game.religion.transcendenceUpgrades[i].val = 0;
					this.game.religion.transcendenceUpgrades[i].on = 0;
				}
			} else {
				this.game.religion.faithRatio += this.game.religion.faithRatioReserve;
				this.game.religion.faithRatioReserve = 0;
				this.game.religion.tcratio += this.game.religion.tcratioReserve;
				this.game.religion.tcratioReserve = 0;
				this.game.religion.tclevel = this.game.religion.getTranscendenceLevel();

				for (var i = 0; i < this.game.religion.transcendenceUpgrades.length; i++) {
					var tu = this.game.religion.transcendenceUpgrades[i];

					var amt = Math.floor(Math.log(Math.pow(tu.priceRatio, tu.val) + Math.pow(tu.priceRatio, tu.reserve) - 1) / Math.log(tu.priceRatio));
					this.game.religion.transcendenceUpgrades[i].val = amt;
					this.game.religion.transcendenceUpgrades[i].on = amt;
					this.game.religion.transcendenceUpgrades[i].reserve = 0;
				}
			}
		}

		if (name == "disableMisc") {
			if (on) {
				this.game.karmaZebrasReserve = this.game.karmaZebras;
				this.game.karmaZebras = 0;
				this.game.resPool.get("zebras").maxValue = 0;

				var miscRes = ["zebras", "sorrow", "elderBox", "wrappingPaper", "temporalFlux"];
				for (var i = 0; i < miscRes.length; i++) {
					var res = this.game.resPool.get(miscRes[i]);
					res.reserve = res.value;
					res.value = 0;
				}
			} else {
				this.game.karmaZebras += this.game.karmaZebrasReserve;
				this.game.karmaZebrasReserve = 0;
				this.game.resPool.get("zebras").maxValue = this.game.karmaZebras ? this.game.karmaZebras + 1 : 0;

				var miscRes = ["zebras", "sorrow", "elderBox", "wrappingPaper", "temporalFlux"];
				for (var i = 0; i < miscRes.length; i++) {
					var res = this.game.resPool.get(miscRes[i]);
					res.value += res.reserve;
					res.reserve = 0;

					if (res.maxValue && res.value > res.maxValue) {
						res.value = res.maxValue;
					}
				}
			}
		}
	},

	applyPending: function(){
		for (var i = 0; i < this.challenges.length; i++){
			var challenge = this.challenges[i];
			if (challenge.pending){
				challenge.on = true;
				challenge.pending = false;
				this.game.upgrade(challenge.upgrades);
				this.handleChallengeToggle(challenge.name, true);
			}
 		}

		for (var i = 0; i < this.conditions.length; i++){
			var condition = this.conditions[i];
			if (condition.pending){
				condition.on = true;
				condition.pending = false;
				this.handleConditionToggle(condition.name, true);
			}
 		}
	}
});

dojo.declare("classes.ui.ChallengeBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.challenges.getChallenge(model.options.id);
            model.metaCached.togglableOnOff = true;
            model.metaCached.val = 1; //hack
        }
        return model.metaCached;
    },

    getDescription: function(model) {
		var challenge = model.metadata;

		if (challenge.name == "ironWill") {
			var msg = $I("challendge.btn.ironWill.desc", [challenge.effectDesc, challenge.difficulty]);
		} else {
			var msg = $I("challendge.btn.desc", [challenge.effectDesc, challenge.repeatEffectDesc, this.game.resPool.get(challenge.res).title, challenge.resAmt, challenge.difficulty]);
		}

		return this.inherited(arguments) + msg;
	},

	getName: function(model){

		var meta = model.metadata;
		var name = meta.label;
		if (meta.researched){
			name += " (" + meta.researched + ")";
		}
		if (meta.pending){
			name += " (" + $I("challendge.pending") + ")";
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
		this.handleTogglableOnOffClick(model);
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if (model.metadata.name == "ironWill"){
			model.enabled = false;
		}
	},

	handleTogglableOnOffClick: function(model){
		if (model.metadata.name == "ironWill") {
			return;
		}

		if (model.metadata.on) {
			model.metadata.on = false;
			this.game.upgrade(model.metadata.upgrades);
			this.game.challenges.handleChallengeToggle(model.metadata.name, false);
		} else {
			model.metadata.pending = !model.metadata.pending;
		}
	}
});

dojo.declare("classes.ui.ConditionBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.challenges.getCondition(model.options.id);
            model.metaCached.togglableOnOff = true;
            model.metaCached.val = 1; //hack
        }
        return model.metaCached;
    },

    getDescription: function(model) {
		var condition = model.metadata;

		if (condition.name == "disableChrono") {
			return this.inherited(arguments);
		} else {
			return this.inherited(arguments) +  $I("challendge.condition.btn.desc", [condition.bonus]);
		}
	},

	getName: function(model){

		var meta = model.metadata;
		var name = meta.label;
		if (meta.pending){
			name += " (" + $I("challendge.pending") + ")";
		}

		return name;
	},

	updateVisible: function(model){
		model.visible = true;
	},

	getPrices: function(model) {
		return $.extend(true, [], model.metadata.prices); // Create a new array to keep original values
	},

	buyItem: function(model, event, callback) {
		this.handleTogglableOnOffClick(model);
	},

	handleTogglableOnOffClick: function(model){
		if (model.metadata.on) {
			model.metadata.on = false;
			this.game.challenges.handleConditionToggle(model.metadata.name, false);
		} else {
			model.metadata.pending = !model.metadata.pending;
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

dojo.declare("classes.ui.ConditionPanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,

	constructor: function(){
	},

    render: function(container){
		var content = this.inherited(arguments);
		var self = this;
		var controller = new classes.ui.ConditionBtnController(self.game);
		dojo.forEach(this.game.challenges.conditions, function(condition, i){
			var button = new com.nuclearunicorn.game.ui.BuildingBtn({id: condition.name, controller: controller}, self.game);
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

		this.conditionsPanel = new classes.ui.ConditionPanel($I("challendge.condition.panel.label"), this.game.challenges);
		this.conditionsPanel.game = this.game;
		this.conditionsPanel.render(container);

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
					for (var i = 0; i < this.game.challenges.conditions.length; i++){
						if (this.game.challenges.conditions[i].pending){
							model.visible = true;
						}
					}
				}
			})
		}, this.game);
		applyPendingBtn.render(container);
		this.applyPendingBtn = applyPendingBtn;
	},

	update: function(){
		this.challengesPanel.update();
		this.conditionsPanel.update();
		this.applyPendingBtn.update();

	}
});
