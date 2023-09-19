const Utils = require("./Utils");

class StringBuilder {
    
    constructor(ini = null) {
        this.arr = new Array();
        this.len = 0;
		this.str = null;
        if(ini != null) this.append(ini);
    }
    toString() {
        if(this.arr != null) {
            this.str = this.arr.join("");
            this.arr = null;
        }
        return this.str;
    }
    get length() {
        return this.len;
    }
    set length(value) {
        if(value < this.len) {
            this.str = this.toString().substring(0, value);
            this.len = value;
        }
        return this.len;
    }
    append(val) {
        if(val == null) return this;
        let s = String(val); 
        if(this.str != null) {
            this.arr = new Array();
            this.arr.push(this.str);
            this.str = null;
        }
        this.arr.push(s);
        this.len += s.length;
        return this;
    }
    insert(ind, val) {
        if(ind >= this.len) {
            this.append(val);
            return this;
        }
        if(val == null) return this;
        let s = String(val); 

        let ss = this.toString();
        this.arr = new Array();
        if(ind == 0) {
            this.arr.push(s); 
            this.arr.push(ss);
        }
        else {
            this.arr.push(ss.substring(0, ind));
            this.arr.push(s); 
            this.arr.push(ss.substring(ind));
        }
        this.str = null;
        this.len += s.length;
        return this;
    }
    remove(ind, cou) {
        let ss = this.toString();
        this.arr = new Array();
        if(ind > 0) this.arr.push(ss.substring(0, ind));
        if(ind + cou < this.len) this.arr.push(ss.substring(ind + cou));
        this.len -= cou;
        this.str = null;
        return this;
    }
    replace(oldStr, newStr) {
        let ss = this.toString();
        this.str = Utils.replaceString(ss, oldStr, newStr);
        return this;
    }

    charAt(ind) {
        let s = this.toString();
        if(ind < s.length) return s[ind];
        return null;
    }
    setCharAt(ind, char) {
        let ss = this.toString();
        this.arr = new Array();
        if(ind == 0) {
            this.arr.push(char); 
            if(ss.length > 1)
                this.arr.push(ss.substring(1));
        }
        else {
            this.arr.push(ss.substring(0, ind));
            this.arr.push(char); 
            if(ind + 1 < ss.length)
                this.arr.push(ss.substring(ind + 1));
        }
        this.str = null;        
    }
}
module.exports = StringBuilder