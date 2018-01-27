#!/usr/bin/env node

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const readGrowingFileStream = require('./readGrowingFileStream.js');

"use strict";

const GHOST_PREFIX = ".growing_";

// Webserver
class chunkedGrowingWebserver {

    constructor(base_path, port, host, headers_by_ext, cors_default, public_fallback_dir) {
        this.base_path = base_path;
        this.port = port;
        this.host = null;
        this.headers_by_ext = null;
        this.cors_default = null;
        this.public_fallback = null;

        this.server = null;
        this.endCallback = null;

        if ((typeof (host) === 'string') && (host != null)) {
            this.host = host;

            console.log("Set bind host addr: " + host);
        }

        if ((typeof (headers_by_ext) === 'object') && (headers_by_ext != null)) {
            this.headers_by_ext = headers_by_ext;

            console.log("Loaded HEADERS: " + JSON.stringify(this.headers_by_ext));
        }

        if ((typeof (cors_default) === 'object') && (cors_default != null)) {
            this.cors_default = cors_default;

            console.log("Loaded CORS: " + JSON.stringify(this.cors_default));
        }

        if ((typeof (public_fallback_dir) === 'string') && (public_fallback_dir != null)) {
            if (fs.existsSync(public_fallback_dir)) {
                this.public_fallback = public_fallback_dir;

                console.log("Set fallback dir to: " + public_fallback_dir);
            }
        }
    }

    start() {
        if (this.server != null)
            return;

        const that = this;

        //Create simple static webserver
        this.server = http.createServer(function (req, res) {

            //Create a UUID per session
            let uuid = uuidv4();

            //Get file path name
            const filepath_name = that._cleanUrlPath(url.parse(req.url).pathname);

            //Find file in base dir
            let local_path_filename = path.resolve(that.base_path, filepath_name);
            if (!fs.existsSync(local_path_filename)) {
                //Find in config/public (default)
                if (that.public_fallback != null) {
                    local_path_filename = path.resolve(that.public_fallback, filepath_name);
                    if (!fs.existsSync(local_path_filename))
                        local_path_filename = null;
                }
            }

            if (local_path_filename === null) {
                console.log(uuid + "-404: " + filepath_name + ". Not found: " + local_path_filename);
                that._sendError(uuid, filepath_name, res, 404, 'Page Was Not Found');
            }
            else {
                console.log(uuid + "-(" + filepath_name + ") Local: " + local_path_filename);

                //Create ghost file path
                let local_path_filename_ghost = path.join(path.dirname(local_path_filename), GHOST_PREFIX + path.basename(local_path_filename));

                let readFileStream = null;
                let writtenData = 0;

                if (!fs.existsSync(local_path_filename_ghost)) {
                    //Use regular file reader
                    console.log(uuid + "-(" + filepath_name + ") Regular read detected");
                    readFileStream = new fs.createReadStream(local_path_filename);
                }
                else {
                    //Use growing file reader
                    console.log(uuid + "-(" + filepath_name + ") Growing file read detected");
                    readFileStream = new readGrowingFileStream.readGrowingFileStream(local_path_filename, local_path_filename_ghost);
                }

                let headers = that._getHeaderBasedOnFileType(that.headers_by_ext, that.cors_default, path.extname(filepath_name).toLocaleLowerCase());

                res.writeHead(200, headers);

                readFileStream.on("data", function(data) {
                    res.write(data);

                    writtenData = writtenData + data.length;

                    console.log(uuid + "-(" + filepath_name + ") Write length: " + writtenData.toString());
                });

                readFileStream.on("error", function(err) {
                    console.log(uuid + "-(" + filepath_name + ") Error: " + err);
                    res.end();
                });

                readFileStream.on("end", function() {
                    console.log(uuid + "-(" + filepath_name + ") Write closed! Written length: " + writtenData.toString());
                    res.end();
                });
            }
        });

        if (this.host != null)
            this.server.listen(this.port, this.host);
        else
            this.server.listen(this.port);

        this.server.that = this;

        console.log("Server listening on port: " + this.port.toString());
    }

    stop(callback) {
        if (this.server != null) {
            this.endCallback = callback;

            this.server.close(this._endClose);
        }
        else {
            callback();
        }
    }

    _endClose() {
        if (this.that.endCallback != null) {
            this.that.endCallback();
            this.that.endCallback = null;
        }

        this.that.server = null;
    }

    _sendError(uuid, filename, res, status, message) {
        console.log(uuid + "- 500: " + filename + ". Message:" + message);
        res.writeHead(status, {'Content-type':'text/plain'});
        res.write(message);
        res.end();
    }

    //Add response headers based on requested file extension
    _getHeaderBasedOnFileType (headers_by_ext, cors_default, extension) {
        let ret = {};

        if (headers_by_ext != null) {
            ret = headers_by_ext["default"];

            if (extension in headers_by_ext)
                ret = headers_by_ext[extension];
        }

        //Add CORS
        if (cors_default != null)
            ret = Object.assign(ret, cors_default);

        return ret;
    }

    _cleanUrlPath(path) {
        let ret = path;

        while ((ret.length > 0) && (ret[0] === '/'))
            ret = ret.substr(1);

        return ret;
    }
}

//Export class
module.exports.chunkedGrowingWebserver = chunkedGrowingWebserver;
module.exports.GHOST_PREFIX = GHOST_PREFIX;
