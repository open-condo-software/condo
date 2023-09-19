class Stopwatch
{
    constructor() {
        this.start0 = Date.now();
        this.end0 = null;
    }
    start() {
        this.end0 = null;
    }
    stop() {
        this.end0 = Date.now();
    }
    reset() {
        this.start0 = Date.now();
        this.end0 = null;
    }
    get isRunning() {
        return this.end0 == null;
    }
    get elapsedMilliseconds() {
        let e = this.end0;
        if(e == null) e = Date.now();
        let res = e - this.start0;
        return res;
    }
}
module.exports = Stopwatch
