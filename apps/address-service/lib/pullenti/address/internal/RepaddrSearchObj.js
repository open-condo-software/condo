/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const HouseType = require("./../HouseType");
const RoomType = require("./../RoomType");
const AddrLevel = require("./../AddrLevel");
const AddressHelper = require("./../AddressHelper");
const LanguageHelper = require("./../../morph/LanguageHelper");
const AreaAttributes = require("./../AreaAttributes");
const HouseAttributes = require("./../HouseAttributes");
const RoomAttributes = require("./../RoomAttributes");

class RepaddrSearchObj {
    
    constructor(a, typs) {
        this.searchStrs = new Array();
        this.typeIds = new Array();
        this.lev = AddrLevel.UNDEFINED;
        this.src = null;
        this.src = a;
        let aa = Utils.as(a.attrs, AreaAttributes);
        if (aa === null) 
            return;
        this.lev = a.level;
        for (const ty of aa.types) {
            this.typeIds.push(typs.getId(ty));
        }
        if (a.gars.length > 0) {
            for (const g of a.gars) {
                if (g !== null) 
                    this.searchStrs.push(Utils.replaceString(g.guid, "-", ""));
            }
        }
        let i0 = this.searchStrs.length;
        if (aa.names !== null) {
            for (const v of aa.names) {
                this.searchStrs.push(this._corrString(v.toUpperCase()));
            }
        }
        if (aa.number !== null) {
            if (i0 === this.searchStrs.length) 
                this.searchStrs.push(aa.number);
            else 
                for (let i = i0; i < this.searchStrs.length; i++) {
                    this.searchStrs[i] = (this.searchStrs[i] + " " + aa.number);
                }
        }
    }
    
    _corrString(str) {
        let needCorr = false;
        for (const ch of str) {
            if (ch === 'Ь' || ch === 'Ъ') 
                needCorr = true;
        }
        for (let i = 0; i < (str.length - 1); i++) {
            if (str[i] === str[i + 1]) 
                needCorr = true;
        }
        if (!needCorr) 
            return str;
        let res = new StringBuilder();
        for (let i = 0; i < str.length; i++) {
            let ch = str[i];
            if (ch === 'Ь' || ch === 'Ъ') 
                continue;
            if (res.length > 0 && res.charAt(res.length - 1) === ch) 
                continue;
            res.append(ch);
        }
        return res.toString();
    }
    
    calcCoef(o, parent, parent2) {
        if (o.lev !== this.lev) 
            return RepaddrSearchObj.eRROR;
        let ret = 0;
        let eqTyps = false;
        for (const id of this.typeIds) {
            if (o.typIds.includes(id)) {
                eqTyps = true;
                break;
            }
        }
        if (!eqTyps) {
            if (this.lev === AddrLevel.TERRITORY || this.lev === AddrLevel.LOCALITY) {
                if (this.src.attrs.names.length === 0) 
                    return RepaddrSearchObj.eRROR;
                ret += 10;
            }
            else 
                return RepaddrSearchObj.eRROR;
        }
        if (parent === null) {
            if (o.parents === null || o.parents.length === 0) {
            }
            else 
                return RepaddrSearchObj.eRROR;
        }
        else {
            if (o.parents === null || o.parents.length === 0) 
                return RepaddrSearchObj.eRROR;
            let i = o.parents.indexOf(parent.id);
            if (i < 0) {
                if (parent2 !== null && AddressHelper.canBeParent(this.lev, parent2.level)) {
                    i = o.parents.indexOf(parent2.id);
                    if (i >= 0) 
                        ret += 10;
                    else 
                        return RepaddrSearchObj.eRROR;
                }
                else 
                    return RepaddrSearchObj.eRROR;
            }
        }
        return ret;
    }
    
    static getSearchStrings(o) {
        let res = new Array();
        let tmp = new StringBuilder();
        let h = Utils.as(o.attrs, HouseAttributes);
        let r = Utils.as(o.attrs, RoomAttributes);
        if (h !== null) {
            if (h.number !== null || h.typ !== HouseType.UNDEFINED) {
                if (h.typ === HouseType.PLOT) 
                    tmp.append('p');
                else if (h.typ === HouseType.GARAGE) 
                    tmp.append('g');
                tmp.append((Utils.isNullOrEmpty(h.number) ? "0" : h.number));
            }
            if (h.buildNumber !== null) 
                tmp.append("b").append(h.buildNumber);
            if (h.stroenNumber !== null) 
                tmp.append("s").append(h.stroenNumber);
        }
        else if (r !== null) {
            if (r.number !== null || r.typ !== RoomType.UNDEFINED) {
                if (r.typ === RoomType.FLAT) 
                    tmp.append('f');
                else if (r.typ === RoomType.CARPLACE) 
                    tmp.append('c');
                tmp.append((Utils.isNullOrEmpty(r.number) ? "0" : r.number));
            }
        }
        if (tmp.length === 0) 
            tmp.append(o.toString());
        res.push(tmp.toString());
        for (let i = 0; i < tmp.length; i++) {
            if (Utils.isLetter(tmp.charAt(i)) && Utils.isUpperCase(tmp.charAt(i))) {
                let ch = tmp.charAt(i);
                let ch1 = LanguageHelper.getCyrForLat(ch);
                if ((ch1.charCodeAt(0)) !== 0) {
                    tmp.setCharAt(i, ch1);
                    res.push(tmp.toString());
                    tmp.setCharAt(i, ch);
                }
                if (h !== null) {
                    if ((h.stroenNumber === null && h.buildNumber === null && i > 0) && Utils.isDigit(tmp.charAt(i - 1))) {
                        tmp.insert(i, "s");
                        res.push(tmp.toString());
                        tmp.remove(i, 1);
                    }
                }
            }
        }
        for (const g of o.gars) {
            res.push(Utils.replaceString(g.guid, "-", ""));
        }
        return res;
    }
    
    static static_constructor() {
        RepaddrSearchObj.eRROR = 1000;
    }
}


RepaddrSearchObj.static_constructor();

module.exports = RepaddrSearchObj