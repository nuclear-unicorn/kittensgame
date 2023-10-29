/**
 * A class for a game page container
 *
 */



/**
 * Just a simple timer, js timer sucks
 */
dojo.declare("classes.game.Timer", null, {
	handlers: [],
	scheduledHandlers: [],

	ticksTotal: 0,
	timestampStart: null,
	totalUpdateTime: null,



	addEvent: function(handler, frequency){
		this.handlers.push({
			handler: handler,
			frequency: frequency,
			phase: 0
		});
	},

	update: function(){
		for (var i = 0; i < this.handlers.length; i++){
			var h = this.handlers[i];
			h.phase--;
			if (h.phase <= 0){
				h.phase = h.frequency;
				h.handler();
			}
		}
	},

	scheduleEvent: function(handler){
		this.scheduledHandlers.push(handler);
	},

	updateScheduledEvents: function(){
		for (var i in this.scheduledHandlers){
			this.scheduledHandlers[i]();
		}
		this.scheduledHandlers = [];
	},

	beforeUpdate: function(){
		this.timestampStart = new Date().getTime();
	},

	afterUpdate: function(){
		this.ticksTotal++;

		var timestampEnd = new Date().getTime();

		var tsDiff = timestampEnd - this.timestampStart;
		this.totalUpdateTime += tsDiff;


		this.currentTime = tsDiff;
		this.averageTime = Math.round(this.totalUpdateTime / this.ticksTotal);
	}
});

dojo.declare("mixin.IDataStorageAware", null, {
	constructor: function(){
		dojo.subscribe("server/save", dojo.hitch(this, this.save));
		dojo.subscribe("server/load", dojo.hitch(this, this.load));
	}
});

dojo.declare("classes.game.Telemetry", [mixin.IDataStorageAware], {

	guid: null,
	game: null,

	buildRevision: null,
	version: null,
	errorCount: 0,

	constructor: function(game) {
		this.guid = this.generateGuid();
		this.game = game;
	},

	// See https://www.ietf.org/rfc/rfc4122.txt, section 4.4
	generateGuid: function() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			return (c == "x" ? 16 * Math.random() | 0 : 4 * Math.random() | 8).toString(16);
		});
	},

	save: function(data) {
		data["telemetry"] = {
			guid: this.guid
		};
	},

	load: function(data) {
		if (data["telemetry"]) {
			this.guid = data["telemetry"].guid || this.generateGuid();
		}

		var self = this;

		// FIXME: This really wants to happen before `window.load` is fired, but
		// this script isn't even loaded yet. So the first PageView will not get
		// all this data.
		if (window.newrelic && !this.game.opts.disableTelemetry){
			// Add a "release" so NR can determine which version of the code was loaded
			// when a JS error was noticed.
			window.newrelic.addRelease('KG', this.version + ".r" + this.buildRevision);

			// Log basic information to *all* PageAction and BrowserInteraction events
			// that follow such as game build, uid, etc.
			window.newrelic.setCustomAttribute('buildRevision', this.version + ".r" + this.buildRevision);
			window.newrelic.setCustomAttribute('guid', this.guid);

			if (this.game.server.userProfile){
				window.newrelic.setCustomAttribute('uid', this.game.server.userProfile.uid);
			}

			/**
			 * Known offenders that folks still use
			 */
			window.newrelic.setErrorHandler(function (err) {
				self.game.achievements.unlockBadge("ghostInTheMachine");

				if (self.errorCount >= 100){
					return true;
				}
				//ban error reporting from https://rawgit.com/mikiso1024/kitten-master/master/kitten_master.js
				if (err.stack.lastIndexOf("mikiso1024") >= 0){
					return true;
				} else {
					self.errorCount++;
					return false;
				}
			});

		}
	},

	// Use this method to create a new PageAction event
	logEvent: function(eventType, payload) {
		payload = payload || {};

		if (window.newrelic && !this.game.opts.disableTelemetry){
			// This will already be decorated by other common things like game build, uid, etc.
			window.newrelic.addPageAction(eventType, payload);
		}
	},

	logRouteChange: function(name) {
		if (window.newrelic && !this.game.opts.disableTelemetry){
			// Record the current tab name so the charts look pretty in the NR UI.
			// Normally this is inferred by route changes, but we don't do that, so we
			// need to give the browser agent some hints

			// Set the `browserInteractionName` on BrowserInteraction events
			var interaction = window.newrelic.interaction();
			window.newrelic.setCurrentRouteName(name);
			interaction.save();

			// Make a new PageAction event
			this.logEvent("routeChange", { 'name': name });
		}
	}
});


/**
 * Server is a mediator between client and KGNet
 * It supports fetching data about saves, syncing using info, etc
 * 
 * Please see toolbar.jsx.js#WLogin widget for rendering part
 */

dojo.declare("classes.game.Server", null, {

	// Server datas
	//---->
	showMotd: true,
	motdTitle: null,
	motdContent: null,
	//<----

	game: null,
	motdContentPrevious: null,
	motdFreshMessage: false,

	//chiral stuff

	/**
	 * KGNet user profile
	 * Represents an active session, if not null, all XHR calls will be made
	 * using session cookies
	 */
	userProfile: null,
	chiral: null,

	/**
	 * When was the last time save was uploaded to the cloud. (Unix timestamp)
	 */
	lastBackup: null,

	/**
	 * Current client snapshot of the save data
	 * All operations with the cloud saves should return the save snapshot?
	 */
	saveData: null,

	constructor: function(game){
		this.game = game;
	},

	setUserProfile: function(userProfile){
		this.userProfile = userProfile;
	},

    getServerUrl: function(){
		var host = window.location.hostname;
		var isLocalhost = window.location.protocol == "file:" || host == "localhost" || host == "127.0.0.1";
        if (isLocalhost){
            //if you are running chilar locally you should know what you are doing
            return "http://localhost:7780";
        }
        return "";
    },

	refresh: function(){
		var self = this;

		console.log("Loading server settings...");
		$.ajax({
			cache: false,
			url: "server.json",
			dataType: "json",
			success: function(json) {
				self.showMotd = json.showMotd;
				self.motdTitle = json.motdTitle;
				self.motdContent = json.motdContent;
			}
		}).done(function() {
			if (self.motdContentPrevious != self.motdContent) {
				self.motdContentPrevious = self.motdContent;
				self.motdFreshMessage = true;
			}
		}).fail(function(err) {
			console.log("Unable to parse server.json configuration:", err);
		});

		//-- fetch UID from KGNet if HTTP session is established ---
		if (!this.userProfile){
			this.syncUserProfile();
		}
		
	},

	/**
	 * Make an XHR request to KGNet server
	 * 
	 * @param {A s} url - relative endpoint URL
	 * @param {*} method - "GET" or "POST"
	 * @param {*} data - post data
	 * @param {*} handler - onDone callback handler
	 */
	_xhr: function(url, method, data, handler){
		return $.ajax({
            cache: false,
            type: method || "GET",
            dataType: "JSON",
			url: this.getServerUrl() + url,
			xhrFields: {
				withCredentials: true
			},
			data: data
		}).done(function(resp){
			handler(resp);
		});
	},

	/**
	 * Fetch user profile from the chiral server, 
	 * User must be logged in and session cookie should be set beforehead
	 */
	syncUserProfile: function(){
		var self = this;

		//TODO: use some XHR snippet, this is getting too verbose
		this._xhr("/user/", "GET", {}, function(resp){
            if (resp && resp.id){
                self.setUserProfile(resp);
            }
		});
	},

	syncSaveData: function(){
		var self = this;
		return this._xhr("/kgnet/save/", "GET", {}, function(resp){
			self.saveData = resp;
		});
	},

	pushSave: function(){
		var self = this,
			game = this.game;

		game.lastBackup = new Date().getTime();

		var saveData = this.game.save();
		this._xhr("/kgnet/save/upload/", "POST", 
		{
			//pre-parsing guid to avoid checking it on the backend side
			guid: this.game.telemetry.guid,
			saveData: this.game.compressLZData(JSON.stringify(saveData), true),
			metadata: {
				calendar: {
					year: game.calendar.year,
					day: game.calendar.day
				}
			}
		}, 
		function(resp){
			console.log("save successful?");
			self.saveData = resp;
			self.game.msg($I("save.export.msg"));
		});
	},

	/**
	 * 
	 * @param {*} metadata 
	 * {
	 * 	archived?: boolean;
	 *  label?: string
	 * }
	 */
	pushSaveMetadata: function(guid, metadata){
		return this._xhr("/kgnet/save/update/", "POST", 
		{
			//pre-parsing guid to avoid checking it on the backend side
			guid: guid,
			metadata: metadata
		}, 
		function(resp){
			self.saveData = resp;
		});
	},

	loadSave: function(guid){
		var self = this;
		this._xhr("/kgnet/save/" + guid + "/download/", "GET", {}, function(resp){
			if (!resp.data){
				console.error("unable to load game data", resp);
			}
			var data = resp.data;
			LCstorage["com.nuclearunicorn.kittengame.savedata"] = data;
			console.log("load successful?");

			self.game.load();
			self.game.msg($I("save.import.msg"));
		});
	},

	save: function(saveData) {
		saveData.server = {
			motdContent: this.motdContent
		};
	},

	//TOOD: separate getting chiral client status and sending command to a separate component
	sendCommand: function(command){
		var self = this;
		this._xhr("/kgnet/chiral/game/command/", "POST", {
			command: command
		}, function(resp){
			if (resp.clientState){
                self.setChiral(resp);
			}
		});
	},

	setChiral: function(data){
		this.chiral = JSON.stringify(data, null, 2);
	}
});

/**
 * Undo Change state. Represents a change in one or multiple managers
 */
dojo.declare("classes.game.UndoChange", null, {
    _static:{
        DEFAULT_TTL : 20
    },
    ttl: 0,
    events: null,

    constructor: function(){
        this.events = [];
    },

    addEvent: function(managerId, data){
        var event = {
            managerId: managerId,
            data: data
        };

        this.events.push(event);
    }
});

/*
 * Effects metadata manager
 */
dojo.declare("com.nuclearunicorn.game.EffectsManager", null, {
	game: null,

	constructor: function(game){
		this.game = game;
	},

	effectMeta: function(effectName) {
		var game = this.game;
		for (var i = 0; i < game.resPool.resources.length; i++) {
			var res = game.resPool.resources[i];
			if (effectName.indexOf(res.name) == 0) {
				var resname = res.name;
				var restitle = res.title || resname;
				restitle = restitle.charAt(0).toUpperCase() + restitle.substring(1, restitle.length);
				var type = effectName.substring(resname.length, effectName.length);
				break;
			}
		}

		switch (true){
			/* Worker pseudoeffect */
			case type == "":
				return {
					//title to be displayed for effect, id if not defined
					title: restitle,
					//effect will be hidden if resource is not unlocked
					resName: resname,
					//value will be affected by opts.usePerSecondValues
					type: "perTick"
				};
			case type == "PerTick":
				return {
					title: restitle,
					resName: resname,
					type: "perTick"
				};
			case type == "PerTickRatio":
				return {
					title: $I("effectsMgr.type.resRatio", [restitle]),
					resName: resname,
					type: "ratio"
				};
			case type == "Max":
				return {
					title: $I("effectsMgr.type.resMax", [restitle]),
					resName: resname
				};
			case type == "MaxChallenge": //for when challenges change Max of resources; LDR to all other sources of Max
				return {
					title: $I("effectsMgr.type.resMax", [restitle]),
					resName: resname
				};
			case type == "Ratio":
				return {
					title: $I("effectsMgr.type.resRatio", [restitle]),
					resName: resname,
					type: "ratio"
				};
			case type == "DemandRatio":
				return {
					title: $I("effectsMgr.type.resDemandRatio", [restitle]),
					resName: resname,
					type: "ratio"
				};
			case (type == "PerTickBase" || type == "PerTickBaseSpace"):
				return {
					title: $I("effectsMgr.type.resProduction", [restitle]),
					resName: resname,
					type: "perTick"
				};
			case (type == "PerTickCon" || type == "PerTickAutoprod" || type == "PerTickProd" || type == "PerTickSpace" || type == "PerTickAutoprodSpace"):
				return {
					title: $I("effectsMgr.type.resConversion", [restitle]),
					resName: resname,
					type: "perTick"
				};
			case type == "CraftRatio":
				return {
					title: $I("effectsMgr.type.resCraftRatio", [restitle]),
					resName: resname,
					type: "ratio"
				};
			case type == "GlobalCraftRatio":
				return {
					title: $I("effectsMgr.type.resGlobalCraftRatio", [restitle]),
					resName: resname,
					type: "ratio"
				};
			default:
				return 0;
		}
	},

	statics: {
		effectMeta: {
			// Specials meta of resources
			"catnipJobRatio" : {
				title: $I("effectsMgr.statics.catnipJobRatio.title"),
				resName: "catnip",
				type: "ratio"
			},

			"catnipDemandWorkerRatioGlobal": {
				title: $I("effectsMgr.statics.catnipDemandWorkerRatioGlobal.title"),
				resName: "catnip",
				type: "ratio"
			},

			"woodJobRatio" : {
				title: $I("effectsMgr.statics.woodJobRatio.title"),
				resName: "wood",
				type: "ratio"
			},

			"manpowerJobRatio" : {
				title: $I("effectsMgr.statics.manpowerJobRatio.title"),
				resName: "manpower",
				type: "ratio"
			},

			"coalRatioGlobal" : {
				title: $I("effectsMgr.statics.coalRatioGlobal.title"),
				resName: "coal",
				type: "ratio",
				calculation: "nonProportional"
			},

			"coalRatioGlobalReduction" : {
				title: $I("effectsMgr.statics.coalRatioGlobalReduction.title"),
				resName: "coal",
				type: "ratio"
			},

			"oilReductionRatio" : {
				title: $I("effectsMgr.statics.oilReductionRatio.title"),
				type: "ratio"
			},

			//kittens

			"maxKittens" : {
				title: $I("effectsMgr.statics.maxKittens.title")
			},

			"maxKittensRatio" : {
				title: $I("effectsMgr.statics.maxKittensRatio.title"),
				type: "ratio"
			},

			"simScalingRatio" : {
				title: $I("effectsMgr.statics.simScalingRatio.title"),
				type: "ratio"
			},

			"antimatterProduction": {
				title: $I("effectsMgr.statics.antimatterProduction.title"),
				type: "perYear"
			},

			"temporalFluxProduction": {
				title: $I("effectsMgr.statics.temporalFluxProduction.title"),
				type: "perYear"
			},

			"temporalFluxProductionChronosphere": {
				title: $I("effectsMgr.statics.temporalFluxProductionChronosphere.title"),
				type: "perYear"
			},

			// Miscellaneous

			"observatoryRatio" : {
                title: $I("effectsMgr.statics.observatoryRatio.title"),
                type: "ratio"
            },

			"magnetoBoostRatio" : {
				title: $I("effectsMgr.statics.magnetoBoostRatio.title"),
				resName: "oil",				//this is sort of hack to prevent early spoiler on magnetos
				type: "ratio"
			},

			"skillXP" : {
				title: $I("effectsMgr.statics.skillXP.title"),
				type: "perTick"
			},

			"refineRatio": {
				title: $I("effectsMgr.statics.refineRatio.title"),
				type: "ratio"
			},

			"craftRatio": {
				title: $I("effectsMgr.statics.craftRatio.title"),
				type: "ratio"
			},

			"happiness": {
				title: $I("effectsMgr.statics.happiness.title")
			},

			"unhappinessRatio": {
				title: $I("effectsMgr.statics.unhappinessRatio.title"),
				type: "ratio"
			},

			"tradeRatio": {
				title: $I("effectsMgr.statics.tradeRatio.title"),
				type: "ratio"
			},

			"standingRatio": {
				title: $I("effectsMgr.statics.standingRatio.title"),
				type: "ratio"
			},

			"resStasisRatio": {
				title: $I("effectsMgr.statics.resStasisRatio.title"),
				type: "ratio"
			},

			"beaconRelicsPerDay": {
				title: $I("effectsMgr.statics.beaconRelicsPerDay.title"),
				type: "perDay"
			},

			"relicPerDay": {
				title: $I("effectsMgr.statics.relicPerDay.title"),
				type: "perDay"
			},

			"routeSpeed": {
				title: $I("effectsMgr.statics.routeSpeed.title"),
				type: "fixed"
			},

			"festivalRatio":{
				title: $I("effectsMgr.statics.festivalRatio.title"),
				type: "ratio"
			},

			"festivalArrivalRatio":{
				title: $I("effectsMgr.statics.festivalArrivalRatio.title"),
				type: "ratio"
			},

			// energy

			"energyProduction": {
				title: $I("effectsMgr.statics.energyProduction.title"),
				type: "energy"
			},
			"energyConsumption": {
				title: $I("effectsMgr.statics.energyConsumption.title"),
				type: "energy",
				calculation: "nonProportional"
            },

			"energyProductionRatio": {
				title: $I("effectsMgr.statics.energyProductionRatio.title"),
				type: "ratio"
			},
			"energyConsumptionRatio": {
				title: $I("effectsMgr.statics.energyConsumptionRatio.title"),
				type: "ratio"
			},
			"energyConsumptionIncrease": {
				title: $I("effectsMgr.statics.energyConsumptionIncrease.title"),
				type: "ratio"
            },

			//production

            "productionRatio" : {
                title: $I("effectsMgr.statics.productionRatio.title"),
                type: "ratio"
            },

            "magnetoRatio" : {
                title: $I("effectsMgr.statics.magnetoRatio.title"),
                type: "ratio"
            },

            "spaceRatio" : {
				title: $I("effectsMgr.statics.spaceRatio.title"),
				type: "ratio"
			},

			"prodTransferBonus": {
				title: $I("effectsMgr.statics.prodTransferBonus.title"),
				type: "ratio"
			},

            //starEvent

            "starEventChance" : {
                title: $I("effectsMgr.statics.starEventChance.title"),
                type: "ratio"
            },

            "starAutoSuccessChance" : {
                title: $I("effectsMgr.statics.starAutoSuccessChance.title"),
                type: "ratio"
            },

            //in the tab workshop
            "lumberMillRatio" : {
                title: $I("effectsMgr.statics.lumberMillRatio.title"),
                type: "ratio"
            },

            "barnRatio" : {
                title: $I("effectsMgr.statics.barnRatio.title"),
                type: "ratio"
            },

            "warehouseRatio" : {
                title: $I("effectsMgr.statics.warehouseRatio.title"),
                type: "ratio"
            },

            "acceleratorRatio" : {
                title: $I("effectsMgr.statics.acceleratorRatio.title"),
                type: "ratio"
            },

            "harborRatio" : {
                title: $I("effectsMgr.statics.harborRatio.title"),
                type: "ratio"
            },

            "harborCoalRatio" : {
                title: $I("effectsMgr.statics.harborCoalRatio.title"),
                type: "ratio"
            },

            "catnipMaxRatio" : {
                title: $I("effectsMgr.statics.catnipMaxRatio.title"),
				type: "ratio",
				resName:"catnip"
            },

            "hunterRatio" : {
                title: $I("effectsMgr.statics.hunterRatio.title"),
                type: "ratio"
            },

            "solarFarmRatio" : {
                title: $I("effectsMgr.statics.solarFarmRatio.title"),
                type: "ratio"
            },

            "shipLimit" : {
                title: $I("effectsMgr.statics.shipLimit.title"),
                type: "ratio"
            },

            "hutPriceRatio" : {
                title: $I("effectsMgr.statics.hutPriceRatio.title"),
                type: "ratio"
            },

            "coalSuperRatio" : {
                title: $I("effectsMgr.statics.coalSuperRatio.title"),
                type: "ratio"
            },

            "smelterRatio" : {
                title: $I("effectsMgr.statics.smelterRatio.title"),
                type: "ratio"
            },

            "calcinerRatio" : {
                title: $I("effectsMgr.statics.calcinerRatio.title"),
                type: "ratio"
            },

            "calcinerSteelRatio" : {
                title: $I("effectsMgr.statics.calcinerSteelRatio.title"),
                type: "ratio"
            },

            "calcinerSteelCraftRatio" : {
                title: $I("effectsMgr.statics.calcinerSteelCraftRatio.title"),
                type: "ratio"
            },

            "calcinerSteelReactorBonus" : {
                title: $I("effectsMgr.statics.calcinerSteelReactorBonus.title"),
                type: "ratio"
            },

            "libraryRatio" : {
                title: $I("effectsMgr.statics.libraryRatio.title"),
                type: "ratio"
            },

            "hydroPlantRatio" : {
                title: $I("effectsMgr.statics.hydroPlantRatio.title"),
                type: "ratio"
            },

            "spaceScienceRatio" : {
                title: $I("effectsMgr.statics.spaceScienceRatio.title"),
                type: "ratio"
            },

            "oilWellRatio" : {
                title: $I("effectsMgr.statics.oilWellRatio.title"),
                type: "ratio"
            },

            "unicornsGlobalRatio" : {
                title: $I("effectsMgr.statics.unicornsGlobalRatio.title"),
                type: "ratio"
            },

            "biofuelRatio" : {
                title: $I("effectsMgr.statics.biofuelRatio.title"),
                type: "ratio"
            },

            "cadBlueprintCraftRatio" : {
                title: $I("effectsMgr.statics.cadBlueprintCraftRatio.title"),
                type: "ratio"
            },

            "skillMultiplier" : {
                title: $I("effectsMgr.statics.skillMultiplier.title"),
                type: "ratio"
            },

            "masterSkillMultiplier" : {
                title: $I("effectsMgr.statics.masterSkillMultiplier.title"),
                type: "ratio"
            },

            "uraniumRatio" : {
                title: $I("effectsMgr.statics.uraniumRatio.title"),
                type: "ratio"
            },

            "reactorEnergyRatio" : {
                title: $I("effectsMgr.statics.reactorEnergyRatio.title"),
                type: "ratio"
            },

			"reactorThoriumPerTick" : {
                title: $I("effectsMgr.statics.reactorThoriumPerTick.title"),
                type: "perTick"
            },

            "starchartGlobalRatio" : {
                title: $I("effectsMgr.statics.starchartGlobalRatio.title"),
                type: "ratio"
            },

            "satnavRatio" : {
                title: $I("effectsMgr.statics.satnavRatio.title"),
                type: "ratio"
            },

            "broadcastTowerRatio" : {
                title: $I("effectsMgr.statics.broadcastTowerRatio.title"),
                type: "ratio"
            },

            "cultureMaxRatio" : {
                title: $I("effectsMgr.statics.cultureMaxRatio.title"),
                type: "ratio"
            },

            "lunarOutpostRatio" : {
                title: $I("effectsMgr.statics.lunarOutpostRatio.title"),
                type: "ratio"
            },

            "crackerRatio" : {
                title: $I("effectsMgr.statics.crackerRatio.title"),
                type: "ratio"
            },

            "factoryRefineRatio" : {
                title: $I("effectsMgr.statics.factoryRefineRatio.title"),
                type: "ratio"
            },

            "timeRatio" :  {
                title: $I("effectsMgr.statics.timeRatio.title"),
                type: "ratio"
            },

            "temporalParadoxVoid" :  {
                title: $I("effectsMgr.statics.temporalParadoxVoid.title"),
                type: "perDay"
            },

            "temporalParadoxDay" :  {
                title: $I("effectsMgr.statics.temporalParadoxDay.title"),
                type: "fixed"
            },

            "temporalParadoxDayBonus" :  {
                title: $I("effectsMgr.statics.temporalParadoxDayBonus.title"),
                type: "fixed"
            },

			"unicornsRatioReligion" :  {
                title: $I("effectsMgr.statics.unicornsRatioReligion.title"),
                type: "ratio"
            },

			"riftChance" :  {
                title: $I("effectsMgr.statics.riftChance.title"),
                type: "ratio"
            },

			"ivoryMeteorChance" :  {
                title: $I("effectsMgr.statics.ivoryMeteorChance.title"),
                type: "ratio"
            },

            "ivoryMeteorRatio" :  {
                title: $I("effectsMgr.statics.ivoryMeteorRatio.title"),
                type: "ratio"
            },

            "goldMaxRatio" :  {
                title: $I("effectsMgr.statics.goldMaxRatio.title"),
                type: "ratio"
            },

			"alicornChance" :  {
                title: $I("effectsMgr.statics.alicornChance.title"),
                type: "ratio"
            },

			"tcRefineRatio" :  {
                title: $I("effectsMgr.statics.tcRefineRatio.title"),
                type: "ratio"
            },

			"corruptionRatio" :  {
                title: $I("effectsMgr.statics.corruptionRatio.title"),
                type: "ratio"
            },

			"cultureMaxRatioBonus" :  {
                title: $I("effectsMgr.statics.cultureMaxRatioBonus.title"),
                type: "ratio"
            },

			"faithRatioReligion" :  {
                title: $I("effectsMgr.statics.faithRatioReligion.title"),
                type: "ratio"
            },

            "solarRevolutionLimit" : {
                title: $I("effectsMgr.statics.solarRevolutionLimit.title"),
                type: "ratio"
            },

            "solarRevolutionRatio" : {
                title: $I("effectsMgr.statics.solarRevolutionRatio.title"),
                type: "ratio"
            },

            "faithSolarRevolutionBoost" : {
                title: $I("effectsMgr.statics.faithSolarRevolutionBoost.title"),
                type: "ratio"
            },

			"relicRefineRatio" :  {
                title: $I("effectsMgr.statics.relicRefineRatio.title"),
                type: "ratio"
            },

			"blsLimit" :  {
                title: $I("effectsMgr.statics.blsLimit.title"),
                type: "integerRatio"
            },

			"globalResourceRatio" :  {
                title: $I("effectsMgr.statics.globalResourceRatio.title"),
                type: "ratio"
            },

            "timeImpedance" :  {
                title: $I("effectsMgr.statics.timeImpedance.title"),
                type: "fixed"
            },

            "shatterTCGain" :  {
                title: $I("effectsMgr.statics.shatterTCGain.title"),
                type: "ratio"
            },

            "rrRatio" :  {
                title: $I("effectsMgr.statics.rrRatio.title"),
                type: "ratio"
            },

            "shatterYearBoost":{
                title: $I("effectsMgr.statics.shatterYearBoost.title")
            },

			"priceRatio" :  {
                title: $I("effectsMgr.statics.priceRatio.title"),
                type: "ratio"
            },

			"kittenGrowthRatio" :  {
                title: $I("effectsMgr.statics.kittenGrowthRatio.title"),
                type: "ratio"
            },

			"t1CraftRatio" :  {
                title: $I("effectsMgr.statics.t1CraftRatio.title"),
                type: "fixed"
            },

			"t2CraftRatio" :  {
                title: $I("effectsMgr.statics.t2CraftRatio.title"),
                type: "fixed"
            },

			"t3CraftRatio" :  {
                title: $I("effectsMgr.statics.t3CraftRatio.title"),
                type: "fixed"
            },

			"t4CraftRatio" :  {
                title: $I("effectsMgr.statics.t4CraftRatio.title"),
                type: "fixed"
            },

			"t5CraftRatio" :  {
                title: $I("effectsMgr.statics.t5CraftRatio.title"),
                type: "fixed"
            },
			"queueCap": {
                title: $I("effectsMgr.statics.queueCap"),
                type: "fixed"
			},
			//Spaceports
			"moonBaseStorageBonus": {
				title: $I( "effectsMgr.statics.moonBaseStorageBonus.title" ),
				type: "ratio"
			},
			"planetCrackerStorageBonus": {
				title: $I( "effectsMgr.statics.planetCrackerStorageBonus.title" ),
				type: "ratio"
			},
			"cryostationStorageBonus": {
				title: $I( "effectsMgr.statics.cryostationStorageBonus.title" ),
				type: "ratio"
			},
			// cycleEffects
			"spaceElevator-prodTransferBonus": {
                title: $I("effectsMgr.statics.spaceElevator-prodTransferBonus.title"),
                type: "ratio"
            },

			"sattelite-starchartPerTickBaseSpace": {
                title: $I("effectsMgr.statics.sattelite-starchartPerTickBaseSpace.title"),
                type: "ratio"
            },

			"sattelite-observatoryRatio": {
                title: $I("effectsMgr.statics.sattelite-observatoryRatio.title"),
                type: "ratio"
            },

			"spaceStation-scienceRatio": {
                title: $I("effectsMgr.statics.spaceStation-scienceRatio.title"),
                type: "ratio"
            },

			"moonOutpost-unobtainiumPerTickSpace": {
                title: $I("effectsMgr.statics.moonOutpost-unobtainiumPerTickSpace.title"),
                type: "ratio"
            },

			"planetCracker-uraniumPerTickSpace": {
                title: $I("effectsMgr.statics.planetCracker-uraniumPerTickSpace.title"),
                type: "ratio"
            },

			"hydrofracturer-oilPerTickAutoprodSpace": {
                title: $I("effectsMgr.statics.hydrofracturer-oilPerTickAutoprodSpace.title"),
                type: "ratio"
            },

			"researchVessel-starchartPerTickBaseSpace": {
                title: $I("effectsMgr.statics.researchVessel-starchartPerTickBaseSpace.title"),
                type: "ratio"
            },

			"sunlifter-energyProduction": {
                title: $I("effectsMgr.statics.sunlifter-energyProduction.title"),
                type: "ratio"
            },

                        "cryostation-woodMax": {
                title: $I("effectsMgr.statics.cryostation-woodMax.title"),
                type: "ratio"
            },

                        "cryostation-mineralsMax": {
                title: $I("effectsMgr.statics.cryostation-mineralsMax.title"),
                type: "ratio"
            },

                        "cryostation-ironMax": {
                title: $I("effectsMgr.statics.cryostation-ironMax.title"),
                type: "ratio"
            },

                        "cryostation-coalMax": {
                title: $I("effectsMgr.statics.cryostation-coalMax.title"),
                type: "ratio"
            },

                        "cryostation-uraniumMax": {
                title: $I("effectsMgr.statics.cryostation-uraniumMax.title"),
                type: "ratio"
            },

                        "cryostation-titaniumMax": {
                title: $I("effectsMgr.statics.cryostation-titaniumMax.title"),
                type: "ratio"
            },

                        "cryostation-oilMax": {
                title: $I("effectsMgr.statics.cryostation-oilMax.title"),
                type: "ratio"
            },

                        "cryostation-unobtainiumMax": {
                title: $I("effectsMgr.statics.cryostation-unobtainiumMax.title"),
                type: "ratio"
            },

			"spaceBeacon-starchartPerTickBaseSpace": {
                title: $I("effectsMgr.statics.spaceBeacon-starchartPerTickBaseSpace.title"),
                type: "ratio"
            },

                        "hydroponics-catnipRatio": {
                title: $I("effectsMgr.statics.hydroponics-catnipRatio.title"),
                type: "ratio"
            },

                        "hrHarvester-energyProduction": {
                title: $I("effectsMgr.statics.hrHarvester-energyProduction.title"),
                type: "ratio"
            },

                        "entangler-gflopsConsumption": {
                title: $I("effectsMgr.statics.entangler-gflopsConsumption.title"),
                type: "ratio"
            },
			"hrProgress": {
				title: $I("effectsMgr.statics.entangler-hrProgress.title"),
				type: "ratio",
				calculation: "nonProportional"
			},

			"aiLevel" :  {
				title: $I("effectsMgr.statics.aiLevel.title"),
				type: "fixed",
				calculation: "nonProportional"
			},

			"gflopsConsumption" :  {
				title: $I("effectsMgr.statics.gflopsConsumption.title"),
				type: "perTick"
			},

			"hashrate" :  {
				title: $I("effectsMgr.statics.hashrate.title"),
				type: "fixed",
				calculation: "nonProportional"
			},

			"nextHashLevelAt" :  {
				title: $I("effectsMgr.statics.nextHashLevelAt.title"),
				type: "fixed",
				calculation: "nonProportional"
			},

			"hashRateLevel" :  {
				title: $I("effectsMgr.statics.hashrateLevel.title"),
				type: "fixed",
				calculation: "nonProportional"
			},

			"corruptionBoostRatio": {
				title: $I("effectsMgr.statics.corruptionBoostRatio.title"),
				type: "ratio"
			},

			"corruptionBoostRatioChallenge": {
				title: $I("effectsMgr.statics.corruptionBoostRatioChallenge.title"),
				type: "ratio"
			},

			"bskSattelitePenalty" : {
				title: $I("effectsMgr.statics.bskSattelitePenalty.title"),
				type: "ratio"
			},

			"blsCorruptionRatio": {
				title: $I("effectsMgr.statics.blsCorruptionRatio.title"),
				type: "ratio"
			},

			"baseMetalMaxRatio": {
				title: $I("effectsMgr.statics.baseMetalMaxRatio.title"),
				type: "ratio"
			},

			"scienceMaxCompendia": {
				title: $I("effectsMgr.statics.scienceMaxCompendia.title"),
				type: "fixed"
			},

			"uplinkDCRatio": {
				title: $I("effectsMgr.statics.uplinkDCRatio.title"),
				type: "ratio"
			},

			"uplinkLabRatio": {
				title: $I("effectsMgr.statics.uplinkLabRatio.title"),
				type: "ratio"
			},

			"dataCenterAIRatio": {
				title: $I("effectsMgr.statics.dataCenterAIRatio.title"),
			},

			"compendiaTTBoostRatio": {
				title: $I("effectsMgr.statics.compendiaTTBoostRatio.title"),
				type: "ratio"
			},

			"blackLibraryBonus": {
				title: $I("effectsMgr.statics.blackLibraryBonus.title"),
				type: "ratio"
			},

			"solarFarmSeasonRatio": {
				title: $I("effectsMgr.statics.solarFarmSeasonRatio.title"),
				type: "fixed"
			},

			"tectonicBonus": {
				title: $I("effectsMgr.statics.tectonicBonus.title"),
				type: "ratio"
			},

			"umbraBoostRatio": {
				title: $I("effectsMgr.statics.umbraBoostRatio.title"),
				type: "ratio"
			},

			"eludiumAutomationBonus": {
				title: $I("effectsMgr.statics.eludiumAutomationBonus.title"),
				type: "ratio"
			},

			"heatMax": {
				title: $I("effectsMgr.statics.heatMax.title"),
				type: "fixed"
			},

			"heatPerTick": {
				title: $I("effectsMgr.statics.heatPerTick.title"),
				type: "perTick"
			},

			"heatMaxExpansion": {
				title: $I("effectsMgr.statics.heatMaxExpansion.title"),
				type: "fixed",
				calculation: "nonProportional"
			},

			"voidResonance": {
				title: $I("effectsMgr.statics.voidResonance.title"),
				type: "ratio"
			},

			"terraformingMaxKittensRatio": {
				title: $I("effectsMgr.statics.terraformingMaxKittens.title"),
				type: "ratio",
				calculation: "nonProportional"
			},
			//age 1 policy effects
			"happinessKittenProductionRatio": {
				title: $I("effectsMgr.statics.happinessKittenProductionRatio.title"),
				type: "ratio"
			},
			"cultureFromManuscripts": {
				title: $I("effectsMgr.statics.cultureFromManuscripts.title"),
				type: "ratio"
			},
			"manuscriptParchmentCost": {
				title: $I("effectsMgr.statics.manuscriptCost.title", [$I("resources.parchment.title")]),
				type: "fixed"
			},
			"manuscriptCultureCost": {
				title: $I("effectsMgr.statics.manuscriptCost.title",[$I("resources.culture.title")]),
				type: "fixed"
			},
			//age 2 policy effects
			"rankLeaderBonusConversion": {
				title: $I("effectsMgr.statics.rankLeaderBonusConversion.title"),
                type: "ratio"
			},
			"boostFromLeader": {
                title: $I("effectsMgr.statics.boostFromLeader.title"),
                type: "ratio"
			},
			//age 3 policy effects
			"goldCostReduction": {
                title: $I("effectsMgr.statics.goldCostReduction.title"),
                type: "ratio"
			},
			"factoryCostReduction":{
                title: $I("effectsMgr.statics.factoryCostReduction.title"),
                type: "ratio"
			},
			"logHouseCostReduction":{
                title: $I("effectsMgr.statics.logHouseCostReduction.title"), //yes, it is log house!
                type: "ratio"
			},
			"communismProductionBonus":{
                title: $I("effectsMgr.statics.communismProductionBonus.title"),
                type: "ratio"
			},
			//age 4 policy effects
			"technocracyScienceCap":{
                title: $I("effectsMgr.statics.technocracyScienceCap.title"),
                type: "ratio"
			},
			//age 5 policy effects
			"aiCoreProductivness":{
                title: $I("effectsMgr.statics.aiCoreProductivity.title"),
                type: "ratio"
			},
			"aiCoreUpgradeBonus":{
				title: $I("effectsMgr.statics.aiCoreUpgradeBonus.title"),
				type: "ratio"
			},
			"blsProductionBonus":{
                title: $I("effectsMgr.statics.blsProductionBonus.title"),
                type: "ratio"
			},
			"leviathansEnergyModifier":{
                title: $I("effectsMgr.statics.leviathansEnergyModifier.title"),
                type: "ratio"
			},
			"holyGenocideBonus":{
                title: $I("effectsMgr.statics.holyGenocideBonus.title"),
                type: "ratio"
			},
            //foreign policy effects
            "tradeCatpowerDiscount":{
                title: $I("effectsMgr.statics.tradeCatpowerDiscount.title"),
                type: "fixed"
            },
            "tradeGoldDiscount":{
                title: $I("effectsMgr.statics.tradeGoldDiscount.title"),
                type: "fixed"
            },
            "zebraRelationModifier":{
                title: $I("effectsMgr.statics.zebraRelationModifier.title"),
                type: "fixed"
            },
            "nonZebraRelationModifier":{
                title: $I("effectsMgr.statics.nonZebraRelationModifier.title"),
                type: "fixed"
            },
            "sharedKnowledgeBonus":{
                title: $I("effectsMgr.statics.sharedKnowledgeBonus.title"),
                type: "ratio"
            },
            "culturalExchangeBonus":{
                title: $I("effectsMgr.statics.culturalExchangeBonus.title"),
                type: "ratio"
            },
            "embassyCostReduction":{
                title: $I("effectsMgr.statics.embassyCostReduction.title"),
                type: "ratio"
            },
            "onAHillCultureCap":{
                title: $I("effectsMgr.statics.onAHillCultureCap.title"),
                type: "ratio"
            },
            "satelliteSynergyBonus":{
                title: $I("effectsMgr.statics.satelliteSynergyBonus.title"),
                type: "ratio"
            },
            "globalRelationsBonus":{
            title: $I("effectsMgr.statics.globalRelationsBonus.title"),
                type: "fixed"
            },
            //philosophy
            "luxuryDemandRatio":{
                title: $I("effectsMgr.statics.luxuryDemandRatio.title"),
                type: "ratio"
            },
			"breweryConsumptionRatio":{
                title: $I("effectsMgr.statics.breweryConsumptionRatio.title"),
                type: "ratio"
			},
            "luxuryHappinessBonus":{
                title: $I("effectsMgr.statics.luxuryHappinessBonus.title"),
                type: "fixed"
            },
            "rationalityBonus":{
                title: $I("effectsMgr.statics.rationalityBonus.title"),
                type: "ratio"
            },
        	"mysticismBonus":{
        	    title: $I("effectsMgr.statics.mysticismBonus.title"),
               type: "ratio"
            },
			"festivalLuxuryConsumptionRatio":{
            	title: $I("effectsMgr.statics.festivalLuxuryConsumptionRatio.title"),
            	type: "ratio"
			},"consumableLuxuryHappiness":{
                title: $I("effectsMgr.statics.consumableLuxuryHappiness.title"),
                type: "fixed"
			},
			 "hapinnessConsumptionRatio":{
                title: $I("effectsMgr.statics.hapinnessConsumptionRatio.title"),
                type: "ratio"
			},
			 "mintRatio":{
                title: $I("effectsMgr.statics.mintRatio.title"),
                type: "ratio"
			},
             //environment policy
            "environmentMineralBonus":{
                title: $I("effectsMgr.statics.environmentMineralBonus.title"),
                type: "ratio"
            },
            "environmentWoodBonus":{
				title: $I("effectsMgr.statics.environmentWoodBonus.title"),
				type: "ratio"
            },
            "environmentHappinessBonus":{
                title: $I("effectsMgr.statics.environmentHappinessBonus.title"),
                type: "fixed"
            },
            "environmentUnhappiness":{
                title: $I("effectsMgr.statics.environmentUnhappiness.title"),
                type: "fixed"
            },
            "environmentFactoryCraftBonus":{
				title: $I("effectsMgr.statics.environmentFactoryCraftBonus.title"),
				type: "ratio"
			},
            "coalPolicyRatio":{
				title: $I("effectsMgr.statics.coalPolicyRatio.title"),
				type: "ratio"
            },
            "ironPolicyRatio":{
				title: $I("effectsMgr.statics.ironPolicyRatio.title"),
				type: "ratio"
            },
            "titaniumPolicyRatio":{
				title: $I("effectsMgr.statics.titaniumPolicyRatio.title"),
				type: "ratio"
            },
            "faithPolicyRatio":{
				title: $I("effectsMgr.statics.faithPolicyRatio.title"),
				type: "ratio"
            },
            "unobtainiumPolicyRatio":{
				title: $I("effectsMgr.statics.unobtainiumPolicyRatio.title"),
				type: "ratio"
            },
            "sciencePolicyRatio":{
				title: $I("effectsMgr.statics.sciencePolicyRatio.title"),
				type: "ratio"
            },
            "culturePolicyRatio":{
				title: $I("effectsMgr.statics.culturePolicyRatio.title"),
				type: "ratio"
            },
            "mineralsPolicyRatio":{
				title: $I("effectsMgr.statics.mineralsPolicyRatio.title"),
				type: "ratio"
            },
            "woodPolicyRatio":{
				title: $I("effectsMgr.statics.woodPolicyRatio.title"),
				type: "ratio"
            },
            "goldPolicyRatio":{
				title: $I("effectsMgr.statics.goldPolicyRatio.title"),
				type: "ratio"
			},
			//challenges
			"springCatnipRatio": {
				title: $I("effectsMgr.statics.springCatnipRatio.title"),
				type: "ratio"
			},
            "summerSolarFarmRatio": {
                title: $I("effectsMgr.statics.summerSolarFarmRatio.title"),
				type: "ratio"
            },
            "shatterCostReduction": {
                title: $I("effectsMgr.statics.shatterCostReduction.title"),
                type: "ratio"
			},
            "temporalPressCap": {
                title: $I("effectsMgr.statics.temporalPressCap.title"),
                type: "fixed"
			},
            "heatEfficiency": {
                title: $I("effectsMgr.statics.heatEfficiency.title"),
                type: "ratio"
			},
            "shatterCostIncreaseChallenge": {
                title: $I("effectsMgr.statics.shatterCostIncreaseChallenge.title"),
                type: "ratio"
			},
			"coldChance": {
                title: $I("effectsMgr.statics.coldChance.title"),
                type: "ratio"
			},
			"coldHarshness": {
                title: $I("effectsMgr.statics.coldHarshness.title"),
                type: "ratio"
			},
			"kittenLaziness": {
                title: $I("effectsMgr.statics.kittenLaziness.title"),
                type: "ratio"
			},
			"shatterVoidCost":{
                title: $I("effectsMgr.statics.shatterVoidCost.title"),
                type: "fixed"
			},
			"challengeHappiness":{
                title: $I("effectsMgr.statics.challengeHappiness.title")
			},
			"tradeKnowledge":{
				title: $I("effectsMgr.statics.tradeKnowledge.title")
			},
			"tradeKnowledgeRatio" :  {
				title: $I("effectsMgr.statics.tradeKnowledgeRatio.title"),
				type: "ratio",
				calculation: "nonProportional"
			},
			"steamworksFakeBought":{
				title: $I("effectsMgr.statics.steamworksFakeBought.title")
			},
			"embassyFakeBought":{
				title: $I("effectsMgr.statics.embassyFakeBought.title")
			},
			"policyFakeBought":{
				title: $I("effectsMgr.statics.policyFakeBought.title")
			},
			"weaponEfficency":{
				title: $I("effectsMgr.statics.weaponEfficency.title"),
				type: "ratio"
			},
			"cryochamberSupport":{
				title: $I("effectsMgr.statics.cryochamberSupport.title"),
			},
			"arrivalSlowdown":{
				title: $I("effectsMgr.statics.arrivalSlowdown.title"),
				type: "ratio"
			},
			"mausoleumBonus":{
				title: $I("effectsMgr.statics.mausoleumBonus.title"),
				type: "ratio"
			},
			//pacts
            "pactsAvailable":{
				title: $I("effectsMgr.statics.pactsAvailable.title"),
				type: "fixed"
			},
            "kittensKarmaPerMinneliaRatio":{
				title: $I("effectsMgr.statics.kittensKarmaPerMinneliaRatio.pact.title"),
				type: "ratio"
			},
            "necrocornPerDay":{
				title: $I("effectsMgr.statics.necrocornPerDay.pact.title"),
				type: "perDay"
			},
            "pactGlobalResourceRatio":{
				title: $I("effectsMgr.statics.pactGlobalResourceRatio.title"),
				type: "ratio"
			},
            "pactGlobalProductionRatio":{
				title: $I("effectsMgr.statics.pactGlobalProductionRatio.title"),
				type: "ratio"
			},
            "pactFaithRatio":{
				title: $I("effectsMgr.statics.pactFaithRatio.title"),
				type: "ratio"
			},
			"pyramidGlobalResourceRatio":{
				title: $I("effectsMgr.statics.pyramidGlobalResourceRatio.title"),
				type: "ratio"
			},
			"pyramidGlobalProductionRatio":{
				title: $I("effectsMgr.statics.pyramidGlobalProductionRatio.title"),
				type: "ratio"
			},
			"deficitRecoveryRatio":{
				title: $I("effectsMgr.statics.deficitRecoveryRatio.title"),
				type: "ratio"
			},
			"pyramidFaithRatio":{
				title: $I("effectsMgr.statics.pyramidFaithRatio.title"),
				type: "ratio"
			},
			"pyramidSpaceCompendiumRatio":{
				title: $I("effectsMgr.statics.pyramidSpaceCompendiumRatio.title"),
				type: "ratio"
			},
			"pactBlackLibraryBoost":{
				title: $I("effectsMgr.statics.pactBlackLibraryBoost.title"),
				type: "ratio"
			},
			"pactDeficitRecoveryRatio":{
				title: $I("effectsMgr.statics.pactDeficitRecoveryRatio.title"),
				type: "ratio"
			},
			"pactSpaceCompendiumRatio":{
				title: $I("effectsMgr.statics.pactSpaceCompendiumRatio.title"),
				type: "ratio"
			},
			//pollution
			"cathPollutionPerTickProd":{
				type: "hidden"
			},
			"cathPollutionPerTickCon":{
				type: "hidden"
			},
			"cathPollutionRatio":{
				title:  $I("effectsMgr.statics.pollutionRatio.title"),
				type: "ratio"
			},
            //zebra workshop upgrades
            "zebraPreparations": {
                title: $I("effectsMgr.statics.zebraPreparations.title"),
                type: "fixed"
			},
			"academyMeteorBonus": {
                title: $I("effectsMgr.statics.academyMeteorBonus.title"),
                type: "ratio"
			},
			"activeHG":{
				title: $I("effectsMgr.statics.activeHG.title"),
				type: "fixed",
				calculation: "nonProportional"

			}
		}
	}
});

/**
 * Main game class, can be accessed globally as a 'gamePage' variable
 */

dojo.declare("com.nuclearunicorn.game.ui.GamePage", null, {

	id: null,

	tabs: null,

	//components:

	resPool: null,
	calendar: null,
	bld: null,
	village: null,
	science: null,
	workshop: null,
	diplomacy: null,
	achievements: null,

	console: null,
	telemetry: null,
	server: null,
	math: null,
	loadingSave: false, //while save is being imported we should ignore production from buildings for one tick; hack

	//global cache
	globalEffectsCached: {},

	//how much ticks are performed per second (5 ticks per second, 200 ms per tick)
	ticksPerSecond: 5,

	//I wonder why someone may need this
	isPaused: false,

	isCMBREnabled: false,

	ticksBeforeSave: 400,	//80 seconds ~

	//in ticks
	autosaveFrequency: 400,


	//current building selected in the Building tab by a mouse cursor, should affect resource table rendering
	//TODO: move me to UI
	selectedBuilding: null,
	setSelectedObject: function(object) {
		this.selectedBuilding = object;
		this._publish("ui/update", this);
	},
	clearSelectedObject: function() {
		this.selectedBuilding = null;
		this._publish("ui/update", this);
	},

	//=============================
	//		option settings
	//=============================
	forceShowLimits: false,
	useWorkers: false,
	colorScheme: "",
	unlockedSchemes: null,

	timer: null,
	_mainTimer: null,	//main timer loop

	//===========================================
	//game-related flags that will go to the save
	//===========================================

	//on a side note, I hate those flags. Could we use gamePage.opts = []/{}; ?
	karmaKittens: 0,	//counter for karmic reincarnation
	karmaZebras: 0,
	deadKittens: 0,
	ironWill: true,		//true if player has no kittens or housing buildings

	saveVersion: 15,

	//FINALLY
	opts: null,

	gatherTimeoutHandler: null,	//timeout till resetting gather counter, see below
	gatherClicks: 0,	//how many clicks in a row was performed on a gather button
	cheatMode: false,	//flag triggering Super Unethical Climax achievement
	systemShockMode: false,	//flag triggering System Shock achievement

	ticks: 0,				//how many ticks passed since the start of the game
	totalUpdateTime: [0, 0, 0, 0, 0],	//total time spent on update cycle in milliseconds, useful for debug/fps counter. 1 ticks per second have more calculations
	totalUpdateTimeTicks: 5,
	totalUpdateTimeCurrent : 0,
	fps: null,	//fps breakdows of a render cycle

	pauseTimestamp: 0, //time of last pause

	lastDateMessage: null,  //Stores the most recent date message to prevent header spam

	effectsMgr: null,

    managers: null,

    //TODO: this can potentially be an array
    undoChange: null,

    //ui communication layer
    ui: null,

    //==========    external API's ========
    dropBoxClient: null,

	/*
		Whether the game is in developer mode or no
	 */
	isLocalhost: false,
	devMode: false,
	mobileSaveOnPause: true,

	//should this go to the res pool?
	winterCatnipPerTick: 0,

	//====== Feature Flags =======

	//a quick way of disabling particular feature on mainline/beta without maintaining boolean flags in the code
	//there is still no simple way to figure out on WHICH branch we are, especially on local, but we can parse URL

	featureFlags: {
		VILLAGE_MAP: {
			beta: true,
			main: false,
			mobile: false
		},
		SPACE_EXPL: {
			beta: true,
			main: false,
			mobile: false
		},
		MAUSOLEUM_PACTS:{
			beta: true,
			main: true,
			mobile: true
		},
		QUEUE:{
			beta: true,
			main: true,
			mobile: true
		},
		QUEUE_REDSHIFT: {
			beta: true,
			main: true,
			mobile: true
		}
	},

	constructor: function(containerId){
		this.id = containerId;

		this.fps = {};
		this.tabs = [];
        this.managers = [];

		this.opts = {
			usePerSecondValues: true,
			notation: "si",
			forceHighPrecision: false,
			usePercentageResourceValues: false,
			showNonApplicableButtons: false,
			usePercentageConsumptionValues: false,
			highlightUnavailable: true,
			hideSell: false,
			hideDowngrade: false,
			hideBGImage: false,
			tooltipsInRightColumn: false,
			noConfirm: false,
			IWSmelter: true,
			disableCMBR: false,
			enableRedshift: false,
			enableRedshiftGflops: false,
			batchSize: 10,
			// Used only in KG Mobile, hence it's absence in the rest of the code
			useLegacyTwoInRowLayout: false,
			forceLZ: false,
			compressSaveFile: false
		};

		this.console = new com.nuclearunicorn.game.log.Console(this);
		this.telemetry = new classes.game.Telemetry(this);
		this.server = new classes.game.Server(this);
		this.math = new com.nuclearunicorn.game.Math();

		this.resPool = new classes.managers.ResourceManager(this);
		this.calendar = new com.nuclearunicorn.game.Calendar(this, dojo.byId("calendarDiv"));

		this.village = new classes.managers.VillageManager(this);
		this.resPool.setVillage(this.village);

        var managers = [
            { id: "workshop",       class:  "WorkshopManager"   },
            { id: "diplomacy",      class:  "DiplomacyManager"  },
            { id: "bld",            class:  "BuildingsManager"  },
            { id: "science",        class:  "ScienceManager"    },
            { id: "achievements",   class:  "Achievements"      },
            { id: "religion",       class:  "ReligionManager"   },
            { id: "space",          class:  "SpaceManager"      },
			{ id: "time",           class:  "TimeManager"       },
            { id: "prestige",       class:  "PrestigeManager"   },
            { id: "challenges",     class:  "ChallengesManager" },
            { id: "stats",       	class:  "StatsManager"      },
			{ id: "void",       	class:  "VoidManager"      }
        ];

        for (var i in managers){
            var manager = managers[i];
			if (!window["classes"]["managers"][manager.class]){
				throw "Unable to load tab manager '" + manager.class + "'";
			}

            this[manager.id] = new window["classes"]["managers"][manager.class](this);
			var managerRef = this[manager.id];
			managerRef.id = manager.id;
            this.managers.push(managerRef);
        }

		//very sloppy design, could we just use an array for tab managers?

		var tabRegistry = [
			{class: com.nuclearunicorn.game.ui.tab.BuildingsModern,
				name: "buildings.tabName",
				id: "Bonfire",
				prop: "bldTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.Village,
				name: "village.tab.title.smallvillage",
				id: "Village",
				prop: "villageTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.Library,
				name: "tab.name.science",
				id: "Science",
				prop: "libraryTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.Workshop,
				name: "tab.name.workshop",
				id: "Workshop",
				prop: "workshopTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.Diplomacy,
				name: "tab.name.trade",
				id: "Trade",
				prop: "diplomacyTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.ReligionTab,
				name: "tab.name.religion",
				id: "Religion",
				prop: "religionTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.SpaceTab,
				name: "tab.name.space",
				id: "Space",
				prop: "spaceTab"
			},
			{class: classes.tab.TimeTab,
				name: "tab.name.time",
				id: "Time",
				prop: "timeTab"
			},
			{class: classes.tab.ChallengesTab,
				name: "tab.name.challenges",
				id: "Challenges",
				prop: "challengesTab"
			},
			{class: com.nuclearunicorn.game.ui.tab.AchTab,
				name: "tab.name.achievements",
				id: "Achievements",
				prop: "achievementTab"
			},
			{class: classes.tab.StatsTab,
				name: "tab.name.stats",
				id: "Stats",
				prop: "statsTab"
			}
		];

		var game = this;
		dojo.forEach(tabRegistry, function(tab){
			var tabProp = new tab.class({
				name: $I(tab.name),
				id: tab.id
			}, game);
			tabProp.visible = true;
			game[tab.prop] = tabProp;
			//TODO: please don't rely on game.xxxTab, it's a candidate for removal

			game.addTab(tabProp);
		});

		//vvvv do not forget to toggle tab visibility below (see load method)

		this.timer = new classes.game.Timer();

		//Update village resource production.
		//Since this method is CPU heavy and rarely used, we will call with some frequency, but not on every tick
		this.timer.addEvent(dojo.hitch(this, function(){
			this.village.updateResourceProduction();
		}), 10);	//every 2 seconds

		this.timer.addEvent(dojo.hitch(this, function(){
			this.updateCaches();
		}), 5);		//once per 5 ticks

		var ONE_MIN = this.ticksPerSecond * 60;
		this.timer.addEvent(dojo.hitch(this, function(){ this.achievements.update(); }), 50);	//once per 50 ticks, we hardly need this
		this.timer.addEvent(dojo.hitch(this, function(){ this.server.refresh(); }), ONE_MIN * 10);	//reload MOTD and server info every 10 minutes
		this.timer.addEvent(dojo.hitch(this, function(){ this.heartbeat(); }), ONE_MIN * 10);	//send heartbeat every 10 min	//TODO: 30 min eventually
		this.timer.addEvent(dojo.hitch(this, function(){ this.updateWinterCatnip(); }), 25);	//same as achievements, albeit a bit more frequient
		this.timer.addEvent(dojo.hitch(this, function(){ this.ui.checkForUpdates(); }), ONE_MIN * 5);	//check new version every 5 min
		this.timer.addEvent(dojo.hitch(this, function(){ this.time.updateQueue(); }), 10 );

		this.effectsMgr = new com.nuclearunicorn.game.EffectsManager(this);
	},

	getFeatureFlag: function(flagId){
		var host = window.location.hostname;
		var isLocalhost = window.location.protocol == "file:" || host == "localhost" || host == "127.0.0.1";

		if (isLocalhost){
			return true;
		}

		var isBeta = (window.location.href.indexOf("beta") >= 0);
		return this.featureFlags[flagId][isBeta ? "beta" : "main"];
	},

	//update winter catnip consumption for the UI every 5-10 seconds to avoid calculating it every tick
	updateWinterCatnip: function(){
		this.winterCatnipPerTick = this.calcResourcePerTick("catnip", { modifiers:{
			"catnip" : 0.25
		}});	//calculate estimate winter per tick for catnip;
	},

    setDropboxClient: function(dropBoxClient) {
        this.dropBoxClient = dropBoxClient;
    },

	heartbeat: function(){
		this.telemetry.logEvent("heartbeat", {
			opts: this.opts,
			year: this.calendar.year
		});
	},

	/**
	 * Management of effects
	 */
	getEffectMeta: function(effectName) {
		// Try to create Meta automatically, if it fails, check statics, if it fails, by default
		var effectMetaDynamic = this.effectsMgr.effectMeta(effectName);
		if (effectMetaDynamic != 0) {
			return effectMetaDynamic;
		} else {
			var effectMetaStatic = this.effectsMgr.statics.effectMeta[effectName];
			if (typeof(effectMetaStatic) != "undefined") {
				return this.effectsMgr.statics.effectMeta[effectName];
			} else {
				return { title: effectName };
			}
		}
	},
	getEffect: function(effectName){
		 return this.globalEffectsCached[effectName] || 0;
	},

	updateCaches: function() {
		this.globalEffectsCached = {};

		this.workshop.updateEffectCached();
		this.religion.updateEffectCached();
		this.bld.updateEffectCached();
		this.challenges.updateEffectCached();
		this.prestige.updateEffectCached();
		this.space.updateEffectCached();
		this.time.updateEffectCached();
		this.village.updateEffectCached();
        this.science.updateEffectCached();
		
		this.bld.cacheCathPollutionPerTick();

		this.updateResources();

	},

	// Unlimited Diminishing Return
	//getHyperbolicEffect
	getLimitedDR: function(effect, limit) {
		var absEffect = Math.abs(effect);

		var maxUndiminished = 0.75 * limit; //first 75% is free from diminishing returns

		if (absEffect <= maxUndiminished) {
			//Not high enough for diminishing returns to apply
			return effect < 0 ? -absEffect : absEffect;
		}

		var diminishedPortion = absEffect - maxUndiminished;

		var delta = 0.25 * limit; //Lower values will approach 1 more quickly.

		// The last 25% will approach .25 but cannot actually reach it
		var diminishedEffect = (1 - (delta / (diminishedPortion + delta))) * delta;

		var totalEffect = maxUndiminished + diminishedEffect;

		return effect < 0 ? -totalEffect : totalEffect;
	},

	/**
	 * Display a message in the console. Returns a <span> node of a text container
	 */
	msg: function(message, type, tag, noBullet){

		var filters = dojo.clone(this.console.filters);
		if (tag && filters[tag]){
			var filter = filters[tag];

			if (!filter.enabled) {
				return;
			}
		}

		var hasCalendarTech = this.science.get("calendar").researched;

		if (hasCalendarTech){
			var currentDateMessage = $I("calendar.year.ext", [this.calendar.year.toLocaleString(), this.calendar.getCurSeasonTitle()]);
			if (this.lastDateMessage !== currentDateMessage) {
				this.console.msg(currentDateMessage, "date", null, false);
				this.lastDateMessage = currentDateMessage;
			}
		}

		var messageLine = this.console.msg(message, type, tag, noBullet);

		return messageLine;
	},

	clearLog: function(){
		dojo.empty("gameLog");
		this.console.clear();
		this.lastDateMessage = null;
	},

	saveUI: function(){
		this.save();

		dojo.style(dojo.byId("saveTooltip"), "opacity", "1");
		dojo.animateProperty({
			node:"saveTooltip",
			properties: {
				opacity: 0
			},
			duration: 1200
		}).play();
	},

	resetState: function(){
		this.forceShowLimits = false;
		this.useWorkers = false;
		this.colorScheme = "";
		this.unlockedSchemes = this.ui.defaultSchemes;
		this.karmaKittens = 0;
		this.karmaZebras = 0;
		this.ironWill = true;
		this.deadKittens = 0;
		this.cheatMode = false;
		this.systemShockMode = false;
		this.isCMBREnabled = false;

		if (this.pauseTimestamp){
			this.pauseTimestamp = Date.now();
		}

		this.opts = {
			usePerSecondValues: true,
			notation: "si",
			forceHighPrecision: false,
			usePercentageResourceValues: false,
			showNonApplicableButtons: false,
			usePercentageConsumptionValues: false,
			highlightUnavailable: true,
			hideSell: false,
			hideDowngrade: false,
			hideBGImage: false,
			tooltipsInRightColumn: false,
			noConfirm: false,
			IWSmelter: true,
			disableCMBR: false,
			disableTelemetry: false,
			enableRedshift: false,
			enableRedshiftGflops: false,
			batchSize: 10,
			// Used only in KG Mobile, hence it's absence in the rest of the code
			useLegacyTwoInRowLayout: false,
			forceLZ: false,
			compressSaveFile: false
		};

		this.resPool.resetState();
		this.village.resetState();
		this.calendar.resetState();
		this.ui.resetConsole();

		for (var i in this.managers){
			this.managers[i].resetState();
		}

		for (var i in this.tabs){
			if (this.tabs[i].tabId != "Bonfire"){
				this.tabs[i].visible = false;
			}
		}

		this.globalEffectsCached = {};
	},

	_publish: function(topic, arg){
		if (dojo.version.minor == 6) {
			dojo.publish(topic, [arg]);
		} else {
			dojo.publish(topic, arg);
		}
	},

	reload: function(){
		this.save();
		window.location.reload();
	},

	save: function(){
		this.ticksBeforeSave = this.autosaveFrequency;

		var saveData = {
			saveVersion: this.saveVersion,
			resources: this.resPool.filterMetadata(
				this.resPool.resources, ["name", "value", "unlocked", "isHidden"]
			)
		};

		this.server.save(saveData);
		this.resPool.save(saveData);
		this.village.save(saveData);
		this.calendar.save(saveData);
		this.console.save(saveData);
		this.telemetry.save(saveData);

        for (var i in this.managers){
            this.managers[i].save(saveData);
        }

		saveData.game = {
			forceShowLimits: this.forceShowLimits,
			isCMBREnabled: this.isCMBREnabled,
			useWorkers: this.useWorkers,
			colorScheme: this.colorScheme,
			unlockedSchemes: this.unlockedSchemes,
			karmaKittens: this.karmaKittens,
			karmaZebras: this.karmaZebras,
			ironWill : this.ironWill,
			deadKittens: this.deadKittens,
			cheatMode: this.cheatMode,

			opts : this.opts,
			lastBackup: this.lastBackup
		};

		var preparedSaveData = this._prepareSaveData(saveData);
		var saveDataString = this._saveDataToString(preparedSaveData);
		LCstorage["com.nuclearunicorn.kittengame.savedata"] = saveDataString;
		console.log("Game saved");

		this.ui.save();

		return preparedSaveData;
	},

	_prepareSaveData: function(saveData) {
		// Allow external scripts to consume the `game/beforesave` event to manipulate
		// this save data state.
		// This event is currently entirely for external consumers.
		this._publish("game/beforesave", saveData);

		return saveData;
	},

	_saveDataToString: function(saveData) {
		var saveDataString = JSON.stringify(saveData);
		//5mb limit workaround
		if (saveDataString.length > 5000000 || this.opts.forceLZ) {
			console.log("compressing the save file...");
			saveDataString = this.compressLZData(saveDataString, true);
		}
		return saveDataString;
	},

	_wipe: function(){
		this.timer.scheduleEvent(dojo.hitch(this, function() {
			this.mobileSaveOnPause = false;
			delete(LCstorage["com.nuclearunicorn.kittengame.savedata"]);
			delete(LCstorage["com.nuclearunicorn.kittengame.language"]);// it is the only way to clear it up
			window.location.reload();
		}));
	},

	wipe: function() {
		var game = this;
		this.ui.confirm($I("wipe.confirmation.title"), $I("wipe.confirmation.msg1"), function() {
			game.ui.confirm($I("wipe.confirmation.title"), $I("wipe.confirmation.msg2"), function() {
				game._wipe();
			});
		});
	},

	closeOptions: function() {
		$("#optionsDiv").hide();
		this.render();
	},

	toggleScheme: function(themeId){
		this.colorScheme = themeId;
		this.updateOptionsUI();
	},

	togglePause: function(){
		var pauseBtn = dojo.byId("pauseBtn");
		this.isPaused = !this.isPaused;
		pauseBtn.innerHTML = this.isPaused ? $I("ui.unpause") : $I("ui.pause");

		if (this.isPaused){
			this.pauseTimestamp = Date.now();
		} else if (this.pauseTimestamp){
			this.time.gainTemporalFlux(this.pauseTimestamp);
			this.pauseTimestamp = 0;
		}
	},

	updateOptionsUI: function(){
		this.ui.updateOptions();
        this._publish("game/options", this);
	},

	/**
	 * Returns a save data JSON from a base64 or utf16 compressed lz blob
	 * Use this instead of LZString.decompressX
	 */
	decompressLZData: function(lzData) {
		var decompressedAsBase64 = LZString.decompressFromBase64(lzData);
		return decompressedAsBase64 && decompressedAsBase64[0] == "{"
			? decompressedAsBase64
			: LZString.decompressFromUTF16(lzData);
	},

	compressLZData: function(json, useUTF16) {
		//todo check game compatibility flags
		//console.log("base64 length:", LZString.compressToBase64(json).length, "utf-16 length:", LZString.compressToUTF16(json).length);
		return useUTF16
			? LZString.compressToUTF16(json)
			: LZString.compressToBase64(json);
	},

	_parseLSSaveData: function(){
		var data = null;
		var localStorageData = LCstorage["com.nuclearunicorn.kittengame.savedata"];

		if (localStorageData && localStorageData[0] == "{"){
			data = localStorageData;
		} else {
			data = this.decompressLZData(localStorageData);
		}
		var saveData = JSON.parse(data);

		//console.log("Parse _parseLSSaveData complete, data:", data, "saveData:", saveData);
		return saveData;
	},

	load: function(){
		var data = LCstorage["com.nuclearunicorn.kittengame.savedata"];
		this.resetState();
		if (!data){
			this.calculateAllEffects();
			this.updateOptionsUI();
			return;
		}
		var success = true;

		try {
			var saveData = this._parseLSSaveData();
			if (saveData){

				console.log("game#load - Successfully parsed local storage data, loading tab managers...");

				if (saveData.server){
					this.server.motdContentPrevious = saveData.server.motdContent;
				}

				if (!saveData.saveVersion || saveData.saveVersion != this.saveVersion) {
					this.migrateSave(saveData);
				}

				this.resPool.load(saveData);
				this.village.load(saveData);
				this.calendar.load(saveData);
				this.console.load(saveData);
				this.telemetry.load(saveData);
				this.ui.renderFilters();

                for (var i in this.managers){
					console.log("game#load - Processing", this.managers[i].id, "...");
                    this.managers[i].load(saveData);
                }

				this._publish("server/load", saveData);
			}
		} catch (ex) {
			console.error("Unable to load game data: ", ex);
			if (dojo.version.minor == 6) {
				console.log(new Error().stack);
			} else {
				console.trace();
			}

			this.msg("Unable to load save data. Contact the devs and provide the faulty save file.", "important");
			success = false;
		}


		if (saveData && saveData.game){
			var data = saveData.game;

			//something should really be done with this mess there
			this.forceShowLimits = data.forceShowLimits ? data.forceShowLimits : false;
			this.colorScheme = data.colorScheme ? data.colorScheme : null;
			this.unlockedSchemes = data.unlockedSchemes ? data.unlockedSchemes : this.ui.defaultSchemes;

			this.karmaKittens = (data.karmaKittens !== undefined) ? data.karmaKittens : 0;
			this.karmaZebras = (data.karmaZebras !== undefined) ? data.karmaZebras : 0;
			this.deadKittens = (data.deadKittens !== undefined) ? data.deadKittens : 0;
			this.ironWill = (data.ironWill !== undefined) ? data.ironWill : true;
			this.useWorkers = (data.useWorkers !== undefined) ? data.useWorkers : false;

			this.cheatMode = (data.cheatMode !== undefined) ? data.cheatMode : false;

			this.isCMBREnabled = (data.isCMBREnabled !== undefined) ? data.isCMBREnabled : true;	//true for all existing games
			this.lastBackup = data.lastBackup || new Date().getTime();

			// ora ora
			if (data.opts) {
				for (var opt in data.opts) {
					this.opts[opt] = data.opts[opt];
				}
				if (data.opts.tooltipsInRightColumn == undefined) {
					this.opts.tooltipsInRightColumn = this.colorScheme == "sleek";
				}
			}

			this.updateOptionsUI();
		}
		// Calculate effects (needs to be done after all managers and save data are loaded)
		this.calculateAllEffects();
		//------------------------------------

		this.villageTab.visible = (this.bld.get("hut").on > 0
			|| this.resPool.get("kittens").unlocked
			|| this.resPool.get("zebras").unlocked
			|| this.time.getVSU("usedCryochambers").val > 0);
		this.libraryTab.visible = (this.bld.get("library").on > 0 || this.science.get("calendar").researched || this.science.get("chronophysics").researched);
		this.workshopTab.visible = (this.bld.get("workshop").on > 0);
		this.achievementTab.visible = (this.achievements.hasUnlocked());
		this.statsTab.visible = (this.karmaKittens > 0 || this.science.get("math").researched);

		this.diplomacyTab.visible = (this.diplomacy.hasUnlockedRaces());
		this.religionTab.visible = (
			this.resPool.get("faith").value > 0 || 
			this.challenges.isActive("atheism") && 
			this.bld.get("ziggurat").val > 0);

		this.spaceTab.visible = (this.science.get("rocketry").researched);
		this.timeTab.visible = (
			this.science.get("calendar").researched || 
			this.time.getVSU("usedCryochambers").val > 0);
			
		this.challengesTab.visible = (
			this.prestige.getPerk("adjustmentBureau").researched || 
			this.prestige.getPerk("adjustmentBureau").reserve);

		this.ui.load();
		this.updateCaches();

		return success;
	},

	//btw, ie11 is horrible crap and should not exist
	saveExport: function(){
		var data = this.save();
		data = JSON.stringify(data);

        var encodedData = this.compressLZData(data);
        this.ui.saveExport(encodedData);

	},

	saveImport: function() {
		var game = this;
		this.ui.confirm("", $I("save.import.confirmation.msg"), function() {
			var data = $("#importData").val().replace(/\s/g, "");
			if (data) {
				game.saveImportDropboxText(data, function(error) {
					$("#importDiv").hide();
					$("#optionsDiv").hide();
				});
			}
		});
	},

    saveToFile: function(withFullName) {
        var $link = $("#download-link");

        var data = JSON.stringify(this.save());
        var lzdata = this.compressLZData(data);
        var blob = new Blob([lzdata], {type: "text/plain"});
        $link.attr("href", window.URL.createObjectURL(blob));

        var filename = "Kittens Game";
        if (withFullName) {
            filename += " - Run " + (this.stats.getStat("totalResets").val + 1)
                + " - " + $I("calendar.year.full", [this.calendar.year, this.calendar.getCurSeasonTitle(), Math.floor(this.calendar.day)]);
        }
        $link.attr("download", filename + ".txt");

        $link.get(0).dispatchEvent(new MouseEvent("click"));
	},

	saveExportDropbox: function(){
		this.save();
		var data = this.save();
		data = JSON.stringify(data);
		var lzdata = this.compressLZData(data);


        var callback = function() {
            $("#exportDiv").hide();
            $("#optionsDiv").hide();
        };

		this.exportToDropbox(lzdata, callback);
	},

	getDropboxAuthUrl: function (){
		var host = window.location.host;
		var redirectUrl = "/games/kittens/dropboxauth_v2.html";
		if (host.indexOf("kittensgame") > -1){
			redirectUrl = "/dropboxauth_v2.html";
		}
		var authUrl = this.dropBoxClient.getAuthenticationUrl("https://" + window.location.host + redirectUrl);
		return authUrl;
	},

	exportToDropbox: function(lzdata, callback) {
		var game = this;
		var authUrl = game.getDropboxAuthUrl();
		window.open(authUrl, "DropboxAuthPopup", "dialog=yes,dependent=yes,scrollbars=yes,location=yes");
		var handler = function(e) {
			window.removeEventListener("message", handler);

			if (window.location.origin !== e.origin) {
				callback("Unable to save file");
			} else {
				var dbxt = new Dropbox.Dropbox({accessToken: e.data["#access_token"]});
				dbxt.filesUpload({
					path: "/kittens.save",
					contents: lzdata,
					mode: "overwrite"
				}).then(function (response) {
					game.msg($I("save.export.msg"));
					callback();
				}).catch(function (error) {
					callback("Unable to save file:" + JSON.stringify(error));
				});
			}
		};
		window.addEventListener("message", handler ,false);
	},

	saveImportDropbox: function() {
		var game = this;
		this.ui.confirm("", $I("save.import.confirmation.msg"), function() {
			game.importFromDropbox(function(error) {
				$("#importDiv").hide();
				$("#optionsDiv").hide();
			});
		});
	},

	importFromDropbox: function (callback) {
		var game = this;
		var authUrl = game.getDropboxAuthUrl();

		window.open(authUrl, "DropboxAuthPopup", "dialog=yes,dependent=yes,scrollbars=yes,location=yes");
		var handler = function(e) {
			window.removeEventListener("message", handler);
			if (window.location.origin !== e.origin) {
				callback("Unable to load file");
			} else {
				var dbxt = new Dropbox.Dropbox({accessToken: e.data["#access_token"]});
				dbxt.filesDownload({path: "/kittens.save"}).then(function (response) {
					var blob = response.fileBlob;
					var reader = new FileReader();
					reader.addEventListener("loadend", function() {
						game.saveImportDropboxText(reader.result, callback);
					});
					reader.readAsText(blob);
				}).catch(function (error) {
					callback("Unable to load file:" + JSON.stringify(error));
				});
			}
		};
		window.addEventListener("message", handler ,false);
	},

    saveImportDropboxFileRead: function(callback){
        var game = this;
        this.dropBoxClient.readFile("kittens.save", {}, function (error, lzdata){
            if (error) {
                callback(error);
            } else {
                game.saveImportDropboxText(lzdata, callback);
            }
        });
    },

    saveImportDropboxText: function(lzdata, callback){
        this.timer.scheduleEvent(dojo.hitch(this, this._loadSaveJson, lzdata, callback));
    },

	//TODO: add some additional checks and stuff?
	_loadSaveJson: function(lzdata, callback){
        try {
			var jsonString = this.decompressLZData(lzdata);
			if (jsonString && jsonString[0] == "{"){
				LCstorage["com.nuclearunicorn.kittengame.savedata"] = lzdata;
			} else {
				throw "Integrity check failure";
			}

			this.loadingSave = true;
			this.load();
			this.loadingSave = false;
			this.msg($I("save.import.msg"));

			this.render();

            callback();
        } catch (e) {
            console.log("Couldn't import the save of the game:", e.stack);
            callback(e);
        }
	},

	/**
	 * Oh brave and noble soul, before adding a line to this method, please read this:
	 * 
	 * My intention for KG was to have a game where you would never have a method called a 'migrate save'
	 * I lost this battle long time ago and here we are.
	 * 
	 * Save migration must be considered as a measure of a last resolve, when everything else fails
	 * Whenever possible, we should resolve to the code being backward compatible. Every time we bump a save version,
	 * god kills a kitten somewhere.
	 */

	migrateSave: function(save) {
		if (save.saveVersion === undefined) {
			save.saveVersion = 1;
		}

		if (save.saveVersion == 1) {
			// Move Lunar Outpost and Moon Base from programs to moon planet
			if (save.space && save.space.programs && save.space.planets) {
				var buildings = [];
				for (var i = 0; i < save.space.programs.length; i++) {
					var program = save.space.programs[i];
					if (program.name == "moonOutpost" || program.name == "moonBase") {
						program.unlocked = true;
						buildings.push(program);
						save.space.programs.splice(i, 1);
						// Next element has moved back into current index because of splice
						i--;
					}
				}
				for (var i = 0; i < save.space.planets.length; i++) {
					if (save.space.planets[i].name == "moon") {
						save.space.planets[i].buildings = buildings;
						break;
					}
				}
			}

			save.saveVersion = 2;
		}

		if (save.saveVersion == 2) {
			// Move !noStackable programs from programs to cath planet
			if (save.space && save.space.programs && save.space.planets) {
				var buildings = [];
				for (var i = 0; i < save.space.programs.length; i++) {
					var program = save.space.programs[i];
					if (program.name == "spaceElevator" || program.name == "sattelite" || program.name == "spaceStation") {
						program.unlocked = true;
						buildings.push(program);
						save.space.programs.splice(i, 1);
						// Next element has moved back into current index because of splice
						i--;
					}
				}
				save.space.planets.push({name: "cath", buildings: buildings});
			}

			save.saveVersion = 3;
		}

		if (save.saveVersion == 3) {
			// Use .on instead of .val and .enabled for all buildings
			if (save.buildings) {
				for (var i = 0; i < save.buildings.length; i++) {
					save.buildings[i].on = save.buildings[i].val;
				}
			}

			save.saveVersion = 4;
		}

		if (save.saveVersion == 4) {
			// Use .on instead of .val and .enabled for all buildings
			if (save.religion && save.religion.ru) {
				for (var i = 0; i < save.religion.ru.length; i++) {
					var saveRU = save.religion.ru[i];
					// Hack to fix old saves
					if (saveRU.researched && (saveRU.val == 0 || saveRU.val == null)) {
						saveRU.val = 1;
					}
					saveRU.on = saveRU.val;
				}
			}
			if (save.space) {
				if (save.space.programs) {
					for (var i = 0; i < save.space.programs.length; i++) {
						if (save.space.programs[i].researched) {
							save.space.programs[i].on = 1;
							save.space.programs[i].val = 1;
						}
					}
				}
				if (save.space.planets) {
					for (i = 0; i < save.space.planets.length; i++){
						var planet = save.space.planets[i];
						if (planet.buildings){
							for (var j = 0; j < planet.buildings.length; j++){
								var building = planet.buildings[j];
								building.on = building.val;
							}
						}
					}
				}
			}

			save.saveVersion = 5;
		}

		if (save.saveVersion == 5) {
			// Move energy into a true resource
			if (save.time && save.time.energy && save.resources) {
				var changement = false;
				for (var i = 0; i < save.resources.length; i++) {
					var res = save.resources[i];
					if (res.name == "temporalFlux") {
						res.value = save.time.energy;
						changement = true;
						break;
					}
				}
				if (!changement) {
					var resTE = {
						name : "temporalFlux",
						title:  $I("resources.temporalFlux.title"),
						description: "",
						type : "exotic",
						craftable: false,
						visible: false,
						persists: true,
						value: save.time.energy
					};
					save.resources.push(resTE);
				}
			}

			save.saveVersion = 6;
		}

		if (save.saveVersion == 6) {
			if (save.religion){
				if (save.religion.zu) {
					for (i = 0; i < save.religion.zu.length; i++){
						save.religion.zu[i].on = save.religion.zu[i].val;
					}
				}
				if (save.religion.tu) {
					for (i = 0; i < save.religion.tu.length; i++){
						save.religion.tu[i].on = save.religion.tu[i].val;
					}
				}
			}
			if (save.time){
				if (save.time.usedCryochambers) {
					for (i = 0; i < save.time.usedCryochambers.length; i++){
						save.time.usedCryochambers[i].on = save.time.usedCryochambers[i].val;
					}
				}
				if (save.time.cfu) {
					for (i = 0; i < save.time.cfu.length; i++){
						save.time.cfu[i].on = save.time.cfu[i].val;
					}
				}
				if (save.time.vsu) {
					for (i = 0; i < save.time.vsu.length; i++){
						save.time.vsu[i].on = save.time.vsu[i].val;
					}
				}
			}

			save.saveVersion = 8;
		}

		if (save.saveVersion == 8) {
			if (typeof(save.challenges) == "undefined"){
				save.challenges = [];
			}
			save.challenges.currentChallenge = null;
			save.saveVersion = 9;
		}

		if (save.saveVersion == 9) {
			if (save.buildings) {
				for(var i = 0; i < save.buildings.length; i++){
					save.buildings[i].unlockable = save.buildings[i].unlocked;
					save.buildings[i].unlocked = false;
				}
			}
			if (save.space && save.space.programs) {
				for (var i = 0; i < save.space.programs.length; i++) {
					if (save.space.programs[i].name == "rorschachMission" && save.space.programs[i].on == 1) {
						var centaurusSystemMission = {
							name: "centaurusSystemMission",
							val: 0,
							on: 0,
							unlocked: true
						};
						save.space.programs.push(centaurusSystemMission);
					}
				}
			}

			save.saveVersion = 10;
		}

		if (save.saveVersion == 10) {
			if (save.resources){
				for(var i = 0; i < save.resources.length; i++){
					save.resources[i].unlocked = false;
				}
			}

			save.saveVersion = 11;
		}

		if (save.saveVersion == 11) {
			if (typeof(save.challenges) == "undefined"){
				save.challenges = [];
			}
			if (save.religion && save.religion.ru) {
				for (var i = 0; i < save.religion.ru.length; i++) {
					if (save.religion.ru[i].name == "transcendence" && save.religion.ru[i].on == 1) {
						var atheism = {
							name: "atheism",
							researched: false,
							unlocked: true
						};
						if (typeof save.challenges.challenges == "undefined") {
							save.challenges.challenges = [];
						}
						save.challenges.challenges.push(atheism);
						break;
					}
				}
			}

			save.saveVersion = 12;
		}

		if (save.saveVersion == 12) {
			if (save.religion && save.religion.tcratio && save.religion.tu) {
				var transcendenceLevel = Math.max(0, Math.round(Math.log(10 * this.game.getUnlimitedDR(save.religion.tcratio, 0.1))));
				for (var i = 0; i < save.religion.tu.length; i++) {
					if (transcendenceLevel >= this.religion.getTU(save.religion.tu[i].name).tier) {
						save.religion.tu[i].unlocked = true;
					}
				}
			}

			save.saveVersion = 13;
		}

		if (save.saveVersion == 13) {
			if (save.challenges && save.challenges.challenges) {
				for (var i = 0; i < save.challenges.challenges.length; i++) {
					if (save.challenges.challenges[i].name == "atheism") {

						save.challenges.challenges[i].unlocked = false;

						if (save.science && save.science.techs) {
							for (var j = 0; j < save.science.techs.length; j++) {
								if (save.science.techs[j].name == "voidSpace" && save.science.techs[j].researched == true) {
									save.challenges.challenges[i].unlocked = true;
								}
							}
						}

					}
				}
			}

			save.saveVersion = 14;
		}

		if (save.saveVersion == 14) {
			if (save.space && save.space.planets) {
				for (var i in save.space.planets){
					var planet = save.space.planets[i];
					if (planet.buildings){
						for (var j in planet.buildings) {
							var building = planet.buildings[j];
							if (typeof(building.unlocked) != "undefined") {
								building.unlockable = building.unlocked;
							} else {
								building.unlockable = false;
							}
						}
					}
				}
			}

			save.saveVersion = 15;
		}

		return save;

	},

    setUI: function(ui){
        this.ui = ui;
        ui.setGame(this);
        this.console.ui = ui;
    },

	render: function(){
        if (!this.ui){
            throw "Unable to render game state, no UI manager";
        }

        this.ui.render();

		// Once we have rendered the page immidiately update it in order to
		// reduce flicker
		this.update();
		this.calendar.update();
	},

	/**
	 * Returns an estimated production amount per tick for a given resource.
	 *
	 * If calcAutomatedEffect is true, it will also estimate the conditional effects for automated structures,
	 * like smelters or calciners. calcAutomatedEffect should be typically off, or you will give DOUBLE resources for auto structures
	 *
	 * If season is provided, the method will use given season modifiers for resource estimation.
	 * Current resource will be used otherwise.
	 */


	//====================== ONE DAY =====================================
	/*getResourcePerTick: function(resName, calcAutomatedEffect, season){
		var stack = this.getResourcePerTickStack(resName, season);
		var perTick = this.getStackPerTick(stack, calcAutomatedEffect, season);

		return perTick;
	},

	getStackPerTick: function(stack, calcAutomatedEffect, season){
		var perTick = 0;

		for (var i = 0; i< stack.length; i++){
			var s = stack[i];

			if (s.length){
				perTick += this.getStackPerTick(s, calcAutomatedEffect, season) || 0;
			}

			if (s.automated && !calcAutomatedEffect){
				continue;
			}

			if (s.type == "fixed"){
				perTick += s.value || 0;
			} else if (s.type == "ratio"){
				perTick *= (1 + s.value || 0);
			}

		}

		if (isNaN(perTick)){
			return 0;
		}
		return perTick;
	}, */

	calcResourcePerTick: function(resName, season){
		var res = this.resPool.get(resName);

		// BUILDING PerTickBase
		var perTick = this.getEffect(res.name + "PerTickBase");

		// SPACE RATIO CALCULATION
		var spaceRatio = 1 + this.getEffect("spaceRatio");
		if (this.workshop.get("spaceManufacturing").researched && res.name != "uranium"){
			var factory = this.bld.get("factory");
			spaceRatio *= (1 + factory.on * factory.effects["craftRatio"] * 0.75);
		}

		// +SPACE PerTickBase
		var perTickBaseSpace = this.getEffect(res.name + "PerTickBaseSpace") * spaceRatio;

		perTick += perTickBaseSpace;

		// *SEASON MODIFIERS
		perTick *= this.calendar.getWeatherMod(res);

		// +VILLAGE JOB PRODUCTION
		var resMapProduction = this.village.getResProduction();
		var resProduction = resMapProduction[res.name] ? resMapProduction[res.name] : 0;
		
		// +HOLY GENOCIDE SCALING BONUS

		//TODO: calculate prod scaling effect differently for HG
		var hgScalingBonus = this.religion.getHGScalingBonus();
		
		//var hgScalingBonus = Math.pow(1.01, this.religion.getTU("holyGenocide").val * 2);
		resProduction = resProduction * hgScalingBonus;

		//resProduction = resProduction * (1 + this.getEffect("simScalingRatio"));
		perTick += resProduction;

		// +VILLAGE JOB PRODUCTION (UPGRADE EFFECTS JOBS)
		var workshopResRatio = this.getEffect(res.name + "JobRatio");
		perTick += resProduction * workshopResRatio;


		// +*BEFORE PRODUCTION BOOST (UPGRADE EFFECTS GLOBAL)
		perTick *= 1 + this.getEffect(res.name + "GlobalRatio");

		// +*BUILDINGS AND SPACE PRODUCTION
		perTick *= 1 + this.getEffect(res.name + "Ratio");

		// +*RELIGION EFFECTS
		perTick *= 1 + this.getEffect(res.name + "RatioReligion");

		// +*AFTER PRODUCTION BOOST (UPGRADE EFFECTS SUPER)
		perTick *= 1 + this.getEffect(res.name + "SuperRatio");

		// +*AFTER PRODUCTION REDUCTION (SPECIAL STEAMWORKS HACK FOR COAL)
		var steamworks = this.bld.get("steamworks");
		var swEffectGlobal = steamworks.effects[res.name + "RatioGlobal"];
		if (steamworks.on > 0 && swEffectGlobal) {
			perTick *= 1 + swEffectGlobal;
		}

		// *PARAGON BONUS
		var paragonProductionRatio = this.prestige.getParagonProductionRatio();
		if (resName == "catnip" && this.challenges.isActive("winterIsComing")) {
			paragonProductionRatio = 0; //winter has come
		}

		perTick *= 1 + paragonProductionRatio;

		// *POLLUTION MODIFIER
		if(res.name == "catnip"){
			perTick *= 1 + this.bld.pollutionEffects["catnipPollutionRatio"];
		}

		//ParagonSpaceProductionRatio definition 1/4
		var paragonSpaceProductionRatio = 1 + paragonProductionRatio * 0.05;

		// +BUILDING AUTOPROD
		var perTickAutoprod = this.getEffect(res.name + "PerTickAutoprod");
		    perTickAutoprod *= paragonSpaceProductionRatio;
			perTickAutoprod *= (1 + this.getEffect("rankLeaderBonusConversion") * ((this.village.leader) ? this.village.leader.rank : 0));
		perTick += perTickAutoprod;

		// *MAGNETOS PRODUCTION BONUS
		if (!res.transient && this.bld.get("magneto").on > 0 && res.name != "catnip"){

			var steamworks = this.bld.get("steamworks");
			var swRatio = steamworks.on > 0 ? (1 + steamworks.effects["magnetoBoostRatio"] * steamworks.on) : 1;
			if (res.name != "oil"){
				perTick *= 1 + (this.getEffect("magnetoRatio") * swRatio);
			}

			//ParagonSpaceProductionRatio definition 2/4
			paragonSpaceProductionRatio += paragonSpaceProductionRatio * this.getEffect("magnetoRatio") * swRatio; //These special cases need to die in a hole

		}

		// +*REACTOR PRODUCTION BONUS
		if (!res.transient && res.name != "uranium" && res.name != "catnip"){
			perTick *= 1 + this.getEffect("productionRatio");

			//ParagonSpaceProductionRatio definition 3/4
			paragonSpaceProductionRatio += paragonSpaceProductionRatio * this.getEffect("productionRatio");
		}

		// +*FAITH BONUS
		perTick *= 1 + this.religion.getSolarRevolutionRatio() * (1 + ((res.name == "wood" || res.name == "catnip")? this.bld.pollutionEffects["solarRevolutionPollution"] : 0));
		
		//+COSMIC RADIATION
		if (!this.opts.disableCMBR && res.name != "coal") {
			perTick *= 1 + this.getCMBRBonus();
		}

		//ParagonSpaceProductionRatio definition 4/4
		paragonSpaceProductionRatio *= 1 + this.religion.getSolarRevolutionRatio();

		// +AUTOMATED PRODUCTION BUILDING
		perTick += this.getEffect(res.name + "PerTickProd");

		// +AUTOMATED PRODUCTION SPACE (FULL BONUS)
		perTick += (this.getEffect(res.name + "PerTickAutoprodSpace") * spaceRatio) * (1 + (paragonSpaceProductionRatio - 1) * this.getEffect("prodTransferBonus"));
		// +AUTOMATED PRODUCTION SPACE (NOT FULL BONUS)
		perTick += this.getEffect(res.name + "PerTickSpace") * spaceRatio;


		//CYCLE EFFECTS
		// Already added because it's space building improvements.

		//CYCLE FESTIVAL EFFECTS

		var effects = {};
		effects[resName] = perTick;
		this.calendar.cycleEffectsFestival(effects);
		perTick = effects[resName];

		// +BUILDING AND SPACE PerTick
		perTick += this.getEffect(res.name + "PerTick") * (1+ this.getEffect(res.name + "PerTickRatio"));

		// -EARTH CONSUMPTION
		var resMapConsumption = this.village.getResConsumption();
		var resConsumption = resMapConsumption[res.name] || 0;
		resConsumption *= 1 + this.getEffect(res.name + "DemandRatio");
		if (res.name == "catnip" && this.village.sim.kittens.length > 0 && this.village.happiness > 1) {
			var hapinnessConsumption = Math.max(this.village.happiness * (1 + this.getEffect("hapinnessConsumptionRatio")) - 1, 0);
			if (this.challenges.isActive("anarchy")) {
				resConsumption += resConsumption * hapinnessConsumption * (1 + this.getEffect(res.name + "DemandWorkerRatioGlobal"));
			} else {
				resConsumption += resConsumption * hapinnessConsumption * (1 + this.getEffect(res.name + "DemandWorkerRatioGlobal")) * (1 - this.village.getFreeKittens() / this.village.sim.kittens.length);
			}
		}
		// +POLICY EFFECTS

		//necrocracy global effect
		perTick *= (1 + (this.resPool.get("sorrow").value * this.getEffect("blsProductionBonus")));
		//pact Global Production Ratio- effect from pacts per pyramid
		var pyramidGlobalProductionRatio = this.getEffect("pyramidGlobalProductionRatio");
		perTick *= 1 + pyramidGlobalProductionRatio;

		//pyramid faith ratio
		if(res.name=="faith"){
			var pyramidFaithRatio = this.getEffect("pyramidFaithRatio");
			perTick *= 1 + pyramidFaithRatio;
		}
		//policy ratio effects
		perTick *= (1 + this.getEffect(res.name + "PolicyRatio"));

		perTick += resConsumption;
		if (isNaN(perTick)){
			return 0;
		}

		return perTick;
	},
	addGlobalModToStack: function(array, resName){
		var game = this;
		if(game.science.getPolicy("necrocracy").researched){
			array.push({
				name: $I("res.stack.necrocracy"),
				type: "ratio",
				value: game.getEffect("blsProductionBonus") * game.resPool.get("sorrow").value,
			});
		}
		array.push({
			name: $I("res.stack.policy"),
			type: "ratio",
			value: game.getEffect(resName + "PolicyRatio")
		});
		array.push({
			name: $I("res.stack.destruction"),
			type: "ratio",
			value: game.getEffect("pyramidGlobalProductionRatio")
		});
		return array;
	},
	/**
	 * Generates a stack of resource modifiers. (TODO: use it with resource per tick calculation logic)
	 */
	getResourcePerTickStack: function(resName, calcAutomatedEffect, season){
		var stack = [];

		var res = null;
		for (var i in this.resPool.resources){
			var _res = this.resPool.resources[i];
			if (_res.name == resName){
				res = _res;
				break;
			}
		}

		if (!res){
			//console.error("Unable to fetch resource stack for resName '" + resName + "'");
			return;
		}

		// BUILDING PerTickBase
		stack.push({
			name: $I("res.stack.production"),
			type: "fixed",
			value: this.getEffect(res.name + "PerTickBase")
		});

		// SPACE RATIO CALCULATION
		var spaceRatio = 1 + this.getEffect("spaceRatio");
		if (this.workshop.get("spaceManufacturing").researched && res.name != "uranium"){
			var factory = this.bld.get("factory");
			spaceRatio *= (1 + factory.on * factory.effects["craftRatio"] * 0.75);
		}

		// +SPACE PerTickBase
		var perTickBaseSpaceStack = [];
		//---->
			perTickBaseSpaceStack.push({
				name: $I("res.stack.spaceProduction"),
				type: "fixed",
				value: this.getEffect(res.name + "PerTickBaseSpace")
			});
			perTickBaseSpaceStack.push({
				name: $I("res.stack.spaceProductionBonus"),
				type: "ratio",
				value: spaceRatio - 1
			});
			this.addGlobalModToStack(perTickBaseSpaceStack, resName);
		//<----
		stack.push(perTickBaseSpaceStack);

		// *SEASON MODIFIERS
		stack.push({
			name: $I("res.stack.weather"),
			type: "ratio",
			value: this.calendar.getWeatherMod(res) - 1
		});

		// +VILLAGE JOB PRODUCTION
		var resMapProduction = this.village.getResProduction();
		var hgScalingBonus = this.religion.getHGScalingBonus() - 1;
		var villageStack = [];
		//---->
				villageStack.push({
					name: $I("res.stack.village"),
					type: "fixed",
					value: resMapProduction[res.name] || 0
				});
				villageStack.push({
					name: $I("res.stack.holyGenocide"),
					type: "ratio",
					value: hgScalingBonus
				});
				villageStack.push({
					name: $I("res.stack.tools"),
					type: "ratio",
					value: this.getEffect(res.name + "JobRatio")
				});
		//<----
		stack.push(villageStack);

		// +*BEFORE PRODUCTION BOOST (UPGRADE EFFECTS GLOBAL)
		stack.push({
			name: $I("res.stack.upgrades"),
			type: "ratio",
			value: this.getEffect(res.name + "GlobalRatio")
		});

		// +*BUILDINGS AND SPACE PRODUCTION
		stack.push({
			name: $I("res.stack.buildings"),
			type: "ratio",
			value: this.getEffect(res.name + "Ratio")
		});

		// +*RELIGION EFFECTS
		stack.push({
			name: $I("res.stack.religion"),
			type: "ratio",
			value: this.getEffect(res.name + "RatioReligion")
		});

		// +*AFTER PRODUCTION BOOST (UPGRADE EFFECTS SUPER)
		stack.push({
			name: $I("res.stack.boost"),
			type: "ratio",
			value: this.getEffect(res.name + "SuperRatio")
		});

		// +*AFTER PRODUCTION REDUCTION (SPECIAL STEAMWORKS HACK FOR COAL)
		var steamworks = this.bld.get("steamworks");
		var swEffectGlobal = steamworks.effects[res.name + "RatioGlobal"];
		if (steamworks.on > 0 && swEffectGlobal ){
			stack.push({
				name: $I("res.stack.steamworks"),
				type: "ratio",
				value: swEffectGlobal
			});
		}

		// *PARAGON BONUS
		var paragonProductionRatio = this.prestige.getParagonProductionRatio();
		if (resName == "catnip" && this.challenges.isActive("winterIsComing")) {
			paragonProductionRatio = 0; //winter has come
		}

		stack.push({
			name: $I("res.stack.paragon"),
			type: "ratio",
			value: paragonProductionRatio
		});

		// *POLLUTION MODIFIER
		if(res.name == "catnip"){
			stack.push({
				name: $I("res.stack.pollution"),
				type: "ratio",
				value: this.bld.pollutionEffects["catnipPollutionRatio"]
			});
		}

		//ParagonSpaceProductionRatio definition 1/4
		var paragonSpaceProductionRatio = 1 + paragonProductionRatio * 0.05;
		var rankLeaderBonusConversion = this.getEffect("rankLeaderBonusConversion") * ((this.village.leader) ? this.village.leader.rank : 0);
		// +BUILDING AUTOPROD
		var buildingAutoprod = [];
		// ---->
			buildingAutoprod.push({
				name: $I("res.stack.convProd"),
				type: "fixed",
				value: this.getEffect(res.name + "PerTickAutoprod")
			});
			buildingAutoprod.push({
				name: $I("res.stack.paragon"),
				type: "ratio",
				value: paragonProductionRatio * 0.05
			});
			buildingAutoprod.push({
				name: $I("res.stack.rankLeaderBonusConversion"),
				type: "ratio",
				value: rankLeaderBonusConversion
			});
		//<----
		stack.push(buildingAutoprod);

		// *MAGNETOS PRODUCTION BONUS
		if (!res.transient && this.bld.get("magneto").on > 0 && res.name != "catnip"){

			var steamworks = this.bld.get("steamworks");
			var swRatio = steamworks.on > 0 ? (1 + steamworks.effects["magnetoBoostRatio"] * steamworks.on) : 1;
			if (res.name != "oil"){
				stack.push({
					name: $I("res.stack.magnetos"),
					type: "ratio",
					value: this.getEffect("magnetoRatio") * swRatio
				});
			}

			//ParagonSpaceProductionRatio definition 2/4
			paragonSpaceProductionRatio += paragonSpaceProductionRatio * this.getEffect("magnetoRatio") * swRatio; //These special cases need to die in a hole
		}

		// +*REACTOR PRODUCTION BONUS
		if (!res.transient && res.name != "uranium" && res.name != "catnip") {
			stack.push({
				name: $I("res.stack.reactors"),
				type: "ratio",
				value: this.getEffect("productionRatio")
			});

			//ParagonSpaceProductionRatio definition 3/4
			paragonSpaceProductionRatio += paragonSpaceProductionRatio * this.getEffect("productionRatio");

		}

		// +*FAITH BONUS
		stack.push({
			name: $I("res.stack.solarRevolution"),
			type: "ratio",
			value: this.religion.getSolarRevolutionRatio()
		});
		if((res.name == "wood" || res.name == "catnip") && this.religion.getSolarRevolutionRatio() > 0){
			stack.push({
				name: $I("res.stack.pollution"),
				type: "ratioIndent",
				value: this.bld.pollutionEffects["solarRevolutionPollution"]
			});
		}

		if (!this.opts.disableCMBR && res.name != "coal") {
			stack.push({
				name: "CMBR",
				type: "ratio",
				value: this.getCMBRBonus()
			});
		}

		//ParagonSpaceProductionRatio definition 4/4
		paragonSpaceProductionRatio *= 1 + this.religion.getSolarRevolutionRatio();
		
        //policy effects:
		//necrocracy global effect
		//TODO: consider moving it to calculateEffects
        if(this.science.getPolicy("necrocracy").researched){
            stack.push({
                name: $I("res.stack.necrocracy"),
                type: "ratio",
                value: this.getEffect("blsProductionBonus") * this.resPool.get("sorrow").value,
            });
		}
		var pyramidGlobalProductionRatio = this.getEffect("pyramidGlobalProductionRatio");
		stack.push({
			name: $I("res.stack.destruction"),
			type: "ratio",
			value: pyramidGlobalProductionRatio
		});
		var pyramidFaithRatio = this.getEffect("pyramidFaithRatio");
		if(res.name == "faith"){
			stack.push({
                name: $I("res.stack.extermination"),
				type: "ratio",
				value: pyramidFaithRatio
			});
		}
		// +*POLICY
		stack.push({
			name: $I("res.stack.policy"),
			type: "ratio",
			value: this.getEffect(res.name + "PolicyRatio")
		});
		
		// +AUTOMATED PRODUCTION BUILDING
		stack.push({
			name: $I("res.stack.convProd"),
			type: "fixed",
			value: this.getEffect(res.name + "PerTickProd")
		});
		stack.push({ // extra-compare with this.calcResourcePerTick
			name: $I("res.stack.convCons"),
			type: "fixed",
			value: this.getEffect(res.name + "PerTickCon")
		});

		// +AUTOMATED PRODUCTION SPACE
		var perTickAutoprodSpaceStack = [];
		var spaceParagonSubStack = [];
		//---->
			perTickAutoprodSpaceStack.push({
				name: $I("res.stack.spaceConvProd"),
				type: "fixed",
				value: this.getEffect(res.name + "PerTickAutoprodSpace")
			});
			this.addGlobalModToStack(perTickAutoprodSpaceStack, resName);
			perTickAutoprodSpaceStack.push({
				name: $I("res.stack.spaceProdBonus"),
				type: "ratio",
				value: spaceRatio - 1
			});
			spaceParagonSubStack.push({
				name: $I("res.stack.spaceParagon"),
				type: "ratio",
				value: paragonSpaceProductionRatio - 1
			});
			spaceParagonSubStack.push({
				name: $I("res.stack.bonusTransf"),
				type: "multiplier",
				value: this.getEffect("prodTransferBonus")
			});
			perTickAutoprodSpaceStack.push(spaceParagonSubStack);
		//<----
		stack.push(perTickAutoprodSpaceStack);

		// +AUTOMATED PRODUCTION SPACE
		var perTickSpace = [];
		//---->
			perTickSpace.push({
				name: $I("res.stack.spaceConvProd"),
				type: "fixed",
				value: this.getEffect(res.name + "PerTickSpace")
			});
			perTickSpace.push({
				name: $I("res.stack.spaceProdBonus"),
				type: "ratio",
				value: spaceRatio - 1
			});
			this.addGlobalModToStack(perTickSpace, resName);
		//<----
		stack.push(perTickSpace);

		//CYCLE EFFECT
		// Can't be displayed because it's space building improvements.

		//CYCLE FESTIVAL EFFECTS
		var effects = {};
		effects[res.name] = 1;
		this.calendar.cycleEffectsFestival(effects);
		var cycleEffect = effects[resName] - 1;

		stack.push({
			name: $I("res.stack.festival"),
			type: "ratio",
			value: cycleEffect
		});

		var baselineModifiers = [];
		// +BUILDING AND SPACE PerTick

		//----->
			baselineModifiers.push({
				name: $I("res.stack.baseline"),
				type: "fixed",
				value: this.getEffect(res.name + "PerTick")
			});
			baselineModifiers.push({
				name: $I("res.stack.baselineRatio"),
				type: "ratio",
				value: this.getEffect(res.name + "PerTickRatio")
			});
			this.addGlobalModToStack(baselineModifiers, resName);
		stack.push(baselineModifiers);
		//<----
		// +CRAFTING JOB PRODUCTION
		stack.push({
			name: $I("res.stack.engineer"),
			type: "fixed",
			value: this.workshop.getEffectEngineer(res.name, true)
		});
		// -EARTH CONSUMPTION && -SPACE CONSUMPTION
		var resMapConsumption = this.village.getResConsumption();
		var resConsumption = resMapConsumption[res.name] || 0;
		resConsumption *= 1 + this.getEffect(res.name + "DemandRatio");
		if (res.name == "catnip" && this.village.sim.kittens.length > 0 && this.village.happiness > 1) {
			var hapinnessConsumption = Math.max(this.village.happiness * (1 + this.getEffect("hapinnessConsumptionRatio")) - 1, 0);
			if (this.challenges.isActive("anarchy")) {
				resConsumption += resConsumption * hapinnessConsumption * (1 + this.getEffect(res.name + "DemandWorkerRatioGlobal"));
			} else {
				resConsumption += resConsumption * hapinnessConsumption * (1 + this.getEffect(res.name + "DemandWorkerRatioGlobal")) * (1 - this.village.getFreeKittens() / this.village.sim.kittens.length);
			}
		}

		stack.push({
			name: $I("res.stack.demand"),
			type: "fixed",
			value: resConsumption
		});

		// TIME extra-compare with this.calcResourcePerTick
		stack.push({
			name: $I("res.stack.time"),
			type: "ratio",
			value: this.timeAccelerationRatio()
		});
		return stack;
	},

	getResourcePerDayStack: function(resName){
		var stack = [];
		var res = null;
		for (var i in this.resPool.resources){
			var _res = this.resPool.resources[i];
			if (_res.name == resName){
				res = _res;
				break;
			}
		}

		if (!res){
			//console.error("Unable to fetch resource stack for resName '" + resName + "'");
			return;
		}
		if (resName == "necrocorn"){
			stack.push({
				name: $I("res.stack.buildings"),
				type: "perDay",
				value: this.getEffect("necrocornPerDay") + this.religion.pactsManager.getSiphonedCorruption(1)
			});
		}else{
			stack.push({
				name: $I("res.stack.buildings"),
				type: "perDay",
				value: this.getEffect(res.name + "PerDay")
			});
		}
		if(resName == "necrocorn"){
			var corruptionStack = [];
			corruptionStack.push({
				name: $I("res.stack.corruptionPerDay"),
				type: "perDay",
				value: this.religion.getCorruptionPerTick() * this.calendar.ticksPerDay
			});
			corruptionStack.push({
				name: $I("res.stack.corruptionPerDayProduction"),
				type: "perDay",
				value: this.religion.getCorruptionPerTickProduction() * this.calendar.ticksPerDay
			});
			corruptionStack.push({
				name: $I("res.stack.corruptionPerDaySiphoned"),
				type: "perDay",
				value: - this.religion.pactsManager.getSiphonedCorruption(1)
			});
			stack.push(corruptionStack);
				// TIME extra-compare
			stack.push({
				name: $I("res.stack.time"),
				type: "ratio",
				value: this.timeAccelerationRatio()
			});
		}

		if(resName == "alicorn"){
			stack.push({
				name: $I("res.stack.corruptionPerDaySiphoned"),
				type: "perDay",
				value: this.religion.gesSiphoningAlicornConsumptionPerDay()
			});
		}

		return stack;
	},

	getResourceOnYearStack: function(resName){
		var stack = [];
		var res = null;
		for (var i in this.resPool.resources){
			var _res = this.resPool.resources[i];
			if (_res.name == resName){
				res = _res;
				break;
			}
		}

		if (!res){
			//console.error("Unable to fetch resource stack for resName '" + resName + "'");
			return;
		}
		stack.push({
			name: $I("res.stack.buildings"),
			type: "perYear",
			value: this.getEffect(res.name + "Production")
		});
		if(resName == "antimatter" && this.resPool.energyProd < this.resPool.energyCons){

			stack.push({
				name: $I("ui.energy.tooltip"), //kinda hack text
				type: "perYear",
				value: -this.getEffect(res.name + "Production")
			});
		}
		return stack;
	},
	getCMBRBonus: function() {
		return this.isCMBREnabled ? 0.2 : 0;
	},

	getCraftRatio: function(tag) {
		return this.getEffect("craftRatio") + this.village.getEffectLeader("engineer", 0) + this.village.getEffectLeader(tag, 0);
	},

	getResCraftRatio: function(craftedResName) {
		if (craftedResName == "wood") {
			var refineRatio = this.getEffect("refineRatio");
			return this.ironWill
				? ((1 + refineRatio) * (1 + this.getEffect("woodRatio"))) - 1
				: refineRatio;
		}

		var ratio = this.getCraftRatio(this.resPool.get(craftedResName).tag);

		if (craftedResName == "blueprint") {
			var bpRatio = this.getEffect("cadBlueprintCraftRatio");
			var scienceBldAmt = this.bld.get("library").val + this.bld.get("academy").val + this.bld.get("observatory").val + this.bld.get("biolab").val;
			ratio += scienceBldAmt * bpRatio;
		}

		if (craftedResName == "kerosene") {
			var fRatio = 0.75 * this.getEffect("factoryRefineRatio");	//25% penalty
			var amt = this.bld.get("factory").on;
			ratio *= 1 + amt * fRatio;
		}

		//get resource specific craft ratio (like factory bonus)
		ratio += this.getEffect(craftedResName + "CraftRatio") || 0;
		ratio *= 1 + this.getEffect(craftedResName + "GlobalCraftRatio") || 0;

		return ratio;
	},

	/**
	 * Update all tab managers, resources and UI controls
	 */
	update: function(){
		this.ticksBeforeSave--;

		if (this.ticksBeforeSave == 0){
			this.save();

			this.ui.displayAutosave();
		}

		this.timer.beforeUpdate();

		//hack hack hack
		this.updateModel();
		if (this.time.isAccelerated && this.ticks % 2 == 0){
			this.updateModel();
		}

		//hack end
		this.time.update();

		if (this.undoChange){
			this.undoChange.ttl--;

			if (this.undoChange.ttl <= 0){
				this.undoChange = null;
				this._publish("server/undoStateChanged");
			}
		}
        //--------------------
        //  Update UI state
        //--------------------
        this.ui.update();

		this.timer.afterUpdate();
	},

	getTicksPerSecondUI: function() {
		return this.ticksPerSecond * (1 + this.timeAccelerationRatio());
	},

	timeAccelerationRatio: function() {
		return this.time.isAccelerated ? 0.5 : 0;
	},

	/**
	 * How should it be:
	 *
	 * a) we need to use smaller tick intervals (10 per second instead of 5 per second)
	 * b) in accelerated time we will update models more often
	 * c) but we will keep ui update in a old steady rate
	 *
	 * How it works now:
	 *
	 * update method can just kick twice in the accelerated mode
	 *
	 */
	updateModel: function(){

		this.resPool.update();

		this.bld.update();
		//this.science.update();

		//business logic goes there
		//maybe it will be a good idea to move it elsewhere?

		//for example, here kitten resources are calculated per effect, this logic could be unified

		this.village.maxKittens = Math.floor(this.getEffect("maxKittens"));

		this.village.update();
		this.workshop.update();
		this.diplomacy.update();
		this.religion.update();
		this.space.update();
		this.challenges.update();

		/*for (i in this.managers){
		 if (this.managers[i].update){
		 this.managers[i].update();
		 }
		 }*/

		this.resPool.resConsHackForResTable();

		//pollution per tick
		this.bld.cathPollution += this.bld.cathPollutionPerTick;
		if(this.bld.cathPollution < 0) {this.bld.cathPollution = 0;}

		//nah, kittens are not a resource anymore (?)
		var kittens = this.resPool.get("kittens");
		kittens.value = this.village.getKittens();	//just a simple way to display them
		kittens.maxValue = this.village.sim.maxKittens; //for HG

		this.timer.update();
	},

	huntAll: function(event){
		event.preventDefault();
		this.village.huntAll();
	},

	praise: function(event){
		event.preventDefault();
		this.religion.praise();
	},

	/**
	 * Updates a perTickValue of resource for UI
	 */
	updateResources: function(){
		/**
		* Updating per tick value is actually a heavy operation. Why don't we do it per 3 tick and cache values?
		*/
		for (var i = 0; i < this.resPool.resources.length; i++){
			var res = this.resPool.resources[i];
			if (res.calculatePerTick) {
				res.perTickCached = this.fixFloatPointNumber(this.calcResourcePerTick(res.name));
			}
		}
	},

	getResourcePerTick: function(resName, withConversion){
		var res = this.resPool.get(resName);
		if (res.calculatePerTick) {
			return withConversion ? res.perTickCached + this.getResourcePerTickConvertion(res.name) : res.perTickCached;
		} else {
			return 0;
		}
	},

	getResourcePerDay: function(resName){
		if(resName == "necrocorn"){
			return (this.religion.pactsManager.getNecrocornDeficitConsumptionModifier() * this.getEffect(resName + "PerDay") + this.religion.pactsManager.getSiphonedCorruption(1) +
			this.religion.getCorruptionPerTick() * this.calendar.ticksPerDay);
		}
		return this.getEffect(resName + "PerDay");
	},
	getResourceOnYearProduction: function(resName){
		if (resName == "antimatter"){
			if(this.resPool.energyProd >= this.resPool.energyCons){
				return this.getEffect("antimatterProduction");
			}
			else{
				return 0;
			}
		}
		return this.getEffect(resName + "Production"); //this might need to be changed!
	},
	getResourcePerTickConvertion: function(resName) {
		return this.fixFloatPointNumber(this.getEffect(resName + "PerTickCon"));
	},

	craft: function(resName, value){
		this.workshop.craft(resName, value);
		this.updateResources();
	},

	craftAll: function(resName){
		// some way to protect people from refining all catnip during the winter
		if (resName != "wood" || this.getResourcePerTick("catnip", true) > 0) {
			this.workshop.craftAll(resName);
			this.updateResources();
		} else {
			var game = this;
			this.ui.confirm($I("kittens.craft.confirmation.title"), $I("kittens.craft.confirmation.msg"), function() {
				game.workshop.craftAll(resName);
				game.updateResources();
			});
		}
	},

	getRequiredResources: function(bld){
		var res = [];
		if (bld && bld.prices) {
			for (var i = 0; i < bld.prices.length; i++){
				res.push(bld.prices[i].name);
			}
		}
		return res;
	},

	/**
	 * Attaches onMouseOver/onMouseOut events to a given DOM node in order to display tooltip.
	 * All tooltips will reuse the same container.
	 *
	 */
	attachResourceTooltip: function(container, resRef){
		UIUtils.attachTooltip(this, container, 0, 100, function() {
			if (this.getResourcePerTick(resRef.name, false) != 0
				|| this.getResourcePerTickConvertion(resRef.name) != 0
				|| this.workshop.getEffectEngineer(resRef.name) != 0
				|| this.getResourcePerDay(resRef.name) != 0
				|| (this.getResourceOnYearProduction(resRef.name) != 0 || resRef.name == "antimatter")
				|| (resRef.name == "kittens" && this.village.sim.kittens.length < this.village.sim.maxKittens)
			){
				return this.getDetailedResMap(resRef);
			}

            return '';
		});

		dojo.connect(container, "onmouseover", this, function(){
			dojo.style(container, "fontWeight", "bold");
		});

		dojo.connect(container, "onmouseout", this, function(){
			dojo.style(container, "fontWeight", "normal");
		});

	},

	/**
	 * Returns a flat map of resource production
	 */
	getDetailedResMap: function(res){
		if(res.calculatePerDay){
			var resStack = this.getResourcePerDayStack(res.name),
				resString = this.processResourcePerTickStack(resStack, res, 0), //processResourcePerTickStack can work with perDay stack
				resPerDay = this.getResourcePerDay(res.name);
				if (this.opts.usePercentageResourceValues){
					resString += "<br> " + $I("res.netGain") + ": " + this.getDisplayValueExt(resPerDay, true, true);
				}
			if (resPerDay < 0) {
				var toZero = this.calendar.ticksPerDay * res.value / (-resPerDay * this.getTicksPerSecondUI() * (1 + this.timeAccelerationRatio()));
				resString += "<br>" + $I("res.toZero") + ": " + this.toDisplaySeconds(toZero.toFixed());
			}
			if(res.name == "necrocorn"){
				var toNextNecrocorn = (1 - this.religion.corruption)/(this.religion.getCorruptionPerTick() * 5 * (1 + this.timeAccelerationRatio()));
				if(toNextNecrocorn > 0){
					resString += "<br>" + $I("res.toNextNecrocorn") + ": " + this.toDisplaySeconds(toNextNecrocorn.toFixed());
				}
			}
			return resString;
		}else if(res.calculateOnYear){
			var resStack = this.getResourceOnYearStack(res.name),
				resString = this.processResourcePerTickStack(resStack, res, 0), //processResourcePerTickStack can work with perDay stack
				resPerYear = this.getResourceOnYearProduction(res.name);
				if (this.opts.usePercentageResourceValues){
					resString += "<br> " + $I("res.netGain") + ": " + this.getDisplayValueExt(resPerYear, true, true);
				}
				if(res.name == "antimatter" && resPerYear && this.resPool.energyWinterProd < this.resPool.energyCons){
					resString += "<br> " + $I("effectsMgr.winterEnergy.warning.title");
				}
			return resString;
		}
		if(res.name == "kittens"){
			var nextKittenProgress = this.village.sim.nextKittenProgress;
			var kittensPerTick = this.village.calculateKittensPerTick();
			var resString =  " [" + ( nextKittenProgress * 100 ).toFixed()  + "%]";
			resString += "<br>" + $I("res.toNextKitten") + " " + this.toDisplaySeconds((1 - nextKittenProgress)/kittensPerTick);
			return resString;
		}
		var resStack = this.getResourcePerTickStack(res.name),
			resString = this.processResourcePerTickStack(resStack, res, 0),
			resPerTick = this.getResourcePerTick(res.name, true);

		if (this.opts.usePercentageResourceValues){
			resString += "<br> " + $I("res.netGain") + ": " + this.getDisplayValueExt(resPerTick, true, true);
		}

		if (resPerTick < 0) {
			var toZero = res.value / (-resPerTick * this.getTicksPerSecondUI());
			resString += "<br>" + $I("res.toZero") + ": " + this.toDisplaySeconds(toZero.toFixed());
		} else {
			if (res.maxValue && res.value < res.maxValue) {
				var toCap = (res.maxValue - res.value) / (resPerTick * this.getTicksPerSecondUI());
				if (toCap){
					resString += "<br>" + $I("res.toCap") + ": " + this.toDisplaySeconds(toCap.toFixed());
				}
			}
		}
		//TODO: redo this logic to decrease repetition
		if (res.calculatePerTickAndDay && res.name == "alicorn"){ 
			var resStackDay = this.getResourcePerDayStack(res.name),
				resStringDay = this.processResourcePerTickStack(resStackDay, res, 0), //processResourcePerTickStack can work with perDay stack
				resPerDay = this.getResourcePerDay(res.name);
				if (this.opts.usePercentageResourceValues){
					resStringDay = "<br>" + resStringDay;
					resStringDay += "<br> " + $I("res.netGain") + ": " + this.getDisplayValueExt(resPerDay, true, true);
				}
			var totalPerDayDelta =  "<br>" + $I("res.netGainPerDay") + ": " + 
			this.getDisplayValueExt(resPerTick * this.calendar.ticksPerDay + this.getEffect("alicornPerDay"))
			;
			return resString + resStringDay + totalPerDayDelta;
		}
		return resString;
	},

	processResourcePerTickStack: function(resStack, res, depth, hasFixed) {
		var resString = "";
		if (depth < 2) {
			hasFixed = false;
		}

		for (var i = 0; i < resStack.length; i++) {
			var stackElem = resStack[i];

			if (stackElem.length) {
				var subStack = this.processResourcePerTickStack(stackElem, res, depth + 1, hasFixed);
				if (subStack.length) {
					resString += subStack;
					hasFixed = true;
				}
				continue;
			}

			if (!stackElem.value || (stackElem.type != "fixed" && stackElem.type != "perDay" &&
			stackElem.type != "perYear" && !hasFixed)) {
				continue;
			}

			var indent = i == 0 ? depth - 1 : depth;
			for (var j = 0; j < indent - 1; j++) {
				resString += "<span style='visibility: hidden;'>|-> </span>";
			}
			if (indent > 0) {
				resString += "|-> ";
			}

			resString += this.getStackElemString(stackElem, res);
			if (stackElem.type == "fixed" || stackElem.type == "perDay") {
				hasFixed = true;
			}
		}

		return resString;
	},

	getStackElemString: function(stackElem, res){
		var resString = stackElem.name + ":&nbsp;<div style=\"float: right;\">";

		if (stackElem.type == "fixed") {
			resString += this.getDisplayValueExt(stackElem.value, true, true);
		} else if (stackElem.type == "ratio") {
			resString += this.getDisplayValueExt((stackElem.value * 100).toFixed(), true) + "%";
		} else if (stackElem.type == "multiplier") {
			resString += "×" + this.getDisplayValueExt((stackElem.value * 100).toFixed()) + "%";
		} else if (stackElem.type == "ratioIndent") {
			resString = "|->" + resString + this.getDisplayValueExt((stackElem.value * 100).toFixed(), true) + "%";
		} else if (stackElem.type == "perDay") {
			if (stackElem.value>0){
				resString += "+";
			}
			resString += this.getDisplayValueExt((stackElem.value)) + "/" + $I("res.per.day");
		} else if(stackElem.type == "perYear"){
			if (stackElem.value > 0){
				resString += "+";
			}
			resString += this.getDisplayValueExt((stackElem.value)) + "/" + $I("res.per.year");
		}

		resString += "</div><br>";

		return resString;
	},

	toDisplaySeconds : function (secondsRaw) {
	    var sec_num = parseInt(secondsRaw, 10); // don't forget the second param

        var year_secs = 86400 * 365;

        var years   = Math.floor(sec_num / year_secs);
	    var days    = Math.floor((sec_num - (years * year_secs)) / 86400);
	    var hours   = Math.floor((sec_num - (years * year_secs) - (days * 86400)) / 3600);
	    var minutes = Math.floor((sec_num - (years * year_secs) - (days * 86400 + hours * 3600)) / 60);
	    var seconds = sec_num - (years * year_secs) - (days * 86400) - (hours * 3600) - (minutes * 60);

        if (years > 0){
            years = this.getDisplayValueExt(years);
        }

	    var timeFormated = "";
        if ( years ) { timeFormated = years + $I("unit.y") + " "; }
	    if ( days ) { timeFormated += days + $I("unit.d") + " "; }
        if ( !years ){
            if ( hours ) {  timeFormated += hours + $I("unit.h") + " "; }
            if ( minutes) { timeFormated += minutes + $I("unit.m") + " "; }
            if ( seconds ) { timeFormated += seconds + $I("unit.s") + " "; }
        }

	    return timeFormated;
	},

	/**
	 * The same as toDisplaySeconds, but converts ingame days into xYears xDays
	 * Just for aestetical pleasness
	 */
	toDisplayDays: function(daysRaw){
		var daysNum = parseInt(daysRaw, 10); // don't forget the second param

		var daysPerYear = this.calendar.daysPerSeason * this.calendar.seasonsPerYear;
		var years = Math.floor(daysNum / daysPerYear);
		var days = daysNum - years * daysPerYear;

		if (years > 0){
			years = this.getDisplayValueExt(years);
		}

		var timeFormated = "";
		if ( years ) { timeFormated = years + $I("unit.y") + " "; }
		if ( days ) { timeFormated += days + $I("unit.d") + " "; }

		return timeFormated;
	},

	toDisplayPercentage: function(percentage, precision, precisionFixed) {
		percentage *= 100;
		if (precisionFixed) {
			// Prevent 100% whereas it's not really reached
			percentage -= 1 / Math.pow(10, precision);
			if (percentage < 0) {
				percentage = 0;
			}
		} else {
			percentage = this.fixFloatPointNumber(percentage);
			// Seek optimal precision
			if (percentage - Math.floor(percentage) != 0) {
				precision = 1;
				if (percentage * 10 - Math.floor(percentage * 10) != 0) {
					precision = 2;
					if (percentage * 100 - Math.floor(percentage * 100) != 0) {
						precision = 3;
						if (percentage * 1000 - Math.floor(percentage * 1000) != 0) {
							precision = 4;
							if (percentage * 10000 - Math.floor(percentage * 10000) != 0) {
								precision = 5;
								if (percentage * 100000 - Math.floor(percentage * 100000) != 0) {
									precision = 6;
									if (percentage * 1000000 - Math.floor(percentage * 1000000) != 0) {
										precision = 7;
										if (percentage * 10000000 - Math.floor(percentage * 10000000) != 0) {
											precision = 8;
										}
									}
								}
							}
						}
					}
				}
			}
		}

		return percentage.toFixed(precision);
	},

	//shamelessly copied from Sandcastle Builder code
	postfixes: [
		{limit:1e210,divisor:1e210,postfix:["Q"," Quita"]},
		{limit:1e42,divisor:1e42,postfix:["W"," Wololo"]},
		{limit:1e39,divisor:1e39,postfix:["L"," Lotta"]},
		{limit:1e36,divisor:1e36,postfix:["F"," Ferro"]},
		{limit:1e33,divisor:1e33,postfix:["H"," Helo"]}, //or Ballard
		{limit:1e30,divisor:1e30,postfix:["S"," Squilli"]},
		{limit:1e27,divisor:1e27,postfix:["U"," Umpty"]},

		{limit:1e24,divisor:1e24,postfix:["Y"," Yotta"]},
		{limit:1e21,divisor:1e21,postfix:["Z"," Zeta"]},
		{limit:1e18,divisor:1e18,postfix:["E"," Exa"]},
		{limit:1e15,divisor:1e15,postfix:["P"," Peta"]},
		{limit:1e12,divisor:1e12,postfix:["T"," Tera"]},
		{limit:1e9,divisor:1e9,postfix:["G"," Giga"]},
		{limit:1e6,divisor:1e6,postfix:["M"," Mega"]},
		{limit:9e3,divisor:1e3,postfix:["K"," Kilo"]} //WHAT
	],

	/**
	 * Determines the display name & display value (formatting it as per second, or as a percentage, etc.) of a given effect.
	 * @param effectName	The internal name of the effect.
	 * @param effectValue	The value of the effect.
	 * @param showIfZero	Boolean.  Determines whether we still show an effect with zero value, or if that effect remains hidden.
	 * 					I added it just in case someone wants to use it in the future.
	 * 					If the effect would be hidden for any other reason, then this flag doesn't do anything.
	 * @return	null if the effect shouldn't be displayed (because it's hidden or because it's zero).
	 * 			Otherwise, returns a table with the following keys:
	 * 			displayEffectName = the localized title;
	 * 			displayEffectValue = the value of the effect, formatted & localized properly
	 */
	getEffectDisplayParams: function(effectName, effectValue, showIfZero) {
		var effectMeta = this.getEffectMeta(effectName);
		if (effectMeta.type === "hidden") {
			return null;	//Don't display because it's a hidden effect.
		}
		if (effectMeta.resName && !this.resPool.get(effectMeta.resName).unlocked) {
			return null;	//hide resource-related effects if we did not unlocked this effect yet
		}
		if (!effectValue && !showIfZero) {
			return null;	//Don't display because the size of the value is zero & the flag is set to hide things that are zero.
		}
		var displayEffectName = effectMeta.title;
		var displayEffectValue = "";
		//This code was copy-pasted from core.js with minor changes.
		//display resMax values with global ratios like Refrigeration and Paragon
		if (effectName.substr(-3) === "Max" ) {
			var res = this.resPool.get(effectMeta.resName || effectName.slice(0, -3));
			if (res) { // If res is a resource and not just a variable
				effectValue = this.resPool.addResMaxRatios(res, effectValue);
			}
		}
		if (effectName.substr(-12) === "MaxChallenge") {
			var res = this.resPool.get(effectMeta.resName || effectName.slice(0, -12));
			if (res) { // If res is a resource and not just a variable
				//This is the code used in resources.js to apply LDR to how Challenges affect resource storage.
				var maxValue = this.resPool.addResMaxRatios(res, this.getEffect(res.name + "Max") || 0);
				effectValue = this.getLimitedDR(this.resPool.addResMaxRatios(res, effectValue), maxValue - 1 - this.bld.effectsBase[res.name +'Max']||0);
			}
		}
		if (effectMeta.type === "perTick" && this.opts.usePerSecondValues) {
			// avoid mantisa if we can, later on this can be changed to show scaled up values, e.g. minutes, hours
			var tempVal = Math.abs(effectValue * this.ticksPerSecond), precision;
			if (tempVal >= 0.001) {
				precision = tempVal < 0.01 ? 3 : 2;
				displayEffectValue = this.getDisplayValueExt(
				effectValue * this.ticksPerSecond, false, false, precision) + "/" + $I("unit.sec");
			} else {
				displayEffectValue = this.getDisplayValueExt(
					effectValue * this.ticksPerSecond * 3600, false, false, 2) + "/" + $I("unit.h");
			}
		} else if (effectMeta.type === "perDay"){
			displayEffectValue = this.getDisplayValueExt(effectValue) + "/" + $I("unit.day");
		} else if (effectMeta.type === "perYear"){
			displayEffectValue = this.getDisplayValueExt(effectValue) + "/" + $I("unit.year");
		} else if ( effectMeta.type === "ratio" ) {
			displayEffectValue = this.toDisplayPercentage(effectValue, 2 , false) + "%";
		} else if ( effectMeta.type === "integerRatio" ){
			displayEffectValue = this.getDisplayValueExt(effectValue) + "%";
		} else if ( effectMeta.type === "energy" ){
			//Multiply the displayed values of energy production & consumption by relevant multipliers.
			if (effectName === "energyProduction") {
				effectValue *= this.resPool.getEnergyProductionRatio();
			} else if (effectName === "energyConsumption") {
				effectValue *= this.resPool.getEnergyConsumptionRatio();
			}
			displayEffectValue = this.getDisplayValueExt(effectValue) + $I("unit.watt");
		} else {
			displayEffectValue = this.getDisplayValueExt(effectValue);
		}
		return {
				displayEffectName: displayEffectName,
				displayEffectValue: displayEffectValue
			};
	},

	/**
	 * Converts raw resource value (e.g. 12345.67890) to a formatted representation (i.e. 12.34K)
	 * If 'prefix' flag is true, positive value will be prefixed with '+', e.g. ("+12.34K")
	 */
	getDisplayValueExt: function(value, prefix, usePerTickHack, precision, postfix){

		if(!value){ return "0"; }
		if (value === Infinity) {
			return "∞";
		}

		usePerTickHack &= this.opts.usePerSecondValues;
		if (usePerTickHack) {
			value = value * this.ticksPerSecond;
		}
		postfix = postfix || "";

		switch (this.opts.notation) {
			case "e":
				var l = Math.floor(Math.log10(value));
				if (l >= 4) {
					value /= Math.pow(10, l);
					postfix = "e" + l;
				}
				break;
			case "sie":
				var l = Math.floor(Math.log10(value));
				if (value < 9000) {
					postfix = "";
				} else if (9000 <= value && l < 6) {
					value /= 1000;
					postfix = "K";
				} else if (6 <= l && l < 9) {
					value /= 1000 * 1000;
					postfix = "M";
				} else if (9 <= l && l < 12) {
					value /= 1000 * 1000 * 1000;
					postfix = "G";
				} else if (12 <= l && l < 15) {
					value /= 1000 * 1000 * 1000 * 1000;
					postfix = "T";
				} else {
					value = value / Math.pow(10, l);
					postfix = "e" + l;
				}
				break;
			case "si":
			default:
				var absValue = Math.abs(value);
				for(var i = 0; i < this.postfixes.length; i++) {
					var p = this.postfixes[i];
					if(absValue >= p.limit){
						if (usePerTickHack) { // Prevent recursive * this.ticksPerSecond;
							value = value / this.ticksPerSecond;
						}
						return this.getDisplayValueExt(value / p.divisor, prefix, usePerTickHack, precision, postfix + p.postfix[0]);
					}
				}
				break;
		}

		var _value = this.getDisplayValue(value, prefix, precision);
		return _value + postfix + (usePerTickHack ? "/" + $I("unit.sec") : "");
	},

	/**
	 * Formats float value to x.xx or x if value is integer
	 */
	getDisplayValue: function(floatVal, plusPrefix, precision){

		var plusSign = "+";
		if (floatVal <= 0 || !plusPrefix){
			plusSign = "";
		}

		if (!floatVal.toFixed){
			return plusSign + floatVal;
		}

		if (precision === undefined){
			precision = this.opts.forceHighPrecision ? 3 : 2;
		}

		var mantisa = "";

		if (floatVal != 0) {
			var absVal = Math.abs(floatVal);
			if (absVal < 0.01 && precision == 2 || absVal < 0.001 && precision == 3) {
				mantisa = "(...)";
			}
		}

		if (floatVal % 1 === 0){
			var toFixed = floatVal.toFixed();
			return plusSign + toFixed;
		} else {
			var toFixed = floatVal.toFixed(precision);
			return plusSign + toFixed + mantisa;
		}
	},

	fixFloatPointNumber: function(number) {
		// Adjust value because of floating-point error
		var numberAdjusted = Math.floor(number * 10000000) / 10000000;
		if (Math.round((number - numberAdjusted) * 10000000)) {
			numberAdjusted = Math.floor((number + 0.000000000000010) * 10000000) / 10000000;
		}
		return numberAdjusted;
	},

	addTab: function(tab){
		this.tabs.push(tab);
		tab.game = this;
	},

	getTabById: function(tabId){
		for (var i in this.tabs){
			if (this.tabs[i].id == tabId){
				return this.tabs[i];
			}
		}
	},

	isWebWorkerSupported: function(){
		//return false;
		return !dojo.isIE && window.Worker;
	},

	timestamp: function() {
		return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
	},

	start: function(){
		if (this.isWebWorkerSupported() && this.useWorkers){	//IE10 has a nasty security issue with running blob workers
			console.log("starting web worker...");
			var blob = new Blob([
				"onmessage = function(e) { setInterval(function(){ postMessage('tick'); }, 1000 / " + this.ticksPerSecond + "); }"]);	//no shitty external js
			var blobURL = window.URL.createObjectURL(blob);

			this.worker = new Worker(blobURL);
			this.worker.addEventListener("message", dojo.hitch(this, function(e) {
				this.tick();
			}));
			this.worker.postMessage("tick");
		} else {
			console.log("starting js timer...");
			//some older browser, perhaps IE. Have a nice idling.
			// setInterval function set a fixed interval and if the event was delayed due some browser activity, e.g. rendering/scrolling then two or more events will be put into a queue
			// The problem is that UI looks unresponsive and there are glitches.
			// We have 2 options:
			// 1. Skip events which are really close
			// 2. Use setTimeout function and reset the interval
			// In both cases it will result to drop of number of ticks.
			// One way is to handle it on UI by queuing the update requests.

			/*
				Would still work bad during the scroll
			 */
			clearInterval(this._mainTimer);
			this._mainTimer = setInterval(dojo.hitch(this, this.tick), (1000 / this.ticksPerSecond));

			this._lastFrameTimestamp = this.timestamp();
		}
		this._publish("game/start");
	},

	/**
	 * Here is a magic
	 * Don't even try to understand it, madness lies here
	 */
	frame: function(){
		var now = this.timestamp(),
			delta = now - this._lastFrameTimestamp;

		if (delta > (1000 / this.ticksPerSecond)) {
			/*dojo.hitch(this, this.tick)();*/
			console.log("tick!");
			this.tick();
		}
		requestAnimationFrame(this.frame);
	},


	tick: function(){
		/**
		 * Even if the game is paused, scheduler should still be able to obtain a focus to handle cases like save/load/reset
		 */
		this.timer.updateScheduledEvents();
        var fpsElement;

		if (this.isPaused){
			return;
		}



		var timestampStart = new Date().getTime();

		this.update();
		this.calendar.tick();
		this.ticks++;

		var timestampEnd = new Date().getTime();
		//if (this.isLocalhost) {	//always collect fps metrics
			this.totalUpdateTimeTicks++;

			var tsDiff = timestampEnd - timestampStart;
			this.totalUpdateTime[this.totalUpdateTimeCurrent] += tsDiff;
			this.totalUpdateTimeCurrent = this.totalUpdateTimeCurrent == 4 ? 0 : this.totalUpdateTimeCurrent + 1;

			var avg = (this.totalUpdateTime[0] + this.totalUpdateTime[1] + this.totalUpdateTime[2] + this.totalUpdateTime[3] + this.totalUpdateTime[4]) / this.totalUpdateTimeTicks;
			var avg0 = this.totalUpdateTime[0] / Math.floor((this.totalUpdateTimeTicks - 1) / 5);
			var avg1 = this.totalUpdateTime[1] / Math.floor((this.totalUpdateTimeTicks - 2) / 5);
			var avg2 = this.totalUpdateTime[2] / Math.floor((this.totalUpdateTimeTicks - 3) / 5);
			var avg3 = this.totalUpdateTime[3] / Math.floor((this.totalUpdateTimeTicks - 4) / 5);
			var avg4 = this.totalUpdateTime[4] / Math.floor((this.totalUpdateTimeTicks - 5) / 5);

			if (tsDiff < 10) {
				tsDiff = 10;
			}
			this.fps = {
				ms: tsDiff,
				avg: avg,
				avg0: avg0,
				avg1: avg1,
				avg2: avg2,
				avg3: avg3,
				avg4: avg4
			};
		//}

		//collect fps info every minute or so
		if (this.ticks % (this.ticksPerSecond * 60) == 0 && this.telemetry) {
			var memory = null;
			if (window.performance && window.performance.memory) {
				memory = performance.memory.usedJSHeapSize;
			}

			this.telemetry.logEvent("fps", {
				ms: this.fps.ms,
				avg: this.fps.avg,
				memory: memory
			});
		}
	},

	restartFPSCounters: function() {
        this.totalUpdateTime[0] = 0;
        this.totalUpdateTime[1] = 0;
        this.totalUpdateTime[2] = 0;
        this.totalUpdateTime[3] = 0;
        this.totalUpdateTime[4] = 0;
        this.totalUpdateTimeCurrent = 0;
        this.totalUpdateTimeTicks = 5;
	},

	reset: function(){
		var msg = $I("reset.confirmation.title") + "\n\n"
		        + $I("reset.confirmation.msgbase");
		if (this.resPool.get("kittens").value > 70) {
			msg += " " + $I("reset.confirmation.msg70");
		} else if (this.resPool.get("kittens").value > 60) {
			msg += " " + $I("reset.confirmation.msg60");
		} else if (this.resPool.get("kittens").value <= 35) {
			msg += " " + $I("reset.confirmation.msg35");
		}
		var game = this;
		game.ui.confirm($I("reset.confirmation.title"), msg, function() {
			game.challenges.onRunReset();
			if (game.challenges.isActive("atheism") && game.time.getVSU("cryochambers").on > 0) {
				game.challenges.getChallenge("atheism").researched = true;

				if (game.ironWill) {
					game.achievements.unlockBadge("ivoryTower");
				}
			}
			if (game.calendar.day < 0) {
				game.achievements.unlockBadge("abOwo");
			}
			for (var i = 0; i < game.challenges.challenges.length; i++){
				game.challenges.challenges[i].pending = false;
			}
			game.resetAutomatic();
		});
	},

	resetAutomatic: function() {
		this.timer.scheduleEvent(dojo.hitch(this, function(){
			this._resetInternal();
			this.mobileSaveOnPause = false;
			window.location.reload();
		}));
	},

	discardParagon: function() {
		var game = this;
		var confirmDiscard = false;
		this.ui.confirm("", $I("discardParagon.confirmation.msg1"), function() {
			if (game.resPool.get("paragon").value <= 100) {
				confirmDiscard = true;
			} else {
				game.ui.confirm("", $I("discardParagon.confirmation.msg2"), function() {
					if (!game.ironWill || game.achievements.get("spaceOddity").starUnlocked) {
						confirmDiscard = true;
					} else {
						game.ui.confirm("", $I("discardParagon.confirmation.msgIW"), function() {
							confirmDiscard = true;
						});
					}
				});
			}
		});

		if (confirmDiscard) {
			this.resPool.get("burnedParagon").value += this.resPool.get("paragon").value;
			this.resPool.get("paragon").value = 0;
			this.ironWill &= this.achievements.get("spaceOddity").starUnlocked;
			//TODO: add some special hidden effect for this mechanics
		}
	},

    _getKarmaKittens: function(kittens){
        var karmaKittens = 0;

        if (this.challenges.getChallenge("anarchy").researched) {
		kittens = kittens * 2;
        }

        if (kittens > 35){
			karmaKittens += (kittens - 35);
		}

		if (kittens > 60){
			karmaKittens += (kittens - 60) * 3;
		}

		if (kittens > 100){
			karmaKittens += (kittens - 100) * 4;
		}

		if (kittens > 150){
			karmaKittens += (kittens - 150) * 5;
		}

		if (kittens > 300){
			karmaKittens += (kittens - 300) * 10;
		}

		if (kittens > 750){
			karmaKittens += (kittens - 750) * 15;
		}

        return karmaKittens;
    },

	_getBonusZebras: function(){
		var totalScience = 0;
		var bonusZebras = 0;

		var anachronomancy = this.prestige.getPerk("anachronomancy");
		if (this.science.get("archery").researched && this.karmaZebras < 10){
			bonusZebras = 1;
		}
		for (var i = 0; i < this.science.techs.length; i++){
			var tech = this.science.techs[i];
			if (tech.name == "chronophysics" && anachronomancy.researched){
				continue;
			}
			if (tech.researched){
				for (var j in tech.prices){
					if (tech.prices[j].name == "science"){
						totalScience += tech.prices[j].val;
						break;
					}
				}
			}
		}
		bonusZebras += Math.floor(this.getLimitedDR(totalScience / 10000, 100));
		return bonusZebras;
	},

	getResetPrestige: function(){
		var kittens = Math.round(
			this.resPool.get("kittens").value * (1 + this.getEffect("simScalingRatio"))
			//this.resPool.get("kittens").value * ((this.village.maxKittensRatioApplied)?(1 + this.getEffect("simScalingRatio")):1)
		);

		var karmaKittens = this.karmaKittens;
		if (kittens > 35){
			karmaKittens += this._getKarmaKittens(kittens);
		}

		var paragonPoints = 0;
		if (kittens > 70){
			paragonPoints = (kittens - 70);
		}
		return {
			karmaKittens: karmaKittens,
			paragonPoints: paragonPoints
		};
	},

	_resetInternal: function(){
		var _prestige = this.getResetPrestige();

		var karmaKittens = _prestige.karmaKittens,
			paragonPoints = _prestige.paragonPoints;

		var addRes = {
			"paragon": paragonPoints
		};

		var karmaZebras = parseInt(this.karmaZebras);	//hack
		//that's all folks

		var addStats = {
			"totalParagon": paragonPoints,
			"totalResets": 1
		};

		this.telemetry.logEvent("reset", this.stats.getStat("totalResets").val + 1);

        var stats = [];
        for (var i = 0; i < this.stats.stats.length; i++){
            var stat = this.stats.stats[i];

            var val = stat.val;
            if (addStats[stat.name] > 0){
                val += addStats[stat.name];
            }
            stats.push({
                name: stat.name,
                val: val
            });
        }

        var statsCurrent = [];
        for (var i = 0; i < this.stats.statsCurrent.length; i++){
            statsCurrent.push({
                name: this.stats.statsCurrent[i].name,
                val: 0
            });
        }


		//-------------------------- very confusing and convoluted stuff related to karma zebras ---------------
		var bonusZebras = this._getBonusZebras();
		if (this.resPool.get("zebras").value > 0 && this.ironWill){
			karmaZebras += bonusZebras;
		}

		//pre-reset faith so people who forgot to do it properly would not be screwed
		var faithRatio = this.religion.faithRatio;
		if (this.religion.getRU("apocripha").on) {
			faithRatio += this.religion.getApocryphaResetBonus(1);
		}
		//------------------------------------------------------------------------------------------------------

		// Trigger a save to make sure we're working with most recent data
		this.save();

		var lsData = this._parseLSSaveData();
		if (!lsData){
			lsData = {
				game: {},
				stats: {},
				statsCurrent: {},
				achievements: {}
			};
		}

		var saveRatio = this.bld.get("chronosphere").val > 0 ? this.getEffect("resStasisRatio") : 0; // resStasisRatio excepted when challenge
		dojo.mixin(lsData.game, {
			karmaKittens: 		karmaKittens,
			karmaZebras: 		karmaZebras,
			ironWill : 			(saveRatio > 0 || this.time.getVSU("cryochambers").on > 0) ? false : true,			//chronospheres or cryochaimbers will disable IW. Post Apocalypse allows cryochaimbers to work without chronospheres working.
			deadKittens: 		0,
			isCMBREnabled:		false
		});

		//------------ we can now carry some of the resources through reset ------------
		var newResources = [];

		var anachronomancy = this.prestige.getPerk("anachronomancy");
		var fluxCondensator = this.workshop.get("fluxCondensator");
		for (var i in this.resPool.resources) {
			var res = this.resPool.resources[i];

			// undefined is NOT falsy here
			if (res.persists === false
			 || (res.craftable && res.name != "wood" && !fluxCondensator.researched)) {
				continue;	//>:
			}
			var value = 0;

			if (res.name == "timeCrystal") {
				if (anachronomancy.researched) {
					value = res.value;
				}
			} else if (res.persists) {
				value = res.value;
			} else {
				if (!res.craftable || res.name == "wood") {
					value = res.value * saveRatio;
					if (res.name == "void") {
						value = Math.floor(value);
					}
				} else if (res.value > 0) {
					value = Math.sqrt(res.value) * saveRatio * 100;
				}
			}

			if (addRes[res.name] > 0) {
				value += addRes[res.name];
			}

			if (value > 0) {
				var newRes = this.resPool.createResource(res.name);
				newRes.value = value;
				newResources.push(newRes);
			}
		}

		var newKittens = [];
		var cryochambers = this.time.getVSU("cryochambers").on;

		var cathPollution = 0;

		if (cryochambers > 0) {
			this.village.sim.sortKittensByExp();
			newKittens = this.village.sim.kittens.slice(-cryochambers);
			for (var i in newKittens) {
				delete newKittens[i].job;
				delete newKittens[i].engineerSpeciality;
			}
			var usedCryochambers_reset = this.time.filterMetadata([this.time.getVSU("usedCryochambers")], ["name", "val", "on"]);
			usedCryochambers_reset[0]["val"] = cryochambers;
			usedCryochambers_reset[0]["on"] = cryochambers;
		}else{
			var usedCryochambers_reset = this.time.filterMetadata([this.time.getVSU("usedCryochambers")], ["name", "val", "on"]);
			usedCryochambers_reset[0]["val"] = 0;
			usedCryochambers_reset[0]["on"] = 0;
		}
		if(this.challenges.getChallenge("postApocalypse").pending){
			if(newKittens.length > 0){
				var catnip = this.resPool.get("catnip");
				if (!catnip){
					catnip = this.resPool.createResource("catnip");
				}
				catnip.value = newKittens.length * 1000 * (1 + this.resPool.get("karma").value/100);
				newResources.push(catnip);
			}
			cathPollution = (this.challenges.getChallenge("postApocalypse").on + newKittens.length) * 1e+8 + 1e+11;
		}

/*
		if (newKittens.length > 0) {
			var usedCryochambers_reset = this.time.filterMetadata([this.time.getVSU("usedCryochambers")], ["name", "val", "on"]);
			usedCryochambers_reset[0]["val"] = newKittens.length;
			usedCryochambers_reset[0]["on"] = newKittens.length;
		} else {
			var usedCryochambers_reset = this.time.filterMetadata([this.time.getVSU("usedCryochambers")], ["name", "val", "on"]);
			usedCryochambers_reset[0]["val"] = 0;
			usedCryochambers_reset[0]["on"] = 0;
		}
*/
		// Set the challenge for after reset
		for (var i = 0; i < this.challenges.challenges.length; i++){
			var challenge = this.challenges.challenges[i];
			if (challenge.pending){
				challenge.pending = false;
				challenge.active = true;
			}
			else{
				challenge.active = false;
			}
		}
		var reservesSaveData = this.challenges.reserves.getSaveData();
		var saveData = {
			saveVersion: this.saveVersion,
			game : lsData.game,
			resources: newResources,
			buildings: [],
			calendar: {
				cryptoPrice: this.calendar.cryptoPrice
			},
			challenges: {
				challenges: this.challenges.challenges,
				reserves: reservesSaveData
			},
			diplomacy: {
				races: []
			},
			prestige: {
				perks: this.prestige.perks
			},
			religion: {
				transcendenceTier: this.religion.transcendenceTier,
				faithRatio: faithRatio,
				activeHolyGenocide: this.religion.getTU("holyGenocide").on,
				zu: [],
				ru: [],
				tu: this.religion.filterMetadata(this.religion.transcendenceUpgrades, ["name", "val", "on", "unlocked"])
			},
			science: {
				hideResearched: this.science.hideResearched,
				policyToggleResearched: this.science.policyToggleResearched,
				policyToggleBlocked: this.science.policyToggleBlocked,
				techs: [],
				policies: []
			},
			space: {
				hideResearched: this.space.hideResearched,
				programs: [],
				planets: []
			},
			time: {
				cfu: [{
					name: "temporalImpedance",
					unlocked: this.time.getCFU("temporalImpedance").unlocked
				}],
				vsu: [],
				usedCryochambers: usedCryochambers_reset,
				timestamp: Date.now(),
				testShatter: this.time.testShatter
			},
			village :{
				kittens: newKittens,
				jobs: [],
				traits: [],
				hadKittenHunters: false,
			},
			workshop: {
				hideResearched: this.workshop.hideResearched,
				upgrades: [],
				crafts: [],
				zebraUpgrades: []
			},
			achievements: lsData.achievements,
			ach: lsData.ach,
			stats: stats,
			statsCurrent: statsCurrent,
			telemetry: {
				guid: this.telemetry.guid
			},
			cathPollution: cathPollution
		};

		if (anachronomancy.researched){
			saveData.science.techs.push(this.science.get("chronophysics"));
		}

		var preparedSaveData = this._prepareSaveData(saveData);
		var saveDataString = this._saveDataToString(preparedSaveData);
		LCstorage["com.nuclearunicorn.kittengame.savedata"] = saveDataString;

		// Hack to prevent an autosave from occurring before the reload completes
		this.isPaused = true;

		return saveData;
	},

	//TO BE USED EXTERNALLY
	rand: function(ratio){
		return this.math.uniformRandomInteger(0, ratio);
	},

	//Karma has no menu. You get served what you deserve.
	updateKarma: function(){
		var stripe = 5;	//initial amount of kittens per stripe
		var karma = this.getUnlimitedDR(this.karmaKittens, stripe);

		this.resPool.get("karma").value = karma;

		if (this.karmaZebras){
			this.resPool.get("zebras").maxValue = this.karmaZebras + 1;
		}
	},

	// Unlimited Diminishing Return
	//getTriValue
	getUnlimitedDR: function(value, stripe) {
		return (Math.sqrt(1 + 8 * value / stripe) - 1) / 2;
	},

	getInverseUnlimitedDR: function(value, stripe) {
		return value * (value + 1) * stripe / 2;
	},

	getTab: function(name) {
		switch(name) {
			case "science":
				return this.libraryTab;
			case "village":
				return this.villageTab;
			case "workshop":
				return this.workshopTab;
			case "space":
				return this.spaceTab;
			case "stats":
				return this.statsTab;
			case "time":
				return this.timeTab;
			case "challenges":
				return this.challengesTab;
		}
	},

	calculateAllEffects: function() {
		// TODO: delegate this to managers? Can't be done in load unfortunately.
		var getName = function(item){return item.name;};
		var metaKeys = {
				tech: this.science.techs.map(getName),
				policies: this.science.policies.map(getName),
				perks: this.prestige.perks.map(getName),
				jobs: this.village.jobs.map(getName),
				crafts: this.workshop.crafts.map(getName),
				upgrades: this.workshop.upgrades.map(getName),
				buildings: this.bld.buildingsData.map(getName),
				spaceMission: this.space.programs.map(getName),
				spaceBuilding: this.space.spaceBuildingsMap,
				planet: this.space.planets.map(getName),
				chronoforge: this.time.chronoforgeUpgrades.map(getName),
				voidSpace: this.time.voidspaceUpgrades.map(getName),
				zigguratUpgrades: this.religion.zigguratUpgrades.map(getName),
				religion: this.religion.religionUpgrades.map(getName),
				transcendenceUpgrades: this.religion.transcendenceUpgrades.map(getName),
				pacts: this.religion.pactsManager.pacts.map(getName),
				challenges: this.challenges.challenges.map(getName)
			};
		this.upgrade({ buildings: ["warehouse"]});
		this.upgrade(metaKeys);
		this.upgrade({policies: ["authocracy"]});
	},

	getUnlockByName: function(unlockId, type){
		switch(type) {
			case "tech":
				return this.science.get(unlockId);
			case "policies":
				return this.science.getPolicy(unlockId);
			case "perks":
				return this.prestige.getPerk(unlockId);
			case "jobs":
				return this.village.getJob(unlockId);
			case "crafts":
				return this.workshop.getCraft(unlockId);
			case "upgrades":
				return this.workshop.get(unlockId);
			case "zebraUpgrades":
				return this.workshop.getZebraUpgrade(unlockId);
			case "tabs":
				return this.getTab(unlockId);
			case "buildings":
				return this.bld.get(unlockId);
			case "spaceMission":
				return this.space.getProgram(unlockId);
			case "spaceBuilding":
				return this.space.getBuilding(unlockId);
			case "planet":
				return this.space.getPlanet(unlockId);
			case "chronoforge":
				return this.time.getCFU(unlockId);
			case "voidSpace":
				return this.time.getVSU(unlockId);
			case "stages":
				return this.bld.get(unlockId.bld);
			case "zigguratUpgrades":
				return this.religion.getZU(unlockId);
			case "religion":
				return this.religion.getRU(unlockId);
			case "transcendenceUpgrades":
				return this.religion.getTU(unlockId);
			case "pacts":
				return this.religion.getPact(unlockId);
			case "challenges":
				return this.challenges.getChallenge(unlockId);
			case "schemes":
				return unlockId;
			case "biomes":
				return this.village.getBiome(unlockId);
		}
	},

	/**
	 * Unlock a set of metadata elements based on the meta type and item id
	 * e.g:
	 * {
	 * 	buildings: [...],
	 * 	space: [...]
	 * }
	 * See #getUnlockByName for a full list of types
	 * @param {*} list 
	 * 
	 * TODO: clarify `unlockable` vs unlocked for buildings vs other stuff
	 */
	unlock: function(list) {
		var game = this; 
		for (var type in list) {
			if (list[type].length == 0) {
				return;
			}
			for (var i = list[type].length - 1; i >= 0; i--) {
				var unlockId = list[type][i];
				var newUnlock = this.getUnlockByName(unlockId, type);

				/** 
				 * Multi-unlock mechanism:
				 * 
				 * Source provides _SIGNAL_ throught the .unlocks property
				 * 
				 * e.g.:
				 * 
				 * meta1 -> game.unlock() ->	target meta
				 * meta2 -> game.unlock() /
				 * 
				 * by default any unlock() signal from source should mark target meta as unlocked
				 * 
				 * in case there are complex unlock conditions (say policies),
				 * target meta should evaluate the signal through the evaluateLocks()
				 * and return cancel if not all unlock conditions are satisfied
				 * 
				*/
				if (!newUnlock){
					console.trace();
					console.error("unable to evaluate locks for unlockId", unlockId, "type", type);
				}
				if (newUnlock.evaluateLocks && !newUnlock.evaluateLocks(game)){
					continue;
				}

				if (type == "tabs") {
					newUnlock.visible = true;
				} else if (type == "buildings") {
					newUnlock.unlockable = true;
				} else if (type == "stages") {
					newUnlock.stages[unlockId.stage].stageUnlocked = true;
				} else {
					if (!newUnlock){
						console.warn("unable to evaluate unlock '", unlockId, "', skipping");
						continue;
					}
					newUnlock.unlocked = true;
				}
			}
		}
	},

	upgrade: function(list){
		this.updateCaches();
		for (var type in list) {
			if (list[type].length == 0) {
				return;
			}
			for (var i = list[type].length - 1; i >= 0; i--) {
				var item = this.getUnlockByName(list[type][i], type);
				if (!item){
					console.error("unable to get unlock by [id]", list[type][i], "[type]", type);
					continue;
				}
				if (item.calculateEffects){
					item.calculateEffects(item, this);
					if (type == "spaceBuilding") {
						this.calendar.cycleEffectsBasics(item.effects, item.name);
					}
				}
				if (item.unlockScheme && item.val >= item.unlockScheme.threshold) {
					this.ui.unlockScheme(item.unlockScheme.name);
				}
			}
		}
	},

	toggleFilters: function(){
		var filtersDiv = $("#logFilters");
		filtersDiv.toggle();

		$("#filterIcon")[0].innerHTML = filtersDiv.is(":visible") ? "-" : "+";
	},

    registerUndoChange: function(){
        var undoChange = new classes.game.UndoChange();
        undoChange.ttl = undoChange._static.DEFAULT_TTL * this.ticksPerSecond;

        this.undoChange = undoChange;

		this._publish("server/undoStateChanged");
        return undoChange;
    },

    undo: function(){
        if (!this.undoChange) {
            return;
        }

        /**
         * I am too tired to write proper logic, let it be simple hashmap of references
         */
        var managers = {
		   "workshop": this.workshop,
		   "building": this.bld,
		   "religion": this.religion
        };

        for (var i in this.undoChange.events){
            var event = this.undoChange.events[i];
            var mgr = managers[event.managerId];

            if (mgr && mgr.undo){
                mgr.undo(event.data);
            }
        }

        this.undoChange = null;
		this._publish("server/undoStateChanged");
    },

	//-----------------------------------------------------------------
	//TODO: use me on mobile version
	checkEldermass: function(){
		if (this.isEldermass()){
			if (this.resPool.get("elderBox").value == 0){
				this.resPool.get("elderBox").value++;
				this.msg($I("gift.get"), "important");
			}
		} else {
			if (this.resPool.get("elderBox").value > 0 && this.resPool.get("elderBox").value < 1) {
				this.resPool.get("elderBox").value = 1;
				this.msg($I("gift.repaired"), "important");
			}
		}
	},

	redeemGift: function(){
		if (this.resPool.get("elderBox").value == 0) {
			return;
		}

		var gift = "Karma";
		if(this.resPool.get("paragon").value >= 100) {
			gift = "Paragon";
		}
		if(this.resPool.get("timeCrystal").value && this.prestige.getPerk("anachronomancy").researched && this.workshop.get("stasisChambers").researched) {
			gift = "TimeCrystal";
		}
		if(this.resPool.get("sorrow").value / this.resPool.get("sorrow").maxValue < 0.25 && this.prestige.getPerk("megalomania").researched && this.religion.getZU("blackPyramid").val < 3) {
			gift = "BLS";
		}
		if(this.religion.getRU("apocripha").on) {
			gift = "Apocrypha";
		}
		if (this.religion.getRU("transcendence").on && this.religion.transcendenceTier <= 10) {
			gift = "Transcendence";
		}
		if(this.prestige.getPerk("engeneering").researched && !this.prestige.getPerk("renaissance").researched) {
			gift = "Metaphysics";
		}
		if(this.bld.get("chronosphere").on) {
			gift = "Compendiums";
		}
		if(this.diplomacy.get("leviathans").energy == this.diplomacy.getMarkerCap()){
			gift = "BurnedParagon";
		}
		var ucfirst = function (string) { return string.charAt(0).toUpperCase() + string.slice(1); };

		switch (gift) {
			case "Karma":
				if(this.resPool.get("karma").value > 50) {
					var amt = 25 * Math.min(this.karmaKittens, 25000);
				} else {
					var amt = 5000;
				}
				var karmaGained = this.getUnlimitedDR(this.karmaKittens + amt, 5) - this.getUnlimitedDR(this.karmaKittens, 5);
				var msg = $I("gift.resources", [this.getDisplayValueExt(karmaGained), ucfirst($I("resources.karma.title"))]);

				this.karmaKittens += amt;
				break;

			case "Paragon":
				if(this.resPool.get("paragon").value > 500) {
					var amt = Math.min(this.resPool.get("paragon").value, 1000);
				} else {
					var amt = 100;
				}
				var msg = $I("gift.resources", [this.getDisplayValueExt(amt), ucfirst($I("resources.paragon.title"))]);
				this.resPool.addResEvent("paragon", amt);
				break;

			case "TimeCrystal":
				if(this.resPool.get("timeCrystal").value > 100) {
					var amt = Math.min(this.resPool.get("timeCrystal").value, 2000);
				} else {
					var amt = 50;
				}
				var msg = $I("gift.resources", [this.getDisplayValueExt(amt), ucfirst($I("resources.timeCrystal.title"))]);
				this.resPool.addResEvent("timeCrystal", amt);
				break;

			case "BLS" :
				amt = this.resPool.get("sorrow").maxValue - this.resPool.get("sorrow").value;
				var msg = $I("gift.resources", [this.getDisplayValueExt(amt), ucfirst($I("resources.sorrow.full"))]);
				this.resPool.addResEvent("sorrow", amt);
				break;

			case "Apocrypha":
				if(this.religion.faithRatio > 10) {
					var amt = 4 * Math.min(this.religion.faithRatio, 1000);
				} else {
					var amt = 5;
				}
				var pre = this.religion.getApocryphaBonus();
				this.religion.faithRatio += amt;
				var post = this.religion.getApocryphaBonus();
				var apocryphaGained = (post - pre) * 100;
				var msg = $I("gift.apocrypha", [this.getDisplayValueExt(apocryphaGained)]);
				break;

			case "Transcendence":
				this.religion.transcendenceTier += 4;
				var msg = $I("gift.transcendence");
				break;

			case "Metaphysics":
				if(!this.prestige.getPerk("goldenRatio").researched) {
					this.prestige.getPerk("goldenRatio").researched = true;
					this.unlock(this.prestige.getPerk("goldenRatio").unlocks);
					var perk = "Golden Ratio";
				}
				else if (!this.prestige.getPerk("divineProportion").researched) {
					this.prestige.getPerk("divineProportion").researched = true;
					this.unlock(this.prestige.getPerk("divineProportion").unlocks);
					var perk = "Divine Proportion";
				}
				else if (!this.prestige.getPerk("vitruvianFeline").researched) {
					this.prestige.getPerk("vitruvianFeline").researched = true;
					this.unlock(this.prestige.getPerk("vitruvianFeline").unlocks);
					var perk = "Vitruvian Feline";
				}
				else if (!this.prestige.getPerk("renaissance").researched) {
					this.prestige.getPerk("renaissance").researched = true;
					var perk = "Renaissance";
				}
				var msg = $I("gift.metaphysics", [perk]);
				break;

			case "Compendiums":
				if(this.resPool.get("compedium").value > 500000) {
					var amt = 4 * this.resPool.get("compedium").value;
				} else {
					var amt = 100000;
				}
				var unicornGraveyard = this.religion.getZU("unicornGraveyard");
				var unicornNecropolis = this.religion.getZU("unicornNecropolis");
				var getSumOfPrices = function(item, resName){ //this function should return how much of one resource was spent on a stackable
					var priceRatio = item.priceRatio;
					var resPrice = 0;
					var num = item.val;
					for (var i in item.prices){
						if (item.prices[i].name == resName){
							resPrice = item.prices[i].val;
						}
					}
					return resPrice * (Math.pow(priceRatio, num) - 1)/(priceRatio - 1);
				};
				var amt1 = Math.max(getSumOfPrices(unicornGraveyard, "necrocorn") + getSumOfPrices(unicornNecropolis, "necrocorn"), 
				Math.max(this.resPool.get("necrocorn").value, 10));
				var msg = $I("gift.resources", [this.getDisplayValueExt(amt), ucfirst($I("resources.compedium.title"))]);
				msg += $I("gift.resources", [this.getDisplayValueExt(amt1), ucfirst($I("resources.necrocorn.title"))]);
				this.resPool.addResEvent("compedium", amt);
				this.resPool.addResEvent("necrocorn", amt1);
				break;
			case "BurnedParagon":
				if(this.resPool.get("burnedParagon").value > 500){
					var amt = Math.min(this.resPool.get("burnedParagon").value, 1500);
				} else {
					var amt = 150;
				}
				var msg = $I("gift.resources", [this.getDisplayValueExt(amt), ucfirst($I("resources.burnedParagon.title"))]);
				this.resPool.addResEvent("burnedParagon", amt);
			break;
		}

		this.msg(msg);
		this.resPool.addResEvent("elderBox", -1);
		this.resPool.addResEvent("wrappingPaper", 1);
	},

	unlockAll: function(){
		for (var i in this.tabs){
			this.tabs[i].visible = true;
		}

		this.resPool.get("paragon").value = 1;
	},

	isEldermass: function(){
		var date = new Date();
		return (date.getMonth() == 11 && date.getDate() >= 15  && date.getDate() <= 31);
	},
	createRandomName: function(lenConst, charPool) {
		if(!charPool) {
			charPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■◆◆åœ∑ß≈ç∂´®ƒ√∫©†¥˙˜µ∆¨ˆ˚µ≤¬øπ≥…π“æ÷æ«§¡™£¢∞§¶•ªº≠"; //◆ 
		}
		var nameLength = Math.floor(Math.random() * 6 + 5);
		if(lenConst) {
			nameLength = lenConst - 1;
		}
		var name = "";
		for (var i = 0; i <= nameLength; i++){
			name += charPool[Math.floor(Math.random() * charPool.length)];
		}
		return name;
	},

	createRandomVarietyAndColor: function(ch1, ch2){
		if(ch1 == null) {
			ch1 = 10;
		}
		if(ch2 == null) {
			ch2 = 10;
		}
		function rand(ratio){
			return (Math.floor(Math.random() * ratio));
		}
		var color = 0;
		var variety = 0;
		//10% of chance to generate one of 6 primary colors (rare colors TBD)
		if (rand(100) <= ch1){
			color = rand(6) + 1;

			//10% of chance of colored cat to be one of 5 rare varieties (dual, tabby, torbie, calico, spots)
			if (rand(100) <= ch2){
				variety = rand(4) + 1;
			}
		}
		return [color, variety];
	}
});

