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
			title: $I("space.planet.charon.label"),
			glyph: "&#9049;",
			uglyph: "⍙",
			effects: {
				"moonOutpost-unobtainiumPerTickSpace": 0.9,
				"entangler-gflopsConsumption": 2
			},
			festivalEffects: {
				"catnip": 1.5,
				"wood": 1.5,
				"minerals": 1.5
			}
		},
		{
			name: "umbra",
			title: $I("space.planet.umbra.label"),
			glyph: "&#9062;",
			uglyph: "⍦",
			effects: {
				"hydrofracturer-oilPerTickAutoprodSpace": 0.75,
				"planetCracker-uraniumPerTickSpace": 0.9,
				"hrHarvester-energyProduction": 1.5
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
			title: $I("space.planet.yarn.label"),
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
			title: $I("space.planet.helios.label"),
			glyph: "&#8978;",
			uglyph: "⌒",
			effects: {
				"cryostation-woodMax": 0.9,
				"cryostation-mineralsMax": 0.9,
				"cryostation-coalMax": 0.9,
				"cryostation-ironMax": 0.9,
				"cryostation-titaniumMax": 0.9,
				"cryostation-oilMax": 0.9,
				"cryostation-uraniumMax": 0.9,
				"cryostation-unobtainiumMax": 0.9,
				"sunlifter-energyProduction": 1.5
			},
			festivalEffects: {
				"faith": 2,
				"unicorns": 1.25
			}
		},
		{
			name: "cath",
			title: $I("space.planet.cath.label"),
			glyph: "&#9022;",
			uglyph: "⌾",
			effects: {
				"spaceStation-scienceRatio": 1.5,
				"sattelite-observatoryRatio": 2,
				"sattelite-starchartPerTickBaseSpace": 2,
				"spaceBeacon-starchartPerTickBaseSpace": 0.1,
				"spaceElevator-prodTransferBonus": 2
			},
			festivalEffects: {
				"manpower": 2
			}
		},
		{
			name: "redmoon",
			title: $I("space.planet.moon.label"),
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
			title: $I("space.planet.dune.label"),
			glyph: "&#9067;",
			uglyph: "⍫",
			effects: {
				"hydrofracturer-oilPerTickAutoprodSpace": 1.5,
				"planetCracker-uraniumPerTickSpace": 1.1,
				"hrHarvester-energyProduction": 0.75
			},
			festivalEffects: {
				"uranium": 2
			}
		},
		{
			name: "piscine",
			title: $I("space.planet.piscine.label"),
			glyph: "&#9096;",
			uglyph: "⎈",
			effects: {
				"hydroponics-catnipRatio": 0.5,
				"researchVessel-starchartPerTickBaseSpace": 1.5
			},
			festivalEffects: {
				"science": 2
			}
		},
		{
			name: "terminus",
			title: $I("space.planet.terminus.label"),
			glyph: "&#9053;",
			uglyph: "⍝",
			effects: {
				"cryostation-woodMax": 1.2,
				"cryostation-mineralsMax": 1.2,
				"cryostation-coalMax": 1.2,
				"cryostation-ironMax": 1.2,
				"cryostation-titaniumMax": 1.2,
				"cryostation-oilMax": 1.2,
				"cryostation-uraniumMax": 1.2,
				"cryostation-unobtainiumMax": 1.2,
				"sunlifter-energyProduction": 0.5
			},
			festivalEffects: {
				"oil": 2
			}
		},
		{
			name: "kairo",
			title: $I("space.planet.kairo.label"),
			glyph: "&#8483;",
			uglyph: "℣",
			effects: {
				"spaceStation-scienceRatio": 0.75,
				"sattelite-observatoryRatio": 0.75,
				"sattelite-starchartPerTickBaseSpace": 0.75,
				"spaceBeacon-starchartPerTickBaseSpace": 5,
				"spaceElevator-prodTransferBonus": 0.5
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
	darkFutureBeginning: 40000,

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
		var isSilent = this.game.workshop.get("seti").researched;

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
			sciBonus *= starcharts;
			var sciGain = this.game.resPool.addResEvent("science", sciBonus);

			if (sciGain > 0 && !isSilent){
				this.game.msg($I("calendar.msg.science", [this.game.getDisplayValueExt(sciGain)]), "", "astronomicalEvent", true);
			}
			if (!isSilent) {
				this.game.msg($I("calendar.msg.starchart", [starcharts]), "", "astronomicalEvent");
			}
			this.game.resPool.addResEvent("starchart", starcharts);
		}
		else{
			var sciGain = this.game.resPool.addResEvent("science", sciBonus);

			if (sciGain > 0 && !isSilent){
				this.game.msg($I("calendar.msg.science", [this.game.getDisplayValueExt(sciGain)]), "", "astronomicalEvent", true);
			}
		}
	},

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
					effects[effect] *= 1 + this.game.getEffect("festivalRatio");
				}
			}
		}

		return effects;
	},

	trueYear: function() {
		return (this.day / this.daysPerSeason + this.season) / this.seasonsPerYear + this.year - this.game.time.flux;
	},

	darkFutureYears: function(withImpedance) {
		var darkFutureActualBeginning = this.darkFutureBeginning + (withImpedance ? this.game.getEffect("timeImpedance") : 0);
		return this.year - darkFutureActualBeginning;
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
			this.game.time.flux -= 1/(1 + timeAccelerationRatio) / ticksPerYear;
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
				this.year += this.game.challenges.isActive("1000Years") && this.year >= 500 ? 0 : 1;
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
			if(this.game.getEffect("festivalLuxuryConsumptionRatio")){
				if(!this.game.resPool.get("furs").value || !this.game.resPool.get("ivory").value || !this.game.resPool.get("spice").value){
					this.game.msg($I("village.festival.msg.deficitEnd"), "important");
					this.festivalDays = 0;
				}
			}
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
		//------------------------- necrocorns pacts -------------------------
		//deficit changing
		this.game.religion.pactsManager.necrocornConsumptionDays(1);
		this.game.religion.getZU("blackPyramid").updateEffects(this.game.religion.getZU("blackPyramid"), this.game);
		this.game.religion.getPact("payDebt").onNewDay(this.game);

		//-------------------------  consequenses of accumulating too much necrocorn deficit -------------------------
		if(this.game.religion.pactsManager.necrocornDeficit>=this.game.religion.pactsManager.fractureNecrocornDeficit){
			this.game.religion.pactsManager.necrocornDeficitPunishment();
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

				// nice reminder that astronomical events don't happen
				if (this.game.challenges.isActive("blackSky")) {
					// ...however it gets spammy after some progress
					if (this.game.bld.get("observatory").val < 30) {
						this.game.msg($I("challendge.blackSky.event"), "", "astronomicalEvent");
					}
				//---------------- SETI hack-------------------
				} else if (this.game.workshop.get("seti").researched) {
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

					this.observeRemainingTime = this.game.ironWill ? 600 : 300;

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
			var minerologyBonus = this.game.getEffect("academyMeteorBonus");

			if (this.game.ironWill){
				mineralsAmt += mineralsAmt * 0.1;	//+10% of minerals for iron will
			}
			mineralsAmt *= 1 + minerologyBonus;
			var mineralsGain = this.game.resPool.addResEvent("minerals", mineralsAmt);

			var sciGain = 0;
			if (this.game.workshop.get("celestialMechanics").researched) {
				var sciBonus = 15 * (1 + this.game.getEffect("scienceRatio"));
				sciBonus *= 1 + minerologyBonus;
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

		//------------------------- 0.035% chance of spawning unicorns in pacifism -----------------
		if(this.game.challenges.isActive("pacifism")){
			var animal = this.game.science.get("animal");
			var unicorns = this.game.resPool.get("unicorns");
			if (this.game.rand(100000) <= 17 * unicornChanceRatio && unicorns.value < 2 && animal.researched){
				this.game.resPool.addResEvent("unicorns", 1);
				this.game.msg($I("calendar.msg.unicorn"));
			}
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
				var chanceModifier = (this.game.workshop.getZebraUpgrade("darkBrew").researched && this.festivalDays)?
				2 + this.game.getEffect("festivalArrivalRatio") : 1; //bigger chance for zebras to arive after darkBrew is researched
				if (this.game.rand(100000) <= 500 * chanceModifier){
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
		if (this.game.rand(10000) < riftChance * 10000 * unicornChanceRatio){
			var unicornBonus = 500 * (1 + this.game.getEffect("unicornsRatioReligion") * 0.1);
			this.game.msg($I("calendar.msg.rift", [this.game.getDisplayValueExt(unicornBonus)]), "notice", "unicornRift");

			this.game.resPool.addResEvent("unicorns", unicornBonus);	//10% of ziggurat buildings bonus
		}
		//----------------------------------------------
		var aliChance = this.game.getEffect("alicornChance");	//0.2 OPTK
		aliChance *= 1 + this.game.getLimitedDR(this.game.getEffect("alicornPerTickRatio"), 1.2);
		if (this.game.rand(100000) < aliChance * 100000){
			this.game.msg($I("calendar.msg.alicorn"), "important", "alicornRift");

			this.game.resPool.addResEvent("alicorn", 1);
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}

		// -------------- ivory meteors ---------------
		var meteorChance = 0 + this.game.getEffect("ivoryMeteorChance");	//5 OPTK
		if (this.game.rand(10000) < meteorChance * 10000 * unicornChanceRatio){

			var ivory = (250 + this.game.rand(1500) * (1 + this.game.getEffect("ivoryMeteorRatio")));
			this.game.msg($I("calendar.msg.ivoryMeteor", [this.game.getDisplayValueExt(ivory)]), "notice", "ivoryMeteor");

			this.game.resPool.addResEvent("ivory", ivory);
		}

		this.game.diplomacy.onNewDay();

		this.adjustCryptoPrice();

		this.game.upgrade({policies: ["authocracy"]}); //policy hack
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
            if (numberEvents && !this.game.challenges.isActive("blackSky")) {
                this.game.resPool.addResEvent("starchart", numberEvents);
            }

            var celestialBonus = this.game.workshop.get("celestialMechanics").researched
                ? this.game.ironWill ? 1.6 : 1.2
                : 1;

            var sciBonus = numberEvents * 25 * celestialBonus * (1 + this.game.getEffect("scienceRatio"));
            this.game.resPool.addResEvent("science", sciBonus);

            totalNumberOfEvents += numberEvents;
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

			this.game.resPool.addResEvent("minerals", numberEvents * mineralsAmt);

			if (this.game.workshop.get("celestialMechanics").researched) {
				var sciBonus = 15 * (1 + this.game.getEffect("scienceRatio"));
				this.game.resPool.addResEvent("science", numberEvents * sciBonus);
			}

			//TODO: make meteors give titanium on higher levels

			totalNumberOfEvents += numberEvents;
		}

		//------------------------- 0.035% chance of spawning unicorns in Iron Will -----------------
		var zebras = this.game.resPool.get("zebras");

		if (this.game.ironWill){
			var archery = this.game.science.get("archery");
			var unicorns = this.game.resPool.get("unicorns");


			if (unicorns.value < 2 && archery.researched){
				numberEvents = Math.round(daysOffset * 17 * unicornChanceRatio / 100000);
				this.game.resPool.addResEvent("unicorns", numberEvents);
				totalNumberOfEvents += numberEvents;
			}

			if ( zebras.value > 0 && zebras.value <= this.game.karmaZebras && this.game.karmaZebras > 0){
				numberEvents = Math.round(daysOffset * 500 / 100000);
				this.game.resPool.addResEvent("zebras", numberEvents);
				totalNumberOfEvents += numberEvents;
			}
		}
		//TODO: maybe it is a good idea to start moving daily events to json metadata
		//-------------------------  -------------------

		var riftChance = this.game.getEffect("riftChance");	//5 OPTK
		numberEvents = Math.round(daysOffset * riftChance * unicornChanceRatio);
		this.game.resPool.addResEvent("unicorns", numberEvents * 500);
		totalNumberOfEvents += numberEvents;

		//----------------------------------------------
		var aliChance = this.game.getEffect("alicornChance");	//0.2 OPTK
		aliChance *= 1 + this.game.getLimitedDR(this.game.getEffect("alicornPerTickRatio"), 1.2);
		numberEvents = Math.round(daysOffset * aliChance);
		if (numberEvents >= 1) {
			this.game.resPool.addResEvent("alicorn", numberEvents);
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}
		totalNumberOfEvents += numberEvents;

		// -------------- ivory meteors ---------------
		var meteorChance = 0 + this.game.getEffect("ivoryMeteorChance");	//5 OPTK
		numberEvents = Math.round(daysOffset * meteorChance * unicornChanceRatio);
		if (numberEvents){
			var ivory = (250 + this.game.rand(1500) * (1 + this.game.getEffect("ivoryMeteorRatio")));
			this.game.resPool.addResEvent("ivory", ivory * numberEvents);
		}
		totalNumberOfEvents += numberEvents;

		var yearsOffset = Math.floor(daysOffset / (this.daysPerSeason * this.seasonsPerYear));

		//antimatter
		var resPool = this.game.resPool;
		if (resPool.energyProd >= resPool.energyCons) {
			resPool.addResEvent("antimatter", this.game.getEffect("antimatterProduction") * yearsOffset);
		}

		var beacons = this.game.space.getBuilding("spaceBeacon");
		beacons.action(beacons, this.game);
		this.game.updateCaches();
		this.game.resPool.addResPerTick("relic", this.game.getEffect("relicPerDay") * daysOffset);
		//------------------------- necrocorns pacts -------------------------
		this.game.religion.pactsManager.necrocornConsumptionDays(daysOffset);

		//not sure if it is a good idea
		//calculate amount of void earned on average per day, then multiply by days and percentage of time in paradox
		var daysInParadox = 10 + this.game.getEffect("temporalParadoxDay");
		var daysBetweenParadox = daysInParadox + 100 * Math.max( 1 , 100 / this.game.bld.get("chronosphere").on );
		var percentTimeInParadox = daysInParadox / daysBetweenParadox;

		this.game.resPool.addResEvent("void", Math.floor(this.game.resPool.getVoidQuantityStatistically() * daysOffset * percentTimeInParadox));

		// Adjust crypto price
		if (this.game.science.get("antimatter").researched) {
			var logIncrease = this.game.math.loopOrGaussianApproximation(daysOffset - 1, false, 1.2499270834635280e-6, 1.4427062504448777e-10, this.game.math.log1p(-1 / 40000), this.game.math.log1p(1 / 40000), function() {
				var y = Math.random();
				return y < 0.3
					? this.game.math.log1p((y - 0.3) / (0.3 * 40000))
					: y < 0.6
						? 0
						: this.game.math.log1p((y - 0.6) / (0.4 * 40000));
			});
			this.game.calendar.cryptoPrice *= Math.exp(logIncrease);
			this.adjustCryptoPrice();
		}

		//==================== other calendar stuff ========================
		//cap years skipped in 1000 years
		if (this.game.challenges.isActive("1000Years") && this.year + yearsOffset > 500){
			yearsOffset = Math.max(500 - this.year, 0);
		}

		//calculate millenium difference
		var paragon = Math.floor((this.year + yearsOffset) / 1000) - Math.floor(this.year / 1000);
		if (paragon > 0){
			resPool.addResEvent("paragon", paragon);
			this.game.stats.getStat("totalParagon").val += paragon;
		}
		this.game.religion.pactsManager.pactsMilleniumKarmaKittens(paragon);
		this.year += yearsOffset;
		this.game.stats.getStat("totalYears").val += yearsOffset;
		//------------------------------------------------------------------

        return totalNumberOfEvents;
	},

	onNewSeason: function(){
		this.eventChance = 0;

		
		if (this.year > 3){
			var coldChance = 175;
			var warmChance = 175;

			var effect = this.game.getLimitedDR(this.game.getEffect("coldChance") * 1000, 825);
			coldChance += effect;
			warmChance -= effect;
			if (warmChance < 0) {
				warmChance = 0;
			}
			if (this.getCurSeason().name == "winter" && this.game.challenges.getChallenge("winterIsComing").researched && !this.game.challenges.isActive("winterIsComing")){
				coldChance = 0;
			}

			var rand = this.game.rand(1000);
			if (rand < warmChance){
				this.weather = "warm";
			} else if (rand < warmChance + coldChance){
				this.weather = "cold";
			} else{
				this.weather = null;
			}
		}else{
			this.weather = null;
		}

		if (this.season == 2 && this.game.workshop.get("advancedAutomation").researched ){
			this.game.bld.get("steamworks").jammed = false;
		}

		// Apply seasonEffect for the newSeason
		this.game.upgrade({
			buildings: ["pasture"]
		});

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

	getMilleniaChanged: function (startYear, endYear) {
		return Math.max(0, (Math.floor(endYear / 1000) * 1000 - Math.floor(startYear / 1000) * 1000) / 1000);
	},
	calculateMilleniumProduction: function(milleniums){
		this.game.resPool.addResEvent("paragon", milleniums);
		this.game.stats.getStat("totalParagon").val += milleniums;
		this.game.religion.pactsManager.pactsMilleniumKarmaKittens(milleniums);
	},
	onNewYears: function(updateUI, years, milleniumChangeCalculated) {
		var ty = this.game.stats.getStat("totalYears");
		ty.val += years;

		if (ty.val < this.year){
			ty.val = this.year;
		}
		if (this.darkFutureYears() >= 0) {
			this.game.unlock({chronoforge: ["temporalImpedance"]});
		}

		if (this.game.bld.get("steamworks").jammed) {
			this.game.bld.get("steamworks").jammed = false;	//reset jammed status
		}

		if(milleniumChangeCalculated){
			this.calculateMilleniumProduction(this.getMilleniaChanged(this.year - years, this.year));
		}

		var pyramidVal = this.game.religion.getZU("blackPyramid").getEffectiveValue(this.game);
		var markerVal = this.game.religion.getZU("marker").getEffectiveValue(this.game);

		//3.5% per year per BP, +10% per marker
		if (pyramidVal > 0) {
			if (this.game.rand(1000) < 35 * pyramidVal * years * (1 + 0.1 * markerVal)) {
				this.game.diplomacy.unlockElders();
			}
		}

		if (this.game.diplomacy.get("leviathans").unlocked) {
			this.game.challenges.getChallenge("blackSky").unlocked = true;
		}
		
		this.cycleYear += years;
		if (this.cycleYear >= this.yearsPerCycle) {
			var cyclesChange = Math.floor(this.cycleYear / this.yearsPerCycle);
			this.cycleYear = this.cycleYear % this.yearsPerCycle;
			if (cyclesChange + this.cycle >= this.cyclesPerEra) {
				this.cycle = (cyclesChange + this.cycle)%this.cyclesPerEra;
			} else{
				this.cycle += cyclesChange;
			}
		}
/*
if (++this.cycleYear >= this.yearsPerCycle) {
			this.cycleYear = 0;
			if (++this.cycle >= this.cyclesPerEra) {
				this.cycle = 0;
			}
		}

*/
		// Apply cycleEffect for the newYears
		this.game.upgrade({
			spaceBuilding: this.game.space.spaceBuildingsMap
		});

		var resPool = this.game.resPool;
		if (resPool.energyProd >= resPool.energyCons) {
			resPool.addResEvent("antimatter", this.game.getEffect("antimatterProduction") * years);
		}

		resPool.addResEvent("temporalFlux", this.game.getEffect("temporalFluxProduction") * years);

		var aiLevel = this.game.bld.get("aiCore").effects["aiLevel"];
		if ((aiLevel > 14) && (this.game.science.getPolicy("transkittenism").researched != true)){
			var aiApocalypseLevel = aiLevel - 14;
			if(!this.game.getEffect("shatterTCGain")){
				for (var i in this.game.resPool.resources){
					var res = this.game.resPool.resources[i];
					if (res.aiCanDestroy) {
						resPool.addResEvent(res.name, -res.value * (1 - Math.pow(1 - 0.01 * aiApocalypseLevel, years))); //hopefully this will work close enough
					}
				}
			}
		}

		this.game.upgrade({policies: ["authocracy"]});

		if (updateUI) {
			this.game.ui.render();
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
			var kittens = this.game.resPool.get("kittens").value;

			//holy genocide karma effect
			this.game.religion.pactsManager.pactsMilleniumKarmaKittens(1);
		}

		var pyramidVal = this.game.religion.getZU("blackPyramid").getEffectiveValue(this.game);
		var markerVal = this.game.religion.getZU("marker").getEffectiveValue(this.game);

		//3.5% per year per BP, +10% per marker
		if (pyramidVal > 0) {
			if (this.game.rand(1000) < 35 * pyramidVal * (1 + 0.1 * markerVal)) {
				this.game.diplomacy.unlockElders();
			}
		}

		if (this.game.diplomacy.get("leviathans").unlocked) {
			this.game.challenges.getChallenge("blackSky").unlocked = true;
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
		if ((aiLevel > 14) && (this.game.science.getPolicy("transkittenism").researched != true)){
			var aiApocalypseLevel = aiLevel - 14;
			this.game.msg($I("ai.apocalypse.msg", [aiApocalypseLevel]), "alert", "ai");
			for (var i in this.game.resPool.resources){
				var res = this.game.resPool.resources[i];
				if (res.aiCanDestroy) {
					resPool.addResEvent(res.name, -res.value * 0.01 * aiApocalypseLevel);
				}
			}
		}

		this.game.upgrade({policies: ["authocracy"]});
		
		if (updateUI) {
			this.game.ui.render();
		}
	},

	adjustCryptoPrice: function() {
		if (this.game.science.get("antimatter").researched) {
			// 3 times -1, 3 times 0, 4 times +1
			this.cryptoPrice += this.cryptoPrice * (1 - (this.game.rand(10) % 3)) * Math.random() / 40000;
			if (this.cryptoPrice > 1100) {
				this.correctCryptoPrice();
			}
		}
	},

	correctCryptoPrice: function() {
		this.cryptoPrice *= 0.7 + 0.1 * Math.random();
		this.game.msg($I("trade.correct.bcoin"), "important");
	},

	getWeatherMod: function(res){
		var mod = this.getCurSeason().modifiers[res.name] ? this.getCurSeason().modifiers[res.name] : 1;

		if (res.name != "catnip") {
			return mod;
		}

		if (this.game.science.getPolicy("communism").researched && this.getCurSeason().name == "winter" && this.weather == "cold"){
			return 0;
		}

		if (this.weather == "warm"){
			mod +=  0.15;
		} else if (this.weather == "cold"){
			mod += -0.15;
		}
		if (this.game.challenges.getChallenge("winterIsComing").on && this.weather == "cold") {
			mod *= 1 + this.game.getLimitedDR(this.game.getEffect("coldHarshness"),1);
		}
		if (this.getCurSeason().name == "spring") {
                        mod *= (1 + this.game.getLimitedDR(this.game.getEffect("springCatnipRatio"), 2));
                }

		return mod;
	},

	getCurSeason: function(){
		if (this.game.challenges.isActive("winterIsComing")){
			return this.seasons[3];	//eternal winter
		}
		return this.seasons[this.season];
	},

	getCurSeasonTitle: function() {
		var winterIsComingNumeral = this.game.challenges.isActive("winterIsComing") ? this.getWinterIsComingNumeral() : "";
		return this.getCurSeason().title + winterIsComingNumeral;
	},

	getCurSeasonTitleShorten: function() {
		var winterIsComingNumeral = this.game.challenges.isActive("winterIsComing") ? this.getWinterIsComingNumeral() : "";
		return this.getCurSeason().shortTitle + winterIsComingNumeral;
	},

	getWinterIsComingNumeral: function() {
		switch (this.season) {
			case 0:
				return " I";
			case 1:
				return " II";
			case 2:
				return " III";
			case 3:
				return " IV";
		}
		return "";
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
