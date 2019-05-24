WResourceRow = React.createClass({

    getDefaultProperties: function(){
        return {resource: null, isEditMode: false, isRequired: false};
    },

    getInitialState: function(){
        return {visible: !this.props.resource.isHidden};
    },

    //this is a bit ugly, probably React.PureComponent + immutable would be a much better approach
    shouldComponentUpdate: function(nextProp, nextState){
        var oldRes = this.oldRes || {},
            newRes = nextProp.resource;

        var isEqual = 
            oldRes.value == newRes.value &&
            oldRes.reserveValue == newRes.value &&
            oldRes.maxValue == newRes.maxValue &&
            oldRes.perTickCached == newRes.perTickCached &&
            this.props.isEditMode == nextProp.isEditMode &&
            this.props.isRequired == nextProp.isRequired &&
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

        if (!res.visible){
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
        var perTick = game.calendar.day < 0 ? 0 : game.getResourcePerTick(res.name, true);
        perTick = game.opts.usePerSecondValues ? perTick * game.getTicksPerSecondUI() : perTick;
        var postfix = game.opts.usePerSecondValues ? "/sec" : "";
        if (game.opts.usePercentageResourceValues && res.maxValue){
            perTick = (perTick / res.maxValue * 100).toFixed(2);
            postfix = "%" + postfix;
        }
        
        var perTickVal = 
            game.getResourcePerTick(res.name, false) || 
            game.getResourcePerTickConvertion(res.name) ? 
            "(" + game.getDisplayValueExt(perTick, true, false) + postfix + ")" : "";

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

            if (game.challenges.getChallenge("winterIsComing").on)
            {
                var modifier = game.challenges.getChallengePenalty("winterIsComing", (game.calendar.weather || "normal") + "Mod");
            }
            else
            {
                var reward = 1;
                if (game.calendar.weather == "warm")
                {
                    reward = game.challenges.getChallengeReward("winterIsComing");
                }
                if (game.calendar.weather == "cold")
                {
                    reward = 1 / game.challenges.getChallengeReward("winterIsComing");
                }
                var modifier = Math.floor(((season.modifiers[res.name] - 1) * reward + game.calendar.getWeatherMod())*100);
            }
            weatherModValue = modifier ? "[" + (modifier > 0 ? "+" : "") + modifier.toFixed() + "%]" : "";

            if (modifier > 0) {
                weatherModCss = {color: "green"};
            } else if (modifier < 0) {
                weatherModCss = {color: "red"};
            }
        }


        //----------------------------------------------------------------------------

        var specialClass = "";
        if (res.value == 420){
            specialClass = " blaze";
		} else if (res.value == 666){
            specialClass = " hail";
		}

        return $r("div", {className:"res-row" + (this.props.isRequired ? " highlited" : "")}, [
            this.props.isEditMode ? 
                $r("div", {className:"res-cell"},
                    /*$r("input", {type:"checkbox"})*/

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
                onClick: this.onClickName
            }, 
                res.title || res.name
            ),
            $r("div", {className:"res-cell " + resAmtClassName + specialClass}, game.getDisplayValueExt(res.value)),
            $r("div", {className:"res-cell " + resAmtClassName + specialClass + " reserve"}, !game.challenges.getCondition("disableChrono").on && !res.hideReserve && res.reserveValue ? "+" + game.getDisplayValueExt(res.reserveValue) : ""),
            $r("div", {className:"res-cell maxRes"}, 
                res.maxValue ? "/" + game.getDisplayValueExt(res.maxValue) : ""
            ),
            $r("div", {className:"res-cell resPerTick", ref:"perTickNode"}, perTickVal),
            $r("div", {className:"res-cell", style: weatherModCss}, weatherModValue)
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

    render: function(){
        var res = this.props.resource,
            recipe = this.props.recipe;

        var craftFixed = this.props.craftFixed,
            craftPercent = this.props.craftPercent,
            allCount = game.workshop.getCraftAllCount(res.name),
            craftRatio = game.getResCraftRatio(res),
            craftPrices = (res.name == "ship") ? game.workshop.getCraftPrice(recipe) : recipe.prices;   //????????????wat


        var craftRowAmt = craftFixed;
        if (craftFixed < allCount * craftPercent ){
            craftRowAmt = Math.floor(allCount * craftPercent);
        }

        var elem = null;

        if (craftPercent == 1){
            elem = this.hasMinAmt(recipe) ? 
                $r("div", {className:"res-cell craft-link", onClick: this.doCraftAll}, $I("resources.craftTable.all")) : 
                $r("div", {className:"res-cell craft-link"});
        }else{
            elem = game.resPool.hasRes(craftPrices, craftRowAmt) ?  
            $r("div", {className:"res-cell craft-link", onClick: this.doCraft}, 
                "+" + game.getDisplayValueExt(craftRowAmt * (1 + craftRatio), null, null, 0))
            : $r("div", {className:"res-cell craft-link"});
        }

        return $r("div", {ref:"linkBlock", style: {display:"contents"}}, elem);
    },

    componentDidMount: function(){
        var res = this.props.resource,
            recipe = this.props.recipe,
            ratio = this.props.craftPercent,
            num = this.props.craftFixed;

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
				var ratioCount = Math.floor(allCount*ratio);
				if (num < ratioCount){
					num = ratioCount;
				}

				for (var i = 0; i < prices.length; i++){
					var price = prices[i];

					var priceItemNode = dojo.create("div", {style: {clear: "both"}}, tooltip);
					var res = game.resPool.get(price.name);

					var nameSpan = dojo.create("span", {
							innerHTML: res.title || res.name,
							style: { float: "left"}
						}, priceItemNode );

					var priceSpan = dojo.create("span", {
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
		for (var j = 0; j < recipe.prices.length; j++){
			var totalRes = game.resPool.get(recipe.prices[j].name).value;
			var allAmt = Math.floor(totalRes / recipe.prices[j].val);
			if (allAmt < minAmt){
				minAmt = allAmt;
			}
		}

		return minAmt > 0 && minAmt < Number.MAX_VALUE;
    },
    
    doCraft: function(event){
        var res = this.props.resource;
        var allCount = game.workshop.getCraftAllCount(res.name);
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
        var oldRes = this.oldRes || {},
            newRes = nextProp.resource;

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
        return $r("div", {className:"res-row craft" + (this.props.isRequired ? " highlited" : "")}, [
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
                onClick: this.onClickName
            }, 
                res.title || res.name
            ),
            $r("div", {className:"res-cell resource-value", ref:"perTickNode"}, game.getDisplayValueExt(res.value)),
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
                    GENERAL TABLE
=======================================================*/

WResourceTable = React.createClass({
    render: function(){
        return null;
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
            isCollapsed: false
        };
    },
    render: function(){
        var resRows = [];
        for (var i in this.props.resources){
            var res = this.props.resources[i];
            var isRequired = (this.props.reqRes.indexOf(res.name) >= 0);
            resRows.push(
                $r(WResourceRow, {resource: res, isEditMode: this.state.isEditMode, isRequired: isRequired})
            );
        }
        return $r("div", null, [
            $r("div", null,[
                $r("div", {
                    className:"res-toolbar left"
                }, 
                    $r("a", {
                            className:"link collapse", 
                            onClick: this.toggleCollapsed
                        },
                        this.state.isCollapsed ? ">(resources)" : "v"
                    )
                ),
                $r("div", {className:"res-toolbar right"}, 
                    $r("a", {
                        className:"link", 
                        onClick: this.toggleEdit
                    }, "⚙"),
                    $r(WTooltip, {body:"?"}, 
                        "Ctrl+click resource to hide it, use gear icon for more settings.")
                
                )
            ]),
            this.state.isCollapsed ? null :
            $r("div", null, [
                this.state.isEditMode ? $r("div", {style:{"textAlign":"right"}}, [
                    $r("a", {className:"link", onClick: game.ui.zoomUp.bind(game.ui)}, "font+"),
                    $r("a", {className:"link", onClick: game.ui.zoomDown.bind(game.ui)}, "font-"),
                ]): null,
                $r("div", {className:"res-table"}, resRows)
            ])
        ]);
    },

    toggleEdit: function(){
        this.setState({isEditMode: !this.state.isEditMode});
    },

    toggleCollapsed: function(){
        this.setState({isCollapsed: !this.state.isCollapsed});
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
                        this.state.isCollapsed ? ">(craft)" : "v"
                    )
                ),
                $r("div", {className:"res-toolbar right"}, 
                    $r("a", {
                        className:"link", 
                        onClick: this.toggleEdit
                    }, "⚙")
                )
            ]),
            this.state.isCollapsed ? null :
            $r("div", null, [
                $r("div", {className:"res-table craftTable"}, resRows)
            ])
        ]);
    },

    toggleEdit: function(){
        this.setState({isEditMode: !this.state.isEditMode});
    },

    toggleCollapsed: function(){
        this.setState({isCollapsed: !this.state.isCollapsed});
    }
});

WLeftPanel = React.createClass({
    getDefaultProperties: function(){
        return {game: null};
    },
    getInitialState: function(){
        return {game: this.props.game};
    },
    render: function(){
        var game = this.state.game,
            reqRes = game.getRequiredResources(game.selectedBuilding);

        return $r("div", null, [
            $r(WResourceTable, {resources: game.resPool.resources, reqRes: reqRes}),

            $r("div", {id:"advisorsContainer",style:{paddingTop: "10px"}}),        
            $r("div", {id:"fastHuntContainer", style:{paddingLeft: "5px", visibility:"hidden"}},
                $r("a", {href:"#", onClick: game.huntAll.bind(game)},
                    "Send hunters (",
                    $r("span", {id:"fastHuntContainerCount"}),
                    ")"
                )
            ),
            $r("div", {id:"fastPraiseContainer", style:{paddingLeft: "5px", visibility:"hidden"}},
                $r("a", {href:"#", onClick: game.praise.bind(game)},
                    "Praise the sun!"
                )
            ),              
            $r(WCraftTable, {resources: game.resPool.resources, reqRes: reqRes})
        ]);
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
        return $r("div", {className: "tooltip-block", 
            onMouseOver: this.onMouseOver, 
            onMouseOut: this.onMouseOut
        }, [
            this.props.body || $r("div", {className: "tooltip-icon"}, "[?]"),
            this.state.showTooltip ? $r("div", {className: "tooltip-content"}, 
                this.props.children
            ): null
        ]);
    },

    onMouseOver: function(){
        this.setState({showTooltip: true});
    },

    onMouseOut: function(){
        this.setState({showTooltip: false});
    }
});
