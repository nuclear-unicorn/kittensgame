dojo.declare("classes.managers.WorkshopManager", com.nuclearunicorn.core.TabManager, {

	game: null,

	hideResearched: false,

	upgrades:[
		//--------------------- food upgrades ----------------------
		{
		name: "mineralHoes",
		label: $I("workshop.mineralHoes.label"),
		description: $I("workshop.mineralHoes.desc"),
		effects: {
			"catnipJobRatio" : 0.5
		},
		prices:[
			{ name : "minerals", val: 275 },
			{ name : "science", val: 100 }
		],
		unlocks: {
			upgrades: ["ironHoes"]
		}
	},{
		name: "ironHoes",
		label: $I("workshop.ironHoes.label"),
		description: $I("workshop.ironHoes.desc"),
		effects: {
			"catnipJobRatio" : 0.3
		},
		prices:[
			{ name : "iron", val: 25 },
			{ name : "science", val: 200 }
		],
	},
	//--------------------- wood upgrades ----------------------
	{
		name: "mineralAxes",
		label: $I("workshop.mineralAxes.label"),
		description: $I("workshop.mineralAxes.desc"),
		effects: {
			"woodJobRatio" : 0.7
		},
		prices:[
			{ name : "minerals", val: 500 },
			{ name : "science", val: 100 }
		],
		unlocks: {
			upgrades: ["ironAxes"]
		}
	},{
		name: "ironAxes",
		label: $I("workshop.ironAxes.label"),
		description: $I("workshop.ironAxes.desc"),
		effects: {
			"woodJobRatio" : 0.5
		},
		prices:[
			{ name : "iron", val: 50 },
			{ name : "science", val: 200 }
		]
	},{
		name: "steelAxe",
		label: $I("workshop.steelAxe.label"),
		description: $I("workshop.steelAxe.desc"),
		effects: {
			"woodJobRatio" : 0.5
		},
		prices:[
			{ name : "science", val: 20000 },
			{ name : "steel", val: 75 }
		]
	},{
		name: "reinforcedSaw",
		label: $I("workshop.reinforcedSaw.label"),
		description: $I("workshop.reinforcedSaw.desc"),
		effects: {
			"lumberMillRatio" : 0.2
		},
		prices:[
			{ name : "iron", val: 1000 },
			{ name : "science", val: 2500 }
		],
		upgrades: {
			buildings: ["lumberMill"]
		}
	},{
		name: "steelSaw",
		label: $I("workshop.steelSaw.label"),
		description: $I("workshop.steelSaw.desc"),
		effects: {
			"lumberMillRatio" : 0.2
		},
		prices:[
			{ name : "science", val: 52000 },
			{ name : "steel", val: 750 }
		],
		upgrades: {
			buildings: ["lumberMill"]
		},
		unlocks: {
			upgrades: ["titaniumSaw"]
		}
	},{
		name: "titaniumSaw",
		label: $I("workshop.titaniumSaw.label"),
		description: $I("workshop.titaniumSaw.desc"),
		effects: {
			"lumberMillRatio" : 0.15
		},
		prices:[
			{ name : "titanium", val: 500 },
			{ name : "science", val: 70000 }
		],
		upgrades: {
			buildings: ["lumberMill"]
		},
		unlocks: {
			upgrades: ["alloySaw"]
		}
	},{
		name: "alloySaw",
		label: $I("workshop.alloySaw.label"),
		description: $I("workshop.alloySaw.desc"),
		effects: {
			"lumberMillRatio" : 0.15
		},
		prices:[
			{ name : "science", val: 85000 },
			{ name : "alloy", val: 75 }
		],
		upgrades: {
			buildings: ["lumberMill"]
		}
	},{
		name: "titaniumAxe",
		label: $I("workshop.titaniumAxe.label"),
		description: $I("workshop.titaniumAxe.desc"),
		effects: {
			"woodJobRatio" : 0.5
		},
		prices:[
			{ name : "titanium", val: 10 },
			{ name : "science", val: 38000 }
		]
	},{
		name: "alloyAxe",
		label: $I("workshop.alloyAxe.label"),
		description: $I("workshop.alloyAxe.desc"),
		effects: {
			"woodJobRatio" : 0.5
		},
		prices:[
			{ name : "science", val: 70000 },
			{ name : "alloy", val: 25 }
		]
	},
	//--------------------- unobtainium stuff --------------------------
	{
		name: "unobtainiumAxe",
		label: $I("workshop.unobtainiumAxe.label"),
		description: $I("workshop.unobtainiumAxe.desc"),
		effects: {
			"woodJobRatio" : 0.5
		},
		prices:[
			{ name : "unobtainium", val: 75 },
			{ name : "science", val: 125000 }
		]
	},
	{
		name: "unobtainiumSaw",
		label: $I("workshop.unobtainiumSaw.label"),
		description: $I("workshop.unobtainiumSaw.desc"),
		effects: {
			"lumberMillRatio" : 0.25
		},
		prices:[
			{ name : "unobtainium", val: 125 },
			{ name : "science", val: 145000 }
		],
		upgrades: {
			buildings: ["lumberMill"]
		}
	},
	//--------------------- storage upgrades ----------------------
	{
		name: "stoneBarns",
		label: $I("workshop.stoneBarns.label"),
		description: $I("workshop.stoneBarns.desc"),
		effects: {
			"barnRatio" : 0.75
		},
		prices:[
			{ name : "wood", val: 1000 },
			{ name : "minerals", val: 750 },
			{ name : "iron", val: 50 },
			{ name : "science", val: 500 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		}
	},{
		name: "reinforcedBarns",
		label: $I("workshop.reinforcedBarns.label"),
		description: $I("workshop.reinforcedBarns.desc"),
		effects: {
			"barnRatio" : 0.80
		},
		prices:[
			{ name : "iron", val: 100 },
			{ name : "science", val: 800 },
			{ name : "beam", val: 25 },
			{ name : "slab", val: 10 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		},
		unlocks: {
			upgrades: ["titaniumBarns"]
		}
	},{
		name: "reinforcedWarehouses",
		label: $I("workshop.reinforcedWarehouses.label"),
		description: $I("workshop.reinforcedWarehouses.desc"),
		effects: {
			"warehouseRatio" : 0.25
		},
		prices:[
			{ name : "science", val: 15000 },
			{ name : "plate", val: 50 },
			{ name : "steel", val: 50 },
			{ name : "scaffold", val: 25 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		},
		unlocks: {
			upgrades: ["ironwood"]
		}
	},{
		name: "titaniumBarns",
		label: $I("workshop.titaniumBarns.label"),
		description: $I("workshop.titaniumBarns.desc"),
		effects: {
			"barnRatio" : 1
		},
		prices:[
			{ name : "titanium", val: 25 },
			{ name : "science", val: 60000 },
			{ name : "steel",    val: 200 },
			{ name : "scaffold", val: 250 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		}
	},{
		name: "alloyBarns",
		label: $I("workshop.alloyBarns.label"),
		description: $I("workshop.alloyBarns.desc"),
		effects: {
			"barnRatio" : 1
		},
		prices:[
			{ name : "science", val: 75000 },
			{ name : "plate",    val: 750 },
			{ name : "alloy", val: 20 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		}
	},{
		name: "concreteBarns",
		label: $I("workshop.concreteBarns.label"),
		description: $I("workshop.concreteBarns.desc"),
		effects: {
			"barnRatio" : 0.75
		},
		prices:[
			{ name : "titanium",    val: 2000 },
			{ name : "science", val: 100000 },
			{ name : "concrate", val: 45 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		}
	},{
		name: "titaniumWarehouses",
		label: $I("workshop.titaniumWarehouses.label"),
		description: $I("workshop.titaniumWarehouses.desc"),
		effects: {
			"warehouseRatio" : 0.5
		},
		prices:[
			{ name : "titanium", val: 50 },
			{ name : "science", val: 70000 },
			{ name : "steel",    val: 500 },
			{ name : "scaffold", val: 500 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		}
	},{
		name: "alloyWarehouses",
		label: $I("workshop.alloyWarehouses.label"),
		description: $I("workshop.alloyWarehouses.desc"),
		effects: {
			"warehouseRatio" : 0.45
		},
		prices:[
			{ name : "titanium", val: 750 },
			{ name : "science", val: 90000 },
			{ name : "alloy",    val: 50 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		}
	},{
		name: "concreteWarehouses",
		label: $I("workshop.concreteWarehouses.label"),
		description: $I("workshop.concreteWarehouses.desc"),
		effects: {
			"warehouseRatio" : 0.35
		},
		prices:[
			{ name : "titanium", val: 1250 },
			{ name : "science", val: 100000 },
			{ name : "concrate", val: 35 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		}
	},{
		name: "storageBunkers",
		label: $I("workshop.storageBunkers.label"),
		description: $I("workshop.storageBunkers.desc"),
		effects: {
			"warehouseRatio" : 0.20
		},
		prices:[
			{ name : "unobtainium", val: 500 },
			{ name : "science", 	val: 25000 },
			{ name : "concrate", 	val: 1250 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		}
	},
	//==================== accelerators ==============
	{
		name: "energyRifts",
		label: $I("workshop.energyRifts.label"),
		description: $I("workshop.energyRifts.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 7500 },
			{ name : "uranium", val: 250 },
			{ name : "science", val: 200000 }
		],
		upgrades: {
			buildings: ["accelerator"]
		}
	},{
		name: "stasisChambers",
		label: $I("workshop.stasisChambers.label"),
		description: $I("workshop.stasisChambers.desc"),
		effects: {
			"acceleratorRatio" : 0.95
		},
		prices:[
			{ name : "uranium", val: 2000 },
			{ name : "science", val: 235000 },
			{ name : "timeCrystal", val: 1 },
			{ name : "alloy", val: 	 200 }
		],
		upgrades: {
			buildings: ["accelerator"]
		},
		unlocks: {
			upgrades: ["voidEnergy"]
		}
	},{
		name: "voidEnergy",
		label: $I("workshop.voidEnergy.label"),
		description: $I("workshop.voidEnergy.desc"),
		effects: {
			"acceleratorRatio" : 0.75
		},
		prices:[
			{ name : "uranium",     val: 2500 },
			{ name : "science",     val: 275000 },
			{ name : "timeCrystal", val: 2 },
			{ name : "alloy",       val: 250 }
		],
		upgrades: {
			buildings: ["accelerator"]
		},
		unlocks: {
			upgrades: ["darkEnergy"]
		}
	},{
		name: "darkEnergy",
		label: $I("workshop.darkEnergy.label"),
		description: $I("workshop.darkEnergy.desc"),
		effects: {
			"acceleratorRatio" : 2.5	//TODO: ratio is a subject of change
		},
		prices:[
			{ name : "science",     val: 350000 },
			{ name : "timeCrystal", val: 3 },
			{ name : "eludium",       val: 75 }
		],
		upgrades: {
			buildings: ["accelerator"]
		}
	},{
		name: "chronoforge",
		label: $I("workshop.chronoforge.label"),
		description: $I("workshop.chronoforge.desc"),
		prices:[
			{ name : "science",     val: 500000 },
			{ name : "timeCrystal", val: 10 },
			{ name : "relic",     	val: 5 }
		]
	},{
		name: "tachyonAccelerators",
		label: $I("workshop.tachyonAccelerators.label"),
		description: $I("workshop.tachyonAccelerators.desc"),
		effects: {
			"acceleratorRatio" : 5
		},
		prices:[
			{ name : "science",     val: 500000 },
			{ name : "timeCrystal", val: 10 },
			{ name : "eludium",     val: 125 }
		],
		upgrades: {
			buildings: ["accelerator"]
		}
	},{
		name: "fluxCondensator",
		label: $I("workshop.fluxCondensator.label"),
		description: $I("workshop.fluxCondensator.desc"),
		effects: {
		},
		prices:[
			{ name : "unobtainium", val: 5000 },
			{ name : "timeCrystal", val: 5 },
			{ name : "alloy", 	val: 	 250 }
		]
	},{
		name: "lhc",
		label: $I("workshop.lhc.label"),
		description: $I("workshop.lhc.desc"),
		effects: {
		},
		prices:[
			{ name : "unobtainium", val: 100 },
			{ name : "science", val: 250000 },
			{ name : "alloy", val: 150 }
		],
		upgrades: {
			buildings: ["accelerator"]
		}
	},
	//----------- energy stuff ---------
	{
		name: "photovoltaic",
		label: $I("workshop.photovoltaic.label"),
		description: $I("workshop.photovoltaic.desc"),
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "science", val: 75000 }
		],
		effects: {
			"solarFarmRatio" : 0.5
		},
		upgrades: {
			buildings: ["pasture"]
		}
	},{
		name: "thinFilm",
		label: $I("workshop.thinFilm.label"),
		description: $I("workshop.thinFilm.desc"),
		prices:[
			{ name : "uranium", val: 1000 },
			{ name : "unobtainium", val: 200 },
			{ name : "science", val: 125000 }
		],
		effects: {
			"solarFarmSeasonRatio" : 1
		},
		upgrades: {
			buildings: ["pasture"]
		}
	},{
		name: "qdot",
		label: $I("workshop.qdot.label"),
		description: $I("workshop.qdot.desc"),
		prices:[
			{ name : "science", val: 175000 },
			{ name : "eludium", val: 200 },
			{ name : "thorium", val: 1000 }
		],
		effects: {
			"solarFarmSeasonRatio" : 1
		},
		upgrades: {
			buildings: ["pasture"]
		}
	},
	{
		name: "solarSatellites",
		label: $I("workshop.solarSatellites.label"),
		description: $I("workshop.solarSatellites.desc"),
		prices:[
			{ name : "science", val: 225000 },
			{ name : "alloy", 	val: 750 }
		],
		upgrades: {
			spaceBuilding: ["sattelite"]
		}
	},
	//	------------- harbour stuff ------------
	{
		name: "cargoShips",
		label: $I("workshop.cargoShips.label"),
		description: $I("workshop.cargoShips.desc"),
		effects: {
			"harborRatio" : 0.01
		},
		prices:[
			{ name : "science", val: 55000 },
			{ name : "blueprint", val: 15 }
		],
		upgrades: {
			buildings: ["harbor"]
		},
		flavor: $I("workshop.cargoShips.flavor")
	},{
		name: "barges",
		label: $I("workshop.barges.label"),
		description: $I("workshop.barges.desc"),
		effects: {
			"harborCoalRatio" : 0.5
		},
		prices:[
			{ name : "titanium", val: 1500 },
			{ name : "science", val: 100000 },
			{ name : "blueprint", val: 30 }
		],
		upgrades: {
			buildings: ["harbor"]
		}
	},{
		name: "reactorVessel",
		label: $I("workshop.reactorVessel.label"),
		description: $I("workshop.reactorVessel.desc"),
		effects: {
			"shipLimit" : 0.05
		},
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "uranium",  val: 125 },
			{ name : "science", val: 135000 }
		],
		upgrades: {
			buildings: ["harbor"]
		},
	},{
		name: "ironwood",
		label: $I("workshop.ironwood.label"),
		description: $I("workshop.ironwood.desc"),
		effects: {
			"hutPriceRatio" : -0.5
		},
		prices:[
			{ name : "wood", val: 15000 },
			{ name : "iron", val: 3000 },
			{ name : "science", val: 30000 }
		],
		unlocks: {
			upgrades: ["silos"]
		}
	},{
		name: "concreteHuts",
		label: $I("workshop.concreteHuts.label"),
		description: $I("workshop.concreteHuts.desc"),
		effects: {
			"hutPriceRatio" : -0.30
		},
		prices:[
			{ name : "titanium", val: 3000 },
			{ name : "science", val: 125000 },
			{ name : "concrate", val: 45 }
		],
	},{
		name: "unobtainiumHuts",
		label: $I("workshop.unobtainiumHuts.label"),
		description: $I("workshop.unobtainiumHuts.desc"),
		effects: {
			"hutPriceRatio" : -0.25
		},
		prices:[
			{ name : "titanium", val: 15000 },
			{ name : "unobtainium", val: 350 },
			{ name : "science", val: 200000 }
		],
	},{
		name: "eludiumHuts",
		label: $I("workshop.eludiumHuts.label"),
		description: $I("workshop.eludiumHuts.desc"),
		effects: {
			"hutPriceRatio" : -0.1
		},
		prices:[
			{ name : "science", val: 275000 },
			{ name : "eludium", val: 125 }
		],
	},
	{
		name: "silos",
		label: $I("workshop.silos.label"),
		description: $I("workshop.silos.desc"),
		effects: {
		},
		prices:[
			{ name : "science", val: 50000 },
			{ name : "steel", val: 125 },
			{ name : "blueprint", val: 5 }
		],
		upgrades: {
			buildings: ["barn", "warehouse", "harbor"]
		},
		unlocks: {
			upgrades: ["titaniumWarehouses"]
		},
		flavor: $I("workshop.silos.flavor")
	},{
		name: "refrigeration",
		label: $I("workshop.refrigeration.label"),
		description: $I("workshop.refrigeration.desc"),
		effects: {
			"catnipMaxRatio" : 0.75
		},
		prices:[
			{ name : "titanium", val: 2500 },
			{ name : "science", val: 125000 },
			{ name : "blueprint", val: 15 }
		]
	},
	//--------------------- hunt upgrades ----------------------
	{
		name: "compositeBow",
		label: $I("workshop.compositeBow.label"),
		description: $I("workshop.compositeBow.desc"),
		effects: {
			"manpowerJobRatio" : 0.5
		},
		calculateEffects: function(self, game){
			self.effects["manpowerJobRatio"] = 0.5 * Math.max(0, (1 + game.getEffect("weaponEfficency"))); 
		},
		prices:[
			{ name : "wood", val: 200 },
			{ name : "iron", val: 100 },
			{ name : "science", val: 500 }
		]
	},{
		name: "crossbow",
		label: $I("workshop.crossbow.label"),
		description: $I("workshop.crossbow.desc"),
		effects: {
			"manpowerJobRatio" : 0.25
		},
		calculateEffects: function(self, game){
			self.effects["manpowerJobRatio"] = 0.25 * Math.max(0, (1 + game.getEffect("weaponEfficency")));
		},
		prices:[
			{ name : "iron", val: 1500 },
			{ name : "science", val: 12000 }
		]
	},{
		name: "railgun",
		label: $I("workshop.railgun.label"),
		description: $I("workshop.railgun.desc"),
		effects: {
			"manpowerJobRatio" : 0.25
		},
		calculateEffects: function(self, game){
			self.effects["manpowerJobRatio"] = 0.25 * Math.max(0, (1 + game.getEffect("weaponEfficency")));
		},
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "science", val: 150000 },
			{ name : "blueprint", val: 25 }
		],
		flavor: $I("workshop.railgun.flavor")
	},{
		name: "bolas",
		label: $I("workshop.bolas.label"),
		description: $I("workshop.bolas.desc"),
		effects: {
			"hunterRatio" : 1
		},
		prices:[
			{ name : "wood", val: 50 },
			{ name : "minerals", val: 250 },
			{ name : "science", val: 1000 }
		],
		flavor: $I("workshop.bolas.flavor")
	},{
		name: "huntingArmor",
		label: $I("workshop.huntingArmor.label"),
		description: $I("workshop.huntingArmor.desc"),
		effects: {
			"hunterRatio" : 2
		},
		prices:[
			{ name : "iron", val: 750 },
			{ name : "science", val: 2000 }
		],
        flavor: $I("workshop.huntingArmor.flavor")
	},{
		name: "steelArmor",
		label: $I("workshop.steelArmor.label"),
		description: $I("workshop.steelArmor.desc"),
		effects: {
			"hunterRatio" : 0.5
		},
		prices:[
			{ name : "science", val: 10000 },
			{ name : "steel", val: 50 }
		]
	},{
		name: "alloyArmor",
		label: $I("workshop.alloyArmor.label"),
		description: $I("workshop.alloyArmor.desc"),
		effects: {
			"hunterRatio" : 0.5
		},
		prices:[
			{ name : "science", val: 50000 },
			{ name : "alloy", val: 25 }
		]
	},{
		name: "nanosuits",
		label: $I("workshop.nanosuits.label"),
		description: $I("workshop.nanosuits.desc"),
		effects: {
			"hunterRatio" : 0.5
		},
		prices:[
			{ name : "science", val: 185000 },
			{ name : "alloy", val: 250 }
		]
	},{
		name: "caravanserai",
		label: $I("workshop.caravanserai.label"),
		description: $I("workshop.caravanserai.desc"),
		effects: {
		},
		prices:[
			{ name : "gold", val: 250 },
			{ name : "science", val: 25000 },
			{ name : "ivory", val: 10000 }
		],
		upgrades: {
			buildings: ["tradepost"]
		},
		flavor: $I("workshop.caravanserai.flavor")
	},
	//--------------------- stuff ----------------------
	{
		name: "advancedRefinement",
		label: $I("workshop.advancedRefinement.label"),
		description: $I("workshop.advancedRefinement.desc"),
		effects: {
		},
		prices:[
			{ name : "catnip", val: 5000 },
			{ name : "science", val: 500 }
		],
		handler: function(game){
			game.workshop.getCraft("wood").prices = [{name: "catnip", val: 50}];
		},
		flavor: $I("workshop.advancedRefinement.flavor")
	},{
		name: "goldOre",
		label: $I("workshop.goldOre.label"),
		description: $I("workshop.goldOre.desc"),
		effects: {
		},
		prices:[
			{ name : "minerals", val: 800 },
			{ name : "iron", 	 val: 100 },
			{ name : "science",  val: 1000 }
		],
		upgrades: {
			buildings: ["smelter"]
		},
		flavor: $I("workshop.goldOre.flavor")
	},{
		name: "geodesy",
		label: $I("workshop.geodesy.label"),
		description: $I("workshop.geodesy.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 250 },
			{ name : "science",  val: 90000 },
			{ name : "starchart", val: 500 }
		],
		upgrades: {
			jobs: ["geologist"]
		},
		flavor: $I("workshop.geodesy.flavor")
	},{
		name: "register",
		label: $I("workshop.register.label"),
		description: $I("workshop.register.desc"),
		effects: {
		},
		prices:[
			{ name : "gold", 	 val: 10 },
			{ name : "science",  val: 500 }
		]
	},{
		name: "strenghtenBuild",
		label: $I("workshop.strenghtenBuild.label"),
		description: $I("workshop.strenghtenBuild.desc"),
		effects: {
			"barnRatio" : 0.05,
			"warehouseRatio" : 0.05
		},
		prices:[
			{ name : "science", val: 100000 },
			{ name : "concrate", val: 50 }
		],
		unlocks: {
			upgrades: ["concreteWarehouses", "concreteBarns", "concreteHuts"]
		},
		upgrades: {
			buildings: ["barn", "warehouse", "harbor", "mint"]
		}
	},
	//TODO: thouse two upgrades may be buggy like hell, we should really really revisit handler logic
	{
		name: "miningDrill",
		label: $I("workshop.miningDrill.label"),
		description: $I("workshop.miningDrill.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 1750 },
			{ name : "science",  val: 100000 },
			{ name : "steel", 	 val: 750 }
		],
		upgrades: {
			jobs: ["geologist"]
		},
	},{
		name: "unobtainiumDrill",
		label: $I("workshop.unobtainiumDrill.label"),
		description: $I("workshop.unobtainiumDrill.desc"),
		effects: {
		},
		prices:[
			{ name : "unobtainium", val: 250 },
			{ name : "science",  	val: 250000 },
			{ name : "alloy", 	 	val: 1250 }
		],
		upgrades: {
			jobs: ["geologist"]
		},
	},
	//--------------------- coal upgrades ----------------------
	{
		name: "coalFurnace",
		label: $I("workshop.coalFurnace.label"),
		description: $I("workshop.coalFurnace.desc"),
		effects: {
		},
		prices:[
			{ name : "minerals", val: 5000 },
			{ name : "iron", 	 val: 2000 },
			{ name : "science",  val: 5000 },
			{ name : "beam", 	 val: 35 }
		],
		upgrades: {
			buildings: ["smelter"]
		},
		flavor: $I("workshop.coalFurnace.flavor")
	},{
		name: "deepMining",
		label: $I("workshop.deepMining.label"),
		description: $I("workshop.deepMining.desc"),
		effects: {
		},
		prices:[
			{ name : "iron", 	 val: 1200 },
			{ name : "science",  val: 5000 },
			{ name : "beam", 	 val: 50 }
		],
		upgrades: {
			buildings: ["mine"]
		},
		flavor: $I("workshop.deepMining.flavor")
	},{
		name: "pyrolysis",
		label: $I("workshop.pyrolysis.label"),
		description: $I("workshop.pyrolysis.desc"),
		effects: {
			"coalSuperRatio": 0.2
		},
		prices:[
			{ name : "science",  val: 35000 },
			{ name : "compedium", 	 val: 5 }
		]
	},{
		name: "electrolyticSmelting",
		label: $I("workshop.electrolyticSmelting.label"),
		description: $I("workshop.electrolyticSmelting.desc"),
		effects: {
			"smelterRatio": 0.95
		},
		prices:[
			{ name : "titanium", val: 2000 },
			{ name : "science",  val: 100000 }
		],
		upgrades: {
			buildings: ["smelter"]
		}
	},{
		name: "oxidation",
		label: $I("workshop.oxidation.label"),
		description: $I("workshop.oxidation.desc"),
		effects: {
			"calcinerRatio": 0.95
		},
		prices:[
			{ name : "science",  val: 100000 },
			{ name : "steel", val: 5000 }
		],
		upgrades: {
			buildings: ["calciner"]
		}
	},{
		name: "steelPlants",
		label: $I("workshop.steelPlants.label"),
		description: $I("workshop.steelPlants.desc"),
		effects: {
			"calcinerSteelRatio" : 0.1
		},
		prices:[
			{ name : "titanium", val: 3500 },
			{ name : "science",  val: 140000 },
			{ name : "gear", 	 val: 750 }
		],
		unlocks: {
			upgrades: ["automatedPlants"]
		}
	},{
		name: "automatedPlants",
		label: $I("workshop.automatedPlants.label"),
		description: $I("workshop.automatedPlants.desc"),
		effects: {
			"calcinerSteelCraftRatio" : 0.25
		},
		prices:[
			{ name : "science",  val: 200000 },
			{ name : "alloy", val: 750 }
		],
        unlocks: {
			upgrades: ["nuclearPlants"]
		},
	},{
		name: "nuclearPlants",
		label: $I("workshop.nuclearPlants.label"),
		description: $I("workshop.nuclearPlants.desc"),
		effects: {
			"calcinerSteelReactorBonus" : 0.02
		},
		prices:[
			{ name : "uranium", val: 10000 },
			{ name : "science",  val: 250000 }
		]
	},{
		name: "rotaryKiln",
		label: $I("workshop.rotaryKiln.label"),
		description: $I("workshop.rotaryKiln.desc"),
		effects: {
			"calcinerRatio": 0.75
		},
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "science",  val: 145000 },
			{ name : "gear", 	 val: 500 }
		],
		upgrades: {
			buildings: ["calciner"]
		}
	},
	{
		name: "fluidizedReactors",
		label: $I("workshop.fluidizedReactors.label"),
		description: $I("workshop.fluidizedReactors.desc"),
		effects: {
			"calcinerRatio": 1
		},
		prices:[
			{ name : "science", val: 175000 },
			{ name : "alloy", val: 200 }
		],
		upgrades: {
			buildings: ["calciner"]
		}
	},
	{
		name: "nuclearSmelters",
		label: $I("workshop.nuclearSmelters.label"),
		description: $I("workshop.nuclearSmelters.desc"),
		effects: {
		},
		prices:[
			{ name : "uranium", val: 250 },
			{ name : "science",  val: 165000 }
		],
		upgrades: {
			buildings: ["smelter"]
		},
	},{
        name: "orbitalGeodesy",
        label: $I("workshop.orbitalGeodesy.label"),
        description: $I("workshop.orbitalGeodesy.desc"),
        effects: {
		},
		upgrades: {
			buildings: ["quarry"]
		},
        prices:[
			{ name : "oil", 	 val: 35000 },
			{ name : "science",  val: 150000 },
			{ name : "alloy", 	 val: 1000 }
		]
	},
	//--------------------- automation upgrades ----------------------
	{
		name: "printingPress",
		label: $I("workshop.printingPress.label"),
		description: $I("workshop.printingPress.desc"),
		effects: {
		},
		prices:[
			{ name : "science",  val: 7500 },
			{ name : "gear", 	 val: 45 }
		],
		upgrades: {
			buildings: ["steamworks"]
		}
	},{
		name: "offsetPress",
		label: $I("workshop.offsetPress.label"),
		description: $I("workshop.offsetPress.desc"),
		effects: {
		},
		prices:[
			{ name : "oil", 	 val: 15000 },
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 250 }
		],
		upgrades: {
			buildings: ["steamworks"]
		},
		flavor: $I("workshop.offsetPress.flavor")
	},{
		name: "photolithography",
		label: $I("workshop.photolithography.label"),
		description: $I("workshop.photolithography.desc"),
		effects: {
		},
		prices:[
			{ name : "oil", 	 val: 50000 },
			{ name : "uranium",  val: 250 },
			{ name : "science",  val: 250000 },
			{ name : "alloy", 	 val: 1250 }
		],
		upgrades: {
			buildings: ["steamworks"]
		}
	},{
		name: "uplink",
		label: $I("workshop.uplink.label"),
		description: $I("workshop.uplink.desc"),
		effects: {
			"uplinkDCRatio": 0.01,
			"uplinkLabRatio": 0.01
		},
		prices:[
			{ name : "science",  val: 75000 },
			{ name : "alloy", 	 val: 1750 }
		],
		upgrades: {
			buildings: ["library", "biolab"]
		}
	},{
		name: "starlink",
		label: $I("workshop.starlink.label"),
		description: $I("workshop.starlink.desc"),
		effects: {
			"uplinkLabRatio": 0.01
		},
		prices:[
			{ name : "oil", 	 val: 25000 },
			{ name : "science",  val: 175000 },
			{ name : "alloy", 	 val: 5000 }
		],
		upgrades: {
			buildings: ["library","biolab"]
		}
	},{
		name: "cryocomputing",
		label: $I("workshop.cryocomputing.label"),
		description: $I("workshop.cryocomputing.desc"),
		effects: {
		},
		prices:[
			{ name : "science",  val: 125000 },
			{ name : "eludium",  val: 15 }
		],
		upgrades: {
			buildings: ["library"]
		}
	},{
		name: "machineLearning",
		label: $I("workshop.machineLearning.label"),
		description: $I("workshop.machineLearning.desc"),
		effects: {
			"dataCenterAIRatio": 0.1
		},
		prices:[
			{ name : "antimatter",  val: 125 },
			{ name : "science",     val: 175000 },
			{ name : "eludium",  	val: 25 }
		],
		upgrades: {
			buildings: ["library"]
		}
	},
	{
		name: "factoryAutomation",
		label: $I("workshop.factoryAutomation.label"),
		description: $I("workshop.factoryAutomation.desc"),
		effects: {
		},
		prices:[
			{ name : "science",  val: 10000 },
			{ name : "gear", 	 val: 25 }
		],
		flavor: $I("workshop.factoryAutomation.flavor")
	},{
		name: "advancedAutomation",
		label: $I("workshop.advancedAutomation.label"),
		description: $I("workshop.advancedAutomation.desc"),
		effects: {
		},
		prices:[
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 75 },
			{ name : "blueprint",  val: 25 }
		]
	},{
		name: "pneumaticPress",
		label: $I("workshop.pneumaticPress.label"),
		description: $I("workshop.pneumaticPress.desc"),
		effects: {
		},
		prices:[
			{ name : "science",  val: 20000 },
			{ name : "gear", 	 val: 30 },
			{ name : "blueprint",  val: 5 }
		]
	},{
		name: "combustionEngine",
		label: $I("workshop.combustionEngine.label"),
		description: $I("workshop.combustionEngine.desc"),
		effects: {
			"coalRatioGlobalReduction" : 0.2
		},
		prices:[
			{ name : "science",  val: 20000 },
			{ name : "gear", 	 val: 25 },
			{ name : "blueprint",  val: 5 }
		],
		upgrades: {
			buildings: ["steamworks"]
		},
        flavor: $I("workshop.combustionEngine.flavor")
	},{
		name: "fuelInjectors",
		label: $I("workshop.fuelInjectors.label"),
		description: $I("workshop.fuelInjectors.desc"),
		effects: {
			"coalRatioGlobalReduction" : 0.2
		},
		prices:[
			{ name : "oil", 	 val: 20000 },
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 250 }
		],
		upgrades: {
			buildings: ["steamworks"]
		}
	},
	{
		name: "factoryLogistics",
		label: $I("workshop.factoryLogistics.label"),
		description: $I("workshop.factoryLogistics.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 2000 },
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 250 }
		],
		upgrades: {
			buildings: ["factory"]
		}
	},{
		name: "carbonSequestration",
		label: $I("workshop.carbonSequestration.label"),
		description: $I("workshop.carbonSequestration.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 1250 },
			{ name : "science",  val: 75000 },
			{ name : "gear", 	 val: 125 },
			{ name : "steel", 	 val: 4000 },
			{ name : "alloy", 	 val: 1000 }
		],
		upgrades:{
			buildings: ["factory"]
		}
	},{
		name: "factoryOptimization",
		label: $I("workshop.factoryOptimization.label"),
		description: $I("workshop.factoryOptimization.desc"),
		effects: {
			"t1CraftRatio": 10,
			"t2CraftRatio": 2
		},
		prices:[
			{ name : "titanium", val: 1250 },
			{ name : "science",  val: 75000 },
			{ name : "gear", 	 val: 125 }
		]
	},{
		name: "factoryRobotics",
		label: $I("workshop.factoryRobotics.label"),
		description: $I("workshop.factoryRobotics.desc"),
		effects: {
			"t1CraftRatio": 10,
			"t2CraftRatio": 5,
			"t3CraftRatio": 2
		},
		prices:[
			{ name : "titanium", val: 2500 },
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 250 }
		]
	},{
		name: "spaceEngineers",
		label: $I("workshop.spaceEngineers.label"),
		description: $I("workshop.spaceEngineers.desc"),
		effects: {
			"t1CraftRatio": 2,
			"t2CraftRatio": 2,
			"t3CraftRatio": 2,
			"t4CraftRatio": 2
		},
		prices:[
			{ name : "science",  val: 225000 },
			{ name : "alloy", 	 val: 500 }
		]
	},{
		name: "aiEngineers",
		label: $I("workshop.aiEngineers.label"),
		description: $I("workshop.aiEngineers.desc"),
		effects: {
			"t1CraftRatio": 10,
			"t2CraftRatio": 5,
			"t3CraftRatio": 5,
			"t4CraftRatio": 2,
			"t5CraftRatio": 2
		},
		prices:[
			{ name : "antimatter",  val: 500 },
			{ name : "science",     val: 35000 },
			{ name : "eludium",     val: 50 }
		]
	},{
		name: "chronoEngineers",
		label: $I("workshop.chronoEngineers.label"),
		description: $I("workshop.chronoEngineers.desc"),
		effects: {
			"t1CraftRatio": 2,
			"t2CraftRatio": 2,
			"t3CraftRatio": 2,
			"t4CraftRatio": 2,
			"t5CraftRatio": 2
		},
		prices:[
			{ name : "science",     val: 500000 },
			{ name : "timeCrystal", val: 5 },
			{ name : "eludium",     val: 100 }
		]
	}, {
		name: "spaceManufacturing",
		label: $I("workshop.spaceManufacturing.label"),
		description: $I("workshop.spaceManufacturing.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 125000 },
			{ name : "science",  val: 250000 }
		],
		upgrades: {
			buildings: ["factory"]
		}
	},
	//--------------------- science upgrades ----------------------
	{
		name: "celestialMechanics",
		label: $I("workshop.celestialMechanics.label"),
		description: $I("workshop.celestialMechanics.desc"),
		effects: {},
		prices:[
			{ name : "science",  val: 250 }
		]
	},{
		name: "astrolabe",
		label: $I("workshop.astrolabe.label"),
		description: $I("workshop.astrolabe.desc"),
		effects: {},
		prices:[
			{ name : "titanium", val: 5 },
			{ name : "science",  val: 25000 },
			{ name : "starchart",  val: 75 }
		],
		upgrades: {
			buildings: ["observatory"]
		},
	},
	{
		name: "titaniumMirrors",
		label: $I("workshop.titaniumMirrors.label"),
		description: $I("workshop.titaniumMirrors.desc"),
		effects: {
			"libraryRatio" : 0.02
		},
		prices:[
			{ name : "titanium", val: 15 },
			{ name : "science",  val: 20000 },
			{ name : "starchart",  val: 20 }
		],
		upgrades: {
			buildings: ["library"]
		},
		flavor: $I("workshop.titaniumMirrors.flavor")
	},
	{
		name: "unobtainiumReflectors",
		label: $I("workshop.unobtainiumReflectors.label"),
		description: $I("workshop.unobtainiumReflectors.desc"),
		effects: {
			"libraryRatio" : 0.02
		},
		prices:[
			{ name : "unobtainium", val: 75 },
			{ name : "science",  val: 250000 },
			{ name : "starchart",  val: 750 }
		],
		upgrades: {
			buildings: ["library"]
		}
	},
	{
		name: "eludiumReflectors",
		label: $I("workshop.eludiumReflectors.label"),
		description: $I("workshop.eludiumReflectors.desc"),
		effects: {
			"libraryRatio" : 0.02
		},
		prices:[
			{ name : "science",  val: 250000 },
			{ name : "eludium", val: 15 }
		],
		upgrades: {
			buildings: ["library"]
		}
	},
    {
        name: "hydroPlantTurbines",
        label: $I("workshop.hydroPlantTurbines.label"),
        description: $I("workshop.hydroPlantTurbines.desc"),
        effects: {
            "hydroPlantRatio": 0.15
        },
        prices: [
            {name: "unobtainium", val: 125},
            {name: "science", val: 250000}
        ],
        upgrades: {
            buildings: ["aqueduct"]
        }
    },{
		name: "amBases",
		label: $I("workshop.amBases.label"),
		description: $I("workshop.amBases.desc"),
		prices: [
			{name: "antimatter", val: 250},
			{name: "eludium", val: 15}
		],
		upgrades: {
			spaceBuilding: ["moonBase"]
		},
		unlocks: {
			upgrades: ["aiBases"]
		}
	},{
		name: "aiBases",
		label: $I("workshop.aiBases.label"),
		description: $I("workshop.aiBases.desc"),
		prices:[
			{ name : "antimatter", val: 7500 },
			{ name : "science", val: 750000 }
		],
		upgrades: {
			spaceBuilding: ["moonBase"]
		}
	},{
		name: "amFission",
		label: $I("workshop.amFission.label"),
		description: $I("workshop.amFission.desc"),
		prices:[
			{ name : "antimatter", val: 175 },
			{ name : "science",  val: 525000 },
			{ name : "thorium", val: 7500 }
		],
		effects: {
			"eludiumAutomationBonus" : 0.25
		}
	},{
		name: "amReactors",
		label: $I("workshop.amReactors.label"),
		description: $I("workshop.amReactors.desc"),
		effects: {
			"spaceScienceRatio": 0.95
		},
		prices: [
			{name: "antimatter", val: 750},
			{name: "eludium", val: 35}
		],
		upgrades: {
			spaceBuilding: ["researchVessel", "spaceBeacon"]
		},
		unlocks: {
			upgrades: ["amReactorsMK2"]
		}
	},{
		name: "amReactorsMK2",
		label: $I("workshop.amReactorsMK2.label"),
		description: $I("workshop.amReactorsMK2.desc"),
		effects: {
			"spaceScienceRatio": 1.5
		},
		upgrades: {
			spaceBuilding: ["researchVessel", "spaceBeacon"]
		},
		prices: [
			{name: "antimatter", val: 1750},
			{name: "eludium", val: 70}
		],
		unlocks: {
			upgrades: ["voidReactors"]
		}
	},{
		name: "voidReactors",
		label: $I("workshop.voidReactors.label"),
		description: $I("workshop.voidReactors.desc"),
		effects: {
			"spaceScienceRatio": 4
		},
		upgrades: {
			spaceBuilding: ["researchVessel", "spaceBeacon"]
		},
		prices: [
			{name: "antimatter", val: 2500},
			{name: "void", val: 250}
		]
	},{
		name: "relicStation",
		label: $I("workshop.relicStation.label"),
		description: $I("workshop.relicStation.desc"),
		effects: {
			"beaconRelicsPerDay": 0.01
		},
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		prices: [
			{name: "antimatter", val: 5000},
			{name: "eludium", val: 100}
		]
	},{
			name: "amDrive",
			label: $I("workshop.amDrive.label"),
			description: $I("workshop.amDrive.desc"),
			prices:[
				{ name : "antimatter", val: 125 },
				{ name : "science",  val: 450000 }
			],
			effects: {
				"routeSpeed" : 25
			}
	},
	//---------------------- oil ---------------
	{
		name: "pumpjack",
		label: $I("workshop.pumpjack.label"),
		description: $I("workshop.pumpjack.desc"),
		effects: {
			"oilWellRatio" : 0.45
		},
		prices:[
			{ name : "titanium", val: 250 },
			{ name : "science",  val: 100000 },
			{ name : "gear", 	 val: 125 }
		],
		upgrades: {
			buildings: ["oilWell"]
		}
	},{
		name: "biofuel",
		label: $I("workshop.biofuel.label"),
		description: $I("workshop.biofuel.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 1250 },
			{ name : "science",  val: 150000 }
		],
		upgrades: {
			buildings: ["biolab"]
		}
	},
	{
		name: "unicornSelection",
		label: $I("workshop.unicornSelection.label"),
		description: $I("workshop.unicornSelection.desc"),
		effects: {
			"unicornsGlobalRatio": 0.25
		},
		prices:[
			{ name : "titanium", val: 1500 },
			{ name : "science",  val: 175000 }
		]
	},
	{
		name: "gmo",
		label: $I("workshop.gmo.label"),
		description: $I("workshop.gmo.desc"),
		effects: {
			"biofuelRatio": 0.6
		},
		prices:[
			{ name : "catnip",   val: 1000000 },
			{ name : "titanium", val: 1500 },
			{ name : "science",  val: 175000 }
		],
		upgrades: {
			buildings: ["biolab"]
		}
	},
	//------------------- blueprints ----------------
	{
		name: "cadSystems",
		label: $I("workshop.cadSystems.label"),
		description: $I("workshop.cadSystems.desc"),
		effects: {
			"cadBlueprintCraftRatio" : 0.01
		},
		prices:[
			{ name : "titanium", val: 750 },
			{ name : "science",  val: 125000 }
		]
	},{
		name: "seti",
		label: $I("workshop.seti.label"),
		description: $I("workshop.seti.desc"),
		effects: {
		},
		prices:[
			{ name : "titanium", val: 250 },
			{ name : "science",  val: 125000 }
		]
	},{
		name: "logistics",
		label: $I("workshop.logistics.label"),
		description: $I("workshop.logistics.desc"),
		effects: {
			"skillMultiplier" : 0.15
		},
		prices:[
			{ name : "science",  val: 100000 },
			{ name : "gear", val: 100 },
			{ name : "scaffold",  val: 1000 }
		]
	},{
		name: "augumentation",
		label: $I("workshop.augumentation.label"),
		description: $I("workshop.augumentation.desc"),
		effects: {
			"skillMultiplier" : 1
		},
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "uranium",  val: 50 },
			{ name : "science",  val: 150000 }
		]
	},{
		name: "internet",
		label: $I("workshop.internet.label"),
		description: $I("workshop.internet.desc"),
		effects: {},
		prices:[
			{ name : "titanium", val: 5000 },
			{ name : "uranium",  val: 50 },
			{ name : "science",  val: 150000 }
		]
	},{
		name: "neuralNetworks",
		label: $I("workshop.neuralNetworks.label"),
		description: $I("workshop.neuralNetworks.desc"),
		effects: {},
		prices:[
			{ name : "titanium", val: 7500 },
			{ name : "science",  val: 200000 }
		],
		unlocks: {
		},
		upgrades: {
			buildings: ["factory"]
		}
	},{
		name: "assistance",
		label: $I("workshop.assistance.label"),
		description: $I("workshop.assistance.desc"),
		effects: {
			"catnipDemandWorkerRatioGlobal" : -0.25
		},
		prices:[
			{ name : "science", val: 100000 },
			{ name : "steel", val: 10000 },
			{ name : "gear", val: 250 }
		]
	},{
		name: "enrichedUranium",
		label: $I("workshop.enrichedUranium.label"),
		description: $I("workshop.enrichedUranium.desc"),
		effects: {
			"uraniumRatio" : 0.25
		},
		prices:[
			{ name : "titanium", val: 7500 },
			{ name : "uranium",  val: 150 },
			{ name : "science",  val: 175000 }
		],
		upgrades: {
			buildings: ["reactor"]
		}
	},{
        name: "coldFusion",
        label: $I("workshop.coldFusion.label"),
        description: $I("workshop.coldFusion.desc"),
        effects: {
            "reactorEnergyRatio": 0.25
        },
        prices:[
            { name : "science",  val: 200000 },
            { name : "eludium",  val: 25 }
        ],
        upgrades: {
            buildings: ["reactor"]
        }
    },{
        name: "thoriumReactors",
        label: $I("workshop.thoriumReactors.label"),
        description: $I("workshop.thoriumReactors.desc"),
        effects: {
            "reactorThoriumPerTick": -0.05,
            "reactorEnergyRatio": 0.25
        },
        prices:[
            { name : "science",  val: 400000 },
            { name : "thorium",  val: 10000 }
        ],
        upgrades: {
            buildings: ["reactor"]
        },
		unlocks: {
			upgrades: ["enrichedThorium"]
		}
    },{
		name: "enrichedThorium",
		label: $I("workshop.enrichedThorium.label"),
		description: $I("workshop.enrichedThorium.desc"),
		effects: {
			"reactorThoriumPerTick": 0.0125
		},
		prices:[
			{ name : "science",  val: 500000 },
			{ name : "thorium",  val: 12500 }
		],
		upgrades: {
			buildings: ["reactor"]
		}
	},
	//------------------- starcharts / space ----------------
	{
		name: "hubbleTelescope",
		label: $I("workshop.hubbleTelescope.label"),
		description: $I("workshop.hubbleTelescope.desc"),
		effects: {
			"starchartGlobalRatio" : 0.30
		},
		prices:[
			{ name : "oil", 	 val: 50000 },
			{ name : "science",  val: 250000 },
			{ name : "alloy", 	 val: 1250 }
		],
		unlocks: {
			upgrades: ["satnav"]
		}
	},
	{
		name: "satnav",
		label: $I("workshop.satnav.label"),
		description: $I("workshop.satnav.desc"),
		effects: {
			"satnavRatio" : 0.0125
		},
		prices:[
			{ name : "science",  val: 200000 },
			{ name : "alloy", 	 val: 750 }
		]
	},{
        name: "satelliteRadio",
        label: $I("workshop.satelliteRadio.label"),
        description: $I("workshop.satelliteRadio.desc"),
        effects: {
            "broadcastTowerRatio" : 0.005
        },
        prices:[
            { name : "science",  val: 225000 },
            { name : "alloy", 	 val: 5000 }
        ]
    },
	{
		name: "astrophysicists",
		label: $I("workshop.astrophysicists.label"),
		description: $I("workshop.astrophysicists.desc"),
		effects: {
		},
		prices:[
			{ name : "unobtainium", val: 350 },
			{ name : "science",  val: 250000 }
		],
		upgrades: {
			jobs: ["scholar"]
		}
	},{
		name: "mWReactor",
		label: $I("workshop.mWReactor.label"),
		description: $I("workshop.mWReactor.desc"),
		effects: {
			"lunarOutpostRatio" : 0.75
		},
		prices:[
			{ name : "science",  val: 150000 },
			{ name : "eludium", val: 50 }
		]
	},
	{
		name: "eludiumCracker",
		label: $I("workshop.eludiumCracker.label"),
		description: $I("workshop.eludiumCracker.desc"),
		effects: {
			"crackerRatio" : 1.0
		},
		prices:[
			{ name : "science",  val: 275000 },
			{ name : "eludium", val: 250 }
		],
		upgrades: {
			spaceBuilding: ["planetCracker"]
		}
	},
	{
		name: "thoriumEngine",
		label: $I("workshop.thoriumEngine.label"),
		description: $I("workshop.thoriumEngine.desc"),
		prices:[
			{ name : "science",  val: 400000 },
			{ name : "gear", val: 40000 },
			{ name : "alloy", val: 2000 },
			{ name : "ship", val: 10000 },
			{ name : "thorium", val: 100000 }
		],
		effects: {
			"routeSpeed" : 50
		}
	},
	{
		name: "spiceNavigation",
		label: $I("workshop.spiceNavigation.label"),
		description: $I("workshop.spiceNavigation.desc"),
		prices:[
			{ name : "science",  val: 350000 },
			{ name : "starchart",  val: 500000 }
		],
		unlocks: {
			spaceBuilding: ["navigationRelay"],
		},
		flavor: $I("workshop.spiceNavigation.flavor")
	},
	{
		name: "longRangeSpaceships",
		label: $I("workshop.longRangeSpaceships.label"),
		description: $I("workshop.longRangeSpaceships.desc"),
		prices:[
			{ name : "science",  val: 440000 },
			{ name : "gear", val: 90000 },
			{ name : "alloy", val: 3500 },
			{ name : "tanker", val: 500 },
		],
		unlocks: {
			spaceBuilding: ["spaceShuttle"],
		},
		flavor: $I("workshop.longRangeSpaceships.flavor")
	},
	//------------------- oil --------------------------
    {
		name: "oilRefinery",
		label: $I("workshop.oilRefinery.label"),
		description: $I("workshop.oilRefinery.desc"),
		effects: {
			"oilWellRatio" : 0.35
		},
		prices:[
			{ name : "titanium", val: 1250 },
			{ name : "science",  val: 125000 },
			{ name : "gear", 	 val: 500 }
		],
		upgrades: {
			buildings: ["oilWell"]
		}
	},{
        name: "oilDistillation",
        label: $I("workshop.oilDistillation.label"),
        description: $I("workshop.oilDistillation.desc"),
        effects: {
            "oilWellRatio" : 0.75
        },
        prices:[
            { name : "titanium", val: 5000 },
            { name : "science",  val: 175000 }
        ],
        upgrades: {
            buildings: ["oilWell"]
        }
    },{
        name: "factoryProcessing",
        label: $I("workshop.factoryProcessing.label"),
        description: $I("workshop.factoryProcessing.desc"),
        effects: {
            "factoryRefineRatio" : 0.05
        },
        prices:[
            { name : "titanium", val: 7500   },
            { name : "science",  val: 195000 },
            { name : "concrate", val: 125    }
        ]
    },
    //---------------- Void Space ---------------
    {
        name: "voidAspiration",
        label: $I("workshop.voidAspiration.label"),
        description: $I("workshop.voidAspiration.desc"),
        effects: {

        },
        prices:[
            { name : "antimatter", val: 2000 },
            { name : "timeCrystal", val: 15 }
        ],
        unlocks: {
            voidSpace: ["voidHoover", "voidRift"]
        }
    },{
        name: "distorsion",
        label: $I("workshop.distorsion.label"),
        description: $I("workshop.distorsion.desc"),
        effects: {
			"temporalParadoxDayBonus": 2
        },
        prices:[
            { name : "antimatter", val: 2000 },
            { name : "science", val: 300000 },
            { name : "timeCrystal", val: 25 },
            { name : "void", val: 1000 }
        ],
        upgrades: {
            voidSpace: ["chronocontrol"]
        }
    },{
        name: "turnSmoothly",	//chronosurge
        label: $I("workshop.turnSmoothly.label"),
        description: $I("workshop.turnSmoothly.desc"),
        effects: {
			"temporalFluxProductionChronosphere": 1
        },
        prices:[
			{ name : "unobtainium", val: 100000 },
			{ name : "temporalFlux", val: 6500 },
			{ name : "timeCrystal", val: 25 },
			{ name : "void", val: 750 }
        ],
        upgrades: {
            buildings: ["chronosphere"]
        }
        //---------------- Blackcoin ---------------
    },{
		name: "invisibleBlackHand",
		label: $I("workshop.invisibleBlackHand.label"),
		description: $I("workshop.invisibleBlackHand.desc"),
		prices: [
			{name: "temporalFlux", val: 4096},
			{name: "timeCrystal", val: 128},
			{name: "void", val: 32},
			{name: "blackcoin", val: 64}
		],
		unlocks: {
		}
	}
    ],

	//=============================================================
	//					     CRAFT RECIPES
	//=============================================================

	crafts:[{
		name: "wood",
		label: $I("workshop.crafts.wood.label"),
		description: $I("workshop.crafts.wood.desc"),
		prices:[
			{name: "catnip", val: 100}
		],
		ignoreBonuses: true,
		progressHandicap: 1,
		tier: 1
	},{
		name: "beam",
		label: $I("workshop.crafts.beam.label"),
		description: $I("workshop.crafts.beam.desc"),
		prices:[
			{name: "wood", val: 175}
		],
		progressHandicap: 1,
		tier: 1
	},{
		name: "slab",
		label: $I("workshop.crafts.slab.label"),
		description: $I("workshop.crafts.slab.desc"),
		prices:[
			{name: "minerals", val: 250}
		],
		progressHandicap: 1,
		tier: 1
	},{
		name: "plate",
		label: $I("workshop.crafts.plate.label"),
		description: $I("workshop.crafts.plate.desc"),
		prices:[
			{name: "iron", val: 125}
		],
		progressHandicap: 4,
		tier: 1
	},{
		name: "steel",
		label: $I("workshop.crafts.steel.label"),
		description: $I("workshop.crafts.steel.desc"),
		prices:[
			{name: "coal", val: 100},
			{name: "iron", val: 100}
		],
		progressHandicap: 4,
		tier: 2
	},{
		name: "concrate",
		label: $I("workshop.crafts.concrate.label"),
		description: $I("workshop.crafts.concrate.desc"),
		prices:[
			{name: "slab", val: 2500},
			{name: "steel", val: 25}
		],
		progressHandicap: 9,
		tier: 4
	},{
		name: "gear",
		label: $I("workshop.crafts.gear.label"),
		description: $I("workshop.crafts.gear.desc"),
		prices:[
			{name: "steel", val: 15}
		],
		progressHandicap: 5,
		tier: 3
	},{
		name: "alloy",
		label: $I("workshop.crafts.alloy.label"),
		description: $I("workshop.crafts.alloy.desc"),
		prices:[
			{name: "titanium", val: 10},
			{name: "steel", val: 75 }
		],
		progressHandicap: 7,
		tier: 4
	},{
		name: "eludium",
		label: $I("workshop.crafts.eludium.label"),
		description: $I("workshop.crafts.eludium.desc"),
		prices:[
			{name: "unobtainium", val: 1000},
			{name: "alloy", val: 2500 }
		],
		progressHandicap: 300,
		tier: 5
	},{
		name: "scaffold",
		label: $I("workshop.crafts.scaffold.label"),
		description: $I("workshop.crafts.scaffold.desc"),
		prices:[
			{ name: "beam", val: 50 }
		],
		progressHandicap: 2,
		tier: 2
	},{
		name: "ship",
		label: $I("workshop.crafts.ship.label"),
		description: $I("workshop.crafts.ship.desc"),
		prices:[
			{ name: "starchart", val: 25 },
			{ name: "plate",    val: 150 },
			{ name: "scaffold", val: 100 }
		],
		upgrades: {
			buildings: ["harbor"]
		},
		progressHandicap: 20,
		tier: 3
	},{
		name: "tanker",
		label: $I("workshop.crafts.tanker.label"),
		description: $I("workshop.crafts.tanker.desc"),
		prices:[
			{ name: "alloy",    	val: 1250 },
			{ name: "ship", 		val: 200 },
			{ name: "blueprint", 	val: 5 }
		],
		upgrades: {
			buildings: ["harbor"]
		},
		progressHandicap: 20,
		tier: 5
	},{
        name: "kerosene",
        label: $I("workshop.crafts.kerosene.label"),
        description: $I("workshop.crafts.kerosene.desc"),
        prices:[
            { name: "oil", val: 7500 }
        ],
		progressHandicap: 5,
		tier: 2
    },{
		name: "parchment",
		label: $I("workshop.crafts.parchment.label"),
		description: $I("workshop.crafts.parchment.desc"),
		prices:[
			{name: "furs", val: 175}
		],
		progressHandicap: 1,
		tier: 1
	},{
		name: "manuscript",
		label: $I("workshop.crafts.manuscript.label"),
		description: $I("workshop.crafts.manuscript.desc"),
		prices:[
			{name: "culture", val: 400},
			{name: "parchment", val: 25}
		],
		progressHandicap: 2,
		tier: 2
	},{
		name: "compedium",
		label: $I("workshop.crafts.compedium.label"),
		description: $I("workshop.crafts.compedium.desc"),
		prices:[
			{name: "science", val: 10000},
			{name: "manuscript", val: 50}
		],
		progressHandicap: 5,
		tier: 3
	},{
		name: "blueprint",
		label: $I("workshop.crafts.blueprint.label"),
		description: $I("workshop.crafts.blueprint.desc"),
		prices:[
			{name: "science", val: 25000},
			{name: "compedium", val: 25}
		],
		progressHandicap: 10,
		tier: 3
	},{
		name: "thorium",
		label: $I("workshop.crafts.thorium.label"),
		description: $I("workshop.crafts.thorium.desc"),
		prices:[
			{ name: "uranium", val: 250 }
		],
		progressHandicap: 5,
		tier: 3
	},{
		name: "megalith",
		label: $I("workshop.crafts.megalith.label"),
		description: $I("workshop.crafts.megalith.desc"),
		prices:[
			{ name: "beam", val: 25 },
			{ name: "slab", val: 50 },
			{ name: "plate", val: 5 }
		],
		progressHandicap: 5,
		tier: 3
	},{
		name: "bloodstone",
		label: $I("workshop.crafts.bloodstone.label"),
		description: $I("workshop.crafts.bloodstone.desc"),
		prices:[
			{ name: "timeCrystal", val: 5000 },
			{ name: "relic", val: 10000 }
		],
		progressHandicap: 7500,
		tier: 5
	},{
		name: "tMythril",
		label: $I("workshop.crafts.tMythril.label"),
		description: $I("workshop.crafts.tMythril.desc"),
		//label: "T-Mythril",
		//description: "Some believe this alloy to be alive...",
		prices:[
			{ name: "bloodstone", val: 5 },
			{ name: "ivory", val: 1000 },
			{ name: "titanium", val: 500 }
		],
		progressHandicap: 10000,
		tier: 7
	}],

	zebraUpgrades:[
		{
			name: "darkRevolution",
			label: $I("workshop.zebraUpgrade.darkRevolution.label"),
			description: $I("workshop.zebraUpgrade.darkRevolution.desc"),
			effects: {
			},
			prices:[
				{ name : "bloodstone", val: 15 },
				{ name : "science", val: 100 }
			],
			upgrades:{
				buildings: ["zebraOutpost"]
			}
		},{
			name: "darkBrew",
			label: $I("workshop.zebraUpgrade.darkBrew.label"),
			description: $I("workshop.zebraUpgrade.darkBrew.desc"),
			effects: {
			},
			prices:[
				{ name : "bloodstone", val: 1 },
				{ name : "parchment", val: 3000 },
				{ name : "science", val: 100 }
			]
		},{
			name: "whispers",
			label: $I("workshop.zebraUpgrade.whispers.label"),
			description: $I("workshop.zebraUpgrade.whispers.desc"),
			effects: {
			},
			prices:[
				{ name : "tMythril", val: 5 }
			],
			upgrades:{
				buildings: ["ivoryTemple"]
			}
		},
		//minerals
		{
			name: "minerologyDepartment",
			label: $I("workshop.zebraUpgrade.minerologyDepartment.label"),
			description: $I("workshop.zebraUpgrade.minerologyDepartment.desc"),
			effects: {		
			},
			prices:[
				{name : "science", val: 75000},
				{name: 	"compedium", val: 75}
			]
	
		}
	],
	effectsBase: {
		"oilMax" : 0,
		"scienceMax" : 0,
		"cultureMax" : 0
	},

	metaCache: null,

	constructor: function(game){
		this.game = game;
		this.metaCache = {};
		this.registerMeta("research", this.upgrades, null);
		this.registerMeta("research", this.zebraUpgrades, null);
		this.setEffectsCachedExisting();
	},

	get: function(upgradeName){
		var upgrade = this.metaCache[upgradeName];
		if (upgrade){
			return upgrade;
		}

		for (var i = this.upgrades.length - 1; i >= 0; i--) {
			if (this.upgrades[i].name === upgradeName){
				this.metaCache[upgrade] = this.upgrades[i];
				return this.upgrades[i];
			}
		}
		console.error("Failed to get upgrade for id '" + upgradeName + "'");
		return null;
	},

	getCraft: function(craftName){
		for (var i = this.crafts.length - 1; i >= 0; i--) {
			if (this.crafts[i].name === craftName){
				return this.crafts[i];
			}
		}
		return null;
	},

	getZebraUpgrade: function(zebraUpgradeName){
		var zebraUpgrade = this.metaCache[zebraUpgradeName];
		if (zebraUpgrade){
			return zebraUpgrade;
		}
		for (var i = this.zebraUpgrades.length - 1; i >= 0; i--) {
			if (this.zebraUpgrades[i].name === zebraUpgradeName){
				this.metaCache[zebraUpgrade] = this.zebraUpgrades[i];
				return this.zebraUpgrades[i];
			}
		}
		console.error("Failed to get upgrade for id '" + zebraUpgradeName + "'");
		return null;
	},

	resetState: function(){
		for (var i = 0; i < this.upgrades.length; i++){
			var upgrade = this.upgrades[i];
			if (upgrade.name == "mineralHoes" ||
				upgrade.name == "ironHoes" ||
				upgrade.name == "mineralAxes" ||
				upgrade.name == "ironAxes" ||
				upgrade.name == "stoneBarns" ||
				upgrade.name == "reinforcedBarns") {
				upgrade.unlocked = true;
			} else {
				upgrade.unlocked = false;
			}
			upgrade.researched = false;
		}

		for (i = 0; i < this.crafts.length; i++){
			var craft = this.crafts[i];
			if (craft.name == "wood" ||
				craft.name == "beam" ||
				craft.name == "slab" ||
				craft.name == "plate" ||
				craft.name == "gear" ||
				craft.name == "scaffold" ||
				craft.name == "manuscript" ||
				craft.name == "megalith") {
				craft.unlocked = true;
			} else {
				craft.unlocked = false;
			}
			craft.value = 0;
			craft.progress = 0;
			if (typeof(craft.progressHandicap) == "undefined") {
				craft.progressHandicap = 1;
			}
		}
		for (var i = 0; i < this.zebraUpgrades.length; i++){
			var zebraUpgrade = this.zebraUpgrades[i];
			zebraUpgrade.researched = false;
			zebraUpgrade.unlocked = false;
		}

		//ugh
		this.getCraft("wood").prices = [{name: "catnip", val: 100}];

		this.hideResearched = false;
	},

	save: function(saveData){
		saveData.workshop = {
			hideResearched: this.hideResearched,
			upgrades: this.filterMetadata(this.upgrades, ["name", "unlocked", "researched"]),
			crafts: this.filterMetadata(this.crafts, ["name", "unlocked", "value", "progress"]),
			zebraUpgrades: this.filterMetadata(this.zebraUpgrades, ["name", "unlocked", "researched"])
		};
	},

	load: function(saveData){
		if (!saveData["workshop"]){
			return;
		}

		this.hideResearched = saveData.workshop.hideResearched;
		this.loadMetadata(this.upgrades, saveData.workshop.upgrades);
		this.loadMetadata(this.crafts, saveData.workshop.crafts);
		this.loadMetadata(this.zebraUpgrades, saveData.workshop.zebraUpgrades);

		for (var i = 0; i < this.upgrades.length; i++){
			var upgrade = this.upgrades[i];
			if (upgrade.researched){
				if (upgrade.handler) {
					upgrade.handler(this.game);	//just in case update workshop upgrade effects
				}
				if (upgrade.unlocks) {
					this.game.unlock(upgrade.unlocks);
				}
			}
		}
		for (var i = 0; i < this.zebraUpgrades.length; i++){
			var zebraUpgrade = this.zebraUpgrades[i];
			if (zebraUpgrade.researched){
				if (zebraUpgrade.handler) {
					zebraUpgrade.handler(this.game);	//just in case update workshop upgrade effects
				}
				if (zebraUpgrade.unlocks) {
					this.game.unlock(zebraUpgrade.unlocks);
				}
			}
		}

	},

	getCraftPrice: function(craft) {
		if (craft.name != "ship" && craft.name != "manuscript") {
			return craft.prices;
		}

		if (craft.name == "manuscript" && this.game.science.getPolicy("tradition").researched){
			return [
				{name: "parchment", val: 20},
				{name: "culture", val: 300}
			];
		}

		//special ship hack
		var prices = dojo.clone(craft.prices);
		for (var i = prices.length - 1; i >= 0; i--) {
			if (prices[i].name == "starchart") {
				prices[i].val = prices[i].val * (1 - this.game.getLimitedDR(this.game.getEffect("satnavRatio") * this.game.space.getBuilding("sattelite").on, 0.75));
			}
		}
		return prices;
	},

	craft: function (res, amt, suppressUndo, forceAll, bypassResourceCheck) {
		var craft = this.getCraft(res);
		var craftRatio = this.game.getResCraftRatio(res);
		amt = Math.ceil(amt);
		var craftAmt = amt * (1 + craftRatio);

		//prevent undo giving free res
		if (amt < 0 && this.game.resPool.get(res).value < Math.abs(craftAmt)) {
			return false;
		}

		var prices = dojo.clone(this.getCraftPrice(craft));

		for (var i = prices.length - 1; i >= 0; i--) {
			prices[i].val *= amt;
		}

		if (bypassResourceCheck || this.game.resPool.hasRes(prices)) {
			this.game.resPool.payPrices(prices);
			this.game.resPool.addResEvent(res,craftAmt);
			if (craft.upgrades){
				this.game.upgrade(craft.upgrades);
			}

			this.game.stats.getStat("totalCrafts").val++;
			this.game.stats.getStatCurrent("totalCrafts").val++;

            if (!suppressUndo) {
                var undo = this.game.registerUndoChange();
                undo.addEvent("workshop", /* TODO: use manager.id and pass it in proper way as manager constructor*/
                    {
						metaId:res,
						val: amt
					}
				);
            }

            return true;
		} else if (forceAll) {
			//console.log("not enough resources for ", prices, ", crafting as much as possible");
			this.craftAll(res);
			return true;
		} else {
			//console.log("not enough resources for ", prices, ", aborting craft");
			return false;
		}
	},

	getEffectEngineer: function(resName, afterCraft) {
		var craft = this.getCraft(resName);
		if (craft == null) {
			return 0;
		}

		var kittenResProduction = (this.game.village.getResProduction()["ES" + resName] || 0) * (this.game.workshop.get("neuralNetworks").researched ? 2 : 1);
		kittenResProduction *= this.game.religion.getHGScalingBonus();
		
		var tierCraftRatio = this.game.getEffect("t" + craft.tier + "CraftRatio") || 0;
		if (tierCraftRatio == 0) {
			tierCraftRatio = 1;
		}

		// One (bonus / handicap) crafts per engineer per 10 minutes
		var effectPerTick = kittenResProduction * tierCraftRatio / (600 * this.game.ticksPerSecond * craft.progressHandicap);
		return effectPerTick * (1 + (afterCraft ? this.game.getResCraftRatio(resName) : 0));
	},

    undo: function(data){
		var metaId = data.metaId,
			val = data.val;

		if (this.craft(metaId, -val, true /*do not create cyclic undo*/)){
			var res = this.game.resPool.get(metaId);
			var craftRatio = this.game.getResCraftRatio(metaId);
			this.game.msg( $I("workshop.undo.msg", [this.game.getDisplayValueExt(val * (1 + craftRatio)), (res.title || res.name)]));
		}
    },

	//returns a total number of resoruces possible to craft for this recipe
	getCraftAllCount: function(craftName){
		var recipe = this.getCraft(craftName);
		var prices = this.getCraftPrice(recipe);
		return Math.floor(this._getCraftAllCountInternal(recipe, prices));
	},

	_getCraftAllCountInternal: function(recipe, prices){

		var minAmt = Number.MAX_VALUE;
		for (var j = prices.length - 1; j >= 0; j--) {
			var totalRes = this.game.resPool.get(prices[j].name).value;
			var allAmt = totalRes / prices[j].val; // we need fraction here, do floor later
			if (allAmt < minAmt){
				minAmt = allAmt;
			}
		}
		return minAmt;
	},

	//Crafts maximum possible amount for given recipe name
	craftAll: function(craftName) {
		var minAmt = this.getCraftAllCount(craftName);
		if (0 < minAmt && minAmt < Number.MAX_VALUE) {
			var craftRatio = this.game.getResCraftRatio(craftName);
			var res = this.game.resPool.get(craftName);
			if (this.craft(craftName, minAmt, false /* allow undo */, false /* don't force all */, true /* bypass resource check */)) {
				this.game.msg( $I("workshop.crafted.msg", [this.game.getDisplayValueExt(minAmt * (1 + craftRatio)), (res.title || craftName)]), null, "craft");
			}
		}
	},

	clearEngineers: function(){
		for (var i = this.crafts.length - 1; i >= 0; i--){
			this.crafts[i].value = 0;
		}
		this.game.village.sim.clearCraftJobs();
	},

	update: function(){
		this.fastforward(1 / this.game.calendar.ticksPerDay);
	},

	fastforward: function(daysOffset) {
		var times = daysOffset * this.game.calendar.ticksPerDay;

		//-------------	 this is a poor place for this kind of functionality ------------
		//-------------	todo: move somewhere to bld? ------------------------------------

		this.effectsBase["oilMax"] = Math.floor(this.game.resPool.get("tanker").value * 500);

		var scienceMaxCap = this.game.bld.getEffect("scienceMax");
		if (this.game.ironWill) {
			scienceMaxCap *= 10;
		}
		if (this.game.prestige.getPerk("codexLeviathanianus").researched) {
			var blackLibrary = this.game.religion.getTU("blackLibrary");
			var ttBoostRatio = 1 + blackLibrary.val * (blackLibrary.effects["compendiaTTBoostRatio"] + this.game.getEffect("blackLibraryBonus"));
			scienceMaxCap *= 1 + 0.05 * ttBoostRatio * this.game.religion.transcendenceTier;
		}
		scienceMaxCap += this.game.bld.getEffect("scienceMaxCompendia");
		// there is a lot of ongoing discussing about the necessity of compedia unnerf, and the original intention of ch40krun was never to allow it
		/* // Quadratic increase, so that deep enough run will eventually unnerf the compendia cap
		var darkFutureRatio = Math.max(this.game.calendar.year / this.game.calendar.darkFutureBeginning, 1);
		scienceMaxCap *= darkFutureRatio * darkFutureRatio; */

		var compendiaScienceMax = Math.floor(this.game.resPool.get("compedium").value * 10);
		this.effectsBase["scienceMax"] = Math.min(compendiaScienceMax, scienceMaxCap);

		var cultureBonusRaw = Math.floor(this.game.resPool.get("manuscript").value);
		this.effectsBase["cultureMax"] = this.game.getUnlimitedDR(cultureBonusRaw, 0.01);

		this.effectsBase["cultureMax"] *= 1 + this.game.getEffect("cultureFromManuscripts");

		//sanity check
		if (this.game.village.getFreeEngineers() < 0){
			this.clearEngineers();
		}
		this.craftByEngineers(times);
	},

	craftByEngineers: function(times) {
		for (var i = 0; i < this.crafts.length; i++) {
			var craft = this.crafts[i];

			var prices = this.getCraftPrice(craft);

			//check and cache if you can't craft even once due to storage limits
			craft.isLimited = this.game.resPool.isStorageLimited(prices);

			if (craft.value == 0) {
				continue;
			}

			var currentProgress = Math.max(craft.progress, 0) + times * this.getEffectEngineer(craft.name, false);
			if (currentProgress >= 1) {
				var currentProgress = Math.min(currentProgress, this._getCraftAllCountInternal(craft, prices));
				var units = Math.floor(currentProgress);
				if (!craft.isLimited && this.craft(craft.name, units, true)) {
					craft.progress = currentProgress - units;
				}
			} else if (this.game.resPool.hasRes(prices, currentProgress)) {
				craft.isLimitedAmt = false;
				craft.progress = currentProgress;
			} else {
				craft.isLimitedAmt = true;
			}
		}
	},

	unlock: function(upgrade){
		upgrade.researched = true;

		if (upgrade.handler){
			upgrade.handler(this.game);
		}

		if (upgrade.unlocks) {
			this.game.unlock(upgrade.unlocks);
		}

		if (upgrade.upgrades) {
			// Hack so the new upgrade's effects are counted
			this.game.upgrade(upgrade.upgrades);
		}
	},

	unlockAll: function(){
		for (var i in this.upgrades){
			this.unlock(this.upgrades[i]);
		}

		for (var i in this.crafts){
			this.crafts[i].unlocked = true;
		}
		for (var i in this.zebraUpgrades){
			this.zebraUpgrades[i].unlocked = true;
		}
		this.game.msg($I("workshop.all.upgrades.unlocked"));
	}
});

dojo.declare("com.nuclearunicorn.game.ui.UpgradeButtonController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {

	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		result.simplePrices = false;
		return result;
	},

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.workshop.get(model.options.id);
        }
        return model.metaCached;
    },

	getPrices: function(model) {
        return this.game.village.getEffectLeader("scientist", this.inherited(arguments));
    },

	updateVisible: function(model){
		var upgrade = model.metadata;
		model.visible = upgrade.unlocked;

		if (upgrade.researched && this.game.workshop.hideResearched){
			model.visible = false;
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.CraftButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {

	defaults: function() {
		var result = this.inherited(arguments);
		result.hasResourceHover = true;
		result.simplePrices = false;
		return result;
	},

	initModel: function(options) {
		var model = this.inherited(arguments);
		model.craft = this.getCraft(model);
		return model;
	},

	getCraft: function(model){
		return this.game.workshop.getCraft(model.options.craft);
	},

	updateVisible: function(model){
		model.visible = model.craft.unlocked;
	},

	getName: function(model){
		var craft = model.craft;
		if (this.game.science.get("mechanization").researched && craft.value != 0) {
			var progressDisplayed = this.game.toDisplayPercentage(craft.progress, 0, true);
			if (progressDisplayed > 99){
				progressDisplayed = 99;
			}

			return model.craft.label + " (" + craft.value + ") [" + progressDisplayed + "%]";
		} else {
			return this.inherited(arguments);
		}
	},

	getDescription: function(model) {
		var craft = model.craft;
		var desc = craft.description;

		var craftBonus = this.game.getResCraftRatio(craft.name);
		if (craft.name != "wood") {
			craftBonus -= this.game.getCraftRatio();
		}

		if (craftBonus > 0) {
			desc += "<br /><br />" + $I("workshop.craftBtn.desc.effectivenessBonus", [this.game.getDisplayValueExt(100 * craftBonus, false, false, 0)]);
		}

		if (this.game.science.get("mechanization").researched){
			desc += "<br /><br />" + $I("workshop.craftBtn.desc.tier") + ": " + craft.tier;

			var tierBonus = this.game.getEffect("t" + craft.tier + "CraftRatio") || 1;
			if (tierBonus != 1) {
				desc += "<br />" + $I("workshop.craftBtn.desc.craftRatio") + ": " + this.game.getDisplayValueExt((100 * (tierBonus - 1)).toFixed(), true) + "%";
			}

			if (craft.progressHandicap != 1) {
				var difficulty = this.game.getDisplayValueExt((-100 * (1 - 1 / craft.progressHandicap)).toFixed(2), true);
				desc += "<br />" + $I("workshop.craftBtn.desc.progressHandicap") + ": " + difficulty + "%";
			}

			if (craft.value != 0) {
				var countdown = (1 / (this.game.workshop.getEffectEngineer(craft.name, false) * this.game.getTicksPerSecondUI())).toFixed(0);
				desc += "<br />=> " + $I("workshop.craftBtn.desc.countdown", [countdown]);
			}
		}
		return desc;
	},

	assignCraftJob: function(model, value) { //TODO, assign one kitten, not just a value to manage with exp
		var craft = model.craft;

		var valueCorrected = this.game.village.getFreeEngineers() > value ? value : this.game.village.getFreeEngineers();

		var valueAdded = 0;
		for (var i = 0; i < valueCorrected; i++) {
			var success = this.game.village.sim.assignCraftJob(craft);

			if (success) {
				valueAdded += 1;
			} else {
				break;
			}
		}
		craft.value += valueAdded;
	},

	unassignCraftJob: function(model, value) { //TODO, aunssign one kitten, not just a value to manage with exp
		var craft = model.craft;
		var valueCorrected = craft.value > value ? value : craft.value;

		craft.value -= valueCorrected;
		for (var i = 0; i < valueCorrected; i++) {
			this.game.village.sim.unassignCraftJob(craft);
		}
	},


	fetchModel: function(options){
		var model = this.inherited(arguments);
		var self = this;
		if (this.game.science.get("mechanization").researched) {
			if (!this.controllerOpts.compactStyle) {
				model.unassignCraftLinks = [
				  {
						id: "unassign",
						title: "[&ndash;]",
						handler: function(){
							self.unassignCraftJob(model, 1);
						},
					  	enabled: true
				   },{
						id: "unassign5",
						title: "[-5]",
						handler: function(){
							self.unassignCraftJob(model, 5);
						},
						enabled: true
				   },{
						id: "unassign25",
						title: "[-25]",
						handler: function(){
							self.unassignCraftJob(model, 25);
						},
						enabled: true
				   }];

				model.assignCraftLinks = [
					{
						id: "assign",
						title: "[+]",
						handler: function(){
							self.assignCraftJob(model, 1);
						},
						enabled: true
				   },{
						id: "assign5",
						title: "[+5]",
						handler: function(){
							self.assignCraftJob(model, 5);
						},
						enabled: true
				   },{
						id: "assign25",
						title: "[+25]",
						handler: function(){
							self.assignCraftJob(model, 25);
						},
						enabled: true
				   }];
			} else {
				model.unassignCraftLinks = [
				  {
						id: "unassign",
						title: "-",
						handler: function(){
							self.unassignCraftJob(model, 1);
						},
					  	enabled: true
				   },{
						id: "unassign25",
						title: "-25",
						handler: function(){
							self.unassignCraftJob(model, 25);
						},
						enabled: true
				   }];

				model.assignCraftLinks = [
					{
						id: "assign",
						title: "+",
						handler: function(){
							self.assignCraftJob(model, 1);
						},
						enabled: true
				   },{
						id: "assign25",
						title: "+25",
						handler: function(){
							self.assignCraftJob(model, 25);
						},
						enabled: true
				   }];
			}

		} else {
			model.assignCraftLinks = [];
			model.unassignCraftLinks = [];
		}
		return model;
	},

	buyItem: function(model, event, callback) {
		this.game.workshop.craft(model.craft.name, 1);
		callback(true);
	}
});


dojo.declare("com.nuclearunicorn.game.ui.CraftButton", com.nuclearunicorn.game.ui.ButtonModern, {
	craftName: null,

	constructor: function(opts, game){
		this.craftName = opts.craft;
	},

	setEnabled: function(enabled){
		this.inherited(arguments);

		dojo.removeClass(this.domNode, "bldEnabled");
		dojo.removeClass(this.domNode, "bldlackResConvert");
		var craft = this.model.craft;
		if (craft.value > 0) {
			if (craft.isLimitedAmt) {
				dojo.addClass(this.domNode, "bldlackResConvert");
			} else {
				dojo.addClass(this.domNode, "bldEnabled");
			}
		}
	},


	renderLinks: function(){
		if (this.model.unassignCraftLinks) {
			this.unassignCraftLinks = this.addLinkList(this.model.unassignCraftLinks);
		}
		if (this.model.assignCraftLinks){
			this.assignCraftLinks = this.addLinkList(this.model.assignCraftLinks);
		}
	}

});

dojo.declare("com.nuclearunicorn.game.ui.ZebraUpgradeButtonController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {

	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		result.simplePrices = false;
		return result;
	},

	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.workshop.getZebraUpgrade(model.options.id);
        }
        return model.metaCached;
    },

	getPrices: function(model) {
        return this.game.village.getEffectLeader("scientist", this.inherited(arguments));
    },

	updateVisible: function(model){
		var upgrade = model.metadata;
		if (!upgrade.unlocked){
			model.visible = false;
		}else{
			model.visible = true;
		}

		if (upgrade.researched && this.game.workshop.hideResearched){
			model.visible = false;
		}
	}
});


dojo.declare("com.nuclearunicorn.game.ui.tab.Workshop", com.nuclearunicorn.game.ui.tab, {

	tdTop: null,

	craftBtns: null,

	resTd: null,

	constructor: function(tabName, game){
		this.game = game;

		this.craftBtns = [];
	},

	render: function(tabContainer){

		this.craftBtns = [];
		this.buttons = [];

		var div = dojo.create("div", { style: { float: "left"}}, tabContainer);
		dojo.create("span", {innerHTML: $I("workshop.craft.effectiveness", [this.game.getDisplayValueExt(100 * this.game.getCraftRatio(), false, false, 0)])}, div);

		//--------------------------------------------------------------------
		var divCombobox = dojo.create("div", {style: { height: "20px"}} , tabContainer);
		var div = dojo.create("div", { style: { float: "right"}}, divCombobox);

		var groupCheckbox = dojo.create("input", {
			id: "toggleResearched",
			type: "checkbox",
			checked: this.game.workshop.hideResearched
		}, div);

		dojo.connect(groupCheckbox, "onclick", this, function(){
			this.game.workshop.hideResearched = !this.game.workshop.hideResearched;

			dojo.empty(tabContainer);
			this.render(tabContainer);
		});

		dojo.create("label", { innerHTML: $I("workshop.toggleResearched.label"), for: "toggleResearched"}, div);
		//---------------------------------------------------------------------

		var upgradePanel = new com.nuclearunicorn.game.ui.Panel($I("workshop.upgradePanel.label"), this.game.workshop);
		var content = upgradePanel.render(tabContainer);

		for (var i = 0; i < this.game.workshop.upgrades.length; i++){
			var upgrade = this.game.workshop.upgrades[i];

			var btn = this.createBtn(upgrade);

			btn.updateEnabled();
			btn.updateVisible();

			this.addButton(btn);
			btn.render(content);
		}

		//------------------------------------------

		var craftPanel = new com.nuclearunicorn.game.ui.Panel($I("workshop.craftPanel.label"), this.game.workshop);
		var content = craftPanel.render(tabContainer);

		var table = dojo.create("table", {}, content);
		dojo.create("tr", {}, table);

		//buttons go there
		var td = dojo.create("td", {}, table);
		var tdTop = dojo.create("td", { colspan: 2, style: {cursor: "pointer"} }, td);

		this.tdTop = tdTop;

		UIUtils.attachTooltip(this.game, this.tdTop, 5, 0, function(){
			return $I("workshop.craftPanel.header.tooltip");
		});

		var crafts = this.game.workshop.crafts;
		var controller = new com.nuclearunicorn.game.ui.CraftButtonController(this.game);
		for (var i = 0; i < crafts.length; i++ ){
			var craft =  crafts[i];
			var craftBtn = new com.nuclearunicorn.game.ui.CraftButton({
				name: craft.label,
				description: craft.description,
				craft: craft.name,
				prices: this.game.workshop.getCraftPrice(craft),
				controller: controller
			}, this.game);

			craftBtn.render(td);

			this.craftBtns.push(craftBtn);
		}

	//---------------------------------------------------------------------

	var zebraUpgradesPanel = new com.nuclearunicorn.game.ui.Panel($I("workshop.zebraUpgradesPanel.label"), this.game.workshop);
	if(this.game.bld.getBuildingExt("zebraWorkshop").meta.val>0){
		var content = zebraUpgradesPanel.render(tabContainer);

		for (var i = 0; i < this.game.workshop.zebraUpgrades.length; i++){
			var zebraUpgrade = this.game.workshop.zebraUpgrades[i];

			var zebraUpgradeButton = this.createZebraUpgradeBtn(zebraUpgrade);

			zebraUpgradeButton.updateEnabled();
			zebraUpgradeButton.updateVisible();

			this.addButton(zebraUpgradeButton);
			zebraUpgradeButton.render(content);
		}
	}

		//resources go there
		var td = dojo.create("td", { className: "craftStuffPanel", style: {paddingLeft: "50px"}}, table);
		this.resTd = td;
		this.renderResources(this.resTd);

		//----------------
		if (!this.game.science.get("construction").researched){
			craftPanel.setVisible(false);
		}

		this.update();
	},

	renderResources: function(container){

		dojo.empty(container);

		dojo.create("span", { innerHTML: $I("workshop.craftPanel.counts.label") + ":" },container);

		var table = dojo.create("table", { style: {
			paddingTop: "20px"
		}}, container);

		var resources = this.game.resPool.resources;
		for (var i = 0; i < resources.length; i++){
			var res = resources[i];

			if (res.craftable && res.value){
				var tr = dojo.create("tr", {}, table);

				dojo.create("td", { innerHTML: res.title || res.name + ":" }, tr);
				dojo.create("td", { innerHTML: this.game.getDisplayValueExt(res.value) }, tr);
			}
		}
	},

	createBtn: function(upgrade) {
		var controller = new com.nuclearunicorn.game.ui.UpgradeButtonController(this.game);
		return new com.nuclearunicorn.game.ui.BuildingResearchBtn({id: upgrade.name, controller: controller}, this.game);
	},

	createZebraUpgradeBtn: function(upgrade) {
		var controller = new com.nuclearunicorn.game.ui.ZebraUpgradeButtonController(this.game);
		return new com.nuclearunicorn.game.ui.BuildingResearchBtn({id: upgrade.name, controller: controller}, this.game);
	},

	update: function(){
		this.inherited(arguments);

		for (var i = this.craftBtns.length - 1; i >= 0; i--) {
			var craftBtn = this.craftBtns[i];
			craftBtn.update();
			if (craftBtn.model.craft.value > 0 ) {
				dojo.addClass(craftBtn.domNode, "craftOn");
			} else {
				dojo.removeClass(craftBtn.domNode,"craftOn");
			}
		}

		if (this.resTd){
			this.renderResources(this.resTd);
		}

		if (this.tdTop && this.game.science.get("mechanization").researched) {
			this.tdTop.innerHTML = $I("workshop.craftPanel.header.freeEngineers") + ": " + this.game.village.getFreeEngineers() + " / " + this.game.village.getWorkerKittens("engineer");
		} else {
			this.tdTop.innerHTML = "";
		}

		this.updateTab();
	},

	updateTab: function() {
		this.tabName = $I("tab.name.workshop");
		var freeEngineers = this.game.village.getFreeEngineers();
		if (freeEngineers > 0) {
			this.tabName += " <span class='genericWarning'>(" + this.game.getDisplayValueExt(freeEngineers, false, false, 0) + ")</span>";
		}
		if (this.domNode) {
			this.domNode.innerHTML = this.tabName;
		}
	}
});
