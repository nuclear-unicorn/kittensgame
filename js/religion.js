/**
 * Behold the bringer of light!
 */
dojo.declare("classes.managers.ReligionManager", com.nuclearunicorn.core.TabManager, {

	game: null,
	pactsManager: null,

	//your TT level!
	transcendenceTier: 0,

	//an amount of faith temporarily moved to a praised pool (aka worship)
	faith: 0,

	//an amount of converted faith obtained through the faith reset (aka eupyphany)
	faithRatio : 0,

	//Progress to generating the next necrocorn.
	//Will usually be a float value between 0 & 1.
	//Whenever this reaches 1, poof! 1 alicorn will be converted into 1 necrocorn.
	corruption: 0,
	//Array where each element is a separate bonus/effect/modifier to necrocorn production
	//Additionally, stores important derived values in easily accessible fields
	corruptionCached: null,

	alicornCounter: 0,

	//the amount of currently active HG buildings (typically refils during reset)
	activeHolyGenocide: 0,

	constructor: function(game){
		this.game = game;
		this.registerMeta(/*"stackable"*/false, this.zigguratUpgrades, {
			getEffect : function(bld, effect){
				if (bld.name == "blackPyramid") {
					return (bld.effects) ? bld.effects[effect] * bld.getEffectiveValue(game) : 0;
				}
				return (bld.effects) ? bld.effects[effect] * bld.on : 0;
			}
		});
		this.registerMeta("stackable", this.religionUpgrades, null);
		this.registerMeta(/*"stackable"*/false, this.transcendenceUpgrades, {
			getEffect: function(bld, effectName){
				var effectValue = bld.effects[effectName] || 0;
				if (bld.name == "holyGenocide"){
					if (effectName == "activeHG") { //This one doesn't stack at all.
						return game.religion.activeHolyGenocide;
					}
					return effectValue * game.religion.activeHolyGenocide;
				}
				return effectValue * bld.on;
			}
		});
		this.pactsManager = new classes.religion.pactsManager(game);
		this.registerMeta("stackable", this.pactsManager.pacts, null);
		this.setEffectsCachedExisting();
	},

	resetState: function(){
		this.faith = 0;
		this.corruption = 0;
		this.corruptionCached = null;
		this.transcendenceTier = 0;
		this.faithRatio = 0;

		for (var i = 0; i < this.zigguratUpgrades.length; i++){
			var zu = this.zigguratUpgrades[i];
			zu.unlocked = zu.defaultUnlocked || false;
			this.resetStateStackable(zu);
		}

		for (i = 0; i < this.religionUpgrades.length; i++){
			var ru = this.religionUpgrades[i];
			this.resetStateStackable(ru);
		}

		for (i = 0; i < this.transcendenceUpgrades.length; i++){
			var tu = this.transcendenceUpgrades[i];
			tu.unlocked = false;
			this.resetStateStackable(tu);
		}
		this.pactsManager.resetState();
	},

	save: function(saveData){
		saveData.religion = {
			faith: this.faith,
			corruption: this.corruption,
			faithRatio: this.faithRatio,
			transcendenceTier: this.transcendenceTier,
			activeHolyGenocide: this.activeHolyGenocide,
			necrocornDeficit: this.pactsManager.necrocornDeficit,

			// Duplicated save, for older versions like mobile
			tcratio: this._getTranscendTotalPrice(this.transcendenceTier),
			zu: this.filterMetadata(this.zigguratUpgrades, ["name", "val", "on", "unlocked"]),
			ru: this.filterMetadata(this.religionUpgrades, ["name", "val", "on"]),
			tu: this.filterMetadata(this.transcendenceUpgrades, ["name", "val", "on", "unlocked"]),
			pact: this.filterMetadata(this.pactsManager.pacts, ["name", "val", "on", "unlocked"])

		};
	},

	load: function(saveData){
		if (!saveData.religion){
			return;
		}

		var _data = saveData.religion;

		this.faith = _data.faith || 0;
		this.corruption = _data.corruption || 0;
		this.corruptionCached = null; //Recalculate it later.
		this.faithRatio = _data.faithRatio || 0;
		this.transcendenceTier = _data.transcendenceTier || 0;
		this.activeHolyGenocide = _data.activeHolyGenocide || 0;
		this.pactsManager.necrocornDeficit = saveData.religion.necrocornDeficit || 0;

		// Read old save
		if (this.transcendenceTier == 0 && _data.tcratio > 0) {
			this.transcendenceTier = Math.max(0, Math.round(Math.log(10 * this.game.getUnlimitedDR(_data.tcratio, 0.1))));
		}

		this.loadMetadata(this.zigguratUpgrades, _data.zu);
		this.loadMetadata(this.religionUpgrades, _data.ru);
		this.loadMetadata(this.transcendenceUpgrades, _data.tu);
		this.loadMetadata(this.pactsManager.pacts, _data.pact);

		for (var i = 0; i < this.transcendenceUpgrades.length; i++){
			var tu = this.transcendenceUpgrades[i];
			if (this.transcendenceTier >= tu.tier && (!tu.evaluateLocks || tu.evaluateLocks(this.game))) {
				tu.unlocked = true;
			}
			if (tu.val > 0 && tu.unlocks){
				this.game.unlock(tu.unlocks);
			}
		}
		//necrocorn deficit affecting 
		var pacts = this.pactsManager.pacts;
		for (var i = 0; i < pacts.length; i++){
			pacts[i].calculateEffects(pacts[i], this.game);
		}
		this.getZU("blackPyramid").updateEffects(this.getZU("blackPyramid"), this.game);
		console.log("pactsAdjustment");
		if (!this.getPact("fractured").researched && this.getZU("blackPyramid").val > 0 && (this.game.religion.getTU("mausoleum").val > 0 || this.game.science.getPolicy("radicalXenophobia").researched)){
			this.game.unlock({
				pacts: ["pactOfCleansing", "pactOfDestruction",  "pactOfExtermination", "pactOfPurity"]
			});
		}
	},
	/**
	 * Game rule: If the current number of necrocorns is strictly greater than a certain value,
	 * a penalty is applied to necrocorn corruption rate.  This function returns where that threshold is.
	 * @return A number in units of necrocorns, intended for use in necrocorn-related calculations
	 */
	getExistNecrocornThreshold: function() {
		return this.game.science.getPolicy("feedingFrenzy").researched ? 1 : 0;
	},
	/**
	 * This function does 2 things:
	 * (1) It calculates necrocorn production in a way that remembers intermediate values.
	 * (2) It keeps information on the names of all the different modifiers, bonuses, etc.
	 *     This is the information that will be shown to the player in the production breakdown tooltip.
	 * 
	 * My intent here is to make adding a new bonus as easy as possible.  Instead of having to add it to both
	 * the UI code and to the effects calculation code, which may be in different files,
	 * it's all contained in one place.
	 * 
	 * If a dev wants to add a new upgrade that grants a necrocorn bonus, all they need to do is to add
	 * just a few lines of code to this function specifying the name of the effect & how it's calculated.
	 * 
	 * @param pretendExistNecrocorn bool (optional) There's one specific effect whose value is based on
	 *                                   whether or not there are a non-zero number of necrocorns already.
	 *                                   If this flag is true, we pretend we have some necrocorns.
	 *                                   If false, we pretend we have exactly 0 necrocorns.
	 *                                   If this flag is omitted (i.e. left undefined), we will check
	 *                                   how many necrocorns the game-state actually has.
	 * @return An array.  Each element in the array represents an individual bonus/modifier to necrocorn production.
	 *         The point of this array is that the code for the UI can process this array to make it human-readable.
	 * 
	 * Each element in the array is an object with the following 3 keys:
	 *	label: string.  What the player will see in the UI as the name for this effect.
	 *	value: number.  Has different meaning depending on the behavior field.
	 *	behavior: string.  How this effect interacts with the others in the list.  Can have 2 possible values:
	 *		"additive" - The value field represents a flat bonus, in units of necrocorns per tick
	 *		"multiplicative" - All additive effects before this point will be multiplied by the value
	 * 
	 * But, if all you want are some quick & easy numbers, fear not!  You need not bother with the array elements.
	 * The return value will also have an additional numerical field, in addition to being an array.
	 *	finalCorruptionPerTick: number.  The TOTAL necrocorn production per tick, after applying ALL modifiers.
	 */
	getCorruptionEffects: function(pretendExistNecrocorn) {
		var existNecrocorn = (pretendExistNecrocorn === undefined) ? (this.game.resPool.get("necrocorn").value > this.getExistNecrocornThreshold()) : pretendExistNecrocorn;
		var effectsList = [];
		effectsList.finalCorruptionPerTick = 0;
		effectsList.corruptionProdPerTick = 0;
		effectsList.deficitPerTick = 0;
		//effectsList is an ARRAY but it also has properties like an object.  This is intentional.

		//Base production (from Markers, affected by Black Sky Challenge reward)
		if (this.game.resPool.get("alicorn").value > 0) {
			effectsList.push({
				label: $I("res.stack.corruptionFromMarkers"),
				value: this.game.getEffect("corruptionRatio"),
				behavior: "additive"
			});
		}
		//Game rule: Necrocorn production is slower if you have necrocorns already.
		//corruptionBoostRatio reduces this & can eventually turn it into a bonus.
		if (existNecrocorn) {
			var multiplier = 0.25 * (1 + this.game.getEffect("corruptionBoostRatio"));
			effectsList.push({
				label: $I(multiplier < 1 ? "res.stack.corruptionExistPenalty" : "res.stack.religion"),
				value: multiplier,
				behavior: "multiplicative"
			});
		}
		//Black Radiances
		effectsList.push({
			label: $I("res.stack.corruptionSorrowBonus"),
			//30% bls * 20 Radiance should yield ~ 50-75% boost rate which is laughable but we can always buff it
			value: 1 + Math.sqrt(this.game.resPool.get("sorrow").value * this.game.getEffect("blsCorruptionRatio")),
			behavior: "multiplicative"
		});
		//Downside of the policy, "Feeding Frenzy"
		effectsList.push({
			label: $I("res.stack.corruptionInterference"),
			value: 1 + this.game.getEffect("necrocornCorruptionInterference"),
			behavior: "multiplicative"
		});

		// >>>here<<< is the place to add new bonuses/modifiers/etc. if the devs want to add more content
		// Just define a label (the i18n string to show to the player, giving this effect a name)
		// Give it a value & either "additive" or "multiplicative" behavior
		// The game will recalculate this once per tick, so you can put in a mathematical formula if you want.

		//Calculation time: Go through every effect & apply them, in order.
		for (var i = 0; i < effectsList.length; i += 1) {
			var effect = effectsList[i];
			switch (effect.behavior) {
			case "additive":
				effectsList.finalCorruptionPerTick += effect.value;
				effectsList.corruptionProdPerTick += effect.value;
				break;
			case "multiplicative":
				effectsList.finalCorruptionPerTick *= effect.value;
				effectsList.corruptionProdPerTick *= effect.value;
				break;
			case "siphoning": //Back in the old days, the Siphoning polcy used to work differently.
				if (effect.value < effectsList.finalCorruptionPerTick) {
					//We can pay siphoned Pacts in full!
					effectsList.finalCorruptionPerTick -= effect.value;
				} else {
					effectsList.deficitPerTick = Math.max(effect.value - effectsList.finalCorruptionPerTick, 0);
					//Shrink so it doesn't consume more than we have from other sources.
					effect.value = effectsList.finalCorruptionPerTick;
					effectsList.finalCorruptionPerTick = 0;
				}
				//Leave effectsList.corruptionProdPerTick unchanged.
				//Flip value from positive to negative & mark as "additive"
				effect.value *= -1;
				effect.behavior = "additive";
				break;
			}
		}
		return effectsList;
	},
	/**
	 * Gets the amount of necrocorns corrupted per tick.
	 * @param pretendExistNecrocorn boolean (optional) --If omitted, checks the game-state we're actually in right now.
	 */
	getCorruptionPerTick: function(pretendExistNecrocorn){
		//Recalculate if needed, grab cached value if we can
		if (typeof(pretendExistNecrocorn) === "boolean" || !this.corruptionCached) {
			return this.getCorruptionEffects(pretendExistNecrocorn).finalCorruptionPerTick;
		}
		return this.corruptionCached.finalCorruptionPerTick;
	},
	update: function(){
		if (this.game.resPool.get("faith").value > 0 || this.game.challenges.isActive("atheism") && this.game.bld.get("ziggurat").val > 0){
			this.game.religionTab.visible = true;
		}

		//safe switch for a certain type of pesky bugs with conversion
		if (isNaN(this.faith)){
			this.faith = 0;
		}

		//Update cached corruption-related values (only once per tick!)
		this.corruptionCached = this.getCorruptionEffects();

		var alicorns = this.game.resPool.get("alicorn");
		if (alicorns.value > 0) {
			this.corruption += this.getCorruptionPerTick();
		} else {
			this.corruption = 0;
		}

		if (this.corruption >= 1) {
			var corrupted = this.corruptNecrocorns();
			if (corrupted > 0) {
				this.game.msg($I("religion.msg.corruption"), "important", "alicornCorruption");
			}
		}

		if (this.game.calendar.day >= 0) {
			this.triggerOrderOfTheVoid(1);
		}
	},

	fastforward: function(daysOffset) {
		var times = daysOffset * this.game.calendar.ticksPerDay;
		//safe switch for a certain type of pesky bugs with conversion
		if (isNaN(this.faith)){
			this.faith = 0;
		}
		this.necrocornFastForward(daysOffset, times);

		this.triggerOrderOfTheVoid(times);
	},
	/**
	 * If the necrocorn corruption progress has reached 100%, convert alicorns into necrocorns at a 1:1 ratio.
	 * If the Siphoning policy is active, these necrocorns are immediately used to repay debt.
	 * Otherwise, the player gets to keep them.
	 * If there are not enough alicorns, the corruption progress remains at 100%.
	 * @return The number of necrocorns gained from this.  (Necrocorns spent to pay debt due to Siphoning don't count.  We only count necrocorns if the player gets to keep them.)
	 */
	corruptNecrocorns: function(){
		var alicorns = this.game.resPool.get("alicorn");
		// Prevents alicorn count to fall to 0, which would stop the per-tick generation
		var maxAlicornsToCorrupt = Math.ceil(alicorns.value) - 1;
		var alicornsToCorrupt = Math.floor(Math.min(this.corruption, maxAlicornsToCorrupt));
		var debtToPay = this.game.getEffect("repayDebtOnNecrocornGeneration") ?
			Math.floor(this.pactsManager.necrocornDeficit) : 0;
		if (alicornsToCorrupt > 0) {
			this.corruption -= alicornsToCorrupt;
			alicorns.value -= alicornsToCorrupt;
			if (debtToPay > 0) { //Instead of generating necrocorns, pay back debt.
				debtToPay = Math.min(debtToPay, alicornsToCorrupt);
				this.pactsManager.necrocornDeficit -= debtToPay;
				alicornsToCorrupt -= debtToPay;
				this.game.msg((debtToPay == 1 ? $I("religion.msg.siphoned.one") : $I("religion.msg.siphoned.many", [debtToPay])),
					null, "alicornCorruption");
			}
			this.game.resPool.get("necrocorn").value += alicornsToCorrupt;
			this.game.upgrade({
				zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
			});
		}
		if (this.corruption >= 1) {
			this.corruption = 1;
		}
		return alicornsToCorrupt;
	},
	/**
	 * Internal helper function
	 * Makes assumptions: We have Siphoning Policy, we'll never run out of alicorns to corrupt.
	 * This implementation is designed to properly handle the edge case where Siphoning might prevent
	 * us from generating a necrocorn & transitioning from below to above the threshold.
	 * TODO: Write a test suite to ensure it works properly
	 * It might be theoretically possible to complete this by simulating a max of 3 points, rather than looping.
	 */
	_necrocornsNaiveFastForward_withSiphoning: function(daysOffset, times) {
		//Normally, the number of ticks per day is a well-defined constant
		// (but could change in the future due if redshift paradox handling gets changed)
		var TICKS_PER_DAY = times / daysOffset;
		//Nonnegative number, in units of necrocorns per tick:
		var avgDebtPerTick = -this.game.getEffect("necrocornPerDay") / TICKS_PER_DAY; //game.getEffect returns a NEGATIVE NUMBER if we have active Pacts
		var corruptionBefore = this.corruption;
		var debtBefore = this.pactsManager.necrocornDeficit;
		var threshold = this.getExistNecrocornThreshold();
		var necrocornRes = this.game.resPool.get("necrocorn"); //Resource object
		var corruptionPerTickUnpenalized = this.getCorruptionPerTick(false /*pretendExistNecrocorn*/);
		var corruptionPerTickPenalized = this.getCorruptionPerTick(true /*pretendExistNecrocorn*/);

		//---------------------- Calculate # of ticks to spend above/below threshold ----------------------//

		//How many ticks we'll get of necrocorn production while <= the threshold:
		var ticksUnpenalized = 0;
		if (necrocornRes.value <= threshold && times > 0) { //Calculate when we'll reach threshold--but due to debt, it effectively moves!
			//Number of necrocorns we *would* need to generate to surpass threshold
			// if debt were always zero...
			var BASEnecrocornsToPassThreshold = 1 + Math.floor(threshold - necrocornRes.value);

			//We'll perform this in a number of steps
			var tryNumber = BASEnecrocornsToPassThreshold;
			var ticksElapsed = 0;
			while (ticksElapsed < times) {
				//Let's project into the future, after we've generated tryNumber necrocorns.
				//Then we'll see how many more *additional* necrocorns we need in order to pay for the debt we would've accumulated by that time
				//Then we update tryNumber
				//STOP when we either run out of time OR we find a tryNumber that's enough
				ticksElapsed = Math.ceil((tryNumber - corruptionBefore) / corruptionPerTickUnpenalized);
				var projectedDebt = debtBefore + ticksElapsed * avgDebtPerTick; //Amount of debt we'd have at this point in time
				var targetNecrocorns = BASEnecrocornsToPassThreshold + Math.floor(projectedDebt); //How many necrocorns we WANT to have made by this time

				/*Debug info
				console.log("By the time we generate " + tryNumber + " necrocorns, it'll have taken " +
					"us " + ticksElapsed + " ticks.\nBy this time, our current amount of necrocorn " +
					"debt will have increased to " + projectedDebt + ", so the effective threshold " +
					"has moved to " + targetNecrocorns + " necrocorns."); //*/

				if (tryNumber >= targetNecrocorns) {
					break;
				} else {
					//This method of making multiple steps may be inefficient
					//Ideally, we could find a way to do this in 3 steps or less
					tryNumber = targetNecrocorns;
					if (avgDebtPerTick >= corruptionPerTickUnpenalized && tryNumber > (BASEnecrocornsToPassThreshold + debtBefore) * 2) {
						//We are clearly not getting any closer to an answer.
						//This means we will NEVER reach the threshold from where we currently are.
						tryNumber = Infinity;
						break;
					}
				}
			}
			//By now, we've found a solution--either tryNumber contains the exact number of necrocorns
			// we need in order to reach the effective threshold, or tryNumber is larger than the number
			// of necrocorns we'll produce in the time period we're calculating.
			ticksElapsed = Math.ceil((tryNumber - corruptionBefore) / corruptionPerTickUnpenalized);
			ticksUnpenalized = ticksElapsed;
			if (ticksUnpenalized < 0) { ticksUnpenalized = 0; } //This would happen if we're above the threshold already.
			if (ticksUnpenalized > times) { ticksUnpenalized = times; } //This would happen if we are fast-forwarding for a very short duration only
			//So, by now we should have found the correct numbers, or we passed the edge.
		}
		//How many ticks we'll get of necrocorn production while > the threshold:
		var ticksPenalized = times - ticksUnpenalized;
		var daysUnpenalized = Math.floor(ticksUnpenalized / TICKS_PER_DAY);
		if (isNaN(daysUnpenalized)) { //Sanity check
			daysUnpenalized = 0;
		}
		var daysPenalized = daysOffset - daysUnpenalized;

		/*Debug info, so you can check my math:
		console.log("ReligionManager#necrocornsNaiveFastForward for a total of " + daysOffset + " days, corresponding to " + times +
			" ticks:\nWe are currently at " + necrocornRes.value + " necrocorns, & the threshold is at " +
			threshold + " necrocorns.\n> " + daysUnpenalized + " days (" + ticksUnpenalized + " ticks) are at base production rate (" +
			corruptionPerTickUnpenalized + " necrocorn/tick),\n> the remaining " + daysPenalized + " days (" + ticksPenalized +
			" ticks) are penalized (" + corruptionPerTickPenalized + " necrocorn/tick).");//*/

		//Alright, we'll do this in 2 stages.  First we do unpenalized, then we do penalized.
		//Within each stage, we do Pact upkeep first, then corruption.
		if (daysUnpenalized > 0) {
			this.pactsManager.necrocornConsumptionDays(daysUnpenalized);
		}
		if (ticksUnpenalized > 0) {
			this.corruption += corruptionPerTickUnpenalized * ticksUnpenalized;
			this.corruptNecrocorns();
		}
		//Penalized:
		if (daysPenalized > 0) {
			this.pactsManager.necrocornConsumptionDays(daysPenalized);
		}
		if (ticksPenalized > 0) {
			if (necrocornRes.value <= threshold) {
				console.warn("Logic error: We should not be producing necrocorns at the unpenalized rate right now!");
			}
			this.corruption += corruptionPerTickPenalized * ticksPenalized;
		}

		/*Debug info, so you can check my math:
		console.log("After simulating " + daysPenalized + " days (" + ticksPenalized + " ticks), we have:\n> " +
			necrocornRes.value + " necrocorns (compare to a threshold of " + threshold + ")\n> " +
			this.pactsManager.necrocornDeficit + " debt\n> " + this.corruption + " leftover corruption.\n" +
			"Finished ReligionManager#necrocornsNaiveFastForward for a total of " + daysOffset + " days, corresponding to " + times +
			" ticks.");//*/
		this.corruptNecrocorns();
	},
	/**
	 * Internal helper function.
	 * Makes assumptions: We don't have Siphoning Policy, we'll never run out of alicorns to corrupt.
	 * Does NOT handle the edge case where consumption could take us from above to below the threshold.
	 * TODO: Write a test suite to ensure it works
	 */
	_necrocornsNaiveFastForward_withoutSiphoning: function(daysOffset, times) {
		var corruptionBefore = this.corruption;
		var threshold = this.getExistNecrocornThreshold();
		//Number of necrocorns we had at the start:
		var necrocornsBefore = this.game.resPool.get("necrocorn").value;
		var corruptionPerTickUnpenalized = this.getCorruptionPerTick(false /*pretendExistNecrocorn*/);
		if (corruptionPerTickUnpenalized > 0) { //Avoid divide-by-zero errors
			var corruptionPerTickPenalized = this.getCorruptionPerTick(true /*pretendExistNecrocorn*/);
			//Number of necrocorns we need to generate in order to surpass the threshold
			var necrocornsToPassThreshold = 1 + Math.floor(threshold - necrocornsBefore);
			//How many ticks we'll get of necrocorn production while <= the threshold:
			var ticksUnpenalized = Math.ceil((necrocornsToPassThreshold - this.corruption) / corruptionPerTickUnpenalized);
			if (ticksUnpenalized < 0) { ticksUnpenalized = 0; } //This would happen if we're above the threshold already.
			if (ticksUnpenalized > times) { ticksUnpenalized = times; } //This would happen if we are fast-forwarding for a very short duration only
			//How many ticks we'll get of necrocorn production while > the threshold:
			var ticksPenalized = times - ticksUnpenalized;

			this.corruption += corruptionPerTickUnpenalized * ticksUnpenalized + corruptionPerTickPenalized * ticksPenalized;
		}

		/*Debug info, so you can check my math:
		console.log("ReligionManager#necrocornsNaiveFastForward for a total of " + daysOffset + " days, corresponding to " + times +
			" ticks:\nWe are currently at " + necrocornsBefore + " necrocorns, & the threshold is at " +
			threshold + " necrocorns.\nWe need to produce " + necrocornsToPassThreshold + " necrocorns to pass the threshold.\n> " + ticksUnpenalized + " ticks are at base production rate (" +
			corruptionPerTickUnpenalized + " necrocorn/tick),\n> the remaining " + ticksPenalized +
			" ticks are penalized (" + corruptionPerTickPenalized + " necrocorn/tick).\nWe started at " +
			corruptionBefore + " corruption; we ended at " + this.corruption + " corruption (increase of " +
			(this.corruption - corruptionBefore) + ").");//*/

		this.corruptNecrocorns();
		//------------------------- Pacts consume necrocorns/accumulate debt -------------------------
		this.pactsManager.necrocornConsumptionDays(daysOffset);
	},
	/**
	 * A naive function for calculating how the amount of necrocorns evolves over time.
	 * It's inaccurate because it calculates all necrocorn production & all consumption in single chunks.
	 * It doesn't take into account the fact that, without Siphoning, necrocorns are consumed continuously,
	 * which could cause us to fall below the threshold & start generating necrocorns faster all of a sudden.
	 * This DOES take into account how debt increases continuously over time if the player has Siphoning.
	 * It also doesn't take into account what happens if the player runs out of alicorns partway through.
	 * @param daysOffset number The number of days that elapse (used to calculate Pact consumption)
	 * @param times number The number of ticks that elapse (used to calculate corruption)
	 */
	necrocornsNaiveFastForward: function(daysOffset, times) {
		var alicorns = this.game.resPool.get("alicorn");
		if (alicorns.value > 0) { //We can corrupt necrocorns
			if (this.game.getEffect("repayDebtOnNecrocornGeneration")) {
				this._necrocornsNaiveFastForward_withSiphoning(daysOffset, times);
			} else {
				this._necrocornsNaiveFastForward_withoutSiphoning(daysOffset, times);
			}
		} else { //No alicorns, so we can't corrupt necrocorns...but we must still pay for Pacts
			this.pactsManager.necrocornConsumptionDays(daysOffset);
		}
	},
	/**
	 * A function for calculating how the amount of necrocorns evolves over time.
	 * Markers corrupt alicorns into necrocorns, & Pacts consume necrocorns.
	 * This is better than the naive version because it deals with edge cases.
	 * @param daysOffset number The number of days that elapse (used to calculate Pact consumption)
	 * @param times number The number of ticks that elapse (used to calculate corruption)
	 */
	necrocornFastForward: function(days, times) {
		//The idea is that necrocornsNaiveFastForward is accurate unless one of the following occurs:
		// (1) We continuously consume necrocorns & it causes us to transition from *above* to *below* the "exist-necrocorn threshold."
		//So, the plan is that we'll use the naive solution until we hit one of the above edge cases, fix the edge case, then continue onwards.
		var threshold = this.getExistNecrocornThreshold();
		var necrocornRes = this.game.resPool.get("necrocorn"); //Resource object
		var necrocornPerDay = this.game.getEffect("necrocornPerDay"); //This is a NEGATIVE NUMBER if we have active Pacts
		var continuouslyConsumeNecrocorns = !(this.game.getEffect("repayDebtOnNecrocornGeneration"));
		//Normally, the number of ticks per day is a well-defined constant--but this might not be the case in the future if redshift paradox handling gets changed.
		var ticksPerDay = times / days;

		//Set up a loop!
		//All variables defined above this point are CONSTANT within the loop.
		for (var daysRemaining = days, timesRemaining = times, i = 0; daysRemaining > 0 || timesRemaining > 0; i++ ) {
			//Calculate the projected amount of time until we hit edge case #1:
			var daysUntilWeHitEdgeCase1 = 0;
			if (continuouslyConsumeNecrocorns && necrocornPerDay < 0) {
				if (necrocornRes.value > threshold) {
					var consumptionRate = -necrocornPerDay * this.pactsManager.getNecrocornDeficitConsumptionModifier(); //Positive value, in units of necrocorn/day
					daysUntilWeHitEdgeCase1 = Math.ceil((necrocornRes.value - threshold) / consumptionRate);
				} else {
					//We'll need to check for edge case #1 again after we go above the threshold
					var ticksUntilReachThreshold = Math.ceil((1 + Math.floor(threshold - necrocornRes.value) - this.corruption) / this.getCorruptionPerTick(false /*we are below threshold*/));
					daysUntilWeHitEdgeCase1 = Math.ceil(ticksUntilReachThreshold / ticksPerDay);
				}
			} else { //We are in a situation where edge case #1 cannot happen
				daysUntilWeHitEdgeCase1 = Infinity;
			}

			if (isNaN(daysUntilWeHitEdgeCase1)) { //Sanity check
				daysUntilWeHitEdgeCase1 = Infinity;
			}
			//Alright, now how many do we simulate?
			var daysToSimulate = Math.min(daysRemaining, daysUntilWeHitEdgeCase1);
			var timesToSimulate = Math.min(Math.ceil(daysToSimulate * ticksPerDay), timesRemaining);
			if (daysToSimulate < 1) { //If we sim 0 days, let's use up all remaining ticks at once.
				timesToSimulate = timesRemaining;
			}
			this.necrocornsNaiveFastForward(daysToSimulate, timesToSimulate);
			daysRemaining -= daysToSimulate;
			timesRemaining -= timesToSimulate;
		}
	},

	// Converts the equivalent of 10 % (improved by Void Resonators) of produced faith, but with only a quarter of apocrypha bonus
	triggerOrderOfTheVoid: function(numberOfTicks) {
		if (this.game.prestige.getPerk("voidOrder").researched) {
			var convertedFaith = numberOfTicks * this.game.calcResourcePerTick("faith") * 0.1 * (1 + this.game.getEffect("voidResonance"));
			this.faith += convertedFaith * (1 + this.getApocryphaBonus() / 4);
		}
	},

	zigguratUpgrades: [{
		name: "unicornTomb",
		label: $I("religion.zu.unicornTomb.label"),
		description: $I("religion.zu.unicornTomb.desc"),
		prices: [
			{ name : "ivory", val: 500 },
			{ name : "tears", val: 5 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.05,
			"faithMax": 0,
			"tearsMax": 0
		},
		calculateEffects: function(self, game) {
			if (game.challenges.isActive("unicornTears")) {
				self.effects["tearsMax"] = 1;
				self.effects["faithMax"] = 0;
			} else {
				self.effects["tearsMax"] = 0;

				var faithMax = 0;
				if (game.challenges.getChallenge("unicornTears").researched) {
					//Challenge reward: max faith based on TT
					var tt = game.religion.transcendenceTier;
					if (tt < 1) { //Have some effect even if never transcended
						faithMax = 5;
					} else if (tt < 100) { //Superlinear growth
						faithMax = 5 + (3 * Math.pow(tt, 1.5));
					} else { //Set a reasonable limit
						faithMax = 3000;
					}
				}
				self.effects["faithMax"] = faithMax * 2 /*subject to balance changes*/;
			}
		},
		unlocked: true,
		defaultUnlocked: true,
		unlocks: {
			"zigguratUpgrades": ["ivoryTower"]
		}
	},{
		name: "ivoryTower",
		label: $I("religion.zu.ivoryTower.label"),
		description: $I("religion.zu.ivoryTower.desc"),
		prices: [
			{ name : "ivory", val: 25000 },
			{ name : "tears", val: 25 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.1,
			"riftChance" : 0.0005,
			"tearsMax": 0
		},
		calculateEffects: function(self, game) {
			if (game.challenges.isActive("unicornTears")) {
				self.effects["tearsMax"] = 20;
			} else {
				self.effects["tearsMax"] = 0;
			}
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["ivoryCitadel"]
		}
	},{
		name: "ivoryCitadel",
		label: $I("religion.zu.ivoryCitadel.label"),
		description: $I("religion.zu.ivoryCitadel.desc"),
		prices: [
			{ name : "ivory", val: 50000 },
			{ name : "tears", val: 50 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0.25,
			"ivoryMeteorChance" : 0.0005,
			"unicornsMax": 0,
			"tearsMax": 0
		},
		calculateEffects: function(self, game) {
			if (game.challenges.isActive("unicornTears")) {
				self.effects["unicornsMax"] = 2000;
				self.effects["tearsMax"] = 5;
			} else {
				self.effects["unicornsMax"] = 0;
				self.effects["tearsMax"] = 0;
			}
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["skyPalace"]
		}
	},{
		name: "skyPalace",
		label: $I("religion.zu.skyPalace.label"),
		description: $I("religion.zu.skyPalace.desc"),
		prices: [
			{ name : "ivory", val: 125000 },
			{ name : "tears", val: 500 },
			{ name : "megalith", val: 5 }
		],
		priceRatio: 1.15,
		effects: {
			"goldMaxRatio": 0,
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"ivoryMeteorRatio" : 0,
			"unicornsMax": 0,
			"tearsMax": 0,
			"alicornMax": 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"goldMaxRatio": 0.01,
				"unicornsRatioReligion" : 0.5,
				"alicornChance" : 0.0001,
				"alicornPerTick" : 0,
				"ivoryMeteorRatio" : 0.05,
				"unicornsMax": 0,
				"tearsMax": 0,
				"alicornMax": 0
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.00002;
			}
			if (game.challenges.isActive("unicornTears")) {
				effects["unicornsMax"] = 50;
				effects["tearsMax"] = 275;
				effects["alicornMax"] = 0.2;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["unicornUtopia"]
		}
	},{
		name: "unicornUtopia",
		label: $I("religion.zu.unicornUtopia.label"),
		description: $I("religion.zu.unicornUtopia.desc"),
		prices: [
			{ name : "gold", val: 500 },
			{ name : "ivory", val: 1000000 },
			{ name : "tears", val: 5000 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"tcRefineRatio" : 0,
			"ivoryMeteorRatio" : 0,
			"unicornsMax": 0,
			"tearsMax": 0,
			"alicornMax": 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"unicornsRatioReligion" : 2.5,
				"alicornChance" : 0.00015,
				"alicornPerTick" : 0,
				"tcRefineRatio" : 0.05,
				"ivoryMeteorRatio" : 0.15,
				"unicornsMax": 0,
				"tearsMax": 0,
				"alicornMax": 0
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.000025;
			}
			if (game.challenges.isActive("unicornTears")) {
				effects["unicornsMax"] = 5500;
				effects["tearsMax"] = 1800;
				effects["alicornMax"] = 0.6;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false,
		unlocks: {
			"zigguratUpgrades": ["sunspire"]
		},
		unlockScheme: {
			name: "unicorn",
			threshold: 1
		}
	},{
		name: "sunspire",
		label: $I("religion.zu.sunspire.label"),

		//TODO: make SSPIRE make something really interesting
		description: $I("religion.zu.sunspire.desc"),
		prices: [
			{ name : "gold", val: 1250 },
			{ name : "ivory", val: 750000 },
			{ name : "tears", val: 25000 }
		],
		priceRatio: 1.15,
		effects: {
			"unicornsRatioReligion" : 0,
			"alicornChance" : 0,
			"alicornPerTick" : 0,
			"tcRefineRatio": 0,
			"ivoryMeteorRatio" : 0,
			"unicornsMaxRatio": 0,
			"tearsMax": 0,
			"alicornMax": 0
		},
		calculateEffects: function(self, game) {
			var effects = {
				"unicornsRatioReligion" : 5,
				"alicornChance" : 0.0003,
				"alicornPerTick" : 0,
				"tcRefineRatio" : 0.1,
				"ivoryMeteorRatio" : 0.5,
				"unicornsMaxRatio": 0,
				"tearsMax": 0,
				"alicornMax": 0
			};
			if (game.resPool.get("alicorn").value > 0) {
				effects["alicornPerTick"] = 0.00005;
			}
			if (game.challenges.isActive("unicornTears")) {
				effects["unicornsMaxRatio"] = 0.1;
				effects["tearsMax"] = 10000;
				effects["alicornMax"] = 1;
			}
			self.effects = effects;
		},
		unlocked: false,
		defaultUnlocked: false
	},{
		name: "marker",
		label: $I("religion.zu.marker.label"),
		description: $I("religion.zu.marker.desc"),
		prices: [
			{ name : "unobtainium", val: 2500 },
			{ name : "spice", val: 50000 },
			{ name : "tears", val: 5000 },
			{ name : "megalith", val: 750 }
		],
		priceRatio: 1.15,
		effects: {
			"corruptionRatio" : 0.000001
		},
		calculateEffects: function(self, game) {
			self.effects["corruptionRatio"] = 0.000001 * (1 + game.getEffect("corruptionBoostRatioChallenge")); //LDR specified in challenges.js
		},
		unlocked: false,
		unlocks: {
			policies: ["siphoning", "feedingFrenzy", "upfrontPayment"]
		},
		getEffectiveValue: function(game) {
			return this.val * (1 + game.getEffect("corruptionBoostRatioChallenge")); //LDR specified in challenges.js
		},
		flavor: $I("religion.zu.marker.flavor")
	},{
		name: "unicornGraveyard",
		label: $I("religion.zu.unicornGraveyard.label"),
		description: $I("religion.zu.unicornGraveyard.desc"),
		prices: [
			{ name : "necrocorn", val: 5 },
			{ name : "megalith", val: 1000 }
		],
		priceRatio: 1.15,
		effects: {
			"cultureMaxRatioBonus" : 0.01,
			"blackLibraryBonus": 0.02
		},
		upgrades: {
			buildings: ["ziggurat"]
		},
		unlocks: {
			"zigguratUpgrades": ["unicornNecropolis"]
		},
		unlocked: false
	},{
		name: "unicornNecropolis",
		label: $I("religion.zu.unicornNecropolis.label"),
		description: $I("religion.zu.unicornNecropolis.desc"),
		prices: [
			{ name : "alicorn", val: 100 },
			{ name : "necrocorn", val: 15 },
			{ name : "void", val: 5 },
			{ name : "megalith", val: 2500 }
		],
		priceRatio: 1.15,
		effects: {
			"corruptionBoostRatio" : 0.10
		},
		unlocked: false
	},{
		name: "blackPyramid",
		label: $I("religion.zu.blackPyramid.label"),
		description: $I("religion.zu.blackPyramid.desc"),
		prices: [
			{ name : "unobtainium", val: 5000 },
			{ name : "spice", val: 150000 },
			{ name : "sorrow", val: 5 },
			{ name : "megalith", val: 2500 }
		],
		priceRatio: 1.15,
		effectsPreDeficit: {},
		jammed: false,
		effects: {
			"pyramidGlobalResourceRatio" : 0,
			"pyramidGlobalProductionRatio" : 0,
			"pyramidFaithRatio" : 0,
			"deficitRecoveryRatio": 0,
			"blackLibraryBonus": 0,
			"pyramidSpaceCompendiumRatio": 0
		},
		simpleEffectNames:[
			"GlobalResourceRatio",
			"RecoveryRatio",
			"GlobalProductionRatio",
			"FaithRatio",
			"SpaceCompendiumRatio"
		],
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		calculateEffects: function(self, game) {
			self.togglable = false;
			if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
				for (var eff in self.effects){
					self.effects[eff] = 0;
				}
				return;
			}
			var pacts = game.religion.pactsManager.pacts;
			for (var i = 0; i < pacts.length; i++){
				if (pacts[i].updatePreDeficitEffects){
					pacts[i].updatePreDeficitEffects(game);
				}
			}
		},
		cashPreDeficitEffects: function (game) {
			var transcendenceTierModifier = Math.max(game.religion.transcendenceTier - 24, 1);
			var self = game.religion.getZU("blackPyramid");
			for (var counter in self.simpleEffectNames){
				self.effectsPreDeficit["pyramid" + self.simpleEffectNames[counter]] = game.getEffect("pact" + self.simpleEffectNames[counter]) * transcendenceTierModifier;
			}
			self.effectsPreDeficit["deficitRecoveryRatio"] = game.getEffect("pactDeficitRecoveryRatio");
			var pactBlackLibraryBoost = game.getEffect("pactBlackLibraryBoost") * transcendenceTierModifier;
			if (pactBlackLibraryBoost) {
				var unicornGraveyard = game.religion.getZU("unicornGraveyard");
				self.effectsPreDeficit["blackLibraryBonus"] = pactBlackLibraryBoost * unicornGraveyard.effects["blackLibraryBonus"] * (1 + unicornGraveyard.on);
			}
		},
		updateEffects: function(self, game){
			if (!self.jammed){
				self.cashPreDeficitEffects(game);
				self.jammed = true;
			}
			self.effects["deficitRecoveryRatio"] = self.effectsPreDeficit["deficitRecoveryRatio"];
			//applying deficit
			var deficiteModifier = game.religion.pactsManager.getDebtPenaltyRatio();
			var existsDifference = false;
			//console.warn(deficiteModifier);
			for (var name in self.effectsPreDeficit){
				if (name != "deficitRecoveryRatio"){
					var old = self.effects[name];
					self.effects[name] = self.effectsPreDeficit[name] * deficiteModifier;
					if (self.effects[name] != old){
						existsDifference = true;
					}
				}
			}
			if (existsDifference) {
				game.upgrade(self.upgrades);
			}
		},
		unlocked: false,
		flavor: $I("religion.zu.blackPyramid.flavor"),
		getEffectiveValue: function(game) {
			return this.val + (game.challenges.getChallenge("blackSky").researched && !game.challenges.isActive("blackSky") ? 1 : 0);
		}
	}],

	religionUpgrades:[{
		name: "solarchant",
		label: $I("religion.ru.solarchant.label"),
		description: $I("religion.ru.solarchant.desc"),
		prices: [
			{ name : "faith", val: 100 }
		],
		faith: 150,	//total faith required to unlock the upgrade
		effects: {
			"faithRatioReligion" : 0.1
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "scholasticism",
		label: $I("religion.ru.scholasticism.label"),
		description: $I("religion.ru.scholasticism.desc"),
		prices: [
			{ name : "faith", val: 250 }
		],
		faith: 300,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "goldenSpire",
		label: $I("religion.ru.goldenSpire.label"),
		description: $I("religion.ru.goldenSpire.desc"),
		prices: [
			{ name : "gold",  val: 150 },
			{ name : "faith", val: 350 }
		],
		faith: 500,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5,
		flavor: $I("religion.ru.goldenSpire.flavor")
	},{
		name: "sunAltar",
		label: $I("religion.ru.sunAltar.label"),
		description: $I("religion.ru.sunAltar.desc"),
		prices: [
			{ name : "gold",  val: 250 },
			{ name : "faith", val: 500 }
		],
		faith: 750,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "stainedGlass",
		label: $I("religion.ru.stainedGlass.label"),
		description: $I("religion.ru.stainedGlass.desc"),
		prices: [
			{ name : "gold",  val: 250 },
			{ name : "faith", val: 500 }
		],
		faith: 750,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "solarRevolution",
		label: $I("religion.ru.solarRevolution.label"),
		description: $I("religion.ru.solarRevolution.desc"),
		prices: [
			{ name : "gold",  val: 500 },
			{ name : "faith", val: 750 }
		],
		faith: 1000,
		effects: {
			"solarRevolutionRatio": 0
		},
		calculateEffects: function(self, game) {
			self.effects["solarRevolutionRatio"] = game.religion.getSolarRevolutionRatio();
		},
		noStackable: true
	},{
		name: "basilica",
		label: $I("religion.ru.basilica.label"),
		description: $I("religion.ru.basilica.desc"),
		prices: [
			{ name : "gold",  val: 750 },
			{ name : "faith", val: 1250 }
		],
		faith: 10000,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "templars",
		label: $I("religion.ru.templars.label"),
		description: $I("religion.ru.templars.desc"),
		prices: [
			{ name : "gold",  val: 3000 },
			{ name : "faith", val: 3500 }
		],
		faith: 75000,
		effects: {
			//none
		},
		upgrades: {
			buildings: ["temple", "ziggurat"]
		},
		calculateEffects: function(self, game) {
			self.noStackable = (game.religion.getRU("transcendence").on == 0);
		},
		noStackable: true,
		priceRatio: 2.5
	},{
		name: "apocripha",
		label: $I("religion.ru.apocripha.label"),
		description: $I("religion.ru.apocripha.desc"),
		prices: [
			{ name : "gold",  val: 5000 },
			{ name : "faith", val: 5000 }
		],
		faith: 100000,
		effects: {
			//none
		},
		noStackable: true
	},{
		name: "transcendence",
		label: $I("religion.ru.transcendence.label"),
		description: $I("religion.ru.transcendence.desc"),
		prices: [
			{ name : "gold",  val: 7500 },
			{ name : "faith", val: 7500 }
		],
		faith: 125000,
		effects: {
			//none
		},
		upgrades: {
			religion: ["solarchant", "scholasticism", "goldenSpire", "sunAltar", "stainedGlass", "basilica", "templars"]
		},
		noStackable: true
	}],

	transcendenceUpgrades: [
	{
		name: "blackObelisk",
		label: $I("religion.tu.blackObelisk.label"),
		description: $I("religion.tu.blackObelisk.desc"),
		prices: [
			{ name : "relic", val: 100 }
		],
		tier: 1,
		priceRatio: 1.15,
		effects: {
			"solarRevolutionLimit": 0.05
		},
		calculateEffects: function(self, game) {
			self.effects["solarRevolutionLimit"] = 0.05 * game.religion.transcendenceTier;
		},
		unlocked: false,
		flavor: $I("religion.tu.blackObelisk.flavor")
	},{
		name: "blackNexus",
		label: $I("religion.tu.blackNexus.label"),
		description: $I("religion.tu.blackNexus.desc"),
		prices: [
			{ name : "relic", val: 5000 }
		],
		tier: 3,
		priceRatio: 1.15,
		effects: {
			"relicRefineRatio" : 1.0
		},
		upgrades: {
			spaceBuilding: ["spaceBeacon"]
		},
		unlocked: false,
		flavor: $I("religion.tu.blackNexus.flavor")
	},{
		name: "blackCore",
		label: $I("religion.tu.blackCore.label"),
		description: $I("religion.tu.blackCore.desc"),
		prices: [
			{ name : "relic", val: 10000 }
		],
		tier: 5,
		priceRatio: 1.15,
		effects: {
			"blsLimit" : 1
		},
		unlocked: false,
		flavor: $I("religion.tu.blackCore.flavor")
	},{
		name: "singularity",
		label: $I("religion.tu.singularity.label"),
		description: $I("religion.tu.singularity.desc"),
		prices: [
			{ name : "relic", val: 25000 }
		],
		tier: 7,
		priceRatio: 1.15,
		effects: {
			"globalResourceRatio" : 0.10
		},
		unlocked: false,
		flavor: $I("religion.tu.singularity.flavor")
	},{
		name: "blackLibrary",
		label: $I("religion.tu.blackLibrary.label"),
		description: $I("religion.tu.blackLibrary.desc"),
		prices: [
			{ name : "relic", val: 30000 }
		],
		tier: 9,
		priceRatio: 1.15,
		effects: {
			"compendiaTTBoostRatio" : 0.02
		},
		unlocked: false,
		flavor: $I("religion.tu.blackLibrary.flavor")
	},{
		name: "blackRadiance",
		label: $I("religion.tu.blackRadiance.label"),
		description: $I("religion.tu.blackRadiance.desc"),
		prices: [
			{ name : "relic", val: 37500 }
		],
		tier: 12,
		priceRatio: 1.15,
		effects: {
			"blsCorruptionRatio" : 0.0012
		},
		unlocked: false,
		flavor: $I("religion.tu.blackRadiance.flavor")
	},{
		name: "blazar",
		label: $I("religion.tu.blazar.label"),
		description: $I("religion.tu.blazar.desc"),
		prices: [
			{ name : "relic", val: 50000 }
		],
		tier: 15,
		priceRatio: 1.15,
		effects: {
			//Should at least improve impedance scaling by some value (5%? 10%). Probably something else
			"timeRatio" : 0.10,
			"rrRatio" : 0.02
		},
		upgrades: {
			chronoforge: ["temporalImpedance", "temporalPress"]
		},
		unlocks: {
			chronoforge: ["temporalPress"]
		},
		unlocked: false,
		flavor: $I("religion.tu.blazar.flavor")
	},{
		name: "darkNova",
		label: $I("religion.tu.darkNova.label"),
		description: $I("religion.tu.darkNova.desc"),
		prices: [
			{ name : "relic", val: 75000 },
			{ name : "void",  val: 7500 }
		],
		tier: 20,
		priceRatio: 1.15,
		effects: {
			"energyProductionRatio": 0.02
		},
		unlocked: false,
		flavor: $I("religion.tu.darkNova.flavor")
	},
		//pacts can go to the TT23
	{
		name: "mausoleum",
		label: $I("religion.tu.mausoleum.label"),
		description: $I("religion.tu.mausoleum.desc"),
		tier: 23,
		priceRatio: 1.15,
		prices: [
			{ name : "relic", val: 50000 },
			{ name : "void", val: 12500 },
			{ name: "necrocorn", val: 10}
		],
		effects: {
			"pactsAvailable": 1
		},
		upgrades: {
			pacts: ["fractured"],
			policies: ["feedingFrenzy"]
		},
		unlocked: false,
		unlocks: {
			pacts: ["pactOfCleansing", "pactOfDestruction",  "pactOfExtermination", "pactOfPurity"],
			policies: ["siphoning", "feedingFrenzy", "upfrontPayment"]
		},
		calculateEffects: function (self, game){
			if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
				self.effects["pactsAvailable"] = 0;
				self.unlocked = false;
				game.updateCaches();
				return;
			}
			self.effects = {
				"pactsAvailable": 1 + game.getEffect("mausoleumBonus")
			};
			if (game.religion.getPact("fractured").on >= 1){
				self.effects["pactsAvailable"] = 0;
			}
			game.updateCaches();
		},
		evaluateLocks: function(game){
			return game.getFeatureFlag("MAUSOLEUM_PACTS");
		}
		//flavor: $I("religion.tu.mausoleum.flavor")
	},
	{
		name: "holyGenocide",
		label: $I("religion.tu.holyGenocide.label"),
		description: $I("religion.tu.holyGenocide.desc"),
		prices: [
			{ name : "relic", val: 100000 },
			{ name : "void", val: 25000 }
		],
		tier: 25,
		priceRatio: 1.15,
		effects: {
			"maxKittensRatio": -0.01,
			"simScalingRatio": 0.02,
			"activeHG": 0
		},
		unlocked: false,
		unlocks: {
			challenges: ["postApocalypse"]
		},
		calculateEffects: function(self, game){
			self.effects["activeHG"] = game.religion.activeHolyGenocide;
		},
		togglable: true,
		flavor: $I("religion.tu.holyGenocide.flavor")
	},
		//Holy Memecide
	],
	necrocornDeficitPunishment: function(){
		for (var kitten in this.game.village.sim.kittens){
			var skills = this.game.village.sim.kittens[kitten].skills;
			for (var job in skills){
				skills[job] = 0;
			}
		}
		this.game.religion.getPact("fractured").on = 1;
		this.game.religion.getPact("fractured").val = 1;
		this.game.upgrade(
			{
				transcendenceUpgrades:["mausoleum"],
				policies:["radicalXenophobia", "feedingFrenzy"],
				pacts:["fractured"]
			}
		);
		//this.game.religion.getPact("fractured").calculateEffects(this.game.religion.getPact("fractured"), this.game);
		this.game.religion.necrocornDeficit = 0;
		this.game.msg($I("msg.pacts.fractured", [Math.round(100 * this.game.resPool.get("alicorn").value)/100]),"alert", "ai");
		this.game.resPool.get("alicorn").value = 0;
		var blackPyramid = this.game.religion.getZU("blackPyramid");
		for (var i in blackPyramid.effectsPreDeficit){
			blackPyramid.effectsPreDeficit[i] = 0;
		}
		this.game.religion.getZU("blackPyramid").updateEffects(this.game.religion.getZU("blackPyramid"), this.game);
	},


	effectsBase: {
		"kittensKarmaPerMinneliaRatio" : 0.0001, //unspent pacts can make karma
		"pactNecrocornConsumption" : -0.0005
	},

	getZU: function(name){
		return this.getMeta(name, this.zigguratUpgrades);
	},

	getRU: function(name){
		return this.getMeta(name, this.religionUpgrades);
	},

	getTU: function(name){
		return this.getMeta(name, this.transcendenceUpgrades);
	},
	getPact: function(name){
		return this.getMeta(name, this.pactsManager.pacts);
	},
	getSolarRevolutionRatio: function() {
		var uncappedBonus = this.getRU("solarRevolution").on ? this.game.getUnlimitedDR(this.faith, 1000) / 100 : 0;
		return this.game.getLimitedDR(uncappedBonus, 10 + this.game.getEffect("solarRevolutionLimit") + (this.game.challenges.getChallenge("atheism").researched ? (this.game.religion.transcendenceTier) : 0)) * (1 + this.game.getEffect("faithSolarRevolutionBoost")/*(LDR specified in challenges.js)*/);
	},

	getApocryphaBonus: function(){
		return this.game.getUnlimitedDR(this.faithRatio, 0.1) * 0.1;
	},

	getHGScalingBonus: function(){
		//TODO: test this
		var scalingRatio = this.game.getEffect("simScalingRatio");
		if (!scalingRatio /*|| !this.game.village.maxKittensRatioApplied*/){
			return 1;
		}

		return (1 /
			(
				(1 + this.game.getLimitedDR(this.game.getEffect("maxKittensRatio"), 1))
			)
		) *(1 + scalingRatio);
	},

	turnHGOff: function(){
		var self = this;
		this.game.ui.confirm("", $I("turnHGOff.confirmation.msg"), function() {
			self.activeHolyGenocide = 0;
			self.getTU("holyGenocide").on = 0;
		});
	},

	praise: function(){
		var faith = this.game.resPool.get("faith");
		var worshipGainedAmt = faith.value * (1 + this.getApocryphaBonus()); //starting up from 100% ratio will work surprisingly bad
		this.faith += worshipGainedAmt;
		this.faith = Math.min(this.faith, Number.MAX_VALUE);
		this.game.msg($I("religion.praise.msg", [this.game.getDisplayValueExt(faith.value, false, false, 0)]), "", "faith");
		//Here we go, trying to make more game actions reversible
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.id, {
			action: "praise",
			faithSpent: faith.value,
			worshipGained: worshipGainedAmt
		}, $I("ui.undo.religion.praise", [this.game.getDisplayValueExt(worshipGainedAmt)]));
		faith.value = 0.0001;	//have a nice autoclicking
	},

	getApocryphaResetBonus: function(bonusRatio){
		//100% Bonus per Transcendence Level
		if (this.getRU("transcendence").on) {
			bonusRatio *= Math.pow((1 + this.transcendenceTier), 2);
		}
		return (this.faith / 100000) * 0.1 * bonusRatio;
	},


	resetFaith: function(bonusRatio, withConfirmation) {
		var worshipBefore = this.faith;
		var epiphanyBefore = this.faithRatio;
		if (withConfirmation && !this.game.opts.noConfirm) {
			var self = this;
			this.game.ui.confirm("", $I("religion.adore.confirmation.msg"), function() {
				self._resetFaithInternal(bonusRatio);
			});
		} else {
			this._resetFaithInternal(bonusRatio);
		}
		var worshipAfter = this.faith;
		var epiphanyAfter = this.faithRatio;

		//Here we go, trying to make more game actions reversible
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.id, {
			action: "adore",
			worshipBefore: worshipBefore,
			epiphanyGained: epiphanyAfter - epiphanyBefore
		}, $I("ui.undo.religion.adore"));
	},

	_resetFaithInternal: function(bonusRatio) {
		var ttPlus1 = (this.game.religion.getRU("transcendence").on ? this.game.religion.transcendenceTier : 0) + 1;
		this.faithRatio += this.faith / 1000000 * ttPlus1 * ttPlus1 * bonusRatio;
		this.faithRatio = Math.min(this.faithRatio, Number.MAX_VALUE);
		this.faith = 0.01;
	},

	transcend: function(){
		var religion = this.game.religion;
		if (!religion.getRU("transcendence").on) {
			return; // :3
		}

		var game = this.game;
		game.ui.confirm($I("religion.transcend.confirmation.title"), $I("religion.transcend.confirmation.msg"), function() {
			//Transcend one Level at a time
			var needNextLevel = religion._getTranscendNextPrice();

			if (religion.faithRatio > needNextLevel) {
				religion.faithRatio -= needNextLevel;
				religion.tcratio += needNextLevel;
				religion.transcendenceTier += 1;

				//In the future, we might add more things that care about Transcendence Tier.
				game.calculateAllEffects();
				if (game.getFeatureFlag("MAUSOLEUM_PACTS") && game.religion.getTU("mausoleum").val){
					var blackPyramid = game.religion.getZU("blackPyramid");
					blackPyramid.cashPreDeficitEffects(game);
				}
				game.msg($I("religion.transcend.msg.success", [religion.transcendenceTier]));
			} else {
				game.msg($I("religion.transcend.msg.failure", [
					game.toDisplayPercentage(religion.faithRatio / needNextLevel, 2, true)
				]));
			}
		});
	},

	_getTranscendTotalPrice: function(tier) {
		return this.game.getInverseUnlimitedDR(Math.exp(tier) / 10, 0.1);
	},

	_getTranscendNextPrice: function() {
		return this._getTranscendTotalPrice(this.transcendenceTier + 1) - this._getTranscendTotalPrice(this.transcendenceTier);
	},

	unlockAll: function(){
		for (var i in this.religionUpgrades){
			this.religionUpgrades[i].unlocked = true;
			this.religionUpgrades[i].researched = true;
		}

		for (var i in this.zigguratUpgrades){
			this.zigguratUpgrades[i].unlocked = true;
		}

		for (var i in this.transcendenceUpgrades){
			this.transcendenceUpgrades[i].unlocked = true;
		}

		for (var i in this.pacts){
			this.pacts[i].unlocked = true;
		}

		this.faith = 1000000;
		this.transcendenceTier = 25;

		this.game.msg("All religion upgrades are unlocked!");
	},

	undo: function(data){
		var resPool = this.game.resPool;
		if (data.action == "refine"){
			/*
			  undo.addEvent(this.game.religion.id, {
				action:"refine",
				resFrom: model.prices[0].name,
				resTo: this.controllerOpts.gainedResource,
				valFrom: priceCount,
				valTo: actualGainCount
			*/
			var resConverted = resPool.get(data.resTo);
			/*
				if you still have refined resources, roll them back
				of course the correct way would be to call addResEvent(data.resTo, -data.valTo), 
				find out actual remaining value
				and refund it proportionally, but I am to lazy to code it in 
			*/
			if (resConverted.value >= data.valTo) {
				var actualAmountRecovered = resPool.addResEvent(data.resFrom, data.valFrom);
				resPool.addResEvent(data.resTo, -data.valTo);
				var resRefunded = resPool.get(data.resFrom);
				if (actualAmountRecovered == data.valFrom) {
					//I dunno about this--this message contains no new information that isn't already displayed.
					//this.game.msg($I("religion.undo.refine.complete", [this.game.getDisplayValueExt(actualAmountRecovered), (resRefunded.title || resRefunded.name)]), null, "undo", true /*noBullet*/);
				} else {
					//This would occur, for instance, if the player un-sacrificed unicorns during a Unicorn Tears Challenge.
					this.game.msg($I("religion.undo.refine.incomplete", [this.game.getDisplayValueExt(actualAmountRecovered), (resRefunded.title || resRefunded.name)]), "important", "undo", true /*noBullet*/);
				}
			}
		} else if (data.action === "praise") {
			if (this.faith >= data.worshipGained) {
				this.faith -= data.worshipGained;
				var amtRecovered = resPool.addResEvent("faith", data.faithSpent);
				if (amtRecovered > 0) {
					this.game.msg($I("religion.undo.praise.regained", [this.game.getDisplayValueExt(amtRecovered)]), null, "undo", true /*noBullet*/);
				} else {
					//This would happen, for example, if the player had such high faith production that it was capped already
					this.game.msg($I("religion.undo.praise.nogain"), "important", "undo", true /*noBullet*/);
				}
			} else {
				//This would happen, for example, if the player had adored the galaxy immediately after praising.
				this.game.msg($I("religion.undo.praise.failure"), "alert", "undo", true /*noBullet*/);
			}
		} else if (data.action === "adore") {
			if (this.faithRatio >= data.epiphanyGained) {
				this.faithRatio -= data.epiphanyGained;
				this.faith = data.worshipBefore;
				this.game.msg($I("religion.undo.adore.regained", [this.game.getDisplayValueExt(data.worshipBefore)]), null, "undo", true /*noBullet*/);
			} else {
				//This would happen, for example, if the player had transcended immediately after adoring the galaxy.
				this.game.msg($I("religion.undo.adore.failure"), "alert", "undo", true /*noBullet*/);
			}
		} else if (data.action === "buildZU") {
			//This process requires 2 things: the controller & the model.
			var bld = this.getZU(data.metaId);
			var props = { //Essential for obtaining the model correctly.
				id:            bld.name,
				name:           bld.label,
				description:    bld.description,
				building:       bld.name
			};
			props.controller = new com.nuclearunicorn.game.ui.ZigguratBtnController(this.game);
			var model = props.controller.fetchModel(props); //We need the model to actually change the data of the building
			model.refundPercentage = 1.0;	//full refund for undo
			props.controller.sellInternal(model, model.metadata.val - data.val, false /*requireSellLink*/);
		} else if (data.action === "buildRU") {
			var bld = this.getRU(data.metaId);
			var props = {
				id:            bld.name,
				name:           bld.label,
				description:    bld.description,
				building:       bld.name
			};
			props.controller = new com.nuclearunicorn.game.ui.ReligionBtnController(this.game);
			var model = props.controller.fetchModel(props);
			model.refundPercentage = 1.0;	//full refund for undo
			props.controller.sellInternal(model, model.metadata.val - data.val, false /*requireSellLink*/);
		} else if (data.action === "sellRU") {
			var bld = this.getRU(data.metaId);
			var props = {
				id:            bld.name,
				name:           bld.label,
				description:    bld.description,
				building:       bld.name
			};
			props.controller = new com.nuclearunicorn.game.ui.ReligionBtnController(this.game);
			var model = props.controller.fetchModel(props);

			//The meat of the function: un-sell the buildings.
			//Since buildings are sold for a 50% refund, we need to un-refund everything
			for (var i = 0; i < data.val; i += 1) {
				props.controller.incrementValue(model);
				props.controller.payPriceForUndoRefund(model);
			}
			this.game.render();
		} else if (data.action === "buyPact") {
			if (this.getPact("fractured").on) { //should fail if fractured
				this.game.msg($I("religion.undo.buy.pact.fractured"), "alert", "undo", true /*noBullet*/);
			} else {
				var pact = this.getPact(data.metaId);
				var props = {
					id:            pact.name,
					name:           pact.label,
					description:    pact.description,
					building:       pact.name
				};
				props.controller = new com.nuclearunicorn.game.ui.PactsBtnController(this.game);
				var model = props.controller.fetchModel(props);
				model.refundPercentage = 1.0;	//full refund for undo
				props.controller.sellInternal(model, model.metadata.val - data.val, false /*requireSellLink*/);

				//Un-incur necrocorn debt:
				if (!model.metadata.notAddDeficit && this.game.getEffect("pactNecrocornUpfrontCost") <= 0) {
					//(Necrocorn debt is not incurred if "pactNecrocornUpfrontCost" is positive)
					this.pactsManager.necrocornDeficit = Math.max(this.pactsManager.necrocornDeficit - 0.5 * data.val, 0);
				}
				//Update effects:
				if (model.metadata.updatePreDeficitEffects){
					model.metadata.updatePreDeficitEffects(this.game);
				}
				if (!model.metadata.special){
					this.game.upgrade({
						policies: ["feedingFrenzy"],
						pacts: ["payDebt"]
					});
				}
				this.getZU("blackPyramid").jammed = false;
			}
		}
		this.game.render();
	}
});

/**
 * A button for ziggurat upgrade
 */
dojo.declare("com.nuclearunicorn.game.ui.ZigguratBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = false;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getZU(model.options.id);
        }
        return model.metaCached;
    },

    getName: function(model){
		if (model.metadata.name == "marker" && model.metadata.val > 0){
			var progress = this.game.toDisplayPercentage(this.game.religion.corruption, 0, true);
			return model.metadata.label + " [" + progress + "%] (" + model.metadata.val + ")";
		} else {
			return this.inherited(arguments);
		}
	},

	//zigguratIvoryPriceRatio applies an additive modifier to the price ratio, but only for ivory
	//zigguratIvoryCostIncrease applies a multiplicative modifier to the base price, but only for ivory
	getPrices: function(model) {
		var meta = model.metadata;
		var ratio = meta.priceRatio || 1;
		var ivoryRatio = Math.max(ratio + this.game.getEffect("zigguratIvoryPriceRatio"), 1);
		var prices = [];
		var pricesDiscount = this.game.getLimitedDR((this.game.getEffect(meta.name + "CostReduction")), 1);
		var priceModifier = 1 - pricesDiscount;

		for (var i = 0; i < meta.prices.length; i++){
			var resPriceDiscount = this.game.getEffect(meta.prices[i].name + "CostReduction");
			resPriceDiscount = this.game.getLimitedDR(resPriceDiscount, 1);
			var resPriceModifier = 1 - resPriceDiscount;
			if (meta.prices[i].name == "ivory") {
				resPriceModifier *= 1 + this.game.getEffect("zigguratIvoryCostIncrease");
			}
			var ratioToUse = meta.prices[i].name == "ivory" ? ivoryRatio : ratio;

			prices.push({
				val: meta.prices[i].val * Math.pow(ratioToUse, meta.val) * resPriceModifier * priceModifier,
				name: meta.prices[i].name
			});
		}
		return prices;
	},

	build: function(model, opts) {
		var counter = this.inherited(arguments);
		if (!counter) {
			return; //Skip undo if nothing was built
		}
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.game.religion.id, {
			action: "buildZU",
			metaId: model.metadata.name,
			val: counter
		}, $I("ui.undo.bld.build", [counter, model.metadata.label]));
	}
});


/**
 * A button for religion upgrade
 */
dojo.declare("com.nuclearunicorn.game.ui.ReligionBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = false;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getRU(model.options.id);
        }
        return model.metaCached;
    },

    hasSellLink: function(model){
		return !this.game.opts.hideSell && !model.metadata.noStackable && model.metadata.val > 1;
	},

	getPrices: function(model){
		var defaultPrices = this.inherited(arguments);
		for (var i = 0; i < defaultPrices.length; i++) {
			if (defaultPrices[i].name == "faith" || defaultPrices[i].name == "gold") {
				defaultPrices[i].val = defaultPrices[i].val * (1 + this.game.getEffect("religionUpgradesDiscount"));
			}
		}
		return this.game.village.getEffectLeader("wise", defaultPrices);
	},

	updateVisible: function(model){
		model.visible = model.metadata.on > 0 || this.game.religion.faith >= model.metadata.faith;
	},

	build: function(model, opts) {
		var counter = this.inherited(arguments);
		if (!counter) {
			return; //Skip undo if nothing was built
		}
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.game.religion.id, {
			action: "buildRU",
			metaId: model.metadata.name,
			val: counter
		}, $I("ui.undo.bld.build", [counter, model.metadata.label]));
	},

	sell: function(event, model){
		var amtSold = this.inherited(arguments);

		if (amtSold > 0) {
			var undo = this.game.registerUndoChange();
			undo.addEvent(this.game.religion.id, {
				action: "sellRU",
				metaId: model.metadata.name,
				val: amtSold
			}, $I("ui.undo.bld.sell", [amtSold, model.metadata.label]));
		}
	},
});


dojo.declare("classes.ui.TranscendenceBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = false;
		return result;
	},

    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getTU(model.options.id);
        }
        return model.metaCached;
    }
});

dojo.declare("com.nuclearunicorn.game.ui.PraiseBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		if (this.game.religion.faithRatio > 0){
			var progressDisplayed = this.game.getDisplayValueExt(this.game.religion.getApocryphaBonus() * 100, true, false, 3);
			return "<div class=\"label\"><span class=\"label-content\">" + model.options.name + "</span></div><div class=\"progress\">[" + progressDisplayed + "%]</div>";
		} else {
			return model.options.name;
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.ResetFaithBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		var ttPlus1 = this.game.religion.transcendenceTier + 1;
		return model.options.name + (this.game.religion.getRU("transcendence").on ? " [×" + (ttPlus1 * ttPlus1) + "]" : "");
	},

	updateVisible: function (model) {
		model.visible = this.game.religion.getRU("apocripha").on;
	}
});

dojo.declare("com.nuclearunicorn.game.ui.TranscendBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	getName: function(model) {
		return model.options.name + (this.game.religion.transcendenceTier > 0 ? " [" + this.game.religion.transcendenceTier + "]" : "");
	},

	updateEnabled: function(model) {
		model.enabled = this.game.religion._getTranscendNextPrice() < Infinity;
		model.highlightUnavailable = this.game.opts.highlightUnavailable;
		model.resourceIsLimited = model.highlightUnavailable && !model.enabled;
	},

	updateVisible: function (model) {
		model.visible = this.game.religion.getRU("transcendence").on;
	}
});

dojo.declare("classes.ui.religion.TransformBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.hasResourceHover = true;
		result.simplePrices = false;
		return result;
	},

	fetchModel: function(options) {
		var model = this.inherited(arguments);
		model.fifthLink = this._newLink(model, 5);
		model.halfLink = this._newLink(model, 2);
		model.allLink = this._newLink(model, 1);
		return model;
	},

	_newLink: function(model, divider) {
		var transformations = Math.floor(this._canAfford(model) / divider);
		var self = this;
		return {
			visible: this.game.opts.showNonApplicableButtons || transformations > 1,
			title: divider == 1
				? $I("religion.sacrificeBtn.all")
				: this.game.opts.usePercentageConsumptionValues
					? (100 / divider) + "%"
					: "x" + this.game.getDisplayValueExt(transformations, null, false, 0),
			tooltip:  divider == 1 || this.game.opts.usePercentageConsumptionValues ? "x" + this.game.getDisplayValueExt(transformations, null, false, 0) : (100 / divider) + "%",
			handler: function(event, callback) {
				self.transform(model, divider, event, callback);
			}
		};
	},

	buyItem: function(model, event) {
		if (!this.hasResources(model)) {
			return {
				itemBought: false,
				reason: "cannot-afford"
			};
		}
		if (!model.enabled) {
			//As far as I can tell, this shouldn't ever happen because being
			//unable to afford it is the only reason for it to be disabled.
			return {
				itemBought: false,
				reason: "not-enabled"
			};
		}
		if (!event) { event = {}; /*event is an optional parameter*/ }
		var batchSize = event.shiftKey ? 10000 :
			event.ctrlKey || event.metaKey ? this.game.opts.batchSize : 1;
		var didWeSucceed = this._transform(model, batchSize);
		if (didWeSucceed) {
			return {
				itemBought: true,
				reason: "paid-for"
			};
		} else {
			//_transform(model, amt) returns false if we can't afford it
			return {
				itemBought: false,
				reason: "cannot-afford"
			};
		}
	},

	//Calculates the max number of transformations the player can afford to do.
	//If the resource has a storage cap (such as during a Unicorn Tears Challenge),
	//it won't give the option to go farther than 1 transformation above that cap.
	_canAfford: function(model) {
		var spendRes = this.game.resPool.get(model.prices[0].name);
		var gainRes = this.game.resPool.get(this.controllerOpts.gainedResource);
		var amtWeCanAfford = Math.floor(spendRes.value / model.prices[0].val);

		if (gainRes.maxValue && amtWeCanAfford > 1) { //Perform this check only if we can afford 2 or more
			var amtToReachCap = Math.ceil((gainRes.maxValue - gainRes.value) / this.controllerOpts.gainMultiplier.call(this));
			amtWeCanAfford = Math.min(amtWeCanAfford, amtToReachCap);
			//But don't go below 1 so we always give the player the option to sacrifice 1
			amtWeCanAfford = Math.max(1, amtWeCanAfford);
		}
		return amtWeCanAfford;
	},

	transform: function(model, divider, event, callback) {
		var amt = Math.floor(this._canAfford(model) / divider);
		if (amt < 1) {
			callback(false /*itemBought*/, { reason: "cannot-afford" });
			return;
		}
		var didWeSucceed = this._transform(model, amt);
		if (didWeSucceed) {
			callback(true /*itemBought*/, { reason: "paid-for" });
		} else {
			//_transform(model, amt) returns false if we can't afford it
			callback(false /*itemBought*/, { reason: "cannot-afford" });
		}
	},

	_transform: function(model, amt) {
		//Save references to values we'll use a lot:
		// "res from" refers to the resource consumed by the transform action
		// "res to" refers to the resource produced by the transform action
		var resFromName = model.prices[0].name;
		var resToName = this.controllerOpts.gainedResource;
		var resFromObj = this.game.resPool.get(resFromName); //Reference to the resource object
		var resToObj = this.game.resPool.get(resToName);

		var priceCount = model.prices[0].val * amt;
		if (priceCount > resFromObj.value) {
			return false;
		}

		var attemptedGainCount = this.controllerOpts.gainMultiplier.call(this) * amt;

		this.game.resPool.addResEvent(resFromName, -priceCount);

		//Gain the resource & remember the amount we gained, taking into account resource storage limits:
		var actualGainCount = this.game.resPool.addResEvent(resToName, attemptedGainCount);

		//Amount of the resource we failed to gain because we hit the cap:
		var overcap = attemptedGainCount - actualGainCount;
		if (actualGainCount == 0 && attemptedGainCount > 0 &&
			resToObj.value / attemptedGainCount > 1e15) {
			//We are in territory where overcap will be triggered due to floating-point precision limits.
			overcap = 0;
		}

		if (this.controllerOpts.applyAtGain) {
			this.controllerOpts.applyAtGain.call(this, priceCount);
		}

		if (overcap > 0.001) { //Don't trigger from floating-point errors
			if (resToName == "tears") {
				//Tears evaporate into a smoky substance
				this.game.bld.cathPollution += overcap * this.game.getEffect("cathPollutionPerTearOvercapped");
			}
			//Optional parameter to display a message when we overcap:
			if (typeof(this.controllerOpts.overcapMsgID) === "string") {
				this.game.msg($I(this.controllerOpts.overcapMsgID, [this.game.getDisplayValueExt(overcap)]), "", this.controllerOpts.logfilterID, true /*noBullet*/);
			}
		}

		var descriptiveStrings = [this.game.getDisplayValueExt(priceCount),
			resFromObj.title,
			this.game.getDisplayValueExt(actualGainCount),
			resToObj.title];
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.game.religion.id, {
			action:"refine",
			resFrom: resFromName,
			resTo: resToName,
			valFrom: priceCount,
			valTo: actualGainCount
		}, $I("ui.undo.religion.refine", descriptiveStrings));

		this.game.msg($I(this.controllerOpts.logTextID, [this.game.getDisplayValueExt(priceCount), this.game.getDisplayValueExt(actualGainCount)]), "", this.controllerOpts.logfilterID);

		return true;
	}
});

dojo.declare("classes.ui.religion.MultiLinkBtn", com.nuclearunicorn.game.ui.ButtonModern, {
	renderLinks: function() {
		this.all = this.addLink(this.model.allLink);
		this.half = this.addLink(this.model.halfLink);
		this.fifth = this.addLink(this.model.fifthLink);
	},

	update: function() {
		this.inherited(arguments);
		this.updateLink(this.fifth, this.model.fifthLink);
		this.updateLink(this.half, this.model.halfLink);
		this.updateLink(this.all, this.model.allLink);
	}
});

dojo.declare("classes.ui.religion.RefineTearsBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	defaults: function() {
		var result = this.inherited(arguments);

		result.hasResourceHover = true;
		return result;
	},

	fetchModel: function (options) {
		var model = this.inherited(arguments);
		model.fiveLink = this._newLink(model, 5);
		model.twentyFiveLink = this._newLink(model, 25);
		model.hundredLink = this._newLink(model, 100);
		return model;
	},

	_newLink: function (model, count) {
		var self = this;
		return {
			visible: this.game.opts.showNonApplicableButtons
				|| this.game.resPool.get("sorrow").value <= this.game.resPool.get("sorrow").maxValue - count
				&& self._canAfford(model, count) >= count,
			title: "x" + count,
			handler: function (event) {
				self.buyItem(model, null, count);
				this.update();
			}
		};
	},

	_canAfford: function(model, count) {
		return Math.floor(this.game.resPool.get(model.prices[0].name).value / model.prices[0].val);
	},

	buyItem: function(model, event, count){
		if (!this.hasResources(model)) {
			return {
				itemBought: false,
				reason: "cannot-afford"
			};
		}
		if (!model.enabled) {
			//As far as I can tell, this shouldn't ever happen because being
			//unable to afford it is the only reason for it to be disabled.
			return {
				itemBought: false,
				reason: "not-enabled"
			};
		}
		if (this.game.resPool.get("sorrow").value >= this.game.resPool.get("sorrow").maxValue){
			//We can't refine because we're at the limit.
			this.game.msg($I("religion.refineTearsBtn.refine.msg.failure"));
			return {
				itemBought: false,
				reason: "already-bought"
			};
		}
		if (!event) { event = {}; /*event is an optional parameter*/ }
		var amtRefined = 0;
		var sorrowObj = this.game.resPool.get("sorrow");
		for (var batchSize = count || (event.ctrlKey ? this.game.opts.batchSize : 1);
			 batchSize > 0
			 && this.hasResources(model)
			 && sorrowObj.value < sorrowObj.maxValue;
			 batchSize--) {
			this.payPrice(model);
			this.refine();
			amtRefined++;
		}
		var priceCount = model.prices[0].val * amtRefined;
		var priceName = model.prices[0].name;
		var descriptiveStrings = [this.game.getDisplayValueExt(priceCount),
			this.game.resPool.get(priceName).title,
			this.game.getDisplayValueExt(amtRefined),
			sorrowObj.title];
		var undo = this.game.registerUndoChange();
		undo.addEvent(this.game.religion.id, {
			action: "refine",
			resFrom: priceName,
			resTo:  sorrowObj.name,
			valFrom: priceCount,
			valTo: amtRefined
		}, $I("ui.undo.religion.refine", descriptiveStrings));
		return {
			itemBought: true,
			reason: "paid-for"
		};
	},

	refine: function(){
		this.game.resPool.get("sorrow").value++; //resPool.update() force below maxValue
	}
});

dojo.declare("classes.ui.CryptotheologyWGT", [mixin.IChildrenAware, mixin.IGameAware], {
	constructor: function(game){
		var self = this;
		var controller = classes.ui.TranscendenceBtnController(game);
		dojo.forEach(game.religion.transcendenceUpgrades, function(tu, i){
			var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
				id: 		tu.name,
				name: 		tu.label,
				description: tu.description,
				controller: controller
			}, game);
			self.addChild(button);
		});
	},

	render: function(container){
		var div = dojo.create("div", null, container);
		var btnsContainer = dojo.create("div", null, div);
		this.inherited(arguments, [btnsContainer]);
	},

	update: function(){
		this.inherited(arguments);
	}
});

dojo.declare("classes.ui.CryptotheologyPanel", com.nuclearunicorn.game.ui.Panel, {
	visible: false,
});

dojo.declare("classes.ui.PactsWGT", [mixin.IChildrenAware, mixin.IGameAware], {
	updateInterval: 10, //Once every 2 sec
	ticksSinceUpdate: 0,

	constructor: function(game){
		var self = this;
		var controller = com.nuclearunicorn.game.ui.PactsBtnController(game);
		dojo.forEach(game.religion.pactsManager.pacts, function(tu, i){
			var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
				id: 		tu.name,
				name: 		tu.label,
				description: tu.description,
				controller: controller
			}, game);
			self.addChild(button);
		});
	},

	render: function(container){
		var div = dojo.create("div", null, container);
		this.spanPactsInfo = dojo.create("span", {
			id: "pactsTextSum",
			innerHTML: this.game.religion.pactsManager.getPactsTextSum()}, div);
		var btnsContainer = dojo.create("div", null, div);
		this.spanDeficitInfo = dojo.create("span", {
			id: "pactsTextDeficit",
			innerHTML: this.game.religion.pactsManager.getPactsTextDeficit()}, div);
		//Create this <span> inside an anonymous <div> to vertically separate it from the previous <span>.
		this.spanDeficitKarma = dojo.create("span", {
			id: "pactsTextKarmaPunishment",
			innerHTML: this.game.religion.pactsManager.getPactsTextKarmaPunishment()}, dojo.create("div", null, div));
		this.inherited(arguments, [btnsContainer]);
		this.ticksSinceUpdate = 0;
	},

	update: function(){
		this.inherited(arguments);

		//Update Pact-related text frequently, but not too often
		this.ticksSinceUpdate++;
		if (this.ticksSinceUpdate >= this.updateInterval) {
			this.spanPactsInfo.innerHTML = this.game.religion.pactsManager.getPactsTextSum();
			this.spanDeficitInfo.innerHTML = this.game.religion.pactsManager.getPactsTextDeficit();
			this.spanDeficitKarma.innerHTML = this.game.religion.pactsManager.getPactsTextKarmaPunishment();
			this.ticksSinceUpdate = 0;
		}
	}
});
dojo.declare("classes.ui.PactsPanel", com.nuclearunicorn.game.ui.Panel, {
	visible: false
});

/**
 * A button controller for pacts upgrade
 */
 dojo.declare("com.nuclearunicorn.game.ui.PactsBtnController", com.nuclearunicorn.game.ui.BuildingStackableBtnController, {
	defaults: function() {
		var result = this.inherited(arguments);
		result.tooltipName = true;
		return result;
	},
    getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.religion.getPact(model.options.id);
		}
        return model.metaCached;
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if (this.game.getEffect("pactsAvailable")<=0 && model.metadata.effects["pactsAvailable"] != 0){
			model.enabled = false;
		}
	},

	getPrices: function(model) {
		var retVal = this.inherited(arguments);
		var upfront = this.game.getEffect("pactNecrocornUpfrontCost");
		if (!model.metadata.special && upfront > 0) {
			retVal.push({ name: "necrocorn", val: upfront });
		}
		return retVal;
	},

	shouldBeBough: function(model, game){
		return game.getEffect("pactsAvailable") + model.metadata.effects["pactsAvailable"]>=0;
	},
	buyItem: function(model, event) {
		this.game.updateCaches();
		this.updateEnabled(model);

		if (!this.hasResources(model) && !this.game.devMode) {
			return {
				itemBought: false,
				reason: "cannot-afford"
			};
		}
		if (!this.shouldBeBough(model, this.game)){
			return {
				itemBought: false,
				reason: "already-bought"
			};
		}
		return this._buyItem_step2(model, event);
	},

	build: function(model, maxBld){
		var meta = model.metadata;
		var counter = 0;
		if (typeof meta.limitBuild == "number" && meta.limitBuild - meta.val < maxBld){
			maxBld = meta.limitBuild - meta.val;
		}
		if (meta.effects["pactsAvailable"] != 0){
			maxBld = Math.min(maxBld, this.game.getEffect("pactsAvailable")/(-meta.effects["pactsAvailable"]));
		}
        if (model.enabled && this.hasResources(model) || this.game.devMode ){
	        while (this.hasResources(model) && maxBld > 0){
				this.incrementValue(model);
				this.payPrice(model);
	            counter++;
	            maxBld--;
	        }

			if (!meta.notAddDeficit && this.game.getEffect("pactNecrocornUpfrontCost") <= 0){
				//Having positive "pactNecrocornUpfrontCost" removes immediate debt accumulation when the player buys a Pact.
				this.game.religion.pactsManager.necrocornDeficit += 0.5 * counter;
			}
	        if (counter > 1) {
		        this.game.msg(meta.label + " x" + counter + " constructed.", "notice");
			}

			if (meta.breakIronWill) {
				this.game.ironWill = false;
			}

			if (meta.unlocks) {
				this.game.unlock(meta.unlocks);
			}

			if (meta.unlockScheme && meta.val >= meta.unlockScheme.threshold) {
				this.game.ui.unlockScheme(meta.unlockScheme.name);
			}

			if (meta.upgrades) {
				if (meta.updateEffects) {
					meta.updateEffects(meta, this.game);
				}
				this.game.upgrade(meta.upgrades);
			}
			if (meta.updatePreDeficitEffects){
				meta.updatePreDeficitEffects(this.game);
			}
			if (!meta.special) { //Potential performance optimization where we batch this in with the previous call a few lines above here, so we only call game.upgrade once.
				this.game.upgrade({
					policies: ["feedingFrenzy"],
					pacts: ["payDebt"]}
				);
			}
			if (meta.name != "payDebt"){
				this.game.religion.getZU("blackPyramid").jammed = false;
			}
        }

		if (counter && meta.name != "payDebt") { //The player cannot un-pay their debts (I'm lazy & don't feel like making the code work properly for that one)
			var undo = this.game.registerUndoChange();
			undo.addEvent(this.game.religion.id, {
				action: "buyPact",
				metaId: model.metadata.name,
				val: counter
			}, $I("ui.undo.religion.pact", [counter, model.metadata.label]));
		}
		return counter;
    },

});

dojo.declare("classes.ui.religion.RefineBtn", com.nuclearunicorn.game.ui.ButtonModern, {
	renderLinks: function () {
		this.hundred = this.addLink(this.model.hundredLink);
		this.twentyFive = this.addLink(this.model.twentyFiveLink);
		this.five = this.addLink(this.model.fiveLink);
	},

	update: function () {
		this.inherited(arguments);

		dojo.style(this.five.link, "display", this.model.fiveLink.visible ? "" : "none");
		dojo.style(this.twentyFive.link, "display", this.model.twentyFiveLink.visible ? "" : "none");
		dojo.style(this.hundred.link, "display", this.model.hundredLink.visible ? "" : "none");
	}
});

dojo.declare("classes.religion.pactsManager", null, {
	game: null,
	necrocornDeficit: 0,
	fractureNecrocornDeficit: 50,
	pacts: [
		{
			name: "pactOfCleansing",
			label: $I("religion.pact.pactOfCleansing.label"),
			description: $I("religion.pact.pactOfCleansing.desc"),
			prices: [				
				{ name : "relic", val: 100},
			],
			unlocks: {
				//"pacts": ["pactOfFanaticism"]
			},
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay" : 0,
				"pactDeficitRecoveryRatio": 0.003,
				"pactGlobalResourceRatio" : 0.0005,
				//"cathPollutionPerTickCon" : -5
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfDestruction",
			label: $I("religion.pact.pactOfDestruction.label"),
			description: $I("religion.pact.pactOfDestruction.desc"),
			prices: [				
				{ name : "relic", val: 100},
			],
			unlocks: {
				//"pacts": ["pactOfGlowing"] will deal with this later
			},
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay": 0,
				"pactDeficitRecoveryRatio": -0.0001,
				"pactGlobalProductionRatio": 0.0005,
				//"cathPollutionPerTickProd" : 10
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfExtermination",
			label: $I("religion.pact.pactOfExtermination.label"),
			description: $I("religion.pact.pactOfExtermination.desc"),
			prices: [
				{ name : "relic", val: 100},
			],
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay" : 0,
				"pactFaithRatio": 0.001
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
			}
		},{
			name: "pactOfPurity",
			label: $I("religion.pact.pactOfPurity.label"),
			description: $I("religion.pact.pactOfPurity.desc"),
			prices: [
				{ name : "relic", val: 100},
			],
			//unlocks: {
				//"pacts": ["pactOfFlame", "pactOfFanaticism"]
			//},
			effects: {
				"pactsAvailable": -1,
				"necrocornPerDay": 0,
				"pactDeficitRecoveryRatio": 0.005,
				"pactBlackLibraryBoost": 0.0005,
				"pactSpaceCompendiumRatio": 0.001
				//"cathPollutionPerTickCon" : -7
			},
			unlocked: false,
			calculateEffects: function(self, game){
				if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					return;
				}
				self.effects["necrocornPerDay"] = game.getEffect("pactNecrocornConsumption");
				game.religion.getZU("blackPyramid").jammed = false;
			}
		},{
			name: "payDebt",
			label: $I("religion.pact.payDebt.label"),
			description: $I("religion.pact.payDebt.desc"),
			prices: [
				{ name : "necrocorn", val: 0},
			],
			upgrades: {
				pacts: ["payDebt"]
			},
			effects: {
				"pactsAvailable": 0,
			},
			special: true,
			unlocked: false,
			calculateEffects: function(self, game){
				self.onNewDay(game);
				if (self.val > 0){
					self.on = 0;
					self.val = 0;
					game.religion.pactsManager.necrocornDeficit = 0;
					self.unlocked = false;
				}
			},
			onNewDay: function(game){
				var self = game.religion.getPact("payDebt");
				self.prices[0].val = Math.ceil(game.religion.pactsManager.necrocornDeficit);
				self.unlocked = this.evaluateLocks(game);
			},
			limitBuild: 1,
			notAddDeficit: true,
			evaluateLocks: function(game){
				return game.religion.pactsManager.necrocornDeficit > 0 && game.getFeatureFlag("MAUSOLEUM_PACTS");
			},
		},{
			name: "fractured",
			label: $I("religion.pact.fractured.label"),
			description: $I("religion.pact.fractured.desc"),
			prices: [
				{ name : "catnip", val: 1 }
			],
			effects: {
				"pyramidGlobalResourceRatio" : -0.5,
				"pyramidGlobalProductionRatio" : -0.5,
				"pyramidFaithRatio" : -0.5,
				"pactsAvailable": 0,
			},
			limitBuild: 1,
			special: true,
			unlocked: false,
			calculateEffects: function(self, game){
				if (!game.getFeatureFlag("MAUSOLEUM_PACTS")){
					self.effects = {
						"pyramidGlobalResourceRatio" : 0,
						"pyramidGlobalProductionRatio" : 0,
						"pyramidFaithRatio" : 0,
						"pactsAvailable": 0,
					};
					return;
				}
				if (self.on>=1){
					for (var i = 0; i<game.religion.pactsManager.pacts.length; i++){
						game.religion.pactsManager.pacts[i].on = 0;
						game.religion.pactsManager.pacts[i].val = 0;
						game.religion.pactsManager.pacts[i].unlocked = game.religion.pactsManager.pacts[i].name =="fractured";
					}
					self.val = 1;
					self.on = 1;
				}
			}
		}
	],
	necrocornDeficitPunishment: function(){
		for (var kitten in this.game.village.sim.kittens){
			var skills = this.game.village.sim.kittens[kitten].skills;
			for (var job in skills){
				skills[job] = 0;
			}
		}
		this.game.religion.getPact("fractured").on = 1;
		this.game.religion.getPact("fractured").val = 1;
		this.game.upgrade(
			{
				transcendenceUpgrades:["mausoleum"],
				policies:["radicalXenophobia", "feedingFrenzy"],
				pacts:["fractured"]
			}
		);
		//this.game.religion.getPact("fractured").calculateEffects(this.game.religion.getPact("fractured"), this.game);
		this.game.religion.pactsManager.necrocornDeficit = 0;
		this.game.msg($I("msg.pacts.fractured", [Math.round(100 * this.game.resPool.get("alicorn").value)/100]),"alert", "ai");
		this.game.resPool.get("alicorn").value = 0;
		var blackPyramid = this.game.religion.getZU("blackPyramid");
		for (var i in blackPyramid.effectsPreDeficit){
			blackPyramid.effectsPreDeficit[i] = 0;
		}
		this.game.religion.getZU("blackPyramid").updateEffects(this.game.religion.getZU("blackPyramid"), this.game);
	},
	constructor: function(game){
		this.game = game;

		//Enforce rule: all Pacts must have price ratio of 1 exactly.
		this.pacts.forEach(function(meta) { meta.priceRatio = 1; });
	},
	resetState: function(){
		//console.warn(this)
		//console.warn(this.game.religion.pactsManager)
		//console.warn(this.game.religion.pactsManager.pacts);
		for (var i in this.game.religion.pactsManager.pacts){
			this.game.religion.pactsManager.pacts[i].on = 0;
			this.game.religion.pactsManager.pacts[i].val = 0;
			this.game.religion.pactsManager.pacts[i].unlocked = false;
		}
	},
	getPactsTextSum: function(){
		return $I("msg.pacts.info", [this.game.getEffect("pactsAvailable"), -this.game.getEffect("pactNecrocornConsumption")]); //Every TT above 25 adds 100% to pact effects (not consumption) and 10% to karma per millenia effect
	},
	getPactsTextDeficit: function(){
		if (this.game.religion.pactsManager.necrocornDeficit <= 0) {
			return ""; //No deficit.  Nothing to see here.
		}
		if (this.game.getEffect("repayDebtOnNecrocornGeneration")) {
			//We have deficit, but it gets paid off with Siphoning.
			return $I("msg.necrocornDeficit.info.with.siphoning", [Math.round(this.game.religion.pactsManager.necrocornDeficit * 10000)/10000, 
				"-" + Math.round(100*
				((1 - this.game.religion.pactsManager.getDebtPenaltyRatio())))]);
		}
		//Else, we have deficit, & it makes Pacts consume more necrocorns to slowly pay it off.
		return $I("msg.necrocornDeficit.info", [Math.round(this.game.religion.pactsManager.necrocornDeficit * 10000)/10000, 
				"-" + Math.round(100*
				((1 - this.game.religion.pactsManager.getDebtPenaltyRatio()))),
				Math.round(10000*
					(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio")/2)))/100,
					-Math.round((this.game.getEffect("necrocornPerDay") *(0.15 *(1 + this.game.getEffect("deficitRecoveryRatio"))))*1000000)/1000000
				]);
	},
	getPactsTextKarmaPunishment: function() {
		if (!this.game.science.getPolicy("upfrontPayment").researched) {
			return "";
		}
		//Upfront Payment reduces karma effectiveness
		var karmaEffectiveness = this.getDebtPenaltyRatio();
		karmaEffectiveness = Math.max(karmaEffectiveness, 0.1); //Capped at -90% reduction

		if (karmaEffectiveness < 1) {
			//Transform into a percent:
			var reduction = 100 - 100*karmaEffectiveness;
			return $I("msg.necrocornDeficit.upfrontPayment.penalty", [
				"<span class=\"resource-name\">" + this.game.resPool.get("karma").title + "</span>", //Will be styled with CSS
				"<span title=\"" + reduction.toFixed(4) + "%\">" + reduction.toFixed(0) + "%</span>"]);
		}
		//Else, there's nothing to say.
		return "";
	},
	/**
	 * If there is Pact debt, certain game-effects are reduced based on how deep into debt the player is.
	 * This function calculates a ratio that effects are multiplied with.
	 * At low debt, returns a number closer to 1.  At high debt, returns a number closer to 0.
	 * If Pacts are Fractured, it's treated as though we have maximum debt.
	 * @return A number from 0 to 1, inclusive.
	 */
	getDebtPenaltyRatio: function() {
		if (this.game.religion.getPact("fractured").on || this.necrocornDeficit >= this.fractureNecrocornDeficit) {
			return 0; //Maximum debt
		}
		//Account for punishment exemption (0 by default):
		var lowerBound = this.game.getEffect("smallDebtPunishmentExemption");
		if (this.necrocornDeficit <= lowerBound) {
			return 1; //0 debt
		}
		if (lowerBound >= this.fractureNecrocornDeficit) {
			console.warn("smallDebtPunishmentExemption is too high relative to fractureNecrocornDeficit; cannot calculate debt penalty ratio!");
		}
		return 1 - (this.necrocornDeficit - lowerBound) / (this.fractureNecrocornDeficit - lowerBound);
	},
	getNecrocornDeficitConsumptionModifier: function(){
		if (this.necrocornDeficit <= 0){
			return 1;
		}
		var necrocornPerDay = this.game.getEffect("necrocornPerDay");
		if (this.game.getEffect("repayDebtOnNecrocornGeneration")) {
			//The new effect of Siphoning policy changes how you pay for Pacts
			return 1;
		}
		var necrocornDeficitRepaymentModifier = 1 + 0.15 * (1 + this.game.getEffect("deficitRecoveryRatio")/2);
		if ((this.game.resPool.get("necrocorn").value + necrocornPerDay * necrocornDeficitRepaymentModifier) < 0){
			necrocornDeficitRepaymentModifier = Math.max((necrocornPerDay * necrocornDeficitRepaymentModifier + this.game.resPool.get("necrocorn").value)/necrocornPerDay, 0);
			return necrocornDeficitRepaymentModifier;
		}
		return necrocornDeficitRepaymentModifier;
	},
	necrocornConsumptionDays: function(days){
		//------------------------- necrocorns pacts -------------------------
		//deficit changing
		var necrocornDeficitRepaymentModifier = 1;
		var necrocornPerDay = this.game.getEffect("necrocornPerDay"); //This is a NEGATIVE NUMBER if we have active Pacts
		if (this.game.getEffect("repayDebtOnNecrocornGeneration")) {
			//Debt is not paid in fractional necrocorns each day; rather, it is paid when we generate necrocorns.
			//We do accumulate debt each day, though.
			this.necrocornDeficit -= necrocornPerDay * days;
			return;
		}
		//if siphening is not enough to pay for per day consumption ALSO consume necrocorns;
		if (this.necrocornDeficit > 0){
			necrocornDeficitRepaymentModifier = 1 + 0.15 * (1 + this.game.getEffect("deficitRecoveryRatio")/2);
		}
		if ((this.game.resPool.get("necrocorn").value + necrocornPerDay * days * necrocornDeficitRepaymentModifier) < 0){
			this.necrocornDeficit += Math.max(-necrocornPerDay * days - this.game.resPool.get("necrocorn").value, 0);
			necrocornDeficitRepaymentModifier = 1;
		} else if (this.necrocornDeficit > 0){
			this.necrocornDeficit += necrocornPerDay *(0.15 * (1 + this.game.getEffect("deficitRecoveryRatio")) * days);
			this.necrocornDeficit = Math.max(this.necrocornDeficit, 0);
		}
		this.game.resPool.addResPerTick("necrocorn", necrocornPerDay * necrocornDeficitRepaymentModifier * days);
	},
	pactsMilleniumKarmaKittens: function(millenium){
		//pacts karma effect
		/*
		unspent pacts generate karma each 1000 years based on kitten numbers
		pactsAvailable are created by mausoleum cryptotheology and radicalXenophobia
		this function adds appropriate karmaKittens and returns change in karma; temporary logs karma generation
		TODO: maybe make HG bonus play into this
		*/
		var kittens = Math.round(this.game.resPool.get("kittens").value * (1 + this.game.getEffect("simScalingRatio")));
		if (kittens > 35 && this.game.getEffect("pactsAvailable") > 0){
			var oldKarmaKittens = this.game.karmaKittens;
			var kittensKarmaPerMinneliaRatio = this.game.getEffect("kittensKarmaPerMinneliaRatio");
			this.game.karmaKittens += millenium * this.game._getKarmaKittens(kittens) *
				this.game.getUnlimitedDR(
					kittensKarmaPerMinneliaRatio * 
					Math.max(1 + 0.1 * (this.game.religion.transcendenceTier - 25), 1)*
					(this.game.getEffect("pactsAvailable"))
				, 100);
			var karmaOld = this.game.resPool.get("karma").value;
			this.game.updateKarma();
			//console.log("produced " + String(this.game.resPool.get("karma").value - karmaOld) + " karma");
			//console.log("produced " + String(this.game.karmaKittens - oldKarmaKittens) + " karmaKittens"); //for testing purposes - comment over before merging into ML
			return this.game.resPool.get("karma").value - karmaOld;
		}
		return 0;
	},
	/**
	 * This function counts how many unique Pacts the player is running.
	 * For the purposes of this function, special objects like "pay the debt" or "fractured" don't count.
	 * We're talking about regular Pacts here.
	 * @return A number.  Specifically a nonnegative integer, because that's the type of number you usually use when counting something.
	 */
	countUniqueActivePacts: function() {
		if (!this.game.getFeatureFlag("MAUSOLEUM_PACTS")) {
			return 0;
		}
		var counter = 0;
		for (var i = 0; i < this.pacts.length; i++) {
			var pact = this.pacts[i];
			if (pact.name === "fractured" && pact.on) { //There can be game-states where Fractured is on but so are some other Pacts (such as in the middle of the tick when fracturing triggers, before the engine has finished updating things)
				return 0;
			}
			if (pact.special) { continue; } //Skip counting this one
			if (pact.on) {
				counter++;
			}
		}
		return counter;
	},
	/**
	 * This function counts how many total Pacts the player is running.
	 * For the purposes of this function, special objects like "pay the debt" or "fractured" don't count.
	 * We're talking about regular Pacts here.
	 * @return A nonnegative integer
	 */
	countActivePacts: function() {
		if (!this.game.getFeatureFlag("MAUSOLEUM_PACTS")) {
			return 0;
		}
		var sum = 0;
		for (var i = 0; i < this.pacts.length; i++) {
			var pact = this.pacts[i];
			if (pact.name === "fractured" && pact.on) { //There can be game-states where Fractured is on but so are some other Pacts (such as in the middle of the tick when fracturing triggers, before the engine has finished updating things)
				return 0;
			}
			if (pact.special) { continue; } //Skip counting this one
			sum += pact.on;
		}
		return sum;
	}
});
dojo.declare("com.nuclearunicorn.game.ui.tab.ReligionTab", com.nuclearunicorn.game.ui.tab, {

	sacrificeBtn : null,
	sacrificeAlicornsBtn: null,

	zgUpgradeButtons: null,
	rUpgradeButtons: null,
	pactUpgradeButtons: null,

	constructor: function(){
		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];
		this.pactUpgradeButtons = [];

		var ctPanel = new classes.ui.CryptotheologyPanel($I("religion.panel.cryptotheology.label"));
		ctPanel.game = this.game;

		this.addChild(ctPanel);
		this.ctPanel = ctPanel;

		var wgt = new classes.ui.CryptotheologyWGT(this.game);
		wgt.setGame(this.game);
		ctPanel.addChild(wgt);

		var ptPanel = new classes.ui.PactsPanel("Pacts");
		ptPanel.game = this.game;
		this.addChild(ptPanel);
		this.ptPanel = ptPanel;
		var wgtP = new classes.ui.PactsWGT(this.game);
		wgtP.setGame(this.game);
		ptPanel.addChild(wgtP);
	},

	render: function(container) {
		var game = this.game;

		this.zgUpgradeButtons = [];
		this.rUpgradeButtons = [];
		this.pactUpgradeButtons = [];

		var zigguratCount = game.bld.get("ziggurat").on;
		if (zigguratCount > 0){
			var zigguratPanel = new com.nuclearunicorn.game.ui.Panel($I("religion.panel.ziggurat.label"), game.religion);
			var content = zigguratPanel.render(container);

			var sacrificeBtn = new classes.ui.religion.MultiLinkBtn({
				name: $I("religion.sacrificeBtn.label"),
				description: $I("religion.sacrificeBtn.desc"),
				prices: [{ name: "unicorns", val: 2500}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					gainMultiplier: function() {
						return this.game.bld.get("ziggurat").on;
					},
					gainedResource: "tears",
					applyAtGain: function(priceCount) {
						this.game.stats.getStat("unicornsSacrificed").val += priceCount;
					},
					overcapMsgID: "religion.sacrificeBtn.sacrifice.msg.overcap",
					logTextID: "religion.sacrificeBtn.sacrifice.msg",
					logfilterID: "unicornSacrifice"
				})
			}, game);
			sacrificeBtn.render(content);
			this.sacrificeBtn = sacrificeBtn;

			var sacrificeAlicornsBtn = classes.ui.religion.MultiLinkBtn({
				name: $I("religion.sacrificeAlicornsBtn.label"),
				description: $I("religion.sacrificeAlicornsBtn.desc"),
				prices: [{ name: "alicorn", val: 25}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.hasResources(model) || (this.game.resPool.get("alicorn").value > 0 && this.game.resPool.get("timeCrystal").unlocked);
					},
					gainMultiplier: function() {
						return 1 + this.game.getEffect("tcRefineRatio");
					},
					gainedResource: "timeCrystal",
					applyAtGain: function() {
						this.game.upgrade({
							zigguratUpgrades: ["skyPalace", "unicornUtopia", "sunspire"]
						});
					},
					logTextID: "religion.sacrificeAlicornsBtn.sacrifice.msg",
					logfilterID: "alicornSacrifice"
				})
			}, game);
			sacrificeAlicornsBtn.render(content);
			this.sacrificeAlicornsBtn = sacrificeAlicornsBtn;

			var refineBtn = new classes.ui.religion.RefineBtn({
				name: $I("religion.refineTearsBtn.label"),
				description: $I("religion.refineTearsBtn.desc"),
				prices: [{ name: "tears", val: 10000}],
				controller: new classes.ui.religion.RefineTearsBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.game.religion.getZU("blackPyramid").unlocked;
					}
				})
			}, game);
			refineBtn.render(content);
			this.refineBtn = refineBtn;

			var refineTCBtn = new classes.ui.religion.MultiLinkBtn({
				name: $I("religion.refineTCsBtn.label"),
				description: $I("religion.refineTCsBtn.desc"),
				prices: [{ name: "timeCrystal", val: 25}],
				controller: new classes.ui.religion.TransformBtnController(game, {
					updateVisible: function(model) {
						model.visible = this.hasResources(model);
					},
					gainMultiplier: function() {
						return 1 + this.game.getEffect("relicRefineRatio") * this.game.religion.getZU("blackPyramid").getEffectiveValue(this.game);
					},
					gainedResource: "relic",
					logTextID: "religion.refineTCsBtn.refine.msg",
					logfilterID: "tcRefine"
				})
			}, game);
			refineTCBtn.render(content);
			this.refineTCBtn = refineTCBtn;

			//TODO: all the dark miracles there
			var zigguratController = new com.nuclearunicorn.game.ui.ZigguratBtnController(game);
			var upgrades = game.religion.zigguratUpgrades;
			for (var i = 0; i < upgrades.length; i++){
				var upgr = upgrades[i];

				var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
					id: 		upgr.name,
					name: upgr.label,
					description: upgr.description,
					prices: upgr.prices,
					controller: zigguratController,
					handler: upgr.handler
				}, game);

				button.render(content);
				this.zgUpgradeButtons.push(button);
			}
		}	//eo zg upgrades

		if (!game.challenges.isActive("atheism")) {
			//------------------- religion -------------------
			var religionPanel = new com.nuclearunicorn.game.ui.Panel($I("religion.panel.orderOfTheSun.label"), game.religion);
			var content = religionPanel.render(container);

			var faithCount = dojo.create("span", { style: { display: "inline-block", marginBottom: "10px"}}, content);
			this.faithCount = faithCount;

			this.praiseBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.praiseBtn.label"),
				description: $I("religion.praiseBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.PraiseBtnController(game),
				handler: function() {
					game.religion.praise();	//sigh, enjoy your automation scripts
				}
			}, game);

			this.adoreBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.adoreBtn.label"),
				description: $I("religion.adoreBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.ResetFaithBtnController(game),
				handler: function(btn) {
					game.religion.resetFaith(1.01, true);
				}
			}, game);

			this.transcendBtn = new com.nuclearunicorn.game.ui.ButtonModern({
				name: $I("religion.transcendBtn.label"),
				description: $I("religion.transcendBtn.desc"),
				controller: new com.nuclearunicorn.game.ui.TranscendBtnController(game),
				handler: function(btn) {
					game.religion.transcend();
					var transcendenceLevel = game.religion.transcendenceTier;
					for (var i = 0; i < game.religion.transcendenceUpgrades.length; i++) {
						var check = (!game.religion.transcendenceUpgrades[i].evaluateLocks || game.religion.transcendenceUpgrades[i].evaluateLocks(game));
						if (check && transcendenceLevel >= game.religion.transcendenceUpgrades[i].tier) {
							game.religion.transcendenceUpgrades[i].unlocked = true;
						}
					}
				}
			}, game);

			var buttonAssociations = {
				"transcendence": this.transcendBtn
			};

			this.praiseBtn.render(content);
			this.adoreBtn.render(content);

			var controller = new com.nuclearunicorn.game.ui.ReligionBtnController(game);
			var upgrades = game.religion.religionUpgrades;
			for (var i = 0; i < upgrades.length; i++) {
				var upgr = upgrades[i];

				var button = new com.nuclearunicorn.game.ui.BuildingStackableBtn({
					id: upgr.name,
					name: upgr.label,
					description: upgr.description,
					prices: upgr.prices,
					controller: controller,
					handler: function(btn){
						var upgrade = btn.model.metadata;
						if (upgrade.upgrades){
							game.upgrade(upgrade.upgrades);
						}
					}
				}, game);
				button.render(content);
				var associatedButton = buttonAssociations[upgr.name];
				if (associatedButton) {
					associatedButton.render(content);
				}
				this.rUpgradeButtons.push(button);
			}
		}
		this.inherited(arguments);
		this.update();
	},

	update: function(){
		this.inherited(arguments);

		var religion = this.game.religion;

		if (this.sacrificeBtn) {
			this.sacrificeBtn.update();
		}

		if (this.sacrificeAlicornsBtn) {
			this.sacrificeAlicornsBtn.update();
		}

		if (this.refineBtn) {
			this.refineBtn.update();
		}

		if (this.refineTCBtn) {
			this.refineTCBtn.update();
		}

		if (!this.game.challenges.isActive("atheism")) {
			if (this.praiseBtn) {
				this.praiseBtn.update();
			}

			var sr = this.game.religion.getRU("solarRevolution");
			sr.calculateEffects(sr, this.game);

			if (this.adoreBtn) {
				this.adoreBtn.update();
			}

			if (this.transcendBtn) {
				this.transcendBtn.update();
			}

			if (religion.faith && this.faithCount){
				this.faithCount.innerHTML = $I("religion.faithCount.pool", [this.game.getDisplayValueExt(religion.faith)]);
			} else {
				this.faithCount.innerHTML = "";
			}

			var bonus = religion.getSolarRevolutionRatio();
			if (bonus != 0) {
				this.faithCount.innerHTML += ( " (+" + this.game.getDisplayValueExt(100 * bonus) + "% " + $I("religion.faithCount.bonus") + ")" );
			}

			dojo.forEach(this.rUpgradeButtons,  function(e, i){ e.update(); });	
		}
		var hasCT = this.game.science.get("cryptotheology").researched && this.game.religion.transcendenceTier > 0;
		this.ctPanel.setVisible(hasCT);

		dojo.forEach(this.zgUpgradeButtons, function(e, i){ e.update(); });
		var canSeePacts = !this.game.religion.getPact("fractured").researched && this.game.religion.getZU("blackPyramid").val > 0 && (this.game.religion.getTU("mausoleum").val > 0 || this.game.science.getPolicy("radicalXenophobia").researched);
		canSeePacts = canSeePacts && this.game.getFeatureFlag("MAUSOLEUM_PACTS");
		this.ptPanel.setVisible(canSeePacts);
	}

});
