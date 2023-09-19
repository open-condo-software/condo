/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const Referent = require("./../../Referent");
const MiscHelper = require("./../../core/MiscHelper");
const AddressDetailType = require("./../AddressDetailType");
const MetaToken = require("./../../MetaToken");
const NumberToken = require("./../../NumberToken");
const GeoReferent = require("./../../geo/GeoReferent");
const ReferentToken = require("./../../ReferentToken");
const AddressHouseType = require("./../AddressHouseType");
const StreetReferent = require("./../StreetReferent");
const Token = require("./../../Token");
const AddressItemType = require("./AddressItemType");
const AddressBuildingType = require("./../AddressBuildingType");
const GeoOwnerHelper = require("./../../geo/internal/GeoOwnerHelper");
const StreetKind = require("./../StreetKind");
const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
const TerrItemToken = require("./../../geo/internal/TerrItemToken");
const AddressReferent = require("./../AddressReferent");
const AddressItemToken = require("./AddressItemToken");

class AddressDefineHelper {
    
    static tryDefine(li, t, ad, ignoreStreet = false) {
        if (li === null || li.length === 0) 
            return null;
        let empty = true;
        let notEmpty = false;
        let badOrg = false;
        let hasGeo = false;
        let hasStreet = false;
        for (let ii = 0; ii < li.length; ii++) {
            let v = li[ii];
            if (v.typ === AddressItemType.BUILDING && (ii < 2) && ((ii + 1) < li.length)) {
                if (li[ii].isDoubt || li[ii].typ === AddressItemType.BUILDING) {
                    let ok = false;
                    if (ii > 0 && li[ii - 1].typ === AddressItemType.CITY) 
                        ok = true;
                    for (let jj = ii + 1; jj < li.length; jj++) {
                        if (li[jj].typ !== AddressItemType.STREET) 
                            ok = false;
                    }
                    if (!ok) 
                        return null;
                }
            }
            if ((v.buildingType === AddressBuildingType.LITER && v.lengthChar === 1 && ((ii + 1) < li.length)) && li[ii + 1].typ === AddressItemType.STREET) {
                li.splice(ii, 1);
                ii--;
                continue;
            }
            if (v.typ === AddressItemType.NUMBER || v.typ === AddressItemType.ZIP || v.typ === AddressItemType.DETAIL) {
            }
            else if (v.typ === AddressItemType.HOUSE && ((v.isDoubt || v.houseType === AddressHouseType.SPECIAL))) {
            }
            else if (v.typ !== AddressItemType.STREET) {
                empty = false;
                if (v.typ !== AddressItemType.CITY && v.typ !== AddressItemType.COUNTRY && v.typ !== AddressItemType.REGION) 
                    notEmpty = true;
                if (v.typ === AddressItemType.CITY || v.typ === AddressItemType.REGION || v.typ === AddressItemType.COUNTRY) 
                    hasGeo = true;
            }
            else if (v.referent instanceof StreetReferent) {
                hasStreet = true;
                if (MiscLocationHelper.isUserParamAddress(v)) {
                    empty = false;
                    notEmpty = true;
                    continue;
                }
                let s = Utils.as(v.referent, StreetReferent);
                if (s.kind === StreetKind.RAILWAY && s.numbers === null) {
                }
                else if (s.kind === StreetKind.ORG || v.refToken !== null) {
                    if (v.isDoubt && v.refToken !== null && !v.refTokenIsGsk) 
                        badOrg = true;
                    if (badOrg) {
                        if (v === li[0]) 
                            return null;
                        else if (li[0].typ === AddressItemType.PREFIX && v === li[1]) 
                            return null;
                    }
                }
                else if (s.kind === StreetKind.AREA) 
                    hasStreet = true;
                else {
                    hasStreet = true;
                    empty = false;
                    notEmpty = true;
                }
            }
        }
        if (ignoreStreet) {
        }
        else {
            if (empty) 
                return null;
            if (!notEmpty) {
                for (const v of li) {
                    if (v !== li[0] && v.isNewlineBefore) 
                        return null;
                }
                if (badOrg && !MiscLocationHelper.isUserParamAddress(li[0])) 
                    return null;
                if (li[0].typ === AddressItemType.STREET && li[0].referent.kind === StreetKind.ORG) 
                    return null;
                if (li.length === 1 && li[0].typ !== AddressItemType.STREET) {
                    if (li[0].detailType !== AddressDetailType.UNDEFINED && MiscLocationHelper.isUserParamAddress(li[0])) {
                    }
                    else if (li[0].detailMeters > 0) {
                    }
                    else 
                        return null;
                }
            }
            if (!hasGeo && !hasStreet) 
                return null;
        }
        if ((li.length > 3 && li[0].typ === AddressItemType.CITY && li[1].typ === AddressItemType.STREET) && li[2].typ === AddressItemType.CITY && li[3].typ === AddressItemType.STREET) {
            if (li[1].referent.kind === StreetKind.RAILWAY || li[1].referent.kind === StreetKind.ROAD) {
                let geo = Utils.as(li[2].referent, GeoReferent);
                if (geo !== null && geo.higher === null && GeoOwnerHelper.canBeHigher(Utils.as(li[0].referent, GeoReferent), geo, null, null)) {
                    geo.higher = Utils.as(li[0].referent, GeoReferent);
                    li[2] = li[2].clone();
                    li[2].beginToken = li[0].beginToken;
                    li.splice(0, 2);
                }
            }
        }
        if (li.length >= 2 && li[0].typ === AddressItemType.BLOCK && li[1].typ === AddressItemType.STREET) 
            return null;
        if (li.length >= 2 && li[0].typ === AddressItemType.CITY && li[1].typ === AddressItemType.BUILDING) {
            if (li[1].beginToken.isValue("СТР", null) && !MiscLocationHelper.isUserParamAddress(li[1])) 
                return null;
        }
        if (li[0].typ === AddressItemType.STREET && !MiscLocationHelper.isUserParamAddress(li[0])) {
            if (li[0].refToken !== null) {
                if (!li[0].refTokenIsGsk || li[0].referent.kind === StreetKind.AREA) 
                    return null;
            }
        }
        if (li[0].typ === AddressItemType.STREET && MiscLocationHelper.isUserParamAddress(li[0])) {
            let ok = true;
            for (const it of li) {
                if ((it.typ === AddressItemType.ZIP || it.typ === AddressItemType.REGION || it.typ === AddressItemType.CITY) || it.typ === AddressItemType.COUNTRY) 
                    ok = false;
            }
            if (ok) {
                let tt = li[li.length - 1].endToken.next;
                while (tt !== null) {
                    if (tt.isComma) 
                        tt = tt.next;
                    else 
                        break;
                }
                let ter = TerrItemToken.tryParse(tt, null, null);
                if (ter !== null && ter.terminItem === null && ter.ontoItem === null) {
                    let tt2 = ter.endToken.next;
                    while (tt2 !== null) {
                        if (tt2.isComma) 
                            tt2 = tt2.next;
                        else 
                            break;
                    }
                    if (tt2 !== null && (tt2.getReferent() instanceof GeoReferent) && tt2.getReferent().isCity) {
                        let li2 = AddressItemToken.tryParseList(tt2, 20);
                        if (li2 !== null) 
                            li.splice(li.length, 0, ...li2);
                    }
                }
            }
        }
        let addr = new AddressReferent();
        let streets = new Array();
        let i = 0;
        let j = 0;
        let metro = null;
        let details = new Array();
        let geos = null;
        let err = false;
        let cross = false;
        let hasGenplan = false;
        for (i = 0; i < li.length; i++) {
            if ((li[i].typ === AddressItemType.DETAIL && li[i].detailType === AddressDetailType.CROSS && ((i + 2) < li.length)) && li[i + 1].typ === AddressItemType.STREET && li[i + 2].typ === AddressItemType.STREET) {
                cross = true;
                streets.push(li[i + 1]);
                streets.push(li[i + 2]);
                li[i + 1].endToken = li[i + 2].endToken;
                li[i].tag = addr;
                li[i + 1].tag = addr;
                li.splice(i + 2, 1);
                break;
            }
            else if (li[i].typ === AddressItemType.STREET) {
                if (((li[i].refToken !== null && !li[i].refTokenIsGsk)) && streets.length === 0) {
                    if (i > 0 && li[i].isNewlineBefore) {
                        err = true;
                        li.splice(i, li.length - i);
                        break;
                    }
                    else if ((i + 1) === li.length) 
                        err = details.length === 0;
                    else if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.NUMBER) 
                        err = true;
                    if (err && geos !== null) {
                        for (let ii = i - 1; ii >= 0; ii--) {
                            if (li[ii].typ === AddressItemType.ZIP || li[ii].typ === AddressItemType.PREFIX) 
                                err = false;
                        }
                    }
                    if (err && !MiscLocationHelper.isUserParamAddress(li[i])) 
                        break;
                }
                if (li[i].detailType !== AddressDetailType.UNDEFINED) 
                    details.push(li[i]);
                li[i].tag = addr;
                streets.push(li[i]);
                if (li[i].referent2 !== null) 
                    cross = true;
                if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.STREET) {
                }
                else if ((((i + 2) < li.length) && li[i + 2].typ === AddressItemType.STREET && li[i + 1].isHouse) && (i + 3) === li.length && !li[i + 2].refTokenIsGsk) 
                    i++;
                else if (((((i + 4) < li.length) && ((li[i + 1].typ === AddressItemType.HOUSE || li[i + 1].typ === AddressItemType.NUMBER)) && li[i + 2].typ === AddressItemType.DETAIL) && li[i + 2].detailType === AddressDetailType.CROSS && li[i + 3].typ === AddressItemType.STREET) && ((li[i + 4].typ === AddressItemType.HOUSE || li[i + 4].typ === AddressItemType.NUMBER))) {
                    cross = true;
                    li[i + 2].tag = addr;
                    streets.push(li[i + 3]);
                    li[i + 3].tag = addr;
                    li[i + 4] = li[i + 4].clone();
                    li[i + 4].value = (li[i + 1].value + "/" + li[i + 4].value);
                    li.splice(i + 1, 1);
                    i--;
                    break;
                }
                else 
                    break;
            }
            else if (li[i].typ === AddressItemType.CITY || li[i].typ === AddressItemType.REGION) {
                if (geos === null) 
                    geos = new Array();
                let geo = Utils.as(li[i].referent, GeoReferent);
                if (li[i].detailType !== AddressDetailType.UNDEFINED) {
                    details.push(li[i]);
                    if (geos.length === 0) {
                        if (geo.higher !== null) {
                            if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.STREET && (li[i + 1].referent instanceof StreetReferent)) {
                                let sr = Utils.as(li[i + 1].referent, StreetReferent);
                                if (sr.kind === StreetKind.UNDEFINED) 
                                    geos.push(geo);
                                else 
                                    geos.push(geo.higher);
                            }
                            else 
                                geos.push(geo.higher);
                        }
                        else 
                            geos.push(geo);
                    }
                }
                else 
                    geos.splice(0, 0, geo);
                li[i].tag = addr;
            }
            else if (li[i].typ === AddressItemType.DETAIL) {
                details.push(li[i]);
                li[i].tag = addr;
            }
            else if (li[i].typ === AddressItemType.GENPLAN) 
                hasGenplan = true;
        }
        if ((i >= li.length && metro === null && details.length === 0) && !cross && !ignoreStreet) {
            for (i = 0; i < li.length; i++) {
                let cit = false;
                if (li[i].typ === AddressItemType.CITY) 
                    cit = true;
                else if (li[i].typ === AddressItemType.REGION) {
                    for (const s of li[i].referent.slots) {
                        if (s.typeName === GeoReferent.ATTR_TYPE) {
                            let ss = Utils.asString(s.value);
                            if (ss.includes("посел") || ss.includes("сельск") || ss.includes("почтовое отделение")) 
                                cit = true;
                        }
                    }
                }
                if (cit) {
                    if (((i + 1) < li.length) && (((((((li[i + 1].typ === AddressItemType.HOUSE || li[i + 1].typ === AddressItemType.BLOCK || li[i + 1].typ === AddressItemType.SPACE) || li[i + 1].typ === AddressItemType.PLOT || li[i + 1].typ === AddressItemType.FIELD) || li[i + 1].typ === AddressItemType.BUILDING || li[i + 1].typ === AddressItemType.CORPUS) || li[i + 1].typ === AddressItemType.POSTOFFICEBOX || li[i + 1].typ === AddressItemType.DELIVERYAREA) || li[i + 1].typ === AddressItemType.PART || li[i + 1].typ === AddressItemType.CSP) || li[i + 1].typ === AddressItemType.GENPLAN))) 
                        break;
                    if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.NUMBER) {
                        if (li[i].endToken.next.isComma) {
                            if ((li[i].referent instanceof GeoReferent) && !li[i].referent.isBigCity && li[i].referent.isCity) {
                                li[i + 1].typ = AddressItemType.HOUSE;
                                li[i + 1].isDoubt = true;
                                break;
                            }
                        }
                    }
                    if (li[0].typ === AddressItemType.ZIP || li[0].typ === AddressItemType.PREFIX) 
                        break;
                    continue;
                }
                if (li[i].typ === AddressItemType.REGION) {
                    if ((li[i].referent instanceof GeoReferent) && li[i].referent.higher !== null && li[i].referent.higher.isCity) {
                        if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.HOUSE) 
                            break;
                    }
                }
            }
            if (i >= li.length) 
                return null;
        }
        if (err && !MiscLocationHelper.isUserParamAddress(li[0])) 
            return null;
        let i0 = i;
        if (i > 0 && li[i - 1].typ === AddressItemType.HOUSE && li[i - 1].isDigit) {
            addr.addSlot(AddressReferent.ATTR_HOUSE, li[i - 1].value, false, 0).tag = li[i - 1];
            if (li[i - 1].houseType !== AddressHouseType.UNDEFINED) 
                addr.houseType = li[i - 1].houseType;
            li[i - 1].tag = addr;
        }
        else if ((i > 0 && li[i - 1].typ === AddressItemType.KILOMETER && li[i - 1].isDigit) && (i < li.length) && li[i].isStreetRoad) {
            addr.addSlot(AddressReferent.ATTR_KILOMETER, li[i - 1].value, false, 0).tag = li[i - 1];
            li[i - 1].tag = addr;
        }
        else {
            if (i >= li.length) 
                i = -1;
            for (i = 0; i < li.length; i++) {
                if (li[i].tag !== null) 
                    continue;
                if (li[i].typ === AddressItemType.HOUSE) {
                    if (addr.house !== null) 
                        break;
                    if (li[i].value !== null || MiscLocationHelper.isUserParamAddress(li[i])) {
                        let attr = AddressReferent.ATTR_HOUSE;
                        if (li[i].isDoubt) {
                            attr = AddressReferent.ATTR_HOUSEORPLOT;
                            if (((i + 1) < li.length) && (((li[i + 1].typ === AddressItemType.FLAT || li[i + 1].typ === AddressItemType.POTCH || li[i + 1].typ === AddressItemType.FLOOR) || li[i + 1].typ === AddressItemType.NUMBER))) 
                                attr = AddressReferent.ATTR_HOUSE;
                        }
                        addr.addSlot(attr, (li[i].value != null ? li[i].value : "0"), false, 0).tag = li[i];
                        if (li[i].houseType !== AddressHouseType.UNDEFINED) 
                            addr.houseType = li[i].houseType;
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.KILOMETER && li[i].isDigit && (((i0 < li.length) && li[i0].isStreetRoad))) {
                    if (addr.kilometer !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_KILOMETER, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.PLOT) {
                    if (addr.plot !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_PLOT, (li[i].value != null ? li[i].value : "0"), false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.FIELD) {
                    if (addr.field !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_FIELD, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.GENPLAN) {
                    if (addr.genplan !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_GENPLAN, (li[i].value != null ? li[i].value : "0"), false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.BOX && li[i].isDigit) {
                    if (addr.box !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_BOX, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.WELL && li[i].isDigit) {
                    if (addr.well !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_WELL, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.CARPLACE) {
                    if (addr.carplace !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_CARPLACE, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.PART && li[i].isDigit) {
                    if (addr.part !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_PART, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.SPACE) {
                    if (addr.space !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_SPACE, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.BLOCK && li[i].value !== null) {
                    if (addr.block !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_BLOCK, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.CORPUS) {
                    if (addr.corpus !== null) 
                        break;
                    if (li[i].value !== null) {
                        let s = addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0);
                        if (s !== null) 
                            s.tag = li[i];
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.BUILDING) {
                    if (addr.building !== null) 
                        break;
                    if (li[i].value !== null) {
                        let s = addr.addSlot(AddressReferent.ATTR_BUILDING, li[i].value, false, 0);
                        if (s !== null) 
                            s.tag = li[i];
                        if (li[i].buildingType !== AddressBuildingType.UNDEFINED) 
                            addr.buildingType = li[i].buildingType;
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.FLOOR && li[i].isDigit) {
                    if (addr.floor !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_FLOOR, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.POTCH && li[i].isDigit) {
                    if (addr.potch !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_PORCH, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.FLAT) {
                    if (addr.flat !== null) 
                        break;
                    if (li[i].value !== null) 
                        addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.PAVILION) {
                    if (addr.pavilion !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_PAVILION, (li[i].value != null ? li[i].value : "0"), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.OFFICE && li[i].isDigit) {
                    if (addr.office !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_OFFICE, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.ROOM && li[i].isDigit) {
                    if (addr.room !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_ROOM, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.PANTRY) {
                    if (addr.pantry !== null) 
                        break;
                    let s = addr.addSlot(AddressReferent.ATTR_PANTRY, li[i].value, false, 0);
                    if (s !== null) 
                        s.tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.CORPUSORFLAT && ((li[i].isDigit || li[i].value === null))) {
                    for (j = i + 1; j < li.length; j++) {
                        if (li[j].isDigit) {
                            if ((((li[j].typ === AddressItemType.FLAT || li[j].typ === AddressItemType.CORPUSORFLAT || li[j].typ === AddressItemType.OFFICE) || li[j].typ === AddressItemType.FLOOR || li[j].typ === AddressItemType.POTCH) || li[j].typ === AddressItemType.DELIVERYAREA || li[j].typ === AddressItemType.POSTOFFICEBOX) || li[j].typ === AddressItemType.BUILDING || li[j].typ === AddressItemType.PAVILION) 
                                break;
                        }
                    }
                    if (li[i].value !== null) {
                        if ((j < li.length) && addr.corpus === null) 
                            addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                        else if (addr.corpus !== null) 
                            addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                        else if ((i + 2) === li.length && li[i + 1].typ === AddressItemType.NUMBER) {
                            addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                            i++;
                            addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                        }
                        else 
                            addr.addSlot(AddressReferent.ATTR_CORPUSORFLAT, li[i].value, false, 0).tag = li[i];
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.NUMBER && li[i].isDigit && ((((!li[i].isNewlineBefore && i > 0 && li[i - 1].typ === AddressItemType.STREET)) || ignoreStreet || li[i].isGenplan))) {
                    let v = 0;
                    let wrapv285 = new RefOutArgWrapper();
                    let inoutres286 = Utils.tryParseInt(li[i].value, wrapv285);
                    v = wrapv285.value;
                    if (!inoutres286) {
                        let wrapv279 = new RefOutArgWrapper();
                        let inoutres280 = Utils.tryParseInt(li[i].value.substring(0, 0 + li[i].value.length - 1), wrapv279);
                        v = wrapv279.value;
                        if (!inoutres280) {
                            if (!li[i].value.includes("/")) 
                                break;
                        }
                    }
                    if (v > 500 && !MiscLocationHelper.isUserParamAddress(li[0]) && !ignoreStreet) 
                        break;
                    let attr = AddressReferent.ATTR_HOUSEORPLOT;
                    let ii = i + 1;
                    if ((ii < li.length) && li[ii].typ === AddressItemType.DETAIL) 
                        ii++;
                    if ((ii < li.length) && ((((li[ii].typ === AddressItemType.FLAT || li[ii].typ === AddressItemType.POTCH || li[ii].typ === AddressItemType.CORPUS) || li[ii].typ === AddressItemType.BUILDING || li[ii].typ === AddressItemType.FLOOR) || li[ii].typ === AddressItemType.NUMBER || ((li[ii].typ === AddressItemType.STREET && li[ii].refTokenIsGsk))))) 
                        attr = AddressReferent.ATTR_HOUSE;
                    addr.addSlot(attr, li[i].value, false, 0).tag = li[i];
                    if (li[i].isGenplan) {
                        if (addr.genplan === null) 
                            addr.addSlot(AddressReferent.ATTR_GENPLAN, "0", false, 0);
                    }
                    li[i].tag = addr;
                    if (((i + 1) < li.length) && ((li[i + 1].typ === AddressItemType.NUMBER || li[i + 1].typ === AddressItemType.FLAT)) && !li[i + 1].isNewlineBefore) {
                        let wrapv283 = new RefOutArgWrapper();
                        let inoutres284 = Utils.tryParseInt(li[i + 1].value, wrapv283);
                        v = wrapv283.value;
                        if (inoutres284) {
                            if (v > 500 && !MiscLocationHelper.isUserParamAddress(li[0])) 
                                break;
                        }
                        i++;
                        if ((li[i].typ === AddressItemType.NUMBER && li[i].value !== null && (i + 1) === (li.length - 1)) && ((li[i + 1].typ === AddressItemType.NUMBER || li[i + 1].typ === AddressItemType.FLAT))) {
                            addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                            li[i].tag = addr;
                            i++;
                            if (li[i].value !== null) {
                                addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                                li[i].tag = addr;
                            }
                            continue;
                        }
                        if ((((i + 1) < li.length) && li[i + 1].typ === AddressItemType.BUILDING && !li[i + 1].isNewlineBefore) && li[i + 1].buildingType === AddressBuildingType.LITER) {
                            addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                            li[i].tag = addr;
                            continue;
                        }
                        if ((li[i].typ === AddressItemType.NUMBER && li[i].endToken.next !== null && li[i].endToken.next.isComma) && li[i].beginToken.previous.isComma) {
                            if (((i + 1) < li.length) && ((li[i + 1].typ === AddressItemType.CORPUS || li[i + 1].typ === AddressItemType.CORPUSORFLAT))) {
                                addr.addSlot(AddressReferent.ATTR_BUILDING, li[i].value, false, 0).tag = li[i];
                                li[i].tag = addr;
                                continue;
                            }
                            else {
                                addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                                li[i].tag = addr;
                                continue;
                            }
                        }
                        if ((((i + 1) < li.length) && li[i + 1].typ === AddressItemType.NUMBER && !li[i + 1].isNewlineBefore) && (v < 5) && li[i].value !== null) {
                            let wrapv281 = new RefOutArgWrapper();
                            let inoutres282 = Utils.tryParseInt(li[i + 1].value, wrapv281);
                            v = wrapv281.value;
                            if (inoutres282) {
                                if ((v < 500) || MiscLocationHelper.isUserParamAddress(li[0])) {
                                    addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                                    li[i].tag = addr;
                                    i++;
                                }
                            }
                        }
                        if (li[i].beginToken.previous.isHiphen || addr.findSlot(AddressReferent.ATTR_CORPUS, null, true) !== null || li[i].value === null) 
                            addr.addSlot(AddressReferent.ATTR_FLAT, (li[i].value != null ? li[i].value : ""), false, 0).tag = li[i];
                        else 
                            addr.addSlot(AddressReferent.ATTR_CORPUSORFLAT, li[i].value, false, 0).tag = li[i];
                        li[i].tag = addr;
                    }
                }
                else if ((!li[i].isNewlineBefore && li[i].typ === AddressItemType.NUMBER && li[i].isDigit) && li[i].value !== null && (((li[i - 1].typ === AddressItemType.NUMBER || li[i - 1].typ === AddressItemType.HOUSE || li[i - 1].typ === AddressItemType.BUILDING) || li[i - 1].typ === AddressItemType.CORPUS))) {
                    if (addr.flat !== null) 
                        break;
                    if (addr.house === null && addr.building === null && addr.corpus === null) 
                        break;
                    if (((i + 1) < li.length) && ((li[i + 1].typ === AddressItemType.NUMBER || li[i + 1].typ === AddressItemType.FLAT))) {
                        addr.addSlot(AddressReferent.ATTR_CORPUS, li[i].value, false, 0).tag = li[i];
                        li[i].tag = addr;
                        i++;
                        if (li[i].value !== null) 
                            addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                        li[i].tag = addr;
                    }
                    else {
                        addr.addSlot(AddressReferent.ATTR_FLAT, li[i].value, false, 0).tag = li[i];
                        li[i].tag = addr;
                    }
                }
                else if (li[i].typ === AddressItemType.CITY) {
                    if (geos === null) 
                        geos = new Array();
                    if (li[i].isNewlineBefore) {
                        if (geos.length > 0) {
                            if ((i > 0 && li[i - 1].typ !== AddressItemType.CITY && li[i - 1].typ !== AddressItemType.REGION) && li[i - 1].typ !== AddressItemType.ZIP && li[i - 1].typ !== AddressItemType.PREFIX) 
                                break;
                        }
                        if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.STREET && i > i0) 
                            break;
                    }
                    if (li[i].detailType !== AddressDetailType.UNDEFINED) {
                        details.push(li[i]);
                        li[i].tag = addr;
                        if (geos.length > 0) 
                            continue;
                    }
                    if (geos.length > 0) {
                        if (li[i].referent.higher === geos[0]) 
                            geos.splice(0, 1);
                    }
                    let ii = 0;
                    for (ii = 0; ii < geos.length; ii++) {
                        if (geos[ii].isCity) 
                            break;
                    }
                    if (ii >= geos.length) 
                        geos.push(Utils.as(li[i].referent, GeoReferent));
                    else if (i > 0 && li[i].isNewlineBefore && i > i0) {
                        let jj = 0;
                        for (jj = 0; jj < i; jj++) {
                            if ((li[jj].typ !== AddressItemType.PREFIX && li[jj].typ !== AddressItemType.ZIP && li[jj].typ !== AddressItemType.REGION) && li[jj].typ !== AddressItemType.COUNTRY && li[jj].typ !== AddressItemType.CITY) 
                                break;
                        }
                        if (jj < i) 
                            break;
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.POSTOFFICEBOX) {
                    if (addr.postOfficeBox !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_POSTOFFICEBOX, (li[i].value != null ? li[i].value : ""), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.DELIVERYAREA) {
                    if (addr.deliveryArea !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_DELIVERYAREA, (li[i].value != null ? li[i].value : ""), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.CSP) {
                    if (addr.cSP !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_CSP, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.STREET) {
                    if (streets.length > 0) {
                        if (li[i].isNewlineBefore) 
                            break;
                        if (MiscHelper.canBeStartOfSentence(li[i].beginToken) && !li[i].beginToken.isChar('(')) 
                            break;
                    }
                    if (i === (li.length - 1)) {
                    }
                    else if (li[i].refToken === null && i > 0 && li[i - 1].typ !== AddressItemType.STREET) {
                        if (li[i - 1].typ === AddressItemType.HOUSE && li[i - 1].houseType === AddressHouseType.SPECIAL) {
                        }
                        else if (MiscLocationHelper.isUserParamAddress(li[i])) {
                        }
                        else 
                            break;
                    }
                    if (streets.length > 0) {
                        let ss = Utils.as(li[i].referent, StreetReferent);
                        if (ss.kind === StreetKind.ORG && li[i].isStreetDetail) {
                            details.push(li[i]);
                            li[i].tag = addr;
                            continue;
                        }
                    }
                    if (streets.length > 1) 
                        break;
                    streets.push(li[i]);
                    li[i].tag = addr;
                }
                else if ((li[i].typ === AddressItemType.NONUMBER && addr.house === null && addr.plot === null) && addr.houseOrPlot === null) {
                    addr.addSlot(AddressReferent.ATTR_HOUSEORPLOT, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (((li[i].typ === AddressItemType.NUMBER && addr.house === null && addr.corpus === null) && addr.building === null && addr.plot === null) && addr.houseOrPlot === null && ((MiscLocationHelper.isUserParamAddress(li[i]) || hasGenplan || ((i > 0 && li[i - 1].typ === AddressItemType.SPACE))))) {
                    if (addr.space !== null && addr.space !== "подвал") 
                        addr.addSlot(AddressReferent.ATTR_HOUSE, li[i].value, false, 0).tag = li[i];
                    else 
                        addr.addSlot(AddressReferent.ATTR_HOUSEORPLOT, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if ((li[i].typ === AddressItemType.NUMBER && (((addr.house !== null || addr.building !== null || addr.corpus !== null) || addr.houseOrPlot !== null)) && i > 0) && li[i - 1].typ === AddressItemType.SPACE && !li[i - 1].isDigit) {
                    addr.space = li[i].value;
                    li[i].tag = addr;
                }
                else if ((li[i].typ === AddressItemType.NUMBER && i > 0 && li[i - 1].typ === AddressItemType.FLOOR) && addr.flat === null) {
                    addr.flat = li[i].value;
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.DETAIL) {
                    if ((i + 1) === li.length && li[i].detailType === AddressDetailType.NEAR) 
                        break;
                    if (li[i].detailType === AddressDetailType.NEAR && ((i + 1) < li.length) && li[i + 1].typ === AddressItemType.CITY) {
                        details.push(li[i]);
                        li[i].tag = addr;
                        i++;
                    }
                    if (li[i].lengthChar === 1 && li[i].detailType === AddressDetailType.CROSS && ((((i + 1) === li.length || li[i + 1].typ !== AddressItemType.STREET || i === 0) || li[i - 1].typ !== AddressItemType.STREET))) {
                    }
                    else 
                        details.push(li[i]);
                    li[i].tag = addr;
                }
                else if (i > i0) 
                    break;
            }
        }
        if (streets.length === 1 && streets[0].ortoTerr !== null) 
            streets.splice(0, 0, streets[0].ortoTerr);
        let typs = new Array();
        for (const s of addr.slots) {
            if (!typs.includes(s.typeName)) 
                typs.push(s.typeName);
        }
        if (streets.length === 1 && !streets[0].isDoubt && streets[0].refToken === null) {
        }
        else if (li.length > 2 && li[0].typ === AddressItemType.ZIP && ((li[1].typ === AddressItemType.COUNTRY || li[1].typ === AddressItemType.REGION))) {
        }
        else if (ignoreStreet) {
        }
        else if ((typs.length + streets.length) < 2) {
            if (typs.length > 0) {
                if ((((((typs[0] !== AddressReferent.ATTR_STREET && typs[0] !== AddressReferent.ATTR_POSTOFFICEBOX && typs[0] !== AddressReferent.ATTR_DELIVERYAREA) && metro === null && typs[0] !== AddressReferent.ATTR_HOUSE) && typs[0] !== AddressReferent.ATTR_HOUSEORPLOT && typs[0] !== AddressReferent.ATTR_CORPUS) && typs[0] !== AddressReferent.ATTR_BUILDING && typs[0] !== AddressReferent.ATTR_PLOT) && typs[0] !== AddressReferent.ATTR_DETAIL && details.length === 0) && !cross) 
                    return null;
            }
            else if (streets.length === 0 && details.length === 0 && !cross) {
                if (li[i - 1].typ === AddressItemType.CITY && i > 2 && li[i - 2].typ === AddressItemType.ZIP) {
                }
                else 
                    return null;
            }
            else if ((i === li.length && streets.length === 1 && (streets[0].referent instanceof StreetReferent)) && streets[0].referent.findSlot(StreetReferent.ATTR_TYPE, "квартал", true) !== null && !MiscLocationHelper.isUserParamAddress(li[0])) 
                return null;
            if (geos === null) {
                let hasGeo2 = false;
                for (let tt = li[0].beginToken.previous; tt !== null; tt = tt.previous) {
                    if (tt.morph._class.isPreposition || tt.isComma) 
                        continue;
                    let r = tt.getReferent();
                    if (r === null) 
                        break;
                    if (r.typeName === "DATE" || r.typeName === "DATERANGE") 
                        continue;
                    if (r instanceof GeoReferent) {
                        if (!r.isState) {
                            if (geos === null) 
                                geos = new Array();
                            geos.push(Utils.as(r, GeoReferent));
                            hasGeo2 = true;
                        }
                    }
                    break;
                }
                if (!hasGeo2 && !MiscLocationHelper.isUserParamAddress(li[0])) {
                    if (streets.length > 0 && streets[0].refTokenIsGsk && streets[0].refToken !== null) {
                    }
                    else 
                        return null;
                }
            }
        }
        for (i = 0; i < li.length; i++) {
            if (li[i].typ === AddressItemType.PREFIX) 
                li[i].tag = addr;
            else if (li[i].tag === null) {
                if (li[i].isNewlineBefore && i > i0) {
                    let stop = false;
                    for (j = i + 1; j < li.length; j++) {
                        if (li[j].typ === AddressItemType.STREET) {
                            stop = true;
                            break;
                        }
                    }
                    if (stop) 
                        break;
                }
                if (li[i].typ === AddressItemType.COUNTRY || li[i].typ === AddressItemType.REGION || li[i].typ === AddressItemType.CITY) {
                    if (geos === null) 
                        geos = new Array();
                    if (!geos.includes(Utils.as(li[i].referent, GeoReferent))) 
                        geos.push(Utils.as(li[i].referent, GeoReferent));
                    if (li[i].typ !== AddressItemType.COUNTRY) {
                        if (li[i].detailType !== AddressDetailType.UNDEFINED && addr.detail === AddressDetailType.UNDEFINED) {
                            addr.addSlot(AddressReferent.ATTR_DETAIL, li[i].detailType.toString().toUpperCase(), false, 0).tag = li[i];
                            if (li[i].detailMeters > 0) 
                                addr.addSlot(AddressReferent.ATTR_DETAILPARAM, (String(li[i].detailMeters) + "м"), false, 0);
                        }
                    }
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.ZIP) {
                    if (addr.zip !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_ZIP, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.POSTOFFICEBOX) {
                    if (addr.postOfficeBox !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_POSTOFFICEBOX, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.DELIVERYAREA) {
                    if (addr.deliveryArea !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_DELIVERYAREA, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.CSP) {
                    if (addr.cSP !== null) 
                        break;
                    addr.addSlot(AddressReferent.ATTR_CSP, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.NUMBER && li[i].isDigit && li[i].value.length === 6) {
                    if (((i + 1) < li.length) && li[i + 1].typ === AddressItemType.CITY) {
                        if (addr.zip !== null) 
                            break;
                        addr.addSlot(AddressReferent.ATTR_ZIP, li[i].value, false, 0).tag = li[i];
                        li[i].tag = addr;
                    }
                }
                else if (li[i].typ === AddressItemType.NUMBER && (i + 1) === li.length && addr.slots.length === 0) {
                    addr.addSlot(AddressReferent.ATTR_HOUSEORPLOT, li[i].value, false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.PLOT && addr.plot === null) {
                    addr.addSlot(AddressReferent.ATTR_PLOT, (li[i].value != null ? li[i].value : "0"), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.BOX && addr.box === null) {
                    addr.addSlot(AddressReferent.ATTR_BOX, (li[i].value != null ? li[i].value : "0"), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else if (li[i].typ === AddressItemType.WELL && addr.well === null) {
                    addr.addSlot(AddressReferent.ATTR_WELL, (li[i].value != null ? li[i].value : "0"), false, 0).tag = li[i];
                    li[i].tag = addr;
                }
                else 
                    break;
            }
        }
        let t0 = null;
        let t1 = null;
        for (i = 0; i < li.length; i++) {
            if (li[i].tag !== null) {
                t0 = li[i].beginToken;
                break;
            }
        }
        for (i = li.length - 1; i >= 0; i--) {
            if (li[i].tag !== null) {
                t1 = li[i].endToken;
                break;
            }
        }
        if (t0 === null || t1 === null) 
            return null;
        if (geos !== null && geos.length > 1 && MiscLocationHelper.isUserParamAddress(t0)) {
            if (geos[0].higher === null && geos[1].higher !== null) {
                let hi = geos[1].higher;
                geos[1].higher = null;
                if (GeoOwnerHelper.canBeHigher(geos[0], geos[1], null, null) && GeoOwnerHelper.canBeHigher(hi, geos[0], null, null)) {
                    geos[0].higher = hi;
                    geos[1].higher = geos[0];
                    geos.splice(0, 1);
                }
                else 
                    geos[1].higher = hi;
            }
        }
        if (addr.slots.length === 0) {
            let pureStreets = 0;
            let gsks = 0;
            for (const s of streets) {
                if (s.refToken !== null && s.refTokenIsGsk) 
                    gsks++;
                else if (s.refToken === null) 
                    pureStreets++;
            }
            if ((pureStreets + gsks) === 0 && streets.length > 0) {
                if (((details.length > 0 || cross)) && geos !== null) {
                }
                else 
                    addr = null;
            }
            else if (streets.length < 2) {
                if ((streets.length === 1 && geos !== null && geos.length > 0) && ((streets[0].refToken === null || streets[0].refTokenIsGsk))) {
                }
                else if (details.length > 0 && geos !== null && streets.length === 0) {
                }
                else 
                    addr = null;
            }
        }
        if (addr !== null) {
            if (cross) {
                if (streets.length > 1 || ((streets.length === 1 && streets[0].referent2 !== null))) 
                    addr.detail = AddressDetailType.CROSS;
            }
            else if (details.length > 0) {
                let ty = AddressDetailType.UNDEFINED;
                let par = null;
                for (const v of details) {
                    if ((v.referent instanceof StreetReferent) && v.referent.kind === StreetKind.ORG) {
                        let org = Utils.as(v.referent.getSlotValue(StreetReferent.ATTR_REF), Referent);
                        if (org !== null && org.typeName === "ORGANIZATION") {
                            addr.addSlot(AddressReferent.ATTR_DETAILREF, org, false, 0);
                            v.referent.moveExtReferent(addr, org);
                        }
                    }
                    else if (v.referent !== null) {
                        addr.addSlot(AddressReferent.ATTR_DETAILREF, v.referent, false, 0);
                        if (v.refToken !== null) 
                            addr.addExtReferent(v.refToken);
                        let gg = Utils.as(v.referent, GeoReferent);
                        if (gg !== null && gg.higher === null && geos !== null) {
                            if (geos.length > 0 && GeoOwnerHelper.canBeHigher(geos[0], gg, null, null)) 
                                gg.higher = geos[0];
                        }
                    }
                    if (v.detailType === AddressDetailType.CROSS && (streets.length < 2)) 
                        continue;
                    if (ty === AddressDetailType.UNDEFINED || v.detailMeters > 0) {
                        if (v.detailMeters > 0) 
                            par = (String(v.detailMeters) + "м");
                        ty = v.detailType;
                    }
                    if (ty === AddressDetailType.UNDEFINED || v.detailType === AddressDetailType.RANGE) {
                        ty = v.detailType;
                        par = v.value;
                    }
                    if (v.detailParam !== null) {
                        ty = v.detailType;
                        par = v.detailParam;
                    }
                }
                if (ty !== AddressDetailType.UNDEFINED) 
                    addr.detail = ty;
                if (par !== null) 
                    addr.addSlot(AddressReferent.ATTR_DETAILPARAM, par, false, 0);
                else 
                    for (const v of li) {
                        if (v.tag !== null && v.detailMeters > 0) {
                            addr.addSlot(AddressReferent.ATTR_DETAILPARAM, (String(v.detailMeters) + "м"), false, 0);
                            break;
                        }
                    }
            }
        }
        if (geos === null && streets.length > 0 && !streets[0].isStreetRoad) {
            let cou = 0;
            for (let tt = t0.previous; tt !== null && (cou < 200); tt = tt.previous,cou++) {
                if (tt.isNewlineAfter) 
                    cou += 10;
                let r = tt.getReferent();
                if ((r instanceof GeoReferent) && !r.isState) {
                    geos = new Array();
                    geos.push(Utils.as(r, GeoReferent));
                    break;
                }
                if (r instanceof StreetReferent) {
                    let ggg = r.geos;
                    if (ggg.length > 0) {
                        geos = Array.from(ggg);
                        break;
                    }
                }
                if (r instanceof AddressReferent) {
                    let ggg = r.geos;
                    if (ggg.length > 0) {
                        geos = Array.from(ggg);
                        break;
                    }
                }
            }
        }
        let rt = null;
        let sr0 = null;
        for (let ii = 0; ii < streets.length; ii++) {
            let s = streets[ii];
            let sr = Utils.as(s.referent, StreetReferent);
            if (geos !== null && sr !== null && sr.geos.length === 0) {
                for (const gr of geos) {
                    if (gr.isCity || ((gr.higher !== null && gr.higher.isCity)) || ((gr.isRegion && sr.kind !== StreetKind.UNDEFINED))) {
                        sr.addSlot(StreetReferent.ATTR_GEO, gr, true, 0);
                        if (s.referent2 instanceof StreetReferent) 
                            s.referent2.addSlot(StreetReferent.ATTR_GEO, gr, true, 0);
                        if (li[0].referent === gr) 
                            streets[0].beginToken = li[0].beginToken;
                        for (let jj = ii + 1; jj < streets.length; jj++) {
                            if (streets[jj].referent instanceof StreetReferent) 
                                streets[jj].referent.addSlot(StreetReferent.ATTR_GEO, gr, false, 0);
                        }
                        Utils.removeItem(geos, gr);
                        break;
                    }
                    else if (gr.isRegion) {
                        let ok = false;
                        if ((sr.kind === StreetKind.RAILWAY || sr.kind === StreetKind.ROAD || sr.kind === StreetKind.AREA) || sr.kind === StreetKind.SPEC) 
                            ok = true;
                        else 
                            for (const v of gr.typs) {
                                if (v === "муниципальный округ" || v === "городской округ") 
                                    ok = true;
                            }
                        if (ok) {
                            if (li[0].referent === gr) 
                                streets[0].beginToken = li[0].beginToken;
                            sr.addSlot(StreetReferent.ATTR_GEO, gr, true, 0);
                            Utils.removeItem(geos, gr);
                            break;
                        }
                    }
                }
            }
            let isReverce = false;
            if (sr !== null && sr.geos.length === 0) {
                if (sr0 !== null) {
                    for (const g of sr0.geos) {
                        sr.addSlot(StreetReferent.ATTR_GEO, g, false, 0);
                    }
                }
                sr0 = sr;
            }
            if (s.referent !== null && s.referent.findSlot(StreetReferent.ATTR_NAME, "НЕТ", true) !== null) {
                for (const ss of s.referent.slots) {
                    if (ss.typeName === StreetReferent.ATTR_GEO) {
                        if (addr !== null) 
                            addr.addReferent(Utils.as(ss.value, Referent));
                    }
                }
            }
            else {
                if ((sr !== null && ii > 0 && (streets[ii - 1].referent instanceof StreetReferent)) && !cross) {
                    let sr00 = Utils.as(streets[ii - 1].referent, StreetReferent);
                    let ki = sr00.kind;
                    let ok2 = false;
                    if (ki !== sr.kind || ki === StreetKind.AREA || ki === StreetKind.ORG) {
                        if ((sr.kind === StreetKind.AREA || ki === StreetKind.AREA || ki === StreetKind.RAILWAY) || ki === StreetKind.ROAD || ((ki === StreetKind.ORG && sr.kind === StreetKind.UNDEFINED))) 
                            ok2 = true;
                    }
                    if (ki === StreetKind.ORG && streets[ii - 1].refTokenIsMassive) 
                        ok2 = true;
                    if (ki === StreetKind.UNDEFINED && ((sr.kind === StreetKind.ORG || sr.kind === StreetKind.AREA))) 
                        ok2 = true;
                    if ((sr.kind === StreetKind.ROAD && sr00.numbers !== null && sr00.numbers.endsWith("км")) && sr.numbers === null) {
                        ok2 = true;
                        isReverce = true;
                    }
                    if (ok2) {
                        if (sr.kind === StreetKind.AREA || sr.kind === StreetKind.ORG) {
                            if (ki === StreetKind.UNDEFINED) 
                                isReverce = true;
                        }
                        if (isReverce) {
                            streets[ii - 1].endToken = streets[ii].endToken;
                            streets[ii - 1].referent.higher = sr;
                            streets[ii - 1].referent.addSlot(StreetReferent.ATTR_GEO, null, true, 0);
                        }
                        else {
                            sr.higher = Utils.as(streets[ii - 1].referent, StreetReferent);
                            sr.addSlot(StreetReferent.ATTR_GEO, null, true, 0);
                            if (addr !== null) {
                                let slo = addr.findSlot(AddressReferent.ATTR_STREET, null, true);
                                if (slo !== null) 
                                    Utils.removeItem(addr.slots, slo);
                            }
                            s.beginToken = t0;
                        }
                    }
                }
                if (addr !== null) {
                    addr.moveExtReferent(s.referent, null);
                    if (s.referent2 !== null) 
                        addr.moveExtReferent(s.referent2, null);
                }
                let hi = ii > 0 && streets[ii - 1].referent.higher === s.referent;
                s.referent = ad.registerReferent(s.referent);
                if (hi) 
                    streets[ii - 1].referent.higher = Utils.as(s.referent, StreetReferent);
                if (addr !== null && !isReverce) 
                    addr.addReferent(s.referent);
                if (s.referent2 !== null) {
                    s.referent2 = ad.registerReferent(s.referent2);
                    if (addr !== null && !isReverce) 
                        addr.addReferent(s.referent2);
                }
                for (let tt = s.beginToken.previous; tt !== null && tt.beginChar >= t0.beginChar; tt = tt.previous) {
                    let g = Utils.as(tt.getReferent(), GeoReferent);
                    if (g === null || sr === null) 
                        continue;
                    for (const gg of sr.geos) {
                        if (gg.topHigher === g.topHigher) 
                            s.beginToken = tt;
                    }
                }
                t = (rt = new ReferentToken(s.referent, s.beginToken, s.endToken));
                t.kit.embedToken(rt);
                if (isReverce && (t.previous instanceof ReferentToken)) {
                    rt = new ReferentToken(t.previous.getReferent(), t.previous, t);
                    t.kit.embedToken(rt);
                    t = rt;
                }
                if (s.beginChar === t0.beginChar) 
                    t0 = rt;
                if (s.endChar === t1.endChar) 
                    t1 = rt;
            }
        }
        if (addr !== null) {
            let ok = false;
            for (const s of addr.slots) {
                if (s.typeName !== AddressReferent.ATTR_DETAIL) 
                    ok = true;
            }
            if (!ok) 
                addr = null;
        }
        if (addr === null) 
            return t;
        if (geos !== null && geos.length > 0) {
            if ((geos.length === 1 && geos[0].isRegion && streets.length === 1) && streets[0].refToken !== null) {
            }
            if (streets.length === 1 && streets[0].referent !== null) {
                for (const s of streets[0].referent.slots) {
                    if (s.typeName === StreetReferent.ATTR_GEO && (s.value instanceof GeoReferent)) {
                        let k = 0;
                        for (let gg = Utils.as(s.value, GeoReferent); gg !== null && (k < 5); gg = Utils.as(gg.parentReferent, GeoReferent),k++) {
                            for (let ii = geos.length - 1; ii >= 0; ii--) {
                                if (geos[ii] === gg) {
                                    geos.splice(ii, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            while (geos.length >= 2) {
                if (geos[1].higher === null && GeoOwnerHelper.canBeHigher(geos[0], geos[1], null, null)) {
                    geos[1].higher = geos[0];
                    geos.splice(0, 1);
                }
                else if (geos[0].higher === null && GeoOwnerHelper.canBeHigher(geos[1], geos[0], null, null)) {
                    geos[0].higher = geos[1];
                    geos.splice(1, 1);
                }
                else if (geos[1].higher !== null && geos[1].higher.higher === null && GeoOwnerHelper.canBeHigher(geos[0], geos[1].higher, null, null)) {
                    geos[1].higher.higher = geos[0];
                    geos.splice(0, 1);
                }
                else if (geos[0].higher !== null && geos[0].higher.higher === null && GeoOwnerHelper.canBeHigher(geos[1], geos[0].higher, null, null)) {
                    geos[0].higher.higher = geos[1];
                    geos.splice(1, 1);
                }
                else 
                    break;
            }
            for (const g of geos) {
                addr.addReferent(g);
            }
        }
        let ok1 = false;
        for (const s of addr.slots) {
            if (s.typeName !== AddressReferent.ATTR_STREET) {
                ok1 = true;
                break;
            }
        }
        if (!ok1) 
            return t;
        if (addr.house !== null && addr.corpus === null && addr.findSlot(AddressReferent.ATTR_STREET, null, true) === null) {
            if (geos !== null && geos.length > 0 && geos[0].findSlot(GeoReferent.ATTR_NAME, "ЗЕЛЕНОГРАД", true) !== null) {
                addr.corpus = addr.house;
                addr.house = null;
            }
        }
        for (let ii = addr.slots.length - 1; ii >= 0; ii--) {
            if ((typeof addr.slots[ii].value === 'string' || addr.slots[ii].value instanceof String)) {
                if ((Utils.asString(addr.slots[ii].value)) === "НЕТ") 
                    addr.slots.splice(ii, 1);
            }
        }
        if (MiscLocationHelper.isUserParamAddress(t1)) {
            let hous = false;
            let wraphous287 = new RefOutArgWrapper();
            t1 = AddressItemToken.gotoEndOfAddress(t1, wraphous287);
            hous = wraphous287.value;
            if ((hous && addr.house === null && addr.building === null) && addr.houseOrPlot === null && addr.corpus === null) 
                addr.house = "0";
        }
        if (ad !== null) 
            addr = Utils.as(ad.registerReferent(addr), AddressReferent);
        rt = new ReferentToken(addr, t0, t1);
        t.kit.embedToken(rt);
        t = rt;
        if ((t.next !== null && ((t.next.isComma || t.next.isChar(';'))) && (t.next.whitespacesAfterCount < 2)) && (t.next.next instanceof NumberToken)) {
            let last = null;
            for (const ll of li) {
                if (ll.tag !== null) 
                    last = ll;
            }
            let attrName = null;
            if (last === null) 
                return t;
            if (last.typ === AddressItemType.HOUSE) 
                attrName = AddressReferent.ATTR_HOUSE;
            else if (last.typ === AddressItemType.CORPUS) 
                attrName = AddressReferent.ATTR_CORPUS;
            else if (last.typ === AddressItemType.BUILDING) 
                attrName = AddressReferent.ATTR_BUILDING;
            else if (last.typ === AddressItemType.FLAT) 
                attrName = AddressReferent.ATTR_FLAT;
            else if (last.typ === AddressItemType.PAVILION) 
                attrName = AddressReferent.ATTR_PAVILION;
            else if (last.typ === AddressItemType.PLOT) 
                attrName = AddressReferent.ATTR_PLOT;
            else if (last.typ === AddressItemType.FIELD) 
                attrName = AddressReferent.ATTR_FIELD;
            else if (last.typ === AddressItemType.GENPLAN) 
                attrName = AddressReferent.ATTR_GENPLAN;
            else if (last.typ === AddressItemType.BOX) 
                attrName = AddressReferent.ATTR_BOX;
            else if (last.typ === AddressItemType.WELL) 
                attrName = AddressReferent.ATTR_WELL;
            else if (last.typ === AddressItemType.CARPLACE) 
                attrName = AddressReferent.ATTR_CARPLACE;
            else if (last.typ === AddressItemType.PART) 
                attrName = AddressReferent.ATTR_PART;
            else if (last.typ === AddressItemType.SPACE) 
                attrName = AddressReferent.ATTR_SPACE;
            else if (last.typ === AddressItemType.POTCH) 
                attrName = AddressReferent.ATTR_PORCH;
            else if (last.typ === AddressItemType.BLOCK) 
                attrName = AddressReferent.ATTR_BLOCK;
            else if (last.typ === AddressItemType.OFFICE) 
                attrName = AddressReferent.ATTR_OFFICE;
            else if (last.typ === AddressItemType.ROOM) 
                attrName = AddressReferent.ATTR_ROOM;
            else if (last.typ === AddressItemType.PANTRY) 
                attrName = AddressReferent.ATTR_PANTRY;
            if (attrName !== null) {
                for (t = t.next.next; t !== null; t = t.next) {
                    if (!(t instanceof NumberToken)) 
                        break;
                    let addr1 = Utils.as(addr.clone(), AddressReferent);
                    addr1.occurrence.splice(0, addr1.occurrence.length);
                    addr1.addSlot(attrName, t.value.toString(), true, 0);
                    if (ad !== null) 
                        addr1 = Utils.as(ad.registerReferent(addr1), AddressReferent);
                    rt = new ReferentToken(addr1, t, t);
                    t.kit.embedToken(rt);
                    t = rt;
                    if ((t.next !== null && ((t.next.isComma || t.next.isChar(';'))) && (t.next.whitespacesAfterCount < 2)) && (t.next.next instanceof NumberToken)) {
                    }
                    else 
                        break;
                }
            }
        }
        return t;
    }
}


module.exports = AddressDefineHelper