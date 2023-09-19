class Stream {

    constructor() {
        this.pos = 0;
        this.len = 0;
    }

    get length() {
        return this.len;
    }
    setLength(value) {
        this.len = value;
        if(this.pos > this.len) this.pos = this.len;
    }

    get position() {
        return this.pos;
    }
    set position(value) {
        this.pos = value;
        return value;
    }

    seek(p, dir) {
		if(dir == 0) return this.pos = p;
		if(dir == 1) return this.pos = this.pos + p;
        return this.pos = this.len + p;
    }

	canSeek() {
	    return true;
	}
	canRead() {
	    return true;
	}
	canWrite() {
	    return true;
	}

    close() {
    }
    dispose() {
        this.close();
    }

    flush() {
    }

    readByte() {
        let buf = new Uint8Array(1);
        let i = this.read(buf, 0, 1);
        if(i <= 0) return -1;
        return buf[0];
    }

    read(buf, off, len) {
        return -1;
    }

    writeByte(b) {
        let buf = new Uint8Array(1);
        buf[0] = b;
        this.write(buf, 0, 1);
    }

    write(buf, off, len) {
    }
}

module.exports = Stream