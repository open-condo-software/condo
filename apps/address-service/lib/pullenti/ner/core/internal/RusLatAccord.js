/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const LanguageHelper = require("./../../../morph/LanguageHelper");

class RusLatAccord {
    
    constructor(ru, la, brus = true, blat = true) {
        this.rus = null;
        this.lat = null;
        this.rusToLat = false;
        this.latToRus = false;
        this.onTail = false;
        this.rus = ru.toUpperCase();
        this.lat = la.toUpperCase();
        this.rusToLat = brus;
        this.latToRus = blat;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append("'").append(this.rus).append("'");
        if (this.rusToLat && this.latToRus) 
            tmp.append(" <-> ");
        else if (this.rusToLat) 
            tmp.append(" -> ");
        else if (this.latToRus) 
            tmp.append(" <- ");
        tmp.append("'").append(this.lat).append("'");
        return tmp.toString();
    }
    
    static getAccords() {
        if (RusLatAccord.m_Accords !== null) 
            return RusLatAccord.m_Accords;
        RusLatAccord.m_Accords = new Array();
        RusLatAccord.m_Accords.push(new RusLatAccord("а", "a"));
        RusLatAccord.m_Accords.push(new RusLatAccord("а", "aa"));
        RusLatAccord.m_Accords.push(new RusLatAccord("б", "b"));
        RusLatAccord.m_Accords.push(new RusLatAccord("в", "v"));
        RusLatAccord.m_Accords.push(new RusLatAccord("в", "w"));
        RusLatAccord.m_Accords.push(new RusLatAccord("г", "g"));
        RusLatAccord.m_Accords.push(new RusLatAccord("д", "d"));
        RusLatAccord.m_Accords.push(new RusLatAccord("е", "e"));
        RusLatAccord.m_Accords.push(new RusLatAccord("е", "yo"));
        RusLatAccord.m_Accords.push(new RusLatAccord("е", "io"));
        RusLatAccord.m_Accords.push(new RusLatAccord("е", "jo"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ж", "j"));
        RusLatAccord.m_Accords.push(new RusLatAccord("дж", "j"));
        RusLatAccord.m_Accords.push(new RusLatAccord("з", "z"));
        RusLatAccord.m_Accords.push(new RusLatAccord("и", "e"));
        RusLatAccord.m_Accords.push(new RusLatAccord("и", "i"));
        RusLatAccord.m_Accords.push(new RusLatAccord("и", "y"));
        RusLatAccord.m_Accords.push(new RusLatAccord("и", "ea"));
        RusLatAccord.m_Accords.push(new RusLatAccord("й", "i"));
        RusLatAccord.m_Accords.push(new RusLatAccord("й", "y"));
        RusLatAccord.m_Accords.push(new RusLatAccord("к", "c"));
        RusLatAccord.m_Accords.push(new RusLatAccord("к", "k"));
        RusLatAccord.m_Accords.push(new RusLatAccord("к", "ck"));
        RusLatAccord.m_Accords.push(new RusLatAccord("кс", "x"));
        RusLatAccord.m_Accords.push(new RusLatAccord("л", "l"));
        RusLatAccord.m_Accords.push(new RusLatAccord("м", "m"));
        RusLatAccord.m_Accords.push(new RusLatAccord("н", "n"));
        RusLatAccord.m_Accords.push(new RusLatAccord("о", "a"));
        RusLatAccord.m_Accords.push(new RusLatAccord("о", "o"));
        RusLatAccord.m_Accords.push(new RusLatAccord("о", "ow"));
        RusLatAccord.m_Accords.push(new RusLatAccord("о", "oh"));
        RusLatAccord.m_Accords.push(new RusLatAccord("п", "p"));
        RusLatAccord.m_Accords.push(new RusLatAccord("р", "r"));
        RusLatAccord.m_Accords.push(new RusLatAccord("с", "s"));
        RusLatAccord.m_Accords.push(new RusLatAccord("с", "c"));
        RusLatAccord.m_Accords.push(new RusLatAccord("т", "t"));
        RusLatAccord.m_Accords.push(new RusLatAccord("у", "u"));
        RusLatAccord.m_Accords.push(new RusLatAccord("у", "w"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ф", "f"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ф", "ph"));
        RusLatAccord.m_Accords.push(new RusLatAccord("х", "h"));
        RusLatAccord.m_Accords.push(new RusLatAccord("х", "kh"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ц", "ts"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ц", "c"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ч", "ch"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ш", "sh"));
        RusLatAccord.m_Accords.push(new RusLatAccord("щ", "shch"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ы", "i"));
        RusLatAccord.m_Accords.push(new RusLatAccord("э", "e"));
        RusLatAccord.m_Accords.push(new RusLatAccord("э", "a"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ю", "iu"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ю", "ju"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ю", "yu"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ю", "ew"));
        RusLatAccord.m_Accords.push(new RusLatAccord("я", "ia"));
        RusLatAccord.m_Accords.push(new RusLatAccord("я", "ja"));
        RusLatAccord.m_Accords.push(new RusLatAccord("я", "ya"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ъ", ""));
        RusLatAccord.m_Accords.push(new RusLatAccord("ь", ""));
        RusLatAccord.m_Accords.push(new RusLatAccord("", "gh"));
        RusLatAccord.m_Accords.push(new RusLatAccord("", "h"));
        RusLatAccord.m_Accords.push(RusLatAccord._new768("", "e", true));
        RusLatAccord.m_Accords.push(new RusLatAccord("еи", "ei"));
        RusLatAccord.m_Accords.push(new RusLatAccord("аи", "ai"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ай", "i"));
        RusLatAccord.m_Accords.push(new RusLatAccord("уи", "ui"));
        RusLatAccord.m_Accords.push(new RusLatAccord("уи", "w"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ои", "oi"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ей", "ei"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ей", "ey"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ай", "ai"));
        RusLatAccord.m_Accords.push(new RusLatAccord("ай", "ay"));
        RusLatAccord.m_Accords.push(new RusLatAccord(" ", " "));
        RusLatAccord.m_Accords.push(new RusLatAccord("-", "-"));
        return RusLatAccord.m_Accords;
    }
    
    static _isPref(str, i, pref) {
        if ((pref.length + i) > str.length) 
            return false;
        for (let j = 0; j < pref.length; j++) {
            if (pref[j] !== str[i + j]) 
                return false;
        }
        return true;
    }
    
    static _getVarsPref(_rus, ri, _lat, li) {
        let res = null;
        for (const a of RusLatAccord.getAccords()) {
            if (RusLatAccord._isPref(_rus, ri, a.rus) && RusLatAccord._isPref(_lat, li, a.lat) && a.rusToLat) {
                if (a.onTail) {
                    if ((ri + a.rus.length) < _rus.length) 
                        continue;
                    if ((li + a.lat.length) < _lat.length) 
                        continue;
                }
                if (res === null) 
                    res = new Array();
                res.push(a);
            }
        }
        return res;
    }
    
    static getVariants(rusOrLat) {
        let res = new Array();
        if (Utils.isNullOrEmpty(rusOrLat)) 
            return res;
        rusOrLat = rusOrLat.toUpperCase();
        let isRus = LanguageHelper.isCyrillicChar(rusOrLat[0]);
        let stack = new Array();
        let i = 0;
        for (i = 0; i < rusOrLat.length; i++) {
            let li = new Array();
            let maxlen = 0;
            for (const a of RusLatAccord.getAccords()) {
                let pref = null;
                if (isRus && a.rus.length > 0) 
                    pref = a.rus;
                else if (!isRus && a.lat.length > 0) 
                    pref = a.lat;
                else 
                    continue;
                if (pref.length < maxlen) 
                    continue;
                if (!RusLatAccord._isPref(rusOrLat, i, pref)) 
                    continue;
                if (a.onTail) {
                    if ((pref.length + i) < rusOrLat.length) 
                        continue;
                }
                if (pref.length > maxlen) {
                    maxlen = pref.length;
                    li.splice(0, li.length);
                }
                li.push(a);
            }
            if (li.length === 0 || maxlen === 0) 
                return res;
            stack.push(li);
            i += (maxlen - 1);
        }
        if (stack.length === 0) 
            return res;
        let ind = new Array();
        for (i = 0; i < stack.length; i++) {
            ind.push(0);
        }
        let tmp = new StringBuilder();
        while (true) {
            tmp.length = 0;
            for (i = 0; i < ind.length; i++) {
                let a = stack[i][ind[i]];
                tmp.append((isRus ? a.lat : a.rus));
            }
            let ok = true;
            if (!isRus) {
                for (i = 0; i < tmp.length; i++) {
                    if (tmp.charAt(i) === 'Й') {
                        if (i === 0) {
                            ok = false;
                            break;
                        }
                        if (!LanguageHelper.isCyrillicVowel(tmp.charAt(i - 1))) {
                            ok = false;
                            break;
                        }
                    }
                }
            }
            if (ok) 
                res.push(tmp.toString());
            for (i = ind.length - 1; i >= 0; i--) {
                if ((++ind[i]) < stack[i].length) 
                    break;
                else 
                    ind[i] = 0;
            }
            if (i < 0) 
                break;
        }
        return res;
    }
    
    static canBeEquals(_rus, _lat) {
        if (Utils.isNullOrEmpty(_rus) || Utils.isNullOrEmpty(_lat)) 
            return false;
        _rus = _rus.toUpperCase();
        _lat = _lat.toUpperCase();
        let vs = RusLatAccord._getVarsPref(_rus, 0, _lat, 0);
        if (vs === null) 
            return false;
        let stack = new Array();
        stack.push(vs);
        while (stack.length > 0) {
            if (stack.length === 0) 
                break;
            let ri = 0;
            let li = 0;
            for (const s of stack) {
                ri += s[0].rus.length;
                li += s[0].lat.length;
            }
            if (ri >= _rus.length && li >= _lat.length) 
                return true;
            vs = RusLatAccord._getVarsPref(_rus, ri, _lat, li);
            if (vs !== null) {
                stack.splice(0, 0, vs);
                continue;
            }
            while (stack.length > 0) {
                stack[0].splice(0, 1);
                if (stack[0].length > 0) 
                    break;
                stack.splice(0, 1);
            }
        }
        return false;
    }
    
    static findAccordsRusToLat(txt, pos, res) {
        if (pos >= txt.length) 
            return 0;
        let ch0 = txt[pos];
        let ok = false;
        if ((pos + 1) < txt.length) {
            let ch1 = txt[pos + 1];
            for (const a of RusLatAccord.getAccords()) {
                if ((a.rusToLat && a.rus.length === 2 && a.rus[0] === ch0) && a.rus[1] === ch1) {
                    res.push(a.lat);
                    ok = true;
                }
            }
            if (ok) 
                return 2;
        }
        for (const a of RusLatAccord.getAccords()) {
            if (a.rusToLat && a.rus.length === 1 && a.rus[0] === ch0) {
                res.push(a.lat);
                ok = true;
            }
        }
        if (ok) 
            return 1;
        return 0;
    }
    
    static findAccordsLatToRus(txt, pos, res) {
        if (pos >= txt.length) 
            return 0;
        let i = 0;
        let j = 0;
        let maxLen = 0;
        for (const a of RusLatAccord.getAccords()) {
            if (a.latToRus && a.lat.length >= maxLen) {
                for (i = 0; i < a.lat.length; i++) {
                    if ((pos + i) >= txt.length) 
                        break;
                    if (txt[pos + i] !== a.lat[i]) 
                        break;
                }
                if ((i < a.lat.length) || (a.lat.length < 1)) 
                    continue;
                if (a.lat.length > maxLen) {
                    res.splice(0, res.length);
                    maxLen = a.lat.length;
                }
                res.push(a.rus);
            }
        }
        return maxLen;
    }
    
    static _new768(_arg1, _arg2, _arg3) {
        let res = new RusLatAccord(_arg1, _arg2);
        res.onTail = _arg3;
        return res;
    }
    
    static static_constructor() {
        RusLatAccord.m_Accords = null;
    }
}


RusLatAccord.static_constructor();

module.exports = RusLatAccord