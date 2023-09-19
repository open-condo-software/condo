/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const TextToken = require("./../../TextToken");

class MeasureHelper {
    
    static tryParseDouble(val, f) {
        f.value = 0;
        if (Utils.isNullOrEmpty(val)) 
            return false;
        let inoutres1594 = Utils.tryParseFloat(Utils.replaceString(val, ',', '.'), f);
        if (val.indexOf(',') >= 0 && inoutres1594) 
            return true;
        let inoutres1593 = Utils.tryParseFloat(val, f);
        if (inoutres1593) 
            return true;
        return false;
    }
    
    static isMultChar(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return false;
        if (tt.lengthChar === 1) {
            if (tt.isCharOf("*xXхХ·×◦∙•") || tt.isChar(String.fromCharCode(0x387)) || tt.isChar(String.fromCharCode(0x22C5))) 
                return true;
        }
        return false;
    }
    
    static isMultCharEnd(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return false;
        let term = tt.term;
        if (term.endsWith("X") || term.endsWith("Х")) 
            return true;
        return false;
    }
}


module.exports = MeasureHelper