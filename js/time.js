dojo.declare("classes.managers.TimeManager", com.nuclearunicorn.core.TabManager, {
    game: null,

    /*
     * Amount of years skipped by CF time jumps
     */
    flux: 0,

    //should not be visible to player other than on time tab
    heat: 0,
    isAccelerated: false,

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
           isAccelerated: this.isAccelerated,
           cfu: this.filterMetadata(this.chronoforgeUpgrades, ["name", "val", "on", "heat", "unlocked"]),
           vsu: this.filterMetadata(this.voidspaceUpgrades, ["name", "val", "on"])
       };
    },

    load: function(saveData){
        if (!saveData["time"]){
            return;
        }

        this.flux = saveData["time"].flux || 0;
        this.heat = saveData["time"].heat || 0;
        this.isAccelerated = saveData["time"].isAccelerated || 0;
		this.loadMetadata(this.chronoforgeUpgrades, saveData.time.cfu);
		this.loadMetadata(this.voidspaceUpgrades, saveData.time.vsu);

		this.getCFU("timeBoiler").unlocked = this.getCFU("blastFurnace").val > 0;

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
        var res = this.game.resPool.get("temporalFlux");
        var maxValue = this.game.getEffect("temporalFluxMax") || 0;
            maxValue = this.game.resPool.addResMaxRatios(res, maxValue);

        if (maxValue < 0 ) {
            maxValue = 0;
        }

        res.maxValue = maxValue;

		var temporalAccelerator = this.getCFU("temporalAccelerator");
		var energyRatio = 1 + (temporalAccelerator.val * temporalAccelerator.effects["timeRatio"]);
		var temporalFluxGained = Math.round(delta / ( 60 * 1000 ) * (this.game.ticksPerSecond * energyRatio)); // 5 every 60 seconds

		var temporalFluxAdded = this.game.resPool.addResEvent("temporalFlux", temporalFluxGained);

		var bonusSeconds = Math.floor(temporalFluxAdded / this.game.ticksPerSecond);
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
			this.resetStateStackable(bld);
		}
		for (var i = 0; i < this.voidspaceUpgrades.length; i++) {
			var bld = this.voidspaceUpgrades[i];
			this.resetStateStackable(bld);
		}
    },

    update: function(){
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
        var currentTimestamp = Date.now();
        var delta = this.game.opts.enableRedshift
            ? currentTimestamp - this.timestamp
            : 0;
        //console.log("redshift delta:", delta, "old ts:", this.timestamp, "new timestamp:", currentTimestamp);

        this.timestamp = currentTimestamp;
        if (delta <= 0){
            return;
        }
        var daysOffset = Math.round(delta / 2000);

        /*avoid shift because of UI lags*/
        if (daysOffset < 3){
           return;
        }

        var maxYears = this.game.calendar.year >= 1000 || this.game.resPool.get("paragon").value > 0 ? 40 : 10;
        var offset = this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear * maxYears;

        //limit redshift offset by 1 year
        if (daysOffset > offset){
            daysOffset = offset;
        }

        //populate cached per tickValues
        this.game.resPool.update();
        this.game.updateResources();
        var resourceLimits = this.game.resPool.fastforward(daysOffset);

        var numberEvents = this.game.calendar.fastForward(daysOffset);
        this.game.bld.fastforward(daysOffset);
        this.game.workshop.fastforward(daysOffset);
        this.game.village.fastforward(daysOffset);
        this.game.space.fastforward(daysOffset);
        this.game.religion.fastforward(daysOffset);

        this.game.resPool.enforceLimits(resourceLimits);

         // Transfer chronoheat to the forge
        if (this.heat > 0) {								//if we have spare chronoheat
            var perTickHeatTransfer = Math.abs(this.game.getEffect("heatPerTick"));
            var heatAttemptTransfer = daysOffset * this.game.calendar.ticksPerDay * perTickHeatTransfer;
            var heatTransfer = Math.min(this.heat, heatAttemptTransfer);

            var blastFurnace = this.getCFU("blastFurnace");
            blastFurnace.heat += heatTransfer;
            this.heat -= heatTransfer;

            // Shatter time crystals from the heated forge
            if (blastFurnace.on && blastFurnace.isAutomationEnabled && blastFurnace.heat >= 100){
                var amt = Math.floor(blastFurnace.heat / 100);
                blastFurnace.heat -= 100 * amt;
                this.shatter(amt);
            }
        }

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
        calculateEffects: function(self, game) {
            self.effects["heatMax"] = 100 + game.getEffect("heatMaxExpansion");
        },
        heat: 0,
        on: 0,
        isAutomationEnabled: false,
        action: function(self, game) {
            self.calculateEffects(self, game);

            if (self.isAutomationEnabled == null) {
                self.isAutomationEnabled = false;
            }

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
                game.time.shatter(amt * (game.challenges.getChallengeResearched("1000Years") ? self.on : 1));
            }
        },
		unlocks: {
			chronoforge: ["timeBoiler"]
		},
        unlocked: true
    },{
        name: "timeBoiler",
        label: $I("time.cfu.timeBoiler.label"),
        description: $I("time.cfu.timeBoiler.desc"),
        prices: [
            { name: "timeCrystal", val: 25000 }
        ],
        priceRatio: 1.25,
        effects: {
            "heatMaxExpansion": 10,
            "energyConsumption": 1
        },
        upgrades: {
            chronoforge: ["blastFurnace"]
        },
        // TODO Actually "action" is almost always just updating effects (unclear from the name), better separate the 2 concerns: update effects (can be done several times per tick) and perform specific action (only once per tick!)
        // TODO Separation of concerns currently done only for AI Core and Time Boilers (REQUIRED by non-proportional effect!), will be systematized later
        updateEffects: function(self, game) {
            // TB #1: 10; Total:  10; Average: 10
            // TB #2: 30; Total:  40; Average: 20
            // TB #3: 50; Total:  90; Average: 30
            // TB #4: 90; Total: 160; Average: 40
            // etc.
            self.effects["heatMaxExpansion"] = 10 * self.on;
            self.effects["energyConsumption"] = self.on;
        },
        action: function(self, game) {
            self.updateEffects(self, game);
        },
        unlocked: false
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
        upgrades: {
            chronoforge: ["temporalImpedance"]
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
        calculateEffects: function(self, game) {
            self.effects["timeImpedance"] = Math.round(1000 * (1 + game.getEffect("timeRatio")));
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
        upgrades: {
            spaceBuilding: ["hrHarvester"]
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
			effects["energyConsumption"] *= game.challenges.getEnergyMod();
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
            { name: "void", val: 50 },
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
		"temporalFluxMax": 60 * 10 * 5,  //10 minutes (5 == this.game.ticksPerSecond)
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

        var routeSpeed = game.getEffect("routeSpeed") || 1;
        var shatterTCGain = game.getEffect("shatterTCGain") * (1 + game.getEffect("rrRatio"));
        var resonance = game.getEffect("voidResonance");
        var triggerOotV = resonance && game.prestige.getPerk("voidOrder").researched;
        var faithBonus = 1 + game.religion.getFaithBonus() * 0.25;	//25% of the apocrypha bonus

        var daysPerYear = cal.daysPerSeason * cal.seasonsPerYear;
        var remainingDaysInFirstYear = cal.daysPerSeason * (cal.seasonsPerYear - cal.season) - cal.day;
        cal.day = 0;
        cal.season = 0;

        for (var i = 0; i < amt; i++) {
            var remainingDaysInCurrentYear = i == 0 ? remainingDaysInFirstYear : daysPerYear;
            var remainingTicksInCurrentYear = remainingDaysInCurrentYear * cal.ticksPerDay;

            // Space ETA
            for (var j in game.space.planets) {
                var planet = game.space.planets[j];
                if (planet.unlocked && !planet.reached) {
                    planet.routeDays = Math.max(0, planet.routeDays - remainingDaysInCurrentYear * routeSpeed);
                }
            }

            // ShatterTC gain
            if (shatterTCGain > 0) {
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var resName = game.resPool.resources[j].name;
                    var valueAdd = game.getResourcePerTick(resName, true) * remainingTicksInCurrentYear * shatterTCGain;
                    if (resName == "faith") {
                        valueAdd *= Math.sqrt(this.game.getEffect("voidResonance") / 1000);
                    }
                    game.resPool.addResEvent(resName, valueAdd);
                    //if (resName == "faith") console.log(100 * Math.sqrt(this.game.getEffect("voidResonance") / 1000), "% of total ", game.getResourcePerTick(resName, true) * remainingTicksInCurrentYear * shatterTCGain);
                }
            }

            if (triggerOotV) {
                var orderBonus = remainingTicksInCurrentYear * game.calcResourcePerTick("faith") * 0.1 * (1 + resonance);	//10% of faith transfer per priest
                game.religion.faith += orderBonus * faithBonus;	//25% of the apocrypha bonus
                game.resPool.addResEvent("faith", -orderBonus);
            }

            // Calendar
            cal.year++;
            cal.onNewYear(i + 1 == amt);
        }

        if (amt == 1) {
            game.msg($I("time.tc.shatterOne"), "", "tc");
        } else {
            game.msg($I("time.tc.shatter",[amt]), "", "tc");
        }

        this.flux += amt - 1 + remainingDaysInFirstYear / daysPerYear;

        game.challenges.getChallenge("1000Years").unlocked = true;
        if (game.challenges.getChallenge("1000Years").on && cal.year >= 1000) {
            game.challenges.researchChallenge("1000Years");
        }
    },

    unlockAll: function(){
        for (var i in this.cfu){
            this.cfu[i].unlocked = true;
        }
        this.game.msg("All time upgrades are unlocked");
    }
});

dojo.declare("classes.ui.time.AccelerateTimeBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
    fetchModel: function(options) {
        var model = this.inherited(arguments);
        var self = this;
        model.toggle = {
            title: this.game.time.isAccelerated ? $I("btn.on.minor") : $I("btn.off.minor"),
            tooltip: this.game.time.isAccelerated ? $I("time.AccelerateTimeBtn.tooltip.accelerated") : $I("time.AccelerateTimeBtn.tooltip.normal"),
            visible: true,
            handler: function(btn, callback) {
                if (self.game.resPool.get("temporalFlux").value <= 0) {
                    self.game.time.isAccelerated = false;
                    self.game.resPool.get("temporalFlux").value = 0;
                } else {
                    self.game.time.isAccelerated = !self.game.time.isAccelerated;
                }
                callback(true);
            }
        };
        return model;
    },

    buyItem: function() {
    }
});

dojo.declare("classes.ui.time.AccelerateTimeBtn", com.nuclearunicorn.game.ui.ButtonModern, {
    renderLinks: function() {
        this.toggle = this.addLink(this.model.toggle.title, this.model.toggle.handler, false);
    },

    update: function() {
        this.inherited(arguments);
        this.toggle.link.textContent = this.model.toggle.title;
        this.toggle.link.title = this.model.toggle.tooltip;
    }
});

dojo.declare("classes.ui.TimeControlWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
        this.addChild(new classes.ui.time.AccelerateTimeBtn({
            name: $I("time.AccelerateTimeBtn.label"),
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

    update: function() {
        var temporalFlux = this.game.resPool.get("temporalFlux");
        this.timeSpan.innerHTML = "Temporal Flux: " + temporalFlux.value.toFixed(0) + " / " + temporalFlux.maxValue;

        var remainingTemporalFluxInSeconds = temporalFlux.value / this.game.ticksPerSecond;
        this.timeSpan.innerHTML += " (" + (remainingTemporalFluxInSeconds < 1 ? "0s" : this.game.toDisplaySeconds(remainingTemporalFluxInSeconds)) + " / " + this.game.toDisplaySeconds(temporalFlux.maxValue / this.game.ticksPerSecond) + ")";

        if (this.game.workshop.get("chronoforge").researched) {
            this.timeSpan.innerHTML += "<br>Heat: ";
            var heatMax = this.game.getEffect("heatMax") * (this.game.challenges.getChallengeResearched("1000Years") ? 2 : 1);
            if (this.game.time.heat > heatMax) {
                // When innerHTML is appended with a HTML element, it must be completely (START + content + END) in one strike, otherwise the element is automatically closed before its content is appended
                this.timeSpan.innerHTML += "<span style='color:red;'>" + this.game.getDisplayValueExt(this.game.time.heat) + "</span>";
            } else {
                this.timeSpan.innerHTML += this.game.getDisplayValueExt(this.game.time.heat);
            }
            this.timeSpan.innerHTML += " / " + this.game.getDisplayValueExt(heatMax);

            var heatPerSecond = - this.game.getEffect("heatPerTick") * this.game.ticksPerSecond;
            var remainingHeatDissipationInSeconds = this.game.time.heat / heatPerSecond;
            this.timeSpan.innerHTML += " (" + (remainingHeatDissipationInSeconds < 1 ? "0s" : this.game.toDisplaySeconds(remainingHeatDissipationInSeconds)) + " / " + this.game.toDisplaySeconds(heatMax / heatPerSecond) + ")";
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
        var model = this.inherited(arguments);
        model.nextCycleLink = this._newLink(model, this.game.calendar.yearsPerCycle);
        model.previousCycleLink = this._newLink(model, this.game.calendar.yearsPerCycle * (this.game.calendar.cyclesPerEra - 1));
        model.tenErasLink = this._newLink(model, 10 * this.game.calendar.yearsPerCycle * this.game.calendar.cyclesPerEra);
        return model;
    },

    _newLink: function(model, shatteredQuantity) {
        var self = this;
        return {
            visible: this.getPricesMultiple(model, shatteredQuantity) <= this.game.resPool.get("timeCrystal").value,
            title: "x" + shatteredQuantity,
            handler: function(event) {
                self.doShatterAmt(model, shatteredQuantity);
            }
        };
    },

    getName: function(model) {
        var name = this.inherited(arguments);
        if (this.game.time.heat > this.game.getEffect("heatMax") * (this.game.challenges.getChallengeResearched("1000Years") ? 2 : 1)) {
            name += $I("common.warning");
        }
        return name;
    },

    getPrices: function(model) {
		var prices_cloned = $.extend(true, [], model.options.prices);

		for (var i = 0; i < prices_cloned.length; i++) {
			var price = prices_cloned[i];
            var impedance = this.game.getEffect("timeImpedance");
			if (price["name"] == "timeCrystal") {
                var darkYears = this.game.calendar.darkFutureYears(true);
                if (darkYears > 0) {
                    price["val"] = 1 + ((darkYears) / 1000) * 0.01;
                }
                var heatMax = this.game.getEffect("heatMax") * (this.game.challenges.getChallengeResearched("1000Years") ? 2 : 1);
                if (this.game.time.heat > heatMax) {
                    price["val"] *= (1 + (this.game.time.heat - heatMax) * 0.01);  //1% per excessive heat unit
                }

                price["val"] *= (game.challenges.getChallenge("1000Years").on ? this.game.challenges.getChallengeEffect("1000Years") : 1) * this.game.challenges.getChallengeReward("1000Years");
			}
		}

		return prices_cloned;
	},

	getPricesMultiple: function(model, amt) {
		var pricesTotal = 0;

		var prices_cloned = $.extend(true, [], model.options.prices);
        var impedance = this.game.getEffect("timeImpedance");
        var heatMax = this.game.getEffect("heatMax")  * (this.game.challenges.getChallengeResearched("1000Years") ? 2 : 1);

		for (var k = 0; k < amt; k++) {
			for (var i = 0; i < prices_cloned.length; i++) {
				var price = prices_cloned[i];
				if (price["name"] == "timeCrystal") {
					var priceLoop = price["val"];
                        var darkYears = this.game.calendar.darkFutureYears(true);
	                if (darkYears > 0) {
	                    priceLoop = 1 + ((darkYears) / 1000) * 0.01;
	                }
	                if ((this.game.time.heat + k * 10) > heatMax) {
	                    priceLoop *= (1 + (this.game.time.heat + k * 10 - heatMax) * 0.01);  //1% per excessive heat unit
	                }

	                priceLoop *= (game.challenges.getChallenge("1000Years").on ? this.game.challenges.getChallengeEffect("1000Years") : 1) * this.game.challenges.getChallengeReward("1000Years");
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

    doShatterAmt: function(model, amt) {
        if (!model.enabled) {
            return;
        }
        var price = this.getPricesMultiple(model, amt);
        if (price <= this.game.resPool.get("timeCrystal").value) {
            this.game.resPool.addResEvent("timeCrystal", -price);
            this.doShatter(model, amt);
        }
    },

    doShatter: function(model, amt) {
        this.game.time.heat += amt*10;
        this.game.time.shatter(amt);
    },

    updateVisible: function(model){
        model.visible = (this.game.resPool.get("timeCrystal").value >= 1);
    }
});

dojo.declare("classes.ui.time.ShatterTCBtn", com.nuclearunicorn.game.ui.ButtonModern, {
    /**
     * TODO: this is a horrible pile of copypaste, can we fix it somehow?
     * => the whole button-controller-model stuff will be factorized in order to reduce copy&paste
     */
    renderLinks: function() {
        this.tenEras = this.addLink(this.model.tenErasLink.title, this.model.tenErasLink.handler, false);
        this.previousCycle = this.addLink(this.model.previousCycleLink.title, this.model.previousCycleLink.handler, false);
        this.nextCycle = this.addLink(this.model.nextCycleLink.title, this.model.nextCycleLink.handler, false);
    },

    update: function() {
        this.inherited(arguments);
        dojo.style(this.nextCycle.link, "display", this.model.nextCycleLink.visible ? "" : "none");
        dojo.style(this.previousCycle.link, "display", this.model.previousCycleLink.visible ? "" : "none");
        dojo.style(this.tenEras.link, "display", this.model.tenErasLink.visible ? "" : "none");
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
            description: $I("time.shatter.tc.desc"),
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
            description: $I("time.fixCryochambers.desc"),
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
            description: $I("time.reset.desc"),
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

        var msg = $I("time.reset.instructional");

        var kittens = this.game.resPool.get("kittens").value;
        var stripe = 5;
        var karmaPointsPresent = this.game.getTriValue(this.game.karmaKittens, stripe);
        var karmaPointsAfter = this.game.getTriValue(this.game.karmaKittens + this.game._getKarmaKittens(kittens), stripe);
		var karmaPoints = Math.floor((karmaPointsAfter - karmaPointsPresent) *100)/100;
        var paragonPoints = 0;

        if (kittens > 70){
			paragonPoints = (kittens - 70);
		}

        msg += "<br>" + $I("time.reset.karma") + ": " + karmaPoints;
        msg += "<br>" + $I("time.reset.paragon") + ": " + paragonPoints;

        if (this.game.ironWill){
            msg += "<br>" + $I("time.reset.zebra") + ": " + this.game._getBonusZebras();
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
