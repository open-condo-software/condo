/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");
const XmlWriter = require("./../../unisharp/XmlWriter");
const XmlDocument = require("./../../unisharp/XmlDocument");
const WebClient = require("./../../unisharp/WebClient");

const GarParam = require("./../GarParam");
const GarObject = require("./../GarObject");
const SearchResult = require("./../SearchResult");
const GarStatistic = require("./../GarStatistic");
const TextAddress = require("./../TextAddress");

class ServerHelper {
    
    static getServerVersion(_address) {
        if (_address === null) 
            _address = ServerHelper.SERVER_URI;
        try {
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                let web = new WebClient();
                let res = web.downloadData((_address != null ? _address : "http://localhost:2222"));
                if (res === null || res.length === 0) 
                    return null;
                return Utils.decodeString("UTF-8", res, 0, -1);
            }
        } catch (ex) {
            return null;
        }
    }
    
    static getGarStatistic() {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("GetGarStatistic");
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 10) 
                return null;
            xml.loadXml(rstr);
            let res = new GarStatistic();
            res.deserialize(xml.document_element);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static _getDatFromXml(tmp) {
        for (let i = 10; (i < tmp.length) && (i < 100); i++) {
            if (tmp.charAt(i) === '-' && tmp.charAt(i + 1) === '1' && tmp.charAt(i + 2) === '6') {
                tmp.setCharAt(i + 1, '8');
                tmp.remove(i + 2, 1);
                break;
            }
        }
        return Utils.encodeString("UTF-8", tmp.toString());
    }
    
    static _outPars(xml, pars) {
        if (pars.defaultRegions.length > 0) {
            let val = pars.defaultRegions[0].toString();
            for (let i = 1; i < pars.defaultRegions.length; i++) {
                val = (val + " " + pars.defaultRegions);
            }
            xml.writeAttributeString("regs", val);
        }
        if (pars.defaultObject !== null) 
            xml.writeAttributeString("defobj", pars.defaultObject.id);
    }
    
    static processText(txt, pars) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("ProcessText");
            if (pars !== null) 
                ServerHelper._outPars(wxml, pars);
            wxml.writeString((txt != null ? txt : ""));
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            xml.loadXml(rstr);
            let res = new Array();
            for (const x of xml.document_element.child_nodes) {
                if (x.child_nodes.length === 0) 
                    continue;
                let to = new TextAddress();
                to.deserialize(x);
                res.push(to);
            }
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static processSingleAddressTexts(txts, pars) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("ProcessSingleAddressTexts");
            if (pars !== null) 
                ServerHelper._outPars(wxml, pars);
            for (const txt of txts) {
                wxml.writeElementString("text", txt);
            }
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 5) 
                return null;
            xml.loadXml(rstr);
            let res = new Array();
            for (const x of xml.document_element.child_nodes) {
                if (x.child_nodes.length === 0) 
                    continue;
                let r = new TextAddress();
                r.deserialize(x);
                res.push(r);
            }
            if (res.length !== txts.length) 
                return null;
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static processSingleAddressText(txt, pars) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("ProcessSingleAddressText");
            if (pars !== null) 
                ServerHelper._outPars(wxml, pars);
            wxml.writeString((txt != null ? txt : ""));
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 5) 
                return null;
            xml.loadXml(rstr);
            let res = new TextAddress();
            res.deserialize(xml.document_element);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static searchObjects(searchPars) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("SearchObjects");
            searchPars.serialize(wxml);
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 5) 
                return null;
            xml.loadXml(rstr);
            let res = new SearchResult();
            res.deserialize(xml.document_element);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static getChildrenObjects(id, ignoreHouses = false) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("GetObjects");
            if (ignoreHouses) 
                wxml.writeAttributeString("ignoreHouses", "true");
            if (id !== null) 
                wxml.writeString(id);
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            xml.loadXml(rstr);
            let res = new Array();
            if (rstr.length < 10) 
                return res;
            for (const x of xml.document_element.child_nodes) {
                let go = new GarObject(null);
                go.deserialize(x);
                if (go.attrs !== null) 
                    res.push(go);
            }
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static getObject(objId) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("GetObject");
            wxml.writeString(objId);
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 10) 
                return null;
            xml.loadXml(rstr);
            let res = new GarObject(null);
            res.deserialize(xml.document_element);
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static getObjectParams(sid) {
        let dat = null;
        let tmp = new StringBuilder();
        let wxml = XmlWriter.createString(tmp, NULL); 
        try {
            wxml.writeStartElement("GetObjectParams");
            wxml.writeString(sid);
            wxml.writeEndElement();
        }
        finally {
            wxml.close();
        }
        dat = ServerHelper._getDatFromXml(tmp);
        try {
            let web = new WebClient();
            let dat1 = [ ];
            /* this is synchronized block by ServerHelper.m_Lock, but this feature isn't supported in JS */ {
                dat1 = web.uploadData(ServerHelper.SERVER_URI, dat);
            }
            if (dat1 === null || dat1.length === 0) 
                return null;
            let xml = new XmlDocument();
            let rstr = Utils.decodeString("UTF-8", dat1, 0, -1);
            if (rstr.length < 10) 
                return null;
            xml.loadXml(rstr);
            let res = new Hashtable();
            for (const x of xml.document_element.child_nodes) {
                try {
                    let ty = GarParam.of(x.local_name);
                    if (ty !== null && ty !== GarParam.UNDEFINED) 
                        res.put(ty, x.inner_text);
                } catch (ex194) {
                }
            }
            return res;
        } catch (ex) {
            return null;
        }
    }
    
    static static_constructor() {
        ServerHelper.m_Lock = new Object();
        ServerHelper.SERVER_URI = null;
    }
}


ServerHelper.static_constructor();

module.exports = ServerHelper