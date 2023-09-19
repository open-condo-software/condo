/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const DefinitionKind = require("./DefinitionKind");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaDefin = require("./internal/MetaDefin");

/**
 * Сущность, моделирующая тезис (утверждение, определения)
 * 
 */
class DefinitionReferent extends Referent {
    
    constructor() {
        super(DefinitionReferent.OBJ_TYPENAME);
        this.instanceOf = MetaDefin.globalMeta;
    }
    
    get termin() {
        return this.getStringValue(DefinitionReferent.ATTR_TERMIN);
    }
    
    get terminAdd() {
        return this.getStringValue(DefinitionReferent.ATTR_TERMIN_ADD);
    }
    
    get value() {
        return this.getStringValue(DefinitionReferent.ATTR_VALUE);
    }
    
    get kind() {
        let s = this.getStringValue(DefinitionReferent.ATTR_KIND);
        if (s === null) 
            return DefinitionKind.UNDEFINED;
        try {
            let res = DefinitionKind.of(s);
            if (res instanceof DefinitionKind) 
                return DefinitionKind.of(res);
        } catch (ex1180) {
        }
        return DefinitionKind.UNDEFINED;
    }
    set kind(_value) {
        this.addSlot(DefinitionReferent.ATTR_KIND, _value.toString(), true, 0);
        return _value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let misc = this.getStringValue(DefinitionReferent.ATTR_TERMIN_ADD);
        if (misc === null) 
            misc = this.getStringValue(DefinitionReferent.ATTR_MISC);
        return ("[" + this.kind.toString() + "] " + (Utils.notNull(this.termin, "?")) + (misc === null ? "" : (" (" + misc + ")")) + " = " + (Utils.notNull(this.value, "?")));
    }
    
    canBeEquals(obj, typ) {
        let dr = Utils.as(obj, DefinitionReferent);
        if (dr === null) 
            return false;
        if (this.termin !== dr.termin) 
            return false;
        if (this.value !== dr.value) 
            return false;
        if (this.terminAdd !== dr.terminAdd) 
            return false;
        return true;
    }
    
    static _new1176(_arg1) {
        let res = new DefinitionReferent();
        res.kind = _arg1;
        return res;
    }
    
    static static_constructor() {
        DefinitionReferent.OBJ_TYPENAME = "THESIS";
        DefinitionReferent.ATTR_TERMIN = "TERMIN";
        DefinitionReferent.ATTR_TERMIN_ADD = "TERMINADD";
        DefinitionReferent.ATTR_VALUE = "VALUE";
        DefinitionReferent.ATTR_MISC = "MISC";
        DefinitionReferent.ATTR_KIND = "KIND";
        DefinitionReferent.ATTR_DECREE = "DECREE";
    }
}


DefinitionReferent.static_constructor();

module.exports = DefinitionReferent