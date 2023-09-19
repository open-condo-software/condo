const { Worker, MessageChannel, receiveMessageOnPort } = require('worker_threads');

const timeOut = 10000;

class WebClient  {
    constructor() {
    }
    downloadData(address) {
	    return this.uploadData(address, null);
	}

    uploadData(address, postData) {
        const { port1: localPort, port2: workerPort } = new MessageChannel();
        const shared = new SharedArrayBuffer(4);
		var met = postData ? 'POST' : 'get';
        const workerData = { shared, port: workerPort, url: address, method: met, postData: postData };

        const worker = new Worker('./pullenti/unisharp/ReqWorker.js', { workerData, transferList: [workerPort] });
        try {
            const int32 = new Int32Array(shared);
            const resultWait = Atomics.wait(int32, 0, 0, timeOut);

            //console.debug('Atomics.wait result',resultWait);
            const message = receiveMessageOnPort(localPort);

            return message ? message.message : null
        } finally {
            worker.unref();
        }
    }
}

module.exports = WebClient
