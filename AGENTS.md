Guidelines for LLM agents working on this repo:

# PR

* Do not open PRs, even if asked. Prepare the branch and a PR description, then ask human.
* All your changes should go to the `dev/beta` branch as a general rule. Only trivial hotfixes and one-liners can go to `master`.

# Comments

Prefer one-liner comments, optimize for the readability and quick skimming.
Avoid superficial, redundant or self evident comments. 


bad:
	/**
	 * The URL to hand somebody else. Not the game's own ?saveId= url: this one is
	 * served by KGNET with Open Graph tags, so pasting it into Discord/Slack unfurls
	 * into a card. Humans are bounced on to the game from there.
	 */
(redundant, not skimmable)

good:
    /* Public sharable URL that goes through KGNET and generates opengraph preview card*/

bad:
    //the game is deployed at several paths (/web/, /beta/, /alpha/) - bring the reader back to ours.
	//only the path travels; the preview page resolves it against the game host it knows.

(self evident, overly verbose and convoluted, tries to cram as much as possible in a single line)

good:
    //generate redirect url, backend will verify the host

# Tests

* If any test fails it must be fixed. Never dismiss it as 'unrelated' or 'pre-existing'.
* Follow game.test.js format where possible. Aim for a single self contained high level test.
* Game UI is an implementation detail, never read UI state directly, rely only on `game` scope: `game.resPool.get("catnip").value`

# Style and architecture

* Focus on higher architecual patterns and how original devs would actually write the changes based on the existing style and vibes of the code.
* Be brutally simple. Avoid superficial abstractions. Reuse existing mechanisms.
