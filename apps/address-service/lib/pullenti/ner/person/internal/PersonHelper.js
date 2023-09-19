/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentToken = require("./../../ReferentToken");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const GetTextAttr = require("./../../core/GetTextAttr");
const PersonIdentityReferent = require("./../PersonIdentityReferent");
const PersonItemTokenParseAttr = require("./PersonItemTokenParseAttr");
const MailLineTypes = require("./../../mail/internal/MailLineTypes");
const MorphCase = require("./../../../morph/MorphCase");
const TextToken = require("./../../TextToken");
const PersonReferent = require("./../PersonReferent");
const NumberExType = require("./../../core/NumberExType");
const NumberToken = require("./../../NumberToken");
const PersonPropertyReferent = require("./../PersonPropertyReferent");
const MetaToken = require("./../../MetaToken");
const MiscHelper = require("./../../core/MiscHelper");
const BracketHelper = require("./../../core/BracketHelper");
const NumberHelper = require("./../../core/NumberHelper");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphGender = require("./../../../morph/MorphGender");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphCollection = require("./../../MorphCollection");
const PersonAttrTerminType = require("./PersonAttrTerminType");
const Referent = require("./../../Referent");
const MailLine = require("./../../mail/internal/MailLine");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");
const Token = require("./../../Token");
const PersonAnalyzer = require("./../PersonAnalyzer");
const PersonAttrToken = require("./PersonAttrToken");
const PersonItemToken = require("./PersonItemToken");

class PersonHelper {
    
    static createReferentToken(p, begin, end, _morph, attrs, forAttribute, afterBePredicate) {
        const PersonIdentityToken = require("./PersonIdentityToken");
        if (p === null) 
            return null;
        let begin1 = begin;
        let hasPrefix = false;
        let hasSlash = false;
        if (attrs !== null) {
            for (const a of attrs) {
                if (a.endToken.next !== null && a.endToken.next.isCharOf("\\/")) 
                    hasSlash = true;
                if (a.typ === PersonAttrTerminType.BESTREGARDS) 
                    hasPrefix = true;
                else {
                    if (a.beginChar < begin.beginChar) {
                        begin = a.beginToken;
                        if ((a.endToken.next !== null && a.endToken.next.isChar(')') && begin.previous !== null) && begin.previous.isChar('(')) 
                            begin = begin.previous;
                    }
                    if (a.typ !== PersonAttrTerminType.PREFIX) {
                        if (a.age !== null) 
                            p.addSlot(PersonReferent.ATTR_AGE, a.age, false, 0);
                        if (a.propRef === null) 
                            p.addSlot(PersonReferent.ATTR_ATTR, a.value, false, 0);
                        else 
                            p.addSlot(PersonReferent.ATTR_ATTR, a, false, 0);
                    }
                    else if (a.gender === MorphGender.FEMINIE && !p.isFemale) 
                        p.isFemale = true;
                    else if (a.gender === MorphGender.MASCULINE && !p.isMale) 
                        p.isMale = true;
                }
            }
        }
        else if ((begin.previous instanceof TextToken) && (begin.whitespacesBeforeCount < 3)) {
            if (begin.previous.term === "ИП") {
                let a = new PersonAttrToken(begin.previous, begin.previous);
                a.propRef = new PersonPropertyReferent();
                a.propRef.name = "индивидуальный предприниматель";
                p.addSlot(PersonReferent.ATTR_ATTR, a, false, 0);
                begin = begin.previous;
            }
        }
        let m0 = new MorphCollection();
        for (const it of _morph.items) {
            let bi = new MorphBaseInfo();
            bi.copyFrom(it);
            bi.number = MorphNumber.SINGULAR;
            if (bi.gender === MorphGender.UNDEFINED) {
                if (p.isMale && !p.isFemale) 
                    bi.gender = MorphGender.MASCULINE;
                if (!p.isMale && p.isFemale) 
                    bi.gender = MorphGender.FEMINIE;
            }
            m0.addItem(bi);
        }
        _morph = m0;
        if ((attrs !== null && attrs.length > 0 && !attrs[0].morph._case.isUndefined) && _morph._case.isUndefined) {
            _morph._case = attrs[0].morph._case;
            if (attrs[0].morph.number === MorphNumber.SINGULAR) 
                _morph.number = MorphNumber.SINGULAR;
            if (p.isMale && !p.isFemale) 
                _morph.gender = MorphGender.MASCULINE;
            else if (p.isFemale) 
                _morph.gender = MorphGender.FEMINIE;
        }
        if (begin.previous !== null) {
            let ttt = begin.previous;
            if (ttt.isValue("ИМЕНИ", "ІМЕНІ")) 
                forAttribute = true;
            else {
                if (ttt.isChar('.') && ttt.previous !== null) 
                    ttt = ttt.previous;
                if (ttt.whitespacesAfterCount < 3) {
                    if (ttt.isValue("ИМ", "ІМ")) 
                        forAttribute = true;
                }
            }
        }
        if (forAttribute) 
            return ReferentToken._new2564(p, begin, end, _morph, p.m_PersonIdentityTyp.value());
        if ((begin.previous !== null && begin.previous.isCommaAnd && (begin.previous.previous instanceof ReferentToken)) && (begin.previous.previous.getReferent() instanceof PersonReferent)) {
            let rt00 = Utils.as(begin.previous.previous, ReferentToken);
            for (let ttt = rt00; ttt !== null; ) {
                if (ttt.previous === null || !(ttt.previous.previous instanceof ReferentToken)) 
                    break;
                if (!ttt.previous.isCommaAnd || !(ttt.previous.previous.getReferent() instanceof PersonReferent)) 
                    break;
                rt00 = Utils.as(ttt.previous.previous, ReferentToken);
                ttt = rt00;
            }
            if (rt00.beginToken.getReferent() instanceof PersonPropertyReferent) {
                let ok = false;
                let tt1 = rt00.beginToken.endToken.next;
                if (rt00.beginToken.morph.number === MorphNumber.PLURAL) 
                    ok = true;
                if (tt1 !== null && ((tt1.isChar(':') || ((tt1.isHiphen && p.findSlot(PersonReferent.ATTR_ATTR, null, true) === null))))) 
                    ok = true;
                if (ok) 
                    p.addSlot(PersonReferent.ATTR_ATTR, rt00.beginToken.getReferent(), false, 0);
            }
        }
        if ((begin === end && (end.next instanceof TextToken) && end.next.lengthChar === 2) && end.next.chars.isAllUpper && (end.whitespacesAfterCount < 3)) {
            let nam = p.getStringValue(PersonReferent.ATTR_FIRSTNAME);
            let sec = p.getStringValue(PersonReferent.ATTR_MIDDLENAME);
            if (nam !== null && sec !== null) {
                if (end.next.term === (nam[0] + sec[0])) 
                    end = end.next;
            }
        }
        let ad = PersonAnalyzer.getData(begin);
        if (ad.level > 3) 
            return ReferentToken._new2564(p, begin, end, _morph, p.m_PersonIdentityTyp.value());
        ad.level++;
        let attrs1 = null;
        let hasPosition = false;
        let openBr = false;
        for (let t = end.next; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            if (t.isNewlineBefore) {
                if (t.newlinesBeforeCount > 2) 
                    break;
                if (attrs1 !== null && attrs1.length > 0) 
                    break;
                let ml = MailLine.parse(t, 0, 0);
                if (ml !== null && ml.typ === MailLineTypes.FROM) 
                    break;
                if (t.chars.isCapitalUpper) {
                    let attr1 = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    let ok1 = false;
                    if (attr1 !== null) {
                        if (hasPrefix || attr1.isNewlineAfter || ((attr1.endToken.next !== null && attr1.endToken.next.isTableControlChar))) 
                            ok1 = true;
                        else 
                            for (let tt2 = t.next; tt2 !== null && tt2.endChar <= attr1.endChar; tt2 = tt2.next) {
                                if (tt2.isWhitespaceBefore) 
                                    ok1 = true;
                            }
                    }
                    else {
                        let ttt = PersonHelper.correctTailAttributes(p, t);
                        if (ttt !== null && ttt !== t) {
                            end = (t = ttt);
                            continue;
                        }
                    }
                    if (!ok1) 
                        break;
                }
            }
            if (t.isHiphen || t.isCharOf("_>|")) 
                continue;
            if (t.isCharOf("\\/")) {
                if (hasSlash) 
                    end = t;
                if (t.whitespacesAfterCount > 2) 
                    break;
                continue;
            }
            if (t.isValue("МОДЕЛЬ", null)) 
                break;
            let cou1 = p.slots.length;
            let tt = PersonHelper.correctTailAttributes(p, t);
            if (tt !== null && ((tt !== t || p.slots.length !== cou1))) {
                end = (t = tt);
                continue;
            }
            let isBe = false;
            if (t.isChar('(') && t === end.next) {
                openBr = true;
                t = t.next;
                if (t === null) 
                    break;
                let pit1 = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.NO, null);
                if ((pit1 !== null && t.chars.isCapitalUpper && pit1.endToken.next !== null) && (t instanceof TextToken) && pit1.endToken.next.isChar(')')) {
                    if (pit1.lastname !== null) {
                        let inf = MorphBaseInfo._new2511(MorphCase.NOMINATIVE);
                        if (p.isMale) 
                            inf.gender = MorphGender.of((inf.gender.value()) | (MorphGender.MASCULINE.value()));
                        if (p.isFemale) 
                            inf.gender = MorphGender.of((inf.gender.value()) | (MorphGender.FEMINIE.value()));
                        let sur = PersonIdentityToken.createLastname(pit1, inf);
                        if (sur !== null) {
                            p.addFioIdentity(sur, null, null);
                            end = (t = pit1.endToken.next);
                            continue;
                        }
                    }
                }
                if ((t instanceof TextToken) && t.chars.isLatinLetter) {
                    let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.CANBELATIN, 10);
                    if (((pits !== null && pits.length >= 2 && pits.length <= 3) && pits[0].chars.isLatinLetter && pits[1].chars.isLatinLetter) && pits[pits.length - 1].endToken.next !== null && pits[pits.length - 1].endToken.next.isChar(')')) {
                        let pr2 = new PersonReferent();
                        let cou = 0;
                        for (const pi of pits) {
                            for (const si of p.slots) {
                                if (si.typeName === PersonReferent.ATTR_FIRSTNAME || si.typeName === PersonReferent.ATTR_MIDDLENAME || si.typeName === PersonReferent.ATTR_LASTNAME) {
                                    if (MiscHelper.canBeEqualCyrAndLatSS(si.value.toString(), pi.value)) {
                                        cou++;
                                        pr2.addSlot(si.typeName, pi.value, false, 0);
                                        break;
                                    }
                                }
                            }
                        }
                        if (cou === pits.length) {
                            for (const si of pr2.slots) {
                                p.addSlot(si.typeName, si.value, false, 0);
                            }
                            end = (t = pits[pits.length - 1].endToken.next);
                            continue;
                        }
                    }
                }
            }
            else if (t.isComma) {
                t = t.next;
                if ((t instanceof TextToken) && t.isValue("WHO", null)) 
                    continue;
                if ((t instanceof TextToken) && t.chars.isLatinLetter) {
                    let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.CANBELATIN, 10);
                    if ((pits !== null && pits.length >= 2 && pits.length <= 3) && pits[0].chars.isLatinLetter && pits[1].chars.isLatinLetter) {
                        let pr2 = new PersonReferent();
                        let cou = 0;
                        for (const pi of pits) {
                            for (const si of p.slots) {
                                if (si.typeName === PersonReferent.ATTR_FIRSTNAME || si.typeName === PersonReferent.ATTR_MIDDLENAME || si.typeName === PersonReferent.ATTR_LASTNAME) {
                                    if (MiscHelper.canBeEqualCyrAndLatSS(si.value.toString(), pi.value)) {
                                        cou++;
                                        pr2.addSlot(si.typeName, pi.value, false, 0);
                                        break;
                                    }
                                }
                            }
                        }
                        if (cou === pits.length) {
                            for (const si of pr2.slots) {
                                p.addSlot(si.typeName, si.value, false, 0);
                            }
                            end = (t = pits[pits.length - 1].endToken);
                            continue;
                        }
                    }
                }
            }
            else if ((t instanceof TextToken) && t.isVerbBe) 
                t = t.next;
            else if (t.isAnd && t.isWhitespaceAfter && !t.isNewlineAfter) {
                if (t === end.next) 
                    break;
                t = t.next;
            }
            else if (t.isHiphen && t === end.next) 
                t = t.next;
            else if (t.isChar('.') && t === end.next && hasPrefix) 
                t = t.next;
            let ttt2 = PersonHelper.createNickname(p, t);
            if (ttt2 !== null) {
                t = (end = ttt2);
                continue;
            }
            if (t === null) 
                break;
            let attr = null;
            attr = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if (attr === null) {
                if ((t !== null && t.getReferent() !== null && t.getReferent().typeName === "GEO") && attrs1 !== null && openBr) 
                    continue;
                if ((t.chars.isCapitalUpper && openBr && t.next !== null) && t.next.isChar(')')) {
                    if (p.findSlot(PersonReferent.ATTR_LASTNAME, null, true) === null) {
                        p.addSlot(PersonReferent.ATTR_LASTNAME, t.getSourceText().toUpperCase(), false, 0);
                        t = t.next;
                        end = t;
                    }
                }
                if (t !== null && t.isValue("КОТОРЫЙ", null) && t.morph.number === MorphNumber.SINGULAR) {
                    if (!p.isFemale && !p.isMale && t.morph.gender === MorphGender.FEMINIE) {
                        p.isFemale = true;
                        p.correctData();
                    }
                    else if (!p.isMale && !p.isFemale && t.morph.gender === MorphGender.MASCULINE) {
                        p.isMale = true;
                        p.correctData();
                    }
                }
                break;
            }
            if (attr.morph.number === MorphNumber.PLURAL) 
                break;
            if (attr.typ === PersonAttrTerminType.BESTREGARDS) 
                break;
            if (attr.isDoubt) {
                if (hasPrefix) {
                }
                else if (t.isNewlineBefore && attr.isNewlineAfter) {
                }
                else if (t.previous !== null && ((t.previous.isHiphen || t.previous.isChar(':')))) {
                }
                else 
                    break;
            }
            if ((MorphCase.ooBitand(_morph._case, attr.morph._case)).isUndefined && !isBe) {
                if (attr.morph._case.isUndefined || attr.morph._case.isNominative) {
                }
                else if (attr.morph._case.isInstrumental && (t.previous instanceof TextToken) && t.previous.isVerbBe) {
                }
                else if ((t.previous !== null && t.previous.isCommaAnd && attrs1 !== null) && t.previous.previous === attrs1[attrs1.length - 1].endToken) {
                }
                else 
                    break;
            }
            if (openBr) {
                if (PersonAnalyzer.tryAttachPerson(t, false, 0, true) !== null) 
                    break;
            }
            if (attrs1 === null) {
                if (t.previous.isComma && t.previous === end.next) {
                    let ttt = attr.endToken.next;
                    if (ttt !== null) {
                        if (ttt.morph._class.isVerb) {
                            if (MiscHelper.canBeStartOfSentence(begin)) {
                            }
                            else 
                                break;
                        }
                    }
                }
                attrs1 = new Array();
            }
            attrs1.push(attr);
            if (attr.typ === PersonAttrTerminType.POSITION || attr.typ === PersonAttrTerminType.KING) {
                if (!isBe) 
                    hasPosition = true;
            }
            else if (attr.typ !== PersonAttrTerminType.PREFIX) {
                if (attr.typ === PersonAttrTerminType.OTHER && attr.age !== null) {
                }
                else {
                    attrs1 = null;
                    break;
                }
            }
            t = attr.endToken;
        }
        if (attrs1 !== null && hasPosition && attrs !== null) {
            let te1 = attrs[attrs.length - 1].endToken.next;
            let te2 = attrs1[0].beginToken;
            if (te1.whitespacesAfterCount > te2.whitespacesBeforeCount && (te2.whitespacesBeforeCount < 2)) {
            }
            else if (attrs1[0].age !== null) {
            }
            else if (((te1.isHiphen || te1.isChar(':'))) && !attrs1[0].isNewlineBefore && ((te2.previous.isComma || te2.previous === end))) {
            }
            else 
                for (const a of attrs) {
                    if (a.typ === PersonAttrTerminType.POSITION) {
                        let te = attrs1[attrs1.length - 1].endToken;
                        if (te.next !== null) {
                            if (!te.next.isCharOf(".;,")) {
                                attrs1 = null;
                                break;
                            }
                        }
                    }
                }
        }
        if (attrs1 !== null && !hasPrefix) {
            let attr = attrs1[attrs1.length - 1];
            let ok = false;
            if (attr.endToken.next !== null && attr.endToken.next.chars.isCapitalUpper) 
                ok = true;
            else {
                let rt = PersonAnalyzer.tryAttachPerson(attr.beginToken, false, -1, false);
                if (rt !== null && (rt.referent instanceof PersonReferent)) 
                    ok = true;
            }
            if (ok) {
                if (attr.beginToken.whitespacesBeforeCount > attr.endToken.whitespacesAfterCount) 
                    attrs1 = null;
                else if (attr.beginToken.whitespacesBeforeCount === attr.endToken.whitespacesAfterCount) {
                    let rt1 = PersonAnalyzer.tryAttachPerson(attr.beginToken, false, -1, false);
                    if (rt1 !== null) 
                        attrs1 = null;
                }
            }
        }
        if (attrs1 !== null) {
            for (const a of attrs1) {
                if (a.typ !== PersonAttrTerminType.PREFIX) {
                    if (a.age !== null) 
                        p.addSlot(PersonReferent.ATTR_AGE, a.age, true, 0);
                    else if (a.propRef === null) 
                        p.addSlot(PersonReferent.ATTR_ATTR, a.value, false, 0);
                    else 
                        p.addSlot(PersonReferent.ATTR_ATTR, a, false, 0);
                    end = a.endToken;
                    if (a.gender !== MorphGender.UNDEFINED && !p.isFemale && !p.isMale) {
                        if (a.gender === MorphGender.MASCULINE && !p.isMale) {
                            p.isMale = true;
                            p.correctData();
                        }
                        else if (a.gender === MorphGender.FEMINIE && !p.isFemale) {
                            p.isFemale = true;
                            p.correctData();
                        }
                    }
                }
            }
            if (openBr) {
                if (end.next !== null && end.next.isChar(')')) 
                    end = end.next;
            }
        }
        let crlfCou = 0;
        for (let t = end.next; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            if (t.isNewlineBefore) {
                let ml = MailLine.parse(t, 0, 0);
                if (ml !== null && ml.typ === MailLineTypes.FROM) 
                    break;
                crlfCou++;
            }
            if (t.isCharOf(":,(") || t.isHiphen) 
                continue;
            if (t.isChar('.') && t === end.next) 
                continue;
            let r = t.getReferent();
            if (r !== null) {
                if (r.typeName === "PHONE" || r.typeName === "URI" || r.typeName === "ADDRESS") {
                    let ty = r.getStringValue("SCHEME");
                    if (r.typeName === "URI") {
                        if ((ty !== "mailto" && ty !== "skype" && ty !== "ICQ") && ty !== "http") 
                            break;
                    }
                    p.addContact(r);
                    end = t;
                    crlfCou = 0;
                    continue;
                }
            }
            if (r instanceof PersonIdentityReferent) {
                p.addSlot(PersonReferent.ATTR_IDDOC, r, false, 0);
                end = t;
                crlfCou = 0;
                continue;
            }
            if (r !== null && r.typeName === "ORGANIZATION") {
                if (t.next !== null && t.next.morph._class.isVerb) 
                    break;
                if (begin.previous !== null && begin.previous.morph._class.isVerb) 
                    break;
                if (t.previous !== null && t.previous.isCharOf("(,")) {
                }
                else {
                    if (t.newlinesBeforeCount > 2) 
                        break;
                    if (!begin.isNewlineBefore && !begin1.isNewlineBefore) 
                        break;
                }
                let exist = false;
                for (const s of p.slots) {
                    if (s.typeName === PersonReferent.ATTR_ATTR && (s.value instanceof PersonPropertyReferent)) {
                        let pr = Utils.as(s.value, PersonPropertyReferent);
                        if (pr.findSlot(PersonPropertyReferent.ATTR_REF, r, true) !== null) {
                            exist = true;
                            break;
                        }
                    }
                    else if (s.typeName === PersonReferent.ATTR_ATTR && (s.value instanceof PersonAttrToken)) {
                        let pr = Utils.as(s.value, PersonAttrToken);
                        if (pr.referent.findSlot(PersonPropertyReferent.ATTR_REF, r, true) !== null) {
                            exist = true;
                            break;
                        }
                    }
                }
                if (!exist) {
                    let pat = new PersonAttrToken(t, t);
                    pat.propRef = PersonPropertyReferent._new2481("сотрудник");
                    pat.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                    p.addSlot(PersonReferent.ATTR_ATTR, pat, false, 0);
                }
                continue;
            }
            if (r !== null) 
                break;
            if (!hasPrefix || crlfCou >= 2) 
                break;
            let rt = PersonAnalyzer.processReferentStat(t, null);
            if (rt !== null) 
                break;
        }
        ad.level--;
        if (begin.isValue("НА", null) && begin.next !== null && begin.next.isValue("ИМЯ", null)) {
            let t0 = begin.previous;
            if (t0 !== null && t0.isComma) 
                t0 = t0.previous;
            if (t0 !== null && (t0.getReferent() instanceof PersonIdentityReferent)) 
                p.addSlot(PersonReferent.ATTR_IDDOC, t0.getReferent(), false, 0);
        }
        return ReferentToken._new2564(p, begin, end, _morph, p.m_PersonIdentityTyp.value());
    }
    
    static createSex(pr, t) {
        if (t === null) 
            return null;
        while (t.next !== null) {
            if (t.isValue("ПОЛ", null) || t.isHiphen || t.isChar(':')) 
                t = t.next;
            else 
                break;
        }
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let ok = false;
        if ((tt.term === "МУЖ" || tt.term === "МУЖС" || tt.term === "МУЖСК") || tt.isValue("МУЖСКОЙ", null)) {
            pr.isMale = true;
            ok = true;
        }
        else if ((tt.term === "ЖЕН" || tt.term === "ЖЕНС" || tt.term === "ЖЕНСК") || tt.isValue("ЖЕНСКИЙ", null)) {
            pr.isFemale = true;
            ok = true;
        }
        if (!ok) 
            return null;
        while (t.next !== null) {
            if (t.next.isValue("ПОЛ", null) || t.next.isChar('.')) 
                t = t.next;
            else 
                break;
        }
        return t;
    }
    
    static createNickname(pr, t) {
        let hasKeyw = false;
        let isBr = false;
        for (; t !== null; t = t.next) {
            if (t.isHiphen || t.isComma || t.isCharOf(".:;")) 
                continue;
            if (t.morph._class.isPreposition) 
                continue;
            if (t.isChar('(')) {
                isBr = true;
                continue;
            }
            if ((t.isValue("ПРОЗВИЩЕ", "ПРІЗВИСЬКО") || t.isValue("КЛИЧКА", null) || t.isValue("ПСЕВДОНИМ", "ПСЕВДОНІМ")) || t.isValue("ПСЕВДО", null) || t.isValue("ПОЗЫВНОЙ", "ПОЗИВНИЙ")) {
                hasKeyw = true;
                continue;
            }
            break;
        }
        if (!hasKeyw || t === null) 
            return null;
        if (BracketHelper.isBracket(t, true)) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null) {
                let ni = MiscHelper.getTextValue(br.beginToken.next, br.endToken.previous, GetTextAttr.NO);
                if (ni !== null) {
                    pr.addSlot(PersonReferent.ATTR_NICKNAME, ni, false, 0);
                    t = br.endToken;
                    for (let tt = t.next; tt !== null; tt = tt.next) {
                        if (tt.isCommaAnd) 
                            continue;
                        if (!BracketHelper.isBracket(tt, true)) 
                            break;
                        br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                        if (br === null) 
                            break;
                        ni = MiscHelper.getTextValue(br.beginToken.next, br.endToken.previous, GetTextAttr.NO);
                        if (ni !== null) 
                            pr.addSlot(PersonReferent.ATTR_NICKNAME, ni, false, 0);
                        t = (tt = br.endToken);
                    }
                    if (isBr && t.next !== null && t.next.isChar(')')) 
                        t = t.next;
                    return t;
                }
            }
        }
        else {
            let ret = null;
            for (; t !== null; t = t.next) {
                if (t.isCommaAnd) 
                    continue;
                if (ret !== null && t.chars.isAllLower) 
                    break;
                if (t.whitespacesBeforeCount > 2) 
                    break;
                let pli = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.NO, 10);
                if (pli !== null && ((pli.length === 1 || pli.length === 2))) {
                    let ni = MiscHelper.getTextValue(pli[0].beginToken, pli[pli.length - 1].endToken, GetTextAttr.NO);
                    if (ni !== null) {
                        pr.addSlot(PersonReferent.ATTR_NICKNAME, ni, false, 0);
                        t = pli[pli.length - 1].endToken;
                        if (isBr && t.next !== null && t.next.isChar(')')) 
                            t = t.next;
                        ret = t;
                        continue;
                    }
                }
                if ((t instanceof ReferentToken) && !t.chars.isAllLower && t.beginToken === t.endToken) {
                    let val = MiscHelper.getTextValueOfMetaToken(Utils.as(t, ReferentToken), GetTextAttr.NO);
                    pr.addSlot(PersonReferent.ATTR_NICKNAME, val, false, 0);
                    if (isBr && t.next !== null && t.next.isChar(')')) 
                        t = t.next;
                    ret = t;
                    continue;
                }
                break;
            }
            return ret;
        }
        return null;
    }
    
    static isPersonSayOrAttrAfter(t) {
        if (t === null) 
            return false;
        let tt = PersonHelper.correctTailAttributes(null, t);
        if (tt !== null && tt !== t) 
            return true;
        if (t.isComma && t.next !== null) 
            t = t.next;
        if (t.chars.isLatinLetter) {
            if (t.isValue("SAY", null) || t.isValue("ASK", null) || t.isValue("WHO", null)) 
                return true;
        }
        if (t.isChar('.') && (t.next instanceof TextToken) && ((t.next.morph._class.isPronoun || t.next.morph._class.isPersonalPronoun))) {
            if (t.next.morph.gender === MorphGender.FEMINIE || t.next.morph.gender === MorphGender.MASCULINE) 
                return true;
        }
        if (t.isComma && t.next !== null) 
            t = t.next;
        if (PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO) !== null) 
            return true;
        return false;
    }
    
    static correctTailAttributes(p, t0) {
        let res = t0;
        let t = t0;
        if (t !== null && t.isChar(',')) 
            t = t.next;
        let born = false;
        let die = false;
        if (t !== null && ((t.isValue("РОДИТЬСЯ", "НАРОДИТИСЯ") || t.isValue("BORN", null)))) {
            t = t.next;
            born = true;
        }
        else if (t !== null && ((t.isValue("УМЕРЕТЬ", "ПОМЕРТИ") || t.isValue("СКОНЧАТЬСЯ", null) || t.isValue("DIED", null)))) {
            t = t.next;
            die = true;
        }
        else if ((t !== null && t.isValue("ДАТА", null) && t.next !== null) && t.next.isValue("РОЖДЕНИЕ", "НАРОДЖЕННЯ")) {
            t = t.next.next;
            born = true;
        }
        while (t !== null) {
            if (t.morph._class.isPreposition || t.isHiphen || t.isChar(':')) 
                t = t.next;
            else 
                break;
        }
        if (t !== null && t.getReferent() !== null) {
            let r = t.getReferent();
            if (r.typeName === "DATE") {
                let t1 = t;
                if (t.next !== null && ((t.next.isValue("Р", null) || t.next.isValue("РОЖДЕНИЕ", "НАРОДЖЕННЯ")))) {
                    born = true;
                    t1 = t.next;
                    if (t1.next !== null && t1.next.isChar('.')) 
                        t1 = t1.next;
                }
                else if (t.next === null || t.isNewlineAfter || t.next.isComma) {
                    if (t.isNewlineBefore) {
                    }
                    else if (t.previous !== null && ((t.previous.isTableControlChar || t.previous.getMorphClassInDictionary().isPreposition))) {
                    }
                    else {
                        let tt = t.next;
                        if (tt !== null && tt.isComma) 
                            tt = tt.next;
                        if (MiscHelper.checkNumberPrefix(tt) !== null) {
                        }
                        else {
                            let str = r.toStringEx(true, null, 0);
                            let i = str.indexOf(' ');
                            let j = str.lastIndexOf(' ');
                            if (i > 0 && (i < j)) 
                                born = true;
                        }
                    }
                }
                if (born) {
                    if (p !== null) 
                        p.addSlot(PersonReferent.ATTR_BORN, r, false, 0);
                    res = t1;
                    t = t1;
                }
                else if (die) {
                    if (p !== null) 
                        p.addSlot(PersonReferent.ATTR_DIE, r, false, 0);
                    res = t1;
                    t = t1;
                }
            }
        }
        if (die && t !== null) {
            let ag = NumberHelper.tryParseAge(t.next);
            if (ag !== null) {
                if (p !== null) 
                    p.addSlot(PersonReferent.ATTR_AGE, ag.value.toString(), false, 0);
                t = ag.endToken.next;
                res = ag.endToken;
            }
        }
        if (t === null) 
            return res;
        if (t.isChar('(')) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null) {
                let t1 = t.next;
                born = false;
                if (t1.isValue("РОД", null)) {
                    born = true;
                    t1 = t1.next;
                    if (t1 !== null && t1.isChar('.')) 
                        t1 = t1.next;
                }
                if (t1 instanceof ReferentToken) {
                    let r = t1.getReferent();
                    if (r.typeName === "DATERANGE" && t1.next === br.endToken) {
                        let bd = Utils.as(r.getSlotValue("FROM"), Referent);
                        let to = Utils.as(r.getSlotValue("TO"), Referent);
                        if (bd !== null && to !== null) {
                            if (p !== null) {
                                p.addSlot(PersonReferent.ATTR_BORN, bd, false, 0);
                                p.addSlot(PersonReferent.ATTR_DIE, to, false, 0);
                            }
                            t = (res = br.endToken);
                        }
                    }
                    else if (r.typeName === "DATE" && t1.next === br.endToken) {
                        if (p !== null) 
                            p.addSlot(PersonReferent.ATTR_BORN, r, false, 0);
                        t = (res = br.endToken);
                    }
                }
            }
        }
        if (t instanceof NumberToken) {
            let nt = NumberHelper.tryParseNumberWithPostfix(t);
            if (nt !== null && nt.exTyp === NumberExType.YEAR) {
                if (nt.endToken.isNewlineAfter || nt.endToken.next.isCommaAnd) {
                    if (p !== null) 
                        p.addSlot(PersonReferent.ATTR_AGE, nt.value, false, 0);
                    t = (res = nt.endToken);
                }
            }
        }
        return res;
    }
}


module.exports = PersonHelper