/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MetaToken = require("./../MetaToken");

// Токен - ячейка таблицы
class TableCellToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.colSpan = 1;
        this.rowSpan = 1;
        this.eoc = false;
    }
    
    get lines() {
        let res = new Array();
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            let t0 = t;
            let t1 = t;
            for (; t !== null && t.endChar <= this.endChar; t = t.next) {
                t1 = t;
                if (t.isNewlineAfter) {
                    if ((t.next !== null && t.next.endChar <= this.endChar && t.next.chars.isLetter) && t.next.chars.isAllLower && !t0.chars.isAllLower) 
                        continue;
                    break;
                }
            }
            res.push(new TableCellToken(t0, t1));
            t = t1;
        }
        return res;
    }
    
    static _new881(_arg1, _arg2, _arg3, _arg4) {
        let res = new TableCellToken(_arg1, _arg2);
        res.rowSpan = _arg3;
        res.colSpan = _arg4;
        return res;
    }
}


module.exports = TableCellToken