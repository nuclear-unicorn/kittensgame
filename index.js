/* global game:writable, gamePage:writable, Promise, System, SystemJS */

window.LCstorage = window.localStorage;

var version = "1493";
var buildRevision = 0;

var loadingProgress = 0,
  progressMax = 0;

var loadingMessages = [
  "mew~mew~",
  "mew~mew~mew~",
  "mew~mew~mew~mew~",
  "mew~mew~mew~mew~mew~",
];

function loadModule(module) {
  loadingProgress++;
  console.log("loading module " + module + "...");
  var progress = (loadingProgress / progressMax) * 100;
  $("#loadingProgressBar").attr("value", progress);

  var i = Math.floor(Math.random() * loadingMessages.length);
  $("#loadingProgressInfo").html(
    loadingMessages[i] + "...&nbsp(" + progress.toFixed() + "%)"
  );

  var fileVersion = version + ".r" + buildRevision;
  return System.import(module + ".js?v=" + fileVersion);
}

function _import(module, def) {
  if (!def) {
    return loadModule(module);
  } else {
    return def
      .then(function () {
        return loadModule(module);
      })
      .catch(function (err) {
        console.error("_import#: unable to load module:", module);
        console.trace(err);
      });
  }
}

function loadTheme(themeId) {
  var fileVersion = version + ".r" + buildRevision;
  $("<link />")
    .attr("rel", "stylesheet")
    .attr("type", "text/css")
    .attr("href", "res/theme_" + themeId + ".css?v=" + fileVersion)
    .appendTo($("head"));
}

dojo.addOnLoad(function () {
  var displayedVersion = version.split("").join(".");
  if (window.location.href.indexOf("alpha") >= 0) {
    displayedVersion += "-&alpha;";
  } else if (window.location.href.indexOf("beta") >= 0) {
    displayedVersion += "-&beta;";
  }

  $("#tooltip").hide();

  SystemJS.config({
    baseURL: "",
  });

  var modules = [
    "js/resources",
    "js/calendar",
    "js/buildings",
    "js/village",
    "js/science",
    "js/workshop",
    "js/diplomacy",
    "js/religion",
    "js/achievements",

    "js/jsx/left.jsx",
    "js/jsx/mid.jsx",
    "js/jsx/toolbar.jsx",
    "js/jsx/chiral.jsx",
    "js/jsx/queue.jsx",

    //required for defining IReactAware, will be relied upon by js/space
    "js/ui",

    "js/space",
    "js/prestige",
    "js/time",
    "js/stats",
    "js/challenges",
    "js/void",
    "js/math",
    "game",

    "js/toolbar",
  ];
  progressMax = modules.length + 3;
  console.log("Loading...");

  //------ preload theme id ---------
  var uiData = window.localStorage["com.nuclearunicorn.kittengame.ui"];
  var uiSettings = uiData && JSON.parse(uiData);
  if (uiSettings) {
    if (uiSettings.theme) {
      $("body").addClass("scheme_" + uiSettings.theme);
      loadTheme(uiSettings.theme);
    }
  }

  var now = new Date().getTime();
  var def = $.getJSON("build.version.json?v=" + now).then(function (json) {
    buildRevision = json.buildRevision;
    console.log("build revision is" + buildRevision);
    $("#versionLink").html(displayedVersion + ".r" + buildRevision);
  });
  def = _import("config", def);
  def.then(function () {
    var schemes = new classes.KGConfig().statics.schemes;
    for (var i = 0; i < schemes.length; ++i) {
      //todo: skip theme if preloaded
      if (!uiSettings || uiSettings.theme != schemes[i]) {
        loadTheme(schemes[i]);
      }
    }
  });

  def = _import("i18n", def);
  def.then(function () {
    console.log("Loading locale system");
    var fileVersion = version + ".r" + buildRevision;
    var langPromise = i18nLang.init(fileVersion);
    langPromise
      .done(function () {
        loadingMessages = [
          $I("ui.loading.msg.0"),
          $I("ui.loading.msg.1"),
          $I("ui.loading.msg.2"),
          $I("ui.loading.msg.3"),
          $I("ui.loading.msg.4"),
          $I("ui.loading.msg.5"),
          $I("ui.loading.msg.6"),
          $I("ui.loading.msg.7"),
          $I("ui.loading.msg.8"),
          $I("ui.loading.msg.9"),
          $I("ui.loading.msg.10"),
          $I("ui.loading.msg.11"),
          $I("ui.loading.msg.12"),
          $I("ui.loading.msg.13"),
          $I("ui.loading.msg.14"),
          $I("ui.loading.msg.15"),
        ];

        def = _import("core", def);
        def
          .then(function () {
            console.log("Loading game modules");
            return Promise.all(modules.map(loadModule));
          })
          .then(initGame);
      })
      .fail(function () {
        console.log("Unable to load locales");
      });
  });
});

function initGame() {
  console.log("About to initialize the game");
  $("#loadingContainer").hide();
  $("#game").show();

  try {
    gamePage = game = new com.nuclearunicorn.game.ui.GamePage();
    gamePage.setUI(new classes.ui.DesktopUI("gameContainerId"));

    gamePage.telemetry.version = version;
    gamePage.telemetry.buildRevision = buildRevision;
    if (window.location.href.indexOf("beta") >= 0) {
      gamePage.telemetry.buildRevision += "-b";
    }

    //--------------------------
    var dropBoxClient = new Dropbox.Dropbox({ clientId: "u6lnczzgm94nwg3" }); //the starting Dropbox object
    game.setDropboxClient(dropBoxClient);

    gamePage.load();
    gamePage.updateKarma();

    gamePage.render();
    gamePage.ui.renderFilters();
    gamePage.ui.onLoad();
    gamePage.start();

    var config = new classes.KGConfig();

    //update eldermass gifts on every game load pass
    //TODO: toggle timer in the background?
    gamePage.checkEldermass();
    //---------------------------------

    var host = window.location.hostname;
    gamePage.isLocalhost =
      window.location.protocol == "file:" ||
      host == "localhost" ||
      host == "127.0.0.1";
    if (gamePage.isLocalhost) {
      $("#devModeButton").show();
    }
  } catch (ex) {
    if (game && game.telemetry) {
      game.telemetry.logEvent("error", ex);
    }
    console.error(ex);
    console.trace();
  }
}

function dev() {
  if (gamePage.isLocalhost) {
    $("#dev_boostCalendar").show();
    $("#devPanelCheats").show();

    gamePage.devMode = true;
    gamePage.render();
  }
}

function dev_boostCalendar() {
  gamePage.calendar.ticksPerDay = 1 / 3;
}

function wipe() {
  gamePage.wipe();
}
