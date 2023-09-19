/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const OrganizationReferent = require("./../OrganizationReferent");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const GetTextAttr = require("./../../core/GetTextAttr");
const OrgProfile = require("./../OrgProfile");
const MetaToken = require("./../../MetaToken");
const Referent = require("./../../Referent");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const TextToken = require("./../../TextToken");
const ReferentToken = require("./../../ReferentToken");
const BracketHelper = require("./../../core/BracketHelper");
const NumberToken = require("./../../NumberToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const GeoReferent = require("./../../geo/GeoReferent");
const OrgItemTypeToken = require("./OrgItemTypeToken");

class OrgItemEngItem extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.fullValue = null;
        this.shortValue = null;
    }
    
    get isBank() {
        return this.fullValue === "bank";
    }
    
    static tryAttach(t, canBeCyr = false) {
        if (t === null || !(t instanceof TextToken)) 
            return null;
        let tok = (canBeCyr ? OrgItemEngItem.m_Ontology.tryParse(t, TerminParseAttr.NO) : null);
        if (!t.chars.isLatinLetter && tok === null) {
            if (!t.isAnd || t.next === null) 
                return null;
            if (t.next.isValue("COMPANY", null) || t.next.isValue("CO", null)) {
                let res = new OrgItemEngItem(t, t.next);
                res.fullValue = "company";
                if (res.endToken.next !== null && res.endToken.next.isChar('.')) 
                    res.endToken = res.endToken.next;
                return res;
            }
            return null;
        }
        if (t.chars.isLatinLetter) 
            tok = OrgItemEngItem.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            if (!OrgItemEngItem._checkTok(tok)) 
                return null;
            let res = new OrgItemEngItem(tok.beginToken, tok.endToken);
            res.fullValue = tok.termin.canonicText.toLowerCase();
            res.shortValue = tok.termin.acronym;
            return res;
        }
        return null;
    }
    
    static _checkTok(tok) {
        if (tok.termin.acronym === "SA") {
            let tt0 = tok.beginToken.previous;
            if (tt0 !== null && tt0.isChar('.')) 
                tt0 = tt0.previous;
            if (tt0 instanceof TextToken) {
                if (tt0.term === "U") 
                    return false;
            }
        }
        else if (tok.beginToken.isValue("CO", null) && tok.beginToken === tok.endToken) {
            if (tok.endToken.next !== null && tok.endToken.next.isHiphen) 
                return false;
        }
        if (!tok.isWhitespaceAfter) {
            if (tok.endToken.next instanceof NumberToken) 
                return false;
        }
        return true;
    }
    
    static tryAttachOrg(t, canBeCyr = false) {
        const OrgItemNameToken = require("./OrgItemNameToken");
        if (t === null) 
            return null;
        let br = false;
        if (t.isChar('(') && t.next !== null) {
            t = t.next;
            br = true;
        }
        if (t instanceof NumberToken) {
            if (t.typ === NumberSpellingType.WORDS && t.morph._class.isAdjective && t.chars.isCapitalUpper) {
            }
            else 
                return null;
        }
        else {
            if (t.chars.isAllLower) 
                return null;
            if ((t.lengthChar < 3) && !t.chars.isLetter) 
                return null;
            if (!t.chars.isLatinLetter) {
                if (!canBeCyr || !t.chars.isCyrillicLetter) 
                    return null;
            }
        }
        let t0 = t;
        let t1 = t0;
        let namWo = 0;
        let tok = null;
        let _geo = null;
        let addTyp = null;
        for (; t !== null; t = t.next) {
            if (t !== t0 && t.whitespacesBeforeCount > 1) 
                break;
            if (t.isChar(')')) 
                break;
            if (t.isChar('(') && t.next !== null) {
                if ((t.next.getReferent() instanceof GeoReferent) && t.next.next !== null && t.next.next.isChar(')')) {
                    _geo = Utils.as(t.next.getReferent(), GeoReferent);
                    t = t.next.next;
                    continue;
                }
                let typ = OrgItemTypeToken.tryAttach(t.next, true);
                if ((typ !== null && typ.endToken.next !== null && typ.endToken.next.isChar(')')) && typ.chars.isLatinLetter) {
                    addTyp = typ;
                    t = typ.endToken.next;
                    continue;
                }
                if (((t.next instanceof TextToken) && t.next.next !== null && t.next.next.isChar(')')) && t.next.chars.isCapitalUpper) {
                    t1 = (t = t.next.next);
                    continue;
                }
                break;
            }
            tok = OrgItemEngItem.tryAttach(t, canBeCyr);
            if (tok === null && t.isCharOf(".,") && t.next !== null) {
                tok = OrgItemEngItem.tryAttach(t.next, canBeCyr);
                if (tok === null && t.next.isCharOf(",.")) 
                    tok = OrgItemEngItem.tryAttach(t.next.next, canBeCyr);
            }
            if (tok !== null) {
                if (tok.lengthChar === 1 && t0.chars.isCyrillicLetter) 
                    return null;
                break;
            }
            if (t.isHiphen && !t.isWhitespaceAfter && !t.isWhitespaceBefore) 
                continue;
            if (t.isCharOf("&+") || t.isAnd) 
                continue;
            if (t.isChar('.')) {
                if (t.previous !== null && t.previous.lengthChar === 1) 
                    continue;
                else if (MiscHelper.canBeStartOfSentence(t.next)) 
                    break;
            }
            if (!t.chars.isLatinLetter) {
                if (!canBeCyr || !t.chars.isCyrillicLetter) 
                    break;
            }
            if (t.chars.isAllLower) {
                if (t.morph._class.isPreposition || t.morph._class.isConjunction) 
                    continue;
                if (br) 
                    continue;
                break;
            }
            let mc = t.getMorphClassInDictionary();
            if (mc.isVerb) {
                if (t.next !== null && t.next.morph._class.isPreposition) 
                    break;
            }
            if (t.next !== null && t.next.isValue("OF", null)) 
                break;
            if (t.getReferent() instanceof GeoReferent) 
                _geo = Utils.as(t.getReferent(), GeoReferent);
            else if (t instanceof TextToken) 
                namWo++;
            t1 = t;
        }
        if (tok === null) 
            return null;
        if (t0 === tok.beginToken) {
            let br2 = BracketHelper.tryParse(tok.endToken.next, BracketParseAttr.NO, 100);
            if (br2 !== null) {
                let org1 = new OrganizationReferent();
                if (tok.shortValue !== null) 
                    org1.addTypeStr(tok.shortValue);
                org1.addTypeStr(tok.fullValue);
                let nam1 = MiscHelper.getTextValue(br2.beginToken, br2.endToken, GetTextAttr.NO);
                if (nam1 !== null) {
                    org1.addName(nam1, true, null);
                    return new ReferentToken(org1, t0, br2.endToken);
                }
            }
            return null;
        }
        let _org = new OrganizationReferent();
        let te = tok.endToken;
        if (tok.isBank) 
            t1 = tok.endToken;
        if (tok.fullValue === "company" && (tok.whitespacesAfterCount < 3)) {
            let tok1 = OrgItemEngItem.tryAttach(tok.endToken.next, canBeCyr);
            if (tok1 !== null) {
                t1 = tok.endToken;
                tok = tok1;
                te = tok.endToken;
            }
        }
        if (tok.fullValue === "company") {
            if (namWo === 0) 
                return null;
        }
        let nam = MiscHelper.getTextValue(t0, t1, GetTextAttr.IGNOREARTICLES);
        if (nam === "STOCK" && tok.fullValue === "company") 
            return null;
        let altNam = null;
        if (Utils.isNullOrEmpty(nam)) 
            return null;
        if (nam.indexOf('(') > 0) {
            let i1 = nam.indexOf('(');
            let i2 = nam.indexOf(')');
            if (i1 < i2) {
                altNam = nam;
                let tai = null;
                if ((i2 + 1) < nam.length) 
                    tai = nam.substring(i2).trim();
                nam = nam.substring(0, 0 + i1).trim();
                if (tai !== null) 
                    nam = (nam + " " + tai);
            }
        }
        if (tok.isBank) {
            _org.addTypeStr((tok.kit.baseLanguage.isEn ? "bank" : "банк"));
            _org.addProfile(OrgProfile.FINANCE);
            if ((t1.next !== null && t1.next.isValue("OF", null) && t1.next.next !== null) && t1.next.next.chars.isLatinLetter) {
                let nam0 = OrgItemNameToken.tryAttach(t1.next, null, false, false);
                if (nam0 !== null) 
                    te = nam0.endToken;
                else 
                    te = t1.next.next;
                nam = MiscHelper.getTextValue(t0, te, GetTextAttr.NO);
                if (te.getReferent() instanceof GeoReferent) 
                    _org.addGeoObject(Utils.as(te.getReferent(), GeoReferent));
            }
            else if (t0 === t1) 
                return null;
        }
        else {
            if (tok.shortValue !== null) 
                _org.addTypeStr(tok.shortValue);
            _org.addTypeStr(tok.fullValue);
        }
        if (Utils.isNullOrEmpty(nam)) 
            return null;
        _org.addName(nam, true, null);
        if (altNam !== null) 
            _org.addName(altNam, true, null);
        let res = new ReferentToken(_org, t0, te);
        t = te;
        while (t.next !== null) {
            if (t.next.isCharOf(",.")) 
                t = t.next;
            else 
                break;
        }
        if (t.whitespacesAfterCount < 2) {
            tok = OrgItemEngItem.tryAttach(t.next, canBeCyr);
            if (tok !== null) {
                if (tok.shortValue !== null) 
                    _org.addTypeStr(tok.shortValue);
                _org.addTypeStr(tok.fullValue);
                res.endToken = tok.endToken;
            }
        }
        if (_geo !== null) 
            _org.addGeoObject(_geo);
        if (addTyp !== null) 
            _org.addType(addTyp, false);
        if (!br) 
            return res;
        t = res.endToken;
        if (t.next === null) {
        }
        else if (t.next.isChar(')')) 
            res.endToken = t.next;
        else 
            return null;
        return res;
    }
    
    static initialize() {
        if (OrgItemEngItem.m_Ontology !== null) 
            return;
        OrgItemEngItem.m_Ontology = new TerminCollection();
        let t = null;
        t = new Termin("BANK");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Public Limited Company".toUpperCase(), "PLC");
        t.addAbridge("P.L.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Limited Liability Company".toUpperCase(), "LLC");
        t.addAbridge("L.L.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Limited Liability Partnership".toUpperCase(), "LLP");
        t.addAbridge("L.L.P.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Limited Liability Limited Partnership".toUpperCase(), "LLLP");
        t.addAbridge("L.L.L.P.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Limited Duration Company".toUpperCase(), "LDC");
        t.addAbridge("L.D.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("International Business Company".toUpperCase(), "IBC");
        t.addAbridge("I.B.S.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Joint stock company".toUpperCase(), "JSC");
        t.addAbridge("J.S.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Open Joint stock company".toUpperCase(), "OJSC");
        t.addAbridge("O.J.S.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Sosiedad Anonima".toUpperCase(), "SA");
        t.addVariant("Sociedad Anonima".toUpperCase(), false);
        t.addAbridge("S.A.");
        t.addVariant("SPA", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Société en commandite".toUpperCase(), "SC");
        t.addAbridge("S.C.");
        t.addVariant("SCS", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Societas Europaea".toUpperCase(), "SE");
        t.addAbridge("S.E.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Società in accomandita".toUpperCase(), "SAS");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Société en commandite par actions".toUpperCase(), "SCA");
        t.addAbridge("S.C.A.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Société en nom collectif".toUpperCase(), "SNC");
        t.addVariant("Società in nome collettivo".toUpperCase(), false);
        t.addAbridge("S.N.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("General Partnership".toUpperCase(), "GP");
        t.addVariant("General Partners", false);
        t.addAbridge("G.P.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Limited Partnership".toUpperCase(), "LP");
        t.addAbridge("L.P.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Kommanditaktiengesellschaft".toUpperCase(), "KGAA");
        t.addVariant("KOMMAG", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Societe a Responsidilite Limitee".toUpperCase(), "SRL");
        t.addAbridge("S.A.R.L.");
        t.addAbridge("S.R.L.");
        t.addVariant("SARL", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Società a garanzia limitata".toUpperCase(), "SAGL");
        t.addAbridge("S.A.G.L.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Società limitata".toUpperCase(), "SL");
        t.addAbridge("S.L.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Vennootschap Met Beperkte Aansparkelij kheid".toUpperCase(), "BV");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Vennootschap Met Beperkte Aansparkelij".toUpperCase(), "AVV");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Naamlose Vennootschap".toUpperCase(), "NV");
        t.addAbridge("N.V.");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Gesellschaft mit beschrakter Haftung".toUpperCase(), "GMBH");
        t.addVariant("ГМБХ", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Aktiengesellschaft".toUpperCase(), "AG");
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("International Company".toUpperCase(), "IC");
        t.addAbridge("I.C.");
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("And Company".toUpperCase());
        t.addVariant("& Company", false);
        t.addVariant("& Co", false);
        t.addVariant("& Company", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Kollektivgesellschaft".toUpperCase(), "KG");
        t.addAbridge("K.G.");
        t.addVariant("OHG", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = Termin._new1262("Kommanditgesellschaft".toUpperCase(), "KG");
        t.addVariant("KOMMG", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("LIMITED");
        t.addAbridge("LTD");
        t.addVariant("LTD", false);
        t.addVariant("ЛИМИТЕД", false);
        t.addVariant("ЛТД", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("PRIVATE LIMITED");
        t.addVariant("PTE LTD", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("INCORPORATED");
        t.addAbridge("INC");
        t.addVariant("INC", false);
        t.addVariant("ИНКОРПОРЕЙТЕД", false);
        t.addVariant("ИНК", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("CORPORATION");
        t.addVariant("CO", false);
        t.addVariant("СО", false);
        t.addVariant("КОРПОРЕЙШН", false);
        t.addVariant("КОРПОРЕЙШЕН", false);
        OrgItemEngItem.m_Ontology.add(t);
        t = new Termin("COMPANY");
        OrgItemEngItem.m_Ontology.add(t);
    }
    
    static static_constructor() {
        OrgItemEngItem.m_Ontology = null;
    }
}


OrgItemEngItem.static_constructor();

module.exports = OrgItemEngItem