// @ts-check
/**
 * Read-only save preview.
 *
 * Entered by opening the game with `?saveId=<kgnet guid>`.
 * 
 */

var Preview = dojo.declare("classes.game.Preview", null, {

	/** @type {GamePage} */
	game: null,

	/** @type {string} the kgnet guid we are previewing, null outside preview mode */
	saveId: null,

	/** Cloud metadata for the save, when the backend bothers to send it. */
	meta: null,

	/** @type {HTMLElement} */
	bannerNode: null,

	/** @param {GamePage} game */
	constructor: function(game){
		this.game = game;
	},

	/**
	 * Boot the game from a KGNet save instead of localStorage.
	 * @param {string} saveId
	 */
	boot: function(saveId){
		var self = this;

		this.saveId = saveId;
		this.game.previewMode = true;

		this._setLoadingMessage($I("preview.loading"));

		this.game.server.downloadSave(saveId)
			.done(function(resp){
				if (!resp || !resp.data){
					self._fail($I("preview.error.empty"));
					return;
				}
				self.meta = resp.metadata || null;
				self._apply(resp.data);
			})
			.fail(function(xhr){
				self._fail(xhr && xhr.status == 404
					? $I("preview.error.notFound")
					: $I("preview.error.network"));
			});
	},

	/**
	 * Hand the downloaded blob to the regular load path. Storage is a detached
	 * in-memory shim by this point, so this write goes nowhere near the real save.
	 * @param {string} blob - compressed or raw save data, exactly as save() writes it
	 */
	_apply: function(blob){
		var game = this.game;

		LCstorage["com.nuclearunicorn.kittengame.savedata"] = blob;

		if (!game.load()){
			return;
		}

		//this should normally go to game.ui, but no other UI will use browser URL for preview
		$("#loadingContainer").hide();
		$("#game").show();
		dojo.addClass(document.body, "preview-mode");
		this._lockChrome();

		game.updateKarma();
		game.render();
		game.ui.renderFilters();
		game.ui.onLoad();
		game.start();	//refuses to start the loop in read-only mode, still refreshes tab markers

		this.renderBanner();
		game.msg($I("preview.msg.readonly"), "important");
	},

	/**
	 * Strip the top bar links that would mutate a save.
	 */
	_lockChrome: function(){
		var ids = ["save-link", "reset-link", "wipe-link", "devModeButton", "options-link"];

		for (var i = 0; i < ids.length; i++){
			var node = dojo.byId(ids[i]);
			if (!node || !node.parentNode){
				continue;
			}
			var separator = node.nextSibling;
			if (separator && separator.nodeType == 3 && separator.nodeValue.indexOf("|") >= 0){
				separator.parentNode.removeChild(separator);
			}
			node.parentNode.removeChild(node);
		}
	},

	/** @param {string} reason */
	_fail: function(reason){
		console.error("preview: unable to load save", this.saveId, reason);
		$("#loadingProgressBar").hide();
	},

	/** @param {string} html */
	_setLoadingMessage: function(html){
		$("#loadingContainer").show();
		$("#loadingProgressInfo").html(html);
	},

	/**
	 * "You are looking at readonly preview" banner
	 */
	renderBanner: function(){
		var node = dojo.byId("previewBanner");

		if (!node){
			return;
		}
		this.bannerNode = node;
		dojo.empty(node);

		dojo.create("span", {
			className: "preview-badge",
			innerHTML: $I("preview.banner.badge")
		}, node);

		dojo.create("span", {
			className: "preview-title",
			innerHTML: this._saveTitle()
		}, node);

		dojo.create("a", {
			className: "preview-exit",
			href: "./",
			innerHTML: $I("preview.banner.exit")
		}, node);

		dojo.style(node, "display", "flex");
	},

	/** @returns {string} the cloud label, falling back to a short guid */
	_saveTitle: function(){
		if (this.meta && this.meta.label){
			return this.meta.label;
		}
		return this.saveId ? this.saveId.substring(this.saveId.length - 4) : "";
	}
});

//----------------------------------------------------------------------------
// Statics. index.html needs these before a GamePage (and therefore game.preview)
// exists, so they hang off the constructor rather than the prototype.
//----------------------------------------------------------------------------

/** Cloud save ids are guids; anything else is not going into an XHR path. */
var PREVIEW_SAVE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * @returns {string} the `?saveId=` value, or null when this is a normal game session
 */
function previewGetSaveId(){
	var match = /[?&]saveId=([^&#]*)/.exec(window.location.search);
	if (!match){
		return null;
	}
	var saveId = decodeURIComponent(match[1]);
	if (!PREVIEW_SAVE_ID_PATTERN.test(saveId)){
		console.error("preview: skipping invalid saveId", saveId);
		return null;
	}
	return saveId;
}

/**
 * Point LCstorage at a detached in-memory object.
 */
function previewDetachStorage(){
	var shim = {},
		carryOver = [
			"com.nuclearunicorn.kittengame.ui",
			"com.nuclearunicorn.kittengame.language"
		];

	for (var i = 0; i < carryOver.length; i++){
		var value = null;
		try {
			value = window.localStorage && window.localStorage[carryOver[i]];
		} catch (ex) {
			//private mode / storage disabled - nothing to carry over
		}
		if (value != null){
			shim[carryOver[i]] = value;
		}
	}

	//the Storage API surface, kept non-enumerable so `for (key in LCstorage)` still sees only keys
	var api = {
		getItem: function(key){ return this[key] === undefined ? null : this[key]; },
		setItem: function(key, value){ this[key] = String(value); },
		removeItem: function(key){ delete this[key]; },
		clear: function(){
			for (var key in this){
				if (Object.prototype.hasOwnProperty.call(this, key)){
					delete this[key];
				}
			}
		}
	};
	for (var name in api){
		Object.defineProperty(shim, name, { value: api[name], enumerable: false, writable: true });
	}

	window.LCstorage = shim;
	console.log("preview: localStorage detached, the local save is safe");
}

dojo.mixin(Preview, {
	SAVE_ID_PATTERN: PREVIEW_SAVE_ID_PATTERN,
	getSaveId: previewGetSaveId,
	detachStorage: previewDetachStorage
});
