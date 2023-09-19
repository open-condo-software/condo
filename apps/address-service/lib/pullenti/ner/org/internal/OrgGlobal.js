/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");
const XmlDocument = require("./../../../unisharp/XmlDocument");

const OrganizationReferent = require("./../OrganizationReferent");
const PullentiNerOrgInternalResourceHelper = require("./PullentiNerOrgInternalResourceHelper");
const SourceOfAnalysis = require("./../../SourceOfAnalysis");
const IntOntologyCollection = require("./../../core/IntOntologyCollection");
const GeoReferent = require("./../../geo/GeoReferent");
const ProcessorService = require("./../../ProcessorService");
const Termin = require("./../../core/Termin");
const Analyzer = require("./../../Analyzer");
const MorphLang = require("./../../../morph/MorphLang");
const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
const OrgItemTypeToken = require("./OrgItemTypeToken");

class OrgGlobal {
    
    static initialize() {
        if (OrgGlobal.GLOBAL_ORGS !== null) 
            return;
        OrgGlobal.GLOBAL_ORGS = new IntOntologyCollection();
        let _org = null;
        let oi = null;
        let geoProc = ProcessorService.createEmptyProcessor(); 
        try {
            geoProc.addAnalyzer(new GeoAnalyzer());
            let geos = new Hashtable();
            for (let k = 0; k < 3; k++) {
                let lang = (k === 0 ? MorphLang.RU : (k === 1 ? MorphLang.EN : MorphLang.UA));
                let name = (k === 0 ? "Orgs_ru.dat" : (k === 1 ? "Orgs_en.dat" : "Orgs_ua.dat"));
                let dat = PullentiNerOrgInternalResourceHelper.getBytes(name);
                if (dat === null) 
                    throw new Error(("Can't file resource file " + name + " in Organization analyzer"));
                let tmp = new MemoryStream(OrgItemTypeToken.deflate(dat)); 
                try {
                    tmp.position = 0;
                    let xml = new XmlDocument();
                    xml.loadStream(tmp);
                    for (const x of xml.document_element.child_nodes) {
                        _org = new OrganizationReferent();
                        let abbr = null;
                        for (const xx of x.child_nodes) {
                            if (xx.local_name === "typ") 
                                _org.addSlot(OrganizationReferent.ATTR_TYPE, xx.inner_text, false, 0);
                            else if (xx.local_name === "nam") 
                                _org.addSlot(OrganizationReferent.ATTR_NAME, xx.inner_text, false, 0);
                            else if (xx.local_name === "epo") 
                                _org.addSlot(OrganizationReferent.ATTR_EPONYM, xx.inner_text, false, 0);
                            else if (xx.local_name === "prof") 
                                _org.addSlot(OrganizationReferent.ATTR_PROFILE, xx.inner_text, false, 0);
                            else if (xx.local_name === "abbr") 
                                abbr = xx.inner_text;
                            else if (xx.local_name === "geo") {
                                let _geo = null;
                                let wrapgeo1771 = new RefOutArgWrapper();
                                let inoutres1772 = geos.tryGetValue(xx.inner_text, wrapgeo1771);
                                _geo = wrapgeo1771.value;
                                if (!inoutres1772) {
                                    let ar = null;
                                    try {
                                        ar = geoProc.process(new SourceOfAnalysis(xx.inner_text), null, lang);
                                    } catch (ex) {
                                    }
                                    if (ar !== null && ar.entities.length === 1 && (ar.entities[0] instanceof GeoReferent)) {
                                        _geo = Utils.as(ar.entities[0], GeoReferent);
                                        geos.put(xx.inner_text, _geo);
                                    }
                                    else {
                                    }
                                }
                                if (_geo !== null) 
                                    _org.addSlot(OrganizationReferent.ATTR_GEO, _geo, false, 0);
                            }
                        }
                        oi = _org.createOntologyItemEx(2, true, true);
                        if (oi === null) 
                            continue;
                        if (abbr !== null) 
                            oi.termins.push(new Termin(abbr, null, true));
                        if (k === 2) 
                            OrgGlobal.GLOBAL_ORGS_UA.addItem(oi);
                        else 
                            OrgGlobal.GLOBAL_ORGS.addItem(oi);
                    }
                }
                finally {
                    tmp.close();
                }
            }
        }
        finally {
            geoProc.close();
        }
        return;
    }
    
    static static_constructor() {
        OrgGlobal.GLOBAL_ORGS = null;
        OrgGlobal.GLOBAL_ORGS_UA = new IntOntologyCollection();
    }
}


OrgGlobal.static_constructor();

module.exports = OrgGlobal