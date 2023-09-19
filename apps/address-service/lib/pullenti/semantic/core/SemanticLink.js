/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const SemanticRole = require("./SemanticRole");

/**
 * Семантическая связь двух элементов
 * Семантическая связь
 */
class SemanticLink {
    
    constructor() {
        this.master = null;
        this.slave = null;
        this.question = null;
        this.role = SemanticRole.COMMON;
        this.isPassive = false;
        this.rank = 0;
        this.modelled = false;
        this.idiom = false;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.modelled) 
            res.append("?");
        if (this.idiom) 
            res.append("!");
        if (this.role !== SemanticRole.COMMON) 
            res.append(String(this.role)).append(": ");
        if (this.isPassive) 
            res.append("Passive ");
        if (this.rank > 0) 
            res.append(this.rank).append(" ");
        if (this.question !== null) 
            res.append(this.question.spellingEx).append("? ");
        res.append("[").append((this.master === null ? "?" : this.master.toString())).append("] <- [").append((this.slave === null ? "?" : this.slave.toString())).append("]");
        return res.toString();
    }
    
    compareTo(other) {
        if (this.rank > other.rank) 
            return -1;
        if (this.rank < other.rank) 
            return 1;
        return 0;
    }
    
    static _new2967(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new SemanticLink();
        res.modelled = _arg1;
        res.master = _arg2;
        res.slave = _arg3;
        res.rank = _arg4;
        res.question = _arg5;
        return res;
    }
    
    static _new2968(_arg1, _arg2, _arg3, _arg4) {
        let res = new SemanticLink();
        res.role = _arg1;
        res.master = _arg2;
        res.slave = _arg3;
        res.rank = _arg4;
        return res;
    }
    
    static _new2969(_arg1, _arg2) {
        let res = new SemanticLink();
        res.rank = _arg1;
        res.question = _arg2;
        return res;
    }
    
    static _new2970(_arg1, _arg2, _arg3) {
        let res = new SemanticLink();
        res.question = _arg1;
        res.role = _arg2;
        res.idiom = _arg3;
        return res;
    }
    
    static _new2971(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new SemanticLink();
        res.modelled = _arg1;
        res.role = _arg2;
        res.rank = _arg3;
        res.question = _arg4;
        res.isPassive = _arg5;
        return res;
    }
    
    static _new2972(_arg1, _arg2, _arg3, _arg4) {
        let res = new SemanticLink();
        res.role = _arg1;
        res.rank = _arg2;
        res.question = _arg3;
        res.isPassive = _arg4;
        return res;
    }
    
    static _new2973(_arg1, _arg2, _arg3) {
        let res = new SemanticLink();
        res.role = _arg1;
        res.rank = _arg2;
        res.question = _arg3;
        return res;
    }
    
    static _new2976(_arg1, _arg2, _arg3) {
        let res = new SemanticLink();
        res.question = _arg1;
        res.rank = _arg2;
        res.role = _arg3;
        return res;
    }
    
    static _new2977(_arg1, _arg2, _arg3, _arg4) {
        let res = new SemanticLink();
        res.modelled = _arg1;
        res.role = _arg2;
        res.rank = _arg3;
        res.question = _arg4;
        return res;
    }
    
    static _new2978(_arg1, _arg2, _arg3) {
        let res = new SemanticLink();
        res.role = _arg1;
        res.question = _arg2;
        res.idiom = _arg3;
        return res;
    }
}


module.exports = SemanticLink