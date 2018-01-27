#!/usr/bin/env node
const ws = require('./chunkedGrowingWebserver.js');
const program = require('commander');
const path = require('path');

"use strict";

//Defaults
const base_dir_default = __dirname;
const port_default = 8080;
const host_default = '0.0.0.0';
const headers_by_ext_default = path.join(base_dir_default, 'config', 'headers.json');
const cors_default = path.join(base_dir_default, 'config', 'cors.json');
const public_fallback_dir_default = path.join(base_dir_default, 'config', 'public');

//Data
let base_dir = base_dir_default;
let port = port_default;
let host = host_default;
let headers_by_ext = headers_by_ext_default;
let cors = cors_default;
let public_fallback_dir = public_fallback_dir_default;

program
    .version('1.1.0')
    .description('Webserver that forces chunked transfer for growing files')
    .option('-d, --directory [value]>', 'Base directory of your site [.]')
    .option('-p, --port [n]', 'Listen port [8080]', parseInt)
    .option('-a, --address [value]', 'Bind address [0.0.0.0]')
    .option('-H, --headers [value]', 'Headers definition json file [./config/headers.json]')
    .option('-c, --cors [value]', 'CORS definition file [./config/cors.json]')
    .option('-f, --fallback [value]', 'Fallback directory [./config/public]')
    .parse(process.argv);

if (program.directory)
    base_dir = program.directory;

if (program.port)
    port = program.port;

if (program.address)
    host = program.address;

if (program.headers)
    headers_by_ext = program.headers;

if (program.cors)
    cors = program.cors;

if (program.fallback)
    public_fallback_dir = program.fallback;

const webServer = new ws.chunkedGrowingWebserver(base_dir, port, host, headers_by_ext, cors_default, public_fallback_dir);

webServer.start();
