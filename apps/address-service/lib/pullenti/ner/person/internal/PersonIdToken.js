/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const TextToken = require("./../../TextToken");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphGender = require("./../../../morph/MorphGender");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const ReferentToken = require("./../../ReferentToken");
const AddressReferent = require("./../../address/AddressReferent");
const Referent = require("./../../Referent");
const PersonIdentityReferent = require("./../PersonIdentityReferent");
const Termin = require("./../../core/Termin");
const PersonIdTokenTyps = require("./PersonIdTokenTyps");
const TerminCollection = require("./../../core/TerminCollection");
const NumberHelper = require("./../../core/NumberHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const PersonPropertyReferent = require("./../PersonPropertyReferent");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");
const GeoReferent = require("./../../geo/GeoReferent");
const PersonAttrToken = require("./PersonAttrToken");

class PersonIdToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.typ = PersonIdTokenTyps.KEYWORD;
        this.value = null;
        this.referent = null;
        this.hasPrefix = false;
    }
    
    static tryAttach(t) {
        if (t === null || !t.chars.isLetter) 
            return null;
        let noun = PersonIdToken.tryParse(t, null);
        if (noun === null) 
            return null;
        let li = new Array();
        for (t = noun.endToken.next; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            if (t.isCharOf(",:")) 
                continue;
            let idt = PersonIdToken.tryParse(t, (li.length > 0 ? li[li.length - 1] : noun));
            if (idt === null) {
                if (t.isValue("ОТДЕЛ", null) || t.isValue("ОТДЕЛЕНИЕ", null)) 
                    continue;
                break;
            }
            if (idt.typ === PersonIdTokenTyps.KEYWORD) 
                break;
            li.push(idt);
            t = idt.endToken;
        }
        if (li.length === 0) 
            return null;
        let num = null;
        let i = 0;
        if (li[0].typ === PersonIdTokenTyps.NUMBER) {
            if (li.length > 1 && li[1].typ === PersonIdTokenTyps.NUMBER && li[1].hasPrefix) {
                num = li[0].value + li[1].value;
                i = 2;
            }
            else {
                num = li[0].value;
                i = 1;
            }
        }
        else if (li[0].typ === PersonIdTokenTyps.SERIA && li.length > 1 && li[1].typ === PersonIdTokenTyps.NUMBER) {
            num = li[0].value + li[1].value;
            i = 2;
        }
        else if (li[0].typ === PersonIdTokenTyps.SERIA && li[0].value.length > 5) {
            num = li[0].value;
            i = 1;
        }
        else if (li.length > 1 && li[0].typ === PersonIdTokenTyps.ORG && li[1].typ === PersonIdTokenTyps.NUMBER) {
            i = 0;
            num = li[1].value;
        }
        else 
            return null;
        let pid = new PersonIdentityReferent();
        pid.typ = noun.value.toLowerCase();
        pid.number = num;
        if (noun.referent instanceof GeoReferent) 
            pid.state = noun.referent;
        for (; i < li.length; i++) {
            if (li[i].typ === PersonIdTokenTyps.VIDAN || li[i].typ === PersonIdTokenTyps.CODE) {
            }
            else if (li[i].typ === PersonIdTokenTyps.DATE && li[i].referent !== null) {
                if (pid.findSlot(PersonIdentityReferent.ATTR_DATE, null, true) !== null) 
                    break;
                pid.addSlot(PersonIdentityReferent.ATTR_DATE, li[i].referent, false, 0);
            }
            else if (li[i].typ === PersonIdTokenTyps.ADDRESS && li[i].referent !== null) {
                if (pid.findSlot(PersonIdentityReferent.ATTR_ADDRESS, null, true) !== null) 
                    break;
                pid.addSlot(PersonIdentityReferent.ATTR_ADDRESS, li[i].referent, false, 0);
            }
            else if (li[i].typ === PersonIdTokenTyps.ORG && li[i].referent !== null) {
                if (pid.findSlot(PersonIdentityReferent.ATTR_ORG, null, true) !== null) 
                    break;
                pid.addSlot(PersonIdentityReferent.ATTR_ORG, li[i].referent, false, 0);
            }
            else 
                break;
        }
        return new ReferentToken(pid, noun.beginToken, li[i - 1].endToken);
    }
    
    static tryParse(t, prev) {
        if (t === null) 
            return null;
        if (t.isValue("СВИДЕТЕЛЬСТВО", null)) {
            let tt1 = t;
            let ip = false;
            let reg = false;
            for (let tt = t.next; tt !== null; tt = tt.next) {
                if (tt.isCommaAnd || tt.morph._class.isPreposition) 
                    continue;
                if (tt.isValue("РЕГИСТРАЦИЯ", null) || tt.isValue("РЕЕСТР", null) || tt.isValue("ЗАРЕГИСТРИРОВАТЬ", null)) {
                    reg = true;
                    tt1 = tt;
                }
                else if (tt.isValue("ИНДИВИДУАЛЬНЫЙ", null) || tt.isValue("ИП", null)) {
                    ip = true;
                    tt1 = tt;
                }
                else if ((tt.isValue("ВНЕСЕНИЕ", null) || tt.isValue("ГОСУДАРСТВЕННЫЙ", null) || tt.isValue("ЕДИНЫЙ", null)) || tt.isValue("ЗАПИСЬ", null) || tt.isValue("ПРЕДПРИНИМАТЕЛЬ", null)) 
                    tt1 = tt;
                else if (tt.getReferent() !== null && tt.getReferent().typeName === "DATERANGE") 
                    tt1 = tt;
                else 
                    break;
            }
            if (reg && ip) 
                return PersonIdToken._new2590(t, tt1, PersonIdTokenTyps.KEYWORD, "СВИДЕТЕЛЬСТВО О ГОСУДАРСТВЕННОЙ РЕГИСТРАЦИИ ФИЗИЧЕСКОГО ЛИЦА В КАЧЕСТВЕ ИНДИВИДУАЛЬНОГО ПРЕДПРИНИМАТЕЛЯ");
        }
        let tok = PersonIdToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            let ty = PersonIdTokenTyps.of(tok.termin.tag);
            let res = PersonIdToken._new2590(tok.beginToken, tok.endToken, ty, tok.termin.canonicText);
            if (prev === null) {
                if (ty !== PersonIdTokenTyps.KEYWORD) 
                    return null;
                for (t = tok.endToken.next; t !== null; t = t.next) {
                    let r = t.getReferent();
                    if (r !== null && (r instanceof GeoReferent)) {
                        res.referent = r;
                        res.endToken = t;
                        continue;
                    }
                    if (t.isValue("ГРАЖДАНИН", null) && t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                        res.referent = t.next.getReferent();
                        t = res.endToken = t.next;
                        continue;
                    }
                    if (r !== null) 
                        break;
                    let ait = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    if (ait !== null) {
                        if (ait.referent !== null) {
                            for (const s of ait.referent.slots) {
                                if (s.typeName === PersonPropertyReferent.ATTR_REF && (s.value instanceof GeoReferent)) 
                                    res.referent = Utils.as(s.value, Referent);
                            }
                        }
                        res.endToken = ait.endToken;
                        break;
                    }
                    if (t.isValue("ДАННЫЙ", null)) {
                        res.endToken = t;
                        continue;
                    }
                    break;
                }
                if ((res.referent instanceof GeoReferent) && !res.referent.isState) 
                    res.referent = null;
                return res;
            }
            if (ty === PersonIdTokenTyps.NUMBER) {
                let tmp = new StringBuilder();
                let tt = tok.endToken.next;
                if (tt !== null && tt.isChar(':')) 
                    tt = tt.next;
                for (; tt !== null; tt = tt.next) {
                    if (tt.isNewlineBefore) 
                        break;
                    if (!(tt instanceof NumberToken) && !tt.isCharOf("\\/")) {
                        let nnn = NumberHelper.tryParseRoman(tt);
                        if (nnn !== null && ((!nnn.isWhitespaceBefore || tt === tok.endToken.next))) {
                            tmp.append(MiscHelper.getTextValueOfMetaToken(nnn, GetTextAttr.NO));
                            res.endToken = (tt = nnn.endToken);
                            continue;
                        }
                        break;
                    }
                    tmp.append(tt.getSourceText());
                    res.endToken = tt;
                }
                if (tmp.length < 1) 
                    return null;
                res.value = tmp.toString();
                res.hasPrefix = true;
                return res;
            }
            if (ty === PersonIdTokenTyps.SERIA) {
                let tmp = new StringBuilder();
                let tt = tok.endToken.next;
                if (tt !== null && tt.isChar(':')) 
                    tt = tt.next;
                let nextNum = false;
                for (; tt !== null; tt = tt.next) {
                    if (tt.isNewlineBefore) 
                        break;
                    if (MiscHelper.checkNumberPrefix(tt) !== null) {
                        nextNum = true;
                        break;
                    }
                    if (!(tt instanceof NumberToken)) {
                        if (!(tt instanceof TextToken)) 
                            break;
                        if (!tt.chars.isAllUpper) 
                            break;
                        let nu = NumberHelper.tryParseRoman(tt);
                        if (nu !== null) {
                            tmp.append(nu.getSourceText());
                            tt = nu.endToken;
                        }
                        else if (tt.lengthChar !== 2) 
                            break;
                        else {
                            tmp.append(tt.term);
                            res.endToken = tt;
                        }
                        if (tt.next !== null && tt.next.isHiphen) 
                            tt = tt.next;
                        continue;
                    }
                    if (tmp.length >= 4) 
                        break;
                    tmp.append(tt.getSourceText());
                    res.endToken = tt;
                }
                if (tmp.length < 4) {
                    if (tmp.length < 2) 
                        return null;
                    let tt1 = res.endToken.next;
                    if (tt1 !== null && tt1.isComma) 
                        tt1 = tt1.next;
                    let _next = PersonIdToken.tryParse(tt1, res);
                    if (_next !== null && _next.typ === PersonIdTokenTyps.NUMBER) {
                    }
                    else 
                        return null;
                }
                res.value = tmp.toString();
                res.hasPrefix = true;
                return res;
            }
            if (ty === PersonIdTokenTyps.CODE) {
                for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
                    if (tt.isCharOf(":") || tt.isHiphen) 
                        continue;
                    if (tt instanceof NumberToken) {
                        res.endToken = tt;
                        continue;
                    }
                    break;
                }
            }
            if (ty === PersonIdTokenTyps.ADDRESS) {
                if (t.getReferent() instanceof AddressReferent) {
                    res.referent = t.getReferent();
                    res.endToken = t;
                    return res;
                }
                for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
                    if (tt.isCharOf(":") || tt.isHiphen || tt.morph._class.isPreposition) 
                        continue;
                    if (tt.getReferent() instanceof AddressReferent) {
                        res.referent = tt.getReferent();
                        res.endToken = tt;
                    }
                    break;
                }
                if (res.referent === null) 
                    return null;
            }
            return res;
        }
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null) {
            if (npt.endToken.isValue("УДОСТОВЕРЕНИЕ", "ПОСВІДЧЕННЯ")) 
                return PersonIdToken._new2590(t, npt.endToken, PersonIdTokenTyps.KEYWORD, npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
        }
        if (prev === null) 
            return null;
        let t0 = t;
        let t1 = MiscHelper.checkNumberPrefix(t0);
        if (t1 !== null) 
            t = t1;
        if (t instanceof NumberToken) {
            let tmp = new StringBuilder();
            let res = PersonIdToken._new2593(t0, t, PersonIdTokenTyps.NUMBER);
            for (let tt = t; tt !== null; tt = tt.next) {
                if (tt.isNewlineBefore) 
                    break;
                if (!(tt instanceof NumberToken)) 
                    break;
                tmp.append(tt.getSourceText());
                res.endToken = tt;
            }
            if (tmp.length < 4) {
                if (tmp.length < 2) 
                    return null;
                if (prev === null || prev.typ !== PersonIdTokenTyps.KEYWORD) 
                    return null;
                let ne = PersonIdToken.tryParse(res.endToken.next, prev);
                if (ne !== null && ne.typ === PersonIdTokenTyps.NUMBER) 
                    res.typ = PersonIdTokenTyps.SERIA;
                else 
                    return null;
            }
            res.value = tmp.toString();
            if (t0 !== t) 
                res.hasPrefix = true;
            return res;
        }
        if (prev.typ === PersonIdTokenTyps.KEYWORD || t0 !== t) {
            let rom = NumberHelper.tryParseRoman(t);
            if (rom !== null) {
                let tt1 = rom.endToken.next;
                if (tt1 !== null && tt1.isHiphen) 
                    tt1 = tt1.next;
                if ((tt1 instanceof TextToken) && (tt1.lengthChar < 4) && tt1.chars.isAllUpper) {
                    let res = PersonIdToken._new2593(t0, tt1, PersonIdTokenTyps.SERIA);
                    res.value = (MiscHelper.getTextValueOfMetaToken(rom, GetTextAttr.NO) + "-" + tt1.term);
                    if (t0 !== t) 
                        res.hasPrefix = true;
                    return res;
                }
            }
        }
        if (t instanceof ReferentToken) {
            let r = t.getReferent();
            if (r !== null) {
                if (r.typeName === "DATE") 
                    return PersonIdToken._new2595(t, t, PersonIdTokenTyps.DATE, r);
                if (r.typeName === "ORGANIZATION") 
                    return PersonIdToken._new2595(t, t, PersonIdTokenTyps.ORG, r);
                if (r.typeName === "ADDRESS") 
                    return PersonIdToken._new2595(t, t, PersonIdTokenTyps.ADDRESS, r);
            }
        }
        if ((prev !== null && prev.typ === PersonIdTokenTyps.KEYWORD && (t instanceof TextToken)) && !t.chars.isAllLower && t.chars.isLetter) {
            let rr = PersonIdToken.tryParse(t.next, prev);
            if (rr !== null && rr.typ === PersonIdTokenTyps.NUMBER) 
                return PersonIdToken._new2590(t, t, PersonIdTokenTyps.SERIA, t.term);
        }
        if ((t !== null && t.isValue("ОТ", "ВІД") && (t.next instanceof ReferentToken)) && t.next.getReferent().typeName === "DATE") 
            return PersonIdToken._new2595(t, t.next, PersonIdTokenTyps.DATE, t.next.getReferent());
        return null;
    }
    
    static initialize() {
        if (PersonIdToken.m_Ontology !== null) 
            return;
        PersonIdToken.m_Ontology = new TerminCollection();
        let t = null;
        t = Termin._new170("ПАСПОРТ", PersonIdTokenTyps.KEYWORD);
        t.addVariant("ПАССПОРТ", false);
        t.addVariant("ПАСПОРТНЫЕ ДАННЫЕ", false);
        t.addVariant("ВНУТРЕННИЙ ПАСПОРТ", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("ЗАГРАНИЧНЫЙ ПАСПОРТ", PersonIdTokenTyps.KEYWORD);
        t.addVariant("ЗАГРАНПАСПОРТ", false);
        t.addAbridge("ЗАГРАН. ПАСПОРТ");
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("СВИДЕТЕЛЬСТВО О РОЖДЕНИИ", PersonIdTokenTyps.KEYWORD);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("СВИДЕТЕЛЬСТВО О СМЕРТИ", PersonIdTokenTyps.KEYWORD);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("СПРАВКА О СМЕРТИ", PersonIdTokenTyps.KEYWORD);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("УДОСТОВЕРЕНИЕ ЛИЧНОСТИ", PersonIdTokenTyps.KEYWORD);
        t.addVariant("УДОСТОВЕРЕНИЕ ЛИЧНОСТИ ОФИЦЕРА", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("СВИДЕТЕЛЬСТВО О ГОСУДАРСТВЕННОЙ РЕГИСТРАЦИИ ФИЗИЧЕСКОГО ЛИЦА В КАЧЕСТВЕ ИНДИВИДУАЛЬНОГО ПРЕДПРИНИМАТЕЛЯ", PersonIdTokenTyps.KEYWORD);
        t.addVariant("СВИДЕТЕЛЬСТВО О ГОСУДАРСТВЕННОЙ РЕГИСТРАЦИИ ФИЗИЧЕСКОГО ЛИЦА В КАЧЕСТВЕ ИП", false);
        t.addVariant("СВИДЕТЕЛЬСТВО О ГОСРЕГИСТРАЦИИ ФИЗЛИЦА В КАЧЕСТВЕ ИП", false);
        t.addVariant("СВИДЕТЕЛЬСТВО ГОСУДАРСТВЕННОЙ РЕГИСТРАЦИИ", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("ВОДИТЕЛЬСКОЕ УДОСТОВЕРЕНИЕ", PersonIdTokenTyps.KEYWORD);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("СЕРИЯ", PersonIdTokenTyps.SERIA);
        t.addAbridge("СЕР.");
        t.addVariant("СЕРИ", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("НОМЕР", PersonIdTokenTyps.NUMBER);
        t.addAbridge("НОМ.");
        t.addAbridge("Н-Р");
        t.addVariant("№", false);
        t.addVariant("N", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("ВЫДАТЬ", PersonIdTokenTyps.VIDAN);
        t.addVariant("ВЫДАВАТЬ", false);
        t.addVariant("ДАТА ВЫДАЧИ", false);
        t.addVariant("ДАТА РЕГИСТРАЦИИ", false);
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("КОД ПОДРАЗДЕЛЕНИЯ", PersonIdTokenTyps.CODE);
        t.addAbridge("К/П");
        t.addAbridge("К.П.");
        t.addVariant("КОД", false);
        t.addAbridge("КОД ПОДР");
        PersonIdToken.m_Ontology.add(t);
        t = Termin._new170("РЕГИСТРАЦИЯ", PersonIdTokenTyps.ADDRESS);
        t.addVariant("ЗАРЕГИСТРИРОВАН", false);
        t.addVariant("АДРЕС РЕГИСТРАЦИИ", false);
        t.addVariant("ЗАРЕГИСТРИРОВАННЫЙ", false);
        t.addAbridge("ПРОПИСАН");
        t.addVariant("АДРЕС ПРОПИСКИ", false);
        t.addVariant("АДРЕС ПО ПРОПИСКЕ", false);
        PersonIdToken.m_Ontology.add(t);
    }
    
    static _new2590(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonIdToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2593(_arg1, _arg2, _arg3) {
        let res = new PersonIdToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2595(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonIdToken(_arg1, _arg2);
        res.typ = _arg3;
        res.referent = _arg4;
        return res;
    }
    
    static static_constructor() {
        PersonIdToken.m_Ontology = null;
    }
}


PersonIdToken.static_constructor();

module.exports = PersonIdToken