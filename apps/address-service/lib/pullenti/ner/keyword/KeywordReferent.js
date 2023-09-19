/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Termin = require("./../core/Termin");
const IntOntologyItem = require("./../core/IntOntologyItem");
const KeywordType = require("./KeywordType");
const ReferentClass = require("./../metadata/ReferentClass");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const KeywordMeta = require("./internal/KeywordMeta");

/**
 * Ключевая комбинация
 * 
 */
class KeywordReferent extends Referent {
    
    constructor() {
        super(KeywordReferent.OBJ_TYPENAME);
        this.rank = 0;
        this.instanceOf = KeywordMeta.GLOBAL_META;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        if (lev > 10) 
            return "?";
        let _rank = this.rank;
        let val = this.getStringValue(KeywordReferent.ATTR_VALUE);
        if (val === null) {
            let r = Utils.as(this.getSlotValue(KeywordReferent.ATTR_REF), Referent);
            if (r !== null) 
                val = r.toStringEx(true, lang, lev + 1);
            else 
                val = this.getStringValue(KeywordReferent.ATTR_NORMAL);
        }
        if (shortVariant) 
            return (val != null ? val : "?");
        let norm = this.getStringValue(KeywordReferent.ATTR_NORMAL);
        if (norm === null) 
            return (val != null ? val : "?");
        else 
            return (((val != null ? val : "?")) + " [" + norm + "]");
    }
    
    get typ() {
        let str = this.getStringValue(KeywordReferent.ATTR_TYPE);
        if (str === null) 
            return KeywordType.UNDEFINED;
        try {
            return KeywordType.of(str);
        } catch (ex) {
            return KeywordType.UNDEFINED;
        }
    }
    set typ(_value) {
        this.addSlot(KeywordReferent.ATTR_TYPE, _value.toString(), true, 0);
        return _value;
    }
    
    get value() {
        return this.getStringValue(KeywordReferent.ATTR_VALUE);
    }
    set value(_value) {
        this.addSlot(KeywordReferent.ATTR_VALUE, _value, false, 0);
        return _value;
    }
    
    get normalValue() {
        return this.getStringValue(KeywordReferent.ATTR_NORMAL);
    }
    set normalValue(_value) {
        this.addSlot(KeywordReferent.ATTR_NORMAL, _value, false, 0);
        return _value;
    }
    
    get childWords() {
        return this._getChildWords(this, 0);
    }
    
    _getChildWords(root, lev) {
        if (lev > 5) 
            return 0;
        let res = 0;
        for (const s of this.slots) {
            if (s.typeName === KeywordReferent.ATTR_REF && (s.value instanceof KeywordReferent)) {
                if (s.value === root) 
                    return 0;
                res += s.value._getChildWords(root, lev + 1);
            }
        }
        if (res === 0) 
            res = 1;
        return res;
    }
    
    canBeEquals(obj, _typ = ReferentsEqualType.WITHINONETEXT) {
        let kw = Utils.as(obj, KeywordReferent);
        if (kw === null) 
            return false;
        let ki = this.typ;
        if (ki !== kw.typ) 
            return false;
        if (ki === KeywordType.REFERENT) {
            let re = Utils.as(this.getSlotValue(KeywordReferent.ATTR_REF), Referent);
            if (re === null) 
                return false;
            let re2 = Utils.as(kw.getSlotValue(KeywordReferent.ATTR_REF), Referent);
            if (re2 === null) 
                return false;
            if (re.canBeEquals(re2, _typ)) 
                return true;
        }
        for (const s of this.slots) {
            if (s.typeName === KeywordReferent.ATTR_NORMAL || s.typeName === KeywordReferent.ATTR_VALUE) {
                if (kw.findSlot(KeywordReferent.ATTR_NORMAL, s.value, true) !== null) 
                    return true;
                if (kw.findSlot(KeywordReferent.ATTR_VALUE, s.value, true) !== null) 
                    return true;
            }
        }
        return false;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        let r1 = this.rank + obj.rank;
        super.mergeSlots(obj, mergeStatistic);
        if (this.slots.length > 50) {
        }
        this.rank = r1;
    }
    
    union(kw1, kw2, word2) {
        this.typ = kw1.typ;
        let tmp = new Array();
        let tmp2 = new StringBuilder();
        for (const v of kw1.getStringValues(KeywordReferent.ATTR_VALUE)) {
            this.addSlot(KeywordReferent.ATTR_VALUE, (v + " " + word2), false, 0);
        }
        let norms1 = kw1.getStringValues(KeywordReferent.ATTR_NORMAL);
        if (norms1.length === 0 && kw1.childWords === 1) 
            norms1 = kw1.getStringValues(KeywordReferent.ATTR_VALUE);
        let norms2 = kw2.getStringValues(KeywordReferent.ATTR_NORMAL);
        if (norms2.length === 0 && kw2.childWords === 1) 
            norms2 = kw2.getStringValues(KeywordReferent.ATTR_VALUE);
        for (const n1 of norms1) {
            for (const n2 of norms2) {
                tmp.splice(0, tmp.length);
                tmp.splice(tmp.length, 0, ...Utils.splitString(n1, ' ', false));
                for (const n of Utils.splitString(n2, ' ', false)) {
                    if (!tmp.includes(n)) 
                        tmp.push(n);
                }
                tmp.sort();
                tmp2.length = 0;
                for (let i = 0; i < tmp.length; i++) {
                    if (i > 0) 
                        tmp2.append(' ');
                    tmp2.append(tmp[i]);
                }
                this.addSlot(KeywordReferent.ATTR_NORMAL, tmp2.toString(), false, 0);
            }
        }
        this.addSlot(KeywordReferent.ATTR_REF, kw1, false, 0);
        this.addSlot(KeywordReferent.ATTR_REF, kw2, false, 0);
    }
    
    createOntologyItem() {
        let res = new IntOntologyItem(this);
        for (const s of this.slots) {
            if (s.typeName === KeywordReferent.ATTR_NORMAL || s.typeName === KeywordReferent.ATTR_VALUE) 
                res.termins.push(new Termin(String(s.value)));
        }
        return res;
    }
    
    static _new1578(_arg1) {
        let res = new KeywordReferent();
        res.typ = _arg1;
        return res;
    }
    
    static static_constructor() {
        KeywordReferent.OBJ_TYPENAME = "KEYWORD";
        KeywordReferent.ATTR_TYPE = "TYPE";
        KeywordReferent.ATTR_VALUE = "VALUE";
        KeywordReferent.ATTR_NORMAL = "NORMAL";
        KeywordReferent.ATTR_REF = "REF";
    }
}


KeywordReferent.static_constructor();

module.exports = KeywordReferent