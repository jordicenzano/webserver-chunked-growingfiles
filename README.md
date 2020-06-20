# webserver-chunked-growingfiles

Very simple http server to that uses chunked transfer for growing files.

![Block diagram](./img/chunkWebserver.png "Block diagram for serving a growing file with an open chunked transfer")


The system responsible for creating the growing files needs to create a "ghost" file (flag) just before creating the growing file, that ghost file is a simple empty file in the same directory with the name of the real growing file prefixed by some known string (See `GHOST_PREFIX` in the code`).

This webserver detects that ghost file and starts a chunked transfer for those files **keeping the connection open and transfering the file data as soon as it is added to the file**, until that ghost file is removed. So when that file is completed then the system that created it should remove that "ghost" file.

Using this technique **we can transfer any big file (video file for instance) without waiting to have all the file data. Doing that we can reduce dramatically the latency** between the system that creates to file and the receiver. Ideally to almost zero.

Other advantages of this approach is that since it is based on HTTP1.1+ (chunked transfer) we can rely on CDNs for caching the content and we can also take advantage of all HTTP features.

# Usage
1- Install dependencies `npm install`
2- Use `./index.js -h`
```
Usage: index [options]

  Webserver that forces chunked transfer for growing files


  Options:

    -V, --version             output the version number
    -d, --directory [value]>  Base directory of your site [.]
    -p, --port [n]            Listen port [8080]
    -a, --address [value]     Bind address [0.0.0.0]
    -H, --headers [value]     Headers definition json file [./config/headers.json]
    -c, --cors [value]        CORS definition file [./config/cors.json]
    -f, --fallback [value]    Fallback directory [./config/public]
    -h, --help                output usage information
```

All params are optional
