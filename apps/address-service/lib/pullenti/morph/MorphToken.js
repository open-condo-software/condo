/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphLang = require("./MorphLang");
const MorphNumber = require("./MorphNumber");
const LanguageHelper = require("./LanguageHelper");

/**
 * Элементы, на которые разбивается исходный текст (токены)
 * морф.токен
 */
class MorphToken {
    
    get length() {
        return (this.term === null ? 0 : this.term.length);
    }
    
    /**
     * Извлечь фрагмент из исходного текста, соответствующий токену
     * @param text полный исходный текст
     * @return фрагмент
     */
    getSourceText(text) {
        return text.substring(this.beginChar, this.beginChar + (this.endChar + 1) - this.beginChar);
    }
    
    /**
     * Лемма (вариант морфологической нормализации)
     */
    getLemma() {
        if (this.m_Lemma !== null) 
            return this.m_Lemma;
        let res = null;
        if (this.wordForms !== null && this.wordForms.length > 0) {
            if (this.wordForms.length === 1) 
                res = (this.wordForms[0].normalFull != null ? this.wordForms[0].normalFull : this.wordForms[0].normalCase);
            if (res === null && !this.charInfo.isAllLower) {
                for (const m of this.wordForms) {
                    if (m._class.isProperSurname) {
                        let s = (m.normalFull != null ? m.normalFull : m.normalCase);
                        if (LanguageHelper.endsWithEx(s, "ОВ", "ЕВ", null, null)) {
                            res = s;
                            break;
                        }
                    }
                    else if (m._class.isProperName && m.isInDictionary) 
                        return m.normalCase;
                }
            }
            if (res === null) {
                let best = null;
                for (const m of this.wordForms) {
                    if (best === null) 
                        best = m;
                    else if (this.compareForms(best, m) > 0) 
                        best = m;
                }
                res = (best.normalFull != null ? best.normalFull : best.normalCase);
            }
        }
        if (res !== null) {
            if (LanguageHelper.endsWithEx(res, "АНЫЙ", "ЕНЫЙ", null, null)) 
                res = res.substring(0, 0 + res.length - 3) + "ННЫЙ";
            else if (LanguageHelper.endsWith(res, "ЙСЯ")) 
                res = res.substring(0, 0 + res.length - 2);
            else if (LanguageHelper.endsWith(res, "АНИЙ") && res === this.term) {
                for (const wf of this.wordForms) {
                    if (wf.isInDictionary) 
                        return res;
                }
                return res.substring(0, 0 + res.length - 1) + "Е";
            }
            return res;
        }
        return (this.term != null ? this.term : "?");
    }
    
    compareForms(x, y) {
        let vx = (x.normalFull != null ? x.normalFull : x.normalCase);
        let vy = (y.normalFull != null ? y.normalFull : y.normalCase);
        if (vx === vy) 
            return 0;
        if (Utils.isNullOrEmpty(vx)) 
            return 1;
        if (Utils.isNullOrEmpty(vy)) 
            return -1;
        let lastx = vx[vx.length - 1];
        let lasty = vy[vy.length - 1];
        if (x._class.isProperSurname && !this.charInfo.isAllLower) {
            if (LanguageHelper.endsWithEx(vx, "ОВ", "ЕВ", "ИН", null)) {
                if (!y._class.isProperSurname) 
                    return -1;
            }
        }
        if (y._class.isProperSurname && !this.charInfo.isAllLower) {
            if (LanguageHelper.endsWithEx(vy, "ОВ", "ЕВ", "ИН", null)) {
                if (!x._class.isProperSurname) 
                    return 1;
                if (vx.length > vy.length) 
                    return -1;
                if (vx.length < vy.length) 
                    return 1;
                return 0;
            }
        }
        if (x._class.equals(y._class)) {
            if (x._class.isAdjective) {
                if (lastx === 'Й' && lasty !== 'Й') 
                    return -1;
                if (lastx !== 'Й' && lasty === 'Й') 
                    return 1;
                if (!LanguageHelper.endsWith(vx, "ОЙ") && LanguageHelper.endsWith(vy, "ОЙ")) 
                    return -1;
                if (LanguageHelper.endsWith(vx, "ОЙ") && !LanguageHelper.endsWith(vy, "ОЙ")) 
                    return 1;
            }
            if (x._class.isNoun) {
                if (x.number === MorphNumber.SINGULAR && y.number === MorphNumber.PLURAL && vx.length <= (vy.length + 1)) 
                    return -1;
                if (x.number === MorphNumber.PLURAL && y.number === MorphNumber.SINGULAR && vx.length >= (vy.length - 1)) 
                    return 1;
            }
            if (vx.length < vy.length) 
                return -1;
            if (vx.length > vy.length) 
                return 1;
            return 0;
        }
        if (x._class.isAdverb) 
            return 1;
        if (x._class.isNoun && x.isInDictionary) {
            if (y._class.isAdjective && y.isInDictionary) {
                if (!y.misc.attrs.includes("к.ф.")) 
                    return 1;
            }
            return -1;
        }
        if (x._class.isAdjective) {
            if (!x.isInDictionary && y._class.isNoun && y.isInDictionary) 
                return 1;
            return -1;
        }
        if (x._class.isVerb) {
            if (y._class.isNoun || y._class.isAdjective || y._class.isPreposition) 
                return 1;
            return -1;
        }
        if (y._class.isAdverb) 
            return -1;
        if (y._class.isNoun && y.isInDictionary) 
            return 1;
        if (y._class.isAdjective) {
            if (((x._class.isNoun || x._class.isProperSecname)) && x.isInDictionary) 
                return -1;
            if (x._class.isNoun && !y.isInDictionary) {
                if (vx.length < vy.length) 
                    return -1;
            }
            return 1;
        }
        if (y._class.isVerb) {
            if (x._class.isNoun || x._class.isAdjective || x._class.isPreposition) 
                return -1;
            if (x._class.isProper) 
                return -1;
            return 1;
        }
        if (vx.length < vy.length) 
            return -1;
        if (vx.length > vy.length) 
            return 1;
        return 0;
    }
    
    get language() {
        if (this.m_Language !== null && !this.m_Language.isUndefined) 
            return this.m_Language;
        let lang = new MorphLang();
        if (this.wordForms !== null) {
            for (const wf of this.wordForms) {
                if (!wf.language.isUndefined) 
                    lang = MorphLang.ooBitor(lang, wf.language);
            }
        }
        return lang;
    }
    set language(value) {
        this.m_Language = value;
        return value;
    }
    
    constructor() {
        this.beginChar = 0;
        this.endChar = 0;
        this.term = null;
        this.m_Lemma = null;
        this.tag = null;
        this.m_Language = null;
        this.wordForms = null;
        this.charInfo = null;
    }
    
    toString() {
        if (Utils.isNullOrEmpty(this.term)) 
            return "Null";
        let str = this.term;
        if (this.charInfo.isAllLower) 
            str = str.toLowerCase();
        else if (this.charInfo.isCapitalUpper && str.length > 0) 
            str = (this.term[0] + this.term.substring(1).toLowerCase());
        else if (this.charInfo.isLastLower) 
            str = (this.term.substring(0, 0 + this.term.length - 1) + this.term.substring(this.term.length - 1).toLowerCase());
        if (this.wordForms === null) 
            return str;
        let res = new StringBuilder(str);
        for (const l of this.wordForms) {
            res.append(", ").append(l.toString());
        }
        return res.toString();
    }
}


module.exports = MorphToken