WResourceRow = React.createClass({

    /*mixins: [React.PureComponent],*/

    getDefaultProperties: function(){
        return {resource: null, isEditMode: false};
    },

    getInitialState: function(){
        return {visible: true};
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
        perTick = game.opts.usePerSecondValues ? perTick * game.getRateUI() : perTick;
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

            var modifier = (season.modifiers[res.name] + game.calendar.getWeatherMod() - 1) * 100;
            weatherModValue = modifier ? "[" + (modifier > 0 ? "+" : "") + modifier.toFixed() + "%]" : "";

            if (modifier > 0) {
                weatherModCss = {color: "green"};
            } else if (modifier < 0) {
                weatherModCss = {color: "red"};
            }
        }

        //----------------------------------------------------------------------------
        return $r("div", {className:"res-row"}, [
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
                style:resNameCss
            }, 
                res.title || res.name
            ),
            $r("div", {className:"res-cell " + resAmtClassName}, game.getDisplayValueExt(res.value)),
            $r("div", {className:"res-cell maxRes"}, 
                res.maxValue ? "/" + game.getDisplayValueExt(res.maxValue) : ""
            ),
            $r("div", {className:"res-cell resPerTick", ref:"perTickNode"}, perTickVal),
            $r("div", {className:"res-cell", style: weatherModCss}, weatherModValue)
        ]);
    },
    toggleView: function(){
        this.setState({visible: !this.state.visible});
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
            resRows.push(
                $r(WResourceRow, {resource: res, isEditMode: this.state.isEditMode})
            );
        }
        return $r("div", null, [
            $r("div", null,[
                $r("div", {
                    className:"res-toolbar left",
                    /*onClick: this.toggleCollapsed */
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
                    }, "⚙")/*,
                    $r("a", {
                        className:"link", 
                        href:"wiki/index.php?page=Resources", 
                        target:"_blank"
                    }, "?")*/
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

WLeftPanel = React.createClass({
    getDefaultProperties: function(){
        return {game: null};
    },
    getInitialState: function(){
        return {game: this.props.game};
    },
    render: function(){
        return $r("div", null, [
            $r(WResourceTable, {resources: this.state.game.resPool.resources})
        ]);
    },
    componentDidMount: function(){
        var self = this;
        dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });
    }
});