/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

class PersonTokenData {
    
    constructor(t) {
        this.tok = null;
        this.attr = null;
        this.tok = t;
        t.tag = this;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.tok.toString());
        if (this.attr !== null) 
            tmp.append(" \r\nAttr: ").append(this.attr.toString());
        return tmp.toString();
    }
}


module.exports = PersonTokenData