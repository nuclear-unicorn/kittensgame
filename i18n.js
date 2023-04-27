/**
 * FOR FULL I18N!
 */

//Localization support
dojo.declare("com.nuclearunicorn.i18n.Lang", null, {
	fallbackLocale: "en",
	availableLocales: null,
	availableLocaleLabels: null,
	language: null,
	messages: null,
	_deffered: null,
	platformLocale: null,

	//TODO: move to the configuration file
	constructor: function(){
		var config = new classes.KGConfig();
		this.availableLocales = [this.fallbackLocale];

		//console.info("Available locales:", config.statics.locales);
		for (var i in config.statics.locales ){
			this.availableLocales.push(config.statics.locales[i]);
		}

		this.availableLocaleLabels = {
			"en" : "English",

			"br": "Português",
			"cz": "Čeština",
			"de": "Deutsch",
			"es": "Español",
			"fr": "Français",
			"fro": "Ancien Français",
			"it": "Italiano",
			"ja": "日本語",
			"ko": "한국어",
			"nl": "NL",
			"no": "NO",
			"pl": "Polski",
			"ro": "RO",
			"ru": "Русский",
			"tr": "TR",
			"uk": "Українська",
			"be": "Беларуская",
			"zh": "中文",
			"zht": "漢語"
		};
	},

	init: function(timestamp){
		var self = this;
		if (navigator.globalization  !== undefined) {
			var def = $.Deferred();

			navigator.globalization.getPreferredLanguage(
				function (language) {
					//console.log("platform locale:", language);
					self.platformLocale = language.value;

					def.resolve();
				},
				function (err) {
					console.error("Unable to get platform locale", err);
					def.resolve();
				}
			);
			return def.promise().then(function(){return self._init(timestamp);});
		} else {
			return this._init(timestamp);
		}
	},

	_init: function(timestamp) {
		if (this._deffered) {
			return this._deffered.promise();
		}
		// check if user already selected the locale
		var lang = LCstorage["com.nuclearunicorn.kittengame.language"];
		this.fallbackLocale = 'en';

		if (!lang || !this.isAvailable(lang)) {

			//console.log("navigator:", navigator, "platform:", this.platformLocale);
			var defaultLocale = this.platformLocale || navigator.language || navigator.userLanguage;
			// find closes match
			var parts = defaultLocale.split(/[-_]/);
			lang = this.fallbackLocale;

			for (var j = 0; j < this.availableLocales.length; j++) {
				if (this.availableLocales[j] == parts[0].toLowerCase()) {
					lang = this.availableLocales[j];
					break;
				}
			}
			console.log("Using preferred OS locale:", lang);
			LCstorage["com.nuclearunicorn.kittengame.language"] = lang;
		}
		// at this point we always have correct lang selected
		this.language = lang;
		var self = this;
		this._deferred = $.Deferred();
		// now we can try to load it
		// fallback

		console.log("User selected locale:", "'" + lang + "'", "fallback locale", "'" + this.fallbackLocale  + "'");
		console.log("loading fallback messages");
		
		$.getJSON( "res/i18n/" + this.fallbackLocale + ".json?_=" + timestamp).done(function(fallbackLocaleMessages){
			self.messages = fallbackLocaleMessages;

			if (self.language != self.fallbackLocale ) {
				// legacy
				console.log("trying to load legacy locale system");
				$.getJSON( "res/i18n/" + lang + ".json?_=" + timestamp).
					then(function(legacyLocaleMessages){
						console.log("loaded legacy locale for lang", lang, legacyLocaleMessages);
						$.extend(self.messages, legacyLocaleMessages);
					}).fail(function(){
						console.warn("no legacy locale ", "'" + lang + "'", " found, skipping...");
					}).always(function(){
						// crowdin
						console.log("trying to load crowdin locale system");
						$.getJSON( "res/i18n/crowdin/" + lang + ".json?_=" + timestamp).then(function(crowdinLocale){
							console.log("loaded crowdin locale for lang", lang, crowdinLocale);
							$.extend(self.messages, crowdinLocale);
							self._deferred.resolve();
						}).fail(function(){
							console.warn("no crowdin locale ", "'" + lang + "'", " found, skipping...");
							self._deferred.resolve();
						});
					});
			} else {
				self._deferred.resolve();
			}
		}).fail(function(error){
			console.error("Unable to load locale chain for  '" + lang + "', error:", error);
		});

		return this._deferred.promise();
	},

	getAvailableLocales: function() {
		return this.availableLocales;
	},

	getAvailableLocaleLabels: function() {
		return this.availableLocaleLabels;
	},

	getLanguage: function() {
		return this.language;
	},

	updateLanguage: function(lang) {
		this.language = lang;
		LCstorage["com.nuclearunicorn.kittengame.language"] = lang;
	},

	isAvailable: function(lang) {
		for (var i = 0; i < this.availableLocales.length; i++) {
			if (this.availableLocales[i] == lang) {
				return true;
			}
		}
		return false;
	},

	msg: function(key, args) {
		var msg = this.messages[key];
		if (!msg) {
			console.error("Key '" + key + "' wasn't found");
			return "$" + key;
		}

		if (args) {
			for (var i = 0; i < args.length; i++) {
				msg = msg.replace("{" + i + "}", args[i]);
			}
		}
		return msg;
	}
});

i18nLang = new com.nuclearunicorn.i18n.Lang();
// i18nLang.init();

$I = function(key, args) {
	return i18nLang.msg(key, args);
};