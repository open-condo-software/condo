/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphClass = require("./../../../morph/MorphClass");
const Unit = require("./Unit");
const MorphGender = require("./../../../morph/MorphGender");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const UnitsFactors = require("./UnitsFactors");
const TextToken = require("./../../TextToken");
const MetaToken = require("./../../MetaToken");
const MeasureKind = require("./../MeasureKind");

class UnitsHelper {
    
    static findUnit(v, fact) {
        if (fact !== UnitsFactors.NO) {
            for (const u of UnitsHelper.UNITS) {
                if (u.baseUnit !== null && u.factor === fact) {
                    if ((u.baseUnit.fullnameCyr === v || u.baseUnit.fullnameLat === v || u.baseUnit.nameCyr === v) || u.baseUnit.nameLat === v) 
                        return u;
                }
            }
        }
        for (const u of UnitsHelper.UNITS) {
            if ((u.fullnameCyr === v || u.fullnameLat === v || u.nameCyr === v) || u.nameLat === v) 
                return u;
        }
        return null;
    }
    
    static checkKeyword(ki, t) {
        if (t === null || ki === MeasureKind.UNDEFINED) 
            return false;
        if (t instanceof MetaToken) {
            for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
                if (UnitsHelper.checkKeyword(ki, tt)) 
                    return true;
            }
            return false;
        }
        if (!(t instanceof TextToken)) 
            return false;
        let term = t.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
        for (const u of UnitsHelper.UNITS) {
            if (u.kind === ki) {
                if (u.keywords.includes(term)) 
                    return true;
            }
        }
        if (UnitsHelper.m_KindsKeywords.containsKey(ki)) {
            if (UnitsHelper.m_KindsKeywords.get(ki).includes(term)) 
                return true;
        }
        return false;
    }
    
    static initialize() {
        if (UnitsHelper.m_Inited) 
            return;
        UnitsHelper.m_Inited = true;
        UnitsHelper.UNITS = new Array();
        UnitsHelper.TERMINS = new TerminCollection();
        UnitsHelper.m_KindsKeywords = new Hashtable();
        UnitsHelper.m_KindsKeywords.put(MeasureKind.SPEED, Array.from(["СКОРОСТЬ", "SPEED", "ШВИДКІСТЬ"]));
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        let u = null;
        let uu = null;
        let t = null;
        u = Unit._new1631("раз", "times", "раз", "times", MeasureKind.COUNT);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("РАЗ", u);
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("м", "m", "метр", "meter", MeasureKind.LENGTH);
        u.keywords.splice(u.keywords.length, 0, ...["ДЛИНА", "ДЛИННА", "ШИРИНА", "ГЛУБИНА", "ВЫСОТА", "РАЗМЕР", "ГАБАРИТ", "РАССТОЯНИЕ", "РАДИУС", "ПЕРИМЕТР", "ДИАМЕТР", "ТОЛЩИНА", "ПОДАЧА", "НАПОР", "ДАЛЬНОСТЬ", "ТИПОРАЗМЕР", "КАЛИБР", "СЕЧЕНИЕ", "LENGTH", "WIDTH", "DEPTH", "HEIGHT", "SIZE", "ENVELOPE", "DISTANCE", "RADIUS", "PERIMETER", "DIAMETER", "FLOW", "PRESSURE", "CALIBER", "ДОВЖИНА", "ШИРИНА", "ГЛИБИНА", "ВИСОТА", "РОЗМІР", "ГАБАРИТ", "ВІДСТАНЬ", "РАДІУС", "ДІАМЕТР", "НАТИСК", "КАЛІБР", "ПЕРЕРІЗ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("МЕТР", u);
        t.addVariant("МЕТРОВЫЙ", false);
        t.addVariant("МЕТРОВИЙ", false);
        t.addVariant("METER", false);
        t.addAbridge("М.");
        t.addAbridge("M.");
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MILLI, UnitsFactors.MICRO, UnitsFactors.NANO]) {
            UnitsHelper._addFactor(f, u, "М.", "M.", "МЕТР;МЕТРОВЫЙ", "МЕТР;МЕТРОВИЙ", "METER;METRE");
        }
        uu = Unit._new1631("миль", "mile", "морская миля", "mile", MeasureKind.LENGTH);
        uu.baseUnit = u;
        uu.baseMultiplier = 1852;
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("МИЛЯ", uu);
        t.addVariant("МОРСКАЯ МИЛЯ", false);
        t.addAbridge("NMI");
        t.addVariant("MILE", false);
        t.addVariant("NAUTICAL MILE", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("фут", "ft", "фут", "foot", u, 0.304799472, MeasureKind.LENGTH);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ФУТ", uu);
        t.addAbridge("FT.");
        t.addVariant("FOOT", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("дюйм", "in", "дюйм", "inch", u, 0.0254, MeasureKind.LENGTH);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ДЮЙМ", uu);
        t.addAbridge("IN");
        t.addVariant("INCH", false);
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("ар", "are", "ар", "are", MeasureKind.AREA);
        u.keywords.splice(u.keywords.length, 0, ...["ПЛОЩАДЬ", "ПРОЩИНА", "AREA", "SQWARE", "SPACE"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("АР", u);
        t.addVariant("ARE", false);
        t.addVariant("СОТКА", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1631("га", "ga", "гектар", "hectare", MeasureKind.AREA);
        uu.baseUnit = u;
        uu.baseMultiplier = 100;
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ГЕКТАР", uu);
        t.addVariant("HECTARE", false);
        t.addAbridge("ГА");
        t.addAbridge("GA");
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("г", "g", "грамм", "gram", MeasureKind.WEIGHT);
        u.keywords.splice(u.keywords.length, 0, ...["ВЕС", "ТЯЖЕСТЬ", "НЕТТО", "БРУТТО", "МАССА", "НАГРУЗКА", "ЗАГРУЗКА", "УПАКОВКА", "WEIGHT", "NET", "GROSS", "MASS", "ВАГА", "ТЯЖКІСТЬ", "МАСА"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ГРАММ", u);
        t.addAbridge("Г.");
        t.addAbridge("ГР.");
        t.addAbridge("G.");
        t.addAbridge("GR.");
        t.addVariant("ГРАММОВЫЙ", false);
        t.addVariant("ГРАММНЫЙ", false);
        t.addVariant("ГРАМОВИЙ", false);
        t.addVariant("GRAM", false);
        t.addVariant("GRAMME", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "Г.;ГР;", "G.;GR.", "ГРАМ;ГРАММ;ГРАММНЫЙ", "ГРАМ;ГРАМОВИЙ", "GRAM;GRAMME");
        }
        uu = Unit._new1637("ц", "centner", "центнер", "centner", u, 100000, MeasureKind.WEIGHT);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ЦЕНТНЕР", uu);
        t.addVariant("CENTNER", false);
        t.addVariant("QUINTAL", false);
        t.addAbridge("Ц.");
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("т", "t", "тонна", "tonne", u, 1000000, MeasureKind.WEIGHT);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ТОННА", uu);
        t.addVariant("TONNE", false);
        t.addVariant("TON", false);
        t.addAbridge("Т.");
        t.addAbridge("T.");
        UnitsHelper.TERMINS.add(t);
        UnitsHelper._addFactor(UnitsFactors.MEGA, uu, "Т", "T", "ТОННА;ТОННЫЙ", "ТОННА;ТОННИЙ", "TONNE;TON");
        u = Unit._new1631("л", "l", "литр", "liter", MeasureKind.VOLUME);
        u.keywords.splice(u.keywords.length, 0, ...["ОБЪЕМ", "ЕМКОСТЬ", "ВМЕСТИМОСЬ", "ОБСЯГ", "ЄМНІСТЬ", "МІСТКІСТЬ", "VOLUME", "CAPACITY"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ЛИТР", u);
        t.addAbridge("Л.");
        t.addAbridge("L.");
        t.addVariant("LITER", false);
        t.addVariant("LITRE", false);
        t.addVariant("ЛІТР", false);
        t.addVariant("ЛІТРОВИЙ", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MILLI, UnitsFactors.CENTI]) {
            UnitsHelper._addFactor(f, u, "Л.", "L.", "ЛИТР;ЛИТРОВЫЙ", "ЛІТР;ЛІТРОВИЙ", "LITER;LITRE");
        }
        uu = Unit._new1637("галлон", "gallon", "галлон", "gallon", u, 4.5461, MeasureKind.VOLUME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ГАЛЛОН", u);
        t.addVariant("ГАЛОН", false);
        t.addVariant("GALLON", false);
        t.addAbridge("ГАЛ");
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("баррель", "bbls", "баррель нефти", "barrel", u, 158.987, MeasureKind.VOLUME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("БАРРЕЛЬ", uu);
        t.addAbridge("BBLS");
        t.addVariant("БАРРЕЛЬ НЕФТИ", false);
        t.addVariant("BARRREL", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.USEC = (u = Unit._new1631("сек", "sec", "секунда", "second", MeasureKind.TIME));
        u.keywords.splice(u.keywords.length, 0, ...["ВРЕМЯ", "ПРОДОЛЖИТЕЛЬНОСТЬ", "ЗАДЕРЖКА", "ДЛИТЕЛЬНОСТЬ", "ДОЛГОТА", "TIME", "DURATION", "DELAY", "ЧАС", "ТРИВАЛІСТЬ", "ЗАТРИМКА"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("СЕКУНДА", u);
        t.addAbridge("С.");
        t.addAbridge("C.");
        t.addAbridge("СЕК");
        t.addAbridge("СЕК");
        t.addAbridge("S.");
        t.addAbridge("SEC");
        t.addVariant("СЕКУНДНЫЙ", false);
        t.addVariant("СЕКУНДНИЙ", false);
        t.addVariant("SECOND", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MILLI, UnitsFactors.MICRO]) {
            UnitsHelper._addFactor(f, u, "С.;СЕК", "C;S.;SEC;", "СЕКУНДА;СЕКУНДНЫЙ", "СЕКУНДА;СЕКУНДНИЙ", "SECOND");
        }
        UnitsHelper.UMINUTE = (uu = Unit._new1631("мин", "min", "минута", "minute", MeasureKind.TIME));
        uu.baseUnit = u;
        uu.baseMultiplier = 60;
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("МИНУТА", uu);
        t.addAbridge("МИН.");
        t.addAbridge("MIN.");
        t.addVariant("МИНУТНЫЙ", false);
        t.addVariant("ХВИЛИННИЙ", false);
        t.addVariant("ХВИЛИНА", false);
        t.addVariant("МІНУТА", false);
        t.addVariant("MINUTE", false);
        UnitsHelper.TERMINS.add(t);
        u = uu;
        UnitsHelper.UHOUR = (uu = Unit._new1637("ч", "h", "час", "hour", u, 60, MeasureKind.TIME));
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ЧАС", uu);
        t.addAbridge("Ч.");
        t.addAbridge("H.");
        t.addVariant("ЧАСОВОЙ", false);
        t.addVariant("HOUR", false);
        t.addVariant("ГОДИННИЙ", false);
        t.addVariant("ГОДИНА", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UDAY = (u = Unit._new1631("дн", "d", "день", "day", MeasureKind.TIME));
        u.keywords.splice(u.keywords.length, 0, ...UnitsHelper.USEC.keywords);
        u.keywords.splice(u.keywords.length, 0, ...["ПОСТАВКА", "СРОК", "РАБОТА", "ЗАВЕРШЕНИЕ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ДЕНЬ", u);
        t.addAbridge("ДН.");
        t.addAbridge("Д.");
        t.addVariant("DAY", false);
        t.addVariant("СУТКИ", false);
        t.addAbridge("СУТ.");
        t.addVariant("КАЛЕНДАРНЫЙ ДЕНЬ", false);
        t.addVariant("РАБОЧИЙ ДЕНЬ", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("нед", "week", "неделя", "week", u, 7, MeasureKind.TIME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("НЕДЕЛЯ", uu);
        t.addAbridge("НЕД");
        t.addVariant("WEEK", false);
        t.addVariant("ТИЖДЕНЬ", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("мес", "mon", "месяц", "month", u, 30, MeasureKind.TIME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("МЕСЯЦ", uu);
        t.addAbridge("МЕС");
        t.addAbridge("MON");
        t.addVariant("MONTH", false);
        t.addVariant("МІСЯЦЬ", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("квартал", "quarter", "квартал", "quarter", u, 91, MeasureKind.TIME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("КВАРТАЛ", uu);
        t.addAbridge("QUARTER");
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("г", "year", "год", "year", u, 365, MeasureKind.TIME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ГОД", uu);
        t.addAbridge("Г.");
        t.addAbridge("ГД");
        t.addVariant("YEAR", false);
        t.addVariant("РІК", false);
        t.addVariant("ЛЕТ", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1637("декада", "decade", "декада", "decade", u, 365 * 10, MeasureKind.TIME);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ДЕКАДА", uu);
        t.addVariant("DECADE", false);
        t.addVariant("ДЕСЯТИЛЕТИЕ", false);
        t.addVariant("ДЕСЯТИЛІТТЯ", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("рад", "rad", "радиан", "radian");
        UnitsHelper.UNITS.push(u);
        u.keywords.splice(u.keywords.length, 0, ...["УГОЛ"]);
        t = Termin._new170("РАДИАН", u);
        t.addVariant("РАД", false);
        t.addVariant("RADIAN", false);
        t.addVariant("RAD", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UGRADUS = new Unit("°", "°", "градус", "degree");
        UnitsHelper.UGRADUS.keywords.splice(UnitsHelper.UGRADUS.keywords.length, 0, ...["ТЕМПЕРАТУРА", "ШИРОТА", "ДОЛГОТА", "АЗИМУТ", "TEMPERATURE", "LATITUDE", "LONGITUDE", "AZIMUTH"]);
        UnitsHelper.UNITS.push(UnitsHelper.UGRADUS);
        t = Termin._new170("ГРАДУС", UnitsHelper.UGRADUS);
        t.addVariant("DEGREE", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UGRADUSC = Unit._new1631("°C", "°C", "градус Цельсия", "celsius degree", MeasureKind.TEMPERATURE);
        UnitsHelper.UGRADUSC.keywords.push("ТЕМПЕРАТУРА");
        UnitsHelper.UGRADUSC.keywords.push("TEMPERATURE");
        UnitsHelper.UGRADUS.psevdo.push(UnitsHelper.UGRADUSC);
        UnitsHelper.UNITS.push(UnitsHelper.UGRADUSC);
        t = Termin._new170("ГРАДУС ЦЕЛЬСИЯ", UnitsHelper.UGRADUSC);
        t.addVariant("ГРАДУС ПО ЦЕЛЬСИЮ", false);
        t.addVariant("CELSIUS DEGREE", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UGRADUSF = Unit._new1631("°F", "°F", "градус Фаренгейта", "Fahrenheit degree", MeasureKind.TEMPERATURE);
        UnitsHelper.UGRADUSF.keywords = UnitsHelper.UGRADUSC.keywords;
        UnitsHelper.UGRADUS.psevdo.push(UnitsHelper.UGRADUSF);
        UnitsHelper.UNITS.push(UnitsHelper.UGRADUSF);
        t = Termin._new170("ГРАДУС ФАРЕНГЕЙТА", UnitsHelper.UGRADUSF);
        t.addVariant("ГРАДУС ПО ФАРЕНГЕЙТУ", false);
        t.addVariant("FAHRENHEIT DEGREE", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UPERCENT = Unit._new1631("%", "%", "процент", "percent", MeasureKind.PERCENT);
        UnitsHelper.UNITS.push(UnitsHelper.UPERCENT);
        t = Termin._new170("ПРОЦЕНТ", UnitsHelper.UPERCENT);
        t.addVariant("ПРОЦ", false);
        t.addVariant("PERC", false);
        t.addVariant("PERCENT", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper.UALCO = new Unit("%(об)", "%(vol)", "объёмный процент", "volume percent");
        UnitsHelper.UALCO.keywords.splice(UnitsHelper.UALCO.keywords.length, 0, ...["КРЕПОСТЬ", "АЛКОГОЛЬ", "ALCOHOL", "СПИРТ", "АЛКОГОЛЬНЫЙ", "SPIRIT"]);
        UnitsHelper.UPERCENT.psevdo.push(UnitsHelper.UALCO);
        UnitsHelper.UGRADUS.psevdo.push(UnitsHelper.UALCO);
        UnitsHelper.UNITS.push(UnitsHelper.UALCO);
        t = Termin._new170("ОБЪЕМНЫЙ ПРОЦЕНТ", UnitsHelper.UALCO);
        t.addVariant("ГРАДУС", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("об", "rev", "оборот", "revolution");
        UnitsHelper.UGRADUS.keywords.splice(UnitsHelper.UGRADUS.keywords.length, 0, ...["ЧАСТОТА", "ВРАЩЕНИЕ", "ВРАЩАТЕЛЬНЫЙ", "СКОРОСТЬ", "ОБОРОТ", "FREQUENCY", "ROTATION", "ROTATIONAL", "SPEED", "ОБЕРТАННЯ", "ОБЕРТАЛЬНИЙ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ОБОРОТ", u);
        t.addAbridge("ОБ.");
        t.addAbridge("ROT.");
        t.addAbridge("REV.");
        t.addVariant("ROTATION", false);
        t.addVariant("REVOLUTION", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("В", "V", "вольт", "volt");
        u.keywords.splice(u.keywords.length, 0, ...["ЭЛЕКТРИЧЕСКИЙ", "ПОТЕНЦИАЛ", "НАПРЯЖЕНИЕ", "ЭЛЕКТРОДВИЖУЩИЙ", "ПИТАНИЕ", "ТОК", "ПОСТОЯННЫЙ", "ПЕРЕМЕННЫЙ", "ЕЛЕКТРИЧНИЙ", "ПОТЕНЦІАЛ", "НАПРУГА", "ЕЛЕКТРОРУШІЙНОЇ", "ХАРЧУВАННЯ", "СТРУМ", "ПОСТІЙНИЙ", "ЗМІННИЙ", "ELECTRIC", "POTENTIAL", "TENSION", "ELECTROMOTIVE", "FOOD", "CURRENT", "CONSTANT", "VARIABLE"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ВОЛЬТ", u);
        t.addVariant("VOLT", false);
        t.addAbridge("V");
        t.addAbridge("В.");
        t.addAbridge("B.");
        t.addVariant("VAC", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.MILLI, UnitsFactors.MILLI, UnitsFactors.MICRO]) {
            UnitsHelper._addFactor(f, u, "В.", "V.", "ВОЛЬТ;ВОЛЬТНЫЙ", "ВОЛЬТ;ВОЛЬТНІ", "VOLT");
        }
        u = new Unit("Вт", "W", "ватт", "watt");
        u.keywords.splice(u.keywords.length, 0, ...["МОЩНОСТЬ", "ЭНЕРГИЯ", "ПОТОК", "ИЗЛУЧЕНИЕ", "ЭНЕРГОПОТРЕБЛЕНИЕ", "ПОТУЖНІСТЬ", "ЕНЕРГІЯ", "ПОТІК", "ВИПРОМІНЮВАННЯ", "POWER", "ENERGY", "FLOW", "RADIATION"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ВАТТ", u);
        t.addAbridge("Вт");
        t.addAbridge("W");
        t.addVariant("WATT", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "ВТ.", "W.", "ВАТТ;ВАТТНЫЙ", "ВАТ;ВАТНИЙ", "WATT;WATTS");
        }
        uu = Unit._new1687("л.с.", "hp", "лошадиная сила", "horsepower", u, 735.49875);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ЛОШАДИНАЯ СИЛА", uu);
        t.addAbridge("Л.С.");
        t.addAbridge("ЛОШ.С.");
        t.addAbridge("ЛОШ.СИЛА");
        t.addAbridge("HP");
        t.addAbridge("PS");
        t.addAbridge("SV");
        t.addVariant("HORSEPOWER", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("Дж", "J", "джоуль", "joule");
        u.keywords.splice(u.keywords.length, 0, ...["РАБОТА", "ЭНЕРГИЯ", "ТЕПЛОТА", "ТЕПЛОВОЙ", "ТЕПЛОВЫДЕЛЕНИЕ", "МОЩНОСТЬ", "ХОЛОДИЛЬНЫЙ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ДЖОУЛЬ", u);
        t.addAbridge("ДЖ");
        t.addAbridge("J");
        t.addVariant("JOULE", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.TERA, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "ДЖ.", "J.", "ДЖОУЛЬ", "ДЖОУЛЬ", "JOULE");
        }
        uu = new Unit("кал", "cal", "калория", "calorie");
        uu.keywords.splice(uu.keywords.length, 0, ...["РАБОТА", "ЭНЕРГИЯ", "ТЕПЛОТА", "ТЕПЛОВОЙ", "ТЕПЛОВЫДЕЛЕНИЕ", "МОЩНОСТЬ", "ХОЛОДИЛЬНЫЙ", "ЭНТАЛЬПИЯ"]);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("КАЛОРИЯ", uu);
        t.addAbridge("КАЛ");
        t.addAbridge("CAL");
        t.addVariant("CALORIE", false);
        t.addVariant("КАЛОРІЯ", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA]) {
            UnitsHelper._addFactor(f, u, "кал", "cal", "КАЛОРИЯ", "КАЛОРІЯ", "CALORIE");
        }
        uu = new Unit("БТЕ", "BTU", "британская терминальная единица", "british terminal unit");
        uu.keywords = u.keywords;
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("БРИТАНСКАЯ ТЕРМИНАЛЬНАЯ ЕДИНИЦА", uu);
        t.addVariant("БРИТАНСКАЯ ТЕПЛОВАЯ ЕДИНИЦА", false);
        t.addAbridge("БТЕ");
        t.addAbridge("BTU");
        t.addVariant("BRITISH TERMINAL UNIT", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("К", "K", "кельвин", "kelvin");
        u.keywords.splice(u.keywords.length, 0, ...UnitsHelper.UGRADUSC.keywords);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КЕЛЬВИН", u);
        t.addAbridge("К.");
        t.addAbridge("K.");
        t.addVariant("KELVIN", false);
        t.addVariant("КЕЛЬВІН", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "К.", "K.", "КЕЛЬВИН", "КЕЛЬВІН", "KELVIN");
        }
        u = new Unit("Гц", "Hz", "герц", "herz");
        u.keywords.splice(u.keywords.length, 0, ...["ЧАСТОТА", "ЧАСТОТНЫЙ", "ПЕРИОДИЧНОСТЬ", "ПИТАНИЕ", "ЧАСТОТНИЙ", "ПЕРІОДИЧНІСТЬ", "FREQUENCY"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ГЕРЦ", u);
        t.addAbridge("HZ");
        t.addAbridge("ГЦ");
        t.addVariant("ГЕРЦОВЫЙ", false);
        t.addVariant("ГЕРЦОВИЙ", false);
        t.addVariant("HERZ", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MICRO]) {
            UnitsHelper._addFactor(f, u, "ГЦ.", "W.", "ГЕРЦ;ГЕРЦОВЫЙ", "ГЕРЦ;ГЕРЦОВИЙ", "HERZ");
        }
        UnitsHelper.UOM = (u = new Unit("Ом", "Ω", "Ом", "Ohm"));
        u.keywords.splice(u.keywords.length, 0, ...["СОПРОТИВЛЕНИЕ", "РЕЗИСТОР", "РЕЗИСТНЫЙ", "ИМПЕДАНС", "РЕЗИСТОРНЫЙ", "ОПІР", "РЕЗИСТИВНИЙ", "ІМПЕДАНС", "RESISTANCE", "RESISTOR", "RESISTIVE", "IMPEDANCE"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ОМ", UnitsHelper.UOM);
        t.addVariant("OHM", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MICRO, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "ОМ", "Ω", "ОМ", "ОМ", "OHM");
        }
        u = new Unit("А", "A", "ампер", "ampere");
        u.keywords.splice(u.keywords.length, 0, ...["ТОК", "СИЛА", "ЭЛЕКТРИЧЕСКИЙ", "ЭЛЕКТРИЧЕСТВО", "МАГНИТ", "МАГНИТОДВИЖУЩИЙ", "ПОТРЕБЛЕНИЕ", "CURRENT", "POWER", "ELECTRICAL", "ELECTRICITY", "MAGNET", "MAGNETOMOTIVE", "CONSUMPTION", "СТРУМ", "ЕЛЕКТРИЧНИЙ", "ЕЛЕКТРИКА", "МАГНІТ", "МАГНИТОДВИЖУЩИЙ", "СПОЖИВАННЯ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("АМПЕР", u);
        t.addAbridge("A");
        t.addAbridge("А");
        t.addVariant("АМПЕРНЫЙ", false);
        t.addVariant("AMP", false);
        t.addVariant("AMPERE", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1696("Ач", "Ah", "ампер-час", "ampere-hour", u, UnitsHelper.UHOUR);
        uu.keywords.splice(uu.keywords.length, 0, ...["ЗАРЯД", "АККУМУЛЯТОР", "АККУМУЛЯТОРНЫЙ", "ЗАРЯДКА", "БАТАРЕЯ", "CHARGE", "BATTERY", "CHARGING", "АКУМУЛЯТОР", "АКУМУЛЯТОРНИЙ"]);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("АМПЕР ЧАС", uu);
        t.addAbridge("АЧ");
        t.addAbridge("AH");
        t.addVariant("AMPERE HOUR", false);
        t.addVariant("АМПЕРЧАС", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MICRO, UnitsFactors.MILLI]) {
            let u1 = UnitsHelper._addFactor(f, u, "А", "A", "АМПЕР;АМПЕРНЫЙ", "АМПЕР;АМПЕРНИЙ", "AMPERE;AMP");
            let uu1 = UnitsHelper._addFactor(f, uu, "АЧ", "AH", "АМПЕР ЧАС", "АМПЕР ЧАС", "AMPERE HOUR");
            uu1.baseUnit = u1;
            uu1.multUnit = UnitsHelper.UHOUR;
        }
        uu = new Unit("ВА", "VA", "вольт-ампер", "volt-ampere");
        uu.multUnit = u;
        uu.baseUnit = UnitsHelper.findUnit("V", UnitsFactors.NO);
        uu.keywords.splice(uu.keywords.length, 0, ...["ТОК", "СИЛА", "МОЩНОСТЬ", "ЭЛЕКТРИЧЕСКИЙ", "ПЕРЕМЕННЫЙ"]);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("ВОЛЬТ-АМПЕР", uu);
        t.addAbridge("BA");
        t.addAbridge("BA");
        t.addVariant("VA", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MICRO, UnitsFactors.MILLI]) {
            let u1 = UnitsHelper._addFactor(f, uu, "ВА;BA", "VA", "ВОЛЬТ-АМПЕР", "ВОЛЬТ-АМПЕР", "VOLT-AMPERE");
        }
        u = new Unit("Кл", "C", "кулон", "coulomb");
        u.keywords.splice(u.keywords.length, 0, ...["ЭЛЕКТРИЧЕСКИЙ ЗАРЯД", "ИНДУКЦИЯ", "ЭЛЕКТРИЧЕСТВО", "ЕЛЕКТРИЧНИЙ ЗАРЯД", "ІНДУКЦІЯ", "ЕЛЕКТРИКА", "ELECTRIC CHARGE", "INDUCTION", "ELECTRICITY"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КУЛОН", u);
        t.addAbridge("КЛ");
        t.addAbridge("C");
        t.addVariant("COULOMB", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "КЛ", "C", "КУЛОН", "КУЛОН", "COULOMB");
        }
        u = new Unit("Вб", "Wb", "вебер", "weber");
        u.keywords.splice(u.keywords.length, 0, ...["МАГНИТНЫЙ ПОТОК", "МАГНИТ", "МАГНІТНИЙ ПОТІК", "МАГНІТ", "MAGNETIC FLUX", "MAGNET"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ВЕБЕР", u);
        t.addAbridge("ВБ");
        t.addAbridge("WB");
        t.addVariant("WEBER", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ВБ", "WB", "ВЕБЕР", "ВЕБЕР", "WEBER");
        }
        u = new Unit("Тл", "T", "тесла", "tesla");
        u.keywords.splice(u.keywords.length, 0, ...["ИНДУКЦИЯ", "МАГНИТНОЕ ПОЛЕ", "INDUCTION", "MAGNETIC FIELD", "ІНДУКЦІЯ", "МАГНІТНЕ ПОЛЕ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ТЕСЛА", u);
        t.addAbridge("ТЛ");
        t.addAbridge("T");
        t.addVariant("TESLA", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ТЛ", "T", "ТЕСЛА", "ТЕСЛА", "TESLA");
        }
        u = new Unit("Гн", "H", "генри", "henry");
        u.keywords.splice(u.keywords.length, 0, ...["ИНДУКЦИЯ", "ИНДУКТИВНОСТЬ", "ЭДС", "ІНДУКЦІЯ", "ІНДУКТИВНІСТЬ", "INDUCTION", "INDUCTANCE"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ГЕНРИ", u);
        t.addAbridge("ГН");
        t.addAbridge("H");
        t.addVariant("HENRY", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ГН", "H", "ГЕНРИ", "ГЕНРИ", "HENRY");
        }
        u = new Unit("Гр", "Gy", "грей", "gray");
        u.keywords.splice(u.keywords.length, 0, ...["ПОГЛОЩЕНИЕ", "ИЗЛУЧЕНИЕ", "ABSORPTION", "RADIATION", "ПОГЛИНАННЯ", "ВИПРОМІНЮВАННЯ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ГРЕЙ", u);
        t.addAbridge("ГР");
        t.addAbridge("GY");
        t.addVariant("GRAY", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ГР", "GY", "ГРЕЙ", "ГРЕЙ", "GRAY");
        }
        u = new Unit("Зв", "Sv", "зиверт", "sievert");
        u.keywords.splice(u.keywords.length, 0, ...["ДОЗА", "ИЗЛУЧЕНИЕ", "DOSE", "RADIATION", "ВИПРОМІНЮВАННЯ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ЗИВЕРТ", u);
        t.addAbridge("ЗВ");
        t.addAbridge("SV");
        t.addVariant("SIEVERT", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ЗВ", "SV", "ЗИВЕРТ", "ЗІВЕРТ", "SIEVERT");
        }
        u = new Unit("кат", "kat", "катал", "katal");
        u.keywords.splice(u.keywords.length, 0, ...["АКТИВНОСТЬ", "КАТАЛИЗАТОР", "ACTIVITY", "CATALYST", "АКТИВНІСТЬ", "КАТАЛІЗАТОР"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КАТАЛ", u);
        t.addAbridge("КАТ");
        t.addAbridge("KAT");
        t.addVariant("KATAL", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "КАТ", "KAT", "КАТАЛ", "КАТАЛ", "KATAL");
        }
        u = new Unit("лк", "lx", "люкс", "lux");
        u.keywords.splice(u.keywords.length, 0, ...["СВЕТ", "ОСВЕЩЕННОСТЬ", "ILLUMINANCE", "СВІТЛО", " ОСВІТЛЕНІСТЬ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ЛЮКС", u);
        t.addAbridge("ЛК");
        t.addAbridge("LX");
        t.addVariant("LUX", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ЛК", "LX", "ЛЮКС", "ЛЮКС", "LUX");
        }
        u = new Unit("лм", "lm", "люмен", "lumen");
        u.keywords.splice(u.keywords.length, 0, ...["СВЕТ", "ОСВЕЩЕННОСТЬ", "СВЕТОВОЙ ПОТОК", "ПОТОК СВЕТА", "VISIBLE LIGHT", "ILLUMINANCE", "СВІТЛО", " ОСВІТЛЕНІСТЬ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ЛЮМЕН", u);
        t.addAbridge("ЛМ");
        t.addAbridge("LM");
        t.addVariant("LUMEN", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.TERA, UnitsFactors.DECI, UnitsFactors.CENTI, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO, UnitsFactors.PICO]) {
            let u1 = UnitsHelper._addFactor(f, u, "ЛМ", "LM", "ЛЮМЕН", "ЛЮМЕН", "LUMEN");
        }
        u = new Unit("Б", "B", "белл", "bell");
        u.keywords.splice(u.keywords.length, 0, ...["ЗВУК", "ЗВУКОВОЙ", "ШУМ", "ШУМОВОЙ", "ГРОМКОСТЬ", "ГРОМКИЙ", "СИГНАЛ", "УСИЛЕНИЕ", "ЗАТУХАНИЕ", "ГАРМОНИЧЕСКИЙ", "ПОДАВЛЕНИЕ", "ЗВУКОВИЙ", "ШУМОВИЙ", "ГУЧНІСТЬ", "ГУЧНИЙ", "ПОСИЛЕННЯ", "ЗАГАСАННЯ", "ГАРМОНІЙНИЙ", "ПРИДУШЕННЯ", "SOUND", "NOISE", "VOLUME", "LOUD", "SIGNAL", "STRENGTHENING", "ATTENUATION", "HARMONIC", "SUPPRESSION"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("БЕЛЛ", u);
        t.addAbridge("Б.");
        t.addAbridge("B.");
        t.addAbridge("В.");
        t.addVariant("БЕЛ", false);
        t.addVariant("BELL", false);
        UnitsHelper.TERMINS.add(t);
        UnitsHelper._addFactor(UnitsFactors.DECI, u, "Б", "B", "БЕЛЛ;БЕЛ", "БЕЛЛ;БЕЛ", "BELL");
        u = new Unit("дБи", "dBi", "коэффициент усиления антенны", "dBi");
        u.keywords.splice(u.keywords.length, 0, ...["УСИЛЕНИЕ", "АНТЕННА", "АНТЕНА", "ПОСИЛЕННЯ", "GAIN", "ANTENNA"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("DBI", u);
        t.addVariant("ДБИ", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("дБм", "dBm", "опорная мощность", "dBm");
        u.keywords.splice(u.keywords.length, 0, ...["МОЩНОСТЬ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("DBM", u);
        t.addVariant("ДБМ", false);
        t.addVariant("ДВМ", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("Ф", "F", "фарад", "farad");
        u.keywords.splice(u.keywords.length, 0, ...["ЕМКОСТЬ", "ЭЛЕКТРИЧНСКИЙ", "КОНДЕНСАТОР"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ФАРАД", u);
        t.addAbridge("Ф.");
        t.addAbridge("ФА");
        t.addAbridge("F");
        t.addVariant("FARAD", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO, UnitsFactors.PICO]) {
            UnitsHelper._addFactor(f, u, "Ф.;ФА.", "F", "ФАРАД", "ФАРАД", "FARAD");
        }
        u = new Unit("Н", "N", "ньютон", "newton");
        u.keywords.splice(u.keywords.length, 0, ...["СИЛА", "МОМЕНТ", "НАГРУЗКА"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("НЬЮТОН", u);
        t.addAbridge("Н.");
        t.addAbridge("H.");
        t.addAbridge("N.");
        t.addVariant("NEWTON", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MEGA, UnitsFactors.KILO, UnitsFactors.MICRO, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "Н.", "N.", "НЬЮТОН", "НЬЮТОН", "NEWTON");
        }
        u = new Unit("моль", "mol", "моль", "mol");
        u.keywords.splice(u.keywords.length, 0, ...["МОЛЕКУЛА", "МОЛЕКУЛЯРНЫЙ", "КОЛИЧЕСТВО", "ВЕЩЕСТВО"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("МОЛЬ", u);
        t.addAbridge("МЛЬ");
        t.addVariant("МОЛ", false);
        t.addVariant("MOL", false);
        t.addVariant("MOLE", false);
        t.addVariant("ГРАММ МОЛЕКУЛА", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MEGA, UnitsFactors.KILO, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            UnitsHelper._addFactor(f, u, "МЛЬ", "MOL", "МОЛЬ", "МОЛЬ", "MOL");
        }
        u = new Unit("Бк", "Bq", "беккерель", "becquerel");
        u.keywords.splice(u.keywords.length, 0, ...["АКТИВНОСТЬ", "РАДИОАКТИВНЫЙ", "ИЗЛУЧЕНИЕ", "ИСТОЧНИК"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("БЕККЕРЕЛЬ", u);
        t.addAbridge("БК.");
        t.addVariant("BQ.", false);
        t.addVariant("БЕК", false);
        t.addVariant("БЕКЕРЕЛЬ", false);
        t.addVariant("BECQUEREL", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MEGA, UnitsFactors.KILO, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            UnitsHelper._addFactor(f, u, "БК.", "BQ.", "БЕККЕРЕЛЬ;БЕК", "БЕКЕРЕЛЬ", "BECQUEREL");
        }
        u = new Unit("См", "S", "сименс", "siemens");
        u.keywords.splice(u.keywords.length, 0, ...["ПРОВОДИМОСТЬ", "ЭЛЕКТРИЧЕСКИЙ", "ПРОВОДНИК"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("СИМЕНС", u);
        t.addAbridge("СМ.");
        t.addAbridge("CM.");
        t.addVariant("S.", false);
        t.addVariant("SIEMENS", false);
        t.addVariant("СІМЕНС", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.MEGA, UnitsFactors.KILO, UnitsFactors.MICRO, UnitsFactors.MILLI, UnitsFactors.NANO]) {
            UnitsHelper._addFactor(f, u, "СМ.", "S.", "СИМЕНС", "СІМЕНС", "SIEMENS");
        }
        u = new Unit("кд", "cd", "кандела", "candela");
        u.keywords.splice(u.keywords.length, 0, ...["СВЕТ", "СВЕТОВОЙ", "ПОТОК", "ИСТОЧНИК"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КАНДЕЛА", u);
        t.addAbridge("КД.");
        t.addVariant("CD.", false);
        t.addVariant("КАНДЕЛА", false);
        t.addVariant("CANDELA", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("Па", "Pa", "паскаль", "pascal");
        u.keywords.splice(u.keywords.length, 0, ...["ДАВЛЕНИЕ", "НАПРЯЖЕНИЕ", "ТЯЖЕСТЬ", "PRESSURE", "STRESS", "ТИСК", "НАПРУГА"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ПАСКАЛЬ", u);
        t.addAbridge("ПА");
        t.addAbridge("РА");
        t.addVariant("PA", false);
        t.addVariant("PASCAL", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.MICRO, UnitsFactors.MILLI]) {
            UnitsHelper._addFactor(f, u, "ПА", "PA", "ПАСКАЛЬ", "ПАСКАЛЬ", "PASCAL");
        }
        uu = Unit._new1687("бар", "bar", "бар", "bar", u, 100000);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("БАР", uu);
        t.addVariant("BAR", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1687("мм.рт.ст.", "mm Hg", "миллиметр ртутного столба", "millimeter of mercury", u, 133.332);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("МИЛЛИМЕТР РТУТНОГО СТОЛБА", uu);
        t.addAbridge("ММ.РТ.СТ.");
        t.addAbridge("MM.PT.CT");
        t.addAbridge("MM HG");
        t.addVariant("MMGH", false);
        t.addVariant("ТОРР", false);
        t.addVariant("TORR", false);
        t.addVariant("MILLIMETER OF MERCURY", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("бит", "bit", "бит", "bit");
        u.keywords.splice(u.keywords.length, 0, ...["ОБЪЕМ", "РАЗМЕР", "ПАМЯТЬ", "ЕМКОСТЬ", "ПЕРЕДАЧА", "ПРИЕМ", "ОТПРАВКА", "ОП", "ДИСК", "НАКОПИТЕЛЬ", "КЭШ", "ОБСЯГ", "РОЗМІР", "ВІДПРАВЛЕННЯ", "VOLUME", "SIZE", "MEMORY", "TRANSFER", "SEND", "RECEPTION", "RAM", "DISK", "HDD", "RAM", "ROM", "CD-ROM", "CASHE"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("БИТ", u);
        t.addVariant("BIT", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.TERA]) {
            UnitsHelper._addFactor(f, u, "БИТ", "BIT", "БИТ", "БИТ", "BIT");
        }
        uu = new Unit("б", "b", "байт", "byte");
        uu.keywords = u.keywords;
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("БАЙТ", uu);
        t.addVariant("BYTE", false);
        t.addAbridge("B.");
        t.addAbridge("Б.");
        t.addAbridge("В.");
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.TERA]) {
            UnitsHelper._addFactor(f, uu, "Б.", "B.", "БАЙТ", "БАЙТ", "BYTE");
        }
        u = new Unit("бод", "Bd", "бод", "baud");
        u.keywords.splice(u.keywords.length, 0, ...["СКОРОСТЬ", "ПЕРЕДАЧА", "ПРИЕМ", "ДАННЫЕ", "ОТПРАВКА"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("БОД", u);
        t.addAbridge("BD");
        t.addVariant("BAUD", false);
        UnitsHelper.TERMINS.add(t);
        for (const f of [UnitsFactors.KILO, UnitsFactors.MEGA, UnitsFactors.GIGA, UnitsFactors.TERA]) {
            UnitsHelper._addFactor(f, uu, "БОД", "BD.", "БОД", "БОД", "BAUD");
        }
        u = new Unit("гс", "gf", "грамм-сила", "gram-force");
        u.keywords.splice(u.keywords.length, 0, ...["СИЛА", "ДАВЛЕНИЕ"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("ГРАММ СИЛА", u);
        t.addAbridge("ГС");
        t.addVariant("POND", false);
        t.addVariant("ГРАМ СИЛА", false);
        t.addAbridge("GP.");
        t.addVariant("GRAM POND", false);
        t.addVariant("GRAM FORCE", false);
        UnitsHelper.TERMINS.add(t);
        uu = Unit._new1687("кгс", "kgf", "килограмм-сила", "kilogram-force", u, 1000);
        UnitsHelper.UNITS.push(uu);
        t = Termin._new170("КИЛОГРАММ СИЛА", uu);
        t.addAbridge("КГС");
        t.addVariant("KILOPOND", false);
        t.addVariant("КІЛОГРАМ СИЛА", false);
        t.addAbridge("KP.");
        t.addVariant("KILOGRAM POND", false);
        UnitsHelper.TERMINS.add(t);
        u = new Unit("dpi", "точек на дюйм", "dpi", "dots per inch");
        u.keywords.splice(u.keywords.length, 0, ...["РАЗРЕШЕНИЕ", "ЭКРАН", "МОНИТОР"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("DOTS PER INCH", u);
        t.addVariant("DPI", false);
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("IP", "IP", "IP", "IP", MeasureKind.IP);
        u.keywords.splice(u.keywords.length, 0, ...["ЗАЩИТА", "КЛАСС ЗАЩИТЫ", "PROTECTION", "PROTACTION RATING"]);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("IP", u);
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("кгU", "kgU", "килограмм урана", "kgU", MeasureKind.WEIGHT);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КГU", u);
        t.addVariant("КГ U", false);
        t.addVariant("КИЛОГРАММ УРАНА", false);
        t.addVariant("KGU", false);
        t.addVariant("KG U", false);
        UnitsHelper.TERMINS.add(t);
        u = Unit._new1631("кг", "kgZr", "килограмм циркония", "kgZr", MeasureKind.WEIGHT);
        UnitsHelper.UNITS.push(u);
        t = Termin._new170("КГZR", u);
        t.addVariant("КГ ZR", false);
        t.addVariant("КИЛОГРАММ ЦИРКОНИЯ", false);
        t.addVariant("KGZR", false);
        t.addVariant("KG ZR", false);
        UnitsHelper.TERMINS.add(t);
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
    }
    
    static _addFactor(f, u0, abbrCyr, abbrLat, namesRu, namesUa, namesEn) {
        let prefCyr = null;
        let prefLat = null;
        let prefRu = null;
        let prefUa = null;
        let prefEn = null;
        let mult = 1;
        switch (f) { 
        case UnitsFactors.CENTI: {
            prefCyr = "С";
            prefLat = "C";
            prefRu = "САНТИ";
            prefUa = "САНТИ";
            prefEn = "CENTI";
            mult = 0.1;
            break;
        }
        case UnitsFactors.DECI: {
            prefCyr = "Д";
            prefLat = "D";
            prefRu = "ДЕЦИ";
            prefUa = "ДЕЦИ";
            prefEn = "DECI";
            mult = 0.01;
            break;
        }
        case UnitsFactors.GIGA: {
            prefCyr = "Г";
            prefLat = "G";
            prefRu = "ГИГА";
            prefUa = "ГІГА";
            prefEn = "GIGA";
            mult = 1000000000;
            break;
        }
        case UnitsFactors.KILO: {
            prefCyr = "К";
            prefLat = "K";
            prefRu = "КИЛО";
            prefUa = "КІЛО";
            prefEn = "KILO";
            mult = 1000;
            break;
        }
        case UnitsFactors.MEGA: {
            prefCyr = "М";
            prefLat = "M";
            prefRu = "МЕГА";
            prefUa = "МЕГА";
            prefEn = "MEGA";
            mult = 1000000;
            break;
        }
        case UnitsFactors.MICRO: {
            prefCyr = "МК";
            prefLat = "MK";
            prefRu = "МИКРО";
            prefUa = "МІКРО";
            prefEn = "MICRO";
            mult = 0.0001;
            break;
        }
        case UnitsFactors.MILLI: {
            prefCyr = "М";
            prefLat = "M";
            prefRu = "МИЛЛИ";
            prefUa = "МІЛІ";
            prefEn = "MILLI";
            mult = 0.001;
            break;
        }
        case UnitsFactors.NANO: {
            prefCyr = "Н";
            prefLat = "N";
            prefRu = "НАНО";
            prefUa = "НАНО";
            prefEn = "NANO";
            mult = 0.0000000001;
            break;
        }
        case UnitsFactors.PICO: {
            prefCyr = "П";
            prefLat = "P";
            prefRu = "ПИКО";
            prefUa = "ПІКО";
            prefEn = "PICO";
            mult = 0.0000000000001;
            break;
        }
        case UnitsFactors.TERA: {
            prefCyr = "Т";
            prefLat = "T";
            prefRu = "ТЕРА";
            prefUa = "ТЕРА";
            prefEn = "TERA";
            mult = 1000000000000;
            break;
        }
        }
        let u = Unit._new1735(prefCyr.toLowerCase() + u0.nameCyr, prefLat.toLowerCase() + u0.nameLat, prefRu.toLowerCase() + u0.fullnameCyr, prefEn.toLowerCase() + u0.fullnameLat, f, mult, u0, u0.kind, u0.keywords);
        if (f === UnitsFactors.MEGA || f === UnitsFactors.TERA || f === UnitsFactors.GIGA) {
            u.nameCyr = prefCyr + u0.nameCyr;
            u.nameLat = prefLat + u0.nameLat;
        }
        UnitsHelper.UNITS.push(u);
        let nams = Utils.splitString(namesRu, ';', false);
        let t = Termin._new170(prefRu + nams[0], u);
        for (let i = 1; i < nams.length; i++) {
            if (!Utils.isNullOrEmpty(nams[i])) 
                t.addVariant(prefRu + nams[i], false);
        }
        for (const n of nams) {
            if (!Utils.isNullOrEmpty(n)) 
                t.addVariant(prefCyr + n, false);
        }
        for (const n of Utils.splitString(namesUa, ';', false)) {
            if (!Utils.isNullOrEmpty(n)) {
                t.addVariant(prefUa + n, false);
                t.addVariant(prefCyr + n, false);
            }
        }
        for (const n of Utils.splitString(namesEn, ';', false)) {
            if (!Utils.isNullOrEmpty(n)) {
                t.addVariant(prefEn + n, false);
                t.addVariant(prefLat + n, false);
            }
        }
        for (const n of Utils.splitString(abbrCyr, ';', false)) {
            if (!Utils.isNullOrEmpty(n)) 
                t.addAbridge(prefCyr + n);
        }
        for (const n of Utils.splitString(abbrLat, ';', false)) {
            if (!Utils.isNullOrEmpty(n)) 
                t.addAbridge(prefLat + n);
        }
        UnitsHelper.TERMINS.add(t);
        return u;
    }
    
    static static_constructor() {
        UnitsHelper.UNITS = new Array();
        UnitsHelper.TERMINS = new TerminCollection();
        UnitsHelper.UGRADUS = null;
        UnitsHelper.UGRADUSC = null;
        UnitsHelper.UGRADUSF = null;
        UnitsHelper.UPERCENT = null;
        UnitsHelper.UALCO = null;
        UnitsHelper.UOM = null;
        UnitsHelper.UDAY = null;
        UnitsHelper.UHOUR = null;
        UnitsHelper.UMINUTE = null;
        UnitsHelper.USEC = null;
        UnitsHelper.m_Inited = false;
        UnitsHelper.m_KindsKeywords = null;
    }
}


UnitsHelper.static_constructor();

module.exports = UnitsHelper