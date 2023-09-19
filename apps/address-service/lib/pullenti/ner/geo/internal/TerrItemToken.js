/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");
const XmlDocument = require("./../../../unisharp/XmlDocument");

const MorphNumber = require("./../../../morph/MorphNumber");
const Token = require("./../../Token");
const MetaToken = require("./../../MetaToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const GeoTokenData = require("./GeoTokenData");
const StreetItemType = require("./../../address/internal/StreetItemType");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphCollection = require("./../../MorphCollection");
const GeoAnalyzerData = require("./GeoAnalyzerData");
const ReferentToken = require("./../../ReferentToken");
const NumberToken = require("./../../NumberToken");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const GeoAnalyzer = require("./../GeoAnalyzer");
const MorphLang = require("./../../../morph/MorphLang");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const TerrTermin = require("./TerrTermin");
const MorphGender = require("./../../../morph/MorphGender");
const TerminCollection = require("./../../core/TerminCollection");
const IntOntologyCollection = require("./../../core/IntOntologyCollection");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const BracketHelper = require("./../../core/BracketHelper");
const TextToken = require("./../../TextToken");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const IntOntologyItem = require("./../../core/IntOntologyItem");
const PullentiNerAddressInternalResourceHelper = require("./../../address/internal/PullentiNerAddressInternalResourceHelper");
const Referent = require("./../../Referent");
const GeoReferent = require("./../GeoReferent");
const MiscLocationHelper = require("./MiscLocationHelper");

class TerrItemToken extends MetaToken {
    
    static initialize() {
        if (TerrItemToken.m_TerrOntology !== null) 
            return;
        TerrItemToken.m_TerrOntology = new IntOntologyCollection();
        TerrItemToken.M_TERR_ADJS = new TerminCollection();
        TerrItemToken.M_MANS_BY_STATE = new TerminCollection();
        TerrItemToken.m_UnknownRegions = new TerminCollection();
        TerrItemToken.m_TerrNounAdjectives = new TerminCollection();
        TerrItemToken.m_CapitalsByState = new TerminCollection();
        TerrItemToken.m_GeoAbbrs = new TerminCollection();
        let t = TerrTermin._new1461("РЕСПУБЛИКА", MorphGender.FEMINIE);
        t.addAbridge("РЕСП.");
        t.addAbridge("РЕСП-КА");
        t.addAbridge("РЕСПУБ.");
        t.addAbridge("РЕСПУБЛ.");
        t.addAbridge("Р-КА");
        t.addAbridge("РЕСП-КА");
        TerrItemToken.m_TerrOntology.add(t);
        TerrItemToken.m_TerrOntology.add(TerrTermin._new1462("РЕСПУБЛІКА", MorphLang.UA, MorphGender.FEMINIE));
        t = TerrTermin._new1463("ГОСУДАРСТВО", true, MorphGender.NEUTER);
        t.addAbridge("ГОС-ВО");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1464("ДЕРЖАВА", MorphLang.UA, true, MorphGender.FEMINIE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1461("АВТОНОМНАЯ СОВЕТСКАЯ СОЦИАЛИСТИЧЕСКАЯ РЕСПУБЛИКА", MorphGender.FEMINIE);
        t.acronym = "АССР";
        TerrItemToken.m_TerrOntology.add(t);
        for (const s of ["СОЮЗ", "СОДРУЖЕСТВО", "ФЕДЕРАЦИЯ", "КОНФЕДЕРАЦИЯ"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1466(s, true, true));
        }
        for (const s of ["СОЮЗ", "СПІВДРУЖНІСТЬ", "ФЕДЕРАЦІЯ", "КОНФЕДЕРАЦІЯ"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1467(s, MorphLang.UA, true, true));
        }
        for (const s of ["КОРОЛЕВСТВО", "КНЯЖЕСТВО", "ГЕРЦОГСТВО", "ИМПЕРИЯ", "ЦАРСТВО", "KINGDOM", "DUCHY", "EMPIRE"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1468(s, true));
        }
        for (const s of ["КОРОЛІВСТВО", "КНЯЗІВСТВО", "ГЕРЦОГСТВО", "ІМПЕРІЯ"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1469(s, MorphLang.UA, true));
        }
        for (const s of ["НЕЗАВИСИМЫЙ", "ОБЪЕДИНЕННЫЙ", "СОЕДИНЕННЫЙ", "НАРОДНЫЙ", "НАРОДНО", "ФЕДЕРАТИВНЫЙ", "ДЕМОКРАТИЧЕСКИЙ", "СОВЕТСКИЙ", "СОЦИАЛИСТИЧЕСКИЙ", "КООПЕРАТИВНЫЙ", "ИСЛАМСКИЙ", "АРАБСКИЙ", "МНОГОНАЦИОНАЛЬНЫЙ", "СУВЕРЕННЫЙ", "САМОПРОВОЗГЛАШЕННЫЙ", "НЕПРИЗНАННЫЙ"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1470(s, true, true));
        }
        for (const s of ["НЕЗАЛЕЖНИЙ", "ОБЄДНАНИЙ", "СПОЛУЧЕНИЙ", "НАРОДНИЙ", "ФЕДЕРАЛЬНИЙ", "ДЕМОКРАТИЧНИЙ", "РАДЯНСЬКИЙ", "СОЦІАЛІСТИЧНИЙ", "КООПЕРАТИВНИЙ", "ІСЛАМСЬКИЙ", "АРАБСЬКИЙ", "БАГАТОНАЦІОНАЛЬНИЙ", "СУВЕРЕННИЙ"]) {
            TerrItemToken.m_TerrOntology.add(TerrTermin._new1471(s, MorphLang.UA, true, true));
        }
        t = TerrTermin._new1472("ОБЛАСТЬ", true, MorphGender.FEMINIE);
        t.addAbridge("ОБЛ.");
        TerrItemToken.m_TerrNounAdjectives.add(Termin._new170("ОБЛАСТНОЙ", t));
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1474("REGION", true);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1475("ОБЛАСТЬ", MorphLang.UA, true, MorphGender.FEMINIE);
        t.addAbridge("ОБЛ.");
        TerrItemToken.m_Obl = t;
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1476(null, true, "АО");
        t.addVariant("АОБЛ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1477(null, MorphLang.UA, true, "АО");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1472("РАЙОН", true, MorphGender.MASCULINE);
        t.addAbridge("Р-Н");
        t.addAbridge("Р-ОН");
        t.addAbridge("РН.");
        TerrItemToken.m_TerrNounAdjectives.add(Termin._new170("РАЙОННЫЙ", t));
        TerrItemToken.m_TerrOntology.add(t);
        TerrItemToken.m_Raion = t;
        t = TerrTermin._new1475("РАЙОН", MorphLang.UA, true, MorphGender.MASCULINE);
        t.addAbridge("Р-Н");
        t.addAbridge("Р-ОН");
        t.addAbridge("РН.");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1472("УЕЗД", true, MorphGender.MASCULINE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1482("ГУБЕРНАТОРСТВО", true, true, MorphGender.NEUTER);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1482("ШТАТ", true, true, MorphGender.MASCULINE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1474("STATE", true);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1485("ШТАТ", MorphLang.UA, true, true, MorphGender.MASCULINE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1482("ПРОВИНЦИЯ", true, true, MorphGender.FEMINIE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1485("ПРОВІНЦІЯ", MorphLang.UA, true, true, MorphGender.FEMINIE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1474("PROVINCE", true);
        t.addVariant("PROVINCIAL", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1489("ПРЕФЕКТУРА", true, MorphGender.FEMINIE, true);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1490("PREFECTURE", true, true);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1482("ГРАФСТВО", true, true, MorphGender.NEUTER);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1472("АВТОНОМИЯ", true, MorphGender.FEMINIE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1474("AUTONOMY", true);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1475("АВТОНОМІЯ", MorphLang.UA, true, MorphGender.FEMINIE);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1495("ЗАКРЫТОЕ АДМИНИСТРАТИВНО ТЕРРИТОРИАЛЬНОЕ ОБРАЗОВАНИЕ", true, MorphGender.NEUTER, "ЗАТО");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1472("ФЕДЕРАЛЬНАЯ ТЕРРИТОРИЯ", true, MorphGender.NEUTER);
        TerrItemToken.m_TerrOntology.add(t);
        for (const s of ["РЕСПУБЛИКА", "КРАЙ", "ОКРУГ", "ФЕДЕРАЛЬНЫЙ ОКРУГ", "АВТОНОМНЫЙ ОКРУГ", "АВТОНОМНАЯ ОБЛАСТЬ", "НАЦИОНАЛЬНЫЙ ОКРУГ", "ВОЛОСТЬ", "ФЕДЕРАЛЬНАЯ ЗЕМЛЯ", "ВОЕВОДСТВО", "МУНИЦИПАЛЬНЫЙ РАЙОН", "МУНИЦИПАЛЬНЫЙ ОКРУГ", "АДМИНИСТРАТИВНЫЙ ОКРУГ", "ГОРОДСКОЙ ОКРУГ", "ГОРОДСКОЙ РАЙОН", "ВНУТРИГОРОДСКОЙ РАЙОН", "АДМИНИСТРАТИВНЫЙ РАЙОН", "СУДЕБНЫЙ РАЙОН", "ВНУТРИГОРОДСКОЕ МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ", "МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ", "СЕЛЬСКОЕ МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ", "ВНУТРИГОРОДСКАЯ ТЕРРИТОРИЯ", "МЕЖСЕЛЕННАЯ ТЕРРИТОРИЯ", "REPUBLIC", "COUNTY", "BOROUGH", "PARISH", "MUNICIPALITY", "CENSUS AREA", "AUTONOMOUS REGION", "ADMINISTRATIVE REGION", "SPECIAL ADMINISTRATIVE REGION"]) {
            t = TerrTermin._new1497(s, true, s.includes(" "));
            if (s === "КРАЙ") {
                t.addAbridge("КР.");
                TerrItemToken.m_TerrNounAdjectives.add(Termin._new170("КРАЕВОЙ", t));
                t.gender = MorphGender.MASCULINE;
            }
            else if (s === "ВНУТРИГОРОДСКАЯ ТЕРРИТОРИЯ") {
                t.addAbridge("ВН.ГОР.ТЕР.");
                t.addAbridge("ВН.Г.ТЕР.");
                t.addAbridge("ВН.ТЕР.Г.");
            }
            else if (s === "ОКРУГ") {
                TerrItemToken.m_TerrNounAdjectives.add(Termin._new170("ОКРУЖНОЙ", t));
                t.addAbridge("ОКР.");
            }
            else if (s === "ФЕДЕРАЛЬНЫЙ ОКРУГ") 
                t.acronym = "ФО";
            if (LanguageHelper.endsWith(s, "РАЙОН")) {
                t.addAbridge(Utils.replaceString(s, "РАЙОН", "Р-Н"));
                t.gender = MorphGender.MASCULINE;
                if (s === "МУНИЦИПАЛЬНЫЙ РАЙОН") {
                    t.addAbridge("М.Р-Н");
                    t.addAbridge("М Р-Н");
                    t.addAbridge("МУН.Р-Н");
                }
            }
            if (LanguageHelper.endsWith(s, "ОКРУГ")) {
                t.gender = MorphGender.MASCULINE;
                if (s !== "ОКРУГ") 
                    t.addVariant(s + " ОКРУГ", false);
            }
            if (LanguageHelper.endsWith(s, "ОБРАЗОВАНИЕ")) 
                t.gender = MorphGender.NEUTER;
            TerrItemToken.m_TerrOntology.add(t);
        }
        for (const s of ["РЕСПУБЛІКА", "КРАЙ", "ОКРУГ", "ФЕДЕРАЛЬНИЙ ОКРУГ", "АВТОНОМНИЙ ОКРУГ", "АВТОНОМНА ОБЛАСТЬ", "НАЦІОНАЛЬНИЙ ОКРУГ", "ВОЛОСТЬ", "ФЕДЕРАЛЬНА ЗЕМЛЯ", "МУНІЦИПАЛЬНИЙ РАЙОН", "МУНІЦИПАЛЬНИЙ ОКРУГ", "АДМІНІСТРАТИВНИЙ ОКРУГ", "МІСЬКИЙ РАЙОН", "ВНУТРИГОРОДСКОЕ МУНІЦИПАЛЬНЕ УТВОРЕННЯ"]) {
            t = TerrTermin._new1500(s, MorphLang.UA, true, s.includes(" "));
            if (LanguageHelper.endsWith(s, "РАЙОН")) {
                t.addAbridge(Utils.replaceString(s, "РАЙОН", "Р-Н"));
                t.gender = MorphGender.MASCULINE;
            }
            TerrItemToken.m_TerrOntology.add(t);
        }
        t = TerrTermin._new1472("ГОРОДСКОЙ ОКРУГ", true, MorphGender.MASCULINE);
        t.addAbridge("ГОР. ОКРУГ");
        t.addAbridge("Г.О.");
        t.addAbridge("Г/ОКРУГ");
        t.addAbridge("Г/О");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1472("СЕЛЬСКИЙ ОКРУГ", true, MorphGender.MASCULINE);
        t.addAbridge("С.О.");
        t.addAbridge("C.O.");
        t.addAbridge("ПС С.О.");
        t.addAbridge("С/ОКРУГ");
        t.addAbridge("С/О");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1475("СІЛЬСЬКИЙ ОКРУГ", MorphLang.UA, true, MorphGender.MASCULINE);
        t.addAbridge("С.О.");
        t.addAbridge("C.O.");
        t.addAbridge("С/ОКРУГ");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1504("СЕЛЬСКИЙ СОВЕТ", "СЕЛЬСКИЙ ОКРУГ", true, MorphGender.MASCULINE);
        t.addVariant("СЕЛЬСОВЕТ", false);
        t.addAbridge("С.С.");
        t.addAbridge("С/С");
        t.addAbridge("С.СОВЕТ");
        t.addVariant("СЕЛЬСКАЯ АДМИНИСТРАЦИЯ", false);
        t.addAbridge("С.А.");
        t.addAbridge("С.АДМ.");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1474("ПОСЕЛКОВЫЙ ОКРУГ", true);
        t.addVariant("ПОСЕЛКОВАЯ АДМИНИСТРАЦИЯ", false);
        t.addAbridge("П.А.");
        t.addAbridge("П.АДМ.");
        t.addAbridge("П/А");
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1504("ПОСЕЛКОВЫЙ СОВЕТ", "ПОСЕЛКОВЫЙ ОКРУГ", true, MorphGender.MASCULINE);
        t.addAbridge("П.С.");
        t.addAbridge("П.СОВЕТ");
        TerrItemToken.m_TerrOntology.add(t);
        TerrItemToken.m_TerrOntology.add(TerrTermin._new1507("АВТОНОМНЫЙ", true, true));
        TerrItemToken.m_TerrOntology.add(TerrTermin._new1508("АВТОНОМНИЙ", MorphLang.UA, true, true));
        TerrItemToken.m_TerrOntology.add(TerrTermin._new1509("МУНИЦИПАЛЬНОЕ СОБРАНИЕ", true, true, true));
        TerrItemToken.m_TerrOntology.add(TerrTermin._new1510("МУНІЦИПАЛЬНЕ ЗБОРИ", MorphLang.UA, true, true, true));
        t = TerrTermin._new1511("МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ", "МО", MorphGender.NEUTER);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1512("МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ МУНИЦИПАЛЬНЫЙ РАЙОН", "МОМР", true);
        t.addVariant("МО МР", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1513("МУНИЦИПАЛЬНЫЙ ОКРУГ ГОРОДСКОЙ ОКРУГ", "МУНИЦИПАЛЬНЫЙ ОКРУГ", "МОГО", true);
        t.addVariant("МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ ГОРОДСКОЙ ОКРУГ", false);
        t.addVariant("МО ГО", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ЦЕНТРАЛЬНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ЦАО");
        t.addVariant("ЦЕНТРАЛЬНЫЙ АО", false);
        t.addVariant("ЦЕНТРАЛЬНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("СЕВЕРНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("САО");
        t.addVariant("СЕВЕРНЫЙ АО", false);
        t.addVariant("СЕВЕРНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("СЕВЕРО-ВОСТОЧНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("СВАО");
        t.addVariant("СЕВЕРО-ВОСТОЧНЫЙ АО", false);
        t.addVariant("СЕВЕРО-ВОСТОЧНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ВОСТОЧНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ВАО");
        t.addVariant("ВОСТОЧНЫЙ АО", false);
        t.addVariant("ВОСТОЧНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ЮГО-ВОСТОЧНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ЮВАО");
        t.addVariant("ЮГО-ВОСТОЧНЫЙ АО", false);
        t.addVariant("ЮГО-ВОСТОЧНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ЮЖНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ЮАО");
        t.addVariant("ЮЖНЫЙ АО", false);
        t.addVariant("ЮЖНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ЗАПАДНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ЗАО");
        t.addVariant("ЗАПАДНЫЙ АО", false);
        t.addVariant("ЗАПАДНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("СЕВЕРО-ЗАПАДНЫЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("СЗАО");
        t.addVariant("СЕВЕРО-ЗАПАДНЫЙ АО", false);
        t.addVariant("СЕВЕРО-ЗАПАДНЫЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ЗЕЛЕНОГРАДСКИЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ЗЕЛАО");
        t.addVariant("ЗЕЛЕНОГРАДСКИЙ АО", false);
        t.addVariant("ЗЕЛЕНОГРАДСКИЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ТРОИЦКИЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ТАО");
        t.addVariant("ТРОИЦКИЙ АО", false);
        t.addVariant("ТРОИЦКИЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("НОВОМОСКОВСКИЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("НАО");
        t.addVariant("НОВОМОСКОВСКИЙ АО", false);
        t.addVariant("НОВОМОСКОВСКИЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        t = TerrTermin._new1514("ТРОИЦКИЙ И НОВОМОСКОВСКИЙ АДМИНИСТРАТИВНЫЙ ОКРУГ", true);
        t.addAbridge("ТИНАО");
        t.addAbridge("НИТАО");
        t.addVariant("ТРОИЦКИЙ И НОВОМОСКОВСКИЙ АО", false);
        t.addVariant("ТРОИЦКИЙ И НОВОМОСКОВСКИЙ ОКРУГ", false);
        TerrItemToken.m_TerrOntology.add(t);
        TerrItemToken.m_SpecNames = new TerminCollection();
        for (const s of ["МАРЬИНА РОЩА", "ПРОСПЕКТ ВЕРНАДСКОГО"]) {
            TerrItemToken.m_SpecNames.add(new Termin(s));
        }
        TerrItemToken.m_Alpha2State = new Hashtable();
        let dat = PullentiNerAddressInternalResourceHelper.getBytes("t.dat");
        if (dat === null) 
            throw new Error("Not found resource file t.dat in Analyzer.Location");
        dat = MiscLocationHelper.deflate(dat);
        let tmp = new MemoryStream(dat); 
        try {
            tmp.position = 0;
            let xml = new XmlDocument();
            xml.loadStream(tmp);
            for (const x of xml.document_element.child_nodes) {
                let lang = MorphLang.RU;
                let a = Utils.getXmlAttrByName(x.attributes, "l");
                if (a !== null) {
                    if (a.value === "en") 
                        lang = MorphLang.EN;
                    else if (a.value === "ua") 
                        lang = MorphLang.UA;
                }
                if (x.name === "state") 
                    TerrItemToken.loadState(x, lang);
                else if (x.name === "reg") 
                    TerrItemToken.loadRegion(x, lang);
                else if (x.name === "unknown") {
                    a = Utils.getXmlAttrByName(x.attributes, "name");
                    if (a !== null && a.value !== null) 
                        TerrItemToken.m_UnknownRegions.add(Termin._new1526(a.value, lang));
                }
            }
        }
        finally {
            tmp.close();
        }
    }
    
    static loadState(xml, lang) {
        let state = new GeoReferent();
        let c = new IntOntologyItem(state);
        let acrs = null;
        for (const x of xml.child_nodes) {
            if (x.name === "n") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, null);
                te.ignoreTermsOrder = true;
                if (x.inner_text === "КОТ ДИВУАР") 
                    te.ignoreTermsOrder = false;
                c.termins.push(te);
                state.addName(x.inner_text);
            }
            else if (x.name === "acr") {
                c.termins.push(Termin._new1527(x.inner_text, lang));
                state.addName(x.inner_text);
                if (acrs === null) 
                    acrs = new Array();
                acrs.push(x.inner_text);
            }
            else if (x.name === "a") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, lang);
                te.tag = c;
                c.termins.push(te);
                TerrItemToken.M_TERR_ADJS.add(te);
            }
            else if (x.name === "a2") 
                state.alpha2 = x.inner_text;
            else if (x.name === "m") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, lang);
                te.tag = state;
                te.gender = MorphGender.MASCULINE;
                TerrItemToken.M_MANS_BY_STATE.add(te);
            }
            else if (x.name === "w") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, lang);
                te.tag = state;
                te.gender = MorphGender.FEMINIE;
                TerrItemToken.M_MANS_BY_STATE.add(te);
            }
            else if (x.name === "cap") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, lang);
                te.tag = state;
                TerrItemToken.m_CapitalsByState.add(te);
            }
        }
        c.setShortestCanonicalText(true);
        if (c.canonicText === "ГОЛЛАНДИЯ" || c.canonicText.startsWith("КОРОЛЕВСТВО НИДЕР")) 
            c.canonicText = "НИДЕРЛАНДЫ";
        else if (c.canonicText === "ГОЛЛАНДІЯ" || c.canonicText.startsWith("КОРОЛІВСТВО НІДЕР")) 
            c.canonicText = "НІДЕРЛАНДИ";
        if (state.alpha2 === "RU") {
            if (lang.isUa) 
                TerrItemToken.m_RussiaUA = c;
            else 
                TerrItemToken.m_RussiaRU = c;
        }
        else if (state.alpha2 === "BY") {
            if (!lang.isUa) 
                TerrItemToken.m_Belorussia = c;
        }
        else if (state.alpha2 === "KZ") {
            if (!lang.isUa) 
                TerrItemToken.m_Kazahstan = c;
        }
        else if (c.canonicText === "ТАМОЖЕННЫЙ СОЮЗ") {
            if (!lang.isUa) 
                TerrItemToken.m_TamogSous = c;
        }
        if (state.findSlot(GeoReferent.ATTR_TYPE, null, true) === null) {
            if (lang.isUa) 
                state.addTypState(lang);
            else {
                state.addTypState(MorphLang.RU);
                state.addTypState(MorphLang.EN);
            }
        }
        TerrItemToken.m_TerrOntology.addItem(c);
        if (lang.isRu) 
            TerrItemToken.m_AllStates.push(state);
        let a2 = state.alpha2;
        if (a2 !== null) {
            if (!TerrItemToken.m_Alpha2State.containsKey(a2)) 
                TerrItemToken.m_Alpha2State.put(a2, c);
            let a3 = null;
            let wrapa31528 = new RefOutArgWrapper();
            let inoutres1529 = MiscLocationHelper.m_Alpha2_3.tryGetValue(a2, wrapa31528);
            a3 = wrapa31528.value;
            if (inoutres1529) {
                if (!TerrItemToken.m_Alpha2State.containsKey(a3)) 
                    TerrItemToken.m_Alpha2State.put(a3, c);
            }
        }
        if (acrs !== null) {
            for (const a of acrs) {
                if (!TerrItemToken.m_Alpha2State.containsKey(a)) 
                    TerrItemToken.m_Alpha2State.put(a, c);
            }
        }
    }
    
    static loadRegion(xml, lang) {
        let reg = new GeoReferent();
        let r = new IntOntologyItem(reg);
        let aTerm = null;
        for (const x of xml.child_nodes) {
            if (x.name === "n") {
                let v = x.inner_text;
                if (v.startsWith("ЦЕНТРАЛ")) {
                }
                let te = new Termin();
                te.initByNormalText(v, lang);
                if (lang.isRu && TerrItemToken.m_MosRegRU === null && v === "ПОДМОСКОВЬЕ") {
                    TerrItemToken.m_MosRegRU = r;
                    te.addAbridge("МОС.ОБЛ.");
                    te.addAbridge("МОСК.ОБЛ.");
                    te.addAbridge("МОСКОВ.ОБЛ.");
                    te.addAbridge("МОС.ОБЛАСТЬ");
                    te.addAbridge("МОСК.ОБЛАСТЬ");
                    te.addAbridge("МОСКОВ.ОБЛАСТЬ");
                }
                else if (lang.isRu && TerrItemToken.m_LenRegRU === null && v === "ЛЕНОБЛАСТЬ") {
                    te.acronym = "ЛО";
                    te.addAbridge("ЛЕН.ОБЛ.");
                    te.addAbridge("ЛЕН.ОБЛАСТЬ");
                    TerrItemToken.m_LenRegRU = r;
                }
                r.termins.push(te);
                reg.addName(v);
            }
            else if (x.name === "t") 
                reg.addTyp(x.inner_text);
            else if (x.name === "a") {
                let te = new Termin();
                te.initByNormalText(x.inner_text, lang);
                te.tag = r;
                r.termins.push(te);
            }
            else if (x.name === "ab") {
                if (aTerm === null) 
                    aTerm = Termin._new690(reg.getStringValue(GeoReferent.ATTR_NAME), lang, reg);
                aTerm.addAbridge(x.inner_text);
            }
        }
        if (aTerm !== null) 
            TerrItemToken.m_GeoAbbrs.add(aTerm);
        r.setShortestCanonicalText(true);
        if (r.canonicText.startsWith("КАРАЧАЕВО")) 
            r.canonicText = "КАРАЧАЕВО - ЧЕРКЕССИЯ";
        else if (r.canonicText === "ЮГРА") 
            r.termins.push(new Termin("ХАНТЫ-МАНСИЙСКИЙ-ЮГРА"));
        else if (r.canonicText.includes("ТАТАРСТАН")) 
            TerrItemToken.m_Tatarstan = r;
        else if (r.canonicText.includes("УДМУРТ")) 
            TerrItemToken.m_Udmurtia = r;
        else if (r.canonicText.includes("ДАГЕСТАН")) 
            TerrItemToken.m_Dagestan = r;
        if (reg.isState && reg.isRegion) 
            reg.addTypReg(lang);
        TerrItemToken.m_TerrOntology.addItem(r);
    }
    
    static checkOntoItem(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let li = TerrItemToken.m_TerrOntology.tryAttach(t, null, false);
        if (li !== null) {
            for (const nt of li) {
                if (nt.item !== null) {
                    if (nt.beginToken === nt.endToken && t.getMorphClassInDictionary().isAdjective) {
                    }
                    else 
                        return nt;
                }
            }
        }
        return null;
    }
    
    static checkKeyword(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let li = TerrItemToken.m_TerrOntology.tryAttach(t, null, false);
        if (li !== null) {
            for (const nt of li) {
                if (nt.item === null) {
                    let tt = Utils.as(nt.termin, TerrTermin);
                    if (tt.isAdjective) {
                    }
                    else 
                        return nt;
                }
            }
        }
        return null;
    }
    
    static tryParseList(t, maxCount, ad = null) {
        const CityItemToken = require("./CityItemToken");
        let ci = TerrItemToken.tryParse(t, null, ad);
        if (ci === null) 
            return null;
        let li = new Array();
        li.push(ci);
        t = ci.endToken.next;
        if (t === null) 
            return li;
        if (ci.terminItem !== null && ci.terminItem.canonicText === "АВТОНОМИЯ") {
            if (t.morph._case.isGenitive) 
                return null;
        }
        for (t = ci.endToken.next; t !== null; ) {
            if (t.isNewlineBefore) {
                if (MiscLocationHelper.isUserParamAddress(t)) 
                    break;
            }
            ci = TerrItemToken.tryParse(t, li[li.length - 1], ad);
            if (ci === null) {
                if (t.chars.isCapitalUpper && li.length === 1 && ((li[0].isCityRegion || ((li[0].terminItem !== null && li[0].terminItem.isSpecificPrefix))))) {
                    let cit = CityItemToken.tryParse(t, null, false, null);
                    if (cit !== null && cit.typ === CityItemTokenItemType.PROPERNAME) 
                        ci = new TerrItemToken(cit.beginToken, cit.endToken);
                }
                else if ((BracketHelper.canBeStartOfSequence(t, false, false) && t.next !== null && ((t.next.chars.isCapitalUpper || t.next.chars.isAllUpper))) && li.length === 1 && ((li[0].isCityRegion || ((li[0].terminItem !== null && li[0].terminItem.isSpecificPrefix))))) {
                    let cit = CityItemToken.tryParse(t.next, null, false, null);
                    if (cit !== null && ((cit.typ === CityItemTokenItemType.PROPERNAME || cit.typ === CityItemTokenItemType.CITY)) && BracketHelper.canBeEndOfSequence(cit.endToken.next, false, null, false)) 
                        ci = new TerrItemToken(t, cit.endToken.next);
                    else {
                        let brr = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                        if (brr !== null) {
                            let ok = false;
                            let rt = t.kit.processReferent("ORGANIZATION", t.next, null);
                            if (rt !== null && rt.toString().toUpperCase().includes("СОВЕТ")) 
                                ok = true;
                            else if (brr.lengthChar < 40) 
                                ok = true;
                            if (ok) 
                                ci = new TerrItemToken(t, brr.endToken);
                        }
                    }
                }
                else if (t.isCharOf("(/\\")) {
                    ci = TerrItemToken.tryParse(t.next, null, ad);
                    if (ci !== null && ci.endToken.next !== null && ci.endToken.next.isCharOf(")/\\")) {
                        let ci0 = li[li.length - 1];
                        if (ci0.ontoItem !== null && ci.ontoItem === ci0.ontoItem) {
                            ci0.endToken = ci.endToken.next;
                            t = ci0.endToken.next;
                        }
                        else {
                            let ci1 = TerrItemToken._new1531(t, ci.endToken.next, ci.ontoItem, ci.terminItem);
                            li.push(ci1);
                            t = ci1.endToken;
                        }
                        continue;
                    }
                }
                else if ((t.isComma && li.length === 1 && li[0].terminItem === null) && (t.whitespacesAfterCount < 3)) {
                    let li2 = TerrItemToken.tryParseList(t.next, 2, null);
                    if (li2 !== null && li2.length === 1 && li2[0].terminItem !== null) {
                        let tt2 = li2[0].endToken.next;
                        let ok = false;
                        if (tt2 === null || tt2.whitespacesBeforeCount > 3) 
                            ok = true;
                        else if (((tt2.lengthChar === 1 && !tt2.isLetters)) || !(tt2 instanceof TextToken)) 
                            ok = true;
                        if (ok) {
                            li.push(li2[0]);
                            t = li2[0].endToken;
                            break;
                        }
                    }
                }
                if (ci === null && BracketHelper.canBeStartOfSequence(t, false, false)) {
                    let lii = TerrItemToken.tryParseList(t.next, maxCount, null);
                    if (lii !== null && BracketHelper.canBeEndOfSequence(lii[lii.length - 1].endToken.next, false, null, false)) {
                        li.splice(li.length, 0, ...lii);
                        return li;
                    }
                }
                if (ci === null) 
                    break;
            }
            if (t.isTableControlChar) 
                break;
            if (t.isNewlineBefore) {
                if (t.newlinesBeforeCount > 1) 
                    break;
                if (li.length > 0 && li[li.length - 1].isAdjective && ci.terminItem !== null) {
                }
                else if (li.length === 1 && li[0].terminItem !== null && ci.terminItem === null) {
                }
                else 
                    break;
            }
            if (ci.terminItem !== null && ci.terminItem.canonicText === "ТЕРРИТОРИЯ") 
                break;
            li.push(ci);
            t = ci.endToken.next;
            if (maxCount > 0 && li.length >= maxCount) 
                break;
        }
        for (const cc of li) {
            if (cc.ontoItem !== null && !cc.isAdjective) {
                if (!cc.beginToken.chars.isCyrillicLetter) 
                    continue;
                let alpha2 = null;
                if (cc.ontoItem.referent instanceof GeoReferent) 
                    alpha2 = cc.ontoItem.referent.alpha2;
                if (alpha2 === "TG") {
                    if (cc.beginToken instanceof TextToken) {
                        if (cc.beginToken.getSourceText() !== "Того") 
                            return null;
                        if (li.length === 1 && cc.beginToken.previous !== null && cc.beginToken.previous.isChar('.')) 
                            return null;
                        let npt = NounPhraseHelper.tryParse(cc.beginToken, NounPhraseParseAttr.PARSEPRONOUNS, 0, null);
                        if (npt !== null && npt.endToken !== cc.beginToken) 
                            return null;
                        if (cc.beginToken.next !== null) {
                            if (cc.beginToken.next.morph._class.isPersonalPronoun || cc.beginToken.next.morph._class.isPronoun) 
                                return null;
                        }
                    }
                    if (li.length < 2) 
                        return null;
                }
                if (alpha2 === "PE") {
                    if (cc.beginToken instanceof TextToken) {
                        if (cc.beginToken.getSourceText() !== "Перу") 
                            return null;
                        if (li.length === 1 && cc.beginToken.previous !== null && cc.beginToken.previous.isChar('.')) 
                            return null;
                    }
                    if (li.length < 2) 
                        return null;
                }
                if (alpha2 === "DM") {
                    if (cc.endToken.next !== null) {
                        if (cc.endToken.next.chars.isCapitalUpper || cc.endToken.next.chars.isAllUpper) 
                            return null;
                    }
                    return null;
                }
                if (alpha2 === "JE") {
                    if (cc.beginToken.previous !== null && cc.beginToken.previous.isHiphen) 
                        return null;
                }
                return li;
            }
            else if (cc.ontoItem !== null && cc.isAdjective) {
                let alpha2 = null;
                if (cc.ontoItem.referent instanceof GeoReferent) 
                    alpha2 = cc.ontoItem.referent.alpha2;
                if (alpha2 === "SU") {
                    if (cc.endToken.next === null || !cc.endToken.next.isValue("СОЮЗ", null)) 
                        cc.ontoItem = null;
                }
            }
        }
        for (let i = 0; i < li.length; i++) {
            if (li[i].ontoItem !== null && li[i].ontoItem2 !== null) {
                let nou = null;
                if (i > 0 && li[i - 1].terminItem !== null) 
                    nou = li[i - 1].terminItem;
                else if (((i + 1) < li.length) && li[i + 1].terminItem !== null) 
                    nou = li[i + 1].terminItem;
                if (nou === null || li[i].ontoItem.referent === null || li[i].ontoItem2.referent === null) 
                    continue;
                if (li[i].ontoItem.referent.findSlot(GeoReferent.ATTR_TYPE, nou.canonicText.toLowerCase(), true) === null && li[i].ontoItem2.referent.findSlot(GeoReferent.ATTR_TYPE, nou.canonicText.toLowerCase(), true) !== null) {
                    li[i].ontoItem = li[i].ontoItem2;
                    li[i].ontoItem2 = null;
                }
                else if (li[i].ontoItem.referent.findSlot(GeoReferent.ATTR_TYPE, "республика", true) !== null && nou.canonicText !== "РЕСПУБЛИКА") {
                    li[i].ontoItem = li[i].ontoItem2;
                    li[i].ontoItem2 = null;
                }
            }
        }
        if ((li.length >= 3 && li[0].terminItem === null && li[1].terminItem !== null) && li[2].terminItem === null) {
            if (li.length === 3 || ((li.length >= 5 && ((((li[3].terminItem !== null && li[4].terminItem === null)) || ((li[4].terminItem !== null && li[3].terminItem === null))))))) {
                let t1 = li[0].beginToken.previous;
                if (t1 !== null && t1.isChar('.') && t1.previous !== null) {
                    t1 = t1.previous;
                    let cit = CityItemToken.tryParseBack(t1, false);
                    if (cit !== null) 
                        li.splice(0, 1);
                    else if (t1.chars.isAllLower && ((t1.isValue("С", null) || t1.isValue("П", null) || t1.isValue("ПОС", null)))) 
                        li.splice(0, 1);
                }
            }
        }
        for (const cc of li) {
            if (cc.ontoItem !== null || ((cc.terminItem !== null && !cc.isAdjective))) 
                return li;
        }
        if (li.length > 0 && MiscLocationHelper.isUserParamAddress(li[0].beginToken)) 
            return li;
        return null;
    }
    
    constructor(begin, end) {
        super(begin, end, null);
        this.ontoItem = null;
        this.ontoItem2 = null;
        this.terminItem = null;
        this.terminItem2 = null;
        this.isAdjective = false;
        this.isDistrictName = false;
        this.adjectiveRef = null;
        this.namedBy = null;
        this.realName = null;
        this.canBeCity = false;
        this.canBeSurname = false;
        this.isAdjInDictionary = false;
        this.isGeoInDictionary = false;
        this.isDoubt = false;
        this.additionalTyp = null;
    }
    
    get isCityRegion() {
        if (this.terminItem === null) 
            return false;
        return (this.terminItem.canonicText.includes("ГОРОДС") || this.terminItem.canonicText.includes("МІСЬК") || this.terminItem.canonicText.includes("МУНИЦИПАЛ")) || this.terminItem.canonicText.includes("МУНІЦИПАЛ") || this.terminItem.canonicText === "ПОЧТОВОЕ ОТДЕЛЕНИЕ";
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.ontoItem !== null) 
            res.append(this.ontoItem.canonicText).append(" ");
        else if (this.terminItem !== null) 
            res.append(this.terminItem.canonicText).append(" ");
        else 
            res.append(super.toString()).append(" ");
        if (this.adjectiveRef !== null) 
            res.append(" (Adj: ").append(this.adjectiveRef.referent.toString()).append(")");
        return res.toString().trim();
    }
    
    static prepareAllData(t0) {
        if (!TerrItemToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.tRegime = false;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            let ter = TerrItemToken.tryParse(t, null, ad);
            if (ter !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.terr = ter;
            }
        }
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            if (d === null || d.terr === null || d.terr.terminItem === null) 
                continue;
            let tt = d.terr.endToken.next;
            if (tt === null) 
                continue;
            let dd = Utils.as(tt.tag, GeoTokenData);
            let ter = TerrItemToken.tryParse(tt, d.terr, ad);
            if (ter === null) 
                continue;
            if (dd === null) 
                dd = new GeoTokenData(tt);
            if (dd.terr === null || (dd.terr.endChar < ter.endChar)) 
                dd.terr = ter;
        }
        ad.tRegime = true;
    }
    
    static tryParse(t, prev = null, ad = null) {
        const AddressItemToken = require("./../../address/internal/AddressItemToken");
        const CityItemToken = require("./CityItemToken");
        const OrgItemToken = require("./OrgItemToken");
        if (t === null) 
            return null;
        if (ad === null) 
            ad = Utils.as(GeoAnalyzer.getData(t), GeoAnalyzerData);
        if (ad === null) 
            return null;
        let d = Utils.as(t.tag, GeoTokenData);
        if (d !== null && d.noGeo) 
            return null;
        if (TerrItemToken.SPEED_REGIME && ((ad.tRegime || ad.allRegime)) && ((t.lengthChar !== 2 || !t.chars.isAllUpper))) {
            if (d !== null) 
                return d.terr;
            if (t.tag === null) 
                return null;
        }
        if (ad.tLevel > 1) 
            return null;
        ad.tLevel++;
        let res = TerrItemToken._TryParse(t, prev, false);
        ad.tLevel--;
        if (res === null) {
            if (t.isValue("ОБ", null) && MiscLocationHelper.isUserParamAddress(t)) {
                res = TerrItemToken._new1532(t, t, TerrItemToken.m_Obl);
                if (t.next !== null && t.next.isChar('.')) 
                    res.endToken = t.next;
                return res;
            }
            if (t.chars.isAllUpper && t.lengthChar === 2 && (t instanceof TextToken)) {
                let term = t.term;
                if (((term === "РБ" || term === "РК" || term === "TC") || term === "ТС" || term === "РТ") || term === "УР" || term === "РД") {
                    if ((term === "РБ" && (t.previous instanceof TextToken) && (t.whitespacesBeforeCount < 3)) && !t.previous.chars.isAllLower && t.previous.morph._class.isAdjective) 
                        return null;
                    for (const it of ad.localOntology.items) {
                        if (it.referent instanceof GeoReferent) {
                            let alph2 = it.referent.alpha2;
                            if (((alph2 === "BY" && term === "РБ")) || ((alph2 === "KZ" && term === "РК"))) 
                                return TerrItemToken._new1533(t, t, it);
                            if (term === "РТ") {
                                if (it.referent.findSlot(null, "ТАТАРСТАН", true) !== null) 
                                    return TerrItemToken._new1533(t, t, it);
                            }
                            if (term === "РД") {
                                if (it.referent.findSlot(null, "ДАГЕСТАН", true) !== null) 
                                    return TerrItemToken._new1533(t, t, it);
                            }
                            if (term === "РБ") {
                                if (it.referent.findSlot(null, "БАШКИРИЯ", true) !== null) 
                                    return TerrItemToken._new1533(t, t, it);
                            }
                        }
                    }
                    let ok = false;
                    if ((t.whitespacesBeforeCount < 2) && (t.previous instanceof TextToken)) {
                        let term2 = t.previous.term;
                        if ((t.previous.isValue("КОДЕКС", null) || t.previous.isValue("ЗАКОН", null) || term2 === "КОАП") || term2 === "ПДД" || term2 === "МЮ") 
                            ok = true;
                        else if ((t.previous.chars.isAllUpper && t.previous.lengthChar > 1 && (t.previous.lengthChar < 4)) && term2.endsWith("К")) 
                            ok = true;
                        else if (term === "РТ" || term === "УР" || term === "РД") {
                            let tt = t.previous;
                            if (tt !== null && tt.isComma) 
                                tt = tt.previous;
                            if (tt !== null) {
                                if ((tt.getReferent() instanceof GeoReferent) && tt.getReferent().alpha2 === "RU") 
                                    ok = true;
                                else if ((tt instanceof NumberToken) && tt.lengthChar === 6 && tt.typ === NumberSpellingType.DIGIT) 
                                    ok = true;
                            }
                            if (!ok && t.next !== null) {
                                tt = t.next;
                                if (tt.isComma) 
                                    tt = tt.next;
                                if (tt !== null) {
                                    if ((tt.getReferent() instanceof GeoReferent) && tt.getReferent().alpha2 === "RU") 
                                        ok = true;
                                    else if ((tt instanceof NumberToken) && tt.lengthChar === 6 && tt.typ === NumberSpellingType.DIGIT) 
                                        ok = true;
                                }
                            }
                        }
                        if (!ok) {
                            if (t.next !== null && t.next.isHiphen) {
                            }
                            else if (AddressItemToken.tryParsePureItem(t.next, null, null) !== null) {
                            }
                            else {
                                let cou = 0;
                                for (let tt = t.previous; tt !== null && (cou < 4); tt = tt.previous,cou++) {
                                    let org = OrgItemToken.tryParse(tt, null);
                                    if (org !== null) {
                                        ok = true;
                                        break;
                                    }
                                    let kk = tt.kit.processReferent("PERSONPROPERTY", tt, null);
                                    if (kk !== null) {
                                        ok = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    else if (((t.whitespacesBeforeCount < 2) && (t.previous instanceof NumberToken) && t.previous.lengthChar === 6) && t.previous.typ === NumberSpellingType.DIGIT) 
                        ok = true;
                    if (ok) {
                        if (term === "РК" && TerrItemToken.m_Kazahstan !== null) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_Kazahstan);
                        if (term === "РТ" && TerrItemToken.m_Tatarstan !== null) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_Tatarstan);
                        if (term === "РД" && TerrItemToken.m_Dagestan !== null) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_Dagestan);
                        if (term === "УР" && TerrItemToken.m_Udmurtia !== null) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_Udmurtia);
                        if (term === "РБ" && TerrItemToken.m_Belorussia !== null && ad.step > 0) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_Belorussia);
                        if (((term === "ТС" || term === "TC")) && TerrItemToken.m_TamogSous !== null) 
                            return TerrItemToken._new1533(t, t, TerrItemToken.m_TamogSous);
                    }
                }
            }
            if (((t instanceof TextToken) && ((t.isValue("Р", null) || t.isValue("P", null))) && t.next !== null) && t.next.isChar('.') && !t.next.isNewlineAfter) {
                res = TerrItemToken.tryParse(t.next.next, null, ad);
                if (res !== null && res.ontoItem !== null) {
                    let str = res.ontoItem.toString().toUpperCase();
                    if (str.includes("РЕСПУБЛИКА")) {
                        res.beginToken = t;
                        res.isDoubt = false;
                        return res;
                    }
                }
                if (MiscLocationHelper.isUserParamAddress(t)) {
                    let tt = t.next.next;
                    if ((tt instanceof TextToken) && tt.term.endsWith("Й") && (tt.whitespacesBeforeCount < 3)) 
                        return TerrItemToken._new1532(t, t.next, TerrItemToken.m_Raion);
                }
            }
            return TerrItemToken._tryParseDistrictName(t, 0, prev);
        }
        if ((res.beginToken.lengthChar === 1 && res.beginToken.chars.isAllUpper && res.beginToken.next !== null) && res.beginToken.next.isChar('.')) 
            return null;
        if ((res.endToken.next !== null && res.endToken.next.isChar('.') && res.endToken.next.next !== null) && res.endToken.next.next.isComma) 
            res.endToken = res.endToken.next;
        if (res.terminItem !== null && res.terminItem.canonicText === "ОКРУГ") {
            if (t.previous !== null && ((t.previous.isValue("ГОРОДСКОЙ", null) || t.previous.isValue("МІСЬКИЙ", null)))) 
                return null;
        }
        for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
            if (tt.whitespacesBeforeCount > 3) 
                break;
            if (tt.isValue("ЭВЕНКИЙСКИЙ", null) || tt.isValue("НАЦИОНАЛЬНЫЙ", null)) {
                let res2 = TerrItemToken._TryParse(tt, null, false);
                if (res2 !== null && res2.terminItem !== null) 
                    break;
                if (res.realName === null) 
                    res.realName = new MetaToken(res.beginToken, res.endToken);
                res.endToken = tt;
            }
            else 
                break;
        }
        if (res.terminItem !== null && ((res.terminItem.canonicText.includes("МУНИЦИПАЛ") || res.terminItem.canonicText.includes("ГОРОДСК"))) && (res.whitespacesAfterCount < 3)) {
            let li = CityItemToken.tryParseList(res.endToken.next, 3, ad);
            if ((li !== null && li.length === 2 && li[0].typ === CityItemTokenItemType.NOUN) && li[0].value === "ГОРОД") {
                if (li[1].endToken.isNewlineAfter || li[1].endToken.next.isComma) 
                    res.endToken = li[0].endToken;
            }
        }
        if (res.terminItem === null && res.ontoItem === null) {
            if (MiscLocationHelper.checkTerritory(res.beginToken) !== null) 
                return null;
        }
        if (res.ontoItem !== null) {
            let cit1 = CityItemToken.checkOntoItem(res.beginToken);
            if (cit1 !== null && cit1.item.miscAttr !== null) {
                if (cit1.endToken.isValue("CITY", null)) 
                    return null;
                if (cit1.endToken === res.endToken) {
                    res.canBeCity = true;
                    if (cit1.endToken.next !== null && cit1.endToken.next.isValue("CITY", null)) 
                        return null;
                }
            }
            let cit = CityItemToken.tryParseBack(res.beginToken.previous, true);
            if (cit !== null && cit.typ === CityItemTokenItemType.NOUN && ((res.isAdjective || (cit.whitespacesAfterCount < 1)))) 
                res.canBeCity = true;
        }
        if (res.terminItem !== null) {
            if (((res.terminItem.canonicText === "МУНИЦИПАЛЬНЫЙ ОКРУГ" || res.terminItem.canonicText === "ГОРОДСКОЙ ОКРУГ")) && (res.whitespacesAfterCount < 3)) {
                let next0 = TerrItemToken.tryParse(res.endToken.next, null, null);
                if (next0 !== null && next0.terminItem !== null && next0.terminItem.acronym === "ЗАТО") {
                    res.endToken = next0.endToken;
                    res.terminItem2 = next0.terminItem;
                }
                let _next = CityItemToken.checkKeyword(res.endToken.next);
                if (_next !== null) {
                    res.endToken = _next.endToken;
                    res.additionalTyp = _next.termin.canonicText;
                }
            }
            res.isDoubt = res.terminItem.isDoubt;
            if (!res.terminItem.isRegion) {
                if (res.terminItem.isMoscowRegion && res.beginToken === res.endToken) 
                    res.isDoubt = true;
                else if (res.terminItem.acronym === "МО" && res.beginToken === res.endToken && res.lengthChar === 2) {
                    if (res.beginToken.previous !== null && res.beginToken.previous.isValue("ВЕТЕРАН", null)) 
                        return null;
                    res.isDoubt = true;
                    if (res.beginToken === res.endToken && res.lengthChar === 2) {
                        if (res.beginToken.previous === null || res.beginToken.previous.isCharOf(",") || res.beginToken.isNewlineBefore) {
                            if (res.endToken.next === null || res.endToken.next.isCharOf(",") || res.isNewlineAfter) {
                                res.terminItem = null;
                                res.ontoItem = TerrItemToken.m_MosRegRU;
                            }
                        }
                        let tt = res.endToken.next;
                        if (tt !== null && tt.isComma) 
                            tt = tt.next;
                        let cit = CityItemToken.tryParse(tt, null, false, null);
                        let isReg = false;
                        if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) 
                            isReg = true;
                        else {
                            tt = t.previous;
                            if (tt !== null && tt.isComma) 
                                tt = tt.previous;
                            cit = CityItemToken.tryParseBack(tt, false);
                            if (cit !== null && cit.typ === CityItemTokenItemType.CITY) 
                                isReg = true;
                            else if (cit !== null && cit.typ === CityItemTokenItemType.PROPERNAME) {
                                cit = CityItemToken.tryParseBack(cit.beginToken.previous, true);
                                if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) 
                                    isReg = true;
                            }
                        }
                        if (isReg) {
                            res.terminItem = null;
                            res.isDoubt = false;
                            res.ontoItem = TerrItemToken.m_MosRegRU;
                        }
                    }
                }
                else if (res.terminItem.acronym === "ЛО" && res.beginToken === res.endToken && res.lengthChar === 2) {
                    res.isDoubt = true;
                    if (res.beginToken.previous === null || res.beginToken.previous.isCommaAnd || res.beginToken.isNewlineBefore) {
                        res.terminItem = null;
                        res.ontoItem = TerrItemToken.m_LenRegRU;
                    }
                    else {
                        let tt = res.endToken.next;
                        if (tt !== null && tt.isComma) 
                            tt = tt.next;
                        let cit = CityItemToken.tryParse(tt, null, false, null);
                        if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) {
                            res.terminItem = null;
                            res.ontoItem = TerrItemToken.m_LenRegRU;
                        }
                    }
                }
                else if (!res.morph._case.isNominative && !res.morph._case.isAccusative) 
                    res.isDoubt = true;
                else if (res.morph.number !== MorphNumber.SINGULAR) {
                    if (res.terminItem.isMoscowRegion && res.morph.number !== MorphNumber.PLURAL) {
                    }
                    else 
                        res.isDoubt = true;
                }
            }
            if (((res.terminItem !== null && res.terminItem.canonicText === "АО")) || ((res.ontoItem === TerrItemToken.m_MosRegRU && res.lengthChar === 2 && res.isDoubt))) {
                let tt = res.endToken.next;
                let rt = res.kit.processReferent("ORGANIZATION", res.beginToken, null);
                if (rt === null) 
                    rt = res.kit.processReferent("ORGANIZATION", res.beginToken.next, null);
                if (rt !== null) {
                    for (const s of rt.referent.slots) {
                        if (s.typeName === "TYPE") {
                            let ty = String(s.value);
                            if (res.terminItem !== null && ty !== res.terminItem.canonicText) 
                                return null;
                        }
                    }
                }
            }
        }
        if (res !== null && res.beginToken === res.endToken && res.terminItem === null) {
            if (t instanceof TextToken) {
                let str = t.term;
                if (str === "ЧАДОВ" || str === "ТОГОВ") 
                    return null;
            }
            if ((((t.next instanceof TextToken) && (t.whitespacesAfterCount < 2) && !t.next.chars.isAllLower) && t.chars.equals(t.next.chars) && !t.chars.isLatinLetter) && ((!t.morph._case.isGenitive && !t.morph._case.isAccusative))) {
                let mc = t.next.getMorphClassInDictionary();
                if (mc.isProperSurname || mc.isProperSecname) 
                    res.isDoubt = true;
            }
            if ((t.previous instanceof TextToken) && (t.whitespacesBeforeCount < 2) && !t.previous.chars.isAllLower) {
                let mc = t.previous.getMorphClassInDictionary();
                if (mc.isProperSurname) 
                    res.isDoubt = true;
            }
            if ((t.lengthChar <= 2 && res.ontoItem !== null && !t.isValue("РФ", null)) && !t.isValue("МО", null)) {
                res.isDoubt = true;
                let tt = t.next;
                if (tt !== null && ((tt.isCharOf(":") || tt.isHiphen))) 
                    tt = tt.next;
                if (tt !== null && tt.getReferent() !== null && tt.getReferent().typeName === "PHONE") 
                    res.isDoubt = false;
                else if (t.lengthChar === 2 && t.chars.isAllUpper && t.chars.isLatinLetter) 
                    res.isDoubt = false;
            }
        }
        return res;
    }
    
    static _TryParse(t, prev, ignoreOnto = false) {
        const AddressItemToken = require("./../../address/internal/AddressItemToken");
        const CityItemToken = require("./CityItemToken");
        if (!(t instanceof TextToken)) 
            return null;
        let li = null;
        if (!ignoreOnto) {
            if (t.kit.ontology !== null) 
                li = t.kit.ontology.attachToken(GeoReferent.OBJ_TYPENAME, t);
            if (li === null || li.length === 0) 
                li = TerrItemToken.m_TerrOntology.tryAttach(t, null, false);
            else {
                let li1 = TerrItemToken.m_TerrOntology.tryAttach(t, null, false);
                if (li1 !== null && li1.length > 0) {
                    if (li1[0].lengthChar > li[0].lengthChar) 
                        li = li1;
                }
            }
        }
        let tt = Utils.as(t, TextToken);
        if (li !== null) {
            for (let i = li.length - 1; i >= 0; i--) {
                if (li[i].item !== null) {
                    let g = Utils.as(li[i].item.referent, GeoReferent);
                    if (g === null) 
                        continue;
                    if (g.isCity && !g.isRegion && !g.isState) 
                        li.splice(i, 1);
                    else if (g.isState && t.lengthChar === 2 && li[i].lengthChar === 2) {
                        if (!t.isWhitespaceBefore && t.previous !== null && t.previous.isChar('.')) 
                            li.splice(i, 1);
                        else if (t.previous !== null && t.previous.isValue("ДОМЕН", null)) 
                            li.splice(i, 1);
                    }
                    else if (g.isState && li[i].beginToken.isValue("ЛЮКСЕМБУРГ", null)) {
                        if (MiscLocationHelper.isUserParamAddress(li[i])) 
                            li.splice(i, 1);
                        else if (li[i].beginToken.previous !== null && li[i].beginToken.previous.isValue("РОЗА", null)) 
                            li.splice(i, 1);
                    }
                }
            }
            for (const nt of li) {
                if (nt.item !== null && !(nt.termin.tag instanceof IntOntologyItem)) {
                    if (!MiscHelper.isAllCharactersLower(nt.beginToken, nt.endToken, false) || nt.beginToken !== nt.endToken || MiscLocationHelper.isUserParamAddress(nt)) {
                        let res0 = TerrItemToken._new1544(nt.beginToken, nt.endToken, nt.item, nt.morph);
                        if (nt.endToken.morph._class.isAdjective && nt.beginToken === nt.endToken) {
                            if (nt.beginToken.getMorphClassInDictionary().isProperGeo) {
                            }
                            else 
                                res0.isAdjective = true;
                        }
                        let npt2 = NounPhraseHelper.tryParse(nt.beginToken, NounPhraseParseAttr.NO, 0, null);
                        if (npt2 !== null && npt2.endChar >= nt.endChar) 
                            res0.morph = npt2.morph;
                        if (nt.beginToken === nt.endToken && nt.chars.isLatinLetter) {
                            if (nt.item.referent.isState) {
                            }
                            else if (nt.item.referent.findSlot(GeoReferent.ATTR_TYPE, "state", true) !== null) {
                            }
                            else 
                                res0.isDoubt = true;
                        }
                        if (nt.beginToken === nt.endToken) {
                            for (const wf of nt.beginToken.morph.items) {
                                let f = Utils.as(wf, MorphWordForm);
                                if (!f.isInDictionary) 
                                    continue;
                                if (((wf._class.isProperSurname || wf._class.isProperName)) && f.isInDictionary) 
                                    res0.canBeSurname = true;
                            }
                        }
                        if ((li.length === 2 && nt === li[0] && li[1].item !== null) && !(li[1].termin.tag instanceof IntOntologyItem)) 
                            res0.ontoItem2 = li[1].item;
                        return res0;
                    }
                }
            }
            for (const nt of li) {
                if (nt.item !== null && (nt.termin.tag instanceof IntOntologyItem)) {
                    if (nt.endToken.next === null || !nt.endToken.next.isHiphen) {
                        let res1 = TerrItemToken._new1545(nt.beginToken, nt.endToken, nt.item, true, nt.morph);
                        if ((li.length === 2 && nt === li[0] && li[1].item !== null) && (li[1].termin.tag instanceof IntOntologyItem)) 
                            res1.ontoItem2 = li[1].item;
                        if (t.kit.baseLanguage.isUa && res1.ontoItem.canonicText === "СУДАН" && t.isValue("СУД", null)) 
                            return null;
                        if (res1.ontoItem.canonicText === "ЭВЕНКИЙСКИЙ") {
                            let tt2 = res1.endToken.next;
                            if (tt2 !== null && tt2.isValue("НАЦИОНАЛЬНЫЙ", null)) 
                                tt2 = tt2.next;
                            let _next = TerrItemToken._TryParse(tt2, null, false);
                            if (_next !== null && _next.terminItem !== null && _next.terminItem.canonicText.includes("РАЙОН")) {
                                _next.beginToken = t;
                                return _next;
                            }
                        }
                        return res1;
                    }
                }
            }
            for (const nt of li) {
                if (nt.termin !== null && nt.item === null) {
                    if (nt.endToken.next === null || !nt.endToken.next.isHiphen || !nt.termin.isAdjective) {
                        let res1 = TerrItemToken._new1546(nt.beginToken, nt.endToken, Utils.as(nt.termin, TerrTermin), nt.termin.isAdjective, nt.morph);
                        if (!res1.isAdjective) {
                            if (res1.terminItem.canonicText === "РАЙОН") {
                                if (t.previous !== null) {
                                    if (t.previous.isValue("МИКРО", null)) 
                                        return null;
                                    if (t.previous.isCharOf("\\/.") && t.previous.previous !== null && t.previous.previous.isValue("М", null)) 
                                        return null;
                                }
                                if (!res1.beginToken.isValue(res1.terminItem.canonicText, null)) {
                                    if (res1.endToken.next !== null && res1.endToken.next.isChar('.')) 
                                        res1.endToken = res1.endToken.next;
                                }
                            }
                            if (res1.terminItem.canonicText === "РЕСПУБЛИКА" || res1.terminItem.canonicText === "ШТАТ") {
                                let npt1 = MiscLocationHelper.tryParseNpt(res1.beginToken.previous);
                                if (npt1 !== null && npt1.morph.number === MorphNumber.PLURAL) {
                                    let res2 = TerrItemToken.tryParse(res1.endToken.next, null, null);
                                    if ((res2 !== null && res2.ontoItem !== null && res2.ontoItem.referent !== null) && res2.ontoItem.referent.findSlot(GeoReferent.ATTR_TYPE, "республика", true) !== null) {
                                    }
                                    else 
                                        return null;
                                }
                            }
                            if (res1.terminItem.canonicText === "КРАЙ" && res1.beginToken.isValue("КР", null)) {
                                if (res1.beginToken.chars.isCapitalUpper) 
                                    return null;
                            }
                            if (res1.terminItem.canonicText === "ВНУТРИГОРОДСКАЯ ТЕРРИТОРИЯ") {
                                let _next = TerrItemToken.tryParse(res1.endToken.next, null, null);
                                if (_next !== null && _next.terminItem !== null && _next.terminItem.canonicText === "МУНИЦИПАЛЬНЫЙ ОКРУГ") {
                                    _next.beginToken = res1.beginToken;
                                    res1 = _next;
                                }
                            }
                            if (res1.terminItem.canonicText === "ГОСУДАРСТВО") {
                                if (t.previous !== null && t.previous.isValue("СОЮЗНЫЙ", null)) 
                                    return null;
                            }
                            if (nt.beginToken === nt.endToken && ((nt.beginToken.isValue("ОПС", null) || nt.beginToken.isValue("ЗАО", null)))) {
                                if (!MiscLocationHelper.checkGeoObjectBefore(nt.beginToken, false)) 
                                    return null;
                            }
                        }
                        return res1;
                    }
                }
            }
        }
        if (tt === null) 
            return null;
        if (!tt.chars.isCapitalUpper && !tt.chars.isAllUpper) {
            if (tt.isValue("ИМЕНИ", null) || tt.isValue("ИМ", null)) {
            }
            else {
                if (!MiscLocationHelper.isUserParamAddress(tt)) 
                    return null;
                if (tt.lengthChar < 7) 
                    return null;
            }
        }
        if (((tt.lengthChar === 2 || tt.lengthChar === 3)) && tt.chars.isAllUpper) {
            if (TerrItemToken.m_Alpha2State.containsKey(tt.term)) {
                let ok = false;
                let tt2 = tt.next;
                if (tt2 !== null && tt2.isChar(':')) 
                    tt2 = tt2.next;
                if (tt2 instanceof ReferentToken) {
                    let r = tt2.getReferent();
                    if (r !== null && r.typeName === "PHONE") 
                        ok = true;
                }
                if (ok) 
                    return TerrItemToken._new1533(tt, tt, TerrItemToken.m_Alpha2State.get(tt.term));
            }
        }
        if (tt instanceof TextToken) {
            if (tt.term === "ИМ" || tt.term === "ИМЕНИ") {
                let str = StreetItemToken.tryParse(tt, null, false, null);
                if (str !== null && str.typ === StreetItemType.NAME && TerrItemToken.m_TerrOntology.tryAttach(tt.next, null, false) === null) 
                    return TerrItemToken._new1548(tt, str.endToken, str);
            }
        }
        if (tt.lengthChar < 3) 
            return null;
        if (MiscHelper.isEngArticle(tt)) 
            return null;
        if (tt.lengthChar < 5) {
            if (tt.next === null || !tt.next.isHiphen) 
                return null;
        }
        let t0 = tt;
        let prefix = null;
        if (t0.next !== null && t0.next.isHiphen && (t0.next.next instanceof TextToken)) {
            tt = Utils.as(t0.next.next, TextToken);
            if (!tt.chars.isAllLower && ((t0.isWhitespaceAfter || t0.next.isWhitespaceAfter))) {
                let tit = TerrItemToken._TryParse(tt, prev, false);
                if (tit !== null) {
                    if (tit.ontoItem !== null) 
                        return null;
                }
            }
            if (tt.lengthChar > 1) {
                if (tt.chars.isCapitalUpper) 
                    prefix = t0.term;
                else if (!tt.isWhitespaceBefore && !t0.isWhitespaceAfter) 
                    prefix = t0.term;
                if (((!tt.isWhitespaceAfter && tt.next !== null && tt.next.isHiphen) && !tt.next.isWhitespaceAfter && (tt.next.next instanceof TextToken)) && tt.next.next.chars.equals(t0.chars)) {
                    prefix = (prefix + "-" + tt.term);
                    tt = Utils.as(tt.next.next, TextToken);
                }
            }
            if (prefix === null) 
                tt = t0;
        }
        if (tt.morph._class.isAdverb) 
            return null;
        if (CityItemToken.checkKeyword(t0) !== null) 
            return null;
        if (!tt.morph._class.isAdjective) {
            if (CityItemToken.checkOntoItem(t0) !== null) {
                if ((prev !== null && prev.terminItem !== null && prev.terminItem.canonicText.includes("МУНИЦИПАЛ")) && MiscLocationHelper.isUserParamAddress(t0)) {
                }
                else 
                    return null;
            }
        }
        let npt = MiscLocationHelper.tryParseNpt(t0);
        if (npt !== null) {
            if (((npt.noun.isValue("ФЕДЕРАЦИЯ", null) || npt.noun.isValue("ФЕДЕРАЦІЯ", null))) && npt.adjectives.length === 1) {
                if (MiscHelper.isNotMoreThanOneError("РОССИЙСКАЯ", npt.adjectives[0]) || MiscHelper.isNotMoreThanOneError("РОСІЙСЬКА", npt.adjectives[0])) 
                    return TerrItemToken._new1544(npt.beginToken, npt.endToken, (t0.kit.baseLanguage.isUa ? TerrItemToken.m_RussiaUA : TerrItemToken.m_RussiaRU), npt.morph);
            }
        }
        if (t0.morph._class.isProperName) {
            if (t0.isWhitespaceAfter || t0.next.isWhitespaceAfter) 
                return null;
        }
        if (!t0.chars.isAllLower) {
            let tok2 = TerrItemToken.m_SpecNames.tryParse(t0, TerminParseAttr.NO);
            if (tok2 !== null) 
                return TerrItemToken._new1550(t0, tok2.endToken, true);
        }
        if (npt !== null && npt.endToken !== npt.beginToken) {
            if (npt.endToken.isValue("КИЛОМЕТР", null)) 
                npt = null;
            else if (npt.endToken.isValue("ПАРК", null)) {
            }
            else if (AddressItemToken.checkStreetAfter(npt.endToken, true)) 
                npt = null;
            else {
                let tok = TerrItemToken.m_TerrOntology.tryAttach(npt.endToken, null, false);
                if (tok !== null) 
                    npt = null;
                else {
                    let _next = TerrItemToken.tryParse(npt.endToken, null, null);
                    if (_next !== null && _next.terminItem !== null) {
                        if (MiscLocationHelper.checkGeoObjectAfter(npt.endToken.previous, false, false)) 
                            npt = null;
                    }
                    else if (CityItemToken.checkKeyword(npt.endToken) !== null) {
                        if (MiscLocationHelper.checkGeoObjectAfter(npt.endToken.previous, false, false)) 
                            npt = null;
                    }
                }
            }
        }
        if (npt !== null && npt.endToken === tt.next) {
            let adj = false;
            let regAfter = false;
            if (npt.adjectives.length === 1 && !t0.chars.isAllLower) {
                if (((((tt.next.isValue("РАЙОН", null) || tt.next.isValue("ОБЛАСТЬ", null) || tt.next.isValue("КРАЙ", null)) || tt.next.isValue("ВОЛОСТЬ", null) || tt.next.isValue("УЛУС", null)) || tt.next.isValue("ОКРУГ", null) || tt.next.isValue("АВТОНОМИЯ", "АВТОНОМІЯ")) || tt.next.isValue("РЕСПУБЛИКА", "РЕСПУБЛІКА") || tt.next.isValue("COUNTY", null)) || tt.next.isValue("STATE", null) || tt.next.isValue("REGION", null)) 
                    regAfter = true;
                else {
                    let tok = TerrItemToken.m_TerrOntology.tryAttach(tt.next, null, false);
                    if (tok !== null) {
                        if ((((tok[0].termin.canonicText === "РАЙОН" || tok[0].termin.canonicText === "ОБЛАСТЬ" || tok[0].termin.canonicText === "УЛУС") || tok[0].termin.canonicText === "КРАЙ" || tok[0].termin.canonicText === "ВОЛОСТЬ") || tok[0].termin.canonicText === "ОКРУГ" || tok[0].termin.canonicText === "АВТОНОМИЯ") || tok[0].termin.canonicText === "АВТОНОМІЯ" || ((tok[0].chars.isLatinLetter && (tok[0].termin instanceof TerrTermin) && tok[0].termin.isRegion))) 
                            regAfter = true;
                    }
                }
            }
            if (regAfter) {
                adj = true;
                for (const wff of tt.morph.items) {
                    let wf = Utils.as(wff, MorphWordForm);
                    if (wf === null) 
                        continue;
                    if (wf._class.isVerb && wf.isInDictionary) {
                        adj = false;
                        break;
                    }
                    else if (wf.isInDictionary && !wf._class.isAdjective) {
                    }
                }
                if (!adj && prefix !== null) 
                    adj = true;
                if (!adj) {
                    if (CityItemToken.checkKeyword(tt.next.next) !== null || CityItemToken.checkOntoItem(tt.next.next) !== null) 
                        adj = true;
                }
                if (!adj) {
                    if (MiscLocationHelper.checkGeoObjectBefore(npt.beginToken, false)) 
                        adj = true;
                }
                let te = tt.next.next;
                if (te !== null && te.isCharOf(",")) 
                    te = te.next;
                if (!adj && (te instanceof ReferentToken)) {
                    if (te.getReferent() instanceof GeoReferent) 
                        adj = true;
                }
                if (!adj) {
                    te = t0.previous;
                    if (te !== null && te.isCharOf(",")) 
                        te = te.previous;
                    if (te instanceof ReferentToken) {
                        if (te.getReferent() instanceof GeoReferent) 
                            adj = true;
                    }
                }
                if (adj && npt.adjectives[0].beginToken !== npt.adjectives[0].endToken) {
                    if (!npt.adjectives[0].beginToken.chars.equals(npt.adjectives[0].endToken.chars)) 
                        return null;
                }
            }
            else if ((npt.adjectives.length === 1 && (npt.endToken instanceof TextToken) && npt.endToken.getMorphClassInDictionary().isNoun) && prev !== null && prev.terminItem !== null) {
                adj = true;
                tt = Utils.as(npt.endToken, TextToken);
            }
            if (!adj && !t0.chars.isLatinLetter) 
                return null;
        }
        let res = new TerrItemToken(t0, tt);
        res.isAdjective = tt.morph._class.isAdjective;
        res.morph = tt.morph;
        if (npt !== null && npt.endChar > res.endChar && npt.morph.gender !== MorphGender.UNDEFINED) {
            res.morph = new MorphCollection(tt.morph);
            res.morph.removeItems(npt.morph.gender, false);
        }
        if (t0 instanceof TextToken) {
            for (const wf of t0.morph.items) {
                let f = Utils.as(wf, MorphWordForm);
                if (!f.isInDictionary) 
                    continue;
                if (((wf._class.isProperSurname || wf._class.isProperName)) && f.isInDictionary) 
                    res.canBeSurname = true;
                else if (wf._class.isAdjective && f.isInDictionary) 
                    res.isAdjInDictionary = true;
                else if (wf._class.isProperGeo) {
                    if (!t0.chars.isAllLower) 
                        res.isGeoInDictionary = true;
                }
            }
        }
        if ((tt.whitespacesAfterCount < 2) && (tt.next instanceof TextToken) && tt.next.chars.isCapitalUpper) {
            let dir = MiscLocationHelper.tryAttachNordWest(tt.next);
            if (dir !== null) 
                res.endToken = dir.endToken;
            else if (t0 === tt && t0.isValue("ОЗЕРО", null)) {
                let rtt = t0.kit.processReferent("NAMEDENTITY", t0, null);
                if (rtt !== null) 
                    res.endToken = rtt.endToken;
            }
        }
        if (((res.beginToken === res.endToken && res.isAdjective && (res.whitespacesAfterCount < 2)) && (res.endToken.next instanceof TextToken) && res.endToken.next.chars.isCapitalUpper) && prev !== null) {
            if (MiscLocationHelper.checkGeoObjectAfter(res.endToken.next, false, false)) 
                res.endToken = res.endToken.next;
            else if (AddressItemToken.checkStreetAfter(res.endToken.next.next, false)) 
                res.endToken = res.endToken.next;
        }
        return res;
    }
    
    static _tryParseDistrictName(t, lev = 0, prev = null) {
        const CityItemToken = require("./CityItemToken");
        if (lev > 2) 
            return null;
        if (!(t instanceof TextToken) || !t.chars.isCapitalUpper || !t.chars.isCyrillicLetter) 
            return null;
        if ((t.next !== null && t.next.isHiphen && (t.next.next instanceof TextToken)) && t.next.next.chars.equals(t.chars)) {
            let tok = TerrItemToken.m_TerrOntology.tryAttach(t, null, false);
            if ((tok !== null && tok[0].item !== null && (tok[0].item.referent instanceof GeoReferent)) && tok[0].item.referent.isState) 
                return null;
            tok = TerrItemToken.m_TerrOntology.tryAttach(t.next.next, null, false);
            if ((tok !== null && tok[0].item !== null && (tok[0].item.referent instanceof GeoReferent)) && tok[0].item.referent.isState) 
                return null;
            return new TerrItemToken(t, t.next.next);
        }
        if ((t.next instanceof TextToken) && t.next.chars.equals(t.chars)) {
            let npt = MiscLocationHelper.tryParseNpt(t);
            if (npt !== null && npt.endToken === t.next && npt.adjectives.length === 1) {
                if (!npt.endToken.morph._class.isAdjective || ((npt.endToken.morph._case.isNominative && (npt.endToken instanceof TextToken) && LanguageHelper.endsWith(npt.endToken.term, "О")))) {
                    let ty = TerrItemToken._TryParse(t.next, null, false);
                    if (ty !== null && ty.terminItem !== null) 
                        return null;
                    return new TerrItemToken(t, t.next);
                }
            }
        }
        let str = t.term;
        let res = TerrItemToken._new1551(t, t, true);
        if (!LanguageHelper.endsWith(str, "О")) 
            res.isDoubt = true;
        let dir = MiscLocationHelper.tryAttachNordWest(t);
        if (dir !== null) {
            res.endToken = dir.endToken;
            res.isDoubt = false;
            if (res.endToken.whitespacesAfterCount < 2) {
                let res2 = TerrItemToken._tryParseDistrictName(res.endToken.next, lev + 1, null);
                if (res2 !== null && res2.terminItem === null) 
                    res.endToken = res2.endToken;
            }
        }
        let cit = CityItemToken.tryParse(t, null, false, null);
        if (cit !== null && cit.typ === CityItemTokenItemType.CITY && cit.ontoItem !== null) {
            if (prev !== null && prev.terminItem !== null) {
                if (prev.terminItem.canonicText.includes("ГОРОД")) 
                    return new TerrItemToken(t, cit.endToken);
            }
            return null;
        }
        return res;
    }
    
    static _new1531(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.ontoItem = _arg3;
        res.terminItem = _arg4;
        return res;
    }
    
    static _new1532(_arg1, _arg2, _arg3) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.terminItem = _arg3;
        return res;
    }
    
    static _new1533(_arg1, _arg2, _arg3) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.ontoItem = _arg3;
        return res;
    }
    
    static _new1544(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.ontoItem = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new1545(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.ontoItem = _arg3;
        res.isAdjective = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new1546(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.terminItem = _arg3;
        res.isAdjective = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new1548(_arg1, _arg2, _arg3) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.namedBy = _arg3;
        return res;
    }
    
    static _new1550(_arg1, _arg2, _arg3) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.isDistrictName = _arg3;
        return res;
    }
    
    static _new1551(_arg1, _arg2, _arg3) {
        let res = new TerrItemToken(_arg1, _arg2);
        res.isDoubt = _arg3;
        return res;
    }
    
    static static_constructor() {
        TerrItemToken.m_TerrOntology = null;
        TerrItemToken.m_GeoAbbrs = null;
        TerrItemToken.m_RussiaRU = null;
        TerrItemToken.m_RussiaUA = null;
        TerrItemToken.m_MosRegRU = null;
        TerrItemToken.m_LenRegRU = null;
        TerrItemToken.m_Belorussia = null;
        TerrItemToken.m_Kazahstan = null;
        TerrItemToken.m_TamogSous = null;
        TerrItemToken.m_Tatarstan = null;
        TerrItemToken.m_Udmurtia = null;
        TerrItemToken.m_Dagestan = null;
        TerrItemToken.M_TERR_ADJS = null;
        TerrItemToken.M_MANS_BY_STATE = null;
        TerrItemToken.m_UnknownRegions = null;
        TerrItemToken.m_TerrNounAdjectives = null;
        TerrItemToken.m_CapitalsByState = null;
        TerrItemToken.m_Obl = null;
        TerrItemToken.m_Alpha2State = null;
        TerrItemToken.m_SpecNames = null;
        TerrItemToken.m_Raion = null;
        TerrItemToken.m_AllStates = new Array();
        TerrItemToken.SPEED_REGIME = false;
    }
}


TerrItemToken.static_constructor();

module.exports = TerrItemToken