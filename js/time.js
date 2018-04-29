dojo.declare("classes.managers.TimeManager", com.nuclearunicorn.core.TabManager, {
    game: null,

    /*
     * Amount of years skipped by CF time jumps
     */
    flux: 0,

    //should not be visible to player other than on time tab
    heat: 0,
    isAccelerated: false,   //do not save this flag or else!

    timestamp: null,    /*NO FUCKING timestamp resources*/

    constructor: function(game){
        this.game = game;

		this.registerMeta("stackable", this.chronoforgeUpgrades, null);
		this.registerMeta("stackable", this.voidspaceUpgrades, null);
		this.setEffectsCachedExisting();
    },

    save: function(saveData){
       saveData["time"] = {
           timestamp: this.game.pauseTimestamp || Date.now(),
           flux: this.flux,
           heat: this.heat,
           cfu: this.filterMetadata(this.chronoforgeUpgrades, ["name", "val", "on", "heat", "isAutomationEnabled"]),
           vsu: this.filterMetadata(this.voidspaceUpgrades, ["name", "val", "on", "reserve"])
       };
    },

    load: function(saveData){
        if (!saveData["time"]){
            return;
        }

        this.flux = saveData["time"].flux || 0;
        this.heat = saveData["time"].heat || 0;
		this.loadMetadata(this.chronoforgeUpgrades, saveData.time.cfu);
		this.loadMetadata(this.voidspaceUpgrades, saveData.time.vsu);

		if (saveData.time.usedCryochambers) { //after reset
			this.loadMetadata(this.voidspaceUpgrades, saveData.time.usedCryochambers);
		}

        if (this.getVSU("usedCryochambers").val > 0) {
			this.getVSU("usedCryochambers").unlocked = true;
        }

        //console.log("restored save data timestamp as", saveData["time"].timestamp);
        var ts = saveData["time"].timestamp || Date.now();

        this.gainTemporalFlux(ts);
        this.timestamp = ts;
	},

	gainTemporalFlux: function (timestamp){
        if (!this.game.science.get("calendar").researched){
            return;
        }

        var now = Date.now();
        var delta = now - ( timestamp || 0 );
        if (delta <= 0){
            return;
        }

		// Update temporalFluxMax from values loaded
        this.game.updateCaches();
        this.game.resPool.update();

		var temporalAccelerator = this.getCFU("temporalAccelerator");
		var energyRatio = 1 + (temporalAccelerator.val * temporalAccelerator.effects["timeRatio"]);
		var temporalFluxGained = Math.round(delta / ( 60 * 1000 ) * (this.game.rate * energyRatio)); // 5 every 60 seconds

		var temporalFluxAdded = this.game.resPool.addResEvent("temporalFlux", temporalFluxGained);

		var bonusSeconds = Math.floor(temporalFluxAdded / this.game.rate);
        if (bonusSeconds > 0){
            this.game.msg("You have recharged " + bonusSeconds + " second"
				+ (bonusSeconds > 1 ? "s" : "") + " of temporal flux");
        }
    },

    resetState: function(){
		this.isAccelerated = false;

        this.timestamp = Date.now();
        this.flux = 0;
        this.heat = 0;

		for (var i = 0; i < this.chronoforgeUpgrades.length; i++) {
			var bld = this.chronoforgeUpgrades[i];
			this.resetStateStackable(bld, bld.isAutomationEnabled, bld.lackResConvert, bld.effects);
		}
		for (var i = 0; i < this.voidspaceUpgrades.length; i++) {
			var bld = this.voidspaceUpgrades[i];
			this.resetStateStackable(bld, bld.isAutomationEnabled, bld.lackResConvert, bld.effects);
		}
    },

    update: function(){
        if (!this.game.challenges.getCondition("disableChrono").on && this.getVSU("usedCryochambers").reserve)
        {
           var cryochambers = this.getVSU("usedCryochambers");
           cryochambers.val += cryochambers.reserve;
           cryochambers.reserve = 0;
        }
        
        if (this.isAccelerated && this.game.resPool.get("temporalFlux").value > 0){
            this.game.resPool.addResEvent("temporalFlux", -1);
        }
        if (!this.game.resPool.get("temporalFlux").value){
            this.isAccelerated = false;
        }

        if (this.heat>0) {								//if we have spare chronoheat
            var perTick = this.game.getEffect("heatPerTick");
            if (this.heat < Math.abs(perTick)){ //limit fuel to what you actually have
                perTick = -this.heat;
            }
            this.getCFU("blastFurnace").heat -= perTick;	//add fuel to the furnace
            this.heat += perTick; 				//lower chronoheat
            if (this.heat < 0){
                this.heat = 0;								//make sure chronoheat does not go below 0
            }
        }

        for (var i in this.chronoforgeUpgrades) {
            var cfu = this.chronoforgeUpgrades[i];
            if (cfu.action) {
                cfu.action(cfu, this.game);
            }
        }
	this.calculateRedshift();
    },

    calculateRedshift: function(){
        if (!this.game.opts.enableRedshift){
            return;
        }

        var currentTimestamp = Date.now();
        var delta = currentTimestamp - this.timestamp;
        //console.log("redshift delta:", delta, "old ts:", this.timestamp, "new timestamp:", currentTimestamp);

        this.timestamp = currentTimestamp;
        if (delta <= 0){
            return;
        }
        var daysOffset = Math.round(delta / (2000/* * this.game.rate*/));

        /*avoid shift because of UI lags*/
        if (daysOffset < 3){
           return;
        }

        var offset = 400 * 10;  //10 years
        if (this.game.calendar.year >= 1000 || this.game.resPool.get("paragon").value > 0){
            offset = 400 * 40;
        }

        //limit redshift offset by 1 year
        if (daysOffset > offset){
            daysOffset = offset;
        }

        //daysOffset = 4000;

        //populate cached per tickValues
        this.game.resPool.update();
        this.game.updateResources();
        // Since workshop requires some resource and we don't want exhaust all resources during workshop so we need a way to consume them.

        var i, res;
        // calculate resource offsets
        for (i in this.game.resPool.resources){
            res = this.game.resPool.resources[i];
            if (res.name == "catnip" && res.perTickCached < 0){
                continue;
            }
            //NB: don't forget to update resources before calling in redshift
            if (res.perTickCached) {
                //console.log("Adjusting resource", res.name, "delta",res.perTickCached, "max value", res.maxValue, "days offset", daysOffset);
                //console.log("resource before adjustment:", res.value);
                this.game.resPool.addRes(res, res.perTickCached * this.game.rate * daysOffset, false/*event?*/);
                //console.log("resource after adjustment:", res.value);

            }
        }

        var numberEvents = this.game.calendar.fastForward(daysOffset);

        this.game.bld.fastforward(daysOffset);
        this.game.workshop.update(this.game.rate * daysOffset);
        this.game.village.fastforward(this.game.rate * daysOffset);
        this.game.space.fastforward(this.game.rate * daysOffset);
        this.game.religion.fastforward(this.game.rate * daysOffset);

        if (daysOffset > 3) {
            this.game.msg($I("time.redshift", [daysOffset]) + (numberEvents ? $I("time.redshift.ext",[numberEvents]) : ""));
        }
    },

	chronoforgeUpgrades: [{
        name: "temporalBattery",
        label: $I("time.cfu.temporalBattery.label"),
        description: $I("time.cfu.temporalBattery.desc"),
        prices: [
            { name : "timeCrystal", val: 5 }
        ],
        effects: {
        	"temporalFluxMax": 750
        },
        priceRatio: 1.25,
        unlocked: true
    },{
        name: "blastFurnace",
        label: $I("time.cfu.blastFurnace.label"),
        description: $I("time.cfu.blastFurnace.desc"),
        prices: [
            { name : "timeCrystal", val: 25 },
            { name : "relic", val: 5 }
        ],
        priceRatio: 1.25,
        effects: {
            "heatMax" : 100,
            "heatPerTick": -0.02
        },
        heat: 0,
        on: 0,
        isAutomationEnabled: true,
        action: function(self, game){

            if (self.on < self.val){
                self.on = self.val;
            }

            if (!self.on || !self.isAutomationEnabled){
                return;
            }

            if (self.heat >= 100){
                var amt = Math.floor(self.heat / 100);
                if (amt > 5){
                    amt = 5; //limit calculations needed per tick
                }
                self.heat -= 100 * amt;
                game.time.shatter(amt);
            }
        },
        unlocked: true
    },{
        name: "temporalAccelerator",
        label: $I("time.cfu.temporalAccelerator.label"),
        description: $I("time.cfu.temporalAccelerator.desc"),
        prices: [
            { name : "timeCrystal", val: 10 },
            { name : "relic", val: 1000 }
        ],
        priceRatio: 1.25,
        effects: {
            "timeRatio" : 0.05
        },
        unlocked: true
    },{
        name: "temporalImpedance",
        label: $I("time.cfu.temporalImpedance.label"),
        description: $I("time.cfu.temporalImpedance.desc"),
        prices: [
            { name : "timeCrystal", val: 100 },
            { name : "relic", val: 250 }
        ],
        priceRatio: 1.05,
        effects: {
            "timeImpedance" : 1000
        },
        unlocked: false
    },{
        name: "ressourceRetrieval",
        label: $I("time.cfu.ressourceRetrieval.label"),
        description: $I("time.cfu.ressourceRetrieval.desc"),
        prices: [
            { name : "timeCrystal", val: 1000 }
        ],
        priceRatio: 1.3,
        limitBuild: 100,
        effects: {
            "shatterTCGain" : 0.01
        },
        unlocked: false
    }],

    voidspaceUpgrades: [{
        name: "cryochambers",
        label: $I("time.vsu.cryochambers.label"),
        description: $I("time.vsu.cryochambers.desc"),
        prices: [
            { name : "timeCrystal", val: 2 },
            { name : "void", val: 100 },
            { name : "karma", val: 1 }
        ],
        priceRatio: 1.25,
        limitBuild: 0,
        breakIronWill: true,
        effects: {
			"maxKittens": 1
        },
        upgrades: {
			voidSpace: ["cryochambers"]
		},
        calculateEffects: function(self, game){
			self.limitBuild = game.bld.get("chronosphere").on;
			self.on = Math.min(self.val, self.limitBuild);
        },
        unlocked: false,
        flavor: $I("time.vsu.cryochambers.flavor")
    },{
        name: "usedCryochambers",
        label: $I("time.vsu.usedCryochambers.label"),
        description: $I("time.vsu.usedCryochambers.desc"),
        prices: [

        ],
        priceRatio: 1.25,
        limitBuild: 0,
        effects: {

        },
        unlocked: false
    },{
        name: "voidHoover",
        label: $I("time.vsu.voidHoover.label"),
        description: $I("time.vsu.voidHoover.desc"),
        prices: [
			{ name: "timeCrystal", val: 10 },
			{ name: "void", val: 250 },
			{ name: "antimatter", val: 1000 }
        ],
        priceRatio: 1.25,
        effects: {
			"temporalParadoxVoid": 1
        },
        unlocked: false
    },{
        name: "voidRift",
        label: $I("time.vsu.voidRift.label"),
        description: $I("time.vsu.voidRift.desc"),
        prices: [
            { name: "void", val: 75 },
        ],
        priceRatio: 1.3,
        effects: {
            "globalResourceRatio": 0.02,
            "umbraBoostRatio": 0.1
        },
        unlocked: false
    },{
        name: "chronocontrol",
        label: $I("time.vsu.chronocontrol.label"),
        description: $I("time.vsu.chronocontrol.desc"),
        prices: [
			{ name: "timeCrystal", val: 30 },
			{ name: "void", val: 500 },
			{ name: "temporalFlux", val: 3000}
        ],
        priceRatio: 1.25,
        effects: {
			"temporalParadoxDay": 0,
			"energyConsumption": 0
        },
		calculateEffects: function(self, game){
			var effects = {
				"temporalParadoxDay": 1 + game.getEffect("temporalParadoxDayBonus")
			};
			effects["energyConsumption"] = 15;
			self.effects = effects;
		},
		unlocks: {
			upgrades: ["turnSmoothly"]
		},
        unlocked: false
    },{
        name: "voidResonator",
        label: $I("time.vsu.voidResonator.label"),
        description: $I("time.vsu.voidResonator.desc"),
        prices: [
            { name: "timeCrystal", val: 1000 },
            { name: "relic", val: 10000 }
        ],
        priceRatio: 1.25,
        effects: {
            "voidResonance" : 0.1
        },
        unlocked: false
    }],

	effectsBase: {
		"temporalFluxMax": 60 * 10 * 5,  //10 minutes (5 == this.game.rate)
        "heatMax": 100,
        "heatPerTick" : -0.01
	},

    getCFU: function(id){
        return this.getMeta(id, this.chronoforgeUpgrades);
    },

    getVSU: function(id){
        return this.getMeta(id, this.voidspaceUpgrades);
    },

    shatter: function(amt){
        amt = amt || 1;

        var game = this.game;
        var cal = game.calendar;
        cal.day = 0;
        cal.season = 0;

        for (var i = 0; i < amt; i++) {
            // Calendar
            cal.year+= 1;
            cal.onNewYear(i + 1 == amt);
            // Space ETA
            var routeSpeed = game.getEffect("routeSpeed") != 0 ? game.getEffect("routeSpeed") : 1;
            for (var j in game.space.planets){
                var planet = game.space.planets[j];
                if (planet.unlocked && !planet.reached){
                    planet.routeDays = Math.max(0, planet.routeDays - 400 * routeSpeed);
                }
            }
            // ShatterTC gain
            var shatterTCGain = game.getEffect("shatterTCGain") * (1+ game.getEffect("rrRatio"));
            if (shatterTCGain > 0) {
                for (var j = 0; j < game.resPool.resources.length; j++){
                    var res = game.resPool.resources[j];
                    var valueAdd = game.getResourcePerTick(res.name, true) * ( 1 / game.calendar.dayPerTick * game.calendar.daysPerSeason * 4) * shatterTCGain;

                    if (res.name != "faith") {
                        //for faith, use like 1% of the resource pool?
                        game.resPool.addResEvent(res.name, valueAdd);
                    } else {
                        var resonatorAmt = this.game.time.getVSU("voidResonator").val;
                        if (resonatorAmt) {

                            //TBH i'm not sure at all how it supposed to work

                            var faithTransferAmt = Math.sqrt(resonatorAmt) * 0.01 * valueAdd;
                            game.resPool.addResEvent(res.name, faithTransferAmt);

                            //console.log("amt transfered:", faithTransferAmt, "%:", Math.sqrt(resonatorAmt), "of total:", valueAdd);
                        }
                    }
                }
            }

            /*for (var j = 0; j< 400; j++){
                this.game.calendar.adjustCryptoPrices(400);
            }*/
        }

        if (amt == 1) {
            game.msg($I("time.tc.shatterOne"), "", "tc");
        } else {
            game.msg($I("time.tc.shatter",[amt]), "", "tc");
        }

        game.time.flux += amt;

        game.challenges.getChallenge("1000Years").unlocked = true;
    },

    unlockAll: function(){
        for (var i in this.cfu){
            this.cfu[i].unlocked = true;
        }
        this.game.msg("All time upgrades are unlocked");
    }
});

dojo.declare("classes.ui.time.AccelerateTimeBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {

    buyItem: function(model, event, callback){
        if (model.enabled) {
            this.toggle();
            callback(true);
        }
        callback(false);
    },

    getName: function(model){
      return $I(this.game.time.isAccelerated ? "time.AccelerateTimeBtn.label.accelerated" : "time.AccelerateTimeBtn.label.normal");
    },

    toggle: function() {
        if (this.game.resPool.get("temporalFlux").value <= 0) {
            this.game.time.isAccelerated = false;
            this.game.resPool.get("temporalFlux").value = 0;
        } else {
            this.game.time.isAccelerated = !this.game.time.isAccelerated;
        }
    }
});


dojo.declare("classes.ui.TimeControlWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
        this.addChild(new com.nuclearunicorn.game.ui.ButtonModern({
            name: "Temporal Control",
            description: $I("time.AccelerateTimeBtn.desc"),
            prices: [],
            controller: new classes.ui.time.AccelerateTimeBtnController(game)
        }, game));
    },

    render: function(container){
        var div = dojo.create("div", null, container);
        var timeSpan = dojo.create("span", null, div);

        this.timeSpan = timeSpan;

        UIUtils.attachTooltip(this.game, this.timeSpan, 0, 200, dojo.hitch(this, function(){
            var tooltip = "Temporal flux can be regenerated over time when game page is closed.";

            if (this.game.workshop.get("chronoforge").researched) {
                tooltip += "<br>Temporal heat is generated by Time Crystal shattering and decreases over time. Every 1 unit of heat over the limit will increase Time Crystal shattering price by 1%";
            }

            return tooltip;
        }));


        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);
    },

    update: function(){
        this.timeSpan.innerHTML = "Temporal Flux: " + this.game.resPool.get("temporalFlux").value.toFixed(0) + "/" + this.game.resPool.get("temporalFlux").maxValue;
        var second = this.game.resPool.get("temporalFlux").value / this.game.rate;
        if (second >= 1){
            this.timeSpan.innerHTML +=  " (" + this.game.toDisplaySeconds(second) + ")";
        }

        if (this.game.workshop.get("chronoforge").researched) {
            var heatMax = this.game.getEffect("heatMax");
            if(this.game.time.heat > heatMax){
                this.timeSpan.innerHTML += "<br>Heat: <span style='color:red;'>" + this.game.time.heat.toFixed(2) + "</span>/" + heatMax;
            } else {
                this.timeSpan.innerHTML += "<br>Heat: " + this.game.time.heat.toFixed(2) + "/" + heatMax;
            }
        }

        this.inherited(arguments);
    }
});

dojo.declare("classes.ui.time.ShatterTCBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {

    defaults: function() {
        var result = this.inherited(arguments);
        result.hasResourceHover = true;
        return result;
    },

    fetchModel: function(options) {
        var self = this;
        var model = this.inherited(arguments);
        model.x5Link = {
            visible: this._canAfford(model) >= 5,
            enabled: true,
            title: "x5",
            handler: function(event){
                self.doShatterAmt(model, event, function(result) {
                    if (result && self.update) {
                        self.update();
                    }
                }, 5);
            }
        },
        model.x100Link = {
            visible: this._canAfford(model) >= 100,
            enabled: true,
            title: "x100",
            handler: function(event){
                self.doShatterAmt(model, event, function(result) {
                    if (result && self.update) {
                        self.update();
                    }
                }, 100);
            }
        };
        return model;
    },

    getName: function(model) {
        var name = this.inherited(arguments);

        if (this.game.time.heat > this.game.getEffect("heatMax")){
            name += " (Overheat)";
        }
        return name;
    },

    getPrices: function(model) {
		var prices_cloned = $.extend(true, [], model.options.prices);

		for (var i = 0; i < prices_cloned.length; i++) {
			var price = prices_cloned[i];
            var impedance = this.game.getEffect("timeImpedance") * (1+ this.game.getEffect("timeRatio"));
			if (price["name"] == "timeCrystal") {
                var darkYears = this.game.calendar.darkFutureYears(true);
                if (darkYears > 0) {
                    price["val"] = 1 + ((darkYears) / 1000) * 0.01;
                }
                var heatMax = this.game.getEffect("heatMax");
                if (this.game.time.heat > heatMax) {
                    price["val"] *= (1 + (this.game.time.heat - heatMax) * 0.01);  //1% per excessive heat unit
                }
                
                price["val"] *= this.game.challenges.getChallengePenalty("1000Years") * this.game.challenges.getChallengeReward("1000Years");
			}
		}

		return prices_cloned;
	},

	getPricesMultiple: function(model, amt) {
		var pricesTotal = 0;

		var prices_cloned = $.extend(true, [], model.options.prices);
        var impedance = this.game.getEffect("timeImpedance") * (1+ this.game.getEffect("timeRatio"));
        var heatMax = this.game.getEffect("heatMax");

        var heatFactor = (this.game.challenges.getChallenge("1000Years").researched && !this.game.challenges.getCondition("disableRewards").on) ? 5 : 10;

		for (var k = 0; k < amt; k++) {
			for (var i = 0; i < prices_cloned.length; i++) {
				var price = prices_cloned[i];
				if (price["name"] == "timeCrystal") {
					var priceLoop = price["val"];
                        var darkYears = this.game.calendar.darkFutureYears(true);
	                if (darkYears > 0) {
	                    priceLoop = 1 + ((darkYears) / 1000) * 0.01;
	                }
	                if ((this.game.time.heat + k * heatFactor) > heatMax) {
	                    priceLoop *= (1 + (this.game.time.heat + k * heatFactor - heatMax) * 0.01);  //1% per excessive heat unit
	                }
	                
	                price["val"] *= this.game.challenges.getChallengePenalty("1000Years") * this.game.challenges.getChallengeReward("1000Years");
					pricesTotal += priceLoop;
				}
			}
		}

		return pricesTotal;
	},

    buyItem: function(model, event, callback){
        if (model.enabled && this.hasResources(model)) {
            var price = this.getPrices(model);
            this.game.resPool.addResEvent("timeCrystal", -price[0].val);
            callback(this.doShatter(model, 1));
        }
        callback(false);
        return true;
    },

    _canAfford: function(model) {
        return Math.floor(this.game.resPool.get("timeCrystal").value / model.prices[0].val);
    },

    doShatterAmt: function(model, event, callback, amt){
        if (!amt){
            amt = 5;
        }
        if (model.enabled) {
            var prices = this.getPricesMultiple(model, amt);
            var hasRes = (prices <= this.game.resPool.get("timeCrystal").value);
            if (hasRes) {
                this.game.resPool.addResEvent("timeCrystal", -prices);
                callback(this.doShatter(model, amt));
                return;
            }
        }
        callback(false);
    },

    doShatter: function(model, amt){

	var factor = (this.game.challenges.getChallenge("1000Years").researched && !this.game.challenges.getCondition("disableRewards").on) ? 5 : 10;
        this.game.time.heat += amt*factor;
        this.game.time.shatter(amt);

        /*var fueling = 100 * amt;				//add 100 fuel per TC
        this.game.time.heat += amt*10;
        this.game.time.getCFU("blastFurnace").heat += fueling;
        return true;*/
    },

    updateVisible: function(model){
        model.visible = (this.game.resPool.get("timeCrystal").value >= 1);
    }
});

dojo.declare("classes.ui.time.ShatterTCBtn", com.nuclearunicorn.game.ui.ButtonModern, {
    /**
     * TODO: this is a horrible pile of copypaste, can we fix it somehow?
     */
    renderLinks: function(){
        var self = this;

        this.x5 = this.addLink(this.model.x5Link.title, this.model.x5Link.handler, false);
        this.x100 = this.addLink(this.model.x100Link.title, this.model.x100Link.handler, false);
    },

    update: function(){
        this.inherited(arguments);
        if (this.x5) {
            dojo.style(this.x5.link, "display", this.model.x5Link.visible ? "" : "none");
        }
        if (this.x100) {
            dojo.style(this.x100.link, "display", this.model.x100Link.visible ? "" : "none");
        }
    }
});

/**
 * I wonder if we can get rid of such tremendous amounts of boilerplate code
 */

dojo.declare("classes.ui.time.ChronoforgeBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.time.getCFU(model.options.id);
        }
        return model.metaCached;
    },
    getName: function(model){
        var meta = model.metadata;
        if (meta.heat){
            return this.inherited(arguments) + " [" + meta.heat.toFixed(0) + "%]";
        }
        return this.inherited(arguments);
    }
});

dojo.declare("classes.ui.ChronoforgeWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
        this.addChild(new classes.ui.time.ShatterTCBtn({
            name: "Combust TC",
            description: "Shatter TC and unleash the stored temporal energy. (If you have a chrono furnace, this will fuel it instead.)<bt> You will jump one year in the future. The price can increase over time.",
            prices: [{name: "timeCrystal", val: 1}],
            controller: new classes.ui.time.ShatterTCBtnController(game)
        }, game));
        var controller = new classes.ui.time.ChronoforgeBtnController(game);
        for (var i in game.time.chronoforgeUpgrades){
            var meta = game.time.chronoforgeUpgrades[i];

            this.addChild(new com.nuclearunicorn.game.ui.BuildingStackableBtn({id: meta.name, controller: controller }, game));
        }
    },

    render: function(container){
        var div = dojo.create("div", null, container);

        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);
    },

    update: function(){
        this.inherited(arguments);
    }
});

dojo.declare("classes.ui.time.VoidSpaceBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.time.getVSU(model.options.id);
        }
        return model.metaCached;
    },

	getName: function(model){
		var meta = model.metadata;
		if (meta.name == "cryochambers" && meta.on != meta.val) {
			return meta.label + " ("+ meta.on + "/" + meta.val + ")";
		} else {
			return this.inherited(arguments);
		}
	},

	getPrices: function(model) {
		var prices = this.inherited(arguments);
		if (model.metadata.name == "cryochambers") {
			for (var i = 0; i < prices.length; i++) {
				if (prices[i].name == "karma") {
					prices[i].val -= prices[i].val * this.game.getHyperbolicEffect(0.01 * this.game.prestige.getBurnedParagonRatio(), 1.0);
				}
			}
		}
		return prices;
	}
});

dojo.declare("classes.ui.time.FixCryochamberBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
    defaults: function() {
        var result = this.inherited(arguments);
        result.hasResourceHover = true;
        return result;
    },

    buyItem: function(model, event, callback){
        if (model.enabled && this.hasResources(model)) {
            this.payPrice(model);

            callback(this.doFixCryochamber(model));
        }
        callback(false);
    },

    doFixCryochamber: function(model){
		var cry = this.game.time.getVSU("cryochambers");
		var usedCry = this.game.time.getVSU("usedCryochambers");
		if (this.game.workshop.get("chronoforge").researched && usedCry.val) {
			usedCry.val -= 1;
			usedCry.on -= 1;
			cry.val += 1;
			cry.on += 1;
			if (!usedCry.on) {
				usedCry.unlocked = false;
			}
            return true;
		}
        return false;
    },

	updateVisible: function(model) {
		model.visible = this.game.workshop.get("chronoforge").researched && this.game.time.getVSU("usedCryochambers").val != 0;
	}
});

dojo.declare("classes.ui.VoidSpaceWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){

		this.addChild(new com.nuclearunicorn.game.ui.ButtonModern({
            name: "Fix Cryochamber",
            description: "Tear the space-time to get back a cryochamber before it was used.",
            prices: [
				{name: "timeCrystal", val: 100},
				{name: "void", val: 500},
				{name: "temporalFlux", val: 3000},
            ],
            controller: new classes.ui.time.FixCryochamberBtnController(game)
        }, game));

        var controller = new classes.ui.time.VoidSpaceBtnController(game);
        for (var i in game.time.voidspaceUpgrades){
            var meta = game.time.voidspaceUpgrades[i];
            this.addChild(new com.nuclearunicorn.game.ui.BuildingStackableBtn( {
                    id: meta.name,
                    controller: controller
                }, game));
        }

    },

    render: function(container){
        var div = dojo.create("div", null, container);

        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);
    },

    update: function(){
        this.inherited(arguments);
    }
});

dojo.declare("classes.ui.ResetWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
        this.addChild(new com.nuclearunicorn.game.ui.ButtonModern({
            name: "Reset",
            description: "Reset current timeline.",
            prices: [],
            handler: function(btn){
                game.reset();
            },
            controller: new com.nuclearunicorn.game.ui.ButtonModernController(game)
        }, game));
    },

    render: function(container){
        var div = dojo.create("div", null, container);

        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);

        var resetDiv = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.resetDiv = resetDiv;
    },

    update: function(){
        this.inherited(arguments);

        var msg = "Reseting the timeline will start the game from the scratch. You will keep all of your statistic and achievements. You may receive various game bonuses.<br>";
        msg += "<br>Resetting at this point will give you:<br>";

        var kittens = this.game.resPool.get("kittens").value;
        var stripe = 5;
        var karmaPointsPresent = this.game.getTriValue(this.game.karmaKittens, stripe);
        var karmaPointsAfter = this.game.getTriValue(this.game.karmaKittens + this.game._getKarmaKittens(kittens), stripe);
		var karmaPoints = Math.floor((karmaPointsAfter - karmaPointsPresent) *100)/100;
        var paragonPoints = 0;

        if (kittens > 70){
			paragonPoints = (kittens - 70);
		}

        msg += "Karma points: " + karmaPoints;
        msg += "<br>Paragon points: " + paragonPoints;

        if (this.game.ironWill){
            msg += "<br>Zebra hunters: " + this.game._getBonusZebras();
        }


        this.resetDiv.innerHTML = msg;
    }
});

dojo.declare("classes.tab.TimeTab", com.nuclearunicorn.game.ui.tab, {

    container: null,

    constructor: function(tabName){
        var timePanel = new com.nuclearunicorn.game.ui.Panel("Time");
        this.addChild(timePanel);

        var timeWgt = new classes.ui.TimeControlWgt(this.game);
        timeWgt.setGame(this.game);
        timePanel.addChild(timeWgt);

        //--------- reset ----------

        this.resetPanel = new com.nuclearunicorn.game.ui.Panel("Reset");
        this.resetPanel.setVisible(true);
        this.addChild(this.resetPanel);

        var resetWgt = new classes.ui.ResetWgt(this.game);
        resetWgt.setGame(this.game);
        this.resetPanel.addChild(resetWgt);

        //--------------------------

        this.cfPanel = new com.nuclearunicorn.game.ui.Panel("Chronoforge");
        this.cfPanel.setVisible(false);
        this.addChild(this.cfPanel);

        var cforgeWgt = new classes.ui.ChronoforgeWgt(this.game);
        cforgeWgt.setGame(this.game);
        this.cfPanel.addChild(cforgeWgt);

        //add CF buttons

        //Shater TC
        //Crystal Hammer (better shattering effect)

        //--------------------------

        this.vsPanel = new com.nuclearunicorn.game.ui.Panel("Void Space");
        this.vsPanel.setVisible(false);
        this.addChild(this.vsPanel);

		var vsWgt = new classes.ui.VoidSpaceWgt(this.game);
        vsWgt.setGame(this.game);
        this.vsPanel.addChild(vsWgt);

    },

    render: function(content){
        this.container = content;

        this.inherited(arguments);
        this.update();
    },

    update: function(){
        this.inherited(arguments);

        var hasCF = this.game.workshop.get("chronoforge").researched;
        if (hasCF){
            this.cfPanel.setVisible(true);
        }

		var hasVS = (this.game.science.get("voidSpace").researched || this.game.time.getVSU("usedCryochambers").val > 0);
        if (hasVS){
            this.vsPanel.setVisible(true);
        }

    }
});
