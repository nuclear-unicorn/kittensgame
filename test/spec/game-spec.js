describe("game", function () {
  var game;
  beforeEach(function () {
    game = new com.nuclearunicorn.game.ui.GamePage();
  });

  it("game-self-check", function () {
    expect(game).not.toBe(null);
  });

  it("game-load-reference-save", function () {
    expect(game).not.toBe(null);
  });

  it("game-reset", function () {
    game.resPool.get("kittens").value = 80;
    game._resetInternal();
    game.updateKarma();

    var paragon = game.resPool.get("paragon"),
      karma = game.resPool.get("karma");

    expect(paragon.value).toBe(10);
    expect(karma.value).toBe(6); //?
  });
});
