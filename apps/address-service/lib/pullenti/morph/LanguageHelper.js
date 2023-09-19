/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphMood = require("./MorphMood");
const MorphVoice = require("./MorphVoice");
const MorphNumber = require("./MorphNumber");
const MorphForm = require("./MorphForm");
const MorphFinite = require("./MorphFinite");
const MorphAspect = require("./MorphAspect");
const MorphCase = require("./MorphCase");
const MorphLang = require("./MorphLang");
const UnicodeInfo = require("./internal/UnicodeInfo");
const MorphGender = require("./MorphGender");
const MorphPerson = require("./MorphPerson");
const MorphTense = require("./MorphTense");

// Служба подержки языков.
// В качестве универсальных идентификаторов языков выступает 2-х символьный идентификатор ISO 639-1.
// Также содержит некоторые полезные функции.
class LanguageHelper {
    
    static getLanguageForText(text) {
        if (Utils.isNullOrEmpty(text)) 
            return null;
        let i = 0;
        let j = 0;
        let ruChars = 0;
        let enChars = 0;
        for (i = 0; i < text.length; i++) {
            let ch = text[i];
            if (!Utils.isLetter(ch)) 
                continue;
            j = ch.charCodeAt(0);
            if (j >= 0x400 && (j < 0x500)) 
                ruChars++;
            else if (j < 0x80) 
                enChars++;
        }
        if ((ruChars > (enChars * 2)) && ruChars > 10) 
            return "ru";
        if (ruChars > 0 && enChars === 0) 
            return "ru";
        if (enChars > 0) 
            return "en";
        return null;
    }
    
    static getWordLang(word) {
        let cyr = 0;
        let lat = 0;
        let undef = 0;
        for (const ch of word) {
            let ui = UnicodeInfo.getChar(ch);
            if (ui.isLetter) {
                if (ui.isCyrillic) 
                    cyr++;
                else if (ui.isLatin) 
                    lat++;
                else 
                    undef++;
            }
        }
        if (undef > 0) 
            return MorphLang.UNKNOWN;
        if (cyr === 0 && lat === 0) 
            return MorphLang.UNKNOWN;
        if (cyr === 0) 
            return MorphLang.EN;
        if (lat > 0) 
            return MorphLang.UNKNOWN;
        let lang = MorphLang.ooBitor(MorphLang.ooBitor(MorphLang.UA, MorphLang.ooBitor(MorphLang.RU, MorphLang.BY)), MorphLang.KZ);
        for (const ch of word) {
            let ui = UnicodeInfo.getChar(ch);
            if (ui.isLetter) {
                if (ch === 'Ґ' || ch === 'Є' || ch === 'Ї') {
                    lang.isRu = false;
                    lang.isBy = false;
                }
                else if (ch === 'І') 
                    lang.isRu = false;
                else if (ch === 'Ё' || ch === 'Э') {
                    lang.isUa = false;
                    lang.isKz = false;
                }
                else if (ch === 'Ы') 
                    lang.isUa = false;
                else if (ch === 'Ў') {
                    lang.isRu = false;
                    lang.isUa = false;
                }
                else if (ch === 'Щ') 
                    lang.isBy = false;
                else if (ch === 'Ъ') {
                    lang.isBy = false;
                    lang.isUa = false;
                    lang.isKz = false;
                }
                else if ((((ch === 'Ә' || ch === 'Ғ' || ch === 'Қ') || ch === 'Ң' || ch === 'Ө') || ((ch === 'Ұ' && word.length > 1)) || ch === 'Ү') || ch === 'Һ') {
                    lang.isBy = false;
                    lang.isUa = false;
                    lang.isRu = false;
                }
                else if ((ch === 'В' || ch === 'Ф' || ch === 'Ц') || ch === 'Ч' || ch === 'Ь') 
                    lang.isKz = false;
            }
        }
        return lang;
    }
    
    static isLatinChar(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isLatin;
    }
    
    static isLatin(str) {
        if (str === null) 
            return false;
        for (let i = 0; i < str.length; i++) {
            if (!LanguageHelper.isLatinChar(str[i])) {
                if (!Utils.isWhitespace(str[i]) && str[i] !== '-') 
                    return false;
            }
        }
        return true;
    }
    
    static isCyrillicChar(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isCyrillic;
    }
    
    static isCyrillic(str) {
        if (str === null) 
            return false;
        for (let i = 0; i < str.length; i++) {
            if (!LanguageHelper.isCyrillicChar(str[i])) {
                if (!Utils.isWhitespace(str[i]) && str[i] !== '-') 
                    return false;
            }
        }
        return true;
    }
    
    static isHiphen(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isHiphen;
    }
    
    static isCyrillicVowel(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isCyrillic && ui.isVowel;
    }
    
    static isLatinVowel(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isLatin && ui.isVowel;
    }
    
    static getCyrForLat(lat) {
        let i = LanguageHelper.m_LatChars.indexOf(lat);
        if (i >= 0 && (i < LanguageHelper.m_CyrChars.length)) 
            return LanguageHelper.m_CyrChars[i];
        i = LanguageHelper.m_GreekChars.indexOf(lat);
        if (i >= 0 && (i < LanguageHelper.m_CyrGreekChars.length)) 
            return LanguageHelper.m_CyrGreekChars[i];
        return String.fromCharCode(0);
    }
    
    static getLatForCyr(cyr) {
        let i = LanguageHelper.m_CyrChars.indexOf(cyr);
        if ((i < 0) || i >= LanguageHelper.m_LatChars.length) 
            return String.fromCharCode(0);
        else 
            return LanguageHelper.m_LatChars[i];
    }
    
    static transliteralCorrection(value, prevValue, always = false) {
        let pureCyr = 0;
        let pureLat = 0;
        let quesCyr = 0;
        let quesLat = 0;
        let udarCyr = 0;
        let y = false;
        let udaren = false;
        for (let i = 0; i < value.length; i++) {
            let ch = value[i];
            let ui = UnicodeInfo.getChar(ch);
            if (!ui.isLetter) {
                if (ui.isUdaren) {
                    udaren = true;
                    continue;
                }
                if (ui.isApos && value.length > 2) 
                    return LanguageHelper.transliteralCorrection(Utils.replaceString(value, (ch), ""), prevValue, false);
                return value;
            }
            if (ui.isCyrillic) {
                if (LanguageHelper.m_CyrChars.indexOf(ch) >= 0) 
                    quesCyr++;
                else 
                    pureCyr++;
            }
            else if (ui.isLatin) {
                if (LanguageHelper.m_LatChars.indexOf(ch) >= 0) 
                    quesLat++;
                else 
                    pureLat++;
            }
            else if (LanguageHelper.m_UdarChars.indexOf(ch) >= 0) 
                udarCyr++;
            else 
                return value;
            if (ch === 'Ь' && ((i + 1) < value.length) && value[i + 1] === 'I') 
                y = true;
        }
        let toRus = false;
        let toLat = false;
        if (pureLat > 0 && pureCyr > 0) 
            return value;
        if (((pureLat > 0 || always)) && quesCyr > 0) 
            toLat = true;
        else if (((pureCyr > 0 || always)) && quesLat > 0) 
            toRus = true;
        else if (pureCyr === 0 && pureLat === 0) {
            if (quesCyr > 0 && quesLat > 0) {
                if (!Utils.isNullOrEmpty(prevValue)) {
                    if (LanguageHelper.isCyrillicChar(prevValue[0])) 
                        toRus = true;
                    else if (LanguageHelper.isLatinChar(prevValue[0])) 
                        toLat = true;
                }
                if (!toLat && !toRus) {
                    if (quesCyr > quesLat) 
                        toRus = true;
                    else if (quesCyr < quesLat) 
                        toLat = true;
                }
            }
        }
        if (!toRus && !toLat) {
            if (!y && !udaren && udarCyr === 0) 
                return value;
        }
        let tmp = new StringBuilder(value);
        for (let i = 0; i < tmp.length; i++) {
            if (tmp.charAt(i) === 'Ь' && ((i + 1) < tmp.length) && tmp.charAt(i + 1) === 'I') {
                tmp.setCharAt(i, 'Ы');
                tmp.remove(i + 1, 1);
                continue;
            }
            let cod = tmp.charAt(i).charCodeAt(0);
            if (cod >= 0x300 && (cod < 0x370)) {
                tmp.remove(i, 1);
                continue;
            }
            if (toRus) {
                let ii = LanguageHelper.m_LatChars.indexOf(tmp.charAt(i));
                if (ii >= 0) 
                    tmp.setCharAt(i, LanguageHelper.m_CyrChars[ii]);
                else if ((((ii = LanguageHelper.m_UdarChars.indexOf(tmp.charAt(i))))) >= 0) 
                    tmp.setCharAt(i, LanguageHelper.m_UdarCyrChars[ii]);
            }
            else if (toLat) {
                let ii = LanguageHelper.m_CyrChars.indexOf(tmp.charAt(i));
                if (ii >= 0) 
                    tmp.setCharAt(i, LanguageHelper.m_LatChars[ii]);
            }
            else {
                let ii = LanguageHelper.m_UdarChars.indexOf(tmp.charAt(i));
                if (ii >= 0) 
                    tmp.setCharAt(i, LanguageHelper.m_UdarCyrChars[ii]);
            }
        }
        return tmp.toString();
    }
    
    static isQuote(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isQuot;
    }
    
    static isApos(ch) {
        let ui = UnicodeInfo.getChar(ch);
        return ui.isApos;
    }
    
    static getCaseAfterPreposition(prep) {
        let mc = null;
        let wrapmc238 = new RefOutArgWrapper();
        let inoutres239 = LanguageHelper.m_PrepCases.tryGetValue(prep, wrapmc238);
        mc = wrapmc238.value;
        if (inoutres239) 
            return mc;
        else 
            return MorphCase.UNDEFINED;
    }
    
    static normalizePreposition(prep) {
        let res = null;
        let wrapres240 = new RefOutArgWrapper();
        let inoutres241 = LanguageHelper.m_PrepNorms.tryGetValue(prep, wrapres240);
        res = wrapres240.value;
        if (inoutres241) 
            return res;
        else 
            return prep;
    }
    
    static endsWith(str, substr) {
        if (str === null || substr === null) 
            return false;
        let i = str.length - 1;
        let j = substr.length - 1;
        if (j > i || (j < 0)) 
            return false;
        for (; j >= 0; j--,i--) {
            if (str[i] !== substr[j]) 
                return false;
        }
        return true;
    }
    
    static endsWithEx(str, substr, substr2, substr3 = null, substr4 = null) {
        if (str === null) 
            return false;
        for (let k = 0; k < 4; k++) {
            let s = substr;
            if (k === 1) 
                s = substr2;
            else if (k === 2) 
                s = substr3;
            else if (k === 3) 
                s = substr4;
            if (s === null) 
                continue;
            let i = str.length - 1;
            let j = s.length - 1;
            if (j > i || (j < 0)) 
                continue;
            for (; j >= 0; j--,i--) {
                if (str[i] !== s[j]) 
                    break;
            }
            if (j < 0) 
                return true;
        }
        return false;
    }
    
    static toStringMorphTense(tense) {
        let res = new StringBuilder();
        if (((tense.value()) & (MorphTense.PAST.value())) !== (MorphTense.UNDEFINED.value())) 
            res.append("прошедшее|");
        if (((tense.value()) & (MorphTense.PRESENT.value())) !== (MorphTense.UNDEFINED.value())) 
            res.append("настоящее|");
        if (((tense.value()) & (MorphTense.FUTURE.value())) !== (MorphTense.UNDEFINED.value())) 
            res.append("будущее|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphPerson(person) {
        let res = new StringBuilder();
        if (((person.value()) & (MorphPerson.FIRST.value())) !== (MorphPerson.UNDEFINED.value())) 
            res.append("1лицо|");
        if (((person.value()) & (MorphPerson.SECOND.value())) !== (MorphPerson.UNDEFINED.value())) 
            res.append("2лицо|");
        if (((person.value()) & (MorphPerson.THIRD.value())) !== (MorphPerson.UNDEFINED.value())) 
            res.append("3лицо|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphGender(gender) {
        let res = new StringBuilder();
        if (((gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
            res.append("муж.|");
        if (((gender.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) 
            res.append("жен.|");
        if (((gender.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) 
            res.append("средн.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphNumber(number) {
        let res = new StringBuilder();
        if (((number.value()) & (MorphNumber.SINGULAR.value())) !== (MorphNumber.UNDEFINED.value())) 
            res.append("единств.|");
        if (((number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
            res.append("множеств.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphVoice(voice) {
        let res = new StringBuilder();
        if (((voice.value()) & (MorphVoice.ACTIVE.value())) !== (MorphVoice.UNDEFINED.value())) 
            res.append("действит.|");
        if (((voice.value()) & (MorphVoice.PASSIVE.value())) !== (MorphVoice.UNDEFINED.value())) 
            res.append("страдат.|");
        if (((voice.value()) & (MorphVoice.MIDDLE.value())) !== (MorphVoice.UNDEFINED.value())) 
            res.append("средн.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphMood(mood) {
        let res = new StringBuilder();
        if (((mood.value()) & (MorphMood.INDICATIVE.value())) !== (MorphMood.UNDEFINED.value())) 
            res.append("изъявит.|");
        if (((mood.value()) & (MorphMood.IMPERATIVE.value())) !== (MorphMood.UNDEFINED.value())) 
            res.append("повелит.|");
        if (((mood.value()) & (MorphMood.SUBJUNCTIVE.value())) !== (MorphMood.UNDEFINED.value())) 
            res.append("условн.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphAspect(aspect) {
        let res = new StringBuilder();
        if (((aspect.value()) & (MorphAspect.IMPERFECTIVE.value())) !== (MorphAspect.UNDEFINED.value())) 
            res.append("несоверш.|");
        if (((aspect.value()) & (MorphAspect.PERFECTIVE.value())) !== (MorphAspect.UNDEFINED.value())) 
            res.append("соверш.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphFinite(finit) {
        let res = new StringBuilder();
        if (((finit.value()) & (MorphFinite.FINITE.value())) !== (MorphFinite.UNDEFINED.value())) 
            res.append("finite|");
        if (((finit.value()) & (MorphFinite.GERUND.value())) !== (MorphFinite.UNDEFINED.value())) 
            res.append("gerund|");
        if (((finit.value()) & (MorphFinite.INFINITIVE.value())) !== (MorphFinite.UNDEFINED.value())) 
            res.append("инфинитив|");
        if (((finit.value()) & (MorphFinite.PARTICIPLE.value())) !== (MorphFinite.UNDEFINED.value())) 
            res.append("participle|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static toStringMorphForm(form) {
        let res = new StringBuilder();
        if (((form.value()) & (MorphForm.SHORT.value())) !== (MorphForm.UNDEFINED.value())) 
            res.append("кратк.|");
        if (((form.value()) & (MorphForm.SYNONYM.value())) !== (MorphForm.UNDEFINED.value())) 
            res.append("синонимич.|");
        if (res.length > 0) 
            res.length = res.length - 1;
        return res.toString();
    }
    
    static correctWord(w) {
        if (w === null) 
            return null;
        let res = w.toUpperCase();
        for (const ch of res) {
            if (LanguageHelper.m_Rus0.indexOf(ch) >= 0) {
                let tmp = new StringBuilder();
                tmp.append(res);
                for (let i = 0; i < tmp.length; i++) {
                    let j = LanguageHelper.m_Rus0.indexOf(tmp.charAt(i));
                    if (j >= 0) 
                        tmp.setCharAt(i, LanguageHelper.m_Rus1[j]);
                }
                res = tmp.toString();
                break;
            }
        }
        if (res.indexOf(String.fromCharCode(0x00AD)) >= 0) 
            res = Utils.replaceString(res, String.fromCharCode(0x00AD), '-');
        if (res.startsWith("АГЕНС")) 
            res = "АГЕНТС" + res.substring(5);
        return res;
    }
    
    static static_constructor() {
        LanguageHelper.m_LatChars = "ABEKMHOPCTYXIaekmopctyxi";
        LanguageHelper.m_CyrChars = "АВЕКМНОРСТУХІаекморстухі";
        LanguageHelper.m_GreekChars = "ΑΒΓΕΗΙΚΛΜΟΠΡΤΥΦΧ";
        LanguageHelper.m_CyrGreekChars = "АВГЕНІКЛМОПРТУФХ";
        LanguageHelper.m_UdarChars = "ÀÁÈÉËÒÓàáèéëýÝòóЀѐЍѝỲỳ";
        LanguageHelper.m_UdarCyrChars = "ААЕЕЕООааеееуУооЕеИиУу";
        LanguageHelper.m_Preps = [("БЕЗ;ДО;ИЗ;ИЗЗА;ОТ;У;ДЛЯ;РАДИ;ВОЗЛЕ;ПОЗАДИ;ВПЕРЕДИ;БЛИЗ;ВБЛИЗИ;ВГЛУБЬ;ВВИДУ;ВДОЛЬ;ВЗАМЕН;ВКРУГ;ВМЕСТО;" + "ВНЕ;ВНИЗУ;ВНУТРИ;ВНУТРЬ;ВОКРУГ;ВРОДЕ;ВСЛЕД;ВСЛЕДСТВИЕ;ЗАМЕСТО;ИЗНУТРИ;КАСАТЕЛЬНО;КРОМЕ;" + "МИМО;НАВРОДЕ;НАЗАД;НАКАНУНЕ;НАПОДОБИЕ;НАПРОТИВ;НАСЧЕТ;ОКОЛО;ОТНОСИТЕЛЬНО;") + "ПОВЕРХ;ПОДЛЕ;ПОМИМО;ПОПЕРЕК;ПОРЯДКА;ПОСЕРЕДИНЕ;ПОСРЕДИ;ПОСЛЕ;ПРЕВЫШЕ;ПРЕЖДЕ;ПРОТИВ;СВЕРХ;" + "СВЫШЕ;СНАРУЖИ;СРЕДИ;СУПРОТИВ;ПУТЕМ;ПОСРЕДСТВОМ", "К;БЛАГОДАРЯ;ВОПРЕКИ;НАВСТРЕЧУ;СОГЛАСНО;СООБРАЗНО;ПАРАЛЛЕЛЬНО;ПОДОБНО;СООТВЕТСТВЕННО;СОРАЗМЕРНО", "ПРО;ЧЕРЕЗ;СКВОЗЬ;СПУСТЯ", "НАД;ПЕРЕД;ПРЕД", "ПРИ", "В;НА;О;ВКЛЮЧАЯ", "МЕЖДУ", "ЗА;ПОД", "ПО", "С"];
        LanguageHelper.m_Cases = [MorphCase.GENITIVE, MorphCase.DATIVE, MorphCase.ACCUSATIVE, MorphCase.INSTRUMENTAL, MorphCase.PREPOSITIONAL, MorphCase.ooBitor(MorphCase.ACCUSATIVE, MorphCase.PREPOSITIONAL), MorphCase.ooBitor(MorphCase.GENITIVE, MorphCase.INSTRUMENTAL), MorphCase.ooBitor(MorphCase.ACCUSATIVE, MorphCase.INSTRUMENTAL), MorphCase.ooBitor(MorphCase.DATIVE, MorphCase.ooBitor(MorphCase.ACCUSATIVE, MorphCase.PREPOSITIONAL)), MorphCase.ooBitor(MorphCase.GENITIVE, MorphCase.ooBitor(MorphCase.ACCUSATIVE, MorphCase.INSTRUMENTAL))];
        LanguageHelper.m_PrepCases = null;
        LanguageHelper.m_PrepNormsSrc = ["БЕЗ;БЕЗО", "ВБЛИЗИ;БЛИЗ", "В;ВО", "ВОКРУГ;ВКРУГ", "ВНУТРИ;ВНУТРЬ;ВОВНУТРЬ", "ВПЕРЕДИ;ВПЕРЕД", "ВСЛЕД;ВОСЛЕД", "ВМЕСТО;ЗАМЕСТО", "ИЗ;ИЗО", "К;КО", "МЕЖДУ;МЕЖ;ПРОМЕЖДУ;ПРОМЕЖ", "НАД;НАДО", "О;ОБ;ОБО", "ОТ;ОТО", "ПЕРЕД;ПРЕД;ПРЕДО;ПЕРЕДО", "ПОД;ПОДО", "ПОСЕРЕДИНЕ;ПОСРЕДИ;ПОСЕРЕДЬ", "С;СО", "СРЕДИ;СРЕДЬ;СЕРЕДЬ", "ЧЕРЕЗ;ЧРЕЗ"];
        LanguageHelper.m_PrepNorms = null;
        LanguageHelper.m_Rus0 = "–ЁѐЀЍѝЎўӢӣ";
        LanguageHelper.m_Rus1 = "-ЕЕЕИИУУЙЙ";
        LanguageHelper.m_PrepCases = new Hashtable();
        for (let i = 0; i < LanguageHelper.m_Preps.length; i++) {
            for (const v of Utils.splitString(LanguageHelper.m_Preps[i], ';', false)) {
                LanguageHelper.m_PrepCases.put(v, LanguageHelper.m_Cases[i]);
            }
        }
        LanguageHelper.m_PrepNorms = new Hashtable();
        for (const s of LanguageHelper.m_PrepNormsSrc) {
            let vars = Utils.splitString(s, ';', false);
            for (let i = 1; i < vars.length; i++) {
                LanguageHelper.m_PrepNorms.put(vars[i], vars[0]);
            }
        }
    }
}


LanguageHelper.static_constructor();

module.exports = LanguageHelper