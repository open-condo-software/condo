/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const GeoReferent = require("./../GeoReferent");

class GeoOwnerHelper {
    
    static _getTypesString(g) {
        let tmp = new StringBuilder();
        for (const s of g.slots) {
            if (s.typeName === GeoReferent.ATTR_TYPE) 
                tmp.append(s.value).append(";");
        }
        return tmp.toString();
    }
    
    static canBeHigherToken(rhi, rlo) {
        const AddressItemToken = require("./../../address/internal/AddressItemToken");
        if (rhi === null || rlo === null) 
            return false;
        if (rhi.morph._case.isInstrumental && !rhi.morph._case.isGenitive) 
            return false;
        let hi = Utils.as(rhi.getReferent(), GeoReferent);
        let lo = Utils.as(rlo.getReferent(), GeoReferent);
        if (hi === null || lo === null) 
            return false;
        let citiInReg = false;
        if (hi.isCity && lo.isRegion) {
            if (hi.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null || hi.findSlot(GeoReferent.ATTR_TYPE, "місто", true) !== null || hi.findSlot(GeoReferent.ATTR_TYPE, "city", true) !== null) {
                let s = GeoOwnerHelper._getTypesString(lo);
                if (((s.includes("район") || s.includes("административный округ") || s.includes("муниципальный округ")) || s.includes("адміністративний округ") || s.includes("муніципальний округ")) || lo.findSlot(GeoReferent.ATTR_TYPE, "округ", true) !== null) {
                    if (rhi.next === rlo && rlo.morph._case.isGenitive) 
                        citiInReg = true;
                }
            }
        }
        if (hi.isRegion && lo.isCity) {
            if (lo.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null || lo.findSlot(GeoReferent.ATTR_TYPE, "місто", true) !== null || lo.findSlot(GeoReferent.ATTR_TYPE, "city", true) !== null) {
                let s = GeoOwnerHelper._getTypesString(hi);
                if (s === "район;") {
                    if (hi.higher !== null && hi.higher.isRegion) 
                        citiInReg = true;
                    else if (rhi.endChar <= rlo.beginChar && rhi.next.isComma && !rlo.morph._case.isGenitive) 
                        citiInReg = true;
                    else if (rhi.endChar <= rlo.beginChar && rhi.next.isComma) 
                        citiInReg = true;
                }
            }
            else 
                citiInReg = true;
        }
        if (rhi.endChar <= rlo.beginChar) {
            if (!rhi.morph._class.isAdjective) {
                if (hi.isState && !rhi.chars.isLatinLetter) 
                    return false;
            }
            if (rhi.isNewlineAfter || rlo.isNewlineBefore) {
                if (!citiInReg) {
                    if (hi.findSlot(GeoReferent.ATTR_NAME, "МОСКВА", true) !== null || hi.findSlot(GeoReferent.ATTR_NAME, "САНКТ-ПЕТЕРБУРГ", true) !== null) {
                    }
                    else 
                        return false;
                }
            }
            if (lo.findSlot("TYPE", "населенный пункт", true) !== null) 
                citiInReg = true;
        }
        else {
        }
        if (rlo.previous !== null && rlo.previous.morph._class.isPreposition) {
            if (rlo.previous.morph.language.isUa) {
                if ((rlo.previous.isValue("У", null) && !rlo.morph._case.isDative && !rlo.morph._case.isPrepositional) && !rlo.morph._case.isUndefined) 
                    return false;
                if (rlo.previous.isValue("З", null) && !rlo.morph._case.isGenitive && !rlo.morph._case.isUndefined) 
                    return false;
            }
            else {
                if ((rlo.previous.isValue("В", null) && !rlo.morph._case.isDative && !rlo.morph._case.isPrepositional) && !rlo.morph._case.isUndefined) 
                    return false;
                if (rlo.previous.isValue("ИЗ", null) && !rlo.morph._case.isGenitive && !rlo.morph._case.isUndefined) 
                    return false;
            }
        }
        if ((rhi.beginChar < rlo.endChar) && hi.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null && lo.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null) {
            if (AddressItemToken.checkStreetAfter(rlo.next, false)) 
                return true;
        }
        if (!GeoOwnerHelper.canBeHigher(hi, lo, rhi, rlo)) 
            return citiInReg;
        if (hi.findSlot(GeoReferent.ATTR_TYPE, "поселение", true) !== null && lo.findSlot(GeoReferent.ATTR_TYPE, "поселение", true) !== null) {
            if (rlo.beginChar < rhi.beginChar) 
                return false;
        }
        return true;
    }
    
    static canBeHigher(hi, lo, rhi = null, rlo = null) {
        if (hi === null || lo === null || hi === lo) 
            return false;
        if (lo.higher !== null) 
            return lo.higher === hi;
        if (lo.isState) {
            if (lo.isRegion && hi.isState && !hi.isRegion) 
                return true;
            return false;
        }
        let hit = GeoOwnerHelper._getTypesString(hi);
        let lot = GeoOwnerHelper._getTypesString(lo);
        if (hi.isCity) {
            if (lo.isRegion) {
                if (hit.includes("город;") || hit.includes("місто") || hit.includes("city")) {
                    if (((lot.includes("район") || lot.includes("административный округ") || lot.includes("сельский округ")) || lot.includes("адміністративний округ") || lot.includes("муниципальн")) || lot.includes("муніципаль")) {
                        if (hi.findSlot(GeoReferent.ATTR_NAME, lo.getStringValue(GeoReferent.ATTR_NAME), true) !== null) 
                            return false;
                        return true;
                    }
                    if (lo.findSlot(GeoReferent.ATTR_TYPE, "округ", true) !== null && !lot.includes("автономн") && !lot.includes("городской")) 
                        return true;
                }
            }
            if (lo.isCity) {
                if (!hit.includes("станция") && lot.includes("станция")) 
                    return true;
                if (!hit.includes("станція") && lot.includes("станція")) 
                    return true;
                if (hit.includes("город;") || hit.includes("місто") || hit.includes("city")) {
                    if (lot.includes("поселение")) {
                        if (hi.findSlot(GeoReferent.ATTR_NAME, lo.getStringValue(GeoReferent.ATTR_NAME), true) !== null) 
                            return false;
                        if (!lot.includes("городско")) 
                            return true;
                        else 
                            return false;
                    }
                    if ((((((lot.includes("поселок") || lot.includes("селище") || lot.includes("хутор")) || lot.includes("станица") || lot.includes("село")) || lot.includes("деревня") || lot.includes("городок")) || lot.includes("местечко") || lot.includes("аул")) || lot.includes("улус") || lot.includes("пункт")) || lot.includes("слобода")) 
                        return true;
                }
                if (hit.includes("улус")) {
                    if (lot.includes("поселение") || lot.includes("поселок") || lot.includes("село")) 
                        return true;
                }
                if (hit.includes("поселение") || hit.includes("поселок") || hit.includes("улус")) {
                    if (lot.includes("деревня") && hit.includes("коттеджный поселок")) 
                        return false;
                    if (((((lot.includes("село;") || lot.includes("деревня") || lot.includes("хутор")) || lot.includes("аул") || lot.includes("пункт")) || lot.includes("слобода") || lot.includes("станица")) || lot.includes("починок") || lot.includes("заимка")) || lot.includes("местечко")) 
                        return true;
                    if (lot === "поселение;") {
                        if (hit.includes("поселок")) 
                            return false;
                        if (rhi !== null && rlo !== null) 
                            return rhi.beginChar < rlo.endChar;
                        if (hit !== lot) 
                            return true;
                    }
                    if (lot === "поселок;") {
                        if (hit === "поселение;") 
                            return true;
                        if (lo.getSlotValue(GeoReferent.ATTR_REF) !== null && hi.getSlotValue(GeoReferent.ATTR_REF) === null) {
                            if (rhi !== null && rlo !== null) 
                                return rhi.beginChar < rlo.endChar;
                        }
                    }
                }
                if (hit.includes("деревня")) {
                    if ((lot.includes("населенный пункт") || lot.includes("коттеджный поселок") || lot.includes("хутор")) || lot.includes("слобода")) 
                        return true;
                }
                if (lot.includes("город;") && hit.includes("поселение") && !hit.includes("сельск")) {
                    if (hi.findSlot(GeoReferent.ATTR_NAME, lo.getStringValue(GeoReferent.ATTR_NAME), true) !== null) 
                        return true;
                }
                if (((hit.includes("поселение") || hit === "населенный пункт;")) && lot.includes("поселок")) 
                    return true;
                if (hit.includes("городское поселение") && lot.includes("город;")) 
                    return true;
                if (hit.includes("село;")) {
                    if (lot.includes("хутор") || lot.includes("слобода")) 
                        return true;
                    if (lot.includes("поселение") || lot.includes("поселок")) {
                        if (rhi !== null && rlo !== null && rhi.beginChar > rlo.endChar) 
                            return false;
                        return !lot.includes("сельское поселение") && !lot.includes("городское поселение");
                    }
                }
                if (hi.findSlot(GeoReferent.ATTR_NAME, "МОСКВА", true) !== null) {
                    if (lot.includes("город;") || lot.includes("місто") || lot.includes("city")) {
                        if (lo.findSlot(GeoReferent.ATTR_NAME, "ЗЕЛЕНОГРАД", true) !== null || lo.findSlot(GeoReferent.ATTR_NAME, "ТРОИЦК", true) !== null) 
                            return true;
                    }
                }
            }
        }
        else if (lo.isCity) {
            if (!lot.includes("город") && !lot.includes("місто") && !lot.includes("city")) {
                if (hi.isRegion) 
                    return true;
            }
            else {
                if (hi.isState) 
                    return true;
                if ((hit.includes("административный округ") || hit.includes("адміністративний округ") || hit.includes("муниципальн")) || hit.includes("муніципаль")) {
                    if (hi.findSlot(GeoReferent.ATTR_NAME, lo.getStringValue(GeoReferent.ATTR_NAME), true) !== null) 
                        return true;
                    return false;
                }
                if (hit.includes("сельский округ")) 
                    return false;
                if (!hit.includes("район")) 
                    return true;
                if (hi.higher !== null && hi.higher.isRegion) 
                    return true;
            }
        }
        else if (lo.isRegion) {
            for (const s of hi.slots) {
                if (s.typeName === GeoReferent.ATTR_TYPE) {
                    if ((String(s.value)) !== "регион" && (String(s.value)) !== "регіон") {
                        if (lo.findSlot(s.typeName, s.value, true) !== null) 
                            return false;
                    }
                }
            }
            if (hit.includes("почтовое отделение")) 
                return false;
            if (lot.includes("почтовое отделение")) 
                return true;
            if (hi.isState) 
                return true;
            if (lot.includes("волость")) 
                return true;
            if (lot.includes("county") || lot.includes("borough") || lot.includes("parish")) {
                if (hit.includes("state")) 
                    return true;
            }
            if (lot.includes("район")) {
                if ((hit.includes("область") || hit.includes("регион") || hit.includes("край")) || hit.includes("регіон")) 
                    return true;
                if (hit.includes("округ") && !hit.includes("сельский") && !hit.includes("поселковый")) 
                    return true;
            }
            if (lot.includes("область")) {
                if (hit.includes("край")) 
                    return true;
                if ((hit.includes("округ") && !hit.includes("сельский") && !hit.includes("поселковый")) && !hit.includes("городск")) 
                    return true;
            }
            if (lot.includes("федеральная территория")) {
                if (hit.includes("округ") || hit.includes("область") || hit.includes("край")) 
                    return true;
            }
            if (lot.includes("округ") || lot.includes("администрация")) {
                if (lot.includes("сельск") || lot.includes("поселков")) 
                    return true;
                if (hit.includes("край")) 
                    return true;
                if (lot.includes("округ")) {
                    if (hit.includes("область") || hit.includes("республика")) 
                        return true;
                }
            }
            if (lot.includes("муницип")) {
                if (hit.includes("область") || hit.includes("район") || hit.includes("округ")) 
                    return true;
            }
            if (lot.includes("межселенная терр")) {
                if (hit.includes("район") || hit.includes("округ")) 
                    return true;
            }
        }
        return false;
    }
}


module.exports = GeoOwnerHelper