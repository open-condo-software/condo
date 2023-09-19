const fs = require('fs');
const FileStream = require("./FileStream");
const MemoryStream = require("./MemoryStream");
const zlib = require('zlib');


class Utils {  

    static notNull(val, altval) {
        if(val != null) return val;
        return altval;
    }
	static as(obj, clas) {
		if(obj == null) return null;
		if(obj instanceof clas) return obj;
		return null;
	}
	static asString(obj) {
		if(obj == null) return null;
		if(typeof obj == 'string' || obj instanceof String) return obj;
		return null;
	}
	static asNumber(obj) {
		if(obj == null) return null;
		if(typeof obj == 'number' || obj instanceof Number) return obj;
		return null;
	}
	static asBoolean(obj) {
		if(obj == null) return null;
		if(typeof obj == 'boolean' || obj instanceof Boolean) return obj;
		return null;
	}
	static asArray(obj) {
		if(obj == null) return null;
		if(typeof obj == 'array' || obj instanceof Array) return obj;
		return null;
	}

    static removeItem(arr, item) {
        arr.splice(arr.indexOf(item), 1);
    }

    static isNullOrEmpty(s) {
        if(s == null) return true;
        return s.length == 0;
    }
    static isNullOrWhiteSpace(s) {
        if(s == null) return true;
        if(s.length == 0) return true;
        for(let i = s.length - 1; i >=0; i--)
            if(!this.isWhitespace(s[i])) return false;
		return true;
    }

    static isLowerCase(ch) {
        return ch == ch.toLowerCase() && ch != ch.toUpperCase();
    }    
    static isUpperCase(ch) {
        return ch != ch.toLowerCase() && ch == ch.toUpperCase();
    }    
    static isDigit(ch) {
        let cod = ch.charCodeAt(0);
        return cod >= 0x30 && cod <= 0x39;
    }    
    static isLetter(ch) {
        return ch != ch.toLowerCase() || ch != ch.toUpperCase();
    }
    static isLetterOrDigit(ch) {
        let cod = ch.charCodeAt(0);
        if(cod >= 0x30 && cod <= 0x39) return true;
        return ch != ch.toLowerCase() || ch != ch.toUpperCase();
    }

    static isWhitespace(ch) {
        let cod = ch.charCodeAt(0);
        return this.wsChars.indexOf(cod) >= 0;
    }
    static isPunctuation(ch) {
        let cod = ch.charCodeAt(0);
        return this.ptChars.indexOf(cod) >= 0;
    }

    static trimStartString(str) {
        for(let i = 0; i < str.length; i++)
            if(!this.isWhitespace(str[i])) {
                if(i == 0) return str;
                return str.substring(i);
            }
        return "";
    }
    static trimEndString(str) {
        for(let i = str.length - 1; i >=0; i--)
            if(!this.isWhitespace(str[i])) {
                if(i == str.length - 1) return str;
                return str.substring(0, i + 1);
            }
        return "";
    }

    static splitString(s, sep, ignoreEmpty = False) {
        if(s == null || sep == null) return null;
        let res = [];
        let i0 = 0, i = 0;
        for(; i < s.length; i++) {
            let ch = s[i];
            if(sep.indexOf(ch) < 0) continue;
            if(i > i0) 
                res.push(s.substring(i0, i));
            else
                if(!ignoreEmpty && i > 0) res.push("");
            i0 = i + 1;
        }
        if(i > i0)
            res.push(s.substring(i0, i));
        return res;
    }

    static replaceString(str, oldsubst, newsubst) {
        return str.replace(new RegExp(oldsubst.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newsubst);
    }

    static compareStrings(s1, s2, nocase = false) {
        if(nocase) {
            s1 = s1.toUpperCase(); s2 = s2.toUpperCase();
        }
        if(s1 == s2) return 0;
        if(s1 < s2) return -1;
        return 1;
    }

    static startsWithString(str, sub, nocase = false) {
    	if(str.length < sub.length) return false;
        if(!nocase) return str.startsWith(sub);
        if(str.length < sub.length) return false;
        let start = str.substring(0, sub.length);
        return Utils.compareStrings(start, sub, true) == 0;
    }

    static endsWithString(str, sub, nocase = false) {
    	if(str.length < sub.length) return false;
        if(!nocase) return str.endsWith(sub);
        if(str.length < sub.length) return false;
        let end = str.substring(str.length - sub.length);
        return Utils.compareStrings(end, sub, true) == 0;
    }

    static indexOfAny(str, chars, pos, cou) {
    	for(let i = pos; i < str.length; i++) {
	        if(cou > 0 && i - pos > cou) break;
    		let ch = str[i];
    		for(let j = 0; j < chars.length; j++)
    			if(chars[j] == ch) return i;
    	}
    	return -1;
    }

    static encodeString(encode, str, pos = 0, len = -1) {
        if(len < 0) len = str.length - pos;
        if(encode.toUpperCase() == "UTF-8")
            return Utils.encodeStringUtf8(str, pos, len);
        throw new Error("Encoding " + encode + " not supported");
    }
    static decodeString(encode, dat, pos = 0, len = -1) {
        if(len < 0) len = dat.length - pos;
        if(encode.toUpperCase() == "UTF-8")
            return Utils.decodeStringUtf8(dat, pos, len);
        throw new Error("Encoding " + encode + " not supported");
    }
    static getEncodingPreamble(encode = "utf-8") {
        if(encode.toUpperCase() == "UTF-8")
            return [0xEF, 0xBB, 0xBF];
        return [];
    }
    static getCharsetByName(name) {
	    name = name.toUpperCase();
        if(name == "UTF-16") name = "UTF-16LE";
        else if(name == "UNICODEFFFE") name = "UTF-16BE";
        else if(name == "US-ASCII") name = "ASCII";
		return name;
    }

    static encodeStringUtf8(str, pos, len) {
        var utf8 = [];
        for (var i=pos; i < pos + len; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 
                          0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12), 
                          0x80 | ((charcode>>6) & 0x3f), 
                          0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                          | (str.charCodeAt(i) & 0x3ff));
                utf8.push(0xf0 | (charcode >>18), 
                          0x80 | ((charcode>>12) & 0x3f), 
                          0x80 | ((charcode>>6) & 0x3f), 
                          0x80 | (charcode & 0x3f));
            }
        }
        return utf8;
    }    
    static decodeStringUtf8(strBytes, pos, len) {
        var MAX_SIZE = 0x4000;
        var codeUnits = [];
        var highSurrogate;
        var lowSurrogate;
        if(len > 3 && strBytes[pos] == 0xEF && strBytes[pos + 1] == 0xBB && strBytes[pos + 2] == 0xBF) { 
            pos += 3; len -= 3;
        }
        var index = pos - 1;
            var result = '';
    
        while (++index < pos + len) {
            var codePoint = Number(strBytes[index]);
    
            if (codePoint === (codePoint & 0x7F)) {
    
            } else if (0xF0 === (codePoint & 0xF0)) {
                codePoint ^= 0xF0;
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
            } else if (0xE0 === (codePoint & 0xE0)) {
                codePoint ^= 0xE0;
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
            } else if (0xC0 === (codePoint & 0xC0)) {
                codePoint ^= 0xC0;
                codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
            }
    
            if (!isFinite(codePoint) || codePoint < 0) // || codePoint > 0x10FFFF || Math.floor(codePoint) != codePoint)
                throw RangeError('Invalid code point: ' + codePoint);
    
            if (codePoint <= 0xFFFF)
                codeUnits.push(codePoint);
            else if (codePoint <= 0x10FFFF) {
                codePoint -= 0x10000;
                highSurrogate = (codePoint >> 10) | 0xD800;
                lowSurrogate = (codePoint % 0x400) | 0xDC00;
                codeUnits.push(highSurrogate, lowSurrogate);
            }
            if (index + 1 >= pos + len || codeUnits.length > MAX_SIZE) {
                result += String.fromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
            }
        }
        return result;
    }

    static daysInMonth(year, month) {
        switch (month) {
            case 2:
                return (((year & 3) == 0) && ((year % 100) != 0 || (year % 400) == 0) ? 29 : 28);
            case 4:
            case 6:
            case 9:
            case 11:
                return 30;
            default:
                return 31;
        }
    }

    static correctToString(str, wscount, leadzero) {
        if(str.length >= wscount) return str;
        for(let cou = wscount - str.length; cou > 0; cou--)
            if(leadzero) str = '0' + str; else str = ' ' + str;
        return str;
    }

    static compareUnsigned(n1, n2) {
        let res = 0;
        if(n1 < n2) res = -1;
        else if(n1 > n2) res = 1;
        if(n1 < 0 && n2 > 0) res = -res;
        if(n1 > 0 && n2 < 0) res = -res;
        return res;
    }

	static parseInt(str) {
        while(str.length > 1 && str[0] == '0') str = str.substring(1);
		return Number(str);
	}
    static tryParseInt(str, res) {
        if(str == null) return false;
        try {
            while(str.length > 1 && str[0] == '0') str = str.substring(1);
	        res.value = Number(str);
		    if(isNaN(res.value)) return false;
			res.value = Utils.mathTruncate(res.value);
			if(res.value.toString() == str)
			return true;
        }
        catch(e) {}
        return false;
    }
	static parseFloat(str) {
		return Number(str);
	}
    static tryParseFloat(str, res) {
        if(str == null) return false;
        try {
        res.value = Number(str);
        if(!isNaN(res.value)) return true;
        }
        catch(e) {}
        return false;
    }
    static mathTruncate(val) {
        if (val < 0) {
            return Math.ceil(val);
        } else {
            return Math.floor(val);
        }
    }
    static mathRound(val, prec) {
        for (let i = 0; i < prec; i++) {
            val *= 10;
        }
        val = Math.round(val);
        for (let i = 0; i < prec; i++) {
            val /= 10;
        }
        return val;
    }
    static intDiv(a, b) {
        var result = a/b;
        if (result >= 0)
            return Math.floor(result);
        else
            return Math.ceil(result);
    }

    static objectToBytes(obj, typ) {
        let si = 1;
        switch(typ) {
            case 'bool': Utils.m_DataView.setUint8(0, 1, true); si = 1; break;
            case 'sbyte': Utils.m_DataView.setInt8(0, obj, true); si = 1; break;
            case 'byte': Utils.m_DataView.setUint8(0, obj, true); si = 1; break;
            case 'short': Utils.m_DataView.setInt16(0, obj, true); si = 2; break;
            case 'ushort': Utils.m_DataView.setUint16(0, obj, true); si = 2; break;
            case 'int': Utils.m_DataView.setInt32(0, obj, true); si = 4; break;
            case 'uint': Utils.m_DataView.setUint32(0, obj, true); si = 4; break;
            case 'float': Utils.m_DataView.setFloat32(0, obj, true); si = 4; break;
            case 'double': Utils.m_DataView.setFloat64(0, obj, true); si = 8; break;
            // case 'long': {
            //     let hi = Math.floor(obj / 0x100000000);
            //     let lo = Math.floor(obj - (hi * 0x100000000));
            //     Utils.m_DataView.setUint32(0, lo, true); 
            //     Utils.m_DataView.setInt32(4, hi, true); 
            //     si = 8; break;
            // }
            // case 'ulong': {
            //     let hi = Math.floor(obj / 0x100000000);
            //     let lo = Math.floor(obj - (hi * 0x100000000));
            //     Utils.m_DataView.setUint32(0, lo, true); 
            //     Utils.m_DataView.setUint32(4, hi, true); 
            //     si = 8; break;
            // }
            case 'char': Utils.m_DataView.setUint16(0, obj.charCodeAt(0), true); si = 2; break;
            default: throw new Error("Bad object type");
        }
        let res = Array(si);
        for(let i = 0; i < si; i++) res[i] = Utils.m_DataView.getUint8(i);
        return res;
    }

    static bytesToObject(buf, pos, typ, si) {
        for(let i = 0; i < si; i++) Utils.m_DataView.setUint8(i, buf[pos + i]);
        switch(typ) {
            case 'short': return Utils.m_DataView.getInt16(0, true);
            case 'ushort': return Utils.m_DataView.getUint16(0, true);
            case 'int': return Utils.m_DataView.getInt32(0, true);
            case 'uint': return Utils.m_DataView.getUint32(0, true);
            // case 'long': {
            //     let lo = Utils.m_DataView.getUint32(0, true);
            //     let hi = Utils.m_DataView.getInt32(4, true);
            //     hi = parseFloat(hi);
            //     hi *= 0x100000000;
            //     return hi + lo;
            // }
            // case 'ulong': {
            //     let lo = Utils.m_DataView.getUint32(0, true);
            //     let hi = Utils.m_DataView.getUint32(4, true);
            //     hi = parseFloat(hi);
            //     hi *= 0x100000000;
            //     return hi + lo;
            // }
            case 'float': return Utils.m_DataView.getFloat32(0, true);
            case 'double': return Utils.m_DataView.getFloat64(0, true);
            case 'char': return String.fromCharCode(Utils.m_DataView.getUint16(0, true));
        }
        throw new Error("Bad object type");
    }

    static encodeBase64(buffer) {
        let buf = Buffer.from(buffer);
        return buf.toString("base64");
    }    
    static decodeBase64(base64) {
        let buff = Buffer.from(base64, 'base64');  
        var len = buff.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)
            bytes[i] = buff[i];
        return bytes;
    }    

    static readAllBytes(path) {
        let len = fs.statSync(path).size;
        let f = new FileStream(path, "r");
        let buf = new Uint8Array(len);
        f.read(buf, 0, len);
        f.close();
        return buf;
    }
    static writeAllBytes(path, buf) {
        let f = new FileStream(path, "w+");
        f.write(Buffer.from(buf), 0, buf.length);
        f.close();
    }
    static deleteDirectory(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index){
              var curPath = path + "/" + file;
              if (fs.lstatSync(curPath).isDirectory()) { // recurse
                Utils.deleteDirectory(curPath);
              } else { // delete file
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(path);
        }        
    }


    static gzipWrapper(stream, mode) {
        let len = stream.length;
        let buf = new Uint8Array(len);
        stream.read(buf, 0, len);
        let unzip;
        if(mode == 'r')
            unzip = zlib.gunzipSync(buf);
        else 
            unzip = zlib.gzipSync(buf);
        return new MemoryStream(unzip);
    }

    static deflateWrapper(stream, mode) {
        let len = stream.length;
        let buf = new Uint8Array(len);
        stream.read(buf, 0, len);
        let unzip;
        if(mode == 'r') unzip = zlib.inflateSync(buf);
        else unzip = zlib.deflateSync(buf);
        return new MemoryStream(unzip);
    }

    static compressDeflate(dat) {
        return zlib.deflateRawSync(dat);
    }
    static decompressDeflate(zip) {
        return zlib.inflateRawSync(zip);
    }
    static compressZlib(dat) {
        return zlib.deflateSync(dat);
    }
    static decompressZlib(zip) {
        return zlib.inflateSync(zip);
    }
    static compressGzip(dat) {
        return zlib.gzipSync(dat);
    }
    static decompressGzip(zip) {
        return zlib.gunzipSync(zip);
    }

    static readStream(s) {
        if (s.canSeek()) {
            if (s.length > (0)) {
                let res = new Uint8Array(s.length);
                s.read(res, 0, res.length);
                return res;
            }
        }
        let buf = new Uint8Array(10000);
        let mem = new MemoryStream();
        let k = 0;
        while (true) {
            let i = s.read(buf, 0, buf.length);
            if (i < 0) 
                break;
            if (i === 0) {
                if ((++k) > 3) 
                    break;
                continue;
            }
            mem.write(buf, 0, i);
            k = 0;
        }
        let arr = mem.toByteArray();
        mem.close();
        return arr;
    }    

	static getXmlAttrByName(arr, name) {
        for(let i = 0; i < arr.length; i++)
            if(arr[i].local_name == name || arr[i].name == name) return arr[i];
        return null;
	}

    static getDate(dat) {
        return new Date(dat.getFullYear(), dat.getMonth(), dat.getDate());
    }
	static getMonth(dat) {
	    return dat.getMonth() + 1;
	}
    static now() {
        return new Date(Date.now());
    }
    static addYears(dat, years) {
        return new Date(dat.getFullYear() + years, dat.getMonth(), dat.getDate(), dat.getHours(), dat.getMinutes(), dat.getSeconds());
    }
    static addMonths(dat, mon) {
        return new Date(dat.getFullYear(), dat.getMonth() + mon, dat.getDate(), dat.getHours(), dat.getMinutes(), dat.getSeconds());
    }
    static addDays(dat, days) {
        return new Date(dat.getFullYear(), dat.getMonth(), dat.getDate() + days, dat.getHours(), dat.getMinutes(), dat.getSeconds());
    }
    static addHours(dat, hs) {
        return new Date(dat.getFullYear(), dat.getMonth(), dat.getDate(), dat.getHours() + hs, dat.getMinutes(), dat.getSeconds());
    }
    static addMinutes(dat, mins) {
        return new Date(dat.getFullYear(), dat.getMonth(), dat.getDate(), dat.getHours(), dat.getMinutes() + mins, dat.getSeconds());
    }
    static addSeconds(dat, secs) {
        return new Date(dat.getFullYear(), dat.getMonth(), dat.getDate(), dat.getHours(), dat.getMinutes(), dat.getSeconds() + secs);
    }
    static createUUID() {
	    var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";
	    return s.join("");
	}
	static byteToHex(b) {
	   return Utils.correctToString((b).toString(16).toLowerCase(), 2, true);
	}
	static bytesToUUID(dat) {
		let tmp = "";
		let i = 0;
		for (i = 0; i < 4; i++) {
			tmp += Utils.byteToHex(dat[3 - i]);
		}
		tmp += "-";
		tmp += Utils.byteToHex(dat[5]);
		tmp += Utils.byteToHex(dat[4]);
		tmp += "-";
		tmp += Utils.byteToHex(dat[7]);
		tmp += Utils.byteToHex(dat[6]);
		tmp += "-";
		tmp += Utils.byteToHex(dat[8]);
		tmp += Utils.byteToHex(dat[9]);
		tmp += "-";
		for (i = 10; i < 16; i++) {
	        tmp += Utils.byteToHex(dat[i]);
		}
		return tmp;
	}

}

Utils.wsChars = [0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0x85, 0xA0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000];
Utils.ptChars = [0x21, 0x22, 0x23, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2C, 0x2D, 0x2E, 0x2F, 0x3A, 0x3B, 0x3F, 0x40, 0x5B, 0x5C, 0x5D, 0x5F, 0x7B, 0x7D, 0xA1, 0xAB, 0xAD, 0xB7, 0xBB, 0xBF, 0x37E, 0x387, 0x55A, 0x55B, 0x55C, 0x55D, 0x55E, 0x55F, 0x589, 0x58A, 0x5BE, 0x5C0, 0x5C3, 0x5C6, 0x5F3, 0x5F4, 0x609, 0x60A, 0x60C, 0x60D, 0x61B, 0x61E, 0x61F, 0x66A, 0x66B, 0x66C, 0x66D, 0x6D4, 0x700, 0x701, 0x702, 0x703, 0x704, 0x705, 0x706, 0x707, 0x708, 0x709, 0x70A, 0x70B, 0x70C, 0x70D, 0x7F7, 0x7F8, 0x7F9, 0x830, 0x831, 0x832, 0x833, 0x834, 0x835, 0x836, 0x837, 0x838, 0x839, 0x83A, 0x83B, 0x83C, 0x83D, 0x83E, 0x85E, 0x964, 0x965, 0x970, 0xAF0, 0xDF4, 0xE4F, 0xE5A, 0xE5B, 0xF04, 0xF05, 0xF06, 0xF07, 0xF08, 0xF09, 0xF0A, 0xF0B, 0xF0C, 0xF0D, 0xF0E, 0xF0F, 0xF10, 0xF11, 0xF12, 0xF14, 0xF3A, 0xF3B, 0xF3C, 0xF3D, 0xF85, 0xFD0, 0xFD1, 0xFD2, 0xFD3, 0xFD4, 0xFD9, 0xFDA, 0x104A, 0x104B, 0x104C, 0x104D, 0x104E, 0x104F, 0x10FB, 0x1360, 0x1361, 0x1362, 0x1363, 0x1364, 0x1365, 0x1366, 0x1367, 0x1368, 0x1400, 0x166D, 0x166E, 0x169B, 0x169C, 0x16EB, 0x16EC, 0x16ED, 0x1735, 0x1736, 0x17D4, 0x17D5, 0x17D6, 0x17D8, 0x17D9, 0x17DA, 0x1800, 0x1801, 0x1802, 0x1803, 0x1804, 0x1805, 0x1806, 0x1807, 0x1808, 0x1809, 0x180A, 0x1944, 0x1945, 0x1A1E, 0x1A1F, 0x1AA0, 0x1AA1, 0x1AA2, 0x1AA3, 0x1AA4, 0x1AA5, 0x1AA6, 0x1AA8, 0x1AA9, 0x1AAA, 0x1AAB, 0x1AAC, 0x1AAD, 0x1B5A, 0x1B5B, 0x1B5C, 0x1B5D, 0x1B5E, 0x1B5F, 0x1B60, 0x1BFC, 0x1BFD, 0x1BFE, 0x1BFF, 0x1C3B, 0x1C3C, 0x1C3D, 0x1C3E, 0x1C3F, 0x1C7E, 0x1C7F, 0x1CC0, 0x1CC1, 0x1CC2, 0x1CC3, 0x1CC4, 0x1CC5, 0x1CC6, 0x1CC7, 0x1CD3, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2016, 0x2017, 0x2018, 0x2019, 0x201A, 0x201B, 0x201C, 0x201D, 0x201E, 0x201F, 0x2020, 0x2021, 0x2022, 0x2023, 0x2024, 0x2025, 0x2026, 0x2027, 0x2030, 0x2031, 0x2032, 0x2033, 0x2034, 0x2035, 0x2036, 0x2037, 0x2038, 0x2039, 0x203A, 0x203B, 0x203C, 0x203D, 0x203E, 0x203F, 0x2040, 0x2041, 0x2042, 0x2043, 0x2045, 0x2046, 0x2047, 0x2048, 0x2049, 0x204A, 0x204B, 0x204C, 0x204D, 0x204E, 0x204F, 0x2050, 0x2051, 0x2053, 0x2054, 0x2055, 0x2056, 0x2057, 0x2058, 0x2059, 0x205A, 0x205B, 0x205C, 0x205D, 0x205E, 0x207D, 0x207E, 0x208D, 0x208E, 0x2308, 0x2309, 0x230A, 0x230B, 0x2329, 0x232A, 0x2768, 0x2769, 0x276A, 0x276B, 0x276C, 0x276D, 0x276E, 0x276F, 0x2770, 0x2771, 0x2772, 0x2773, 0x2774, 0x2775, 0x27C5, 0x27C6, 0x27E6, 0x27E7, 0x27E8, 0x27E9, 0x27EA, 0x27EB, 0x27EC, 0x27ED, 0x27EE, 0x27EF, 0x2983, 0x2984, 0x2985, 0x2986, 0x2987, 0x2988, 0x2989, 0x298A, 0x298B, 0x298C, 0x298D, 0x298E, 0x298F, 0x2990, 0x2991, 0x2992, 0x2993, 0x2994, 0x2995, 0x2996, 0x2997, 0x2998, 0x29D8, 0x29D9, 0x29DA, 0x29DB, 0x29FC, 0x29FD, 0x2CF9, 0x2CFA, 0x2CFB, 0x2CFC, 0x2CFE, 0x2CFF, 0x2D70, 0x2E00, 0x2E01, 0x2E02, 0x2E03, 0x2E04, 0x2E05, 0x2E06, 0x2E07, 0x2E08, 0x2E09, 0x2E0A, 0x2E0B, 0x2E0C, 0x2E0D, 0x2E0E, 0x2E0F, 0x2E10, 0x2E11, 0x2E12, 0x2E13, 0x2E14, 0x2E15, 0x2E16, 0x2E17, 0x2E18, 0x2E19, 0x2E1A, 0x2E1B, 0x2E1C, 0x2E1D, 0x2E1E, 0x2E1F, 0x2E20, 0x2E21, 0x2E22, 0x2E23, 0x2E24, 0x2E25, 0x2E26, 0x2E27, 0x2E28, 0x2E29, 0x2E2A, 0x2E2B, 0x2E2C, 0x2E2D, 0x2E2E, 0x2E30, 0x2E31, 0x2E32, 0x2E33, 0x2E34, 0x2E35, 0x2E36, 0x2E37, 0x2E38, 0x2E39, 0x2E3A, 0x2E3B, 0x2E3C, 0x2E3D, 0x2E3E, 0x2E3F, 0x2E40, 0x2E41, 0x2E42, 0x3001, 0x3002, 0x3003, 0x3008, 0x3009, 0x300A, 0x300B, 0x300C, 0x300D, 0x300E, 0x300F, 0x3010, 0x3011, 0x3014, 0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0x301A, 0x301B, 0x301C, 0x301D, 0x301E, 0x301F, 0x3030, 0x303D, 0x30A0, 0x30FB, 0xA4FE, 0xA4FF, 0xA60D, 0xA60E, 0xA60F, 0xA673, 0xA67E, 0xA6F2, 0xA6F3, 0xA6F4, 0xA6F5, 0xA6F6, 0xA6F7, 0xA874, 0xA875, 0xA876, 0xA877, 0xA8CE, 0xA8CF, 0xA8F8, 0xA8F9, 0xA8FA, 0xA8FC, 0xA92E, 0xA92F, 0xA95F, 0xA9C1, 0xA9C2, 0xA9C3, 0xA9C4, 0xA9C5, 0xA9C6, 0xA9C7, 0xA9C8, 0xA9C9, 0xA9CA, 0xA9CB, 0xA9CC, 0xA9CD, 0xA9DE, 0xA9DF, 0xAA5C, 0xAA5D, 0xAA5E, 0xAA5F, 0xAADE, 0xAADF, 0xAAF0, 0xAAF1, 0xABEB, 0xFD3E, 0xFD3F, 0xFE10, 0xFE11, 0xFE12, 0xFE13, 0xFE14, 0xFE15, 0xFE16, 0xFE17, 0xFE18, 0xFE19, 0xFE30, 0xFE31, 0xFE32, 0xFE33, 0xFE34, 0xFE35, 0xFE36, 0xFE37, 0xFE38, 0xFE39, 0xFE3A, 0xFE3B, 0xFE3C, 0xFE3D, 0xFE3E, 0xFE3F, 0xFE40, 0xFE41, 0xFE42, 0xFE43, 0xFE44, 0xFE45, 0xFE46, 0xFE47, 0xFE48, 0xFE49, 0xFE4A, 0xFE4B, 0xFE4C, 0xFE4D, 0xFE4E, 0xFE4F, 0xFE50, 0xFE51, 0xFE52, 0xFE54, 0xFE55, 0xFE56, 0xFE57, 0xFE58, 0xFE59, 0xFE5A, 0xFE5B, 0xFE5C, 0xFE5D, 0xFE5E, 0xFE5F, 0xFE60, 0xFE61, 0xFE63, 0xFE68, 0xFE6A, 0xFE6B, 0xFF01, 0xFF02, 0xFF03, 0xFF05, 0xFF06, 0xFF07, 0xFF08, 0xFF09, 0xFF0A, 0xFF0C, 0xFF0D, 0xFF0E, 0xFF0F, 0xFF1A, 0xFF1B, 0xFF1F, 0xFF20, 0xFF3B, 0xFF3C, 0xFF3D, 0xFF3F, 0xFF5B, 0xFF5D, 0xFF5F, 0xFF60, 0xFF61, 0xFF62, 0xFF63, 0xFF64, 0xFF65];
Utils.m_ArrBuf = new ArrayBuffer(8);
Utils.m_DataView = new DataView(Utils.m_ArrBuf);
Utils.MAX_DATE = new Date(8640000000000000);
Utils.MIN_DATE = new Date(-8640000000000000);

module.exports = Utils;
