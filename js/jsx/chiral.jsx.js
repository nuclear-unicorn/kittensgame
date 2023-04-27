/* global 

    $r,
    WTerminal: writable,
    WChiral: writable,
    game
*/

//https://github.com/zackargyle/react-bash/blob/master/src/bash.js
dojo.declare("classes.Bash", null, {

    constructor: function(commands) {
        this.commands = commands;
        this.prevCommands = [];
        this.prevCommandsIndex = 0;
    },

    /*
     * This parses and executes the given <input> and returns an updated
     * state object.
     *
     * @param {string} input - the user input
     * @param {Object} state - the current terminal state
     * @returns {Object} the new terminal state
     */
    execute: function(input) {
        this.prevCommands.push(input);
        this.prevCommandsIndex = this.prevCommands.length;

        //todo: exec
    },

    autocomplete: function(input) {

        var tokens = input.split(/ +/);
        var token = tokens.pop();
        var filter = function(item) { return item.indexOf(token) == 0; };
        var result = function(str) { return tokens.concat(str).join(' '); };

        if (tokens.length === 0) {
            var suggestions = Object.keys(this.commands).filter(filter);
            return suggestions.length === 1 ? result(suggestions[0]) : null;
        } else {
            //autocomplete commands, etc
        }
    },

    getPrevCommand: function() {
        return this.prevCommands[--this.prevCommandsIndex];
    },

    getNextCommand: function() {
        return this.prevCommands[++this.prevCommandsIndex];
    },

    hasPrevCommand: function() {
        return this.prevCommandsIndex !== 0;
    },

    hasNextCommand: function() {
        return this.prevCommandsIndex !== this.prevCommands.length - 1;
    }

});

//---------------------------------------

WTerminal = React.createClass({

    bash: null,

    componentWillMount: function(){
        this.bash = new classes.Bash({
            "help": {
                exec: function(){

                }
            },
            "work": {},
            "build": {},
            "sell": {}
        });
    },

    getInitialState: function(){
        return {
            command: null
        };
    },

    setCommand: function(e){
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        this.setState({command: e.target.value});
    },

    attemptAutocomplete: function(){
        var suggestion = this.bash.autocomplete(this.state.command || "");
        this.setState({command: suggestion});
    },

    handleKeyDown: function(evt) {
        //TAB_CHAR_CODE
        if (evt.which === 9) { 
            this.attemptAutocomplete();
            evt.preventDefault();
        //CARRIAGE RETURN
        } else if (evt.which === 13){   
            this.doSubmit();
            evt.preventDefault();
        }
    },

    handleKeyUp: function(evt) {

    },

    render: function(){
         return $r("div", null,
            [
                $r("input", {
                    type: "text",
                    ref: "input",
                    autoComplete: "off",
                    onKeyDown: this.handleKeyDown,
                    onKeyUp: this.handleKeyUp,
                    onChange: this.setCommand,
                    value: this.state.command,
                    placeholder: "Type 'help' to see the list of all commands",
                    style: {
                        width: "500px"
                    }
                }),
                $r("a", {
                    className: "link",
                    onClick: this.doSubmit
                }, "send")
            ]
        );
    },

    doSubmit: function() {
        //TODO: if ! bash.exec -> remote submit
        this.props.onSubmit(this.state.command);
    }
});

WChiral = React.createClass({
    getInitialState: function(){
        return {
            game: this.props.game
        };
    },
    
    componentDidMount: function(){
        var self = this;
        this.updateHandler = dojo.subscribe("ui/update", function(game){
            self.setState({game: game});
        });
    },

    componentWillUmount: function(){
        dojo.unsubscribe(this.updateHandler);
    },

    setCommand: function(e){
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        this.setState({command: e.target.value});
    },

    sendCommand: function(command){
        var game = this.state.game;
        game.server.sendCommand(command);
    },

    render: function(){
        var game = this.state.game;
        var fr = game.space.getPlanet("furthestRing");
        
        if (!fr.reached){
            return null;
        }

        if (game.server.userProfile){
            return $r("div", null, [
                $r("div", {className: "row"}, "An alien machine lies here at the End of the Universe."),
                $r("div", {className: "row"}, "666 nodes online"),
                $r("div", {className: "row"}, [
                    $r("pre", {
                        style: { whiteSpace: "pre-wrap" }
                    }, game.server.chiral || ">")
                ]),
                $r("div", {className: "row"}, [
                    $r(WTerminal, {
                        onSubmit: this.sendCommand
                    })
                ])
            ]);
        } else {
            return $r("div", null, "The furthest ring is empty and silent");
        }
    }
});