/**
 * Loose declarations for KG's shared globals, so checked files don't error on
 * names defined elsewhere. Everything starts as `any` and can be tightened
 * later; classes captured in `var X = dojo.declare(...)` need no entry here —
 * plain-script globals are visible across files automatically.
 */

/** i18n */
declare function $I(key: string, args?: any[]): string;

/** jQuery (vendored) */
declare var $: any;
declare var jQuery: any;

/** localStorage wrapper (may be a stub object on old IE) */
declare var LCstorage: { [key: string]: any };

/** Legacy namespace trees populated by dojo.declare("com...."/"classes....") */
declare var com: any;
declare var classes: any;
declare var mixin: any;

/** game entry points / misc globals referenced across files */
declare var game: any;
declare var gamePage: any;
declare var $r: any;
declare var React: any;
declare var unsafeWindow: any;
