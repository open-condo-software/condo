/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const BracketParseAttr = require("./../../core/BracketParseAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MetaToken = require("./../../MetaToken");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const GeoReferent = require("./../../geo/GeoReferent");
const PersonItemTokenParseAttr = require("./../../person/internal/PersonItemTokenParseAttr");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const TextToken = require("./../../TextToken");
const MailLineTypes = require("./MailLineTypes");
const ReferentToken = require("./../../ReferentToken");
const PersonReferent = require("./../../person/PersonReferent");
const AddressReferent = require("./../../address/AddressReferent");
const PersonPropertyReferent = require("./../../person/PersonPropertyReferent");

class MailLine extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.lev = 0;
        this.typ = MailLineTypes.UNDEFINED;
        this.refs = new Array();
        this.mustBeFirstLine = false;
    }
    
    get charsCount() {
        let cou = 0;
        for (let t = this.beginToken; t !== null; t = t.next) {
            cou += t.lengthChar;
            if (t === this.endToken) 
                break;
        }
        return cou;
    }
    
    get words() {
        let cou = 0;
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            if ((t instanceof TextToken) && t.chars.isLetter && t.lengthChar > 2) {
                if (t.tag === null) 
                    cou++;
            }
        }
        return cou;
    }
    
    get isPureEn() {
        let en = 0;
        let ru = 0;
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            if ((t instanceof TextToken) && t.chars.isLetter) {
                if (t.chars.isCyrillicLetter) 
                    ru++;
                else if (t.chars.isLatinLetter) 
                    en++;
            }
        }
        if (en > 0 && ru === 0) 
            return true;
        return false;
    }
    
    get isPureRu() {
        let en = 0;
        let ru = 0;
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            if ((t instanceof TextToken) && t.chars.isLetter) {
                if (t.chars.isCyrillicLetter) 
                    ru++;
                else if (t.chars.isLatinLetter) 
                    en++;
            }
        }
        if (ru > 0 && en === 0) 
            return true;
        return false;
    }
    
    get mailAddr() {
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            if (t.getReferent() !== null && t.getReferent().typeName === "URI") {
                if (t.getReferent().getStringValue("SCHEME") === "mailto") 
                    return t.getReferent();
            }
        }
        return null;
    }
    
    get isRealFrom() {
        let tt = Utils.as(this.beginToken, TextToken);
        if (tt === null) 
            return false;
        return tt.term === "FROM" || tt.term === "ОТ";
    }
    
    toString() {
        return ((this.mustBeFirstLine ? "(1) " : "") + this.lev + " " + String(this.typ) + ": " + this.getSourceText());
    }
    
    static parse(t0, _lev, maxCount = 0) {
        const PersonItemToken = require("./../../person/internal/PersonItemToken");
        if (t0 === null) 
            return null;
        let res = new MailLine(t0, t0);
        let pr = true;
        let cou = 0;
        for (let t = t0; t !== null; t = t.next,cou++) {
            if (t.isNewlineBefore && t0 !== t) 
                break;
            if (maxCount > 0 && cou > maxCount) 
                break;
            res.endToken = t;
            if (t.isTableControlChar || t.isHiphen) 
                continue;
            if (pr) {
                if ((t instanceof TextToken) && t.isCharOf(">|")) 
                    res.lev++;
                else {
                    pr = false;
                    let tok = MailLine.m_FromWords.tryParse(t, TerminParseAttr.NO);
                    if (tok !== null && tok.endToken.next !== null && tok.endToken.next.isChar(':')) {
                        res.typ = MailLineTypes.FROM;
                        t = tok.endToken.next;
                        continue;
                    }
                }
            }
            if (t instanceof ReferentToken) {
                let r = t.getReferent();
                if (r !== null) {
                    if ((((r instanceof PersonReferent) || (r instanceof GeoReferent) || (r instanceof AddressReferent)) || r.typeName === "PHONE" || r.typeName === "URI") || (r instanceof PersonPropertyReferent) || r.typeName === "ORGANIZATION") 
                        res.refs.push(r);
                }
            }
        }
        if (res.typ === MailLineTypes.UNDEFINED) {
            let t = t0;
            for (; t !== null && (t.endChar < res.endChar); t = t.next) {
                if (!t.isHiphen && t.chars.isLetter) 
                    break;
            }
            let ok = 0;
            let nams = 0;
            let oth = 0;
            let lastComma = null;
            for (; t !== null && (t.endChar < res.endChar); t = t.next) {
                if (t.getReferent() instanceof PersonReferent) {
                    nams++;
                    continue;
                }
                if (t instanceof TextToken) {
                    if (!t.chars.isLetter) {
                        lastComma = t;
                        continue;
                    }
                    let tok = MailLine.m_HelloWords.tryParse(t, TerminParseAttr.NO);
                    if (tok !== null && (t instanceof TextToken) && t.isValue("ДОРОГОЙ", null)) {
                        if (t.term === "ДОРОГОЙ" || t.term === "ДОРОГАЯ" || t.term === "ДОРОГИЕ") {
                        }
                        else 
                            tok = null;
                    }
                    if (tok !== null) {
                        ok++;
                        t = tok.endToken;
                        continue;
                    }
                    if (t.isValue("ВСЕ", null) || t.isValue("ALL", null) || t.isValue("TEAM", null)) {
                        nams++;
                        continue;
                    }
                    let pit = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.NO, null);
                    if (pit !== null) {
                        nams++;
                        t = pit.endToken;
                        continue;
                    }
                }
                if ((++oth) > 3) {
                    if (ok > 0 && lastComma !== null) {
                        res.endToken = lastComma;
                        oth = 0;
                    }
                    break;
                }
            }
            if ((oth < 3) && ok > 0) 
                res.typ = MailLineTypes.HELLO;
        }
        if (res.typ === MailLineTypes.UNDEFINED) {
            let okWords = 0;
            if (t0.isValue("HAVE", null)) {
            }
            for (let t = t0; t !== null && t.endChar <= res.endChar; t = (t === null ? null : t.next)) {
                if (!(t instanceof TextToken)) 
                    continue;
                if (t.isChar('<')) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        t = br.endToken;
                        continue;
                    }
                }
                if (!t.isLetters || t.isTableControlChar) 
                    continue;
                let tok = MailLine.m_RegardWords.tryParse(t, TerminParseAttr.NO);
                if (tok !== null) {
                    okWords++;
                    for (; t !== null && t.endChar <= tok.endChar; t = t.next) {
                        t.tag = tok.termin;
                    }
                    t = tok.endToken;
                    if ((t.next instanceof TextToken) && t.next.morph._case.isGenitive) {
                        for (t = t.next; t !== null && t.endChar <= res.endChar; t = t.next) {
                            if (t.morph._class.isConjunction) 
                                continue;
                            let npt1 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                            if (npt1 === null) 
                                break;
                            if (!npt1.morph._case.isGenitive) 
                                break;
                            for (; t.endChar < npt1.endChar; t = t.next) {
                                t.tag = t;
                            }
                            t.tag = t;
                        }
                    }
                    continue;
                }
                if ((t.morph._class.isPreposition || t.morph._class.isConjunction || t.morph._class.isMisc) || t.isValue("C", null)) 
                    continue;
                if ((okWords > 0 && t.previous !== null && t.previous.isComma) && t.previous.beginChar > t0.beginChar && !t.chars.isAllLower) {
                    res.endToken = t.previous;
                    break;
                }
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt === null) {
                    if ((res.endChar - t.endChar) > 10) 
                        okWords = 0;
                    break;
                }
                tok = MailLine.m_RegardWords.tryParse(npt.endToken, TerminParseAttr.NO);
                if (tok !== null && (npt.endToken instanceof TextToken)) {
                    let term = npt.endToken.term;
                    if (term === "ДЕЛ") 
                        tok = null;
                }
                if (tok === null) {
                    if (npt.noun.isValue("НАДЕЖДА", null)) 
                        t.tag = t;
                    else if (okWords > 0 && t.isValue("NICE", null) && ((res.endChar - npt.endChar) < 13)) 
                        t.tag = t;
                    else 
                        okWords = 0;
                    break;
                }
                okWords++;
                for (; t !== null && t.endChar <= tok.endChar; t = t.next) {
                    t.tag = tok.termin;
                }
                t = tok.endToken;
            }
            if (okWords > 0) 
                res.typ = MailLineTypes.BESTREGARDS;
        }
        if (res.typ === MailLineTypes.UNDEFINED) {
            let t = t0;
            for (; t !== null && (t.endChar < res.endChar); t = t.next) {
                if (!(t instanceof TextToken)) 
                    break;
                else if (!t.isHiphen && t.chars.isLetter) 
                    break;
            }
            if (t !== null) {
                if (t !== t0) {
                }
                if (((t.isValue("ПЕРЕСЫЛАЕМОЕ", null) || t.isValue("ПЕРЕАДРЕСОВАННОЕ", null))) && t.next !== null && t.next.isValue("СООБЩЕНИЕ", null)) {
                    res.typ = MailLineTypes.FROM;
                    res.mustBeFirstLine = true;
                }
                else if ((t.isValue("НАЧАЛО", null) && t.next !== null && ((t.next.isValue("ПЕРЕСЫЛАЕМОЕ", null) || t.next.isValue("ПЕРЕАДРЕСОВАННОЕ", null)))) && t.next.next !== null && t.next.next.isValue("СООБЩЕНИЕ", null)) {
                    res.typ = MailLineTypes.FROM;
                    res.mustBeFirstLine = true;
                }
                else if (t.isValue("ORIGINAL", null) && t.next !== null && ((t.next.isValue("MESSAGE", null) || t.next.isValue("APPOINTMENT", null)))) {
                    res.typ = MailLineTypes.FROM;
                    res.mustBeFirstLine = true;
                }
                else if (t.isValue("ПЕРЕСЛАНО", null) && t.next !== null && t.next.isValue("ПОЛЬЗОВАТЕЛЕМ", null)) {
                    res.typ = MailLineTypes.FROM;
                    res.mustBeFirstLine = true;
                }
                else if (((t.getReferent() !== null && t.getReferent().typeName === "DATE")) || ((t.isValue("IL", null) && t.next !== null && t.next.isValue("GIORNO", null))) || ((t.isValue("ON", null) && (t.next instanceof ReferentToken) && t.next.getReferent().typeName === "DATE"))) {
                    let hasFrom = false;
                    let hasDate = t.getReferent() !== null && t.getReferent().typeName === "DATE";
                    if (t.isNewlineAfter && (_lev < 5)) {
                        let res1 = MailLine.parse(t.next, _lev + 1, 0);
                        if (res1 !== null && res1.typ === MailLineTypes.HELLO) 
                            res.typ = MailLineTypes.FROM;
                    }
                    let _next = MailLine.parse(res.endToken.next, _lev + 1, 0);
                    if (_next !== null) {
                        if (_next.typ !== MailLineTypes.UNDEFINED) 
                            _next = null;
                    }
                    let tmax = res.endChar;
                    if (_next !== null) 
                        tmax = _next.endChar;
                    let br1 = null;
                    for (; t !== null && t.endChar <= tmax; t = (t === null ? null : t.next)) {
                        if (t.isValue("ОТ", null) || t.isValue("FROM", null)) 
                            hasFrom = true;
                        else if (t.getReferent() !== null && ((t.getReferent().typeName === "URI" || (t.getReferent() instanceof PersonReferent)))) {
                            if (t.getReferent().typeName === "URI" && hasDate) {
                                if (br1 !== null) {
                                    hasFrom = true;
                                    _next = null;
                                }
                                if (t.previous.isChar('<') && t.next !== null && t.next.isChar('>')) {
                                    t = t.next;
                                    if (t.next !== null && t.next.isChar(':')) 
                                        t = t.next;
                                    if (t.isNewlineAfter) {
                                        hasFrom = true;
                                        _next = null;
                                    }
                                }
                            }
                            for (t = t.next; t !== null && t.endChar <= res.endChar; t = t.next) {
                                if (t.isValue("HA", null) && t.next !== null && t.next.isValue("SCRITTO", null)) {
                                    hasFrom = true;
                                    break;
                                }
                                else if (((t.isValue("НАПИСАТЬ", null) || t.isValue("WROTE", null))) && ((res.endChar - t.endChar) < 10)) {
                                    hasFrom = true;
                                    break;
                                }
                            }
                            if (t === null) 
                                continue;
                            if (hasFrom) {
                                res.typ = MailLineTypes.FROM;
                                if (_next !== null && t.endChar >= _next.beginChar) 
                                    res.endToken = _next.endToken;
                            }
                            break;
                        }
                        else if (br1 === null && !t.isChar('<') && BracketHelper.canBeStartOfSequence(t, true, false)) {
                            br1 = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                            if (br1 !== null) 
                                t = br1.endToken;
                        }
                    }
                }
                else {
                    let hasUri = false;
                    for (; t !== null && (t.endChar < res.endChar); t = t.next) {
                        if (t.getReferent() !== null && ((t.getReferent().typeName === "URI" || (t.getReferent() instanceof PersonReferent)))) 
                            hasUri = true;
                        else if (t.isValue("ПИСАТЬ", null) && hasUri) {
                            if (t.next !== null && t.next.isChar('(')) {
                                if (hasUri) 
                                    res.typ = MailLineTypes.FROM;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return res;
    }
    
    static isKeyword(t) {
        if (t === null) 
            return false;
        if (MailLine.m_RegardWords.tryParse(t, TerminParseAttr.NO) !== null) 
            return true;
        if (MailLine.m_FromWords.tryParse(t, TerminParseAttr.NO) !== null) 
            return true;
        if (MailLine.m_HelloWords.tryParse(t, TerminParseAttr.NO) !== null) 
            return true;
        return false;
    }
    
    static initialize() {
        if (MailLine.m_RegardWords !== null) 
            return;
        MailLine.m_RegardWords = new TerminCollection();
        for (const s of ["УВАЖЕНИЕ", "ПОЧТЕНИЕ", "С УВАЖЕНИЕМ", "ПОЖЕЛАНИE", "ДЕНЬ", "ХОРОШЕГО ДНЯ", "ИСКРЕННЕ ВАШ", "УДАЧА", "СПАСИБО", "ЦЕЛОВАТЬ", "ПОВАГА", "З ПОВАГОЮ", "ПОБАЖАННЯ", "ДЕНЬ", "ЩИРО ВАШ", "ДЯКУЮ", "ЦІЛУВАТИ", "BEST REGARDS", "REGARDS", "BEST WISHES", "KIND REGARDS", "GOOD BYE", "BYE", "THANKS", "THANK YOU", "MANY THANKS", "DAY", "VERY MUCH", "HAVE", "LUCK", "Yours sincerely", "sincerely Yours", "Looking forward", "Ar cieņu"]) {
            MailLine.m_RegardWords.add(new Termin(s.toUpperCase()));
        }
        MailLine.m_FromWords = new TerminCollection();
        for (const s of ["FROM", "TO", "CC", "SENT", "SUBJECT", "SENDER", "TIME", "ОТ КОГО", "КОМУ", "ДАТА", "ТЕМА", "КОПИЯ", "ОТ", "ОТПРАВЛЕНО", "WHEN", "WHERE"]) {
            MailLine.m_FromWords.add(new Termin(s));
        }
        MailLine.m_HelloWords = new TerminCollection();
        for (const s of ["HI", "HELLO", "DEAR", "GOOD MORNING", "GOOD DAY", "GOOD EVENING", "GOOD NIGHT", "ЗДРАВСТВУЙ", "ЗДРАВСТВУЙТЕ", "ПРИВЕТСТВУЮ", "ПРИВЕТ", "ПРИВЕТИК", "УВАЖАЕМЫЙ", "ДОРОГОЙ", "ЛЮБЕЗНЫЙ", "ДОБРОЕ УТРО", "ДОБРЫЙ ДЕНЬ", "ДОБРЫЙ ВЕЧЕР", "ДОБРОЙ НОЧИ", "ЗДРАСТУЙ", "ЗДРАСТУЙТЕ", "ВІТАЮ", "ПРИВІТ", "ПРИВІТ", "ШАНОВНИЙ", "ДОРОГИЙ", "ЛЮБИЙ", "ДОБРОГО РАНКУ", "ДОБРИЙ ДЕНЬ", "ДОБРИЙ ВЕЧІР", "ДОБРОЇ НОЧІ"]) {
            MailLine.m_HelloWords.add(new Termin(s));
        }
    }
    
    static static_constructor() {
        MailLine.m_RegardWords = null;
        MailLine.m_FromWords = null;
        MailLine.m_HelloWords = null;
    }
}


MailLine.static_constructor();

module.exports = MailLine