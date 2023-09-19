/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const path = require('path');
const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const FileInfo = require("./../../../unisharp/FileInfo");

const GarStatus = require("./../../GarStatus");
const HouseObject = require("./HouseObject");
const GarParam = require("./../../GarParam");
const FiasHelper = require("./../FiasHelper");
const AddrLevel = require("./../../AddrLevel");
const AreaObject = require("./AreaObject");
const AddressHelper = require("./../../AddressHelper");
const RoomsInHouse = require("./RoomsInHouse");
const HousesInStreet = require("./HousesInStreet");
const KeyBaseTable = require("./../../../util/repository/KeyBaseTable");
const IRepository = require("./../../../util/repository/IRepository");
const AreaType = require("./AreaType");
const FiasHouseTable = require("./FiasHouseTable");
const FiasAddrTable = require("./FiasAddrTable");
const PTreeRoot = require("./PTreeRoot");
const ParamsTable = require("./ParamsTable");
const AreaTree = require("./AreaTree");
const FiasRoomTable = require("./FiasRoomTable");

// База данных ФИАС (ГАР)
class FiasDatabase extends IRepository {
    
    constructor() {
        super();
        this._basedir = null;
        this.id = null;
        this.createDate = null;
        this.readOnly = true;
        this.m_AoByRegs = new Hashtable();
        this.m_Types = new Hashtable();
        this.m_AddrTable = null;
        this.m_HouseTable = null;
        this.m_RoomTable = null;
        this.m_HousesInAo = null;
        this.m_RoomsInHouse = null;
        this.m_RoomsInRooms = null;
        this.m_AreaTree = null;
        this.m_AddrParams = null;
        this.m_HouseParams = null;
        this.m_RoomParams = null;
        this.m_AreaGuids = null;
        this.m_AreaNamePos = null;
        this.m_AreaNameData = null;
        this.m_ParamsMaps = new Hashtable();
        this._outlog = false;
    }
    
    get baseDir() {
        return this._basedir;
    }
    set baseDir(value) {
        this._basedir = value;
        return this._basedir;
    }
    
    initialize(dirName) {
        this.baseDir = dirName;
        if (!fs.existsSync(dirName) && fs.statSync(dirName).isDirectory()) 
            fs.mkdirSync(dirName);
        this.m_AddrTable = new FiasAddrTable(this);
        if (this.readOnly) {
            let fi = new FileInfo(path.join(this.baseDir, "areaobjects.ind"));
            this.m_AddrTable.open(this.readOnly, (fi.exists() ? fi.length : -1));
        }
        else 
            this.m_AddrTable.open(false, 0);
        this.m_HouseTable = new FiasHouseTable(this);
        if (!this.m_HouseTable.open(this.readOnly, 0)) 
            this.m_HouseTable = null;
        this.m_RoomTable = new FiasRoomTable(this);
        if (!this.m_RoomTable.open(this.readOnly, 0)) 
            this.m_RoomTable = null;
        this.m_HousesInAo = KeyBaseTable._new29(this, "houseinareas", true);
        if (!this.m_HousesInAo.open(this.readOnly, 0)) 
            this.m_HousesInAo = null;
        this.m_RoomsInHouse = KeyBaseTable._new29(this, "roominhouses", true);
        if (!this.m_RoomsInHouse.open(this.readOnly, 0)) 
            this.m_RoomsInHouse = null;
        this.m_RoomsInRooms = KeyBaseTable._new29(this, "roominrooms", true);
        if (!this.m_RoomsInRooms.open(this.readOnly, 0)) 
            this.m_RoomsInRooms = null;
        this.m_AddrParams = new ParamsTable(this, "areaparams");
        if (!this.m_AddrParams.open(this.readOnly, 0)) 
            this.m_AddrParams = null;
        this.m_HouseParams = new ParamsTable(this, "houseparams");
        if (!this.m_HouseParams.open(this.readOnly, 0)) 
            this.m_HouseParams = null;
        this.m_RoomParams = new ParamsTable(this, "roomparams");
        if (!this.m_RoomParams.open(this.readOnly, 0)) 
            this.m_RoomParams = null;
        let fname = path.join(this.baseDir, "types.xml");
        if (!fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            fname = path.join(this.baseDir, "types.dat");
        if (fs.existsSync(fname) && fs.statSync(fname).isFile()) {
            let _id = null;
            let dt = null;
            let wrapid32 = new RefOutArgWrapper(_id);
            let wrapdt33 = new RefOutArgWrapper(dt);
            let typs = AreaType.load(fname, wrapid32, wrapdt33);
            _id = wrapid32.value;
            dt = wrapdt33.value;
            if (typs !== null) 
                this.m_Types = typs;
            this.id = _id;
            this.createDate = dt;
        }
        else {
            this.id = Utils.createUUID().toString();
            this.createDate = (String(Utils.now().getFullYear()) + "." + Utils.correctToString((Utils.getMonth(Utils.now())).toString(10), 2, true) + "." + Utils.correctToString((Utils.now().getDate()).toString(10), 2, true));
        }
        this.m_AreaTree = new AreaTree();
        fname = path.join(this.baseDir, "areatree.dat");
        if (fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            this.m_AreaTree.load(fname);
        fname = path.join(this.baseDir, "areaguids.dat");
        if (fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            this.m_AreaGuids = Utils.readAllBytes(fname);
        fname = path.join(this.baseDir, "areanames.ind");
        if (fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            this.m_AreaNamePos = Utils.readAllBytes(fname);
        fname = path.join(this.baseDir, "areanames.dat");
        if (fs.existsSync(fname) && fs.statSync(fname).isFile()) 
            this.m_AreaNameData = Utils.readAllBytes(fname);
        for (const ty of FiasDatabase.m_ParamTypes) {
            fname = path.join(this.baseDir, ("paramap" + (ty.value()) + ".dat"));
            let tn = new PTreeRoot();
            if (ty === GarParam.KLADRCODE || ty === GarParam.KADASTERNUMBER || ty === GarParam.REESTERNUMBER) 
                tn.maxLength = 8;
            else if (ty === GarParam.GUID) 
                tn.maxLength = 5;
            try {
                if (fs.existsSync(fname) && fs.statSync(fname).isFile()) 
                    tn.load(fname);
            } catch (ex) {
            }
            this.m_ParamsMaps.put(ty, tn);
        }
        let roots = this.getAO(1);
        if (roots !== null && roots.childrenIds !== null) {
            for (const _id of roots.childrenIds) {
                if ((((_id) & (AreaObject.ROOMMASK))) !== 0) 
                    continue;
                let uid = _id;
                let ao = this.getAO(uid);
                if (ao === null || ao.typ === null) 
                    continue;
                if (ao.level !== (1) || ao.region === (0)) 
                    continue;
                if (!this.m_AoByRegs.containsKey(ao.region)) 
                    this.m_AoByRegs.put(ao.region, ao);
            }
        }
    }
    
    addAddrType(typ) {
        let ty = null;
        for (const kp of this.m_Types.entries) {
            if (kp.value.name === typ) {
                ty = kp.value;
                break;
            }
        }
        if (ty === null) {
            ty = AreaType._new34(this.m_Types.length + 1, typ);
            this.m_Types.put(ty.id, ty);
        }
        return ty;
    }
    
    getAddrTypes() {
        return Array.from(this.m_Types.values);
    }
    
    getAddrType(_id) {
        let res = null;
        let wrapres35 = new RefOutArgWrapper();
        let inoutres36 = this.m_Types.tryGetValue(_id, wrapres35);
        res = wrapres35.value;
        if (!inoutres36) 
            return null;
        else 
            return res;
    }
    
    get areasCount() {
        if (this.m_AddrTable === null) 
            return 0;
        return this.m_AddrTable.getMaxKey();
    }
    
    get housesCount() {
        if (this.m_HouseTable === null) 
            return 0;
        return this.m_HouseTable.getMaxKey();
    }
    
    get roomsCount() {
        if (this.m_RoomTable === null) 
            return 0;
        return this.m_RoomTable.getMaxKey();
    }
    
    _Close() {
        if (this.m_AddrTable !== null) {
            this.m_AddrTable._Close();
            this.m_AddrTable = null;
        }
        if (this.m_AreaTree !== null) {
            this.m_AreaTree.close();
            this.m_AreaTree = null;
        }
        if (this.m_HouseTable !== null) {
            this.m_HouseTable._Close();
            this.m_HouseTable = null;
        }
        if (this.m_RoomTable !== null) {
            this.m_RoomTable._Close();
            this.m_RoomTable = null;
        }
        if (this.m_HousesInAo !== null) {
            this.m_HousesInAo._Close();
            this.m_HousesInAo = null;
        }
        if (this.m_RoomsInHouse !== null) {
            this.m_RoomsInHouse._Close();
            this.m_RoomsInHouse = null;
        }
        if (this.m_RoomsInRooms !== null) {
            this.m_RoomsInRooms._Close();
            this.m_RoomsInRooms = null;
        }
        if (this.m_AddrParams !== null) {
            this.m_AddrParams._Close();
            this.m_AddrParams = null;
        }
        if (this.m_HouseParams !== null) {
            this.m_HouseParams._Close();
            this.m_HouseParams = null;
        }
        if (this.m_RoomParams !== null) {
            this.m_RoomParams._Close();
            this.m_RoomParams = null;
        }
        for (const kp of this.m_ParamsMaps.entries) {
            kp.value.close();
        }
        this.m_ParamsMaps.clear();
        this.m_AreaGuids = null;
        this.m_AreaNamePos = null;
        this.m_AreaNameData = null;
    }
    
    collect() {
        if (this.m_AreaTree !== null) 
            this.m_AreaTree.collect();
        for (const kp of this.m_ParamsMaps.entries) {
            kp.value.collect();
        }
    }
    
    clear() {
        
    }
    
    get outLog() {
        return this._outlog;
    }
    set outLog(value) {
        this._outlog = value;
        return this._outlog;
    }
    
    close() {
        this._Close();
    }
    
    findByParam(ty, value) {
        let p = null;
        let wrapp39 = new RefOutArgWrapper();
        let inoutres40 = this.m_ParamsMaps.tryGetValue(ty, wrapp39);
        p = wrapp39.value;
        if (!inoutres40) 
            return null;
        let tn = p.find(value);
        if (tn === null) 
            return null;
        let res = new Array();
        for (const ui of tn.ids) {
            let pars = null;
            if ((((ui) & 0x80000000)) === 0) 
                pars = this.getAOParams(ui);
            else if ((((ui) & 0x40000000)) === 0) {
                if (ty === GarParam.GUID) {
                    let ho = this.getHouse(((ui) & 0x3FFFFFFF));
                    if (ho !== null && ho.guid === value) 
                        res.push(ui);
                    continue;
                }
                pars = this.getHouseParams(((ui) & 0x3FFFFFFF));
            }
            else {
                if (ty === GarParam.GUID) {
                    let ho = this.getRoom(((ui) & 0x3FFFFFFF));
                    if (ho !== null && ho.guid === value) 
                        res.push(ui);
                    continue;
                }
                pars = this.getRoomParams(((ui) & 0x3FFFFFFF));
            }
            if (pars === null) 
                continue;
            let val = null;
            let wrapval37 = new RefOutArgWrapper();
            let inoutres38 = pars.tryGetValue(ty, wrapval37);
            val = wrapval37.value;
            if (!inoutres38) 
                continue;
            if (val === value) 
                res.push(ui);
        }
        return res;
    }
    
    getParentId(sid) {
        let iid = 0;
        let wrapiid41 = new RefOutArgWrapper();
        let inoutres42 = Utils.tryParseInt(sid.substring(1), wrapiid41);
        iid = wrapiid41.value;
        if (!inoutres42) 
            return 0;
        if (iid < 0) 
            return 0;
        if (sid[0] === 'a') {
            /* this is synchronized block by this.m_AddrTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_AddrTable.getParentId(iid);
            }
        }
        if (sid[0] === 'h') {
            /* this is synchronized block by this.m_HouseTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_HouseTable.getParentId(iid);
            }
        }
        if (sid[0] === 'r') {
            /* this is synchronized block by this.m_RoomTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_RoomTable.getParentId(iid);
            }
        }
        return 0;
    }
    
    getStatus(_id) {
        return this.m_AddrTable.getStatus(_id);
    }
    
    getActual(sid) {
        let iid = 0;
        let wrapiid43 = new RefOutArgWrapper();
        let inoutres44 = Utils.tryParseInt(sid.substring(1), wrapiid43);
        iid = wrapiid43.value;
        if (!inoutres44) 
            return -1;
        if (iid < 0) 
            return -1;
        if (sid[0] === 'a') {
            /* this is synchronized block by this.m_AddrTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_AddrTable.getActual(iid);
            }
        }
        if (sid[0] === 'h') {
            /* this is synchronized block by this.m_HouseTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_HouseTable.getActual(iid);
            }
        }
        if (sid[0] === 'r') {
            /* this is synchronized block by this.m_RoomTable.m_Lock, but this feature isn't supported in JS */ {
                return this.m_RoomTable.getActual(iid);
            }
        }
        return 0;
    }
    
    getAOGuid(_id) {
        let pos = _id * 16;
        if (this.m_AreaGuids === null || (pos < 0) || (pos + 16) > this.m_AreaGuids.length) 
            return null;
        let dat = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            dat[i] = this.m_AreaGuids[pos + i];
        }
        let g = Utils.bytesToUUID(dat);
        return g.toString();
    }
    
    getAOName(_id) {
        let pos = _id * 4;
        if ((pos < 0) || this.m_AreaNamePos === null || (pos + 4) > this.m_AreaNamePos.length) 
            return null;
        let ind = Utils.bytesToObject(this.m_AreaNamePos, pos, 'int', 4);
        if ((ind < 0) || this.m_AreaNameData === null || ind >= this.m_AreaNameData.length) 
            return null;
        return FiasHelper.decodeString1251(this.m_AreaNameData, ind, -1, true);
    }
    
    getAOProxy(_id) {
        if (this.m_AreaTree === null) 
            return null;
        /* this is synchronized block by this.m_AreaTree.m_Lock, but this feature isn't supported in JS */ {
            return this.m_AreaTree.getObj(_id);
        }
    }
    
    getAO(_id) {
        if (this.m_AddrTable === null) 
            return null;
        /* this is synchronized block by this.m_AddrTable.m_Lock, but this feature isn't supported in JS */ {
            let ao = AreaObject._new45(_id);
            if (this.m_AddrTable.get(_id, ao, this.m_Types)) 
                return ao;
            else 
                return null;
        }
    }
    
    getAOChildren(ao) {
        if (ao === null || ao.childrenIds === null || ao.childrenIds.length === 0) 
            return null;
        let res = new Array();
        /* this is synchronized block by this.m_AddrTable.m_Lock, but this feature isn't supported in JS */ {
            for (const uid of ao.childrenIds) {
                let mm = (uid) & (AreaObject.ROOMMASK);
                if (Utils.compareUnsigned(mm, 0) != 0) 
                    continue;
                let ao1 = AreaObject._new45(uid);
                if (this.m_AddrTable.get(ao1.id, ao1, this.m_Types)) 
                    res.push(ao1);
            }
        }
        return res;
    }
    
    getAOByReg(regId) {
        let res = null;
        let wrapres47 = new RefOutArgWrapper();
        let inoutres48 = this.m_AoByRegs.tryGetValue(regId, wrapres47);
        res = wrapres47.value;
        if (inoutres48) 
            return res;
        return null;
    }
    
    getAOParams(_id) {
        if (this.m_AddrParams === null) 
            return null;
        /* this is synchronized block by this.m_AddrParams.m_Lock, but this feature isn't supported in JS */ {
            return this.m_AddrParams.getParams(_id);
        }
    }
    
    putAOParams(_id, pars) {
        if (this.m_AddrParams === null) 
            return;
        this.m_AddrParams.putParams(_id, pars, false);
    }
    
    flushAllParams() {
        this.m_AddrParams.flush();
        this.m_HouseParams.flush();
        this.m_RoomParams.flush();
    }
    
    putAO(ao, onlyAttrs = false) {
        if (this.m_AddrTable === null) 
            return false;
        if (ao.id === 0) 
            ao.id = this.m_AddrTable.getMaxKey() + 1;
        this.m_AddrTable.add(ao.id, ao, onlyAttrs);
        return true;
    }
    
    getAOHouses(_id) {
        if (this.m_HousesInAo === null) 
            return null;
        let dat = null;
        /* this is synchronized block by this.m_HousesInAo.m_Lock, but this feature isn't supported in JS */ {
            dat = this.m_HousesInAo.readKeyData(_id, 0);
        }
        if (dat === null) 
            return null;
        try {
            let res = new HousesInStreet();
            res.load(dat);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    putAOHouses(_id, dat) {
        this.m_HousesInAo.writeKeyData(_id, dat);
    }
    
    getHouse(_id) {
        if (this.m_HouseTable === null) 
            return null;
        /* this is synchronized block by this.m_HouseTable.m_Lock, but this feature isn't supported in JS */ {
            let ao = HouseObject._new49(_id);
            if (this.m_HouseTable.get(_id, ao)) 
                return ao;
            else 
                return null;
        }
    }
    
    putHouse(ao) {
        if (this.m_HouseTable === null) 
            return false;
        if (ao.parentId === 0) 
            return false;
        if (ao.id === 0) 
            ao.id = this.m_HouseTable.getMaxKey() + 1;
        this.m_HouseTable.add(ao.id, ao);
        return true;
    }
    
    getHouseParams(_id) {
        if (this.m_HouseParams === null) 
            return null;
        /* this is synchronized block by this.m_HouseParams.m_Lock, but this feature isn't supported in JS */ {
            return this.m_HouseParams.getParams(_id);
        }
    }
    
    putHouseParams(_id, pars) {
        if (this.m_HouseParams === null) 
            return;
        this.m_HouseParams.putParams(_id, pars, false);
    }
    
    getHouseRooms(_id) {
        if (this.m_RoomsInHouse === null) 
            return null;
        let dat = null;
        /* this is synchronized block by this.m_RoomsInHouse.m_Lock, but this feature isn't supported in JS */ {
            dat = this.m_RoomsInHouse.readKeyData(_id, 0);
        }
        if (dat === null) 
            return null;
        try {
            let res = new RoomsInHouse();
            res.load(dat);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    putHouseRooms(_id, rih) {
        if (rih !== null && rih.count > 0) 
            this.m_RoomsInHouse.writeKeyData(_id, rih.save());
    }
    
    putStringEntries(ao, na) {
        if ((ao.id === 0 || na.status === GarStatus.ERROR || na.strings === null) || na.strings.length === 0) 
            return;
        if (na.status !== GarStatus.OK2 && na.sec !== null) 
            return;
        if (ao.id === 25799) {
        }
        ao.status = na.status;
        let isStreet = na.level === AddrLevel.STREET || na.level === AddrLevel.TERRITORY;
        for (const str of na.strings) {
            if (ao.region > (0)) 
                this.m_AreaTree.add((str + "$" + ao.region + (!FiasDatabase.m_SARegime ? "" : (isStreet ? "S" : "A"))), ao, na);
            if (!FiasDatabase.m_SARegime) 
                this.m_AreaTree.add(str, ao, na);
            else if (isStreet) 
                this.m_AreaTree.add(str + "$S", ao, na);
            else 
                this.m_AreaTree.add(str + "$A", ao, na);
        }
        if (na.stringsEx !== null) {
            for (const str of na.stringsEx) {
                if (!FiasDatabase.m_SARegime) 
                    this.m_AreaTree.add(str, ao, na);
                else if (isStreet) 
                    this.m_AreaTree.add(str + "$S", ao, na);
                else 
                    this.m_AreaTree.add(str + "$A", ao, na);
            }
        }
    }
    
    clearStringEntries() {
        this.m_AreaTree.children = new Hashtable();
    }
    
    getAllStringEntriesByStart(start, adj, number, street, regId) {
        let res = new Array();
        let suff = null;
        if (adj !== null && number !== null) 
            suff = (adj + number);
        else if (adj !== null) 
            suff = (adj);
        else if (number !== null) 
            suff = number;
        let root = null;
        /* this is synchronized block by this.m_AreaTree.m_Lock, but this feature isn't supported in JS */ {
            if (suff !== null) {
                root = this.m_AreaTree.find(suff + start, false, true, false);
                if (root === null) 
                    root = this.m_AreaTree.find(suff + start, true, false, false);
                if (root !== null) 
                    suff = null;
            }
            if (root === null) 
                root = this.m_AreaTree.find(start, false, true, false);
            if (root === null) 
                root = this.m_AreaTree.find(start, true, false, false);
            let ids = new Array();
            if (root !== null) 
                this.m_AreaTree.getAllObjIds(root, suff, street, ids);
            ids.sort((a, b) => a - b);
            for (let i = 0; i < ids.length; i++) {
                if (i > 0 && ids[i] === ids[i - 1]) 
                    continue;
                let o = this.m_AreaTree.getObj(ids[i]);
                if (o === null) 
                    continue;
                if (regId !== 0 && o.region !== (regId)) 
                    continue;
                if (street) {
                    if (AddressHelper.compareLevels(o.level, AddrLevel.TERRITORY) < 0) 
                        continue;
                }
                else if (AddressHelper.compareLevels(o.level, AddrLevel.TERRITORY) > 0) 
                    continue;
                res.push(o);
            }
        }
        return res;
    }
    
    checkName(name, isStreet) {
        if (this.m_AreaTree === null) 
            return false;
        /* this is synchronized block by this.m_AreaTree.m_Lock, but this feature isn't supported in JS */ {
            if (FiasDatabase.m_SARegime) 
                name = (name + "$" + (isStreet ? 'S' : 'A'));
            let li = this.m_AreaTree.find(name, false, false, false);
            if (li !== null && li.objIds !== null && li.objIds.length > 0) 
                return true;
        }
        return false;
    }
    
    getStringEntries(na, regions, parIds, maxCount) {
        if (na === null || this.m_AreaTree === null) 
            return null;
        if (regions === null || regions.length === 0) 
            return this._getStringEntriesR(na, 0, parIds, maxCount);
        if (regions.length === 1) 
            return this._getStringEntriesR(na, regions[0], parIds, maxCount);
        let res = null;
        for (const reg of regions) {
            let re = this._getStringEntriesR(na, reg, parIds, maxCount);
            if (re === null) 
                continue;
            if (res === null) 
                res = re;
            else 
                res.splice(res.length, 0, ...re);
            if (res.length >= maxCount) 
                break;
        }
        return res;
    }
    
    _getStringEntriesR(na, region, parIds, maxCount) {
        if (na.strings === null) 
            return null;
        let isStreet = na.level === AddrLevel.STREET || na.level === AddrLevel.TERRITORY;
        let res = null;
        let res2 = null;
        /* this is synchronized block by this.m_AreaTree.m_Lock, but this feature isn't supported in JS */ {
            for (let k = 0; k < 3; k++) {
                let strs = (k === 2 ? na.doubtStrings : na.strings);
                for (const s of strs) {
                    let li = null;
                    let ss = s;
                    if (!FiasDatabase.m_SARegime) {
                        if (region !== (0)) 
                            ss = (s + "$" + region);
                    }
                    else if (region !== (0)) 
                        ss = (s + "$" + region + (isStreet ? "S" : "A"));
                    else if (isStreet) 
                        ss = s + "$S";
                    else 
                        ss = s + "$A";
                    li = this.m_AreaTree.find(ss, k === 1, false, k === 1);
                    for (let pp = 0; pp < 2; pp++) {
                        if (li !== null && li.objIds !== null) {
                            for (const oid of li.objIds) {
                                if (li.objIds.length > 1000 && region === (0)) 
                                    return null;
                                let o = this.m_AreaTree.getObj(oid);
                                if (o === null) 
                                    continue;
                                if (oid === 825641) {
                                }
                                if (region !== (0) && o.region !== region && o.region !== (0)) 
                                    continue;
                                let ok = false;
                                let ok2 = false;
                                if (parIds === null || parIds.length === 0) 
                                    ok = true;
                                else if (parIds.includes(o.id)) {
                                }
                                else 
                                    for (const _id of parIds) {
                                        if (o.parentIds.includes(_id)) {
                                            ok = true;
                                            break;
                                        }
                                        else if (o.parentParentIds !== null && o.parentParentIds.includes(_id)) 
                                            ok2 = true;
                                    }
                                if (!ok && !ok2) 
                                    continue;
                                if (o.id === 1944641) {
                                }
                                let co = o.checkType(na);
                                if (co >= 0) {
                                    if (!ok) {
                                        if (res2 === null) 
                                            res2 = new Array();
                                        let exi = false;
                                        for (const oo of res2) {
                                            if (oo.id === o.id) {
                                                exi = true;
                                                break;
                                            }
                                        }
                                        if (!exi) 
                                            res2.push(o);
                                    }
                                    else {
                                        if (res === null) 
                                            res = new Array();
                                        res.push(o);
                                        if (res.length >= maxCount) 
                                            return res;
                                    }
                                }
                                else if (na.level === AddrLevel.STREET && o.level === AddrLevel.STREET) {
                                    ok2 = false;
                                    if (na.types.length === 1 && na.types[0] === "улица") {
                                        if (o.typs.includes("блок") || o.typs.includes("ряд") || o.typs.includes("линия")) {
                                        }
                                        else 
                                            ok2 = true;
                                    }
                                    else if (o.typs.length === 1 && o.typs[0] === "улица") {
                                        if (na.types.includes("блок") || na.types.includes("ряд") || na.types.includes("линия")) {
                                        }
                                        else 
                                            ok2 = true;
                                    }
                                    else if (na.types.length === 1 && o.typs.length === 1) {
                                        if (na.types[0] === "проезд" || na.types[0] === "переулок") {
                                            if (o.typs[0] === "проезд" || o.typs[0] === "переулок") 
                                                ok2 = true;
                                        }
                                    }
                                    if (ok2) {
                                        if (res2 === null) 
                                            res2 = new Array();
                                        let exi = false;
                                        for (const oo of res2) {
                                            if (oo.id === o.id) {
                                                exi = true;
                                                break;
                                            }
                                        }
                                        if (!exi) 
                                            res2.push(o);
                                    }
                                }
                            }
                        }
                        if (!FiasDatabase.m_SARegime) 
                            break;
                        if ((k === 0 && pp === 0 && region !== (0)) && !isStreet && na.level === AddrLevel.LOCALITY) {
                            li = this.m_AreaTree.find((s + "$" + region + "S"), k > 0, false, false);
                            if (li === null || li.objIds === null) 
                                break;
                        }
                        else 
                            break;
                    }
                    if (res !== null) 
                        return res;
                    if (res2 !== null && k === 0) 
                        return res2;
                }
            }
        }
        return (res != null ? res : res2);
    }
    
    putRoom(ro) {
        if (Utils.compareUnsigned(ro.houseId, 0) == 0) 
            return false;
        this.m_RoomTable.add(ro.id, ro);
        if ((((ro.houseId) & 0x80000000)) !== 0) 
            return true;
        return true;
    }
    
    getRoom(_id) {
        if (this.m_RoomTable === null) 
            return null;
        /* this is synchronized block by this.m_RoomTable.m_Lock, but this feature isn't supported in JS */ {
            return this.m_RoomTable.get(_id);
        }
    }
    
    existsRoom(_id) {
        if (this.m_RoomTable === null) 
            return false;
        return this.m_RoomTable.readKeyDataLen(_id) > 0;
    }
    
    getRoomParams(_id) {
        if (this.m_RoomParams === null) 
            return null;
        /* this is synchronized block by this.m_RoomParams.m_Lock, but this feature isn't supported in JS */ {
            return this.m_RoomParams.getParams(_id);
        }
    }
    
    putRoomParams(_id, pars) {
        if (this.m_RoomParams === null) 
            return;
        this.m_RoomParams.putParams(_id, pars, false);
    }
    
    getRoomRooms(_id) {
        if (this.m_RoomsInRooms === null) 
            return null;
        let dat = null;
        /* this is synchronized block by this.m_RoomsInRooms.m_Lock, but this feature isn't supported in JS */ {
            dat = this.m_RoomsInRooms.readKeyData(_id, 0);
        }
        if (dat === null) 
            return null;
        try {
            let res = new RoomsInHouse();
            res.load(dat);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    putRoomsRooms(_id, rih) {
        if (rih !== null && rih.count > 0) 
            this.m_RoomsInRooms.writeKeyData(_id, rih.save());
    }
    
    getRoomsInHouse(houseId) {
        if (houseId === 0 || this.m_RoomsInHouse === null) 
            return null;
        let dat = null;
        /* this is synchronized block by this.m_RoomsInHouse.m_Lock, but this feature isn't supported in JS */ {
            dat = this.m_RoomsInHouse.readKeyData(houseId, 0);
        }
        if (dat === null) 
            return null;
        let res = new RoomsInHouse();
        res.load(dat);
        return res;
    }
    
    getRoomsInRooms(roomId) {
        if (roomId === 0 || this.m_RoomsInRooms === null) 
            return null;
        let dat = null;
        /* this is synchronized block by this.m_RoomsInRooms.m_Lock, but this feature isn't supported in JS */ {
            dat = this.m_RoomsInRooms.readKeyData(roomId, 0);
        }
        if (dat === null) 
            return null;
        let res = new RoomsInHouse();
        res.load(dat);
        return res;
    }
    
    static static_constructor() {
        FiasDatabase.m_ParamTypes = [GarParam.KADASTERNUMBER, GarParam.KLADRCODE, GarParam.OKATO, GarParam.OKTMO, GarParam.POSTINDEX, GarParam.REESTERNUMBER, GarParam.GUID];
        FiasDatabase.m_SARegime = false;
    }
}


FiasDatabase.static_constructor();

module.exports = FiasDatabase