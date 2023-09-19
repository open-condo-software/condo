/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Referent = require("./../Referent");
const LanguageHelper = require("./../../morph/LanguageHelper");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const ReferentToken = require("./../ReferentToken");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaTransport = require("./internal/MetaTransport");
const MiscHelper = require("./../core/MiscHelper");
const TransportKind = require("./TransportKind");
const GeoReferent = require("./../geo/GeoReferent");

/**
 * Сущность - транспортное средство
 * 
 */
class TransportReferent extends Referent {
    
    constructor() {
        super(TransportReferent.OBJ_TYPENAME);
        this.instanceOf = MetaTransport.globalMeta;
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        let str = null;
        for (const s of this.slots) {
            if (s.typeName === TransportReferent.ATTR_TYPE) {
                let n = String(s.value);
                if (str === null || (n.length < str.length)) 
                    str = n;
            }
        }
        if (str !== null) 
            res.append(str);
        else if (this.kind === TransportKind.AUTO) 
            res.append("автомобиль");
        else if (this.kind === TransportKind.FLY) 
            res.append("самолет");
        else if (this.kind === TransportKind.SHIP) 
            res.append("судно");
        else if (this.kind === TransportKind.SPACE) 
            res.append("космический корабль");
        else 
            res.append(this.kind.toString());
        if ((((str = this.getStringValue(TransportReferent.ATTR_BRAND)))) !== null) 
            res.append(" ").append(MiscHelper.convertFirstCharUpperAndOtherLower(str));
        if ((((str = this.getStringValue(TransportReferent.ATTR_MODEL)))) !== null) 
            res.append(" ").append(MiscHelper.convertFirstCharUpperAndOtherLower(str));
        if ((((str = this.getStringValue(TransportReferent.ATTR_NAME)))) !== null) {
            res.append(" \"").append(MiscHelper.convertFirstCharUpperAndOtherLower(str)).append("\"");
            for (const s of this.slots) {
                if (s.typeName === TransportReferent.ATTR_NAME && str !== (String(s.value))) {
                    if (LanguageHelper.isCyrillicChar(str[0]) !== LanguageHelper.isCyrillicChar(String(s.value)[0])) {
                        res.append(" (").append(MiscHelper.convertFirstCharUpperAndOtherLower(String(s.value))).append(")");
                        break;
                    }
                }
            }
        }
        if ((((str = this.getStringValue(TransportReferent.ATTR_CLASS)))) !== null) 
            res.append(" класса \"").append(MiscHelper.convertFirstCharUpperAndOtherLower(str)).append("\"");
        if ((((str = this.getStringValue(TransportReferent.ATTR_NUMBER)))) !== null) {
            res.append(", номер ").append(str);
            if ((((str = this.getStringValue(TransportReferent.ATTR_NUMBER_REGION)))) !== null) 
                res.append(str);
        }
        if (this.findSlot(TransportReferent.ATTR_ROUTEPOINT, null, true) !== null) {
            res.append(" (");
            let fi = true;
            for (const s of this.slots) {
                if (s.typeName === TransportReferent.ATTR_ROUTEPOINT) {
                    if (fi) 
                        fi = false;
                    else 
                        res.append(" - ");
                    if (s.value instanceof Referent) 
                        res.append(s.value.toStringEx(true, lang, 0));
                    else 
                        res.append(s.value);
                }
            }
            res.append(")");
        }
        if (!shortVariant) {
            if ((((str = this.getStringValue(TransportReferent.ATTR_GEO)))) !== null) 
                res.append("; ").append(str);
            if ((((str = this.getStringValue(TransportReferent.ATTR_ORG)))) !== null) 
                res.append("; ").append(str);
        }
        return res.toString();
    }
    
    get kind() {
        return this._getKind(this.getStringValue(TransportReferent.ATTR_KIND));
    }
    set kind(value) {
        if (value !== TransportKind.UNDEFINED) 
            this.addSlot(TransportReferent.ATTR_KIND, value.toString(), true, 0);
        return value;
    }
    
    _getKind(s) {
        if (s === null) 
            return TransportKind.UNDEFINED;
        try {
            let res = TransportKind.of(s);
            if (res instanceof TransportKind) 
                return TransportKind.of(res);
        } catch (ex2789) {
        }
        return TransportKind.UNDEFINED;
    }
    
    addGeo(r) {
        if (r instanceof GeoReferent) 
            this.addSlot(TransportReferent.ATTR_GEO, r, false, 0);
        else if (r instanceof ReferentToken) {
            if (r.getReferent() instanceof GeoReferent) {
                this.addSlot(TransportReferent.ATTR_GEO, r.getReferent(), false, 0);
                this.addExtReferent(Utils.as(r, ReferentToken));
            }
        }
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let tr = Utils.as(obj, TransportReferent);
        if (tr === null) 
            return false;
        let k1 = this.kind;
        let k2 = tr.kind;
        if (k1 !== k2) {
            if (k1 === TransportKind.SPACE && tr.findSlot(TransportReferent.ATTR_TYPE, "КОРАБЛЬ", true) !== null) {
            }
            else if (k2 === TransportKind.SPACE && this.findSlot(TransportReferent.ATTR_TYPE, "КОРАБЛЬ", true) !== null) 
                k1 = TransportKind.SPACE;
            else 
                return false;
        }
        let sl = this.findSlot(TransportReferent.ATTR_ORG, null, true);
        if (sl !== null && tr.findSlot(TransportReferent.ATTR_ORG, null, true) !== null) {
            if (tr.findSlot(TransportReferent.ATTR_ORG, sl.value, false) === null) 
                return false;
        }
        sl = this.findSlot(TransportReferent.ATTR_GEO, null, true);
        if (sl !== null && tr.findSlot(TransportReferent.ATTR_GEO, null, true) !== null) {
            if (tr.findSlot(TransportReferent.ATTR_GEO, sl.value, true) === null) 
                return false;
        }
        let s1 = this.getStringValue(TransportReferent.ATTR_NUMBER);
        let s2 = tr.getStringValue(TransportReferent.ATTR_NUMBER);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else {
                if (s1 !== s2) 
                    return false;
                s1 = this.getStringValue(TransportReferent.ATTR_NUMBER_REGION);
                s2 = tr.getStringValue(TransportReferent.ATTR_NUMBER_REGION);
                if (s1 !== null || s2 !== null) {
                    if (s1 === null || s2 === null) {
                        if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                            return false;
                    }
                    else if (s1 !== s2) 
                        return false;
                }
            }
        }
        s1 = this.getStringValue(TransportReferent.ATTR_BRAND);
        s2 = tr.getStringValue(TransportReferent.ATTR_BRAND);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else if (s1 !== s2) 
                return false;
        }
        s1 = this.getStringValue(TransportReferent.ATTR_MODEL);
        s2 = tr.getStringValue(TransportReferent.ATTR_MODEL);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else if (s1 !== s2) 
                return false;
        }
        for (const s of this.slots) {
            if (s.typeName === TransportReferent.ATTR_NAME) {
                if (tr.findSlot(TransportReferent.ATTR_NAME, s.value, true) !== null) 
                    return true;
            }
        }
        if (s1 !== null && s2 !== null) 
            return true;
        return false;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        super.mergeSlots(obj, mergeStatistic);
        let kinds = new Array();
        for (const s of this.slots) {
            if (s.typeName === TransportReferent.ATTR_KIND) {
                let ki = this._getKind(String(s.value));
                if (!kinds.includes(ki)) 
                    kinds.push(ki);
            }
        }
        if (kinds.length > 0) {
            if (kinds.includes(TransportKind.SPACE)) {
                for (let i = this.slots.length - 1; i >= 0; i--) {
                    if (this.slots[i].typeName === TransportReferent.ATTR_KIND && this._getKind(String(this.slots[i].value)) !== TransportKind.SPACE) 
                        this.slots.splice(i, 1);
                }
            }
        }
    }
    
    check(onAttach, brandisdoubt) {
        let ki = this.kind;
        if (ki === TransportKind.UNDEFINED) 
            return false;
        if (this.findSlot(TransportReferent.ATTR_NUMBER, null, true) !== null) {
            if (this.findSlot(TransportReferent.ATTR_NUMBER_REGION, null, true) === null && (this.slots.length < 3)) 
                return false;
            return true;
        }
        let model = this.getStringValue(TransportReferent.ATTR_MODEL);
        let hasNum = false;
        if (model !== null) {
            for (const s of model) {
                if (!Utils.isLetter(s)) {
                    hasNum = true;
                    break;
                }
            }
        }
        if (ki === TransportKind.AUTO) {
            if (this.findSlot(TransportReferent.ATTR_BRAND, null, true) !== null) {
                if (onAttach) 
                    return true;
                if (!hasNum && this.findSlot(TransportReferent.ATTR_TYPE, null, true) === null) 
                    return false;
                if (brandisdoubt && model === null && !hasNum) 
                    return false;
                return true;
            }
            if (model !== null && onAttach) 
                return true;
            return false;
        }
        if (model !== null) {
            if (!hasNum && ki === TransportKind.FLY && this.findSlot(TransportReferent.ATTR_BRAND, null, true) === null) 
                return false;
            return true;
        }
        if (this.findSlot(TransportReferent.ATTR_NAME, null, true) !== null) {
            let nam = this.getStringValue(TransportReferent.ATTR_NAME);
            if (ki === TransportKind.FLY && nam.startsWith("Аэрофлот")) 
                return false;
            return true;
        }
        if (ki === TransportKind.TRAIN) {
        }
        return false;
    }
    
    static static_constructor() {
        TransportReferent.OBJ_TYPENAME = "TRANSPORT";
        TransportReferent.ATTR_TYPE = "TYPE";
        TransportReferent.ATTR_BRAND = "BRAND";
        TransportReferent.ATTR_MODEL = "MODEL";
        TransportReferent.ATTR_CLASS = "CLASS";
        TransportReferent.ATTR_NAME = "NAME";
        TransportReferent.ATTR_NUMBER = "NUMBER";
        TransportReferent.ATTR_NUMBER_REGION = "NUMBER_REG";
        TransportReferent.ATTR_KIND = "KIND";
        TransportReferent.ATTR_GEO = "GEO";
        TransportReferent.ATTR_ORG = "ORG";
        TransportReferent.ATTR_DATE = "DATE";
        TransportReferent.ATTR_ROUTEPOINT = "ROUTEPOINT";
    }
}


TransportReferent.static_constructor();

module.exports = TransportReferent