/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const OrgProfile = require("./../OrgProfile");
const OrganizationKind = require("./../OrganizationKind");
const ReferentsEqualType = require("./../../core/ReferentsEqualType");
const Referent = require("./../../Referent");
const OrganizationReferent = require("./../OrganizationReferent");

class OrgOwnershipHelper {
    
    static canBeHigher(higher, lower, robust = false) {
        if (higher === null || lower === null || higher === lower) 
            return false;
        if (lower.owner !== null) 
            return false;
        let hk = higher.kind;
        let lk = lower.kind;
        if (higher.canBeEquals(lower, ReferentsEqualType.WITHINONETEXT)) 
            return false;
        if (lower.higher === null && lower.findSlot(OrganizationReferent.ATTR_HIGHER, null, true) !== null) 
            return false;
        let hTyps = higher.types;
        let lTyps = lower.types;
        if (hk !== OrganizationKind.BANK) {
            for (const v of hTyps) {
                if (lTyps.includes(v)) 
                    return false;
            }
        }
        if (hk !== OrganizationKind.DEPARTMENT && lk === OrganizationKind.DEPARTMENT) {
            if (OrgOwnershipHelper._Contains(lTyps, "курс", null) || OrgOwnershipHelper._Contains(lTyps, "группа", "група")) 
                return hk === OrganizationKind.STUDY || OrgOwnershipHelper._Contains(hTyps, "институт", "інститут");
            if (OrgOwnershipHelper._Contains(lTyps, "епархия", "єпархія") || OrgOwnershipHelper._Contains(lTyps, "патриархия", "патріархія")) 
                return hk === OrganizationKind.CHURCH;
            if (hk === OrganizationKind.UNDEFINED) {
                if (OrgOwnershipHelper._Contains(hTyps, "управление", "управління")) 
                    return false;
            }
            return true;
        }
        if (lower.containsProfile(OrgProfile.UNIT) || OrgOwnershipHelper._Contains(lTyps, "department", null)) {
            if (!higher.containsProfile(OrgProfile.UNIT) && lk !== OrganizationKind.DEPARTMENT) 
                return true;
        }
        if (OrgOwnershipHelper._Contains(hTyps, "правительство", "уряд")) {
            if (lk === OrganizationKind.GOVENMENT) 
                return (((lTyps.includes("агентство") || lTyps.includes("федеральная служба") || lTyps.includes("федеральна служба")) || lTyps.includes("департамент") || lTyps.includes("комиссия")) || lTyps.includes("комитет") || lTyps.includes("комісія")) || lTyps.includes("комітет");
        }
        if (hk === OrganizationKind.GOVENMENT) {
            if (lk === OrganizationKind.GOVENMENT) {
                if (OrgOwnershipHelper._Contains(lTyps, "комиссия", "комісія") || OrgOwnershipHelper._Contains(lTyps, "инспекция", "інспекція") || OrgOwnershipHelper._Contains(lTyps, "комитет", "комітет")) {
                    if ((!OrgOwnershipHelper._Contains(hTyps, "комиссия", "комісія") && !OrgOwnershipHelper._Contains(hTyps, "инспекция", "інспекція") && !OrgOwnershipHelper._Contains(lTyps, "государственный комитет", null)) && !OrgOwnershipHelper._Contains(hTyps, "комитет", "комітет") && ((!OrgOwnershipHelper._Contains(hTyps, "совет", "рада") || higher.toString().includes("Верховн")))) 
                        return true;
                }
                if (higher.findSlot(OrganizationReferent.ATTR_NAME, "ФЕДЕРАЛЬНОЕ СОБРАНИЕ", true) !== null || hTyps.includes("конгресс") || hTyps.includes("парламент")) {
                    if ((lower.findSlot(OrganizationReferent.ATTR_NAME, "СОВЕТ ФЕДЕРАЦИИ", true) !== null || lower.findSlot(OrganizationReferent.ATTR_NAME, "ГОСУДАРСТВЕННАЯ ДУМА", true) !== null || lower.findSlot(OrganizationReferent.ATTR_NAME, "ВЕРХОВНА РАДА", true) !== null) || OrgOwnershipHelper._Contains(lTyps, "палата", null) || OrgOwnershipHelper._Contains(lTyps, "совет", null)) 
                        return true;
                }
                if (higher.findSlot(OrganizationReferent.ATTR_NAME, "ФСБ", true) !== null) {
                    if (lower.findSlot(OrganizationReferent.ATTR_NAME, "ФПС", true) !== null) 
                        return true;
                }
                if (OrgOwnershipHelper._Contains(hTyps, "государственный комитет", null)) {
                    if ((OrgOwnershipHelper._Contains(lTyps, "комиссия", "комісія") || OrgOwnershipHelper._Contains(lTyps, "инспекция", "інспекція") || OrgOwnershipHelper._Contains(lTyps, "комитет", "комітет")) || OrgOwnershipHelper._Contains(lTyps, "департамент", null)) 
                        return true;
                }
            }
            else if (lk === OrganizationKind.UNDEFINED) {
                if ((OrgOwnershipHelper._Contains(lTyps, "комиссия", "комісія") || OrgOwnershipHelper._Contains(lTyps, "инспекция", "інспекція") || OrgOwnershipHelper._Contains(lTyps, "комитет", "комітет")) || OrgOwnershipHelper._Contains(lTyps, "управление", "управління") || OrgOwnershipHelper._Contains(lTyps, "служба", null)) 
                    return true;
            }
            else if (lk === OrganizationKind.BANK) {
            }
        }
        if (OrgOwnershipHelper._Contains(hTyps, "министерство", "міністерство")) {
            if ((((((OrgOwnershipHelper._Contains(lTyps, "институт", "інститут") || OrgOwnershipHelper._Contains(lTyps, "университет", "університет") || OrgOwnershipHelper._Contains(lTyps, "училище", null)) || OrgOwnershipHelper._Contains(lTyps, "школа", null) || OrgOwnershipHelper._Contains(lTyps, "лицей", "ліцей")) || OrgOwnershipHelper._Contains(lTyps, "НИИ", "НДІ") || OrgOwnershipHelper._Contains(lTyps, "Ф", null)) || OrgOwnershipHelper._Contains(lTyps, "департамент", null) || OrgOwnershipHelper._Contains(lTyps, "управление", "управління")) || OrgOwnershipHelper._Contains(lTyps, "комитет", "комітет") || OrgOwnershipHelper._Contains(lTyps, "комиссия", "комісія")) || OrgOwnershipHelper._Contains(lTyps, "инспекция", "інспекція") || OrgOwnershipHelper._Contains(lTyps, "центр", null)) 
                return true;
            if (OrgOwnershipHelper._Contains(lTyps, "академия", "академія")) {
            }
            if (OrgOwnershipHelper._Contains(lTyps, "служба", null) && !OrgOwnershipHelper._Contains(lTyps, "федеральная служба", "федеральна служба")) 
                return true;
            if (lk === OrganizationKind.CULTURE || lk === OrganizationKind.MEDICAL) 
                return true;
        }
        if (OrgOwnershipHelper._Contains(hTyps, "академия", "академія")) {
            if (OrgOwnershipHelper._Contains(lTyps, "институт", "інститут") || OrgOwnershipHelper._Contains(lTyps, "научн", "науков") || OrgOwnershipHelper._Contains(lTyps, "НИИ", "НДІ")) 
                return true;
        }
        if (OrgOwnershipHelper._Contains(hTyps, "факультет", null)) {
            if (OrgOwnershipHelper._Contains(lTyps, "курс", null) || OrgOwnershipHelper._Contains(lTyps, "кафедра", null)) 
                return true;
        }
        if (OrgOwnershipHelper._Contains(hTyps, "university", null)) {
            if (OrgOwnershipHelper._Contains(lTyps, "school", null) || OrgOwnershipHelper._Contains(lTyps, "college", null)) 
                return true;
        }
        let hr = OrgOwnershipHelper._militaryRank(hTyps);
        let lr = OrgOwnershipHelper._militaryRank(lTyps);
        if (hr > 0) {
            if (lr > 0) 
                return hr < lr;
            else if (hr === 3 && ((lTyps.includes("войсковая часть") || lTyps.includes("військова частина")))) 
                return true;
        }
        else if (hTyps.includes("войсковая часть") || hTyps.includes("військова частина")) {
            if (lr >= 6) 
                return true;
        }
        if (lr >= 6) {
            if (higher.containsProfile(OrgProfile.POLICY) || higher.containsProfile(OrgProfile.UNION)) 
                return true;
        }
        if (hk === OrganizationKind.STUDY || OrgOwnershipHelper._Contains(hTyps, "институт", "інститут") || OrgOwnershipHelper._Contains(hTyps, "академия", "академія")) {
            if (((OrgOwnershipHelper._Contains(lTyps, "магистратура", "магістратура") || OrgOwnershipHelper._Contains(lTyps, "аспирантура", "аспірантура") || OrgOwnershipHelper._Contains(lTyps, "докторантура", null)) || OrgOwnershipHelper._Contains(lTyps, "факультет", null) || OrgOwnershipHelper._Contains(lTyps, "кафедра", null)) || OrgOwnershipHelper._Contains(lTyps, "курс", null)) 
                return true;
        }
        if (hk !== OrganizationKind.DEPARTMENT) {
            if (((((OrgOwnershipHelper._Contains(lTyps, "департамент", null) || OrgOwnershipHelper._Contains(lTyps, "центр", null))) && hk !== OrganizationKind.MEDICAL && hk !== OrganizationKind.SCIENCE) && !OrgOwnershipHelper._Contains(hTyps, "центр", null) && !OrgOwnershipHelper._Contains(hTyps, "департамент", null)) && !OrgOwnershipHelper._Contains(hTyps, "управление", "управління")) 
                return true;
            if (OrgOwnershipHelper._Contains(hTyps, "департамент", null) || robust) {
                if (OrgOwnershipHelper._Contains(lTyps, "центр", null)) 
                    return true;
                if (lk === OrganizationKind.STUDY) 
                    return true;
            }
            if (OrgOwnershipHelper._Contains(hTyps, "служба", null) || OrgOwnershipHelper._Contains(hTyps, "штаб", null)) {
                if (OrgOwnershipHelper._Contains(lTyps, "управление", "управління")) 
                    return true;
            }
            if (hk === OrganizationKind.BANK) {
                if (OrgOwnershipHelper._Contains(lTyps, "управление", "управління") || OrgOwnershipHelper._Contains(lTyps, "департамент", null)) 
                    return true;
            }
            if (hk === OrganizationKind.PARTY || hk === OrganizationKind.FEDERATION) {
                if (OrgOwnershipHelper._Contains(lTyps, "комитет", "комітет")) 
                    return true;
            }
            if ((lk === OrganizationKind.FEDERATION && hk !== OrganizationKind.FEDERATION && hk !== OrganizationKind.GOVENMENT) && hk !== OrganizationKind.PARTY) {
                if (!OrgOwnershipHelper._Contains(hTyps, "фонд", null) && hk !== OrganizationKind.UNDEFINED) 
                    return true;
            }
        }
        else if (OrgOwnershipHelper._Contains(hTyps, "управление", "управління") || OrgOwnershipHelper._Contains(hTyps, "департамент", null)) {
            if (!OrgOwnershipHelper._Contains(lTyps, "управление", "управління") && !OrgOwnershipHelper._Contains(lTyps, "департамент", null) && lk === OrganizationKind.DEPARTMENT) 
                return true;
            if (OrgOwnershipHelper._Contains(hTyps, "главное", "головне") && OrgOwnershipHelper._Contains(hTyps, "управление", "управління")) {
                if (OrgOwnershipHelper._Contains(lTyps, "департамент", null)) 
                    return true;
                if (OrgOwnershipHelper._Contains(lTyps, "управление", "управління")) {
                    if (!lTyps.includes("главное управление") && !lTyps.includes("головне управління") && !lTyps.includes("пограничное управление")) 
                        return true;
                }
            }
            if (OrgOwnershipHelper._Contains(hTyps, "управление", "управління") && OrgOwnershipHelper._Contains(lTyps, "центр", null)) 
                return true;
            if (OrgOwnershipHelper._Contains(hTyps, "департамент", null) && OrgOwnershipHelper._Contains(lTyps, "управление", "управління")) 
                return true;
        }
        else if ((lk === OrganizationKind.GOVENMENT && OrgOwnershipHelper._Contains(lTyps, "служба", null) && higher.higher !== null) && higher.higher.kind === OrganizationKind.GOVENMENT) 
            return true;
        else if (OrgOwnershipHelper._Contains(hTyps, "отдел", "відділ") && lk === OrganizationKind.DEPARTMENT && ((OrgOwnershipHelper._Contains(lTyps, "стол", "стіл") || OrgOwnershipHelper._Contains(lTyps, "направление", "напрямок") || OrgOwnershipHelper._Contains(lTyps, "отделение", "відділ")))) 
            return true;
        if (hk === OrganizationKind.BANK) {
            if (higher.names.includes("СБЕРЕГАТЕЛЬНЫЙ БАНК")) {
                if (lk === OrganizationKind.BANK && !lower.names.includes("СБЕРЕГАТЕЛЬНЫЙ БАНК")) 
                    return true;
            }
        }
        if (lk === OrganizationKind.MEDICAL) {
            if (hTyps.includes("департамент")) 
                return true;
        }
        if (lk === OrganizationKind.DEPARTMENT) {
            if (hk === OrganizationKind.DEPARTMENT && higher.higher !== null && hTyps.length === 0) {
                if (OrgOwnershipHelper.canBeHigher(higher.higher, lower, false)) {
                    if (OrgOwnershipHelper._Contains(lTyps, "управление", "управління") || OrgOwnershipHelper._Contains(lTyps, "отдел", "відділ")) 
                        return true;
                }
            }
            if (OrgOwnershipHelper._Contains(lTyps, "офис", "офіс")) {
                if (OrgOwnershipHelper._Contains(hTyps, "филиал", "філіал") || OrgOwnershipHelper._Contains(hTyps, "отделение", "відділення")) 
                    return true;
            }
            if (lTyps.includes("дежурная часть")) 
                return true;
        }
        if (OrgOwnershipHelper._Contains(lTyps, "управление", "управління") || OrgOwnershipHelper._Contains(lTyps, "отдел", "відділ")) {
            let str = higher.toStringEx(true, null, 0);
            if (Utils.startsWithString(str, "ГУ", true)) 
                return true;
        }
        return false;
    }
    
    static _militaryRank(li) {
        if (OrgOwnershipHelper._Contains(li, "фронт", null)) 
            return 1;
        if (OrgOwnershipHelper._Contains(li, "группа армий", "група армій")) 
            return 2;
        if (OrgOwnershipHelper._Contains(li, "армия", "армія")) 
            return 3;
        if (OrgOwnershipHelper._Contains(li, "корпус", null)) 
            return 4;
        if (OrgOwnershipHelper._Contains(li, "округ", null)) 
            return 5;
        if (OrgOwnershipHelper._Contains(li, "дивизия", "дивізія")) 
            return 6;
        if (OrgOwnershipHelper._Contains(li, "бригада", null)) 
            return 7;
        if (OrgOwnershipHelper._Contains(li, "полк", null)) 
            return 8;
        if (OrgOwnershipHelper._Contains(li, "батальон", "батальйон") || OrgOwnershipHelper._Contains(li, "дивизион", "дивізіон")) 
            return 9;
        if (OrgOwnershipHelper._Contains(li, "рота", null) || OrgOwnershipHelper._Contains(li, "батарея", null) || OrgOwnershipHelper._Contains(li, "эскадрон", "ескадрон")) 
            return 10;
        if (OrgOwnershipHelper._Contains(li, "взвод", null) || OrgOwnershipHelper._Contains(li, "отряд", "загін")) 
            return 11;
        return -1;
    }
    
    static _Contains(li, v, v2 = null) {
        for (const l of li) {
            if (l.includes(v)) 
                return true;
        }
        if (v2 !== null) {
            for (const l of li) {
                if (l.includes(v2)) 
                    return true;
            }
        }
        return false;
    }
}


module.exports = OrgOwnershipHelper