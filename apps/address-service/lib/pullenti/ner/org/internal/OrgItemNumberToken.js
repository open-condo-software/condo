/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const Token = require("./../../Token");
const MetaToken = require("./../../MetaToken");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const NumberHelper = require("./../../core/NumberHelper");

class OrgItemNumberToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.number = null;
    }
    
    toString() {
        return ("№ " + ((this.number != null ? this.number : "?")));
    }
    
    static tryAttach(t, canBePureNumber = false, typ = null) {
        if (t === null) 
            return null;
        let tt = Utils.as(t, TextToken);
        if (tt !== null) {
            let t1 = MiscHelper.checkNumberPrefix(tt);
            if ((t1 instanceof NumberToken) && !t1.isNewlineBefore) {
                let res = OrgItemNumberToken._new1831(tt, t1, t1.value.toString());
                if (t1.next !== null && t1.next.isCharOf("\\/") && (t1.next.next instanceof NumberToken)) {
                    if (typ !== null && ((typ.typ === "офис" || typ.typ === "банк" || typ.typ === "отделение"))) {
                        res.endToken = res.endToken.next.next;
                        res.number = (res.number + "/" + res.endToken.value);
                    }
                }
                return res;
            }
        }
        if ((t.isHiphen && (t.next instanceof NumberToken) && !t.isWhitespaceBefore) && !t.isWhitespaceAfter) {
            if (NumberHelper.tryParseAge(t.next) === null) 
                return OrgItemNumberToken._new1831(t, t.next, t.next.value.toString());
        }
        if (t instanceof NumberToken) {
            if ((!t.isWhitespaceBefore && t.previous !== null && t.previous.isHiphen)) 
                return OrgItemNumberToken._new1831(t, t, t.value.toString());
            if (typ !== null && typ.typ !== null && (((typ.typ === "войсковая часть" || typ.typ === "військова частина" || typ.typ.includes("колония")) || typ.typ.includes("колонія") || typ.typ.includes("школа")))) {
                if (t.lengthChar >= 4 || t.lengthChar <= 6) {
                    let res = OrgItemNumberToken._new1831(t, t, t.value.toString());
                    if (t.next !== null && ((t.next.isHiphen || t.next.isCharOf("\\/"))) && !t.next.isWhitespaceAfter) {
                        if ((t.next.next instanceof NumberToken) && ((t.lengthChar + t.next.next.lengthChar) < 9)) {
                            res.endToken = t.next.next;
                            res.number = (res.number + "-" + res.endToken.value);
                        }
                        else if ((t.next.next instanceof TextToken) && t.next.next.lengthChar === 1 && t.next.next.chars.isLetter) {
                            res.endToken = t.next.next;
                            res.number = (res.number + res.endToken.term);
                        }
                    }
                    else if (((t.next instanceof TextToken) && t.next.lengthChar === 1 && t.next.chars.isLetter) && !t.isWhitespaceAfter) {
                        res.endToken = t.next;
                        res.number = (res.number + res.endToken.term);
                    }
                    return res;
                }
            }
        }
        if (((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && ((!t.isWhitespaceAfter || (((t.whitespacesAfterCount < 2) && t.chars.isAllUpper))))) {
            if (typ !== null && typ.typ !== null && (((typ.typ === "войсковая часть" || typ.typ === "військова частина" || typ.typ.includes("колония")) || typ.typ.includes("колонія")))) {
                let tt1 = t.next;
                if (tt1 !== null && tt1.isHiphen) 
                    tt1 = tt1.next;
                if (tt1 instanceof NumberToken) {
                    let res = new OrgItemNumberToken(t, tt1);
                    res.number = (t.term + tt1.value);
                    return res;
                }
            }
        }
        return null;
    }
    
    static _new1831(_arg1, _arg2, _arg3) {
        let res = new OrgItemNumberToken(_arg1, _arg2);
        res.number = _arg3;
        return res;
    }
}


module.exports = OrgItemNumberToken