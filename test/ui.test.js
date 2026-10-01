/* global

    test,
    expect,
    game
*/

beforeEach(() => {
    global.gamePage = global.game = new com.nuclearunicorn.game.ui.GamePage();
    global.newrelic = {
        addPageAction: jest.fn(),
        addRelease: jest.fn(),
        setCustomAttribute: jest.fn(),
        setErrorHandler: jest.fn()
    };

    game.setUI(new classes.ui.UISystem("gameContainerId"));
    game.resetState();
    game.opts.highlightUnavailable = true;
});

afterEach(() => {
    jest.clearAllMocks();
});

test("Button drops the 'limited' highlight as soon as the storage cap is raised, even while it stays disabled", () => {
    let wood = game.resPool.get("wood");
    wood.value = 0;
    wood.maxValue = 100;

    let btn = new com.nuclearunicorn.game.ui.Button({
        name: "test",
        prices: [{name: "wood", val: 500}],
        controller: new com.nuclearunicorn.game.ui.ButtonController(game)
    }, game);
    btn.domNode = document.createElement("div");
    btn.domNode.className = "btn nosel";

    //price exceeds the storage cap: disabled and limited
    btn.update();
    expect(btn.model.enabled).toBe(false);
    expect(btn.model.resourceIsLimited).toBe(true);
    expect(btn.domNode.classList.contains("disabled")).toBe(true);
    expect(btn.domNode.classList.contains("limited")).toBe(true);

    //cap raised, resources not accumulated yet: still disabled, no longer limited
    wood.maxValue = 1000;
    btn.update();
    expect(btn.model.enabled).toBe(false);
    expect(btn.model.resourceIsLimited).toBe(false);
    expect(btn.domNode.classList.contains("disabled")).toBe(true);
    expect(btn.domNode.classList.contains("limited")).toBe(false);

    //enough resources: fully enabled
    wood.value = 500;
    btn.update();
    expect(btn.model.enabled).toBe(true);
    expect(btn.domNode.classList.contains("disabled")).toBe(false);
    expect(btn.domNode.classList.contains("limited")).toBe(false);

    //cap dropped below the price again (e.g. a barn was sold): limited again
    wood.value = 0;
    wood.maxValue = 100;
    btn.update();
    expect(btn.domNode.classList.contains("disabled")).toBe(true);
    expect(btn.domNode.classList.contains("limited")).toBe(true);
});

test("Bonfire filter groups re-evaluate a building's visibility on every model update", () => {
    let tab = new com.nuclearunicorn.game.ui.tab.BuildingsModern({name: "Bonfire", id: "Bonfire"}, game);
    let controller = new classes.ui.btn.BuildingBtnModernController(game, {
        visibilityFilter: function(model){
            return tab.matchesActiveGroup(model);
        }
    });
    let fetchBarn = () => controller.fetchModel({building: "barn"});

    game.bld.get("barn").unlocked = true;
    let wood = game.resPool.get("wood");
    wood.value = 0;
    wood.maxValue = 1;  //barn costs 50 wood, so it is limited by storage

    //"available" hides storage-limited buildings...
    tab.activeGroup = "available";
    let model = fetchBarn();
    expect(model.resourceIsLimited).toBe(true);
    expect(model.visible).toBe(false);

    //...and shows them again once the cap is raised, without a re-render
    wood.maxValue = 1000;
    model = fetchBarn();
    expect(model.resourceIsLimited).toBe(false);
    expect(model.enabled).toBe(false);
    expect(model.visible).toBe(true);

    //"enabled" hides buildings we can't afford yet and shows them once we can
    tab.activeGroup = "allEnabled";
    expect(fetchBarn().visible).toBe(false);
    wood.value = 1000;
    expect(fetchBarn().visible).toBe(true);

    //"all" and the regular groups never filter
    tab.activeGroup = "all";
    wood.value = 0;
    wood.maxValue = 1;
    expect(fetchBarn().visible).toBe(true);

    //locked buildings stay hidden regardless of the filter
    tab.activeGroup = "available";
    wood.maxValue = 1000;
    game.bld.get("barn").unlocked = false;
    expect(fetchBarn().visible).toBe(false);

    //controllers without a filter (undo, tests) are unaffected
    game.bld.get("barn").unlocked = true;
    wood.maxValue = 1;
    let plainController = new classes.ui.btn.BuildingBtnModernController(game);
    expect(plainController.fetchModel({building: "barn"}).visible).toBe(true);
});

test("Bonfire 'togglable' filter matches on building metadata", () => {
    let tab = new com.nuclearunicorn.game.ui.tab.BuildingsModern({name: "Bonfire", id: "Bonfire"}, game);
    tab.activeGroup = "togglable";

    expect(tab.matchesActiveGroup({metadata: {togglable: true}})).toBe(true);
    expect(tab.matchesActiveGroup({metadata: {}})).toBe(false);
});
