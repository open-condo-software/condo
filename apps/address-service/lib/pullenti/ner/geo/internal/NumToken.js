/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const BracketHelper = require("./../../core/BracketHelper");
const UriReferent = require("./../../uri/UriReferent");
const ReferentToken = require("./../../ReferentToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const MetaToken = require("./../../MetaToken");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const GeoTokenType = require("./GeoTokenType");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const GeoReferent = require("./../GeoReferent");
const TerrItemToken = require("./TerrItemToken");
const NumberHelper = require("./../../core/NumberHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");

class NumToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.value = null;
        this.altValue = null;
        this.hasPrefix = false;
        this.hasSpecWord = false;
        this.isCadasterNumber = false;
        this.template = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.hasPrefix) 
            res.append("№ ");
        res.append(this.value);
        if (this.altValue !== null) 
            res.append(" / ").append(this.altValue);
        if (this.isCadasterNumber) 
            res.append(" cadaster");
        return res.toString();
    }
    
    static tryParse(t, typ) {
        if (t === null) 
            return null;
        if (t.isValue("ОТДЕЛЕНИЕ", null) && (t.whitespacesAfterCount < 3)) {
            let _next = NumToken.tryParse(t.next, typ);
            if (_next !== null) {
                _next.beginToken = t;
                _next.hasPrefix = true;
                _next.hasSpecWord = true;
                return _next;
            }
        }
        let tt = MiscHelper.checkNumberPrefix(t);
        if (tt === null && (t instanceof TextToken) && t.term.startsWith("КАД")) {
            let tt1 = t.next;
            if (tt1 !== null && tt1.isChar('.')) 
                tt1 = tt1.next;
            tt = MiscHelper.checkNumberPrefix(tt1);
            if (tt === null) 
                tt = tt1;
        }
        if (tt !== null) {
            let hasReest = false;
            for (let ttt = tt; ttt !== null; ttt = ttt.next) {
                if (((ttt.isCharOf(":") || ttt.isHiphen)) && (ttt.next instanceof NumberToken)) 
                    continue;
                if (hasReest) {
                    if (ttt.getReferent() instanceof GeoReferent) 
                        continue;
                }
                let ter = TerrItemToken.tryParse(ttt, null, null);
                if (ter !== null && ((ter.ontoItem !== null || ter.terminItem !== null))) {
                    ttt = ter.endToken;
                    continue;
                }
                let npt = NounPhraseHelper.tryParse(ttt, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
                if (npt !== null) {
                    if (npt.endToken.isValue("ЗАПИСЬ", null) || npt.endToken.isValue("РЕЕСТР", null)) {
                        ttt = npt.endToken;
                        hasReest = true;
                        continue;
                    }
                    break;
                }
                if (!(ttt instanceof NumberToken)) 
                    break;
                let res = NumToken._new1264(t, ttt, true, "n");
                res.value = ttt.value;
                res._correct(typ);
                return res;
            }
        }
        if (tt === null) 
            tt = t;
        if (tt instanceof NumberToken) {
            let res = NumToken._new1264(t, tt, tt !== t, "n");
            res.value = tt.value;
            res._correct(typ);
            return res;
        }
        if ((tt instanceof ReferentToken) && (tt.getReferent() instanceof UriReferent)) {
            let res = NumToken._new1266(t, tt, tt !== t);
            res.value = tt.getReferent().getStringValue("VALUE");
            let sh = tt.getReferent().getStringValue("SCHEME");
            if (sh === "КАДАСТР") 
                res.isCadasterNumber = true;
            return res;
        }
        if ((tt instanceof TextToken) && !t.isValue("C", null)) {
            let nt = NumberHelper.tryParseRoman(tt);
            if (nt !== null && nt.value !== "100") {
                let res = NumToken._new1264(t, nt.endToken, tt !== t, "l");
                res.value = nt.value;
                res._correct(typ);
                return res;
            }
        }
        if (BracketHelper.isBracket(t, true)) {
            let _next = NumToken.tryParse(t.next, typ);
            if (_next !== null) {
                if (_next.endToken.next !== null && BracketHelper.isBracket(_next.endToken.next, true)) {
                    _next.beginToken = t;
                    _next.endToken = _next.endToken.next;
                    return _next;
                }
            }
        }
        if (((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && t.chars.isAllUpper) {
        }
        return null;
    }
    
    _correct(typ) {
        let nt = Utils.as(this.endToken, NumberToken);
        if ((nt !== null && (nt.endToken instanceof TextToken) && nt.endToken.term === "Е") && nt.endToken.previous === nt.beginToken && !nt.endToken.isWhitespaceBefore) 
            this.value += "Е";
        let t = this.endToken.next;
        if (t === null || t.whitespacesBeforeCount > 1) 
            return;
        if (t.isValue("ОТДЕЛЕНИЕ", null)) {
            this.endToken = t;
            t = t.next;
            this.hasPrefix = true;
            this.hasSpecWord = true;
            if (t === null || t.whitespacesBeforeCount > 1) 
                return;
        }
        if (t.isValue2("ОЧЕРЕДЬ", "ОСВОЕНИЕ")) {
            this.endToken = t.next;
            t = t.next.next;
            this.hasPrefix = true;
            this.hasSpecWord = true;
            if (t === null || t.whitespacesBeforeCount > 1) 
                return;
        }
        if ((t.next !== null && t.next.isHiphen && t.next.next !== null) && t.next.next.isValue("Я", null)) {
            this.endToken = t.next.next;
            t = this.endToken.next;
            if (t === null || t.whitespacesBeforeCount > 1) 
                return;
        }
        if ((this.endToken instanceof NumberToken) && this.endToken.lengthChar === 2) {
            let tt = t;
            if (tt.isCharOf(".:") && tt.next !== null) 
                tt = tt.next;
            if (((tt instanceof NumberToken) && tt.typ === NumberSpellingType.DIGIT && tt.lengthChar === 2) && tt.next !== null) {
                let ttt = tt.next;
                if (ttt.isCharOf(".:") && ttt.next !== null) 
                    ttt = ttt.next;
                let isKv = false;
                for (let tt0 = this.beginToken.previous; tt0 !== null; tt0 = tt0.previous) {
                    if (tt0.isValue("КВАРТАЛ", null) || tt0.isValue("КВ", null)) {
                        isKv = true;
                        break;
                    }
                    else if (tt0.lengthChar > 1 || !(tt0 instanceof TextToken)) 
                        break;
                }
                if ((ttt instanceof NumberToken) && ((ttt.lengthChar === 6 || ttt.lengthChar === 7)) && ttt.typ === NumberSpellingType.DIGIT) {
                    this.value = (this.value + ":" + tt.getSourceText() + ":" + ttt.getSourceText());
                    this.endToken = ttt;
                    ttt = ttt.next;
                    this.isCadasterNumber = true;
                    if (ttt !== null && ttt.isCharOf(".:") && (ttt.next instanceof NumberToken)) {
                        this.value = (this.value + ":" + ttt.next.getSourceText());
                        this.endToken = ttt.next;
                    }
                }
                else if ((ttt instanceof NumberToken) && isKv) {
                    let tmp = new StringBuilder();
                    tmp.append(this.value).append(":").append(tt.getSourceText()).append(":").append(ttt.getSourceText());
                    let t1 = ttt;
                    for (ttt = ttt.next; ttt !== null; ttt = ttt.next) {
                        if (ttt instanceof NumberToken) {
                            tmp.append(ttt.getSourceText());
                            t1 = ttt;
                            continue;
                        }
                        if (ttt.isChar(':') && (ttt.next instanceof NumberToken)) {
                            tmp.append(":").append(ttt.next.getSourceText());
                            t1 = ttt.next;
                            break;
                        }
                        break;
                    }
                    if (tmp.length >= 7) {
                        this.value = tmp.toString();
                        this.endToken = t1;
                        this.isCadasterNumber = true;
                    }
                }
            }
        }
        if (this.isCadasterNumber) 
            return;
        for (t = this.endToken.next; t !== null; t = t.next) {
            let isDrob = false;
            let isHiph = false;
            let brAfter = false;
            if (t.isHiphen && !t.isWhitespaceAfter && t.next !== null) {
                isHiph = true;
                t = t.next;
            }
            else if (t.isCharOf("\\/") && !t.isWhitespaceAfter && t.next !== null) {
                isDrob = true;
                t = t.next;
            }
            else if (t.isValue("ДРОБЬ", null) && t.next !== null) {
                isDrob = true;
                t = t.next;
            }
            else if (BracketHelper.isBracket(t, false)) {
                if ((((t.next instanceof NumberToken) || (((t.next instanceof TextToken) && t.next.chars.isLetter && t.next.lengthChar === 1)))) && t.next.next !== null && BracketHelper.isBracket(t.next.next, false)) {
                    t = t.next;
                    brAfter = true;
                }
                else {
                    let lat0 = NumberHelper.tryParseRoman(t.next);
                    if (lat0 !== null && lat0.endToken.next !== null && lat0.endToken.next.isChar(')')) {
                        t = t.next;
                        brAfter = true;
                    }
                }
            }
            let templ0 = this.template[this.template.length - 1];
            if (t instanceof NumberToken) {
                let num = Utils.as(t, NumberToken);
                if (num.typ !== NumberSpellingType.DIGIT) 
                    break;
                if (isHiph && ((templ0 !== 'n' || typ === GeoTokenType.ORG))) {
                }
                else if (isDrob || brAfter) {
                }
                else if (!t.isWhitespaceBefore) {
                }
                else 
                    break;
                let val = num.value;
                if (!num.morph._class.isAdjective) 
                    val = num.getSourceText();
                this.value = (this.value + (isDrob || brAfter ? "/" : (templ0 === 'c' ? "" : "-")) + val);
                this.template += "n";
                if (brAfter) 
                    t = t.next;
                this.endToken = t;
                continue;
            }
            if (t instanceof TextToken) {
                nt = NumberHelper.tryParseRoman(t);
                if (nt !== null && nt.value !== "100") {
                    this.value = (this.value + (isDrob || brAfter ? '/' : '-') + nt.value);
                    this.template += "l";
                    t = nt.endToken;
                    if (brAfter) 
                        t = t.next;
                    this.endToken = t;
                    continue;
                }
            }
            if (((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && ((!t.isWhitespaceBefore || t.isNewlineAfter || ((t.next !== null && t.next.isComma))))) {
                if (templ0 === 'n') {
                }
                else if (templ0 === 'l' && ((isHiph || isDrob))) {
                }
                else 
                    break;
                let ch = LanguageHelper.getCyrForLat(t.term[0]);
                if ((ch.charCodeAt(0)) === 0) 
                    ch = t.term[0];
                this.value = (this.value + ch);
                this.template += "c";
                if (brAfter) 
                    t = t.next;
                this.endToken = t;
                continue;
            }
            break;
        }
    }
    
    static _correctChar(v) {
        if (v === 'A' || v === 'А') 
            return 'А';
        if (v === 'Б' || v === 'Г') 
            return v;
        if (v === 'B' || v === 'В') 
            return 'В';
        if (v === 'C' || v === 'С') 
            return 'С';
        if (v === 'D' || v === 'Д') 
            return 'Д';
        if (v === 'E' || v === 'Е') 
            return 'Е';
        if (v === 'H' || v === 'Н') 
            return 'Н';
        if (v === 'K' || v === 'К') 
            return 'К';
        return String.fromCharCode(0);
    }
    
    static _correctCharToken(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let v = tt.term;
        if (v.length === 1) {
            let corr = NumToken._correctChar(v[0]);
            if (corr !== (String.fromCharCode(0))) 
                return (corr);
            if (t.chars.isCyrillicLetter) 
                return v;
        }
        if (v.length === 2) {
            if (t.chars.isCyrillicLetter) 
                return v;
            let corr = NumToken._correctChar(v[0]);
            let corr2 = NumToken._correctChar(v[1]);
            if (corr !== (String.fromCharCode(0)) && corr2 !== (String.fromCharCode(0))) 
                return (corr + corr2);
        }
        return null;
    }
    
    static _new1264(_arg1, _arg2, _arg3, _arg4) {
        let res = new NumToken(_arg1, _arg2);
        res.hasPrefix = _arg3;
        res.template = _arg4;
        return res;
    }
    
    static _new1266(_arg1, _arg2, _arg3) {
        let res = new NumToken(_arg1, _arg2);
        res.hasPrefix = _arg3;
        return res;
    }
}


module.exports = NumToken