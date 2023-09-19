/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const TextToken = require("./../TextToken");
const Referent = require("./../Referent");
const IntOntologyItem = require("./../core/IntOntologyItem");
const Termin = require("./../core/Termin");
const ReferentClass = require("./../metadata/ReferentClass");
const NumberToken = require("./../NumberToken");
const MetaDenom = require("./internal/MetaDenom");

/**
 * Сущность, моделирующая буквенно-цифровые комбинации (например, Си++, СС-300)
 * 
 */
class DenominationReferent extends Referent {
    
    constructor() {
        super(DenominationReferent.OBJ_TYPENAME);
        this.m_Names = null;
        this.instanceOf = MetaDenom.globalMeta;
    }
    
    get value() {
        return this.getStringValue(DenominationReferent.ATTR_VALUE);
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        return Utils.notNull(this.value, "?");
    }
    
    addValue(begin, end) {
        let tmp = new StringBuilder();
        for (let t = begin; t !== null && t.previous !== end; t = t.next) {
            if (t instanceof NumberToken) {
                tmp.append(t.getSourceText());
                continue;
            }
            if (t instanceof TextToken) {
                let s = t.term;
                if (t.isCharOf("-\\/")) 
                    s = "-";
                tmp.append(s);
            }
        }
        for (let i = 0; i < tmp.length; i++) {
            if (tmp.charAt(i) === '-' && i > 0 && ((i + 1) < tmp.length)) {
                let ch0 = tmp.charAt(i - 1);
                let ch1 = tmp.charAt(i + 1);
                if (Utils.isLetterOrDigit(ch0) && Utils.isLetterOrDigit(ch1)) {
                    if (Utils.isDigit(ch0) && !Utils.isDigit(ch1)) 
                        tmp.remove(i, 1);
                    else if (!Utils.isDigit(ch0) && Utils.isDigit(ch1)) 
                        tmp.remove(i, 1);
                }
            }
        }
        this.addSlot(DenominationReferent.ATTR_VALUE, tmp.toString(), false, 0);
        this.m_Names = null;
    }
    
    canBeEquals(obj, typ) {
        let dr = Utils.as(obj, DenominationReferent);
        if (dr === null) 
            return false;
        for (const n of this.nameVars) {
            if (dr.nameVars.includes(n)) 
                return true;
        }
        return false;
    }
    
    get nameVars() {
        if (this.m_Names !== null) 
            return this.m_Names;
        this.m_Names = new Array();
        let nam = this.value;
        if (nam === null) 
            return this.m_Names;
        this.m_Names.push(nam);
        let items = new Array();
        let i = 0;
        let ty0 = 0;
        let i0 = 0;
        for (i = 0; i <= nam.length; i++) {
            let ty = 0;
            if (i < nam.length) {
                if (Utils.isDigit(nam[i])) 
                    ty = 1;
                else if (Utils.isLetter(nam[i])) 
                    ty = 2;
                else 
                    ty = 3;
            }
            if (ty !== ty0 || ty === 3) {
                if (i > i0) {
                    let vars = new Array();
                    let p = nam.substring(i0, i0 + i - i0);
                    DenominationReferent.addVars(p, vars);
                    items.push(vars);
                    if (ty === 1 && ty0 === 2) {
                        vars = new Array();
                        vars.push("");
                        vars.push("-");
                        items.push(vars);
                    }
                }
                i0 = i;
                ty0 = ty;
            }
        }
        let inds = new Int32Array(items.length);
        for (i = 0; i < inds.length; i++) {
            inds[i] = 0;
        }
        let tmp = new StringBuilder();
        while (true) {
            tmp.length = 0;
            for (i = 0; i < items.length; i++) {
                tmp.append(items[i][inds[i]]);
            }
            let v = tmp.toString();
            if (!this.m_Names.includes(v)) 
                this.m_Names.push(v);
            if (this.m_Names.length > 20) 
                break;
            for (i = inds.length - 1; i >= 0; i--) {
                inds[i]++;
                if (inds[i] < items[i].length) 
                    break;
            }
            if (i < 0) 
                break;
            for (++i; i < inds.length; i++) {
                inds[i] = 0;
            }
        }
        return this.m_Names;
    }
    
    static addVars(str, vars) {
        vars.push(str);
        for (let k = 0; k < 2; k++) {
            let i = 0;
            let tmp = new StringBuilder();
            for (i = 0; i < str.length; i++) {
                let v = null;
                let wrapv1181 = new RefOutArgWrapper();
                let inoutres1182 = DenominationReferent.m_VarChars.tryGetValue(str[i], wrapv1181);
                v = wrapv1181.value;
                if (!inoutres1182) 
                    break;
                if ((v.length < 2) || v[k] === '-') 
                    break;
                tmp.append(v[k]);
            }
            if (i >= str.length) {
                let v = tmp.toString();
                if (!vars.includes(v)) 
                    vars.push(v);
            }
        }
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        for (const v of this.nameVars) {
            oi.termins.push(new Termin(v));
        }
        return oi;
    }
    
    static static_constructor() {
        DenominationReferent.OBJ_TYPENAME = "DENOMINATION";
        DenominationReferent.ATTR_VALUE = "VALUE";
        DenominationReferent.m_VarChars = null;
        DenominationReferent.m_VarChars = new Hashtable();
        DenominationReferent.m_VarChars.put('A', "АА");
        DenominationReferent.m_VarChars.put('B', "БВ");
        DenominationReferent.m_VarChars.put('C', "ЦС");
        DenominationReferent.m_VarChars.put('D', "ДД");
        DenominationReferent.m_VarChars.put('E', "ЕЕ");
        DenominationReferent.m_VarChars.put('F', "Ф-");
        DenominationReferent.m_VarChars.put('G', "Г-");
        DenominationReferent.m_VarChars.put('H', "ХН");
        DenominationReferent.m_VarChars.put('I', "И-");
        DenominationReferent.m_VarChars.put('J', "Ж-");
        DenominationReferent.m_VarChars.put('K', "КК");
        DenominationReferent.m_VarChars.put('L', "Л-");
        DenominationReferent.m_VarChars.put('M', "ММ");
        DenominationReferent.m_VarChars.put('N', "Н-");
        DenominationReferent.m_VarChars.put('O', "ОО");
        DenominationReferent.m_VarChars.put('P', "ПР");
        DenominationReferent.m_VarChars.put('Q', "--");
        DenominationReferent.m_VarChars.put('R', "Р-");
        DenominationReferent.m_VarChars.put('S', "С-");
        DenominationReferent.m_VarChars.put('T', "ТТ");
        DenominationReferent.m_VarChars.put('U', "У-");
        DenominationReferent.m_VarChars.put('V', "В-");
        DenominationReferent.m_VarChars.put('W', "В-");
        DenominationReferent.m_VarChars.put('X', "ХХ");
        DenominationReferent.m_VarChars.put('Y', "УУ");
        DenominationReferent.m_VarChars.put('Z', "З-");
        DenominationReferent.m_VarChars.put('А', "AA");
        DenominationReferent.m_VarChars.put('Б', "B-");
        DenominationReferent.m_VarChars.put('В', "VB");
        DenominationReferent.m_VarChars.put('Г', "G-");
        DenominationReferent.m_VarChars.put('Д', "D-");
        DenominationReferent.m_VarChars.put('Е', "EE");
        DenominationReferent.m_VarChars.put('Ж', "J-");
        DenominationReferent.m_VarChars.put('З', "Z-");
        DenominationReferent.m_VarChars.put('И', "I-");
        DenominationReferent.m_VarChars.put('Й', "Y-");
        DenominationReferent.m_VarChars.put('К', "KK");
        DenominationReferent.m_VarChars.put('Л', "L-");
        DenominationReferent.m_VarChars.put('М', "MM");
        DenominationReferent.m_VarChars.put('Н', "NH");
        DenominationReferent.m_VarChars.put('О', "OO");
        DenominationReferent.m_VarChars.put('П', "P-");
        DenominationReferent.m_VarChars.put('Р', "RP");
        DenominationReferent.m_VarChars.put('С', "SC");
        DenominationReferent.m_VarChars.put('Т', "TT");
        DenominationReferent.m_VarChars.put('У', "UY");
        DenominationReferent.m_VarChars.put('Ф', "F-");
        DenominationReferent.m_VarChars.put('Х', "HX");
        DenominationReferent.m_VarChars.put('Ц', "C-");
        DenominationReferent.m_VarChars.put('Ч', "--");
        DenominationReferent.m_VarChars.put('Ш', "--");
        DenominationReferent.m_VarChars.put('Щ', "--");
        DenominationReferent.m_VarChars.put('Ы', "--");
        DenominationReferent.m_VarChars.put('Э', "A-");
        DenominationReferent.m_VarChars.put('Ю', "U-");
        DenominationReferent.m_VarChars.put('Я', "--");
    }
}


DenominationReferent.static_constructor();

module.exports = DenominationReferent