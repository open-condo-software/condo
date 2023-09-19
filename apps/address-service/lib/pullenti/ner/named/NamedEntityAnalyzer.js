/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Token = require("./../Token");
const MetaToken = require("./../MetaToken");
const ProcessorService = require("./../ProcessorService");
const GetTextAttr = require("./../core/GetTextAttr");
const MorphNumber = require("./../../morph/MorphNumber");
const Referent = require("./../Referent");
const Analyzer = require("./../Analyzer");
const NamedEntityKind = require("./NamedEntityKind");
const ReferentToken = require("./../ReferentToken");
const MiscHelper = require("./../core/MiscHelper");
const GeoReferent = require("./../geo/GeoReferent");
const MetaNamedEntity = require("./internal/MetaNamedEntity");
const Termin = require("./../core/Termin");
const NamedEntityReferent = require("./NamedEntityReferent");
const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const NamedItemToken = require("./internal/NamedItemToken");

/**
 * Анализатор именованных сущностей "тип" + "имя": планеты, памятники, здания, местоположения, планеты и пр.
 */
class NamedEntityAnalyzer extends Analyzer {
    
    get name() {
        return NamedEntityAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Мелкие именованные сущности";
    }
    
    get description() {
        return "Планеты, памятники, здания, местоположения, планеты и пр.";
    }
    
    clone() {
        return new NamedEntityAnalyzer();
    }
    
    get typeSystem() {
        return [MetaNamedEntity.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(NamedEntityKind.MONUMENT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("monument.png"));
        res.put(NamedEntityKind.PLANET.toString(), PullentiNerCoreInternalResourceHelper.getBytes("planet.png"));
        res.put(NamedEntityKind.LOCATION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("location.png"));
        res.put(NamedEntityKind.BUILDING.toString(), PullentiNerCoreInternalResourceHelper.getBytes("building.png"));
        res.put(NamedEntityKind.AWARD.toString(), PullentiNerCoreInternalResourceHelper.getBytes("award.png"));
        res.put(NamedEntityKind.ART.toString(), PullentiNerCoreInternalResourceHelper.getBytes("art.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === NamedEntityReferent.OBJ_TYPENAME) 
            return new NamedEntityReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return [GeoReferent.OBJ_TYPENAME, "ORGANIZATION", "PERSON"];
    }
    
    get progressWeight() {
        return 3;
    }
    
    createAnalyzerData() {
        return new AnalyzerDataWithOntology();
    }
    
    process(kit) {
        let ad = Utils.as(kit.getAnalyzerData(this), AnalyzerDataWithOntology);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (t.isValue("ПОСЛЕ", null)) {
            }
            let li = NamedItemToken.tryParseList(t, ad.localOntology);
            if (li === null || li.length === 0) 
                continue;
            let rt = NamedEntityAnalyzer._tryAttach(li);
            if (rt !== null) {
                rt.referent = ad.registerReferent(rt.referent);
                kit.embedToken(rt);
                t = rt;
                continue;
            }
        }
    }
    
    processReferent(begin, param) {
        let li = NamedItemToken.tryParseList(begin, null);
        if (li === null || li.length === 0) 
            return null;
        let rt = NamedEntityAnalyzer._tryAttach(li);
        if (rt === null) 
            return null;
        rt.data = begin.kit.getAnalyzerData(this);
        return rt;
    }
    
    static canBeRef(ki, re) {
        if (re === null) 
            return false;
        if (ki === NamedEntityKind.MONUMENT) {
            if (re.typeName === "PERSON" || re.typeName === "PERSONPROPERTY") 
                return true;
        }
        else if (ki === NamedEntityKind.LOCATION) {
            if (re instanceof GeoReferent) {
                let _geo = Utils.as(re, GeoReferent);
                if (_geo.isRegion || _geo.isState) 
                    return true;
            }
        }
        else if (ki === NamedEntityKind.BUILDING) {
            if (re.typeName === "ORGANIZATION") 
                return true;
        }
        return false;
    }
    
    static _tryAttach(toks) {
        if (toks === null || toks.length === 0) 
            return null;
        if ((toks[0].nameValue !== null && toks[0].typeValue === null && toks[0].isInBracket) && ((toks.length === 1 || toks[1].typeValue === null))) {
            let parent = null;
            for (let tt = toks[0].beginToken.previous; tt !== null; tt = tt.previous) {
                if (tt.isCommaAnd) 
                    continue;
                let prev = Utils.as(tt.getReferent(), NamedEntityReferent);
                if (prev === null) 
                    break;
                if (toks[0].kind !== NamedEntityKind.UNDEFINED) {
                    if (toks[0].kind !== prev.kind) 
                        break;
                }
                parent = prev;
                break;
            }
            if (parent === null && toks[0].isInBracket) {
                let ad = Utils.as(toks[0].kit.getAnalyzerDataByAnalyzerName("NAMEDENTITY"), AnalyzerDataWithOntology);
                let tok = ad.localOntology.tryAttach(toks[0].beginToken.next, null, false);
                if (tok !== null && tok.length === 1) 
                    parent = Utils.as(tok[0].item.referent, NamedEntityReferent);
            }
            if (parent !== null) {
                let ent = new NamedEntityReferent();
                for (const s of parent.slots) {
                    if (s.typeName !== NamedEntityReferent.ATTR_NAME) 
                        ent.addSlot(s.typeName, s.value, false, 0);
                }
                ent.addSlot(NamedEntityReferent.ATTR_NAME, toks[0].nameValue, false, 0);
                let norm = MiscHelper.getTextValueOfMetaToken(toks[0], GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                ent.addSlot(NamedEntityReferent.ATTR_NAME, norm, false, 0);
                return new ReferentToken(ent, toks[0].beginToken, toks[0].endToken);
            }
        }
        let typ = null;
        let re = null;
        let nams = null;
        let ki = NamedEntityKind.UNDEFINED;
        let i = 0;
        for (i = 0; i < toks.length; i++) {
            if (toks[i].typeValue !== null) {
                if (nams !== null && toks[i].nameValue !== null) 
                    break;
                if (typ === null) {
                    typ = toks[i];
                    ki = typ.kind;
                }
                else if (typ.kind !== toks[i].kind) 
                    break;
            }
            if (toks[i].nameValue !== null) {
                if (typ !== null && toks[i].kind !== NamedEntityKind.UNDEFINED && toks[i].kind !== typ.kind) 
                    break;
                if (nams === null) 
                    nams = new Array();
                else if (nams[0].isWellknown !== toks[i].isWellknown) 
                    break;
                if (ki === NamedEntityKind.UNDEFINED) 
                    ki = toks[i].kind;
                nams.push(toks[i]);
            }
            if (toks[i].typeValue === null && toks[i].nameValue === null) 
                break;
            if (re === null && NamedEntityAnalyzer.canBeRef(ki, toks[i].ref)) 
                re = toks[i];
        }
        if ((i < toks.length) && toks[i].ref !== null) {
            if (NamedEntityAnalyzer.canBeRef(ki, toks[i].ref)) {
                re = toks[i];
                i++;
            }
        }
        let ok = false;
        if (typ !== null) {
            if (nams === null) {
                if (re === null) 
                    ok = false;
                else 
                    ok = true;
            }
            else if ((nams[0].beginChar < typ.endChar) && !nams[0].isWellknown) {
                if (re !== null) 
                    ok = true;
                else if ((nams[0].chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(nams[0].beginToken) && typ.morph.number !== MorphNumber.PLURAL) && typ.morph._case.isNominative) 
                    ok = true;
            }
            else 
                ok = true;
        }
        else if (nams !== null) {
            if (nams.length === 1 && nams[0].chars.isAllLower) {
            }
            else if (nams[0].isWellknown) 
                ok = true;
        }
        if (!ok || ki === NamedEntityKind.UNDEFINED) 
            return null;
        let nam = NamedEntityReferent._new1769(ki);
        if (typ !== null) 
            nam.addSlot(NamedEntityReferent.ATTR_TYPE, typ.typeValue.toLowerCase(), false, 0);
        if (nams !== null) {
            if (nams.length === 1 && nams[0].isWellknown && nams[0].typeValue !== null) 
                nam.addSlot(NamedEntityReferent.ATTR_TYPE, nams[0].typeValue.toLowerCase(), false, 0);
            if (typ !== null && (typ.endChar < nams[0].beginChar)) {
                let str = MiscHelper.getTextValue(nams[0].beginToken, nams[nams.length - 1].endToken, GetTextAttr.NO);
                nam.addSlot(NamedEntityReferent.ATTR_NAME, str, false, 0);
            }
            let tmp = new StringBuilder();
            for (const n of nams) {
                if (tmp.length > 0) 
                    tmp.append(' ');
                tmp.append(n.nameValue);
            }
            nam.addSlot(NamedEntityReferent.ATTR_NAME, tmp.toString(), false, 0);
        }
        if (re !== null) 
            nam.addSlot(NamedEntityReferent.ATTR_REF, re.ref, false, 0);
        let res = new ReferentToken(nam, toks[0].beginToken, toks[i - 1].endToken);
        if (typ !== null) 
            res.morph = typ.morph;
        else 
            res.morph = toks[0].morph;
        return res;
    }
    
    static initialize() {
        if (NamedEntityAnalyzer.m_Inited) 
            return;
        NamedEntityAnalyzer.m_Inited = true;
        try {
            MetaNamedEntity.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            NamedItemToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new NamedEntityAnalyzer());
    }
    
    static static_constructor() {
        NamedEntityAnalyzer.ANALYZER_NAME = "NAMEDENTITY";
        NamedEntityAnalyzer.m_Inited = false;
    }
}


NamedEntityAnalyzer.static_constructor();

module.exports = NamedEntityAnalyzer