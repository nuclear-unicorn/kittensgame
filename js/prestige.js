dojo.declare("classes.managers.PrestigeManager", com.nuclearunicorn.core.TabManager, {

    perks:[{
		name: "engeneering",
		label: $I("prestige.engeneering.label"),
		description: $I("prestige.engeneering.desc"),
		prices: [{ name: "paragon", val: 5 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false,
		unlocks: {
			"perks": ["megalomania", "goldenRatio", "codexVox"]
		},
		effects:{
			"priceRatio" : -0.01
		}
	},{
		name: "codexVox",
		label: $I("prestige.codexVox.label"),
		description: $I("prestige.codexVox.desc"),
		prices: [{ name: "paragon", val: 25 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["codexLogos"]
		},
		effects:{
			"manuscriptCraftRatio" : 0.25,
			"manuscriptGlobalCraftRatio": 0.05
		}
	},{
		name: "codexLogos",
		label: $I("prestige.codexLogos.label"),
		description: $I("prestige.codexLogos.desc"),
		prices: [{ name: "paragon", val: 50 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["codexAgrum", "codexLeviathanianus"]
		},
		effects:{
			"manuscriptGlobalCraftRatio": 0.05,
			"compediumCraftRatio" : 0.25,
			"compediumGlobalCraftRatio": 0.05

		}
	},{
		name: "codexAgrum",
		label: $I("prestige.codexAgrum.label"),
		description: $I("prestige.codexAgrum.desc"),
		prices: [{ name: "paragon", val: 75 }],
		unlocked: false,
		researched: false,
		effects:{
			"manuscriptGlobalCraftRatio": 0.05,
			"compediumGlobalCraftRatio": 0.05,
			"blueprintCraftRatio" : 0.25,
			"blueprintGlobalCraftRatio": 0.05
		}
	}, {
		name: "megalomania",
		label: $I("prestige.megalomania.label"),
		description: $I("prestige.megalomania.desc"),
		prices: [{ name: "paragon", val: 10 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["blackCodex"],
			"zigguratUpgrades": ["marker", "blackPyramid"]
		}
	},{
		name: "blackCodex",
		label: $I("prestige.blackCodex.label"),
		description: $I("prestige.blackCodex.desc"),
		prices: [{ name: "paragon", val: 25 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"zigguratUpgrades": ["unicornGraveyard"]
		}
	},{
		name: "codexLeviathanianus",
		label: $I("prestige.codexLeviathanianus.label"),
		description: $I("prestige.codexLeviathanianus.desc"),
		prices: [{ name: "paragon", val: 75 }],
		unlocked: false,
		researched: false,
		unlocks: {
		}
	},{
		name: "goldenRatio",
		label: $I("prestige.goldenRatio.label"),
		description: $I("prestige.goldenRatio.desc"),
		prices: [{ name: "paragon", val: 50 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["divineProportion"]
		},
		effects:{
			"priceRatio" : -(1 + Math.sqrt(5)) / 200	//Calculates the Golden Ratio
		}
	},{
		name: "divineProportion",
		label: $I("prestige.divineProportion.label"),
		description: $I("prestige.divineProportion.desc"),
		prices: [{ name: "paragon", val: 100 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["vitruvianFeline"]
		},
		effects:{
			"priceRatio" : -16 / 900
		}
	},{
		name: "vitruvianFeline",
		label: $I("prestige.vitruvianFeline.label"),
		description: $I("prestige.vitruvianFeline.desc"),
		prices: [{ name: "paragon", val: 250 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["renaissance"]
		},
		effects:{
			"priceRatio" : -0.02
		}
	},{
		name: "renaissance",
		label: $I("prestige.renaissance.label"),
		description: $I("prestige.renaissance.desc"),
		prices: [{ name: "paragon", val: 750 }],
		unlocked: false,
		researched: false,
		effects:{
			"priceRatio" : -0.0225
		}
	},{
		name: "diplomacy",
		label: $I("prestige.diplomacy.label"),
		description: $I("prestige.diplomacy.desc"),
		prices: [{ name: "paragon", val: 5 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false,
		effects:{
			"standingRatio" : 0.1
		},
		unlocks: {
			"perks": ["zebraDiplomacy"]
		}
	},{
		name: "zebraDiplomacy",
		label: $I("prestige.zebraDiplomacy.label"),
		description: $I("prestige.zebraDiplomacy.desc"),
		prices: [{ name: "paragon", val: 35 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["zebraCovenant"]
		}
	},{
		name: "zebraCovenant",
		label: $I("prestige.zebraCovenant.label"),
		description: $I("prestige.zebraCovenant.desc"),
		prices: [{ name: "paragon", val: 75 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["navigationDiplomacy"]
		}
	},{
		name: "navigationDiplomacy",
		label: $I("prestige.navigationDiplomacy.label"),
		description: $I("prestige.navigationDiplomacy.desc"),
		prices: [{ name: "paragon", val: 300 }],
		unlocked: false,
		researched: false
	},{
		name: "chronomancy",
		label: $I("prestige.chronomancy.label"),
		description: $I("prestige.chronomancy.desc"),
		prices: [{ name: "paragon", val: 25 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false,
		unlocks: {
			"perks": ["astromancy", "anachronomancy", "unicornmancy"]
		}
	},{
		name: "astromancy",
		label: $I("prestige.astromancy.label"),
		description: $I("prestige.astromancy.desc"),
		prices: [{ name: "paragon", val: 50 }],
		unlocked: false,
		researched: false,
		unlocks: {
		}
	},{
		name: "unicornmancy",
		label: $I("prestige.unicornmancy.label"),
		description: $I("prestige.unicornmancy.desc"),
		prices: [{ name: "paragon", val: 125 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false
	},
	{
		name: "anachronomancy",
		label: $I("prestige.anachronomancy.label"),
		description: $I("prestige.anachronomancy.desc"),
		prices: [{ name: "paragon", val: 125 }],
		unlocked: false,
		researched: false
	},{
		name: "carnivals",
		label: $I("prestige.carnivals.label"),
		description: $I("prestige.carnivals.desc"),
		prices: [{ name: "paragon", val: 25 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false,
		unlocks: {
			"perks": ["numerology"]
		}
	},{
		name: "willenfluff",
		label: $I("prestige.willenfluff.label"),
		description: $I("prestige.willenfluff.desc"),
		prices: [{ name: "paragon", val: 150 }],
		unlocked: false,
		researched: false,
		effects: {
			"kittenGrowthRatio": 0.75
		},
		unlocks: {
			"perks": ["pawgan"]
		}
     },{
		name: "pawgan",
		label: $I("prestige.pawgan.label"),
		description: $I("prestige.pawgan.desc"),
		prices: [{ name: "paragon", val: 400 }],
		unlocked: false,
		researched: false,
		effects: {
			"kittenGrowthRatio": 1.50
		}
     },{
		name: "numerology",
		label: $I("prestige.numerology.label"),
		description: $I("prestige.numerology.desc"),
		prices: [{ name: "paragon", val: 50 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["numeromancy", "willenfluff", "voidOrder"]
		}
	},{
		name: "numeromancy",
		label: $I("prestige.numeromancy.label"),
		description: $I("prestige.numeromancy.desc"),
		prices: [{ name: "paragon", val: 250 }],
		unlocked: false,
		researched: false,
		unlocks: {
			"perks": ["malkuth"]
		}
	},
    //---------------------------------------------------
    {
        name: "malkuth",
        label: $I("prestige.malkuth.label"),
        description: $I("prestige.malkuth.desc"),
        prices: [{ name: "paragon", val: 500 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["yesod"]
		}
    },{
        name: "yesod",
        label: $I("prestige.yesod.label"),
        description: $I("prestige.yesod.desc"),
		prices: [{ name: "paragon", val: 750 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["hod"]
		}
    },{
        name: "hod",
        label: $I("prestige.hod.label"),
        description: $I("prestige.hod.desc"),
        prices: [{ name: "paragon", val: 1250 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["netzach"]
		}
    },{
        name: "netzach",
        label: $I("prestige.netzach.label"),
        description: $I("prestige.netzach.desc"),
        prices: [{ name: "paragon", val: 1750 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["tiferet"]
		}

    },{
        name: "tiferet",
        label: $I("prestige.tiferet.label"),
        description: $I("prestige.tiferet.desc"),
        prices: [{ name: "paragon", val: 2500 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["gevurah"]
		}

    },{
        name: "gevurah",
        label: $I("prestige.gevurah.label"),
        description: $I("prestige.gevurah.desc"),
        prices: [{ name: "paragon", val: 5000 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["chesed"]
		}

    },{
        name: "chesed",
        label: $I("prestige.chesed.label"),
        description: $I("prestige.chesed.desc"),
        prices: [{ name: "paragon", val: 7500 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["binah"]
		}

    },{
        name: "binah",
        label: $I("prestige.binah.label"),
        description: $I("prestige.binah.desc"),
        prices: [{ name: "paragon", val: 15000 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["chokhmah"]
		}

    },{
        name: "chokhmah",
        label: $I("prestige.chokhmah.label"),
        description: $I("prestige.chokhmah.desc"),
        prices: [{ name: "paragon", val: 30000 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        },
		unlocks: {
			"perks": ["keter"]
		}

    },{
        name: "keter",
        label: $I("prestige.keter.label"),
        description: $I("prestige.keter.desc"),
        prices: [{ name: "paragon", val: 60000 }],
        unlocked: false,
        researched: false,
        effects:{
            "paragonRatio" : 0.05
        }
    },
		//2500, 5000, 7500, 15000
    //---------------------------------------------------
    {
		name: "voidOrder",
		label: $I("prestige.voidOrder.label"),
		description: $I("prestige.voidOrder.desc"),
		prices: [{ name: "paragon", val: 75 }],
		unlocked: false,
		researched: false
	},{
		name: "adjustmentBureau",
		label: $I("prestige.adjustmentBureau.label"),
		description: $I("prestige.adjustmentBureau.desc"),
		prices: [{ name: "paragon", val: 5 }],
		unlocked: true,
		defaultUnlocked: true,
		researched: false,
		unlocks: {
			"perks": ["ascoh"],
			"tabs": ["challenges"]
		}
	},{
		name: "ascoh",
		label: $I("prestige.ascoh.label"),
		description: $I("prestige.ascoh.desc"),
		prices: [{ name: "paragon", val: 5 }],
		unlocked: false,
		defaultUnlocked: false,
		researched: false
	}],

	game: null,

	constructor: function(game){
		this.game = game;
		this.registerMeta("research", this.perks, null);
		this.setEffectsCachedExisting();
	},

	resetState: function(){
		for (var i = 0; i < this.perks.length; i++){
			var perk = this.perks[i];
			perk.unlocked = perk.defaultUnlocked || false;
			perk.researched = false;
		}
	},

	save: function(saveData){
		saveData.prestige = {
			perks: this.filterMetadata(this.perks, ["name", "unlocked", "researched"])
		};
	},

	load: function(saveData){
		if (!saveData.prestige){
			return;
		}

		this.loadMetadata(this.perks, saveData.prestige.perks);

		for (var i = 0; i < this.perks.length; i++){
			var perk = this.perks[i];
			if (perk.researched){
				this.game.unlock(perk.unlocks);
			}
		}
	},

	update: function(){

	},

	getPerk: function(name){
		return this.getMeta(name, this.perks);
	},

	getSpentParagon: function(){
		var paragon = 0;
		for (var i = 0; i < this.perks.length; i++){
			var perk = this.perks[i];
			if (perk.researched){
				paragon += perk.paragon || 0;
			}
		}
		return paragon;
	},

    getParagonRatio: function(){
        return 1.0 + this.game.getEffect("paragonRatio");
    },

	getBurnedParagonRatio: function(){
		return this.game.getUnlimitedDR(this.game.resPool.get("burnedParagon").value, 500);
	},

	getParagonProductionRatio: function(){
		var paragonRatio = this.getParagonRatio();

		var productionRatioParagon = (this.game.resPool.get("paragon").value * 0.010) * paragonRatio;
		productionRatioParagon = this.game.getLimitedDR(productionRatioParagon, 2 * paragonRatio);

		var ratio = this.game.calendar.darkFutureYears() >= 0 ? 4 : 1;
		var productionRatioBurnedParagon = this.game.resPool.get("burnedParagon").value * 0.010 * paragonRatio;
		productionRatioBurnedParagon = this.game.getLimitedDR(productionRatioBurnedParagon, ratio * paragonRatio);

		return productionRatioParagon + productionRatioBurnedParagon;
	},

	getParagonStorageRatio: function(){
		var paragonRatio = this.getParagonRatio();
		var storageRatio = (this.game.resPool.get("paragon").value / 1000) * paragonRatio; //every 100 paragon will give a 10% bonus to the storage capacity
		if (this.game.calendar.darkFutureYears() >= 0) {
			storageRatio += (this.game.resPool.get("burnedParagon").value / 500) * paragonRatio;
		} else {
			storageRatio += (this.game.resPool.get("burnedParagon").value / 2000) * paragonRatio;
		}
		return storageRatio;
	},

	unlockAll: function(){
		for (var i in this.perks){
			this.perks[i].unlocked = true;
		}
		this.game.msg("All meta upgrades are unlocked!");
	}
});


dojo.declare("classes.ui.PrestigeBtnController", com.nuclearunicorn.game.ui.BuildingNotStackableBtnController, {
	getMetadata: function(model){
        if (!model.metaCached){
            model.metaCached = this.game.prestige.getPerk(model.options.id);
        }
        return model.metaCached;
    },

   	buyItem: function(model, event, callback) {
		if (this.game.science.get("metaphysics").researched) {
			this.inherited(arguments);
		} else {
			callback(false);
		}
	},

	updateVisible: function(model){
		var meta = model.metadata;
		model.visible = meta.unlocked && (meta.researched || this.game.science.get("metaphysics").researched);

		if (meta.researched && this.game.science.hideResearched){
			model.visible = false;
		}
	}
});

dojo.declare("classes.ui.BurnParagonBtnController", com.nuclearunicorn.game.ui.ButtonModernController, {
	updateVisible: function(model){
		model.visible = this.game.resPool.get("paragon").value > 0;
	}
});

dojo.declare("classes.ui.turnHGOffButtonController", com.nuclearunicorn.game.ui.ButtonModernController, {
	updateVisible: function(model){
		model.visible = (this.game.religion.activeHolyGenocide > 0) || (this.game.religion.getTU("holyGenocide").on > 0);
	}
});

dojo.declare("classes.ui.PrestigePanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,

	constructor: function(){
	},

    render: function(container){
		var content = this.inherited(arguments);

		var self = this;
		//---------------------------------------------------------------
		var controller = new classes.ui.PrestigeBtnController(this.game);
		dojo.forEach(this.game.prestige.perks, function(perk, i){
			var button = new com.nuclearunicorn.game.ui.BuildingResearchBtn({id: perk.name, controller: controller}, self.game);
			button.render(content);
			self.addChild(button);
		});
		//--------------------------------------------------------------------
		var buttonBP = new com.nuclearunicorn.game.ui.ButtonModern({
			name : $I("prestige.btn.burnParagon.label"),
			description: $I("prestige.btn.burnParagon.desc"),
			handler: dojo.hitch(this, function(){
				this.game.discardParagon();
			}),
			controller: new classes.ui.BurnParagonBtnController(self.game)
		}, self.game);
		buttonBP.render(content);
		self.addChild(buttonBP);
		var buttonOffHG = new com.nuclearunicorn.game.ui.ButtonModern({
			name : $I("prestige.btn.turnHGOff.label"),
			description: $I("prestige.btn.turnHGOff.desc"),
			handler: dojo.hitch(this, function(){
				this.game.religion.turnHGOff();
			}),
			controller: new classes.ui.turnHGOffButtonController(self.game)
		}, self.game);
		buttonOffHG.render(content);
		self.addChild(buttonOffHG);
		//---------------------------------------------------------------------
	}

});
