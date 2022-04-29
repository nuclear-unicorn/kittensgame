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
				bld.stage = bld.stages.length - 1;
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
				bld.stage = bld.stages.length - 1;
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
				this._metaCache = null;
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

	//pollution things
	cathPollution: 0,
	cathPollutionPerTick: 0,

	constructor: function(game){
		this.game = game;
        this.metaCache = {};
        this.registerMeta(false, this.buildingsData, {
			getEffect: function(bld, effectName){
				var effect = 0;
				//var bldMeta = self.getBuildingExt(bld.name);
				//var effectValue = bldMeta.get("effects")[effectName];
				var effectValue;
				if (bld.stages){
					//some specific hack for stagable buildings
					if (bld.stage >= bld.stages.length){
						bld.stage = bld.stages.length - 1;
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
				} else if (effectName.indexOf("Max", effectName.length - 3) != -1 && (bld.name != "library")||
					(bld.name == "biolab" && effectName.indexOf("Ratio", effectName.length - 5) != -1)){
					effect = effectValue * bld.val;
				} else {
					effect = effectValue * bld.on;
				}

				//probably not the best place to handle this mechanics
				//----------- move to separate part? -----------
				if ((effectName == "productionRatio" || effectName == "magnetoRatio")
					&& (game.resPool.energyCons > game.resPool.energyProd)){
					effect *= game.resPool.getEnergyDelta();
				}

				return effect;
			}
		});
        this.setEffectsCachedExisting();
	},

	setEffectsCachedExisting: function(){
		this.inherited(arguments);
		//register effect names on building stages
		for (var i = 0; i < this.buildingsData.length; i++){
			var building = this.buildingsData[i];
			if (building.stages){
				for (var j = 0; j < building.stages.length; j++){
					for (var effectName in building.stages[j].effects){
						this.effectsCachedExisting[effectName] = 0;
					}
				}
			}
		}
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
		buildings: ["workshop", "tradepost", "mint", "unicornPasture", "brewery"]
	},{
		name: "megastructures",
		title: $I("buildings.group.megastructures"),
		buildings: ["ziggurat", "chronosphere", "aiCore"]
	},{
		name: "zebraBuildings",
		title: $I("buildings.group.zebraBuildings"),
		buildings: ["zebraOutpost", "zebraWorkshop", "zebraForge", "ivoryTemple"]
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
		flavor : $I("buildings.field.flavor"),
		unlockScheme: {
			name: "catnip",
			threshold: 56 /* need one barn */
		}
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
				calculateEffects: function(self, game) {
					self.effects = {
						"energyProduction": self.calculateEnergyProduction(game, game.calendar.season)
					};
				},
				calculateEnergyProduction: function(game, season) {
					if (game.challenges.isActive("winterIsComing")){
						season = 3;
					}

					var energyProduction = 2 * (1 + game.getEffect("solarFarmRatio"));
					if (season == 3) {
						energyProduction *= 0.75;
					} else if (season == 1) {
						energyProduction /= 0.75;
						energyProduction *= (1 + game.getLimitedDR(game.getEffect("summerSolarFarmRatio"), 2));
					}

					var seasonRatio = game.getEffect("solarFarmSeasonRatio");
					if ((season == 3 && seasonRatio == 1) || (season != 1 && seasonRatio == 2)){
						energyProduction *= (1 + 0.15 * seasonRatio);
					}

					return energyProduction;

				},
				stageUnlocked : false
			}
		],
		effects: {
		},
        calculateEffects: function(self, game){
			var stageMeta = self.stages[self.stage];
			if (stageMeta.calculateEffects) {
				stageMeta.calculateEffects(stageMeta, game);
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
					{ name : "titanium", val: 2500 },
					{ name : "concrate", val: 100 }
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
		upgrades:{
            policies: ["authocracy"]
        },
		effects: {
			"manpowerMax": 75,
			"maxKittens": 2
		},
		breakIronWill: true, //har har har
		almostLimited: false,
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
			"manpowerMax": 50,
			"maxKittens": 1
		},
		unlocks: {
			tabs: ["village"]
		},
		upgrades:{
            policies: ["authocracy"]
        },
		breakIronWill: true,
		almostLimited: false,
		flavor : $I("buildings.logHouse.flavor")
	},{
		name: "mansion",
		label: $I("buildings.mansion.label"),
		description: $I("buildings.mansion.desc"),
		prices: [
			{ name : "titanium", val: 25 },
			{ name : "slab", val: 185 },
			{ name : "steel", val: 75 }
		],
		priceRatio: 1.15,
		effects: {
			"manpowerMax": 50,
			"maxKittens": 1
		},
		unlocks: {
			tabs: ["village"]
		},
		upgrades:{
            policies: ["authocracy"]
        },
		breakIronWill: true,
		almostLimited: false,
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
					{ name : "steel", val: 100 },
					{ name : "concrate", val: 10 }
				],
				//togglable: true,
				effects: {
					"scienceMaxCompendia": 1000,
					"cultureMax": 25,
					"energyConsumption": 2,
					//"cathPollutionPerTickProd": 2, maybe in the future?
				},
				unlockScheme: {
					name: "computer",
					threshold: 100
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
			buildings: ["biolab", "observatory"]
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
				effects["scienceMaxCompendia"] = 1000;
				effects["scienceMax"] *= 3;	//250->750 base science boos for data centers
				effects["cultureMax"] = 250;

				var biolabBonus = game.bld.get("biolab").val * game.getEffect("uplinkDCRatio");
				if (game.workshop.get("uplink").researched){
					effects["scienceMaxCompendia"] *= (1 + biolabBonus);
					effects["scienceMax"] *= (1 + biolabBonus);
					effects["cultureMax"] *= (1 + biolabBonus);
				}

				effects["energyConsumption"] = 2;
				if (game.workshop.get("cryocomputing").researched){
					effects["energyConsumption"] = 1;
				}
				//effects["cathPollutionPerTickProd"] = effects["energyConsumption"];

				if (game.workshop.get("machineLearning").researched){
                    var dataCenterAIRatio = game.getEffect("dataCenterAIRatio");
                    dataCenterAIRatio *= (1 + game.getEffect("aiCoreUpgradeBonus") || 0);
					effects["scienceMaxCompendia"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
					effects["scienceMax"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
					effects["cultureMax"] *= (1 + game.bld.get("aiCore").on * dataCenterAIRatio);
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
			"skillXP": 0.0005,
			"scienceMax": 500,
			"cultureMax": 25,
			"academyMeteorBonus": 0
		},
		calculateEffects: function(self, game){
			if(game.workshop.getZebraUpgrade("minerologyDepartment").researched) {
				self.effects["academyMeteorBonus"] = 0.01;
			}else{
				self.effects["academyMeteorBonus"] = 0;
			}
		},
		flavor: $I("buildings.academy.flavor"),
		unlockScheme: {
			name: "school",
			threshold: 68
		}
	},{
		name: "observatory",
		label: $I("buildings.observatory.label"),
		description: $I("buildings.observatory.desc"),
		prices: [
			{ name : "iron", val: 750 },
			{ name : "science", val: 1000 },
			{ name : "slab", val: 35 },
			{ name : "scaffold", val: 50 }
		],
		priceRatio: 1.10,
		upgrades: {
			buildings: ["library"]
		},
		effects: {
			"starEventChance": 0.002,
			"starAutoSuccessChance": 0.01,
		},
		calculateEffects: function(self, game) {
			var ratio = 1 + game.getEffect("observatoryRatio");
			self.effects["scienceRatio"] = ratio * 0.25;
			self.effects["scienceMax"] = ratio * (game.workshop.get("astrolabe").researched ? 1500 : 1000);
		},
		flavor: $I("buildings.observatory.flavor")
	},{
		name: "biolab",
		label: $I("buildings.biolab.label"),
		description: $I("buildings.biolab.desc"),
		prices: [
			{ name : "science", val: 1500 },
			{ name : "slab", val: 100 },
			{ name : "alloy", val: 25 }
		],
		priceRatio: 1.10,
		effects: {
			"scienceRatio": 0.35,
			"refineRatio": 0.1,
			"scienceMax": 0,
			"catnipPerTickCon": 0,
			"oilPerTickProd": 0,
			"energyConsumption": 0
		},
		upgrades: {
			buildings: ["library"]
		},
		effectsCalculated: {},
		calculateEffects: function(self, game){
			if (game.workshop.get("biofuel").researched){
				self.togglable = true;
				self.effects["catnipPerTickCon"] = -1;
				self.effects["oilPerTickProd"] = 0.02 * (1 + game.getEffect("biofuelRatio"));
				self.effects["energyConsumption"] = 1;
			}else{
				self.togglable = false;
				self.effects["catnipPerTickCon"] = 0;
				self.effects["oilPerTickProd"] = 0;
				self.effects["energyConsumption"] = 0;
			}

			self.effects["scienceMax"] = 1500;
			if (game.workshop.get("uplink").researched && game.bld.get("library").stage == 1){
				var datacenterBonus = game.bld.get("library").val * game.getEffect("uplinkLabRatio");
				self.effects["scienceMax"] *= (1 + datacenterBonus);
			}

			for (var i in self.effects) {
				self.effectsCalculated[i] = self.effects[i];
			}

		},
		lackResConvert: false,
		action: function(self, game){
			if (game.workshop.get("biofuel").researched){

				var amt = game.resPool.getAmtDependsOnStock(
					[{res: "catnip", amt: -self.effectsCalculated["catnipPerTickCon"]}],
					self.on
				);
				for (var i in self.effects) {
					if (i == "catnipPerTickCon" ||
						i == "oilPerTickProd" ){
							self.effects[i] = self.effectsCalculated[i] * amt;
						}
				}

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
			"coalMax": 0,
			"ironMax": 0,
			"titaniumMax": 0,
			"goldMax": 0
			},
		calculateEffects: function (self, game){
			var effects = {
				"catnipMax": 5000,
				"woodMax": 200,
				"mineralsMax": 250,
				"coalMax": 60,
				"ironMax": 50,
				"titaniumMax": 2,
				"goldMax": 10
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
			"coalMax": 0,
			"ironMax": 0,
			"titaniumMax": 0,
			"goldMax": 0
			},
		calculateEffects: function(self, game){
			var effects = {
				"catnipMax": 0,
				"woodMax": 150,
				"mineralsMax": 200,
				"coalMax": 30,
				"ironMax": 25,
				"titaniumMax": 10,
				"goldMax": 5
			};

			if (game.workshop.get("silos").researched){
				effects["catnipMax"] = 750;
			}

			self.effects = game.resPool.addBarnWarehouseRatio(effects);
		},
		flavor: $I("buildings.warehouse.flavor"),
		unlockScheme: {
			name: "minimalist",
			threshold: 10
		}
	},
	{
		name: "harbor",
		label: $I("buildings.harbor.label"),
		description: $I("buildings.harbor.desc"),
		prices: [
			{ name : "slab", val: 50 },
			{ name : "plate", val: 75 },
			{ name : "scaffold", val: 5 }
		],
		priceRatio: 1.15,
		effects: {
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"coalMax": 0,
			"ironMax": 0,
			"titaniumMax": 0,
			"goldMax": 0
			},
		calculateEffects: function(self, game){
			var effects = {
				"catnipMax": 2500,
				"woodMax": 700,
				"mineralsMax": 950,
				"coalMax": 100,
				"ironMax": 150,
				"titaniumMax": 50,
				"goldMax": 25
			};

			effects["coalMax"] *= (1 + game.getEffect("harborCoalRatio"));

			var cargoShips = game.workshop.get("cargoShips");
			if (cargoShips.researched){
				var shipVal = game.resPool.get("ship").value;

				//100% to 225% with slow falldown on the 75%
				var limit = 2.25 + game.getEffect("shipLimit") * game.bld.get("reactor").on;
				var ratio = 1 + game.getLimitedDR(cargoShips.effects["harborRatio"] * shipVal, limit);

				effects["catnipMax"] *= ratio;
				effects["woodMax"] *= ratio;
				effects["mineralsMax"] *= ratio;
				effects["coalMax"] *= ratio;
				effects["ironMax"] *= ratio;
				effects["titaniumMax"] *= ratio;
				effects["goldMax"] *= ratio;
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
			"coalPerTickBase": 0,
			"cathPollutionPerTickProd": 0
		},
		calculateEffects: function(self, game){
			var effects = {
				"mineralsRatio": 0.2,
				"coalPerTickBase": 0,
				"cathPollutionPerTickProd": 0.08
			};

			if (game.workshop.get("deepMining").researched){
				//fun but ugly hack
				effects["coalPerTickBase"] = 0.003;
			}

			self.effects = effects;
			self.togglable = game.science.get("ecology").researched;
		},
		flavor: $I("buildings.mine.flavor"),
		unlockScheme: {
			name: "anthracite",
			threshold: 92 // 92% carbon content in coal to have anthracite
		}
	},{
		name: "quarry",
		label: $I("buildings.quarry.label"),
		description: $I("buildings.quarry.desc"),
		unlockRatio: 0.3,
		prices: [
			{ name : "slab", val: 1000 },
			{ name : "steel", val: 125 },
			{ name : "scaffold", val: 50 }
		],
		priceRatio: 1.15,
		effects: {
			"mineralsRatio": 0.35,
			"coalPerTickBase": 0.015,
			"uraniumPerTickBase": 0,
			"cathPollutionPerTickProd": 0.25
		},
		calculateEffects: function(self, game){
			var effects = {
				"mineralsRatio": 0.35,
				"coalPerTickBase": 0.015,
				"uraniumPerTickBase": 0,
				"cathPollutionPerTickProd": 0.25
			};
			if (game.workshop.get("orbitalGeodesy").researched){
				effects["uraniumPerTickBase"] = 0.0005; //4% of accelerator output
			}
			self.effects = effects;
			self.togglable = game.science.get("ecology").researched;
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
			"woodPerTickCon": 0,
			"mineralsPerTickCon": 0,
			"coalPerTickAutoprod": 0,
			"ironPerTickAutoprod": 0,
			"titaniumPerTickAutoprod": 0,
			"goldPerTickAutoprod": 0,
			"cathPollutionPerTickProd": 0.15
		},
		effectsCalculated: {},
		lackResConvert: false,
		calculateEffects: function(self, game) {
			var smelterRatio = (1 + game.getEffect("smelterRatio"));
			self.effects["ironPerTickAutoprod"] = 0.02 * smelterRatio;

			if (game.workshop.get("goldOre").researched){
				self.effects["goldPerTickAutoprod"] = 0.001;
			}else{
				self.effects["goldPerTickAutoprod"] = 0;
			}

			if (game.workshop.get("coalFurnace").researched){
				self.effects["coalPerTickAutoprod"] = 0.005 * smelterRatio;
			}else{
				self.effects["coalPerTickAutoprod"] = 0;
			}

			if (game.workshop.get("nuclearSmelters").researched){
				self.effects["titaniumPerTickAutoprod"] = 0.0015;
			}else{
				self.effects["titaniumPerTickAutoprod"] = 0;
			}

			self.effects["woodPerTickCon"] = -0.05;
			self.effects["mineralsPerTickCon"] = -0.1;

			for (var i in self.effects) {
				self.effectsCalculated[i] = self.effects[i];
			}
		},
		action: function(self, game){
			// TODO: How to integrate autoProdRatio with calculateEffects?

			if (self.on < 1){
				return;
			}

			//safe switch for IW to save precious resources, as per players request
			//only if option is enabled, because Chris says so
			var iron = game.resPool.get("iron");
			if (game.ironWill && game.opts.IWSmelter && iron.value > iron.maxValue * 0.95){
				self.on = 0;
				return;
			}

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "wood", amt: -self.effectsCalculated["woodPerTickCon"]},
				 {res: "minerals", amt: -self.effectsCalculated["mineralsPerTickCon"]}],
				self.on
			);
			for (var i in self.effects) {
				if (i == "woodPerTickCon" ||
					i == "mineralsPerTickCon" ||
					i == "coalPerTickAutoprod" ||
					i == "ironPerTickAutoprod" ||
					i == "titaniumPerTickAutoprod" ||
					i == "goldPerTickAutoprod" ) {
					self.effects[i] = self.effectsCalculated[i] * amt;
				}
			}

			return amt;
		},
		flavor: $I("buildings.smelter.flavor")
	},{
		name: "calciner",
		label: $I("buildings.calciner.label"),
		description: $I("buildings.calciner.desc"),
		prices: [
			{ name : "titanium",  val: 15 },
			{ name : "oil",  val: 500 },
			{ name : "steel", val: 100 },
			{ name : "blueprint",  val: 1 }
		],
		priceRatio: 1.15,
		effects: {
			"mineralsPerTickCon" : -1.5,
			"coalPerTickCon": 0,
			"ironPerTickCon" : 0,
			"ironPerTickAutoprod" : 0.15,
			"titaniumPerTickAutoprod" : 0.0005,
			"oilPerTickCon" : -0.024,
			"steelPerTickProd": 0,
			"energyConsumption" : 1,
			"cathPollutionPerTickProd": 1
		},
		calculateEffects: function(self, game) {
			self.basicProductionCalculation(self, game);
			self.steelProductionCalculation(self, game);
		},
		effectsCalculated: {},
		basicProductionCalculation: function(self, game) {
			self.effects["mineralsPerTickCon"] = -1.5;
			self.effects["oilPerTickCon"] = -0.024; //base + 0.01
			var calcinerRatio = game.getEffect("calcinerRatio");
			self.effects["ironPerTickAutoprod"] = 0.15 * ( 1 + calcinerRatio );
			self.effects["titaniumPerTickAutoprod"] = 0.0005 * ( 1 + calcinerRatio * 3 );

			self.effectsCalculated["mineralsPerTickCon"] = self.effects["mineralsPerTickCon"];
			self.effectsCalculated["oilPerTickCon"] = self.effects["oilPerTickCon"];
			self.effectsCalculated["ironPerTickAutoprod"] = self.effects["ironPerTickAutoprod"];
			self.effectsCalculated["titaniumPerTickAutoprod"] = self.effects["titaniumPerTickAutoprod"];
		},
		isAutomationEnabled: null,
		steelProductionCalculation: function(self, game, calledByAction) {
			self.effects["coalPerTickCon"] = 0;
			self.effects["ironPerTickCon"] = 0;
			self.effects["steelPerTickProd"] = 0;

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

					//necrocracy global effect
					difference *= (1 + (game.resPool.get("sorrow").value * game.getEffect("blsProductionBonus")));
					//policy ratio effects
					difference *= (1 + game.getEffect("ironPolicyRatio"));

					self.effects["coalPerTickCon"] = -difference;
					self.effects["ironPerTickCon"] = -difference;
					self.effects["steelPerTickProd"] = difference / 100;

					if(calledByAction){
						var amt = game.resPool.getAmtDependsOnStock(
							[{res: "coal", amt: -self.effects["coalPerTickCon"]},
							{res: "iron", amt: -self.effects["ironPerTickCon"]}],
							self.on
						);

						self.effects["coalPerTickCon"] *= amt;
						self.effects["ironPerTickCon"] *= amt;

						// Automated production, metallurgist leader won't help here
						self.effects["steelPerTickProd"] *= amt * (1 + game.getCraftRatio() * game.getEffect("calcinerSteelCraftRatio") + game.bld.get("reactor").on * game.getEffect("calcinerSteelReactorBonus"));

						return amt;
					}
					else{
						self.effects["steelPerTickProd"] *= (1 + game.getCraftRatio() * game.getEffect("calcinerSteelCraftRatio") + game.bld.get("reactor").on * game.getEffect("calcinerSteelReactorBonus"));
					}
				}
			}
			return -1;
		},
		lackResConvert: false,
		action: function(self, game){
			// TODO: How to integrate autoProdRatio with calculateEffects?

			if (self.on < 1){
				return;
			}

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "minerals", amt: -self.effectsCalculated["mineralsPerTickCon"]},
				 {res: "oil", amt: -self.effectsCalculated["oilPerTickCon"]}],
				self.on
			);
			self.effects["mineralsPerTickCon"] = self.effectsCalculated["mineralsPerTickCon"] * amt;
			self.effects["oilPerTickCon"] = self.effectsCalculated["oilPerTickCon"] * amt;
			self.effects["ironPerTickAutoprod"] = self.effectsCalculated["ironPerTickAutoprod"] * amt;
			self.effects["titaniumPerTickAutoprod"] = self.effectsCalculated["titaniumPerTickAutoprod"] * amt;

			var amtFinal = amt;

			//self.effects["coalPerTickAutoprod"] = self.effects["ironPerTickAutoprod"] * game.getEffect("calcinerCoalRatio");

			amt = self.steelProductionCalculation(self, game, true);
			if (amt > -1){
				amtFinal = (amt + amtFinal)/2;
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
			"coalRatioGlobal" : 0,
			"manuscriptPerTickProd": 0,
			"energyProduction": 1,
			"magnetoBoostRatio": 0.15,
			"cathPollutionPerTickProd": 1
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
		isAutomationEnabled: null,
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

			var newCrafter = function(consumedResource, craftedResourceName, isAllowed) {
				var consumedQuantity = consumedResource.value * automationRate;
				return {
					numberOfCrafts: isAllowed && consumedResource.value >= consumedResource.maxValue * (1 - baseAutomationRate)
						? Math.max(0, Math.floor(consumedQuantity / game.workshop.getCraft(craftedResourceName).prices[0].val))
						: 0,
					craft: function() {
						if (this.numberOfCrafts > 0) {
							game.workshop.craft(craftedResourceName, this.numberOfCrafts);
							// Automated production, metallurgist leader won't help here
							game.msg($I("bld.msg.automation." + craftedResourceName + "s", [game.getDisplayValueExt(consumedQuantity), game.getDisplayValueExt(this.numberOfCrafts * (1 + game.getCraftRatio()))]), null, "workshopAutomation", true);
						}
					}
				};
			};

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

			beamCrafter.craft();
			slabCrafter.craft();
			plateCrafter.craft();
			game.msg($I("bld.msg.automation"), null, "workshopAutomation");
		},
		flavor: $I("buildings.steamworks.flavor")
	},{
		name: "magneto",
		label: $I("buildings.magneto.label"),
		description: $I("buildings.magneto.desc"),
		prices: [
			{ name : "gear",  val: 5 },
			{ name : "alloy", val: 10 },
			{ name : "blueprint",  val: 1 }
		],
		priceRatio: 1.25,
		effects: {
			"oilPerTick" : -0.05,
			"energyProduction" : 5,
			"magnetoRatio": 0.02,
			"cathPollutionPerTickProd": 5
		},
		action: function(self, game){
			var oil = game.resPool.get("oil");
			if (oil.value + self.effects["oilPerTick"] <= 0){
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
			{name : "minerals", val: 250},
			{name : "iron", val: 50}
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
			"energyConsumption": 0,
			"cathPollutionPerTickProd": 0
		},
		isAutomationEnabled: null,
		calculateEffects: function(self, game) {
			var hasPumpjack = game.workshop.get("pumpjack").researched;
			self.togglable = hasPumpjack;
			if (self.isAutomationEnabled == null && hasPumpjack) {
				self.isAutomationEnabled = true;
			}

			var oilRatio = 1 + game.getEffect("oilWellRatio");
			if (self.isAutomationEnabled == false) {
				oilRatio -= game.workshop.get("pumpjack").effects["oilWellRatio"];
			}
			self.effects["oilPerTickBase"] = 0.02 * oilRatio;

			self.effects["energyConsumption"] = self.isAutomationEnabled
				? 1 : 0;
			self.effects["cathPollutionPerTickProd"] = self.isAutomationEnabled
				? 1 : 0;
		},
		flavor: $I("buildings.oilWell.flavor"),
		unlockScheme: {
			name: "oil",
			threshold: 73
		}
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
		isAutomationEnabled: null,
		priceRatio: 1.15,
		effects: {
			"craftRatio": 0,
			"energyConsumption": 0,
			"cathPollutionPerTickProd": 0,
			"cathPollutionPerTickCon": 0
		},
		unlocks:{
			policies:["liberalism", "communism", "fascism"]
		},
		unlockScheme: {
			name: "factory",
			threshold: 20
		},
		calculateEffects: function(self, game){
			var effects = {
				"craftRatio": 0.05 * (1 + game.getEffect("environmentFactoryCraftBonus"))
			};

			if (game.workshop.get("factoryLogistics").researched){
				effects["craftRatio"] = 0.06 * (1 + game.getEffect("environmentFactoryCraftBonus"));
			}

			effects["energyConsumption"] = 2;
			if(game.workshop.get("carbonSequestration").researched){
				self.isAutomationEnabled = (self.isAutomationEnabled === null) ? true : self.isAutomationEnabled;
			} else {
				self.isAutomationEnabled = null;
			}
			effects["energyConsumption"] *= (self.isAutomationEnabled)? 2 : 1;
			effects["cathPollutionPerTickProd"] = (self.isAutomationEnabled)? 0: (game.workshop.get("carbonSequestration").researched)? 1 : 2;
			effects["cathPollutionPerTickCon"] = (self.isAutomationEnabled)? -2: 0;
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
		isAutomationEnabled: null,
		calculateEffects: function(self, game) {
			self.effects["uraniumPerTick"] = -0.001 * (1 - game.getEffect("uraniumRatio"));
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
			{ name : "uranium",   	val: 25   },
			{ name : "concrate",    val: 125  }
		],
		priceRatio: 1.15,
		effects: {
			"titaniumPerTickCon" : -0.015,
			"uraniumPerTickAutoprod" : 0.0025,
			"catnipMax": 0,
			"woodMax": 0,
			"mineralsMax": 0,
			"coalMax": 0,
			"ironMax": 0,
			"titaniumMax": 0,
			"goldMax": 0,
			"scienceMax": 0,
			"energyConsumption": 0
		},
		calculateEffects: function(self, game){
			self.effects["energyConsumption"] = 2;

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
			self.effects["coalMax"]     =  2500 * capRatio;
			self.effects["ironMax"]     =  7500 * capRatio;
			self.effects["titaniumMax"] =   750 * capRatio;
			self.effects["goldMax"]     =   250 * capRatio;
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
			self.effects["titaniumPerTickCon"] *= amt;
			self.effects["uraniumPerTickAutoprod"] *= amt;

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
		calculateEffects: function(self, game) {
			self.effects["standingRatio"] = game.workshop.get("caravanserai").researched ? 0.0035 : 0;
       },
		flavor: $I("buildings.tradepost.flavor")
	},{
		name: "mint",
		label: $I("buildings.mint.label"),
		description: $I("buildings.mint.desc"),
		prices: [
			{ name : "minerals", val: 5000 },
			{ name : "gold", val: 500 },
			{ name : "plate", val: 200 }
		],
		priceRatio: 1.15,
		effects: {
			"goldPerTickCon" : -0.005,
			"manpowerPerTickCon" : -0.75,
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
			self.effects["goldPerTickCon"] = -0.005; //~5 smelters
			self.effects["manpowerPerTickCon"] = -0.75;

			var manpower = game.resPool.get("manpower");
			var mpratio = (manpower.maxValue * 0.007) / 100;

			//hidden 1% boost to mints from village level
			mpratio *= (1 + game.village.map.villageLevel * 0.005);
			mpratio *= (1 + game.getEffect("mintRatio"));
			self.effects["fursPerTickProd"]  = mpratio * 1.25;	//2
			self.effects["ivoryPerTickProd"] = mpratio * 0.3;	//1.5

			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "gold", amt: -self.effects["goldPerTickCon"]},
				 {res: "manpower", amt: -self.effects["manpowerPerTickCon"]}],
				self.on
			);
			self.effects["goldPerTickCon"] *= amt;
			self.effects["manpowerPerTickCon"] *= amt;
			self.effects["fursPerTickProd"] *= amt;
			self.effects["ivoryPerTickProd"] *= amt;

			return amt;
		},
		unlockScheme: {
			name: "gold",
			threshold: 24
		}
	},{
		name: "brewery",
		label: $I("buildings.brewery.label"),
		description: $I("buildings.brewery.desc"),
		unlockRatio: 0.2,
		prices: [
			{ name : "wood", val: 1000 },
			{ name : "culture", val: 750 },
			{ name : "spice", val: 5 },
			{ name : "parchment", val: 375 }
		],
		priceRatio: 1.5,
		effects: {
			"catnipPerTickCon" : -1,
			"spicePerTickCon" : -0.1,
			"festivalRatio" : 0.01,
			"festivalArrivalRatio" : 0.001
		},
		effectsCalculated: {},
		togglable: true,
		lackResConvert: false,
		calculateEffects: function(self, game){
			self.effects = {
				"catnipPerTickCon" : -1 * (1 + game.getEffect("breweryConsumptionRatio")),
				"spicePerTickCon" : -0.1 * (1 + game.getEffect("breweryConsumptionRatio")),
				"festivalRatio" : 0.01,
				"festivalArrivalRatio" : 0.001
			};
			self.effectsCalculated = dojo.clone(self.effects);
		},
		action: function(self, game) {
			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "catnip", amt: -self.effectsCalculated["catnipPerTickCon"]},
				 {res: "spice", amt: -self.effectsCalculated["spicePerTickCon"]}],
				self.on
			);
			self.effects["catnipPerTickCon"] = self.effectsCalculated["catnipPerTickCon"] * amt;
			self.effects["spicePerTickCon"] = self.effectsCalculated["spicePerTickCon"] * amt;
			self.effects["festivalRatio"] = self.effectsCalculated["festivalRatio"] * amt;
			self.effects["festivalArrivalRatio"] = self.effectsCalculated["festivalArrivalRatio"] * amt;
			return amt;
		},
		flavor: $I("buildings.brewery.flavor"),
		unlocks:{
			zebraUpgrades: ["darkBrew"]
		},
		unlockScheme: {
			name: "chocolate",
			threshold: 10
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
					"unhappinessRatio" : -0.75,
					"culturePerTickBase" : 1,
					"cultureMax" : 300
				},
				stageUnlocked : false
			}
		],
        action: function(self, game){
			//very ugly and crappy stuff
			if (self.stage == 1){
				var btower = self.stages[1];

				btower.effects["culturePerTickBase"] = 1;
				btower.effects["cultureMax"] = 300;

				var energyRatio = (game.resPool.energyProd / game.resPool.energyCons);
				if (energyRatio > 1){
					if (energyRatio > 1.75){
						energyRatio = 1.75;
					}
					btower.effects["culturePerTickBase"] = Math.floor(energyRatio * 1000) / 1000;
					btower.effects["cultureMax"] = Math.floor( (300 * energyRatio) * 1000) / 1000;
				}

				var broadcastTowerRatio = game.getEffect("broadcastTowerRatio");
				var totalRatio = game.space.getBuilding("sattelite").on * broadcastTowerRatio;

				btower.effects["culturePerTickBase"] *= ( 1 + totalRatio);
				btower.effects["cultureMax"] *= ( 1 + totalRatio);
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
			if (!game.challenges.isActive("atheism")) {
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
			{ name : "gold", val: 50 },
			{ name : "slab", val: 25 },
			{ name : "plate", val: 15 },
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
			if (!game.challenges.isActive("atheism")) {
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
					effects["happiness"] = 0.4 + 0.1 * sunAltar.on;
					effects["faithMax"] += 50 * sunAltar.on;
				}

				var goldenSpire = game.religion.getRU("goldenSpire");
				if (goldenSpire.on){
					effects["faithMax"] *= (1 + (0.4 + 0.1 * goldenSpire.on));
				}

				var basilica = game.religion.getRU("basilica");
				if (basilica.on){
					effects["culturePerTickBase"] += 0.2 + 0.05 * (basilica.on - 1);
					effects["cultureMax"] = 75 + 50 * basilica.on;
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
			{ name : "scaffold", val: 50 },
			{ name : "blueprint", val: 1 },
			{ name : "megalith", val: 50 }
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
			{ name : "science", 	val: 250000 },
			{ name : "timeCrystal", val: 1 },
			{ name : "blueprint", 	val: 100 }
		],
		priceRatio: 1.25,
		effects: {
			"resStasisRatio": 0.015, //1.5% of resources will be preserved
			"temporalFluxProduction" : 0,
			"energyConsumption" : 0
		},
		upgrades: {
			voidSpace: ["cryochambers"]
		},
		calculateEffects: function(self, game) {
			self.effects["energyConsumption"] = 20;
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
			"gflopsPerTickBase": 0.02,
			"energyConsumption": 2
		},
		upgrades: {
			buildings: ["library"],
			spaceBuilding: ["moonBase"]
		},
		unlockScheme: {
			name: "cyber",
			threshold: 5
		},
		// TODO Actually "action" is almost always just updating effects (unclear from the name), better separate the 2 concerns: update effects (can be done several times per tick) and perform specific action (only once per tick!)
		// TODO Separation of concerns currently done only for AI Core, Time Boilers and Hydroponics (REQUIRED by non-proportional effect!), will be systematized later
		updateEffects: function(self, game) {
			// Core #1: 2  ; Total:  2  ; Average: 2    =  8/4 = (3*1+5)/4
			// Core #2: 3.5; Total:  5.5; Average: 2.75 = 11/4 = (3*2+5)/4
			// Core #3: 5  ; Total: 10.5; Average: 3.5  = 14/4 = (3*3+5)/4
			// Core #4: 6.5; Total: 17  ; Average: 4.25 = 17/4 = (3*4+5)/4
			// etc.
			self.effects["energyConsumption"] = (3 * self.on + 5) / 4;
            var gflopsPerTickBase = 0.02 * (1 + game.getEffect("aiCoreProductivness"));
            self.effects["gflopsPerTickBase"] = gflopsPerTickBase;
			self.effects["aiLevel"] = Math.round(Math.log(Math.max(game.resPool.get("gflops").value, 1)));
		},
		action: function(self, game) {
			game.resPool.get("gflops").value += self.effects["gflopsPerTickBase"] * self.on;
			self.updateEffects(self, game);
		},
		flavor: $I("buildings.aicore.flavor"),
		canSell: function(self, game){
			if ((game.science.getPolicy("transkittenism").researched == true) || (self.effects["aiLevel"] < 15)){
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
		effects: {
			"hunterRatio" : 0.05,
			"manpowerMax": 5,
			"zebraPreparations" : 0
		},
		calculateEffects: function(self, game){
			if(game.workshop.getZebraUpgrade("darkRevolution").researched){
				self.effects["zebraPreparations"] = game.ironWill? 1:0.1;
				//self.jammed = false;
			}
		},/*
		action: function(self, game){
			if(self.val < 1 || self.jammed){
				return
			}
			game.upgrade(
			{
				buildings: ["zebraWorkshop"]
			})
			self.jammed = true;
		},
		upgrades: {
			buildings: ["zebraWorkshop"]
		}*/
	},{
		name: "zebraWorkshop",
		label: $I("buildings.zebraWorkshop.label"),
		description: $I("buildings.zebraWorkshop.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "bloodstone", val: 5 }
		],
		unlocks: {
			zebraUpgrades:["darkRevolution"]
		},
		priceRatio: 1.15,
		zebraRequired: 10,
		effects: {
			"manpowerMax": 25,
			"bloodstoneRatio": 0
			//"bloodstoneCraftRatio" : 0.01
		},
		/* not sure how to call the upgrade yet
		"workshop.zebraUpgrade.nostalgia.label": "Nostalgia",
		"workshop.zebraUpgrade.nostalgia.desc": "No memory of finding it. Zebra workshops increase chance to find Bloodstones in hunts",
		"workshop.zebraUpgrade.nostalgia.flavor": "Bittersweet dreams",
		*/

		/*
		calculateEffects: function(self, game){
			if(game.workshop.getZebraUpgrade("nostalgia").researched){
				self.effects["bloodstoneRatio"] = 0.001 * game.getLimitedDR(self.on * (game.ironWill? 1:0.1) * (game.karmaZebras + 1), game.getEffect("zebraPreparations") + 40) / self.on;
			}
		}*/
		
	},{
		name: "zebraForge",
		label: $I("buildings.zebraForge.label"),
		description: $I("buildings.zebraForge.desc"),
		unlockRatio: 0.01,
		prices: [
			{ name : "bloodstone", val: 50 }
		],
		unlocks: {
			crafts: ["bloodstone", "tMythril"],
			zebraUpgrades: ["whispers"],
		},
		priceRatio: 1.15,
		zebraRequired: 50,
		effects: {
			//"bloodstoneCraftRatio" : 0.02,
			"manpowerMax": 50,
			"tMythrilCraftRatio" : 0.01,
		},
	},{
		name: "ivoryTemple",
		defaultUnlockable: true,
		//label: $I("buildings.ivoryTemple.label"),
		//description: $I("buildings.ivoryTemple.desc"),
		label: "Ivory Temple",
		description: "Mystical temple where ivory is converted into minerals",
		unlockRatio: 0.1,
		prices: [
			{ name : "tMythril", val: 1 },
			{ name : "ivory", val: 100 }
		],
		/*unlocks: {
			zebraUpgrades:["darkRevolution"]
		},*/
		priceRatio: 1.15,
		//zebraRequired: 10,
		effects: {
			"ivoryPerTickCon": 0,
			"mineralsPerTickProd": 0,
			"titaniumPerTickCon": 0,
			"alicornPerTickCon": 0,
			"tMythrilPerTick": 0,
			"manpowerMax": 10
		},
		lackResConvert: false,
		togglable: true,
		calculateEffects: function(self, game){
			if(game.workshop.getZebraUpgrade("whispers").researched && self.on > 0 && self.isAutomationEnabled == null){
				self.isAutomationEnabled = true;
			}
		},
		action: function(self, game){
			if (self.isAutomationEnabled){
				self.effects = {
					"ivoryPerTickCon": -200,
					"mineralsPerTickProd": 2,
					"titaniumPerTickCon": -2,
					"alicornPerTickCon": -0.00002,
					"tMythrilPerTick": 0.00005
				};
			}else {
				self.effects = {
					"ivoryPerTickCon": -100,
					"mineralsPerTickProd": 1,
					"titaniumPerTickCon": 0,
					"alicornPerTickCon": 0,
					"tMythrilPerTick": 0
				};
			}
			var amt = game.resPool.getAmtDependsOnStock(
				[{res: "ivory", amt: -self.effects["ivoryPerTickCon"]},
				{res: "titanium", amt: -self.effects["titaniumPerTickCon"]},
				{res: "alicorn", amt: -self.effects["alicornPerTickCon"]}],
				self.on
			);
			self.effects["ivoryPerTickCon"] *= amt;
			self.effects["mineralsPerTickProd"] *= amt;
			self.effects["titaniumPerTickCon"] *= amt;
			self.effects["alicornPerTickCon"] *= amt;
			self.effects["tMythrilPerTick"] *= amt;
		}
	}
	],

	effectsBase: {
		"catnipMax"		: 5000,
		"woodMax"		: 200,
		"mineralsMax"	: 250,
		"coalMax"       : 60,
		"ironMax"       : 50,
		"titaniumMax"   : 2,
		"goldMax"       : 10,
		"oilMax"        : 1500,
		"uraniumMax"	: 250,
		"unobtainiumMax": 150,
		"antimatterMax" : 100,
		"manpowerMax"	: 100,
		"scienceMax"    : 250,
		"cultureMax"	: 100,
		"faithMax" 		: 100,
		"hutFakeBought": 0,
		"logHouseFakeBought": 0,
		"mansionFakeBought": 0 //these 3 are for Post Apocalypse pollution based housing cost increase — using getEffect instead of special handling
	},
	pollutionEffects: {
		"catnipPollutionRatio" : 0,
		"pollutionHappines" : 0,
		"solarRevolutionPollution" : 0,
		"pollutionDissipationRatio" :  1e-7,
		"pollutionArrivalSlowdown": 0,
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
	getAutoProductionRatio: function() {
		var autoProdRatio = 1;

		//	Solar Revolution
		autoProdRatio *= 1 + this.game.religion.getSolarRevolutionRatio();

		//	SW
		var steamworks = this.get("steamworks");
		var swRatio = steamworks.on > 0 ? (1 + steamworks.effects["magnetoBoostRatio"] * this.get("steamworks").on) : 1;
		autoProdRatio *= 1 + this.game.getEffect("magnetoRatio") * swRatio;

		// paragon (25%)
		autoProdRatio *= 1 + this.game.prestige.getParagonProductionRatio() * 0.05;

		// reactors
		autoProdRatio *= 1 + this.game.getEffect("productionRatio");

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
		var ratio = bld.get("priceRatio");
		var ratioBase = ratio - 1;

		var ratioDiff = this.game.getEffect(bld.meta.name + "PriceRatio") +
			this.game.getEffect("priceRatio") +
			this.game.getEffect("mapPriceReduction");

		ratioDiff = this.game.getLimitedDR(ratioDiff, ratioBase);
		return ratio + ratioDiff;
	},

	/**
	 * For fucks sake, finally we have a non-concrete dynamic price calculation algorithm
	 * It only took a couple of months. TODO: potential performance impact?
	 */
	 getPrices: function(bldName, additionalBought) {
	 	var bld = this.getBuildingExt(bldName);
		return this.getPricesWithAccessor(bld, additionalBought);
	 },

	 getPricesWithAccessor: function(bld, additionalBought) {
		additionalBought = additionalBought || 0;
	 	var bldPrices = bld.get("prices");
		var ratio = this.getPriceRatioWithAccessor(bld);

		var prices = [];

		var pricesDiscount = this.game.getLimitedDR((this.game.getEffect(bld.get("name") + "CostReduction")), 1);
		var priceModifier = 1 - pricesDiscount;
		var fakeBought = this.game.getEffect(bld.get("name") + "FakeBought") + additionalBought;

		for (var i = 0; i < bldPrices.length; i++) {
			var resPriceDiscount = this.game.getLimitedDR(this.game.getEffect(bldPrices[i].name + "CostReduction"), 1);
			var resPriceModifier = 1 - resPriceDiscount;
			prices.push({
				val: bldPrices[i].val * Math.pow(ratio, bld.get("val") + fakeBought) * priceModifier * resPriceModifier,
				name: bldPrices[i].name
			});
		}

		if (this.game.challenges.isActive("blackSky")
		 && bld.get("name") == "calciner"
		 && bld.get("val") == 0) {
			for (var i = 0; i < prices.length; i++) {
				prices[i].val *= prices[i].name == "titanium" ? 0 : 11;
			}
		}

		if (this.game.challenges.isActive("pacifism")
		 && bld.get("name") == "steamworks"
		 && bld.get("val") == 0) {
			for (var i = 0; i < prices.length; i++) {
				if (prices[i].name == "blueprint"){
					prices[i].val = this.game.challenges.getChallenge("pacifism").on * 5 + 1;
				}
			}
		}
		if (this.game.challenges.isActive("postApocalypse")
		&& bld.get("name") == "field"
		&& this.getPollutionLevel() >= 5
		&& bld.get("val") >= 95 - this.game.time.getVSU("usedCryochambers").val - this.getPollutionLevel() ) {
			var builtWithUnobtanium = Math.max(bld.get("val") + this.game.time.getVSU("usedCryochambers").val - 100, 0);
			prices.push({val: 15 * Math.pow(ratio, builtWithUnobtanium),
						name : "unobtainium",
						isTemporary: true //can't exploit buy manipulating pollution in postApocalypse
					});
		}
		return prices;
	 },


	calculatePollutionEffects: function(){
		var POL_LBASE = this.getPollutionLevelBase();

		var pollutionLevel = this.getPollutionLevel();
		var pollution = this.cathPollution;
		//post apocalypse effects
		if(this.game.challenges.isActive("postApocalypse")){
			this.game.bld.pollutionEffects["pollutionDissipationRatio"] = 0;
			if(pollutionLevel > 8){
				this.game.bld.effectsBase["hutFakeBought"] = pollutionLevel - 8;
				this.game.bld.effectsBase["logHouseFakeBought"] = pollutionLevel - 8;
				this.game.bld.effectsBase["mansionFakeBought"] = pollutionLevel - 8;
			}else{
				this.game.bld.effectsBase["hutFakeBought"] = 0;
				this.game.bld.effectsBase["logHouseFakeBought"] = 0;
				this.game.bld.effectsBase["mansionFakeBought"] = 0;
			}
		}
		
		if(pollutionLevel >= 4){
			this.pollutionEffects["catnipPollutionRatio"] = this.game.getLimitedDR(-0.5 - 0.1 * Math.log(pollution), 10)/10;
			this.pollutionEffects["pollutionHappines"] = -Math.log(pollution) * 1.2;
			this.pollutionEffects["pollutionArrivalSlowdown"] = Math.log10(this.game.bld.cathPollution) * 1.2;
			this.pollutionEffects["solarRevolutionPollution"] = -Math.min(1e-10 * (pollution - POL_LBASE * 1000)/9, 1); //linear HERE AND ONLY HERE
		}
		else if(pollutionLevel == 3){
			this.pollutionEffects["catnipPollutionRatio"] = this.game.getLimitedDR(-0.5 - 0.1 * Math.log(pollution), 10)/10;
			this.pollutionEffects["pollutionHappines"] =-Math.log(pollution) * 1.18;
			this.pollutionEffects["pollutionArrivalSlowdown"] = Math.log10(this.game.bld.cathPollution) * 1.11;
			this.pollutionEffects["solarRevolutionPollution"] = 0;
		}
		else if(pollutionLevel == 2){
			this.pollutionEffects["catnipPollutionRatio"] = this.game.getLimitedDR(-0.5 - 0.1 * Math.log(pollution), 10)/10;
			this.pollutionEffects["pollutionHappines"] = -Math.log(pollution) * 1.08;
			this.pollutionEffects["pollutionArrivalSlowdown"] =
				((pollution >= POL_LBASE * 100 / 2) ? 1 + 1.68e-8 * (pollution - POL_LBASE * 100 / 2): 0); //linear
			this.pollutionEffects["solarRevolutionPollution"] = 0;
		}
		else if(pollutionLevel == 1){
			this.pollutionEffects["catnipPollutionRatio"] =
			-0.2 - ((pollution - POL_LBASE) * 0.05 / (POL_LBASE * 10));	//linear between -0.2 : -0.25;

			this.pollutionEffects["pollutionHappines"] =
				((pollution >= POL_LBASE * 10 / 2) ? -0.00000032 * (pollution - POL_LBASE * 10 / 2) : 0); //linear
			this.pollutionEffects["pollutionArrivalSlowdown"] = 0;
			this.pollutionEffects["solarRevolutionPollution"] = 0;
		}
		else if(pollutionLevel == 0){
			//0% at 50% pollution, -20% at lvl 1
			this.pollutionEffects["catnipPollutionRatio"] = (pollution >= POL_LBASE/2) ?
				(
					-0.2 * (pollution - POL_LBASE/2) / (POL_LBASE/2)
				) : 0 ; //linear between 0 : -0.2 with first 50% zero
			this.pollutionEffects["pollutionHappines"] = 0;
			this.pollutionEffects["pollutionArrivalSlowdown"] = 0;
			this.pollutionEffects["solarRevolutionPollution"] = 0;
		}

		//limit negative ratios with 75%
		if (this.pollutionEffects["catnipPollutionRatio"] < -0.75){
			this.pollutionEffects["catnipPollutionRatio"] = -0.75;
		}
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
					bld.lackResConvert = amt != 1 && bld.on != 0;
				}
			}

		}

		this.calculatePollutionEffects();

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
		saveData.cathPollution = this.cathPollution;
	},

	load: function(saveData){
		this.groupBuildings = saveData.bldData ? saveData.bldData.groupBuildings : false;
		this.twoRows = saveData.bldData ? saveData.bldData.twoRows : false;
		this.loadMetadata(this.buildingsData, saveData.buildings);
		this.cathPollution = saveData.cathPollution|| 0;
		this.calculatePollutionEffects();
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

			this.resetStateStackable(bld);
		}

		this.cathPollution = 0;
		this.cathPollutionPerTick = 0;
	},
	//pollution functions:
	getCleanEnergy: function(){
		var solarFarm = this.getBuildingExt("pasture").meta;
		var hydroPlant = this.getBuildingExt("aqueduct").meta;
		var reactor = this.getBuildingExt("reactor").meta;
		var sattelite = this.game.space.getBuilding("sattelite");
		var cleanEnergyProduced = (solarFarm.stage == 1 && solarFarm.stages[1].effects)? solarFarm.stages[1].effects["energyProduction"] * solarFarm.on : 0;
		cleanEnergyProduced += (hydroPlant.stage == 1 && hydroPlant.stages[1].effects)? hydroPlant.stages[1].effects["energyProduction"] * hydroPlant.on : 0;
		cleanEnergyProduced += reactor.effects["energyProduction"] * reactor.on / 2;
		cleanEnergyProduced += sattelite.effects["energyProduction"] * sattelite.on;
		return cleanEnergyProduced;
	},
	getPollutingEnergy: function () {
		var magneto = this.getBuildingExt("magneto").meta;
		var steamworks = this.getBuildingExt("steamworks").meta;
		var polutinEnergy = magneto.effects["energyProduction"] * magneto.on + steamworks.effects["energyProduction"] * steamworks.on;
		return polutinEnergy;
	},
	getCleanEnergyProdRatio: function(){
		if(!(this.getCleanEnergy() + this.getPollutingEnergy())) {return 0;}
		return this.getCleanEnergy() / (this.getCleanEnergy() + this.getPollutingEnergy());
	},
	getPollutionRatio: function() {
		return 1 - this.getCleanEnergyProdRatio() / 2;
	},

	getPollutionLevelBase: function(){
		return 10000000;
	},

	getPollutionLevel: function(cathPollution) {
		if(cathPollution == undefined) {cathPollution = this.cathPollution;}
		if(cathPollution <= 0){return 0;}
		return Math.max(Math.floor(Math.log10(cathPollution * 10 / this.getPollutionLevelBase())), 0);
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

	refineCatnip: function() {
		var craftRatio = this.game.getResCraftRatio("wood");
		this.game.resPool.addResEvent("wood", 1 + craftRatio);
	},

	getUndissipatedPollutionPerTick: function(){
		return this.game.getEffect("cathPollutionPerTickProd") * this.getPollutionRatio() * (1 + this.game.getEffect("cathPollutionRatio")) + this.game.getEffect("cathPollutionPerTickCon");
	},
	cacheCathPollutionPerTick: function(){
		this.cathPollutionPerTick = this.getUndissipatedPollutionPerTick() - this.cathPollution * this.pollutionEffects["pollutionDissipationRatio"];
	},
	getEquilibriumPollution: function(){ //returns pollution value at which pollutionDissipationRatio will make pollutionPerTick equal to 0, or -1 if such value doesn't exits
		if (this.pollutionEffects["pollutionDissipationRatio"]){
			return this.getUndissipatedPollutionPerTick() / this.pollutionEffects["pollutionDissipationRatio"];
		} else if(this.cathPollutionPerTick < 0) {
			return 0;
		} else if(this.cathPollutionPerTick == 0) {
			return this.cathPollution;
		} else if(this.cathPollutionPerTick > 0) {
			return Number.POSITIVE_INFINITY;
		} else {
			console.log("No equilibrium found");
			return -1;
		}
	},
	setEquilibriumPollution: function(){
		var equilibriumPollution = this.getEquilibriumPollution();
		if(equilibriumPollution != -1) {
			this.cathPollution = equilibriumPollution;
		}
	},
	cathPollutionFastForward: function(ticks, simplified){
		if(simplified || !this.pollutionEffects["pollutionDissipationRatio"]) {
			this.cathPollution += this.cathPollutionPerTick * ticks;
		}
		else {
			/*t = time in ticks, p = pollution, UPPT — undissipated pollution per tick, pdr — pollution dissipation ratio
			solved differential equation:
				p(t = 0) = this.cathPollution
				d(p)/dt = UPPT + pdr * p
			*/
			var pdr = - this.pollutionEffects["pollutionDissipationRatio"];
			var expon = Math.exp(pdr * ticks);
			var uppt = this.getUndissipatedPollutionPerTick();
			this.cathPollution = Math.max(((this.cathPollution * pdr + uppt) * expon - uppt) / pdr, 0);
		}
	},
	
	fastforward: function(daysOffset) {
		var game = this.game;

		this.cacheCathPollutionPerTick();
		this.cathPollutionFastForward(daysOffset * game.calendar.ticksPerDay);

		var steamworks = this.get("steamworks");
		if (steamworks.on < 1 || !game.workshop.get("factoryAutomation").researched) {
			return;
		}

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
		if(game.opts.enableRedshiftGflops){
			var aiCore = this.get("aiCore");
			game.resPool.get("gflops").value += aiCore.effects["gflopsPerTickBase"] * aiCore.on * daysOffset * game.calendar.ticksPerDay;
		}
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
			visible: catnipVal >= (catnipCost * 100),
			handler: function(btn){
				self.handleX100Click(model);
			}
		};
		return model;
	},

	handleX100Click: function(model) {
		var catnipVal = this.game.resPool.get("catnip").value;
		var catnipCost = model.prices[0].val;

		if (catnipVal < 100 * catnipCost) {
			this.game.msg($I("craft.msg.notEnoughCatnip"));
		}

		this.game.resPool.addResEvent("catnip", -100 * catnipCost);

		var craftRatio = this.game.getResCraftRatio("wood");
		this.game.resPool.addResEvent("wood", 100 * (1 + craftRatio));
	}
});

dojo.declare("classes.game.ui.RefineCatnipButton", com.nuclearunicorn.game.ui.ButtonModern, {
	x100Href: null,

	update: function(){
		this.inherited(arguments);
	    // -------------- x100 ----------------

		if (!this.x100Href){
			this.x100Href = this.addLink(this.model.x100Link);
		} else {
			dojo.style(this.x100Href.link, "display", !this.model.x100Link.visible ? "none" : "");
		}

	}

});

dojo.declare("classes.ui.btn.BuildingBtnModernController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
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
		if (meta.almostLimited){
			name = "* " + name + " *";
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

	sell: function(event, model){
		var selled = this.inherited(arguments);
		if (selled) {
			var undo = this.game.registerUndoChange();
			undo.addEvent("building", {
				action: "sell",
				metaId: model.metadata.name,
				val: 1
			});
		}
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

	getTotalEffects: function(model){
		return this.getMetadataRaw(model).totalEffectsCached;
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
				if (!this.game.opts.hideDowngrade) {
					stageLinks.push( {title: "v", handler: downgradeHandler, enabled: true});
				}
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
		if (this.game.opts.noConfirm) {
			this.deltagrade(this, model, -1);
		} else {
			var self = this;
			this.game.ui.confirm("", $I("buildings.downgrade.confirmation.msg"), function() {
				self.deltagrade(self, model, -1);
			});
		}
	},

	upgrade: function(model) {
		if (this.game.opts.noConfirm) {
			this.deltagrade(this, model, +1);
		} else {
			var self = this;
			this.game.ui.confirm("", $I("buildings.upgrade.confirmation.msg"), function() {
				self.deltagrade(self, model, +1);
			});
		}
	},

	deltagrade: function(self, model, delta) {
		var metadataRaw = self.getMetadataRaw(model);
		metadataRaw.stage += delta;
		if (!metadataRaw.stage) {metadataRaw.stage = Math.max(0, delta);}

		metadataRaw.val = 0;	//TODO: fix by using separate value flags
		metadataRaw.on = 0;
		if (metadataRaw.calculateEffects){
			metadataRaw.calculateEffects(metadataRaw, self.game);
		}
		self.game.upgrade(metadataRaw.upgrades);
		self.game.render();
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
			this.stageLinks.push(this.addLink(linkModel));
		}
	},
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
		if (this.game.ironWill && this.game.libraryTab.visible){
			groups.unshift({
				name: "iw",
				title: "IW",
				buildings: []
			});
		}
		groups.unshift({
			name: "togglable",
			title: $I("ui.filter.togglable"),
			buildings: []
		});
		groups.unshift({
			name: "allEnabled",
			title: $I("ui.filter.enabled"),
			buildings: []
		});
		groups.unshift({
			name: "available",
			title: $I("ui.filter.available"),
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
		for (var i = 0; i < groups.length; i++){
			var isActiveGroup = (groups[i].name == this.activeGroup);

			var hasVisibleBldngs = false;
			for (var j = 0; j < groups[i].buildings.length; j++){
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
		this.children = [];

		this.twoRows = (this.activeGroup == "all" || this.activeGroup == "iw");
		this.initRenderer(groupContainer);

		for( var i = 0; i < this.bldGroups.length; i++){
			if (this.bldGroups[i].group.name != this.activeGroup){
				if (this.activeGroup != "all" &&
					this.activeGroup != "available" &&
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

			for (var j = 0; j < group.buildings.length; j++){
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

				if (this.activeGroup == "available") {
					if (mdl.resourceIsLimited) {
						continue;
					}
				}
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

				this.addChild(btn);
			}
		}

		for (var i = 0; i < this.children.length; i++){
			var buttonContainer = this.twoRows ?
						this.getElementContainer(i) : groupContainer;
			this.children[i].render(buttonContainer);
		}
	},

	addCoreBtns: function(container){

		var btn = new com.nuclearunicorn.game.ui.ButtonModern({
			name:	 $I("buildings.gatherCatnip.label"),
			controller: new classes.game.ui.GatherCatnipButtonController(this.game),
			description: $I("buildings.gatherCatnip.desc"),
			twoRow: this.twoRows
		}, this.game);
		this.addChild(btn);

		var isEnriched = btn.game.workshop.get("advancedRefinement").researched;
		var self = this;
		var btn = new classes.game.ui.RefineCatnipButton({
			name: 		$I("buildings.refineCatnip.label"),
			controller: new classes.game.ui.RefineCatnipButtonController(this.game),
			handler: 	function(btn){
				self.game.bld.refineCatnip();
			},
			description: $I("buildings.refineCatnip.desc"),
			prices: [ { name : "catnip", val: (isEnriched ? 50 : 100) }],
			twoRow: this.twoRows
		}, this.game);
		this.addChild(btn);
	},

	update: function(){
		this.inherited(arguments);
	}
});
