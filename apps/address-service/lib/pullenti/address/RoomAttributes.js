/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const BaseAttributes = require("./BaseAttributes");
const RoomType = require("./RoomType");
const AddressHelper = require("./AddressHelper");

/**
 * Атрибуты внутридомовых помещений (квартиры, комнаты), гаражей и машиномест
 * Внутридомовые помещения
 */
class RoomAttributes extends BaseAttributes {
    
    constructor() {
        super();
        this.typ = RoomType.UNDEFINED;
        this.number = null;
    }
    
    toString() {
        return (AddressHelper.getRoomTypeString(this.typ, true) + ((this.number != null ? this.number : "б/н")));
    }
    
    outInfo(res) {
        let _typ = AddressHelper.getRoomTypeString(this.typ, false);
        res.append(_typ[0].toUpperCase()).append(_typ.substring(1)).append(": ").append(((this.number != null ? this.number : "б/н"))).append("\r\n");
    }
    
    serialize(xml) {
        xml.writeStartElement("room");
        if (this.typ !== RoomType.UNDEFINED) 
            xml.writeElementString("type", this.typ.toString().toLowerCase());
        if (this.number !== null) 
            xml.writeElementString("num", this.number);
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "type") {
                try {
                    this.typ = RoomType.of(x.inner_text);
                } catch (ex211) {
                }
            }
            else if (x.local_name === "num") 
                this.number = x.inner_text;
        }
    }
    
    clone() {
        let res = new RoomAttributes();
        res.number = this.number;
        res.typ = this.typ;
        return res;
    }
    
    static _new153(_arg1, _arg2) {
        let res = new RoomAttributes();
        res.typ = _arg1;
        res.number = _arg2;
        return res;
    }
}


module.exports = RoomAttributes