/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MetaToken = require("./../MetaToken");

// Это привязка элемента внутренней отнологии к тексту
class IntOntologyToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.item = null;
        this.termin = null;
    }
    
    static _new794(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new IntOntologyToken(_arg1, _arg2);
        res.item = _arg3;
        res.termin = _arg4;
        res.morph = _arg5;
        return res;
    }
}


module.exports = IntOntologyToken