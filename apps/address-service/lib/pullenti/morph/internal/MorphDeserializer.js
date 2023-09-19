/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

class MorphDeserializer {
    
    static deflateGzip(str, res) {
        let deflate = Utils.gzipWrapper(str, 'r'); 
        try {
            let buf = new Uint8Array(100000);
            let len = buf.length;
            while (true) {
                let i = -1;
                try {
                    for (let ii = 0; ii < len; ii++) {
                        buf[ii] = 0;
                    }
                    i = deflate.read(buf, 0, len);
                } catch (ex) {
                    for (i = len - 1; i >= 0; i--) {
                        if (buf[i] !== (0)) {
                            res.write(buf, 0, i + 1);
                            break;
                        }
                    }
                    break;
                }
                if (i < 1) 
                    break;
                res.write(buf, 0, i);
            }
        }
        finally {
            deflate.close();
        }
    }
}


module.exports = MorphDeserializer