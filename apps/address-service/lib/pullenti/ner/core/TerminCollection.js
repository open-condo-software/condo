/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const LanguageHelper = require("./../../morph/LanguageHelper");
const MorphWordForm = require("./../../morph/MorphWordForm");
const Token = require("./../Token");
const TextToken = require("./../TextToken");
const MetaToken = require("./../MetaToken");
const MorphLang = require("./../../morph/MorphLang");
const TerminParseAttr = require("./TerminParseAttr");
const NumberToken = require("./../NumberToken");
const ReferentToken = require("./../ReferentToken");
const Termin = require("./Termin");

/**
 * Словарь некоторых обозначений, терминов, сокращений. Очень полезный класс! 
 * Рассчитан на быстрый поиск токена или группы токенов среди большого списка терминов.
 * 
 * Словарь
 */
class TerminCollection {
    
    constructor() {
        this.termins = new Array();
        this.allAddStrsNormalized = false;
        this.synonyms = null;
        this.tag = null;
        this.m_Root = new TerminCollection.CharNode();
        this.m_RootUa = new TerminCollection.CharNode();
        this.m_Hash1 = new Hashtable();
        this.m_HashCanonic = null;
    }
    
    /**
     * Добавить термин. После добавления нельзя вносить изменения в термин, 
     * кроме как в значения Tag и Tag2 (иначе потом нужно вызвать Reindex).
     * @param term термин
     */
    add(term) {
        if (term.acronymCanBeSmart && term.acronymSmart === null) 
            term.acronymSmart = term.acronym;
        this.termins.push(term);
        this.m_HashCanonic = null;
        this.reindex(term);
    }
    
    /**
     * Добавить строку в качестве записи словаря (термина).
     * @param _termins строка, которая подвергается морфологическому анализу, и в термин добавляются все варианты разбора
     * @param _tag это просто значения Tag для термина
     * @param lang язык (можно null, если язык анализируемого текста)
     * @param isNormalText если true, то исходный текст не нужно морфологически разбирать - он уже в нормальной форме и верхнем регистре
     * @return добавленный термин
     */
    addString(_termins, _tag = null, lang = null, isNormalText = false) {
        let t = new Termin(_termins, lang, isNormalText || this.allAddStrsNormalized);
        t.tag = _tag;
        if (_tag !== null && t.terms.length === 1) {
        }
        this.add(t);
        return t;
    }
    
    _getRoot(lang, isLat) {
        if (lang !== null && lang.isUa && !lang.isRu) 
            return this.m_RootUa;
        return this.m_Root;
    }
    
    /**
     * Переиндексировать термин (если после добавления у него что-либо поменялось)
     * @param t термин для переиндексации
     */
    reindex(t) {
        if (t === null) 
            return;
        if (t.terms.length > 20) {
        }
        if (t.acronymSmart !== null) 
            this.addToHash1(t.acronymSmart.charCodeAt(0), t);
        if (t.abridges !== null) {
            for (const a of t.abridges) {
                if (a.parts[0].value.length === 1) 
                    this.addToHash1(a.parts[0].value.charCodeAt(0), t);
            }
        }
        for (const v of t.getHashVariants()) {
            this._AddToTree(v, t);
        }
        if (t.additionalVars !== null) {
            for (const av of t.additionalVars) {
                av.ignoreTermsOrder = t.ignoreTermsOrder;
                for (const v of av.getHashVariants()) {
                    this._AddToTree(v, t);
                }
            }
        }
    }
    
    remove(t) {
        for (const v of t.getHashVariants()) {
            this._RemoveFromTree(v, t);
        }
        for (const li of this.m_Hash1.values) {
            for (const tt of li) {
                if (tt === t) {
                    Utils.removeItem(li, tt);
                    break;
                }
            }
        }
        let i = this.termins.indexOf(t);
        if (i >= 0) 
            this.termins.splice(i, 1);
    }
    
    _AddToTree(key, t) {
        if (key === null) 
            return;
        let nod = this._getRoot(t.lang, t.lang.isUndefined && LanguageHelper.isLatin(key));
        for (let i = 0; i < key.length; i++) {
            let ch = key.charCodeAt(i);
            if (nod.children === null) 
                nod.children = new Hashtable();
            let nn = null;
            let wrapnn900 = new RefOutArgWrapper();
            let inoutres901 = nod.children.tryGetValue(ch, wrapnn900);
            nn = wrapnn900.value;
            if (!inoutres901) 
                nod.children.put(ch, (nn = new TerminCollection.CharNode()));
            nod = nn;
        }
        if (nod.termins === null) 
            nod.termins = new Array();
        if (!nod.termins.includes(t)) 
            nod.termins.push(t);
    }
    
    _RemoveFromTree(key, t) {
        if (key === null) 
            return;
        let nod = this._getRoot(t.lang, t.lang.isUndefined && LanguageHelper.isLatin(key));
        for (let i = 0; i < key.length; i++) {
            let ch = key.charCodeAt(i);
            if (nod.children === null) 
                return;
            let nn = null;
            let wrapnn902 = new RefOutArgWrapper();
            let inoutres903 = nod.children.tryGetValue(ch, wrapnn902);
            nn = wrapnn902.value;
            if (!inoutres903) 
                return;
            nod = nn;
        }
        if (nod.termins === null) 
            return;
        if (nod.termins.includes(t)) 
            Utils.removeItem(nod.termins, t);
    }
    
    _FindInTree(key, lang) {
        if (key === null) 
            return null;
        let nod = this._getRoot(lang, ((lang === null || lang.isUndefined)) && LanguageHelper.isLatin(key));
        for (let i = 0; i < key.length; i++) {
            let ch = key.charCodeAt(i);
            let nn = null;
            if (nod.children !== null) {
                let wrapnn904 = new RefOutArgWrapper();
                nod.children.tryGetValue(ch, wrapnn904);
                nn = wrapnn904.value;
            }
            if (nn === null) {
                if (ch === (32)) {
                    if (nod.termins !== null) {
                        let pp = Utils.splitString(key, ' ', false);
                        let res = null;
                        for (const t of nod.termins) {
                            if (t.terms.length === pp.length) {
                                let k = 0;
                                for (k = 1; k < pp.length; k++) {
                                    if (!t.terms[k].variants.includes(pp[k])) 
                                        break;
                                }
                                if (k >= pp.length) {
                                    if (res === null) 
                                        res = new Array();
                                    res.push(t);
                                }
                            }
                        }
                        return res;
                    }
                }
                return null;
            }
            nod = nn;
        }
        return nod.termins;
    }
    
    addToHash1(key, t) {
        let li = null;
        let wrapli905 = new RefOutArgWrapper();
        let inoutres906 = this.m_Hash1.tryGetValue(key, wrapli905);
        li = wrapli905.value;
        if (!inoutres906) 
            this.m_Hash1.put(key, (li = new Array()));
        if (!li.includes(t)) 
            li.push(t);
    }
    
    find(key) {
        if (Utils.isNullOrEmpty(key)) 
            return null;
        let li = [ ];
        if (LanguageHelper.isLatinChar(key[0])) 
            li = this._FindInTree(key, MorphLang.EN);
        else {
            li = this._FindInTree(key, MorphLang.RU);
            if (li === null) 
                li = this._FindInTree(key, MorphLang.UA);
        }
        return (li !== null && li.length > 0 ? li[0] : null);
    }
    
    /**
     * Попытка найти термин в словаре для начального токена
     * @param token начальный токен
     * @param attrs атрибуты выделения
     * @return результирующий токен, если привязалось несколько, то первый, если ни одного, то null
     * 
     */
    tryParse(token, attrs = TerminParseAttr.NO) {
        if (this.termins.length === 0) 
            return null;
        let li = this.tryParseAll(token, attrs);
        if (li !== null) 
            return li[0];
        else 
            return null;
    }
    
    /**
     * Попытка привязать все возможные термины
     * @param token начальный токен
     * @param attrs атрибуты выделения
     * @return список из всех подходящих привязок TerminToken или null
     * 
     */
    tryParseAll(token, attrs = TerminParseAttr.NO) {
        if (token === null) 
            return null;
        let re = this._TryAttachAll_(token, attrs, false);
        if (re === null && token.morph.language.isUa) 
            re = this._TryAttachAll_(token, attrs, true);
        if (re === null && this.synonyms !== null) {
            let re0 = this.synonyms.tryParse(token, TerminParseAttr.NO);
            if (re0 !== null && (re0.termin.tag instanceof Array)) {
                let term = this.find(re0.termin.canonicText);
                for (const syn of Utils.as(re0.termin.tag, Array)) {
                    if (term !== null) 
                        break;
                    term = this.find(syn);
                }
                if (term !== null) {
                    re0.termin = term;
                    let res1 = new Array();
                    res1.push(re0);
                    return res1;
                }
            }
        }
        return re;
    }
    
    // Привязка с точностью до похожести
    // simD - параметр "похожесть (0.05..1)"
    tryParseAllSim(token, simD) {
        if (simD >= 1 || (simD < 0.05)) 
            return this.tryParseAll(token, TerminParseAttr.NO);
        if (this.termins.length === 0 || token === null) 
            return null;
        let tt = Utils.as(token, TextToken);
        if (tt === null && (token instanceof ReferentToken)) 
            tt = Utils.as(token.beginToken, TextToken);
        let res = null;
        for (const t of this.termins) {
            if (!t.lang.isUndefined) {
                if (!token.morph.language.isUndefined) {
                    if ((MorphLang.ooBitand(token.morph.language, t.lang)).isUndefined) 
                        continue;
                }
            }
            let ar = t.tryParseSim(tt, simD, TerminParseAttr.NO);
            if (ar === null) 
                continue;
            ar.termin = t;
            if (res === null || ar.tokensCount > res[0].tokensCount) {
                res = new Array();
                res.push(ar);
            }
            else if (ar.tokensCount === res[0].tokensCount) 
                res.push(ar);
        }
        return res;
    }
    
    _TryAttachAll_(token, pars = TerminParseAttr.NO, mainRoot = false) {
        if (this.termins.length === 0 || token === null) 
            return null;
        let s = null;
        let tt = Utils.as(token, TextToken);
        if (tt === null && (token instanceof MetaToken)) 
            tt = Utils.as(token.beginToken, TextToken);
        let res = null;
        let wasVars = false;
        let root = (mainRoot ? this.m_Root : this._getRoot(token.morph.language, token.chars.isLatinLetter));
        if (tt !== null) {
            s = tt.term;
            let nod = root;
            let noVars = false;
            let len0 = 0;
            if ((((pars.value()) & (TerminParseAttr.TERMONLY.value()))) !== (TerminParseAttr.NO.value())) {
            }
            else if (tt.invariantPrefixLengthOfMorphVars <= s.length) {
                len0 = tt.invariantPrefixLengthOfMorphVars;
                for (let i = 0; i < tt.invariantPrefixLengthOfMorphVars; i++) {
                    let ch = s.charCodeAt(i);
                    if (nod.children === null) {
                        noVars = true;
                        break;
                    }
                    let nn = null;
                    let wrapnn907 = new RefOutArgWrapper();
                    let inoutres908 = nod.children.tryGetValue(ch, wrapnn907);
                    nn = wrapnn907.value;
                    if (!inoutres908) {
                        noVars = true;
                        break;
                    }
                    nod = nn;
                }
                if ((noVars && tt.term0 !== null && tt.term !== tt.term0) && tt.invariantPrefixLengthOfMorphVars <= tt.term0.length) {
                    nod = root;
                    s = tt.term0;
                    noVars = false;
                    for (let i = 0; i < tt.invariantPrefixLengthOfMorphVars; i++) {
                        let ch = s.charCodeAt(i);
                        if (nod.children === null) {
                            noVars = true;
                            break;
                        }
                        let nn = null;
                        let wrapnn909 = new RefOutArgWrapper();
                        let inoutres910 = nod.children.tryGetValue(ch, wrapnn909);
                        nn = wrapnn909.value;
                        if (!inoutres910) {
                            noVars = true;
                            break;
                        }
                        nod = nn;
                    }
                }
            }
            if (!noVars) {
                let wrapres915 = new RefOutArgWrapper(res);
                let inoutres916 = this._manageVar(token, pars, s, nod, len0, wrapres915);
                res = wrapres915.value;
                if (inoutres916) 
                    wasVars = true;
                for (let i = 0; i < tt.morph.itemsCount; i++) {
                    if ((((pars.value()) & (TerminParseAttr.TERMONLY.value()))) !== (TerminParseAttr.NO.value())) 
                        continue;
                    let wf = Utils.as(tt.morph.getIndexerItem(i), MorphWordForm);
                    if (wf === null) 
                        continue;
                    if ((((pars.value()) & (TerminParseAttr.INDICTIONARYONLY.value()))) !== (TerminParseAttr.NO.value())) {
                        if (!wf.isInDictionary) 
                            continue;
                    }
                    let j = 0;
                    let ok = true;
                    if (wf.normalCase === null || wf.normalCase === s) 
                        ok = false;
                    else {
                        for (j = 0; j < i; j++) {
                            let wf2 = Utils.as(tt.morph.getIndexerItem(j), MorphWordForm);
                            if (wf2 !== null) {
                                if (wf2.normalCase === wf.normalCase || wf2.normalFull === wf.normalCase) 
                                    break;
                            }
                        }
                        if (j < i) 
                            ok = false;
                    }
                    if (ok) {
                        let wrapres911 = new RefOutArgWrapper(res);
                        let inoutres912 = this._manageVar(token, pars, wf.normalCase, nod, tt.invariantPrefixLengthOfMorphVars, wrapres911);
                        res = wrapres911.value;
                        if (inoutres912) 
                            wasVars = true;
                    }
                    if (wf.normalFull === null || wf.normalFull === wf.normalCase || wf.normalFull === s) 
                        continue;
                    for (j = 0; j < i; j++) {
                        let wf2 = Utils.as(tt.morph.getIndexerItem(j), MorphWordForm);
                        if (wf2 !== null && wf2.normalFull === wf.normalFull) 
                            break;
                    }
                    if (j < i) 
                        continue;
                    let wrapres913 = new RefOutArgWrapper(res);
                    let inoutres914 = this._manageVar(token, pars, wf.normalFull, nod, tt.invariantPrefixLengthOfMorphVars, wrapres913);
                    res = wrapres913.value;
                    if (inoutres914) 
                        wasVars = true;
                }
            }
        }
        else if (token instanceof NumberToken) {
            let wrapres917 = new RefOutArgWrapper(res);
            let inoutres918 = this._manageVar(token, pars, token.value.toString(), root, 0, wrapres917);
            res = wrapres917.value;
            if (inoutres918) 
                wasVars = true;
        }
        else 
            return null;
        if (!wasVars && s !== null && s.length === 1) {
            let vars = [ ];
            let wrapvars919 = new RefOutArgWrapper();
            let inoutres920 = this.m_Hash1.tryGetValue(s.charCodeAt(0), wrapvars919);
            vars = wrapvars919.value;
            if (inoutres920) {
                for (const t of vars) {
                    if (!t.lang.isUndefined) {
                        if (!token.morph.language.isUndefined) {
                            if ((MorphLang.ooBitand(token.morph.language, t.lang)).isUndefined) 
                                continue;
                        }
                    }
                    let ar = t.tryParse(tt, TerminParseAttr.NO);
                    if (ar === null) 
                        continue;
                    ar.termin = t;
                    if (res === null) {
                        res = new Array();
                        res.push(ar);
                    }
                    else if (ar.tokensCount > res[0].tokensCount) {
                        res.splice(0, res.length);
                        res.push(ar);
                    }
                    else if (ar.tokensCount === res[0].tokensCount) 
                        res.push(ar);
                }
            }
        }
        if (res !== null) {
            let ii = 0;
            let max = 0;
            for (let i = 0; i < res.length; i++) {
                if (res[i].lengthChar > max) {
                    max = res[i].lengthChar;
                    ii = i;
                }
            }
            if (ii > 0) {
                let v = res[ii];
                res.splice(ii, 1);
                res.splice(0, 0, v);
            }
        }
        return res;
    }
    
    _manageVar(token, pars, v, nod, i0, res) {
        for (let i = i0; i < v.length; i++) {
            let ch = v.charCodeAt(i);
            if (nod.children === null) 
                return false;
            let nn = null;
            let wrapnn921 = new RefOutArgWrapper();
            let inoutres922 = nod.children.tryGetValue(ch, wrapnn921);
            nn = wrapnn921.value;
            if (!inoutres922) 
                return false;
            nod = nn;
        }
        let vars = nod.termins;
        if (vars === null || vars.length === 0) 
            return false;
        for (const t of vars) {
            let ar = t.tryParse(token, pars);
            if (ar !== null) {
                ar.termin = t;
                if (res.value === null) {
                    res.value = new Array();
                    res.value.push(ar);
                }
                else if (ar.tokensCount > res.value[0].tokensCount) {
                    res.value.splice(0, res.value.length);
                    res.value.push(ar);
                }
                else if (ar.tokensCount === res.value[0].tokensCount) {
                    let j = 0;
                    for (j = 0; j < res.value.length; j++) {
                        if (res.value[j].termin === ar.termin) 
                            break;
                    }
                    if (j >= res.value.length) 
                        res.value.push(ar);
                }
            }
            if (t.additionalVars !== null) {
                for (const av of t.additionalVars) {
                    ar = av.tryParse(token, pars);
                    if (ar === null) 
                        continue;
                    ar.termin = t;
                    if (res.value === null) {
                        res.value = new Array();
                        res.value.push(ar);
                    }
                    else if (ar.tokensCount > res.value[0].tokensCount) {
                        res.value.splice(0, res.value.length);
                        res.value.push(ar);
                    }
                    else if (ar.tokensCount === res.value[0].tokensCount) {
                        let j = 0;
                        for (j = 0; j < res.value.length; j++) {
                            if (res.value[j].termin === ar.termin) 
                                break;
                        }
                        if (j >= res.value.length) 
                            res.value.push(ar);
                    }
                }
            }
        }
        return v.length > 1;
    }
    
    /**
     * Поискать эквивалентные термины
     * @param termin термин
     * @return список эквивалентных терминов Termin или null
     */
    findTerminsByTermin(termin) {
        let res = null;
        for (const v of termin.getHashVariants()) {
            let vars = this._FindInTree(v, termin.lang);
            if (vars === null) 
                continue;
            for (const t of vars) {
                if (t.isEqual(termin)) {
                    if (res === null) 
                        res = new Array();
                    if (!res.includes(t)) 
                        res.push(t);
                }
            }
        }
        return res;
    }
    
    /**
     * Поискать термины по строке
     * @param str поисковая строка
     * @param lang возможный язык (null)
     * @return список терминов Termin или null
     */
    findTerminsByString(str, lang = null) {
        return this._FindInTree(str, lang);
    }
    
    findTerminsByCanonicText(text) {
        if (this.m_HashCanonic === null) {
            this.m_HashCanonic = new Hashtable();
            for (const t of this.termins) {
                let ct = t.canonicText;
                let li = [ ];
                let wrapli923 = new RefOutArgWrapper();
                let inoutres924 = this.m_HashCanonic.tryGetValue(ct, wrapli923);
                li = wrapli923.value;
                if (!inoutres924) 
                    this.m_HashCanonic.put(ct, (li = new Array()));
                if (!li.includes(t)) 
                    li.push(t);
            }
        }
        let res = [ ];
        let wrapres925 = new RefOutArgWrapper();
        let inoutres926 = this.m_HashCanonic.tryGetValue(text, wrapres925);
        res = wrapres925.value;
        if (!inoutres926) 
            return null;
        else 
            return res;
    }
}


TerminCollection.CharNode = class  {
    
    constructor() {
        this.children = null;
        this.termins = null;
    }
}


module.exports = TerminCollection