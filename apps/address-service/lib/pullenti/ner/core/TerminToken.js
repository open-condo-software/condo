/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MetaToken = require("./../MetaToken");

/**
 * Метатокен - результат привязки термина Termin словаря TerminCollection. Формируется методом TryParse или TryParseAll у TerminCollection.
 * Токен привязки к словарю
 */
class TerminToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.termin = null;
        this.abridgeWithoutPoint = false;
    }
    
    static _new712(_arg1, _arg2, _arg3) {
        let res = new TerminToken(_arg1, _arg2);
        res.termin = _arg3;
        return res;
    }
    
    static _new885(_arg1, _arg2, _arg3) {
        let res = new TerminToken(_arg1, _arg2);
        res.abridgeWithoutPoint = _arg3;
        return res;
    }
    
    static _new893(_arg1, _arg2, _arg3) {
        let res = new TerminToken(_arg1, _arg2);
        res.morph = _arg3;
        return res;
    }
    
    static _new899(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerminToken(_arg1, _arg2);
        res.morph = _arg3;
        res.termin = _arg4;
        return res;
    }
}


module.exports = TerminToken