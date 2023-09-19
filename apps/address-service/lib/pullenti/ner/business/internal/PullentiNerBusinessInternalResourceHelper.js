/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Stream = require("./../../../unisharp/Stream");

const PullentiNerBusinessPropertiesResources = require("./../properties/PullentiNerBusinessPropertiesResources");

/**
 * Это для поддержки получения встроенных ресурсов
 */
class PullentiNerBusinessInternalResourceHelper {
    
    /**
     * Получить встроенный ресурс
     * @param name имя, на который оканчивается ресурс
     * @return 
     */
    static getBytes(name) {
        
        let names = PullentiNerBusinessPropertiesResources.getNames();
        for (const n of names) {
            if (Utils.endsWithString(n, name, true)) {
                if (name.length < n.length) {
                    if (n[n.length - name.length - 1] !== '.') 
                        continue;
                }
                try {
                    let inf = PullentiNerBusinessPropertiesResources.getResourceInfo(n);
                    if (inf === null) 
                        continue;
                    let stream = PullentiNerBusinessPropertiesResources.getStream(n); 
                    try {
                        let buf = new Uint8Array(stream.length);
                        stream.read(buf, 0, buf.length);
                        return buf;
                    }
                    finally {
                        stream.close();
                    }
                } catch (ex) {
                }
            }
        }
        return null;
    }
    
    static getString(name) {
        let arr = PullentiNerBusinessInternalResourceHelper.getBytes(name);
        if (arr === null) 
            return null;
        if ((arr.length > 3 && arr[0] === (0xEF) && arr[1] === (0xBB)) && arr[2] === (0xBF)) 
            return Utils.decodeString("UTF-8", arr, 3, arr.length - 3);
        else 
            return Utils.decodeString("UTF-8", arr, 0, -1);
    }
}


module.exports = PullentiNerBusinessInternalResourceHelper