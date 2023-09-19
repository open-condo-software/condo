/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const OrgProfile = require("./../OrgProfile");
const Referent = require("./../../Referent");

class MetaOrganization extends ReferentClass {
    
    static initialize() {
        const OrganizationReferent = require("./../OrganizationReferent");
        MetaOrganization.globalMeta = new MetaOrganization();
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_NAME, "Название", 0, 0);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_TYPE, "Тип", 0, 0);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_EPONYM, "Эпоним (имени)", 0, 0);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_NUMBER, "Номер", 0, 1);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_HIGHER, "Вышестоящая организация", 0, 1);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_OWNER, "Объект-владелец", 0, 1);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_GEO, "Географический объект", 0, 1);
        MetaOrganization.globalMeta.addFeature(Referent.ATTR_GENERAL, "Обобщающая организация", 0, 1);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_MISC, "Разное", 0, 0);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_PROFILE, "Профиль", 0, 0);
        MetaOrganization.globalMeta.addFeature(OrganizationReferent.ATTR_MARKER, "Маркер", 0, 0);
    }
    
    get name() {
        const OrganizationReferent = require("./../OrganizationReferent");
        return OrganizationReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Организация";
    }
    
    getImageId(obj = null) {
        const OrganizationReferent = require("./../OrganizationReferent");
        if (obj instanceof OrganizationReferent) {
            let prs = obj.profiles;
            if (prs !== null && prs.length > 0) {
                let pr = prs[prs.length - 1];
                return pr.toString();
            }
        }
        return MetaOrganization.ORG_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaOrganization.ORG_IMAGE_ID = "org";
        MetaOrganization.globalMeta = null;
    }
}


MetaOrganization.static_constructor();

module.exports = MetaOrganization