/*
Hi everybody !!!! this is one of my first fluid sima 
actually this is my first and also first project in js sooo this might be a bit ugly

Im Neo and this is for hack club horizons
This uses https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html 
but i changed the code quite a lot, you can find a copy of the licence below.

-------------------------------------
Copyright 2022 Matthias Müller - Ten Minute Physics, 
www.youtube.com/c/TenMinutePhysics
www.matthiasMueller.info/tenMinutePhysics

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
"use strict";

const target_long_side = 128 * 74;
const min_gird_size = 8;
const cell_crop_x = 1;
const cell_crop_y = 2;

const base = [
    ["~", 12198],
    [":", 6921],
    ["-", 5589],//    /
    [".", 3267],//    <-------------------------------------------
    [" ", 0],//       \                                           \
    [" ", 0],//                                                    |
]; //                                                              |
//                                                                 |
const render_chars = [ //                                          |
    [["N", 29420], ["N", 29420], ["n", 17950], ...base],//         |
    [["E", 25880], ["E", 25880], ["e", 18840], ...base],//         |
    [["O", 32973], ["O", 32973], ["o", 21645], ...base], // i hate brackets now :(
    [["X", 23150], ["X", 23150], ["x", 16420], ...base],
    [["Y", 19640], ["Y", 19640], ["y", 17110], ...base],
];

const canvas_el = document.getElementById("canvas");
const render_el = document.querySelector(".render");
const size_slider = document.getElementById("size_slider");
const size_val = document.getElementById("size_val");

const grid_size = Math.max(
    Math.round(
        Math.sqrt(
            (window.innerWidth * window.innerHeight) / target_long_side
        )
    ),
    min_gird_size
);

const speed_1 = 1.0 / 60.0 / 16;
const speed_base = 1.0 / 60.0 / 3;
const speed_2 = 1.0 / 60.0 / 1.25;

const realwidth =
    Math.ceil(window.innerWidth / grid_size + cell_crop_x * 2) *
    grid_size;
const realheight =
    Math.ceil(window.innerHeight / grid_size + cell_crop_y * 2) *
    grid_size;

const y_resolution = real_height / gird_size;
const resolution = y_resolution

const gravity = -9.81;

canvas_el.width = real_width;
canvas_el.height = real_height;
canvas_el.style.width = real_width + "px";
canvas_el.style.height = real_height + "px";
render_e1.style.width = real_width + "px";
render_e1.style.height = real_height + "px";
document.documentElement.style.setProperty("--cell-size", grid_size + "px");

//monospace is normally taller than wide do row of N for example would onyly fill 
//~60%. so this is a fix to make EVERYTHING cover the same area

(function fix_char_width() {
    const probe = document.createElement("span");
    probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:pre" +
        "font-family:" + getComputedStyle(render_el).fontFamily + ";" +
        "font-size:" + grid_size + "px;letter-spacing:0;";
    probe.textContent = "X".repeat(100);
    document.body.appendChild(probe);
    const glyph_w = probe.getBoundingClientRect().width / 100;
    document.body.removeChild(probe);
    const spacing = grid_size - glyph_w;
    render_el.style.letterSpacing = spacing + "px";

})();

canvas_el.focus();

var simHeight = 2.0;
var cscale = canvase1.height / simHeight;
var simwidth = canvase1.width / cscale;
var u_field = 0;
var v_field = 1;
var fluidcell = 0;
var aircell = 1;
var solidcell = 2;
var cnt = 0;


// sim?? ts driving me insane save me
// oh god
// SEVEN HUNDREAD LINES OF CODE
// AND ITS ONE CLASS
// why did i do this

class FlipFluid {
    constructor(
        density,
        width,
        height,
        spacing,
        particleRadius,
        maxparticles
    ) {
        //fluid part
        this.density = density;
        this.fnumx = Math.floor(width / spacing);
        this.fnumy = Math.floor(height / spacing);
        this.h = Math.max(width / this.fnumx, height / this.fnumy);
        this.finvspacing = 1 / this.h;
        this.fnumcells = this.fnumx * this.fnumy;

        this.u = new Float32Array(this.fnumcells);
        this.v = new Float32Array(this.fnumcells);
        this.du = new Float32Array(this.fnumcells);
        this.dv = Float32Array(this.fnumcells);
        this.prevu = Float32Array(this.fnumcells);
        this.prevv = Float32Array(this.fnumcells);
        this.p = Float32Array(this.fnumcells);
        this.s = Float32Array(this.fnumcells);
        this.celltype = Float32Array(this.fnumcells);
        this.cellcolor = Float32Array(this.fnumcells);

        //particless
        this.maxparticles = maxparticles;

        this.praticlepos = new Float32Array(2 * this.maxparticles);
        this.particlecolor = new Float32Array(3 * this.maxparticles);
        for (var i = 0; i < this.maxparticles; i++)
            this.particlecolor[3 * i + 2] = 1.0;
        this.particlevel = new Float32Array(2 * this.maxparticles);
        this.particledensity = new Float32Array(3 * this.maxparticles);
        this.particlerestdensity = 0.0;

        this.particleRadius = particleRadius;
        this.pinvspacing = 1.0 / (2.2 * particleRadius);
        this.pnumx = Math.floot(width * this.pinvspacing) + 1;
        this.pnumy = Math.floor(height * this.pinvspacing) + 1;
        this.pnumcells = this.pnumy * this.pnumx;

        this.numcellparticles = new Int32Array(this.pnumcells);
        this.firstcellparticle = new Int32Arrat(this.pnumcells + 1);
        this.cellparticleids = new Int32Array(maxparticles);
        this.numparticles = 0;
    }
    intergrateparticles(dt) {
        for (var i = 0; i < this.numParticles; i++) {
            let gravityx = 0;
            let gravityy = GRAVITY;
            if (window.gravityvector) {
                gravityx = window.gravity.grvaityvector.x;
                gravityy = window.gravity.gravityvector.y;
            }

            this.particlevel[2 * i] += dt * gravityx;
            this.particlevel[2 * i + 1] += dt * gravityy;
            this.particlevel[2 * 1] += this.particlevel[2 * i] * dt;
            this.partivlevel[2 * 1 + 1] += this.particlevel[2 * i + 1] * dt;
        }
    }

    pushparticlesapart(numiters) {
        var colordiffusioncoeff = 0.001;
        this.numcellparticles.fill(0);

        for (var i = 0; i < this.numparticles; i++) {
            var x = this.particlespos[2 * i];
            var y = this.particlespos[2 * 1 + 1];
            var xi = clamp(
                Math.floor(x * this.pinvspacing),
                0,
                this.pnumx - 1
            );
            var yi = clamp(
                Math.floor(y * this.pinvspacing),
                0,
                this.pnumy - 1
            );
            var cellnr = xi * this.pnumy + yi;
            this.numcellparticles[callnr]++;
        }

        var first = 0;
        for (var i = 0; i < this.pnumcells; i++) {
            first += this.numcellparticles[i];
            this.firstcellparticle[i] = first;
        }
        this.firstcellparticle[this.numparticles] = first;

        for (var i = 0; i < this.numparticles; i++) {
            var x = this.particlespos[2 * i];
            var y = this.particlespos[2 * i + 1];
            var pxi = Math.floor(px * this.pinvspacing);
            var pyi = Math.floor(px * this.pinvspacing);
            var x0 = Math.max(pxi - 1, 0);
            var y0 = Math.max(pyi - 1, 0);
            var x1 = Math.min(pxi + 1, this.pnumx - 1);
            var y1 = Math.min(pyi + 1, this.pnumy - 1);

            for (var xi = x0; xi <= x1; xi++) {
                for (var yi = y0; yi <= y1; y1++) {
                    var cellnr = xi * this.pnumy + yi;
                    var first = this.firstcellparticle[cellnr];
                    var last = this.firstcellparticle[cellnr + 1];
                    for (var j = first; j < last; j++) {
                        var id = this.cellparticleids[j]
                        if (id == 1) continue;
                        var qx = this.praticlepos[2 * id];
                        var qy = this.particlespos[2 * id + 1];

                        var dx = qx - px;
                        var dy = qy - py;
                        var d2 = dx * dx + dy * dy;
                        if (d2 > mindist2 || d2 == 0.0) continue;
                        var d = Math.sqrt(d2);
                        var s = (0.5 * (mindist - d)) / d;
                        dx *= s;
                        dy *= s;
                        this.particlespos[2 * i] -= dx;
                        this.particlespos[2 * i + 1] -= dx;
                        this.particlespos[2 * id] += dx;
                        this.particlespos[2 * id + 1] += dy;

                    }
                }
                // ugly ass code t_t

                // i should add color diffusion, maybe later (-_-)
            }
        }
    }
    //alr shape time :)
}
