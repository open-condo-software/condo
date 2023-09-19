/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentToken = require("./../../ReferentToken");
const Analyzer = require("./../../Analyzer");
const Referent = require("./../../Referent");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");
const PersonAttrToken = require("./PersonAttrToken");

class PersonPropAnalyzer extends Analyzer {
    
    constructor() {
        super();
        this.ignoreThisAnalyzer = true;
    }
    
    get name() {
        return PersonPropAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Используется внутренним образом";
    }
    
    clone() {
        return new PersonPropAnalyzer();
    }
    
    processReferent(begin, param) {
        let pat = PersonAttrToken.tryAttach(begin, PersonAttrTokenPersonAttrAttachAttrs.INPROCESS);
        if (pat !== null && pat.propRef !== null) 
            return ReferentToken._new2687(pat.propRef, pat.beginToken, pat.endToken, pat.morph, pat);
        return null;
    }
    
    static static_constructor() {
        PersonPropAnalyzer.ANALYZER_NAME = "PERSONPROPERTY";
    }
}


PersonPropAnalyzer.static_constructor();

module.exports = PersonPropAnalyzer