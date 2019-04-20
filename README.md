# README #

### General Information ###

* https://www.reddit.com/r/kittensgame
* https://dojotoolkit.org/reference-guide/1.7/dojo/index.html#dojo-index (I'm using mostly pre-1.7 dojo functionality)

### No ES6 please ###

KG ecosystem have to support about 20.000 different android devices, iOS, os and browser versions dating 1980, chrome/FF/IE/Edge/webkit of all possible releases.
We support IE6. We support browsers that does not know how to work with local storage or web workers. I'm not sure but it might acutally work on Netscape, Links or Mosaic.

Please, no ()=>{}, const, require, webpackers, etc.

### Roadmap ###

Most recent roadmap: https://trello.com/b/cecIwqp2/kittens-game-roadmap
Please feel free to add other suggestions.

### Contribution guidelines ###

## Theme/Setting ##

In a grim and dark future of the catkind no one can hear you scream.

* Good: mythical monsters, elder artifacts, arcane technologies, lost civilizations
* Bad: elves, fairies, robots, owls

## General Design Principles ##

* It's better to reuse existing buildings and resources rather than introduce new
* Active gameplay should be encouraged if possible, but should not be an absolute requirement to play.
* Every problem or bottleneck should be addressed in multiple ways
(E.g.: Tradepost to reduce fur consumption AND hunting upgrade to get better yield)
* Every solution to a problem should create a new problem

* Design things difficult first and address them with upgrades later
    * For god's sake never ever nerf anything

* Think how things will scale at later stages. You have a rare resource that cost 1M unobtainium? 
Someone will be able to farm trillions of them.

* Try to introduce some varieties in mechanic but stay withing established rule system.
    * For example, hunt require catpower, grants you various resource and have a chance of giving you something rare
    * Similarly trade require catpower, grants you various resource and have a chance of giving you something rare.
        * Everyone are really comfortable with trade mechanic because it speaks in familiar terms that players have learned already.

* Don't use %reduction effects. For every problem it may solve, a trillion new issues will appear.
* Don't use price reduction effects. If you do, be extremely careful.