#!/usr/bin/env node
const ws = require('./chunkedGrowingWebserver.js');

"use strict";

//Defaults
let base_dir_default = __dirname;
let port_default = 8088;

//Data
let base_dir = base_dir_default;
let port = port_default;
let headers_by_ext = null;
let cors_default = null;
let public_fallback_dir = null;

if (process.argv.length >= 3)
    base_dir = process.argv[2];

if (process.argv.length >= 4)
    port = Number.parseInt(process.argv[3]);

if (process.argv.length >= 5) {
    if (typeof (process.argv[4]) === 'string')
        headers_by_ext = JSON.parse(fs.readFileSync(process.argv[4]));
}

if (process.argv.length >= 6) {
    if (typeof (process.argv[5]) === 'string')
        cors_default = JSON.parse(fs.readFileSync(process.argv[5]));
}

if (process.argv.length >= 7) {
    if (typeof (process.argv[6]) === 'string')
        public_fallback_dir = process.argv;
}

const webServer = new ws.chunkedGrowingWebserver(base_dir, port, headers_by_ext, cors_default, public_fallback_dir);

webServer.start();
