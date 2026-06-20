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
const min_grid_size = 8;
const cell_crop_x = 1;
const cell_crop_y = 2;

const base = [
    ["~", 12198],
    [":", 6921],
    ["-", 5589], //    /
    [".", 3267], //    <-------------------------------------------
    [" ", 0], //       \                                           \
    [" ", 0], //                                                    |
]; //                                                              |
//                                                                 |
const render_chars = [ //                                          |
    [
        ["N", 29420],
        ["N", 29420],
        ["n", 17950], ...base
    ], //         |
    [
        ["E", 25880],
        ["E", 25880],
        ["e", 18840], ...base
    ], //         |
    [
        ["O", 32973],
        ["O", 32973],
        ["o", 21645], ...base
    ], // i hate brackets now :(
    [
        ["X", 23150],
        ["X", 23150],
        ["x", 16420], ...base
    ],
    [
        ["Y", 19640],
        ["Y", 19640],
        ["y", 17110], ...base
    ],
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
    min_grid_size
);

const speed_1 = 1.0 / 60.0 / 16;
const speed_base = 1.0 / 60.0 / 3;
const speed_2 = 1.0 / 60.0 / 1.25;

const real_width =
    Math.ceil(window.innerWidth / grid_size + cell_crop_x * 2) *
    grid_size;
const real_height =
    Math.ceil(window.innerHeight / grid_size + cell_crop_y * 2) *
    grid_size;

const y_resolution = real_height / grid_size;
const resolution = y_resolution

const gravity = -9.81;

canvas_el.width = real_width;
canvas_el.height = real_height;
canvas_el.style.width = real_width + "px";
canvas_el.style.height = real_height + "px";
render_el.style.width = real_width + "px";
render_el.style.height = real_height + "px";
document.documentElement.style.setProperty("--cell-size", grid_size + "px");

//monospace is normally taller than wide do row of N for example would onyly fill 
//~60%. so this is a fix to make EVERYTHING cover the same area

(function fix_char_width() {
    const probe = document.createElement("span");
    probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:pre;" +
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
        this.density = density;
        this.f_num_x = Math.floor(width / spacing);
        this.f_num_y = Math.floor(height / spacing);
        this.h = Math.max(width / this.f_num_x, height / this.f_num_y)
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
        this.cell_particle_ids = new Int32Array(maxparticles);
        this.max_particles = maxparticles;
        this.particle_pos = new Float32Array(2 * this.max_particles);
        this.particle_color = new Float32Array(3 * this.max_particles);
        for (var i = 0; i < this.max_particles; i++) this.particle_color[3 * i + 2] = 1.0;
        this.particle_vel = new Float32Array(2 * this.max_particles);
        // per-particle type: 0 = water, 1 = oil. oil is lighter so it floats
        this.particle_type = new Uint8Array(this.max_particles);
        // marks grid cells that currently hold oil, so the renderer can draw it different
        this.oil_grid = new Uint8Array(this.f_num_cells);
        this.particle_density = new Float32Array(this.f_num_cells);
        this.particle_rest_density = 0.0;
        this.particle_radius = particleRadius;
        this.p_inv_spacing = 1.0 / (2.2 * this.particle_radius);
        this.p_num_x = Math.floor(width * this.p_inv_spacing) + 1;
        this.p_num_y = Math.floor(height * this.p_inv_spacing) + 1;
        this.p_num_cells = this.p_num_x * this.p_num_y;
        this.num_cell_particles = new Int32Array(this.p_num_cells);
        this.first_cell_particles = new Int32Array(this.p_num_cells + 1);
        this.num_particles = 0;
    }
    intergrate_particles(dt) {
        for (var i = 0; i < this.num_particles; i++) {
            let gravity_x = 0;
            let gravity_y = gravity;
            // fluid follows phone tilt whenever device motion is feeding us a vector
            if (window.gravity_vector) {
                gravity_x = window.gravity_vector.x;
                gravity_y = window.gravity_vector.y;
            }

            // oil is lighter than water, so push it UP a bit -> it floats to the top
            if (this.particle_type[i] === 1) {
                gravity_y += -gravity * 0.45; // partial cancel of gravity = buoyant
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
        var cy = (this.f_num_y * this.h) * 0.5;
        for (var i = 0; i < this.num_particles; i++) {
            var dx = this.particle_pos[2 * i] - cx;
            var dy = this.particle_pos[2 * i + 1] - cy;
            var d = Math.sqrt(dx * dx + dy * dy);
            var ox = dx / d,
                oy = dy / d;
            var rx = (Math.random() - 0.5) * 2.0;
            var ry = (Math.random() - 0.5) * 2.0;
            this.particle_vel[2 * i] += (ox * 0.6 + rx) * strength;
            this.particle_vel[2 * i + 1] += (oy * 0.6 + ry) * strength + strength * 0.5;
        }
    }

    // FINALLY using this lol. spawns `count` particles in a little blob around
    // (sx, sy). type = 0 water, 1 oil. used by rain (r key) and oil drop (o key)
    spawn_at(sx, sy, count, type) {
        if (type === undefined) type = 0;
        var r = this.particle_radius;
        for (var k = 0; k < count; k++) {
            if (this.num_particles >= this.max_particles) break;
            var i = this.num_particles++;
            var ang = Math.random() * Math.PI * 2;
            var rad = Math.random() * 8 * r;
            this.particle_pos[2 * i] = sx + Math.cos(ang) * rad;
            this.particle_pos[2 * i + 1] = sy + Math.sin(ang) * rad; // holy trig
            this.particle_vel[2 * i] = 0;
            this.particle_vel[2 * i + 1] = 0;
            this.particle_type[i] = type;
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

        // count particles per cell
        for (var i = 0; i < this.num_particles; i++) {
            var x = this.particle_pos[2 * i];
            var y = this.particle_pos[2 * i + 1];
            var xi = clamp(Math.floor(x * this.p_inv_spacing), 0, this.p_num_x - 1);
            var yi = clamp(Math.floor(y * this.p_inv_spacing), 0, this.p_num_y - 1);
            var cell_nr = xi * this.p_num_y + yi;
            this.num_cell_particles[cell_nr]++;
        }

        // partial sums
        var first = 0;
        for (var i = 0; i < this.p_num_cells; i++) {
            first += this.num_cell_particles[i];
            this.first_cell_particles[i] = first;
        }
        this.first_cell_particles[this.p_num_cells] = first; // guard

        // fill particles into cells
        for (var i = 0; i < this.num_particles; i++) {
            var x = this.particle_pos[2 * i];
            var y = this.particle_pos[2 * i + 1];
            var xi = clamp(Math.floor(x * this.p_inv_spacing), 0, this.p_num_x - 1);
            var yi = clamp(Math.floor(y * this.p_inv_spacing), 0, this.p_num_y - 1);
            var cell_nr = xi * this.p_num_y + yi;
            this.first_cell_particles[cell_nr]--;
            this.cell_particle_ids[this.first_cell_particles[cell_nr]] = i;
        }

        var min_dist = 2.0 * this.particle_radius;
        var min_dist2 = min_dist * min_dist;

        for (var iter = 0; iter < num_iters; iter++)
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
                        if (d2 > min_dist2 || d2 == 0.0) continue;
                        var d = Math.sqrt(d2);
                        var s = (0.5 * (min_dist - d)) / d;
                        dx *= s;
                        dy *= s;
                        this.particle_pos[2 * i] -= dx;
                        this.particle_pos[2 * i + 1] -= dy;
                        this.particle_pos[2 * id] += dx;
                        this.particle_pos[2 * id + 1] += dy;
                    }
                }
            }
        }
    }

    // alr shape time, i think i might do a hexagon
    // WHY DID I SHOOSE A HEXAGON, TRIGINOMETRY IS AHH
    // A CIRCLE WOULD BE SO MUCH EASIER
    // CIRCLES ARE ONE LINE OF CODE
    handle_particle_collisions(obstacle_x, obstacle_y, obstacle_radius, sides, obs_vel_x, obs_vel_y, obs_angle) {
        if (sides === undefined) sides = 6; // default hexagon, still my beloved
        if (obs_vel_x === undefined) obs_vel_x = 0;
        if (obs_vel_y === undefined) obs_vel_y = 0;
        if (obs_angle === undefined) obs_angle = 0;
        var h = 1.0 / this.f_inv_spacing;
        var r = this.particle_radius;
        var min_x = h + r,
            max_x = (this.f_num_x - 1) * h - r;
        var min_y = h + r,
            max_y = (this.f_num_y-1 ) * h - r;
        // build the polygon verticies. `sides` controls the shape now:
        // 3 = triangle, 4 = square, 6 = hexagon, 32 = basically a circle
        // obs_angle rotates the whole thing (so it tumbles as it moves, rock-like)
        var R = obstacle_radius;
        var hex = [];
        for (var k = 0; k < sides; k++) {
            var ang = (Math.PI * 2 / sides) * k + obs_angle;
            hex.push({
                x: obstacle_x + R * Math.cos(ang),
                y: obstacle_y + R * Math.sin(ang)
            });
        }

        function sign(px, py, ax, ay, bx, by) {
            return (px - bx) * (ay - by) - (ax - bx) * (py - by);
        }

        // convex polygon point thing test: 
        function in_hex(px, py) {
            var pos = false,
                neg = false;
            for (var e = 0; e < sides; e++) {
                var a = hex[e],
                    b = hex[(e + 1) % sides];
                var d = sign(px, py, a.x, a.y, b.x, b.y);
                if (d > 0) pos = true;
                if (d < 0) neg = true;
                if (pos && neg) return false;
            }
            return true;
        }

        for (var i = 0; i < this.num_particles; i++) {
            var x = this.particle_pos[2 * i];
            var y = this.particle_pos[2 * i + 1];

            if (R > 0 && in_hex(x, y)) {
                var best_x = x,
                    best_y = y,
                    best = Number.MAX_VALUE;
                for (var e = 0; e < sides; e++) {
                    var p1 = hex[e],
                        p2 = hex[(e + 1) % sides]
                    var ex = p2.x - p1.x,
                        ey = p2.y - p1.y;
                    var px = x - p1.x,
                        py = y - p1.y
                    var len = ex * ex + ey * ey;
                    var t = len > 0 ? clamp((px * ex + py * ey) / len, 0, 1) : 0;
                    var proj_x = p1.x + t * ex,
                        proj_y = p1.y + t * ey;
                    var dd = (x - proj_x) * (x - proj_x) + (y - proj_y) * (y - proj_y);
                    if (dd < best) {
                        best = dd;
                        best_x = proj_x;
                        best_y = proj_y;
                    }
                }
                x = best_x;
                y = best_y;
                // instead of just stopping the particle, hand it the ROCK's velocity.
                // this is what makes a moving/flung rock actually shove the water
                this.particle_vel[2 * i] = obs_vel_x;
                this.particle_vel[2 * i + 1] = obs_vel_y;
            }

            if (x < min_x) {
                x = min_x;
                this.particle_vel[2 * i] = 0.0;
            }
            if (x > max_x) {
                x = max_x;
                this.particle_vel[2 * i] = 0.0
            }
            if (y < min_y) {
                y = min_y;
                this.particle_vel[2 * i + 1] = 0.0;
            }
            if (y > max_y) {
                y = max_y;
                this.particle_vel[2 * i + 1] = 0.0;
            }
            this.particle_pos[2 * i] = x;
            this.particle_pos[2 * i + 1] = y;
        }
    }

    // counts for how squished the water is. it's for the drift compensation smoothness or something like that

    update_particle_density() {
        var n = this.f_num_y,
            h = this.h,
            h1 = this.f_inv_spacing,
            h2 = 0.5 * h;
        var d = this.particle_density;
        d.fill(0.0);
        this.oil_grid.fill(0); // reset oil markers each frame
        for (var i = 0; i < this.num_particles; i++) {
            var x = clamp(this.particle_pos[2 * i], h, (this.f_num_x - 1) * h);
            var y = clamp(this.particle_pos[2 * i + 1], h, (this.f_num_y - 1) * h);
            var x0 = Math.floor((x - h2) * h1),
                tx = (x - h2 - x0 * h) * h1,
                x1 = Math.min(x0 + 1, this.f_num_x - 2);
            var y0 = Math.floor((y - h2) * h1),
                ty = (y - h2 - y0 * h) * h1,
                y1 = Math.min(y0 + 1, this.f_num_y - 2);
            var sx = 1.0 - tx,
                sy = 1.0 - ty;
            if (x0 < this.f_num_x && y0 < this.f_num_y) d[x0 * n + y0] += sx * sy;
            if (x1 < this.f_num_x && y0 < this.f_num_y) d[x1 * n + y0] += tx * sy;
            if (x1 < this.f_num_x && y1 < this.f_num_y) d[x1 * n + y1] += tx * ty;
            if (x0 < this.f_num_x && y1 < this.f_num_y) d[x0 * n + y1] += sx * ty;
            // if this particle is oil, flag the cell it sits in
            if (this.particle_type[i] === 1) {
                var oxi = clamp(Math.floor(x * h1), 0, this.f_num_x - 1);
                var oyi = clamp(Math.floor(y * h1), 0, this.f_num_y - 1);
                this.oil_grid[oxi * n + oyi] = 1;
            }
        }
        if (this.particle_rest_density == 0.0) {
            var sum = 0.0,
                num_fluid_cells = 0;
            for (var i = 0; i < this.f_num_cells; i++) {
                if (this.cell_type[i] == fluid_cell) {
                    sum += d[i];
                    num_fluid_cells++;
                }
            }
            if (num_fluid_cells > 0) this.particle_rest_density = sum / num_fluid_cells;
        }
    }

    // grid <-> particles. the FLIP part of flip fluid sim. don't touch this, if it 
    // ain't broke don't fix it. 
    transfer_velocities(to_grid, flip_ratio) {
        var n = this.f_num_y,
            h = this.h,
            h1 = this.f_inv_spacing,
            h2 = 0.5 * h;
        if (to_grid) {
            this.prev_u.set(this.u);
            this.prev_v.set(this.v);
            this.du.fill(0.0);
            this.dv.fill(0.0);
            this.u.fill(0.0);
            this.v.fill(0.0);
            for (var i = 0; i < this.f_num_cells; i++)
                this.cell_type[i] = this.s[i] == 0.0 ? solid_cell : air_cell;
            for (var i = 0; i < this.num_particles; i++) {
                var xi = clamp(Math.floor(this.particle_pos[2 * i] * h1), 0, this.f_num_x - 1);
                var yi = clamp(Math.floor(this.particle_pos[2 * i + 1] * h1), 0, this.f_num_y - 1);
                var cell_nr = xi * n + yi;
                if (this.cell_type[cell_nr] == air_cell) this.cell_type[cell_nr] = fluid_cell;
            }
        }
        for (var component = 0; component < 2; component++) {
            var dx = component == 0 ? 0.0 : h2;
            var dy = component == 0 ? h2 : 0.0;
            var f = component == 0 ? this.u : this.v;
            var prev_f = component == 0 ? this.prev_u : this.prev_v;
            var d_arr = component == 0 ? this.du : this.dv;
            for (var i = 0; i < this.num_particles; i++) {
                var x = clamp(this.particle_pos[2 * i], h, (this.f_num_x - 1) * h);
                var y = clamp(this.particle_pos[2 * i + 1], h, (this.f_num_y - 1) * h);
                var x0 = Math.min(Math.floor((x - dx) * h1), this.f_num_x - 2),
                    tx = (x - dx - x0 * h) * h1,
                    x1 = Math.min(x0 + 1, this.f_num_x - 2);
                var y0 = Math.min(Math.floor((y - dy) * h1), this.f_num_y - 2),
                    ty = (y - dy - y0 * h) * h1,
                    y1 = Math.min(y0 + 1, this.f_num_y - 2)
                var sx = 1.0 - tx,
                    sy = 1.0 - ty;
                var d0 = sx * sy,
                    d1 = tx * sy,
                    d2 = tx * ty,
                    d3 = sx * ty;
                var nr0 = x0 * n + y0,
                    nr1 = x1 * n + y0,
                    nr2 = x1 * n + y1,
                    nr3 = x0 * n + y1;
                if (to_grid) {
                    var pv = this.particle_vel[2 * i + component];
                    f[nr0] += pv * d0;
                    d_arr[nr0] += d0;
                    f[nr1] += pv * d1;
                    d_arr[nr1] += d1;
                    f[nr2] += pv * d2;
                    d_arr[nr2] += d2;
                    f[nr3] += pv * d3;
                    d_arr[nr3] += d3;
                } else {
                    var offset = component == 0 ? n : 1;
                    var v0 = this.cell_type[nr0] != air_cell || this.cell_type[nr0 - offset] != air_cell ? 1.0 : 0.0;
                    var v1 = this.cell_type[nr1] != air_cell || this.cell_type[nr1 - offset] != air_cell ? 1.0 : 0.0;
                    var v2 = this.cell_type[nr2] != air_cell || this.cell_type[nr2 - offset] != air_cell ? 1.0 : 0.0;
                    var v3 = this.cell_type[nr3] != air_cell || this.cell_type[nr3 - offset] != air_cell ? 1.0 : 0.0;
                    var v = this.particle_vel[2 * i + component];
                    var dsum = v0 * d0 + v1 * d1 + v2 * d2 + v3 * d3;
                    if (dsum > 0.0) {
                        var pic_v = (v0 * d0 * f[nr0] + v1 * d1 * f[nr1] + v2 * d2 * f[nr2] + v3 * d3 * f[nr3]) / dsum;
                        var corr = (v0 * d0 * (f[nr0] - prev_f[nr0]) + v1 * d1 * (f[nr1] - prev_f[nr1]) + v2 * d2 * (f[nr2] - prev_f[nr2]) + v3 * d3 * (f[nr3] - prev_f[nr3])) / dsum;
                        var flip_v = v + corr;
                        this.particle_vel[2 * i + component] = (1.0 - flip_ratio) * pic_v + flip_ratio * flip_v;
                    }
                }
            }
            if (to_grid) {
                for (var i = 0; i < f.length; i++)
                    if (d_arr[i] > 0.0) f[i] /= d_arr[i];
                for (var i = 0; i < this.f_num_x; i++) {
                    for (var j = 0; j < this.f_num_y; j++) {
                        var solid = this.cell_type[i * n + j] == solid_cell;
                        if (solid || (i > 0 && this.cell_type[(i - 1) * n + j] == solid_cell)) this.u[i * n + j] = this.prev_u[i * n + j];
                        if (solid || (j > 0 && this.cell_type[i * n + j - 1] == solid_cell)) this.v[i * n + j] = this.prev_v[i * n + j];
                    }
                }
            }
        }
    }
    // water part of water sim, make it not fly or something

    solve_incompressibility(num_iters, dt, over_relaxation, compensate_drift = true) {
        this.p.fill(0.0);
        this.prev_u.set(this.u);
        this.prev_v.set(this.v)
        var n = this.f_num_y;
        var pc = (this.density * this.h) / dt;
        for (var iter = 0; iter < num_iters; iter++) {
            for (var i = 1; i < this.f_num_x - 1; i++) {
                for (var j = 1; j < this.f_num_y - 1; j++) {
                    if (this.cell_type[i * n + j] != fluid_cell) continue;
                    var center = i * n + j,
                        left = (i - 1) * n + j,
                        right = (i + 1) * n + j,
                        bottom = i * n + j - 1,
                        top = i * n + j + 1;
                    var sx0 = this.s[left],
                        sx1 = this.s[right],
                        sy0 = this.s[bottom],
                        sy1 = this.s[top];
                    var s = sx0 + sx1 + sy0 + sy1;
                    if (s == 0.0) continue;
                    var div = this.u[right] - this.u[center] + this.v[top] - this.v[center];
                    if (this.particle_rest_density > 0.0 && compensate_drift) {
                        var compression = this.particle_density[i * n + j] - this.particle_rest_density;
                        if (compression > 0.0) div = div - 1.0 * compression;
                    }
                    var p = -div / s;
                    p *= over_relaxation;
                    this.p[center] += pc * p;
                    this.u[center] -= sx0 * p;
                    this.u[right] += sx1 * p;
                    this.v[center] -= sy0 * p;
                    this.v[top] += sy1 * p;
                }
            }
        }
    }
    // turns number into 50 shades of grey :(
    set_sci_color(cell_nr, val, min_val, max_val) {
        val = Math.min(Math.max(val, min_val), max_val - 0.0001);
        var d = max_val - min_val;
        val = d == 0.0 ? 0.5 : (val - min_val) / d;
        var m = 0.25;
        var num = Math.floor(val / m);
        var s = (val - num * m) / m;
        var c = (num % 2 == 0) ? s : 1.0 - s;
        this.cell_color[3 * cell_nr] = c;
        this.cell_color[3 * cell_nr + 1] = c;
        this.cell_color[3 * cell_nr + 2] = c;
    }

    update_cell_colors() {
        this.cell_color.fill(0.0);
        for (var i = 0; i < this.f_num_cells; i++) {
            if (this.cell_type[i] == solid_cell) {
                this.cell_color[3 * i] = 0.5;
                this.cell_color[3 * i + 1] = 0.5;
                this.cell_color[3 * i + 2] = 0.5;
            } else if (this.cell_type[i] == fluid_cell) {
                var d = this.particle_density[i];
                if (this.particle_rest_density > 0.0) d /= this.particle_rest_density;
                this.set_sci_color(i, d, 0.0, 2.0);
            }
        }
    }

    //ok this basically runs everything
    // my arguements are beautiful. SO MANY ARGUMENTS
    simulate(dt, flip_ratio, num_pressure_iters, num_particle_iters, over_relaxation, compensate_drift, seperate_particles, obstacle_x, obstacle_y, obstacle_radius, obstacle_sides, obs_vel_x, obs_vel_y, obs_angle) {
        this.intergrate_particles(dt);
        if (seperate_particles) this.push_particles_apart(num_particle_iters);
        this.handle_particle_collisions(obstacle_x, obstacle_y, obstacle_radius, obstacle_sides, obs_vel_x, obs_vel_y, obs_angle);
        this.transfer_velocities(true);
        this.update_particle_density();
        this.solve_incompressibility(num_pressure_iters, dt, over_relaxation, compensate_drift);
        this.transfer_velocities(false, flip_ratio);
        this.update_cell_colors();
    }
}

// ITS DONE
// END OF SIMULATOR

// settings
// change and hope
var scene = {
    dt: speed_base,
    flip_ratio: 0.9,
    num_pressure_iters: 30,
    num_particle_iters: 2,
    frame_nr: 0,
    over_relaxation: 1.9,
    compensate_drift: true,
    seperate_particles: true,
    obstacle_x: 0.0,
    obstacle_y: 0.0,
    target_x: 0.0,
    target_y: 0.0,
    obstacle_radius: 0,
    target_radius: 0.18,
    follow_speed: 0.18,
    obstacle_sides: 6, // shape: 3=tri 4=square 5=pent 6=hex 8=oct 32=circle
    // --- rigid body / rock physics ---
    obstacle_vel_x: 0.0, // the shape's own velocity, so it can fall + fling fluid
    obstacle_vel_y: 0.0,
    obstacle_angle: 0.0, // current rotation, makes it tumble as it moves
    obstacle_spin: 0.0,  // angular velocity (rad/frame)
    grabbed: false,      // true while you're holding it (then it follows the cursor)
    restitution: 0.45,   // how bouncy the walls are (0 = no bounce, 1 = perfect)
    rock_gravity: false, // 'g' toggles this: false = pinned, true = rock falls
    paused: false,
    fluid: null,
};

var f;

// basically makes a tank and dumps water in it, basically
// start the box w/ water

function setup_scene() {
    var res = resolution;
    var tank_height = 1.0 * sim_height;
    var tank_width = 1.0 * sim_width;
    var h = tank_height / resolution;
    var density = 1000.0;
    var rel_water_height = 0.618;
    var rel_water_width = 1;
    var r = 0.3 * h;
    var dx = 2.0 * r;
    var dy = (Math.sqrt(3.0) / 2.0) * dx;
    var num_x = Math.floor((rel_water_width * tank_width - 2.0 * h - 2.0 * r) / dx);
    var num_y = Math.floor((rel_water_height * tank_height - 2.0 * h - 2.0 * r) / dy);
    var initial_particles = num_x * num_y;
    var max_particles = Math.floor(initial_particles * 1.5);
    f = scene.fluid = new FlipFluid(density, tank_width, tank_height, h, r, max_particles);
    f.num_particles = initial_particles;

    var p = 0;
    for (var i = 0; i < num_x; i++) {
        for (var j = 0; j < num_y; j++) {
            let x_offset = (tank_width - num_x * dx) / 2;
            let y_offset = (tank_height - num_y * dy) * -0.5;
            f.particle_pos[p++] = h + r + dx * i + (j % 2 == 0 ? 0.0 : r) + x_offset;
            f.particle_pos[p++] = h + r + dy * j + y_offset;
        }

    }

    var n = f.f_num_y;
    for (var i = 0; i < f.f_num_x; i++) {
        for (var j = 0; j < f.f_num_y; j++) {
            var s = 1.0;
            if (i == 0 || i == f.f_num_x - 1 || j == 0) s = 0.0;
            f.s[i * n + j] = s;
        }
    }

}

// grabbing the rock: while held it follows your cursor, and we track how fast
// the cursor moves so that letting go FLINGS it with that velocity

function start_drag(cx, cy) {
    mouse_down = true;
    scene.grabbed = true;
    let s = to_sim(cx, cy);
    // snap the rock to the cursor and kill its current velocity
    scene.obstacle_x = s.x;
    scene.obstacle_y = s.y;
    scene.obstacle_vel_x = 0;
    scene.obstacle_vel_y = 0;
    scene._last_grab_x = s.x;
    scene._last_grab_y = s.y;
}

function drag(cx, cy) {
    if (!mouse_down) return;
    let s = to_sim(cx, cy);
    // velocity = how far the cursor moved this step (divided by dt) -> fling speed
    scene.obstacle_vel_x = (s.x - scene._last_grab_x) / scene.dt;
    scene.obstacle_vel_y = (s.y - scene._last_grab_y) / scene.dt;
    scene.obstacle_x = s.x;
    scene.obstacle_y = s.y;
    scene._last_grab_x = s.x;
    scene._last_grab_y = s.y;
}

function end_drag() {
    mouse_down = false;
    scene.grabbed = false;
    // clamp the fling speed so a violent flick doesn't make it teleport / explode
    var max_speed = sim_height * 2.5; // generous but bounded
    var sp = Math.sqrt(scene.obstacle_vel_x * scene.obstacle_vel_x + scene.obstacle_vel_y * scene.obstacle_vel_y);
    if (sp > max_speed) {
        var k = max_speed / sp;
        scene.obstacle_vel_x *= k;
        scene.obstacle_vel_y *= k;
    }
    // it keeps whatever velocity it had when you let go -> it flies off
}

// interaction with mouse
var mouse_down = false;

// screen pixels -> sim cords. this took a while :(
function to_sim(clientX, clientY) {
    let bounds = render_el.getBoundingClientRect();
    let mx = clientX - bounds.left;
    let my = clientY - bounds.top;
    // The drawn grid is cropped: top-left drawn char = grid col cell_crop_x,
    // top drawn row = grid row (f_num_y - cell_crop_y). Cells are grid_size px square.
    let col = cell_crop_x + mx / grid_size;
    let row_from_top = my / grid_size;
    let grid_row = (f.f_num_y - cell_crop_y) - row_from_top;
    return {
        x: col * f.h,
        y: grid_row * f.h
    };
}

render_el.addEventListener("mousedown", (e) => {
    scene.dt = speed_1;
    start_drag(e.clientX, e.clientY);
});
window.addEventListener("mouseup", () => {
    scene.dt = speed_2;
    end_drag();
});
window.addEventListener("mousemove", (e) => drag(e.clientX, e.clientY));
render_el.addEventListener("touchstart", (e) => {
    e.preventDefault();
    scene.dt = speed_1;
    start_drag(e.touches[0].clientX, e.touches[0].clientY);
}, {
    passive: false
});
window.addEventListener("touchend", () => {
    scene.dt = speed_2;
    end_drag();
});
render_el.addEventListener("touchmove", (e) => {
    e.preventDefault();
    drag(e.touches[0].clientX, e.touches[0].clientY);
}, {
    passive: false
});

// slider for size
function apply_slider_size() {
    var px = parseInt(size_slider.value, 10);
    size_val.textContent = px;
    scene.target_radius = px / c_scale;
}

size_slider.addEventListener("input", apply_slider_size);
apply_slider_size();

// text box: whatever you type becomes the render characters (light -> dark)
var text_input = document.getElementById("text_input");
if (text_input) {
    text_input.addEventListener("input", function () {
        custom_ramp = text_input.value.replace(/[\n\r\t]/g, "");
        if (custom_ramp.length > 0) {
            // pad the FRONT with spaces so empty/low-density cells render blank.
            // roughly half the ramp is blank, then your characters ramp up to dense.
            var pad = Math.max(2, custom_ramp.length);
            active_ramp = " ".repeat(pad) + custom_ramp;
        } else {
            active_ramp = ""; // empty -> fall back to NEOXY
        }
    });
}

// the shapes you can cycle through. [sides, name]
var shape_cycle = [
    [3, "triangle"],
    [4, "square"],
    [5, "pentagon"],
    [6, "hexagon"],
    [8, "octagon"],
    [32, "circle"],
];
var shape_index = 3; // start on hexagon (index 3)

// rain: held down spawns water from the sky every frame
var raining = false;

// --- shared actions, called by BOTH keyboard shortcuts and the tap buttons ---
function action_toggle_pause() {
    scene.paused = !scene.paused;
    var b = document.getElementById("btn_pause");
    if (b) b.classList.toggle("-active", scene.paused);
}
function action_shake() {
    scene.paused = false;
    f.shake(6.0);
}
function action_rain_start() {
    raining = true;
    scene.paused = false;
    var b = document.getElementById("btn_rain");
    if (b) b.classList.add("-active");
}
function action_rain_stop() {
    raining = false;
    var b = document.getElementById("btn_rain");
    if (b) b.classList.remove("-active");
}
function action_cycle_shape() {
    shape_index = (shape_index + 1) % shape_cycle.length;
    scene.obstacle_sides = shape_cycle[shape_index][0];
    update_shape_label();
}
function action_drop_oil() {
    scene.paused = false;
    var ox = (0.2 + Math.random() * 0.6) * sim_width;
    var oy = sim_height * 0.85;
    f.spawn_at(ox, oy, 60, 1); // type 1 = oil
}
function action_toggle_gravity() {
    scene.rock_gravity = !scene.rock_gravity;
    if (!scene.rock_gravity) {
        scene.obstacle_vel_x = 0;
        scene.obstacle_vel_y = 0;
    }
    update_gravity_label();
}

document.addEventListener("keydown", (e) => {
    // ignore keypresses while typing in the text box
    if (e.target && e.target.tagName === "INPUT") return;
    if (e.repeat && e.key != "r") return; // dont retrigger on key autorepeat
    if (e.key == "p") action_toggle_pause();
    if (e.key == "s") action_shake();
    if (e.key == "r") action_rain_start();
    if (e.key == "c") action_cycle_shape();
    if (e.key == "o") action_drop_oil();
    if (e.key == "g") action_toggle_gravity();
});

document.addEventListener("keyup", (e) => {
    if (e.key == "r") action_rain_stop();
});

// --- wire the on-screen buttons (mobile friendly) ---
function on_tap(id, fn) {
    var b = document.getElementById(id);
    if (!b) return;
    // 'click' covers both mouse and tap
    b.addEventListener("click", function (e) { e.preventDefault(); fn(); });
}
on_tap("btn_pause", action_toggle_pause);
on_tap("btn_shake", action_shake);
on_tap("btn_oil", action_drop_oil);
on_tap("btn_shape", action_cycle_shape);
on_tap("btn_gravity", action_toggle_gravity);

// rain button: press-and-hold to rain, release to stop (touch + mouse)
(function () {
    var b = document.getElementById("btn_rain");
    if (!b) return;
    var down = function (e) { e.preventDefault(); action_rain_start(); };
    var up = function (e) { e.preventDefault(); action_rain_stop(); };
    b.addEventListener("touchstart", down, { passive: false });
    b.addEventListener("touchend", up);
    b.addEventListener("touchcancel", up);
    b.addEventListener("mousedown", down);
    b.addEventListener("mouseup", up);
    b.addEventListener("mouseleave", up);
})();

// tilt button: on iOS this is the gesture that asks for motion permission.
// on android/desktop it just enables it (no prompt)
(function () {
    var b = document.getElementById("btn_tilt");
    if (!b) return;
    b.addEventListener("click", function () {
        request_device_motion();
        b.textContent = "tilt enabled";
        b.classList.add("-active");
    });
})();

// little helpers to keep the button labels in sync
function update_shape_label() {
    var el = document.getElementById("btn_shape");
    if (el) el.textContent = "shape: " + shape_cycle[shape_index][1] + " [c]";
}
update_shape_label();

function update_gravity_label() {
    var el = document.getElementById("btn_gravity");
    if (el) el.textContent = "rock: " + (scene.rock_gravity ? "falling" : "pinned") + " [g]";
}
update_gravity_label();

let resize_timeout;
window.addEventListener("resize", () => {
    clearTimeout(resize_timeout);
    resize_timeout = setTimeout(() => window.location.reload(), 250);
});

// device tilt!!!!

var motion_ready = false; // so we only set up the listener once

async function request_device_motion() {
    if (motion_ready) return;
    // iOS 13+ : must ask permission, and it MUST happen inside a tap
    if (typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function") {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === "granted") setup_device_motion();
        } catch (err) {
            console.error(err);
        }
    } else {
        // android / everything else: no permission needed, just go
        setup_device_motion();
    }
}
// listen on a few gesture types so iphone actually fires it (click can be flaky on touch)
render_el.addEventListener("pointerdown", request_device_motion, { once: true });
render_el.addEventListener("touchstart", request_device_motion, { once: true });
render_el.addEventListener("click", request_device_motion, { once: true });
document.addEventListener("touchend", request_device_motion, { once: true });

function setup_device_motion() {
    if (motion_ready) return;
    motion_ready = true;
    window.addEventListener("devicemotion", (event) => {
        var acc = event.accelerationIncludingGravity;
        if (!acc) return;
        var x = acc.x;
        var y = acc.y;
        if (x == null && y == null) return;

        // iOS reports accelerationIncludingGravity with the OPPOSITE sign to
        // Android (apple flips it). detect ios and flip so both fall the same way.
        var is_ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (is_ios) { x = -x; y = -y; }

        // our sim's Y points UP and normal gravity is negative (down). the sensor's
        // y is "south->north" which is the opposite of screen-down, so negate y to
        // make the fluid pool toward the low edge instead of upside down.
        var gx = x;
        var gy = -y;

        // landscape: the device axes are fixed to the hardware, but the screen
        // rotated 90deg, so swap/negate to match what the user sees.
        if (window.orientation === 90) {
            var t = gx; gx = gy; gy = -t;
        } else if (window.orientation === -90) {
            var t2 = gx; gx = -gy; gy = t2;
        }

        window.gravity_vector = { x: gx, y: gy };
    });
}

// main
// the global one, again
// fyi not the class one 
function simulate() {
    if (!scene.paused) {
        scene.fluid.simulate(
            scene.dt, scene.flip_ratio, scene.num_pressure_iters, scene.num_particle_iters,
            scene.over_relaxation, scene.compensate_drift, scene.seperate_particles,
            scene.obstacle_x, scene.obstacle_y, scene.obstacle_radius, scene.obstacle_sides,
            scene.obstacle_vel_x, scene.obstacle_vel_y, scene.obstacle_angle
        );
    }
    scene.frame_nr++
}
// render loop, to well render - in a loop
// hi its 1 am, help

// if the user types something in the text box, this holds their raw text.
// active_ramp is that text PADDED with leading spaces so empty/low-density cells
// still render blank instead of filling the background with a character
var custom_ramp = "";
var active_ramp = "";
// oil gets its own characters (and renders yellow). leading space keeps blanks blank
var oil_ramp = "  .:oO0@";

function update() {
    // ease the live radius so changing size is smoother
    scene.obstacle_radius = scene.obstacle_radius * 0.8 + scene.target_radius * 0.2;

    // --- rock physics ---
    if (!scene.grabbed && !scene.paused) {
        // g toggle OFF = rock is pinned where you placed it (original behaviour).
        // g toggle ON  = rock falls under gravity (tilt if device motion is live)
        if (scene.rock_gravity) {
            // which way is down right now
            var gx = 0, gy = gravity;
            if (window.gravity_vector) {
                gx = window.gravity_vector.x;
                gy = window.gravity_vector.y;
            }
            // rock falls slower than the fluid: ~60% of gravity (was too fast)
            var rock_dt = scene.dt * 4.0;
            scene.obstacle_vel_x += gx * 0.6 * rock_dt;
            scene.obstacle_vel_y += gy * 0.6 * rock_dt;

            // when device motion is active, jitter the rock a bit so shaking the
            // phone also rattles the rock around, not just the water
            if (window.gravity_vector) {
                scene.obstacle_vel_x += (Math.random() - 0.5) * 0.4;
                scene.obstacle_vel_y += (Math.random() - 0.5) * 0.4;
            }

            // a touch of drag so it doesn't accelerate forever
            scene.obstacle_vel_x *= 0.99;
            scene.obstacle_vel_y *= 0.99;
            scene.obstacle_x += scene.obstacle_vel_x * rock_dt;
            scene.obstacle_y += scene.obstacle_vel_y * rock_dt;

            // bounce off the tank walls (a little)
            var R = scene.obstacle_radius;
            var lo_x = R, hi_x = sim_width - R;
            var lo_y = R, hi_y = sim_height - R;
            if (scene.obstacle_x < lo_x) { scene.obstacle_x = lo_x; scene.obstacle_vel_x = -scene.obstacle_vel_x * scene.restitution; }
            if (scene.obstacle_x > hi_x) { scene.obstacle_x = hi_x; scene.obstacle_vel_x = -scene.obstacle_vel_x * scene.restitution; }
            if (scene.obstacle_y < lo_y) { scene.obstacle_y = lo_y; scene.obstacle_vel_y = -scene.obstacle_vel_y * scene.restitution; }
            if (scene.obstacle_y > hi_y) { scene.obstacle_y = hi_y; scene.obstacle_vel_y = -scene.obstacle_vel_y * scene.restitution; }

            // how fast is it moving overall
            var speed = Math.sqrt(scene.obstacle_vel_x * scene.obstacle_vel_x + scene.obstacle_vel_y * scene.obstacle_vel_y);
            if (speed > 0.15) {
                // moving fast -> tumble like a rolling rock
                scene.obstacle_spin = scene.obstacle_vel_x * 0.04;
                scene.obstacle_angle += scene.obstacle_spin;
            } else {
                // slow / settled -> ease toward resting on a FLAT side (not a corner).
                // base rest angle puts an edge flat at the bottom; snap to the nearest
                // one of those orientations so it tips onto whichever side is closest.
                var step = Math.PI * 2 / scene.obstacle_sides;
                var base = -Math.PI / 2 - 0.5 * step; // flat edge pointing straight down
                var rest = Math.round((scene.obstacle_angle - base) / step) * step + base;
                scene.obstacle_angle += (rest - scene.obstacle_angle) * 0.1;
                scene.obstacle_spin = 0;
            }
        }
        // if gravity toggle is OFF: do nothing, rock stays pinned where you left it
    }

    simulate();

    // sky rain: while R is held, sprinkle water in from the top at random x
    if (raining && !scene.paused) {
        for (var dropi = 0; dropi < 3; dropi++) {
            var rx = (0.05 + Math.random() * 0.9) * sim_width;
            var ry = sim_height * (0.92 + Math.random() * 0.05);
            f.spawn_at(rx, ry, 2, 0); // type 0 = water
        }
    }

    let to_render = "";
    var oil_open = false; // are we currently inside a yellow <span>?
    for (let i = f.f_num_y - cell_crop_y; i > cell_crop_y; i--) {
        let row = "";
        for (let j = cell_crop_x; j < f.f_num_x - cell_crop_x; j++) {
            const idx = j * f.f_num_y + i;
            const cell_color = f.cell_color[3 * idx];
            const is_oil = f.oil_grid[idx];
            let ramp;
            if (is_oil) {
                ramp = oil_ramp;
            } else if (active_ramp.length > 0) {
                // user text, already padded with spaces so empty cells stay blank
                ramp = active_ramp;
            } else {
                const charset = render_chars[Math.floor((i + j + 1) % render_chars.length)];
                ramp = charset.slice().sort((a, b) => a[1] - b[1]).map(([c]) => c).join("");
            }
            var ch = ramp[Math.min(Math.floor(cell_color * ramp.length), ramp.length - 1)];

            // oil renders YELLOW. wrap runs of oil in a colored span (and close it
            // again when we leave oil) so we don't spam a span per character
            if (is_oil && !oil_open) { row += "<span class='oil'>"; oil_open = true; }
            if (!is_oil && oil_open) { row += "</span>"; oil_open = false; }
            // escape the few chars that would break html
            if (ch === "<") ch = "&lt;";
            else if (ch === ">") ch = "&gt;";
            else if (ch === "&") ch = "&amp;";
            row += ch;
        }
        if (oil_open) { row += "</span>"; oil_open = false; } // close at end of row
        to_render += row + "\n";
    }
    render_el.innerHTML = to_render;
    requestAnimationFrame(update);
}

setup_scene();
// drop the rock in the middle of the tank, sitting still.
// it'll start falling as soon as the sim runs (unless you grab it)
var center_x = ((cell_crop_x + (f.f_num_x - cell_crop_x))/2)* f.h;
var center_y = ((cell_crop_y + (f.f_num_y - cell_crop_y)) / 2) * f.h;
scene.obstacle_x = center_x;
scene.obstacle_y = center_y;
scene.obstacle_vel_x = 0;
scene.obstacle_vel_y = 0;
update();