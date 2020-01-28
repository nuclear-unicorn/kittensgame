/**
 * Metadata wrapper, move to the core?
 **/
dojo.declare("classes.Metadata", null, {
	meta: null,

    constructor: function(meta){
        if (!meta){
            throw "Building metadata must be provided for classes.Building instance";
        }
        this.meta = meta;
    },

    getMeta: function(){
		return this.meta;
	},

	get: function (attr) {
		return this.meta[attr];
	},

	set: function(attr, val){
        this.meta[attr] = val;
    }
});

/**
 * On a second thought, using meta wrappers/adapters does not seems like a such good idea.
 * We probably should have an model class governed by a metadata, not an adapter
 */
dojo.declare("classes.BuildingMeta", classes.Metadata, {
	_metaCache: null,
	_metaCacheStage: null,

	// We need to avoid to use the function since it is slow, use get method intead which should be faster
    getMeta: function(){
    	var bld = this.meta;
    	if (bld.stage !== this._metaCacheStage) {
    		this._metaCache = null; // invalidate cache if the stage has changed
    	}
    	if (this._metaCache) {
    		return this._metaCache;
    	}

        if (bld.stages){
			//some specific hack for stagable buildings
			if (bld.stage >= bld.stages.length){
				bld.stage = bld.stages.length-1;
			}
			var currentStage = bld.stages[bld.stage || 0];

			var copy = {};
			for (var attr in bld) {
				// if (currentStage.hasOwnProperty(attr)) {
				// 	copy[attr] = currentStage[attr];
				// }
		        if (bld.hasOwnProperty(attr)){
		        	copy[attr] = bld[attr];
		        }
		    }

		    for (attr in currentStage) {
				if (currentStage.hasOwnProperty(attr)) {
					copy[attr] = currentStage[attr];
				}
		    }

			this._metaCache = copy;
        	this._metaCacheStage = bld.stage;
        } else {
        	this._metaCache = bld;
        	this._metaCacheStage = bld.stage;
        }
        return this._metaCache;
    },

    /**
	* Strongly encourage to use this function for faster access
    */
    get: function (attr) {
    	var bld = this.meta;
    	if (bld.stage !== this._metaCacheStage) {
    		this._metaCache = null; // invalidate cache if the stage has changed
    	}
    	if (this._metaCache) {
    		return this._metaCache[attr];
    	}

    	if (bld.stages){
			//some specific hack for stagable buildings
			if (bld.stage >= bld.stages.length){
				bld.stage = bld.stages.length-1;
			}
			var currentStage = bld.stages[bld.stage || 0];
			if (!currentStage.hasOwnProperty(attr)) {
				return bld[attr];
			} else {
				return currentStage[attr];
			}
        }
        return bld[attr];
    },

    set: function(attr, value){
		var bld = this.meta;
		if (bld.stages){
			var stage = bld.stages[bld.stage || 0];

			//try to set stage attribute if defined in metadata
			if (stage[attr] != undefined) {
				//throw "Invalid attribute '" + attr + "'";
				stage[attr] = value;
				return;
			}
		}
		this.meta[attr] = value;
		if (this._metaCache) {
			if (attr === "stage") {
				this._metaCache= null;
			} else {
				this._metaCache[attr] = value;
			}
		}
	}
});

dojo.declare("classes.managers.BuildingsManager", com.nuclearunicorn.core.TabManager, {

	game: null,

    metaCache: null,

	groupBuildings: false,
	twoRows: false,

	constructor: function(game){
		this.game = game;
        this.metaCache = {};
        var self = this;
        this.registerMeta(false, this.buildingsData, {
			getEffect: function(bld, effectName){
				var effect = 0;
				//var bldMeta = self.getBuildingExt(bld.name);
				//var effectValue = bldMeta.get("effects")[effectName];
				var effectValue;
				if (bld.stages){
					//some specific hack for stagable buildings
					if (bld.stage >= bld.stages.length){
						bld.stage = bld.stages.length-1;
					}
					var currentStage = bld.stages[bld.stage || 0];
					if (currentStage.effects) {
						effectValue = currentStage.effects[effectName];
					} else {
			        	effectValue = bld.effects[effectName];
			        }
		        } else {
		        	effectValue = bld.effects[effectName];
		        }


				// Need a better way to do this...
				if (effectName == "coalRatioGlobal") {
					effect = effectValue;
				// Max effects and Ratio effects depends on constructed buildings
				} else if (effectName.indexOf("Max", effectName.length - 3) != -1 ||
					(bld.name == "biolab" && effectName.indexOf("Ratio", effectName.length - 5) != -1)){
					effect = effectValue * bld.val;
				} else {
					effect = effectValue * bld.on;
				}

				//probably not the best place to handle this mechanics
				//----------- move to separate part? -----------
				if (effectName == "productionRatio" || effectName == "magnetoRatio"){
					effect *= game.resPool.getEnergyDelta();
				}

				return effect;
			}
		});
        this.setEffectsCachedExisting();
	},

	buildingGroups: [{
		name: "food",
		title: $I("buildings.group.food"),
		buildings: ["field","pasture","aqueduct"]
	},{
		name: "population",
		title: $I("buildings.group.population"),
		buildings: ["hut", "logHouse", "mansion"]
	},{
		name: "science",
		title: $I("buildings.group.science"),
		buildings: ["library", "academy", "observatory", "biolab"]
	},{
		name: "storage",
		title: $I("buildings.group.storage"),
		buildings: ["barn", "warehouse", "harbor"]
	},{
		name: "resource",
		title: $I("buildings.group.resource"),
		buildings: ["mine", "quarry", "lumberMill", "oilWell", "accelerator"]
	},{
		name: "industry",
		title: $I("buildings.group.industry"),
		buildings: ["steamworks", "magneto", "smelter", "calciner", "factory", "reactor" ]
	},
	{
		name: "culture",
		title: $I("buildings.group.culture"),
		buildings: ["amphitheatre", "chapel", "temple"]
	},{
		name: "other",
		title: $I("buildings.group.other"),
		buildings: ["workshop", "tradepost", "mint", "unicornPasture"]
	},{
		name: "megastructures",
		title: $I("buildings.group.megastructures"),
		buildings: ["ziggurat", "chronosphere", "aiCore"]
	},{
		name: "zebraBuildings",
		title: $I("buildings.group.zebraBuildings"),
		buildings: ["zebraOutpost", "zebraWorkshop", "zebraForge"]
	}
	],

	/***
	 ** STACKABLE BUILDINGS'S SPEC **
	 *
	 * For:
	 *
	 * game.bld.buildingsData
	 * game.religion.zigguratUpgrades
	 * game.religion.religionUpgrades
	 * game.religion.transcendenceUpgrades
	 * game.space.programs
	 * for each buildings of game.space.planets
	 * game.time.chronoforgeUpgrades
	 * game.time.voidspaceUpgrades
	 *
	 * Keys:
	 *
	 * OPTIONAL: things can be setted or not
	 * AUTOMATIC: things must be setted by using resetStateStackable()
	 * Every value can be setted by resetState whereas a hard-value.
	 *
	 * Spec:
	 *
	 * name MANDATORY: string identifier for coding
	 * label MANDATORY: string identifier displayed in the game
	 * description OPTIONAL: string displayed in tooltip to precise what is the building
	 * flavor OPTIONAL: string displayed in tooltip to joke
	 *
	 * stages OPTIONAL: object containing at least the setting of two stages. Each stage is a normal building with those differences :
	 * 	• stageUnlocked: which stage is set at the begining (one of stages has stageUnlocked == true, others stageUnlocked == false)
	 * 	• do not set name, calculateEffects neither action : it must be set only in "principal" building
	 * 	• set label, description, prices, priceRatio, flavor and effects (stage's effects must be set in "principal" building too, see effects spec here)
	 * stage MANDATORY if stages: number selecting building's stage
	 *
	 * unlocked MANDATORY: boolean defining if the building is available for the player or not
	 * unlockable MANDATORY: if true, building will be unlocked automatically once resources are available.
	 * defaultUnlockable OPTIONAL: if true, building will always be unlockable.
	 * unlockRatio OPTIONAL: boolean defining percentage of price you must have in stock to unlocked the buiding (see price spec here)
	 * requiredTech OPTIONAL: list of technologies in game.science which must be researched to unlocked the building
	 *
	 * price MANDATORY: list containing lines of prices :
	 *  • line of price is formatted like { name : "resourceName", val: resourceNeed }
	 * priceRatio MANDATORY: number multiplying price val in function of how many buildings you have already built (see val spec here)
	 *
	 * val AUTOMATIC: number defining how many buildings are built
	 * on AUTOMATIC: number defining how many buildings are used
	 *
	 * togglable AUTOMATIC: boolean defining if on can be modifiy between 0 AND val by the player
	 * togglableOnOff AUTOMATIC: boolean defining if on can be modifiy either 0 OR val by the player
	 *
	 * unlocks OPTIONAL: list, at each construction, calls game.unlock() with variables in unlocks to unlock parts of the game
	 * upgrades OPTIONAL: list, at each construction, calls game.upgrade() with variables in upgrades which will calls calculateEffects of some buildings (see calculateEffects spec here)
	 *
	 * effects MANDATORY: object containing static effects of the building AND all effects set in calculateEffects stages with a val of 0 AND all effects set in action with a basic value (to display when there is no building)
	 * calculateEffects OPTIONAL: function called by game.upgrade() to calculated some effects. Effects calculate here can't be calculated in action too. Don't forget to check every possibilities (mandatory "else" if there is an "if" for example).
	 * action OPTIONAL: function called each tick to calculated some effects. Effects calculate here can't be calculated in calculatedEffects too. Don't forget to check every possibilities (mandatory "else" if there is an "if" for example). Do not abuse, may have negative performance impact.
	 *
	 * jammed OPTIONAL: boolean checking the possibility to enable or disable a part of action's code. This variable can't be changed by the player.
	 * isAutomationEnabled OPTIONAL: boolean checking the possibility to enable or disable a part of action's code. This variable can be changed by the player.
	 * lackResConvert MANDATORY if conversion in action: boolean checking if conversions are full or not, it's for UI.
	 *
	 * breakIronWill OPTIONAL: if true, at the first construction, it will break Iron Will mod
	 * noStackable OPTIONAL: if true, button associated will have the behavior of a BuildingResearchBtn whereas of a BuildingStackableBtn (used when a researched behavior is changed during the game into a stackable behavior like religion's upgrades)
	 *
	 */

	buildingsData : [
	//----------------------------------- Food production ----------------------------------------
	{
		name: "field",
		label: $I("buildings.field.label"),
		description: $I("buildings.field.desc"),
		unlockRatio: 0.3,
		defaultUnlockable: true,
		prices: [
			{ name : "catnip", val: 10 }
		],
		priceRatio: 1.12,
		effects: {
			"catnipPerTickBase": 0.125
		},
		flavor : $I("buildings.field.flavor")
	},
	{
		name: "pasture",
		unlockRatio: 0.3,
		stages: [
			{
				label: $I("buildings.pasture.label"),
				description: $I("buildings.pasture.desc"),
				prices: [
					{ name : "catnip", val: 100 },
					{ name : "wood", val: 10 }
				],
				priceRatio: 1.15,
				effects: {
					"catnipDemandRatio": -0.005
				},
				flavor: $I("buildings.pasture.flavor"),
				stageUnlocked : true
			},
			{
				label: $I("buildings.solarfarm.label"),
				description: $I("buildings.solarfarm.desc"),
				prices: [
					{ name : "titanium", val: 250 }
				],
				priceRatio: 1.15,
				effects: {
					"energyProduction": 2
				},
				stageUnlocked : false
			}
		],
		effects: {
			"catnipDemandRatio": 0,
			"energyProduction": 0
		},
		action: function(self, game){
			var stageMeta = self.stages[self.stage];
			if (self.stage == 0){
				//do nothing
			} else if (self.stage == 1){
                var effects = {
                    "energyProduction": 2
                };
                effects["energyProduction"] *= 1 + game.getEffect("solarFarmRatio");
				if (game.challenges.getChallengeResearched("winterIsComing")) {
					effects["energyProduction"] *= 2;
				}

				if (game.calendar.getCurSeason().name == "winter") {
					effects["energyProduction"] *= 0.75;
				} else if (game.calendar.getCurSeason().name == "summer") {
					effects["energyProduction"] /= 0.75;
					effects["energyProduction"] *= game.challenges.getChallengeReward("winterIsComing");
				}

				var seasonRatio = game.getEffect("solarFarmSeasonRatio");
				if ((game.calendar.season == 3 && seasonRatio == 1) || (game.calendar.season != 1 && seasonRatio == 2)){
					effects["energyProduction"] *= (1 + 0.15 * seasonRatio);
				}

                stageMeta.effects = effects;
			}
		}
	},{
		name: "aqueduct",
		unlockRatio: 0.3,
		stages: [
			{
				label: $I("buildings.aqueduct.label"),
				description: $I("buildings.aqueduct.desc"),
				prices: [
					{ name : "minerals", val: 75 }
				],
				priceRatio: 1.12,
				effects: {
					"catnipRatio" : 0.03
				},
				flavor : $I("buildings.aqueduct.flavor"),
				stageUnlocked : true
			},
			{
				label: $I("buildings.hydroplant.label"),
				description: $I("buildings.hydroplant.desc") ,
				prices: [
					{ name : "concrate", val: 100 },
					{ name : "titanium", val: 2500 }
				],
				priceRatio: 1.15,
				effects: {
					"energyProduction" : 5
				},
				stageUnlocked : false
			}
		],
		effects: {
			"catnipRatio": 0,
			"energyProduction": 0
		},
        calculateEffects: function(self, game){
            var stageMeta = self.stages[self.stage];
            if (self.stage == 0){
                //do nothing
            } else if (self.stage == 1){
                var effects = {
                    "energyProduction": 5
                };
                effects["energyProduction"] *= 1 + game.getEffect("hydroPlantRatio");
                stageMeta.effects = effects;
            }
        }
	},
	//----------------------------------- Population ----------------------------------------
	{
		name: "hut",
		label: $I("buildings.hut.label"),
		description: $I("buildings.hut.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "wood", val: 5 }
		],
		priceRatio: 2.5,
		defaultUnlockable: true,
		unlocks: {
			//unlock village tab
			tabs: ["village"]
		},
		effects: {
			"maxKittens": 2,
			"manpowerMax": 75
		},
		breakIronWill: true, //har har har
		flavor : $I("buildings.hut.flavor")
	},
	{
		name: "logHouse",
		label: $I("buildings.logHouse.label"),
		description: $I("buildings.logHouse.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "wood", val: 200 },
			{ name : "minerals", val: 250 }
		],
		priceRatio: 1.15,
		effects: {
			"maxKittens": 1,
			"manpowerMax": 50
		},
		unlocks: {
			tabs: ["village"]
		},
		breakIronWill: true,
		flavor : $I("buildings.logHouse.flavor")
	},{
		name: "mansion",
		label: $I("buildings.mansion.label"),
		description: $I("buildings.mansion.desc"),
		prices: [
			{ name : "slab", val: 185 },
			{ name : "steel", val: 75 },
			{ name : "titanium", val: 25 }
		],
		priceRatio: 1.15,
		effects: {
			"maxKittens": 1,
			"manpowerMax": 50
		},
		unlocks: {
			tabs: ["village"]
		},
		breakIronWill: true,
		flavor: $I("buildings.mansion.flavor")
	},
	//----------------------------------- Science ----------------------------------------
	{
		name: "library",
		stages: [
			{
				label: $I("buildings.library.label"),
				description: $I("buildings.library.desc"),
				unlockRatio: 0.3,
				prices: [
					{ name : "wood", val: 25 }
				],
				effects: {
					"scienceRatio": 0,
					"scienceMax": 0,
					"cultureMax": 0
				},
				stageUnlocked : true,
				flavor: $I("buildings.library.flavor")
			},{
				label: $I("buildings.dataCenter.label"),
				description: $I("buildings.dataCenter.desc"),
				prices: [
					{ name : "concrate", val: 10 },
					{ name : "steel", val: 100 }
				],
				effects: {
					"scienceMaxCompendia": 1000,
					"cultureMax": 25,
					"energyConsumption": 2
				},
				stageUnlocked : false
			}
		],
		priceRatio: 1.15,
		defaultUnlockable: true,
		unlocks: {
			tabs: ["science"],
			jobs: ["scholar"]
		},
		upgrades: {
			buildings: ["biolab"]
		},
		calculateEffects: function(self, game){
			var stageMeta = self.stages[self.stage];
			var effects = {
				"scienceRatio": 0.1,
				"scienceMax": 250,
				"cultureMax": 10,
			};

			var libraryRatio = game.getEffect("libraryRatio");
			effects["scienceMax"] *= (1 + game.bld.get("observatory").on * libraryRatio);

			if (self.stage == 1){
				effects["scienceMax"] *= 3;	//250->750 base science boos for data centers
				effects["cultureMax"] = 250;
				effects["scienceMaxCompendia"] = 1000;

				var biolabBonus = game.bld.get("biolab").val * game.getEffect("uplinkDCRatio");
				if (game.workshop.get("uplink").researched){
					effects["scienceMaxCompendia"] *= (1+biolabBonus);
					effects["scienceMax"] *= (1+biolabBonus);
					effects["cultureMax"] *= (1+biolabBonus);
				}

				effects["energyConsumption"] = 2;
				if (game.workshop.get("cryocomputing").researched){
					effects["energyConsumption"] = 1;
				}
				effects["energyConsumption"] *= game.challenges.getEnergyMod();

				if (game.workshop.get("machineLearning").researched){
					var dataCenterAIRatio = game.getEffect("dataCenterAIRatio");

					effects["scienceMax"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
					effects["cultureMax"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
					effects["scienceMaxCompendia"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
				}
			}

			stageMeta.effects = effects;
		}
	},{
		name: "academy",
		label: $I("buildings.academy.label"),
		description: $I("buildings.academy.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "wood", val: 50 },
			{ name : "minerals", val: 70 },
			{ name : "science", val: 100 }
		],
		priceRatio: 1.15,
		effects: {
			"scienceRatio": 0.2,
			"learnRatio": 0.05,
			"cultureMax": 25,
			"scienceMax": 500
		},
		flavor: $I("buildings.academy.flavor")
	},{
		name: "observatory",
		label: $I("buildings.observatory.label"),
		description: $I("buildings.observatory.desc"),
		prices: [
			{ name : "scaffold", val: 50 },
			{ name : "slab", val: 35 },
			{ name : "iron", val: 750 },
			{ name : "science", val: 1000 }
		],
		priceRatio: 1.10,
		upgrades: {
			buildings: ["library"]
		},
		effects: {
			"scienceRatio": 0.25,
			"starEventChance": 0.002,
			"starAutoSuccessChance": 0.01,
			"scienceMax": 1000
		},
		action: function(self, game){
			var effects = {
				"scienceRatio": 0.25,
				"starEventChance": 0.002,
				"starAutoSuccessChance": 0.01,
				"scienceMax": 1000
			};

			if (game.workshop.get("astrolabe").researched){
				effects["scienceMax"] = 1500;
			}

			var ratio = 1 + game.getEffect("observatoryRatio");
			effects["scienceMax"] *= ratio;
			effects["scienceRatio"] *= ratio;

			self.effects = effects;
		},
		flavor: $I("buildings.observatory.flavor")
	},{
		name: "biolab",
		label: $I("buildings.biolab.label"),
		description: $I("buildings.biolab.desc"),
		prices: [
			{ name : "slab", val: 100 },
			{ name : "alloy", val: 25 },
			{ name : "science", val: 1500 }
		],
		priceRatio: 1.10,
		effects: {
			"scienceRatio": 0.35,
			"refineRatio": 0.1,
			"scienceMax": 1500,
			"energyConsumption": 0,
			"catnipPerTickCon": 0,
			"oilPerTickProd": 0
		},
		upgrades: {
			buildings: ["library"]
		},
		calculateEffects: function(self, game){
			self.effects["scienceMax"] = 1500;

			var energyCons = 0;
			if (game.workshop.get("biofuel").researched){
				energyCons = 1;
				energyCons *= game.challenges.getEnergyMod()
				self.togglable = true;
			}
			self.effects["energyConsumption"] = energyCons;
			var datacenterBonus = game.bld.get("library").val * game.getEffect("uplinkLabRatio");
			if (game.workshop.get("uplink").researched && game.bld.get("library").stage == 1){
				self.effects["scienceMax"] *= (1 + datacenterBonus);
			}
		},
		lackResConvert: false,
		action: function(self, game){
			if (game.workshop.get("biofuel").researched){

				self.effects["catnipPerTickCon"] = -1;
				self.effects["oilPerTickProd"] = 0.02 * (1 + game.getEffect("biofuelRatio"));

				var amt = game.resPool.getAmtDependsOnStock(
					[{res: "catnip", amt: -self.effects["catnipPerTickCon"]}],
					self.on
				);
				self.effects["catnipPerTickCon"] *= amt;
				self.effects["oilPerTickProd"] *= amt;

				if (self.val) {
					self.effects["scienceRatio"] = 0.35 * (1 + self.on / self.val);
				}

				return amt;
			}
		},
		flavor: $I("buildings.biolab.flavor")
	},
	//----------------------------------- Resource storage -------------------------------------------
	{
		name: "barn",
		label: $I("buildings.barn.label"),
		description: $I("buildings.barn.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "wood", val: 50 }
		],
		priceRatio: 1.75,
		effects: {
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"ironMax": 0,
			"coalMax": 0,
			"goldMax": 0,
			"titaniumMax": 0
			},
		calculateEffects: function (self, game){
			var effects = {
				"catnipMax": 5000,
				"woodMax": 200,
				"mineralsMax": 250,
				"ironMax": 50,
				"coalMax": 60,
				"goldMax": 10,
				"titaniumMax": 2
			};

			self.effects = game.resPool.addBarnWarehouseRatio(effects);
		},
		flavor: $I("buildings.barn.flavor")
	},
	{
		name: "warehouse",
		label: $I("buildings.warehouse.label"),
		description: $I("buildings.warehouse.desc"),
		prices: [
			{ name : "beam", val: 1.5 },
			{ name : "slab", val: 2 }
		],
		priceRatio: 1.15,
		effects: {
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"ironMax": 0,
			"coalMax": 0,
			"goldMax": 0,
			"titaniumMax": 0
			},
		calculateEffects: function(self, game){
			var effects = {
				"catnipMax": 0,
				"woodMax": 150,
				"mineralsMax": 200,
				"ironMax": 25,
				"coalMax": 30,
				"goldMax": 5,
				"titaniumMax": 10
			};

			if (game.workshop.get("silos").researched){
				effects["catnipMax"] = 750;
			}

			self.effects = game.resPool.addBarnWarehouseRatio(effects);
		},
		flavor: $I("buildings.warehouse.flavor")
	},
	{
		name: "harbor",
		label: $I("buildings.harbor.label"),
		description: $I("buildings.harbor.desc"),
		prices: [
			{ name : "scaffold", val: 5 },
			{ name : "slab", val: 50 },
			{ name : "plate", val: 75 }
		],
		priceRatio: 1.15,
		effects: {
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"ironMax": 0,
			"coalMax": 0,
			"goldMax": 0,
			"titaniumMax": 0
			},
		calculateEffects: function(self, game){
			var effects = {
				"catnipMax": 2500,
				"woodMax": 700,
				"mineralsMax": 950,
				"ironMax": 150,
				"coalMax": 100,
				"goldMax": 25,
				"titaniumMax": 50
			};

			effects["coalMax"] *= (1 + game.getEffect("harborCoalRatio"));

			var cargoShips = game.workshop.get("cargoShips");
			if (cargoShips.researched){
				var shipVal = game.resPool.get("ship").value;

				//100% to 225% with slow falldown on the 75%
				var limit = 2.25 + game.getEffect("shipLimit") * game.bld.get("reactor").on;
				var ratio = 1 + game.getHyperbolicEffect(cargoShips.effects["harborRatio"] * shipVal, limit);

				effects["catnipMax"] *= ratio;
				effects["woodMax"] *= ratio;
				effects["mineralsMax"] *= ratio;
				effects["ironMax"] *= ratio;
				effects["coalMax"] *= ratio;
				effects["goldMax"] *= ratio;
				effects["titaniumMax"] *= ratio;
			}

			self.effects = game.resPool.addBarnWarehouseRatio(effects);
		},
		flavor: $I("buildings.harbor.flavor")
	},
	//----------------------------------- Resource production ----------------------------------------
	{
		name: "mine",
		label: $I("buildings.mine.label"),
		description: $I("buildings.mine.desc"),
		unlockRatio: 0.15,
		prices: [
			{ name : "wood", val: 100 }
		],
		priceRatio: 1.15,
		unlocks: {
			jobs: ["miner"]
		},
		effects: {
			"mineralsRatio": 0,
			"coalPerTickBase": 0
		},
		calculateEffects: function(self, game){
			var effects = {
				"mineralsRatio": 0.2,
				"coalPerTickBase": 0
			};

			if (game.workshop.get("deepMining").researched){
				//fun but ugly hack
				effects["coalPerTickBase"] = 0.003;
			}

			self.effects = effects;
		},
		flavor: $I("buildings.mine.flavor")
	},{
		name: "quarry",
		label: $I("buildings.quarry.label"),
		description: $I("buildings.quarry.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "scaffold", val: 50 },
			{ name : "steel", val: 125 },
			{ name : "slab", val: 1000 }
		],
		priceRatio: 1.15,
		effects: {
			"mineralsRatio": 0.35,
			"coalPerTickBase": 0.015,
			"uraniumPerTickBase": 0
		},
		action: function(self, game){
			var effects = {
				"mineralsRatio": 0.35,
				"coalPerTickBase": 0.015
			};
			if (game.workshop.get("orbitalGeodesy").researched){
				effects["uraniumPerTickBase"] = 0.0005; //4% of accelerator output
			}
			self.effects = effects;
		},
		flavor : $I("buildings.quarry.flavor")
	},
	{
		name: "smelter",
		label: $I("buildings.smelter.label"),
		description: $I("buildings.smelter.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "minerals", val: 200 }
		],
		priceRatio: 1.15,
		effects: {
			"woodPerTickCon": -0.05,
			"mineralsPerTickCon": -0.1,
			"ironPerTickAutoprod": 0.02,
			"coalPerTickAutoprod": 0,
			"goldPerTickAutoprod": 0,
			"titaniumPerTickAutoprod": 0
		},
		lackResConvert: false,
		action: function(self, game){
			// TODO: How to integrate autoProdRatio with calculateEffects?

			if (self.on < 1){
				return;
			}

			var iron = game.resPool.get("iron");

			//safe switch for IW to save precious resources, as per players request
			//only if option is enabled, because Chris says so
			if (game.ironWill && game.opts.IWSmelter && iron.value > iron.maxValue * 0.95){
				self.on = 0;
				return;
			}

			self.effects = {
				"woodPerTickCon": 0,
				"mineralsPerTickCon": 0,
				"ironPerTickAutoprod": 0.02,
				"coalPerTickAutoprod": 0,
				"goldPerTickAutoprod": 0,
				"titaniumPerTickAutoprod": 0
			};


			var smelterRatio = (1 + game.getEffect("smelterRatio"));
			self.effects["ironPerTickAutoprod"] = 0.02 * smelterRatio;

			if (game.workshop.get("goldOre").researched){
				self.effects["goldPerTickAutoprod"] = 0.001;
			}

			if (game.workshop.get("coalFurnace").researched){
				self.effects["coalPerTickAutoprod"] = 0.005 * smelterRatio;
			}

			if (game.workshop.get("nuclearSmelters").researched){
				self.effects["titaniumPerTickAutoprod"] = 0.0015;
			}

			self.effects["woodPerTickCon"] = -0.05;
			self.effects["mineralsPerTickCon"] = -0.1;

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "wood", amt: -self.effects["woodPerTickCon"]},
				 {res: "minerals", amt: -self.effects["mineralsPerTickCon"]}],
				self.on
			);
			self.effects["woodPerTickCon"]*=amt;
			self.effects["mineralsPerTickCon"]*=amt;
			self.effects["ironPerTickAutoprod"]*=amt;
			self.effects["goldPerTickAutoprod"]*=amt;
			self.effects["coalPerTickAutoprod"]*=amt;
			self.effects["titaniumPerTickAutoprod"]*=amt;

			return amt;
		},
		flavor: $I("buildings.smelter.flavor")
	},{
		name: "calciner",
		label: $I("buildings.calciner.label"),
		description: $I("buildings.calciner.desc"),
		prices: [
			{ name : "steel", val: 100 },
			{ name : "titanium",  val: 15 },
			{ name : "blueprint",  val: 1 },
			{ name : "oil",  val: 500 }
		],
		priceRatio: 1.15,
		effects: {
			"mineralsPerTickCon" : -1.5,
			"oilPerTickCon" : -0.024,
			"ironPerTickAutoprod" : 0.15,
			"titaniumPerTickAutoprod" : 0.0005,
			"energyConsumption" : 0,
			"ironPerTickCon" : 0,
			"coalPerTickCon": 0,
			"steelPerTickProd": 0
		},
		calculateEffects: function(self, game) {
			self.effects["energyConsumption"] = 1;
			self.effects["energyConsumption"] *= game.challenges.getEnergyMod();
		},
		lackResConvert: false,
		action: function(self, game){
			// TODO: How to integrate autoProdRatio with calculateEffects?

			if (self.on < 1){
				return;
			}

			self.effects["oilPerTickCon"] = -0.024; //base + 0.01
			self.effects["mineralsPerTickCon"] = -1.5;
			var calcinerRatio = game.getEffect("calcinerRatio");
			self.effects["titaniumPerTickAutoprod"] = 0.0005 * ( 1 + calcinerRatio*3 );
			self.effects["ironPerTickAutoprod"] = 0.15 * ( 1 + calcinerRatio );

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "oil", amt: -self.effects["oilPerTickCon"]},
				 {res: "minerals", amt: -self.effects["mineralsPerTickCon"]}],
				self.on
			);
			self.effects["oilPerTickCon"]*=amt;
			self.effects["mineralsPerTickCon"]*=amt;
			self.effects["ironPerTickAutoprod"]*=amt;
			self.effects["titaniumPerTickAutoprod"]*=amt;

			var amtFinal = amt;

			self.effects["ironPerTickCon"] = 0;
			self.effects["coalPerTickCon"] = 0;
			self.effects["steelPerTickProd"] = 0;

			//self.effects["coalPerTickAutoprod"] = self.effects["ironPerTickAutoprod"] * game.getEffect("calcinerCoalRatio");

			var steelRatio = game.getEffect("calcinerSteelRatio");

			if (steelRatio != 0){

				if (self.isAutomationEnabled == null) {
					self.isAutomationEnabled = true;
				}

				if (self.isAutomationEnabled) {

					// Second conversion of some of the iron that was just created, to steel
					var difference = self.effects["ironPerTickAutoprod"] * steelRatio * game.bld.getAutoProductionRatio(); //HACK
					// Cycle Effect
					var effectsTemp = {};
					effectsTemp["iron"] = difference;
					game.calendar.cycleEffectsFestival(effectsTemp);
					difference = effectsTemp["iron"];

					self.effects["ironPerTickCon"] = -difference;
					self.effects["coalPerTickCon"] = -difference;
					self.effects["steelPerTickProd"] = difference / 100;

					amt = game.resPool.getAmtDependsOnStock(
						[{res: "iron", amt: -self.effects["ironPerTickCon"]},
						 {res: "coal", amt: -self.effects["coalPerTickCon"]}],
						self.on
					);
					self.effects["ironPerTickCon"]*=amt;
					self.effects["coalPerTickCon"]*=amt;
					self.effects["steelPerTickProd"]*=(amt*(1 + game.getCraftRatio() * game.getEffect("calcinerSteelCraftRatio") + game.bld.get("reactor").on * game.getEffect("calcinerSteelReactorBonus")));

					amtFinal = (amtFinal + amt) / 2;
				}
			}

			return amtFinal;
		}
	},
	{
		name: "steamworks",
		label: $I("buildings.steamworks.label"),
		description: $I("buildings.steamworks.desc"),
		prices: [
			{ name : "steel", val: 65 },
			{ name : "gear",  val: 20 },
			{ name : "blueprint",  val: 1 }
		],
		priceRatio: 1.25,
		effects: {
			"magnetoBoostRatio": 0.15,
			"coalRatioGlobal" : 0,
			"energyProduction": 1,
			"manuscriptPerTickProd": 0
		},
		calculateEffects: function(self, game){
			self.effects["coalRatioGlobal"] = -0.8 + game.getEffect("coalRatioGlobalReduction");

			var amt = 0;
			if (game.workshop.get("printingPress").researched){
				amt = 0.0005;						// 2 per year per SW

				if (game.workshop.get("offsetPress").researched){
					amt *= 4;
				}
				if (game.workshop.get("photolithography").researched){
					amt *= 4;
				}
			}
			self.effects["manuscriptPerTickProd"] = amt;
		},
		jammed: false,
		togglableOnOff: true,
		action: function(self, game) {
			if (self.on < 1 || self.jammed || !game.workshop.get("factoryAutomation").researched) {
				return;
			}

			if (self.isAutomationEnabled == null) {
				self.isAutomationEnabled = true;
			}

			var wood = game.resPool.get("wood");
			var minerals = game.resPool.get("minerals");
			var iron = game.resPool.get("iron");

			if (wood.maxValue == 0 || minerals.maxValue == 0) {
				// Hack to prevent factory automation from starting
				// when the page is first loaded, before caps are
				return;
			}

			var baseAutomationRate = 0.02;
			// Cap automation at 90% of resource cap to prevent trying to craft more than you have
			var automationRate = Math.min(baseAutomationRate * (self.on + 1), 0.9);

			function newCrafter(consumedResource, craftedResourceName, isAllowed) {
				var consumedQuantity = consumedResource.value * automationRate;
				return {
					numberOfCrafts: isAllowed && consumedResource.value >= consumedResource.maxValue * (1 - baseAutomationRate)
						? Math.max(0, Math.floor(consumedQuantity / game.workshop.getCraft(craftedResourceName).prices[0].val))
						: 0,
					craft: function() {
						if (this.numberOfCrafts > 0) {
							game.workshop.craft(craftedResourceName, this.numberOfCrafts);
							game.msg($I("bld.msg.automation." + craftedResourceName + "s", [game.getDisplayValueExt(consumedQuantity), game.getDisplayValueExt(this.numberOfCrafts * (1 + game.getCraftRatio()))]), null, "workshopAutomation", true);
						}
					}
				};
			}

			var beamCrafter = newCrafter(wood, "beam", true);
			var slabCrafter = newCrafter(minerals, "slab", true);
			var plateCrafter = newCrafter(iron, "plate", game.workshop.get("pneumaticPress").researched);

			if (beamCrafter.numberOfCrafts == 0 && slabCrafter.numberOfCrafts == 0 && plateCrafter.numberOfCrafts == 0) {
				return;
			}

			//Jam until next year
			self.jammed = true;

			if (!self.isAutomationEnabled) {
				game.msg($I("bld.msg.automation.skip"), null, "workshopAutomation");
				return;
			}

			plateCrafter.craft();
			slabCrafter.craft();
			beamCrafter.craft();
			game.msg($I("bld.msg.automation"), null, "workshopAutomation");
		},
		flavor: $I("buildings.steamworks.flavor")
	},{
		name: "magneto",
		label: $I("buildings.magneto.label"),
		description: $I("buildings.magneto.desc"),
		prices: [
			{ name : "alloy", val: 10 },
			{ name : "gear",  val: 5 },
			{ name : "blueprint",  val: 1 }
		],
		priceRatio: 1.25,
		effects: {
			"oilPerTick" : -0.05,
			"magnetoRatio": 0.02,
			"energyProduction" : 5
		},
		action: function(self, game){
			if (self.on < 1){
				return;
			}
			self.effects["oilPerTick"]= -0.05;

			var oil = game.resPool.get("oil");
			if (oil.value+self.effects["oilPerTick"] <= 0){
				self.on--;//Turn off one per tick until oil flow is sufficient
			}
		}
	},

	{
		name: "lumberMill",
		label: $I("buildings.lumberMill.label"),
		description: $I("buildings.lumberMill.desc"),
		unlockRatio: 0.3,
		prices: [
			{name : "wood", val: 100},
			{name : "iron", val: 50},
			{name : "minerals", val: 250}
		],
		priceRatio: 1.15,
		effects: {
			"woodRatio" : 0
		},
		calculateEffects: function(self, game){
			self.effects["woodRatio"] = 0.1 + game.getEffect("lumberMillRatio") * 0.1;
		},
		flavor: $I("buildings.lumberMill.flavor")
	},
	{
		name: "oilWell",
		label: $I("buildings.oilWell.label"),
		description: $I("buildings.oilWell.desc"),
		prices: [
			{name : "steel", val: 50},
			{name : "gear",  val: 25},
			{name : "scaffold", val: 25}
		],
		priceRatio: 1.15,
		effects: {
			"oilPerTickBase" : 0.02,
			"oilMax" : 1500,
			"energyConsumption": 0
		},
		calculateEffects: function(self, game) {
			var hasPumpjack = game.workshop.get("pumpjack").researched;
			self.togglable = hasPumpjack;
			if (self.isAutomationEnabled == null && hasPumpjack) {
				self.isAutomationEnabled = true;
			}
		},
		action: function(self, game) {
			var oilRatio = 1 + game.getEffect("oilWellRatio");
			if (self.isAutomationEnabled == false) {
				oilRatio -= game.workshop.get("pumpjack").effects["oilWellRatio"];
			}
			self.effects["oilPerTickBase"] = 0.02 * oilRatio;

			self.effects["energyConsumption"] = self.isAutomationEnabled
				? game.challenges.getEnergyMod()
				: 0;
		},
		flavor: $I("buildings.oilWell.flavor")
	},
	//----------------------------------- Other ----------------------------------------
	{
		name: "workshop",
		label: $I("buildings.workshop.label"),
		description: $I("buildings.workshop.desc"),
		defaultUnlockable: true,
		unlockRatio: 0.0025,
		prices: [
			{ name : "wood", val: 100 },
			{ name : "minerals", val: 400 }
		],
		priceRatio: 1.15,
		unlocks: {
			tabs: ["workshop"]
		},
		effects: {
			"craftRatio" : 0.06	//6% for craft output
		},
		flavor: $I("buildings.workshop.flavor")
	},{
		name: "factory",
		label: $I("buildings.factory.label"),
		description: $I("buildings.factory.desc"),
		prices: [
			{ name : "titanium", val: 2000 },
			{ name : "plate", val: 2500},
			{ name : "concrate", val: 15}
		],
		priceRatio: 1.15,
		effects: {
			"craftRatio": 0,
			"energyConsumption": 0
		},
		calculateEffects: function(self, game){
			var effects = {
				"craftRatio": 0.05
			};

			if (game.workshop.get("factoryLogistics").researched){
				effects["craftRatio"] = 0.06;
			}

			effects["energyConsumption"] = 2;
			effects["energyConsumption"] *= game.challenges.getEnergyMod();

			self.effects = effects;
		}
	},{
		name: "reactor",
		label: $I("buildings.reactor.label"),
		description: $I("buildings.reactor.desc"),
		prices: [
			{ name : "titanium",    val: 3500 },
			{ name : "plate", 		val: 5000},
			{ name : "concrate",    val: 50},
			{ name : "blueprint",   val: 25}
		],
		priceRatio: 1.15,
		upgrades: {
			buildings: ["harbor"]
		},
		effects: {
			"uraniumPerTick" : -0.001,
			"thoriumPerTick": 0,
			"productionRatio": 0.05,
			"uraniumMax" : 250,
			"energyProduction" : 10
		},
		calculateEffects: function(self, game) {
			self.effects["uraniumPerTick"]= -0.001 * (1 - game.getEffect("uraniumRatio"));
			if (self.isAutomationEnabled == null && game.workshop.get("thoriumReactors").researched) {
				self.isAutomationEnabled = true;
			}
		},
		action: function(self, game) {
			if (game.resPool.get("uranium").value + self.effects["uraniumPerTick"] <= 0) {
				self.on = 0;
			}

			var stopAutomation = self.isAutomationEnabled == false || (self.isAutomationEnabled && game.resPool.get("thorium").value <= 0);
			self.effects["thoriumPerTick"] = stopAutomation ? 0 : game.getEffect("reactorThoriumPerTick");

			var energyRatio = 1 + game.getEffect("reactorEnergyRatio");
			if (stopAutomation) {
				energyRatio -= game.workshop.get("thoriumReactors").effects["reactorEnergyRatio"];
				self.isAutomationEnabled = false;
			}
			self.effects["energyProduction"] = 10 * energyRatio;
		},
		flavor: $I("buildings.reactor.flavor")
	},{
		name: "accelerator",
		label: $I("buildings.accelerator.label"),
		description: $I("buildings.accelerator.desc"),
		prices: [
			{ name : "titanium",    val: 7500 },
			{ name : "concrate",    val: 125  },
			{ name : "uranium",   	val: 25   }
		],
		priceRatio: 1.15,
		effects: {
			"titaniumPerTickCon" : -0.015,
			"uraniumPerTickAutoprod" : 0.0025,
			"scienceMax": 0,
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"ironMax": 0,
			"coalMax": 0,
			"goldMax": 0,
			"titaniumMax": 0,
			"energyConsumption": 0
		},
		calculateEffects: function(self, game){
			self.effects["energyConsumption"] = 2;
			self.effects["energyConsumption"] *= game.challenges.getEnergyMod();

			self.effects["scienceMax"] = 0;
			if (game.workshop.get("lhc").researched){
				self.effects["scienceMax"] = 2500;
			}

			//------------- limit upgrades ------------
			var capRatio = 0;
			if (game.workshop.get("energyRifts").researched){
				capRatio = (1 + game.getEffect("acceleratorRatio"));
			}

			self.effects["catnipMax"]   = 30000 * capRatio;
			self.effects["woodMax"]     = 20000 * capRatio;
			self.effects["mineralsMax"] = 25000 * capRatio;
			self.effects["ironMax"]     =  7500 * capRatio;
			self.effects["coalMax"]     =  2500 * capRatio;
			self.effects["goldMax"]     =   250 * capRatio;
			self.effects["titaniumMax"] =   750 * capRatio;
		},
		lackResConvert: false,
		action: function(self, game){
			// TODO: How to integrate autoProdRatio with calculateEffects?

			self.effects["titaniumPerTickCon"] = -0.015;
			self.effects["uraniumPerTickAutoprod"] = 0.0025;

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "titanium", amt: -self.effects["titaniumPerTickCon"]}],
				self.on
			);
			self.effects["titaniumPerTickCon"]*=amt;
			self.effects["uraniumPerTickAutoprod"]*=amt;

			return amt;
		},
		flavor: $I("buildings.accelerator.flavor")
	},
	{
		name: "tradepost",
		label: $I("buildings.tradepost.label"),
		description: $I("buildings.tradepost.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "wood", val: 500 },
			{ name : "minerals", val: 200 },
			{ name : "gold", val: 10 }
		],
		priceRatio: 1.15,
		effects: {
			"fursDemandRatio"   : -0.04,
			"ivoryDemandRatio"  : -0.04,
			"spiceDemandRatio"  : -0.04,
			"tradeRatio" : 0.015,
			"standingRatio": 0
		},
		calculateEffects: function(self, game){
			var effects = {
				"fursDemandRatio"   : -0.04,
				"ivoryDemandRatio"  : -0.04,
				"spiceDemandRatio"  : -0.04,
				/*"silkDemandRatio"   : -0.04,*/
				"tradeRatio" : 0.015,
				"standingRatio": 0
			};

			var seri = game.workshop.get("caravanserai");
			if (seri.researched){
				effects["standingRatio"] = seri.effects["standingRatio"];
			}

			self.effects = effects;
		},
        flavor: $I("buildings.tradepost.flavor")
	},{
		name: "mint",
		label: $I("buildings.mint.label"),
		description: $I("buildings.mint.desc"),
		prices: [
			{ name : "minerals", val: 5000 },
			{ name : "plate", val: 200 },
			{ name : "gold", val: 500 }
		],
		priceRatio: 1.15,
		effects: {
			"manpowerPerTickCon" : -0.75,
			"goldPerTickCon" : -0.005,
			"fursPerTickProd": 0.00875,
			"ivoryPerTickProd": 0.0021,
			"goldMax": 100
		},
		calculateEffects: function (self, game){
			self.effects["goldMax"] = 100 * (1 + game.getEffect("warehouseRatio"));
		},
		lackResConvert: false,
		action: function(self, game){
			// TODO: How to integrate max manpower with calculateEffects?

			if (self.on < 1){
				return;
			}
			self.effects["manpowerPerTickCon"] = -0.75;
			self.effects["goldPerTickCon"] = -0.005; //~5 smelters

			var manpower = game.resPool.get("manpower");
			var manpowerMax = game.getEffect("manpowerMax") || 0;
			manpowerMax = game.resPool.addResMaxRatios(manpower, manpowerMax);
			var mpratio = (manpowerMax * 0.007) / 100;

			//hidden 1% boost to mints from village level
			mpratio *= (1 + game.village.map.villageLevel * 0.005);

			self.effects["fursPerTickProd"]  = mpratio * 1.25;	//2
			self.effects["ivoryPerTickProd"] = mpratio * 0.3;	//1.5

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "manpower", amt: -self.effects["manpowerPerTickCon"]},
				 {res: "gold", amt: -self.effects["goldPerTickCon"]}],
				self.on
			);
			self.effects["manpowerPerTickCon"]*=amt;
			self.effects["goldPerTickCon"]*=amt;
			self.effects["fursPerTickProd"]*=amt;
			self.effects["ivoryPerTickProd"]*=amt;

			return amt;
		}
	},
	//-------------------------- Culture -------------------------------
	{
		name: "amphitheatre",
		effects: {
			"unhappinessRatio" : 0,
			"culturePerTickBase" : 0,
			"cultureMax" : 0
		},
		stages: [
			{
				label: $I("buildings.amphitheatre.label"),
				description: $I("buildings.amphitheatre.desc"),
				prices: [
					{ name : "wood", val: 200 },
					{ name : "minerals", val: 1200 },
					{ name : "parchment", val: 3 }
				],
				priceRatio: 1.15,
				effects: {
					"unhappinessRatio" : -0.048,
					"culturePerTickBase" : 0.005,
					"cultureMax" : 50
				},
				stageUnlocked : true,
				flavor: $I("buildings.amphitheatre.flavor")
			},
			{
				label : $I("buildings.broadcasttower.label"),
				description: $I("buildings.broadcasttower.desc"),
				prices: [
					{ name : "iron", val: 1250 },
					{ name : "titanium", val: 75 }
				],
				priceRatio: 1.18,
				effects: {
					"culturePerTickBase" : 1,
                    "unhappinessRatio" : -0.75,
					"cultureMax" : 300
				},
				stageUnlocked : false
			}
		],
        action: function(self, game){
			//very ugly and crappy stuff
			if (self.stage == 1){
				var btower = self.stages[1];

				btower.effects["cultureMax"] = 300;
				btower.effects["culturePerTickBase"] = 1;

				var energyRatio = (game.resPool.energyProd / game.resPool.energyCons);
				if (energyRatio > 1){
					if (energyRatio > 1.75){
						energyRatio = 1.75;
					}
					btower.effects["cultureMax"] = Math.floor( (300 * energyRatio) * 1000) / 1000;
					btower.effects["culturePerTickBase"] = Math.floor( (1 * energyRatio) * 1000) / 1000;
				}

				var broadcastTowerRatio = game.getEffect("broadcastTowerRatio");
				var totalRatio = game.space.getBuilding("sattelite").on * broadcastTowerRatio;

				btower.effects["cultureMax"] *= ( 1 + totalRatio);
				btower.effects["culturePerTickBase"] *= ( 1 + totalRatio);
			}
        }
	},
	{
		name: "chapel",
		label: $I("buildings.chapel.label"),
		description: $I("buildings.chapel.desc"),
		prices: [
			{ name : "minerals", val: 2000 },
			{ name : "culture",  val: 250 },
			{ name : "parchment", val: 250 }
		],
		priceRatio: 1.15,
		effects: {
			"culturePerTickBase" : 0,
			"faithPerTickBase" : 0,
			"cultureMax" : 0
		},
		calculateEffects: function(self, game) {
			if (!game.challenges.getChallenge("atheism").on) {
				var effects = {
					"culturePerTickBase" : 0.05,
					"faithPerTickBase" : 0.005,
					"cultureMax" : 200
				};
			} else {
				var effects = {
					"culturePerTickBase" : 0.05,
					"cultureMax" : 200
				};
			}
			self.effects = effects;
		}
	},
	{
		name: "temple",
		label: $I("buildings.temple.label"),
		description: $I("buildings.temple.desc"),
		prices: [
			{ name : "slab", val: 25 },
			{ name : "plate", val: 15 },
			{ name : "gold", val: 50 },
			{ name : "manuscript", val: 10 }
		],
		priceRatio: 1.15,
		effects: {
			"culturePerTickBase" : 0,
			"faithPerTickBase" : 0,
			"happiness" : 0,
			"manpowerMax" : 0,
			"scienceMax" : 0,
			"cultureMax" : 0,
			"faithMax": 0
		},
		calculateEffects: function(self, game){
			if (!game.challenges.getChallenge("atheism").on) {
				var effects = {
					"culturePerTickBase" : 0.1,
					"faithPerTickBase" : 0,
					"happiness" : 0,
					"manpowerMax" : 0,
					"scienceMax" : 0,
					"cultureMax" : 0,
					"faithMax": 100
				};

				var theology = game.science.get("theology");
				if (theology.researched){
					effects["faithPerTickBase"] = 0.0015;
				}

				var stainedGlass = game.religion.getRU("stainedGlass");
				if (stainedGlass.on){
					effects["culturePerTickBase"] += 0.05 * stainedGlass.on;
				}

				var scholastics = game.religion.getRU("scholasticism");
				if (scholastics.on){
					effects["scienceMax"] = 400 + 100 * scholastics.on;
				}

				var sunAltar = game.religion.getRU("sunAltar");
				if (sunAltar.on){
					effects["faithMax"] += 50 * sunAltar.on;
					effects["happiness"] = 0.4 + 0.1 * sunAltar.on;
				}

				var goldenSpire = game.religion.getRU("goldenSpire");
				if (goldenSpire.on){
					effects["faithMax"] *= (1 + (0.4 + 0.1 * goldenSpire.on));
				}

				var basilica = game.religion.getRU("basilica");
				if (basilica.on){
					effects["cultureMax"] = 75 + 50 * basilica.on;
					effects["culturePerTickBase"] += 0.2 + 0.05 * (basilica.on-1);
				}

				var templars = game.religion.getRU("templars");
				if (templars.on){
					effects["manpowerMax"] = 50 + 25 * templars.on;
				}
			} else {
				var effects = {
					"culturePerTickBase" : 0.1
				};
			}

			self.effects = effects;
		},
		flavor: $I("buildings.temple.flavor")
	},
	{
		name: "unicornPasture",
		label: $I("buildings.unicornPasture.label"),
		description: $I("buildings.unicornPasture.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "unicorns", val: 2 }
		],
		priceRatio: 1.75,
		effects: {
			"catnipDemandRatio": -0.0015,
			"unicornsPerTickBase" : 0.001
		},
		flavor: $I("buildings.unicornPasture.flavor")
	},
	//----------------------------------- Wonders ----------------------------------------

	{
		name: "ziggurat",
		label: $I("buildings.ziggurat.label"),
		description: $I("buildings.ziggurat.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "megalith", val: 50 },
			{ name : "scaffold", val: 50 },
			{ name : "blueprint", val: 1 }
		],
		priceRatio: 1.25,
		effects: {
			"cultureMaxRatio": 0.08
		},
		calculateEffects: function(self, game) {
			var effects = {
				cultureMaxRatio: 0.08
			};
			effects["cultureMaxRatio"] = 0.08 + game.getEffect("cultureMaxRatioBonus");
			self.effects = effects;
		}
	},{
		name: "chronosphere",
		label: $I("buildings.chronosphere.label"),
		description: $I("buildings.chronosphere.desc"),
		prices: [
			{ name : "unobtainium", val: 2500 },
			{ name : "timeCrystal", val: 1 },
			{ name : "blueprint", 	val: 100 },
			{ name : "science", 	val: 250000 }
		],
		priceRatio: 1.25,
		effects: {
			"resStasisRatio": 0.015, //1.5% of resources will be preserved
			"energyConsumption" : 0,
			"temporalFluxProduction" : 0
		},
		upgrades: {
			voidSpace: ["cryochambers"]
		},
		calculateEffects: function(self, game) {
			self.effects["energyConsumption"] = 20;
			self.effects["energyConsumption"] *= game.challenges.getEnergyMod();
			self.effects["temporalFluxProduction"] = game.getEffect("temporalFluxProductionChronosphere");
		}
	},{
		name: "aiCore",
		label: $I("buildings.aicore.label"),
		description: $I("buildings.aicore.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "antimatter", val: 125 },
			{ name : "science", 	val: 500000 }
		],
		priceRatio: 1.15,
		effects: {
			"energyConsumption": 2,
			"gflopsPerTickBase": 0.02
		},
		upgrades: {
			spaceBuilding: ["moonBase"],
			buildings: ["library"]
		},
		// TODO Actually "action" is almost always just updating effects (unclear from the name), better separate the 2 concerns: update effects (can be done several times per tick) and perform specific action (only once per tick!)
		// TODO Separation of concerns currently done only for AI Core and Time Boilers (REQUIRED by non-proportional effect!), will be systematized later
		updateEffects: function(self, game) {
			// Core #1: 2  ; Total:  2  ; Average: 2    =  8/4 = (3*1+5)/4
			// Core #2: 3.5; Total:  5.5; Average: 2.75 = 11/4 = (3*2+5)/4
			// Core #3: 5  ; Total: 10.5; Average: 3.5  = 14/4 = (3*3+5)/4
			// Core #4: 6.5; Total: 17  ; Average: 4.25 = 17/4 = (3*4+5)/4
			// etc.
			self.effects["energyConsumption"] = (3 * self.on + 5) / 4;
			self.effects["energyConsumption"] *= game.challenges.getEnergyMod();

			self.effects["aiLevel"] = Math.round(Math.log(Math.max(game.resPool.get("gflops").value, 1)));
		},
		action: function(self, game) {
			game.resPool.get("gflops").value += self.effects["gflopsPerTickBase"] * self.on;
			self.updateEffects(self, game);
		},
		flavor: $I("buildings.aicore.flavor"),
		canSell: function(self, game){
			if (self.effects["aiLevel"] < 15){
				return true;
			}
			game.systemShockMode = true;
			// Send message since achievement pop takes time or may have already occurred.
			game.msg($I("buildings.aicore.attemptsell"));
			return false;
		}
	},
	//----------------- HoD stuff --------------------------
	{
		name: "zebraOutpost",
		label: $I("buildings.zebraOutpost.label"),
		description: $I("buildings.zebraOutpost.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "bloodstone", val: 1 }
		],
		priceRatio: 1.35,
		zebraRequired: 5,
		effects: {}
	},{
		name: "zebraWorkshop",
		label: $I("buildings.zebraWorkshop.label"),
		description: $I("buildings.zebraWorkshop.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "bloodstone", val: 5 }
		],
		priceRatio: 1.15,
		zebraRequired: 10,
		effects: {}
	},{
		name: "zebraForge",
		label: $I("buildings.zebraForge.label"),
		description: $I("buildings.zebraForge.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "bloodstone", val: 50 }
		],
		priceRatio: 1.15,
		zebraRequired: 50,
		effects: {}
	}
	],

	effectsBase: {
		"manpowerMax"	: 100,
		"catnipMax"		: 5000,
		"woodMax"		: 200,
		"mineralsMax"	: 250,
                "coalMax"       : 60,
                "ironMax"       : 50,
                "titaniumMax"   : 2,
                "goldMax"       : 10,
                "oilMax"        : 1500,
                "scienceMax"    : 250,
		"faithMax" 		: 100,
		"cultureMax"	: 100,
		"uraniumMax"	: 250,
		"unobtainiumMax": 150,
		"antimatterMax" : 100
	},

	//deprecated, use getBuildingExt
	get: function(name){
		for (var i = 0; i < this.buildingsData.length; i++){
			var bld = this.buildingsData[i];
			if (bld.name == name){
				return bld;
			}
		}
		console.error("Could not find building data for '" + name + "'");
	},

    /**
     * Returns a class wrapper around the building metadata
     */
    getBuildingExt: function(name){
        var bldExt = this.metaCache[name];
        if (bldExt){
            return bldExt;
        }
        for (var i = 0; i < this.buildingsData.length; i++){
			var bld = this.buildingsData[i];
			if (bld.name == name){
                var bldExt = new classes.BuildingMeta(bld);
                this.metaCache[name] = bldExt;
                return bldExt;
            }
        }
    },

	getAutoProductionRatio: function(){
		var autoProdRatio = 1;
		//	faith
			autoProdRatio *= ( 1 + this.game.religion.getProductionBonus() / 100);
		//	SW
		var steamworks = this.get("steamworks");
		var swRatio = steamworks.on > 0 ? (1+ steamworks.effects["magnetoBoostRatio"] * this.get("steamworks").on) : 1;
			autoProdRatio *= (1 + this.game.getEffect("magnetoRatio") * swRatio);

		// paragon (25%)
			autoProdRatio *= (1 + this.game.prestige.getParagonProductionRatio() * 0.25);

		// reactors
			autoProdRatio *= (1 + this.game.getEffect("productionRatio"));

		return autoProdRatio;
		//This function must stay atm for Steel Plants
	},

	/**
	 * Since there are now dynamic effects affecting price ratio, it should be calculated there
	 * All direct calls to bld.price ratio should be considered deprecated
	 */
	getPriceRatio: function(bldName){
		var bld = this.getBuildingExt(bldName);
		return this.getPriceRatioWithAccessor(bld);
	},

	getPriceRatioWithAccessor: function(bld){
		var ratio = bld.get('priceRatio');
		var ratioBase = ratio - 1;

		var ratioDiff = this.game.getEffect(bld.meta.name + "PriceRatio") +
			this.game.getEffect("priceRatio") +
			this.game.getEffect("mapPriceReduction");

		ratioDiff = this.game.getHyperbolicEffect(ratioDiff, ratioBase);
		return ratio + ratioDiff;
	},

	/**
	 * For fucks sake, finally we have a non-concrete dynamic price calculation algorithm
	 * It only took a couple of months. TODO: potential performance impact?
	 */
	 getPrices: function(bldName) {
	 	var bld = this.getBuildingExt(bldName);
		return this.getPricesWithAccessor(bld);
	 },

	 getPricesWithAccessor: function(bld) {
	 	var bldPrices = bld.get('prices');
		var ratio = this.getPriceRatioWithAccessor(bld);

		var prices = [];

		for (var i = 0; i< bldPrices.length; i++){
			prices.push({
				val: bldPrices[i].val * Math.pow(ratio, bld.get('val')),
				name: bldPrices[i].name
			});
		}
	    return prices;
	 },


	update: function(){
		var rerender = false;
		for (var i = 0; i < this.buildingsData.length; i++){
			var bld = this.buildingsData[i];
			if (!bld.unlocked){
				if (this.isUnlocked(bld)){
					bld.unlocked = true;
					rerender = true;
				}
			}
			else {
				//just in case we patched something (shit happens?)
				if (!this.isUnlockable(bld)){
					bld.unlocked = false;
				}
			}

			if (bld.action && (bld.on > 0 || bld.name == "biolab" || bld.name == "aiCore")){
				var amt = bld.action(bld, this.game);
				if (typeof(amt) != "undefined") {
					bld.lackResConvert = (amt == 1 || bld.on == 0) ? false : true;
				}
			}

		}

		/*
		 * Manpower hack for Iron Will mode. 1000 manpower is absolutely required for civilisation unlock.
		 * There may be some microperf tweaks, but let's keep it simple
		 */
		this.game.bld.effectsBase["manpowerMax"] = 100;
		if (this.game.ironWill){
			if (this.game.workshop.get("huntingArmor").researched){
				this.game.bld.effectsBase["manpowerMax"] = 1000;
			} else if (this.game.workshop.get("bolas").researched){
				this.game.bld.effectsBase["manpowerMax"] = 400;
			} else if (this.game.workshop.get("compositeBow").researched){
				this.game.bld.effectsBase["manpowerMax"] = 200;
			}
		}

		if (rerender){
			this.game.render();
		}
	},

	getEffect: function(effectName){
		var effect = 0;
		for (var i = 0; i < this.meta.length; i++){
			var effectMeta = this.getMetaEffect(effectName, this.meta[i]);
			effect += effectMeta;

		}
		return effect;
	},

	isUnlocked: function(building){
		if (!this.isUnlockable(building)){
			return false;
		}

		var isUnlocked = true;

		var building = new classes.BuildingMeta(building).getMeta();
		var unlockRatio = building.unlockRatio;

		if (building.prices.length && typeof(unlockRatio) == "number"){

			for( var i = 0; i < building.prices.length; i++){
				var price = building.prices[i];
				var res = this.game.resPool.get(price.name);

				if (res.value < price.val * unlockRatio){	// 30% required to unlock structure
					isUnlocked = false;
					break;
				}
			}
		}

		return isUnlocked;
	},

	isUnlockable: function(building){
		return building.defaultUnlockable || building.unlockable;
	},

	save: function(saveData){
		saveData.buildings = this.filterMetadata(this.buildingsData, ["name", "unlocked", "val", "on", "stage", "jammed", "isAutomationEnabled"]);

		if (!saveData.bldData){
			saveData.bldData = {};
		}
		saveData.bldData.groupBuildings = this.groupBuildings;
		saveData.bldData.twoRows = this.twoRows;
	},

	load: function(saveData){
		this.groupBuildings = saveData.bldData ? saveData.bldData.groupBuildings: false;
		this.twoRows = saveData.bldData ? saveData.bldData.twoRows : false;
		this.loadMetadata(this.buildingsData, saveData.buildings);
	},

	resetState: function(){
		for (var i = 0; i < this.buildingsData.length; i++){
			var bld = this.buildingsData[i];

			bld.unlocked = false;
			bld.unlockable = bld.defaultUnlockable || false;

			if (typeof(bld.stages) == "object"){
				bld.stage = 0;
				for (var j = 1; j < bld.stages.length; j++){ //stages[0] should always be unlocked
					bld.stages[j].stageUnlocked = false;
				}
			}

			if (bld.jammed != undefined){
				bld.jammed = false;
			}

			if (bld.isAutomationEnabled != undefined){
				bld.isAutomationEnabled = true;
			}

			this.resetStateStackable(bld);
		}
	},

    //============ dev =============
    devAddStorage: function(){
        this.get("warehouse").val += 10;
        this.get("warehouse").on += 10;
        this.get("barn").val += 10;
        this.get("barn").on += 10;
        this.get("harbor").val += 10;
        this.get("harbor").on += 10;
    },

	gatherCatnip: function(){
		this.game.resPool.get("catnip").value++;
	},

	refineCatnip: function(){
		var craftRatio = this.game.getResCraftRatio({name: "wood"}) + 1;
		this.game.resPool.addResEvent("wood", (1 * craftRatio));
	},

	fastforward: function(daysOffset) {
		var game = this.game;
		if (!game.workshop.get("factoryAutomation").researched) {
			return;
		}

		var steamworks = this.get("steamworks");
		if (steamworks.isAutomationEnabled == null) {
			steamworks.isAutomationEnabled = true;
		}

		var wood = game.resPool.get("wood");
		var minerals = game.resPool.get("minerals");
		var iron = game.resPool.get("iron");

		if (wood.maxValue == 0 || minerals.maxValue == 0) {
			// Hack to prevent factory automation from starting
			// when the page is first loaded, before caps are
			return;
		}

		var baseAutomationRate = 0.02;
		// Cap automation at 90% of resource cap to prevent trying to craft more than you have
		var automationRate = Math.min(baseAutomationRate * (steamworks.on + 1), 0.9);

		var automationDelay = this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear / (this.game.workshop.get("advancedAutomation").researched ? 2 : 1);
		var numberOfAutomations = Math.floor(daysOffset / automationDelay);

		function newCrafter(consumedResource, craftedResourceName, isAllowed) {
			var consumableQuantity = consumedResource.value;
			var consumableQuantityThreshold = consumedResource.maxValue * (1 - baseAutomationRate);
			var price = game.workshop.getCraft(craftedResourceName).prices[0].val;

			var numberOfCrafts = 0;
			var numberOfCraftsForCurrentAutomation = 0;
			var remainingAutomations = numberOfAutomations;
			while (isAllowed && remainingAutomations-- > 0 && consumableQuantity >= consumableQuantityThreshold
					&& (numberOfCraftsForCurrentAutomation = Math.floor(Math.min(consumableQuantity, consumedResource.maxValue) * automationRate / price)) > 0) {
				numberOfCrafts += numberOfCraftsForCurrentAutomation;
				consumableQuantity -= numberOfCraftsForCurrentAutomation * price;
			}

			return {
				numberOfCrafts: numberOfCrafts,
				craft: function() {
					if (this.numberOfCrafts > 0) {
						game.workshop.craft(craftedResourceName, this.numberOfCrafts);
					}
				}
			};
		}

		var beamCrafter = newCrafter(wood, "beam", true);
		var slabCrafter = newCrafter(minerals, "slab", true);
		var plateCrafter = newCrafter(iron, "plate", game.workshop.get("pneumaticPress").researched);

		if (beamCrafter.numberOfCrafts == 0 && slabCrafter.numberOfCrafts == 0 && plateCrafter.numberOfCrafts == 0) {
			return;
		}

		//Jam until next year
		steamworks.jammed = true;

		if (!steamworks.isAutomationEnabled) {
			return;
		}

		plateCrafter.craft();
		slabCrafter.craft();
		beamCrafter.craft();
	},

	undo: function(data){
		var metaId = data.metaId,
		amt = data.val;

		var bldMetaRaw = this.get(metaId),
			bld = new classes.BuildingMeta(bldMetaRaw).getMeta();

		//This is probably the most up-to-date and problemless way to manage building models due to the layers and layers
		//and layes	of legacy abstractions. I am not happy with it, but c'est la vie.
		if (data.action == "build"){
			var props = {
				key:            bld.name,
				name:           bld.label,
				description:    bld.description,
				building:       bld.name
			};
			if (typeof(bld.stages) == "object"){
				props.controller = new classes.ui.btn.StagingBldBtnController(this.game);
			} else {
				props.controller = new classes.ui.btn.BuildingBtnModernController(this.game);
			}
			var model = props.controller.fetchModel(props);
			model.refundPercentage = 1.0;	//full refund for undo

			//Whoever came with reverse amt notation was probably high. (Was it me?)
			props.controller.sellInternal(model, model.metadata.val - amt);

		} else if (data.action == "sell"){
			//tbd
			console.warn("Not implemented yet");
		} else if (data.action == "upgrade"){
			console.warn("Not implemented yet");
		} else if (data.action == "downgrade"){
			console.warn("Not implemented yet");
		}
	}/*,

	refund: function(bldId, amt, refundPercentage){
		refundPercentage = refundPercentage || 0.5;

	}*/
});

dojo.declare("classes.game.ui.GatherCatnipButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {
	buyItem: function(model, event, callback){
		var self = this;
		clearTimeout(this.game.gatherTimeoutHandler);
		this.game.gatherTimeoutHandler = setTimeout(function(){ self.game.gatherClicks = 0; }, 2500);	//2.5 sec

		this.game.gatherClicks++;
		if (this.game.gatherClicks >= 2500 && !this.game.ironWill){
			this.game.gatherClicks = 0;
			this.game.cheatMode = true;
		}

		this.game.bld.gatherCatnip();
		callback(true);
	}
});

dojo.declare("classes.game.ui.RefineCatnipButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {
	fetchModel: function(options) {
		var model = this.inherited(arguments);
	    var self = this;
		var catnipVal = this.game.resPool.get("catnip").value;
		var catnipCost = model.prices[0].val;
		model.x100Link = {
			title: "x100",
			visible: !(catnipVal < (catnipCost * 100)),
			handler: function(btn){
				self.handleX100Click(model);
			}
		};
		return model;
	},

	handleX100Click: function(model) {
		var catnipVal = this.game.resPool.get("catnip").value;
		var catnipCost = model.prices[0].val;

		if (catnipVal < (catnipCost * 100)){
			this.game.msg("not enough catnip!");
		}

		this.game.resPool.addResEvent("catnip", -(catnipCost * 100));

		var craftRatio = this.game.getResCraftRatio({name: "wood"}) + 1;
		this.game.resPool.addResEvent("wood", (100 * craftRatio));
	}
});

dojo.declare("classes.game.ui.RefineCatnipButton", com.nuclearunicorn.game.ui.ButtonModern, {
	x100Href: null,

	update: function(){
		this.inherited(arguments);
	    // -------------- x100 ----------------

		if (!this.x100Href){
			this.x100Href = this.addLink(this.model.x100Link.title, this.model.x100Link.handler
				);
		} else {
			dojo.style(this.x100Href.link, "display", !this.model.x100Link.visible ? "none" : "");
		}

	}

});

dojo.declare("classes.ui.btn.BuildingBtnModernController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.simplePrices = false;
		return result;
	},

    getMetadata: function(model){
    	model.metaAccessor = this.game.bld.getBuildingExt(model.options.building);

		//let's not mess with meta accessor, it is a pain to deal with it
		var meta = model.metaAccessor.getMeta(),
			bld = this.game.bld.get(model.options.building);

		meta.unlockable = bld.unlockable;
		meta.unlocked = bld.unlocked;

		meta.on = bld.on;
		meta.val = bld.val || bld.on;

		//TODO: this becomes problematic

		return meta;
    },

    getName: function(model) {
		var meta = model.metadata;
		var name = this.inherited(arguments);

		var sim = this.game.village.sim;
		if (meta.name == "hut" && sim.nextKittenProgress && sim.maxKittens <= 10 ){
			name += " [" + ( sim.nextKittenProgress * 100 ).toFixed()  + "%]";
		}
		return name;
	},

	getPrices: function(model){
		var prices = this.game.bld.getPricesWithAccessor(model.metaAccessor);
		return prices;
	},

	hasSellLink: function(model){
		return !this.game.opts.hideSell;
	},

    build: function(model, maxBld){
		var counter = this.inherited(arguments);

		//update stats
		this.game.stats.getStat("buildingsConstructed").val += counter;
		this.game.telemetry.logEvent("building",
			{name: model.options.building, val: counter}
		);
		var undo = this.game.registerUndoChange();
        undo.addEvent("building", {
			action:"build",
			metaId: model.options.building,
			val: counter
		});
	},

    decrementValue: function(model) {
    	this.inherited(arguments);
    	model.metaAccessor.set("val", model.metadata.val);
    	model.metaAccessor.set("on", model.metadata.on);
	},

	incrementValue: function(model) {
		this.inherited(arguments);
    	model.metaAccessor.set("val", model.metadata.val);
    	model.metaAccessor.set("on", model.metadata.on);
	}
});


//-------------------    special stagable bld exclusive button ------------------------------------------------

dojo.declare("classes.ui.btn.StagingBldBtnController", classes.ui.btn.BuildingBtnModernController, {
	stageLinks: null,

	constructor: function(){

	},

	fetchModel: function(options) {
		var model = this.inherited(arguments);
		model.stageLinks = this.getStageLinks(model);


		return model;
	},

	getEffects: function(model){
		var effects = model.metadata.effects;
		var currentStage = model.metadata.stages[model.metadata.stage];
		if (currentStage && currentStage.effects){
			effects = currentStage.effects;
		}
		return effects;
	},

	getStageLinks: function(model){
		var self = this;
		var stageLinks = [];
		var stages = model.metadata.stages;
		var stage = model.metadata.stage || 0;

		var downgradeHandler = function(){
			self.downgrade(model);
		};
		var upgradeHandler = function(){
			self.upgrade(model);
		};
		for (var i = 1; i < stages.length; i++){
			if (i <= stage){
				//downgrade
				stageLinks.push( {title: "v", handler: downgradeHandler, enabled: true});
			} else {
				//upgrade
				if (!stages[i].stageUnlocked){
					continue;
				}
				stageLinks.push( {title: "^", handler: upgradeHandler, enabled: true});
			} //if
		}

		return stageLinks;
	},

	downgrade: function(model) {
		this.game.ui.confirm('', $I('buildings.downgrade.confirmation'), {
			handler: this.downgradeCallback,
			ctx: this,
			args: [model]
		});
	},

	downgradeCallback: function(model, result) {
		if (!result) {
			return;
		}
		var metadataRaw = this.getMetadataRaw(model);
		metadataRaw.stage = metadataRaw.stage -1 || 0;
		metadataRaw.val = 0;	//TODO: fix by using separate value flags
		metadataRaw.on = 0;
		if (metadataRaw.calculateEffects){
			metadataRaw.calculateEffects(metadataRaw, this.game);
		}
        this.game.upgrade(metadataRaw.upgrades);
		this.game.render();
	},

	upgrade: function(model) {
		this.game.ui.confirm('', $I('buildings.upgrade.confirmation'), {
			handler: this.upgradeCallback,
			ctx: this,
			args: [model]
		});
	},

	upgradeCallback: function(model, result) {
		if (!result) {
			return;
		}
		var metadataRaw = this.getMetadataRaw(model);
		metadataRaw.stage = metadataRaw.stage || 0;
		metadataRaw.stage++;

		metadataRaw.val = 0;	//TODO: fix by using separate value flags
		metadataRaw.on = 0;
		if (metadataRaw.calculateEffects){
			metadataRaw.calculateEffects(metadataRaw, this.game);
		}
        this.game.upgrade(metadataRaw.upgrades);
		this.game.render();
	},

	getMetadataRaw: function(model) {
		return this.game.bld.get(model.metadata.name);
	}
});

dojo.declare("classes.ui.btn.StagingBldBtn", com.nuclearunicorn.game.ui.BuildingStackableBtn, {
	stageLinks: null,

	constructor: function(){
		this.stageLinks = [];
	},

	renderLinks: function(){
		this.inherited(arguments);

		for (var i = 0; i < this.model.stageLinks.length; i++){
			var linkModel = this.model.stageLinks[i];
			this.stageLinks.push(
					this.addLink(linkModel.title, linkModel.handler));
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.tab.BuildingsModern", com.nuclearunicorn.game.ui.tab, {

	bldGroups: null,

	activeGroup: null,

	constructor: function(tabName){
		this.bldGroups = [];
	},

	render: function(content){
		this.bldGroups = [];

		var topContainer = dojo.create("div", {
			className: "bldTopContainer"
		}, content);

		var groups = dojo.clone(this.game.bld.buildingGroups, true);

		//non-group filters
		if (this.game.ironWill && this.game.bld.get("library").on > 0){
			groups.unshift({
				name: "iw",
				title: "IW",
				buildings: []
			});
		}
		groups.unshift({
			name: "togglable",
			title: "Togglable",
			buildings: []
		});
		groups.unshift({
			name: "allEnabled",
			title: $I("ui.filter.enabled"),
			buildings: []
		});
		groups.unshift({
			name: "all",
			title: $I("ui.filter.all"),
			buildings: []
		});

		if (!this.activeGroup){
			this.activeGroup = groups[0].name;
		}
		for (var i = 0; i< groups.length; i++){
			var isActiveGroup = (groups[i].name == this.activeGroup);

			var hasVisibleBldngs = false;
			for (var j = 0; j< groups[i].buildings.length; j++){
				var bld = this.game.bld.get(groups[i].buildings[j]);
				if (bld.unlocked){
					hasVisibleBldngs = true;
					break;
				}
			}
			if (!groups[i].buildings.length){	//empty groups are visible by default
				hasVisibleBldngs = true;
			}

			var separator = null;
			if (i != 0){
				separator = dojo.create("span", {
					innerHTML: " &#183; ",
					style: {
						display: hasVisibleBldngs ? "" : "none"
					}
				}, topContainer);
			}

			var tab = dojo.create("a", {
				innerHTML: groups[i].title,
				href: "#",
				style: {
					display: hasVisibleBldngs ? "" : "none",
					whiteSpace: "nowrap"
				},
				className: isActiveGroup ? "activeTab" : ""
			}, topContainer);

			this.bldGroups.push({
				group: groups[i],
				visible: hasVisibleBldngs,
				tab: tab,
				separator: separator
			});

			dojo.connect(tab, "onclick", this, dojo.partial(function(groupName){
				this.activeGroup = groupName;
				this.game.render();
			}, groups[i].name));
		}


		var groupContainer = dojo.create("div", { className: "bldGroupContainer"}, topContainer);
		this.groupContainer = groupContainer;

		this.renderActiveGroup(groupContainer);

		this.update();
	},

	renderActiveGroup: function(groupContainer){

		dojo.empty(groupContainer);
		this.buttons = [];

		this.twoRows = (this.activeGroup == "all" || this.activeGroup == "iw");
		this.initRenderer(groupContainer);

		for( var i = 0; i< this.bldGroups.length; i++){
			if (this.bldGroups[i].group.name != this.activeGroup){
				if (this.activeGroup != "all" &&
					this.activeGroup != "allEnabled" &&
					this.activeGroup != "togglable" &&
					this.activeGroup != "iw"){

						continue;
				}
			}
			if (i == 0){
				this.addCoreBtns(groupContainer);
			}

			var group = this.bldGroups[i].group;

			for (var j = 0; j< group.buildings.length; j++){
				var bldMetaRaw = this.game.bld.get(group.buildings[j]);
				var bld = new classes.BuildingMeta(bldMetaRaw).getMeta();

				var btn = null;
				if (typeof(bld.stages) == "object"){
					btn = new classes.ui.btn.StagingBldBtn({
						name: 			bld.label,
						description: 	bld.description,
						building: 		bld.name,
						twoRow:			this.twoRows,
						controller: new classes.ui.btn.StagingBldBtnController(this.game)
					}, this.game);
				} else {
					btn = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
						name: 			bld.label,
						description: 	bld.description,
						building: 		bld.name,
						twoRow:			this.twoRows,
						controller: new classes.ui.btn.BuildingBtnModernController(this.game)
					}, this.game);
				}
				var mdl = btn.controller.fetchModel(btn.opts);

				if (this.activeGroup == "allEnabled"){

					if (!mdl.enabled){
						continue;
					}
				}
				if (this.activeGroup == "togglable"){
					if (!mdl.togglable){
						continue;
					}
				}

				if (this.activeGroup == "iw"){
					if (group.name == "population"){
						continue;
					}
				}

				btn.update();
				if (!mdl.visible){
					continue;	//skip invisible buttons to not make gaps in the two rows renderer
				}

				this.addButton(btn);
			}
		}

		for (var i = 0; i< this.buttons.length; i++){
			var buttonContainer = this.twoRows ?
						this.getElementContainer(i) : groupContainer;
			this.buttons[i].render(buttonContainer);
		}
	},

	addCoreBtns: function(container){

		var btn = new com.nuclearunicorn.game.ui.ButtonModern({
			name:	 $I('buildings.gatherCatnip.label'),
			controller: new classes.game.ui.GatherCatnipButtonController(this.game),
			description: $I('buildings.gatherCatnip.desc'),
			twoRow: this.twoRows
		}, this.game);
		this.addButton(btn);
		//btn.render(container);

		var isEnriched = btn.game.workshop.get("advancedRefinement").researched;
		var self = this;
		var btn = new classes.game.ui.RefineCatnipButton({
			name: 		$I('buildings.refineCatnip.label'),
			controller: new classes.game.ui.RefineCatnipButtonController(this.game),
			handler: 	function(btn){
				self.game.bld.refineCatnip();
			},
			description: $I('buildings.refineCatnip.desc'),
			prices: [ { name : "catnip", val: (isEnriched ? 50 : 100) }],
			twoRow: this.twoRows
		}, this.game);
		this.addButton(btn);
		//btn.render(container);
	},

	update: function(){
		this.inherited(arguments);
	},

	getTabName: function(){
		//TODO: calculate count and fetch the result
		return $I("buildings.tabName");
	}
});
