/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const GarParam = require("./GarParam");

/**
 * Параметры для поиска
 */
class SearchParams {
    
    constructor() {
        this.region = 0;
        this.area = null;
        this.city = null;
        this.street = null;
        this.paramTyp = GarParam.UNDEFINED;
        this.paramValue = null;
        this.maxCount = 100;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.region > 0) 
            res.append("Region:{0} ");
        if (!Utils.isNullOrEmpty(this.area)) 
            res.append("Area:'").append(this.area).append("' ");
        if (!Utils.isNullOrEmpty(this.city)) 
            res.append("City:'").append(this.city).append("' ");
        if (!Utils.isNullOrEmpty(this.street)) 
            res.append("Street:'").append(this.street).append("' ");
        if (this.paramTyp !== GarParam.UNDEFINED) 
            res.append(String(this.paramTyp)).append(":'").append(((this.paramValue != null ? this.paramValue : ""))).append("'");
        return res.toString();
    }
    
    serialize(xml) {
        xml.writeStartElement("searchparams");
        if (this.region > 0) 
            xml.writeElementString("region", this.region.toString());
        if (this.area !== null) 
            xml.writeElementString("area", this.area);
        if (this.city !== null) 
            xml.writeElementString("city", this.city);
        if (this.street !== null) 
            xml.writeElementString("street", this.street);
        if (this.paramTyp !== GarParam.UNDEFINED) 
            xml.writeElementString("paramtype", this.paramTyp.toString().toLowerCase());
        if (this.paramValue !== null) 
            xml.writeElementString("paramvalue", this.paramValue);
        if (this.maxCount > 0) 
            xml.writeElementString("maxcount", this.maxCount.toString());
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "region") 
                this.region = Utils.parseInt(x.inner_text);
            else if (x.local_name === "area") 
                this.area = x.inner_text;
            else if (x.local_name === "city") 
                this.city = x.inner_text;
            else if (x.local_name === "street") 
                this.street = x.inner_text;
            else if (x.local_name === "paramtype") {
                try {
                    this.paramTyp = GarParam.of(x.inner_text);
                } catch (ex212) {
                }
            }
            else if (x.local_name === "paramvalue") 
                this.paramValue = x.inner_text;
            else if (x.local_name === "maxcount") 
                this.maxCount = Utils.parseInt(x.inner_text);
        }
    }
}


module.exports = SearchParams