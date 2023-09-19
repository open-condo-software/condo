/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const BaseAttributes = require("./BaseAttributes");
const HouseType = require("./HouseType");
const GarLevel = require("./GarLevel");
const AddressHelper = require("./AddressHelper");
const DetailType = require("./DetailType");
const AddrLevel = require("./AddrLevel");
const RoomAttributes = require("./RoomAttributes");
const AreaAttributes = require("./AreaAttributes");
const HouseAttributes = require("./HouseAttributes");
const GarObject = require("./GarObject");

/**
 * Адресный объект, выделяемый из текста (элемент TextAddress)
 * 
 * Адресный объект из текста
 */
class AddrObject {
    
    constructor(_attrs) {
        this.attrs = null;
        this.level = AddrLevel.UNDEFINED;
        this.gars = new Array();
        this.crossObject = null;
        this.repObject = null;
        this.isReconstructed = false;
        this.detailTyp = DetailType.UNDEFINED;
        this.detailParam = null;
        this.extId = null;
        this.tag = null;
        this.attrs = _attrs;
    }
    
    toString() {
        if (this.detailTyp === DetailType.UNDEFINED) 
            return this.toStringMin();
        if (this.detailTyp === DetailType.KMRANGE) 
            return (this.toStringMin() + " " + ((this.detailParam != null ? this.detailParam : "")));
        let res = null;
        if (this.detailParam === "часть") 
            res = (AddressHelper.getDetailPartParamString(this.detailTyp) + " ");
        else {
            res = AddressHelper.getDetailTypeString(this.detailTyp);
            if (this.detailParam !== null) 
                res = (res + " " + this.detailParam);
            res += " от ";
        }
        return res + this.toStringMin();
    }
    
    toStringMin() {
        if (this.attrs === null) 
            return "?";
        let res = null;
        if (this.crossObject !== null) 
            res = (this.attrs.toString() + " / " + this.crossObject.toStringMin());
        else if (this.attrs instanceof AreaAttributes) 
            res = this.attrs.toStringEx(this.level, false);
        else 
            res = this.attrs.toString();
        return res;
    }
    
    findGarById(id) {
        if (id === null) 
            return null;
        for (const g of this.gars) {
            if (g.id === id) 
                return g;
        }
        return null;
    }
    
    findGarByIds(ids) {
        if (ids === null) 
            return null;
        for (const g of this.gars) {
            if (ids.includes(g.id)) 
                return g;
        }
        return null;
    }
    
    findGarByLevel(_level) {
        for (const g of this.gars) {
            if (g.level === _level) 
                return g;
        }
        return null;
    }
    
    sortGars() {
        for (let k = 0; k < this.gars.length; k++) {
            for (let i = 0; i < (this.gars.length - 1); i++) {
                if (this.gars[i].expired && !this.gars[i + 1].expired) {
                    let g = this.gars[i];
                    this.gars[i] = this.gars[i + 1];
                    this.gars[i + 1] = g;
                }
            }
        }
    }
    
    /**
     * Вывести подробную текстовую информацию об объекте (для отладки)
     * @param res 
     */
    outInfo(res) {
        this.attrs.outInfo(res);
        if (this.detailTyp !== DetailType.UNDEFINED) {
            if (this.detailParam === "часть") 
                res.append("Детализация: ").append(AddressHelper.getDetailPartParamString(this.detailTyp)).append("\r\n");
            else {
                res.append("Детализация: ").append(AddressHelper.getDetailTypeString(this.detailTyp));
                if (this.detailParam !== null) 
                    res.append(" ").append(this.detailParam);
                res.append("\r\n");
            }
        }
        res.append("\r\nУровень: ").append(AddressHelper.getAddrLevelString(this.level));
        if (this.repObject !== null) 
            res.append("\r\nОбъект адрессария: ").append(this.repObject.spelling).append(" (ID=").append(this.repObject.id).append(")");
        if (this.extId !== null) 
            res.append("\r\nВнешний идентификатор: ").append(this.extId);
        res.append("\r\nПривязка к ГАР: ");
        if (this.gars.length === 0) 
            res.append("НЕТ");
        else 
            for (let i = 0; i < this.gars.length; i++) {
                if (i > 0) 
                    res.append("; ");
                res.append(this.gars[i].toString());
            }
        if (this.crossObject !== null) {
            res.append("\r\n\r\nОбъект пересечения:\r\n");
            this.crossObject.outInfo(res);
        }
    }
    
    canBeParentFor(child, parForParent = null) {
        if (child === null) 
            return false;
        if (!AddressHelper.canBeParent(child.level, this.level)) {
            if (this.level === AddrLevel.BUILDING && child.level === AddrLevel.BUILDING) {
                if (child.attrs.typ === HouseType.GARAGE && this.attrs.typ !== HouseType.GARAGE) 
                    return true;
            }
            if (child.level === AddrLevel.CITY && this.level === AddrLevel.CITY) {
                let cha = Utils.as(child.attrs, AreaAttributes);
                let a = Utils.as(this.attrs, AreaAttributes);
                if (a.names.length > 0 && cha.names.includes(a.names[0])) {
                    if (a.number === null && cha.number !== null) 
                        return true;
                }
            }
            if (this.level === AddrLevel.STREET && child.level === AddrLevel.STREET) {
                if (child.attrs.types.includes("километр")) 
                    return true;
                if (this.attrs.types.includes("километр")) 
                    return true;
            }
            return false;
        }
        if (child.level === AddrLevel.STREET || child.level === AddrLevel.TERRITORY) {
            if (this.level === AddrLevel.DISTRICT) {
                if (parForParent === null) 
                    return false;
                if (parForParent.level !== AddrLevel.CITY && parForParent.level !== AddrLevel.REGIONCITY && parForParent.level !== AddrLevel.REGIONAREA) 
                    return false;
            }
        }
        if (child.level === AddrLevel.BUILDING && this.gars.length === 1) {
        }
        return true;
    }
    
    canBeEqualsLevel(obj) {
        if (this.level === obj.level) 
            return true;
        if (this.level === AddrLevel.STREET && obj.level === AddrLevel.TERRITORY) 
            return obj.attrs.miscs.includes("дорога");
        if (this.level === AddrLevel.TERRITORY && obj.level === AddrLevel.STREET) 
            return this.attrs.miscs.includes("дорога");
        return false;
    }
    
    canBeEqualsGLevel(gar) {
        let a = Utils.as(this.attrs, AreaAttributes);
        let ga = Utils.as(gar.attrs, AreaAttributes);
        if (((this.level === AddrLevel.LOCALITY && gar.level === GarLevel.AREA)) || ((this.level === AddrLevel.TERRITORY && ((gar.level === GarLevel.LOCALITY || gar.level === GarLevel.STREET))))) {
            for (const mi of a.miscs) {
                if (ga.miscs.includes(mi)) 
                    return true;
                if (mi === "дорога" && ((gar.level === GarLevel.STREET || gar.level === GarLevel.AREA))) 
                    return true;
            }
            for (const ty of a.types) {
                if (ga.types.includes(ty)) 
                    return true;
            }
            if (this.level === AddrLevel.LOCALITY && gar.level === GarLevel.AREA) {
                if (ga.types.includes("микрорайон")) 
                    return true;
                if (a.types.length > 0) {
                    if (ga.toString().toLowerCase().includes(a.types[0])) 
                        return true;
                }
            }
            if (this.level === AddrLevel.TERRITORY && gar.level === GarLevel.LOCALITY) {
                if (a.miscs.includes("совхоз") || a.miscs.includes("колхоз")) 
                    return true;
            }
            if (this.level === AddrLevel.TERRITORY && gar.level === GarLevel.STREET) {
                if (a.types.includes("микрорайон")) {
                    if (ga.toString().toUpperCase().includes("МИКРОРАЙОН")) 
                        return true;
                }
            }
            return false;
        }
        if (this.level === AddrLevel.CITY && ((gar.level === GarLevel.MUNICIPALAREA || gar.level === GarLevel.ADMINAREA))) {
            if (ga.types.includes("город")) 
                return true;
        }
        if (this.level === AddrLevel.DISTRICT && gar.level === GarLevel.SETTLEMENT) {
            for (const ty of gar.attrs.types) {
                if (ty.includes("район")) 
                    return true;
            }
            for (const nam of gar.attrs.names) {
                if (nam.includes("район")) 
                    return true;
            }
        }
        if (AddressHelper.canBeEqualLevels(this.level, gar.level)) 
            return true;
        if (this.level === AddrLevel.LOCALITY && gar.level === GarLevel.SETTLEMENT) 
            return true;
        if (this.level === AddrLevel.SETTLEMENT && gar.level === GarLevel.LOCALITY) 
            return true;
        if (this.level === AddrLevel.DISTRICT && gar.level === GarLevel.LOCALITY) {
            if (a.types.includes("улус")) 
                return true;
        }
        if (this.level === AddrLevel.CITYDISTRICT) {
            if (ga.types.length > 0 && ga.types[0].includes("район")) 
                return true;
        }
        if (this.level === AddrLevel.STREET && gar.level === GarLevel.AREA) {
            if (a.types.length === 1 && a.types[0] === "улица") 
                return true;
        }
        if (((this.level === AddrLevel.SETTLEMENT || this.level === AddrLevel.LOCALITY)) && gar.level === GarLevel.CITY) {
            if (gar.toString().includes("поселок")) 
                return true;
            if (this.toString().includes("поселок")) 
                return true;
            for (const ty of a.types) {
                if (ga.types.includes(ty)) 
                    return true;
            }
        }
        if (this.level === AddrLevel.CITY && gar.level === GarLevel.LOCALITY) {
            if (!a.types.includes("город")) 
                return true;
        }
        return false;
    }
    
    serialize(xml) {
        xml.writeStartElement("textobj");
        this.attrs.serialize(xml);
        xml.writeElementString("level", this.level.toString().toLowerCase());
        if (this.isReconstructed) 
            xml.writeElementString("reconstr", "true");
        if (this.extId !== null) 
            xml.writeElementString("extid", this.extId);
        for (const g of this.gars) {
            g.serialize(xml);
        }
        if (this.crossObject !== null) {
            xml.writeStartElement("cross");
            this.crossObject.serialize(xml);
            xml.writeEndElement();
        }
        if (this.detailTyp !== DetailType.UNDEFINED) {
            xml.writeElementString("detailtyp", this.detailTyp.toString().toLowerCase());
            if (this.detailParam !== null) 
                xml.writeElementString("detailparame", this.detailParam);
        }
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "gar") {
                let g = new GarObject(null);
                g.deserialize(x);
                this.gars.push(g);
            }
            else if (x.local_name === "area") {
                this.attrs = new AreaAttributes();
                this.attrs.deserialize(x);
            }
            else if (x.local_name === "house") {
                this.attrs = new HouseAttributes();
                this.attrs.deserialize(x);
            }
            else if (x.local_name === "room") {
                this.attrs = new RoomAttributes();
                this.attrs.deserialize(x);
            }
            else if (x.local_name === "cross") {
                for (const xx of x.child_nodes) {
                    this.crossObject = new AddrObject(null);
                    this.crossObject.deserialize(xx);
                    break;
                }
            }
            else if (x.local_name === "level") {
                try {
                    this.level = AddrLevel.of(x.inner_text);
                } catch (ex201) {
                }
            }
            else if (x.local_name === "reconstr") 
                this.isReconstructed = x.inner_text === "true";
            else if (x.local_name === "extid") 
                this.extId = x.inner_text;
            else if (x.local_name === "detailtyp") {
                try {
                    this.detailTyp = DetailType.of(x.inner_text);
                } catch (ex202) {
                }
            }
            else if (x.local_name === "detailparam") 
                this.detailParam = x.inner_text;
        }
    }
    
    clone() {
        let res = new AddrObject(this.attrs.clone());
        res.gars.splice(res.gars.length, 0, ...this.gars);
        res.level = this.level;
        res.tag = this.tag;
        res.repObject = this.repObject;
        if (this.crossObject !== null) 
            res.crossObject = this.crossObject.clone();
        res.detailTyp = this.detailTyp;
        res.detailParam = this.detailParam;
        return res;
    }
    
    static _new118(_arg1, _arg2) {
        let res = new AddrObject(_arg1);
        res.level = _arg2;
        return res;
    }
}


module.exports = AddrObject