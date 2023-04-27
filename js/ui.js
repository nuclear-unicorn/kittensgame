/* global
    WLeftPanel
    WMidPanel
    WToolbar,
    WQueue
*/


/**
 * dojo bridge for react components, use this sparringly
 * (TODO: consider using HOC for boilerplate like)
 * 
 *  getInitialState: function(){
        return {game: this.props.game};
    },
    
    componentDidMount: function(){
        var self = this;
        this.onUpdateHandler = dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });
    },

    componentWillUnmount(){
        dojo.unsubscribe(this.onUpdateHandler);
    },
 */

var $r = React.createElement;
dojo.declare("mixin.IReactAware", null, {
    component: null,
    container: null,

    constructor: function(component, game){
        this.component = component;
        this.game = game;
    },

    render: function(container){
        this.game.ui.dirtyComponents.push(this);

        React.render($r(this.component, {
            game: this.game
        }), container);

        this.container = container;
        return container;
    },

    update: function(){

    },

    //does not seem to be called automatically
    destroy: function(){
        if (!this.container){
            throw "Integrity failure, trying to unmount component on an empty container";
        }
        React.unmountComponentAtNode(this.container);
    }
});

/**
 * Class that provides an abstraction layer for UI/model communication
 * Extended in web version and in mobile version, so change signatures below only if you can change them in mobile too!
 */
dojo.declare("classes.ui.UISystem", null, {
    game: null,

    setGame: function(game){
        this.game = game;
    },

    render: function(){
    },

    update: function(){
    },

    updateOptions: function(){
    },

	unlockScheme: function(name) {
	},

	relockSchemes: function() {
	},

    notifyLogEvent: function(logmsg) {
    },

    confirm: function(title, msg, callbackOk, callbackCancel) {
    },

    openPopupPage: function(pageName) {
    },

    pulse: function(node){
    },

    displayAutosave: function(){
    },

    resetConsole: function(){
    },

    renderFilters: function(){
    },

    renderConsoleLog: function() {
    },

    saveExport: function(encodedData) {
    },

    observeCallback: function(){
    },

    observeClear: function(){
    },

    updateCalendar: function(){
    },

    updateLanguage: function() {
    },

    updateNotation: function() {
    },

    load: function(){

    },

    save: function(){

    },

    isEffectMultiplierEnabled: function(){
        return false;
    },

    checkForUpdates: function(){
        //nothing
    }
});

/**
 * Legacy UI renderer
 */
dojo.declare("classes.ui.DesktopUI", classes.ui.UISystem, {
    containerId: null,
    toolbar: null,
    calenderDivTooltip: null,
    calendarSignSpanTooltip: null,

    fontSize: null,

    //current selected game tab
    activeTabId: "Bonfire",

    keyStates: {
        shiftKey: false,
        ctrlKey: false,
        altKey: false
    },

    isDisplayOver: false,
    isChatActive: false,
    isChatVisited: false,
    isCenter: false,

    defaultSchemes: ["default", "dark", "grassy", "sleek", "black", "wood", "bluish", "grayish", "greenish", "tombstone", "spooky"],
    allSchemes: ["default"].concat(new classes.KGConfig().statics.schemes),

    dirtyComponents: [],

    constructor: function(containerId){
        this.containerId = containerId;

        dojo.connect($("html")[0],"onclick", this, function() {
            this.game.stats.getStat("totalClicks").val += 1;
        });

        dojo.connect($("html")[0], "onkeyup", this, function (event) {

            // Allow user extensibility to keybindings in core events
            var keybinds = [
                {
                    name: "Bonfire",
                    key: "B",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Village",
                    key: "V",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Science",
                    key: "S",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Workshop",
                    key: "W",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Trade",
                    key: "T",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Religion",
                    key: "R",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Space",
                    key: "P",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Time",
                    key: "I",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Achievements",
                    key: "M",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Stats",
                    key: "A",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Challenges",
                    key: "C",
                    shift: true,
                    alt: false,
                    control: false
                },
                {
                    name: "Close Options",
                    key: "Escape",
                    shift: false,
                    alt: false,
                    control: false,
					action: function(){ $("div.dialog:visible").last().hide(); }
                }
            ];

            //babel someday

            /*var allKeybinds = typeof userKeybinds != 'undefined' ? userKeybinds.concat(keybinds) : keybinds;
            var keybind = allKeybinds.find(function(x){
                return x.key === event.key &&
                x.shift == event.shiftKey &&
                x.alt == event.altKey &&
                x.control == event.ctrlKey; });*/

            var keybind = null;
            for (var i in keybinds){
                var k = keybinds[i];
                if (k.key === event.key &&
                    k.shift == event.shiftKey &&
                    k.alt == event.altKey &&
                    k.control == event.ctrlKey
                ){
                    keybind = k;
                    break;
                }
            }

            var targetType = event.target.type;
			var isInputElement = event.target.tagName === "TEXTAREA" ||
				(event.target.tagName === "INPUT" && (
                    targetType === "text" || targetType === "number" || targetType === "password" || targetType === "email"
                ));
            var isTabNumber = ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105));
            //console.log(isTabNumber, event.keyCode);

            if (keybind && keybind.action) {
                // If a keybind is found and has a specific action
                keybind.action();
            } else if (!isInputElement && isTabNumber){
                var tabIndex = 9;
                if (event.keyCode >= 97) { //numpad
                    tabIndex = event.keyCode - 97;
                } else if (event.keyCode >= 49 && event.keyCode <= 57) { //number row
                    tabIndex = event.keyCode - 49;
                }
                if (this.game.tabs[tabIndex].visible){
                    this.game.ui.activeTabId = this.game.tabs[tabIndex].tabId;
                    this.game.ui.render();
                }
            } else if (!isInputElement && (event.keyCode == 37 || event.keyCode == 39)){ //left arrow, right arrow
                var visibleTabs = [];
                var activeTabIndex = 0;
                for (var i = 0; i < this.game.tabs.length; i++){
                    var tab = this.game.tabs[i];
                    if (tab.visible){
                        if (tab.tabId == this.game.ui.activeTabId){
                            activeTabIndex = visibleTabs.length;
                        }
                        visibleTabs.push(tab);
                    }
                }
                var jump = event.keyCode == 37 ? -1 : 1;
                var switchTab = visibleTabs[activeTabIndex + jump];
                if (switchTab){
                    this.game.ui.activeTabId = switchTab.tabId;
                    this.game.ui.render();
                }
            } else if (!isInputElement && keybind && keybind.name != this.game.ui.activeTabId ) {
                // If a keybound is found and the tab isn't current
                for (var i = 0; i < this.game.tabs.length; i++){
                    if (this.game.tabs[i].tabId === keybind.name && this.game.tabs[i].visible){
                        this.game.ui.activeTabId = keybind.name;
                        this.game.ui.render();
                        break;
                    }
                }
            }
        });
    },

    setGame: function(game){
        this.game = game;

        //this.toolbar = new classes.ui.Toolbar(game);
    },

    render: function(){
        var game = this.game;

        var midColumn = dojo.byId("midColumn");
        var scrollPosition = midColumn.scrollTop;

        var container = dojo.byId(this.containerId);

        //unmount everything that relies on the container
        for (var i in this.dirtyComponents){
            this.dirtyComponents[i].destroy();
        }
        this.dirtyComponents = [];
        dojo.empty(container);

        var tabNavigationDiv = dojo.create("div", { className: "tabsContainer"}, container);

        //TODO: remove hardcoded id?
        //this.toolbar.render(dojo.byId("headerToolbar"));

        game.calendar.render();

        var visibleTabs = [];

        for (var i = 0; i < game.tabs.length; i++){
            var tab = game.tabs[i];
            tab.domNode = null;
            if (tab.visible){
                visibleTabs.push(tab);
            }
        }

        for (var i = 0; i < visibleTabs.length; i++){
            var tab = visibleTabs[i];

            tab.updateTab();
            var tabLink = dojo.create("a", {
                href:"#",
                innerHTML: tab.tabName,
                className: "tab " + tab.tabId,
                style : {
                    whiteSpace: "nowrap"
                }
            }, tabNavigationDiv);
            tab.domNode = tabLink;

            if (this.activeTabId == tab.tabId){
                dojo.addClass(tabLink, "activeTab");
            }


            dojo.connect(tabLink, "onclick", this,
                dojo.partial(
                    function(tab){
                        this.activeTabId = tab.tabId;
                        this.render();

                        this.game.telemetry.logRouteChange(tab.tabId);
                    }, tab)
            );

            if (i < visibleTabs.length - 1){
                dojo.create("span", {innerHTML:" | "}, tabNavigationDiv);
            }
        }

        for (var i = 0; i < game.tabs.length; i++){
            var tab = game.tabs[i];

            if (this.activeTabId == tab.tabId){

                var divContainer = dojo.create("div", {
                    className: "tabInner " + tab.tabId
                }, container);

                tab.render(divContainer);

                break;
            }
        }



		if (!this.calenderDivTooltip){
            var calendarDiv = dojo.byId("calendarDiv");
            this.calenderDivTooltip = UIUtils.attachTooltip(game, calendarDiv, 0, 200, dojo.hitch(game.calendar, function() {
                var tooltip = "";
                var displayThreshold = 100000;
                if (this.year > displayThreshold) {
                    tooltip = $I("calendar.year.tooltip") + " " + this.year.toLocaleString();
                }

                if (game.science.get("paradoxalKnowledge").researched) {
                    if (this.year > displayThreshold) {
                        tooltip += "<br>";
                    }

                    var trueYear = Math.trunc(this.trueYear());
                    if (trueYear > displayThreshold) {
                        trueYear = trueYear.toLocaleString();
                    }
                    tooltip += $I("calendar.trueYear") + " " + trueYear;
                }
                return tooltip;
            }));
        }


		if (!this.calendarSignSpanTooltip){
            var calendarSignSpan = dojo.byId("calendarSign");
			this.calendarSignSpanTooltip = UIUtils.attachTooltip(game, calendarSignSpan, 0, 60, dojo.hitch(game.calendar, function() {
                var cycle = this.cycles[this.cycle];
                if (!cycle) {
                    return "";
                }

				var tooltip = dojo.create("div", { className: "button_tooltip" }, null);

				var cycleSpan = dojo.create("div", {
					innerHTML: cycle.title + " (" + $I("calendar.year") + " " + this.cycleYear + ")",
					style: { textAlign: "center", clear: "both"}
				}, tooltip );

				// Cycle Effects
				if (game.prestige.getPerk("numerology").researched) {
					dojo.style(cycleSpan, "borderBottom", "1px solid gray");
					dojo.style(cycleSpan, "paddingBottom", "4px");

					dojo.create("div", {
						innerHTML: $I("cycle.effects.title") + ":",
						style: { textAlign: "center", paddingTop: "4px"}
					}, tooltip );

					var effects = cycle.effects;

					for (var effect in effects){
						var effectItemNode = dojo.create("div", null, tooltip);

						var effectMeta = game.getEffectMeta(effect);
						var effectTitle = effectMeta.title + ":";

						dojo.create("span", {
							innerHTML: effectTitle,
							style: {
								float: "left",
								fontSize: "16px"
							}
						}, effectItemNode );

						var effectMod = effects[effect] > 1 ? "+" : "";
						effectMod += ((effects[effect] - 1) * 100).toFixed(0) + "%";

						dojo.create("span", {
							innerHTML: effectMod,
							style: {
								float: "right",
								fontSize: "16px",
								paddingLeft: "6px"
							}
						}, effectItemNode );

						dojo.create("span", {
							innerHTML: "&nbsp;",
							style: {clear: "both" }
						}, effectItemNode );
					}
				}

				if (game.prestige.getPerk("numeromancy").researched && this.festivalDays) {
					// Cycle Festival Effects
					dojo.create("div", {
						innerHTML: $I("cycle.effects.festival.title"),
						style: { textAlign: "center"}
					}, tooltip );

					var effects = cycle.festivalEffects;

					for (var effect in effects){
						var effectItemNode = dojo.create("div", null, tooltip);

						var effectMeta = game.getEffectMeta(effect);
						var effectTitle = effectMeta.title + ":";

						dojo.create("span", {
							innerHTML: effectTitle,
							style: {
								float: "left",
								fontSize: "16px"
							}
						}, effectItemNode );

						var effectMod = effects[effect] > 1 ? "+" : "";
						effectMod += ((effects[effect] - 1) * 100).toFixed(0) + "%";

						dojo.create("span", {
							innerHTML: effectMod,
							style: {
								float: "right",
								fontSize: "16px",
								paddingLeft: "6px"
							}
						}, effectItemNode );

						dojo.create("span", {
							innerHTML: "&nbsp;",
							style: {clear: "both" }
						}, effectItemNode );
					}
				}
				return tooltip.outerHTML;

			}));
		}

        midColumn.scrollTop = scrollPosition;
        this.update();

        //-------------------------
        var now = new Date();
        if (now.getDate() == 1 && now.getMonth() == 3) {
            $(".console-intro").css("font-size", "300%").addClass("blaze").text($I("console.intro.zebra"));
        } else {
            $(".console-intro").text($I("console.intro"));
        }

        React.render($r(WLeftPanel, {
            game: this.game
        }), document.getElementById("leftColumnViewport"));

        React.render($r(WMidPanel, {
            game: this.game
        }), document.getElementById("midColumnViewport"));

        if(this.game.getFeatureFlag("QUEUE")){
            React.render($r(WQueue, {
                game: this.game
            }), document.getElementById("queueViewport"));
        }

        React.render($r(WToolbar, {
            game: this.game
        }), document.getElementById("headerToolbar"));
    },

    //---------------------------------------------------------------
    update: function(){
        //TODO: use ui managers?
		this.updateTabs();
        this.updateFastHunt();
        this.updateFastPraise();
        this.updateCalendar();
        this.updateUndoButton();
        this.updateAdvisors();

        //this.toolbar.update();

        if (this.game.ticks % 5 == 0 && this.game.tooltipUpdateFunc) {
            this.game.tooltipUpdateFunc();
        }

        //not relevant anymore
        //$(".chatLink").css("font-weight", this.isChatVisited ? "normal" : "bold");

        //wat
        /*React.render($r(WLeftPanel, {
            game: this.game
        }), document.getElementById("leftColumnViewport")); */
        this.game._publish("ui/update", this.game);
    },

	updateTabs: function() {
		var tabs = this.game.tabs;
		for (var i = 0; i < tabs.length; i++){
			var tab = tabs[i];

			if (tab.tabId == this.activeTabId){
				tab.update();
			}
        }
        if (this.game.village.leader) {
            dojo.query("a.tab.traitLeaderBonus").removeClass("traitLeaderBonus engineer metallurgist chemist merchant manager scientist wise");
            switch (this.game.village.leader.trait.name) {
                case "engineer": // Crafting bonuses
                    dojo.query("a.tab.Workshop").addClass("traitLeaderBonus" + " engineer");
                    break;
                case "metallurgist":
                    dojo.query("a.tab.Workshop").addClass("traitLeaderBonus" + " metallurgist");
                    break;
                case "chemist":
                    dojo.query("a.tab.Workshop").addClass("traitLeaderBonus" + " chemist");
                    break;
                case "merchant": // Trading bonus
                    dojo.query("a.tab.Trade").addClass("traitLeaderBonus" + " merchant");
                    break;
                case "manager": // Hunting bonus
                    dojo.query("a.tab.Village").addClass("traitLeaderBonus" + " manager");
                    break;
                case "scientist": // Science prices bonus
                    dojo.query("a.tab.Science").addClass("traitLeaderBonus" + " scientist");
                    break;
                case "wise": // Religion bonus
                    dojo.query("a.tab.Religion").addClass("traitLeaderBonus" + " wise");
                    break;
            }
        }
	},

    updateFastHunt: function(){
        if (!this.fastHuntContainer){
            this.fastHuntContainer = dojo.byId("fastHuntContainer");
        }
    },

    updateFastPraise: function(){
        if (!this.fastPraiseContainer){
            this.fastPraiseContainer = dojo.byId("fastPraiseContainer");
        }

        if (!this.fastPraiseContainer){
            return;
        }

        if (this.game.religion.faith > 0){
            if (this.fastPraiseContainer.style.visibility == "hidden"){
                this.fastPraiseContainer.style.visibility = "visible";
            }
        } else {
            if (this.fastPraiseContainer.style.visibility == "visible"){
                this.fastPraiseContainer.style.visibility = "hidden";
            }
        }
    },

    updateCalendar: function(){
        var calendar = this.game.calendar;
        var seasonTitle = calendar.getCurSeasonTitle();
        var hasCalendarTech = this.game.science.get("calendar").researched;

        var calendarDiv = dojo.byId("calendarDiv");
        if (hasCalendarTech){

            var mod = "";
            if (calendar.weather){
                mod = " (" + $I("calendar.weather." + calendar.weather) + ")";
            }

            var year = calendar.year;
            if (year > 100000){
                year = this.game.getDisplayValueExt(year, false, false, 0);
            }

            calendarDiv.innerHTML = $I("calendar.year.full", [year.toLocaleString(), seasonTitle + mod, Math.floor(calendar.day)]);
            document.title = $I("navbar.title") + " - " + $I("calendar.year.full", [calendar.year, seasonTitle, Math.floor(calendar.day)]);

            if (this.game.ironWill && calendar.observeBtn) {
                document.title = "[EVENT!]" + document.title;
            }

            var calendarSignSpan = dojo.byId("calendarSign");
            var cycle = calendar.cycles[calendar.cycle];
            if (cycle && this.game.science.get("astronomy").researched) {
                calendarSignSpan.style.color = calendar.cycleYearColor();
                calendarSignSpan.innerHTML = cycle.glyph + " ";
            }
        } else {
            calendarDiv.textContent = seasonTitle;
        }
    },
    //--------------------------------------------

    updateUndoButton: function(){
        var isVisible = (this.game.undoChange !== null);
        $("#undoBtn").toggle(isVisible);

        if (isVisible) {
            $("#undoBtn").text($I("ui.undo", [Math.floor(this.game.undoChange.ttl / this.game.ticksPerSecond)]));
        }
    },

    updateAdvisors: function(){
    },

    updateLanguage: function(){
        var languageSelector = $("#languageSelector");
        $("#languageApplyLink").toggle(languageSelector.val() != i18nLang.getLanguage());
    },

    applyLanguage: function() {
        var languageSelector = $("#languageSelector");
        i18nLang.updateLanguage(languageSelector.val());
        this.game.updateOptionsUI();
        window.location.reload();
    },

    updateNotation: function() {
        var notationSelector = $("#notationSelector");
        this.game.opts.notation = notationSelector.val();
    },


    updateOptions: function() {
        var game = this.game;

        if (game.unlockedSchemes.indexOf(game.colorScheme) < 0) {
            game.colorScheme = "default";
        }
        $("body").removeClass();
        if (game.colorScheme != "default") {
            $("body").addClass("scheme_" + game.colorScheme);
            if (!game.opts.hideBGImage) {
                $("body").addClass("with_background_image");
            }
        }

        if (game.opts.tooltipsInRightColumn) {
            $("#tooltip").detach().appendTo("#rightColumn").addClass("tooltip-in-right-column");
        } else {
            $("#tooltip").detach().appendTo("#game").removeClass("tooltip-in-right-column");
        }

        $("#workersToggle")[0].checked = game.useWorkers;
        $("#forceHighPrecision")[0].checked = game.opts.forceHighPrecision;
        $("#usePerSecondValues")[0].checked = game.opts.usePerSecondValues;
        $("#usePercentageResourceValues")[0].checked = game.opts.usePercentageResourceValues;
        $("#showNonApplicableButtons")[0].checked = game.opts.showNonApplicableButtons;
        $("#usePercentageConsumptionValues")[0].checked = game.opts.usePercentageConsumptionValues;
        $("#highlightUnavailable")[0].checked = game.opts.highlightUnavailable;
        $("#hideSell")[0].checked = game.opts.hideSell;
        $("#hideDowngrade")[0].checked = game.opts.hideDowngrade;
        $("#hideBGImage")[0].checked = game.opts.hideBGImage;
        $("#tooltipsInRightColumn")[0].checked = game.opts.tooltipsInRightColumn;
        $("#enableRedshift")[0].checked = game.opts.enableRedshift;
        $("#batchSize")[0].value = game.opts.batchSize;
        $("#forceLZ")[0].checked = game.opts.forceLZ;
        $("#compressSaveFile")[0].checked = game.opts.compressSaveFile;
        $("#disableTelemetry")[0].checked = game.opts.disableTelemetry;
        $("#noConfirm")[0].checked = game.opts.noConfirm;
        $("#IWSmelter")[0].checked = game.opts.IWSmelter;

        var selectedLang = i18nLang.getLanguage();
        var locales = i18nLang.getAvailableLocales();
        var labels = i18nLang.getAvailableLocaleLabels();
        var langSelector = $("#languageSelector");
        langSelector.empty();
        for (var i = 0; i < locales.length; i++) {
            $("<option />").attr("value", locales[i]).text(labels[locales[i]]).appendTo(langSelector);
        }
        langSelector.val(selectedLang);

        var selectedNotation = game.opts.notation;
        var notationSelect = $("#notationSelector");
        notationSelect.empty();
        var notations = new classes.KGConfig().statics.notations;
        for (var i in notations) {
            $("<option />").attr("value", notations[i]).text($I("opts.notation." + notations[i])).appendTo(notationSelect);
        }
        notationSelect.val(selectedNotation);


        var schemeSelect = $("#schemeToggle");
        schemeSelect.empty();
        for (var i = 0; i < this.allSchemes.length; ++i) {
            var scheme = this.allSchemes[i];
            var option = $("<option />").attr("value", scheme).text($I("opts.theme." + scheme));
            if (game.unlockedSchemes.indexOf(scheme) < 0) {
                if (this.defaultSchemes.indexOf(scheme) >= 0) {
                    game.unlockedSchemes.push(scheme);
                } else {
                    option.html("&nbsp;&nbsp;" + $I("opts.theme." + scheme)).attr("disabled", "disabled");
                }
            }
            option.appendTo(schemeSelect);
        }
        schemeSelect.val(game.colorScheme);
    },

	unlockScheme: function(name) {
		if (this.game.unlockedSchemes.indexOf(name) < 0) {
			$("#schemeToggle > option[value=" + name + "]").removeAttr("disabled");
			this.game.msg($I("opts.theme.unlocked") + $I("opts.theme." + name), "important");
			this.game.unlockedSchemes.push(name);
		}
	},

	relockSchemes: function() {
		this.game.unlockedSchemes = this.defaultSchemes;
		this.updateOptions();
	},

    displayAutosave: function(){
        dojo.style(dojo.byId("autosaveTooltip"), "opacity", "1");
        dojo.animateProperty({
            node:"autosaveTooltip",
            properties: {
                opacity: 0
            },
            duration: 1200,
        }).play();
    },

    getFontSize: function(){
        //account for themes like sleek that set the default font size to something other than 16
        if (this.fontSize == null){
            var computedStyle = getComputedStyle(dojo.byId("leftColumn")).fontSize;
            this.fontSize = parseInt(computedStyle, 10) || 16;
        }
        return this.fontSize;
    },

    zoomUp: function(){
        this.fontSize = this.getFontSize() + 1;
        this.updateFontSize();
    },
    zoomDown: function(){
        this.fontSize = this.getFontSize() - 1;
        if (this.fontSize < 1){
            this.fontSize = 1; //prevent resources text from disappearing altogether
        }
        this.updateFontSize();
    },
    updateFontSize: function(){
        $("#leftColumn").css("font-size", this.fontSize + "px");
    },

    hideChat: function(){ //actually loads log!
        $("#rightTabLog").show();
        $("#IRCChatInner").css("visibility", "hidden");
        $("#logLink").toggleClass("active", true);
        $("#chatLink").toggleClass("active", false);
        $("#queueLink").toggleClass("active", false);
        $("#rightTabChat").hide();
        $("#rightTabQueue").hide();
    },

    loadChat: function(){
        $("#rightTabChat").show();
        $("#rightTabLog").hide();
        $("#rightTabQueue").hide();

        $("#logLink").toggleClass("active", false);
        $("#chatLink").toggleClass("active", true);
        $("#queueLink").toggleClass("active", false);

        $("#IRCChatInner").css("visibility", "visible");

        if (this.isChatActive) {
            return;
        }

        var height = $(window.top).height() || 850;
        //console.log("IRC WINDOW HEIGHT:", height);

        var $chat = $("#IRCChatInner iframe");
        $chat.css("height", height - 180);

        this.isChatActive = true;
        //this.isChatVisited = true;
    },
    loadQueue: function(){
        $("#rightTabChat").hide();
        $("#rightTabLog").hide();
        $("#rightTabQueue").show();
        $("#IRCChatInner").css("visibility", "hidden");
        $("#logLink").toggleClass("active", false);
        $("#chatLink").toggleClass("active", false);
        $("#queueLink").toggleClass("active", true);
        $("#rightTabChat").hide();
    },
    resetConsole: function(){
        this.game.console.resetState();
    },

    renderFilters: function(){
        var console = this.game.console,
            filtersDiv = dojo.byId("logFilters");

        dojo.empty(filtersDiv);
        var show = false;

        for (var fId in console.filters){
            if (console.filters[fId].unlocked) {
                this._createFilter(console.filters[fId], fId, filtersDiv);
                show = true;
            }
        }
        $("#logFiltersBlock").toggle(show);
    },

    onLoad: function(){
        var self = this;
        $(document).on("keyup keydown keypress", function(e){

            /*if (e.altKey){    //firefox shenenigans
                e.preventDefault();
                e.stopPropagation();
            }*/

            self.keyStates = {
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            };
        });

        this.updateIndexHTMLLanguage();
    },

    updateIndexHTMLLanguage: function() {
        $("#save-link").text($I("menu.save"));
        $("#options-link").text($I("menu.options"));
        $("#reset-link").text($I("menu.reset"));
        $("#wipe-link").text($I("menu.wipe"));
        $("#getTheApp-link").text($I("menu.getTheApp"));

        $("#autosaveTooltip").text($I("ui.autosave.tooltip"));
        $("#saveTooltip").text($I("ui.save.tooltip"));
        $("#logLink").text($I("ui.log.link"));
        $("#chatLink").text($I("ui.chat.link"));
        if(this.game.getFeatureFlag("QUEUE")){
            $("#queueLink").text($I("ui.queue.link"));
        }
        $("#clearLogHref").text($I("ui.clear.log"));
        $("#logFiltersBlockText").html($I("ui.log.filters.block"));
        $("#pauseBtn").text($I("ui.pause"));
        $("#pauseBtn").attr("title", $I("ui.pause.title"));
        $("#undoBtn").attr("title", $I("ui.undo.title"));
        $(".close").text($I("ui.close"));
        $("#optionLanguage").text($I("ui.option.language"));
        $("#addTranslationLink").text($I("ui.option.language.add"));
        $("#languageApplyLink").text($I("ui.option.language.apply"));
        $("#optionScheme").text($I("ui.option.scheme"));
        $("#schemeRelock").text($I("ui.option.scheme.relock"));
        $("#schemeTip").text($I("ui.option.scheme.tip"));
        $("#optionWorkers").html($I("ui.option.workers"));
        $("#optionForceHighPrecision").text($I("ui.option.force.high.precision"));
        $("#optionUsePerSecondValues").html($I("ui.option.use.per.second.values"));
        $("#optionUsePercentageResourceValues").text($I("ui.option.use.percentage.resource.values"));
        $("#optionShowNonApplicableButtons").text($I("ui.option.show.non.applicable.buttons"));
        $("#optionUsePercentageConsumptionValues").text($I("ui.option.use.percentage.consumption.values"));
        $("#optionHighlightUnavailable").text($I("ui.option.highlight.unavailable"));
        $("#optionHideSell").text($I("ui.option.hide.sell"));
        $("#optionHideDowngrade").text($I("ui.option.hide.downgrade"));
        $("#optionHideBGImage").html($I("ui.option.hide.bgimage"));
        $("#optionTooltipsInRightColumn").text($I("ui.option.tooltips.right"));
        $("#optionMore").text($I("ui.option.more"));
        $("#optionNoConfirm").text($I("ui.option.no.confirm"));
        $("#optionIWSmelter").text($I("ui.option.iw.smelter"));
        $("#optionDisableTelemetry").text($I("ui.option.disable.telemetry"));
        $("#optionEnableRedshift").text($I("ui.option.enable.redshift"));
        $("#optionEnableRedshiftGflops").text($I("ui.option.enable.redshiftGflops"));
        $("#optionBatchSize").text($I("ui.option.batch.size"));
        $("#optionForceLZ").text($I("ui.option.force.lz"));
        $("#optionCompressSaveFile").html($I("ui.option.compress.savefile"));
        $("#exportButton").attr("value", $I("ui.option.export.button"));
        $("#importButton").attr("value", $I("ui.option.import.button"));
        $("#exportTo").text($I("ui.option.export"));
        $("#exportToDropbox").attr("value", $I("ui.option.export.dropbox"));
        $("#exportToSimpleFile").attr("value", $I("ui.option.export.simple.file"));
        $("#exportToFullFile").attr("value", $I("ui.option.export.full.file"));
        $("#exportToText").text($I("ui.option.export.text"));
        $("#closeButton").attr("value", $I("ui.option.close.button"));
        $("#importWarning").text($I("ui.option.import.warning"));
        $("#importFrom").text($I("ui.option.import.from"));
        $("#importFromDropbox").attr("value", $I("ui.option.import.from.dropbox"));
        $("#importFromText").text($I("ui.option.import.from.text"));
        $("#doImportButton").attr("value",$I("ui.option.do.import.button"));
        $("#cancelButton").attr("value",$I("ui.option.cancel.button"));
        $("#appText").text($I("ui.option.app.text"));
        $("#appAndroid").text($I("ui.option.app.android"));
        $("#appIOS").text($I("ui.option.app.ios"));
        $("#optionNotation").text($I("ui.option.notation"));
        $("#optionDisablePollution").text($I("ui.option.pollution"));
    },

    _createFilter: function(filter, fId, filtersDiv){
        var id = "filter-" + fId;

        var checkbox = dojo.create("input", {
                id: id,
                type: "checkbox",
                checked: filter.enabled
        }, filtersDiv);
        dojo.connect(checkbox, "onclick", this, function(){
            filter.enabled = checkbox.checked;
        });

        dojo.create("label", {
            "for": id,
            innerHTML: filter.title
        }, filtersDiv);
        dojo.create("br", null, filtersDiv);
    },

    logMessagesToFade: 15, //how many messages to fade as they approach message limits

    renderConsoleLog: function() {
        var _console = this.game.console,
            messages = _console.messages;

        var gameLog = dojo.byId("gameLog");
        if (!messages.length) { // micro optimization
            return;
        }

        var msg = messages[messages.length - 1];

        if (!msg.span) {
            var span = dojo.create("span", {className: "msg" }, gameLog);

            if (msg.type) {
                dojo.addClass(span, "type_" + msg.type);
            }
            if (msg.noBullet) {
                dojo.addClass(span, "noBullet");
            }
            msg.span = span;
        }
        //Place date headers above actual log events.
        if (msg.type === "date") {
            dojo.place(msg.span, gameLog, "first");
        } else {
            dojo.place(msg.span, gameLog, 1);
        }
        dojo.attr(msg.span, {innerHTML: msg.text});
        //Destroy child nodes if there are too many.
        var logLength = dojo.byId("gameLog").childNodes.length;
        if (logLength > _console.maxMessages) {dojo.destroy(dojo.byId("gameLog").childNodes[logLength - 1]);}

        //fade message spans as they get closer to being removed and replaced
        var spans = dojo.query("span", gameLog);
        var fadeCount = this.logMessagesToFade + 1; //add one so the last line is still barely visible
        var fadeStart = _console.maxMessages - fadeCount;
        var fadeInterval = 1 / fadeCount;

        for (var i = fadeStart + 1; i < spans.length; i++) {
            dojo.style(spans[i], "opacity", (1 - (i - fadeStart) * fadeInterval));
        }
    },

    notifyLogEvent: function(logmsg) {
        // do nothing
    },

    saveExport: function(encodedData, rawData) {
        var is_chrome = /*window.chrome*/ true;
        if (is_chrome){
            $("#exportDiv").show();
            $("#exportData").val(encodedData);
            $("#exportData").select();
        } else {
            window.prompt($I("general.copy.to.clipboard.prompt"), encodedData);
        }
    },

    confirm: function(title, msg, callbackOk, callbackCancel) {
        if (window.confirm(msg)) {
            callbackOk.apply(window);
        } else if (callbackCancel != undefined) {
        	callbackCancel.apply(window);
        }
    },

    //TODO: add dialog and close/bind events
    showDialog: function(id){
        var container = $("#" + id);
        container.show();

        $(".close", container).click(function(){
            $(".close", container).unbind();
            container.hide();
        });
    },

    displayAppDialog: function(){
        this.showDialog("appDiv");
    },

    load: function() {
        // swap to bonfire if the current tab is not visible
        var tabs = this.game.tabs;
        for (var i = 0; i < tabs.length; i++){
            var tab = tabs[i];
            if (this.activeTabId == tab.tabId){
                if (!tab.visible){
                    this.activeTabId = tabs[0].tabId;
                }
                break;
            }
        }
        this.game.telemetry.logRouteChange(this.activeTabId);

        var uiData = LCstorage["com.nuclearunicorn.kittengame.ui"];
        try {
            uiData = uiData ? JSON.parse(uiData) : {};

            this.fontSize = uiData.fontSize || 16;
            this.isChatVisited = uiData.isChatVisited || false;
            this.isCenter = uiData.isCenter || false;
        } catch (ex) {
            console.error("unable to load ui data");
        }
        this.updateFontSize();
        this.updateCenter();
    },

    save: function(){
        LCstorage["com.nuclearunicorn.kittengame.ui"] = JSON.stringify({
           fontSize: this.fontSize,
           isChatVisited: this.isChatVisited,
           isCenter: this.isCenter,
           theme: this.game.colorScheme
        });
    },

    updateCenter: function(){
        if (this.isCenter) {
            $("#game").addClass("centered");
            $("#toggleCenter").html("&lt;");
        } else {
            $("#game").removeClass("centered");
            $("#toggleCenter").html("&gt;");
        }

    },

    toggleCenter: function(){
        this.isCenter = !this.isCenter;
        this.updateCenter();
    },

    isEffectMultiplierEnabled: function(){
        //console.log(this.keyStates);
        return this.keyStates.shiftKey;
    },

    checkForUpdates: function(){
        var self = this;
        var now = Date.now();
        
        $.getJSON("build.version.json?=" + now).then(function(json){
            var buildRevision = json.buildRevision;
            
            if (buildRevision > self.game.telemetry.buildRevision){
                $("#newVersion").toggle(true);
            }
        });
    }

});
