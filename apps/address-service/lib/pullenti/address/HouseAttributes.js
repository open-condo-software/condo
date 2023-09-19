/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

const BaseAttributes = require("./BaseAttributes");
const HouseType = require("./HouseType");
const StroenType = require("./StroenType");
const AddressHelper = require("./AddressHelper");

/**
 * Атрибуты строений и участков
 */
class HouseAttributes extends BaseAttributes {
    
    constructor() {
        super();
        this.typ = HouseType.UNDEFINED;
        this.number = null;
        this.buildNumber = null;
        this.stroenTyp = StroenType.UNDEFINED;
        this.stroenNumber = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.number !== null || this.typ !== HouseType.UNDEFINED) {
            if (this.typ !== HouseType.UNDEFINED) 
                res.append(AddressHelper.getHouseTypeString(this.typ, this.number !== null)).append(((this.number != null ? this.number : " б/н")));
            else 
                res.append(this.number);
        }
        if (this.buildNumber !== null) {
            if (res.length > 0) 
                res.append(" ");
            res.append("корп.").append(this.buildNumber);
        }
        if (this.stroenNumber !== null) {
            if (res.length > 0) 
                res.append(" ");
            res.append(AddressHelper.getStroenTypeString(this.stroenTyp, true)).append(this.stroenNumber);
        }
        return res.toString();
    }
    
    outInfo(res) {
        if (this.number !== null || this.typ !== HouseType.UNDEFINED) {
            if (this.typ !== HouseType.UNDEFINED) {
                let _typ = AddressHelper.getHouseTypeString(this.typ, false);
                res.append(_typ[0].toUpperCase()).append(_typ.substring(1)).append(": ").append(((this.number != null ? this.number : "б/н"))).append("\r\n");
            }
            else 
                res.append("Номер: ").append(this.number).append("\r\n");
        }
        if (this.buildNumber !== null) 
            res.append("Корпус: ").append(this.buildNumber).append("\r\n");
        if (this.stroenNumber !== null) {
            let _typ = AddressHelper.getStroenTypeString(this.stroenTyp, false);
            res.append(_typ[0].toUpperCase()).append(_typ.substring(1)).append(": ").append(this.stroenNumber).append("\r\n");
        }
    }
    
    serialize(xml) {
        xml.writeStartElement("house");
        if (this.typ !== HouseType.UNDEFINED) 
            xml.writeElementString("type", this.typ.toString().toLowerCase());
        if (this.number !== null) 
            xml.writeElementString("num", this.number);
        if (this.buildNumber !== null) 
            xml.writeElementString("bnum", this.buildNumber);
        if (this.stroenNumber !== null) {
            xml.writeElementString("stype", this.stroenTyp.toString().toLowerCase());
            xml.writeElementString("snum", this.stroenNumber);
        }
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "type") {
                try {
                    this.typ = HouseType.of(x.inner_text);
                } catch (ex209) {
                }
            }
            else if (x.local_name === "num") 
                this.number = x.inner_text;
            else if (x.local_name === "stype") {
                try {
                    this.stroenTyp = StroenType.of(x.inner_text);
                } catch (ex210) {
                }
            }
            else if (x.local_name === "snum") 
                this.stroenNumber = x.inner_text;
            else if (x.local_name === "bnum") 
                this.buildNumber = x.inner_text;
        }
    }
    
    clone() {
        let res = new HouseAttributes();
        res.typ = this.typ;
        res.number = this.number;
        res.buildNumber = this.buildNumber;
        res.stroenTyp = this.stroenTyp;
        res.stroenNumber = this.stroenNumber;
        return res;
    }
    
    static _new143(_arg1, _arg2) {
        let res = new HouseAttributes();
        res.typ = _arg1;
        res.number = _arg2;
        return res;
    }
}


module.exports = HouseAttributes