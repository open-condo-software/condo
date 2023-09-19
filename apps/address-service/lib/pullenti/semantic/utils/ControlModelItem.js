/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const SemanticRole = require("./../core/SemanticRole");
const ControlModelItemType = require("./ControlModelItemType");

/**
 * Элемент модели управления
 */
class ControlModelItem {
    
    constructor() {
        this.typ = ControlModelItemType.WORD;
        this.word = null;
        this.links = new Hashtable();
        this.nominativeCanBeAgentAndPacient = false;
        this.ignorable = false;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.ignorable) 
            res.append("IGNORE ");
        if (this.typ !== ControlModelItemType.WORD) 
            res.append(String(this.typ)).append(": ");
        else 
            res.append(((this.word != null ? this.word : "?"))).append(": ");
        for (const li of this.links.entries) {
            if (li.value === SemanticRole.AGENT) 
                res.append("аг:");
            else if (li.value === SemanticRole.PACIENT) 
                res.append("пац:");
            else if (li.value === SemanticRole.STRONG) 
                res.append("сильн:");
            res.append(li.key.spelling).append("? ");
        }
        return res.toString();
    }
}


module.exports = ControlModelItem