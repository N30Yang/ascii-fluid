# Liquid Ascii

Hi! This is a fluid simulation that runs entirely in ascii characters. It's my first JS project (and kinda my first major project in general) so the code is a bit ugly but it works and im proud of it ok?

Made for **hack club Horizons 2026**

## what it actually is

It's a FLIP fluid sim (The physics kind, particles+density ramp+ a grid) but instead of drawing pixes it spells everything in letters, in fact there are no images in the entire website. Brighter fluid = denser letters, empty space = empty space.

Theres a shape in the middle you can shove around or fling it like a air hockey puck. You can cycle through shapes with [c]. Made with trig and the MATH function.

## how to use it

- **drag** - move the shape around, and push the water.
- **slider** - Change the size of the shape live, it moves the fluid as it grows.
- **[p]** - pausing the simulation
- **[s]** - Shake the "tank", everything explodes, very cool.
- **[r]** - Rain in extra particles. Don't put too much
- **[o]** - Rains in oil that floats, was annoying to implement.
- **[c]** - Changes the shape to either:
Triangle
Square
Pentagon
Hexagon [default]
Octogon
Circle

-**[g]** - Changes to either pinned or free moving
Pinned means it isn't affected by gravity and like moves when you click, you can't fling it.
Free means it acts like a air hockey puck you can fling it and affect by gravity and device tilt.
- **Tilt your device (only works on devices with a gyro)** - The water falls whichever way you tilt like water in a bottle. (Only workd on https + tap once to enable it on ios)

## the stack
Genuienly just 3 files:
- index.html
- style.css
- script.js

no framework, no build step, no npm, just run index.html and make sure evrythign is in the same folder.

## notes (future features)
<<<<<<< HEAD
Custom text
Color change for oil and water.
Add outline to shape?
=======
- Custom text
- Color change for oil and water.

>>>>>>> 44c812a749896c2076cf45d9ce3e460ff68a4fe6

## credit
The backbone of this is Matthias Müller's "Ten Minute Physics" tutorial #18, which uses the origianal code but I've changed it so much, just look at the og repo. I've rewrote basically evrything: The renderer for ascii, Hexagon, Shake, tilt, resizing, oil, rain, puck, and pausing.
Im still keeping credit + License in the script.js and here: 
- tutorial: https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html
- ten minute physics: https://www.youtube.com/c/TenMinutePhysics
Copyright 2022 Matthias Müller - Ten Minute Physics, 
www.youtube.com/c/TenMinutePhysics
www.matthiasMueller.info/tenMinutePhysics

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
