/* global 

    test,
    expect,
    game,
    LCstorage
*/


beforeEach(() => {
    global.gamePage = global.game = new com.nuclearunicorn.game.ui.GamePage();
    //TODO: use special UI system specifically for unit tests
    game.setUI(new classes.ui.UISystem("gameContainerId"));
});

test("basic sanity check, game must load hoglasave without crashing", () => {
    var hoglasave = require("./res/save.js");
    LCstorage["com.nuclearunicorn.kittengame.savedata"] = hoglasave;

    game.load();
});


//--------------------------------
//      Basic faith stuff
//--------------------------------
test("Faith praising should correctly discard faith resoruce and update religion.faith", () => {
    game.resPool.get("faith").value = 1000;
    game.religion.praise();

    expect(game.resPool.get("faith").value).toBe( 0.0001);
    expect(game.religion.faith).toBe(1000);
});