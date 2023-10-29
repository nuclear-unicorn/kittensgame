/* global 

    $r,
    WCollapsiblePanel: writable,
    WResourceRow:writable, 
    WCraftRow:writable, 
    WResourceTable:writable,
    WCraftTable:writable,
    WLeftPanel:writable,
    WPins: writable,
    WTooltip:writable,
    WCraftShortcut:writable,
    game
*/

WCollapsiblePanel = React.createClass({
    getInitialState: function(){
        return {isCollapsed: false};
    },

    render: function(){
        return $r("div", null, [
            $r("div", null,[
                $r("div", {
                    className:  "left"
                    }, 
                    $r("a", {
                            className:"link collapse", 
                            onClick: this.toggleCollapsed
                        },
                        this.state.isCollapsed ? ">(" +  this.props.title + ")" : "v"
                    )
                )
            ]),
            !this.state.isCollapsed && this.props.children
        ]);
    },

    toggleCollapsed: function(){
        this.setState({isCollapsed: !this.state.isCollapsed});
    },
});

WResourceRow = React.createClass({

    getDefaultProperties: function(){
        return {resource: null, isEditMode: false, isRequired: false, showHiddenResources: false};
    },

    getInitialState: function(){
        return {
            visible: !this.props.resource.isHidden
        };
    },

    //this is a bit ugly, probably React.PureComponent + immutable would be a much better approach
    shouldComponentUpdate: function(nextProp, nextState){
        var oldRes = this.oldRes || {},
            newRes = nextProp.resource;

        var isEqual = 
            oldRes.value == newRes.value &&
            oldRes.maxValue == newRes.maxValue &&
            oldRes.perTickCached == newRes.perTickCached &&
            this.props.isEditMode == nextProp.isEditMode &&
            this.props.isRequired == nextProp.isRequired &&
            this.props.showHiddenResources == nextProp.showHiddenResources &&
            this.props.isTemporalParadox != nextProp.isTemporalParadox &&
            this.state.visible == nextState.visible;

        if (isEqual){
            return false;
        }
        this.oldRes = {
            value: newRes.value,
            maxValue: newRes.maxValue,
            perTickCached: newRes.perTickCached
        };
        return true;
    },

    render: function(){
        var res = this.props.resource;

        if (!res.visible && !this.props.showHiddenResources){
            return null;
        }

        var hasVisibility = (res.unlocked || (res.name == "kittens" && res.maxValue));

        if (!hasVisibility || (!this.state.visible && !this.props.isEditMode)){
            return null;
        }

        //migrate dual resources (e.g. blueprint) to lower table once craft recipe is unlocked
		if (game.resPool.isNormalCraftableResource(res) && game.workshop.getCraft(res.name).unlocked){
			return null;
        }

        //wtf is this code
        var isTimeParadox = this.props.isTemporalParadox;
        
        var perTick = isTimeParadox ? 0 : game.getResourcePerTick(res.name, true);
        perTick = game.opts.usePerSecondValues ? perTick * game.getTicksPerSecondUI() : perTick;
        var postfix = game.opts.usePerSecondValues ? "/" + $I("unit.s") : "";
        if (game.opts.usePercentageResourceValues && res.maxValue){
            perTick = (perTick / res.maxValue * 100).toFixed(2);
            postfix = "%" + postfix;
        }
        
        var perTickVal = 
            game.getResourcePerTick(res.name, false) || 
            game.getResourcePerTickConvertion(res.name) ? 
            game.getDisplayValueExt(perTick, true, false) + postfix : 
            (res.calculatePerDay)? game.getDisplayValueExt((game.getResourcePerDay(res.name)) *((res.name == "necrocorn")? 1 + game.timeAccelerationRatio():1), true, false) + "/" + $I("unit.d"):
            (res.calculateOnYear)? game.getDisplayValueExt(game.getResourceOnYearProduction(res.name), true, false) + "/" + $I("unit.y"): "";
            // "(" + game.getDisplayValueExt(perTick, true, false) + postfix + ")" : "";

        //----------------------------------------------------------------------------

        var resNameCss = {};
        if (res.type == "uncommon"){
            resNameCss = {
                color: "Coral"
            };
        }
        if (res.type == "rare"){
            resNameCss = {
                color: "orange",
                textShadow: "1px 0px 10px Coral"
            };
        }
        if (res.color){
            resNameCss = {
                color: res.color,
            };
        } 
        if (res.style){
            for (var styleKey in res.style){
                resNameCss[styleKey] = res.style[styleKey];
            }
        }

        //----------------------------------------------------------------------------

        var resAmtClassName = "resAmount";
        if (res.value > res.maxValue * 0.95 && res.maxValue > 0){
            resAmtClassName = "resAmount resLimitNotice";
        } else if (res.value > res.maxValue * 0.75 && res.maxValue > 0){
            resAmtClassName = "resAmount resLimitWarn";
        }

        //----------------------------------------------------------------------------
        //weather mod
        //----------------------------------------------------------------------------

        var season = game.calendar.getCurSeason();
        var weatherModValue = null,
            weatherModCss = null;

        if (season.modifiers[res.name] && perTick !== 0 ){

            var modifier = game.calendar.getWeatherMod(res);
            if (modifier == 0) {
                modifier = -100;
            } else {
                modifier = Math.max(Math.round((modifier - 1) * 100), -99);
            }
            weatherModValue = modifier ? "[" + (modifier > 0 ? "+" : "") + modifier.toFixed() + "%]" : "";

            if (modifier > 0) {
                weatherModCss = "positive-weather";
            } else if (modifier < 0) {
                weatherModCss = "negative-weather";
            }
        }

        //----------------------------------------------------------------------------

        var specialClass = "";
        if (res.value == 420) {
            specialClass = " blaze";
        } else if (res.value == 666) {
            specialClass = " hail";
        } else if (res.value == 777) {
            specialClass = " pray";
        } else if (res.value == 1337) {
            specialClass = " leet";
        }

        var resLeaderBonus = "";
        var currentLeader = game.village.leader;
        
        if (currentLeader){
            if(currentLeader.job) {
                var currentLeaderJob = game.village.getJob(currentLeader.job);
                if(currentLeaderJob) {
                    for (var jobResName in currentLeaderJob.modifiers){
                        if ( res.name == jobResName ){
                            resLeaderBonus = " resLeaderBonus ";
                        }
                    }                                      
                }
            }
        }

        var resRowClass = "res-row resource_" + res.name + resLeaderBonus + 
            (this.props.isRequired ? " highlited" : "") +
            (!res.visible ? " hidden" : "")
        ;

        return $r("div", {className: resRowClass}, [
            this.props.isEditMode ? 
                $r("div", {className:"res-cell"},
                    $r("input", {
                        type:"checkbox", 
                        checked: this.state.visible,

                        onClick: this.toggleView,
                        style:{display:"inline-block"},
                    })
                ) : null,

            $r("div", {
                className:"res-cell resource-name", 
                style:resNameCss,
                onClick: this.onClickName,
                title: res.title || res.name
            }, 
                res.title || res.name
            ),
            $r("div", {className:"res-cell " + resAmtClassName + specialClass}, game.getDisplayValueExt(res.value)),
            $r("div", {className:"res-cell maxRes"}, 
                res.maxValue ? "/" + game.getDisplayValueExt(res.maxValue) : ""
            ),
            $r("div", {className:"res-cell resPerTick", ref:"perTickNode"}, 
                isTimeParadox ? "???" : perTickVal),
            $r("div", {className:"res-cell" + (weatherModCss ? " " + weatherModCss : "")}, weatherModValue)
        ]);
    },
    onClickName: function(e){
        if (this.props.isEditMode || e.ctrlKey || e.metaKey){
            this.toggleView();
        } 
    },

    toggleView: function(){
        this.setState({visible: !this.state.visible});
        this.props.resource.isHidden = this.state.visible; 
    },

    componentDidMount: function(){
        var node = React.findDOMNode(this.refs.perTickNode);
        if (node){
            this.tooltipNode = node;
            game.attachResourceTooltip(node, this.props.resource);
        }
    },

    componentDidUpdate: function(prevProps, prevState){
        if (!this.tooltipNode){
            var node = React.findDOMNode(this.refs.perTickNode);
            if (node){
                this.tooltipNode = node;
                game.attachResourceTooltip(node, this.props.resource);
            }
        }
    },

    componentWillUnmount: function(){
        if (!this.tooltipNode){
            var node = React.findDOMNode(this.refs.perTickNode);
            if (node){
                this.tooltipNode = node;
            }
        }
        dojo.destroy(this.tooltipNode);
    }
});

WCraftShortcut = React.createClass({
    getDefaultProperties: function(){
        return {resource: null, craftFixed: null, craftPercent: null};
    },

    render: function() {
        var res = this.props.resource,
            recipe = this.props.recipe;

        var craftFixed = this.props.craftFixed,
            craftPercent = this.props.craftPercent,
            allCount = game.workshop.getCraftAllCount(res.name),
            craftRatio = game.getResCraftRatio(res.name),
            craftPrices = game.workshop.getCraftPrice(recipe);


        var craftRowAmt = craftFixed;
        if (craftFixed < allCount * craftPercent) {
            craftRowAmt = Math.floor(allCount * craftPercent);
        }

        var elem = null;
        var cssClasses = "res-cell craft-link ";
        if (craftPercent == 1) {
            cssClasses += "all";
            elem = this.hasMinAmt(recipe)
                ? $r("div", {className: cssClasses, onClick: this.doCraftAll, title: "+" + game.getDisplayValueExt(allCount * (1 + craftRatio), null, null, 0)}, $I("resources.craftTable.all"))
                : $r("div", {className: cssClasses});
        } else {
            cssClasses += "craft-" + (craftPercent * 100) + "pc";
            elem = game.resPool.hasRes(craftPrices, craftRowAmt)
                ? game.opts.usePercentageConsumptionValues
                    ? $r("div", {className: cssClasses, onClick: this.doCraft, title: "+" + game.getDisplayValueExt(craftRowAmt * (1 + craftRatio), null, null, 0)}, (craftPercent * 100) + "%")
                    : $r("div", {className: cssClasses, onClick: this.doCraft, title: (craftPercent * 100) + "%"}, $r("span", {className:"plusPrefix"}, "+"), game.getDisplayValueExt(craftRowAmt * (1 + craftRatio), null, null, 0))
                : $r("div", {className: cssClasses});
        }

        return $r("div", {ref:"linkBlock", style: {display:"contents"}}, elem);
    },

    componentDidMount: function(){
        var recipe = this.props.recipe;
        var ratio = this.props.craftPercent;
        var num = this.props.craftFixed;

        //no craftAll tooltip    
        if (this.props.craftPercent == 1){
            return;
        }   

        var node = React.findDOMNode(this.refs.linkBlock);
        if (node && node.firstChild){
            this.tooltipNode = node;

            UIUtils.attachTooltip(game, node.firstChild, 0, 60, dojo.partial( function(recipe){
				var tooltip = dojo.create("div", { className: "button_tooltip" }, null);
				var prices = game.workshop.getCraftPrice(recipe);

				var allCount = game.workshop.getCraftAllCount(recipe.name);
				var ratioCount = Math.floor(allCount * ratio);
				if (num < ratioCount){
					num = ratioCount;
				}

				for (var i = 0; i < prices.length; i++){
					var price = prices[i];

					var priceItemNode = dojo.create("div", {style: {clear: "both"}}, tooltip);
					var res = game.resPool.get(price.name);

					dojo.create("span", {
							innerHTML: res.title || res.name,
							style: { float: "left"}
						}, priceItemNode );

					dojo.create("span", {
							innerHTML: game.getDisplayValueExt(price.val * num),
							style: {float: "right", paddingLeft: "6px" }
						}, priceItemNode );
				}
				return tooltip.outerHTML;
			}, recipe));
        }
    },

    hasMinAmt: function(recipe){
		var minAmt = Number.MAX_VALUE;
        var craftPrices = game.workshop.getCraftPrice(recipe); //Get price as modified by upgrades

		for (var j = 0; j < craftPrices.length; j++){
			var totalRes = game.resPool.get(craftPrices[j].name).value;
			var allAmt = Math.floor(totalRes / craftPrices[j].val);
			if (allAmt < minAmt){
				minAmt = allAmt;
			}
		}

		return minAmt > 0 && minAmt < Number.MAX_VALUE;
    },
    
    doCraft: function(event){
        var res = this.props.resource;
        var allCount = game.workshop.getCraftAllCount(res.name),
            ratioCount = Math.floor(allCount * this.props.craftPercent);
        
        var num = this.props.craftFixed;
        if (num < ratioCount){
            num = ratioCount;
        }
        game.craft(res.name, num);
    },

    doCraftAll: function(){
        var res = this.props.resource;
        game.craftAll(res.name);
    },

    componentWillUnmount: function(){
        var node = React.findDOMNode(this.refs.linkBlock);
        if (node){
            dojo.destroy(node.firstChild);
        }
    }
});
/*=======================================================
                    CRAFT RESOURCE ROW
=======================================================*/

WCraftRow = React.createClass({

    getDefaultProperties: function(){
        return {resource: null, isEditMode: false};
    },

    getInitialState: function(){
        return {visible: !this.props.resource.isHidden};
    },

    shouldComponentUpdate: function(nextProp, nextState){
        var newRes = nextProp.resource;

        /*var isEqual = 
            oldRes.value == newRes.value &&
            this.props.isEditMode == nextProp.isEditMode &&
            this.props.isRequired == nextProp.isRequired &&
            this.state.visible == nextState.visible;

        if (isEqual){
            return false;
        }*/
        this.oldRes = {
            value: newRes.value,
        };
        return true;
    },

    render: function(){
        var res = this.props.resource;

        var recipe = game.workshop.getCraft(res.name);
        var hasVisibility = (res.unlocked && recipe.unlocked /*&& this.workshop.on > 0*/);
        if (!hasVisibility || (!this.state.visible && !this.props.isEditMode)){
            return null;
        }

        //----------------------------------------------------------------------------

        var resNameCss = {};
        if (res.type == "uncommon"){
            resNameCss = {
                color: "Coral"
            };
        }
        if (res.type == "rare"){
            resNameCss = {
                color: "orange",
                textShadow: "1px 0px 10px Coral"
            };
        }
        if (res.color){
            resNameCss = {
                color: res.color,
            };
        } 
        if (res.style){
            for (var styleKey in res.style){
                resNameCss[styleKey] = res.style[styleKey];
            }
        }
        //----------------------------------------------------------------------------
        var resVal = game.getDisplayValueExt(res.value);
        return $r("div", {className:"res-row craft resource_" + res.name + (game.workshop.getEffectEngineer(res.name) != 0 ? " craftEngineer " : "")
        + (this.props.isRequired ? " highlited" : "")}, [
            this.props.isEditMode ? 
                $r("div", {className:"res-cell"},
                    $r("input", {
                        type:"checkbox", 
                        checked: this.state.visible,
                        onClick: this.toggleView,
                        style:{display:"inline-block"},
                    })
                ) : null,
            $r("div", {
                className:"res-cell resource-name", 
                style: resNameCss,
                onClick: this.onClickName,
                title: res.title || res.name
            }, 
                res.title || res.name
            ),
            $r("div", {className:"res-cell resource-value", ref:"perTickNode", title: resVal}, resVal),
            $r(WCraftShortcut, {resource: res, recipe: recipe, craftFixed:1, craftPercent: 0.01}),
            $r(WCraftShortcut, {resource: res, recipe: recipe, craftFixed:25, craftPercent: 0.05}),
            $r(WCraftShortcut, {resource: res, recipe: recipe, craftFixed:100, craftPercent: 0.1}),
            $r(WCraftShortcut, {resource: res, recipe: recipe, craftPercent: 1}),
        ]);
    },
    onClickName: function(e){
        if (this.props.isEditMode || e.ctrlKey){
            this.toggleView();
        } 
    },

    toggleView: function(){
        this.setState({visible: !this.state.visible});
        this.props.resource.isHidden = this.state.visible; 
    },

    componentDidMount: function(){
        var node = React.findDOMNode(this.refs.perTickNode);
        if (node){
            this.tooltipNode = node;
            game.attachResourceTooltip(node, this.props.resource);
        }
    },

    componentDidUpdate: function(prevProps, prevState){
        if (!this.tooltipNode){
            var node = React.findDOMNode(this.refs.perTickNode);
            if (node){
                this.tooltipNode = node;
                game.attachResourceTooltip(node, this.props.resource);
            }
        }
    }
});

/*=======================================================
                     RESORUCES
=======================================================*/

WResourceTable = React.createClass({
    getDefaultProperties: function(){
        return {resources: null};
    },
    getInitialState: function(){
        return {
            isEditMode: false,
            isCollapsed: false,
            showHiddenResources: false
        };
    },
    render: function(){
        var resRows = [];

        for (var i in this.props.resources){
            var res = this.props.resources[i];
            var isRequired = (this.props.reqRes.indexOf(res.name) >= 0);
            resRows.push(
                $r(WResourceRow, {
                    resource: res, 
                    isEditMode: this.state.isEditMode, 
                    isRequired: isRequired,
                    showHiddenResources: this.state.showHiddenResources,
                    isTemporalParadox: game.calendar.day < 0
                })
            );
        }
        //TODO: mixing special stuff like fatih and such here
        
        return $r("div", null, [
            $r("div", null,[
                $r("div", {
                    className:"res-toolbar left"
                }, 
                    $r("a", {
                            className:"link collapse", 
                            onClick: this.toggleCollapsed
                        },
                        this.state.isCollapsed ? ">(" + $I("left.resources") + ")" : "v"
                    )
                ),
                $r("div", {className:"res-toolbar right"}, 
                    $r("a", {
                        className: "link" + (this.state.isEditMode ? " toggled" : ""), 
                        onClick: this.toggleEdit,
                        onKeyDown: this.onKeyDown,
                        tabIndex: 0
                    }, "⚙"),
                    $r(WTooltip, {body:"?"}, 
                        $I("left.resources.tip"))
                
                )
            ]),
            (!this.state.isCollapsed) &&
                $r("div", null, [
                    this.state.isEditMode && $r("div", {style:{"textAlign":"right"}}, [
                        $r("a", {className:"link", onClick: game.ui.zoomUp.bind(game.ui)}, $I("left.font.inc")),
                        $r("a", {className:"link", onClick: game.ui.zoomDown.bind(game.ui)}, $I("left.font.dec")),
                    ]),
                    $r("div", {className:"res-table"}, resRows)
                ]),

            //TODO: this stuff should not be exposed to beginner player to not overwhelm them
            //we can enable it later like we normally, if, say, year is >1k or paragon > 0
            (!this.state.isCollapsed && this.state.isEditMode) && 
            $r("div", {className:"res-toggle-hidden"}, [
                $r("input", {
                    type:"checkbox", 
                    checked: this.state.showHiddenResources,
                    onClick: this.toggleHiddenResources,
                    style:{display:"inline-block"},
                }),
                $I("res.show.hidden")
            ])
        ]);
    },

    onKeyDown: function(event){
        if (event.keyCode == 13){
            this.toggleEdit();
        }
    },

    toggleEdit: function(){
        this.setState({isEditMode: !this.state.isEditMode});
    },

    toggleCollapsed: function(){
        this.setState({isCollapsed: !this.state.isCollapsed});
    },

    toggleHiddenResources: function(e){
        this.setState({showHiddenResources: e.target.checked});
    }
});

/*=======================================================
                        CRAFT
=======================================================*/

WCraftTable = React.createClass({
    getDefaultProperties: function(){
        return {resources: null, game: null};
    },
    getInitialState: function(){
        return {
            isEditMode: false,
            isCollapsed: false
        };
    },
    render: function(){
        var resRows = [];
        for (var i in this.props.resources){
            var res = this.props.resources[i];
            if (!res.craftable){
				continue;
            }
            var isRequired = (this.props.reqRes.indexOf(res.name) >= 0);
            resRows.push(
                $r(WCraftRow, {resource: res, isEditMode: this.state.isEditMode, isRequired: isRequired})
            );
        }

        if (game.bld.get("workshop").on <= 0){
            return null;
        }

        return $r("div", null, [
            $r("div", null,[
                $r("div", {
                    className:"res-toolbar left",
                }, 
                    $r("a", {
                            className:"link collapse", 
                            onClick: this.toggleCollapsed
                        },
                        this.state.isCollapsed ? ">(" + $I("left.craft") + ")" : "v"
                    )
                ),
                $r("div", {className:"res-toolbar right"}, 
                    $r("a", {
                        className: "link" + (this.state.isEditMode ? " toggled" : ""), 
                        onClick: this.toggleEdit,
                        onKeyDown: this.onKeyDown,
                        tabIndex: 0
                    }, "⚙")
                )
            ]),
            this.state.isCollapsed ? null :
            $r("div", null, [
                $r("div", {className:"res-table craftTable"}, resRows)
            ])
        ]);
    },

    onKeyDown: function(event){
        if (event.keyCode == 13){
            this.toggleEdit();
        }
    },

    toggleEdit: function(){
        this.setState({isEditMode: !this.state.isEditMode});
    },

    toggleCollapsed: function(){
        this.setState({isCollapsed: !this.state.isCollapsed});
    }
});

WPins = React.createClass({
    getPins: function(){
        var pins = [];
        for (var i in this.props.game.diplomacy.races){
            var race = this.props.game.diplomacy.races[i];

            if (race.pinned){
                pins.push({
                    title: $I("left.trade.do", [race.title]),
                    handler: function(race){ 
                        this.props.game.diplomacy.tradeAll(race); 
                    }.bind(this, race)
                });
            }
        }
        return pins;
    },
    render: function(){
        var pins = this.getPins();
        var pinLinks = [];
        for (var i in pins){
            var pin = pins[i];
            pinLinks.push(
                $r("div", {className:"pin-link"},
                    $r("a", {href:"#", onClick: pin.handler},
                        pin.title
                    )
                )   
            );
        }
        return (
            $r(WCollapsiblePanel, {title: $I("left.trade")}, pinLinks)
        );
    }
});

WLeftPanel = React.createClass({
    getDefaultProperties: function(){
        return {game: null};
    },
    getInitialState: function(){
        return {game: this.props.game};
    },

    getResources: function(){
        var resPool = [];
        var game = this.state.game;
        
        resPool = resPool.concat(game.resPool.resources);
        resPool = resPool.concat(game.resPool.getPseudoResources());
        return resPool;
    },

    render: function(){
        var game = this.state.game,
            reqRes = game.getRequiredResources(game.selectedBuilding);

        var catpower = game.resPool.get("manpower");
        var huntCount = Math.floor(catpower.value / 100);

        var canHunt = ((game.resPool.get("paragon").value > 0) || (game.science.get("archery").researched)) &&
            (!game.challenges.isActive("pacifism"));
        var showFastHunt = (catpower.value >= 100);

        //---------- advisor ---------
        var showAdvisor = false;

        if (game.bld.get("field").on > 0){
            var calendar = game.calendar,
                winterDays = calendar.daysPerSeason -
                (calendar.getCurSeason().name === "winter" ? calendar.day : 0);

            var catnipPerTick = game.winterCatnipPerTick;

            showAdvisor = (game.resPool.get("catnip").value + winterDays * catnipPerTick * calendar.ticksPerDay) <= 0;
        }
        //----------------------------

        return $r("div", null, [
            $r(WResourceTable, {resources: this.getResources(), reqRes: reqRes}),

            $r("div", {id:"advisorsContainer",style:{
                paddingTop: "10px", 
                display: (showAdvisor ? "block" : "none")}
            }, 
                $I("general.food.advisor.text")
            ), 
            $r("div", {id:"fastHuntContainer", className:"pin-link", style:{
                display: (canHunt ? "block" : "none"),
                visibility: (showFastHunt ? "visible" : "hidden")
            }},
                $r("a", {href:"#", onClick: this.huntAll},
                    $I("left.hunt") + " (",
                    $r("span", {
                        id:"fastHuntContainerCount"
                    },
                        [
                            game.getDisplayValueExt(huntCount, false, false, 0),
                            " ",
                            (huntCount === 1 ? $I("left.hunt.time") : $I("left.hunt.times"))
                        ]
                    ),
                    ")"
                )
            ),
            $r("div", {id:"fastPraiseContainer", className:"pin-link", style:{visibility:"hidden"}},
                $r("a", {href:"#", onClick: this.praiseAll},
                    $I("left.praise")
                )
            ),              
            $r(WPins, {game: game}),
            $r(WCraftTable, {resources: game.resPool.resources, reqRes: reqRes})
        ]);
    },

    huntAll: function(event){
        this.state.game.huntAll(event);
    },

    praiseAll: function(event){
        this.state.game.praise(event);
    },

    componentDidMount: function(){
        var self = this;
        dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });
    }
});

WTooltip = React.createClass({
    getInitialState: function() {
        return {
            showTooltip: false
        };
    },

    getDefaultProps: function(){
        return {
            body: null
        };
    },

    render: function(){
        return $r("div", {
            tabIndex: 0,
            className: "tooltip-block", 
            onMouseOver: this.onMouseOver, 
            onMouseOut: this.onMouseOut,
            onKeyDown: this.onKeyDown
        }, [
            this.props.body || $r("div", {className: "tooltip-icon"}, "[?]"),
            this.state.showTooltip ? $r("div", {className: "tooltip-content"}, 
                this.props.children
            ) : null
        ]);
    },

    onMouseOver: function(){
        this.setState({showTooltip: true});
    },

    onKeyDown: function(e){
        if (e.keyCode == 13){
            this.setState({showTooltip: !this.state.showTooltip});
        }
    },

    onMouseOut: function(){
        this.setState({showTooltip: false});
    }
});
