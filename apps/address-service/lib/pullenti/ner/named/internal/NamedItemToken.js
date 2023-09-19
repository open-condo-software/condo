/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphClass = require("./../../../morph/MorphClass");
const GetTextAttr = require("./../../core/GetTextAttr");
const MorphGender = require("./../../../morph/MorphGender");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const NamedEntityKind = require("./../NamedEntityKind");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NumberHelper = require("./../../core/NumberHelper");
const GeoReferent = require("./../../geo/GeoReferent");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");

class NamedItemToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.kind = NamedEntityKind.UNDEFINED;
        this.nameValue = null;
        this.typeValue = null;
        this.ref = null;
        this.isWellknown = false;
        this.isInBracket = false;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.kind !== NamedEntityKind.UNDEFINED) 
            res.append(" [").append(String(this.kind)).append("]");
        if (this.isWellknown) 
            res.append(" (!)");
        if (this.isInBracket) 
            res.append(" [br]");
        if (this.typeValue !== null) 
            res.append(" ").append(this.typeValue);
        if (this.nameValue !== null) 
            res.append(" \"").append(this.nameValue).append("\"");
        if (this.ref !== null) 
            res.append(" -> ").append(this.ref.toString());
        return res.toString();
    }
    
    static tryParseList(t, locOnto) {
        let ne = NamedItemToken.tryParse(t, locOnto, null);
        if (ne === null) 
            return null;
        let res = new Array();
        res.push(ne);
        for (t = ne.endToken.next; t !== null; t = t.next) {
            if (t.whitespacesBeforeCount > 2) 
                break;
            ne = NamedItemToken.tryParse(t, locOnto, res[res.length - 1]);
            if (ne === null) 
                break;
            if (t.isValue("НЕТ", null)) 
                break;
            res.push(ne);
            t = ne.endToken;
        }
        return res;
    }
    
    static tryParse(t, locOnto, prev) {
        if (t === null) 
            return null;
        if (t instanceof ReferentToken) {
            let r = t.getReferent();
            if (r === null) 
                return null;
            if ((r.typeName === "PERSON" || r.typeName === "PERSONPROPERTY" || (r instanceof GeoReferent)) || r.typeName === "ORGANIZATION") 
                return NamedItemToken._new1761(t, t, r, t.morph);
            return null;
        }
        let typ = NamedItemToken.m_Types.tryParse(t, TerminParseAttr.NO);
        let nam = NamedItemToken.m_Names.tryParse(t, TerminParseAttr.NO);
        if (typ !== null) {
            if (!(t instanceof TextToken)) 
                return null;
            let res = NamedItemToken._new1762(typ.beginToken, typ.endToken, typ.morph, typ.chars);
            res.kind = NamedEntityKind.of(typ.termin.tag);
            res.typeValue = typ.termin.canonicText;
            if ((nam !== null && nam.endToken === typ.endToken && !t.chars.isAllLower) && (NamedEntityKind.of(nam.termin.tag)) === res.kind) {
                res.nameValue = nam.termin.canonicText;
                res.isWellknown = true;
            }
            return res;
        }
        if (nam !== null) {
            if (nam.beginToken.chars.isAllLower) 
                return null;
            let res = NamedItemToken._new1762(nam.beginToken, nam.endToken, nam.morph, nam.chars);
            res.kind = NamedEntityKind.of(nam.termin.tag);
            res.nameValue = nam.termin.canonicText;
            let ok = true;
            if (!t.isWhitespaceBefore && t.previous !== null) 
                ok = false;
            else if (!t.isWhitespaceAfter && t.next !== null) {
                if (t.next.isCharOf(",.;!?") && t.next.isWhitespaceAfter) {
                }
                else 
                    ok = false;
            }
            if (ok && nam.termin.tag3 === null) {
                res.isWellknown = true;
                res.typeValue = Utils.asString(nam.termin.tag2);
            }
            return res;
        }
        let adj = MiscLocationHelper.tryAttachNordWest(t);
        if (adj !== null) {
            if (adj.morph._class.isNoun) {
                if (adj.endToken.isValue("ВОСТОК", null)) {
                    if (adj.beginToken === adj.endToken) 
                        return null;
                    let re = NamedItemToken._new1764(t, adj.endToken, adj.morph);
                    re.kind = NamedEntityKind.LOCATION;
                    re.nameValue = MiscHelper.getTextValue(t, adj.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                    re.isWellknown = true;
                    return re;
                }
                return null;
            }
            if (adj.whitespacesAfterCount > 2) 
                return null;
            if ((adj.endToken.next instanceof ReferentToken) && (adj.endToken.next.getReferent() instanceof GeoReferent)) {
                let re = NamedItemToken._new1764(t, adj.endToken.next, adj.endToken.next.morph);
                re.kind = NamedEntityKind.LOCATION;
                re.nameValue = MiscHelper.getTextValue(t, adj.endToken.next, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                re.isWellknown = true;
                re.ref = adj.endToken.next.getReferent();
                return re;
            }
            let res = NamedItemToken.tryParse(adj.endToken.next, locOnto, prev);
            if (res !== null && res.kind === NamedEntityKind.LOCATION) {
                let s = adj.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, res.morph.gender, false);
                if (s !== null) {
                    if (res.nameValue === null) 
                        res.nameValue = s.toUpperCase();
                    else {
                        res.nameValue = (s.toUpperCase() + " " + res.nameValue);
                        res.typeValue = null;
                    }
                    res.beginToken = t;
                    res.chars = t.chars;
                    res.isWellknown = true;
                    return res;
                }
            }
        }
        if (t.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(t)) {
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.adjectives.length > 0) {
                let test = NamedItemToken.tryParse(npt.noun.beginToken, locOnto, null);
                if (test !== null && test.endToken === npt.endToken && test.typeValue !== null) {
                    if (test.typeValue === "ДОМ") 
                        return null;
                    test.beginToken = t;
                    let tmp = new StringBuilder();
                    for (const a of npt.adjectives) {
                        let s = a.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, test.morph.gender, false);
                        if (tmp.length > 0) 
                            tmp.append(' ');
                        tmp.append(s);
                    }
                    test.nameValue = tmp.toString();
                    test.chars = t.chars;
                    if (test.kind === NamedEntityKind.LOCATION || test.kind === NamedEntityKind.BUILDING || test.kind === NamedEntityKind.MONUMENT) 
                        test.isWellknown = true;
                    return test;
                }
            }
        }
        if (BracketHelper.isBracket(t, true) && t.next !== null && !t.next.chars.isAllLower) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.CANCONTAINSVERBS, 100);
            if (br !== null && br.lengthChar > 3) {
                let res = new NamedItemToken(t, br.endToken);
                res.isInBracket = true;
                res.nameValue = MiscHelper.getTextValue(t, br.endToken, GetTextAttr.NO);
                nam = NamedItemToken.m_Names.tryParse(t.next, TerminParseAttr.NO);
                if (nam !== null && nam.endToken === br.endToken.previous) {
                    res.kind = NamedEntityKind.of(nam.termin.tag);
                    res.isWellknown = true;
                    res.nameValue = nam.termin.canonicText;
                }
                return res;
            }
        }
        if (((t instanceof TextToken) && t.chars.isLetter && !t.chars.isAllLower) && t.lengthChar > 2) {
            let res = NamedItemToken._new1764(t, t, t.morph);
            let str = t.term;
            if (str.endsWith("О") || str.endsWith("И") || str.endsWith("Ы")) 
                res.nameValue = str;
            else 
                res.nameValue = t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
            res.chars = t.chars;
            if (((!t.isWhitespaceAfter && t.next !== null && t.next.isHiphen) && (t.next.next instanceof TextToken) && !t.next.isWhitespaceAfter) && t.chars.isCyrillicLetter === t.next.next.chars.isCyrillicLetter) {
                t = res.endToken = t.next.next;
                res.nameValue = (res.nameValue + "-" + t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
            }
            else if (prev !== null && prev.kind === NamedEntityKind.MONUMENT) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endChar > res.endChar) {
                    res.nameValue = MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO);
                    res.endToken = npt.endToken;
                }
            }
            return res;
        }
        if (prev !== null && prev.kind === NamedEntityKind.MONUMENT && (t.whitespacesBeforeCount < 3)) {
            let t1 = null;
            let nnn = NumberHelper.tryParseAnniversary(t);
            if (nnn !== null) 
                t1 = nnn.endToken;
            else if ((t instanceof NumberToken) && (t.whitespacesBeforeCount < 2)) {
                t1 = t;
                nnn = Utils.as(t, NumberToken);
            }
            else if (t.isValue("ГЕРОЙ", null)) 
                t1 = t;
            else {
                let rt1 = t.kit.processReferent("PERSON", t, null);
                if (rt1 !== null) 
                    t1 = rt1.endToken;
            }
            if (t1 === null) 
                return null;
            let _next = NamedItemToken.tryParse(t1.next, locOnto, prev);
            if (_next !== null && _next.typeValue === null && _next.nameValue !== null) {
                _next.beginToken = t;
                if (nnn !== null) 
                    _next.nameValue = (nnn.value + " ЛЕТ " + _next.nameValue);
                else 
                    _next.nameValue = MiscHelper.getTextValueOfMetaToken(_next, GetTextAttr.NO);
                return _next;
            }
        }
        return null;
    }
    
    static initialize() {
        if (NamedItemToken.m_Types !== null) 
            return;
        NamedItemToken.m_Types = new TerminCollection();
        NamedItemToken.m_Names = new TerminCollection();
        let t = null;
        for (const s of ["ПЛАНЕТА", "ЗВЕЗДА", "КОМЕТА", "МЕТЕОРИТ", "СОЗВЕЗДИЕ", "ГАЛАКТИКА"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.PLANET;
            NamedItemToken.m_Types.add(t);
        }
        for (const s of ["СОЛНЦЕ", "МЕРКУРИЙ", "ВЕНЕРА", "ЗЕМЛЯ", "МАРС", "ЮПИТЕР", "САТУРН", "УРАН", "НЕПТУН", "ПЛУТОН", "ЛУНА", "ДЕЙМОС", "ФОБОС", "Ио", "Ганимед", "Каллисто"]) {
            t = new Termin();
            t.initByNormalText(s.toUpperCase(), null);
            t.tag = NamedEntityKind.PLANET;
            NamedItemToken.m_Names.add(t);
        }
        for (const s of ["РЕКА", "ОЗЕРО", "МОРЕ", "ОКЕАН", "ЗАЛИВ", "ПРОЛИВ", "ПОБЕРЕЖЬЕ", "КОНТИНЕНТ", "ОСТРОВ", "ПОЛУОСТРОВ", "МЫС", "ГОРА", "ГОРНЫЙ ХРЕБЕТ", "ПЕРЕВАЛ", "ПАДЬ", "ЛЕС", "САД", "ЗАПОВЕДНИК", "ЗАКАЗНИК", "ДОЛИНА", "УЩЕЛЬЕ", "РАВНИНА", "БЕРЕГ"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.LOCATION;
            NamedItemToken.m_Types.add(t);
        }
        for (const s of ["ТИХИЙ", "АТЛАНТИЧЕСКИЙ", "ИНДИЙСКИЙ", "СЕВЕРО-ЛЕДОВИТЫЙ"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.LOCATION;
            t.tag2 = "океан";
            NamedItemToken.m_Names.add(t);
        }
        for (const s of ["ЕВРАЗИЯ", "АФРИКА", "АМЕРИКА", "АВСТРАЛИЯ", "АНТАРКТИДА"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.LOCATION;
            t.tag2 = "континент";
            NamedItemToken.m_Names.add(t);
        }
        for (const s of ["ВОЛГА", "НЕВА", "АМУР", "ОБЪ", "АНГАРА", "ЛЕНА", "ИРТЫШ", "ДНЕПР", "ДОН", "ДНЕСТР", "РЕЙН", "АМУДАРЬЯ", "СЫРДАРЬЯ", "ТИГР", "ЕВФРАТ", "ИОРДАН", "МИССИСИПИ", "АМАЗОНКА", "ТЕМЗА", "СЕНА", "НИЛ", "ЯНЦЗЫ", "ХУАНХЭ", "ПАРАНА", "МЕКОНГ", "МАККЕНЗИ", "НИГЕР", "ЕНИСЕЙ", "МУРРЕЙ", "САЛУИН", "ИНД", "РИО-ГРАНДЕ", "БРАХМАПУТРА", "ДАРЛИНГ", "ДУНАЙ", "ЮКОН", "ГАНГ", "МАРРАМБИДЖИ", "ЗАМБЕЗИ", "ТОКАНТИС", "ОРИНОКО", "СИЦЗЯН", "КОЛЫМА", "КАМА", "ОКА", "ЭЛЬЮА", "ВИСЛА", "ДАУГАВА", "ЗАПАДНАЯ ДВИНА", "НЕМАН", "МЕЗЕНЬ", "КУБАНЬ", "ЮЖНЫЙ БУГ"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.LOCATION;
            t.tag2 = "река";
            NamedItemToken.m_Names.add(t);
        }
        for (const s of ["ЕВРОПА", "АЗИЯ", "АРКТИКА", "КАВКАЗ", "ПРИБАЛТИКА", "СИБИРЬ", "ЗАПОЛЯРЬЕ", "ЧУКОТКА", "ПРИБАЛТИКА", "БАЛКАНЫ", "СКАНДИНАВИЯ", "ОКЕАНИЯ", "АЛЯСКА", "УРАЛ", "ПОВОЛЖЬЕ", "ПРИМОРЬЕ", "КУРИЛЫ", "ТИБЕТ", "ГИМАЛАИ", "АЛЬПЫ", "САХАРА", "ГОБИ", "СИНАЙ", "БАЙКОНУР", "ЧЕРНОБЫЛЬ", "САДОВОЕ КОЛЬЦО", "СТАРЫЙ ГОРОД", "НОВЫЙ ГОРОД"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.LOCATION;
            NamedItemToken.m_Names.add(t);
        }
        for (const s of ["ПАМЯТНИК", "МОНУМЕНТ", "МЕМОРИАЛ", "БЮСТ", "ОБЕЛИСК", "МОГИЛА", "МАВЗОЛЕЙ", "ЗАХОРОНЕНИЕ", "ПАМЯТНАЯ ДОСКА", "ПАМЯТНЫЙ ЗНАК"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.addVariant(s + " В ЧЕСТЬ", false);
            t.tag = NamedEntityKind.MONUMENT;
            NamedItemToken.m_Types.add(t);
        }
        let b = Termin.ASSIGN_ALL_TEXTS_AS_NORMAL;
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        for (const s of ["ВЕЧНЫЙ ОГОНЬ", "НЕИЗВЕСТНЫЙ СОЛДАТ", "ПОКЛОННАЯ ГОРА", "МЕДНЫЙ ВСАДНИК", "ЛЕНИН"]) {
            t = new Termin(s);
            t.tag = NamedEntityKind.MONUMENT;
            t.tag3 = NamedItemToken.m_Names;
            NamedItemToken.m_Names.add(t);
        }
        t = Termin._new1457("ПОБЕДА В ВЕЛИКОЙ ОТЕЧЕСТВЕННОЙ ВОЙНЕ", NamedEntityKind.MONUMENT, NamedItemToken.m_Names);
        t.addVariant("ПОБЕДА В ВОВ", false);
        NamedItemToken.m_Names.add(t);
        for (const s of ["ФИЛЬМ", "КИНОФИЛЬМ", "ТЕЛЕФИЛЬМ", "СЕРИАЛ", "ТЕЛЕСЕРИАЛ", "БЛОКБАСТЕР", "СИКВЕЛ", "КОМЕДИЯ", "ТЕЛЕКОМЕДИЯ", "БОЕВИК", "АЛЬБОМ", "ДИСК", "ПЕСНЯ", "СИНГЛ", "СПЕКТАКЛЬ", "МЮЗИКЛ", "ТЕЛЕСПЕКТАКЛЬ", "ТЕЛЕШОУ", "КНИГА", "РАССКАЗ", "РОМАН", "ПОЭМА", "СТИХ", "СТИХОТВОРЕНИЕ"]) {
            t = new Termin(s);
            t.tag = NamedEntityKind.ART;
            NamedItemToken.m_Types.add(t);
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = b;
        for (const s of ["ДВОРЕЦ", "КРЕМЛЬ", "ЗАМОК", "КРЕПОСТЬ", "УСАДЬБА", "ДОМ", "ЗДАНИЕ", "ШТАБ-КВАРТИРА", "ЖЕЛЕЗНОДОРОЖНЫЙ ВОКЗАЛ", "ВОКЗАЛ", "АВТОВОКЗАЛ", "АЭРОВОКЗАЛ", "АЭРОПОРТ", "АЭРОДРОМ", "БИБЛИОТЕКА", "СОБОР", "МЕЧЕТЬ", "СИНАГОГА", "ЛАВРА", "ХРАМ", "ЦЕРКОВЬ"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.BUILDING;
            NamedItemToken.m_Types.add(t);
        }
        for (const s of ["КРЕМЛЬ", "КАПИТОЛИЙ", "БЕЛЫЙ ДОМ", "БИГ БЕН", "ХРАМОВАЯ ГОРА"]) {
            t = new Termin();
            t.initByNormalText(s, null);
            t.tag = NamedEntityKind.BUILDING;
            NamedItemToken.m_Names.add(t);
        }
        t = Termin._new170("МЕЖДУНАРОДНАЯ КОСМИЧЕСКАЯ СТАНЦИЯ", NamedEntityKind.BUILDING);
        t.acronym = "МКС";
        NamedItemToken.m_Names.add(t);
    }
    
    static _new1761(_arg1, _arg2, _arg3, _arg4) {
        let res = new NamedItemToken(_arg1, _arg2);
        res.ref = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new1762(_arg1, _arg2, _arg3, _arg4) {
        let res = new NamedItemToken(_arg1, _arg2);
        res.morph = _arg3;
        res.chars = _arg4;
        return res;
    }
    
    static _new1764(_arg1, _arg2, _arg3) {
        let res = new NamedItemToken(_arg1, _arg2);
        res.morph = _arg3;
        return res;
    }
    
    static static_constructor() {
        NamedItemToken.m_Types = null;
        NamedItemToken.m_Names = null;
    }
}


NamedItemToken.static_constructor();

module.exports = NamedItemToken