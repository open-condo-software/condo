/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const MetaToken = require("./../MetaToken");
const TableCellToken = require("./TableCellToken");
const TableHelperTableTypes = require("./TableHelperTableTypes");
const TableRowToken = require("./TableRowToken");

// Поддержка работы с таблицами, расположенными в текстах.
// Начало таблицы - символ 1Eh, конец - 1Fh, ячейки оканчиваются 07h,
// комбинация 0D 0A 07 - конец строки.
// Данную структуру формирует функция извлечения текстов (ExtractText), так что это - для
// обратного восстановления таблицы в случае необходимости.
class TableHelper {
    
    static tryParseRows(t, maxChar, mustBeStartOfTable) {
        if (t === null) 
            return null;
        let isTab = false;
        if (mustBeStartOfTable) {
            if (!t.isChar(String.fromCharCode(0x1E))) 
                return null;
            isTab = true;
        }
        let wrapisTab880 = new RefOutArgWrapper(isTab);
        let rw = TableHelper.parse(t, maxChar, null, wrapisTab880);
        isTab = wrapisTab880.value;
        if (rw === null) 
            return null;
        let res = new Array();
        res.push(rw);
        for (t = rw.endToken.next; t !== null; t = t.next) {
            let wrapisTab879 = new RefOutArgWrapper(isTab);
            let rw0 = TableHelper.parse(t, maxChar, rw, wrapisTab879);
            isTab = wrapisTab879.value;
            if (rw0 === null) 
                break;
            res.push((rw = rw0));
            t = rw0.endToken;
            if (rw0.lastRow) 
                break;
        }
        let rla = res[res.length - 1];
        if (((rla.lastRow && rla.cells.length === 2 && rla.cells[0].colSpan === 1) && rla.cells[0].rowSpan === 1 && rla.cells[1].colSpan === 1) && rla.cells[1].rowSpan === 1) {
            let lines0 = rla.cells[0].lines;
            let lines1 = rla.cells[1].lines;
            if (lines0.length > 2 && lines1.length === lines0.length) {
                for (let ii = 0; ii < lines0.length; ii++) {
                    rw = new TableRowToken((ii === 0 ? lines0[ii].beginToken : lines1[ii].beginToken), (ii === 0 ? lines0[ii].endToken : lines1[ii].endToken));
                    rw.cells.push(lines0[ii]);
                    rw.cells.push(lines1[ii]);
                    rw.eor = rla.eor;
                    if (ii === (lines0.length - 1)) {
                        rw.lastRow = rla.lastRow;
                        rw.endToken = rla.endToken;
                    }
                    res.push(rw);
                }
                Utils.removeItem(res, rla);
            }
        }
        for (const re of res) {
            if (re.cells.length > 1) 
                return res;
            if (re.cells.length === 1) {
                if (TableHelper._containsTableChar(re.cells[0])) 
                    return res;
            }
        }
        return null;
    }
    
    static _containsTableChar(mt) {
        for (let tt = mt.beginToken; tt !== null && tt.endChar <= mt.endChar; tt = tt.next) {
            if (tt instanceof MetaToken) {
                if (TableHelper._containsTableChar(Utils.as(tt, MetaToken))) 
                    return true;
            }
            else if (((tt.isTableControlChar && tt.previous !== null && !tt.previous.isTableControlChar) && tt.next !== null && !tt.next.isTableControlChar) && tt.previous.beginChar >= mt.beginChar && tt.next.endChar <= mt.endChar) 
                return true;
        }
        return false;
    }
    
    static parse(t, maxChar, prev, isTab) {
        if (t === null || ((t.endChar > maxChar && maxChar > 0))) 
            return null;
        let txt = t.kit.sofa.text;
        let t0 = t;
        if (t.isChar(String.fromCharCode(0x1E)) && t.next !== null) {
            isTab.value = true;
            t = t.next;
        }
        let tt = null;
        let cellInfo = null;
        for (tt = t; tt !== null && ((tt.endChar <= maxChar || maxChar === 0)); tt = tt.next) {
            if (tt.isTableControlChar) {
                cellInfo = new TableHelper.TableInfo(tt);
                if (cellInfo.typ !== TableHelperTableTypes.CELLEND) 
                    cellInfo = null;
                break;
            }
            else if (tt.isNewlineAfter) {
                if (!isTab.value && prev === null) 
                    break;
                if ((tt.endChar - t.beginChar) > 100) {
                    if ((tt.endChar - t.beginChar) > 10000) 
                        break;
                    if (!isTab.value) 
                        break;
                }
                if (tt.whitespacesAfterCount > 15) {
                    if (!isTab.value) 
                        break;
                }
            }
        }
        if (cellInfo === null) 
            return null;
        let res = new TableRowToken(t0, tt);
        res.cells.push(TableCellToken._new881(t, tt, cellInfo.rowSpan, cellInfo.colSpan));
        for (tt = tt.next; tt !== null && ((tt.endChar <= maxChar || maxChar === 0)); tt = tt.next) {
            t0 = tt;
            cellInfo = null;
            for (; tt !== null && ((tt.endChar <= maxChar || maxChar === 0)); tt = tt.next) {
                if (tt.isTableControlChar) {
                    cellInfo = new TableHelper.TableInfo(tt);
                    break;
                }
                else if (tt.isNewlineAfter) {
                    if (!isTab.value && prev === null) 
                        break;
                    if ((tt.endChar - t0.beginChar) > 400) {
                        if ((tt.endChar - t0.beginChar) > 20000) 
                            break;
                        if (!isTab.value) 
                            break;
                    }
                    if (tt.whitespacesAfterCount > 15) {
                        if (!isTab.value) 
                            break;
                    }
                }
            }
            if (cellInfo === null) 
                break;
            if (cellInfo.typ === TableHelperTableTypes.ROWEND) {
                if (tt !== t0) 
                    res.cells.push(TableCellToken._new881(t0, tt, cellInfo.rowSpan, cellInfo.colSpan));
                res.endToken = tt;
                res.eor = true;
                break;
            }
            if (cellInfo.typ !== TableHelperTableTypes.CELLEND) 
                break;
            res.cells.push(TableCellToken._new881(t0, tt, cellInfo.rowSpan, cellInfo.colSpan));
            res.endToken = tt;
        }
        if ((res.cells.length < 2) && !res.eor) 
            return null;
        if (res.endToken.next !== null && res.endToken.next.isChar(String.fromCharCode(0x1F))) {
            res.lastRow = true;
            res.endToken = res.endToken.next;
        }
        return res;
    }
    
    static isCellEnd(t) {
        if (t !== null && t.isChar(String.fromCharCode(7))) 
            return true;
        return false;
    }
    
    static isRowEnd(t) {
        if (t === null || !t.isChar(String.fromCharCode(7))) 
            return false;
        let ti = new TableHelper.TableInfo(t);
        return ti.typ === TableHelperTableTypes.ROWEND;
    }
}


TableHelper.TableInfo = class  {
    
    toString() {
        return (String(this.typ) + " (" + this.colSpan + "-" + this.rowSpan + ")");
    }
    
    constructor(t) {
        const TableHelperTableTypes = require("./TableHelperTableTypes");
        this.colSpan = 0;
        this.rowSpan = 0;
        this.typ = TableHelperTableTypes.UNDEFINED;
        this.src = null;
        this.src = t;
        if (t === null) 
            return;
        if (t.isChar(String.fromCharCode(0x1E))) {
            this.typ = TableHelperTableTypes.TABLESTART;
            return;
        }
        if (t.isChar(String.fromCharCode(0x1F))) {
            this.typ = TableHelperTableTypes.TABLEEND;
            return;
        }
        if (!t.isChar(String.fromCharCode(7))) 
            return;
        let txt = t.kit.sofa.text;
        this.typ = TableHelperTableTypes.CELLEND;
        let p = t.beginChar - 1;
        if (p < 0) 
            return;
        if ((txt.charCodeAt(p)) === 0xD || (txt.charCodeAt(p)) === 0xA) {
            this.typ = TableHelperTableTypes.ROWEND;
            return;
        }
        this.colSpan = (this.rowSpan = 1);
        for (; p >= 0; p--) {
            if (!Utils.isWhitespace(txt[p])) 
                break;
            else if (txt[p] === '\t') 
                this.colSpan++;
            else if (txt[p] === '\f') 
                this.rowSpan++;
        }
    }
}


module.exports = TableHelper