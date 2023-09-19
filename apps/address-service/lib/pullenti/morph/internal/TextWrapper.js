/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const UnicodeInfo = require("./UnicodeInfo");

// Введено для ускорения Питона!
class TextWrapper {
    
    constructor(txt, toUpper) {
        this.chars = new Array();
        this.text = null;
        this.length = 0;
        if (toUpper && txt !== null) 
            this.text = txt.toUpperCase();
        else 
            this.text = txt;
        this.length = (txt === null ? 0 : txt.length);
        if (txt !== null) {
            for (let i = 0; i < txt.length; i++) {
                this.chars.push(UnicodeInfo.getChar(txt[i]));
            }
        }
    }
    
    toString() {
        return this.text.toString();
    }
}


module.exports = TextWrapper