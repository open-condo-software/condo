/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const FioTemplateType = require("./internal/FioTemplateType");
const MorphGender = require("./../../morph/MorphGender");
const MiscHelper = require("./../core/MiscHelper");
const NumberHelper = require("./../core/NumberHelper");
const IntOntologyItem = require("./../core/IntOntologyItem");
const Termin = require("./../core/Termin");
const PersonPropertyKind = require("./PersonPropertyKind");
const ReferentClass = require("./../metadata/ReferentClass");
const Referent = require("./../Referent");
const MetaPerson = require("./internal/MetaPerson");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const LanguageHelper = require("./../../morph/LanguageHelper");
const PersonPropertyReferent = require("./PersonPropertyReferent");

/**
 * Сущность - персона
 * 
 */
class PersonReferent extends Referent {
    
    constructor() {
        super(PersonReferent.OBJ_TYPENAME);
        this.m_PersonIdentityTyp = FioTemplateType.UNDEFINED;
        this.m_SurnameOccurs = new Array();
        this.m_NameOccurs = new Array();
        this.m_SecOccurs = new Array();
        this.m_IdentOccurs = new Array();
        this.instanceOf = MetaPerson.globalMeta;
    }
    
    get isMale() {
        return this.getStringValue(PersonReferent.ATTR_SEX) === MetaPerson.ATTR_SEXMALE;
    }
    set isMale(value) {
        this.addSlot(PersonReferent.ATTR_SEX, MetaPerson.ATTR_SEXMALE, true, 0);
        return value;
    }
    
    get isFemale() {
        return this.getStringValue(PersonReferent.ATTR_SEX) === MetaPerson.ATTR_SEXFEMALE;
    }
    set isFemale(value) {
        this.addSlot(PersonReferent.ATTR_SEX, MetaPerson.ATTR_SEXFEMALE, true, 0);
        return value;
    }
    
    get age() {
        let i = this.getIntValue(PersonReferent.ATTR_AGE, 0);
        if (i > 0) 
            return i;
        return 0;
    }
    set age(value) {
        this.addSlot(PersonReferent.ATTR_AGE, value.toString(), true, 0);
        return value;
    }
    
    addContact(contact) {
        for (const s of this.slots) {
            if (s.typeName === PersonReferent.ATTR_CONTACT) {
                let r = Utils.as(s.value, Referent);
                if (r !== null) {
                    if (r.canBeGeneralFor(contact)) {
                        this.uploadSlot(s, contact);
                        return;
                    }
                    if (r.canBeEquals(contact, ReferentsEqualType.WITHINONETEXT)) 
                        return;
                }
            }
        }
        this.addSlot(PersonReferent.ATTR_CONTACT, contact, false, 0);
    }
    
    _getPrefix() {
        if (this.isMale) 
            return "г-н ";
        if (this.isFemale) 
            return "г-жа ";
        return "";
    }
    
    _findForSurname(attrName, surname, findShortest = false) {
        let rus = LanguageHelper.isCyrillicChar(surname[0]);
        let res = null;
        for (const a of this.slots) {
            if (a.typeName === attrName) {
                let v = a.value.toString();
                if (LanguageHelper.isCyrillicChar(v[0]) !== rus) 
                    continue;
                if (res === null) 
                    res = v;
                else if (findShortest && (v.length < res.length)) 
                    res = v;
            }
        }
        return res;
    }
    
    _findShortestValue(attrName) {
        let res = null;
        for (const a of this.slots) {
            if (a.typeName === attrName) {
                let v = a.value.toString();
                if (res === null || (v.length < res.length)) 
                    res = v;
            }
        }
        return res;
    }
    
    _findShortestKingTitul(doName = false) {
        let res = null;
        for (const s of this.slots) {
            if (s.value instanceof PersonPropertyReferent) {
                let pr = Utils.as(s.value, PersonPropertyReferent);
                if (pr.kind !== PersonPropertyKind.KING) 
                    continue;
                for (const ss of pr.slots) {
                    if (ss.typeName === PersonPropertyReferent.ATTR_NAME) {
                        let n = Utils.asString(ss.value);
                        if (res === null) 
                            res = n;
                        else if (res.length > n.length) 
                            res = n;
                    }
                }
            }
        }
        if (res !== null || !doName) 
            return res;
        return null;
    }
    
    toSortString() {
        let sur = null;
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_IDENTITY) 
                return a.value.toString();
            else if (a.typeName === PersonReferent.ATTR_LASTNAME) {
                sur = a.value.toString();
                break;
            }
        }
        if (sur === null) {
            let tit = this._findShortestKingTitul(false);
            if (tit === null) 
                return "?";
            let s = this.getStringValue(PersonReferent.ATTR_FIRSTNAME);
            if (s === null) 
                return "?";
            return (tit + " " + s);
        }
        let n = this._findForSurname(PersonReferent.ATTR_FIRSTNAME, sur, false);
        if (n === null) 
            return sur;
        else 
            return (sur + " " + n);
    }
    
    getCompareStrings() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === PersonReferent.ATTR_LASTNAME || s.typeName === PersonReferent.ATTR_IDENTITY) 
                res.push(s.value.toString());
        }
        let tit = this._findShortestKingTitul(false);
        if (tit !== null) {
            let nam = this.getStringValue(PersonReferent.ATTR_FIRSTNAME);
            if (nam !== null) 
                res.push((tit + " " + nam));
        }
        if (res.length > 0) 
            return res;
        else 
            return super.getCompareStrings();
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        if (shortVariant) 
            return this.toShortString(lang);
        else {
            let res = this.toFullString(PersonReferent.SHOW_LASTNAME_ON_FIRST_POSITION, lang, false);
            if (this.findSlot(PersonReferent.ATTR_NICKNAME, null, true) === null) 
                return res;
            let niks = this.getStringValues(PersonReferent.ATTR_NICKNAME);
            if (niks.length === 1) 
                return (res + " (" + PersonReferent._outNik(niks[0]) + ")");
            let tmp = new StringBuilder();
            tmp.append(res);
            tmp.append(" (");
            for (const s of niks) {
                if (s !== niks[0]) 
                    tmp.append(", ");
                tmp.append(PersonReferent._outNik(s));
            }
            tmp.append(")");
            return tmp.toString();
        }
    }
    
    static _outNik(str) {
        if (str.length < 4) 
            return str;
        return MiscHelper.convertFirstCharUpperAndOtherLower(str);
    }
    
    toShortString(lang) {
        let id = null;
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_IDENTITY) {
                let s = a.value.toString();
                if (id === null || (s.length < id.length)) 
                    id = s;
            }
        }
        if (id !== null) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(id);
        let n = this.getStringValue(PersonReferent.ATTR_LASTNAME);
        if (n !== null) {
            let res = new StringBuilder();
            res.append(n);
            let s = this._findForSurname(PersonReferent.ATTR_FIRSTNAME, n, true);
            if (s !== null) {
                res.append(" ").append(s[0]).append(".");
                s = this._findForSurname(PersonReferent.ATTR_MIDDLENAME, n, false);
                if (s !== null) 
                    res.append(s[0]).append(".");
            }
            return MiscHelper.convertFirstCharUpperAndOtherLower(res.toString());
        }
        let tit = this._findShortestKingTitul(true);
        if (tit !== null) {
            let nam = this.getStringValue(PersonReferent.ATTR_FIRSTNAME);
            if (nam !== null) 
                return MiscHelper.convertFirstCharUpperAndOtherLower((tit + " " + nam));
        }
        return this.toFullString(false, lang, true);
    }
    
    toFullString(lastNameFirst, lang, outNiks) {
        let id = null;
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_IDENTITY) {
                let s = a.value.toString();
                if (id === null || s.length > id.length) 
                    id = s;
            }
        }
        if (id !== null) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(id);
        let sss = this.getStringValue("NAMETYPE");
        if (sss === "china") 
            lastNameFirst = true;
        let n = this.getStringValue(PersonReferent.ATTR_LASTNAME);
        if (n !== null) {
            let res = new StringBuilder();
            if (lastNameFirst) 
                res.append(n).append(" ");
            let s = this._findForSurname(PersonReferent.ATTR_FIRSTNAME, n, false);
            if (s !== null) {
                res.append(s);
                if (PersonReferent.isInitial(s)) 
                    res.append('.');
                else 
                    res.append(' ');
                s = this._findForSurname(PersonReferent.ATTR_MIDDLENAME, n, false);
                if (s !== null) {
                    res.append(s);
                    if (PersonReferent.isInitial(s)) 
                        res.append('.');
                    else 
                        res.append(' ');
                }
            }
            if (!lastNameFirst) 
                res.append(n);
            else if (res.charAt(res.length - 1) === ' ') 
                res.length = res.length - 1;
            if (LanguageHelper.isCyrillicChar(n[0])) {
                let nl = null;
                for (const sl of this.slots) {
                    if (sl.typeName === PersonReferent.ATTR_LASTNAME) {
                        let ss = Utils.asString(sl.value);
                        if (ss.length > 0 && LanguageHelper.isLatinChar(ss[0])) {
                            nl = ss;
                            break;
                        }
                    }
                }
                if (nl !== null) {
                    let nal = this._findForSurname(PersonReferent.ATTR_FIRSTNAME, nl, false);
                    if (nal === null) 
                        res.append(" (").append(nl).append(")");
                    else if (PersonReferent.SHOW_LASTNAME_ON_FIRST_POSITION) 
                        res.append(" (").append(nl).append(" ").append(nal).append(")");
                    else 
                        res.append(" (").append(nal).append(" ").append(nl).append(")");
                }
            }
            return MiscHelper.convertFirstCharUpperAndOtherLower(res.toString());
        }
        else if ((((n = this.getStringValue(PersonReferent.ATTR_FIRSTNAME)))) !== null) {
            let s = this._findForSurname(PersonReferent.ATTR_MIDDLENAME, n, false);
            if (s !== null) 
                n = (n + " " + s);
            n = MiscHelper.convertFirstCharUpperAndOtherLower(n);
            let tit = this._findShortestKingTitul(false);
            if (tit !== null) 
                n = (tit + " " + n);
            if (outNiks) {
                let nik = this.getStringValue(PersonReferent.ATTR_NICKNAME);
                if (nik !== null) 
                    n = (n + " " + PersonReferent._outNik(nik));
            }
            return n;
        }
        return "?";
    }
    
    addFioIdentity(lastName, firstName, middleName) {
        const PersonMorphCollection = require("./internal/PersonMorphCollection");
        if (lastName !== null) {
            if (lastName.number > 0) {
                let num = NumberHelper.getNumberRoman(lastName.number);
                if (num === null) 
                    num = lastName.number.toString();
                this.addSlot(PersonReferent.ATTR_NICKNAME, num, false, 0);
            }
            else {
                lastName.correct();
                this.m_SurnameOccurs.push(lastName);
                for (const v of lastName.values) {
                    this.addSlot(PersonReferent.ATTR_LASTNAME, v, false, 0);
                }
            }
        }
        if (firstName !== null) {
            firstName.correct();
            if (firstName.head !== null && firstName.head.length > 2) 
                this.m_NameOccurs.push(firstName);
            for (const v of firstName.values) {
                this.addSlot(PersonReferent.ATTR_FIRSTNAME, v, false, 0);
            }
            if ((typeof middleName === 'string' || middleName instanceof String)) 
                this.addSlot(PersonReferent.ATTR_MIDDLENAME, middleName, false, 0);
            else if (middleName instanceof PersonMorphCollection) {
                let mm = Utils.as(middleName, PersonMorphCollection);
                if (mm.head !== null && mm.head.length > 2) 
                    this.m_SecOccurs.push(mm);
                for (const v of mm.values) {
                    this.addSlot(PersonReferent.ATTR_MIDDLENAME, v, false, 0);
                }
            }
        }
        this.correctData();
    }
    
    addIdentity(ident) {
        if (ident === null) 
            return;
        this.m_IdentOccurs.push(ident);
        for (const v of ident.values) {
            this.addSlot(PersonReferent.ATTR_IDENTITY, v, false, 0);
            let li = Utils.splitString(v, ' ', false);
            for (let i = 0; i < li.length; i++) {
                let a = PersonReferent.ATTR_UNDEFNAME;
                if (i === 0 && li.length > 1) 
                    a = PersonReferent.ATTR_FIRSTNAME;
                else if (i === (li.length - 1) && li.length > 1) 
                    a = PersonReferent.ATTR_LASTNAME;
                this.addSlot(a, li[i], false, 0);
            }
        }
        this.correctData();
    }
    
    static isInitial(str) {
        if (str === null) 
            return false;
        if (str.length === 1) 
            return true;
        if (str === "ДЖ") 
            return true;
        return false;
    }
    
    addAttribute(attr) {
        this.addSlot(PersonReferent.ATTR_ATTR, attr, false, 0);
    }
    
    canBeEquals(obj, typ) {
        let p = Utils.as(obj, PersonReferent);
        if (p === null) 
            return false;
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_IDENTITY) {
                for (const aa of p.slots) {
                    if (aa.typeName === a.typeName) {
                        if (PersonReferent._DelSurnameEnd(Utils.asString(a.value)) === PersonReferent._DelSurnameEnd(Utils.asString(aa.value))) 
                            return true;
                    }
                }
            }
        }
        let nick1 = this.getStringValue(PersonReferent.ATTR_NICKNAME);
        let nick2 = obj.getStringValue(PersonReferent.ATTR_NICKNAME);
        if (nick1 !== null && nick2 !== null) {
            if (nick1 !== nick2) 
                return false;
        }
        if (this.findSlot(PersonReferent.ATTR_LASTNAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_LASTNAME, null, true) !== null) {
            if (!this.compareSurnamesPers(p)) 
                return false;
            if (this.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null) {
                if (!this.checkNames(PersonReferent.ATTR_FIRSTNAME, p)) 
                    return false;
                if (this.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) !== null) {
                    if (!this.checkNames(PersonReferent.ATTR_MIDDLENAME, p)) 
                        return false;
                }
                else if (typ === ReferentsEqualType.DIFFERENTTEXTS) {
                    if (this.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) !== null || p.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) !== null) 
                        return this.toString() === p.toString();
                    let names1 = new Array();
                    let names2 = new Array();
                    for (const s of this.slots) {
                        if (s.typeName === PersonReferent.ATTR_FIRSTNAME) {
                            let nam = s.value.toString();
                            if (!PersonReferent.isInitial(nam)) 
                                names1.push(nam);
                        }
                    }
                    for (const s of p.slots) {
                        if (s.typeName === PersonReferent.ATTR_FIRSTNAME) {
                            let nam = s.value.toString();
                            if (!PersonReferent.isInitial(nam)) {
                                if (names1.includes(nam)) 
                                    return true;
                                names2.push(nam);
                            }
                        }
                    }
                    if (names1.length === 0 && names2.length === 0) 
                        return true;
                    return false;
                }
            }
            else if (typ === ReferentsEqualType.DIFFERENTTEXTS && ((this.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null || p.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null))) 
                return false;
            return true;
        }
        let tit1 = this._findShortestKingTitul(false);
        let tit2 = p._findShortestKingTitul(false);
        if (((tit1 !== null || tit2 !== null)) || ((nick1 !== null && nick1 === nick2))) {
            if (tit1 === null || tit2 === null) {
                if (nick1 !== null && nick1 === nick2) {
                }
                else if (nick1 !== null && this._checkNikEquSur(nick1, p.getStringValue(PersonReferent.ATTR_LASTNAME))) {
                }
                else if (nick2 !== null && this._checkNikEquSur(nick2, this.getStringValue(PersonReferent.ATTR_LASTNAME))) {
                }
                else 
                    return false;
            }
            else if (tit1 !== tit2) {
                if (!tit1.includes(tit2) && !tit2.includes(tit1)) 
                    return false;
            }
            if (this.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null) {
                if (!this.checkNames(PersonReferent.ATTR_FIRSTNAME, p)) 
                    return false;
                return true;
            }
        }
        if (this.findSlot(PersonReferent.ATTR_UNDEFNAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_UNDEFNAME, null, true) !== null) {
            let und1 = this._getAllIdents();
            let und2 = p._getAllIdents();
            if (und1.length <= und2.length) {
                for (const u of und1) {
                    if (!und2.includes(u)) {
                        if (u === und1[und1.length - 1] && PersonReferent._DelSurnameEnd(u) === PersonReferent._DelSurnameEnd(und2[und2.length - 1])) {
                        }
                        else 
                            return false;
                    }
                }
                return true;
            }
            else {
                for (const u of und2) {
                    if (!und1.includes(u)) {
                        if (u === und2[und2.length - 1] && PersonReferent._DelSurnameEnd(u) === PersonReferent._DelSurnameEnd(und1[und1.length - 1])) {
                        }
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    
    _checkNikEquSur(nik, sur) {
        if (nik === "I") 
            return sur === "ПЕРВЫЙ" || sur === "ПЕРВАЯ" || sur === "ПЕРШЕ";
        if (nik === "II") 
            return (sur === "ВТОРОЙ" || sur === "ВТОРАЯ" || sur === "ДРУГЕ") || sur === "ДРУГA";
        if (nik === "III") 
            return sur === "ТРЕТИЙ" || sur === "ТРЕТЬЯ" || sur === "ТРЕТИНА";
        return false;
    }
    
    _getAllIdents() {
        let res = this.getStringValues(PersonReferent.ATTR_UNDEFNAME);
        let s = this.getStringValue(PersonReferent.ATTR_FIRSTNAME);
        if (s !== null) 
            res.splice(0, 0, s);
        s = this.getStringValue(PersonReferent.ATTR_LASTNAME);
        if (s !== null) 
            res.push(s);
        return res;
    }
    
    canBeGeneralFor(obj) {
        if (!this.canBeEquals(obj, ReferentsEqualType.WITHINONETEXT)) 
            return false;
        let p = Utils.as(obj, PersonReferent);
        if (p === null) 
            return false;
        if (this.findSlot(PersonReferent.ATTR_LASTNAME, null, true) === null || p.findSlot(PersonReferent.ATTR_LASTNAME, null, true) === null) 
            return false;
        if (!this.compareSurnamesPers(p)) 
            return false;
        if (this.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) === null) {
            if (p.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) !== null) 
                return true;
            else 
                return false;
        }
        if (p.findSlot(PersonReferent.ATTR_FIRSTNAME, null, true) === null) 
            return false;
        if (!this.checkNames(PersonReferent.ATTR_FIRSTNAME, p)) 
            return false;
        if (this.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) !== null && p.findSlot(PersonReferent.ATTR_MIDDLENAME, null, true) === null) {
            if (!PersonReferent.isInitial(this.getStringValue(PersonReferent.ATTR_FIRSTNAME))) 
                return false;
        }
        let nameInits = 0;
        let nameFulls = 0;
        let secInits = 0;
        let secFulls = 0;
        let nameInits1 = 0;
        let nameFulls1 = 0;
        let secInits1 = 0;
        let secFulls1 = 0;
        for (const s of this.slots) {
            if (s.typeName === PersonReferent.ATTR_FIRSTNAME) {
                if (PersonReferent.isInitial(Utils.asString(s.value))) 
                    nameInits++;
                else 
                    nameFulls++;
            }
            else if (s.typeName === PersonReferent.ATTR_MIDDLENAME) {
                if (PersonReferent.isInitial(Utils.asString(s.value))) 
                    secInits++;
                else 
                    secFulls++;
            }
        }
        for (const s of p.slots) {
            if (s.typeName === PersonReferent.ATTR_FIRSTNAME) {
                if (PersonReferent.isInitial(Utils.asString(s.value))) 
                    nameInits1++;
                else 
                    nameFulls1++;
            }
            else if (s.typeName === PersonReferent.ATTR_MIDDLENAME) {
                if (PersonReferent.isInitial(Utils.asString(s.value))) 
                    secInits1++;
                else 
                    secFulls1++;
            }
        }
        if (secFulls > 0) 
            return false;
        if (nameInits === 0) {
            if (nameInits1 > 0) 
                return false;
        }
        else if (nameInits1 > 0) {
            if ((secInits + secFulls) > 0) 
                return false;
        }
        if (secInits === 0) {
            if ((secInits1 + secFulls1) === 0) {
                if (nameInits1 === 0 && nameInits > 0) 
                    return true;
                else 
                    return false;
            }
        }
        else if (secInits1 > 0) 
            return false;
        return true;
    }
    
    compareSurnamesPers(p) {
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_LASTNAME) {
                let s = a.value.toString();
                for (const aa of p.slots) {
                    if (aa.typeName === a.typeName) {
                        let ss = aa.value.toString();
                        if (this.compareSurnamesStrs(s, ss)) 
                            return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Сравнение с учётом возможных окончаний
    compareSurnamesStrs(s1, s2) {
        if (s1.startsWith(s2) || s2.startsWith(s1)) 
            return true;
        if (PersonReferent._DelSurnameEnd(s1) === PersonReferent._DelSurnameEnd(s2)) 
            return true;
        let n1 = MiscHelper.getAbsoluteNormalValue(s1, false);
        if (n1 !== null) {
            if (n1 === MiscHelper.getAbsoluteNormalValue(s2, false)) 
                return true;
        }
        if (MiscHelper.canBeEquals(s1, s2, true, true, false)) 
            return true;
        return false;
    }
    
    static _DelSurnameEnd(s) {
        if (s.length < 3) 
            return s;
        if (LanguageHelper.endsWithEx(s, "А", "У", "Е", null)) 
            return s.substring(0, 0 + s.length - 1);
        if (LanguageHelper.endsWith(s, "ОМ") || LanguageHelper.endsWith(s, "ЫМ")) 
            return s.substring(0, 0 + s.length - 2);
        if (LanguageHelper.endsWithEx(s, "Я", "Ю", null, null)) {
            let ch1 = s[s.length - 2];
            if (ch1 === 'Н' || ch1 === 'Л') 
                return s.substring(0, 0 + s.length - 1) + "Ь";
        }
        return s;
    }
    
    checkNames(attrName, p) {
        let names1 = new Array();
        let inits1 = new Array();
        let normn1 = new Array();
        for (const s of this.slots) {
            if (s.typeName === attrName) {
                let n = s.value.toString();
                if (PersonReferent.isInitial(n)) 
                    inits1.push(n);
                else {
                    names1.push(n);
                    let sn = MiscHelper.getAbsoluteNormalValue(n, false);
                    if (sn !== null) 
                        normn1.push(sn);
                }
            }
        }
        let names2 = new Array();
        let inits2 = new Array();
        let normn2 = new Array();
        for (const s of p.slots) {
            if (s.typeName === attrName) {
                let n = s.value.toString();
                if (PersonReferent.isInitial(n)) 
                    inits2.push(n);
                else {
                    names2.push(n);
                    let sn = MiscHelper.getAbsoluteNormalValue(n, false);
                    if (sn !== null) 
                        normn2.push(sn);
                }
            }
        }
        if (names1.length > 0 && names2.length > 0) {
            for (const n of names1) {
                if (names2.includes(n)) 
                    return true;
            }
            for (const n of normn1) {
                if (normn2.includes(n)) 
                    return true;
            }
            return false;
        }
        if (inits1.length > 0) {
            for (const n of inits1) {
                if (inits2.includes(n)) 
                    return true;
                for (const nn of names2) {
                    if (nn.startsWith(n)) 
                        return true;
                }
            }
        }
        if (inits2.length > 0) {
            for (const n of inits2) {
                if (inits1.includes(n)) 
                    return true;
                for (const nn of names1) {
                    if (nn.startsWith(n)) 
                        return true;
                }
            }
        }
        return false;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        super.mergeSlots(obj, mergeStatistic);
        let p = Utils.as(obj, PersonReferent);
        this.m_SurnameOccurs.splice(this.m_SurnameOccurs.length, 0, ...p.m_SurnameOccurs);
        this.m_NameOccurs.splice(this.m_NameOccurs.length, 0, ...p.m_NameOccurs);
        this.m_SecOccurs.splice(this.m_SecOccurs.length, 0, ...p.m_SecOccurs);
        this.m_IdentOccurs.splice(this.m_IdentOccurs.length, 0, ...p.m_IdentOccurs);
        if (p.m_PersonIdentityTyp !== FioTemplateType.UNDEFINED) 
            this.m_PersonIdentityTyp = p.m_PersonIdentityTyp;
        this.correctData();
    }
    
    correctData() {
        const PersonMorphCollection = require("./internal/PersonMorphCollection");
        let g = MorphGender.UNDEFINED;
        while (true) {
            let ch = false;
            if (PersonMorphCollection.intersect(this.m_SurnameOccurs)) 
                ch = true;
            if (PersonMorphCollection.intersect(this.m_NameOccurs)) 
                ch = true;
            if (PersonMorphCollection.intersect(this.m_SecOccurs)) 
                ch = true;
            if (PersonMorphCollection.intersect(this.m_IdentOccurs)) 
                ch = true;
            if (!ch) 
                break;
            if (g === MorphGender.UNDEFINED && this.m_SurnameOccurs.length > 0 && this.m_SurnameOccurs[0].gender !== MorphGender.UNDEFINED) 
                g = this.m_SurnameOccurs[0].gender;
            if (g === MorphGender.UNDEFINED && this.m_NameOccurs.length > 0 && this.m_NameOccurs[0].gender !== MorphGender.UNDEFINED) 
                g = this.m_NameOccurs[0].gender;
            if (g === MorphGender.UNDEFINED && this.m_IdentOccurs.length > 0 && this.m_IdentOccurs[0].gender !== MorphGender.UNDEFINED) 
                g = this.m_IdentOccurs[0].gender;
            if (g !== MorphGender.UNDEFINED) {
                PersonMorphCollection.setGender(this.m_SurnameOccurs, g);
                PersonMorphCollection.setGender(this.m_NameOccurs, g);
                PersonMorphCollection.setGender(this.m_SecOccurs, g);
                PersonMorphCollection.setGender(this.m_IdentOccurs, g);
            }
        }
        if (g !== MorphGender.UNDEFINED) {
            if (!this.isFemale && !this.isMale) {
                if (g === MorphGender.MASCULINE) 
                    this.isMale = true;
                else 
                    this.isFemale = true;
            }
        }
        this.correctSurnames();
        this.correctIdentifiers();
        this.correctAttrs();
        this.removeSlots(PersonReferent.ATTR_LASTNAME, this.m_SurnameOccurs);
        this.removeSlots(PersonReferent.ATTR_FIRSTNAME, this.m_NameOccurs);
        this.removeSlots(PersonReferent.ATTR_MIDDLENAME, this.m_SecOccurs);
        this.removeSlots(PersonReferent.ATTR_IDENTITY, this.m_IdentOccurs);
        this.removeInitials(PersonReferent.ATTR_FIRSTNAME);
        this.removeInitials(PersonReferent.ATTR_MIDDLENAME);
    }
    
    correctSurnames() {
        let def = this.isMale || this.isFemale;
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].typeName === PersonReferent.ATTR_LASTNAME && def) {
                let s = this.slots[i].value.toString();
                for (let j = i + 1; j < this.slots.length; j++) {
                    if (this.slots[j].typeName === PersonReferent.ATTR_LASTNAME) {
                        let s1 = this.slots[j].value.toString();
                        if (s !== s1 && PersonReferent._DelSurnameEnd(s) === PersonReferent._DelSurnameEnd(s1) && s1.length !== s.length) {
                            if (this.isMale) {
                                this.uploadSlot(this.slots[i], (s = PersonReferent._DelSurnameEnd(s)));
                                this.slots.splice(j, 1);
                                j--;
                            }
                            else if (this.isFemale && (s1.length < s.length)) {
                                this.slots.splice(j, 1);
                                j--;
                            }
                            else {
                                this.slots.splice(i, 1);
                                i--;
                                break;
                            }
                        }
                    }
                }
            }
            else if (this.slots[i].typeName === PersonReferent.ATTR_UNDEFNAME) {
                if (this.findSlot(PersonReferent.ATTR_FIRSTNAME, this.slots[i].value, true) !== null || this.findSlot(PersonReferent.ATTR_LASTNAME, this.slots[i].value, true) !== null) {
                    this.slots.splice(i, 1);
                    i--;
                }
            }
        }
        let nik = this.getStringValue(PersonReferent.ATTR_NICKNAME);
        if (nik !== null) {
            for (let i = this.slots.length - 1; i >= 0; i--) {
                if (this.slots[i].typeName === PersonReferent.ATTR_LASTNAME) {
                    if (this._checkNikEquSur(nik, Utils.asString(this.slots[i].value))) 
                        this.slots.splice(i, 1);
                }
            }
        }
    }
    
    correctIdentifiers() {
        if (this.isFemale) 
            return;
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].typeName === PersonReferent.ATTR_IDENTITY) {
                let s = this.slots[i].value.toString();
                for (let j = i + 1; j < this.slots.length; j++) {
                    if (this.slots[j].typeName === PersonReferent.ATTR_IDENTITY) {
                        let s1 = this.slots[j].value.toString();
                        if (s !== s1 && PersonReferent._DelSurnameEnd(s) === PersonReferent._DelSurnameEnd(s1)) {
                            this.uploadSlot(this.slots[i], (s = PersonReferent._DelSurnameEnd(s)));
                            this.slots.splice(j, 1);
                            j--;
                            this.isMale = true;
                        }
                    }
                }
            }
        }
    }
    
    removeSlots(attrName, cols) {
        let vars = new Array();
        for (const col of cols) {
            for (const v of col.values) {
                if (!vars.includes(v)) 
                    vars.push(v);
            }
        }
        if (vars.length < 1) 
            return;
        for (let i = this.slots.length - 1; i >= 0; i--) {
            if (this.slots[i].typeName === attrName) {
                let v = this.slots[i].value.toString();
                if (vars.includes(v)) 
                    continue;
                if (v.indexOf('-') > 0) {
                    if (vars.includes(Utils.replaceString(v, "-", ""))) 
                        continue;
                }
                for (let j = 0; j < this.slots.length; j++) {
                    if (j !== i && this.slots[j].typeName === this.slots[i].typeName) {
                        if (attrName === PersonReferent.ATTR_LASTNAME) {
                            let ee = false;
                            for (const vv of vars) {
                                if (this.compareSurnamesStrs(v, vv)) 
                                    ee = true;
                            }
                            if (!ee) 
                                continue;
                        }
                        this.slots.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    
    removeInitials(attrName) {
        for (const s of this.slots) {
            if (s.typeName === attrName) {
                if (PersonReferent.isInitial(s.value.toString())) {
                    for (const ss of this.slots) {
                        if (ss.typeName === s.typeName && s !== ss) {
                            let v = ss.value.toString();
                            if (!PersonReferent.isInitial(v) && v.startsWith(s.value.toString())) {
                                if (attrName === PersonReferent.ATTR_FIRSTNAME && v.length === 2 && this.findSlot(PersonReferent.ATTR_MIDDLENAME, v.substring(1), true) !== null) 
                                    Utils.removeItem(this.slots, ss);
                                else 
                                    Utils.removeItem(this.slots, s);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    
    correctAttrs() {
        let attrs = new Array();
        for (const s of this.slots) {
            if (s.typeName === PersonReferent.ATTR_ATTR && (s.value instanceof PersonPropertyReferent)) 
                attrs.push(Utils.as(s.value, PersonPropertyReferent));
        }
        if (attrs.length < 2) 
            return;
        for (const a of attrs) {
            a.tag = null;
        }
        for (let i = 0; i < (attrs.length - 1); i++) {
            for (let j = i + 1; j < attrs.length; j++) {
                if (attrs[i].generalReferent === attrs[j] || attrs[j].canBeGeneralFor(attrs[i])) 
                    attrs[j].tag = attrs[i];
                else if (attrs[j].generalReferent === attrs[i] || attrs[i].canBeGeneralFor(attrs[j])) 
                    attrs[i].tag = attrs[j];
            }
        }
        for (let i = this.slots.length - 1; i >= 0; i--) {
            if (this.slots[i].typeName === PersonReferent.ATTR_ATTR && (this.slots[i].value instanceof PersonPropertyReferent)) {
                if (this.slots[i].value.tag !== null) {
                    let pr = Utils.as(this.slots[i].value.tag, PersonPropertyReferent);
                    if (pr !== null && pr.generalReferent === null) 
                        pr.generalReferent = Utils.as(this.slots[i].value, PersonPropertyReferent);
                    this.slots.splice(i, 1);
                }
            }
        }
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        let tit = this._findShortestKingTitul(false);
        for (const a of this.slots) {
            if (a.typeName === PersonReferent.ATTR_IDENTITY) 
                oi.termins.push(Termin._new1210(a.value.toString(), true));
            else if (a.typeName === PersonReferent.ATTR_FIRSTNAME && tit !== null) {
                let t = new Termin((tit + " " + a.value.toString()));
                if (this.isMale) 
                    t.gender = MorphGender.MASCULINE;
                else if (this.isFemale) 
                    t.gender = MorphGender.FEMINIE;
                oi.termins.push(t);
            }
            else if (a.typeName === PersonReferent.ATTR_LASTNAME || a.typeName === PersonReferent.ATTR_FIRSTNAME || a.typeName === PersonReferent.ATTR_UNDEFNAME) {
                if (a.typeName === PersonReferent.ATTR_FIRSTNAME && this.findSlot(PersonReferent.ATTR_IDENTITY, null, true) === null) 
                    continue;
                let t = new Termin(a.value.toString());
                if (t.terms.length > 20) {
                }
                if (this.isMale) 
                    t.gender = MorphGender.MASCULINE;
                else if (this.isFemale) 
                    t.gender = MorphGender.FEMINIE;
                oi.termins.push(t);
            }
        }
        return oi;
    }
    
    static static_constructor() {
        PersonReferent.OBJ_TYPENAME = "PERSON";
        PersonReferent.ATTR_SEX = "SEX";
        PersonReferent.ATTR_IDENTITY = "IDENTITY";
        PersonReferent.ATTR_FIRSTNAME = "FIRSTNAME";
        PersonReferent.ATTR_MIDDLENAME = "MIDDLENAME";
        PersonReferent.ATTR_LASTNAME = "LASTNAME";
        PersonReferent.ATTR_NICKNAME = "NICKNAME";
        PersonReferent.ATTR_UNDEFNAME = "UNDEFNAME";
        PersonReferent.ATTR_NAMETYPE = "NAMETYPE";
        PersonReferent.ATTR_ATTR = "ATTRIBUTE";
        PersonReferent.ATTR_AGE = "AGE";
        PersonReferent.ATTR_BORN = "BORN";
        PersonReferent.ATTR_DIE = "DIE";
        PersonReferent.ATTR_CONTACT = "CONTACT";
        PersonReferent.ATTR_IDDOC = "IDDOC";
        PersonReferent.SHOW_LASTNAME_ON_FIRST_POSITION = false;
    }
}


PersonReferent.static_constructor();

module.exports = PersonReferent