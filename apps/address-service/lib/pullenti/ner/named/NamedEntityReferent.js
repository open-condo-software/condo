/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphLang = require("./../../morph/MorphLang");
const NamedEntityKind = require("./NamedEntityKind");
const Termin = require("./../core/Termin");
const IntOntologyItem = require("./../core/IntOntologyItem");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaNamedEntity = require("./internal/MetaNamedEntity");
const Referent = require("./../Referent");
const MiscHelper = require("./../core/MiscHelper");

/**
 * Сущность "тип" + "имя" (планеты, памятники, здания, местоположения, планеты и пр.)
 * 
 */
class NamedEntityReferent extends Referent {
    
    constructor() {
        super(NamedEntityReferent.OBJ_TYPENAME);
        this.instanceOf = MetaNamedEntity.GLOBAL_META;
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        let typ = this.getStringValue(NamedEntityReferent.ATTR_TYPE);
        if (typ !== null) 
            res.append(typ);
        let name = this.getStringValue(NamedEntityReferent.ATTR_NAME);
        if (name !== null) {
            if (res.length > 0) 
                res.append(' ');
            res.append(MiscHelper.convertFirstCharUpperAndOtherLower(name));
        }
        let re = Utils.as(this.getSlotValue(NamedEntityReferent.ATTR_REF), Referent);
        if (re !== null) {
            if (res.length > 0) 
                res.append("; ");
            res.append(re.toStringEx(shortVariant, lang, lev + 1));
        }
        return res.toString();
    }
    
    get kind() {
        let str = this.getStringValue(NamedEntityReferent.ATTR_KIND);
        if (str === null) 
            return NamedEntityKind.UNDEFINED;
        try {
            return NamedEntityKind.of(str);
        } catch (ex1770) {
        }
        return NamedEntityKind.UNDEFINED;
    }
    set kind(value) {
        this.addSlot(NamedEntityReferent.ATTR_KIND, value.toString().toLowerCase(), true, 0);
        return value;
    }
    
    toSortString() {
        return this.kind.toString() + this.toStringEx(true, MorphLang.UNKNOWN, 0);
    }
    
    getCompareStrings() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === NamedEntityReferent.ATTR_NAME) {
                let str = s.value.toString();
                if (!res.includes(str)) 
                    res.push(str);
                if (str.indexOf(' ') > 0 || str.indexOf('-') > 0) {
                    str = Utils.replaceString(Utils.replaceString(str, " ", ""), "-", "");
                    if (!res.includes(str)) 
                        res.push(str);
                }
            }
        }
        if (res.length === 0) {
            for (const s of this.slots) {
                if (s.typeName === NamedEntityReferent.ATTR_TYPE) {
                    let t = s.value.toString();
                    if (!res.includes(t)) 
                        res.push(t);
                }
            }
        }
        if (res.length > 0) 
            return res;
        else 
            return super.getCompareStrings();
    }
    
    canBeEquals(obj, typ) {
        let ent = Utils.as(obj, NamedEntityReferent);
        if (ent === null) 
            return false;
        if (ent.kind !== this.kind) 
            return false;
        let names = this.getStringValues(NamedEntityReferent.ATTR_NAME);
        let names2 = obj.getStringValues(NamedEntityReferent.ATTR_NAME);
        let eqNames = false;
        if ((names !== null && names.length > 0 && names2 !== null) && names2.length > 0) {
            for (const n of names) {
                if (names2.includes(n)) 
                    eqNames = true;
            }
            if (!eqNames) 
                return false;
        }
        let typs = this.getStringValues(NamedEntityReferent.ATTR_TYPE);
        let typs2 = obj.getStringValues(NamedEntityReferent.ATTR_TYPE);
        let eqTyps = false;
        if ((typs !== null && typs.length > 0 && typs2 !== null) && typs2.length > 0) {
            for (const ty of typs) {
                if (typs2.includes(ty)) 
                    eqTyps = true;
            }
            if (!eqTyps) 
                return false;
        }
        if (!eqTyps && !eqNames) 
            return false;
        let re1 = Utils.as(this.getSlotValue(NamedEntityReferent.ATTR_REF), Referent);
        let re2 = Utils.as(obj.getSlotValue(NamedEntityReferent.ATTR_REF), Referent);
        if (re1 !== null && re2 !== null) {
            if (!re1.canBeEquals(re2, typ)) 
                return false;
        }
        else if (re1 !== null || re2 !== null) {
        }
        return true;
    }
    
    createOntologyItem() {
        return this._CreateOntologyItem(2, false, false);
    }
    
    _CreateOntologyItem(minLen, onlyNames = false, pureNames = false) {
        let oi = new IntOntologyItem(this);
        let vars = new Array();
        let typs = Utils.notNull(this.getStringValues(NamedEntityReferent.ATTR_TYPE), new Array());
        for (const a of this.slots) {
            if (a.typeName === NamedEntityReferent.ATTR_NAME) {
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
        if (!onlyNames) {
            if (vars.length === 0) {
                for (const t of typs) {
                    let up = t.toUpperCase();
                    if (!vars.includes(up)) 
                        vars.push(up);
                }
            }
        }
        let max = 20;
        let cou = 0;
        for (const v of vars) {
            if (v.length >= minLen) {
                oi.termins.push(new Termin(v));
                if ((++cou) >= max) 
                    break;
            }
        }
        if (oi.termins.length === 0) 
            return null;
        return oi;
    }
    
    static _new1769(_arg1) {
        let res = new NamedEntityReferent();
        res.kind = _arg1;
        return res;
    }
    
    static static_constructor() {
        NamedEntityReferent.OBJ_TYPENAME = "NAMEDENTITY";
        NamedEntityReferent.ATTR_NAME = "NAME";
        NamedEntityReferent.ATTR_KIND = "KIND";
        NamedEntityReferent.ATTR_TYPE = "TYPE";
        NamedEntityReferent.ATTR_REF = "REF";
        NamedEntityReferent.ATTR_MISC = "MISC";
    }
}


NamedEntityReferent.static_constructor();

module.exports = NamedEntityReferent