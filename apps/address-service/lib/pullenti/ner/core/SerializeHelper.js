/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");
const XmlWriter = require("./../../unisharp/XmlWriter");
const XmlDocument = require("./../../unisharp/XmlDocument");

const Referent = require("./../Referent");
const LanguageHelper = require("./../../morph/LanguageHelper");
const ProcessorService = require("./../ProcessorService");

/**
 * Сериализация сущностей
 */
class SerializeHelper {
    
    /**
     * Сериализация в строку XML списка сущностей. Сущности могут быть взаимосвязаны, 
     * то есть значениями атрибутов могут выступать другие сущности (то есть сериализуется по сути граф).
     * @param refs список сериализуемых сущностей
     * @param rootTagName имя корневого узла
     * @param outOccurences выводить ли вхождения в текст
     * @return строка с XML
     */
    static serializeReferentsToXmlString(refs, rootTagName = "referents", outOccurences = false) {
        let id = 1;
        for (const r of refs) {
            r.tag = id;
            id++;
        }
        let res = new StringBuilder();
        let xml = XmlWriter.createString(res, NULL); 
        try {
            xml.writeStartElement(rootTagName);
            for (const r of refs) {
                SerializeHelper.serializeReferentToXml(r, xml, outOccurences, false);
            }
            xml.writeEndElement();
        }
        finally {
            xml.close();
        }
        SerializeHelper._corrXmlFile(res);
        for (const r of refs) {
            r.tag = null;
        }
        return res.toString();
    }
    
    /**
     * Прямая сериализация сущности в строку XML.
     * @param r сериализуемая сущность
     * @param outOccurences выводить ли вхождения в текст
     */
    static serializeReferentToXmlString(r, outOccurences = false) {
        let res = new StringBuilder();
        let xml = XmlWriter.createString(res, NULL); 
        try {
            SerializeHelper.serializeReferentToXml(r, xml, outOccurences, true);
        }
        finally {
            xml.close();
        }
        SerializeHelper._corrXmlFile(res);
        return res.toString();
    }
    
    /**
     * Прямая сериализация сущности в XML.
     * @param r сериализуемая сущность
     * @param xml куда сериализовать
     * @param outOccurences выводить ли вхождения в текст
     * @param convertSlotRefsToString преобразовывать ли ссылки в слотах на сущноси в строковые значения
     */
    static serializeReferentToXml(r, xml, outOccurences = false, convertSlotRefsToString = false) {
        xml.writeStartElement("referent");
        if ((typeof r.tag === 'number' || r.tag instanceof Number)) 
            xml.writeAttributeString("id", r.tag.toString());
        xml.writeAttributeString("typ", r.typeName);
        xml.writeAttributeString("spel", SerializeHelper._corrXmlValue(r.toString()));
        for (const s of r.slots) {
            if (s.value !== null) {
                let nam = s.typeName;
                xml.writeStartElement("slot");
                xml.writeAttributeString("typ", s.typeName);
                if ((s.value instanceof Referent) && ((typeof s.value.tag === 'number' || s.value.tag instanceof Number))) 
                    xml.writeAttributeString("ref", s.value.tag.toString());
                if (s.value !== null) 
                    xml.writeAttributeString("val", SerializeHelper._corrXmlValue(s.value.toString()));
                if (s.count > 0) 
                    xml.writeAttributeString("count", s.count.toString());
                xml.writeEndElement();
            }
        }
        if (outOccurences) {
            for (const o of r.occurrence) {
                xml.writeStartElement("occ");
                xml.writeAttributeString("begin", o.beginChar.toString());
                xml.writeAttributeString("end", o.endChar.toString());
                xml.writeAttributeString("text", SerializeHelper._corrXmlValue(o.getText()));
                xml.writeEndElement();
            }
        }
        xml.writeEndElement();
    }
    
    static _corrXmlFile(res) {
        let i = res.toString().indexOf('>');
        if (i > 10 && res.charAt(1) === '?') 
            res.remove(0, i + 1);
        for (i = 0; i < res.length; i++) {
            let ch = res.charAt(i);
            let cod = ch.charCodeAt(0);
            if ((cod < 0x80) && cod >= 0x20) 
                continue;
            if (LanguageHelper.isCyrillicChar(ch)) 
                continue;
            res.remove(i, 1);
            res.insert(i, ("&#x" + Utils.correctToString((cod).toString(16).toUpperCase(), 4, true) + ";"));
        }
    }
    
    static _corrXmlValue(txt) {
        if (txt === null) 
            return "";
        for (const c of txt) {
            if ((((c.charCodeAt(0)) < 0x20) && c !== '\r' && c !== '\n') && c !== '\t') {
                let tmp = new StringBuilder(txt);
                for (let i = 0; i < tmp.length; i++) {
                    let ch = tmp.charAt(i);
                    if ((((ch.charCodeAt(0)) < 0x20) && ch !== '\r' && ch !== '\n') && ch !== '\t') 
                        tmp.setCharAt(i, ' ');
                }
                return tmp.toString();
            }
        }
        return txt;
    }
    
    /**
     * Десериализация списка взаимосвязанных сущностей из строки
     * @param xmlString результат сериализации функцией SerializeReferentsToXmlString()
     * @return Список экземпляров сущностей
     */
    static deserializeReferentsFromXmlString(xmlString) {
        let res = new Array();
        let map = new Hashtable();
        try {
            let xml = new XmlDocument();
            xml.loadXml(xmlString);
            for (const x of xml.document_element.child_nodes) {
                if (x.local_name === "referent") {
                    let r = SerializeHelper._deserializeReferent(x);
                    if (r === null) 
                        continue;
                    res.push(r);
                    if ((typeof r.tag === 'number' || r.tag instanceof Number)) {
                        if (!map.containsKey(r.tag)) 
                            map.put(r.tag, r);
                    }
                }
            }
        } catch (ex) {
            return null;
        }
        // восстанавливаем ссылки
        for (const r of res) {
            r.tag = null;
            for (const s of r.slots) {
                if ((typeof s.tag === 'number' || s.tag instanceof Number)) {
                    let rr = null;
                    let wraprr858 = new RefOutArgWrapper();
                    map.tryGetValue(s.tag, wraprr858);
                    rr = wraprr858.value;
                    if (rr !== null) 
                        s.value = rr;
                    s.tag = null;
                }
            }
        }
        return res;
    }
    
    /**
     * Десериализация сущности из строки XML
     * @param xmlString результат сериализации функцией SerializeReferentToXmlString()
     * @return Экземпляр сущностей
     */
    static deserializeReferentFromXmlString(xmlString) {
        try {
            let xml = new XmlDocument();
            xml.loadXml(xmlString);
            return SerializeHelper._deserializeReferent(xml.document_element);
        } catch (ex) {
        }
        return null;
    }
    
    static _deserializeReferent(xml) {
        let typ = null;
        let id = 0;
        if (xml.attributes !== null) {
            for (const a of xml.attributes) {
                if (a.local_name === "id") 
                    id = Utils.parseInt(a.value);
                else if (a.local_name === "typ") 
                    typ = a.value;
            }
        }
        if (typ === null) 
            return null;
        let res = ProcessorService.createReferent(typ);
        if (res === null) 
            return null;
        res.tag = id;
        for (const x of xml.child_nodes) {
            if (x.local_name !== "slot") 
                continue;
            let nam = null;
            let val = null;
            let cou = 0;
            let refid = 0;
            if (x.attributes !== null) {
                for (const a of x.attributes) {
                    if (a.local_name === "typ") 
                        nam = a.value;
                    else if (a.local_name === "count") 
                        cou = Utils.parseInt(a.value);
                    else if (a.local_name === "ref") 
                        refid = Utils.parseInt(a.value);
                    else if (a.local_name === "val") 
                        val = a.value;
                }
            }
            if (nam === null) 
                continue;
            let slot = res.addSlot(nam, val, false, 0);
            slot.count = cou;
            if (refid > 0) 
                slot.tag = refid;
        }
        return res;
    }
    
    /**
     * Сериализация в строку JSON списка сущностей. Сущности могут быть взаимосвязаны, 
     * то есть значениями атрибутов могут выступать другие сущности (то есть сериализуется по сути граф).
     * @param refs список сериализуемых сущностей
     * @param rootTagName имя корневого узла
     * @param outOccurences выводить ли вхождения в текст
     * @return строка с JSON (массив [...])
     */
    static serializeReferentsToJsonString(refs, outOccurences = false) {
        let id = 1;
        for (const r of refs) {
            r.tag = id;
            id++;
        }
        let res = new StringBuilder();
        res.append("[");
        for (const r of refs) {
            let json = SerializeHelper.serializeReferentToJsonString(r, outOccurences);
            res.append("\r\n");
            res.append(json);
            if (r !== refs[refs.length - 1]) 
                res.append(", ");
        }
        res.append("\r\n]");
        for (const r of refs) {
            r.tag = null;
        }
        return res.toString();
    }
    
    /**
     * Сериализация сущности в JSON (словарь {...}).
     * @param r сериализуемая сущность
     * @param outOccurences выводить ли вхождения в текст
     * @return строка со словарём JSON
     */
    static serializeReferentToJsonString(r, outOccurences = false) {
        let res = new StringBuilder();
        res.append("{");
        if ((typeof r.tag === 'number' || r.tag instanceof Number)) 
            res.append("\r\n  \"id\" : ").append(r.tag).append(",");
        res.append("\r\n  \"typ\" : \"").append(r.typeName).append("\", ");
        res.append("\r\n  \"spel\" : \"");
        SerializeHelper._corrJsonValue(r.toString(), res);
        res.append("\", ");
        res.append("\r\n  \"slots\" : [");
        for (let i = 0; i < r.slots.length; i++) {
            let s = r.slots[i];
            res.append("\r\n      ").append('{').append(" \"typ\" : \"").append(s.typeName).append("\", ");
            if (s.value instanceof Referent) 
                res.append("\"ref\" : ").append(s.value.tag.toString()).append(", ");
            if (s.value !== null) 
                res.append("\"val\" : \"");
            SerializeHelper._corrJsonValue(s.value.toString(), res);
            res.append("\"");
            if (s.count > 0) 
                res.append(", \"count\" : ").append(s.count.toString());
            res.append(" }");
            if ((i + 1) < r.slots.length) 
                res.append(",");
        }
        res.append(" ]");
        if (outOccurences) {
            res.append(",\r\n  \"occs\" : [");
            for (let i = 0; i < r.occurrence.length; i++) {
                let o = r.occurrence[i];
                res.append("\r\n      ").append('{').append(" \"begin\" : ").append(o.beginChar).append(", \"end\" : ").append(o.endChar).append(", \"text\" : \"");
                SerializeHelper._corrJsonValue(o.getText(), res);
                res.append("\" }");
                if ((i + 1) < r.occurrence.length) 
                    res.append(",");
            }
            res.append(" ]");
        }
        res.append("\r\n}");
        return res.toString();
    }
    
    static _corrJsonValue(txt, res) {
        for (const ch of txt) {
            if (ch === '"') 
                res.append("\\\"");
            else if (ch === '\\') 
                res.append("\\\\");
            else if (ch === '/') 
                res.append("\\/");
            else if ((ch.charCodeAt(0)) === 0xD) 
                res.append("\\r");
            else if ((ch.charCodeAt(0)) === 0xA) 
                res.append("\\n");
            else if (ch === '\t') 
                res.append("\\t");
            else if ((ch.charCodeAt(0)) < 0x20) 
                res.append(' ');
            else 
                res.append(ch);
        }
    }
}


module.exports = SerializeHelper