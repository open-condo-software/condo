/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const StringBuilder = require("./../unisharp/StringBuilder");

const ParamType = require("./ParamType");
const AddrLevel = require("./AddrLevel");
const AddressHelper = require("./AddressHelper");
const AddrObject = require("./AddrObject");

/**
 * Полный адрес, выделяемый из текста
 * 
 */
class TextAddress {
    
    constructor() {
        this.items = new Array();
        this.additionalItems = null;
        this.params = new Hashtable();
        this.beginChar = 0;
        this.endChar = 0;
        this.coef = 0;
        this.errorMessage = null;
        this.milliseconds = 0;
        this.readCount = 0;
        this.text = null;
    }
    
    get lastItem() {
        if (this.items.length === 0) 
            return null;
        return this.items[this.items.length - 1];
    }
    
    get lastItemWithGar() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].gars.length > 0) 
                return this.items[i];
        }
        return null;
    }
    
    /**
     * Найти элемент конкретного уровня
     * @param lev 
     * @return 
     */
    findItemByLevel(lev) {
        let res = null;
        for (const it of this.items) {
            if (it.level === lev || ((lev === AddrLevel.REGIONAREA && it.level === AddrLevel.REGIONCITY)) || ((lev === AddrLevel.REGIONCITY && it.level === AddrLevel.REGIONAREA))) {
                if (res === null || it.gars.length > 0) 
                    res = it;
            }
        }
        return res;
    }
    
    findItemByGarLevel(lev) {
        let res = null;
        for (const it of this.items) {
            if (AddressHelper.canBeEqualLevels(it.level, lev)) {
                if (res === null || it.gars.length > 0) 
                    res = it;
            }
        }
        return res;
    }
    
    findGarByIds(ids) {
        if (ids === null) 
            return null;
        for (const it of this.items) {
            if (it === null) 
                continue;
            let g = it.findGarByIds(ids);
            if (g !== null) 
                return g;
        }
        return null;
    }
    
    sortItems() {
        for (let k = 0; k < this.items.length; k++) {
            let ch = false;
            for (let i = 0; i < (this.items.length - 1); i++) {
                if (AddressHelper.compareLevels(this.items[i].level, this.items[i + 1].level) > 0) {
                    let it = this.items[i];
                    this.items[i] = this.items[i + 1];
                    this.items[i + 1] = it;
                    ch = true;
                }
            }
            if (!ch) 
                break;
        }
    }
    
    toString() {
        let res = new StringBuilder();
        res.append("Coef=").append(this.coef);
        for (let i = 0; i < this.items.length; i++) {
            res.append((i > 0 ? ", " : ": "));
            res.append(this.items[i].toString());
        }
        for (const kp of this.params.entries) {
            if (kp.key !== ParamType.ZIP) 
                res.append(", ").append(AddressHelper.getParamTypeString(kp.key)).append(" ").append((Utils.notNull(kp.value, "")));
        }
        return res.toString();
    }
    
    /**
     * Вывести полный путь
     * @param delim разделитель, пробел по умолчанию
     * @return 
     */
    getFullPath(delim = " ") {
        let tmp = new StringBuilder();
        for (let i = 0; i < this.items.length; i++) {
            if (i > 0) 
                tmp.append(delim);
            tmp.append(this.items[i].toString());
        }
        for (const kp of this.params.entries) {
            if (kp.key !== ParamType.ZIP) 
                tmp.append(delim).append(AddressHelper.getParamTypeString(kp.key)).append(" ").append((Utils.notNull(kp.value, "")));
        }
        return tmp.toString();
    }
    
    /**
     * Вывести подробную текстовую информацию об объекте (для отладки)
     * @param res 
     */
    outInfo(res) {
        res.append("Позиция в тексте: [").append(this.beginChar).append("..").append(this.endChar).append("]\r\n");
        res.append("Коэффициент качества: ").append(this.coef).append("\r\n");
        if (this.errorMessage !== null) 
            res.append("Ошибка: ").append(this.errorMessage).append("\r\n");
        for (let i = this.items.length - 1; i >= 0; i--) {
            res.append("\r\n");
            this.items[i].outInfo(res);
            if (this.additionalItems !== null && i === (this.items.length - 1)) {
                for (const it of this.additionalItems) {
                    res.append("\r\n");
                    it.outInfo(res);
                }
            }
        }
        for (const kp of this.params.entries) {
            res.append("\r\n").append(AddressHelper.getParamTypeString(kp.key)).append(": ").append((Utils.notNull(kp.value, "")));
        }
    }
    
    serialize(xml, tag = null) {
        xml.writeStartElement("textaddr");
        xml.writeElementString("coef", this.coef.toString());
        if (this.errorMessage !== null) 
            xml.writeElementString("message", this.errorMessage);
        xml.writeElementString("text", (this.text != null ? this.text : ""));
        xml.writeElementString("ms", this.milliseconds.toString());
        xml.writeElementString("rd", this.readCount.toString());
        xml.writeElementString("begin", this.beginChar.toString());
        xml.writeElementString("end", this.endChar.toString());
        for (const o of this.items) {
            o.serialize(xml);
        }
        if (this.additionalItems !== null) {
            xml.writeStartElement("additional");
            for (const it of this.additionalItems) {
                it.serialize(xml);
            }
            xml.writeEndElement();
        }
        for (const kp of this.params.entries) {
            xml.writeStartElement("param");
            xml.writeAttributeString("typ", kp.key.toString().toLowerCase());
            if (kp.value !== null) 
                xml.writeAttributeString("val", kp.value);
            xml.writeEndElement();
        }
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "coef") 
                this.coef = Utils.parseInt(x.inner_text);
            else if (x.local_name === "ms") 
                this.milliseconds = Utils.parseInt(x.inner_text);
            else if (x.local_name === "rd") 
                this.readCount = Utils.parseInt(x.inner_text);
            else if (x.local_name === "message") 
                this.errorMessage = x.inner_text;
            else if (x.local_name === "text") 
                this.text = x.inner_text;
            else if (x.local_name === "begin") 
                this.beginChar = Utils.parseInt(x.inner_text);
            else if (x.local_name === "end") 
                this.endChar = Utils.parseInt(x.inner_text);
            else if (x.local_name === "textobj") {
                let to = new AddrObject(null);
                to.deserialize(x);
                this.items.push(to);
            }
            else if (x.local_name === "additional") {
                this.additionalItems = new Array();
                for (const xx of x.child_nodes) {
                    let it = new AddrObject(null);
                    it.deserialize(xx);
                    this.additionalItems.push(it);
                }
            }
            else if (x.local_name === "param") {
                let ty = ParamType.UNDEFINED;
                let val = null;
                for (const a of x.attributes) {
                    if (a.local_name === "typ") {
                        try {
                            ty = ParamType.of(a.value);
                        } catch (ex213) {
                        }
                    }
                    else if (a.local_name === "val") 
                        val = a.value;
                }
                if (ty !== ParamType.UNDEFINED) 
                    this.params.put(ty, val);
            }
        }
    }
    
    clone() {
        let res = new TextAddress();
        for (const it of this.items) {
            res.items.push(it.clone());
        }
        if (this.additionalItems !== null) {
            res.additionalItems = new Array();
            for (const it of this.additionalItems) {
                res.additionalItems.push(it.clone());
            }
        }
        res.beginChar = this.beginChar;
        res.endChar = this.endChar;
        res.coef = this.coef;
        res.milliseconds = this.milliseconds;
        res.text = this.text;
        res.errorMessage = this.errorMessage;
        for (const kp of this.params.entries) {
            res.params.put(kp.key, kp.value);
        }
        return res;
    }
    
    static _new197(_arg1, _arg2) {
        let res = new TextAddress();
        res.errorMessage = _arg1;
        res.text = _arg2;
        return res;
    }
}


module.exports = TextAddress