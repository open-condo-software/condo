/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const SerializerHelper = require("./core/internal/SerializerHelper");

/**
 * Анализируемый текст, точнее, обёртка над ним
 * 
 * Источник анализа
 */
class SourceOfAnalysis {
    
    get text() {
        return this._text;
    }
    set text(value) {
        this._text = value;
        return this._text;
    }
    
    get tag() {
        return this._tag;
    }
    set tag(value) {
        this._tag = value;
        return this._tag;
    }
    
    /**
     * Создать контейнер на основе плоского текста. 
     * При создании будут автоматически сделаны транслитеральные замены, если они будут найдены.
     * @param txt Анализируемый текст
     */
    constructor(txt) {
        this._text = null;
        this._tag = null;
        this.clearDust = false;
        this.crlfCorrectedCount = 0;
        this.doWordCorrectionByMorph = false;
        this.doWordsMergingByMorph = true;
        this.createNumberTokens = true;
        this.correctionDict = null;
        this.userParams = null;
        this.ignoredBeginChar = 0;
        this.ignoredEndChar = 0;
        this.m_TotalTransliteralSubstitutions = 0;
        if (Utils.isNullOrEmpty(txt)) {
            this.text = "";
            return;
        }
        this.text = txt;
    }
    
    // Это анализ случаев принудительно отформатированного текста
    doCrLfCorrection(txt) {
        let i = 0;
        let j = 0;
        let cou = 0;
        let totalLen = 0;
        for (i = 0; i < txt.length; i++) {
            let ch = txt[i];
            if ((ch.charCodeAt(0)) !== 0xD && (ch.charCodeAt(0)) !== 0xA) 
                continue;
            let len = 0;
            let lastChar = ch;
            for (j = i + 1; j < txt.length; j++) {
                ch = txt[j];
                if ((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0xA) 
                    break;
                else if ((ch.charCodeAt(0)) === 0x9) 
                    len += 5;
                else {
                    lastChar = ch;
                    len++;
                }
            }
            if (j >= txt.length) 
                break;
            if (len < 30) 
                continue;
            if (lastChar !== '.' && lastChar !== ':' && lastChar !== ';') {
                let nextIsDig = false;
                for (let k = j + 1; k < txt.length; k++) {
                    if (!Utils.isWhitespace(txt[k])) {
                        if (Utils.isDigit(txt[k])) 
                            nextIsDig = true;
                        break;
                    }
                }
                if (!nextIsDig) {
                    cou++;
                    totalLen += len;
                }
            }
            i = j;
        }
        if (cou < 4) 
            return txt;
        totalLen = Utils.intDiv(totalLen, cou);
        if ((totalLen < 50) || totalLen > 100) 
            return txt;
        let tmp = new StringBuilder(txt);
        for (i = 0; i < tmp.length; i++) {
            let ch = tmp.charAt(i);
            let jj = 0;
            let len = 0;
            let lastChar = ch;
            for (j = i + 1; j < tmp.length; j++) {
                ch = tmp.charAt(j);
                if ((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0xA) 
                    break;
                else if ((ch.charCodeAt(0)) === 0x9) 
                    len += 5;
                else {
                    lastChar = ch;
                    len++;
                }
            }
            if (j >= tmp.length) 
                break;
            for (jj = j - 1; jj >= 0; jj--) {
                if (!Utils.isWhitespace((lastChar = tmp.charAt(jj)))) 
                    break;
            }
            let notSingle = false;
            jj = j + 1;
            if ((jj < tmp.length) && (tmp.charAt(j).charCodeAt(0)) === 0xD && (tmp.charAt(jj).charCodeAt(0)) === 0xA) 
                jj++;
            for (; jj < tmp.length; jj++) {
                ch = tmp.charAt(jj);
                if (!Utils.isWhitespace(ch)) 
                    break;
                if ((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0xA) {
                    notSingle = true;
                    break;
                }
            }
            if (((!notSingle && len > (totalLen - 20) && (len < (totalLen + 10))) && lastChar !== '.' && lastChar !== ':') && lastChar !== ';') {
                tmp.setCharAt(j, ' ');
                this.crlfCorrectedCount++;
                if ((j + 1) < tmp.length) {
                    ch = tmp.charAt(j + 1);
                    if ((ch.charCodeAt(0)) === 0xA) {
                        tmp.setCharAt(j + 1, ' ');
                        j++;
                    }
                }
            }
            i = j - 1;
        }
        return tmp.toString();
    }
    
    // Произвести транслитеральную коррекцию
    static doTransliteralCorrection(txt, info) {
        let i = 0;
        let j = 0;
        let k = 0;
        let stat = 0;
        let prefRusWord = false;
        for (i = 0; i < txt.length; i++) {
            if (Utils.isLetter(txt.charAt(i))) {
                let rus = 0;
                let pureLat = 0;
                let unknown = 0;
                for (j = i; j < txt.length; j++) {
                    let ch = txt.charAt(j);
                    if (!Utils.isLetter(ch)) 
                        break;
                    let code = ch.charCodeAt(0);
                    if (code >= 0x400 && (code < 0x500)) 
                        rus++;
                    else if (SourceOfAnalysis.m_LatChars.indexOf(ch) >= 0) 
                        unknown++;
                    else 
                        pureLat++;
                }
                if (((unknown > 0 && rus > 0)) || ((unknown > 0 && pureLat === 0 && prefRusWord))) {
                    if (info !== null) {
                        if (info.length > 0) 
                            info.append("\r\n");
                        for (k = i; k < j; k++) {
                            info.append(txt.charAt(k));
                        }
                        info.append(": ");
                    }
                    for (k = i; k < j; k++) {
                        let ii = SourceOfAnalysis.m_LatChars.indexOf(txt.charAt(k));
                        if (ii >= 0) {
                            if (info !== null) 
                                info.append(txt.charAt(k)).append("->").append(SourceOfAnalysis.m_RusChars[ii]).append(" ");
                            txt.setCharAt(k, SourceOfAnalysis.m_RusChars[ii]);
                        }
                    }
                    stat += unknown;
                    prefRusWord = true;
                }
                else 
                    prefRusWord = rus > 0;
                i = j;
            }
        }
        return stat;
    }
    
    static calcTransliteralStatistics(txt, info) {
        if (txt === null) 
            return 0;
        let tmp = new StringBuilder(txt);
        return SourceOfAnalysis.doTransliteralCorrection(tmp, info);
    }
    
    get totalTransliteralSubstitutions() {
        return this.m_TotalTransliteralSubstitutions;
    }
    
    /**
     * Извлечь фрагмент из исходного текста. Переходы на новую строку заменяются пробелами.
     * @param position начальная позиция
     * @param length длина
     * @return фрагмент
     */
    substring(position, length) {
        if (length < 0) 
            length = this.text.length - position;
        if ((position + length) <= this.text.length && length > 0) {
            let res = this.text.substring(position, position + length);
            if (res.indexOf("\r\n") >= 0) 
                res = Utils.replaceString(res, "\r\n", " ");
            if (res.indexOf('\n') >= 0) 
                res = Utils.replaceString(res, "\n", " ");
            return res;
        }
        return "Position + Length > Text.Length";
    }
    
    // Вычислить расстояние в символах между соседними элементами
    calcWhitespaceDistanceBetweenPositions(posFrom, posTo) {
        if (posFrom === (posTo + 1)) 
            return 0;
        if (posFrom > posTo || (posFrom < 0) || posTo >= this.text.length) 
            return -1;
        let res = 0;
        for (let i = posFrom; i <= posTo; i++) {
            let ch = this.text[i];
            if (!Utils.isWhitespace(ch)) 
                return -1;
            if (ch === '\r' || ch === '\n') 
                res += 10;
            else if (ch === '\t') 
                res += 5;
            else 
                res++;
        }
        return res;
    }
    
    serialize(stream) {
        SerializerHelper.serializeString(stream, this.text);
    }
    
    deserialize(stream) {
        this.text = SerializerHelper.deserializeString(stream);
    }
    
    static _new110(_arg1, _arg2, _arg3, _arg4) {
        let res = new SourceOfAnalysis(_arg1);
        res.correctionDict = _arg2;
        res.doWordCorrectionByMorph = _arg3;
        res.userParams = _arg4;
        return res;
    }
    
    static _new160(_arg1, _arg2) {
        let res = new SourceOfAnalysis(_arg1);
        res.userParams = _arg2;
        return res;
    }
    
    static _new800(_arg1, _arg2) {
        let res = new SourceOfAnalysis(_arg1);
        res.createNumberTokens = _arg2;
        return res;
    }
    
    static static_constructor() {
        SourceOfAnalysis.m_LatChars = "ABEKMHOPCTYXaekmopctyx";
        SourceOfAnalysis.m_RusChars = "АВЕКМНОРСТУХаекморстух";
    }
}


SourceOfAnalysis.static_constructor();

module.exports = SourceOfAnalysis