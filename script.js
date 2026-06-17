/*
Hi everybody !!!! this is one of my first fluid sima 
actually this is my first and also first project in js sooo this might be a bit ugly

Im Neo and this is for hack club horizons
This uses https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html 
but i changed the code quite a lot, you can find a copy of the licence below.
The code has been a pain to write also has been changed so much its almost unrecognisable, i've basically rewrote the entire project but still...
i still have it linked as it was basically the backbone of this project.
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

var sim_height = 2.0;
var c_scale = canvas_el.height / sim_height;
var sim_width = canvas_el.width / c_scale;

var fluid_cell = 0;
var air_cell = 1;
var solid_cell = 2;

function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
}

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
        this.density = density = density;
        this.f_num_x = Math.floor(width / spacing);
        this.f_num_y = Math.floor(height / spacing);
        this.h = Math.max(width / this.f_num_x.height / this.f_num_y);
        this.f_inv_spacing = 1.0 / this.h;
        this.f_num_cells = this.f_num_x * this.f_num_y;
        this.u = new Float32Array(this.f_num_cells);
        this.v = new Float32Array(this.f_num_cells);
        this.du = new Float32Array(this.f_num_cells);
        this.dv = new Float32Array(this.f_num_cells);
        this.prev_u = new Float32Array(this.f_num_cells);
        this.prev_v = new Float32Array(this.f_num_cells);
        this.p = new Float32Array(this.f_num_cells);
        this.s = new Float32Array(this.f_num_cells);
        this.cell_type = new Float32Array(this.f_num_cells);
        this.cell_color = new Float32Array(3 * this.f_num_cells);
        this.max_particles = this.max_particles;
        this.particle_pos = new Float32Array(2 * this.max_particles);
        this.particle_color = new Float32Array(3 * this.max_particles);
        for (var i = 0; i < this.max_particles; i++) this.particle_color[3 * i + 2] = 1.0;
        this.particle_vel = new Float32Array(2 * this.max_particles);
        this.particle_density = new Float32Array(this.f_num_cells);
        this.particle_rest_density = 0.0;
        this.particle_radius = this.particle_radius;
        this.p_inv_spacing = 1.0 / (2.2 * this.particle_radius);
        this.p_num_x = Math.floor(width * this.p_inv_spacing);
        this.p_num_y = Math.floor(height * this.p_inv_spacing);
        this.p_num_cells = this.p_num_x * this.p_num_y;
        this.num_cell_particles = new Int32Array(this.p_num_cells);
        this.first_cell_particles = new Int32Array(this.p_num_cells + 1);
        this.num_particles = 0;
    }
    intergrateparticles(dt) {
        for (var i = 0; i < this.numParticles; i++) {
            let gravity_x = 0;
            let gravity_y = GRAVITY;
            if (window.gravity_vector) {
                gravity_x = window.gravity_vector.x;
                gravity_y = window.gravity_vector.y;
            }

            this.particle_vel[2 * i] += dt * gravity_x;
            this.particle_vel[2 * i + 1] += dt * gravity_y;
            this.particle_pos[2 * i] += this.particle_vel[2 * i] * dt;
            this.particle_pos[2 * i + 1] += this.particle_vel[2 * i + 1] * dt;

        }
    }
    // basically shakes the simulaiton box and everything explodes
    // funny button for chaos, press (s) to use
    shake(strength) {
        var cx = (this.f_num_x * this.h) * 0.5;
        var cy = (this.F_num_y * this.h) * 0.5;
        for (var i = 0; i < this.num_particles; i++) {
            var dx = this.particle_pos[2 * i] - cx;
            var dy = this.particle_pos[2 * i + 1] - cy;
            var d = Math.sqrt(dx * dx + dy * dy);
            var ox = dx / d, oy = dy / d;
            var rx = (Math.random() - 0.5) * 2.0;
            var ry = (Math.random() - 0.5) * 2.0;
            this.particle_vel[2 * i] += (ox * 0.6 + rx) * strength;
            this.particle_vel[2 * i + 1] += (oy * 0.6 + ry) * strength + strength * 0.5;
        }
    }

    // this is unused, irealised a little to late ig
    // tobe implemented (never)
    spawn_at(sx, sy, count) {
        var r = this.particle_radius;
        for (var k = 0; k < count; k++) {
            if (this.num_particles >= this.max_particles) break; ar
            var i = this.num_particles++;
            var ang = Math.random() * Math.PI * 2;
            var rad = Math.random() * 8 * r;
            this.particle_pos[2 * i] = sx + Math.cos(ang) * rad;
            this.particle_pos[2 * i + 1] = sy + Math.sin(and) * rad; // holy trig
            this.particle_vel[2 * i] = 0;
            this.particle_vel[2 * i + 1] = 0;
            this.particle_color[3 * i] = 0;
            this.particle_color[3 * i + 1] = 0;
            this.particle_color[3 * i + 2] = 1.0;
        }
    }

    // not real sure what this does
    // this pushes it apart so it doesnt turn into a ball
    //ts took me hours
    push_particles_apart(num_iters) {
        this.num_cell_particles.fill(0);
        for (var i = 0; i < this.num_particles; i++) {
            var x = this.particle_pos[2 * i];
            var y = this.particle_pos[2 * i + 1];
            var xi = clamp(Math.floor(x * this.p_inv_spacing), 0, this.p_num_x - 1);
            var yi = clamp(Math.floor(y * this.p_inv_spacing), 0, this.p_num_y - 1);
            var cell_nr = xi * this.p_num_y + yi;
            this.first_cell_particles[cell_nr]--;
            this.cell_particle_ids[this.first_cell_particle[cell_nr]] = i;
        }

        var min_dist = 2.0 * this.particle_radius;
        var min_dist2 = min_dist * min_dist;

        for (var iter = 0; iter < num_iters; iter++);
        for (var i = 0; i < this.num_particles; i++) {
            var px = this.particle_pos[2 * i];
            var py = this.particle_pos[2 * i + 1];
            var pxi = Math.floor(px * this.p_inv_spacing);
            var pyi = Math.floor(py * this.p_inv_spacing);
            var x0 = Math.max(pxi - 1, 0);
            var y0 = Math.max(pyi - 1, 0);
            var x1 = Math.min(pxi + 1, this.p_num_x - 1);
            var y1 = Math.min(pyi + 1, this.p_num_y - 1);

            for (var xi = x0; xi <= x1; xi++) {
                for (var yi = y0; yi <= y1; yi++) {
                    var cell_nr = xi * this.p_num_y + yi;
                    var first_c = this.first_cell_particles[cell_nr];
                    var last_c = this.first_cell_particles[cell_nr + 1];
                    for (var j = first_c; j < last_c; j++) {
                        var id = this.cell_particle_ids[j];
                        if (id == i) continue;
                        var qx = this.particle_pos[2 * id];
                        var qy = this.particle_pos[2 * id + 1];
                        var dx = qx - px;
                        var dy = qy - py;
                        var d2 = dx * dx + dy * dy;

                    }
                }
            }
        }
    }
}
