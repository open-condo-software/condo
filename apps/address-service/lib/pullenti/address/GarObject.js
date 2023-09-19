/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../unisharp/StringBuilder");

const BaseAttributes = require("./BaseAttributes");
const HouseAttributes = require("./HouseAttributes");
const AreaAttributes = require("./AreaAttributes");
const GarStatus = require("./GarStatus");
const RoomAttributes = require("./RoomAttributes");
const GarHelper = require("./internal/GarHelper");
const GarLevel = require("./GarLevel");
const GarParam = require("./GarParam");
const AddressHelper = require("./AddressHelper");
const NameAnalyzer = require("./internal/NameAnalyzer");
const AddressService = require("./AddressService");

/**
 * Адресный объект ГАР
 * 
 */
class GarObject {
    
    constructor(_attrs) {
        this.attrs = null;
        this.level = GarLevel.UNDEFINED;
        this.expired = false;
        this.guid = null;
        this.regionNumber = 0;
        this.status = GarStatus.OK;
        this.id = null;
        this.parentIds = new Array();
        this.tag = null;
        this.internalTag = 0;
        this.childrenCount = 0;
        this.m_Params = null;
        this.attrs = _attrs;
    }
    
    toString() {
        if (this.attrs === null) 
            return "?";
        let aa = Utils.as(this.attrs, AreaAttributes);
        if (aa !== null && aa.types.length > 0 && aa.names.length > 0) 
            return (aa.types[0] + " " + aa.names[0]);
        return this.attrs.toString();
    }
    
    /**
     * Получить значение параметра (код КЛАДР, почтовый индекс и т.п.)
     * @param ty тип параметра
     * @return значение или null
     */
    getParamValue(ty) {
        if (ty === GarParam.GUID) 
            return this.guid;
        this._loadParams();
        let res = null;
        let wrapres205 = new RefOutArgWrapper();
        let inoutres206 = this.m_Params.tryGetValue(ty, wrapres205);
        res = wrapres205.value;
        if (this.m_Params !== null && inoutres206) 
            return res;
        return null;
    }
    
    /**
     * Получить все параметры
     * @return 
     */
    getParams() {
        this._loadParams();
        return this.m_Params;
    }
    
    /**
     * Вывести подробную текстовую информацию об объекте (для отладки)
     * @param res куда выводить
     */
    outInfo(res, outNameAnalyzeInfo = true) {
        if (this.attrs !== null) 
            this.attrs.outInfo(res);
        res.append("\r\nУровень: ").append((this.level.value())).append(" - ").append(AddressHelper.getGarLevelString(this.level)).append("\r\n");
        if (this.expired) 
            res.append("Актуальность: НЕТ\r\n");
        if (this.m_Params === null) 
            this._loadParams();
        if (this.m_Params !== null) {
            for (const p of this.m_Params.entries) {
                res.append(p.key.toString()).append(": ").append(p.value).append("\r\n");
            }
        }
        res.append("\r\nПолный путь: ").append(this.getFullPath(null, false, null)).append("\r\n");
        let aa = Utils.as(this.attrs, AreaAttributes);
        if (outNameAnalyzeInfo && aa !== null && aa.types.length > 0) {
            res.append("\r\nАнализ объекта: ");
            let na = new NameAnalyzer();
            na.processEx(this);
            na.outInfo(res);
        }
    }
    
    _loadParams() {
        const ServerHelper = require("./internal/ServerHelper");
        if (this.m_Params !== null) 
            return;
        this.m_Params = new Hashtable();
        let pars = null;
        if (ServerHelper.SERVER_URI !== null) 
            pars = ServerHelper.getObjectParams(this.id);
        else 
            pars = GarHelper.getObjectParams(this.id);
        if (pars !== null) {
            for (const kp of pars.entries) {
                if (kp.key !== GarParam.GUID) 
                    this.m_Params.put(kp.key, kp.value);
            }
        }
        if (!this.m_Params.containsKey(GarParam.GUID)) 
            this.m_Params.put(GarParam.GUID, this.guid);
    }
    
    /**
     * Получить полную строку адреса с учётом родителей
     * @param delim разделитель (по умолчанию, запятая с пробелом)
     * @param addr если объект выделен внутри адреса, то для скорости можно указать этот адрес, чтобы родителей искал там , а не в индексе
     * @return результат
     */
    getFullPath(delim = null, correct = false, addr = null) {
        if (delim === null) 
            delim = ", ";
        let path = new Array();
        for (let o = this; o !== null; ) {
            path.splice(0, 0, o);
            if (o.parentIds.length === 0) 
                break;
            if (addr !== null) {
                let oo = addr.findGarByIds(o.parentIds);
                if (oo !== null) {
                    o = oo;
                    continue;
                }
            }
            o = AddressService.getObject(o.parentIds[0]);
        }
        let tmp = new StringBuilder();
        for (let i = 0; i < path.length; i++) {
            if (i > 0) 
                tmp.append(delim);
            if (correct && (path[i].attrs instanceof AreaAttributes)) {
                let a = Utils.as(path[i].attrs, AreaAttributes);
                if (a.names.length > 0) 
                    tmp.append((a.types.length === 0 ? "?" : a.types[0])).append(" ").append(NameAnalyzer.correctFiasName((a.names.length > 0 ? a.names[0] : "?")));
            }
            else if (path[i].attrs === null) 
                tmp.append("?");
            else 
                tmp.append(path[i].attrs.toString());
        }
        return tmp.toString();
    }
    
    serialize(xml) {
        xml.writeStartElement("gar");
        xml.writeElementString("id", this.id);
        xml.writeElementString("level", this.level.toString().toLowerCase());
        for (const p of this.parentIds) {
            xml.writeElementString("parent", p);
        }
        xml.writeElementString("guid", (this.guid != null ? this.guid : ""));
        if (this.expired) 
            xml.writeElementString("expired", "true");
        xml.writeElementString("reg", this.regionNumber.toString());
        if (this.status !== GarStatus.OK) 
            xml.writeElementString("status", this.status.toString().toLowerCase());
        if (this.childrenCount > 0) 
            xml.writeElementString("chcount", this.childrenCount.toString());
        this.attrs.serialize(xml);
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "id") 
                this.id = x.inner_text;
            else if (x.local_name === "parent") 
                this.parentIds.push(x.inner_text);
            else if (x.local_name === "guid") 
                this.guid = x.inner_text;
            else if (x.local_name === "expired") 
                this.expired = x.inner_text === "true";
            else if (x.local_name === "chcount") 
                this.childrenCount = Utils.parseInt(x.inner_text);
            else if (x.local_name === "reg") 
                this.regionNumber = Utils.parseInt(x.inner_text);
            else if (x.local_name === "status") {
                try {
                    this.status = GarStatus.of(x.inner_text);
                } catch (ex207) {
                }
            }
            else if (x.local_name === "level") {
                try {
                    this.level = GarLevel.of(x.inner_text);
                } catch (ex208) {
                }
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
        }
    }
    
    compareTo(other) {
        if ((this.level.value()) < (other.level.value())) 
            return -1;
        if ((this.level.value()) > (other.level.value())) 
            return 1;
        let aa1 = Utils.as(this.attrs, AreaAttributes);
        let aa2 = Utils.as(other.attrs, AreaAttributes);
        if (aa1 !== null && aa2 !== null) {
            if (aa1.names.length > 0 && aa2.names.length > 0) 
                return Utils.compareStrings(aa1.names[0], aa2.names[0], false);
        }
        return Utils.compareStrings(this.toString(), other.toString(), false);
    }
}


module.exports = GarObject