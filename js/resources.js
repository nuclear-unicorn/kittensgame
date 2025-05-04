
dojo.declare("classes.managers.ResourceManager", com.nuclearunicorn.core.TabManager, {

	//=========================================
	//				COMMON
	//=========================================

	/**
	 * visible: resource will be visible in the topmost ("resource") table
	 * craftable: resource will be visible in the bottom ("craft") table
	 *
	 * Those flags are not mutually exclusive
	 *
	 *  transient: will not be affected by magneto production bonus (and other bonuses)
	 *  persists: affects how resources are carried over through reset
	 *  * undefined: carries over depending on Chronospheres
	 *  * true: carries over untouched
	 *  * false: does not carry over
	 *  type: common/uncommon/rare/exotic
	 */
	resourceData: [
	{
		name : "catnip",
		title: $I("resources.catnip.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "wood",
		title: $I("resources.wood.title"),
		type : "common",
		craftable: true,
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "minerals",
		title: $I("resources.minerals.title"),
		type : "common",
		visible: true,
		calculatePerTick:  true,
		aiCanDestroy: true
	},{
		name : "coal",
		title: $I("resources.coal.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "iron",
		title: $I("resources.iron.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true,
		tag: "baseMetal"
	},{
		name : "titanium",
		title: $I("resources.titanium.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true,
		tag: "baseMetal"
	},{
		name : "gold",
		title: $I("resources.gold.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true,
		tag: "baseMetal"
	},{
		name : "oil",
		title: $I("resources.oil.title"),
		type : "common",
		visible: true,
		calculatePerTick: true,
		aiCanDestroy: true,
		isNotRefundable: true
	},{
		name : "uranium",
		title: $I("resources.uranium.title"),
		type : "common",
		visible: true,
		color: "#4EA24E",
		calculatePerTick: true,
		aiCanDestroy: true,
		tag: "baseMetal"
	},{
		name : "unobtainium",
		title: $I("resources.unobtainium.title"),
		type : "common",
		visible: true,
		display: true,
		color: "#A00000",
		calculatePerTick: true,
		aiCanDestroy: true,
		tag: "baseMetal"
	},

	//=========================================
	//			   TRANSIENT
	//=========================================
	{
		name : "antimatter",
		title: $I("resources.antimatter.title"),
		type : "common",
		transient: true,
		visible: true,
		color: "#5A0EDE",
		calculateOnYear: true,
		isRefundable: function(game) {
			return game.resPool.energyProd >= game.resPool.energyCons;
		}
	},{
		name : "manpower",
		title: $I("resources.manpower.title"),
		type : "common",
		visible: true,
		transient: true,		//cant be affected by magneto bonus
		color: "#DBA901",
		calculatePerTick: true
	},{
		name : "science",
		title: $I("resources.science.title"),
		type : "common",
		visible: true,
		transient: true,
		color: "#01A9DB",
		calculatePerTick: true
	},{
		name : "culture",
		title: $I("resources.culture.title"),
		type : "common",
		visible: true,
		transient: true,
		color: "#DF01D7",
		calculatePerTick: true
	},{
		name : "faith",
		title: $I("resources.faith.title"),
		type : "common",
		visible: true,
		transient: true,
		color: "gray",
		calculatePerTick: true
	},{
		name : "kittens",
		title: $I("resources.kittens.title"),
		type : "common",
		transient: true,
		visible: true,
		persists: false
	},{
		name : "zebras",
		title: $I("resources.zebras.title"),
		type : "common",
		transient: true,
		visible: true,
		persists: false
	},{
		name : "starchart",
		title: $I("resources.starchart.title"),
		type : "common",
		transient: true,
		visible: true,
		color: "#9A2EFE",
		calculatePerTick: true
	},{
		name : "temporalFlux",
		title: $I("resources.temporalFlux.title"),
		type : "common",
		craftable: false,
		visible: false,
		persists: true
	},{
		name : "gflops",
		title: $I("resources.gflops.title"),
		type : "common",
		transient: true,
		craftable: false,
		visible: false,
		persists: false
	},{
		name : "hashrates",
		title: $I("resources.hashrates.title"),
		type : "common",
		transient: true,
		craftable: false,
		visible: false,
		persists: false
	},
	//=========================================
	// 			  luxury resources
	//=========================================
	{
		name : "furs",
		title: $I("resources.furs.title"),
		type : "uncommon",
		transient: true,
		visible: true,
		persists: false,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "ivory",
		title: $I("resources.ivory.title"),
		type : "uncommon",
		transient: true,
		visible: true,
		persists: false,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "spice",
		title: $I("resources.spice.title"),
		type : "uncommon",
		transient: true,
		visible: true,
		persists: false,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "unicorns",
		title: $I("resources.unicorns.title"),
		type : "rare",
		transient: true,
		visible: true,
		persists: false,
		calculatePerTick: true,
		aiCanDestroy: true
	},{
		name : "alicorn",
		title: $I("resources.alicorn.title"),
		type : "rare",
		visible: true,
		persists: false,
		calculatePerTick: true,
		aiCanDestroy: true,
		calculatePerTickAndDay: true
	},{
		name : "necrocorn",
		title: $I("resources.necrocorn.title"),
		type : "rare",			//todo: some special FX
		visible: true,
		color: "#E00000",
		persists: false,
		calculatePerDay: true,
	},{
		name : "tears",
		title: $I("resources.tears.title"),
		type : "rare",
		visible: true,
		persists: false
	},{
		name : "karma",
		title: $I("resources.karma.title"),
		type : "rare",
		visible: true,
		persists: false
	},{
		name : "paragon",
		title: $I("resources.paragon.title"),
		type : "common",
		visible: true,
		color: "#6141CD",
		persists: true
	},{
		name : "burnedParagon",
		title : $I("resources.burnedParagon.title"),
		type : "common",
		visible: true,
		color: "#493099",
		persists: true
	},{
		name : "timeCrystal",
		title: $I("resources.timeCrystal.title"),
		type : "common",
		visible: true,
		color: "#14CD61"/*,
		aiCanDestroy: true*/
	},{
		name : "sorrow",
		title: $I("resources.sorrow.title"),
		type : "common",
		visible: false,
		color: "black",
		persists: true //isn't wiped on game reset
	},{
		name : "relic",
		title: $I("resources.relic.title"),
		type : "exotic",
		craftable: false,
		visible: true,
		color: "#5A0EDE",
		calculatePerDay: true,
		/*style: {
			         animation : "neon-purple 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-purple 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-purple 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-purple 1.5s ease-in-out infinite alternate"
		}*//*,
		aiCanDestroy: true*/
	},{
		name : "void",
		title: $I("resources.void.title"),
		type : "exotic",
		craftable: false,
		visible: true,
		color: "#5A0EDE",
		/*style: {
			         animation : "neon-purple 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-purple 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-purple 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-purple 1.5s ease-in-out infinite alternate"
		}*/
	},{
		name : "elderBox",
		title: $I("resources.elderBox.title"),
		description: $I("resources.elderBox.desc"),
		type : "exotic",
		craftable: false,
		visible: true,
		color: "#FA0EDE",
		/*style: {
			         animation : "neon-pink 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-pink 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-pink 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-pink 1.5s ease-in-out infinite alternate"
		},*/
		persists: true
	},{
		name : "wrappingPaper",
		title: $I("resources.wrappingPaper.title"),
		type : "exotic",
		craftable: false,
		visible: true,
		color: "#FA0EDE",
		/*style: {
			         animation : "neon-pink 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-pink 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-pink 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-pink 1.5s ease-in-out infinite alternate"
		},*/
		persists: true
	},{
		name : "blackcoin",
		title: $I("resources.blackcoin.title"),
		type : "exotic",
		craftable: false,
		visible: true,
		color: "gold"
		/*style: {
			         animation : "neon-gold 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-gold 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-gold 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-gold 1.5s ease-in-out infinite alternate"
		}*/
	},
	{
		name: "bloodstone",
		title: $I("resources.bloodstone.title"),
		type : "exotic",
		craftable: true,
		visible: true,
		color: "red"
		/*style: {
			         animation : "neon-red 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-red 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-red 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-red 1.5s ease-in-out infinite alternate"
		}*/
	},
	{
		name: "tMythril",
		title: $I("resources.tMythril.title"),
		type : "exotic",
		transient: true,
		calculatePerTick: true,
		craftable: true,
		visible: true,
		color: "#00e6b8"
		/*style: {
			         animation : "neon-red 1.5s ease-in-out infinite alternate",
			"-webkit-animation": "neon-red 1.5s ease-in-out infinite alternate",
			   "-moz-animation": "neon-red 1.5s ease-in-out infinite alternate",
			     "-o-animation": "neon-red 1.5s ease-in-out infinite alternate"
		}*/
	},
	//=========================================
	// 				    CRAFT
	//=========================================
	{
		name : "beam",
		title: $I("resources.beam.title"),
		type : "common",
		craftable: true
	},{
		name : "slab",
		title: $I("resources.slab.title"),
		type : "common",
		craftable: true
	},{
		name : "plate",
		title: $I("resources.plate.title"),
		type : "common",
		craftable: true,
		tag: "metallurgist"
	},{
		name : "steel",
		title: $I("resources.steel.title"),
		type : "common",
		craftable: true,
		visible: false,
		color: "gray",
		calculatePerTick: true,
		tag: "metallurgist"
	},{
		name : "concrate",
		title: $I("resources.concrate.title"),
		type : "common",
		craftable: true,
		tag: "chemist"
	},{
		name : "gear",
		title: $I("resources.gear.title"),
		type : "common",
		craftable: true,
		color: "gray",
		tag: "metallurgist"
	},{
		name : "alloy",
		title: $I("resources.alloy.title"),
		type : "common",
		craftable: true,
		visible: false,
		color: "gray",
		tag: "metallurgist"
	},{
		name : "eludium",
		title: $I("resources.eludium.title"),
		type : "common",
		craftable: true,
		visible: false,
		color: "darkViolet",
		tag: "chemist"
	},{
		name : "scaffold",
		title: $I("resources.scaffold.title"),
		type : "common",
		craftable: true,
		color: "#FF7F50"
	},{
		name : "ship",
		title: $I("resources.ship.title"),
		type : "common",
		craftable: true,
		color: "#FF571A"
	},{
		name : "tanker",
		title: $I("resources.tanker.title"),
		type : "common",
		craftable: true,
		color: "#CF4F20"
	},{
        name: "kerosene",
        title: $I("resources.kerosene.title"),
        type: "common",
        craftable: true,
        color: "olive",
		isNotRefundable: true,
		tag: "chemist"
	},{
		name : "parchment",
		title: $I("resources.parchment.title"),
		type : "common",
		craftable: true,
		color: "#DF01D7"
	},{
		name : "manuscript",
		title: $I("resources.manuscript.title"),
		type : "common",
		craftable: true,
		color: "#01A9DB",
		calculatePerTick: true
	},{
		name : "compedium",
		title: $I("resources.compedium.title"),
		type : "common",
		craftable: true,
		color: "#01A9DB"
	},{
		name : "blueprint",
		title: $I("resources.blueprint.title"),
		type : "common",
		transient: true,
		visible: true,
		craftable: true,
		color: "#01A9DB"
	},{
		name : "thorium", //divinite
		title: $I("resources.thorium.title"),
		type : "common",
		visible: true,
		craftable: true,
		color: "#4EA24E",
		calculatePerTick: true,
		isNotRefundable: true,
		tag: "chemist"
	},{
		name : "megalith",
		title: $I("resources.megalith.title"),
		type : "common",
		craftable: true,
		color: "gray"
    }
    ],

	resources: null,
	village: null,
	game: null,

	energyProd: 0,
	energyWinterProd: 0,
	energyCons: 0,

	isLocked: false,
	showHiddenResources: false, //Whether to show stuff like flux, gflops, & pseudo-resources
	hiddenPseudoResources: null, //Array of names of pseudo-resources to mark as hidden

	constructor: function(game){
		this.game = game;

		this.resources = [];
		this.resourceMap = {};

		this.hiddenPseudoResources = [];

		for (var i = 0; i < this.resourceData.length; i++){
			var res = dojo.clone(this.resourceData[i]);
			res.value = 0;
			res.unlocked = false;
			if (!res.isRefundable) {
				res.isRefundable = function(game) {
					return !this.isNotRefundable;
				};
			}
			this.resources.push(res);
			this.resourceMap[res.name] = res;
		}
	},

	get: function(name){
		var res = this.resourceMap[name];
		// for (var i = 0; i < this.resources.length; i++){
		// 	var res = this.resources[i];
		// 	if (res.name == name){
		// 		return res;
		// 	}
		// }

		//if no resource found, return false
		return res ? res : false;
	},

	//put your custom fake resources there
	getPseudoResources: function(){
		var pactsManager = this.game.religion.pactsManager;
		var pseudoResArr = [
			{
				name: "worship",
				title: $I("resources.worship.title"),
				value: this.game.religion.faith,
				unlocked: this.game.religion.faith > 0,
				visible: false //Doesn't normally appear in resource table
			},
			{
				name: "epiphany",
				title: $I("resources.epiphany.title"),
				value: this.game.religion.faithRatio,
				unlocked: this.game.religion.faithRatio > 0 &&
				          this.game.science.get("theology").researched &&
				          !this.game.challenges.isActive("atheism"),
				visible: false
			},
			{
				name: "necrocornDeficit",
				title: $I("resources.necrocornDeficit.title"),
				value: pactsManager.necrocornDeficit,
				maxValue: pactsManager.fractureNecrocornDeficit,
				unlocked: pactsManager.necrocornDeficit > 0 ||
					//Do we have at least 1 pact purchased?
					pactsManager.pacts.some(function(pact) {
						return pact.val > 0;
					}),
				visible: false,
				color: "#E00000"}
		];
		//Apply settings to mark as hidden:
		for (var i = 0; i < pseudoResArr.length; i += 1) {
			pseudoResArr[i].isHidden = this.hiddenPseudoResources.includes(pseudoResArr[i].name);
		}
		return pseudoResArr;
	},

	createResource: function(name){
		var res = {
			name: name,
			value: 0,

			//whether resource was marked by user as hidden or visible
			isHidden: false,

			unlocked: false
		};
		if (name == "wood") {
			//Wood is displayed as both a normal & a crafted resource.
			res.isHiddenFromCrafting = false;
		}
		return res;
	},

	addRes: function(res, addedValue, allowDuringParadoxes, preventLimitCheck) {
		if (this.game.calendar.day < 0 && !allowDuringParadoxes || addedValue == 0) {
			return 0;
		}

		var prevValue = res.value || 0;
		res.value = Math.min(prevValue + addedValue, Number.MAX_VALUE);
		if (!preventLimitCheck) {
			//if already overcap, allow to remain that way unless removing resources.
			var limit = Math.max(prevValue, res.maxValue || Number.MAX_VALUE);
			res.value = Math.min(res.value, limit);
		}

		if (res.name == "void") { // Always an integer
			res.value = Math.floor(res.value);
		}

		if (isNaN(res.value) || res.value < 0.0000000001){
			res.value = 0;	//safe switch
		}

		if (res.name == "karma"){
			this.game.karmaKittens = Math.round(this.game.getInverseUnlimitedDR(res.value, 5));
			res.value = this.game.getUnlimitedDR(this.game.karmaKittens, 5);
		}

		return res.value - prevValue;
	},

	addResPerTick: function(name, value){
		return this.addRes(this.get(name), value, false);
	},

	addResEvent: function(name, value){
		return this.addRes(this.get(name), value, true);
	},

	/**
	 * Format of from:
	 * [ {res: "res1", amt: x1}, {res: "res2", amt: x2} ]
	 * amt in the from array sets ratios between resources
	 * The second amt parameter is the maximum number of times to convert
	 */
	getAmtDependsOnStock: function(from, amt){
		if (amt == 0) {
			return 0;
		}

		var amtBeginni = amt;

		// Cap amt based on available resources
		// amt can decrease for each resource
		for (var i = 0, length = from.length; i < length; i++){
			var resAvailable = this.get(from[i].res).value;
			var resNeeded = from[i].amt * amt;
			if (resAvailable < resNeeded){
				var amtAvailable = resAvailable / from[i].amt;
				amt = Math.min(amt, amtAvailable);
			}
			else {
				// amtAvailable is amt
			}
		}

		// Remove from resources now to calculate others actions with updated resources
		for (var i in from) {
			this.addResPerTick(from[i].res, -from[i].amt * amt);
		}

		// Return the percentage to decrease the productivity
		return amt / amtBeginni;
	},

	/**
	 * Iterates resources and updates their values with per tick increment
	 */
	update: function(){

		var game = this.game;

		for (var i in this.resources){
			var res = this.resources[i];
			this.updateMaxValue(res);

			if (res.name == "sorrow"){
				continue;
			}
			if (res.name == "spice") { //This is a hack, will probably have to come up with a better system for this later
				var now = new Date();
				if (now.getMonth() == 9 && game.colorScheme == "spooky" && i18nLang.getLanguage() == "en") {
					res.title = $I("resources.spice.title.october");
				} else {
					res.title = $I("resources.spice.title");
				}
			}

			if (res.unlocked == false && res.value > 0){
				res.unlocked = true;
			} else if (res.value == 0 && res.unlocked == true) {
				if (res.name == "zebras" ||
					res.name == "paragon" ||
					res.name == "elderBox"){
					res.unlocked = false;
				}
			}

			var resPerTick = game.getResourcePerTick(res.name, false);
			this.addResPerTick(res.name, resPerTick);

		}
		game.updateKarma();

		//--------
		var energyProdRatio = this.getEnergyProductionRatio();
		this.energyProd = game.getEffect("energyProduction") * energyProdRatio;
		this.energyWinterProd = this.energyProd;
		var energyConsRatio = this.getEnergyConsumptionRatio();
		this.energyCons = game.getEffect("energyConsumption") * energyConsRatio;

		var currentSeason = game.calendar.season;
		var solarFarm = game.bld.getBuildingExt("pasture");
		var calculateEnergyProduction = solarFarm.get("calculateEnergyProduction");
		if (currentSeason != 3 && calculateEnergyProduction) {
			var energyLoss = calculateEnergyProduction(game, currentSeason) - calculateEnergyProduction(game, 3);
			this.energyWinterProd -= solarFarm.get("on") * energyLoss * energyProdRatio;
		}
	},

	/**
	 * Updates the storage limit for a given resource.
	 * @param res The resource object to be updated.
	 */
	updateMaxValue: function(res) {
		var game = this.game;
		if (res.name == "sorrow"){
			res.maxValue = 17 + (game.getEffect("blsLimit") || 0);
			res.value = Math.min(res.value, res.maxValue);
			return;
		}

		var maxValue = game.getEffect(res.name + "Max") || 0;

		maxValue = Math.min(this.addResMaxRatios(res, maxValue), Number.MAX_VALUE);
		
		var challengeEffect = this.game.getEffect(res.name + "MaxChallenge");
		if(challengeEffect){
			// Negative effect, no need to cap again to Number.MAX_VALUE
			challengeEffect = this.game.getLimitedDR(this.addResMaxRatios(res, challengeEffect), maxValue - 1 - game.bld.effectsBase[res.name +'Max']||0);
			maxValue += challengeEffect;
		}

		res.maxValue = Math.max(maxValue, 0);
	},

	/**
	 * Updates the storage limit for a given resource.
	 * @param resName The name of the resource to be updated.
	 */
	updateMaxValueByName: function(resName) {
		this.updateMaxValue(this.get(resName));
	},

	//All energy production amounts are multiplied by this number.
	getEnergyProductionRatio: function() {
		var game = this.game;
		return 1 + game.getEffect("energyProductionRatio");
	},

	//All energy consumption amounts are multiplied by this number.
	getEnergyConsumptionRatio: function() {
		var game = this.game;
		//LDR for the effect named "energyConsumptionRatio" is specified in challenges.js
		return (1 + game.getEffect("energyConsumptionRatio") + game.getEffect("energyConsumptionIncrease")) *
				(game.challenges.isActive("energy") ? 2 : 1);
	},

	//NB: don't forget to update resources before calling in redshift
	fastforward: function(daysOffset) {
		// Since workshop requires some resource and we don't want exhaust all resources during workshop so we need a way to consume them.
		// Idea: relax resource limits temporarily, load the resource and do workshop, after that enforce limits again.
		var limits = {};
		for (var i in this.resources) {
			var res = this.resources[i];
			if (res.perTickCached && (res.name != "catnip" || res.perTickCached >= 0)) {
				if (res.maxValue) {
					limits[res.name] = Math.max(res.value, res.maxValue);
				}
				//console.log("Adjusting resource", res.name, "delta",res.perTickCached, "max value", res.maxValue, "days offset", daysOffset);
				//console.log("resource before adjustment:", res.value);
				this.addRes(res, res.perTickCached * daysOffset * this.game.calendar.ticksPerDay, true/*allowDuringParadoxes*/, true/*preventLimitCheck*/);
				//console.log("resource after adjustment:", res.value);
			}
		}
		return limits;
	},

	enforceLimits: function(limits) {
		for (var i in this.resources) {
			var res = this.resources[i];
			if (res.maxValue) {
				var limit = limits[res.name];
				if (limit) {
					res.value = Math.min(res.value, limit);
				}
			}
		}
	},

	//Hack to reach the maxValue in resTable
	//AB: Questionable
	resConsHackForResTable: function() {
		if( this.game.calendar.day >= 0) {
			for (var i in this.resources){
				var res = this.resources[i];
				if (res.maxValue) {
					var perTickConvertion = this.game.getResourcePerTickConvertion(res.name);
					if (perTickConvertion < 0) {
						if (this.game.getResourcePerTick(res.name, true) > 0 && res.maxValue + perTickConvertion <= res.value) {
							res.value += -perTickConvertion;
						}
					}
				}
			}
		}
	},

	/**
	 * Multiplies applicable resMax effects by barnRatio and warehouseRatio
	 * (is there a better name for it?)
	 */
	addBarnWarehouseRatio: function(effects){
		var newEffects = {};
		var barnRatio = this.game.getEffect("barnRatio");
		var warehouseRatio = 1 + this.game.getEffect("warehouseRatio");
		for (var name in effects){
			var effect = effects[name];

			if (name === "catnipMax" && this.game.workshop.get("silos").researched){
				effect *= 1 + barnRatio * 0.25;
			}

			if (name == "woodMax" || name == "mineralsMax" || name == "ironMax"){	//that starts to look awful
				effect *= 1 + barnRatio;
				effect *= warehouseRatio;
			}

			if (name == "coalMax" || name == "titaniumMax" || name == "goldMax"){
				effect *= warehouseRatio;
			}
			newEffects[name] = effect;
		}
		return newEffects;
	},

	/**
	 * Multiplies maxValue by global ratios
	 * Called in tooltips for more accurate per-building resMax increases
	 */
	addResMaxRatios: function(res, maxValue) {
		if (res.name == "temporalFlux") {
			return maxValue;
		}

		//Unicorn Tears Challenge:
		if (this.game.challenges.isActive("unicornTears")) {
			if (res.name == "unicorns" || res.name == "tears" || res.name == "alicorn") {
				maxValue *= 1 + this.game.getEffect(res.name + "MaxRatio");
				return maxValue;
			}
		}

		maxValue *= 1 + this.game.prestige.getParagonStorageRatio();

		//+COSMIC RADIATION
		if (!this.game.opts.disableCMBR) {
			maxValue *= 1 + this.game.getCMBRBonus();
		}

		//Stuff for Refrigiration and (potentially) similar effects
		maxValue *= 1 + this.game.getEffect(res.name + "MaxRatio");

		if (!this.isNormalCraftableResource(res) && !res.transient) {
			maxValue *= 1 + this.game.getEffect("globalResourceRatio");
		}
		//pacts effect
		if (!this.isNormalCraftableResource(res) && !res.transient) {
			var pyramidModifier = this.game.getEffect("pyramidGlobalResourceRatio");
			/*if(pyramidModifier < 0){
				pyramidModifier = -this.game.getLimitedDR(-pyramidModifier * 1000, 1000)/1000
			}*/
			maxValue *= 1 + pyramidModifier;
		}
		if (res.tag == "baseMetal") {
			maxValue *= 1 + this.game.getEffect("baseMetalMaxRatio");
		}
		
        //policies
		//technocracy policy bonus
		if(res.name == "science"){
			maxValue *= (1 + this.game.getEffect("technocracyScienceCap"));
		}

        //city on a hill bonus
        if(res.name == "culture"){
            maxValue *= (1 + this.game.getEffect("onAHillCultureCap"));
        }
		return maxValue;
	},

	setVillage: function(village){
		this.village = village;
	},

	reset: function(){
		this.resources = [];
	},

	resetState: function(){
		this.isLocked = false;
		this.showHiddenResources = false;
		this.hiddenPseudoResources = [];
		for (var i = 0; i < this.resources.length; i++){
			var res = this.resources[i];
			res.value = 0;
			res.maxValue = 0;
			res.perTickCached = 0;
			res.unlocked = false;
			res.isHidden = false;

			if (res.name == "wood") {
				res.isHiddenFromCrafting = false;
			}
		}
	},

	save: function(saveData){
		saveData.res = {
			isLocked: this.isLocked,
			showHiddenResources: this.showHiddenResources || undefined
		};
		//Save flags on which pseudo-resources to hide
		//But for sanity purposes, only save a pseudo-resource if it actually exists!
		var pseudoResources = this.getPseudoResources();
		for (var i = 0; i < pseudoResources.length; i += 1) {
			var resName = pseudoResources[i].name;
			if (this.hiddenPseudoResources.includes(resName)) {
				//We've found a legit pseudo-resource to be marked as hidden
				if (!saveData.res.hiddenPseudoResources) {
					saveData.res.hiddenPseudoResources = [];
				}
				saveData.res.hiddenPseudoResources.push(resName);
			}
		}
	},

	load: function(saveData){
		this.loadMetadata(this.resources, saveData.resources);

		if (saveData.res){
			this.isLocked = Boolean(saveData.res.isLocked);
			this.showHiddenResources = Boolean(saveData.res.showHiddenResources);
			this.hiddenPseudoResources = saveData.res.hiddenPseudoResources || [];
		}
	},

	/**
	 * Returns true if user has enough resources to construct AMT building with given price
	 */
	hasRes: function(prices, amt){
		if (!amt){
			amt = 1;
		}

		var hasRes = true;
		if (prices.length){
			for( var i = 0; i < prices.length; i++){
				var price = prices[i];

				var res = this.get(price.name);
				if (res.value < (price.val * amt)){
					hasRes = false;
					break;
				}
			}
		}
		return hasRes;
	},

	/**
	 * Returns true if any price is limited by maxValue
	 */
	isStorageLimited: function(prices){
		if (prices && prices.length){
			for (var i = 0; i < prices.length; i++){
				var price = prices[i];

				var res = this.get(price.name);
				if (price.val == Infinity || res.maxValue > 0 && price.val > res.maxValue && price.val > res.value){
					return true;
				}
				if (res.craftable && price.val > res.value){ //account for chronosphere resets etc
					var craft = this.game.workshop.getCraft(res.name);
					if (craft.unlocked && craft.isLimited){
						return true;
					}
				}
			}
		}
		return false;
	},

	payPrices: function(prices){
		if (prices.length){
			for( var i = 0; i < prices.length; i++){
				var price = prices[i];
				this.addResEvent(price.name, -price.val);
			}
		}
	},

	maxAll: function(){
		for(var i = 0; i < this.resources.length; i++){
			var res = this.resources[i];
			if (res.maxValue && res.value < res.maxValue){
				res.value = res.maxValue;
			}
		}
	},

    getEnergyDelta: function(){
		if (this.energyCons == 0) {
			return 0;
		} else {
			var delta = this.energyProd / this.energyCons;
			if (delta < 0.25){
				delta = 0.25;
			}
			if (this.game.challenges.getChallenge("energy").researched && !this.game.challenges.isActive("energy")) {
				delta = 1 - (1 - delta) / 2;
			}
		return delta;
		}
    },

    getVoidQuantity: function() {
		// -1, 0, 1, 2 at start, 0.5 on average
		return this.game.rand(this.game.getEffect("temporalParadoxVoid") + 4) - 1;
    },

    // getVoidQuantity is good for day -by day evaluation but it cannot be used for redshift which requires statistical distribution over large number of days
    // The values range of getVoidQuantity is: -1, 0, 1, 2 .. n, where n is (2 + temporalParadoxVoid) . The values are  equally distributed so we can get a median out of them. (-1 + n) /2
    getVoidQuantityStatistically: function() {
		return (this.game.getEffect("temporalParadoxVoid") + 1) / 2 ;
    },

	setDisplayAll: function() {
		for(var i = 0; i < this.resources.length; i++){
			var res = this.resources[i];
			res.isHidden = false;
			if (res.name == "wood") {
				res.isHiddenFromCrafting = false;
			}
		}
	},

	//Sets the "isHidden" flag of a resource or a pseudo-resource.
	//This exists because the UI code can't know if a resource is real or pseudo.
	//Wood is a special case because it has 2 flags.  We don't handle that special case here.
	setResourceIsHidden: function(resName, hide) {
		if (typeof(resName) != "string") {
			console.error("Can't set res.isHidden; resource name must be a string.");
			return;
		}
		if (typeof(hide) != "boolean") {
			console.error("Can't set res.isHidden; flag must be a boolean.");
			return;
		}

		var res = this.get(resName);
		if (res) {
			//We have a real resource!
			res.isHidden = hide;
			return;
		}
		//Else, assume we're dealing with a pseudo-resource.
		if (this.hiddenPseudoResources.includes(resName)) {
			if (!hide) {
				//Remove by value
				this.hiddenPseudoResources = this.hiddenPseudoResources.filter(function(elem) {
					return elem != resName;
				});
			}
		} else {
			//Pseudo-resource is not already in array.
			if (hide) {
				this.hiddenPseudoResources.push(resName);
			}
		}
	},

	toggleLock: function(){
		this.isLocked = !this.isLocked;
	},

	isNormalCraftableResource: function(res) {
		return res.craftable && res.name != "wood";
	}

});

