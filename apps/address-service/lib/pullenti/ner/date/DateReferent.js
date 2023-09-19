/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphNumber = require("./../../morph/MorphNumber");
const MorphLang = require("./../../morph/MorphLang");
const MiscHelper = require("./../core/MiscHelper");
const NumberHelper = require("./../core/NumberHelper");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const ReferentClass = require("./../metadata/ReferentClass");
const DatePointerType = require("./DatePointerType");
const MetaDate = require("./internal/MetaDate");
const Referent = require("./../Referent");

/**
 * Сущность, представляющая дату
 * 
 */
class DateReferent extends Referent {
    
    constructor() {
        super(DateReferent.OBJ_TYPENAME);
        this.instanceOf = MetaDate.GLOBAL_META;
    }
    
    get dt() {
        if (this.year > 0 && this.month > 0 && this.day > 0) {
            if (this.month > 12 || this.year > 9999) 
                return null;
            if (this.day > Utils.daysInMonth(this.year, this.month)) 
                return null;
            let h = this.hour;
            let m = this.minute;
            let s = this.second;
            if (h < 0) 
                h = 0;
            if (m < 0) 
                m = 0;
            if (s < 0) 
                s = 0;
            try {
                return new Date(this.year, this.month - 1, this.day, h, m, (s >= 0 && (s < 60) ? s : 0));
            } catch (ex) {
            }
        }
        return null;
    }
    set dt(value) {
        return value;
    }
    
    get isRelative() {
        if (this.getStringValue(DateReferent.ATTR_ISRELATIVE) === "true") 
            return true;
        if (this.pointer === DatePointerType.TODAY) 
            return true;
        if (this.higher === null) 
            return false;
        return this.higher.isRelative;
    }
    set isRelative(value) {
        this.addSlot(DateReferent.ATTR_ISRELATIVE, (value ? "true" : null), true, 0);
        return value;
    }
    
    /**
     * Вычислить дату-время (одну)
     * @param now текущая дата (для относительных дат)
     * @param tense время (-1 - прошлое, 0 - любое, 1 - будущее) - испрользуется 
     * при неоднозначных случаях
     * @return дата-время или null
     */
    calculateDate(now, tense = 0) {
        const DateRelHelper = require("./internal/DateRelHelper");
        return DateRelHelper.calculateDate(this, now, tense);
    }
    
    /**
     * Вычислить диапазон дат (если не диапазон, то from = to)
     * @param now текущая дата-время
     * @param from результирующее начало диапазона
     * @param to результирующий конец диапазона
     * @param tense время (-1 - прошлое, 0 - любое, 1 - будущее) - используется 
     * при неоднозначных случаях 
     * Например, 7 сентября, а сейчас лето, то какой это год? При +1 - этот, при -1 - предыдущий
     * @return признак корректности
     */
    calculateDateRange(now, from, to, tense = 0) {
        const DateRelHelper = require("./internal/DateRelHelper");
        let inoutres1159 = DateRelHelper.calculateDateRange(this, now, from, to, tense);
        return inoutres1159;
    }
    
    get century() {
        if (this.higher !== null) 
            return this.higher.century;
        let cent = this.getIntValue(DateReferent.ATTR_CENTURY, 0);
        if (cent !== 0) 
            return cent;
        let _year = this.year;
        if (_year > 0) {
            cent = Utils.intDiv(_year, 100);
            cent++;
            return cent;
        }
        else if (_year < 0) {
            cent = Utils.intDiv(_year, 100);
            cent--;
            return cent;
        }
        return 0;
    }
    set century(value) {
        this.addSlot(DateReferent.ATTR_CENTURY, value, true, 0);
        return value;
    }
    
    get decade() {
        if (this.higher !== null) 
            return this.higher.decade;
        else 
            return this.getIntValue(DateReferent.ATTR_DECADE, 0);
    }
    set decade(value) {
        this.addSlot(DateReferent.ATTR_DECADE, value, true, 0);
        return value;
    }
    
    get year() {
        if (this.higher !== null) 
            return this.higher.year;
        else 
            return this.getIntValue(DateReferent.ATTR_YEAR, 0);
    }
    set year(value) {
        this.addSlot(DateReferent.ATTR_YEAR, value, true, 0);
        return value;
    }
    
    get halfyear() {
        if (this.higher !== null) 
            return this.higher.halfyear;
        else 
            return this.getIntValue(DateReferent.ATTR_HALFYEAR, 0);
    }
    set halfyear(value) {
        this.addSlot(DateReferent.ATTR_HALFYEAR, value, true, 0);
        return value;
    }
    
    get quartal() {
        if (this.findSlot(DateReferent.ATTR_QUARTAL, null, true) === null && this.higher !== null) 
            return this.higher.quartal;
        else 
            return this.getIntValue(DateReferent.ATTR_QUARTAL, 0);
    }
    set quartal(value) {
        this.addSlot(DateReferent.ATTR_QUARTAL, value, true, 0);
        return value;
    }
    
    get season() {
        if (this.findSlot(DateReferent.ATTR_SEASON, null, true) === null && this.higher !== null) 
            return this.higher.season;
        else 
            return this.getIntValue(DateReferent.ATTR_SEASON, 0);
    }
    set season(value) {
        this.addSlot(DateReferent.ATTR_SEASON, value, true, 0);
        return value;
    }
    
    get month() {
        if (this.findSlot(DateReferent.ATTR_MONTH, null, true) === null && this.higher !== null) 
            return this.higher.month;
        else 
            return this.getIntValue(DateReferent.ATTR_MONTH, 0);
    }
    set month(value) {
        this.addSlot(DateReferent.ATTR_MONTH, value, true, 0);
        return value;
    }
    
    get week() {
        if (this.findSlot(DateReferent.ATTR_WEEK, null, true) === null && this.higher !== null) 
            return this.higher.week;
        else 
            return this.getIntValue(DateReferent.ATTR_WEEK, 0);
    }
    set week(value) {
        this.addSlot(DateReferent.ATTR_WEEK, value, true, 0);
        return value;
    }
    
    get day() {
        if (this.findSlot(DateReferent.ATTR_DAY, null, true) === null && this.higher !== null) 
            return this.higher.day;
        else 
            return this.getIntValue(DateReferent.ATTR_DAY, 0);
    }
    set day(value) {
        this.addSlot(DateReferent.ATTR_DAY, value, true, 0);
        return value;
    }
    
    get dayOfWeek() {
        if (this.findSlot(DateReferent.ATTR_DAYOFWEEK, null, true) === null && this.higher !== null) 
            return this.higher.dayOfWeek;
        else 
            return this.getIntValue(DateReferent.ATTR_DAYOFWEEK, 0);
    }
    set dayOfWeek(value) {
        this.addSlot(DateReferent.ATTR_DAYOFWEEK, value, true, 0);
        return value;
    }
    
    get hour() {
        return this.getIntValue(DateReferent.ATTR_HOUR, -1);
    }
    set hour(value) {
        this.addSlot(DateReferent.ATTR_HOUR, value, true, 0);
        return value;
    }
    
    get minute() {
        return this.getIntValue(DateReferent.ATTR_MINUTE, -1);
    }
    set minute(value) {
        this.addSlot(DateReferent.ATTR_MINUTE, value, true, 0);
        return value;
    }
    
    get second() {
        return this.getIntValue(DateReferent.ATTR_SECOND, -1);
    }
    set second(value) {
        this.addSlot(DateReferent.ATTR_SECOND, value, true, 0);
        return value;
    }
    
    get higher() {
        return Utils.as(this.getSlotValue(DateReferent.ATTR_HIGHER), DateReferent);
    }
    set higher(value) {
        this.addSlot(DateReferent.ATTR_HIGHER, value, true, 0);
        return value;
    }
    
    get pointer() {
        let s = this.getStringValue(DateReferent.ATTR_POINTER);
        if (s === null) 
            return DatePointerType.NO;
        try {
            let res = DatePointerType.of(s);
            if (res instanceof DatePointerType) 
                return DatePointerType.of(res);
        } catch (ex1160) {
        }
        return DatePointerType.NO;
    }
    set pointer(value) {
        if (value !== DatePointerType.NO) 
            this.addSlot(DateReferent.ATTR_POINTER, value.toString(), true, 0);
        return value;
    }
    
    get parentReferent() {
        return this.higher;
    }
    
    static canBeHigher(hi, lo) {
        if (lo === null || hi === null) 
            return false;
        if (lo.higher === hi) 
            return true;
        if (lo.higher !== null && lo.higher.canBeEquals(hi, ReferentsEqualType.WITHINONETEXT)) 
            return true;
        if (lo.higher !== null) 
            return false;
        if (lo.hour >= 0) {
            if (hi.hour >= 0) 
                return false;
            if (lo.day > 0) 
                return false;
            return true;
        }
        if (hi.year > 0 && lo.year <= 0) {
            if (hi.month > 0) 
                return false;
            return true;
        }
        return false;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        return this._ToString(shortVariant, lang, lev, 0);
    }
    
    _ToString(shortVariant, lang, lev, fromRange) {
        const DateRelHelper = require("./internal/DateRelHelper");
        let res = new StringBuilder();
        let p = this.pointer;
        if (lang === null) 
            lang = MorphLang.RU;
        if (this.isRelative) {
            if (this.pointer === DatePointerType.TODAY) {
                res.append("сейчас");
                if (!shortVariant) 
                    DateRelHelper.appendToString(this, res);
                return res.toString();
            }
            let word = null;
            let val = 0;
            let back = false;
            let isLocalRel = this.getStringValue(DateReferent.ATTR_ISRELATIVE) === "true";
            for (const s of this.slots) {
                if (s.typeName === DateReferent.ATTR_CENTURY) {
                    word = "век";
                    let wrapval1161 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1161);
                    val = wrapval1161.value;
                }
                else if (s.typeName === DateReferent.ATTR_DECADE) {
                    word = "декада";
                    let wrapval1162 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1162);
                    val = wrapval1162.value;
                }
                else if (s.typeName === DateReferent.ATTR_HALFYEAR) {
                    word = "полугодие";
                    let wrapval1163 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1163);
                    val = wrapval1163.value;
                }
                else if (s.typeName === DateReferent.ATTR_SEASON) {
                    let wrapval1164 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1164);
                    val = wrapval1164.value;
                    if (val === 1) 
                        res.append((lang.isEn ? "winter" : "зима"));
                    else if (val === 2) 
                        res.append((lang.isEn ? "spring" : "весна"));
                    else if (val === 3) 
                        res.append((lang.isEn ? "summer" : (lang.isUa ? "літо" : "лето")));
                    else if (val === 4) 
                        res.append((lang.isEn ? "autumn" : (lang.isUa ? "осені" : "осень")));
                }
                else if (s.typeName === DateReferent.ATTR_YEAR) {
                    word = "год";
                    let wrapval1165 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1165);
                    val = wrapval1165.value;
                }
                else if (s.typeName === DateReferent.ATTR_MONTH) {
                    word = "месяц";
                    let wrapval1166 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1166);
                    val = wrapval1166.value;
                    if (!isLocalRel && val >= 1 && val <= 12) 
                        res.append(DateReferent.m_Month0[val - 1]);
                }
                else if (s.typeName === DateReferent.ATTR_DAY) {
                    word = "день";
                    let wrapval1167 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1167);
                    val = wrapval1167.value;
                    if ((!isLocalRel && this.month > 0 && this.month <= 12) && this.higher !== null && this.higher.getStringValue(DateReferent.ATTR_ISRELATIVE) !== "true") 
                        res.append(val).append(" ").append(DateReferent.m_Month[this.month - 1]);
                    else if (!isLocalRel) 
                        res.append(val).append(" число");
                }
                else if (s.typeName === DateReferent.ATTR_QUARTAL) {
                    word = "квартал";
                    let wrapval1168 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1168);
                    val = wrapval1168.value;
                }
                else if (s.typeName === DateReferent.ATTR_WEEK) {
                    word = "неделя";
                    let wrapval1169 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1169);
                    val = wrapval1169.value;
                }
                else if (s.typeName === DateReferent.ATTR_HOUR) {
                    word = "час";
                    let wrapval1170 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1170);
                    val = wrapval1170.value;
                    if (!isLocalRel) 
                        res.append(Utils.correctToString((val).toString(10), 2, true)).append(":").append(Utils.correctToString((this.minute).toString(10), 2, true));
                }
                else if (s.typeName === DateReferent.ATTR_MINUTE) {
                    word = "минута";
                    let wrapval1171 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1171);
                    val = wrapval1171.value;
                }
                else if (s.typeName === DateReferent.ATTR_DAYOFWEEK) {
                    let wrapval1172 = new RefOutArgWrapper();
                    Utils.tryParseInt(Utils.asString(s.value), wrapval1172);
                    val = wrapval1172.value;
                    if (!isLocalRel) 
                        res.append((val >= 1 && val <= 7 ? DateReferent.m_WeekDayEx[val - 1] : "?"));
                    else {
                        if (val < 0) {
                            val = -val;
                            back = true;
                        }
                        if (val > 0 && val <= 7) {
                            res.append((val === 7 ? (back ? "прошлое" : "будущее") : ((val === 3 || val === 6) ? (back ? "прошлая" : "будущая") : (back ? "прошлый" : "будущий")))).append(" ").append(DateReferent.m_WeekDayEx[val - 1]);
                            break;
                        }
                    }
                }
            }
            if (word !== null && isLocalRel) {
                if (val === 0) 
                    res.append((word === "неделя" || word === "минута" ? "текущая" : "текущий")).append(" ").append(word);
                else if (val > 0 && !back) 
                    res.append(val).append(" ").append(MiscHelper.getTextMorphVarByCaseAndNumberEx(word, null, MorphNumber.UNDEFINED, val.toString())).append(" вперёд");
                else {
                    val = -val;
                    res.append(val).append(" ").append(MiscHelper.getTextMorphVarByCaseAndNumberEx(word, null, MorphNumber.UNDEFINED, val.toString())).append(" назад");
                }
            }
            else if (!isLocalRel && res.length === 0) 
                res.append(val).append(" ").append(MiscHelper.getTextMorphVarByCaseAndNumberEx(word, null, MorphNumber.UNDEFINED, val.toString()));
            if (!shortVariant) 
                DateRelHelper.appendToString(this, res);
            if (fromRange === 1) 
                res.insert(0, ((lang.isUa ? "з" : (lang.isEn ? "from" : "с")) + " "));
            else if (fromRange === 2) 
                res.insert(0, (lang.isEn ? "to " : "по "));
            return res.toString();
        }
        if (fromRange === 1) 
            res.append((lang.isUa ? "з" : (lang.isEn ? "from" : "с"))).append(" ");
        else if (fromRange === 2) 
            res.append((lang.isEn ? "to " : "по "));
        if (p !== DatePointerType.NO) {
            let val = MetaDate.POINTER.convertInnerValueToOuterValue(p.toString(), lang);
            if (fromRange === 0 || lang.isEn) {
            }
            else if (fromRange === 1) {
                if (p === DatePointerType.BEGIN) 
                    val = (lang.isUa ? "початку" : "начала");
                else if (p === DatePointerType.CENTER) 
                    val = (lang.isUa ? "середини" : "середины");
                else if (p === DatePointerType.END) 
                    val = (lang.isUa ? "кінця" : "конца");
                else if (p === DatePointerType.TODAY) 
                    val = (lang.isUa ? "цього часу" : "настоящего времени");
            }
            else if (fromRange === 2) {
                if (p === DatePointerType.BEGIN) 
                    val = (lang.isUa ? "початок" : "начало");
                else if (p === DatePointerType.CENTER) 
                    val = (lang.isUa ? "середину" : "середину");
                else if (p === DatePointerType.END) 
                    val = (lang.isUa ? "кінець" : "конец");
                else if (p === DatePointerType.TODAY) 
                    val = (lang.isUa ? "теперішній час" : "настоящее время");
            }
            res.append(val).append(" ");
        }
        if (this.dayOfWeek > 0) {
            if (lang.isEn) 
                res.append(DateReferent.m_WeekDayEn[this.dayOfWeek - 1]).append(", ");
            else 
                res.append(DateReferent.m_WeekDay[this.dayOfWeek - 1]).append(", ");
        }
        let y = this.year;
        let m = this.month;
        let d = this.day;
        let cent = this.century;
        let ten = this.decade;
        if (y === 0 && cent !== 0) {
            let isBc = cent < 0;
            if (cent < 0) 
                cent = -cent;
            res.append(NumberHelper.getNumberRoman(cent));
            if (lang.isUa) 
                res.append(" century");
            else if (m > 0 || p !== DatePointerType.NO || fromRange === 1) 
                res.append((lang.isUa ? " віка" : " века"));
            else 
                res.append((lang.isUa ? " вік" : " век"));
            if (isBc) 
                res.append((lang.isUa ? " до н.е." : " до н.э."));
            return res.toString();
        }
        if (y === 0 && ten !== 0) 
            res.append(ten).append(" ").append((lang.isEn ? "decade" : "декада"));
        if (d > 0) 
            res.append(d);
        if (m > 0 && m <= 12) {
            if (res.length > 0 && res.charAt(res.length - 1) !== ' ') 
                res.append(' ');
            if (lang.isUa) 
                res.append((d > 0 || p !== DatePointerType.NO || fromRange !== 0 ? DateReferent.m_MonthUA[m - 1] : DateReferent.m_Month0UA[m - 1]));
            else if (lang.isEn) 
                res.append(DateReferent.m_MonthEN[m - 1]);
            else 
                res.append((d > 0 || p !== DatePointerType.NO || fromRange !== 0 ? DateReferent.m_Month[m - 1] : DateReferent.m_Month0[m - 1]));
        }
        if (y !== 0) {
            let isBc = y < 0;
            if (y < 0) 
                y = -y;
            if (res.length > 0 && res.charAt(res.length - 1) !== ' ') 
                res.append(' ');
            if (lang !== null && lang.isEn) 
                res.append(y);
            else if (shortVariant) 
                res.append(y).append((lang.isUa ? "р" : "г"));
            else if (m > 0 || p !== DatePointerType.NO || fromRange === 1) 
                res.append(y).append(" ").append((lang.isUa ? "року" : "года"));
            else 
                res.append(y).append(" ").append((lang.isUa ? "рік" : "год"));
            if (isBc) 
                res.append((lang.isUa ? " до н.е." : (lang.isEn ? "BC" : " до н.э.")));
        }
        let h = this.hour;
        let mi = this.minute;
        let se = this.second;
        if (h >= 0 && mi >= 0) {
            if (res.length > 0) 
                res.append(' ');
            res.append(Utils.correctToString((h).toString(10), 2, true)).append(":").append(Utils.correctToString((mi).toString(10), 2, true));
            if (se >= 0) 
                res.append(":").append(Utils.correctToString((se).toString(10), 2, true));
        }
        if (res.length === 0) {
            if (this.quartal !== 0) 
                res.append(this.quartal).append("-й квартал");
        }
        if (res.length === 0) 
            return "?";
        while (res.charAt(res.length - 1) === ' ' || res.charAt(res.length - 1) === ',') {
            res.length = res.length - 1;
        }
        if (!shortVariant && this.isRelative) 
            DateRelHelper.appendToString(this, res);
        if (!shortVariant && this.findSlot(DateReferent.ATTR_NEWSTYLE, null, true) !== null) {
            let _dt = Utils.as(this.getSlotValue(DateReferent.ATTR_NEWSTYLE), DateReferent);
            if (_dt !== null) 
                res.append(" (новый стиль: ").append(_dt.toStringEx(shortVariant, lang, lev + 1)).append(")");
        }
        return res.toString().trim();
    }
    
    canBeEquals(obj, typ) {
        let sd = Utils.as(obj, DateReferent);
        if (sd === null) 
            return false;
        if (sd.isRelative !== this.isRelative) 
            return false;
        if (sd.century !== this.century) 
            return false;
        if (sd.decade !== this.decade) 
            return false;
        if (sd.season !== this.season) 
            return false;
        if (sd.year !== this.year) 
            return false;
        if (sd.halfyear !== this.halfyear) 
            return false;
        if (sd.month !== this.month) 
            return false;
        if (sd.day !== this.day) 
            return false;
        if (sd.hour !== this.hour) 
            return false;
        if (sd.minute !== this.minute) 
            return false;
        if (sd.second !== this.second) 
            return false;
        if (sd.pointer !== this.pointer) 
            return false;
        if (sd.dayOfWeek > 0 && this.dayOfWeek > 0) {
            if (sd.dayOfWeek !== this.dayOfWeek) 
                return false;
        }
        return true;
    }
    
    static compare(d1, d2) {
        if (d1.century < d2.century) 
            return -1;
        if (d1.century > d2.century) 
            return 1;
        if (d1.decade < d2.decade) 
            return -1;
        if (d1.decade > d2.decade) 
            return 1;
        if (d1.year < d2.year) 
            return -1;
        if (d1.year > d2.year) 
            return 1;
        if (d1.quartal < d2.quartal) 
            return -1;
        if (d1.quartal > d2.quartal) 
            return 1;
        if (d1.month < d2.month) 
            return -1;
        if (d1.month > d2.month) 
            return 1;
        if (d1.day < d2.day) 
            return -1;
        if (d1.day > d2.day) 
            return 1;
        if (d1.hour < d2.hour) 
            return -1;
        if (d1.hour > d2.hour) 
            return 1;
        if (d1.minute < d2.minute) 
            return -1;
        if (d1.minute > d2.minute) 
            return 1;
        if (d1.second > d2.second) 
            return -1;
        if (d1.second < d2.second) 
            return 1;
        if (d1.pointer !== DatePointerType.NO && d2.pointer !== DatePointerType.NO) {
            let p1 = d1.pointer;
            let p2 = d2.pointer;
            if (p1 === DatePointerType.BEGIN || p1 === DatePointerType.CENTER || p1 === DatePointerType.END) {
                if (p2 === DatePointerType.BEGIN || p2 === DatePointerType.CENTER || p2 === DatePointerType.END) {
                    if ((p1.value()) < (p2.value())) 
                        return -1;
                    if ((p1.value()) > (p2.value())) 
                        return 1;
                }
            }
            if ((p1 === DatePointerType.WINTER || p1 === DatePointerType.SPRING || p1 === DatePointerType.SUMMER) || p1 === DatePointerType.AUTUMN) {
                if ((p2 === DatePointerType.WINTER || p2 === DatePointerType.SPRING || p2 === DatePointerType.SUMMER) || p2 === DatePointerType.AUTUMN) {
                    if ((p1.value()) < (p2.value())) 
                        return -1;
                    if ((p1.value()) > (p2.value())) 
                        return 1;
                }
            }
        }
        return 0;
    }
    
    /**
     * Проверка, что дата или диапазон определены с точностью до одного месяца
     * @param obj 
     * @return 
     */
    static isMonthDefined(obj) {
        const DateRangeReferent = require("./DateRangeReferent");
        let sd = Utils.as(obj, DateReferent);
        if (sd !== null) 
            return (sd.year > 0 && sd.month > 0);
        let sdr = Utils.as(obj, DateRangeReferent);
        if (sdr !== null) {
            if (sdr.dateFrom === null || sdr.dateTo === null) 
                return false;
            if (sdr.dateFrom.year === 0 || sdr.dateTo.year !== sdr.dateFrom.year) 
                return false;
            if (sdr.dateFrom.month === 0 || sdr.dateTo.month !== sdr.dateFrom.month) 
                return false;
            return true;
        }
        return false;
    }
    
    static _new1072(_arg1, _arg2) {
        let res = new DateReferent();
        res.higher = _arg1;
        res.day = _arg2;
        return res;
    }
    
    static _new1073(_arg1, _arg2) {
        let res = new DateReferent();
        res.month = _arg1;
        res.day = _arg2;
        return res;
    }
    
    static _new1074(_arg1) {
        let res = new DateReferent();
        res.year = _arg1;
        return res;
    }
    
    static _new1079(_arg1, _arg2) {
        let res = new DateReferent();
        res.hour = _arg1;
        res.minute = _arg2;
        return res;
    }
    
    static _new1081(_arg1) {
        let res = new DateReferent();
        res.pointer = _arg1;
        return res;
    }
    
    static _new1093(_arg1, _arg2) {
        let res = new DateReferent();
        res.month = _arg1;
        res.higher = _arg2;
        return res;
    }
    
    static _new1098(_arg1, _arg2) {
        let res = new DateReferent();
        res.day = _arg1;
        res.higher = _arg2;
        return res;
    }
    
    static _new1111(_arg1) {
        let res = new DateReferent();
        res.month = _arg1;
        return res;
    }
    
    static _new1113(_arg1, _arg2, _arg3) {
        let res = new DateReferent();
        res.hour = _arg1;
        res.minute = _arg2;
        res.higher = _arg3;
        return res;
    }
    
    static _new1131(_arg1, _arg2) {
        let res = new DateReferent();
        res.century = _arg1;
        res.isRelative = _arg2;
        return res;
    }
    
    static _new1132(_arg1, _arg2) {
        let res = new DateReferent();
        res.decade = _arg1;
        res.isRelative = _arg2;
        return res;
    }
    
    static _new1139(_arg1) {
        let res = new DateReferent();
        res.day = _arg1;
        return res;
    }
    
    static _new1141(_arg1) {
        let res = new DateReferent();
        res.higher = _arg1;
        return res;
    }
    
    static _new1142(_arg1, _arg2) {
        let res = new DateReferent();
        res.higher = _arg1;
        res.month = _arg2;
        return res;
    }
    
    static _new1152(_arg1) {
        let res = new DateReferent();
        res.dayOfWeek = _arg1;
        return res;
    }
    
    static static_constructor() {
        DateReferent.OBJ_TYPENAME = "DATE";
        DateReferent.ATTR_CENTURY = "CENTURY";
        DateReferent.ATTR_DECADE = "DECADE";
        DateReferent.ATTR_YEAR = "YEAR";
        DateReferent.ATTR_HALFYEAR = "HALFYEAR";
        DateReferent.ATTR_QUARTAL = "QUARTAL";
        DateReferent.ATTR_SEASON = "SEASON";
        DateReferent.ATTR_MONTH = "MONTH";
        DateReferent.ATTR_WEEK = "WEEK";
        DateReferent.ATTR_DAY = "DAY";
        DateReferent.ATTR_DAYOFWEEK = "DAYOFWEEK";
        DateReferent.ATTR_HOUR = "HOUR";
        DateReferent.ATTR_MINUTE = "MINUTE";
        DateReferent.ATTR_SECOND = "SECOND";
        DateReferent.ATTR_HIGHER = "HIGHER";
        DateReferent.ATTR_POINTER = "POINTER";
        DateReferent.ATTR_NEWSTYLE = "NEWSTYLE";
        DateReferent.ATTR_ISRELATIVE = "ISRELATIVE";
        DateReferent.m_Month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        DateReferent.m_Month0 = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
        DateReferent.m_MonthEN = ["jan", "fab", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        DateReferent.m_MonthUA = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
        DateReferent.m_Month0UA = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
        DateReferent.m_WeekDay = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
        DateReferent.m_WeekDayEx = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
        DateReferent.m_WeekDayEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    }
}


DateReferent.static_constructor();

module.exports = DateReferent