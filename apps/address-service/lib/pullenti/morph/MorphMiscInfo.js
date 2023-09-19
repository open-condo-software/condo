/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphMood = require("./MorphMood");
const MorphVoice = require("./MorphVoice");
const MorphForm = require("./MorphForm");
const MorphPerson = require("./MorphPerson");
const MorphTense = require("./MorphTense");
const MorphAspect = require("./MorphAspect");

/**
 * Дополнительная морфологическая информация
 * Дополнительная морф.информация
 */
class MorphMiscInfo {
    
    constructor() {
        this.m_Attrs = new Array();
        this.value = 0;
        this.id = 0;
    }
    
    get attrs() {
        return this.m_Attrs;
    }
    
    addAttr(a) {
        if (!this.m_Attrs.includes(a)) 
            this.m_Attrs.push(a);
    }
    
    getBoolValue(i) {
        return (((((this.value) >> i)) & 1)) !== 0;
    }
    
    setBoolValue(i, val) {
        if (val) 
            this.value |= (1 << i);
        else 
            this.value &= (~(1 << i));
    }
    
    copyFrom(src) {
        this.value = src.value;
        for (const a of src.attrs) {
            this.m_Attrs.push(a);
        }
    }
    
    get person() {
        let res = MorphPerson.UNDEFINED;
        if (this.m_Attrs.includes("1 л.")) 
            res = MorphPerson.of((res.value()) | (MorphPerson.FIRST.value()));
        if (this.m_Attrs.includes("2 л.")) 
            res = MorphPerson.of((res.value()) | (MorphPerson.SECOND.value()));
        if (this.m_Attrs.includes("3 л.")) 
            res = MorphPerson.of((res.value()) | (MorphPerson.THIRD.value()));
        return res;
    }
    set person(_value) {
        if (((_value.value()) & (MorphPerson.FIRST.value())) !== (MorphPerson.UNDEFINED.value())) 
            this.addAttr("1 л.");
        if (((_value.value()) & (MorphPerson.SECOND.value())) !== (MorphPerson.UNDEFINED.value())) 
            this.addAttr("2 л.");
        if (((_value.value()) & (MorphPerson.THIRD.value())) !== (MorphPerson.UNDEFINED.value())) 
            this.addAttr("3 л.");
        return _value;
    }
    
    get tense() {
        if (this.m_Attrs.includes("п.вр.")) 
            return MorphTense.PAST;
        if (this.m_Attrs.includes("н.вр.")) 
            return MorphTense.PRESENT;
        if (this.m_Attrs.includes("б.вр.")) 
            return MorphTense.FUTURE;
        return MorphTense.UNDEFINED;
    }
    set tense(_value) {
        if (_value === MorphTense.PAST) 
            this.addAttr("п.вр.");
        if (_value === MorphTense.PRESENT) 
            this.addAttr("н.вр.");
        if (_value === MorphTense.FUTURE) 
            this.addAttr("б.вр.");
        return _value;
    }
    
    get aspect() {
        if (this.m_Attrs.includes("нес.в.")) 
            return MorphAspect.IMPERFECTIVE;
        if (this.m_Attrs.includes("сов.в.")) 
            return MorphAspect.PERFECTIVE;
        return MorphAspect.UNDEFINED;
    }
    set aspect(_value) {
        if (_value === MorphAspect.IMPERFECTIVE) 
            this.addAttr("нес.в.");
        if (_value === MorphAspect.PERFECTIVE) 
            this.addAttr("сов.в.");
        return _value;
    }
    
    get mood() {
        if (this.m_Attrs.includes("пов.накл.")) 
            return MorphMood.IMPERATIVE;
        return MorphMood.UNDEFINED;
    }
    set mood(_value) {
        if (_value === MorphMood.IMPERATIVE) 
            this.addAttr("пов.накл.");
        return _value;
    }
    
    get voice() {
        if (this.m_Attrs.includes("дейст.з.")) 
            return MorphVoice.ACTIVE;
        if (this.m_Attrs.includes("страд.з.")) 
            return MorphVoice.PASSIVE;
        return MorphVoice.UNDEFINED;
    }
    set voice(_value) {
        if (_value === MorphVoice.ACTIVE) 
            this.addAttr("дейст.з.");
        if (_value === MorphVoice.PASSIVE) 
            this.addAttr("страд.з.");
        return _value;
    }
    
    get form() {
        if (this.m_Attrs.includes("к.ф.")) 
            return MorphForm.SHORT;
        if (this.m_Attrs.includes("синоним.форма")) 
            return MorphForm.SYNONYM;
        if (this.isSynonymForm) 
            return MorphForm.SYNONYM;
        return MorphForm.UNDEFINED;
    }
    
    get isSynonymForm() {
        return this.getBoolValue(0);
    }
    set isSynonymForm(_value) {
        this.setBoolValue(0, _value);
        return _value;
    }
    
    toString() {
        if (this.m_Attrs.length === 0 && this.value === (0)) 
            return "";
        let res = new StringBuilder();
        if (this.isSynonymForm) 
            res.append("синоним.форма ");
        for (let i = 0; i < this.m_Attrs.length; i++) {
            res.append(this.m_Attrs[i]).append(" ");
        }
        return Utils.trimEndString(res.toString());
    }
    
    deserialize(str, pos) {
        let sh = str.deserializeShort(pos);
        this.value = sh;
        while (true) {
            let s = str.deserializeString(pos);
            if (Utils.isNullOrEmpty(s)) 
                break;
            if (!this.m_Attrs.includes(s)) 
                this.m_Attrs.push(s);
        }
    }
}


module.exports = MorphMiscInfo