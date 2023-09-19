/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const NounPhraseParseAttr = require("./../NounPhraseParseAttr");
const TerminParseAttr = require("./../TerminParseAttr");
const MetaToken = require("./../../MetaToken");
const MorphLang = require("./../../../morph/MorphLang");
const NumberToken = require("./../../NumberToken");
const Termin = require("./../Termin");
const TextToken = require("./../../TextToken");
const BlkTyps = require("./BlkTyps");
const TerminCollection = require("./../TerminCollection");
const NumberHelper = require("./../NumberHelper");
const NounPhraseHelper = require("./../NounPhraseHelper");

class BlockLine extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.isAllUpper = false;
        this.hasVerb = false;
        this.isExistName = false;
        this.hasContentItemTail = false;
        this.words = 0;
        this.notWords = 0;
        this.numberEnd = null;
        this.typ = BlkTyps.UNDEFINED;
    }
    
    static create(t, names) {
        if (t === null) 
            return null;
        let res = new BlockLine(t, t);
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt !== t && tt.isNewlineBefore) 
                break;
            else 
                res.endToken = tt;
        }
        let nums = 0;
        while (t !== null && t.next !== null && t.endChar <= res.endChar) {
            if (t instanceof NumberToken) {
            }
            else {
                let rom = NumberHelper.tryParseRoman(t);
                if (rom !== null && rom.endToken.next !== null) 
                    t = rom.endToken;
                else 
                    break;
            }
            if (t.next.isChar('.')) {
            }
            else if ((t.next instanceof TextToken) && !t.next.chars.isAllLower) {
            }
            else 
                break;
            res.numberEnd = t;
            t = t.next;
            if (t.isChar('.') && t.next !== null) {
                res.numberEnd = t;
                t = t.next;
            }
            if (t.isNewlineBefore) 
                return res;
            nums++;
        }
        let tok = BlockLine.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok === null) {
            let npt1 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt1 !== null && npt1.endToken !== npt1.beginToken) 
                tok = BlockLine.m_Ontology.tryParse(npt1.noun.beginToken, TerminParseAttr.NO);
        }
        if (tok !== null) {
            if (t.previous !== null && t.previous.isChar(':')) 
                tok = null;
        }
        if (tok !== null) {
            let _typ = BlkTyps.of(tok.termin.tag);
            if (_typ === BlkTyps.CONSLUSION) {
                if (t.isNewlineAfter) {
                }
                else if (t.next !== null && t.next.morph._class.isPreposition && t.next.next !== null) {
                    let tok2 = BlockLine.m_Ontology.tryParse(t.next.next, TerminParseAttr.NO);
                    if (tok2 !== null && (BlkTyps.of(tok2.termin.tag)) === BlkTyps.CHAPTER) {
                    }
                    else 
                        tok = null;
                }
                else 
                    tok = null;
            }
            if (t.kit.baseLanguage !== t.morph.language) 
                tok = null;
            if (_typ === BlkTyps.INDEX && !t.isValue("ОГЛАВЛЕНИЕ", null)) {
                if (!t.isNewlineAfter && t.next !== null) {
                    let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null && npt.isNewlineAfter && npt.morph._case.isGenitive) 
                        tok = null;
                    else if (npt === null) 
                        tok = null;
                }
            }
            if ((_typ === BlkTyps.INTRO && tok !== null && !tok.isNewlineAfter) && t.isValue("ВВЕДЕНИЕ", null)) {
                let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.morph._case.isGenitive) 
                    tok = null;
            }
            if (tok !== null) {
                if (res.numberEnd === null) {
                    res.numberEnd = tok.endToken;
                    if (res.numberEnd.endChar > res.endChar) 
                        res.endToken = res.numberEnd;
                }
                res.typ = _typ;
                t = tok.endToken;
                if (t.next !== null && t.next.isCharOf(":.")) {
                    t = t.next;
                    res.endToken = t;
                }
                if (t.isNewlineAfter || t.next === null) 
                    return res;
                t = t.next;
            }
        }
        if (t.isChar('§') && (t.next instanceof NumberToken)) {
            res.typ = BlkTyps.CHAPTER;
            res.numberEnd = t;
            t = t.next;
        }
        if (names !== null) {
            let tok2 = names.tryParse(t, TerminParseAttr.NO);
            if (tok2 !== null && tok2.endToken.isNewlineAfter) {
                res.endToken = tok2.endToken;
                res.isExistName = true;
                if (res.typ === BlkTyps.UNDEFINED) {
                    let li2 = BlockLine.create((res.numberEnd === null ? null : res.numberEnd.next), null);
                    if (li2 !== null && ((li2.typ === BlkTyps.LITERATURE || li2.typ === BlkTyps.INTRO || li2.typ === BlkTyps.CONSLUSION))) 
                        res.typ = li2.typ;
                    else 
                        res.typ = BlkTyps.CHAPTER;
                }
                return res;
            }
        }
        let t1 = res.endToken;
        if ((((t1 instanceof NumberToken) || t1.isChar('.'))) && t1.previous !== null) {
            t1 = t1.previous;
            if (t1.isChar('.')) {
                res.hasContentItemTail = true;
                for (; t1 !== null && t1.beginChar > res.beginChar; t1 = t1.previous) {
                    if (!t1.isChar('.')) 
                        break;
                }
            }
        }
        res.isAllUpper = true;
        for (; t !== null && t.endChar <= t1.endChar; t = t.next) {
            if (!(t instanceof TextToken) || !t.chars.isLetter) 
                res.notWords++;
            else {
                let mc = t.getMorphClassInDictionary();
                if (mc.isUndefined) 
                    res.notWords++;
                else if (t.lengthChar > 2) 
                    res.words++;
                if (!t.chars.isAllUpper) 
                    res.isAllUpper = false;
                if (t.isPureVerb) {
                    if (!t.term.endsWith("ING")) 
                        res.hasVerb = true;
                }
            }
        }
        if (res.typ === BlkTyps.UNDEFINED) {
            let npt = NounPhraseHelper.tryParse((res.numberEnd === null ? res.beginToken : res.numberEnd.next), NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                if (npt.noun.isValue("ХАРАКТЕРИСТИКА", null) || npt.noun.isValue("СОДЕРЖАНИЕ", "ЗМІСТ")) {
                    let ok = true;
                    for (let tt = npt.endToken.next; tt !== null && tt.endChar <= res.endChar; tt = tt.next) {
                        if (tt.isChar('.')) 
                            continue;
                        let npt2 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                        if (npt2 === null || !npt2.morph._case.isGenitive) {
                            ok = false;
                            break;
                        }
                        tt = npt2.endToken;
                        if (tt.endChar > res.endChar) {
                            res.endToken = tt;
                            if (!tt.isNewlineAfter) {
                                for (; res.endToken.next !== null; res.endToken = res.endToken.next) {
                                    if (res.endToken.isNewlineAfter) 
                                        break;
                                }
                            }
                        }
                    }
                    if (ok) {
                        res.typ = BlkTyps.INTRO;
                        res.isExistName = true;
                    }
                }
                else if (npt.noun.isValue("ВЫВОД", "ВИСНОВОК") || npt.noun.isValue("РЕЗУЛЬТАТ", "ДОСЛІДЖЕННЯ")) {
                    let ok = true;
                    for (let tt = npt.endToken.next; tt !== null && tt.endChar <= res.endChar; tt = tt.next) {
                        if (tt.isCharOf(",.") || tt.isAnd) 
                            continue;
                        let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                        if (npt1 !== null) {
                            if (npt1.noun.isValue("РЕЗУЛЬТАТ", "ДОСЛІДЖЕННЯ") || npt1.noun.isValue("РЕКОМЕНДАЦИЯ", "РЕКОМЕНДАЦІЯ") || npt1.noun.isValue("ИССЛЕДОВАНИЕ", "ДОСЛІДЖЕННЯ")) {
                                tt = npt1.endToken;
                                if (tt.endChar > res.endChar) {
                                    res.endToken = tt;
                                    if (!tt.isNewlineAfter) {
                                        for (; res.endToken.next !== null; res.endToken = res.endToken.next) {
                                            if (res.endToken.isNewlineAfter) 
                                                break;
                                        }
                                    }
                                }
                                continue;
                            }
                        }
                        ok = false;
                        break;
                    }
                    if (ok) {
                        res.typ = BlkTyps.CONSLUSION;
                        res.isExistName = true;
                    }
                }
                if (res.typ === BlkTyps.UNDEFINED && npt !== null && npt.endChar <= res.endChar) {
                    let ok = false;
                    let publ = 0;
                    if (BlockLine._isPub(npt)) {
                        ok = true;
                        publ = 1;
                    }
                    else if ((npt.noun.isValue("СПИСОК", null) || npt.noun.isValue("УКАЗАТЕЛЬ", "ПОКАЖЧИК") || npt.noun.isValue("ПОЛОЖЕНИЕ", "ПОЛОЖЕННЯ")) || npt.noun.isValue("ВЫВОД", "ВИСНОВОК") || npt.noun.isValue("РЕЗУЛЬТАТ", "ДОСЛІДЖЕННЯ")) {
                        if (npt.endChar === res.endChar) 
                            return null;
                        ok = true;
                    }
                    if (ok) {
                        if (npt.beginToken === npt.endToken && npt.noun.isValue("СПИСОК", null) && npt.endChar === res.endChar) 
                            ok = false;
                        for (let tt = npt.endToken.next; tt !== null && tt.endChar <= res.endChar; tt = tt.next) {
                            if (tt.isCharOf(",.:") || tt.isAnd || tt.morph._class.isPreposition) 
                                continue;
                            if (tt.isValue("ОТРАЖЕНЫ", "ВІДОБРАЖЕНІ")) 
                                continue;
                            npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                            if (npt === null) {
                                ok = false;
                                break;
                            }
                            if (((BlockLine._isPub(npt) || npt.noun.isValue("РАБОТА", "РОБОТА") || npt.noun.isValue("ИССЛЕДОВАНИЕ", "ДОСЛІДЖЕННЯ")) || npt.noun.isValue("АВТОР", null) || npt.noun.isValue("ТРУД", "ПРАЦЯ")) || npt.noun.isValue("ТЕМА", null) || npt.noun.isValue("ДИССЕРТАЦИЯ", "ДИСЕРТАЦІЯ")) {
                                tt = npt.endToken;
                                if (BlockLine._isPub(npt)) 
                                    publ++;
                                if (tt.endChar > res.endChar) {
                                    res.endToken = tt;
                                    if (!tt.isNewlineAfter) {
                                        for (; res.endToken.next !== null; res.endToken = res.endToken.next) {
                                            if (res.endToken.isNewlineAfter) 
                                                break;
                                        }
                                    }
                                }
                                continue;
                            }
                            ok = false;
                            break;
                        }
                        if (ok) {
                            res.typ = BlkTyps.LITERATURE;
                            res.isExistName = true;
                            if (publ === 0 && (res.endChar < ((Utils.intDiv(res.kit.sofa.text.length * 2, 3))))) {
                                if (res.numberEnd !== null) 
                                    res.typ = BlkTyps.MISC;
                                else 
                                    res.typ = BlkTyps.UNDEFINED;
                            }
                        }
                    }
                }
            }
        }
        return res;
    }
    
    static _isPub(t) {
        if (t === null) 
            return false;
        if (((t.noun.isValue("ПУБЛИКАЦИЯ", "ПУБЛІКАЦІЯ") || t.noun.isValue("REFERENCE", null) || t.noun.isValue("ЛИТЕРАТУРА", "ЛІТЕРАТУРА")) || t.noun.isValue("ИСТОЧНИК", "ДЖЕРЕЛО") || t.noun.isValue("БИБЛИОГРАФИЯ", "БІБЛІОГРАФІЯ")) || t.noun.isValue("ДОКУМЕНТ", null)) 
            return true;
        for (const a of t.adjectives) {
            if (a.isValue("БИБЛИОГРАФИЧЕСКИЙ", null)) 
                return true;
        }
        return false;
    }
    
    static initialize() {
        if (BlockLine.m_Ontology !== null) 
            return;
        BlockLine.m_Ontology = new TerminCollection();
        for (const s of ["СОДЕРЖАНИЕ", "СОДЕРЖИМОЕ", "ОГЛАВЛЕНИЕ", "ПЛАН", "PLAN", "ЗМІСТ", "CONTENTS", "INDEX"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.INDEX));
        }
        for (const s of ["ГЛАВА", "CHAPTER", "РАЗДЕЛ", "ПАРАГРАФ", "VOLUME", "SECTION", "РОЗДІЛ"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.CHAPTER));
        }
        for (const s of ["ВВЕДЕНИЕ", "ВСТУПЛЕНИЕ", "ПРЕДИСЛОВИЕ", "INTRODUCTION"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.INTRO));
        }
        for (const s of ["ВСТУП", "ПЕРЕДМОВА"]) {
            BlockLine.m_Ontology.add(Termin._new690(s, MorphLang.UA, BlkTyps.INTRO));
        }
        for (const s of ["ВЫВОДЫ", "ВЫВОД", "ЗАКЛЮЧЕНИЕ", "CONCLUSION", "ВИСНОВОК", "ВИСНОВКИ"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.CONSLUSION));
        }
        for (const s of ["ПРИЛОЖЕНИЕ", "APPENDIX", "ДОДАТОК"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.APPENDIX));
        }
        for (const s of ["СПИСОК СОКРАЩЕНИЙ", "СПИСОК УСЛОВНЫХ СОКРАЩЕНИЙ", "СПИСОК ИСПОЛЬЗУЕМЫХ СОКРАЩЕНИЙ", "УСЛОВНЫЕ СОКРАЩЕНИЯ", "ОБЗОР ЛИТЕРАТУРЫ", "АННОТАЦИЯ", "ANNOTATION", "БЛАГОДАРНОСТИ", "SUPPLEMENT", "ABSTRACT", "СПИСОК СКОРОЧЕНЬ", "ПЕРЕЛІК УМОВНИХ СКОРОЧЕНЬ", "СПИСОК ВИКОРИСТОВУВАНИХ СКОРОЧЕНЬ", "УМОВНІ СКОРОЧЕННЯ", "ОГЛЯД ЛІТЕРАТУРИ", "АНОТАЦІЯ", "ПОДЯКИ"]) {
            BlockLine.m_Ontology.add(Termin._new170(s, BlkTyps.MISC));
        }
    }
    
    static static_constructor() {
        BlockLine.m_Ontology = null;
    }
}


BlockLine.static_constructor();

module.exports = BlockLine