/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const AddressItemType = require("./../../ner/address/internal/AddressItemType");
const BracketParseAttr = require("./../../ner/core/BracketParseAttr");
const ProcessorService = require("./../../ner/ProcessorService");
const AddressBuildingType = require("./../../ner/address/AddressBuildingType");
const TextToken = require("./../../ner/TextToken");
const SourceOfAnalysis = require("./../../ner/SourceOfAnalysis");
const TerminParseAttr = require("./../../ner/core/TerminParseAttr");
const ReferentToken = require("./../../ner/ReferentToken");
const BracketHelper = require("./../../ner/core/BracketHelper");
const OrganizationReferent = require("./../../ner/org/OrganizationReferent");
const GeoOwnerHelper = require("./../../ner/geo/internal/GeoOwnerHelper");
const ParamType = require("./../ParamType");
const NumberToken = require("./../../ner/NumberToken");
const NumberHelper = require("./../../ner/core/NumberHelper");
const CoefHelper = require("./CoefHelper");
const MiscHelper = require("./../../ner/core/MiscHelper");
const BaseAttributes = require("./../BaseAttributes");
const AddressDetailType = require("./../../ner/address/AddressDetailType");
const StreetKind = require("./../../ner/address/StreetKind");
const GarStatus = require("./../GarStatus");
const Referent = require("./../../ner/Referent");
const GeoReferent = require("./../../ner/geo/GeoReferent");
const StreetReferent = require("./../../ner/address/StreetReferent");
const GarLevel = require("./../GarLevel");
const DetailType = require("./../DetailType");
const AddrLevel = require("./../AddrLevel");
const HouseAttributes = require("./../HouseAttributes");
const GarHelper = require("./GarHelper");
const AddressItemToken = require("./../../ner/address/internal/AddressItemToken");
const AddressHelper = require("./../AddressHelper");
const AreaAttributes = require("./../AreaAttributes");
const NameAnalyzer = require("./NameAnalyzer");
const AddressReferent = require("./../../ner/address/AddressReferent");
const AddrObject = require("./../AddrObject");
const RestructHelper = require("./RestructHelper");
const TextAddress = require("./../TextAddress");
const AddressService = require("./../AddressService");
const RegionHelper = require("./RegionHelper");
const CorrectionHelper = require("./CorrectionHelper");
const HouseRoomHelper = require("./HouseRoomHelper");

class AnalyzeHelper {
    
    constructor() {
        this.m_GarHash = new Hashtable();
        this.m_Houses = new Hashtable();
        this.m_Rooms = new Hashtable();
        this.indexReadCount = 0;
        this.literaVariant = null;
        this.m_Params = null;
        this.correctedText = null;
        this.createAltsRegime = false;
    }
    
    _removeGars(addr) {
        let ret = false;
        for (let j = addr.items.length - 1; j > 0; j--) {
            let it1 = addr.items[j];
            if (it1.gars.length < 2) 
                continue;
            for (let k = j - 1; k >= 0; k--) {
                let it0 = addr.items[k];
                if (it0.gars.length === 0) 
                    continue;
                let cou = 0;
                let real = null;
                let isActual = false;
                for (const g of it1.gars) {
                    if (it0.findGarByIds(g.parentIds) !== null) {
                        cou++;
                        real = g;
                    }
                    else if (!g.expired) 
                        isActual = true;
                }
                if (cou === 1) {
                    if (isActual && real.expired) 
                        break;
                    else {
                        it1.gars.splice(0, it1.gars.length);
                        it1.gars.push(real);
                        ret = true;
                    }
                }
            }
        }
        for (let j = addr.items.length - 1; j >= 0; j--) {
            let it1 = addr.items[j];
            if (it1.gars.length !== 1) 
                continue;
            if (AddressHelper.compareLevels(it1.level, AddrLevel.STREET) > 0) 
                continue;
            for (let k = j - 1; k >= 0; k--) {
                let it0 = addr.items[k];
                if (it0.gars.length === 0) 
                    break;
                let g1 = it1.gars[0];
                let cou = 0;
                let par = null;
                for (const g of it0.gars) {
                    if (g1.parentIds.includes(g.id)) {
                        cou++;
                        par = g;
                    }
                }
                if (cou === 1 && it0.gars.length > 1) {
                    it0.gars.splice(0, it0.gars.length);
                    it0.gars.push(par);
                    ret = true;
                }
                break;
            }
        }
        for (let i = 0; i < (addr.items.length - 1); i++) {
            let it0 = addr.items[i];
            if (it0.gars.length < 2) 
                continue;
            let it1 = addr.items[i + 1];
            if (it1.gars.length !== 1) 
                continue;
            let hasPar = 0;
            for (const g of it0.gars) {
                if (it1.findGarByIds(g.parentIds) !== null) 
                    hasPar++;
            }
            if (hasPar > 0 && (hasPar < it0.gars.length)) {
                for (let j = it0.gars.length - 1; j >= 0; j--) {
                    if (it1.findGarByIds(it0.gars[j].parentIds) === null) 
                        it0.gars.splice(j, 1);
                }
            }
        }
        return ret;
    }
    
    static _correctObjectByGars(it) {
        let aa = Utils.as(it.attrs, AreaAttributes);
        if (aa === null) 
            return;
        let typs = new Array();
        let levs = new Array();
        for (const g of it.gars) {
            let isRoad = false;
            for (const ty of g.attrs.types) {
                if (!typs.includes(ty)) {
                    typs.push(ty);
                    if (ty.includes("дорога")) 
                        isRoad = true;
                }
            }
            let gl = g.level;
            if (isRoad && gl === GarLevel.LOCALITY) 
                gl = GarLevel.AREA;
            if (!levs.includes(gl)) 
                levs.push(gl);
        }
        if (aa.types.length > 0 && ((aa.types[0] === "населенный пункт" || aa.types[0] === "почтовое отделение")) && typs.length === 1) {
            aa.types[0] = typs[0];
            if (it.level === AddrLevel.LOCALITY && levs.length === 1 && levs[0] === GarLevel.CITY) 
                it.level = AddrLevel.CITY;
        }
        else if (typs.length === 1 && aa.types.length > 1 && aa.types.indexOf(typs[0]) > 0) {
            Utils.removeItem(aa.types, typs[0]);
            aa.types.splice(0, 0, typs[0]);
        }
        if (aa.types.length === 0 && typs.length === 1) 
            aa.types.push(typs[0]);
        if (aa.types.length > 1 && typs.length === 1) {
            if (aa.types.includes("проезд") && aa.types.includes("проспект")) {
                aa.types.splice(0, aa.types.length);
                aa.types.push(typs[0]);
            }
        }
        if (aa.types.length === 1 && aa.types[0] === "район" && typs.length === 1) {
            aa.types.splice(0, aa.types.length);
            aa.types.push(typs[0]);
        }
        if (aa.types.length === 0) 
            aa.types.splice(aa.types.length, 0, ...typs);
        if ((typs.length === 1 && it.level === AddrLevel.STREET && aa.types[0] !== typs[0]) && typs[0] !== "территория") {
            if ((aa.types.length === 1 && aa.types[0] === "улица" && levs.length === 1) && levs[0] === GarLevel.AREA && it.gars.length === 1) {
                aa.types.splice(0, aa.types.length);
                aa.types.push("территория");
                aa.miscs.splice(aa.miscs.length, 0, ...it.gars[0].attrs.miscs);
                it.level = AddrLevel.TERRITORY;
            }
            else {
                if (aa.types.includes(typs[0])) 
                    Utils.removeItem(aa.types, typs[0]);
                aa.types.splice(0, 0, typs[0]);
            }
        }
        if (aa.types.length > 1 && aa.types[0] === "улица") {
            aa.types.splice(0, 1);
            aa.types.push("улица");
        }
        if (aa.names.length === 0) 
            return;
        for (const g of it.gars) {
            let ga = Utils.as(g.attrs, AreaAttributes);
            for (const n of aa.names) {
                for (const gn of ga.names) {
                    if (aa.names.includes(gn)) {
                        if (gn !== aa.names[0]) {
                            Utils.removeItem(aa.names, gn);
                            aa.names.splice(0, 0, gn);
                        }
                        return;
                    }
                    else if (gn.includes(n)) {
                        if (n !== aa.names[0]) {
                            Utils.removeItem(aa.names, n);
                            aa.names.splice(0, 0, n);
                        }
                        return;
                    }
                }
            }
        }
        for (const g of it.gars) {
            let ga = Utils.as(g.attrs, AreaAttributes);
            let na = new NameAnalyzer();
            na.process(ga.names, (ga.types.length === 0 ? null : ga.types[0]));
            let aa2 = new AreaAttributes();
            AnalyzeHelper._setName(aa2, na.ref, "NAME");
            if (aa2.names.length > 0) {
                if (!aa.names.includes(aa2.names[0])) 
                    aa.names.splice(0, 0, aa2.names[0]);
                else if (ga.names[0].length === aa.names[0].length) 
                    aa.names.splice(0, 0, ga.names[0]);
                break;
            }
        }
        if (aa.types.length === 0 && it.level === AddrLevel.STREET && aa.names.length > 0) {
            if (aa.names[0].endsWith("ая")) 
                aa.types.push("улица");
        }
    }
    
    static _correctLevels(addr) {
        for (let i = 0; i < addr.items.length; i++) {
            let it = addr.items[i];
            AnalyzeHelper._correctObjectByGars(it);
            if (it.crossObject !== null) 
                AnalyzeHelper._correctObjectByGars(it.crossObject);
            if ((i + 1) >= addr.items.length) 
                continue;
            let aa = Utils.as(it.attrs, AreaAttributes);
            let it1 = addr.items[i + 1];
            if (it.level === AddrLevel.DISTRICT) {
                if (it1.level === AddrLevel.TERRITORY || it1.level === AddrLevel.STREET) {
                    if (it.attrs.types.includes("улус")) 
                        it.level = AddrLevel.LOCALITY;
                }
            }
            else if (it.level === AddrLevel.LOCALITY && it1.level === AddrLevel.LOCALITY) {
                if (it1.gars.length > 0 && it1.gars[0].level === GarLevel.AREA) 
                    it1.level = AddrLevel.TERRITORY;
            }
            else if (((it.level === AddrLevel.TERRITORY && i > 0 && (AddressHelper.compareLevels(addr.items[i - 1].level, AddrLevel.LOCALITY) < 0)) && ((it1.level === AddrLevel.TERRITORY || it1.level === AddrLevel.STREET)) && it.gars.length === 1) && ((it.gars[0].level === GarLevel.LOCALITY || it.gars[0].level === GarLevel.CITY))) {
                if (it.level === AddrLevel.TERRITORY && aa.miscs.includes("дорога")) {
                }
                else {
                    it.level = AddrLevel.LOCALITY;
                    if (aa.types.includes("территория")) 
                        Utils.removeItem(aa.types, "территория");
                    let ty = it.gars[0].attrs.types[0];
                    if (!aa.types.includes(ty)) 
                        aa.types.push(ty);
                }
            }
            else if ((it.level === AddrLevel.CITY && it.gars.length > 0 && it.gars[0].level === GarLevel.SETTLEMENT) && it1.level === AddrLevel.LOCALITY) {
                it.level = AddrLevel.SETTLEMENT;
                aa.types.splice(0, aa.types.length);
                aa.types.splice(aa.types.length, 0, ...it.gars[0].attrs.types);
            }
            else if ((it.level === AddrLevel.LOCALITY && AddressHelper.compareLevels(it1.level, AddrLevel.STREET) >= 0 && i > 0) && addr.items[i - 1].level === AddrLevel.CITY) {
                if (it.gars.length > 0 && it.gars[0].level === GarLevel.AREA) {
                    it.level = AddrLevel.TERRITORY;
                    aa.types.splice(0, aa.types.length);
                    aa.types.splice(aa.types.length, 0, ...it.gars[0].attrs.types);
                }
            }
        }
    }
    
    static _getId(v) {
        return Utils.parseInt(v.substring(1));
    }
    
    static _addParIds(parIds, ao) {
        for (const p of ao.gars) {
            let id = AnalyzeHelper._getId(p.id);
            if (!parIds.includes(id)) 
                parIds.push(id);
        }
    }
    
    static _canSearchGars(r, addr, i) {
        if (r.level === AddrLevel.TERRITORY || r.level === AddrLevel.STREET) {
            for (let j = 0; j < i; j++) {
                if (addr.items[j].gars.length > 0) {
                    let it = addr.items[j];
                    if (((it.level === AddrLevel.REGIONCITY || it.level === AddrLevel.CITY || it.level === AddrLevel.SETTLEMENT) || it.level === AddrLevel.LOCALITY || it.level === AddrLevel.UNDEFINED) || it.level === AddrLevel.TERRITORY) 
                        return true;
                    if (it.level === AddrLevel.DISTRICT) {
                        if (it.attrs.types.includes("улус") || it.attrs.types.includes("городской округ") || it.attrs.types.includes("муниципальный округ")) 
                            return true;
                        if (it.gars.length > 0) {
                            if (it.gars[0].attrs.types.includes("городской округ")) 
                                return true;
                        }
                    }
                    if (r.level === AddrLevel.TERRITORY) {
                        if (j === (i - 1) && ((it.level === AddrLevel.DISTRICT || it.level === AddrLevel.SETTLEMENT))) 
                            return true;
                        if (j === (i - 2) && it.level === AddrLevel.DISTRICT && ((addr.items[j + 1].detailTyp !== DetailType.UNDEFINED || addr.items[j + 1].level === AddrLevel.TERRITORY))) 
                            return true;
                    }
                    if (r.level === AddrLevel.STREET && i === 1) {
                        let nam = r.ref.getStringValue("NAME");
                        if (nam !== null && nam.indexOf(' ') > 0) 
                            return true;
                        if (it.gars[0].regionNumber === 50) 
                            return true;
                    }
                }
            }
            return false;
        }
        if (r.level === AddrLevel.LOCALITY && i === 0) 
            return false;
        return true;
    }
    
    _processAddress(addr, hasSecVar) {
        hasSecVar.value = false;
        if (addr.items.length === 0) 
            return null;
        let ar = null;
        let regions = new Array();
        let otherCountry = false;
        let parIds = new Array();
        let uaCountry = null;
        let rev = false;
        for (let i = 0; i < addr.items.length; i++) {
            let it = addr.items[i];
            let aa = Utils.as(it.attrs, AreaAttributes);
            if (aa === null) 
                break;
            if (GarHelper.GAR_INDEX === null || otherCountry) 
                continue;
            if (i === 0 && it.level === AddrLevel.COUNTRY) {
                if (aa.names.includes("Украина")) {
                    uaCountry = it;
                    addr.items.splice(0, 1);
                    i--;
                    continue;
                }
                otherCountry = true;
                continue;
            }
            if (it.gars.length > 0) {
                if (regions.length === 0) 
                    regions.push(it.gars[0].regionNumber);
                continue;
            }
            let r = Utils.as(it.tag, NameAnalyzer);
            if (r === null) 
                continue;
            let maxCount = 50;
            if (addr.items[0].level === AddrLevel.REGIONCITY) 
                maxCount = 100;
            else if (r.level === AddrLevel.TERRITORY) 
                maxCount = 200;
            parIds.splice(0, parIds.length);
            let pcou = 0;
            for (let j = i - 1; j >= 0; j--) {
                let it0 = addr.items[j];
                if (it0.gars.length === 0) 
                    continue;
                if (AddressHelper.compareLevels(it0.level, it.level) >= 0 && !AddressHelper.canBeParent(it0.level, it.level)) 
                    break;
                AnalyzeHelper._addParIds(parIds, it0);
                pcou++;
                if (it0.level === AddrLevel.LOCALITY) 
                    break;
                if (it.level === AddrLevel.TERRITORY && pcou > 1) 
                    break;
                if (it0.level === AddrLevel.CITY) {
                    if (it.level === AddrLevel.LOCALITY) {
                        for (const g of it0.gars) {
                            if (g.parentIds.length === 0) 
                                continue;
                            let gg = this.getGarObject(g.parentIds[0]);
                            if (gg !== null && gg.level === GarLevel.MUNICIPALAREA) 
                                parIds.push(AnalyzeHelper._getId(gg.id));
                        }
                    }
                    break;
                }
            }
            if (parIds.length === 0) {
                if (i > 0) {
                    if (i === 1 && r.level === AddrLevel.CITY && addr.items[0].gars.length === 0) {
                        let cou = CorrectionHelper.findCountry(it);
                        if (cou !== null) {
                            addr.items.splice(0, 0, cou);
                            break;
                        }
                    }
                    if (it.level === AddrLevel.CITY && RegionHelper.isBigCityA(it) !== null) {
                    }
                    else 
                        continue;
                }
                if (AddressHelper.compareLevels(it.level, AddrLevel.LOCALITY) >= 0) {
                    if (this.m_Params === null) 
                        continue;
                    if (this.m_Params.defaultObject === null) {
                        for (const rid of this.m_Params.defaultRegions) {
                            regions.push(rid);
                        }
                        if (regions.length === 0) 
                            continue;
                    }
                    else {
                        parIds.push(AnalyzeHelper._getId(this.m_Params.defaultObject.id));
                        if (this.m_Params.defaultObject.regionNumber > 0) 
                            regions.push(this.m_Params.defaultObject.regionNumber);
                        let to1 = GarHelper.createAddrObject(this.m_Params.defaultObject);
                        addr.items.splice(0, 0, to1);
                        i++;
                    }
                }
            }
            if (!AnalyzeHelper._canSearchGars(r, addr, i)) {
                if (this.m_Params === null || ((this.m_Params.defaultRegions.length === 0 && this.m_Params.defaultObject === null))) 
                    continue;
            }
            let probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
            if (probs === null && i > 0 && addr.items[i - 1].detailTyp !== DetailType.UNDEFINED) {
                parIds.splice(0, parIds.length);
                for (const g of addr.items[i - 1].gars) {
                    for (const p of g.parentIds) {
                        if (!parIds.includes(AnalyzeHelper._getId(p))) 
                            parIds.push(AnalyzeHelper._getId(p));
                    }
                }
                if (parIds.length === 0 && i > 1) {
                    for (const g of addr.items[i - 2].gars) {
                        parIds.push(AnalyzeHelper._getId(g.id));
                    }
                }
                if (parIds.length > 0) 
                    probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
            }
            if ((probs === null && i === 0 && it.level === AddrLevel.DISTRICT) && addr.items.length > 1 && addr.items[1].level === AddrLevel.CITY) {
                if (RegionHelper.isBigCityA(addr.items[1]) !== null && !rev) {
                    addr.items.splice(0, 1);
                    addr.items.splice(1, 0, it);
                    i--;
                    rev = true;
                    continue;
                }
            }
            if ((probs === null && i === 1 && it.level === AddrLevel.REGIONCITY) && addr.items[0].level === AddrLevel.REGIONAREA) {
                addr.items.splice(0, 1);
                i = -1;
                regions.splice(0, regions.length);
                continue;
            }
            if (probs === null && i === 0 && r.level === AddrLevel.CITY) {
                let cou = CorrectionHelper.findCountry(it);
                if (cou !== null) {
                    addr.items.splice(0, 0, cou);
                    break;
                }
            }
            if (probs !== null && r.level === AddrLevel.DISTRICT && ((i + 1) < addr.items.length)) {
                if (addr.items[i + 1].level === AddrLevel.STREET || ((addr.items[i + 1].level === AddrLevel.LOCALITY && (i + 2) === addr.items.length))) {
                    let alt = r.tryCreateAlternative(false, (i > 0 ? addr.items[i - 1] : null), ((i + 1) < addr.items.length ? addr.items[i + 1] : null));
                    if (alt !== null) {
                        let parIds0 = new Array();
                        for (const p of probs) {
                            parIds0.push(p.id);
                        }
                        let probs2 = GarHelper.GAR_INDEX.getStringEntries(alt, regions, parIds0, maxCount);
                        if (probs2 !== null) {
                            let setls = 0;
                            for (const p of probs2) {
                                if (p.level === AddrLevel.SETTLEMENT) 
                                    setls++;
                            }
                            if (setls > 0 && (setls < probs2.length)) {
                                for (let jj = probs2.length - 1; jj >= 0; jj--) {
                                    if (probs2[jj].level === AddrLevel.SETTLEMENT) 
                                        probs2.splice(jj, 1);
                                }
                            }
                        }
                        if (probs2 !== null && probs2.length === 1) {
                            let it1 = addr.items[i + 1];
                            let ok2 = true;
                            if (it1.level === AddrLevel.LOCALITY && probs2[0].level === it1.level) {
                                ok2 = false;
                                let r2 = Utils.as(it1.tag, NameAnalyzer);
                                let alt2 = r2.tryCreateAlternative(true, null, null);
                                if (alt2 !== null) {
                                    let parIds2 = new Array();
                                    parIds2.push(probs2[0].id);
                                    let probs3 = GarHelper.GAR_INDEX.getStringEntries(alt2, regions, parIds2, maxCount);
                                    if (probs3 !== null && probs3.length === 1) 
                                        ok2 = true;
                                }
                            }
                            else if (it1.level === AddrLevel.STREET && ((alt.level === AddrLevel.LOCALITY || alt.level === AddrLevel.CITY))) {
                                ok2 = false;
                                let parIds2 = new Array();
                                parIds2.push(probs2[0].id);
                                let probs3 = GarHelper.GAR_INDEX.getStringEntries(Utils.as(it1.tag, NameAnalyzer), regions, parIds2, maxCount);
                                if (probs3 !== null && probs3.length === 1) 
                                    ok2 = true;
                            }
                            if (!ok2) {
                            }
                            else if (!this.createAltsRegime) 
                                hasSecVar.value = true;
                            else {
                                probs = probs2;
                                it.level = probs2[0].level;
                                aa.types.splice(0, aa.types.length);
                                aa.types.splice(aa.types.length, 0, ...alt.types);
                                aa.miscs.splice(0, aa.miscs.length);
                                if (alt.miscs !== null) 
                                    aa.miscs.splice(aa.miscs.length, 0, ...alt.miscs);
                                it.tag = alt;
                                r = alt;
                            }
                        }
                    }
                }
            }
            if (probs === null) {
                let alt = r.tryCreateAlternative(false, (i > 0 ? addr.items[i - 1] : null), ((i + 1) < addr.items.length ? addr.items[i + 1] : null));
                if (alt !== null) {
                    if (!this.createAltsRegime) 
                        hasSecVar.value = true;
                    else {
                        if (AnalyzeHelper._canSearchGars(alt, addr, i)) 
                            probs = GarHelper.GAR_INDEX.getStringEntries(alt, regions, parIds, maxCount);
                        if (probs !== null && ((probs.length === 1 || it.level === AddrLevel.DISTRICT))) {
                            it.tag = alt;
                            r = alt;
                            it.level = probs[0].level;
                            for (const p of probs) {
                                if (p.level !== it.level) {
                                    it.level = AddrLevel.UNDEFINED;
                                    break;
                                }
                            }
                            aa.types.splice(0, aa.types.length);
                            aa.types.splice(aa.types.length, 0, ...alt.types);
                            aa.miscs.splice(0, aa.miscs.length);
                            if (alt.miscs !== null) 
                                aa.miscs.splice(aa.miscs.length, 0, ...alt.miscs);
                        }
                        else {
                            let alt2 = r.tryCreateAlternative(true, (i > 0 ? addr.items[i - 1] : null), ((i + 1) < addr.items.length ? addr.items[i + 1] : null));
                            if (alt2 !== null) {
                                let probs2 = null;
                                if (AnalyzeHelper._canSearchGars(alt2, addr, i)) 
                                    probs2 = GarHelper.GAR_INDEX.getStringEntries(alt2, regions, parIds, maxCount);
                                if (probs2 !== null && ((probs2.length === 1 || ((probs2.length === 2 && probs2[0].level === probs2[1].level))))) {
                                    probs = probs2;
                                    it.tag = alt2;
                                    r = alt2;
                                    it.level = probs[0].level;
                                    aa.types.splice(0, aa.types.length);
                                    aa.types.splice(aa.types.length, 0, ...alt2.types);
                                    aa.miscs.splice(0, aa.miscs.length);
                                    if (alt2.miscs !== null) 
                                        aa.miscs.splice(aa.miscs.length, 0, ...alt2.miscs);
                                }
                            }
                        }
                    }
                }
            }
            if (probs !== null && probs.length === 1 && it.level !== probs[0].level) {
                if (r.level === AddrLevel.TERRITORY || ((r.level === AddrLevel.LOCALITY && ((i === (addr.items.length - 1) || addr.items[i + 1].level !== AddrLevel.TERRITORY))))) {
                    let parIds2 = new Array();
                    parIds2.push(probs[0].id);
                    let probs2 = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds2, maxCount);
                    if (probs2 !== null && ((i + 1) < addr.items.length)) {
                        let prob3 = GarHelper.GAR_INDEX.getStringEntries(Utils.as(addr.items[i + 1].tag, NameAnalyzer), regions, parIds2, maxCount);
                        if (prob3 !== null) 
                            probs2 = null;
                    }
                    if (probs2 !== null) 
                        probs = probs2;
                }
            }
            if ((probs !== null && probs.length >= 2 && regions.length === 0) && ((i + 1) < addr.items.length) && RegionHelper.isBigCityA(addr.items[i + 1]) !== null) {
                let probs1 = GarHelper.GAR_INDEX.getStringEntries(Utils.as(addr.items[i + 1].tag, NameAnalyzer), regions, parIds, maxCount);
                if (probs1 !== null) {
                    for (const p of probs1) {
                        if (!regions.includes(p.region)) 
                            regions.push(p.region);
                    }
                }
                if (regions.length > 0) 
                    probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
            }
            if ((probs === null && regions.length === 1 && parIds.length > 0) && ((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.CITY))) {
                if ((i > 1 && RegionHelper.isBigCityA(addr.items[i - 1]) !== null && addr.items[i - 2].level === AddrLevel.DISTRICT) && addr.items[i - 2].gars.length > 0) {
                    let pars0 = new Array();
                    AnalyzeHelper._addParIds(pars0, addr.items[i - 2]);
                    probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, pars0, maxCount);
                }
            }
            let allTerrs = true;
            if (probs !== null) {
                for (const p of probs) {
                    if (p.level !== AddrLevel.TERRITORY) 
                        allTerrs = false;
                }
            }
            if (allTerrs) {
                if (regions.length === 1 && parIds.length > 0 && ((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.CITY))) {
                    if (probs === null) {
                        if (RestructHelper.restruct(this, addr, i)) {
                            regions.splice(0, regions.length);
                            i = -1;
                            continue;
                        }
                    }
                    let probs2 = GarHelper.GAR_INDEX.getStringEntries(r, regions, null, maxCount);
                    if (it.level === AddrLevel.CITY && probs2 === null) 
                        probs2 = GarHelper.GAR_INDEX.getStringEntries(r, null, null, maxCount);
                    if (probs2 !== null) {
                        for (let k = probs2.length - 1; k >= 0; k--) {
                            let pp = probs2[k];
                            let ids = new Array();
                            for (const p of pp.parentIds) {
                                ids.push(("a" + p));
                            }
                            if (addr.findGarByIds(ids) === null) 
                                probs2.splice(k, 1);
                        }
                    }
                    if (probs2 !== null && ((probs2.length === 0 || probs2.length > 30))) 
                        probs2 = null;
                    if ((probs2 !== null && probs2.length <= 2 && i > 0) && RegionHelper.isBigCityA(addr.items[i - 1]) !== null) {
                        if (probs !== null && probs.includes(probs2[0])) {
                        }
                        else {
                            addr.items.splice(i - 1, 1);
                            i--;
                        }
                    }
                    if (probs === null) 
                        probs = probs2;
                    if (probs !== null && probs.length > 1) {
                        if (r.level === AddrLevel.CITY && r.strings.includes("ТРОИЦК")) {
                            for (let k = probs.length - 1; k >= 0; k--) {
                                if (probs[k].region !== (77)) 
                                    probs.splice(k, 1);
                            }
                            if (probs.length === 1) {
                                if (i > 0) {
                                    addr.items.splice(0, i);
                                    i = 0;
                                    regions.splice(0, regions.length);
                                    regions.push(77);
                                }
                            }
                        }
                    }
                }
            }
            if ((probs === null && ((it.level === AddrLevel.CITY || it.level === AddrLevel.REGIONCITY || it.level === AddrLevel.LOCALITY)) && aa.number !== null) && ((i + 1) < addr.items.length) && addr.items[i + 1].level === AddrLevel.STREET) {
                let num = aa.number;
                let cit = r.ref.clone();
                cit.addSlot("NUMBER", null, true, 0);
                let naa = new NameAnalyzer();
                naa.initByReferent(cit, false);
                let probs2 = GarHelper.GAR_INDEX.getStringEntries(naa, regions, parIds, maxCount);
                if (probs2 !== null) {
                    aa.number = null;
                    it.tag = naa;
                    r = naa;
                    let pars1 = new Array();
                    pars1.push(probs2[0].id);
                    let probs3 = GarHelper.GAR_INDEX.getStringEntries(Utils.as(addr.items[i + 1].tag, NameAnalyzer), regions, pars1, maxCount);
                    if (probs3 !== null) {
                    }
                    else {
                        let stret = addr.items[i + 1].tag.ref;
                        stret.addSlot("NUMBER", num, false, 0);
                        addr.items[i + 1].attrs.number = num;
                        naa = new NameAnalyzer();
                        naa.initByReferent(stret, false);
                        addr.items[i + 1].tag = naa;
                    }
                    probs = probs2;
                }
            }
            if (((regions.length < 3) && i === (addr.items.length - 1) && probs === null) && (((it.level === AddrLevel.CITY || it.level === AddrLevel.LOCALITY || it.level === AddrLevel.TERRITORY) || it.level === AddrLevel.STREET))) {
                let cont = false;
                for (const nn of it.attrs.names) {
                    let ii = nn.indexOf(' ');
                    if (ii < 0) 
                        continue;
                    if (it.attrs.number !== null) 
                        break;
                    let rr = null;
                    if (r.ref instanceof GeoReferent) {
                        rr = new GeoReferent();
                        rr.addSlot(GeoReferent.ATTR_NAME, nn.substring(0, 0 + ii).toUpperCase(), false, 0);
                        for (const ty of r.ref.typs) {
                            rr.addSlot(GeoReferent.ATTR_TYPE, ty, false, 0);
                        }
                    }
                    else {
                        rr = new StreetReferent();
                        rr.kind = r.ref.kind;
                        rr.addSlot(StreetReferent.ATTR_NAME, nn.substring(0, 0 + ii).toUpperCase(), false, 0);
                        for (const ty of r.ref.typs) {
                            rr.addSlot(StreetReferent.ATTR_TYPE, ty, false, 0);
                        }
                    }
                    let naa = new NameAnalyzer();
                    naa.initByReferent(rr, false);
                    let probs2 = GarHelper.GAR_INDEX.getStringEntries(naa, regions, parIds, maxCount);
                    if (probs2 === null && i > 0 && (AddressHelper.compareLevels(addr.items[i - 1].level, AddrLevel.CITY) < 0)) {
                        rr = new GeoReferent();
                        rr.addSlot(StreetReferent.ATTR_NAME, nn.substring(0, 0 + ii).toUpperCase(), false, 0);
                        rr.addSlot("TYPE", "город", false, 0);
                        naa = new NameAnalyzer();
                        naa.initByReferent(rr, false);
                        probs2 = GarHelper.GAR_INDEX.getStringEntries(naa, regions, parIds, maxCount);
                    }
                    if (probs2 !== null) {
                        for (let jj = probs2.length - 1; jj >= 0; jj--) {
                            if (probs2[jj].level === AddrLevel.STREET) 
                                probs2.splice(jj, 1);
                        }
                    }
                    if (probs2 !== null && probs2.length > 0 && (probs2.length < 20)) {
                        let ss = new StreetReferent();
                        ss.addSlot("NAME", nn.substring(ii + 1).toUpperCase(), false, 0);
                        ss.addSlot(StreetReferent.ATTR_TYPE, "улица", false, 0);
                        if (rr instanceof GeoReferent) 
                            ss.addSlot("GEO", rr, false, 0);
                        else 
                            ss.higher = Utils.as(rr, StreetReferent);
                        let naa2 = new NameAnalyzer();
                        naa2.initByReferent(ss, false);
                        let ok = false;
                        let pars0 = new Array();
                        for (const pp of probs2) {
                            pars0.splice(0, pars0.length);
                            pars0.push(pp.id);
                            let probs3 = GarHelper.GAR_INDEX.getStringEntries(naa2, regions, pars0, maxCount);
                            if (probs3 !== null) {
                                ok = true;
                                break;
                            }
                        }
                        if (!ok) 
                            continue;
                        let tmp = new TextAddress();
                        AnalyzeHelper._createAddressItems(tmp, ss, null, 0);
                        if (tmp.items.length === 2) {
                            addr.items.splice(i, 1);
                            addr.items.splice(i, 0, ...tmp.items);
                            i--;
                            cont = true;
                            break;
                        }
                    }
                }
                if (cont) 
                    continue;
            }
            if (((probs === null && i === 0 && it.level === AddrLevel.CITY) && ((i + 1) < addr.items.length) && addr.items[i + 1].level === AddrLevel.DISTRICT) && !rev) {
                addr.items.splice(0, 1);
                addr.items.splice(1, 0, it);
                i--;
                rev = true;
                continue;
            }
            if (((probs === null && ((it.level === AddrLevel.STREET || it.level === AddrLevel.TERRITORY || it.level === AddrLevel.LOCALITY)) && i === (addr.items.length - 1)) && aa.number !== null && aa.names.length > 0) && ar === null) {
                let lastNum = false;
                if (r.ref.occurrence.length > 0) {
                    let occ = r.ref.occurrence[0].getText();
                    if (occ.endsWith(aa.number)) 
                        lastNum = true;
                }
                if (lastNum) {
                    let na2 = new NameAnalyzer();
                    r.ref.addSlot(StreetReferent.ATTR_NUMBER, null, true, 0);
                    na2.initByReferent(r.ref, false);
                    probs = GarHelper.GAR_INDEX.getStringEntries(na2, regions, parIds, maxCount);
                    r.ref.addSlot(StreetReferent.ATTR_NUMBER, aa.number, true, 0);
                    if (probs !== null) {
                        ar = new AddressReferent();
                        let ii = aa.number.indexOf('-');
                        if (ii < 0) 
                            ar.houseOrPlot = aa.number;
                        else {
                            ar.house = aa.number.substring(0, 0 + ii);
                            ar.flat = aa.number.substring(ii + 1);
                        }
                        aa.number = null;
                    }
                }
            }
            if ((probs !== null && probs.length > 10 && i === 0) && regions.length === 0) 
                probs = null;
            if (it.level === AddrLevel.STREET && probs !== null && probs.length > 5) {
                if (i === 0) 
                    probs = null;
                else {
                    let it0 = addr.items[i - 1];
                    if (it0.level === AddrLevel.DISTRICT) {
                        if (it0.gars.length > 0) {
                            for (const chi of GarHelper.getChildrenObjects(it0.gars[0].id, true)) {
                                if (chi.level !== GarLevel.CITY) 
                                    continue;
                                if (chi.attrs.names.length > 0 && it0.gars[0].attrs.names.includes(chi.attrs.names[0])) {
                                }
                                else 
                                    continue;
                                let pars = new Array();
                                pars.push(AnalyzeHelper._getId(chi.id));
                                let probs1 = GarHelper.GAR_INDEX.getStringEntries(r, regions, pars, maxCount);
                                if (probs1 !== null && (probs1.length < 3)) 
                                    probs = probs1;
                            }
                        }
                        if (probs.length > 3) {
                            if (i === 1) 
                                probs = null;
                            else if (addr.items[i - 2].level !== AddrLevel.CITY && addr.items[i - 2].level !== AddrLevel.REGIONCITY) 
                                probs = null;
                        }
                    }
                }
            }
            if (probs === null && i >= 2 && ((it.level === AddrLevel.STREET || it.level === AddrLevel.TERRITORY))) {
                let it0 = addr.items[i - 1];
                let it00 = addr.items[i - 2];
                if (it0.gars.length > 0 && it0.gars[0].expired && it00.gars.length === 1) {
                    let pars = new Array();
                    pars.push(AnalyzeHelper._getId(it00.gars[0].id));
                    probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, pars, maxCount);
                }
            }
            if ((probs === null && i >= 2 && it.level === AddrLevel.STREET) && addr.items[0].level === AddrLevel.REGIONCITY) {
                let probs1 = GarHelper.GAR_INDEX.getStringEntries(r, regions, null, maxCount);
                if (probs1 !== null && probs1.length === 1) {
                    probs = probs1;
                    if (addr.items[i - 1].gars.length > 0) 
                        addr.items[i - 1].gars.splice(0, addr.items[i - 1].gars.length);
                }
            }
            if (probs === null && regions.length === 1 && it.level === AddrLevel.CITY) {
                r.level = AddrLevel.LOCALITY;
                probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
                r.level = AddrLevel.CITY;
            }
            if ((probs === null && it.level === AddrLevel.STREET && i > 0) && addr.items[i - 1].level === AddrLevel.TERRITORY && addr.items[i - 1].gars.length === 0) {
                let it0 = addr.items[i - 1];
                let na = Utils.as(it0.tag, NameAnalyzer);
                let sr = new StreetReferent();
                for (const n of na.ref.getStringValues("NAME")) {
                    sr.addSlot("NAME", n, false, 0);
                }
                for (const s of r.ref.slots) {
                    if (s.typeName !== "NAME") 
                        sr.addSlot(s.typeName, s.value, false, 0);
                }
                let na1 = new NameAnalyzer();
                na1.initByReferent(sr, false);
                probs = GarHelper.GAR_INDEX.getStringEntries(na1, regions, parIds, maxCount);
                if (probs !== null) {
                    it.tag = na1;
                    addr.items.splice(i - 1, 1);
                    i--;
                }
            }
            if (probs !== null) {
                this._addGars(addr, probs, i, regions, false);
                if ((probs !== null && probs.length > 0 && it.gars.length === 0) && i > 0) {
                    let it0 = addr.items[i - 1];
                    if (it0.gars.length === 0 && it0.level === AddrLevel.DISTRICT && i > 1) 
                        it0 = addr.items[i - 2];
                    let aa0 = Utils.as(it0.attrs, AreaAttributes);
                    if ((((it.level === AddrLevel.STREET || it.level === AddrLevel.TERRITORY)) && it0.level === AddrLevel.DISTRICT && it0.gars.length === 1) && aa0.names.length > 0) {
                        let nam = aa0.names[0];
                        if (nam.length > 5) 
                            nam = nam.substring(0, 0 + nam.length - 3);
                        let chils = AddressService.getObjects(it0.gars[0].id, true);
                        if (chils !== null) {
                            for (const ch of chils) {
                                let ga = Utils.as(ch.attrs, AreaAttributes);
                                if (ch.level !== GarLevel.CITY && ch.level !== GarLevel.LOCALITY) 
                                    continue;
                                if (ga.names.length === 0 || !Utils.startsWithString(ga.names[0], nam, true)) 
                                    continue;
                                parIds.splice(0, parIds.length);
                                parIds.push(AnalyzeHelper._getId(ch.id));
                                let probs0 = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
                                if (probs0 !== null) {
                                    let it00 = GarHelper.createAddrObject(ch);
                                    if (it00 !== null) {
                                        addr.items.splice(i, 0, it00);
                                        i++;
                                        this._addGars(addr, probs0, i, regions, false);
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
            else if ((it.level === AddrLevel.TERRITORY && i > 0 && addr.items[i - 1].gars.length === 1) && aa.names.length > 0) {
                let g0 = addr.items[i - 1].gars[0];
                if (g0.childrenCount < 500) {
                    let childs = AddressService.getObjects(g0.id, true);
                    if (childs !== null) {
                        for (const ch of childs) {
                            if (ch.level !== GarLevel.AREA || ch.expired) 
                                continue;
                            let aa0 = Utils.as(ch.attrs, AreaAttributes);
                            if (aa0.number !== aa.number) 
                                continue;
                            if (aa0.names[0].toUpperCase().includes(aa.names[0].toUpperCase())) 
                                it.gars.push(ch);
                        }
                    }
                    if (it.gars.length !== 1) 
                        it.gars.splice(0, it.gars.length);
                }
            }
            if (it.gars.length === 0) {
                if (RestructHelper.restruct(this, addr, i)) {
                    regions.splice(0, regions.length);
                    i = -1;
                    continue;
                }
            }
            if (((it.gars.length === 0 && it.level === AddrLevel.DISTRICT && i === 1) && addr.items[0].gars.length === 1 && aa.names.length > 0) && aa.names[0].length > 5) {
                let nam = aa.names[0].substring(0, 0 + 5);
                let chi = AddressService.getObjects(addr.items[0].gars[0].id, true);
                if (chi !== null) {
                    for (const ch of chi) {
                        if (ch.level !== GarLevel.MUNICIPALAREA && ch.level !== GarLevel.ADMINAREA) 
                            continue;
                        let aaa = Utils.as(ch.attrs, AreaAttributes);
                        if (aaa.names.length === 0) 
                            continue;
                        if (aaa.names[0].startsWith(nam)) {
                            if (aa.names[0].includes(" ") === aaa.names[0].includes(" ")) 
                                it.gars.push(ch);
                        }
                    }
                }
                it.sortGars();
            }
            if (((it.gars.length === 0 && i > 1 && it.level === AddrLevel.STREET) && addr.items[i - 1].level === AddrLevel.TERRITORY && addr.items[i - 1].gars.length === 0) && addr.items[i - 2].gars.length === 1 && ((addr.items[i - 2].level === AddrLevel.CITY || addr.items[i - 2].level === AddrLevel.REGIONCITY))) {
                let aa0 = Utils.as(addr.items[i - 1].attrs, AreaAttributes);
                if (aa0.names.length > 0 && aa0.number === null && aa0.names[0].length > 5) {
                    let chi = AddressService.getObjects(addr.items[i - 2].gars[0].id, true);
                    let nam = aa0.names[0].substring(0, 0 + 5);
                    for (const ch of chi) {
                        if (ch.level !== GarLevel.AREA) 
                            continue;
                        let aaa = Utils.as(ch.attrs, AreaAttributes);
                        if (aaa.names.length === 0) 
                            continue;
                        if (aaa.names[0].startsWith(nam)) {
                            if (aa0.names[0].includes(" ") === aaa.names[0].includes(" ")) 
                                addr.items[i - 1].gars.push(ch);
                        }
                    }
                    if (addr.items[i - 1].gars.length === 1) {
                        i--;
                        continue;
                    }
                    addr.items[i - 1].gars.splice(0, addr.items[i - 1].gars.length);
                }
            }
            if (it.level === AddrLevel.DISTRICT && it.gars.length > 0) {
                let allArea = true;
                for (const g of it.gars) {
                    if (g.level !== GarLevel.AREA && g.level !== GarLevel.DISTRICT) 
                        allArea = false;
                }
                if (allArea) {
                    it.level = AddrLevel.TERRITORY;
                    if (((i + 1) < addr.items.length) && addr.items[i + 1].level === AddrLevel.CITY) {
                        addr.items.splice(i, 1);
                        addr.items.splice(i + 1, 0, it);
                        it.gars.splice(0, it.gars.length);
                        i--;
                        continue;
                    }
                }
            }
            if (it.level === AddrLevel.LOCALITY && i > 0 && it.gars.length === 1) {
                let it0 = addr.items[i - 1];
                if (it0.level === AddrLevel.CITY && it0.findGarByIds(it.gars[0].parentIds) === null) {
                    addr.items.splice(i - 1, 1);
                    i--;
                }
            }
            if (it.gars.length === 0) {
                if (it.level === AddrLevel.COUNTRY) 
                    otherCountry = true;
            }
            if (it.crossObject !== null) {
                r = Utils.as(it.crossObject.tag, NameAnalyzer);
                probs = GarHelper.GAR_INDEX.getStringEntries(r, regions, parIds, maxCount);
                if (probs !== null) 
                    this._addGars(addr, probs, i, regions, true);
            }
        }
        for (let j = 0; j < (addr.items.length - 1); j++) {
            let it0 = addr.items[j];
            let it1 = addr.items[j + 1];
            if (it0.gars.length > 0 || it1.gars.length === 0) 
                continue;
            let ok = false;
            if (it0.level === AddrLevel.LOCALITY && it1.level === AddrLevel.LOCALITY) 
                ok = true;
            if (!ok) 
                continue;
            parIds.splice(0, parIds.length);
            for (const gg of it1.gars) {
                parIds.push(AnalyzeHelper._getId(gg.id));
            }
            let probs = GarHelper.GAR_INDEX.getStringEntries(Utils.as(it0.tag, NameAnalyzer), regions, parIds, 4);
            if (probs !== null) {
                addr.items[j] = it1;
                addr.items[j + 1] = it0;
                this._addGars(addr, probs, j + 1, regions, false);
            }
        }
        this._removeItems(addr);
        this._removeGars(addr);
        for (let j = 0; j < addr.items.length; j++) {
            let it = addr.items[j];
            if (it.gars.length > 1) {
                for (const g of it.gars) {
                    let gg = it.findGarByIds(g.parentIds);
                    if (gg !== null) {
                        if (AddressHelper.canBeEqualLevels(it.level, gg.level)) 
                            Utils.removeItem(it.gars, g);
                        else 
                            Utils.removeItem(it.gars, gg);
                        break;
                    }
                }
            }
        }
        for (let j = 0; j < addr.items.length; j++) {
            let it = addr.items[j];
            if (((it.level === AddrLevel.CITY || it.level === AddrLevel.LOCALITY)) && it.gars.length > 0 && !it.gars[0].expired) {
            }
            else 
                continue;
            let j0 = j;
            j--;
            let hasOk = false;
            for (let jj = j; jj > 0; jj--) {
                it = addr.items[jj];
                if (((it.gars.length > 0 && it.gars[0].expired)) || it.gars.length === 0) {
                }
                else 
                    hasOk = true;
            }
            if (hasOk || it.level === AddrLevel.CITY) {
                for (; j > 0; j--) {
                    it = addr.items[j];
                    if (it.gars.length > 0 && it.gars[0].expired) 
                        addr.items.splice(j, 1);
                    else if (it.gars.length === 0) {
                        if (it.level === AddrLevel.DISTRICT) {
                            it.level = AddrLevel.CITYDISTRICT;
                            if ((j0 + 1) <= addr.items.length) 
                                addr.items.splice(j0 + 1, 0, it);
                            else 
                                addr.items.push(it);
                        }
                        addr.items.splice(j, 1);
                    }
                }
            }
            break;
        }
        this._addMissItems(addr);
        for (let k = 0; k < (addr.items.length - 1); k++) {
            for (let j = 0; j < (addr.items.length - 1); j++) {
                if (AddressHelper.compareLevels(addr.items[j].level, addr.items[j + 1].level) > 0) {
                    let it = addr.items[j];
                    addr.items[j] = addr.items[j + 1];
                    addr.items[j + 1] = it;
                }
            }
        }
        for (let k = 0; k < (addr.items.length - 1); k++) {
            if (addr.items[k].level === addr.items[k + 1].level && addr.items[k].level !== AddrLevel.TERRITORY) {
                let it = addr.items[k];
                let it1 = addr.items[k + 1];
                if (it.gars.length === it1.gars.length && it.gars.length > 0 && it.gars.includes(it1.gars[0])) {
                    addr.items.splice(k + 1, 1);
                    k--;
                }
                else if (it.gars.length === 0 && it1.gars.length > 0) {
                    addr.items.splice(k, 1);
                    k--;
                }
                else if (it.gars.length > 0 && it1.gars.length === 0) {
                    addr.items.splice(k + 1, 1);
                    k--;
                }
            }
        }
        if (uaCountry !== null && ((addr.items.length === 0 || addr.items[0].level !== AddrLevel.COUNTRY))) 
            addr.items.splice(0, 0, uaCountry);
        return ar;
    }
    
    _processRest(addr, ar, one, aar) {
        if (ar !== null) {
            HouseRoomHelper.processHouseAndRooms(this, ar, addr);
            let hasDetails = false;
            for (const it of addr.items) {
                if (it.detailTyp !== DetailType.UNDEFINED) 
                    hasDetails = true;
            }
            if (!hasDetails) {
                let par = null;
                let wrappar101 = new RefOutArgWrapper();
                let det = HouseRoomHelper.createDirDetails(ar, wrappar101);
                par = wrappar101.value;
                if (det !== DetailType.UNDEFINED && addr.lastItem !== null) {
                    let ao = addr.lastItem;
                    if (addr.items.length > 1 && ((addr.items[addr.items.length - 2].level === addr.lastItem.level || ((addr.lastItem.level === AddrLevel.PLOT && addr.lastItem.attrs.number === "б/н"))))) {
                        if (par === "часть" && addr.items.length > 2 && addr.items[addr.items.length - 3].level === AddrLevel.TERRITORY) 
                            ao = addr.items[addr.items.length - 3];
                        else 
                            ao = addr.items[addr.items.length - 2];
                    }
                    ao.detailTyp = det;
                    ao.detailParam = par;
                }
            }
            else 
                for (let j = 0; j < (addr.items.length - 1); j++) {
                    let it = addr.items[j];
                    if (it.detailTyp === DetailType.UNDEFINED || it.gars.length === 0) 
                        continue;
                    let it2 = addr.items[j + 1];
                    if (it2.gars.length === 0) 
                        continue;
                    for (const g of it2.gars) {
                        if (it.findGarByIds(g.parentIds) !== null) {
                            it.detailTyp = DetailType.UNDEFINED;
                            it.detailParam = null;
                            break;
                        }
                    }
                }
            HouseRoomHelper.processOtherDetails(addr, ar);
            ar.tag = addr;
        }
        else if (addr.text !== null) {
            for (let i = addr.endChar + 1; i < addr.text.length; i++) {
                let ch = addr.text[i];
                if (ch === ' ' || ch === ',' || ch === '.') 
                    continue;
                let txt = addr.text.substring(i);
                let rt = AddressItemToken.createAddress(txt);
                if (rt === null && Utils.isDigit(txt[0])) 
                    rt = AddressItemToken.createAddress("дом " + txt);
                if (rt !== null) {
                    ar = Utils.as(rt.referent, AddressReferent);
                    HouseRoomHelper.processHouseAndRooms(this, ar, addr);
                    addr.endChar = i + rt.endChar;
                }
                break;
            }
        }
        if (addr.lastItem !== null) {
            if (AddressHelper.compareLevels(addr.lastItem.level, AddrLevel.STREET) > 0) {
                if (this._removeGars(addr)) 
                    this._addMissItems(addr);
                if (one) 
                    HouseRoomHelper.tryParseListItems(this, addr, aar);
            }
        }
        AnalyzeHelper._correctLevels(addr);
    }
    
    _removeItems(res) {
        for (let j = 0; j < (res.items.length - 1); j++) {
            let it = res.items[j];
            let it1 = res.items[j + 1];
            if (it1.gars.length === 0) 
                continue;
            let aa = Utils.as(it.attrs, AreaAttributes);
            let aa1 = Utils.as(it1.attrs, AreaAttributes);
            let ok = false;
            for (const g of it1.gars) {
                if (it.findGarByIds(g.parentIds) !== null) 
                    ok = true;
            }
            if (ok) 
                continue;
            if (it.level === AddrLevel.DISTRICT && it1.level === AddrLevel.CITY) {
                if (aa.names.length > 0 && aa1.names.length > 0 && aa1.names[0].length > 3) {
                    if (aa.names[0].startsWith(aa1.names[0].substring(0, 0 + 3))) 
                        ok = true;
                }
                if (!ok && ((j + 2) < res.items.length)) {
                    let it2 = res.items[j + 2];
                    if (it2.level === AddrLevel.LOCALITY || it2.level === AddrLevel.CITY || it2.level === AddrLevel.SETTLEMENT) {
                        for (const g of it2.gars) {
                            if (it.findGarByIds(g.parentIds) !== null) 
                                ok = true;
                        }
                        if (ok) {
                            res.items.splice(j + 1, 1);
                            it1 = it2;
                        }
                    }
                }
                if (j === 0 && it1.gars.length === 1) {
                    res.items.splice(0, 1);
                    j--;
                    continue;
                }
            }
            if ((!ok && it.level === AddrLevel.CITY && ((it1.level === AddrLevel.LOCALITY || it1.level === AddrLevel.TERRITORY))) && j > 0) {
                let it0 = res.items[j - 1];
                let aa0 = Utils.as(it0.attrs, AreaAttributes);
                if (it0.level === AddrLevel.DISTRICT) {
                    for (const g of it1.gars) {
                        if (it0.findGarByIds(g.parentIds) !== null) 
                            ok = true;
                    }
                    if (ok) {
                        res.items.splice(j, 1);
                        j--;
                        continue;
                    }
                }
            }
        }
    }
    
    _addMissItems(addr) {
        for (let j = 0; j < (addr.items.length - 1); j++) {
            let it0 = addr.items[j];
            let it1 = addr.items[j + 1];
            if (it1.gars.length === 0) 
                continue;
            if (AnalyzeHelper._containsOneOfParent(addr, it1.gars)) {
                if (((it0.level === AddrLevel.REGIONCITY || it0.level === AddrLevel.REGIONAREA)) && it1.level === AddrLevel.LOCALITY) {
                }
                else 
                    continue;
            }
            let par = this._getCommonParent(addr, it1.gars);
            if (par === null) 
                continue;
            if (addr.findItemByGarLevel(par.level) !== null) 
                continue;
            let par2 = null;
            let par3 = null;
            if (addr.findGarByIds(par.parentIds) !== null) {
            }
            else {
                if (par.parentIds.length === 0) 
                    continue;
                par2 = this.getGarObject(par.parentIds[0]);
                if (par2 === null) 
                    continue;
                if (addr.findGarByIds(par2.parentIds) !== null) {
                }
                else {
                    if (par2.parentIds.length === 0) 
                        continue;
                    par3 = this.getGarObject(par2.parentIds[0]);
                    if (par3 === null) 
                        continue;
                    if (addr.findGarByIds(par3.parentIds) !== null) {
                    }
                    else 
                        continue;
                }
            }
            let to1 = GarHelper.createAddrObject(par);
            if (to1 !== null) {
                let exi = addr.findItemByLevel(to1.level);
                if (exi === null) 
                    addr.items.splice(j + 1, 0, to1);
                else if (!exi.gars.includes(par)) 
                    exi.gars.push(par);
            }
            if (par2 !== null) {
                let to2 = GarHelper.createAddrObject(par2);
                if (to2 !== null) {
                    let exi = addr.findItemByLevel(to2.level);
                    if (exi === null) 
                        addr.items.splice(j + 1, 0, to2);
                    else if (!exi.gars.includes(par2)) 
                        exi.gars.push(par2);
                }
                if (par3 !== null) {
                    let to3 = GarHelper.createAddrObject(par3);
                    if (to3 !== null) {
                        let exi = addr.findItemByLevel(to3.level);
                        if (exi === null) 
                            addr.items.splice(j + 1, 0, to3);
                        else if (!exi.gars.includes(par2)) 
                            exi.gars.push(par3);
                    }
                }
            }
        }
        if (addr.items.length > 0 && addr.items[0].gars.length >= 1 && addr.items[0].gars[0].parentIds.length > 0) {
            for (let p = this.getGarObject(addr.items[0].gars[0].parentIds[0]); p !== null; p = this.getGarObject(p.parentIds[0])) {
                let to1 = GarHelper.createAddrObject(p);
                if (to1 !== null) 
                    addr.items.splice(0, 0, to1);
                if (p.parentIds.length === 0) 
                    break;
            }
        }
    }
    
    static _containsOneOfParent(a, gos) {
        for (const g of gos) {
            if (a.findGarByIds(g.parentIds) !== null) 
                return true;
        }
        return false;
    }
    
    _getCommonParent(a, gos) {
        let id = null;
        for (const g of gos) {
            if (g.parentIds.length > 0) {
                if (id === null || g.parentIds.includes(id)) 
                    id = (g.parentIds.length > 0 ? g.parentIds[0] : null);
                else if (id !== null && g.parentIds.includes(id)) {
                }
                else 
                    return null;
            }
        }
        if (id === null) 
            return null;
        return this.getGarObject(id);
    }
    
    _addGars(addr, probs, i, regions, cross) {
        if (probs === null || probs.length === 0) 
            return;
        let it = addr.items[i];
        if (cross) 
            it = it.crossObject;
        it.gars.splice(0, it.gars.length);
        let aa = Utils.as(it.attrs, AreaAttributes);
        if (it.level === AddrLevel.LOCALITY) {
            let hasStreet = false;
            for (let j = i + 1; j < addr.items.length; j++) {
                if (addr.items[j].level === AddrLevel.STREET) 
                    hasStreet = true;
            }
            if (hasStreet) {
                for (let j = probs.length - 1; j >= 0; j--) {
                    if (probs[j].level === AddrLevel.STREET) 
                        probs.splice(j, 1);
                }
            }
        }
        if (probs.length > 1 && this.m_Params !== null && this.m_Params.defaultRegions.length > 0) {
            let hasReg = 0;
            for (const g of probs) {
                if (this.m_Params.defaultRegions.indexOf(g.region) >= 0) 
                    hasReg++;
            }
            if (hasReg > 0 && (hasReg < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (this.m_Params.defaultRegions.indexOf(probs[k].region) < 0) 
                        probs.splice(k, 1);
                }
            }
        }
        if (probs.length > 1 && aa.miscs.length > 0 && it.level !== AddrLevel.TERRITORY) {
            let hasEquMisc = 0;
            for (const g of probs) {
                if (aa.findMisc(g.miscs) !== null) 
                    hasEquMisc++;
            }
            if (hasEquMisc > 0 && (hasEquMisc < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (aa.findMisc(probs[k].miscs) === null) 
                        probs.splice(k, 1);
                }
            }
        }
        if (((probs.length > 1 && it.level !== AddrLevel.TERRITORY && it.level !== AddrLevel.DISTRICT) && !aa.types.includes("населенный пункт") && !aa.types.includes("станция")) && !aa.types.includes("поселение")) {
            let hasEquType = 0;
            for (const g of probs) {
                if (aa.hasEqualType(g.typs)) 
                    hasEquType++;
            }
            if (hasEquType > 0 && (hasEquType < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (!aa.hasEqualType(probs[k].typs)) 
                        probs.splice(k, 1);
                }
            }
        }
        if (probs.length > 1 && it.level !== AddrLevel.UNDEFINED) {
            let hasEquLevel = 0;
            let gstat2 = 0;
            for (const g of probs) {
                if (it.level === g.level) 
                    hasEquLevel++;
                if (g.status === GarStatus.OK2) 
                    gstat2++;
            }
            if (gstat2 === 0 && hasEquLevel > 0 && (hasEquLevel < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (it.level !== probs[k].level) 
                        probs.splice(k, 1);
                }
            }
        }
        if (probs.length > 1) {
            let hasErr = 0;
            for (const g of probs) {
                if (g.status === GarStatus.ERROR) 
                    hasErr++;
            }
            if (hasErr > 0 && (hasErr < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (probs[k].status === GarStatus.ERROR) 
                        probs.splice(k, 1);
                }
            }
        }
        if (probs.length > 1) {
            let hasAct = 0;
            let oktyp = 0;
            let pars = new Array();
            for (const g of probs) {
                if (g.level === AddrLevel.DISTRICT || g.checkType(Utils.as(it.tag, NameAnalyzer)) > 0) 
                    oktyp++;
                if (g.expired) 
                    hasAct++;
                if (g.parentIds !== null) {
                    for (const p of g.parentIds) {
                        if (!pars.includes(p)) 
                            pars.push(p);
                    }
                }
            }
            if (hasAct > 0 && (hasAct < oktyp) && (pars.length < 2)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (probs[k].expired) 
                        probs.splice(k, 1);
                }
            }
        }
        if (i > 0 && probs.length > 1) {
            let it0 = addr.items[i - 1];
            if ((it.level === AddrLevel.STREET || it.level === AddrLevel.TERRITORY || ((it.level === AddrLevel.LOCALITY && it0.level === AddrLevel.DISTRICT)))) {
                let hasDirParent = 0;
                for (const g of probs) {
                    if (AnalyzeHelper._findParentProb(it0, g) !== null && !g.expired) 
                        hasDirParent++;
                }
                if (hasDirParent > 0 && (hasDirParent < probs.length)) {
                    for (let k = probs.length - 1; k >= 0; k--) {
                        let g = probs[k];
                        if (AnalyzeHelper._findParentProb(it0, g) !== null) 
                            continue;
                        probs.splice(k, 1);
                    }
                }
            }
        }
        if (i > 0 && probs.length > 1) {
            let it0 = addr.items[i - 1];
            let aa0 = Utils.as(it0.attrs, AreaAttributes);
            if (aa0.names.length > 0 && ((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.TERRITORY)) && it0.level === AddrLevel.DISTRICT) {
                let probs0 = null;
                for (const p of probs) {
                    if (p.parentIds === null || p.parentIds.length === 0) 
                        continue;
                    let par = this.getGarObject(("a" + p.parentIds[0]));
                    if (par === null) 
                        continue;
                    for (let kk = 0; kk < 2; kk++) {
                        let aa1 = Utils.as(par.attrs, AreaAttributes);
                        if (aa1.names.length > 0 && aa1.names[0].length >= 4) {
                            if (aa0.names[0].startsWith(aa1.names[0].substring(0, 0 + 4))) {
                                if (probs0 === null) 
                                    probs0 = new Array();
                                probs0.push(p);
                                break;
                            }
                        }
                        if (kk > 0) 
                            break;
                        if (par.parentIds === null || par.parentIds.length === 0) 
                            break;
                        let par2 = this.getGarObject(par.parentIds[0]);
                        if (par2 === null) 
                            break;
                        par = par2;
                    }
                }
                if (probs0 !== null) {
                    probs.splice(0, probs.length);
                    probs.splice(probs.length, 0, ...probs0);
                }
            }
        }
        if ((probs.length > 1 && it.level === AddrLevel.STREET && aa.types.length > 1) && aa.types.includes("улица")) {
            let typ0 = (aa.types[0] === "улица" ? aa.types[1] : aa.types[0]);
            let hasTyp = 0;
            for (const p of probs) {
                if (p.typs.includes(typ0)) 
                    hasTyp++;
            }
            if (hasTyp > 0 && (hasTyp < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (!probs[k].typs.includes(typ0)) 
                        probs.splice(k, 1);
                }
            }
        }
        if (probs.length > 1 && it.level === AddrLevel.STREET && aa.types.length > 0) {
            let hasTyp = 0;
            for (const p of probs) {
                if (p.typs !== null && p.typs.length === aa.types.length) 
                    hasTyp++;
            }
            if (hasTyp > 0 && (hasTyp < probs.length)) {
                for (let k = probs.length - 1; k >= 0; k--) {
                    if (probs[k].typs !== null && probs[k].typs.length !== aa.types.length) 
                        probs.splice(k, 1);
                }
            }
        }
        let ignoreGars = false;
        for (const p of probs) {
            if (it.level === AddrLevel.STREET && i > 0) {
                let ok = false;
                let ids = new Array();
                if (p.parentIds !== null) {
                    for (const id of p.parentIds) {
                        ids.splice(0, ids.length);
                        ids.push(("a" + id));
                        let gg = addr.findGarByIds(ids);
                        if (gg === null) 
                            continue;
                        if (gg.level === GarLevel.CITY || gg.level === GarLevel.LOCALITY || gg.level === GarLevel.AREA) {
                            ok = true;
                            break;
                        }
                        if (((gg.level === GarLevel.ADMINAREA || gg.level === GarLevel.REGION)) && gg.attrs.types.includes("город")) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (p.parentParentIds !== null && !ok && !aa.types.includes("километр")) {
                    for (const id of p.parentParentIds) {
                        ids.splice(0, ids.length);
                        ids.push(("a" + id));
                        let gg = addr.findGarByIds(ids);
                        if (gg === null) 
                            continue;
                        if ((gg.level === GarLevel.CITY || gg.level === GarLevel.LOCALITY || gg.level === GarLevel.AREA) || gg.level === GarLevel.SETTLEMENT) {
                            ok = true;
                            break;
                        }
                        if (((gg.level === GarLevel.ADMINAREA || gg.level === GarLevel.REGION)) && gg.attrs.types.includes("город")) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (!ok) 
                    continue;
            }
            let g = this.getGarObject(("a" + p.id));
            if (g === null) 
                continue;
            if (p.miscs !== null && p.miscs.length > 0) 
                g.attrs.miscs.splice(g.attrs.miscs.length, 0, ...p.miscs);
            let ga = Utils.as(g.attrs, AreaAttributes);
            let na = new NameAnalyzer();
            na.process(ga.names, (ga.types.length > 0 ? ga.types[0] : null));
            let co = na.calcEqualCoef(Utils.as(it.tag, NameAnalyzer));
            if (co < 0) 
                continue;
            if (((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.TERRITORY)) && i >= 2) {
                let ok = false;
                if (addr.findGarByIds(g.parentIds) !== null) 
                    ok = true;
                else 
                    for (let kk = i - 1; kk > 0; kk--) {
                        let it0 = addr.items[kk];
                        if (p.parentParentIds !== null) {
                            for (const ppid of p.parentParentIds) {
                                if (it0.findGarById(("a" + ppid)) !== null) {
                                    ok = true;
                                    break;
                                }
                            }
                        }
                        if (ok) 
                            break;
                        for (const pid of g.parentIds) {
                            let par = this.getGarObject(pid);
                            if (par === null) 
                                continue;
                            let ga0 = Utils.as(par.attrs, AreaAttributes);
                            if (ga0.names.length === 0 || (ga0.names[0].length < 4)) 
                                continue;
                            let sub = ga0.names[0].substring(0, 0 + 4);
                            let aa0 = Utils.as(it0.attrs, AreaAttributes);
                            if (aa0.names.length > 0 && Utils.startsWithString(aa0.names[0], sub, true)) {
                                ok = true;
                                break;
                            }
                        }
                        if (ok) 
                            break;
                        if (p.parentParentIds !== null) {
                            for (const ppid of p.parentParentIds) {
                                let par = this.getGarObject(("a" + ppid));
                                if (par === null) 
                                    continue;
                                let ga0 = Utils.as(par.attrs, AreaAttributes);
                                if (ga0.names.length === 0 || (ga0.names[0].length < 4)) 
                                    continue;
                                let sub = ga0.names[0].substring(0, 0 + 4);
                                let aa0 = Utils.as(it0.attrs, AreaAttributes);
                                if (aa0.names.length > 0 && Utils.startsWithString(aa0.names[0], sub, true)) {
                                    ok = true;
                                    break;
                                }
                            }
                        }
                        if (ok) 
                            break;
                    }
                if (!ok) 
                    continue;
            }
            if (na.sec !== null || p.status === GarStatus.OK2) {
                if (p.id === 4001) {
                }
                if ((i + 1) >= addr.items.length || na.sec === null) 
                    continue;
                let it1 = addr.items[i + 1];
                let na1 = Utils.as(it1.tag, NameAnalyzer);
                if (na1 === null) 
                    continue;
                if (!na1.canBeEquals(na.sec)) 
                    continue;
                it1.gars.push(g);
                ignoreGars = true;
                it.gars.splice(0, it.gars.length);
                it.isReconstructed = true;
            }
            if (g.level === GarLevel.REGION && it.level === AddrLevel.CITY && i === 0) 
                it.level = AddrLevel.REGIONCITY;
            else if (g.level === GarLevel.REGION && it.level !== AddrLevel.REGIONCITY) 
                it.level = AddrLevel.REGIONAREA;
            if (!it.canBeEqualsGLevel(g)) {
                if (probs.length === 1 && it.level === AddrLevel.STREET && g.level === GarLevel.AREA) {
                }
                else 
                    continue;
            }
            if (!ignoreGars) 
                it.gars.push(g);
        }
        if (i === 0 && it.gars.length > 1 && ((it.level === AddrLevel.CITY || it.level === AddrLevel.LOCALITY))) {
            let ok = false;
            for (const g of it.gars) {
                if (g.level === GarLevel.CITY) {
                    let ga = Utils.as(g.attrs, AreaAttributes);
                    for (const n of ga.names) {
                        if (RegionHelper.isBigCity(n) !== null) 
                            ok = true;
                    }
                    if (ok) 
                        break;
                }
            }
            if (ok) {
                for (let k = it.gars.length - 1; k >= 0; k--) {
                    let ga = Utils.as(it.gars[k].attrs, AreaAttributes);
                    ok = false;
                    if (it.gars[k].level === GarLevel.CITY) {
                        for (const n of ga.names) {
                            if (RegionHelper.isBigCity(n) !== null) 
                                ok = true;
                        }
                    }
                    if (!ok) 
                        it.gars.splice(k, 1);
                    if (aa.types.length > 0 && aa.types[0] === "населенный пункт") {
                        aa.types.splice(0, aa.types.length);
                        aa.types.push(ga.types[0]);
                    }
                }
            }
        }
        if (it.gars.length > 1 && it.level === AddrLevel.CITY) {
            let g1 = it.findGarByLevel(GarLevel.MUNICIPALAREA);
            if (g1 !== null && it.findGarByLevel(GarLevel.CITY) !== null) 
                Utils.removeItem(it.gars, g1);
        }
        if (it.gars.length > 1 && i > 0 && ((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.CITY || it.level === AddrLevel.TERRITORY))) {
            for (let j = i - 1; j >= 0; j--) {
                let it0 = addr.items[j];
                if (it0.gars.length === 0) 
                    continue;
                let ap = Utils.as(it0.gars[0].attrs, AreaAttributes);
                if (ap === null || ap.names.length === 0) 
                    break;
                let gars = null;
                let eqParens = false;
                let lev = GarLevel.UNDEFINED;
                for (const g of it.gars) {
                    if (g.parentIds.length === 0) 
                        continue;
                    let par = this.getGarObject(g.parentIds[0]);
                    if (par === null) 
                        continue;
                    if (lev === GarLevel.UNDEFINED || par.level === lev) 
                        lev = par.level;
                    else {
                        gars = null;
                        break;
                    }
                    let pp = Utils.as(par.attrs, AreaAttributes);
                    if (pp === null || pp.names.length === 0) 
                        continue;
                    if (it.gars.includes(par)) {
                        gars = null;
                        break;
                    }
                    let str0 = ap.names[0];
                    let str1 = pp.names[0];
                    let k = 0;
                    for (k = 0; (k < str0.length) && (k < str1.length); k++) {
                        if (str0[k] !== str1[k]) 
                            break;
                    }
                    if (k >= (str0.length - 1) || k >= (str1.length - 1)) {
                        if (gars === null) 
                            gars = new Array();
                        gars.push(g);
                        if (it0.gars.includes(par)) 
                            eqParens = true;
                    }
                }
                if (gars !== null && (gars.length < it.gars.length)) {
                    it.gars = gars;
                    if (!eqParens && j > 0) 
                        addr.items.splice(j, 1);
                }
                break;
            }
            if (it.gars.length > 1) {
                for (let j = i - 1; j >= 0; j--) {
                    let it0 = addr.items[j];
                    if (it0.gars.length === 0) 
                        continue;
                    let gars = null;
                    for (const g of it.gars) {
                        let ok = false;
                        if (it0.findGarByIds(g.parentIds) !== null) 
                            ok = true;
                        else 
                            for (const pid of g.parentIds) {
                                let p = this.getGarObject(pid);
                                if (p === null) 
                                    continue;
                                if (it0.findGarByIds(p.parentIds) !== null) {
                                    ok = true;
                                    break;
                                }
                            }
                        if (ok) {
                            if (gars === null) 
                                gars = new Array();
                            gars.push(g);
                        }
                    }
                    if (gars === null) 
                        continue;
                    if (gars.length < it.gars.length) 
                        it.gars = gars;
                    break;
                }
            }
        }
        if (it.gars.length > 1 && it.level === AddrLevel.STREET && aa.names.length > 0) {
            let hasNam = 0;
            for (const g of it.gars) {
                if (g.attrs.names.includes(aa.names[0]) || g.attrs.names[0].includes(aa.names[0])) 
                    hasNam++;
            }
            if (hasNam > 0 && (hasNam < it.gars.length)) {
                for (let k = it.gars.length - 1; k >= 0; k--) {
                    if (!it.gars[k].attrs.names.includes(aa.names[0]) && !it.gars[k].attrs.names[0].includes(aa.names[0])) 
                        it.gars.splice(k, 1);
                }
            }
        }
        if ((i > 0 && it.gars.length > 1 && it.level === AddrLevel.STREET) && addr.items[i - 1].level === AddrLevel.TERRITORY && addr.items[i - 1].gars.length === 1) {
            let g0 = addr.items[i - 1].gars[0];
            let hasNam = 0;
            for (const g of it.gars) {
                if (g0.parentIds.includes(g.id)) 
                    hasNam++;
            }
            if (hasNam > 0 && (hasNam < it.gars.length)) {
                for (let k = it.gars.length - 1; k >= 0; k--) {
                    if (!g0.parentIds.includes(it.gars[k].id)) 
                        it.gars.splice(k, 1);
                }
            }
        }
        if ((it.gars.length > 1 && i > 0 && it.level === AddrLevel.STREET) && addr.items[i - 1].gars.length === 1) {
            let g0 = addr.items[i - 1].gars[0];
            let hasNam = 0;
            for (const g of it.gars) {
                if (g.parentIds.length === 1 && g.parentIds[0] === g0.id && !g.expired) 
                    hasNam++;
            }
            if (hasNam > 0 && (hasNam < it.gars.length)) {
                for (let k = it.gars.length - 1; k >= 0; k--) {
                    if (it.gars[k].parentIds.length !== 1 || it.gars[k].parentIds[0] !== g0.id) 
                        it.gars.splice(k, 1);
                }
            }
        }
        if (it.gars.length > 1 && i > 0 && ((it.level === AddrLevel.STREET || aa.types.includes("улица")))) {
            if (aa.miscs.length === 0) {
                let has = 0;
                for (const g of it.gars) {
                    if (g.attrs.miscs.length > 0) 
                        has++;
                }
                if (has > 0 && (has < it.gars.length)) {
                    for (let k = it.gars.length - 1; k >= 0; k--) {
                        if (it.gars[k].attrs.miscs.length > 0) 
                            it.gars.splice(k, 1);
                    }
                }
                else if (has === it.gars.length && it.tag.ref !== null && it.tag.ref.occurrence.length > 0) {
                    let txt = it.tag.ref.occurrence[0].getText();
                    let ii = txt.lastIndexOf(',');
                    if (ii > 0) 
                        txt = txt.substring(ii + 1).trim();
                    txt = txt.toUpperCase();
                    let gars = new Array();
                    for (const g of it.gars) {
                        let ga = Utils.as(g.attrs, AreaAttributes);
                        if (ga.miscs.length === 0) 
                            continue;
                        let mi = ga.miscs[0];
                        if (txt.includes(mi) || txt.includes((mi[0] + "."))) 
                            gars.push(g);
                    }
                    if (gars.length > 0 && (gars.length < it.gars.length)) 
                        it.gars = gars;
                }
            }
            else {
                let has = 0;
                for (const g of it.gars) {
                    if (g.attrs.miscs.includes(aa.miscs[0])) 
                        has++;
                }
                if (has > 0 && (has < it.gars.length)) {
                    for (let k = it.gars.length - 1; k >= 0; k--) {
                        if (!it.gars[k].attrs.miscs.includes(aa.miscs[0])) 
                            it.gars.splice(k, 1);
                    }
                }
            }
            if (it.gars.length > 1 && aa.types.length > 1 && aa.types.includes("улица")) {
                let typ = (aa.types[0] === "улица" ? aa.types[1] : aa.types[0]);
                let has = 0;
                for (const g of it.gars) {
                    if (g.attrs.types.includes(typ)) 
                        has++;
                }
                if (has > 0 && (has < it.gars.length)) {
                    for (let k = it.gars.length - 1; k >= 0; k--) {
                        if (!it.gars[k].attrs.types.includes(typ)) 
                            it.gars.splice(k, 1);
                    }
                }
            }
        }
        if ((it.gars.length > 1 && i === 0 && it.level === AddrLevel.CITY) && aa.names.length > 0) {
            let gars1 = null;
            for (const g of it.gars) {
                for (let gg = g; gg !== null; ) {
                    if (gg.level !== GarLevel.REGION) {
                        if (gg.parentIds === null || gg.parentIds.length === 0) 
                            break;
                        gg = this.getGarObject(gg.parentIds[0]);
                        continue;
                    }
                    let aaa = Utils.as(gg.attrs, AreaAttributes);
                    if (aaa.names.length > 0 && aa.names[0].length > 3) {
                        if (aaa.names[0].startsWith(aa.names[0].substring(0, 0 + aa.names[0].length - 3))) {
                            if (gars1 === null) 
                                gars1 = new Array();
                            gars1.push(g);
                        }
                    }
                    break;
                }
            }
            if (gars1 !== null) 
                it.gars = gars1;
        }
        if (i === 0) {
            for (const g of it.gars) {
                if (g.regionNumber !== 0 && !regions.includes(g.regionNumber)) 
                    regions.push(g.regionNumber);
            }
        }
        if (it.gars.length > 10) 
            it.gars.splice(0, it.gars.length);
        it.sortGars();
    }
    
    static _findParentProb(it, ato) {
        if (ato.parentIds.length === 0) 
            return null;
        for (const ii of ato.parentIds) {
            let go = it.findGarById(("a" + ii));
            if (go !== null) 
                return go;
        }
        return null;
    }
    
    static init() {
        AnalyzeHelper.m_Proc0 = ProcessorService.createEmptyProcessor();
        AnalyzeHelper.m_Proc1 = ProcessorService.createProcessor();
        for (const a of AnalyzeHelper.m_Proc1.analyzers) {
            if (((a.name === "GEO" || a.name === "ADDRESS" || a.name === "NAMEDENTITY") || a.name === "DATE" || a.name === "PHONE") || a.name === "URI") {
            }
            else 
                a.ignoreThisAnalyzer = true;
        }
    }
    
    getGarObject(id) {
        if (id === null) 
            return null;
        let res = null;
        let wrapres102 = new RefOutArgWrapper();
        let inoutres103 = this.m_GarHash.tryGetValue(id, wrapres102);
        res = wrapres102.value;
        if (inoutres103) 
            return res;
        res = GarHelper.getObject(id);
        if (res === null) 
            return null;
        this.m_GarHash.put(id, res);
        if (id[0] !== 'a') 
            this.indexReadCount++;
        return res;
    }
    
    getHousesInStreet(id) {
        if (id === null) 
            return null;
        let res = null;
        let wrapres104 = new RefOutArgWrapper();
        let inoutres105 = this.m_Houses.tryGetValue(id, wrapres104);
        res = wrapres104.value;
        if (inoutres105) 
            return res;
        res = GarHelper.GAR_INDEX.getAOHouses(AnalyzeHelper._getId(id));
        if (res !== null) 
            this.indexReadCount++;
        this.m_Houses.put(id, res);
        return res;
    }
    
    getRoomsInObject(id) {
        if (id === null) 
            return null;
        let res = null;
        let wrapres106 = new RefOutArgWrapper();
        let inoutres107 = this.m_Rooms.tryGetValue(id, wrapres106);
        res = wrapres106.value;
        if (inoutres107) 
            return res;
        if (id[0] === 'h') 
            res = GarHelper.GAR_INDEX.getRoomsInHouse(AnalyzeHelper._getId(id));
        else if (id[0] === 'r') 
            res = GarHelper.GAR_INDEX.getRoomsInRooms(AnalyzeHelper._getId(id));
        if (res !== null) 
            this.indexReadCount++;
        this.m_Rooms.put(id, res);
        return res;
    }
    
    analyze(txt, corr, oneAddr, pars) {
        if (Utils.isNullOrEmpty(txt)) 
            return null;
        this.m_Params = pars;
        let co = null;
        if (corr !== null && corr.containsKey("")) 
            co = corr.get("");
        let secondVar = null;
        let detail = null;
        if (oneAddr) {
            let wrapsecondVar108 = new RefOutArgWrapper();
            let wrapdetail109 = new RefOutArgWrapper();
            txt = CorrectionHelper.correct(txt, wrapsecondVar108, wrapdetail109);
            secondVar = wrapsecondVar108.value;
            detail = wrapdetail109.value;
            this.correctedText = txt;
        }
        let res = this._analyze(txt, co, oneAddr);
        let res2 = (secondVar === null ? null : this._analyze(secondVar, co, oneAddr));
        if ((res !== null && oneAddr && res.length === 1) && res[0].items.length > 0 && AddressHelper.compareLevels(res[0].items[0].level, AddrLevel.TERRITORY) >= 0) {
            let ii = txt.indexOf(' ');
            if (ii > 0) {
                let txt1 = ("город " + txt.substring(0, 0 + ii) + ", " + txt.substring(ii + 1));
                let res1 = this._analyze(txt1, co, oneAddr);
                if ((res1 !== null && res1.length > 0 && res1[0].coef > res[0].coef) && res1[0].coef >= 80) 
                    res = res1;
            }
        }
        if (res !== null && res.length === 1 && res[0].lastItem !== null) {
            if (res2 !== null && res2.length === 1 && res2[0].coef > res[0].coef) {
                HouseRoomHelper.tryProcessDetails(res2[0], detail);
                return res2;
            }
            if (res[0].lastItem.gars.length > 0) {
                HouseRoomHelper.tryProcessDetails(res[0], detail);
                return res;
            }
        }
        if (res2 !== null && res2.length === 1) {
            if (res === null || res.length === 0 || (res[0].coef < res2[0].coef)) {
                HouseRoomHelper.tryProcessDetails(res2[0], detail);
                return res2;
            }
        }
        if (res !== null && detail !== null) {
            for (const r of res) {
                HouseRoomHelper.tryProcessDetails(r, detail);
            }
        }
        return res;
    }
    
    _analyze(txt, co, oneAddr) {
        if (AnalyzeHelper.m_Proc1 === null) 
            return new Array();
        let ar = null;
        ar = AnalyzeHelper.m_Proc1.process(SourceOfAnalysis._new110(txt, co, false, (oneAddr ? "ADDRESS" : null)), null, null);
        return this._analyze1(ar, txt, co, oneAddr);
    }
    
    _analyze1(ar, txt, co, oneAddr) {
        let res = new Array();
        if (ar === null || ar.firstToken === null) 
            return res;
        let regAcr = null;
        let acrEnd = null;
        if (((oneAddr && (ar.firstToken instanceof TextToken) && ar.firstToken.chars.isLetter) && ar.firstToken.lengthChar > 1 && (ar.firstToken.lengthChar < 4)) && ar.firstToken.next !== null) {
            regAcr = ar.firstToken.term;
            acrEnd = ar.firstToken;
        }
        else if ((((oneAddr && (ar.firstToken instanceof TextToken) && ar.firstToken.chars.isLetter) && ar.firstToken.lengthChar === 1 && ar.firstToken.next !== null) && ar.firstToken.next.isChar('.') && (ar.firstToken.next.next instanceof TextToken)) && ar.firstToken.next.next.chars.isLetter && ar.firstToken.next.next.lengthChar === 1) {
            regAcr = ar.firstToken.term + ar.firstToken.next.next.term;
            acrEnd = ar.firstToken.next.next;
            if (acrEnd.next !== null && acrEnd.next.isChar('.')) 
                acrEnd = acrEnd.next;
        }
        if (regAcr !== null && acrEnd.next !== null) {
            let regs = RegionHelper.getRegionsByAbbr(regAcr);
            if (regs !== null) {
                try {
                    let ar1 = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis(txt), null, null);
                    for (const r of regs) {
                        let ok = false;
                        for (let t = ar1.firstToken; t !== null; t = t.next) {
                            if (t.endChar <= acrEnd.endChar) 
                                continue;
                            let toks = r.termCities.tryParseAll(t, TerminParseAttr.NO);
                            if (toks !== null && toks.length === 1) {
                                ok = true;
                                break;
                            }
                        }
                        if (!ok) 
                            continue;
                        txt = (r.attrs.toString() + ", " + txt.substring(acrEnd.next.beginChar));
                        ar = AnalyzeHelper.m_Proc1.process(SourceOfAnalysis._new110(txt, co, false, (oneAddr ? "ADDRESS" : null)), null, null);
                        break;
                    }
                } catch (ex112) {
                }
            }
        }
        if (ar.firstToken.kit.correctedTokens !== null) {
            for (const kp of ar.firstToken.kit.correctedTokens.entries) {
                if (kp.key instanceof TextToken) {
                }
            }
        }
        let unknownNames = null;
        for (let t = ar.firstToken; t !== null; t = t.next) {
            if (t instanceof ReferentToken) {
                let r = t.getReferent();
                if (r === null) 
                    continue;
                if (r.typeName === "PHONE" || r.typeName === "URI") {
                    if (res.length > 0) 
                        res[res.length - 1].endChar = t.endChar;
                    continue;
                }
                let addr = new TextAddress();
                addr.beginChar = t.beginChar;
                addr.endChar = t.endChar;
                AnalyzeHelper._createAddressItems(addr, r, Utils.as(t, ReferentToken), 0);
                if (addr.items.length === 0) 
                    continue;
                addr.sortItems();
                res.push(addr);
                r.tag = addr;
                if (oneAddr && t.next !== null && t.next.isChar('(')) {
                    let br = BracketHelper.tryParse(t.next, BracketParseAttr.NO, 100);
                    if (br !== null && (br.lengthChar < 20)) {
                        t = br.endToken;
                        addr.endChar = t.endChar;
                    }
                }
                let tt = t.next;
                if (tt !== null && tt.isComma) 
                    tt = tt.next;
                if (oneAddr && (tt instanceof TextToken)) {
                    let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                    if ((ait !== null && ait.typ === AddressItemType.NUMBER && !Utils.isNullOrEmpty(ait.value)) && Utils.isLetter(ait.value[0])) 
                        ait.buildingType = AddressBuildingType.LITER;
                    if ((ait === null && tt.lengthChar === 1 && tt.chars.isAllUpper) && tt.chars.isLetter) 
                        ait = AddressItemToken._new113(AddressItemType.BUILDING, tt, tt, AddressBuildingType.LITER, tt.term);
                    if (ait !== null && ait.buildingType === AddressBuildingType.LITER) {
                        this.literaVariant = ait;
                        t = ait.endToken;
                        addr.endChar = t.endChar;
                    }
                }
            }
            else if ((t instanceof TextToken) && t.lengthChar > 3 && oneAddr) {
                let mc = t.getMorphClassInDictionary();
                if ((((((((mc.isVerb || t.isValue("ТОВАРИЩЕСТВО", null) || t.isValue("МУНИЦИПАЛЬНЫЙ", null)) || t.isValue("ГОРОДСКОЙ", null) || t.isValue("СТРАНА", null)) || t.isValue("ПОЧТОВЫЙ", null) || t.isValue("ОКАТО", null)) || t.isValue("СУБЪЕКТ", null) || t.isValue("СТОЛИЦА", null)) || t.isValue("КОРДОН", null) || t.isValue("КОРПУС", null)) || t.isValue("НОМЕР", null) || t.isValue("УЧЕТНЫЙ", null)) || t.isValue("ЗАПИСЬ", null) || t.isValue("ГОСУДАРСТВЕННЫЙ", null)) || t.isValue("РЕЕСТР", null) || t.isValue("ЛЕСНОЙ", null)) {
                }
                else if (t.isValue("ИНДЕКС", null)) {
                    if (res.length > 0) {
                        if ((t.next instanceof NumberToken) && t.next.lengthChar > 4) 
                            t = t.next;
                        res[res.length - 1].endChar = t.endChar;
                    }
                }
                else {
                    if (NumberHelper.tryParseRoman(t) !== null) 
                        continue;
                    let uuu = t.getSourceText();
                    if (Utils.startsWithString(uuu, "РОС", true) || Utils.startsWithString(uuu, "ФЕДЕР", true)) {
                    }
                    else {
                        if (unknownNames === null) 
                            unknownNames = new Array();
                        unknownNames.push(uuu);
                    }
                }
            }
        }
        if (unknownNames === null && res.length > 0) 
            res[0].beginChar = 0;
        for (let i = 0; i < (res.length - 1); i++) {
            if ((res[i].endChar + 30) > res[i + 1].beginChar) {
                if (res[i].items.length === 1 && res[i].items[0].level === AddrLevel.COUNTRY && res[i].items[0].toString() === "Россия") {
                    res[i + 1].beginChar = res[i].beginChar;
                    res.splice(i, 1);
                    i--;
                    continue;
                }
                if (res[i].lastItem.toString() === res[i + 1].items[0].toString()) {
                    res[i].endChar = res[i + 1].endChar;
                    Utils.removeItem(res[i].items, res[i].lastItem);
                    res[i].items.splice(res[i].items.length, 0, ...res[i + 1].items);
                    res.splice(i + 1, 1);
                    i--;
                    continue;
                }
                let str0 = res[i].toString();
                let str1 = res[i + 1].toString();
                if (res[i].items.length === res[i + 1].items.length && str0 === str1 && res[i].lastItem.tag === res[i + 1].lastItem.tag) {
                    if ((res[i + 1].endChar - res[i + 1].beginChar) > 10) 
                        res[i].endChar = res[i + 1].endChar;
                    res.splice(i + 1, 1);
                    i--;
                    continue;
                }
                if (str1.startsWith(str0)) {
                    if ((res[i + 1].endChar - res[i + 1].beginChar) < 10) {
                        res.splice(i + 1, 1);
                        i--;
                        continue;
                    }
                    res[i + 1].beginChar = res[i].beginChar;
                    res.splice(i, 1);
                    i--;
                    continue;
                }
                if (str0.startsWith(str1)) {
                    if (res[i + 1].endChar > res[i].endChar) 
                        res[i].endChar = res[i + 1].endChar;
                    res.splice(i + 1, 1);
                    i--;
                    continue;
                }
                let ok = res[i].lastItem.canBeParentFor(res[i + 1].items[0], null);
                if (res[i].items.length === 1 && res[i].items[0].level === AddrLevel.CITY && res[i + 1].items[0].level === AddrLevel.CITY) {
                    ok = true;
                    res[i].items[0].level = AddrLevel.REGIONCITY;
                }
                if (ok) {
                    res[i].endChar = res[i + 1].endChar;
                    res[i].items.splice(res[i].items.length, 0, ...res[i + 1].items);
                    res.splice(i + 1, 1);
                    i--;
                }
            }
        }
        for (let k = 0; k < res.length; k++) {
            let r = res[k];
            if (oneAddr) 
                r.text = txt;
            let ad = Utils.as(r.lastItem.tag, AddressReferent);
            if (ad !== null) 
                r.items.splice(r.items.length - 1, 1);
            let r2 = r.clone();
            let r3 = r.clone();
            let hasSecVar = false;
            this.createAltsRegime = false;
            let wraphasSecVar115 = new RefOutArgWrapper();
            let ad2 = this._processAddress(r, wraphasSecVar115);
            hasSecVar = wraphasSecVar115.value;
            this._processRest(r, (ad != null ? ad : ad2), oneAddr, ar);
            CoefHelper.calcCoef(this, r, oneAddr, txt, unknownNames);
            if (r.coef === 100 && !hasSecVar) 
                continue;
            if (hasSecVar) {
                this.createAltsRegime = true;
                let wraphasSecVar114 = new RefOutArgWrapper();
                ad2 = this._processAddress(r2, wraphasSecVar114);
                hasSecVar = wraphasSecVar114.value;
                this._processRest(r2, (ad != null ? ad : ad2), oneAddr, ar);
                CoefHelper.calcCoef(this, r2, oneAddr, txt, unknownNames);
                if (r2.coef > r.coef) {
                    res[k] = r2;
                    r = r2;
                }
                else if ((r2.coef === r.coef && r2.errorMessage === null && r.errorMessage !== null) && r2.lastItemWithGar !== null && r.lastItemWithGar !== null) {
                    if (AddressHelper.compareLevels(r2.lastItemWithGar.level, r.lastItemWithGar.level) > 0) {
                        res[k] = r2;
                        r = r2;
                    }
                }
            }
            if (r.coef >= 95) 
                continue;
            if (!oneAddr) 
                continue;
            if ((r3.items.length < 2) || res.length > 1) 
                continue;
            let reg = RegionHelper.isBigCityA(r3.items[0]);
            if (reg !== null && reg.capital !== null && r3.items[0].attrs.containsName(reg.capital)) {
            }
            else if (r3.items.length > 1 && r3.items[0].level === AddrLevel.DISTRICT && r3.items[1].level === AddrLevel.CITY) {
                reg = RegionHelper.isBigCityA(r3.items[1]);
                if (reg !== null && reg.capital !== null && r3.items[1].attrs.containsName(reg.capital)) {
                    let it = r3.items[0];
                    r3.items.splice(0, 1);
                    r3.items.splice(1, 0, it);
                }
                else 
                    continue;
            }
            else 
                continue;
            let txt1 = reg.replaceCapitalByRegion(txt);
            if (txt1 !== null && txt !== txt1) {
                let res2 = this.analyze(txt1, null, true, this.m_Params);
                if (res2 !== null && res2.length === 1 && res2[0].coef > r.coef) 
                    return res2;
            }
        }
        if (res.length > 1 && oneAddr) {
            if (res[0].endChar > res[0].beginChar) 
                res.splice(1, res.length - 1);
        }
        if (res.length > 1 && oneAddr) {
            res[0].coef = Utils.intDiv(res[0].coef, res.length);
            let msg = ("В строке выделилось " + res.length + " адрес" + (res.length < 5 ? "а" : "ов") + ", второй: " + res[1].toString() + ". ");
            if (res[0].errorMessage === null) 
                res[0].errorMessage = msg;
            else 
                res[0].errorMessage = (res[0].errorMessage + " " + msg);
        }
        for (const r of res) {
            CorrectionHelper.correctCountry(r);
        }
        return res;
    }
    
    createTextAddressByReferent(r) {
        let addr = new TextAddress();
        AnalyzeHelper._createAddressItems(addr, r, null, 0);
        if (addr.items.length === 0) 
            return null;
        addr.sortItems();
        r.tag = addr;
        let ad = Utils.as(addr.lastItem.tag, AddressReferent);
        if (ad !== null) 
            addr.items.splice(addr.items.length - 1, 1);
        let r2 = r.clone();
        let r3 = r.clone();
        let hasSecVar = false;
        this.createAltsRegime = false;
        let wraphasSecVar116 = new RefOutArgWrapper();
        let ad2 = this._processAddress(addr, wraphasSecVar116);
        hasSecVar = wraphasSecVar116.value;
        this._processRest(addr, (ad != null ? ad : ad2), true, null);
        CoefHelper.calcCoef(this, addr, true, null, null);
        CorrectionHelper.correctCountry(addr);
        return addr;
    }
    
    static _createAddressItems(addr, r, rt, lev) {
        if (lev > 10 || r === null) 
            return;
        let own = null;
        let own2 = null;
        let sown = null;
        let sown2 = null;
        let sown22 = null;
        let detailTyp = DetailType.UNDEFINED;
        let detailParam = null;
        let detailOrg = null;
        if (r instanceof GeoReferent) {
            let geo = Utils.as(r, GeoReferent);
            if (geo.isState) {
                if (geo.isState && geo.alpha2 !== null) {
                    if (geo.alpha2 === "RU" && lev > 0) 
                        return;
                    let cou = CorrectionHelper.createCountry(geo.alpha2, geo);
                    if (cou !== null) {
                        if (addr.items.length > 0 && addr.items[0].level === AddrLevel.COUNTRY) {
                        }
                        else 
                            addr.items.push(cou);
                        return;
                    }
                }
            }
            let aa = new AreaAttributes();
            let res = new AddrObject(aa);
            if ((r instanceof GeoReferent) && Utils.compareStrings(r.toString(), "ДНР", true) === 0) {
                r = new GeoReferent();
                r.addSlot(GeoReferent.ATTR_TYPE, "республика", false, 0);
                r.addSlot(GeoReferent.ATTR_NAME, "ДОНЕЦКАЯ", false, 0);
                res.level = AddrLevel.REGIONAREA;
            }
            else if ((r instanceof GeoReferent) && Utils.compareStrings(r.toString(), "ЛНР", true) === 0) {
                r = new GeoReferent();
                r.addSlot(GeoReferent.ATTR_TYPE, "республика", false, 0);
                r.addSlot(GeoReferent.ATTR_NAME, "ЛУГАНСКАЯ", false, 0);
                res.level = AddrLevel.REGIONAREA;
            }
            if (geo.toString() === "область Читинская") {
                geo = new GeoReferent();
                geo.addSlot(GeoReferent.ATTR_NAME, "ЗАБАЙКАЛЬСКИЙ", false, 0);
                geo.addSlot(GeoReferent.ATTR_TYPE, "край", false, 0);
                r = geo;
            }
            let typs = r.getStringValues(GeoReferent.ATTR_TYPE);
            if (geo.alpha2 === "UA" || geo.alpha2 === "BY" || geo.alpha2 === "KZ") 
                aa.types.push("республика");
            else if (typs.length > 0) 
                aa.types.splice(aa.types.length, 0, ...typs);
            AnalyzeHelper._setName(aa, r, GeoReferent.ATTR_NAME);
            AnalyzeHelper._setMisc(aa, r, GeoReferent.ATTR_MISC);
            aa.number = r.getStringValue("NUMBER");
            let na = new NameAnalyzer();
            na.initByReferent(r, false);
            res.tag = na;
            addr.items.push(res);
            own = geo.higher;
            if (res.level === AddrLevel.UNDEFINED) 
                res.level = na.level;
            else 
                na.level = res.level;
            r.tag = res;
            if (r.ontologyItems !== null && r.ontologyItems.length > 0) {
                if ((typeof r.ontologyItems[0].extId === 'string' || r.ontologyItems[0].extId instanceof String)) 
                    res.extId = Utils.asString(r.ontologyItems[0].extId);
            }
        }
        else if (r instanceof StreetReferent) {
            sown = r.higher;
            let uni = NameAnalyzer.mergeObjects(sown, r);
            if (uni !== null) {
                AnalyzeHelper._createAddressItems(addr, uni, rt, lev + 1);
                r.tag = addr;
                sown.tag = addr;
                return;
            }
            let aa = new AreaAttributes();
            let res = new AddrObject(aa);
            aa.types.splice(aa.types.length, 0, ...r.typs);
            if (aa.types.length > 1 && aa.types.includes("улица")) {
                Utils.removeItem(aa.types, "улица");
                aa.types.push("улица");
            }
            AnalyzeHelper._setName(aa, r, StreetReferent.ATTR_NAME);
            AnalyzeHelper._setMisc(aa, r, StreetReferent.ATTR_MISC);
            let ki = r.kind;
            if (ki === StreetKind.ROAD) 
                aa.miscs.push("дорога");
            aa.number = r.numbers;
            if ((aa.number !== null && aa.number.endsWith("км") && aa.names.length === 0) && ki !== StreetKind.ROAD) {
                aa.types.push("километр");
                aa.number = aa.number.substring(0, 0 + aa.number.length - 2);
            }
            let na = new NameAnalyzer();
            na.initByReferent(r, false);
            res.tag = na;
            addr.items.push(res);
            own = Utils.as(r.getSlotValue(StreetReferent.ATTR_GEO), GeoReferent);
            res.level = na.level;
            if (ki === StreetKind.ROAD && res.level === AddrLevel.STREET) 
                res.level = AddrLevel.TERRITORY;
            r.tag = res;
        }
        else if (r instanceof AddressReferent) {
            let ar = Utils.as(r, AddressReferent);
            sown = Utils.as(ar.getSlotValue(AddressReferent.ATTR_STREET), StreetReferent);
            let streets = ar.streets;
            if (streets.length > 1) {
                if (ar.detail === AddressDetailType.CROSS) 
                    sown2 = Utils.as(streets[1], StreetReferent);
                else if (sown.typs.includes("очередь") || ar.streets[1].typs.includes("очередь")) 
                    sown2 = Utils.as(streets[1], StreetReferent);
                else 
                    sown2 = Utils.as(streets[1], StreetReferent);
            }
            if (streets.length > 2) 
                sown22 = Utils.as(streets[2], StreetReferent);
            let geos = ar.geos;
            if (geos.length > 0) {
                own = geos[0];
                if (geos.length > 1) 
                    own2 = geos[1];
            }
            if (ar.detail !== AddressDetailType.UNDEFINED && ar.detail !== AddressDetailType.CROSS) {
                let wrapdetailParam117 = new RefOutArgWrapper();
                detailTyp = HouseRoomHelper.createDirDetails(ar, wrapdetailParam117);
                detailParam = wrapdetailParam117.value;
                let own3 = Utils.as(ar.getSlotValue(AddressReferent.ATTR_DETAILREF), GeoReferent);
                if (own3 !== null) {
                    if (own3.higher === null) 
                        own3.higher = own;
                    if (own === null) 
                        own = own3;
                    else if (own3.higher === own) 
                        own = own3;
                    else if (own3.higher !== null && ((own3.higher.higher === null || own3.higher.higher === own)) && GeoOwnerHelper.canBeHigher(own, own3.higher, null, null)) {
                        own3.higher.higher = own;
                        if (sown !== null && sown.parentReferent === own) {
                            sown.addSlot(StreetReferent.ATTR_GEO, own3, true, 0);
                            own = null;
                        }
                        else 
                            own = own3;
                    }
                }
            }
            else {
                let org = Utils.as(ar.getSlotValue(AddressReferent.ATTR_DETAILREF), OrganizationReferent);
                if (org !== null) {
                    let aa = new AreaAttributes();
                    detailOrg = new AddrObject(aa);
                    detailOrg.level = AddrLevel.TERRITORY;
                    aa.types.push("территория");
                    AnalyzeHelper._setName(aa, org, OrganizationReferent.ATTR_NAME);
                    AnalyzeHelper._setMisc(aa, org, OrganizationReferent.ATTR_TYPE);
                    aa.number = org.number;
                    let na = new NameAnalyzer();
                    na.initByReferent(org, false);
                    detailOrg.tag = na;
                    addr.items.push(detailOrg);
                }
            }
            if (ar.block !== null) {
                let sr = new StreetReferent();
                sr.addSlot(StreetReferent.ATTR_TYPE, "блок", false, 0);
                sr.addSlot(StreetReferent.ATTR_NUMBER, ar.block, false, 0);
                let aa = new AreaAttributes();
                aa.types.push("блок");
                aa.number = ar.block;
                let ao = AddrObject._new118(aa, AddrLevel.STREET);
                let na = new NameAnalyzer();
                na.initByReferent(sr, false);
                ao.tag = na;
                addr.items.push(ao);
            }
            let ha = new HouseAttributes();
            let res = new AddrObject(ha);
            res.level = AddrLevel.BUILDING;
            res.tag = ar;
            r.tag = res;
            addr.items.push(res);
        }
        if (sown !== null) {
            let addr1 = new TextAddress();
            AnalyzeHelper._createAddressItems(addr1, sown, null, lev + 1);
            if (addr1.items.length > 0) {
                if (addr1.lastItem.canBeParentFor(addr.items[0], null)) {
                    addr.items.splice(0, 0, ...addr1.items);
                    if (sown2 !== null) {
                        let addr2 = new TextAddress();
                        AnalyzeHelper._createAddressItems(addr2, sown2, null, lev + 1);
                        if (addr2.lastItem !== null && addr2.lastItem.canBeEqualsLevel(addr1.lastItem)) {
                            let a1 = Utils.as(addr1.lastItem.attrs, AreaAttributes);
                            let a2 = Utils.as(addr2.lastItem.attrs, AreaAttributes);
                            if (a1.types.includes("очередь") && a1.number !== null && a1.names.length === 0) {
                                addr.params.put(ParamType.ORDER, a1.number);
                                addr.items[addr1.items.length - 1] = addr2.lastItem;
                            }
                            else if (a2.types.includes("очередь") && a2.number !== null && a2.names.length === 0) 
                                addr.params.put(ParamType.ORDER, a1.number);
                            else if (addr2.lastItem.level === AddrLevel.TERRITORY) {
                                addr.items.splice(addr1.items.length, 0, addr2.lastItem);
                                if (sown22 !== null) {
                                    let addr3 = new TextAddress();
                                    AnalyzeHelper._createAddressItems(addr3, sown22, null, lev + 1);
                                    if (addr3.lastItem !== null && addr3.lastItem.level === addr1.lastItem.level) 
                                        addr.items.splice(addr1.items.length + 1, 0, addr3.lastItem);
                                }
                            }
                            else 
                                addr1.lastItem.crossObject = addr2.lastItem;
                        }
                    }
                }
                else if (addr1.lastItem.level === AddrLevel.STREET && ((addr.items[0].level === AddrLevel.TERRITORY || addr.items[0].level === AddrLevel.STREET))) 
                    addr.items.splice(0, 0, ...addr1.items);
            }
        }
        if (own !== null) {
            let addr1 = new TextAddress();
            AnalyzeHelper._createAddressItems(addr1, own, null, lev + 1);
            if (addr1.items.length > 0) {
                if (detailTyp !== DetailType.UNDEFINED && sown !== null) {
                    addr1.lastItem.detailTyp = detailTyp;
                    addr1.lastItem.detailParam = detailParam;
                }
                let ins = false;
                if (AddressHelper.compareLevels(addr1.lastItem.level, addr.items[0].level) < 0) 
                    ins = true;
                else if (addr1.lastItem.canBeParentFor(addr.items[0], null)) 
                    ins = true;
                else if (addr1.lastItem.level === AddrLevel.CITY && ((addr.items[0].level === AddrLevel.DISTRICT || addr.items[0].level === AddrLevel.SETTLEMENT))) 
                    ins = true;
                else if (addr1.lastItem.level === AddrLevel.DISTRICT && addr.items[0].level === AddrLevel.LOCALITY) 
                    ins = true;
                if (ins) {
                    if (addr.toString().startsWith(addr1.toString())) {
                    }
                    else 
                        addr.items.splice(0, 0, ...addr1.items);
                }
                else if (addr1.lastItem.level === AddrLevel.SETTLEMENT && addr.items[0].level === AddrLevel.DISTRICT) {
                    if (addr.toString().startsWith(addr1.toString())) {
                    }
                    else {
                        let it0 = addr.items[0];
                        addr.items.splice(0, addr.items.length);
                        addr.items.splice(addr.items.length, 0, ...addr1.items);
                        addr.items.splice(addr.items.length - 1, 0, it0);
                    }
                }
                else if (detailTyp !== DetailType.UNDEFINED && addr1.lastItem.detailTyp !== DetailType.UNDEFINED && (addr1.items.length < addr.items.length)) {
                    let i = 0;
                    for (i = 0; i < (addr1.items.length - 1); i++) {
                        if (addr1.items[i].toString() !== addr.items[i].toString()) 
                            break;
                    }
                    if (i === (addr1.items.length - 1) && (AddressHelper.compareLevels(addr1.items[i].level, addr.items[i].level) < 0)) 
                        addr.items.splice(i, 0, addr1.items[i]);
                }
            }
        }
        if (addr.lastItem !== null) {
            let aa = Utils.as(addr.lastItem.attrs, AreaAttributes);
            let na = Utils.as(addr.lastItem.tag, NameAnalyzer);
            if ((aa !== null && aa.names.length > 0 && aa.number !== null) && aa.number.endsWith("км") && na.sec !== null) {
                let aa1 = new AreaAttributes();
                aa1.number = aa.number.substring(0, 0 + aa.number.length - 2);
                aa1.types.push("километр");
                let km = new AddrObject(aa1);
                km.level = AddrLevel.STREET;
                addr.lastItem.level = AddrLevel.TERRITORY;
                km.tag = na.sec;
                na.sec = null;
                aa.number = null;
                addr.items.push(km);
            }
        }
    }
    
    static _setName(a, r, typ) {
        if (r === null) 
            return;
        let names = r.getStringValues(typ);
        if (names === null || names.length === 0) 
            return;
        let longName = null;
        for (let i = 0; i < names.length; i++) {
            let nam = names[i];
            let ii = nam.indexOf('-');
            if (ii > 0 && ((ii + 1) < nam.length) && Utils.isDigit(nam[ii + 1])) {
                a.number = nam.substring(ii + 1);
                r.addSlot("NUMBER", a.number, false, 0);
                let ss = r.findSlot("NAME", nam, true);
                if (ss !== null) 
                    Utils.removeItem(r.slots, ss);
                nam = nam.substring(0, 0 + ii);
                r.addSlot("NAME", nam, false, 0);
            }
            if (nam === "МИКРОРАЙОН") {
                if (!a.types.includes(nam.toLowerCase())) 
                    a.types.push(nam.toLowerCase());
                names.splice(i, 1);
                i--;
                continue;
            }
            names[i] = MiscHelper.convertFirstCharUpperAndOtherLower(nam);
            if (longName === null) 
                longName = names[i];
            else if (longName.length > names[i].length) 
                longName = names[i];
        }
        if (names.length > 1 && names[0] !== longName) {
            Utils.removeItem(names, longName);
            names.splice(0, 0, longName);
        }
        a.names = names;
    }
    
    static _setMisc(a, r, nam) {
        a.miscs = r.getStringValues(nam);
        if (a.miscs.length > 0) {
            let hasUp = false;
            for (const m of a.miscs) {
                if (Utils.isUpperCase(m[0])) 
                    hasUp = true;
            }
            if (hasUp) {
                for (let i = a.miscs.length - 1; i >= 0; i--) {
                    if (!Utils.isUpperCase(a.miscs[i][0])) 
                        a.miscs.splice(i, 1);
                }
            }
        }
    }
    
    static static_constructor() {
        AnalyzeHelper.m_Proc0 = null;
        AnalyzeHelper.m_Proc1 = null;
    }
}


AnalyzeHelper.static_constructor();

module.exports = AnalyzeHelper