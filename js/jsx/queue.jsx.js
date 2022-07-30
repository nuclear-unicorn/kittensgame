/* global

    $r,
    WQueue: writable,
    game
*/

WQueue = React.createClass({

    getInitialState: function(){
        return {
            typeId: "buildings",
            itemId: null,
            itemLabel: null
        };
    },

    componentDidMount: function(){
        var self = this;

        //TODO: uncomment and change all game references to this.state.game if you want to update it dynamically
        
        /*this.onUpdateHandler = dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });*/
    },

    getQueueTypeSelect: function(){
        var options = [];
        var self = this;

        for (var i in game.time.queue.queueSources){
            var source = game.time.queue.queueSources[i];
            options.push($r("option", { id: source}, source));
        }
        return $r("select", {
            value: this.state.queueTypeId,
            onChange: function(e){
                var typeId = e.target.value;

                self.setState({
                    typeId: typeId
                });
                var options = game.time.queue.getQueueOptions(typeId);
                if (options.length){
                    self.setState({
                        itemId: options[0].name,
                        itemLabel: options[0].label
                    });
                }
                
            }
        }, options);
    },

    getQueueItemSelect: function(options){
        for (var i in options){
            var option = options[i];
            options.push($r("option", { id: option.name, "data-label": option.label}, option.label));
        }

        return $r("select", {
            value: this.state.itemId,
            onChange: function(e){
                self.setState({
                    itemId: e.target.value,
                    itemLabel: e.target.dataset.label
                });
            }
        }, options);
    },

    getQueueItems: function(){
        var items = [];
        for (var i in game.time.queue.queueItems){
            var item = game.time.queue.queueItems[0];
            items.push($r("div", {}, 
                "[" + item.type + "] - " + item.label
            ));
        }
        return $r("div", {}, 
            items
        );
    },

    render: function(){
        var self = this;

        var typeId = this.state.typeId;
        var options = game.time.queue.getQueueOptions(typeId);

        return $r("div", {
        }, [
            this.getQueueTypeSelect(),
            this.getQueueItemSelect(options),
            $r("button", {
                onClick: function(){

                    game.time.queue.addToQueue(
                        self.state.itemId,
                        self.state.typeId,
                        self.state.itemLabel
                    );

                    //re-render component
                    self.forceUpdate();
                }
            }, "Add to queue"),

            this.getQueueItems()
        ]);
    }
});