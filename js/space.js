/* global
	WChiral
*/

/**
 * Behold the bringer of light!
 */
dojo.declare("classes.managers.SpaceManager", com.nuclearunicorn.core.TabManager, {

	/*
	 * Planets and celestial bodies from left to right:
	 *
	 * Charon, Umbra (black hole), Yarn (terraformable?), Helios (Sun), Cath, Redmoon (Cath satellite), Dune, Piscine, Terminus (ice giant), Kairo (dwarf planet)
	 *
	 */

	game: null,

	hideResearched: false,

	spaceBuildingsMap: [],

	programs: [{
		name: "orbitalLaunch",
		label: $I("space.orbitalLaunch.label"),
		description: $I("space.orbitalLaunch.desc"),
		prices: [
			{name: "oil", val: 15000},
			{name: "manpower", val: 5000},
			{name: "science", val: 100000},
			{name: "starchart", val: 250}
		],
        unlocks: {
            planet: ["cath"],
            spaceMission: ["moonMission"]
        }
	},{
		name: "moonMission",
		label: $I("space.moonMission.label"),
		description: $I("space.moonMission.desc"),
		prices: [
			{name: "titanium", 	val: 5000},
			{name: "oil", 		val: 45000},
			{name: "science", 	val: 125000},
			{name: "starchart", val: 500}
		],
        unlocks: {
            planet: ["moon"],
            spaceMission: ["duneMission", "piscineMission"]
        }
	},{
		name: "duneMission",
		label: $I("space.duneMission.label"),
		description: $I("space.duneMission.desc"),
		prices: [
			{name: "titanium", val: 7000},
			{name: "science", val: 175000},
			{name: "starchart", val: 1000},
			{name: "kerosene", val: 75}
		],
		unlocks: {
            planet: ["dune"],
            spaceMission: ["heliosMission"],
			policies:["technocracy", "theocracy", "expansionism"]
        }
	},{
		name: "piscineMission",
		label: $I("space.piscineMission.label"),
		description: $I("space.piscineMission.desc"),
		prices: [
			{name: "titanium", val: 9000},
			{name: "science", val: 200000},
			{name: "starchart", val: 1500},
			{name: "kerosene", val: 250}
		],
        unlocks: {
            planet: ["piscine"],
            spaceMission: ["terminusMission"]
        }
	},{
		name: "heliosMission",
		label: $I("space.heliosMission.label"),
		description: $I("space.heliosMission.desc"),
		prices: [
			{name: "titanium", val: 15000},
			{name: "science", val: 250000},
			{name: "starchart", val: 3000},
			{name: "kerosene", val: 1250}
		],
        unlocks: {
            planet: ["helios"],
            spaceMission: ["yarnMission"]
        }
	},{
		name: "terminusMission",
		label: $I("space.terminusMission.label"),
		description: $I("space.terminusMission.desc"),
		prices: [
			{name: "titanium", val: 12000},
			{name: "science", val: 225000},
			{name: "starchart", val: 2500},
			{name: "kerosene", val: 750}
		],
        unlocks: {
            planet: ["terminus"],
            spaceMission: ["heliosMission", "kairoMission"]
        }
	},{
		name: "kairoMission",
		label: $I("space.kairoMission.label"),
		description: $I("space.kairoMission.desc"),
		prices: [
			{name: "titanium", 	val: 20000},
			{name: "science", 	val: 300000},
			{name: "starchart", val: 5000},
			{name: "kerosene", 	val: 7500}
		],
		unlocks: {
			planet: ["kairo"],
            spaceMission: ["rorschachMission"]
		}
	},{
		name: "rorschachMission",
		label: $I("space.rorschachMission.label"),
		description: $I("space.rorschachMission.desc"),
		prices: [
			{name: "titanium", 	val: 80000},
			{name: "science", 	val: 500000},
			{name: "starchart", val: 15000},
			{name: "kerosene", 	val: 25000}
		],
		unlocks: {
			spaceMission: ["centaurusSystemMission"]
		}
	},{
		name: "yarnMission",
		label: $I("space.yarnMission.label"),
		description: $I("space.yarnMission.desc"),
		prices: [
			{name: "titanium", 	val: 35000},
			{name: "science", 	val: 350000},
			{name: "starchart", val: 7500},
			{name: "kerosene", 	val: 12000}
		],
		unlocks: {
			planet: ["yarn"],
			spaceMission: ["umbraMission"]
		}
	},{
		name: "umbraMission",
		label: $I("space.umbraMission.label"),
		description: $I("space.umbraMission.desc"),
		prices: [
			{name: "science", 	val: 500000},
			{name: "starchart", val: 25000},
			{name: "kerosene", 	val: 25000},
			{name: "thorium",   val: 15000}
		],
		unlocks: {
			planet: ["umbra"],
			spaceMission: ["charonMission"]
		}
	},{
		name: "charonMission",
		label: $I("space.charonMission.label"),
		description: $I("space.charonMission.desc"),
		prices: [
			{name: "science", 	val: 750000},
			{name: "starchart", val: 75000},
			{name: "kerosene", 	val: 35000},
			{name: "thorium",   val: 35000}
		],
		unlocks: {
			planet: ["charon"],
			spaceMission: ["charonMission"]
		}
	},{
		name: "centaurusSystemMission",
		label: $I("space.centaurusSystemMission.label"),
		description: $I("space.centaurusSystemMission.desc"),
		prices: [
			{name: "titanium", 	val: 40000},
			{name: "science", 	val: 800000},
			{name: "starchart", val: 100000},
			{name: "kerosene", 	val: 50000},
			{name: "thorium",   val: 50000}
		],
		unlocks: {
			planet: ["centaurusSystem"],
			spaceMission: ["furthestRingMission"]
		}
	},{
		name: "furthestRingMission",
		label: $I("space.furthestRingMission.label"),
		description: $I("space.furthestRingMission.desc"),
		prices: [
			{name: "science", 	val: 1250000},
			{name: "starchart", val: 500000},
			{name: "kerosene", 	val: 75000},
			{name: "thorium",   val: 75000}
		],
		unlocks: {
			planet: ["furthestRing"]
		}
	}],

	//============================================================================

	planets:
	[{
		name: "cath",
		label: $I("space.planet.cath.label"),
		routeDays: 0,
		buildings: [{
			name: "spaceElevator",
			label: $I("space.planet.cath.spaceElevator.label"),
			description: $I("space.planet.cath.spaceElevator.desc"),
			unlocked: false,
			priceRatio: 1.15,
			prices: [
				{name: "titanium", val: 6000},
				{name: "unobtainium", val: 50},
				{name: "science", val: 75000}
			],
			requiredTech: ["orbitalEngineering", "nanotechnology"],
			effects: {
				"oilReductionRatio": 0,
				"spaceRatio": 0,
				"prodTransferBonus" : 0
			},
			calculateEffects: function(self, game){
				self.effects = {
					"oilReductionRatio": 0.05,
					"spaceRatio": 0.01,
					"prodTransferBonus" : 0.001
				};
			},
		},{
			name: "sattelite",
			label: $I("space.planet.cath.sattelite.label"),
			description: $I("space.planet.cath.sattelite.desc"),
			unlocked: false,
			prices: [
				{name: "titanium", val: 2500},
				{name: "oil", val: 15000},
				{name: "science", val: 100000},
				{name: "starchart", val: 325}
			],
			priceRatio: 1.08,
			requiredTech: ["sattelites"],
			effects: {
				"observatoryRatio": 0,
				"starchartPerTickBaseSpace": 0,
				"energyConsumption": 0,
				"energyProduction": 0
			},
            unlocks:{
                policies:["outerSpaceTreaty","militarizeSpace"]
            },
			calculateEffects: function(self, game){
				if (self.val > 0){
					game.time.queue.unlockQueueSource("spaceBuilding");
				}
                var observatoryRatioTemp = 0.05 * (1 + game.getEffect("satelliteSynergyBonus"));
				self.effects = {
					"observatoryRatio": observatoryRatioTemp,
					"starchartPerTickBaseSpace": 0.001,
					"energyConsumption": 0,
					"energyProduction": 0
				};
				if (game.workshop.get("solarSatellites").researched) {
					self.effects["energyProduction"] = 1;
					self.on = self.val;
					self.togglable = false;
				}
				else {
					self.effects["energyConsumption"] = 1;
				}

				if (game.challenges.isActive("blackSky")) {
					self.effects['starchartPerTickBaseSpace'] *= 1 / (1 + game.getEffect('bskSattelitePenalty'));
				}

				game.upgrade(self.upgrades); //this way observatories won't have to use action
			},
			upgrades: {
				buildings: ["observatory"]
			},
			unlockScheme: {
				name: "space",
				threshold: 24
			}
		},{
			name: "spaceStation",
			label: $I("space.planet.cath.spaceStation.label"),
			description: $I("space.planet.cath.spaceStation.desc"),
			unlocked: false,
			prices: [
				{name: "oil", val: 35000},
				{name: "science", val: 150000},
				{name: "starchart", val: 425},
				{name: "alloy", 	val: 750}
			],
			priceRatio: 1.12,
			requiredTech: ["orbitalEngineering"],
			effects: {
				"scienceRatio": 0,
				"maxKittens": 0,
				"energyConsumption": 0
			},
			calculateEffects: function(self, game){
				var effects = {
					"scienceRatio": 0.5,
					"maxKittens": 2
				};
				effects["energyConsumption"] = 10;
				self.effects = effects;
			},
			unlocks: {
				tabs: ["village"]
			},
			breakIronWill: true
		}],

		calculateEffects: function(self, game){
			if (game.science.get("rocketry").researched){
				game.time.queue.unlockQueueSource("spaceMission");
			}
		}
	},{
		name: "moon",
		label: $I("space.planet.moon.label"),
		routeDays: 30,
		buildings: [{
			name: "moonOutpost",
			label: $I("space.planet.moon.moonOutpost.label"),
			description: $I("space.planet.moon.moonOutpost.desc"),
			unlocked: false,
			priceRatio: 1.12,
			prices: [
				{name: "oil", val: 55000},
				{name: "uranium",  val: 500},
				{name: "science", val: 100000},
				{name: "starchart", val: 650},
				{name: "concrate", val: 150},
				{name: "alloy",    val: 750}
			],
			effects: {
				"uraniumPerTickCon": 0,
				"unobtainiumPerTickSpace": 0,
				"energyConsumption": 0
			},
			calculateEffects: function(self, game){
				var effects = {
					"uraniumPerTickCon": -0.35,
					"unobtainiumPerTickSpace": 0.007 * (1 + game.getEffect("lunarOutpostRatio"))
				};
				effects["energyConsumption"] = 5;

				self.effects = effects;
			},
			lackResConvert: false,
			action: function(self, game){
				self.effects["uraniumPerTickCon"] = -0.35;
				self.effects["unobtainiumPerTickSpace"] = 0.007 * (1 + game.getEffect("lunarOutpostRatio"));
				var amt = game.resPool.getAmtDependsOnStock(
					[{res: "uranium", amt: -self.effects["uraniumPerTickCon"]}],
					self.on
				);
				self.effects["uraniumPerTickCon"] *= amt;
				self.effects["unobtainiumPerTickSpace"] *= amt;

				return amt;
			}
		},{
			name: "moonBase",
			label: $I("space.planet.moon.moonBase.label"),
			description: $I("space.planet.moon.moonBase.desc"),
			unlocked: false,
			priceRatio: 1.12,
			prices: [
				{name: "titanium", 		val: 9500},
				{name: "oil", 			val: 70000},
				{name: "unobtainium", 	val: 50},
				{name: "science", 		val: 100000},
				{name: "starchart", 	val: 700},
				{name: "concrate", 		val: 250}
			],
			effects: {
				"catnipMax"         : 0,
				"woodMax"           : 0,
				"mineralsMax"       : 0,
				"coalMax"           : 0,
				"ironMax"           : 0,
				"titaniumMax"       : 0,
				"oilMax"            : 0,
				"unobtainiumMax"    : 0,
				"energyConsumption" : 0
			},
			calculateEffects: function(self, game){
				var spaceportRatio = 1 + game.getEffect( "moonBaseStorageBonus" );
				var effects = {
					"catnipMax"         : 45000 * spaceportRatio,
					"woodMax"           : 25000 * spaceportRatio,
					"mineralsMax"       : 30000 * spaceportRatio,
					"coalMax"           : 3500 * spaceportRatio,
					"ironMax"           : 9000 * spaceportRatio,
					"titaniumMax"       : 1250 * spaceportRatio,
					"oilMax"            : 3500 * spaceportRatio,
					"unobtainiumMax"    : 150 * spaceportRatio,
					"energyConsumption" : 0
				};
				effects["energyConsumption"] = game.workshop.get("amBases").researched ? 5 : 10;

				if (game.workshop.get("aiBases").researched){
                    var aiBasesModifier = 1 + game.getEffect("aiCoreUpgradeBonus");
					for (var key in effects){
						if (key != "energyConsumption" ){
							effects[key] *= (1 + game.bld.get("aiCore").on * 0.1 * aiBasesModifier);
						}
					}
				}
				self.effects = effects;
			}
		}]
	},{
		name: "dune",
		label: $I("space.planet.dune.label"),
		routeDays: 356,
        buildings: [{
            name: "planetCracker",
            label: $I("space.planet.dune.planetCracker.label"),
            description: $I("space.planet.dune.planetCracker.desc"),
            unlocked: false,
            priceRatio: 1.18,
            prices: [
                {name: "science", val: 125000},
                {name: "starchart", val: 2500},
                {name: "alloy",  val: 1750},
                {name: "kerosene", val: 50}
            ],
            effects: {
				"uraniumPerTickSpace" : 0,
				"uraniumMax" : 0
            },
			calculateEffects: function (self, game){
				self.effects = {
					"uraniumPerTickSpace" : 0.3 * (1 + game.getEffect("crackerRatio")),
					"uraniumMax" : 1750 * (1 + game.getEffect("planetCrackerStorageBonus"))
				};
			}
        },{
            name: "hydrofracturer",
            label: $I("space.planet.dune.hydrofracturer.label"),
            description: $I("space.planet.dune.hydrofracturer.desc"),
            unlocked: false,
            priceRatio: 1.18,
            prices: [
                {name: "science", val: 150000},
                {name: "starchart", val: 750},
                {name: "alloy",  val: 1025},
                {name: "kerosene", val: 100}
            ],
            effects: {
				"oilPerTickAutoprodSpace": 0
            },
			calculateEffects: function(self, game){
				self.effects = {
					"oilPerTickAutoprodSpace": 0.5
				};
			},
			unlockScheme: {
			name: "fluid",
			threshold: 10
			}
        },{
			name: "spiceRefinery",
			label: $I("space.planet.dune.spiceRefinery.label"),
			description: $I("space.planet.dune.spiceRefinery.desc"),
			unlocked: false,
			priceRatio: 1.15,
			prices: [
				{name: "science", val: 75000},
				{name: "starchart", val: 500},
				{name: "alloy",  val: 500},
				{name: "kerosene", val: 125}
			],
			effects: {
				"spicePerTickAutoprodSpace": 0
			},
			calculateEffects: function(self, game){
				self.effects = {
					"spicePerTickAutoprodSpace": 0.025
				};
			},
			unlockScheme: {
				name: "dune",
				threshold: 10
			}
		}]
	},{
		name: "piscine",
		label: $I("space.planet.piscine.label"),
		routeDays: 256,
		buildings: [{
            name: "researchVessel",
            label: $I("space.planet.piscine.researchVessel.label"),
            description: $I("space.planet.piscine.researchVessel.desc"),
            unlocked: false,
            priceRatio: 1.15,
            prices: [
                {name: "titanium", val: 12500},
                {name: "starchart", val: 100},
                {name: "alloy",  val: 2500},
                {name: "kerosene", val: 250}
            ],
            effects: {
				"scienceMax": 0,
				"starchartPerTickBaseSpace": 0
			},
			calculateEffects: function(self, game) {
				self.effects = {
					"scienceMax": 10000 * (1 + game.getEffect("spaceScienceRatio")),
					"starchartPerTickBaseSpace": game.challenges.isActive("blackSky") ? 0 : 0.01
				};
            },
			unlockScheme: {
				name: "vessel",
				threshold: 20
			}
        },{
            name: "orbitalArray",
            label: $I("space.planet.piscine.orbitalArray.label"),
            description: $I("space.planet.piscine.orbitalArray.desc"),
            unlocked: false,
            priceRatio: 1.15,
            prices: [
                {name: "science", val: 250000},
				{name: "starchart", val: 2000},
                {name: "eludium",  val: 100},
                {name: "kerosene", val: 500}
            ],
            effects: {
				"spaceRatio": 0,
				"energyConsumption" : 0
				},
            calculateEffects: function(self, game){
				var effects = {
					"spaceRatio": 0.02
				};
				effects["energyConsumption"] = 20;
				self.effects = effects;
            }
        }]
	},{
		name: "helios",		//technically it is a planet from the game point of view
		label: $I("space.planet.helios.label"),
		routeDays: 1200,
		buildings: [{
            name: "sunlifter",
            label: $I("space.planet.helios.sunlifter.label"),
            description: $I("space.planet.helios.sunlifter.desc"),
            unlocked: false,
            priceRatio: 1.15,
            prices: [
                {name: "science", val: 500000},
                {name: "eludium", val: 225},
                {name: "kerosene", val: 2500}
            ],
            effects: {
				"antimatterProduction": 0,
				"energyProduction" : 0
			},
            calculateEffects: function(self, game){
				self.effects = {
					"antimatterProduction": 1,
					"energyProduction" : 30
				};
            }
        },{
			name: "containmentChamber",
			label: $I("space.planet.helios.containmentChamber.label"),
			description: $I("space.planet.helios.containmentChamber.desc"),
			unlocked: false,
			priceRatio: 1.125,
			prices: [
				{name: "science", val: 500000},
				{name: "kerosene", val: 2500}
			],
			effects: {
				"antimatterMax": 0,
				"energyConsumption": 0
			},
			calculateEffects: function(self, game){
				var effects = {
					"antimatterMax": 100 * (1 + game.space.getBuilding("heatsink").val * 0.02),
					"energyConsumption" : 50 * (1 + game.space.getBuilding("heatsink").val * 0.01)
				};

				self.effects = effects;
			}
		},{
			name: "heatsink",
			label: $I("space.planet.helios.heatsink.label"),
			description: $I("space.planet.helios.heatsink.desc"),
			unlocked: false,
			priceRatio: 1.12,
			prices: [
				{name: "science", val: 125000},
				{name: "relic",   val: 1},
				{name: "kerosene", val: 5000},
				{name: "thorium", val: 12500 }
			],
			effects: {
			},
			calculateEffects: function(self, game){
			},
			upgrades: {
				spaceBuilding: ["containmentChamber"]
			}
		},{
			name: "sunforge",
			label: $I("space.planet.helios.sunforge.label"),
			description: $I("space.planet.helios.sunforge.desc"),
			unlocked: false,
			priceRatio: 1.12,
			prices: [
				{name: "antimatter", val: 250},
				{name: "science", val: 100000},
				{name: "relic",   val: 1},
				{name: "kerosene", val: 1250}
			],
			effects: {
				"baseMetalMaxRatio": 0.01
			},
			calculateEffects: function(self, game){
				//todo use secondary booster structure
			}/*,
			upgrades: {
				spaceBuilding: ["containmentChamber"]
			}*/
		}]
	},{
		name: "terminus",
		label: $I("space.planet.terminus.label"),
		routeDays: 2500,
        buildings:[{
            name: "cryostation",
            label: $I("space.planet.terminus.cryostation.label"),
            description: $I("space.planet.terminus.cryostation.desc"),
            unlocked: false,
            priceRatio: 1.12,
            prices: [
                {name: "science", val: 200000   },
                {name: "concrate", val: 1500    },
                {name: "eludium", val: 25       },
                {name: "kerosene", val: 500   }
            ],
            effects: {
				"woodMax"       : 0,
				"mineralsMax"   : 0,
				"coalMax"       : 0,
				"ironMax"       : 0,
				"titaniumMax"   : 0,
				"oilMax"        : 0,
				"uraniumMax"    : 0,
				"unobtainiumMax": 0
			},
            calculateEffects: function(self, game){
				var ratio = 1 + game.getEffect("cryostationStorageBonus");
				self.effects = {
					"woodMax"       : 200000 * ratio,
					"mineralsMax"   : 200000 * ratio,
					"coalMax"       : 25000 * ratio,
					"ironMax"       : 50000 * ratio,
					"titaniumMax"   : 7500 * ratio,
					//"oilMax"        : 25000 * ratio,
					"oilMax"        : 7500 * ratio,
					"uraniumMax"    : 5000 * ratio,
					"unobtainiumMax": 750 * ratio
				};
            },
			unlockScheme: {
				name: "arctic",
				threshold: 10
			}
        }
        ]
	},{
		name: "kairo",
		label: $I("space.planet.kairo.label"),
		routeDays: 5000,
		buildings:[
			{
				name: "spaceBeacon",
				label: $I("space.planet.kairo.spaceBeacon.label"),
				description: $I("space.planet.kairo.spaceBeacon.desc"),
				unlocked: false,
				priceRatio: 1.15,
				prices: [
					{name: "antimatter", 	val: 50 },
					{name: "starchart", 	val: 25000 },
					{name: "alloy", 		val: 25000 },
					{name: "kerosene", 		val: 7500   }
				],
				effects: {
					"scienceMax": 25000,
					"starchartPerTickBaseSpace": 0.025,
					"relicPerDay": 0
				},
				action: function(self, game){

					var rPerDay = game.getEffect("beaconRelicsPerDay");
					var rrBoost = 1 + game.getEffect("relicRefineRatio") * game.religion.getZU("blackPyramid").getEffectiveValue(game) * 0.1;	//10% per BP * BN combo

					//lol
					var amMax = game.resPool.get("antimatter").maxValue;
					if (amMax < 5000) {
						rrBoost = rrBoost * (amMax / 5000);
						//todo: consider boosting relic stations is over 5000
					}

					var entBoost = (1 + game.space.getBuilding("entangler").effects["hashRateLevel"] * 0.25);	//25% per entangler hashrate

					self.effects = {
						"scienceMax": 25000 * (1 + game.getEffect("spaceScienceRatio")),
						"starchartPerTickBaseSpace": 0.025,
						"relicPerDay": rPerDay * rrBoost * entBoost
					};
				}
			}
		]
	},{
		name: "yarn",
		label: $I("space.planet.yarn.label"),
		routeDays: 3800,
		buildings:[
			{
				name: "terraformingStation",
				label: $I("space.planet.yarn.terraformingStation.label"),
				description: $I("space.planet.yarn.terraformingStation.desc"),
				unlocked: false,
				priceRatio: 1.25,
				prices: [
					{name: "uranium", val: 5000  },
					{name: "antimatter", val: 25  },
					{name: "kerosene", val: 5000  }
				],
				requiredTech: ["terraformation"],
				effects: {
					"maxKittens": 1
				},
				action: function(self, game) {
					self.effects["maxKittens"] = 1 + game.getEffect("terraformingMaxKittensRatio");
				},
				unlocks: {
					tabs: ["village"]
				},
				breakIronWill: true
			},
			{
				name: "hydroponics",
				label: $I("space.planet.yarn.hydroponics.label"),
				description: $I("space.planet.yarn.hydroponics.desc"),
				unlocked: false,
				priceRatio: 1.15,
				prices: [
					{name: "unobtainium", val: 1 },
					{name: "kerosene", val: 500 }
				],
				requiredTech: ["hydroponics"],
				effects: {
					"catnipRatio": 0.025,
					"catnipMaxRatio": 0.1,
					"terraformingMaxKittensRatio": 0
				},
				upgrades: {
					spaceBuilding: ["terraformingStation"]
				},
				// TODO Actually "action" is almost always just updating effects (unclear from the name), better separate the 2 concerns: update effects (can be done several times per tick) and perform specific action (only once per tick!)
				// TODO Separation of concerns currently done only for AI Core, Time Boilers and Hydroponics (REQUIRED by non-proportional effect!), will be systematized later
				updateEffects: function(self, game) {
					// 0 HP = +0%
					// 100 HP = +100%
					// 300 HP = +200%
					self.effects["terraformingMaxKittensRatio"] = game.getUnlimitedDR(self.on, 100) / self.on;
					// Reset each tick because of cycle effect (from Yarn and Piscine) being applied continuously, due to presence of method "action"
					self.effects["catnipRatio"] = 0.025;
				},
				action: function(self, game) {
					self.updateEffects(self, game);
				}
			}
		]
	},{
		name: "umbra",
		label: $I("space.planet.umbra.label"),
		routeDays: 7500,
		buildings:[
			{
				name: "hrHarvester",
				label: $I("space.planet.umbra.hrHarvester.label"),
				description: $I("space.planet.umbra.hrHarvester.desc"),
				unlocked: true,
				priceRatio: 1.15,
				prices: [
					{name: "antimatter", val: 1250 },
					{name: "relic", val: 25 }
				],
				effects: {
					"energyProduction": 1
				},
				calculateEffects: function(self, game) {
					var yearBonus = game.calendar.darkFutureYears();
					if (yearBonus < 0){
						yearBonus = 0;
					}

					self.effects["energyProduction"] =
						(1 + game.getUnlimitedDR(yearBonus, 0.075) * 0.01) *
						(1 + game.getEffect("umbraBoostRatio"));
				}
			},{
				name: "navigationRelay",
				label: $I("space.planet.umbra.navigationRelay.label"),
				description: $I("space.planet.umbra.navigationRelay.desc"),
				unlocked: false,
				requiredTech: false,
				priceRatio: 1.2,
				prices: [
					{name: "titanium", val: 50000 }, // TBD
					{name: "concrate", val: 5000 }
				],
				effects: {} // TBD
			}, {
				name: "spaceShuttle",
				label: $I("space.planet.umbra.spaceShuttle.label"),
				description: $I("space.planet.umbra.spaceShuttle.desc"),
				unlocked: false,
				requiredTech: false,
				priceRatio: 1.15,
				prices: [
					{name: "antimatter", val: 50 }, // TBD
					{name: "eludium", val: 500 }
				],
				effects: {} // TBD
			}
		]
	},{
		name: "charon",
		label: $I("space.planet.charon.label"),
		routeDays: 25000,
		buildings:[
			{
				name: "entangler",
				label: $I("space.planet.charon.entangler.label"),
				description: $I("space.planet.charon.entangler.desc"),
				unlocked: false,
				priceRatio: 1.15,
				prices: [
					{name: "antimatter", val: 5250 },
					{name: "relic", val: 1250 },
					{name: "eludium", val: 5000 }
				],
				requiredTech: ["quantumCryptography"],
				effects: {
					"gflopsConsumption": 0.1,
					"hashrate": 0,
					"hashRateLevel": 0,
					"nextHashLevelAt": 0,
					"hrProgress": 0,
					"energyConsumption": 25
				},
				action: function(self, game){
					var gflopsPerTick = self.effects["gflopsConsumption"] * self.on;
					if (game.resPool.get("gflops").value < gflopsPerTick && game.resPool.get("gflops").value > 0){
						gflopsPerTick = game.resPool.get("gflops").value;
					}

					if (game.resPool.get("gflops").value != 0) {
						game.resPool.addResEvent("gflops", -gflopsPerTick);
						game.resPool.addResEvent("hashrates", gflopsPerTick);
					}

					var hr = game.resPool.get("hashrates").value,
						difficulty = 1000,
						rate = 1.6;

					self.effects["hashrate"] = hr;
					self.effects["nextHashLevelAt"] = difficulty * Math.pow(rate, self.effects["hashRateLevel"] + 1);
					self.effects["hrProgress"] = hr / (difficulty * Math.pow(rate, self.effects["hashRateLevel"] + 1));
					if (hr > difficulty){
						self.effects["hashRateLevel"] = Math.floor(Math.log(hr / difficulty) / Math.log(rate));
					} else {
						self.effects["hashRateLevel"] = 0;
					}
					self.effects["gflopsConsumption"] = 0.1;
				}
			}
		]
	},{
		name: "centaurusSystem",
		label: $I("space.planet.centaurusSystem.label"),
		routeDays: 120000,
		buildings:[
			{
				name: "tectonic",
				label: $I("space.planet.centaurusSystem.tectonic.label"),
				description: $I("space.planet.centaurusSystem.tectonic.desc"),
				unlocked: false,
				priceRatio: 1.25,
				prices: [
					{name: "antimatter", val: 500 },
					{name: "thorium", val: 75000 }
				],
				requiredTech: ["terraformation"],
				effects: {
					"energyProduction": 0
				},
				calculateEffects: function(self, game){
					self.effects = {
						"energyProduction": 25 * (1 + game.getEffect("tectonicBonus"))
					};
				}
			}, {
				name: "moltenCore",
				label: $I("space.planet.centaurusSystem.moltenCore.label"),
				description: $I("space.planet.centaurusSystem.moltenCore.desc"),
				unlocked: false,
				priceRatio: 1.25,
				prices: [
					{name: "uranium", val: 5000000 },
					{name: "science", val: 25000000 }
				],
				effects: {
					"tectonicBonus": 0.05
				},
				requiredTech: ["exogeophysics"],
				upgrades: {
					spaceBuilding: ["tectonic"]
				}
			}
		]
	},{
		name: "furthestRing",
		label: $I("space.planet.furthestRing.label"),
		routeDays: 725000000,
		buildings:[
			//TBD
		]
	}],

	metaCache: null,

	//============================================================================

	constructor: function(game){
		this.game = game;
		this.metaCache = {};
		this.registerMeta("stackable", this.programs, null);
		for (var i in this.planets) {
			var planet = this.planets[i];
			this.registerMeta(false, planet.buildings, { getEffect: function(building, effectName){
				if (!building.effects){
					return 0;
				} else {
					//There are 4 specially calculated effects that aren't supposed to be multiplied by the number of buildings,
					//because they're properties of the building category as a whole, not any individual building.
					if (effectName === "hashrate" || effectName === "hashRateLevel" ||
					    effectName === "nextHashLevelAt" || effectName === "hrProgress")
					{
						//For these 4 specially calculated effects, don't multiply by building.on and don't apply spaceRatio.
						return building.effects[effectName];
					}
					//Else, this isn't one of the special effects, so compute it normally.
					var spaceRatio = (effectName == "spaceRatio" && game.resPool.energyCons > game.resPool.energyProd) ? game.resPool.getEnergyDelta() : 1;
					return building.effects[effectName] * building.on * spaceRatio;
				}
			}});
		}
		// Keep default route days to reset state after reset or load
		for (var i in this.planets) {
			this.planets[i].routeDaysDefault = this.planets[i].routeDays;
		}
		this.setEffectsCachedExisting();

		// Cache spaceBuildingsMap
		for (var i = 0; i < this.planets.length; i++) {
			var spaceBuildings = this.planets[i].buildings.map(function(building){
				return building.name;
			});
			for (var j = 0; j < spaceBuildings.length; j++) {
				this.spaceBuildingsMap.push(spaceBuildings[j]);
			}
		}
	},

	resetState: function(){
		for (var i = 0; i < this.programs.length; i++){
			var program = this.programs[i];

			program.unlocked = program.name == "orbitalLaunch";
			program.noStackable = true;

			this.resetStateStackable(program);
		}

		for (i = 0; i < this.planets.length; i++){
			var planet = this.planets[i];
			planet.unlocked = false;
			planet.reached = false;
			planet.routeDays = planet.routeDaysDefault;

			if (planet.buildings){
				for (var j = 0; j < planet.buildings.length; j++){
					var program = planet.buildings[j];
					program.unlocked = false;

					this.resetStateStackable(program);
				}
			}
		}

		this.hideResearched = false;
	},

	save: function(saveData){

		var planets = this.filterMetadata(this.planets, ["name", "buildings", "reached", "unlocked", "routeDays"]);

		for (var i = 0; i < planets.length; i++){
			var planet = planets[i];
			if (planet.buildings){
				planet.buildings = this.filterMetadata(planet.buildings, ["name", "val", "on", "unlocked"]);
			}
		}

		saveData.space = {
			hideResearched: this.hideResearched,
			programs: this.filterMetadata(this.programs, ["name", "val", "on", "unlocked"]),
			planets: planets
		};
	},

	load: function(saveData){
		if (!saveData.space){
			return;
		}

		this.hideResearched = saveData.space.hideResearched || false;
		this.loadMetadata(this.programs, saveData.space.programs);
		this.loadMetadata(this.planets, saveData.space.planets);

		//TODO: move to some common method?
		for (var i = this.programs.length - 1; i >= 0; i--) {
			var program = this.programs[i];
			if (program.val && program.unlocks){
				this.game.unlock(program.unlocks);
			}
		}

		for (var i = this.planets.length - 1; i >= 0; i--){
			var planet = this.planets[i];
			if (planet.buildings){
				for (var j = planet.buildings.length - 1; j >= 0; j--){
					var bld = planet.buildings[j];
					if (bld.val && bld.unlocks){
						this.game.unlock(bld.unlocks);
					}
				}
			}
		}
	},

	update: function(){
		for (var i in this.planets){
			var planet = this.planets[i];

			if (!planet.reached && planet.unlocked) {
				if (planet.routeDays > 0) {
					var routeSpeed = this.game.getEffect("routeSpeed") != 0 ? this.game.getEffect("routeSpeed") : 1;
					planet.routeDays -= routeSpeed / this.game.calendar.ticksPerDay;
				} else {
					planet.routeDays = 0;
					planet.reached = true;
					this.game.time.queue.unlockQueueSource("spaceBuilding");
					this.game.msg($I("space.newplanet.log.msg"), "important");
				}
			}

			for (var j in planet.buildings){
				var bld = planet.buildings[j];

				if (!bld.unlocked && planet.reached) {
					if (typeof(bld.requiredTech) == "undefined"){
						bld.unlocked = true;
					} else if (bld.requiredTech) {
						var isUnlocked = true;
						for (var i = bld.requiredTech.length - 1; i >= 0; i--) {
							var tech = this.game.science.get(bld.requiredTech[i]);
							if (!tech.researched){
								isUnlocked = false;
							}
						}
						bld.unlocked = isUnlocked;
					}
				}

				if (bld.action && bld.val > 0){
					var amt = bld.action(bld, this.game);
					if (typeof(amt) != "undefined") {
						bld.lackResConvert = amt != 1 && bld.on != 0;
					}
					this.game.calendar.cycleEffectsBasics(bld.effects, bld.name);
				}
			}
		}

		for (var i = 0; i < this.programs.length; i++) {
			var program = this.programs[i];

			if (program.val > 0 && !program.on){
				if (program.unlocks && program.unlocks.planet){
					var planet = this.getPlanet(program.unlocks.planet[0]);
					if (planet && planet.reached){
						program.on = 1;
					}
				} else {
					program.on = 1; //just set on if no corresponding planet
				}
			}
		}
	},

	fastforward: function(daysOffset) {
		var times = daysOffset * this.game.calendar.ticksPerDay;
		for (var i in this.planets){
			var planet = this.planets[i];

			if (!planet.reached && planet.unlocked) {
				if (planet.routeDays > 0) {
					var routeSpeed = this.game.getEffect("routeSpeed") != 0 ? this.game.getEffect("routeSpeed") : 1;
					planet.routeDays -= times * routeSpeed / this.game.calendar.ticksPerDay;
				}
			}
		}

		var entangler = this.getBuilding("entangler");

		var existingGFlops = this.game.resPool.get("gflops").value;
		var gflopsPerTick = entangler.effects.gflopsConsumption * entangler.on;
		var gflopsAttemptConsume = gflopsPerTick * times;

		var gflopsConsume = Math.min(existingGFlops, gflopsAttemptConsume);
		if (gflopsConsume <= 0) {
			return;
		}

		this.game.resPool.addResEvent("gflops", -gflopsConsume);
		this.game.resPool.addResEvent("hashrates", gflopsConsume);
	},

	getProgram: function(name){
		if (this.metaCache[name]){
			return this.metaCache[name];
		}

		for (var i = this.programs.length - 1; i >= 0; i--){
			var program = this.programs[i];
			if (program.name == name){
				this.metaCache[name] = program;
				return program;
			}
		}
	},

	getBuilding: function(name) {
		if (this.metaCache[name]){
			return this.metaCache[name];
		}

		for (var i = this.planets.length - 1; i >= 0; i--){
			var planet = this.planets[i];
			if (planet.buildings){
				for (var j = planet.buildings.length - 1; j >= 0; j--){
					var bld = planet.buildings[j];
					if (bld.name == name){
						this.metaCache[name] = bld;
						return bld;
					}
				}
			}
		}
	},

	getPlanet: function(name){
		return this.getMeta(name, this.planets);
	},

	/**
	 * This method is probably slow as hell, revisit it
	 */
	getAutoProductionRatio: function(useTransferBonus){
        var ratio = ( 1 + this.game.getEffect("spaceRatio"));
		if (useTransferBonus){
			ratio *= ( 1 + ((this.game.bld.getAutoProductionRatio(false, 0.05) - 1) * (this.game.getEffect("prodTransferBonus"))));
		}

		if (this.game.workshop.get("spaceManufacturing").researched){
			var factory = this.game.bld.get("factory");
			ratio *= (1 + factory.on * factory.effects["craftRatio"] * 0.75);
		}
		return ratio;
	},

	unlockAll: function(){
		for (var i in this.planets){
			this.planets[i].unlocked = true;
		}

		for (var i in this.programs){
			this.programs[i].unlocked = true;
		}
		this.game.msg("All space upgrades are unlocked");
	},
	getEffect: function(effectName){
		var effect = 0;
		for (var i = 0; i < this.meta.length; i++){
			var effectMeta = this.getMetaEffect(effectName, this.meta[i]);
			effect += effectMeta;
		}
		return effect;
	}
});

dojo.declare("com.nuclearunicorn.game.ui.SpaceProgramBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.space.getProgram(model.options.id);
        }
        return model.metaCached;
    },

    getPrices: function(model) {
        var prices = dojo.clone(model.metadata.prices);

        for (var i = 0; i < prices.length; i++){
            if (prices[i].name == "oil"){
                var reductionRatio = this.game.getLimitedDR(this.game.getEffect("oilReductionRatio"), 0.75);
                prices[i].val *= (1 - reductionRatio);
			}
		}

		if (this.game.challenges.isActive("blackSky")
		 && model.metadata.name == "orbitalLaunch") {
			for (var i = 0; i < prices.length; i++) {
				prices[i].val *= prices[i].name == "starchart" ? 0 : 11;
			}
		}

		return prices;
	},

	updateVisible: function(model){
		var meta = model.metadata;
		if (meta.requiredTech){
			for (var i = meta.requiredTech.length - 1; i >= 0; i--) {
				var tech = this.game.science.get(meta.requiredTech[i]);
				if (!tech.researched){
					model.visible = false;
					return;
				}
			}
		}
		if (meta.on && meta.noStackable && this.game.space.hideResearched){
			model.visible = false;
			return;
		}
		model.visible = meta.unlocked;
	},

	updateEnabled: function(model) {
		var meta = model.metadata;
		if (meta.val != 0 && meta.on == 0) { //This checks for if the mission is "in progress"
			model.enabled = false;
			return;
		}
		this.inherited(arguments);
	},

	getName: function(model){
		var meta = model.metadata;

		if (meta.val == 0) {
			return meta.label;
		} else if (meta.on == 0){
			return $I("space.mission.name.inprogress", [meta.label]);
		} else {
			return $I("space.mission.name.complete", [meta.label]);
		}
	},

	buyItem: function(model, event, callback) {
		if (model.metadata.val == 0) {
			this.inherited(arguments);
		} else {
			callback(false);
		}
	},

	build: function(model, maxBld){
		var counter = this.inherited(arguments);
		model.metadata.on = 0;
		if (model.metadata.name == "rorschachMission") {
			model.metadata.on = 1;
			this.game.msg($I("space.mission.rorschach.complete.log.msg"), "important");
		}
		return counter;
    }

});

dojo.declare("classes.ui.space.PlanetBuildingBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.space.getBuilding(model.options.id);
        }
        return model.metaCached;
    },

    hasSellLink: function(model){
		return !this.game.opts.hideSell;
	},

	getPrices: function(model) {
        var meta = model.metadata;
        var ratio = meta.priceRatio || 1.15;

        var prices = dojo.clone(meta.prices);
		var pricesDiscount = this.game.getLimitedDR((this.game.getEffect(meta.name + "CostReduction")), 1);
		var priceModifier = 1 - pricesDiscount;
        for (var i = 0; i < prices.length; i++){
            if (prices[i].name !== "oil") {
                prices[i].val = prices[i].val * Math.pow(ratio, meta.val);
             } else {
                prices[i].val = prices[i].val * Math.pow(1.05, meta.val);
                var reductionRatio = this.game.getLimitedDR(this.game.getEffect("oilReductionRatio"), 0.75);
                prices[i].val *= (1 - reductionRatio);
             }
			 var resPriceDiscount = this.game.getLimitedDR(this.game.getEffect(prices[i].name + "CostReduction"), 1);
			 var resPriceModifier = 1 - resPriceDiscount;
			 prices[i].val *= priceModifier * resPriceModifier; //CostReduction effects
		}

		if (this.game.challenges.isActive("blackSky")
		 && meta.name == "sattelite"
		 && meta.val == 0) {
			for (var i = 0; i < prices.length; i++) {
				prices[i].val *= prices[i].name == "starchart" ? 0 : 14;
			}
		}

		return prices;
	}
});

dojo.declare("classes.ui.space.PlanetPanel", com.nuclearunicorn.game.ui.Panel, {
	planet: null,

	render: function(){
		var container = this.inherited(arguments);

		var self = this;

		var controller = new classes.ui.space.PlanetBuildingBtnController(this.game);
		dojo.forEach(this.planet.buildings, function(building, i){
			var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({id: building.name, planet: self.planet, controller: controller}, self.game);

			button.render(container);
			self.addChild(button);
		});
		return container;
	},

	update: function() {
		if (!this.planet.reached && this.planet.unlocked && this.planet.routeDays > 0) {
			var routeSpeed = this.game.getEffect("routeSpeed") != 0 ? this.game.getEffect("routeSpeed") : 1;
			this.title.innerHTML = this.name + " | ETA: " + this.game.toDisplayDays(Math.round(this.planet.routeDays / routeSpeed));
		} else {
			this.title.innerHTML = this.name;
		}

		this.inherited(arguments);
	}
});

dojo.declare("classes.ui.space.FurthestRingPanel", [classes.ui.space.PlanetPanel], {
	constructor: function(title, manager, game){
		this.game = game;
	},

	render: function(container){
		var wrapper = new mixin.IReactAware(WChiral, this.game);

		var content = this.inherited(arguments);
		wrapper.render(content);

		return content;
	}
});

dojo.declare("com.nuclearunicorn.game.ui.tab.SpaceTab", com.nuclearunicorn.game.ui.tab, {

	GCPanel: null,
	planetPanels: null,

	constructor: function(){
		//------------ void stuff --------------
		this.aPanel = new com.nuclearunicorn.game.ui.Panel($I("space.panel.rorshach.label"));
		this.aPanel.setVisible(false);
		this.addChild(this.aPanel);

		var aWgt = new classes.ui.RorshachWgt(this.game);
		aWgt.setGame(this.game);
		this.aPanel.addChild(aWgt);
	},

	render: function(container) {
		var self = this;

		//--------------------------------------------------------------------
		var div = dojo.create("div", { style: { float: "right"}}, container);
		var groupCheckbox = dojo.create("input", {
			id : "toggleResearched",
			type: "checkbox",
			checked: this.game.space.hideResearched
		}, div);

		dojo.connect(groupCheckbox, "onclick", this, function(){
			this.game.space.hideResearched = !this.game.space.hideResearched;

			dojo.empty(container);
			this.render(container);
		});

		dojo.create("label", { innerHTML: $I("space.tab.hide.complete.missions"), for: "toggleResearched"}, div);
		//---------------------------------------------------------------------

		//padding div to preserve markup
		dojo.create("div", { style: { height: "20px"}}, container);

		this.GCPanel = new com.nuclearunicorn.game.ui.Panel($I("space.ground.control.label"), this.game.space);
		var content = this.GCPanel.render(container);
		var controller = new com.nuclearunicorn.game.ui.SpaceProgramBtnController(this.game);
		dojo.forEach(this.game.space.programs, function(program, i){
			var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({id: program.name, controller: controller}, self.game);
			button.render(content);
			self.GCPanel.addChild(button);
		});

		//----------------------------------------------------
		//render children right before llegacy planet rendering

		this.container = container;
		this.inherited(arguments);

        //------------ space space I'm in space -------------
        this.planetPanels = [];
        dojo.forEach(this.game.space.planets, function(planet, i){
            if (planet.unlocked){

				if (this.game.prestige.getPerk("numerology").researched) {
					var planetTitle = "";
					dojo.forEach(this.game.calendar.cycles, function(cycle, i){
						if (cycle.name == planet.name || (planet.name == "moon" && cycle.name == "redmoon")) {
							planetTitle += cycle.glyph + " ";
						}
					});
					planetTitle += planet.label;
				} else {
					planetTitle = planet.label;
				}

				var planetPanel = null;
				if (planet.name == "furthestRing"){
					planetPanel = new classes.ui.space.FurthestRingPanel(planetTitle, self.game.space, self.game);
				} else {
					planetPanel = new classes.ui.space.PlanetPanel(planetTitle, self.game.space);
				}

                planetPanel.planet = planet;
                planetPanel.setGame(self.game);
                planetPanel.render(container);

                self.planetPanels.push(planetPanel);
            }
        });

		this.update();
	},

	update: function(){
		this.GCPanel.update();

        dojo.forEach(this.planetPanels, function(panel, i){
            panel.update();
        });

		this.inherited(arguments);

		var hasAstronomicon = this.game.space.getProgram("rorschachMission").on;
		if (hasAstronomicon){
			this.aPanel.setVisible(true);
		}
	}
});
