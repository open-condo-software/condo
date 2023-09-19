/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphNumber = require("./../../morph/MorphNumber");
const LanguageHelper = require("./../../morph/LanguageHelper");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const MorphGender = require("./../../morph/MorphGender");
const BracketSequenceToken = require("./BracketSequenceToken");
const Token = require("./../Token");
const BracketParseAttr = require("./BracketParseAttr");
const MorphClass = require("./../../morph/MorphClass");
const TextToken = require("./../TextToken");
const MetaToken = require("./../MetaToken");
const MiscHelper = require("./MiscHelper");

/**
 * Поддержка анализа скобок и кавычек
 * 
 * Хелпер скобок и кавычек
 */
class BracketHelper {
    
    /**
     * Проверка, что с этого токена может начинаться последовательность, а сам токен является открывающей скобкой или кавычкой
     * @param t проверяемый токен
     * @param quotesOnly должны быть именно кавычка, а не скобка
     * @return да-нет
     * 
     */
    static canBeStartOfSequence(t, quotesOnly = false, ignoreWhitespaces = false) {
        let tt = Utils.as(t, TextToken);
        if (tt === null || tt.next === null) 
            return false;
        let ch = tt.term[0];
        if (Utils.isLetterOrDigit(ch)) 
            return false;
        if (quotesOnly && (BracketHelper.m_Quotes.indexOf(ch) < 0)) 
            return false;
        if (t.next === null) 
            return false;
        if (BracketHelper.m_OpenChars.indexOf(ch) < 0) 
            return false;
        if (!ignoreWhitespaces) {
            if (t.isWhitespaceAfter) {
                if (!t.isWhitespaceBefore) {
                    if (t.previous !== null && t.previous.isTableControlChar) {
                    }
                    else 
                        return false;
                }
                if (t.isNewlineAfter) 
                    return false;
            }
            else if (!t.isWhitespaceBefore) {
                if (Utils.isLetterOrDigit(t.kit.getTextCharacter(t.beginChar - 1))) {
                    if (t.next !== null && ((t.next.chars.isAllLower || !t.next.chars.isLetter))) {
                        if (ch !== '(') 
                            return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * Проверка, что на этом токене может заканчиваться последовательность, а сам токен является закрывающей скобкой или кавычкой
     * @param t проверяемый токен
     * @param quotesOnly должны быть именно кавычка, а не скобка
     * @param openToken это ссылка на токен, который был открывающим
     * @return да-нет
     * 
     */
    static canBeEndOfSequence(t, quotesOnly = false, openToken = null, ignoreWhitespaces = false) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return false;
        let ch = tt.term[0];
        if (Utils.isLetterOrDigit(ch)) 
            return false;
        if (t.previous === null) 
            return false;
        if (BracketHelper.m_CloseChars.indexOf(ch) < 0) 
            return false;
        if (quotesOnly) {
            if (BracketHelper.m_Quotes.indexOf(ch) < 0) 
                return false;
        }
        if (!ignoreWhitespaces) {
            if (!t.isWhitespaceAfter) {
                if (t.isWhitespaceBefore) {
                    if (t.next !== null && t.next.isTableControlChar) {
                    }
                    else 
                        return false;
                }
                if (t.isNewlineBefore) 
                    return false;
            }
            else if (t.isWhitespaceBefore) {
                if (Utils.isLetterOrDigit(t.kit.getTextCharacter(t.endChar + 1))) 
                    return false;
                if (!t.isWhitespaceAfter) 
                    return false;
            }
        }
        if (openToken instanceof TextToken) {
            let ch0 = openToken.term[0];
            let i = BracketHelper.m_OpenChars.indexOf(ch0);
            if (i < 0) 
                return BracketHelper.m_CloseChars.indexOf(ch) < 0;
            let ii = BracketHelper.m_CloseChars.indexOf(ch);
            return ii === i;
        }
        return true;
    }
    
    /**
     * Проверка символа, что он может быть скобкой или кавычкой
     * @param ch проверяемый символ
     * @param quotesOnly должны быть именно кавычка, а не скобка
     * @return да-нет
     */
    static isBracketChar(ch, quotesOnly = false) {
        if (BracketHelper.m_OpenChars.indexOf(ch) >= 0 || BracketHelper.m_CloseChars.indexOf(ch) >= 0) {
            if (!quotesOnly) 
                return true;
            return BracketHelper.m_Quotes.indexOf(ch) >= 0;
        }
        return false;
    }
    
    /**
     * Проверка токена, что он является скобкой или кавычкой
     * @param t проверяемый токен
     * @param quotesOnly должны быть именно кавычка, а не скобка
     * @return да-нет
     */
    static isBracket(t, quotesOnly = false) {
        if (t === null) 
            return false;
        if (t.isCharOf(BracketHelper.m_OpenChars)) {
            if (quotesOnly) {
                if (t instanceof TextToken) {
                    if (BracketHelper.m_Quotes.indexOf(t.term[0]) < 0) 
                        return false;
                }
            }
            return true;
        }
        if (t.isCharOf(BracketHelper.m_CloseChars)) {
            if (quotesOnly) {
                if (t instanceof TextToken) {
                    if (BracketHelper.m_Quotes.indexOf(t.term[0]) < 0) 
                        return false;
                }
            }
            return true;
        }
        return false;
    }
    
    /**
     * Попробовать восстановить последовательность, обрамляемую кавычками или скобками. Поддерживается 
     * вложенность, возможность отсутствия закрывающего элемента и др.
     * @param t начальный токен
     * @param attrs параметры выделения
     * @param maxTokens максимально токенов (вдруг забыли закрывающую кавычку)
     * @return метатокен BracketSequenceToken
     * 
     */
    static tryParse(t, attrs = BracketParseAttr.NO, maxTokens = 100) {
        const NounPhraseHelper = require("./NounPhraseHelper");
        let t0 = t;
        let cou = 0;
        if (!BracketHelper.canBeStartOfSequence(t0, false, false)) 
            return null;
        let brList = new Array();
        brList.push(new BracketHelper.Bracket(t0));
        cou = 0;
        let crlf = 0;
        let last = null;
        let lev = 1;
        let isAssim = brList[0]._char !== '«' && BracketHelper.m_AssymOPenChars.indexOf(brList[0]._char) >= 0;
        let genCase = false;
        for (t = t0.next; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            last = t;
            if (t.isCharOf(BracketHelper.m_OpenChars) || t.isCharOf(BracketHelper.m_CloseChars)) {
                if (t.isNewlineBefore && (((attrs.value()) & (BracketParseAttr.CANBEMANYLINES.value()))) === (BracketParseAttr.NO.value())) {
                    if (t.whitespacesBeforeCount > 10 || BracketHelper.canBeStartOfSequence(t, false, false)) {
                        if (t.isChar('(') && !t0.isChar('(')) {
                        }
                        else {
                            last = t.previous;
                            break;
                        }
                    }
                }
                let bb = new BracketHelper.Bracket(t);
                brList.push(bb);
                if (brList.length > 20) 
                    break;
                if (((brList.length === 3 && brList[1].canBeOpen && bb.canBeClose) && bb._char !== ')' && BracketHelper.mustBeCloseChar(bb._char, brList[1]._char)) && BracketHelper.mustBeCloseChar(bb._char, brList[0]._char)) {
                    let ok = false;
                    for (let tt = t.next; tt !== null; tt = tt.next) {
                        if (tt.isNewlineBefore) 
                            break;
                        if (tt.isChar(',')) 
                            break;
                        if (tt.isChar('.')) {
                            for (tt = tt.next; tt !== null; tt = tt.next) {
                                if (tt.isNewlineBefore) 
                                    break;
                                else if (tt.isCharOf(BracketHelper.m_OpenChars) || tt.isCharOf(BracketHelper.m_CloseChars)) {
                                    let bb2 = new BracketHelper.Bracket(tt);
                                    if (BracketHelper.canBeEndOfSequence(tt, false, null, false) && BracketHelper.canBeCloseChar(bb2._char, brList[0]._char, false)) 
                                        ok = true;
                                    break;
                                }
                            }
                            break;
                        }
                        if (t.isCharOf(BracketHelper.m_OpenChars) || t.isCharOf(BracketHelper.m_CloseChars)) {
                            ok = true;
                            break;
                        }
                    }
                    if (!ok) 
                        break;
                }
                if (isAssim) {
                    if (bb.canBeOpen && !bb.canBeClose && bb._char === brList[0]._char) 
                        lev++;
                    else if (bb.canBeClose && !bb.canBeOpen && BracketHelper.m_OpenChars.indexOf(brList[0]._char) === BracketHelper.m_CloseChars.indexOf(bb._char)) {
                        lev--;
                        if (lev === 0) 
                            break;
                    }
                }
            }
            else {
                if ((++cou) > maxTokens) 
                    break;
                if ((((attrs.value()) & (BracketParseAttr.CANCONTAINSVERBS.value()))) === (BracketParseAttr.NO.value())) {
                    if (t.morph.language.isCyrillic) {
                        if (t.getMorphClassInDictionary().equals(MorphClass.VERB)) {
                            if (!t.morph._class.isAdjective && !t.morph.containsAttr("страд.з.", null)) {
                                if (t.chars.isAllLower) {
                                    let norm = t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                                    if (!LanguageHelper.endsWith(norm, "СЯ")) {
                                        if (brList.length > 1) 
                                            break;
                                        if (brList[0]._char !== '(') 
                                            break;
                                    }
                                }
                            }
                        }
                    }
                    else if (t.morph.language.isEn) {
                        if (t.morph._class.equals(MorphClass.VERB) && t.chars.isAllLower) 
                            break;
                    }
                    let r = t.getReferent();
                    if (r !== null && r.typeName === "ADDRESS") {
                        if (!t0.isChar('(')) 
                            break;
                    }
                }
            }
            if ((((attrs.value()) & (BracketParseAttr.CANBEMANYLINES.value()))) !== (BracketParseAttr.NO.value())) {
                if (t.isNewlineBefore) {
                    if (t.newlinesBeforeCount > 1) 
                        break;
                    crlf++;
                }
                continue;
            }
            if (t.isNewlineBefore) {
                if (t.whitespacesBeforeCount > 15) {
                    last = t.previous;
                    break;
                }
                crlf++;
                if (!t.chars.isAllLower) {
                    if (MiscHelper.canBeStartOfSentence(t)) {
                        let has = false;
                        for (let tt = t.next; tt !== null; tt = tt.next) {
                            if (tt.isNewlineBefore) 
                                break;
                            else if (tt.lengthChar === 1 && tt.isCharOf(BracketHelper.m_OpenChars) && tt.isWhitespaceBefore) 
                                break;
                            else if (tt.lengthChar === 1 && tt.isCharOf(BracketHelper.m_CloseChars) && !tt.isWhitespaceBefore) {
                                has = true;
                                break;
                            }
                        }
                        if (!has) {
                            last = t.previous;
                            break;
                        }
                    }
                }
                if ((t.previous instanceof MetaToken) && BracketHelper.canBeEndOfSequence(t.previous.endToken, false, null, false)) {
                    last = t.previous;
                    break;
                }
            }
            if (crlf > 1) {
                if (brList.length > 1) 
                    break;
                if (crlf > 10) 
                    break;
            }
            if (t.isChar(';') && t.isNewlineAfter) 
                break;
            if ((((attrs.value()) & (BracketParseAttr.INTERNALUSAGE.value()))) === (BracketParseAttr.NO.value())) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) {
                    if (t.isNewlineBefore) 
                        genCase = npt.morph._case.isGenitive;
                    last = (t = npt.endToken);
                }
            }
        }
        if ((brList.length === 1 && brList[0].canBeOpen && (last instanceof MetaToken)) && last.isNewlineAfter) {
            if (BracketHelper.canBeEndOfSequence(last.endToken, false, null, false)) 
                return new BracketSequenceToken(t0, last);
        }
        if ((brList.length === 1 && brList[0].canBeOpen && genCase) && last.isNewlineAfter && crlf <= 2) 
            return new BracketSequenceToken(t0, last);
        if (brList.length < 1) 
            return null;
        for (let i = 1; i < (brList.length - 1); i++) {
            if (brList[i]._char === '<' && brList[i + 1]._char === '>') {
                brList[i].canBeOpen = true;
                brList[i + 1].canBeClose = true;
            }
        }
        let internals = null;
        while (brList.length > 3) {
            let i = brList.length - 1;
            if ((brList[i].canBeClose && brList[i - 1].canBeOpen && !BracketHelper.canBeCloseChar(brList[i]._char, brList[0]._char, false)) && BracketHelper.canBeCloseChar(brList[i]._char, brList[i - 1]._char, false)) {
                brList.splice(brList.length - 2, 2);
                continue;
            }
            break;
        }
        while (brList.length >= 4) {
            let changed = false;
            for (let i = 1; i < (brList.length - 2); i++) {
                if ((brList[i].canBeOpen && !brList[i].canBeClose && brList[i + 1].canBeClose) && !brList[i + 1].canBeOpen) {
                    let ok = false;
                    if (BracketHelper.mustBeCloseChar(brList[i + 1]._char, brList[i]._char) || brList[i]._char !== brList[0]._char) {
                        ok = true;
                        if ((i === 1 && ((i + 2) < brList.length) && brList[i + 2]._char === ')') && brList[i + 1]._char !== ')' && BracketHelper.canBeCloseChar(brList[i + 1]._char, brList[i - 1]._char, false)) 
                            brList[i + 2] = brList[i + 1];
                    }
                    else if (i > 1 && ((i + 2) < brList.length) && BracketHelper.mustBeCloseChar(brList[i + 2]._char, brList[i - 1]._char)) 
                        ok = true;
                    if (ok) {
                        if (internals === null) 
                            internals = new Array();
                        internals.push(new BracketSequenceToken(brList[i].source, brList[i + 1].source));
                        brList.splice(i, 2);
                        changed = true;
                        break;
                    }
                }
            }
            if (!changed) 
                break;
        }
        let res = null;
        if ((brList.length >= 4 && brList[1].canBeOpen && brList[2].canBeClose) && brList[3].canBeClose && !brList[3].canBeOpen) {
            if (BracketHelper.canBeCloseChar(brList[3]._char, brList[0]._char, false)) {
                res = new BracketSequenceToken(brList[0].source, brList[3].source);
                if (brList[0].source.next !== brList[1].source || brList[2].source.next !== brList[3].source) 
                    res.internal.push(new BracketSequenceToken(brList[1].source, brList[2].source));
                if (internals !== null) 
                    res.internal.splice(res.internal.length, 0, ...internals);
            }
        }
        if ((res === null && brList.length >= 3 && brList[2].canBeClose) && !brList[2].canBeOpen) {
            if ((((attrs.value()) & (BracketParseAttr.NEARCLOSEBRACKET.value()))) !== (BracketParseAttr.NO.value())) {
                if (BracketHelper.canBeCloseChar(brList[1]._char, brList[0]._char, false)) 
                    return new BracketSequenceToken(brList[0].source, brList[1].source);
            }
            let ok = true;
            if (BracketHelper.canBeCloseChar(brList[2]._char, brList[0]._char, false) && BracketHelper.canBeCloseChar(brList[1]._char, brList[0]._char, false) && brList[1].canBeClose) {
                for (t = brList[1].source; t !== brList[2].source && t !== null; t = t.next) {
                    if (t.isNewlineBefore) {
                        ok = false;
                        break;
                    }
                    if (t.chars.isLetter && t.chars.isAllLower) {
                        ok = false;
                        break;
                    }
                    if ((((attrs.value()) & (BracketParseAttr.INTERNALUSAGE.value()))) === (BracketParseAttr.NO.value())) {
                        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                        if (npt !== null) 
                            t = npt.endToken;
                    }
                }
                if (ok) {
                    for (t = brList[0].source.next; t !== brList[1].source && t !== null; t = t.next) {
                        if (t.isNewlineBefore) 
                            return new BracketSequenceToken(brList[0].source, t.previous);
                    }
                }
                let lev1 = 0;
                for (let tt = brList[0].source.previous; tt !== null; tt = tt.previous) {
                    if (tt.isNewlineAfter || tt.isTableControlChar) 
                        break;
                    if (!(tt instanceof TextToken)) 
                        continue;
                    if (tt.chars.isLetter || tt.lengthChar > 1) 
                        continue;
                    let ch = tt.term[0];
                    if (BracketHelper.canBeCloseChar(ch, brList[0]._char, false)) 
                        lev1++;
                    else if (BracketHelper.canBeCloseChar(brList[1]._char, ch, false)) {
                        lev1--;
                        if (lev1 < 0) 
                            return new BracketSequenceToken(brList[0].source, brList[1].source);
                    }
                }
            }
            if (ok && BracketHelper.canBeCloseChar(brList[2]._char, brList[0]._char, false)) {
                let intern = new BracketSequenceToken(brList[1].source, brList[2].source);
                res = new BracketSequenceToken(brList[0].source, brList[2].source);
                res.internal.push(intern);
            }
            else if (ok && BracketHelper.canBeCloseChar(brList[2]._char, brList[1]._char, false) && brList[0].canBeOpen) {
                if (BracketHelper.canBeCloseChar(brList[2]._char, brList[0]._char, false)) {
                    let intern = new BracketSequenceToken(brList[1].source, brList[2].source);
                    res = new BracketSequenceToken(brList[0].source, brList[2].source);
                    res.internal.push(intern);
                }
                else if (brList.length === 3) 
                    return null;
            }
        }
        if (res === null && brList.length > 1) {
            let hasCr = false;
            for (let tt = brList[0].source.next; tt.endChar < brList[1].source.beginChar; tt = tt.next) {
                if (tt.isNewlineAfter) 
                    hasCr = true;
            }
            if (BracketHelper.canBeCloseChar(brList[1]._char, brList[0]._char, hasCr)) 
                res = new BracketSequenceToken(brList[0].source, brList[1].source);
        }
        if (res === null && brList.length === 2 && brList[0]._char === brList[1]._char) 
            res = new BracketSequenceToken(brList[0].source, brList[1].source);
        if (res !== null && internals !== null) {
            for (const i of internals) {
                if (i.beginChar < res.endChar) 
                    res.internal.push(i);
            }
        }
        if (res === null) {
            cou = 0;
            for (let tt = t0.next; tt !== null; tt = tt.next,cou++) {
                if (tt.isTableControlChar) 
                    break;
                if (MiscHelper.canBeStartOfSentence(tt)) 
                    break;
                if (maxTokens > 0 && cou > maxTokens) 
                    break;
                let mt = Utils.as(tt, MetaToken);
                if (mt === null) 
                    continue;
                if (mt.endToken instanceof TextToken) {
                    if (mt.endToken.isCharOf(BracketHelper.m_CloseChars)) {
                        let bb = new BracketHelper.Bracket(Utils.as(mt.endToken, TextToken));
                        if (bb.canBeClose && BracketHelper.canBeCloseChar(bb._char, brList[0]._char, false)) 
                            return new BracketSequenceToken(t0, tt);
                    }
                }
            }
        }
        return res;
    }
    
    static canBeCloseChar(close, open, strict = false) {
        let i = BracketHelper.m_OpenChars.indexOf(open);
        if (i < 0) 
            return false;
        let j = BracketHelper.m_CloseChars.indexOf(close);
        if (i === j) 
            return true;
        if (!strict) {
            if (open === '"' && ((close === '“' || close === '”' || close === '»'))) 
                return true;
            if (open === '”' && ((close === '“' || close === '"'))) 
                return true;
            if (open === '“' && ((close === '"' || close === '”'))) 
                return true;
        }
        return false;
    }
    
    static mustBeCloseChar(close, open) {
        if (BracketHelper.m_AssymOPenChars.indexOf(open) < 0) 
            return false;
        let i = BracketHelper.m_OpenChars.indexOf(open);
        let j = BracketHelper.m_CloseChars.indexOf(close);
        return i === j;
    }
    
    static static_constructor() {
        BracketHelper.m_OpenChars = "\"'`’<{([«“„”";
        BracketHelper.m_CloseChars = "\"'`’>})]»”“";
        BracketHelper.m_Quotes = "\"'`’«“<”„»>";
        BracketHelper.m_AssymOPenChars = "<{([«";
    }
}


BracketHelper.Bracket = class  {
    
    constructor(t) {
        const TextToken = require("./../TextToken");
        this.source = null;
        this._char = '\0';
        this.canBeOpen = false;
        this.canBeClose = false;
        this.source = t;
        if (t instanceof TextToken) 
            this._char = t.term[0];
        this.canBeOpen = BracketHelper.canBeStartOfSequence(t, false, false);
        this.canBeClose = BracketHelper.canBeEndOfSequence(t, false, null, false);
    }
    
    toString() {
        let res = new StringBuilder();
        res.append("!").append(this._char).append(" ");
        if (this.canBeOpen) 
            res.append(" Open");
        if (this.canBeClose) 
            res.append(" Close");
        return res.toString();
    }
}


BracketHelper.static_constructor();

module.exports = BracketHelper