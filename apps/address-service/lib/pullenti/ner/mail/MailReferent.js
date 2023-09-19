/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const GeoReferent = require("./../geo/GeoReferent");
const MailKind = require("./MailKind");
const ReferentClass = require("./../metadata/ReferentClass");
const Referent = require("./../Referent");
const PersonPropertyReferent = require("./../person/PersonPropertyReferent");
const AddressReferent = require("./../address/AddressReferent");
const MetaLetter = require("./internal/MetaLetter");
const PersonReferent = require("./../person/PersonReferent");

/**
 * Сущность - блок письма
 * 
 */
class MailReferent extends Referent {
    
    constructor() {
        super(MailReferent.OBJ_TYPENAME);
        this.instanceOf = MetaLetter.globalMeta;
    }
    
    get kind() {
        let val = this.getStringValue(MailReferent.ATTR_KIND);
        try {
            if (val !== null) 
                return MailKind.of(val);
        } catch (ex1592) {
        }
        return MailKind.UNDEFINED;
    }
    set kind(value) {
        this.addSlot(MailReferent.ATTR_KIND, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    get text() {
        return this.getStringValue(MailReferent.ATTR_TEXT);
    }
    set text(value) {
        this.addSlot(MailReferent.ATTR_TEXT, value, true, 0);
        return value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        res.append(String(this.kind)).append(": ");
        for (const s of this.slots) {
            if (s.typeName === MailReferent.ATTR_REF && (s.value instanceof Referent)) 
                res.append(s.value.toStringEx(true, lang, lev + 1)).append(", ");
        }
        if (res.length < 100) {
            let str = Utils.notNull(this.text, "");
            str = Utils.replaceString(Utils.replaceString(str, '\r', ' '), '\n', ' ');
            if (str.length > 100) 
                str = str.substring(0, 0 + 100) + "...";
            res.append(str);
        }
        return res.toString();
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        return obj === this;
    }
    
    addRef(r, lev = 0) {
        if (r === null || lev > 4) 
            return;
        if ((((r instanceof PersonReferent) || (r instanceof PersonPropertyReferent) || r.typeName === "ORGANIZATION") || r.typeName === "PHONE" || r.typeName === "URI") || (r instanceof GeoReferent) || (r instanceof AddressReferent)) 
            this.addSlot(MailReferent.ATTR_REF, r, false, 0);
        for (const s of r.slots) {
            if (s.value instanceof Referent) 
                this.addRef(Utils.as(s.value, Referent), lev + 1);
        }
    }
    
    static _new1588(_arg1) {
        let res = new MailReferent();
        res.kind = _arg1;
        return res;
    }
    
    static static_constructor() {
        MailReferent.OBJ_TYPENAME = "MAIL";
        MailReferent.ATTR_KIND = "TYPE";
        MailReferent.ATTR_TEXT = "TEXT";
        MailReferent.ATTR_REF = "REF";
    }
}


MailReferent.static_constructor();

module.exports = MailReferent