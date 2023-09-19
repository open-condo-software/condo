/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const OrgProfile = require("./OrgProfile");
const MorphLang = require("./../../morph/MorphLang");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const LanguageHelper = require("./../../morph/LanguageHelper");
const StreetReferent = require("./../address/StreetReferent");
const ReferentToken = require("./../ReferentToken");
const AddressReferent = require("./../address/AddressReferent");
const TerminParseAttr = require("./../core/TerminParseAttr");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaOrganization = require("./internal/MetaOrganization");
const OrganizationKind = require("./OrganizationKind");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const IntOntologyItem = require("./../core/IntOntologyItem");
const BracketHelper = require("./../core/BracketHelper");
const Termin = require("./../core/Termin");
const Referent = require("./../Referent");
const MiscHelper = require("./../core/MiscHelper");
const GeoReferent = require("./../geo/GeoReferent");

/**
 * Сущность - организация
 * 
 */
class OrganizationReferent extends Referent {
    
    constructor() {
        super(OrganizationReferent.OBJ_TYPENAME);
        this.m_NumberCalc = false;
        this.m_Number = null;
        this.m_Parent = null;
        this.m_ParentCalc = false;
        this.m_NameSingleNormalReal = null;
        this.m_NameVars = null;
        this.m_NameHashs = null;
        this.m_Level = 0;
        this.m_TempParentOrg = null;
        this.isFromGlobalOntos = false;
        this.extOntologyAttached = false;
        this.m_Kind = OrganizationKind.UNDEFINED;
        this.m_KindCalc = false;
        this.instanceOf = MetaOrganization.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        let res = new StringBuilder();
        let isDep = this.kind === OrganizationKind.DEPARTMENT;
        let name = null;
        let altname = null;
        let namesCount = 0;
        let len = 0;
        let noType = false;
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_NAME) {
                let n = s.value.toString();
                namesCount++;
                len += n.length;
            }
        }
        if (namesCount > 0) {
            len = Utils.intDiv(len, namesCount);
            if (len > 10) 
                len -= ((Utils.intDiv(len, 7)));
            let cou = 0;
            let altcou = 0;
            for (const s of this.slots) {
                if (s.typeName === OrganizationReferent.ATTR_NAME) {
                    let n = s.value.toString();
                    if (n.length >= len) {
                        if (s.count > cou) {
                            name = n;
                            cou = s.count;
                        }
                        else if (s.count === cou) {
                            if (name === null) 
                                name = n;
                            else if (name.length < n.length) 
                                name = n;
                        }
                    }
                    else if (s.count > altcou) {
                        altname = n;
                        altcou = s.count;
                    }
                    else if (s.count === altcou) {
                        if (altname === null) 
                            altname = n;
                        else if (altname.length > n.length) 
                            altname = n;
                    }
                }
            }
        }
        if (name !== null) {
            if (altname !== null) {
                if (Utils.replaceString(name, " ", "").includes(altname)) 
                    altname = null;
            }
            if (altname !== null && ((altname.length > 30 || altname.length > (Utils.intDiv(name.length, 2))))) 
                altname = null;
            if (altname === null) {
                for (const s of this.slots) {
                    if (s.typeName === OrganizationReferent.ATTR_NAME) {
                        if (MiscHelper.canBeEqualCyrAndLatSS(name, String(s.value))) {
                            altname = String(s.value);
                            break;
                        }
                    }
                }
            }
        }
        else {
            for (const s of this.slots) {
                if (s.typeName === OrganizationReferent.ATTR_TYPE) {
                    let nam = Utils.asString(s.value);
                    if (OrgItemTypeToken._getKind(nam, null, this) === OrganizationKind.UNDEFINED) 
                        continue;
                    if (name === null || nam.length > name.length) 
                        name = nam;
                    noType = true;
                }
            }
            if (name === null) {
                for (const s of this.slots) {
                    if (s.typeName === OrganizationReferent.ATTR_TYPE) {
                        let nam = Utils.asString(s.value);
                        if (name === null || nam.length > name.length) 
                            name = nam;
                        noType = true;
                    }
                }
            }
        }
        let outOwnInName = false;
        if (name !== null) {
            res.append(MiscHelper.convertFirstCharUpperAndOtherLower(name));
            if (((!isDep && namesCount === 0 && this.higher !== null) && this.higher.higher === null && this.number === null) && this.eponyms.length === 0) 
                outOwnInName = true;
        }
        if (this.number !== null) {
            if (OrganizationReferent.SHOW_NUMBER_ON_FIRST_POSITION) 
                res.insert(0, (this.number + " "));
            else 
                res.append(" №").append(this.number);
        }
        let fams = null;
        for (const r of this.slots) {
            if (r.typeName === OrganizationReferent.ATTR_EPONYM && r.value !== null) {
                if (fams === null) 
                    fams = new Array();
                fams.push(r.value.toString());
            }
        }
        if (fams !== null) {
            fams.sort();
            res.append(" имени ");
            for (let i = 0; i < fams.length; i++) {
                if (i > 0 && ((i + 1) < fams.length)) 
                    res.append(", ");
                else if (i > 0) 
                    res.append(" и ");
                res.append(fams[i]);
            }
        }
        if (altname !== null && !isDep) 
            res.append(" (").append(MiscHelper.convertFirstCharUpperAndOtherLower(altname)).append(")");
        if (!shortVariant && this.owner !== null) 
            res.append("; ").append(this.owner.toStringEx(true, lang, lev + 1));
        if (!shortVariant) {
            if (!noType && !isDep) {
                let typ = null;
                for (const t of this.types) {
                    if (OrgItemTypeToken._getKind(t, null, this) === OrganizationKind.UNDEFINED) 
                        continue;
                    if (typ === null || typ.length > t.length) 
                        typ = t;
                }
                if (typ === null) {
                    for (const t of this.types) {
                        if (typ === null || typ.length > t.length) 
                            typ = t;
                    }
                }
                if (name !== null && !Utils.isNullOrEmpty(typ) && !Utils.isUpperCase(typ[0])) {
                    if (name.toUpperCase().includes(typ.toUpperCase())) 
                        typ = null;
                }
                if (typ !== null) 
                    res.append(", ").append(typ);
            }
            for (const ss of this.slots) {
                if (ss.typeName === OrganizationReferent.ATTR_GEO && ss.value !== null) 
                    res.append(", ").append(ss.value.toString());
            }
        }
        if (!shortVariant) {
            if (isDep || outOwnInName) {
                for (const ss of this.slots) {
                    if (ss.typeName === OrganizationReferent.ATTR_HIGHER && (ss.value instanceof Referent) && (lev < 20)) {
                        let hi = Utils.as(ss.value, OrganizationReferent);
                        if (hi !== null) {
                            let tmp = new Array();
                            tmp.push(this);
                            for (; hi !== null; hi = hi.higher) {
                                if (tmp.includes(hi)) 
                                    break;
                                else 
                                    tmp.push(hi);
                            }
                            if (hi !== null) 
                                continue;
                        }
                        res.append(';');
                        res.append(" ").append(ss.value.toStringEx(shortVariant, lang, lev + 1));
                        break;
                    }
                }
            }
        }
        if (res.length === 0) {
            if (this.iNN !== null) 
                res.append("ИНН: ").append(this.iNN);
            if (this.oGRN !== null) 
                res.append(" ОГРН: ").append(this.iNN);
        }
        return res.toString();
    }
    
    toSortString() {
        return (String(this.kind) + " " + this.toStringEx(true, MorphLang.UNKNOWN, 0));
    }
    
    getCompareStrings() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_NAME || s.typeName === OrganizationReferent.ATTR_EPONYM) {
                let str = s.value.toString();
                if (!res.includes(str)) 
                    res.push(str);
                if (str.indexOf(' ') > 0 || str.indexOf('-') > 0) {
                    str = Utils.replaceString(Utils.replaceString(str, " ", ""), "-", "");
                    if (!res.includes(str)) 
                        res.push(str);
                }
            }
            else if (s.typeName === OrganizationReferent.ATTR_NUMBER) 
                res.push((String(this.kind) + " " + s.value.toString()));
        }
        if (res.length === 0) {
            for (const s of this.slots) {
                if (s.typeName === OrganizationReferent.ATTR_TYPE) {
                    let t = s.value.toString();
                    if (!res.includes(t)) 
                        res.push(t);
                }
            }
        }
        if (this.iNN !== null) 
            res.push("ИНН:" + this.iNN);
        if (this.oGRN !== null) 
            res.push("ОГРН:" + this.oGRN);
        if (res.length > 0) 
            return res;
        else 
            return super.getCompareStrings();
    }
    
    checkCorrection() {
        if (this.slots.length < 1) 
            return false;
        let s = this.toStringEx(true, MorphLang.UNKNOWN, 0).toLowerCase();
        if (s.includes("прокуратура") || s.includes("штаб") || s.includes("кабинет")) 
            return true;
        if (this.slots.length === 1) {
            if (this.slots[0].typeName !== OrganizationReferent.ATTR_NAME) {
                if (this.kind === OrganizationKind.GOVENMENT || this.kind === OrganizationKind.JUSTICE) 
                    return true;
                return false;
            }
        }
        if (this.findSlot(OrganizationReferent.ATTR_TYPE, null, true) === null && this.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null) 
            return false;
        if (s === "государственная гражданская служба" || s === "здравоохранения") 
            return false;
        if (this.types.includes("колония")) {
            if (this.number === null) 
                return false;
        }
        if (s.includes("конгресс")) {
            if (this.findSlot(OrganizationReferent.ATTR_GEO, null, true) === null) 
                return false;
        }
        let nams = this.names;
        if (nams.length === 1 && nams[0].length === 1 && (this.types.length < 3)) 
            return false;
        if (nams.includes("ВА")) {
            if (this.kind === OrganizationKind.BANK) 
                return false;
        }
        return true;
    }
    
    get iNN() {
        return this._getMiscValue("ИНН");
    }
    set iNN(value) {
        if (value !== null) 
            this.addSlot(OrganizationReferent.ATTR_MISC, "ИНН:" + value, false, 0);
        return value;
    }
    
    get oGRN() {
        return this._getMiscValue("ОГРН");
    }
    set oGRN(value) {
        if (value !== null) 
            this.addSlot(OrganizationReferent.ATTR_MISC, "ОГРН:" + value, false, 0);
        return value;
    }
    
    _getMiscValue(pref) {
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_MISC) {
                if (s.value instanceof Referent) {
                    let r = Utils.as(s.value, Referent);
                    if (r.typeName === "URI") {
                        let val = r.getStringValue("SCHEME");
                        if (val === pref) 
                            return r.getStringValue("VALUE");
                    }
                }
                else if ((typeof s.value === 'string' || s.value instanceof String)) {
                    let str = Utils.asString(s.value);
                    if (str.startsWith(pref) && str.length > (pref.length + 1)) 
                        return str.substring(pref.length + 1);
                }
            }
        }
        return null;
    }
    
    get names() {
        let res = null;
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_NAME) {
                if (res === null) 
                    res = new Array();
                res.push(s.value.toString());
            }
        }
        return (res != null ? res : OrganizationReferent.m_EmptyNames);
    }
    
    correctName(name, num) {
        num.value = 0;
        if (name === null || (name.length < 1)) 
            return null;
        if (Utils.isDigit(name[0]) && name.indexOf(' ') > 0) {
            let i = 0;
            let wrapi2470 = new RefOutArgWrapper();
            let inoutres2471 = Utils.tryParseInt(name.substring(0, 0 + name.indexOf(' ')), wrapi2470);
            i = wrapi2470.value;
            if (inoutres2471) {
                if (i > 1) {
                    num.value = i;
                    name = name.substring(name.indexOf(' ')).trim();
                }
            }
        }
        else if (Utils.isDigit(name[name.length - 1])) {
            let i = 0;
            for (i = name.length - 1; i >= 0; i--) {
                if (!Utils.isDigit(name[i])) 
                    break;
            }
            if (i >= 0 && name[i] === '.') {
            }
            else {
                let inoutres2472 = Utils.tryParseInt(name.substring(i + 1), num);
                if (i > 0 && inoutres2472 && num.value > 0) {
                    if (i < 1) 
                        return null;
                    name = name.substring(0, 0 + i).trim();
                    if (name.length > 0 && name[name.length - 1] === '-') 
                        name = name.substring(0, 0 + name.length - 1).trim();
                }
            }
        }
        return this.correctName0(name);
    }
    
    correctName0(name) {
        name = name.toUpperCase();
        if (name.length > 2 && !Utils.isLetterOrDigit(name[name.length - 1]) && Utils.isWhitespace(name[name.length - 2])) 
            name = name.substring(0, 0 + name.length - 2) + name.substring(name.length - 1);
        if (name.includes(" НА СТ.")) 
            name = Utils.replaceString(name, " НА СТ.", " НА СТАНЦИИ");
        return this.correctType(name);
    }
    
    correctType(name) {
        if (name === null) 
            return null;
        if (name.endsWith(" полок")) 
            name = name.substring(0, 0 + name.length - 5) + "полк";
        else if (name === "полок") 
            name = "полк";
        let tmp = new StringBuilder();
        let notEmpty = false;
        for (let i = 0; i < name.length; i++) {
            let ch = name[i];
            if (Utils.isLetterOrDigit(ch)) 
                notEmpty = true;
            else if (ch !== '&' && ch !== ',' && ch !== '.') 
                ch = ' ';
            if (Utils.isWhitespace(ch)) {
                if (tmp.length === 0) 
                    continue;
                if (tmp.charAt(tmp.length - 1) !== ' ' && tmp.charAt(tmp.length - 1) !== '.') 
                    tmp.append(' ');
                continue;
            }
            let isSpBefore = tmp.length === 0 || tmp.charAt(tmp.length - 1) === ' ';
            if (ch === '&' && !isSpBefore) 
                tmp.append(' ');
            if (((ch === ',' || ch === '.')) && isSpBefore && tmp.length > 0) 
                tmp.length = tmp.length - 1;
            tmp.append(ch);
        }
        if (!notEmpty) 
            return null;
        while (tmp.length > 0) {
            let ch = tmp.charAt(tmp.length - 1);
            if ((ch === ' ' || ch === ',' || ch === '.') || Utils.isWhitespace(ch)) 
                tmp.length = tmp.length - 1;
            else 
                break;
        }
        return tmp.toString();
    }
    
    addName(name, removeLongGovNames = true, t = null) {
        let num = 0;
        let wrapnum2473 = new RefOutArgWrapper();
        let s = this.correctName(name, wrapnum2473);
        num = wrapnum2473.value;
        if (s === null) {
            if (num > 0 && this.number === null) 
                this.number = num.toString();
            return;
        }
        if (s === "УПРАВЛЕНИЕ") {
        }
        let i = s.indexOf(' ');
        if (i === 2 && s[1] === 'К' && ((i + 3) < s.length)) {
            this.addSlot(OrganizationReferent.ATTR_TYPE, s.substring(0, 0 + 2), false, 0);
            s = s.substring(3).trim();
        }
        if (this.kind === OrganizationKind.BANK || s.includes("БАНК")) {
            if (s.startsWith("КБ ")) {
                this.addTypeStr("коммерческий банк");
                s = s.substring(3);
            }
            else if (s.startsWith("АКБ ")) {
                this.addTypeStr("акционерный коммерческий банк");
                s = s.substring(3);
            }
        }
        if (num > 0) {
            if (s.length > 10) 
                this.number = num.toString();
            else 
                s = (s + num);
        }
        let cou = 1;
        if (t !== null && !t.chars.isLetter && BracketHelper.isBracket(t, false)) 
            t = t.next;
        if (((t instanceof TextToken) && (s.indexOf(' ') < 0) && s.length > 3) && s === t.term) {
            try {
                let mt = MorphologyService.process(s, t.morph.language, null);
                if (mt !== null && mt.length === 1) {
                    let sNorm = mt[0].getLemma();
                    if (sNorm === s) {
                        if (this.m_NameSingleNormalReal === null) {
                            this.m_NameSingleNormalReal = s;
                            for (let ii = this.slots.length - 1; ii >= 0; ii--) {
                                if (this.slots[ii].typeName === OrganizationReferent.ATTR_NAME && (Utils.asString(this.slots[ii].value)) !== s) {
                                    mt = MorphologyService.process(Utils.asString(this.slots[ii].value), t.morph.language, null);
                                    if (mt !== null && mt.length === 1) {
                                        if (mt[0].getLemma() === this.m_NameSingleNormalReal) {
                                            cou += this.slots[ii].count;
                                            this.slots.splice(ii, 1);
                                            this.m_NameVars = null;
                                            this.m_NameHashs = null;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if (sNorm === this.m_NameSingleNormalReal && sNorm !== null) 
                        s = sNorm;
                }
            } catch (ex) {
            }
        }
        for (const a of this.slots) {
            if (a.typeName === OrganizationReferent.ATTR_NAME) {
                let n = a.value.toString();
                if (s === n) {
                    a.count = a.count + cou;
                    return;
                }
            }
            else if (a.typeName === OrganizationReferent.ATTR_TYPE) {
                let n = a.value.toString();
                if (Utils.compareStrings(s, n, true) === 0) 
                    return;
                if (s.startsWith(n + " ")) 
                    s = s.substring(n.length + 1);
            }
        }
        this.addSlot(OrganizationReferent.ATTR_NAME, s, false, 1);
        if (LanguageHelper.endsWith(s, " ПО")) {
            s = s.substring(0, 0 + s.length - 2) + "ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ";
            this.addSlot(OrganizationReferent.ATTR_NAME, s, false, 0);
        }
        this.correctData(removeLongGovNames);
    }
    
    addNameStr(name, typ, cou = 1) {
        if (typ !== null && typ.altTyp !== null && !typ.isNotTyp) 
            this.addTypeStr(typ.altTyp);
        if (name === null) {
            if (typ.isNotTyp) 
                return;
            if (typ.name !== null && Utils.compareStrings(typ.name, typ.typ, true) !== 0 && ((typ.name.length > typ.typ.length || this.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null))) {
                let num = 0;
                let wrapnum2474 = new RefOutArgWrapper();
                let s = this.correctName(typ.name, wrapnum2474);
                num = wrapnum2474.value;
                this.addSlot(OrganizationReferent.ATTR_NAME, s, false, cou);
                if (num > 0 && typ.isDep && this.number === null) 
                    this.number = num.toString();
            }
            else if (typ.altTyp !== null) 
                this.addSlot(OrganizationReferent.ATTR_NAME, this.correctName0(typ.altTyp), false, cou);
        }
        else {
            let s = this.correctName0(name);
            if (typ === null || typ.isNotTyp) 
                this.addSlot(OrganizationReferent.ATTR_NAME, s, false, cou);
            else {
                this.addSlot(OrganizationReferent.ATTR_NAME, (typ.typ.toUpperCase() + " " + s), false, cou);
                if (typ.name !== null) {
                    let num = 0;
                    let wrapnum2475 = new RefOutArgWrapper();
                    let ss = this.correctName(typ.name, wrapnum2475);
                    num = wrapnum2475.value;
                    if (ss !== null) {
                        this.addTypeStr(ss);
                        this.addSlot(OrganizationReferent.ATTR_NAME, (ss + " " + s), false, cou);
                        if (num > 0 && typ.isDep && this.number === null) 
                            this.number = num.toString();
                    }
                }
            }
            if (LanguageHelper.endsWithEx(name, " ОБЛАСТИ", " РАЙОНА", " КРАЯ", " РЕСПУБЛИКИ")) {
                let ii = name.lastIndexOf(' ');
                this.addNameStr(name.substring(0, 0 + ii), typ, cou);
            }
        }
        this.correctData(true);
    }
    
    get profiles() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_PROFILE) {
                try {
                    let str = Utils.asString(s.value);
                    if (str === "Politics") 
                        str = "Policy";
                    else if (str === "PartOf") 
                        str = "Unit";
                    let v = OrgProfile.of(str);
                    res.push(v);
                } catch (ex2476) {
                }
            }
        }
        return res;
    }
    
    addProfile(prof) {
        if (prof !== OrgProfile.UNDEFINED) 
            this.addSlot(OrganizationReferent.ATTR_PROFILE, prof.toString(), false, 0);
    }
    
    containsProfile(prof) {
        return this.findSlot(OrganizationReferent.ATTR_PROFILE, prof.toString(), true) !== null;
    }
    
    get types() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_TYPE) 
                res.push(s.value.toString());
        }
        return res;
    }
    
    _typesContains(substr) {
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_TYPE) {
                let val = Utils.asString(s.value);
                if (val !== null && val.includes(substr)) 
                    return true;
            }
        }
        return false;
    }
    
    addType(typ, finalAdd = false) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (typ === null) 
            return;
        for (const p of typ.profiles) {
            this.addProfile(p);
        }
        if (typ.isNotTyp) 
            return;
        for (let tt = typ.beginToken; tt !== null && tt.endChar <= typ.endChar; tt = tt.next) {
            let tok = OrgItemTypeToken.m_Markers.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) 
                this.addSlot(OrganizationReferent.ATTR_MARKER, tok.termin.canonicText, false, 0);
        }
        if (typ.typ === "следственный комитет") {
            this.addTypeStr("комитет");
            this.addName(typ.typ, true, null);
        }
        else {
            this.addTypeStr(typ.typ);
            if (typ.number !== null) 
                this.number = typ.number;
            if (typ.typ === "АКБ") 
                this.addTypeStr("банк");
            if (typ.name !== null && typ.name !== "ПОЛОК") {
                if (typ.nameIsName || typ.typ === "суд") 
                    this.addName(typ.name, true, null);
                else if (typ.typ === "министерство" && Utils.startsWithString(typ.name, typ.typ + " ", true)) 
                    this.addName(typ.name, true, null);
                else if (typ.typ.endsWith("электростанция") && Utils.endsWithString(typ.name, " " + typ.typ, true)) 
                    this.addName(typ.name, true, null);
                else if (this.findSlot(OrganizationReferent.ATTR_NAME, null, true) !== null && this.findSlot(OrganizationReferent.ATTR_NAME, typ.name, true) === null) 
                    this.addTypeStr(typ.name.toLowerCase());
                else if (finalAdd) {
                    let ss = typ.name.toLowerCase();
                    if (LanguageHelper.isLatin(ss) && ss.endsWith(" " + typ.typ)) {
                        if (typ.root !== null && ((typ.root.canHasLatinName || typ.root.canHasSingleName)) && !typ.root.mustBePartofName) {
                            let sl = this.findSlot(OrganizationReferent.ATTR_NAME, typ.name, true);
                            if (sl !== null) 
                                Utils.removeItem(this.slots, sl);
                            this.addName(ss.substring(0, 0 + ss.length - typ.typ.length - 1).toUpperCase(), true, null);
                            this.addName(ss.toUpperCase(), true, null);
                            ss = null;
                        }
                    }
                    if (ss !== null) 
                        this.addTypeStr(ss);
                }
                if (typ.altName !== null) 
                    this.addName(typ.altName, true, null);
            }
        }
        if (typ.altTyp !== null) 
            this.addTypeStr(typ.altTyp);
        if (typ.number !== null) 
            this.number = typ.number;
        if (typ.root !== null) {
            if (typ.root.acronym !== null) {
                if (this.findSlot(OrganizationReferent.ATTR_TYPE, typ.root.acronym, true) === null) 
                    this.addSlot(OrganizationReferent.ATTR_TYPE, typ.root.acronym, false, 0);
            }
            if (typ.root.canonicText !== null && typ.root.canonicText !== "СБЕРЕГАТЕЛЬНЫЙ БАНК" && typ.root.canonicText !== typ.root.acronym) 
                this.addTypeStr(typ.root.canonicText.toLowerCase());
        }
        if (typ.geo !== null) {
            if ((typ.geo.referent instanceof GeoReferent) && typ.geo.referent.isRegion && this.kind === OrganizationKind.STUDY) {
            }
            else 
                this.addGeoObject(typ.geo);
        }
        if (typ.geo2 !== null) 
            this.addGeoObject(typ.geo2);
        if (finalAdd) {
            if (this.kind === OrganizationKind.BANK) 
                this.addSlot(OrganizationReferent.ATTR_TYPE, "банк", false, 0);
        }
    }
    
    addTypeStr(typ) {
        if (typ === null) 
            return;
        typ = this.correctType(typ);
        if (typ === null) 
            return;
        let ok = true;
        for (const n of this.names) {
            if (Utils.startsWithString(n, typ, true)) {
                ok = false;
                break;
            }
        }
        if (!ok) 
            return;
        this.addSlot(OrganizationReferent.ATTR_TYPE, typ, false, 0);
        this.correctData(true);
    }
    
    getSortedTypes(forOntos) {
        let res = Array.from(this.types);
        res.sort();
        for (let i = 0; i < res.length; i++) {
            if (Utils.isLowerCase(res[i][0])) {
                let into = false;
                for (const r of res) {
                    if (r !== res[i] && r.includes(res[i])) {
                        into = true;
                        break;
                    }
                }
                if (!into && !forOntos) {
                    let v = res[i].toUpperCase();
                    for (const n of this.names) {
                        if (n.includes(v)) {
                            into = true;
                            break;
                        }
                    }
                }
                if (into) {
                    res.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        return res;
    }
    
    get number() {
        if (!this.m_NumberCalc) {
            this.m_Number = this.getStringValue(OrganizationReferent.ATTR_NUMBER);
            this.m_NumberCalc = true;
        }
        return this.m_Number;
    }
    set number(value) {
        this.addSlot(OrganizationReferent.ATTR_NUMBER, value, true, 0);
        return value;
    }
    
    get owner() {
        return Utils.as(this.getSlotValue(OrganizationReferent.ATTR_OWNER), Referent);
    }
    set owner(value) {
        this.addSlot(OrganizationReferent.ATTR_OWNER, Utils.as(value, Referent), true, 0);
        return value;
    }
    
    get higher() {
        if (this.m_ParentCalc) 
            return this.m_Parent;
        this.m_ParentCalc = true;
        this.m_Parent = Utils.as(this.getSlotValue(OrganizationReferent.ATTR_HIGHER), OrganizationReferent);
        if (this.m_Parent === this || this.m_Parent === null) 
            return this.m_Parent = null;
        let sl = this.m_Parent.findSlot(OrganizationReferent.ATTR_HIGHER, null, true);
        if (sl === null) 
            return this.m_Parent;
        let li = new Array();
        li.push(this);
        li.push(this.m_Parent);
        for (let oo = Utils.as(sl.value, OrganizationReferent); oo !== null; oo = Utils.as(oo.getSlotValue(OrganizationReferent.ATTR_HIGHER), OrganizationReferent)) {
            if (li.includes(oo)) 
                return this.m_Parent = null;
            li.push(oo);
        }
        return this.m_Parent;
    }
    set higher(value) {
        if (value !== null) {
            let d = value;
            let li = new Array();
            for (; d !== null; d = d.higher) {
                if (d === this) 
                    return value;
                else if (d.toString() === this.toString()) 
                    return value;
                if (li.includes(d)) 
                    return value;
                li.push(d);
            }
        }
        this.addSlot(OrganizationReferent.ATTR_HIGHER, null, true, 0);
        if (value !== null) 
            this.addSlot(OrganizationReferent.ATTR_HIGHER, value, true, 0);
        this.m_ParentCalc = false;
        return value;
    }
    
    get parentReferent() {
        let hi = this.higher;
        if (hi !== null) 
            return hi;
        return this.owner;
    }
    
    get eponyms() {
        let res = null;
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_EPONYM) {
                if (res === null) 
                    res = new Array();
                res.push(s.value.toString());
            }
        }
        return (res != null ? res : OrganizationReferent.m_EmpryEponyms);
    }
    
    addEponym(rodPadezSurname) {
        if (rodPadezSurname === null) 
            return;
        rodPadezSurname = MiscHelper.convertFirstCharUpperAndOtherLower(rodPadezSurname);
        if (this.findSlot(OrganizationReferent.ATTR_EPONYM, rodPadezSurname, true) === null) 
            this.addSlot(OrganizationReferent.ATTR_EPONYM, rodPadezSurname, false, 0);
    }
    
    get geoObjects() {
        let res = null;
        for (const s of this.slots) {
            if (s.typeName === OrganizationReferent.ATTR_GEO && (s.value instanceof GeoReferent)) {
                if (res === null) 
                    res = new Array();
                res.push(Utils.as(s.value, GeoReferent));
            }
        }
        return (res != null ? res : OrganizationReferent.m_EmptyGeos);
    }
    
    addGeoObject(r) {
        if (r instanceof GeoReferent) {
            let _geo = Utils.as(r, GeoReferent);
            for (const s of this.slots) {
                if (s.typeName === OrganizationReferent.ATTR_GEO && (s.value instanceof GeoReferent)) {
                    let gg = Utils.as(s.value, GeoReferent);
                    if (gg.canBeEquals(_geo, ReferentsEqualType.WITHINONETEXT) || gg.higher === _geo) 
                        return true;
                    if (this.findSlot(OrganizationReferent.ATTR_TYPE, "посольство", true) !== null || this.findSlot(OrganizationReferent.ATTR_TYPE, "консульство", true) !== null) 
                        break;
                    if (_geo.isState !== gg.isState) {
                        if (gg.isState) {
                            if (this.kind === OrganizationKind.GOVENMENT) 
                                return false;
                            if (!_geo.isCity) 
                                return false;
                        }
                    }
                    if (_geo.isCity === gg.isCity) {
                        let sovm = false;
                        for (const t of this.types) {
                            if (t.includes("совместн") || t.includes("альянс")) 
                                sovm = true;
                        }
                        if (!sovm) 
                            return false;
                    }
                    if (_geo.higher === gg) {
                        this.uploadSlot(s, _geo);
                        return true;
                    }
                }
            }
            this.addSlot(OrganizationReferent.ATTR_GEO, r, false, 0);
            return true;
        }
        else if (r instanceof StreetReferent) {
            this.addSlot(OrganizationReferent.ATTR_GEO, r, false, 0);
            return true;
        }
        else if (r instanceof ReferentToken) {
            if ((r.getReferent() instanceof GeoReferent) || (r.getReferent() instanceof StreetReferent)) {
                if (!this.addGeoObject(r.getReferent())) 
                    return false;
                this.addExtReferent(Utils.as(r, ReferentToken));
                return true;
            }
            if (r.getReferent() instanceof AddressReferent) 
                return this.addGeoObject(r.beginToken.getReferent());
        }
        return false;
    }
    
    get nameVars() {
        const OrganizationAnalyzer = require("./OrganizationAnalyzer");
        if (this.m_NameVars !== null) 
            return this.m_NameVars;
        this.m_NameVars = new Hashtable();
        this.m_NameHashs = new Array();
        let nameAbbr = null;
        let ki = this.kind;
        for (const n of this.names) {
            if (!this.m_NameVars.containsKey(n)) 
                this.m_NameVars.put(n, false);
        }
        for (const n of this.names) {
            let a = null;
            if (ki === OrganizationKind.BANK) {
                if (!n.includes("БАНК")) {
                    a = n + "БАНК";
                    if (!this.m_NameVars.containsKey(a)) 
                        this.m_NameVars.put(a, false);
                }
            }
            if (!OrganizationAnalyzer.BAN_AUTO_ABBREVIATIONS) {
                if ((((a = MiscHelper.getAbbreviation(n)))) !== null && a.length > 1) {
                    if (!this.m_NameVars.containsKey(a)) 
                        this.m_NameVars.put(a, true);
                    if (nameAbbr === null) 
                        nameAbbr = new Array();
                    if (!nameAbbr.includes(a)) 
                        nameAbbr.push(a);
                    for (const _geo of this.geoObjects) {
                        let aa = (a + _geo.toStringEx(true, MorphLang.UNKNOWN, 0)[0]);
                        if (!this.m_NameVars.containsKey(aa)) 
                            this.m_NameVars.put(aa, true);
                        if (!nameAbbr.includes(aa)) 
                            nameAbbr.push(aa);
                    }
                }
                if ((((a = MiscHelper.getTailAbbreviation(n)))) !== null) {
                    if (!this.m_NameVars.containsKey(a)) 
                        this.m_NameVars.put(a, true);
                }
            }
            let i = n.indexOf(' ');
            if (i > 0 && (n.indexOf(' ', i + 1) < 0)) {
                a = Utils.replaceString(n, " ", "");
                if (!this.m_NameVars.containsKey(a)) 
                    this.m_NameVars.put(a, false);
            }
        }
        for (const e of this.eponyms) {
            for (const ty of this.types) {
                let na = (ty + " " + e).toUpperCase();
                if (!this.m_NameVars.containsKey(na)) 
                    this.m_NameVars.put(na, false);
            }
        }
        let newVars = new Array();
        for (const n of this.types) {
            let a = MiscHelper.getAbbreviation(n);
            for (const v of this.m_NameVars.keys) {
                if (a !== null && !v.startsWith(a)) {
                    newVars.push(a + v);
                    newVars.push(a + " " + v);
                }
                newVars.push(n.toUpperCase() + " " + v);
            }
        }
        for (const v of newVars) {
            if (!this.m_NameVars.containsKey(v)) 
                this.m_NameVars.put(v, true);
        }
        for (const kp of this.m_NameVars.entries) {
            if (!kp.value) {
                let s = MiscHelper.getAbsoluteNormalValue(kp.key, false);
                if (s !== null && s.length > 4) {
                    if (!this.m_NameHashs.includes(s)) 
                        this.m_NameHashs.push(s);
                }
            }
        }
        return this.m_NameVars;
    }
    
    canBeEquals(obj, typ) {
        let ret = this.canBeEqualsEx(obj, false, typ);
        return ret;
    }
    
    canBeGeneralFor(obj) {
        if (this.m_Level > 10) 
            return false;
        this.m_Level++;
        let b = this.canBeEqualsEx(obj, true, ReferentsEqualType.DIFFERENTTEXTS);
        this.m_Level--;
        if (!b) 
            return false;
        let geos1 = this.geoObjects;
        let geos2 = obj.geoObjects;
        if (geos1.length === 0 && geos2.length > 0) {
            if (this._checkEqEponyms(Utils.as(obj, OrganizationReferent))) 
                return false;
            return true;
        }
        else if (geos1.length === geos2.length) {
            if (this._checkEqEponyms(Utils.as(obj, OrganizationReferent))) 
                return false;
            if (this.higher !== null && obj.higher !== null) {
                this.m_Level++;
                b = this.higher.canBeGeneralFor(obj.higher);
                this.m_Level--;
                if (b) 
                    return true;
            }
        }
        return false;
    }
    
    _checkEqEponyms(_org) {
        if (this.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null && _org.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null) 
            return false;
        let eps = this.eponyms;
        let eps1 = _org.eponyms;
        for (const e of eps) {
            if (eps1.includes(e)) 
                return true;
            if (!LanguageHelper.endsWith(e, "а")) {
                if (eps1.includes(e + "а")) 
                    return true;
            }
        }
        for (const e of eps1) {
            if (eps.includes(e)) 
                return true;
            if (!LanguageHelper.endsWith(e, "а")) {
                if (eps.includes(e + "а")) 
                    return true;
            }
        }
        if (this.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) !== null && _org.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) !== null) 
            return false;
        let s = _org.toStringEx(true, MorphLang.UNKNOWN, 0);
        for (const e of this.eponyms) {
            if (s.includes(e)) 
                return true;
        }
        s = this.toStringEx(true, MorphLang.UNKNOWN, 0);
        for (const e of _org.eponyms) {
            if (s.includes(e)) 
                return true;
        }
        return false;
    }
    
    canBeEqualsEx(obj, ignoreGeoObjects, typ) {
        if (this.m_Level > 10) 
            return false;
        this.m_Level++;
        let ret = this._canBeEquals(obj, ignoreGeoObjects, typ, 0);
        this.m_Level--;
        if (!ret) {
        }
        return ret;
    }
    
    _canBeEquals(obj, ignoreGeoObjects, typ, lev) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        let _org = Utils.as(obj, OrganizationReferent);
        if (_org === null) 
            return false;
        if (_org === this) 
            return true;
        if (lev > 4) 
            return false;
        let empty = true;
        let geoNotEquals = false;
        let k1 = this.kind;
        let k2 = _org.kind;
        let geos1 = this.geoObjects;
        let geos2 = _org.geoObjects;
        if (geos1.length > 0 && geos2.length > 0) {
            geoNotEquals = true;
            for (const g1 of geos1) {
                let eq = false;
                for (const g2 of geos2) {
                    if (g1.canBeEquals(g2, typ)) {
                        geoNotEquals = false;
                        eq = true;
                        break;
                    }
                }
                if (!eq) 
                    return false;
            }
            if (geos2.length > geos1.length) {
                for (const g1 of geos2) {
                    let eq = false;
                    for (const g2 of geos1) {
                        if (g1.canBeEquals(g2, typ)) {
                            geoNotEquals = false;
                            eq = true;
                            break;
                        }
                    }
                    if (!eq) 
                        return false;
                }
            }
        }
        if (this.findSlot(OrganizationReferent.ATTR_MARKER, null, true) !== null && _org.findSlot(OrganizationReferent.ATTR_MARKER, null, true) !== null) {
            let mrks1 = this.getStringValues(OrganizationReferent.ATTR_MARKER);
            let mrks2 = obj.getStringValues(OrganizationReferent.ATTR_MARKER);
            for (const m of mrks1) {
                if (!mrks2.includes(m)) 
                    return false;
            }
            for (const m of mrks2) {
                if (!mrks1.includes(m)) 
                    return false;
            }
        }
        let inn = this.iNN;
        let inn2 = _org.iNN;
        if (inn !== null && inn2 !== null) 
            return inn === inn2;
        let ogrn = this.oGRN;
        let ogrn2 = _org.oGRN;
        if (ogrn !== null && ogrn2 !== null) 
            return ogrn === ogrn2;
        let hi1 = Utils.notNull(this.higher, this.m_TempParentOrg);
        let hi2 = Utils.notNull(_org.higher, _org.m_TempParentOrg);
        let hiEq = false;
        if (hi1 !== null && hi2 !== null) {
            if (_org.findSlot(OrganizationReferent.ATTR_HIGHER, hi1, false) === null) {
                if (hi1._canBeEquals(hi2, ignoreGeoObjects, typ, lev + 1)) {
                }
                else 
                    return false;
            }
            hiEq = true;
        }
        if (this.owner !== null || _org.owner !== null) {
            if (this.owner === null || _org.owner === null) 
                return false;
            if (!this.owner.canBeEquals(_org.owner, typ)) 
                return false;
            if (this.findSlot(OrganizationReferent.ATTR_TYPE, "индивидуальное предприятие", true) !== null || _org.findSlot(OrganizationReferent.ATTR_TYPE, "индивидуальное предприятие", true) !== null) 
                return true;
            hiEq = true;
        }
        if (typ === ReferentsEqualType.DIFFERENTTEXTS && !hiEq) {
            if (this.higher !== null || _org.higher !== null) 
                return false;
        }
        if (OrgItemTypeToken.isTypesAntagonisticOO(this, _org)) 
            return false;
        if (typ === ReferentsEqualType.DIFFERENTTEXTS) {
            if (k1 === OrganizationKind.DEPARTMENT || k2 === OrganizationKind.DEPARTMENT) {
                if (hi1 === null && hi2 !== null) 
                    return false;
                if (hi1 !== null && hi2 === null) 
                    return false;
            }
            else if (k1 !== k2) 
                return false;
        }
        let eqEponyms = this._checkEqEponyms(_org);
        let eqNumber = false;
        if (this.number !== null || _org.number !== null) {
            if (_org.number !== this.number) {
                if (((_org.number === null || this.number === null)) && eqEponyms) {
                }
                else if (typ === ReferentsEqualType.FORMERGING && ((_org.number === null || this.number === null))) {
                }
                else 
                    return false;
            }
            else {
                empty = false;
                for (const a of this.slots) {
                    if (a.typeName === OrganizationReferent.ATTR_TYPE) {
                        if (obj.findSlot(a.typeName, a.value, true) !== null || obj.findSlot(OrganizationReferent.ATTR_NAME, a.value.toUpperCase(), true) !== null) {
                            eqNumber = true;
                            break;
                        }
                    }
                }
            }
        }
        if (typ === ReferentsEqualType.DIFFERENTTEXTS) {
            if (this.number !== null || _org.number !== null) {
                if (!eqNumber && !eqEponyms) 
                    return false;
            }
        }
        if (k1 !== OrganizationKind.UNDEFINED && k2 !== OrganizationKind.UNDEFINED) {
            if (k1 !== k2) {
                let oo = false;
                for (const ty1 of this.types) {
                    if (_org.types.includes(ty1)) {
                        oo = true;
                        break;
                    }
                }
                if (!oo) {
                    let hasPr = false;
                    for (const p of this.profiles) {
                        if (_org.containsProfile(p)) {
                            hasPr = true;
                            break;
                        }
                    }
                    if (!hasPr) 
                        return false;
                }
            }
        }
        else {
            if (k1 === OrganizationKind.UNDEFINED) 
                k1 = k2;
            if ((k1 === OrganizationKind.BANK || k1 === OrganizationKind.MEDICAL || k1 === OrganizationKind.PARTY) || k1 === OrganizationKind.CULTURE) {
                if (this.types.length > 0 && _org.types.length > 0) {
                    if (typ !== ReferentsEqualType.FORMERGING) 
                        return false;
                    let ok = false;
                    for (const s of this.slots) {
                        if (s.typeName === OrganizationReferent.ATTR_NAME) {
                            if (_org.findSlot(s.typeName, s.value, true) !== null) 
                                ok = true;
                        }
                    }
                    if (!ok) 
                        return false;
                }
            }
        }
        if ((k1 === OrganizationKind.GOVENMENT || k2 === OrganizationKind.GOVENMENT || k1 === OrganizationKind.MILITARY) || k2 === OrganizationKind.MILITARY) {
            let typs = _org.types;
            let ok = false;
            for (const ty of this.types) {
                if (typs.includes(ty)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) 
                return false;
        }
        if (typ === ReferentsEqualType.FORMERGING) {
        }
        else if (this.findSlot(OrganizationReferent.ATTR_NAME, null, true) !== null || _org.findSlot(OrganizationReferent.ATTR_NAME, null, true) !== null) {
            if (((eqNumber || eqEponyms)) && ((this.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null || _org.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null))) {
            }
            else {
                empty = false;
                let maxLen = 0;
                for (const v of this.nameVars.entries) {
                    if (typ === ReferentsEqualType.DIFFERENTTEXTS && v.value) 
                        continue;
                    let b = false;
                    let wrapb2477 = new RefOutArgWrapper();
                    let inoutres2478 = _org.nameVars.tryGetValue(v.key, wrapb2477);
                    b = wrapb2477.value;
                    if (!inoutres2478) 
                        continue;
                    if (typ === ReferentsEqualType.DIFFERENTTEXTS && b) 
                        continue;
                    if (b && v.value) 
                        continue;
                    if (b && this.names.length > 1 && (v.key.length < 4)) 
                        continue;
                    if (v.value && _org.names.length > 1 && (v.key.length < 4)) 
                        continue;
                    if (v.key.length > maxLen) 
                        maxLen = v.key.length;
                }
                if (typ !== ReferentsEqualType.DIFFERENTTEXTS) {
                    for (const v of this.m_NameHashs) {
                        if (_org.m_NameHashs.includes(v)) {
                            if (v.length > maxLen) 
                                maxLen = v.length;
                        }
                    }
                }
                if ((maxLen < 2) && ((k1 === OrganizationKind.GOVENMENT || typ === ReferentsEqualType.FORMERGING)) && typ !== ReferentsEqualType.DIFFERENTTEXTS) {
                    if (geos1.length === geos2.length) {
                        let nams = (typ === ReferentsEqualType.FORMERGING ? _org.nameVars.keys : _org.names);
                        let nams0 = (typ === ReferentsEqualType.FORMERGING ? this.nameVars.keys : this.names);
                        for (const n of nams0) {
                            for (const nn of nams) {
                                if (n.startsWith(nn)) {
                                    maxLen = nn.length;
                                    break;
                                }
                                else if (nn.startsWith(n)) {
                                    maxLen = n.length;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (maxLen < 2) 
                    return false;
                if (maxLen < 4) {
                    let ok = false;
                    if (!ok) {
                        if (this.names.length === 1 && (this.names[0].length < 4)) 
                            ok = true;
                        else if (_org.names.length === 1 && (_org.names[0].length < 4)) 
                            ok = true;
                    }
                    if (!ok) 
                        return false;
                }
            }
        }
        if (eqEponyms) 
            return true;
        if (this.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) !== null || obj.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) !== null) {
            if (typ === ReferentsEqualType.FORMERGING && ((this.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null || obj.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null))) {
            }
            else {
                let ok = false;
                let eps = this.eponyms;
                let eps1 = _org.eponyms;
                for (const e of eps) {
                    if (eps1.includes(e)) {
                        ok = true;
                        break;
                    }
                    if (!LanguageHelper.endsWith(e, "а")) {
                        if (eps1.includes(e + "а")) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (!ok) {
                    for (const e of eps1) {
                        if (eps.includes(e)) {
                            ok = true;
                            break;
                        }
                        if (!LanguageHelper.endsWith(e, "а")) {
                            if (eps.includes(e + "а")) {
                                ok = true;
                                break;
                            }
                        }
                    }
                }
                if (ok) 
                    return true;
                if (this.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null || obj.findSlot(OrganizationReferent.ATTR_EPONYM, null, true) === null) {
                    let s = obj.toStringEx(true, MorphLang.UNKNOWN, 0);
                    for (const e of this.eponyms) {
                        if (s.includes(e)) {
                            ok = true;
                            break;
                        }
                    }
                    if (!ok) {
                        s = this.toStringEx(true, MorphLang.UNKNOWN, 0);
                        for (const e of _org.eponyms) {
                            if (s.includes(e)) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (ok) 
                        return true;
                    else if (empty) 
                        return false;
                }
                else 
                    return false;
            }
        }
        if (geoNotEquals) {
            if (k1 === OrganizationKind.BANK || k1 === OrganizationKind.GOVENMENT || k1 === OrganizationKind.DEPARTMENT) 
                return false;
        }
        if (k1 !== OrganizationKind.DEPARTMENT) {
            if (!empty) 
                return true;
            if (hiEq) {
                let typs = _org.types;
                for (const ty of this.types) {
                    if (typs.includes(ty)) 
                        return true;
                }
            }
        }
        if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
            return this.toString() === _org.toString();
        if (empty) {
            if (((geos1.length > 0 && geos2.length > 0)) || k1 === OrganizationKind.DEPARTMENT || k1 === OrganizationKind.JUSTICE) {
                let typs = _org.types;
                for (const ty of this.types) {
                    if (typs.includes(ty)) 
                        return true;
                }
            }
            let fullNotEq = false;
            for (const s of this.slots) {
                if (_org.findSlot(s.typeName, s.value, true) === null) {
                    fullNotEq = true;
                    break;
                }
            }
            for (const s of _org.slots) {
                if (this.findSlot(s.typeName, s.value, true) === null) {
                    fullNotEq = true;
                    break;
                }
            }
            if (!fullNotEq) 
                return true;
        }
        else if (k1 === OrganizationKind.DEPARTMENT) 
            return true;
        if (typ === ReferentsEqualType.FORMERGING) 
            return true;
        return false;
    }
    
    addSlot(attrName, attrValue, clearOldValue, statCount = 0) {
        if (attrName === OrganizationReferent.ATTR_NAME || attrName === OrganizationReferent.ATTR_TYPE) {
            this.m_NameVars = null;
            this.m_NameHashs = null;
        }
        else if (attrName === OrganizationReferent.ATTR_HIGHER) 
            this.m_ParentCalc = false;
        else if (attrName === OrganizationReferent.ATTR_NUMBER) 
            this.m_NumberCalc = false;
        this.m_KindCalc = false;
        let sl = super.addSlot(attrName, attrValue, clearOldValue, statCount);
        return sl;
    }
    
    uploadSlot(slot, newVal) {
        this.m_ParentCalc = false;
        super.uploadSlot(slot, newVal);
    }
    
    mergeSlots(obj, mergeStatistic) {
        let ownThis = this.higher;
        let ownObj = obj.higher;
        super.mergeSlots(obj, mergeStatistic);
        for (let i = this.slots.length - 1; i >= 0; i--) {
            if (this.slots[i].typeName === OrganizationReferent.ATTR_HIGHER) 
                this.slots.splice(i, 1);
        }
        if (ownThis === null) 
            ownThis = ownObj;
        if (ownThis !== null) 
            this.higher = ownThis;
        if (obj.isFromGlobalOntos) 
            this.isFromGlobalOntos = true;
        this.correctData(true);
    }
    
    correctData(removeLongGovNames) {
        for (let i = this.slots.length - 1; i >= 0; i--) {
            if (this.slots[i].typeName === OrganizationReferent.ATTR_TYPE) {
                let ty = this.slots[i].toString().toUpperCase();
                let del = false;
                for (const s of this.slots) {
                    if (s.typeName === OrganizationReferent.ATTR_NAME) {
                        let na = s.value.toString();
                        if (LanguageHelper.endsWith(ty, na)) 
                            del = true;
                    }
                }
                if (del) 
                    this.slots.splice(i, 1);
            }
        }
        for (const t of this.types) {
            let n = this.findSlot(OrganizationReferent.ATTR_NAME, t.toUpperCase(), true);
            if (n !== null) 
                Utils.removeItem(this.slots, n);
        }
        for (const t of this.names) {
            if (t.indexOf('.') > 0) {
                let n = this.findSlot(OrganizationReferent.ATTR_NAME, Utils.replaceString(t, '.', ' '), true);
                if (n === null) 
                    this.addSlot(OrganizationReferent.ATTR_NAME, Utils.replaceString(t, '.', ' '), false, 0);
            }
        }
        let eps = this.eponyms;
        if (eps.length > 1) {
            for (const e of eps) {
                for (const ee of eps) {
                    if (e !== ee && e.startsWith(ee)) {
                        let s = this.findSlot(OrganizationReferent.ATTR_EPONYM, ee, true);
                        if (s !== null) 
                            Utils.removeItem(this.slots, s);
                    }
                }
            }
        }
        let typs = this.types;
        let epons = this.eponyms;
        for (const t of typs) {
            for (const e of epons) {
                let n = this.findSlot(OrganizationReferent.ATTR_NAME, (t.toUpperCase() + " " + e.toUpperCase()), true);
                if (n !== null) 
                    Utils.removeItem(this.slots, n);
            }
        }
        if (removeLongGovNames && this.kind === OrganizationKind.GOVENMENT) {
            let nams = this.names;
            for (let i = this.slots.length - 1; i >= 0; i--) {
                if (this.slots[i].typeName === OrganizationReferent.ATTR_NAME) {
                    let n = this.slots[i].value.toString();
                    for (const nn of nams) {
                        if (n.startsWith(nn) && n.length > nn.length) {
                            this.slots.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
        if (this.types.includes("фронт")) {
            let uni = false;
            for (const ty of this.types) {
                if (ty.includes("объединение")) 
                    uni = true;
            }
            if (uni || this.profiles.includes(OrgProfile.UNION)) {
                let ss = this.findSlot(OrganizationReferent.ATTR_PROFILE, "ARMY", true);
                if (ss !== null) {
                    Utils.removeItem(this.slots, ss);
                    this.addProfile(OrgProfile.UNION);
                }
                if ((((ss = this.findSlot(OrganizationReferent.ATTR_TYPE, "фронт", true)))) !== null) 
                    Utils.removeItem(this.slots, ss);
            }
        }
        this.m_NameVars = null;
        this.m_NameHashs = null;
        this.m_KindCalc = false;
        this.extOntologyAttached = false;
    }
    
    finalCorrection() {
        let typs = this.types;
        if (this.containsProfile(OrgProfile.EDUCATION) && this.containsProfile(OrgProfile.SCIENCE)) {
            if (typs.includes("академия") || typs.includes("академія") || typs.includes("academy")) {
                let isSci = false;
                for (const n of this.names) {
                    if (n.includes("НАУЧН") || n.includes("НАУК") || n.includes("SCIENC")) {
                        isSci = true;
                        break;
                    }
                }
                let s = null;
                if (isSci) 
                    s = this.findSlot(OrganizationReferent.ATTR_PROFILE, OrgProfile.EDUCATION.toString(), true);
                else 
                    s = this.findSlot(OrganizationReferent.ATTR_PROFILE, OrgProfile.SCIENCE.toString(), true);
                if (s !== null) 
                    Utils.removeItem(this.slots, s);
            }
        }
        if (this.findSlot(OrganizationReferent.ATTR_PROFILE, null, true) === null) {
            if (typs.includes("служба") && this.higher !== null) 
                this.addProfile(OrgProfile.UNIT);
        }
        if (typs.length > 0 && LanguageHelper.isLatin(typs[0])) {
            if (this.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null && typs.length > 1) {
                let nam = typs[0];
                for (const v of typs) {
                    if (v.length > nam.length) 
                        nam = v;
                }
                if (nam.indexOf(' ') > 0) {
                    this.addSlot(OrganizationReferent.ATTR_NAME, nam.toUpperCase(), false, 0);
                    let s = this.findSlot(OrganizationReferent.ATTR_TYPE, nam, true);
                    if (s !== null) 
                        Utils.removeItem(this.slots, s);
                }
            }
            if ((this.findSlot(OrganizationReferent.ATTR_NAME, null, true) === null && this.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null && this.findSlot(OrganizationReferent.ATTR_NUMBER, null, true) === null) && typs.length > 0) {
                let _geo = Utils.as(this.getSlotValue(OrganizationReferent.ATTR_GEO), GeoReferent);
                if (_geo !== null) {
                    let nam = _geo.getStringValue(GeoReferent.ATTR_NAME);
                    if (nam !== null && LanguageHelper.isLatin(nam)) {
                        let nn = false;
                        for (const t of typs) {
                            if (t.toUpperCase().includes(nam)) {
                                this.addSlot(OrganizationReferent.ATTR_NAME, t.toUpperCase(), false, 0);
                                nn = true;
                                if (typs.length > 1) {
                                    let s = this.findSlot(OrganizationReferent.ATTR_TYPE, t, true);
                                    if (s !== null) 
                                        Utils.removeItem(this.slots, s);
                                }
                                break;
                            }
                        }
                        if (!nn) 
                            this.addSlot(OrganizationReferent.ATTR_NAME, (nam + " " + typs[0]).toUpperCase(), false, 0);
                    }
                }
            }
        }
        this.m_NameVars = null;
        this.m_NameHashs = null;
        this.m_KindCalc = false;
        this.extOntologyAttached = false;
    }
    
    _getPureNames() {
        let vars = new Array();
        let typs = this.types;
        for (const a of this.slots) {
            if (a.typeName === OrganizationReferent.ATTR_NAME) {
                let s = a.value.toString().toUpperCase();
                if (!vars.includes(s)) 
                    vars.push(s);
                for (const t of typs) {
                    if (Utils.startsWithString(s, t, true)) {
                        if ((s.length < (t.length + 4)) || s[t.length] !== ' ') 
                            continue;
                        let ss = s.substring(t.length + 1);
                        if (!vars.includes(ss)) 
                            vars.push(ss);
                    }
                }
            }
        }
        return vars;
    }
    
    createOntologyItem() {
        return this.createOntologyItemEx(2, false, false);
    }
    
    createOntologyItemEx(minLen, onlyNames = false, pureNames = false) {
        let oi = new IntOntologyItem(this);
        let vars = new Array();
        let typs = this.types;
        for (const a of this.slots) {
            if (a.typeName === OrganizationReferent.ATTR_NAME) {
                let s = a.value.toString().toUpperCase();
                if (!vars.includes(s)) 
                    vars.push(s);
                if (!pureNames) {
                    let sp = 0;
                    for (let jj = 0; jj < s.length; jj++) {
                        if (s[jj] === ' ') 
                            sp++;
                    }
                    if (sp === 1) {
                        s = Utils.replaceString(s, " ", "");
                        if (!vars.includes(s)) 
                            vars.push(s);
                    }
                }
            }
        }
        if (!pureNames) {
            for (const v of this.nameVars.keys) {
                if (!vars.includes(v)) 
                    vars.push(v);
            }
        }
        if (!onlyNames) {
            if (this.number !== null) {
                for (const a of this.slots) {
                    if (a.typeName === OrganizationReferent.ATTR_TYPE) {
                        let s = a.value.toString().toUpperCase();
                        if (!vars.includes(s)) 
                            vars.push(s);
                    }
                }
            }
            if (vars.length === 0) {
                for (const t of this.types) {
                    let up = t.toUpperCase();
                    if (!vars.includes(up)) 
                        vars.push(up);
                }
            }
            if (this.iNN !== null) 
                vars.splice(0, 0, "ИНН:" + this.iNN);
            if (this.oGRN !== null) 
                vars.splice(0, 0, "ОГРН:" + this.oGRN);
        }
        let max = 20;
        let cou = 0;
        for (const v of vars) {
            if (v.length >= minLen) {
                let term = null;
                if (pureNames) {
                    term = new Termin();
                    term.initByNormalText(v, null);
                }
                else 
                    term = new Termin(v);
                oi.termins.push(term);
                if ((++cou) >= max) 
                    break;
            }
        }
        if (oi.termins.length === 0) 
            return null;
        return oi;
    }
    
    get kind() {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (!this.m_KindCalc) {
            this.m_Kind = OrgItemTypeToken.checkKind(this);
            if (this.m_Kind === OrganizationKind.UNDEFINED) {
                for (const p of this.profiles) {
                    if (p === OrgProfile.UNIT) {
                        this.m_Kind = OrganizationKind.DEPARTMENT;
                        break;
                    }
                }
            }
            this.m_KindCalc = true;
        }
        return this.m_Kind;
    }
    
    getStringValue(attrName) {
        if (attrName === "KIND") {
            let ki = this.kind;
            if (ki === OrganizationKind.UNDEFINED) 
                return null;
            return ki.toString();
        }
        return super.getStringValue(attrName);
    }
    
    // Проверка, что организация slave может быть дополнительным описанием основной организации
    static canBeSecondDefinition(master, slave) {
        if (master === null || slave === null) 
            return false;
        let mTypes = master.types;
        let sTypes = slave.types;
        let ok = false;
        for (const t of mTypes) {
            if (sTypes.includes(t)) {
                ok = true;
                break;
            }
        }
        if (ok) 
            return true;
        if (master.kind !== OrganizationKind.UNDEFINED && slave.kind !== OrganizationKind.UNDEFINED) {
            if (master.kind !== slave.kind) 
                return false;
        }
        if (sTypes.length > 0) 
            return false;
        if (slave.names.length === 1) {
            let acr = slave.names[0];
            if (LanguageHelper.endsWith(acr, "АН")) 
                return true;
            for (const n of master.names) {
                if (OrganizationReferent.checkAcronym(acr, n) || OrganizationReferent.checkAcronym(n, acr)) 
                    return true;
                if (OrganizationReferent.checkLatinAccords(n, acr)) 
                    return true;
                for (const t of mTypes) {
                    if (OrganizationReferent.checkAcronym(acr, t.toUpperCase() + n)) 
                        return true;
                }
            }
        }
        return false;
    }
    
    static checkLatinAccords(rusName, latName) {
        if (!LanguageHelper.isCyrillicChar(rusName[0]) || !LanguageHelper.isLatinChar(latName[0])) 
            return false;
        let ru = Utils.splitString(rusName, ' ', false);
        let la = Utils.splitString(latName, ' ', false);
        let i = 0;
        let j = 0;
        while ((i < ru.length) && (j < la.length)) {
            if (Utils.compareStrings(la[j], "THE", true) === 0 || Utils.compareStrings(la[j], "OF", true) === 0) {
                j++;
                continue;
            }
            if (MiscHelper.canBeEqualCyrAndLatSS(ru[i], la[j])) 
                return true;
            i++;
            j++;
        }
        if ((i < ru.length) || (j < la.length)) 
            return false;
        if (i >= 2) 
            return true;
        return false;
    }
    
    static checkAcronym(acr, text) {
        let i = 0;
        let j = 0;
        for (i = 0; i < acr.length; i++) {
            for (; j < text.length; j++) {
                if (text[j] === acr[i]) 
                    break;
            }
            if (j >= text.length) 
                break;
            j++;
        }
        return i >= acr.length;
    }
    
    // Проверка на отношения "вышестоящий - нижестоящий"
    static canBeHigher(_higher, lower) {
        const OrgOwnershipHelper = require("./internal/OrgOwnershipHelper");
        return OrgOwnershipHelper.canBeHigher(_higher, lower, false);
    }
    
    static static_constructor() {
        OrganizationReferent.OBJ_TYPENAME = "ORGANIZATION";
        OrganizationReferent.ATTR_NAME = "NAME";
        OrganizationReferent.ATTR_TYPE = "TYPE";
        OrganizationReferent.ATTR_NUMBER = "NUMBER";
        OrganizationReferent.ATTR_EPONYM = "EPONYM";
        OrganizationReferent.ATTR_HIGHER = "HIGHER";
        OrganizationReferent.ATTR_OWNER = "OWNER";
        OrganizationReferent.ATTR_GEO = "GEO";
        OrganizationReferent.ATTR_MISC = "MISC";
        OrganizationReferent.ATTR_PROFILE = "PROFILE";
        OrganizationReferent.ATTR_MARKER = "MARKER";
        OrganizationReferent.SHOW_NUMBER_ON_FIRST_POSITION = false;
        OrganizationReferent.m_EmptyNames = new Array();
        OrganizationReferent.m_EmpryEponyms = new Array();
        OrganizationReferent.m_EmptyGeos = new Array();
    }
}


OrganizationReferent.static_constructor();

module.exports = OrganizationReferent