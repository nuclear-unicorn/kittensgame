/**
 * Diplomacy
 */
dojo.declare("classes.managers.DiplomacyManager", null, {

	game: null,

	races: [{
		name: "lizards",
		title: $I("trade.race.lizards"),
		attitude: "friendly",	//neutral, friendly, hostile
		standing: 0.25,			//chance of trade success, works differently based on attitude
		unlocked: false,
		buys: [
			{name: "minerals", val: 1000}
		],
		sells:[
			{name: "wood", value: 500, chance: 100, delta: 0.08, seasons:{
				"spring": 0.95,
				"summer": 1.35,
				"autumn": 1.15,
				"winter": 1.05
			}}
		],
		collapsed: false
	},{
		name: "sharks",
		title: $I("trade.race.sharks"),
		attitude: "neutral",
		unlocked: false,
		buys: [
			{name: "iron", val: 100}
		],
		sells:[
			{name: "catnip", value: 35000, chance: 100, delta: 0.15, seasons:{
				"spring": 1.20,
				"summer": 0.95,
				"autumn": 1.15,
				"winter": 1.45
			}}
		],
		collapsed: false
	},{
		name: "griffins",
		title: $I("trade.race.griffins"),
		attitude: "hostile",
		standing: 0.85,
		unlocked: false,
		buys: [
			{name: "wood", val: 500}
		],
		sells:[
			{name: "iron", value: 250, chance: 100, delta: 0.12, seasons:{
				"spring": 0.75,
				"summer": 0.95,
				"autumn": 1.35,
				"winter": 0.80
			}}
		],
		collapsed: false
	},{
		name: "nagas",
		title: $I("trade.race.nagas"),
		attitude: "neutral",
		hidden: true,
		unlocked: false,
		buys: [
			{name: "ivory", val: 500}
		],
		sells:[
			{name: "minerals", value: 1000, chance: 100, delta: 0.18, seasons:{
				"spring": 1.25,
				"summer": 1.05,
				"autumn": 0.65,
				"winter": 0.95
			}}
		],
		collapsed: false
	},{
		name: "zebras",
		hidden: true,
		title: $I("trade.race.zebras"),
		attitude: "hostile",
		standing: 0.7,			//evil little bastards
		unlocked: false,
		buys: [
			{name: "slab", val: 50}
		],
		sells:[
			{name: "iron", value: 300, chance: 100, delta: 0.08, seasons:{
				"spring": 1.00,
				"summer": 1.15,
				"autumn": 0.90,
				"winter": 0.80
			}},
			{name: "plate", value: 2, chance: 65, delta: 0.25, seasons:{
				"spring": 1.05,
				"summer": 0.85,
				"autumn": 1.05,
				"winter": 1.25
			}},
			{name: "titanium", value: 1, chance: 0, delta: 0, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}}
		],
		collapsed: false
	},{
		name: "spiders",
		hidden: true,
		title: $I("trade.race.spiders"),
		attitude: "friendly",
		standing: 0.15,			//friendly, but not much
		unlocked: false,
		buys: [
			{name: "scaffold", val: 50}
		],
		sells:[
			{name: "coal", value: 350, chance: 100, delta: 0.15, seasons:{
				"spring": 1.00,
				"summer": 1.05,
				"autumn": 1.15,
				"winter": 0.95
			}},
		],
		collapsed: false
	},{
		name: "dragons",
		hidden: true,
		title: $I("trade.race.dragons"),
		attitude: "neutral",
		standing: 0.25,
		unlocked: false,
		buys: [
			{name: "titanium", val: 250}
		],
		sells:[
			{name: "uranium", value: 1, chance: 95, delta: 0.25, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}}
		],
		collapsed: false
	},{
        name: "leviathans",
		hidden: true,
		title: $I("trade.race.leviathans"),
		energy: 0,
		attitude: "neutral",
		standing: 0.15,
		unlocked: false,
        duration: 0,
		buys: [
			{name: "unobtainium", val: 5000}
		],
		sells:[
			{name: "timeCrystal", value: 0.25, chance: 98, delta: 0.15, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}},
			{name: "sorrow", value: 1, chance: 15, delta: 0.1, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}},
            {name: "starchart", value: 250, chance: 50, delta: 0.8, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}},
			{name: "relic", value: 1, chance: 5, delta: 0, seasons:{
				"spring": 1,
				"summer": 1,
				"autumn": 1,
				"winter": 1
			}}
		],
		collapsed: false
    }],

	constructor: function(game){
		this.game = game;
	},

	get: function(raceName){
		for( var i = 0; i< this.races.length; i++){
			if (this.races[i].name == raceName){
				return this.races[i];
			}
		}
		console.error("Failed to get race for id '"+raceName+"'");
		return null;
	},

	getTradeRatio: function() {
		return this.game.getEffect("tradeRatio") + this.game.village.getEffectLeader("merchant", 0);
	},

	resetState: function(){
		for (var i = 0; i < this.races.length; i++){
			var race = this.races[i];
			race.unlocked = false;
			race.collapsed = false;
			race.energy = 0;
			race.duration = 0;
		}
	},

	save: function(saveData){
		saveData.diplomacy = {
			races: this.game.bld.filterMetadata(this.races, ["name", "unlocked", "energy", "duration", "collapsed"])
		};
	},

	load: function(saveData){
		if (saveData.diplomacy) {
			this.game.bld.loadMetadata(this.races, saveData.diplomacy.races);
		}
	},

	hasUnlockedRaces: function(){
		for (var i = 0; i< this.races.length; i++){
			if (this.races[i].unlocked){
				return true;
			}
		}
		return false;
	},

	unlockRandomRace: function(){
		var unmetRaces = [];
		var hasLockedHiddenRaces = false;

		for (var i = 0; i< this.races.length; i++){
			if (!this.races[i].unlocked ){
				if (!this.races[i].hidden){
					unmetRaces.push(this.races[i]);
				}else{
					hasLockedHiddenRaces = true;
				}
			}
		}

		if (!unmetRaces.length && !hasLockedHiddenRaces){
			return null;
		}

		//nagas like highly cultural kittens :3
		var nagas = this.get("nagas");
		if (!nagas.unlocked && this.game.resPool.get("culture").value >= 1500){
			nagas.unlocked = true;
			return nagas;
		}

		var zebras = this.get("zebras");
		if (!zebras.unlocked && this.game.resPool.get("ship").value >= 1){
			zebras.unlocked = true;
			this.game.workshop.get("caravanserai").unlocked = true;
			return zebras;
		}

		var spiders = this.get("spiders");
		if (!spiders.unlocked && this.game.resPool.get("ship").value >= 100 && this.game.resPool.get("science").maxValue > 125000){
			spiders.unlocked = true;
			return spiders;
		}

		var dragons = this.get("dragons");
		if (!dragons.unlocked && this.game.science.get("nuclearFission").researched){
			dragons.unlocked = true;
			return dragons;
		}

		var raceId = (Math.floor(Math.random()*unmetRaces.length));

		if (unmetRaces[raceId]){	//someone reported a bug there, to be investigated later
			unmetRaces[raceId].unlocked = true;
			return unmetRaces[raceId];
		}
		return null;
	},

	update: function(){
		if (!this.hasUnlockedRaces()){

			var unlockYear = 20;
			if (this.game.karmaKittens > 0 ){
				unlockYear = 5;
			}
			if (this.game.prestige.getPerk("diplomacy").researched){
				unlockYear = 1;
			}

			if (this.game.calendar.year < unlockYear){
				return;
			}

			var race = this.unlockRandomRace();

			this.game.diplomacyTab.visible = true;
			this.game.render();

			this.game.msg($I("trade.msg.emissary", [race.title]), "notice");
		}
	},
    //------------ IDK, silly gimmickish stuff -----------
    unlockElders : function(){
        var elders = this.get("leviathans");
		if (elders.duration){	//elder visits do not stack
			return;
		}

        elders.unlocked = true;
        elders.duration += this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear *  (5  + elders.energy);	//5 years + 1 per energy unit

        this.game.msg($I("trade.msg.elders"), "notice");
    },

    onNewDay: function(){
        var elders = this.get("leviathans");
        if (elders.duration <= 0  && elders.unlocked){
			elders.unlocked = false;
			this.game.msg($I("trade.msg.elders.departed"), "notice");

			this.game.render();

			return;
		}
        if (elders.duration > 0){
            elders.duration--;
        }
	},

	tradeImpl: function(race, totalTradeAmount) {
		var printMessages = (totalTradeAmount == 1);
		var standingRatio = this.game.getEffect("standingRatio");
		
		if (this.game.prestige.getPerk("diplomacy").researched) {
			standingRatio += 10;
		}

		var tradeFailProbability = race.attitude === "hostile" ? (1 - race.standing - standingRatio / 100) : 0;
		var failedTradeAmount =  this.game.math.binominalRandomInteger(totalTradeAmount, tradeFailProbability);
		var successfullTradeAmount = totalTradeAmount - failedTradeAmount;

		if (successfullTradeAmount == 0) {
			if (printMessages) {
				this.game.msg($I("trade.msg.trade.failure", [race.title]) , null, "trade");
			}

			return;
		}

		if (race.name == "leviathans") {
			//reset energy to default limit
			race.duration = Math.min(race.duration, this.game.calendar.daysPerSeason * (this.game.calendar.seasonsPerYear + race.energy));
		}

		var bonusSuccessProbability = race.attitude === "friendly" ? (race.standing + standingRatio / 2 / 100) : 0;
		var bonusTradeAmount =  this.game.math.binominalRandomInteger(totalTradeAmount, bonusSuccessProbability);
		var normalTradeAmount = successfullTradeAmount - bonusTradeAmount;

		if (bonusTradeAmount > 0) {
			if (printMessages){
				this.game.msg($I("trade.msg.trade.success", [race.title]), null, "trade");
			}
		}

		var boughtResourceCollection = {},
			bonusTradeRatio = 1.25,
			tradeRatio = 1 + this.game.diplomacy.getTradeRatio(),
			raceRatio = race.name === "leviathans" ? (1 + 0.02 * race.energy) : 1,
			currentSeason = this.game.calendar.getCurSeason().name;

		for(var i = 0; i < race.sells.length; i++){
			var sellResource = race.sells[i];
			var resourcePassedBonusTradeAmount = this.game.math.binominalRandomInteger(bonusTradeAmount, sellResource.chance / 100),
				resourcePassedNormalTradeAmount = this.game.math.binominalRandomInteger(normalTradeAmount, sellResource.chance / 100);

			if (resourcePassedBonusTradeAmount + resourcePassedNormalTradeAmount == 0) {
				continue;
			}

			var resourceSeasonTradeRatio = sellResource.seasons[currentSeason];
			var normalizedBoughtAmount = (1 - sellResource.delta / 2) * resourcePassedNormalTradeAmount +
				sellResource.delta * this.game.math.irwinHallRandom(resourcePassedNormalTradeAmount);
			var normalizedBonusBoughtAmount = (1 - sellResource.delta / 2) * resourcePassedBonusTradeAmount +
				sellResource.delta * this.game.math.irwinHallRandom(resourcePassedBonusTradeAmount);
			var boughtAmount = (normalizedBoughtAmount + normalizedBonusBoughtAmount * bonusTradeRatio) * sellResource.value *
				resourceSeasonTradeRatio * tradeRatio * raceRatio;

			boughtResourceCollection[sellResource.name] = boughtAmount;
		}

		//-------------------- 35% chance to get spice ------------------
		var spiceTradeAmount = this.game.math.binominalRandomInteger(successfullTradeAmount, 0.35);
		boughtResourceCollection["spice"] = 25 * spiceTradeAmount +
			50 * this.game.math.irwinHallRandom(spiceTradeAmount) * tradeRatio;

		//-------------- 10% chance to get blueprint ---------------
		var blueprintTradeAmount = Math.floor(this.game.math.binominalRandomInteger(successfullTradeAmount, 0.1));
		boughtResourceCollection["blueprint"] = blueprintTradeAmount;

		//-------------- 15% + 0.35% chance per ship to get titanium ---------------
		if (race.name === "zebras") {
			var shipAmount = this.game.resPool.get("ship").value,
				titaniumProbability = 0.15 + shipAmount * 0.0035,
				titaniumRatio = 1 + (shipAmount / 100) * 2, // 2% more titanium per ship
				titaniumTradeAmount = this.game.math.binominalRandomInteger(successfullTradeAmount, titaniumProbability);

			boughtResourceCollection["titanium"] = 1.5 * titaniumRatio * titaniumTradeAmount;
		}

		//Update Trade Stats
		this.game.stats.getStat("totalTrades").val += successfullTradeAmount;
		this.game.stats.getStatCurrent("totalTrades").val += successfullTradeAmount;

		return boughtResourceCollection;
	},

	trade: function(race){
		this.gainTradeRes(this.tradeImpl(race, 1), 1);
	},

	tradeMultiple: function(race, amt){
		//------------ safety measure ----------------
		if (!this.hasMultipleResources(race, amt)) {
			return;
		}

		//-------------- pay prices ------------------

		this.game.resPool.addResEvent("manpower", -50 * amt);
		this.game.resPool.addResEvent("gold", -15 * amt);
		this.game.resPool.addResEvent(race.buys[0].name, -race.buys[0].val * amt);

		//---------- calculate yield -----------------
		this.gainTradeRes(this.tradeImpl(race, amt), amt);
 	},

	hasMultipleResources: function(race, amt){
		return (this.game.resPool.get("manpower").value >= 50 * amt &&
			this.game.resPool.get("gold").value >= 15 * amt &&
			this.game.resPool.get(race.buys[0].name).value >= race.buys[0].val * amt);
	},

	tradeAll: function(race){
		this.tradeMultiple(race, this.getMaxTradeAmt(race));
	},

	/**
	 * Prints a formatted output of a trade results based on a resource map
	 */
	gainTradeRes: function(yieldResTotal, amtTrade){
		var output = false;
		if (yieldResTotal) {
			for (var res in yieldResTotal) {
				var amt = this.game.resPool.addResEvent(res, yieldResTotal[res]);
				if (amt > 0){
					if (res == "blueprint"){
						this.game.msg($I("trade.msg.resources", [this.game.getDisplayValueExt(amt), res]) + "!", "notice", "trade", true);
					} else if (res == "titanium"){
						this.game.msg($I("trade.msg.resources", [this.game.getDisplayValueExt(amt), res]) + "!", "notice", "trade", true);
					} else {
						var resPool = this.game.resPool.get(res);
						var name = resPool.title || res;
						this.game.msg($I("trade.msg.resources", [this.game.getDisplayValueExt(amt), name]), null, "trade", true);
					}
					output = true;
				}
			}
			//var orthographe = amtTrade > 1 ? "s" : "";
			this.game.msg($I("trade.msg.trade.caravan", [amtTrade]), null, "trade");
		}

		if (yieldResTotal && !output){
			this.game.msg($I("trade.msg.trade.empty"), null, "trade");
		}
	},

	getMaxTradeAmt: function(race){
		var amt = [
			Math.floor(this.game.resPool.get("manpower").value / 50),
			Math.floor(this.game.resPool.get("gold").value / 15),
			Math.floor(this.game.resPool.get(race.buys[0].name).value / race.buys[0].val)
		];
		var min = Number.MAX_VALUE;
		for (var i = 0; i < amt.length; i++){
			if (min > amt[i]) { min = amt[i]; }
		}

		if (min == Number.MAX_VALUE || min == 0){
			return;
		}

		return min;
	},

	feedElders: function(){
		var ncorns = this.game.resPool.get("necrocorn");
		var elders = this.game.diplomacy.get("leviathans");
		if (ncorns.value >= 1){
			elders.energy++;

			var markerCap = this.game.religion.getZU("marker").val * 5 + 5;
			if (elders.energy > markerCap){
				elders.energy = markerCap;
			}

			ncorns.value--;
			this.game.msg($I("trade.msg.elders.pleased"), "notice");
		} else {
			ncorns.value = 0;
			this.game.msg($I("trade.msg.elders.displeased"), "notice");
			elders.duration = 0;
		}
	},

	buyEcoin: function(){
		var amt = this.game.resPool.get("relic").value / this.game.calendar.cryptoPrice;
		this.game.resPool.get("blackcoin").value += amt;
		this.game.resPool.get("relic").value = 0;
		this.game.msg("You've bought " + this.game.getDisplayValueExt(amt) + " blackcoins");
	},

	sellEcoin: function(){
		var amt = this.game.resPool.get("blackcoin").value * this.game.calendar.cryptoPrice;
		this.game.resPool.get("relic").value += amt;
		this.game.resPool.get("blackcoin").value = 0;

		this.game.msg("You've got " + this.game.getDisplayValueExt(amt) + " relics");
	},

	unlockAll: function(){
		for (var i in this.races){
			this.races[i].unlocked = true;
		}
		this.get("leviathans").duration = 10000;
		this.game.msg("All trade partners are unlocked");
	}
});


dojo.declare("classes.diplomacy.ui.RacePanel", com.nuclearunicorn.game.ui.Panel, {
	tradeBtn: null,

	onToggle: function(isToggled){
		this.race.collapsed = isToggled;
	},

	update: function(){
		if (this.tradeBtn){
			this.tradeBtn.update();
		}
	}
});

dojo.declare("classes.diplomacy.ui.EldersPanel", classes.diplomacy.ui.RacePanel, {
	feedBtn: null,

	render: function(container){
		var content = this.inherited(arguments);

		var self = this;
		var feedBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("trade.msg.elders.feed"),
				description: $I("trade.msg.elders.feed.desc"),
				controller: new com.nuclearunicorn.game.ui.ButtonModernController(this.game),
				handler: function(){
					self.game.diplomacy.feedElders();
				}
			}, this.game);
		feedBtn.render(content);

		if (this.game.science.get("blackchain").researched || this.game.resPool.get("blackcoin").value > 0) {

			var buyEcoin = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("trade.buy.ecoin"),
				description: $I("trade.buy.ecoin.desc"),
				controller: new com.nuclearunicorn.game.ui.ButtonModernController(this.game),
				handler: function () {
					self.game.diplomacy.buyEcoin();
				}
			}, this.game);
			buyEcoin.render(content);
			this.buyEcoin = buyEcoin;

			var sellEcoin = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("trade.sell.ecoin"),
				description: $I("trade.sell.ecoin.desc"),
				controller: new com.nuclearunicorn.game.ui.ButtonModernController(this.game),
				handler: function () {
					self.game.diplomacy.sellEcoin();
				}
			}, this.game);
			sellEcoin.render(content);
			this.sellEcoin = sellEcoin;
		}

		this.feedBtn = feedBtn;
		return content;
	},

	update: function(){
		this.inherited(arguments);
		if (this.feedBtn){
			this.feedBtn.update();
		}

	}
});

dojo.declare("com.nuclearunicorn.game.ui.TradeButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.simplePrices = false;
		return result;
	}
});

//TODO Extract controller logic for this class
dojo.declare("com.nuclearunicorn.game.ui.TradeButton", com.nuclearunicorn.game.ui.ButtonModern, {

	race: null,

	trade25Href: null,
	trade100Href: null,
	tradeAllHref: null,

	constructor: function(opts, game){
		this.race = opts.race;

		this.handler = this.trade;	//weird hack
	},

	afterRender: function(){
		this.inherited(arguments);
		dojo.addClass(this.domNode, "trade");
	},

	renderLinks: function(){
		this.tradeAllHref = this.addLink($I("btn.all.minor"),
			function(){
				this.game.diplomacy.tradeAll(this.race);
			}
		);

		// 50% template
		this.tradeHalfHref = this.addLink("","");

		//20% template
		this.tradeFifthHref = this.addLink("","");
	},

	update: function(){
		this.inherited(arguments);

		var tradeMax = this.game.diplomacy.getMaxTradeAmt(this.race);

		// Update tradeHalfHref Link
		var tradeHalf = Math.floor(tradeMax / 2);
		// Change button innerHTML
		this.tradeHalfHref.link.innerHTML = "x" + this.game.getDisplayValueExt(tradeHalf, null, false, 0);
		// Change handler
		dojo.disconnect(this.tradeHalfHref.linkHandler);
		this.tradeHalfHref.linkHandler = dojo.connect(this.tradeHalfHref.link, "onclick", this, dojo.partial(function(event){
			event.stopPropagation();
			event.preventDefault();

			dojo.hitch(this,
				function(){
					this.game.diplomacy.tradeMultiple(this.race, tradeHalf);
				}
			, event)();

			this.update();
		}));
		// Change display
		dojo.style(this.tradeHalfHref.link, "display", this.game.diplomacy.hasMultipleResources(this.race, 50) ? "" : "none");

		// Update tradeFifthHref Link
		var tradeFifth = Math.floor(tradeMax / 5);
		// Change button innerHTML
		this.tradeFifthHref.link.innerHTML = "x" + this.game.getDisplayValueExt(tradeFifth, null, false, 0);
		// Change handler
		dojo.disconnect(this.tradeFifthHref.linkHandler);
		this.tradeFifthHref.linkHandler = dojo.connect(this.tradeFifthHref.link, "onclick", this, dojo.partial(function(event){
			event.stopPropagation();
			event.preventDefault();

			dojo.hitch(this,
				function(){
					this.game.diplomacy.tradeMultiple(this.race, tradeFifth);
				}
			, event)();

			this.update();
		}));
		// Change display
		dojo.style(this.tradeFifthHref.link, "display", this.game.diplomacy.hasMultipleResources(this.race, 25) ? "" : "none");

	}
});

dojo.declare("classes.trade.ui.SendExplorersButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.simplePrices = false;
		return result;
	},

	clickHandler: function(model, event){
		var dip = this.game.diplomacy;
		var race = dip.unlockRandomRace();

		if (race){
			this.game.msg($I("trade.new.civ"), "notice");
		} else {

			var hint = "";
			if (!dip.get("nagas").unlocked){
				hint = $I("trade.new.hint.nagas");
			} else if (!dip.get("zebras").unlocked){
				hint = $I("trade.new.hint.zebras");
			} else if (!dip.get("spiders").unlocked){
				hint = $I("trade.new.hint.spiders");
			} else if (!dip.get("dragons").unlocked){
				hint =  $I("trade.new.hint.dragons");
			} else {
				hint = $I("trade.new.hint.end");	//AHAHA NO
			}

			this.game.msg($I("trade.new.failure", [hint]));
			this.game.resPool.addResEvent("manpower", 950);
		}
		this.game.render();
	}
});

dojo.declare("classes.trade.ui.SendExplorersButton", com.nuclearunicorn.game.ui.ButtonModern, {

	afterRender: function(){
		this.inherited(arguments);

		dojo.addClass(this.domNode, "explore");
	}
});

//==================================================================================
//									DIPLOMACY
//==================================================================================

dojo.declare("com.nuclearunicorn.game.ui.tab.Diplomacy", com.nuclearunicorn.game.ui.tab, {

	racePanels: null,
	leviathansInfo: null,

	constructor: function(tabName, game){
		this.game = game;

		this.racePanels = [];
	},

	render: function(tabContainer){
		this.inherited(arguments);


		this.buttons = [];

		/*
		 * Once race panel is rendered, we will save the panels states.
		 *
		 * However races can be unlocked in random order, so once new race appear,
		 * we will clear array and reinitialise it again
		 */

		var races = [];
		for (var i = 0; i< this.game.diplomacy.races.length; i++){
			var race = this.game.diplomacy.races[i];
			if (race.unlocked){
				races.push(race);
			}
		}
		if (this.racePanels.length != races.length){
			this.racePanels = [];
		}

		var self = this;

		var div = dojo.create("div", { class: "expandAllBar", style: { float: "left"}}, tabContainer);
		dojo.create("span", { innerHTML: $I("trade.effectiveness", [this.game.getDisplayValueExt(this.game.diplomacy.getTradeRatio() * 100, false, false, 0)]) }, div);

		// expand all / collapse all panels

		var expandDiv = dojo.create("div", { class: "expandAllBar" }, tabContainer);



		var expandAll = dojo.create("a", { innerHTML: "Expand all", href: "#" }, expandDiv);
		dojo.create("span", { innerHTML: " | " }, expandDiv );
		var collapseAll = dojo.create("a", { innerHTML: "Collapse all", href: "#" }, expandDiv);

		for (var i = 0; i< races.length; i++){
			var race = races[i];
			if (!race.unlocked){
				continue;
			}

			var racePanel = this.racePanels[i];
			if (!racePanel){
				if (race.name === "leviathans") {
					racePanel = new classes.diplomacy.ui.EldersPanel(race.title+" <span class='attitude'>"+race.attitude+"</span>");
					racePanel.setGame(this.game);
				} else {
					racePanel = new classes.diplomacy.ui.RacePanel(race.title+" <span class='attitude'>"+race.attitude+"</span>");
				}
				this.racePanels.push(racePanel);
			}
			var content = racePanel.render(tabContainer);
			dojo.addClass(content, "trade-race");

			//---------- render stuff there -------------

			var leftColumn = dojo.create("div", {}, content);
			var rightColumn = dojo.create("div",{}, content);
			var clear = dojo.create("div",{}, content);
			dojo.addClass(leftColumn, "left");
			dojo.addClass(rightColumn, "right");
			dojo.addClass(clear, "clear");

			if(racePanel.feedBtn){
				var leviathansInfo = dojo.create("div", {
					innerHTML: ""
				}, leftColumn);
				this.leviathansInfo = leviathansInfo;
				dojo.place(racePanel.feedBtn.domNode, rightColumn, "first");
			}


			var buys = race.buys[0];
			var res = this.game.resPool.get(buys.name);
			dojo.create("div", {
				innerHTML: "<span class='buys'>Buys: </span>" + (res.title || res.name) + " <span class='ammount'>" + buys.val + "</span>"
			}, leftColumn);

			for (var j =0; j< race.sells.length; j++){
				//if (race.sells[j].chance == 100){
					var s = race.sells[j];
					res = this.game.resPool.get(s.name);
					var min = 0;
					var max = 0;

					if (race.name == "zebras" && s.name == "titanium"){
						var val = Math.round(1.5 * (this.game.resPool.get("ship").value / 100 * 2 + 1));

						min = val;
						max = val;
					} else {
						var sratio = s.seasons[this.game.calendar.getCurSeason().name];
						var tratio = self.game.diplomacy.getTradeRatio() + 1;

						if (race.name == "leviathans") {
							tratio *= (1 + 0.02 * race.energy);
						}
						var val = sratio * s.value * (1 - s.delta / 2) * tratio;

						min = val;
						max = val + Math.floor(s.value * sratio * s.delta) * tratio;
					}

					var prefix = ( j == 0) ? "<span class='sells'>Sells: </span>" : "<span class='sells'></span>";
					var div = dojo.create("div", {
							innerHTML: prefix + (res.title || res.name) + " <span class='ammount'>"
								+ this.game.getDisplayValueExt(min, false, false, 0) + " - "
								+ this.game.getDisplayValueExt(max, false, false, 0) + "</span>"
						}, leftColumn);
				//}
			}

			var tradePrices = [{ name: "manpower", val: 50}, { name: "gold", val: 15}];
			tradePrices = tradePrices.concat(race.buys);

			var tradeBtn = new com.nuclearunicorn.game.ui.TradeButton({
				name: $I("trade.send.caravan"),
				description: $I("trade.send.caravan.desc"),
				prices: tradePrices,
				race: race,
				controller: new com.nuclearunicorn.game.ui.TradeButtonController(this.game),
				handler: dojo.partial(function(race){
					self.game.diplomacy.trade(race);
				}, race)
			}, this.game);
			tradeBtn.render(rightColumn);	//TODO: attach it to the panel and do a lot of update stuff
			racePanel.tradeBtn = tradeBtn;
			racePanel.race = race;
			racePanel.collapse(race.collapsed);

			if (racePanel.buyEcoin && racePanel.sellEcoin){
				var tradePanel = dojo.create("div", {className:"crypto-trade" /*, style:{display:"none"}*/ }, null);
				dojo.place(tradePanel, rightColumn, "last");

				dojo.place(racePanel.buyEcoin.domNode, tradePanel, "last");
				dojo.place(racePanel.sellEcoin.domNode, tradePanel, "last");
			}
		}

		//-----------------	race panels must be created fist -------------
		dojo.connect(collapseAll, "onclick", this, function(){
			for (var i in this.racePanels) {
				this.racePanels[i].collapse(true);
			}
		});
		dojo.connect(expandAll, "onclick", this, function(){
			for (var i in this.racePanels) {
				this.racePanels[i].collapse(false);
			}
		});

		//------------------------------------

		dojo.create("div", { style: {
				marginBottom: "15px"
		} }, tabContainer);

		var exploreBtn = new classes.trade.ui.SendExplorersButton({
			name: $I("trade.send.explorers"),
			description: $I("trade.send.explorers.desc"),
			prices: [{ name: "manpower", val: 1000}],
			controller: new classes.trade.ui.SendExplorersButtonController(this.game)
		}, this.game);
		var btn = exploreBtn.render(tabContainer);
		this.exploreBtn = exploreBtn;

		var clear1 = dojo.create("div",{}, tabContainer);
		dojo.addClass(clear1, "clear");

		this.update();
	},


	update: function(){
		this.inherited(arguments);

		for (var i = 0; i< this.racePanels.length; i++){
			this.racePanels[i].update();
		}

		if (this.exploreBtn){
			this.exploreBtn.update();
		}

		if (this.leviathansInfo) {
			var leviathans = this.game.diplomacy.get("leviathans");
			var markerCap = this.game.religion.getZU("marker").val * 5 + 5;
			var leviathansInfoEnergy = leviathans.energy ? leviathans.energy + " / " + markerCap : "N/A";
			this.leviathansInfo.innerHTML = "Energy: " + leviathansInfoEnergy +
				"<br />Time to leave: " + this.game.toDisplayDays(leviathans.duration);

			if (this.game.science.get("antimatter").researched){
				this.leviathansInfo.innerHTML += "<br/> B-coin price: <span style='cursor:pointer' title='"+ this.game.calendar.cryptoPrice + "'>" +
					this.game.getDisplayValueExt(this.game.calendar.cryptoPrice, false, false, 5) + "R</span>";
			}
		}

		this.updateTab();
	},

	updateTab: function(){
		//-------- update tab title -------
		var elders = this.game.diplomacy.get("leviathans");
		if (elders.unlocked){
			this.tabName = $I("tab.name.trade") + " (!)";
		} else {
			this.tabName = $I("tab.name.trade");
		}
		if (this.domNode) {
			this.domNode.innerHTML = this.tabName;
		}
	}
});
