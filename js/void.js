dojo.declare("classes.managers.VoidManager", com.nuclearunicorn.core.TabManager, {
    game: null,

    faction: null,

    constructor: function(game){
        this.game = game;
        this.registerMeta("stackable", this.voidUpgrades, null);
    },

    save: function(saveData){
        saveData.void = {
            vu: this.filterMetadata(this.voidUpgrades, ["name", "val", "on", "unlocked"]),
            faction: this.faction
        };
    },

    load: function(saveData){
        if (!saveData.void){
            return;
        }

        this.faction = saveData.void.faction || null;
    },

    update: function(){
    },

    resetState: function(){

    },

    voidUpgrades:[{
        name: "spaceCathedral",
        label: $I("void.spaceCathedral.label"),
        description: $I("void.spaceCathedral.desc"),
        prices: [{ name: "relic", val: 1 }],
        researched: false
    }],

    getVU: function(name){
        return this.getMeta(name, this.voidUpgrades);
    }
});


/*dojo.declare("classes.ui.space.VoidBuildingController", com.nuclearunicorn.game.ui.PlanetBuildingBtnController, {
	updateVisible: function(model){
		var meta = model.metadata;
		if (this.game.calendar.day < 0){
			model.visible = meta.unlocked;
		} else {
			model.visible = false;
		}
	}
});*/

dojo.declare("classes.ui.RorshachWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){
    },

    render: function(container){
        var div = dojo.create("div", null, container);
        var factionDashboard = dojo.create("span", {}, div);

        this.factionDashboard = factionDashboard;
    },

    update: function(){
        /*var msg = "Faction: " + (this.game.void.faction || "N/A") + "<br>";
        msg += "GUID: " + this.game.telemetry.guid + "<br>";*/

        var msg = "";

        this.factionDashboard.innerHTML = msg;
    }
});