/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MetaToken = require("./../../MetaToken");
const Referent = require("./../../Referent");
const DateReferent = require("./../../date/DateReferent");
const TextToken = require("./../../TextToken");
const MeasureKind = require("./../../measure/MeasureKind");
const NumberWithUnitParseAttr = require("./../../measure/internal/NumberWithUnitParseAttr");
const GetTextAttr = require("./../../core/GetTextAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const MoneyReferent = require("./../../money/MoneyReferent");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberHelper = require("./../../core/NumberHelper");
const VerbPhraseHelper = require("./../../core/VerbPhraseHelper");
const UriReferent = require("./../../uri/UriReferent");
const NumbersWithUnitToken = require("./../../measure/internal/NumbersWithUnitToken");
const VacanceTokenType = require("./VacanceTokenType");

class VacanceToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.typ = VacanceTokenType.UNDEFINED;
        this.refs = new Array();
        this.value = null;
        this.value2 = null;
    }
    
    get isSkill() {
        return (((this.typ === VacanceTokenType.EXPIERENCE || this.typ === VacanceTokenType.EDUCATION || this.typ === VacanceTokenType.SKILL) || this.typ === VacanceTokenType.LANGUAGE || this.typ === VacanceTokenType.PLUS) || this.typ === VacanceTokenType.MORAL || this.typ === VacanceTokenType.LICENSE) || this.typ === VacanceTokenType.DRIVING;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.typ !== VacanceTokenType.UNDEFINED) 
            tmp.append(String(this.typ)).append(": ");
        if (this.value !== null) 
            tmp.append("\"").append(this.value).append("\" ");
        if (this.value2 !== null) 
            tmp.append("\"").append(this.value2).append("\" ");
        for (const r of this.refs) {
            tmp.append("[").append(r.toString()).append("] ");
        }
        tmp.append(" ").append(this.getSourceText());
        return tmp.toString();
    }
    
    static tryParseList(t) {
        let res = new Array();
        for (; t !== null; t = t.next) {
            let prev = null;
            if (res.length > 0 && res[res.length - 1].endToken.next === t) 
                prev = res[res.length - 1];
            let vv = VacanceToken.tryParse(t, prev);
            if (vv === null) 
                break;
            if (vv.lengthChar > 3) 
                res.push(vv);
            t = vv.endToken;
        }
        for (let i = 0; i < res.length; i++) {
            let it = res[i];
            if (it.typ === VacanceTokenType.DATE) {
                it.typ = VacanceTokenType.UNDEFINED;
                continue;
            }
            if (it.typ === VacanceTokenType.DUMMY) 
                continue;
            if (it.typ === VacanceTokenType.UNDEFINED && it.refs.length > 0) {
                if (it.refs[0] instanceof UriReferent) 
                    continue;
            }
            if (it.typ === VacanceTokenType.SKILL && ((i + 1) < res.length) && res[i + 1].typ === VacanceTokenType.MONEY) 
                it.typ = VacanceTokenType.UNDEFINED;
            if (it.typ === VacanceTokenType.EXPIRED) 
                continue;
            if (it.typ !== VacanceTokenType.UNDEFINED) 
                break;
            it.typ = VacanceTokenType.NAME;
            if (((i + 2) < res.length) && ((res[i + 1].typ === VacanceTokenType.UNDEFINED || res[i + 1].typ === VacanceTokenType.SKILL))) {
                if (res[i + 2].typ === VacanceTokenType.MONEY) {
                    it.endToken = res[i + 1].endToken;
                    res.splice(i + 1, 1);
                }
                else if (res[i + 2].typ === VacanceTokenType.MONEY) {
                    if (res[i + 2]._tryParseMoney()) {
                        it.endToken = res[i + 1].endToken;
                        res.splice(i + 1, 1);
                    }
                }
            }
            it._getValue();
            if (((i + 1) < res.length) && res[i + 1].typ === VacanceTokenType.UNDEFINED) {
                if (res[i + 1]._tryParseMoney()) {
                    for (let j = i + 2; j < res.length; j++) {
                        if (res[j].typ === VacanceTokenType.MONEY) 
                            res[j].typ = VacanceTokenType.UNDEFINED;
                    }
                }
            }
            break;
        }
        for (let i = 1; i < res.length; i++) {
            let it = res[i];
            if (it.typ !== VacanceTokenType.UNDEFINED) 
                continue;
            if (!res[i - 1].isSkill) 
                continue;
            for (let j = i + 1; (j < res.length) && (j < (i + 2)); j++) {
                if (res[j].isSkill) {
                    if (res[j].typ === VacanceTokenType.PLUS || res[j].typ === VacanceTokenType.MORAL) 
                        res[i].typ = res[i].typ;
                    else 
                        res[i].typ = VacanceTokenType.SKILL;
                    break;
                }
            }
        }
        for (let i = 0; i < res.length; i++) {
            let it = res[i];
            if (it.isSkill && it.value === null) 
                it._getValue();
            if (it.typ === VacanceTokenType.SKILL || it.typ === VacanceTokenType.MORAL || it.typ === VacanceTokenType.PLUS) {
                for (let j = i + 1; j < res.length; j++) {
                    if (res[j].typ !== it.typ) 
                        break;
                    else {
                        it.endToken = res[j].endToken;
                        res.splice(j, 1);
                        j--;
                    }
                }
                let li = VacanceToken._tryParseSkills(it.beginToken, it.endToken);
                if (li !== null && li.length > 0) {
                    res.splice(i, 1);
                    res.splice(i, 0, ...li);
                }
            }
        }
        return res;
    }
    
    static tryParse(t, prev) {
        if (t === null) 
            return null;
        if (t.isValue2("НА", "ПОСТОЯННУЮ")) {
        }
        let res = new VacanceToken(t, t);
        let skills = 0;
        let dummy = 0;
        let lang = 0;
        let edu = 0;
        let moral = 0;
        let lic = 0;
        let plus = 0;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore && tt !== t) {
                if (MiscHelper.canBeStartOfSentence(tt)) 
                    break;
                if (tt.isHiphen) 
                    break;
                let cr = true;
                let npt = NounPhraseHelper.tryParse(tt.previous, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endChar >= tt.beginChar) 
                    cr = false;
                else if (tt.previous.getMorphClassInDictionary().isNoun && tt.chars.isAllLower) {
                    npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null && npt.morph._case.isGenitive && !npt.morph._case.isNominative) 
                        cr = false;
                }
                else if (tt.previous instanceof NumberToken) {
                    if (tt.isValue("РАЗРЯД", null)) 
                        cr = false;
                }
                if (cr) 
                    break;
            }
            if (tt.isChar(';')) 
                break;
            res.endToken = tt;
            let tok = VacanceToken.M_TERMINS.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) {
                let ty = VacanceTokenType.of(tok.termin.tag);
                if (ty === VacanceTokenType.STOP && tt === res.beginToken) 
                    return null;
                res.endToken = (tt = tok.endToken);
                if (ty === VacanceTokenType.EXPIRED) {
                    res.typ = VacanceTokenType.EXPIRED;
                    continue;
                }
                if (ty === VacanceTokenType.DUMMY) {
                    dummy++;
                    continue;
                }
                if (ty === VacanceTokenType.EDUCATION) {
                    edu++;
                    continue;
                }
                if (ty === VacanceTokenType.LANGUAGE) {
                    lang++;
                    for (let ttt = tt.previous; ttt !== null && ttt.beginChar >= t.beginChar; ttt = ttt.previous) {
                        if ((ttt.isValue("ПЕДАГОГ", null) || ttt.isValue("УЧИТЕЛЬ", null) || ttt.isValue("РЕПЕТИТОР", null)) || ttt.isValue("ПРЕПОДАВАТЕЛЬ", null)) {
                            lang--;
                            break;
                        }
                    }
                    continue;
                }
                if (ty === VacanceTokenType.MORAL) {
                    moral++;
                    continue;
                }
                if (ty === VacanceTokenType.PLUS) {
                    plus++;
                    continue;
                }
                if (ty === VacanceTokenType.LICENSE) {
                    lic++;
                    let ttt = tok.beginToken.previous;
                    if (ttt !== null) {
                        if (ttt.isValue("ОФОРМЛЯТЬ", null) || ttt.isValue("ОФОРМИТЬ", null) || ttt.isValue("ОФОРМЛЕНИЕ", null)) 
                            lic--;
                    }
                    continue;
                }
                if (ty === VacanceTokenType.SKILL) {
                    if (tok.termin.tag2 !== null && (tok.beginChar - res.beginChar) > 3) 
                        continue;
                    skills++;
                    if (tt.isValue("ОПЫТ", null) || tt.isValue("СТАЖ", null)) {
                        if (res._tryParseExp()) 
                            tt = res.endToken;
                        else if (prev !== null && prev.typ === VacanceTokenType.PLUS) {
                            skills--;
                            plus++;
                        }
                    }
                    continue;
                }
                if (ty === VacanceTokenType.EXPIERENCE) {
                    if (res._tryParseExp()) 
                        tt = res.endToken;
                    else 
                        skills++;
                    continue;
                }
                if (ty === VacanceTokenType.MONEY) {
                    if (res._tryParseMoney()) 
                        tt = res.endToken;
                    continue;
                }
                if (ty === VacanceTokenType.DRIVING) {
                    if (res._tryParseDriving()) {
                        tt = res.endToken;
                        break;
                    }
                    else 
                        lic++;
                }
                continue;
            }
            let r = tt.getReferent();
            if (r instanceof DateReferent) {
                let dd = Utils.as(r, DateReferent);
                if (dd.year > 0 && dd.month > 0 && dd.day > 0) 
                    res.refs.push(dd);
            }
            else if (r instanceof UriReferent) 
                dummy++;
            else if (r !== null && !res.refs.includes(r)) {
                if ((r instanceof MoneyReferent) && (((t.beginChar - res.beginChar)) < 10)) {
                    if (res._tryParseMoney()) {
                        t = res.endToken;
                        continue;
                    }
                }
                res.refs.push(r);
            }
        }
        if (res.typ === VacanceTokenType.UNDEFINED) {
            if (dummy > 0) 
                res.typ = VacanceTokenType.DUMMY;
            else if (lang > 0) 
                res.typ = VacanceTokenType.LANGUAGE;
            else if (edu > 0) {
                res.typ = VacanceTokenType.EDUCATION;
                res._tryParseEducation();
            }
            else if (res.refs.length > 0 && (res.refs[0] instanceof DateReferent)) 
                res.typ = VacanceTokenType.DATE;
            else if (moral > 0) 
                res.typ = VacanceTokenType.MORAL;
            else if (lic > 0) 
                res.typ = VacanceTokenType.LICENSE;
            else if (plus > 0) 
                res.typ = VacanceTokenType.PLUS;
            else if (skills > 0) 
                res.typ = VacanceTokenType.SKILL;
        }
        return res;
    }
    
    _getValue() {
        let t0 = this.beginToken;
        let t1 = this.endToken;
        for (let t = t0; t !== null && (t.endChar < this.endChar); t = t.next) {
            if ((t instanceof TextToken) && t.lengthChar === 1 && !t.chars.isLetter) 
                t0 = t.next;
            else if (t.isValue("ИМЕТЬ", null) || t.isValue("ВЛАДЕТЬ", null) || t.isValue("ЕСТЬ", null)) 
                t0 = t.next;
            else if (t.isValue2("У", "ВАС") && t.next.next !== null && t.next.next.isValue("ЕСТЬ", null)) {
                t = t.next.next.next;
                t0 = t.next;
            }
            else {
                let tok = VacanceToken.M_TERMINS.tryParse(t, TerminParseAttr.NO);
                if (tok !== null && tok.termin.tag2 !== null) {
                    t = tok.endToken;
                    t0 = t.next;
                    continue;
                }
                break;
            }
        }
        if (t1.isCharOf(".;:,") || t1.isHiphen) 
            t1 = t1.previous;
        if (this.typ === VacanceTokenType.NAME) {
            for (let t = t0.next; t !== null && (t.endChar < this.endChar); t = t.next) {
                if (t.isCharOf("(,") && t.next !== null) {
                    if ((t.next.getReferent() !== null || t.next.isValue("М", null) || t.next.isValue("СТ", null)) || t.next.isValue("СТАНЦИЯ", null) || t.next.chars.isCapitalUpper) 
                        t1 = t.previous;
                    break;
                }
            }
        }
        else 
            for (let t = t1; t !== null && t.beginChar > t0.beginChar; t = t.previous) {
                let tok = VacanceToken.M_TERMINS.tryParse(t, TerminParseAttr.NO);
                if (tok !== null && tok.termin.tag2 !== null && tok.endToken === t1) {
                    t1 = t.previous;
                    let ty = VacanceTokenType.of(tok.termin.tag);
                    if (ty === VacanceTokenType.PLUS && this.typ === VacanceTokenType.SKILL) 
                        this.typ = VacanceTokenType.PLUS;
                    for (; t1 !== null && t1 !== t0; t1 = t1.previous) {
                        if (t1.isValue("БЫТЬ", null) || t1.isValue("ЯВЛЯТЬСЯ", null)) {
                        }
                        else 
                            break;
                    }
                    break;
                }
            }
        let attr = (GetTextAttr.KEEPREGISTER.value()) | (GetTextAttr.KEEPQUOTES.value());
        if (this.typ === VacanceTokenType.MORAL) {
            let tok1 = VacanceToken.M_TERMINS.tryParse(t0, TerminParseAttr.NO);
            if (tok1 !== null && tok1.termin.tag2 === null && (VacanceTokenType.of(tok1.termin.tag)) === this.typ) {
                this.value = tok1.termin.canonicText.toLowerCase();
                if (tok1.endChar < t1.endChar) 
                    this.value = (this.value + " " + MiscHelper.getTextValue(tok1.endToken.next, t1, GetTextAttr.of(attr)));
            }
        }
        if (this.value === null) {
            if (t0.isValue("ПРАВО", null)) {
            }
            else 
                (attr) |= (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value());
            this.value = MiscHelper.getTextValue(t0, t1, GetTextAttr.of(attr));
        }
        if (!Utils.isNullOrEmpty(this.value) && !t0.chars.isAllUpper && Utils.isLowerCase(this.value[0])) 
            this.value = (this.value[0].toUpperCase() + this.value.substring(1));
    }
    
    _tryParseExp() {
        let t = this.endToken.next;
        for (; t !== null; t = t.next) {
            if (t.isValue("РАБОТА", null) || t.isHiphen || t.isChar(':')) {
            }
            else 
                break;
        }
        if (t === null) 
            return false;
        if (t.isValue2("НЕ", "ТРЕБОВАТЬСЯ")) {
            this.endToken = t.next;
            this.typ = VacanceTokenType.EXPIERENCE;
            this.value = "0";
            return true;
        }
        let uni = NumbersWithUnitToken.tryParse(t, null, NumberWithUnitParseAttr.NO);
        if (uni === null) 
            return false;
        if (uni.units.length !== 1 || uni.units[0].unit === null || uni.units[0].unit.kind !== MeasureKind.TIME) 
            return false;
        this.endToken = uni.endToken;
        this.typ = VacanceTokenType.EXPIERENCE;
        if (uni.singleVal !== null) 
            this.value = NumberHelper.doubleToString(uni.singleVal);
        else if (uni.fromVal !== null) {
            this.value = NumberHelper.doubleToString(uni.fromVal);
            if (uni.toVal !== null) 
                this.value = (this.value + "-" + ((this.value = NumberHelper.doubleToString(uni.toVal))));
        }
        else if (uni.toVal !== null) 
            this.value = NumberHelper.doubleToString(uni.toVal);
        return true;
    }
    
    _tryParseMoney() {
        for (let t = this.beginToken; t !== null; t = t.next) {
            let m = Utils.as(t.getReferent(), MoneyReferent);
            if (m !== null) {
                if (t.endChar > this.endChar) 
                    this.endToken = t;
                if (!this.refs.includes(m)) 
                    this.refs.push(m);
                this.typ = VacanceTokenType.MONEY;
                if (t.next !== null && ((t.next.isHiphen || t.next.isValue("ДО", null)))) {
                    if (t.next.next !== null && (t.next.next.getReferent() instanceof MoneyReferent)) {
                        if (t.next.next.endChar > this.endToken.endChar) {
                            this.endToken = t.next.next;
                            this.refs.push(this.endToken.getReferent());
                        }
                    }
                }
                return true;
            }
            if (t.isNewlineBefore && t !== this.beginToken) 
                break;
            if ((t.beginChar - this.beginChar) > 20) 
                break;
        }
        return false;
    }
    
    _tryParseDriving() {
        for (let t = this.endToken.next; t !== null; t = t.next) {
            if ((t.isHiphen || t.isCharOf(":.") || t.isValue("КАТЕГОРИЯ", null)) || t.isValue("КАТ", null)) 
                continue;
            if ((t instanceof TextToken) && t.lengthChar <= 3 && t.chars.isLetter) {
                this.typ = VacanceTokenType.DRIVING;
                this.value = t.term;
                this.endToken = t;
                for (t = t.next; t !== null; t = t.next) {
                    if (t.isChar('.') || t.isCommaAnd) 
                        continue;
                    else if (t.lengthChar === 1 && t.chars.isAllUpper && t.chars.isLetter) {
                        this.value = (this.value + t.term);
                        this.endToken = t;
                    }
                    else 
                        break;
                }
                this.value = Utils.replaceString(Utils.replaceString(Utils.replaceString(this.value, "А", "A"), "В", "B"), "С", "C");
                return true;
            }
            break;
        }
        return false;
    }
    
    _tryParseEducation() {
        let hi = false;
        let middl = false;
        let prof = false;
        let spec = false;
        let tech = false;
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            if (t.isValue("СРЕДНИЙ", null) || t.isValue("СРЕДНЕ", null) || t.isValue("СРЕДН", null)) 
                middl = true;
            else if (t.isValue("ВЫСШИЙ", null) || t.isValue("ВЫСШ", null)) 
                hi = true;
            else if (t.isValue("ПРОФЕССИОНАЛЬНЫЙ", null) || t.isValue("ПРОФ", null) || t.isValue("ПРОФИЛЬНЫЙ", null)) 
                prof = true;
            else if ((t.isValue("СПЕЦИАЛЬНЫЙ", null) || t.isValue("СПЕЦ", null) || t.isValue2("ПО", "СПЕЦИАЛЬНОСТЬ")) || t.isValue2("ПО", "НАПРАВЛЕНИЕ")) 
                spec = true;
            else if ((t.isValue("ТЕХНИЧЕСКИЙ", null) || t.isValue("ТЕХ", null) || t.isValue("ТЕХН", null)) || t.isValue("ТЕХНИЧ", null)) 
                tech = true;
        }
        if (!hi && !middl) {
            if (spec || prof || tech) 
                middl = true;
        }
        if (hi || middl) {
            this.value = (hi ? "ВО" : "СО");
            if (spec) 
                this.value += ",спец";
            if (prof) 
                this.value += ",проф";
            if (tech) 
                this.value += ",тех";
            return true;
        }
        this._getValue();
        return false;
    }
    
    static _tryParseSkills(t0, t1) {
        let res = new Array();
        let ski = null;
        let hasVerb = false;
        let ty0 = VacanceTokenType.UNDEFINED;
        for (let t = t0; t !== null && t.endChar <= t1.endChar; t = t.next) {
            let _keyword = false;
            let tok = VacanceToken.M_TERMINS.tryParse(t, TerminParseAttr.NO);
            if (tok === null) {
                let npt1 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null && npt1.endToken !== t) 
                    tok = VacanceToken.M_TERMINS.tryParse(npt1.endToken, TerminParseAttr.NO);
            }
            if (tok !== null) {
                let ty = VacanceTokenType.of(tok.termin.tag);
                if (ty === VacanceTokenType.SKILL || ty === VacanceTokenType.MORAL || ty === VacanceTokenType.PLUS) {
                    _keyword = true;
                    ty0 = ty;
                }
            }
            if (MiscHelper.canBeStartOfSentence(t)) 
                ski = null;
            else if (ski !== null && ski.beginToken !== t && _keyword) {
                if (t.chars.isCapitalUpper) 
                    ski = null;
                else if (t.previous !== null && t.previous.isCommaAnd) {
                    ski.endToken = ski.endToken.previous;
                    ski = null;
                }
            }
            if (ski === null) {
                ski = VacanceToken._new2843(t, t, (ty0 === VacanceTokenType.UNDEFINED ? VacanceTokenType.SKILL : ty0));
                hasVerb = false;
                res.push(ski);
            }
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                ski.endToken = (t = npt.endToken);
                continue;
            }
            let verb = VerbPhraseHelper.tryParse(t, false, false, false);
            if (verb !== null) {
                ski.endToken = (t = verb.endToken);
                hasVerb = true;
                continue;
            }
            if (t.isChar(';')) {
                ski = null;
                continue;
            }
            if (t.isComma) {
            }
            ski.endToken = t;
        }
        for (let i = 0; i < res.length; i++) {
            res[i]._getValue();
            if (res[i].lengthChar < 5) {
                res.splice(i, 1);
                i--;
            }
        }
        return res;
    }
    
    static initialize() {
        if (VacanceToken.M_TERMINS !== null) 
            return;
        VacanceToken.M_TERMINS = new TerminCollection();
        let t = null;
        t = Termin._new170("ЗАРАБОТНАЯ ПЛАТА", VacanceTokenType.MONEY);
        t.addAbridge("З/П");
        VacanceToken.M_TERMINS.add(t);
        t = Termin._new170("ОПЫТ РАБОТЫ", VacanceTokenType.EXPIERENCE);
        t.addVariant("СТАЖ РАБОТЫ", false);
        t.addVariant("РАБОЧИЙ СТАЖ", false);
        VacanceToken.M_TERMINS.add(t);
        t = Termin._new170("ОБРАЗОВАНИЕ", VacanceTokenType.EDUCATION);
        VacanceToken.M_TERMINS.add(t);
        for (const s of ["АНГЛИЙСКИЙ", "НЕМЕЦКИЙ", "ФРАНЦУЗСКИЙ", "ИТАЛЬЯНСКИЙ", "ИСПАНСКИЙ", "КИТАЙСКИЙ"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.LANGUAGE));
        }
        for (const s of ["ВОДИТЕЛЬСКИЕ ПРАВА", "ПРАВА КАТЕГОРИИ", "ВОДИТЕЛЬСКОЕ УДОСТОВЕРЕНИЕ", "УДОСТОВЕРЕНИЕ ВОДИТЕЛЯ", "ПРАВА ВОДИТЕЛЯ"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.DRIVING));
        }
        for (const s of ["УДОСТОВЕРЕНИЕ", "ВОДИТЕЛЬСКАЯ МЕДСПРАВКА", "ВОДИТЕЛЬСКАЯ МЕД.СПРАВКА", "ВОЕННЫЙ БИЛЕТ", "МЕДИЦИНСКАЯ КНИЖКА", "МЕДКНИЖКА", "МЕД.КНИЖКА", "АТТЕСТАТ", "АТТЕСТАЦИЯ", "СЕРТИФИКАТ", "ДОПУСК", "ГРУППА ДОПУСКА"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.LICENSE));
        }
        for (const s of ["ЖЕЛАНИЕ;ЖЕЛАТЬ", "ЖЕЛАНИЕ И СПОСОБНОСТЬ", "ГОТОВНОСТЬ К;ГОТОВЫЙ К", "ДОБРОСОВЕСТНОСТЬ;ДОБРОСОВЕСТНЫЙ", "ГИБКОСТЬ", "РАБОТА В КОМАНДЕ;УМЕНИЕ РАБОТАТЬ В КОМАНДЕ", "ОБЩИТЕЛЬНОСТЬ;ОБЩИТЕЛЬНЫЙ;УМЕНИЕ ОБЩАТЬСЯ С ЛЮДЬМИ;УМЕНИЕ ОБЩАТЬСЯ;КОНТАКТ С ЛЮДЬМИ", "ОТВЕТСТВЕННОСТЬ;ОТВЕТСТВЕННЫЙ", "АКТИВНАЯ ЖИЗНЕННАЯ ПОЗИЦИЯ", "КОММУНИКАБЕЛЬНОСТЬ;КОММУНИКАБЕЛЬНЫЙ", "ЛОЯЛЬНОСТЬ;ЛОЯЛЬНЫЙ", "ИСПОЛНИТЕЛЬНОСТЬ;ИСПОЛНИТЕЛЬНЫЙ", "РЕЗУЛЬТАТИВНОСТЬ;РЕЗУЛЬТАТИВНЫЙ", "ПУНКТУАЛЬНОСТЬ;ПУНКТУАЛЬНЫЙ", "ДИСЦИПЛИНИРОВАННОСТЬ;ДИСЦИПЛИНИРОВАННЫЙ", "ТРУДОЛЮБИЕ;ТРУДОЛЮБИВЫЙ", "ЦЕЛЕУСТРЕМЛЕННОСТЬ;ЦЕЛЕУСТРЕМЛЕННЫЙ", "РАБОТОСПОСОБНОСТЬ;РАБОТОСПОСОБНЫЙ", "ОПРЯТНОСТЬ;ОПРЯТНЫЙ", "ВЕЖЛИВОСТЬ;ВЕЖЛИВЫЙ", "ВЫНОСЛИВОСТЬ;ВЫНОСЛИВЫЙ", "АКТИВНОСТЬ;АКТИВНЫЙ", "ОБУЧАЕМОСТЬ;ОБУЧАЕМЫЙ;СПОСОБНОСТЬ К ОБУЧЕНИЮ;ЛЕГКО ОБУЧАЕМЫЙ;ЛЕГКООБУЧАЕМЫЙ;БЫСТРО ОБУЧАТЬСЯ", "ОБРАЗОВАННОСТЬ", "ОТЛИЧНОЕ НАСТРОЕНИЕ", "ХОРОШЕЕ НАСТРОЕНИЕ", "ГРАМОТНАЯ РЕЧЬ", "ГРАМОТНОЕ ПИСЬМО", "ГРАМОТНОЕ ПИСЬМО И РЕЧЬ", "НАЦЕЛЕННОСТЬ НА РЕЗУЛЬТАТ;НАЦЕЛЕННЫЙ НА РЕЗУЛЬТАТ", "ОПТИМИЗМ;ОПТИМИСТИЧНЫЙ", "КОММУНИКАБЕЛЬНОСТЬ;КОММУНИКАБЕЛЬНЫЙ", "ПРИВЕТЛИВОСТЬ;ПРИВЕТЛИВЫЙ", "ЖЕЛАНИЕ РАБОТАТЬ;ЖЕЛАТЬ РАБОТАТЬ", "ЖЕЛАНИЕ ЗАРАБАТЫВАТЬ;ЖЕЛАТЬ ЗАРАБАТЫВАТЬ", "ОБЯЗАТЕЛЬНОСТЬ", "ПУНКТУАЛЬНОСТЬ;ПУНКТУАЛЬНЫЙ", "ГРАМОТНОСТЬ", "ИНИЦИАТИВНОСТЬ;ИНИЦИАТИВНЫЙ", "ОРГАНИЗОВАННОСТЬ", "АККУРАТНОСТЬ;АККУРАТНЫЙ", "ВНИМАТЕЛЬНОСТЬ;ВНИМАТЕЛЬНЫЙ", "ДИСЦИПЛИНИРОВАННОСТЬ;ДИСЦИПЛИНИРОВАННЫЙ;ПОВЫШЕННЫЕ ТРЕБОВАНИЯ К ДИСЦИПЛИНЕ", "БЕЗ ВРЕДНЫХ ПРИВЫЧЕК;ОТСУТСТВИЕ ВРЕДНЫХ ПРИВЫЧЕК;ВРЕДНЫЕ ПРИВЫЧКИ ОТСУТСТВУЮТ"]) {
            let pp = Utils.splitString(s, ';', false);
            let te = Termin._new170(pp[0], VacanceTokenType.MORAL);
            for (let ii = 1; ii < pp.length; ii++) {
                te.addVariant(pp[ii], false);
            }
            VacanceToken.M_TERMINS.add(te);
        }
        for (const s of ["ОПЫТ", "ЗНАНИЕ", "ВЛАДЕНИЕ", "НАВЫК", "УМЕНИЕ", "ПОНИМАНИЕ", "ОРГАНИЗАТОРСКИЕ НАВЫКИ", "ОРГАНИЗАТОРСКИЕ СПОСОБНОСТИ", "ПОЛЬЗОВАТЕЛЬ ПК"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.SKILL));
        }
        for (const s of ["НУЖНО", "НЕОБХОДИМО", "ТРЕБОВАТЬСЯ", "НАЛИЧИЕ", "ДЛЯ РАБОТЫ ТРЕБУЕТСЯ", "ОБЯЗАТЕЛЬНО", "ОБЯЗАТЕЛЕН"]) {
            VacanceToken.M_TERMINS.add(Termin._new349(s, VacanceTokenType.SKILL, true));
        }
        for (const s of ["ЖЕЛАТЕЛЬНО", "ПРИВЕТСТВОВАТЬСЯ", "ЯВЛЯТЬСЯ ПРЕИМУЩЕСТВОМ", "КАК ПЛЮС", "БУДЕТ ПРЕИМУЩЕСТВОМ", "БУДЕТ ЯВЛЯТЬСЯ ПРЕИМУЩЕСТВОМ", "МЫ ЦЕНИМ"]) {
            VacanceToken.M_TERMINS.add(Termin._new2853(s, VacanceTokenType.PLUS, true, true));
        }
        for (const s of ["НЕЗАМЕНИМЫЙ ОПЫТ", "ОСТАВИТЬ ОТЗЫВ", "КЛЮЧЕВЫЕ НАВЫКИ", "ПОЛНАЯ ЗАНЯТОСТЬ", "КОРПОРАТИВНЫЕ ЗАНЯТИЯ", "КОМПЕНСАЦИЯ", "ОПЛАТА БОЛЬНИЧНЫХ", "ПРЕМИЯ", "ВОЗМОЖНОСТЬ ПОЛУЧИТЬ", "УСЛОВИЯ ДЛЯ", "СПЕЦИАЛЬНЫЕ НАВЫКИ И ЗНАНИЯ", "ПРОГРАММА ЛОЯЛЬНОСТИ", "СИСТЕМА ЛОЯЛЬНОСТИ", "КОРПОРАТИВНЫЙ", "ИНТЕРЕСНАЯ РАБОТА", "НА ПОСТОЯННУЮ РАБОТУ", "ПРОФСОЮЗ"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.DUMMY));
        }
        for (const s of ["ВАКАНСИЯ В АРХИВЕ", "В АРХИВЕ С"]) {
            VacanceToken.M_TERMINS.add(Termin._new170(s, VacanceTokenType.EXPIRED));
        }
    }
    
    static _new2843(_arg1, _arg2, _arg3) {
        let res = new VacanceToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static static_constructor() {
        VacanceToken.M_TERMINS = null;
    }
}


VacanceToken.static_constructor();

module.exports = VacanceToken