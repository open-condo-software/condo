/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const GarStatus = require("./../../GarStatus");
const FiasHelper = require("./../FiasHelper");
const AddrLevel = require("./../../AddrLevel");
const GarLevel = require("./../../GarLevel");

class AreaTreeObject {
    
    constructor() {
        this.id = 0;
        this.region = 0;
        this.level = AddrLevel.UNDEFINED;
        this.gLevel = GarLevel.UNDEFINED;
        this.typs = null;
        this.miscs = null;
        this.parentIds = new Array();
        this.parentParentIds = null;
        this.expired = false;
        this.status = GarStatus.OK;
        this.chCount = 0;
        this.typId = 0;
        this.altTypId = 0;
    }
    
    checkType(na) {
        let alev = this.level;
        if (alev === AddrLevel.CITY || alev === AddrLevel.COUNTRY) {
            if (this.gLevel === GarLevel.STREET) 
                alev = AddrLevel.STREET;
        }
        if (alev !== na.level) {
            if (alev === AddrLevel.SETTLEMENT && (na.level === AddrLevel.LOCALITY)) {
            }
            else if (alev === AddrLevel.LOCALITY && na.level === AddrLevel.TERRITORY) {
            }
            else if (alev === AddrLevel.LOCALITY && na.level === AddrLevel.CITY && na.types.includes("населенный пункт")) {
            }
            else if (alev === AddrLevel.TERRITORY && (na.level === AddrLevel.LOCALITY)) {
            }
            else if ((alev === AddrLevel.TERRITORY && na.level === AddrLevel.DISTRICT && na.types.length === 1) && na.types[0] === "муниципальный район") {
            }
            else if (alev === AddrLevel.STREET && na.level === AddrLevel.TERRITORY) {
            }
            else if (alev === AddrLevel.CITY && ((na.level === AddrLevel.REGIONCITY || na.level === AddrLevel.LOCALITY))) {
            }
            else if ((alev === AddrLevel.CITY && na.level === AddrLevel.LOCALITY && na.types.length === 1) && na.types[0] === "населенный пункт") {
            }
            else if (alev === AddrLevel.TERRITORY && na.level === AddrLevel.STREET) {
                if (na.types.length === 0 || ((na.types.length === 1 && na.types[0] === "улица"))) {
                    if (this.miscs !== null) {
                        if (this.miscs.includes("гаражи") || this.miscs.includes("месторождение") || this.miscs.includes("дачи")) 
                            return -1;
                    }
                }
                else {
                    let ok = false;
                    if (this.miscs !== null && na.miscs !== null) {
                        for (const m of this.miscs) {
                            if (na.miscs.includes(m)) 
                                ok = true;
                        }
                    }
                    if (!ok) 
                        return -1;
                }
            }
            else if ((alev === AddrLevel.DISTRICT && na.level === AddrLevel.SETTLEMENT && this.typs.length > 0) && this.typs[0].includes("округ")) {
            }
            else if (alev === AddrLevel.LOCALITY && na.types.length > 0 && na.types.includes("улус")) {
            }
            else 
                return -1;
        }
        if (this.typs !== null && na.types !== null && na.types.length > 0) {
            for (const ty of this.typs) {
                if (na.types.includes(ty)) {
                    if (ty !== "территория") 
                        return (alev === na.level ? 1 : 0);
                    if (this.miscs !== null && na.miscs !== null) {
                        for (const m of this.miscs) {
                            if (na.miscs.includes(m)) 
                                return (alev === na.level ? 1 : 0);
                            if (Utils.isLowerCase(m[0])) {
                                let ch0 = m[0].toUpperCase();
                                for (const mm of na.miscs) {
                                    if (mm[mm.length - 1] === ch0) 
                                        return (alev === na.level ? 1 : 0);
                                }
                            }
                        }
                    }
                }
            }
            if (alev === AddrLevel.TERRITORY && na.level === AddrLevel.TERRITORY) {
                if ((this.typs.length === 1 && na.types.length === 1 && this.miscs === null) && na.miscs.length === 0) 
                    return 0;
                return -1;
            }
            if (alev === AddrLevel.STREET && na.level === AddrLevel.STREET) {
                if (this.typs.length > 0 && na.types.length > 0) 
                    return -1;
            }
            if (((alev === AddrLevel.STREET && na.level === AddrLevel.TERRITORY)) || ((alev === AddrLevel.TERRITORY && na.level === AddrLevel.STREET))) {
                if (this.miscs !== null && na.miscs !== null) {
                    for (const m of this.miscs) {
                        if (na.miscs.includes(m)) 
                            return 0;
                    }
                }
                if (na.types.length === 1 && na.types[0] === "улица") 
                    return 0;
                if (this.status === GarStatus.OK2) 
                    return 0;
                return -1;
            }
        }
        return 0;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.id);
        if (this.typs !== null) {
            tmp.append(" (");
            for (const ty of this.typs) {
                if (ty !== this.typs[0]) 
                    tmp.append("/");
                tmp.append(ty);
            }
            tmp.append(")");
        }
        if (this.miscs !== null) {
            tmp.append(" [");
            for (const ty of this.miscs) {
                if (ty !== this.miscs[0]) 
                    tmp.append("/");
                tmp.append(ty);
            }
            tmp.append("]");
        }
        for (const p of this.parentIds) {
            tmp.append((p === this.parentIds[0] ? " " : "/")).append(p);
        }
        if (this.parentParentIds !== null) {
            for (const _id of this.parentParentIds) {
                tmp.append((_id === this.parentParentIds[0] ? " -" : ",")).append(_id);
            }
        }
        tmp.append(",r=").append(this.region).append(",l=").append(String(this.level));
        if (this.expired) 
            tmp.append(",expired");
        if (this.status !== GarStatus.OK) 
            tmp.append(",").append(String(this.status));
        return tmp.toString();
    }
    
    compareTo(other) {
        if (this.id < other.id) 
            return -1;
        if (this.id > other.id) 
            return 1;
        return 0;
    }
    
    serialize(f, tr) {
        FiasHelper.serializeInt(f, this.id);
        f.writeByte(this.region);
        let b = this.level.value();
        if (this.expired) 
            b |= (0x80);
        if (this.status === GarStatus.ERROR) 
            b |= (0x40);
        if (this.status === GarStatus.WARNING) 
            b |= (0x20);
        if (this.status === GarStatus.OK2) 
            b |= (0x60);
        f.writeByte(b);
        f.writeByte((this.typs === null ? 0 : this.typs.length));
        if (this.typs !== null) {
            for (const ty of this.typs) {
                FiasHelper.serializeShort(f, tr.getStringId(ty));
            }
        }
        f.writeByte((this.miscs === null ? 0 : this.miscs.length));
        if (this.miscs !== null) {
            for (const ty of this.miscs) {
                FiasHelper.serializeShort(f, tr.getStringId(ty));
            }
        }
        f.writeByte(this.parentIds.length);
        if (this.parentIds.length > 0) {
            for (const p of this.parentIds) {
                FiasHelper.serializeInt(f, p);
            }
            f.writeByte((this.parentParentIds === null ? 0 : this.parentParentIds.length));
            if (this.parentParentIds !== null) {
                for (const _id of this.parentParentIds) {
                    FiasHelper.serializeInt(f, _id);
                }
            }
        }
        f.writeByte(this.gLevel.value());
        FiasHelper.serializeShort(f, this.chCount);
        FiasHelper.serializeShort(f, this.typId);
        FiasHelper.serializeShort(f, this.altTypId);
    }
    
    deserialize(dat, pos, tr) {
        this.id = Utils.bytesToObject(dat, pos, 'int', 4);
        pos += 4;
        this.region = dat[pos];
        pos++;
        let b = dat[pos];
        pos++;
        if ((((b) & 0x80)) !== 0) {
            this.expired = true;
            b &= (0x7F);
        }
        if ((((b) & 0x40)) !== 0) {
            if ((((b) & 0x20)) !== 0) {
                this.status = GarStatus.OK2;
                b &= (0x1F);
            }
            else {
                this.status = GarStatus.ERROR;
                b &= (0x3F);
            }
        }
        if ((((b) & 0x20)) !== 0) {
            this.status = GarStatus.WARNING;
            b &= (0x1F);
        }
        this.level = AddrLevel.of(b);
        let cou1 = dat[pos];
        pos++;
        if (cou1 > 0) {
            this.typs = new Array();
            for (; cou1 > 0; cou1--) {
                let s = tr.getString(Utils.bytesToObject(dat, pos, 'short', 2));
                pos += 2;
                if (s !== null) 
                    this.typs.push(s);
            }
        }
        cou1 = dat[pos];
        pos++;
        if (cou1 > 0) {
            this.miscs = new Array();
            for (; cou1 > 0; cou1--) {
                let s = tr.getString(Utils.bytesToObject(dat, pos, 'short', 2));
                pos += 2;
                if (s !== null) 
                    this.miscs.push(s);
            }
        }
        cou1 = dat[pos];
        pos++;
        if (cou1 > 0) {
            for (; cou1 > 0; cou1--,pos += 4) {
                this.parentIds.push(Utils.bytesToObject(dat, pos, 'int', 4));
            }
            cou1 = dat[pos];
            pos++;
            if (cou1 > 0) {
                this.parentParentIds = new Array();
                for (; cou1 > 0; cou1--,pos += 4) {
                    this.parentParentIds.push(Utils.bytesToObject(dat, pos, 'int', 4));
                }
            }
        }
        if (pos >= dat.length) 
            return;
        b = dat[pos];
        pos++;
        this.gLevel = GarLevel.of(b);
        this.chCount = Utils.bytesToObject(dat, pos, 'short', 2);
        pos += 2;
        this.typId = Utils.bytesToObject(dat, pos, 'short', 2);
        pos += 2;
        this.altTypId = Utils.bytesToObject(dat, pos, 'short', 2);
        pos += 2;
    }
    
    static _new1(_arg1) {
        let res = new AreaTreeObject();
        res.id = _arg1;
        return res;
    }
}


module.exports = AreaTreeObject