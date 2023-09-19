/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const SearchLevel = require("./SearchLevel");

class SearchAddressItem {
    
    constructor() {
        this.level = SearchLevel.UNDEFINED;
        this.id = null;
        this.text = null;
        this.parent = null;
        this.search = false;
        this.ignoreTerritories = false;
        this.tag = null;
    }
    
    toString() {
        return ((this.search ? "?" : "") + (this.level.value()) + ": " + this.text);
    }
    
    serialize(xml) {
        xml.writeStartElement("item");
        xml.writeAttributeString("level", this.level.value().toString());
        if (this.id !== null) 
            xml.writeAttributeString("id", this.id);
        if (this.text !== null) 
            xml.writeAttributeString("text", this.text);
        if (this.search) 
            xml.writeAttributeString("search", "true");
        if (this.ignoreTerritories) 
            xml.writeAttributeString("ignoreterr", "true");
        if (this.parent !== null) 
            this.parent.serialize(xml);
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        if (xml.attributes !== null) {
            for (const a of xml.attributes) {
                if (a.local_name === "level") 
                    this.level = SearchLevel.of(Utils.parseInt(a.value));
                else if (a.local_name === "id") 
                    this.id = a.value;
                else if (a.local_name === "text") 
                    this.text = a.value;
                else if (a.local_name === "search") 
                    this.search = a.value === "true";
                else if (a.local_name === "ignoreterr") 
                    this.ignoreTerritories = a.value === "true";
            }
        }
        for (const x of xml.child_nodes) {
            if (x.local_name === "item") {
                this.parent = new SearchAddressItem();
                this.parent.deserialize(x);
            }
        }
    }
    
    compareTo(other) {
        let i = Utils.compareStrings(this.text, other.text, false);
        if (i !== 0) 
            return i;
        if (this.parent !== null && other.parent !== null) 
            return this.parent.compareTo(other.parent);
        if (this.parent === null && other.parent !== null) 
            return -1;
        if (this.parent !== null && other.parent === null) 
            return 1;
        return 0;
    }
    
    static _new84(_arg1, _arg2) {
        let res = new SearchAddressItem();
        res.level = _arg1;
        res.id = _arg2;
        return res;
    }
    
    static _new85(_arg1, _arg2) {
        let res = new SearchAddressItem();
        res.level = _arg1;
        res.text = _arg2;
        return res;
    }
    
    static _new94(_arg1, _arg2, _arg3, _arg4) {
        let res = new SearchAddressItem();
        res.id = _arg1;
        res.level = _arg2;
        res.tag = _arg3;
        res.text = _arg4;
        return res;
    }
    
    static _new96(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new SearchAddressItem();
        res.id = _arg1;
        res.tag = _arg2;
        res.level = _arg3;
        res.parent = _arg4;
        res.text = _arg5;
        return res;
    }
    
    static _new98(_arg1, _arg2, _arg3, _arg4) {
        let res = new SearchAddressItem();
        res.id = _arg1;
        res.tag = _arg2;
        res.level = _arg3;
        res.text = _arg4;
        return res;
    }
}


module.exports = SearchAddressItem