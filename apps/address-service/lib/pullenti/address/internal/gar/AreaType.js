/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const Stream = require("./../../../unisharp/Stream");
const FileStream = require("./../../../unisharp/FileStream");
const XmlWriterSettings = require("./../../../unisharp/XmlWriterSettings");
const XmlWriter = require("./../../../unisharp/XmlWriter");
const XmlDocument = require("./../../../unisharp/XmlDocument");

const AreaTypeTyps = require("./AreaTypeTyps");

class AreaType {
    
    constructor() {
        this.name = null;
        this.typ = AreaTypeTyps.UNDEFINED;
        this.id = 0;
        this.count = 0;
        this.stat = new Hashtable();
    }
    
    toString() {
        return (String(this.typ) + ": " + this.name);
    }
    
    calcTyp() {
        if (this.name === "территория") 
            return;
        let max = 10;
        for (const s of this.stat.entries) {
            if (s.value > max) {
                max = s.value;
                this.typ = s.key;
            }
        }
    }
    
    static save(fname, typs, _id, dt) {
        let settings = new XmlWriterSettings();
        settings.indent = true;
        settings.indentChars = " ";
        settings.encoding = "UTF-8";
        let f = new FileStream(fname, "w+", false); 
        try {
            let xml = XmlWriter.createStream(f, settings);
            xml.writeStartDocument();
            xml.writeStartElement("types");
            if (_id !== null) 
                xml.writeAttributeString("guid", _id);
            if (dt !== null) 
                xml.writeAttributeString("date", dt);
            for (const ty of typs.values) {
                xml.writeStartElement("type");
                xml.writeAttributeString("id", ty.id.toString());
                xml.writeAttributeString("class", ty.typ.toString());
                xml.writeAttributeString("name", (ty.name != null ? ty.name : "?"));
                xml.writeAttributeString("count", ty.count.toString());
                xml.writeEndElement();
            }
            xml.writeEndElement();
            xml.writeEndDocument();
            xml.close();
        }
        finally {
            f.close();
        }
    }
    
    static load(fname, _id, dt) {
        let res = new Hashtable();
        let xdoc = new XmlDocument();
        let f = new FileStream(fname, "r", false); 
        try {
            xdoc.loadStream(f);
        }
        finally {
            f.close();
        }
        for (const a of xdoc.document_element.attributes) {
            if (a.local_name === "guid") 
                _id.value = a.value;
            else if (a.local_name === "date") 
                dt.value = a.value;
        }
        for (const x of xdoc.document_element.child_nodes) {
            if (x.local_name === "type") {
                let ty = new AreaType();
                for (const a of x.attributes) {
                    if (a.local_name === "id") {
                        let n = 0;
                        let wrapn18 = new RefOutArgWrapper();
                        let inoutres19 = Utils.tryParseInt(a.value, wrapn18);
                        n = wrapn18.value;
                        if (inoutres19) 
                            ty.id = n;
                    }
                    else if (a.local_name === "name") 
                        ty.name = a.value;
                    else if (a.local_name === "count") {
                        let n = 0;
                        let wrapn20 = new RefOutArgWrapper();
                        let inoutres21 = Utils.tryParseInt(a.value, wrapn20);
                        n = wrapn20.value;
                        if (inoutres21) 
                            ty.count = n;
                    }
                    else if (a.local_name === "class") {
                        try {
                            ty.typ = AreaTypeTyps.of(a.value);
                        } catch (ex22) {
                        }
                    }
                }
                if (ty.id > 0 && !res.containsKey(ty.id)) 
                    res.put(ty.id, ty);
            }
        }
        return res;
    }
    
    static _new34(_arg1, _arg2) {
        let res = new AreaType();
        res.id = _arg1;
        res.name = _arg2;
        return res;
    }
}


module.exports = AreaType