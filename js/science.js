/**
 * Weird cat science
 */
dojo.declare("classes.managers.ScienceManager", com.nuclearunicorn.core.TabManager, {

	game: null,

	hideResearched: false,

	//list of technologies
	techs:[{
		name: "calendar",
		label: $I("science.calendar.label"),
		description: $I("science.calendar.desc"),
		effectDesc: $I("science.calendar.effectDesc"),
		prices: [{name : "science", val: 30}],
		unlocks: {
			tabs: ["time"],
			tech: ["agriculture"]
		},
        flavor: $I("science.calendar.flavor")

	}, {
		name: "agriculture",
		label: $I("science.agriculture.label"),
		description: $I("science.agriculture.desc"),
		effectDesc: $I("science.agriculture.effectDesc"),
		prices: [{name : "science", val: 100}],
		unlocks: {
			buildings: ["barn"],
			jobs: ["farmer"],
			tech: ["mining", "archery"]
		},
        flavor: $I("science.agriculture.flavor")
	}, {
		name: "archery",
		label: $I("science.archery.label"),
		description: $I("science.archery.desc"),
		effectDesc: $I("science.archery.effectDesc"),
		prices: [{name : "science", val: 300}],
		unlocks: {
			buildings: ["zebraOutpost", "zebraWorkshop", "zebraForge"],
			jobs: ["hunter"],
			tech: ["animal"]
		},
		flavor: $I("science.archery.flavor")
	}, {
		name: "mining",
		label: $I("science.mining.label"),
		description: $I("science.mining.desc"),
		effectDesc: $I("science.mining.effectDesc"),
		prices: [{name : "science", val: 500}],
		unlocks: {
			buildings: ["mine", "workshop"],
			tech: ["metal"],
			upgrades: ["bolas"]
		},
		flavor: $I("science.mining.flavor")
	}, {
		name: "metal",
		label: $I("science.metal.label"),
		description: $I("science.metal.desc"),
		effectDesc: $I("science.metal.effectDesc"),
		prices: [{name : "science", val: 900}],
		unlocks: {
			buildings: ["smelter"],
			upgrades: ["huntingArmor"]
		}
	},
	{
		name: "animal",
		label: $I("science.animal.label"),
		description: $I("science.animal.desc"),
		effectDesc: $I("science.animal.effectDesc"),
		prices: [{name : "science", val: 500}],	//mostly does nothing, so price is lower
		unlocks: {
			buildings: ["pasture", "unicornPasture"],
			tech: ["civil", "math", "construction"]
			//crafts: ["leather"]
		}
	}, {
		/*==============	NOT USED ANYMORE   ============*/
		name: "brewery",
		label: $I("science.brewery.label"),
		description: $I("science.brewery.desc"),
		effectDesc: $I("science.brewery.effectDesc"),
		prices: [{name : "science", val: 1200 }]
	},
	//--------------------------------------------------
	{
		name: "civil",
		label: $I("science.civil.label"),
		description: $I("science.civil.desc"),
		effectDesc: $I("science.civil.effectDesc"),
		prices: [{name : "science", val: 1500}],
		unlocks: {
			tech: ["currency"]	//currency
		},
		flavor: $I("science.civil.flavor")
	}, {
		name: "math",
		label: $I("science.math.label"),
		description: $I("science.math.desc"),
		effectDesc: $I("science.math.effectDesc"),
		prices: [{name : "science", val: 1000}],
		unlocks: {
			tabs: ["stats"],
			buildings: ["academy"],
			upgrades: ["celestialMechanics"]
		},
		flavor: $I("science.math.flavor")
	}, {
		name: "construction",
		label: $I("science.construction.label"),
		description: $I("science.construction.desc"),
		effectDesc: $I("science.construction.effectDesc"),
		prices: [{name : "science", val: 1300}],
		unlocks: {
			buildings: ["logHouse", "warehouse", "lumberMill", "ziggurat"],
			tech: ["engineering"],
			upgrades: ["compositeBow", "advancedRefinement", "reinforcedSaw"]
		},
		flavor: $I("science.construction.flavor")
	}, {
		name: "engineering",
		label: $I("science.engineering.label"),
		description: $I("science.engineering.desc"),
		effectDesc: $I("science.engineering.effectDesc"),
		prices: [{name : "science", val: 1500}],
		unlocks: {
			buildings: ["aqueduct"],
			tech: ["writing"],
            policies: ["stripMining", "clearCutting", "environmentalism"],
		}
	}, {
		name: "currency",
		label: $I("science.currency.label"),
		description: $I("science.currency.desc"),
		effectDesc: $I("science.currency.effectDesc"),
		prices: [{name : "science", val: 2200}],
		unlocks: {
			buildings: ["tradepost"],
            policies: ["diplomacy", "isolationism"],
			upgrades: ["goldOre"]
		}
	}, {
		name: "writing",
		label: $I("science.writing.label"),
		description: $I("science.writing.desc"),
		effectDesc: $I("science.writing.effectDesc"),
		prices: [{name : "science", val: 3600}],
		unlocks: {
			buildings: ["amphitheatre"],
			tech: ["philosophy", "machinery", "steel"],
			policies: ["liberty", "tradition"],
			upgrades: ["register"],
			crafts: ["parchment"]
		},
		flavor: $I("science.writing.flavor")
	}, {
		name: "philosophy",
		label: $I("science.philosophy.label"),
		description: $I("science.philosophy.desc"),
		effectDesc: $I("science.philosophy.effectDesc"),
		prices: [{name : "science", val: 9500}],
		unlocks: {
			buildings: ["temple"],
			tech: ["theology"],
            policies: ["stoicism", "epicurianism"],
			crafts: ["compedium"]
		},
		flavor: $I("science.philosophy.flavor")
	}, {
		name: "machinery",
		label: $I("science.machinery.label"),
		description: $I("science.machinery.desc"),
		effectDesc: $I("science.machinery.effectDesc"),
		prices: [{name : "science", val: 15000}],
		unlocks: {
			buildings: ["steamworks"],
			upgrades: ["printingPress", "factoryAutomation", "crossbow"]
		}
	}, {
		name: "steel",
		label: $I("science.steel.label"),
		description: $I("science.steel.desc"),
		effectDesc: $I("science.steel.effectDesc"),
		prices: [{name : "science", val: 12000}],
		unlocks: {
			upgrades: ["deepMining", "coalFurnace", "combustionEngine",
						"reinforcedWarehouses", "steelAxe", "steelArmor"],
			crafts: ["steel"]
		}
	}, {
		name: "theology",
		label: $I("science.theology.label"),
		description: $I("science.theology.desc"),
		effectDesc: $I("science.theology.effectDesc"),
		prices: [
			{name : "science", val: 20000},
			{name: 	"manuscript", val: 35}
		],
		unlocks: {
			jobs: ["priest"],
			tech: ["astronomy", "cryptotheology"]
		},
		upgrades: {
			buildings: ["temple"]
		},
        flavor: $I("science.theology.flavor")
	}, {
		name: "astronomy",
		label: $I("science.astronomy.label"),
		description: $I("science.astronomy.desc"),
		effectDesc: $I("science.astronomy.effectDesc"),
		prices: [
			{name : "science", val: 28000},
			{name: 	"manuscript", val: 65}
		],
		unlocks: {
			buildings: ["observatory"],
			tech: ["navigation"]
        },
        upgrades:{
           policies: ["diplomacy", "isolationism"]
        },
           //for things that need double unlocks:
        calculateEffects: function(self, game){
           if(game.science.getPolicy("diplomacy").researched){
                self.unlocks["policies"] = ["knowledgeSharing", "culturalExchange"];
           }
           if(game.science.getPolicy("isolationism").researched){
                self.unlocks["policies"] = ["bigStickPolicy", "cityOnAHill"];
		   }
		   if(self.researched){
			   game.unlock(self.unlocks);
		   }
        }
	}, {
		name: "navigation",
		label: $I("science.navigation.label"),
		description: $I("science.navigation.desc"),
		effectDesc: $I("science.navigation.effectDesc"),
		prices: [
			{name : "science", val: 35000},
			{name: 	"manuscript", val: 100}
		],
		unlocks: {
			buildings: ["harbor"],
			tech: ["physics", "archeology", "architecture"],
			upgrades: ["caravanserai", "cargoShips", "astrolabe",
						"titaniumMirrors", "titaniumAxe"],
			crafts: ["ship"]
		}
	}, {
		name: "architecture",
		label: $I("science.architecture.label"),
		description: $I("science.architecture.desc"),
		effectDesc: $I("science.architecture.effectDesc"),
		prices: [
			{name : "science", val: 42000},
			{name: 	"compedium", val: 10}
		],
		unlocks: {
			buildings: ["mansion", "mint"],
			tech: ["acoustics"]
		},
		flavor: $I("science.architecture.flavor")
	}, {
		name: "physics",
		label: $I("science.physics.label"),
		description: $I("science.physics.desc"),
		effectDesc: $I("science.physics.effectDesc"),
		prices: [
			{name : "science", val: 50000},
			{name: 	"compedium", val: 35}
		],
		unlocks: {
			tech: ["chemistry", "electricity", "metaphysics"],
			upgrades: ["pneumaticPress", "pyrolysis", "steelSaw"],
			crafts: ["blueprint"]
		}
	}, {
		name: "metaphysics",
		label: $I("science.metaphysics.label"),
		description: $I("science.metaphysics.desc"),
		effectDesc: $I("science.metaphysics.effectDesc"),
		prices: [
			{name: 	"unobtainium", val: 5},
			{name : "science", val: 55000}
		],
	}, {
		name: "chemistry",
		label: $I("science.chemistry.label"),
		description: $I("science.chemistry.desc"),
		effectDesc: $I("science.chemistry.effectDesc"),
		prices: [
			{name : "science", val: 60000},
			{name: 	"compedium", val: 50}
		],
		unlocks: {
			buildings: ["calciner", "oilWell"],
			upgrades: ["alloyAxe", "alloyArmor", "alloyWarehouses", "alloyBarns"],
			crafts: ["alloy"]
		}
	}, {
		name: "acoustics",
		label: $I("science.acoustics.label"),
		description: $I("science.acoustics.desc"),
		effectDesc: $I("science.acoustics.effectDesc"),
		prices: [
			{name : "science", val: 60000},
			{name: 	"compedium", val: 60}
		],
		unlocks: {
			buildings: ["chapel"],
			tech: ["drama"]
		}
	}, {
		name: "drama",
		label: $I("science.drama.label"),
		description: $I("science.drama.desc"),
		effectDesc: $I("science.drama.effectDesc"),
		prices: [
			{name : "science", val: 90000},
			{name: 	"parchment", val: 5000}
		],
		unlocks: {
			buildings: ["brewery"]
		}
	},{
		name: "archeology",
		label: $I("science.archeology.label"),
		description: $I("science.archeology.desc"),
		effectDesc: $I("science.archeology.effectDesc"),
		prices: [
			{name : "science", val: 65000},
			{name: 	"compedium", val: 65}
		],
		unlocks: {
			buildings: ["quarry"],
			jobs: ["geologist"],
			tech: ["biology"],
			upgrades:["geodesy"]
		},
		flavor: $I("science.archeology.flavor")
	}, {
		name: "electricity",
		label: $I("science.electricity.label"),
		description: $I("science.electricity.desc"),
		effectDesc: $I("science.electricity.effectDesc"),
		prices: [
			{name : "science", val: 75000},
			{name: 	"compedium", val: 85}
		],
		unlocks: {
			buildings: ["magneto"],
			tech: ["industrialization"]
		},
		flavor: $I("science.electricity.flavor")
	}, {
		name: "biology",
		label: $I("science.biology.label"),
		description: $I("science.biology.desc"),
		effectDesc: $I("science.biology.effectDesc"),
		prices: [
			{name : "science", val: 85000},
			{name: 	"compedium", val: 100}
		],
		unlocks: {
			buildings: ["biolab"],
			tech: ["biochemistry"]
		},
		flavor: $I("science.biology.flavor")
	}, {
		name: "biochemistry",
		label: $I("science.biochemistry.label"),
		description: $I("science.biochemistry.desc"),
		effectDesc: $I("science.biochemistry.effectDesc"),
		prices: [
			{name : "science", val: 145000},
			{name: 	"compedium", val: 500}
		],
		unlocks: {
			tech: ["genetics"],
			upgrades: ["biofuel"]
		},
		flavor: $I("science.biochemistry.flavor")
	}, {
		name: "genetics",
		label: $I("science.genetics.label"),
		description: $I("science.genetics.desc"),
		effectDesc: $I("science.genetics.effectDesc"),
		prices: [
			{name : "science", val: 190000},
			{name: 	"compedium", val: 1500}
		],
		unlocks: {
			upgrades: ["unicornSelection", "gmo"]
		},
		flavor: $I("science.genetics.flavor")
	}, {
		name: "industrialization",
		label: $I("science.industrialization.label"),
		description: $I("science.industrialization.desc"),
		effectDesc: $I("science.industrialization.effectDesc"),
		prices: [
			{name : "science", val: 100000},
			{name: 	"blueprint", val: 25}
		],
		unlocks: {
			tech: ["mechanization", "metalurgy", "combustion"],
			upgrades: ["barges", "advancedAutomation", "logistics"]
		},
        upgrades:{
           policies: ["stripMining", "clearCutting"]
        },
        calculateEffects: function(self, game){
			if((game.science.getPolicy("stripMining").researched) || (game.science.getPolicy("clearCutting").researched)){
                self.unlocks["policies"] = ["sustainability", "fullIndustrialization"];
			}
			if(self.researched){
				game.unlock(self.unlocks);
			}
        }
	}, {
		name: "mechanization",
		label: $I("science.mechanization.label"),
		description: $I("science.mechanization.desc"),
		effectDesc: $I("science.mechanization.effectDesc"),
		prices: [
			{name : "science", val: 115000},
			{name: 	"blueprint", val: 45}
		],
		unlocks: {
			buildings: ["factory"],
			jobs: ["engineer"],
			tech: ["electronics"],
			upgrades: ["pumpjack", "strenghtenBuild"],
			crafts: ["concrate"]
		}
	}, {
		name: "metalurgy",
		label: $I("science.metalurgy.label"),
		description: $I("science.metalurgy.desc"),
		effectDesc: $I("science.metalurgy.effectDesc"),
		prices: [
			{name : "science", val: 125000},
			{name: 	"blueprint", val: 60}
		],
		unlocks: {
			upgrades: ["electrolyticSmelting", "oxidation", "miningDrill"]
		}
	}, {
		name: "combustion",
		label: $I("science.combustion.label"),
		description: $I("science.combustion.desc"),
		effectDesc: $I("science.combustion.effectDesc"),
		prices: [
			{name : "science", val: 115000},
			{name: 	"blueprint", val: 45}
		],
		unlocks: {
			tech: ["ecology"],
			upgrades: ["offsetPress", "fuelInjectors", "oilRefinery"]
		}
	},
	{
		name: "ecology",
		label: $I("science.ecology.label"),
		description: $I("science.ecology.desc"),
		effectDesc: $I("science.ecology.effectDesc"),
		prices: [
			{name : "science", val: 125000},
			{name: 	"blueprint", val: 55}
		],
		unlocks: {
			stages: [{bld:"pasture", stage:1}] 	// Solar Farm
		},
        upgrades:{
            policies: ["environmentalism"]
        },
        calculateEffects: function(self, game){
			if(game.science.getPolicy("environmentalism").researched){
                self.unlocks["policies"] = ["conservation", "openWoodlands"];
			}
			if(self.researched){
				game.unlock(self.unlocks);
			}
        }
	},
	{
		name: "electronics",
		label: $I("science.electronics.label"),
		description: $I("science.electronics.desc"),
		effectDesc: $I("science.electronics.effectDesc"),
		prices: [
			{name : "science", val: 135000},
			{name: 	"blueprint", val: 70}
		],
		unlocks: {
			stages: [
				{bld:"library", stage:1},		// Data Center
				{bld:"amphitheatre", stage:1}	// Broadcast Tower
			],
			tech: ["nuclearFission", "rocketry", "robotics"],
			upgrades: ["cadSystems", "refrigeration", "seti", "factoryLogistics", "factoryOptimization", "internet"]
		}
	}, {
		name: "robotics",
		label: $I("science.robotics.label"),
		description: $I("science.robotics.desc"),
		effectDesc: $I("science.robotics.effectDesc"),
		prices: [
			{name : "science", val: 140000},
			{name: 	"blueprint", val: 80}
		],
		unlocks: {
			stages: [{bld:"aqueduct", stage:1}], // Hydro Plant
			tech: ["ai"],
			upgrades: ["steelPlants", "rotaryKiln", "assistance", "factoryRobotics"],
			crafts: ["tanker"]
		}
	}, {
		name: "ai",
		label: $I("science.ai.label"),
		description: $I("science.ai.desc"),
		effectDesc: $I("science.ai.effectDesc"),
		prices: [
			{name : "science", val: 250000},
			{name: 	"blueprint", val: 150}
		],
		unlocks: {
			buildings: ["aiCore"],
			tech: ["quantumCryptography"],
			upgrades: ["neuralNetworks", "aiEngineers", "machineLearning"]
		}
	}, {
		name: "quantumCryptography",
		label: $I("science.quantumCryptography.label"),
		description: $I("science.quantumCryptography.desc"),
		effectDesc: $I("science.quantumCryptography.effectDesc"),
		prices: [
			{name : "science", val: 1250000},
			{name: 	"relic", val: 1024}
		],
		unlocks: {
			tech: ["blackchain"]
		}
	}, {
		name: "blackchain",
		label: $I("science.blackchain.label"),
		description: $I("science.blackchain.desc"),
		effectDesc: $I("science.blackchain.effectDesc"),
		prices: [
			{name: "science", val: 5000000},
			{name: "relic", val: 4096}
		],
		unlocks: {
			upgrades: ["invisibleBlackHand"]
		}
	}, {
		name: "nuclearFission",
		label: $I("science.nuclearFission.label"),
		description: $I("science.nuclearFission.desc"),
		effectDesc: $I("science.nuclearFission.effectDesc"),
		prices: [
			{name : "science", val: 150000},
			{name: 	"blueprint", val: 100}
		],
		unlocks: {
			buildings: ["reactor"],
			tech: ["nanotechnology", "particlePhysics"],
			upgrades: ["reactorVessel", "nuclearSmelters"]
		}
	}, {
		name: "rocketry",
		label: $I("science.rocketry.label"),
		description: $I("science.rocketry.desc"),
		effectDesc: $I("science.rocketry.effectDesc"),
		prices: [
			{name : "science", val: 175000},
			{name: 	"blueprint", val: 125}
		],
		unlocks: {
			tabs: ["space"],
			tech: ["sattelites", "oilProcessing"],
			upgrades: ["oilDistillation"]
		}
	}, {
        name: "oilProcessing",
        label: $I("science.oilProcessing.label"),
        description: $I("science.oilProcessing.desc"),
        effectDesc: $I("science.oilProcessing.effectDesc"),
        prices: [
            {name : "science", val: 215000},
            {name: 	"blueprint", val: 150}
        ],
        unlocks: {
            upgrades: [ "factoryProcessing" ],
            crafts: ["kerosene"]
        }
    }, {
        name: "sattelites",
        label: $I("science.sattelites.label"),
        description: $I("science.sattelites.desc"),
        effectDesc: $I("science.sattelites.effectDesc"),
        prices: [
            {name : "science", val: 190000},
            {name: 	"blueprint", val: 125}
        ],
        unlocks: {
            tech: ["orbitalEngineering" ],
            upgrades: ["photolithography", "orbitalGeodesy", "uplink", "thinFilm"]
        },
        flavor: $I("science.sattelites.flavor")
    }, {
		name: "orbitalEngineering",
		label: $I("science.orbitalEngineering.label"),
		description: $I("science.orbitalEngineering.desc"),
		effectDesc: $I("science.orbitalEngineering.effectDesc"),
		prices: [
			{name : "science", val: 250000},
			{name: 	"blueprint", val: 250}
		],
		unlocks: {
			tech: ["exogeology", "thorium"],
			upgrades: ["hubbleTelescope", "satelliteRadio", "astrophysicists", "solarSatellites", "spaceEngineers", "starlink"]
		}
	}, {
		name: "thorium",
		label: $I("science.thorium.label"),
		description: $I("science.thorium.desc"),
		effectDesc: $I("science.thorium.effectDesc"),
		prices: [
			{name : "science", val: 375000},
			{name: 	"blueprint", val: 375}
		],
		unlocks: {
			upgrades: ["thoriumReactors", "thoriumEngine", "qdot"],
			crafts: ["thorium"]
		}
	}, {
		name: "exogeology",
		label: $I("science.exogeology.label"),
		description: $I("science.exogeology.desc"),
		effectDesc: $I("science.exogeology.effectDesc"),
		prices: [
			{name : "science", val: 275000},
			{name: 	"blueprint", val: 250}
		],
		unlocks: {
			tech: ["advExogeology"],
			upgrades: ["unobtainiumReflectors", "unobtainiumHuts", "unobtainiumDrill", "hydroPlantTurbines", "storageBunkers"]
		}
	}, {
		name: "advExogeology",
		label: $I("science.advExogeology.label"),
		description: $I("science.advExogeology.desc"),
		effectDesc: $I("science.advExogeology.effectDesc"),
		prices: [
			{name : "science", val: 325000},
			{name: 	"blueprint", val: 350}
		],
		unlocks: {
			upgrades: ["eludiumCracker", "eludiumReflectors", "eludiumHuts", "mWReactor" /*, "eludiumDrill"*/],
			crafts: ["eludium"]
		}
	},
	{
		name: "nanotechnology",
		label: $I("science.nanotechnology.label"),
		description: $I("science.nanotechnology.desc"),
		effectDesc: $I("science.nanotechnology.effectDesc"),
		prices: [
			{name : "science", val: 200000},
			{name: 	"blueprint", val: 150}
		],
		unlocks: {
			tech: ["superconductors"],
			upgrades: ["augumentation", "nanosuits", "photovoltaic", "fluidizedReactors"]
		}
	}, {
		name: "superconductors",
		label: $I("science.superconductors.label"),
		description: $I("science.superconductors.desc"),
		effectDesc: $I("science.superconductors.effectDesc"),
		prices: [
			{name : "science", val: 225000},
			{name: 	"blueprint", val: 175}
		],
		unlocks: {
			tech: ["antimatter"],
			upgrades: ["coldFusion", "spaceManufacturing", "cryocomputing"]
		}
	}, {
		name: "antimatter",
		label: $I("science.antimatter.label"),
		description: $I("science.antimatter.desc"),
		effectDesc: $I("science.antimatter.effectDesc"),
		prices: [
			{name : "science", val: 500000},
			{name : "relic",   val: 1}
		],
		unlocks: {
			tech: ["terraformation"],
			upgrades: ["amReactors", "amBases", "amDrive", "amFission"]
		}
	}, {
		name: "terraformation",
		label: $I("science.terraformation.label"),
		description: $I("science.terraformation.desc"),
		effectDesc: $I("science.terraformation.effectDesc"),
		prices: [
			{name : "science", val: 750000},
			{name : "relic",   val: 5}
		],
		unlocks: {
			tech: ["hydroponics"]
		}
	}, {
		name: "hydroponics",
		label: $I("science.hydroponics.label"),
		description: $I("science.hydroponics.desc"),
		effectDesc: $I("science.hydroponics.effectDesc"),
		prices: [
			{name : "science", val: 1000000},
			{name : "relic",   val: 25}
		],
		unlocks: {
			tech: ["exogeophysics"]
		}
	}, {
		name: "exogeophysics",
		label: $I("science.exogeophysics.label"),
		description: $I("science.exogeophysics.desc"),
		effectDesc: $I("science.exogeophysics.effectDesc"),
		prices: [
			{name : "science", val: 25000000},
			{name : "relic",   val: 500}
		]
	},
	{
		name: "particlePhysics",
		label: $I("science.particlePhysics.label"),
		description: $I("science.particlePhysics.desc"),
		effectDesc: $I("science.particlePhysics.effectDesc"),
		prices: [
			{name : "science", val: 185000},
			{name: 	"blueprint", val: 135}
		],
		unlocks: {
			buildings: ["accelerator"],
			tech: ["chronophysics", "dimensionalPhysics"],
			upgrades: ["enrichedUranium", "railgun"]
		}
	}, {
		name: "dimensionalPhysics",
		label: $I("science.dimensionalPhysics.label"),
		description: $I("science.dimensionalPhysics.desc"),
		effectDesc: $I("science.dimensionalPhysics.effectDesc"),
		prices: [
			{name : "science", val: 235000}
		],
		unlocks: {
			upgrades: ["energyRifts", "lhc"]
		}
	}, {
		name: "chronophysics",
		label: $I("science.chronophysics.label"),
		description: $I("science.chronophysics.desc"),
		effectDesc: $I("science.chronophysics.effectDesc"),
		prices: [
			{name : "science", val: 250000},
			{name: 	"timeCrystal", val: 5}
		],
		unlocks: {
			buildings: ["chronosphere"],
			tech: ["tachyonTheory"],
			upgrades: ["stasisChambers", "fluxCondensator"]
		}
	}, {
		name: "tachyonTheory",
		label: $I("science.tachyonTheory.label"),
		description: $I("science.tachyonTheory.desc"),
		effectDesc: $I("science.tachyonTheory.effectDesc"),
		prices: [
			{name : "science", val: 750000},
			{name: 	"timeCrystal", val: 25},
			{name : "relic",   val: 1}
		],
		unlocks: {
			tech: ["voidSpace"],
			upgrades: ["tachyonAccelerators", "chronoforge", "chronoEngineers"]
		}
	}, {
		name: "cryptotheology",
		label: $I("science.cryptotheology.label"),
		description: $I("science.cryptotheology.desc"),
		effectDesc: $I("science.cryptotheology.effectDesc"),
		prices: [
			{name : "science", val: 650000},
			{name : "relic",   val: 5}
		],
		unlocks: {
			upgrades: ["relicStation"]
		}
	}, {
		name: "voidSpace",
		label: $I("science.voidSpace.label"),
		description: $I("science.voidSpace.desc"),
		effectDesc: $I("science.voidSpace.effectDesc"),
		prices: [
			{name : "science", val: 800000},
			{name: 	"timeCrystal", val: 30},
			{name : "void",   val: 100}
		],
		unlocks: {
			tech: ["paradoxalKnowledge"],
			upgrades: ["voidAspiration"],
			voidSpace: ["cryochambers"],
			challenges: ["atheism"]
		}
	}, {
		name: "paradoxalKnowledge",
		label: $I("science.paradoxalKnowledge.label"),
		description: $I("science.paradoxalKnowledge.desc"),
		effectDesc: $I("science.paradoxalKnowledge.effectDesc"),
		prices: [
			{name : "science", val: 1000000},
			{name: 	"timeCrystal", val: 40},
			{name : "void",   val: 250}
		],
		unlocks: {
			upgrades: ["distorsion"],
			chronoforge: ["ressourceRetrieval"],
			voidSpace: ["chronocontrol", "voidResonator"]
		}
	}],

	/**
	 * If policy is locked, it means some conflicting policy was researched first
	 * Once policy is locked, there is no way to unlock it other than reset
	 */
	policies: [
	{
		name: "liberty",
		label: $I("policy.liberty.label"),
		description: $I("policy.liberty.desc"),
		prices: [
			{name : "culture", val: 150}
		],
		unlocked: false,
		blocked: false,
		blocks:["tradition"],
		unlocks:{
			policies: ["authocracy", "republic"]
		}
	}, {
		name: "tradition",
		label: $I("policy.tradition.label"),
		description:$I("policy.tradition.desc"),
		prices: [
			{name : "culture", val: 150}
		],
		unlocked: false,
		blocked: false,
		blocks:["liberty"],
		unlocks:{
			policies: ["authocracy", "monarchy"]
		}
	},
	//----------------	classical age --------------------
	{
		name: "monarchy",
		label: $I("policy.monarchy.label"),
		description: $I("policy.monarchy.desc"),
		prices: [
			{name : "culture", val: 1500}
		],
		unlocked: false,
        upgrades:{
            buildings: ["factory"]
        },
		blocked: false,
		blocks:["authocracy", "republic", "communism"]
	}, {
		name: "authocracy",
		label: $I("policy.autocracy.label"),
		description: $I("policy.autocracy.desc"),
		prices: [
			{name : "culture", val: 1500}
		],
		unlocked: false,
        upgrades:{
            buildings: ["factory"]
        },
		blocked: false,
		blocks:["monarchy", "republic", "liberalism"],
		unlocks:{
			policies: ["socialism"]
		}
	}, {
		name: "republic",
        label: $I("policy.republic.label"),
        description: $I("policy.republic.desc"),
		prices: [
			{name : "culture", val: 1500}
		],
		effects:{
			"boostFromLeader":0.01
		},
		unlocked: false,
        upgrades:{
            buildings: ["factory"]
        },
		blocked: false,
		blocks:["monarchy", "authocracy", "fascism"],
		unlocks:{
			policies: ["socialism"]
		}
	},
	//----------------	meme --------------------
	{
		name: "socialism",
        label: $I("policy.socialism.label"),
        description: $I("policy.socialism.desc"),
		prices: [
			{name : "culture", val: 7500}
		],
		unlocked: false,
		blocked: false,
        blocks:[]
	},
	//----------------	industrial age --------------------
	{
		name: "liberalism",
        label: $I("policy.liberalism.label"),
        description: $I("policy.liberalism.desc"),
		prices: [
			{name : "culture", val: 15000}
		],
		effects:{
			"goldCostReduction": 0.2,
			"tradeRelationBoost" : 10
		},
		unlocked: false,
		blocked: false,
		blocks:["communism", "fascism"]
	}, {
		name: "communism",
        label: $I("policy.communism.label"),
        description: $I("policy.communism.desc"),
		prices: [
			{name : "culture", val: 15000}
		],
		effects:{
			"factoryCostReduction" : 0.3,
			"coalPolicyRatio": 0.25,
			"ironPolicyRatio": 0.25,
			"titaniumPolicyRatio": 0.25
		},
		unlocked: false,
		blocked: false,
		blocks:["liberalism", "fascism"]
	}, {
		name: "fascism",
        label: $I("policy.fascism.label"),
        description: $I("policy.fascism.desc"),
		prices: [
			{name : "culture", val: 15000}
		],
		effects:{
			"logCabinCostReduction" : 0.5
		},
		unlocked: false,
		blocked: false,
		blocks:["liberalism", "communism"]
	},
	//----------------	information age --------------------
	{
		name: "technocracy",
        label: $I("policy.technocracy.label"),
        description: $I("policy.technocracy.desc"),
        prices: [
			{name : "culture", val: 150000}
		],
		effects:{
		"technocracyScienceCap": 0.2
		},
		unlocked: false,
		blocked: false,
		blocks:["theocracy", "expansionism"]
	}, {
		name: "theocracy",
        label: $I("policy.theocracy.label"),
        description: $I("policy.theocracy.desc"),
		prices: [
			{name : "culture", val: 150000}
		],
		effects:{
			"faithPolicyRatio": 0.2
		},
		unlocked: false,
		blocked: false,
		requiredLeaderJob :"priest",
		blocks:["technocracy", "expansionism"]
	}, {
		name: "expansionism",
        label: $I("policy.expansionism.label"),
        description: $I("policy.expansionism.desc"),
		prices: [
			{name : "culture", val: 150000}
		],
		effects:{
			"unobtainiumPolicyRatio": 0.15
		},
		unlocked: false,
		blocked: false,
		blocks:["technocracy", "theocracy"]
	},
	//----------------	tier 5 age --------------------
	{
		name: "transkittenism",
        label: $I("policy.transkittenism.label"),
        description: $I("policy.transkittenism.desc"),
		prices: [
			{name : "culture", val: 1500000}
		],
		effects:{
		"aiCoreProductivness" : 1,
        "aiCoreUpgradeBonus" : 0.1
		},
		unlocked: false,
		blocked: false,
		blocks:["necrocracy", "radicalXenophobia"]
	},
	{
		name: "necrocracy",
		label: $I("policy.necrocracy.label"),
		description:$I("policy.necrocracy.desc"),
		prices: [
			{name : "culture", val: 1500000}
		],
		effects:{
		"blsProductionBonus" : 0.001
		},
		unlocked: false,
		blocked: false,
		blocks:["transkittenism", "radicalXenophobia"]
	},
	{
		name: "radicalXenophobia",
        label: $I("policy.radicalXenophobia.label"),
        description: $I("policy.radicalXenophobia.desc"),
		prices: [
			{name : "culture", val: 1500000}
		],
		effects:{
		"holyGenocideBonus" : 1
		},
		unlocked: false,
		blocked: false,
		blocks:["transkittenism", "necrocracy"]
	},
    //----------------    Foreign Policy --------------------
    {
        name: "diplomacy",
        label: $I("policy.diplomacy.label"),
        description: $I("policy.diplomacy.desc"),
        prices: [
            {name : "culture", val: 1600}
        ],
        effects:{
            "tradeCatpowerDiscount" : 5
        },
        unlocked: false,
        unlocks:{},
        upgrades: {
            tech: ["astronomy"]
        },
        blocked: false,
        blocks:["isolationism"],
        calculateEffects: function(self, game){
              if(game.science.get("astronomy").researched){
                self.unlocks["policies"] = ["knowledgeSharing", "culturalExchange"];
              }
			  if(self.researched){
				  game.unlock(self.unlocks);
			  }
        }
    }, {
        name: "isolationism",
        label: $I("policy.isolationism.label"),
        description: $I("policy.isolationism.desc"),
        prices: [
            {name : "culture", val: 1600}
        ],
        effects:{
            "tradeGoldDiscount" : 1
        },
        unlocked: false,
        blocked: false,
        blocks:["diplomacy"],
        unlocks:{},
        upgrades:{
            tech:["astronomy"]
        },
        calculateEffects: function(self, game){
            if(game.science.get("astronomy").researched){
				self.unlocks["policies"] = ["bigStickPolicy", "cityOnAHill"];
            }
			if(self.researched){
				game.unlock(self.unlocks);
			}
		}
    }, {
        name: "zebraRelationsAppeasement",
        label: $I("policy.zebraRelationsAppeasement.label"),
        description: $I("policy.zebraRelationsAppeasement.desc"),
        prices: [
            {name : "culture", val: 5000}
        ],
        effects:{
            "goldPolicyRatio" : -0.05,
            "zebraRelationModifier" : 15
        },
        unlocked: false,
        blocked: false,
        blocks:["zebraRelationsBellicosity"]
    }, {
        name: "zebraRelationsBellicosity",
        label: $I("policy.zebraRelationsBellicosity.label"),
        description: $I("policy.zebraRelationsBellicosity.desc"),
        prices: [
            {name : "culture", val: 5000}
        ],
        effects:{
            "nonZebraRelationModifier" : 5,
            "zebraRelationModifier" : -10
        },
        unlocked: false,
        blocked: false,
        blocks:["zebraRelationsAppeasement"]
    }, {
        name: "knowledgeSharing",
        label: $I("policy.knowledgeSharing.label"),
        description: $I("policy.knowledgeSharing.desc"),
        prices: [
            {name : "culture", val: 4000}
        ],
        effects:{
            "sciencePolicyRatio" : 0.05,
        },
        unlocked: false,
        blocked: false,
        blocks:["culturalExchange"]
    }, {
        name: "culturalExchange",
        label: $I("policy.culturalExchange.label"),
        description: $I("policy.culturalExchange.desc"),
        prices: [
            {name : "culture", val: 4000}
        ],
        effects:{
            "culturePolicyRatio" : 0.05,
        },
        unlocked: false,
        blocked: false,
        blocks:["knowledgeSharing"]
    }, {
        name: "bigStickPolicy",
        label: $I("policy.bigStickPolicy.label"),
        description: $I("policy.bigStickPolicy.desc"),
        prices: [
            {name : "culture", val: 4000}
        ],
        effects:{
            "embassyCostReduction" : 0.15,
        },
        unlocked: false,
        blocked: false,
        blocks:["cityOnAHill"]
    }, {
        name: "cityOnAHill",
        label: $I("policy.cityOnAHill.label"),
        description: $I("policy.cityOnAHill.desc"),
        prices: [
            {name : "culture", val: 4000}
        ],
        effects:{
            "onAHillCultureCap" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["bigStickPolicy"]
    }, {
        name: "outerSpaceTreaty",
        label: $I("policy.outerSpaceTreaty.label"),
        description: $I("policy.outerSpaceTreaty.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "spaceRelationsBonus" : 10
        },
        unlocked: false,
        blocked: false,
        blocks:["militarizeSpace"]
    }, {
        name: "militarizeSpace",
        label: $I("policy.militarizeSpace.label"),
        description: $I("policy.militarizeSpace.desc"),
        prices: [
			{name : "culture", val: 10000}
        ],
        effects:{
            "satelliteSynergyBonus" : 0.1
        },
        unlocked: false,
        blocked: false,
        blocks:["outerSpaceTreaty"]
    },
    //----------------   Philosophy   --------------------
    {
        name: "stoicism",
        label: $I("policy.stoicism.label"),
        description: $I("policy.stoicism.desc"),
        prices: [
            {name : "culture", val: 2000}
        ],
        effects:{
            "luxuryConsuptionReduction" : 0.5
        },
        unlocked: false,
        blocked: false,
        blocks:["epicurianism"],
        unlocks:{
            policies: ["rationality", "mysticism"]
        }
    }, {
        name: "epicurianism",
        label: $I("policy.epicurianism.label"),
        description: $I("policy.epicurianism.desc"),
        prices: [
            {name : "culture", val: 2000}
        ],
        effects:{
            "luxuryHappinessBonus" : 1
        },
        unlocked: false,
        blocked: false,
        blocks:["stoicism"],
        unlocks:{
            policies: ["rationality", "mysticism"]
        }
    }, {
        name: "rationality",
        label: $I("policy.rationality.label"),
        description: $I("policy.rationality.desc"),
        prices: [
            {name : "culture", val: 3000}
        ],
        effects:{
			"sciencePolicyRatio" : 0.05,
			"ironPolicyRatio": 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["mysticism"]
    }, {
        name: "mysticism",
        label: $I("policy.mysticism.label"),
        description: $I("policy.mysticism.desc"),
        prices: [
            {name : "culture", val: 3000}
        ],
        effects:{
			"culturePolicyRatio" : 0.05,
			"faithPolicyRatio" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["rationality"]
    },
    //----------------   Environmental Policy   --------------------
    {
        name: "stripMining",
        label: $I("policy.stripMining.label"),
        description: $I("policy.stripMining.desc"),
        prices: [
            {name : "science", val: 2000}
        ],
        effects:{
            "environmentUnhappiness" : -5,
			"mineralsPolicyRatio" : 0.25
        },
        unlocked: false,
        unlocks:{},
        blocked: false,
        blocks:["clearCutting", "environmentalism"],
        upgrades:{
              tech:["industrialization"]
        },
        calculateEffects: function(self, game){
            if(game.science.get("industrialization").researched){
                self.unlocks["policies"] = ["sustainability", "fullIndustrialization"];
            }
			if(self.researched){
				game.unlock(self.unlocks);
			}
        }
    }, {
        name: "clearCutting",
        label: $I("policy.clearCutting.label"),
        description: $I("policy.clearCutting.desc"),
        prices: [
            {name : "science", val: 2000}
        ],
        effects:{
            "environmentUnhappiness" : -5,
			"woodPolicyRatio" : 0.25
        },
        unlocked: false,
        unlocks:{},
        blocked: false,
        blocks:["stripMining", "environmentalism"],
        upgrades:{
            tech:["industrialization"]
        },
        calculateEffects: function(self, game){
            if(game.science.get("industrialization").researched){
              self.unlocks["policies"] = ["sustainability", "fullIndustrialization"];
            }
			if(self.researched){
				game.unlock(self.unlocks);
			}
        }
    }, {
        name: "environmentalism",
        label: $I("policy.environmentalism.label"),
        description: $I("policy.environmentalism.desc"),
        prices: [
            {name : "science", val: 2000}
        ],
        effects:{
            "environmentHappinessBonus" : 5
        },
        unlocked: false,
        unlocks:{},
        blocked: false,
        blocks:["stripMining", "clearCutting"],
        upgrades:{
            tech: ["ecology"]
        },
        calculateEffects: function(self, game){
            if(game.science.get("ecology").researched){
                self.unlocks["policies"] = ["conservation", "openWoodlands"];
            }
			if(self.researched){
				game.unlock(self.unlocks);
			}
        }
    }, {
        name: "sustainability",
        label: $I("policy.sustainability.label"),
        description: $I("policy.sustainability.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentUnhappinessModifier" : -1
        },
        unlocked: false,
        blocked: false,
        blocks:["fullIndustrialization"]
    }, {
        name: "fullIndustrialization",
        label: $I("policy.fullIndustrialization.label"),
        description: $I("policy.fullIndustrialization.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentFactoryCraftBonus" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["sustainability"]
    }, {
        name: "conservation",
        label: $I("policy.conservation.label"),
        description: $I("policy.conservation.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentHappinessBonusModifier" : 1
        },
        unlocked: false,
        blocked: false,
        blocks:["openWoodlands"]
    }, {
        name: "openWoodlands",
        label: $I("policy.openWoodlands.label"),
        description: $I("policy.openWoodlands.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentMineralBonus" : 0.125,
            "environmentWoodBonus" : 0.125
        },
        unlocked: false,
        blocked: false,
        blocks:["conservation"]
    }, {
        name: "spaceBasedTerraforming",
        label: $I("policy.spaceBasedTerraforming.label"),
        description: $I("policy.spaceBasedTerraforming.desc"),
        prices: [
            {name : "culture", val: 45000}
        ],
        effects:{
            "mysticismBonus" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["clearSkies"]
    }, {
        name: "clearSkies",
        label: $I("policy.clearSkies.label"),
        description: $I("policy.clearSkies.desc"),
        prices: [
            {name : "culture", val: 45000}
        ],
        effects:{
            "mysticismBonus" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["spaceBasedTerraforming"]
        }
],

	metaCache: null,
	effectsBase: {
        "environmentHappinessBonusModifier" : 1,
        "environmentUnhappinessModifier" : 1
	},
	constructor: function(game){
		this.game = game;
		this.metaCache = {};
        this.registerMeta("research", this.techs, {
            getEffect: function(meta, name){
                var effect = 0;
                if (meta.effect){
                    effect = meta.effects[name] || 0;
                }
				return effect;
			}
		});
		this.registerMeta("research", this.policies, {
			getEffect: function(meta, name){
				var effect = 0;
				if (meta.effect){
					effect = meta.effects[name] || 0;
				}
				return effect;
			}
		});
		this.setEffectsCachedExisting();
	},

	get: function(techName){
		var tech = this.metaCache[techName];
		if (tech){
			return tech;
		}

		for (var i = this.techs.length - 1; i >= 0; i--) {
			if (this.techs[i].name == techName){
				this.metaCache[techName] = this.techs[i];
				return this.techs[i];
			}
		}
		console.error("Failed to get tech for tech name '" + techName + "'");
		return null;
	},

	getPolicy: function(name){
		return this.getMeta(name, this.policies);
	},

	getPrices: function(tech) {

		var prices = tech.prices;

		var prices_result = $.extend(true, [], prices); // Create a new array to keep original values
		prices_result = this.game.village.getEffectLeader("scientist", prices_result);

		return prices_result;
	},
    /*getEffect: function(effectName){
        var effect = 0;
        for (var i = 0; i < this.meta.length; i++){
            var effectMeta = this.getMetaEffect(effectName, this.meta[i]);
            effect += effectMeta;
        }
        return effect;
    },*/
	resetState: function(){
		for (var i = 0; i < this.techs.length; i++){
			var tech = this.techs[i];
			if (tech.name == "calendar") {
				tech.unlocked = true;
			} else {
				tech.unlocked = false;
			}
			tech.researched = false;
		}

		this.hideResearched = false;
	},

	save: function(saveData){
		saveData.science = {
			hideResearched: this.hideResearched,
			techs: this.filterMetadata(this.techs, ["name", "unlocked", "researched"]),
			policies: this.filterMetadata(this.policies, ["name", "unlocked", "blocked", "researched"]),
		};
	},

	load: function(saveData){
		if (saveData.science){
			this.hideResearched = saveData.science.hideResearched;
			this.loadMetadata(this.techs, saveData.science.techs, "technologies");
			this.loadMetadata(this.policies, saveData.science.policies, "policies");
		}

		//re-unlock technologies in case we have modified something
		for (var i = this.techs.length - 1; i >= 0; i--) {
			var tech = this.techs[i];
			if (!tech.researched) {
				continue;
			}

			this.game.unlock(tech.unlocks);
		}

	},

	unlockAll: function(){
		for (var i = this.techs.length - 1; i >= 0; i--) {
			var tech = this.techs[i];
			tech.researched = true;
			tech.unlocked = true;
			this.game.unlock(tech.unlocks);
		}
		this.game.msg("All techs are unlocked!");
	},
    /*updateEffectCached: function() {
        var effectsBase = this.effectsBase;
        if (effectsBase){
             effectsBase = this.game.resPool.addBarnWarehouseRatio(effectsBase);
        }
             
        for (var name in this.effectsCachedExisting) {
             // Add effect from meta
             var effect = 0;
             for (var i = 0; i < this.meta.length; i++){
                var effectMeta = this.getMetaEffect(name, this.meta[i]);
                effect += effectMeta;
             }
             
             // Previously, catnip demand (or other buildings that both affect the same resource)
             // could have theoretically had more than 100% reduction because they diminished separately,
             // this takes the total effect and diminishes it as a whole.
             if (this.game.isHyperbolic(name) && effect !== 0) {
             effect = this.game.getHyperbolicEffect(effect, 1.0);
             }
             
             // Add effect from effectsBase
             if (effectsBase && effectsBase[name]) {
             effect += effectsBase[name];
             }
             
             // Add effect in globalEffectsCached, in addition of other managers
             this.game.globalEffectsCached[name] = typeof(this.game.globalEffectsCached[name]) == "number" ? this.game.globalEffectsCached[name] + effect : effect;
             }
             }*/
});

//-------- Policy ----------

dojo.declare("classes.ui.PolicyBtnController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {
	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.science.getPolicy(model.options.id);
        }
        return model.metaCached;
	},

	getName: function(model){
		var meta = model.metadata;
		if (meta.blocked){
			return meta.label + " " + $I("btn.blocked.capital");
		}

		return this.inherited(arguments);
	},
	
	updateVisible: function(model){
		var meta = model.metadata;
		model.visible = meta.unlocked;

		//uncomment when no longer debugging the code
		/*
			if (
				(meta.researched || meta.locked) && this.game.science.hideResearched
			){
				model.visible = false;
			}
		*/
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if (model.metadata.blocked){
			model.enabled = false;
		}
	},

	onPurchase: function(model){
		if((model.metadata.blocked != true) && 
			(
				(this.game.village.leader == null || !model.metadata.requiredLeaderJob) || 
				(this.game.village.leader.job == model.metadata.requiredLeaderJob)
			) && (
				(!model.metadata.name == "transkittenism") || 
				(this.game.bld.getBuildingExt("aiCore").meta.effects["aiLevel"] < 15)
			)
		){
             for(var i = 0; i < model.metadata.blocks.length; i++){
                if(this.game.science.getPolicy(model.metadata.blocks[i]).researched){
                    model.metadata.blocked = true;
                    return;
                }
             }
			this.inherited(arguments);
			var meta = model.metadata;

			if (meta.blocks){
				for (var i in meta.blocks){
					var policy = this.game.science.getPolicy( meta.blocks[i]);
					policy.blocked = true;
				}
			}
		}
	}
});

dojo.declare("classes.ui.PolicyPanel", com.nuclearunicorn.game.ui.Panel, {
	render: function(container){
		var content = this.inherited(arguments),
			self = this;
        
		var controller = new classes.ui.PolicyBtnController(this.game);
		dojo.forEach(this.game.science.policies, function(policy, i){
			var button = 
				new com.nuclearunicorn.game.ui.BuildingResearchBtn({
					id: policy.name, controller: controller}, self.game);
			button.render(content);
			self.addChild(button);
		});
	}
});

dojo.declare("com.nuclearunicorn.game.ui.TechButtonController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {

	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		result.simplePrices = false;
		return result;
	},

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.science.get(model.options.id);
        }
        return model.metaCached;
    },

	getPrices: function(model) {
        return this.game.village.getEffectLeader("scientist", this.inherited(arguments));
    },

	updateVisible: function(model){
		var meta = model.metadata;
		if (!meta.unlocked){
			model.visible = false;
		}else{
			model.visible = true;
		}

		if (meta.researched && this.game.science.hideResearched){
			model.visible = false;
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.tab.Library", com.nuclearunicorn.game.ui.tab, {

	metaphysicsPanel: null,

	render: function(tabContainer){

		this.buttons = [];

		var hasCivil = this.game.science.get("civil");

		//--------------------------------------------------------------------
		var div = dojo.create("div", { style: { float: "right"}}, tabContainer);
		var groupCheckbox = dojo.create("input", {
			id : "toggleResearched",
			type: "checkbox",
			checked: this.game.science.hideResearched,
			style: {
				display: hasCivil ? "" : "none"
			}
		}, div);

		dojo.connect(groupCheckbox, "onclick", this, function(){
			this.game.science.hideResearched = !this.game.science.hideResearched;

			dojo.empty(tabContainer);
			this.render(tabContainer);
		});

		dojo.create("label", { innerHTML: $I("science.toggleResearched.label"), for: "toggleResearched"}, div);
		//---------------------------------------------------------------------

		var table = dojo.create("table", { className: "table", style:{
			width: "100%"
		}}, tabContainer);

		var tr = dojo.create("tr", null, table);

		var tdTop = dojo.create("td", { colspan: 2 },
			dojo.create("tr", null, table));

		this.tdTop = tdTop;


		var tr = dojo.create("tr", null, table)/*,
			tdLeft = dojo.create("td", null, tr),
			tdRight = dojo.create("td", null, tr)*/;


		for (var i = 0; i < this.game.science.techs.length; i++){
			var tech = this.game.science.techs[i];

			var btn = this.createTechBtn(tech);

			btn.updateVisible();
			btn.updateEnabled();

			this.addButton(btn);
			btn.render(tr);
		}

		//-------------- policies ----------------

		this.policyPanel = new classes.ui.PolicyPanel("Policies", this.game.science);
		this.policyPanel.game = this.game;
		this.policyPanel.render(tabContainer);

		//------------ metaphysics ----------------
		this.metaphysicsPanel = null;

		var showMetaphysics = this.game.science.get("metaphysics").researched && this.game.resPool.get("paragon").value > 0;
		if (!showMetaphysics){
			for (var i = this.game.prestige.perks.length - 1; i >= 0; i--){
				var perk = this.game.prestige.perks[i];
				if (perk.researched){
					showMetaphysics = true;
					break;
				}
			}
		}

		if (showMetaphysics){
			this.metaphysicsPanel = new classes.ui.PrestigePanel($I("prestige.panel.label"), this.game.prestige);
			this.metaphysicsPanel.game = this.game;
			this.metaphysicsPanel.render(tabContainer);
		}

		this.update();
	},

	update: function(){
		this.inherited(arguments);

		if (this.metaphysicsPanel){
			this.metaphysicsPanel.update();
		}
		if (this.policyPanel){
			this.policyPanel.update();
		}
	},

	constructor: function(tabName, game){
		this.game = game;
	},

	createTechBtn: function(tech){
		var controller = new com.nuclearunicorn.game.ui.TechButtonController(this.game);
		var btn = new com.nuclearunicorn.game.ui.BuildingResearchBtn({id: tech.name, controller: controller}, this.game);
		return btn;
	}
});
