/**
 * Calendar class. Manages time, seasons and random events of the game
 */
dojo.declare("com.nuclearunicorn.game.Calendar", null, {
	game: null,

	seasons: [
		{
			name: "spring",
			title: $I("calendar.season.spring"),
			shortTitle: $I("calendar.season.spring.short"),

			modifiers:{
				"catnip" : 1.5
			}
		},
		{
			name: "summer",
			title: $I("calendar.season.summer"),
			shortTitle: $I("calendar.season.summer.short"),

			modifiers:{
				"catnip" : 1.0
			}
		},
		{
			name: "autumn",
			title: $I("calendar.season.autumn"),
			shortTitle: $I("calendar.season.autumn.short"),

			modifiers:{
				"catnip" : 1.0
			}
		},
		{
			name: "winter",
			title: $I("calendar.season.winter"),
			shortTitle: $I("calendar.season.winter.short"),

			modifiers:{
				"catnip" : 0.25
			}
		}
	],

	cycleYearColors: [
		"#A00000",
		"#DBA901",
		"#14CD61",
		"#01A9DB",
		"#9A2EFE"
	],

	//Charon, Umbra (black hole), Yarn (terraformable?), Helios (Sun), Cath, Redmoon (Cath satellite), Dune, Piscine, Terminus (ice giant), Kairo (dwarf planet)
	cycles: [
		{
			name: "charon",
			title: "Charon",
			glyph: "&#9049;",
			uglyph: "⍙",
			effects: {
				"entangler-gflopsConsumption": 2,
				"moonOutpost-unobtainiumPerTickSpace": 0.9
			},
			festivalEffects: {
				"catnip": 1.5,
				"wood": 1.5,
				"minerals": 1.5
			}
		},
		{
			name: "umbra",
			title: "Umbra",
			glyph: "&#9062;",
			uglyph: "⍦",
			effects: {
				"hrHarvester-energyProduction": 1.5,
				"planetCracker-uraniumPerTickSpace": 0.9,
				"hydrofracturer-oilPerTickAutoprodSpace": 0.75
			},
			festivalEffects: {
				"coal": 1.5,
				"iron": 1.5,
				"titanium": 1.5,
				"gold": 1.5
			}
		},
		{
			name: "yarn",
			title: "Yarn",
			glyph: "&#9063;",
			uglyph: "⍧",
			effects: {
				"hydroponics-catnipRatio": 2,
				"researchVessel-starchartPerTickBaseSpace": 0.5
			},
			festivalEffects: {
				"culture": 2
			}
		},
		{
			name: "helios",
			title: "Helios",
			glyph: "&#8978;",
			uglyph: "⌒",
			effects: {
				"sunlifter-energyProduction": 1.5,
				"cryostation-woodMax": 0.9,
				"cryostation-mineralsMax": 0.9,
				"cryostation-ironMax": 0.9,
				"cryostation-coalMax": 0.9,
				"cryostation-uraniumMax": 0.9,
				"cryostation-titaniumMax": 0.9,
				"cryostation-oilMax": 0.9,
				"cryostation-unobtainiumMax": 0.9
			},
			festivalEffects: {
				"faith": 2,
				"unicorns": 1.25
			}
		},
		{
			name: "cath",
			title: "Cath",
			glyph: "&#9022;",
			uglyph: "⌾",
			effects: {
				"spaceElevator-prodTransferBonus": 2,
				"sattelite-starchartPerTickBaseSpace": 2,
				"sattelite-observatoryRatio": 2,
				"spaceStation-scienceRatio": 1.5,
				"spaceBeacon-starchartPerTickBaseSpace": 0.1
			},
			festivalEffects: {
				"manpower": 2
			}
		},
		{
			name: "redmoon",
			title: "Redmoon",
			glyph: "&#9052;",
			uglyph: "⍜",
			effects: {
				"moonOutpost-unobtainiumPerTickSpace": 1.2,
				"entangler-gflopsConsumption": 0.5
			},
			festivalEffects: {
				"unobtainium": 2
			}
		},
		{
			name: "dune",
			title: "Dune",
			glyph: "&#9067;",
			uglyph: "⍫",
			effects: {
				"planetCracker-uraniumPerTickSpace": 1.1,
				"hydrofracturer-oilPerTickAutoprodSpace": 1.5,
				"hrHarvester-energyProduction": 0.75
			},
			festivalEffects: {
				"uranium": 2
			}
		},
		{
			name: "piscine",
			title: "Piscine",
			glyph: "&#9096;",
			uglyph: "⎈",
			effects: {
				"researchVessel-starchartPerTickBaseSpace": 1.5,
				"hydroponics-catnipRatio": 0.5
			},
			festivalEffects: {
				"science": 2
			}
		},
		{
			name: "terminus",
			title: "Terminus",
			glyph: "&#9053;",
			uglyph: "⍝",
			effects: {
				"cryostation-woodMax": 1.2,
				"cryostation-mineralsMax": 1.2,
				"cryostation-ironMax": 1.2,
				"cryostation-coalMax": 1.2,
				"cryostation-uraniumMax": 1.2,
				"cryostation-titaniumMax": 1.2,
				"cryostation-oilMax": 1.2,
				"cryostation-unobtainiumMax": 1.2,
				"sunlifter-energyProduction": 0.5
			},
			festivalEffects: {
				"oil": 2
			}
		},
		{
			name: "kairo",
			title: "Kairo",
			glyph: "&#8483;",
			uglyph: "℣",
			effects: {
				"spaceBeacon-starchartPerTickBaseSpace": 5,
				"spaceElevator-prodTransferBonus": 0.5,
				"sattelite-starchartPerTickBaseSpace": 0.75,
				"sattelite-observatoryRatio": 0.75,
				"spaceStation-scienceRatio": 0.75
			},
			festivalEffects: {
				"starchart": 5
			}
		}
	],

	// Conversion constants (null values are calculated in the constructor)
	ticksPerDay: 10,
	daysPerSeason: 100,
	seasonsPerYear: null,
	yearsPerCycle: null,
	cyclesPerEra: null,

	season: 0,
	cycle: 0,
	cycleYear: 0,

	day: 0,
	year: 0,

	eventChance: 0,

	weather: null,	//warm / cold

	festivalDays: 0,

	futureSeasonTemporalParadox: -1,

	cryptoPrice: 1000,
	cryptoPriceMax: 1100,

	observeBtn: null,
	observeRemainingTime: 0,
	observeClear: function(){
		dojo.destroy(this.observeBtn);
		this.observeBtn = null;
		this.observeRemainingTime = 0;

		this.game.ui.observeClear();
	},
	observeHandler: function(){
		this.observeClear();
		this.game.stats.getStat("eventsObserved").val++;

		var celestialBonus = this.game.workshop.get("celestialMechanics").researched
			? this.game.ironWill ? 1.6 : 1.2
			: 1;

		var sciBonus = 25 * celestialBonus * (1 + this.game.getEffect("scienceRatio"));
		var sciGain = this.game.resPool.addResEvent("science", sciBonus);

		var isSilent = this.game.workshop.get("seti").researched;
		if (sciGain > 0 && !isSilent){
			this.game.msg(this.game.getDisplayValueExt(sciGain, true) + " science!", "", "astronomicalEvent", true);
		}

		if (this.game.science.get("astronomy").researched) {
			var timeRatioBonus = 1 + this.game.getEffect("timeRatio") * 0.25;
			var chanceRatio = (this.game.prestige.getPerk("chronomancy").researched ? 1.1 : 1) * timeRatioBonus;
			var eventChance = (0.0025 + this.game.getEffect("starEventChance")) * chanceRatio;
			if (this.game.prestige.getPerk("astromancy").researched) {
				eventChance *= 2;
			}
			var starcharts = eventChance <= 1
				? 1
				: Math.floor(eventChance) + (this.game.rand(10000) < (eventChance - Math.floor(eventChance)) * 10000 ? 1 : 0);

			if (!isSilent) {
				this.game.msg($I("calendar.msg.starchart", [starcharts]), "", "astronomicalEvent");
			}
			this.game.resPool.addResEvent("starchart", starcharts);
		}
	},//this.observeHandler

	observeTimeout: function(){

		this.observeClear();

		var autoChance = this.game.getEffect("starAutoSuccessChance");
		if (this.game.prestige.getPerk("astromancy").researched){
			autoChance *= 2;
		}

		var rand = this.game.rand(100);
		if (this.game.ironWill && rand <= 25
		 || rand <= autoChance * 100) {
			this.observeHandler();
		}

	},//observeTimeout

	constructor: function(game, displayElement) {
		this.game = game;
		this.displayElement = displayElement;

		this.seasonsPerYear = this.seasons.length;
		this.yearsPerCycle = this.cycleYearColors.length;
		this.cyclesPerEra = this.cycles.length;

		// TODO Temporarily kept for compatibility with scripts, WILL BE REMOVED in next minor version (1.4.6.0)
		this.dayPerTick = 1 / this.ticksPerDay;
	},

	render: function() {

	},

	update: function() {

	},

	cycleYearColor: function() {
		return this.cycleYearColors[this.cycleYear];
	},

	cycleEffectsBasics: function(effects, building_name) {
		if (this.game.prestige.getPerk("numerology").researched){
			var list_effects_cycle = this.cycles[this.cycle].effects;

			for (var effect in effects) {
				var effect_cycle = building_name + "-" + effect;
				if (typeof list_effects_cycle[effect_cycle] !== "undefined") {
					effects[effect] *= list_effects_cycle[effect_cycle];
				}
			}
		}

		return effects;
	},

	cycleEffectsFestival: function(effects) {
		if (this.game.prestige.getPerk("numeromancy").researched && this.game.calendar.festivalDays){
			var list_festivalEffects_cycle = this.cycles[this.cycle].festivalEffects;

			for (var effect in effects) {

				var effect_cycle = effect;
				if (typeof list_festivalEffects_cycle[effect_cycle] !== "undefined") {
					effects[effect] *= list_festivalEffects_cycle[effect_cycle];
				}
			}
		}

		return effects;
	},

	trueYear: function() {
		return (this.day / this.daysPerSeason + this.season) / this.seasonsPerYear + this.year - this.game.time.flux;
	},

	darkFutureYears: function(withImpedance) {
		var impedance = withImpedance ? this.game.getEffect("timeImpedance") : 0;
		return this.year - (40000 + impedance);
	},

	tick: function() {
		if(this.observeRemainingTime > 0){
			this.observeRemainingTime--;
			if(this.observeRemainingTime == 0){
				this.observeTimeout();
			}
		}

		var previousIntDay = Math.floor(this.day);
		var timeAccelerationRatio = this.game.timeAccelerationRatio();
		this.day += (1 + timeAccelerationRatio) / this.ticksPerDay;
		this._roundToCentiday();

		var ticksPerYear = this.ticksPerDay * this.daysPerSeason * this.seasonsPerYear;
		if (this.day < 0){
			this.game.time.flux -= (1 + timeAccelerationRatio) / ticksPerYear;
		} else {
			this.game.time.flux += timeAccelerationRatio / ticksPerYear;
		}

		if (Math.floor(this.day) == previousIntDay) {
			return;
		}

		var newSeason = false;
		var newYear = false;
		if (this.day >= this.daysPerSeason) {
			this.day -= this.daysPerSeason;
			this._roundToCentiday();
			this.season += 1;
			newSeason = true;

			if (this.season >= this.seasonsPerYear) {
				this.season = 0;
				this.year += this.game.challenges.getChallenge("1000Years").on && this.year >= 500 ? 0 : 1;
				newYear = true;
			}
		}

		/*The new date must be fully computed before any of the individual onNew functions are called
		 to ensure the onNew functions have a consistent view of what the current date is.
		 */
		this.onNewDay();
		if (newSeason) {
			this.onNewSeason();
			if (newYear) {
				this.onNewYear(true);
			}
		}

		/* The update function must be called after the onNew functions, which may make changes
		 that need to be visible (e.g. showing events in the document title)
		 */
		this.update();
	},

	// minimize floating point error
	_roundToCentiday: function () {
		this.day = Math.round(this.day * 100) / 100;
	},

	/*
	 * All daily chances are in 1/10K units (OPTK) (0.0X%)
	 */
	onNewDay: function(){
		if (this.festivalDays){
			this.festivalDays--;
		}

		var timeRatioBonus = 1 + this.game.getEffect("timeRatio") * 0.25;
		var chanceRatio = (this.game.prestige.getPerk("chronomancy").researched ? 1.1 : 1) * timeRatioBonus;
		var unicornChanceRatio = (this.game.prestige.getPerk("unicornmancy").researched ? 1.1 : 1) * timeRatioBonus;

		if (this.day < 0){
			//------------------------- void -------------------------
			this.game.resPool.addResEvent("void", this.game.resPool.getVoidQuantity()); // addResEvent because during Temporal Paradox
		} else {
			//------------------------- relic -------------------------
			this.game.resPool.addResPerTick("relic", this.game.getEffect("relicPerDay"));
		}

		//------------------------- astronomical events -------------------------
		if (this.game.bld.get("library").on > 0) {
			var eventChance = (0.0025 + this.game.getEffect("starEventChance")) * chanceRatio;
			if (this.game.prestige.getPerk("astromancy").researched) {
				eventChance *= 2;
			}

			if (this.game.rand(10000) < eventChance * 10000) {
				if (this.observeRemainingTime > 0) {
					this.observeTimeout();
				}

				//---------------- SETI hack-------------------
				if (this.game.workshop.get("seti").researched) {
					this.observeHandler();
				} else {
					this.observeClear();
					this.game.msg($I("calendar.msg.event"), "", "astronomicalEvent");
					var node = dojo.byId("observeButton");

					this.observeBtn = dojo.create("input", {
						id: "observeBtn",
						type: "button",
						value: $I("navbar.observe")
					}, node);

					dojo.connect(this.observeBtn, "onclick", this, this.observeHandler);

					this.observeRemainingTime = 300;

					this.game.ui.observeCallback(this.observeHandler);
				}
			}
		}

		//------------------------- meteors -------------------------
		var iwChance = 0;
		if (this.game.ironWill){
			iwChance = 40;	// +0.4 additional chance of falling meteors
		}

		var baseChance = 10 * chanceRatio;
		if (this.game.rand(10000) < (baseChance + iwChance) &&
			this.game.science.get("mining").researched){	//0.1% chance of meteors

			var mineralsAmt = 50 + 25 * this.game.getEffect("mineralsRatio");

			if (this.game.ironWill){
				mineralsAmt += mineralsAmt * 0.1;	//+10% of minerals for iron will
			}

			var mineralsGain = this.game.resPool.addResEvent("minerals", mineralsAmt);

			var sciGain = 0;
			if (this.game.workshop.get("celestialMechanics").researched) {
				var sciBonus = 15 * (1 + this.game.getEffect("scienceRatio"));
				sciGain = this.game.resPool.addResEvent("science", sciBonus);
			}

			if (mineralsGain > 0 || sciGain > 0){
				var meteorMsg = $I("calendar.msg.meteor");

				if (mineralsGain > 0){
					meteorMsg += ", +" + this.game.getDisplayValueExt(mineralsGain) + " " + $I("resources.minerals.title");
				}
				if (sciGain > 0) {
					meteorMsg += ", +" + this.game.getDisplayValueExt(sciGain) + " " + $I("resources.science.title");
				}

				this.game.msg(meteorMsg + "!", null, "meteor");
			}

			//TODO: make meteors give titanium on higher levels
		}

		//------------------------- 0.035% chance of spawning unicorns in Iron Will -----------------
		var zebras = this.game.resPool.get("zebras");

		if (this.game.ironWill){
			var archery = this.game.science.get("archery");
			var unicorns = this.game.resPool.get("unicorns");
			if (this.game.rand(100000) <= 17 * unicornChanceRatio && unicorns.value < 2 && archery.researched){
				this.game.resPool.addResEvent("unicorns", 1);
				this.game.msg($I("calendar.msg.unicorn"));
			}

			if (!zebras.value && archery.researched){
				this.game.resPool.addResEvent("zebras", 1);
				this.game.msg($I("calendar.msg.zebra.hunter"));
			} else if ( zebras.value > 0 && zebras.value <= this.game.karmaZebras && this.game.karmaZebras > 0){
				if (this.game.rand(100000) <= 500){
					this.game.resPool.addResEvent("zebras", 1);
					this.game.msg($I("calendar.msg.zebra.hunter.new"));
					this.game.ui.render();
				}
			}
		}else{
			var zTreshold = 0;
			if (this.game.prestige.getPerk("zebraDiplomacy").researched){
				zTreshold = Math.floor(0.10 * (this.game.karmaZebras + 1));   //5 - 10% of hunters will stay
			}
			if (this.game.prestige.getPerk("zebraCovenant").researched){
				zTreshold = Math.floor(0.50 * (this.game.karmaZebras + 1));   //5 - 50% of hunters will stay
			}
			if (zebras.value > zTreshold ){
				this.game.msg( zebras.value > 1 ?
						$I("calendar.msg.zebra.hunter.departed.pl") :
						$I("calendar.msg.zebra.hunter.departed")
				);
				zebras.value = zTreshold;
				this.game.ui.render();
			}
		}
		//TODO: maybe it is a good idea to start moving daily events to json metadata
		//-------------------------  -------------------

		var riftChance = this.game.getEffect("riftChance");	//5 OPTK
		if (this.game.rand(10000) < riftChance * unicornChanceRatio){
			var unicornBonus = 500 * (1 + this.game.getEffect("unicornsRatioReligion") * 0.1);
			this.game.msg($I("calendar.msg.rift", [this.game.getDisplayValueExt(unicornBonus)]), "notice", "unicornRift");

			this.game.resPool.addResEvent("unicorns", unicornBonus);	//10% of ziggurat buildings bonus
		}
		//----------------------------------------------
		var aliChance = this.game.getEffect("alicornChance");	//0.2 OPTK
		if (this.game.rand(100000) < aliChance){
			this.game.msg($I("calendar.msg.alicorn"), "important", "alicornRift");

			this.game.resPool.addResEvent("alicorn", 1);
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}

		// -------------- ivory meteors ---------------
		var meteorChance = 0 + this.game.getEffect("ivoryMeteorChance");	//5 OPTK
		if (this.game.rand(10000) < meteorChance * unicornChanceRatio){

			var ivory = (250 + this.game.rand(1500) * (1 + this.game.getEffect("ivoryMeteorRatio")));
			this.game.msg($I("calendar.msg.ivoryMeteor", [this.game.getDisplayValueExt(ivory)]), "notice", "ivoryMeteor");

			this.game.resPool.addResEvent("ivory", ivory);
		}

		this.game.diplomacy.onNewDay();

		this.adjustCryptoPrices();
	},

	fastForward: function(daysOffset){
        var timeRatioBonus = 1 + this.game.getEffect("timeRatio") * 0.25;
        var chanceRatio = (this.game.prestige.getPerk("chronomancy").researched ? 1.1 : 1) * timeRatioBonus;
        var unicornChanceRatio = (this.game.prestige.getPerk("unicornmancy").researched ? 1.1 : 1) * timeRatioBonus;

		// Auto observable events
        var numberEvents = 0, totalNumberOfEvents = 0;
        if (this.game.bld.get("library").on > 0) {
            var eventChance = (0.0025 + this.game.getEffect("starEventChance")) * chanceRatio;
            if (this.game.prestige.getPerk("astromancy").researched) {
                eventChance *= 2;
            }

            var autoChance = this.game.getEffect("starAutoSuccessChance");
            if (this.game.prestige.getPerk("astromancy").researched) {
                autoChance *= 2;
            }

            if (this.game.workshop.get("seti").researched) {
                autoChance = 1;
            }
            autoChance = Math.min(autoChance, 1);
            //console.log("eventChance="+eventChance+", autoChance="+autoChance);
            numberEvents = Math.round(daysOffset * eventChance * autoChance);
            //console.log("number of startcharts="+numberEvents);
            if (numberEvents) {
                this.game.resPool.addResEvent("starchart", numberEvents);
            }

            var celestialBonus = this.game.workshop.get("celestialMechanics").researched
                ? this.game.ironWill ? 1.6 : 1.2
                : 1;

            var sciBonus = numberEvents * 25 * celestialBonus * (1 + this.game.getEffect("scienceRatio"));
            this.game.resPool.addResEvent("science", sciBonus);

            totalNumberOfEvents+=numberEvents;
        }

        //------------------------- meteors -------------------------
		var iwChance = 0;
		if (this.game.ironWill){
			iwChance = 40;	// +0.4 additional chance of falling meteors
		}

		var baseChance = 10 * chanceRatio;
		if (this.game.science.get("mining").researched){	//0.1% chance of meteors

			numberEvents = Math.round(daysOffset * (baseChance + iwChance) / 10000);

			var mineralsAmt = 50 + 25 * this.game.getEffect("mineralsRatio");

			if (this.game.ironWill){
				mineralsAmt += mineralsAmt * 0.1;	//+10% of minerals for iron will
			}

			var mineralsGain = this.game.resPool.addResEvent("minerals", numberEvents * mineralsAmt);

			if (this.game.workshop.get("celestialMechanics").researched) {
				var sciBonus = 15 * (1 + this.game.getEffect("scienceRatio"));
				var sciGain = this.game.resPool.addResEvent("science", numberEvents * sciBonus);
			}

			//TODO: make meteors give titanium on higher levels

			totalNumberOfEvents+=numberEvents;
		}



		//------------------------- 0.035% chance of spawning unicorns in Iron Will -----------------
		var zebras = this.game.resPool.get("zebras");

		if (this.game.ironWill){
			var archery = this.game.science.get("archery");
			var unicorns = this.game.resPool.get("unicorns");


			if (unicorns.value < 2 && archery.researched){
				numberEvents = Math.round(daysOffset * 17 * unicornChanceRatio / 100000);
				this.game.resPool.addResEvent("unicorns", numberEvents);
				totalNumberOfEvents+=numberEvents;
			}

			if ( zebras.value > 0 && zebras.value <= this.game.karmaZebras && this.game.karmaZebras > 0){
				numberEvents = Math.round(daysOffset * 500 / 100000);
				this.game.resPool.addResEvent("zebras", numberEvents);
				totalNumberOfEvents+=numberEvents;
			}
		}
		//TODO: maybe it is a good idea to start moving daily events to json metadata
		//-------------------------  -------------------

		var riftChance = this.game.getEffect("riftChance");	//5 OPTK
		numberEvents = Math.round(daysOffset * riftChance * unicornChanceRatio / 10000);
		this.game.resPool.addResEvent("unicorns", numberEvents * 500);
		totalNumberOfEvents+=numberEvents;

		//----------------------------------------------
		var aliChance = this.game.getEffect("alicornChance");	//0.2 OPTK
		numberEvents = Math.round(daysOffset * aliChance / 100000);
		if (numberEvents >= 1) {
			this.game.resPool.addResEvent("alicorn", numberEvents);
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}
		totalNumberOfEvents+=numberEvents;

		// -------------- ivory meteors ---------------
		var meteorChance = 0 + this.game.getEffect("ivoryMeteorChance");	//5 OPTK
		numberEvents = Math.round(daysOffset * meteorChance * unicornChanceRatio / 10000);
		if (numberEvents){
			var ivory = (250 + this.game.rand(1500) * (1 + this.game.getEffect("ivoryMeteorRatio")));
			this.game.resPool.addResEvent("ivory", ivory* numberEvents);
		}
		totalNumberOfEvents+=numberEvents;

		var yearsOffset = Math.floor(daysOffset / (this.daysPerSeason * this.seasonsPerYear));

		//antimatter
		var resPool = this.game.resPool;
		if (resPool.energyProd >= resPool.energyCons) {
			resPool.addResEvent("antimatter", this.game.getEffect("antimatterProduction") * yearsOffset);
		}

		var beacons = game.space.getBuilding("spaceBeacon");
		beacons.action(beacons, this.game);
		this.game.updateCaches();
		this.game.resPool.addResPerTick("relic", this.game.getEffect("relicPerDay") * daysOffset);

		//not sure if it is a good idea
		//calculate amount of void earned on average per day, then multiply by days and percentage of time in paradox
		var daysInParadox = 10 + this.game.getEffect("temporalParadoxDay");
		var daysBetweenParadox = daysInParadox + 100 * Math.max( 1 , 100 / this.game.bld.get("chronosphere").on );
		var percentTimeInParadox = daysInParadox / daysBetweenParadox;

                this.game.resPool.addResEvent("void",
	                Math.floor(this.game.resPool.getVoidQuantityStatistically() * daysOffset * percentTimeInParadox));

		//==================== other calendar stuff ========================
		//cap years skipped in 1000 years
		if (this.game.challenges.getChallenge("1000Years").on && this.year + yearsOffset > 500){
			yearsOffset = Math.max(500 - this.year, 0);
		}

		//calculate millenium difference
		var paragon = Math.floor((this.year + yearsOffset) / 1000) - Math.floor(this.year / 1000);
		if (paragon > 0){
			resPool.addResEvent("paragon", paragon);
			this.game.stats.getStat("totalParagon").val += paragon;
		}
		this.year += yearsOffset;
		//------------------------------------------------------------------

        return totalNumberOfEvents;
	},

	onNewSeason: function(){
		this.eventChance = 0;

		if (this.year > 3){
			var coldChance = 175;
			var warmChance = 175;

			if (this.game.challenges.getChallenge("winterIsComing").on) {
				effect = this.game.challenges.getChallengeEffect("winterIsComing", "frequency");
				coldChance += effect;
				warmChance -= effect;
				if (warmChance < 0) {
					warmChance = 0;
				}
			}
			if (this.getCurSeason().name == "winter" && this.game.challenges.getChallengeResearched("winterIsComing")){
				coldChance = 0;
			}

			var rand = this.game.rand(1000);
			if (rand < warmChance){
				this.weather = "warm"
			} else if (rand < warmChance + coldChance){
				this.weather = "cold"
			} else{
				this.weather = null;
			}
		}else{
			this.weather = null;
		}

		if (this.season == 2 && this.game.workshop.get("advancedAutomation").researched ){
			this.game.bld.get("steamworks").jammed = false;
		}

		var numChrono = this.game.bld.get("chronosphere").on;
		if (numChrono > 0) {
			if (this.futureSeasonTemporalParadox > 0){
				// Go to future Temporal Paradox season
				this.futureSeasonTemporalParadox--;
			} else {
				// Temporal Paradox
				this.day = -10 - this.game.getEffect("temporalParadoxDay");
				// Calculation of the future Temporal Paradox season
				var futureSeasonTemporalParadox = 0;
				var goon = true;
				while (goon) {
					if (numChrono > this.game.rand(100)) {
						goon = false;
					} else {
						futureSeasonTemporalParadox++;
					}
				}
				this.futureSeasonTemporalParadox = futureSeasonTemporalParadox;
			}
		}
	},

	onNewYear: function(updateUI){

		var ty = this.game.stats.getStat("totalYears");
		ty.val++;

		if (ty.val < this.year){
			ty.val = this.year;
		}

		if (this.darkFutureYears() >= 0) {
			this.game.unlock({chronoforge: ["temporalImpedance"]});
		}

		if (this.game.bld.get("steamworks").jammed) {
			this.game.bld.get("steamworks").jammed = false;	//reset jammed status
		}

		if ( this.year % 1000 === 0 ){
			this.game.resPool.addResEvent("paragon", 1);
			this.game.stats.getStat("totalParagon").val++;
		}

		var pyramidVal = this.game.religion.getZU("blackPyramid").val;
		var markerVal = this.game.religion.getZU("marker").val;
		if ( pyramidVal > 0 ){
			if (this.game.rand(1000) < 35 * pyramidVal * (1 + 0.1 * markerVal)){   //3.5% per year per BP, x10% per marker
				this.game.diplomacy.unlockElders();
			}
		}

		if (++this.cycleYear >= this.yearsPerCycle) {
			this.cycleYear = 0;
			if (++this.cycle >= this.cyclesPerEra) {
				this.cycle = 0;
			}
		}

		// Apply cycleEffect for the newYear
		this.game.upgrade({
			spaceBuilding: this.game.space.spaceBuildingsMap
		});

		var resPool = this.game.resPool;
		if (resPool.energyProd >= resPool.energyCons) {
			resPool.addResEvent("antimatter", this.game.getEffect("antimatterProduction"));
		}

		resPool.addResEvent("temporalFlux", this.game.getEffect("temporalFluxProduction"));

		var aiLevel = this.game.bld.get("aiCore").effects["aiLevel"];
		if (aiLevel > 14){
			var aiApocalypseLevel = aiLevel - 14;
			this.game.msg($I("ai.apocalypse.msg", [aiApocalypseLevel]), "alert", "ai");
			for (var i in this.game.resPool.resources){
				var res = this.game.resPool.resources[i];
				if (res.aiCanDestroy) {
					resPool.addResEvent(res.name, -res.value * 0.01 * aiApocalypseLevel);
				}
			}
		}

		if (updateUI) {
			this.game.ui.render();
		}
	},

	adjustCryptoPrices: function() {
		if (this.game.science.get("antimatter").researched) {
			var marketFluctuation = this.game.rand(100000);

			if (marketFluctuation < 30000 ) {
				this.cryptoPrice -= this.cryptoPrice * Math.random() * 0.01 / 400;
			} else if (marketFluctuation > 60000) {
				this.cryptoPrice += this.cryptoPrice * Math.random() * 0.01 / 400;
			}

			if (this.cryptoPrice > this.cryptoPriceMax){
				this.cryptoPrice -= this.cryptoPrice * (0.2 + (Math.random() * 0.1));
				this.game.msg("There was a huge crypto market correction");
			}
		}
	},

	getWeatherMod: function(res){
		var mod = 1;

		if (this.getCurSeason().modifiers[res.name]){
			mod = this.getCurSeason().modifiers[res.name];

			if (this.weather == "warm"){
				mod += 0.15;
			} else if (this.weather == "cold"){
				mod -= 0.15;
			}

			if (this.game.challenges.getChallenge("winterIsComing").on && this.weather == "cold") {
				mod = ((mod + 1) * this.game.challenges.getChallengeEffect("winterIsComing", "modifier")) - 1;
			}

			if (this.getCurSeason().name == "spring"){
				mod *= this.game.challenges.getChallengeReward("winterIsComing");
			}
		}

		return mod;
	},

	getCurSeason: function(){
		if (this.game.challenges.getChallenge("winterIsComing").on){
			return this.seasons[3];	//eternal winter
		}
		return this.seasons[this.season];
	},

	getCurSeasonTitle: function(){
		var title = this.getCurSeason().title;
		if (this.game.challenges.getChallenge("winterIsComing").on){
			var numeral = '';
			switch(this.season){
				case 0:
					numeral = "I";
					break;
				case 1:
					numeral = "II";
					break;
				case 2:
					numeral = "III";
					break;
				case 3:
					numeral = "IV";
					break;
			}
			title += " " + numeral;
		}
		return title;
	},

	getCurSeasonTitleShorten: function(){
		var title = this.getCurSeason().shortTitle;
		if (this.game.challenges.getChallenge("winterIsComing").on){
			var numeral = '';
			switch(this.season){
				case 0:
					numeral = "I";
					break;
				case 1:
					numeral = "II";
					break;
				case 2:
					numeral = "III";
					break;
				case 3:
					numeral = "IV";
					break;
			}
			title += " " + numeral;
		}
		return title;
	},


	resetState: function(){
		this.year = 0;
		this.day = 0;
		this.season = 0;
		this.weather = null;
		this.festivalDays = 0;
		this.cycle = 0;
		this.cycleYear = 0;
		this.futureSeasonTemporalParadox = -1;
		this.observeClear();
	},

	save: function(saveData){
		saveData.calendar = {
			year : this.year,
			day: this.day,
			season: this.season,
			weather: this.weather,
			festivalDays: this.festivalDays,
			cycle: this.cycle,
			cycleYear: this.cycleYear,
			futureSeasonTemporalParadox: this.futureSeasonTemporalParadox,
			cryptoPrice: this.cryptoPrice
		};
	},

	// TODO Use loadMetadata
	load: function(saveData){
		if (saveData.calendar){
			this.year  = saveData.calendar.year || 0;
			this.day  = saveData.calendar.day || 0;
			this.season  = saveData.calendar.season || 0;
			this.weather = saveData.calendar.weather || null;
			this.festivalDays = saveData.calendar.festivalDays || 0;
			this.cycle = saveData.calendar.cycle || 0;
			this.cycleYear = saveData.calendar.cycleYear || 0;
			this.futureSeasonTemporalParadox = saveData.calendar.futureSeasonTemporalParadox || -1;
			this.cryptoPrice = saveData.calendar.cryptoPrice || 1000;
		}
	}

});

dojo.declare("com.nuclearunicorn.game.calendar.Event", null, {
});
