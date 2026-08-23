/*
 * Link-unfurl support for the mock KGNet backend.
 *
 * Discord, Slack, Twitter/X, Telegram, iMessage and friends all unfurl a link the
 * same way: they GET the URL with their own crawler, parse the HTML `<head>` for
 * Open Graph tags, and throw away everything else. None of them run JavaScript, so
 * the game's own `index.html?saveId=...` can never produce a per-save embed - the
 * tags have to be baked into HTML by the server.
 *
 * Hence a second, crawler-facing URL: /preview/<guid>. It serves OG tags built from
 * the save, and bounces real browsers on to the game in read-only preview mode.
 *
 * See docs/save-preview.md for the full contract the production backend has to meet.
 */

const LZString = require("../../lib/lz-string.js");

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

// --- save introspection -----------------------------------------------------

// Mirrors game.decompressLZData: base64 first, utf16 as the fallback.
function decompress(blob) {
	if (!blob) {
		return null;
	}
	if (blob[0] === "{") {
		return blob;
	}
	const asBase64 = LZString.decompressFromBase64(blob);
	if (asBase64 && asBase64[0] === "{") {
		return asBase64;
	}
	return LZString.decompressFromUTF16(blob);
}

function findByName(list, name) {
	if (!Array.isArray(list)) {
		return null;
	}
	return list.find(function (entry) { return entry && entry.name === name; }) || null;
}

function statValue(save, name) {
	const stat = findByName(save.stats, name);
	return stat ? (stat.val || 0) : 0;
}

function resourceValue(save, name) {
	const res = findByName(save.resources, name);
	return res ? (res.value || 0) : 0;
}

/**
 * Everything the embed needs, pulled straight out of the save blob.
 *
 * Production note: doing this per crawler hit means decompressing a multi-megabyte
 * blob on every Discord request. The real backend should compute this once at
 * upload time and store it in the save's `index` column instead.
 */
function summarize(record) {
	const summary = {
		label: record.label || record.guid.slice(-4),
		guid: record.guid,
		timestamp: record.timestamp,
		size: record.size,
		year: 0,
		day: 0,
		season: null,
		kittens: 0,
		paragon: 0,
		karma: 0,
		resets: 0,
		broken: false
	};

	let save = null;
	try {
		save = JSON.parse(decompress(record.data));
	} catch (err) {
		console.warn("preview: unreadable save", record.guid, err.message);
	}
	// a blob that decompresses to "null" or a bare number parses fine and is still garbage
	if (!save || typeof save !== "object") {
		summary.broken = true;
		return summary;
	}

	if (save.calendar) {
		summary.year = save.calendar.year || 0;
		summary.day = Math.floor(save.calendar.day || 0);
		summary.season = save.calendar.season;
	}
	if (save.village && Array.isArray(save.village.kittens)) {
		summary.kittens = save.village.kittens.length;
	}
	summary.paragon = Math.floor(resourceValue(save, "paragon"));
	summary.karma = Math.floor(resourceValue(save, "karma"));
	summary.resets = statValue(save, "totalResets");

	return summary;
}

const SEASONS = ["spring", "summer", "autumn", "winter"];

function seasonName(index) {
	return SEASONS[index] || "";
}

/** One line of prose for og:description and the card subtitle. */
function describe(summary) {
	if (summary.broken) {
		return "This save could not be read.";
	}
	const parts = [
		summary.kittens + (summary.kittens === 1 ? " kitten" : " kittens"),
		"year " + summary.year + ", day " + summary.day
	];
	if (summary.paragon > 0) {
		parts.push(summary.paragon + " paragon");
	}
	if (summary.resets > 0) {
		parts.push(summary.resets + (summary.resets === 1 ? " reset" : " resets"));
	}
	return parts.join(" · ");
}

// --- the card ---------------------------------------------------------------

function escapeXml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function statBlock(x, y, value, caption) {
	return [
		'<text x="' + x + '" y="' + y + '" class="stat">' + escapeXml(value) + "</text>",
		'<text x="' + x + '" y="' + (y + 38) + '" class="caption">' + escapeXml(caption) + "</text>"
	].join("");
}

/**
 * The embed image, as SVG.
 *
 * Discord/Twitter will NOT render an SVG og:image - they want PNG/JPEG/WebP. This is
 * the layout and data contract; rasterizing it is the production backend's job
 * (satori + resvg, sharp, or a headless browser). See docs/save-preview.md.
 */
function renderCardSvg(summary) {
	const season = seasonName(summary.season);
	const subtitle = season
		? "year " + summary.year + ", day " + summary.day + " (" + season + ")"
		: "year " + summary.year + ", day " + summary.day;

	return '<?xml version="1.0" encoding="UTF-8"?>\n'
		+ '<svg xmlns="http://www.w3.org/2000/svg" width="' + CARD_WIDTH + '" height="' + CARD_HEIGHT + '" viewBox="0 0 ' + CARD_WIDTH + " " + CARD_HEIGHT + '">'
		+ "<style>"
		+ ".bg { fill: #1c1c1c; }"
		+ ".rule { stroke: #4a4a4a; stroke-width: 2; }"
		+ "text { font-family: 'Courier New', Courier, monospace; fill: #d5d5d5; }"
		+ ".brand { font-size: 30px; fill: #8a8a8a; letter-spacing: 6px; }"
		+ ".title { font-size: 76px; font-weight: bold; fill: #f2f2f2; }"
		+ ".subtitle { font-size: 38px; fill: #a8a8a8; }"
		+ ".stat { font-size: 60px; font-weight: bold; fill: #f2f2f2; }"
		+ ".caption { font-size: 26px; fill: #8a8a8a; letter-spacing: 3px; }"
		+ ".footer { font-size: 24px; fill: #7a7a7a; }"
		+ "</style>"
		+ '<rect class="bg" width="' + CARD_WIDTH + '" height="' + CARD_HEIGHT + '"/>'
		+ '<text x="80" y="110" class="brand">KITTENS GAME</text>'
		+ '<line class="rule" x1="80" y1="146" x2="' + (CARD_WIDTH - 80) + '" y2="146"/>'
		+ '<text x="80" y="250" class="title">' + escapeXml(summary.label) + "</text>"
		+ '<text x="80" y="310" class="subtitle">' + escapeXml(subtitle) + "</text>"
		+ statBlock(80, 460, summary.kittens, "KITTENS")
		+ statBlock(380, 460, summary.paragon, "PARAGON")
		+ statBlock(680, 460, summary.karma, "KARMA")
		+ statBlock(980, 460, summary.resets, "RESETS")
		+ '<line class="rule" x1="80" y1="530" x2="' + (CARD_WIDTH - 80) + '" y2="530"/>'
		+ '<text x="80" y="578" class="footer">readonly mode</text>'
		+ "</svg>";
}

// --- the crawler-facing page ------------------------------------------------

function escapeHtml(text) {
	return escapeXml(text);
}

/**
 * @param {object} summary
 * @param {string} shareId - the save's share token (guids are not unique server-wide)
 * @param {string} baseUrl - public origin of THIS server, e.g. https://kittensgame.com
 * @param {string} gameUrl - where a human should land, e.g. https://kittensgame.com/
 */
function renderPreviewPage(summary, shareId, baseUrl, gameUrl) {
	const title = summary.label + " — Kittens Game";
	const description = describe(summary);
	const pageUrl = baseUrl + "/preview/" + shareId;
	// cache-bust per save version so Discord's embed cache follows re-uploads
	const imageUrl = pageUrl + "/card.svg?v=" + summary.timestamp;
	const playUrl = gameUrl + "?saveId=" + encodeURIComponent(shareId);

	return "<!doctype html>\n"
		+ '<html lang="en">\n'
		+ "<head>\n"
		+ '<meta charset="utf-8">\n'
		+ "<title>" + escapeHtml(title) + "</title>\n"
		+ '<link rel="canonical" href="' + escapeHtml(pageUrl) + '">\n'
		+ '<meta name="description" content="' + escapeHtml(description) + '">\n'
		+ "\n"
		+ "<!-- Open Graph: Discord, Slack, Telegram, iMessage, Facebook -->\n"
		+ '<meta property="og:type" content="website">\n'
		+ '<meta property="og:site_name" content="Kittens Game">\n'
		+ '<meta property="og:title" content="' + escapeHtml(title) + '">\n'
		+ '<meta property="og:description" content="' + escapeHtml(description) + '">\n'
		+ '<meta property="og:url" content="' + escapeHtml(pageUrl) + '">\n'
		+ '<meta property="og:image" content="' + escapeHtml(imageUrl) + '">\n'
		+ '<meta property="og:image:width" content="' + CARD_WIDTH + '">\n'
		+ '<meta property="og:image:height" content="' + CARD_HEIGHT + '">\n'
		+ '<meta property="og:image:alt" content="' + escapeHtml(description) + '">\n'
		+ "\n"
		+ "<!-- Twitter/X wants its own namespace; Discord reads theme-color for the accent stripe -->\n"
		+ '<meta name="twitter:card" content="summary_large_image">\n'
		+ '<meta name="twitter:title" content="' + escapeHtml(title) + '">\n'
		+ '<meta name="twitter:description" content="' + escapeHtml(description) + '">\n'
		+ '<meta name="twitter:image" content="' + escapeHtml(imageUrl) + '">\n'
		+ '<meta name="theme-color" content="#1c1c1c">\n'
		+ "\n"
		+ "<!-- humans go play; crawlers never get here because they do not run JS -->\n"
		+ '<meta http-equiv="refresh" content="0; url=' + escapeHtml(playUrl) + '">\n'
		+ "</head>\n"
		+ "<body>\n"
		+ "<p>" + escapeHtml(title) + " — " + escapeHtml(description) + "</p>\n"
		+ '<p><a href="' + escapeHtml(playUrl) + '">Open the read-only preview</a></p>\n'
		+ "</body>\n"
		+ "</html>\n";
}

module.exports = {
	CARD_WIDTH: CARD_WIDTH,
	CARD_HEIGHT: CARD_HEIGHT,
	summarize: summarize,
	describe: describe,
	renderCardSvg: renderCardSvg,
	renderPreviewPage: renderPreviewPage
};
