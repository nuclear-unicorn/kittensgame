#!/usr/bin/env node
/*
 * Minimal mock KGNet backend for the "online" menu (cloud saves).
 *
 * The game's classes.game.Server (game.js) points at http://localhost:7780
 * whenever it runs on localhost, so just start this and reload the game.
 *
 * Zero dependencies — Node's built-in http only.
 *
 *   node tools/mock-kgnet/server.js
 *
 * Saves are kept in memory only and are lost when the server stops.
 */

const http = require("http");

const PORT = process.env.PORT || 7780;

// --- in-memory "database" ---------------------------------------------------

/** @type {Array<{guid:string,label:string,archived:boolean,index:object,timestamp:number,size:number,data:string}>} */
const saves = [];

// Saves are returned to the client without the (potentially huge) save blob.
function snapshot() {
	return saves.map(function (s) {
		return {
			guid: s.guid,
			label: s.label,
			archived: s.archived,
			index: s.index,
			timestamp: s.timestamp,
			size: s.size
		};
	});
}

// --- request body parsing ---------------------------------------------------

// jQuery serializes POST data as application/x-www-form-urlencoded using
// bracket notation for nested objects, e.g. metadata[calendar][year]=5.
// Rebuild that into a plain nested object.
function parseFormUrlEncoded(body) {
	const out = {};
	const params = new URLSearchParams(body);
	for (const [rawKey, value] of params) {
		const match = rawKey.match(/^([^\[]+)(.*)$/);
		const head = match[1];
		const rest = match[2]; // e.g. "[calendar][year]"
		const keys = [head];
		const re = /\[([^\]]*)\]/g;
		let m;
		while ((m = re.exec(rest)) !== null) {
			keys.push(m[1]);
		}
		let node = out;
		for (let i = 0; i < keys.length - 1; i++) {
			node[keys[i]] = node[keys[i]] || {};
			node = node[keys[i]];
		}
		node[keys[keys.length - 1]] = value;
	}
	return out;
}

function readBody(req) {
	return new Promise(function (resolve) {
		let chunks = "";
		req.on("data", function (c) { chunks += c; });
		req.on("end", function () { resolve(chunks); });
	});
}

// --- responses --------------------------------------------------------------

function send(req, res, status, payload) {
	const origin = req.headers.origin || "*";
	res.writeHead(status, {
		"Content-Type": "application/json",
		// withCredentials:true forbids a wildcard origin, so reflect it.
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type"
	});
	res.end(payload === undefined ? "" : JSON.stringify(payload));
}

// --- routing ----------------------------------------------------------------

const server = http.createServer(async function (req, res) {
	const url = req.url.split("?")[0];
	const method = req.method;
	console.log(method, url);

	if (method === "OPTIONS") {
		return send(req, res, 204);
	}

	// Active session — any truthy id makes the client treat the user as logged in.
	if (url === "/user/" && method === "GET") {
		return send(req, res, 200, { id: 1, username: "mockkitten" });
	}

	// List cloud saves.
	if (url === "/kgnet/save/" && method === "GET") {
		return send(req, res, 200, snapshot());
	}

	// Upload (create or overwrite) a save.
	if (url === "/kgnet/save/upload/" && method === "POST") {
		const body = parseFormUrlEncoded(await readBody(req));
		const calendar = (body.metadata && body.metadata.calendar) || {};
		const existing = saves.find(function (s) { return s.guid === body.guid; });
		const record = existing || { guid: body.guid, label: "", archived: false };
		record.data = body.saveData || "";
		record.size = Buffer.byteLength(record.data, "utf8");
		record.timestamp = Date.now();
		record.index = {
			calendar: {
				year: Number(calendar.year) || 0,
				day: Number(calendar.day) || 0
			}
		};
		if (!existing) {
			saves.push(record);
		}
		return send(req, res, 200, snapshot());
	}

	// Update save metadata (label / archived).
	if (url === "/kgnet/save/update/" && method === "POST") {
		const body = parseFormUrlEncoded(await readBody(req));
		const record = saves.find(function (s) { return s.guid === body.guid; });
		if (record && body.metadata) {
			if (body.metadata.label !== undefined) {
				record.label = body.metadata.label;
			}
			if (body.metadata.archived !== undefined) {
				record.archived = body.metadata.archived === "true" || body.metadata.archived === true;
			}
		}
		return send(req, res, 200, snapshot());
	}

	// Download a single save's blob.
	const dl = url.match(/^\/kgnet\/save\/([^/]+)\/download\/$/);
	if (dl && method === "GET") {
		const record = saves.find(function (s) { return s.guid === dl[1]; });
		if (!record) {
			return send(req, res, 404, { error: "no such save" });
		}
		return send(req, res, 200, { data: record.data });
	}

	// Chiral command channel — stubbed so the call doesn't error.
	if (url === "/kgnet/chiral/game/command/" && method === "POST") {
		await readBody(req);
		return send(req, res, 200, {});
	}

	return send(req, res, 404, { error: "not found" });
});

server.listen(PORT, function () {
	console.log("mock KGNet backend listening on http://localhost:" + PORT);
	console.log("saves are in-memory only and reset on restart");
});
