/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");
const XmlDocument = require("./../../../unisharp/XmlDocument");

const MorphNumber = require("./../../../morph/MorphNumber");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const AddressItemType = require("./../../address/internal/AddressItemType");
const Condition = require("./Condition");
const MorphCollection = require("./../../MorphCollection");
const Token = require("./../../Token");
const StreetItemType = require("./../../address/internal/StreetItemType");
const GeoReferent = require("./../GeoReferent");
const ReferentToken = require("./../../ReferentToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const NumberSpellingType = require("./../../NumberSpellingType");
const ReferentsEqualType = require("./../../core/ReferentsEqualType");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const GeoTokenType = require("./GeoTokenType");
const NumberExType = require("./../../core/NumberExType");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MorphGender = require("./../../../morph/MorphGender");
const Referent = require("./../../Referent");
const DateReferent = require("./../../date/DateReferent");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const MorphLang = require("./../../../morph/MorphLang");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const TextToken = require("./../../TextToken");
const BracketHelper = require("./../../core/BracketHelper");
const PullentiNerAddressInternalResourceHelper = require("./../../address/internal/PullentiNerAddressInternalResourceHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const GeoTokenData = require("./GeoTokenData");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const IntOntologyCollection = require("./../../core/IntOntologyCollection");
const MiscLocationHelper = require("./MiscLocationHelper");
const NumberHelper = require("./../../core/NumberHelper");
const IntOntologyItem = require("./../../core/IntOntologyItem");
const GeoAnalyzer = require("./../GeoAnalyzer");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const TerrItemToken = require("./TerrItemToken");
const AddressItemToken = require("./../../address/internal/AddressItemToken");
const OrgTypToken = require("./OrgTypToken");

class CityItemToken extends MetaToken {
    
    static initialize() {
        const NameToken = require("./NameToken");
        if (CityItemToken.m_Ontology !== null) 
            return;
        CityItemToken.m_Ontology = new IntOntologyCollection();
        CityItemToken.m_OntologyEx = new IntOntologyCollection();
        CityItemToken.M_CITY_ADJECTIVES = new TerminCollection();
        let t = null;
        t = new Termin("ГОРОД");
        t.addAbridge("ГОР.");
        t.addAbridge("Г.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("ГОРД");
        t.addAbridge("ГРД");
        t.addVariant("ГОРОД ФЕДЕРАЛЬНОГО ЗНАЧЕНИЯ", false);
        t.addVariant("ГОРОД ГОРОДСКОЕ ПОСЕЛЕНИЕ", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ГОРОДОК");
        t.tag = CityItemTokenItemType.NOUN;
        t.addVariant("ШАХТЕРСКИЙ ГОРОДОК", false);
        t.addVariant("ПРИМОРСКИЙ ГОРОДОК", false);
        t.addVariant("МАЛЕНЬКИЙ ГОРОДОК", false);
        t.addVariant("НЕБОЛЬШОЙ ГОРОДОК", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("CITY");
        t.tag = CityItemTokenItemType.NOUN;
        t.addVariant("TOWN", false);
        t.addVariant("CAPITAL", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("МІСТО", MorphLang.UA);
        t.addAbridge("МІС.");
        t.addAbridge("М.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1174("ГОРОД-ГЕРОЙ", "ГОРОД");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1196("МІСТО-ГЕРОЙ", MorphLang.UA, "МІСТО");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1174("ГОРОД-КУРОРТ", "ГОРОД");
        t.addAbridge("Г.К.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1196("МІСТО-КУРОРТ", MorphLang.UA, "МІСТО");
        t.addAbridge("М.К.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛО");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ДЕРЕВНЯ");
        t.addAbridge("ДЕР.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛЕНИЕ");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("СЕЛ.");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛО", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ПОСЕЛЕНИЕ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ПОСЕЛОК");
        t.addAbridge("ПОС.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addVariant("ЖИЛОЙ ПОСЕЛОК", false);
        t.addVariant("КУРОРТНЫЙ ПОСЕЛОК", false);
        t.addVariant("ВАХТОВЫЙ ПОСЕЛОК", false);
        t.addVariant("ШАХТЕРСКИЙ ПОСЕЛОК", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛИЩЕ", MorphLang.UA);
        t.addAbridge("СЕЛ.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ПОСЕЛОК ГОРОДСКОГО ТИПА");
        t.acronym = (t.acronymSmart = "ПГТ");
        t.addAbridge("ПГТ.");
        t.addAbridge("П.Г.Т.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("ПОС.Г.Т.");
        t.addVariant("ГОРОДСКОЙ ПОСЕЛОК", false);
        t.addAbridge("ГОРОДСКОЙ ПОС.");
        t.addAbridge("ГОР.ПОС.");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛИЩЕ МІСЬКОГО ТИПУ", MorphLang.UA);
        t.acronym = (t.acronymSmart = "СМТ");
        t.addAbridge("СМТ.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("РАБОЧИЙ ПОСЕЛОК");
        t.addAbridge("Р.П.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("РАБ.П.");
        t.addAbridge("Р.ПОС.");
        t.addAbridge("РАБ.ПОС.");
        t.addAbridge("РП");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("РОБОЧЕ СЕЛИЩЕ", MorphLang.UA);
        t.addAbridge("Р.С.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ДАЧНЫЙ ПОСЕЛОК");
        t.addAbridge("Д.П.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("ДАЧ.П.");
        t.addAbridge("Д.ПОС.");
        t.addAbridge("ДАЧ.ПОС.");
        t.addVariant("ЖИЛИЩНО ДАЧНЫЙ ПОСЕЛОК", false);
        t.addVariant("ДАЧНОЕ ПОСЕЛЕНИЕ", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ДАЧНЕ СЕЛИЩЕ", MorphLang.UA);
        t.addAbridge("Д.С.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("ДАЧ.С.");
        t.addAbridge("Д.СЕЛ.");
        t.addAbridge("ДАЧ.СЕЛ.");
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1199("ГОРОДСКОЕ ПОСЕЛЕНИЕ", "ГП", true);
        t.addAbridge("Г.П.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("Г.ПОС.");
        t.addAbridge("ГОР.П.");
        t.addAbridge("ГОР.ПОС.");
        t.addAbridge("ГП.");
        t.addVariant("ГОРОДСКОЙ ПОСЕЛОК", false);
        t.addAbridge("Г.О.Г.");
        t.addAbridge("ГОРОДСКОЙ ОКРУГ Г.");
        CityItemToken.m_Ontology.add(t);
        t = Termin._new381("ПОСЕЛКОВОЕ ПОСЕЛЕНИЕ", "ПОСЕЛОК", CityItemTokenItemType.NOUN);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("МІСЬКЕ ПОСЕЛЕННЯ", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЕЛЬСКОЕ ПОСЕЛЕНИЕ");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("С.ПОС.");
        t.addAbridge("С.П.");
        t.addVariant("СЕЛЬСКИЙ ПОСЕЛОК", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СІЛЬСЬКЕ ПОСЕЛЕННЯ", MorphLang.UA);
        t.addAbridge("С.ПОС.");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СТАНИЦА");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("СТ-ЦА");
        t.addAbridge("СТАН-ЦА");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СТАНИЦЯ", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1174("СТОЛИЦА", "ГОРОД");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1196("СТОЛИЦЯ", MorphLang.UA, "МІСТО");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СТАНЦИЯ");
        t.addAbridge("СТАНЦ.");
        t.addAbridge("СТ.");
        t.addAbridge("СТАН.");
        t.tag = CityItemTokenItemType.NOUN;
        t.addVariant("ПЛАТФОРМА", false);
        t.addAbridge("ПЛАТФ.");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СТАНЦІЯ", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ЖЕЛЕЗНОДОРОЖНАЯ СТАНЦИЯ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ЗАЛІЗНИЧНА СТАНЦІЯ", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("НАСЕЛЕННЫЙ ПУНКТ");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("Н.П.");
        t.addAbridge("Б.Н.П.");
        t.addAbridge("НП");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("НАСЕЛЕНИЙ ПУНКТ", MorphLang.UA);
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("НП");
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1174("РАЙОННЫЙ ЦЕНТР", "НАСЕЛЕННЫЙ ПУНКТ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1196("РАЙОННИЙ ЦЕНТР", MorphLang.UA, "НАСЕЛЕНИЙ ПУНКТ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1174("ОБЛАСТНОЙ ЦЕНТР", "НАСЕЛЕННЫЙ ПУНКТ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = Termin._new1196("ОБЛАСНИЙ ЦЕНТР", MorphLang.UA, "НАСЕЛЕНИЙ ПУНКТ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ПОЧИНОК");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ХУТОР");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("СЛОБОДА");
        t.tag = CityItemTokenItemType.NOUN;
        t.addAbridge("СЛ.");
        t.addAbridge("СЛОБ.");
        CityItemToken.m_Ontology.add(t);
        t = new Termin("АУЛ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ААЛ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("УЛУС");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("НАСЛЕГ");
        t.tag = CityItemTokenItemType.NOUN;
        t.addVariant("НАЦИОНАЛЬНЫЙ НАСЛЕГ", false);
        CityItemToken.m_Ontology.add(t);
        t = new Termin("АРБАН");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        t = new Termin("ВЫСЕЛКИ");
        t.tag = CityItemTokenItemType.NOUN;
        CityItemToken.m_Ontology.add(t);
        for (const s of ["ЖИТЕЛЬ", "МЭР"]) {
            CityItemToken.m_Ontology.add(Termin._new170(s, CityItemTokenItemType.MISC));
        }
        for (const s of ["ЖИТЕЛЬ", "МЕР"]) {
            CityItemToken.m_Ontology.add(Termin._new690(s, MorphLang.UA, CityItemTokenItemType.MISC));
        }
        t = Termin._new170("АДМИНИСТРАЦИЯ", CityItemTokenItemType.MISC);
        t.addAbridge("АДМ.");
        CityItemToken.m_Ontology.add(t);
        CityItemToken.m_StdAdjectives = new IntOntologyCollection();
        t = new Termin("ВЕЛИКИЙ");
        t.addAbridge("ВЕЛ.");
        t.addAbridge("ВЕЛИК.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("БОЛЬШОЙ");
        t.addAbridge("БОЛ.");
        t.addAbridge("БОЛЬШ.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("МАЛЫЙ");
        t.addAbridge("МАЛ.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("ВЕРХНИЙ");
        t.addAbridge("ВЕР.");
        t.addAbridge("ВЕРХ.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("НИЖНИЙ");
        t.addAbridge("НИЖ.");
        t.addAbridge("НИЖН.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("СРЕДНИЙ");
        t.addAbridge("СРЕД.");
        t.addAbridge("СРЕДН.");
        t.addAbridge("СР.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("СТАРЫЙ");
        t.addAbridge("СТ.");
        t.addAbridge("СТАР.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("НОВЫЙ");
        t.addAbridge("НОВ.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("ВЕЛИКИЙ", MorphLang.UA);
        t.addAbridge("ВЕЛ.");
        t.addAbridge("ВЕЛИК.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("МАЛИЙ", MorphLang.UA);
        t.addAbridge("МАЛ.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("ВЕРХНІЙ", MorphLang.UA);
        t.addAbridge("ВЕР.");
        t.addAbridge("ВЕРХ.");
        t.addAbridge("ВЕРХН.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("НИЖНІЙ", MorphLang.UA);
        t.addAbridge("НИЖ.");
        t.addAbridge("НИЖН.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("СЕРЕДНІЙ", MorphLang.UA);
        t.addAbridge("СЕР.");
        t.addAbridge("СЕРЕД.");
        t.addAbridge("СЕРЕДН.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("СТАРИЙ", MorphLang.UA);
        t.addAbridge("СТ.");
        t.addAbridge("СТАР.");
        CityItemToken.m_StdAdjectives.add(t);
        t = new Termin("НОВИЙ", MorphLang.UA);
        t.addAbridge("НОВ.");
        CityItemToken.m_StdAdjectives.add(t);
        CityItemToken.m_StdAdjectives.add(new Termin("SAN"));
        CityItemToken.m_StdAdjectives.add(new Termin("LOS"));
        CityItemToken.m_SpecNames = new TerminCollection();
        for (const s of NameToken.standardNames) {
            let pp = Utils.splitString(s, ';', false);
            t = Termin._new1210(pp[0], true);
            for (let kk = 1; kk < pp.length; kk++) {
                if (pp[kk].indexOf('.') > 0) 
                    t.addAbridge(pp[kk]);
                else if (t.acronym === null && (pp[kk].length < 4)) 
                    t.acronym = pp[kk];
                else 
                    t.addVariant(pp[kk], false);
            }
            CityItemToken.m_SpecNames.add(t);
        }
        CityItemToken.m_SpecAbbrs = new TerminCollection();
        let dat = PullentiNerAddressInternalResourceHelper.getBytes("c.dat");
        if (dat === null) 
            throw new Error("Not found resource file c.dat in Analyzer.Location");
        let tmp = new MemoryStream(MiscLocationHelper.deflate(dat)); 
        try {
            tmp.position = 0;
            let xml = new XmlDocument();
            xml.loadStream(tmp);
            for (const x of xml.document_element.child_nodes) {
                if (x.name === "bigcity") 
                    CityItemToken.loadBigCity(x);
                else if (x.name === "city") 
                    CityItemToken.loadCity(x);
            }
        }
        finally {
            tmp.close();
        }
    }
    
    static loadCity(xml) {
        let ci = new IntOntologyItem(null);
        let onto = CityItemToken.m_OntologyEx;
        let lang = MorphLang.RU;
        if (Utils.getXmlAttrByName(xml.attributes, "l") !== null && Utils.getXmlAttrByName(xml.attributes, "l").value === "ua") 
            lang = MorphLang.UA;
        for (const x of xml.child_nodes) {
            if (x.name === "n") {
                let v = x.inner_text;
                let t = new Termin();
                t.initByNormalText(v, lang);
                ci.termins.push(t);
                t.addStdAbridges();
                if (v.startsWith("SAINT ")) 
                    t.addAbridge("ST. " + v.substring(6));
                else if (v.startsWith("SAITNE ")) 
                    t.addAbridge("STE. " + v.substring(7));
            }
        }
        onto.addItem(ci);
    }
    
    static loadBigCity(xml) {
        let ci = new IntOntologyItem(null);
        ci.miscAttr = ci;
        let adj = null;
        let onto = CityItemToken.m_OntologyEx;
        let cityAdj = CityItemToken.M_CITY_ADJECTIVES;
        let lang = MorphLang.RU;
        if (Utils.getXmlAttrByName(xml.attributes, "l") !== null) {
            let la = Utils.getXmlAttrByName(xml.attributes, "l").value;
            if (la === "ua") 
                lang = MorphLang.UA;
            else if (la === "en") 
                lang = MorphLang.EN;
        }
        for (const x of xml.child_nodes) {
            if (x.name === "n") {
                let v = x.inner_text;
                if (Utils.isNullOrEmpty(v)) 
                    continue;
                let t = new Termin();
                t.initByNormalText(v, lang);
                ci.termins.push(t);
                if (v === "САНКТ-ПЕТЕРБУРГ") {
                    if (CityItemToken.m_StPeterburg === null) 
                        CityItemToken.m_StPeterburg = ci;
                    t.acronym = "СПБ";
                    t.addAbridge("С.ПЕТЕРБУРГ");
                    t.addAbridge("СП-Б");
                    t.addAbridge("С-ПБ");
                    ci.termins.push(new Termin("ПЕТЕРБУРГ", lang));
                }
                else if (v.startsWith("SAINT ")) 
                    t.addAbridge("ST. " + v.substring(6));
                else if (v.startsWith("SAITNE ")) 
                    t.addAbridge("STE. " + v.substring(7));
                else if (v.startsWith("НИЖН") && v.indexOf(' ') > 0) {
                    let ii = v.indexOf(' ');
                    let vv = v.substring(ii + 1);
                    t.addAbridge("Н." + vv);
                    t.addAbridge("H." + vv);
                    t.addAbridge("Н-" + vv);
                    t.addAbridge("H-" + vv);
                    t.addAbridge("НИЖ." + vv);
                    t.addAbridge("НИЖН." + vv);
                    t.addAbridge("Н" + vv);
                    t.ignoreTermsOrder = true;
                }
            }
            else if (x.name === "a") 
                adj = x.inner_text;
        }
        onto.addItem(ci);
        if (!Utils.isNullOrEmpty(adj)) {
            let at = new Termin();
            at.initByNormalText(adj, lang);
            at.tag = ci;
            cityAdj.add(at);
            let spb = adj === "САНКТ-ПЕТЕРБУРГСКИЙ" || adj === "САНКТ-ПЕТЕРБУРЗЬКИЙ";
            if (spb) 
                cityAdj.add(Termin._new690(adj.substring(6), lang, ci));
        }
    }
    
    static checkOntoItem(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let li = CityItemToken.m_OntologyEx.tryAttach(t, null, false);
        if (li !== null) {
            for (const nt of li) {
                if (nt.item !== null) 
                    return nt;
            }
        }
        return null;
    }
    
    static checkKeyword(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let li = CityItemToken.m_Ontology.tryAttach(t, null, false);
        if (li !== null) {
            for (const nt of li) {
                if (nt.item === null) {
                    if (nt.termin.canonicText === "ГОРОДОК" && MiscLocationHelper.isUserParamAddress(t)) 
                        return null;
                    return nt;
                }
            }
        }
        return null;
    }
    
    static tryParseList(t, maxCount, ad = null) {
        const OrgItemToken = require("./OrgItemToken");
        let ci = CityItemToken.tryParse(t, null, false, ad);
        if (ci === null) {
            if (t === null) 
                return null;
            if (((t instanceof TextToken) && t.isValue("МУНИЦИПАЛЬНЫЙ", null) && t.next !== null) && t.next.isValue("ОБРАЗОВАНИЕ", null)) {
                let t1 = t.next.next;
                let br = false;
                if (BracketHelper.canBeStartOfSequence(t1, false, false)) {
                    br = true;
                    t1 = t1.next;
                }
                let lii = CityItemToken.tryParseList(t1, maxCount, null);
                if (lii !== null && lii[0].typ === CityItemTokenItemType.NOUN) {
                    lii[0].beginToken = t;
                    lii[0].doubtful = false;
                    if (br && BracketHelper.canBeEndOfSequence(lii[lii.length - 1].endToken.next, false, null, false)) 
                        lii[lii.length - 1].endToken = lii[lii.length - 1].endToken.next;
                    return lii;
                }
            }
            return null;
        }
        if (ci.chars.isLatinLetter && ci.typ === CityItemTokenItemType.NOUN && !t.chars.isAllLower) 
            return null;
        let li = new Array();
        li.push(ci);
        for (t = ci.endToken.next; t !== null; t = t.next) {
            if (t.isNewlineBefore) {
                if (t.newlinesBeforeCount > 1) 
                    break;
                if (li.length === 1 && li[0].typ === CityItemTokenItemType.NOUN) {
                }
                else 
                    break;
            }
            let ci0 = CityItemToken.tryParse(t, ci, false, ad);
            if (ci0 === null) {
                if (t.isNewlineBefore) 
                    break;
                if (ci.typ === CityItemTokenItemType.NOUN && BracketHelper.canBeStartOfSequence(t, true, false)) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if ((br !== null && (br.lengthChar < 50) && t.next.chars.isCyrillicLetter) && !t.next.chars.isAllLower) {
                        ci0 = CityItemToken._new1212(br.beginToken, br.endToken, CityItemTokenItemType.PROPERNAME);
                        let tt = br.endToken.previous;
                        let num = null;
                        if (tt instanceof NumberToken) {
                            num = tt.value.toString();
                            tt = tt.previous;
                            if (tt !== null && tt.isHiphen) 
                                tt = tt.previous;
                        }
                        ci0.value = MiscHelper.getTextValue(br.beginToken.next, tt, GetTextAttr.NO);
                        if (tt !== br.beginToken.next) 
                            ci0.altValue = MiscHelper.getTextValue(br.beginToken.next, tt, GetTextAttr.NO);
                        if (Utils.isNullOrEmpty(ci0.value)) 
                            ci0 = null;
                        else if (num !== null) {
                            ci0.value = (ci0.value + "-" + num);
                            if (ci0.altValue !== null) 
                                ci0.altValue = (ci0.altValue + "-" + num);
                        }
                    }
                }
                if ((ci0 === null && ((ci.typ === CityItemTokenItemType.PROPERNAME || ci.typ === CityItemTokenItemType.CITY)) && t.isComma) && li[0] === ci) {
                    let npt = MiscLocationHelper.tryParseNpt(t.next);
                    if (npt !== null) {
                        for (let tt = t.next; tt !== null && tt.endChar <= npt.endChar; tt = tt.next) {
                            let ci00 = CityItemToken.tryParse(tt, ci, false, null);
                            if (ci00 !== null && ci00.typ === CityItemTokenItemType.NOUN) {
                                let ci01 = CityItemToken.tryParse(ci00.endToken.next, ci, false, null);
                                if (ci01 !== null) 
                                    break;
                                let org = OrgItemToken.tryParse(ci00.endToken.next, null);
                                if (org !== null) 
                                    break;
                                ci0 = ci00;
                                ci0.altValue = MiscHelper.getTextValue(t.next, ci00.endToken, (t.kit.baseLanguage.isEn ? GetTextAttr.IGNOREARTICLES : GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE)).toLowerCase();
                                break;
                            }
                            if (!tt.chars.isAllLower) 
                                break;
                        }
                    }
                }
                if (ci0 === null) 
                    break;
            }
            if ((ci0.typ === CityItemTokenItemType.NOUN && ci0.value !== null && LanguageHelper.endsWith(ci0.value, "УСАДЬБА")) && ci.typ === CityItemTokenItemType.NOUN) {
                ci.doubtful = false;
                t = ci.endToken = ci0.endToken;
                continue;
            }
            if (ci0.typ === CityItemTokenItemType.NOUN && ci.typ === CityItemTokenItemType.MISC && ci.value === "АДМИНИСТРАЦИЯ") 
                ci0.doubtful = false;
            if (ci.mergeWithNext(ci0)) {
                t = ci.endToken;
                continue;
            }
            ci = ci0;
            li.push(ci);
            t = ci.endToken;
            if (maxCount > 0 && li.length >= maxCount) 
                break;
        }
        if (li.length > 1 && li[0].value === "СОВЕТ") 
            return null;
        if (li.length > 2 && li[0].typ === CityItemTokenItemType.NOUN && li[1].typ === CityItemTokenItemType.NOUN) {
            if (li[0].mergeWithNext(li[1])) 
                li.splice(1, 1);
        }
        if (li.length > 2 && li[0].isNewlineAfter) 
            li.splice(1, li.length - 1);
        if (!li[0].geoObjectBefore) 
            li[0].geoObjectBefore = MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false);
        if (!li[li.length - 1].geoObjectAfter) 
            li[li.length - 1].geoObjectAfter = MiscLocationHelper.checkGeoObjectAfter(li[li.length - 1].endToken, true, false);
        if ((li.length === 2 && li[0].typ === CityItemTokenItemType.NOUN && li[1].typ === CityItemTokenItemType.NOUN) && ((li[0].geoObjectBefore || li[1].geoObjectAfter))) {
            if (li[0].chars.isCapitalUpper && li[1].chars.isAllLower) 
                li[0].typ = CityItemTokenItemType.PROPERNAME;
            else if (li[1].chars.isCapitalUpper && li[0].chars.isAllLower) 
                li[1].typ = CityItemTokenItemType.PROPERNAME;
        }
        return li;
    }
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = CityItemTokenItemType.PROPERNAME;
        this.value = null;
        this.altValue = null;
        this.ontoItem = null;
        this.doubtful = false;
        this.geoObjectBefore = false;
        this.geoObjectAfter = false;
        this.higherGeo = null;
        this.orgRef = null;
        this.ortoCity = null;
        this.canBeName = false;
        this.misc = null;
        this.misc2 = null;
        this.cond = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.cond !== null) 
            res.append("[").append(this.cond.toString()).append("] ");
        res.append(this.typ.toString());
        if (this.value !== null) 
            res.append(" ").append(this.value);
        if (this.ontoItem !== null) 
            res.append(" ").append(this.ontoItem.toString());
        if (this.doubtful) 
            res.append(" (?)");
        if (this.orgRef !== null) 
            res.append(" (Org: ").append(this.orgRef.referent).append(")");
        if (this.geoObjectBefore) 
            res.append(" GeoBefore");
        if (this.geoObjectAfter) 
            res.append(" GeoAfter");
        if (this.ortoCity !== null) 
            res.append(" Orto: ").append(this.ortoCity);
        if (this.canBeName) 
            res.append(" (?name)");
        return res.toString();
    }
    
    mergeWithNext(ne) {
        if (this.typ !== CityItemTokenItemType.NOUN || ne.typ !== CityItemTokenItemType.NOUN) 
            return false;
        let ok = false;
        if (this.value === "ГОРОДСКОЕ ПОСЕЛЕНИЕ" && ne.value === "ГОРОД") 
            ok = true;
        if (!ok) 
            return false;
        this.endToken = ne.endToken;
        this.doubtful = false;
        return true;
    }
    
    static prepareAllData(t0) {
        if (!CityItemToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.cRegime = false;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            let cit = CityItemToken.tryParse(t, null, false, ad);
            if (cit !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.cit = cit;
            }
        }
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            if (d === null || d.cit === null || d.cit.typ !== CityItemTokenItemType.NOUN) 
                continue;
            let tt = d.cit.endToken.next;
            if (tt === null) 
                continue;
            let dd = Utils.as(tt.tag, GeoTokenData);
            let cit = CityItemToken.tryParse(tt, d.cit, false, ad);
            if (cit === null) 
                continue;
            if (dd === null) 
                dd = new GeoTokenData(tt);
            dd.cit = cit;
        }
        ad.cRegime = true;
    }
    
    static tryParse(t, prev = null, dontNormalize = false, ad = null) {
        const CityAttachHelper = require("./CityAttachHelper");
        const OrgItemToken = require("./OrgItemToken");
        if (t === null) 
            return null;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        let d = Utils.as(t.tag, GeoTokenData);
        if (t.isValue("НП", null)) {
        }
        if (d !== null && d.noGeo) 
            return null;
        if (CityItemToken.SPEED_REGIME && ((ad.cRegime || ad.allRegime)) && !dontNormalize) {
            if (d === null) 
                return null;
            if (d.cit === null) 
                return null;
            if (d.cit.cond !== null) {
                if (ad.checkRegime) 
                    return null;
                ad.checkRegime = true;
                let b = d.cit.cond.check();
                ad.checkRegime = false;
                if (!b) 
                    return null;
            }
            return d.cit;
        }
        if (ad.cLevel > 1) 
            return null;
        ad.cLevel++;
        let res = CityItemToken._tryParseInt(t, prev, dontNormalize, ad);
        ad.cLevel--;
        if (res !== null && res.typ === CityItemTokenItemType.NOUN && (res.whitespacesAfterCount < 2)) {
            let nn = MiscLocationHelper.tryParseNpt(res.endToken.next);
            if (nn !== null && ((nn.endToken.isValue("ЗНАЧЕНИЕ", "ЗНАЧЕННЯ") || nn.endToken.isValue("ТИП", null) || nn.endToken.isValue("ХОЗЯЙСТВО", "ХАЗЯЙСТВО")))) {
                if (nn.beginToken !== nn.endToken && ((nn.beginToken.next.isCommaAnd || OrgTypToken.tryParse(nn.beginToken.next, false, null) !== null))) {
                }
                else if (OrgItemToken.tryParse(res.endToken.next, ad) === null) 
                    res.endToken = nn.endToken;
            }
            else if ((res.value === "ГОРОДСКОЕ ПОСЕЛЕНИЕ" || res.value === "СЕЛЬСКОЕ ПОСЕЛЕНИЕ")) {
                ad.cLevel++;
                let _next = CityItemToken._tryParseInt(res.endToken.next, res, dontNormalize, ad);
                ad.cLevel--;
                if (_next !== null && _next.typ === CityItemTokenItemType.NOUN) {
                    res.endToken = _next.endToken;
                    res.altValue = _next.value;
                }
            }
        }
        if (((res !== null && res.typ === CityItemTokenItemType.PROPERNAME && res.value !== null) && !res.doubtful && res.beginToken === res.endToken) && res.value.length > 4) {
            if (LanguageHelper.endsWithEx(res.value, "ГРАД", "ГОРОД", null, null)) {
                res.altValue = null;
                res.typ = CityItemTokenItemType.CITY;
            }
            else if (LanguageHelper.endsWithEx(res.value, "СК", "ИНО", "ПОЛЬ", null) || LanguageHelper.endsWithEx(res.value, "ВЛЬ", "АС", "ЕС", null)) {
                let sits = StreetItemToken.tryParseList(res.endToken.next, 3, ad);
                if (sits !== null) {
                    if (sits.length === 1 && sits[0].typ === StreetItemType.NOUN) 
                        return res;
                    if (sits.length === 2 && sits[0].typ === StreetItemType.NUMBER && sits[1].typ === StreetItemType.NOUN) 
                        return res;
                }
                let mc = res.endToken.getMorphClassInDictionary();
                if (mc.isProperGeo || mc.isUndefined) {
                    res.altValue = null;
                    res.typ = CityItemTokenItemType.CITY;
                }
            }
            else if (LanguageHelper.endsWithEx(res.value, "АНЬ", "TOWN", null, null) || res.value.startsWith("SAN")) 
                res.typ = CityItemTokenItemType.CITY;
            else if (res.endToken instanceof TextToken) {
                let lem = res.endToken.lemma;
                if (LanguageHelper.endsWithEx(lem, "ГРАД", "ГОРОД", "СК", null) || LanguageHelper.endsWithEx(lem, "АНЬ", "ПОЛЬ", null, null)) {
                    res.altValue = res.value;
                    res.value = lem;
                    let ii = res.altValue.indexOf('-');
                    if (ii >= 0) 
                        res.value = res.altValue.substring(0, 0 + ii + 1) + lem;
                    if (!LanguageHelper.endsWith(res.value, "АНЬ")) 
                        res.altValue = null;
                }
            }
        }
        if (res === null && t.isChar('(') && MiscLocationHelper.isUserParamAddress(t)) {
            let _next = CityItemToken.tryParse(t.next, null, false, null);
            if ((_next !== null && _next.typ === CityItemTokenItemType.NOUN && _next.endToken.next !== null) && _next.endToken.next.isChar(')')) {
                _next.beginToken = t;
                _next.endToken = _next.endToken.next;
                res = _next;
            }
        }
        if (res === null) 
            return null;
        if (res.typ === CityItemTokenItemType.NOUN && res.value === "ГОРОДОК") {
            if (MiscLocationHelper.isUserParamAddress(res)) 
                return null;
        }
        if ((res.typ !== CityItemTokenItemType.NOUN && res.endToken.next !== null && res.endToken.next.isChar('(')) && (res.whitespacesAfterCount < 3)) {
            let br = BracketHelper.tryParse(res.endToken.next, BracketParseAttr.NO, 100);
            if (br !== null && br.endToken.next !== null && (br.whitespacesAfterCount < 3)) {
                let nn = CityItemToken.tryParse(br.endToken.next, res, false, null);
                if (nn !== null && nn.typ === CityItemTokenItemType.NOUN) {
                    let li = CityItemToken.tryParseList(br.beginToken.next, 3, ad);
                    if ((li !== null && li.length === 2 && li[0].typ !== CityItemTokenItemType.NOUN) && li[1].typ === CityItemTokenItemType.NOUN && li[1].endToken.next === br.endToken) {
                        res.ortoCity = CityAttachHelper.tryDefine(li, ad, true);
                        res.endToken = br.endToken;
                    }
                }
            }
        }
        if ((res !== null && ((res.typ === CityItemTokenItemType.CITY || res.typ === CityItemTokenItemType.PROPERNAME)) && !res.isWhitespaceAfter) && MiscLocationHelper.isUserParamAddress(res)) {
            if (res.endToken.next.isHiphen && (res.endToken.next.next instanceof NumberToken)) {
                res.endToken = res.endToken.next.next;
                res.value = ((res.ontoItem !== null ? res.ontoItem.canonicText : res.value) + "-" + res.endToken.value);
                res.typ = CityItemTokenItemType.PROPERNAME;
                res.ontoItem = null;
            }
        }
        return res;
    }
    
    static _tryParseInt(t, prev, dontNormalize, ad) {
        const NameToken = require("./NameToken");
        const OrgItemToken = require("./OrgItemToken");
        if (t === null || (((t instanceof TextToken) && !t.chars.isLetter))) 
            return null;
        let res = CityItemToken._TryParse(t, prev, dontNormalize, ad);
        if ((prev === null && t.chars.isCyrillicLetter && t.chars.isAllUpper) && t.lengthChar === 2) {
            if (t.isValue("ТА", null)) {
                res = CityItemToken._TryParse(t.next, prev, dontNormalize, ad);
                if (res !== null) {
                    if (res.typ === CityItemTokenItemType.NOUN) {
                        res.beginToken = t;
                        res.doubtful = false;
                    }
                    else 
                        res = null;
                }
            }
        }
        if (prev !== null && prev.typ === CityItemTokenItemType.NOUN && ((prev.value !== "ГОРОД" && prev.value !== "МІСТО"))) {
            if (res === null) {
                let det = OrgItemToken.tryParse(t, null);
                if (det !== null) {
                    let cou = 0;
                    for (let ttt = det.beginToken; ttt !== null && ttt.endChar <= det.endChar; ttt = ttt.next) {
                        if (ttt.chars.isLetter) 
                            cou++;
                    }
                    if (cou < 6) {
                        let re = CityItemToken._new1212(det.beginToken, det.endToken, CityItemTokenItemType.PROPERNAME);
                        if (det.referent.typeName === "ORGANIZATION") 
                            re.orgRef = det;
                        else {
                            re.value = MiscHelper.getTextValueOfMetaToken(det, GetTextAttr.NO);
                            re.altValue = MiscHelper.getTextValueOfMetaToken(det, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                        }
                        return re;
                    }
                }
                if ((t instanceof NumberToken) && (t.whitespacesAfterCount < 2)) {
                    let _next = CityItemToken._TryParse(t.next, prev, dontNormalize, ad);
                    if ((_next !== null && _next.typ === CityItemTokenItemType.PROPERNAME && _next.value !== null) && _next.endToken.next !== null) {
                        let ok = false;
                        if (_next.endToken.next.isComma) 
                            ok = true;
                        else if (AddressItemToken.checkStreetAfter(_next.endToken.next, false)) 
                            ok = true;
                        if (ok) {
                            _next.beginToken = t;
                            _next.value = (_next.value + "-" + t.value);
                            if (_next.altValue !== null) 
                                _next.altValue = (_next.altValue + "-" + t.value);
                            res = _next;
                        }
                    }
                }
            }
        }
        if (res !== null && res.typ === CityItemTokenItemType.NOUN && (res.whitespacesAfterCount < 3)) {
            let npt = MiscLocationHelper.tryParseNpt(res.endToken.next);
            if (npt !== null) {
                if (npt.endToken.isValue("ПОДЧИНЕНИЕ", "ПІДПОРЯДКУВАННЯ")) 
                    res.endToken = npt.endToken;
            }
            if (res.value === "НАСЕЛЕННЫЙ ПУНКТ") {
                let _next = CityItemToken._TryParse(res.endToken.next, prev, dontNormalize, ad);
                if (_next !== null && _next.typ === CityItemTokenItemType.NOUN) {
                    _next.beginToken = res.beginToken;
                    return _next;
                }
            }
        }
        if (res !== null && t.chars.isAllUpper && res.typ === CityItemTokenItemType.PROPERNAME) {
            let tt = t.previous;
            if (tt !== null && tt.isComma) 
                tt = tt.previous;
            let geoPrev = null;
            if (tt !== null && (tt.getReferent() instanceof GeoReferent)) 
                geoPrev = Utils.as(tt.getReferent(), GeoReferent);
            if (geoPrev !== null && ((geoPrev.isRegion || geoPrev.isCity))) {
                let det = OrgItemToken.tryParse(t, null);
                if (det !== null) 
                    res = null;
            }
        }
        if (res !== null && res.typ === CityItemTokenItemType.PROPERNAME) {
            if ((t.isValue("ДУМА", "РАДА") || t.isValue("ГЛАВА", "ГОЛОВА") || t.isValue("АДМИНИСТРАЦИЯ", "АДМІНІСТРАЦІЯ")) || t.isValue("МЭР", "МЕР") || t.isValue("ПРЕДСЕДАТЕЛЬ", "ГОЛОВА")) 
                return null;
        }
        if (res !== null && res.value === "НАСЕЛЕННЫЙ ПУНКТ" && (res.whitespacesAfterCount < 2)) {
            let s = StreetItemToken.tryParse(res.endToken.next, null, false, null);
            if (s !== null && s.typ === StreetItemType.NOUN && s.termin.canonicText === "ПОЧТОВОЕ ОТДЕЛЕНИЕ") 
                res.endToken = s.endToken;
        }
        if (res !== null && res.typ === CityItemTokenItemType.PROPERNAME && res.beginToken === res.endToken) {
            let end = MiscLocationHelper.checkNameLong(res);
            if (end !== null) {
                if (CityItemToken.checkKeyword(end) === null) {
                    res.endToken = end;
                    res.value = MiscHelper.getTextValue(res.beginToken, end, GetTextAttr.NO);
                    res.altValue = null;
                }
            }
        }
        let geoAfter = null;
        if (res === null) {
            if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    res = CityItemToken._TryParse(t.next, null, false, ad);
                    if (res !== null && ((res.typ === CityItemTokenItemType.PROPERNAME || res.typ === CityItemTokenItemType.CITY))) {
                        res.beginToken = t;
                        res.typ = CityItemTokenItemType.PROPERNAME;
                        res.endToken = br.endToken;
                        if (res.endToken.next !== br.endToken) {
                            res.value = MiscHelper.getTextValue(t, br.endToken, GetTextAttr.NO);
                            res.altValue = null;
                        }
                        return res;
                    }
                }
            }
            if (t instanceof TextToken) {
                let txt = t.term;
                if (txt === "НЕТ") 
                    return null;
                if (txt === "ИМ" || txt === "ИМЕНИ") {
                    let t1 = t.next;
                    if (t1 !== null && t1.isChar('.')) 
                        t1 = t1.next;
                    let nnn = CityItemToken._new1212(t1, t1, CityItemTokenItemType.NOUN);
                    res = CityItemToken.tryParse(t1, nnn, false, ad);
                    if (res !== null && ((((res.typ === CityItemTokenItemType.CITY && res.doubtful)) || res.typ === CityItemTokenItemType.PROPERNAME))) {
                        res.beginToken = t;
                        res.morph = new MorphCollection();
                        return res;
                    }
                }
                if (t.chars.isCyrillicLetter && t.lengthChar === 1 && t.chars.isAllUpper) {
                    if ((t.next !== null && !t.isWhitespaceAfter && ((t.next.isHiphen || t.next.isChar('.')))) && (t.next.whitespacesAfterCount < 2)) {
                        if (prev !== null && prev.typ === CityItemTokenItemType.NOUN && (((!prev.doubtful || prev.geoObjectBefore || MiscLocationHelper.checkGeoObjectBefore(prev.beginToken, false)) || MiscLocationHelper.checkGeoObjectBeforeBrief(prev.beginToken, ad)))) {
                            let res1 = CityItemToken._TryParse(t.next.next, null, false, ad);
                            if (res1 !== null && ((res1.typ === CityItemTokenItemType.PROPERNAME || res1.typ === CityItemTokenItemType.CITY))) {
                                if (res1.value === "ГОРЬКОГО" || res1.value === "ЛЕНИНА") {
                                    res1.beginToken = t;
                                    return res1;
                                }
                                let adjs = MiscLocationHelper.getStdAdjFullStr(txt, res1.morph.gender, res1.morph.number, true);
                                if (adjs === null && prev !== null && prev.typ === CityItemTokenItemType.NOUN) 
                                    adjs = MiscLocationHelper.getStdAdjFullStr(txt, prev.morph.gender, MorphNumber.UNDEFINED, true);
                                if (adjs === null) 
                                    adjs = MiscLocationHelper.getStdAdjFullStr(txt, res1.morph.gender, res1.morph.number, false);
                                if (adjs !== null) {
                                    if (res1.value === null) 
                                        res1.value = res1.getSourceText().toUpperCase();
                                    if (res1.altValue !== null) 
                                        res1.altValue = (adjs[0] + " " + res1.altValue);
                                    else if (adjs.length > 1) 
                                        res1.altValue = (adjs[1] + " " + res1.value);
                                    res1.value = (adjs[0] + " " + res1.value);
                                    res1.beginToken = t;
                                    res1.typ = CityItemTokenItemType.PROPERNAME;
                                    return res1;
                                }
                            }
                        }
                    }
                }
            }
            let tt = (prev === null ? t.previous : prev.beginToken.previous);
            while (tt !== null && tt.isCharOf(",.")) {
                tt = tt.previous;
            }
            let geoPrev = null;
            if (tt !== null && (tt.getReferent() instanceof GeoReferent)) 
                geoPrev = Utils.as(tt.getReferent(), GeoReferent);
            let _cond = null;
            let tt0 = t;
            let ooo = false;
            let hasGeoAfter = false;
            if (geoPrev !== null) 
                ooo = true;
            else if (MiscLocationHelper.checkNearBefore(t, ad) !== null) 
                ooo = true;
            else if (MiscLocationHelper.checkGeoObjectBefore(t, false)) 
                ooo = true;
            else if (t.chars.isLetter) {
                tt = t.next;
                if (tt !== null && tt.isChar('.')) 
                    tt = tt.next;
                if ((tt instanceof TextToken) && !tt.chars.isAllLower) {
                    if (MiscLocationHelper.checkGeoObjectAfterBrief(tt, ad)) 
                        ooo = (hasGeoAfter = true);
                    else if (MiscLocationHelper.checkGeoObjectAfter(tt, true, false)) 
                        ooo = (hasGeoAfter = true);
                    else if (AddressItemToken.checkStreetAfter(tt.next, false)) 
                        ooo = true;
                    else if (ad.cLevel === 0) {
                        let cit2 = CityItemToken.tryParse(tt, null, false, ad);
                        if (cit2 !== null && cit2.beginToken !== cit2.endToken && ((cit2.typ === CityItemTokenItemType.PROPERNAME || cit2.typ === CityItemTokenItemType.CITY))) {
                            if (AddressItemToken.checkStreetAfter(cit2.endToken.next, false)) 
                                ooo = true;
                        }
                        if (cit2 !== null && cit2.typ === CityItemTokenItemType.CITY && tt.previous.isChar('.')) {
                            if (cit2.isWhitespaceAfter || ((cit2.endToken.next !== null && cit2.endToken.next.lengthChar === 1))) {
                                ooo = true;
                                if (cit2.ontoItem !== null) 
                                    geoAfter = Utils.as(cit2.ontoItem.referent, GeoReferent);
                            }
                        }
                    }
                }
            }
            if ((ad !== null && !ooo && !ad.cRegime) && CityItemToken.SPEED_REGIME) {
                if (_cond === null) 
                    _cond = new Condition();
                _cond.geoBeforeToken = t;
                ooo = true;
            }
            if (ooo) {
                tt = t;
                for (let ttt = tt; ttt !== null; ttt = ttt.next) {
                    if (ttt.isCharOf(",.")) {
                        tt = ttt.next;
                        continue;
                    }
                    if (ttt.isNewlineBefore) 
                        break;
                    let det = AddressItemToken.tryParsePureItem(ttt, null, ad);
                    if (det !== null && ttt.isValue("У", null) && MiscLocationHelper.isUserParamAddress(ttt)) 
                        det = null;
                    if (det !== null && det.typ === AddressItemType.DETAIL) {
                        ttt = det.endToken;
                        tt = (tt0 = det.endToken.next);
                        continue;
                    }
                    let org = OrgItemToken.tryParse(ttt, null);
                    if (org !== null && org.isGsk) {
                        ttt = org.endToken;
                        tt0 = (tt = org.endToken.next);
                        continue;
                    }
                    let ait = AddressItemToken.tryParsePureItem(ttt, null, null);
                    if (ait !== null && ait.typ === AddressItemType.PLOT) {
                        ttt = ait.endToken;
                        tt0 = (tt = ait.endToken.next);
                        continue;
                    }
                    break;
                }
                if (tt instanceof TextToken) {
                    if (tt0.isComma && tt0.next !== null) 
                        tt0 = tt0.next;
                    let txt = tt.term;
                    if (((((txt === "Д" || txt === "С" || txt === "C") || txt === "П" || txt === "Х") || ((((txt === "А" || txt === "У")) && MiscLocationHelper.isUserParamAddress(tt))))) && ((tt.chars.isAllLower || MiscLocationHelper.isUserParamAddress(tt) || ((tt.next !== null && tt.next.isCharOf(".,")))))) {
                        for (let ttt = tt.previous; ttt !== null; ttt = ttt.previous) {
                            if (StreetItemToken.checkKeyword(ttt)) 
                                return null;
                            if (ttt.isValue("ИМЕНИ", null) || ttt.isValue("ИМ", null)) 
                                return null;
                            if (ttt.lengthChar > 1) 
                                break;
                        }
                        if (NameToken.checkInitial(tt) !== null) 
                            return null;
                        if (tt.chars.isAllUpper) {
                            let tt3 = tt.next;
                            if (tt3 !== null && tt3.isChar('.')) 
                                tt3 = tt3.next;
                            let sits = StreetItemToken.tryParseList(tt3, 3, ad);
                            if (sits !== null && sits.length === 2 && sits[1].typ === StreetItemType.NOUN) 
                                return null;
                            if (AddressItemToken.tryParsePureItem(tt.previous, null, null) !== null) 
                                return null;
                        }
                        if (txt === "Д") {
                            let hou = AddressItemToken.tryParsePureItem(tt, null, ad);
                            if ((hou !== null && hou.typ === AddressItemType.HOUSE && !Utils.isNullOrEmpty(hou.value)) && Utils.isDigit(hou.value[0])) 
                                return null;
                        }
                        if (txt === "А" || txt === "С") {
                            if (tt.isNewlineAfter && !MiscLocationHelper.isUserParamAddress(tt)) 
                                return null;
                            let ait = AddressItemToken.tryParsePureItem(tt.next, null, ad);
                            if (ait !== null) 
                                return null;
                            if (StreetItemToken.checkKeyword(tt)) 
                                return null;
                        }
                        if (txt === "У") {
                            if (tt.whitespacesAfterCount > 2) 
                                return null;
                            let _next = CityItemToken.tryParse(tt.next, null, false, null);
                            if (_next !== null && _next.typ === CityItemTokenItemType.NOUN) 
                                return null;
                            let ait = AddressItemToken.tryParsePureItem(tt.next, null, null);
                            if (ait !== null) 
                                return null;
                        }
                        let tokn = NameToken.M_ONTO.tryParse(tt, TerminParseAttr.NO);
                        if (tokn !== null) 
                            return CityItemToken._new1215(tt, tokn.endToken, CityItemTokenItemType.PROPERNAME, tokn.termin.canonicText);
                        let tt1 = tt;
                        if (tt1.next !== null && tt1.next.isCharOf(",.")) 
                            tt1 = tt1.next;
                        else if (txt === "С" && tt1.next !== null && ((tt1.next.morph._case.isInstrumental || tt1.next.morph._case.isGenitive))) {
                            if (!(tt1.next instanceof TextToken)) 
                                return null;
                            if (MiscLocationHelper.isUserParamAddress(tt1)) {
                            }
                            else {
                                if (!tt.chars.isAllLower || !tt1.next.chars.isCapitalUpper) 
                                    return null;
                                if (tt1.next.isNewlineAfter) {
                                }
                                else if (AddressItemToken.checkStreetAfter(tt1.next.next, false)) {
                                }
                                else 
                                    return null;
                            }
                        }
                        let tt2 = tt1.next;
                        if ((tt2 !== null && tt2.lengthChar === 1 && tt2.chars.isCyrillicLetter) && tt2.chars.isAllUpper) {
                            if (tt2.next !== null && ((tt2.next.isChar('.') || tt2.next.isHiphen)) && !tt2.isWhitespaceAfter) {
                                if (tt.chars.isAllUpper) 
                                    return null;
                                tt2 = tt2.next.next;
                            }
                        }
                        else 
                            while (tt2 !== null && tt2.isComma) {
                                tt2 = tt2.next;
                            }
                        let ok = false;
                        if ((txt === "Д" && (tt2 instanceof NumberToken) && !tt2.isNewlineBefore) && !tt2.previous.isComma) 
                            ok = false;
                        else if (((txt === "С" || txt === "C")) && (tt2 instanceof TextToken) && ((tt2.isValue("О", null) || tt2.isValue("O", null)))) 
                            ok = false;
                        else if (tt2 === null || tt2.isValue("ДОМ", null)) 
                            ok = true;
                        else if ((tt2.isChar(')') && t.previous !== null && t.previous.isChar('(')) && MiscLocationHelper.isUserParamAddress(t)) 
                            ok = true;
                        else if (tt2.isHiphen && tt2.previous !== null && tt2.previous.isComma) 
                            ok = true;
                        else if (!tt2.chars.isCyrillicLetter && (tt2 instanceof TextToken)) 
                            ok = false;
                        else if (tt2.isNewlineBefore && tt2.previous.isComma) 
                            ok = true;
                        else if (tt2.chars.isCapitalUpper && (tt2.whitespacesBeforeCount < 2)) {
                            ok = tt.chars.isAllLower;
                            if (!ok && MiscLocationHelper.isUserParamAddress(tt)) 
                                ok = true;
                        }
                        else if (AddressItemToken.checkStreetAfter(tt2, false)) 
                            ok = true;
                        else if (AddressItemToken.checkHouseAfter(tt2, false, true)) 
                            ok = true;
                        else if (tt2.chars.isAllUpper && (tt2.whitespacesBeforeCount < 2)) {
                            ok = true;
                            if (tt.chars.isAllUpper) {
                                let rtt = tt.kit.processReferent("PERSON", tt, null);
                                if (rtt !== null) {
                                    ok = false;
                                    let ttt2 = rtt.endToken.next;
                                    if (ttt2 !== null && ttt2.isComma) 
                                        ttt2 = ttt2.next;
                                    if (AddressItemToken.checkHouseAfter(ttt2, false, false) || AddressItemToken.checkStreetAfter(ttt2, false)) 
                                        ok = true;
                                }
                                else if (tt.previous !== null && tt.previous.isChar('.')) 
                                    ok = false;
                            }
                            else if (tt1 === tt) 
                                ok = false;
                            if (!ok && tt1.next !== null) {
                                let ttt2 = tt1.next.next;
                                if (MiscLocationHelper.isUserParamAddress(tt)) {
                                    let noun = CityItemToken._new1215(tt, tt, CityItemTokenItemType.NOUN, "СЕЛО");
                                    let nam = CityItemToken._tryParseInt(tt1.next, noun, true, ad);
                                    if (nam !== null && nam.typ === CityItemTokenItemType.PROPERNAME) 
                                        ttt2 = nam.endToken.next;
                                    if (ttt2 === null || ttt2.isNewlineAfter || ttt2.isComma) 
                                        ok = true;
                                }
                                if (ttt2 !== null && ttt2.isComma) 
                                    ttt2 = ttt2.next;
                                if (AddressItemToken.checkHouseAfter(ttt2, false, false) || AddressItemToken.checkStreetAfter(ttt2, false)) {
                                    if (OrgItemToken.tryParse(tt1.next, null) !== null) {
                                    }
                                    else 
                                        ok = true;
                                }
                            }
                        }
                        else if ((tt2 instanceof NumberToken) && tt2.previous.isComma) 
                            ok = true;
                        else if (prev !== null && prev.typ === CityItemTokenItemType.PROPERNAME && (tt.whitespacesBeforeCount < 2)) {
                            if (MiscLocationHelper.checkGeoObjectBefore(prev.beginToken.previous, false)) 
                                ok = true;
                            if (txt === "П" && tt.next !== null && ((tt.next.isHiphen || tt.next.isCharOf("\\/")))) {
                                let sit = StreetItemToken.tryParse(tt, null, false, null);
                                if (sit !== null && sit.typ === StreetItemType.NOUN) 
                                    ok = false;
                            }
                        }
                        else if (prev === null) {
                            if (MiscLocationHelper.checkGeoObjectBefore(tt.previous, false)) {
                                if (tt1.isNewlineAfter) {
                                }
                                else 
                                    ok = true;
                            }
                            else if (geoAfter !== null || hasGeoAfter) 
                                ok = true;
                            else if (MiscLocationHelper.isUserParamAddress(tt)) 
                                ok = true;
                        }
                        if (tt.previous !== null && tt.previous.isHiphen && !tt.isWhitespaceBefore) {
                            if (tt.next !== null && tt.next.isChar('.')) {
                            }
                            else 
                                ok = false;
                        }
                        if (ok) {
                            let ii = 0;
                            for (let ttt = t.previous; ttt !== null && (ii < 4); ttt = ttt.previous,ii++) {
                                let oo = OrgItemToken.tryParse(ttt, null);
                                if (oo !== null && oo.endChar > tt.endChar) 
                                    ok = false;
                            }
                        }
                        if (ok) {
                            res = CityItemToken._new1212(tt0, tt1, CityItemTokenItemType.NOUN);
                            if (tt1.isComma) 
                                res.endToken = tt1.previous;
                            if (txt === "У") 
                                res.value = "УЛУС";
                            else 
                                res.value = (txt === "Д" ? "ДЕРЕВНЯ" : (txt === "П" ? "ПОСЕЛОК" : (txt === "Х" ? "ХУТОР" : (txt === "А" ? "АУЛ" : (txt === "Г" ? "ГОРОД" : "СЕЛО")))));
                            if (txt === "П") 
                                res.altValue = "ПОСЕЛЕНИЕ";
                            else if (txt === "С" || txt === "C") {
                                res.altValue = "СЕЛЕНИЕ";
                                if (tt0 === tt1 && !MiscLocationHelper.isUserParamAddress(tt0)) {
                                    let npt = NounPhraseHelper.tryParse(tt1.next, NounPhraseParseAttr.PARSEPRONOUNS, 0, null);
                                    if (npt !== null && npt.morph._case.isInstrumental) 
                                        return null;
                                }
                            }
                            res.doubtful = true;
                            return res;
                        }
                    }
                    if ((txt === "СП" || txt === "РП" || txt === "ГП") || txt === "ДП") {
                        if (tt.next !== null && tt.next.isChar('.')) 
                            tt = tt.next;
                        if (tt.next !== null && tt.next.chars.isCapitalUpper) 
                            return CityItemToken._new1219(tt0, tt, CityItemTokenItemType.NOUN, true, Condition._new1218(t), (txt === "РП" ? "РАБОЧИЙ ПОСЕЛОК" : (txt === "ГП" ? "ГОРОДСКОЕ ПОСЕЛЕНИЕ" : (txt === "ДП" ? "ДАЧНЫЙ ПОСЕЛОК" : "СЕЛЬСКОЕ ПОСЕЛЕНИЕ"))));
                    }
                    if (tt0 !== tt && CityItemToken.checkKeyword(tt) !== null) {
                        res = CityItemToken.tryParse(tt, null, false, ad);
                        if (res !== null && res.typ === CityItemTokenItemType.NOUN) {
                            res.geoObjectBefore = true;
                            res.beginToken = tt0;
                            return res;
                        }
                    }
                    if (tt.chars.isAllUpper && tt.lengthChar > 2 && tt.chars.isCyrillicLetter) 
                        return CityItemToken._new1215(tt, tt, CityItemTokenItemType.PROPERNAME, tt.term);
                }
            }
            if ((t instanceof NumberToken) && t.next !== null) {
                let net = NumberHelper.tryParseNumberWithPostfix(t);
                if (net !== null && net.exTyp === NumberExType.KILOMETER) 
                    return CityItemToken._new1215(t, net.endToken, CityItemTokenItemType.PROPERNAME, ((String(Math.floor(net.realValue))) + "КМ"));
            }
            let rt = Utils.as(t, ReferentToken);
            if ((rt !== null && (rt.referent instanceof GeoReferent) && rt.beginToken === rt.endToken) && rt.referent.isState) {
                if (t.previous === null) 
                    return null;
                if (t.previous.morph.number === MorphNumber.SINGULAR && t.morph._case.isNominative && !t.morph._case.isGenitive) 
                    return CityItemToken._new1215(t, t, CityItemTokenItemType.PROPERNAME, rt.getSourceText().toUpperCase());
            }
            return null;
        }
        if (res.typ === CityItemTokenItemType.NOUN) {
            if (res.value === "СЕЛО" && (t instanceof TextToken)) {
                if (t.previous === null) {
                }
                else if (t.previous.morph._class.isPreposition) {
                }
                else 
                    res.doubtful = true;
                res.morph.gender = MorphGender.NEUTER;
            }
            if (!res.chars.isAllLower && ((res.value === "ХУТОР" || res.value === "СЛОБОДА"))) 
                res.canBeName = true;
            if (res.value === "СТАНЦИЯ" || res.value === "СТАНЦІЯ") 
                res.doubtful = true;
            if (res.endToken.isValue("СТОЛИЦА", null) || res.endToken.isValue("СТОЛИЦЯ", null)) {
                res.doubtful = true;
                if (res.endToken.next !== null) {
                    let _geo = Utils.as(res.endToken.next.getReferent(), GeoReferent);
                    if (_geo !== null && ((_geo.isRegion || _geo.isState))) {
                        res.higherGeo = _geo;
                        res.endToken = res.endToken.next;
                        res.doubtful = false;
                        res.value = "ГОРОД";
                        for (const it of TerrItemToken.m_CapitalsByState.termins) {
                            let ge = Utils.as(it.tag, GeoReferent);
                            if (ge === null || !ge.canBeEquals(_geo, ReferentsEqualType.WITHINONETEXT)) 
                                continue;
                            let tok = TerrItemToken.m_CapitalsByState.tryParse(res.endToken.next, TerminParseAttr.NO);
                            if (tok !== null && tok.termin === it) 
                                break;
                            res.typ = CityItemTokenItemType.CITY;
                            res.value = it.canonicText;
                            return res;
                        }
                    }
                }
            }
            if ((res.beginToken.lengthChar === 1 && res.beginToken.chars.isAllUpper && res.beginToken.next !== null) && res.beginToken.next.isChar('.')) {
                let ne = CityItemToken._tryParseInt(res.beginToken.next.next, null, false, ad);
                if (ne !== null && ne.typ === CityItemTokenItemType.CITY && ((!ne.doubtful || MiscLocationHelper.isUserParamAddress(ne)))) {
                }
                else if (ne !== null && ne.typ === CityItemTokenItemType.PROPERNAME && AddressItemToken.checkStreetAfter(ne.endToken.next, false)) {
                }
                else if (ne === null || ne.typ !== CityItemTokenItemType.PROPERNAME) 
                    return null;
                else if (MiscLocationHelper.checkGeoObjectAfter(ne.endToken.next, false, true)) {
                }
                else if (res.beginToken.previous !== null && res.beginToken.previous.isValue("В", null)) {
                }
                else if ((ne !== null && ne.typ === CityItemTokenItemType.PROPERNAME && MiscLocationHelper.isUserParamAddress(ne)) && ((ne.endToken.isNewlineAfter || ne.endToken.next.isComma || ne.chars.isAllUpper))) {
                    for (let tt = t.previous; tt !== null; tt = tt.previous) {
                        if (tt.isNewlineAfter) 
                            break;
                        if (TerrItemToken.checkKeyword(tt) !== null || TerrItemToken.checkOntoItem(tt) !== null) 
                            return res;
                    }
                    return null;
                }
                else 
                    return null;
            }
        }
        if (res.typ === CityItemTokenItemType.PROPERNAME || res.typ === CityItemTokenItemType.CITY || res.canBeName) {
            let val = (res.value != null ? res.value : ((res.ontoItem === null ? null : res.ontoItem.canonicText)));
            let t1 = res.endToken;
            if (((!t1.isWhitespaceAfter && t1.next !== null && t1.next.isHiphen) && !t1.next.isWhitespaceAfter && (t1.next.next instanceof NumberToken)) && t1.next.next.intValue !== null && (t1.next.next.intValue < 30)) {
                res.endToken = t1.next.next;
                res.value = (val + "-" + t1.next.next.value);
                if (res.altValue !== null) 
                    res.altValue = (res.altValue + "-" + t1.next.next.value);
                res.typ = CityItemTokenItemType.PROPERNAME;
            }
            else if (t1.whitespacesAfterCount === 1 && (t1.next instanceof NumberToken) && t1.next.morph._class.isAdjective) {
                let ok = false;
                if (t1.next.next === null || t1.next.isNewlineAfter) 
                    ok = true;
                else if (!t1.next.isWhitespaceAfter && t1.next.next !== null && t1.next.next.isCharOf(",")) 
                    ok = true;
                else if (StreetItemToken.checkKeyword(t1.next.next) && t1.whitespacesAfterCount <= t1.next.whitespacesAfterCount) {
                    if (AddressItemToken.checkStreetAfter(t1.next.next, false)) 
                        ok = true;
                }
                else if (AddressItemToken.checkHouseAfter(t1.next.next, false, false)) 
                    ok = true;
                else if (MiscLocationHelper.checkGeoObjectAfterBrief(t1.next, null)) 
                    ok = true;
                if (ok) {
                    res.endToken = t1.next;
                    res.value = (val + "-" + t1.next.value);
                    if (res.altValue !== null) 
                        res.altValue = (res.altValue + "-" + t1.next.value);
                    res.typ = CityItemTokenItemType.PROPERNAME;
                }
            }
        }
        if (((res.typ === CityItemTokenItemType.CITY || res.canBeName)) && res.beginToken === res.endToken) {
            if (res.beginToken.getMorphClassInDictionary().isAdjective && (res.endToken.next instanceof TextToken)) {
                let ok = false;
                let t1 = null;
                let npt = MiscLocationHelper.tryParseNpt(res.beginToken);
                if (npt !== null && npt.endToken === res.endToken.next) {
                    t1 = npt.endToken;
                    let mc = t1.getMorphClassInDictionary();
                    if (mc.isNoun) {
                        if (res.endToken.next.chars.equals(res.beginToken.chars)) {
                            ok = true;
                            if (res.beginToken.chars.isAllUpper) {
                                let cii = CityItemToken._tryParseInt(res.endToken.next, null, dontNormalize, ad);
                                if (cii !== null && cii.typ === CityItemTokenItemType.NOUN) 
                                    ok = false;
                            }
                        }
                        else if (res.endToken.next.chars.isAllLower) {
                            let ttt = res.endToken.next.next;
                            if (ttt === null || ttt.isCharOf(",.")) 
                                ok = true;
                        }
                    }
                }
                else if (res.endToken.next.chars.equals(res.beginToken.chars) && res.beginToken.chars.isCapitalUpper) {
                    let ttt = res.endToken.next.next;
                    if (ttt === null || ttt.isCharOf(",.")) 
                        ok = true;
                    t1 = res.endToken.next;
                    npt = null;
                }
                if (ok && t1 !== null) {
                    res.typ = CityItemTokenItemType.PROPERNAME;
                    res.ontoItem = null;
                    res.endToken = t1;
                    if (npt !== null) {
                        res.value = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                        res.morph = npt.morph;
                    }
                    else 
                        res.value = MiscHelper.getTextValue(res.beginToken, res.endToken, GetTextAttr.NO);
                }
            }
            if ((res.endToken.next !== null && res.endToken.next.isHiphen && !res.endToken.next.isWhitespaceAfter) && !res.endToken.next.isWhitespaceBefore) {
                let res1 = CityItemToken._TryParse(res.endToken.next.next, null, false, ad);
                if ((res1 !== null && res1.typ === CityItemTokenItemType.PROPERNAME && res1.beginToken === res1.endToken) && res1.beginToken.chars.equals(res.beginToken.chars)) {
                    if (res1.ontoItem === null && res.ontoItem === null) {
                        res.typ = CityItemTokenItemType.PROPERNAME;
                        res.value = ((res.ontoItem === null ? res.value : res.ontoItem.canonicText) + "-" + res1.value);
                        if (res.altValue !== null) 
                            res.altValue = (res.altValue + "-" + res1.value);
                        res.ontoItem = null;
                        res.endToken = res1.endToken;
                        res.doubtful = false;
                    }
                }
                else if ((res.endToken.next.next instanceof NumberToken) && res.endToken.next.next.intValue !== null && (res.endToken.next.next.intValue < 30)) {
                    res.typ = CityItemTokenItemType.PROPERNAME;
                    res.value = ((res.ontoItem === null ? res.value : res.ontoItem.canonicText) + "-" + res.endToken.next.next.value);
                    if (res.altValue !== null) 
                        res.altValue = (res.altValue + "-" + res.endToken.next.next.value);
                    res.ontoItem = null;
                    res.endToken = res.endToken.next.next;
                }
            }
            else if (res.beginToken.getMorphClassInDictionary().isProperName) {
                if (res.beginToken.isValue("КИЇВ", null) || res.beginToken.isValue("АСТАНА", null) || res.beginToken.isValue("АЛМАТЫ", null)) {
                }
                else if ((res.endToken instanceof TextToken) && LanguageHelper.endsWith(res.endToken.term, "ВО")) {
                }
                else {
                    res.doubtful = true;
                    let tt = res.beginToken.previous;
                    if (tt !== null && tt.previous !== null) {
                        if (tt.isChar(',') || tt.morph._class.isConjunction) {
                            let _geo = Utils.as(tt.previous.getReferent(), GeoReferent);
                            if (_geo !== null && _geo.isCity) 
                                res.doubtful = false;
                        }
                    }
                    if (tt !== null && tt.isValue("В", null) && tt.chars.isAllLower) {
                        let npt1 = MiscLocationHelper.tryParseNpt(res.beginToken);
                        if (npt1 === null || npt1.endChar <= res.endChar) 
                            res.doubtful = false;
                    }
                }
            }
            if ((res.beginToken === res.endToken && res.typ === CityItemTokenItemType.CITY && res.ontoItem !== null) && res.ontoItem.canonicText === "САНКТ - ПЕТЕРБУРГ") {
                for (let tt = res.beginToken.previous; tt !== null; tt = tt.previous) {
                    if (tt.isHiphen || tt.isChar('.')) 
                        continue;
                    if (tt.isValue("С", null) || tt.isValue("C", null) || tt.isValue("САНКТ", null)) 
                        res.beginToken = tt;
                    break;
                }
            }
        }
        return res;
    }
    
    static _TryParse(t, prev, dontNormalize, ad) {
        const CityAttachHelper = require("./CityAttachHelper");
        const NameToken = require("./NameToken");
        const OrgItemToken = require("./OrgItemToken");
        if (!(t instanceof TextToken)) {
            if ((t instanceof ReferentToken) && (t.getReferent() instanceof DateReferent)) {
                let aii = StreetItemToken.tryParseSpec(t, null);
                if (aii !== null) {
                    if (aii.length > 1 && aii[0].typ === StreetItemType.NUMBER && aii[1].typ === StreetItemType.STDNAME) {
                        let res2 = CityItemToken._new1212(t, aii[1].endToken, CityItemTokenItemType.PROPERNAME);
                        res2.value = (aii[0].value + " " + aii[1].value);
                        return res2;
                    }
                }
            }
            if ((((t instanceof NumberToken) && prev !== null && prev.typ === CityItemTokenItemType.NOUN) && (t.whitespacesBeforeCount < 3) && (t.whitespacesAfterCount < 3)) && (t.next instanceof TextToken) && t.next.chars.isCapitalUpper) {
                if (prev.beginToken.isValue("СТ", null) || prev.beginToken.isValue("П", null)) 
                    return null;
                let cit1 = CityItemToken.tryParse(t.next, null, false, ad);
                if (cit1 !== null && cit1.typ === CityItemTokenItemType.PROPERNAME && cit1.value !== null) {
                    cit1.beginToken = t;
                    cit1.value = (cit1.value + "-" + t.value);
                    return cit1;
                }
            }
            if ((t instanceof NumberToken) && t.typ !== NumberSpellingType.DIGIT && MiscLocationHelper.isUserParamAddress(t)) 
                return CityItemToken._new1215(t, t, CityItemTokenItemType.PROPERNAME, t.value);
            return null;
        }
        let spec = CityItemToken._tryParseSpec(t);
        if (spec !== null) 
            return spec;
        if (t.isValue("ИМ", null) || t.isValue("ИМЕНИ", null)) {
            let nam = NameToken.tryParse(t, GeoTokenType.CITY, 0, false);
            if (nam !== null) {
                let res1 = CityItemToken._new1215(t, nam.endToken, CityItemTokenItemType.PROPERNAME, nam.name);
                if (nam.miscTyp !== null) 
                    res1.misc = nam.miscTyp;
                return res1;
            }
        }
        let li = null;
        let li0 = null;
        let isInLocOnto = false;
        if (t.kit.ontology !== null && li === null) {
            if ((((li0 = t.kit.ontology.attachToken(GeoReferent.OBJ_TYPENAME, t)))) !== null) {
                li = li0;
                isInLocOnto = true;
            }
        }
        if (li === null) {
            li = CityItemToken.m_Ontology.tryAttach(t, null, false);
            if (li === null) 
                li = CityItemToken.m_OntologyEx.tryAttach(t, null, false);
            else if (li.length === 1 && li[0].beginToken !== li[0].endToken && li[0].beginToken.next.isComma) 
                li = null;
        }
        else if (prev === null) {
            let stri = StreetItemToken.tryParse(t.previous, null, false, ad);
            if (stri !== null && stri.typ === StreetItemType.NOUN) 
                return null;
            stri = StreetItemToken.tryParse(li[0].endToken.next, null, false, ad);
            if (stri !== null && stri.typ === StreetItemType.NOUN) 
                return null;
        }
        if (li !== null && li.length > 0) {
            if (t instanceof TextToken) {
                for (let i = li.length - 1; i >= 0; i--) {
                    if (li[i].item !== null) {
                        if (li[i].beginToken.isValue("ЛЮКСЕМБУРГ", null)) {
                            if (MiscLocationHelper.isUserParamAddress(li[i])) {
                                li.splice(i, 1);
                                continue;
                            }
                            if (li[i].beginToken.previous !== null && li[i].beginToken.previous.isValue("РОЗА", null)) {
                                li.splice(i, 1);
                                continue;
                            }
                        }
                        if (li[i].beginToken.isValue("ГРОЗНЫЙ", null)) {
                            if (li[i].beginToken.previous !== null && ((li[i].beginToken.previous.isValue("ИВАН", null) || li[i].beginToken.previous.isValue("ЦАРЬ", null)))) {
                                li.splice(i, 1);
                                continue;
                            }
                        }
                        if ((li[i].beginToken === li[i].endToken && (li[i].beginToken instanceof TextToken) && li[i].beginToken.term !== li[i].item.canonicText) && MiscLocationHelper.isUserParamAddress(li[i])) {
                            if (li[i].beginToken.term.startsWith("НН")) {
                            }
                            else {
                                li.splice(i, 1);
                                continue;
                            }
                        }
                        if (((li[i].beginToken === li[i].endToken && !li[i].isWhitespaceAfter && li[i].endToken.next !== null) && li[i].endToken.next.isHiphen && li[i].endToken.next.next !== null) && li[i].endToken.next.next.isValue("НА", null)) {
                            li.splice(i, 1);
                            continue;
                        }
                        let g = Utils.as(li[i].item.referent, GeoReferent);
                        if (g === null) 
                            continue;
                        if (!g.isCity) {
                            li.splice(i, 1);
                            continue;
                        }
                    }
                }
                let tt = Utils.as(t, TextToken);
                for (const nt of li) {
                    if (nt.item !== null && nt.item.canonicText === tt.term) {
                        if (MiscLocationHelper.isUserParamAddress(nt) || !MiscHelper.isAllCharactersLower(nt.beginToken, nt.endToken, false)) {
                            let ci = CityItemToken._new1226(nt.beginToken, nt.endToken, CityItemTokenItemType.CITY, nt.item, nt.morph);
                            if (nt.beginToken === nt.endToken && !isInLocOnto) 
                                ci.doubtful = CityItemToken.checkDoubtful(Utils.as(nt.beginToken, TextToken));
                            let tt1 = nt.endToken.next;
                            if ((((tt1 !== null && tt1.isHiphen && !tt1.isWhitespaceBefore) && !tt1.isWhitespaceAfter && prev !== null) && prev.typ === CityItemTokenItemType.NOUN && (tt1.next instanceof TextToken)) && tt1.previous.chars.equals(tt1.next.chars)) {
                                li = null;
                                break;
                            }
                            return ci;
                        }
                    }
                }
                if (li !== null) {
                    for (const nt of li) {
                        if (nt.item !== null) {
                            if (!MiscHelper.isAllCharactersLower(nt.beginToken, nt.endToken, false)) {
                                let ci = CityItemToken._new1226(nt.beginToken, nt.endToken, CityItemTokenItemType.CITY, nt.item, nt.morph);
                                if (nt.beginToken === nt.endToken && (nt.beginToken instanceof TextToken)) {
                                    ci.doubtful = CityItemToken.checkDoubtful(Utils.as(nt.beginToken, TextToken));
                                    let str = nt.beginToken.term;
                                    if (str !== nt.item.canonicText) {
                                        if (LanguageHelper.endsWithEx(str, "О", "А", null, null)) 
                                            ci.altValue = str;
                                    }
                                }
                                return ci;
                            }
                        }
                    }
                }
            }
            if (li !== null) {
                for (const nt of li) {
                    if (nt.item === null) {
                        let ty = (nt.termin.tag === null ? CityItemTokenItemType.NOUN : CityItemTokenItemType.of(nt.termin.tag));
                        let ci = CityItemToken._new1228(nt.beginToken, nt.endToken, ty, nt.morph);
                        ci.value = nt.termin.canonicText;
                        if (ty === CityItemTokenItemType.MISC && ci.value === "ЖИТЕЛЬ" && t.previous !== null) {
                            if (t.previous.isValue("МЕСТНЫЙ", "МІСЦЕВИЙ")) 
                                return null;
                            if (t.previous.morph._class.isPronoun) 
                                return null;
                        }
                        if (ty === CityItemTokenItemType.NOUN && t.isValue("СТ", null) && nt.endToken.next !== null) {
                            if (nt.endToken.next.isValue("РАЗИН", null)) 
                                return null;
                        }
                        if (ty === CityItemTokenItemType.NOUN && !t.chars.isAllLower) {
                            if (t.morph._class.isProperSurname) 
                                ci.doubtful = true;
                        }
                        if (nt.beginToken === nt.endToken) {
                            if (t.isValue("СТ", null)) {
                                if (OrgItemToken.tryParse(t, null) !== null) 
                                    return null;
                            }
                        }
                        if (nt.beginToken.kit.baseLanguage.isUa) {
                            if (nt.beginToken.isValue("М", null) || nt.beginToken.isValue("Г", null)) {
                                if (!nt.beginToken.chars.isAllLower) 
                                    return null;
                                ci.doubtful = true;
                            }
                            else if (nt.beginToken.isValue("МІС", null)) {
                                if (t.term !== "МІС") 
                                    return null;
                                ci.doubtful = true;
                            }
                        }
                        if (nt.beginToken.kit.baseLanguage.isRu) {
                            if (nt.beginToken.isValue("Г", null)) {
                                if (NameToken.checkInitialAndSurname("Г", nt.endToken.next)) 
                                    return null;
                                if (nt.isNewlineBefore) {
                                }
                                else if (nt.beginToken.previous !== null && nt.beginToken.previous.morph._class.isPreposition) {
                                }
                                else {
                                    let ok = true;
                                    if (!nt.beginToken.chars.isAllLower && !MiscLocationHelper.isUserParamAddress(nt)) 
                                        ok = false;
                                    else if ((nt.endToken === nt.beginToken && nt.endToken.next !== null && !nt.endToken.isWhitespaceAfter) && ((nt.endToken.next.isCharOf("\\/") || nt.endToken.next.isHiphen))) 
                                        ok = false;
                                    else if (!t.isWhitespaceBefore && t.previous !== null && ((t.previous.isCharOf("\\/") || t.previous.isHiphen))) 
                                        return null;
                                    if (!ok) {
                                        let nex = CityItemToken.tryParse(nt.endToken.next, null, false, null);
                                        if (nex !== null && nex.typ === CityItemTokenItemType.CITY && (nt.endToken.whitespacesAfterCount < 4)) {
                                        }
                                        else if (nt.endToken.next !== null && AddressItemToken.checkStreetAfter(nt.endToken.next.next, false)) {
                                        }
                                        else {
                                            if (nex === null || nex.typ !== CityItemTokenItemType.PROPERNAME) 
                                                return null;
                                            if (AddressItemToken.checkStreetAfter(nex.endToken.next, false)) {
                                            }
                                            else if (MiscLocationHelper.checkGeoObjectAfter(nex.endToken, false, true)) {
                                            }
                                            else 
                                                return null;
                                        }
                                    }
                                }
                                ci.doubtful = true;
                            }
                            else if (nt.beginToken.isValue("ГОР", null)) {
                                if (t.term !== "ГОР") {
                                    if (t.chars.isCapitalUpper) {
                                        ci = null;
                                        break;
                                    }
                                    return null;
                                }
                                ci.doubtful = true;
                            }
                            else if (nt.beginToken.isValue("ПОС", null)) {
                                if (t.term !== "ПОС") 
                                    return null;
                                ci.doubtful = true;
                                ci.altValue = "ПОСЕЛЕНИЕ";
                            }
                        }
                        let npt1 = MiscLocationHelper.tryParseNpt(t.previous);
                        if (npt1 !== null && npt1.adjectives.length > 0) {
                            let s = npt1.adjectives[0].getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                            if ((s === "РОДНОЙ" || s === "ЛЮБИМЫЙ" || s === "РІДНИЙ") || s === "КОХАНИЙ") 
                                return null;
                        }
                        if (t.isValue("ПОСЕЛЕНИЕ", null)) {
                            if (t.next !== null && t.next.isValue("СТАНЦИЯ", null)) {
                                let ci1 = CityItemToken.tryParse(t.next.next, null, false, null);
                                if (ci1 !== null && ((ci1.typ === CityItemTokenItemType.PROPERNAME || ci1.typ === CityItemTokenItemType.CITY))) {
                                    ci.endToken = t.next;
                                    ci.altValue = "СТАНЦИЯ";
                                }
                            }
                        }
                        if ((ci.lengthChar < 3) && ci.endToken.next !== null && ci.endToken.next.isChar('.')) 
                            ci.endToken = ci.endToken.next;
                        return ci;
                    }
                }
            }
        }
        if (!(t instanceof TextToken)) 
            return null;
        if (t.term === "СПБ" && !t.chars.isAllLower && CityItemToken.m_StPeterburg !== null) 
            return CityItemToken._new1229(t, t, CityItemTokenItemType.CITY, CityItemToken.m_StPeterburg, CityItemToken.m_StPeterburg.canonicText);
        if (t.term === "НЕТ") 
            return null;
        if (t.chars.isAllLower) {
            if (t.lengthChar < 4) 
                return null;
            if (!MiscLocationHelper.isUserParamAddress(t)) 
                return null;
            if (StreetItemToken.checkKeyword(t) || t.isValue("УЧАСТОК", null) || t.isValue("ДОМ", null)) 
                return null;
            if (t.previous !== null && t.previous.isComma) {
            }
            else if (prev !== null && prev.typ === CityItemTokenItemType.NOUN) {
            }
            else 
                return null;
            let ait = AddressItemToken.tryParsePureItem(t, null, null);
            if (ait !== null) {
                if (ait.typ === AddressItemType.DETAIL) 
                    return null;
            }
        }
        let stds = CityItemToken.m_StdAdjectives.tryAttach(t, null, false);
        if (stds !== null) {
            let cit = CityItemToken.tryParse(stds[0].endToken.next, null, false, ad);
            if (cit !== null && ((((cit.typ === CityItemTokenItemType.PROPERNAME && cit.value !== null)) || cit.typ === CityItemTokenItemType.CITY))) {
                let adj = stds[0].termin.canonicText;
                if (stds[0].endToken.isValue(adj, null) || MiscLocationHelper.isUserParamAddress(t)) 
                    adj = MiscHelper.getTextValueOfMetaToken(stds[0], GetTextAttr.NO);
                cit.value = (adj + " " + ((cit.value != null ? cit.value : (cit !== null && cit.ontoItem !== null ? cit.ontoItem.canonicText : null))));
                if (cit.altValue !== null) 
                    cit.altValue = (adj + " " + cit.altValue);
                cit.beginToken = t;
                let npt0 = MiscLocationHelper.tryParseNpt(t);
                if (npt0 !== null && npt0.endToken === cit.endToken) {
                    if (npt0.endToken.morph.containsAttr("кач.прил.", null) || MiscLocationHelper.isUserParamAddress(t)) {
                    }
                    else {
                        cit.morph = npt0.morph;
                        cit.altValue = cit.value;
                        cit.value = npt0.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                    }
                }
                cit.typ = CityItemTokenItemType.PROPERNAME;
                cit.doubtful = false;
                return cit;
            }
        }
        let t1 = t;
        let doubt = false;
        let name = new StringBuilder();
        let altname = null;
        let k = 0;
        let isPrep = false;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (!(tt instanceof TextToken)) 
                break;
            if (!tt.chars.isLetter || ((tt.chars.isCyrillicLetter !== t.chars.isCyrillicLetter && !tt.isValue("НА", null)))) 
                break;
            if (tt !== t) {
                let si = StreetItemToken.tryParse(tt, null, false, null);
                if (si !== null && si.typ === StreetItemType.NOUN) {
                    if (si.endToken.next === null || si.endToken.next.isCharOf(",.")) {
                    }
                    else 
                        break;
                }
                if (tt.lengthChar < 2) 
                    break;
                if ((tt.lengthChar < 3) && !tt.isValue("НА", null)) {
                    if (tt.isWhitespaceBefore) 
                        break;
                }
            }
            if (name.length > 0) {
                name.append('-');
                if (altname !== null) 
                    altname.append('-');
            }
            if ((tt instanceof TextToken) && ((isPrep || ((k > 0 && !tt.getMorphClassInDictionary().isProperGeo))))) {
                name.append(tt.term);
                if (altname !== null) 
                    altname.append(tt.term);
            }
            else {
                let ss = (dontNormalize ? tt.term : CityItemToken.getNormalGeo(tt));
                if (ss === "ПОЛ" && tt.isValue("ПОЛЕ", null)) 
                    ss = "ПОЛЕ";
                if (ss !== tt.term) {
                    if (altname === null) 
                        altname = new StringBuilder();
                    altname.append(name.toString());
                    altname.append(tt.term);
                }
                else if (altname !== null) 
                    altname.append(ss);
                name.append(ss);
            }
            t1 = tt;
            isPrep = tt.morph._class.isPreposition;
            if (tt.next === null || tt.next.next === null) 
                break;
            if (!tt.next.isHiphen) {
                if (tt.next.isValue("ИМ", null) || tt.next.isValue("ИМЕНИ", null)) {
                    let nam0 = NameToken.tryParse(tt.next, GeoTokenType.CITY, 0, false);
                    if (nam0 !== null && nam0.name !== null) {
                        name.append(" ").append(nam0.name);
                        t1 = (tt = nam0.endToken);
                        break;
                    }
                }
                break;
            }
            if (dontNormalize) 
                break;
            if (tt.isWhitespaceAfter || tt.next.isWhitespaceAfter) {
                if (tt.whitespacesAfterCount > 1 || tt.next.whitespacesAfterCount > 1) 
                    break;
                if (!tt.next.next.chars.equals(tt.chars)) 
                    break;
                let ttt = tt.next.next.next;
                if (ttt !== null && !ttt.isNewlineAfter) {
                    if (ttt.chars.isLetter) 
                        break;
                }
            }
            if (CityItemToken.checkKeyword(tt.next.next) !== null) 
                break;
            tt = tt.next;
            k++;
        }
        if (k > 0) {
            if (k > 2) 
                return null;
            let reee = CityItemToken._new1230(t, t1, CityItemTokenItemType.PROPERNAME, name.toString(), doubt);
            if (altname !== null) 
                reee.altValue = altname.toString();
            return reee;
        }
        if (t === null) 
            return null;
        let npt = (t.chars.isLatinLetter ? null : NounPhraseHelper.tryParse(t, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null));
        if (npt !== null && (npt.endToken instanceof ReferentToken) && npt.endToken.beginToken !== npt.endToken.endToken) 
            npt = null;
        if (npt !== null && npt.adjectives.length > 1) 
            npt = null;
        if (npt !== null && npt.beginToken === npt.endToken) 
            npt = null;
        if (npt !== null) {
            let mc = npt.endToken.getMorphClassInDictionary();
            if (mc.isProperSurname && !npt.endToken.isValue("ГОРА", null)) 
                npt = null;
            else if (mc.isNoun) {
                if (CityItemToken.checkKeyword(npt.endToken) !== null) 
                    npt = null;
            }
            else if (!mc.isUndefined) 
                npt = null;
            else if (npt.endToken.morph._class.isProperSurname) 
                npt = null;
            else if (AddressItemToken.checkStreetAfter(npt.endToken, false)) 
                npt = null;
        }
        if ((npt !== null && npt.endToken !== t && npt.adjectives.length > 0) && !npt.adjectives[0].endToken.next.isComma) {
            let cit = CityItemToken.tryParse(t.next, null, false, null);
            if (cit !== null && cit.typ === CityItemTokenItemType.NOUN && ((LanguageHelper.endsWithEx(cit.value, "ПУНКТ", "ПОСЕЛЕНИЕ", "ПОСЕЛЕННЯ", "ПОСЕЛОК") || t.next.isValue("ГОРОДОК", null) || t.next.isValue("СЕЛО", null)))) {
                let ok2 = false;
                let mc = t.getMorphClassInDictionary();
                if (!mc.isAdjective) 
                    ok2 = true;
                else if (!MiscHelper.canBeStartOfSentence(t)) 
                    ok2 = true;
                else if (MiscLocationHelper.checkGeoObjectBefore(t, false)) 
                    ok2 = true;
                if (ok2) 
                    return CityItemToken._new1231(t, t, CityItemTokenItemType.CITY, t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), npt.morph);
            }
            let _check = true;
            if (!npt.endToken.chars.equals(t.chars)) {
                if (npt.endToken.isValue("КИЛОМЕТР", null)) 
                    npt = null;
                else if (OrgItemToken.tryParse(t.next, null) !== null) 
                    npt = null;
                else if (npt.endToken.chars.isAllLower && ((npt.endToken.next === null || npt.endToken.next.isComma || AddressItemToken.checkStreetAfter(npt.endToken.next, false)))) {
                }
                else {
                    let aid = AddressItemToken.tryParse(t.next, false, null, null);
                    if (aid !== null) 
                        npt = null;
                    else if (prev !== null && prev.typ === CityItemTokenItemType.NOUN && CityAttachHelper.checkCityAfter(t.next)) 
                        _check = false;
                    else {
                        let rt1 = t.kit.processReferent("NAMEDENTITY", t, null);
                        if (rt1 !== null && rt1.endToken === npt.endToken) {
                        }
                        else 
                            npt = null;
                    }
                }
            }
            if (_check && !dontNormalize && npt !== null) {
                let org1 = OrgItemToken.tryParse(t.next, null);
                if (org1 !== null && !org1.isDoubt) {
                    let org0 = OrgItemToken.tryParse(t, null);
                    if (org0 !== null && org0.isDoubt) 
                        npt = null;
                }
            }
            if (_check && !dontNormalize && npt !== null) {
                if (npt.adjectives.length !== 1) 
                    return null;
                let ter = TerrItemToken.checkOntoItem(npt.noun.beginToken);
                if (ter !== null) 
                    npt = null;
                else if (MiscLocationHelper.checkTerritory(npt.endToken) !== null) 
                    npt = null;
                if (npt !== null) {
                    let npt1 = MiscLocationHelper.tryParseNpt(npt.endToken);
                    if (npt1 === null || npt1.adjectives.length === 0) {
                        let si = StreetItemToken.tryParse(npt.endToken, null, false, null);
                        if ((si === null || si.typ !== StreetItemType.NOUN || si.termin.canonicText === "МОСТ") || si.termin.canonicText === "ПАРК" || si.termin.canonicText === "САД") {
                            t1 = npt.endToken;
                            doubt = CityItemToken.checkDoubtful(Utils.as(t1, TextToken));
                            return CityItemToken._new1232(t, t1, CityItemTokenItemType.PROPERNAME, npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), doubt, npt.morph);
                        }
                    }
                }
            }
        }
        if (t.next !== null && t.next.chars.equals(t.chars) && !t.isNewlineAfter) {
            let ok = false;
            if (TerrItemToken.checkOntoItem(t.next) !== null) {
            }
            else if (t.next.next === null || !t.next.next.chars.equals(t.chars)) 
                ok = true;
            else if (t.next.next.getReferent() instanceof GeoReferent) 
                ok = true;
            else {
                let tis = TerrItemToken.tryParseList(t.next.next, 2, null);
                if (tis !== null && tis.length > 1) {
                    if (tis[0].isAdjective && tis[1].terminItem !== null) 
                        ok = true;
                }
            }
            if (ok && (((t.next instanceof TextToken) || (((t.next instanceof ReferentToken) && t.next.beginToken === t.next.endToken))))) {
                if (t.next instanceof TextToken) 
                    doubt = CityItemToken.checkDoubtful(Utils.as(t.next, TextToken));
                let stat = t.kit.statistics.getBigrammInfo(t, t.next);
                let ok1 = false;
                if ((stat !== null && stat.pairCount >= 2 && stat.pairCount === stat.secondCount) && !stat.secondHasOtherFirst) {
                    if (stat.pairCount > 2) 
                        doubt = false;
                    ok1 = true;
                }
                else if (CityItemToken.m_StdAdjectives.tryAttach(t, null, false) !== null && (t.next instanceof TextToken)) 
                    ok1 = true;
                else if ((t.next.next !== null && t.next.next.isComma && t.morph._class.isNoun) && ((t.next.morph._class.isAdjective || t.next.morph._class.isNoun))) 
                    ok1 = true;
                if (!ok1 && t.next.chars.value === t.chars.value) {
                    if (t.next.morph._case.isGenitive || (((((LanguageHelper.endsWith(name.toString(), "ОВ") || LanguageHelper.endsWith(name.toString(), "ВО"))) && (t.next instanceof TextToken) && !t.next.chars.isAllLower) && t.next.lengthChar > 1 && !t.next.getMorphClassInDictionary().isUndefined))) {
                        if (MiscLocationHelper.checkGeoObjectAfter(t.next, false, false)) 
                            ok1 = true;
                        else {
                            let aid = AddressItemToken.tryParse(t.next.next, false, null, null);
                            if (aid !== null && !aid.isDoubt) {
                                if (aid.typ === AddressItemType.STREET || aid.typ === AddressItemType.PLOT || aid.typ === AddressItemType.HOUSE) 
                                    ok1 = true;
                            }
                        }
                    }
                }
                if (!ok1) {
                    if (AddressItemToken.checkStreetAfter(t.next.next, false)) {
                        if (!AddressItemToken.checkStreetAfter(t.next, false)) 
                            ok1 = true;
                    }
                }
                if (!ok1 && t.getMorphClassInDictionary().isProperName && MiscLocationHelper.isUserParamAddress(t)) {
                    let pp = t.kit.processReferent("PERSON", t, null);
                    if (pp !== null && pp.endToken !== t && (pp.endToken instanceof TextToken)) {
                        if (TerrItemToken.checkKeyword(pp.endToken.next) === null) 
                            return CityItemToken._new1233(t, pp.endToken, CityItemTokenItemType.PROPERNAME, pp.endToken.term, MiscHelper.getTextValueOfMetaToken(pp, GetTextAttr.NO), pp.morph);
                    }
                }
                if (ok1) {
                    let tne = CityItemToken._tryParseInt(t.next, null, false, ad);
                    if (tne !== null && tne.typ === CityItemTokenItemType.NOUN) {
                    }
                    else {
                        if (t.next instanceof TextToken) {
                            name.append(" ").append(t.next.term);
                            if (altname !== null) 
                                altname.append(" ").append(t.next.term);
                        }
                        else {
                            name.append(" ").append(MiscHelper.getTextValueOfMetaToken(Utils.as(t.next, ReferentToken), GetTextAttr.NO));
                            if (altname !== null) 
                                altname.append(" ").append(MiscHelper.getTextValueOfMetaToken(Utils.as(t.next, ReferentToken), GetTextAttr.NO));
                        }
                        t1 = t.next;
                        return CityItemToken._new1234(t, t1, CityItemTokenItemType.PROPERNAME, name.toString(), (altname === null ? null : altname.toString()), doubt, t.next.morph);
                    }
                }
            }
        }
        if (t.lengthChar < 2) 
            return null;
        if (t1 !== null && t1.endChar > t.endChar) 
            t = t1;
        else 
            t1 = t;
        doubt = CityItemToken.checkDoubtful(Utils.as(t, TextToken));
        if (((t.next !== null && prev !== null && prev.typ === CityItemTokenItemType.NOUN) && t.next.chars.isCyrillicLetter && t.next.chars.isAllLower) && t.whitespacesAfterCount === 1) {
            let tt = t.next;
            let ok = false;
            if (tt.next === null || tt.next.isCharOf(",;")) {
                ok = true;
                let _next = CityItemToken.tryParse(tt, null, false, null);
                if (_next !== null && _next.typ === CityItemTokenItemType.NOUN) 
                    ok = false;
            }
            if (ok && AddressItemToken.tryParse(tt.next, false, null, null) === null) {
                t1 = tt;
                name.append(" ").append(t1.getSourceText().toUpperCase());
            }
        }
        if (MiscHelper.isEngArticle(t)) 
            return null;
        if (StreetItemToken.checkKeyword(t)) {
            if (AddressItemToken.checkStreetAfter(t, false)) {
                if (prev !== null && prev.typ === CityItemTokenItemType.NOUN && t.chars.isCapitalUpper) {
                }
                else 
                    return null;
            }
        }
        let res = CityItemToken._new1234(t, t1, CityItemTokenItemType.PROPERNAME, name.toString(), (altname === null ? null : altname.toString()), doubt, t.morph);
        if (t1 === t && (t1 instanceof TextToken) && t1.term0 !== null) 
            res.altValue = t1.term0;
        let sog = false;
        let glas = false;
        for (const ch of res.value) {
            if (LanguageHelper.isCyrillicVowel(ch) || LanguageHelper.isLatinVowel(ch)) 
                glas = true;
            else 
                sog = true;
        }
        if (t.chars.isAllUpper && t.lengthChar > 2) {
            if (!glas || !sog) 
                res.doubtful = true;
        }
        else if (!glas || !sog) 
            return null;
        if (t === t1 && (t instanceof TextToken)) {
            if (t.term !== res.value) 
                res.altValue = t.term;
        }
        if ((res.whitespacesAfterCount < 2) && (res.endToken.next instanceof TextToken)) {
            let abbr = CityItemToken.m_SpecAbbrs.tryParse(res.endToken.next, TerminParseAttr.NO);
            if (abbr !== null) {
                res.endToken = abbr.endToken;
                res.doubtful = false;
                res.misc = abbr.termin.canonicText;
                abbr = CityItemToken.m_SpecAbbrs.tryParse(res.endToken.next, TerminParseAttr.NO);
                if (abbr !== null) {
                    res.misc2 = abbr.termin.canonicText;
                    res.endToken = abbr.endToken;
                }
            }
            else if (!res.endToken.next.chars.isAllLower) {
                abbr = CityItemToken.m_SpecAbbrs.tryParse(res.beginToken, TerminParseAttr.NO);
                if (abbr !== null && abbr.endToken === res.endToken) {
                    let _next = CityItemToken._tryParseInt(res.endToken.next, null, dontNormalize, ad);
                    if (_next !== null && ((_next.typ === CityItemTokenItemType.PROPERNAME || _next.typ === CityItemTokenItemType.CITY))) {
                        res.endToken = _next.endToken;
                        res.doubtful = false;
                        res.value = _next.value;
                        res.altValue = (res.value + " " + _next.value);
                    }
                }
            }
        }
        return res;
    }
    
    static _tryParseSpec(t) {
        const OrgItemToken = require("./OrgItemToken");
        if (t === null) 
            return null;
        let org = OrgItemToken.tryParse(t, null);
        if (org !== null) 
            return CityItemToken._new1236(t, org.endToken, CityItemTokenItemType.PROPERNAME, org);
        let tok1 = CityItemToken.m_SpecNames.tryParse(t, TerminParseAttr.NO);
        if (tok1 !== null) {
            let res = CityItemToken._new1215(t, tok1.endToken, CityItemTokenItemType.PROPERNAME, tok1.termin.canonicText);
            return res;
        }
        tok1 = CityItemToken.m_SpecAbbrs.tryParse(t, TerminParseAttr.NO);
        if (tok1 !== null) {
            let tt = tok1.endToken.next;
            let tok2 = CityItemToken.m_SpecAbbrs.tryParse(tt, TerminParseAttr.NO);
            if (tok2 !== null) 
                tt = tok2.endToken.next;
            let res = null;
            if (BracketHelper.canBeStartOfSequence(tt, true, false)) {
                let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                if (br !== null) {
                    res = CityItemToken._new1212(t, br.endToken, CityItemTokenItemType.PROPERNAME);
                    res.value = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                }
            }
            else if (tt !== null) {
                let tmp = CityItemToken._new1215(tt.previous, tt.previous, CityItemTokenItemType.NOUN, "ГОРОД");
                let cit = CityItemToken.tryParse(tt, tmp, false, null);
                if (cit !== null && ((cit.typ === CityItemTokenItemType.PROPERNAME || cit.typ === CityItemTokenItemType.CITY))) 
                    res = cit;
            }
            if (res !== null) {
                res.typ = CityItemTokenItemType.PROPERNAME;
                res.doubtful = false;
                res.beginToken = t;
                if (res.misc === null) 
                    res.misc = tok1.termin.canonicText;
                else 
                    res.misc2 = tok1.termin.canonicText;
                if (tok2 !== null) 
                    res.misc2 = tok2.termin.canonicText;
                tok2 = CityItemToken.m_SpecNames.tryParse(res.endToken.next, TerminParseAttr.NO);
                if (tok2 !== null) {
                    res.misc2 = tok2.termin.canonicText;
                    res.endToken = tok2.endToken;
                }
                return res;
            }
        }
        return null;
    }
    
    static tryParseBack(t, onlyNoun = false) {
        while (t !== null && ((t.isCharOf("(,") || t.isAnd))) {
            t = t.previous;
        }
        if (!(t instanceof TextToken)) 
            return null;
        let cou = 0;
        for (let tt = t; tt !== null; tt = tt.previous) {
            if (!(tt instanceof TextToken)) 
                return null;
            if (!tt.chars.isLetter) 
                continue;
            if (onlyNoun) {
                let vv = CityItemToken.checkKeyword(tt);
                if (vv !== null && vv.endToken === t) 
                    return CityItemToken._new1215(tt, t, CityItemTokenItemType.NOUN, vv.termin.canonicText);
            }
            else {
                let res = CityItemToken.tryParse(tt, null, false, null);
                if (res !== null && res.endToken === t) 
                    return res;
            }
            if ((++cou) > 2) 
                break;
        }
        return null;
    }
    
    static getNormalGeo(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let ch = tt.term[tt.term.length - 1];
        if (((ch === 'О' || ch === 'В' || ch === 'Ы') || ch === 'И' || ch === 'Х') || ch === 'Ь' || ch === 'Й') 
            return tt.term;
        for (const wf of tt.morph.items) {
            if (wf._class.isProperGeo && wf.isInDictionary) 
                return wf.normalCase;
        }
        let geoEqTerm = false;
        for (const wf of tt.morph.items) {
            if (wf._class.isProperGeo) {
                let ggg = wf.normalCase;
                if (ggg === tt.term) 
                    geoEqTerm = true;
                else if (!wf._case.isNominative) 
                    return ggg;
            }
        }
        if (geoEqTerm) 
            return tt.term;
        if (tt.morph.itemsCount > 0) 
            return tt.morph.getIndexerItem(0).normalCase;
        else 
            return tt.term;
    }
    
    static checkDoubtful(tt) {
        if (tt === null) 
            return true;
        if (tt.chars.isAllLower) 
            return true;
        if (tt.lengthChar < 3) 
            return true;
        if (((tt.term === "СОЧИ" || tt.isValue("КИЕВ", null) || tt.isValue("ПСКОВ", null)) || tt.isValue("БОСТОН", null) || tt.isValue("РИГА", null)) || tt.isValue("АСТАНА", null) || tt.isValue("АЛМАТЫ", null)) 
            return false;
        if (LanguageHelper.endsWith(tt.term, "ВО")) 
            return false;
        if ((tt.next instanceof TextToken) && (tt.whitespacesAfterCount < 2) && !tt.next.chars.isAllLower) {
            if (tt.chars.equals(tt.next.chars) && !tt.chars.isLatinLetter && ((!tt.morph._case.isGenitive && !tt.morph._case.isAccusative))) {
                let mc = tt.next.getMorphClassInDictionary();
                if (mc.isProperSurname || mc.isProperSecname) 
                    return true;
            }
        }
        if ((tt.previous instanceof TextToken) && (tt.whitespacesBeforeCount < 2) && !tt.previous.chars.isAllLower) {
            let mc = tt.previous.getMorphClassInDictionary();
            if (mc.isProperSurname) 
                return true;
        }
        let ok = false;
        for (const wff of tt.morph.items) {
            let wf = Utils.as(wff, MorphWordForm);
            if (wf.isInDictionary) {
                if (!wf._class.isProper) 
                    ok = true;
                if (wf._class.isProperSurname || wf._class.isProperName || wf._class.isProperSecname) {
                    if (wf.normalCase !== "ЛОНДОН" && wf.normalCase !== "ЛОНДОНЕ") 
                        ok = true;
                }
            }
            else if (wf._class.isProperSurname) {
                let val = (wf.normalFull != null ? wf.normalFull : wf.normalCase);
                if (LanguageHelper.endsWithEx(val, "ОВ", "ЕВ", "ИН", null)) {
                    if (val !== "БЕРЛИН") {
                        if (tt.previous !== null && tt.previous.isValue("В", null)) {
                        }
                        else 
                            return true;
                    }
                }
            }
        }
        if (!ok) 
            return false;
        let t0 = tt.previous;
        if (t0 !== null && ((t0.isChar(',') || t0.morph._class.isConjunction))) 
            t0 = t0.previous;
        if (t0 !== null && (t0.getReferent() instanceof GeoReferent)) 
            return false;
        if (MiscLocationHelper.checkGeoObjectAfterBrief(tt, null)) 
            return false;
        return true;
    }
    
    static _new1212(_arg1, _arg2, _arg3) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new1215(_arg1, _arg2, _arg3, _arg4) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new1219(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.doubtful = _arg4;
        res.cond = _arg5;
        res.value = _arg6;
        return res;
    }
    
    static _new1226(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ontoItem = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new1228(_arg1, _arg2, _arg3, _arg4) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new1229(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ontoItem = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new1230(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.doubtful = _arg5;
        return res;
    }
    
    static _new1231(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new1232(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.doubtful = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new1233(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.altValue = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new1234(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.altValue = _arg5;
        res.doubtful = _arg6;
        res.morph = _arg7;
        return res;
    }
    
    static _new1236(_arg1, _arg2, _arg3, _arg4) {
        let res = new CityItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.orgRef = _arg4;
        return res;
    }
    
    static static_constructor() {
        CityItemToken.m_Ontology = null;
        CityItemToken.m_OntologyEx = null;
        CityItemToken.m_StPeterburg = null;
        CityItemToken.M_CITY_ADJECTIVES = null;
        CityItemToken.m_StdAdjectives = null;
        CityItemToken.m_SpecNames = null;
        CityItemToken.m_SpecAbbrs = null;
        CityItemToken.SPEED_REGIME = false;
    }
}


CityItemToken.static_constructor();

module.exports = CityItemToken