/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const BracketParseAttr = require("./../../core/BracketParseAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const GetTextAttr = require("./../../core/GetTextAttr");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberSpellingType = require("./../../NumberSpellingType");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const NumberParseAttr = require("./../../core/NumberParseAttr");
const DateItemToken = require("./../../date/internal/DateItemToken");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const Referent = require("./../../Referent");
const NumberHelper = require("./../../core/NumberHelper");
const MeasureKind = require("./../MeasureKind");
const MetaToken = require("./../../MetaToken");
const UnitReferent = require("./../UnitReferent");
const MiscHelper = require("./../../core/MiscHelper");
const NounPhraseToken = require("./../../core/NounPhraseToken");
const MeasureReferent = require("./../MeasureReferent");
const ReferentToken = require("./../../ReferentToken");
const NumberWithUnitParseAttr = require("./NumberWithUnitParseAttr");
const UnitToken = require("./UnitToken");
const NumbersWithUnitToken = require("./NumbersWithUnitToken");
const BracketHelper = require("./../../core/BracketHelper");

class MeasureToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.nums = null;
        this.name = null;
        this.internals = new Array();
        this.internalEx = null;
        this.isSet = false;
        this.reliable = false;
        this.isEmpty = false;
    }
    
    toString() {
        if (this.name === null) 
            return this.nums.toString();
        return (this.name + ": " + this.nums.toString());
    }
    
    getNormValues() {
        let li = this.createRefenetsTokensWithRegister(null, false);
        if (li === null || (li.length < 1)) 
            return null;
        let mr = Utils.as(li[li.length - 1].referent, MeasureReferent);
        if (mr === null) 
            return null;
        return mr.toStringEx(true, null, 0);
    }
    
    createRefenetsTokensWithRegister(ad, register = true) {
        if (this.internals.length === 0 && !this.reliable) {
            if (this.nums.units.length === 1 && this.nums.units[0].isDoubt) {
                if (this.nums.units[0].unknownName !== null) {
                }
                else if (this.nums.isNewlineBefore) {
                }
                else if (this.nums.units[0].beginToken.lengthChar > 1 && this.nums.units[0].beginToken.getMorphClassInDictionary().isUndefined) {
                }
                else if (this.nums.fromVal === null || this.nums.toVal === null) 
                    return null;
            }
        }
        let res = new Array();
        if (((this.nums === null || this.nums.plusMinusPercent)) && this.internals.length > 0) {
            let liEx = null;
            if (this.internalEx !== null) {
                liEx = this.internalEx.createRefenetsTokensWithRegister(ad, true);
                if (liEx !== null) 
                    res.splice(res.length, 0, ...liEx);
            }
            let mr = new MeasureReferent();
            let templ0 = "1";
            let templ = null;
            if (this.name !== null) 
                mr.addSlot(MeasureReferent.ATTR_NAME, this.name, false, 0);
            let ints = new Array();
            for (let k = 0; k < this.internals.length; k++) {
                let ii = this.internals[k];
                ii.reliable = true;
                let li = ii.createRefenetsTokensWithRegister(ad, false);
                if (li === null) 
                    continue;
                res.splice(res.length, 0, ...li);
                let mr0 = Utils.as(res[res.length - 1].referent, MeasureReferent);
                if (liEx !== null) 
                    mr0.addSlot(MeasureReferent.ATTR_REF, liEx[liEx.length - 1], false, 0);
                if (k === 0 && !this.isEmpty) {
                    templ0 = mr0.template;
                    mr0.template = "1";
                }
                if (ad !== null) 
                    mr0 = Utils.as(ad.registerReferent(mr0), MeasureReferent);
                mr.addSlot(MeasureReferent.ATTR_VALUE, mr0, false, 0);
                ints.push(mr0);
                if (templ === null) 
                    templ = "1";
                else {
                    let nu = mr.getStringValues(MeasureReferent.ATTR_VALUE).length;
                    templ = (templ + (this.isSet ? ", " : " × ") + nu);
                }
            }
            if (this.isSet) 
                templ = "{" + templ + "}";
            if (templ0 !== "1") 
                templ = Utils.replaceString(templ0, "1", templ);
            if (this.nums !== null && this.nums.plusMinusPercent && this.nums.singleVal !== null) {
                templ = ("[" + templ + " ±" + (this.internals.length + 1) + "%]");
                mr.addValue(this.nums.singleVal);
            }
            mr.template = templ;
            let i = 0;
            let hasLength = false;
            let uref = null;
            for (i = 0; i < ints.length; i++) {
                if (ints[i].kind === MeasureKind.LENGTH) {
                    hasLength = true;
                    uref = Utils.as(ints[i].getSlotValue(MeasureReferent.ATTR_UNIT), UnitReferent);
                }
                else if (ints[i].units.length > 0) 
                    break;
            }
            if (ints.length > 1 && hasLength && uref !== null) {
                for (const ii of ints) {
                    if (ii.findSlot(MeasureReferent.ATTR_UNIT, null, true) === null) {
                        ii.addSlot(MeasureReferent.ATTR_UNIT, uref, false, 0);
                        ii.kind = MeasureKind.LENGTH;
                    }
                }
            }
            if (ints.length === 3) {
                if (ints[0].kind === MeasureKind.LENGTH && ints[1].kind === MeasureKind.LENGTH && ints[2].kind === MeasureKind.LENGTH) 
                    mr.kind = MeasureKind.VOLUME;
                else if (ints[0].units.length === 0 && ints[1].units.length === 0 && ints[2].units.length === 0) {
                    let nam = mr.getStringValue(MeasureReferent.ATTR_NAME);
                    if (nam !== null) {
                        if (nam.includes("РАЗМЕР") || nam.includes("ГАБАРИТ")) 
                            mr.kind = MeasureKind.VOLUME;
                    }
                }
            }
            if (ints.length === 2) {
                if (ints[0].kind === MeasureKind.LENGTH && ints[1].kind === MeasureKind.LENGTH) 
                    mr.kind = MeasureKind.AREA;
            }
            if (!this.isEmpty) {
                if (ad !== null) 
                    mr = Utils.as(ad.registerReferent(mr), MeasureReferent);
                res.push(new ReferentToken(mr, this.beginToken, this.endToken));
            }
            return res;
        }
        let re2 = this.nums.createRefenetsTokensWithRegister(ad, this.name, register);
        for (const ii of this.internals) {
            let li = ii.createRefenetsTokensWithRegister(ad, true);
            if (li === null) 
                continue;
            res.splice(res.length, 0, ...li);
            re2[re2.length - 1].referent.addSlot(MeasureReferent.ATTR_REF, res[res.length - 1].referent, false, 0);
        }
        re2[re2.length - 1].beginToken = this.beginToken;
        re2[re2.length - 1].endToken = this.endToken;
        res.splice(res.length, 0, ...re2);
        return res;
    }
    
    static tryParseMinimal(t, addUnits, canOmitNumber = false) {
        if (t === null || (t instanceof ReferentToken)) 
            return null;
        let mt = NumbersWithUnitToken.tryParseMulti(t, addUnits, (canOmitNumber ? NumberWithUnitParseAttr.CANOMITNUMBER : NumberWithUnitParseAttr.NO));
        if (mt === null) 
            return null;
        if (mt[0].units.length === 0) 
            return null;
        if ((mt.length === 1 && mt[0].units.length === 1 && mt[0].units[0].isDoubt) && !mt[0].isNewlineBefore) 
            return null;
        let res = null;
        if (mt.length === 1) {
            res = MeasureToken._new1595(mt[0].beginToken, mt[mt.length - 1].endToken, mt[0]);
            res._parseInternals(addUnits);
            return res;
        }
        res = new MeasureToken(mt[0].beginToken, mt[mt.length - 1].endToken);
        for (const m of mt) {
            res.internals.push(MeasureToken._new1595(m.beginToken, m.endToken, m));
        }
        return res;
    }
    
    _parseInternals(addUnits) {
        if (this.endToken.next !== null && ((this.endToken.next.isCharOf("\\/") || this.endToken.next.isValue("ПРИ", null)))) {
            let mt1 = MeasureToken.tryParse(this.endToken.next.next, addUnits, true, false, false, false);
            if (mt1 !== null) {
                this.internals.push(mt1);
                this.endToken = mt1.endToken;
            }
            else {
                let mt = NumbersWithUnitToken.tryParse(this.endToken.next.next, addUnits, NumberWithUnitParseAttr.NO);
                if (mt !== null && mt.units.length > 0 && !UnitToken.canBeEquals(this.nums.units, mt.units)) {
                    this.internals.push(MeasureToken._new1595(mt.beginToken, mt.endToken, mt));
                    this.endToken = mt.endToken;
                }
            }
        }
    }
    
    static tryParse(t, addUnits, canBeSet = true, canUnitsAbsent = false, isResctriction = false, isSubval = false) {
        if (!(t instanceof TextToken)) 
            return null;
        if (t.isTableControlChar) 
            return null;
        let t0 = t;
        let whd = null;
        let minmax = 0;
        let wrapminmax1608 = new RefOutArgWrapper(minmax);
        let tt = NumbersWithUnitToken._isMinOrMax(t0, wrapminmax1608);
        minmax = wrapminmax1608.value;
        if (tt !== null) 
            t = tt.next;
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPREPOSITION.value()) | (NounPhraseParseAttr.IGNOREBRACKETS.value())), 0, null);
        if (npt === null) {
            whd = NumbersWithUnitToken._tryParseWHL(t);
            if (whd !== null) 
                npt = new NounPhraseToken(t0, whd.endToken);
            else if (t0.isValue("КПД", null)) 
                npt = new NounPhraseToken(t0, t0);
            else if ((t0 instanceof TextToken) && t0.lengthChar > 3 && t0.getMorphClassInDictionary().isUndefined) 
                npt = new NounPhraseToken(t0, t0);
            else if (t0.isValue("T", null) && t0.chars.isAllLower) {
                npt = new NounPhraseToken(t0, t0);
                t = t0;
                if (t.next !== null && t.next.isChar('=')) 
                    npt.endToken = t.next;
            }
            else if ((t0 instanceof TextToken) && t0.chars.isLetter && isSubval) {
                if (NumbersWithUnitToken.tryParse(t, addUnits, NumberWithUnitParseAttr.NO) !== null) 
                    return null;
                npt = new NounPhraseToken(t0, t0);
                for (t = t0.next; t !== null; t = t.next) {
                    if (t.whitespacesBeforeCount > 2) 
                        break;
                    else if (!(t instanceof TextToken)) 
                        break;
                    else if (!t.chars.isLetter) {
                        let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                        if (br !== null) 
                            npt.endToken = (t = br.endToken);
                        else 
                            break;
                    }
                    else if (NumbersWithUnitToken.tryParse(t, addUnits, NumberWithUnitParseAttr.NO) !== null) 
                        break;
                    else 
                        npt.endToken = t;
                }
            }
            else 
                return null;
        }
        else if (NumberHelper.tryParseRealNumber(t, NumberParseAttr.NO) !== null) 
            return null;
        else {
            let dtok = DateItemToken.tryParse(t, null, false);
            if (dtok !== null) 
                return null;
        }
        let t1 = npt.endToken;
        t = npt.endToken;
        let _name = MetaToken._new823(npt.beginToken, npt.endToken, npt.morph);
        let units = null;
        let units2 = null;
        let _internals = new Array();
        let not = false;
        for (tt = t1.next; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) 
                break;
            if (tt.isTableControlChar) 
                break;
            let wrapminmax1600 = new RefOutArgWrapper(minmax);
            let tt2 = NumbersWithUnitToken._isMinOrMax(tt, wrapminmax1600);
            minmax = wrapminmax1600.value;
            if (tt2 !== null) {
                t1 = (t = (tt = tt2));
                continue;
            }
            if ((tt.isValue("БЫТЬ", null) || tt.isValue("ДОЛЖЕН", null) || tt.isValue("ДОЛЖНЫЙ", null)) || tt.isValue("МОЖЕТ", null) || ((tt.isValue("СОСТАВЛЯТЬ", null) && !tt.getMorphClassInDictionary().isAdjective))) {
                t1 = (t = tt);
                if (tt.previous.isValue("НЕ", null)) 
                    not = true;
                continue;
            }
            let www = NumbersWithUnitToken._tryParseWHL(tt);
            if (www !== null) {
                whd = www;
                t1 = (t = (tt = www.endToken));
                continue;
            }
            if (tt.isValue("ПРИ", null)) {
                let mt1 = MeasureToken.tryParse(tt.next, addUnits, false, false, true, false);
                if (mt1 !== null) {
                    _internals.push(mt1);
                    t1 = (t = (tt = mt1.endToken));
                    continue;
                }
                let n1 = NumbersWithUnitToken.tryParse(tt.next, addUnits, NumberWithUnitParseAttr.NO);
                if (n1 !== null && n1.units.length > 0) {
                    mt1 = MeasureToken._new1595(n1.beginToken, n1.endToken, n1);
                    _internals.push(mt1);
                    t1 = (t = (tt = mt1.endToken));
                    continue;
                }
            }
            if (tt.isValue("ПО", null) && tt.next !== null && tt.next.isValue("U", null)) {
                t1 = (t = (tt = tt.next));
                continue;
            }
            if (_internals.length > 0) {
                if (tt.isChar(':')) 
                    break;
                let mt1 = MeasureToken.tryParse(tt.next, addUnits, false, false, true, false);
                if (mt1 !== null && mt1.reliable) {
                    _internals.push(mt1);
                    t1 = (t = (tt = mt1.endToken));
                    continue;
                }
            }
            if ((tt instanceof NumberToken) && tt.typ === NumberSpellingType.WORDS) {
                let npt3 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
                if (npt3 !== null) {
                    t1 = (tt = npt3.endToken);
                    if (_internals.length === 0) 
                        _name.endToken = t1;
                    continue;
                }
            }
            if (((tt.isHiphen && !tt.isWhitespaceBefore && !tt.isWhitespaceAfter) && (tt.next instanceof NumberToken) && (tt.previous instanceof TextToken)) && tt.previous.chars.isAllUpper) {
                t1 = (tt = (t = tt.next));
                if (_internals.length === 0) 
                    _name.endToken = t1;
                continue;
            }
            if (((tt instanceof NumberToken) && !tt.isWhitespaceBefore && (tt.previous instanceof TextToken)) && tt.previous.chars.isAllUpper) {
                t1 = (t = tt);
                if (_internals.length === 0) 
                    _name.endToken = t1;
                continue;
            }
            if ((((tt instanceof NumberToken) && !tt.isWhitespaceAfter && tt.next.isHiphen) && !tt.next.isWhitespaceAfter && (tt.next.next instanceof TextToken)) && tt.next.next.lengthChar > 2) {
                t1 = (t = (tt = tt.next.next));
                let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null && npt1.endChar > tt.endChar) 
                    t1 = (t = (tt = npt1.endToken));
                if (_internals.length === 0) 
                    _name.endToken = t1;
                continue;
            }
            if ((tt instanceof NumberToken) && tt.previous !== null) {
                if (tt.previous.isValue("USB", null)) {
                    t1 = (t = tt);
                    if (_internals.length === 0) 
                        _name.endToken = t1;
                    for (let ttt = tt.next; ttt !== null; ttt = ttt.next) {
                        if (ttt.isWhitespaceBefore) 
                            break;
                        if (ttt.isCharOf(",:")) 
                            break;
                        t1 = (t = (tt = ttt));
                        if (_internals.length === 0) 
                            _name.endToken = t1;
                    }
                    continue;
                }
            }
            let mt0 = NumbersWithUnitToken.tryParse(tt, addUnits, NumberWithUnitParseAttr.NO);
            if (mt0 !== null) {
                let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), 0, null);
                if (npt1 !== null && npt1.endChar > mt0.endChar) {
                    t1 = (t = (tt = npt1.endToken));
                    if (_internals.length === 0) 
                        _name.endToken = t1;
                    continue;
                }
                break;
            }
            if (((tt.isComma || tt.isChar('('))) && tt.next !== null) {
                www = NumbersWithUnitToken._tryParseWHL(tt.next);
                if (www !== null) {
                    whd = www;
                    t1 = (t = (tt = www.endToken));
                    if (tt.next !== null && tt.next.isComma) 
                        t1 = (tt = tt.next);
                    if (tt.next !== null && tt.next.isChar(')')) {
                        t1 = (tt = tt.next);
                        continue;
                    }
                }
                let uu = UnitToken.tryParseList(tt.next, addUnits, false);
                if (uu !== null) {
                    t1 = (t = uu[uu.length - 1].endToken);
                    units = uu;
                    if (tt.isChar('(') && t1.next !== null && t1.next.isChar(')')) {
                        t1 = (t = (tt = t1.next));
                        continue;
                    }
                    else if (t1.next !== null && t1.next.isChar('(')) {
                        uu = UnitToken.tryParseList(t1.next.next, addUnits, false);
                        if (uu !== null && uu[uu.length - 1].endToken.next !== null && uu[uu.length - 1].endToken.next.isChar(')')) {
                            units2 = uu;
                            t1 = (t = (tt = uu[uu.length - 1].endToken.next));
                            continue;
                        }
                        www = NumbersWithUnitToken._tryParseWHL(t1.next);
                        if (www !== null) {
                            whd = www;
                            t1 = (t = (tt = www.endToken));
                            continue;
                        }
                    }
                    if (uu !== null && uu.length > 0 && !uu[0].isDoubt) 
                        break;
                    if (t1.next !== null) {
                        if (t1.next.isTableControlChar || t1.isNewlineAfter) 
                            break;
                    }
                    units = null;
                }
            }
            if (BracketHelper.canBeStartOfSequence(tt, false, false) && !(tt.next instanceof NumberToken)) {
                let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                if (br !== null) {
                    t1 = (t = (tt = br.endToken));
                    continue;
                }
            }
            if (tt.isValue("НЕ", null) && tt.next !== null) {
                let mc = tt.next.getMorphClassInDictionary();
                if (mc.isAdverb || mc.isMisc) 
                    break;
                continue;
            }
            if (tt.isValue("ЯМЗ", null)) {
            }
            let npt2 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPREPOSITION.value()) | (NounPhraseParseAttr.IGNOREBRACKETS.value()) | (NounPhraseParseAttr.PARSEPRONOUNS.value())), 0, null);
            if (npt2 === null) {
                if (tt.morph._class.isPreposition || tt.morph._class.isConjunction) {
                    let to = NumbersWithUnitToken.m_Termins.tryParse(tt, TerminParseAttr.NO);
                    if (to !== null) {
                        if ((to.endToken.next instanceof TextToken) && to.endToken.next.isLetters) {
                        }
                        else 
                            break;
                    }
                    t1 = tt;
                    continue;
                }
                let mc = tt.getMorphClassInDictionary();
                if (((tt instanceof TextToken) && tt.chars.isLetter && tt.lengthChar > 1) && (((tt.chars.isAllUpper || mc.isAdverb || mc.isUndefined) || mc.isAdjective))) {
                    let uu = UnitToken.tryParseList(tt, addUnits, false);
                    if (uu !== null) {
                        if (uu[0].lengthChar > 1 || uu.length > 1) {
                            units = uu;
                            t1 = (t = uu[uu.length - 1].endToken);
                            break;
                        }
                    }
                    t1 = (t = tt);
                    if (_internals.length === 0) 
                        _name.endToken = tt;
                    continue;
                }
                if (tt.isComma) 
                    continue;
                if (tt.isChar('.')) {
                    if (!MiscHelper.canBeStartOfSentence(tt.next)) 
                        continue;
                    let uu = UnitToken.tryParseList(tt.next, addUnits, false);
                    if (uu !== null) {
                        if (uu[0].lengthChar > 2 || uu.length > 1) {
                            units = uu;
                            t1 = (t = uu[uu.length - 1].endToken);
                            break;
                        }
                    }
                }
                break;
            }
            t1 = (t = (tt = npt2.endToken));
            if (_internals.length > 0) {
            }
            else if (t.isValue("ПРЕДЕЛ", null) || t.isValue("ГРАНИЦА", null) || t.isValue("ДИАПАЗОН", null)) {
            }
            else if (t.chars.isLetter) 
                _name.endToken = t1;
        }
        let t11 = t1;
        for (t1 = t1.next; t1 !== null; t1 = t1.next) {
            if (t1.isNewlineBefore && t1.isTableControlChar) 
                return null;
            else if (t1.isTableControlChar) {
            }
            else if (t1.isCharOf(":,_")) {
                if (isResctriction) 
                    return null;
                let www = NumbersWithUnitToken._tryParseWHL(t1.next);
                if (www !== null) {
                    whd = www;
                    t1 = (t = www.endToken);
                    continue;
                }
                let uu = UnitToken.tryParseList(t1.next, addUnits, false);
                if (uu !== null) {
                    if (uu[0].lengthChar > 1 || uu.length > 1) {
                        units = uu;
                        t1 = (t = uu[uu.length - 1].endToken);
                        continue;
                    }
                }
                if (t1.isChar(':')) {
                    let li = new Array();
                    for (let ttt = t1.next; ttt !== null; ttt = ttt.next) {
                        if (ttt.isHiphen || ttt.isTableControlChar) 
                            continue;
                        if ((ttt instanceof TextToken) && !ttt.chars.isLetter) 
                            continue;
                        let mt1 = MeasureToken.tryParse(ttt, addUnits, true, true, false, true);
                        if (mt1 === null) 
                            break;
                        li.push(mt1);
                        ttt = mt1.endToken;
                        if (ttt.next !== null && ttt.next.isChar(';')) 
                            ttt = ttt.next;
                        if (ttt.isChar(';')) {
                        }
                        else if (ttt.isNewlineAfter && mt1.isNewlineBefore) {
                        }
                        else 
                            break;
                    }
                    if (li.length > 1) {
                        let res0 = MeasureToken._new1601(t0, li[li.length - 1].endToken, li, true);
                        if (_internals !== null && _internals.length > 0) 
                            res0.internalEx = _internals[0];
                        let nam = MiscHelper.getTextValueOfMetaToken(_name, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                        li[0].beginToken = t0;
                        for (const v of li) {
                            v.name = (nam + " (" + ((v.name != null ? v.name : "")) + ")").trim();
                            if (v.nums !== null && v.nums.units.length === 0 && units !== null) 
                                v.nums.units = units;
                        }
                        return res0;
                    }
                }
            }
            else if (t1.isHiphen && t1.isWhitespaceAfter && t1.isWhitespaceBefore) {
            }
            else if (t1.isHiphen && t1.next !== null && t1.next.isChar('(')) {
            }
            else 
                break;
        }
        if (t1 === null) 
            return null;
        let attrs = NumberWithUnitParseAttr.CANBENON;
        if (not) 
            attrs = NumberWithUnitParseAttr.of((attrs.value()) | (NumberWithUnitParseAttr.NOT.value()));
        if (isResctriction) 
            attrs = NumberWithUnitParseAttr.of((attrs.value()) | (NumberWithUnitParseAttr.ISSECOND.value()));
        let mts = NumbersWithUnitToken.tryParseMulti(t1, addUnits, attrs);
        if (mts === null) {
            if (units !== null && units.length > 0) {
                if (t1 === null || t1.previous.isChar(':')) {
                    mts = new Array();
                    if (t1 === null) {
                        for (t1 = t11; t1 !== null && t1.next !== null; t1 = t1.next) {
                        }
                    }
                    else 
                        t1 = t1.previous;
                    mts.push(NumbersWithUnitToken._new1602(t0, t1, Number.NaN));
                }
            }
            if (mts === null) 
                return null;
        }
        let mt = mts[0];
        if (mt.beginToken === mt.endToken && !(mt.beginToken instanceof NumberToken)) 
            return null;
        if (!isSubval && _name.beginToken.morph._class.isPreposition) 
            _name.beginToken = _name.beginToken.next;
        if (mt.wHL !== null) 
            whd = mt.wHL;
        for (let kk = 0; kk < 10; kk++) {
            if (whd !== null && whd.endToken === _name.endToken) {
                _name.endToken = whd.beginToken.previous;
                continue;
            }
            if (units !== null) {
                if (units[units.length - 1].endToken === _name.endToken) {
                    _name.endToken = units[0].beginToken.previous;
                    continue;
                }
            }
            break;
        }
        if (mts.length > 1 && _internals.length === 0) {
            if (mt.units.length === 0) {
                if (units !== null) {
                    for (const m of mts) {
                        m.units = units;
                    }
                }
            }
            let res1 = MeasureToken._new1603(t0, mts[mts.length - 1].endToken, _name.morph, true);
            res1.name = MiscHelper.getTextValueOfMetaToken(_name, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
            for (let k = 0; k < mts.length; k++) {
                let ttt = MeasureToken._new1595(mts[k].beginToken, mts[k].endToken, mts[k]);
                if (whd !== null) {
                    let nams = Utils.as(whd.tag, Array);
                    if (k < nams.length) 
                        ttt.name = nams[k];
                }
                res1.internals.push(ttt);
            }
            let tt1 = res1.endToken.next;
            if (tt1 !== null && tt1.isChar('±')) {
                let nn = NumbersWithUnitToken._tryParse(tt1, addUnits, NumberWithUnitParseAttr.ISSECOND);
                if (nn !== null && nn.plusMinusPercent) {
                    res1.endToken = nn.endToken;
                    res1.nums = nn;
                    if (nn.units.length > 0 && units === null && mt.units.length === 0) {
                        for (const m of mts) {
                            m.units = nn.units;
                        }
                    }
                }
            }
            return res1;
        }
        if (!mt.isWhitespaceBefore) {
            if (mt.beginToken.previous === null) 
                return null;
            if (mt.beginToken.previous.isCharOf(":),") || mt.beginToken.previous.isTableControlChar || mt.beginToken.previous.isValue("IP", null)) {
            }
            else if (mt.beginToken.isHiphen && mt.units.length > 0 && !mt.units[0].isDoubt) {
            }
            else 
                return null;
        }
        if (mt.units.length === 0 && units !== null) {
            mt.units = units;
            if (mt.divNum !== null && units.length > 1 && mt.divNum.units.length === 0) {
                for (let i = 1; i < units.length; i++) {
                    if (units[i].pow === -1) {
                        for (let j = i; j < units.length; j++) {
                            mt.divNum.units.push(units[j]);
                            units[j].pow = -units[j].pow;
                        }
                        mt.units.splice(i, units.length - i);
                        break;
                    }
                }
            }
        }
        if ((minmax < 0) && mt.singleVal !== null) {
            mt.fromVal = mt.singleVal;
            mt.fromInclude = true;
            mt.singleVal = null;
        }
        if (minmax > 0 && mt.singleVal !== null) {
            mt.toVal = mt.singleVal;
            mt.toInclude = true;
            mt.singleVal = null;
        }
        if (mt.units.length === 0) {
            units = UnitToken.tryParseList(mt.endToken.next, addUnits, true);
            if (units === null) {
                if (canUnitsAbsent) {
                }
                else 
                    return null;
            }
            else 
                mt.units = units;
        }
        let res = MeasureToken._new1605(t0, mt.endToken, _name.morph, _internals);
        if (((!t0.isWhitespaceBefore && t0.previous !== null && t0 === _name.beginToken) && t0.previous.isHiphen && !t0.previous.isWhitespaceBefore) && (t0.previous.previous instanceof TextToken)) 
            _name.beginToken = res.beginToken = _name.beginToken.previous.previous;
        res.name = MiscHelper.getTextValueOfMetaToken(_name, (!isSubval ? GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE : GetTextAttr.NO));
        res.nums = mt;
        for (const u of res.nums.units) {
            if (u.keyword !== null) {
                if (u.keyword.beginChar >= res.beginChar) 
                    res.reliable = true;
            }
        }
        res._parseInternals(addUnits);
        if (res.internals.length > 0 || !canBeSet) 
            return res;
        t1 = res.endToken.next;
        if (t1 !== null && t1.isCommaAnd) 
            t1 = t1.next;
        let mts1 = NumbersWithUnitToken.tryParseMulti(t1, addUnits, NumberWithUnitParseAttr.NO);
        if ((mts1 !== null && mts1.length === 1 && (t1.whitespacesBeforeCount < 3)) && mts1[0].units.length > 0 && !UnitToken.canBeEquals(mts[0].units, mts1[0].units)) {
            res.isSet = true;
            res.nums = null;
            res.internals.push(MeasureToken._new1595(mt.beginToken, mt.endToken, mt));
            res.internals.push(MeasureToken._new1595(mts1[0].beginToken, mts1[0].endToken, mts1[0]));
            res.endToken = mts1[0].endToken;
        }
        return res;
    }
    
    static _new1595(_arg1, _arg2, _arg3) {
        let res = new MeasureToken(_arg1, _arg2);
        res.nums = _arg3;
        return res;
    }
    
    static _new1601(_arg1, _arg2, _arg3, _arg4) {
        let res = new MeasureToken(_arg1, _arg2);
        res.internals = _arg3;
        res.isEmpty = _arg4;
        return res;
    }
    
    static _new1603(_arg1, _arg2, _arg3, _arg4) {
        let res = new MeasureToken(_arg1, _arg2);
        res.morph = _arg3;
        res.reliable = _arg4;
        return res;
    }
    
    static _new1605(_arg1, _arg2, _arg3, _arg4) {
        let res = new MeasureToken(_arg1, _arg2);
        res.morph = _arg3;
        res.internals = _arg4;
        return res;
    }
}


module.exports = MeasureToken