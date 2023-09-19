/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphClass = require("./../../morph/MorphClass");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphGender = require("./../../morph/MorphGender");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphologyService = require("./../../morph/MorphologyService");
const NumberSpellingType = require("./../NumberSpellingType");
const BracketParseAttr = require("./BracketParseAttr");
const Token = require("./../Token");
const MetaToken = require("./../MetaToken");
const ReferentToken = require("./../ReferentToken");
const MorphWordForm = require("./../../morph/MorphWordForm");
const BracketHelper = require("./BracketHelper");
const NumberToken = require("./../NumberToken");
const MorphCase = require("./../../morph/MorphCase");
const TextToken = require("./../TextToken");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const MiscHelper = require("./MiscHelper");
const NounPhraseHelper = require("./NounPhraseHelper");

// Поддержка работы с собственными именами
class ProperNameHelper {
    
    static corrChars(str, ci, keepChars) {
        if (!keepChars) 
            return str;
        if (ci.isAllLower) 
            return str.toLowerCase();
        if (ci.isCapitalUpper) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(str);
        return str;
    }
    
    static getNameWithoutBrackets(begin, end, normalizeFirstNounGroup = false, normalFirstGroupSingle = false, ignoreGeoReferent = false) {
        let res = null;
        if (BracketHelper.canBeStartOfSequence(begin, false, false) && BracketHelper.canBeEndOfSequence(end, false, begin, false)) {
            begin = begin.next;
            end = end.previous;
        }
        if (normalizeFirstNounGroup && !begin.morph._class.isPreposition) {
            let npt = NounPhraseHelper.tryParse(begin, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null);
            if (npt !== null) {
                if (npt.noun.getMorphClassInDictionary().isUndefined && npt.adjectives.length === 0) 
                    npt = null;
            }
            if (npt !== null && npt.endToken.endChar > end.endChar) 
                npt = null;
            if (npt !== null) {
                res = npt.getNormalCaseText(null, (normalFirstGroupSingle ? MorphNumber.SINGULAR : MorphNumber.UNDEFINED), MorphGender.UNDEFINED, false);
                let te = npt.endToken.next;
                if (((te !== null && te.next !== null && te.isComma) && (te.next instanceof TextToken) && te.next.endChar <= end.endChar) && te.next.morph._class.isVerb && te.next.morph._class.isAdjective) {
                    for (const it of te.next.morph.items) {
                        if (it.gender === npt.morph.gender || ((it.gender.value()) & (npt.morph.gender.value())) !== (MorphGender.UNDEFINED.value())) {
                            if (!(MorphCase.ooBitand(it._case, npt.morph._case)).isUndefined) {
                                if (it.number === npt.morph.number || ((it.number.value()) & (npt.morph.number.value())) !== (MorphNumber.UNDEFINED.value())) {
                                    let _var = te.next.term;
                                    if (it instanceof MorphWordForm) 
                                        _var = it.normalCase;
                                    let bi = MorphBaseInfo._new795(MorphClass.ADJECTIVE, npt.morph.gender, npt.morph.number, npt.morph.language);
                                    try {
                                        _var = MorphologyService.getWordform(_var, bi);
                                    } catch (ex857) {
                                    }
                                    if (_var !== null) {
                                        res = (res + ", " + _var);
                                        te = te.next.next;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                if (te !== null && te.endChar <= end.endChar) {
                    let s = ProperNameHelper.getNameEx(te, end, MorphClass.UNDEFINED, MorphCase.UNDEFINED, MorphGender.UNDEFINED, true, ignoreGeoReferent);
                    if (!Utils.isNullOrEmpty(s)) {
                        if (!Utils.isLetterOrDigit(s[0])) 
                            res = (res + s);
                        else 
                            res = (res + " " + s);
                    }
                }
            }
            else if ((begin instanceof TextToken) && begin.chars.isCyrillicLetter) {
                let mm = begin.getMorphClassInDictionary();
                if (!mm.isUndefined) {
                    res = begin.getNormalCaseText(mm, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                    if (begin.endChar < end.endChar) 
                        res = (res + " " + ProperNameHelper.getNameEx(begin.next, end, MorphClass.UNDEFINED, MorphCase.UNDEFINED, MorphGender.UNDEFINED, true, false));
                }
            }
        }
        if (res === null) 
            res = ProperNameHelper.getNameEx(begin, end, MorphClass.UNDEFINED, MorphCase.UNDEFINED, MorphGender.UNDEFINED, true, ignoreGeoReferent);
        if (!Utils.isNullOrEmpty(res)) {
            let k = 0;
            for (let i = res.length - 1; i >= 0; i--,k++) {
                if (res[i] === '*' || Utils.isWhitespace(res[i])) {
                }
                else 
                    break;
            }
            if (k > 0) {
                if (k === res.length) 
                    return null;
                res = res.substring(0, 0 + res.length - k);
            }
        }
        return res;
    }
    
    static getName(begin, end) {
        let res = ProperNameHelper.getNameEx(begin, end, MorphClass.UNDEFINED, MorphCase.UNDEFINED, MorphGender.UNDEFINED, false, false);
        return res;
    }
    
    static getNameEx(begin, end, cla, mc, gender = MorphGender.UNDEFINED, ignoreBracketsAndHiphens = false, ignoreGeoReferent = false) {
        if (end === null || begin === null) 
            return null;
        if (begin.endChar > end.beginChar && begin !== end) 
            return null;
        let res = new StringBuilder();
        let prefix = null;
        for (let t = begin; t !== null && t.endChar <= end.endChar; t = t.next) {
            if (res.length > 1000) 
                break;
            if (t.isTableControlChar) 
                continue;
            if (ignoreBracketsAndHiphens) {
                if (BracketHelper.isBracket(t, false)) {
                    if (t === end) 
                        break;
                    if (t.isCharOf("(<[")) {
                        let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                        if (br !== null && br.endChar <= end.endChar) {
                            let tmp = ProperNameHelper.getNameEx(br.beginToken.next, br.endToken.previous, MorphClass.UNDEFINED, MorphCase.UNDEFINED, MorphGender.UNDEFINED, ignoreBracketsAndHiphens, false);
                            if (tmp !== null) {
                                if ((br.endChar === end.endChar && br.beginToken.next === br.endToken.previous && !br.beginToken.next.chars.isLetter) && !(br.beginToken.next instanceof ReferentToken)) {
                                }
                                else 
                                    res.append(" ").append(t.getSourceText()).append(tmp).append(br.endToken.getSourceText());
                            }
                            t = br.endToken;
                        }
                    }
                    continue;
                }
                if (t.isHiphen) {
                    if (t === end) 
                        break;
                    else if (t.isWhitespaceBefore || t.isWhitespaceAfter) 
                        continue;
                }
            }
            let tt = Utils.as(t, TextToken);
            if (tt !== null) {
                if (!ignoreBracketsAndHiphens) {
                    if ((tt.next !== null && tt.next.isHiphen && (tt.next.next instanceof TextToken)) && tt !== end && tt.next !== end) {
                        if (prefix === null) 
                            prefix = tt.term;
                        else 
                            prefix = (prefix + "-" + tt.term);
                        t = tt.next;
                        if (t === end) 
                            break;
                        else 
                            continue;
                    }
                }
                let s = null;
                if (cla.value !== (0) || !mc.isUndefined || gender !== MorphGender.UNDEFINED) {
                    for (const wff of tt.morph.items) {
                        let wf = Utils.as(wff, MorphWordForm);
                        if (wf === null) 
                            continue;
                        if (cla.value !== (0)) {
                            if ((((wf._class.value) & (cla.value))) === 0) 
                                continue;
                        }
                        if (!mc.isUndefined) {
                            if ((MorphCase.ooBitand(wf._case, mc)).isUndefined) 
                                continue;
                        }
                        if (gender !== MorphGender.UNDEFINED) {
                            if (((wf.gender.value()) & (gender.value())) === (MorphGender.UNDEFINED.value())) 
                                continue;
                        }
                        if (s === null || wf.normalCase === tt.term) 
                            s = wf.normalCase;
                    }
                    if (s === null && gender !== MorphGender.UNDEFINED) {
                        for (const wff of tt.morph.items) {
                            let wf = Utils.as(wff, MorphWordForm);
                            if (wf === null) 
                                continue;
                            if (cla.value !== (0)) {
                                if ((((wf._class.value) & (cla.value))) === 0) 
                                    continue;
                            }
                            if (!mc.isUndefined) {
                                if ((MorphCase.ooBitand(wf._case, mc)).isUndefined) 
                                    continue;
                            }
                            if (s === null || wf.normalCase === tt.term) 
                                s = wf.normalCase;
                        }
                    }
                }
                if (s === null) {
                    s = tt.term;
                    if (tt.chars.isLastLower && tt.lengthChar > 2) {
                        s = tt.getSourceText();
                        for (let i = s.length - 1; i >= 0; i--) {
                            if (Utils.isUpperCase(s[i])) {
                                s = s.substring(0, 0 + i + 1);
                                break;
                            }
                        }
                    }
                }
                if (prefix !== null) {
                    let delim = "-";
                    if (ignoreBracketsAndHiphens) 
                        delim = " ";
                    s = (prefix + delim + s);
                }
                prefix = null;
                if (res.length > 0 && s.length > 0) {
                    if (Utils.isLetterOrDigit(s[0])) {
                        let ch0 = res.charAt(res.length - 1);
                        if (ch0 === '-') {
                        }
                        else 
                            res.append(' ');
                    }
                    else if (!ignoreBracketsAndHiphens && BracketHelper.canBeStartOfSequence(tt, false, false)) 
                        res.append(' ');
                }
                res.append(s);
            }
            else if (t instanceof NumberToken) {
                if (res.length > 0) {
                    if (!t.isWhitespaceBefore && res.charAt(res.length - 1) === '-') {
                    }
                    else 
                        res.append(' ');
                }
                let nt = Utils.as(t, NumberToken);
                if ((t.morph._class.isAdjective && nt.typ === NumberSpellingType.WORDS && nt.beginToken === nt.endToken) && (nt.beginToken instanceof TextToken)) 
                    res.append(nt.beginToken.term);
                else 
                    res.append(nt.value);
            }
            else if (t instanceof MetaToken) {
                if ((ignoreGeoReferent && t !== begin && t.getReferent() !== null) && t.getReferent().typeName === "GEO") 
                    continue;
                let s = ProperNameHelper.getNameEx(t.beginToken, t.endToken, cla, mc, gender, ignoreBracketsAndHiphens, ignoreGeoReferent);
                if (!Utils.isNullOrEmpty(s)) {
                    if (res.length > 0) {
                        if (!t.isWhitespaceBefore && res.charAt(res.length - 1) === '-') {
                        }
                        else 
                            res.append(' ');
                    }
                    res.append(s);
                }
            }
            if (t === end) 
                break;
        }
        if (res.length === 0) 
            return null;
        return res.toString();
    }
}


module.exports = ProperNameHelper