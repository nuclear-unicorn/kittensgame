/* global

    $r,
    WQueue: writable,
    game
*/

WQueueItem = React.createClass({

    componentDidMount: function(){
        this.attachTooltip();
    },
    componentDidUpdate: function(prevProps, prevState){
        if (this.props.item !== prevProps.item) {
            this.attachTooltip();
        }
    },

    render: function(){
        var item = this.props.item;
        var buttons = [
            $r("a", {
                href: "#", 
                onClick: this.removeOne,
            }, "[-]")];

        if (item.value) {
            buttons.push($r("a", {
                href: "#", 
                onClick: this.removeAll,
            }, "[x]"));
        }

        if (!this.props.isLast) {
            buttons.push($r("a", {
                href: "#", 
                onClick: this.pushBack,
            }, "[↓]"));
        }

        if (this.props.index > 0) {
                buttons.push($r("a", {
                href: "#", 
                onClick: this.pushFront,
            }, "[↑]"));
        }

        //Mark this queue item as limited, but respect the setting in the options menu:
        var resourceIsLimited = this.props.game.opts.highlightUnavailable && this.isStorageLimited();

        //TODO: red indicator when can't process
        //TODO: attach tooltip as if it is a button
        return $r("div", { className: resourceIsLimited ? "limited" : ""},
        [
            this.props.game.devMode ? ("[" + item.type + "] - ") : "",
            $r("span", {ref:"itemLabel", className:"queue-label"}, item.label),
            (
                item.value ? (" " + item.value ) : ""
            )
        ].concat(buttons));
    },

    pushBack: function(){
        var i = this.props.index;
        this.props.queueManager.pushBack(i);
    },

    pushFront: function(){
        var i = this.props.index;
        this.props.queueManager.pushFront(i);
    },

    removeOne: function(){
        var i = this.props.index;
        this.props.queueManager.remove(i, 1);
    },

    removeAll: function(){
        var i = this.props.index;
        this.props.queueManager.remove(i, this.props.item.value);
    },

    attachTooltip: function(){
        var item = this.props.item;
        var game = this.props.game;

        var node = React.findDOMNode(this.refs.itemLabel);

        //Extract the correct type of controller & its model for this specific item:
        var controllerAndModel = game.time.queue.getQueueElementControllerAndModel(item);
        if (!controllerAndModel) {
            return;
        }
        UIUtils.attachTooltip(game, node, 0, 200, dojo.partial(ButtonModernHelper.getTooltipHTML, controllerAndModel.controller, controllerAndModel.model));
    },

    //Ask the game engine if this item is storage-limited
    isStorageLimited: function() {
        var game = this.props.game;
        var model = game.time.queue.getQueueElementModel(this.props.item);
        if (!model) { //This might be an invalid queue item
            return true; //Mark as storage-limited to try to get the player's attention
        }
        return game.resPool.isStorageLimited(model.prices);
    }
});

WQueue = React.createClass({

    getInitialState: function(){
        return {
            typeId: "buildings",
            itemIndex: null, //Index of item from options list that is selected, or null
            game: this.props.game
        };
    },

    componentDidMount: function(){
        var self = this;

        //TODO: uncomment and change all game references to this.state.game if you want to update it dynamically

        this.onUpdateHandler = dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });
    },

    getQueueTypeSelect: function(){
        var options = [];
        var self = this;
        var queueSources = game.time.queue.queueSourcesArr;
        /*for (var i in queueSources){
            if(queueSources[i]){
                options.push($r("option", { value: i}, i));
            }
        }*/
        for (var i in queueSources){
            options.push($r("option", { value: queueSources[i].name}, queueSources[i].label));
        }
        return $r("select", {
            value: this.state.queueTypeId,
            onChange: function(e){
                var typeId = e.target.value;
                var options = game.time.queue.getQueueOptions(typeId);
                self.setState({
                    typeId: typeId,
                    itemIndex: options.length ? 0 : null
                });
                
            }
        }, options);
    },

    getQueueItemSelect: function(options){
        var self = this;
        var selectOpts = [];

        for (var i in options){
            var option = options[i];
            //selectOpts.push($r("option", { value: option.name, "data-label": option.label}, option.label));
            selectOpts.push($r("option", { value: i, "data-label": option.label}, option.label));
        }

        if (!options.length){
            selectOpts.push($r("option", {}, "-"));
        }

        return $r("select", {
            value: this.state.itemIndex,
            onChange: function(e){
                self.setState({
                    itemIndex: e.target.value,
                });
            }
        }, selectOpts);
    },

    getQueueItems: function(){
        var self = this;
        var items = [];

        var queueManager = self.state.game.time.queue;
        var queueItems = queueManager.queueItems;
        
        for (var i = 0; i < queueItems.length; i++){
            var item = queueItems[i];

            //null element safe switch
            if (!item){
                items.push($r("div", {}, "<unknown>"));
                continue;
            }

            items.push($r(WQueueItem, {
                item: item,
                index: i,
                isLast: i == queueItems.length - 1,
                queueManager: queueManager,
                game: game
            }));
        }
        return $r("div", {}, 
            items
        );
    },
    toggleAlphabetical: function(){
        game.time.queue.toggleAlphabeticalSort();
        this.render();
    },
    render: function(){
        var self = this;

        var typeId = this.state.typeId;
        var options = game.time.queue.getQueueOptions(typeId);

        return $r("div", {
            className: "queue-container"
        }, [
            this.getQueueTypeSelect(),
            this.getQueueItemSelect(options),
            $r("button", {
                onClick: function(e){
                    var indexToUse = self.state.itemIndex || 0;
                    if (indexToUse >= options.length) { //Default to first element.
                        indexToUse = 0;
                    }
                    if(indexToUse < options.length){
                        game.time.queue.addToQueue(
                            options[indexToUse].name,
                            self.state.typeId,
                            options[indexToUse].label,
                            e.shiftKey
                        );
                    }

                    //re-render component
                    self.forceUpdate();
                }
            }, "Add to queue"),

            $r("div", {className:"alphabetical-toggle"}, [
                $r("input", {
                    type:"checkbox", 
                    checked: game.time.queue.alphabeticalSort,
                    onClick: self.toggleAlphabetical,
                    style:{display:"inline-block"},
                }),
                $I("queue.alphabeticalToggle")
            ]),

            this.getQueueItems()
        ]);
    }
});