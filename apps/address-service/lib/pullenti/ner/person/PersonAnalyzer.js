/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const MorphGender = require("./../../morph/MorphGender");
const BracketHelper = require("./../core/BracketHelper");
const MorphCase = require("./../../morph/MorphCase");
const MorphClass = require("./../../morph/MorphClass");
const MorphNumber = require("./../../morph/MorphNumber");
const PersonItemTokenParseAttr = require("./internal/PersonItemTokenParseAttr");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphologyService = require("./../../morph/MorphologyService");
const Termin = require("./../core/Termin");
const TextToken = require("./../TextToken");
const FioTemplateType = require("./internal/FioTemplateType");
const ProcessorService = require("./../ProcessorService");
const ShortNameHelper = require("./internal/ShortNameHelper");
const GeoReferent = require("./../geo/GeoReferent");
const MorphCollection = require("./../MorphCollection");
const PersonPropertyKind = require("./PersonPropertyKind");
const BracketParseAttr = require("./../core/BracketParseAttr");
const PersonPropertyReferent = require("./PersonPropertyReferent");
const Token = require("./../Token");
const PersonReferent = require("./PersonReferent");
const PersonIdentityReferent = require("./PersonIdentityReferent");
const MetaToken = require("./../MetaToken");
const MailLine = require("./../mail/internal/MailLine");
const MetaPerson = require("./internal/MetaPerson");
const MetaPersonProperty = require("./internal/MetaPersonProperty");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const MetaPersonIdentity = require("./internal/MetaPersonIdentity");
const Analyzer = require("./../Analyzer");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const PersonAttrTerminType = require("./internal/PersonAttrTerminType");
const AnalyzerData = require("./../core/AnalyzerData");
const NumberToken = require("./../NumberToken");
const ReferentToken = require("./../ReferentToken");
const Referent = require("./../Referent");
const MiscHelper = require("./../core/MiscHelper");
const PersonAttrTokenPersonAttrAttachAttrs = require("./internal/PersonAttrTokenPersonAttrAttachAttrs");

/**
 * Анализатор выделения персон и их атрибутов (должности, звания и пр.)
 */
class PersonAnalyzer extends Analyzer {
    
    get name() {
        return PersonAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Персоны";
    }
    
    get description() {
        return "Персоны и их атрибуты";
    }
    
    clone() {
        return new PersonAnalyzer();
    }
    
    get typeSystem() {
        return [MetaPerson.globalMeta, MetaPersonProperty.globalMeta, MetaPersonIdentity.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaPerson.MAN_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("man.png"));
        res.put(MetaPerson.WOMEN_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("women.png"));
        res.put(MetaPerson.PERSON_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("person.png"));
        res.put(MetaPerson.GENERAL_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("general.png"));
        res.put(MetaPersonProperty.PERSON_PROP_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("personproperty.png"));
        res.put(MetaPersonProperty.PERSON_PROP_BOSS_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("boss.png"));
        res.put(MetaPersonProperty.PERSON_PROP_KING_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("king.png"));
        res.put(MetaPersonProperty.PERSON_PROP_KIN_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("kin.png"));
        res.put(MetaPersonProperty.PERSON_PROP_MILITARY_ID, PullentiNerCoreInternalResourceHelper.getBytes("militaryrank.png"));
        res.put(MetaPersonProperty.PERSON_PROP_NATION_ID, PullentiNerCoreInternalResourceHelper.getBytes("nationality.png"));
        res.put(MetaPersonIdentity.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("identity.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === PersonReferent.OBJ_TYPENAME) 
            return new PersonReferent();
        if (type === PersonPropertyReferent.OBJ_TYPENAME) 
            return new PersonPropertyReferent();
        if (type === PersonIdentityReferent.OBJ_TYPENAME) 
            return new PersonIdentityReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return ["ORGANIZATION", "GEO", "ADDRESS", "TRANSPORT"];
    }
    
    get progressWeight() {
        return 35;
    }
    
    createAnalyzerData() {
        const PersonAnalyzerData = require("./internal/PersonAnalyzerData");
        return new PersonAnalyzerData();
    }
    
    static getData(t) {
        const PersonAnalyzerData = require("./internal/PersonAnalyzerData");
        if (t === null) 
            return null;
        return Utils.as(t.kit.getAnalyzerDataByAnalyzerName(PersonAnalyzer.ANALYZER_NAME), PersonAnalyzerData);
    }
    
    process(kit) {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        const PersonIdToken = require("./internal/PersonIdToken");
        const PersonAnalyzerData = require("./internal/PersonAnalyzerData");
        let ad = Utils.as(kit.getAnalyzerData(this), PersonAnalyzerData);
        ad.nominativeCaseAlways = PersonAnalyzer.NOMINATIVE_CASE_ALWAYS;
        ad.textStartsWithLastnameFirstnameMiddlename = PersonAnalyzer.TEXT_STARTS_WITH_LASTNAME_FIRSTNAME_MIDDLENAME;
        ad.needSecondStep = false;
        PersonAttrToken.SPEED_REGIME = false;
        PersonAttrToken.prepareAllData(kit.firstToken);
        ad.aRegime = true;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            t.innerBool = false;
        }
        let steps = 2;
        let max = steps;
        let delta = 100000;
        let tlen = kit.sofa.text.length;
        if (kit.sofa.ignoredEndChar > 0) 
            tlen = kit.sofa.ignoredBeginChar + ((tlen - kit.sofa.ignoredEndChar));
        let parts = Utils.intDiv(((tlen + delta) - 1), delta);
        if (parts === 0) 
            parts = 1;
        max *= parts;
        let cur = 0;
        for (let step = 0; step < steps; step++) {
            let nextPos = delta;
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                if (t.beginChar > nextPos) {
                    nextPos += delta;
                    if (nextPos <= t.beginChar) 
                        nextPos = t.beginChar + delta;
                    cur++;
                    if (cur > max) 
                        cur = max;
                    if (!this.onProgress(cur, max, kit)) 
                        return;
                }
                if ((t instanceof NumberToken) && t.value === "70") {
                }
                let rts = this.tryAttachPersons(t, step);
                if (rts !== null) {
                    if (!MetaToken.check(rts)) {
                    }
                    else 
                        for (const rt of rts) {
                            if (rt.lengthChar === 1) {
                            }
                            if (rt.referent === null) 
                                t = rt.endToken;
                            else {
                                let pats = new Array();
                                for (const s of rt.referent.slots) {
                                    if (s.value instanceof PersonAttrToken) {
                                        let pat = Utils.as(s.value, PersonAttrToken);
                                        pats.push(pat);
                                        if (pat.propRef === null) 
                                            continue;
                                        for (const ss of pat.propRef.slots) {
                                            if (ss.typeName === PersonPropertyReferent.ATTR_REF && (ss.value instanceof ReferentToken)) {
                                                let rt1 = Utils.as(ss.value, ReferentToken);
                                                rt1.referent = ad.registerReferent(rt1.referent);
                                                ss.value = rt1.referent;
                                                let rr = ReferentToken._new1092(rt1.referent, rt1.beginToken, rt1.endToken, rt1.morph);
                                                kit.embedToken(rr);
                                                if (rr.beginToken === rt.beginToken) 
                                                    rt.beginToken = rr;
                                                if (rr.endToken === rt.endToken) 
                                                    rt.endToken = rr;
                                                if (rr.beginToken === pat.beginToken) 
                                                    pat.beginToken = rr;
                                                if (rr.endToken === pat.endToken) 
                                                    pat.endToken = rr;
                                            }
                                        }
                                    }
                                    else if (s.value instanceof ReferentToken) {
                                        let rt0 = Utils.as(s.value, ReferentToken);
                                        if (rt0.referent !== null) {
                                            for (const s1 of rt0.referent.slots) {
                                                if (s1.value instanceof PersonAttrToken) {
                                                    let pat = Utils.as(s1.value, PersonAttrToken);
                                                    if (pat.propRef === null) 
                                                        continue;
                                                    for (const ss of pat.propRef.slots) {
                                                        if (ss.typeName === PersonPropertyReferent.ATTR_REF && (ss.value instanceof ReferentToken)) {
                                                            let rt1 = Utils.as(ss.value, ReferentToken);
                                                            rt1.referent = ad.registerReferent(rt1.referent);
                                                            ss.value = rt1.referent;
                                                            let rr = ReferentToken._new1092(rt1.referent, rt1.beginToken, rt1.endToken, rt1.morph);
                                                            kit.embedToken(rr);
                                                            if (rr.beginToken === rt0.beginToken) 
                                                                rt0.beginToken = rr;
                                                            if (rr.endToken === rt0.endToken) 
                                                                rt0.endToken = rr;
                                                            if (rr.beginToken === pat.beginToken) 
                                                                pat.beginToken = rr;
                                                            if (rr.endToken === pat.endToken) 
                                                                pat.endToken = rr;
                                                        }
                                                    }
                                                    pat.propRef = Utils.as(ad.registerReferent(pat.propRef), PersonPropertyReferent);
                                                    let rt2 = ReferentToken._new1092(pat.propRef, pat.beginToken, pat.endToken, pat.morph);
                                                    kit.embedToken(rt2);
                                                    if (rt2.beginToken === rt0.beginToken) 
                                                        rt0.beginToken = rt2;
                                                    if (rt2.endToken === rt0.endToken) 
                                                        rt0.endToken = rt2;
                                                    s1.value = pat.propRef;
                                                }
                                            }
                                        }
                                        rt0.referent = ad.registerReferent(rt0.referent);
                                        if (rt0.beginChar === rt.beginChar) 
                                            rt.beginToken = rt0;
                                        if (rt0.endChar === rt.endChar) 
                                            rt.endToken = rt0;
                                        kit.embedToken(rt0);
                                        s.value = rt0.referent;
                                    }
                                }
                                rt.referent = ad.registerReferent(rt.referent);
                                for (const p of pats) {
                                    if (p.propRef !== null) {
                                        let rr = ReferentToken._new1092(p.propRef, p.beginToken, p.endToken, p.morph);
                                        kit.embedToken(rr);
                                        if (rr.beginToken === rt.beginToken) 
                                            rt.beginToken = rr;
                                        if (rr.endToken === rt.endToken) 
                                            rt.endToken = rr;
                                    }
                                }
                                kit.embedToken(rt);
                                t = rt;
                            }
                        }
                }
                else if (step === 0) {
                    let rt = PersonIdToken.tryAttach(t);
                    if (rt !== null) {
                        rt.referent = ad.registerReferent(rt.referent);
                        let tt = t.previous;
                        if (tt !== null && tt.isCharOf(":,")) 
                            tt = tt.previous;
                        let pers = (tt === null ? null : Utils.as(tt.getReferent(), PersonReferent));
                        if (pers !== null) 
                            pers.addSlot(PersonReferent.ATTR_IDDOC, rt.referent, false, 0);
                        kit.embedToken(rt);
                        t = rt;
                    }
                }
            }
            if (ad.referents.length === 0 && !ad.needSecondStep) 
                break;
        }
        let genAttrs = new Array();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored || !(t instanceof ReferentToken)) 
                continue;
            let p = Utils.as(t.getReferent(), PersonReferent);
            if (p === null) 
                continue;
            if (p.findSlot(PersonReferent.ATTR_ATTR, null, true) === null) 
                continue;
            for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
                let pr = Utils.as(tt.getReferent(), PersonPropertyReferent);
                if (pr === null) 
                    continue;
                let s0 = p.findSlot(PersonReferent.ATTR_ATTR, pr, true);
                for (const s of p.slots) {
                    if (s.typeName === PersonReferent.ATTR_ATTR && s !== s0) {
                        let pr1 = Utils.as(s.value, PersonPropertyReferent);
                        if (pr1 === null) 
                            continue;
                        if (!pr.canBeGeneralFor(pr1)) 
                            continue;
                        tt.referent = pr1;
                        if (pr1.generalReferent !== null) 
                            pr1.generalReferent = null;
                        pr1.addOccurenceOfRefTok(Utils.as(tt, ReferentToken));
                        if (!genAttrs.includes(pr)) 
                            genAttrs.push(pr);
                        for (const o of pr.occurrence) {
                            if (o.beginChar === tt.beginChar) {
                                Utils.removeItem(pr.occurrence, o);
                                break;
                            }
                        }
                        let hi = pr.higher;
                        if (hi !== null) {
                            if (pr1.higher !== null && hi.canBeGeneralFor(pr1.higher)) {
                                if (!genAttrs.includes(hi)) 
                                    genAttrs.push(hi);
                                for (const o of hi.occurrence) {
                                    if (o.beginChar >= tt.beginChar && o.endChar <= tt.endChar) {
                                        Utils.removeItem(hi.occurrence, o);
                                        break;
                                    }
                                }
                            }
                        }
                        if (s0 !== null) 
                            Utils.removeItem(p.slots, s0);
                        break;
                    }
                }
            }
        }
        for (const g of genAttrs) {
            if (g.occurrence.length === 0) 
                ad.removeReferent(g);
        }
        let props = new Hashtable();
        for (const r of ad.referents) {
            let p = Utils.as(r, PersonReferent);
            if (p === null) 
                continue;
            for (const s of p.slots) {
                if (s.typeName === PersonReferent.ATTR_ATTR && (s.value instanceof PersonPropertyReferent)) {
                    let pr = Utils.as(s.value, PersonPropertyReferent);
                    let li = [ ];
                    let wrapli2697 = new RefOutArgWrapper();
                    let inoutres2698 = props.tryGetValue(pr, wrapli2697);
                    li = wrapli2697.value;
                    if (!inoutres2698) 
                        props.put(pr, (li = new Array()));
                    if (!li.includes(p)) 
                        li.push(p);
                }
            }
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (t instanceof ReferentToken) {
                if (t.chars.isLatinLetter && MiscHelper.isEngAdjSuffix(t.next)) {
                }
                else 
                    continue;
            }
            if (!ad.canBePersonPropBeginChars.containsKey(t.beginChar)) 
                continue;
            let pat = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if (pat === null) 
                continue;
            if (pat.propRef === null || ((pat.typ !== PersonAttrTerminType.POSITION && pat.typ !== PersonAttrTerminType.KING))) {
                t = pat.endToken;
                continue;
            }
            let pers = new Array();
            let ppr = null;
            for (const kp of props.entries) {
                if (kp.key.canBeEquals(pat.propRef, ReferentsEqualType.WITHINONETEXT)) {
                    ppr = kp.key;
                    for (const pp of kp.value) {
                        if (!pers.includes(pp)) 
                            pers.push(pp);
                    }
                    if (pers.length > 1) 
                        break;
                }
            }
            if (pers.length === 1) {
                let tt = pat.endToken.next;
                if (tt !== null && ((tt.isChar('_') || tt.isNewlineBefore || tt.isTableControlChar))) {
                }
                else {
                    let rt1 = ReferentToken._new1092(ppr, pat, pat, pat.morph);
                    kit.embedToken(rt1);
                    let rt2 = ReferentToken._new1092(pers[0], rt1, rt1, pat.morph);
                    kit.embedToken(rt2);
                    continue;
                }
            }
            if (pat.propRef !== null) {
                if (pat.canBeIndependentProperty || pers.length > 0) {
                    let rt = ReferentToken._new1092(ad.registerReferent(pat.propRef), pat.beginToken, pat.endToken, pat.morph);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            t = pat.endToken;
        }
        ad.aRegime = false;
    }
    
    static processReferentStat(begin, param = null) {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        if (begin === null) 
            return null;
        let ad = PersonAnalyzer.getData(begin);
        if (ad === null || ad.level > 1) 
            return null;
        begin.kit.fixAnalyzer("ORGANIZATION", true);
        ad.level++;
        let rt = PersonAnalyzer.tryAttachPerson(begin, false, -1, false);
        ad.level--;
        begin.kit.fixAnalyzer("ORGANIZATION", false);
        if (rt !== null && rt.referent === null) 
            rt = null;
        if (rt !== null) {
            rt.data = ad;
            return rt;
        }
        ad.level++;
        begin.kit.fixAnalyzer("ORGANIZATION", true);
        let pat = PersonAttrToken.tryAttach(begin, PersonAttrTokenPersonAttrAttachAttrs.NO);
        begin.kit.fixAnalyzer("ORGANIZATION", false);
        ad.level--;
        if (pat === null || pat.propRef === null) 
            return null;
        rt = ReferentToken._new1092(pat.propRef, pat.beginToken, pat.endToken, pat.morph);
        rt.data = ad;
        return rt;
    }
    
    processReferent(begin, param) {
        return PersonAnalyzer.processReferentStat(begin, param);
    }
    
    tryAttachPersons(t, step) {
        const PersonItemToken = require("./internal/PersonItemToken");
        let rt = PersonAnalyzer.tryAttachPerson(t, false, step, false);
        if (rt === null) 
            return null;
        let res = new Array();
        res.push(rt);
        let names = null;
        for (let tt = rt.endToken.next; tt !== null; tt = tt.next) {
            if (!tt.isCommaAnd) 
                break;
            let pits = PersonItemToken.tryAttachList(tt.next, PersonItemTokenParseAttr.NO, 10);
            if (pits === null || pits.length !== 1) 
                break;
            let rt1 = PersonAnalyzer.tryAttachPerson(tt.next, false, step, false);
            if (rt1 !== null) 
                break;
            if (pits[0].firstname === null || pits[0].firstname.vars.length === 0) 
                break;
            if (names === null) 
                names = new Array();
            names.push(pits[0]);
            if (tt.isAnd) 
                break;
            tt = tt.next;
        }
        if (names !== null) {
            for (const n of names) {
                let pers = new PersonReferent();
                let bi = MorphBaseInfo._new2703(MorphNumber.SINGULAR, t.kit.baseLanguage);
                bi._class = MorphClass._new2662(true);
                if (n.firstname.vars[0].gender === MorphGender.FEMINIE) {
                    pers.isFemale = true;
                    bi.gender = MorphGender.FEMINIE;
                }
                else if (n.firstname.vars[0].gender === MorphGender.MASCULINE) {
                    pers.isMale = true;
                    bi.gender = MorphGender.MASCULINE;
                }
                for (const v of n.firstname.vars) {
                    pers.addSlot(PersonReferent.ATTR_FIRSTNAME, v.value, false, 0);
                }
                for (const s of rt.referent.slots) {
                    if (s.typeName === PersonReferent.ATTR_ATTR) 
                        pers.addSlot(s.typeName, s.value, false, 0);
                    else if (s.typeName === PersonReferent.ATTR_LASTNAME) {
                        let sur = Utils.asString(s.value);
                        if (bi.gender !== MorphGender.UNDEFINED) {
                            let sur0 = null;
                            try {
                                sur0 = MorphologyService.getWordform(sur, bi);
                            } catch (ex2705) {
                            }
                            if (sur0 !== null) 
                                pers.addSlot(PersonReferent.ATTR_LASTNAME, sur0, false, 0);
                        }
                        pers.addSlot(PersonReferent.ATTR_LASTNAME, sur, false, 0);
                    }
                }
                res.push(ReferentToken._new1092(pers, n.beginToken, n.endToken, n.morph));
            }
        }
        return res;
    }
    
    static tryAttachPerson(t, forExtOntos, step, forAttribute = false) {
        if (t === null) 
            return null;
        let ad = PersonAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad.overflowLevel > 2) 
            return null;
        ad.overflowLevel++;
        let res = PersonAnalyzer._tryAttachPersonInt(t, forExtOntos, step, forAttribute);
        ad.overflowLevel--;
        return res;
    }
    
    static _tryAttachPersonInt(t, forExtOntos, step, forAttribute = false) {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        const PersonItemToken = require("./internal/PersonItemToken");
        const PersonMorphCollection = require("./internal/PersonMorphCollection");
        const PersonHelper = require("./internal/PersonHelper");
        const PersonIdentityToken = require("./internal/PersonIdentityToken");
        let attrs = null;
        let mi = new MorphBaseInfo();
        let ad = PersonAnalyzer.getData(t);
        if (ad === null) 
            return null;
        mi._case = ((forExtOntos || ad.nominativeCaseAlways) ? MorphCase.NOMINATIVE : MorphCase.ALL_CASES);
        mi.gender = MorphGender.of((MorphGender.MASCULINE.value()) | (MorphGender.FEMINIE.value()));
        let t0 = t;
        let and = false;
        let andWasTerminated = false;
        let isGenitive = false;
        let canAttachToPreviousPerson = true;
        let isKing = false;
        let afterBePredicate = false;
        for (; t !== null; t = (t === null ? null : t.next)) {
            if (attrs !== null && t.next !== null) {
                if (and) 
                    break;
                if (t.isChar(',')) 
                    t = t.next;
                else if (t.isAnd && t.isWhitespaceAfter && t.chars.isAllLower) {
                    t = t.next;
                    and = true;
                }
                else if (t.isHiphen && t.isNewlineAfter) {
                    t = t.next;
                    and = true;
                }
                else if (t.isHiphen && t.whitespacesAfterCount === 1 && t.whitespacesBeforeCount === 1) {
                    t = t.next;
                    and = true;
                }
                else if ((t.isHiphen && t.next !== null && t.next.isHiphen) && t.next.whitespacesAfterCount === 1 && t.whitespacesBeforeCount === 1) {
                    t = t.next.next;
                    and = true;
                }
                else if (t.isChar(':')) {
                    if (!attrs[attrs.length - 1].morph._case.isNominative && !attrs[attrs.length - 1].morph._case.isUndefined) {
                    }
                    else {
                        mi._case = MorphCase.NOMINATIVE;
                        mi.gender = MorphGender.of((MorphGender.MASCULINE.value()) | (MorphGender.FEMINIE.value()));
                    }
                    t = t.next;
                    if (!BracketHelper.canBeStartOfSequence(t, false, false)) 
                        canAttachToPreviousPerson = false;
                }
                else if (t.isChar('_')) {
                    let cou = 0;
                    let te = t;
                    for (; te !== null; te = te.next) {
                        if (!te.isChar('_') || ((te.isWhitespaceBefore && te !== t))) 
                            break;
                        else 
                            cou++;
                    }
                    if (cou > 2 && ((!t.isNewlineBefore || ((te !== null && !te.isNewlineBefore))))) {
                        mi._case = MorphCase.NOMINATIVE;
                        mi.gender = MorphGender.of((MorphGender.MASCULINE.value()) | (MorphGender.FEMINIE.value()));
                        canAttachToPreviousPerson = false;
                        t = te;
                        if (t !== null && t.isChar('/') && t.next !== null) 
                            t = t.next;
                        break;
                    }
                }
                else if ((t.isValue("ЯВЛЯТЬСЯ", null) || t.isValue("БЫТЬ", null) || t.isValue("Є", null)) || t.isValue("IS", null)) {
                    mi._case = MorphCase.NOMINATIVE;
                    mi.gender = MorphGender.of((MorphGender.MASCULINE.value()) | (MorphGender.FEMINIE.value()));
                    afterBePredicate = true;
                    continue;
                }
                else if (((t.isValue("LIKE", null) || t.isValue("AS", null))) && attrs !== null) {
                    t = t.next;
                    break;
                }
            }
            if (t.chars.isLatinLetter && step === 0) {
                let tt2 = t;
                if (MiscHelper.isEngArticle(t)) 
                    tt2 = t.next;
                let pit0 = PersonItemToken.tryAttach(tt2, PersonItemTokenParseAttr.CANBELATIN, null);
                if (pit0 !== null && MiscHelper.isEngAdjSuffix(pit0.endToken.next) && ad !== null) {
                    let pp = PersonIdentityToken.tryAttachOntoForSingle(pit0, ad.localOntology);
                    if (pp === null) 
                        pp = PersonIdentityToken.tryAttachLatinSurname(pit0, ad.localOntology);
                    if (pp !== null) 
                        return PersonHelper.createReferentToken(pp, pit0.beginToken, pit0.endToken, pit0.morph, attrs, forAttribute, afterBePredicate);
                }
            }
            let a = null;
            if ((step < 1) || t.innerBool) {
                a = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
                if (step === 0 && a !== null) 
                    t.innerBool = true;
            }
            if ((a !== null && a.beginToken === a.endToken && !a.beginToken.chars.isAllLower) && (a.whitespacesAfterCount < 3)) {
                let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.IGNOREATTRS, 10);
                if (pits !== null && pits.length >= 6) {
                    if (pits[2].isNewlineAfter && pits[5].isNewlineAfter) 
                        a = null;
                }
            }
            if ((a !== null && attrs !== null && !t.chars.isAllLower) && attrs[0].typ === PersonAttrTerminType.PREFIX) {
                let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.IGNOREATTRS, 10);
                if (pits !== null && pits.length >= 2 && pits[0].lastname !== null) 
                    a = null;
            }
            if ((a === null && t.isValue("НА", null) && t.next !== null) && t.next.isValue("ИМЯ", null)) {
                a = PersonAttrToken._new2479(t, t.next, MorphCollection._new2483(MorphCase.GENITIVE));
                isGenitive = true;
            }
            if (a === null) 
                break;
            if (afterBePredicate) 
                return null;
            if (a.newlinesAfterCount > 3) 
                break;
            if (!t.chars.isAllLower && a.beginToken === a.endToken) {
                let pit = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.CANBELATIN, null);
                if (pit !== null && pit.lastname !== null && ((pit.lastname.isInOntology || pit.lastname.isInDictionary))) 
                    break;
            }
            if (ad !== null && !ad.canBePersonPropBeginChars.containsKey(a.beginChar)) 
                ad.canBePersonPropBeginChars.put(a.beginChar, true);
            if (attrs === null) {
                if (a.isDoubt) {
                    if (a.isNewlineAfter) 
                        break;
                }
                attrs = new Array();
            }
            else {
                if (!a.morph._case.isUndefined && !mi._case.isUndefined) {
                    if ((MorphCase.ooBitand(a.morph._case, mi._case)).isUndefined) 
                        return null;
                }
                if ((t.previous.isAnd && attrs.length === 1 && attrs[0].propRef !== null) && a.propRef !== null) {
                    let r1 = Utils.as(attrs[0].propRef.getSlotValue(PersonPropertyReferent.ATTR_REF), Referent);
                    let r2 = Utils.as(a.propRef.getSlotValue(PersonPropertyReferent.ATTR_REF), Referent);
                    if ((r1 instanceof GeoReferent) && (r2 instanceof GeoReferent)) {
                        if (!r1.canBeEquals(r2, ReferentsEqualType.WITHINONETEXT)) 
                            return null;
                    }
                }
            }
            attrs.push(a);
            if (attrs.length > 5) 
                return new ReferentToken(null, attrs[0].beginToken, a.endToken);
            if (a.typ === PersonAttrTerminType.KING) 
                isKing = true;
            if (a.typ === PersonAttrTerminType.BESTREGARDS) 
                mi._case = MorphCase.NOMINATIVE;
            if (and) 
                andWasTerminated = true;
            if (a.canHasPersonAfter >= 0) {
                if (a.gender !== MorphGender.UNDEFINED) {
                    if (a.typ !== PersonAttrTerminType.POSITION) 
                        mi.gender = MorphGender.of((mi.gender.value()) & (a.gender.value()));
                    else if (a.gender === MorphGender.FEMINIE) 
                        mi.gender = MorphGender.of((mi.gender.value()) & (a.gender.value()));
                }
                if (!a.morph._case.isUndefined && a.canHasPersonAfter === 0) 
                    mi._case = MorphCase.ooBitand(mi._case, a.morph._case);
            }
            t = a.endToken;
        }
        if (attrs !== null && and && !andWasTerminated) {
            if ((t !== null && t.previous !== null && t.previous.isHiphen) && (t.whitespacesBeforeCount < 2)) {
            }
            else 
                return null;
        }
        if (attrs !== null) {
            if (t !== null && BracketHelper.canBeEndOfSequence(t, false, null, false)) 
                t = t.next;
            while (t !== null && t.isTableControlChar) {
                t = t.next;
            }
        }
        while (t !== null && t.isChar('_')) {
            t = t.next;
        }
        if (t === null) {
            if (attrs !== null) {
                let attr = attrs[attrs.length - 1];
                if (attr.canBeSinglePerson && attr.propRef !== null) 
                    return new ReferentToken(attr.propRef, attr.beginToken, attr.endToken);
            }
            return null;
        }
        if (attrs !== null && t.isChar('(')) {
            let pr = PersonAnalyzer.tryAttachPerson(t.next, forExtOntos, step, forAttribute);
            if (pr !== null && pr.endToken.next !== null && pr.endToken.next.isChar(')')) {
                let res = PersonHelper.createReferentToken(Utils.as(pr.referent, PersonReferent), t, pr.endToken.next, attrs[0].morph, attrs, true, afterBePredicate);
                if (res !== null) 
                    res.endToken = pr.endToken.next;
                return res;
            }
            let attr = PersonAttrToken.tryAttach(t.next, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if (attr !== null && attr.endToken.next !== null && attr.endToken.next.isChar(')')) {
                attrs.push(attr);
                t = attr.endToken.next.next;
                while (t !== null && ((t.isTableControlChar || t.isCharOf("_:")))) {
                    t = t.next;
                }
            }
        }
        if (attrs !== null && t !== null && t.isChar('(')) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null && (br.lengthChar < 200)) 
                t = br.endToken.next;
        }
        let tt0 = t0.previous;
        if (mi._case.equals(MorphCase.ALL_CASES) && tt0 !== null) {
            if (tt0 !== null && tt0.isCommaAnd) {
                tt0 = tt0.previous;
                if (tt0 !== null && (tt0.getReferent() instanceof PersonReferent)) {
                    if (!tt0.morph._case.isUndefined) 
                        mi._case = MorphCase.ooBitand(mi._case, tt0.morph._case);
                }
            }
        }
        if ((attrs !== null && t !== null && t.previous !== null) && t.previous.isChar(',')) {
            if (attrs[0].typ !== PersonAttrTerminType.BESTREGARDS && !attrs[0].chars.isLatinLetter) {
                if (attrs[0].isNewlineBefore) {
                }
                else if (attrs[0].beginToken.previous !== null && attrs[0].beginToken.previous.isValue("ЛИЦО", "ОСОБІ")) {
                }
                else 
                    return null;
            }
        }
        if (step === 1) {
        }
        if (t === null) 
            return null;
        if (t.previous !== null && t.previous.isCommaAnd) {
        }
        let slash = false;
        if (attrs !== null && t !== null && t.isCharOf("/\\")) {
            slash = true;
            t = t.next;
        }
        for (let k = 0; k < 2; k++) {
            let pits = null;
            let pattr = PersonItemTokenParseAttr.NO;
            if ((step < 1) || t.innerBool) {
                if (k === 0) 
                    pattr = PersonItemTokenParseAttr.of((pattr.value()) | (PersonItemTokenParseAttr.ALTVAR.value()));
                if (forExtOntos || t.chars.isLatinLetter) 
                    pattr = PersonItemTokenParseAttr.of((pattr.value()) | (PersonItemTokenParseAttr.CANBELATIN.value()));
                if (attrs !== null) 
                    pattr = PersonItemTokenParseAttr.of((pattr.value()) | (PersonItemTokenParseAttr.AFTERATTRIBUTE.value()));
                pits = PersonItemToken.tryAttachList(t, pattr, 15);
                if (pits !== null && step === 0) 
                    t.innerBool = true;
                if (pits !== null && isGenitive) {
                    for (const p of pits) {
                        p.removeNotGenitive();
                    }
                }
            }
            if (pits === null) 
                continue;
            if (!forExtOntos) {
            }
            if ((step === 0 && pits.length === 1 && attrs !== null) && attrs[attrs.length - 1].endToken === t.previous && pits[0].endToken === t) {
                let stat = t.kit.statistics.getWordInfo(t);
                if (stat !== null) 
                    stat.hasBeforePersonAttr = true;
                if (ad !== null) 
                    ad.needSecondStep = true;
            }
            if (mi._case.equals(MorphCase.ALL_CASES) && pits.length > 0) {
                if (t0.whitespacesBeforeCount > 4 && pits[pits.length - 1].whitespacesAfterCount > 4) 
                    mi._case = MorphCase.NOMINATIVE;
            }
            if (pits !== null && pits.length === 1 && pits[0].firstname !== null) {
                if (pits[0].endToken.next !== null && pits[0].endToken.next.isAnd && (pits[0].endToken.next.next instanceof ReferentToken)) {
                    let pr = Utils.as(pits[0].endToken.next.next.getReferent(), PersonReferent);
                    if (pr !== null) {
                        if (pits[0].firstname.vars.length < 1) 
                            return null;
                        let v = pits[0].firstname.vars[0];
                        let pers = new PersonReferent();
                        let bi = MorphBaseInfo._new2709(v.gender, MorphNumber.SINGULAR, pits[0].kit.baseLanguage);
                        bi._class = MorphClass._new2662(true);
                        if (v.gender === MorphGender.MASCULINE) 
                            pers.isMale = true;
                        else if (v.gender === MorphGender.FEMINIE) 
                            pers.isFemale = true;
                        for (const s of pr.slots) {
                            if (s.typeName === PersonReferent.ATTR_LASTNAME) {
                                let str = Utils.asString(s.value);
                                let str0 = null;
                                try {
                                    str0 = MorphologyService.getWordform(str, bi);
                                } catch (ex2711) {
                                }
                                pers.addSlot(s.typeName, str0, false, 0);
                                if (str0 !== str) 
                                    pers.addSlot(s.typeName, str, false, 0);
                            }
                        }
                        if (pers.slots.length === 0) 
                            return null;
                        pers.addSlot(PersonReferent.ATTR_FIRSTNAME, v.value, false, 0);
                        return PersonHelper.createReferentToken(pers, pits[0].beginToken, pits[0].endToken, pits[0].firstname.morph, attrs, forAttribute, afterBePredicate);
                    }
                }
                let attr = (attrs !== null && attrs.length > 0 ? attrs[attrs.length - 1] : null);
                if ((attr !== null && attr.propRef !== null && attr.propRef.kind === PersonPropertyKind.KIN) && attr.gender !== MorphGender.UNDEFINED) {
                    let vvv = attr.propRef.getSlotValue(PersonPropertyReferent.ATTR_REF);
                    let pr = Utils.as(vvv, PersonReferent);
                    if (vvv instanceof ReferentToken) 
                        pr = Utils.as(vvv.referent, PersonReferent);
                    if (pr !== null) {
                        let pers = new PersonReferent();
                        let bi = MorphBaseInfo._new2712(MorphNumber.SINGULAR, attr.gender, attr.kit.baseLanguage);
                        bi._class = MorphClass._new2662(true);
                        for (const s of pr.slots) {
                            if (s.typeName === PersonReferent.ATTR_LASTNAME) {
                                let sur = Utils.asString(s.value);
                                let sur0 = null;
                                try {
                                    sur0 = MorphologyService.getWordform(sur, bi);
                                } catch (ex2714) {
                                }
                                if (sur0 !== null) 
                                    pers.addSlot(s.typeName, sur0, false, 0);
                                if (sur0 !== sur) 
                                    pers.addSlot(s.typeName, sur, false, 0);
                            }
                        }
                        let v = pits[0].firstname.vars[0];
                        pers.addSlot(PersonReferent.ATTR_FIRSTNAME, v.value, false, 0);
                        if (attr.gender === MorphGender.MASCULINE) 
                            pers.isMale = true;
                        else if (attr.gender === MorphGender.FEMINIE) 
                            pers.isFemale = true;
                        return PersonHelper.createReferentToken(pers, pits[0].beginToken, pits[0].endToken, pits[0].firstname.morph, attrs, forAttribute, afterBePredicate);
                    }
                }
            }
            if (pits !== null && pits.length === 1 && pits[0].lastname !== null) {
                if (t.morph.number === MorphNumber.PLURAL || ((t.previous !== null && ((t.previous.isValue("БРАТ", null) || t.previous.isValue("СЕСТРА", null)))))) {
                    let t1 = pits[0].endToken.next;
                    if (t1 !== null && ((t1.isChar(':') || t1.isHiphen))) 
                        t1 = t1.next;
                    let pits1 = PersonItemToken.tryAttachList(t1, pattr, 10);
                    if (pits1 !== null && pits1.length === 1) 
                        pits.splice(pits.length, 0, ...pits1);
                    else if (pits1 !== null && pits1.length === 2 && pits1[1].middlename !== null) 
                        pits.splice(pits.length, 0, ...pits1);
                }
            }
            if (mi._case.isUndefined) {
                if (pits[0].isNewlineBefore && pits[pits.length - 1].endToken.isNewlineAfter) 
                    mi._case = MorphCase.NOMINATIVE;
            }
            if (pits.length === 1) {
            }
            if (forAttribute && pits.length > 1) {
                let tmp = new Array();
                let pit0 = null;
                for (let i = 0; i < pits.length; i++) {
                    tmp.push(pits[i]);
                    let pit = PersonIdentityToken.tryAttachOntoInt(tmp, 0, mi, ad.localOntology);
                    if (pit !== null) 
                        pit0 = pit;
                }
                if (pit0 !== null) 
                    return PersonHelper.createReferentToken(pit0.ontologyPerson, pit0.beginToken, pit0.endToken, pit0.morph, attrs, forAttribute, afterBePredicate);
            }
            for (let i = 0; (i < pits.length) && (i < 3); i++) {
                let pit = PersonIdentityToken.tryAttachOntoInt(pits, i, mi, ad.localOntology);
                if (pit !== null) 
                    return PersonHelper.createReferentToken(pit.ontologyPerson, pit.beginToken, pit.endToken, pit.morph, (pit.beginToken === pits[0].beginToken ? attrs : null), forAttribute, afterBePredicate);
            }
            if (pits.length === 1 && !forExtOntos && attrs === null) {
                let pp = PersonIdentityToken.tryAttachOntoForSingle(pits[0], ad.localOntology);
                if (pp !== null) 
                    return PersonHelper.createReferentToken(pp, pits[0].beginToken, pits[0].endToken, pits[0].morph, attrs, forAttribute, afterBePredicate);
            }
            if ((pits.length === 1 && !forExtOntos && attrs !== null) && pits[0].chars.isLatinLetter && attrs[0].chars.isLatinLetter) {
                let pp = PersonIdentityToken.tryAttachLatinSurname(pits[0], ad.localOntology);
                if (pp !== null) 
                    return PersonHelper.createReferentToken(pp, pits[0].beginToken, pits[0].endToken, pits[0].morph, attrs, forAttribute, afterBePredicate);
            }
            if (pits.length === 2 && !forExtOntos) {
                let pp = PersonIdentityToken.tryAttachOntoForDuble(pits[0], pits[1]);
                if (pp !== null) 
                    return PersonHelper.createReferentToken(pp, pits[0].beginToken, pits[1].endToken, pits[0].morph, attrs, forAttribute, afterBePredicate);
            }
            if (pits[0].beginToken.kit.ontology !== null) {
                for (let i = 0; i < pits.length; i++) {
                    let pit = PersonIdentityToken.tryAttachOntoExt(pits, i, mi, pits[0].beginToken.kit.ontology);
                    if (pit !== null) 
                        return PersonHelper.createReferentToken(pit.ontologyPerson, pit.beginToken, pit.endToken, pit.morph, attrs, forAttribute, afterBePredicate);
                }
            }
            let pli0 = PersonIdentityToken.tryAttach(pits, 0, mi, t0, isKing, attrs !== null);
            if (pli0.length > 0 && pli0[0].typ === FioTemplateType.NAMESURNAME) {
                if ((attrs !== null && attrs.length > 0 && attrs[attrs.length - 1].beginToken === attrs[attrs.length - 1].endToken) && attrs[attrs.length - 1].beginToken.chars.isCapitalUpper) {
                    if (pits[1].lastname !== null && pits[1].middlename === null) {
                    }
                    else {
                        let pits1 = PersonItemToken.tryAttachList(attrs[attrs.length - 1].beginToken, pattr, 10);
                        if (pits1 !== null && pits1[0].lastname !== null) {
                            let pli11 = PersonIdentityToken.tryAttach(pits1, 0, mi, t0, isKing, attrs.length > 1);
                            if ((pli11 !== null && pli11.length > 0 && pli11[0].coef > 1) && pli11[0].endToken === pli0[0].endToken) {
                                pli0 = pli11;
                                attrs.splice(attrs.length - 1, 1);
                                if (attrs.length === 0) 
                                    attrs = null;
                            }
                        }
                    }
                }
            }
            if (t.previous === null && ((ad !== null && ad.textStartsWithLastnameFirstnameMiddlename)) && pits.length === 3) {
                let exi = false;
                for (const pit of pli0) {
                    if (pit.typ === FioTemplateType.SURNAMENAMESECNAME) {
                        pit.coef += (10);
                        exi = true;
                    }
                }
                if (!exi) {
                    let pit = PersonIdentityToken.createTyp(pits, FioTemplateType.SURNAMENAMESECNAME, mi);
                    if (pit !== null) {
                        pit.coef = 10;
                        pli0.push(pit);
                    }
                }
            }
            if (forExtOntos) {
                let te = false;
                if (pli0 === null || pli0.length === 0) 
                    te = true;
                else {
                    PersonIdentityToken.sort(pli0);
                    if (pli0[0].coef < 2) 
                        te = true;
                }
                if (te) 
                    pli0 = PersonIdentityToken.tryAttachForExtOnto(pits);
            }
            if (forExtOntos && pli0 !== null) {
                let et = pits[pits.length - 1].endToken;
                for (const pit of pli0) {
                    if (pit.endToken === et) 
                        pit.coef += (1);
                }
            }
            let pli = pli0;
            let pli1 = null;
            if (!forExtOntos && ((attrs === null || attrs[attrs.length - 1].typ === PersonAttrTerminType.POSITION))) {
                if ((pits.length === 4 && pits[0].firstname !== null && pits[1].firstname === null) && pits[2].firstname !== null && pits[3].firstname === null) {
                }
                else if (pli0 !== null && pli0.length > 0 && pli0[0].typ === FioTemplateType.ARABICLONG) {
                }
                else {
                    pli1 = PersonIdentityToken.tryAttach(pits, 1, mi, t0, isKing, attrs !== null);
                    if (pli0 !== null && pli1 !== null && pli1.length > 0) 
                        PersonIdentityToken.correctXFML(pli0, pli1, attrs);
                }
            }
            if (pli === null) 
                pli = pli1;
            else if (pli1 !== null) 
                pli.splice(pli.length, 0, ...pli1);
            if (((pli === null || pli.length === 0)) && pits.length === 1 && pits[0].firstname !== null) {
                if (isKing) {
                    let first = new PersonIdentityToken(pits[0].beginToken, pits[0].endToken);
                    PersonIdentityToken.manageFirstname(first, pits[0], mi);
                    first.coef = 2;
                    if (first.morph.gender === MorphGender.UNDEFINED && first.firstname !== null) 
                        first.morph.gender = first.firstname.gender;
                    pli.push(first);
                }
                else if (attrs !== null) {
                    for (const a of attrs) {
                        if (a.canBeSameSurname && a.referent !== null) {
                            let pr0 = Utils.as(a.referent.getSlotValue(PersonPropertyReferent.ATTR_REF), PersonReferent);
                            if (pr0 !== null) {
                                let first = new PersonIdentityToken(pits[0].beginToken, pits[0].endToken);
                                PersonIdentityToken.manageFirstname(first, pits[0], mi);
                                first.coef = 2;
                                pli.push(first);
                                first.lastname = new PersonMorphCollection();
                                for (const v of pr0.slots) {
                                    if (v.typeName === PersonReferent.ATTR_LASTNAME) 
                                        first.lastname.add(String(v.value), null, (pr0.isMale ? MorphGender.MASCULINE : (pr0.isFemale ? MorphGender.FEMINIE : MorphGender.UNDEFINED)), true);
                                }
                            }
                        }
                    }
                }
            }
            if ((((pli === null || pli.length === 0)) && pits.length === 1 && pits[0].lastname !== null) && attrs !== null && !pits[0].isInDictionary) {
                for (const a of attrs) {
                    if (a.propRef !== null && ((a.typ === PersonAttrTerminType.PREFIX || a.propRef.kind === PersonPropertyKind.BOSS))) {
                        let mc = pits[0].beginToken.getMorphClassInDictionary();
                        if (!mc.isProper) 
                            break;
                        let last = new PersonIdentityToken(pits[0].beginToken, pits[0].endToken);
                        PersonIdentityToken.manageLastname(last, pits[0], mi);
                        last.coef = 2;
                        pli.push(last);
                        break;
                    }
                }
            }
            if (pli !== null && pli.length > 0) {
                PersonIdentityToken.sort(pli);
                let best = pli[0];
                let minCoef = 2;
                if ((best.coef < minCoef) && ((attrs !== null || forExtOntos))) {
                    let pit = PersonIdentityToken.tryAttachIdentity(pits, mi);
                    if (pit !== null && pit.coef > best.coef && pit.coef > 0) {
                        let pers = new PersonReferent();
                        pers.addIdentity(pit.lastname);
                        return PersonHelper.createReferentToken(pers, pit.beginToken, pit.endToken, pit.morph, attrs, forAttribute, afterBePredicate);
                    }
                    if ((best.kit.baseLanguage.isEn && best.typ === FioTemplateType.NAMESURNAME && attrs !== null) && attrs[0].typ === PersonAttrTerminType.BESTREGARDS) 
                        best.coef += (10);
                    if (best.coef >= 0) 
                        best.coef += ((best.chars.isAllUpper ? 1 : 2));
                }
                if (best.coef >= 0 && (best.coef < minCoef)) {
                    let tee = best.endToken.next;
                    let tee1 = null;
                    if (tee !== null && tee.isChar('(')) {
                        let br = BracketHelper.tryParse(tee, BracketParseAttr.NO, 100);
                        if (br !== null && (br.lengthChar < 100)) {
                            tee1 = br.beginToken.next;
                            tee = br.endToken.next;
                        }
                    }
                    if (tee instanceof TextToken) {
                        if (tee.isCharOf(":,") || tee.isHiphen || tee.isVerbBe) 
                            tee = tee.next;
                    }
                    let att = PersonAttrToken.tryAttach(tee, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    if (att === null && tee1 !== null) 
                        att = PersonAttrToken.tryAttach(tee1, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    if (att !== null) {
                        if (tee === best.endToken.next && !att.morph._case.isNominative && !att.morph._case.isUndefined) {
                        }
                        else 
                            best.coef += (2);
                    }
                    else if (tee !== null && tee.isValue("АГЕНТ", null)) 
                        best.coef += (1);
                    if (forAttribute) 
                        best.coef += (1);
                }
                if ((pits.length >= 3 && best.typ === FioTemplateType.IISURNAME && (best.coef < minCoef)) && best.coef > 1 && pits[2].value !== null) {
                    let aaa = ad.localOntology.tryAttach(pits[2].beginToken, null, false);
                    if (aaa !== null && aaa.length > 0) 
                        best.coef += (1);
                }
                if (((best.coef >= 0 && (best.coef < minCoef) && attrs === null) && best.beginToken.previous !== null && best.beginToken.previous.isCommaAnd) && (best.beginToken.previous.previous instanceof ReferentToken)) {
                    let ppp = Utils.as(best.beginToken.previous.previous.getReferent(), PersonReferent);
                    if (ppp !== null && ppp.m_PersonIdentityTyp === best.typ) 
                        best.coef += (1);
                }
                if (best.coef >= minCoef) {
                    let i = 0;
                    let gender = MorphGender.UNDEFINED;
                    for (i = 0; i < pli.length; i++) {
                        if (pli[i].coef !== best.coef) {
                            pli.splice(i, pli.length - i);
                            break;
                        }
                        else if (pli[i].probableGender !== MorphGender.UNDEFINED) 
                            gender = MorphGender.of((gender.value()) | (pli[i].probableGender.value()));
                    }
                    if (pli.length > 1) 
                        return null;
                    if (gender !== MorphGender.FEMINIE && gender !== MorphGender.MASCULINE) {
                        if ((pli[0].isNewlineBefore && pli[0].isNewlineAfter && pli[0].lastname !== null) && pli[0].lastname.hasLastnameStandardTail) {
                            if (pli[0].lastname.values.length === 2) {
                                let ok = true;
                                let cou = 100;
                                let sur = pli[0].lastname.items[0].value;
                                for (let ttt = pli[0].endToken.next; ttt !== null && cou > 0; ttt = ttt.next,cou--) {
                                    if (step > 0) 
                                        break;
                                    if (!ttt.isValue(sur, null)) 
                                        continue;
                                    let pr = PersonAnalyzer.tryAttachPerson(ttt, forExtOntos, step, false);
                                    if (pr !== null && !pr.referent.isFemale) 
                                        ok = false;
                                    break;
                                }
                                if (ok) {
                                    pli[0].lastname.remove(null, MorphGender.MASCULINE);
                                    gender = MorphGender.FEMINIE;
                                    if (pli[0].firstname !== null && pli[0].firstname.values.length === 2) 
                                        pli[0].firstname.remove(null, MorphGender.MASCULINE);
                                }
                            }
                        }
                    }
                    if (gender === MorphGender.UNDEFINED) {
                        if (pli[0].firstname !== null && pli[0].lastname !== null) {
                            let g = pli[0].firstname.gender;
                            if (pli[0].lastname.gender !== MorphGender.UNDEFINED) 
                                g = MorphGender.of((g.value()) & (pli[0].lastname.gender.value()));
                            if (g === MorphGender.FEMINIE || g === MorphGender.MASCULINE) 
                                gender = g;
                            else if (pli[0].firstname.gender === MorphGender.MASCULINE || pli[0].firstname.gender === MorphGender.FEMINIE) 
                                gender = pli[0].firstname.gender;
                            else if (pli[0].lastname.gender === MorphGender.MASCULINE || pli[0].lastname.gender === MorphGender.FEMINIE) 
                                gender = pli[0].lastname.gender;
                        }
                    }
                    let pers = new PersonReferent();
                    if (gender === MorphGender.MASCULINE) 
                        pers.isMale = true;
                    else if (gender === MorphGender.FEMINIE) 
                        pers.isFemale = true;
                    for (const v of pli) {
                        if (v.ontologyPerson !== null) {
                            for (const s of v.ontologyPerson.slots) {
                                pers.addSlot(s.typeName, s.value, false, 0);
                            }
                        }
                        else if (v.typ === FioTemplateType.ASIANNAME || v.typ === FioTemplateType.ARABICLONG) 
                            pers.addIdentity(v.lastname);
                        else {
                            pers.addFioIdentity(v.lastname, v.firstname, v.middlename);
                            if (v.typ === FioTemplateType.ASIANSURNAMENAME) 
                                pers.addSlot("NAMETYPE", "china", false, 0);
                        }
                    }
                    if (!forExtOntos) 
                        pers.m_PersonIdentityTyp = pli[0].typ;
                    if (pli[0].beginToken !== pits[0].beginToken && attrs !== null) {
                        if (pits[0].whitespacesBeforeCount > 2) 
                            attrs = null;
                        else {
                            let s = pits[0].getSourceText();
                            let pat = attrs[attrs.length - 1];
                            if (pat.typ === PersonAttrTerminType.POSITION && !Utils.isNullOrEmpty(s) && !pat.isNewlineBefore) {
                                if (pat.value === null && pat.propRef !== null) {
                                    for (; pat !== null; pat = pat.higherPropRef) {
                                        if (pat.propRef === null) 
                                            break;
                                        else if (pat.higherPropRef === null) {
                                            let str = s.toLowerCase();
                                            if (pat.propRef.name !== null && !LanguageHelper.endsWith(pat.propRef.name, str)) 
                                                pat.propRef.name = pat.propRef.name + (" " + str);
                                            if (pat.addOuterOrgAsRef) {
                                                pat.propRef.addSlot(PersonPropertyReferent.ATTR_REF, null, true, 0);
                                                pat.addOuterOrgAsRef = false;
                                            }
                                            break;
                                        }
                                    }
                                }
                                else if (pat.value !== null) 
                                    pat.value = (pat.value + " " + s.toLowerCase());
                                pat.endToken = pits[0].endToken;
                            }
                        }
                    }
                    let latin = PersonIdentityToken.checkLatinAfter(pli[0]);
                    if (latin !== null) 
                        pers.addFioIdentity(latin.lastname, latin.firstname, latin.middlename);
                    return PersonHelper.createReferentToken(pers, pli[0].beginToken, (latin !== null ? latin.endToken : pli[0].endToken), pli[0].morph, attrs, forAttribute, afterBePredicate);
                }
            }
        }
        if (attrs !== null) {
            let attr = attrs[attrs.length - 1];
            if (attr.canBeSinglePerson && attr.propRef !== null) 
                return ReferentToken._new1092(attr.propRef, attr.beginToken, attr.endToken, attr.morph);
        }
        return null;
    }
    
    processOntologyItem(begin) {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        if (begin === null) 
            return null;
        let rt = PersonAnalyzer.tryAttachPerson(begin, true, -1, false);
        if (rt === null) {
            let pat = PersonAttrToken.tryAttach(begin, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if (pat !== null && pat.propRef !== null) 
                return new ReferentToken(pat.propRef, pat.beginToken, pat.endToken);
            return null;
        }
        let t = rt.endToken.next;
        for (; t !== null; t = t.next) {
            if (t.isChar(';') && t.next !== null) {
                let rt1 = PersonAnalyzer.tryAttachPerson(t.next, true, -1, false);
                if (rt1 !== null && rt1.referent.typeName === rt.referent.typeName) {
                    rt.referent.mergeSlots(rt1.referent, true);
                    t = rt.endToken = rt1.endToken;
                }
                else if (rt1 !== null) 
                    t = rt1.endToken;
            }
        }
        return rt;
    }
    
    static initialize() {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        const PersonPropAnalyzer = require("./internal/PersonPropAnalyzer");
        const PersonIdToken = require("./internal/PersonIdToken");
        const PersonItemToken = require("./internal/PersonItemToken");
        if (PersonAnalyzer.m_Inited) 
            return;
        PersonAnalyzer.m_Inited = true;
        try {
            MetaPerson.initialize();
            MetaPersonIdentity.initialize();
            MetaPersonProperty.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            PersonItemToken.initialize();
            PersonAttrToken.initialize();
            ShortNameHelper.initialize();
            PersonIdToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
            MailLine.initialize();
        } catch (ex) {
            throw new Error(ex.message);
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new PersonAnalyzer());
        ProcessorService.registerAnalyzer(new PersonPropAnalyzer());
    }
    
    static static_constructor() {
        PersonAnalyzer.ANALYZER_NAME = "PERSON";
        PersonAnalyzer.NOMINATIVE_CASE_ALWAYS = false;
        PersonAnalyzer.TEXT_STARTS_WITH_LASTNAME_FIRSTNAME_MIDDLENAME = false;
        PersonAnalyzer.m_Inited = false;
    }
}


PersonAnalyzer.static_constructor();

module.exports = PersonAnalyzer