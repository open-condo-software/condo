/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MetaToken = require("./../../MetaToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphLang = require("./../../../morph/MorphLang");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const Termin = require("./../../core/Termin");
const BusinessFactItemTyp = require("./BusinessFactItemTyp");
const TextToken = require("./../../TextToken");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const BusinessFactKind = require("./../BusinessFactKind");
const TerminCollection = require("./../../core/TerminCollection");

class BusinessFactItem extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.typ = BusinessFactItemTyp.BASE;
        this.baseKind = BusinessFactKind.UNDEFINED;
        this.isBasePassive = false;
    }
    
    static tryParse(t) {
        if (t === null) 
            return null;
        let res = BusinessFactItem._tryParse(t);
        if (res === null) 
            return null;
        for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
            if (tt.morph._class.isPreposition) 
                continue;
            if (!(tt instanceof TextToken)) 
                break;
            let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
            if (npt === null) 
                break;
            let rr = BusinessFactItem._tryParse(tt);
            if (rr !== null) {
                if (rr.baseKind === res.baseKind) {
                }
                else if (rr.baseKind === BusinessFactKind.GET && res.baseKind === BusinessFactKind.FINANCE) 
                    res.baseKind = rr.baseKind;
                else 
                    break;
                tt = res.endToken = rr.endToken;
                continue;
            }
            if ((res.baseKind === BusinessFactKind.FINANCE || npt.noun.isValue("РЫНОК", null) || npt.noun.isValue("СДЕЛКА", null)) || npt.noun.isValue("РИНОК", null) || npt.noun.isValue("УГОДА", null)) {
                res.endToken = tt;
                continue;
            }
            break;
        }
        return res;
    }
    
    static _tryParse(t) {
        let tok = BusinessFactItem.m_BaseOnto.tryParse(t, TerminParseAttr.NO);
        if (tok === null && t.morph._class.isVerb && t.next !== null) 
            tok = BusinessFactItem.m_BaseOnto.tryParse(t.next, TerminParseAttr.NO);
        if (tok !== null) {
            let ki = BusinessFactKind.of(tok.termin.tag);
            if (ki !== BusinessFactKind.UNDEFINED) 
                return BusinessFactItem._new615(t, tok.endToken, BusinessFactItemTyp.BASE, ki, tok.morph, tok.termin.tag2 !== null);
            for (let tt = tok.endToken.next; tt !== null; tt = tt.next) {
                if (tt.morph._class.isPreposition) 
                    continue;
                tok = BusinessFactItem.m_BaseOnto.tryParse(tt, TerminParseAttr.NO);
                if (tok === null) 
                    continue;
                ki = BusinessFactKind.of(tok.termin.tag);
                if (ki !== BusinessFactKind.UNDEFINED) 
                    return BusinessFactItem._new616(t, tok.endToken, BusinessFactItemTyp.BASE, ki, tok.morph);
                tt = tok.endToken;
            }
        }
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null) {
            if (((((npt.noun.isValue("АКЦИОНЕР", null) || npt.noun.isValue("ВЛАДЕЛЕЦ", null) || npt.noun.isValue("ВЛАДЕЛИЦА", null)) || npt.noun.isValue("СОВЛАДЕЛЕЦ", null) || npt.noun.isValue("СОВЛАДЕЛИЦА", null)) || npt.noun.isValue("АКЦІОНЕР", null) || npt.noun.isValue("ВЛАСНИК", null)) || npt.noun.isValue("ВЛАСНИЦЯ", null) || npt.noun.isValue("СПІВВЛАСНИК", null)) || npt.noun.isValue("СПІВВЛАСНИЦЯ", null)) 
                return BusinessFactItem._new616(t, npt.endToken, BusinessFactItemTyp.BASE, BusinessFactKind.HAVE, npt.morph);
        }
        if (npt !== null) {
            if ((npt.noun.isValue("ОСНОВАТЕЛЬ", null) || npt.noun.isValue("ОСНОВАТЕЛЬНИЦА", null) || npt.noun.isValue("ЗАСНОВНИК", null)) || npt.noun.isValue("ЗАСНОВНИЦЯ", null)) 
                return BusinessFactItem._new616(t, npt.endToken, BusinessFactItemTyp.BASE, BusinessFactKind.CREATE, npt.morph);
        }
        return null;
    }
    
    static initialize() {
        if (BusinessFactItem.m_BaseOnto !== null) 
            return;
        BusinessFactItem.m_BaseOnto = new TerminCollection();
        for (const s of ["КУПИТЬ", "ПОКУПАТЬ", "ПРИОБРЕТАТЬ", "ПРИОБРЕСТИ", "ПОКУПКА", "ПРИОБРЕТЕНИЕ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.GET));
        }
        for (const s of ["КУПИТИ", "КУПУВАТИ", "КУПУВАТИ", "ПРИДБАТИ", "ПОКУПКА", "ПРИДБАННЯ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.GET, MorphLang.UA));
        }
        for (const s of ["ПРОДАТЬ", "ПРОДАВАТЬ", "ПРОДАЖА"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.SELL));
        }
        for (const s of ["ПРОДАТИ", "ПРОДАВАТИ", "ПРОДАЖ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.SELL, MorphLang.UA));
        }
        for (const s of ["ФИНАНСИРОВАТЬ", "СПОНСИРОВАТЬ", "ПРОФИНАНСИРОВАТЬ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.FINANCE));
        }
        for (const s of ["ФІНАНСУВАТИ", "СПОНСОРУВАТИ", "ПРОФІНАНСУВАТИ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.FINANCE, MorphLang.UA));
        }
        for (const s of ["ВЛАДЕТЬ", "РАСПОРЯЖАТЬСЯ", "КОНТРОЛИРОВАТЬ", "ПРИНАДЛЕЖАТЬ", "СТАТЬ ВЛАДЕЛЬЦЕМ", "КОНСОЛИДИРОВАТЬ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.HAVE));
        }
        for (const s of ["ВОЛОДІТИ", "РОЗПОРЯДЖАТИСЯ", "КОНТРОЛЮВАТИ", "НАЛЕЖАТИ", "СТАТИ ВЛАСНИКОМ", "КОНСОЛІДУВАТИ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.HAVE, MorphLang.UA));
        }
        for (const s of ["ПРИНАДЛЕЖАЩИЙ", "КОНТРОЛИРУЕМЫЙ", "ВЛАДЕЕМЫЙ", "ПЕРЕЙТИ ПОД КОНТРОЛЬ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new349(s, BusinessFactKind.HAVE, s));
        }
        for (const s of ["НАЛЕЖНИЙ", "КОНТРОЛЬОВАНИЙ", "ВЛАДЕЕМЫЙ", "ПЕРЕЙТИ ПІД КОНТРОЛЬ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new628(s, BusinessFactKind.HAVE, s, MorphLang.UA));
        }
        for (const s of ["ЗАКРЫТЬ СДЕЛКУ", "СОВЕРШИТЬ СДЕЛКУ", "ЗАВЕРШИТЬ СДЕЛКУ", "ЗАКЛЮЧИТЬ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.UNDEFINED));
        }
        for (const s of ["ЗАКРИТИ ОПЕРАЦІЮ", "ЗДІЙСНИТИ ОПЕРАЦІЮ", "ЗАВЕРШИТИ ОПЕРАЦІЮ", "УКЛАСТИ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.UNDEFINED, MorphLang.UA));
        }
        for (const s of ["ДОХОД", "ПРИБЫЛЬ", "ВЫРУЧКА"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.PROFIT));
        }
        for (const s of ["ДОХІД", "ПРИБУТОК", "ВИРУЧКА"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.PROFIT, MorphLang.UA));
        }
        for (const s of ["УБЫТОК"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.DAMAGES));
        }
        for (const s of ["ЗБИТОК"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.DAMAGES, MorphLang.UA));
        }
        for (const s of ["СОГЛАШЕНИЕ", "ДОГОВОР"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.AGREEMENT));
        }
        for (const s of ["УГОДА", "ДОГОВІР"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.AGREEMENT, MorphLang.UA));
        }
        for (const s of ["ИСК", "СУДЕБНЫЙ ИСК"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.LAWSUIT));
        }
        for (const s of ["ПОЗОВ", "СУДОВИЙ ПОЗОВ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.LAWSUIT, MorphLang.UA));
        }
        for (const s of ["ДОЧЕРНЕЕ ПРЕДПРИЯТИЕ", "ДОЧЕРНЕЕ ПОДРАЗДЕЛЕНИЕ", "ДОЧЕРНЯЯ КОМПАНИЯ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new170(s, BusinessFactKind.SUBSIDIARY));
        }
        for (const s of ["ДОЧІРНЄ ПІДПРИЄМСТВО", "ДОЧІРНІЙ ПІДРОЗДІЛ", "ДОЧІРНЯ КОМПАНІЯ"]) {
            BusinessFactItem.m_BaseOnto.add(Termin._new348(s, BusinessFactKind.SUBSIDIARY, MorphLang.UA));
        }
    }
    
    static _new615(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new BusinessFactItem(_arg1, _arg2);
        res.typ = _arg3;
        res.baseKind = _arg4;
        res.morph = _arg5;
        res.isBasePassive = _arg6;
        return res;
    }
    
    static _new616(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new BusinessFactItem(_arg1, _arg2);
        res.typ = _arg3;
        res.baseKind = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static static_constructor() {
        BusinessFactItem.m_BaseOnto = null;
    }
}


BusinessFactItem.static_constructor();

module.exports = BusinessFactItem