/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphGender = require("./../../morph/MorphGender");
const TerminParseAttr = require("./TerminParseAttr");
const MetaToken = require("./../MetaToken");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MorphCollection = require("./../MorphCollection");
const Token = require("./../Token");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const BracketHelper = require("./BracketHelper");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MorphLang = require("./../../morph/MorphLang");
const ReferentToken = require("./../ReferentToken");
const NumberSpellingType = require("./../NumberSpellingType");
const NumberToken = require("./../NumberToken");
const MiscHelper = require("./MiscHelper");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const TerminToken = require("./TerminToken");

/**
 * Термин, понятие, система обозначений чего-либо и варианты его написания. Элемент словаря TerminCollection.
 * 
 * Термин словаря
 */
class Termin {
    
    /**
     * Создать термин из строки с добавлением всех морфологических вариантов написания
     * @param source строка
     * @param _lang возможный язык (null, если совпадает с текущим языком анализируемого текста)
     * @param sourceIsNormal при true морфварианты не добавляются 
     * (эквивалентно вызову InitByNormalText)
     */
    constructor(source = null, _lang = null, sourceIsNormal = false) {
        this.terms = new Array();
        this.additionalVars = null;
        this.m_CanonicText = null;
        this.ignoreTermsOrder = false;
        this.acronym = null;
        this.acronymSmart = null;
        this.acronymCanBeLower = false;
        this.acronymCanBeSmart = false;
        this.abridges = null;
        this.lang = new MorphLang();
        this.tag = null;
        this.tag2 = null;
        this.tag3 = null;
        if (source === null) 
            return;
        if (sourceIsNormal || Termin.ASSIGN_ALL_TEXTS_AS_NORMAL) {
            this.initByNormalText(source, _lang);
            return;
        }
        try {
            let toks = MorphologyService.process(source, _lang, null);
            if (toks !== null) {
                for (let i = 0; i < toks.length; i++) {
                    let tt = new TextToken(toks[i], null);
                    this.terms.push(new Termin.Term(tt, !sourceIsNormal));
                }
            }
        } catch (ex) {
        }
        this.lang = new MorphLang();
        if (_lang !== null) 
            this.lang.value = _lang.value;
    }
    
    /**
     * Быстрая инициализация без морф.вариантов, производится только 
     * токенизация текста. Используется для ускорения работы со словарём в случае, 
     * когда изначально известно, что на входе уже нормализованные строки.
     * @param text исходно нормализованный текст
     * @param _lang возможный язык (можно null)
     */
    initByNormalText(text, _lang = null) {
        if (Utils.isNullOrEmpty(text)) 
            return;
        text = text.toUpperCase();
        if (text.indexOf('\'') >= 0) 
            text = Utils.replaceString(text, "'", "");
        let tok = false;
        let sp = false;
        for (const ch of text) {
            if (!Utils.isLetter(ch)) {
                if (ch === ' ') 
                    sp = true;
                else {
                    tok = true;
                    break;
                }
            }
        }
        if (!tok && !sp) {
            let tt = new TextToken(null, null);
            tt.term = text;
            this.terms.push(new Termin.Term(tt, false));
        }
        else if (!tok && sp) {
            let wrds = Utils.splitString(text, ' ', false);
            for (let i = 0; i < wrds.length; i++) {
                if (Utils.isNullOrEmpty(wrds[i])) 
                    continue;
                let tt = new TextToken(null, null);
                tt.term = wrds[i];
                this.terms.push(new Termin.Term(tt, false));
            }
        }
        else {
            let toks = MorphologyService.tokenize(text);
            if (toks !== null) {
                for (let i = 0; i < toks.length; i++) {
                    let tt = new TextToken(toks[i], null);
                    this.terms.push(new Termin.Term(tt, false));
                }
            }
        }
        this.lang = new MorphLang();
        if (_lang !== null) 
            this.lang.value = _lang.value;
    }
    
    initBy(begin, end, _tag = null, addLemmaVariant = false) {
        if (_tag !== null) 
            this.tag = _tag;
        for (let t = begin; t !== null; t = t.next) {
            if (this.lang.isUndefined && !t.morph.language.isUndefined) 
                this.lang = t.morph.language;
            let tt = Utils.as(t, TextToken);
            if (tt !== null) 
                this.terms.push(new Termin.Term(tt, addLemmaVariant));
            else if (t instanceof NumberToken) 
                this.terms.push(new Termin.Term(null, false, t.value));
            if (t === end) 
                break;
        }
    }
    
    /**
     * Добавить дополнительный вариант полного написания
     * @param _var строка варианта
     * @param sourceIsNormal при true морфварианты не добавляются, иначе добавляются
     */
    addVariant(_var, sourceIsNormal = false) {
        if (this.additionalVars === null) 
            this.additionalVars = new Array();
        this.additionalVars.push(new Termin(_var, MorphLang.UNKNOWN, sourceIsNormal));
    }
    
    /**
     * Добавить дополнительный вариант написания
     * @param t термин
     */
    addVariantTerm(t) {
        if (this.additionalVars === null) 
            this.additionalVars = new Array();
        this.additionalVars.push(t);
    }
    
    get canonicText() {
        if (this.m_CanonicText !== null) 
            return this.m_CanonicText;
        if (this.terms.length > 0) {
            let tmp = new StringBuilder();
            for (const v of this.terms) {
                if (tmp.length > 0) 
                    tmp.append(' ');
                tmp.append(v.canonicalText);
            }
            this.m_CanonicText = tmp.toString();
        }
        else if (this.acronym !== null) 
            this.m_CanonicText = this.acronym;
        return (this.m_CanonicText != null ? this.m_CanonicText : "?");
    }
    set canonicText(value) {
        this.m_CanonicText = value;
        return value;
    }
    
    /**
     * Установить стандартную аббревиатуру
     */
    setStdAcronim(smart) {
        let acr = new StringBuilder();
        for (const t of this.terms) {
            let s = t.canonicalText;
            if (Utils.isNullOrEmpty(s)) 
                continue;
            if (s.length > 2) 
                acr.append(s[0]);
        }
        if (acr.length > 1) {
            if (smart) 
                this.acronymSmart = acr.toString();
            else 
                this.acronym = acr.toString();
        }
    }
    
    /**
     * Добавить сокращение в термин
     * @param abr сокращение, например, "нас.п." или "д-р наук"
     * @return разобранное сокращение, добавленное в термин
     */
    addAbridge(abr) {
        if (abr === "В/ГОР") {
        }
        let a = new Termin.Abridge();
        if (this.abridges === null) 
            this.abridges = new Array();
        let i = 0;
        for (i = 0; i < abr.length; i++) {
            if (!Utils.isLetter(abr[i])) 
                break;
        }
        if (i === 0) 
            return null;
        a.parts.push(Termin.AbridgePart._new886(abr.substring(0, 0 + i).toUpperCase()));
        this.abridges.push(a);
        if (((i + 1) < abr.length) && abr[i] === '-') 
            a.tail = abr.substring(i + 1).toUpperCase();
        else if (i < abr.length) {
            if (!Utils.isWhitespace(abr[i])) 
                a.parts[0].hasDelim = true;
            for (; i < abr.length; i++) {
                if (Utils.isLetter(abr[i])) {
                    let j = 0;
                    for (j = i + 1; j < abr.length; j++) {
                        if (!Utils.isLetter(abr[j])) 
                            break;
                    }
                    let p = Termin.AbridgePart._new886(abr.substring(i, i + j - i).toUpperCase());
                    if (j < abr.length) {
                        if (!Utils.isWhitespace(abr[j])) 
                            p.hasDelim = true;
                    }
                    a.parts.push(p);
                    i = j;
                }
            }
        }
        return a;
    }
    
    get gender() {
        if (this.terms.length > 0) {
            if (this.terms.length > 0 && this.terms[0].isAdjective && this.terms[this.terms.length - 1].isNoun) 
                return this.terms[this.terms.length - 1].gender;
            return this.terms[0].gender;
        }
        else 
            return MorphGender.UNDEFINED;
    }
    set gender(value) {
        if (this.terms.length > 0) 
            this.terms[0].gender = value;
        return value;
    }
    
    copyTo(dst) {
        dst.terms = this.terms;
        dst.ignoreTermsOrder = this.ignoreTermsOrder;
        dst.acronym = this.acronym;
        dst.abridges = this.abridges;
        dst.lang = this.lang;
        dst.m_CanonicText = this.m_CanonicText;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.terms.length > 0) {
            for (let i = 0; i < this.terms.length; i++) {
                if (i > 0) 
                    res.append(' ');
                res.append(this.terms[i].canonicalText);
            }
        }
        if (this.acronym !== null) {
            if (res.length > 0) 
                res.append(", ");
            res.append(this.acronym);
        }
        if (this.acronymSmart !== null) {
            if (res.length > 0) 
                res.append(", ");
            res.append(this.acronymSmart);
        }
        if (this.abridges !== null) {
            for (const a of this.abridges) {
                if (res.length > 0) 
                    res.append(", ");
                res.append(a);
            }
        }
        return res.toString();
    }
    
    addStdAbridges() {
        if (this.terms.length !== 2) 
            return;
        let first = this.terms[0].canonicalText;
        let i = 0;
        for (i = 0; i < Termin.m_StdAbridePrefixes.length; i++) {
            if (first.startsWith(Termin.m_StdAbridePrefixes[i])) 
                break;
        }
        if (i >= Termin.m_StdAbridePrefixes.length) 
            return;
        let head = Termin.m_StdAbridePrefixes[i];
        let second = this.terms[1].canonicalText;
        for (i = 0; i < head.length; i++) {
            if (!LanguageHelper.isCyrillicVowel(head[i])) {
                let a = new Termin.Abridge();
                a.addPart(head.substring(0, 0 + i + 1), false);
                a.addPart(second, false);
                if (this.abridges === null) 
                    this.abridges = new Array();
                this.abridges.push(a);
            }
        }
    }
    
    /**
     * Добавить все сокращения (с первой буквы до любого согласного)
     */
    addAllAbridges(tailLen = 0, maxFirstLen = 0, minFirstLen = 0) {
        if (this.terms.length < 1) 
            return;
        let txt = this.terms[0].canonicalText;
        if (tailLen === 0) {
            for (let i = txt.length - 2; i >= 0; i--) {
                if (!LanguageHelper.isCyrillicVowel(txt[i])) {
                    if (minFirstLen > 0 && (i < (minFirstLen - 1))) 
                        break;
                    let a = new Termin.Abridge();
                    a.addPart(txt.substring(0, 0 + i + 1), false);
                    for (let j = 1; j < this.terms.length; j++) {
                        a.addPart(this.terms[j].canonicalText, false);
                    }
                    if (this.abridges === null) 
                        this.abridges = new Array();
                    this.abridges.push(a);
                }
            }
        }
        else {
            let tail = txt.substring(txt.length - tailLen);
            txt = txt.substring(0, 0 + txt.length - tailLen - 1);
            for (let i = txt.length - 2; i >= 0; i--) {
                if (maxFirstLen > 0 && i >= maxFirstLen) {
                }
                else if (!LanguageHelper.isCyrillicVowel(txt[i])) 
                    this.addAbridge((txt.substring(0, 0 + i + 1) + "-" + tail));
            }
        }
    }
    
    getHashVariants() {
        let res = new Array();
        for (let j = 0; j < this.terms.length; j++) {
            for (const v of this.terms[j].variants) {
                if (!res.includes(v)) 
                    res.push(v);
            }
            if (((j + 2) < this.terms.length) && this.terms[j + 1].isHiphen) {
                let pref = this.terms[j].canonicalText;
                for (const v of this.terms[j + 2].variants) {
                    if (!res.includes(pref + v)) 
                        res.push(pref + v);
                }
            }
            if (!this.ignoreTermsOrder) 
                break;
        }
        if (this.acronym !== null) {
            if (!res.includes(this.acronym)) 
                res.push(this.acronym);
        }
        if (this.acronymSmart !== null) {
            if (!res.includes(this.acronymSmart)) 
                res.push(this.acronymSmart);
        }
        if (this.abridges !== null) {
            for (const a of this.abridges) {
                if (a.parts[0].value.length > 1) {
                    if (!res.includes(a.parts[0].value)) 
                        res.push(a.parts[0].value);
                }
            }
        }
        return res;
    }
    
    isEqual(t) {
        if (t.acronym !== null) {
            if (this.acronym === t.acronym || this.acronymSmart === t.acronym) 
                return true;
        }
        if (t.acronymSmart !== null) {
            if (this.acronym === t.acronymSmart || this.acronymSmart === t.acronymSmart) 
                return true;
        }
        if (t.terms.length !== this.terms.length) 
            return false;
        for (let i = 0; i < this.terms.length; i++) {
            if (!this.terms[i].checkByTerm(t.terms[i])) 
                return false;
        }
        return true;
    }
    
    /**
     * Попробовать привязать термин
     * @param t0 начальный токен
     * @param pars дополнительные параметры привязки
     * @return метатокен привязки или null
     */
    tryParse(t0, pars = TerminParseAttr.NO) {
        const NounPhraseHelper = require("./NounPhraseHelper");
        if (t0 === null) 
            return null;
        let term = null;
        let term0 = null;
        if (t0 instanceof TextToken) {
            term = t0.term;
            term0 = t0.term0;
            if (term0 === term) 
                term0 = null;
        }
        if (this.acronymSmart !== null && (((pars.value()) & (TerminParseAttr.FULLWORDSONLY.value()))) === (TerminParseAttr.NO.value()) && term !== null) {
            if (this.acronymSmart === term || this.acronymSmart === term0) {
                if (t0.next !== null && t0.next.isChar('.') && !t0.isWhitespaceAfter) 
                    return TerminToken._new712(t0, t0.next, this);
                else 
                    return TerminToken._new712(t0, t0, this);
            }
            let i = 0;
            let t1 = Utils.as(t0, TextToken);
            let tt = Utils.as(t0, TextToken);
            for (i = 0; i < this.acronym.length; i++) {
                if (tt === null) 
                    break;
                let term1 = tt.term;
                if (term1.length !== 1 || tt.isWhitespaceAfter) 
                    break;
                if (i > 0 && tt.isWhitespaceBefore) 
                    break;
                if (term1[0] !== this.acronym[i]) 
                    break;
                if (tt.next === null || !tt.next.isChar('.')) 
                    break;
                t1 = Utils.as(tt.next, TextToken);
                tt = Utils.as(tt.next.next, TextToken);
            }
            if (i >= this.acronym.length) 
                return TerminToken._new712(t0, t1, this);
        }
        if (this.acronym !== null && term !== null && ((this.acronym === term || this.acronym === term0))) {
            if (t0.chars.isAllUpper || this.acronymCanBeLower || ((!t0.chars.isAllLower && term.length >= 3))) 
                return TerminToken._new712(t0, t0, this);
        }
        if (this.acronym !== null && t0.chars.isLastLower && t0.lengthChar > 3) {
            if (t0.isValue(this.acronym, null)) 
                return TerminToken._new712(t0, t0, this);
        }
        let cou = 0;
        for (let i = 0; i < this.terms.length; i++) {
            if (this.terms[i].isHiphen) 
                cou--;
            else 
                cou++;
        }
        if (this.terms.length > 0 && ((!this.ignoreTermsOrder || cou === 1))) {
            let t1 = t0;
            let tt = t0;
            let e = null;
            let eUp = null;
            let ok = true;
            let mc = null;
            let dontChangeMc = false;
            let i = 0;
            for (i = 0; i < this.terms.length; i++) {
                if (this.terms[i].isHiphen) 
                    continue;
                if (tt !== null && tt.isHiphen && i > 0) 
                    tt = tt.next;
                if (i > 0 && tt !== null) {
                    if ((((pars.value()) & (TerminParseAttr.IGNOREBRACKETS.value()))) !== (TerminParseAttr.NO.value()) && !tt.chars.isLetter && BracketHelper.isBracket(tt, false)) 
                        tt = tt.next;
                }
                if (((((pars.value()) & (TerminParseAttr.CANBEGEOOBJECT.value()))) !== (TerminParseAttr.NO.value()) && i > 0 && (tt instanceof ReferentToken)) && tt.getReferent().typeName === "GEO") 
                    tt = tt.next;
                if ((tt instanceof ReferentToken) && e === null) {
                    eUp = tt;
                    e = tt.endToken;
                    tt = tt.beginToken;
                }
                if (tt === null) {
                    ok = false;
                    break;
                }
                if (!this.terms[i].checkByToken(tt)) {
                    if (tt.next !== null && tt.isCharOf(".,") && this.terms[i].checkByToken(tt.next)) 
                        tt = tt.next;
                    else if (((i > 0 && tt.next !== null && (tt instanceof TextToken)) && ((tt.morph._class.isPreposition || MiscHelper.isEngArticle(tt))) && this.terms[i].checkByToken(tt.next)) && !this.terms[i - 1].isPatternAny) 
                        tt = tt.next;
                    else {
                        ok = false;
                        if (((i + 2) < this.terms.length) && this.terms[i + 1].isHiphen && this.terms[i + 2].checkByPrefToken(this.terms[i], Utils.as(tt, TextToken))) {
                            i += 2;
                            ok = true;
                        }
                        else if (((!tt.isWhitespaceAfter && tt.next !== null && (tt instanceof TextToken)) && tt.lengthChar === 1 && tt.next.isCharOf("\"'`’“”")) && !tt.next.isWhitespaceAfter && (tt.next.next instanceof TextToken)) {
                            if (this.terms[i].checkByStrPrefToken(tt.term, Utils.as(tt.next.next, TextToken))) {
                                ok = true;
                                tt = tt.next.next;
                            }
                        }
                        if (!ok) {
                            if (i > 0 && (((pars.value()) & (TerminParseAttr.IGNORESTOPWORDS.value()))) !== (TerminParseAttr.NO.value())) {
                                if (tt instanceof TextToken) {
                                    if (!tt.chars.isLetter) {
                                        tt = tt.next;
                                        i--;
                                        continue;
                                    }
                                    let mc1 = tt.getMorphClassInDictionary();
                                    if (mc1.isConjunction || mc1.isPreposition) {
                                        tt = tt.next;
                                        i--;
                                        continue;
                                    }
                                }
                                if (tt instanceof NumberToken) {
                                    tt = tt.next;
                                    i--;
                                    continue;
                                }
                            }
                            break;
                        }
                    }
                }
                if (tt.morph.itemsCount > 0 && !dontChangeMc) {
                    mc = new MorphCollection(tt.morph);
                    if (((mc._class.isNoun || mc._class.isVerb)) && !mc._class.isAdjective) {
                        if (((i + 1) < this.terms.length) && this.terms[i + 1].isHiphen) {
                        }
                        else 
                            dontChangeMc = true;
                    }
                }
                if (tt.morph._class.isPreposition || tt.morph._class.isConjunction) 
                    dontChangeMc = true;
                if (tt === e) {
                    tt = eUp;
                    eUp = null;
                    e = null;
                }
                if (e === null) 
                    t1 = tt;
                tt = tt.next;
            }
            if (ok && i >= this.terms.length) {
                if (t1.next !== null && t1.next.isChar('.') && this.abridges !== null) {
                    for (const a of this.abridges) {
                        if (a.tryAttach(t0) !== null) {
                            t1 = t1.next;
                            break;
                        }
                    }
                }
                if (t0 !== t1 && t0.morph._class.isAdjective) {
                    let npt = NounPhraseHelper.tryParse(t0, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null && npt.endChar <= t1.endChar) 
                        mc = npt.morph;
                }
                return TerminToken._new893(t0, t1, mc);
            }
        }
        if (this.terms.length > 1 && this.ignoreTermsOrder) {
            let _terms = Array.from(this.terms);
            let t1 = t0;
            let tt = t0;
            while (_terms.length > 0) {
                if (tt !== t0 && tt !== null && tt.isHiphen) 
                    tt = tt.next;
                if (tt === null) 
                    break;
                let j = 0;
                for (j = 0; j < _terms.length; j++) {
                    if (_terms[j].checkByToken(tt)) 
                        break;
                }
                if (j >= _terms.length) {
                    if (tt !== t0 && (((pars.value()) & (TerminParseAttr.IGNORESTOPWORDS.value()))) !== (TerminParseAttr.NO.value())) {
                        if (tt instanceof TextToken) {
                            if (!tt.chars.isLetter) {
                                tt = tt.next;
                                continue;
                            }
                            let mc1 = tt.getMorphClassInDictionary();
                            if (mc1.isConjunction || mc1.isPreposition) {
                                tt = tt.next;
                                continue;
                            }
                        }
                        if (tt instanceof NumberToken) {
                            tt = tt.next;
                            continue;
                        }
                    }
                    break;
                }
                _terms.splice(j, 1);
                t1 = tt;
                tt = tt.next;
            }
            for (let i = _terms.length - 1; i >= 0; i--) {
                if (_terms[i].isHiphen) 
                    _terms.splice(i, 1);
            }
            if (_terms.length === 0) 
                return new TerminToken(t0, t1);
        }
        if (this.abridges !== null && (((pars.value()) & (TerminParseAttr.FULLWORDSONLY.value()))) === (TerminParseAttr.NO.value())) {
            let res = null;
            for (const a of this.abridges) {
                let r = a.tryAttach(t0);
                if (r === null) 
                    continue;
                if (r.abridgeWithoutPoint && this.terms.length > 0) {
                    if (!(t0 instanceof TextToken)) 
                        continue;
                    if (a.parts[0].value !== t0.term) 
                        continue;
                }
                if (res === null || (res.lengthChar < r.lengthChar)) 
                    res = r;
            }
            if (res !== null) 
                return res;
        }
        return null;
    }
    
    // Попробовать привязать термин с использованием "похожести"
    tryParseSim(t0, simD, pars = TerminParseAttr.NO) {
        if (t0 === null) 
            return null;
        if (simD >= 1 || (simD < 0.05)) 
            return this.tryParse(t0, pars);
        let term = null;
        if (t0 instanceof TextToken) 
            term = t0.term;
        if (this.acronymSmart !== null && (((pars.value()) & (TerminParseAttr.FULLWORDSONLY.value()))) === (TerminParseAttr.NO.value()) && term !== null) {
            if (this.acronymSmart === term) {
                if (t0.next !== null && t0.next.isChar('.') && !t0.isWhitespaceAfter) 
                    return TerminToken._new712(t0, t0.next, this);
                else 
                    return TerminToken._new712(t0, t0, this);
            }
            let i = 0;
            let t1 = Utils.as(t0, TextToken);
            let tt = Utils.as(t0, TextToken);
            for (i = 0; i < this.acronym.length; i++) {
                if (tt === null) 
                    break;
                let term1 = tt.term;
                if (term1.length !== 1 || tt.isWhitespaceAfter) 
                    break;
                if (i > 0 && tt.isWhitespaceBefore) 
                    break;
                if (term1[0] !== this.acronym[i]) 
                    break;
                if (tt.next === null || !tt.next.isChar('.')) 
                    break;
                t1 = Utils.as(tt.next, TextToken);
                tt = Utils.as(tt.next.next, TextToken);
            }
            if (i >= this.acronym.length) 
                return TerminToken._new712(t0, t1, this);
        }
        if (this.acronym !== null && term !== null && this.acronym === term) {
            if (t0.chars.isAllUpper || this.acronymCanBeLower || ((!t0.chars.isAllLower && term.length >= 3))) 
                return TerminToken._new712(t0, t0, this);
        }
        if (this.acronym !== null && t0.chars.isLastLower && t0.lengthChar > 3) {
            if (t0.isValue(this.acronym, null)) 
                return TerminToken._new712(t0, t0, this);
        }
        if (this.terms.length > 0) {
            let t1 = null;
            let tt = t0;
            let mc = null;
            let termInd = -1;
            let termsLen = 0;
            let tkCnt = 0;
            let termsFoundCnt = 0;
            let wrOder = false;
            for (const it of this.terms) {
                if ((it.canonicalText.length < 2) || it.isHiphen || it.isPoint) 
                    termsLen += 0.3;
                else if (it.isNumber || it.isPatternAny) 
                    termsLen += 0.7;
                else 
                    termsLen += (1);
            }
            let maxTksLen = termsLen / simD;
            let curJM = simD;
            let termsFound = new Array();
            while (tt !== null && (tkCnt < maxTksLen) && (termsFoundCnt < termsLen)) {
                let mcls = null;
                let ttt = Utils.as(tt, TextToken);
                let mm = false;
                if (tt.lengthChar < 2) 
                    tkCnt += 0.3;
                else if (tt instanceof NumberToken) 
                    tkCnt += 0.7;
                else if (ttt === null) 
                    tkCnt++;
                else {
                    mcls = ttt.morph._class;
                    mm = ((mcls.isConjunction || mcls.isPreposition || mcls.isPronoun) || mcls.isMisc || mcls.isUndefined);
                    if (mm) 
                        tkCnt += 0.3;
                    else 
                        tkCnt += (1);
                }
                for (let i = 0; i < this.terms.length; i++) {
                    if (!termsFound.includes(i)) {
                        let trm = this.terms[i];
                        if (trm.isPatternAny) {
                            termsFoundCnt += 0.7;
                            termsFound.push(i);
                            break;
                        }
                        else if (trm.canonicalText.length < 2) {
                            termsFoundCnt += 0.3;
                            termsFound.push(i);
                            break;
                        }
                        else if (trm.checkByToken(tt)) {
                            termsFound.push(i);
                            if (mm) {
                                termsLen -= 0.7;
                                termsFoundCnt += 0.3;
                            }
                            else 
                                termsFoundCnt += (trm.isNumber ? 0.7 : 1);
                            if (!wrOder) {
                                if (i < termInd) 
                                    wrOder = true;
                                else 
                                    termInd = i;
                            }
                            break;
                        }
                    }
                }
                if (termsFoundCnt < 0.2) 
                    return null;
                let newJM = (termsFoundCnt / (((tkCnt + termsLen) - termsFoundCnt))) * ((wrOder ? 0.7 : 1));
                if (curJM < newJM) {
                    t1 = tt;
                    curJM = newJM;
                }
                tt = tt.next;
            }
            if (t1 === null) 
                return null;
            if (t0.morph.itemsCount > 0) 
                mc = new MorphCollection(t0.morph);
            return TerminToken._new899(t0, t1, mc, this);
        }
        if (this.abridges !== null && (((pars.value()) & (TerminParseAttr.FULLWORDSONLY.value()))) === (TerminParseAttr.NO.value())) {
            let res = null;
            for (const a of this.abridges) {
                let r = a.tryAttach(t0);
                if (r === null) 
                    continue;
                if (r.abridgeWithoutPoint && this.terms.length > 0) {
                    if (!(t0 instanceof TextToken)) 
                        continue;
                    if (a.parts[0].value !== t0.term) 
                        continue;
                }
                if (res === null || (res.lengthChar < r.lengthChar)) 
                    res = r;
            }
            if (res !== null) 
                return res;
        }
        return null;
    }
    
    static _new170(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        return res;
    }
    
    static _new348(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.lang = _arg3;
        return res;
    }
    
    static _new349(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag2 = _arg3;
        return res;
    }
    
    static _new357(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.tag = _arg3;
        res.tag2 = _arg4;
        return res;
    }
    
    static _new361(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.tag = _arg3;
        return res;
    }
    
    static _new381(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        return res;
    }
    
    static _new383(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.acronym = _arg3;
        return res;
    }
    
    static _new385(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.ignoreTermsOrder = _arg3;
        return res;
    }
    
    static _new428(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag2 = _arg3;
        res.acronym = _arg4;
        res.acronymCanBeLower = _arg5;
        res.acronymCanBeSmart = _arg6;
        return res;
    }
    
    static _new471(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new472(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.lang = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new474(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag2 = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new475(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.lang = _arg3;
        res.tag2 = _arg4;
        res.gender = _arg5;
        return res;
    }
    
    static _new514(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.tag2 = _arg4;
        res.gender = _arg5;
        return res;
    }
    
    static _new515(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.acronym = _arg3;
        res.tag2 = _arg4;
        res.gender = _arg5;
        return res;
    }
    
    static _new518(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.lang = _arg4;
        res.tag2 = _arg5;
        res.gender = _arg6;
        return res;
    }
    
    static _new519(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.tag = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new523(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.acronym = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new628(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag2 = _arg3;
        res.lang = _arg4;
        return res;
    }
    
    static _new690(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1, _arg2);
        res.tag = _arg3;
        return res;
    }
    
    static _new721(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1, _arg2, _arg3);
        res.canonicText = _arg4;
        res.tag = _arg5;
        return res;
    }
    
    static _new850(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1, _arg2, _arg3);
        res.tag = _arg4;
        return res;
    }
    
    static _new1004(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1, _arg2, _arg3);
        res.canonicText = _arg4;
        return res;
    }
    
    static _new1174(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        return res;
    }
    
    static _new1196(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1, _arg2);
        res.canonicText = _arg3;
        return res;
    }
    
    static _new1199(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeLower = _arg3;
        return res;
    }
    
    static _new1210(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.ignoreTermsOrder = _arg2;
        return res;
    }
    
    static _new1262(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        return res;
    }
    
    static _new1281(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeLower = _arg3;
        res.acronymCanBeSmart = _arg4;
        return res;
    }
    
    static _new1283(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeSmart = _arg3;
        res.acronymCanBeLower = _arg4;
        return res;
    }
    
    static _new1328(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.tag3 = _arg2;
        return res;
    }
    
    static _new1353(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeLower = _arg3;
        res.tag3 = _arg4;
        return res;
    }
    
    static _new1354(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeLower = _arg3;
        res.tag2 = _arg4;
        res.tag3 = _arg5;
        return res;
    }
    
    static _new1356(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag2 = _arg2;
        res.tag3 = _arg3;
        return res;
    }
    
    static _new1394(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.tag3 = _arg3;
        return res;
    }
    
    static _new1406(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.lang = _arg2;
        res.tag2 = _arg3;
        res.gender = _arg4;
        res.tag3 = _arg5;
        return res;
    }
    
    static _new1417(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeLower = _arg3;
        res.acronymCanBeSmart = _arg4;
        res.tag3 = _arg5;
        return res;
    }
    
    static _new1426(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.gender = _arg3;
        res.tag3 = _arg4;
        return res;
    }
    
    static _new1441(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag2 = _arg3;
        res.gender = _arg4;
        res.tag3 = _arg5;
        return res;
    }
    
    static _new1445(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.acronym = _arg2;
        res.acronymCanBeSmart = _arg3;
        res.acronymCanBeLower = _arg4;
        res.tag2 = _arg5;
        res.tag3 = _arg6;
        return res;
    }
    
    static _new1453(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.tag2 = _arg4;
        res.gender = _arg5;
        res.tag3 = _arg6;
        return res;
    }
    
    static _new1454(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.acronym = _arg3;
        res.tag2 = _arg4;
        res.gender = _arg5;
        res.tag3 = _arg6;
        return res;
    }
    
    static _new1456(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.acronym = _arg3;
        res.tag3 = _arg4;
        return res;
    }
    
    static _new1457(_arg1, _arg2, _arg3) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.tag3 = _arg3;
        return res;
    }
    
    static _new1526(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.lang = _arg2;
        return res;
    }
    
    static _new1527(_arg1, _arg2) {
        let res = new Termin();
        res.acronym = _arg1;
        res.lang = _arg2;
        return res;
    }
    
    static _new2419(_arg1, _arg2) {
        let res = new Termin(_arg1);
        res.tag2 = _arg2;
        return res;
    }
    
    static _new2738(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1, _arg2, _arg3);
        res.tag2 = _arg4;
        return res;
    }
    
    static _new2814(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2824(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.acronym = _arg4;
        res.acronymCanBeLower = _arg5;
        return res;
    }
    
    static _new2837(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1, _arg2, _arg3);
        res.canonicText = _arg4;
        res.tag = _arg5;
        res.tag2 = _arg6;
        return res;
    }
    
    static _new2838(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.tag = _arg3;
        res.tag2 = _arg4;
        return res;
    }
    
    static _new2841(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.acronym = _arg3;
        res.tag = _arg4;
        res.tag2 = _arg5;
        res.acronymCanBeLower = _arg6;
        return res;
    }
    
    static _new2853(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.tag = _arg2;
        res.ignoreTermsOrder = _arg3;
        res.tag2 = _arg4;
        return res;
    }
    
    static _new2891(_arg1, _arg2, _arg3, _arg4) {
        let res = new Termin(_arg1);
        res.canonicText = _arg2;
        res.acronym = _arg3;
        res.tag = _arg4;
        return res;
    }
    
    static static_constructor() {
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        Termin.m_StdAbridePrefixes = ["НИЖ", "ВЕРХ", "МАЛ", "БОЛЬШ", "НОВ", "СТАР"];
    }
}


// Элемент термина (слово или число)
Termin.Term = class  {
    
    constructor(src, addLemmaVariant = false, number = null) {
        const MorphGender = require("./../../morph/MorphGender");
        const MorphWordForm = require("./../../morph/MorphWordForm");
        const Token = require("./../Token");
        const NumberSpellingType = require("./../NumberSpellingType");
        const NumberToken = require("./../NumberToken");
        this.m_Source = null;
        this.isPatternAny = false;
        this.m_Number = null;
        this.m_Variants = new Array();
        this.m_Gender = MorphGender.UNDEFINED;
        this.m_Source = src;
        if (src !== null) {
            this.variants.push(src.term);
            if (src.term.length > 0 && Utils.isDigit(src.term[0])) {
                let nt = new NumberToken(src, src, src.term, NumberSpellingType.DIGIT);
                this.m_Number = nt.value;
                this.m_Source = null;
                return;
            }
            if (addLemmaVariant) {
                let lemma = src.lemma;
                if (lemma !== null && lemma !== src.term) 
                    this.variants.push(lemma);
                for (const wff of src.morph.items) {
                    let wf = Utils.as(wff, MorphWordForm);
                    if (wf !== null && wf.isInDictionary) {
                        let s = (wf.normalFull != null ? wf.normalFull : wf.normalCase);
                        if (s !== lemma && s !== src.term) 
                            this.variants.push(s);
                    }
                }
            }
        }
        if (number !== null) {
            this.m_Number = number;
            this.variants.push(number);
        }
    }
    
    get variants() {
        return this.m_Variants;
    }
    
    get canonicalText() {
        return (this.m_Variants.length > 0 ? this.m_Variants[0] : "?");
    }
    
    toString() {
        if (this.isPatternAny) 
            return "IsPatternAny";
        let res = new StringBuilder();
        for (const v of this.variants) {
            if (res.length > 0) 
                res.append(", ");
            res.append(v);
        }
        return res.toString();
    }
    
    get isNumber() {
        return this.m_Source === null || this.m_Number !== null;
    }
    
    get isHiphen() {
        return this.m_Source !== null && this.m_Source.term === "-";
    }
    
    get isPoint() {
        return this.m_Source !== null && this.m_Source.term === ".";
    }
    
    get gender() {
        const MorphGender = require("./../../morph/MorphGender");
        const MorphWordForm = require("./../../morph/MorphWordForm");
        if (this.m_Gender !== MorphGender.UNDEFINED) 
            return this.m_Gender;
        let res = MorphGender.UNDEFINED;
        if (this.m_Source !== null) {
            for (const wf of this.m_Source.morph.items) {
                if ((wf instanceof MorphWordForm) && wf.isInDictionary) 
                    res = MorphGender.of((res.value()) | (wf.gender.value()));
            }
        }
        return res;
    }
    set gender(value) {
        const MorphGender = require("./../../morph/MorphGender");
        this.m_Gender = value;
        if (this.m_Source !== null) {
            for (let i = this.m_Source.morph.itemsCount - 1; i >= 0; i--) {
                if (((this.m_Source.morph.getIndexerItem(i).gender.value()) & (value.value())) === (MorphGender.UNDEFINED.value())) 
                    this.m_Source.morph.removeItem(i);
            }
        }
        return value;
    }
    
    get isNoun() {
        if (this.m_Source !== null) {
            for (const wf of this.m_Source.morph.items) {
                if (wf._class.isNoun) 
                    return true;
            }
        }
        return false;
    }
    
    get isAdjective() {
        if (this.m_Source !== null) {
            for (const wf of this.m_Source.morph.items) {
                if (wf._class.isAdjective) 
                    return true;
            }
        }
        return false;
    }
    
    get morphWordForms() {
        const MorphWordForm = require("./../../morph/MorphWordForm");
        let res = new Array();
        if (this.m_Source !== null) {
            for (const wf of this.m_Source.morph.items) {
                if (wf instanceof MorphWordForm) 
                    res.push(Utils.as(wf, MorphWordForm));
            }
        }
        return res;
    }
    
    checkByTerm(t) {
        if (this.isNumber) 
            return this.m_Number === t.m_Number;
        if (this.m_Variants !== null && t.m_Variants !== null) {
            for (const v of this.m_Variants) {
                if (t.m_Variants.includes(v)) 
                    return true;
            }
        }
        return false;
    }
    
    checkByToken(t) {
        return this._check(t, 0);
    }
    
    _check(t, lev) {
        const MetaToken = require("./../MetaToken");
        const TextToken = require("./../TextToken");
        const NumberToken = require("./../NumberToken");
        if (lev > 10) 
            return false;
        if (this.isPatternAny) 
            return true;
        if (t instanceof TextToken) {
            if (this.isNumber) 
                return false;
            for (const v of this.variants) {
                if (t.isValue(v, null)) 
                    return true;
            }
            return false;
        }
        if (t instanceof NumberToken) {
            if (this.isNumber) 
                return this.m_Number === t.value;
            let num = Utils.as(t, NumberToken);
            if (num.beginToken === num.endToken) 
                return this._check(num.beginToken, lev);
            return false;
        }
        if (t instanceof MetaToken) {
            let mt = Utils.as(t, MetaToken);
            if (mt.beginToken === mt.endToken) {
                if (this._check(mt.beginToken, lev + 1)) 
                    return true;
            }
        }
        return false;
    }
    
    checkByPrefToken(prefix, t) {
        if (prefix === null || prefix.m_Source === null || t === null) 
            return false;
        let pref = prefix.canonicalText;
        let tterm = t.term;
        if (pref[0] !== tterm[0]) 
            return false;
        if (!tterm.startsWith(pref)) 
            return false;
        for (const v of this.variants) {
            if (t.isValue(pref + v, null)) 
                return true;
        }
        return false;
    }
    
    checkByStrPrefToken(pref, t) {
        if (pref === null || t === null) 
            return false;
        for (const v of this.variants) {
            if (v.startsWith(pref) && v.length > pref.length) {
                if (t.isValue(v.substring(pref.length), null)) 
                    return true;
            }
        }
        return false;
    }
    
    static _new1988(_arg1, _arg2) {
        let res = new Termin.Term(_arg1);
        res.isPatternAny = _arg2;
        return res;
    }
}


Termin.Abridge = class  {
    
    constructor() {
        this.parts = new Array();
        this.tail = null;
    }
    
    addPart(val, hasDelim = false) {
        this.parts.push(Termin.AbridgePart._new884(val, hasDelim));
    }
    
    toString() {
        if (this.tail !== null) 
            return (String(this.parts[0]) + "-" + this.tail);
        let res = new StringBuilder();
        for (const p of this.parts) {
            res.append(p);
        }
        return res.toString();
    }
    
    tryAttach(t0) {
        const MorphCollection = require("./../MorphCollection");
        const Token = require("./../Token");
        const TextToken = require("./../TextToken");
        const LanguageHelper = require("./../../morph/LanguageHelper");
        const MetaToken = require("./../MetaToken");
        const TerminToken = require("./TerminToken");
        let t1 = Utils.as(t0, TextToken);
        if (t1 === null) 
            return null;
        if (t1.term !== this.parts[0].value) {
            if (this.parts.length !== 1 || !t1.isValue(this.parts[0].value, null)) 
                return null;
        }
        if (this.tail === null) {
            let te = t1;
            let point = false;
            if (te.next !== null) {
                if (te.next.isChar('.')) {
                    te = te.next;
                    point = true;
                }
                else if (this.parts.length > 1) {
                    while (te.next !== null) {
                        if (te.next.isCharOf("\\/.") || te.next.isHiphen) {
                            te = te.next;
                            point = true;
                        }
                        else 
                            break;
                    }
                }
            }
            if (te === null) 
                return null;
            let tt = te.next;
            for (let i = 1; i < this.parts.length; i++) {
                if (tt !== null && tt.whitespacesBeforeCount > 2) 
                    return null;
                if (tt !== null && ((tt.isHiphen || tt.isCharOf("\\/.")))) 
                    tt = tt.next;
                else if (!point && this.parts[i - 1].hasDelim) 
                    return null;
                if (tt === null) 
                    return null;
                if (tt instanceof TextToken) {
                    let tet = Utils.as(tt, TextToken);
                    if (tet.term !== this.parts[i].value) {
                        if (!tet.isValue(this.parts[i].value, null)) 
                            return null;
                    }
                }
                else if (tt instanceof MetaToken) {
                    let mt = Utils.as(tt, MetaToken);
                    if (mt.beginToken !== mt.endToken) 
                        return null;
                    if (!mt.beginToken.isValue(this.parts[i].value, null)) 
                        return null;
                }
                te = tt;
                if (tt.next !== null && ((tt.next.isCharOf(".\\/") || tt.next.isHiphen))) {
                    tt = tt.next;
                    point = true;
                    if (tt !== null) 
                        te = tt;
                }
                else 
                    point = false;
                tt = tt.next;
            }
            let res = TerminToken._new885(t0, te, t0 === te);
            if (point) 
                res.morph = new MorphCollection();
            return res;
        }
        t1 = Utils.as(t1.next, TextToken);
        if (t1 === null || !t1.isCharOf("-\\/")) 
            return null;
        t1 = Utils.as(t1.next, TextToken);
        if (t1 === null) 
            return null;
        if (t1.term[0] !== this.tail[0]) 
            return null;
        if (this.tail.length > 3) {
            if (!t1.isValue(this.tail, null)) 
                return null;
            if (!t1.term.startsWith(this.tail)) 
                return null;
        }
        if (t1.term !== this.tail) {
            if (t1.term.length === (this.tail.length + 1)) {
                if (t1.term.startsWith(this.tail) && LanguageHelper.isCyrillicVowel(t1.term[t1.term.length - 1])) {
                }
                else 
                    return null;
            }
            else if ((t1.term.length + 1) === this.tail.length) {
                if (!LanguageHelper.isCyrillicVowel(t1.term[t1.term.length - 1])) 
                    return null;
            }
        }
        return new TerminToken(t0, t1);
    }
}


Termin.AbridgePart = class  {
    
    constructor() {
        this.value = null;
        this.hasDelim = false;
    }
    
    toString() {
        if (this.hasDelim) 
            return this.value + ".";
        else 
            return this.value;
    }
    
    static _new884(_arg1, _arg2) {
        let res = new Termin.AbridgePart();
        res.value = _arg1;
        res.hasDelim = _arg2;
        return res;
    }
    
    static _new886(_arg1) {
        let res = new Termin.AbridgePart();
        res.value = _arg1;
        return res;
    }
}


Termin.static_constructor();

module.exports = Termin