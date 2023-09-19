/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MetaToken = require("./../../MetaToken");
const MorphLang = require("./../../../morph/MorphLang");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphClass = require("./../../../morph/MorphClass");
const TextToken = require("./../../TextToken");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");

// Анализ вводных слов и словосочетаний
class ParenthesisToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.ref = null;
    }
    
    static tryAttach(t) {
        if (t === null) 
            return null;
        let tok = ParenthesisToken.m_Termins.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            let res = new ParenthesisToken(t, tok.endToken);
            return res;
        }
        if (!(t instanceof TextToken)) 
            return null;
        let mc = t.getMorphClassInDictionary();
        let ok = false;
        let t1 = null;
        if (mc.isAdverb) 
            ok = true;
        else if (mc.isAdjective) {
            if (t.morph.containsAttr("сравн.", null) && t.morph.containsAttr("кач.прил.", null)) 
                ok = true;
        }
        if (ok && t.next !== null) {
            if (t.next.isChar(',')) 
                return new ParenthesisToken(t, t);
            t1 = t.next;
            if (t1.getMorphClassInDictionary().equals(MorphClass.VERB)) {
                if (t1.morph.containsAttr("н.вр.", null) && t1.morph.containsAttr("нес.в.", null) && t1.morph.containsAttr("дейст.з.", null)) 
                    return new ParenthesisToken(t, t1);
            }
        }
        t1 = null;
        if ((t.isValue("В", null) && t.next !== null && t.next.isValue("СООТВЕТСТВИЕ", null)) && t.next.next !== null && t.next.next.morph._class.isPreposition) 
            t1 = t.next.next.next;
        else if (t.isValue("СОГЛАСНО", null)) 
            t1 = t.next;
        else if (t.isValue("В", null) && t.next !== null) {
            if (t.next.isValue("СИЛА", null)) 
                t1 = t.next.next;
            else if (t.next.morph._class.isAdjective || t.next.morph._class.isPronoun) {
                let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) {
                    if (npt.noun.isValue("ВИД", null) || npt.noun.isValue("СЛУЧАЙ", null) || npt.noun.isValue("СФЕРА", null)) 
                        return new ParenthesisToken(t, npt.endToken);
                }
            }
        }
        if (t1 !== null) {
            if (t1.next !== null) {
                let npt1 = NounPhraseHelper.tryParse(t1, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null) {
                    if (npt1.noun.isValue("НОРМА", null) || npt1.noun.isValue("ПОЛОЖЕНИЕ", null) || npt1.noun.isValue("УКАЗАНИЕ", null)) 
                        t1 = npt1.endToken.next;
                }
            }
            let r = t1.getReferent();
            if (r !== null) {
                let res = ParenthesisToken._new1173(t, t1, r);
                if (t1.next !== null && t1.next.isComma) {
                    let sila = false;
                    for (let ttt = t1.next.next; ttt !== null; ttt = ttt.next) {
                        if (ttt.isValue("СИЛА", null) || ttt.isValue("ДЕЙСТВИЕ", null)) {
                            sila = true;
                            continue;
                        }
                        if (ttt.isComma) {
                            if (sila) 
                                res.endToken = ttt.previous;
                            break;
                        }
                        if (BracketHelper.canBeStartOfSequence(ttt, false, false)) 
                            break;
                    }
                }
                return res;
            }
            let npt = NounPhraseHelper.tryParse(t1, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) 
                return new ParenthesisToken(t, npt.endToken);
        }
        let tt = t;
        if (tt.isValue("НЕ", null) && t !== null) 
            tt = tt.next;
        if (tt.morph._class.isPreposition && tt !== null) {
            tt = tt.next;
            let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
            if (npt1 !== null) {
                tt = npt1.endToken;
                if (tt.next !== null && tt.next.isComma) 
                    return new ParenthesisToken(t, tt.next);
                if (npt1.noun.isValue("ОЧЕРЕДЬ", null)) 
                    return new ParenthesisToken(t, tt);
            }
        }
        if (t.isValue("ВЕДЬ", null)) 
            return new ParenthesisToken(t, t);
        return null;
    }
    
    static initialize() {
        if (ParenthesisToken.m_Termins !== null) 
            return;
        ParenthesisToken.m_Termins = new TerminCollection();
        for (const s of ["ИТАК", "СЛЕДОВАТЕЛЬНО", "ТАКИМ ОБРАЗОМ"]) {
            ParenthesisToken.m_Termins.add(new Termin(s, MorphLang.RU, true));
        }
    }
    
    static _new1173(_arg1, _arg2, _arg3) {
        let res = new ParenthesisToken(_arg1, _arg2);
        res.ref = _arg3;
        return res;
    }
    
    static static_constructor() {
        ParenthesisToken.m_Termins = null;
    }
}


ParenthesisToken.static_constructor();

module.exports = ParenthesisToken