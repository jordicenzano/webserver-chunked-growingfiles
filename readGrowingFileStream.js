#!/usr/bin/env node

const fs = require('fs');
const stream = require('stream');
const Readable = stream.Readable;

"use strict";

//Custom stream reader
class readGrowingFileStream extends Readable {

    constructor(file_path, file_path_ghost, opt) {
        super(opt);

        this.file_path = file_path;
        this.file_path_ghost = file_path_ghost;
        this.hTimeout = null;
        this.hFile = null;
        this.file_pos = 0;
        this.options = {
            block_size: 10 * 1024, //Max growing = 10*1024 * (1 / 0.001) = 10MBbps
            delay_ms: 10
        };

        //Check if file exists
        if (!fs.existsSync(file_path))
            throw new Error("File "+ file_path + " does NOT exists!");

        this.buffer = new Buffer.alloc(this.options.block_size);
    }

    _readInterval(_this) {
        if (_this.hFile === null)
            _this.hFile = fs.openSync(_this.file_path, 'r');

        fs.read(_this.hFile , _this.buffer, 0, _this.options.block_size, _this.file_pos, function (err, bytesRead, buffer) {
            if (err) {
                process.nextTick(function (){
                    if (_this.hFile !== null) {
                        fs.closeSync(this.hFile);
                        _this.hFile = null;
                    }

                    _this.emit('error', err);
                });
            }
            else {
                if (bytesRead > 0) {
                    _this.file_pos = _this.file_pos + bytesRead;

                    //TODO: Do I need to copy?????
                    // Let's be in the safe side :-)
                    let dstBuff = new Buffer.alloc(bytesRead);
                    buffer.copy(dstBuff, 0, 0, bytesRead);

                    _this.push(dstBuff);
                }
                else {
                    //EOF
                    if (!fs.existsSync(_this.file_path_ghost)) {
                        //Check if stop growing
                        if (_this.hFile !== null) {
                            fs.closeSync(_this.hFile);
                            _this.hFile = null;
                        }
                        _this.push(null);
                    }
                    else {
                        //Is still growing
                        _this.hTimeout = setTimeout(_this._readInterval, _this.options.delay_ms, _this);
                    }
                }
            }
        });
    }

    _read() {
        this._readInterval(this);
    }
}

//Export class
module.exports.readGrowingFileStream = readGrowingFileStream;
