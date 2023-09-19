/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const LanguageHelper = require("./../../morph/LanguageHelper");
const Termin = require("./../core/Termin");
const IntOntologyItem = require("./../core/IntOntologyItem");
const GeoReferent = require("./../geo/GeoReferent");
const ReferentClass = require("./../metadata/ReferentClass");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const MetaPersonProperty = require("./internal/MetaPersonProperty");

/**
 * Сущность - свойство персоны (должность, звание...)
 * 
 */
class PersonPropertyReferent extends Referent {
    
    constructor() {
        super(PersonPropertyReferent.OBJ_TYPENAME);
        this.instanceOf = MetaPersonProperty.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        if (this.name !== null) 
            res.append(this.name);
        for (const r of this.slots) {
            if (r.typeName === PersonPropertyReferent.ATTR_ATTR && r.value !== null) 
                res.append(", ").append(r.value.toString());
        }
        for (const r of this.slots) {
            if (r.typeName === PersonPropertyReferent.ATTR_REF && (r.value instanceof Referent) && (lev < 10)) 
                res.append("; ").append(r.value.toStringEx(shortVariant, lang, lev + 1));
        }
        let hi = this.higher;
        if (hi !== null && hi !== this && this.checkCorrectHigher(hi, 0)) 
            res.append("; ").append(hi.toStringEx(shortVariant, lang, lev + 1));
        return res.toString();
    }
    
    getCompareStrings() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === PersonPropertyReferent.ATTR_NAME) 
                res.push(s.value.toString());
        }
        if (res.length > 0) 
            return res;
        else 
            return super.getCompareStrings();
    }
    
    get name() {
        return this.getStringValue(PersonPropertyReferent.ATTR_NAME);
    }
    set name(value) {
        this.addSlot(PersonPropertyReferent.ATTR_NAME, value, true, 0);
        return value;
    }
    
    get higher() {
        return this._getHigher(0);
    }
    set higher(value) {
        if (this.checkCorrectHigher(value, 0)) 
            this.addSlot(PersonPropertyReferent.ATTR_HIGHER, value, true, 0);
        return value;
    }
    
    _getHigher(lev) {
        let hi = Utils.as(this.getSlotValue(PersonPropertyReferent.ATTR_HIGHER), PersonPropertyReferent);
        if (hi === null) 
            return null;
        if (!this.checkCorrectHigher(hi, lev + 1)) 
            return null;
        return hi;
    }
    
    checkCorrectHigher(hi, lev) {
        if (hi === null) 
            return true;
        if (hi === this) 
            return false;
        if (lev > 20) 
            return false;
        let hii = hi._getHigher(lev + 1);
        if (hii === null) 
            return true;
        if (hii === this) 
            return false;
        let li = new Array();
        li.push(this);
        for (let pr = hi; pr !== null; pr = pr._getHigher(lev + 1)) {
            if (li.includes(pr)) 
                return false;
            else 
                li.push(pr);
        }
        return true;
    }
    
    get parentReferent() {
        return this.higher;
    }
    
    canBeEquals(obj, typ) {
        let pr = Utils.as(obj, PersonPropertyReferent);
        if (pr === null) 
            return false;
        let n1 = this.name;
        let n2 = pr.name;
        if (n1 === null || n2 === null) 
            return false;
        if (n1 === "премьер-министр") 
            n1 = "премьер";
        if (n2 === "премьер-министр") 
            n2 = "премьер";
        let eqBosses = false;
        let eqStart = false;
        if (n1 !== n2) {
            if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                return false;
            if (PersonPropertyReferent.m_Bosses0.includes(n1) && PersonPropertyReferent.m_Bosses1.includes(n2)) 
                eqBosses = true;
            else if (PersonPropertyReferent.m_Bosses1.includes(n1) && PersonPropertyReferent.m_Bosses0.includes(n2)) 
                eqBosses = true;
            else {
                if (!n1.startsWith(n2 + " ") && !n2.startsWith(n1 + " ")) 
                    return false;
                eqStart = true;
            }
            for (let hi = this.higher; hi !== null; hi = hi.higher) {
                if ((++PersonPropertyReferent._tmpStack) > 20) {
                }
                else if (hi.canBeEquals(pr, typ)) {
                    PersonPropertyReferent._tmpStack--;
                    return false;
                }
                PersonPropertyReferent._tmpStack--;
            }
            for (let hi = pr.higher; hi !== null; hi = hi.higher) {
                if ((++PersonPropertyReferent._tmpStack) > 20) {
                }
                else if (hi.canBeEquals(this, typ)) {
                    PersonPropertyReferent._tmpStack--;
                    return false;
                }
                PersonPropertyReferent._tmpStack--;
            }
        }
        if (this.higher !== null && pr.higher !== null) {
            if ((++PersonPropertyReferent._tmpStack) > 20) {
            }
            else if (!this.higher.canBeEquals(pr.higher, typ)) {
                PersonPropertyReferent._tmpStack--;
                return false;
            }
            PersonPropertyReferent._tmpStack--;
        }
        if (this.findSlot("@GENERAL", null, true) !== null || pr.findSlot("@GENERAL", null, true) !== null) 
            return this.toString() === pr.toString();
        if (this.findSlot(PersonPropertyReferent.ATTR_REF, null, true) !== null || pr.findSlot(PersonPropertyReferent.ATTR_REF, null, true) !== null) {
            let refs1 = new Array();
            let refs2 = new Array();
            for (const s of this.slots) {
                if (s.typeName === PersonPropertyReferent.ATTR_REF) 
                    refs1.push(s.value);
            }
            for (const s of pr.slots) {
                if (s.typeName === PersonPropertyReferent.ATTR_REF) 
                    refs2.push(s.value);
            }
            let eq = false;
            let noeq = false;
            for (let i = 0; i < refs1.length; i++) {
                if (refs2.includes(refs1[i])) {
                    eq = true;
                    continue;
                }
                noeq = true;
                if (refs1[i] instanceof Referent) {
                    for (const rr of refs2) {
                        if (rr instanceof Referent) {
                            if (rr.canBeEquals(Utils.as(refs1[i], Referent), typ)) {
                                noeq = false;
                                eq = true;
                                break;
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < refs2.length; i++) {
                if (refs1.includes(refs2[i])) {
                    eq = true;
                    continue;
                }
                noeq = true;
                if (refs2[i] instanceof Referent) {
                    for (const rr of refs1) {
                        if (rr instanceof Referent) {
                            if (rr.canBeEquals(Utils.as(refs2[i], Referent), typ)) {
                                noeq = false;
                                eq = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (eq && !noeq) {
            }
            else if (noeq && ((eq || refs1.length === 0 || refs2.length === 0))) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS || n1 !== n2) 
                    return false;
                if (this.higher !== null || pr.higher !== null) 
                    return false;
                return false;
            }
            else 
                return false;
        }
        else if (!eqBosses && n1 !== n2) {
            if (eqStart) {
                if (this.higher !== null && this.higher.canBeEquals(pr.higher, typ)) 
                    return true;
            }
            return false;
        }
        return true;
    }
    
    canBeGeneralFor(obj) {
        let pr = Utils.as(obj, PersonPropertyReferent);
        if (pr === null) 
            return false;
        let n1 = this.name;
        let n2 = pr.name;
        if (n1 === null || n2 === null) 
            return false;
        let refs = 0;
        for (const s of this.slots) {
            if (s.typeName === PersonPropertyReferent.ATTR_REF) {
                if (pr.findSlot(PersonPropertyReferent.ATTR_REF, s.value, true) === null) 
                    return false;
                refs++;
            }
        }
        let prRefs = 0;
        for (const s of pr.slots) {
            if (s.typeName === PersonPropertyReferent.ATTR_REF) 
                prRefs++;
        }
        if (this.higher !== null) {
            if (pr.higher === null) 
                return false;
        }
        if (n1 === n2) {
            if (refs === prRefs) {
                if (this.higher !== null) 
                    return this.higher.canBeGeneralFor(pr.higher);
                return false;
            }
            if (this.higher !== null) {
                if (!pr.higher.canBeEquals(this.higher, ReferentsEqualType.WITHINONETEXT)) 
                    return false;
            }
            return true;
        }
        if (n2.startsWith(n1)) {
            if (n2.startsWith(n1 + " ")) {
                if (this.higher !== null) {
                    if (!pr.higher.canBeEquals(this.higher, ReferentsEqualType.WITHINONETEXT)) 
                        return false;
                }
                if (refs === prRefs) 
                    return true;
            }
        }
        return false;
    }
    
    get kind() {
        const PersonAttrToken = require("./internal/PersonAttrToken");
        return PersonAttrToken.checkKind(this);
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        for (const a of this.slots) {
            if (a.typeName === PersonPropertyReferent.ATTR_NAME) 
                oi.termins.push(new Termin(a.value.toString()));
        }
        return oi;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        let nam = this.name;
        let nam1 = obj.name;
        super.mergeSlots(obj, mergeStatistic);
        if (nam !== nam1 && nam1 !== null && nam !== null) {
            let s = null;
            if (nam.startsWith(nam1)) 
                s = this.findSlot(PersonPropertyReferent.ATTR_NAME, nam1, true);
            else if (nam1.startsWith(nam)) 
                s = this.findSlot(PersonPropertyReferent.ATTR_NAME, nam, true);
            else if (PersonPropertyReferent.m_Bosses0.includes(nam) && PersonPropertyReferent.m_Bosses1.includes(nam1)) 
                s = this.findSlot(PersonPropertyReferent.ATTR_NAME, nam, true);
            else if (PersonPropertyReferent.m_Bosses0.includes(nam1) && PersonPropertyReferent.m_Bosses1.includes(nam)) 
                s = this.findSlot(PersonPropertyReferent.ATTR_NAME, nam1, true);
            if (s !== null) 
                Utils.removeItem(this.slots, s);
        }
    }
    
    // Проверка, что этот референт может выступать в качестве ATTR_REF
    canHasRef(r) {
        let nam = this.name;
        if (nam === null || r === null) 
            return false;
        if (r instanceof GeoReferent) {
            let g = Utils.as(r, GeoReferent);
            if (LanguageHelper.endsWithEx(nam, "президент", "губернатор", null, null)) 
                return g.isState || g.isRegion;
            if (nam === "мэр" || nam === "градоначальник") 
                return g.isCity;
            if (nam === "глава") 
                return true;
            return false;
        }
        if (r.typeName === "ORGANIZATION") {
            if ((LanguageHelper.endsWith(nam, "губернатор") || nam === "мэр" || nam === "градоначальник") || nam === "президент") 
                return false;
            if (nam.includes("министр")) {
                if (r.findSlot(null, "министерство", true) === null) 
                    return false;
            }
            if (nam.endsWith("директор")) {
                if ((r.findSlot(null, "суд", true)) !== null) 
                    return false;
            }
            return true;
        }
        return false;
    }
    
    static _new2481(_arg1) {
        let res = new PersonPropertyReferent();
        res.name = _arg1;
        return res;
    }
    
    static static_constructor() {
        PersonPropertyReferent.OBJ_TYPENAME = "PERSONPROPERTY";
        PersonPropertyReferent.ATTR_NAME = "NAME";
        PersonPropertyReferent.ATTR_ATTR = "ATTR";
        PersonPropertyReferent.ATTR_REF = "REF";
        PersonPropertyReferent.ATTR_HIGHER = "HIGHER";
        PersonPropertyReferent.m_Bosses0 = Array.from(["глава", "руководитель"]);
        PersonPropertyReferent.m_Bosses1 = Array.from(["президент", "генеральный директор", "директор", "председатель"]);
        PersonPropertyReferent._tmpStack = 0;
    }
}


PersonPropertyReferent.static_constructor();

module.exports = PersonPropertyReferent