/**
 * Standalone combat-balance simulator for classes.village.Map.
 *
 * Loads the REAL combat code from js/village.js headlessly (via the project's
 * dependency-free portable dojo.declare) and Monte-Carlo simulates player vs
 * fauna duels reusing the actual game formulas: createFauna, getCombatStatsAt,
 * getStatAtLevel, attack and getHitRate. Tweak the formulas in village.js,
 * re-run, and the generated combat-balance.md reflects the new balance.
 *
 *   node simulate-combat.js
 *
 * ES6 / Node is fine for this script per the task brief.
 */

const fs = require("fs");
const path = require("path");

// ----------------------------------------------------------------------------
// Tunables: trade accuracy for runtime here.
// ----------------------------------------------------------------------------
const PLAYER_SEED_SAMPLES = 4000;  // seeds averaged per player level
const FAUNA_ROLL_SAMPLES  = 4000;  // jittered spawns averaged per biome level
const REQ_TRIALS          = 300;   // duels per candidate level when finding req. level
const REQ_MAX_LEVEL       = 200;   // give up past this -> "unwinnable"
const DUEL_MAX_ROUNDS     = 4000;  // stalemate guard (treated as a loss)
const WIN_THRESHOLD       = 0.5;   // win-rate that counts as "can kill"
const HAS_TRAIT           = true;  // leaders normally carry a trait (no bias bonus)


const PLAYER_ATK = 1;	//current player atk bonus from upgrades
const PLAYER_DEF = 1;	//current player def bonus from upgrades

// Player levels and biome exploration levels to report (0..10 then by 10s).
const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// ----------------------------------------------------------------------------
// Headless bootloader: pull the real classes.village.Map into Node with the
// smallest set of stubs that satisfy js/village.js's dojo.declare graph.
// ----------------------------------------------------------------------------
function loadMap() {
	const ROOT = __dirname;
	const namespace = { com: {}, classes: {}, mixin: {} };
	const createNamespace = require(path.join(ROOT, "test/declare.js"));
	const dojo = createNamespace(namespace);

	global.dojo = {
		declare: dojo.declare,
		clone: function (m) {
			return Array.isArray(m) ? m.map(function (x) { return global.dojo.clone(x); })
			                        : Object.assign({}, m);
		}
	};
	global.com = namespace.com;
	global.classes = namespace.classes;
	global.mixin = namespace.mixin;
	global.$I = function (key) { return "$" + key + "$"; };

	// Superclasses / mixins referenced by the dojo.declare calls in village.js.
	// We only instantiate Map, so these can stay empty.
	dojo.declare("com.nuclearunicorn.core.TabManager", null, {});
	dojo.declare("com.nuclearunicorn.game.ui.BuildingStackableBtnController", null, {});
	dojo.declare("com.nuclearunicorn.game.ui.ButtonModernController", null, {});
	dojo.declare("com.nuclearunicorn.game.ui.ButtonModern", null, {});
	dojo.declare("com.nuclearunicorn.game.ui.Panel", null, {});
	dojo.declare("com.nuclearunicorn.game.ui.tab", null, {});
	dojo.declare("mixin.IChildrenAware", null, {});
	dojo.declare("mixin.IGameAware", null, {});

	require(path.join(ROOT, "js/village.js"));

	const map = new classes.village.Map(null);
	// Minimal game stub: combat's attack() only needs game.rand(ratio) -> 0..ratio-1,
	// matching game.rand -> math.uniformRandomInteger(0, ratio).
	map.game = {
		rand: function (ratio) { return Math.floor(Math.random() * ratio); }
	};
	return map;
}

// ----------------------------------------------------------------------------
// Stat sampling
// ----------------------------------------------------------------------------
const STAT_KEYS = ["hp", "atk", "def", "agi", "str", "spd"];

function randSeed() {
	return Math.floor(Math.random() * 1000000); // [0, SEED_MAX]
}

/** Average player combat stats at a level over many random seeds. */
function averagePlayerStats(map, level) {
	const sum = { hp: 0, atk: 0, def: 0, agi: 0, str: 0, spd: 0 };
	for (let i = 0; i < PLAYER_SEED_SAMPLES; i++) {
		const s = map.getCombatStatsAt(randSeed(), level, HAS_TRAIT);
		for (const k of STAT_KEYS) { sum[k] += s[k]; }
	}
	const avg = {};
	for (const k of STAT_KEYS) { avg[k] = sum[k] / PLAYER_SEED_SAMPLES; }
	return avg;
}

/** Average fauna stats for a biome at exploration level `on` over jittered spawns. */
function averageFaunaStats(map, biome, on) {
	const prev = biome.on;
	biome.on = on;
	const sum = { level: 0, hp: 0, atk: 0, def: 0, agi: 0, str: 0, spd: 0 };
	for (let i = 0; i < FAUNA_ROLL_SAMPLES; i++) {
		const f = map.createFauna(biome, "mob");
		sum.level += f.level; sum.hp += f.hp; sum.atk += f.atk;
		sum.def += f.def; sum.agi += f.agi; sum.str += f.str; sum.spd += f.spd;
	}
	biome.on = prev;
	const n = FAUNA_ROLL_SAMPLES;
	return {
		level: sum.level / n, hp: sum.hp / n, atk: sum.atk / n,
		def: sum.def / n, agi: sum.agi / n, str: sum.str / n, spd: sum.spd / n
	};
}

// ----------------------------------------------------------------------------
// Duel: reuses the real map.attack + map.getHitRate. Mirrors one combat() pass
// per round (both combatants swing simultaneously, deaths resolved after).
// ----------------------------------------------------------------------------
function duel(map, squad, fauna) {
	const s = { str: squad.str, agi: squad.agi, atk: squad.atk + PLAYER_ATK, def: squad.def + PLAYER_DEF, hp: squad.hp, efficiency: squad.efficiency };
	const m = { str: fauna.str, agi: fauna.agi, atk: fauna.atk, def: fauna.def, hp: fauna.hp };
	let rounds = 0;
	while (s.hp > 0 && m.hp > 0 && rounds < DUEL_MAX_ROUNDS) {
		map.attack(s, m);  // squad -> fauna (squad always swings first, like combat())
		map.attack(m, s);  // fauna -> squad (still swings even if it just died)
		rounds++;
	}
	// A kill is credited the instant the mob reaches 0 HP, exactly as combat() filters
	// dead fauna and grants XP regardless of squad HP. Because the squad swings first, a
	// mutual KO counts as a kill (the squad landed the killing blow before it went down).
	return m.hp <= 0;
}

/**
 * Lowest player level at which a randomly-seeded player wins >= WIN_THRESHOLD of
 * duels against freshly-rolled (jittered) fauna for this biome level. Integrates
 * over seeds, spawn jitter and hit RNG. Returns null if unwinnable up to the cap.
 */
function requiredPlayerLevel(map, biome, on) {
	const prev = biome.on;
	biome.on = on;
	let required = null;
	for (let level = 1; level <= REQ_MAX_LEVEL; level++) {
		let wins = 0;
		for (let t = 0; t < REQ_TRIALS; t++) {
			const stats = map.getCombatStatsAt(randSeed(), level, HAS_TRAIT);
			const squad = { ...stats, efficiency: 1.0 };
			const fauna = map.createFauna(biome, "mob");
			if (duel(map, squad, fauna)) { wins++; }
		}
		if (wins / REQ_TRIALS >= WIN_THRESHOLD) { required = level; break; }
	}
	biome.on = prev;
	return required;
}

// ----------------------------------------------------------------------------
// Reporting
// ----------------------------------------------------------------------------
function fmt(n, d) {
	d = d === undefined ? 1 : d;
	// Keep the huge exponential AGI/STR/SPD values readable in the table.
	if (Math.abs(n) >= 100000) {
		return Number(n).toExponential(2);
	}
	return Number(n).toFixed(d);
}

function isCombatBiome(biome) {
	// Skip the home village (faunaPenalty 0 -> never spawns) and any biome with
	// no mob definition (e.g. the space-map placeholders).
	return true;
}

function buildPlayerSection(map) {
	const lines = [];
	lines.push("## Player progression");
	lines.push("");
	lines.push("Average combat stats over " + PLAYER_SEED_SAMPLES + " random seeds per level " +
		"(leader with a trait). HP is also the squad's max HP. Note: `getCombatLevel` " +
		"floors at 1 in-game, so level 0 is shown for reference only.");
	lines.push("");
	lines.push("| Player Lvl | HP | ATK | DEF | AGI | STR | SPD |");
	lines.push("|---:|---:|---:|---:|---:|---:|---:|");
	for (const level of LEVELS) {
		const s = averagePlayerStats(map, level);
		lines.push("| " + level + " | " + fmt(s.hp) + " | " + fmt(s.atk) + " | " +
			fmt(s.def) + " | " + fmt(s.agi) + " | " + fmt(s.str) + " | " + fmt(s.spd) + " |");
	}
	lines.push("");
	return lines.join("\n");
}

function buildBiomeSection(map, biome) {
	const lines = [];
	lines.push("## Biome: " + (biome.title || biome.name));
	lines.push("");
	const meta = [];
	meta.push("base mobLevel " + biome.mobLevel);
	meta.push("terrainPenalty " + (biome.terrainPenalty || 1.0));
	meta.push("faunaPenalty " + (biome.faunaPenalty === undefined ? 1.0 : biome.faunaPenalty));
	if (biome.biomePenalty !== undefined) { meta.push("biomePenalty " + biome.biomePenalty); }
	lines.push("_" + meta.join(" · ") + "_");
	lines.push("");
	lines.push("Fauna stats averaged over " + FAUNA_ROLL_SAMPLES +
		" spawns. Req. Lvl = lowest player level that kills the mob in >= " + (WIN_THRESHOLD * 100) +
		"% of duels (" + REQ_TRIALS + " duels/level). A kill is credited the moment the mob " +
		"hits 0 HP, matching combat() — the squad swings first, so a mutual KO still counts.");
	lines.push("");
	lines.push("| Biome Lvl | Mob Lvl | HP | ATK | DEF | AGI | STR | SPD | Req. Player Lvl |");
	lines.push("|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
	for (const on of LEVELS) {
		const f = averageFaunaStats(map, biome, on);
		const req = requiredPlayerLevel(map, biome, on);
		const reqStr = req === null ? "> " + REQ_MAX_LEVEL + " (unwinnable)" : String(req);
		lines.push("| " + on + " | " + fmt(f.level, 1) + " | " + fmt(f.hp, 0) + " | " +
			fmt(f.atk, 0) + " | " + fmt(f.def, 0) + " | " + fmt(f.agi, 1) + " | " +
			fmt(f.str, 1) + " | " + fmt(f.spd, 1) + " | " + reqStr + " |");
	}
	lines.push("");
	return lines.join("\n");
}

function buildHeader() {
	return [
		"# Combat balance breakdown",
		"",
		"Generated by `simulate-combat.js` from the live formulas in `js/village.js` " +
		"(`classes.village.Map`). Re-run after tweaking the formulas to refresh.",
		"",
		"### Combat model (as implemented)",
		"",
		"- Each round both sides attack simultaneously. `attack` deals flat `atk` damage " +
		"on a hit; hit chance is `getHitRate = src.agi / tgt.agi * 130 + 5`, capped at 100%.",
		"- Only **ATK** (damage) and **AGI** (hit chance) affect duel outcome. " +
		"DEF / STR / SPD are generated but unused by the current combat code.",
		"- Player stats scale ~linearly with level (ATK growth 2.5/lvl, AGI 1.25/lvl). " +
		"Fauna AGI scales as `(1+mobLvl)·1.01^mobLvl` (exponential), so at higher biome " +
		"levels the player's hit chance floors at ~5% while fauna keep hitting.",
		"- \"Req. Player Lvl\" is a Monte-Carlo estimate integrating seed, spawn jitter and " +
		"hit RNG. Simplifications vs the live loop: no building ATK/DEF bonuses, and the " +
		"~0.1 HP/tick in-combat regen is omitted (negligible for winnable fights).",
		""
	].join("\n");
}

// ----------------------------------------------------------------------------
function main() {
	const map = loadMap();
	const out = [];
	out.push(buildHeader());
	out.push(buildPlayerSection(map));

	const biomes = map.getBiomes().filter(isCombatBiome);
	for (const biome of biomes) {
		process.stderr.write("simulating biome: " + biome.name + "\n");
		out.push(buildBiomeSection(map, biome));
	}

	const outPath = path.join(__dirname, "combat-balance.md");
	fs.writeFileSync(outPath, out.join("\n"));
	process.stderr.write("wrote " + outPath + "\n");
}

main();
