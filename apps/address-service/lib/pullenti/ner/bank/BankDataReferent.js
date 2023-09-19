/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const MetaBank = require("./internal/MetaBank");
const UriReferent = require("./../uri/UriReferent");

/**
 * Банковские данные (реквизиты)
 * 
 */
class BankDataReferent extends Referent {
    
    constructor() {
        super(BankDataReferent.OBJ_TYPENAME);
        this.instanceOf = MetaBank.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        for (const s of this.slots) {
            if (s.value instanceof UriReferent) {
                if (s.value.scheme === "Р/С") {
                    res.append(s.value.toString());
                    break;
                }
            }
        }
        if (res.length === 0) 
            res.append(Utils.notNull(this.getStringValue(BankDataReferent.ATTR_ITEM), "?"));
        if (this.parentReferent !== null && !shortVariant && (lev < 20)) 
            res.append(", ").append(this.parentReferent.toStringEx(true, lang, lev + 1));
        return res.toString();
    }
    
    get parentReferent() {
        return Utils.as(this.getSlotValue(BankDataReferent.ATTR_BANK), Referent);
    }
    
    findValue(schema) {
        for (const s of this.slots) {
            if (s.value instanceof UriReferent) {
                let ur = Utils.as(s.value, UriReferent);
                if (ur.scheme === schema) 
                    return ur.value;
            }
        }
        return null;
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let bd = Utils.as(obj, BankDataReferent);
        if (bd === null) 
            return false;
        for (const s of this.slots) {
            if (s.typeName === BankDataReferent.ATTR_ITEM) {
                let ur = Utils.as(s.value, UriReferent);
                let val = bd.findValue(ur.scheme);
                if (val !== null) {
                    if (val !== ur.value) 
                        return false;
                }
            }
            else if (s.typeName === BankDataReferent.ATTR_BANK) {
                let b1 = Utils.as(s.value, Referent);
                let b2 = Utils.as(bd.getSlotValue(BankDataReferent.ATTR_BANK), Referent);
                if (b2 !== null) {
                    if (b1 !== b2 && !b1.canBeEquals(b2, ReferentsEqualType.WITHINONETEXT)) 
                        return false;
                }
            }
        }
        return true;
    }
    
    static static_constructor() {
        BankDataReferent.OBJ_TYPENAME = "BANKDATA";
        BankDataReferent.ATTR_ITEM = "ITEM";
        BankDataReferent.ATTR_BANK = "BANK";
        BankDataReferent.ATTR_CORBANK = "CORBANK";
        BankDataReferent.ATTR_MISC = "MISC";
    }
}


BankDataReferent.static_constructor();

module.exports = BankDataReferent