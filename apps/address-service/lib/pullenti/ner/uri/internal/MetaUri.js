/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");

class MetaUri extends ReferentClass {
    
    static initialize() {
        const UriReferent = require("./../UriReferent");
        MetaUri.globalMeta = new MetaUri();
        MetaUri.globalMeta.addFeature(UriReferent.ATTR_VALUE, "Значение", 0, 1);
        MetaUri.globalMeta.addFeature(UriReferent.ATTR_SCHEME, "Схема", 0, 1);
        MetaUri.globalMeta.addFeature(UriReferent.ATTR_DETAIL, "Детализация", 0, 1);
    }
    
    get name() {
        const UriReferent = require("./../UriReferent");
        return UriReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "URI";
    }
    
    getImageId(obj = null) {
        const UriReferent = require("./../UriReferent");
        let web = Utils.as(obj, UriReferent);
        if (web !== null && web.scheme === "mailto") 
            return MetaUri.MAIL_IMAGE_ID;
        else 
            return MetaUri.URI_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaUri.MAIL_IMAGE_ID = "mail";
        MetaUri.URI_IMAGE_ID = "uri";
        MetaUri.globalMeta = null;
    }
}


MetaUri.static_constructor();

module.exports = MetaUri