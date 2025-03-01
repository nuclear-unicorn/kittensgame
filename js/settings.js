/**
 * We need a better options system for KG because the one we have currently is very difficult to extend.
 * Ideally, adding a new option will be as simple as adding just a few lines of code & an associated i18n string.
 * One limitation of the SettingsManager as implemented here is that it only handles boolean options, & the game
 * contains a few (4, by my last count) non-boolean options.  So, this new system handles the majority
 * of cases, but we'll need to have special handling for the others.
 * 
 * Hello there, future developer!  Do you want to add a new option to the game's options menu?
 * If it's a simple checkbox-type option, you're in luck!  All you need to do is add a few lines of code to this file, & it'll work!
 * If it's anything more complicated, such as a dropdown menu or a slider, that's rough, buddy.
 * You'll need to edit index.html & ui.js for the UI stuff,
 * & you'll need to edit game.js to make it preserve through the save-state & set up default values.
 * 
 * How to use:
 * If you want to GET or SET the value of a setting, just directly read/modify game.opts[optionName].
 * One of the goals of the update which added SettingsManager was that everything would just *work* with the absolute minimum
 * number of changes to code in other files.
 */
dojo.declare("classes.managers.SettingsManager", com.nuclearunicorn.core.TabManager, {
	//We inherit from TabManager for a few reasons, one of them being that we can just plug this
	// into the existing TabManager system & some features will work with minimal extra code overhead.

	/**
	 * Array of every option that the SettingManager is aware of.
	 * Each has 2 strictly mandatory properties:
	 * 	name - string - internal name of this option, so you'd access it by game.opts[optionName]
	 * 	defaultValue - boolean - The value that this option takes if the player doesn't specify otherwise.
	 * 
	 * There are also some optional properties: //TODO--update this so that it's up-to-date!!!
	 * 	label - i18n string shown as the name/description for this option in the web version of the game
	 * 		If an option doesn't have a label, maybe don't show it on the web version of the game?
	 * 	mobileTitle - i18n string shown as the name for this option in the mobile version of the game
	 * 	mobileDesc - i18n string shown as the description for this option in the mobile version of the game
	 * 		Some options currently don't have mobileTitle or mobileDesc because, for the longest time,
	 * 		most of these options weren't toggleable on mobile.
	 * 		Maybe the system could only show an option in the menu on web if it has both mobileTitle & mobileDesc defined...
	 * 	isExtra - boolean - If truthy, this setting is displayed on the web version of the game under the "More..." category.
	 * 	devModeOnly - boolean - If truthy, this setting is hidden unless dev mode is active.
	 * 	showOnlyIfKSDetected - Used on the mobile version for something.
	 */
	settingsArr: [{
		name: "useWorkers",
		defaultValue: true,
		//This one has a label but no mobileTitle or mobileDesc, so it shows up on web but not on mobile
		label: $I("ui.option.workers")
	}, {
		name: "forceHighPrecision",
		defaultValue: false,
		//This one has a label && a mobileTitle && a mobileDesc, so it shows up on BOTH web & mobile
		label: $I("ui.option.force.high.precision"),
		mobileTitle: $I("opts.precision"),
		mobileDesc: $I("opts.precision.desc")
	}, {
		name: "usePerSecondValues",
		defaultValue: true,
		label: $I("ui.option.use.per.second.values"),
	}, {
		name: "usePercentageResourceValues",
		defaultValue: false,
		label: $I("ui.option.use.percentage.resource.values"),
		mobileTitle: $I("opts.percentage"),
		mobileDesc: $I("opts.percentage.desc")
	}, {
		name: "showNonApplicableButtons",
		defaultValue: false,
		label: $I("ui.option.show.non.applicable.buttons"), //"Always show festivals/trade/sacrifice/shatter buttons even if not applicable"
	}, {
		name: "usePercentageConsumptionValues",
		defaultValue: false,
		label: $I("ui.option.use.percentage.consumption.values"), //"Use percentage values for craft/trade/sacrifice buttons"
	}, {
		name: "highlightUnavailable", //Turn buttons red to signify they're capped due to storage limits
		defaultValue: true,
		label: $I("ui.option.highlight.unavailable"),
		mobileTitle: $I("opts.highlight"),
		mobileDesc: $I("opts.highlight.desc")
	}, {
		name: "hideSell",
		defaultValue: false,
		label: $I("ui.option.hide.sell"),
		mobileTitle: $I("opts.hideSell"),
		mobileDesc: $I("opts.hideSell.desc")
	}, {
		name: "hideDowngrade",
		defaultValue: false,
		label: $I("ui.option.hide.downgrade"),
	}, {
		name: "hideBGImage",
		defaultValue: false,
		label: $I("ui.option.hide.bgimage"),
	}, {
		name: "tooltipsInRightColumn",
		defaultValue: false,
		label: $I("ui.option.tooltips.right"),
	}, {
		name: "noConfirm",
		defaultValue: false,
		label: $I("ui.option.no.confirm"),
		//This flag controls where in the options menu this setting appears.  On web, anyways.
		// The mobile version can do whatever the mobile devs want.
		isExtra: true
	}, {
		name: "IWSmelter",
		defaultValue: true,
		label: $I("ui.option.iw.smelter"),
		isExtra: true
	}, {
		name: "disableTelemetry",
		defaultValue: false,
		label: $I("ui.option.disable.telemetry"),
		isExtra: true
	}, {
		name: "enableRedshift", //Redshift is the game's internal term for offline progression
		defaultValue: false,
		label: $I("ui.option.enable.redshift"),
		isExtra: true
	}, {
		name: "disablePollution", //This one is a lie.  It has no functional effect, but it hides pollution from the UI.
		defaultValue: false,
		label: $I("ui.option.pollution"),
		//(These i18n strings are defined on mobile, but they don't work on web)
		mobileTitle: $I("opts.pollution"),
		mobileDesc: $I("opts.pollution.desc"),
		isExtra: true
	}, {
		//Future stuff (nice-to-have, but not essential, & I won't be adding it today):
		// It'd be cool if this option were greyed-out/inactive when "enable redshift" is disabled.
		name: "enableRedshiftGflops",
		defaultValue: false,
		label: $I("ui.option.enable.redshiftGflops"),
		isExtra: true
	}, {
		// Used only in KG Mobile, hence its absence in the rest of the code
		name: "useLegacyTwoInRowLayout",
		defaultValue: false,
		mobileTitle: $I("opts.tabLayout"),
		mobileDesc: $I("opts.tabLayout.desc"),
		isExtra: true
	}, {
		name: "useSwipeNavigation",
		defaultValue: false,
		//(These i18n strings are defined on mobile, but they don't work on web)
		mobileTitle: $I("opts.swipeNavigation"),
		mobileDesc: $I("opts.swipeNavigation.desc"),
		isExtra: true
	}, {
		name: "ksEnabled",
		defaultValue: false,
		//(These i18n strings are defined on mobile, but they don't work on web)
		mobileTitle: $I("opts.enableKS"),
		mobileDesc: $I("opts.enableKS.desc"), //"This is absolutely unsupported, you have never seen me or this setting"
		isExtra: true,
		showOnlyIfKSDetected: true
	}, {
		name: "forceLZ",
		defaultValue: false,
		label: $I("ui.option.force.lz"), //"Always compress in-memory save, in UTF-16 <i>(experimental)</i>"
		isExtra: true
	}, {
		name: "compressSaveFile",
		defaultValue: false,
		label: $I("ui.option.compress.savefile"), //Compress exported save file, not compatible with older save versions
		isExtra: true
	}, {
		name: "disableCMBR", //CMBR was an old feature which granted a global production & storage bonus.
		defaultValue: false,
		devModeOnly: true
	}],

	game: null,

	constructor: function(game) {
		this.game = game;
		this.registerSettings();
	},

	/**
	 * For each setting that this class knows about, this function initializes that setting.
	 * This function also does some error-checking--if it finds an invalid setting definition,
	 * it'll write an appropriate error to the console & skip registering that particular one,
	 * but it'll continue working on the others.
	 * 		i.e. Having one bad setting in there won't break anything else.
	 */
	registerSettings: function() {
		this.forEach(function(setting) {
			//Enforce that each setting has a name.  We require that it be a valid JS string.
			if (typeof(setting.name) !== "string") {
				console.error("Cannot register a setting because its name was invalid!");
				return;
			}
			//Enforce that a default value must be EXPLICITLY defined.
			if (typeof(setting.defaultValue) !== "boolean") {
				console.error("Cannot register setting \"" + setting.name + "\" because its default value was invalid!");
				return;
			}
			this.set(setting, setting.defaultValue);
		}, this);
	},

	/**
	 * Reverts ALL game-options to their default values.
	 */
	resetState: function() {
		this.forEach(function(setting) {
			this.set(setting, setting.defaultValue);
		}, this);
	},

	/**
	 * Doesn't actually do anything currently--existing code in game.js already handles this functionality.
	 * @param saveData - Object which is used by the game's save/load system to store data.
	 */
	save: function(saveData) {},

	/**
	 * Doesn't actually do anything currently--existing code in game.js already handles this functionality.
	 * @param saveData - Object which is used by the game's save/load system to store data.
	 */
	load: function(saveData) {},

	/**
	 * Works very similarly to forEach on an array, which executes the callback on all elements in the array.
	 * But this is a SettingsManager.  Our forEach executes the callback on all of the game options we know about.
	 * For information about the parameters, do an internet search for "JavaScript array forEach" or similar.
	 */
	forEach: function(callbackFn, thisArg) {
		this.settingsArr.forEach(callbackFn, thisArg);
	},

	/**
	 * Reads the current value of a setting without modifying it.
	 * @param setting - Specifies which setting to change.
	 * 		Can be either a settings metadata object OR a string containing the name of the setting.
	 * @return The current value of that setting.  It's supposed to be a boolean.
	 */
	get: function(setting) {
		var settingName = typeof(setting) === "object" ? setting.name : setting;
		return this.game.opts[settingName];
	},

	/**
	 * Changes the value of a setting.
	 * @param setting - Specifies which setting to change.
	 * 		Can be either a settings metadata object OR a string containing the name of the setting.
	 * @param newValue - What we want to change that option to.  It's supposed to be a boolean.
	 */
	set: function(setting, newValue) {
		var settingName = typeof(setting) === "object" ? setting.name : setting;
		this.game.opts[settingName] = newValue;
	},

	/**
	 * Retrieves the metadata object for a particular option, given its name.
	 * If it wasn't found, writes an error to the console.
	 * @param name - string - The name of the setting
	 * @return A reference to a settings object
	 */
	getSetting: function(name) {
		return this.getMeta(name, this.settingsArr);
	}
});

/**
 * Rather than being a true "tab" in the same way that Village or Space or Achievements are tabs,
 * this will be a UI element with a very similar code interface to that of a tab.
 * Although, to the player's eyes, it'll look quite different.
 */
dojo.declare("com.nuclearunicorn.game.ui.tab.SettingsTab", com.nuclearunicorn.game.ui.tab, {
	/**
	 * Renders the checkboxes for EACH option.
	 * @param container - Included just to make the signature of this function consistent with all other render functions.
	 */
	render: function(container) {
		//Store references to the DOM elements inside which the options will go:
		var divNormal = $("#booleanOptionsNormal")[0];
		var divExtra = $("#booleanOptionsExtra")[0];

		dojo.empty(divNormal);
		dojo.empty(divExtra);

		this.game.settings.forEach(function(setting) {
			//In dev mode, show all options.
			//Outside of dev mode, hide any options that shouldn't appear on the web version of the game.
			if (!this.game.devMode) {
				if (setting.devModeOnly || setting.showOnlyIfKSDetected || !setting.label) {
					return;
				}
			}
			//Render to divNormal or divExtra depending on isExtra flag:
			this.renderSetting(setting.isExtra ? divExtra : divNormal, setting);
		}, this);
	},

	/**
	 * Creates everything needed (from the HTML side) to have a functional checkbox option.
	 * @param container - The DOM element inside which we'll put everything.
	 * @param setting - A metadata object representing the game-option we're rendering.
	 */
	renderSetting: function(container, setting) {
		var checkbox = dojo.create("input", {
			id: setting.name + "I", //I for <input>
			type: "checkbox",
			checked: setting.value
		}, container);
		var label = dojo.create("label", {
			id: setting.name + "L", //L for <label>
			for: setting.name + "I",
			//TODO: replace hardcoded string with something in the i18n for dev mode
			innerHTML: (!setting.label && setting.mobileTitle ? "(mobile-only) " : "") + //In Dev Mode, flag all mobile-only options
				(setting.label || setting.mobileTitle || setting.name) //Use setting.name if neither label nor mobileTitle are defined
		}, container);
		dojo.create("br", {}, container); //Put each option on a separate line.

		var settingsManager = this.game.settings;
		//Here is where the magic happens:
		dojo.connect(checkbox, "onclick", this, function(event) {
			var theCheckbox = event.target;
			settingsManager.set(setting, theCheckbox.checked);
			theCheckbox.checked = setting.value;
		});
	}

	//TODO: Refresh options UI whenever you close & re-open the options menu.
});