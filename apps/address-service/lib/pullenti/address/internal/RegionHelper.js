/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const XmlDocument = require("./../../unisharp/XmlDocument");

const AddrLevel = require("./../AddrLevel");
const RegionInfo = require("./RegionInfo");
const Termin = require("./../../ner/core/Termin");
const AreaAttributes = require("./../AreaAttributes");
const TerminCollection = require("./../../ner/core/TerminCollection");

class RegionHelper {
    
    static loadFromFile(fname) {
        if (!fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            return;
        RegionHelper.REGIONS.splice(0, RegionHelper.REGIONS.length);
        let xml = new XmlDocument();
        xml.loadFile(fname);
        for (const x of xml.document_element.child_nodes) {
            if (x.local_name === "reg") {
                let r = new RegionInfo();
                r.deserialize(x);
                RegionHelper.REGIONS.push(r);
            }
        }
        RegionHelper._init();
    }
    
    static _init() {
        RegionHelper.m_CityRegs.clear();
        RegionHelper.m_AdjRegs.clear();
        for (const r of RegionHelper.REGIONS) {
            r.termCities = new TerminCollection();
            for (const c of r.cities) {
                let city = c.toUpperCase();
                if (!RegionHelper.m_CityRegs.containsKey(city)) 
                    RegionHelper.m_CityRegs.put(city, r);
                r.termCities.add(new Termin(city));
            }
            for (const d of r.districts) {
                let nam = d.toUpperCase();
                r.termCities.add(Termin._new170(nam, d));
            }
            for (const s of r.names.ref.slots) {
                if (s.typeName === "NAME") {
                    if (!RegionHelper.m_AdjRegs.containsKey(Utils.asString(s.value))) 
                        RegionHelper.m_AdjRegs.put(Utils.asString(s.value), r);
                }
            }
        }
    }
    
    static isBigCity(nam) {
        if (nam === null) 
            return null;
        let res = null;
        let wrapres171 = new RefOutArgWrapper();
        let inoutres172 = RegionHelper.m_CityRegs.tryGetValue(nam.toUpperCase(), wrapres171);
        res = wrapres171.value;
        if (inoutres172) 
            return res;
        return null;
    }
    
    static isBigCityA(ao) {
        if (ao.level !== AddrLevel.CITY && ao.level !== AddrLevel.REGIONCITY) 
            return null;
        let aa = Utils.as(ao.attrs, AreaAttributes);
        if (aa === null || aa.names.length === 0) 
            return null;
        if (aa.number !== null) 
            return null;
        for (const n of aa.names) {
            let r = RegionHelper.isBigCity(n);
            if (r !== null) 
                return r;
        }
        return null;
    }
    
    static getRegionsByAbbr(abbr) {
        let res = null;
        for (const r of RegionHelper.REGIONS) {
            if (r.acronims.includes(abbr)) {
                if (res === null) 
                    res = new Array();
                res.push(r);
            }
        }
        return res;
    }
    
    static findRegionByAdj(adj) {
        adj = adj.toUpperCase();
        let ri = null;
        let wrapri173 = new RefOutArgWrapper();
        let inoutres174 = RegionHelper.m_AdjRegs.tryGetValue(adj, wrapri173);
        ri = wrapri173.value;
        if (!inoutres174) 
            return null;
        return ri;
    }
    
    static static_constructor() {
        RegionHelper.REGIONS = new Array();
        RegionHelper.m_CityRegs = new Hashtable();
        RegionHelper.m_AdjRegs = new Hashtable();
    }
}


RegionHelper.static_constructor();

module.exports = RegionHelper