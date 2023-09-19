/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MailLineTypes = require("./../../mail/internal/MailLineTypes");
const Token = require("./../../Token");
const TextToken = require("./../../TextToken");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const MetaToken = require("./../../MetaToken");
const GetTextAttr = require("./../../core/GetTextAttr");
const MorphGender = require("./../../../morph/MorphGender");
const MorphCollection = require("./../../MorphCollection");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");
const MorphNumber = require("./../../../morph/MorphNumber");
const PersonItemTokenParseAttr = require("./PersonItemTokenParseAttr");
const MorphCase = require("./../../../morph/MorphCase");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MailLine = require("./../../mail/internal/MailLine");
const PersonItemTokenItemType = require("./PersonItemTokenItemType");
const MorphClass = require("./../../../morph/MorphClass");
const FioTemplateType = require("./FioTemplateType");
const PersonReferent = require("./../PersonReferent");
const NumberToken = require("./../../NumberToken");
const ReferentToken = require("./../../ReferentToken");
const PersonMorphCollection = require("./PersonMorphCollection");
const BracketHelper = require("./../../core/BracketHelper");
const ReferentsEqualType = require("./../../core/ReferentsEqualType");
const Referent = require("./../../Referent");
const MiscHelper = require("./../../core/MiscHelper");
const NumberHelper = require("./../../core/NumberHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const PersonAnalyzer = require("./../PersonAnalyzer");
const PersonAttrToken = require("./PersonAttrToken");
const PersonItemToken = require("./PersonItemToken");
const PersonHelper = require("./PersonHelper");

class PersonIdentityToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.coef = 0;
        this.firstname = null;
        this.lastname = null;
        this.middlename = null;
        this.ontologyPerson = null;
        this.typ = FioTemplateType.UNDEFINED;
    }
    
    get probableGender() {
        if (this.morph.gender === MorphGender.FEMINIE || this.morph.gender === MorphGender.MASCULINE) 
            return this.morph.gender;
        let fem = 0;
        let mus = 0;
        for (let i = 0; i < 2; i++) {
            let col = (i === 0 ? this.firstname : this.lastname);
            if (col === null) 
                continue;
            let isf = false;
            let ism = false;
            for (const v of col.items) {
                if (((v.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    ism = true;
                if (((v.gender.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) 
                    isf = true;
            }
            if (ism) 
                mus++;
            if (isf) 
                fem++;
        }
        if (mus > fem) 
            return MorphGender.MASCULINE;
        if (fem > mus) 
            return MorphGender.FEMINIE;
        return MorphGender.UNDEFINED;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.coef).append(" ").append(this.typ.toString()).append(": ").append((this.lastname === null ? "" : this.lastname.toString()));
        res.append(" ").append((this.firstname === null ? "" : this.firstname.toString())).append(" ").append((this.middlename === null ? "" : this.middlename.toString())).append("; ").append(this.morph.toString());
        return res.toString();
    }
    
    static createLastname(pit, inf) {
        let res = new PersonMorphCollection();
        if (pit.lastname === null) 
            PersonIdentityToken.setValue(res, pit.beginToken, inf);
        else 
            PersonIdentityToken.setValue2(res, pit.lastname, inf);
        return res;
    }
    
    static tryAttachLatinSurname(pit, ontos) {
        if (pit === null) 
            return null;
        if (pit.lastname !== null && ((pit.lastname.isInDictionary || pit.lastname.isLastnameHasStdTail))) {
            let p = new PersonReferent();
            p.addSlot(PersonReferent.ATTR_LASTNAME, pit.lastname.vars[0].value, false, 0);
            return p;
        }
        return null;
    }
    
    static tryAttachOntoForSingle(pit, ontos) {
        if ((pit === null || ontos === null || pit.value === null) || pit.typ === PersonItemTokenItemType.INITIAL) 
            return null;
        if (ontos.items.length > 30) 
            return null;
        let p0 = null;
        let cou = 0;
        let fi = false;
        let sur = true;
        for (const p of ontos.items) {
            if (p.referent instanceof PersonReferent) {
                let p00 = null;
                if (pit.firstname !== null) {
                    for (const v of pit.firstname.vars) {
                        if (p.referent.findSlot(PersonReferent.ATTR_FIRSTNAME, v.value, true) !== null) {
                            p00 = Utils.as(p.referent, PersonReferent);
                            fi = true;
                            break;
                        }
                    }
                }
                if (pit.lastname !== null) {
                    for (const v of pit.lastname.vars) {
                        if (p.referent.findSlot(PersonReferent.ATTR_LASTNAME, v.value, true) !== null) {
                            p00 = Utils.as(p.referent, PersonReferent);
                            sur = true;
                            break;
                        }
                    }
                }
                if (p00 === null) {
                    if (p.referent.findSlot(PersonReferent.ATTR_FIRSTNAME, pit.value, true) !== null) {
                        p00 = Utils.as(p.referent, PersonReferent);
                        fi = true;
                    }
                    else if (p.referent.findSlot(PersonReferent.ATTR_LASTNAME, pit.value, true) !== null) {
                        p00 = Utils.as(p.referent, PersonReferent);
                        sur = true;
                    }
                }
                if (p00 !== null) {
                    p0 = p00;
                    cou++;
                }
            }
        }
        if (p0 !== null && cou === 1) {
            if (fi) {
                let li = new Array();
                li.push(pit);
                let king = PersonIdentityToken.tryAttachKing(li, 0, pit.morph, false);
                if (king !== null) 
                    return null;
            }
            return p0;
        }
        return null;
    }
    
    static tryAttachOntoForDuble(pit0, pit1) {
        if ((pit0 === null || pit0.firstname === null || pit1 === null) || pit1.middlename === null) 
            return null;
        let ad = PersonAnalyzer.getData(pit0);
        if (ad.localOntology.items.length > 100) 
            return null;
        let p0 = null;
        let cou = 0;
        for (const p of ad.localOntology.items) {
            if (p.referent !== null) {
                for (const v of pit0.firstname.vars) {
                    if (p.referent.findSlot(PersonReferent.ATTR_FIRSTNAME, v.value, true) === null) 
                        continue;
                    if (p.referent.findSlot(PersonReferent.ATTR_MIDDLENAME, pit1.middlename.vars[0].value, true) === null) 
                        continue;
                    p0 = Utils.as(p.referent, PersonReferent);
                    cou++;
                    break;
                }
            }
        }
        if (p0 !== null && cou === 1) 
            return p0;
        return null;
    }
    
    static tryAttachOntoExt(pits, ind, inf, ontos) {
        if (ind >= pits.length || pits[ind].typ === PersonItemTokenItemType.INITIAL || ontos === null) 
            return null;
        if (ontos.items.length > 1000) 
            return null;
        let otl = ontos.attachToken(PersonReferent.OBJ_TYPENAME, pits[ind].beginToken);
        return PersonIdentityToken._TryAttachOnto(pits, ind, inf, otl, false, false);
    }
    
    static tryAttachOntoInt(pits, ind, inf, ontos) {
        if (ind >= pits.length || pits[ind].typ === PersonItemTokenItemType.INITIAL) 
            return null;
        if (ontos.items.length > 1000) 
            return null;
        let otl = ontos.tryAttach(pits[ind].beginToken, null, false);
        let res = PersonIdentityToken._TryAttachOnto(pits, ind, inf, otl, false, false);
        if (res !== null) 
            return res;
        return null;
    }
    
    static _TryAttachOnto(pits, ind, inf, otl, isLocal, isAttrBefore) {
        if (otl === null || otl.length === 0) 
            return null;
        let res = new Array();
        let ontoPersons = new Array();
        if (otl !== null) {
            for (const ot of otl) {
                if (ot.endToken === pits[ind].endToken) {
                    let pers = Utils.as(ot.item.referent, PersonReferent);
                    if (pers === null) 
                        continue;
                    if (ontoPersons.includes(pers)) 
                        continue;
                    let pit = null;
                    if (ot.termin.ignoreTermsOrder) {
                        if (ind !== 0) 
                            continue;
                        pit = PersonIdentityToken.tryAttachIdentity(pits, inf);
                        if (pit === null) 
                            continue;
                        let p = new PersonReferent();
                        p.addIdentity(pit.lastname);
                        pit.ontologyPerson = p;
                        ontoPersons.push(pers);
                        res.push(pit);
                        continue;
                    }
                    if (inf.gender === MorphGender.MASCULINE) {
                        if (pers.isFemale) 
                            continue;
                    }
                    else if (inf.gender === MorphGender.FEMINIE) {
                        if (pers.isMale) 
                            continue;
                    }
                    let inf0 = MorphBaseInfo._new2569(inf._case, inf.gender);
                    if (!ot.morph._case.isUndefined && inf0._case.equals(MorphCase.ALL_CASES) && ot.beginToken === ot.endToken) 
                        inf0._case = ot.morph._case;
                    if (pers.isMale) 
                        inf0.gender = MorphGender.MASCULINE;
                    else if (pers.isFemale) 
                        inf0.gender = MorphGender.FEMINIE;
                    let vars = new Array();
                    if (ind > 1) {
                        if ((((pit = PersonIdentityToken.tryAttachIISurname(pits, ind - 2, inf0)))) !== null) 
                            vars.push(pit);
                        if ((((pit = PersonIdentityToken.tryAttachNameSecnameSurname(pits, ind - 2, inf0, false)))) !== null) 
                            vars.push(pit);
                    }
                    if (ind > 0) {
                        if ((((pit = PersonIdentityToken.tryAttachIISurname(pits, ind - 1, inf0)))) !== null) 
                            vars.push(pit);
                        if ((((pit = PersonIdentityToken.tryAttachNameSurname(pits, ind - 1, inf0, false, isAttrBefore)))) !== null) 
                            vars.push(pit);
                    }
                    if ((ind + 2) < pits.length) {
                        if ((((pit = PersonIdentityToken.tryAttachSurnameII(pits, ind, inf0)))) !== null) 
                            vars.push(pit);
                        if ((((pit = PersonIdentityToken.tryAttachSurnameNameSecname(pits, ind, inf0, false, false)))) !== null) 
                            vars.push(pit);
                    }
                    if ((ind + 1) < pits.length) {
                        if ((((pit = PersonIdentityToken.tryAttachSurnameName(pits, ind, inf0, false)))) !== null) {
                            let pit0 = null;
                            for (const v of vars) {
                                if (v.typ === FioTemplateType.SURNAMENAMESECNAME) {
                                    pit0 = v;
                                    break;
                                }
                            }
                            if (pit0 === null || (pit0.coef < pit.coef)) 
                                vars.push(pit);
                        }
                    }
                    if ((((pit = PersonIdentityToken.tryAttachAsian(pits, ind, inf0, 3, false)))) !== null) 
                        vars.push(pit);
                    else if ((((pit = PersonIdentityToken.tryAttachAsian(pits, ind, inf0, 2, false)))) !== null) 
                        vars.push(pit);
                    pit = null;
                    for (const v of vars) {
                        if (v.coef < 0) 
                            continue;
                        let p = new PersonReferent();
                        if (v.ontologyPerson !== null) 
                            p = v.ontologyPerson;
                        else {
                            if (v.typ === FioTemplateType.ASIANNAME) 
                                p.addIdentity(v.lastname);
                            else 
                                p.addFioIdentity(v.lastname, v.firstname, v.middlename);
                            v.ontologyPerson = p;
                        }
                        if (!pers.canBeEquals(p, ReferentsEqualType.WITHINONETEXT)) {
                            if (pit !== null && v.coef >= pit.coef) 
                                pit = null;
                        }
                        else if (pit === null) 
                            pit = v;
                        else if (pit.coef < v.coef) 
                            pit = v;
                    }
                    if ((pit === null && pits.length === 1 && vars.length === 0) && pers.findSlot(null, pits[0].value, true) !== null) {
                        let p = new PersonReferent();
                        p.addSlot(PersonReferent.ATTR_UNDEFNAME, pits[0].value, false, 0);
                        pit = PersonIdentityToken._new2570(pits[0].beginToken, pits[0].endToken, 3, FioTemplateType.UNDEFINED);
                        pit.ontologyPerson = p;
                        pit.morph = pits[0].morph;
                    }
                    else if (pit === null) {
                        pit = PersonIdentityToken.tryAttachSingleSurname(pits, ind, inf0);
                        if (pit === null || (pit.coef < 2)) 
                            continue;
                        if (pit.endToken !== pits[pits.length - 1].endToken && vars.length > 0) 
                            continue;
                        let p = new PersonReferent();
                        p.addFioIdentity(pit.lastname, null, null);
                        pit.ontologyPerson = p;
                    }
                    ontoPersons.push(pers);
                    res.push(pit);
                }
            }
        }
        if (res.length === 0) 
            return null;
        if (res.length === 1) {
            res[0].ontologyPerson.mergeSlots(ontoPersons[0], true);
            return res[0];
        }
        return null;
    }
    
    static createTyp(pits, _typ, inf) {
        if (_typ === FioTemplateType.SURNAMENAMESECNAME) 
            return PersonIdentityToken.tryAttachSurnameNameSecname(pits, 0, inf, false, true);
        return null;
    }
    
    static sort(li) {
        if (li !== null && li.length > 1) {
            for (let k = 0; k < li.length; k++) {
                let ch = false;
                for (let i = 0; i < (li.length - 1); i++) {
                    if (li[i].coef < li[i + 1].coef) {
                        ch = true;
                        let v = li[i];
                        li[i] = li[i + 1];
                        li[i + 1] = v;
                    }
                }
                if (!ch) 
                    break;
            }
        }
    }
    
    static tryAttachForExtOnto(pits) {
        let pit = null;
        if (pits.length === 3) {
            if (pits[0].typ === PersonItemTokenItemType.VALUE && pits[1].typ === PersonItemTokenItemType.INITIAL && pits[2].typ === PersonItemTokenItemType.VALUE) {
                pit = PersonIdentityToken._new2571(pits[0].beginToken, pits[2].endToken, FioTemplateType.NAMEISURNAME);
                PersonIdentityToken.manageFirstname(pit, pits[0], null);
                PersonIdentityToken.manageLastname(pit, pits[2], null);
                PersonIdentityToken.manageMiddlename(pit, pits[1], null);
                pit.coef = 2;
            }
            else if (pits[0].typ === PersonItemTokenItemType.VALUE && pits[1].typ === PersonItemTokenItemType.VALUE && pits[2].typ === PersonItemTokenItemType.VALUE) {
                let ok = false;
                if (pits[0].firstname === null && pits[1].middlename === null && ((pits[1].firstname !== null || pits[2].middlename !== null))) 
                    ok = true;
                else if (pits[0].firstname !== null && ((pits[0].firstname.isLastnameHasStdTail || pits[0].firstname.isInDictionary))) 
                    ok = true;
                if (ok) {
                    pit = PersonIdentityToken._new2571(pits[0].beginToken, pits[2].endToken, FioTemplateType.SURNAMENAMESECNAME);
                    PersonIdentityToken.manageFirstname(pit, pits[1], null);
                    PersonIdentityToken.manageLastname(pit, pits[0], null);
                    PersonIdentityToken.manageMiddlename(pit, pits[2], null);
                    pit.coef = 2;
                }
            }
        }
        else if (pits.length === 2 && pits[0].typ === PersonItemTokenItemType.VALUE && pits[1].typ === PersonItemTokenItemType.VALUE) {
            let nam = null;
            let sur = null;
            for (let i = 0; i < 2; i++) {
                if (((pits[i].firstname !== null && pits[i].firstname.isInDictionary)) || ((pits[i ^ 1].lastname !== null && ((pits[i ^ 1].lastname.isInDictionary || pits[i ^ 1].lastname.isLastnameHasStdTail))))) {
                    nam = pits[i];
                    sur = pits[i ^ 1];
                    break;
                }
            }
            if (nam !== null) {
                pit = PersonIdentityToken._new2571(pits[0].beginToken, pits[1].endToken, (nam === pits[0] ? FioTemplateType.NAMESURNAME : FioTemplateType.SURNAMENAME));
                PersonIdentityToken.manageFirstname(pit, nam, null);
                PersonIdentityToken.manageLastname(pit, sur, null);
                pit.coef = 2;
            }
        }
        if (pit === null) 
            return null;
        let res = new Array();
        res.push(pit);
        return res;
    }
    
    static tryAttach(pits, ind, inf, firstTok, king, isAttrBefore) {
        let res = new Array();
        let ty = FioTemplateType.UNDEFINED;
        if (firstTok !== null) {
            for (let t = firstTok.previous; t !== null; t = t.previous) {
                let pf = Utils.as(t.getReferent(), PersonReferent);
                if (pf !== null) {
                    ty = pf.m_PersonIdentityTyp;
                    break;
                }
                if (t.isNewlineBefore) 
                    break;
                if (t.chars.isLetter && !t.isAnd) 
                    break;
            }
        }
        let pit = null;
        let pit1 = null;
        if ((((pit = PersonIdentityToken.tryAttachGlobal(pits, ind, inf)))) !== null) {
            res.push(pit);
            return res;
        }
        if ((((pit = PersonIdentityToken.tryAttachSurnameII(pits, ind, inf)))) !== null) 
            res.push(pit);
        if ((((pit = PersonIdentityToken.tryAttachIISurname(pits, ind, inf)))) !== null) 
            res.push(pit);
        if ((((pit = PersonIdentityToken.tryAttachAsian(pits, ind, inf, 3, ty === FioTemplateType.ASIANNAME)))) !== null) 
            res.push(pit);
        else if ((((pit = PersonIdentityToken.tryAttachArabic(pits, ind, inf, ty === FioTemplateType.ARABICLONG)))) !== null) 
            res.push(pit);
        else {
            if ((((pit = PersonIdentityToken.tryAttachNameSurname(pits, ind, inf, ty === FioTemplateType.NAMESURNAME, isAttrBefore)))) !== null) 
                res.push(pit);
            if ((((pit1 = PersonIdentityToken.tryAttachSurnameName(pits, ind, inf, ty === FioTemplateType.SURNAMENAME)))) !== null) {
                res.push(pit1);
                if (pit !== null && (pit.coef + (1)) >= pit1.coef && ty !== FioTemplateType.SURNAMENAME) 
                    pit1.coef -= (0.5);
            }
            if ((((pit1 = PersonIdentityToken.tryAttachNameSecnameSurname(pits, ind, inf, ty === FioTemplateType.NAMESECNAMESURNAME)))) !== null) {
                if (pit !== null && pit1.coef > 2 && pit.coef > pit1.coef) {
                    if (ind === 0 && pits.length === 3) 
                        pit1.coef = ((pit.coef) + 0.5);
                }
                res.push(pit1);
            }
            if ((((pit = PersonIdentityToken.tryAttachSurnameNameSecname(pits, ind, inf, ty === FioTemplateType.SURNAMENAMESECNAME, false)))) !== null) 
                res.push(pit);
            if ((((pit = PersonIdentityToken.tryAttachAsian(pits, ind, inf, 2, ty === FioTemplateType.ASIANNAME)))) !== null) 
                res.push(pit);
        }
        if (king) {
            if ((((pit = PersonIdentityToken.tryAttachNameSecname(pits, ind, inf, ty === FioTemplateType.NAMESECNAME)))) !== null) {
                for (const r of res) {
                    if (r.typ === FioTemplateType.NAMESURNAME) 
                        r.coef = pit.coef - 0.5;
                }
                res.push(pit);
            }
        }
        if ((((pit = PersonIdentityToken.tryAttachKing(pits, ind, inf, ty === FioTemplateType.KING || king)))) !== null) {
            for (const r of res) {
                if (r.typ === FioTemplateType.NAMESURNAME) 
                    r.coef = pit.coef - 0.5;
            }
            res.push(pit);
        }
        if (inf.gender === MorphGender.MASCULINE || inf.gender === MorphGender.FEMINIE) {
            for (const p of res) {
                if (p.morph.gender === MorphGender.UNDEFINED || (p.morph.gender.value()) === ((MorphGender.FEMINIE.value()) | (MorphGender.MASCULINE.value()))) {
                    p.morph.gender = inf.gender;
                    if (p.morph._case.isUndefined) 
                        p.morph._case = inf._case;
                }
            }
        }
        for (const r of res) {
            for (let tt = r.beginToken; tt !== r.endToken; tt = tt.next) {
                if (tt.isNewlineAfter) 
                    r.coef -= (1);
            }
            let ttt = r.beginToken.previous;
            if (ttt !== null && ttt.morph._class.equals(MorphClass.VERB)) {
                let tte = r.endToken.next;
                if (tte === null || tte.isChar('.') || tte.isNewlineBefore) {
                }
                else 
                    continue;
                r.coef += (1);
            }
            if (r.coef >= 0 && ind === 0 && r.endToken === pits[pits.length - 1].endToken) 
                r.coef += PersonIdentityToken._calcCoefAfter(pits[pits.length - 1].endToken.next);
        }
        if (ty !== FioTemplateType.UNDEFINED && ind === 0) {
            for (const r of res) {
                if (r.typ === ty) 
                    r.coef += (1.5);
                else if (((r.typ === FioTemplateType.SURNAMENAME && ty === FioTemplateType.SURNAMENAMESECNAME)) || ((r.typ === FioTemplateType.SURNAMENAMESECNAME && ty === FioTemplateType.SURNAMENAME))) 
                    r.coef += (0.5);
            }
        }
        PersonIdentityToken.sort(res);
        return res;
    }
    
    static manageLastname(res, pit, inf) {
        if (pit.lastname === null) {
            res.lastname = new PersonMorphCollection();
            PersonIdentityToken.setValue(res.lastname, pit.beginToken, inf);
            if (pit.isInDictionary) 
                res.coef--;
            let tt = Utils.as(pit.beginToken, TextToken);
            if ((tt !== null && !tt.chars.isLatinLetter && tt.chars.isCapitalUpper) && tt.lengthChar > 2 && !tt.chars.isLatinLetter) {
                let ok = true;
                for (const wf of tt.morph.items) {
                    if (wf.isInDictionary) {
                        ok = false;
                        break;
                    }
                }
                if (ok) 
                    res.coef += (1);
            }
        }
        else {
            res.coef++;
            if (!PersonIdentityToken.isAccords(pit.lastname, inf)) 
                res.coef--;
            res.lastname = new PersonMorphCollection();
            PersonIdentityToken.setValue2(res.lastname, pit.lastname, inf);
            if (res.lastname.items.length === 0 && pit.value !== null) 
                res.lastname.items.push(PersonMorphCollection.PersonMorphVariant._new2574(pit.value));
            if (pit.lastname.term !== null) {
                if (res.morph._case.isUndefined || res.morph._case.isNominative) {
                    if (!pit.lastname.isInDictionary && !res.lastname.values.includes(pit.lastname.term)) {
                        if (inf._case.isNominative || inf._case.isUndefined) {
                            if (pit.lastname.morph._class.isAdjective && inf.gender === MorphGender.FEMINIE) {
                            }
                            else 
                                res.lastname.add(pit.lastname.term, null, pit.morph.gender, false);
                        }
                    }
                }
            }
            if (pit.isInDictionary) 
                res.coef--;
            if (pit.lastname.isInDictionary || pit.lastname.isInOntology) 
                res.coef++;
            if (pit.lastname.isLastnameHasHiphen) 
                res.coef += (1);
            if (pit.middlename !== null && pit.middlename.morph.gender === MorphGender.FEMINIE) 
                res.coef--;
        }
        if (pit.firstname !== null && !pit.chars.isLatinLetter) 
            res.coef--;
        if (pit.beginToken instanceof ReferentToken) 
            res.coef--;
    }
    
    static manageFirstname(res, pit, inf) {
        if (pit.firstname === null) {
            res.firstname = new PersonMorphCollection();
            if (pit.value.indexOf('-') > 0 && pit.endToken.getMorphClassInDictionary().isProperName) {
                if (pit.lastname !== null) 
                    PersonIdentityToken.setValue2(res.firstname, pit.lastname, inf);
                else 
                    res.firstname.items.push(PersonMorphCollection.PersonMorphVariant._new2574(pit.value));
            }
            else {
                if (pit.lastname !== null) 
                    res.coef--;
                if (pit.isInDictionary) 
                    res.coef--;
                PersonIdentityToken.setValue(res.firstname, pit.beginToken, inf);
            }
        }
        else {
            res.coef++;
            if (!PersonIdentityToken.isAccords(pit.firstname, inf)) 
                res.coef--;
            res.firstname = new PersonMorphCollection();
            PersonIdentityToken.setValue2(res.firstname, pit.firstname, inf);
            if (pit.isInDictionary && !pit.firstname.isInDictionary) 
                res.coef--;
        }
        if (pit.middlename !== null && pit.middlename !== pit.firstname) 
            res.coef--;
        if (pit.lastname !== null && ((pit.lastname.isInDictionary || pit.lastname.isInOntology))) 
            res.coef--;
        if (pit.beginToken instanceof ReferentToken) 
            res.coef -= (2);
    }
    
    static manageMiddlename(res, pit, inf) {
        let mm = new PersonMorphCollection();
        res.middlename = mm;
        if (pit.middlename === null) 
            PersonIdentityToken.setValue(mm, pit.beginToken, inf);
        else {
            res.coef++;
            if (!PersonIdentityToken.isAccords(pit.middlename, inf)) 
                res.coef--;
            PersonIdentityToken.setValue2(mm, pit.middlename, inf);
        }
    }
    
    static tryAttachSingleSurname(pits, ind, inf) {
        if (ind >= pits.length || pits[ind].lastname === null) 
            return null;
        let res = new PersonIdentityToken(pits[ind].beginToken, pits[ind].endToken);
        if (ind === 0 && pits.length === 1) 
            res.coef++;
        else {
            if (ind > 0 && ((!pits[ind - 1].isInDictionary || pits[ind - 1].typ === PersonItemTokenItemType.INITIAL || pits[ind - 1].firstname !== null))) 
                res.coef--;
            if (((ind + 1) < pits.length) && ((!pits[ind + 1].isInDictionary || pits[ind + 1].typ === PersonItemTokenItemType.INITIAL || pits[ind + 1].firstname !== null))) 
                res.coef--;
        }
        res.morph = PersonIdentityToken.accordMorph(inf, pits[ind].lastname, null, null, pits[ind].endToken.next);
        PersonIdentityToken.manageLastname(res, pits[ind], inf);
        return res;
    }
    
    static tryAttachNameSurname(pits, ind, inf, prevHasThisTyp = false, isAttrBefore = false) {
        if ((ind + 1) >= pits.length || pits[ind + 1].typ !== PersonItemTokenItemType.VALUE || pits[ind].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[ind].beginToken.chars.isAllUpper && !pits[ind + 1].beginToken.chars.isAllUpper) {
            if (pits[ind].firstname === null || !pits[ind].firstname.isInDictionary) 
                return null;
        }
        if (pits[ind + 1].lastname === null) {
            if (!prevHasThisTyp) {
                if (pits[ind].chars.isLatinLetter) {
                }
                else {
                    if (pits[ind].firstname === null || pits[ind + 1].middlename !== null) 
                        return null;
                    if (pits[ind + 1].isNewlineAfter) {
                    }
                    else if (pits[ind + 1].endToken.next !== null && pits[ind + 1].endToken.next.isCharOf(",.);?!")) {
                    }
                    else 
                        return null;
                }
            }
        }
        if (pits[ind].isNewlineAfter || pits[ind].isHiphenAfter) 
            return null;
        if (pits[ind + 1].middlename !== null && pits[ind + 1].middlename.isInDictionary && pits[ind + 1].middlename.morph.gender === MorphGender.FEMINIE) 
            return null;
        if (PersonIdentityToken.isBothSurnames(pits[ind], pits[ind + 1])) {
            if (pits.length === 2 && ind === 0 && isAttrBefore) {
            }
            else 
                return null;
        }
        let res = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 1].endToken, FioTemplateType.NAMESURNAME);
        res.coef -= (ind);
        res.morph = PersonIdentityToken.accordMorph(inf, pits[ind + 1].lastname, pits[ind].firstname, null, pits[ind + 1].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
            if (pits[ind + 1].lastname !== null && !pits[ind + 1].lastname.morph._case.isUndefined) {
                if ((pits[ind].lastname !== null && pits[ind].lastname.isLastnameHasStdTail && pits[ind + 1].firstname !== null) && pits[ind + 1].firstname.isInDictionary) 
                    res.coef -= (1);
                else 
                    res.coef += (1);
            }
            inf = res.morph;
        }
        PersonIdentityToken.manageFirstname(res, pits[ind], inf);
        PersonIdentityToken.manageLastname(res, pits[ind + 1], inf);
        if (pits[ind].firstname !== null) {
            if (pits[ind + 1].beginToken instanceof ReferentToken) 
                res.coef++;
            else if (((ind === 0 && pits[ind + 1].firstname === null && pits[ind + 1].middlename === null) && !pits[ind + 1].isInDictionary && pits[ind].chars.isCapitalUpper) && pits[ind + 1].chars.isCapitalUpper) {
                let mc1 = pits[ind].beginToken.getMorphClassInDictionary();
                if (!mc1.isNoun) 
                    res.coef++;
            }
        }
        let mc = pits[ind].beginToken.getMorphClassInDictionary();
        if (mc.isVerb) {
            if (pits[ind].beginToken.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(pits[ind].beginToken)) {
            }
            else 
                res.coef -= (1);
        }
        if (mc.isPronoun && pits[ind].firstname === null) 
            return null;
        if (pits[ind].firstname !== null && ((pits[ind + 1].isNewlineAfter || ((pits[ind + 1].endToken.next !== null && (pits[ind + 1].endToken.next.isCharOf(",.")))))) && !pits[ind + 1].isNewlineBefore) {
            if (pits[ind + 1].firstname === null && pits[ind + 1].middlename === null) 
                res.coef++;
            else if (pits[ind + 1].chars.isLatinLetter && (ind + 2) === pits.length) 
                res.coef++;
        }
        if (pits[ind + 1].middlename !== null) {
            let info = pits[ind].kit.statistics.getWordInfo(pits[ind + 1].beginToken);
            if (info !== null && info.notCapitalBeforeCount > 0) {
            }
            else {
                res.coef -= (1 + ind);
                if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
                    if (pits[ind + 1].lastname !== null && ((pits[ind + 1].lastname.isInDictionary || pits[ind + 1].lastname.isInOntology))) {
                    }
                    else 
                        for (const v of pits[ind + 1].middlename.vars) {
                            if (((v.gender.value()) & (res.morph.gender.value())) !== (MorphGender.UNDEFINED.value())) {
                                res.coef -= (1);
                                break;
                            }
                        }
                }
            }
        }
        if (!pits[ind].chars.equals(pits[ind + 1].chars)) {
            if (pits[ind].chars.isCapitalUpper && pits[ind + 1].chars.isAllUpper) {
            }
            else if (pits[ind].chars.isAllUpper && pits[ind + 1].chars.isCapitalUpper && pits[ind].firstname === null) 
                res.coef -= (10);
            else if (pits[ind + 1].endToken.chars.isCapitalUpper && pits[ind].chars.isCapitalUpper) {
            }
            else 
                res.coef -= (1);
            if (pits[ind].firstname === null || !pits[ind].firstname.isInDictionary || pits[ind].chars.isAllUpper) 
                res.coef -= (1);
        }
        else if (pits[ind].chars.isAllUpper) 
            res.coef -= (0.5);
        if (pits[ind].isInDictionary) {
            if (pits[ind + 1].isInDictionary) {
                res.coef -= (2);
                if (pits[ind + 1].isNewlineAfter) 
                    res.coef++;
                else if (pits[ind + 1].endToken.next !== null && pits[ind + 1].endToken.next.isCharOf(".,:")) 
                    res.coef++;
                if (pits[ind].isInDictionary && pits[ind].firstname === null) 
                    res.coef--;
            }
            else if (((pits[ind].firstname === null || !pits[ind].firstname.isInDictionary)) && (pits[ind].value.indexOf('-') < 0)) {
                if (inf._case.isUndefined) 
                    res.coef -= (1);
                else 
                    for (const mi of pits[ind].beginToken.morph.items) {
                        if (!(MorphCase.ooBitand(mi._case, inf._case)).isUndefined) {
                            if ((mi instanceof MorphWordForm) && mi.isInDictionary) {
                                res.coef -= (1);
                                break;
                            }
                        }
                    }
            }
        }
        if (!pits[ind].chars.isLatinLetter) {
            let npt = NounPhraseHelper.tryParse(pits[ind].beginToken, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.endChar >= pits[ind + 1].beginChar) {
                if (pits[ind].beginToken.getMorphClassInDictionary().isAdjective) 
                    res.coef -= (2);
                else if (pits[ind + 1].beginToken.getMorphClassInDictionary().isNoun) 
                    res.coef -= (2);
            }
        }
        PersonIdentityToken.correctCoefAfterLastname(res, pits, ind + 2);
        if (ind > 0 && res.coef > 0 && pits[ind].isHiphenBefore) {
            let b1 = pits[ind].kit.statistics.getBigrammInfo(pits[ind - 1].beginToken, pits[ind].beginToken);
            if (b1 !== null && b1.secondCount === b1.pairCount) {
                let res0 = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 1].endToken, FioTemplateType.NAMESURNAME);
                PersonIdentityToken.manageFirstname(res0, pits[ind - 1], inf);
                res.firstname = PersonMorphCollection.addPrefix(res0.firstname, res.firstname);
                res.coef++;
                res.beginToken = pits[ind - 1].beginToken;
            }
        }
        if (BracketHelper.canBeStartOfSequence(res.beginToken.previous, false, false) && BracketHelper.canBeEndOfSequence(res.endToken.next, false, null, false)) 
            res.coef -= (2);
        let bi = pits[0].beginToken.kit.statistics.getInitialInfo(pits[ind].value, pits[ind + 1].beginToken);
        if (bi !== null && bi.pairCount > 0) 
            res.coef += (2);
        if ((!pits[0].isInDictionary && pits[1].lastname !== null && pits[1].lastname.isLastnameHasStdTail) && !pits[1].isInDictionary) 
            res.coef += 0.5;
        if (res.firstname !== null && pits[ind].beginToken.isValue("СЛАВА", null)) 
            res.coef -= (3);
        else if (PersonIdentityToken.checkLatinAfter(res) !== null) 
            res.coef += (2);
        if (pits[0].firstname === null || ((pits[0].firstname !== null && !pits[0].firstname.isInDictionary))) {
            if (pits[0].beginToken.getMorphClassInDictionary().isProperGeo && pits[1].lastname !== null && pits[1].lastname.isInOntology) 
                res.coef -= (2);
        }
        if (ind === 0 && pits.length === 2 && pits[0].chars.isLatinLetter) {
            if (pits[0].firstname !== null) {
                if (!isAttrBefore && (pits[0].beginToken.previous instanceof TextToken) && pits[0].beginToken.previous.chars.isCapitalUpper) 
                    res.coef -= (1);
                else 
                    res.coef += (1);
            }
            if (pits[0].chars.isAllUpper && pits[1].chars.isCapitalUpper) 
                res.coef = 0;
        }
        else if (ind === 0 && pits.length === 2 && pits[1].isInDictionary) {
            if (pits[0].isInDictionary) 
                res.coef -= (1);
            else if (pits[1].lastname === null || !pits[1].lastname.isInDictionary) {
                mc = pits[1].getMorphClassInDictionary();
                if (mc.isVerb && !mc.isAdjective) 
                    res.coef -= (1);
            }
        }
        if (ind === 0 && pits.length === 2 && pits[1].middlename !== null) {
            let t0 = pits[0].beginToken;
            if (t0.previous !== null && t0.previous.isComma) 
                t0 = t0.previous;
            if ((t0.previous instanceof TextToken) && t0.previous.isNewlineBefore) {
                let li = MailLine.parse(t0.previous, 0, 0);
                if (li !== null && li.typ === MailLineTypes.HELLO) 
                    return null;
            }
        }
        if ((ind === 0 && pits.length === 3 && pits[2].middlename !== null) && pits[1].firstname !== null) 
            res.coef--;
        return res;
    }
    
    static tryAttachNameSecnameSurname(pits, ind, inf, prevHasThisTyp = false) {
        if ((ind + 2) >= pits.length || pits[ind].typ !== PersonItemTokenItemType.VALUE || pits[ind + 2].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[ind].isNewlineAfter) {
            if ((pits.length === 3 && pits[0].firstname !== null && pits[1].middlename !== null) && pits[2].lastname !== null) {
            }
            else 
                return null;
        }
        if (pits[ind + 2].lastname === null && !prevHasThisTyp && !pits[ind].morph.language.isEn) 
            return null;
        if (pits[ind].beginToken.chars.isAllUpper && !pits[ind + 2].beginToken.chars.isAllUpper) {
            if (pits[ind].firstname === null || !pits[ind].firstname.isInDictionary) 
                return null;
        }
        if (pits[ind + 1].beginToken.chars.isAllUpper && !pits[ind + 2].beginToken.chars.isAllUpper && pits[ind + 1].typ === PersonItemTokenItemType.VALUE) {
            if (pits[ind + 1].middlename === null || !pits[ind + 1].middlename.isInDictionary) 
                return null;
        }
        let ok = false;
        let needTestNameSurname = false;
        let addCoef = 0;
        if (pits[ind + 1].typ === PersonItemTokenItemType.INITIAL) 
            ok = true;
        else if (pits[ind + 1].typ === PersonItemTokenItemType.VALUE && pits[ind + 1].middlename !== null) 
            ok = true;
        else if (pits[ind + 1].typ === PersonItemTokenItemType.VALUE && pits[ind + 2].firstname === null) {
            let b1 = pits[0].kit.statistics.getBigrammInfo(pits[ind + 1].beginToken, pits[ind + 2].beginToken);
            let b2 = pits[0].kit.statistics.getBigrammInfo(pits[ind].beginToken, pits[ind + 2].beginToken);
            if (b1 !== null) {
                if (b1.pairCount === b1.firstCount && b1.pairCount === b1.secondCount) {
                    ok = true;
                    let b3 = pits[0].kit.statistics.getBigrammInfo(pits[ind].beginToken, pits[ind + 1].beginToken);
                    if (b3 !== null) {
                        if (b3.secondCount > b3.pairCount) 
                            ok = false;
                        else if (b3.secondCount === b3.pairCount && pits[ind + 2].isHiphenBefore) 
                            ok = false;
                    }
                }
                else if (b2 !== null && (b2.pairCount + b1.pairCount) === b1.secondCount) 
                    ok = true;
            }
            else if ((ind + 3) === pits.length && pits[ind + 2].lastname !== null && !pits[ind + 2].isInDictionary) 
                ok = true;
            if (!ok) {
                b1 = pits[0].kit.statistics.getInitialInfo(pits[ind].value, pits[ind + 2].beginToken);
                if (b1 !== null && b1.pairCount > 0) {
                    ok = true;
                    addCoef = 2;
                }
            }
            if (!ok) {
                let wi = pits[0].kit.statistics.getWordInfo(pits[ind + 2].endToken);
                if (wi !== null && wi.lowerCount === 0) {
                    if (wi.maleVerbsAfterCount > 0 || wi.femaleVerbsAfterCount > 0) {
                        ok = true;
                        addCoef = 2;
                        needTestNameSurname = true;
                        if (pits[ind + 1].firstname !== null && pits[ind + 1].middlename === null) {
                            if (pits[ind].firstname === null && pits[ind].value !== null && pits[ind].isInDictionary) 
                                ok = false;
                        }
                        if (pits[ind + 1].lastname !== null && ((pits[ind + 1].lastname.isInDictionary || pits[ind + 1].lastname.isInOntology))) 
                            ok = false;
                    }
                }
            }
            if (!ok) {
                if ((ind === 0 && pits.length === 3 && pits[0].chars.isLatinLetter) && pits[1].chars.isLatinLetter && pits[2].chars.isLatinLetter) {
                    if (pits[0].firstname !== null && pits[2].lastname !== null) 
                        ok = true;
                }
            }
        }
        if (!ok) 
            return null;
        if (PersonIdentityToken.isBothSurnames(pits[ind], pits[ind + 2])) 
            return null;
        ok = false;
        for (let i = ind; i < (ind + 3); i++) {
            if (pits[i].typ === PersonItemTokenItemType.INITIAL) 
                ok = true;
            else if (!pits[i].isInDictionary) {
                let cla = pits[i].beginToken.getMorphClassInDictionary();
                if (cla.isProperName || cla.isProperSurname || cla.isProperSecname) 
                    ok = true;
                else if (cla.isUndefined) 
                    ok = true;
            }
        }
        if (!ok) 
            return null;
        let res = new PersonIdentityToken(pits[ind].beginToken, pits[ind + 2].endToken);
        res.typ = (pits[ind + 1].typ === PersonItemTokenItemType.INITIAL ? FioTemplateType.NAMEISURNAME : FioTemplateType.NAMESECNAMESURNAME);
        res.coef -= (ind);
        if (pits[ind + 1].middlename !== null && !pits[ind + 1].middlename.morph._case.isUndefined) {
            if ((MorphCase.ooBitand(inf._case, pits[ind + 1].middlename.morph._case)).isUndefined) 
                inf = new MorphBaseInfo();
        }
        res.morph = PersonIdentityToken.accordMorph(inf, pits[ind + 2].lastname, pits[ind].firstname, pits[ind + 1].middlename, pits[ind + 2].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
            res.coef += (1);
            inf = res.morph;
        }
        PersonIdentityToken.manageFirstname(res, pits[ind], inf);
        PersonIdentityToken.manageLastname(res, pits[ind + 2], inf);
        if (pits[ind + 1].middlename !== null && pits[ind + 1].middlename.vars.length > 0) {
            res.coef++;
            res.middlename = pits[ind + 1].middlename.vars[0].value;
            if (pits[ind + 1].middlename.vars.length > 1) {
                res.middlename = new PersonMorphCollection();
                PersonIdentityToken.setValue2(Utils.as(res.middlename, PersonMorphCollection), pits[ind + 1].middlename, inf);
            }
            if (pits[ind + 2].lastname !== null) {
                if (pits[ind + 2].lastname.isInDictionary || pits[ind + 2].lastname.isLastnameHasStdTail || pits[ind + 2].lastname.isHasStdPostfix) 
                    res.coef++;
            }
        }
        else if (pits[ind + 1].typ === PersonItemTokenItemType.INITIAL) {
            res.middlename = pits[ind + 1].value;
            res.coef++;
            if (pits[ind + 2].lastname !== null) {
            }
            else {
                let npt = NounPhraseHelper.tryParse(pits[ind + 2].beginToken, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPREPOSITION.value()) | (NounPhraseParseAttr.PARSEPRONOUNS.value()) | (NounPhraseParseAttr.PARSEADVERBS.value())), 0, null);
                if (npt !== null && npt.endChar > pits[ind + 2].endChar) 
                    res.coef -= (2);
            }
        }
        else if (pits[ind + 1].firstname !== null && pits[ind + 2].middlename !== null && pits.length === 3) 
            res.coef -= (2);
        else {
            PersonIdentityToken.manageMiddlename(res, pits[ind + 1], inf);
            res.coef += (0.5);
        }
        if (!pits[ind].chars.equals(pits[ind + 2].chars)) {
            res.coef -= (1);
            if (pits[ind].chars.isAllUpper) 
                res.coef -= (1);
        }
        else if (pits[ind + 1].typ !== PersonItemTokenItemType.INITIAL && !pits[ind].chars.equals(pits[ind + 1].chars)) 
            res.coef -= (1);
        PersonIdentityToken.correctCoefAfterLastname(res, pits, ind + 3);
        res.coef += (addCoef);
        if (pits[ind].isInDictionary && pits[ind + 1].isInDictionary && pits[ind + 2].isInDictionary) 
            res.coef--;
        return res;
    }
    
    static tryAttachNameSecname(pits, ind, inf, prevHasThisTyp = false) {
        if ((ind !== 0 || (ind + 2) !== pits.length || pits[ind].typ !== PersonItemTokenItemType.VALUE) || pits[ind + 1].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[ind].isNewlineAfter) 
            return null;
        if (pits[ind].firstname === null || pits[ind + 1].middlename === null) 
            return null;
        let res = new PersonIdentityToken(pits[ind].beginToken, pits[ind + 1].endToken);
        res.typ = FioTemplateType.NAMESECNAME;
        res.morph = PersonIdentityToken.accordMorph(inf, null, pits[ind].firstname, pits[ind + 1].middlename, pits[ind + 1].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
            res.coef += (1);
            inf = res.morph;
        }
        PersonIdentityToken.manageFirstname(res, pits[ind], inf);
        PersonIdentityToken.manageMiddlename(res, pits[ind + 1], inf);
        res.coef = 2;
        return res;
    }
    
    static correctCoefAfterLastname(res, pits, ind) {
        if (!pits[ind - 1].isNewlineAfter) {
            let pat = PersonAttrToken.tryAttach(pits[ind - 1].beginToken, PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD);
            if (pat !== null) 
                res.coef -= (1);
        }
        if (ind >= pits.length) {
            if (PersonIdentityToken.checkLatinAfter(res) !== null) 
                res.coef += (2);
            let te = pits[ind - 1].endToken;
            let stat = te.kit.statistics.getWordInfo(te);
            if (stat !== null) {
                if (stat.hasBeforePersonAttr) 
                    res.coef++;
            }
            te = pits[ind - 1].endToken.next;
            if (te === null) 
                return;
            if (PersonHelper.isPersonSayOrAttrAfter(te)) {
                res.coef++;
                if (res.chars.isLatinLetter && res.typ === FioTemplateType.NAMESURNAME) 
                    res.coef += (2);
            }
            if (!te.chars.isLetter && !te.chars.isAllLower) 
                return;
            let wi = te.kit.statistics.getWordInfo(te);
            if (wi !== null) {
                if (wi.lowerCount > 0) 
                    res.coef--;
                else if ((wi.femaleVerbsAfterCount + wi.maleVerbsAfterCount) > 0) 
                    res.coef++;
            }
            return;
        }
        if (ind === 0) 
            return;
        if (pits[ind].typ === PersonItemTokenItemType.VALUE && ((pits[ind].firstname === null || ind === (pits.length - 1)))) {
            let b1 = pits[0].kit.statistics.getBigrammInfo(pits[ind - 1].beginToken, pits[ind].beginToken);
            if ((b1 !== null && b1.firstCount === b1.pairCount && b1.secondCount === b1.pairCount) && b1.pairCount > 0) {
                let ok = false;
                if (b1.pairCount > 1 && pits[ind].whitespacesBeforeCount === 1) 
                    ok = true;
                else if (pits[ind].isHiphenBefore && pits[ind].lastname !== null) 
                    ok = true;
                if (ok) {
                    let res1 = new PersonIdentityToken(pits[ind].beginToken, pits[ind].endToken);
                    PersonIdentityToken.manageLastname(res1, pits[ind], res.morph);
                    res.lastname = PersonMorphCollection.addPrefix(res.lastname, res1.lastname);
                    res.endToken = pits[ind].endToken;
                    res.coef++;
                    ind++;
                    if (ind >= pits.length) 
                        return;
                }
            }
        }
        if (pits[ind - 1].whitespacesBeforeCount > pits[ind - 1].whitespacesAfterCount) 
            res.coef -= (1);
        else if (pits[ind - 1].whitespacesBeforeCount === pits[ind - 1].whitespacesAfterCount) {
            if (pits[ind].lastname !== null || pits[ind].firstname !== null) {
                if (!pits[ind].isInDictionary) 
                    res.coef -= (1);
            }
        }
    }
    
    static correctCoefForLastname(pit, it) {
        if (it.beginToken !== it.endToken) 
            return;
        let tt = Utils.as(it.beginToken, TextToken);
        if (tt === null) 
            return;
        let inDic = false;
        let hasStd = false;
        for (const wf of tt.morph.items) {
            if (wf._class.isProperSurname) {
            }
            else if (wf.isInDictionary) 
                inDic = true;
        }
        if (it.lastname !== null) 
            hasStd = it.lastname.isLastnameHasStdTail;
        if (!hasStd && inDic) 
            pit.coef -= 1.5;
    }
    
    static tryAttachSurnameName(pits, ind, inf, prevHasThisTyp = false) {
        if ((ind + 1) >= pits.length || pits[ind + 1].typ !== PersonItemTokenItemType.VALUE || pits[ind].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[ind].lastname === null && !prevHasThisTyp) 
            return null;
        if (PersonIdentityToken.isBothSurnames(pits[ind], pits[ind + 1])) 
            return null;
        if (pits[ind + 1].beginToken.chars.isAllUpper && !pits[ind].beginToken.chars.isAllUpper) {
            if (pits[ind + 1].firstname === null || !pits[ind + 1].firstname.isInDictionary) 
                return null;
        }
        let res = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 1].endToken, FioTemplateType.SURNAMENAME);
        res.coef -= (ind);
        if (pits[ind].isNewlineAfter) {
            res.coef--;
            if (pits[ind].whitespacesAfterCount > 15) 
                res.coef--;
        }
        res.morph = PersonIdentityToken.accordMorph(inf, pits[ind].lastname, pits[ind + 1].firstname, null, pits[ind + 1].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
            if (pits[ind].lastname !== null && !pits[ind].lastname.morph._case.isUndefined) 
                res.coef += (1);
            inf = res.morph;
        }
        PersonIdentityToken.manageLastname(res, pits[ind], inf);
        PersonIdentityToken.manageFirstname(res, pits[ind + 1], inf);
        PersonIdentityToken.correctCoefForLastname(res, pits[ind]);
        if (!pits[ind].chars.equals(pits[ind + 1].chars)) {
            res.coef -= (1);
            if (pits[ind + 1].firstname === null || !pits[ind + 1].firstname.isInDictionary || pits[ind + 1].chars.isAllUpper) 
                res.coef -= (1);
        }
        else if (pits[ind].chars.isAllUpper) 
            res.coef -= (0.5);
        if (pits[ind + 1].isInDictionary && ((pits[ind + 1].firstname === null || !pits[ind + 1].firstname.isInDictionary))) 
            res.coef -= (1);
        PersonIdentityToken.correctCoefAfterName(res, pits, ind + 2);
        let npt = NounPhraseHelper.tryParse(pits[ind + 1].endToken, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null && npt.endToken !== pits[ind + 1].endToken) 
            res.coef -= (1);
        if (ind === 0) 
            PersonIdentityToken.correctCoefSNS(res, pits, ind + 2);
        if (pits[ind].endToken.next.isHiphen) 
            res.coef -= (2);
        if (BracketHelper.canBeStartOfSequence(res.beginToken.previous, false, false) && BracketHelper.canBeEndOfSequence(res.endToken.next, false, null, false)) 
            res.coef -= (2);
        if (pits[ind].isInDictionary) {
            let mc = pits[ind].beginToken.getMorphClassInDictionary();
            if (mc.isPronoun || mc.isPersonalPronoun) 
                return null;
        }
        if (((pits.length === 2 && ind === 0 && pits[0].chars.isAllUpper) && pits[1].chars.isCapitalUpper && !pits[1].isInDictionary) && (res.coef < 0)) {
            if (pits[1].lastname !== null && ((pits[1].lastname.isHasStdPostfix || pits[1].lastname.isInDictionary || pits[1].lastname.isLastnameHasStdTail))) {
            }
            else 
                res.coef = 0;
        }
        if (pits.length === 2 && ind === 0 && pits[1].beginToken.isValue("ЛАВРА", null)) {
            if (pits[0].endToken.morph._class.isAdjective) 
                return null;
        }
        return res;
    }
    
    static correctCoefSNS(res, pits, indAfter) {
        if (indAfter >= pits.length) 
            return;
        if (pits[0].lastname === null || !pits[0].lastname.isLastnameHasStdTail) {
            let stat = pits[0].kit.statistics.getWordInfo(pits[1].beginToken);
            let statA = pits[0].kit.statistics.getWordInfo(pits[2].beginToken);
            let statB = pits[0].kit.statistics.getWordInfo(pits[0].beginToken);
            if (stat !== null && statA !== null && statB !== null) {
                if (stat.likeCharsAfterWords !== null && stat.likeCharsBeforeWords !== null) {
                    let couA = 0;
                    let couB = 0;
                    let wrapcouA2580 = new RefOutArgWrapper();
                    stat.likeCharsAfterWords.tryGetValue(statA, wrapcouA2580);
                    couA = wrapcouA2580.value;
                    let wrapcouB2579 = new RefOutArgWrapper();
                    stat.likeCharsBeforeWords.tryGetValue(statB, wrapcouB2579);
                    couB = wrapcouB2579.value;
                    if (couA === stat.totalCount && (couB < stat.totalCount)) 
                        res.coef -= (2);
                }
            }
            return;
        }
        if (pits[1].firstname === null) 
            return;
        let middle = null;
        if (indAfter > 2 && pits[2].middlename !== null) 
            middle = pits[2].middlename;
        let inf = new MorphBaseInfo();
        let mi1 = PersonIdentityToken.accordMorph(inf, pits[0].lastname, pits[1].firstname, middle, null);
        if (mi1._case.isUndefined) 
            res.coef -= (1);
        if (pits[indAfter].lastname === null || !pits[indAfter].lastname.isLastnameHasStdTail) 
            return;
        let mi2 = PersonIdentityToken.accordMorph(inf, pits[indAfter].lastname, pits[1].firstname, middle, pits[indAfter].endToken.next);
        if (!mi2._case.isUndefined) 
            res.coef -= (1);
    }
    
    static tryAttachSurnameNameSecname(pits, ind, inf, prevHasThisTyp = false, always = false) {
        if ((ind + 2) >= pits.length || pits[ind + 1].typ !== PersonItemTokenItemType.VALUE || pits[ind].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[ind].lastname === null && !prevHasThisTyp) {
            if (ind > 0) 
                return null;
            if (pits.length === 3 && !always) {
                let tt1 = pits[2].endToken.next;
                if (tt1 !== null && tt1.isComma) 
                    tt1 = tt1.next;
                if (tt1 !== null && !tt1.isNewlineBefore && PersonAttrToken.tryAttach(tt1, PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD) !== null) {
                }
                else 
                    return null;
            }
        }
        if (!always) {
            if (PersonIdentityToken.isBothSurnames(pits[ind], pits[ind + 2])) 
                return null;
            if (PersonIdentityToken.isBothSurnames(pits[ind], pits[ind + 1])) {
                if (pits.length === 3 && ind === 0 && pits[2].middlename !== null) {
                }
                else 
                    return null;
            }
        }
        if (pits[ind + 1].beginToken.chars.isAllUpper && !pits[ind].beginToken.chars.isAllUpper) {
            if (pits[ind + 1].firstname === null || !pits[ind + 1].firstname.isInDictionary) 
                return null;
        }
        if (pits[ind + 2].beginToken.chars.isAllUpper && !pits[ind].beginToken.chars.isAllUpper && pits[ind + 2].typ === PersonItemTokenItemType.VALUE) {
            if (pits[ind + 2].middlename === null || !pits[ind + 2].middlename.isInDictionary) 
                return null;
        }
        let res = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 2].endToken, FioTemplateType.SURNAMENAMESECNAME);
        if (pits[ind + 2].middlename === null) {
            if ((ind + 2) === (pits.length - 1) && prevHasThisTyp) 
                res.coef += (1);
            else if (pits[ind + 1].firstname !== null && pits[ind + 2].firstname !== null) {
            }
            else if (!always) 
                return null;
        }
        res.coef -= (ind);
        if (pits[ind].isNewlineAfter) {
            if (pits[ind].isNewlineBefore && pits[ind + 2].isNewlineAfter) {
            }
            else if (pits[ind].beginToken.previous !== null && pits[ind].beginToken.previous.isTableControlChar) {
            }
            else {
                res.coef--;
                if (pits[ind].whitespacesAfterCount > 15) 
                    res.coef--;
            }
        }
        if (pits[ind + 1].isNewlineAfter) {
            if (pits[ind].isNewlineBefore && pits[ind + 2].isNewlineAfter) {
            }
            else if (pits[ind].beginToken.previous !== null && pits[ind].beginToken.previous.isTableControlChar) {
            }
            else {
                res.coef--;
                if (pits[ind + 1].whitespacesAfterCount > 15) 
                    res.coef--;
            }
        }
        if (pits[ind + 2].middlename !== null && !pits[ind + 2].middlename.morph._case.isUndefined) {
            if ((MorphCase.ooBitand(inf._case, pits[ind + 2].middlename.morph._case)).isUndefined) 
                inf = new MorphBaseInfo();
        }
        res.morph = PersonIdentityToken.accordMorph(inf, pits[ind].lastname, pits[ind + 1].firstname, pits[ind + 2].middlename, pits[ind + 2].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) {
            res.coef += 1.5;
            inf = res.morph;
        }
        PersonIdentityToken.manageLastname(res, pits[ind], inf);
        PersonIdentityToken.correctCoefForLastname(res, pits[ind]);
        PersonIdentityToken.manageFirstname(res, pits[ind + 1], inf);
        if (pits[ind + 2].middlename !== null && pits[ind + 2].middlename.vars.length > 0) {
            res.coef++;
            res.middlename = pits[ind + 2].middlename.vars[0].value;
            if (pits[ind + 2].middlename.vars.length > 1) {
                res.middlename = new PersonMorphCollection();
                PersonIdentityToken.setValue2(Utils.as(res.middlename, PersonMorphCollection), pits[ind + 2].middlename, inf);
            }
            if (pits[ind + 1].firstname !== null && pits.length === 3 && !pits[ind].isInDictionary) 
                res.coef++;
        }
        else 
            PersonIdentityToken.manageMiddlename(res, pits[ind + 2], inf);
        if (!pits[ind].chars.equals(pits[ind + 1].chars) || !pits[ind].chars.equals(pits[ind + 2].chars)) {
            res.coef -= (1);
            if (pits[ind].chars.isAllUpper && pits[ind + 1].chars.isCapitalUpper && pits[ind + 2].chars.isCapitalUpper) 
                res.coef += (2);
        }
        let tt = Utils.as(pits[ind].beginToken, TextToken);
        if (tt !== null) {
            if (tt.isValue("УВАЖАЕМЫЙ", null) || tt.isValue("ДОРОГОЙ", null)) 
                res.coef -= (2);
        }
        PersonIdentityToken.correctCoefAfterName(res, pits, ind + 3);
        if (ind === 0) 
            PersonIdentityToken.correctCoefSNS(res, pits, ind + 3);
        if (pits[ind].isInDictionary && pits[ind + 1].isInDictionary && pits[ind + 2].isInDictionary) 
            res.coef--;
        else if (pits[ind].isInDictionary && pits[ind].chars.isCapitalUpper && MiscHelper.canBeStartOfSentence(pits[ind].beginToken)) {
            let mc = pits[ind].beginToken.getMorphClassInDictionary();
            if ((mc.isAdverb || mc.isVerb || mc.isPreposition) || mc.isConjunction) 
                res.coef--;
        }
        return res;
    }
    
    static correctCoefAfterName(res, pits, ind) {
        if (ind >= pits.length) 
            return;
        if (ind === 0) 
            return;
        if (pits[ind - 1].whitespacesBeforeCount > pits[ind - 1].whitespacesAfterCount) 
            res.coef -= (1);
        else if (pits[ind - 1].whitespacesBeforeCount === pits[ind - 1].whitespacesAfterCount) {
            if (pits[ind].lastname !== null || pits[ind].firstname !== null || pits[ind].middlename !== null) 
                res.coef -= (1);
        }
        let t = pits[ind - 1].endToken.next;
        if (t !== null && t.next !== null && t.next.isChar(',')) 
            t = t.next;
        if (t !== null) {
            if (PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD) !== null) 
                res.coef += (1);
        }
    }
    
    static _calcCoefAfter(tt) {
        if (tt !== null && tt.isComma) 
            tt = tt.next;
        let attr = PersonAttrToken.tryAttach(tt, PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD);
        if (attr !== null && attr.age !== null) 
            return 3;
        if (tt !== null && tt.getReferent() !== null && tt.getReferent().typeName === "DATE") {
            let co = 1;
            if (tt.next !== null && tt.next.isValue("Р", null)) 
                co += (2);
            return co;
        }
        return 0;
    }
    
    static tryAttachSurnameII(pits, ind, inf) {
        if ((ind + 1) >= pits.length || pits[ind + 1].typ !== PersonItemTokenItemType.INITIAL || pits[ind].typ === PersonItemTokenItemType.INITIAL) 
            return null;
        if (pits[ind].isNewlineAfter) 
            return null;
        if (pits[ind].lastname === null) 
            return null;
        let res = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 1].endToken, FioTemplateType.SURNAMEI);
        res.coef -= (ind);
        PersonIdentityToken.manageLastname(res, pits[ind], inf);
        if (pits[ind].isAsianItem(false) && pits[ind].lastname !== null && pits[ind].lastname.isChinaSurname) {
        }
        else if (pits[ind].firstname !== null && pits[ind].firstname.isInDictionary) {
            if (pits[ind].lastname === null || !pits[ind].lastname.isLastnameHasStdTail) {
                if ((ind === 0 && pits.length === 3 && !pits[1].isNewlineAfter) && !pits[2].isWhitespaceAfter) {
                }
                else 
                    res.coef -= (2);
            }
        }
        res.morph = (pits[ind].lastname === null ? pits[ind].morph : pits[ind].lastname.morph);
        if (res.lastname.gender !== MorphGender.UNDEFINED) 
            res.morph.gender = res.lastname.gender;
        if (pits[ind].whitespacesAfterCount < 2) 
            res.coef += (0.5);
        res.firstname = new PersonMorphCollection();
        res.firstname.add(pits[ind + 1].value, null, MorphGender.UNDEFINED, false);
        let i1 = ind + 2;
        if ((i1 < pits.length) && pits[i1].typ === PersonItemTokenItemType.INITIAL) {
            res.typ = FioTemplateType.SURNAMEII;
            res.endToken = pits[i1].endToken;
            res.middlename = pits[i1].value;
            if (pits[i1].whitespacesBeforeCount < 2) 
                res.coef += (0.5);
            i1++;
        }
        if (i1 >= pits.length) {
            if (pits[0].lastname !== null && ((pits[0].lastname.isInDictionary || pits[0].lastname.isInOntology)) && pits[0].firstname === null) 
                res.coef++;
            return res;
        }
        if (pits[ind].whitespacesAfterCount > pits[i1].whitespacesBeforeCount) 
            res.coef--;
        else if (pits[ind].whitespacesAfterCount === pits[i1].whitespacesBeforeCount && pits[i1].lastname !== null) {
            if ((i1 + 3) === pits.length && pits[i1 + 1].typ === PersonItemTokenItemType.INITIAL && pits[i1 + 2].typ === PersonItemTokenItemType.INITIAL) {
            }
            else {
                if (pits[i1].isInDictionary && pits[i1].beginToken.getMorphClassInDictionary().isNoun) {
                }
                else 
                    res.coef--;
                let ok = true;
                for (let tt = pits[ind].beginToken; tt !== null; tt = tt.previous) {
                    if (tt.isNewlineBefore) 
                        break;
                    else if (tt.getReferent() !== null && !(tt.getReferent() instanceof PersonReferent)) {
                        ok = false;
                        break;
                    }
                    else if ((tt instanceof TextToken) && tt.chars.isLetter && tt !== pits[ind].beginToken) {
                        ok = false;
                        break;
                    }
                }
                if (ok) 
                    res.coef++;
            }
        }
        let mc = pits[0].beginToken.getMorphClassInDictionary();
        if (!mc.isProper && mc.isNoun) {
            if (((pits[0].beginToken.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.PLURAL.value())) 
                res.coef--;
            else if (pits[0].beginToken.isValue("ГЛАВА", null) || pits[0].beginToken.isValue("ЧАСТЬ", "ЧАСТИНА") || pits[0].beginToken.isValue("СТАТЬЯ", "СТАТТЯ")) 
                return null;
        }
        return res;
    }
    
    static tryAttachIISurname(pits, ind, inf) {
        if ((ind + 1) >= pits.length || pits[ind].typ !== PersonItemTokenItemType.INITIAL) 
            return null;
        if (ind > 0) {
            if (pits[ind - 1].typ === PersonItemTokenItemType.INITIAL) 
                return null;
        }
        if (pits[ind].isNewlineAfter) 
            return null;
        let res = PersonIdentityToken._new2571(pits[ind].beginToken, pits[ind + 1].endToken, FioTemplateType.ISURNAME);
        res.coef -= (ind);
        res.firstname = new PersonMorphCollection();
        res.firstname.add(pits[ind].value, null, MorphGender.UNDEFINED, false);
        let i1 = ind + 1;
        if (pits[i1].typ === PersonItemTokenItemType.INITIAL) {
            res.typ = FioTemplateType.IISURNAME;
            res.middlename = pits[i1].value;
            if (pits[i1].whitespacesBeforeCount < 2) 
                res.coef += (0.5);
            i1++;
        }
        if (i1 >= pits.length || pits[i1].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if (pits[i1].isNewlineBefore && !pits[i1].isNewlineAfter) 
            return null;
        res.endToken = pits[i1].endToken;
        let prev = null;
        if (!pits[ind].isNewlineBefore) {
            if (ind > 0) 
                prev = pits[ind - 1];
            else {
                prev = PersonItemToken.tryAttach(pits[ind].beginToken.previous, (pits[i1].chars.isLatinLetter ? PersonItemTokenParseAttr.CANBELATIN : PersonItemTokenParseAttr.NO), null);
                if (prev !== null) {
                    if (PersonAttrToken.tryAttachWord(prev.beginToken, true) !== null) {
                        prev = null;
                        res.coef++;
                    }
                }
            }
        }
        PersonIdentityToken.manageLastname(res, pits[i1], inf);
        if (pits[i1].lastname !== null && pits[i1].lastname.isInOntology) 
            res.coef++;
        if (pits[i1].firstname !== null && pits[i1].firstname.isInDictionary) {
            if (pits[i1].lastname === null || ((!pits[i1].lastname.isLastnameHasStdTail && !pits[i1].lastname.isInOntology))) 
                res.coef -= (2);
        }
        if (prev !== null) {
            let mc = prev.beginToken.getMorphClassInDictionary();
            if (mc.isPreposition || mc.isAdverb || mc.isVerb) {
                res.coef += (ind);
                if (pits[i1].lastname !== null) {
                    if (pits[i1].lastname.isInDictionary || pits[i1].lastname.isInOntology) 
                        res.coef += (1);
                }
            }
            if (prev.lastname !== null && ((prev.lastname.isLastnameHasStdTail || prev.lastname.isInDictionary))) 
                res.coef -= (1);
        }
        res.morph = (pits[i1].lastname === null ? pits[i1].morph : pits[i1].lastname.morph);
        if (res.lastname.gender !== MorphGender.UNDEFINED) 
            res.morph.gender = res.lastname.gender;
        if (pits[i1].whitespacesBeforeCount < 2) {
            if (!pits[ind].isNewlineBefore && (pits[ind].whitespacesBeforeCount < 2) && prev !== null) {
            }
            else 
                res.coef += (0.5);
        }
        if (prev === null) {
            if (pits[ind].isNewlineBefore && pits[i1].isNewlineAfter) 
                res.coef += (1);
            else if (pits[i1].endToken.next !== null && ((pits[i1].endToken.next.isCharOf(";,.") || pits[i1].endToken.next.morph._class.isConjunction))) 
                res.coef += (1);
            else if (pits[i1].isNewlineAfter) 
                res.coef += (1);
            return res;
        }
        if (prev.whitespacesAfterCount < pits[i1].whitespacesBeforeCount) 
            res.coef--;
        else if (prev.whitespacesAfterCount === pits[i1].whitespacesBeforeCount && prev.lastname !== null) 
            res.coef--;
        return res;
    }
    
    static tryAttachKing(pits, ind, inf, prevHasThisTyp = false) {
        if (ind > 0 || ind >= pits.length) 
            return null;
        if (pits[0].isNewlineBefore) 
            return null;
        if (pits[0].firstname === null) {
            if (pits[0].isInDictionary || !pits[0].chars.isCyrillicLetter) 
                return null;
        }
        if (pits[0].beginToken.isValue("ТОМ", null)) 
            return null;
        if (pits[0].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        let i = 0;
        if (pits.length > 1 && ((pits[1].firstname !== null || pits[1].middlename !== null))) 
            i++;
        let num = 0;
        let roman = false;
        let ok = false;
        let t = pits[i].endToken.next;
        let numt = null;
        if (t instanceof NumberToken) {
            if (pits[i].whitespacesAfterCount > 2) 
                return null;
            if (t.chars.isAllLower || t.intValue === null) 
                return null;
            num = t.intValue;
            numt = t;
            if (!t.morph._class.isAdjective) 
                return null;
        }
        else {
            if (((i + 2) < pits.length) && pits[i + 1].typ === PersonItemTokenItemType.INITIAL) 
                return null;
            let nt = NumberHelper.tryParseRoman(t);
            if ((nt !== null && nt.intValue !== null && nt.value !== "100") && (nt.whitespacesBeforeCount < 3) && t.chars.isAllUpper) {
                num = nt.intValue;
                roman = true;
                t = (numt = nt.endToken);
            }
        }
        if (num < 1) {
            if (((pits[0].firstname !== null || pits.length === 1)) && prevHasThisTyp) {
                if (pits.length === 1) 
                    ok = true;
                else if (pits.length === 2 && ((pits[0].endToken.next.isHiphen || pits[1].firstname !== null))) 
                    ok = true;
            }
            if (!ok) 
                return null;
        }
        let res = PersonIdentityToken._new2571(pits[0].beginToken, pits[0].endToken, FioTemplateType.KING);
        res.morph = PersonIdentityToken.accordMorph(inf, null, pits[0].firstname, (pits.length === 2 ? ((pits[1].middlename != null ? pits[1].middlename : pits[1].firstname)) : null), pits[(pits.length === 2 ? 1 : 0)].endToken.next);
        if (res.morph.gender === MorphGender.MASCULINE || res.morph.gender === MorphGender.FEMINIE) 
            inf = res.morph;
        if (inf.gender !== MorphGender.FEMINIE && inf.gender !== MorphGender.MASCULINE && !roman) 
            return null;
        if (pits[0].firstname !== null) 
            PersonIdentityToken.manageFirstname(res, pits[0], inf);
        else 
            PersonIdentityToken.manageLastname(res, pits[0], inf);
        if (i > 0) {
            PersonIdentityToken.manageMiddlename(res, pits[1], inf);
            res.endToken = pits[1].endToken;
        }
        if (num > 0) {
            if (res.firstname === null && res.lastname !== null) 
                res.firstname = res.lastname;
            res.lastname = new PersonMorphCollection();
            res.lastname.number = num;
            res.endToken = numt;
            if (i === 0 && (numt.whitespacesAfterCount < 2)) {
                let pits1 = PersonItemToken.tryAttachList(numt.next, PersonItemTokenParseAttr.NO, 2);
                if (pits1 !== null && pits1.length === 1 && pits1[0].firstname !== null) {
                    PersonIdentityToken.manageMiddlename(res, pits1[0], inf);
                    res.endToken = pits1[0].endToken;
                }
            }
        }
        res.coef = (num > 0 ? 3 : 2);
        return res;
    }
    
    static tryAttachArabic(pits, ind, inf, prevHasThisTyp = false) {
        if (ind > 0 || (pits.length < 4)) 
            return null;
        let i = 0;
        let hasHiph = false;
        let errs = 0;
        for (i = 0; i < pits.length; i++) {
            let p = pits[i];
            if (i > 0 && p.whitespacesBeforeCount > 2) 
                break;
            if (p.middlename !== null || p.value === null) 
                return null;
            if (p.value.indexOf('-') > 0) {
                hasHiph = true;
                continue;
            }
            if (!p.chars.isCapitalUpper) 
                break;
            if (p.isInDictionary && p.firstname === null) 
                errs++;
        }
        if ((i < 4) || errs > 1) 
            return null;
        if ((((i < 5) || i !== pits.length)) && !hasHiph) {
            if (((pits.length === 4 && i === pits.length && pits[0].firstname !== null) && pits[1].firstname !== null && pits[2].firstname !== null) && pits[3].firstname === null && pits[3].middlename === null) {
            }
            else 
                return null;
        }
        let res = PersonIdentityToken._new2571(pits[0].beginToken, pits[i - 1].endToken, FioTemplateType.ARABICLONG);
        res.coef = (hasHiph ? 3 : 2);
        res.morph = pits[0].morph;
        res.lastname = new PersonMorphCollection();
        if (pits[0].firstname !== null) {
            PersonIdentityToken.manageFirstname(res, pits[0], inf);
            res.lastname = res.firstname;
            res.firstname = null;
        }
        else if (pits[0].lastname !== null) 
            PersonIdentityToken.manageLastname(res, pits[0], inf);
        else 
            res.lastname.items.push(PersonMorphCollection.PersonMorphVariant._new2574(pits[0].value));
        for (let j = 1; j < i; j++) {
            let p = pits[j];
            for (const v of res.lastname.items) {
                v.value = (v.value + " " + p.value);
            }
        }
        return res;
    }
    
    static tryAttachAsian(pits, ind, inf, cou, prevHasThisTyp = false) {
        if (ind > 0 || ind >= pits.length || ((pits.length !== cou && pits.length !== (cou * 2)))) 
            return null;
        if (pits[0].lastname !== null && pits[0].lastname.isChinaSurname && pits[0].chars.isCapitalUpper) {
            if (cou === 3) {
                if (!pits[1].isAsianItem(false)) 
                    return null;
                if (!pits[2].isAsianItem(true)) 
                    return null;
            }
            else if (cou === 2) {
                if (pits[1].typ !== PersonItemTokenItemType.VALUE) 
                    return null;
            }
        }
        else if (cou === 3) {
            if (!pits[0].isAsianItem(false)) 
                return null;
            if (!pits[1].isAsianItem(false)) 
                return null;
            if (!pits[2].isAsianItem(true)) 
                return null;
        }
        else {
            if (!pits[0].isAsianItem(false)) 
                return null;
            if (!pits[1].isAsianItem(true)) 
                return null;
        }
        let mc0 = pits[0].getMorphClassInDictionary();
        if (mc0.isPronoun && pits[1].firstname !== null) 
            return null;
        cou--;
        let isChineSur = pits[0].lastname !== null && pits[0].lastname.isChinaSurname;
        let res = PersonIdentityToken._new2571(pits[0].beginToken, pits[cou].endToken, FioTemplateType.ASIANNAME);
        if (pits[cou].lastname !== null) 
            res.morph = PersonIdentityToken.accordMorph(inf, pits[cou].lastname, null, null, pits[cou].endToken.next);
        if (!res.morph._case.isUndefined) 
            inf = res.morph;
        if (isChineSur) {
            res.typ = FioTemplateType.ASIANSURNAMENAME;
            res.coef = 2;
            if (pits[1].isAsianItem(true)) 
                res.coef += (1);
            PersonIdentityToken.manageLastname(res, pits[0], inf);
            let tr = PersonReferent._DelSurnameEnd(pits[0].value);
            if (tr !== pits[0].value) 
                res.lastname.add(tr, null, MorphGender.MASCULINE, false);
            res.firstname = new PersonMorphCollection();
            let pref = (cou === 2 ? pits[1].value : "");
            if (pits[cou].isAsianItem(false)) {
                res.firstname.add(pref + pits[cou].value, null, MorphGender.MASCULINE, false);
                res.firstname.add(pref + pits[cou].value, null, MorphGender.FEMINIE, false);
                if (pref.length > 0) {
                    res.firstname.add(pref + "-" + pits[cou].value, null, MorphGender.MASCULINE, false);
                    res.firstname.add(pref + "-" + pits[cou].value, null, MorphGender.FEMINIE, false);
                }
            }
            else {
                let v = PersonReferent._DelSurnameEnd(pits[cou].value);
                if (pref === "" && v.indexOf('-') > 0) {
                    pref = v.substring(0, 0 + v.indexOf('-'));
                    v = v.substring(v.indexOf('-') + 1);
                }
                res.firstname.add(pref + v, null, MorphGender.MASCULINE, false);
                if (pref.length > 0) 
                    res.firstname.add(pref + "-" + v, null, MorphGender.MASCULINE, false);
                let ss = pits[cou].endToken.getNormalCaseText(MorphClass.NOUN, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                if (ss !== v && ss.length <= v.length) {
                    res.firstname.add(pref + ss, null, MorphGender.MASCULINE, false);
                    if (pref.length > 0) 
                        res.firstname.add(pref + "-" + ss, null, MorphGender.MASCULINE, false);
                }
                inf.gender = MorphGender.MASCULINE;
            }
        }
        else {
            if (inf.gender === MorphGender.MASCULINE) 
                PersonIdentityToken.manageLastname(res, pits[cou], inf);
            else {
                res.lastname = new PersonMorphCollection();
                if (pits[cou].isAsianItem(false)) {
                    res.lastname.add(pits[cou].value, null, MorphGender.MASCULINE, false);
                    res.lastname.add(pits[cou].value, null, MorphGender.FEMINIE, false);
                }
                else {
                    let v = PersonReferent._DelSurnameEnd(pits[cou].value);
                    res.lastname.add(v, null, MorphGender.MASCULINE, false);
                    let ss = pits[cou].endToken.getNormalCaseText(MorphClass.NOUN, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                    if (ss !== v && ss.length <= v.length) 
                        res.lastname.add(ss, null, MorphGender.MASCULINE, false);
                    inf.gender = MorphGender.MASCULINE;
                }
            }
            if (cou === 2) {
                res.coef = 2;
                if ((res.whitespacesAfterCount < 2) && pits.length > 3) 
                    res.coef--;
                res.lastname.addPrefixStr((pits[0].value + " " + pits[1].value + " "));
            }
            else {
                res.coef = 1;
                res.lastname.addPrefixStr(pits[0].value + " ");
            }
            for (let i = 0; i < pits.length; i++) {
                if (pits[i].isInDictionary) {
                    let mc = pits[i].beginToken.getMorphClassInDictionary();
                    if ((mc.isConjunction || mc.isPronoun || mc.isPreposition) || mc.isPersonalPronoun) 
                        res.coef -= 0.5;
                }
            }
        }
        if (pits[0].value === pits[1].value) 
            res.coef -= 0.5;
        if (cou === 2) {
            if (pits[0].value === pits[2].value) 
                res.coef -= 0.5;
            if (pits[1].value === pits[2].value) 
                res.coef -= 0.5;
        }
        if (!pits[cou].isWhitespaceAfter) {
            let t = pits[cou].endToken.next;
            if (t !== null && t.isHiphen) 
                res.coef -= 0.5;
            if (BracketHelper.canBeEndOfSequence(t, false, null, false)) 
                res.coef -= 0.5;
        }
        if (BracketHelper.canBeStartOfSequence(pits[0].beginToken.previous, false, false)) 
            res.coef -= 0.5;
        return res;
    }
    
    static tryAttachIdentity(pits, inf) {
        if (pits.length === 1) {
            if (pits[0].typ !== PersonItemTokenItemType.REFERENT) 
                return null;
        }
        else {
            if (pits.length !== 2 && pits.length !== 3) 
                return null;
            for (const p of pits) {
                if (p.typ !== PersonItemTokenItemType.VALUE) 
                    return null;
                if (!p.chars.equals(pits[0].chars)) 
                    return null;
            }
        }
        let begin = Utils.as(pits[0].beginToken, TextToken);
        let end = Utils.as(pits[pits.length - 1].endToken, TextToken);
        if (begin === null || end === null) 
            return null;
        let res = new PersonIdentityToken(begin, end);
        res.lastname = new PersonMorphCollection();
        let s = MiscHelper.getTextValue(begin, end, GetTextAttr.NO);
        if (s.length > 100) 
            return null;
        let tmp = new StringBuilder();
        for (let t = begin; t !== null && t.previous !== end; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                continue;
            if (tt.isHiphen) {
                tmp.append('-');
                continue;
            }
            if (tmp.length > 0) {
                if (tmp.charAt(tmp.length - 1) !== '-') 
                    tmp.append(' ');
            }
            if (tt.lengthChar < 3) {
                tmp.append(tt.term);
                continue;
            }
            let sss = tt.term;
            for (const wff of tt.morph.items) {
                let wf = Utils.as(wff, MorphWordForm);
                if (wf !== null && wf.normalCase !== null && (wf.normalCase.length < sss.length)) 
                    sss = wf.normalCase;
            }
            tmp.append(sss);
        }
        let ss = tmp.toString();
        if (inf._case.isNominative) {
            res.lastname.add(s, null, MorphGender.UNDEFINED, false);
            if (s !== ss) 
                res.lastname.add(ss, null, MorphGender.UNDEFINED, false);
        }
        else {
            if (s !== ss) 
                res.lastname.add(ss, null, MorphGender.UNDEFINED, false);
            res.lastname.add(s, null, MorphGender.UNDEFINED, false);
        }
        for (const p of pits) {
            if (p !== pits[0]) {
                if (p.isNewlineBefore) 
                    res.coef -= (1);
                else if (p.whitespacesBeforeCount > 1) 
                    res.coef -= (0.5);
            }
            res.coef += (0.5);
            if (p.lengthChar > 4) {
                if (p.isInDictionary) 
                    res.coef -= (1.5);
                if (p.lastname !== null && ((p.lastname.isInDictionary || p.lastname.isInOntology))) 
                    res.coef -= (1);
                if (p.firstname !== null && p.firstname.isInDictionary) 
                    res.coef -= (1);
                if (p.middlename !== null) 
                    res.coef -= (1);
                if (p.chars.isAllUpper) 
                    res.coef -= (0.5);
            }
            else if (p.chars.isAllUpper) 
                res.coef -= (1);
        }
        if (pits.length === 2 && pits[1].lastname !== null && ((pits[1].lastname.isLastnameHasStdTail || pits[1].lastname.isInDictionary))) 
            res.coef -= 0.5;
        return res;
    }
    
    static tryAttachGlobal(pits, ind, inf) {
        if (ind > 0 || pits[0].typ !== PersonItemTokenItemType.VALUE) 
            return null;
        if ((pits.length === 4 && pits[0].value === "АУН" && pits[1].value === "САН") && pits[2].value === "СУ" && pits[3].value === "ЧЖИ") {
            let res = new PersonIdentityToken(pits[0].beginToken, pits[3].endToken);
            res.ontologyPerson = new PersonReferent();
            res.ontologyPerson.addSlot(PersonReferent.ATTR_IDENTITY, "АУН САН СУ ЧЖИ", false, 0);
            res.ontologyPerson.isFemale = true;
            res.coef = 10;
            return res;
        }
        if (pits.length === 2 && pits[0].firstname !== null && pits[0].firstname.isInDictionary) {
            if (pits[0].beginToken.isValue("ИВАН", null) && pits[1].beginToken.isValue("ГРОЗНЫЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                res.ontologyPerson.addSlot(PersonReferent.ATTR_FIRSTNAME, "ИВАН", false, 0);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, "ГРОЗНЫЙ", false, 0);
                res.ontologyPerson.isMale = true;
                res.coef = 10;
                return res;
            }
            if (pits[0].beginToken.isValue("ЮРИЙ", null) && pits[1].beginToken.isValue("ДОЛГОРУКИЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                res.ontologyPerson.addSlot(PersonReferent.ATTR_FIRSTNAME, "ЮРИЙ", false, 0);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, "ДОЛГОРУКИЙ", false, 0);
                res.ontologyPerson.isMale = true;
                res.coef = 10;
                return res;
            }
            if (pits[1].beginToken.isValue("ВЕЛИКИЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[0].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[0].firstname.morph.gender === MorphGender.MASCULINE || ((pits[1].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[0], pits[1].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "ВЕЛИКИЙ" : "ВЕЛИКАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
            if (pits[1].beginToken.isValue("СВЯТОЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[0].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[0].firstname.morph.gender === MorphGender.MASCULINE || ((pits[1].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[0], pits[1].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "СВЯТОЙ" : "СВЯТАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
            if (pits[1].beginToken.isValue("ПРЕПОДОБНЫЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[0].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[0].firstname.morph.gender === MorphGender.MASCULINE || ((pits[1].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[0], pits[1].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "ПРЕПОДОБНЫЙ" : "ПРЕПОДОБНАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
            if (pits[1].beginToken.isValue("БЛАЖЕННЫЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[0].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[0].firstname.morph.gender === MorphGender.MASCULINE || ((pits[1].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[0], pits[1].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "БЛАЖЕННЫЙ" : "БЛАЖЕННАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
        }
        if (pits.length === 2 && pits[1].firstname !== null && pits[1].firstname.isInDictionary) {
            if (pits[0].beginToken.isValue("СВЯТОЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[1].firstname.morph.gender === MorphGender.FEMINIE || pits[0].morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[1].firstname.morph.gender === MorphGender.MASCULINE || ((pits[0].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[1], pits[0].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "СВЯТОЙ" : "СВЯТАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
            if (pits[0].beginToken.isValue("ПРЕПОДОБНЫЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[1].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[1].firstname.morph.gender === MorphGender.MASCULINE || ((pits[0].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[1], pits[0].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "ПРЕПОДОБНЫЙ" : "ПРЕПОДОБНАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
            if (pits[0].beginToken.isValue("БЛАЖЕННЫЙ", null)) {
                let res = new PersonIdentityToken(pits[0].beginToken, pits[1].endToken);
                res.ontologyPerson = new PersonReferent();
                if (pits[1].firstname.morph.gender === MorphGender.FEMINIE) 
                    res.ontologyPerson.isFemale = true;
                else if (pits[1].firstname.morph.gender === MorphGender.MASCULINE || ((pits[0].morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.ontologyPerson.isMale = true;
                else 
                    return null;
                PersonIdentityToken.manageFirstname(res, pits[1], pits[0].morph);
                res.ontologyPerson.addFioIdentity(null, res.firstname, null);
                res.ontologyPerson.addSlot(PersonReferent.ATTR_NICKNAME, (res.ontologyPerson.isMale ? "БЛАЖЕННЫЙ" : "БЛАЖЕННАЯ"), false, 0);
                res.coef = 10;
                return res;
            }
        }
        return null;
    }
    
    static accordMorph(inf, p1, p2, p3, _next) {
        let res = new MorphCollection();
        let pp = new Array();
        if (p1 !== null) 
            pp.push(p1);
        if (p2 !== null) 
            pp.push(p2);
        if (p3 !== null) 
            pp.push(p3);
        if (pp.length === 0) 
            return res;
        if (inf !== null && p1 !== null && ((p1.isLastnameHasStdTail || p1.isInDictionary))) {
            if ((MorphCase.ooBitand(inf._case, p1.morph._case)).isUndefined) 
                inf = null;
        }
        if (inf !== null && p2 !== null && p2.isInDictionary) {
            if ((MorphCase.ooBitand(inf._case, p2.morph._case)).isUndefined) 
                inf = null;
        }
        for (let i = 0; i < 2; i++) {
            let g = (i === 0 ? MorphGender.MASCULINE : MorphGender.FEMINIE);
            if (inf !== null && inf.gender !== MorphGender.UNDEFINED && ((inf.gender.value()) & (g.value())) === (MorphGender.UNDEFINED.value())) 
                continue;
            let cas = MorphCase.ALL_CASES;
            for (const p of pp) {
                let ca = new MorphCase();
                for (const v of p.vars) {
                    if (v.gender !== MorphGender.UNDEFINED) {
                        if (((v.gender.value()) & (g.value())) === (MorphGender.UNDEFINED.value())) 
                            continue;
                    }
                    if (inf !== null && !inf._case.isUndefined && !v._case.isUndefined) {
                        if ((MorphCase.ooBitand(inf._case, v._case)).isUndefined) 
                            continue;
                    }
                    if (!v._case.isUndefined) 
                        ca = MorphCase.ooBitor(ca, v._case);
                    else 
                        ca = MorphCase.ALL_CASES;
                }
                cas = MorphCase.ooBitand(cas, ca);
            }
            if (!cas.isUndefined) {
                if (inf !== null && !inf._case.isUndefined && !(MorphCase.ooBitand(inf._case, cas)).isUndefined) 
                    cas = MorphCase.ooBitand(cas, inf._case);
                res.addItem(MorphBaseInfo._new2588(g, cas));
            }
        }
        let verbGend = MorphGender.UNDEFINED;
        if ((_next !== null && (_next instanceof TextToken) && _next.chars.isAllLower) && _next.morph._class.equals(MorphClass.VERB) && _next.morph.number === MorphNumber.SINGULAR) {
            if (_next.morph.gender === MorphGender.FEMINIE || _next.morph.gender === MorphGender.MASCULINE) {
                verbGend = _next.morph.gender;
                let npt = NounPhraseHelper.tryParse(_next.next, NounPhraseParseAttr.NO, 0, null);
                if ((npt !== null && npt.morph._case.isNominative && npt.morph.gender === verbGend) && npt.morph.number === MorphNumber.SINGULAR) 
                    verbGend = MorphGender.UNDEFINED;
            }
        }
        if (verbGend !== MorphGender.UNDEFINED && res.itemsCount > 1) {
            let cou = 0;
            for (const it of res.items) {
                if (it._case.isNominative && it.gender === verbGend) 
                    cou++;
            }
            if (cou === 1) {
                for (let i = res.itemsCount - 1; i >= 0; i--) {
                    if (!res.getIndexerItem(i)._case.isNominative || res.getIndexerItem(i).gender !== verbGend) 
                        res.removeItem(i);
                }
            }
        }
        return res;
    }
    
    static isAccords(mt, inf) {
        if (inf === null) 
            return true;
        if (mt.vars.length === 0) 
            return true;
        for (const wf of mt.vars) {
            let ok = true;
            if (!inf._case.isUndefined && !wf._case.isUndefined) {
                if ((MorphCase.ooBitand(wf._case, inf._case)).isUndefined) 
                    ok = false;
            }
            if (inf.gender !== MorphGender.UNDEFINED && wf.gender !== MorphGender.UNDEFINED) {
                if (((inf.gender.value()) & (wf.gender.value())) === (MorphGender.UNDEFINED.value())) 
                    ok = false;
            }
            if (ok) 
                return true;
        }
        return false;
    }
    
    static isBothSurnames(p1, p2) {
        if (p1 === null || p2 === null) 
            return false;
        if (p1.lastname === null || p2.lastname === null) 
            return false;
        if (!p1.lastname.isInDictionary && !p1.lastname.isInOntology && !p1.lastname.isLastnameHasStdTail) 
            return false;
        if (p1.firstname !== null || p2.middlename !== null) 
            return false;
        if (!p2.lastname.isInDictionary && !p2.lastname.isInOntology && !p2.lastname.isLastnameHasStdTail) 
            return false;
        if (p2.firstname !== null || p2.middlename !== null) 
            return false;
        if (!(p1.endToken instanceof TextToken) || !(p2.endToken instanceof TextToken)) 
            return false;
        let v1 = p1.endToken.term;
        let v2 = p2.endToken.term;
        if (v1[v1.length - 1] === v2[v2.length - 1]) 
            return false;
        return true;
    }
    
    static getValue(mt, inf) {
        for (const wf of mt.vars) {
            if (inf !== null) {
                if (!inf._case.isUndefined && !wf._case.isUndefined) {
                    if ((MorphCase.ooBitand(wf._case, inf._case)).isUndefined) 
                        continue;
                }
                if (inf.gender !== MorphGender.UNDEFINED && wf.gender !== MorphGender.UNDEFINED) {
                    if (((inf.gender.value()) & (wf.gender.value())) === (MorphGender.UNDEFINED.value())) 
                        continue;
                }
            }
            return wf.value;
        }
        return mt.term;
    }
    
    static setValue2(res, mt, inf) {
        let ok = false;
        for (const wf of mt.vars) {
            if (inf !== null) {
                if (!inf._case.isUndefined && !wf._case.isUndefined) {
                    if ((MorphCase.ooBitand(wf._case, inf._case)).isUndefined) 
                        continue;
                }
                if (inf.gender !== MorphGender.UNDEFINED && wf.gender !== MorphGender.UNDEFINED) {
                    if (((inf.gender.value()) & (wf.gender.value())) === (MorphGender.UNDEFINED.value())) 
                        continue;
                }
                ok = true;
            }
            res.add(wf.value, wf.shortValue, wf.gender, false);
        }
        if (res.values.length === 0) {
            if ((inf !== null && !inf._case.isUndefined && mt.vars.length > 0) && mt.isLastnameHasStdTail) {
                for (const wf of mt.vars) {
                    res.add(wf.value, wf.shortValue, wf.gender, false);
                }
            }
            res.add(mt.term, null, inf.gender, false);
        }
    }
    
    static setValue(res, t, inf) {
        let tt = Utils.as(t, TextToken);
        if (tt === null && (t instanceof MetaToken) && t.beginToken === t.endToken) 
            tt = Utils.as(t.beginToken, TextToken);
        if (tt === null) 
            return;
        for (const wf of tt.morph.items) {
            if (wf._class.isVerb) 
                continue;
            if (wf.containsAttr("к.ф.", null)) 
                continue;
            if (inf !== null && inf.gender !== MorphGender.UNDEFINED && wf.gender !== MorphGender.UNDEFINED) {
                if (((wf.gender.value()) & (inf.gender.value())) === (MorphGender.UNDEFINED.value())) 
                    continue;
            }
            if (inf !== null && !inf._case.isUndefined && !wf._case.isUndefined) {
                if ((MorphCase.ooBitand(wf._case, inf._case)).isUndefined) 
                    continue;
            }
            let str = (t.chars.isLatinLetter ? tt.term : wf.normalCase);
            res.add(str, null, wf.gender, false);
        }
        res.add(tt.term, null, (inf === null ? MorphGender.UNDEFINED : inf.gender), false);
    }
    
    static correctXFML(pli0, pli1, attrs) {
        let p0 = null;
        let p1 = null;
        for (const p of pli0) {
            if (p.typ === FioTemplateType.SURNAMENAMESECNAME) {
                p0 = p;
                break;
            }
        }
        for (const p of pli1) {
            if (p.typ === FioTemplateType.NAMESECNAMESURNAME) {
                p1 = p;
                break;
            }
        }
        if (p0 === null || p1 === null) {
            for (const p of pli0) {
                if (p.typ === FioTemplateType.SURNAMENAME) {
                    p0 = p;
                    break;
                }
            }
            for (const p of pli1) {
                if (p.typ === FioTemplateType.NAMESURNAME) {
                    p1 = p;
                    break;
                }
            }
        }
        if (p0 === null || p1 === null) 
            return false;
        if (p1.coef > p0.coef) 
            return false;
        for (let tt = p1.beginToken; tt !== p1.endToken; tt = tt.next) {
            if (tt.isNewlineAfter) 
                return false;
        }
        if (!p1.endToken.isNewlineAfter) {
            if (PersonItemToken.tryAttach(p1.endToken.next, PersonItemTokenParseAttr.NO, null) !== null) 
                return false;
        }
        if (p0.lastname === null || p1.lastname === null) 
            return false;
        if (p1.lastname.hasLastnameStandardTail) {
            if (!p0.lastname.hasLastnameStandardTail) {
                p1.coef = p0.coef + (0.1);
                return true;
            }
        }
        if (attrs === null || attrs.length === 0) {
            if (!p1.lastname.hasLastnameStandardTail && p0.lastname.hasLastnameStandardTail) 
                return false;
        }
        let t = p1.endToken.next;
        if (t !== null && !t.chars.isCapitalUpper && !t.chars.isAllUpper) {
            let npt = NounPhraseHelper.tryParse(p1.endToken, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.endToken !== npt.beginToken) 
                return false;
            let cl1 = p0.beginToken.getMorphClassInDictionary();
            let cl2 = p1.endToken.getMorphClassInDictionary();
            if (cl2.isNoun && !cl1.isNoun) 
                return false;
            p1.coef = p0.coef + (0.1);
            return true;
        }
        return false;
    }
    
    static checkLatinAfter(pit) {
        if (pit === null) 
            return null;
        let t = pit.endToken.next;
        if (t === null || !t.isChar('(')) 
            return null;
        t = t.next;
        let p1 = PersonItemToken.tryAttachLatin(t);
        if (p1 === null) 
            return null;
        let p2 = PersonItemToken.tryAttachLatin(p1.endToken.next);
        if (p2 === null) 
            return null;
        if (p2.endToken.next === null) 
            return null;
        let p3 = null;
        let et = p2.endToken.next;
        if (p2.endToken.next.isChar(')')) {
        }
        else {
            p3 = PersonItemToken.tryAttachLatin(et);
            if (p3 === null) 
                return null;
            et = p3.endToken.next;
            if (et === null || !et.isChar(')')) 
                return null;
        }
        let sur = null;
        let nam = null;
        let sec = null;
        if (pit.typ === FioTemplateType.NAMESURNAME && pit.firstname !== null && pit.lastname !== null) {
            let eq = 0;
            if (p1.typ === PersonItemTokenItemType.VALUE) {
                if (pit.firstname.checkLatinVariant(p1.value)) 
                    eq++;
                nam = p1;
                if (p2.typ === PersonItemTokenItemType.VALUE && p3 === null) {
                    sur = p2;
                    if (pit.lastname.checkLatinVariant(p2.value)) 
                        eq++;
                }
                else if (p2.typ === PersonItemTokenItemType.INITIAL && p3 !== null) {
                    if (pit.lastname.checkLatinVariant(p3.value)) 
                        eq++;
                    sur = p3;
                }
            }
            if (eq === 0) 
                return null;
        }
        else if ((pit.typ === FioTemplateType.NAMESECNAMESURNAME && pit.firstname !== null && pit.middlename !== null) && pit.lastname !== null && p3 !== null) {
            let eq = 0;
            if (p1.typ === PersonItemTokenItemType.VALUE) {
                if (pit.firstname.checkLatinVariant(p1.value)) 
                    eq++;
                nam = p1;
                if (p2.typ === PersonItemTokenItemType.VALUE) {
                    sec = p2;
                    if (pit.middlename instanceof PersonMorphCollection) {
                        if (pit.middlename.checkLatinVariant(p2.value)) 
                            eq++;
                    }
                }
                if (p3.typ === PersonItemTokenItemType.VALUE) {
                    sur = p3;
                    if (pit.lastname.checkLatinVariant(p3.value)) 
                        eq++;
                }
            }
            if (eq === 0) 
                return null;
        }
        if (nam === null || sur === null) 
            return null;
        let res = PersonIdentityToken._new2571(t, et, pit.typ);
        res.lastname = new PersonMorphCollection();
        res.lastname.add(sur.value, null, MorphGender.UNDEFINED, false);
        res.firstname = new PersonMorphCollection();
        res.firstname.add(nam.value, null, MorphGender.UNDEFINED, false);
        if (sec !== null) {
            res.middlename = new PersonMorphCollection();
            res.middlename.add(sec.value, null, MorphGender.UNDEFINED, false);
        }
        return res;
    }
    
    static _new2570(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonIdentityToken(_arg1, _arg2);
        res.coef = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2571(_arg1, _arg2, _arg3) {
        let res = new PersonIdentityToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
}


module.exports = PersonIdentityToken