dojo.declare("classes.managers.Achievements", com.nuclearunicorn.core.TabManager, {
    game: null,
    badgesUnlocked: false,

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
            name: "sadnessAbyss",
            title: $I("achievements.sadnessAbyss.title"),
            description: $I("achievements.sadnessAbyss.desc"),
            condition: function() {
                return this.game.resPool.get("sorrow").value >= 100;
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
        }, {
            name: "jupiterAscending",
            title: $I("achievements.jupiterAscending.title"),
            description: $I("achievements.jupiterAscending.desc"),
            starDescription: $I("achievements.jupiterAscending.starDesc"),
            condition: function () {
                return ( this.game.space.getProgram("orbitalLaunch").on && this.game.calendar.year <= 1);
            },
            starCondition: function() {
                return (this.game.startedWithoutChronospheres && this.game.space.getProgram("orbitalLaunch").on && this.game.calendar.year <= 1);
            }
        }, {
            name: "veryLargeArray",
            title: $I("achievements.veryLargeArray.title"),
            description: $I("achievements.veryLargeArray.desc"),
            condition: function() {
                return this.game.bld.get("observatory").on >= 100 && !this.game.workshop.get("seti").researched;
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
            starDescription: $I("achievements.youMonster.starDesc"),
            condition: function () {
                return (this.game.deadKittens >= 100);
            },
            starCondition: function () {
                return (this.game.deadKittens >= 666666);
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
            starDescription: $I("achievements.serenity.starDesc"),
            condition: function () {
                return (this.game.village.getKittens() >= 50 && this.game.deadKittens == 0);
            },
            starCondition: function() {
                return (this.game.village.getKittens() >= 1000 && this.game.deadKittens == 0);
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
            }
        }, {
            name: "deathStranding",
            title: $I("achievements.deathStranding.title"),
            description: $I("achievements.deathStranding.desc"),
            condition: function () {
                return this.game.space.getPlanet("furthestRing").reached;
            }
        }, {
            name: "cathammer",
            title: $I("achievements.cathammer.title"),
            description: $I("achievements.cathammer.desc"),
            starDescription: $I("achievements.cathammer.starDesc"),
            condition: function () {
                return this.game.stats.getStat("totalYears").val >= this.game.calendar.darkFutureBeginning;
            },
            starCondition: function () {
                return (this.game.calendar.trueYear() >= this.game.calendar.darkFutureBeginning);
            }
        }, {
            name: "eternalBacchanalia",
            title: $I("achievements.eternalBacchanalia.title"),
            description: $I("achievements.eternalBacchanalia.desc"),
            starDescription: $I("achievements.eternalBacchanalia.starDesc"),
            condition: function() {
                return this.game.calendar.festivalDays >= 100 * this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear;
            },
            //TODO: Add a way to make it reasonable for both mobile & web players to get millions of years of festivals.
            //starCondition: function() {
            //    return this.game.calendar.festivalDays >= 1e6 * this.game.calendar.daysPerSeason * this.game.calendar.seasonsPerYear;
            //}
        }, {
            name: "challenger",
            title: $I("achievements.challenger.title"),
            description: $I("achievements.challenger.desc"),
            starDescription: $I("achievements.challenger.starDesc"),
            condition: function() {
                return this.game.challenges.getCountUniqueCompletions() >= 5;
            },
            starCondition: function() {
                return this.game.challenges.getCountCompletions() >= 100;
            }
        }
    ],

    badges: [
        {   
            name: "lotus",
            title: "Lotus Eater",
            description: "Have more than 50 total resets",
            difficulty: "A",
            condition: function(){
                return this.game.stats.getStat("totalResets").val >= 50;
            }
        },
        {   
            name: "ivoryTower",
            title: "Ivory Tower",
            description: "Have a reset in a IW atheism",
            difficulty: "S+"
        },
        {   
            name: "useless",
            title: "Effective Management",
            description: "Have a useless leader",
            difficulty: "F",
            condition: function(){
                var leader = this.game.village.leader;
                return leader != null && leader.trait.name == "none";
            }
        },
        { 
            name: "beta",
            title: "Beta Decay",
            description: "Participate in a beta test",
            difficulty: "B",
            condition: function(){
                if (window && window.location && window.location.href){
                    return window.location.href.indexOf("beta") >= 0;
                }
                return false;
            }
        },{
            name: "silentHill",
            title: "Silent Hills",
            description: "Have not MOTD content",
            difficulty: "S",
            condition: function(){
                return (this.game.server.motdContent == "");
            }
        },{
            name: "evergreen",
            title: "Wood badge",
            description: "Craft a wood I think?",
            difficulty: "F"
        },{
            name: "deadSpace",
            title: "Dead Space",
            description: "Have kittens wander in the void",
            difficulty: "S",
            condition: function(){
                var kittens = this.game.resPool.get("kittens");
                return (kittens.value >= 1000 && kittens.maxValue == 0);
            }
        },{
            name: "reginaNoctis",
            title: "Regina Noctis",
            description: "Have 500 kittens and no alicorns",
            difficulty: "S",
            condition: function(){
                return (this.game.resPool.get("kittens").value >= 500 && this.game.resPool.get("alicorn").value == 0);
            }
        },{
            name: "ghostInTheMachine",
            title: "Experience a game bug (TBD see newrelic#errorHandle)",
            description: "♋︎⬧︎⧫︎♏︎❒︎🕯︎⬧︎ ●︎♋︎■︎♑︎◆︎♋︎♑︎♏︎ 🖳︎✆",
            difficulty: "S"
        },{
            name: "abOwo",
            title: "Ab Owo",
            description: "Reset in atheism on day 0",
            difficulty: "A"
        },{
            name: "cleanPaws",
            title: "Clean Paws",
            description: "Peaceful trading without cat-power",
            difficulty: "C"
        },{
            name: "sequenceBreak",
            title: "Sequence Break",
            description: "Skip Moon in the space tab",
            difficulty: "D",
            condition: function(){
                return (!this.game.space.getPlanet("moon").reached && this.game.space.getPlanet("dune").reached);
            }
        },{
            name: "fantasticFurColor",
            title: "Fantastic Fur Color",
            description: "When a kitten has a colored name, that just means the kitten has a rare fur color; there is no special gameplay effect for having a rare fur color.",
            difficulty: "F",
            condition: function() {
                var leader = this.game.village.leader;
                return leader != null && leader.color != 0;
            }
        },{
            name: "whatYearIsIt",
            title: "What Year is it Again?",
            description: "Forcefully resolve a Temporal Paradox. May have unknown side effects.",
            difficulty: "C"
        },{
            name: "tardis",
            title: "Time Advancing Relative Dimensions In Space",
            description: "Prioritize time travel over space travel.",
            difficulty: "C"
        },{
            name: "wheredThisComeFrom",
            title: "Where'd This Come From?",
            description: "Chronoreset to gain resources.",
            difficulty: "S"
        },{
            name: "lostDates",
            title: "Lost Dates",
            description: "Accumulate 5 years of timeslip.",
            difficulty: "B",
            condition: function() {
                //"flux" measures the amount of time the player has skipped this run
                //Negative timeskip = timeslip
                return this.game.time.flux <= -5;
                //Before you ask, no, you can't use the 1000 Years Challenge to generate timeslip
            }
        },{
            name: "buffet",
            title: "A Whale of a Buffet",
            description: "Reach 1000 Leviathan energy.",
            difficulty: "A",
            condition: function() {
                return this.game.diplomacy.get("leviathans").energy >= 1000;
            }
        },{
            name: "newHome",
            title: "A New Home",
            description: "Have more housing on Yarn than on Cath.",
            difficulty: "D",
            condition: function() {
                var yarnHousing = this.game.space.getBuilding("terraformingStation").totalEffectsCached["maxKittens"];
                var cathHousing = this.game.getEffect("maxKittens") - yarnHousing;
                //cathHousing includes Space Stations & Cryochambers
                return yarnHousing > cathHousing && this.game.village.getOverpopulation() <= 0;
            }
        },{
            name: "betterSafeThanSorry",
            title: "Better Safe Than Sorry",
            description: "Get Carbon Sequestration with no pollution.",
            difficulty: "E"
        }
    ],

    constructor: function (game) {
        this.game = game;
    },

    get: function (name) {
        return this.getMeta(name, this.achievements);
    },

    getBadge: function(name){
        return this.getMeta(name, this.badges);
    },

    unlockBadge: function(name){
        var badge = this.getBadge(name);
        badge.unlocked = true;
        this.game.achievements.badgesUnlocked = true;
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
            if (!ach.unlocked && ach.condition && ach.condition.call(this)) {
                ach.unlocked = true;
                this.game.msg($I("achievements.msg.unlock", [ach.title]));
                this.game.achievementTab.visible = true;

            }
            if (!ach.starUnlocked && ach.starCondition && ach.starCondition.call(this)) {
                ach.starUnlocked = true;
                this.game.msg($I("achievements.msg.starUnlock", [ach.title]));
                this.game.achievementTab.visible = true;

            }
        }

        for (var i in this.badges) {
            var badge = this.badges[i];
            if (!badge.unlocked && badge.condition && badge.condition.call(this)) {
                badge.unlocked = true;
                this.badgesUnlocked = true;
            }
        }

        //Mess with the player a little bit.
        if (this.game.rand(100) < 10) {
            //10% chance of 5 hourglass symbols
            this.getBadge("lostDates").title = "\u231b".repeat(5);
        } else {
            //90% chance to be normal
            this.getBadge("lostDates").title = "Lost Dates";
        }
    },

	resetState: function(){
		for (var i = 0; i < this.achievements.length; i++){
			var ach = this.achievements[i];
			ach.unlocked = false;
			ach.starUnlocked = false;
		}

        this.badgesUnlocked = false;
        for (var i = 0; i < this.badges.length; i++){
            var badge = this.badges[i];
            badge.unlocked = false;
        }
	},

    save: function (saveData) {
        saveData.achievements = this.filterMetadata(this.achievements, ["name", "unlocked", "starUnlocked"]);
        saveData.ach = {
            badgesUnlocked : this.badgesUnlocked,
            badges: this.filterMetadata(this.badges, ["name", "unlocked"])
        };
    },

    load: function (saveData) {
		this.loadMetadata(this.achievements, saveData.achievements);

        var ach = saveData.ach || {};
        this.badgesUnlocked = ach.badgesUnlocked || false;
        if (ach.badges){
            this.loadMetadata(this.badges, ach.badges);
        }
    },

    unlockAll: function(){
        for (var i in this.achievements){
            this.achievements[i].unlocked = true;
        }
        this.game.msg("All achievements are unlocked");
    }
});

dojo.declare("classes.ui.AchievementsPanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,
	refreshNextTick: false, //Used internally to update the list

	constructor: function(){
		this.achievementsHeader = null;
		this.achievementsMap = {};
		this.achievementsContainer = null;
	},

    render: function(container){
        var content = this.inherited(arguments);
        
		this.achievementsContainer = dojo.create("div", {}, content);

		this.achievementsContainer.innerHTML = "";
		this.achievementsHeader = dojo.create("div", {className: "achievement-header"}, this.achievementsContainer);
        var totalAchievements = 0;
        var completedAchievements = 0;
        var completedStars = 0;
        var uncompletedStars = 0;
		this.achievementsMap = {}; //Associates each non-hidden achievement in the game with a UI element representing it
		for (var i in this.game.achievements.achievements){
			var ach = this.game.achievements.achievements[i];
            if (!ach.unlocked && ach.hidden){
                continue;
            }

			//Count ethical achievements: total & completed.
			if (!ach.unethical){
				totalAchievements++;
				if (ach.unlocked) {
					completedAchievements++;
				}
			}

			//Create the UI element for this achievement:
			this.achievementsMap[ach.name] = this.renderAchievementItem(ach, this.achievementsContainer);

			if (ach.starCondition == undefined) {
				continue;
			}

			//Count ethical starred achievements: completed & incomplete.
			if (!ach.unethical) {
				if (ach.starUnlocked) {
					completedStars++;
				} else {
					uncompletedStars++;
				}
			}
		}
		this.achievementsHeader.innerHTML = $I("achievements.header", [completedAchievements, totalAchievements]);
		dojo.create("span", {
			className: "star",
			innerHTML: this.generateStarText(completedStars, uncompletedStars)
		}, this.achievementsHeader);
	},

	update: function () {
		var refreshThisTick = this.refreshNextTick;
		this.refreshNextTick = false;
		//Count all the achievements:
		var totalAchievements = 0;
		var completedAchievements = 0;
		var completedStars = 0;
		var uncompletedStars = 0;
		for (var i in this.game.achievements.achievements){
			var ach = this.game.achievements.achievements[i];
			if (!ach.unlocked && ach.hidden){
				if (this.achievementsMap[ach.name]) {
					//Hide locked hidden achievements:
					dojo.destroy(this.achievementsMap[ach.name]);
					this.achievementsMap[ach.name] = undefined;
				}
				continue;
			}
			//From here on out, all achievements are non-hidden.

			if (refreshThisTick) { //Delete all entries & recreate them all
				dojo.destroy(this.achievementsMap[ach.name]);
				this.renderAchievementItem(ach, this.achievementsContainer);
			} else if (this.achievementsMap[ach.name]) { //Update existing entry
				this.updateAchievementItem(ach);
			} else {
				//We aren't refreshing & the entry for this achievement is missing.
				//Next tick, refresh everything.
				this.refreshNextTick = true;
			}
			//Count ethical achievements: total & completed.
			if (!ach.unethical){
				totalAchievements++;
				if (ach.unlocked) {
					completedAchievements++;
				}
			}
			if (ach.starCondition == undefined) {
				continue;
			}
			//Count ethical starred achievements: completed & incomplete.
			if (!ach.unethical) {
				if (ach.starUnlocked) {
					completedStars++;
				} else {
					uncompletedStars++;
				}
			}
		}

		//Update the numbers of completed & starred achievements in the header:
		var desiredHeaderText = $I("achievements.header", [completedAchievements, totalAchievements]);
		if (this.achievementsHeader.firstChild.nodeValue != desiredHeaderText) {
			this.achievementsHeader.firstChild.nodeValue = desiredHeaderText;
		}
		var desiredStarText = this.generateStarText(completedStars, uncompletedStars);
		//The inner HTML has taken the &#; format & rendered it as Unicode; we must do something similar.
		var starTextForCompare = String.fromCharCode.apply(null, desiredStarText.replaceAll("&#", "").split(";").slice(0, -1));
		if(this.achievementsHeader.firstElementChild.innerHTML != starTextForCompare) {
			this.achievementsHeader.firstElementChild.innerHTML = desiredStarText;
		}
	},

	//Creates a string composed of filled stars & unfilled stars:
	generateStarText: function(completedStars, uncompletedStars) {
		return "&#9733;".repeat(completedStars) + "&#9734;".repeat(uncompletedStars);
	},

	/**
	 * Creates a UI element representing a single achievement.
	 * @param ach The achievement object to create a UI element for
	 * @param container A <div> element or similar, inside which we'll place this
	 * @return The <span> element representing the achievement in question
	 */
	renderAchievementItem: function(ach, container) {
		var className = "achievement";
		if (ach.unlocked && ach.unethical) {className += " unethical";}
		if (ach.unlocked) {className += " unlocked";}
		if (ach.starUnlocked) {className += " starUnlocked";}
		var span = dojo.create("span", {
			className: className,
			title: ach.unlocked ? ach.description : "???",
			innerHTML : ach.unlocked ? ach.title : "???"
		}, container);

		this.achievementsMap[ach.name] = span;
		if (ach.starCondition) {
			dojo.create("div", {
				className: "star",
				innerHTML: ach.starUnlocked ? "&#9733;" : "&#9734;",
				title: ach.starUnlocked ? ach.starDescription : "???"
			}, span);
		}

		return span;
	},

	/**
	 * Updates the state of a UI element to match the game-state.
	 * Logs an error if no corresponding UI element has been previously rendered.
	 * @param ach The achievement object to update a UI element for
	 */
	updateAchievementItem: function(ach) {
		var span = this.achievementsMap[ach.name];
		if (!span) {
			console.error("Called updateAchievementItem when no corresponding UI element exists.");
			return;
		}

		//For each property of the span, check if it's what we want it to be, then change if necessaary:
		var desiredClassName = "achievement";
		if (ach.unlocked && ach.unethical) {desiredClassName += " unethical";}
		if (ach.unlocked) {desiredClassName += " unlocked";}
		if (ach.starUnlocked) {desiredClassName += " starUnlocked";}
		if (span.className != desiredClassName) {
			span.className = desiredClassName;
		}
		var desiredTitle = ach.unlocked ? ach.description : "???";
		if (span.title != desiredTitle) {
			span.title = desiredTitle;
		}
		var desiredContent = ach.unlocked ? ach.title : "???";
		if (span.firstChild.nodeValue != desiredContent) {
			span.firstChild.nodeValue = desiredContent;
		}

		//For each property of the star, check if it's what we want it to be, then change if necessaary:
		if (ach.starCondition) {
			var star = span.firstElementChild;
			var desiredInnerHTML = ach.starUnlocked ? "&#9733;" : "&#9734;";
			var desiredInnerHTMLForCompare = String.fromCharCode(ach.starUnlocked ? 9733 : 9734);
			if (star.innerHTML != desiredInnerHTMLForCompare) {
				star.innerHTML = desiredInnerHTML;
			}
			desiredTitle = ach.starUnlocked ? ach.starDescription : "???";
			if (star.title != desiredTitle) {
				star.title = desiredTitle;
			}
		}
	}
});

dojo.declare("classes.ui.BadgesPanel", com.nuclearunicorn.game.ui.Panel, {

	game: null,

	constructor: function(){
		this.badgesHeader = null;
		this.badgesMap = {};
	},

    render: function(container){
        var content = this.inherited(arguments);
        
		var div = dojo.create("div", {className: "badges-container"}, content);
		div.innerHTML = "";
		this.badgesHeader = dojo.create("div", {className: "achievement-header"}, div);
        var totalBadges = 0;
        var completedBadges = 0;
		this.badgesMap = {}; //Associates each badge in the game with a UI element representing it
		for (var i in this.game.achievements.badges){
			var badge = this.game.achievements.badges[i];
            totalBadges++;
            if (badge.unlocked) { completedBadges++; }

			this.badgesMap[badge.name] = dojo.create("span", {
				className: this.generateBadgeCSSClass(badge),
				title: badge.unlocked ? badge.description : "???",
				innerHTML : badge.unlocked ? badge.title : "???"
			}, div);
		}
		this.badgesHeader.innerHTML = $I("badges.header", [completedBadges, totalBadges]);
	},

	update: function () {
		var totalBadges = 0;
		var completedBadges = 0;
		for (var i in this.game.achievements.badges){
			var badge = this.game.achievements.badges[i];
			var span = this.badgesMap[badge.name];
			//Recount every tick
			totalBadges++;
			if (badge.unlocked) { completedBadges++; }

			//For each property of the HTML element, compare it against the expected value.
			// Update only if we need to make a change.
			var desiredClassName = this.generateBadgeCSSClass(badge);
			if (span.className != desiredClassName) {
				span.className = desiredClassName;
			}
			var desiredTitle = badge.unlocked ? badge.description : "???";
			if (span.title != desiredTitle) {
				span.title = desiredTitle;
			}
			var desiredInnerHTML = badge.unlocked ? badge.title : "???";
			if (span.innerHTML != desiredInnerHTML) {
				span.innerHTML = desiredInnerHTML;
			}
		}

		var desiredHeaderText = $I("badges.header", [completedBadges, totalBadges]);
		if (this.badgesHeader.innerHTML != desiredHeaderText) {
			this.badgesHeader.innerHTML = desiredHeaderText;
		}
	},

	//Returns a string with the proper CSS class for the UI element representing a particular badge.
	generateBadgeCSSClass: function(badge) {
		var retVal = "achievement badge";
		if (badge.unlocked) {
			retVal += " unlocked";

			//Style Fantastic Fur Color after the leader's fur color.
			if (badge.name == "fantasticFurColor") {
				var kitten = this.game.village.leader;
				if (kitten) {
					var fracturedPacts = this.game.religion.getPact("fractured").val && this.game.getFeatureFlag("MAUSOLEUM_PACTS");
					var colorToUse = fracturedPacts ? kitten.fakeColor : kitten.color;
					var varietyToUse = fracturedPacts ? kitten.fakeVariety : kitten.variety;
					var colorStr = (colorToUse && kitten.colors[colorToUse + 1]) ? kitten.colors[colorToUse + 1].color : "none";
					var varietyStr = (varietyToUse && kitten.varieties[varietyToUse + 1]) ? kitten.varieties[varietyToUse + 1].style : "none";

					//Only format if we have a colored kitten.
					if (colorStr != "none" || varietyStr != "none") {
						retVal += " name color-" + colorStr + " variety-" + varietyStr;
					}
				}
			}
		}
		return retVal;
	}
});

dojo.declare("com.nuclearunicorn.game.ui.tab.AchTab", com.nuclearunicorn.game.ui.tab, {

    constructor: function(){
    },

	render: function(container){

        this.achievementsPanel = new classes.ui.AchievementsPanel($I("achievements.panel.label"), this.game.achievements);
		this.achievementsPanel.game = this.game;
        this.achievementsPanel.render(container);
        
        //basges typo intentional cause I keep mistyping it
        this.badgesPanel = new classes.ui.BadgesPanel($I("badges.panel.label"), this.game.achievements);
		this.badgesPanel.game = this.game;
		this.badgesPanel.render(container);

        //---------------------------
        //         Blah
        //---------------------------
        this.container = container;

        this.inherited(arguments);
        this.update();
        //--------------------------
	},

    update: function() {
		this.achievementsPanel.update();
		this.badgesPanel.update();
    }
});
