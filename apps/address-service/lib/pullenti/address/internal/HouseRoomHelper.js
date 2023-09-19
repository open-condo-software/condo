/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const ProcessorService = require("./../../ner/ProcessorService");
const SourceOfAnalysis = require("./../../ner/SourceOfAnalysis");
const NumberItemClass = require("./NumberItemClass");
const RoomType = require("./../RoomType");
const RoomAttributes = require("./../RoomAttributes");
const TextToken = require("./../../ner/TextToken");
const DetailType = require("./../DetailType");
const AddressItemToken = require("./../../ner/address/internal/AddressItemToken");
const GarLevel = require("./../GarLevel");
const AddressDetailType = require("./../../ner/address/AddressDetailType");
const AddressItemType = require("./../../ner/address/internal/AddressItemType");
const ParamType = require("./../ParamType");
const HouseType = require("./../HouseType");
const AddressBuildingType = require("./../../ner/address/AddressBuildingType");
const StroenType = require("./../StroenType");
const AddressHouseType = require("./../../ner/address/AddressHouseType");
const AddrLevel = require("./../AddrLevel");
const AddressHelper = require("./../AddressHelper");
const BaseAttributes = require("./../BaseAttributes");
const AreaAttributes = require("./../AreaAttributes");
const HouseAttributes = require("./../HouseAttributes");
const GarHelper = require("./GarHelper");
const AddrObject = require("./../AddrObject");
const AddressReferent = require("./../../ner/address/AddressReferent");

class HouseRoomHelper {
    
    static _getNumsCount(ha) {
        if (ha === null) 
            return 0;
        let cou = 0;
        if (ha.number !== null) 
            cou++;
        if (ha.stroenNumber !== null) 
            cou++;
        if (ha.buildNumber !== null) 
            cou++;
        return cou;
    }
    
    static _getHouseType(ht) {
        if (ht === AddressHouseType.ESTATE) 
            return HouseType.ESTATE;
        if (ht === AddressHouseType.HOUSE) 
            return HouseType.HOUSE;
        if (ht === AddressHouseType.HOUSEESTATE) 
            return HouseType.HOUSEESTATE;
        if (ht === AddressHouseType.SPECIAL) 
            return HouseType.SPECIAL;
        return HouseType.UNDEFINED;
    }
    
    static _getStroenType(bt) {
        if (bt === AddressBuildingType.BUILDING) 
            return StroenType.BUILDING;
        if (bt === AddressBuildingType.CONSTRUCTION) 
            return StroenType.CONSTRUCTION;
        if (bt === AddressBuildingType.LITER) 
            return StroenType.LITER;
        return StroenType.UNDEFINED;
    }
    
    static processHouseAndRooms(ah, ar, addr) {
        if (ar.box !== null && ((ar.house !== null || ar.building !== null || ar.corpus !== null))) {
            let ar2 = new AddressReferent();
            ar2.box = ar.box;
            ar.box = null;
            HouseRoomHelper.processHouseAndRooms(ah, ar, addr);
            ar.box = ar2.box;
            HouseRoomHelper.processHouseAndRooms(ah, ar2, addr);
            return;
        }
        if (ar.plot !== null && ((ar.house !== null || ar.building !== null || ar.corpus !== null))) {
            let ar2 = new AddressReferent();
            ar2.plot = ar.plot;
            ar.plot = null;
            HouseRoomHelper.processHouseAndRooms(ah, ar2, addr);
            HouseRoomHelper.processHouseAndRooms(ah, ar, addr);
            ar.box = ar2.plot;
            return;
        }
        if (addr.lastItem === null) 
            return;
        let plot = null;
        let house = null;
        let addHouse = null;
        let tr = null;
        let flatNum = null;
        if (ar.field !== null && AddressHelper.compareLevels(addr.lastItem.level, AddrLevel.TERRITORY) <= 0) {
            let aa = new AreaAttributes();
            aa.types.push("поле");
            aa.number = ar.field;
            addr.items.push(AddrObject._new118(aa, AddrLevel.STREET));
        }
        let ao = null;
        for (let i = addr.items.length - 1; i >= 0; i--) {
            let ao0 = addr.items[i];
            if ((ao0.level === AddrLevel.TERRITORY || ao0.level === AddrLevel.STREET || ao0.level === AddrLevel.LOCALITY) || ao0.level === AddrLevel.CITY) {
                if (ao0.gars.length > 0) {
                    ao = ao0;
                    break;
                }
                if (ao0.level === AddrLevel.LOCALITY) 
                    break;
            }
        }
        if (GarHelper.GAR_INDEX !== null && ao !== null && ao.gars.length > 0) {
            let hobjs = null;
            for (let kk = 0; kk < 2; kk++) {
                for (const g of ao.gars) {
                    if (g.childrenCount === 0) 
                        continue;
                    let hinstr = ah.getHousesInStreet(g.id);
                    if (hinstr === null) 
                        continue;
                    hobjs = null;
                    if (ah.literaVariant !== null && ar.building === null) {
                        let arr = Utils.as(ar.clone(), AddressReferent);
                        arr.building = ah.literaVariant.value;
                        arr.buildingType = AddressBuildingType.LITER;
                        hobjs = HouseRoomHelper._findHousesNew(ah, hinstr, arr, (ao.crossObject !== null ? 1 : 0));
                    }
                    if (hobjs === null) {
                        if (addr.items[addr.items.length - 1].level === AddrLevel.STREET) {
                            let aa = Utils.as(addr.items[addr.items.length - 1].attrs, AreaAttributes);
                            if (aa.number !== null && aa.types.includes("блок") && ar.box !== null) {
                                let ar2 = Utils.as(ar.clone(), AddressReferent);
                                ar2.box = (ar2.box + "/" + aa.number);
                                hobjs = HouseRoomHelper._findHousesNew(ah, hinstr, ar2, (ao.crossObject !== null ? 1 : 0));
                            }
                        }
                        if (hobjs === null) 
                            hobjs = HouseRoomHelper._findHousesNew(ah, hinstr, ar, (ao.crossObject !== null ? 1 : 0));
                    }
                    let ar0 = ar;
                    if (hobjs !== null) {
                    }
                    else if (ar.flat === null && ar.corpusOrFlat === null && ao.crossObject === null) {
                        let num = Utils.notNull(ar.house, ar.houseOrPlot);
                        let ii = -1;
                        let hiph = false;
                        if (num !== null) {
                            if ((((ii = num.indexOf('/')))) < 0) {
                                ii = num.indexOf('-');
                                if (ii > 0) 
                                    hiph = true;
                            }
                        }
                        if (hobjs !== null && HouseRoomHelper._getNumsCount(Utils.as(hobjs[0].attrs, HouseAttributes)) > 1) 
                            ii = -1;
                        let nn = 0;
                        if (ii > 0) {
                            let wrapnn133 = new RefOutArgWrapper();
                            Utils.tryParseInt(num.substring(ii + 1), wrapnn133);
                            nn = wrapnn133.value;
                        }
                        if (nn > 0 || ((ii > 0 && !hiph))) {
                            let ar2 = new AddressReferent();
                            ar2.house = num.substring(0, 0 + ii);
                            ar2.flat = num.substring(ii + 1);
                            let hobjs2 = HouseRoomHelper._findHousesNew(ah, hinstr, ar2, 0);
                            if (hobjs2 !== null) {
                                hobjs = hobjs2;
                                flatNum = num.substring(ii + 1);
                                if ((((ii = flatNum.indexOf('-')))) > 0) 
                                    flatNum = flatNum.substring(ii + 1);
                                ar2.flat = flatNum;
                                ar0 = ar2;
                            }
                        }
                        else if (hiph) {
                            let a1 = new AddressReferent();
                            a1.house = num.substring(ii + 1);
                            let hobjs2 = HouseRoomHelper._findHousesNew(ah, hinstr, a1, (ao.crossObject !== null ? 1 : 0));
                            if (hobjs2 !== null && hobjs2.length === 1) {
                                let ao1 = AddrObject._new118(hobjs2[0].attrs, AddrLevel.BUILDING);
                                ao1.gars.push(hobjs2[0]);
                                if (addr.additionalItems === null) 
                                    addr.additionalItems = new Array();
                                addr.additionalItems.push(ao1);
                            }
                        }
                    }
                    if (hobjs !== null) {
                        for (const gh of hobjs) {
                            if (gh.attrs.typ === HouseType.PLOT) {
                                if (plot === null) 
                                    plot = AddrObject._new118(gh.attrs.clone(), AddrLevel.PLOT);
                                plot.gars.push(gh);
                                continue;
                            }
                            if (house === null) 
                                house = AddrObject._new118(gh.attrs.clone(), AddrLevel.BUILDING);
                            house.gars.push(gh);
                            if (gh.tag instanceof Array) {
                                let gobjs2 = Utils.as(gh.tag, Array);
                                addHouse = AddrObject._new118(gobjs2[0].attrs.clone(), AddrLevel.BUILDING);
                                addHouse.gars.splice(addHouse.gars.length, 0, ...gobjs2);
                            }
                            if (ar.corpusOrFlat !== null && gh.attrs.buildNumber === ar.corpusOrFlat) {
                                ar.corpusOrFlat = null;
                                ar.corpus = gh.attrs.buildNumber;
                            }
                            else if (gh.childrenCount > 0) {
                                let rih = ah.getRoomsInObject(gh.id);
                                let gg = HouseRoomHelper._findRoomNew(ah, rih, ar0);
                                if (gg !== null) {
                                    if (tr === null) 
                                        tr = AddrObject._new118(gg.attrs, AddrLevel.APARTMENT);
                                    tr.gars.push(gg);
                                }
                            }
                        }
                    }
                }
                if (ao.crossObject !== null) {
                    let num = Utils.notNull(ar.house, ar.houseOrPlot);
                    for (const g of ao.crossObject.gars) {
                        if (g.childrenCount === 0) 
                            continue;
                        let hinstr = ah.getHousesInStreet(g.id);
                        if (hinstr === null) 
                            continue;
                        hobjs = HouseRoomHelper._findHousesNew(ah, hinstr, ar, 2);
                        ah.indexReadCount++;
                        if (hobjs !== null) {
                            for (const gh of hobjs) {
                                if (house === null) {
                                    if (num === null || (num.indexOf('/') < 0)) 
                                        continue;
                                    house = AddrObject._new118(gh.attrs.clone(), AddrLevel.BUILDING);
                                    house.attrs.number = num.substring(0, 0 + num.indexOf('/'));
                                }
                                if (house.crossObject === null) 
                                    house.crossObject = AddrObject._new118(gh.attrs, AddrLevel.BUILDING);
                                house.crossObject.gars.push(gh);
                                let gg = HouseRoomHelper._findRoomNew(ah, ah.getRoomsInObject(gh.id), ar);
                                if (gg !== null) {
                                    if (tr === null) 
                                        tr = AddrObject._new118(gg.attrs, AddrLevel.APARTMENT);
                                    tr.gars.push(gg);
                                }
                            }
                        }
                    }
                    if (house !== null && house.crossObject === null) {
                        if (num !== null && num.indexOf('/') > 0) {
                            house.crossObject = AddrObject._new118(house.attrs.clone(), AddrLevel.BUILDING);
                            house.crossObject.attrs.number = num.substring(num.indexOf('/') + 1);
                        }
                    }
                }
                if (hobjs !== null) 
                    break;
                let i = addr.items.indexOf(ao);
                if (i > 0 && addr.items[i - 1].level === AddrLevel.LOCALITY && addr.items[i - 1].gars.length > 0) 
                    ao = addr.items[i - 1];
                else 
                    break;
            }
        }
        if (plot !== null && house !== null) {
            if (ar.houseOrPlot !== null) 
                plot = null;
        }
        if (plot === null && ar.plot !== null) 
            plot = AddrObject._new118(HouseAttributes._new143(HouseType.PLOT, (ar.plot === "0" ? "б/н" : ar.plot)), AddrLevel.PLOT);
        if (plot !== null) {
            plot.sortGars();
            addr.items.push(plot);
        }
        if (house === null && plot === null) {
            if (ar.house !== null) 
                house = new AddrObject(HouseAttributes._new143(HouseRoomHelper._getHouseType(ar.houseType), (ar.house === "0" ? "б/н" : ar.house)));
            if (ar.houseOrPlot !== null) 
                house = new AddrObject(HouseAttributes._new143(HouseType.UNDEFINED, (ar.houseOrPlot === "0" ? "б/н" : ar.houseOrPlot)));
            if (ar.building !== null && ((ar.building !== "0" || house === null))) {
                if (house === null) 
                    house = AddrObject._new118(new HouseAttributes(), AddrLevel.BUILDING);
                house.attrs.stroenNumber = (ar.building === "0" ? "б/н" : ar.building);
                house.attrs.stroenTyp = HouseRoomHelper._getStroenType(ar.buildingType);
            }
            if (ar.corpus !== null && ((ar.corpus !== "0" || house === null))) {
                if (house === null) 
                    house = AddrObject._new118(new HouseAttributes(), AddrLevel.BUILDING);
                house.attrs.buildNumber = (ar.corpus === "0" ? "б/н" : ar.corpus);
            }
            if (house === null && ar.box !== null) 
                house = new AddrObject(HouseAttributes._new143(HouseType.GARAGE, (ar.box === "0" ? "б/н" : ar.box)));
            if (house === null && ar.well !== null) 
                house = new AddrObject(HouseAttributes._new143(HouseType.WELL, (ar.well === "0" ? "б/н" : ar.well)));
            if (house !== null) {
                house.level = AddrLevel.BUILDING;
                if (house.attrs.typ === HouseType.UNDEFINED && house.attrs.number !== null) {
                    let it = addr.findItemByLevel(AddrLevel.TERRITORY);
                    if (it !== null) {
                        let aa = Utils.as(it.attrs, AreaAttributes);
                        for (const m of aa.miscs) {
                            if (m.includes("гараж")) {
                                house.attrs.typ = HouseType.GARAGE;
                                break;
                            }
                        }
                    }
                }
                if (ar.corpusOrFlat !== null) 
                    house.attrs.buildNumber = ar.corpusOrFlat;
            }
        }
        if (house !== null) {
            if (ao !== null && ao.crossObject !== null && house.crossObject === null) {
                let num = house.attrs.number;
                if (num !== null && num.indexOf('/') > 0) {
                    house.crossObject = new AddrObject(house.attrs.clone());
                    house.attrs.number = num.substring(0, 0 + num.indexOf('/'));
                    house.crossObject.attrs.number = num.substring(num.indexOf('/') + 1);
                }
            }
            house.sortGars();
            addr.items.push(house);
            if (addHouse !== null) {
                if (addr.additionalItems === null) 
                    addr.additionalItems = new Array();
                addr.additionalItems.push(addHouse);
            }
            if (house.attrs.typ === HouseType.SPECIAL && ar.well !== null) 
                addr.items.push(AddrObject._new118(HouseAttributes._new143(HouseType.WELL, (ar.well === "0" ? "б/н" : ar.well)), AddrLevel.BUILDING));
        }
        if (tr === null) {
            let ra = HouseRoomHelper.createApartmentAttrs(ar, flatNum);
            if (ra !== null) {
                tr = new AddrObject(ra);
                tr.level = AddrLevel.APARTMENT;
            }
        }
        if (tr !== null) {
            tr.sortGars();
            addr.items.push(tr);
            if (ar.carplace !== null && tr.attrs.typ !== RoomType.CARPLACE) 
                addr.items.push(AddrObject._new118(RoomAttributes._new153(RoomType.CARPLACE, ar.carplace), AddrLevel.ROOM));
        }
        if (ar.room !== null) {
            let ra = new RoomAttributes();
            let room = new AddrObject(ra);
            room.level = AddrLevel.ROOM;
            ra.typ = RoomType.ROOM;
            ra.number = ar.room;
            addr.items.push(room);
        }
    }
    
    static createApartmentAttrs(ar, flatNum) {
        let ra = new RoomAttributes();
        if (ar.flat !== null) {
            ra.number = ar.flat;
            ra.typ = RoomType.FLAT;
        }
        else if (ar.office !== null) {
            ra.number = ar.office;
            ra.typ = RoomType.OFFICE;
        }
        else if (ar.space !== null) {
            ra.number = ar.space;
            ra.typ = RoomType.SPACE;
        }
        else if (ar.pavilion !== null) {
            ra.number = ar.pavilion;
            ra.typ = RoomType.PAVILION;
        }
        else if (ar.pantry !== null) {
            ra.number = ar.pantry;
            ra.typ = RoomType.PANTY;
        }
        else if (ar.carplace !== null) {
            ra.number = ar.carplace;
            ra.typ = RoomType.CARPLACE;
        }
        else if (flatNum !== null) {
            ra.number = flatNum;
            ra.typ = RoomType.FLAT;
        }
        else 
            return null;
        if (ra.number === "НЕТ") 
            return null;
        if (ra.number === "0") 
            ra.number = "б/н";
        return ra;
    }
    
    static _getId(v) {
        return Utils.parseInt(v.substring(1));
    }
    
    static _findHousesNew(ah, hinst, a, crossNum) {
        if (a.plot === null || a.house === null || a.plot === a.house) 
            return HouseRoomHelper._findHousesNew0(ah, hinst, a, crossNum);
        let pl = new AddressReferent();
        pl.plot = a.plot;
        let res1 = HouseRoomHelper._findHousesNew0(ah, hinst, pl, crossNum);
        a.plot = null;
        let res2 = HouseRoomHelper._findHousesNew0(ah, hinst, a, crossNum);
        a.plot = pl.plot;
        if (res1 === null) 
            return res2;
        if (res2 === null) 
            return res1;
        res1.splice(res1.length, 0, ...res2);
        return res1;
    }
    
    static _findHousesNew0(ah, hinst, a, crossNum) {
        const NumberAnalyzer = require("./NumberAnalyzer");
        if (hinst === null) 
            return null;
        if (crossNum > 0 && ((a.house !== null || a.houseOrPlot !== null))) {
            let nnn = Utils.notNull(a.house, a.houseOrPlot);
            let ii = nnn.indexOf('/');
            if (ii > 0) {
                let ar1 = new AddressReferent();
                ar1.house = (crossNum === 1 ? nnn.substring(0, 0 + ii) : nnn.substring(ii + 1));
                let res1 = HouseRoomHelper._findHousesNew0(ah, hinst, ar1, 0);
                if (res1 !== null) {
                    if (crossNum === 1) {
                        let res0 = HouseRoomHelper._findHousesNew0(ah, hinst, a, 0);
                        if (res0 !== null && res0[0].internalTag >= res1[0].internalTag) 
                            return res0;
                    }
                    return res1;
                }
            }
        }
        if (a.corpusOrFlat !== null) {
            let aa1 = Utils.as(a.clone(), AddressReferent);
            aa1.corpusOrFlat = null;
            aa1.corpus = a.corpusOrFlat;
            let res1 = HouseRoomHelper._findHousesNew0(ah, hinst, aa1, crossNum);
            aa1.corpus = null;
            let res2 = HouseRoomHelper._findHousesNew0(ah, hinst, aa1, crossNum);
            if (res1 !== null) {
                if (res2 === null || (res2[0].internalTag < res1[0].internalTag)) {
                    a.corpus = a.corpusOrFlat;
                    a.corpusOrFlat = null;
                    return res1;
                }
            }
            if (res2 !== null) {
                a.flat = a.corpusOrFlat;
                a.corpusOrFlat = null;
                return res2;
            }
        }
        if (a.house !== null && a.house.indexOf('-') > 0) {
            let ii = a.house.indexOf('-');
            let a1 = new AddressReferent();
            a1.house = a.house.substring(0, 0 + ii);
            let a2 = new AddressReferent();
            a2.house = a.house.substring(ii + 1);
            if (Utils.compareStrings(a1.house, a2.house, false) < 0) {
                let res1 = HouseRoomHelper._findHousesNew0(ah, hinst, a1, 0);
                let res2 = HouseRoomHelper._findHousesNew0(ah, hinst, a2, 0);
                if (res1 !== null && res2 !== null) {
                    res1[0].tag = res2;
                    return res1;
                }
            }
            if (a.flat === null) {
                let res1 = HouseRoomHelper._findHousesNew0(ah, hinst, a1, 0);
                if (res1 !== null) {
                    a.flat = a.house.substring(ii + 1);
                    return res1;
                }
            }
        }
        let num = NumberAnalyzer.tryParseReferent(a, true);
        if (num === null) 
            return null;
        let hos = hinst.getHouses(num);
        if (hos === null || hos.length === 0) 
            return null;
        let res = null;
        let max = 0;
        for (const ho of hos) {
            let num1 = NumberAnalyzer.tryParseHO(ho);
            if (num1 === null) 
                continue;
            let co = num.calcCoef(num1);
            if (co <= 0) 
                continue;
            if (co < max) 
                continue;
            let go = GarHelper.createGarHouse(ho);
            if (go === null) 
                continue;
            go.internalTag = 0;
            if (go.expired) 
                co /= (3);
            if (co < max) 
                continue;
            if (co === max) 
                res.push(go);
            else {
                if (res === null) 
                    res = new Array();
                else 
                    res.splice(0, res.length);
                res.push(go);
                max = co;
                go.internalTag = max;
            }
        }
        return res;
    }
    
    static _findRoomNew(ah, rih, a) {
        const NumberAnalyzer = require("./NumberAnalyzer");
        if (rih === null) 
            return null;
        let num = NumberAnalyzer.tryParseReferent(a, false);
        if (num === null) 
            return null;
        let hos = rih.getRooms(num);
        if (hos === null || hos.length === 0) 
            return null;
        let res = null;
        let max = 0;
        let hasFlatsAndSpaces = rih.checkHasFlatsAndSpaces();
        for (const ho of hos) {
            let num1 = NumberAnalyzer.tryParseRO(ho);
            if (num1 === null) 
                continue;
            let co = num.calcCoef(num1);
            if (co <= 0) 
                continue;
            if (co < max) 
                continue;
            if (hasFlatsAndSpaces) {
                if (num.items[0].cla === NumberItemClass.SPACE && num1.items[0].cla === NumberItemClass.FLAT) 
                    continue;
                if (num.items[0].cla === NumberItemClass.FLAT && num1.items[0].cla === NumberItemClass.SPACE) 
                    continue;
            }
            let go = GarHelper.createGarRoom(ho);
            if (go === null) 
                continue;
            if (co === max) 
                res.push(go);
            else {
                if (res === null) 
                    res = new Array();
                else 
                    res.splice(0, res.length);
                res.push(go);
                max = co;
            }
        }
        if (res === null) 
            return null;
        return res[0];
    }
    
    static tryParseListItems(ah, addr, ar) {
        let t = null;
        if (ar !== null) {
            for (t = ar.firstToken; t !== null; t = t.next) {
                if (t.endChar === addr.endChar) {
                    t = t.next;
                    break;
                }
            }
        }
        if (t === null) 
            return false;
        if (!t.isCommaAnd && !t.isHiphen && !t.isValue("ПО", null)) 
            return false;
        let it0 = addr.lastItem;
        let room = Utils.as(it0.attrs, RoomAttributes);
        let house = Utils.as(it0.attrs, HouseAttributes);
        if (house === null && room === null) 
            return false;
        let n0 = 0;
        let liter = null;
        if (house !== null) {
            if (house.number !== null) {
                if (house.buildNumber !== null || house.stroenNumber !== null) 
                    return false;
                let wrapn0155 = new RefOutArgWrapper();
                Utils.tryParseInt(house.number, wrapn0155);
                n0 = wrapn0155.value;
            }
            else if (house.buildNumber !== null) {
                if (house.stroenNumber !== null) 
                    return false;
                let wrapn0156 = new RefOutArgWrapper();
                Utils.tryParseInt(house.buildNumber, wrapn0156);
                n0 = wrapn0156.value;
            }
            else if (house.stroenNumber !== null) {
                let wrapn0157 = new RefOutArgWrapper();
                let inoutres158 = Utils.tryParseInt(house.stroenNumber, wrapn0157);
                n0 = wrapn0157.value;
                if (!inoutres158) 
                    liter = house.stroenNumber;
            }
            else 
                return false;
        }
        else if (room.number === null) 
            return false;
        else {
            let wrapn0159 = new RefOutArgWrapper();
            Utils.tryParseInt(room.number, wrapn0159);
            n0 = wrapn0159.value;
        }
        let b0 = t.beginChar;
        let ar0 = null;
        try {
            ar0 = ProcessorService.getEmptyProcessor().process(SourceOfAnalysis._new160(addr.text.substring(b0), "ADDRESS"), null, null);
        } catch (ex) {
            return false;
        }
        let nums = new Array();
        if (liter !== null && ah.literaVariant !== null && liter !== ah.literaVariant.value) 
            nums.push(ah.literaVariant.value);
        for (t = ar0.firstToken; t !== null; t = t.next) {
            if (!t.isCommaAnd && !t.isHiphen && !t.isValue("ПО", null)) 
                break;
            let hiph = t.isHiphen || t.isValue("ПО", null);
            t = t.next;
            if (t === null) 
                break;
            if (!hiph && t.next !== null && ((t.isValue("С", null) || t.isValue("C", null)))) 
                t = t.next;
            if ((liter !== null && (t instanceof TextToken) && t.lengthChar === 1) && t.chars.isLetter) {
                nums.push(t.term);
                addr.endChar = t.endChar + b0;
                continue;
            }
            let ait = AddressItemToken.tryParsePureItem(t, null, null);
            if (ait === null || ait.value === null) 
                break;
            let ok = ait.typ === AddressItemType.NUMBER;
            if (ait.typ === AddressItemType.HOUSE && house !== null && house.typ !== HouseType.PLOT) 
                ok = true;
            else if (ait.typ === AddressItemType.FLAT && room !== null) 
                ok = true;
            else if (ait.typ === AddressItemType.PLOT && house !== null && house.typ === HouseType.PLOT) 
                ok = true;
            else if ((liter !== null && ait.typ === AddressItemType.BUILDING && !Utils.isNullOrEmpty(ait.value)) && !Utils.isDigit(ait.value[0])) 
                ok = true;
            if (!ok) 
                break;
            let n1 = 0;
            let wrapn1161 = new RefOutArgWrapper();
            Utils.tryParseInt(ait.value, wrapn1161);
            n1 = wrapn1161.value;
            if (hiph && n0 > 0 && n1 > n0) {
                if ((n1 - n0) > 100) 
                    break;
                for (let k = n0 + 1; k < n1; k++) {
                    nums.push(k.toString());
                }
            }
            n0 = n1;
            nums.push(ait.value);
            t = ait.endToken;
            addr.endChar = t.endChar + b0;
        }
        if (nums.length < 1) 
            return false;
        if (nums.length > 40) 
            return false;
        addr.additionalItems = new Array();
        let par = null;
        let rinh = null;
        let hinstr = null;
        if (it0.gars.length === 1 && it0.gars[0].parentIds.length > 0) {
            par = ah.getGarObject(it0.gars[0].parentIds[0]);
            if (par !== null && par.level === GarLevel.BUILDING) 
                rinh = ah.getRoomsInObject(par.id);
            else if (par !== null && (par.level.value()) >= (GarLevel.LOCALITY.value())) 
                hinstr = ah.getHousesInStreet(par.id);
        }
        for (const n of nums) {
            let it = it0.clone();
            it.gars.splice(0, it.gars.length);
            if (room !== null) 
                it.attrs.number = n;
            else if (house.number !== null) 
                it.attrs.number = n;
            else if (house.buildNumber !== null) 
                it.attrs.buildNumber = n;
            else 
                it.attrs.stroenNumber = n;
            addr.additionalItems.push(it);
            if (room !== null) {
                let a = new AddressReferent();
                if (room.typ === RoomType.FLAT) 
                    a.flat = n;
                else if (room.typ === RoomType.SPACE) 
                    a.space = n;
                else if (room.typ === RoomType.OFFICE) 
                    a.office = n;
                else if (room.typ === RoomType.PAVILION) 
                    a.pavilion = n;
                else if (room.typ === RoomType.PANTY) 
                    a.pantry = n;
                else 
                    continue;
                let gg = HouseRoomHelper._findRoomNew(ah, rinh, a);
                if (gg !== null) 
                    it.gars.push(gg);
            }
            else {
                let a = new AddressReferent();
                if (house.typ === HouseType.PLOT) 
                    a.plot = n;
                else if (house.number !== null) 
                    a.house = n;
                else if (house.buildNumber !== null) 
                    a.corpus = n;
                else 
                    a.building = n;
                let gg = HouseRoomHelper._findHousesNew(ah, hinstr, a, 0);
                if (gg !== null) 
                    it.gars.splice(it.gars.length, 0, ...gg);
            }
        }
        return true;
    }
    
    static createDirDetails(ar, par) {
        par.value = ar.getStringValue(AddressReferent.ATTR_DETAILPARAM);
        return HouseRoomHelper._createDirDetails(ar.detail);
    }
    
    static _createDirDetails(dt) {
        let ty = DetailType.UNDEFINED;
        if (dt === AddressDetailType.NEAR) 
            ty = DetailType.NEAR;
        else if (dt === AddressDetailType.EAST) 
            ty = DetailType.EAST;
        else if (dt === AddressDetailType.NORTH) 
            ty = DetailType.NORTH;
        else if (dt === AddressDetailType.NORTHEAST) 
            ty = DetailType.NORTHEAST;
        else if (dt === AddressDetailType.NORTHWEST) 
            ty = DetailType.NORTHWEST;
        else if (dt === AddressDetailType.SOUTH) 
            ty = DetailType.SOUTH;
        else if (dt === AddressDetailType.SOUTHEAST) 
            ty = DetailType.SOUTHEAST;
        else if (dt === AddressDetailType.SOUTHWEST) 
            ty = DetailType.SOUTHWEST;
        else if (dt === AddressDetailType.WEST) 
            ty = DetailType.WEST;
        else if (dt === AddressDetailType.RANGE) 
            ty = DetailType.KMRANGE;
        else if (dt === AddressDetailType.CENTRAL) 
            ty = DetailType.CENTRAL;
        else if (dt === AddressDetailType.LEFT) 
            ty = DetailType.LEFT;
        else if (dt === AddressDetailType.RIGHT) 
            ty = DetailType.RIGHT;
        return ty;
    }
    
    static processOtherDetails(addr, ar) {
        if (ar.floor !== null) {
            if (!addr.params.containsKey(ParamType.FLOOR)) 
                addr.params.put(ParamType.FLOOR, ar.floor);
        }
        if (ar.part !== null) {
            if (!addr.params.containsKey(ParamType.PART)) 
                addr.params.put(ParamType.PART, ar.part);
        }
        if (ar.genplan !== null) {
            if (!addr.params.containsKey(ParamType.GENPLAN)) 
                addr.params.put(ParamType.GENPLAN, (ar.genplan === "0" ? null : ar.genplan));
        }
        if (ar.deliveryArea !== null) {
            if (!addr.params.containsKey(ParamType.DELIVERYAREA)) 
                addr.params.put(ParamType.DELIVERYAREA, (ar.deliveryArea === "0" ? null : ar.deliveryArea));
        }
        if (ar.zip !== null) {
            if (!addr.params.containsKey(ParamType.ZIP)) 
                addr.params.put(ParamType.ZIP, ar.zip);
        }
        if (ar.postOfficeBox !== null) {
            if (!addr.params.containsKey(ParamType.SUBSCRIBERBOX)) 
                addr.params.put(ParamType.SUBSCRIBERBOX, ar.postOfficeBox);
        }
    }
    
    static tryProcessDetails(addr, details) {
        if (Utils.isNullOrEmpty(details) || addr.lastItem === null || addr.lastItem.detailTyp !== DetailType.UNDEFINED) 
            return;
        try {
            let ar0 = ProcessorService.getEmptyProcessor().process(SourceOfAnalysis._new160(details, "ADDRESS"), null, null);
            for (let t = ar0.firstToken; t !== null; t = t.next) {
                let ait = AddressItemToken.tryParsePureItem(t, null, null);
                if (ait === null || ait.typ !== AddressItemType.DETAIL) 
                    continue;
                addr.lastItem.detailTyp = HouseRoomHelper._createDirDetails(ait.detailType);
                if (ait.detailMeters > 0) 
                    addr.lastItem.detailParam = (String(ait.detailMeters) + "м");
                break;
            }
        } catch (ex163) {
        }
    }
}


module.exports = HouseRoomHelper