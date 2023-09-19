/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphClass = require("./../../../morph/MorphClass");
const MorphGender = require("./../../../morph/MorphGender");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphologyService = require("./../../../morph/MorphologyService");
const MiscHelper = require("./../../core/MiscHelper");
const PersonItemToken = require("./PersonItemToken");

class PersonMorphCollection {
    
    constructor() {
        this.head = null;
        this.items = new Array();
        this.number = 0;
    }
    
    checkLatinVariant(latin) {
        for (const it of this.items) {
            if (MiscHelper.canBeEqualCyrAndLatSS(latin, it.value)) 
                return true;
        }
        return false;
    }
    
    correct() {
        for (const it of this.items) {
            if (it.value.indexOf(' ') > 0) 
                it.value = Utils.replaceString(it.value, " ", "");
        }
        for (let i = 0; i < (this.items.length - 1); i++) {
            for (let k = 0; k < (this.items.length - 1); k++) {
                if (PersonMorphCollection.m_Comparer.compare(this.items[k], this.items[k + 1]) > 0) {
                    let it = this.items[k + 1];
                    this.items[k + 1] = this.items[k];
                    this.items[k] = it;
                }
            }
        }
    }
    
    get hasLastnameStandardTail() {
        for (const it of this.items) {
            if (PersonItemToken.MorphPersonItem.endsWithStdSurname(it.value)) 
                return true;
        }
        return false;
    }
    
    add(val, shortval, gen, addOtherGenderVar = false) {
        if (val === null) 
            return;
        if (this.head === null) {
            if (val.length > 3) 
                this.head = val.substring(0, 0 + 3);
            else 
                this.head = val;
        }
        if (gen === MorphGender.MASCULINE || gen === MorphGender.FEMINIE) {
            for (const it of this.items) {
                if (it.value === val && it.gender === gen) 
                    return;
            }
            this.items.push(PersonMorphCollection.PersonMorphVariant._new2682(val, gen, shortval));
            if (addOtherGenderVar) {
                let g0 = (gen === MorphGender.FEMINIE ? MorphGender.MASCULINE : MorphGender.FEMINIE);
                let v = null;
                try {
                    v = MorphologyService.getWordform(val, MorphBaseInfo._new446(MorphClass._new2662(true), g0));
                } catch (ex2685) {
                }
                if (v !== null) 
                    this.items.push(PersonMorphCollection.PersonMorphVariant._new2682(v, g0, shortval));
            }
        }
        else {
            this.add(val, shortval, MorphGender.MASCULINE, false);
            this.add(val, shortval, MorphGender.FEMINIE, false);
        }
    }
    
    remove(val, gen) {
        let ret = false;
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (val !== null && this.items[i].value !== val) 
                continue;
            if (gen !== MorphGender.UNDEFINED && this.items[i].gender !== gen) 
                continue;
            this.items.splice(i, 1);
            ret = true;
        }
        return ret;
    }
    
    addPrefixStr(prefix) {
        this.head = (prefix + this.head);
        for (const it of this.items) {
            it.value = (prefix + it.value);
            if (it.shortValue !== null) 
                it.value = (prefix + it.shortValue);
        }
    }
    
    static addPrefix(prefix, body) {
        let res = new PersonMorphCollection();
        res.head = (prefix.head + "-" + body.head);
        for (const pv of prefix.items) {
            for (const bv of body.items) {
                let g = bv.gender;
                if (g === MorphGender.UNDEFINED) 
                    g = pv.gender;
                else if (pv.gender !== MorphGender.UNDEFINED && pv.gender !== g) 
                    g = MorphGender.UNDEFINED;
                res.add((pv.value + "-" + bv.value), null, g, false);
            }
        }
        return res;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.number > 0) 
            res.append("Num=").append(this.number).append(";");
        for (const it of this.items) {
            res.append(it.toString()).append("; ");
        }
        return res.toString();
    }
    
    get values() {
        let res = new Array();
        for (const it of this.items) {
            if (!res.includes(it.value)) 
                res.push(it.value);
            if (it.shortValue !== null && !res.includes(it.shortValue)) 
                res.push(it.shortValue);
        }
        return res;
    }
    
    get gender() {
        let res = MorphGender.UNDEFINED;
        for (const it of this.items) {
            res = MorphGender.of((res.value()) | (it.gender.value()));
        }
        if (res === MorphGender.FEMINIE || res === MorphGender.MASCULINE) 
            return res;
        else 
            return MorphGender.UNDEFINED;
    }
    
    containsItem(v, g) {
        for (const it of this.items) {
            if (it.value === v && it.gender === g) 
                return true;
        }
        return false;
    }
    
    static isEquals(col1, col2) {
        if (col1.head !== col2.head) 
            return false;
        for (const v of col1.items) {
            if (!col2.containsItem(v.value, v.gender)) 
                return false;
        }
        for (const v of col2.items) {
            if (!col1.containsItem(v.value, v.gender)) 
                return false;
        }
        return true;
    }
    
    static intersect2(col1, col2) {
        if (col1.head !== col2.head) 
            return false;
        let ret = false;
        let vals1 = col1.values;
        let vals2 = col2.values;
        let uni = new Array();
        for (const v of vals1) {
            if (vals2.includes(v)) {
                uni.push(v);
                continue;
            }
        }
        for (const v of vals1) {
            if (!uni.includes(v)) {
                col1.remove(v, MorphGender.UNDEFINED);
                ret = true;
            }
        }
        for (const v of vals2) {
            if (!uni.includes(v)) {
                col2.remove(v, MorphGender.UNDEFINED);
                ret = true;
            }
        }
        if (col1.gender !== MorphGender.UNDEFINED) {
            if (col2.remove(null, (col1.gender === MorphGender.FEMINIE ? MorphGender.MASCULINE : MorphGender.FEMINIE))) 
                ret = true;
        }
        if (col2.gender !== MorphGender.UNDEFINED) {
            if (col1.remove(null, (col2.gender === MorphGender.FEMINIE ? MorphGender.MASCULINE : MorphGender.FEMINIE))) 
                ret = true;
        }
        return ret;
    }
    
    static intersect(list) {
        let ret = false;
        while (true) {
            let ch = false;
            for (let i = 0; i < (list.length - 1); i++) {
                for (let j = i + 1; j < list.length; j++) {
                    if (PersonMorphCollection.intersect2(list[i], list[j])) 
                        ch = true;
                    if (PersonMorphCollection.isEquals(list[i], list[j])) {
                        list.splice(j, 1);
                        j--;
                        ch = true;
                    }
                }
            }
            if (ch) 
                ret = true;
            else 
                break;
        }
        return ret;
    }
    
    static setGender(list, gen) {
        for (const li of list) {
            li.remove(null, (gen === MorphGender.MASCULINE ? MorphGender.FEMINIE : MorphGender.MASCULINE));
        }
    }
    
    static static_constructor() {
        PersonMorphCollection.m_Comparer = new PersonMorphCollection.SortComparer();
    }
}


PersonMorphCollection.PersonMorphVariant = class  {
    
    constructor() {
        this.value = null;
        this.shortValue = null;
        this.gender = MorphGender.UNDEFINED;
    }
    
    toString() {
        const MorphGender = require("./../../../morph/MorphGender");
        let res = new StringBuilder();
        res.append(this.value);
        if (this.shortValue !== null) 
            res.append(" (").append(this.shortValue).append(")");
        if (this.gender !== MorphGender.UNDEFINED) 
            res.append(" ").append(String(this.gender));
        return res.toString();
    }
    
    static _new2574(_arg1) {
        let res = new PersonMorphCollection.PersonMorphVariant();
        res.value = _arg1;
        return res;
    }
    
    static _new2682(_arg1, _arg2, _arg3) {
        let res = new PersonMorphCollection.PersonMorphVariant();
        res.value = _arg1;
        res.gender = _arg2;
        res.shortValue = _arg3;
        return res;
    }
}


PersonMorphCollection.SortComparer = class  {
    
    compare(x, y) {
        if (x.value.indexOf('-') > 0) {
            if ((y.value.indexOf('-') < 0) && (y.value.length < (x.value.length - 1))) 
                return -1;
        }
        else if (y.value.indexOf('-') > 0 && (y.value.length - 1) > x.value.length) 
            return 1;
        if (x.value.length < y.value.length) 
            return -1;
        if (x.value.length > y.value.length) 
            return 1;
        return 0;
    }
}


PersonMorphCollection.static_constructor();

module.exports = PersonMorphCollection