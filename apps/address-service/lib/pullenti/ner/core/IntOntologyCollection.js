/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const Referent = require("./../Referent");
const TerminParseAttr = require("./TerminParseAttr");
const ReferentsEqualType = require("./ReferentsEqualType");
const Termin = require("./Termin");
const TerminCollection = require("./TerminCollection");
const IntOntologyToken = require("./IntOntologyToken");

// Внутренний онтологический словарь. По сути, некоторая надстройка над TerminCollection.
// Не помню уже, зачем был введён, но для чего-то нужен.
class IntOntologyCollection {
    
    constructor() {
        this.isExtOntology = false;
        this.m_Items = new Array();
        this.m_Termins = new TerminCollection();
    }
    
    get items() {
        return this.m_Items;
    }
    
    addItem(di) {
        this.m_Items.push(di);
        di.owner = this;
        for (let i = 0; i < di.termins.length; i++) {
            if (di.termins[i] instanceof IntOntologyCollection.OntologyTermin) {
                di.termins[i].owner = di;
                this.m_Termins.add(di.termins[i]);
            }
            else {
                let nt = IntOntologyCollection.OntologyTermin._new792(di, di.termins[i].tag);
                di.termins[i].copyTo(nt);
                this.m_Termins.add(nt);
                di.termins[i] = nt;
            }
        }
    }
    
    addReferent(referent) {
        if (referent === null) 
            return false;
        let oi = null;
        if (referent.intOntologyItem !== null && referent.intOntologyItem.owner === this) {
            let oi1 = referent.createOntologyItem();
            if (oi1 === null || oi1.termins.length === referent.intOntologyItem.termins.length) 
                return true;
            for (const t of referent.intOntologyItem.termins) {
                this.m_Termins.remove(t);
            }
            let i = this.m_Items.indexOf(referent.intOntologyItem);
            if (i >= 0) 
                this.m_Items.splice(i, 1);
            oi = oi1;
        }
        else 
            oi = referent.createOntologyItem();
        if (oi === null) 
            return false;
        oi.referent = referent;
        referent.intOntologyItem = oi;
        this.addItem(oi);
        return true;
    }
    
    addTermin(di, t) {
        let nt = IntOntologyCollection.OntologyTermin._new792(di, t.tag);
        t.copyTo(nt);
        this.m_Termins.add(nt);
    }
    
    add(t) {
        this.m_Termins.add(t);
    }
    
    findTerminByCanonicText(text) {
        return this.m_Termins.findTerminsByCanonicText(text);
    }
    
    tryAttach(t, referentTypeName = null, canBeGeoObject = false) {
        let tts = this.m_Termins.tryParseAll(t, (canBeGeoObject ? TerminParseAttr.CANBEGEOOBJECT : TerminParseAttr.NO));
        if (tts === null) 
            return null;
        let res = new Array();
        let dis = new Array();
        for (const tt of tts) {
            let di = null;
            if (tt.termin instanceof IntOntologyCollection.OntologyTermin) 
                di = tt.termin.owner;
            if (di !== null) {
                if (di.referent !== null && referentTypeName !== null) {
                    if (di.referent.typeName !== referentTypeName) 
                        continue;
                }
                if (dis.includes(di)) 
                    continue;
                dis.push(di);
            }
            res.push(IntOntologyToken._new794(tt.beginToken, tt.endToken, di, tt.termin, tt.morph));
        }
        return (res.length === 0 ? null : res);
    }
    
    tryAttachByItem(item) {
        if (item === null) 
            return null;
        let res = null;
        for (const t of item.termins) {
            let li = this.m_Termins.findTerminsByTermin(t);
            if (li !== null) {
                for (const tt of li) {
                    if (tt instanceof IntOntologyCollection.OntologyTermin) {
                        let oi = tt.owner;
                        if (res === null) 
                            res = new Array();
                        if (!res.includes(oi)) 
                            res.push(oi);
                    }
                }
            }
        }
        return res;
    }
    
    tryAttachByReferent(referent, item = null, mustBeSingle = false) {
        if (referent === null) 
            return null;
        if (item === null) 
            item = referent.createOntologyItem();
        if (item === null) 
            return null;
        let li = this.tryAttachByItem(item);
        if (li === null) 
            return null;
        let res = null;
        for (const oi of li) {
            let r = (oi.referent != null ? oi.referent : (Utils.as(oi.tag, Referent)));
            if (r !== null) {
                if (referent.canBeEquals(r, ReferentsEqualType.WITHINONETEXT)) {
                    if (res === null) 
                        res = new Array();
                    if (!res.includes(r)) 
                        res.push(r);
                }
            }
        }
        if (mustBeSingle) {
            if (res !== null && res.length > 1) {
                for (let i = 0; i < (res.length - 1); i++) {
                    for (let j = i + 1; j < res.length; j++) {
                        if (!res[i].canBeEquals(res[j], ReferentsEqualType.FORMERGING)) 
                            return null;
                    }
                }
            }
        }
        return res;
    }
    
    remove(r) {
        let i = 0;
        for (i = 0; i < this.m_Items.length; i++) {
            if (this.m_Items[i].referent === r) {
                let oi = this.m_Items[i];
                oi.referent = null;
                r.intOntologyItem = null;
                this.m_Items.splice(i, 1);
                for (const t of oi.termins) {
                    this.m_Termins.remove(t);
                }
                break;
            }
        }
    }
    
    static _new2914(_arg1) {
        let res = new IntOntologyCollection();
        res.isExtOntology = _arg1;
        return res;
    }
}


IntOntologyCollection.OntologyTermin = class  extends Termin {
    
    constructor() {
        super(null, null, false);
        this.owner = null;
    }
    
    static _new792(_arg1, _arg2) {
        let res = new IntOntologyCollection.OntologyTermin();
        res.owner = _arg1;
        res.tag = _arg2;
        return res;
    }
}


module.exports = IntOntologyCollection