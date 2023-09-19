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

const ReferentsEqualType = require("./../../core/ReferentsEqualType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const StreetReferent = require("./../../address/StreetReferent");
const Token = require("./../../Token");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const GeoReferent = require("./../../geo/GeoReferent");
const NumberToken = require("./../../NumberToken");
const OrganizationKind = require("./../OrganizationKind");
const OrgItemNumberToken = require("./OrgItemNumberToken");
const IntOntologyCollection = require("./../../core/IntOntologyCollection");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const MorphCollection = require("./../../MorphCollection");
const BracketHelper = require("./../../core/BracketHelper");
const TextToken = require("./../../TextToken");
const OrgProfile = require("./../OrgProfile");
const MorphLang = require("./../../../morph/MorphLang");
const OrgItemTypeTyp = require("./OrgItemTypeTyp");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphGender = require("./../../../morph/MorphGender");
const PullentiNerOrgInternalResourceHelper = require("./PullentiNerOrgInternalResourceHelper");
const OrgItemTypeTermin = require("./OrgItemTypeTermin");
const OrganizationReferent = require("./../OrganizationReferent");
const MorphClass = require("./../../../morph/MorphClass");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const CharsInfo = require("./../../../morph/CharsInfo");
const OrgTokenData = require("./OrgTokenData");
const OrganizationAnalyzer = require("./../OrganizationAnalyzer");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphDeserializer = require("./../../../morph/internal/MorphDeserializer");
const MorphologyService = require("./../../../morph/MorphologyService");
const TerminCollection = require("./../../core/TerminCollection");

class OrgItemTypeToken extends MetaToken {
    
    static initialize() {
        if (OrgItemTypeToken.m_Global !== null) 
            return;
        OrgItemTypeToken.m_Global = new IntOntologyCollection();
        let tdat = PullentiNerOrgInternalResourceHelper.getBytes("OrgTypes.dat");
        if (tdat === null) 
            throw new Error("Can't file resource file OrgTypes.dat in Organization analyzer");
        tdat = OrgItemTypeToken.deflate(tdat);
        let tmp = new MemoryStream(tdat); 
        try {
            tmp.position = 0;
            let xml = new XmlDocument();
            xml.loadStream(tmp);
            let set = null;
            for (const x of xml.document_element.child_nodes) {
                let its = OrgItemTypeTermin.deserializeSrc(x, set);
                if (x.local_name === "set") {
                    set = null;
                    if (its !== null && its.length > 0) 
                        set = its[0];
                }
                else if (its !== null) {
                    for (const ii of its) {
                        if (ii.canonicText === "СУДЕБНЫЙ УЧАСТОК") 
                            OrgItemTypeToken.m_SudUch = ii;
                        OrgItemTypeToken.m_Global.add(ii);
                    }
                }
            }
        }
        finally {
            tmp.close();
        }
        let t = null;
        let sovs = ["СОВЕТ БЕЗОПАСНОСТИ", "НАЦИОНАЛЬНЫЙ СОВЕТ", "ГОСУДАРСТВЕННЫЙ СОВЕТ", "ОБЛАСТНОЙ СОВЕТ", "РАЙОННЫЙ СОВЕТ", "ГОРОДСКОЙ СОВЕТ", "СЕЛЬСКИЙ СОВЕТ", "ПОСЕЛКОВЫЙ СОВЕТ", "КРАЕВОЙ СОВЕТ", "СЛЕДСТВЕННЫЙ КОМИТЕТ", "ГОСУДАРСТВЕННОЕ СОБРАНИЕ", "МУНИЦИПАЛЬНОЕ СОБРАНИЕ", "ГОРОДСКОЕ СОБРАНИЕ", "ЗАКОНОДАТЕЛЬНОЕ СОБРАНИЕ", "НАРОДНОЕ СОБРАНИЕ", "ОБЛАСТНАЯ ДУМА", "ГОРОДСКАЯ ДУМА", "КРАЕВАЯ ДУМА", "КАБИНЕТ МИНИСТРОВ"];
        let sov2 = ["СОВБЕЗ", "НАЦСОВЕТ", "ГОССОВЕТ", "ОБЛСОВЕТ", "РАЙСОВЕТ", "ГОРСОВЕТ", "СЕЛЬСОВЕТ", "ПОССОВЕТ", "КРАЙСОВЕТ", null, "ГОССОБРАНИЕ", "МУНСОБРАНИЕ", "ГОРСОБРАНИЕ", "ЗАКСОБРАНИЕ", "НАРСОБРАНИЕ", "ОБЛДУМА", "ГОРДУМА", "КРАЙДУМА", "КАБМИН"];
        for (let i = 0; i < sovs.length; i++) {
            t = OrgItemTypeTermin._new1835(sovs[i], MorphLang.RU, OrgProfile.STATE, 4, OrgItemTypeTyp.ORG, true, true);
            if (sov2[i] !== null) {
                t.addVariant(sov2[i], false);
                if (sov2[i] === "ГОССОВЕТ" || sov2[i] === "НАЦСОВЕТ" || sov2[i] === "ЗАКСОБРАНИЕ") 
                    t.coeff = 5;
            }
            OrgItemTypeToken.m_Global.add(t);
        }
        sovs = ["РАДА БЕЗПЕКИ", "НАЦІОНАЛЬНА РАДА", "ДЕРЖАВНА РАДА", "ОБЛАСНА РАДА", "РАЙОННА РАДА", "МІСЬКА РАДА", "СІЛЬСЬКА РАДА", "КРАЙОВИЙ РАДА", "СЛІДЧИЙ КОМІТЕТ", "ДЕРЖАВНІ ЗБОРИ", "МУНІЦИПАЛЬНЕ ЗБОРИ", "МІСЬКЕ ЗБОРИ", "ЗАКОНОДАВЧІ ЗБОРИ", "НАРОДНІ ЗБОРИ", "ОБЛАСНА ДУМА", "МІСЬКА ДУМА", "КРАЙОВА ДУМА", "КАБІНЕТ МІНІСТРІВ"];
        sov2 = ["РАДБЕЗ", null, null, "ОБЛРАДА", "РАЙРАДА", "МІСЬКРАДА", "СІЛЬРАДА", "КРАЙРАДА", null, "ДЕРЖЗБОРИ", "МУНЗБОРИ", "ГОРСОБРАНИЕ", "ЗАКЗБОРИ", "НАРСОБРАНИЕ", "ОБЛДУМА", "МІСЬКДУМА", "КРАЙДУМА", "КАБМІН"];
        for (let i = 0; i < sovs.length; i++) {
            t = OrgItemTypeTermin._new1835(sovs[i], MorphLang.UA, OrgProfile.STATE, 4, OrgItemTypeTyp.ORG, true, true);
            if (sov2[i] !== null) 
                t.addVariant(sov2[i], false);
            if (sov2[i] === "ГОССОВЕТ" || sov2[i] === "ЗАКЗБОРИ") 
                t.coeff = 5;
            OrgItemTypeToken.m_Global.add(t);
        }
        sovs = ["SECURITY COUNCIL", "NATIONAL COUNCIL", "STATE COUNCIL", "REGIONAL COUNCIL", "DISTRICT COUNCIL", "CITY COUNCIL", "RURAL COUNCIL", "INVESTIGATIVE COMMITTEE", "INVESTIGATION DEPARTMENT", "NATIONAL ASSEMBLY", "MUNICIPAL ASSEMBLY", "URBAN ASSEMBLY", "LEGISLATURE"];
        for (let i = 0; i < sovs.length; i++) {
            t = OrgItemTypeTermin._new1835(sovs[i], MorphLang.EN, OrgProfile.STATE, 4, OrgItemTypeTyp.ORG, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new1838("ГОСУДАРСТВЕННЫЙ КОМИТЕТ", OrgItemTypeTyp.ORG, OrgProfile.STATE, 2);
        t.addVariant("ГОСКОМИТЕТ", false);
        t.addVariant("ГОСКОМ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1839("ДЕРЖАВНИЙ КОМІТЕТ", MorphLang.UA, OrgItemTypeTyp.ORG, OrgProfile.STATE, 2);
        t.addVariant("ДЕРЖКОМІТЕТ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1840("КРАЕВОЙ КОМИТЕТ ГОСУДАРСТВЕННОЙ СТАТИСТИКИ", OrgItemTypeTyp.DEP, OrgProfile.STATE, 3, true);
        t.addVariant("КРАЙКОМСТАТ", false);
        t.profile = OrgProfile.UNIT;
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1840("ОБЛАСТНОЙ КОМИТЕТ ГОСУДАРСТВЕННОЙ СТАТИСТИКИ", OrgItemTypeTyp.DEP, OrgProfile.STATE, 3, true);
        t.addVariant("ОБЛКОМСТАТ", false);
        t.profile = OrgProfile.UNIT;
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1840("РАЙОННЫЙ КОМИТЕТ ГОСУДАРСТВЕННОЙ СТАТИСТИКИ", OrgItemTypeTyp.DEP, OrgProfile.STATE, 3, true);
        t.addVariant("РАЙКОМСТАТ", false);
        t.profile = OrgProfile.UNIT;
        OrgItemTypeToken.m_Global.add(t);
        sovs = ["ЦЕНТРАЛЬНЫЙ КОМИТЕТ", "РАЙОННЫЙ КОМИТЕТ", "ГОРОДСКОЙ КОМИТЕТ", "КРАЕВОЙ КОМИТЕТ", "ОБЛАСТНОЙ КОМИТЕТ", "ПОЛИТИЧЕСКОЕ БЮРО", "ИСПОЛНИТЕЛЬНЫЙ КОМИТЕТ"];
        sov2 = ["ЦК", "РАЙКОМ", "ГОРКОМ", "КРАЙКОМ", "ОБКОМ", "ПОЛИТБЮРО", "ИСПОЛКОМ"];
        for (let i = 0; i < sovs.length; i++) {
            t = OrgItemTypeTermin._new1843(sovs[i], 2, OrgItemTypeTyp.DEP, OrgProfile.UNIT);
            if (i === 0) {
                t.acronym = "ЦК";
                t.canBeNormalDep = true;
            }
            else if (sov2[i] !== null) 
                t.addVariant(sov2[i], false);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["Standing Committee", "Political Bureau", "Central Committee"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1844(s.toUpperCase(), 3, OrgItemTypeTyp.DEP, OrgProfile.UNIT, true));
        }
        sovs = ["ЦЕНТРАЛЬНИЙ КОМІТЕТ", "РАЙОННИЙ КОМІТЕТ", "МІСЬКИЙ КОМІТЕТ", "КРАЙОВИЙ КОМІТЕТ", "ОБЛАСНИЙ КОМІТЕТ"];
        for (let i = 0; i < sovs.length; i++) {
            t = OrgItemTypeTermin._new1845(sovs[i], MorphLang.UA, 2, OrgItemTypeTyp.DEP, OrgProfile.UNIT);
            if (i === 0) {
                t.acronym = "ЦК";
                t.canBeNormalDep = true;
            }
            else if (sov2[i] !== null) 
                t.addVariant(sov2[i], false);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new1846("КАЗНАЧЕЙСТВО", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1847("КАЗНАЧЕЙСТВО", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1846("TREASURY", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1846("ПОСОЛЬСТВО", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1846("EMNASSY", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1846("КОНСУЛЬСТВО", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1846("CONSULATE", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1853("ГОСУДАРСТВЕННЫЙ ДЕПАРТАМЕНТ", 5, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ГОСДЕПАРТАМЕНТ", false);
        t.addVariant("ГОСДЕП", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1853("DEPARTMENT OF STATE", 5, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("STATE DEPARTMENT", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1855("ДЕРЖАВНИЙ ДЕПАРТАМЕНТ", MorphLang.UA, 5, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ДЕРЖДЕПАРТАМЕНТ", false);
        t.addVariant("ДЕРЖДЕП", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1856("ДЕПАРТАМЕНТ", 2, OrgItemTypeTyp.ORG));
        t = OrgItemTypeTermin._new1856("DEPARTMENT", 2, OrgItemTypeTyp.ORG);
        t.addAbridge("DEPT.");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1858("АГЕНТСТВО", 1, OrgItemTypeTyp.ORG, true);
        t.addVariant("АГЕНСТВО", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1858("ADGENCY", 1, OrgItemTypeTyp.ORG, true));
        t = OrgItemTypeTermin._new1843("АКАДЕМИЯ", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1861("АКАДЕМІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1843("ACADEMY", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1863("ГЕНЕРАЛЬНЫЙ ШТАБ", 3, OrgItemTypeTyp.DEP, true, true, OrgProfile.ARMY);
        t.addVariant("ГЕНЕРАЛЬНИЙ ШТАБ", false);
        t.addVariant("ГЕНШТАБ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1863("GENERAL STAFF", 3, OrgItemTypeTyp.DEP, true, true, OrgProfile.ARMY);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1865("ФРОНТ", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ВОЕННЫЙ ОКРУГ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1867("ВІЙСЬКОВИЙ ОКРУГ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1865("ГРУППА АРМИЙ", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1869("ГРУПА АРМІЙ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1865("АРМИЯ", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1869("АРМІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1865("ARMY", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ГВАРДИЯ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1867("ГВАРДІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("GUARD", 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        OrgItemTypeToken.m_MilitaryUnit = (t = OrgItemTypeTermin._new1876("ВОЙСКОВАЯ ЧАСТЬ", 3, "ВЧ", OrgItemTypeTyp.ORG, true, OrgProfile.ARMY));
        t.addAbridge("В.Ч.");
        t.addVariant("ВОИНСКАЯ ЧАСТЬ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1877("ВІЙСЬКОВА ЧАСТИНА", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
        t.addAbridge("В.Ч.");
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ДИВИЗИЯ", "ДИВИЗИОН", "ПОЛК", "БАТАЛЬОН", "РОТА", "ВЗВОД", "АВИАДИВИЗИЯ", "АВИАПОЛК", "АРТБРИГАДА", "МОТОМЕХБРИГАДА", "ТАНКОВЫЙ КОРПУС", "ГАРНИЗОН", "ДРУЖИНА"]) {
            t = OrgItemTypeTermin._new1878(s, 3, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY);
            if (s === "ГАРНИЗОН") 
                t.canBeSingleGeo = true;
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new1878("ПОГРАНИЧНЫЙ ОТРЯД", 3, OrgItemTypeTyp.DEP, true, OrgProfile.ARMY);
        t.addVariant("ПОГРАНОТРЯД", false);
        t.addAbridge("ПОГРАН. ОТРЯД");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1878("ПОГРАНИЧНЫЙ ПОЛК", 3, OrgItemTypeTyp.DEP, true, OrgProfile.ARMY);
        t.addVariant("ПОГРАНПОЛК", false);
        t.addAbridge("ПОГРАН. ПОЛК");
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ДИВІЗІЯ", "ДИВІЗІОН", "ПОЛК", "БАТАЛЬЙОН", "РОТА", "ВЗВОД", "АВІАДИВІЗІЯ", "АВІАПОЛК", "ПОГРАНПОЛК", "АРТБРИГАДА", "МОТОМЕХБРИГАДА", "ТАНКОВИЙ КОРПУС", "ГАРНІЗОН", "ДРУЖИНА"]) {
            t = OrgItemTypeTermin._new1881(s, 3, MorphLang.UA, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY);
            if (s === "ГАРНІЗОН") 
                t.canBeSingleGeo = true;
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["КОРПУС", "БРИГАДА"]) {
            t = OrgItemTypeTermin._new1878(s, 1, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["КОРПУС", "БРИГАДА"]) {
            t = OrgItemTypeTermin._new1881(s, 1, MorphLang.UA, OrgItemTypeTyp.ORG, true, OrgProfile.ARMY);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new1881("ПРИКОРДОННИЙ ЗАГІН", 3, MorphLang.UA, OrgItemTypeTyp.DEP, true, OrgProfile.ARMY);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1843("ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1861("ДЕРЖАВНИЙ УНІВЕРСИТЕТ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1843("STATE UNIVERSITY", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1843("УНИВЕРСИТЕТ", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1861("УНІВЕРСИТЕТ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1890("UNIVERSITY", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1891("УЧРЕЖДЕНИЕ", 1, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1892("УСТАНОВА", MorphLang.UA, 1, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1891("INSTITUTION", 1, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1856("ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ", 3, OrgItemTypeTyp.ORG));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1895("ДЕРЖАВНА УСТАНОВА", MorphLang.UA, 3, OrgItemTypeTyp.ORG));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1846("STATE INSTITUTION", 3, OrgItemTypeTyp.ORG, true));
        t = OrgItemTypeTermin._new1843("ИНСТИТУТ", 2, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1861("ІНСТИТУТ", MorphLang.UA, 2, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1843("INSTITUTE", 2, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION);
        t.profiles.push(OrgProfile.SCIENCE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1900("ОТДЕЛ СУДЕБНЫХ ПРИСТАВОВ", OrgItemTypeTyp.PREFIX, "ОСП", OrgProfile.UNIT, true, true);
        t.profiles.push(OrgProfile.JUSTICE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1900("МЕЖРАЙОННЫЙ ОТДЕЛ СУДЕБНЫХ ПРИСТАВОВ", OrgItemTypeTyp.PREFIX, "МОСП", OrgProfile.UNIT, true, true);
        t.addVariant("МЕЖРАЙОННЫЙ ОСП", false);
        t.profiles.push(OrgProfile.JUSTICE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1900("ОТДЕЛ ВНЕВЕДОМСТВЕННОЙ ОХРАНЫ", OrgItemTypeTyp.PREFIX, "ОВО", OrgProfile.UNIT, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1900("ОТДЕЛ ПО ВОПРОСАМ МИГРАЦИИ", OrgItemTypeTyp.PREFIX, "ОВМ", OrgProfile.UNIT, true, true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1904("ЛИЦЕЙ", 2, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1905("ЛІЦЕЙ", MorphLang.UA, 2, OrgProfile.EDUCATION, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1904("ИНТЕРНАТ", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1905("ІНТЕРНАТ", MorphLang.UA, 3, OrgProfile.EDUCATION, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("HIGH SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("SECONDARY SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("MIDDLE SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("PUBLIC SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("JUNIOR SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1908("GRAMMAR SCHOOL", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true));
        t = OrgItemTypeTermin._new1914("СРЕДНЯЯ ШКОЛА", 3, "СШ", OrgItemTypeTyp.ORG, OrgProfile.EDUCATION, true, true);
        t.addVariant("СРЕДНЯЯ ОБРАЗОВАТЕЛЬНАЯ ШКОЛА", false);
        t.addAbridge("СОШ");
        t.addVariant("ОБЩЕОБРАЗОВАТЕЛЬНАЯ ШКОЛА", false);
        t.addVariant("СРЕДНЯЯ ОБЩЕОБРАЗОВАТЕЛЬНАЯ ШКОЛА", false);
        t.addVariant("ОСНОВНАЯ ОБЩЕОБРАЗОВАТЕЛЬНАЯ ШКОЛА", false);
        t.addVariant("ОСНОВНАЯ ОБРАЗОВАТЕЛЬНАЯ ШКОЛА", false);
        t.addAbridge("ООШ");
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1915("БИЗНЕС ШКОЛА", 3, OrgItemTypeTyp.ORG, true, true, true, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1915("БІЗНЕС ШКОЛА", 3, OrgItemTypeTyp.ORG, true, true, true, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1905("СЕРЕДНЯ ШКОЛА", MorphLang.UA, 3, OrgProfile.EDUCATION, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1843("ВЫСШАЯ ШКОЛА", 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1861("ВИЩА ШКОЛА", MorphLang.UA, 3, OrgItemTypeTyp.ORG, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("НАЧАЛЬНАЯ ШКОЛА", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ПОЧАТКОВА ШКОЛА", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("СЕМИНАРИЯ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("СЕМІНАРІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ГИМНАЗИЯ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ГІМНАЗІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        t = OrgItemTypeTermin._new1876("СПЕЦИАЛИЗИРОВАННАЯ ДЕТСКО ЮНОШЕСКАЯ СПОРТИВНАЯ ШКОЛА ОЛИМПИЙСКОГО РЕЗЕРВА", 3, "СДЮСШОР", OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1876("ДЕТСКО ЮНОШЕСКАЯ СПОРТИВНАЯ ШКОЛА ОЛИМПИЙСКОГО РЕЗЕРВА", 3, "ДЮСШОР", OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1876("ДЕТСКО ЮНОШЕСКАЯ СПОРТИВНАЯ ШКОЛА", 3, "ДЮСШ", OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1878("ДЕТСКИЙ САД", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        t.addVariant("ДЕТСАД", false);
        t.addAbridge("Д.С.");
        t.addAbridge("Д/С");
        t.addVariant("ЯСЛИ САД", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1921("ДИТЯЧИЙ САДОК", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        t.addVariant("ДИТСАДОК", false);
        t.addAbridge("Д.С.");
        t.addAbridge("Д/З");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1878("ДЕТСКИЙ ДОМ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        t.addVariant("ДЕТДОМ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1921("ДИТЯЧИЙ БУДИНОК", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION);
        t.addVariant("ДИТБУДИНОК", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1933("ДОМ ДЕТСКОГО ТВОРЧЕСТВА", 3, "ДДТ", OrgItemTypeTyp.ORG, true, true, OrgProfile.EDUCATION);
        t.addVariant("ДОМ ДЕТСКОГО И ЮНОШЕСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДДЮТ", false);
        t.addVariant("ДОМ ДЕТСКО ЮНЕШЕСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДВОРЕЦ ДЕТСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДВОРЕЦ ПИОНЕРОВ", false);
        t.addVariant("ДВОРЕЦ ДЕТСКОГО И ЮНОШЕСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДВОРЕЦ ДЕТСКОГО ЮНОШЕСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДВОРЕЦ ДЕТСКО ЮНОШЕСКОГО ТВОРЧЕСТВА", false);
        t.addVariant("ДВОРЕЦ ДЕТСКОГО (ЮНОШЕСКОГО) ТВОРЧЕСТВА", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ШКОЛА", 1, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1935("SCHOOL", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("УЧИЛИЩЕ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("КОЛЛЕДЖ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("КОЛЛЕГИУМ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ТЕХНИКУМ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1935("COLLEGE", 3, OrgItemTypeTyp.ORG, true, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1941("ЦЕНТР", OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1843("НАУЧНЫЙ ЦЕНТР", 3, OrgItemTypeTyp.ORG, OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1861("НАУКОВИЙ ЦЕНТР", MorphLang.UA, 3, OrgItemTypeTyp.ORG, OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1944("УЧЕБНО ВОСПИТАТЕЛЬНЫЙ КОМПЛЕКС", 3, OrgItemTypeTyp.ORG, "УВК", true, OrgProfile.EDUCATION, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1945("НАВЧАЛЬНО ВИХОВНИЙ КОМПЛЕКС", MorphLang.UA, 3, OrgItemTypeTyp.ORG, "УВК", true, OrgProfile.EDUCATION, true));
        t = OrgItemTypeTermin._new1946("ПРОФЕССИОНАЛЬНО ТЕХНИЧЕСКОЕ УЧИЛИЩЕ", 2, OrgItemTypeTyp.ORG, "ПТУ", true, OrgProfile.EDUCATION);
        t.addVariant("ПРОФТЕХУЧИЛИЩЕ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1946("ГОСУДАРСТВЕННОЕ ПРОФЕССИОНАЛЬНО ТЕХНИЧЕСКОЕ УЧИЛИЩЕ", 2, OrgItemTypeTyp.ORG, "ГПТУ", true, OrgProfile.EDUCATION);
        t.addVariant("ГОСПРОФТЕХУЧИЛИЩЕ", false);
        t.addVariant("ГОСУДАРСТВЕННОЕ ПРОФТЕХУЧИЛИЩЕ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1946("СРЕДНЕЕ ПРОФЕССИОНАЛЬНО ТЕХНИЧЕСКОЕ УЧИЛИЩЕ", 2, OrgItemTypeTyp.ORG, "СПТУ", true, OrgProfile.EDUCATION);
        t.addVariant("СРЕДНЕЕ ПРОФТЕХУЧИЛИЩЕ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1946("ПРОФЕССИОНАЛЬНО ТЕХНИЧЕСКАЯ ШКОЛА", 2, OrgItemTypeTyp.ORG, "ПТШ", true, OrgProfile.EDUCATION);
        t.addVariant("ПРОФТЕХШКОЛА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1946("ПРОФЕСІЙНО ТЕХНІЧНЕ УЧИЛИЩЕ", 2, OrgItemTypeTyp.ORG, "ПТУ", true, OrgProfile.EDUCATION);
        t.addVariant("ПРОФТЕХУЧИЛИЩЕ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1946("ПРОФЕСІЙНО ТЕХНІЧНА ШКОЛА", 2, OrgItemTypeTyp.ORG, "ПТШ", true, OrgProfile.EDUCATION);
        t.addVariant("ПРОФТЕХШКОЛА", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("БОЛЬНИЦА", 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ЛІКАРНЯ", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("МОРГ", 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("МОРГ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ХОСПИС", 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ХОСПІС", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        t = OrgItemTypeTermin._new1878("ГОРОДСКАЯ БОЛЬНИЦА", 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        t.addAbridge("ГОР.БОЛЬНИЦА");
        t.addVariant("ГОРБОЛЬНИЦА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1921("МІСЬКА ЛІКАРНЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1960("ГОРОДСКАЯ КЛИНИЧЕСКАЯ БОЛЬНИЦА", 3, OrgItemTypeTyp.ORG, true, "ГКБ", OrgProfile.MEDICINE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1961("МІСЬКА КЛІНІЧНА ЛІКАРНЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, "МКЛ", OrgProfile.MEDICINE);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("КЛАДБИЩЕ", 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1877("КЛАДОВИЩЕ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ПОЛИКЛИНИКА", 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ПОЛІКЛІНІКА", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("ГОСПИТАЛЬ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("ГОСПІТАЛЬ", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1878("КЛИНИКА", 1, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1921("КЛІНІКА", MorphLang.UA, 1, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE));
        t = OrgItemTypeTermin._new1878("МЕДИКО САНИТАРНАЯ ЧАСТЬ", 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        t.addVariant("МЕДСАНЧАСТЬ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1921("МЕДИКО САНІТАРНА ЧАСТИНА", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        t.addVariant("МЕДСАНЧАСТИНА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1972("МЕДИЦИНСКИЙ ЦЕНТР", 2, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDICINE);
        t.addVariant("МЕДЦЕНТР", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1973("МЕДИЧНИЙ ЦЕНТР", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDICINE);
        t.addVariant("МЕДЦЕНТР", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1878("РОДИЛЬНЫЙ ДОМ", 1, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        t.addVariant("РОДДОМ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1921("ПОЛОГОВИЙ БУДИНОК", MorphLang.UA, 1, OrgItemTypeTyp.ORG, true, OrgProfile.MEDICINE);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new1976("АЭРОПОРТ", 3, OrgItemTypeTyp.ORG, true, true, true, true, OrgProfile.TRANSPORT)));
        OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new1977("АЕРОПОРТ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true, true)));
        t = OrgItemTypeTermin._new1976("ТОРГОВЫЙ ПОРТ", 3, OrgItemTypeTyp.ORG, true, true, true, true, OrgProfile.TRANSPORT);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1976("МОРСКОЙ ТОРГОВЫЙ ПОРТ", 3, OrgItemTypeTyp.ORG, true, true, true, true, OrgProfile.TRANSPORT);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ТЕАТР", "ТЕАТР-СТУДИЯ", "КИНОТЕАТР", "МУЗЕЙ", "ГАЛЕРЕЯ", "КОНЦЕРТНЫЙ ЗАЛ", "ФИЛАРМОНИЯ", "КОНСЕРВАТОРИЯ", "ДОМ КУЛЬТУРЫ", "ДВОРЕЦ КУЛЬТУРЫ", "ДВОРЕЦ ПИОНЕРОВ", "ДВОРЕЦ СПОРТА", "ДВОРЕЦ ТВОРЧЕСТВА", "ДОМ ПИОНЕРОВ", "ДОМ СПОРТА", "ДОМ ТВОРЧЕСТВА"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1858(s, 3, OrgItemTypeTyp.ORG, true));
        }
        for (const s of ["ТЕАТР", "ТЕАТР-СТУДІЯ", "КІНОТЕАТР", "МУЗЕЙ", "ГАЛЕРЕЯ", "КОНЦЕРТНИЙ ЗАЛ", "ФІЛАРМОНІЯ", "КОНСЕРВАТОРІЯ", "БУДИНОК КУЛЬТУРИ", "ПАЛАЦ КУЛЬТУРИ", "ПАЛАЦ ПІОНЕРІВ", "ПАЛАЦ СПОРТУ", "ПАЛАЦ ТВОРЧОСТІ", "БУДИНОК ПІОНЕРІВ", "БУДИНОК СПОРТУ", "БУДИНОК ТВОРЧОСТІ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1981(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true));
        }
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1982("БИБЛИОТЕКА", 3, OrgItemTypeTyp.ORG, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1983("БІБЛІОТЕКА", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true));
        for (const s of ["ЦЕРКОВЬ", "ХРАМ", "СОБОР", "МЕЧЕТЬ", "СИНАГОГА", "МОНАСТЫРЬ", "ЛАВРА", "ПАТРИАРХАТ", "МЕДРЕСЕ", "СЕКТА", "РЕЛИГИОЗНАЯ ГРУППА", "РЕЛИГИОЗНОЕ ОБЪЕДИНЕНИЕ", "РЕЛИГИОЗНАЯ ОРГАНИЗАЦИЯ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1984(s, 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.RELIGION));
        }
        for (const s of ["ЦЕРКВА", "ХРАМ", "СОБОР", "МЕЧЕТЬ", "СИНАГОГА", "МОНАСТИР", "ЛАВРА", "ПАТРІАРХАТ", "МЕДРЕСЕ", "СЕКТА", "РЕЛІГІЙНА ГРУПА", "РЕЛІГІЙНЕ ОБЄДНАННЯ", " РЕЛІГІЙНА ОРГАНІЗАЦІЯ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1985(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.RELIGION));
        }
        for (const s of ["ФЕДЕРАЛЬНАЯ СЛУЖБА", "ГОСУДАРСТВЕННАЯ СЛУЖБА", "ФЕДЕРАЛЬНОЕ УПРАВЛЕНИЕ", "ГОСУДАРСТВЕННЫЙ КОМИТЕТ", "ГОСУДАРСТВЕННАЯ ИНСПЕКЦИЯ"]) {
            t = OrgItemTypeTermin._new1986(s, 3, OrgItemTypeTyp.ORG, true);
            OrgItemTypeToken.m_Global.add(t);
            t = OrgItemTypeTermin._new1987(s, 3, OrgItemTypeTyp.ORG, s);
            t.terms.splice(1, 0, Termin.Term._new1988(null, true));
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ФЕДЕРАЛЬНА СЛУЖБА", "ДЕРЖАВНА СЛУЖБА", "ФЕДЕРАЛЬНЕ УПРАВЛІННЯ", "ДЕРЖАВНИЙ КОМІТЕТ УКРАЇНИ", "ДЕРЖАВНА ІНСПЕКЦІЯ"]) {
            t = OrgItemTypeTermin._new1989(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
            OrgItemTypeToken.m_Global.add(t);
            t = OrgItemTypeTermin._new1990(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, s);
            t.terms.splice(1, 0, Termin.Term._new1988(null, true));
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new1962("СЛЕДСТВЕННЫЙ ИЗОЛЯТОР", 5, OrgItemTypeTyp.ORG, true);
        t.addVariant("СИЗО", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1877("СЛІДЧИЙ ІЗОЛЯТОР", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
        t.addVariant("СІЗО", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1962("КОЛОНИЯ-ПОСЕЛЕНИЕ", 3, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1877("КОЛОНІЯ-ПОСЕЛЕННЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1996("ТЮРЬМА", 3, OrgItemTypeTyp.ORG, true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1997("ВЯЗНИЦЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1962("КОЛОНИЯ", 2, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1877("КОЛОНІЯ", MorphLang.UA, 2, OrgItemTypeTyp.ORG, true));
        OrgItemTypeToken.m_Global.add((OrgItemTypeToken.m_IsprKolon = OrgItemTypeTermin._new2000("ИСПРАВИТЕЛЬНАЯ КОЛОНИЯ", 3, OrgItemTypeTyp.ORG, "ИК", true)));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1877("ВИПРАВНА КОЛОНІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true));
        for (const s of ["ПОЛИЦИЯ", "МИЛИЦИЯ"]) {
            t = OrgItemTypeTermin._new2002(s, OrgItemTypeTyp.ORG, 3, true, false);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ПОЛІЦІЯ", "МІЛІЦІЯ"]) {
            t = OrgItemTypeTermin._new2003(s, MorphLang.UA, OrgItemTypeTyp.ORG, 3, true, false);
            OrgItemTypeToken.m_Global.add(t);
        }
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2004("ПАЕВЫЙ ИНВЕСТИЦИОННЫЙ ФОНД", 2, OrgItemTypeTyp.ORG, "ПИФ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2005("РОССИЙСКОЕ ИНФОРМАЦИОННОЕ АГЕНТСТВО", 3, OrgItemTypeTyp.ORG, "РИА", OrgProfile.MEDIA));
        t = OrgItemTypeTermin._new2005("ИНФОРМАЦИОННОЕ АГЕНТСТВО", 3, OrgItemTypeTyp.ORG, "ИА", OrgProfile.MEDIA);
        t.addVariant("ИНФОРМАГЕНТСТВО", false);
        t.addVariant("ИНФОРМАГЕНСТВО", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2007("ОТДЕЛ", 1, OrgItemTypeTyp.DEP, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2008("ВІДДІЛ", MorphLang.UA, 1, OrgItemTypeTyp.DEP, true, true));
        t = OrgItemTypeTermin._new2009("РАЙОННЫЙ ОТДЕЛ", 2, "РО", OrgItemTypeTyp.DEP, true);
        t.addVariant("РАЙОТДЕЛ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2010("РАЙОННИЙ ВІДДІЛ", MorphLang.UA, 2, "РВ", OrgItemTypeTyp.DEP, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("ЦЕХ", 3, OrgItemTypeTyp.DEP, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("ФАКУЛЬТЕТ", 3, OrgItemTypeTyp.DEP, true);
        t.addAbridge("ФАК.");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("КАФЕДРА", 3, OrgItemTypeTyp.DEP, true);
        t.addAbridge("КАФ.");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("ЛАБОРАТОРИЯ", 1, OrgItemTypeTyp.DEP, true);
        t.addAbridge("ЛАБ.");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2015("ЛАБОРАТОРІЯ", MorphLang.UA, 1, OrgItemTypeTyp.DEP, true);
        t.addAbridge("ЛАБ.");
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ПАТРИАРХИЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ПАТРІАРХІЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ЕПАРХИЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("ЄПАРХІЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("МИТРОПОЛИЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1866("МИТРОПОЛІЯ", 3, OrgItemTypeTyp.DEP, true, OrgProfile.RELIGION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2022("ПРЕДСТАВИТЕЛЬСТВО", OrgItemTypeTyp.DEPADD));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2023("ПРЕДСТАВНИЦТВО", MorphLang.UA, OrgItemTypeTyp.DEPADD));
        t = OrgItemTypeTermin._new1941("ОТДЕЛЕНИЕ", OrgItemTypeTyp.DEPADD, true);
        t.addAbridge("ОТД.");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2025("ВІДДІЛЕННЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1941("ИНСПЕКЦИЯ", OrgItemTypeTyp.DEPADD, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2025("ІНСПЕКЦІЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2022("ФИЛИАЛ", OrgItemTypeTyp.DEPADD));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2023("ФІЛІЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD));
        t = OrgItemTypeTermin._new2030("ОФИС", OrgItemTypeTyp.DEPADD, true, true);
        t.addVariant("ОПЕРАЦИОННЫЙ ОФИС", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2031("ОФІС", MorphLang.UA, OrgItemTypeTyp.DEPADD, true, true);
        t.addVariant("ОПЕРАЦІЙНИЙ ОФІС", false);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ОТДЕЛ ПОЛИЦИИ", "ОТДЕЛ МИЛИЦИИ", "ОТДЕЛЕНИЕ ПОЛИЦИИ", "ОТДЕЛЕНИЕ МИЛИЦИИ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2032(s, OrgItemTypeTyp.DEP, 1.5, true, true));
            if (s.startsWith("ОТДЕЛ ")) {
                t = OrgItemTypeTermin._new2032("ГОРОДСКОЙ " + s, OrgItemTypeTyp.DEP, 3, true, true);
                t.addVariant("ГОР" + s, false);
                OrgItemTypeToken.m_Global.add(t);
                t = OrgItemTypeTermin._new2034("РАЙОННЫЙ " + s, "РО", OrgItemTypeTyp.DEP, 3, true, true);
                OrgItemTypeToken.m_Global.add(t);
            }
        }
        for (const s of ["ВІДДІЛ ПОЛІЦІЇ", "ВІДДІЛ МІЛІЦІЇ", "ВІДДІЛЕННЯ ПОЛІЦІЇ", "ВІДДІЛЕННЯ МІЛІЦІЇ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2035(s, MorphLang.UA, OrgItemTypeTyp.DEP, 1.5, true, true));
        }
        t = OrgItemTypeTermin._new2032("МЕЖМУНИЦИПАЛЬНЫЙ ОТДЕЛ", OrgItemTypeTyp.DEP, 1.5, true, true);
        OrgItemTypeToken.M_MEJMUN_OTDEL = t;
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ГЛАВНОЕ УПРАВЛЕНИЕ", "ГУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ЛИНЕЙНОЕ УПРАВЛЕНИЕ", "ЛУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("МЕЖМУНИЦИПАЛЬНОЕ УПРАВЛЕНИЕ", "МУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2040("ГОЛОВНЕ УПРАВЛІННЯ", MorphLang.UA, "ГУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ГЛАВНОЕ ТЕРРИТОРИАЛЬНОЕ УПРАВЛЕНИЕ", "ГТУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2040("ГОЛОВНЕ ТЕРИТОРІАЛЬНЕ УПРАВЛІННЯ", MorphLang.UA, "ГТУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2043("СЛЕДСТВЕННОЕ УПРАВЛЕНИЕ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2044("СЛІДЧЕ УПРАВЛІННЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ГЛАВНОЕ СЛЕДСТВЕННОЕ УПРАВЛЕНИЕ", "ГСУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2040("ГОЛОВНЕ СЛІДЧЕ УПРАВЛІННЯ", MorphLang.UA, "ГСУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ОПЕРАЦИОННОЕ УПРАВЛЕНИЕ", "ОПЕРУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2040("ОПЕРАЦІЙНЕ УПРАВЛІННЯ", MorphLang.UA, "ОПЕРУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2043("ТЕРРИТОРИАЛЬНОЕ УПРАВЛЕНИЕ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2044("ТЕРИТОРІАЛЬНЕ УПРАВЛІННЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("РЕГИОНАЛЬНОЕ УПРАВЛЕНИЕ", "РУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2040("РЕГІОНАЛЬНЕ УПРАВЛІННЯ", MorphLang.UA, "РУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1941("УПРАВЛЕНИЕ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2025("УПРАВЛІННЯ", MorphLang.UA, OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2037("ПОГРАНИЧНОЕ УПРАВЛЕНИЕ", "ПУ", OrgItemTypeTyp.DEPADD, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2056("ДЕЖУРНАЯ ЧАСТЬ", "ДЧ", OrgItemTypeTyp.DEPADD, true, OrgProfile.UNIT);
        t.addAbridge("Д/Ч");
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ПРЕСС-СЛУЖБА", "ПРЕСС-ЦЕНТР", "КОЛЛ-ЦЕНТР", "БУХГАЛТЕРИЯ", "МАГИСТРАТУРА", "АСПИРАНТУРА", "ДОКТОРАНТУРА", "ОРДИНАТУРА", "СОВЕТ ДИРЕКТОРОВ", "УЧЕНЫЙ СОВЕТ", "КОЛЛЕГИЯ", "НАБЛЮДАТЕЛЬНЫЙ СОВЕТ", "ОБЩЕСТВЕННЫЙ СОВЕТ", "ДИРЕКЦИЯ", "ЖЮРИ", "ПРЕЗИДИУМ", "СЕКРЕТАРИАТ", "СИНОД", "ПЛЕНУМ", "АППАРАТ", "PRESS CENTER", "CLIENT CENTER", "CALL CENTER", "ACCOUNTING", "MASTER DEGREE", "POSTGRADUATE", "DOCTORATE", "RESIDENCY", "BOARD OF DIRECTORS", "DIRECTOR BOARD", "ACADEMIC COUNCIL", "PLENARY", "SUPERVISORY BOARD", "PUBLIC COUNCIL", "LEADERSHIP", "JURY", "BUREAU", "SECRETARIAT"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2057(s, OrgItemTypeTyp.DEPADD, true, OrgProfile.UNIT));
        }
        for (const s of ["ПРЕС-СЛУЖБА", "ПРЕС-ЦЕНТР", "БУХГАЛТЕРІЯ", "МАГІСТРАТУРА", "АСПІРАНТУРА", "ДОКТОРАНТУРА", "ОРДИНАТУРА", "РАДА ДИРЕКТОРІВ", "ВЧЕНА РАДА", "КОЛЕГІЯ", "ПЛЕНУМ", "НАГЛЯДОВА РАДА", "ГРОМАДСЬКА РАДА", "ДИРЕКЦІЯ", "ЖУРІ", "ПРЕЗИДІЯ", "СЕКРЕТАРІАТ", "АПАРАТ"]) {
            OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2058(s, MorphLang.UA, OrgItemTypeTyp.DEPADD, true, OrgProfile.UNIT));
        }
        t = OrgItemTypeTermin._new2057("ОТДЕЛ ИНФОРМАЦИОННОЙ БЕЗОПАСНОСТИ", OrgItemTypeTyp.DEPADD, true, OrgProfile.UNIT);
        t.addVariant("ОТДЕЛ ИБ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2057("ОТДЕЛ ИНФОРМАЦИОННЫХ ТЕХНОЛОГИЙ", OrgItemTypeTyp.DEPADD, true, OrgProfile.UNIT);
        t.addVariant("ОТДЕЛ ИТ", false);
        t.addVariant("ОТДЕЛ IT", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new1941("СЕКТОР", OrgItemTypeTyp.DEP, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2062("КУРС", OrgItemTypeTyp.DEP, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2063("ГРУППА", OrgItemTypeTyp.DEP, true, true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2064("ГРУПА", MorphLang.UA, OrgItemTypeTyp.DEP, true, true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2057("ДНЕВНОЕ ОТДЕЛЕНИЕ", OrgItemTypeTyp.DEP, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2058("ДЕННЕ ВІДДІЛЕННЯ", MorphLang.UA, OrgItemTypeTyp.DEP, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2057("ВЕЧЕРНЕЕ ОТДЕЛЕНИЕ", OrgItemTypeTyp.DEP, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2058("ВЕЧІРНЄ ВІДДІЛЕННЯ", MorphLang.UA, OrgItemTypeTyp.DEP, true, OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2043("ДЕЖУРНАЯ ЧАСТЬ", OrgItemTypeTyp.DEP, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2044("ЧЕРГОВА ЧАСТИНА", MorphLang.UA, OrgItemTypeTyp.DEP, true));
        t = OrgItemTypeTermin._new2071("ПАСПОРТНЫЙ СТОЛ", OrgItemTypeTyp.DEP, true);
        t.addAbridge("П/С");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2072("ПАСПОРТНИЙ СТІЛ", MorphLang.UA, OrgItemTypeTyp.DEP, true);
        t.addAbridge("П/С");
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2073("ВЫСШЕЕ УЧЕБНОЕ ЗАВЕДЕНИЕ", OrgItemTypeTyp.PREFIX, OrgProfile.EDUCATION, "ВУЗ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2074("ВИЩИЙ НАВЧАЛЬНИЙ ЗАКЛАД", MorphLang.UA, OrgItemTypeTyp.PREFIX, OrgProfile.EDUCATION, "ВНЗ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2073("ВЫСШЕЕ ПРОФЕССИОНАЛЬНОЕ УЧИЛИЩЕ", OrgItemTypeTyp.PREFIX, OrgProfile.EDUCATION, "ВПУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2074("ВИЩЕ ПРОФЕСІЙНЕ УЧИЛИЩЕ", MorphLang.UA, OrgItemTypeTyp.PREFIX, OrgProfile.EDUCATION, "ВПУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2073("НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ", OrgItemTypeTyp.PREFIX, OrgProfile.SCIENCE, "НИИ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2074("НАУКОВО ДОСЛІДНИЙ ІНСТИТУТ", MorphLang.UA, OrgItemTypeTyp.PREFIX, OrgProfile.SCIENCE, "НДІ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2073("НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ И ПРОЕКТНЫЙ ИНСТИТУТ", OrgItemTypeTyp.PREFIX, OrgProfile.SCIENCE, "НИПИ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, "НИЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННЫЙ НАУЧНЫЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, "ГНЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАЦИОНАЛЬНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, "НИЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ДОСЛІДНИЙ ЦЕНТР", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НДЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ЦЕНТРАЛЬНЫЙ НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ", OrgItemTypeTyp.PREFIX, "ЦНИИ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ВСЕРОССИЙСКИЙ НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ", OrgItemTypeTyp.PREFIX, "ВНИИ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("РОССИЙСКИЙ НАУЧНО ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ", OrgItemTypeTyp.PREFIX, "РНИИ", OrgProfile.SCIENCE));
        t = OrgItemTypeTermin._new2087("ИННОВАЦИОННЫЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, OrgProfile.SCIENCE);
        t.addVariant("ИННОЦЕНТР", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ТЕХНИЧЕСКИЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, "НТЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ТЕХНІЧНИЙ ЦЕНТР", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НТЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ТЕХНИЧЕСКАЯ ФИРМА", OrgItemTypeTyp.PREFIX, "НТФ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ВИРОБНИЧА ФІРМА", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НВФ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ПРОИЗВОДСТВЕННОЕ ОБЪЕДИНЕНИЕ", OrgItemTypeTyp.PREFIX, "НПО", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ВИРОБНИЧЕ ОБЄДНАННЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НВО", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2087("НАУЧНО ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО-ВИРОБНИЧИЙ КООПЕРАТИВ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НВК", OrgProfile.SCIENCE));
        t = OrgItemTypeTermin._new2080("НАУЧНО ПРОИЗВОДСТВЕННАЯ КОРПОРАЦИЯ", OrgItemTypeTyp.PREFIX, "НПК", OrgProfile.SCIENCE);
        t.addVariant("НАУЧНО ПРОИЗВОДСТВЕННАЯ КОМПАНИЯ", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ТЕХНИЧЕСКИЙ КОМПЛЕКС", OrgItemTypeTyp.PREFIX, "НТК", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МЕЖОТРАСЛЕВОЙ НАУЧНО ТЕХНИЧЕСКИЙ КОМПЛЕКС", OrgItemTypeTyp.PREFIX, "МНТК", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ПРОИЗВОДСТВЕННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "НПП", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ВИРОБНИЧЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НВП", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ПРОИЗВОДСТВЕННЫЙ ЦЕНТР", OrgItemTypeTyp.PREFIX, "НПЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2083("НАУКОВО ВИРОБНИЧЕ ЦЕНТР", MorphLang.UA, OrgItemTypeTyp.PREFIX, "НВЦ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НАУЧНО ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "НПУП", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ИНДИВИДУАЛЬНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ИП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ПРИВАТНЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ПП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧПУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ИНДИВИДУАЛЬНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧИП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ОХРАННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧОП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНАЯ ОХРАННАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, "ЧОО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ТРАНСПОРТНОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧТУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ЧАСТНОЕ ТРАНСПОРТНО ЭКСПЛУАТАЦИОННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ЧТЭУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("НАУЧНО ПРОИЗВОДСТВЕННОЕ КОРПОРАЦИЯ", OrgItemTypeTyp.PREFIX, "НПК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ФГУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ГОСУДАРСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ГУП"));
        t = OrgItemTypeTermin._new2104("ГОСУДАРСТВЕННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ГП");
        t.addVariant("ГОСПРЕДПРИЯТИЕ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2106("ДЕРЖАВНЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ДП");
        t.addVariant("ДЕРЖПІДПРИЄМСТВО", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ НАУЧНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГНУ", OrgProfile.SCIENCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГКУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ КАЗЕННОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГКОУ"));
        t = OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГБУ");
        t.addVariant("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ НАУКИ", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ВОЕННО ПРОМЫШЛЕННАЯ КОРПОРАЦИЯ", OrgItemTypeTyp.PREFIX, "ВПК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ЧАСТНАЯ ВОЕННАЯ КОМПАНИЯ", OrgItemTypeTyp.PREFIX, "ЧВК", OrgProfile.ARMY));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФБУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "ФУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ФЕДЕРАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФКУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ НЕКОММЕРЧЕСКОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МНУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МБУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МАУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МКУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "МУП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ УНИТАРНОЕ ПРОИЗВОДСТВЕННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "МУПП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ КАЗЕННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "МКП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("МУНИЦИПАЛЬНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, "МП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("НЕБАНКОВСКАЯ КРЕДИТНАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, "НКО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("РАСЧЕТНАЯ НЕБАНКОВСКАЯ КРЕДИТНАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, "РНКО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГБУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ГОСУДАРСТВЕННОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГКУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГАУ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2022("МАЛОЕ ИННОВАЦИОННОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("НЕГОСУДАРСТВЕННЫЙ ПЕНСИОННЫЙ ФОНД", OrgItemTypeTyp.PREFIX, "НПФ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2022("ЧАСТНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ДЕРЖАВНА АКЦІОНЕРНА КОМПАНІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ДАК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ДЕРЖАВНА КОМПАНІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ДК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("КОЛЕКТИВНЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "КП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("КОЛЕКТИВНЕ МАЛЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "КМП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ВИРОБНИЧА ФІРМА", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ВФ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ВИРОБНИЧЕ ОБЄДНАННЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ВО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ВИРОБНИЧЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ВП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ВИРОБНИЧИЙ КООПЕРАТИВ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ВК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("СТРАХОВА КОМПАНІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "СК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2106("ТВОРЧЕ ОБЄДНАННЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ТО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ФГУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ФКУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГАУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ОБЛАСТНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ОГАУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ФГБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ФБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ОБЛАСТНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ОГБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ ОБЛАСТНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГОБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГКУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ ОБЛАСТНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "ГОКУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "МУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НЕГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "НУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "МБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "МКУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ ОБЛАСТНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "МОБУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ ЗДРАВООХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "МАУЗ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2087("ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ФГУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ФКУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ГАУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ГБУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ ОБЛАСТНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ГОБУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ГКУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ ОБЛАСТНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ГОКУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "МУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("НЕГОСУДАРСТВЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "НУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "МБУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ КАЗЕННОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "МКУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ ОБЛАСТНОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "МОБУК", OrgProfile.CULTURE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "МАУК", OrgProfile.CULTURE));
        t = OrgItemTypeTermin._new2104("ЧАСТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ", OrgItemTypeTyp.PREFIX, "ЧУК");
        t.addVariant("ЧАСТНОЕ УЧРЕЖДЕНИЕ КУЛЬТУРЫ ЛФП", false);
        t.addVariant("ЧУК ЛФП", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ОБРАЗОВАНИЯ", OrgItemTypeTyp.PREFIX, "ГБУО", OrgProfile.EDUCATION));
        t = OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ ПРОФЕССИОНАЛЬНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГБПОУ", OrgProfile.EDUCATION);
        t.addVariant("ГБ ПОУ", true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ ОБЩЕОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГБОУ", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ДОПОЛНИТЕЛЬНОГО ОБРАЗОВАНИЯ", OrgItemTypeTyp.PREFIX, "ГБУДО", OrgProfile.EDUCATION));
        t = OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГАОУ", OrgProfile.EDUCATION);
        t.addVariant("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ", false);
        t.addVariant("ФГАОУ ВО", true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ЧАСТНОЕ УЧРЕЖДЕНИЕ ДОПОЛНИТЕЛЬНОГО ОБРАЗОВАНИЯ", OrgItemTypeTyp.PREFIX, "ЧУДО", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ЧАСТНОЕ УЧРЕЖДЕНИЕ ДОПОЛНИТЕЛЬНОГО ПРОФЕССИОНАЛЬНОГО ОБРАЗОВАНИЯ", OrgItemTypeTyp.PREFIX, "ЧУДПО", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МОУ", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ КАЗЕННОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МКОУ", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ АВТОНОМНОЕ ОБЩЕОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МАОУ", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, "АНО", OrgProfile.EDUCATION));
        t = OrgItemTypeTermin._new2080("АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ ДОПОЛНИТЕЛЬНОГО ПРОФЕССИОНАЛЬНОГО ОБРАЗОВАНИЯ", OrgItemTypeTyp.PREFIX, "АНОДПО", OrgProfile.EDUCATION);
        t.addVariant("АНО ДПО", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("МУНИЦИПАЛЬНОЕ ЛЕЧЕБНО ПРОФИЛАКТИЧЕСКОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "МЛПУ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ КАЗЕННОЕ ЛЕЧЕБНО ПРОФИЛАКТИЧЕСКОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФКЛПУ", OrgProfile.MEDICINE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГОУ", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ГБОУ", OrgProfile.EDUCATION));
        t = OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГБОУ", OrgProfile.EDUCATION);
        t.addVariant("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2080("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ", OrgItemTypeTyp.PREFIX, "ФГАОУ", OrgProfile.EDUCATION);
        t.addVariant("ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ВЫСШЕЕ ПРОФЕССИОНАЛЬНОЕ ОБРАЗОВАНИЕ", OrgItemTypeTyp.PREFIX, "ВПО", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2080("ДОПОЛНИТЕЛЬНОЕ ПРОФЕССИОНАЛЬНОЕ ОБРАЗОВАНИЕ", OrgItemTypeTyp.PREFIX, "ДПО", OrgProfile.EDUCATION));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2208("ДЕПАРТАМЕНТ ЕДИНОГО ЗАКАЗЧИКА", OrgItemTypeTyp.PREFIX, "ДЕЗ", true, true));
        t = OrgItemTypeTermin._new2209("СОЮЗ АРБИТРАЖНЫХ УПРАВЛЯЮЩИХ", OrgItemTypeTyp.PREFIX, "САУ", true);
        t.addVariant("САМОРЕГУЛИРУЕМАЯ ОРГАНИЗАЦИЯ АРБИТРАЖНЫХ УПРАВЛЯЮЩИХ", false);
        t.addVariant("СОАУ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2209("ОПЫТНО ПРОИЗВОДСТВЕННОЕ ХОЗЯЙСТВО", OrgItemTypeTyp.PREFIX, "ОПХ", true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2209("ОРГАНИЗАЦИЯ НАУЧНОГО ОБСЛУЖИВАНИЯ", OrgItemTypeTyp.PREFIX, "ОНО", true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "АО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АТ"));
        OrgItemTypeToken.m_Global.add((OrgItemTypeToken.m_SovmPred = OrgItemTypeTermin._new2212("СОВМЕСТНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, true, "СП")));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("СПІЛЬНЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "СП"));
        OrgItemTypeToken.m_Global.add((OrgItemTypeToken.m_AkcionComp = OrgItemTypeTermin._new2216("АКЦИОНЕРНАЯ КОМПАНИЯ", OrgItemTypeTyp.PREFIX, true)));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2209("УПРАВЛЯЮЩАЯ КОМПАНИЯ", OrgItemTypeTyp.PREFIX, "УК", true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ЗАКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "ЗАО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ОБЩЕСТВО ОТКРЫТОГО ТИПА", OrgItemTypeTyp.PREFIX, true, "ООТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ОБЩЕСТВО С ДОПОЛНИТЕЛЬНОЙ ОТВЕТСТВЕННОСТЬЮ", OrgItemTypeTyp.PREFIX, true, "ОДО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2221("РОССИЙСКОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "РАО", "PAO"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("РОССИЙСКОЕ ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "РОАО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("АКЦИОНЕРНОЕ ОБЩЕСТВО ЗАКРЫТОГО ТИПА", OrgItemTypeTyp.PREFIX, true, "АОЗТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("АКЦІОНЕРНЕ ТОВАРИСТВО ЗАКРИТОГО ТИПУ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АТЗТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("АКЦИОНЕРНОЕ ОБЩЕСТВО ОТКРЫТОГО ТИПА", OrgItemTypeTyp.PREFIX, true, "АООТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("АКЦІОНЕРНЕ ТОВАРИСТВО ВІДКРИТОГО ТИПУ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АТВТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ОБЩЕСТВЕННАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, true, "ОО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("ГРОМАДСЬКА ОРГАНІЗАЦІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ГО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, true, "АНО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("АВТОНОМНА НЕКОМЕРЦІЙНА ОРГАНІЗАЦІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АНО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2221("ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "ОАО", "OAO"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ВІДКРИТЕ АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ВАТ", "ВАТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2221("ЧАСТНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "ЧАО", "ЧAO"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ОТКРЫТОЕ СТРАХОВОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "ОСАО"));
        t = OrgItemTypeTermin._new2221("ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ", OrgItemTypeTyp.PREFIX, true, "ООО", "OOO");
        t.addVariant("ОБЩЕСТВО C ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ТОВ", "ТОВ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ТОВАРИСТВО З ПОВНОЮ ВІДПОВІДАЛЬНІСТЮ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ТПВ", "ТПВ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ТЗОВ", "ТЗОВ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ТОВАРИСТВО З ДОДАТКОВОЮ ВІДПОВІДАЛЬНІСТЮ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ТДВ", "ТДВ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2216("ЧАСТНОЕ АКЦИОНЕРНОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ПРИВАТНЕ АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ПРАТ", "ПРАТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2216("ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ПУБЛІЧНЕ АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ПАТ", "ПАТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2216("ЗАКРЫТОЕ АКЦИОНЕРНОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ЗАКРИТЕ АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ЗАТ", "ЗАТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2216("ОТКРЫТОЕ АКЦИОНЕРНОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2232("ВІДКРИТЕ АКЦІОНЕРНЕ ТОВАРИСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ВАТ", "ВАТ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "ПАО"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("СТРАХОВОЕ ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО", OrgItemTypeTyp.PREFIX, true, "СПАО"));
        t = OrgItemTypeTermin._new2250("БЛАГОТВОРИТЕЛЬНАЯ ОБЩЕСТВЕННАЯ ОРГАНИЗАЦИЯ", OrgItemTypeTyp.PREFIX, "БОО", "БОО");
        t.addVariant("ОБЩЕСТВЕННАЯ БЛАГОТВОРИТЕЛЬНАЯ ОРГАНИЗАЦИЯ", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2250("ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ", OrgItemTypeTyp.PREFIX, "ТОО", "TOO"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2104("ПРЕДПРИНИМАТЕЛЬ БЕЗ ОБРАЗОВАНИЯ ЮРИДИЧЕСКОГО ЛИЦА", OrgItemTypeTyp.PREFIX, "ПБОЮЛ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2253("АКЦИОНЕРНЫЙ КОММЕРЧЕСКИЙ БАНК", OrgItemTypeTyp.PREFIX, true, "АКБ", OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2254("АКЦІОНЕРНИЙ КОМЕРЦІЙНИЙ БАНК", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АКБ", OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2253("АКЦИОНЕРНЫЙ БАНК", OrgItemTypeTyp.PREFIX, true, "АБ", OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2254("АКЦІОНЕРНИЙ БАНК", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АБ", OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2257("КОММЕРЧЕСКИЙ БАНК", OrgItemTypeTyp.PREFIX, true, OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2258("КОМЕРЦІЙНИЙ БАНК", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, OrgProfile.FINANCE));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2216("КОНСТРУКТОРСКОЕ БЮРО", OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2260("КОНСТРУКТОРСЬКЕ БЮРО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ОПЫТНО КОНСТРУКТОРСКОЕ БЮРО", OrgItemTypeTyp.PREFIX, true, "ОКБ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("ДОСЛІДНО КОНСТРУКТОРСЬКЕ БЮРО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ДКБ"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2209("СПЕЦИАЛЬНОЕ КОНСТРУКТОРСКОЕ БЮРО", OrgItemTypeTyp.PREFIX, "СКБ", true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2264("СПЕЦІАЛЬНЕ КОНСТРУКТОРСЬКЕ БЮРО", MorphLang.UA, OrgItemTypeTyp.PREFIX, "СКБ", true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("АКЦИОНЕРНАЯ СТРАХОВАЯ КОМПАНИЯ", OrgItemTypeTyp.PREFIX, true, "АСК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("АКЦІОНЕРНА СТРАХОВА КОМПАНІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "АСК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("РЕКЛАМНО ПРОИЗВОДСТВЕННАЯ КОМПАНИЯ", OrgItemTypeTyp.PREFIX, true, "РПК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2268("АВТОТРАНСПОРТНОЕ ПРЕДПРИЯТИЕ", OrgItemTypeTyp.PREFIX, true, true, "АТП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2269("АВТОТРАНСПОРТНЕ ПІДПРИЄМСТВО", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, true, "АТП"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2212("ТЕЛЕРАДИОКОМПАНИЯ", OrgItemTypeTyp.PREFIX, true, "ТРК"));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2213("ТЕЛЕРАДІОКОМПАНІЯ", MorphLang.UA, OrgItemTypeTyp.PREFIX, true, "ТРК"));
        t = OrgItemTypeTermin._new2209("ОРГАНИЗОВАННАЯ ПРЕСТУПНАЯ ГРУППИРОВКА", OrgItemTypeTyp.PREFIX, "ОПГ", true);
        t.addVariant("ОРГАНИЗОВАННАЯ ПРЕСТУПНАЯ ГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2209("ОРГАНИЗОВАННОЕ ПРЕСТУПНОЕ СООБЩЕСТВО", OrgItemTypeTyp.PREFIX, "ОПС", true);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ПОДРОСТКОВО МОЛОДЕЖНЫЙ КЛУБ", OrgItemTypeTyp.PREFIX, "ПМК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("СКЛАД ВРЕМЕННОГО ХРАНЕНИЯ", OrgItemTypeTyp.PREFIX, "СВХ", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ЖИЛИЩНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ЖСК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ГАРАЖНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ГСК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ГАРАЖНО ЭКСПЛУАТАЦИОННЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ГЭК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ГАРАЖНО ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ГПК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ПГСК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ГАРАЖНЫЙ СТРОИТЕЛЬНО ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ГСПК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ДАЧНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ДСК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНЫЙ КООПЕРАТИВ", OrgItemTypeTyp.PREFIX, "ПГК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ИНДИВИДУАЛЬНОЕ ЖИЛИЩНОЕ СТРОИТЕЛЬСТВО", OrgItemTypeTyp.PREFIX, "ИЖС", true, true));
        t = OrgItemTypeTermin._new2274("САДОВОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, "СНТ", true, true);
        t.addAbridge("САДОВОЕ НЕКОМ-Е ТОВАРИЩЕСТВО");
        t.addVariant("СНТ ПМК", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2274("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", OrgItemTypeTyp.PREFIX, "ДНТ", true, true);
        t.addAbridge("ДАЧНОЕ НЕКОМ-Е ТОВАРИЩЕСТВО");
        t.addVariant("ДНТ ПМК", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2274("ПРЕДПРИЯТИЕ ПОТРЕБИТЕЛЬСКОЙ КООПЕРАЦИИ", OrgItemTypeTyp.PREFIX, "ППК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2288("ПІДПРИЄМСТВО СПОЖИВЧОЇ КООПЕРАЦІЇ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ПСК", true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2289("ФІЗИЧНА ОСОБА ПІДПРИЄМЕЦЬ", MorphLang.UA, OrgItemTypeTyp.PREFIX, "ФОП", true, true));
        t = OrgItemTypeTermin._new2290("ЖЕЛЕЗНАЯ ДОРОГА", OrgItemTypeTyp.ORG, OrgProfile.TRANSPORT, true, 3);
        t.addVariant("ЖЕЛЕЗНОДОРОЖНАЯ МАГИСТРАЛЬ", false);
        t.addAbridge("Ж.Д.");
        t.addAbridge("Ж/Д");
        t.addAbridge("ЖЕЛ.ДОР.");
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ЗАВОД", "ФАБРИКА", "БАНК", "КОМБИНАТ", "МЯСОКОМБИНАТ", "БАНКОВСКАЯ ГРУППА", "БИРЖА", "ФОНДОВАЯ БИРЖА", "FACTORY", "MANUFACTORY", "BANK"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2291(s, 3.5, OrgItemTypeTyp.ORG, true, true)));
            if (s === "БАНК" || s === "BANK" || s.endsWith("БИРЖА")) {
                t.profile = OrgProfile.FINANCE;
                t.coeff = 2;
                t.canHasLatinName = true;
                if (OrgItemTypeToken.m_Bank === null) 
                    OrgItemTypeToken.m_Bank = t;
            }
        }
        t = OrgItemTypeTermin._new2292("КРИТПОВАЛЮТНАЯ БИРЖА", 3.5, OrgItemTypeTyp.ORG, OrgProfile.FINANCE, true, true);
        t.addVariant("КРИПТОБИРЖА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2293("КРИПТОВАЛЮТНАЯ БІРЖА", MorphLang.UA, 3.5, OrgItemTypeTyp.ORG, OrgProfile.FINANCE, true, true);
        t.addVariant("КРИПТОБІРЖА", false);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ЗАВОД", "ФАБРИКА", "БАНК", "КОМБІНАТ", "БАНКІВСЬКА ГРУПА", "БІРЖА", "ФОНДОВА БІРЖА"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2294(s, MorphLang.UA, 3.5, OrgItemTypeTyp.ORG, true, true)));
            if (s === "БАНК" || s.endsWith("БІРЖА")) {
                t.coeff = 2;
                t.canHasLatinName = true;
                if (OrgItemTypeToken.m_Bank === null) 
                    OrgItemTypeToken.m_Bank = t;
            }
        }
        for (const s of ["ТУРФИРМА", "ТУРАГЕНТСТВО", "ТУРКОМПАНИЯ", "АВИАКОМПАНИЯ", "КИНОСТУДИЯ", "КООПЕРАТИВ", "РИТЕЙЛЕР", "ОНЛАЙН РИТЕЙЛЕР", "МЕДИАГИГАНТ", "МЕДИАКОМПАНИЯ", "МЕДИАХОЛДИНГ"]) {
            t = OrgItemTypeTermin._new2295(s, 3.5, OrgItemTypeTyp.ORG, true, true, true);
            if (s.startsWith("МЕДИА")) 
                t.profiles.push(OrgProfile.MEDIA);
            if (s.includes("РИТЕЙЛЕР")) 
                t.addVariant(Utils.replaceString(s, "РИТЕЙЛЕР", "РЕТЕЙЛЕР"), false);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ТУРФІРМА", "ТУРАГЕНТСТВО", "ТУРКОМПАНІЯ", "АВІАКОМПАНІЯ", "КІНОСТУДІЯ", "КООПЕРАТИВ", "РІТЕЙЛЕР", "ОНЛАЙН-РІТЕЙЛЕР", "МЕДІАГІГАНТ", "МЕДІАКОМПАНІЯ", "МЕДІАХОЛДИНГ"]) {
            t = OrgItemTypeTermin._new2296(s, MorphLang.UA, 3.5, OrgItemTypeTyp.ORG, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ТУРОПЕРАТОР"]) {
            t = OrgItemTypeTermin._new2295(s, 0.5, OrgItemTypeTyp.ORG, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ТУРОПЕРАТОР"]) {
            t = OrgItemTypeTermin._new2296(s, MorphLang.UA, 0.5, OrgItemTypeTyp.ORG, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        OrgItemTypeToken.m_SberBank = (t = OrgItemTypeTermin._new2299("СБЕРЕГАТЕЛЬНЫЙ БАНК", 4, OrgItemTypeTyp.ORG, true, OrgProfile.FINANCE));
        t.addVariant("СБЕРБАНК", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_SecServ = (t = OrgItemTypeTermin._new2299("СЛУЖБА БЕЗОПАСНОСТИ", 4, OrgItemTypeTyp.ORG, true, OrgProfile.STATE));
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2301("ОЩАДНИЙ БАНК", MorphLang.UA, 4, OrgItemTypeTyp.ORG, true, OrgProfile.FINANCE);
        t.addVariant("ОЩАДБАНК", false);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ОРГАНИЗАЦИЯ", "ПРЕДПРИЯТИЕ", "КОМИТЕТ", "КОМИССИЯ", "ПРОИЗВОДИТЕЛЬ", "ГИГАНТ", "ORGANIZATION", "ENTERPRISE", "COMMITTEE", "COMMISSION", "MANUFACTURER"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2302(s, OrgItemTypeTyp.ORG, true, true, true)));
        }
        for (const s of ["ОБЩЕСТВО", "АССАМБЛЕЯ", "СЛУЖБА", "ОБЪЕДИНЕНИЕ", "ФЕДЕРАЦИЯ", "COMPANY", "ASSEMBLY", "SERVICE", "UNION", "FEDERATION"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2302(s, OrgItemTypeTyp.ORG, true, true, true)));
            if (s === "СЛУЖБА") 
                t.canHasNumber = true;
        }
        for (const s of ["СООБЩЕСТВО", "ФОНД", "АССОЦИАЦИЯ", "АЛЬЯНС", "ГИЛЬДИЯ", "ОБЩИНА", "ОБЩЕСТВЕННОЕ ОБЪЕДИНЕНИЕ", "ОБЩЕСТВЕННАЯ ОРГАНИЗАЦИЯ", "ОБЩЕСТВЕННОЕ ФОРМИРОВАНИЕ", "СОЮЗ", "КЛУБ", "ГРУППИРОВКА", "ЛИГА", "COMMUNITY", "FOUNDATION", "ASSOCIATION", "ALLIANCE", "GUILD", "UNION", "CLUB", "GROUP", "LEAGUE"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2304(s, 3, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.UNION)));
        }
        for (const s of ["ПАРТИЯ", "ДВИЖЕНИЕ", "PARTY", "MOVEMENT"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2305(s, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.UNION)));
        }
        for (const s of ["НОЧНОЙ КЛУБ", "NIGHTCLUB"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2306(s, OrgItemTypeTyp.ORG, true, true, OrgProfile.MUSIC)));
        }
        for (const s of ["ОРГАНІЗАЦІЯ", "ПІДПРИЄМСТВО", "КОМІТЕТ", "КОМІСІЯ", "ВИРОБНИК", "ГІГАНТ", "СУСПІЛЬСТВО", "СПІЛЬНОТА", "ФОНД", "СЛУЖБА", "АСОЦІАЦІЯ", "АЛЬЯНС", "АСАМБЛЕЯ", "ГІЛЬДІЯ", "ОБЄДНАННЯ", "СОЮЗ", "ПАРТІЯ", "РУХ", "ФЕДЕРАЦІЯ", "КЛУБ", "ГРУПУВАННЯ"]) {
            OrgItemTypeToken.m_Global.add((t = OrgItemTypeTermin._new2307(s, MorphLang.UA, OrgItemTypeTyp.ORG, true, true, true)));
        }
        t = OrgItemTypeTermin._new2308("ДЕПУТАТСКАЯ ГРУППА", OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("ГРУППА ДЕПУТАТОВ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2309("ДЕПУТАТСЬКА ГРУПА", MorphLang.UA, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("ГРУПА ДЕПУТАТІВ", false);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ФОНД", "СОЮЗ", "ОБЪЕДИНЕНИЕ", "ОРГАНИЗАЦИЯ", "ФЕДЕРАЦИЯ", "ДВИЖЕНИЕ"]) {
            for (const ss of ["ВСЕМИРНЫЙ", "МЕЖДУНАРОДНЫЙ", "ВСЕРОССИЙСКИЙ", "ОБЩЕСТВЕННЫЙ", "НЕКОММЕРЧЕСКИЙ", "ЕВРОПЕЙСКИЙ", "ВСЕУКРАИНСКИЙ"]) {
                t = OrgItemTypeTermin._new2291((ss + " " + s), 3.5, OrgItemTypeTyp.ORG, true, true);
                if (s === "ОБЪЕДИНЕНИЕ" || s === "ДВИЖЕНИЕ") 
                    t.canonicText = (ss.substring(0, 0 + ss.length - 2) + "ОЕ " + s);
                else if (s === "ОРГАНИЗАЦИЯ" || s === "ФЕДЕРАЦИЯ") {
                    t.canonicText = (ss.substring(0, 0 + ss.length - 2) + "АЯ " + s);
                    t.coeff = 3;
                }
                OrgItemTypeToken.m_Global.add(t);
            }
        }
        for (const s of ["ФОНД", "СОЮЗ", "ОБЄДНАННЯ", "ОРГАНІЗАЦІЯ", "ФЕДЕРАЦІЯ", "РУХ"]) {
            for (const ss of ["СВІТОВИЙ", "МІЖНАРОДНИЙ", "ВСЕРОСІЙСЬКИЙ", "ГРОМАДСЬКИЙ", "НЕКОМЕРЦІЙНИЙ", "ЄВРОПЕЙСЬКИЙ", "ВСЕУКРАЇНСЬКИЙ"]) {
                t = OrgItemTypeTermin._new2294((ss + " " + s), MorphLang.UA, 3.5, OrgItemTypeTyp.ORG, true, true);
                let bi = null;
                try {
                    bi = MorphologyService.getWordBaseInfo(s, MorphLang.UA, false, false);
                } catch (ex2312) {
                }
                if (bi !== null && bi.gender !== MorphGender.MASCULINE) {
                    let adj = null;
                    try {
                        adj = MorphologyService.getWordform(ss, MorphBaseInfo._new795(MorphClass.ADJECTIVE, bi.gender, MorphNumber.SINGULAR, MorphLang.UA));
                        if (adj !== null) 
                            t.canonicText = (adj + " " + s);
                    } catch (ex2314) {
                    }
                }
                if (s === "ОРГАНІЗАЦІЯ" || s === "ФЕДЕРАЦІЯ") 
                    t.coeff = 3;
                OrgItemTypeToken.m_Global.add(t);
            }
        }
        t = OrgItemTypeTermin._new2291("ИНВЕСТИЦИОННЫЙ ФОНД", 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ИНВЕСТФОНД", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2294("ІНВЕСТИЦІЙНИЙ ФОНД", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ІНВЕСТФОНД", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2291("СОЦИАЛЬНАЯ СЕТЬ", 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("СОЦСЕТЬ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2294("СОЦІАЛЬНА МЕРЕЖА", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("СОЦМЕРЕЖА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2291("ОФФШОРНАЯ КОМПАНИЯ", 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ОФФШОР", false);
        t.addVariant("ОФШОР", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2294("ОФШОРНА КОМПАНІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true);
        t.addVariant("ОФШОР", false);
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2321("ТЕРРОРИСТИЧЕСКАЯ ОРГАНИЗАЦИЯ", 3, OrgItemTypeTyp.ORG, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2322("ТЕРОРИСТИЧНА ОРГАНІЗАЦІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2323("АТОМНАЯ ЭЛЕКТРОСТАНЦИЯ", 3, OrgItemTypeTyp.ORG, "АЭС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2324("АТОМНА ЕЛЕКТРОСТАНЦІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, "АЕС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2323("ГИДРОЭЛЕКТРОСТАНЦИЯ", 3, OrgItemTypeTyp.ORG, "ГЭС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2324("ГІДРОЕЛЕКТРОСТАНЦІЯ", MorphLang.UA, 3, OrgItemTypeTyp.ORG, "ГЕС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2323("ГИДРОРЕЦИРКУЛЯЦИОННАЯ ЭЛЕКТРОСТАНЦИЯ", 3, OrgItemTypeTyp.ORG, "ГРЭС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2323("ТЕПЛОВАЯ ЭЛЕКТРОСТАНЦИЯ", 3, OrgItemTypeTyp.ORG, "ТЭС", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2323("НЕФТЕПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", 3, OrgItemTypeTyp.ORG, "НПЗ", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2324("НАФТОПЕРЕРОБНИЙ ЗАВОД", MorphLang.UA, 3, OrgItemTypeTyp.ORG, "НПЗ", true, true, true));
        for (const s of ["ФИРМА", "КОМПАНИЯ", "КОРПОРАЦИЯ", "ГОСКОРПОРАЦИЯ", "КОНЦЕРН", "КОНСОРЦИУМ", "ХОЛДИНГ", "МЕДИАХОЛДИНГ", "ТОРГОВЫЙ ДОМ", "ТОРГОВЫЙ ЦЕНТР", "ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ ЦЕНТР", "УЧЕБНЫЙ ЦЕНТР", "ИССЛЕДОВАТЕЛЬСКИЙ ЦЕНТР", "КОСМИЧЕСКИЙ ЦЕНТР", "ДЕЛОВОЙ ЦЕНТР", "БИЗНЕС ЦЕНТР", "БИЗНЕС ПАРК", "АУКЦИОННЫЙ ДОМ", "ИЗДАТЕЛЬСТВО", "ИЗДАТЕЛЬСКИЙ ДОМ", "ТОРГОВЫЙ КОМПЛЕКС", "ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ КОМПЛЕКС", "ТОРГОВО ОФИСНЫЙ КОМПЛЕКС", "ТОРГОВО ОФИСНЫЙ ЦЕНТР", "СПОРТИВНЫЙ КОМПЛЕКС", "СПОРТИВНО РАЗВЛЕКАТЕЛЬНЫЙ КОМПЛЕКС", "СПОРТИВНО ОЗДОРОВИТЕЛЬНЫЙ КОМПЛЕКС", "ФИЗКУЛЬТУРНО ОЗДОРОВИТЕЛЬНЫЙ КОМПЛЕКС", "АГЕНТСТВО НЕДВИЖИМОСТИ", "ГРУППА КОМПАНИЙ", "МЕДИАГРУППА", "МАГАЗИН", "ТОРГОВЫЙ КОМПЛЕКС", "ГИПЕРМАРКЕТ", "СУПЕРМАРКЕТ", "КАФЕ", "РЕСТОРАН", "БАР", "ТРАКТИР", "ТАВЕРНА", "СТОЛОВАЯ", "АУКЦИОН", "АНАЛИТИЧЕСКИЙ ЦЕНТР", "COMPANY", "CORPORATION"]) {
            t = OrgItemTypeTermin._new2331(s, 3, OrgItemTypeTyp.ORG, true, true, true);
            if (s === "ИЗДАТЕЛЬСТВО") {
                t.addAbridge("ИЗД-ВО");
                t.addAbridge("ИЗ-ВО");
                t.profiles.push(OrgProfile.MEDIA);
                t.profiles.push(OrgProfile.PRESS);
                t.addVariant("ИЗДАТЕЛЬСКИЙ ДОМ", false);
            }
            else if (s.startsWith("ИЗДАТ")) {
                t.profiles.push(OrgProfile.PRESS);
                t.profiles.push(OrgProfile.MEDIA);
            }
            else if (s === "ТОРГОВЫЙ ДОМ") 
                t.acronym = "ТД";
            else if (s === "ТОРГОВЫЙ ЦЕНТР") 
                t.acronym = "ТЦ";
            else if (s === "ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ ЦЕНТР") 
                t.acronym = "ТРЦ";
            else if (s === "ТОРГОВО ОФИСНЫЙ КОМПЛЕКС") 
                t.acronym = "ТОК";
            else if (s === "ТОРГОВО ОФИСНЫЙ ЦЕНТР") 
                t.acronym = "ТОЦ";
            else if (s === "БИЗНЕС ЦЕНТР") 
                t.acronym = "БЦ";
            else if (s === "ТОРГОВЫЙ КОМПЛЕКС") 
                t.acronym = "ТК";
            else if (s === "СПОРТИВНЫЙ КОМПЛЕКС") 
                t.addVariant("СПОРТКОМПЛЕКС", false);
            else if (s === "ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ КОМПЛЕКС") 
                t.acronym = "ТРК";
            else if (s === "ГРУППА КОМПАНИЙ") 
                t.acronym = "ГК";
            else if (s === "СТОЛОВАЯ") 
                t.canHasNumber = true;
            if (s.startsWith("МЕДИА")) 
                t.profiles.push(OrgProfile.MEDIA);
            if (s.endsWith(" ЦЕНТР")) 
                t.coeff = 3.5;
            if (s === "КОМПАНИЯ" || s === "ФИРМА") 
                t.coeff = 1;
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ФІРМА", "КОМПАНІЯ", "КОРПОРАЦІЯ", "ДЕРЖКОРПОРАЦІЯ", "КОНЦЕРН", "КОНСОРЦІУМ", "ХОЛДИНГ", "МЕДІАХОЛДИНГ", "ТОРГОВИЙ ДІМ", "ТОРГОВИЙ ЦЕНТР", "ТОРГОВО РОЗВАЖАЛЬНИЙ ЦЕНТР", "НАВЧАЛЬНИЙ ЦЕНТР", "ДІЛОВИЙ ЦЕНТР", " БІЗНЕС ЦЕНТР", "ВИДАВНИЦТВО", "ВИДАВНИЧИЙ ДІМ", "ТОРГОВИЙ КОМПЛЕКС", "ТОРГОВО РОЗВАЖАЛЬНИЙ КОМПЛЕКС", "СПОРТИВНИЙ КОМПЛЕКС", "СПОРТИВНО РОЗВАЖАЛЬНИЙ КОМПЛЕКС", "СПОРТИВНО ОЗДОРОВЧИЙ КОМПЛЕКС", "ФІЗКУЛЬТУРНО ОЗДОРОВЧИЙ КОМПЛЕКС", "АГЕНТСТВО НЕРУХОМОСТІ", "ГРУПА КОМПАНІЙ", "МЕДІАГРУПА", "МАГАЗИН", "ТОРГОВИЙ КОМПЛЕКС", "ГІПЕРМАРКЕТ", "СУПЕРМАРКЕТ", "КАФЕ", "БАР", "АУКЦІОН", "АНАЛІТИЧНИЙ ЦЕНТР"]) {
            t = OrgItemTypeTermin._new2332(s, MorphLang.UA, OrgItemTypeTyp.ORG, true, true, true);
            if (s === "ВИДАВНИЦТВО") {
                t.addAbridge("ВИД-ВО");
                t.addVariant("ВИДАВНИЧИЙ ДІМ", false);
            }
            else if (s === "ТОРГОВИЙ ДІМ") 
                t.acronym = "ТД";
            else if (s === "ТОРГОВИЙ ЦЕНТР") 
                t.acronym = "ТЦ";
            else if (s === "ТОРГОВО РОЗВАЖАЛЬНИЙ ЦЕНТР") 
                t.acronym = "ТРЦ";
            else if (s === "ТОРГОВИЙ КОМПЛЕКС") 
                t.acronym = "ТК";
            else if (s === "СПОРТИВНИЙ КОМПЛЕКС") 
                t.addVariant("СПОРТКОМПЛЕКС", false);
            else if (s === "ТОРГОВО РОЗВАЖАЛЬНИЙ КОМПЛЕКС") 
                t.acronym = "ТРК";
            else if (s === "ГРУПА КОМПАНІЙ") 
                t.acronym = "ГК";
            else if (s === "КОМПАНІЯ" || s === "ФІРМА") 
                t.coeff = 1;
            if (s.startsWith("МЕДІА")) 
                t.profiles.push(OrgProfile.MEDIA);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new2333("ЭКОЛОГИЧЕСКАЯ ГРУППА", MorphLang.RU, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("ЭКОГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("РОК ГРУППА", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("РОКГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("ПАНК ГРУППА", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("ПАНКГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("ОРКЕСТР", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("ХОР", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("МУЗЫКАЛЬНЫЙ КОЛЛЕКТИВ", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("РОКГРУППА", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("РОК ГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("ПАНКГРУППА", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("ПАНК ГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("АРТГРУППА", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        t.addVariant("АРТ ГРУППА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2342("ВОКАЛЬНО ИНСТРУМЕНТАЛЬНЫЙ АНСАМБЛЬ", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true, "ВИА");
        t.addVariant("ИНСТРУМЕНТАЛЬНЫЙ АНСАМБЛЬ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("НАРОДНЫЙ АНСАМБЛЬ", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 3, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("АНСАМБЛЬ", MorphLang.RU, OrgProfile.MUSIC, OrgItemTypeTyp.ORG, 1, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2334("СТУДИЯ", MorphLang.RU, OrgProfile.CULTURE, OrgItemTypeTyp.ORG, 1, true);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["НОТАРИАЛЬНАЯ КОНТОРА", "АДВОКАТСКОЕ БЮРО", "СТРАХОВОЕ ОБЩЕСТВО", "ЮРИДИЧЕСКИЙ ДОМ"]) {
            t = OrgItemTypeTermin._new2346(s, OrgItemTypeTyp.ORG, true, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["НОТАРІАЛЬНА КОНТОРА", "АДВОКАТСЬКЕ БЮРО", "СТРАХОВЕ ТОВАРИСТВО"]) {
            t = OrgItemTypeTermin._new2347(s, MorphLang.UA, OrgItemTypeTyp.ORG, true, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ГАЗЕТА", "ЕЖЕНЕДЕЛЬНИК", "ТАБЛОИД", "ЕЖЕНЕДЕЛЬНЫЙ ЖУРНАЛ", "NEWSPAPER", "WEEKLY", "TABLOID", "MAGAZINE"]) {
            t = OrgItemTypeTermin._new2348(s, 3, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDIA);
            t.profiles.push(OrgProfile.PRESS);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ГАЗЕТА", "ТИЖНЕВИК", "ТАБЛОЇД"]) {
            t = OrgItemTypeTermin._new2349(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDIA);
            t.profiles.push(OrgProfile.PRESS);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["РАДИОСТАНЦИЯ", "РАДИО", "ТЕЛЕКАНАЛ", "ТЕЛЕКОМПАНИЯ", "НОВОСТНОЙ ПОРТАЛ", "ИНТЕРНЕТ ПОРТАЛ", "ИНТЕРНЕТ ИЗДАНИЕ", "ИНТЕРНЕТ РЕСУРС"]) {
            t = OrgItemTypeTermin._new2348(s, 3, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDIA);
            if (s === "РАДИО") {
                t.canonicText = "РАДИОСТАНЦИЯ";
                t.isDoubtWord = true;
            }
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["РАДІО", "РАДІО", "ТЕЛЕКАНАЛ", "ТЕЛЕКОМПАНІЯ", "НОВИННИЙ ПОРТАЛ", "ІНТЕРНЕТ ПОРТАЛ", "ІНТЕРНЕТ ВИДАННЯ", "ІНТЕРНЕТ РЕСУРС"]) {
            t = OrgItemTypeTermin._new2349(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true, OrgProfile.MEDIA);
            if (s === "РАДІО") {
                t.canonicText = "РАДІОСТАНЦІЯ";
                t.isDoubtWord = true;
            }
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ПАНСИОНАТ", "САНАТОРИЙ", "ДОМ ОТДЫХА", "ОТЕЛЬ", "ГОСТИНИЦА", "ГОСТИНИЧНЫЙ КОМПЛЕКС", "SPA-ОТЕЛЬ", "ОЗДОРОВИТЕЛЬНЫЙ ЛАГЕРЬ", "ДЕТСКИЙ ЛАГЕРЬ", "ПИОНЕРСКИЙ ЛАГЕРЬ", "БАЗА ОТДЫХА", "СПОРТ-КЛУБ", "ФИТНЕС-КЛУБ"]) {
            t = OrgItemTypeTermin._new2331(s, 3, OrgItemTypeTyp.ORG, true, true, true);
            if (s === "САНАТОРИЙ") 
                t.addAbridge("САН.");
            else if (s === "ДОМ ОТДЫХА") {
                t.addAbridge("Д.О.");
                t.addAbridge("ДОМ ОТД.");
                t.addAbridge("Д.ОТД.");
            }
            else if (s === "ПАНСИОНАТ") 
                t.addAbridge("ПАНС.");
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ПАНСІОНАТ", "САНАТОРІЙ", "БУДИНОК ВІДПОЧИНКУ", "ГОТЕЛЬ", "SPA-ГОТЕЛЬ", "ОЗДОРОВЧИЙ ТАБІР", "БАЗА ВІДПОЧИНКУ", "СПОРТ-КЛУБ", "ФІТНЕС-КЛУБ"]) {
            t = OrgItemTypeTermin._new2353(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true);
            if (s === "САНАТОРІЙ") 
                t.addAbridge("САН.");
            OrgItemTypeToken.m_Global.add(t);
        }
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2354("ДЕТСКИЙ ОЗДОРОВИТЕЛЬНЫЙ ЛАГЕРЬ", 3, OrgItemTypeTyp.ORG, "ДОЛ", true, true, true));
        OrgItemTypeToken.m_Global.add(OrgItemTypeTermin._new2354("ДЕТСКИЙ СПОРТИВНЫЙ ОЗДОРОВИТЕЛЬНЫЙ ЛАГЕРЬ", 3, OrgItemTypeTyp.ORG, "ДСОЛ", true, true, true));
        for (const s of ["САДОВО ОГОРОДНОЕ ТОВАРИЩЕСТВО", "КООПЕРАТИВ", "ФЕРМЕРСКОЕ ХОЗЯЙСТВО", "КРЕСТЬЯНСКО ФЕРМЕРСКОЕ ХОЗЯЙСТВО", "АГРОФИРМА", "АГРОСОЮЗ", "КОНЕЗАВОД", "ПТИЦЕФЕРМА", "СВИНОФЕРМА", "ФЕРМА", "ЛЕСПРОМХОЗ", "ЖИВОТНОВОДЧЕСКАЯ ТОЧКА"]) {
            t = OrgItemTypeTermin._new2356(s, 3, OrgItemTypeTyp.ORG, true, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new2357("СЕМЕНОВОДЧЕСКАЯ АГРОФИРМА", 3, "САФ", OrgItemTypeTyp.ORG, true, true, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("КОЛХОЗ", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("К-З", false);
        t.addVariant("СПК К-З", false);
        t.addVariant("СПК КОЛХОЗ", false);
        t.addVariant("СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", false);
        t.addVariant("СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ КОЛХОЗ", false);
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["КОЛГОСП", "САДОВО ГОРОДНЄ ТОВАРИСТВО", "КООПЕРАТИВ", "ФЕРМЕРСЬКЕ ГОСПОДАРСТВО", "СЕЛЯНСЬКО ФЕРМЕРСЬКЕ ГОСПОДАРСТВО", "АГРОФІРМА", "КОНЕЗАВОД", "ПТАХОФЕРМА", "СВИНОФЕРМА", "ФЕРМА"]) {
            t = OrgItemTypeTermin._new2359(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new2323("ЖИЛИЩНО КОММУНАЛЬНОЕ ХОЗЯЙСТВО", 3, OrgItemTypeTyp.ORG, "ЖКХ", true, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2323("ЖИТЛОВО КОМУНАЛЬНЕ ГОСПОДАРСТВО", 3, OrgItemTypeTyp.ORG, "ЖКГ", true, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2362("КОММУНАЛЬНОЕ ПРЕДПРИЯТИЕ", 3, OrgItemTypeTyp.ORG, true, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2363("КОМУНАЛЬНЕ ПІДПРИЄМСТВО", MorphLang.UA, 3, OrgItemTypeTyp.ORG, true, true, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("АВТОМОБИЛЬНЫЙ ЗАВОД", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("АВТОЗАВОД", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("АВТОМОБИЛЬНЫЙ ЦЕНТР", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("АВТОЦЕНТР", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2331("ЭКОЛОГИЧЕСКИЙ ЦЕНТР", 3, OrgItemTypeTyp.ORG, true, true, true);
        t.addVariant("ЭКОЦЕНТР", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("СОВХОЗ", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addAbridge("С/Х");
        t.addAbridge("С-З");
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("ПЛЕМЕННОЕ ХОЗЯЙСТВО", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("ПЛЕМХОЗ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("ЛЕСНОЕ ХОЗЯЙСТВО", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("ЛЕСХОЗ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2362("ЛЕСНИЧЕСТВО", 3, OrgItemTypeTyp.ORG, true, true, true);
        t.addAbridge("ЛЕС-ВО");
        t.addAbridge("ЛЕСН-ВО");
        OrgItemTypeToken.m_Global.add(t);
        let sads = ["Садоводческое некоммерческое товарищество;Садовое некоммерческое товарищество", "СНТ", "Садоводческое огородническое товарищество;Садовое огородническое товарищество", "СОТ", "Садовый огороднический кооператив;Садовый огородный кооператив", "СОК", "Садовый огороднический потребительский кооператив;Садовый огородный потребительский кооператив", "СОПК", "Садовое огородническое потребительское общество;Садовое огородное потребительское общество", "СОПО", "Потребительский Садовый огороднический кооператив;Потребительский Садовый огородний кооператив", "ПСОК", "Садоводческое огородническое некоммерческое товарищество;Садовое огородническое некоммерческое товарищество", "СОНТ", "некоммерческое Садоводческое огородническое товарищество;некоммерческое Садовое огородническое товарищество", "НСОТ", "Дачное некоммерческое товарищество", "ДНТ", "Огородническое некоммерческое товарищество", "ОНТ", "Садоводческое некоммерческое партнерство", "СНП", "Дачное некоммерческое партнерство", "ДНП", "Огородническое некоммерческое партнерство", "ОНП", "Огородническое некоммерческое товарищество", "ОНТ", "Дачный потребительский кооператив", "ДПК", "Огороднический потребительский кооператив;Огородный потребительский кооператив", "ОПК"];
        for (let i = 0; i < sads.length; i += 2) {
            let parts = Utils.splitString(sads[i].toUpperCase(), ';', false);
            t = OrgItemTypeTermin._new2371(parts[0], 3, sads[i + 1], OrgItemTypeTyp.ORG, true, true, true);
            for (let j = 1; j < parts.length; j++) {
                t.addVariant(parts[j], false);
            }
            t.addAbridge(sads[i + 1]);
            if (t.acronym === "СНТ") 
                t.addAbridge("САДОВ.НЕКОМ.ТОВ.");
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new2372("САДОВОДЧЕСКАЯ ПОТРЕБИТЕЛЬСКАЯ КООПЕРАЦИЯ", "СПК", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addVariant("САДОВАЯ ПОТРЕБИТЕЛЬСКАЯ КООПЕРАЦИЯ", false);
        t.addVariant("САДОВОДЧЕСКИЙ ПОТРЕБИТЕЛЬНЫЙ КООПЕРАТИВ", false);
        t.addVariant("САДОВОДЧЕСКИЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addAbridge("САДОВОДЧ.ТОВ.");
        t.addAbridge("САДОВ.ТОВ.");
        t.addAbridge("САД.ТОВ.");
        t.addAbridge("С.Т.");
        t.addVariant("САДОВОЕ ТОВАРИЩЕСТВО", false);
        t.addVariant("САДОВ. ТОВАРИЩЕСТВО", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("САДОВОДЧЕСКИЙ КООПЕРАТИВ", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addAbridge("САДОВОДЧ.КООП.");
        t.addAbridge("САДОВ.КООП.");
        t.addVariant("САДОВЫЙ КООПЕРАТИВ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2356("ДАЧНОЕ ТОВАРИЩЕСТВО", 3, OrgItemTypeTyp.ORG, true, true, true, true);
        t.addAbridge("ДАЧН.ТОВ.");
        t.addAbridge("ДАЧ.ТОВ.");
        OrgItemTypeToken.m_Global.add(t);
        for (const s of ["ФЕСТИВАЛЬ", "ЧЕМПИОНАТ", "ОЛИМПИАДА", "КОНКУРС"]) {
            t = OrgItemTypeTermin._new1858(s, 3, OrgItemTypeTyp.ORG, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        for (const s of ["ФЕСТИВАЛЬ", "ЧЕМПІОНАТ", "ОЛІМПІАДА"]) {
            t = OrgItemTypeTermin._new2377(s, MorphLang.UA, 3, OrgItemTypeTyp.ORG, true);
            OrgItemTypeToken.m_Global.add(t);
        }
        t = OrgItemTypeTermin._new2378("ПОГРАНИЧНЫЙ ПОСТ", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY);
        t.addVariant("ПОГП", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2378("ПОГРАНИЧНАЯ ЗАСТАВА", 3, OrgItemTypeTyp.ORG, true, true, OrgProfile.ARMY);
        t.addVariant("ПОГЗ", false);
        t.addVariant("ПОГРАНЗАСТАВА", false);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("ТЕРРИТОРИАЛЬНЫЙ ПУНКТ", 3, OrgItemTypeTyp.DEP, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new1962("МИГРАЦИОННЫЙ ПУНКТ", 3, OrgItemTypeTyp.DEP, true);
        OrgItemTypeToken.m_Global.add(t);
        t = OrgItemTypeTermin._new2382("ПРОПУСКНОЙ ПУНКТ", 3, true, OrgItemTypeTyp.DEP, true, true);
        t.addVariant("ПУНКТ ПРОПУСКА", false);
        t.addVariant("КОНТРОЛЬНО ПРОПУСКНОЙ ПУНКТ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = new OrgItemTypeTermin("ТОРГОВАЯ ПЛОЩАДКА");
        t.addVariant("МАРКЕТПЛЕЙС", false);
        t.addVariant("ОНЛАЙН-МАГАЗИН ЭЛЕКТРОННОЙ ТОРГОВЛИ", false);
        OrgItemTypeToken.m_Global.add(t);
        t = new OrgItemTypeTermin("ИНТЕРНЕТ-МАГАЗИН");
        OrgItemTypeToken.m_Global.add(t);
        OrgItemTypeToken.m_PrefWords = new TerminCollection();
        for (const s of ["КАПИТАЛ", "РУКОВОДСТВО", "СЪЕЗД", "СОБРАНИЕ", "СОВЕТ", "УПРАВЛЕНИЕ", "ДЕПАРТАМЕНТ"]) {
            OrgItemTypeToken.m_PrefWords.add(new Termin(s));
        }
        for (const s of ["КАПІТАЛ", "КЕРІВНИЦТВО", "ЗЇЗД", "ЗБОРИ", "РАДА", "УПРАВЛІННЯ"]) {
            OrgItemTypeToken.m_PrefWords.add(Termin._new1526(s, MorphLang.UA));
        }
        for (const s of ["АКЦИЯ", "ВЛАДЕЛЕЦ", "ВЛАДЕЛИЦА", "СОВЛАДЕЛЕЦ", "СОВЛАДЕЛИЦА", "КОНКУРЕНТ"]) {
            OrgItemTypeToken.m_PrefWords.add(Termin._new170(s, s));
        }
        for (const s of ["АКЦІЯ", "ВЛАСНИК", "ВЛАСНИЦЯ", "СПІВВЛАСНИК", "СПІВВЛАСНИЦЯ", "КОНКУРЕНТ"]) {
            OrgItemTypeToken.m_PrefWords.add(Termin._new348(s, s, MorphLang.UA));
        }
        for (let k = 0; k < 3; k++) {
            let _name = (k === 0 ? "pattrs_ru.dat" : (k === 1 ? "pattrs_ua.dat" : "pattrs_en.dat"));
            let dat = PullentiNerOrgInternalResourceHelper.getBytes(_name);
            if (dat === null) 
                throw new Error(("Can't file resource file " + _name + " in Organization analyzer"));
            let tmp = new MemoryStream(OrgItemTypeToken.deflate(dat)); 
            try {
                tmp.position = 0;
                let xml = new XmlDocument();
                xml.loadStream(tmp);
                for (const x of xml.document_element.child_nodes) {
                    if (k === 0) 
                        OrgItemTypeToken.m_PrefWords.add(Termin._new170(x.inner_text, 1));
                    else if (k === 1) 
                        OrgItemTypeToken.m_PrefWords.add(Termin._new348(x.inner_text, 1, MorphLang.UA));
                    else if (k === 2) 
                        OrgItemTypeToken.m_PrefWords.add(Termin._new348(x.inner_text, 1, MorphLang.EN));
                }
            }
            finally {
                tmp.close();
            }
        }
        OrgItemTypeToken.m_KeyWordsForRefs = new TerminCollection();
        for (const s of ["КОМПАНИЯ", "ФИРМА", "ПРЕДПРИЯТИЕ", "КОРПОРАЦИЯ", "ВЕДОМСТВО", "УЧРЕЖДЕНИЕ", "КОНГЛОМЕРАТ", "КОМПАНІЯ", "ФІРМА", "ПІДПРИЄМСТВО", "КОРПОРАЦІЯ", "ВІДОМСТВО", "УСТАНОВА"]) {
            OrgItemTypeToken.m_KeyWordsForRefs.add(new Termin(s));
        }
        for (const s of ["ЧАСТЬ", "БАНК", "ЗАВОД", "ФАБРИКА", "АЭРОПОРТ", "БИРЖА", "СЛУЖБА", "МИНИСТЕРСТВО", "КОМИССИЯ", "КОМИТЕТ", "ГРУППА", "ЧАСТИНА", "БАНК", "ЗАВОД", "ФАБРИКА", "АЕРОПОРТ", "БІРЖА", "СЛУЖБА", "МІНІСТЕРСТВО", "КОМІСІЯ", "КОМІТЕТ", "ГРУПА"]) {
            OrgItemTypeToken.m_KeyWordsForRefs.add(Termin._new170(s, s));
        }
        OrgItemTypeToken.m_Markers = new TerminCollection();
        for (const s of ["МОРСКОЙ", "ВОЗДУШНЫЙ;ВОЗДУШНО", "ДЕСАНТНЫЙ;ДЕСАНТНО", "ТАНКОВЫЙ", "АРТИЛЛЕРИЙСКИЙ", "АВИАЦИОННЫЙ", "КОСМИЧЕСКИЙ", "РАКЕТНЫЙ;РАКЕТНО", "БРОНЕТАНКОВЫЙ", "КАВАЛЕРИЙСКИЙ", "СУХОПУТНЫЙ", "ПЕХОТНЫЙ;ПЕХОТНО", "МОТОПЕХОТНЫЙ", "МИНОМЕТНЫЙ", "МОТОСТРЕЛКОВЫЙ", "СТРЕЛКОВЫЙ", "ПРОТИВОРАКЕТНЫЙ", "ПРОТИВОВОЗДУШНЫЙ", "ШТУРМОВОЙ"]) {
            let ss = Utils.splitString(s, ';', false);
            t = new OrgItemTypeTermin(ss[0]);
            if (ss.length > 1) 
                t.addVariant(ss[1], false);
            OrgItemTypeToken.m_Markers.add(t);
        }
        OrgItemTypeToken.m_StdAdjs = new TerminCollection();
        for (const s of ["РОССИЙСКИЙ", "ВСЕРОССИЙСКИЙ", "МЕЖДУНАРОДНЫЙ", "ВСЕМИРНЫЙ", "ЕВРОПЕЙСКИЙ", "ГОСУДАРСТВЕННЫЙ", "НЕГОСУДАРСТВЕННЫЙ", "ФЕДЕРАЛЬНЫЙ", "РЕГИОНАЛЬНЫЙ", "ОБЛАСТНОЙ", "ГОРОДСКОЙ", "МУНИЦИПАЛЬНЫЙ", "АВТОНОМНЫЙ", "НАЦИОНАЛЬНЫЙ", "МЕЖРАЙОННЫЙ", "РАЙОННЫЙ", "ОТРАСЛЕВОЙ", "МЕЖОТРАСЛЕВОЙ", "МЕЖРЕГИОНАЛЬНЫЙ", "НАРОДНЫЙ", "ВЕРХОВНЫЙ", "УКРАИНСКИЙ", "ВСЕУКРАИНСКИЙ", "РУССКИЙ"]) {
            OrgItemTypeToken.m_StdAdjs.add(Termin._new690(s, MorphLang.RU, s));
        }
        OrgItemTypeToken.m_StdAdjsUA = new TerminCollection();
        for (const s of ["РОСІЙСЬКИЙ", "ВСЕРОСІЙСЬКИЙ", "МІЖНАРОДНИЙ", "СВІТОВИЙ", "ЄВРОПЕЙСЬКИЙ", "ДЕРЖАВНИЙ", "НЕДЕРЖАВНИЙ", "ФЕДЕРАЛЬНИЙ", "РЕГІОНАЛЬНИЙ", "ОБЛАСНИЙ", "МІСЬКИЙ", "МУНІЦИПАЛЬНИЙ", "АВТОНОМНИЙ", "НАЦІОНАЛЬНИЙ", "МІЖРАЙОННИЙ", "РАЙОННИЙ", "ГАЛУЗЕВИЙ", "МІЖГАЛУЗЕВИЙ", "МІЖРЕГІОНАЛЬНИЙ", "НАРОДНИЙ", "ВЕРХОВНИЙ", "УКРАЇНСЬКИЙ", "ВСЕУКРАЇНСЬКИЙ", "РОСІЙСЬКА"]) {
            OrgItemTypeToken.m_StdAdjsUA.add(Termin._new690(s, MorphLang.UA, s));
        }
        for (const s of ["КОММЕРЧЕСКИЙ", "НЕКОММЕРЧЕСКИЙ", "БЮДЖЕТНЫЙ", "КАЗЕННЫЙ", "БЛАГОТВОРИТЕЛЬНЫЙ", "СОВМЕСТНЫЙ", "ИНОСТРАННЫЙ", "ИССЛЕДОВАТЕЛЬСКИЙ", "ОБРАЗОВАТЕЛЬНЫЙ", "ОБЩЕОБРАЗОВАТЕЛЬНЫЙ", "ВЫСШИЙ", "УЧЕБНЫЙ", "СПЕЦИАЛИЗИРОВАННЫЙ", "ГЛАВНЫЙ", "ЦЕНТРАЛЬНЫЙ", "ТЕХНИЧЕСКИЙ", "ТЕХНОЛОГИЧЕСКИЙ", "ВОЕННЫЙ", "ПРОМЫШЛЕННЫЙ", "ТОРГОВЫЙ", "СИНОДАЛЬНЫЙ", "МЕДИЦИНСКИЙ", "ДИАГНОСТИЧЕСКИЙ", "ДЕТСКИЙ", "АКАДЕМИЧЕСКИЙ", "ПОЛИТЕХНИЧЕСКИЙ", "ИНВЕСТИЦИОННЫЙ", "ТЕРРОРИСТИЧЕСКИЙ", "РАДИКАЛЬНЫЙ", "ИСЛАМИСТСКИЙ", "ЛЕВОРАДИКАЛЬНЫЙ", "ПРАВОРАДИКАЛЬНЫЙ", "ОППОЗИЦИОННЫЙ", "НАЛОГОВЫЙ", "КРИМИНАЛЬНЫЙ", "СПОРТИВНЫЙ", "НЕФТЯНОЙ", "ГАЗОВЫЙ", "ВЕЛИКИЙ"]) {
            OrgItemTypeToken.m_StdAdjs.add(new Termin(s, MorphLang.RU));
        }
        for (const s of ["КОМЕРЦІЙНИЙ", "НЕКОМЕРЦІЙНИЙ", "БЮДЖЕТНИЙ", "КАЗЕННИМ", "БЛАГОДІЙНИЙ", "СПІЛЬНИЙ", "ІНОЗЕМНИЙ", "ДОСЛІДНИЦЬКИЙ", "ОСВІТНІЙ", "ЗАГАЛЬНООСВІТНІЙ", "ВИЩИЙ", "НАВЧАЛЬНИЙ", "СПЕЦІАЛІЗОВАНИЙ", "ГОЛОВНИЙ", "ЦЕНТРАЛЬНИЙ", "ТЕХНІЧНИЙ", "ТЕХНОЛОГІЧНИЙ", "ВІЙСЬКОВИЙ", "ПРОМИСЛОВИЙ", "ТОРГОВИЙ", "СИНОДАЛЬНИЙ", "МЕДИЧНИЙ", "ДІАГНОСТИЧНИЙ", "ДИТЯЧИЙ", "АКАДЕМІЧНИЙ", "ПОЛІТЕХНІЧНИЙ", "ІНВЕСТИЦІЙНИЙ", "ТЕРОРИСТИЧНИЙ", "РАДИКАЛЬНИЙ", "ІСЛАМІЗМ", "ЛІВОРАДИКАЛЬНИЙ", "ПРАВОРАДИКАЛЬНИЙ", "ОПОЗИЦІЙНИЙ", "ПОДАТКОВИЙ", "КРИМІНАЛЬНИЙ", " СПОРТИВНИЙ", "НАФТОВИЙ", "ГАЗОВИЙ", "ВЕЛИКИЙ"]) {
            OrgItemTypeToken.m_StdAdjsUA.add(new Termin(s, MorphLang.UA));
        }
    }
    
    static deflate(zip) {
        let unzip = new MemoryStream(); 
        try {
            let data = new MemoryStream(zip);
            data.position = 0;
            MorphDeserializer.deflateGzip(data, unzip);
            data.close();
            return unzip.toByteArray();
        }
        finally {
            unzip.close();
        }
    }
    
    static isDecreeKeyword(t, cou = 1) {
        if (t === null) 
            return false;
        for (let i = 0; (i < cou) && t !== null; i++,t = t.previous) {
            if (t.isNewlineAfter) 
                break;
            if (!t.chars.isCyrillicLetter) 
                break;
            for (const d of OrgItemTypeToken.m_DecreeKeyWords) {
                if (t.isValue(d, null)) 
                    return true;
            }
        }
        return false;
    }
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = null;
        this.name = null;
        this.altName = null;
        this.nameIsName = false;
        this.altTyp = null;
        this.number = null;
        this.m_Profile = null;
        this.root = null;
        this.m_IsDep = -1;
        this.isNotTyp = false;
        this.m_Coef = -1;
        this.geo = null;
        this.geo2 = null;
        this.charsRoot = new CharsInfo();
        this.canBeDepBeforeOrganization = false;
        this.isDouterOrg = false;
        this.m_IsDoubtRootWord = -1;
        this.canBeOrganization = false;
    }
    
    get profiles() {
        if (this.m_Profile === null) {
            this.m_Profile = new Array();
            if (this.root !== null) 
                this.m_Profile.splice(this.m_Profile.length, 0, ...this.root.profiles);
        }
        return this.m_Profile;
    }
    set profiles(value) {
        this.m_Profile = value;
        return value;
    }
    
    get isDep() {
        if (this.m_IsDep >= 0) 
            return this.m_IsDep > 0;
        if (this.root === null) 
            return false;
        if (this.root.profiles.includes(OrgProfile.UNIT)) 
            return true;
        return false;
    }
    set isDep(value) {
        this.m_IsDep = (value ? 1 : 0);
        return value;
    }
    
    get coef() {
        if (this.m_Coef >= 0) 
            return this.m_Coef;
        if (this.root !== null) 
            return this.root.coeff;
        return 0;
    }
    set coef(value) {
        this.m_Coef = value;
        return value;
    }
    
    get nameWordsCount() {
        let cou = 1;
        if (this.name === null) 
            return 1;
        for (let i = 0; i < this.name.length; i++) {
            if (this.name[i] === ' ') 
                cou++;
        }
        return cou;
    }
    
    get isDoubtRootWord() {
        if (this.m_IsDoubtRootWord >= 0) 
            return this.m_IsDoubtRootWord === 1;
        if (this.root === null) 
            return false;
        return this.root.isDoubtWord;
    }
    set isDoubtRootWord(value) {
        this.m_IsDoubtRootWord = (value ? 1 : 0);
        return value;
    }
    
    toString() {
        if (this.name !== null) 
            return this.name;
        else 
            return this.typ;
    }
    
    clone() {
        let res = new OrgItemTypeToken(this.beginToken, this.endToken);
        res.morph = this.morph;
        res.typ = this.typ;
        res.name = this.name;
        res.altName = this.altName;
        res.number = this.number;
        res.canBeOrganization = this.canBeOrganization;
        res.nameIsName = this.nameIsName;
        res.m_Coef = this.m_Coef;
        res.m_IsDep = this.m_IsDep;
        res.m_IsDoubtRootWord = this.m_IsDoubtRootWord;
        res.isNotTyp = this.isNotTyp;
        res.m_Profile = this.m_Profile;
        res.isDouterOrg = this.isDouterOrg;
        res.root = this.root;
        res.charsRoot = this.charsRoot;
        res.geo = this.geo;
        res.geo2 = this.geo2;
        return res;
    }
    
    static tryAttachPureKeywords(t) {
        return OrgItemTypeToken._TryAttach(t, true, true);
    }
    
    static prepareAllData(t0) {
        if (!OrgItemTypeToken.SPEED_REGIME) 
            return;
        let ad = OrganizationAnalyzer.getData(t0);
        if (ad === null) 
            return;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, OrgTokenData);
            let _typ = OrgItemTypeToken.tryAttach(t, false);
            if (_typ !== null) {
                if (d === null) 
                    d = new OrgTokenData(t);
                d.typ = (d.typLow = _typ);
            }
            if (!(t instanceof TextToken) || ((t.chars.isLetter && !t.chars.isAllLower))) 
                continue;
            _typ = OrgItemTypeToken.tryAttach(t, true);
            if (_typ !== null) {
                if (d === null) 
                    d = new OrgTokenData(t);
                d.typLow = _typ;
            }
        }
    }
    
    static recalcData(t) {
        if (!OrgItemTypeToken.SPEED_REGIME) 
            return;
        let ad = OrganizationAnalyzer.getData(t);
        if (ad === null) 
            return;
        let r = ad.tRegime;
        ad.tRegime = false;
        let d = Utils.as(t.tag, OrgTokenData);
        let _typ = OrgItemTypeToken.tryAttach(t, false);
        if (_typ !== null) {
            if (d === null) 
                d = new OrgTokenData(t);
            d.typ = (d.typLow = _typ);
        }
        ad.tRegime = r;
    }
    
    static tryAttach(t, canBeFirstLetterLower = false) {
        if (t === null) 
            return null;
        let ad = OrganizationAnalyzer.getData(t);
        if (ad === null) 
            return null;
        let res = null;
        if (OrgItemTypeToken.SPEED_REGIME && ad.tRegime) {
            let d = Utils.as(t.tag, OrgTokenData);
            if (d !== null) {
                if (canBeFirstLetterLower) 
                    res = d.typLow;
                else 
                    res = d.typ;
            }
            if (res === null) 
                res = OrgItemTypeToken.tryAttachSpec(t, canBeFirstLetterLower);
            let ok = true;
            if (res !== null) {
                for (let tt = t; tt !== null && tt.beginChar <= res.endToken.beginChar; tt = tt.next) {
                    if (tt instanceof ReferentToken) 
                        ok = false;
                }
            }
            if (ok) 
                return res;
        }
        if (ad.tLevel > 2) 
            return null;
        ad.tLevel++;
        res = OrgItemTypeToken.tryAttachInt(t, canBeFirstLetterLower);
        if (res === null) 
            res = OrgItemTypeToken.tryAttachSpec(t, canBeFirstLetterLower);
        else {
        }
        ad.tLevel--;
        return res;
    }
    
    static tryAttachInt(t, canBeFirstLetterLower) {
        if (t instanceof ReferentToken) {
            if (t.chars.isLatinLetter) {
            }
            else if ((t.getReferent() instanceof GeoReferent) && t.endToken.morph._class.isAdjective) {
            }
            else 
                return null;
        }
        let res = OrgItemTypeToken._TryAttach(t, canBeFirstLetterLower, false);
        if (res !== null) {
            if (res.name === "ДОВЕРИТЕЛЬНОЕ УПРАВЛЕНИЕ") 
                return null;
            if ((res.lengthChar < 3) && res.chars.isAllUpper && !res.isWhitespaceBefore) {
                if (res.beginToken.previous !== null && res.beginToken.previous.isHiphen) 
                    return null;
            }
            if (res.typ === "группа" && res.endToken.next !== null) {
                if (res.endToken.next.isValue("ТОВАР", null) || res.endToken.next.isValue("РАБОТА", null) || res.endToken.next.isValue("УСЛУГА", null)) 
                    return null;
            }
            if (res.beginToken === res.endToken && res.typ === "организация" && t.previous !== null) {
                if (t.previous.isValue("НАИМЕНОВАНИЕ", null) || t.previous.isValue("НАЗВАНИЕ", null)) 
                    return null;
            }
        }
        if ((res === null && (t instanceof NumberToken) && (t.whitespacesAfterCount < 3)) && t.next !== null && t.next.isValue("СЛУЖБА", null)) {
            res = OrgItemTypeToken._TryAttach(t.next, canBeFirstLetterLower, false);
            if (res === null) 
                return null;
            res.number = t.value;
            res.beginToken = t;
            return res;
        }
        if (((res === null && t.chars.isCapitalUpper && (t.next instanceof TextToken)) && (t.whitespacesAfterCount < 3) && t.next.term === "РБ") && t.morph._class.isAdjective && ((t.morph.gender.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
            res = new OrgItemTypeToken(t, t.next);
            res.typ = "больница";
            res.name = (t.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, MorphGender.FEMINIE, false) + " РАЙОННАЯ БОЛЬНИЦА");
            res.coef = 3;
            res.profiles.push(OrgProfile.MEDICINE);
        }
        if (res === null && t.chars.isLatinLetter) {
            if (t.isValue("THE", null)) {
                let res1 = OrgItemTypeToken.tryAttach(t.next, canBeFirstLetterLower);
                if (res1 !== null) {
                    res1.beginToken = t;
                    return res1;
                }
                return null;
            }
            if (t.chars.isCapitalUpper && (t instanceof TextToken)) {
                let mc = t.getMorphClassInDictionary();
                if ((mc.isConjunction || mc.isPreposition || mc.isMisc) || mc.isPronoun || mc.isPersonalPronoun) {
                }
                else 
                    for (let ttt = t.next; ttt !== null; ttt = ttt.next) {
                        if (!ttt.chars.isLatinLetter) 
                            break;
                        if (ttt.whitespacesBeforeCount > 3) 
                            break;
                        if (MiscHelper.isEngAdjSuffix(ttt.next)) {
                            ttt = ttt.next.next.next;
                            if (ttt === null) 
                                break;
                        }
                        let res1 = OrgItemTypeToken._TryAttach(ttt, true, false);
                        if (res1 !== null) {
                            res1.name = MiscHelper.getTextValue(t, res1.endToken, GetTextAttr.IGNOREARTICLES);
                            if (res1.coef < 5) 
                                res1.coef = 5;
                            res1.beginToken = t;
                            return res1;
                        }
                        if (ttt.chars.isAllLower && !ttt.isAnd) 
                            break;
                        if (ttt.whitespacesBeforeCount > 1) 
                            break;
                    }
            }
        }
        if ((res !== null && res.name !== null && res.name.startsWith("СОВМЕСТ")) && LanguageHelper.endsWithEx(res.name, "ПРЕДПРИЯТИЕ", "КОМПАНИЯ", null, null)) {
            res.root = OrgItemTypeToken.m_SovmPred;
            res.typ = "совместное предприятие";
            for (let tt1 = t.next; tt1 !== null && tt1.endChar <= res.endToken.beginChar; tt1 = tt1.next) {
                let rt = tt1.kit.processReferent("GEO", tt1, null);
                if (rt !== null) {
                    res.coef = res.coef + 0.5;
                    if (res.geo === null) 
                        res.geo = rt;
                    else if (res.geo.referent.canBeEquals(rt.referent, ReferentsEqualType.WITHINONETEXT)) {
                    }
                    else if (res.geo2 === null) 
                        res.geo2 = rt;
                    tt1 = rt.endToken;
                }
            }
        }
        if (((((res !== null && res.beginToken.lengthChar <= 2 && !res.beginToken.chars.isAllLower) && res.beginToken.next !== null && res.beginToken.next.isChar('.')) && res.beginToken.next.next !== null && res.beginToken.next.next.lengthChar <= 2) && !res.beginToken.next.next.chars.isAllLower && res.beginToken.next.next.next !== null) && res.beginToken.next.next.next.isChar('.') && res.endToken === res.beginToken.next.next.next) 
            return null;
        if (res !== null && res.typ === "управление") {
            if (res.name !== null && res.name.includes("ГОСУДАРСТВЕННОЕ")) 
                return null;
            if (res.beginToken.previous !== null && res.beginToken.previous.isValue("ГОСУДАРСТВЕННЫЙ", null)) 
                return null;
        }
        if ((res !== null && res.geo === null && (res.whitespacesBeforeCount < 3)) && (res.beginToken.previous instanceof TextToken) && !res.beginToken.isValue("УК", null)) {
            let rt = res.kit.processReferent("GEO", res.beginToken.previous, null);
            if (rt !== null && rt.morph._class.isAdjective) {
                if (res.beginToken.previous.previous !== null && res.beginToken.previous.previous.isValue("ОРДЕН", null)) {
                }
                else {
                    res.geo = rt;
                    res.beginToken = rt.beginToken;
                }
            }
        }
        if ((res !== null && res.typ === "комитет" && res.geo === null) && res.endToken.next !== null && (res.endToken.next.getReferent() instanceof GeoReferent)) {
            res.geo = Utils.as(res.endToken.next, ReferentToken);
            res.endToken = res.endToken.next;
            res.coef = 2;
            if (res.endToken.next !== null && res.endToken.next.isValue("ПО", null)) 
                res.coef = res.coef + (1);
        }
        if ((res !== null && res.typ === "агентство" && res.chars.isCapitalUpper) && res.endToken.next !== null && res.endToken.next.isValue("ПО", null)) 
            res.coef = res.coef + (3);
        if (res !== null && res.geo !== null) {
            let hasAdj = false;
            for (let tt1 = res.beginToken; tt1 !== null && tt1.endChar <= res.endToken.beginChar; tt1 = tt1.next) {
                let rt = tt1.kit.processReferent("GEO", tt1, null);
                if (rt !== null) {
                    if (res.geo !== null && res.geo.referent.canBeEquals(rt.referent, ReferentsEqualType.WITHINONETEXT)) 
                        continue;
                    if (res.geo2 !== null && res.geo2.referent.canBeEquals(rt.referent, ReferentsEqualType.WITHINONETEXT)) 
                        continue;
                    res.coef = res.coef + 0.5;
                    if (res.geo === null) 
                        res.geo = rt;
                    else if (res.geo2 === null) 
                        res.geo2 = rt;
                    tt1 = rt.endToken;
                }
                else if (tt1.getMorphClassInDictionary().isAdjective) 
                    hasAdj = true;
            }
            if ((res.typ === "институт" || res.typ === "академия" || res.typ === "інститут") || res.typ === "академія") {
                if (hasAdj) {
                    res.coef = res.coef + (2);
                    res.canBeOrganization = true;
                }
            }
        }
        if (res !== null && res.geo === null) {
            let tt2 = res.endToken.next;
            if (tt2 !== null && !tt2.isNewlineBefore && tt2.morph._class.isPreposition) {
                if (((tt2.next instanceof TextToken) && tt2.next.term === "ВАШ" && res.root !== null) && res.root.profiles.includes(OrgProfile.JUSTICE)) {
                    res.coef = 5;
                    res.endToken = tt2.next;
                    tt2 = tt2.next.next;
                    res.name = (((res.name != null ? res.name : (res !== null && res.root !== null ? res.root.canonicText : null)))) + " ПО ВЗЫСКАНИЮ АДМИНИСТРАТИВНЫХ ШТРАФОВ";
                    res.typ = "отдел";
                }
            }
            if (tt2 !== null && !tt2.isNewlineBefore && tt2.morph._class.isPreposition) {
                tt2 = tt2.next;
                if (tt2 !== null && !tt2.isNewlineBefore && (((tt2.getReferent() instanceof GeoReferent) || (tt2.getReferent() instanceof StreetReferent)))) {
                    res.endToken = tt2;
                    res.geo = Utils.as(tt2, ReferentToken);
                    if ((tt2.next !== null && tt2.next.isAnd && (tt2.next.next instanceof ReferentToken)) && (((tt2.next.next.getReferent() instanceof GeoReferent) || (tt2.next.next.getReferent() instanceof StreetReferent)))) {
                        tt2 = tt2.next.next;
                        res.endToken = tt2;
                        res.geo2 = Utils.as(tt2, ReferentToken);
                    }
                }
            }
            else if (((tt2 !== null && !tt2.isNewlineBefore && tt2.isHiphen) && (tt2.next instanceof TextToken) && tt2.next.getMorphClassInDictionary().isNoun) && !tt2.next.isValue("БАНК", null)) {
                let npt1 = NounPhraseHelper.tryParse(res.endToken, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null && npt1.endToken === tt2.next) {
                    res.altTyp = npt1.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase();
                    res.endToken = npt1.endToken;
                }
            }
            else if (tt2 !== null && (tt2.whitespacesBeforeCount < 3)) {
                let npt = NounPhraseHelper.tryParse(tt2, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.morph._case.isGenitive) {
                    let rr = tt2.kit.processReferent("NAMEDENTITY", tt2, null);
                    if (rr !== null && ((rr.morph._case.isGenitive || rr.morph._case.isUndefined)) && rr.referent.findSlot("KIND", "location", true) !== null) {
                        if (((res.root !== null && res.root.typ === OrgItemTypeTyp.DEP)) || res.typ === "департамент") {
                        }
                        else 
                            res.endToken = rr.endToken;
                    }
                    else if (res.root !== null && res.root.typ === OrgItemTypeTyp.PREFIX && npt.endToken.isValue("ОБРАЗОВАНИЕ", null)) {
                        res.endToken = npt.endToken;
                        res.profiles.push(OrgProfile.EDUCATION);
                    }
                }
                if (((tt2.getReferent() instanceof GeoReferent) && res.root !== null && res.root.typ === OrgItemTypeTyp.PREFIX) && res.geo === null && !res.beginToken.isValue("УК", null)) {
                    res.geo = Utils.as(tt2, ReferentToken);
                    res.endToken = tt2;
                }
            }
        }
        if (res !== null && res.typ !== null && Utils.isDigit(res.typ[0])) {
            let ii = res.typ.indexOf(' ');
            if (ii < (res.typ.length - 1)) {
                res.number = res.typ.substring(0, 0 + ii);
                res.typ = res.typ.substring(ii + 1).trim();
            }
        }
        if (res !== null && res.name !== null && Utils.isDigit(res.name[0])) {
            let ii = res.name.indexOf(' ');
            if (ii < (res.name.length - 1)) {
                res.number = res.name.substring(0, 0 + ii);
                res.name = res.name.substring(ii + 1).trim();
            }
        }
        if (res !== null && res.typ === "фонд") {
            if (t.previous !== null && ((t.previous.isValue("ПРИЗОВОЙ", null) || t.previous.isValue("ЖИЛИЩНЫЙ", null)))) 
                return null;
            if (res.beginToken.isValue("ПРИЗОВОЙ", null) || res.beginToken.isValue("ЖИЛИЩНЫЙ", null)) 
                return null;
            if (res.endToken.next !== null && res.endToken.next.isValue("КОМБИНИРОВАННЫЙ", null)) {
                res.endToken = res.endToken.next;
                if (res.name !== null) 
                    res.name = "КОМБИНИРОВАННЫЙ " + res.name;
            }
        }
        if (res !== null && res.typ === "милли меджлис") 
            res.morph = new MorphCollection(res.endToken.morph);
        if (res !== null && res.lengthChar === 2 && ((res.typ === "АО" || res.typ === "УК"))) {
            res.isDoubtRootWord = true;
            let tt1 = res.endToken.next;
            if (tt1 !== null) {
                if (res.typ === "АО" && ((tt1.isValue("УК", null) || tt1.isValue("СК", null)))) 
                    res.isDoubtRootWord = false;
                else if (BracketHelper.canBeStartOfSequence(tt1, true, false)) 
                    res.isDoubtRootWord = false;
                else if (res.typ === "УК") 
                    return null;
            }
        }
        if (res !== null && res.typ === "администрация" && t.next !== null) {
            if ((t.next.isChar('(') && t.next.next !== null && ((t.next.next.isValue("ПРАВИТЕЛЬСТВО", null) || t.next.next.isValue("ГУБЕРНАТОР", null)))) && t.next.next.next !== null && t.next.next.next.isChar(')')) {
                res.endToken = t.next.next.next;
                res.altTyp = "правительство";
                return res;
            }
            if (t.next.getReferent() instanceof GeoReferent) 
                res.altTyp = "правительство";
        }
        if ((res !== null && res.typ === "ассоциация" && res.endToken.next !== null) && (res.whitespacesAfterCount < 2)) {
            let npt = NounPhraseHelper.tryParse(res.endToken.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                let str = MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO);
                res.name = (((res.name != null ? res.name : (res !== null && res.typ !== null ? res.typ.toUpperCase() : null))) + " " + str);
                res.endToken = npt.endToken;
                res.coef = res.coef + (1);
            }
        }
        if ((res !== null && res.typ === "представительство" && res.endToken.next !== null) && (res.whitespacesAfterCount < 2)) {
            let npt = NounPhraseHelper.tryParse(res.endToken.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                if (npt.endToken.isValue("ИНТЕРЕС", null)) 
                    return null;
            }
        }
        if (res !== null && res.name !== null) {
            if (res.name.endsWith(" ПОЛОК")) 
                res.name = res.name.substring(0, 0 + res.name.length - 5) + "ПОЛК";
        }
        if (res !== null && ((res.typ === "производитель" || res.typ === "завод"))) {
            let tt1 = res.endToken.next;
            if (res.typ === "завод") {
                if ((tt1 !== null && tt1.isValue("ПО", null) && tt1.next !== null) && tt1.next.isValue("ПРОИЗВОДСТВО", null)) 
                    tt1 = tt1.next.next;
            }
            let npt = NounPhraseHelper.tryParse(tt1, NounPhraseParseAttr.NO, 0, null);
            if ((npt !== null && (res.whitespacesAfterCount < 2) && tt1.chars.isAllLower) && npt.morph._case.isGenitive) {
                let str = MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO);
                res.name = (((res.name != null ? res.name : (res !== null && res.typ !== null ? res.typ.toUpperCase() : null))) + " " + str);
                if (res.geo !== null) 
                    res.coef = res.coef + (1);
                res.endToken = npt.endToken;
            }
            else if (res.typ !== "завод") 
                return null;
        }
        if (res !== null && (res.beginToken.previous instanceof TextToken) && ((res.typ === "милиция" || res.typ === "полиция"))) {
        }
        if ((res !== null && res.beginToken === res.endToken && (res.beginToken instanceof TextToken)) && res.beginToken.term === "ИП") {
            if (!BracketHelper.canBeStartOfSequence(res.endToken.next, true, false) && !BracketHelper.canBeEndOfSequence(res.beginToken.previous, false, null, false)) 
                return null;
        }
        if (res !== null && res.typ === "предприятие") {
            if (res.altTyp === "головное предприятие" || res.altTyp === "дочернее предприятие") 
                res.isNotTyp = true;
            else if (t.previous !== null && ((t.previous.isValue("ГОЛОВНОЙ", null) || t.previous.isValue("ДОЧЕРНИЙ", null)))) 
                return null;
        }
        if (res !== null && res.isDouterOrg) {
            res.isNotTyp = true;
            if (res.beginToken !== res.endToken) {
                let res1 = OrgItemTypeToken._TryAttach(res.beginToken.next, true, false);
                if (res1 !== null && !res1.isDoubtRootWord) 
                    res.isNotTyp = false;
            }
        }
        if (res !== null && res.typ === "суд") {
            let tt1 = Utils.as(res.endToken, TextToken);
            if (tt1 !== null && ((tt1.term === "СУДА" || tt1.term === "СУДОВ"))) {
                if (((res.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                    return null;
            }
        }
        if (res !== null && res.typ === "кафедра" && (t instanceof TextToken)) {
            if (t.isValue("КАФЕ", null) && ((t.next === null || !t.next.isChar('.')))) 
                return null;
        }
        if (res !== null && res.typ === "компания") {
            if ((t.previous !== null && t.previous.isHiphen && t.previous.previous !== null) && t.previous.previous.isValue("КАЮТ", null)) 
                return null;
        }
        if (res !== null && t.previous !== null) {
            if (res.morph._case.isGenitive) {
                if (t.previous.isValue("СТАНДАРТ", null)) 
                    return null;
            }
        }
        if (res !== null && res.typ === "радиостанция" && res.nameWordsCount > 1) 
            return null;
        if ((res !== null && res.typ === "предприятие" && res.altTyp !== null) && res.beginToken.morph._class.isAdjective && !res.root.isPurePrefix) {
            res.typ = res.altTyp;
            res.altTyp = null;
            res.coef = 3;
        }
        if (res !== null) {
            let npt = NounPhraseHelper.tryParse(res.endToken.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && ((npt.noun.isValue("ТИП", null) || npt.noun.isValue("РЕЖИМ", null))) && npt.morph._case.isGenitive) {
                res.endToken = npt.endToken;
                let s = (res.typ + " " + MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO)).toLowerCase();
                if (res.typ.includes("колония") || res.typ.includes("тюрьма")) {
                    res.coef = 3;
                    res.altTyp = s;
                }
                else if (res.name === null || res.name.length === res.typ.length) 
                    res.name = s;
                else 
                    res.altTyp = s;
            }
        }
        if (res !== null && res.profiles.includes(OrgProfile.EDUCATION) && (res.endToken.next instanceof TextToken)) {
            let tt1 = res.endToken.next;
            if (tt1.term === "ВПО" || tt1.term === "СПО") 
                res.endToken = res.endToken.next;
            else {
                let nnt = NounPhraseHelper.tryParse(tt1, NounPhraseParseAttr.NO, 0, null);
                if (nnt !== null && nnt.endToken.isValue("ОБРАЗОВАНИЕ", "ОСВІТА")) 
                    res.endToken = nnt.endToken;
            }
        }
        if (res !== null && res.root !== null && res.root.isPurePrefix) {
            let tt1 = res.endToken.next;
            if (tt1 !== null && ((tt1.isValue("С", null) || tt1.isValue("C", null)))) {
                let npt = NounPhraseHelper.tryParse(tt1.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && ((npt.noun.isValue("ИНВЕСТИЦИЯ", null) || npt.noun.isValue("ОТВЕТСТВЕННОСТЬ", null)))) 
                    res.endToken = npt.endToken;
            }
        }
        if (res !== null && res.root === OrgItemTypeToken.m_MilitaryUnit && res.endToken.next !== null) {
            if (res.endToken.next.isValue("ПП", null)) 
                res.endToken = res.endToken.next;
            else if (res.endToken.next.isValue("ПОЛЕВОЙ", null) && res.endToken.next.next !== null && res.endToken.next.next.isValue("ПОЧТА", null)) 
                res.endToken = res.endToken.next.next;
        }
        if (res !== null) {
            if (res.nameWordsCount > 1 && res.typ === "центр") 
                res.canBeDepBeforeOrganization = true;
            else if (LanguageHelper.endsWith(res.typ, " центр")) 
                res.canBeDepBeforeOrganization = true;
            if (t.isValue("ГПК", null)) {
                if (res.geo !== null) 
                    return null;
                let gg = t.kit.processReferent("GEO", t.next, null);
                if (gg !== null || !(t.next instanceof TextToken) || t.isNewlineAfter) 
                    return null;
                if (t.next.chars.isAllUpper || t.next.chars.isCapitalUpper || BracketHelper.canBeStartOfSequence(t.next, true, false)) {
                }
                else 
                    return null;
            }
        }
        let tt = Utils.as(t, TextToken);
        let term = (tt === null ? null : tt.term);
        if (res !== null && ((term === "ГК" || term === "ТК" || term === "УК")) && res.beginToken === res.endToken) {
            if (res.geo !== null) 
                return null;
            if ((t.next instanceof TextToken) && t.next.lengthChar === 2 && t.next.chars.isAllUpper) 
                return null;
            if ((t.next instanceof ReferentToken) && (t.next.getReferent() instanceof GeoReferent)) 
                return null;
        }
        if (((res !== null && res.geo === null && res.root !== null) && res.root.typ === OrgItemTypeTyp.PREFIX && (res.endToken.next instanceof ReferentToken)) && (res.endToken.next.getReferent() instanceof GeoReferent)) {
            res.endToken = res.endToken.next;
            res.geo = Utils.as(res.endToken, ReferentToken);
        }
        if (res !== null || tt === null) 
            return res;
        if (tt.chars.isAllUpper && (((term === "CRM" || term === "IT" || term === "ECM") || term === "BPM" || term === "HR"))) {
            let tt2 = t.next;
            if (tt2 !== null && tt2.isHiphen) 
                tt2 = tt2.next;
            res = OrgItemTypeToken._TryAttach(tt2, true, false);
            if (res !== null && res.root !== null && res.root.profiles.includes(OrgProfile.UNIT)) {
                res.name = (((res.name != null ? res.name : (res !== null && res.root !== null ? res.root.canonicText : null))) + " " + term);
                res.beginToken = t;
                res.coef = 5;
                return res;
            }
        }
        if (term === "ВЧ") {
            let tt1 = t.next;
            if (tt1 !== null && tt1.isValue("ПП", null)) 
                res = OrgItemTypeToken._new2392(t, tt1, 3);
            else if ((tt1 instanceof NumberToken) && (tt1.whitespacesBeforeCount < 3)) 
                res = new OrgItemTypeToken(t, t);
            else if (MiscHelper.checkNumberPrefix(tt1) !== null) 
                res = new OrgItemTypeToken(t, t);
            else if (((tt1 instanceof TextToken) && !tt1.isWhitespaceAfter && tt1.chars.isLetter) && tt1.lengthChar === 1) 
                res = new OrgItemTypeToken(t, t);
            if (res !== null) {
                res.root = OrgItemTypeToken.m_MilitaryUnit;
                res.typ = OrgItemTypeToken.m_MilitaryUnit.canonicText.toLowerCase();
                res.profiles.push(OrgProfile.ARMY);
                return res;
            }
        }
        if ((term === "ТС" && t.chars.isAllUpper && (t.previous instanceof TextToken)) && (t.whitespacesBeforeCount < 3)) {
            let ok = false;
            if (t.previous.isValue("КОДЕКС", null)) 
                ok = true;
            else if (t.previous.lengthChar === 2 && t.previous.chars.isAllUpper && t.previous.term.endsWith("К")) 
                ok = true;
            if (ok) {
                res = OrgItemTypeToken._new2393(t, t, "союз", "ТАМОЖЕННЫЙ СОЮЗ", 4);
                return res;
            }
        }
        if (term === "КБ") {
            let cou = 0;
            let ok = false;
            for (let ttt = t.next; ttt !== null && (cou < 30); ttt = ttt.next,cou++) {
                if (ttt.isValue("БАНК", null)) {
                    ok = true;
                    break;
                }
                let r = ttt.getReferent();
                if (r !== null && r.typeName === "URI") {
                    let vv = r.getStringValue("SCHEME");
                    if ((vv === "БИК" || vv === "Р/С" || vv === "К/С") || vv === "ОКАТО") {
                        ok = true;
                        break;
                    }
                }
            }
            if (ok) {
                res = new OrgItemTypeToken(t, t);
                res.typ = "коммерческий банк";
                res.profiles.push(OrgProfile.FINANCE);
                res.coef = 3;
                return res;
            }
        }
        if (tt.isValue("СОВЕТ", "РАДА")) {
            if (tt.next !== null && tt.next.isValue("ПРИ", null)) {
                let rt = tt.kit.processReferent("PERSONPROPERTY", tt.next.next, null);
                if (rt !== null) {
                    res = new OrgItemTypeToken(tt, tt);
                    res.typ = "совет";
                    res.isDep = true;
                    res.coef = 2;
                    return res;
                }
            }
            if (tt.next !== null && (tt.next.getReferent() instanceof GeoReferent) && !tt.chars.isAllLower) {
                res = new OrgItemTypeToken(tt, tt);
                res.geo = Utils.as(tt.next, ReferentToken);
                res.typ = "совет";
                res.isDep = true;
                res.coef = 4;
                res.profiles.push(OrgProfile.STATE);
                return res;
            }
        }
        let say = false;
        if ((((term === "СООБЩАЕТ" || term === "СООБЩЕНИЮ" || term === "ПИШЕТ") || term === "ПЕРЕДАЕТ" || term === "ПОВІДОМЛЯЄ") || term === "ПОВІДОМЛЕННЯМ" || term === "ПИШЕ") || term === "ПЕРЕДАЄ") 
            say = true;
        if (((say || tt.isValue("ОБЛОЖКА", "ОБКЛАДИНКА") || tt.isValue("РЕДАКТОР", null)) || tt.isValue("КОРРЕСПОНДЕНТ", "КОРЕСПОНДЕНТ") || tt.isValue("ЖУРНАЛИСТ", "ЖУРНАЛІСТ")) || term === "ИНТЕРВЬЮ" || term === "ІНТЕРВЮ") {
            if (OrgItemTypeToken.m_PressRU === null) 
                OrgItemTypeToken.m_PressRU = OrgItemTypeTermin._new2394("ИЗДАНИЕ", MorphLang.RU, OrgProfile.MEDIA, true, 4);
            if (OrgItemTypeToken.m_PressUA === null) 
                OrgItemTypeToken.m_PressUA = OrgItemTypeTermin._new2394("ВИДАННЯ", MorphLang.UA, OrgProfile.MEDIA, true, 4);
            let pres = (tt.kit.baseLanguage.isUa ? OrgItemTypeToken.m_PressUA : OrgItemTypeToken.m_PressRU);
            let t1 = t.next;
            if (t1 === null) 
                return null;
            if (t1.chars.isLatinLetter && !t1.chars.isAllLower) {
                if (tt.isValue("РЕДАКТОР", null)) 
                    return null;
                return OrgItemTypeToken._new2396(t, t, pres.canonicText.toLowerCase(), pres, true);
            }
            if (!say) {
                let br = BracketHelper.tryParse(t1, BracketParseAttr.NO, 100);
                if ((br !== null && br.isQuoteType && !t1.next.chars.isAllLower) && ((br.endChar - br.beginChar) < 40)) 
                    return OrgItemTypeToken._new2396(t, t, pres.canonicText.toLowerCase(), pres, true);
            }
            let npt = NounPhraseHelper.tryParse(t1, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.endToken.next !== null) {
                t1 = npt.endToken.next;
                let _root = npt.noun.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                let ok = t1.chars.isLatinLetter && !t1.chars.isAllLower;
                if (!ok && BracketHelper.canBeStartOfSequence(t1, true, false)) 
                    ok = true;
                if (ok) {
                    if ((_root === "ИЗДАНИЕ" || _root === "ИЗДАТЕЛЬСТВО" || _root === "ЖУРНАЛ") || _root === "ВИДАННЯ" || _root === "ВИДАВНИЦТВО") {
                        res = OrgItemTypeToken._new2398(npt.beginToken, npt.endToken, _root.toLowerCase());
                        res.profiles.push(OrgProfile.MEDIA);
                        res.profiles.push(OrgProfile.PRESS);
                        if (npt.adjectives.length > 0) {
                            for (const a of npt.adjectives) {
                                let rt1 = res.kit.processReferent("GEO", a.beginToken, null);
                                if (rt1 !== null && rt1.morph._class.isAdjective) {
                                    if (res.geo === null) 
                                        res.geo = rt1;
                                    else 
                                        res.geo2 = rt1;
                                }
                            }
                            res.altTyp = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false).toLowerCase();
                        }
                        res.root = OrgItemTypeTermin._new2399(_root, true, 4);
                        return res;
                    }
                }
            }
            let rt = t1.kit.processReferent("GEO", t1, null);
            if (rt !== null && rt.morph._class.isAdjective) {
                if (rt.endToken.next !== null && rt.endToken.next.chars.isLatinLetter) {
                    res = OrgItemTypeToken._new2400(t1, rt.endToken, pres.canonicText.toLowerCase(), pres);
                    res.geo = rt;
                    return res;
                }
            }
            let tt1 = t1;
            if (BracketHelper.canBeStartOfSequence(tt1, true, false)) 
                tt1 = t1.next;
            if ((((tt1.chars.isLatinLetter && tt1.next !== null && tt1.next.isChar('.')) && tt1.next.next !== null && tt1.next.next.chars.isLatinLetter) && (tt1.next.next.lengthChar < 4) && tt1.next.next.lengthChar > 1) && !tt1.next.isWhitespaceAfter) {
                if (tt1 !== t1 && !BracketHelper.canBeEndOfSequence(tt1.next.next.next, true, t1, false)) {
                }
                else {
                    res = OrgItemTypeToken._new2400(t1, tt1.next.next, pres.canonicText.toLowerCase(), pres);
                    res.name = Utils.replaceString(MiscHelper.getTextValue(t1, tt1.next.next, GetTextAttr.NO), " ", "");
                    if (tt1 !== t1) 
                        res.endToken = res.endToken.next;
                    res.coef = 4;
                }
                return res;
            }
        }
        else if ((t.isValue("ЖУРНАЛ", null) || t.isValue("ИЗДАНИЕ", null) || t.isValue("ИЗДАТЕЛЬСТВО", null)) || t.isValue("ВИДАННЯ", null) || t.isValue("ВИДАВНИЦТВО", null)) {
            let ok = false;
            let ad = OrganizationAnalyzer.getData(t);
            if (ad !== null) {
                let otExLi = ad.localOntology.tryAttach(t.next, null, false);
                if (otExLi === null && t.kit.ontology !== null) 
                    otExLi = t.kit.ontology.attachToken(OrganizationReferent.OBJ_TYPENAME, t.next);
                if ((otExLi !== null && otExLi.length > 0 && otExLi[0].item !== null) && (otExLi[0].item.referent instanceof OrganizationReferent)) {
                    if (otExLi[0].item.referent.kind === OrganizationKind.PRESS) 
                        ok = true;
                }
            }
            if (t.next !== null && t.next.chars.isLatinLetter && !t.next.chars.isAllLower) 
                ok = true;
            if (ok) {
                res = OrgItemTypeToken._new2398(t, t, t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false).toLowerCase());
                res.profiles.push(OrgProfile.MEDIA);
                res.profiles.push(OrgProfile.PRESS);
                res.root = OrgItemTypeTermin._new2403(t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), OrgItemTypeTyp.ORG, 3, true);
                res.morph = t.morph;
                res.chars = t.chars;
                if (t.previous !== null && t.previous.morph._class.isAdjective) {
                    let rt = t.kit.processReferent("GEO", t.previous, null);
                    if (rt !== null && rt.endToken === t.previous) {
                        res.beginToken = t.previous;
                        res.geo = rt;
                    }
                }
                return res;
            }
        }
        else if ((term === "МО" && t.chars.isAllUpper && (t.next instanceof ReferentToken)) && (t.next.getReferent() instanceof GeoReferent)) {
            let _geo = Utils.as(t.next.getReferent(), GeoReferent);
            if (_geo !== null && _geo.isState) {
                res = OrgItemTypeToken._new2404(t, t, "министерство", "МИНИСТЕРСТВО ОБОРОНЫ", 4, OrgItemTypeToken.m_MO);
                res.profiles.push(OrgProfile.STATE);
                res.canBeOrganization = true;
                return res;
            }
        }
        else if ((term === "СУ" && t.chars.isAllUpper && t.previous !== null) && t.previous.isValue("СУДЬЯ", null)) 
            return OrgItemTypeToken._new2405(t, t, "судебный участок", OrgItemTypeToken.m_SudUch, true);
        else if (term === "ИК" && t.chars.isAllUpper) {
            let et = null;
            if (OrgItemNumberToken.tryAttach(t.next, false, null) !== null) 
                et = t;
            else if (t.next !== null && (t.next instanceof NumberToken)) 
                et = t;
            else if ((t.next !== null && t.next.isHiphen && t.next.next !== null) && (t.next.next instanceof NumberToken)) 
                et = t.next;
            if (et !== null) 
                return OrgItemTypeToken._new2406(t, et, "исправительная колония", "колония", OrgItemTypeToken.m_IsprKolon, true);
        }
        else if (t.isValue("ПАКЕТ", null) && t.next !== null && t.next.isValue("АКЦИЯ", "АКЦІЯ")) 
            return OrgItemTypeToken._new2407(t, t.next, 4, true, "");
        else {
            let tok = OrgItemTypeToken.m_PrefWords.tryParse(t, TerminParseAttr.NO);
            if (tok !== null && tok.tag !== null) {
                if ((tok.whitespacesAfterCount < 2) && BracketHelper.canBeStartOfSequence(tok.endToken.next, true, false)) 
                    return OrgItemTypeToken._new2407(t, tok.endToken, 4, true, "");
            }
        }
        if (res === null && term === "АК" && t.chars.isAllUpper) {
            if (OrgItemTypeToken.tryAttach(t.next, canBeFirstLetterLower) !== null) 
                return OrgItemTypeToken._new2409(t, t, OrgItemTypeToken.m_AkcionComp, OrgItemTypeToken.m_AkcionComp.canonicText.toLowerCase());
        }
        if ((res === null && term === "МО" && t.next !== null) && (t.whitespacesAfterCount < 2)) {
            let org1 = Utils.as(t.next.getReferent(), OrganizationReferent);
            if (org1 !== null || t.next.isValue("МВД", null)) 
                return OrgItemTypeToken._new2409(t, t, OrgItemTypeToken.M_MEJMUN_OTDEL, OrgItemTypeToken.M_MEJMUN_OTDEL.canonicText.toLowerCase());
        }
        if (term === "В") {
            if ((t.next !== null && t.next.isCharOf("\\/") && t.next.next !== null) && t.next.next.isValue("Ч", null)) {
                if (OrgItemNumberToken.tryAttach(t.next.next.next, true, null) !== null) 
                    return OrgItemTypeToken._new2409(t, t.next.next, OrgItemTypeToken.m_MilitaryUnit, OrgItemTypeToken.m_MilitaryUnit.canonicText.toLowerCase());
            }
        }
        if ((t.morph._class.isAdjective && t.next !== null && (t.whitespacesAfterCount < 3)) && ((t.next.chars.isAllUpper || t.next.chars.isLastLower))) {
            if (t.chars.isCapitalUpper || (((t.previous !== null && t.previous.isHiphen && t.previous.previous !== null) && t.previous.previous.chars.isCapitalUpper))) {
                let res1 = OrgItemTypeToken._TryAttach(t.next, true, false);
                if ((res1 !== null && res1.endToken === t.next && res1.name === null) && res1.root !== null) {
                    res1.beginToken = t;
                    res1.coef = 5;
                    let gen = MorphGender.UNDEFINED;
                    for (let ii = res1.root.canonicText.length - 1; ii >= 0; ii--) {
                        if (ii === 0 || res1.root.canonicText[ii - 1] === ' ') {
                            try {
                                let mm = MorphologyService.getWordBaseInfo(res1.root.canonicText.substring(ii), null, false, false);
                                gen = mm.gender;
                            } catch (ex2412) {
                            }
                            break;
                        }
                    }
                    let nam = t.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, gen, false);
                    if (((t.previous !== null && t.previous.isHiphen && (t.previous.previous instanceof TextToken)) && t.previous.previous.chars.isCapitalUpper && !t.isWhitespaceBefore) && !t.previous.isWhitespaceBefore) {
                        res1.beginToken = t.previous.previous;
                        nam = (res1.beginToken.term + "-" + nam);
                    }
                    res1.name = nam;
                    return res1;
                }
            }
        }
        if ((t.morph._class.isAdjective && !term.endsWith("ВО") && !t.chars.isAllLower) && (t.whitespacesAfterCount < 2)) {
            let res1 = OrgItemTypeToken._TryAttach(t.next, true, false);
            if ((res1 !== null && res1.profiles.includes(OrgProfile.TRANSPORT) && res1.name === null) && res1.root !== null) {
                let nam = t.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, (res1.root.canonicText.endsWith("ДОРОГА") ? MorphGender.FEMINIE : MorphGender.MASCULINE), false);
                if (nam !== null) {
                    if (((t.previous !== null && t.previous.isHiphen && (t.previous.previous instanceof TextToken)) && t.previous.previous.chars.isCapitalUpper && !t.isWhitespaceBefore) && !t.previous.isWhitespaceBefore) {
                        t = t.previous.previous;
                        nam = (t.term + "-" + nam);
                    }
                    res1.beginToken = t;
                    res1.coef = 5;
                    res1.name = (nam + " " + res1.root.canonicText);
                    res1.canBeOrganization = true;
                    return res1;
                }
            }
        }
        if (res === null && t.morph._class.isAdjective) {
            let rt = t.kit.processReferent("GEO", t, null);
            if (rt !== null && rt.morph._class.isAdjective && (rt.whitespacesAfterCount < 3)) {
                let _next = OrgItemTypeToken.tryAttach(rt.endToken.next, false);
                if (_next !== null && _next.geo === null) {
                    _next.beginToken = t;
                    _next.geo = rt;
                    res = _next;
                }
            }
        }
        return res;
    }
    
    static tryAttachSpec(t, canBeFirstLetterLower) {
        if (t === null) 
            return null;
        if (t.chars.isLatinLetter) {
            if ((t.getReferent() instanceof GeoReferent) && (t.next instanceof TextToken) && t.next.chars.isLatinLetter) {
                let res1 = OrgItemTypeToken.tryAttach(t.next, canBeFirstLetterLower);
                if (res1 !== null) {
                    res1 = res1.clone();
                    res1.beginToken = t;
                    res1.geo = Utils.as(t, ReferentToken);
                    res1.name = MiscHelper.getTextValueOfMetaToken(res1, GetTextAttr.NO);
                    return res1;
                }
            }
        }
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let term = tt.term;
        if (term === "ТП" || term === "МП") {
            let num = OrgItemNumberToken.tryAttach(t.next, true, null);
            if (num !== null && num.endToken.next !== null) {
                let tt1 = num.endToken.next;
                if (tt1.isComma && tt1.next !== null) 
                    tt1 = tt1.next;
                let oo = Utils.as(tt1.getReferent(), OrganizationReferent);
                if (oo !== null) {
                    if (oo.toString().toUpperCase().includes("МИГРАЦ")) 
                        return OrgItemTypeToken._new2413(t, t, (term === "ТП" ? "территориальный пункт" : "миграционный пункт"), 4, true);
                }
            }
        }
        if (tt.chars.isAllUpper && term === "МГТУ") {
            if (tt.next.isValue("БАНК", null) || (((tt.next.getReferent() instanceof OrganizationReferent) && tt.next.getReferent().kind === OrganizationKind.BANK)) || ((tt.previous !== null && tt.previous.isValue("ОПЕРУ", null)))) {
                let res = OrgItemTypeToken._new2398(tt, tt, "главное территориальное управление");
                res.altTyp = "ГТУ";
                res.name = "МОСКОВСКОЕ";
                res.nameIsName = true;
                res.altName = "МГТУ";
                res.coef = 3;
                res.root = new OrgItemTypeTermin(res.name);
                res.profiles.push(OrgProfile.UNIT);
                tt.term = "МОСКОВСКИЙ";
                res.geo = tt.kit.processReferent("GEO", tt, null);
                tt.term = "МГТУ";
                return res;
            }
        }
        return null;
    }
    
    static _TryAttach(t, canBeFirstLetterLower, onlyKeywords = false) {
        if (t === null) 
            return null;
        let res = null;
        let li = OrgItemTypeToken.m_Global.tryAttach(t, null, false);
        if (li !== null) {
            if (t.previous !== null && t.previous.isHiphen && !t.isWhitespaceBefore) {
                let li1 = OrgItemTypeToken.m_Global.tryAttach(t.previous.previous, null, false);
                if (li1 !== null && li1[0].endToken === li[0].endToken) 
                    return null;
            }
            res = new OrgItemTypeToken(li[0].beginToken, li[0].endToken);
            res.root = Utils.as(li[0].termin, OrgItemTypeTermin);
            let nn = NounPhraseHelper.tryParse(li[0].beginToken, NounPhraseParseAttr.NO, 0, null);
            if (nn !== null && ((nn.endToken.next === null || !nn.endToken.next.isChar('.')))) 
                res.morph = nn.morph;
            else 
                res.morph = li[0].morph;
            res.charsRoot = res.chars;
            if (res.root.isPurePrefix) {
                res.typ = res.root.acronym;
                if (res.typ === null) 
                    res.typ = res.root.canonicText.toLowerCase();
            }
            else 
                res.typ = res.root.canonicText.toLowerCase();
            if (res.beginToken !== res.endToken && !res.root.isPurePrefix) {
                let npt0 = NounPhraseHelper.tryParse(res.beginToken, NounPhraseParseAttr.NO, 0, null);
                if (npt0 !== null && npt0.endToken === res.endToken && npt0.adjectives.length >= res.nameWordsCount) {
                    let s = npt0.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                    if (Utils.compareStrings(s, res.typ, true) !== 0) {
                        res.name = s;
                        res.canBeOrganization = true;
                    }
                }
            }
            if (res.typ === "сберегательный банк" && res.name === null) {
                res.name = res.typ.toUpperCase();
                res.typ = "банк";
            }
            if (res.isDep && res.typ.startsWith("отдел ") && res.name === null) {
                res.name = res.typ.toUpperCase();
                res.typ = "отдел";
            }
            if (res.beginToken === res.endToken) {
                if (res.chars.isCapitalUpper) {
                    if ((res.lengthChar < 4) && !res.beginToken.isValue(res.root.canonicText, null)) {
                        if (!canBeFirstLetterLower) 
                            return null;
                    }
                }
                if (res.chars.isAllUpper) {
                    if (res.beginToken.isValue("САН", null)) 
                        return null;
                }
            }
            if (res.endToken.next !== null && res.endToken.next.isChar('(')) {
                let li22 = OrgItemTypeToken.m_Global.tryAttach(res.endToken.next.next, null, false);
                if ((li22 !== null && li22.length > 0 && li22[0].termin === li[0].termin) && li22[0].endToken.next !== null && li22[0].endToken.next.isChar(')')) 
                    res.endToken = li22[0].endToken.next;
            }
            return res;
        }
        if (onlyKeywords) 
            return null;
        if ((t instanceof NumberToken) && t.morph._class.isAdjective) {
        }
        else if (t instanceof TextToken) {
        }
        else if ((t instanceof ReferentToken) && (t.getReferent() instanceof GeoReferent) && t.endToken.morph._class.isAdjective) {
        }
        else 
            return null;
        if (t.isValue("СБ", null)) {
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let _geo = Utils.as(t.next.getReferent(), GeoReferent);
                if (_geo.isState) {
                    if (_geo.alpha2 !== "RU") 
                        return OrgItemTypeToken._new2415(t, t, "управление", true, OrgItemTypeToken.m_SecServ, OrgItemTypeToken.m_SecServ.canonicText);
                }
                return OrgItemTypeToken._new2415(t, t, "банк", true, OrgItemTypeToken.m_SberBank, OrgItemTypeToken.m_SberBank.canonicText);
            }
        }
        let mc0 = t.getMorphClassInDictionary();
        let npt = (mc0.isPronoun ? null : NounPhraseHelper.tryParse(t, NounPhraseParseAttr.IGNOREADJBEST, 0, null));
        if (npt !== null && npt.beginToken !== npt.endToken && mc0.isVerb) {
            if (t.isValue("ВЫДАННЫЙ", null)) 
                npt = null;
        }
        if (((npt === null && t.chars.isCapitalUpper && t.next !== null) && t.next.isHiphen && !t.isWhitespaceAfter) && !t.next.isWhitespaceAfter) {
            npt = NounPhraseHelper.tryParse(t.next.next, NounPhraseParseAttr.IGNOREADJBEST, 0, null);
            if (npt !== null && npt.adjectives.length > 0) {
                npt.beginToken = t;
                npt.adjectives[0].beginToken = t;
            }
            else 
                npt = null;
        }
        if ((npt === null && (t instanceof ReferentToken) && (t.getReferent() instanceof GeoReferent)) && t.endToken.morph._class.isAdjective && (t.whitespacesAfterCount < 3)) {
            let res1 = OrgItemTypeToken._TryAttach(t.next, true, false);
            if (res1 !== null && res1.root !== null && res1.root.canBeSingleGeo) {
                res1.beginToken = t;
                res1.geo = Utils.as(t, ReferentToken);
                let nam = MiscHelper.getTextValueOfMetaToken(Utils.as(t, ReferentToken), GetTextAttr.NO);
                res1.name = (nam + " " + ((res1.name != null ? res1.name : (res1 !== null && res1.typ !== null ? res1.typ.toUpperCase() : null))));
                return res1;
            }
        }
        if (npt !== null && npt.beginToken !== npt.endToken && npt.beginToken.getMorphClassInDictionary().isProperSurname) {
            if (npt.beginToken.previous !== null && npt.beginToken.previous.getMorphClassInDictionary().isProperName) 
                npt = null;
        }
        if (npt === null || npt.internalNoun !== null) {
            if (((!t.chars.isAllLower && t.next !== null && t.next.isHiphen) && !t.isWhitespaceAfter && !t.next.isWhitespaceAfter) && t.next.next !== null && t.next.next.isValue("БАНК", null)) {
                let s = t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                res = OrgItemTypeToken._new2417(t, t.next.next, s, t.next.next.morph, t.chars, t.next.next.chars);
                res.root = OrgItemTypeToken.m_Bank;
                res.typ = "банк";
                return res;
            }
            if ((t instanceof NumberToken) && (t.whitespacesAfterCount < 3) && (t.next instanceof TextToken)) {
                let res11 = OrgItemTypeToken._TryAttach(t.next, false, false);
                if (res11 !== null && res11.root !== null && res11.root.canHasNumber) {
                    res11.beginToken = t;
                    res11.number = t.value.toString();
                    res11.coef = res11.coef + (1);
                    return res11;
                }
            }
            return null;
        }
        if (npt.morph.gender === MorphGender.FEMINIE && npt.noun.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false) === "БАНКА") 
            return null;
        if (npt.beginToken === npt.endToken) {
            let s = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
            if (LanguageHelper.endsWithEx(s, "БАНК", "БАНКА", "БАНОК", null)) {
                if (LanguageHelper.endsWith(s, "БАНКА")) 
                    s = s.substring(0, 0 + s.length - 1);
                else if (LanguageHelper.endsWith(s, "БАНОК")) 
                    s = s.substring(0, 0 + s.length - 2) + "К";
                res = OrgItemTypeToken._new2417(npt.beginToken, npt.endToken, s, npt.morph, npt.chars, npt.chars);
                res.root = OrgItemTypeToken.m_Bank;
                res.typ = "банк";
                return res;
            }
            return null;
        }
        let t0 = npt.beginToken;
        for (let tt = npt.endToken; tt !== null; tt = tt.previous) {
            if (tt === npt.beginToken) 
                break;
            let lii = OrgItemTypeToken.m_Global.tryAttach(tt, null, false);
            if (lii !== null) {
                if (tt === npt.endToken && tt.previous !== null && tt.previous.isHiphen) 
                    continue;
                li = lii;
                if (li[0].endChar < npt.endChar) 
                    npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.IGNOREADJBEST, li[0].endChar, null);
                else {
                    let mc = t0.getMorphClassInDictionary();
                    if (mc.isVerb && t0.chars.isAllLower) 
                        t0 = tt;
                }
                break;
            }
        }
        if (li === null || npt === null) 
            return null;
        res = new OrgItemTypeToken(t0, li[0].endToken);
        for (const a of npt.adjectives) {
            if (a.isValue("ДОЧЕРНИЙ", null) || a.isValue("ДОЧІРНІЙ", null)) {
                res.isDouterOrg = true;
                break;
            }
        }
        for (const em of OrgItemTypeToken.M_EMPTY_TYP_WORDS) {
            for (const a of npt.adjectives) {
                if (a.isValue(em, null)) {
                    Utils.removeItem(npt.adjectives, a);
                    break;
                }
            }
        }
        while (npt.adjectives.length > 0) {
            if (npt.adjectives[0].beginToken.getMorphClassInDictionary().isVerb) 
                npt.adjectives.splice(0, 1);
            else if (npt.adjectives[0].beginToken instanceof NumberToken) {
                res.number = npt.adjectives[0].beginToken.value.toString();
                npt.adjectives.splice(0, 1);
            }
            else 
                break;
        }
        if (npt.adjectives.length > 0) {
            res.altTyp = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
            if (li[0].endChar > npt.endChar) 
                res.altTyp = (res.altTyp + " " + MiscHelper.getTextValue(npt.endToken.next, li[0].endToken, GetTextAttr.NO));
        }
        if (res.number === null) {
            while (npt.adjectives.length > 0) {
                if (!npt.adjectives[0].chars.isAllLower || canBeFirstLetterLower) 
                    break;
                if (npt.kit.processReferent("GEO", npt.adjectives[0].beginToken, null) !== null) 
                    break;
                if (OrgItemTypeToken.isStdAdjective(npt.adjectives[0], false)) 
                    break;
                let bad = false;
                if (!npt.noun.chars.isAllLower || !OrgItemTypeToken.isStdAdjective(npt.adjectives[0], false)) 
                    bad = true;
                else 
                    for (let i = 1; i < npt.adjectives.length; i++) {
                        if (npt.kit.processReferent("GEO", npt.adjectives[i].beginToken, null) !== null) 
                            continue;
                        if (!npt.adjectives[i].chars.isAllLower) {
                            bad = true;
                            break;
                        }
                    }
                if (!bad) 
                    break;
                npt.adjectives.splice(0, 1);
            }
        }
        for (const a of npt.adjectives) {
            let r = npt.kit.processReferent("GEO", a.beginToken, null);
            if (r !== null) {
                if (a === npt.adjectives[0]) {
                    let res2 = OrgItemTypeToken._TryAttach(a.endToken.next, true, false);
                    if (res2 !== null && res2.endChar > npt.endChar && res2.geo === null) {
                        res2.beginToken = a.beginToken;
                        res2.geo = r;
                        return res2;
                    }
                }
                if (res.geo === null) 
                    res.geo = r;
                else if (res.geo2 === null) 
                    res.geo2 = r;
            }
        }
        if (res.endToken === npt.endToken) 
            res.name = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
        if (res.name === res.altTyp) 
            res.altTyp = null;
        if (res.altTyp !== null) 
            res.altTyp = Utils.replaceString(res.altTyp.toLowerCase(), '-', ' ');
        res.root = Utils.as(li[0].termin, OrgItemTypeTermin);
        if (res.root.isPurePrefix && (li[0].lengthChar < 7)) 
            return null;
        res.typ = res.root.canonicText.toLowerCase();
        if (npt.adjectives.length > 0) {
            for (let i = 0; i < npt.adjectives.length; i++) {
                let s = npt.getNormalCaseTextWithoutAdjective(i);
                let ctli = OrgItemTypeToken.m_Global.findTerminByCanonicText(s);
                if (ctli !== null && ctli.length > 0 && (ctli[0] instanceof OrgItemTypeTermin)) {
                    res.root = Utils.as(ctli[0], OrgItemTypeTermin);
                    if (res.altTyp === null) {
                        res.altTyp = res.root.canonicText.toLowerCase();
                        if (res.altTyp === res.typ) 
                            res.altTyp = null;
                    }
                    break;
                }
            }
            res.coef = res.root.coeff;
            if (res.coef === 0) {
                for (let i = 0; i < npt.adjectives.length; i++) {
                    if (OrgItemTypeToken.isStdAdjective(npt.adjectives[i], true)) {
                        res.coef = res.coef + (1);
                        if (((i + 1) < npt.adjectives.length) && !OrgItemTypeToken.isStdAdjective(npt.adjectives[i + 1], false)) 
                            res.coef = res.coef + (1);
                        if (npt.adjectives[i].isValue("ФЕДЕРАЛЬНЫЙ", "ФЕДЕРАЛЬНИЙ") || npt.adjectives[i].isValue("ГОСУДАРСТВЕННЫЙ", "ДЕРЖАВНИЙ")) {
                            res.isDoubtRootWord = false;
                            if (res.isDep) 
                                res.isDep = false;
                        }
                    }
                    else if (OrgItemTypeToken.isStdAdjective(npt.adjectives[i], false)) 
                        res.coef = res.coef + 0.5;
                }
            }
            else 
                for (let i = 0; i < (npt.adjectives.length - 1); i++) {
                    if (OrgItemTypeToken.isStdAdjective(npt.adjectives[i], true)) {
                        if (((i + 1) < npt.adjectives.length) && !OrgItemTypeToken.isStdAdjective(npt.adjectives[i + 1], true)) {
                            res.coef = res.coef + (1);
                            res.isDoubtRootWord = false;
                            res.canBeOrganization = true;
                            if (res.isDep) 
                                res.isDep = false;
                        }
                    }
                }
        }
        res.morph = npt.morph;
        res.chars = npt.chars;
        if (!res.chars.isAllUpper && !res.chars.isCapitalUpper && !res.chars.isAllLower) {
            res.chars = npt.noun.chars;
            if (res.chars.isAllLower) 
                res.chars = res.beginToken.chars;
        }
        if (npt.noun !== null) 
            res.charsRoot = npt.noun.chars;
        return res;
    }
    
    static isStdAdjective(t, onlyFederal = false) {
        if (t === null) 
            return false;
        if (t instanceof MetaToken) 
            t = t.beginToken;
        let tt = (t.morph.language.isUa ? OrgItemTypeToken.m_StdAdjsUA.tryParse(t, TerminParseAttr.NO) : OrgItemTypeToken.m_StdAdjs.tryParse(t, TerminParseAttr.NO));
        if (tt === null) 
            return false;
        if (onlyFederal) {
            if (tt.termin.tag === null) 
                return false;
        }
        return true;
    }
    
    static checkOrgSpecialWordBefore(t) {
        if (t === null) 
            return false;
        if (t.isCommaAnd && t.previous !== null) 
            t = t.previous;
        let k = 0;
        let ty = null;
        for (let tt = t; tt !== null; tt = tt.previous) {
            let r = tt.getReferent();
            if (r !== null) {
                if (tt === t && (r instanceof OrganizationReferent)) 
                    return true;
                return false;
            }
            if (!(tt instanceof TextToken)) {
                if (!(tt instanceof NumberToken)) 
                    break;
                k++;
                continue;
            }
            if (tt.isNewlineAfter) {
                if (!tt.isChar(',')) 
                    return false;
                continue;
            }
            if (tt.isValue("УПРАВЛЕНИЕ", null) || tt.isValue("УПРАВЛІННЯ", null)) {
                ty = OrgItemTypeToken.tryAttach(tt.next, true);
                if (ty !== null && ty.isDoubtRootWord) 
                    return false;
            }
            if (tt === t && OrgItemTypeToken.m_PrefWords.tryParse(tt, TerminParseAttr.NO) !== null) 
                return true;
            if (tt === t && tt.isChar('.')) 
                continue;
            ty = OrgItemTypeToken.tryAttach(tt, true);
            if (ty !== null && ty.endToken.endChar <= t.endChar && ty.endToken === t) {
                if (!ty.isDoubtRootWord) 
                    return true;
            }
            let rt = tt.kit.processReferent("PERSONPROPERTY", tt, null);
            if (rt !== null && rt.referent !== null && rt.referent.typeName === "PERSONPROPERTY") {
                if (rt.endChar >= t.endChar) 
                    return true;
            }
            k++;
            if (k > 4) 
                break;
        }
        return false;
    }
    
    static checkPersonProperty(t) {
        if (t === null || !t.chars.isCyrillicLetter) 
            return false;
        let tok = OrgItemTypeToken.m_PrefWords.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return false;
        if (tok.termin.tag === null) 
            return false;
        return true;
    }
    
    static tryAttachReferenceToExistOrg(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let tok = OrgItemTypeToken.m_KeyWordsForRefs.tryParse(t, TerminParseAttr.NO);
        if (tok === null && t.morph._class.isPronoun) 
            tok = OrgItemTypeToken.m_KeyWordsForRefs.tryParse(t.next, TerminParseAttr.NO);
        let abbr = null;
        if (tok === null) {
            if (t.lengthChar > 1 && ((t.chars.isCapitalUpper || t.chars.isLastLower))) 
                abbr = t.lemma;
            else {
                let ty1 = OrgItemTypeToken._TryAttach(t, true, false);
                if (ty1 !== null) 
                    abbr = ty1.typ;
                else 
                    return null;
            }
        }
        let cou = 0;
        for (let tt = t.previous; tt !== null; tt = tt.previous) {
            if (tt.isNewlineAfter) 
                cou += 10;
            cou++;
            if (cou > 500) 
                break;
            if (!(tt instanceof ReferentToken)) 
                continue;
            let refs = tt.getReferents();
            if (refs === null) 
                continue;
            for (const r of refs) {
                if (r instanceof OrganizationReferent) {
                    if (abbr !== null) {
                        if (r.findSlot(OrganizationReferent.ATTR_TYPE, abbr, true) === null) 
                            continue;
                        let rt = new ReferentToken(r, t, t);
                        let hi = Utils.as(r.getSlotValue(OrganizationReferent.ATTR_HIGHER), OrganizationReferent);
                        if (hi !== null && t.next !== null) {
                            for (const ty of hi.types) {
                                if (t.next.isValue(ty.toUpperCase(), null)) {
                                    rt.endToken = t.next;
                                    break;
                                }
                            }
                        }
                        return rt;
                    }
                    if (tok.termin.tag !== null) {
                        let ok = false;
                        for (const ty of r.types) {
                            if (Utils.endsWithString(ty, tok.termin.canonicText, true)) {
                                ok = true;
                                break;
                            }
                        }
                        if (!ok) 
                            continue;
                    }
                    return new ReferentToken(r, t, tok.endToken);
                }
            }
        }
        return null;
    }
    
    static isTypesAntagonisticOO(r1, r2) {
        let k1 = r1.kind;
        let k2 = r2.kind;
        if (k1 !== OrganizationKind.UNDEFINED && k2 !== OrganizationKind.UNDEFINED) {
            if (OrgItemTypeToken.isTypesAntagonisticKK(k1, k2)) 
                return true;
        }
        let types1 = r1.types;
        let types2 = r2.types;
        for (const t1 of types1) {
            if (types2.includes(t1)) 
                return false;
        }
        for (const t1 of types1) {
            for (const t2 of types2) {
                if (OrgItemTypeToken.isTypesAntagonisticSS(t1, t2)) 
                    return true;
            }
        }
        return false;
    }
    
    static isTypeAccords(r1, t2) {
        if (t2 === null || t2.typ === null) 
            return false;
        if (t2.typ === "министерство" || t2.typ === "міністерство" || t2.typ.endsWith("штаб")) 
            return r1.findSlot(OrganizationReferent.ATTR_TYPE, t2.typ, true) !== null;
        let prs = r1.profiles;
        for (const pr of prs) {
            if (t2.profiles.includes(pr)) 
                return true;
        }
        if (r1.findSlot(OrganizationReferent.ATTR_TYPE, null, true) === null) {
            if (prs.length === 0) 
                return true;
        }
        if (t2.profiles.length === 0) {
            if (prs.includes(OrgProfile.POLICY)) {
                if (t2.typ === "группа" || t2.typ === "организация") 
                    return true;
            }
            if (prs.includes(OrgProfile.MUSIC)) {
                if (t2.typ === "группа") 
                    return true;
            }
            if ((t2.typ === "ООО" || t2.typ === "ОАО" || t2.typ === "ЗАО") || t2.typ === "ТОО") {
                if (prs.includes(OrgProfile.STATE)) 
                    return false;
                return true;
            }
        }
        for (const t of r1.types) {
            if (t === t2.typ) 
                return true;
            if (t.endsWith(t2.typ)) 
                return true;
            if (t2.typ === "издание") {
                if (t.endsWith("агентство")) 
                    return true;
            }
        }
        if ((t2.typ === "компания" || t2.typ === "корпорация" || t2.typ === "company") || t2.typ === "corporation") {
            if (prs.length === 0) 
                return true;
            if (prs.includes(OrgProfile.BUSINESS) || prs.includes(OrgProfile.FINANCE) || prs.includes(OrgProfile.INDUSTRY)) 
                return true;
        }
        return false;
    }
    
    static isTypesAntagonisticTT(t1, t2) {
        let k1 = OrgItemTypeToken._getKind(t1.typ, (t1.name != null ? t1.name : ""), null);
        let k2 = OrgItemTypeToken._getKind(t2.typ, (t2.name != null ? t2.name : ""), null);
        if (k1 === OrganizationKind.JUSTICE && t2.typ.startsWith("Ф")) 
            return false;
        if (k2 === OrganizationKind.JUSTICE && t1.typ.startsWith("Ф")) 
            return false;
        if (OrgItemTypeToken.isTypesAntagonisticKK(k1, k2)) 
            return true;
        if (OrgItemTypeToken.isTypesAntagonisticSS(t1.typ, t2.typ)) 
            return true;
        if (k1 === OrganizationKind.BANK && k2 === OrganizationKind.BANK) {
            if (t1.name !== null && t2.name !== null && t1 !== t2) 
                return true;
        }
        return false;
    }
    
    static isTypesAntagonisticSS(typ1, typ2) {
        if (typ1 === typ2) 
            return false;
        let uni = (typ1 + " " + typ2 + " ");
        if ((((uni.includes("служба") || uni.includes("департамент") || uni.includes("отделение")) || uni.includes("отдел") || uni.includes("відділення")) || uni.includes("відділ") || uni.includes("инспекция")) || uni.includes("інспекція")) 
            return true;
        if (uni.includes("министерство") || uni.includes("міністерство")) 
            return true;
        if (uni.includes("правительство") && !uni.includes("администрация")) 
            return true;
        if (uni.includes("уряд") && !uni.includes("адміністрація")) 
            return true;
        if (typ1 === "управление" && ((typ2 === "главное управление" || typ2 === "пограничное управление"))) 
            return true;
        if (typ2 === "управление" && ((typ1 === "главное управление" || typ2 === "пограничное управление"))) 
            return true;
        if (typ1 === "керування" && typ2 === "головне управління") 
            return true;
        if (typ2 === "керування" && typ1 === "головне управління") 
            return true;
        if (typ1 === "university") {
            if (typ2 === "school" || typ2 === "college") 
                return true;
        }
        if (typ2 === "university") {
            if (typ1 === "school" || typ1 === "college") 
                return true;
        }
        return false;
    }
    
    static isTypesAntagonisticKK(k1, k2) {
        if (k1 === k2) 
            return false;
        if (k1 === OrganizationKind.DEPARTMENT || k2 === OrganizationKind.DEPARTMENT) 
            return false;
        if (k1 === OrganizationKind.GOVENMENT || k2 === OrganizationKind.GOVENMENT) 
            return true;
        if (k1 === OrganizationKind.JUSTICE || k2 === OrganizationKind.JUSTICE) 
            return true;
        if (k1 === OrganizationKind.PARTY || k2 === OrganizationKind.PARTY) {
            if (k2 === OrganizationKind.FEDERATION || k1 === OrganizationKind.FEDERATION) 
                return false;
            return true;
        }
        if (k1 === OrganizationKind.STUDY) 
            k1 = OrganizationKind.SCIENCE;
        if (k2 === OrganizationKind.STUDY) 
            k2 = OrganizationKind.SCIENCE;
        if (k1 === OrganizationKind.PRESS) 
            k1 = OrganizationKind.MEDIA;
        if (k2 === OrganizationKind.PRESS) 
            k2 = OrganizationKind.MEDIA;
        if (k1 === k2) 
            return false;
        if (k1 === OrganizationKind.UNDEFINED || k2 === OrganizationKind.UNDEFINED) 
            return false;
        return true;
    }
    
    static checkKind(obj) {
        let t = new StringBuilder();
        let n = new StringBuilder();
        for (const s of obj.slots) {
            if (s.typeName === OrganizationReferent.ATTR_NAME) 
                n.append(s.value).append(";");
            else if (s.typeName === OrganizationReferent.ATTR_TYPE) 
                t.append(s.value).append(";");
        }
        return OrgItemTypeToken._getKind(t.toString(), n.toString(), obj);
    }
    
    static _getKind(t, n, r = null) {
        if (!LanguageHelper.endsWith(t, ";")) 
            t += ";";
        if (((((((((((((t.includes("министерство") || t.includes("правительство") || t.includes("администрация")) || t.includes("префектура") || t.includes("мэрия;")) || t.includes("муниципалитет") || LanguageHelper.endsWith(t, "совет;")) || t.includes("дума;") || t.includes("собрание;")) || t.includes("кабинет") || t.includes("сенат;")) || t.includes("палата") || t.includes("рада;")) || t.includes("парламент;") || t.includes("конгресс")) || t.includes("комиссия") || t.includes("полиция;")) || t.includes("милиция;") || t.includes("хурал")) || t.includes("суглан") || t.includes("меджлис;")) || t.includes("хасе;") || t.includes("ил тумэн")) || t.includes("курултай") || t.includes("бундестаг")) || t.includes("бундесрат")) 
            return OrganizationKind.GOVENMENT;
        if ((((((((((((t.includes("міністерство") || t.includes("уряд") || t.includes("адміністрація")) || t.includes("префектура") || t.includes("мерія;")) || t.includes("муніципалітет") || LanguageHelper.endsWith(t, "рада;")) || t.includes("дума;") || t.includes("збори")) || t.includes("кабінет;") || t.includes("сенат;")) || t.includes("палата") || t.includes("рада;")) || t.includes("парламент;") || t.includes("конгрес")) || t.includes("комісія") || t.includes("поліція;")) || t.includes("міліція;") || t.includes("хурал")) || t.includes("суглан") || t.includes("хасе;")) || t.includes("іл тумен") || t.includes("курултай")) || t.includes("меджліс;")) 
            return OrganizationKind.GOVENMENT;
        if (t.includes("комитет") || t.includes("комітет")) {
            if (r !== null && r.higher !== null && r.higher.kind === OrganizationKind.PARTY) 
                return OrganizationKind.DEPARTMENT;
            return OrganizationKind.GOVENMENT;
        }
        if (t.includes("штаб;")) {
            if (r !== null && r.higher !== null && r.higher.kind === OrganizationKind.MILITARY) 
                return OrganizationKind.MILITARY;
            return OrganizationKind.GOVENMENT;
        }
        let tn = t;
        if (!Utils.isNullOrEmpty(n)) 
            tn += n;
        tn = tn.toLowerCase();
        if (((((t.includes("служба;") || t.includes("инспекция;") || t.includes("управление;")) || t.includes("департамент") || t.includes("комитет;")) || t.includes("комиссия;") || t.includes("інспекція;")) || t.includes("керування;") || t.includes("комітет;")) || t.includes("комісія;")) {
            if (tn.includes("федеральн") || tn.includes("государствен") || tn.includes("державн")) 
                return OrganizationKind.GOVENMENT;
            if (r !== null && r.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) {
                if (r.higher === null && r.m_TempParentOrg === null) {
                    if (!t.includes("управление;") && !t.includes("департамент") && !t.includes("керування;")) 
                        return OrganizationKind.GOVENMENT;
                }
            }
        }
        if (((((((((((((((((((((((((((((((((t.includes("подразделение") || t.includes("отдел;") || t.includes("отдел ")) || t.includes("направление") || t.includes("отделение")) || t.includes("кафедра") || t.includes("инспекция")) || t.includes("факультет") || t.includes("лаборатория")) || t.includes("пресс центр") || t.includes("пресс служба")) || t.includes("сектор ") || t === "группа;") || ((t.includes("курс;") && !t.includes("конкурс"))) || t.includes("филиал")) || t.includes("главное управление") || t.includes("пограничное управление")) || t.includes("главное территориальное управление") || t.includes("бухгалтерия")) || t.includes("магистратура") || t.includes("аспирантура")) || t.includes("докторантура") || t.includes("дирекция")) || t.includes("руководство") || t.includes("правление")) || t.includes("пленум;") || t.includes("президиум")) || t.includes("стол;") || t.includes("совет директоров")) || t.includes("ученый совет") || t.includes("коллегия")) || t.includes("аппарат") || t.includes("представительство")) || t.includes("жюри;") || t.includes("підрозділ")) || t.includes("відділ;") || t.includes("відділ ")) || t.includes("напрямок") || t.includes("відділення")) || t.includes("інспекція") || t === "група;") || t.includes("лабораторія") || t.includes("прес центр")) || t.includes("прес служба") || t.includes("філія")) || t.includes("головне управління") || t.includes("головне територіальне управління")) || t.includes("бухгалтерія") || t.includes("магістратура")) || t.includes("аспірантура") || t.includes("докторантура")) || t.includes("дирекція") || t.includes("керівництво")) || t.includes("правління") || t.includes("президія")) || t.includes("стіл") || t.includes("рада директорів")) || t.includes("вчена рада") || t.includes("колегія")) || t.includes("апарат") || t.includes("представництво")) || t.includes("журі;") || t.includes("фракция")) || t.includes("депутатская группа") || t.includes("фракція")) || t.includes("депутатська група")) 
            return OrganizationKind.DEPARTMENT;
        if ((t.includes("научн") || t.includes("исследовательск") || t.includes("науков")) || t.includes("дослідн")) 
            return OrganizationKind.SCIENCE;
        if (t.includes("агенство") || t.includes("агентство")) {
            if (tn.includes("федеральн") || tn.includes("державн")) 
                return OrganizationKind.GOVENMENT;
            if (tn.includes("информацион") || tn.includes("інформаційн")) 
                return OrganizationKind.PRESS;
        }
        if (t.includes("холдинг") || t.includes("группа компаний") || t.includes("група компаній")) 
            return OrganizationKind.HOLDING;
        if (t.includes("академия") || t.includes("академія")) {
            if (tn.includes("наук")) 
                return OrganizationKind.SCIENCE;
            return OrganizationKind.STUDY;
        }
        if ((((((((((t.includes("школа;") || t.includes("университет") || tn.includes("учебный ")) || t.includes("лицей") || t.includes("колледж")) || t.includes("детский сад") || t.includes("училище")) || t.includes("гимназия") || t.includes("семинария")) || t.includes("образовательн") || t.includes("интернат")) || t.includes("університет") || tn.includes("навчальний ")) || t.includes("ліцей") || t.includes("коледж")) || t.includes("дитячий садок") || t.includes("училище")) || t.includes("гімназія") || t.includes("семінарія")) || t.includes("освітн") || t.includes("інтернат")) 
            return OrganizationKind.STUDY;
        if (((t.includes("больница") || t.includes("поликлиника") || t.includes("клиника")) || t.includes("госпиталь") || tn.includes("санитарн")) || tn.includes("медико") || tn.includes("медицин")) 
            return OrganizationKind.MEDICAL;
        if ((((((t.includes("церковь") || t.includes("храм;") || t.includes("собор")) || t.includes("синагога") || t.includes("мечеть")) || t.includes("лавра") || t.includes("монастырь")) || t.includes("церква") || t.includes("монастир")) || t.includes("патриархия") || t.includes("епархия")) || t.includes("патріархія") || t.includes("єпархія")) 
            return OrganizationKind.CHURCH;
        if (t.includes("департамент") || t.includes("управление") || t.includes("керування")) {
            if (r !== null) {
                if (r.findSlot(OrganizationReferent.ATTR_HIGHER, null, true) !== null) 
                    return OrganizationKind.DEPARTMENT;
            }
        }
        if ((t.includes("академия") || t.includes("институт") || t.includes("академія")) || t.includes("інститут")) {
            if (n !== null && (((n.includes("НАУК") || n.includes("НАУЧН") || n.includes("НАУКОВ")) || n.includes("ИССЛЕДОВАТ") || n.includes("ДОСЛІДН")))) 
                return OrganizationKind.SCIENCE;
        }
        if (t.includes("аэропорт") || t.includes("аеропорт")) 
            return OrganizationKind.AIRPORT;
        if (t.includes(" порт")) 
            return OrganizationKind.SEAPORT;
        if (((t.includes("фестиваль") || t.includes("чемпионат") || t.includes("олимпиада")) || t.includes("конкурс") || t.includes("чемпіонат")) || t.includes("олімпіада")) 
            return OrganizationKind.FESTIVAL;
        if (((((((((t.includes("армия") || t.includes("генеральный штаб") || t.includes("войсковая часть")) || t.includes("армія") || t.includes("генеральний штаб")) || t.includes("військова частина") || t.includes("дивизия")) || t.includes("полк") || t.includes("батальон")) || t.includes("рота") || t.includes("взвод")) || t.includes("дивізія") || t.includes("батальйон")) || t.includes("гарнизон") || t.includes("гарнізон")) || t.includes("бригада") || t.includes("корпус")) || t.includes("дивизион") || t.includes("дивізіон")) 
            return OrganizationKind.MILITARY;
        if (((t.includes("партия") || t.includes("движение") || t.includes("группировка")) || t.includes("партія") || t.includes("рух;")) || t.includes("групування")) 
            return OrganizationKind.PARTY;
        if (((((((t.includes("газета") || t.includes("издательство") || t.includes("информационное агентство")) || tn.includes("риа;") || t.includes("журнал")) || t.includes("издание") || t.includes("еженедельник")) || t.includes("таблоид") || t.includes("видавництво")) || t.includes("інформаційне агентство") || t.includes("журнал")) || t.includes("видання") || t.includes("тижневик")) || t.includes("таблоїд") || t.includes("портал")) 
            return OrganizationKind.PRESS;
        if (((t.includes("телеканал") || t.includes("телекомпания") || t.includes("радиостанция")) || t.includes("киностудия") || t.includes("телекомпанія")) || t.includes("радіостанція") || t.includes("кіностудія")) 
            return OrganizationKind.MEDIA;
        if (((t.includes("завод;") || t.includes("фабрика") || t.includes("комбинат")) || t.includes("производитель") || t.includes("комбінат")) || t.includes("виробник")) 
            return OrganizationKind.FACTORY;
        if ((((((t.includes("театр;") || t.includes("концертный зал") || t.includes("музей")) || t.includes("консерватория") || t.includes("филармония")) || t.includes("галерея") || t.includes("театр студия")) || t.includes("дом культуры") || t.includes("концертний зал")) || t.includes("консерваторія") || t.includes("філармонія")) || t.includes("театр студія") || t.includes("будинок культури")) 
            return OrganizationKind.CULTURE;
        if (((((((t.includes("федерация") || t.includes("союз") || t.includes("объединение")) || t.includes("фонд;") || t.includes("ассоциация")) || t.includes("клуб") || t.includes("альянс")) || t.includes("ассамблея") || t.includes("федерація")) || t.includes("обєднання") || t.includes("фонд;")) || t.includes("асоціація") || t.includes("асамблея")) || t.includes("гильдия") || t.includes("гільдія")) 
            return OrganizationKind.FEDERATION;
        if ((((((t.includes("пансионат") || t.includes("санаторий") || t.includes("дом отдыха")) || t.includes("база отдыха") || t.includes("гостиница")) || t.includes("отель") || t.includes("лагерь")) || t.includes("пансіонат") || t.includes("санаторій")) || t.includes("будинок відпочинку") || t.includes("база відпочинку")) || t.includes("готель") || t.includes("табір")) 
            return OrganizationKind.HOTEL;
        if ((((((t.includes("суд;") || t.includes("колония") || t.includes("изолятор")) || t.includes("тюрьма") || t.includes("прокуратура")) || t.includes("судебный") || t.includes("трибунал")) || t.includes("колонія") || t.includes("ізолятор")) || t.includes("вязниця") || t.includes("судовий")) || t.includes("трибунал")) 
            return OrganizationKind.JUSTICE;
        if (tn.includes("банк") || tn.includes("казначейство")) 
            return OrganizationKind.BANK;
        if (tn.includes("торгов") || tn.includes("магазин") || tn.includes("маркет;")) 
            return OrganizationKind.TRADE;
        if (t.includes("УЗ;")) 
            return OrganizationKind.MEDICAL;
        if (t.includes("центр;")) {
            if ((tn.includes("диагностический") || tn.includes("медицинский") || tn.includes("діагностичний")) || tn.includes("медичний")) 
                return OrganizationKind.MEDICAL;
            if ((r instanceof OrganizationReferent) && r.higher !== null) {
                if (r.higher.kind === OrganizationKind.DEPARTMENT) 
                    return OrganizationKind.DEPARTMENT;
            }
        }
        if (t.includes("часть;") || t.includes("частина;")) 
            return OrganizationKind.DEPARTMENT;
        if (r !== null) {
            if (r.containsProfile(OrgProfile.POLICY)) 
                return OrganizationKind.PARTY;
            if (r.containsProfile(OrgProfile.MEDIA)) 
                return OrganizationKind.MEDIA;
        }
        return OrganizationKind.UNDEFINED;
    }
    
    static _new2392(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.m_Coef = _arg3;
        return res;
    }
    
    static _new2393(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.name = _arg4;
        res.coef = _arg5;
        return res;
    }
    
    static _new2396(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.root = _arg4;
        res.isNotTyp = _arg5;
        return res;
    }
    
    static _new2398(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2400(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.root = _arg4;
        return res;
    }
    
    static _new2404(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.name = _arg4;
        res.coef = _arg5;
        res.root = _arg6;
        return res;
    }
    
    static _new2405(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.root = _arg4;
        res.canBeOrganization = _arg5;
        return res;
    }
    
    static _new2406(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.altTyp = _arg4;
        res.root = _arg5;
        res.canBeOrganization = _arg6;
        return res;
    }
    
    static _new2407(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.coef = _arg3;
        res.isNotTyp = _arg4;
        res.typ = _arg5;
        return res;
    }
    
    static _new2409(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.root = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2413(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.coef = _arg4;
        res.isDep = _arg5;
        return res;
    }
    
    static _new2415(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.typ = _arg3;
        res.nameIsName = _arg4;
        res.root = _arg5;
        res.name = _arg6;
        return res;
    }
    
    static _new2417(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeToken(_arg1, _arg2);
        res.name = _arg3;
        res.morph = _arg4;
        res.chars = _arg5;
        res.charsRoot = _arg6;
        return res;
    }
    
    static static_constructor() {
        OrgItemTypeToken.m_Global = null;
        OrgItemTypeToken.m_Bank = null;
        OrgItemTypeToken.m_MO = null;
        OrgItemTypeToken.M_MEJMUN_OTDEL = null;
        OrgItemTypeToken.m_IsprKolon = null;
        OrgItemTypeToken.m_SberBank = null;
        OrgItemTypeToken.m_SecServ = null;
        OrgItemTypeToken.m_AkcionComp = null;
        OrgItemTypeToken.m_SovmPred = null;
        OrgItemTypeToken.m_SudUch = null;
        OrgItemTypeToken.m_PrefWords = null;
        OrgItemTypeToken.m_KeyWordsForRefs = null;
        OrgItemTypeToken.m_Markers = null;
        OrgItemTypeToken.m_StdAdjs = null;
        OrgItemTypeToken.m_StdAdjsUA = null;
        OrgItemTypeToken.M_EMPTY_TYP_WORDS = ["КРУПНЫЙ", "КРУПНЕЙШИЙ", "ИЗВЕСТНЫЙ", "ИЗВЕСТНЕЙШИЙ", "МАЛОИЗВЕСТНЫЙ", "ЗАРУБЕЖНЫЙ", "ВЛИЯТЕЛЬНЫЙ", "ВЛИЯТЕЛЬНЕЙШИЙ", "ЗНАМЕНИТЫЙ", "НАЙБІЛЬШИЙ", "ВІДОМИЙ", "ВІДОМИЙ", "МАЛОВІДОМИЙ", "ЗАКОРДОННИЙ"];
        OrgItemTypeToken.m_DecreeKeyWords = ["УКАЗ", "УКАЗАНИЕ", "ПОСТАНОВЛЕНИЕ", "РАСПОРЯЖЕНИЕ", "ПРИКАЗ", "ДИРЕКТИВА", "ПИСЬМО", "ЗАКОН", "КОДЕКС", "КОНСТИТУЦИЯ", "РЕШЕНИЕ", "ПОЛОЖЕНИЕ", "РАСПОРЯЖЕНИЕ", "ПОРУЧЕНИЕ", "ДОГОВОР", "СУБДОГОВОР", "АГЕНТСКИЙ ДОГОВОР", "ОПРЕДЕЛЕНИЕ", "СОГЛАШЕНИЕ", "ПРОТОКОЛ", "УСТАВ", "ХАРТИЯ", "РЕГЛАМЕНТ", "КОНВЕНЦИЯ", "ПАКТ", "БИЛЛЬ", "ДЕКЛАРАЦИЯ", "ТЕЛЕФОНОГРАММА", "ТЕЛЕФАКСОГРАММА", "ФАКСОГРАММА", "ПРАВИЛО", "ПРОГРАММА", "ПЕРЕЧЕНЬ", "ПОСОБИЕ", "РЕКОМЕНДАЦИЯ", "НАСТАВЛЕНИЕ", "СТАНДАРТ", "СОГЛАШЕНИЕ", "МЕТОДИКА", "ТРЕБОВАНИЕ", "УКАЗ", "ВКАЗІВКА", "ПОСТАНОВА", "РОЗПОРЯДЖЕННЯ", "НАКАЗ", "ДИРЕКТИВА", "ЛИСТ", "ЗАКОН", "КОДЕКС", "КОНСТИТУЦІЯ", "РІШЕННЯ", "ПОЛОЖЕННЯ", "РОЗПОРЯДЖЕННЯ", "ДОРУЧЕННЯ", "ДОГОВІР", "СУБКОНТРАКТ", "АГЕНТСЬКИЙ ДОГОВІР", "ВИЗНАЧЕННЯ", "УГОДА", "ПРОТОКОЛ", "СТАТУТ", "ХАРТІЯ", "РЕГЛАМЕНТ", "КОНВЕНЦІЯ", "ПАКТ", "БІЛЛЬ", "ДЕКЛАРАЦІЯ", "ТЕЛЕФОНОГРАМА", "ТЕЛЕФАКСОГРАММА", "ФАКСОГРАМА", "ПРАВИЛО", "ПРОГРАМА", "ПЕРЕЛІК", "ДОПОМОГА", "РЕКОМЕНДАЦІЯ", "ПОВЧАННЯ", "СТАНДАРТ", "УГОДА", "МЕТОДИКА", "ВИМОГА"];
        OrgItemTypeToken.SPEED_REGIME = false;
        OrgItemTypeToken.m_PressRU = null;
        OrgItemTypeToken.m_PressUA = null;
        OrgItemTypeToken.m_PressIA = null;
        OrgItemTypeToken.m_MilitaryUnit = null;
    }
}


OrgItemTypeToken.static_constructor();

module.exports = OrgItemTypeToken