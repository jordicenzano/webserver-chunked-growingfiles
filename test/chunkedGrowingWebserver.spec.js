const assert = require('chai').assert;
const fs =require('fs');
const path =require('path');
const uuidv4 = require('uuid/v4');
const http = require('http');
const crypto = require('crypto');

const underTest = require('../chunkedGrowingWebserver.js');

const moduleDir = __dirname;
const TEST_PORT_BASE = 8080;

describe('webserver', function() {

    const uuid = uuidv4();
    const base_path = moduleDir; //Test dir
    const data_path = path.join(base_path, 'data');
    const leve1_dir = 'level1';

    //Create dir
    function createDir(dir) {
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }

    //Clean data directory
    function removeFiles(dir) {
        fs.readdir(dir, function (err, files) {
            if (!err) {
                for (let i = 0, len = files.length; i < len; i++) {
                    let match = files[i].match(/.*\.ts|.*\.m3u8/);
                    if(match !== null)
                        fs.unlinkSync(path.join(dir, match[0]));
                }
            }
        });
    }

    //Create dir

    before(function() {
        createDir(data_path);
        createDir(path.join(data_path, leve1_dir));

        removeFiles(path.join(data_path, leve1_dir));
        removeFiles(data_path)
    });

    describe('read m3u8', function () {

        it('Should read all text file', function (done) {
            const test_port = TEST_PORT_BASE + 1;
            const filename = uuid + '_test_text.m3u8';
            const local_input_m3u8_filepath = path.join(data_path, filename);
            const input_m3u8_filepath = filename;
            const contents_m3u8 = '#TEST TEXT';

            //Crete test file
            fs.writeFileSync(local_input_m3u8_filepath, contents_m3u8);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_m3u8_filepath, function (res) {
                let data = [];

                // A chunk of data has been recieved.
                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function () {
                    assert.equal(res.statusCode, 200);

                    let result = Buffer.concat(data);
                    assert.equal(result, contents_m3u8);
                    final();
                });

                //Error
                res.on('error', function (err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final() {
                    webServer.stop(function () {
                        done();
                    });
                }
            });
        });

        it('Should read all text file from localhost (127.0.0.1)', function (done) {
            const test_port = TEST_PORT_BASE + 1;
            const bind_addr = '127.0.0.1';
            const filename = uuid + '_test_text.m3u8';
            const local_input_m3u8_filepath = path.join(data_path, filename);
            const input_m3u8_filepath = filename;
            const contents_m3u8 = '#TEST TEXT';

            //Crete test file
            fs.writeFileSync(local_input_m3u8_filepath, contents_m3u8);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, bind_addr);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_m3u8_filepath, function (res) {
                let data = [];

                // A chunk of data has been recieved.
                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function () {
                    assert.equal(res.statusCode, 200);

                    let result = Buffer.concat(data);
                    assert.equal(result, contents_m3u8);
                    final();
                });

                //Error
                res.on('error', function (err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final() {
                    webServer.stop(function () {
                        done();
                    });
                }
            });
        });

        it('Should read all text file with correct headers', function (done) {
            const test_port = TEST_PORT_BASE + 2;
            const filename = uuid + '_test_text_headers.m3u8';
            const local_input_m3u8_filepath = path.join(data_path, filename);
            const input_m3u8_filepath = filename;
            const contents_m3u8 = '#TEST1 text headers';
            const headers_m3u8 = {
                ".m3u8": {
                    "cache-control": "max-age=2",
                    "content-type": "application/x-mpegURL"
                }
            };
            const headers_CORS = {
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET, HEAD, OPTIONS",
                "access-control-allow-headers": "Content-Type"
            };

            //Crete test file
            fs.writeFileSync(local_input_m3u8_filepath, contents_m3u8);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, null, headers_m3u8, headers_CORS);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_m3u8_filepath, function (res) {
                let data = [];

                // A chunk of data has been recieved.
                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function () {
                    assert.equal(res.statusCode, 200);
                    assert.include(res.headers, headers_CORS);
                    assert.include(res.headers, headers_m3u8[".m3u8"]);

                    let result = Buffer.concat(data);
                    assert.equal(result, contents_m3u8);

                    final();
                });

                //Error
                res.on('error', function (err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final() {
                    webServer.stop(function () {
                        done();
                    });
                }
            });
        });

        it('Should read all text file in a dir', function (done) {
            let test_port = TEST_PORT_BASE + 3;
            const filename = uuid + '_test_text_level1.m3u8';
            const local_input_m3u8_filepath = path.join(data_path, leve1_dir, filename);
            const input_m3u8_filepath =  path.join(leve1_dir, filename);
            let contents_m3u8 = '#TEST TEXT LEVEL1';

            //Crete test file
            fs.writeFileSync(local_input_m3u8_filepath, contents_m3u8);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_m3u8_filepath, function (res) {
                let data = [];

                // A chunk of data has been received.
                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function () {
                    assert.equal(res.statusCode, 200);

                    let result = Buffer.concat(data);
                    assert.equal(result, contents_m3u8);
                    final();
                });

                //Error
                res.on('error', function (err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final() {
                    webServer.stop(function () {
                        done();
                    });
                }
            });
        });
    });

    describe('Read ts', function () {

        it('Should read all binary file', function (done) {
            const test_port = TEST_PORT_BASE + 4;
            const filename = uuid + '_test_static.ts';
            const local_input_ts_filepath = path.join(data_path, filename);
            const input_ts_filepath = filename;
            const contents_ts = crypto.randomBytes(100 * 1024);  //100KB
            const headers_ts = {
                ".ts": {
                    "cache-control": "max-age=3600",
                    "content-type": "video/MP2T",
                }
            };

            //Crete test file
            fs.writeFileSync(local_input_ts_filepath, contents_ts);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, null, headers_ts);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_ts_filepath, function(res) {
                let data = [];

                // A chunk of data has been received.
                res.on('data', function(chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function() {
                    assert.equal(res.statusCode, 200);
                    assert.include(res.headers, headers_ts[".ts"]);

                    let result = Buffer.concat(data);
                    assert.equal(Buffer.compare(contents_ts,result), 0);

                    final();
                });

                //Error
                res.on('error', function(err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final(){
                    webServer.stop(function() {
                        done();
                    });
                }
            });
        });

        it('Should read all binary file in a dir', function (done) {
            const test_port = TEST_PORT_BASE + 5;
            const filename = uuid + '_test_static_dir.ts';
            const local_input_ts_filepath = path.join(data_path, leve1_dir, filename);
            const input_ts_filepath =  path.join(leve1_dir, filename);
            const contents_ts = crypto.randomBytes(100 * 1024);  //100KB
            const headers_ts = {
                ".ts": {
                    "cache-control": "max-age=3600",
                    "content-type": "video/MP2T",
                }
            };

            //Crete test file
            fs.writeFileSync(local_input_ts_filepath, contents_ts);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, null, headers_ts);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_ts_filepath, function(res) {
                let data = [];

                // A chunk of data has been received.
                res.on('data', function(chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function() {
                    assert.equal(res.statusCode, 200);
                    assert.include(res.headers, headers_ts[".ts"]);

                    let result = Buffer.concat(data);
                    assert.equal(Buffer.compare(contents_ts,result), 0);

                    final();
                });

                //Error
                res.on('error', function(err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final(){
                    webServer.stop(function() {
                        done();
                    });
                }
            });
        });

        it('Should read all binary file while it is growing', function (done) {
            const test_port = TEST_PORT_BASE + 6;
            const filename = uuid + '_test_static_grow.ts';
            const local_input_ts_filepath = path.join(data_path, filename);
            const local_input_ts_filepath_ghost = path.join(data_path, underTest.GHOST_PREFIX + filename);
            const input_ts_filepath = filename;
            const contents_ts = crypto.randomBytes(1024); //Start 1KB
            let total_increments = 100; //100 KB file
            const headers_ts = {
                ".ts": {
                    "cache-control": "max-age=3600",
                    "content-type": "video/MP2T",
                    "transfer-encoding": "chunked"
                }
            };

            //Crete test file & GHOST
            fs.writeFileSync(local_input_ts_filepath_ghost, "");
            fs.writeFileSync(local_input_ts_filepath, contents_ts);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, null, headers_ts);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_ts_filepath, function(res) {
                let data = [];

                // A chunk of data has been received.
                res.on('data', function(chunk) {
                    data.push(chunk);

                    if (total_increments <= 0) {
                        //Remove ghost
                        fs.unlinkSync(local_input_ts_filepath_ghost);
                    }
                    else {
                        //Append another chunk
                        fs.appendFileSync(local_input_ts_filepath, chunk);

                        total_increments--;
                    }
                });

                // The whole response has been received. Print out the result.
                res.on('end', function() {
                    assert.equal(total_increments, 0);
                    assert.equal(res.statusCode, 200);
                    assert.include(res.headers, headers_ts[".ts"]);

                    const file_contents_ts = fs.readFileSync(local_input_ts_filepath);

                    let result = Buffer.concat(data);
                    assert.equal(Buffer.compare(file_contents_ts, result), 0);

                    final();
                });

                //Error
                res.on('error', function(err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final(){
                    webServer.stop(function() {
                        done();
                    });
                }
            });
        });
    });

    describe('read doc from fallback dir', function () {

        const fallback_dir = path.join(data_path, "fallback");

        before(function() {
            createDir(fallback_dir);
            removeFiles(fallback_dir)
        });

        it('Should read all text file', function (done) {
            const test_port = TEST_PORT_BASE + 7;
            const filename = uuid + '_falback_file.txt';
            const local_input_txt_fallback_filepath = path.join(fallback_dir, filename);
            const input_txt_filepath = filename;
            const contents_txt = 'TEST fallback';

            //Crete test file
            fs.writeFileSync(local_input_txt_fallback_filepath, contents_txt);

            const webServer = new underTest.chunkedGrowingWebserver(data_path, test_port, null, null, null, fallback_dir);

            webServer.start();

            http.get("http://localhost:" + test_port + "/" + input_txt_filepath, function (res) {
                let data = [];

                // A chunk of data has been recieved.
                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                // The whole response has been received. Print out the result.
                res.on('end', function () {
                    assert.equal(res.statusCode, 200);

                    let result = Buffer.concat(data);
                    assert.equal(result, contents_txt);
                    final();
                });

                //Error
                res.on('error', function (err) {
                    assert.fail("HTTP error: " + err);
                    final();
                });

                function final() {
                    webServer.stop(function () {
                        done();
                    });
                }
            });
        });
    });
});
