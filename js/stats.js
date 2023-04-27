dojo.declare("classes.managers.StatsManager", com.nuclearunicorn.core.TabManager, {
    game: null,

    stats:
        [{
            name: "totalKittens",
            title: $I("stats.kittens.total"),
            val: 0,
            unlocked: true,
			defaultUnlocked: true
        },{
            name: "kittensDead",
            title: $I("stats.kittens.dead"),
            val: 0,
            unlocked: true,
			defaultUnlocked: true
        },{
            name: "totalYears",
            title: $I("stats.years.total"),
            val: 0,
            unlocked: true,
			defaultUnlocked: true
        }, {
            name: "totalResets",
            title: $I("stats.run.number"),
            val: 0,
            unlocked: true,
            defaultUnlocked: true
        },{
            name: "totalParagon",
            title:  $I("stats.paragon.total"),
            val: 0,
            unlocked: false
        }, {
            name: "eventsObserved",
            title: $I("stats.events.total"),
            val: 0,
            unlocked: false
        }, {
            name: "unicornsSacrificed",
            title: $I("stats.unicorns"),
            val: 0,
            unlocked: false
        }, {
            name: "buildingsConstructed",
            title: $I("stats.buildings"),
            val: 0,
            unlocked: false
        }, {
            name: "totalClicks",
            title: $I("stats.clicks.total"),
            val: 0,
            unlocked: false
        },{
            name: "totalTrades",
            title:  $I("stats.trades.total"),
            val: 0,
            unlocked: false
        },{
            name: "totalCrafts",
            title: $I("stats.crafts.total"),
            val: 0,
            unlocked: false
        },{
            name: "averageKittens",
            title:  $I("stats.kittens.avg"),
            val: 0,
            calculate: function(game){
                return game.stats.getStat("totalYears").val != 0 ? game.stats.getStat("totalKittens").val / Math.ceil(game.stats.getStat("totalYears").val / 100) : 0;
            },
            unlocked: false
        }
    ],

    statsCurrent: [{
        name: "totalTrades",
        title: $I("stats.trades.current"),
        val: 0,
        unlocked: false
    },{
        name: "totalCrafts",
        title:$I("stats.crafts.current") ,
        val: 0,
        unlocked: false
    },{
        name: "averageKittens",
        title:  $I("stats.kittens.current"),
        val: 0,
        calculate: function(game){
            return game.calendar.year != 0 ? game.resPool.get("kittens").value / Math.ceil(game.calendar.year / 100) : 0;
        }},{
        name: "timePlayed",
        title: $I("stats.time.current"),
        val: 0,
        calculate: function (game) {
            return game.toDisplaySeconds(game.calendar.trueYear() * game.calendar.seasonsPerYear * game.calendar.daysPerSeason * game.calendar.ticksPerDay / game.ticksPerSecond);
        },
        unlocked: false
    }
    ],

    statGroups: null,

    constructor: function(game){
        this.game = game;

        this.statGroups = [
            {
                group: this.stats,
                title: $I("stats.group.all")
            },
            {
                group: this.statsCurrent,
                title: $I("stats.group.current")
            }
        ];
    },

	resetState: function(){
		for (var i = 0; i < this.stats.length; i++){
			var stat = this.stats[i];
			stat.val = 0;
			stat.unlocked = stat.defaultUnlocked || false;
		}

		for (i = 0; i < this.statsCurrent.length; i++){
			var stat = this.statsCurrent[i];
			stat.val = 0;
			stat.unlocked = stat.defaultUnlocked || false;
		}
	},

	save: function(saveData){
        saveData.stats = this.filterMetadata(this.stats, ["name", "val"]);
        saveData.statsCurrent = this.filterMetadata(this.statsCurrent, ["name", "val"]);
    },

    load: function(saveData){
		this.loadMetadata(this.stats, saveData.stats);
		this.loadMetadata(this.statsCurrent, saveData.statsCurrent);
    },

    getStat: function(name){
        return this.getMeta(name, this.stats);
    },

    getStatCurrent: function (name) {
        var stat = this.getMeta(name, this.statsCurrent);
        if (stat.calculate) {stat.val = stat.calculate(this.game);}
        return stat;
    },

    resetStatsCurrent: function () {
        for (var i in this.statsCurrent) {
            this.statsCurrent[i].val = 0;
        }
    },

    unlockAll: function(){
        for (var i in this.statsCurrent) {
            this.statsCurrent[i].unlocked = true;
        }
        for (var i in this.stats) {
            this.stats[i].unlocked = true;
        }
    }

});

dojo.declare("classes.tab.StatsTab", com.nuclearunicorn.game.ui.tab, {

    container: null,

    constructor: function(tabName){

    },

    render: function(content){
        this.container = content;

        this.update();
    },

    update: function(){

        dojo.empty(this.container);


        for (var idx in this.game.stats.statGroups) {
            var statGroup = this.game.stats.statGroups[idx];

            dojo.create("h1", {
                innerHTML: statGroup.title
            }, this.container);

            var stats = statGroup.group;
            var table = dojo.create("table", {class: "statTable"}, this.container);

            for (var i in stats) {
                var stat = stats[i];

                if (stat.calculate) {
                    stat.val = stat.calculate(this.game);
                }

                if (stat.val != 0) {
                    stat.unlocked = true;
                }

                if (stat.name == "totalResets") {
                    stat.val++;
                }

                var tr = dojo.create("tr", null, table);
                dojo.create("td", {
                    innerHTML: stat.unlocked ? stat.title : "???"
                }, tr);
                dojo.create("td", {
                    innerHTML: stat.unlocked
                        ? typeof stat.val == "number" ? this.game.getDisplayValueExt(stat.val) : stat.val
                        : ""
                }, tr);

                if (stat.name == "totalResets") {
                    stat.val--;
                }
            }
        }
    }
});
