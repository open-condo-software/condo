/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const DateExTokenDateExItemTokenType = require("./DateExTokenDateExItemTokenType");
const DatePointerType = require("./../DatePointerType");
const ProcessorService = require("./../../ProcessorService");
const ReferentToken = require("./../../ReferentToken");
const Referent = require("./../../Referent");
const DateReferent = require("./../DateReferent");
const DateRangeReferent = require("./../DateRangeReferent");
const DateExToken = require("./DateExToken");

class DateRelHelper {
    
    static createReferents(et) {
        if (!et.isDiap || et.itemsTo.length === 0) {
            let li = DateRelHelper._createRefs(et.itemsFrom);
            if (li === null || li.length === 0) 
                return null;
            return li;
        }
        let liFr = DateRelHelper._createRefs(et.itemsFrom);
        let liTo = DateRelHelper._createRefs(et.itemsTo);
        let ra = new DateRangeReferent();
        if (liFr.length > 0) 
            ra.dateFrom = Utils.as(liFr[0].tag, DateReferent);
        if (liTo.length > 0) 
            ra.dateTo = Utils.as(liTo[0].tag, DateReferent);
        let res = new Array();
        res.splice(res.length, 0, ...liFr);
        res.splice(res.length, 0, ...liTo);
        res.push(new ReferentToken(ra, et.beginToken, et.endToken));
        if (res.length === 0) 
            return null;
        res[0].tag = ra;
        return res;
    }
    
    static _createRefs(its) {
        let res = new Array();
        let own = null;
        for (let i = 0; i < its.length; i++) {
            let it = its[i];
            let d = new DateReferent();
            if (it.isValueRelate) 
                d.isRelative = true;
            if (own !== null) 
                d.higher = own;
            if (it.typ === DateExTokenDateExItemTokenType.DAY) {
                d.day = it.value;
                if (it.isLast && ((it.value === 0 || it.value === -1)) && i > 0) {
                    let it0 = its[i - 1];
                    let day = 0;
                    if (it0.typ === DateExTokenDateExItemTokenType.MONTH && !it0.isValueRelate) {
                        let m = d.month;
                        if (((m === 1 || m === 3 || m === 5) || m === 7 || m === 8) || m === 10 || m === 12) 
                            day = 31;
                        else if (m === 2) 
                            day = 28;
                        else if (m > 0) 
                            day = 30;
                    }
                    else if (it0.typ === DateExTokenDateExItemTokenType.QUARTAL && !it0.isValueRelate) {
                        let m = 1 + (((it0.value - 1)) * 4);
                        let dm = new DateReferent();
                        dm.month = m;
                        if (own !== null) 
                            dm.higher = own;
                        res.push(new ReferentToken(dm, it.beginToken, it.endToken));
                        own = d.higher = dm;
                        if (((m === 1 || m === 3 || m === 5) || m === 7 || m === 8) || m === 10 || m === 12) 
                            day = 31;
                        else if (m === 2) 
                            day = 28;
                        else if (m > 0) 
                            day = 30;
                    }
                    else if (it0.typ === DateExTokenDateExItemTokenType.YEAR) {
                        let dm = new DateReferent();
                        dm.month = 12;
                        if (own !== null) 
                            dm.higher = own;
                        res.push(new ReferentToken(dm, it.beginToken, it.endToken));
                        own = d.higher = dm;
                        day = 31;
                    }
                    else if (it0.typ === DateExTokenDateExItemTokenType.CENTURY) {
                        let dy = new DateReferent();
                        dy.year = 99;
                        dy.isRelative = true;
                        if (own !== null) 
                            dy.higher = own;
                        res.push(new ReferentToken(dy, it.beginToken, it.endToken));
                        own = dy;
                        let dm = new DateReferent();
                        dm.month = 12;
                        dm.higher = own;
                        res.push(new ReferentToken(dm, it.beginToken, it.endToken));
                        own = d.higher = dm;
                        day = 31;
                    }
                    if ((day + it.value) > 0) {
                        d.isRelative = false;
                        d.day = day + it.value;
                    }
                }
            }
            else if (it.typ === DateExTokenDateExItemTokenType.DAYOFWEEK) 
                d.dayOfWeek = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.HOUR) {
                d.hour = it.value;
                if (((i + 1) < its.length) && its[i + 1].typ === DateExTokenDateExItemTokenType.MINUTE && !its[i + 1].isValueRelate) {
                    d.minute = its[i + 1].value;
                    i++;
                }
            }
            else if (it.typ === DateExTokenDateExItemTokenType.MINUTE) 
                d.minute = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.MONTH) {
                d.month = it.value;
                if (it.isLast && ((it.value === 0 || it.value === -1)) && i > 0) {
                    let it0 = its[i - 1];
                    let m = 0;
                    if (it0.typ === DateExTokenDateExItemTokenType.QUARTAL && !it0.isValueRelate) 
                        m = 1 + (((it0.value - 1)) * 4) + it.value;
                    else if (it0.typ === DateExTokenDateExItemTokenType.YEAR || it0.typ === DateExTokenDateExItemTokenType.DECADE || it0.typ === DateExTokenDateExItemTokenType.CENTURY) 
                        m = 12 + it.value;
                    if (m > 0) {
                        d.isRelative = false;
                        d.month = m;
                    }
                }
            }
            else if (it.typ === DateExTokenDateExItemTokenType.QUARTAL) 
                d.quartal = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.SEASON) 
                d.season = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.WEEK) 
                d.week = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.HALFYEAR) 
                d.halfyear = (it.isLast ? 2 : it.value);
            else if (it.typ === DateExTokenDateExItemTokenType.YEAR) 
                d.year = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.CENTURY) 
                d.century = it.value;
            else if (it.typ === DateExTokenDateExItemTokenType.DECADE) 
                d.decade = it.value;
            else 
                continue;
            res.push(new ReferentToken(d, it.beginToken, it.endToken));
            own = d;
            it.src = d;
        }
        if (res.length > 0) 
            res[0].tag = own;
        return res;
    }
    
    static _createDateEx(dr) {
        let res = new Array();
        for (; dr !== null; dr = dr.higher) {
            let n = 0;
            for (const s of dr.slots) {
                let it = DateExToken.DateExItemToken._new1026(null, null, DateExTokenDateExItemTokenType.UNDEFINED);
                if (dr.getStringValue(DateReferent.ATTR_ISRELATIVE) === "true") 
                    it.isValueRelate = true;
                if (s.typeName === DateReferent.ATTR_YEAR) {
                    it.typ = DateExTokenDateExItemTokenType.YEAR;
                    let wrapn1027 = new RefOutArgWrapper();
                    let inoutres1028 = Utils.tryParseInt(Utils.asString(s.value), wrapn1027);
                    n = wrapn1027.value;
                    if (inoutres1028) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_DECADE) {
                    it.typ = DateExTokenDateExItemTokenType.DECADE;
                    let wrapn1029 = new RefOutArgWrapper();
                    let inoutres1030 = Utils.tryParseInt(Utils.asString(s.value), wrapn1029);
                    n = wrapn1029.value;
                    if (inoutres1030) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_CENTURY) {
                    it.typ = DateExTokenDateExItemTokenType.CENTURY;
                    let wrapn1031 = new RefOutArgWrapper();
                    let inoutres1032 = Utils.tryParseInt(Utils.asString(s.value), wrapn1031);
                    n = wrapn1031.value;
                    if (inoutres1032) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_HALFYEAR) {
                    it.typ = DateExTokenDateExItemTokenType.HALFYEAR;
                    let wrapn1033 = new RefOutArgWrapper();
                    let inoutres1034 = Utils.tryParseInt(Utils.asString(s.value), wrapn1033);
                    n = wrapn1033.value;
                    if (inoutres1034) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_QUARTAL) {
                    it.typ = DateExTokenDateExItemTokenType.QUARTAL;
                    let wrapn1035 = new RefOutArgWrapper();
                    let inoutres1036 = Utils.tryParseInt(Utils.asString(s.value), wrapn1035);
                    n = wrapn1035.value;
                    if (inoutres1036) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_SEASON) {
                    it.typ = DateExTokenDateExItemTokenType.SEASON;
                    let wrapn1037 = new RefOutArgWrapper();
                    let inoutres1038 = Utils.tryParseInt(Utils.asString(s.value), wrapn1037);
                    n = wrapn1037.value;
                    if (inoutres1038) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_MONTH) {
                    it.typ = DateExTokenDateExItemTokenType.MONTH;
                    let wrapn1039 = new RefOutArgWrapper();
                    let inoutres1040 = Utils.tryParseInt(Utils.asString(s.value), wrapn1039);
                    n = wrapn1039.value;
                    if (inoutres1040) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_WEEK) {
                    it.typ = DateExTokenDateExItemTokenType.WEEK;
                    let wrapn1041 = new RefOutArgWrapper();
                    let inoutres1042 = Utils.tryParseInt(Utils.asString(s.value), wrapn1041);
                    n = wrapn1041.value;
                    if (inoutres1042) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_DAYOFWEEK) {
                    it.typ = DateExTokenDateExItemTokenType.DAYOFWEEK;
                    let wrapn1043 = new RefOutArgWrapper();
                    let inoutres1044 = Utils.tryParseInt(Utils.asString(s.value), wrapn1043);
                    n = wrapn1043.value;
                    if (inoutres1044) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_DAY) {
                    it.typ = DateExTokenDateExItemTokenType.DAY;
                    let wrapn1045 = new RefOutArgWrapper();
                    let inoutres1046 = Utils.tryParseInt(Utils.asString(s.value), wrapn1045);
                    n = wrapn1045.value;
                    if (inoutres1046) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_HOUR) {
                    it.typ = DateExTokenDateExItemTokenType.HOUR;
                    let wrapn1047 = new RefOutArgWrapper();
                    let inoutres1048 = Utils.tryParseInt(Utils.asString(s.value), wrapn1047);
                    n = wrapn1047.value;
                    if (inoutres1048) 
                        it.value = n;
                }
                else if (s.typeName === DateReferent.ATTR_MINUTE) {
                    it.typ = DateExTokenDateExItemTokenType.MINUTE;
                    let wrapn1049 = new RefOutArgWrapper();
                    let inoutres1050 = Utils.tryParseInt(Utils.asString(s.value), wrapn1049);
                    n = wrapn1049.value;
                    if (inoutres1050) 
                        it.value = n;
                }
                if (it.typ !== DateExTokenDateExItemTokenType.UNDEFINED) 
                    res.splice(0, 0, it);
            }
        }
        // PYTHON: sort(key=attrgetter('typ'))
        res.sort((a, b) => a.compareTo(b));
        return res;
    }
    
    static calculateDate(dr, now, tense) {
        if (dr.pointer === DatePointerType.TODAY) 
            return now;
        if (!dr.isRelative && dr.dt !== null) 
            return dr.dt;
        let det = new DateExToken(null, null);
        det.itemsFrom = DateRelHelper._createDateEx(dr);
        return det.getDate(now, tense);
    }
    
    static calculateDateRange(dr, now, from, to, tense) {
        if (dr.pointer === DatePointerType.TODAY) {
            from.value = now;
            to.value = now;
            return true;
        }
        if (!dr.isRelative && dr.dt !== null) {
            from.value = (to.value = dr.dt);
            return true;
        }
        let det = new DateExToken(null, null);
        det.itemsFrom = DateRelHelper._createDateEx(dr);
        let inoutres1051 = det.getDates(now, from, to, tense);
        return inoutres1051;
    }
    
    static calculateDateRange2(dr, now, from, to, tense) {
        from.value = Utils.MIN_DATE;
        to.value = Utils.MAX_DATE;
        let dt0 = null;
        let dt1 = null;
        if (dr.dateFrom === null) {
            if (dr.dateTo === null) 
                return false;
            let wrapdt01052 = new RefOutArgWrapper();
            let wrapdt11053 = new RefOutArgWrapper();
            let inoutres1054 = DateRelHelper.calculateDateRange(dr.dateTo, now, wrapdt01052, wrapdt11053, tense);
            dt0 = wrapdt01052.value;
            dt1 = wrapdt11053.value;
            if (!inoutres1054) 
                return false;
            to.value = dt1;
            return true;
        }
        else if (dr.dateTo === null) {
            let wrapdt01055 = new RefOutArgWrapper();
            let wrapdt11056 = new RefOutArgWrapper();
            let inoutres1057 = DateRelHelper.calculateDateRange(dr.dateFrom, now, wrapdt01055, wrapdt11056, tense);
            dt0 = wrapdt01055.value;
            dt1 = wrapdt11056.value;
            if (!inoutres1057) 
                return false;
            from.value = dt0;
            return true;
        }
        let wrapdt01061 = new RefOutArgWrapper();
        let wrapdt11062 = new RefOutArgWrapper();
        let inoutres1063 = DateRelHelper.calculateDateRange(dr.dateFrom, now, wrapdt01061, wrapdt11062, tense);
        dt0 = wrapdt01061.value;
        dt1 = wrapdt11062.value;
        if (!inoutres1063) 
            return false;
        from.value = dt0;
        let dt2 = null;
        let dt3 = null;
        let wrapdt21058 = new RefOutArgWrapper();
        let wrapdt31059 = new RefOutArgWrapper();
        let inoutres1060 = DateRelHelper.calculateDateRange(dr.dateTo, now, wrapdt21058, wrapdt31059, tense);
        dt2 = wrapdt21058.value;
        dt3 = wrapdt31059.value;
        if (!inoutres1060) 
            return false;
        to.value = dt3;
        return true;
    }
    
    static appendToString(dr, res) {
        let dt0 = null;
        let dt1 = null;
        let cur = (ProcessorService.DEBUG_CURRENT_DATE_TIME === null ? Utils.now() : ProcessorService.DEBUG_CURRENT_DATE_TIME);
        let wrapdt01064 = new RefOutArgWrapper();
        let wrapdt11065 = new RefOutArgWrapper();
        let inoutres1066 = DateRelHelper.calculateDateRange(dr, cur, wrapdt01064, wrapdt11065, 0);
        dt0 = wrapdt01064.value;
        dt1 = wrapdt11065.value;
        if (!inoutres1066) 
            return;
        DateRelHelper._appendDates(cur, dt0, dt1, res);
    }
    
    static appendToString2(dr, res) {
        let dt0 = null;
        let dt1 = null;
        let cur = (ProcessorService.DEBUG_CURRENT_DATE_TIME === null ? Utils.now() : ProcessorService.DEBUG_CURRENT_DATE_TIME);
        let wrapdt01067 = new RefOutArgWrapper();
        let wrapdt11068 = new RefOutArgWrapper();
        let inoutres1069 = DateRelHelper.calculateDateRange2(dr, cur, wrapdt01067, wrapdt11068, 0);
        dt0 = wrapdt01067.value;
        dt1 = wrapdt11068.value;
        if (!inoutres1069) 
            return;
        DateRelHelper._appendDates(cur, dt0, dt1, res);
    }
    
    static _appendDates(cur, dt0, dt1, res) {
        let mon0 = Utils.getMonth(dt0);
        res.append(" (").append(dt0.getFullYear()).append(".").append(Utils.correctToString((mon0).toString(10), 2, true)).append(".").append(Utils.correctToString((dt0.getDate()).toString(10), 2, true));
        if (dt0.getHours() > 0 || dt0.getMinutes() > 0) 
            res.append(" ").append(Utils.correctToString((dt0.getHours()).toString(10), 2, true)).append(":").append(Utils.correctToString((dt0.getMinutes()).toString(10), 2, true));
        if (dt0 !== dt1) {
            let mon1 = Utils.getMonth(dt1);
            res.append("-").append(dt1.getFullYear()).append(".").append(Utils.correctToString((mon1).toString(10), 2, true)).append(".").append(Utils.correctToString((dt1.getDate()).toString(10), 2, true));
            if (dt1.getHours() > 0 || dt1.getMinutes() > 0) 
                res.append(" ").append(Utils.correctToString((dt1.getHours()).toString(10), 2, true)).append(":").append(Utils.correctToString((dt1.getMinutes()).toString(10), 2, true));
        }
        let monc = Utils.getMonth(cur);
        res.append(" отн. ").append(cur.getFullYear()).append(".").append(Utils.correctToString((monc).toString(10), 2, true)).append(".").append(Utils.correctToString((cur.getDate()).toString(10), 2, true));
        if (cur.getHours() > 0 || cur.getMinutes() > 0) 
            res.append(" ").append(Utils.correctToString((cur.getHours()).toString(10), 2, true)).append(":").append(Utils.correctToString((cur.getMinutes()).toString(10), 2, true));
        res.append(")");
    }
}


module.exports = DateRelHelper