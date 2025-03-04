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
	 * There are also some optional properties:
	 * 	label - i18n string shown as the name/description for this option in the web version of the game
	 * 		If an option doesn't have a label, it won't be available in the web version.
	 * 		So, if you want to make an option mobile-only, don't give it a label.
	 * 	mobileTitle - i18n string shown as the name for this option in the mobile version of the game
	 * 	mobileDesc - i18n string shown as the description for this option in the mobile version of the game
	 * 		Maybe the mobile UI system can be set up so that it only shows an option if it has mobileTitle defined...
	 * 	isExtra - boolean - Determines which category an option is displayed under.
	 * 		If falsy, the option will be displayed normally in the options menu on web.
	 * 		If truthy, the option will be displayed under "More..." in the options menu on web.
	 * 		Currently has no effect on mobile.
	 * 	triggerUpdateUI - boolean - This is for the web version of the game.
	 * 		If true, whenever the player toggles this setting, it'll re-render the UI.
	 * 	devModeOnly - boolean - If truthy, this setting is hidden unless dev mode is active.
	 * 	showOnlyIfKSDetected - If truthy, this setting is hidden.  (nothing to see here %citizen%)
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
		label: $I("ui.option.hide.downgrade")
	}, {
		name: "hideBGImage",
		defaultValue: false,
		label: $I("ui.option.hide.bgimage"),
		triggerUpdateUI: true
	}, {
		name: "tooltipsInRightColumn",
		defaultValue: false,
		label: $I("ui.option.tooltips.right"),
		triggerUpdateUI: true
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
		//This setting applies on web only.  The mobile version of the game is specifically programmed
		// to ignore the value of this setting & always have redshift enabled.
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
	 * At the moment, all this function does is handle situations when a particular option is stored
	 * in one part of saveData in an old version of the game, but in newer versions of the game it's
	 * expected to be in a different part of saveData.
	 * Existing code in game.js already handles the main functionality of changing the game-state
	 * based on what is stored in the saveData object.
	 * @param saveData - Object which is used by the game's save/load system to store data.
	 */
	load: function(saveData) {
		//Move game.useWorkers -> game.opts.useWorkers
		if (saveData.game && typeof(saveData.game.useWorkers) !== "undefined") {
			if (!saveData.game.opts) {
				saveData.game.opts = {};
			}
			saveData.game.opts.useWorkers = saveData.game.useWorkers;
		}
	},

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

	/**
	 * In a perfect world, I'd have wanted ALL reading/writing involving settings to be done through
	 * the SettingsManager#get or #set functions, respectively.  The thing is, a large chunk of the code
	 * is built upon using game.opts, & game.opts is still used for the non-boolean options that our
	 * SettingsManager doesn't manage, so I cannot justify removing game.opts entirely.
	 * I cannot justify changing every single line of code in both the KG repo & the KGM repo
	 * that currently references game.opts to instead call a method of game.settings.
	 * If we don't remove game.opts, that means we're keeping it around, & if we're keeping it around,
	 * we might as well support it.  So, although one COULD call SettingsManager#get or SettingsManaget#set,
	 * for the foreseeable future, it's easier to use game.opts, & things will still work well anyways.
	 * 
	 * It might be nice to extend SettingsManager functionality someday so it also tracks the game's
	 * non-boolean options.  However, adding an entire new manager to the game is rather difficult,
	 * & as a result it's made by brain tired, so I won't do it today.
	 * The majority of the game's settings are boolean flags anyways, so my focus is on booleans.
	 */
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
		var settingsManager = this.game.settings;
		var checkbox = dojo.create("input", {
			id: setting.name + "I", //I for <input>
			type: "checkbox",
			checked: settingsManager.get(setting)
		}, container);
		var label = dojo.create("label", {
			id: setting.name + "L", //L for <label>
			for: setting.name + "I",
			innerHTML: setting.label || setting.mobileTitle || setting.name //Use setting.name if neither label nor mobileTitle are defined
		}, container);
		if (setting.devModeOnly) {
			dojo.attr(label, "title", $I("ui.option.dev.mode.only"));
		}
		dojo.create("br", {}, container); //Put each option on a separate line.

		//Here is where the magic happens:
		dojo.connect(checkbox, "onclick", this, function(event) {
			var theCheckbox = event.target;
			settingsManager.set(setting, theCheckbox.checked);
			theCheckbox.checked = settingsManager.get(setting);
			if (setting.triggerUpdateUI) {
				this.game.ui.updateOptions();
			}
		});
	}
});