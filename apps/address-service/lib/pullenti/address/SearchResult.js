/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const GarObject = require("./GarObject");
const SearchParams = require("./SearchParams");

/**
 * Результат поискового запроса
 */
class SearchResult {
    
    constructor() {
        this.params = null;
        this.totalCount = 0;
        this.objects = new Array();
    }
    
    toString() {
        return ((this.params === null ? "?" : this.params.toString()) + " = " + this.totalCount + " item(s)");
    }
    
    serialize(xml) {
        xml.writeStartElement("searchresult");
        if (this.params !== null) 
            this.params.serialize(xml);
        xml.writeElementString("total", this.totalCount.toString());
        for (const o of this.objects) {
            o.serialize(xml);
        }
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "seearchparams") {
                this.params = new SearchParams();
                this.params.deserialize(x);
            }
            else if (x.local_name === "total") 
                this.totalCount = Utils.parseInt(x.inner_text);
            else {
                let go = new GarObject(null);
                go.deserialize(x);
                this.objects.push(go);
            }
        }
    }
    
    static _new83(_arg1) {
        let res = new SearchResult();
        res.params = _arg1;
        return res;
    }
}


module.exports = SearchResult