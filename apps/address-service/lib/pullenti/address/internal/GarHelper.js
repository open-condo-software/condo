/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const StroenType = require("./../StroenType");
const HouseType = require("./../HouseType");
const HouseAttributes = require("./../HouseAttributes");
const AreaAttributes = require("./../AreaAttributes");
const RoomAttributes = require("./../RoomAttributes");
const GarLevel = require("./../GarLevel");
const AddrLevel = require("./../AddrLevel");
const BaseAttributes = require("./../BaseAttributes");
const GarStatus = require("./../GarStatus");
const AreaObject = require("./gar/AreaObject");

class GarHelper {
    
    static init(indexPath) {
        const FiasDatabase = require("./gar/FiasDatabase");
        GarHelper.REGIONS = new Array();
        if (GarHelper.GAR_INDEX !== null) {
            GarHelper.GAR_INDEX.close();
            GarHelper.GAR_INDEX = null;
        }
        if (indexPath !== null) {
            if (!fs.existsSync(indexPath) && fs.statSync(indexPath).isDirectory()) 
                throw new Error(("Directory '" + indexPath + "' not exists"));
            GarHelper.GAR_INDEX = new FiasDatabase();
            GarHelper.GAR_INDEX.initialize(indexPath);
        }
        if (GarHelper.GAR_INDEX === null) 
            return;
        let robj = GarHelper.GAR_INDEX.getAO(1);
        if (robj === null) 
            return;
        let ga = new Array();
        for (const id of robj.childrenIds) {
            let ao = GarHelper.GAR_INDEX.getAO(id);
            if (ao === null) 
                continue;
            if (ao.level !== (1)) 
                continue;
            let g = GarHelper.createGarArea(ao);
            if ((g.attrs instanceof AreaAttributes) && g.level === GarLevel.REGION) 
                ga.push(g);
        }
        ga.sort((a, b) => a.compareTo(b));
        for (const g of ga) {
            GarHelper.REGIONS.push(g);
        }
    }
    
    static getObject(sid) {
        const GarObject = require("./../GarObject");
        if (sid === null || GarHelper.GAR_INDEX === null) 
            return null;
        let iid = 0;
        let wrapiid126 = new RefOutArgWrapper();
        let inoutres127 = Utils.tryParseInt(sid.substring(1), wrapiid126);
        iid = wrapiid126.value;
        if (!inoutres127) 
            return null;
        if (sid[0] === 'a') {
            if (iid < 1) 
                return null;
            let nam = GarHelper.GAR_INDEX.getAOName(iid);
            let prox = GarHelper.GAR_INDEX.getAOProxy(iid);
            if (nam === null || prox === null) {
                let ao = GarHelper.GAR_INDEX.getAO(iid);
                if (ao === null) 
                    return null;
                return GarHelper.createGarArea(ao);
            }
            let aa = new AreaAttributes();
            let res = new GarObject(aa);
            if (nam.indexOf('+') < 0) 
                aa.names.push(nam);
            else 
                aa.names.splice(aa.names.length, 0, ...Utils.splitString(nam, '+', false));
            res.regionNumber = prox.region;
            let ty = GarHelper.GAR_INDEX.getAddrType(prox.typId);
            if (ty !== null) 
                aa.types.push(ty.name);
            if (prox.altTypId > (0)) {
                ty = GarHelper.GAR_INDEX.getAddrType(prox.altTypId);
                if (ty !== null) 
                    aa.types.push(ty.name);
            }
            res.status = prox.status;
            for (const pid of prox.parentIds) {
                res.parentIds.push(("a" + pid));
            }
            res.expired = prox.expired;
            res.level = prox.gLevel;
            res.guid = GarHelper.GAR_INDEX.getAOGuid(iid);
            res.id = sid;
            res.childrenCount = prox.chCount;
            return res;
        }
        if (sid[0] === 'h') {
            let ho = GarHelper.GAR_INDEX.getHouse(iid);
            if (ho === null) 
                return null;
            return GarHelper.createGarHouse(ho);
        }
        if (sid[0] === 'r') {
            let ho = GarHelper.GAR_INDEX.getRoom(iid);
            if (ho === null) 
                return null;
            return GarHelper.createGarRoom(ho);
        }
        return null;
    }
    
    static getObjectParams(sid) {
        if (GarHelper.GAR_INDEX === null) 
            return null;
        let iid = 0;
        let wrapiid128 = new RefOutArgWrapper();
        let inoutres129 = Utils.tryParseInt(sid.substring(1), wrapiid128);
        iid = wrapiid128.value;
        if (!inoutres129) 
            return null;
        if (sid[0] === 'a') 
            return GarHelper.GAR_INDEX.getAOParams(iid);
        if (sid[0] === 'h') 
            return GarHelper.GAR_INDEX.getHouseParams(iid);
        if (sid[0] === 'r') 
            return GarHelper.GAR_INDEX.getRoomParams(iid);
        return null;
    }
    
    static getChildrenObjects(id, ignoreHouses = false) {
        if (Utils.isNullOrEmpty(id)) 
            return GarHelper.REGIONS;
        let res = GarHelper.getChildrenObjectsById(id, ignoreHouses);
        if (res !== null) {
            for (const r of res) {
                if (id !== null && !r.parentIds.includes(id)) 
                    r.parentIds.push(id);
            }
        }
        return res;
    }
    
    static getChildrenObjectsById(sid, ignoreHouses = false) {
        if (GarHelper.GAR_INDEX === null || Utils.isNullOrEmpty(sid)) 
            return null;
        let res = new Array();
        let iid = 0;
        let wrapiid130 = new RefOutArgWrapper();
        let inoutres131 = Utils.tryParseInt(sid.substring(1), wrapiid130);
        iid = wrapiid130.value;
        if (!inoutres131) 
            return null;
        if (sid[0] === 'a') {
            let ao = GarHelper.GAR_INDEX.getAO(iid);
            if (ao === null) 
                return null;
            if (ao.childrenIds !== null) {
                let areas = new Array();
                let houses = new Array();
                let rooms = new Array();
                for (const id of ao.childrenIds) {
                    let mm = (id) & (AreaObject.ROOMMASK);
                    if (Utils.compareUnsigned(mm, AreaObject.ROOMMASK) == 0) {
                        if (ignoreHouses) 
                            continue;
                        let ro = GarHelper.GAR_INDEX.getRoom(((id) ^ (AreaObject.ROOMMASK)));
                        if (ro !== null) 
                            rooms.push(ro);
                    }
                    else if (Utils.compareUnsigned(mm, AreaObject.HOUSEMASK) == 0) {
                        if (ignoreHouses) 
                            continue;
                        let ho = GarHelper.GAR_INDEX.getHouse(((id) ^ (AreaObject.HOUSEMASK)));
                        if (ho !== null) 
                            houses.push(ho);
                    }
                    else {
                        let ch = GarHelper.createGarAById(id);
                        if (ch !== null) 
                            areas.push(ch);
                    }
                }
                areas.sort((a, b) => a.compareTo(b));
                houses.sort((a, b) => a.compareTo(b));
                for (const a of areas) {
                    res.push(a);
                }
                for (const h of houses) {
                    let gh = GarHelper.createGarHouse(h);
                    if (gh !== null) 
                        res.push(gh);
                }
                for (const r of rooms) {
                    let rh = GarHelper.createGarRoom(r);
                    if (rh !== null) 
                        res.push(rh);
                }
            }
            return res;
        }
        if (sid[0] === 'h') {
            let ho = GarHelper.GAR_INDEX.getHouse(iid);
            if (ho === null || ho.roomIds === null) 
                return null;
            let rooms = new Array();
            for (const id of ho.roomIds) {
                let ro = GarHelper.GAR_INDEX.getRoom(id);
                if (ro !== null) 
                    rooms.push(ro);
            }
            rooms.sort((a, b) => a.compareTo(b));
            for (const r of rooms) {
                let gr = GarHelper.createGarRoom(r);
                if (gr !== null) 
                    res.push(gr);
            }
        }
        if (sid[0] === 'r') {
            let ho = GarHelper.GAR_INDEX.getRoom(iid);
            if (ho === null || ho.childrenIds === null) 
                return null;
            let rooms = new Array();
            for (const id of ho.childrenIds) {
                let ro = GarHelper.GAR_INDEX.getRoom(id);
                if (ro !== null) 
                    rooms.push(ro);
            }
            rooms.sort((a, b) => a.compareTo(b));
            for (const r of rooms) {
                let gr = GarHelper.createGarRoom(r);
                if (gr !== null) 
                    res.push(gr);
            }
        }
        return res;
    }
    
    static createGarAById(id) {
        let aa = GarHelper.GAR_INDEX.getAO(id);
        if (aa === null) 
            return null;
        return GarHelper.createGarArea(aa);
    }
    
    static createGarArea(a) {
        const GarObject = require("./../GarObject");
        let aa = new AreaAttributes();
        let ga = new GarObject(aa);
        ga.id = ("a" + a.id);
        ga.status = a.status;
        aa.names.splice(aa.names.length, 0, ...a.names);
        if (a.typ !== null) 
            aa.types.push(a.typ.name);
        if (a.oldTyp !== null) 
            aa.types.push(a.oldTyp.name);
        ga.level = GarLevel.of(a.level);
        ga.expired = !a.actual;
        ga.guid = a.guid;
        ga.regionNumber = a.region;
        if (a.childrenIds !== null) 
            ga.childrenCount = a.childrenIds.length;
        for (const ii of a.parentIds) {
            ga.parentIds.push(("a" + ii));
        }
        return ga;
    }
    
    static createGarHouse(a) {
        const GarObject = require("./../GarObject");
        if (a === null) 
            return null;
        let sid = "h" + a.id.toString();
        let ha = new HouseAttributes();
        let ga = new GarObject(ha);
        ga.id = sid;
        ha.number = a.houseNumber;
        if (a.houseTyp === (1)) 
            ha.typ = HouseType.ESTATE;
        else if (a.houseTyp === (2)) 
            ha.typ = HouseType.HOUSE;
        else if (a.houseTyp === (3)) 
            ha.typ = HouseType.HOUSEESTATE;
        else if (a.houseTyp === (4)) 
            ha.typ = HouseType.GARAGE;
        else if (a.houseTyp === (5)) 
            ha.typ = HouseType.PLOT;
        ha.buildNumber = a.buildNumber;
        ha.stroenNumber = a.strucNumber;
        ha.stroenTyp = StroenType.of(a.strucTyp);
        ga.level = (ha.typ === HouseType.PLOT ? GarLevel.PLOT : GarLevel.BUILDING);
        ga.expired = !a.actual;
        ga.guid = a.guid;
        ga.status = a.status;
        if (a.parentId > 0) 
            ga.parentIds.push("a" + a.parentId.toString());
        if (a.altParentId > 0) 
            ga.parentIds.push("a" + a.altParentId.toString());
        ga.childrenCount = (a.roomIds === null ? 0 : a.roomIds.length);
        return ga;
    }
    
    static createGarRoom(a) {
        const GarObject = require("./../GarObject");
        let sid = "r" + a.id.toString();
        let ra = new RoomAttributes();
        let ga = new GarObject(ra);
        ga.id = sid;
        ra.number = a.number;
        ra.typ = a.typ;
        ga.level = GarLevel.ROOM;
        ga.expired = !a.actual;
        ga.guid = a.guid;
        if (a.childrenIds !== null) 
            ga.childrenCount = a.childrenIds.length;
        if (Utils.compareUnsigned(a.houseId, 0) != 0 && (((a.houseId) & 0x80000000)) === 0) 
            ga.parentIds.push("h" + a.houseId.toString());
        else if (Utils.compareUnsigned(a.houseId, 0) != 0 && (((a.houseId) & 0x80000000)) !== 0) {
            let id = (a.houseId) & 0x7FFFFFFF;
            ga.parentIds.push("h" + id.toString());
        }
        return ga;
    }
    
    static createAddrObject(g) {
        const AddrObject = require("./../AddrObject");
        let res = new AddrObject(g.attrs);
        res.isReconstructed = true;
        res.gars.push(g);
        if (g.level === GarLevel.REGION) {
            res.level = AddrLevel.REGIONAREA;
            if ((g.attrs instanceof AreaAttributes) && g.attrs.types.includes("город")) 
                res.level = AddrLevel.REGIONCITY;
        }
        else if (g.level === GarLevel.ADMINAREA || g.level === GarLevel.MUNICIPALAREA) 
            res.level = AddrLevel.DISTRICT;
        else if (g.level === GarLevel.SETTLEMENT) 
            res.level = AddrLevel.SETTLEMENT;
        else if (g.level === GarLevel.CITY) 
            res.level = AddrLevel.CITY;
        else if (g.level === GarLevel.LOCALITY) 
            res.level = AddrLevel.LOCALITY;
        else if (g.level === GarLevel.AREA) 
            res.level = AddrLevel.TERRITORY;
        else if (g.level === GarLevel.STREET) 
            res.level = AddrLevel.STREET;
        else if (g.level === GarLevel.PLOT) {
            res.level = AddrLevel.PLOT;
            res.attrs.typ = HouseType.PLOT;
        }
        else if (g.level === GarLevel.BUILDING) 
            res.level = AddrLevel.BUILDING;
        else if (g.level === GarLevel.ROOM) 
            res.level = AddrLevel.APARTMENT;
        else 
            return null;
        return res;
    }
    
    static static_constructor() {
        GarHelper.REGIONS = new Array();
        GarHelper.m_Lock = new Object();
        GarHelper.GAR_INDEX = null;
    }
}


GarHelper.static_constructor();

module.exports = GarHelper