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

    timestamp: null,    /*NO FUCKING timestamp resources*/

    constructor: function(game){
        this.game = game;

		this.registerMeta("stackable", this.chronoforgeUpgrades, null);
		this.registerMeta("stackable", this.voidspaceUpgrades, null);
		this.setEffectsCachedExisting();
    },

    save: function(saveData) {
        saveData.time = {
            timestamp: this.game.pauseTimestamp || Date.now(),
            flux: this.flux,
            heat: this.heat,
            testShatter: this.testShatter, //temporary
            isAccelerated: this.isAccelerated,
            cfu: this.filterMetadata(this.chronoforgeUpgrades, ["name", "val", "on", "heat", "unlocked"]),
            vsu: this.filterMetadata(this.voidspaceUpgrades, ["name", "val", "on"])
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
            this.getCFU("blastFurnace").heat += perTick;
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
            var perTickHeatTransfer = this.game.getEffect("heatPerTick");
            var heatAttemptTransfer = daysOffset * this.game.calendar.ticksPerDay * perTickHeatTransfer;
            var heatTransfer = Math.min(this.heat, heatAttemptTransfer);

            var blastFurnace = this.getCFU("blastFurnace");
            blastFurnace.heat += heatTransfer;
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
        description: $I("time.cfu.blastFurnace.desc"),
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
                var amt = Math.floor(self.heat / 100);
                if (amt > 5){
                    amt = 5; //limit calculations needed per tick
                }
                self.heat -= 100 * amt;
                //game.time.shatter(amt);
                if(game.time.testShatter == 1) {game.time.shatterInGroupCycles(amt);}
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
        description: $I("time.cfu.temporalAccelerator.desc") +"\n" + $I("time.cfu.temporalAccelerator.desc2"),
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
            if (self.isAutomationEnabled == null && game.challenges.getChallenge("1000Years").on > 1) {
                self.isAutomationEnabled = false;
            }
            self.effects["shatterYearBoost"] = (self.isAutomationEnabled)? 5 * game.calendar.yearsPerCycle : game.calendar.yearsPerCycle; //25 or 5 currently
            self.limitBuild = game.getEffect("temporalPressCap");
            self.priceRatio = Math.max(1.05, 1.1 - game.challenges.getChallenge("1000Years").on * 0.001); //first 50 completions of 1000Years make priceRatio cheaper
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

                price["val"] *= (1 + this.game.getLimitedDR(this.game.getEffect("shatterCostReduction"),1) + this.game.getEffect("shatterCostIncreaseChallenge"));
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

                    priceLoop *= (1 + this.game.getLimitedDR(this.game.getEffect("shatterCostReduction"),1) +
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
            prices: [
				{name: "temporalFlux", val: 3000},
				{name: "timeCrystal", val: 100},
				{name: "void", val: 500}
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

        var kittens = this.game.resPool.get("kittens").value;
        var stripe = 5;
        var karmaPointsPresent = this.game.getUnlimitedDR(this.game.karmaKittens, stripe);
        var karmaPointsAfter = this.game.getUnlimitedDR(this.game.karmaKittens + this.game._getKarmaKittens(kittens), stripe);
		var karmaPoints = Math.floor((karmaPointsAfter - karmaPointsPresent) * 100) / 100;


		var _prestige = this.game.getResetPrestige();
		var paragonPoints = _prestige.paragonPoints;


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
