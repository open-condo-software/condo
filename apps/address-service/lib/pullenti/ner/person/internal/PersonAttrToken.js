/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");
const XmlDocument = require("./../../../unisharp/XmlDocument");

const MorphCollection = require("./../../MorphCollection");
const PersonAttrTerminType2 = require("./PersonAttrTerminType2");
const Token = require("./../../Token");
const TerminToken = require("./../../core/TerminToken");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const GetTextAttr = require("./../../core/GetTextAttr");
const PersonItemTokenItemType = require("./PersonItemTokenItemType");
const MorphCase = require("./../../../morph/MorphCase");
const MailLineTypes = require("./../../mail/internal/MailLineTypes");
const MailLine = require("./../../mail/internal/MailLine");
const MorphLang = require("./../../../morph/MorphLang");
const MorphClass = require("./../../../morph/MorphClass");
const MorphDeserializer = require("./../../../morph/internal/MorphDeserializer");
const PullentiNerPersonInternalResourceHelper = require("./PullentiNerPersonInternalResourceHelper");
const PersonAttrTermin = require("./PersonAttrTermin");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const MorphologyService = require("./../../../morph/MorphologyService");
const PersonReferent = require("./../PersonReferent");
const Referent = require("./../../Referent");
const TextToken = require("./../../TextToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const PersonPropertyKind = require("./../PersonPropertyKind");
const MorphNumber = require("./../../../morph/MorphNumber");
const PersonPropertyReferent = require("./../PersonPropertyReferent");
const BracketHelper = require("./../../core/BracketHelper");
const GeoReferent = require("./../../geo/GeoReferent");
const GeoOwnerHelper = require("./../../geo/internal/GeoOwnerHelper");
const MetaToken = require("./../../MetaToken");
const PersonAttrTerminType = require("./PersonAttrTerminType");
const ReferentToken = require("./../../ReferentToken");
const MorphGender = require("./../../../morph/MorphGender");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const PersonAnalyzer = require("./../PersonAnalyzer");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const PersonItemTokenParseAttr = require("./PersonItemTokenParseAttr");
const NumberToken = require("./../../NumberToken");
const NumberHelper = require("./../../core/NumberHelper");
const PersonTokenData = require("./PersonTokenData");
const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");

class PersonAttrToken extends ReferentToken {
    
    constructor(begin, end) {
        super(null, begin, end, null);
        this.typ = PersonAttrTerminType.PREFIX;
        this.gender = MorphGender.UNDEFINED;
        this.value = null;
        this.age = null;
        this.higherPropRef = null;
        this.addOuterOrgAsRef = false;
        this.anafor = null;
        this.m_CanBeIndependentProperty = false;
        this.canBeSinglePerson = false;
        this.canHasPersonAfter = 0;
        this.canBeSameSurname = false;
        this.isDoubt = false;
    }
    
    get propRef() {
        return Utils.as(this.referent, PersonPropertyReferent);
    }
    set propRef(_value) {
        this.referent = _value;
        return _value;
    }
    
    get canBeIndependentProperty() {
        if (this.propRef === null) 
            return false;
        if (this.morph.number === MorphNumber.PLURAL) 
            return false;
        if (this.higherPropRef !== null && this.higherPropRef.canBeIndependentProperty) 
            return true;
        if (this.canBeSinglePerson) 
            return true;
        if (this.typ !== PersonAttrTerminType.POSITION) 
            return false;
        if (!this.m_CanBeIndependentProperty) {
            if (this.propRef.kind === PersonPropertyKind.BOSS) 
                return true;
            return false;
        }
        if (this.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) !== null) {
            if (this.propRef.name !== "член") 
                return true;
        }
        return false;
    }
    set canBeIndependentProperty(_value) {
        this.m_CanBeIndependentProperty = _value;
        return _value;
    }
    
    toString() {
        if (this.referent !== null) 
            return super.toString();
        let res = new StringBuilder();
        res.append(this.typ.toString()).append(": ").append(((this.value != null ? this.value : "")));
        if (this.propRef !== null) 
            res.append(" Ref: ").append(this.propRef.toString());
        if (this.gender !== MorphGender.UNDEFINED) 
            res.append("; ").append(String(this.gender));
        if (this.canHasPersonAfter >= 0) 
            res.append("; MayBePersonAfter=").append(this.canHasPersonAfter);
        if (this.canBeSameSurname) 
            res.append("; CanHasLikeSurname");
        if (this.m_CanBeIndependentProperty) 
            res.append("; CanBeIndependent");
        if (this.isDoubt) 
            res.append("; Doubt");
        if (this.age !== null) 
            res.append("; Age=").append(this.age);
        if (!this.morph._case.isUndefined) 
            res.append("; ").append(this.morph._case.toString());
        return res.toString();
    }
    
    saveToLocalOntology() {
        let ad = this.data;
        if (ad === null || this.propRef === null || this.higherPropRef === null) {
            super.saveToLocalOntology();
            return;
        }
        let li = new Array();
        for (let pr = this; pr !== null && pr.propRef !== null; pr = pr.higherPropRef) {
            li.splice(0, 0, pr);
        }
        for (let i = 0; i < li.length; i++) {
            li[i].data = ad;
            li[i].higherPropRef = null;
            li[i].saveToLocalOntology();
            if ((i + 1) < li.length) 
                li[i + 1].propRef.higher = li[i].propRef;
        }
    }
    
    static prepareAllData(t0) {
        if (!PersonAttrToken.SPEED_REGIME) 
            return;
        let ad = PersonAnalyzer.getData(t0);
        if (ad === null) 
            return;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, PersonTokenData);
            let _typ = PersonAttrToken.tryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if (_typ !== null) {
                if (d === null) 
                    d = new PersonTokenData(t);
                d.attr = _typ;
            }
        }
    }
    
    static tryAttach(t, attrs = PersonAttrTokenPersonAttrAttachAttrs.NO) {
        const PersonItemToken = require("./PersonItemToken");
        if (t === null) 
            return null;
        let ad = PersonAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (PersonAttrToken.SPEED_REGIME && ad.aRegime && attrs === PersonAttrTokenPersonAttrAttachAttrs.NO) {
            let d = Utils.as(t.tag, PersonTokenData);
            if (d !== null) 
                return d.attr;
            return null;
        }
        if (ad.level > 4) 
            return null;
        ad.level++;
        let res = PersonAttrToken._TryAttach(t, attrs);
        ad.level--;
        if (t.isValue("СПОРТСМЕНКА", null)) {
        }
        if (res === null) {
            if (t.morph._class.isNoun) {
                let aterr = Utils.as(t.kit.processor.findAnalyzer("GEO"), GeoAnalyzer);
                if (aterr !== null) {
                    let rt = aterr.processCitizen(t);
                    if (rt !== null) {
                        res = PersonAttrToken._new2479(rt.beginToken, rt.endToken, rt.morph);
                        res.propRef = new PersonPropertyReferent();
                        res.propRef.addSlot(PersonPropertyReferent.ATTR_NAME, (t.kit.baseLanguage.isUa ? "громадянин" : "гражданин"), true, 0);
                        res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, rt.referent, true, 0);
                        res.propRef.addExtReferent(rt);
                        res.typ = PersonAttrTerminType.POSITION;
                        if ((res.endToken.next !== null && res.endToken.next.isValue("ПО", null) && res.endToken.next.next !== null) && res.endToken.next.next.isValue("ПРОИСХОЖДЕНИЕ", null)) 
                            res.endToken = res.endToken.next.next;
                        return res;
                    }
                }
            }
            if ((((t instanceof TextToken) && t.term === "АК" && t.next !== null) && t.next.isChar('.') && t.next.next !== null) && !t.next.next.chars.isAllLower) {
                res = PersonAttrToken._new2480(t, t.next, PersonAttrTerminType.POSITION);
                res.propRef = PersonPropertyReferent._new2481("академик");
                return res;
            }
            if ((t instanceof TextToken) && t.next !== null) {
                if (((t.isValue("ВИЦЕ", "ВІЦЕ") || t.isValue("ЭКС", "ЕКС") || t.isValue("ГЕН", null)) || t.isValue("VICE", null) || t.isValue("EX", null)) || t.isValue("DEPUTY", null)) {
                    let tt = t.next;
                    if (tt.isHiphen || tt.isChar('.')) 
                        tt = tt.next;
                    res = PersonAttrToken._TryAttach(tt, attrs);
                    if (res !== null && res.propRef !== null) {
                        res.beginToken = t;
                        if (t.isValue("ГЕН", null)) 
                            res.propRef.name = ("генеральный " + res.propRef.name);
                        else 
                            res.propRef.name = (t.term.toLowerCase() + "-" + res.propRef.name);
                        return res;
                    }
                }
            }
            if (t.isValue("ГВАРДИИ", "ГВАРДІЇ")) {
                res = PersonAttrToken._TryAttach(t.next, attrs);
                if (res !== null) {
                    if (res.propRef !== null && res.propRef.kind === PersonPropertyKind.MILITARYRANK) {
                        res.beginToken = t;
                        return res;
                    }
                }
            }
            let tt1 = t;
            if (tt1.morph._class.isPreposition && tt1.next !== null) 
                tt1 = tt1.next;
            if ((tt1.next !== null && tt1.isValue("НАЦИОНАЛЬНОСТЬ", "НАЦІОНАЛЬНІСТЬ")) || tt1.isValue("ПРОФЕССИЯ", "ПРОФЕСІЯ") || tt1.isValue("СПЕЦИАЛЬНОСТЬ", "СПЕЦІАЛЬНІСТЬ")) {
                tt1 = tt1.next;
                if (tt1 !== null) {
                    if (tt1.isHiphen || tt1.isChar(':')) 
                        tt1 = tt1.next;
                }
                res = PersonAttrToken._TryAttach(tt1, attrs);
                if (res !== null) {
                    res.beginToken = t;
                    return res;
                }
            }
            return null;
        }
        if (res.typ === PersonAttrTerminType.OTHER && res.age !== null && res.value === null) {
            let res1 = PersonAttrToken._TryAttach(res.endToken.next, attrs);
            if (res1 !== null) {
                res1.beginToken = res.beginToken;
                res1.age = res.age;
                res = res1;
            }
        }
        if (res.endToken.isValue("ТЕХНИК", null) && (res.endToken instanceof TextToken)) {
            if (res.endToken.term !== "ТЕХНИК") 
                return null;
        }
        if (res.beginToken.isValue("ГЛАВА", null)) {
            if (t.previous instanceof NumberToken) 
                return null;
        }
        else if (res.beginToken.isValue("АДВОКАТ", null)) {
            if (t.previous !== null) {
                if (t.previous.isValue("РЕЕСТР", "РЕЄСТР") || t.previous.isValue("УДОСТОВЕРЕНИЕ", "ПОСВІДЧЕННЯ")) 
                    return null;
            }
        }
        let mc = res.beginToken.getMorphClassInDictionary();
        if (mc.isAdjective) {
            let npt = NounPhraseHelper.tryParse(res.beginToken, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.endChar >= res.endChar) {
                if (PersonAttrToken.m_Termins.tryParse(npt.endToken, TerminParseAttr.NO) === null && npt.endToken.chars.isAllLower) 
                    return null;
            }
        }
        if (res.typ === PersonAttrTerminType.PREFIX && ((((((res.value === "ГРАЖДАНИН" || res.value === "ГРАЖДАНКА" || res.value === "УРОЖЕНЕЦ") || res.value === "УРОЖЕНКА" || res.value === "ВЫХОДЕЦ ИЗ") || res.value === "ВИХОДЕЦЬ З" || res.value === "ГРОМАДЯНИН") || res.value === "ГРОМАДЯНКА" || res.value === "УРОДЖЕНЕЦЬ") || res.value === "УРОДЖЕНКА")) && res.endToken.next !== null) {
            let tt = res.endToken.next;
            if (((tt !== null && tt.isChar('(') && tt.next !== null) && tt.next.isValue("КА", null) && tt.next.next !== null) && tt.next.next.isChar(')')) {
                res.endToken = tt.next.next;
                tt = res.endToken.next;
            }
            let r = (tt === null ? null : tt.getReferent());
            if (r !== null && r.typeName === PersonAttrToken.objNameGeo) {
                res.endToken = tt;
                res.propRef = new PersonPropertyReferent();
                res.propRef.addSlot(PersonPropertyReferent.ATTR_NAME, res.value.toLowerCase(), true, 0);
                res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r, true, 0);
                res.typ = PersonAttrTerminType.POSITION;
                for (let ttt = tt.next; ttt !== null; ttt = ttt.next) {
                    if (!ttt.isCommaAnd || ttt.next === null) 
                        break;
                    ttt = ttt.next;
                    r = ttt.getReferent();
                    if (r === null || r.typeName !== PersonAttrToken.objNameGeo) 
                        break;
                    res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                    res.endToken = (tt = ttt);
                    if (ttt.previous.isAnd) 
                        break;
                }
                if (((res.endToken.next instanceof ReferentToken) && (res.whitespacesAfterCount < 3) && res.endToken.next.getReferent() !== null) && res.endToken.next.getReferent().typeName === PersonAttrToken.objNameGeo) {
                    if (GeoOwnerHelper.canBeHigher(Utils.as(r, GeoReferent), Utils.as(res.endToken.next.getReferent(), GeoReferent), null, null)) {
                        res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, res.endToken.next.getReferent(), false, 0);
                        res.endToken = res.endToken.next;
                    }
                }
            }
            else if ((tt !== null && tt.isAnd && tt.next !== null) && tt.next.isValue("ЖИТЕЛЬ", null)) {
                let aaa = PersonAttrToken._TryAttach(tt.next, attrs);
                if (aaa !== null && aaa.propRef !== null) {
                    aaa.beginToken = res.beginToken;
                    aaa.value = res.value;
                    aaa.propRef.name = aaa.value.toLowerCase();
                    res = aaa;
                }
            }
            else {
                let tt2 = tt;
                if (tt2.isCommaAnd) 
                    tt2 = tt2.next;
                let nex = PersonAttrToken._TryAttach(tt2, attrs);
                if (nex !== null && nex.propRef !== null) {
                    for (const sss of nex.propRef.slots) {
                        if (sss.value instanceof GeoReferent) {
                            if (res.propRef === null) 
                                res.propRef = new PersonPropertyReferent();
                            res.propRef.addSlot(PersonPropertyReferent.ATTR_NAME, res.value.toLowerCase(), false, 0);
                            res.propRef.addSlot(sss.typeName, sss.value, false, 0);
                            res.typ = PersonAttrTerminType.POSITION;
                        }
                    }
                }
            }
        }
        if (res.typ === PersonAttrTerminType.KING || res.typ === PersonAttrTerminType.POSITION) {
            if (res.beginToken === res.endToken && res.chars.isCapitalUpper && res.whitespacesAfterCount === 1) {
                let pit = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.IGNOREATTRS, null);
                if (pit !== null && pit.lastname !== null && pit.lastname.isLastnameHasStdTail) {
                    let rt1 = PersonAnalyzer.processReferentStat(t.next, null);
                    if (rt1 !== null && (rt1.referent instanceof PersonReferent)) {
                    }
                    else if ((((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.INPROCESS.value()))) !== (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) {
                    }
                    else 
                        return null;
                }
            }
        }
        if (res.propRef === null) 
            return res;
        if (res.chars.isLatinLetter) {
            let tt = res.endToken.next;
            if (tt !== null && tt.isHiphen) 
                tt = tt.next;
            if (tt !== null && tt.isValue("ELECT", null)) 
                res.endToken = tt;
        }
        if (!res.beginToken.chars.isAllLower) {
            let pat = PersonItemToken.tryAttach(res.beginToken, PersonItemTokenParseAttr.IGNOREATTRS, null);
            if (pat !== null && pat.lastname !== null) {
                if (pat.lastname.isInDictionary || pat.lastname.isInOntology) {
                    if (PersonAttrToken.checkKind(res.propRef) !== PersonPropertyKind.KING) 
                        return null;
                }
            }
        }
        let s = res.propRef.toString();
        if (s === "глава книги") 
            return null;
        if (s === "глава" && res.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null) 
            return null;
        if (((s === "королева" || s === "король" || s === "князь")) && res.chars.isCapitalUpper) {
            let pits = PersonItemToken.tryAttachList(res.endToken.next, PersonItemTokenParseAttr.NO, 10);
            if (pits !== null && pits.length > 0) {
                if (pits[0].typ === PersonItemTokenItemType.INITIAL) 
                    return null;
                if (pits[0].firstname !== null) {
                    if (pits.length === 1) 
                        return null;
                    if (pits.length === 2 && pits[1].middlename !== null) 
                        return null;
                }
            }
            if (!MiscHelper.canBeStartOfSentence(t)) 
                return null;
        }
        if (s === "друг" || s.startsWith("друг ")) {
            if (t.previous !== null) {
                if (t.previous.isValue("ДРУГ", null)) 
                    return null;
                if (t.previous.morph._class.isPreposition && t.previous.previous !== null && t.previous.previous.isValue("ДРУГ", null)) 
                    return null;
            }
            if (t.next !== null) {
                if (t.next.isValue("ДРУГ", null)) 
                    return null;
                if (t.next.morph._class.isPreposition && t.next.next !== null && t.next.next.isValue("ДРУГ", null)) 
                    return null;
            }
        }
        if (res.chars.isLatinLetter && ((res.isDoubt || s === "senior")) && (res.whitespacesAfterCount < 2)) {
            if (res.propRef !== null && res.propRef.slots.length === 1) {
                let tt2 = res.endToken.next;
                if (MiscHelper.isEngAdjSuffix(tt2)) 
                    tt2 = tt2.next.next;
                let res2 = PersonAttrToken._TryAttach(tt2, attrs);
                if ((res2 !== null && res2.chars.isLatinLetter && res2.typ === res.typ) && res2.propRef !== null) {
                    res2.propRef.name = ((Utils.notNull(res.propRef.name, "")) + " " + (Utils.notNull(res2.propRef.name, ""))).trim();
                    res2.beginToken = res.beginToken;
                    res = res2;
                }
            }
        }
        if (res.propRef.name === "министр") {
            let rt1 = res.kit.processReferent("ORGANIZATION", res.endToken.next, null);
            if (rt1 !== null && rt1.referent.findSlot("TYPE", "министерство", true) !== null) {
                let t1 = rt1.endToken;
                if (t1.getReferent() instanceof GeoReferent) 
                    t1 = t1.previous;
                if (rt1.beginChar < t1.endChar) {
                    let addStr = MiscHelper.getTextValue(rt1.beginToken, t1, GetTextAttr.NO);
                    if (addStr !== null) {
                        res.propRef.name = res.propRef.name + (" " + addStr.toLowerCase());
                        res.endToken = t1;
                    }
                }
            }
        }
        for (let p = res.propRef; p !== null; p = p.higher) {
            if (p.name !== null && p.name.includes(" - ")) 
                p.name = Utils.replaceString(p.name, " - ", "-");
        }
        if (res.beginToken.morph._class.isAdjective) {
            let r = res.kit.processReferent("GEO", res.beginToken, null);
            if (r !== null) {
                res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r.referent, false, 0);
                res.propRef.addExtReferent(r);
                let i = res.propRef.name.indexOf(' ');
                if (i > 0) 
                    res.propRef.name = res.propRef.name.substring(i).trim();
            }
        }
        if (res.propRef !== null && res.propRef.kind === PersonPropertyKind.KING) {
            let t1 = res.endToken.next;
            if (res.propRef.name === "отец") {
                if (t1 === null || !t1.chars.isCapitalUpper) 
                    return null;
                if ((MorphCase.ooBitand(res.morph._case, t1.morph._case)).isUndefined) 
                    return null;
                res.propRef.name = "священник";
                return res;
            }
            if (t1 !== null && t1.chars.isCapitalUpper && (t1.whitespacesBeforeCount < 3)) {
                let adjs = new Array();
                let _isAnd = false;
                let t2 = null;
                for (let tt = t1; tt !== null; tt = tt.next) {
                    if (((tt.isValue("ВСЕЙ", null) || tt.isValue("ВСЕЯ", "ВСІЄЇ"))) && (tt.next instanceof ReferentToken) && (tt.next.getReferent() instanceof GeoReferent)) {
                        adjs.push(MiscHelper.convertFirstCharUpperAndOtherLower(MiscHelper.getTextValue(tt, tt.next, GetTextAttr.NO)));
                        t2 = (tt = tt.next);
                    }
                    else if ((tt.getReferent() instanceof GeoReferent) && tt.endToken.morph._class.isAdjective) {
                        let v = MiscHelper.getTextValueOfMetaToken(Utils.as(tt, ReferentToken), GetTextAttr.NO);
                        adjs.push(MiscHelper.convertFirstCharUpperAndOtherLower(v));
                        tt = (t2 = tt);
                    }
                    else {
                        if (!tt.chars.isCapitalUpper) 
                            break;
                        let pit = PersonItemToken.tryAttach(tt, PersonItemTokenParseAttr.IGNOREATTRS, null);
                        if (pit === null || pit.value === null || pit.firstname !== null) 
                            break;
                        if (pit.lastname === null && !pit.value.endsWith("КИЙ")) 
                            break;
                        let v = null;
                        if (pit.lastname === null) 
                            v = pit.value;
                        else 
                            for (const fv of pit.lastname.vars) {
                                if (fv.value.endsWith("КИЙ")) {
                                    v = fv.value;
                                    break;
                                }
                            }
                        if (v === null) 
                            break;
                        adjs.push(MiscHelper.convertFirstCharUpperAndOtherLower(v));
                        tt = (t2 = pit.endToken);
                    }
                    if (tt.next === null) 
                        break;
                    tt = tt.next;
                    if (!tt.isCommaAnd) 
                        break;
                    _isAnd = tt.isAnd;
                }
                if (adjs.length > 1 && !_isAnd) {
                }
                else if (t2 !== null) {
                    for (let i = 0; i < adjs.length; i++) {
                        if (i > 0) 
                            res.propRef.name = (res.propRef.name + ((i + 1) < adjs.length ? "," : " и"));
                        res.propRef.name = (res.propRef.name + " " + adjs[i]);
                    }
                    res.endToken = t2;
                }
            }
        }
        let containsGeo = false;
        for (const ss of res.propRef.slots) {
            if (ss.value instanceof Referent) {
                if (ss.value.typeName === PersonAttrToken.objNameGeo) {
                    containsGeo = true;
                    break;
                }
            }
        }
        if (!containsGeo && (res.endToken.whitespacesAfterCount < 2)) {
            if ((res.endToken.next instanceof ReferentToken) && res.endToken.next.getReferent().typeName === PersonAttrToken.objNameGeo) {
                res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, res.endToken.next.getReferent(), false, 0);
                res.endToken = res.endToken.next;
            }
        }
        if (res.endToken.whitespacesAfterCount < 2) {
            let te = res.endToken.next;
            if (te !== null && te.isValue("В", null)) {
                te = te.next;
                if ((te instanceof ReferentToken) && ((te.getReferent().typeName === PersonAttrToken.objNameDate || te.getReferent().typeName === PersonAttrToken.objNameDateRange))) 
                    res.endToken = te;
            }
            else if (te !== null && te.isChar('(')) {
                te = te.next;
                if (((te instanceof ReferentToken) && ((te.getReferent().typeName === PersonAttrToken.objNameDate || te.getReferent().typeName === PersonAttrToken.objNameDateRange)) && te.next !== null) && te.next.isChar(')')) 
                    res.endToken = te.next;
                else if (te instanceof NumberToken) {
                    let rt1 = te.kit.processReferent("DATE", te, null);
                    if (rt1 !== null && rt1.endToken.next !== null && rt1.endToken.next.isChar(')')) 
                        res.endToken = rt1.endToken.next;
                }
            }
        }
        if (res.propRef !== null && res.propRef.name === "отец") {
            let isKing = false;
            let tt = res.endToken.next;
            if ((tt instanceof TextToken) && tt.getMorphClassInDictionary().isProperName) {
                if (!(MorphCase.ooBitand(res.morph._case, tt.morph._case)).isUndefined) {
                    if (!tt.morph._case.isGenitive) 
                        isKing = true;
                }
            }
            if (isKing) 
                res.propRef.name = "священник";
        }
        if (res.canHasPersonAfter > 0 && res.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null) {
            let npt = NounPhraseHelper.tryParse(res.beginToken, NounPhraseParseAttr.NO, 0, null);{
                    let tt0 = res.beginToken;
                    let have = false;
                    if ((tt0 instanceof TextToken) && tt0.morph._class.isPersonalPronoun && ((tt0.isValue("ОН", null) || tt0.isValue("ОНА", null)))) {
                    }
                    else {
                        tt0 = tt0.previous;
                        if ((tt0 instanceof TextToken) && tt0.morph._class.isPersonalPronoun && ((tt0.isValue("ОН", null) || tt0.isValue("ОНА", null)))) {
                        }
                        else if ((tt0 instanceof TextToken) && tt0.morph._class.isPronoun && tt0.isValue("СВОЙ", null)) {
                        }
                        else if ((tt0 instanceof TextToken) && ((tt0.isValue("ИМЕТЬ", null) || tt0.isVerbBe))) 
                            have = true;
                        else 
                            tt0 = null;
                    }
                    if (tt0 !== null) {
                        let gen = MorphGender.UNDEFINED;
                        let cou = 0;
                        if (!have) {
                            for (const wf of tt0.morph.items) {
                                if (wf._class.isPersonalPronoun || wf._class.isPronoun) {
                                    if ((((gen = wf.gender))) === MorphGender.NEUTER) 
                                        gen = MorphGender.MASCULINE;
                                    break;
                                }
                            }
                        }
                        for (let tt = tt0.previous; tt !== null && (cou < 200); tt = tt.previous,cou++) {
                            let pr = Utils.as(tt.getReferent(), PersonPropertyReferent);
                            if (pr !== null) {
                                if (((tt.morph.gender.value()) & (gen.value())) === (MorphGender.UNDEFINED.value())) 
                                    continue;
                                break;
                            }
                            let p = Utils.as(tt.getReferent(), PersonReferent);
                            if (p === null) 
                                continue;
                            if (have && (cou < 10)) {
                            }
                            else if (gen === MorphGender.FEMINIE) {
                                if (p.isMale && !p.isFemale) 
                                    continue;
                            }
                            else if (gen === MorphGender.MASCULINE) {
                                if (p.isFemale && !p.isMale) 
                                    continue;
                            }
                            else 
                                break;
                            res.beginToken = (have ? tt0.next : tt0);
                            res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, p, false, 0);
                            res.canBeIndependentProperty = true;
                            if (res.morph.number !== MorphNumber.PLURAL) 
                                res.canBeSinglePerson = true;
                            npt = NounPhraseHelper.tryParse(tt0, NounPhraseParseAttr.NO, 0, null);
                            if (npt !== null && npt.beginToken !== npt.endToken) 
                                res.morph = npt.morph;
                            break;
                        }
                    }
                    else if (res.whitespacesAfterCount === 1) {
                        let pa = Utils.as(res.kit.processor.findAnalyzer("PERSON"), PersonAnalyzer);
                        if (pa !== null) {
                            let t1 = res.endToken.next;
                            let pr = PersonAnalyzer.tryAttachPerson(t1, false, 0, true);
                            if (pr !== null && res.canHasPersonAfter === 1) {
                                if (pr.beginToken === t1) {
                                    if (!pr.morph._case.isGenitive && !pr.morph._case.isUndefined) 
                                        pr = null;
                                    else if (!pr.morph._case.isUndefined && !(MorphCase.ooBitand(res.morph._case, pr.morph._case)).isUndefined) {
                                        if (PersonAnalyzer.tryAttachPerson(pr.endToken.next, false, 0, true) !== null) {
                                        }
                                        else 
                                            pr = null;
                                    }
                                }
                                else if (pr.beginToken.previous === t1) {
                                    pr = null;
                                    res.propRef.name = (res.propRef.name + " " + t1.getSourceText().toLowerCase());
                                    res.endToken = t1;
                                }
                                else 
                                    pr = null;
                            }
                            else if (pr !== null && res.canHasPersonAfter === 2) {
                                let pits = PersonItemToken.tryAttachList(t1, PersonItemTokenParseAttr.NO, 10);
                                if (((pits !== null && pits.length > 1 && pits[0].firstname !== null) && pits[1].firstname !== null && pr.endChar > pits[0].endChar) && pits[0].morph._case.isGenitive) {
                                    pr = null;
                                    let cou = 100;
                                    for (let tt = t1.previous; tt !== null && cou > 0; tt = tt.previous,cou--) {
                                        let p0 = Utils.as(tt.getReferent(), PersonReferent);
                                        if (p0 === null) 
                                            continue;
                                        for (const v of pits[0].firstname.vars) {
                                            if (p0.findSlot(PersonReferent.ATTR_FIRSTNAME, v.value, true) !== null) {
                                                pr = new ReferentToken(p0, t1, pits[0].endToken);
                                                break;
                                            }
                                        }
                                        if (pr !== null) 
                                            break;
                                    }
                                }
                                else if (pits !== null && pits.length === 3 && ((pits[2].middlename !== null || ((pits[1].typ === PersonItemTokenItemType.INITIAL && pits[2].typ === PersonItemTokenItemType.INITIAL))))) {
                                    let tt = pits[2].endToken.next;
                                    if (tt !== null && ((tt.isHiphen || tt.isChar('(')))) {
                                        let pits2 = PersonItemToken.tryAttachList(tt.next, PersonItemTokenParseAttr.NO, 10);
                                        if (pits2 !== null && pits2.length > 0) {
                                        }
                                        else 
                                            pr = null;
                                    }
                                    else 
                                        pr = null;
                                }
                            }
                            if (pr !== null) {
                                res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, pr, false, 0);
                                res.endToken = pr.endToken;
                                res.canBeIndependentProperty = true;
                                if (res.morph.number !== MorphNumber.PLURAL) 
                                    res.canBeSinglePerson = true;
                            }
                        }
                    }
                }
        }
        if (res.propRef.higher === null && res.propRef.kind === PersonPropertyKind.BOSS && res.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null) {
            let tok = PersonAttrToken.m_Termins.tryParse(res.beginToken, TerminParseAttr.NO);
            if (tok !== null && tok.endToken === res.endToken) {
                let cou = 0;
                let refs = new Array();
                for (let tt = tok.beginToken.previous; tt !== null; tt = tt.previous) {
                    if (tt.whitespacesAfterCount > 15) 
                        break;
                    if (tt.isNewlineAfter) 
                        cou += 10;
                    if ((++cou) > 1000) 
                        break;
                    if (!(tt instanceof ReferentToken)) 
                        continue;
                    let li = tt.getReferents();
                    if (li === null) 
                        continue;
                    let breaks = false;
                    for (const r of li) {
                        if (((r.typeName === "ORGANIZATION" || r.typeName === "GEO")) && r.parentReferent === null) {
                            if (!refs.includes(r)) {
                                if (res.propRef.canHasRef(r)) 
                                    refs.push(r);
                            }
                        }
                        else if (r instanceof PersonPropertyReferent) {
                            if (r.findSlot(PersonPropertyReferent.ATTR_REF, null, true) !== null) 
                                breaks = true;
                        }
                        else if (r instanceof PersonReferent) 
                            breaks = true;
                    }
                    if (refs.length > 1 || breaks) 
                        break;
                }
                if (refs.length === 1) {
                    res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, refs[0], false, 0);
                    res.addOuterOrgAsRef = true;
                }
            }
        }
        if (res.chars.isLatinLetter && res.propRef !== null && res.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null) {
            if (res.beginToken.previous !== null && res.beginToken.previous.isValue("S", null)) {
                if (MiscHelper.isEngAdjSuffix(res.beginToken.previous.previous) && (res.beginToken.previous.previous.previous instanceof ReferentToken)) {
                    res.beginToken = res.beginToken.previous.previous.previous;
                    res.propRef.addSlot(PersonPropertyReferent.ATTR_REF, res.beginToken.getReferent(), false, 0);
                }
            }
        }
        if (res.chars.isLatinLetter && res.propRef !== null && (res.whitespacesAfterCount < 2)) {
            let rnext = PersonAttrToken.tryAttach(res.endToken.next, PersonAttrTokenPersonAttrAttachAttrs.NO);
            if ((rnext !== null && rnext.chars.isLatinLetter && rnext.propRef !== null) && rnext.propRef.slots.length === 1 && rnext.canHasPersonAfter > 0) {
                res.endToken = rnext.endToken;
                res.propRef.name = (res.propRef.name + " " + rnext.propRef.name);
            }
        }
        return res;
    }
    
    static _TryAttach(t, attrs) {
        const PersonItemToken = require("./PersonItemToken");
        if (t === null) 
            return null;
        if (t.morph._class.isPronoun && (((t.isValue("ЕГО", "ЙОГО") || t.isValue("ЕЕ", "ЇЇ") || t.isValue("HIS", null)) || t.isValue("HER", null)))) {
            let res1 = PersonAttrToken.tryAttach(t.next, attrs);
            if (res1 !== null && res1.propRef !== null) {
                let k = 0;
                for (let tt2 = t.previous; tt2 !== null && (k < 10); tt2 = tt2.previous,k++) {
                    let r = tt2.getReferent();
                    if (r === null) 
                        continue;
                    if (r.typeName === PersonAttrToken.objNameOrg || (r instanceof PersonReferent)) {
                        let ok = false;
                        if (t.isValue("ЕЕ", "ЇЇ") || t.isValue("HER", null)) {
                            if (tt2.morph.gender === MorphGender.FEMINIE) 
                                ok = true;
                        }
                        else if (((tt2.morph.gender.value()) & ((MorphGender.MASCULINE.value()) | (MorphGender.NEUTER.value()))) !== (MorphGender.UNDEFINED.value())) 
                            ok = true;
                        if (ok) {
                            res1.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                            res1.beginToken = t;
                            return res1;
                        }
                        break;
                    }
                }
            }
            return null;
        }
        let nta = NumberHelper.tryParseAge(t);
        if (nta !== null) {
            if (nta.morph._class.isAdjective || ((t.previous !== null && t.previous.isComma)) || ((nta.endToken.next !== null && nta.endToken.next.isCharOf(",.")))) 
                return PersonAttrToken._new2482(t, nta.endToken, PersonAttrTerminType.OTHER, nta.value.toString(), nta.morph);
        }
        if (t.isNewlineBefore) {
            let li = MailLine.parse(t, 0, 0);
            if (li !== null && li.typ === MailLineTypes.BESTREGARDS) 
                return PersonAttrToken._new2484(li.beginToken, li.endToken, PersonAttrTerminType.BESTREGARDS, MorphCollection._new2483(MorphCase.NOMINATIVE));
        }
        let tt = Utils.as(t, TextToken);
        if (tt === null) {
            let nt = Utils.as(t, NumberToken);
            if (nt !== null) {
                if (((nt.value === "1" || nt.value === "2" || nt.value === "3")) && nt.morph._class.isAdjective) {
                    let pat0 = PersonAttrToken._TryAttach(t.next, attrs);
                    if (pat0 !== null && pat0.propRef !== null) {
                        pat0.beginToken = t;
                        for (const s of pat0.propRef.slots) {
                            if (s.typeName === PersonPropertyReferent.ATTR_NAME) {
                                if (s.value.toString().includes("глава")) 
                                    return null;
                                pat0.propRef.uploadSlot(s, ((pat0.morph.gender === MorphGender.FEMINIE || t.morph.gender === MorphGender.FEMINIE ? (nt.value === "1" ? "первая" : (nt.value === "2" ? "вторая" : "третья")) : (nt.value === "1" ? "первый" : (nt.value === "2" ? "второй" : "третий"))) + " " + s.value));
                            }
                        }
                        return pat0;
                    }
                }
            }
            let rr = null;
            if (t !== null) 
                rr = t.getReferent();
            if (rr !== null && (((rr instanceof GeoReferent) || rr.typeName === "ORGANIZATION"))) {
                let ttt = t.next;
                if (MiscHelper.isEngAdjSuffix(ttt)) 
                    ttt = ttt.next.next;
                if ((ttt instanceof TextToken) && ttt.morph.language.isEn && (ttt.whitespacesBeforeCount < 2)) {
                    let res0 = PersonAttrToken._TryAttach(ttt, attrs);
                    if (res0 !== null && res0.propRef !== null) {
                        res0.beginToken = t;
                        res0.propRef.addSlot(PersonPropertyReferent.ATTR_REF, t.getReferent(), false, 0);
                        return res0;
                    }
                }
            }
            if ((rr instanceof PersonReferent) && MiscHelper.isEngAdjSuffix(t.next)) {
                let res0 = PersonAttrToken._TryAttach(t.next.next.next, attrs);
                if (res0 !== null && res0.propRef !== null && res0.chars.isLatinLetter) {
                    res0.beginToken = t;
                    res0.propRef.addSlot(PersonPropertyReferent.ATTR_REF, t.getReferent(), false, 0);
                    return res0;
                }
            }
            return null;
        }
        if (MiscHelper.isEngArticle(tt)) {
            let res0 = PersonAttrToken._TryAttach(t.next, attrs);
            if (res0 !== null) {
                res0.beginToken = t;
                return res0;
            }
        }
        if ((tt.term === "Г" || tt.term === "ГР" || tt.term === "М") || tt.term === "Д") {
            if (tt.next !== null && tt.next.isHiphen && (tt.next.next instanceof TextToken)) {
                let pref = tt.term;
                let tail = tt.next.next.term;
                let vars = null;
                if (pref === "Г") 
                    vars = PersonAttrToken.getStdForms(tail, "ГОСПОДИН", "ГОСПОЖА");
                else if (pref === "ГР") 
                    vars = PersonAttrToken.getStdForms(tail, "ГРАЖДАНИН", "ГРАЖДАНКА");
                else if (pref === "М") 
                    vars = PersonAttrToken.getStdForms(tail, "МИСТЕР", null);
                else if (pref === "Д") {
                    if (PersonAttrToken._findGradeLast(tt.next.next.next, tt) !== null) {
                    }
                    else 
                        vars = PersonAttrToken.getStdForms(tail, "ДОКТОР", null);
                }
                if (vars !== null) {
                    let res = PersonAttrToken._new2480(tt, tt.next.next, PersonAttrTerminType.PREFIX);
                    for (const v of vars) {
                        res.morph.addItem(v);
                        if (res.value === null) {
                            res.value = v.normalCase;
                            res.gender = v.gender;
                        }
                    }
                    return res;
                }
            }
        }
        if (tt.term === "ГР" || tt.term === "ГРАЖД") {
            let t1 = tt;
            if (tt.next !== null && tt.next.isChar('.')) 
                t1 = tt.next;
            if (t1.next instanceof NumberToken) 
                return null;
            return PersonAttrToken._new2486(tt, t1, PersonAttrTerminType.PREFIX, (tt.morph.language.isUa ? "ГРОМАДЯНИН" : "ГРАЖДАНИН"));
        }
        let npt0 = null;
        for (let step = 0; step < 2; step++) {
            let toks = PersonAttrToken.m_Termins.tryParseAll(t, TerminParseAttr.NO);
            if (toks === null && t.isValue("ВРИО", null)) {
                toks = new Array();
                toks.push(TerminToken._new712(t, t, PersonAttrToken.m_TerminVrio));
            }
            else if (toks === null && (t instanceof TextToken) && t.morph.language.isEn) {
                let str = t.term;
                if (str.endsWith("MAN") || str.endsWith("PERSON") || str.endsWith("MIST")) {
                    toks = new Array();
                    toks.push(TerminToken._new712(t, t, PersonAttrTermin._new2488(str, t.morph.language, PersonAttrTerminType.POSITION)));
                }
                else if (str === "MODEL" && (t.whitespacesAfterCount < 2)) {
                    let rt = PersonAnalyzer.processReferentStat(t.next, null);
                    if (rt !== null && (rt.referent instanceof PersonReferent)) {
                        toks = new Array();
                        toks.push(TerminToken._new712(t, t, PersonAttrTermin._new2488(str, t.morph.language, PersonAttrTerminType.POSITION)));
                    }
                }
            }
            if ((toks === null && step === 0 && t.chars.isLatinLetter) && (t.whitespacesAfterCount < 2)) {
                let npt1 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null && npt1.beginToken !== npt1.endToken) {
                    let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANBELATIN.value()) | (PersonItemTokenParseAttr.IGNOREATTRS.value())), 10);
                    if (pits !== null && pits.length > 1 && pits[0].firstname !== null) 
                        npt1 = null;
                    let k = 0;
                    if (npt1 !== null) {
                        for (let tt2 = npt1.beginToken; tt2 !== null && tt2.endChar <= npt1.endChar; tt2 = tt2.next) {
                            let toks1 = PersonAttrToken.m_Termins.tryParseAll(tt2, TerminParseAttr.NO);
                            if (toks1 !== null) {
                                step = 1;
                                toks = toks1;
                                npt0 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, toks1[0].endChar, null);
                                if (!toks[0].termin.isDoubt) {
                                    if (toks[0].morph.number === MorphNumber.PLURAL) {
                                    }
                                    else 
                                        break;
                                }
                            }
                            k++;
                            if (k >= 3 && t.chars.isAllLower) {
                                if (!MiscHelper.isEngArticle(t.previous)) 
                                    break;
                            }
                        }
                    }
                }
                else if (((npt1 === null || npt1.endToken === t)) && t.chars.isCapitalUpper) {
                    let mc = t.getMorphClassInDictionary();
                    if ((mc.isMisc || mc.isPreposition || mc.isConjunction) || mc.isPersonalPronoun || mc.isPronoun) {
                    }
                    else {
                        let tt1 = null;
                        if ((t.next !== null && t.next.isHiphen && !t.isWhitespaceAfter) && !t.next.isWhitespaceAfter) 
                            tt1 = t.next.next;
                        else if (npt1 === null) 
                            tt1 = t.next;
                        let toks1 = PersonAttrToken.m_Termins.tryParseAll(tt1, TerminParseAttr.NO);
                        if (toks1 !== null && toks1[0].termin.typ === PersonAttrTerminType.POSITION && (tt1.whitespacesBeforeCount < 2)) {
                            step = 1;
                            toks = toks1;
                        }
                    }
                }
            }
            if (toks !== null) {
                for (const tok of toks) {
                    if (((tok.morph._class.isPreposition || tok.morph.containsAttr("к.ф.", null))) && tok.endToken === tok.beginToken) 
                        continue;
                    let pat = Utils.as(tok.termin, PersonAttrTermin);
                    if ((tok.endToken instanceof TextToken) && pat.canonicText.startsWith(tok.endToken.term)) {
                        if (tok.lengthChar < pat.canonicText.length) {
                            if (tok.endToken.next !== null && tok.endToken.next.isChar('.')) 
                                tok.endToken = tok.endToken.next;
                        }
                    }
                    if (pat.typ === PersonAttrTerminType.PREFIX) {
                        if (step === 0 || ((pat.canonicText !== "ГРАЖДАНИН" && pat.canonicText !== "ГРОМАДЯНИН"))) 
                            return PersonAttrToken._new2492(tok.beginToken, tok.endToken, PersonAttrTerminType.PREFIX, pat.canonicText, tok.morph, pat.gender);
                    }
                    if (pat.typ === PersonAttrTerminType.BESTREGARDS) {
                        let end = tok.endToken;
                        if (end.next !== null && end.next.isCharOf(",")) 
                            end = end.next;
                        return PersonAttrToken._new2484(tok.beginToken, end, PersonAttrTerminType.BESTREGARDS, MorphCollection._new2483(MorphCase.NOMINATIVE));
                    }
                    if (pat.typ === PersonAttrTerminType.POSITION || pat.typ === PersonAttrTerminType.PREFIX || pat.typ === PersonAttrTerminType.KING) {
                        let res = PersonAttrToken.createAttrPosition(tok, attrs);
                        if (res !== null) {
                            if (pat.typ === PersonAttrTerminType.KING) 
                                res.typ = pat.typ;
                            if (pat.gender !== MorphGender.UNDEFINED && res.gender === MorphGender.UNDEFINED) 
                                res.gender = pat.gender;
                            if (pat.canHasPersonAfter > 0) {
                                if (res.endToken.isValue(pat.canonicText, null)) 
                                    res.canHasPersonAfter = pat.canHasPersonAfter;
                                else 
                                    for (let ii = pat.canonicText.length - 1; ii > 0; ii--) {
                                        if (!Utils.isLetter(pat.canonicText[ii])) {
                                            if (res.endToken.isValue(pat.canonicText.substring(ii + 1), null)) 
                                                res.canHasPersonAfter = pat.canHasPersonAfter;
                                            break;
                                        }
                                    }
                            }
                            if (pat.canBeSameSurname) 
                                res.canBeSameSurname = true;
                            if (pat.canBeIndependant) 
                                res.canBeIndependentProperty = true;
                            if (pat.isDoubt) {
                                res.isDoubt = true;
                                if (res.propRef !== null && (res.propRef.findSlot(PersonPropertyReferent.ATTR_REF, null, true) !== null)) 
                                    res.isDoubt = false;
                            }
                            if ((t.endChar < res.beginChar) && res.propRef !== null) {
                                let tt1 = res.beginToken.previous;
                                if (tt1.isHiphen) 
                                    res.propRef.name = (res.propRef.name + " " + MiscHelper.getTextValue(t, tt1.previous, GetTextAttr.NO).toLowerCase());
                                else 
                                    res.propRef.name = (MiscHelper.getTextValue(t, tt1, GetTextAttr.NO).toLowerCase() + " " + res.propRef.name);
                                res.beginToken = t;
                            }
                        }
                        if (res !== null) {
                            let pit = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.IGNOREATTRS, null);
                            if (pit !== null && pit.typ === PersonItemTokenItemType.INITIAL) {
                                let ok = false;
                                pit = PersonItemToken.tryAttach(pit.endToken.next, PersonItemTokenParseAttr.IGNOREATTRS, null);
                                if (pit !== null && pit.typ === PersonItemTokenItemType.INITIAL) {
                                    pit = PersonItemToken.tryAttach(pit.endToken.next, PersonItemTokenParseAttr.IGNOREATTRS, null);
                                    if (pit !== null && pit.typ === PersonItemTokenItemType.INITIAL) 
                                        ok = true;
                                }
                                if (!ok) {
                                    if (PersonAttrToken._TryAttach(tok.endToken.next, attrs) !== null) 
                                        ok = true;
                                }
                                if (!ok) 
                                    return null;
                            }
                            if (npt0 !== null) {
                                let ttt1 = (npt0.adjectives.length > 0 ? npt0.adjectives[0].beginToken : npt0.beginToken);
                                if (ttt1.beginChar < res.beginChar) 
                                    res.beginToken = ttt1;
                                res.anafor = npt0.anafor;
                                let emptyAdj = null;
                                for (let i = 0; i < npt0.adjectives.length; i++) {
                                    let j = 0;
                                    for (j = 0; j < PersonAttrToken.m_EmptyAdjs.length; j++) {
                                        if (npt0.adjectives[i].isValue(PersonAttrToken.m_EmptyAdjs[j], null)) 
                                            break;
                                    }
                                    if (j < PersonAttrToken.m_EmptyAdjs.length) {
                                        emptyAdj = PersonAttrToken.m_EmptyAdjs[j].toLowerCase();
                                        npt0.adjectives.splice(i, 1);
                                        break;
                                    }
                                }
                                let na0 = npt0.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase();
                                let na1 = res.propRef.name;
                                for (let i = 1; i < (na0.length - 1); i++) {
                                    if (na1.startsWith(na0.substring(i))) {
                                        res.propRef.name = (na0.substring(0, 0 + i).trim() + " " + na1);
                                        break;
                                    }
                                }
                                if (emptyAdj !== null) {
                                    let res1 = PersonAttrToken._new2495(res.beginToken, res.endToken, npt0.morph, res);
                                    res1.propRef = new PersonPropertyReferent();
                                    res1.propRef.name = emptyAdj;
                                    res1.propRef.higher = res.propRef;
                                    res1.canBeIndependentProperty = res.canBeIndependentProperty;
                                    res1.typ = res.typ;
                                    if (res.beginToken !== res.endToken) 
                                        res.beginToken = res.beginToken.next;
                                    res = res1;
                                }
                            }
                            if (res !== null) 
                                res.morph.removeNotInDictionaryItems();
                            return res;
                        }
                    }
                }
            }
            if (step > 0 || t.chars.isLatinLetter) 
                break;
            if (t.morph._class.isAdjective || t.chars.isLatinLetter) {
            }
            else if (t.next !== null && t.next.isHiphen) {
            }
            else 
                break;
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt === null || npt.endToken === t || npt.internalNoun !== null) 
                break;
            if (npt.endToken.isValue("ВИЦЕ", "ВІЦЕ")) 
                break;
            t = npt.endToken;
            npt0 = npt;
        }
        if ((t instanceof TextToken) && (((t.isValue("ВИЦЕ", "ВІЦЕ") || t.isValue("ЭКС", "ЕКС") || t.isValue("VICE", null)) || t.isValue("EX", null) || t.isValue("DEPUTY", null))) && t.next !== null) {
            let te = t.next;
            if (te.isHiphen) 
                te = te.next;
            let ppp = PersonAttrToken._TryAttach(te, attrs);
            if (ppp !== null) {
                if (t.beginChar < ppp.beginChar) {
                    ppp.beginToken = t;
                    if (ppp.propRef !== null && ppp.propRef.name !== null) 
                        ppp.propRef.name = (t.term.toLowerCase() + "-" + ppp.propRef.name);
                }
                return ppp;
            }
            if ((te !== null && te.previous.isHiphen && !te.isWhitespaceAfter) && !te.isWhitespaceBefore) {
                if (BracketHelper.isBracket(te, false)) {
                    let br = BracketHelper.tryParse(te, BracketParseAttr.NO, 100);
                    if (br !== null && (te instanceof TextToken)) {
                        ppp = PersonAttrToken._new2479(t, br.endToken, br.endToken.previous.morph);
                        ppp.propRef = new PersonPropertyReferent();
                        ppp.propRef.name = (t.term + "-" + MiscHelper.getTextValue(te.next, br.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE)).toLowerCase();
                        return ppp;
                    }
                }
            }
        }
        if ((t instanceof TextToken) && t.chars.isLatinLetter) {
            if (t.isValue("STATE", null)) {
                let tt1 = t.next;
                if (MiscHelper.isEngAdjSuffix(tt1)) 
                    tt1 = tt1.next.next;
                let res1 = PersonAttrToken._TryAttach(tt1, attrs);
                if (res1 !== null && res1.propRef !== null) {
                    res1.beginToken = t;
                    res1.propRef.name = (t.term.toLowerCase() + " " + res1.propRef.name);
                    return res1;
                }
            }
        }
        return null;
    }
    
    static getStdForms(tail, w1, w2) {
        let res = new Array();
        let li1 = null;
        let li2 = null;
        let wrapli12501 = new RefOutArgWrapper();
        let inoutres2502 = PersonAttrToken.m_StdForms.tryGetValue(w1, wrapli12501);
        li1 = wrapli12501.value;
        if (!inoutres2502) {
            try {
                li1 = MorphologyService.getAllWordforms(w1, null);
                PersonAttrToken.m_StdForms.put(w1, li1);
            } catch (ex2497) {
            }
        }
        for (const v of li1) {
            if (LanguageHelper.endsWith(v.normalCase, tail)) 
                res.push(v);
        }
        if (w2 !== null) {
            let wrapli22499 = new RefOutArgWrapper();
            let inoutres2500 = PersonAttrToken.m_StdForms.tryGetValue(w2, wrapli22499);
            li2 = wrapli22499.value;
            if (!inoutres2500) {
                try {
                    li2 = MorphologyService.getAllWordforms(w2, null);
                    PersonAttrToken.m_StdForms.put(w2, li2);
                } catch (ex2498) {
                }
            }
        }
        if (li2 !== null) {
            for (const v of li2) {
                if (LanguageHelper.endsWith(v.normalCase, tail)) 
                    res.push(v);
            }
        }
        return (res.length > 0 ? res : null);
    }
    
    static createAttrPosition(tok, attrs) {
        const PersonItemToken = require("./PersonItemToken");
        const PersonIdentityToken = require("./PersonIdentityToken");
        let ty2 = tok.termin.typ2;
        if (ty2 === PersonAttrTerminType2.ABBR) {
            let pr0 = new PersonPropertyReferent();
            pr0.name = tok.termin.canonicText;
            return PersonAttrToken._new2503(tok.beginToken, tok.endToken, pr0, PersonAttrTerminType.POSITION);
        }
        if (ty2 === PersonAttrTerminType2.IO || ty2 === PersonAttrTerminType2.IO2) {
            for (let k = 0; ; k++) {
                if (k > 0) {
                    if (ty2 === PersonAttrTerminType2.IO) 
                        return null;
                    if (((tok.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                        return null;
                    break;
                }
                let tt = tok.endToken.next;
                if (tt !== null && tt.morph._class.isPreposition) 
                    tt = tt.next;
                let resPat = PersonAttrToken._new2480(tok.beginToken, tok.endToken, PersonAttrTerminType.POSITION);
                resPat.propRef = new PersonPropertyReferent();
                if (tt !== null && (tt.getReferent() instanceof PersonPropertyReferent)) {
                    resPat.endToken = tt;
                    resPat.propRef.higher = Utils.as(tt.getReferent(), PersonPropertyReferent);
                }
                else {
                    let aa = attrs;
                    if (ty2 === PersonAttrTerminType2.IO2) 
                        aa = PersonAttrTokenPersonAttrAttachAttrs.of((aa.value()) | (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()));
                    let pat = PersonAttrToken.tryAttach(tt, aa);
                    if (pat === null) {
                        if (!(tt instanceof TextToken)) 
                            continue;
                        let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                        if (npt === null || npt.endToken === tok.endToken.next) 
                            continue;
                        pat = PersonAttrToken.tryAttach(npt.endToken, PersonAttrTokenPersonAttrAttachAttrs.NO);
                        if (pat === null || pat.beginToken !== tt) 
                            continue;
                    }
                    if (pat.typ !== PersonAttrTerminType.POSITION) 
                        continue;
                    resPat.endToken = pat.endToken;
                    resPat.propRef.higher = pat.propRef;
                    resPat.higherPropRef = pat;
                }
                let nam = tok.termin.canonicText;
                let ts = resPat.endToken.next;
                let te = null;
                for (; ts !== null; ts = ts.next) {
                    if (ts.morph._class.isPreposition) {
                        if (ts.isValue("В", null) || ts.isValue("ПО", null)) {
                            if (ts.next instanceof ReferentToken) {
                                let r = ts.next.getReferent();
                                if (r.typeName === PersonAttrToken.objNameGeo || r.typeName === PersonAttrToken.objNameOrg) {
                                    resPat.propRef.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                                    resPat.endToken = ts.next;
                                }
                                else 
                                    te = ts.next;
                                ts = ts.next;
                                continue;
                            }
                            let rt11 = ts.kit.processReferent("NAMEDENTITY", ts.next, null);
                            if (rt11 !== null) {
                                resPat.propRef.addSlot(PersonPropertyReferent.ATTR_REF, rt11, false, 0);
                                resPat.endToken = rt11.endToken;
                                ts = rt11.endToken;
                                continue;
                            }
                        }
                        if (ts.isValue("ПО", null) && ts.next !== null) {
                            let nnn = NounPhraseHelper.tryParse(ts.next, NounPhraseParseAttr.NO, 0, null);
                            if (nnn !== null) 
                                ts = (te = nnn.endToken);
                            else if ((ts.next instanceof TextToken) && ((!ts.next.chars.isAllLower && !ts.next.chars.isCapitalUpper))) 
                                ts = (te = ts.next);
                            else 
                                break;
                            if (ts.next !== null && ts.next.isAnd && nnn !== null) {
                                let nnn2 = NounPhraseHelper.tryParse(ts.next.next, NounPhraseParseAttr.NO, 0, null);
                                if (nnn2 !== null && !(MorphCase.ooBitand(nnn2.morph._case, nnn.morph._case)).isUndefined) 
                                    ts = (te = nnn2.endToken);
                            }
                            continue;
                        }
                        break;
                    }
                    if (ts !== resPat.endToken.next && ts.chars.isAllLower) {
                        let nnn = NounPhraseHelper.tryParse(ts, NounPhraseParseAttr.NO, 0, null);
                        if (nnn === null) 
                            break;
                        ts = (te = nnn.endToken);
                        continue;
                    }
                    break;
                }
                if (te !== null) {
                    let s = MiscHelper.getTextValue(resPat.endToken.next, te, GetTextAttr.NO);
                    if (!Utils.isNullOrEmpty(s)) {
                        nam = (nam + " " + s);
                        resPat.endToken = te;
                    }
                    if ((resPat.higherPropRef !== null && (te.whitespacesAfterCount < 4) && te.next.getReferent() !== null) && te.next.getReferent().typeName === PersonAttrToken.objNameOrg) {
                        resPat.endToken = resPat.higherPropRef.endToken = te.next;
                        resPat.higherPropRef.propRef.addSlot(PersonPropertyReferent.ATTR_REF, te.next.getReferent(), false, 0);
                    }
                }
                let wrapnam2505 = new RefOutArgWrapper(nam);
                resPat.beginToken = PersonAttrToken._analizeVise(resPat.beginToken, wrapnam2505);
                nam = wrapnam2505.value;
                resPat.propRef.name = nam.toLowerCase();
                resPat.morph = tok.morph;
                return resPat;
            }
        }
        if (ty2 === PersonAttrTerminType2.ADJ) {
            let pat = PersonAttrToken._TryAttach(tok.endToken.next, attrs);
            if (pat === null || pat.typ !== PersonAttrTerminType.POSITION) 
                return null;
            if (tok.beginChar === tok.endChar && !tok.beginToken.morph._class.isUndefined) 
                return null;
            pat.beginToken = tok.beginToken;
            pat.propRef.name = (tok.termin.canonicText.toLowerCase() + " " + pat.propRef.name);
            pat.morph = tok.morph;
            return pat;
        }
        if (ty2 === PersonAttrTerminType2.IGNOREDADJ) {
            let pat = PersonAttrToken._TryAttach(tok.endToken.next, attrs);
            if (pat === null || pat.typ !== PersonAttrTerminType.POSITION) 
                return null;
            pat.beginToken = tok.beginToken;
            pat.morph = tok.morph;
            return pat;
        }
        if (ty2 === PersonAttrTerminType2.GRADE) {
            let gr = PersonAttrToken.createAttrGrade(tok);
            if (gr !== null) 
                return gr;
            if (tok.beginToken.isValue("КАНДИДАТ", null)) {
                let tt = tok.endToken.next;
                if (tt !== null && tt.isValue("В", null)) 
                    tt = tt.next;
                else if ((tt !== null && tt.isValue("НА", null) && tt.next !== null) && ((tt.next.isValue("ПОСТ", null) || tt.next.isValue("ДОЛЖНОСТЬ", null)))) 
                    tt = tt.next.next;
                else 
                    tt = null;
                if (tt !== null) {
                    let pat2 = PersonAttrToken._TryAttach(tt, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    if (pat2 !== null) {
                        let res0 = PersonAttrToken._new2480(tok.beginToken, pat2.endToken, PersonAttrTerminType.POSITION);
                        res0.propRef = PersonPropertyReferent._new2481("кандидат");
                        res0.propRef.higher = pat2.propRef;
                        res0.higherPropRef = pat2;
                        res0.morph = tok.morph;
                        return res0;
                    }
                }
            }
            if (!tok.beginToken.isValue("ДОКТОР", null) && !tok.beginToken.isValue("КАНДИДАТ", null)) 
                return null;
        }
        let name = tok.termin.canonicText.toLowerCase();
        let t0 = tok.beginToken;
        let t1 = tok.endToken;
        let wrapname2517 = new RefOutArgWrapper(name);
        t0 = PersonAttrToken._analizeVise(t0, wrapname2517);
        name = wrapname2517.value;
        let pr = new PersonPropertyReferent();
        if ((t1.next !== null && t1.next.isHiphen && !t1.isWhitespaceAfter) && !t1.next.isWhitespaceAfter) {
            if (t1.next.next.chars.equals(t1.chars) || PersonAttrToken.m_Termins.tryParse(t1.next.next, TerminParseAttr.NO) !== null || ((t1.next.next.chars.isAllLower && t1.next.next.chars.isCyrillicLetter))) {
                let npt = NounPhraseHelper.tryParse(t1, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endToken === t1.next.next) {
                    name = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false).toLowerCase();
                    t1 = npt.endToken;
                }
            }
        }
        let tname0 = t1.next;
        let tname1 = null;
        let category = null;
        let npt0 = null;
        let isDepart = false;
        for (let t = t1.next; t !== null; t = t.next) {
            if ((((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD.value()))) !== (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) 
                break;
            if (t === t1.next) {
                if (t.isValue("ИСТЕЦ", "ПОЗИВАЧ") || t.isValue("ОТВЕТЧИК", "ВІДПОВІДАЧ")) {
                    if (t1.isValue("ПРЕДСТАВИТЕЛЬ", "ПРЕДСТАВНИК")) 
                        return null;
                }
            }
            if (MiscHelper.checkNumberPrefix(t) !== null) 
                break;
            if (t.isNewlineBefore) {
                let ok = false;
                if (t.getReferent() !== null) {
                    if (t.getReferent().typeName === PersonAttrToken.objNameOrg || (t.getReferent() instanceof GeoReferent)) {
                        if (pr.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null) 
                            ok = true;
                    }
                }
                if (t.newlinesBeforeCount > 1 && !t.chars.isAllLower) {
                    if (!ok) 
                        break;
                    if ((t.newlinesAfterCount < 3) && tok.beginToken.isNewlineBefore) {
                    }
                    else 
                        break;
                }
                if (tok.isNewlineBefore) {
                    if (PersonAttrToken.m_Termins.tryParse(t, TerminParseAttr.NO) !== null) 
                        break;
                    else 
                        ok = true;
                }
                if (t0.previous !== null && t0.previous.isChar('(')) {
                    let br0 = BracketHelper.tryParse(t0.previous, BracketParseAttr.CANBEMANYLINES, 10);
                    if (br0 !== null && br0.endChar > t.endChar) 
                        ok = true;
                }
                if (!ok) {
                    let npt00 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
                    if (npt00 !== null && npt00.endToken.next !== null && !PersonAttrToken._isPerson(t)) {
                        let tt1 = npt00.endToken;
                        let zap = false;
                        let and = false;
                        for (let ttt = tt1.next; ttt !== null; ttt = ttt.next) {
                            if (!ttt.isCommaAnd) 
                                break;
                            npt00 = NounPhraseHelper.tryParse(ttt.next, NounPhraseParseAttr.NO, 0, null);
                            if (npt00 === null) 
                                break;
                            tt1 = npt00.endToken;
                            if (ttt.isChar(',')) 
                                zap = true;
                            else {
                                and = true;
                                break;
                            }
                            ttt = npt00.endToken;
                        }
                        if (zap && !and) {
                        }
                        else if (tt1.next === null) {
                        }
                        else {
                            if (PersonAttrToken._isPerson(tt1.next)) 
                                ok = true;
                            else if (tt1.next.getReferent() instanceof GeoReferent) {
                                if (PersonAttrToken._isPerson(tt1.next.next)) 
                                    ok = true;
                                else {
                                    let ccc = null;
                                    let wrapccc2508 = new RefOutArgWrapper();
                                    let ttt = PersonAttrToken.tryAttachCategory(tt1.next.next, wrapccc2508);
                                    ccc = wrapccc2508.value;
                                    if (ttt !== null) 
                                        ok = true;
                                }
                            }
                            if (ok) {
                                t = (t1 = (tname1 = tt1));
                                continue;
                            }
                        }
                    }
                    break;
                }
            }
            if (t.isChar('(')) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    t = br.endToken;
                    let ok = true;
                    for (let ttt = br.beginToken; ttt !== br.endToken; ttt = ttt.next) {
                        if (ttt.chars.isLetter) {
                            if (!ttt.chars.isAllLower) {
                                ok = false;
                                break;
                            }
                        }
                    }
                    if (!ok) 
                        break;
                    continue;
                }
                else 
                    break;
            }
            let tt2 = PersonAttrToken._analyzeRomanNums(t);
            if (tt2 !== null) {
                t1 = (t = tt2);
                if (t.isValue("СОЗЫВ", null) && t.next !== null && t.next.isValue("ОТ", null)) {
                    t = t.next;
                    continue;
                }
                break;
            }
            let pat = null;
            if ((((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD.value()))) === (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) 
                pat = PersonAttrToken._TryAttach(t, PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD);
            if (pat !== null) {
                if (pat.morph.number === MorphNumber.PLURAL && !pat.morph._case.isNominative) {
                }
                else if (((tok.termin instanceof PersonAttrTermin) && tok.termin.isDoubt && pat.propRef !== null) && pat.propRef.slots.length === 1 && tok.chars.isLatinLetter === pat.chars.isLatinLetter) {
                    t1 = (tname1 = (t = pat.endToken));
                    continue;
                }
                else if ((!tok.morph._case.isGenitive && (tok.termin instanceof PersonAttrTermin) && tok.termin.canHasPersonAfter === 1) && pat.morph._case.isGenitive) {
                    let rr = null;
                    if (!t.kit.miscData.containsKey("IgnorePersons")) {
                        t.kit.miscData.put("IgnorePersons", null);
                        rr = PersonAnalyzer.processReferentStat(t, null);
                        if (t.kit.miscData.containsKey("IgnorePersons")) 
                            t.kit.miscData.remove("IgnorePersons");
                    }
                    if (rr !== null && rr.morph._case.isGenitive) {
                        pr.addExtReferent(rr);
                        pr.addSlot(PersonPropertyReferent.ATTR_REF, rr.referent, false, 0);
                        t1 = (t = rr.endToken);
                    }
                    else 
                        t1 = (tname1 = (t = pat.endToken));
                    continue;
                }
                else if (t.isValue("ГР", null) && (pat.endToken.next instanceof TextToken) && !pat.endToken.next.chars.isAllLower) {
                    let ppp = PersonAnalyzer.processReferentStat(pat.endToken.next.next, null);
                    if (ppp !== null) {
                        t1 = (tname1 = (t = pat.endToken));
                        continue;
                    }
                    break;
                }
                else 
                    break;
            }
            let te = t;
            if (te.next !== null && te.isCharOf(",в") && (((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()))) === (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) {
                te = te.next;
                if (te.isValue("ОРГАНИЗАЦИЯ", null) && (te.next instanceof ReferentToken) && te.next.getReferent().typeName === PersonAttrToken.objNameOrg) 
                    te = te.next;
            }
            else if (te.next !== null && te.morph._class.isPreposition) {
                if ((((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()))) === (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value())) 
                    break;
                if (((te.isValue("ИЗ", null) || te.isValue("ПРИ", null) || te.isValue("ПО", null)) || te.isValue("НА", null) || te.isValue("ОТ", null)) || te.isValue("OF", null)) 
                    te = te.next;
            }
            else if ((te.isHiphen && te.next !== null && !te.isWhitespaceBefore) && !te.isWhitespaceAfter && te.previous.chars.equals(te.next.chars)) 
                continue;
            else if (te.isValue("REPRESENT", null) && (te.next instanceof ReferentToken)) 
                te = te.next;
            let r = te.getReferent();
            let r1 = null;
            if ((te.chars.isLatinLetter && te.lengthChar > 1 && !t0.chars.isLatinLetter) && !te.chars.isAllLower) {
                if (r === null || r.typeName !== PersonAttrToken.objNameOrg) {
                    let wrapcategory2509 = new RefOutArgWrapper();
                    let tt = PersonAttrToken.tryAttachCategory(t, wrapcategory2509);
                    category = wrapcategory2509.value;
                    if (tt !== null && name !== null) {
                        t = (t1 = tt);
                        continue;
                    }
                    for (; te !== null; te = te.next) {
                        if (te.chars.isLetter) {
                            if (!te.chars.isLatinLetter) 
                                break;
                            t1 = (tname1 = (t = te));
                        }
                    }
                    continue;
                }
            }
            if (r !== null) {
                if ((r.typeName === PersonAttrToken.objNameGeo && te.previous !== null && te.previous.isValue("ДЕЛО", "СПРАВІ")) && te.previous.previous !== null && te.previous.previous.isValue("ПО", null)) {
                    t1 = (tname1 = (t = te));
                    continue;
                }
                if (r.typeName === PersonAttrToken.objNameGeo && tok.termin.typ === PersonAttrTerminType.KING && te.endToken.morph._class.isAdjective) 
                    break;
                if ((r.typeName === PersonAttrToken.objNameGeo || r.typeName === PersonAttrToken.objNameAddr || r.typeName === "DATERANGE") || r.typeName === PersonAttrToken.objNameOrg || r.typeName === PersonAttrToken.objNameTransport) {
                    if (t0.previous !== null && t0.previous.isValue("ОТ", null) && t.isNewlineBefore) 
                        break;
                    t1 = te;
                    pr.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                    let posol = ((r.typeName === PersonAttrToken.objNameGeo || r.typeName === PersonAttrToken.objNameOrg)) && LanguageHelper.endsWithEx(name, "посол", "представитель", "консул", "представник");
                    if (posol) {
                        t = t1;
                        continue;
                    }
                    if ((((r.typeName === PersonAttrToken.objNameGeo && t1.next !== null && t1.next.morph._class.isPreposition) && t1.next.next !== null && !t1.next.isValue("О", null)) && !t1.next.isValue("ОБ", null) && (((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()))) === (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) && !tok.termin.isBoss) {
                        if ((((r1 = t1.next.next.getReferent()))) !== null) {
                            if (r1.typeName === PersonAttrToken.objNameOrg) {
                                pr.addSlot(PersonPropertyReferent.ATTR_REF, r1, false, 0);
                                t = (t1 = t1.next.next);
                            }
                        }
                    }
                    if (r.typeName === PersonAttrToken.objNameOrg) {
                        for (t = te.next; t !== null; t = t.next) {
                            if (((t instanceof TextToken) && t.lengthChar >= 2 && t.chars.isAllUpper) && (t.whitespacesBeforeCount < 2)) {
                                t1 = t;
                                continue;
                            }
                            if (!t.isCommaAnd || !(t.next instanceof ReferentToken)) 
                                break;
                            r = t.next.getReferent();
                            if (r === null) 
                                break;
                            if (r.typeName !== PersonAttrToken.objNameOrg) 
                                break;
                            pr.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                            t = t.next;
                            t1 = t;
                            if (t.previous.isAnd) {
                                t = t.next;
                                break;
                            }
                        }
                        for (; t !== null; t = t.next) {
                            if (t.isNewlineBefore) 
                                break;
                            tt2 = PersonAttrToken._analyzeRomanNums(t);
                            if (tt2 !== null) {
                                t1 = (t = tt2);
                                if (t.isValue("СОЗЫВ", null) && t.next !== null && t.next.isValue("ОТ", null)) 
                                    t = t.next;
                                else 
                                    break;
                            }
                            if (t.isValue("В", null) || t.isValue("ОТ", null) || t.isAnd) 
                                continue;
                            if (t.morph.language.isUa) {
                                if (t.isValue("ВІД", null)) 
                                    continue;
                            }
                            if (((t instanceof TextToken) && t.chars.isLetter && !t.chars.isAllLower) && t.previous.isValue("ОТ", "ВІД")) {
                                tname0 = t.previous;
                                tname1 = (t1 = t);
                                continue;
                            }
                            if ((t instanceof TextToken) && BracketHelper.canBeStartOfSequence(t, false, false) && t.previous.isValue("ОТ", "ВІД")) {
                                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                                if (br !== null && (br.lengthChar < 100)) {
                                    tname0 = t.previous;
                                    tname1 = (t1 = (t = br.endToken));
                                    continue;
                                }
                            }
                            if (((t instanceof TextToken) && t.lengthChar > 2 && t.previous.isValue("В", null)) && tname1 === null && t.next !== null) {
                                let rt = PersonAnalyzer.processReferentStat(t.next, null);
                                if (rt !== null || (t.next.getReferent() instanceof PersonReferent)) {
                                    tname0 = t.previous;
                                    tname1 = (t1 = t);
                                    continue;
                                }
                            }
                            r = t.getReferent();
                            if (r === null) 
                                break;
                            if (r.typeName !== PersonAttrToken.objNameGeo) {
                                if (r.typeName === PersonAttrToken.objNameOrg && t.previous !== null && ((t.previous.isValue("ОТ", null) || t.previous.isValue("ВІД", null)))) {
                                }
                                else 
                                    break;
                            }
                            pr.addSlot(PersonPropertyReferent.ATTR_REF, r, false, 0);
                            t1 = t;
                        }
                    }
                }
                if ((t1.next !== null && (t1.whitespacesAfterCount < 2) && t1.next.chars.isLatinLetter) && !t1.next.chars.isAllLower && MiscHelper.checkNumberPrefix(t1.next) === null) {
                    for (t = t1.next; t !== null; t = t.next) {
                        if (!(t instanceof TextToken)) 
                            break;
                        if (!t.chars.isLetter) 
                            break;
                        if (!t.chars.isLatinLetter) 
                            break;
                        if (t.kit.baseLanguage.isEn) 
                            break;
                        let ttt = PersonAttrToken._analyzeRomanNums(t);
                        if (ttt !== null) 
                            t = ttt;
                        t1 = (tname1 = t);
                    }
                }
                t = t1;
                if (((tname0 === t && tname1 === null && t.next !== null) && (((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()))) === (PersonAttrTokenPersonAttrAttachAttrs.NO.value()) && name !== "президент") && t.next.isValue("ПО", null)) {
                    tname0 = t.next;
                    continue;
                }
                break;
            }
            if (category === null) {
                let wrapcategory2510 = new RefOutArgWrapper();
                let tt = PersonAttrToken.tryAttachCategory(t, wrapcategory2510);
                category = wrapcategory2510.value;
                if (tt !== null && name !== null) {
                    t = (t1 = tt);
                    continue;
                }
            }
            if (name === "премьер") 
                break;
            if (t instanceof TextToken) {
                if (t.isValue("ИМЕНИ", "ІМЕНІ")) 
                    break;
            }
            if (!t.chars.isAllLower) {
                let pit = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANBELATIN.value()) | (PersonItemTokenParseAttr.IGNOREATTRS.value())), null);
                if (pit !== null) {
                    if (pit.referent !== null) 
                        break;
                    if (pit.lastname !== null && ((pit.lastname.isInDictionary || pit.lastname.isInOntology))) 
                        break;
                    if (pit.firstname !== null && pit.firstname.isInDictionary) 
                        break;
                    if (tok.termin.typ === PersonAttrTerminType.KING) {
                        if (pit.lastname !== null || pit.value === null) 
                            break;
                        if (pit.value.endsWith("КИЙ")) 
                            break;
                    }
                    let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.NO.value()) | (PersonItemTokenParseAttr.IGNOREATTRS.value())), 6);
                    if (pits !== null && pits.length > 0) {
                        if (pits.length === 2) {
                            if (pits[1].lastname !== null && pits[1].lastname.isInDictionary) 
                                break;
                            if (pits[1].typ === PersonItemTokenItemType.INITIAL && pits[0].lastname !== null) 
                                break;
                        }
                        if (pits.length === 3) {
                            if (pits[2].lastname !== null) {
                                if (pits[1].middlename !== null) 
                                    break;
                                if (pits[0].firstname !== null && pits[0].firstname.isInDictionary) 
                                    break;
                            }
                            if (pits[1].typ === PersonItemTokenItemType.INITIAL && pits[2].typ === PersonItemTokenItemType.INITIAL && pits[0].lastname !== null) 
                                break;
                        }
                        if (pits[0].typ === PersonItemTokenItemType.INITIAL) 
                            break;
                        if (tok.termin.typ === PersonAttrTerminType.KING) {
                            if (pits[0].morph._case.isUndefined && !pits[0].morph._case.isGenitive) 
                                break;
                            if (pits.length === 1) {
                                let mc1 = pits[0].beginToken.getMorphClassInDictionary();
                                if (mc1.isUndefined) 
                                    break;
                            }
                        }
                    }
                }
            }
            let testPerson = false;
            if (!t.chars.isAllLower) {
                if (t.kit.miscData.containsKey("TestAttr")) {
                }
                else {
                    let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.IGNOREATTRS, 10);
                    if (pits !== null && pits.length > 1) {
                        let nnn = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                        let iii = 1;
                        if (nnn !== null && nnn.adjectives.length > 0) 
                            iii += nnn.adjectives.length;
                        testPerson = true;
                        t.kit.miscData.put("TestAttr", null);
                        let li = PersonIdentityToken.tryAttach(pits, 0, MorphBaseInfo._new2511(MorphCase.ALL_CASES), null, false, false);
                        t.kit.miscData.remove("TestAttr");
                        if (li.length > 0 && li[0].coef > 1) {
                            t.kit.miscData.put("TestAttr", null);
                            let li1 = PersonIdentityToken.tryAttach(pits, iii, MorphBaseInfo._new2511(MorphCase.ALL_CASES), null, false, false);
                            t.kit.miscData.remove("TestAttr");
                            if (li1.length === 0) 
                                break;
                            if (li1[0].coef <= li[0].coef) 
                                break;
                        }
                        else {
                            t.kit.miscData.put("TestAttr", null);
                            let li1 = PersonIdentityToken.tryAttach(pits, 1, MorphBaseInfo._new2511(MorphCase.ALL_CASES), null, false, false);
                            t.kit.miscData.remove("TestAttr");
                            if (li1.length > 0 && li1[0].coef >= 1 && li1[0].beginToken === t) 
                                continue;
                        }
                    }
                }
            }
            if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if ((br !== null && t.next.getReferent() !== null && t.next.getReferent().typeName === PersonAttrToken.objNameOrg) && t.next.next === br.endToken) {
                    pr.addSlot(PersonPropertyReferent.ATTR_REF, t.next.getReferent(), false, 0);
                    t1 = br.endToken;
                    break;
                }
                else if (br !== null && (br.lengthChar < 40)) {
                    t = (t1 = (tname1 = br.endToken));
                    continue;
                }
            }
            if ((t instanceof NumberToken) && t.previous.isValue("ГЛАВА", null)) 
                break;
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if ((npt === null && (t instanceof NumberToken) && (t.whitespacesAfterCount < 3)) && (t.whitespacesBeforeCount < 3)) {
                let npt00 = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt00 !== null) {
                    if (npt00.endToken.isValue("ОРДЕН", null) || npt00.endToken.isValue("МЕДАЛЬ", null)) 
                        npt = npt00;
                }
            }
            let test = false;
            if (npt !== null) {
                if (PersonAttrToken._existsInDoctionary(npt.endToken) && (((((npt.morph._case.isGenitive || npt.morph._case.isInstrumental || npt.endToken.isValue("НАПРАВЛЕНИЕ", null)) || npt.endToken.isValue("ОТДЕЛ", null) || npt.endToken.isValue("ОТДЕЛЕНИЕ", null)) || npt.endToken.isValue("ДЕПАРТАМЕНТ", null) || npt.endToken.isValue("СЛУЖБА", null)) || npt.endToken.isValue("ПОДРАЗДЕЛЕНИЕ", null)))) {
                    test = true;
                    isDepart = true;
                }
                else if (npt.beginToken === npt.endToken && t.lengthChar > 1 && ((t.chars.isAllUpper || t.chars.isLastLower))) 
                    test = true;
            }
            else if (t.chars.isAllUpper || t.chars.isLastLower) 
                test = true;
            if (test) {
                let rto = t.kit.processReferent("ORGANIZATION", t, null);
                if (rto !== null) {
                    let str = rto.referent.toString().toUpperCase();
                    if (str.startsWith("ГОСУДАРСТВЕННАЯ ГРАЖДАНСКАЯ СЛУЖБА")) 
                        rto = null;
                }
                if (rto !== null && rto.endChar >= t.endChar && rto.beginChar === t.beginChar) {
                    pr.addSlot(PersonPropertyReferent.ATTR_REF, rto.referent, false, 0);
                    pr.addExtReferent(rto);
                    t = (t1 = rto.endToken);
                    if ((((attrs.value()) & (PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value()))) !== (PersonAttrTokenPersonAttrAttachAttrs.NO.value())) 
                        break;
                    npt0 = npt;
                    if (t.next !== null && t.next.isAnd) {
                        let rto2 = t.kit.processReferent("ORGANIZATION", t.next.next, null);
                        if (rto2 !== null && rto2.beginChar === t.next.next.beginChar) {
                            pr.addSlot(PersonPropertyReferent.ATTR_REF, rto2.referent, false, 0);
                            pr.addExtReferent(rto2);
                            t = (t1 = rto2.endToken);
                        }
                    }
                    continue;
                }
                rto = t.kit.processReferent("NAMEDENTITY", t, null);
                if (rto !== null && rto.morph._case.isGenitive) {
                    pr.addSlot(PersonPropertyReferent.ATTR_REF, rto.referent, false, 0);
                    pr.addExtReferent(rto);
                    t = (t1 = rto.endToken);
                    continue;
                }
                if (npt !== null) {
                    t = (t1 = (tname1 = npt.endToken));
                    npt0 = npt;
                    continue;
                }
                if (((isDepart && t.chars.isAllUpper && t.lengthChar > 1) && (t.lengthChar < 6) && !t.previous.chars.isAllUpper) && t.getMorphClassInDictionary().isUndefined) {
                    t1 = (tname1 = t);
                    for (let tt = t.next; tt !== null; tt = tt.next) {
                        if (!tt.isCommaAnd || tt.next === null) 
                            break;
                        tt = tt.next;
                        if (tt.chars.isAllUpper && tt.lengthChar > 1 && (tt.lengthChar < 6)) {
                        }
                        else 
                            break;
                        t1 = (tname1 = (t = tt));
                        if (tt.previous.isAnd) 
                            break;
                    }
                    continue;
                }
            }
            if (t.morph._class.isPreposition) {
                npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt === null && t.next !== null && t.next.morph._class.isAdverb) 
                    npt = NounPhraseHelper.tryParse(t.next.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && PersonAttrToken._existsInDoctionary(npt.endToken)) {
                    if (BracketHelper.canBeStartOfSequence(npt.endToken.next, true, false)) {
                        if (((t.isValue("ПО", "ЗА") && npt.endToken.isValue("СПЕЦИАЛЬНОСТЬ", "ФАХОМ"))) || ((t.isValue("С", "ЗІ") && npt.endToken.isValue("СПЕЦИАЛИЗАЦИЯ", "СПЕЦІАЛІЗАЦІЯ")))) {
                            let br = BracketHelper.tryParse(npt.endToken.next, BracketParseAttr.NO, 100);
                            if (br !== null) {
                                t = (t1 = br.endToken);
                                continue;
                            }
                        }
                    }
                    let ok = false;
                    if ((t.isValue("ПО", null) && npt.morph._case.isDative && !npt.noun.isValue("ИМЯ", "ІМЯ")) && !npt.noun.isValue("ПРОЗВИЩЕ", "ПРІЗВИСЬКО") && !npt.noun.isValue("ПРОЗВАНИЕ", "ПРОЗВАННЯ")) {
                        ok = true;
                        if (npt.noun.isValue("РАБОТА", "РОБОТА") || npt.noun.isValue("ПОДДЕРЖКА", "ПІДТРИМКА") || npt.noun.isValue("СОПРОВОЖДЕНИЕ", "СУПРОВІД")) {
                            let npt2 = NounPhraseHelper.tryParse(npt.endToken.next, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
                            if (npt2 !== null) 
                                npt = npt2;
                        }
                    }
                    else if (npt.noun.isValue("ОТСТАВКА", null) || npt.noun.isValue("ВІДСТАВКА", null)) 
                        ok = true;
                    else if (name === "кандидат" && t.isValue("В", null)) 
                        ok = true;
                    if (ok) {
                        t = (t1 = (tname1 = npt.endToken));
                        npt0 = npt;
                        continue;
                    }
                }
                if (t.isValue("OF", null)) 
                    continue;
            }
            else if (t.isAnd && npt0 !== null) {
                npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && !(MorphClass.ooBitand(npt.morph._class, npt0.morph._class)).isUndefined) {
                    if (npt0.chars.equals(npt.chars)) {
                        t = (t1 = (tname1 = npt.endToken));
                        npt0 = null;
                        continue;
                    }
                }
                if (((npt === null && (t.next instanceof TextToken) && t.next.chars.isAllUpper) && t.next.lengthChar >= 2 && t.previous !== null) && t.previous.chars.equals(t.next.chars)) {
                    t = (t1 = (tname1 = t.next));
                    npt0 = null;
                    continue;
                }
            }
            else if (t.isCommaAnd && ((!t.isNewlineAfter || tok.isNewlineBefore)) && npt0 !== null) {
                npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && !(MorphClass.ooBitand(npt.morph._class, npt0.morph._class)).isUndefined) {
                    if (npt0.chars.equals(npt.chars) && npt.endToken.next !== null && npt.endToken.next.isAnd) {
                        let npt1 = NounPhraseHelper.tryParse(npt.endToken.next.next, NounPhraseParseAttr.NO, 0, null);
                        if (npt1 !== null && !(MorphClass.ooBitand(npt1.morph._class, MorphClass.ooBitand(npt.morph._class, npt0.morph._class))).isUndefined) {
                            if (npt0.chars.equals(npt1.chars)) {
                                t = (t1 = (tname1 = npt1.endToken));
                                npt0 = null;
                                continue;
                            }
                        }
                    }
                }
            }
            else if (t.morph._class.isAdjective && BracketHelper.canBeStartOfSequence(t.next, true, false)) {
                let br = BracketHelper.tryParse(t.next, BracketParseAttr.NO, 100);
                if (br !== null && (br.lengthChar < 100)) {
                    t = (t1 = (tname1 = br.endToken));
                    npt0 = null;
                    continue;
                }
            }
            if (t.chars.isLatinLetter && t.previous.chars.isCyrillicLetter) {
                for (; t !== null; t = t.next) {
                    if (!t.chars.isLatinLetter || t.isNewlineBefore) 
                        break;
                    else 
                        t1 = (tname1 = t);
                }
                break;
            }
            if (((t.chars.isAllUpper || ((!t.chars.isAllLower && !t.chars.isCapitalUpper)))) && t.lengthChar > 1 && !t0.chars.isAllUpper) {
                t1 = (tname1 = t);
                continue;
            }
            if ((!t.chars.isAllLower && !t.chars.isAllUpper && !t.chars.isCapitalUpper) && t.lengthChar > 2 && !t0.chars.isAllUpper) {
                t1 = (tname1 = t);
                continue;
            }
            if (((t.chars.isLetter && (t.next instanceof ReferentToken) && (t.next.getReferent() instanceof PersonReferent)) && !t.morph._class.isPreposition && !t.morph._class.isConjunction) && !t.morph._class.isVerb) {
                t1 = (tname1 = t);
                break;
            }
            if (t instanceof NumberToken) {
                if (t.beginToken.isValue("МИЛЛИОНОВ", null) || t.beginToken.isValue("МІЛЬЙОНІВ", null)) {
                    t1 = (tname1 = t);
                    break;
                }
            }
            if (testPerson) {
                if (t.next === null) 
                    break;
                te = t.next;
                if (((te.isCharOf(",в") || te.isValue("ИЗ", null))) && te.next !== null) 
                    te = te.next;
                if ((((r = te.getReferent()))) !== null) {
                    if (r.typeName === PersonAttrToken.objNameGeo || r.typeName === PersonAttrToken.objNameOrg || r.typeName === PersonAttrToken.objNameTransport) {
                        t1 = (tname1 = t);
                        continue;
                    }
                }
                break;
            }
            if (t.morph.language.isEn) 
                break;
            if (t.morph._class.isNoun && t.getMorphClassInDictionary().isUndefined && (t.whitespacesBeforeCount < 2)) {
                t1 = (tname1 = t);
                continue;
            }
            if (t.morph._class.isPronoun) 
                continue;
            if ((t.isHiphen && tname1 === t.previous && !t.isWhitespaceBefore) && !t.isWhitespaceAfter && (t.next instanceof TextToken)) {
                t = t.next;
                t1 = (tname1 = t);
                continue;
            }
            break;
        }
        if (tname1 !== null) {
            if (pr.findSlot(PersonPropertyReferent.ATTR_REF, null, true) === null && ((((((tname1.isValue("КОМПАНИЯ", "КОМПАНІЯ") || tname1.isValue("ФИРМА", "ФІРМА") || tname1.isValue("ГРУППИРОВКА", "УГРУПОВАННЯ")) || tname1.isValue("ПРЕДПРИЯТИЕ", "ПІДПРИЄМСТВО") || tname1.isValue("ПРЕЗИДИУМ", "ПРЕЗИДІЯ")) || tname1.isValue("ЧАСТЬ", "ЧАСТИНА") || tname1.isValue("ФЕДЕРАЦИЯ", "ФЕДЕРАЦІЯ")) || tname1.isValue("ВЕДОМСТВО", "ВІДОМСТВО") || tname1.isValue("БАНК", null)) || tname1.isValue("КОРПОРАЦИЯ", "КОРПОРАЦІЯ")))) {
                if (tname1 === tname0 || ((tname0.isValue("ЭТОТ", "ЦЕЙ") && tname0.next === tname1))) {
                    let _org = null;
                    let cou = 0;
                    for (let tt0 = t0.previous; tt0 !== null; tt0 = tt0.previous) {
                        if (tt0.isNewlineAfter) 
                            cou += 10;
                        if ((++cou) > 500) 
                            break;
                        let rs0 = tt0.getReferents();
                        if (rs0 === null) 
                            continue;
                        let hasOrg = false;
                        for (const r0 of rs0) {
                            if (r0.typeName === PersonAttrToken.objNameOrg) {
                                hasOrg = true;
                                if (tname1.isValue("БАНК", null)) {
                                    if (r0.findSlot("TYPE", "банк", true) === null) 
                                        continue;
                                }
                                if (tname1.isValue("ЧАСТЬ", "ЧАСТИНА")) {
                                    let ok1 = false;
                                    for (const s of r0.slots) {
                                        if (s.typeName === "TYPE") {
                                            if (String(s.value).endsWith("часть") || String(s.value).endsWith("частина")) 
                                                ok1 = true;
                                        }
                                    }
                                    if (!ok1) 
                                        continue;
                                }
                                _org = r0;
                                break;
                            }
                        }
                        if (_org !== null || hasOrg) 
                            break;
                    }
                    if (_org !== null) {
                        pr.addSlot(PersonPropertyReferent.ATTR_REF, _org, false, 0);
                        tname1 = null;
                    }
                }
            }
        }
        if (tname1 !== null) {
            let s = MiscHelper.getTextValue(tname0, tname1, GetTextAttr.NO);
            if (s !== null) 
                name = (name + " " + s.toLowerCase());
        }
        if (category !== null) 
            name = (name + " " + category);
        else {
            let wrapcategory2514 = new RefOutArgWrapper();
            let tt = PersonAttrToken.tryAttachCategory(t1.next, wrapcategory2514);
            category = wrapcategory2514.value;
            if (tt !== null) {
                name = (name + " " + category);
                t1 = tt;
            }
        }
        pr.name = name;
        let res = PersonAttrToken._new2515(t0, t1, PersonAttrTerminType.POSITION, pr, tok.morph);
        res.canBeIndependentProperty = tok.termin.canBeUniqueIdentifier;
        let i = name.indexOf("заместитель ");
        if (i < 0) 
            i = name.indexOf("заступник ");
        if (i >= 0) {
            i += 11;
            let res1 = PersonAttrToken._new2484(t0, t1, PersonAttrTerminType.POSITION, tok.morph);
            res1.propRef = new PersonPropertyReferent();
            res1.propRef.name = name.substring(0, 0 + i);
            res1.propRef.higher = res.propRef;
            res1.higherPropRef = res;
            res.propRef.name = name.substring(i + 1);
            return res1;
        }
        return res;
    }
    
    static _existsInDoctionary(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return false;
        for (const wf of tt.morph.items) {
            if (wf.isInDictionary) 
                return true;
        }
        return false;
    }
    
    static _isPerson(t) {
        if (t === null) 
            return false;
        if (t instanceof ReferentToken) 
            return t.getReferent() instanceof PersonReferent;
        if (!t.chars.isLetter || t.chars.isAllLower) 
            return false;
        let rt00 = PersonAnalyzer.processReferentStat(t, null);
        return rt00 !== null && (rt00.referent instanceof PersonReferent);
    }
    
    static _analyzeRomanNums(t) {
        let tt2 = t;
        if (tt2.isValue("В", null) && tt2.next !== null) 
            tt2 = tt2.next;
        let lat = NumberHelper.tryParseRoman(tt2);
        if (lat === null) 
            return null;
        tt2 = lat.endToken;
        if (tt2.next !== null && tt2.next.isHiphen) {
            let lat2 = NumberHelper.tryParseRoman(tt2.next.next);
            if (lat2 !== null) 
                tt2 = lat2.endToken;
        }
        else if (tt2.next !== null && tt2.next.isCommaAnd) {
            let lat2 = NumberHelper.tryParseRoman(tt2.next.next);
            if (lat2 !== null) {
                tt2 = lat2.endToken;
                for (let tt = tt2.next; tt !== null; tt = tt.next) {
                    if (!tt.isCommaAnd && !tt.isHiphen) 
                        break;
                    lat2 = NumberHelper.tryParseRoman(tt.next);
                    if (lat2 === null) 
                        break;
                    tt2 = lat2.endToken;
                    if (tt.isAnd) 
                        break;
                    tt = tt2;
                }
            }
        }
        if (tt2.next !== null && ((tt2.next.isValue("ВЕК", null) || tt2.next.isValue("СТОЛЕТИЕ", null) || tt2.next.isValue("СОЗЫВ", null)))) 
            return tt2.next;
        if (tt2.next !== null && tt2.next.isValue("В", null)) {
            tt2 = tt2.next;
            if (tt2.next !== null && tt2.next.isChar('.')) 
                tt2 = tt2.next;
            return tt2;
        }
        return null;
    }
    
    static _analizeVise(t0, name) {
        if (t0 === null) 
            return null;
        if (t0.previous !== null && t0.previous.isHiphen && (t0.previous.previous instanceof TextToken)) {
            if (t0.previous.previous.isValue("ВИЦЕ", "ВІЦЕ")) {
                t0 = t0.previous.previous;
                name.value = ((t0.kit.baseLanguage.isUa ? "віце-" : "вице-")) + name.value;
            }
            if (t0.previous !== null && t0.previous.previous !== null) {
                if (t0.previous.previous.isValue("ЭКС", "ЕКС")) {
                    t0 = t0.previous.previous;
                    name.value = ((t0.kit.baseLanguage.isUa ? "екс-" : "экс-")) + name.value;
                }
                else if (t0.previous.previous.chars.equals(t0.chars) && !t0.isWhitespaceBefore && !t0.previous.isWhitespaceBefore) {
                    let npt00 = NounPhraseHelper.tryParse(t0.previous.previous, NounPhraseParseAttr.NO, 0, null);
                    if (npt00 !== null) {
                        name.value = npt00.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false).toLowerCase();
                        t0 = t0.previous.previous;
                    }
                }
            }
        }
        return t0;
    }
    
    static tryAttachCategory(t, cat) {
        cat.value = null;
        if (t === null || t.next === null) 
            return null;
        let tt = null;
        let num = -1;
        if (t instanceof NumberToken) {
            if (t.intValue === null) 
                return null;
            num = t.intValue;
            tt = t;
        }
        else {
            let npt = NumberHelper.tryParseRoman(t);
            if (npt !== null && npt.intValue !== null) {
                num = npt.intValue;
                tt = npt.endToken;
            }
        }
        if ((num < 0) && ((t.isValue("ВЫСШИЙ", null) || t.isValue("ВЫСШ", null) || t.isValue("ВИЩИЙ", null)))) {
            num = 0;
            tt = t;
            if (tt.next !== null && tt.next.isChar('.')) 
                tt = tt.next;
        }
        if (tt === null || tt.next === null || (num < 0)) 
            return null;
        tt = tt.next;
        if (tt.isValue("КАТЕГОРИЯ", null) || tt.isValue("КАТЕГОРІЯ", null) || tt.isValue("КАТ", null)) {
            if (tt.next !== null && tt.next.isChar('.')) 
                tt = tt.next;
            if (num === 0) 
                cat.value = (tt.kit.baseLanguage.isUa ? "вищої категорії" : "высшей категории");
            else 
                cat.value = (tt.kit.baseLanguage.isUa ? (String(num) + " категорії") : (String(num) + " категории"));
            return tt;
        }
        if (tt.isValue("РАЗРЯД", null) || tt.isValue("РОЗРЯД", null)) {
            if (num === 0) 
                cat.value = (tt.kit.baseLanguage.isUa ? "вищого розряду" : "высшего разряда");
            else 
                cat.value = (tt.kit.baseLanguage.isUa ? (String(num) + " розряду") : (String(num) + " разряда"));
            return tt;
        }
        if (tt.isValue("КЛАСС", null) || tt.isValue("КЛАС", null)) {
            if (num === 0) 
                cat.value = (tt.kit.baseLanguage.isUa ? "вищого класу" : "высшего класса");
            else 
                cat.value = (tt.kit.baseLanguage.isUa ? (String(num) + " класу") : (String(num) + " класса"));
            return tt;
        }
        if (tt.isValue("РАНГ", null)) {
            if (num === 0) 
                return null;
            else 
                cat.value = (String(num) + " ранга");
            return tt;
        }
        if (tt.isValue("СОЗЫВ", null) || tt.isValue("СКЛИКАННЯ", null)) {
            if (num === 0) 
                return null;
            else 
                cat.value = (tt.kit.baseLanguage.isUa ? (String(num) + " скликання") : (String(num) + " созыва"));
            return tt;
        }
        return null;
    }
    
    static createAttrGrade(tok) {
        let t1 = PersonAttrToken._findGradeLast(tok.endToken.next, tok.beginToken);
        if (t1 === null) 
            return null;
        let pr = new PersonPropertyReferent();
        let ss = Utils.asString(t1.tag);
        if (ss === null) 
            ss = "наук";
        pr.name = (tok.termin.canonicText.toLowerCase() + " " + ss);
        return PersonAttrToken._new2518(tok.beginToken, t1, PersonAttrTerminType.POSITION, pr, tok.morph, false);
    }
    
    static _findGradeLast(t, t0) {
        let i = 0;
        let te = PersonAttrToken.m_TerminsGrade.tryParse(t, TerminParseAttr.NO);
        if (te !== null) {
            te.endToken.tag = te.termin.canonicText.toLowerCase();
            return te.endToken;
        }
        let tt = t;
        let t1 = null;
        for (; t !== null; t = t.next) {
            if (t.isValue("НАУК", null)) {
                if (tt.next === t && tt.getMorphClassInDictionary().isAdjective) 
                    t.tag = MiscHelper.getTextValue(tt, t, GetTextAttr.NO).toLowerCase();
                t1 = t;
                i++;
                break;
            }
            if (t.isValue("Н", null)) {
                if (t0.lengthChar > 1 || !t0.chars.equals(t.chars)) 
                    return null;
                if ((t.next !== null && t.next.isHiphen && t.next.next !== null) && t.next.next.isValue("К", null)) {
                    t1 = t.next.next;
                    break;
                }
                if (t.next !== null && t.next.isChar('.')) {
                    t1 = t.next;
                    break;
                }
            }
            if (!t.chars.isAllLower && t0.chars.isAllLower) 
                break;
            if ((++i) > 2) 
                break;
            if (t.next !== null && t.next.isChar('.')) 
                t = t.next;
            if (t.next !== null && t.next.isHiphen) 
                t = t.next;
        }
        if (t1 === null || i === 0) 
            return null;
        return t1;
    }
    
    static checkKind(pr) {
        if (pr === null) 
            return PersonPropertyKind.UNDEFINED;
        let n = pr.getStringValue(PersonPropertyReferent.ATTR_NAME);
        if (n === null) 
            return PersonPropertyKind.UNDEFINED;
        n = n.toUpperCase();
        for (const nn of Utils.splitString(n, ' ' + '-', false)) {
            let li = PersonAttrToken.m_Termins.findTerminsByString(nn, MorphLang.RU);
            if (li === null || li.length === 0) 
                li = PersonAttrToken.m_Termins.findTerminsByString(n, MorphLang.UA);
            if (li !== null && li.length > 0) {
                let pat = Utils.as(li[0], PersonAttrTermin);
                if (pat.isBoss) 
                    return PersonPropertyKind.BOSS;
                if (pat.isKin) 
                    return PersonPropertyKind.KIN;
                if (pat.typ === PersonAttrTerminType.KING) {
                    if (n !== "ДОН") 
                        return PersonPropertyKind.KING;
                }
                if (pat.isMilitaryRank) {
                    if (nn === "ВИЦЕ") 
                        continue;
                    if (nn === "КАПИТАН" || nn === "CAPTAIN" || nn === "КАПІТАН") {
                        let _org = Utils.as(pr.getSlotValue(PersonPropertyReferent.ATTR_REF), Referent);
                        if (_org !== null && _org.typeName === "ORGANIZATION") 
                            continue;
                    }
                    return PersonPropertyKind.MILITARYRANK;
                }
                if (pat.isNation) 
                    return PersonPropertyKind.NATIONALITY;
            }
        }
        return PersonPropertyKind.UNDEFINED;
    }
    
    static tryAttachWord(t, ignoreIo = false) {
        let tok = PersonAttrToken.m_Termins.tryParse(t, TerminParseAttr.NO);
        if ((tok !== null && tok.beginToken === tok.endToken && t.lengthChar === 1) && t.isValue("Д", null)) {
            if (BracketHelper.isBracket(t.next, true) && !t.isWhitespaceAfter) 
                return null;
        }
        if (tok !== null && tok.termin.canonicText === "ГРАФ") {
            tok.morph = new MorphCollection(t.morph);
            tok.morph.removeItems(MorphGender.MASCULINE, false);
        }
        if (tok !== null && ignoreIo) {
            let pat = Utils.as(tok.termin, PersonAttrTermin);
            if (pat.typ2 !== PersonAttrTerminType2.UNDEFINED && pat.typ2 !== PersonAttrTerminType2.GRADE) 
                return null;
        }
        return tok;
    }
    
    static tryAttachPositionWord(t) {
        let tok = PersonAttrToken.m_Termins.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        let pat = Utils.as(tok.termin, PersonAttrTermin);
        if (pat === null) 
            return null;
        if (pat.typ !== PersonAttrTerminType.POSITION) 
            return null;
        if (pat.typ2 !== PersonAttrTerminType2.IO2 && pat.typ2 !== PersonAttrTerminType2.UNDEFINED) 
            return null;
        return tok;
    }
    
    static initialize() {
        if (PersonAttrToken.m_Termins !== null) 
            return;
        let t = null;
        PersonAttrToken.m_Termins = new TerminCollection();
        PersonAttrToken.m_Termins.add(PersonAttrTermin._new2519("ТОВАРИЩ", PersonAttrTerminType.PREFIX));
        PersonAttrToken.m_Termins.add(PersonAttrTermin._new2488("ТОВАРИШ", MorphLang.UA, PersonAttrTerminType.PREFIX));
        for (const s of ["ГОСПОДИН", "ГРАЖДАНИН", "УРОЖЕНЕЦ", "ВЫХОДЕЦ ИЗ", "МИСТЕР", "СЭР", "СЕНЬОР", "МОНСЕНЬОР", "СИНЬОР", "МЕСЬЕ", "МСЬЕ", "ДОН", "МАЭСТРО", "МЭТР"]) {
            t = PersonAttrTermin._new2521(s, PersonAttrTerminType.PREFIX, MorphGender.MASCULINE);
            if (s === "ГРАЖДАНИН") {
                t.addAbridge("ГР.");
                t.addAbridge("ГРАЖД.");
                t.addAbridge("ГР-Н");
            }
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ПАН", "ГРОМАДЯНИН", "УРОДЖЕНЕЦЬ", "ВИХОДЕЦЬ З", "МІСТЕР", "СЕР", "СЕНЬЙОР", "МОНСЕНЬЙОР", "МЕСЬЄ", "МЕТР", "МАЕСТРО"]) {
            t = PersonAttrTermin._new2522(s, MorphLang.UA, PersonAttrTerminType.PREFIX, MorphGender.MASCULINE);
            if (s === "ГРОМАДЯНИН") {
                t.addAbridge("ГР.");
                t.addAbridge("ГР-Н");
            }
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ГОСПОЖА", "ПАНИ", "ГРАЖДАНКА", "УРОЖЕНКА", "СЕНЬОРА", "СЕНЬОРИТА", "СИНЬОРА", "СИНЬОРИТА", "МИСС", "МИССИС", "МАДАМ", "МАДЕМУАЗЕЛЬ", "ФРАУ", "ФРОЙЛЯЙН", "ЛЕДИ", "ДОННА"]) {
            t = PersonAttrTermin._new2521(s, PersonAttrTerminType.PREFIX, MorphGender.FEMINIE);
            if (s === "ГРАЖДАНКА") {
                t.addAbridge("ГР.");
                t.addAbridge("ГРАЖД.");
                t.addAbridge("ГР-КА");
            }
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ПАНІ", "ГРОМАДЯНКА", "УРОДЖЕНКА", "СЕНЬЙОРА", "СЕНЬЙОРА", "МІС", "МІСІС", "МАДАМ", "МАДЕМУАЗЕЛЬ", "ФРАУ", "ФРОЙЛЯЙН", "ЛЕДІ"]) {
            t = PersonAttrTermin._new2522(s, MorphLang.UA, PersonAttrTerminType.PREFIX, MorphGender.FEMINIE);
            if (s === "ГРОМАДЯНКА") {
                t.addAbridge("ГР.");
                t.addAbridge("ГР-КА");
            }
            PersonAttrToken.m_Termins.add(t);
        }
        t = PersonAttrTermin._new2522("MISTER", MorphLang.EN, PersonAttrTerminType.PREFIX, MorphGender.MASCULINE);
        t.addAbridge("MR");
        t.addAbridge("MR.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2522("MISSIS", MorphLang.EN, PersonAttrTerminType.PREFIX, MorphGender.FEMINIE);
        t.addAbridge("MRS");
        t.addAbridge("MSR.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2522("MISS", MorphLang.EN, PersonAttrTerminType.PREFIX, MorphGender.FEMINIE);
        t.addAbridge("MS");
        t.addAbridge("MS.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("БЕЗРАБОТНЫЙ", PersonAttrTerminType.POSITION);
        t.addVariant("НЕ РАБОТАЮЩИЙ", false);
        t.addVariant("НЕ РАБОТАЕТ", false);
        t.addVariant("ВРЕМЕННО НЕ РАБОТАЮЩИЙ", false);
        t.addVariant("ВРЕМЕННО НЕ РАБОТАЕТ", false);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("БЕЗРОБІТНИЙ", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addVariant("НЕ ПРАЦЮЮЧИЙ", false);
        t.addVariant("НЕ ПРАЦЮЄ", false);
        t.addVariant("ТИМЧАСОВО НЕ ПРАЦЮЮЧИЙ", false);
        t.addVariant("ТИМЧАСОВО НЕ ПРАЦЮЄ", false);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2530("ЗАМЕСТИТЕЛЬ", "заместитель", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        t.addVariant("ЗАМЕСТИТЕЛЬНИЦА", false);
        t.addAbridge("ЗАМ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2531("ЗАСТУПНИК", MorphLang.UA, "заступник", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        t.addVariant("ЗАСТУПНИЦЯ", false);
        t.addAbridge("ЗАМ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2530("УПОЛНОМОЧЕННЫЙ", "уполномоченный", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2531("УПОВНОВАЖЕНИЙ", MorphLang.UA, "уповноважений", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2530("ЭКС-УПОЛНОМОЧЕННЫЙ", "экс-уполномоченный", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2531("ЕКС-УПОВНОВАЖЕНИЙ", MorphLang.UA, "екс-уповноважений", PersonAttrTerminType2.IO2, PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2536("ИСПОЛНЯЮЩИЙ ОБЯЗАННОСТИ", PersonAttrTerminType2.IO, PersonAttrTerminType.POSITION);
        t.addAbridge("И.О.");
        t.canonicText = (t.acronym = "ИО");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2537("ВИКОНУЮЧИЙ ОБОВЯЗКИ", MorphLang.UA, PersonAttrTerminType2.IO, PersonAttrTerminType.POSITION);
        t.addAbridge("В.О.");
        t.canonicText = (t.acronym = "ВО");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2536("ВРЕМЕННО ИСПОЛНЯЮЩИЙ ОБЯЗАННОСТИ", PersonAttrTerminType2.IO, PersonAttrTerminType.POSITION);
        t.addAbridge("ВР.И.О.");
        t.canonicText = (t.acronym = "ВРИО");
        PersonAttrToken.m_TerminVrio = t;
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("ЗАВЕДУЮЩИЙ", PersonAttrTerminType.POSITION);
        t.addAbridge("ЗАВЕД.");
        t.addAbridge("ЗАВ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("ЗАВІДУВАЧ", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addAbridge("ЗАВІД.");
        t.addAbridge("ЗАВ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("СОТРУДНИК", PersonAttrTerminType.POSITION);
        t.addAbridge("СОТРУДН.");
        t.addAbridge("СОТР.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("СПІВРОБІТНИК", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addAbridge("СПІВРОБ.");
        t.addAbridge("СПІВ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("АКАДЕМИК", PersonAttrTerminType.POSITION);
        t.addAbridge("АКАД.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("АКАДЕМІК", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addAbridge("АКАД.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("ЧЛЕН-КОРРЕСПОНДЕНТ", PersonAttrTerminType.POSITION);
        t.addAbridge("ЧЛ.-КОРР.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("ЧЛЕН-КОРЕСПОНДЕНТ", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addAbridge("ЧЛ.-КОР.");
        t.addAbridge("ЧЛ.-КОРР.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("ДОЦЕНТ", PersonAttrTerminType.POSITION);
        t.addAbridge("ДОЦ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("ПРОФЕССОР", PersonAttrTerminType.POSITION);
        t.addAbridge("ПРОФ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("ПРОФЕСОР", MorphLang.UA, PersonAttrTerminType.POSITION);
        t.addAbridge("ПРОФ.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("PROFESSOR", MorphLang.EN, PersonAttrTerminType.POSITION);
        t.addAbridge("PROF.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2536("КАНДИДАТ", PersonAttrTerminType2.GRADE, PersonAttrTerminType.POSITION);
        t.addAbridge("КАНД.");
        t.addAbridge("КАН.");
        t.addAbridge("К-Т");
        t.addAbridge("К.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2536("ДОКТОР", PersonAttrTerminType2.GRADE, PersonAttrTerminType.POSITION);
        t.addAbridge("ДОКТ.");
        t.addAbridge("ДОК.");
        t.addAbridge("Д-Р");
        t.addAbridge("Д.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("DOCTOR", MorphLang.EN, PersonAttrTerminType.PREFIX);
        t.addAbridge("DR");
        t.addAbridge("DR.");
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2519("ДОКТОРАНТ", PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        t = PersonAttrTermin._new2488("ДОКТОРАНТ", MorphLang.UA, PersonAttrTerminType.POSITION);
        PersonAttrToken.m_Termins.add(t);
        for (const s of ["КФН", "КТН", "КХН"]) {
            t = PersonAttrTermin._new2556(s, "кандидат наук", PersonAttrTerminType.POSITION, PersonAttrTerminType2.ABBR);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ГЛАВНЫЙ", "МЛАДШИЙ", "СТАРШИЙ", "ВЕДУЩИЙ", "НАУЧНЫЙ"]) {
            t = PersonAttrTermin._new2536(s, PersonAttrTerminType2.ADJ, PersonAttrTerminType.POSITION);
            t.addAllAbridges(0, 0, 2);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ГОЛОВНИЙ", "МОЛОДШИЙ", "СТАРШИЙ", "ПРОВІДНИЙ", "НАУКОВИЙ"]) {
            t = PersonAttrTermin._new2558(s, PersonAttrTerminType2.ADJ, PersonAttrTerminType.POSITION, MorphLang.UA);
            t.addAllAbridges(0, 0, 2);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["НЫНЕШНИЙ", "НОВЫЙ", "CURRENT", "NEW"]) {
            t = PersonAttrTermin._new2536(s, PersonAttrTerminType2.IGNOREDADJ, PersonAttrTerminType.POSITION);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["НИНІШНІЙ", "НОВИЙ"]) {
            t = PersonAttrTermin._new2558(s, PersonAttrTerminType2.IGNOREDADJ, PersonAttrTerminType.POSITION, MorphLang.UA);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ТОГДАШНИЙ", "БЫВШИЙ", "ПРЕДЫДУЩИЙ", "FORMER", "PREVIOUS", "THEN"]) {
            t = PersonAttrTermin._new2536(s, PersonAttrTerminType2.IO, PersonAttrTerminType.POSITION);
            PersonAttrToken.m_Termins.add(t);
        }
        for (const s of ["ТОДІШНІЙ", "КОЛИШНІЙ"]) {
            t = PersonAttrTermin._new2558(s, PersonAttrTerminType2.IO, PersonAttrTerminType.POSITION, MorphLang.UA);
            PersonAttrToken.m_Termins.add(t);
        }
        let dat = PullentiNerPersonInternalResourceHelper.getBytes("attr_ru.dat");
        if (dat === null) 
            throw new Error("Not found resource file attr_ru.dat in Person analyzer");
        PersonAttrToken.loadAttrs(PersonAttrToken.m_Termins, dat, MorphLang.RU);
        if ((((dat = PullentiNerPersonInternalResourceHelper.getBytes("attr_en.dat")))) === null) 
            throw new Error("Not found resource file attr_en.dat in Person analyzer");
        PersonAttrToken.loadAttrs(PersonAttrToken.m_Termins, dat, MorphLang.EN);
        PersonAttrToken.loadAttrs(PersonAttrToken.m_Termins, PullentiNerPersonInternalResourceHelper.getBytes("attr_ua.dat"), MorphLang.UA);
        PersonAttrToken.m_TerminsGrade = new TerminCollection();
        let grFull = ["архитектуры", "биологических наук", "ветеринарных наук", "военных наук", "географических наук", "геолого-минералогических наук", "искусствоведения", "исторических наук", "культурологии", "медицинских наук", "педагогических наук", "политических наук", "психологических наук", "сельскохозяйственных наук", "социологических наук", "теологических наук", "технических наук", "фармацевтических наук", "физико-математических наук", "филологических наук", "философских наук", "химических наук", "экономических наук", "юридических наук"];
        let grSh1 = ["архитектуры", "биол. наук", "ветеринар. наук", "воен. наук", "геогр. наук", "геол.-минерал. наук", "искусствоведения", "ист. наук", "культурологии", "мед. наук", "пед. наук", "полит. наук", "психол. наук", "с.-х. наук", "социол. наук", "теол. наук", "техн. наук", "фарм. наук", "физ.-мат. наук", "филол. наук", "филос. наук", "хим. наук", "экон. наук", "юрид. наук"];
        let grSh2 = ["арх.", "б.н.", "вет.н.", "воен.н.", "г.н.", "г.-м.н.", "иск.", "и.н.", "культ.", "м.н.", "пед. н.", "полит. н.", "п. н.", "с.-х. н.", "социол. н.", "теол. н.", "т. н.", "фарм. н.", "ф.-м. н.", "ф. н.", "филос. н.", "х. н.", "э. н.", "ю. н."];
        for (let i = 0; i < grFull.length; i++) {
            t = new PersonAttrTermin(grFull[i].toUpperCase());
            t.addAbridge(grSh1[i].toUpperCase());
            t.addAbridge(grSh2[i].toUpperCase());
            PersonAttrToken.m_TerminsGrade.add(t);
        }
    }
    
    static deflate(zip) {
        let unzip = new MemoryStream(); 
        try {
            let _data = new MemoryStream(zip);
            _data.position = 0;
            MorphDeserializer.deflateGzip(_data, unzip);
            _data.close();
            return unzip.toByteArray();
        }
        finally {
            unzip.close();
        }
    }
    
    static loadAttrs(termins, dat, lang) {
        if (dat === null || dat.length === 0) 
            return;
        let tmp = new MemoryStream(PersonAttrToken.deflate(dat)); 
        try {
            tmp.position = 0;
            let xml = new XmlDocument();
            xml.loadStream(tmp);
            for (const x of xml.document_element.child_nodes) {
                let a = Utils.getXmlAttrByName(x.attributes, "v");
                if (a === null) 
                    continue;
                let val = a.value;
                if (val === null) 
                    continue;
                let attrs = (Utils.getXmlAttrByName(x.attributes, "a") === null ? "" : (Utils.notNull(Utils.getXmlAttrByName(x.attributes, "a").value, "")));
                if (val === "ДЕВОЧКА") {
                }
                let pat = PersonAttrTermin._new2563(val, PersonAttrTerminType.POSITION, lang);
                for (const ch of attrs) {
                    if (ch === 'p') 
                        pat.canHasPersonAfter = 1;
                    else if (ch === 'P') 
                        pat.canHasPersonAfter = 2;
                    else if (ch === 's') 
                        pat.canBeSameSurname = true;
                    else if (ch === 'm') 
                        pat.gender = MorphGender.MASCULINE;
                    else if (ch === 'f') 
                        pat.gender = MorphGender.FEMINIE;
                    else if (ch === 'b') 
                        pat.isBoss = true;
                    else if (ch === 'r') 
                        pat.isMilitaryRank = true;
                    else if (ch === 'n') 
                        pat.isNation = true;
                    else if (ch === 'c') 
                        pat.typ = PersonAttrTerminType.KING;
                    else if (ch === 'q') 
                        pat.typ = PersonAttrTerminType.KING;
                    else if (ch === 'k') 
                        pat.isKin = true;
                    else if (ch === 'a') 
                        pat.typ2 = PersonAttrTerminType2.IO2;
                    else if (ch === '1') 
                        pat.canBeIndependant = true;
                    else if (ch === 'w') 
                        pat.isProfession = true;
                    else if (ch === 'd') 
                        pat.isPost = true;
                    else if (ch === '?') 
                        pat.isDoubt = true;
                }
                if (Utils.getXmlAttrByName(x.attributes, "alt") !== null) {
                    pat.addVariant((val = Utils.getXmlAttrByName(x.attributes, "alt").value), false);
                    if (val.indexOf('.') > 0) 
                        pat.addAbridge(val);
                }
                if (x.child_nodes.length > 0) {
                    for (const xx of x.child_nodes) {
                        if (xx.name === "alt") {
                            pat.addVariant((val = xx.inner_text), false);
                            if (val.indexOf('.') > 0) 
                                pat.addAbridge(val);
                        }
                    }
                }
                termins.add(pat);
            }
        }
        finally {
            tmp.close();
        }
    }
    
    static _new2479(_arg1, _arg2, _arg3) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.morph = _arg3;
        return res;
    }
    
    static _new2480(_arg1, _arg2, _arg3) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2482(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.age = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new2484(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new2486(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2492(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.morph = _arg5;
        res.gender = _arg6;
        return res;
    }
    
    static _new2495(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.morph = _arg3;
        res.higherPropRef = _arg4;
        return res;
    }
    
    static _new2503(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.propRef = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2515(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.propRef = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new2518(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new PersonAttrToken(_arg1, _arg2);
        res.typ = _arg3;
        res.propRef = _arg4;
        res.morph = _arg5;
        res.canBeIndependentProperty = _arg6;
        return res;
    }
    
    static static_constructor() {
        PersonAttrToken.SPEED_REGIME = false;
        PersonAttrToken.m_EmptyAdjs = ["УСПЕШНЫЙ", "ИЗВЕСТНЫЙ", "ЗНАМЕНИТЫЙ", "ИЗВЕСТНЕЙШИЙ", "ПОПУЛЯРНЫЙ", "ГЕНИАЛЬНЫЙ", "ТАЛАНТЛИВЫЙ", "МОЛОДОЙ", "УСПІШНИЙ", "ВІДОМИЙ", "ЗНАМЕНИТИЙ", "ВІДОМИЙ", "ПОПУЛЯРНИЙ", "ГЕНІАЛЬНИЙ", "ТАЛАНОВИТИЙ", "МОЛОДИЙ"];
        PersonAttrToken.m_StdForms = new Hashtable();
        PersonAttrToken.objNameGeo = "GEO";
        PersonAttrToken.objNameAddr = "ADDRESS";
        PersonAttrToken.objNameOrg = "ORGANIZATION";
        PersonAttrToken.objNameTransport = "TRANSPORT";
        PersonAttrToken.objNameDate = "DATE";
        PersonAttrToken.objNameDateRange = "DATERANGE";
        PersonAttrToken.m_Termins = null;
        PersonAttrToken.m_TerminVrio = null;
        PersonAttrToken.m_TerminsGrade = null;
    }
}


PersonAttrToken.static_constructor();

module.exports = PersonAttrToken