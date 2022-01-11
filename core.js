/**
 * Workaround for IE9 local storage :V
 *
 * This fix is intended for IE in general and especially for IE9,
 * where localStorage is defined as system variable.
 *
 */

window.LCstorage = window.localStorage;
if (document.all && !window.localStorage) {
    window.LCstorage = {};
    window.LCstorage.removeItem = function () { };
}

dojo.declare("com.nuclearunicorn.core.Control", null, {
	//Base control class. Must be a superclass for all game components.
});

/**
 * core.js - a collection of base classes shared among all components of the game.
 * UI controls go there.
 */


/**
 * A base class for every tab manager component like science, village, bld, etc
 * Ideally every manager should be a subclass of a TabManager. See reference implementation in religion.js
 */
dojo.declare("com.nuclearunicorn.core.TabManager", com.nuclearunicorn.core.Control, {

	/**
	 * This may not be obvious, but all objects instantiated there will be STATIC and shared among all the instances of the class.
	 *
	 * Wrong:
	 *
	 * >>  arrayField: []
	 *
	 * Correct:
	 *
	 * >>  arrayField: null,
	 * >>
	 * >>  constructor: function() { this.arrayField = []; }
	 */
	effectsCachedExisting: null,
	meta: null,
	panelData: null,

	/**
	 * Constructors are INHERITED automatically and CHAINED in the class hierarchy
	 */
	constructor: function(){
		this.effectsCachedExisting = {};
		this.meta = [];
		this.panelData = {};
	},

	/**
	 * Methods however are NOT. Use this.inherited(arguments) to call a base method;
	 */

	registerPanel: function(id, panel){
		if (!this.panelData[id]){
			this.panelData[id] = {
				collapsed: panel.collapsed
			};
		}
		panel.collapsed = this.panelData[id].collapsed;
		dojo.connect(panel, "onToggle", this, function(collapsed){
			this.panelData[id].collapsed = collapsed;
		});
	},

	 /**
	 * @param meta	- metadata set (e.g. buildings list, upgrades list, etc)
	 * @param provider - any object having getEffect(metaElem, effectName) method
	 */
	registerMeta: function(type, meta, provider){
		if (!type) {
			this.meta.push({meta: meta, provider: provider});
		} else if (type == "research") {
			this.meta.push({
				meta: meta,
				provider: { getEffect : function(item, effect){
					return (item.researched && item.effects) ? item.effects[effect] : 0;
				}}
			});
		} else if (type == "stackable") {
			this.meta.push({
				meta: meta,
				provider: { getEffect : function(item, effect){
					return (item.effects) ? item.effects[effect] * item.on : 0;
				}}
			});
		}
	},

	setEffectsCachedExisting: function() {
		// Set effectsCachedExisting based on meta
		for (var a = 0; a < this.meta.length; a++){
			if (this.meta[a].meta){
				for (var i = 0; i < this.meta[a].meta.length; i++){
					for (var effect in this.meta[a].meta[i].effects) {
						this.effectsCachedExisting[effect] = 0;
					}
				}
			}
		}
		// Set effectsCachedExisting based on effectsBase
		if (typeof(this.effectsBase) == "object") {
			for (var effect in this.effectsBase) {
				this.effectsCachedExisting[effect] = 0;
			}
		}
	},

	updateEffectCached: function() {
		var effectsBase = this.effectsBase;
		if (effectsBase){
			effectsBase = this.game.resPool.addBarnWarehouseRatio(effectsBase);
		}

		for (var name in this.effectsCachedExisting) {
			// Add effect from meta
			var effect = 0;
			for (var i = 0; i < this.meta.length; i++){
				effect += this.getMetaEffect(name, this.meta[i]);
			}

			// Previously, catnip demand (or other buildings that both affect the same resource)
			// could have theoretically had more than 100% reduction because they diminished separately,
			// this takes the total effect and diminishes it as a whole.
			if (this._hasLimitedDiminishingReturn(name) && effect !== 0) {
				effect = this.game.getLimitedDR(effect, 1);
			}

			// Add effect from effectsBase
			if (effectsBase && effectsBase[name]) {
				effect += effectsBase[name];
			}

			// Add effect in globalEffectsCached, in addition of other managers
			this.game.globalEffectsCached[name] = typeof(this.game.globalEffectsCached[name]) == "number" ? this.game.globalEffectsCached[name] + effect : effect;
		}
	},

	_hasLimitedDiminishingReturn: function(name) {
		return name == "catnipDemandRatio"
		    || name == "fursDemandRatio"
		    || name == "ivoryDemandRatio"
		    || name == "spiceDemandRatio"
		    || name == "unhappinessRatio";
	},

	/**
	 * Returns a cached combined value of effect of all managers, for effect existing in the manager
	 * Will calculate effect value of the manager if the value of effect of all managers is not yet implemented (launch of the game)
	 */
	 /*
	getEffect: function(name){
		// Search only if effect exists in the manager
		if (typeof(this.effectsCachedExisting[name]) == "undefined"){
			return 0;
		}
		// Search only if effect is not yet in the globalEffectsCached
		var cached = this.game.globalEffectsCached[name];
		if (cached != undefined) {
			return cached;
		}

		// Search
		var effect = 0;
		for (var i = 0; i< this.meta.length; i++){
			var effectMeta = this.getMetaEffect(name, this.meta[i]);
			effect += effectMeta;
		}
		return effect;
	},
*/
	/**
	 * Returns an effect from a generic array of effects like gamePage.bld.buildingsData
	 * Replacement for getEffect() method
	 */
	getMetaEffect: function(name, metadata){
		var totalEffect = 0;
		if (!metadata.meta){
			return 0;
		}
		for (var i = 0; i < metadata.meta.length; i++){
			var meta = metadata.meta[i];
			//
			// This is an ugly hack for managers like workshop or science
			// Ideally just a getter handler should be called there returning correct value
			//

			var effect;
			if (metadata.provider){
				effect = metadata.provider.getEffect(meta, name) || 0;
			} else {
				effect = meta.effects[name] || 0;

			}
			totalEffect += effect;
		}

		return totalEffect || 0;
	},

	getMeta: function(name, metadata){
		for (var i = 0; i < metadata.length; i++){
			var meta = metadata[i];

			if (meta.name == name){
				return meta;
			}
		}
		console.error("Could not find metadata for ", name, "in", metadata);
	},

	loadMetadata: function(meta, saveMeta, metaId){
		if (!saveMeta){
			console.trace();
			console.warn("Unable to load metadata table '" + metaId + "', save record is empty");
			return;
		}

		for(var i = 0; i < saveMeta.length; i++){
			var savedMetaElem = saveMeta[i];

			if (savedMetaElem != null){
				var elem = this.getMeta(savedMetaElem.name, meta);

				if (!elem) { continue; }

				for (var fld in savedMetaElem){
					if (fld == name) {
						continue;
					}
					if (!elem.hasOwnProperty(fld)){
						console.warn("Can't find elem." + fld + " in", elem);
					}
					if (savedMetaElem[fld] !== undefined) {
						if (savedMetaElem[fld] != null && typeof(savedMetaElem[fld]) == "object") {
							this.loadMetadata(elem[fld], savedMetaElem[fld]);
						} else {
							elem[fld] = savedMetaElem[fld];
						}
					}
				}
			}

		}
	},

	filterMetadata: function(meta, fields){
		var filtered = [];
		for(var i = 0; i < meta.length; i++){
			var clone = {};

			for (var j = 0; j < fields.length; j++){
				var fld = fields[j];
				/*if (!meta[i].hasOwnProperty(fld)){
					console.warn("Can't find elem." + fld + " in", meta[i]);
				}*/
				clone[fld] = meta[i][fld];
			}
			filtered.push(clone);
		}
		return filtered;
	},

	//TODO: add saveMetadata

	/**
	 * TODO: this logic is very confusing. Ideally the only place devs need to change should be building metadata.
	 */
	resetStateStackable: function(bld) {
		bld.val = 0;
		bld.on = 0;
		if (bld.noStackable == "undefined") {
			bld.noStackable = false;
		}
		if (bld.isAutomationEnabled != undefined) {
			bld.isAutomationEnabled = null;
		}

		// Automatic settings of togglable

		if (bld.lackResConvert != undefined) {
			// Exceptions (when convertion is caused by an upgrade)
			bld.togglable = true;
		}

		for (var effect in bld.effects) {
			if (effect == "energyConsumption" || effect == "magnetoRatio" || effect == "productionRatio") {
				// Exceptions (when energyConsumption is caused by an upgrade)
				bld.togglable = (bld.name == "oilWell" || bld.name == "biolab" || bld.name == "chronosphere" || bld.name == "aiCore") ? false : true;
			}
		}
	},

	resetStateResearch: function() {
		//TODO
	}
});

/**
 * Simple class from a right-sided console in the game UI
 *
 * TODO: all ui logic should be completely detached. Ideally game.msg should just post ("/msg") topic.
 */
dojo.declare("com.nuclearunicorn.game.log.Console", null, {
	static: {

		filters: {
			"astronomicalEvent": {
				title: $I("console.filter.astronomicalEvent"),
				enabled: true,
				unlocked: false
			},
			"hunt": {
				title: $I("console.filter.hunt"),
				enabled: true,
				unlocked: false
			},
			"trade": {
				title: $I("console.filter.trade"),
				enabled: true,
				unlocked: false
			},
			"craft": {
				title: $I("console.filter.craft"),
				enabled: true,
				unlocked: false
			},
			"workshopAutomation": {
				title: $I("console.filter.workshopAutomation"),
				enabled: true,
				unlocked: false
			},
			"meteor": {
				title: $I("console.filter.meteor"),
				enabled: true,
				unlocked: false
			},
			"ivoryMeteor": {
				title: $I("console.filter.ivoryMeteor"),
				enabled: true,
				unlocked: false
			},
			"unicornRift": {
				title: $I("console.filter.unicornRift"),
				enabled: true,
				unlocked: false
			},
			"unicornSacrifice": {
				title: $I("console.filter.unicornSacrifice"),
				enabled: true,
				unlocked: false
			},
			"alicornRift": {
				title: $I("console.filter.alicornRift"),
				enabled: true,
				unlocked: false
			},
			"alicornSacrifice": {
				title: $I("console.filter.alicornSacrifice"),
				enabled: true,
				unlocked: false
			},
			"alicornCorruption":{
				title: $I("console.filter.alicornCorruption"),
				enabled: true,
				unlocked: false
			},
			"tcShatter": {
				title: $I("console.filter.tcShatter"),
				enabled: true,
				unlocked: false
			},
			"tcRefine": {
				title: $I("console.filter.tcRefine"),
				enabled: true,
				unlocked: false
			},
			"faith": {
				title: $I("console.filter.faith"),
				enabled: true,
				unlocked: false
			},
			"elders": {
				title: $I("console.filter.elders"),
				enabled: true,
				unlocked: false
			}
		}
	},

	messages: null,
	maxMessages: 40,
	messageIdCounter: 0,
	ui: null,
	game: null,

	constructor: function(game) {
		this.game = game;
		this.messages = [];
		this.filters = dojo.clone(this.static.filters);
	},

	/**
	 * Prints message in the console. Returns a DOM node for the last created message
	 */
	msg : function(message, type, tag, noBullet) {
		 if (tag && this.filters[tag]){
            var filter = this.filters[tag];

            if (!filter.unlocked){
                filter.unlocked = true;
                this.ui.renderFilters();
            } else if (!filter.enabled){
                return;
            }
        }

		var hasCalendarTech = this.game.science.get("calendar").researched;

		var logmsg = {
			text: message,
			type: type,
			tag: tag,
			noBullet: noBullet,
			id: "consoleMessage_" + (this.messageIdCounter++),
			hasCalendarTech: hasCalendarTech,
			year: hasCalendarTech ? this.game.calendar.year.toLocaleString() : null,
			seasonTitle: hasCalendarTech ? this.game.calendar.getCurSeasonTitle() : null,
			seasonTitleShorten: hasCalendarTech ? this.game.calendar.getCurSeasonTitleShorten() : null

		};
		this.messages.push(logmsg);


		if (this.messages.length > this.maxMessages){
			this.messages.shift();
		}

		this.ui.renderConsoleLog();

		this.ui.notifyLogEvent(logmsg);

		return logmsg;
	},

	clear: function(){
		this.messages = [];
		this.ui.renderConsoleLog();
	},



	resetState: function (){
		for (var fId in this.filters){
			var filter = this.filters[fId];
			filter.unlocked = filter.defaultUnlocked || false;
			filter.enabled = true;
		}
		//TODO: find usage and call ui.renderFilters
		this.ui.renderFilters();
	},

	save: function(saveData){
		var saveFilters = {};
		for (var fId in this.filters) {
			var filter = this.filters[fId];
			saveFilters[fId] = {unlocked: filter.unlocked, enabled: filter.enabled};
		}

		saveData.console = {
			filters: saveFilters
		};
	},

	load: function(saveData){
		if (saveData.console && saveData.console.filters){
			for (var fId in saveData.console.filters){
				var savedFilter = saveData.console.filters[fId];

				if (this.filters[fId]) {
					this.filters[fId].unlocked = savedFilter.unlocked;
					this.filters[fId].enabled = savedFilter.enabled;
				}
			}
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.ButtonController", null, {
	game: null,
	controllerOpts: null,


	constructor: function(game, controllerOpts){
		this.game = game;
		if (!this.game) {
			throw new Error("The game instance must be defined for the controller");
		}
		this.controllerOpts = controllerOpts || {};
	},

	fetchModel: function(options) {
		var model = this.initModel(options);
		model.name = this.getName(model);
		model.description = this.getDescription(model);
		model.prices = this.getPrices(model);
		model.priceRatio = options.priceRatio;
		model.handler = options.handler;
		model.twoRow = options.twoRow;

		this.updateEnabled(model);
		this.updateVisible(model);

		return model;
	},

	fetchExtendedModel: function(model) {
		var prices = model.prices;
		var priceModels = [];

		if (prices) {
			for( var i = 0; i < prices.length; i++){
				var price = prices[i];
				priceModels.push(this.createPriceLineModel(model, price));

			}
		}
		model.priceModels = priceModels;
	},

	initModel: function(options) {
		var mdl = this.defaults();
		mdl.options = options;
		return mdl;
	},

	defaults: function() {
		return  {
			name: "",
			description: "",
			visible: true,
			enabled: true,
			handler: null,
			prices: null,
			priceRatio: null,
			twoRow: null,
			refundPercentage: 0.5,
			// ---
			highlightUnavailable: false,
			resourceIsLimited: "",
			multiplyEffects: false

		};
	},

	createPriceLineModel: function(model, price) {
		var res = this.game.resPool.get(price.name);
		return {
			title : res.title || res.name,
			name: price.name,
			val: price.val,
			progress: res.value / price.val,
			displayValue: this.game.getDisplayValueExt(price.val)
		};

	},

	hasResources: function(model, prices){
		if (!prices){
			prices = this.getPrices(model);
		}

		return this.game.resPool.hasRes(prices);
	},

	updateEnabled: function(model){
		model.enabled = this.hasResources(model, model.prices);
		model.highlightUnavailable = this.game.opts.highlightUnavailable;

		if (!this.game.opts.highlightUnavailable){
			return;
		}

		//---------------------------------------------------
		//		a bit hackish place for price highlight
		//---------------------------------------------------
		var limited = this.game.resPool.isStorageLimited(model.prices);
		//---- now highlight some stuff in vanilla js way ---
		model.resourceIsLimited = limited;
	},

	updateVisible: function(model) {
		//do nothing
		if (this.controllerOpts && this.controllerOpts.updateVisible) {
			this.controllerOpts.updateVisible.apply(this, arguments);
		}
	},

	getPrices: function(model){
		return model.options.prices || [];
	},

	getName: function(model){
		if (this.controllerOpts.getName){
			return this.controllerOpts.getName.apply(this, arguments);
		}
		return model.options.name;
	},

	getDescription: function(model){
		return model.options.description;
	},


	/**
	 * Deprecated method for price management (increases price property stored in button)
	 */
	adjustPrice:function(model, ratio ){
		var prices = this.getPrices(model);
		if (prices.length){
			for( var i = 0; i < prices.length; i++){
				var price = prices[i];

				price.val = price.val * ratio;
			}
		}

		this.game.render();
	},

	/**
	 * Deprecated method for price management (same as above, but decreases price on sale)
	 */
	rejustPrice: function(model, ratio){
		var prices = model.prices;
		if (prices.length){
			for( var i = 0; i < prices.length; i++){
				var price = prices[i];

				price.val = price.val / ratio;

			}
		}
		this.game.render();
	},

	payPrice: function(model) {
		this.game.resPool.payPrices(model.prices);
		model.prices = this.getPrices(model);
	},

	clickHandler: function(model, event){
		model.handler.apply(this, [model, event]);
	},

	buyItem: function(model, event, callback){
		if (model.enabled && this.hasResources(model)) {
			this.clickHandler(model, event);

			this.payPrice(model);

			if (model.priceRatio){
				this.adjustPrice(model.priceRatio);
			}

			callback(true);
		}
		callback(false);
	},

	refund: function(model){
		if (!model.prices.length){
			console.warn("unable to refund building, no prices specified in metadata :O");
			return;
		}
		for( var i = 0; i < model.prices.length; i++){
			var price = model.prices[i];

			var res = this.game.resPool.get(price.name);
			if (res.isRefundable(this.game) && !price.isTemporary) {
				this.game.resPool.addResEvent(price.name, price.val * model.refundPercentage);
			} else {
				// No refund at all
			}
		}
	}
});

/**
 * A base class for game button. Inventing the wheel since 2014
 */

dojo.declare("com.nuclearunicorn.game.ui.Button", com.nuclearunicorn.core.Control, {

	model: null,
	controller: null,
	game: null,

	//nodes

	domNode: null,
	container: null,

	tab: null,

	//--------------------
	//left part of the button
	buttonTitle: null,

	constructor: function(opts, game){
		this.game = game;

		this.setOpts(opts);
		this.init();
	},

	setOpts: function(opts){
		this.id = opts.id;
		this.controller = opts.controller;
		if (!this.controller) {
			throw new Error("Controller must be defined for the button");
		}
		//this.model = this.controller.fetchModel(opts);

		//screw this
		this.opts = opts;
	},

	//required by BuildingButton
	init: function(){

	},

	updateVisible: function(){
		if (!this.domNode){
			return;
		}

		// locked structures are invisible
		if (this.model.visible){
			if (this.domNode.style.display === "none"){
				this.domNode.style.display = "block";
			}
		} else {
			if (this.domNode.style.display === "block"){
				this.domNode.style.display = "none";
			}
		}
	},

	updateEnabled: function(){
		if ( this.domNode ){
			var hasClass = dojo.hasClass(this.domNode, "disabled");
			var hasClassLimited = dojo.hasClass(this.domNode, "limited");
			if (this.model.enabled){
				if (hasClass){
					dojo.removeClass(this.domNode, "disabled");
				}
				if (hasClassLimited){
					dojo.removeClass(this.domNode, "limited");
				}
			} else {
				if (!hasClass){
					dojo.addClass(this.domNode, "disabled");
				}
				if (!hasClassLimited && this.model.resourceIsLimited){
					dojo.addClass(this.domNode, "limited");
				}
			}			
		}
		//---------------------------------------------------
		//		a bit hackish place for price highlight
		//---------------------------------------------------
		//---- now highlight some stuff in vanilla js way ---
	},

	update: function() {
		this.model = this.controller.fetchModel(this.opts);
		this.updateEnabled();
		this.updateVisible();

		if (this.buttonTitle && this.buttonTitle.innerHTML != this.model.name){
			this.buttonTitle.innerHTML = this.model.name;
		}
	},


	/**
	 * Renders button. Method is usually called once the tab is created.
	 */
	render: function(btnContainer){
		this.model = this.controller.fetchModel(this.opts);

		this.container = btnContainer;

		this.domNode = dojo.create("div", {
			style: {
				position: "relative",
				display: this.model.visible ? "block" : "none"
			}
		}, btnContainer);

		if (this.model.twoRow) {
			dojo.style(this.domNode, "marginLeft", "auto");
			dojo.style(this.domNode, "marginRight", "auto");
		}

		this.buttonContent = dojo.create("div", {
			className: "btnContent",
			title: this.model.description
		}, this.domNode);

		this.buttonTitle = dojo.create("span", {
			innerHTML: this.model.name,
			className: "btnTitle",
			style: {}
		}, this.buttonContent);

		this.domNode.className = "btn nosel";

		if (!this.model.enabled){
			this.domNode.className += " disabled";
		}

		this.updateVisible();

		dojo.connect(this.domNode, "onclick", this, "onClick");

		this.afterRender();
	},

	animate: function(){
		var btnNode = jQuery(this.domNode);

		btnNode.animate({
			opacity: 0.5
		}, 70, function(){
			btnNode.animate({
				opacity: 1.0
			}, 70);
		});
	},

	onClick: function(event){
		this.animate();
		var self = this;
		this.controller.buyItem(this.model, event, function(result) {
			if (result) {
				self.update();
			}
		});

	},

	afterRender: function(){

		var prices = this.model.prices;
		if (prices.length && !this.tooltip){

			var tooltip = dojo.create("div", {
			classname: "button_tooltip",
			style: {
				display: 	"none",
				border: 	"1px solid black",
				marginLeft:	"4px",

				padding: 	"5px",
				position:   "absolute",

				left: "170px",
				top: "-1px",

				width: "120px"

			}}, this.domNode);

			/**
			 * Create prices tooltip and store it inside of the button DOM node
			 */


			var tooltipPricesNodes = [];

			for( var i = 0; i < prices.length; i++){
				var price = prices[i];

				var priceItemNode = dojo.create("div", {
						style : {
							overflow: "hidden"
						}
					}, tooltip);

				var nameSpan = dojo.create("span", { innerHTML: price.title, style: { float: "left"} }, priceItemNode );
				var priceSpan = dojo.create("span", { innerHTML: price.displayValue, style: {float: "right" } }, priceItemNode );

				tooltipPricesNodes.push({ "name" : nameSpan, "price": priceSpan});
			}

			dojo.connect(this.domNode, "onmouseover", this, dojo.partial(function(tooltip){ dojo.style(tooltip, "display", ""); }, tooltip));
			dojo.connect(this.domNode, "onmouseout", this,  dojo.partial(function(tooltip){ dojo.style(tooltip, "display", "none"); }, tooltip));

			this.tooltip = tooltip;
			this.tooltipPricesNodes = tooltipPricesNodes;
		}
	},

	//Fast access snippet to create button links like "on", "off", "sell", etc.
	addLink: function(linkModel) {

		var longTitleClass = (linkModel.title.length > 4) ? "small" : "";
		var link = dojo.create("a", {
				href: "#",
				innerHTML: linkModel.title,
				className: longTitleClass + (linkModel.cssClass ? (" " + linkModel.cssClass) : ""),
				style:{
					paddingLeft: "2px",
					float: "right",
					cursor: "pointer"
				}
			}, null);

		var linkHandler = dojo.connect(link, "onclick", this, dojo.partial(function(handler, event){
			event.stopPropagation();
			event.preventDefault();

			var self = this;
			this.animate();
			// FIXME should as easy as handler.apply(this, [args...])
			dojo.hitch(this, handler, event, function(result) {
				if (result) {
					self.update();
				}
			})();


		}, linkModel.handler));

		dojo.place(link, this.buttonContent);

		return {
			link: link,
			linkHandler: linkHandler
		};
	},

	/*
	 * Add a link control with a collapsible menu of other links
	 */
	addLinkList: function(links){
		var linkList = {};

		var linksDiv = dojo.create("div", {
			style: {
				float: "right"
			}
		}, this.buttonContent);

		var linksTooltip = dojo.create("div", {
			className: "linkContent",
			style: {
				display: "none",
				position: "absolute",
				float: "right",
				marginTop: "35px",
				zIndex: "100"
			},
		}, linksDiv);

		//linksTooltip.innerHTML = "<div>FOO</div><div>BAR</div><div>BAZ</div>";

		if (!links.length){
			return linkList;
		}
		//------------- root href --------------
		var link = dojo.create("a", {
			href: "#",
			className: links[0].id ? (links[0].id + "Link") : "",
			style: {
				display: "block",
				float: "right"
			},
			innerHTML: links[0].title,
			title: links[0].alt || links[0].title
		}, linksDiv);

		linksTooltip.style.left = link.offsetLeft + 'px'; //hack hack hack

		dojo.connect(link, "onclick", this, dojo.partial(function(handler, event){
			event.stopPropagation();
			event.preventDefault();

			dojo.hitch(this, handler)();

			this.update();
		}, links[0].handler));

		linkList[links[0].id] = { link : link };

		if (links.length <= 1){
			return linkList;
		}

		//-----------dropdown

		dojo.connect(linksDiv, "onmouseover", this, dojo.partial(function(tooltip){ dojo.style(tooltip, "display", "block"); }, linksTooltip));
		dojo.connect(linksDiv, "onmouseout", this,  dojo.partial(function(tooltip){ dojo.style(tooltip, "display", "none"); }, linksTooltip));

		for (var i = 1; i < links.length; i++){

			var link = dojo.create("a", {
				href: "#",
				innerHTML: links[i].title,
				title: links[i].alt || links[i].title,
				className:"dropdown-link",
				style:{
					display: "block",
				}
			}, linksTooltip);

			dojo.connect(link, "onclick", this, dojo.partial(function(handler, event){
				event.stopPropagation();
				event.preventDefault();

				dojo.hitch(this, handler)();

				this.update();
			}, links[i].handler));
			linkList[links[i].id] = { link : link };
		}

		return linkList;
	}
});



dojo.declare("com.nuclearunicorn.game.ui.ButtonModernController", com.nuclearunicorn.game.ui.ButtonController, {

	defaults: function() {
		var result = this.inherited(arguments);

		result.simplePrices = true;
		result.hasResourceHover = false;
		result.tooltipName = false;
		return result;
	},

	getFlavor: function(model){
		return undefined;
	},

	getEffects: function(model){
		return undefined;
	},

	getNextEffectValue: function(model, effectName) {
		return undefined;
	},

	createPriceLineModel: function(model, price) {
		return this._createPriceLineModel(price, model.simplePrices);
	},

	_createPriceLineModel: function(price, simplePrices, indent) {
		var res = this.game.resPool.get(price.name);
		var hasRes = res.value >= price.val;

		var hasLimitIssue = res.maxValue && ((price.val > res.maxValue && !indent) || price.baseVal > res.maxValue);
		var asterisk = hasLimitIssue ? "*" : "";	//mark limit issues with asterisk

		var displayValue = hasRes || simplePrices
				? this.game.getDisplayValueExt(price.val)
				: this.game.getDisplayValueExt(res.value) + " / " + this.game.getDisplayValueExt(price.val) + asterisk;
		var resPerTick = this.game.getResourcePerTick(res.name, true);
		var eta = 0;
		if (!hasRes && resPerTick > 0 && !simplePrices) {
			eta = (price.val - res.value) / (resPerTick * this.game.getTicksPerSecondUI());
			if (eta >= 1) {
				displayValue += " (" + this.game.toDisplaySeconds(eta) + ")";
			}
		}

		if (!indent) {
			indent = 0;
		}

		var result = {
			title : res.title || res.name,
			name: price.name,
			val: price.val,
			hasResources: hasRes,
			displayValue: displayValue,
			indent: indent,
			eta: eta,
			hasLimitIssue: hasLimitIssue
		};


		//unroll prices to the raw resources
		if (!hasRes && res.craftable && !simplePrices && res.name != "wood") {
			var craft = this.game.workshop.getCraft(res.name);
			if (craft.unlocked) {
				var craftRatio = this.game.getResCraftRatio(res.name);
				result.title = "+ " + result.title;
				result.children = [];

				var components = this.game.workshop.getCraftPrice(craft);
				for (var j in components) {

					var diff = price.val - res.value;

					// Round up to the nearest craftable amount
					var val = Math.ceil(components[j].val * diff / (1 + craftRatio));
					var remainder = val % components[j].val;
					if (remainder != 0) {
						val += components[j].val - remainder;
					}

					var comp = {name: components[j].name, val: val, baseVal: components[j].val};

					var compResult = this._createPriceLineModel(comp, simplePrices, indent + 1);
					result.children.push(compResult);
				}
			}
		}
		return result;
	},

	fetchExtendedModel: function(model) {
		this.inherited(arguments);
		model.flavor = this.getFlavor(model);
		this.updateEffectModels(model);
	},

	updateEffectModels: function(model) {
		var effectsList = this.getEffects(model);
		model.effectModels = [];
		if (!effectsList || Object.keys(effectsList).length === 0) {
			return;
		}

		//-----------------------------------------
		var isEffectMultiplierEnabled = model.multiplyEffects && this.game.ui.isEffectMultiplierEnabled();
		var valMultiplier = isEffectMultiplierEnabled && model.metadata ? model.metadata.on : 1;
		for (var effectName in effectsList) {
			var effectMeta = this.game.getEffectMeta(effectName);
			if(effectMeta.type === "hidden") {continue;}
			if (effectMeta.resName && !this.game.resPool.get(effectMeta.resName).unlocked) {
				continue;	//hide resource-related effects if we did not unlocked this effect yet
			}

			var effectValue = effectsList[effectName] * (effectMeta.calculation === "constant" ? 1 : valMultiplier);
			if (!isEffectMultiplierEnabled && effectMeta.calculation === "nonProportional") {
				var nextEffectValue = this.getNextEffectValue(model, effectName);
				if (nextEffectValue) {
					effectValue = nextEffectValue * (model.metadata.on + 1) - effectValue * model.metadata.on;
				}
			}
			if (!effectValue) {
				continue;
			}

			var displayEffectName = effectMeta.title;

			var displayEffectValue = "";

			//display resMax values with global ratios like Refrigeration and Paragon
			if (effectName.substr(-3) === "Max" || effectName.substr(-12) == "MaxChallenge") {
				var res = this.game.resPool.get(effectMeta.resName || effectName.slice(0, -3));
				if (res) { // If res is a resource and not just a variable
					effectValue = this.game.resPool.addResMaxRatios(res, effectValue);
				}
			}

			if (effectMeta.type === "perTick" && this.game.opts.usePerSecondValues) {
				// avoid mantisa if we can, later on this can be changed to show scaled up values, e.g. minutes, hours
				var tempVal = Math.abs(effectValue * this.game.ticksPerSecond), precision;
				if (tempVal >= 0.001) {
					precision = tempVal < 0.01 ? 3 : 2;
					displayEffectValue = this.game.getDisplayValueExt(
						effectValue * this.game.ticksPerSecond, false, false, precision) + "/" + $I("unit.sec");
				} else {
					displayEffectValue = this.game.getDisplayValueExt(
						effectValue * this.game.ticksPerSecond * 3600, false, false, 2) + "/" + $I("unit.h");
				}
			} else if (effectMeta.type === "perDay"){
				displayEffectValue = this.game.getDisplayValueExt(effectValue) + "/" + $I("unit.day");
			} else if (effectMeta.type === "perYear"){
				displayEffectValue = this.game.getDisplayValueExt(effectValue) + "/" + $I("unit.year");
			} else if ( effectMeta.type === "ratio" ) {
				displayEffectValue = this.game.toDisplayPercentage(effectValue, 2 , false) + "%";
			} else if ( effectMeta.type === "integerRatio" ){
				displayEffectValue = this.game.getDisplayValueExt(effectValue) + "%";
			} else if ( effectMeta.type === "energy" ){
				displayEffectValue = this.game.getDisplayValueExt(effectValue) + $I("unit.watt");
			} else {
				displayEffectValue = this.game.getDisplayValueExt(effectValue);
			}

			model.effectModels.push({
				displayEffectName: displayEffectName,
				displayEffectValue: displayEffectValue
			});
		}
	},

	isPrecraftAvailable: function(model){
		for (var i in model.prices){
			var price = model.prices[i];
			var res = this.game.resPool.get(price.name);
			if (res.craftable){
				return true;
			}
		}
		return false;
	},

	precraft: function(model){
		this.fetchExtendedModel(model);
		for (var i in model.priceModels){
			var price = model.priceModels[i];
			this._precraftRes(price);
		}
	},

	_precraftRes: function(price) {
		if (price.children) {
			for (var i in price.children) {
				this._precraftRes(price.children[i]);
			}
		}

		var res = this.game.resPool.get(price.name);
		if (res.craftable && res.name != "wood" && this.game.workshop.getCraft(res.name).unlocked) {
			var amt = price.val - res.value;
			if (amt > 0) {
				var baseAmt = amt / (1 + this.game.getResCraftRatio(res.name));
				this.game.workshop.craft(res.name, baseAmt, false /*no undo*/, true /*force all*/);
			}
		}
	}
});

ButtonModernHelper = {
	getTooltipHTML : function(controller, model){
		controller.fetchExtendedModel(model);
		//throw "ButtonModern::getTooltipHTML must be implemented";

		var tooltip = dojo.create("div", { className: "tooltip-inner" }, null);


		if (model.tooltipName) {
			dojo.create("div", {
				innerHTML: model.name,
				className: "tooltip-divider"
			}, tooltip);
		}

		// description
		var descDiv = dojo.create("div", {
			innerHTML: model.description,
			className: "desc"
		}, tooltip);


		if (model.metadata && model.metadata.isAutomationEnabled !== undefined){	//TODO: use proper metadata flag
			dojo.create("div", {
				innerHTML: model.metadata.isAutomationEnabled ? $I("btn.aon.tooltip") : $I("btn.aoff.tooltip"),
				className: "desc small" + (model.metadata.isAutomationEnabled ? " auto-on" : " auto-off")
			}, tooltip);
		}

		if (model.metadata && model.metadata.effects && 
			model.metadata.effects["cathPollutionPerTickProd"] > 0 &&
			controller.game.science.get("chemistry").researched && !controller.game.opts.disablePollution
		){
			dojo.create("div", {
				innerHTML: $I("btn.pollution.tooltip"),
				className: "desc small pollution"
			}, tooltip);
		}

		if (model.metadata && model.metadata.almostLimited){
			dojo.create("div", {
				innerHTML: $I("btn.almostlimited.tooltip"),
				className: "desc small almostlimited"
			}, tooltip);
		}

		var prices = model.priceModels;
		var effects = model.effectModels;
		var flavor = model.flavor;
		if (prices && prices != "" || effects || flavor && flavor != ""){
			dojo.style(descDiv, "paddingBottom", "8px");

			// prices
			if (prices && prices.length){
				dojo.style(descDiv, "borderBottom", "1px solid gray");
				ButtonModernHelper.renderPrices(tooltip, model);	//simple prices
			}

			// effects

			if (effects){
				ButtonModernHelper.renderEffects(tooltip, effects);
			}

			// flavor

			if (flavor && flavor != "") {
				dojo.create("div", {
					innerHTML: flavor,
					className: "flavor",
					style: {
						paddingTop: "20px",
						fontSize: "12px",
						fontStyle: "italic"
				}}, tooltip);
			}

		} else {
			dojo.style(descDiv, "paddingBottom", "4px");
		}

		return tooltip.outerHTML;
	},

	renderPrices : function(tooltip, model){
		var prices = model.priceModels;
		if (!prices.length){
			return;
		}
		for( var i = 0; i < prices.length; i++){
			var price = prices[i];
			var span = ButtonModernHelper._renderPriceLine(tooltip, price);
		}
	},

	_renderPriceLine : function(tooltip, price) {
		var priceItemNode = dojo.create("div", {
				className: "price-block",
				style : {
					overflow: "hidden"
				}
			}, tooltip);

		var nameSpan = dojo.create("span", { innerHTML: price.title, style: { float: "left", paddingRight: "10px"} }, priceItemNode );

		var priceSpan = dojo.create("span", {
			innerHTML: price.displayValue,
			className: price.hasResources ? "" : "noRes",
			style: {
				float: "right"
			}
		}, priceItemNode );

		if (price.children && price.children.length) {
			for (var i = 0; i < price.children.length; i++ ) {
				var compSpan = this._renderPriceLine(tooltip, price.children[i]);
				for (var k = 0; k < price.children[i].indent; ++k) {
					compSpan.name.innerHTML = "&nbsp;&nbsp;&nbsp;" + compSpan.name.innerHTML;
				}
				//mark unrolled price component as raw
				compSpan.name.className = "rawRes";
			}

		}
		return {name: nameSpan, price: priceSpan};
	},

	renderEffects : function(tooltip, effectsList, hideTitle){
		if (!effectsList || !effectsList.length) {
			return;
		}

		if (!hideTitle){
			dojo.create("div", {
				innerHTML: $I("res.effects") + ":",
				className: "tooltip-divider" + " resEffectsTxt",
				style: {
					textAlign: "center",
					width: "100%",
					borderBottom: "1px solid gray",
					paddingBottom: "4px",
					marginBottom: "8px"
			}}, tooltip);
		}

		//-----------------------------------------

		for (var i = 0; i < effectsList.length; i++) {
			var effectModel = effectsList[i];
			var nameSpan = dojo.create("div", {
				innerHTML: effectModel.displayEffectName + ": " + effectModel.displayEffectValue,
				className: "effectName"
			}, tooltip);
		}
	}
};

/*
 * Restyled button with slightly more sophisticated tooltip mechanism
 */

dojo.declare("com.nuclearunicorn.game.ui.ButtonModern", com.nuclearunicorn.game.ui.Button, {

	afterRender: function(){
		dojo.addClass(this.domNode, "modern");

		this.renderLinks();
		this.attachTooltip(dojo.partial(this.getTooltipHTML(), this.controller, this.model));

		this.buttonContent.title = "";	//no old title for modern buttons :V

		if (this.model.hasResourceHover) {
			dojo.connect(this.domNode, "onmouseover", this,
				dojo.hitch( this, function(){
					this.game.setSelectedObject(this.getSelectedObject());
				}));
			dojo.connect(this.domNode, "onmouseout", this,
				dojo.hitch( this, function(){
					this.game.clearSelectedObject();
				}));
		}
	},

	getTooltipHTML: function(){
		return ButtonModernHelper.getTooltipHTML;
	},

	attachTooltip: function(htmlProvider) {
		var tooltip = dojo.byId("tooltip");
		var btn = this;
		var container = this.domNode;

		dojo.connect(container, "onmouseover", this, function() {
			this.game.tooltipUpdateFunc = function(){
				btn.updateTooltip(container, tooltip, htmlProvider);
			};
			this.game.tooltipUpdateFunc();

			var pos = $(container).position();
			pos.left += 300;

			//prevent tooltip from leaving the window area
			var maxTooltipTop = $(window).scrollTop() + $(window).height() - $(tooltip).height() - 50; //50px padding-bottom
			var maxTooltipLeft = $(window).scrollLeft() + $(window).width() - $(tooltip).width() - 25; //25px padding-right

			if (pos.left <= maxTooltipLeft) {
				pos.top = Math.min(pos.top + 15, maxTooltipTop);
			} else {
				pos.left = maxTooltipLeft;
				var vOffset = 35;
				if (pos.top + vOffset <= maxTooltipTop) {
					pos.top += vOffset;
				} else {
					pos.top -= $(tooltip).height() + 10;
				}
			}

			dojo.style(tooltip, "top", pos.top + "px");
			dojo.style(tooltip, "left", pos.left + "px");

			dojo.style(tooltip, "display", "");
		});

		dojo.connect(container, "onmouseout", this, function(){
			this.game.tooltipUpdateFunc = null;
			dojo.style(tooltip, "display", "none");
		});
	},

	updateTooltip: function(container, tooltip, htmlProvider){
		tooltip.innerHTML = dojo.hitch(this, htmlProvider)();
	},

	renderLinks: function(){
		//do nothing, implement me
	},

	updateLink: function(buttonLink, modelLink) {
		if (buttonLink) {
			buttonLink.link.textContent = modelLink.title;
			if (modelLink.cssClass) {buttonLink.link.className = modelLink.cssClass;}
			if (modelLink.tooltip) {buttonLink.link.title = modelLink.tooltip;}
			dojo.style(buttonLink.link, "display", modelLink.visible === undefined || modelLink.visible ? "" : "none");
		}
	},

	getSelectedObject: function(){
		return this.model;
	}
});


dojo.declare("com.nuclearunicorn.game.ui.BuildingBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {

	initModel: function(options) {
		var model = this.inherited(arguments);
		model.metadata = this.getMetadata(model);
		return model;
	},

	fetchModel: function(options) {
		var model = this.inherited(arguments);
		model.hasSellLink = this.hasSellLink(model);
		model.showSellLink = model.metadata && model.metadata.val && model.hasSellLink;
		var self = this;
		if (typeof(model.metadata.togglableOnOff) != "undefined") {
			model.togglableOnOffLink = {
				title:  model.metadata.on ? $I("btn.on.minor") : $I("btn.off.minor"),
				tooltip: model.metadata.on ? $I("btn.on.tooltip") : $I("btn.off.tooltip"),
				cssClass: model.metadata.on ? "bld-on" : "bld-off",
				//reserved for mobile
				enabled: model.metadata.val > 0,
				handler: function(btn){
					self.handleTogglableOnOffClick(model);
				}
			};
		}
		if (typeof(model.metadata.isAutomationEnabled) != "undefined" && model.metadata.isAutomationEnabled !== null) {
			model.toggleAutomationLink = {
				title: model.metadata.isAutomationEnabled ? "A" : "*",
				tooltip: model.metadata.isAutomationEnabled ? $I("btn.aon.tooltip") : $I("btn.aoff.tooltip"),
				//reserved for mobile
				enabled: model.metadata.val > 0,
				cssClass: model.metadata.isAutomationEnabled ? "auto-on" : "auto-off",
				handler: function(btn){
					self.handleToggleAutomationLinkClick(model);
				}
			};
		}
		model.togglable = model.metadata.togglable;
		if (typeof(model.metadata.on) != "undefined") {
			model.on = model.metadata.on;
		}
		model.hasResourceHover = true;
		return model;
	},


	getMetadata: function(model){
		if (this.model.options.building){
			var meta = this.game.bld.get(this.model.options.building);
			return meta;
		}
		return null;
	},

	getEffects: function(model){
		return model.metadata.effects;
	},

	getNextEffectValue: function(model, effectName) {
		var underlying = model.metadata;
		if (!underlying.updateEffects) {
			return undefined;
		}

		underlying.on++;
		underlying.updateEffects(underlying, this.game);
		var nextEffectValue = underlying.effects[effectName];
		underlying.on--;
		underlying.updateEffects(underlying, this.game);
		return nextEffectValue;
	},

	getDescription: function(model){
		var description = model.metadata.description;
		return typeof(description) != "undefined" ? description : "";
	},

	getFlavor: function(model){
		var flavor = model.metadata.flavor;
		return typeof(flavor) != "undefined" ? flavor : "";
	},

	hasSellLink: function(model){
		return false;
	},

	metadataHasChanged: function(model) {
		// do nothing
	},

	off: function(model, amt) {
		amt = amt || 1;

		var building = model.metadata;
		if (amt > building.on){
			amt = building.on;
		}

		if (building.on >= amt){
			building.on -= amt;
			if(building.stages){
				model.metaAccessor.meta.on -= amt; //stage hack
			}
			this.metadataHasChanged(model);
			this.game.upgrade(building.upgrades);
		}
	},

	offAll: function(model) {
		var building = model.metadata;
		if (building.on){
			building.on = 0;
			if(building.stages){
				model.metaAccessor.meta.on = 0; //stage hack
			}
			this.metadataHasChanged(model);
			this.game.upgrade(building.upgrades);
		}
	},


	on: function(model, amt) {
		amt = amt || 1;


		var building = model.metadata;
		if (amt > building.val - building.on){
			amt = building.val - building.on;
		}

		if (building.on + amt <= building.val ){
			building.on += amt;
			if(building.stages){
				model.metaAccessor.meta.on += amt; //stage hack
			}
			this.metadataHasChanged(model);
			this.game.upgrade(building.upgrades);
		}
	},

	onAll: function(model) {
		var building = model.metadata;
		if (building.on < building.val) {
			building.on = building.val;
			if(building.stages){
				model.metaAccessor.meta.on = building.val; //stage hack
			}
			this.metadataHasChanged(model);
			this.game.upgrade(building.upgrades);
		}
	},

	/**
	 * Returns true if building was sold
	 */
	sell: function(event, model){
		var building = model.metadata;

		// Allow buildings to override sell button with custom actions
		// But, proceed with normal action as well if true returned.
		if (building.canSell) {
			if(!building.canSell(building, this.game)) {
				return false;
			}
		}

		var end = building.val - 1;
		if (end > 0 && event && event.shiftKey) { //no need to confirm if selling just 1
			end = 0;
			if (this.game.opts.noConfirm) {
				this.sellInternal(model, end);
				return true;
			} else {
				var self = this;
				this.game.ui.confirm($("sell.all.confirmation.title"), $I("sell.all.confirmation.msg"), function() {
					self.sellInternal(model, end);
					return true;
				});
			}
		} else if (end >= 0) {
			this.sellInternal(model, end);
			return true;
		}
	},

	sellInternal: function(model, end){
		var building = model.metadata;
		while (  building.val > end /*&& this.hasSellLink(model)*/ ) { //religion upgrades can't sell past 1
			this.decrementValue(model);

			model.prices = this.getPrices(model);
			this.refund(model);
		}

		this.game.upgrade(building.upgrades);
		this.game.render();
	},

	decrementValue: function(model) {
		var building = model.metadata;
		if (building)
		{building.val--;}
		if (building.on > building.val){
			building.on = building.val;
		}
	},


	updateVisible: function(model) {
		model.visible = model.metadata.unlocked || this.game.devMode;
	},

	handleTogglableOnOffClick: function(model) {
		var building = model.metadata;

		building.on = building.on ? 0 : building.val;	//legacy safe switch
		this.game.upgrade(building.upgrades);
	},

	handleToggleAutomationLinkClick: function(model) {
		var building = model.metadata;
		building.isAutomationEnabled = !building.isAutomationEnabled;
		this.game.upgrade({buildings: [building.name]});
	}
});

dojo.declare("com.nuclearunicorn.game.ui.BuildingBtn", com.nuclearunicorn.game.ui.ButtonModern, {
	sellHref: null,
	toggleHref: null,

	/**
	 * Render button links like off/on and sell
	 */
	renderLinks: function(){
		var building = this.model.metadata;

		//var sellLinkAdded = false;
		if (this.model.showSellLink){
			if (!this.sellHref){
				this.sellHref = this.addLink({
					title: $I("btn.sell.minor"),
					handler: function(event) {
						this.sell(event);
					}
				});
				//var sellLinkAdded = true;
				dojo.addClass(this.domNode, "hasSellLink");
			}
		}

		//--------------- style -------------
		if((building.val > 9 || building.name.length > 10) && this.model.hasSellLink) {
			//Steamworks and accelerator specifically can be too large when sell button is on
			//(tested to support max 99 bld count)
			dojo.addClass(this.domNode, "small-text");
		}

		//--------------- toggle ------------
		if (typeof(this.model.togglable) != "undefined" && this.model.togglable){
			this.remove = this.addLinkList([
			   {
				id: "off1",
				title: "-",
				handler: function(){
					this.controller.off(this.model);
				}
			   },
			   {
				id: "off25",
				title: "-25",
				handler: function(){
					this.controller.off(this.model,25);
				}
			   },
			   {
				id: "offAll",
				title: "-" + $I("btn.all.minor"),
				handler: function(){
					this.controller.offAll(this.model);
				}
			   }]
			);

			this.add = this.addLinkList([
			   {
				id: "add1",
				title: "+",
				handler: function(){
					this.controller.on(this.model);
				}
			   },
			   {
				id: "add25",
				title: "+25",
				handler: function(){
					this.controller.on(this.model,25);
				}
			   },
			   {
				id: "add",
				title: "+" + $I("btn.all.minor"),
				handler: function(){
					this.controller.onAll(this.model);
				}
			   }]
			);
		}

		if (this.model.togglableOnOffLink){
			this.toggle = this.addLink(this.model.togglableOnOffLink);
		}

		if (this.model.toggleAutomationLink){
			this.toggleAutomation = this.addLink(this.model.toggleAutomationLink);
		}
	},

	sell: function(event){
		this.controller.sell(event, this.model);
	},

	update: function(){
		this.inherited(arguments);

		//we are calling update before render, panic flee
		if (!this.buttonContent){
			return;
		}

		var building = this.model.metadata;
		if (building && building.val){

			// -------------- sell ----------------
			if (this.sellHref){
				dojo.style(this.sellHref.link, "display", (building.val > 0) ? "" : "none");
			}

			//--------------- style -------------
			if(building.val > 9) {
				dojo.style(this.domNode,"font-size","90%");
			}

			if (this.toggle || this.remove || this.add) {
				dojo.removeClass(this.domNode, "bldEnabled");
				dojo.removeClass(this.domNode, "bldlackResConvert");
				if (building.lackResConvert) {
					dojo.toggleClass(this.domNode, "bldlackResConvert", building.on > 0);
				} else {
					dojo.toggleClass(this.domNode, "bldEnabled", building.on > 0);
				}
			}

			//--------------- toggle ------------
			if (this.add) {
				dojo.toggleClass(this.add["add1"].link, "enabled", building.on < building.val);
			}

			this.updateLink(this.toggle, this.model.togglableOnOffLink);
			this.updateLink(this.toggleAutomation, this.model.toggleAutomationLink);
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.BuildingStackableBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {
	defaults: function(){
		var result = this.inherited(arguments);
		result.simplePrices = false;
		result.multiplyEffects = true;
		return result;
	},

	getName: function(model){
		var meta = model.metadata;

		if (!meta.val) {
			return meta.label;
		} else if (meta.noStackable){
			return meta.label + " " + $I("btn.complete");
		} else if (meta.togglableOnOff){
			return meta.label + " (" + meta.val + ")";
		} else if (meta.togglable) {
			//it's not so important h
			/*if (meta.val >= 1000){
				return meta.label + " (" +
					(meta.on < 10000 ? ((meta.on/1000).toFixed(1) + "K") : this.game.getDisplayValueExt(meta.on)) + "/" +
					(meta.val < 10000 ? ((meta.val/1000).toFixed(1) + "K") : this.game.getDisplayValueExt(meta.val)) +
				")";
			}*/
			return meta.label + " (" + meta.on + "/" + meta.val + ")";
		} else {
			return meta.label + " (" + meta.on + ")";
		}
	},

	getPrices: function(model){
		var meta = model.metadata;
        var ratio = meta.priceRatio || 1;
        var prices = [];
		var pricesDiscount = this.game.getLimitedDR((this.game.getEffect(meta.name + "CostReduction")), 1);
		var priceModifier = 1 - pricesDiscount;

        for (var i = 0; i < meta.prices.length; i++){
			var resPriceDiscount = this.game.getEffect(meta.prices[i].name + "CostReduction");
			resPriceDiscount = this.game.getLimitedDR(resPriceDiscount, 1);
			var resPriceModifier = 1 - resPriceDiscount;
            prices.push({
            	val: meta.prices[i].val * Math.pow(ratio, meta.val) * resPriceModifier * priceModifier,
            	name: meta.prices[i].name
			});
        }
        return prices;
    },




	updateEnabled: function(model){
		this.inherited(arguments);
		var meta = model.metadata;
		// Beginning with exceptions
		if (typeof(meta.limitBuild) == "number" && meta.limitBuild <= meta.val) {
			model.enabled = false;
		} else if (!meta.on || meta.on && !meta.noStackable) {
			// do nothing
		} else if (meta.on && meta.noStackable){
			model.enabled = false;
		}

	},

	buyItem: function(model, event, callback) {
		if (model.enabled && this.hasResources(model) || this.game.devMode) {
			var meta = model.metadata;
			if (this.game.ironWill && meta.effects && meta.effects["maxKittens"] > 0 && this.game.science.get("archery").researched) {
				var self = this;
				this.game.ui.confirm("", $I("iron.will.break.confirmation.msg"), function() {
					self._buyItem_step2(model, event, callback);
				}, function() {
					callback(false);
				});
			} else {
				this._buyItem_step2(model, event, callback);
			}
		} else {
			callback(false);
		}
	},

	_buyItem_step2: function(model, event, callback) {
		var meta = model.metadata;
		if (!meta.noStackable && event.shiftKey) {
			var maxBld = 10000;
			if (this.game.opts.noConfirm) {
				this.build(model, maxBld);
				callback(true);
			} else {
				var self = this;
				this.game.ui.confirm($I("construct.all.confirmation.title"), $I("construct.all.confirmation.msg"), function() {
					self.build(model, maxBld);
					callback(true);
				}, function() {
					callback(false);
				});
			}
		} else if (!meta.noStackable && (event.ctrlKey || event.metaKey /*osx tears*/)) {
			this.build(model, this.game.opts.batchSize || 10);
			callback(true);
		} else {
            this.build(model, 1);
            callback(true);
        }
	},

	build: function(model, maxBld){
		var meta = model.metadata;
		var counter = 0;
		if (typeof meta.limitBuild == "number" && meta.limitBuild - meta.val < maxBld){
			maxBld = meta.limitBuild - meta.val;
		}

        if (model.enabled && this.hasResources(model) || this.game.devMode ){
	        while (this.hasResources(model) && maxBld > 0){
				this.incrementValue(model);
				this.payPrice(model);

	            counter++;
	            maxBld--;
	        }

	        if (counter > 1) {
		        this.game.msg($I("construct.all.msg", [meta.label, counter]), "notice");
			}

			if (meta.breakIronWill) {
				this.game.ironWill = false;
				var liberty = this.game.science.getPolicy("liberty");
				liberty.calculateEffects(liberty, this.game);
				var zebraOutpostMeta = this.game.bld.getBuildingExt("zebraOutpost").meta;
				zebraOutpostMeta.calculateEffects(zebraOutpostMeta, this.game);
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
        }

		return counter;
    },

    incrementValue: function(model) {
		var meta = model.metadata;
		var allOff = meta.val > 0 && meta.on == 0;
		meta.val++;
		meta.on++;

		// don't turn on the new building if it's .togglable or .togglableOnOff, you already built at least 1, and all were off before,
		// or if it's .togglableOnOff, it's your first, and you don't have paragon
		// (because steamworks isn't useful without upgrades so we don't want to confuse new players)
		if ((meta.togglableOnOff && (allOff || (meta.val == 1 && this.game.resPool.get("paragon").value == 0))) ||
			(meta.togglable && allOff)) {
            meta.on--;
        }
	}
});


dojo.declare("com.nuclearunicorn.game.ui.BuildingStackableBtn", com.nuclearunicorn.game.ui.BuildingBtn, {
	onClick: function(event){
		this.inherited(arguments);
		this.game.render();
	}

});

dojo.declare("com.nuclearunicorn.game.ui.BuildingNotStackableBtnController", com.nuclearunicorn.game.ui.BuildingBtnController, {

	getDescription: function(model){
		var meta = model.metadata;
		if (meta.effectDesc && meta.researched){
			return this.inherited(arguments) + "<br>" + $I("res.effect") + ": " + meta.effectDesc;
		} else {
			return this.inherited(arguments);
		}
	},

	getName: function(model){
		var meta = model.metadata;
		if (meta.researched){
			return meta.label + " " + $I("btn.complete.capital");
		} else {
			return meta.label;
		}
	},

	getPrices: function(model) {
		return $.extend(true, [], model.metadata.prices); // Create a new array to keep original values
	},

	updateEnabled: function(model){
		this.inherited(arguments);
		if (model.metadata.researched){
			model.enabled = false;
		}
	},

	buyItem: function(model, event, callback) {
		if ((!model.metadata.researched && this.hasResources(model)) || this.game.devMode){
			this.payPrice(model);

			this.onPurchase(model);
			
			callback(true);
			this.game.render();
			return;
		}
		callback(false);
	},

	onPurchase: function(model){
		var meta = model.metadata;
		meta.researched = true;

		if (meta.handler){
			meta.handler(this.game, meta);
		}

		if (meta.unlocks) {
			this.game.unlock(meta.unlocks);
		}

		if (meta.upgrades) {
			this.game.upgrade(meta.upgrades);
		}
	}
});

dojo.declare("com.nuclearunicorn.game.ui.BuildingResearchBtn", com.nuclearunicorn.game.ui.BuildingBtn, {

});

dojo.declare("com.nuclearunicorn.game.ui.Spacer", null, {

	title: "",

	constructor: function(title){
		this.title = title;
	},

	render: function(container){
		dojo.create("div", { innerHTML: this.title, className: "spacer"}, container);
	},

	update: function(){
	}
});


dojo.declare("com.nuclearunicorn.game.ui.ContentRowRenderer", null, {
	twoRows: false,	//by default every tab/panel has one row only

	leftRow: null,
	rightRow: null,

	initRenderer: function(content){
		this.content = content;

		if (this.twoRows){
			var table = dojo.create("table", {
				cellpadding: "0",
				cellspacing: "0",
				style: { width: "100%"}
			}, content);
			var tr = dojo.create("tr", {}, table);
			this.leftRow  = dojo.create("td", {style:{verticalAlign: "top"}}, tr);
			this.rightRow = dojo.create("td", {style:{verticalAlign: "top"}}, tr);
		}
	},

	/**
	 * Get a DOM Node container for an array element with a given index, starting with 0
	 */
	getElementContainer: function(id){
		if (!this.twoRows){
			return this.content;
		}

		if (id % 2 == 0){
			return this.leftRow;
		} else {
			return this.rightRow;
		}
	}
});

dojo.declare("mixin.IGameAware", null, {
	game: null,

	setGame: function(game){
		this.game = game;
	}
});

dojo.declare("mixin.IChildrenAware", null, {
	children: null,

	constructor: function(){
		this.children = [];
	},

	addChild: function (child) {
		if (!child) {
			throw "Child can't be null";
		}
		this.children.push(child);
	},

	render: function(container){
		dojo.forEach(this.children, function(e, i){
			e.render(container);
		});
	},

	update: function(){
		dojo.forEach(this.children, function(e, i){ e.update(); });
	}
});
/**
 * Collapsible panel for a tab
 */
dojo.declare("com.nuclearunicorn.game.ui.Panel", [com.nuclearunicorn.game.ui.ContentRowRenderer, mixin.IChildrenAware], {
	game: null,

	collapsed: false,
	visible: true,
	name: "",

	panelDiv: null,


	//------ collapse ------
	toggle: null,
	contentDiv: null,

	constructor: function(name, tabManager){
		this.name = name;
		if (tabManager){
			tabManager.registerPanel(name, this);
		}
	},

	render: function(container){
		var panel = dojo.create("div", {
			className: "panelContainer",
			style: {
				display: this.visible ? "" : "none"
			}
		},
		container);

		this.toggle = dojo.create("div", {
			innerHTML: this.collapsed ? "+" : "-",
			className: "toggle" + (this.collapsed ? " collapsed" : ""),
			style: {
				float: "right"
			}
		}, panel);

		this.title = dojo.create("div", {
			innerHTML: this.name,
			className: "title"
		}, panel);

		this.contentDiv = dojo.create("div", {
			className: "container",
			style: {
				display: this.collapsed ? "none" : ""
			}
		}, panel);

		dojo.connect(this.toggle, "onclick", this, function(){
			this.collapse(!this.collapsed);
		});

		this.panelDiv = panel;

		/*
		 *	Render all children, probably not a best thing from architectual point of view
		 */
		this.inherited(arguments, [this.contentDiv] /* dojo majic */);

		return this.contentDiv;
	},

	collapse: function(isCollapsed){
		this.collapsed = isCollapsed;

		$(this.contentDiv).toggle(!isCollapsed);
		this.toggle.innerHTML = isCollapsed ? "+" : "-";

		this.onToggle(isCollapsed);
		var hasClassCollapsed = dojo.hasClass(this.toggle, "collapsed");
		if (isCollapsed && !hasClassCollapsed){
			dojo.addClass(this.toggle, "collapsed");			
		} else if (!isCollapsed && hasClassCollapsed) {
			dojo.removeClass(this.toggle, "collapsed");			
		}
	},

	onToggle: function(isCollapsed){
		//subscribe me!
	},

	setVisible: function(visible){
		this.visible = visible;
		if (this.panelDiv){
			$(this.panelDiv).toggle(visible);
		}
	},

	update: function(){
		this.inherited(arguments);
	},

	setGame: function(game){
		this.game = game;
	}
});

/**
 * Tab
*/
dojo.declare("com.nuclearunicorn.game.ui.tab", [com.nuclearunicorn.game.ui.ContentRowRenderer, mixin.IChildrenAware], {

	game: 		null,
	buttons: 	null,

	tabId: 		null,
	tabName: 	null,
	domNode:  null,
	visible: 	true,

	constructor: function(opts, game){
		this.tabName = opts.name;
		this.tabId = opts.id;
		this.buttons = [];

		this.game = game;
	},

	render: function(tabContainer){
		this.inherited(arguments);
		this.initRenderer(tabContainer);
	},

	update: function(){
		this.inherited(arguments);

		/*--------------------------
		Todo: this stuff is really deprecated, move it to the BLDv2 tab?
		---------------------------*/
		for (var i = 0; i < this.buttons.length; i++){
			var button = this.buttons[i];
			button.update();
		}
	},

	updateTab: function(){
	},

	/*--------------------------
	 This stuff is deprecated to
	 ---------------------------*/
	addButton:function(button){
		button.game = this.game;
		button.tab = this;
		this.buttons.push(button);
	}
});

/**
 * TODO: Please deprecate zillion of other instances of this method
 * TODO2: return offset from a htmlProvider.
 * Ideally it should be some structure like
 * {
 * 	x,
 * 	y,
 * 	html
 * }
 */
UIUtils = {
	attachTooltip: function(game, container, topPosition, leftPosition, htmlProvider) {
		var tooltip = dojo.byId("tooltip");

		dojo.connect(container, "onmouseover", this, function() {
			game.tooltipUpdateFunc = function(){
				tooltip.innerHTML = dojo.hitch(game, htmlProvider)();
			};
			game.tooltipUpdateFunc();

			var pos = $(container).offset();
			pos.top += topPosition;
			pos.left += leftPosition;

			//prevent tooltip from leaving the window area
			pos.top = Math.min(pos.top, $(window).scrollTop() + $(window).height() - $(tooltip).height() - 50); //50px padding-bottom
			pos.left = Math.min(pos.left, $(window).scrollLeft() + $(window).width() - $(tooltip).width() - 25); //25px padding-right

			dojo.style(tooltip, "top", pos.top + "px");
			dojo.style(tooltip, "left", pos.left + "px");

			if (tooltip.innerHTML) {
				dojo.style(tooltip, "display", "");
			}
		});

		dojo.connect(container, "onmouseout", this, function(){
			game.tooltipUpdateFunc = null;
			dojo.style(tooltip, "display", "none");
		});

		return htmlProvider;
	}
};
