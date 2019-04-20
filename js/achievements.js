dojo.declare("classes.managers.Achievements", com.nuclearunicorn.core.TabManager, {
    game: null,
    councilUnlocked: false,

    achievements: [
        {
            name: "theElderLegacy",
            title: $I("achievements.theElderLegacy.title"),
            description: $I("achievements.theElderLegacy.desc"),
            condition: function () {
                var date = new Date();
                return (date.getMonth() == 0 && date.getFullYear() == 2017);
            },
            hidden: true
        },
        {
            name: "unicornConspiracy",
            title: $I("achievements.unicornConspiracy.title"),
            description: $I("achievements.unicornConspiracy.desc"),
            condition: function () {
                return ( this.game.resPool.get("unicorns").value > 0 );
            }
        }, {
            name: "uniception",
            title: $I("achievements.uniception.title"),
            description: $I("achievements.uniception.desc"),
            condition: function () {
                return ( this.game.resPool.get("tears").value > 0 );
            }
        }, {
            name: "sinsOfEmpire",
            title: $I("achievements.sinsOfEmpire.title"),
            description: $I("achievements.sinsOfEmpire.desc"),
            condition: function () {
                return ( this.game.resPool.get("alicorn").value > 0 );
            }
        }, {
            name: "anachronox",
            title: $I("achievements.anachronox.title"),
            description: $I("achievements.anachronox.desc"),
            condition: function () {
                return ( this.game.resPool.get("timeCrystal").value > 0 );
            }
        }, {
            name: "deadSpace",
            title: $I("achievements.deadSpace.title"),
            description: $I("achievements.deadSpace.desc"),
            condition: function () {
                return ( this.game.resPool.get("necrocorn").value > 0 );
            }
        }, {
            name: "ironWill",
            title: $I("achievements.ironWill.title"),
            description: $I("achievements.ironWill.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("mine").val > 0 );
            }
        }, {
            name: "uberkatzhen",
            title: $I("achievements.uberkatzhen.title"),
            description: $I("achievements.uberkatzhen.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("warehouse").val > 0 );
            }
        }, {
            name: "hundredYearsSolitude",
            title: $I("achievements.hundredYearsSolitude.title"),
            description: $I("achievements.hundredYearsSolitude.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("steamworks").val > 0 );
            }
        }, {
            name: "soilUptuned",
            title: $I("achievements.soilUptuned.title"),
            description: $I("achievements.soilUptuned.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("pasture").val >= 45 );
            }
        }, {
            name: "atlasUnmeowed",
            title: $I("achievements.atlasUnmeowed.title"),
            description: $I("achievements.atlasUnmeowed.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("magneto").val > 0 );
            }
        }, {
            name: "meowMeowRevolution",
            title: $I("achievements.meowMeowRevolution.title"),
            description: $I("achievements.meowMeowRevolution.desc"),
            condition: function () {
                return ( this.game.ironWill && !this.game.resPool.get("kittens").value && this.game.bld.get("factory").val > 0 );
            }
        }, {
            name: "spaceOddity",
            title: $I("achievements.spaceOddity.title"),
            description: $I("achievements.spaceOddity.desc"),
            starDescription: $I("achievements.spaceOddity.starDesc"),
            condition: function () {
                return ( this.game.ironWill && this.game.space.getProgram("moonMission").on );
            },
            starCondition: function () {
                return ( this.game.ironWill && this.game.space.getProgram("moonMission").on && this.game.resPool.get("paragon").value < 10);
            },
            hasStar: true
        }, {
            name: "jupiterAscending",
            title: $I("achievements.jupiterAscending.title"),
            description: $I("achievements.jupiterAscending.desc"),
            condition: function () {
                return ( this.game.space.getProgram("orbitalLaunch").on && this.game.calendar.year <= 1);
            }
        }, {
            name: "shadowOfTheColossus",
            title: $I("achievements.shadowOfTheColossus.title"),
            description: $I("achievements.shadowOfTheColossus.desc"),
            condition: function () {
                return ( this.game.bld.get("ziggurat").val > 0 && this.game.village.maxKittens == 1);
            }
        }, {
            name: "sunGod",
            title: $I("achievements.sunGod.title"),
            description: $I("achievements.sunGod.desc"),
            condition: function () {
                return ( this.game.religion.faith >= 696342 );
            }
        }, {
            name: "heartOfDarkness",
            title: $I("achievements.heartOfDarkness.title"),
            description: $I("achievements.heartOfDarkness.desc"),
            condition: function () {
                return (this.game.resPool.get("zebras").value > 1);
            }
        }, {
            name: "winterIsComing",
            title: $I("achievements.winterIsComing.title"),
            description: $I("achievements.winterIsComing.desc"),
            unethical: true,
            condition: function () {
                return (this.game.deadKittens >= 10);
            }
        }, {
            name: "youMonster",
            title: $I("achievements.youMonster.title"),
            unethical: true,
            description: $I("achievements.youMonster.desc"),
            condition: function () {
                return (this.game.deadKittens >= 100);
            }
        }, {
            name: "superUnethicalClimax",
            title: $I("achievements.superUnethicalClimax.title"),
            unethical: true,
            description: $I("achievements.superUnethicalClimax.desc"),
            condition: function () {
                return (this.game.cheatMode);
            }
        }, {
            name: "systemShock",
            title: $I("achievements.systemShock.title"),
            unethical: true,
            description: $I("achievements.systemShock.desc"),
            condition: function () {
                return (this.game.systemShockMode);
            }
        },
        {
            name: "lotusMachine",
            title: $I("achievements.lotusMachine.title"),
            description: $I("achievements.lotusMachine.desc"),
            condition: function () {
                return (this.game.resPool.get("karma").value >= 1);
            }
        }, {
            name: "serenity",
            title: $I("achievements.serenity.title"),
            description: $I("achievements.serenity.desc"),
            condition: function () {
                return (this.game.village.getKittens() >= 50 && this.game.deadKittens == 0);
            }
        },
        {
            name: "utopiaProject",
            title: $I("achievements.utopiaProject.title"),
            description: $I("achievements.utopiaProject.desc"),
            starDescription: $I("achievements.utopiaProject.starDesc"),
            condition: function () {
                return (this.game.village.happiness >= 1.5 && this.game.resPool.get("kittens").value > 35);
            },
            starCondition: function () {
                return (this.game.village.happiness >= 5 && this.game.resPool.get("kittens").value > 35);
            },
            hasStar: true
        }, {
            name: "cathammer",
            title: $I("achievements.cathammer.title"),
            description: $I("achievements.cathammer.desc"),
            starDescription: $I("achievements.cathammer.starDesc"),
            condition: function () {
                return this.game.stats.getStat("totalYears").val >= 40000;
            },
            starCondition: function () {
                return (this.game.calendar.trueYear() >= 40000);
            },
            hasStar: true
    }],

    hats: [
        {   id: 1,
            name: "simpleHat",
            title: "Simple Hat",
            description: "The hat to rule them all",
            difficulty: "F"
        },
        {   id: 2,
            name: "lotusHat",
            title: "Lotus Hat",
            description: "Hat in the shape of louts",
            difficulty: "A",
            condition: function(){
                return this.game.stats.getStat("totalResets").val >= 50;
            }
        },
        {   id: 3,
            name: "ivoryTowerHat",
            title: "Ivory Tower Hat",
            description: "A tall hat in a form of a tower",
            difficulty: "S+"
        },
        {   id: 4,
            name: "uselessHat",
            title: "Useless Hat",
            description: "This hat is totally useless",
            difficulty: "F",
            condition: function(){
                var leader = this.game.village.leader;
                return leader != null && leader.trait.name == "none";
            }
        },
        {   id: 5,
            name: "voidHat",
            title: "Void Hat",
            description: "Hat is made of void",
            difficulty: ""
        },
        {   id: 6,
            name: "nullHat",
            title: "Null Hat",
            description: "The hat is a lie",
            difficulty: ""
        },
        {   id: 7,
            name: "betaHat",
            title: "Beta Hat",
            description: "The hat is a bit glitchy and rough around the edges",
            difficulty: "B",
            condition: function(){
                return (this.game.server.donateAmt == 0);
            }
        },{
            id: 8,
            name: "silentHat",
            title: "Silent Hat",
            description: "This hat is totally silent",
            difficulty: "S",
            condition: function(){
                return (this.game.server.motdContent == "");
            }
        },{
            id: 9,
            name: "treetrunkHat",
            title: "Treetrunk Hat",
            description: "A hat made of branches and leaves",
            difficulty: "F"
        },{
            id: 10,
            name: "wizardHat",
            title: "Wizard Hat",
            description: "Abracadabra!",
            difficulty: ""
        },{
            id: 11,
            name: "nekomimiHat",
            title: "Nekomimi Hat",
            description: "*^_^*",
            difficulty: ""
        },{
            id: 12,
            name: "eldritchHat",
            title: "Eldritch Hat",
            description: "",
            difficulty: ""
        },{
            id: 13,
            name: "tesseractHat",
            title: "Tesseract Hat",
            description: "",
            difficulty: ""
        },{
            id: 14,
            name: "crimsonHat",
            title: "Crimson Hat",
            description: "",
            difficulty: ""
        },{
            id: 15,
            name: "skeletonHat",
            title: "Skeleton Hat",
            description: "",
            difficulty: ""
        },{
            id: 16,
            name: "gladosHat",
            title: "Glados Hat",
            description: "",
            difficulty: ""
        },{
            id: 17,
            name: "marioHat",
            title: "Mario Hat",
            description: "",
            difficulty: ""
        },{
            id: 18,
            name: "fedoraHat",
            title: "Fedora",
            description: "Classy fedora",
            difficulty: ""
        },{
            id: 19,
            name: "necrocornHat",
            title: "Necrocorn Hat",
            description: "",
            difficulty: "S",
            condition: function(){
                var kittens = this.game.resPool.get("kittens");
                return (kittens.value >= 1000 && kittens.maxValue == 0);
            }
        },{
            id: 20,
            name: "alicornHat",
            title: "Alicorn Hat",
            description: "",
            difficulty: "S",
            condition: function(){
                return (this.game.resPool.get("kittens").value > 500 && this.game.resPool.get("alicorn").value == 0);
            }
        },{
            id: 21,
            name: "unicornHat",
            title: "Unicorn Hat",
            description: "",
            difficulty: "A"
        },{
            id: 22,
            name: "dragonHat",
            title: "Dragon Hat",
            description: "",
            difficulty: ""
        },{
            id: 23,
            name: "glitchyHat",
            title: "Glitchy Hat",
            description: "♋︎⬧︎⧫︎♏︎❒︎🕯︎⬧︎ ●︎♋︎■︎♑︎◆︎♋︎♑︎♏︎ 🖳︎✆",
            difficulty: "S"
        },{
            id: 24,
            name: "topHat",
            title: "Tophat",
            description: "",
            difficulty: ""
        },{
            id: 25,
            name: "jesterHat",
            title: "Jester Hat",
            description: "",
            difficulty: ""
        },{
            id: 26,
            name: "fezHat",
            title: "Fez Hat",
            description: "A prism-shaped red fez hat.",
            difficulty: "A"
        }
    ],

    constructor: function (game) {
        this.game = game;
    },

    get: function (name) {
        return this.getMeta(name, this.achievements);
    },

    getHat: function(name){
        return this.getMeta(name, this.hats);
    },

    unlockHat: function(name){
        var hat = this.getHat(name);
        hat.unlocked = true;
        console.log("'", hat.name, "' hat is unlocked!");
        this.game.achievements.councilUnlocked = true;
    },

    hasUnlocked: function () {
        for (var i = 0; i < this.achievements.length; i++) {
            if (this.achievements[i].unlocked) {
                return true;
            }
        }
        return false;
    },

    update: function () {
        for (var i in this.achievements) {
            var ach = this.achievements[i];
            if (!ach.unlocked && dojo.hitch(this, ach.condition)()) {
                ach.unlocked = true;
                this.game.msg($I("achievements.msg.unlock", [ach.title]));
                this.game.achievementTab.visible = true;

                this.updateStatistics();
            }
            if (ach.hasStar && !ach.starUnlocked && dojo.hitch(this, ach.starCondition)()) {
                ach.starUnlocked = true;
                this.game.msg($I("achievements.msg.starUnlock", [ach.title]));
                this.game.achievementTab.visible = true;

                this.updateStatistics();
            }
        }

        for (var i in this.hats) {
            var hat = this.hats[i];
            //console.log("checking the hat", hat, hat.condition, hat.condition && dojo.hitch(this, hat.condition)());
            if (!hat.unlocked && hat.condition && dojo.hitch(this, hat.condition)()) {
                console.log("'", hat.name, "' hat is unlocked!");
                hat.unlocked = true;
                this.councilUnlocked = true;
            }
        }
    },

    updateStatistics: function () {
        if (this.game.kongregate) {

            var achievementsCount = 0;
            for (var i = 0; i < this.achievements.length; i++) {
                var ach = this.achievements[i];
                if (ach.unlocked) {
                    achievementsCount++;

                    this.game.kongregate.stats.submit("achievement_" + ach.name, 1);
                }
            }

            this.game.kongregate.stats.submit("achievements", achievementsCount);
        }
    },

	resetState: function(){
		for (var i = 0; i < this.achievements.length; i++){
			var ach = this.achievements[i];
			ach.unlocked = false;
			ach.starUnlocked = false;
		}

        this.councilUnlocked = false;
        for (var i = 0; i < this.hats.length; i++){
            var hat = this.hats[i];
            hat.unlocked = false;
        }
	},

    save: function (saveData) {
        saveData.achievements = this.game.bld.filterMetadata(this.achievements, ["name", "unlocked", "starUnlocked"]);
        saveData.ach = {
            councilUnlocked : this.councilUnlocked,
            hats: this.game.bld.filterMetadata(this.hats, ["name", "unlocked"])
        };
    },

    load: function (saveData) {
		this.loadMetadata(this.achievements, saveData.achievements);

        var ach = saveData.ach || {};
        this.councilUnlocked = ach.councilUnlocked || false;
        if (ach.hats){
            this.loadMetadata(this.hats, ach.hats);
        }
    },

    unlockAll: function(){
        for (var i in this.achievements){
            this.achievements[i].unlocked = true;
        }
        this.game.msg("All achievements are unlocked");
    }
});

dojo.declare("classes.ui.Hat", [mixin.IGameAware], {
    constructor: function(opts){
        this.opts = opts;
    },
    render: function(container) {
        var div = dojo.create("div", {
            style:{display:"flex", marginRight:"5px", width: "30px", height: "30px", border: "1px solid gray", fontSize: "12px"}
        }, container);
        var span = dojo.create("span", {}, div);
        span.innerHTML = "#" + this.opts.id;

        UIUtils.attachTooltip(this.game, div, 0, 50, dojo.hitch(this, function(){
            var tooltip = "<span style='font-style: italic;'>" + this.opts.title + "</span><br>" + this.opts.description + "<br>" + "Difficulty: " + this.opts.difficulty;
            return tooltip;
        }));

        this.body = div;
    },
    update: function(){
        //render a rainbow colors if foiled
        dojo.style(this.body, "display", this.opts.unlocked ? "inline-flex" : "none");
    }
});

dojo.declare("classes.ui.HatWgt", [mixin.IChildrenAware, mixin.IGameAware], {
    constructor: function(game){

        for (var i in game.achievements.hats){
            var hatMeta = game.achievements.hats[i];
            var hat = new classes.ui.Hat(hatMeta);
            hat.setGame(game);
            this.addChild(hat);
        }
    },

    render: function(container){
        var div = dojo.create("div", null, container);

        var btnsContainer = dojo.create("div", {style:{paddingTop:"20px"}}, div);
        this.inherited(arguments, [btnsContainer]);
    },

    update: function(){
        this.inherited(arguments);
    }
});

dojo.declare("com.nuclearunicorn.game.ui.tab.AchTab", com.nuclearunicorn.game.ui.tab, {

    constructor: function(){
        this.hatsPanel = new com.nuclearunicorn.game.ui.Panel("A Secret Council of Hats");
        //this.hatsPanel.setVisible(this.game.achievements.councilUnlocked);
        this.hatsPanel.setVisible(this.game.prestige.getPerk("ascoh").researched && this.game.achievements.councilUnlocked);

        var hatsWgt = new classes.ui.HatWgt(this.game);
        this.hatsPanel.addChild(hatsWgt);

        this.addChild(this.hatsPanel);
    },

	render: function(content){
		var div = dojo.create("div", {}, content);

		div.innerHTML = "";
        var divHeader = dojo.create("div", {className: "achievement-header"}, div);
        var totalAchievements = 0;
        var completedAchievements = 0;
        var completedStars = 0;
        var uncompletedStars = 0;
		for (var i in this.game.achievements.achievements){
			var ach = this.game.achievements.achievements[i];
            if (!ach.unlocked && ach.hidden){
                continue;
            }

            totalAchievements++;

            if (ach.unlocked) { completedAchievements++; }
            var className = "achievement";
            if (ach.unlocked && ach.unethical) className += " unethical";
            if (ach.unlocked) className += " unlocked";
            if (ach.starUnlocked) className += " starUnlocked";
			var span = dojo.create("span", {
				className: className,
				title: ach.unlocked ? ach.description : "???",
				innerHTML : ach.unlocked ? ach.title : "???"
			}, div);

			if (!ach.hasStar) {
				continue;
			}

			if (ach.starUnlocked) {
				completedStars++;
			} else {
				uncompletedStars++;
			}
			var star = dojo.create("div", {
				className: "star",
				innerHTML: ach.starUnlocked ? "&#9733;" : "&#9734;",
				title: ach.starUnlocked ? ach.starDescription : "???"
			}, span);
		}
		divHeader.innerHTML = $I("achievements.header", [completedAchievements, totalAchievements]);
		var stars = "";
		for (var i = completedStars; i > 0; --i) {
			stars += "&#9733;";
		}
		for (var i = uncompletedStars; i > 0; --i) {
			stars += "&#9734;";
		}
		dojo.create("span", {
			className: "star",
			innerHTML: stars
		}, divHeader);

        //---------------------------
        //         Blah
        //---------------------------
        this.container = content;

        this.inherited(arguments);
        this.update();
        //--------------------------
	},

    update: function() {
        this.inherited(arguments);
        this.hatsPanel.setVisible(this.game.prestige.getPerk("ascoh").researched && this.game.achievements.councilUnlocked);
    }
});
