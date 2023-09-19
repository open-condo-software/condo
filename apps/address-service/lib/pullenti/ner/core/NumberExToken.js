/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const NumberToken = require("./../NumberToken");
const NumberExType = require("./NumberExType");

// Число с стандартный постфиксом (мерой длины, вес, деньги и т.п.)
// Устарело, вместо этого лучше использовать MeasureReferent или NumbersWithUnitToken
class NumberExToken extends NumberToken {
    
    constructor(begin, end, val, _typ, _exTyp = NumberExType.UNDEFINED) {
        super(begin, end, val, _typ, null);
        this.altRealValue = 0;
        this.altRestMoney = 0;
        this.exTyp = NumberExType.UNDEFINED;
        this.exTyp2 = NumberExType.UNDEFINED;
        this.exTypParam = null;
        this.multAfter = false;
        this.exTyp = _exTyp;
    }
    
    normalizeValue(ty) {
        let val = this.realValue;
        let ety = this.exTyp;
        if (ty.value === ety) 
            return val;
        if (this.exTyp2 !== NumberExType.UNDEFINED) 
            return val;
        if (ty.value === NumberExType.GRAMM) {
            if (this.exTyp === NumberExType.KILOGRAM) {
                val *= (1000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.MILLIGRAM) {
                val /= (1000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.TONNA) {
                val *= (1000000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.KILOGRAM) {
            if (this.exTyp === NumberExType.GRAMM) {
                val /= (1000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.TONNA) {
                val *= (1000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.TONNA) {
            if (this.exTyp === NumberExType.KILOGRAM) {
                val /= (1000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.GRAMM) {
                val /= (1000000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.MILLIMETER) {
            if (this.exTyp === NumberExType.SANTIMETER) {
                val *= (10);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.METER) {
                val *= (1000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.SANTIMETER) {
            if (this.exTyp === NumberExType.MILLIMETER) {
                val *= (10);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.METER) {
                val *= (100);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.METER) {
            if (this.exTyp === NumberExType.KILOMETER) {
                val *= (1000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.LITR) {
            if (this.exTyp === NumberExType.MILLILITR) {
                val /= (1000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.MILLILITR) {
            if (this.exTyp === NumberExType.LITR) {
                val *= (1000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.GEKTAR) {
            if (this.exTyp === NumberExType.METER2) {
                val /= (10000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.AR) {
                val /= (100);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.KILOMETER2) {
                val *= (100);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.KILOMETER2) {
            if (this.exTyp === NumberExType.GEKTAR) {
                val /= (100);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.AR) {
                val /= (10000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.METER2) {
                val /= (1000000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.METER2) {
            if (this.exTyp === NumberExType.AR) {
                val *= (100);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.GEKTAR) {
                val *= (10000);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.KILOMETER2) {
                val *= (1000000);
                ety = ty.value;
            }
        }
        else if (ty.value === NumberExType.DAY) {
            if (this.exTyp === NumberExType.YEAR) {
                val *= (365);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.MONTH) {
                val *= (30);
                ety = ty.value;
            }
            else if (this.exTyp === NumberExType.WEEK) {
                val *= (7);
                ety = ty.value;
            }
        }
        ty.value = ety;
        return val;
    }
    
    static exTypToString(ty, ty2 = NumberExType.UNDEFINED) {
        const NumberExHelper = require("./internal/NumberExHelper");
        if (ty2 !== NumberExType.UNDEFINED) 
            return (NumberExToken.exTypToString(ty, NumberExType.UNDEFINED) + "/" + NumberExToken.exTypToString(ty2, NumberExType.UNDEFINED));
        let res = null;
        let wrapres811 = new RefOutArgWrapper();
        let inoutres812 = NumberExHelper.m_NormalsTyps.tryGetValue(ty, wrapres811);
        res = wrapres811.value;
        if (inoutres812) 
            return res;
        return "?";
    }
    
    toString() {
        return (String(this.realValue) + ((this.exTypParam != null ? this.exTypParam : NumberExToken.exTypToString(this.exTyp, this.exTyp2))));
    }
    
    static _new708(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.altRealValue = _arg6;
        res.morph = _arg7;
        return res;
    }
    
    static _new709(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.morph = _arg6;
        return res;
    }
    
    static _new710(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        res.altRealValue = _arg7;
        res.morph = _arg8;
        return res;
    }
    
    static _new711(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        res.altRealValue = _arg7;
        res.exTypParam = _arg8;
        return res;
    }
    
    static _new713(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8, _arg9) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        res.altRealValue = _arg7;
        res.morph = _arg8;
        res.exTypParam = _arg9;
        return res;
    }
    
    static _new715(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8, _arg9) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        res.altRealValue = _arg7;
        res.exTyp2 = _arg8;
        res.exTypParam = _arg9;
        return res;
    }
    
    static _new716(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        res.altRealValue = _arg7;
        res.multAfter = _arg8;
        return res;
    }
    
    static _new717(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.tag = _arg6;
        return res;
    }
    
    static _new718(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.exTypParam = _arg6;
        return res;
    }
    
    static _new834(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new NumberExToken(_arg1, _arg2, _arg3, _arg4, _arg5);
        res.realValue = _arg6;
        return res;
    }
}


module.exports = NumberExToken