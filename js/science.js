/**
 * Weird cat science
 */
dojo.declare("classes.managers.ScienceManager", com.nuclearunicorn.core.TabManager, {

	game: null,

	hideResearched: false,
	policyToggleBlocked: false,
	policyToggleResearched: false,

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
			tech: ["navigation"],
			policies: ["knowledgeSharing", "culturalExchange", "bigStickPolicy", "cityOnAHill"]
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
			upgrades:["geodesy"],
			zebraUpgrades: ["minerologyDepartment"]
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
			upgrades: ["barges", "advancedAutomation", "logistics"],
			policies: ["sustainability", "fullIndustrialization"]
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
			stages: [{bld:"pasture", stage:1}], 	// Solar Farm
			policies: ["conservation", "openWoodlands"],
			upgrades: ["carbonSequestration"]
		},
		upgrades:{
			buildings: ["mine", "quarry"]
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
		},
		upgrades: {
			planet: ["cath"]
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
			upgrades: ["photolithography", "orbitalGeodesy", "uplink", "thinFilm"],
			policies:["outerSpaceTreaty","militarizeSpace"]
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
			crafts: ["eludium"],
			stages: [{bld:"warehouse", stage:1}],
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
			// tech: ["artificialGravity"] -- see SPACE_EXPL feature flag
		}
	}, {
		name: "artificialGravity",
		label: $I("science.artificialGravity.label"),
		description: $I("science.artificialGravity.desc"),
		effectDesc: $I("science.artificialGravity.effectDesc"),
		prices: [
			{name : "science", val: 320000}
		],
		unlocks: {
			upgrades: ["spiceNavigation", "longRangeSpaceships"]
		},
		flavor: $I("science.artificialGravity.flavor")
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
		},
		calculateEffects: function(self, game){
			if(self.researched){
				game.time.queue.unlockQueueSource("transcendenceUpgrades");
			}
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
		},
        calculateEffects: function(self, game){
			if(self.researched){
				game.time.queue.unlockQueueSource("voidSpace");
			}
        },
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
	 * If policy is blocked, it means some conflicting policy was researched first
	 * Once policy is blocked, there is no way to unlock it other than reset
	 */
	policies: [
	{
		name: "liberty",
		label: $I("policy.liberty.label"),
		description: $I("policy.liberty.desc"),
		prices: [
			{name : "culture", val: 150}
		],
		effects: {
			"maxKittens": 0,
			"happinessKittenProductionRatio": 0.1
		},
		unlocked: false,
		blocked: false,
		blocks:["tradition"],
		unlocks:{
			policies: ["authocracy", "republic"]
		},
		calculateEffects: function(self, game){
			self.effects["maxKittens"] = game.ironWill ? 0 : 1;
		}
	}, {
		name: "tradition",
		label: $I("policy.tradition.label"),
		description:$I("policy.tradition.desc"),
		prices: [
			{name : "culture", val: 150}
		],
		effects: {
			"cultureFromManuscripts": 1,
			"manuscriptParchmentCost": -5, //visual,
			"manuscriptCultureCost": -100 //just for the players
		},
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
        effects:{
            "goldPolicyRatio" : -0.1
        },
		unlocked: false,
        upgrades:{
            buildings: ["factory"]
        },
		blocked: false,
		blocks:["authocracy", "republic", "communism"],
		unlocks:{
			policies:["liberalism", "fascism"]
		}
	}, {
		name: "authocracy",
		label: $I("policy.autocracy.label"),
		description: $I("policy.autocracy.desc"),
		prices: [
			{name : "culture", val: 1500}
		],
		effects:{
			"rankLeaderBonusConversion": 0
		},
		unlocked: false,
		blocked: false,
		blocks:["monarchy", "republic", "liberalism"],
		calculateEffects: function(self, game){
			var uncappedHousing = 0;
			for (var i = 0; i < game.bld.buildingGroups.length; i++){
				if(game.bld.buildingGroups[i].name == "population"){
					for (var k = 0; k < game.bld.buildingGroups[i].buildings.length; k++){
						var building = game.bld.getBuildingExt(game.bld.buildingGroups[i].buildings[k]);
						if(!game.resPool.isStorageLimited(game.bld.getPrices(building.meta.name))){
							uncappedHousing += 1;
							building.meta.almostLimited = self.researched && game.resPool.isStorageLimited(game.bld.getPrices(building.meta.name, 1));
						}else{
							building.meta.almostLimited = false;
						}
					}
					break;
				}
			}
			self.effects["rankLeaderBonusConversion"] = 0.004 * uncappedHousing;
		},
		unlocks:{
			policies:["communism", "fascism", "socialism"]
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
		blocked: false,
		blocks:["monarchy", "authocracy", "fascism"],
		unlocks:{
			policies: ["liberalism", "communism", "socialism"]
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
			"globalRelationsBonus" : 10
		},
		unlocked: false,
		blocked: false,
		blocks:["communism", "fascism"],
		evaluateLocks: function(game){
			return (game.science.getPolicy("monarchy").researched || game.science.getPolicy("republic").researched)
			&& game.bld.getBuildingExt("factory").meta.val > 0;
		}
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
		blocks:["liberalism", "fascism"],
		evaluateLocks: function(game){
			return (game.science.getPolicy("republic").researched || game.science.getPolicy("authocracy").researched)
			&& game.bld.getBuildingExt("factory").meta.val > 0;
		}
	}, {
		name: "fascism",
        label: $I("policy.fascism.label"),
        description: $I("policy.fascism.desc"),
		prices: [
			{name : "culture", val: 15000}
		],
		effects:{
			"logHouseCostReduction" : 0.5
		},
		unlocked: false,
		blocked: false,
		blocks:["liberalism", "communism"],
		evaluateLocks: function(game){
			return (game.science.getPolicy("monarchy").researched || game.science.getPolicy("authocracy").researched)
			&& game.bld.getBuildingExt("factory").meta.val > 0;
		}
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
		blocks:["necrocracy", "radicalXenophobia"],
		upgrades: {
			buildings:["library"],
			spaceBuilding: ["moonOutpost"]
		},
	},
	{
		name: "necrocracy",
		label: $I("policy.necrocracy.label"),
		description:$I("policy.necrocracy.desc"),
		prices: [
			{name : "culture", val: 1500000}
		],
		effects:{
			"blsProductionBonus" : 0.001,
			"leviathansEnergyModifier" : 0.05
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
			"mausoleumBonus" : 1,
			"pactsAvailable" : 5
		},
		upgrades: {
			transcendenceUpgrades:["mausoleum"]
		},
		calculateEffects: function (self, game){
			self.effects["pactsAvailable"] = 5;
			if(game.religion.getPact("fractured").on >= 1 || !game.getFeatureFlag("MAUSOLEUM_PACTS")){
				self.effects["pactsAvailable"] = 0;
			}
			game.updateCaches();
		},
		unlocks: {
			pacts: ["pactOfCleansing", "pactOfDestruction",  "pactOfExtermination", "pactOfPurity"]
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
        unlocks:{
			policies: ["knowledgeSharing", "culturalExchange"]
		},
        blocked: false,
        blocks:["isolationism"]
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
        unlocks:{
			policies: ["bigStickPolicy", "cityOnAHill"]
		},
        blocked: false,
        blocks:["diplomacy"]
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
        blocks:["culturalExchange"],
		evaluateLocks: function(game){
			return game.science.getPolicy("diplomacy").researched && game.science.get("astronomy").researched;
		}
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
        blocks:["knowledgeSharing"],
		evaluateLocks: function(game){
			return game.science.getPolicy("diplomacy").researched && game.science.get("astronomy").researched;
		}
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
        blocks:["cityOnAHill"],
		evaluateLocks: function(game){
			return game.science.getPolicy("isolationism").researched && game.science.get("astronomy").researched && !game.challenges.isActive("pacifism");
		}
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
        blocks:["bigStickPolicy"],
		evaluateLocks: function(game){
			return game.science.getPolicy("isolationism").researched && game.science.get("astronomy").researched;
		}
    }, {
        name: "outerSpaceTreaty",
        label: $I("policy.outerSpaceTreaty.label"),
        description: $I("policy.outerSpaceTreaty.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "globalRelationsBonus" : 10
        },
        unlocked: false,
        blocked: false,
        blocks:["militarizeSpace"],
		evaluateLocks: function(game){
			return game.space.getBuilding("sattelite").val > 0;
		}
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
		upgrades: {
			spaceBuilding: ["sattelite"],
			buildings: ["observatory"]
		},
        blocked: false,
        blocks:["outerSpaceTreaty"],
		evaluateLocks: function(game){
			return game.space.getBuilding("sattelite").val > 0 && !game.challenges.isActive("pacifism");
		}
    },
    //----------------   Philosophy   --------------------
    {
        name: "stoicism",
        label: $I("policy.stoicism.label"),
        description: $I("policy.stoicism.desc"),
        prices: [
            {name : "culture", val: 2500}
        ],
        effects:{
            "luxuryDemandRatio" : -0.5,
			"breweryConsumptionRatio": -0.25
        },
        unlocked: false,
        blocked: false,
        blocks:["epicurianism"],
        unlocks:{
            policies: ["rationality", "mysticism", "rationing", "frugality"]
        },
		upgrades: {
			buildings: ["brewery"]
		},
    }, {
        name: "epicurianism",
        label: $I("policy.epicurianism.label"),
        description: $I("policy.epicurianism.desc"),
        prices: [
            {name : "culture", val: 2500}
        ],
        effects:{
            "luxuryHappinessBonus" : 1
        },
        unlocked: false,
        blocked: false,
        blocks:["stoicism"],
        unlocks:{
            policies: ["rationality", "mysticism", "carnivale", "extravagance"]
        }
	}, {
        name: "carnivale",
        label: $I("policy.carnivale.label"),
        description: $I("policy.carnivale.desc"),
        prices: [
            {name : "culture", val: 3500}
        ],
        effects:{
			"festivalArrivalRatio" : 0.3,
			"festivalLuxuryConsumptionRatio": 0.3
        },
        unlocked: false,
        blocked: false,
        blocks:["extravagance"]
	}, {
        name: "extravagance",
        label: $I("policy.extravagance.label"),
        description: $I("policy.extravagance.desc"),
        prices: [
            {name : "culture", val: 3500}
        ],
        effects:{
			"luxuryDemandRatio" : 2,
			"consumableLuxuryHappiness": 5
        },
        unlocked: false,
        blocked: false,
        blocks:["carnivale"]
	}, {
        name: "rationing",
        label: $I("policy.rationing.label"),
        description: $I("policy.rationing.desc"),
        prices: [
            {name : "culture", val: 3500}
        ],
        effects:{
			"hapinnessConsumptionRatio" : -0.1,
			"hunterRatio": 0.1
        },
        unlocked: false,
        blocked: false,
        blocks:["frugality"]
	}, {
        name: "frugality",
        label: $I("policy.frugality.label"),
        description: $I("policy.frugality.desc"),
        prices: [
            {name : "culture", val: 3500}
        ],
        effects:{
			"mintRatio" : 0.1
        },
        unlocked: false,
        blocked: false,
        blocks:["rationing"],
		upgrades: {
			buildings: ["mint"]
		},
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
            "environmentUnhappiness" : -2,
			"mineralsPolicyRatio" : 0.3,
			"cathPollutionRatio" : 0.05
        },
        unlocked: false,
        unlocks:{
			policies : ["sustainability", "fullIndustrialization"]
		},
        blocked: false,
        blocks:["clearCutting", "environmentalism"]
    }, {
        name: "clearCutting",
        label: $I("policy.clearCutting.label"),
        description: $I("policy.clearCutting.desc"),
        prices: [
            {name : "science", val: 2000}
        ],
        effects:{
            "environmentUnhappiness" : -2,
			"woodPolicyRatio" : 0.3,
			"cathPollutionRatio" : 0.05
        },
        unlocked: false,
        unlocks:{
			policies : ["sustainability", "fullIndustrialization"]
		},
        blocked: false,
        blocks:["stripMining", "environmentalism"]
    }, {
        name: "environmentalism",
        label: $I("policy.environmentalism.label"),
        description: $I("policy.environmentalism.desc"),
        prices: [
            {name : "culture", val: 2000}
        ],
        effects:{
            "environmentHappinessBonus" : 3,
			"cathPollutionRatio" : -0.05
        },
        unlocked: false,
        unlocks:{
			policies : ["conservation", "openWoodlands"]
		},
        blocked: false,
        blocks:["stripMining", "clearCutting"]
    }, {
        name: "sustainability",
        label: $I("policy.sustainability.label"),
        description: $I("policy.sustainability.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentHappinessBonus" : 5,
			"cathPollutionRatio" : -0.05
        },
        unlocked: false,
        blocked: false,
		blocks:["fullIndustrialization"],
		evaluateLocks: function(game){
			return (game.science.getPolicy("stripMining").researched || game.science.getPolicy("clearCutting").researched)
			&& game.science.get("industrialization").researched;
		}
    }, {
        name: "fullIndustrialization",
        label: $I("policy.fullIndustrialization.label"),
        description: $I("policy.fullIndustrialization.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
		upgrades: {
			buildings: ["factory"]
		},
        effects:{
            "environmentFactoryCraftBonus" : 0.05,
			"cathPollutionRatio" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["sustainability"],
		evaluateLocks: function(game){
			return (game.science.getPolicy("stripMining").researched || game.science.getPolicy("clearCutting").researched)
			&& game.science.get("industrialization").researched;
		}
    }, {
        name: "conservation",
        label: $I("policy.conservation.label"),
        description: $I("policy.conservation.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "environmentHappinessBonus" : 5,
			"cathPollutionRatio" : -0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["openWoodlands"],
		evaluateLocks: function(game){
			return game.science.getPolicy("environmentalism").researched && game.science.get("ecology").researched;
		}
    }, {
        name: "openWoodlands",
        label: $I("policy.openWoodlands.label"),
        description: $I("policy.openWoodlands.desc"),
        prices: [
            {name : "culture", val: 10000}
        ],
        effects:{
            "mineralsPolicyRatio" : 0.125,
            "woodPolicyRatio" : 0.125,
			"cathPollutionRatio" : 0.05
        },
        unlocked: false,
        blocked: false,
        blocks:["conservation"],
		evaluateLocks: function(game){
			return game.science.getPolicy("environmentalism").researched && game.science.get("ecology").researched;
		}
    }, {
        name: "cryochamberExtraction",
        label: $I("policy.cryochamberExtraction.label"),
        description: $I("policy.cryochamberExtraction.desc"),
        prices: [
            {name : "manpower", val: 10000}
        ],
        unlocked: false,
        blocked: false,
        blocks:["terraformingInsight"],
		onResearch: function(game){
			//single use policy
			game.time.getVSU("usedCryochambers").val += 1;
			game.time.getVSU("usedCryochambers").on += 1;
		}
    }, {
        name: "terraformingInsight",
		label: $I("policy.terraformingInsight.label"),
        description: $I("policy.terraformingInsight.desc"),
        prices: [
            {name : "manpower", val: 10000}
        ],
        effects:{
            "terraformingMaxKittensRatio": 0.1
        },
        unlocked: false,
        blocked: false,
        blocks:["cryochamberExtraction"]
    }, /*{
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
        }*/
	//pact policy
	{
        name: "siphoning",
		label: $I("policy.siphoning.label"),
        description: $I("policy.siphoning.desc"),
        prices: [
            {name : "necrocorn", val: 1}
        ],
		calculateEffect: function(game, self){
			if(!game.getFeatureFlag("MAUSOLEUM_PACTS")){
				self.unlocked = false;
				return;
			}
		},
		evaluateLocks: function(game){
			return game.getFeatureFlag("MAUSOLEUM_PACTS");
		},
        unlocked: false,
        blocked: false,
        blocks:[]
    }
],

	metaCache: null,
	effectsBase: {
        "environmentHappinessBonusModifier" : 1,
        "environmentUnhappinessModifier" : 1
	},
	constructor: function(game){

		// note: possible to unlock artificialGravity (and the continuation of
		//	   the space exploration tech tree) iff SPACE_EXPL feature flag
		//
		if (game.getFeatureFlag("SPACE_EXPL")) {
			for (var i = this.techs.length - 1; i >= 0; i--) {
				if (this.techs[i].name == 'dimensionalPhysics') {
					if (!this.techs[i].unlocks.tech) {
						this.techs[i].unlocks.tech = ['artificialGravity'];
					}
					break;
				}
			}
		}

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

		// this is to force Gold Ore pathway in BSK+IW and avoid soft locks
		if(this.game.ironWill && this.game.challenges.isActive('blackSky')) {
			if(tech.name == 'construction') {
				prices_result = prices_result.concat([{name: "gold", val: 5}]);
			}
		}

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
			tech.unlocked = tech.name == "calendar";
			tech.researched = false;
		}
		for (var i = 0; i < this.policies.length; i++){
			var policy = this.policies[i];
			policy.unlocked = false;
			policy.blocked = false;
			policy.researched = false;
		}
		this.hideResearched = false;
		this.policyToggleBlocked = false;
		this.policyToggleResearched = false;
	},

	save: function(saveData){
		saveData.science = {
			hideResearched: this.hideResearched,
			policyToggleResearched: this.policyToggleResearched,
			policyToggleBlocked: this.policyToggleBlocked,
			techs: this.filterMetadata(this.techs, ["name", "unlocked", "researched"]),
			policies: this.filterMetadata(this.policies, ["name", "unlocked", "blocked", "researched"]),
		};
	},

	load: function(saveData){
		if (saveData.science){
			this.hideResearched = saveData.science.hideResearched;
			this.policyToggleResearched = saveData.science.policyToggleResearched;
			this.policyToggleBlocked = saveData.science.policyToggleBlocked;
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
		//re-unlock policies in case we have modified something
		for (var i = this.policies.length - 1; i >= 0; i--) {
			var policy = this.policies[i];
			if (!policy.researched) {
				continue;
			}

			this.game.unlock(policy.unlocks);
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
             effect = this.game.getLimitedDR(effect, 1.0);
             }

             // Add effect from effectsBase
             if (effectsBase && effectsBase[name]) {
             effect += effectsBase[name];
             }

             // Add effect in globalEffectsCached, in addition of other managers
             this.game.globalEffectsCached[name] = typeof(this.game.globalEffectsCached[name]) == "number" ? this.game.globalEffectsCached[name] + effect : effect;
             }
			 }*/
	//update: function(){
	//}
});

//-------- Policy ----------

dojo.declare("classes.ui.PolicyBtnController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		result.simplePrices = false;
		return result;
	},

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
	getPrices: function(model){
		var meta = model.metadata;
		var policyFakeBought = this.game.getEffect("policyFakeBought");
		var prices = [];
		for (var i = 0; i < meta.prices.length; i++){
            prices.push({
				val: meta.prices[i].val * Math.pow(1.25, policyFakeBought),
				name: meta.prices[i].name
			});
		}
        return prices;
	},
	updateVisible: function(model){
		var meta = model.metadata;
		model.visible = meta.unlocked;
		if (meta.researched && this.game.science.policyToggleResearched){
			model.visible = false;
		}
		if (meta.blocked && this.game.science.policyToggleBlocked){
			model.visible = false;
		}
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

	shouldBeBough: function(model, game){ //fail checks:
		if(this.game.village.leader && model.metadata.requiredLeaderJob && this.game.village.leader.job != model.metadata.requiredLeaderJob){
			var jobTitle = this.game.village.getJob(model.metadata.requiredLeaderJob).title;
			this.game.msg($I("msg.policy.wrongLeaderJobForResearch", [model.metadata.label, jobTitle]), "important");
			return false;
		}else if(model.metadata.name == "transkittenism" && this.game.bld.getBuildingExt("aiCore").meta.effects["aiLevel"] >= 15){
			this.game.msg($I("msg.policy.aiNotMerges"),"alert", "ai");
			return false;
		}else if(model.metadata.blocked != true) {
             for(var i = 0; i < model.metadata.blocks.length; i++){
                if(this.game.science.getPolicy(model.metadata.blocks[i]).researched){
                    model.metadata.blocked = true;
                    return false;
                }
			}
			var confirmed = false; //confirmation:
			if(game.opts.noConfirm){
				return true;
			}
			game.ui.confirm($I("policy.confirmation.title"), $I("policy.confirmation.title"), function() {
				confirmed = true;
			});
		}
		return confirmed;
	},
	buyItem: function(model, event, callback) {
		if ((!model.metadata.researched && this.hasResources(model)) || this.game.devMode){
			if(!this.shouldBeBough(model, this.game)){
				callback(false);
				return;
			}
			this.payPrice(model);

			this.onPurchase(model);

			callback(true);
			this.game.render();
			return;
		}
		callback(false);
	},
	onPurchase: function(model){
		this.inherited(arguments);
		var meta = model.metadata;
			if (meta.blocks){
				for (var i in meta.blocks){
					var policy = this.game.science.getPolicy( meta.blocks[i]);
					policy.blocked = true;
				}
			}
			if(meta.onResearch){
				meta.onResearch(this.game);
			}
		}
});

dojo.declare("classes.ui.PolicyPanel", com.nuclearunicorn.game.ui.Panel, {

	toggleResearchedSpan: null,
	toggleBlockedSpan: null,

	render: function(container){
		var content = this.inherited(arguments),
			self = this;
		var msgBox = dojo.create("span", { style: { display: "inline-block", marginBottom: "10px", width: "50%"}}, content);
		msgBox.innerHTML = $I("msg.policy.exclusivity");

		var div = dojo.create("div", { style: { float: "right"}}, content);

		this.toggleResearchedSpan = dojo.create("span", null, div);

		var groupCheckbox = dojo.create("input", {
            id : "policyToggleResearched",
            type: "checkbox",
            checked: this.game.science.policyToggleResearched,
            style: {
                //display: hasCivil ? "" : "none"
            }
        }, this.toggleResearchedSpan);

        dojo.connect(groupCheckbox, "onclick", this, function(){
            this.game.science.policyToggleResearched = !this.game.science.policyToggleResearched;

		  this.update(); //Update policy panel UI
        });

		dojo.create("label", { innerHTML: $I("science.policyToggleResearched.label") + "<br>", for: "policyToggleResearched"}, this.toggleResearchedSpan);

		this.toggleBlockedSpan = dojo.create("span", null, div);

		var groupCheckbox1 = dojo.create("input", {
            id : "policyToggleBlocked",
            type: "checkbox",
            checked: this.game.science.policyToggleBlocked,
            style: {
                //display: hasCivil ? "" : "none"
            }
        }, this.toggleBlockedSpan);

        dojo.connect(groupCheckbox1, "onclick", this, function(){
            this.game.science.policyToggleBlocked = !this.game.science.policyToggleBlocked;

		  this.update(); //Update policy panel UI
        });

        dojo.create("label", { innerHTML: $I("science.policyToggleBlocked.label"), for: "policyToggleBlocked"}, this.toggleBlockedSpan);


		var controller = new classes.ui.PolicyBtnController(this.game);
		dojo.forEach(this.game.science.policies, function(policy, i){
			var button =
				new com.nuclearunicorn.game.ui.BuildingResearchBtn({
					id: policy.name, controller: controller}, self.game);
			button.render(content);
			self.addChild(button);
		});

		dojo.create("div", { style: { clear: "both"}}, content);
	},

	update: function() {
		this.inherited(arguments);
		
		var allPolicies = this.game.science.policies;

		//Set this entire panel to only be visible if at least 1 policy is unlocked:
		dojo.style(this.panelDiv, "display", dojo.some(allPolicies, function(policy) {return policy.unlocked;}) ? "block" : "none" );

		//Set the "toggle researched policies" checkbox to only be visible if at least 1 policy would be affected by it:
		dojo.style(this.toggleResearchedSpan, "display", dojo.some(allPolicies,
			function(policy) {return policy.researched;}) ? "block" : "none" );

		//Set the "toggle blocked policies" checkbox to only be visible if at least 1 policy would be affected by it:
		dojo.style(this.toggleBlockedSpan, "display", dojo.some(allPolicies,
			function(policy) {return policy.blocked;}) ? "block" : "none" );
	},
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
		var prices_result = this.game.village.getEffectLeader("scientist", this.inherited(arguments));

		// this is to force Gold Ore pathway in BSK+IW and avoid soft locks
		if(this.game.ironWill && this.game.challenges.isActive('blackSky')) {
			if(model.metadata.name == 'construction') {
				prices_result = prices_result.concat([{name: "gold", val: 5}]);
			}
		}

		return prices_result;
    },

	updateVisible: function(model){
		var meta = model.metadata;
		model.visible = meta.unlocked;

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

		dojo.create("tr", null, table);

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

		this.policyPanel = new classes.ui.PolicyPanel($I("policy.panel.label"), this.game.science);
		this.policyPanel.game = this.game;
		// this.policyPanel.policyToggleBlocked = this.game.science.policyToggleBlocked;
		// this.policyPanel.policyToggleResearched = this.game.science.policyToggleResearched;
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
		if(this.game.detailedPollutionInfo){
			this.detailedPollutionInfo = dojo.create("span", { style: { display: "inline-block", marginBottom: "20px"}}, tabContainer);
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
		//detailedPollutionInfo is temporary tag. Don't replace lines belov with i18n lines!
		if(this.game.detailedPollutionInfo){
			if(this.detailedPollutionInfo){
				var currentCathPollution = this.game.bld.cathPollution;
				var currenCathPerTickPollution = this.game.bld.cathPollutionPerTick;
				this.detailedPollutionInfo.innerHTML = "Pollution is " + Math.floor(currentCathPollution) +
					" (" + this.game.getDisplayValueExt(currentCathPollution) + ") " +
					"<br>Polution per tick is " + Math.floor(currenCathPerTickPollution);
				var pollutionLevel = this.game.bld.getPollutionLevel();
				this.detailedPollutionInfo.innerHTML += "<br>Pollution level is " + pollutionLevel;
				if(pollutionLevel >= 0){
					this.detailedPollutionInfo.innerHTML += "<br>Pollution future effects might be at this pollution level:";
					this.detailedPollutionInfo.innerHTML += "<br>— Less catnip production";
					if(pollutionLevel >= 1){
						this.detailedPollutionInfo.innerHTML += "<br>— Less kitten happiness: " + this.game.bld.pollutionEffects["pollutionHappines"] + "%";
					}
					if(pollutionLevel >= 2){
						this.detailedPollutionInfo.innerHTML += "<br>— Kittens arrive " + this.game.bld.pollutionEffects["pollutionArrivalSlowdown"] + " times slower.";
					}
					if(pollutionLevel > 4){
						this.detailedPollutionInfo.innerHTML += "<br>— SR effect doesn't apply to wood and catnip";
					}else if(pollutionLevel >= 3){
						this.detailedPollutionInfo.innerHTML += "<br>— Less SR effect on wood and catnip";
					}
				}
				if(currenCathPerTickPollution < 0 && currentCathPollution) {
					var toZero = -currentCathPollution / currenCathPerTickPollution / this.game.calendar.ticksPerDay;
					this.detailedPollutionInfo.innerHTML += "<br> To zero " + this.game.toDisplaySeconds(toZero.toFixed());
				}else if(currenCathPerTickPollution > 0){
					var toNextLevel = (Math.pow(10, 1 + pollutionLevel) * this.game.bld.getPollutionLevelBase() - currentCathPollution) / currenCathPerTickPollution / this.game.calendar.ticksPerDay;
					this.detailedPollutionInfo.innerHTML += "<br> To next level " + this.game.toDisplaySeconds(toNextLevel.toFixed());
				}
			}
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
