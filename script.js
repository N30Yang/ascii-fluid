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

const target_long_side = 128 * 74;
const min_gird_size = 8;
const cell_crop_x = 1;
const cell_crop_y = 2;

const base = [
    ["~", 12198],
    [":", 6921],
    ["-", 5589],
    [".", 3267],
    [" ", 0],
    [" ", 0],
];

const render_chars = [
    [["N", 29420], ["N", 29420], ["n", 17950], ...base],
    [["E", 25880], ["E", 25880], ["e", 18840], ...base],
    [["O", 32973], ["O", 32973], ["o", 21645], ...base],
    [["X", 23150], ["X", 23150], ["x", 16420], ...base],
    [["Y", 19640], ["Y", 19640], ["y", 17110], ...base],
];

const canvase1 = document.getElementById("canvas");
const rendere1 = document.querySelector(".render");

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

const y_resolution = realheight / grid_size;
const x_resolution = realwidth / grid_size;
const resolution = y_resolution;

const gravity = 9.81;
const extrasized = 0;

canvase1.width = realwidth;
canvase1.height = realheight;
canvase1.style.width = realwidth + "px";
canvase1.style.height = realheight + "px";
rendere1.style.width = realwidth + "px";
rendere1.style.height = realheight + "px";
document.documentElement.style.setProperty(
    "--cell-size",
    grid_size + "px"
);

canvase1.focus();
var simHeight = 2.0;
var cscale = canvase1.height / simHeight;
var simwidth = canvase1.width / cscale;
var u_field = 0;
var v_field = 1;
var fluidcell = 0;
var aircell = 1;
var solidcell = 2;
var cnt = 0;

