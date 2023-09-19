/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MetaToken = require("./../MetaToken");

// Токен - строка таблицы из текста
class TableRowToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.cells = new Array();
        this.eor = false;
        this.lastRow = false;
    }
    
    toString() {
        return ("ROW (" + this.cells.length + " cells) : " + this.getSourceText());
    }
}


module.exports = TableRowToken