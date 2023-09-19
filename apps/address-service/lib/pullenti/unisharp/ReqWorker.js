const http = require("http");
const url_obj = require("url");
const {workerData} = require('worker_threads');

const reqHttp = async (url_string, method = "POST", postData = null) => {
    const url = url_obj.parse(url_string);
    const params = {
        method:method,
        host: url.hostname,
        port: url.port || (url.protocol=="https:" ? 443 : 80),
        path: url.path || "/",
        headers: {
            'Content-Length': postData ? Buffer.byteLength(postData) : 0,
            Expect: "100-continue",
            Connection: "Keep-Alive"
        }
    };
    return new Promise((resolve, reject) => {
        const req = http.request(params, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            const data = [];
            res.on("data", chunk => {
                data.push(chunk);
            });
            res.on("end", () => resolve(Buffer.concat(data)));
        });
        req.on("error", reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

const { shared, port, url, method, postData } = workerData;

reqHttp(url, method, postData)
    .then(res => {
        port.postMessage(res);
    })
    .catch(err => {
        console.log(err)
        //port.postMessage(err);
    })
    .finally(() => {
        const int32 = new Int32Array(shared);
        Atomics.notify(int32, 0);
    })
