dojo.declare("classes.managers.TimeManager", com.nuclearunicorn.core.TabManager, {
    game: null,
    testShatter: 0, //0 is current function call, 1 is shatterInGroupCycles, 2 is shatterInCycles
    /*
     * Amount of years skipped by CF time jumps
     */
    flux: 0,

    //should not be visible to player other than on time tab
    heat: 0,
    isAccelerated: false,

    timestamp: null,    /*please don't move timestamp to resource*/

    queue: null,

    constructor: function(game){
        this.game = game;

		this.registerMeta("stackable", this.chronoforgeUpgrades, null);
		this.registerMeta("stackable", this.voidspaceUpgrades, null);
		this.setEffectsCachedExisting();
        this.queue = new classes.queue.manager(game);
    },

    save: function(saveData) {
        saveData.time = {
            timestamp: this.game.pauseTimestamp || Date.now(),
            flux: this.flux,
            heat: this.heat,
            testShatter: this.testShatter, //temporary
            isAccelerated: this.isAccelerated,
            cfu: this.filterMetadata(this.chronoforgeUpgrades, ["name", "val", "on", "heat", "unlocked", "isAutomationEnabled"]),
            vsu: this.filterMetadata(this.voidspaceUpgrades, ["name", "val", "on"]),
            queueItems: this.queue.queueItems,
            queueSources: this.queue.queueSources
        };
        this._forceChronoFurnaceStop(saveData.time.cfu);
    },

    _forceChronoFurnaceStop: function(cfuSave) {
        for (var i = 0; i < cfuSave.length; i++) {
            var upgrade = cfuSave[i];
            if (upgrade.name == "blastFurnace") {
                upgrade.isAutomationEnabled = false;
                return;
            }
        }
    },

    load: function(saveData){
        if (!saveData["time"]){
            return;
        }

        this.flux = saveData["time"].flux || 0;
        this.heat = saveData["time"].heat || 0;
        this.testShatter = saveData["time"].testShatter || 0; //temporary
        this.isAccelerated = saveData["time"].isAccelerated || false;
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
        this.queue.queueItems = saveData["time"].queueItems || [];
        this.queue.queueSources = saveData["time"].queueSources || this.queue.queueSourcesDefault;
        if (this.queue.queueSources === {} || typeof(this.queue.queueSources["buildings"]) != "boolean") {
            this.queue.queueSources = this.queue.queueSourcesDefault;
        }
        this.queue.alphabeticalSort = saveData["time"].queueAlphabeticalSort;
        for (var i in this.queue.queueSourcesDefault){
            if (this.queue.queueSources[i] === undefined){
                this.queue.queueSources[i] = this.queue.queueSourcesDefault[i];
            }
        }

        this.queue.updateQueueSourcesArr();

        //TODO: move me to UI
        if(!this.game.getFeatureFlag("QUEUE")){
            $("#queueLink").hide();
        }
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
		var temporalFluxGained = Math.round(delta / ( 60 * 1000 ) * (this.game.ticksPerSecond * energyRatio)); // 5 every 60 seconds

		var temporalFluxAdded = this.game.resPool.addResEvent("temporalFlux", temporalFluxGained);

		var bonusSeconds = Math.floor(temporalFluxAdded / this.game.ticksPerSecond);
        if (bonusSeconds > 0){
            this.game.msg($I("time.redshift.temporalFlux", [bonusSeconds]));
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

        //if we have spare chronoheat
        if (this.heat > 0) {
            var perTick = Math.min(this.game.getEffect("heatPerTick"), this.heat);
            var efficiency = 1 + this.game.getEffect("heatEfficiency");
            this.getCFU("blastFurnace").heat += perTick * efficiency;
            this.heat -= perTick;
            if (this.heat < 0) {
                this.heat = 0;
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

    updateQueue: function(){
        if(this.game.getFeatureFlag("QUEUE")){
            this.queue.update();
        }
    },

    applyRedshift: function(daysOffset, ignoreCalendar){
        //populate cached per tickValues
        this.game.resPool.update();
        this.game.updateResources();
        var resourceLimits = this.game.resPool.fastforward(daysOffset);

        var numberEvents = 0;
        if(!ignoreCalendar){
            numberEvents = this.game.calendar.fastForward(daysOffset);
        }
        this.game.bld.fastforward(daysOffset);
        this.game.workshop.fastforward(daysOffset);
        this.game.village.fastforward(daysOffset);
        this.game.space.fastforward(daysOffset);
        this.game.religion.fastforward(daysOffset);

        this.game.resPool.enforceLimits(resourceLimits);

         // Transfer chronoheat to the forge
        if (this.heat > 0) {								//if we have spare chronoheat
            var perTickHeatTransfer = this.game.getEffect("heatPerTick");
            var heatAttemptTransfer = daysOffset * this.game.calendar.ticksPerDay * perTickHeatTransfer;
            var heatTransfer = Math.min(this.heat, heatAttemptTransfer);
            var blastFurnace = this.getCFU("blastFurnace");
            var efficiency = 1 + this.game.getEffect("heatEfficiency");
            blastFurnace.heat += heatTransfer * efficiency;
            this.heat -= heatTransfer;

            // Shatter time crystals from the heated forge
            if (blastFurnace.on && blastFurnace.isAutomationEnabled && blastFurnace.heat >= 100){
                var amt = Math.floor(blastFurnace.heat / 100);
                blastFurnace.heat -= 100 * amt;
                //this.shatter(amt);
                if(this.testShatter == 1) {this.shatterInGroupCycles(amt);}
                //else if(this.testShatter == 2) {this.shatterInCycles(amt);}
                //shatterInCycles is deprecated
                else {this.shatter(amt);}
            }
        }
        return numberEvents;
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
        var numberEvents = 0;
        //limit redshift offset by 1 year
        if (daysOffset > offset){
            daysOffset = offset;
        }
        if(this.game.getFeatureFlag("QUEUE_REDSHIFT")){
            //console.log( "Calculating queue redshift for the following queue:", this.queue.queueItems );
            var result = this.queue.getFirstItemEtaDay();
            var daysOffsetLeft = daysOffset;
            var redshiftQueueWorked = true;
            if (!result[1]){
                numberEvents = this.applyRedshift(daysOffset);
                daysOffsetLeft = 0;
            }
            while (daysOffsetLeft > 0){
                result = this.queue.getFirstItemEtaDay();
                if (!result[1]){
                    this.applyRedshift(daysOffsetLeft, true);
                    daysOffsetLeft = 0;
                    break;
                }
                if (result[1] & redshiftQueueWorked){
                    var daysNeeded = result[0];// + 5; //let's have a little bit more days in case steamwork automation messes things up.
                    if (daysNeeded < 1) {
                        //There are legitimate cases in which the number of days needed would be less than 1.
                        //However, if we were to allow daysNeeded to be 0, there'd be risk of an infinite loop,
                        //so we set the minimum value to 1.
                        //console.log( "Estimated days needed for queue item", this.queue.queueItems[ 0 ], "is too small; setting to a minimum value." );
                        daysNeeded = 1;
                    }
                    daysNeeded /= (this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear);
                    daysNeeded = Math.ceil(daysNeeded);
                    daysNeeded *= (this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear);
                    if (daysNeeded > daysOffsetLeft){
                        this.applyRedshift(daysOffsetLeft, true);
                        daysOffsetLeft = 0;
                        this.queue.update();
                        break;
                    }
                    this.applyRedshift(daysNeeded, true);
                    daysOffsetLeft -= daysNeeded;
                    this.queue.update();
                    /*if (!redshiftQueueWorked){
                        console.warn("Redshift queue failed to build", this.queue.queueItems[0]);
                    }*/
                }else{
                    this.applyRedshift(daysOffsetLeft, true);
                    daysOffsetLeft = 0;
                }
            }
            numberEvents = this.game.calendar.fastForward(daysOffset);
            //console.log( "Queue redshift calculations finished.  This is the new queue:", this.queue.queueItems );
        }
        else{
            numberEvents = this.applyRedshift(daysOffset);
        }

        this.game.msg($I("time.redshift", [daysOffset]) + (numberEvents ? $I("time.redshift.ext",[numberEvents]) : ""));
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
        description: $I("time.cfu.blastFurnace.desc") + "<br>" + $I("time.cfu.blastFurnace.desc2"),
        prices: [
            { name : "timeCrystal", val: 25 },
            { name : "relic", val: 5 }
        ],
        priceRatio: 1.25,
        effects: {
            "heatPerTick": 0.02,
            "heatMax" : 100
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
                var limit = 5;
                //limit calculations needed per tick; 
                //with fast shatter use shatterYearBoost from temporalPress instead
                var test_shatter = game.time.testShatter;
                if (game.time.getCFU("temporalPress").isAutomationEnabled && test_shatter == 1){
                    limit = Math.max(limit, game.getEffect("shatterYearBoost"));
                }
                var amt = Math.floor(self.heat / 100);
                if (amt > limit){
                    amt = limit;
                }
                self.heat -= 100 * amt;
                //game.time.shatter(amt);
                if(test_shatter == 1) {game.time.shatterInGroupCycles(amt);}
                //else if(game.time.testShatter == 2) {game.time.shatterInCycles(amt);}
                //shatterInCycles is deprecated
                else  {game.time.shatter(amt);}
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
        // TODO Separation of concerns currently done only for AI Core, Time Boilers and Hydroponics (REQUIRED by non-proportional effect!), will be systematized later
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
        description: $I("time.cfu.temporalAccelerator.desc") + "<br>" + $I("time.cfu.temporalAccelerator.desc2"),
        prices: [
            { name : "timeCrystal", val: 10 },
            { name : "relic", val: 1000 }
        ],
        priceRatio: 1.25,
        effects: {
            "timeRatio" : 0.05
        },
        calculateEffects: function(self, game) {
            if(self.isAutomationEnabled === null){
                self.isAutomationEnabled = (game.time.testShatter == 1);
            }
            game.time.testShatter = (self.isAutomationEnabled)? 1 : 0;
        },
        isAutomationEnabled: null,
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
    },{
        name: "temporalPress",
        label: $I("time.cfu.temporalPress.label"),
        description: $I("time.cfu.temporalPress.desc"),
        prices: [
            { name : "timeCrystal", val: 100 },
            { name : "void", val: 10 }
        ],
        priceRatio: 1.1,
        limitBuild: 0,
        effects: {
            "shatterYearBoost" : 0,
            "energyConsumption": 5
        },
        calculateEffects: function(self, game){
            if (game.challenges.getChallenge("1000Years").on > 1) {
                //Completing the challenge 2 or more times unlocks the automation feature
                self.description = $I("time.cfu.temporalPress.desc") + "<br>" + $I("time.cfu.temporalPress.desc.automation");
                if (self.isAutomationEnabled == null) { //force non-null value
                    self.isAutomationEnabled = false;
                }
            } else {
                self.description = $I("time.cfu.temporalPress.desc");
                self.isAutomationEnabled = null;
            }

            self.effects["shatterYearBoost"] = (self.isAutomationEnabled)? 5 * game.calendar.yearsPerCycle : game.calendar.yearsPerCycle; //25 or 5 currently
            self.limitBuild = game.getEffect("temporalPressCap");
            self.priceRatio = Math.max(1.01, 1.1 - game.challenges.getChallenge("1000Years").on * 0.001); //first 90 completions of 1000Years make priceRatio cheaper
        },
        isAutomationEnabled: null,
        unlocked: false
    }],

    voidspaceUpgrades: [{
        name: "cryochambers",
        label: $I("time.vsu.cryochambers.label"),
        description: $I("time.vsu.cryochambers.desc"),
        prices: [
            { name : "karma", val: 1 },
            { name : "timeCrystal", val: 2 },
            { name : "void", val: 100 }
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
			self.limitBuild = game.bld.get("chronosphere").on + game.getEffect("cryochamberSupport");
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
        fixPrices:[
            {name: "temporalFlux", val: 3000},
			{name: "timeCrystal", val: 100},
			{name: "void", val: 500}
        ],
        priceRatio: 1.25,
        limitBuild: 0,
        effects: {

        },
        calculateEffects: function(self, game){
            if (self.val > 0){
                game.time.queue.unlockQueueSource("voidSpace");
            }
        },
        unlocked: false
    },{
        name: "voidHoover",
        label: $I("time.vsu.voidHoover.label"),
        description: $I("time.vsu.voidHoover.desc"),
        prices: [
			{ name: "antimatter", val: 1000 },
			{ name: "timeCrystal", val: 10 },
			{ name: "void", val: 250 }
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
            { name: "void", val: 75 }
        ],
        priceRatio: 1.3,
        effects: {
            "umbraBoostRatio": 0.1,
            "globalResourceRatio": 0.02
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
			{ name: "temporalFlux", val: 3000},
			{ name: "timeCrystal", val: 30 },
			{ name: "void", val: 500 }
        ],
        priceRatio: 1.25,
        effects: {
			"temporalParadoxDay": 0,
			"energyConsumption": 15
        },
		calculateEffects: function(self, game){
			self.effects["temporalParadoxDay"] = 1 + game.getEffect("temporalParadoxDayBonus");
		},
		unlockScheme: {
			name: "vintage",
			threshold: 1
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
            { name: "relic", val: 10000 },
            { name: "void", val: 50 }
        ],
        priceRatio: 1.25,
        effects: {
            "voidResonance" : 0.1
        },
        unlocked: false
    }],

	effectsBase: {
		"heatPerTick" : 0.01,
		"heatMax": 100,
		"temporalFluxMax": 60 * 10 * 5  //10 minutes (5 == this.game.ticksPerSecond)
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
        var triggersOrderOfTheVoid = game.getEffect("voidResonance") > 0;

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
                // XXX Partially duplicates resources#fastforward and #enforceLimits, some nice factorization is probably possible
                var limits = {};
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    limits[res.name] = Math.max(res.value, res.maxValue || Number.POSITIVE_INFINITY);
                    game.resPool.addRes(res, game.getResourcePerTick(res.name, true) * remainingTicksInCurrentYear * shatterTCGain, false, true);
                }
                if (this.game.workshop.get("chronoEngineers").researched) {
                    this.game.workshop.craftByEngineers(remainingTicksInCurrentYear * shatterTCGain);
                }
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    res.value = Math.min(res.value, limits[res.name]);
                }
                game.bld.cacheCathPollutionPerTick();
                game.bld.cathPollutionFastForward(remainingTicksInCurrentYear * shatterTCGain);
            }

            if (triggersOrderOfTheVoid) {
                game.religion.triggerOrderOfTheVoid(remainingTicksInCurrentYear);
            }

            // Calendar
            cal.year++;
            cal.onNewYear(i + 1 == amt);
        }

        if (amt == 1) {
            game.msg($I("time.tc.shatterOne"), "", "tcShatter");
        } else {
            game.msg($I("time.tc.shatter",[amt]), "", "tcShatter");
        }

        this.flux += amt - 1 + remainingDaysInFirstYear / daysPerYear;

        game.challenges.getChallenge("1000Years").unlocked = true;
        if (game.challenges.isActive("1000Years") && cal.year >= 1000) {
            game.challenges.researchChallenge("1000Years");
        }

        // Apply seasonEffect for the newSeason
		game.upgrade({
			buildings: ["pasture"]
		});
    },
    /* shatterInCycles does this:
    1) indepenently calculates space travel
    2) while there are still years left:
        2.1)calculates how many years are spent in left in this cycle
        2.2)produces resources as if that number of years was shattered for
        2.3)increases year number that number of years
        2.4)calculates production per millenia (more accurate for paragon production bonuses)
    3)calculates Millenium production
    4)calculates flux
    likely to be deprecated after shatterInGroupCycles is finished
    */
    shatterInCycles: function(amt){
        amt = amt || 1;
        var maxYearsShattered = amt;

        var game = this.game;
        var cal = game.calendar;
        var endYear = cal.year + amt;

        var routeSpeed = game.getEffect("routeSpeed") || 1;
        var shatterTCGain = game.getEffect("shatterTCGain") * (1 + game.getEffect("rrRatio"));
        var triggersOrderOfTheVoid = game.getEffect("voidResonance") > 0;

        var daysPerYear = cal.daysPerSeason * cal.seasonsPerYear;
        var remainingDaysInFirstYear = cal.daysPerSeason * (cal.seasonsPerYear - cal.season) - cal.day;
        var remainingDaysInFirstYearSaved = remainingDaysInFirstYear;
        cal.day = 0;
        cal.season = 0;
        // Space ETA
        var remainingDays = remainingDaysInFirstYear + (amt - 1) * daysPerYear;
        for (var j in game.space.planets) {
            var planet = game.space.planets[j];
            if (planet.unlocked && !planet.reached) {
                planet.routeDays = Math.max(0, planet.routeDays - remainingDays * routeSpeed);
            }
        }

        while(maxYearsShattered > 0){
            var remainingYearsInCurrentCycle = Math.min(cal.yearsPerCycle - cal.cycleYear, maxYearsShattered);
            var remainingDaysInCurrentCycle = (remainingYearsInCurrentCycle - 1) * daysPerYear + remainingDaysInFirstYear;
            var remainingTicksInCurrentCycle = remainingDaysInCurrentCycle * cal.ticksPerDay;

            // ShatterTC gain
            if (shatterTCGain > 0) {
                // XXX Partially duplicates resources#fastforward and #enforceLimits, some nice factorization is probably possible
                var limits = {};
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    limits[res.name] = Math.max(res.value, res.maxValue || Number.POSITIVE_INFINITY);
                    game.resPool.addRes(res, game.getResourcePerTick(res.name, true) * remainingTicksInCurrentCycle * shatterTCGain, false, true);
                }
                if (this.game.workshop.get("chronoEngineers").researched) {
                    this.game.workshop.craftByEngineers(remainingTicksInCurrentCycle * shatterTCGain);
                }
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    res.value = Math.min(res.value, limits[res.name]);
                }
                game.bld.cacheCathPollutionPerTick();
                game.bld.cathPollutionFastForward(remainingTicksInCurrentCycle * shatterTCGain);
            }

            if (triggersOrderOfTheVoid) {
                game.religion.triggerOrderOfTheVoid(remainingTicksInCurrentCycle);
            }

            // Calendar
            cal.year += remainingYearsInCurrentCycle;
            cal.onNewYears(endYear == cal.year, remainingYearsInCurrentCycle, false);
            cal.calculateMilleniumProduction(cal.getMilleniaChanged(cal.year - remainingYearsInCurrentCycle, cal.year));
            maxYearsShattered -= remainingYearsInCurrentCycle;
            remainingDaysInFirstYear = cal.daysPerSeason * cal.seasonsPerYear;
        }
        if (amt == 1) {
            game.msg($I("time.tc.shatterOne"), "", "tcShatter");
        } else {
            game.msg($I("time.tc.shatter",[amt]), "", "tcShatter");
        }
        this.flux += amt - 1 + remainingDaysInFirstYearSaved / daysPerYear;

        game.challenges.getChallenge("1000Years").unlocked = true;
        if (game.challenges.isActive("1000Years") && cal.year >= 1000) {
            game.challenges.researchChallenge("1000Years");
        }
		// Apply seasonEffect for the newSeason
		this.game.upgrade({
			buildings: ["pasture"]
		});
    },
    /*
    shatterInGroupCycles does this:
    1) indepenently calculates space travel
    2) calculates how many years are spent in each cycle (optimised for amt%50 == 0)
    3)while there are still years left:
        3.1) produces resources as if that number of years was shattered for
        3.2) increases year number by min of years till next cycle and years left to shatter
    4)calculates Millenium production
    5)calculates flux
    */
    shatterInGroupCycles: function(amt){
        amt = amt || 1;
        if (amt == 1){
            this.shatter(1);
            return;
        }
        var maxYearsShattered = amt;

        var game = this.game;
        var cal = game.calendar;
        var startYear = cal.year;
        var endYear = cal.year + amt;

        var routeSpeed = game.getEffect("routeSpeed") || 1;
        var shatterTCGain = game.getEffect("shatterTCGain") * (1 + game.getEffect("rrRatio"));
        var triggersOrderOfTheVoid = game.getEffect("voidResonance") > 0;

        var daysPerYear = cal.daysPerSeason * cal.seasonsPerYear;
        var remainingDaysInFirstYear = cal.daysPerSeason * (cal.seasonsPerYear - cal.season) - cal.day;
        var remainingDaysInFirstYearSaved = remainingDaysInFirstYear;
        cal.day = 0;
        cal.season = 0;
        var aiLevel = this.game.bld.get("aiCore").effects["aiLevel"];
        var aiApocalypseLevel = 0;
		if ((aiLevel > 14) && (this.game.science.getPolicy("transkittenism").researched != true) && amt != 1){ //if amt == 1 we just use usual onNewYear calendar function
			aiApocalypseLevel = aiLevel - 14;
		}
        var aiDestructionMod = -Math.min(1, aiApocalypseLevel * 0.01);
        // Space ETA
        var remainingDays = remainingDaysInFirstYear + (amt - 1) * daysPerYear;
        for (var j in game.space.planets) {
            var planet = game.space.planets[j];
            if (planet.unlocked && !planet.reached) {
                planet.routeDays = Math.max(0, planet.routeDays - remainingDays * routeSpeed);
            }
        }
        var remainingCyclesYears = [0,0,0,0,0,0,0,0,0,0];
        if (maxYearsShattered%50 == 0){
            for (j in remainingCyclesYears){
                remainingCyclesYears[j] = maxYearsShattered/10;
            }
        }else{
            var wholeCycleYears = maxYearsShattered - maxYearsShattered%50;
            for (j in remainingCyclesYears){
                remainingCyclesYears[j] = wholeCycleYears/10;
            }
            maxYearsShattered -= wholeCycleYears;
            remainingCyclesYears[cal.cycle] += Math.min(cal.yearsPerCycle - cal.cycleYear, maxYearsShattered);
            maxYearsShattered -= Math.min(cal.yearsPerCycle - cal.cycleYear, maxYearsShattered);
            for (j = 1; j < cal.cyclesPerEra; j++){
                remainingCyclesYears[(cal.cycle + j)%10] += Math.min(cal.yearsPerCycle, maxYearsShattered);
                maxYearsShattered += -Math.min(cal.yearsPerCycle, maxYearsShattered);
            }
        }
        maxYearsShattered = amt;
        var startingCycleNum = cal.cycle;
        for (var cycleNum = 0; cycleNum < cal.cyclesPerEra; cycleNum++){
            var yearsInCurrentCycle = remainingCyclesYears[(cycleNum + startingCycleNum) % 10];
            if (!yearsInCurrentCycle){
                continue;
            }
            var daysInCurrentCycle = (yearsInCurrentCycle - 1) * daysPerYear + remainingDaysInFirstYear;
            var ticksInCurrentCycle = daysInCurrentCycle * cal.ticksPerDay;

            // ShatterTC gain
            if (shatterTCGain > 0) {
                if(yearsInCurrentCycle == 1){ //no need to do AI Apocalypse twice
                    aiApocalypseLevel = 0;
                }
                // XXX Partially duplicates resources#fastforward and #enforceLimits, some nice factorization is probably possible
                var limits = {};
                var delta = {};
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    var resLimit = Math.max(res.value, res.maxValue || Number.POSITIVE_INFINITY);
                    var deltaRes = game.resPool.addRes(res, game.getResourcePerTick(res.name, true) * ticksInCurrentCycle * shatterTCGain, false, true);
                    if (aiApocalypseLevel && res.aiCanDestroy){
                        delta[res.name] = deltaRes;
                    }
                    limits[res.name] = resLimit;
                }
                if (this.game.workshop.get("chronoEngineers").researched) {
                    this.game.workshop.craftByEngineers(ticksInCurrentCycle * shatterTCGain);
                }
                for (var j = 0; j < game.resPool.resources.length; j++) {
                    var res = game.resPool.resources[j];
                    /*
                    if resource can be destroyed by ai:
                        1) and isn't overcapped, and production would cause it to be capped for each year, decrease the cap
                        2) and doesn't have a cap, it will just decrease the number of resources by decreasing it using power function on starting value and sum of geometric progression for produced value
                        3) and (last possible option is that it) we can also limit the cap
                        NOTE: aiDestructionMod is A NEGATIVE VALUE!!!
                    */
                    if (aiApocalypseLevel && res.aiCanDestroy){
                        //console.log(res.name);
                        var oldVal = res.value - delta[res.name];
                        delta[res.name]/= yearsInCurrentCycle||1;  
                        if(resLimit == res.MaxValue && oldVal + delta[res.name] - (oldVal + delta[res.name]) * aiDestructionMod >= resLimit){
                            resLimit = Math.min(resLimit, res.value) * (1 + aiDestructionMod);
                        }else if (!res.maxValue){
                            delta[res.name] = Math.max(delta[res.name], 0);
                            //using sum of geometrical progression:
                            var decreaseOfDelta = -delta[res.name] * (1 - Math.abs(Math.pow(aiDestructionMod, yearsInCurrentCycle)))/(Math.abs(1 - aiDestructionMod)||1);
                            game.resPool.addResEvent(res.name, decreaseOfDelta - oldVal * (1- Math.pow((1 + aiDestructionMod), yearsInCurrentCycle))); //this is no longer broken
                        }else /*if (resLimit == res.value)*/{
                            resLimit = Math.min(resLimit, res.value) * Math.pow(1 + aiDestructionMod, yearsInCurrentCycle);
                        }
                    }
                    res.value = Math.min(res.value, limits[res.name]);
                }
                game.bld.cacheCathPollutionPerTick();
                game.bld.cathPollutionFastForward(ticksInCurrentCycle * shatterTCGain);
            }

            if (triggersOrderOfTheVoid) {
                game.religion.triggerOrderOfTheVoid(ticksInCurrentCycle);
            }

            // Calendar
            cal.year += Math.min(5, maxYearsShattered);
            cal.onNewYears(endYear == cal.year, Math.min(5, maxYearsShattered), false);
            maxYearsShattered -= Math.min(5, maxYearsShattered);
            remainingDaysInFirstYear = cal.daysPerSeason * cal.seasonsPerYear;
        }
        if(maxYearsShattered < 0){console.error("max years shattered negative " + toString(maxYearsShattered));}
        cal.year += maxYearsShattered;
        cal.onNewYears(endYear == cal.year, maxYearsShattered, false);
        cal.calculateMilleniumProduction(cal.getMilleniaChanged(startYear, cal.year));
        if (amt == 1) {
            game.msg($I("time.tc.shatterOne"), "", "tcShatter");
        } else {
            game.msg($I("time.tc.shatter",[amt]), "", "tcShatter");
        }

		if(aiApocalypseLevel){
            this.game.msg($I("ai.apocalypse.msg", [aiApocalypseLevel]), "alert", "ai");
        }
        this.flux += amt - 1 + remainingDaysInFirstYearSaved / daysPerYear;

        game.challenges.getChallenge("1000Years").unlocked = true;
        if (game.challenges.isActive("1000Years") && cal.year >= 1000) {
            game.challenges.researchChallenge("1000Years");
        }
        // Apply seasonEffect for the newSeason
		this.game.upgrade({
			buildings: ["pasture"]
		});
    },
    compareShatterTime: function(shatters, times, ignoreOldFunction, ignoreShatterInCycles, ignoreGroupCycles){
        if(!ignoreOldFunction){
            var oldShatterD1 = new Date();
            for (var i = 0; i < times; i++){
                this.shatter(shatters);
            }
            var oldShatterD2 = new Date();
            console.log("oldShatterAverafe = " + (oldShatterD2.getTime() - oldShatterD1.getTime())/times);
        }
        if (!ignoreGroupCycles){
            var newShatterD1 = new Date();
            for (var i = 0; i < times; i++){
                this.shatterInGroupCycles(shatters);
            }
            var newShatterD2 = new Date();
            console.log("Group shatter average = " + (newShatterD2.getTime() - newShatterD1.getTime())/times);
        }
        if(!ignoreShatterInCycles){
            var new1ShatterD1 = new Date();
            for (var i = 0; i < times; i++){
                this.shatterInCycles(shatters);
            }
            var new1ShatterD2 = new Date();
            if(!ignoreShatterInCycles) {console.log("Cycle shatter average= " + (new1ShatterD2.getTime() - new1ShatterD1.getTime())/times);}
        }

        if(!ignoreOldFunction && !ignoreGroupCycles){
             console.log("newEfficensy = " + (oldShatterD2.getTime() - oldShatterD1.getTime())/(newShatterD2.getTime() - newShatterD1.getTime()));
        }

        if(!ignoreOldFunction && !ignoreShatterInCycles){
            console.log("new1Efficensy = " + (oldShatterD2.getTime() - oldShatterD1.getTime())/(new1ShatterD2.getTime() - new1ShatterD1.getTime()));
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
            cssClass: this.game.time.isAccelerated ? "fugit-on" : "fugit-off",
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
        this.toggle = this.addLink(this.model.toggle);
    },

    update: function() {
        this.inherited(arguments);
        this.updateLink(this.toggle, this.model.toggle);
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
            var tooltip = $I("time.flux.desc");

            if (this.game.workshop.get("chronoforge").researched) {
                tooltip += "<br>" + $I("time.chronoheat");
            }

            return tooltip;
        }));


        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);
    },

    update: function() {
        var temporalFlux = this.game.resPool.get("temporalFlux");
        this.timeSpan.innerHTML = $I("time.flux") + ": " + this.game.getDisplayValueExt(temporalFlux.value) + " / " + temporalFlux.maxValue;

        var remainingTemporalFluxInSeconds = temporalFlux.value / this.game.ticksPerSecond;
        this.timeSpan.innerHTML += " (" + (remainingTemporalFluxInSeconds < 1 ? "0" + $I("unit.s") : this.game.toDisplaySeconds(remainingTemporalFluxInSeconds)) + " / " + this.game.toDisplaySeconds(temporalFlux.maxValue / this.game.ticksPerSecond) + ")";

        if (this.game.workshop.get("chronoforge").researched) {
            this.timeSpan.innerHTML += "<br>" + $I("time.heat") + ": ";
            var heatMax = this.game.getEffect("heatMax");
            if (this.game.time.heat > heatMax) {
                // When innerHTML is appended with a HTML element, it must be completely (START + content + END) in one strike, otherwise the element is automatically closed before its content is appended
                this.timeSpan.innerHTML += "<span style='color:red;'>" + this.game.getDisplayValueExt(this.game.time.heat) + "</span>";
            } else {
                this.timeSpan.innerHTML += this.game.getDisplayValueExt(this.game.time.heat);
            }
            this.timeSpan.innerHTML += " / " + this.game.getDisplayValueExt(heatMax);

            var heatPerSecond = this.game.getEffect("heatPerTick") * this.game.ticksPerSecond;
            var remainingHeatDissipationInSeconds = this.game.time.heat / heatPerSecond;
            this.timeSpan.innerHTML += " (" + (remainingHeatDissipationInSeconds < 1 ? "0" + $I("unit.s") : this.game.toDisplaySeconds(remainingHeatDissipationInSeconds)) + " / " + this.game.toDisplaySeconds(heatMax / heatPerSecond) + ")";
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
        var shatterYearBoost = this.game.getEffect("shatterYearBoost");
        if(shatterYearBoost){
            model.customLink = this._newLink(model, shatterYearBoost); //Creates additional custom shatter link based on the effect
        }
        return model;
    },

    _newLink: function(model, shatteredQuantity) {
        var self = this;
        return {
            visible: this.game.opts.showNonApplicableButtons ||
                (this.getPricesMultiple(model, shatteredQuantity).timeCrystal <= this.game.resPool.get("timeCrystal").value &&
                (this.getPricesMultiple(model, shatteredQuantity).void <= this.game.resPool.get("void").value)
            ),
            title: "x" + shatteredQuantity,
            handler: function(event) {
                self.doShatterAmt(model, shatteredQuantity);
            }
        };
    },

    getName: function(model) {
        var name = this.inherited(arguments);
        if (this.game.time.heat > this.game.getEffect("heatMax")) {
            name += $I("common.warning");
        }
        return name;
    },

    getPrices: function(model) {
		var prices_cloned = $.extend(true, [], model.options.prices);

        if(this.game.getEffect("shatterVoidCost")){
            var shatterVoidCost = this.game.getEffect("shatterVoidCost");
            prices_cloned.push({
                name: "void",
                val: shatterVoidCost
            });
        }

		for (var i in prices_cloned) {
			var price = prices_cloned[i];
			if (price["name"] == "timeCrystal") {
                var darkYears = this.game.calendar.darkFutureYears(true);
                if (darkYears > 0) {
                    price["val"] = 1 + ((darkYears) / 1000) * 0.01;
                }
                var heatMax = this.game.getEffect("heatMax");
                if (this.game.time.heat > heatMax) {
                    price["val"] *= (1 + (this.game.time.heat - heatMax) * 0.01);  //1% per excessive heat unit
                }

                //LDR for the effect "shatterCostReduction" is specified in challenges.js
                price["val"] *= (1 + this.game.getEffect("shatterCostReduction") + this.game.getEffect("shatterCostIncreaseChallenge"));
            }
            else if(price["name"] == "void"){
                var heatMax = this.game.getEffect("heatMax");
                if (this.game.time.heat > heatMax) {
                    price["val"] *= (1 + (this.game.time.heat - heatMax) * 0.01);  //1% per excessive heat unit
                }
            }
        }
		return prices_cloned;
	},

	getPricesMultiple: function(model, amt) {
		var pricesTotal = {
            void: 0,
            timeCrystal: 0
        };

		var prices_cloned = $.extend(true, [], model.options.prices);
        var heatMax = this.game.getEffect("heatMax");

        var heatFactor = this.game.challenges.getChallenge("1000Years").researched ? 5 : 10;

        if(this.game.getEffect("shatterVoidCost")){
            var shatterVoidCost = this.game.getEffect("shatterVoidCost");
            prices_cloned.push({
                name: "void",
                val: shatterVoidCost
            });
        }

		for (var k = 0; k < amt; k++) {
			for (var i in prices_cloned) {
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

                    //LDR for the effect "shatterCostReduction" is specified in challenges.js
                    priceLoop *= (1 + this.game.getEffect("shatterCostReduction") +
                        this.game.getEffect("shatterCostIncreaseChallenge"));

                    pricesTotal.timeCrystal += priceLoop;

				}else if (price["name"] == "void"){
                    var priceLoop = price["val"];
	                if ((this.game.time.heat + k * heatFactor) > heatMax) {
	                    priceLoop *= (1 + (this.game.time.heat + k * heatFactor - heatMax) * 0.01);  //1% per excessive heat unit
                    }
                    pricesTotal.void += priceLoop;
                }
			}
		}
        pricesTotal.void = Math.round(pricesTotal.void * 1000) / 1000;
		return pricesTotal;
	},

    buyItem: function(model, event, callback){
        if (model.enabled && this.hasResources(model)) {
            var price = this.getPrices(model);
            for (var i in price){
                this.game.resPool.addResEvent(price[i].name, -price[i].val);
            }
            this.doShatter(model, 1);
            callback(true);
        }
        callback(false);
        return true;
    },

    doShatterAmt: function(model, amt) {
        if (!model.enabled) {
            return;
        }
        var price = this.getPricesMultiple(model, amt);
        if(price.void){
            if (price.timeCrystal <= this.game.resPool.get("timeCrystal").value &&
            (price.void <= this.game.resPool.get("void").value)) {
                this.game.resPool.addResEvent("timeCrystal", -price.timeCrystal);
                this.game.resPool.addResEvent("void", -price.void);
                this.doShatter(model, amt);
            }
        }
        else if (price.timeCrystal <= this.game.resPool.get("timeCrystal").value) {
            this.game.resPool.addResEvent("timeCrystal", -price.timeCrystal);
            this.doShatter(model, amt);
        }
    },

    doShatter: function(model, amt) {
        var factor = this.game.challenges.getChallenge("1000Years").researched ? 5 : 10;
        this.game.time.heat += amt * factor;
        //this.game.time.shatter(amt);
        if(this.game.time.testShatter == 1) {this.game.time.shatterInGroupCycles(amt);}
        //else if(this.game.time.testShatter == 2) {this.game.time.shatterInCycles(amt);}
        //shatterInCycles is deprecated
        else {this.game.time.shatter(amt);}
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
        this.tenEras = this.addLink(this.model.tenErasLink);
        this.previousCycle = this.addLink(this.model.previousCycleLink);
        this.nextCycle = this.addLink(this.model.nextCycleLink);
        if(this.model.customLink){
            this.custom = this.addLink(this.model.customLink);
        }
    },

    update: function() {
        this.inherited(arguments);
        dojo.style(this.nextCycle.link, "display", this.model.nextCycleLink.visible ? "" : "none");
        dojo.style(this.previousCycle.link, "display", this.model.previousCycleLink.visible ? "" : "none");
        dojo.style(this.tenEras.link, "display", this.model.tenErasLink.visible ? "" : "none");
        if(this.custom){
            dojo.style(this.custom.link, "display", (this.model.customLink && this.model.customLink.visible) ? "" : "none");
        }
        if  (this.model.tenErasLink.visible) {
            dojo.addClass(this.tenEras.link,"rightestLink");
            dojo.removeClass(this.previousCycle.link,"rightestLink");
        } else if (this.model.previousCycleLink.visible) {
            dojo.addClass(this.previousCycle.link,"rightestLink");
            dojo.removeClass(this.nextCycle.link,"rightestLink");
        } else if (this.model.nextCycleLink.visible) {
            dojo.addClass(this.nextCycle.link,"rightestLink");
        }

        if(this.model.customLink){
            this.updateLink(this.custom, this.model.customLink); //need this to sync the changes of effect and shatter number. this might be a hack :3
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
            return this.inherited(arguments) + " [" + this.game.getDisplayValueExt(meta.heat) + "%]";
        }
        return this.inherited(arguments);
    },
    handleToggleAutomationLinkClick: function(model) { //specify game.upgrade for cronoforge upgrades
		var building = model.metadata;
		building.isAutomationEnabled = !building.isAutomationEnabled;
			this.game.upgrade({chronoforge: [building.name]});
	}
});

dojo.declare("classes.ui.ChronoforgeWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
        this.addChild(new classes.ui.time.ShatterTCBtn({
            name: $I("time.shatter.tc"),
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
			return meta.label + " (" + meta.on + "/" + meta.val + ")";
		} else {
			return this.inherited(arguments);
		}
	},

	getPrices: function(model) {
		var prices = this.inherited(arguments);
		if (model.metadata.name == "cryochambers") {
			for (var i = 0; i < prices.length; i++) {
				if (prices[i].name == "karma") {
					prices[i].val -= prices[i].val * this.game.getLimitedDR(0.01 * this.game.prestige.getBurnedParagonRatio(), 1);
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

	buyItem: function(model, event, callback) {
		if (!model.enabled) {
			callback(false);
			return;
		}

		var fixCount = event.shiftKey
			? 1000
			: event.ctrlKey || event.metaKey /*osx tears*/
				? this.game.opts.batchSize || 10
				: 1;
		fixCount = Math.min(fixCount, this.game.time.getVSU("usedCryochambers").val);

		var fixHappened = false;
		for (var count = 0; count < fixCount && this.hasResources(model); ++count) {
			this.payPrice(model);
			fixHappened |= this.doFixCryochamber(model);
		}
        if(fixHappened){
            var cry = this.game.time.getVSU("cryochambers");
            cry.calculateEffects(cry, this.game);
        }
		callback(fixHappened);
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
            name: $I("time.fixCryochambers.label"),
            description: $I("time.fixCryochambers.desc"),
            prices: game.time.getVSU("usedCryochambers").fixPrices,
            /*prices: [
				{name: "temporalFlux", val: 3000},
				{name: "timeCrystal", val: 100},
				{name: "void", val: 500}
            ],*/
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
            name: $I("menu.reset"),
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

		var _prestige = this.game.getResetPrestige();
		var paragonPoints = _prestige.paragonPoints;
		var karmaKittens = _prestige.karmaKittens;

        var stripe = 5;
        var karmaPointsPresent = this.game.getUnlimitedDR(this.game.karmaKittens, stripe);
        var karmaPointsAfter = this.game.getUnlimitedDR(karmaKittens, stripe);
		var karmaPoints = Math.floor((karmaPointsAfter - karmaPointsPresent) * 100) / 100;



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
        var timePanel = new com.nuclearunicorn.game.ui.Panel($I("tab.name.time"));
        this.addChild(timePanel);

        var timeWgt = new classes.ui.TimeControlWgt(this.game);
        timeWgt.setGame(this.game);
        timePanel.addChild(timeWgt);

        //--------- reset ----------

        this.resetPanel = new com.nuclearunicorn.game.ui.Panel($I("menu.reset"));
        this.resetPanel.setVisible(true);
        this.addChild(this.resetPanel);

        var resetWgt = new classes.ui.ResetWgt(this.game);
        resetWgt.setGame(this.game);
        this.resetPanel.addChild(resetWgt);

        //--------------------------

        this.cfPanel = new com.nuclearunicorn.game.ui.Panel($I("workshop.chronoforge.label"));
        this.cfPanel.setVisible(false);
        this.addChild(this.cfPanel);

        var cforgeWgt = new classes.ui.ChronoforgeWgt(this.game);
        cforgeWgt.setGame(this.game);
        this.cfPanel.addChild(cforgeWgt);

        //add CF buttons

        //Shater TC
        //Crystal Hammer (better shattering effect)

        //--------------------------

        this.vsPanel = new com.nuclearunicorn.game.ui.Panel($I("science.voidSpace.label"));
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


dojo.declare("classes.queue.manager", null,{
    game: null,
    alphabeticalSort: true,
    queueItems : [],

    toggleAlphabeticalSort: function(){
        this.alphabeticalSort = !this.alphabeticalSort;
    },
    /**
     * Returns eta and
     * if the eta was actually calculated.
     * For now ignores per day and per year production.
     * Corruption is also ignored.
     */
    getFirstItemEtaDay: function(){
        if (this.queueItems.length == 0){
            return [0, false];
        }
        var eta = 0;
        var element = this.queueItems[0];
        if (!element) {
            //This is probably a null queue item.  Treat it as if it were a valid building that can be built for free.
            //Later on when we update the queue, this null item should be removed & we'll go on to the next.
            return [0, true];
        }
        var modelElement = this.getQueueElementModel(element);
        var prices = modelElement.prices;
        var engineersConsumed = this.game.workshop.getConsumptionEngineers();
        for (var ind in prices){
            var price = prices[ind];
            var res = this.game.resPool.get(price.name);
		    if (res.value >= price.val){
                //We already have enough of this resource.
                continue;
            }
            if (res.maxValue < price.val){
                //We don't have enough storage space to ever be able to afford the price.
                return [eta, false];
            }
            var resPerTick = this.game.getResourcePerTick(res.name, true);
            var engineersProduced = this.game.workshop.getEffectEngineer(res.name, true);
            var deltaPerTick = resPerTick + (engineersConsumed[res.name] || 0)+ engineersProduced;
            if (deltaPerTick <= 0) {
                //We are losing this resource over time (or not producing any), so we'll never be able to afford the price.
                return [eta, false];
            }
            eta = Math.max(eta,
            (price.val - res.value) / (deltaPerTick) / this.game.calendar.ticksPerDay
            );
            if (engineersProduced){
                var countdown = (1 / (this.game.workshop.getEffectEngineer(res.name, false))) / this.game.calendar.ticksPerDay;
                eta = Math.ceil(eta/countdown)*countdown;
            }
        }
        eta = Math.ceil(eta);
        return [eta, true];
    },
    updateQueueSourcesArr: function(){
        for (var i in this.queueSources){
            if (!this.queueSources[i]){
                continue;
            }
            var add_to_arr = true;
            for (var el in this.queueSourcesArr){
                if (this.queueSourcesArr[el].name == i){
                    add_to_arr = false;
                    break;
                }
            }
            if(add_to_arr){
                this.queueSourcesArr.push({name: i, label: this.queueLabels[i]});
            }
        }
        self.queueSourcesArr;
    },
    /*queueSources : ["policies", "tech", "buildings", "spaceMission",
                    "spaceBuilding","chronoforge", "voidSpace", "zigguratUpgrades",  
                    "religion", "upgrades", "zebraUpgrades", "transcendenceUpgrades"],*/
    //queueSources: ["buildings", "spaceBuilding", "zigguratUpgrades", "transcendenceUpgrades"],
    queueLabels: {
        "buildings" : $I("buildings.tabName"),
        "tech" : $I("techs.panel.label"),
        "upgrades" : $I("workshop.upgradePanel.label"),
        "policies" : $I("policy.panel.label"),
        "religion" : $I("religion.panel.orderOfTheSun.label"),
        "zebraUpgrades" : $I("workshop.zebraUpgradesPanel.label"),
        "spaceMission" : $I("space.ground.control.label"),
        "spaceBuilding" : $I("tab.name.space"),
        "zigguratUpgrades" : $I("religion.panel.ziggurat.label"),
        "transcendenceUpgrades" : $I("religion.panel.cryptotheology.label"),
        "chronoforge" : $I("workshop.chronoforge.label"),
        "voidSpace" : $I("science.voidSpace.label"),
    },
    queueSourcesArr: [{name: "buildings", label: $I("buildings.tabName")}],
    queueSourcesDefault: {
        "buildings": true, 
        "tech": false,
        "upgrades": false,
        "policies": false,
        "religion": false,
        "zebraUpgrades": false,
        "spaceMission": false,
        "spaceBuilding": false,
        "zigguratUpgrades": false,
        "transcendenceUpgrades": false,
        "chronoforge": false,
        "voidSpace": false,
        },
    queueSources: {},
    queueNonStackable:[
        "tech", "upgrades", "policies", "zebraUpgrades", "spaceMission"
    ],
    unlockQueueSource: function(source){
        if(this.queueSources[source] === false){
            this.queueSources[source] = true;
            this.queueSourcesArr.push({name: source, label: this.queueLabels[source]});
        }
    },
    cap: 0,
    baseCap :2,

    constructor: function(game){
        this.game = game;
        
    },

    /**
     * Get maximum amount if individual (not grouped) items in the queue (see #queueLength)
     */
    calculateCap: function(){
        var aiCore = this.game.bld.getBuildingExt("aiCore");
        return aiCore.meta.on + this.game.space.getBuilding("entangler").effects["hashRateLevel"] + this.baseCap + this.game.getEffect("queueCap");
    },

    /**
     * Get a length of all items in the queue (not a lenght of internal queue array) 
     * E.g.
     * 
     * catnip field (2)
     * mountain (1)
     * 
     * Should return a total length of 3
     * */
    queueLength: function(){
        var length = 0;
        dojo.forEach(this.queueItems, function(item) {
            if(item) {
                length += item.value || 1;
            }
            //Else, the item is null or invalid, so don't count it.
        });
        return length;
    },

    addToQueue: function(name, type, label, shiftKey /*add all*/){
        if (!name || !type){
            console.error("queueMgr#addToQueue: unable to add item:", name, type, label);
            return;
        }

        if(this.queueLength() >= this.cap){
            return;
        }

        //TODO: too complex logic, can we streamline it somehow?
        var lastItem = this.queueItems[this.queueItems.length - 1];
        if(this.queueItems.length > 0 && lastItem && lastItem.name == name){
            if(this.queueNonStackable.includes(type)){
                return;
            }
            var valOfItem = (lastItem.value || 1) + 1;
            lastItem.value = valOfItem;

            if (shiftKey){
                while(this.queueLength() < this.cap){
                    this.addToQueue(name, type, label, false);
                }
            }
            return;
        }
        
        if(!label){
            label = "$" + name + "$";
        }

        this.queueItems.push({
            name: name,
            type: type,
            label: label,
            value: 1    //always store size of the queue group, even if it is a single item
        });

        if (shiftKey && !this.queueNonStabkable.includes(type)){
            while(this.queueLength() < this.cap){
                this.addToQueue(name, type, label, false);
            }
        }
    },

    /**
     * Removes an item based on the queue group number (index) and amount
     * @param {*} index 
     * @param {*} amt 
     * 
     * @returns ture if element was removed and false otherwise
     */
    remove: function(index, amt){
        if (index < 0 || index >= this.queueItems.length){
            console.warn("queue#remove - invalid index", index);
            return false;
        }
        var item = this.queueItems[index];
        item.value -= amt;

        if (!item.value){
            this.queueItems.splice(index, 1);
        }

        return true;
    },

    /**
     * Pushes item back in the queue based on the queue group number (index)
     * @param {*} index 
     * 
     * @returns true if element was moved successfully and false otherwise
     */
    pushBack: function(index){
        if (index < 0 || index >= this.queueItems.length - 1 ){
            console.warn("queue#remove - invalid index", index);
            return false;
        }

        var item = this.queueItems[index];
        this.queueItems[index] = this.queueItems[index + 1];
        this.queueItems[index + 1] = item;

        return true;
    },

    /**
     * Pushes item to the front in the queue based on the queue group number (index)
     * @param {*} index 
     * 
     * @returns true if element was moved successfully and false otherwise
     */
    pushFront: function(index){
        if (index < 1 || index >= this.queueItems.length){
            console.warn("queue#remove - invalid index", index);
            return false;
        }
        
        var item = this.queueItems[index];
        this.queueItems[index] = this.queueItems[index - 1];
        this.queueItems[index - 1] = item;

        return true;
    },

    /**
     * Return a list of sub-options for a building queue
     * in a form of [{
     *      name: <queue item name>,
     *      label: <display label>
     * }]
     * based on game.time.queue.alphabeticalSort
     * 
     * @param {*} type: queue type (buildings, upgrades, etc.). See game.time.queue.queueSources
     * @returns 
     */
    getQueueOptions: function(type){
        if (this.alphabeticalSort){
            return this.getQueueOptionsAlphabetical(type);
        }else{
            return this.getQueueOptionsUnsorted(type);
        }
    },
    /**
     * Return sorted list of sub-options for a building queue
     * in a form of [{
     *      name: <queue item name>,
     *      label: <display label>
     * }]
     *
     * 
     * @param {*} type: queue type (buildings, upgrades, etc.). See game.time.queue.queueSources
     * @returns 
     */
    getQueueOptionsAlphabetical: function(type){
        return this.getQueueOptionsUnsorted(type).sort(function(a, b) { return a.label.localeCompare(b.label);});
    },
    
    /**
     * Return unsorted list of sub-options for a building queue
     * in a form of [{
     *      name: <queue item name>,
     *      label: <display label>
     * }]
     * 
     * @param {*} type: queue type (buildings, upgrades, etc.). See game.time.queue.queueSources
     * @returns 
     */
    getQueueOptionsUnsorted: function(type){
        var options = [];
        switch (type){
            case "buildings":
                var bld = this.game.bld;
                for (var i in bld.buildingsData){
                    var building = bld.buildingsData[i];

                    if(!building.unlocked){
                        continue;
                    }

                    var name = building.name;
                    var label = building.label;
                    if(building.stages){
                        if(building.stages){
                            label = building.stages[building.stage].label;
                        }
                    }
                    options.push({
                        name: name,
                        label: label
                    });
                    
                }
                return options;

            case "spaceBuilding":
                var spaceBuildMap = this.game.space.spaceBuildingsMap;
                for (var i in spaceBuildMap){
                    var building = this.game.space.getBuilding(spaceBuildMap[i]);
                    if(building.unlocked){
                        options.push({
                            name: building.name,
                            label: building.label
                        });
                    }
                }
                return options;

            case "zigguratUpgrades":
                var zigguratUpgrades = this.game.religion.zigguratUpgrades;
                for (var i in zigguratUpgrades){
                    var building = this.game.religion.zigguratUpgrades[i];
                    if(building.unlocked){
                        options.push({
                            name: building.name,
                            label: building.label
                        });
                    }
                }
                return options;

            case "transcendenceUpgrades":
                var transcendenceUpgrades = this.game.religion.transcendenceUpgrades;
                for (var i in transcendenceUpgrades){
                    var building = this.game.religion.transcendenceUpgrades[i];
                    if(building.unlocked){
                        options.push({
                            name: building.name,
                            label: building.label
                        });
                    }
                }
                return options;
                
            case "chronoforge":
                var chronoforgeUpgrades = this.game.time.chronoforgeUpgrades;
                for (var i in chronoforgeUpgrades){
                    var building = chronoforgeUpgrades[i];
                    if (building.unlocked){
                        options.push({
                            name: building.name,
                            label: building.label
                        });
                    }
                }
                return options;

            case "voidSpace":
                var voidSpaceUpgrades = this.game.time.voidspaceUpgrades;
                for (var i in voidSpaceUpgrades){
                    var building = voidSpaceUpgrades[i];
                    if(building.name == "usedCryochambers"){
                        options.push({
                            name: building.name,
                            label: $I("time.fixCryochambers.label")
                        });
                        continue;
                    }
                    if (building.unlocked){
                        options.push({
                            name: building.name,
                            label: building.label
                        });
                    }
                }
                return options;

            case "tech":
                var technologies = this.game.science.techs;
                for (var i in technologies){
                    var technology = technologies[i];
                    if (technology.unlocked && !technology.researched){
                        options.push({
                            name: technology.name,
                            label: technology.label
                        });
                    }
                }
                return options;

            case "upgrades":
                var upgrades = this.game.workshop.upgrades;
                for (var i in upgrades){
                    var upgrade = upgrades[i];
                    if (upgrade.unlocked && !upgrade.researched){
                        options.push({
                            name: upgrade.name,
                            label: upgrade.label
                        });
                    }
                }
                return options;

            case "zebraUpgrades":
                var zebraUpgrades = this.game.workshop.zebraUpgrades;
                for (var i in zebraUpgrades){
                    var upgrade = zebraUpgrades[i];
                    if (upgrade.unlocked && !upgrade.researched){
                        options.push({
                            name: upgrade.name,
                            label: upgrade.label
                        });
                    }
                }
                return options;

            case "spaceMission":
                var spaceMissions = this.game.space.programs;
                for (var i in spaceMissions){
                    var program = spaceMissions[i];
                    if (program.unlocked && !program.val){
                        options.push({
                            name: program.name,
                            label: program.label
                        });
                    }
                }
                return options;

            case "policies":
                var policies = this.game.science.policies;
                for (var i in policies){
                    var policy = policies[i];
                    if (policy.unlocked && !policy.researched && !policy.blocked){
                        options.push({
                            name: policy.name,
                            label: policy.label
                        });
                    }
                }
                return options;

            case "religion":
                var religionUpgrades = this.game.religion.religionUpgrades;
                if(this.game.challenges.getChallenge("atheism").active){
                    return options; //just in case
                }
                for (var i in religionUpgrades){
                    var upgrade = religionUpgrades[i];
                    if (upgrade.faith <= this.game.religion.faith && (!upgrade.noStackable || !upgrade.val)){
                        options.push({
                            name: upgrade.name,
                            label: upgrade.label
                        });
                    }
                }
                return options;

            default:
                return options;
        }
    },
    dropLastItem: function(){
        var item = this.queueItems[0];
        if(item.value && item.value > 1){
            item.value -= 1;
        }
        else{
            this.queueItems.shift();
            this.game._publish("ui/update", this.game);
        }
    },
    listDrop: function(event){
        //this.queueItems.pop();
        this.dropLastItem();
        this.showList();
    },
    getQueueElementModel: function(el){
        var itemMetaRaw = this.game.getUnlockByName(el.name, el.type);
        if (!itemMetaRaw){
            console.error("invalid queue item:", el);
            return;
        }

        var props = {
            id: itemMetaRaw.name
        };
        switch (el.type){
            case "policies":
                props.controller = new classes.ui.PolicyBtnController(this.game);
                var model = props.controller.fetchModel(props);
                break;
            case "tech":
                props.controller = new com.nuclearunicorn.game.ui.TechButtonController(this.game);
                var model = props.controller.fetchModel(props);
                break;

            case "buildings":
                var bld = new classes.BuildingMeta(itemMetaRaw).getMeta();
                props = {
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
                break;

            case "spaceMission":
                props.controller = new com.nuclearunicorn.game.ui.SpaceProgramBtnController(this.game);
                var model = props.controller.fetchModel(props);
                break;

            case "spaceBuilding":
                props.controller = new classes.ui.space.PlanetBuildingBtnController(this.game);
                var model = props.controller.fetchModel(props);
                break;

            case "chronoforge":
                props.controller = new classes.ui.time.ChronoforgeBtnController(this.game);
                var model = props.controller.fetchModel(props);
                break;

            case "voidSpace":
                props.controller = new classes.ui.time.VoidSpaceBtnController(this.game);
                var model = props.controller.fetchModel(props);
                if(el.name == "usedCryochambers"){ //a bunch of model black magic
                    props.controller = new classes.ui.time.FixCryochamberBtnController(this.game);
                    itemMetaRaw = this.game.getUnlockByName("cryochambers", el.type);
                    model.prices = this.game.time.getVSU("usedCryochambers").fixPrices;
                    model.enabled = this.game.resPool.hasRes(model.prices); //check we actually have enough to do one fix!
                    console.log(model);
                }
                break;

            case "zigguratUpgrades":
                props.controller = new com.nuclearunicorn.game.ui.ZigguratBtnController(this.game);
                //var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "religion":
                props.controller = new com.nuclearunicorn.game.ui.ReligionBtnController(this.game);
                //var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "transcendenceUpgrades":
                props.controller = new classes.ui.TranscendenceBtnController(this.game);
                //var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "pacts":
                props.controller = new com.nuclearunicorn.game.ui.PactsBtnController(this.game);
                //var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "upgrades":
                //compare = "researched";
                props.controller = new com.nuclearunicorn.game.ui.UpgradeButtonController(this.game);
                //var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;

            case "zebraUpgrades":
                //compare = "researched";
                props.controller = new com.nuclearunicorn.game.ui.ZebraUpgradeButtonController(this.game);
                //var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;
        }
        //return props, model;
        return model;
    },
    update: function(){
        this.cap = this.calculateCap();
        if(!this.queueItems.length){
            return;
        }
        var el = this.queueItems[0];

        if (!el){
            console.warn("null queue item, skipping");
            this.queueItems.shift();
            this.game._publish("ui/update", this.game);
            return;
        }

        var itemMetaRaw = this.game.getUnlockByName(el.name, el.type);
        var compare = "val"; //we should do some sort of refractoring of the switch mechanism

        if (!itemMetaRaw){
            console.error("invalid queue item:", el);
            return;
        }

        var props = {
            id: itemMetaRaw.name
        };
        var buyItem = true;

        switch (el.type){
            case "policies":
                compare = ["researched", "blocked"];
                props.controller = new classes.ui.PolicyBtnController(this.game);
                var oldVal = {
                    researched: itemMetaRaw.researched,
                    blocked: itemMetaRaw.blocked
                };
                var model = props.controller.fetchModel(props);
                break;
                
            case "tech":
                compare = "researched";
                props.controller = new com.nuclearunicorn.game.ui.TechButtonController(this.game);
                var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;

            case "buildings":
                var bld = new classes.BuildingMeta(itemMetaRaw).getMeta();
                    oldVal = itemMetaRaw.val;
                props = {
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
                props.controller.build(model, 1);
                buyItem = false;
                break;

            case "spaceMission":
                compare = "reached";
                props.controller = new com.nuclearunicorn.game.ui.SpaceProgramBtnController(this.game);
                var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;

            case "spaceBuilding":
                props.controller = new classes.ui.space.PlanetBuildingBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "chronoforge":
                props.controller = new classes.ui.time.ChronoforgeBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "voidSpace":
                props.controller = new classes.ui.time.VoidSpaceBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                if(el.name == "usedCryochambers"){ //a bunch of model black magic
                    props.controller = new classes.ui.time.FixCryochamberBtnController(this.game);
                    itemMetaRaw = this.game.getUnlockByName("cryochambers", el.type);
                    model.prices = this.game.time.getVSU("usedCryochambers").fixPrices;
                    model.enabled = this.game.resPool.hasRes(model.prices); //check we actually have enough to do one fix!
                    console.log(model);
                }
                break;

            case "zigguratUpgrades":
                props.controller = new com.nuclearunicorn.game.ui.ZigguratBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "religion":
                props.controller = new com.nuclearunicorn.game.ui.ReligionBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "transcendenceUpgrades":
                props.controller = new classes.ui.TranscendenceBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "pacts":
                props.controller = new com.nuclearunicorn.game.ui.PactsBtnController(this.game);
                var oldVal = itemMetaRaw.val;
                var model = props.controller.fetchModel(props);
                break;

            case "upgrades":
                compare = "researched";
                props.controller = new com.nuclearunicorn.game.ui.UpgradeButtonController(this.game);
                var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;

            case "zebraUpgrades":
                compare = "researched";
                props.controller = new com.nuclearunicorn.game.ui.ZebraUpgradeButtonController(this.game);
                var oldVal = itemMetaRaw.researched;
                var model = props.controller.fetchModel(props);
                break;
        }
        
        if(!props.controller){
            console.error(el.name + " of " + el.type + " queing is not supported!");
            var deletedElement = this.queueItems.shift();
            this.game._publish("ui/update", this.game);
        }
        if(buyItem){
            props.controller.buyItem(model, 1,  function(result) {});
        }
        var changed = false;
        if (Array.isArray(compare)){
            for (var i in compare){
                if (oldVal[compare[i]] != model.metadata[compare[i]]){
                    changed = true;
                }
            }
        }else{
            changed = oldVal != model.metadata[compare];
        }
        if(changed){
            this.dropLastItem();
            this.game._publish("ui/update", this.game);
            //console.log( "Successfully built " + el.name + " using the queue." );
        } else {
            //console.log( "Tried to build " + el.name + " using the queue, but failed." );
        }

        if(compare == "research" || compare == "reached" && model.metadata[compare] == true
            || (compare.includes("blocked") && model.metadata["blocked"] == true) ||
            (compare.includes("research") && model.metadata["research"] == true)
        ){
            this.dropLastItem();
            this.game._publish("ui/update", this.game);
        }
    }
});