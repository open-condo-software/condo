/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MetaToken = require("./../../MetaToken");
const DateItemTokenDateItemType = require("./DateItemTokenDateItemType");
const TextToken = require("./../../TextToken");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const DateRangeReferent = require("./../DateRangeReferent");
const NumberToken = require("./../../NumberToken");
const DateExTokenDateExItemTokenType = require("./DateExTokenDateExItemTokenType");
const DateReferent = require("./../DateReferent");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const DatePointerType = require("./../DatePointerType");
const DateItemToken = require("./DateItemToken");

// ВСЁ, этот класс теперь используется внутренним робразом, а DateReferent поддерживает относительные даты-время
// Используется для нахождения в тексте абсолютных и относительных дат и диапазонов,
// например, "в прошлом году", "за первый квартал этого года", "два дня назад и т.п."
class DateExToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.isDiap = false;
        this.itemsFrom = new Array();
        this.itemsTo = new Array();
    }
    
    toString() {
        let tmp = new StringBuilder();
        for (const it of this.itemsFrom) {
            tmp.append((this.isDiap ? "(fr)" : "")).append(it.toString()).append("; ");
        }
        for (const it of this.itemsTo) {
            tmp.append("(to)").append(it.toString()).append("; ");
        }
        return tmp.toString();
    }
    
    getDate(now, tense = 0) {
        let dvl = DateExToken.DateValues.tryCreate((this.itemsFrom.length > 0 ? this.itemsFrom : this.itemsTo), now, tense);
        try {
            let dt = dvl.generateDate(now, false);
            if (dt === Utils.MIN_DATE) 
                return null;
            dt = this._correctHours(dt, (this.itemsFrom.length > 0 ? this.itemsFrom : this.itemsTo), now);
            return dt;
        } catch (ex) {
            return null;
        }
    }
    
    getDates(now, from, to, tense = 0) {
        from.value = Utils.MIN_DATE;
        to.value = Utils.MIN_DATE;
        let hasHours = false;
        for (const it of this.itemsFrom) {
            if (it.typ === DateExTokenDateExItemTokenType.HOUR || it.typ === DateExTokenDateExItemTokenType.MINUTE) 
                hasHours = true;
        }
        for (const it of this.itemsTo) {
            if (it.typ === DateExTokenDateExItemTokenType.HOUR || it.typ === DateExTokenDateExItemTokenType.MINUTE) 
                hasHours = true;
        }
        let li = new Array();
        if (hasHours) {
            for (const it of this.itemsFrom) {
                if (it.typ !== DateExTokenDateExItemTokenType.HOUR && it.typ !== DateExTokenDateExItemTokenType.MINUTE) 
                    li.push(it);
            }
            for (const it of this.itemsTo) {
                if (it.typ !== DateExTokenDateExItemTokenType.HOUR && it.typ !== DateExTokenDateExItemTokenType.MINUTE) {
                    let exi = false;
                    for (const itt of li) {
                        if (itt.typ === it.typ) {
                            exi = true;
                            break;
                        }
                    }
                    if (!exi) 
                        li.push(it);
                }
            }
            // PYTHON: sort(key=attrgetter('typ'))
            li.sort((a, b) => a.compareTo(b));
            let dvl = DateExToken.DateValues.tryCreate(li, now, tense);
            if (dvl === null) 
                return false;
            try {
                from.value = dvl.generateDate(now, false);
                if (from.value === Utils.MIN_DATE) 
                    return false;
            } catch (ex) {
                return false;
            }
            to.value = from.value;
            from.value = this._correctHours(from.value, this.itemsFrom, now);
            to.value = this._correctHours(to.value, (this.itemsTo.length === 0 ? this.itemsFrom : this.itemsTo), now);
            return true;
        }
        let grYear = false;
        for (const f of this.itemsFrom) {
            if (f.typ === DateExTokenDateExItemTokenType.CENTURY || f.typ === DateExTokenDateExItemTokenType.DECADE) 
                grYear = true;
        }
        if (this.itemsTo.length === 0 && !grYear) {
            let dvl = DateExToken.DateValues.tryCreate(this.itemsFrom, now, tense);
            if (dvl === null) 
                return false;
            try {
                from.value = dvl.generateDate(now, false);
                if (from.value === Utils.MIN_DATE) 
                    return false;
            } catch (ex) {
                return false;
            }
            try {
                to.value = dvl.generateDate(now, true);
                if (to.value === Utils.MIN_DATE) 
                    to.value = from.value;
            } catch (ex) {
                to.value = from.value;
            }
            return true;
        }
        li.splice(0, li.length);
        for (const it of this.itemsFrom) {
            li.push(it);
        }
        for (const it of this.itemsTo) {
            let exi = false;
            for (const itt of li) {
                if (itt.typ === it.typ) {
                    exi = true;
                    break;
                }
            }
            if (!exi) 
                li.push(it);
        }
        // PYTHON: sort(key=attrgetter('typ'))
        li.sort((a, b) => a.compareTo(b));
        let dvl1 = DateExToken.DateValues.tryCreate(li, now, tense);
        li.splice(0, li.length);
        for (const it of this.itemsTo) {
            li.push(it);
        }
        for (const it of this.itemsFrom) {
            let exi = false;
            for (const itt of li) {
                if (itt.typ === it.typ) {
                    exi = true;
                    break;
                }
            }
            if (!exi) 
                li.push(it);
        }
        // PYTHON: sort(key=attrgetter('typ'))
        li.sort((a, b) => a.compareTo(b));
        let dvl2 = DateExToken.DateValues.tryCreate(li, now, tense);
        try {
            from.value = dvl1.generateDate(now, false);
            if (from.value === Utils.MIN_DATE) 
                return false;
        } catch (ex) {
            return false;
        }
        try {
            to.value = dvl2.generateDate(now, true);
            if (to.value === Utils.MIN_DATE) 
                return false;
        } catch (ex) {
            return false;
        }
        return true;
    }
    
    _correctHours(dt, li, now) {
        let hasHour = false;
        for (const it of li) {
            if (it.typ === DateExTokenDateExItemTokenType.HOUR) {
                hasHour = true;
                if (it.isValueRelate) {
                    dt = new Date(dt.getFullYear(), Utils.getMonth(dt) - 1, dt.getDate(), now.getHours(), now.getMinutes(), 0);
                    dt = Utils.addHours(dt, it.value);
                }
                else if (it.value > 0 && (it.value < 24)) 
                    dt = new Date(dt.getFullYear(), Utils.getMonth(dt) - 1, dt.getDate(), it.value, 0, 0);
            }
            else if (it.typ === DateExTokenDateExItemTokenType.MINUTE) {
                if (!hasHour) 
                    dt = new Date(dt.getFullYear(), Utils.getMonth(dt) - 1, dt.getDate(), now.getHours(), 0, 0);
                if (it.isValueRelate) {
                    dt = new Date(dt.getFullYear(), Utils.getMonth(dt) - 1, dt.getDate(), dt.getHours(), 0, 0);
                    dt = Utils.addMinutes(dt, it.value);
                    if (!hasHour) 
                        dt = Utils.addMinutes(dt, now.getMinutes());
                }
                else if (it.value > 0 && (it.value < 60)) 
                    dt = new Date(dt.getFullYear(), Utils.getMonth(dt) - 1, dt.getDate(), dt.getHours(), it.value, 0);
            }
        }
        return dt;
    }
    
    static tryParse(t) {
        if (t === null) 
            return null;
        if (t.isValue("ЗА", null) && t.next !== null && t.next.isValue("ПЕРИОД", null)) {
            let ne = DateExToken.tryParse(t.next.next);
            if (ne !== null && ne.isDiap) {
                ne.beginToken = t;
                return ne;
            }
        }
        let res = null;
        let toRegime = false;
        let fromRegime = false;
        let t0 = null;
        for (let tt = t; tt !== null; tt = tt.next) {
            let drr = Utils.as(tt.getReferent(), DateRangeReferent);
            if (drr !== null) {
                res = DateExToken._new936(t, tt, true);
                let fr = drr.dateFrom;
                if (fr !== null) {
                    if (fr.pointer === DatePointerType.TODAY) 
                        return null;
                    DateExToken._addItems(fr, res.itemsFrom, tt);
                }
                let to = drr.dateTo;
                if (to !== null) {
                    if (to.pointer === DatePointerType.TODAY) 
                        return null;
                    DateExToken._addItems(to, res.itemsTo, tt);
                }
                let hasYear = false;
                if (res.itemsFrom.length > 0 && res.itemsFrom[0].typ === DateExTokenDateExItemTokenType.YEAR) 
                    hasYear = true;
                else if (res.itemsTo.length > 0 && res.itemsTo[0].typ === DateExTokenDateExItemTokenType.YEAR) 
                    hasYear = true;
                if (!hasYear && (tt.whitespacesAfterCount < 3)) {
                    let dit = DateExToken.DateExItemToken.tryParse(tt.next, (res.itemsTo.length > 0 ? res.itemsTo : res.itemsFrom), 0, false);
                    if (dit !== null && dit.typ === DateExTokenDateExItemTokenType.YEAR) {
                        if (res.itemsFrom.length > 0) 
                            res.itemsFrom.splice(0, 0, dit);
                        if (res.itemsTo.length > 0) 
                            res.itemsTo.splice(0, 0, dit);
                        res.endToken = dit.endToken;
                    }
                }
                return res;
            }
            let dr = Utils.as(tt.getReferent(), DateReferent);
            if (dr !== null) {
                if (dr.pointer === DatePointerType.TODAY) 
                    return null;
                if (res === null) 
                    res = new DateExToken(t, tt);
                let li = new Array();
                DateExToken._addItems(dr, li, tt);
                if (li.length === 0) 
                    continue;
                if (toRegime) {
                    let ok = true;
                    for (const v of li) {
                        for (const vv of res.itemsTo) {
                            if (vv.typ === v.typ) 
                                ok = false;
                        }
                    }
                    if (!ok) 
                        break;
                    res.itemsTo.splice(res.itemsTo.length, 0, ...li);
                    res.endToken = tt;
                }
                else {
                    let ok = true;
                    for (const v of li) {
                        for (const vv of res.itemsFrom) {
                            if (vv.typ === v.typ) 
                                ok = false;
                        }
                    }
                    if (!ok) 
                        break;
                    res.itemsFrom.splice(res.itemsFrom.length, 0, ...li);
                    res.endToken = tt;
                }
                let hasYear = false;
                if (res.itemsFrom.length > 0 && res.itemsFrom[0].typ === DateExTokenDateExItemTokenType.YEAR) 
                    hasYear = true;
                else if (res.itemsTo.length > 0 && res.itemsTo[0].typ === DateExTokenDateExItemTokenType.YEAR) 
                    hasYear = true;
                if (!hasYear && (tt.whitespacesAfterCount < 3)) {
                    let dit = DateExToken.DateExItemToken.tryParse(tt.next, null, 0, false);
                    if (dit !== null && dit.typ === DateExTokenDateExItemTokenType.YEAR) {
                        if (res.itemsFrom.length > 0) 
                            res.itemsFrom.splice(0, 0, dit);
                        if (res.itemsTo.length > 0) 
                            res.itemsTo.splice(0, 0, dit);
                        tt = res.endToken = dit.endToken;
                    }
                }
                continue;
            }
            if (tt.morph._class.isPreposition) {
                if (tt.isValue("ПО", null) || tt.isValue("ДО", null)) {
                    toRegime = true;
                    if (t0 === null) 
                        t0 = tt;
                }
                else if (tt.isValue("С", null) || tt.isValue("ОТ", null)) {
                    fromRegime = true;
                    if (t0 === null) 
                        t0 = tt;
                }
                continue;
            }
            let it = DateExToken.DateExItemToken.tryParse(tt, (res === null ? null : (toRegime ? res.itemsTo : res.itemsFrom)), 0, false);
            if (it === null) 
                break;
            if (tt.isValue("ДЕНЬ", null) && tt.next !== null && tt.next.isValue("НЕДЕЛЯ", null)) 
                break;
            if (it.endToken === tt && ((it.typ === DateExTokenDateExItemTokenType.HOUR || it.typ === DateExTokenDateExItemTokenType.MINUTE))) {
                if (tt.previous === null || !tt.previous.morph._class.isPreposition) 
                    break;
            }
            if (res === null) {
                if ((it.typ === DateExTokenDateExItemTokenType.DAY || it.typ === DateExTokenDateExItemTokenType.MONTH || it.typ === DateExTokenDateExItemTokenType.WEEK) || it.typ === DateExTokenDateExItemTokenType.QUARTAL || it.typ === DateExTokenDateExItemTokenType.YEAR) {
                    if (it.beginToken === it.endToken && !it.isValueRelate && it.value === 0) 
                        return null;
                }
                res = new DateExToken(t, tt);
            }
            if (toRegime) 
                res.itemsTo.push(it);
            else {
                res.itemsFrom.push(it);
                if (it.isLast && it.value !== 0 && it.value !== -1) {
                    res.itemsTo.push(DateExToken.DateExItemToken._new935(it.beginToken, it.endToken, it.typ, true));
                    fromRegime = true;
                }
            }
            tt = it.endToken;
            res.endToken = tt;
        }
        if (res !== null) {
            if (t0 !== null && res.beginToken.previous === t0) 
                res.beginToken = t0;
            res.isDiap = fromRegime || toRegime;
            // PYTHON: sort(key=attrgetter('typ'))
            res.itemsFrom.sort((a, b) => a.compareTo(b));
            // PYTHON: sort(key=attrgetter('typ'))
            res.itemsTo.sort((a, b) => a.compareTo(b));
            if ((res.itemsFrom.length === 1 && res.itemsTo.length === 0 && res.itemsFrom[0].isLast) && res.itemsFrom[0].value === 0) 
                return null;
        }
        return res;
    }
    
    static _addItems(fr, res, tt) {
        if (fr.century > 0) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.CENTURY, fr.century, fr));
        if (fr.decade > 0) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.DECADE, fr.decade, fr));
        if (fr.year > 0) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.YEAR, fr.year, fr));
        else if (fr.pointer === DatePointerType.TODAY) 
            res.push(DateExToken.DateExItemToken._new941(tt, tt, DateExTokenDateExItemTokenType.YEAR, 0, true));
        if (fr.month > 0) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.MONTH, fr.month, fr));
        else if (fr.pointer === DatePointerType.TODAY) 
            res.push(DateExToken.DateExItemToken._new941(tt, tt, DateExTokenDateExItemTokenType.MONTH, 0, true));
        if (fr.day > 0) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.DAY, fr.day, fr));
        else if (fr.pointer === DatePointerType.TODAY) 
            res.push(DateExToken.DateExItemToken._new941(tt, tt, DateExTokenDateExItemTokenType.DAY, 0, true));
        if (fr.findSlot(DateReferent.ATTR_HOUR, null, true) !== null) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.HOUR, fr.hour, fr));
        else if (fr.pointer === DatePointerType.TODAY) 
            res.push(DateExToken.DateExItemToken._new941(tt, tt, DateExTokenDateExItemTokenType.HOUR, 0, true));
        if (fr.findSlot(DateReferent.ATTR_MINUTE, null, true) !== null) 
            res.push(DateExToken.DateExItemToken._new938(tt, tt, DateExTokenDateExItemTokenType.MINUTE, fr.minute, fr));
        else if (fr.pointer === DatePointerType.TODAY) 
            res.push(DateExToken.DateExItemToken._new941(tt, tt, DateExTokenDateExItemTokenType.MINUTE, 0, true));
    }
    
    static _new936(_arg1, _arg2, _arg3) {
        let res = new DateExToken(_arg1, _arg2);
        res.isDiap = _arg3;
        return res;
    }
}


DateExToken.DateValues = class  {
    
    constructor() {
        this.day1 = 0;
        this.day2 = 0;
        this.month1 = 0;
        this.month2 = 0;
        this.year1 = 0;
        this.year2 = 0;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.year1 > 0) {
            tmp.append("Year:").append(this.year1);
            if (this.year2 > this.year1) 
                tmp.append("..").append(this.year2);
        }
        if (this.month1 > 0) {
            tmp.append(" Month:").append(this.month1);
            if (this.month2 > this.month1) 
                tmp.append("..").append(this.month2);
        }
        if (this.day1 > 0) {
            tmp.append(" Day:").append(this.day1);
            if (this.day2 > this.day1) 
                tmp.append("..").append(this.day2);
        }
        return tmp.toString().trim();
    }
    
    generateDate(today, endOfDiap) {
        let year = this.year1;
        if (year === 0) 
            year = today.getFullYear();
        if (endOfDiap && this.year2 > this.year1) 
            year = this.year2;
        if (year < 0) 
            return Utils.MIN_DATE;
        let mon = this.month1;
        if (mon === 0) 
            mon = (endOfDiap ? 12 : 1);
        else if (endOfDiap && this.month2 > 0) 
            mon = this.month2;
        let day = this.day1;
        if (day === 0) {
            day = (endOfDiap ? 31 : 1);
            if (day > Utils.daysInMonth(year, mon)) 
                day = Utils.daysInMonth(year, mon);
        }
        else if (this.day2 > 0 && endOfDiap) 
            day = this.day2;
        if (year >= 9999 || mon > 12) 
            return Utils.MIN_DATE;
        if (day > Utils.daysInMonth(year, mon)) 
            return Utils.MIN_DATE;
        return new Date(year, mon - 1, day, 0, 0, 0);
    }
    
    static tryCreate(list, today, tense) {
        const DateExTokenDateExItemTokenType = require("./DateExTokenDateExItemTokenType");
        let oo = false;
        if (list !== null) {
            for (const v of list) {
                if (v.typ !== DateExTokenDateExItemTokenType.HOUR && v.typ !== DateExTokenDateExItemTokenType.MINUTE) 
                    oo = true;
            }
        }
        if (!oo) 
            return DateExToken.DateValues._new934(today.getFullYear(), Utils.getMonth(today), today.getDate());
        if (list === null || list.length === 0) 
            return null;
        for (let j = 0; j < list.length; j++) {
            if (list[j].typ === DateExTokenDateExItemTokenType.DAYOFWEEK) {
                if (j > 0 && list[j - 1].typ === DateExTokenDateExItemTokenType.WEEK) 
                    break;
                let we = DateExToken.DateExItemToken._new935(list[j].beginToken, list[j].endToken, DateExTokenDateExItemTokenType.WEEK, true);
                if (list[j].isValueRelate) {
                    list[j].isValueRelate = false;
                    if (list[j].value < 0) {
                        we.value = -1;
                        list[j].value = -list[j].value;
                    }
                }
                list.splice(j, 0, we);
                break;
            }
        }
        let res = new DateExToken.DateValues();
        let it = null;
        let i = 0;
        let hasRel = false;
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.CENTURY) {
            it = list[i];
            if (!it.isValueRelate) 
                res.year1 = (((Utils.intDiv(today.getFullYear(), 1000))) * 1000) + (it.value * 100);
            else 
                res.year1 = (((Utils.intDiv(today.getFullYear(), 100))) * 100) + (it.value * 100);
            res.year2 = res.year1 + 99;
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.DECADE) {
            it = list[i];
            if ((i > 0 && list[i - 1].typ === DateExTokenDateExItemTokenType.CENTURY && !it.isValueRelate) && (res.year1 + 99) === res.year2) {
                res.year1 += (((it.value - 1)) * 10);
                res.year2 = res.year1 + 9;
            }
            else if (!it.isValueRelate) 
                res.year1 = (((Utils.intDiv(today.getFullYear(), 100))) * 100) + (it.value * 10);
            else 
                res.year1 = (((Utils.intDiv(today.getFullYear(), 10))) * 10) + (it.value * 10);
            res.year2 = res.year1 + 9;
            return res;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.YEAR) {
            it = list[i];
            if (!it.isValueRelate) 
                res.year1 = it.value;
            else {
                if (res.year1 > 0 && res.year2 > res.year1 && it.value >= 0) {
                    res.year1 += it.value;
                    res.year2 = res.year1;
                }
                else 
                    res.year1 = today.getFullYear() + it.value;
                hasRel = true;
            }
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.HALFYEAR) {
            it = list[i];
            if (!it.isValueRelate) {
                if (it.isLast || it.value === 2) {
                    res.month1 = 7;
                    res.month2 = 12;
                }
                else {
                    res.month1 = 1;
                    res.month2 = 6;
                }
            }
            else {
                let v = (Utils.getMonth(today) > 6 ? 2 : 1);
                v += it.value;
                while (v > 2) {
                    res.year1 += 1;
                    v -= 2;
                }
                while (v < 1) {
                    res.year1 -= 1;
                    v += 2;
                }
                if (v === 1) {
                    res.month1 = 1;
                    res.month2 = 6;
                }
                else {
                    res.month1 = 7;
                    res.month2 = 12;
                }
                hasRel = true;
            }
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.QUARTAL) {
            it = list[i];
            let v = 0;
            if (!it.isValueRelate) {
                if (res.year1 === 0) {
                    let v0 = 1 + ((Utils.intDiv((Utils.getMonth(today) - 1), 3)));
                    if (it.value > v0 && (tense < 0)) 
                        res.year1 = today.getFullYear() - 1;
                    else if ((it.value < v0) && tense > 0) 
                        res.year1 = today.getFullYear() + 1;
                    else 
                        res.year1 = today.getFullYear();
                }
                v = it.value;
            }
            else {
                if (res.year1 === 0) 
                    res.year1 = today.getFullYear();
                v = 1 + ((Utils.intDiv((Utils.getMonth(today) - 1), 3))) + it.value;
            }
            while (v > 3) {
                v -= 3;
                res.year1++;
            }
            while (v <= 0) {
                v += 3;
                res.year1--;
            }
            res.month1 = (((v - 1)) * 3) + 1;
            res.month2 = res.month1 + 2;
            return res;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.SEASON) {
            it = list[i];
            let v = 0;
            if (!it.isValueRelate) {
                if (res.year1 === 0) {
                    let v0 = 1 + ((Utils.intDiv((Utils.getMonth(today) - 1), 3)));
                    if (it.value > v0 && (tense < 0)) 
                        res.year1 = today.getFullYear() - 1;
                    else if ((it.value < v0) && tense > 0) 
                        res.year1 = today.getFullYear() + 1;
                    else 
                        res.year1 = today.getFullYear();
                }
                v = it.value;
            }
            else {
                if (res.year1 === 0) 
                    res.year1 = today.getFullYear();
                v = it.value;
            }
            if (v === 1) {
                res.month1 = 12;
                res.year2 = res.year1;
                res.year1--;
                res.month2 = 2;
            }
            else if (v === 2) {
                res.month1 = 3;
                res.month2 = 5;
            }
            else if (v === 3) {
                res.month1 = 6;
                res.month2 = 8;
            }
            else if (v === 4) {
                res.month1 = 9;
                res.month2 = 11;
            }
            else 
                return null;
            return res;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.MONTH) {
            it = list[i];
            if (!it.isValueRelate) {
                if (res.year1 === 0) {
                    if (it.value > Utils.getMonth(today) && (tense < 0)) 
                        res.year1 = today.getFullYear() - 1;
                    else if ((it.value < Utils.getMonth(today)) && tense > 0) 
                        res.year1 = today.getFullYear() + 1;
                    else 
                        res.year1 = today.getFullYear();
                }
                res.month1 = it.value;
            }
            else {
                hasRel = true;
                if (res.year1 === 0) 
                    res.year1 = today.getFullYear();
                let v = Utils.getMonth(today) + it.value;
                while (v > 12) {
                    v -= 12;
                    res.year1++;
                }
                while (v <= 0) {
                    v += 12;
                    res.year1--;
                }
                res.month1 = v;
            }
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.WEEKEND && i === 0) {
            it = list[i];
            hasRel = true;
            if (res.year1 === 0) 
                res.year1 = today.getFullYear();
            if (res.month1 === 0) 
                res.month1 = Utils.getMonth(today);
            if (res.day1 === 0) 
                res.day1 = today.getDate();
            let dt0 = new Date(res.year1, res.month1 - 1, res.day1, 0, 0, 0);
            let dow = dt0.getDay();
            if (dow === 1) 
                dt0 = Utils.addDays(dt0, 5);
            else if (dow === 2) 
                dt0 = Utils.addDays(dt0, 4);
            else if (dow === 3) 
                dt0 = Utils.addDays(dt0, 3);
            else if (dow === 4) 
                dt0 = Utils.addDays(dt0, 2);
            else if (dow === 5) 
                dt0 = Utils.addDays(dt0, 1);
            else if (dow === 6) 
                dt0 = Utils.addDays(dt0, -1);
            else if (dow === 0) {
            }
            if (it.value !== 0) 
                dt0 = Utils.addDays(dt0, it.value * 7);
            res.year1 = dt0.getFullYear();
            res.month1 = Utils.getMonth(dt0);
            res.day1 = dt0.getDate();
            dt0 = Utils.addDays(dt0, 1);
            res.year1 = dt0.getFullYear();
            res.month2 = Utils.getMonth(dt0);
            res.day2 = dt0.getDate();
            i++;
        }
        if (((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.WEEK && i === 0) && list[i].isValueRelate) {
            it = list[i];
            hasRel = true;
            if (res.year1 === 0) 
                res.year1 = today.getFullYear();
            if (res.month1 === 0) 
                res.month1 = Utils.getMonth(today);
            if (res.day1 === 0) 
                res.day1 = today.getDate();
            let dt0 = new Date(res.year1, res.month1 - 1, res.day1, 0, 0, 0);
            let dow = dt0.getDay();
            if (dow === 2) 
                dt0 = Utils.addDays(dt0, -1);
            else if (dow === 3) 
                dt0 = Utils.addDays(dt0, -2);
            else if (dow === 4) 
                dt0 = Utils.addDays(dt0, -3);
            else if (dow === 5) 
                dt0 = Utils.addDays(dt0, -4);
            else if (dow === 6) 
                dt0 = Utils.addDays(dt0, -5);
            else if (dow === 0) 
                dt0 = Utils.addDays(dt0, -6);
            if (it.value !== 0) 
                dt0 = Utils.addDays(dt0, it.value * 7);
            res.year1 = dt0.getFullYear();
            res.month1 = Utils.getMonth(dt0);
            res.day1 = dt0.getDate();
            dt0 = Utils.addDays(dt0, 6);
            res.year1 = dt0.getFullYear();
            res.month2 = Utils.getMonth(dt0);
            res.day2 = dt0.getDate();
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.DAY) {
            it = list[i];
            if (!it.isValueRelate) {
                res.day1 = it.value;
                if (res.month1 === 0) {
                    if (res.year1 === 0) 
                        res.year1 = today.getFullYear();
                    if (it.value > today.getDate() && (tense < 0)) {
                        res.month1 = Utils.getMonth(today) - 1;
                        if (res.month1 <= 0) {
                            res.month1 = 12;
                            res.year1--;
                        }
                    }
                    else if ((it.value < today.getDate()) && tense > 0) {
                        res.month1 = Utils.getMonth(today) + 1;
                        if (res.month1 > 12) {
                            res.month1 = 1;
                            res.year1++;
                        }
                    }
                    else 
                        res.month1 = Utils.getMonth(today);
                }
            }
            else {
                hasRel = true;
                if (res.year1 === 0) 
                    res.year1 = today.getFullYear();
                if (res.month1 === 0) 
                    res.month1 = Utils.getMonth(today);
                let v = today.getDate() + it.value;
                while (v > Utils.daysInMonth(res.year1, res.month1)) {
                    v -= Utils.daysInMonth(res.year1, res.month1);
                    res.month1++;
                    if (res.month1 > 12) {
                        res.month1 = 1;
                        res.year1++;
                    }
                }
                while (v <= 0) {
                    res.month1--;
                    if (res.month1 <= 0) {
                        res.month1 = 12;
                        res.year1--;
                    }
                    v += Utils.daysInMonth(res.year1, res.month1);
                }
                res.day1 = v;
            }
            i++;
        }
        if ((i < list.length) && list[i].typ === DateExTokenDateExItemTokenType.DAYOFWEEK) {
            it = list[i];
            if ((i > 0 && list[i - 1].typ === DateExTokenDateExItemTokenType.WEEK && it.value >= 1) && it.value <= 7) {
                res.day1 = (res.day1 + it.value) - 1;
                while (res.day1 > Utils.daysInMonth(res.year1, res.month1)) {
                    res.day1 -= Utils.daysInMonth(res.year1, res.month1);
                    res.month1++;
                    if (res.month1 > 12) {
                        res.month1 = 1;
                        res.year1++;
                    }
                }
                res.day2 = res.day1;
                res.month2 = res.month1;
                i++;
            }
        }
        return res;
    }
    
    static _new934(_arg1, _arg2, _arg3) {
        let res = new DateExToken.DateValues();
        res.year1 = _arg1;
        res.month1 = _arg2;
        res.day1 = _arg3;
        return res;
    }
}


DateExToken.DateExItemToken = class  extends MetaToken {
    
    constructor(begin, end) {
        const DateExTokenDateExItemTokenType = require("./DateExTokenDateExItemTokenType");
        super(begin, end, null);
        this.typ = DateExTokenDateExItemTokenType.UNDEFINED;
        this.value = 0;
        this.isValueRelate = false;
        this.isLast = false;
        this.isValueNotstrict = false;
        this.src = null;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(String(this.typ)).append(" ");
        if (this.isValueNotstrict) 
            tmp.append("~");
        if (this.isValueRelate) 
            tmp.append((this.value < 0 ? "" : "+")).append(this.value).append((this.isLast ? " (last)" : ""));
        else 
            tmp.append(this.value);
        return tmp.toString();
    }
    
    static tryParse(t, prev, level = 0, noCorrAfter = false) {
        const MorphNumber = require("./../../../morph/MorphNumber");
        const DateItemTokenDateItemType = require("./DateItemTokenDateItemType");
        const TextToken = require("./../../TextToken");
        const MiscHelper = require("./../../core/MiscHelper");
        const DateItemToken = require("./DateItemToken");
        const DateReferent = require("./../DateReferent");
        const NumberToken = require("./../../NumberToken");
        const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
        const NounPhraseHelper = require("./../../core/NounPhraseHelper");
        const DateExTokenDateExItemTokenType = require("./DateExTokenDateExItemTokenType");
        if (t === null || level > 10) 
            return null;
        if (t.isValue("СЕГОДНЯ", "СЬОГОДНІ")) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.DAY, 0, true);
        if (t.isValue("ЗАВТРА", null)) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.DAY, 1, true);
        if (t.isValue("ЗАВТРАШНИЙ", "ЗАВТРАШНІЙ") && t.next !== null && t.next.isValue("ДЕНЬ", null)) 
            return DateExToken.DateExItemToken._new941(t, t.next, DateExTokenDateExItemTokenType.DAY, 1, true);
        if (t.isValue("ПОСЛЕЗАВТРА", "ПІСЛЯЗАВТРА")) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.DAY, 2, true);
        if (t.isValue("ПОСЛЕЗАВТРАШНИЙ", "ПІСЛЯЗАВТРАШНІЙ") && t.next !== null && t.next.isValue("ДЕНЬ", null)) 
            return DateExToken.DateExItemToken._new941(t, t.next, DateExTokenDateExItemTokenType.DAY, 2, true);
        if (t.isValue("ВЧЕРА", "ВЧОРА")) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.DAY, -1, true);
        if (t.isValue("ВЧЕРАШНИЙ", "ВЧОРАШНІЙ") && t.next !== null && t.next.isValue("ДЕНЬ", null)) 
            return DateExToken.DateExItemToken._new941(t, t.next, DateExTokenDateExItemTokenType.DAY, -1, true);
        if (t.isValue("ПОЗАВЧЕРА", "ПОЗАВЧОРА")) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.DAY, -2, true);
        if (t.isValue("ПОЗАВЧЕРАШНИЙ", "ПОЗАВЧОРАШНІЙ") && t.next !== null && t.next.isValue("ДЕНЬ", null)) 
            return DateExToken.DateExItemToken._new941(t, t.next, DateExTokenDateExItemTokenType.DAY, -2, true);
        if (t.isValue("ПОЛЧАСА", "ПІВГОДИНИ")) 
            return DateExToken.DateExItemToken._new941(t, t, DateExTokenDateExItemTokenType.MINUTE, 30, true);
        if (t.isValue("ЗИМА", null)) 
            return DateExToken.DateExItemToken._new960(t, t, DateExTokenDateExItemTokenType.SEASON, 1);
        if (t.isValue("ВЕСНА", null)) 
            return DateExToken.DateExItemToken._new960(t, t, DateExTokenDateExItemTokenType.SEASON, 2);
        if (t.isValue("ЛЕТО", "ЛІТО") && !t.isValue("ЛЕТ", null)) 
            return DateExToken.DateExItemToken._new960(t, t, DateExTokenDateExItemTokenType.SEASON, 3);
        if (t.isValue("ОСЕНЬ", "ОСЕНІ")) 
            return DateExToken.DateExItemToken._new960(t, t, DateExTokenDateExItemTokenType.SEASON, 4);
        if (prev !== null && prev.length > 0) {
            if (((t.isValue("Т", null) && t.next !== null && t.next.isChar('.')) && t.next.next !== null && t.next.next.isValue("Г", null)) && t.next.next.next !== null && t.next.next.next.isChar('.')) 
                return DateExToken.DateExItemToken._new935(t, t.next.next.next, DateExTokenDateExItemTokenType.YEAR, true);
        }
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), 0, null);
        if (npt !== null && npt.beginToken === npt.endToken) {
            if (npt.endToken.isValue("ПРОШЛЫЙ", "МИНУЛИЙ") || npt.endToken.isValue("БУДУЩИЙ", "МАЙБУТНІЙ")) 
                npt = null;
        }
        if (npt === null) {
            if ((t instanceof NumberToken) && t.intValue !== null) {
                if (t.next !== null) {
                    if (t.next.isValue("УТРА", null)) 
                        return DateExToken.DateExItemToken._new960(t, t.next, DateExTokenDateExItemTokenType.HOUR, t.intValue);
                    if (t.next.isValue("ВЕЧЕРА", null)) {
                        let res1 = DateExToken.DateExItemToken._new960(t, t.next, DateExTokenDateExItemTokenType.HOUR, t.intValue);
                        if (res1.value < 12) 
                            res1.value += 12;
                        return res1;
                    }
                    if (t.next.isValue("ЧАС", null) && t.next.next !== null) {
                        if (t.next.next.isValue("УТРА", null)) 
                            return DateExToken.DateExItemToken._new960(t, t.next.next, DateExTokenDateExItemTokenType.HOUR, t.intValue);
                        if (t.next.next.isValue("ВЕЧЕРА", null) || t.next.next.isValue("ДНЯ", null)) {
                            let res1 = DateExToken.DateExItemToken._new960(t, t.next.next, DateExTokenDateExItemTokenType.HOUR, t.intValue);
                            if (res1.value < 12) 
                                res1.value += 12;
                            return res1;
                        }
                    }
                }
                let res0 = DateExToken.DateExItemToken.tryParse(t.next, prev, level + 1, true);
                if (res0 !== null && ((res0.value === 1 || res0.value === 0))) {
                    res0.beginToken = t;
                    res0.value = t.intValue;
                    if (t.previous !== null && ((t.previous.isValue("ЧЕРЕЗ", null) || t.previous.isValue("СПУСТЯ", null)))) 
                        res0.isValueRelate = true;
                    else if (res0.endToken.next !== null) {
                        if (res0.endToken.next.isValue("СПУСТЯ", null)) {
                            res0.isValueRelate = true;
                            res0.endToken = res0.endToken.next;
                        }
                        else if (res0.endToken.next.isValue("НАЗАД", null)) {
                            res0.isValueRelate = true;
                            res0.value = -res0.value;
                            res0.endToken = res0.endToken.next;
                        }
                        else if (res0.endToken.next.isValue("ТОМУ", null) && res0.endToken.next.next !== null && res0.endToken.next.next.isValue("НАЗАД", null)) {
                            res0.isValueRelate = true;
                            res0.value = -res0.value;
                            res0.endToken = res0.endToken.next.next;
                        }
                    }
                    return res0;
                }
                let dtt = DateItemToken.tryParse(t, null, false);
                if (dtt !== null && dtt.typ === DateItemTokenDateItemType.YEAR) 
                    return DateExToken.DateExItemToken._new960(t, dtt.endToken, DateExTokenDateExItemTokenType.YEAR, dtt.intValue);
                if (t.next !== null && t.next.isValue("ЧИСЛО", null)) {
                    let ne = DateExToken.DateExItemToken.tryParse(t.next.next, prev, level + 1, false);
                    if (ne !== null && ne.typ === DateExTokenDateExItemTokenType.MONTH) 
                        return DateExToken.DateExItemToken._new960(t, t.next, DateExTokenDateExItemTokenType.DAY, t.intValue);
                }
            }
            let delt = 0;
            let ok = true;
            let last = false;
            let t1 = t;
            if (t.isValue("СЛЕДУЮЩИЙ", "НАСТУПНИЙ") || t.isValue("БУДУЩИЙ", "МАЙБУТНІЙ") || t.isValue("БЛИЖАЙШИЙ", "НАЙБЛИЖЧИЙ")) 
                delt = 1;
            else if (t.isValue("ПРЕДЫДУЩИЙ", "ПОПЕРЕДНІЙ") || t.isValue("ПРОШЛЫЙ", "МИНУЛИЙ") || t.isValue("ПРОШЕДШИЙ", null)) 
                delt = -1;
            else if (t.isValue("ПОЗАПРОШЛЫЙ", "ПОЗАМИНУЛИЙ")) 
                delt = -2;
            else if (t.isValue("ЭТОТ", "ЦЕЙ") || t.isValue("ТЕКУЩИЙ", "ПОТОЧНИЙ")) {
                if ((t instanceof TextToken) && ((t.term === "ЭТО" || t.term === "ЦЕ"))) 
                    ok = false;
            }
            else if (t.isValue("ПОСЛЕДНИЙ", "ОСТАННІЙ")) {
                last = true;
                if (t.next instanceof NumberToken) {
                    delt = t.next.intValue;
                    t1 = t.next;
                    let _next = DateExToken.DateExItemToken.tryParse(t1.next, null, 0, false);
                    if (_next !== null && _next.value === 0) {
                        _next.beginToken = t;
                        _next.isLast = true;
                        _next.value = -delt;
                        _next.isValueRelate = true;
                        return _next;
                    }
                }
                else {
                    let _next = DateExToken.DateExItemToken.tryParse(t.next, null, 0, false);
                    if (_next !== null && _next.value === 0) {
                        _next.beginToken = t;
                        _next.isLast = true;
                        _next.isValueRelate = true;
                        if (_next.typ === DateExTokenDateExItemTokenType.HALFYEAR) {
                            _next.value = 2;
                            _next.isValueRelate = false;
                        }
                        return _next;
                    }
                }
            }
            else 
                ok = false;
            if (ok) {
                for (let tt = t.previous; tt !== null; tt = tt.previous) {
                    if (tt.isNewlineAfter) 
                        break;
                    let dr = Utils.as(tt.getReferent(), DateReferent);
                    if (dr !== null && dr.isRelative) {
                        let ty0 = DateExTokenDateExItemTokenType.UNDEFINED;
                        for (const s of dr.slots) {
                            if (s.typeName === DateReferent.ATTR_MONTH) 
                                ty0 = DateExTokenDateExItemTokenType.MONTH;
                            else if (s.typeName === DateReferent.ATTR_YEAR) 
                                ty0 = DateExTokenDateExItemTokenType.YEAR;
                            else if (s.typeName === DateReferent.ATTR_DAY) 
                                ty0 = DateExTokenDateExItemTokenType.DAY;
                            else if (s.typeName === DateReferent.ATTR_WEEK) 
                                ty0 = DateExTokenDateExItemTokenType.WEEK;
                            else if (s.typeName === DateReferent.ATTR_CENTURY) 
                                ty0 = DateExTokenDateExItemTokenType.CENTURY;
                            else if (s.typeName === DateReferent.ATTR_QUARTAL) 
                                ty0 = DateExTokenDateExItemTokenType.QUARTAL;
                            else if (s.typeName === DateReferent.ATTR_HALFYEAR) 
                                ty0 = DateExTokenDateExItemTokenType.HALFYEAR;
                            else if (s.typeName === DateReferent.ATTR_DECADE) 
                                ty0 = DateExTokenDateExItemTokenType.DECADE;
                        }
                        if (ty0 !== DateExTokenDateExItemTokenType.UNDEFINED) 
                            return DateExToken.DateExItemToken._new941(t, t, ty0, delt, true);
                    }
                    if (MiscHelper.canBeStartOfSentence(tt)) 
                        break;
                }
            }
            return null;
        }
        let ty = DateExTokenDateExItemTokenType.HOUR;
        let val = 0;
        if (npt.noun.isValue("ГОД", "РІК") || npt.noun.isValue("ГОДИК", null) || npt.noun.isValue("ЛЕТ", null)) 
            ty = DateExTokenDateExItemTokenType.YEAR;
        else if (npt.noun.isValue("ПОЛГОДА", "ПІВРОКУ") || npt.noun.isValue("ПОЛУГОДИЕ", "ПІВРІЧЧЯ")) 
            ty = DateExTokenDateExItemTokenType.HALFYEAR;
        else if (npt.noun.isValue("ВЕК", null) || npt.noun.isValue("СТОЛЕТИЕ", "СТОЛІТТЯ")) 
            ty = DateExTokenDateExItemTokenType.CENTURY;
        else if (npt.noun.isValue("КВАРТАЛ", null)) 
            ty = DateExTokenDateExItemTokenType.QUARTAL;
        else if (npt.noun.isValue("ДЕСЯТИЛЕТИЕ", "ДЕСЯТИЛІТТЯ") || npt.noun.isValue("ДЕКАДА", null)) 
            ty = DateExTokenDateExItemTokenType.DECADE;
        else if (npt.noun.isValue("МЕСЯЦ", "МІСЯЦЬ")) 
            ty = DateExTokenDateExItemTokenType.MONTH;
        else if (npt.noun.isValue("ДЕНЬ", null) || npt.noun.isValue("ДЕНЕК", null) || npt.noun.isValue("СУТКИ", null)) {
            if (npt.endToken.next !== null && npt.endToken.next.isValue("НЕДЕЛЯ", "ТИЖДЕНЬ")) 
                return null;
            ty = DateExTokenDateExItemTokenType.DAY;
        }
        else if (npt.noun.isValue("ЧИСЛО", null) && npt.adjectives.length > 0 && (npt.adjectives[0].beginToken instanceof NumberToken)) 
            ty = DateExTokenDateExItemTokenType.DAY;
        else if (npt.noun.isValue("НЕДЕЛЯ", "ТИЖДЕНЬ") || npt.noun.isValue("НЕДЕЛЬКА", null)) {
            if (t.previous !== null && t.previous.isValue("ДЕНЬ", null)) 
                return null;
            if (t.previous !== null && ((t.previous.isValue("ЗА", null) || t.previous.isValue("НА", null)))) 
                ty = DateExTokenDateExItemTokenType.WEEK;
            else if (t.isValue("ЗА", null) || t.isValue("НА", null)) 
                ty = DateExTokenDateExItemTokenType.WEEK;
            else 
                ty = DateExTokenDateExItemTokenType.WEEK;
        }
        else if (npt.noun.isValue("ВЫХОДНОЙ", "ВИХІДНИЙ")) 
            ty = DateExTokenDateExItemTokenType.WEEKEND;
        else if (npt.noun.isValue("ЧАС", "ГОДИНА") || npt.noun.isValue("ЧАСИК", null) || npt.noun.isValue("ЧАСОК", null)) 
            ty = DateExTokenDateExItemTokenType.HOUR;
        else if (npt.noun.isValue("МИНУТА", "ХВИЛИНА") || npt.noun.isValue("МИНУТКА", null)) 
            ty = DateExTokenDateExItemTokenType.MINUTE;
        else if (npt.noun.isValue("ПОНЕДЕЛЬНИК", "ПОНЕДІЛОК")) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 1;
        }
        else if (npt.noun.isValue("ВТОРНИК", "ВІВТОРОК")) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 2;
        }
        else if (npt.noun.isValue("СРЕДА", "СЕРЕДА")) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 3;
        }
        else if (npt.noun.isValue("ЧЕТВЕРГ", "ЧЕТВЕР")) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 4;
        }
        else if (npt.noun.isValue("ПЯТНИЦЯ", null)) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 5;
        }
        else if (npt.noun.isValue("СУББОТА", "СУБОТА")) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 6;
        }
        else if (npt.noun.isValue("ВОСКРЕСЕНЬЕ", "НЕДІЛЯ") || npt.noun.isValue("ВОСКРЕСЕНИЕ", null)) {
            ty = DateExTokenDateExItemTokenType.DAYOFWEEK;
            val = 7;
        }
        else {
            let dti = DateItemToken.tryParse(npt.endToken, null, false);
            if (dti !== null && dti.typ === DateItemTokenDateItemType.MONTH) {
                ty = DateExTokenDateExItemTokenType.MONTH;
                val = dti.intValue;
            }
            else 
                return null;
        }
        let res = DateExToken.DateExItemToken._new960(t, npt.endToken, ty, val);
        let heg = false;
        for (let i = 0; i < npt.adjectives.length; i++) {
            let a = npt.adjectives[i];
            if (a.isValue("СЛЕДУЮЩИЙ", "НАСТУПНИЙ") || a.isValue("БУДУЩИЙ", "МАЙБУТНІЙ") || a.isValue("БЛИЖАЙШИЙ", "НАЙБЛИЖЧИЙ")) {
                if (res.value === 0 && ty !== DateExTokenDateExItemTokenType.WEEKEND) 
                    res.value = 1;
                res.isValueRelate = true;
            }
            else if (a.isValue("ПРЕДЫДУЩИЙ", "ПОПЕРЕДНІЙ") || a.isValue("ПРОШЛЫЙ", "МИНУЛИЙ") || a.isValue("ПРОШЕДШИЙ", null)) {
                if (res.value === 0) 
                    res.value = 1;
                res.isValueRelate = true;
                heg = true;
            }
            else if (a.isValue("ПОЗАПРОШЛЫЙ", "ПОЗАМИНУЛИЙ")) {
                if (res.value === 0) 
                    res.value = 2;
                res.isValueRelate = true;
                heg = true;
            }
            else if (a.beginToken === a.endToken && (a.beginToken instanceof NumberToken) && a.beginToken.intValue !== null) {
                if (res.typ !== DateExTokenDateExItemTokenType.DAYOFWEEK) 
                    res.value = a.beginToken.intValue;
            }
            else if (a.isValue("ЭТОТ", "ЦЕЙ") || a.isValue("ТЕКУЩИЙ", "ПОТОЧНИЙ")) 
                res.isValueRelate = true;
            else if (a.isValue("ПЕРВЫЙ", "ПЕРШИЙ")) 
                res.value = 1;
            else if (a.isValue("ПОСЛЕДНИЙ", "ОСТАННІЙ")) {
                res.isValueRelate = true;
                res.isLast = true;
                if (((i + 1) < npt.adjectives.length) && (npt.adjectives[i + 1].beginToken instanceof NumberToken) && npt.adjectives[i + 1].beginToken.intValue !== null) {
                    i++;
                    res.value = -npt.adjectives[i].beginToken.intValue;
                    res.isLast = true;
                }
                else if (i > 0 && (npt.adjectives[i - 1].beginToken instanceof NumberToken) && npt.adjectives[i - 1].beginToken.intValue !== null) {
                    res.value = -npt.adjectives[i - 1].beginToken.intValue;
                    res.isLast = true;
                }
            }
            else if (a.isValue("ПРЕДПОСЛЕДНИЙ", "ПЕРЕДОСТАННІЙ")) {
                res.isValueRelate = true;
                res.isLast = true;
                res.value = -1;
            }
            else if (a.isValue("БЛИЖАЙШИЙ", "НАЙБЛИЖЧИЙ") && res.typ === DateExTokenDateExItemTokenType.DAYOFWEEK) {
            }
            else 
                return null;
        }
        if (npt.anafor !== null) {
            if (npt.anafor.isValue("ЭТОТ", "ЦЕЙ")) {
                if (npt.morph.number !== MorphNumber.SINGULAR) 
                    return null;
                if (res.value === 0) 
                    res.isValueRelate = true;
                if (prev === null || prev.length === 0) {
                    if (t.previous !== null && t.previous.getMorphClassInDictionary().isPreposition) {
                    }
                    else if (t.getMorphClassInDictionary().isPreposition) {
                    }
                    else if (ty === DateExTokenDateExItemTokenType.YEAR || ty === DateExTokenDateExItemTokenType.MONTH || ty === DateExTokenDateExItemTokenType.WEEK) {
                    }
                    else 
                        return null;
                }
            }
            else 
                return null;
        }
        let ch = false;
        if (!noCorrAfter && res.endToken.next !== null) {
            let tt = res.endToken.next;
            let tt0 = res.beginToken;
            if (tt.isValue("СПУСТЯ", null) || tt0.isValue("СПУСТЯ", null) || tt0.isValue("ЧЕРЕЗ", null)) {
                ch = true;
                res.isValueRelate = true;
                if (res.value === 0) 
                    res.value = 1;
                res.endToken = tt;
            }
            else if (tt.isValue("НАЗАД", null)) {
                ch = true;
                res.isValueRelate = true;
                if (res.value === 0) 
                    res.value = -1;
                else 
                    res.value = -res.value;
                res.endToken = tt;
            }
            else if (tt.isValue("ТОМУ", null) && tt.next !== null && tt.next.isValue("НАЗАД", null)) {
                ch = true;
                res.isValueRelate = true;
                if (res.value === 0) 
                    res.value = -1;
                else 
                    res.value = -res.value;
                res.endToken = tt.next;
            }
        }
        if (heg) 
            res.value = -res.value;
        if (t.previous !== null) {
            if (t.previous.isValue("ЧЕРЕЗ", null) || t.previous.isValue("СПУСТЯ", null)) {
                res.isValueRelate = true;
                if (res.value === 0) 
                    res.value = 1;
                res.beginToken = t.previous;
                ch = true;
            }
            else if (t.previous.isValue("ЗА", null) && res.value === 0) {
                if (!npt.morph._case.isAccusative) 
                    return null;
                if (npt.endToken.next !== null && npt.endToken.next.isValue("ДО", null)) 
                    return null;
                if (npt.beginToken === npt.endToken) 
                    return null;
                if (!res.isLast) {
                    res.isValueRelate = true;
                    ch = true;
                }
            }
        }
        if (res.beginToken === res.endToken) {
            if (t.previous !== null && t.previous.isValue("ПО", null)) 
                return null;
        }
        if (ch && res.typ !== DateExTokenDateExItemTokenType.DAY) {
            if (res.typ === DateExTokenDateExItemTokenType.WEEK) {
                res.value *= 7;
                res.typ = DateExTokenDateExItemTokenType.DAY;
            }
            else if (res.typ === DateExTokenDateExItemTokenType.MONTH) {
                res.value *= 30;
                res.typ = DateExTokenDateExItemTokenType.DAY;
            }
            else if (res.typ === DateExTokenDateExItemTokenType.QUARTAL) {
                res.value *= 91;
                res.typ = DateExTokenDateExItemTokenType.DAY;
            }
            else if (res.typ === DateExTokenDateExItemTokenType.YEAR) {
                res.value *= 365;
                res.typ = DateExTokenDateExItemTokenType.DAY;
            }
        }
        return res;
    }
    
    compareTo(other) {
        if ((this.typ.value()) < (other.typ.value())) 
            return -1;
        if ((this.typ.value()) > (other.typ.value())) 
            return 1;
        return 0;
    }
    
    static _new935(_arg1, _arg2, _arg3, _arg4) {
        let res = new DateExToken.DateExItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isValueRelate = _arg4;
        return res;
    }
    
    static _new938(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateExToken.DateExItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.src = _arg5;
        return res;
    }
    
    static _new941(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateExToken.DateExItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.isValueRelate = _arg5;
        return res;
    }
    
    static _new960(_arg1, _arg2, _arg3, _arg4) {
        let res = new DateExToken.DateExItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new1026(_arg1, _arg2, _arg3) {
        let res = new DateExToken.DateExItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
}


module.exports = DateExToken