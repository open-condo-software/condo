/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const IntOntologyItem = require("./../core/IntOntologyItem");
const Termin = require("./../core/Termin");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaSentiment = require("./internal/MetaSentiment");
const SentimentKind = require("./SentimentKind");
const Referent = require("./../Referent");

/**
 * Фрагмент, соответсвующий сентиментной оценке
 */
class SentimentReferent extends Referent {
    
    constructor() {
        super(SentimentReferent.OBJ_TYPENAME);
        this.instanceOf = MetaSentiment.globalMeta;
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        res.append(MetaSentiment.FTYP.convertInnerValueToOuterValue(this.getStringValue(SentimentReferent.ATTR_KIND), lang));
        res.append(" ").append((Utils.notNull(this.spelling, "")));
        if (this.coef > 0) 
            res.append(" (coef=").append(this.coef).append(")");
        let r = this.getSlotValue(SentimentReferent.ATTR_REF);
        if (r !== null && !shortVariant) 
            res.append(" -> ").append(r);
        return res.toString();
    }
    
    get kind() {
        let s = this.getStringValue(SentimentReferent.ATTR_KIND);
        if (s === null) 
            return SentimentKind.UNDEFINED;
        try {
            let res = SentimentKind.of(s);
            if (res instanceof SentimentKind) 
                return SentimentKind.of(res);
        } catch (ex2756) {
        }
        return SentimentKind.UNDEFINED;
    }
    set kind(value) {
        if (value !== SentimentKind.UNDEFINED) 
            this.addSlot(SentimentReferent.ATTR_KIND, value.toString(), true, 0);
        return value;
    }
    
    get spelling() {
        return this.getStringValue(SentimentReferent.ATTR_SPELLING);
    }
    set spelling(value) {
        this.addSlot(SentimentReferent.ATTR_SPELLING, value, true, 0);
        return value;
    }
    
    get coef() {
        let val = this.getStringValue(SentimentReferent.ATTR_COEF);
        if (val === null) 
            return 0;
        let i = 0;
        let wrapi2757 = new RefOutArgWrapper();
        let inoutres2758 = Utils.tryParseInt(val, wrapi2757);
        i = wrapi2757.value;
        if (!inoutres2758) 
            return 0;
        return i;
    }
    set coef(value) {
        this.addSlot(SentimentReferent.ATTR_COEF, value.toString(), true, 0);
        return value;
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let sr = Utils.as(obj, SentimentReferent);
        if (sr === null) 
            return false;
        if (sr.kind !== this.kind) 
            return false;
        if (sr.spelling !== this.spelling) 
            return false;
        return true;
    }
    
    canBeGeneralFor(obj) {
        return false;
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        oi.termins.push(new Termin(this.spelling));
        return oi;
    }
    
    static static_constructor() {
        SentimentReferent.OBJ_TYPENAME = "SENTIMENT";
        SentimentReferent.ATTR_KIND = "KIND";
        SentimentReferent.ATTR_COEF = "COEF";
        SentimentReferent.ATTR_REF = "REF";
        SentimentReferent.ATTR_SPELLING = "SPELLING";
    }
}


SentimentReferent.static_constructor();

module.exports = SentimentReferent