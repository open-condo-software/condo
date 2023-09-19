/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const Token = require("./../../Token");
const NumberSpellingType = require("./../../NumberSpellingType");
const GetTextAttr = require("./../../core/GetTextAttr");
const OrgItemEponymTokenPersonItemType = require("./OrgItemEponymTokenPersonItemType");
const GeoReferent = require("./../../geo/GeoReferent");
const MetaToken = require("./../../MetaToken");
const TextToken = require("./../../TextToken");
const ReferentToken = require("./../../ReferentToken");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberHelper = require("./../../core/NumberHelper");

class OrgItemEponymToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.eponyms = new Array();
    }
    
    toString() {
        let res = new StringBuilder();
        res.append("имени");
        for (const e of this.eponyms) {
            res.append(" ").append(e);
        }
        return res.toString();
    }
    
    static tryAttach(t, mustHasPrefix = false) {
        const OrgItemNameToken = require("./OrgItemNameToken");
        let tt = Utils.as(t, TextToken);
        if (tt === null) {
            if (t === null) 
                return null;
            let r1 = t.getReferent();
            if (r1 !== null && r1.typeName === "DATE") {
                let str = r1.toString().toUpperCase();
                if ((str === "1 МАЯ" || str === "7 ОКТЯБРЯ" || str === "9 МАЯ") || str === "8 МАРТА") {
                    let dt = OrgItemEponymToken._new1801(t, t, new Array());
                    dt.eponyms.push(str);
                    return dt;
                }
            }
            let age = NumberHelper.tryParseAge(t);
            if ((age !== null && (((age.endToken.next instanceof TextToken) || (age.endToken.next instanceof ReferentToken))) && (age.whitespacesAfterCount < 3)) && !age.endToken.next.chars.isAllLower && age.endToken.next.chars.isCyrillicLetter) {
                let dt = OrgItemEponymToken._new1801(t, age.endToken.next, new Array());
                dt.eponyms.push((age.value + " " + dt.endToken.getSourceText().toUpperCase()));
                return dt;
            }
            return null;
        }
        let t1 = null;
        let full = false;
        let hasName = false;
        if (tt.term === "ИМЕНИ" || tt.term === "ІМЕНІ") {
            t1 = t.next;
            full = true;
            hasName = true;
        }
        else if (((tt.term === "ИМ" || tt.term === "ІМ")) && tt.next !== null) {
            if (tt.next.isChar('.')) {
                t1 = tt.next.next;
                full = true;
            }
            else if ((tt.next instanceof TextToken) && tt.chars.isAllLower && !tt.next.chars.isAllLower) 
                t1 = tt.next;
            hasName = true;
        }
        else if (tt.previous !== null && ((tt.previous.isValue("ФОНД", null) || tt.previous.isValue("ХРАМ", null) || tt.previous.isValue("ЦЕРКОВЬ", "ЦЕРКВА")))) {
            if ((!tt.chars.isCyrillicLetter || tt.morph._class.isPreposition || tt.morph._class.isConjunction) || !tt.chars.isLetter) 
                return null;
            if (tt.whitespacesBeforeCount !== 1) 
                return null;
            if (tt.chars.isAllLower) 
                return null;
            if (tt.morph._class.isAdjective) {
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.beginToken !== npt.endToken) 
                    return null;
            }
            let na = OrgItemNameToken.tryAttach(tt, null, false, true);
            if (na !== null) {
                if (na.isEmptyWord || na.isStdName || na.isStdTail) 
                    return null;
            }
            t1 = tt;
        }
        if (t1 === null || ((t1.isNewlineBefore && !full))) 
            return null;
        if (tt.previous !== null && tt.previous.morph._class.isPreposition) 
            return null;
        if (mustHasPrefix && !hasName) 
            return null;
        let r = t1.getReferent();
        if ((r !== null && r.typeName === "DATE" && full) && r.findSlot("DAY", null, true) !== null && r.findSlot("YEAR", null, true) === null) {
            let dt = OrgItemEponymToken._new1801(t, t1, new Array());
            dt.eponyms.push(r.toString().toUpperCase());
            return dt;
        }
        let holy = false;
        if ((t1.isValue("СВЯТОЙ", null) || t1.isValue("СВЯТИЙ", null) || t1.isValue("СВ", null)) || t1.isValue("СВЯТ", null)) {
            t1 = t1.next;
            holy = true;
            if (t1 !== null && t1.isChar('.')) 
                t1 = t1.next;
        }
        if (t1 === null) 
            return null;
        let cl = t1.getMorphClassInDictionary();
        if (cl.isNoun || cl.isAdjective) {
            let rt = t1.kit.processReferent("PERSON", t1, null);
            if (rt !== null && rt.referent.typeName === "PERSON" && rt.beginToken !== rt.endToken) {
                let e = rt.referent.getStringValue("LASTNAME");
                if (e !== null) {
                    if (rt.endToken.isValue(e, null)) {
                        let re = new OrgItemEponymToken(t, rt.endToken);
                        re.eponyms.push(rt.endToken.getSourceText());
                        return re;
                    }
                }
            }
        }
        let nt = NumberHelper.tryParseAnniversary(t1);
        if (nt !== null && nt.typ === NumberSpellingType.AGE) {
            let npt = NounPhraseHelper.tryParse(nt.endToken.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                let s = (nt.value + "-" + (t.kit.baseLanguage.isUa ? "РОКІВ" : "ЛЕТ") + " " + MiscHelper.getTextValue(npt.beginToken, npt.endToken, GetTextAttr.NO));
                let res = new OrgItemEponymToken(t, npt.endToken);
                res.eponyms.push(s);
                return res;
            }
        }
        let its = OrgItemEponymToken.PersonItemToken.tryAttach(t1);
        if (its === null) {
            if ((t1 instanceof ReferentToken) && (t1.getReferent() instanceof GeoReferent)) {
                let s = MiscHelper.getTextValue(t1, t1, GetTextAttr.NO);
                let re = new OrgItemEponymToken(t, t1);
                re.eponyms.push(s);
                return re;
            }
            return null;
        }
        let eponims = new Array();
        let i = 0;
        let j = 0;
        if (its[i].typ === OrgItemEponymTokenPersonItemType.LOCASEWORD) 
            i++;
        if (i >= its.length) 
            return null;
        if (!full) {
            if (its[i].beginToken.morph._class.isAdjective && !its[i].beginToken.morph._class.isProperSurname) 
                return null;
        }
        if (its[i].typ === OrgItemEponymTokenPersonItemType.INITIAL) {
            i++;
            while (true) {
                if ((i < its.length) && its[i].typ === OrgItemEponymTokenPersonItemType.INITIAL) 
                    i++;
                if (i >= its.length || ((its[i].typ !== OrgItemEponymTokenPersonItemType.SURNAME && its[i].typ !== OrgItemEponymTokenPersonItemType.NAME))) 
                    break;
                eponims.push(its[i].value);
                t1 = its[i].endToken;
                if ((i + 2) >= its.length || its[i + 1].typ !== OrgItemEponymTokenPersonItemType.AND || its[i + 2].typ !== OrgItemEponymTokenPersonItemType.INITIAL) 
                    break;
                i += 3;
            }
        }
        else if (((i + 1) < its.length) && its[i].typ === OrgItemEponymTokenPersonItemType.NAME && its[i + 1].typ === OrgItemEponymTokenPersonItemType.SURNAME) {
            eponims.push(its[i + 1].value);
            t1 = its[i + 1].endToken;
            i += 2;
            if ((((i + 2) < its.length) && its[i].typ === OrgItemEponymTokenPersonItemType.AND && its[i + 1].typ === OrgItemEponymTokenPersonItemType.NAME) && its[i + 2].typ === OrgItemEponymTokenPersonItemType.SURNAME) {
                eponims.push(its[i + 2].value);
                t1 = its[i + 2].endToken;
            }
        }
        else if (its[i].typ === OrgItemEponymTokenPersonItemType.SURNAME) {
            if (its.length === (i + 2) && its[i].chars.equals(its[i + 1].chars)) {
                its[i].value += (" " + its[i + 1].value);
                its[i].endToken = its[i + 1].endToken;
                its.splice(i + 1, 1);
            }
            eponims.push(its[i].value);
            if (((i + 1) < its.length) && its[i + 1].typ === OrgItemEponymTokenPersonItemType.NAME) {
                if ((i + 2) === its.length) 
                    i++;
                else if (its[i + 2].typ !== OrgItemEponymTokenPersonItemType.SURNAME) 
                    i++;
            }
            else if (((i + 1) < its.length) && its[i + 1].typ === OrgItemEponymTokenPersonItemType.INITIAL) {
                if ((i + 2) === its.length) 
                    i++;
                else if (its[i + 2].typ === OrgItemEponymTokenPersonItemType.INITIAL && (i + 3) === its.length) 
                    i += 2;
            }
            else if (((i + 2) < its.length) && its[i + 1].typ === OrgItemEponymTokenPersonItemType.AND && its[i + 2].typ === OrgItemEponymTokenPersonItemType.SURNAME) {
                let ok = true;
                let npt = NounPhraseHelper.tryParse(its[i + 2].beginToken, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && !npt.morph._case.isGenitive && !npt.morph._case.isUndefined) 
                    ok = false;
                if (ok) {
                    eponims.push(its[i + 2].value);
                    i += 2;
                }
            }
            t1 = its[i].endToken;
        }
        else if (its[i].typ === OrgItemEponymTokenPersonItemType.NAME && holy) {
            t1 = its[i].endToken;
            let sec = false;
            if (((i + 1) < its.length) && its[i].chars.equals(its[i + 1].chars) && its[i + 1].typ !== OrgItemEponymTokenPersonItemType.INITIAL) {
                sec = true;
                t1 = its[i + 1].endToken;
            }
            if (sec) 
                eponims.push(("СВЯТ." + its[i].value + " " + its[i + 1].value));
            else 
                eponims.push(("СВЯТ." + its[i].value));
        }
        else if (full && (i + 1) === its.length && ((its[i].typ === OrgItemEponymTokenPersonItemType.NAME || its[i].typ === OrgItemEponymTokenPersonItemType.SURNAME))) {
            t1 = its[i].endToken;
            eponims.push(its[i].value);
        }
        else if ((its[i].typ === OrgItemEponymTokenPersonItemType.NAME && its.length === 3 && its[i + 1].typ === OrgItemEponymTokenPersonItemType.NAME) && its[i + 2].typ === OrgItemEponymTokenPersonItemType.SURNAME) {
            t1 = its[i + 2].endToken;
            eponims.push((its[i].value + " " + its[i + 1].value + " " + its[i + 2].value));
            i += 2;
        }
        if (eponims.length === 0) 
            return null;
        return OrgItemEponymToken._new1801(t, t1, eponims);
    }
    
    static _new1801(_arg1, _arg2, _arg3) {
        let res = new OrgItemEponymToken(_arg1, _arg2);
        res.eponyms = _arg3;
        return res;
    }
}


OrgItemEponymToken.PersonItemToken = class  extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = OrgItemEponymTokenPersonItemType.SURNAME;
        this.value = null;
    }
    
    toString() {
        return (String(this.typ) + " " + ((this.value != null ? this.value : "")));
    }
    
    static tryAttach(t) {
        const OrgItemEponymTokenPersonItemType = require("./OrgItemEponymTokenPersonItemType");
        const TextToken = require("./../../TextToken");
        let res = new Array();
        for (; t !== null; t = t.next) {
            if (t.isNewlineBefore && res.length > 0) 
                break;
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            let s = tt.term;
            if (!Utils.isLetter(s[0])) 
                break;
            if (((s.length === 1 || s === "ДЖ")) && !tt.chars.isAllLower) {
                let t1 = t;
                if (t1.next !== null && t1.next.isChar('.')) 
                    t1 = t1.next;
                res.push(OrgItemEponymToken.PersonItemToken._new1805(t, t1, OrgItemEponymTokenPersonItemType.INITIAL, s));
                t = t1;
                continue;
            }
            if (tt.isAnd) {
                res.push(OrgItemEponymToken.PersonItemToken._new1806(t, t, OrgItemEponymTokenPersonItemType.AND));
                continue;
            }
            if (tt.morph._class.isPronoun || tt.morph._class.isPersonalPronoun) 
                break;
            if (tt.chars.isAllLower) {
                let mc = tt.getMorphClassInDictionary();
                if (mc.isPreposition || mc.isVerb || mc.isAdverb) 
                    break;
                let t1 = t;
                if (t1.next !== null && !t1.isWhitespaceAfter && t1.next.isChar('.')) 
                    t1 = t1.next;
                res.push(OrgItemEponymToken.PersonItemToken._new1805(t, t1, OrgItemEponymTokenPersonItemType.LOCASEWORD, s));
                t = t1;
                continue;
            }
            if (tt.morph._class.isProperName) 
                res.push(OrgItemEponymToken.PersonItemToken._new1805(t, t, OrgItemEponymTokenPersonItemType.NAME, s));
            else if ((t.next !== null && t.next.isHiphen && (t.next.next instanceof TextToken)) && !t.next.isWhitespaceAfter) {
                res.push(OrgItemEponymToken.PersonItemToken._new1805(t, t.next.next, OrgItemEponymTokenPersonItemType.SURNAME, (s + "-" + t.next.next.term)));
                t = t.next.next;
            }
            else 
                res.push(OrgItemEponymToken.PersonItemToken._new1805(t, t, OrgItemEponymTokenPersonItemType.SURNAME, s));
        }
        return (res.length > 0 ? res : null);
    }
    
    static _new1805(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemEponymToken.PersonItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new1806(_arg1, _arg2, _arg3) {
        let res = new OrgItemEponymToken.PersonItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
}


module.exports = OrgItemEponymToken