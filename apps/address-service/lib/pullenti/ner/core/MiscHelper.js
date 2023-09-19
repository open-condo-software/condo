/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const GetTextAttr = require("./GetTextAttr");
const LanguageHelper = require("./../../morph/LanguageHelper");
const DerivateService = require("./../../semantic/utils/DerivateService");
const ProcessorService = require("./../ProcessorService");
const RusLatAccord = require("./internal/RusLatAccord");
const MorphClass = require("./../../morph/MorphClass");
const MorphPerson = require("./../../morph/MorphPerson");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const MorphCase = require("./../../morph/MorphCase");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const NumberSpellingType = require("./../NumberSpellingType");
const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const Token = require("./../Token");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const ReferentToken = require("./../ReferentToken");
const NumberToken = require("./../NumberToken");
const CanBeEqualsAttr = require("./CanBeEqualsAttr");
const SourceOfAnalysis = require("./../SourceOfAnalysis");

/**
 * Разные полезные процедурки лингвистического анализа. Особо полезные функции выделены шрифтом.
 * 
 * Лингвистический хелпер
 */
class MiscHelper {
    
    /**
     * Сравнение, чтобы не было больше одной ошибки в написании. 
     * Ошибка - это замена буквы или пропуск буквы.
     * @param value правильное написание
     * @param t проверяемый токен
     * @return да-нет
     */
    static isNotMoreThanOneError(value, t) {
        const MetaToken = require("./../MetaToken");
        if (t === null) 
            return false;
        if (t instanceof TextToken) {
            let tt = Utils.as(t, TextToken);
            if (t.isValue(value, null)) 
                return true;
            if (MiscHelper._isNotMoreThanOneError(value, tt.term, true)) 
                return true;
            for (const wf of tt.morph.items) {
                if (wf instanceof MorphWordForm) {
                    if (MiscHelper._isNotMoreThanOneError(value, wf.normalCase, true)) 
                        return true;
                }
            }
        }
        else if ((t instanceof MetaToken) && t.beginToken === t.endToken) 
            return MiscHelper.isNotMoreThanOneError(value, t.beginToken);
        else if (MiscHelper._isNotMoreThanOneError(value, t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), true)) 
            return true;
        return false;
    }
    
    static _isNotMoreThanOneError(pattern, test, tmp = false) {
        if (test === null || pattern === null) 
            return false;
        if (test.length === pattern.length) {
            let cou = 0;
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] !== test[i]) {
                    if ((++cou) > 1) 
                        return false;
                }
            }
            return true;
        }
        if (test.length === (pattern.length - 1)) {
            let i = 0;
            for (i = 0; i < test.length; i++) {
                if (pattern[i] !== test[i]) 
                    break;
            }
            if (i < 2) 
                return false;
            if (i === test.length) 
                return true;
            for (; i < test.length; i++) {
                if (pattern[i + 1] !== test[i]) 
                    return false;
            }
            return true;
        }
        if (!tmp && (test.length - 1) === pattern.length) {
            let i = 0;
            for (i = 0; i < pattern.length; i++) {
                if (pattern[i] !== test[i]) 
                    break;
            }
            if (i < 2) 
                return false;
            if (i === pattern.length) 
                return true;
            for (; i < pattern.length; i++) {
                if (pattern[i] !== test[i + 1]) 
                    return false;
            }
            return true;
        }
        return false;
    }
    
    /**
     * Проверить написание слова вразбивку по буквам (например:   П Р И К А З)
     * @param word проверяемое слово
     * @param t начальный токен
     * @param useMorphVariants перебирать ли падежи у слова
     * @return токен последней буквы или null
     */
    static tryAttachWordByLetters(word, t, useMorphVariants = false) {
        let t1 = Utils.as(t, TextToken);
        if (t1 === null) 
            return null;
        let i = 0;
        let j = 0;
        for (; t1 !== null; t1 = Utils.as(t1.next, TextToken)) {
            let s = t1.term;
            for (j = 0; (j < s.length) && ((i + j) < word.length); j++) {
                if (word[i + j] !== s[j]) 
                    break;
            }
            if (j < s.length) {
                if (!useMorphVariants) 
                    return null;
                if (i < 5) 
                    return null;
                let tmp = new StringBuilder();
                tmp.append(word.substring(0, 0 + i));
                for (let tt = t1; tt !== null; tt = tt.next) {
                    if (!(tt instanceof TextToken) || !tt.chars.isLetter || tt.isNewlineBefore) 
                        break;
                    t1 = Utils.as(tt, TextToken);
                    tmp.append(t1.term);
                }
                try {
                    let li = MorphologyService.process(tmp.toString(), t.morph.language, null);
                    if (li !== null) {
                        for (const l of li) {
                            if (l.wordForms !== null) {
                                for (const wf of l.wordForms) {
                                    if (wf.normalCase === word || wf.normalFull === word) 
                                        return t1;
                                }
                            }
                        }
                    }
                } catch (ex) {
                }
                return null;
            }
            i += j;
            if (i === word.length) 
                return t1;
        }
        return null;
    }
    
    /**
     * Сравнение 2-х строк на предмет равенства с учётом морфологии и пунктуации (то есть инвариантно относительно них). 
     * Функция довольно трудоёмка, не использовать без крайней необходимости. 
     * ВНИМАНИЕ! Вместо этой функции теперь используйте CanBeEqualsEx.
     * @param s1 первая строка
     * @param s2 вторая строка
     * @param ignoreNonletters игнорировать небуквенные символы
     * @param ignoreCase игнорировать регистр символов
     * @param checkMorphEquAfterFirstNoun после первого существительного слова должны полностью совпадать
     * @return да-нет
     */
    static canBeEquals(s1, s2, ignoreNonletters = true, ignoreCase = true, checkMorphEquAfterFirstNoun = false) {
        let attrs = CanBeEqualsAttr.NO;
        if (ignoreNonletters) 
            attrs = CanBeEqualsAttr.of((attrs.value()) | (CanBeEqualsAttr.IGNORENONLETTERS.value()));
        if (ignoreCase) 
            attrs = CanBeEqualsAttr.of((attrs.value()) | (CanBeEqualsAttr.IGNOREUPPERCASE.value()));
        if (checkMorphEquAfterFirstNoun) 
            attrs = CanBeEqualsAttr.of((attrs.value()) | (CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN.value()));
        return MiscHelper.canBeEqualsEx(s1, s2, attrs);
    }
    
    /**
     * Сравнение 2-х строк на предмет равенства с учётом морфологии и пунктуации (то есть инвариантно относительно них). 
     * Функция довольно трудоёмка, не использовать без крайней необходимости.
     * @param s1 первая строка
     * @param s2 вторая строка
     * @param attrs дополнительные атрибуты
     * @return да-нет
     */
    static canBeEqualsEx(s1, s2, attrs) {
        const BracketHelper = require("./BracketHelper");
        const AnalysisKit = require("./AnalysisKit");
        if (Utils.isNullOrEmpty(s1) || Utils.isNullOrEmpty(s2)) 
            return false;
        if (s1 === s2) 
            return true;
        try {
            let ak1 = new AnalysisKit(new SourceOfAnalysis(s1));
            let ak2 = new AnalysisKit(new SourceOfAnalysis(s2));
            let t1 = ak1.firstToken;
            let t2 = ak2.firstToken;
            let wasNoun = false;
            while (t1 !== null || t2 !== null) {
                if (t1 !== null) {
                    if (t1 instanceof TextToken) {
                        if (!t1.chars.isLetter && !t1.isChar('№')) {
                            if (BracketHelper.isBracket(t1, false) && (((attrs.value()) & (CanBeEqualsAttr.USEBRACKETS.value()))) !== (CanBeEqualsAttr.NO.value())) {
                            }
                            else {
                                if (t1.isHiphen) 
                                    wasNoun = false;
                                if (((!t1.isCharOf("()") && !t1.isHiphen)) || (((attrs.value()) & (CanBeEqualsAttr.IGNORENONLETTERS.value()))) !== (CanBeEqualsAttr.NO.value())) {
                                    t1 = t1.next;
                                    continue;
                                }
                            }
                        }
                    }
                }
                if (t2 !== null) {
                    if (t2 instanceof TextToken) {
                        if (!t2.chars.isLetter && !t2.isChar('№')) {
                            if (BracketHelper.isBracket(t2, false) && (((attrs.value()) & (CanBeEqualsAttr.USEBRACKETS.value()))) !== (CanBeEqualsAttr.NO.value())) {
                            }
                            else {
                                if (t2.isHiphen) 
                                    wasNoun = false;
                                if (((!t2.isCharOf("()") && !t2.isHiphen)) || (((attrs.value()) & (CanBeEqualsAttr.IGNORENONLETTERS.value()))) !== (CanBeEqualsAttr.NO.value())) {
                                    t2 = t2.next;
                                    continue;
                                }
                            }
                        }
                    }
                }
                if (t1 instanceof NumberToken) {
                    if (!(t2 instanceof NumberToken)) 
                        break;
                    if (t1.value !== t2.value) 
                        break;
                    t1 = t1.next;
                    t2 = t2.next;
                    continue;
                }
                if (!(t1 instanceof TextToken) || !(t2 instanceof TextToken)) 
                    break;
                if ((((attrs.value()) & (CanBeEqualsAttr.IGNOREUPPERCASE.value()))) === (CanBeEqualsAttr.NO.value())) {
                    if (t1.previous === null && (((attrs.value()) & (CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD.value()))) !== (CanBeEqualsAttr.NO.value())) {
                    }
                    else if (!t1.chars.equals(t2.chars)) 
                        return false;
                }
                if (!t1.chars.isLetter) {
                    let bs1 = BracketHelper.canBeStartOfSequence(t1, false, false);
                    let bs2 = BracketHelper.canBeStartOfSequence(t2, false, false);
                    if (bs1 !== bs2) 
                        return false;
                    if (bs1) {
                        t1 = t1.next;
                        t2 = t2.next;
                        continue;
                    }
                    bs1 = BracketHelper.canBeEndOfSequence(t1, false, null, false);
                    bs2 = BracketHelper.canBeEndOfSequence(t2, false, null, false);
                    if (bs1 !== bs2) 
                        return false;
                    if (bs1) {
                        t1 = t1.next;
                        t2 = t2.next;
                        continue;
                    }
                    if (t1.isHiphen && t2.isHiphen) {
                    }
                    else if (t1.term !== t2.term) 
                        return false;
                    t1 = t1.next;
                    t2 = t2.next;
                    continue;
                }
                let ok = false;
                if (wasNoun && (((attrs.value()) & (CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN.value()))) !== (CanBeEqualsAttr.NO.value())) {
                    if (t1.term === t2.term) 
                        ok = true;
                }
                else {
                    let tt = Utils.as(t1, TextToken);
                    for (const it of tt.morph.items) {
                        if (it instanceof MorphWordForm) {
                            let wf = Utils.as(it, MorphWordForm);
                            if (t2.isValue(wf.normalCase, null) || t2.isValue(wf.normalFull, null)) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (tt.getMorphClassInDictionary().isNoun) 
                        wasNoun = true;
                    if (!ok && t1.isHiphen && t2.isHiphen) 
                        ok = true;
                    if (!ok) {
                        if (t2.isValue(tt.term, null) || t2.isValue(tt.lemma, null)) 
                            ok = true;
                    }
                }
                if (ok) {
                    t1 = t1.next;
                    t2 = t2.next;
                    continue;
                }
                break;
            }
            if ((((attrs.value()) & (CanBeEqualsAttr.FIRSTCANBESHORTER.value()))) !== (CanBeEqualsAttr.NO.value())) {
                if (t1 === null) 
                    return true;
            }
            return t1 === null && t2 === null;
        } catch (ex) {
            return false;
        }
    }
    
    /**
     * Проверка того, может ли здесь начинаться новое предложение. Для проверки токена 
     * конца предложения используйте CanBeStartOfSentence(t.Next) проверку на начало следующего в цепочке токена.
     * @param t токен начала предложения
     * @return да-нет
     * 
     */
    static canBeStartOfSentence(t) {
        if (t === null) 
            return false;
        if (t.previous === null) 
            return true;
        if (!t.isTableControlChar && t.previous.isTableControlChar) 
            return true;
        if (!t.isWhitespaceBefore) {
            if (t.previous !== null && t.previous.isTableControlChar) {
            }
            else 
                return false;
        }
        if (t.chars.isLetter && t.chars.isAllLower) {
            if (t.previous.chars.isLetter && t.previous.chars.isAllLower) 
                return false;
            if (((t.previous.isHiphen || t.previous.isComma)) && !t.previous.isWhitespaceBefore && t.previous.previous !== null) {
                if (t.previous.previous.chars.isLetter && t.previous.previous.chars.isAllLower) 
                    return false;
            }
        }
        if (t.whitespacesBeforeCount > 25 || t.newlinesBeforeCount > 2) 
            return true;
        if (t.previous.isCommaAnd || t.previous.morph._class.isConjunction) 
            return false;
        if (MiscHelper.isEngArticle(t.previous)) 
            return false;
        if (t.previous.isChar(':')) 
            return false;
        if (t.previous.isChar(';') && t.isNewlineBefore) 
            return true;
        if (t.previous.isHiphen) {
            if (t.previous.isNewlineBefore) 
                return true;
            let pp = t.previous.previous;
            if (pp !== null && pp.isChar('.')) 
                return true;
        }
        if (t.chars.isLetter && t.chars.isAllLower) 
            return false;
        if (t.isNewlineBefore) 
            return true;
        if (t.previous.isCharOf("!?") || t.previous.isTableControlChar) 
            return true;
        if (t.previous.isChar('.') || (((t.previous instanceof ReferentToken) && t.previous.endToken.isChar('.')))) {
            if (t.whitespacesBeforeCount > 1) 
                return true;
            if (t.next !== null && t.next.isChar('.')) {
                if ((t.previous.previous instanceof TextToken) && t.previous.previous.chars.isAllLower && !(t.previous instanceof ReferentToken)) {
                }
                else if (t.previous.previous instanceof ReferentToken) {
                }
                else 
                    return false;
            }
            if ((t.previous.previous instanceof NumberToken) && t.previous.isWhitespaceBefore) {
                if (t.previous.previous.typ !== NumberSpellingType.WORDS) 
                    return false;
            }
            return true;
        }
        if (MiscHelper.isEngArticle(t)) 
            return true;
        return false;
    }
    
    /**
     * Переместиться на конец предложения
     * @param t токен, с которого идёт поиск
     * @return последний токен предложения (не обязательно точка!)
     */
    static findEndOfSentence(t) {
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.next === null) 
                return tt;
            else if (MiscHelper.canBeStartOfSentence(tt)) 
                return (tt === t ? t : tt.previous);
        }
        return null;
    }
    
    /**
     * Проверка различных способов написания ключевых слов для номеров (ном., №, рег.номер и пр.)
     * @param t начало префикса
     * @return null, если не префикс, или токен, следующий сразу за префиксом номера
     * 
     */
    static checkNumberPrefix(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let s = t.term;
        let t1 = null;
        if (((t.isValue("ПО", null) || t.isValue("ЗА", null))) && t.next !== null) 
            t = t.next;
        if ((((t.isValue("РЕГИСТРАЦИОННЫЙ", "РЕЄСТРАЦІЙНИЙ") || t.isValue("ГОСУДАРСТВЕННЫЙ", "ДЕРЖАВНИЙ") || t.isValue("ТРАНЗИТНЫЙ", "ТРАНЗИТНИЙ")) || t.isValue("ДЕЛО", null) || t.isValue("СПРАВА", null))) && (t.next instanceof TextToken)) {
            t = t.next;
            s = t.term;
        }
        else if ((s === "РЕГ" || s === "ГОС" || s === "ТРАНЗ") || s === "ИНВ") {
            if (t.next !== null && t.next.isChar('.')) 
                t = t.next;
            if (t.next instanceof TextToken) {
                t = t.next;
                s = t.term;
            }
            else 
                return null;
        }
        if (((t.isValue("НОМЕР", null) || s === "№" || s === "N") || s === "NO" || s === "NN") || s === "НР") {
            t1 = t.next;
            if (t1 !== null && ((t1.isCharOf("°№") || ((t1.isValue("О", null) && !t1.isNewlineBefore))))) 
                t1 = t1.next;
            if (((t1 !== null && t1.isValue("П", null) && t1.next !== null) && ((t1.next.isHiphen || t1.next.isCharOf("\\/"))) && t1.next.next !== null) && t1.next.next.isValue("П", null)) 
                t1 = t1.next.next.next;
            if (t1 !== null && t1.isChar('.')) 
                t1 = t1.next;
            if (t1 !== null && t1.isChar(':')) 
                t1 = t1.next;
        }
        else if (s === "НОМ") {
            t1 = t.next;
            if (t1 !== null && t1.isChar('.')) 
                t1 = t1.next;
        }
        while (t1 !== null) {
            if (t1.isValue("ЗАПИСЬ", null)) 
                t1 = t1.next;
            else if (t1.isValue("В", null) && t1.next !== null && t1.next.isValue("РЕЕСТР", null)) 
                t1 = t1.next.next;
            else 
                break;
        }
        return t1;
    }
    
    /**
     * Преобразовать строку, чтобы первая буква стала большой, остальные маленькие
     * @param str преобразуемая строка
     * @return преобразованная строка
     */
    static convertFirstCharUpperAndOtherLower(str) {
        if (Utils.isNullOrEmpty(str)) 
            return str;
        let fStrTmp = new StringBuilder();
        fStrTmp.append(str.toLowerCase());
        let i = 0;
        let up = true;
        fStrTmp.replace(" .", ".");
        for (i = 0; i < fStrTmp.length; i++) {
            if (Utils.isLetter(fStrTmp.charAt(i))) {
                if (up) {
                    if (((i + 1) >= fStrTmp.length || Utils.isLetter(fStrTmp.charAt(i + 1)) || ((fStrTmp.charAt(i + 1) === '.' || fStrTmp.charAt(i + 1) === '-'))) || i === 0) 
                        fStrTmp.setCharAt(i, fStrTmp.charAt(i).toUpperCase());
                }
                up = false;
            }
            else if (!Utils.isDigit(fStrTmp.charAt(i))) 
                up = true;
        }
        fStrTmp.replace(" - ", "-");
        return fStrTmp.toString();
    }
    
    /**
     * Сделать аббревиатуру для строки из нескольких слов
     * @param name строка
     * @return аббревиатура
     */
    static getAbbreviation(name) {
        let abbr = new StringBuilder();
        let i = 0;
        let j = 0;
        for (i = 0; i < name.length; i++) {
            if (Utils.isDigit(name[i])) 
                break;
            else if (Utils.isLetter(name[i])) {
                for (j = i + 1; j < name.length; j++) {
                    if (!Utils.isLetter(name[j])) 
                        break;
                }
                if ((j - i) > 2) {
                    let w = name.substring(i, i + j - i);
                    if (w !== "ПРИ") 
                        abbr.append(name[i]);
                }
                i = j;
            }
        }
        if (abbr.length < 2) 
            return null;
        return abbr.toString().toUpperCase();
    }
    
    // Получить аббревиатуру (уже не помню, какую именно...)
    static getTailAbbreviation(name) {
        let i = 0;
        let j = 0;
        for (i = 0; i < name.length; i++) {
            if (name[i] === ' ') 
                j++;
        }
        if (j < 2) 
            return null;
        let a0 = String.fromCharCode(0);
        let a1 = String.fromCharCode(0);
        j = 0;
        for (i = name.length - 2; i > 0; i--) {
            if (name[i] === ' ') {
                let le = 0;
                for (let jj = i + 1; jj < name.length; jj++) {
                    if (name[jj] === ' ') 
                        break;
                    else 
                        le++;
                }
                if (le < 4) 
                    break;
                if (j === 0) 
                    a1 = name[i + 1];
                else if (j === 1) {
                    a0 = name[i + 1];
                    if (Utils.isLetter(a0) && Utils.isLetter(a1)) 
                        return (name.substring(0, 0 + i) + " " + a0 + a1);
                    break;
                }
                j++;
            }
        }
        return null;
    }
    
    /**
     * Попытка через транслитеральную замену сделать альтернативное написание строки 
     * Например, А-10 => A-10  (здесь латиница и кириллица).
     * @param str исходная строка
     * @return если null, то не получается (значит, есть непереводимые буквы)
     */
    static createCyrLatAlternative(str) {
        if (str === null) 
            return null;
        let cyr = 0;
        let cyrToLat = 0;
        let lat = 0;
        let latToCyr = 0;
        for (let i = 0; i < str.length; i++) {
            let ch = str[i];
            if (LanguageHelper.isLatinChar(ch)) {
                lat++;
                if (LanguageHelper.getCyrForLat(ch) !== (String.fromCharCode(0))) 
                    latToCyr++;
            }
            else if (LanguageHelper.isCyrillicChar(ch)) {
                cyr++;
                if (LanguageHelper.getLatForCyr(ch) !== (String.fromCharCode(0))) 
                    cyrToLat++;
            }
        }
        if (cyr > 0 && cyrToLat === cyr) {
            if (lat > 0) 
                return null;
            let tmp = new StringBuilder(str);
            for (let i = 0; i < tmp.length; i++) {
                if (LanguageHelper.isCyrillicChar(tmp.charAt(i))) 
                    tmp.setCharAt(i, LanguageHelper.getLatForCyr(tmp.charAt(i)));
            }
            return tmp.toString();
        }
        if (lat > 0 && latToCyr === lat) {
            if (cyr > 0) 
                return null;
            let tmp = new StringBuilder(str);
            for (let i = 0; i < tmp.length; i++) {
                if (LanguageHelper.isLatinChar(tmp.charAt(i))) 
                    tmp.setCharAt(i, LanguageHelper.getCyrForLat(tmp.charAt(i)));
            }
            return tmp.toString();
        }
        return null;
    }
    
    /**
     * Преобразовать слово, написанное по латыни, в варианты на русском языке. 
     * Например, "Mikhail" -> "Михаил"
     * @param str строка на латыни
     * @return варианты на русском языке
     */
    static convertLatinWordToRussianVariants(str) {
        return MiscHelper._ConvertWord(str, true);
    }
    
    /**
     * Преобразовать слово, написанное в кириллице, в варианты на латинице.
     * @param str строка на кириллице
     * @return варианты на латинице
     */
    static convertRussianWordToLatinVariants(str) {
        return MiscHelper._ConvertWord(str, false);
    }
    
    static _ConvertWord(str, latinToRus) {
        if (str === null) 
            return null;
        if (str.length === 0) 
            return null;
        str = str.toUpperCase();
        let res = new Array();
        let vars = new Array();
        let i = 0;
        let j = 0;
        for (i = 0; i < str.length; i++) {
            let v = new Array();
            if (latinToRus) 
                j = RusLatAccord.findAccordsLatToRus(str, i, v);
            else 
                j = RusLatAccord.findAccordsRusToLat(str, i, v);
            if (j < 1) {
                j = 1;
                v.push(str.substring(i, i + 1));
            }
            vars.push(v);
            i += (j - 1);
        }
        if (latinToRus && ("AEIJOUY".indexOf(str[str.length - 1]) < 0)) {
            let v = new Array();
            v.push("");
            v.push("Ь");
            vars.push(v);
        }
        let strTmp = new StringBuilder();
        let inds = new Array();
        for (i = 0; i < vars.length; i++) {
            inds.push(0);
        }
        while (true) {
            strTmp.length = 0;
            for (i = 0; i < vars.length; i++) {
                if (vars[i].length > 0) 
                    strTmp.append(vars[i][inds[i]]);
            }
            res.push(strTmp.toString());
            for (i = inds.length - 1; i >= 0; i--) {
                inds[i]++;
                if (inds[i] < vars[i].length) 
                    break;
                inds[i] = 0;
            }
            if (i < 0) 
                break;
        }
        return res;
    }
    
    /**
     * Получение абсолютного нормализованного значения (с учётом гласных, удалением невидимых знаков и т.п.). 
     * Используется для сравнений различных вариантов написаний. 
     * Преобразования:  гласные заменяются на *, Щ на Ш, Х на Г, одинаковые соседние буквы сливаются, 
     * Ъ и Ь выбрасываются. 
     * Например, ХАБИБУЛЛИН -  Г*Б*Б*Л*Н
     * @param str строка
     * @return если null, то не удалось нормализовать (слишком короткий)
     */
    static getAbsoluteNormalValue(str, getAlways = false) {
        let res = new StringBuilder();
        let k = 0;
        for (let i = 0; i < str.length; i++) {
            if (LanguageHelper.isCyrillicVowel(str[i]) || str[i] === 'Й' || LanguageHelper.isLatinVowel(str[i])) {
                if (res.length > 0 && res.charAt(res.length - 1) === '*') {
                }
                else 
                    res.append('*');
            }
            else if (str[i] !== 'Ь' && str[i] !== 'Ъ') {
                let ch = str[i];
                if (ch === 'Щ') 
                    ch = 'Ш';
                if (ch === 'Х') 
                    ch = 'Г';
                if (ch === ' ') 
                    ch = '-';
                res.append(ch);
                k++;
            }
        }
        if (res.length > 0 && res.charAt(res.length - 1) === '*') 
            res.length = res.length - 1;
        for (let i = res.length - 1; i > 0; i--) {
            if (res.charAt(i) === res.charAt(i - 1) && res.charAt(i) !== '*') 
                res.remove(i, 1);
        }
        for (let i = res.length - 1; i > 0; i--) {
            if (res.charAt(i - 1) === '*' && res.charAt(i) === '-') 
                res.remove(i - 1, 1);
        }
        if (!getAlways) {
            if ((res.length < 3) || (k < 2)) 
                return null;
        }
        return res.toString();
    }
    
    /**
     * Проверка, что хотя бы одно из слов внутри заданного диапазона находится в морфологическом словаре
     * @param begin начальный токен
     * @param end конечный токен
     * @param cla проверяемая часть речи
     * @return да-нет
     */
    static isExistsInDictionary(begin, end, cla) {
        let ret = false;
        for (let t = begin; t !== null; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (tt !== null) {
                if (tt.isHiphen) 
                    ret = false;
                for (const wf of tt.morph.items) {
                    if (cla.value === (0) || (((cla.value) & (wf._class.value))) !== 0) {
                        if ((wf instanceof MorphWordForm) && wf.isInDictionary) {
                            ret = true;
                            break;
                        }
                    }
                }
            }
            if (t === end) 
                break;
        }
        return ret;
    }
    
    /**
     * Проверка, что токен - "одушевлённая" словоформа
     * @param t токен
     * @return да-нет
     */
    static isTokenAnimate(t) {
        const MetaToken = require("./../MetaToken");
        if (!(t instanceof TextToken)) {
            if (t instanceof MetaToken) 
                return MiscHelper.isTokenAnimate(t.endToken);
            return false;
        }
        if (t.morph.containsAttr("одуш.", null)) 
            return true;
        let ww = DerivateService.findWords(t.lemma, null);
        if (ww !== null) {
            for (const w of ww) {
                if (w.attrs.isAnimal || w.attrs.isAnimated || w.attrs.isMan) 
                    return true;
            }
        }
        return false;
    }
    
    // Проверка, что все в заданном диапазоне в нижнем регистре
    static isAllCharactersLower(begin, end, errorIfNotText = false) {
        for (let t = begin; t !== null; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (tt === null) {
                if (errorIfNotText) 
                    return false;
            }
            else if (!tt.chars.isAllLower) 
                return false;
            if (t === end) 
                break;
        }
        return true;
    }
    
    /**
     * Проверка, что текстовой токен имеет хотя бы одну гласную
     * @param t токен
     * @return да-нет
     */
    static hasVowel(t) {
        if (t === null) 
            return false;
        let tmp = t.term.normalize('NFD');
        for (const ch of tmp) {
            if (LanguageHelper.isCyrillicVowel(ch) || LanguageHelper.isLatinVowel(ch)) 
                return true;
        }
        return false;
    }
    
    /**
     * Проверка акронима, что из первых букв слов диапазона может получиться проверяемый акроним. 
     * Например,  РФ = Российская Федерация, ГосПлан = государственный план
     * @param acr акроним
     * @param begin начало диапазона
     * @param end конец диапазона
     * @return да-нет
     */
    static testAcronym(acr, begin, end) {
        if (!(acr instanceof TextToken)) 
            return false;
        if (begin === null || end === null || begin.endChar >= end.beginChar) 
            return false;
        let str = acr.term;
        let i = 0;
        for (let t = begin; t !== null && t.previous !== end; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            if (i >= str.length) 
                return false;
            let s = tt.term;
            if (s[0] !== str[i]) 
                return false;
            i++;
        }
        if (i >= str.length) 
            return true;
        return false;
    }
    
    // Получить вариант на кириллице и\или латинице
    static getCyrLatWord(t, maxLen = 0) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) {
            let rt = Utils.as(t, ReferentToken);
            if ((rt !== null && (rt.lengthChar < 3) && rt.beginToken === rt.endToken) && (rt.beginToken instanceof TextToken)) 
                tt = Utils.as(rt.beginToken, TextToken);
            else 
                return null;
        }
        if (!tt.chars.isLetter) 
            return null;
        let str = tt.getSourceText();
        if (maxLen > 0 && str.length > maxLen) 
            return null;
        let cyr = new StringBuilder();
        let lat = new StringBuilder();
        for (const s of str) {
            if (LanguageHelper.isLatinChar(s)) {
                if (lat !== null) 
                    lat.append(s);
                let i = MiscHelper.m_Lat.indexOf(s);
                if (i < 0) 
                    cyr = null;
                else if (cyr !== null) 
                    cyr.append(MiscHelper.m_Cyr[i]);
            }
            else if (LanguageHelper.isCyrillicChar(s)) {
                if (cyr !== null) 
                    cyr.append(s);
                let i = MiscHelper.m_Cyr.indexOf(s);
                if (i < 0) 
                    lat = null;
                else if (lat !== null) 
                    lat.append(MiscHelper.m_Lat[i]);
            }
            else 
                return null;
        }
        if (cyr === null && lat === null) 
            return null;
        let res = new MiscHelper.CyrLatWord();
        if (cyr !== null) 
            res.cyrWord = cyr.toString().toUpperCase();
        if (lat !== null) 
            res.latWord = lat.toString().toUpperCase();
        return res;
    }
    
    /**
     * Проверка на возможную эквивалентность русского и латинского написания одного и того же слова
     * @param t токен
     * @param str проверяемая строка
     * @return да-нет
     */
    static canBeEqualCyrAndLatTS(t, str) {
        if (t === null || Utils.isNullOrEmpty(str)) 
            return false;
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return false;
        if (MiscHelper.canBeEqualCyrAndLatSS(tt.term, str)) 
            return true;
        for (const wf of tt.morph.items) {
            if ((wf instanceof MorphWordForm) && MiscHelper.canBeEqualCyrAndLatSS(wf.normalCase, str)) 
                return true;
        }
        return false;
    }
    
    /**
     * Проверка на возможную эквивалентность русского и латинского написания одного и того же слова. 
     * Например,  ИКЕЯ ? IKEA
     * @param t1 токен на одном языке
     * @param t2 токен на другом языке
     * @return да-нет
     */
    static canBeEqualCyrAndLatTT(t1, t2) {
        let tt1 = Utils.as(t1, TextToken);
        let tt2 = Utils.as(t2, TextToken);
        if (tt1 === null || tt2 === null) 
            return false;
        if (MiscHelper.canBeEqualCyrAndLatTS(t2, tt1.term)) 
            return true;
        for (const wf of tt1.morph.items) {
            if ((wf instanceof MorphWordForm) && MiscHelper.canBeEqualCyrAndLatTS(t2, wf.normalCase)) 
                return true;
        }
        return false;
    }
    
    /**
     * Проверка на возможную эквивалентность русского и латинского написания одного и того же слова. 
     * Например,  ИКЕЯ ? IKEA
     * @param str1 слово на одном языке
     * @param str2 слово на другом языке
     * @return да-нет
     */
    static canBeEqualCyrAndLatSS(str1, str2) {
        if (Utils.isNullOrEmpty(str1) || Utils.isNullOrEmpty(str2)) 
            return false;
        if (LanguageHelper.isCyrillicChar(str1[0]) && LanguageHelper.isLatinChar(str2[0])) 
            return RusLatAccord.canBeEquals(str1, str2);
        if (LanguageHelper.isCyrillicChar(str2[0]) && LanguageHelper.isLatinChar(str1[0])) 
            return RusLatAccord.canBeEquals(str2, str1);
        return false;
    }
    
    /**
     * Получить текст, покрываемый метатокеном. Текст корректируется в соответствии с атрибутами.
     * @param mt метатокен
     * @param attrs атрибуты преобразования текста
     * @return результирующая строка
     * 
     */
    static getTextValueOfMetaToken(mt, attrs = GetTextAttr.NO) {
        const NounPhraseMultivarToken = require("./NounPhraseMultivarToken");
        if (mt === null) 
            return null;
        if (mt instanceof NounPhraseMultivarToken) {
            let nt = Utils.as(mt, NounPhraseMultivarToken);
            let res = new StringBuilder();
            if (nt.source.preposition !== null) 
                res.append(MiscHelper._getTextValue_(nt.source.preposition.beginToken, nt.source.preposition.endToken, attrs, null)).append(" ");
            for (let k = nt.adjIndex1; k <= nt.adjIndex2; k++) {
                res.append(MiscHelper._getTextValue_(nt.source.adjectives[k].beginToken, nt.source.adjectives[k].endToken, attrs, null)).append(" ");
            }
            res.append(MiscHelper._getTextValue_(nt.source.noun.beginToken, nt.source.noun.endToken, attrs, null));
            return res.toString();
        }
        return MiscHelper._getTextValue_(mt.beginToken, mt.endToken, attrs, mt.getReferent());
    }
    
    /**
     * Получить текст, задаваемый диапазоном токенов. Текст корректируется в соответствии с атрибутами.
     * @param begin начальный токен
     * @param end конечный токен
     * @param attrs атрибуты преобразования текста
     * @return результирующая строка
     * 
     */
    static getTextValue(begin, end, attrs = GetTextAttr.NO) {
        let str = MiscHelper._getTextValue_(begin, end, attrs, null);
        return str;
    }
    
    static _getTextValue_(begin, end, attrs, r) {
        const MetaToken = require("./../MetaToken");
        const NounPhraseHelper = require("./NounPhraseHelper");
        const BracketHelper = require("./BracketHelper");
        if (begin === null || end === null || begin.endChar > end.endChar) 
            return null;
        if ((((attrs.value()) & (GetTextAttr.KEEPQUOTES.value()))) === (GetTextAttr.NO.value())) {
            for (; begin !== null && begin.endChar <= end.endChar; begin = begin.next) {
                if (BracketHelper.isBracket(begin, true)) {
                }
                else 
                    break;
            }
        }
        if ((((attrs.value()) & (GetTextAttr.RESTOREREGISTER.value()))) !== (GetTextAttr.NO.value())) 
            attrs = GetTextAttr.of((attrs.value()) | (GetTextAttr.KEEPREGISTER.value()));
        let res = new StringBuilder();
        if ((begin instanceof MetaToken) && !(begin instanceof NumberToken)) {
            let str = MiscHelper._getTextValue_(begin.beginToken, begin.endToken, attrs, begin.getReferent());
            if (str !== null) {
                if (end === begin) 
                    return str;
                if ((end instanceof MetaToken) && !(end instanceof NumberToken) && begin.next === end) {
                    if ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()) || (((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value())) {
                        let attrs1 = attrs;
                        if ((((attrs1.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value())) 
                            attrs1 = GetTextAttr.of((attrs1.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()));
                        if ((((attrs1.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value())) 
                            attrs1 = GetTextAttr.of((attrs1.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()));
                        let str0 = MiscHelper._getTextValue_(begin.beginToken, begin.endToken, attrs1, begin.getReferent());
                        let str1 = MiscHelper._getTextValue_(end.beginToken, end.endToken, attrs1, begin.getReferent());
                        let ar0 = null;
                        try {
                            ar0 = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis((str0 + " " + str1)), null, null);
                            let npt1 = NounPhraseHelper.tryParse(ar0.firstToken, NounPhraseParseAttr.NO, 0, null);
                            if (npt1 !== null && npt1.endToken.next === null) 
                                return MiscHelper._getTextValue_(npt1.beginToken, npt1.endToken, attrs, r);
                        } catch (ex) {
                        }
                    }
                }
                res.append(str);
                begin = begin.next;
                if ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value())) 
                    attrs = GetTextAttr.of((attrs.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()));
                if ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value())) 
                    attrs = GetTextAttr.of((attrs.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()));
            }
        }
        let keepChars = (((attrs.value()) & (GetTextAttr.KEEPREGISTER.value()))) !== (GetTextAttr.NO.value());
        if (keepChars) {
        }
        let restoreCharsEndPos = -1;
        if ((((attrs.value()) & (GetTextAttr.RESTOREREGISTER.value()))) !== (GetTextAttr.NO.value())) {
            if (!MiscHelper.hasNotAllUpper(begin, end)) 
                restoreCharsEndPos = end.endChar;
            else 
                for (let tt1 = begin; tt1 !== null && (tt1.endChar < end.endChar); tt1 = tt1.next) {
                    if (tt1.isNewlineAfter && !tt1.isHiphen) {
                        if (!MiscHelper.hasNotAllUpper(begin, tt1)) 
                            restoreCharsEndPos = tt1.endChar;
                        break;
                    }
                }
        }
        if ((((attrs.value()) & (((GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()) | (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))))) !== (GetTextAttr.NO.value())) {
            let npt = NounPhraseHelper.tryParse(begin, NounPhraseParseAttr.PARSEPRONOUNS, 0, null);
            if (npt !== null && npt.endChar <= end.endChar) {
                let str = npt.getNormalCaseText(null, ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))) !== (GetTextAttr.NO.value()) ? MorphNumber.SINGULAR : MorphNumber.UNDEFINED), npt.morph.gender, keepChars);
                if (str !== null) {
                    begin = npt.endToken.next;
                    res.append(str);
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
                                        } catch (ex796) {
                                        }
                                        if (_var !== null) {
                                            _var = MiscHelper.corrChars(_var, te.next.chars, keepChars, Utils.as(te.next, TextToken));
                                            res.append(", ").append(_var);
                                            te = te.next.next;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    begin = te;
                }
            }
            if ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value())) 
                attrs = GetTextAttr.of((attrs.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()));
            if ((((attrs.value()) & (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()))) === (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value())) 
                attrs = GetTextAttr.of((attrs.value()) ^ (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()));
        }
        if (begin === null || begin.endChar > end.endChar) 
            return res.toString();
        for (let t = begin; t !== null && t.endChar <= end.endChar; t = t.next) {
            let last = (res.length > 0 ? res.charAt(res.length - 1) : ' ');
            if (t.isWhitespaceBefore && res.length > 0) {
                if (t.isHiphen && t.isWhitespaceAfter && last !== ' ') {
                    res.append(" - ");
                    continue;
                }
                if ((last !== ' ' && !t.isHiphen && last !== '-') && !BracketHelper.canBeStartOfSequence(t.previous, false, false)) 
                    res.append(' ');
            }
            if (t.isTableControlChar) {
                if (res.length > 0 && res.charAt(res.length - 1) === ' ') {
                }
                else 
                    res.append(' ');
                continue;
            }
            if ((((attrs.value()) & (GetTextAttr.IGNOREARTICLES.value()))) !== (GetTextAttr.NO.value())) {
                if (MiscHelper.isEngAdjSuffix(t)) {
                    t = t.next;
                    continue;
                }
                if (MiscHelper.isEngArticle(t)) {
                    if (t.isWhitespaceAfter) 
                        continue;
                }
            }
            if ((((attrs.value()) & (GetTextAttr.KEEPQUOTES.value()))) === (GetTextAttr.NO.value())) {
                if (BracketHelper.isBracket(t, true)) {
                    if (res.length > 0 && res.charAt(res.length - 1) !== ' ') 
                        res.append(' ');
                    continue;
                }
            }
            if ((((attrs.value()) & (GetTextAttr.IGNOREGEOREFERENT.value()))) !== (GetTextAttr.NO.value())) {
                if ((t instanceof ReferentToken) && t.getReferent() !== null) {
                    if (t.getReferent().typeName === "GEO") 
                        continue;
                }
            }
            if (t instanceof NumberToken) {
                if ((((attrs.value()) & (GetTextAttr.NORMALIZENUMBERS.value()))) !== (GetTextAttr.NO.value())) {
                    if (res.length > 0 && Utils.isDigit(res.charAt(res.length - 1))) 
                        res.append(' ');
                    res.append(t.value);
                    continue;
                }
            }
            if (t instanceof MetaToken) {
                let str = MiscHelper._getTextValue_(t.beginToken, t.endToken, attrs, t.getReferent());
                if (!Utils.isNullOrEmpty(str)) {
                    if (Utils.isDigit(str[0]) && res.length > 0 && Utils.isDigit(res.charAt(res.length - 1))) 
                        res.append(' ');
                    res.append(str);
                }
                else 
                    res.append(t.getSourceText());
                continue;
            }
            if (!(t instanceof TextToken)) {
                res.append(t.getSourceText());
                continue;
            }
            if (t.chars.isLetter) {
                let str = (t.endChar <= restoreCharsEndPos ? MiscHelper.restChars(Utils.as(t, TextToken), r) : MiscHelper.corrChars(t.term, t.chars, keepChars, Utils.as(t, TextToken)));
                res.append(str);
                continue;
            }
            if (last === ' ' && res.length > 0) {
                if (((t.isHiphen && !t.isWhitespaceAfter)) || t.isCharOf(",.;!?") || BracketHelper.canBeEndOfSequence(t, false, null, false)) 
                    res.length = res.length - 1;
            }
            if (t.isHiphen) {
                res.append('-');
                if (t.isWhitespaceBefore && t.isWhitespaceAfter) 
                    res.append(' ');
            }
            else 
                res.append(t.term);
        }
        for (let i = res.length - 1; i >= 0; i--) {
            if (res.charAt(i) === '*' || Utils.isWhitespace(res.charAt(i))) 
                res.length = res.length - 1;
            else if (res.charAt(i) === '>' && (((attrs.value()) & (GetTextAttr.KEEPQUOTES.value()))) === (GetTextAttr.NO.value())) {
                if (res.charAt(0) === '<') {
                    res.length = res.length - 1;
                    res.remove(0, 1);
                    i--;
                }
                else if (begin.previous !== null && begin.previous.isChar('<')) 
                    res.length = res.length - 1;
                else 
                    break;
            }
            else if (res.charAt(i) === ')' && (((attrs.value()) & (GetTextAttr.KEEPQUOTES.value()))) === (GetTextAttr.NO.value())) {
                if (res.charAt(0) === '(') {
                    res.length = res.length - 1;
                    res.remove(0, 1);
                    i--;
                }
                else if (begin.previous !== null && begin.previous.isChar('(')) 
                    res.length = res.length - 1;
                else 
                    break;
            }
            else 
                break;
        }
        return res.toString();
    }
    
    // Проверка, что это суффикс прилагательного (street's)
    static isEngAdjSuffix(t) {
        const BracketHelper = require("./BracketHelper");
        if (t === null) 
            return false;
        if (!BracketHelper.isBracket(t, true)) 
            return false;
        if ((t.next instanceof TextToken) && t.next.term === "S") 
            return true;
        return false;
    }
    
    static isEngArticle(t) {
        if (!(t instanceof TextToken) || !t.chars.isLatinLetter) 
            return false;
        let str = t.term;
        return ((str === "THE" || str === "A" || str === "AN") || str === "DER" || str === "DIE") || str === "DAS";
    }
    
    static hasNotAllUpper(b, e) {
        const MetaToken = require("./../MetaToken");
        for (let t = b; t !== null && t.endChar <= e.endChar; t = t.next) {
            if (t instanceof TextToken) {
                if (t.chars.isLetter && !t.chars.isAllUpper) 
                    return true;
            }
            else if (t instanceof MetaToken) {
                if (MiscHelper.hasNotAllUpper(t.beginToken, t.endToken)) 
                    return true;
            }
        }
        return false;
    }
    
    static corrChars(str, ci, keepChars, t) {
        if (!keepChars) 
            return str;
        if (ci.isAllLower) 
            return str.toLowerCase();
        if (ci.isCapitalUpper) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(str);
        if (ci.isAllUpper || t === null) 
            return str;
        let src = t.getSourceText();
        if (src.length === str.length) {
            let tmp = new StringBuilder(str);
            for (let i = 0; i < tmp.length; i++) {
                if (Utils.isLetter(src[i]) && Utils.isLowerCase(src[i])) 
                    tmp.setCharAt(i, tmp.charAt(i).toLowerCase());
            }
            str = tmp.toString();
        }
        return str;
    }
    
    static restChars(t, r) {
        const BracketHelper = require("./BracketHelper");
        if (!t.chars.isAllUpper || !t.chars.isLetter) 
            return MiscHelper.corrChars(t.term, t.chars, true, t);
        if (t.term === "Г" || t.term === "ГГ") {
            if (t.previous instanceof NumberToken) 
                return t.term.toLowerCase();
        }
        else if (t.term === "X") {
            if ((t.previous instanceof NumberToken) || ((t.previous !== null && t.previous.isHiphen))) 
                return t.term.toLowerCase();
        }
        else if (t.term === "N" || t.term === "№") 
            return t.term;
        let canCapUp = false;
        if (BracketHelper.canBeStartOfSequence(t.previous, true, false)) 
            canCapUp = true;
        else if (t.previous !== null && t.previous.isChar('.') && t.isWhitespaceBefore) 
            canCapUp = true;
        let stat = t.kit.statistics.getWordInfo(t);
        if (stat === null || ((r !== null && ((r.typeName === "DATE" || r.typeName === "DATERANGE"))))) 
            return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        if (stat.lowerCount > 0) 
            return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        let mc = t.getMorphClassInDictionary();
        if (mc.isNoun) {
            if (((t.isValue("СОЗДАНИЕ", null) || t.isValue("РАЗВИТИЕ", null) || t.isValue("ВНЕСЕНИЕ", null)) || t.isValue("ИЗМЕНЕНИЕ", null) || t.isValue("УТВЕРЖДЕНИЕ", null)) || t.isValue("ПРИНЯТИЕ", null)) 
                return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        }
        if (((mc.isVerb || mc.isAdverb || mc.isConjunction) || mc.isPreposition || mc.isPronoun) || mc.isPersonalPronoun) 
            return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        if (stat.capitalCount > 0) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(t.term);
        if (mc.isProper) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(t.term);
        if (mc.isAdjective) 
            return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        if (mc.equals(MorphClass.NOUN)) 
            return (canCapUp ? MiscHelper.convertFirstCharUpperAndOtherLower(t.term) : t.term.toLowerCase());
        return t.term;
    }
    
    /**
     * Преобразовать строку в нужный род, число и падеж (точнее, преобразуется 
     * первая именная группа), регистр определяется соответствующими символами примера. 
     * Морфология определяется по первой именной группе примера. 
     * Фукнция полезна при замене по тексту одной комбинации на другую с учётом 
     * морфологии и регистра.
     * @param txt преобразуемая строка
     * @param beginSample начало фрагмента примера
     * @param useMorphSample использовать именную группу примера для морфологии
     * @param useRegisterSample регистр определять по фрагменту пример, при false регистр исходной строки
     * @return результат, в худшем случае вернёт исходную строку
     * 
     */
    static getTextMorphVarBySample(txt, beginSample, useMorphSample, useRegisterSample) {
        const NounPhraseHelper = require("./NounPhraseHelper");
        if (Utils.isNullOrEmpty(txt)) 
            return txt;
        let npt = NounPhraseHelper.tryParse(beginSample, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null && beginSample.previous !== null) {
            for (let tt = beginSample.previous; tt !== null; tt = tt.previous) {
                if (tt.whitespacesAfterCount > 2) 
                    break;
                let npt0 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt0 !== null) {
                    if (npt0.endToken === npt.endToken) 
                        npt.morph = npt0.morph;
                    else {
                        if (tt === beginSample.previous && npt.beginToken === npt.endToken && npt.morph._case.isGenitive) 
                            npt.morph.removeItems(MorphCase.GENITIVE, false);
                        break;
                    }
                }
            }
        }
        let ar = null;
        try {
            ar = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis(txt), null, null);
        } catch (ex) {
            return txt;
        }
        if (ar === null || ar.firstToken === null) 
            return txt;
        let npt1 = NounPhraseHelper.tryParse(ar.firstToken, NounPhraseParseAttr.NO, 0, null);
        let t0 = beginSample;
        let res = new StringBuilder();
        for (let t = ar.firstToken; t !== null; t = t.next,t0 = (t0 === null ? null : t0.next)) {
            if (t.isWhitespaceBefore && t !== ar.firstToken) 
                res.append(' ');
            let word = null;
            if ((t instanceof TextToken) && t.chars.isLetter) {
                word = t.term;
                if ((npt1 !== null && t.endChar <= npt1.endChar && npt !== null) && useMorphSample) {
                    let bi = new MorphBaseInfo();
                    bi.number = npt.morph.number;
                    bi._case = npt.morph._case;
                    bi.gender = npt1.morph.gender;
                    let ww = null;
                    try {
                        ww = MorphologyService.getWordform(word, bi);
                    } catch (ex797) {
                    }
                    if (ww !== null) 
                        word = ww;
                }
                let ci = null;
                if (useRegisterSample && t0 !== null) 
                    ci = t0.chars;
                else 
                    ci = t.chars;
                if (ci.isAllLower) 
                    word = word.toLowerCase();
                else if (ci.isCapitalUpper) 
                    word = MiscHelper.convertFirstCharUpperAndOtherLower(word);
            }
            else 
                word = t.getSourceText();
            res.append(word);
        }
        return res.toString();
    }
    
    // Функция устарела, используйте вместо неё GetTextMorphVariant
    static getTextMorphVarByCase(txt, cas, pluralNumber = false) {
        return MiscHelper.getTextMorphVariant(txt, cas, (pluralNumber ? MorphNumber.PLURAL : MorphNumber.UNDEFINED));
    }
    
    /**
     * Преобразовать строку к нужному падежу и числу. 
     * Преобразуется только начало строки, содержащее именную группу или персону.
     * @param txt исходная строка
     * @param cas падеж
     * @param num число (по умолчанию, MorphNumber.Undefined - оставить как есть)
     * @return результат (в крайнем случае, вернёт исходную строку, если ничего не получилось)
     * 
     */
    static getTextMorphVariant(txt, cas, num = MorphNumber.UNDEFINED) {
        const NounPhraseHelper = require("./NounPhraseHelper");
        let ar = null;
        try {
            ar = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis(txt), null, null);
        } catch (ex) {
        }
        if (ar === null || ar.firstToken === null) 
            return txt;
        let res = new StringBuilder();
        let t0 = ar.firstToken;
        if ((t0 instanceof TextToken) && !t0.chars.isLetter) {
            res.append(t0.getSourceText());
            t0 = t0.next;
        }
        let npt = NounPhraseHelper.tryParse(t0, NounPhraseParseAttr.PARSEVERBS, 0, null);
        if (npt !== null) {
            let accCorr = false;
            if (num === MorphNumber.UNDEFINED) {
                if (npt.morph.number === MorphNumber.PLURAL || npt.morph.number === MorphNumber.SINGULAR) 
                    num = npt.morph.number;
            }
            if (cas.isAccusative && num === MorphNumber.PLURAL) {
                accCorr = true;
                if (MiscHelper.isTokenAnimate(npt.noun.endToken)) 
                    cas = MorphCase.GENITIVE;
            }
            for (let t = npt.beginToken; t !== null && t.endChar <= npt.endChar; t = t.next) {
                let isNoun = t.beginChar >= npt.noun.beginChar;
                let notCase = false;
                if (npt.internalNoun !== null) {
                    if (t.beginChar >= npt.internalNoun.beginChar && t.endChar <= npt.internalNoun.endChar) 
                        notCase = true;
                }
                for (const a of npt.adjectives) {
                    if (a.beginToken !== a.endToken && a.endToken.getMorphClassInDictionary().isNoun) {
                        if (t.beginChar >= a.beginToken.next.beginChar && t.endChar <= a.endChar) 
                            notCase = true;
                    }
                    if ((t === a.beginToken && t.next !== null && t.next.isHiphen) && a.endChar > t.next.endChar) 
                        notCase = true;
                }
                let word = null;
                if (t instanceof NumberToken) 
                    word = t.getSourceText();
                else if (t instanceof TextToken) {
                    for (const it of t.morph.items) {
                        if (notCase) 
                            break;
                        let wf = Utils.as(it, MorphWordForm);
                        if (wf === null) 
                            continue;
                        if (t === npt.anafor) {
                            if (wf.misc.person === MorphPerson.THIRD) {
                                notCase = true;
                                break;
                            }
                        }
                        if (!npt.morph._case.isUndefined) {
                            if ((MorphCase.ooBitand(npt.morph._case, wf._case)).isUndefined) 
                                continue;
                        }
                        if (num === MorphNumber.PLURAL && wf.number === MorphNumber.SINGULAR && t !== npt.anafor) 
                            continue;
                        if (num === MorphNumber.SINGULAR && wf.number === MorphNumber.PLURAL && t !== npt.anafor) 
                            continue;
                        if (isNoun) {
                            if ((wf._class.isNoun || wf._class.isPersonalPronoun || wf._class.isPronoun) || wf._class.isProper) {
                                word = wf.normalCase;
                                break;
                            }
                        }
                        else if (wf._class.isAdjective || wf._class.isPronoun || wf._class.isPersonalPronoun) {
                            word = wf.normalCase;
                            if (accCorr && cas.isAccusative && word.endsWith("Х")) 
                                word = word.substring(0, 0 + word.length - 1) + "Е";
                            break;
                        }
                    }
                    if (word === null) 
                        word = (notCase ? t.term : t.lemma);
                    if (!t.chars.isLetter) {
                    }
                    else if (!notCase) {
                        if ((t.next !== null && t.next.isHiphen && t.isValue("ГЕНЕРАЛ", null)) || t.isValue("КАПИТАН", null)) {
                        }
                        else {
                            let mbi = MorphBaseInfo._new798(npt.morph.gender, cas, MorphNumber.SINGULAR);
                            if (num !== MorphNumber.UNDEFINED) 
                                mbi.number = num;
                            let wcas = null;
                            try {
                                wcas = MorphologyService.getWordform(word, mbi);
                            } catch (ex799) {
                            }
                            if (wcas !== null) {
                                word = wcas;
                                if ((!isNoun && accCorr && cas.isAccusative) && word.endsWith("Х") && word !== "ИХ") 
                                    word = word.substring(0, 0 + word.length - 1) + "Е";
                            }
                        }
                    }
                }
                if (t.chars.isAllLower) 
                    word = word.toLowerCase();
                else if (t.chars.isCapitalUpper) 
                    word = MiscHelper.convertFirstCharUpperAndOtherLower(word);
                if (t !== ar.firstToken && t.isWhitespaceBefore) 
                    res.append(' ');
                res.append(word);
                t0 = t.next;
            }
        }
        if (t0 === ar.firstToken) 
            return txt;
        if (t0 !== null) {
            if (t0.isWhitespaceBefore) 
                res.append(' ');
            res.append(txt.substring(t0.beginChar));
        }
        return res.toString();
    }
    
    /**
     * Корректировка числа и падежа строки. 
     * Например, GetTextMorphVarByCaseAndNumberEx("год", MorphCase.Nominative,  MorphNumber.Undefined, "55") = "лет".
     * @param str исходная строка, изменяется только первая именная группа
     * @param cas нужный падеж
     * @param num нужное число
     * @param numVal число, для которого строка является объектом, задающим количество
     * @return результат
     */
    static getTextMorphVarByCaseAndNumberEx(str, cas = null, num = MorphNumber.SINGULAR, numVal = null) {
        const MetaToken = require("./../MetaToken");
        const NounPhraseHelper = require("./NounPhraseHelper");
        const NounPhraseToken = require("./NounPhraseToken");
        if (str === "коп" || str === "руб") 
            return str;
        if (str === "лет") 
            str = "год";
        let ar = null;
        try {
            ar = ProcessorService.getEmptyProcessor().process(SourceOfAnalysis._new800(str, false), null, null);
        } catch (ex) {
        }
        if (ar === null || ar.firstToken === null) 
            return str;
        let npt = NounPhraseHelper.tryParse(ar.firstToken, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
        if (npt === null && ((str === "раз" || ar.firstToken.getMorphClassInDictionary().isProperName))) {
            npt = new NounPhraseToken(ar.firstToken, ar.firstToken);
            npt.noun = new MetaToken(ar.firstToken, ar.firstToken);
        }
        if (npt === null) 
            return str;
        if (numVal === null && num === MorphNumber.UNDEFINED) 
            num = npt.morph.number;
        if (cas === null || cas.isUndefined) 
            cas = MorphCase.NOMINATIVE;
        if (!Utils.isNullOrEmpty(numVal) && num === MorphNumber.UNDEFINED) {
            if (cas !== null && !cas.isNominative && !cas.isGenitive) {
                if (numVal === "1") 
                    num = MorphNumber.SINGULAR;
                else 
                    num = MorphNumber.PLURAL;
            }
        }
        let adjBi = MorphBaseInfo._new801(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.NOUN), cas, num, npt.morph.gender);
        let nounBi = MorphBaseInfo._new802(npt.noun.morph._class, cas, num);
        if (npt.noun.morph._class.isNoun) 
            nounBi._class = MorphClass.NOUN;
        let year = null;
        let pair = null;
        if (!Utils.isNullOrEmpty(numVal) && num === MorphNumber.UNDEFINED) {
            let ch = numVal[numVal.length - 1];
            let n = 0;
            let wrapn803 = new RefOutArgWrapper();
            Utils.tryParseInt(numVal, wrapn803);
            n = wrapn803.value;
            if (numVal === "1" || ((ch === '1' && n > 20 && ((n % 100)) !== 11))) {
                adjBi.number = nounBi.number = MorphNumber.SINGULAR;
                if (str === "год" || str === "раз") 
                    year = str;
                else if (str === "пар" || str === "пара") 
                    pair = "пара";
            }
            else if (((ch === '2' || ch === '3' || ch === '4')) && (((n < 10) || n > 20))) {
                nounBi.number = MorphNumber.SINGULAR;
                nounBi._case = MorphCase.GENITIVE;
                adjBi.number = MorphNumber.PLURAL;
                adjBi._case = MorphCase.NOMINATIVE;
                if (str === "год") 
                    year = (((n < 10) || n > 20) ? "года" : "лет");
                else if (str === "раз") 
                    year = (((n < 10) || n > 20) ? "раза" : "раз");
                else if (str === "пар" || str === "пара") 
                    pair = "пары";
                else if (str === "стул") 
                    pair = "стула";
            }
            else {
                nounBi.number = MorphNumber.PLURAL;
                nounBi._case = MorphCase.GENITIVE;
                adjBi.number = MorphNumber.PLURAL;
                adjBi._case = MorphCase.GENITIVE;
                if (str === "год") 
                    year = (ch === '1' && n > 20 ? "год" : "лет");
                else if (str === "раз") 
                    year = "раз";
                else if (str === "пар" || str === "пара") 
                    pair = "пар";
                else if (str === "стул") 
                    year = "стульев";
            }
        }
        let res = new StringBuilder();
        let norm = null;
        let val = null;
        for (const a of npt.adjectives) {
            norm = a.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
            val = null;
            try {
                val = MorphologyService.getWordform(norm, adjBi);
            } catch (ex804) {
            }
            if (val === null) 
                val = a.getSourceText();
            else if (a.chars.isAllLower) 
                val = val.toLowerCase();
            else if (a.chars.isCapitalUpper) 
                val = MiscHelper.convertFirstCharUpperAndOtherLower(val);
            if (res.length > 0) 
                res.append(' ');
            res.append(val);
        }
        norm = npt.noun.getNormalCaseText(nounBi._class, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
        if (year !== null) 
            val = year;
        else if (pair !== null) 
            val = pair;
        else if (str === "мин" || str === "мес") 
            val = str;
        else {
            val = null;
            try {
                val = MorphologyService.getWordform(norm, nounBi);
                if (val === "РЕБЕНОК" && nounBi.number === MorphNumber.PLURAL) 
                    val = MorphologyService.getWordform("ДЕТИ", nounBi);
                if (val === "ЧЕЛОВЕКОВ") 
                    val = "ЧЕЛОВЕК";
                else if (val === "МОРОВ") 
                    val = "МОРЕЙ";
                else if (val === "ПАРОВ") 
                    val = "ПАР";
                if (val === null) 
                    val = npt.noun.getSourceText();
                else if (npt.noun.chars.isAllLower) 
                    val = val.toLowerCase();
                else if (npt.noun.chars.isCapitalUpper) 
                    val = MiscHelper.convertFirstCharUpperAndOtherLower(val);
            } catch (ex805) {
            }
        }
        if (res.length > 0) 
            res.append(' ');
        res.append(val);
        if (npt.endToken.next !== null) {
            res.append(" ");
            res.append(str.substring(npt.endToken.next.beginChar));
        }
        return res.toString();
    }
    
    /**
     * Для сущности вычислить точное подмножество вхождения. Дело в том, что для некоторых сущностей 
     * в диапазон вхождения (ReferentToken) включаются и другие дополнительные сущности. 
     * Например, для персоны её атрибуты, должности и т.п., а также контактные даннные за ней, 
     * для организации это адреса, реквизиты и пр. Через эту функцию можно получить точное подмножество 
     * диапазона, содержащее только эту сущность. Например, для "председатель правления ВТБ Иван Пупкин, +7-905-234-43-21" 
     * эта функция вернёт диапазон "Иван Пупкин".
     * @param rt метатокен, содержаший сущность
     * @return более узкий метатокен или этот же, если не удалось уменьшить
     */
    static getPureReferentToken(rt) {
        const MetaToken = require("./../MetaToken");
        if (rt === null) 
            return null;
        let t0 = null;
        let t1 = null;
        for (let tt = rt.beginToken; tt !== null && tt.endChar <= rt.endChar; tt = tt.next) {
            if (tt.isChar('(')) 
                break;
            if (tt instanceof ReferentToken) {
                let r = tt.getReferent();
                if (r === null) 
                    continue;
                if (r.typeName === "URI" || r.typeName === "ADDRESS" || r.typeName === "PHONE") 
                    break;
                if (r.typeName === rt.referent.typeName && r.typeName === "ORGANIZATION" && r !== rt.referent) {
                    if (t0 === null) 
                        t0 = tt;
                    t1 = tt;
                }
                continue;
            }
            if (tt.isComma || tt.isCharOf(":;")) 
                continue;
            if (t0 === null) 
                t0 = tt;
            t1 = tt;
        }
        if (t0 === null) {
            t0 = rt.beginToken;
            t1 = rt.endToken;
        }
        return MetaToken._new806(t0, t1, MiscHelper.getTextValue(t0, t1, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value()))));
    }
    
    static static_constructor() {
        MiscHelper.m_Cyr = "АВДЕКМНОРСТХаекорсух";
        MiscHelper.m_Lat = "ABDEKMHOPCTXaekopcyx";
    }
}


MiscHelper.CyrLatWord = class  {
    
    constructor() {
        this.cyrWord = null;
        this.latWord = null;
    }
    
    toString() {
        if (this.cyrWord !== null && this.latWord !== null) 
            return (this.cyrWord + "\\" + this.latWord);
        else if (this.cyrWord !== null) 
            return this.cyrWord;
        else 
            return (this.latWord != null ? this.latWord : "?");
    }
    
    get length() {
        return (this.cyrWord !== null ? this.cyrWord.length : (this.latWord !== null ? this.latWord.length : 0));
    }
}


MiscHelper.static_constructor();

module.exports = MiscHelper