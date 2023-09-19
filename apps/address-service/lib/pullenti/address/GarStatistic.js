/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

/**
 * Статистика по объектам ГАР
 */
class GarStatistic {
    
    constructor() {
        this.indexPath = null;
        this.areaCount = 0;
        this.houseCount = 0;
        this.roomCount = 0;
    }
    
    toString() {
        return ("IndexPath: " + this.indexPath + ", AddrObjs: " + this.areaCount + ", Houses: " + this.houseCount + ", Rooms: " + this.roomCount);
    }
    
    serialize(xml) {
        xml.writeStartElement("GarStatistic");
        if (this.indexPath !== null) 
            xml.writeElementString("path", this.indexPath);
        xml.writeElementString("areas", this.areaCount.toString());
        xml.writeElementString("houses", this.houseCount.toString());
        xml.writeElementString("rooms", this.roomCount.toString());
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "path") 
                this.indexPath = x.inner_text;
            else if (x.local_name === "areas") 
                this.areaCount = Utils.parseInt(x.inner_text);
            else if (x.local_name === "houses") 
                this.houseCount = Utils.parseInt(x.inner_text);
            else if (x.local_name === "rooms") 
                this.roomCount = Utils.parseInt(x.inner_text);
        }
    }
}


module.exports = GarStatistic