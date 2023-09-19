/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

class OrgTokenData {
    
    constructor(t) {
        this.tok = null;
        this.typ = null;
        this.typLow = null;
        this.tok = t;
        t.tag = this;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.tok.toString());
        if (this.typ !== null) 
            tmp.append(" \r\nTyp: ").append(this.typ.toString());
        if (this.typLow !== null) 
            tmp.append(" \r\nTypLow: ").append(this.typLow.toString());
        return tmp.toString();
    }
}


module.exports = OrgTokenData