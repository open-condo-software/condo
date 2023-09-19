/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphGender = require("./../../../morph/MorphGender");
const MorphNumber = require("./../../../morph/MorphNumber");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TextToken = require("./../../TextToken");
const VerbType = require("./../VerbType");
const ChatType = require("./../ChatType");
const MiscHelper = require("./../../core/MiscHelper");
const DateRangeReferent = require("./../../date/DateRangeReferent");
const ProcessorService = require("./../../ProcessorService");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const Termin = require("./../../core/Termin");
const DateReferent = require("./../../date/DateReferent");

class ChatItemToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.not = false;
        this.typ = ChatType.UNDEFINED;
        this.vTyp = VerbType.UNDEFINED;
        this.value = null;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.typ.toString());
        if (this.not) 
            tmp.append(" not");
        if (this.value !== null) 
            tmp.append(" ").append(this.value);
        if (this.vTyp !== VerbType.UNDEFINED) 
            tmp.append(" [").append(this.vTyp.toString()).append("]");
        return tmp.toString();
    }
    
    static _isEmptyToken(t) {
        if (!(t instanceof TextToken)) 
            return false;
        if (t.lengthChar === 1) 
            return true;
        let mc = t.getMorphClassInDictionary();
        if ((((mc.isMisc || mc.isAdverb || mc.isConjunction) || mc.isPreposition || mc.isPersonalPronoun) || mc.isPronoun || mc.isConjunction) || mc.isPreposition) 
            return true;
        return false;
    }
    
    static tryParse(t) {
        let tok = null;
        let _not = false;
        let tt = null;
        let t0 = null;
        let t1 = null;
        let hasModal = false;
        let dt0 = Utils.MIN_DATE;
        let dt1 = Utils.MIN_DATE;
        for (tt = t; tt !== null; tt = tt.next) {
            if (tt !== t && tt.isNewlineBefore) 
                break;
            if (tt.isCharOf(".?!")) 
                break;
            if (tt.lengthChar === 1) 
                continue;
            let ok = false;
            if (tt.getReferent() instanceof DateReferent) {
                let dr = Utils.as(tt.getReferent(), DateReferent);
                let wrapdt0665 = new RefOutArgWrapper();
                let wrapdt1666 = new RefOutArgWrapper();
                ok = dr.calculateDateRange((ProcessorService.DEBUG_CURRENT_DATE_TIME === null ? Utils.now() : ProcessorService.DEBUG_CURRENT_DATE_TIME), wrapdt0665, wrapdt1666, 0);
                dt0 = wrapdt0665.value;
                dt1 = wrapdt1666.value;
            }
            else if (tt.getReferent() instanceof DateRangeReferent) {
                let dr = Utils.as(tt.getReferent(), DateRangeReferent);
                let wrapdt0667 = new RefOutArgWrapper();
                let wrapdt1668 = new RefOutArgWrapper();
                ok = dr.calculateDateRange((ProcessorService.DEBUG_CURRENT_DATE_TIME === null ? Utils.now() : ProcessorService.DEBUG_CURRENT_DATE_TIME), wrapdt0667, wrapdt1668, 0);
                dt0 = wrapdt0667.value;
                dt1 = wrapdt1668.value;
            }
            if (ok) {
                if (dt0 !== dt1) {
                    let res = ChatItemToken._new669(tt, tt, ChatType.DATERANGE);
                    res.value = (String(dt0.getFullYear()) + "." + Utils.correctToString((Utils.getMonth(dt0)).toString(10), 2, true) + "." + Utils.correctToString((dt0.getDate()).toString(10), 2, true));
                    if (dt0.getHours() > 0 || dt0.getMinutes() > 0) 
                        res.value = (res.value + " " + Utils.correctToString((dt0.getHours()).toString(10), 2, true) + ":" + Utils.correctToString((dt0.getMinutes()).toString(10), 2, true));
                    res.value = (res.value + " - " + dt1.getFullYear() + "." + Utils.correctToString((Utils.getMonth(dt1)).toString(10), 2, true) + "." + Utils.correctToString((dt1.getDate()).toString(10), 2, true));
                    if (dt1.getHours() > 0 || dt1.getMinutes() > 0) 
                        res.value = (res.value + " " + Utils.correctToString((dt1.getHours()).toString(10), 2, true) + ":" + Utils.correctToString((dt1.getMinutes()).toString(10), 2, true));
                    return res;
                }
                else {
                    let res = ChatItemToken._new669(tt, tt, ChatType.DATE);
                    res.value = (String(dt0.getFullYear()) + "." + Utils.correctToString((Utils.getMonth(dt0)).toString(10), 2, true) + "." + Utils.correctToString((dt0.getDate()).toString(10), 2, true));
                    if (dt0.getHours() > 0 || dt0.getMinutes() > 0) 
                        res.value = (res.value + " " + Utils.correctToString((dt0.getHours()).toString(10), 2, true) + ":" + Utils.correctToString((dt0.getMinutes()).toString(10), 2, true));
                    return res;
                }
            }
            if (!(tt instanceof TextToken)) 
                break;
            tok = ChatItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) 
                break;
            let mc = tt.getMorphClassInDictionary();
            let term = tt.term;
            if (term === "НЕ") {
                _not = true;
                if (t0 === null) 
                    t0 = tt;
                continue;
            }
            if ((mc.isPersonalPronoun || mc.isPronoun || mc.isConjunction) || mc.isPreposition) 
                continue;
            if (tt.isValue("ХОТЕТЬ", null) || tt.isValue("ЖЕЛАТЬ", null) || tt.isValue("МОЧЬ", null)) {
                hasModal = true;
                if (t0 === null) 
                    t0 = tt;
                t1 = tt;
                continue;
            }
            if (mc.isAdverb || mc.isMisc) 
                continue;
            if (mc.isVerb) {
                let res = new ChatItemToken(tt, tt);
                res.typ = ChatType.VERB;
                res.value = tt.lemma;
                if (_not) 
                    res.not = true;
                if (t0 !== null) 
                    res.beginToken = t0;
                return res;
            }
        }
        if (tok !== null) {
            let res = new ChatItemToken(tok.beginToken, tok.endToken);
            res.typ = ChatType.of(tok.termin.tag);
            if (tok.termin.tag2 instanceof VerbType) 
                res.vTyp = VerbType.of(tok.termin.tag2);
            if (res.typ === ChatType.VERB && tok.beginToken === tok.endToken && (tok.beginToken instanceof TextToken)) 
                res.value = tok.beginToken.lemma;
            else 
                res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO);
            if (_not) 
                res.not = true;
            if (t0 !== null) 
                res.beginToken = t0;
            if (res.typ === ChatType.REPEAT) {
                for (tt = tok.endToken.next; tt !== null; tt = tt.next) {
                    if (!(tt instanceof TextToken)) 
                        break;
                    if (ChatItemToken._isEmptyToken(tt)) 
                        continue;
                    let tok1 = ChatItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
                    if (tok1 !== null) {
                        if ((ChatType.of(tok1.termin.tag)) === ChatType.ACCEPT || (ChatType.of(tok1.termin.tag)) === ChatType.MISC) {
                            tt = tok1.endToken;
                            continue;
                        }
                        if ((ChatType.of(tok1.termin.tag)) === ChatType.REPEAT) {
                            tt = res.endToken = tok1.endToken;
                            continue;
                        }
                        break;
                    }
                    let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null) {
                        if (npt.endToken.isValue("ВОПРОС", null) || npt.endToken.isValue("ФРАЗА", null) || npt.endToken.isValue("ПРЕДЛОЖЕНИЕ", null)) {
                            tt = res.endToken = npt.endToken;
                            res.value = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                            continue;
                        }
                    }
                    break;
                }
            }
            return res;
        }
        if (_not && hasModal) {
            let res = new ChatItemToken(t0, t1);
            res.typ = ChatType.CANCEL;
            return res;
        }
        return null;
    }
    
    static initialize() {
        if (ChatItemToken.m_Ontology !== null) 
            return;
        ChatItemToken.m_Ontology = new TerminCollection();
        let t = null;
        t = Termin._new170("ДА", ChatType.ACCEPT);
        t.addVariant("КОНЕЧНО", false);
        t.addVariant("РАЗУМЕЕТСЯ", false);
        t.addVariant("ПОЖАЛУЙСТА", false);
        t.addVariant("ПОЖАЛУЙ", false);
        t.addVariant("ПЛИЗ", false);
        t.addVariant("НЕПРЕМЕННО", false);
        t.addVariant("ЕСТЬ", false);
        t.addVariant("АГА", false);
        t.addVariant("УГУ", false);
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("НЕТ", ChatType.CANCEL);
        t.addVariant("ДА НЕТ", false);
        t.addVariant("НИ ЗА ЧТО", false);
        t.addVariant("НЕ ХОТЕТЬ", false);
        t.addVariant("ОТСТАТЬ", false);
        t.addVariant("НИКТО", false);
        t.addVariant("НИЧТО", false);
        t.addVariant("НИЧЕГО", false);
        t.addVariant("НИГДЕ", false);
        t.addVariant("НИКОГДА", false);
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("СПАСИБО", ChatType.THANKS);
        t.addVariant("БЛАГОДАРИТЬ", false);
        t.addVariant("БЛАГОДАРСТВОВАТЬ", false);
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("НУ", ChatType.MISC);
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("ПРИВЕТ", ChatType.HELLO);
        for (const s of ["ЗДРАВСТВУЙ", "ЗДРАВСТВУЙТЕ", "ПРИВЕТИК", "ЗДРАВИЯ ЖЕЛАЮ", "ХЭЛЛОУ", "АЛЛЕ", "ХЭЛО", "АЛЛО", "САЛЮТ", "ДОБРЫЙ ДЕНЬ", "ДОБРЫЙ ВЕЧЕР", "ДОБРОЕ УТРО", "ДОБРАЯ НОЧЬ", "ЗДОРОВО"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОКА", ChatType.BYE);
        for (const s of ["ДО СВИДАНИЯ", "ДОСВИДАНИЯ", "ПРОЩАЙ", "ПРОЩАЙТЕ", "ПРОЩЕВАЙ", "ХОРОШЕГО ДНЯ", "ХОРОШЕГО ВЕЧЕРА", "ВСЕГО ХОРОШЕГО", "ВСЕГО ДОБРОГО", "ВСЕХ БЛАГ", "СЧАСТЛИВО", "ДО СКОРОЙ ВСТРЕЧИ", "ДО ЗАВТРА", "ДО ВСТРЕЧИ", "СКОРО УВИДИМСЯ", "ПОКЕДА", "ПОКЕДОВА", "ПРОЩАЙ", "ПРОЩАЙТЕ", "ЧАО", "ГУД БАЙ", "ГУДБАЙ", "ЧАО"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new349("ГОВОРИТЬ", ChatType.VERB, VerbType.SAY);
        for (const s of ["СКАЗАТЬ", "РАЗГОВАРИВАТЬ", "ПРОИЗНЕСТИ", "ПРОИЗНОСИТЬ", "ОТВЕТИТЬ", "ОТВЕЧАТЬ", "СПРАШИВАТЬ", "СПРОСИТЬ", "ПОТОВОРИТЬ", "ОБЩАТЬСЯ", "ПООБЩАТЬСЯ"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new349("ЗВОНИТЬ", ChatType.VERB, VerbType.CALL);
        for (const s of ["ПЕРЕЗВОНИТЬ", "ПОЗВОНИТЬ", "СДЕЛАТЬ ЗВОНОК", "НАБРАТЬ"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new349("БЫТЬ", ChatType.VERB, VerbType.BE);
        for (const s of ["ЯВЛЯТЬСЯ"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new349("ИМЕТЬ", ChatType.VERB, VerbType.HAVE);
        for (const s of ["ОБЛАДАТЬ", "ВЛАДЕТЬ"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОЗЖЕ", ChatType.LATER);
        for (const s of ["ПОПОЗЖЕ", "ПОЗДНЕЕ", "ПОТОМ", "НЕКОГДА"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("ЗАНЯТ", ChatType.BUSY);
        for (const s of ["НЕУДОБНО", "НЕ УДОБНО", "НЕТ ВРЕМЕНИ", "ПАРАЛЛЕЛЬНЫЙ ЗВОНОК", "СОВЕЩАНИЕ", "ОБЕД", "ТРАНСПОРТ", "МЕТРО"]) {
            t.addVariant(s, false);
        }
        ChatItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОВТОРИТЬ", ChatType.REPEAT);
        t.addVariant("НЕ РАССЛЫШАТЬ", false);
        t.addVariant("НЕ УСЛЫШАТЬ", false);
        t.addVariant("ПЛОХО СЛЫШНО", false);
        t.addVariant("ПЛОХАЯ СВЯЗЬ", false);
        ChatItemToken.m_Ontology.add(t);
    }
    
    static _new669(_arg1, _arg2, _arg3) {
        let res = new ChatItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static static_constructor() {
        ChatItemToken.m_Ontology = null;
    }
}


ChatItemToken.static_constructor();

module.exports = ChatItemToken