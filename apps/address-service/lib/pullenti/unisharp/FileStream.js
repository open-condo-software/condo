const fs = require('fs');
const Stream = require("./Stream");

class FileStream extends Stream 
{
    constructor(path, mode, append = false) {
        super();
        this.name = path;
        if(fs.existsSync(this.name) && fs.statSync(this.name).isFile())
            this.len = fs.statSync(this.name).size;
        this.fd = fs.openSync(path, mode);
        this.position = 0;
		if(append)
			this.position = this.length;
    }
    close() {
        fs.closeSync(this.fd);
    }
    setLength(value) {
        if(value == this.length) return;
        fs.ftruncateSync(this.fd, value);
        this.len = value;
        if(this.position > value)
            this.position = value;
    }
    read(buf, pos, len) {
        if(len > this.length - this.position)
            len = this.length - this.position;
        if(len <= 0) return len;
        len = fs.readSync(this.fd, buf, 0, len, this.position);
        this.position += len;
        return len;
    }
    write(buf, pos, len) {
        len = fs.writeSync(this.fd, Buffer.from(buf), 0, len, this.position);
        this.position += len;
        if(this.position > this.len) this.len = this.position;
    }

}
module.exports = FileStream
