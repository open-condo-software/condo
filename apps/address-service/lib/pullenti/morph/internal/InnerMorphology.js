/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const ProgressEventArgs = require("./../../unisharp/ProgressEventArgs");

const CharsInfo = require("./../CharsInfo");
const MorphToken = require("./../MorphToken");
const UnicodeInfo = require("./UnicodeInfo");
const MorphClass = require("./../MorphClass");
const MorphEngine = require("./MorphEngine");
const MorphLang = require("./../MorphLang");
const MorphWordForm = require("./../MorphWordForm");
const TextWrapper = require("./TextWrapper");
const UniLexWrap = require("./UniLexWrap");
const LanguageHelper = require("./../LanguageHelper");

class InnerMorphology {
    
    constructor() {
        this.m_EngineRu = new MorphEngine();
        this.m_EngineEn = new MorphEngine();
        this.m_EngineUa = new MorphEngine();
        this.m_EngineBy = new MorphEngine();
        this.m_EngineKz = new MorphEngine();
        this.m_Lock = new Object();
        this.lastPercent = 0;
    }
    
    get loadedLanguages() {
        return MorphLang.ooBitor(MorphLang.ooBitor(this.m_EngineRu.language, MorphLang.ooBitor(this.m_EngineEn.language, this.m_EngineUa.language)), MorphLang.ooBitor(this.m_EngineBy.language, this.m_EngineKz.language));
    }
    
    loadLanguages(langs, lazyLoad) {
        if (langs.isRu && !this.m_EngineRu.language.isRu) {
            /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
                if (!this.m_EngineRu.language.isRu) {
                    if (!this.m_EngineRu.initialize(MorphLang.RU, lazyLoad)) 
                        throw new Error("Not found resource file m_ru.dat in Morphology");
                }
            }
        }
        if (langs.isEn && !this.m_EngineEn.language.isEn) {
            /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
                if (!this.m_EngineEn.language.isEn) {
                    if (!this.m_EngineEn.initialize(MorphLang.EN, lazyLoad)) 
                        throw new Error("Not found resource file m_en.dat in Morphology");
                }
            }
        }
        if (langs.isUa && !this.m_EngineUa.language.isUa) {
            /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
                if (!this.m_EngineUa.language.isUa) 
                    this.m_EngineUa.initialize(MorphLang.UA, lazyLoad);
            }
        }
        if (langs.isBy && !this.m_EngineBy.language.isBy) {
            /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
                if (!this.m_EngineBy.language.isBy) 
                    this.m_EngineBy.initialize(MorphLang.BY, lazyLoad);
            }
        }
        if (langs.isKz && !this.m_EngineKz.language.isKz) {
            /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
                if (!this.m_EngineKz.language.isKz) 
                    this.m_EngineKz.initialize(MorphLang.KZ, lazyLoad);
            }
        }
    }
    
    unloadLanguages(langs) {
        if (langs.isRu && this.m_EngineRu.language.isRu) 
            this.m_EngineRu = new MorphEngine();
        if (langs.isEn && this.m_EngineEn.language.isEn) 
            this.m_EngineEn = new MorphEngine();
        if (langs.isUa && this.m_EngineUa.language.isUa) 
            this.m_EngineUa = new MorphEngine();
        if (langs.isBy && this.m_EngineBy.language.isBy) 
            this.m_EngineBy = new MorphEngine();
        if (langs.isKz && this.m_EngineKz.language.isKz) 
            this.m_EngineKz = new MorphEngine();
        ;
    }
    
    setEngines(engine) {
        if (engine !== null) {
            this.m_EngineRu = engine;
            this.m_EngineEn = engine;
            this.m_EngineUa = engine;
            this.m_EngineBy = engine;
        }
    }
    
    onProgress(val, max, progress) {
        let p = val;
        if (max > 0xFFFF) 
            p = Utils.intDiv(p, (Utils.intDiv(max, 100)));
        else 
            p = Utils.intDiv(p * 100, max);
        if (p !== this.lastPercent && progress !== null) 
            progress.call(null, new ProgressEventArgs(p, null));
        this.lastPercent = p;
    }
    
    run(text, onlyTokenizing, dlang, goodText, progress) {
        if (Utils.isNullOrEmpty(text)) 
            return null;
        let twr = new TextWrapper(text, goodText);
        let twrch = twr.chars;
        let res = new Array();
        let uniLex = new Hashtable();
        let i = 0;
        let j = 0;
        let term0 = null;
        let pureRusWords = 0;
        let pureUkrWords = 0;
        let pureByWords = 0;
        let pureKzWords = 0;
        let totRusWords = 0;
        let totUkrWords = 0;
        let totByWords = 0;
        let totKzWords = 0;
        for (i = 0; i < twr.length; i++) {
            let ty = this.getCharTyp(twrch[i]);
            if (ty === 0) 
                continue;
            if (ty > 2) 
                j = i + 1;
            else 
                for (j = i + 1; j < twr.length; j++) {
                    if (this.getCharTyp(twrch[j]) !== ty) 
                        break;
                }
            let wstr = text.substring(i, i + j - i);
            let term = null;
            if (goodText) 
                term = wstr;
            else {
                let trstr = LanguageHelper.transliteralCorrection(wstr, term0, false);
                term = LanguageHelper.correctWord(trstr);
            }
            if (Utils.isNullOrEmpty(term)) {
                i = j - 1;
                continue;
            }
            if (term.startsWith("ЗАВ")) {
                let term1 = term.substring(3);
                if (term1.startsWith("ОТДЕЛ") || term1.startsWith("ЛАБОРАТ") || term1.startsWith("КАФЕДР")) {
                    term = "ЗАВ";
                    j = i + 3;
                }
            }
            let lang = LanguageHelper.getWordLang(term);
            if (term.length > 2) {
                if (lang.equals(MorphLang.UA)) 
                    pureUkrWords++;
                else if (lang.equals(MorphLang.RU)) 
                    pureRusWords++;
                else if (lang.equals(MorphLang.BY)) 
                    pureByWords++;
                else if (lang.equals(MorphLang.KZ)) 
                    pureKzWords++;
            }
            if (lang.isRu) 
                totRusWords++;
            if (lang.isUa) 
                totUkrWords++;
            if (lang.isBy) 
                totByWords++;
            if (lang.isKz) 
                totKzWords++;
            if (ty === 1) 
                term0 = term;
            let lemmas = null;
            if (ty === 1 && !onlyTokenizing) {
                let wraplemmas214 = new RefOutArgWrapper();
                let inoutres215 = uniLex.tryGetValue(term, wraplemmas214);
                lemmas = wraplemmas214.value;
                if (!inoutres215) {
                    let nuni = new UniLexWrap(lang);
                    uniLex.put(term, nuni);
                    lemmas = nuni;
                }
            }
            let tok = new MorphToken();
            tok.term = term;
            tok.beginChar = i;
            if (i === 733860) {
            }
            tok.endChar = j - 1;
            tok.tag = lemmas;
            res.push(tok);
            i = j - 1;
        }
        let defLang = new MorphLang();
        if (dlang !== null) 
            defLang.value = dlang.value;
        if (pureRusWords > pureUkrWords && pureRusWords > pureByWords && pureRusWords > pureKzWords) 
            defLang = MorphLang.RU;
        else if (totRusWords > totUkrWords && ((totRusWords > totByWords || ((totRusWords === totByWords && pureByWords === 0)))) && totRusWords > totKzWords) 
            defLang = MorphLang.RU;
        else if (pureUkrWords > pureRusWords && pureUkrWords > pureByWords && pureUkrWords > pureKzWords) 
            defLang = MorphLang.UA;
        else if (totUkrWords > totRusWords && totUkrWords > totByWords && totUkrWords > totKzWords) 
            defLang = MorphLang.UA;
        else if ((pureKzWords > pureRusWords && ((totKzWords + pureKzWords) > totRusWords) && pureKzWords > pureUkrWords) && pureKzWords > pureByWords) 
            defLang = MorphLang.KZ;
        else if (totKzWords > totRusWords && totKzWords > totUkrWords && totKzWords > totByWords) 
            defLang = MorphLang.KZ;
        else if (pureByWords > pureRusWords && pureByWords > pureUkrWords && pureByWords > pureKzWords) 
            defLang = MorphLang.BY;
        else if (totByWords > totRusWords && totByWords > totUkrWords && totByWords > totKzWords) {
            if (totRusWords > 10 && totByWords > (totRusWords + 20)) 
                defLang = MorphLang.BY;
            else if (totRusWords === 0 || totByWords >= (totRusWords * 2)) 
                defLang = MorphLang.BY;
        }
        if (((defLang.isUndefined || defLang.isUa)) && totRusWords > 0) {
            if (((totUkrWords > totRusWords && this.m_EngineUa.language.isUa)) || ((totByWords > totRusWords && this.m_EngineBy.language.isBy)) || ((totKzWords > totRusWords && this.m_EngineKz.language.isKz))) {
                let cou0 = 0;
                totRusWords = (totByWords = (totUkrWords = (totKzWords = 0)));
                for (const kp of uniLex.entries) {
                    let lang = new MorphLang();
                    let wraplang216 = new RefOutArgWrapper(lang);
                    kp.value.wordForms = this.processOneWord(kp.key, wraplang216);
                    lang = wraplang216.value;
                    if (kp.value.wordForms !== null) {
                        for (const wf of kp.value.wordForms) {
                            lang = MorphLang.ooBitor(lang, wf.language);
                        }
                    }
                    kp.value.lang = lang;
                    if (lang.isRu) 
                        totRusWords++;
                    if (lang.isUa) 
                        totUkrWords++;
                    if (lang.isBy) 
                        totByWords++;
                    if (lang.isKz) 
                        totKzWords++;
                    if (lang.isCyrillic) 
                        cou0++;
                    if (cou0 >= 100) 
                        break;
                }
                if (totRusWords > ((Utils.intDiv(totByWords, 2))) && totRusWords > ((Utils.intDiv(totUkrWords, 2)))) 
                    defLang = MorphLang.RU;
                else if (totUkrWords > ((Utils.intDiv(totRusWords, 2))) && totUkrWords > ((Utils.intDiv(totByWords, 2)))) 
                    defLang = MorphLang.UA;
                else if (totByWords > ((Utils.intDiv(totRusWords, 2))) && totByWords > ((Utils.intDiv(totUkrWords, 2)))) 
                    defLang = MorphLang.BY;
            }
            else if (defLang.isUndefined) 
                defLang = MorphLang.RU;
        }
        let cou = 0;
        totRusWords = (totByWords = (totUkrWords = (totKzWords = 0)));
        for (const kp of uniLex.entries) {
            let lang = defLang;
            if (lang.isUndefined) {
                if (totRusWords > totByWords && totRusWords > totUkrWords && totRusWords > totKzWords) 
                    lang = MorphLang.RU;
                else if (totUkrWords > totRusWords && totUkrWords > totByWords && totUkrWords > totKzWords) 
                    lang = MorphLang.UA;
                else if (totByWords > totRusWords && totByWords > totUkrWords && totByWords > totKzWords) 
                    lang = MorphLang.BY;
                else if (totKzWords > totRusWords && totKzWords > totUkrWords && totKzWords > totByWords) 
                    lang = MorphLang.KZ;
            }
            let wraplang217 = new RefOutArgWrapper(lang);
            kp.value.wordForms = this.processOneWord(kp.key, wraplang217);
            lang = wraplang217.value;
            kp.value.lang = lang;
            if (lang.isRu) 
                totRusWords++;
            if (lang.isUa) 
                totUkrWords++;
            if (lang.isBy) 
                totByWords++;
            if (lang.isKz) 
                totKzWords++;
            if (progress !== null) 
                this.onProgress(cou, uniLex.length, progress);
            cou++;
        }
        let emptyList = null;
        for (const r of res) {
            let uni = Utils.as(r.tag, UniLexWrap);
            r.tag = null;
            if (uni === null || uni.wordForms === null || uni.wordForms.length === 0) {
                if (emptyList === null) 
                    emptyList = new Array();
                r.wordForms = emptyList;
                if (uni !== null) 
                    r.language = uni.lang;
            }
            else 
                r.wordForms = uni.wordForms;
        }
        if (!goodText) {
            for (i = 0; i < (res.length - 2); i++) {
                let ui0 = twrch[res[i].beginChar];
                let ui1 = twrch[res[i + 1].beginChar];
                let ui2 = twrch[res[i + 2].beginChar];
                if (ui1.isQuot) {
                    let p = res[i + 1].beginChar;
                    if ((p >= 2 && "БбТт".indexOf(text[p - 1]) >= 0 && ((p + 3) < text.length)) && "ЕеЯяЁё".indexOf(text[p + 1]) >= 0) {
                        let wstr = LanguageHelper.transliteralCorrection(LanguageHelper.correctWord((res[i].getSourceText(text) + "Ъ" + res[i + 2].getSourceText(text))), null, false);
                        let li = this.processOneWord0(wstr);
                        if (li !== null && li.length > 0 && li[0].isInDictionary) {
                            res[i].endChar = res[i + 2].endChar;
                            res[i].term = wstr;
                            res[i].wordForms = li;
                            res.splice(i + 1, 2);
                        }
                    }
                    else if ((ui1.isApos && p > 0 && Utils.isLetter(text[p - 1])) && ((p + 1) < text.length) && Utils.isLetter(text[p + 1])) {
                        if (defLang.equals(MorphLang.UA) || res[i].language.isUa || res[i + 2].language.isUa) {
                            let wstr = LanguageHelper.transliteralCorrection(LanguageHelper.correctWord((res[i].getSourceText(text) + res[i + 2].getSourceText(text))), null, false);
                            let li = this.processOneWord0(wstr);
                            let okk = true;
                            if (okk) {
                                res[i].endChar = res[i + 2].endChar;
                                res[i].term = wstr;
                                if (li === null) 
                                    li = new Array();
                                if (li !== null && li.length > 0) 
                                    res[i].language = li[0].language;
                                res[i].wordForms = li;
                                res.splice(i + 1, 2);
                            }
                        }
                    }
                }
                else if (((ui1.uniChar === '3' || ui1.uniChar === '4')) && res[i + 1].length === 1) {
                    let src = (ui1.uniChar === '3' ? "З" : "Ч");
                    let i0 = i + 1;
                    if ((res[i].endChar + 1) === res[i + 1].beginChar && ui0.isCyrillic) {
                        i0--;
                        src = res[i0].getSourceText(text) + src;
                    }
                    let i1 = i + 1;
                    if ((res[i + 1].endChar + 1) === res[i + 2].beginChar && ui2.isCyrillic) {
                        i1++;
                        src += res[i1].getSourceText(text);
                    }
                    if (src.length > 2) {
                        let wstr = LanguageHelper.transliteralCorrection(LanguageHelper.correctWord(src), null, false);
                        let li = this.processOneWord0(wstr);
                        if (li !== null && li.length > 0 && li[0].isInDictionary) {
                            res[i0].endChar = res[i1].endChar;
                            res[i0].term = wstr;
                            res[i0].wordForms = li;
                            res.splice(i0 + 1, i1 - i0);
                        }
                    }
                }
                else if ((ui1.isHiphen && ui0.isLetter && ui2.isLetter) && res[i].endChar > res[i].beginChar && res[i + 2].endChar > res[i + 2].beginChar) {
                    let newline = false;
                    let sps = 0;
                    for (j = res[i + 1].endChar + 1; j < res[i + 2].beginChar; j++) {
                        if (text[j] === '\r' || text[j] === '\n') {
                            newline = true;
                            sps++;
                        }
                        else if (!Utils.isWhitespace(text[j])) 
                            break;
                        else 
                            sps++;
                    }
                    let fullWord = LanguageHelper.correctWord(res[i].getSourceText(text) + res[i + 2].getSourceText(text));
                    if (!newline) {
                        if (uniLex.containsKey(fullWord) || fullWord === "ИЗЗА") 
                            newline = true;
                        else if (text[res[i + 1].beginChar] === (String.fromCharCode(0x00AD))) 
                            newline = true;
                        else if (LanguageHelper.endsWithEx(res[i].getSourceText(text), "О", "о", null, null) && res[i + 2].wordForms.length > 0 && res[i + 2].wordForms[0].isInDictionary) {
                            if (text[res[i + 1].beginChar] === '¬') {
                                let li = this.processOneWord0(fullWord);
                                if (li !== null && li.length > 0 && li[0].isInDictionary) 
                                    newline = true;
                            }
                        }
                        else if ((res[i].endChar + 2) === res[i + 2].beginChar) {
                            if (!Utils.isUpperCase(text[res[i + 2].beginChar]) && (sps < 2) && fullWord.length > 4) {
                                newline = true;
                                if ((i + 3) < res.length) {
                                    let ui3 = twrch[res[i + 3].beginChar];
                                    if (ui3.isHiphen) 
                                        newline = false;
                                }
                            }
                        }
                        else if (((res[i].endChar + 1) === res[i + 1].beginChar && sps > 0 && (sps < 3)) && fullWord.length > 4) 
                            newline = true;
                    }
                    if (newline) {
                        let li = this.processOneWord0(fullWord);
                        if (li !== null && li.length > 0 && ((li[0].isInDictionary || uniLex.containsKey(fullWord)))) {
                            res[i].endChar = res[i + 2].endChar;
                            res[i].term = fullWord;
                            res[i].wordForms = li;
                            res.splice(i + 1, 2);
                        }
                    }
                    else {
                    }
                }
                else if ((ui1.isLetter && ui0.isLetter && res[i].length > 2) && res[i + 1].length > 1) {
                    if (ui0.isUpper !== ui1.isUpper) 
                        continue;
                    if (!ui0.isCyrillic || !ui1.isCyrillic) 
                        continue;
                    let newline = false;
                    for (j = res[i].endChar + 1; j < res[i + 1].beginChar; j++) {
                        if (twrch[j].code === 0xD || twrch[j].code === 0xA) {
                            newline = true;
                            break;
                        }
                    }
                    if (!newline) 
                        continue;
                    let fullWord = LanguageHelper.correctWord(res[i].getSourceText(text) + res[i + 1].getSourceText(text));
                    if (!uniLex.containsKey(fullWord)) 
                        continue;
                    let li = this.processOneWord0(fullWord);
                    if (li !== null && li.length > 0 && li[0].isInDictionary) {
                        res[i].endChar = res[i + 1].endChar;
                        res[i].term = fullWord;
                        res[i].wordForms = li;
                        res.splice(i + 1, 1);
                    }
                }
            }
        }
        for (i = 0; i < res.length; i++) {
            let mt = res[i];
            mt.charInfo = new CharsInfo();
            let ui0 = twrch[mt.beginChar];
            let ui00 = UnicodeInfo.getChar(mt.term[0]);
            for (j = mt.beginChar + 1; j <= mt.endChar; j++) {
                if (ui0.isLetter) 
                    break;
                ui0 = twrch[j];
            }
            if (ui0.isLetter) {
                mt.charInfo.isLetter = true;
                if (ui00.isLatin) 
                    mt.charInfo.isLatinLetter = true;
                else if (ui00.isCyrillic) 
                    mt.charInfo.isCyrillicLetter = true;
                if (mt.language.isUndefined) {
                    if (LanguageHelper.isCyrillic(mt.term)) 
                        mt.language = (defLang.isUndefined ? MorphLang.RU : defLang);
                }
                if (goodText) 
                    continue;
                let allUp = true;
                let allLo = true;
                for (j = mt.beginChar; j <= mt.endChar; j++) {
                    if (twrch[j].isUpper || twrch[j].isDigit) 
                        allLo = false;
                    else 
                        allUp = false;
                }
                if (allUp) 
                    mt.charInfo.isAllUpper = true;
                else if (allLo) 
                    mt.charInfo.isAllLower = true;
                else if (((ui0.isUpper || twrch[mt.beginChar].isDigit)) && mt.endChar > mt.beginChar) {
                    allLo = true;
                    for (j = mt.beginChar + 1; j <= mt.endChar; j++) {
                        if (twrch[j].isUpper || twrch[j].isDigit) {
                            allLo = false;
                            break;
                        }
                    }
                    if (allLo) 
                        mt.charInfo.isCapitalUpper = true;
                    else if (twrch[mt.endChar].isLower && (mt.endChar - mt.beginChar) > 1) {
                        allUp = true;
                        for (j = mt.beginChar; j < mt.endChar; j++) {
                            if (twrch[j].isLower) {
                                allUp = false;
                                break;
                            }
                        }
                        if (allUp) 
                            mt.charInfo.isLastLower = true;
                    }
                }
            }
            if (mt.charInfo.isLastLower && mt.length > 2 && mt.charInfo.isCyrillicLetter) {
                let pref = text.substring(mt.beginChar, mt.beginChar + mt.endChar - mt.beginChar);
                let ok = false;
                for (const wf of mt.wordForms) {
                    if (wf.normalCase === pref || wf.normalFull === pref) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    let wf0 = MorphWordForm._new218(pref, MorphClass.NOUN, 1);
                    mt.wordForms = Array.from(mt.wordForms);
                    mt.wordForms.splice(0, 0, wf0);
                }
            }
        }
        if (goodText || onlyTokenizing) 
            return res;
        for (i = 0; i < res.length; i++) {
            if (res[i].length === 1 && res[i].charInfo.isLatinLetter) {
                let ch = res[i].term[0];
                if (ch === 'C' || ch === 'A' || ch === 'P') {
                }
                else 
                    continue;
                let isRus = false;
                for (let ii = i - 1; ii >= 0; ii--) {
                    if ((res[ii].endChar + 1) !== res[ii + 1].beginChar) 
                        break;
                    else if (res[ii].charInfo.isLetter) {
                        isRus = res[ii].charInfo.isCyrillicLetter;
                        break;
                    }
                }
                if (!isRus) {
                    for (let ii = i + 1; ii < res.length; ii++) {
                        if ((res[ii - 1].endChar + 1) !== res[ii].beginChar) 
                            break;
                        else if (res[ii].charInfo.isLetter) {
                            isRus = res[ii].charInfo.isCyrillicLetter;
                            break;
                        }
                    }
                }
                if (isRus) {
                    res[i].term = LanguageHelper.transliteralCorrection(res[i].term, null, true);
                    res[i].charInfo.isCyrillicLetter = true;
                    res[i].charInfo.isLatinLetter = true;
                }
            }
        }
        for (const r of res) {
            if (r.charInfo.isAllUpper || r.charInfo.isCapitalUpper) {
                if (r.language.isCyrillic) {
                    let ok = false;
                    for (const wf of r.wordForms) {
                        if (wf._class.isProperSurname) {
                            ok = true;
                            break;
                        }
                    }
                    if (!ok) {
                        r.wordForms = Array.from(r.wordForms);
                        this.m_EngineRu.processSurnameVariants(r.term, r.wordForms);
                    }
                }
            }
        }
        for (const r of res) {
            for (const mv of r.wordForms) {
                if (mv.normalCase === null) 
                    mv.normalCase = r.term;
            }
        }
        for (i = 0; i < (res.length - 2); i++) {
            if (res[i].charInfo.isLatinLetter && res[i].charInfo.isAllUpper && res[i].length === 1) {
                if (twrch[res[i + 1].beginChar].isQuot && res[i + 2].charInfo.isLatinLetter && res[i + 2].length > 2) {
                    if ((res[i].endChar + 1) === res[i + 1].beginChar && (res[i + 1].endChar + 1) === res[i + 2].beginChar) {
                        let wstr = (res[i].term + res[i + 2].term);
                        let li = this.processOneWord0(wstr);
                        if (li !== null) 
                            res[i].wordForms = li;
                        res[i].endChar = res[i + 2].endChar;
                        res[i].term = wstr;
                        if (res[i + 2].charInfo.isAllLower) {
                            res[i].charInfo.isAllUpper = false;
                            res[i].charInfo.isCapitalUpper = true;
                        }
                        else if (!res[i + 2].charInfo.isAllUpper) 
                            res[i].charInfo.isAllUpper = false;
                        res.splice(i + 1, 2);
                    }
                }
            }
        }
        for (i = 0; i < (res.length - 1); i++) {
            if (!res[i].charInfo.isLetter && !res[i + 1].charInfo.isLetter && (res[i].endChar + 1) === res[i + 1].beginChar) {
                if (twrch[res[i].beginChar].isHiphen && twrch[res[i + 1].beginChar].isHiphen) {
                    if (i === 0 || !twrch[res[i - 1].beginChar].isHiphen) {
                    }
                    else 
                        continue;
                    if ((i + 2) === res.length || !twrch[res[i + 2].beginChar].isHiphen) {
                    }
                    else 
                        continue;
                    res[i].endChar = res[i + 1].endChar;
                    res.splice(i + 1, 1);
                }
            }
        }
        return res;
    }
    
    getCharTyp(ui) {
        if (ui.isLetter) 
            return 1;
        if (ui.isDigit) 
            return 2;
        if (ui.isWhitespace) 
            return 0;
        if (ui.isUdaren) 
            return 1;
        return ui.code;
    }
    
    getAllWordforms(word, lang) {
        if (LanguageHelper.isCyrillicChar(word[0])) {
            if (lang !== null) {
                if (this.m_EngineRu.language.isRu && lang.isRu) 
                    return this.m_EngineRu.getAllWordforms(word);
                if (this.m_EngineUa.language.isUa && lang.isUa) 
                    return this.m_EngineUa.getAllWordforms(word);
                if (this.m_EngineBy.language.isBy && lang.isBy) 
                    return this.m_EngineBy.getAllWordforms(word);
                if (this.m_EngineKz.language.isKz && lang.isKz) 
                    return this.m_EngineKz.getAllWordforms(word);
            }
            return this.m_EngineRu.getAllWordforms(word);
        }
        else 
            return this.m_EngineEn.getAllWordforms(word);
    }
    
    getWordform(word, cla, gender, cas, num, lang, addInfo) {
        if (LanguageHelper.isCyrillicChar(word[0])) {
            if (this.m_EngineRu.language.isRu && lang.isRu) 
                return this.m_EngineRu.getWordform(word, cla, gender, cas, num, addInfo);
            if (this.m_EngineUa.language.isUa && lang.isUa) 
                return this.m_EngineUa.getWordform(word, cla, gender, cas, num, addInfo);
            if (this.m_EngineBy.language.isBy && lang.isBy) 
                return this.m_EngineBy.getWordform(word, cla, gender, cas, num, addInfo);
            if (this.m_EngineKz.language.isKz && lang.isKz) 
                return this.m_EngineKz.getWordform(word, cla, gender, cas, num, addInfo);
            return this.m_EngineRu.getWordform(word, cla, gender, cas, num, addInfo);
        }
        else 
            return this.m_EngineEn.getWordform(word, cla, gender, cas, num, addInfo);
    }
    
    correctWordByMorph(word, lang, oneVar) {
        if (LanguageHelper.isCyrillicChar(word[0])) {
            if (lang !== null) {
                if (this.m_EngineRu.language.isRu && lang.isRu) 
                    return this.m_EngineRu.correctWordByMorph(word, oneVar);
                if (this.m_EngineUa.language.isUa && lang.isUa) 
                    return this.m_EngineUa.correctWordByMorph(word, oneVar);
                if (this.m_EngineBy.language.isBy && lang.isBy) 
                    return this.m_EngineBy.correctWordByMorph(word, oneVar);
                if (this.m_EngineKz.language.isKz && lang.isKz) 
                    return this.m_EngineKz.correctWordByMorph(word, oneVar);
            }
            return this.m_EngineRu.correctWordByMorph(word, oneVar);
        }
        else 
            return this.m_EngineEn.correctWordByMorph(word, oneVar);
    }
    
    processOneWord0(wstr) {
        let dl = new MorphLang();
        let wrapdl219 = new RefOutArgWrapper(dl);
        let inoutres220 = this.processOneWord(wstr, wrapdl219);
        dl = wrapdl219.value;
        return inoutres220;
    }
    
    processOneWord(wstr, defLang) {
        let lang = LanguageHelper.getWordLang(wstr);
        if (lang.isUndefined) {
            defLang.value = new MorphLang();
            return null;
        }
        if (lang.equals(MorphLang.EN)) 
            return this.m_EngineEn.process(wstr, false);
        if (defLang.value.equals(MorphLang.RU)) {
            if (lang.isRu) 
                return this.m_EngineRu.process(wstr, false);
        }
        if (lang.equals(MorphLang.RU)) {
            defLang.value = lang;
            return this.m_EngineRu.process(wstr, false);
        }
        if (defLang.value.equals(MorphLang.UA)) {
            if (lang.isUa) 
                return this.m_EngineUa.process(wstr, false);
        }
        if (lang.equals(MorphLang.UA)) {
            defLang.value = lang;
            return this.m_EngineUa.process(wstr, false);
        }
        if (defLang.value.equals(MorphLang.BY)) {
            if (lang.isBy) 
                return this.m_EngineBy.process(wstr, false);
        }
        if (lang.equals(MorphLang.BY)) {
            defLang.value = lang;
            return this.m_EngineBy.process(wstr, false);
        }
        if (defLang.value.equals(MorphLang.KZ)) {
            if (lang.isKz) 
                return this.m_EngineKz.process(wstr, false);
        }
        if (lang.equals(MorphLang.KZ)) {
            defLang.value = lang;
            return this.m_EngineKz.process(wstr, false);
        }
        let ru = null;
        if (lang.isRu) 
            ru = this.m_EngineRu.process(wstr, false);
        let ua = null;
        if (lang.isUa) 
            ua = this.m_EngineUa.process(wstr, false);
        let by = null;
        if (lang.isBy) 
            by = this.m_EngineBy.process(wstr, false);
        let kz = null;
        if (lang.isKz) 
            kz = this.m_EngineKz.process(wstr, false);
        let hasRu = false;
        let hasUa = false;
        let hasBy = false;
        let hasKz = false;
        if (ru !== null) {
            for (const wf of ru) {
                if (wf.isInDictionary) 
                    hasRu = true;
            }
        }
        if (ua !== null) {
            for (const wf of ua) {
                if (wf.isInDictionary) 
                    hasUa = true;
            }
        }
        if (by !== null) {
            for (const wf of by) {
                if (wf.isInDictionary) 
                    hasBy = true;
            }
        }
        if (kz !== null) {
            for (const wf of kz) {
                if (wf.isInDictionary) 
                    hasKz = true;
            }
        }
        if ((hasRu && !hasUa && !hasBy) && !hasKz) {
            defLang.value = MorphLang.RU;
            return ru;
        }
        if ((hasUa && !hasRu && !hasBy) && !hasKz) {
            defLang.value = MorphLang.UA;
            return ua;
        }
        if ((hasBy && !hasRu && !hasUa) && !hasKz) {
            defLang.value = MorphLang.BY;
            return by;
        }
        if ((hasKz && !hasRu && !hasUa) && !hasBy) {
            defLang.value = MorphLang.KZ;
            return kz;
        }
        if ((ru === null && ua === null && by === null) && kz === null) 
            return null;
        if ((ru !== null && ua === null && by === null) && kz === null) 
            return ru;
        if ((ua !== null && ru === null && by === null) && kz === null) 
            return ua;
        if ((by !== null && ru === null && ua === null) && kz === null) 
            return by;
        if ((kz !== null && ru === null && ua === null) && by === null) 
            return kz;
        let res = new Array();
        if (ru !== null) {
            lang = MorphLang.ooBitor(lang, MorphLang.RU);
            res.splice(res.length, 0, ...ru);
        }
        if (ua !== null) {
            lang = MorphLang.ooBitor(lang, MorphLang.UA);
            res.splice(res.length, 0, ...ua);
        }
        if (by !== null) {
            lang = MorphLang.ooBitor(lang, MorphLang.BY);
            res.splice(res.length, 0, ...by);
        }
        if (kz !== null) {
            lang = MorphLang.ooBitor(lang, MorphLang.KZ);
            res.splice(res.length, 0, ...kz);
        }
        return res;
    }
}


module.exports = InnerMorphology