/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


/**
 * Приходится работать через обёртку, так как ориентируемся на все платформы и языки
 */
class ImageWrapper {
    
    constructor() {
        this.id = null;
        this.content = null;
        this.image = null;
    }
    
    static _new2944(_arg1, _arg2) {
        let res = new ImageWrapper();
        res.id = _arg1;
        res.content = _arg2;
        return res;
    }
}


module.exports = ImageWrapper