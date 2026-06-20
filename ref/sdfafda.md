# Liquid Ascii

hi !!! this is a fluid simulation that runs entirely in ascii characters. it's my first real js project (and kinda my first project in general) so the code is a bit ugly but it works and im proud of it ok

made for **Hack Club Horizons 2026**.

## what it actually is

it's a FLIP fluid sim (the proper physics kind, particles + a grid) but instead of drawing pixels it spells everything out in letters. the letters are N E O X Y because those are my initials-ish and i thought that was funny. brighter fluid = denser letters, empty space = blank.

there's a hexagon in the middle you can shove around and the water flows around it. why a hexagon? no idea. a circle would have been ONE line of math. i chose violence (trigonometry).

## how to use it

- **drag** — move the hexagon around, push the water
- **slider** (bottom) — change the hexagon size live, it shoves the fluid as it grows
- **[ p ]** — pause
- **[ s ]** — shake it up. everything explodes. very satisfying
- **tilt your phone** — the water falls whichever way you tilt (only works on https + you gotta tap once first so ios lets me read the motion sensor)

## the stack

literally just three files:

- `index.html`
- `style.css`
- `script.js`

no frameworks, no build step, no npm, nothing. open it and it runs. (well — open it through a proper server, not by double clicking, browsers get weird about loading the js off `file://`. `python3 -m http.server` works fine.)

## credit where its due

the backbone of this is Matthias Müller's "Ten Minute Physics" tutorial #18, which taught me how FLIP fluids actually work. i've changed it SO much it's almost unrecognisable at this point — rewrote basically the whole thing, swapped the renderer for ascii, added the hexagon, the shake, the tilt, the resizing — but the core solver lineage is his and i'm keeping the credit + MIT license in the source because that's only fair.

- tutorial: https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html
- ten minute physics: https://www.youtube.com/c/TenMinutePhysics

## notes to self / anyone reading

- the FLIP velocity transfer is the scariest part of the code. do not touch it. it works and i don't fully know why
- the whole thing is basically one giant class and i have made peace with that
- if you're an avid reviewer reading this: hi :)

made with way too many late nights by Neo