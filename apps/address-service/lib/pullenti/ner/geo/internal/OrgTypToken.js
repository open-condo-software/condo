/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MetaToken = require("./../../MetaToken");
const MorphGender = require("./../../../morph/MorphGender");
const MorphLang = require("./../../../morph/MorphLang");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const GeoTokenType = require("./GeoTokenType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const TerminToken = require("./../../core/TerminToken");
const GeoTokenData = require("./GeoTokenData");
const TextToken = require("./../../TextToken");
const StreetItemType = require("./../../address/internal/StreetItemType");
const BracketHelper = require("./../../core/BracketHelper");
const MiscLocationHelper = require("./MiscLocationHelper");
const ReferentToken = require("./../../ReferentToken");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const GeoAnalyzer = require("./../GeoAnalyzer");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const TerrItemToken = require("./TerrItemToken");
const AddressItemToken = require("./../../address/internal/AddressItemToken");
const GeoReferent = require("./../GeoReferent");
const NameToken = require("./NameToken");

class OrgTypToken extends MetaToken {
    
    constructor(b, e, val = null) {
        super(b, e, null);
        this.isDoubt = false;
        this.notOrg = false;
        this.notGeo = false;
        this.canBeSingle = false;
        this.vals = new Array();
        if (val !== null) 
            this.vals.push(val);
    }
    
    clone() {
        let res = new OrgTypToken(this.beginToken, this.endToken);
        res.vals.splice(res.vals.length, 0, ...this.vals);
        res.isDoubt = this.isDoubt;
        res.notOrg = this.notOrg;
        res.notGeo = this.notGeo;
        res.canBeSingle = this.canBeSingle;
        return res;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.isDoubt) 
            tmp.append("? ");
        for (let i = 0; i < this.vals.length; i++) {
            if (i > 0) 
                tmp.append(" / ");
            tmp.append(this.vals[i]);
        }
        if (this.notOrg) 
            tmp.append(", not Org");
        if (this.notGeo) 
            tmp.append(", not Geo");
        if (this.canBeSingle) 
            tmp.append(", Single");
        return tmp.toString();
    }
    
    static prepareAllData(t0) {
        if (!OrgTypToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.oTRegime = false;
        let lastTyp = null;
        for (let t = t0; t !== null; t = t.next) {
            let afterTerr = false;
            let tt = MiscLocationHelper.checkTerritory(t);
            if (tt !== null && tt.next !== null) {
                afterTerr = true;
                t = tt.next;
            }
            else if (lastTyp !== null && lastTyp.endToken.next === t) 
                afterTerr = true;
            let d = Utils.as(t.tag, GeoTokenData);
            let ty = OrgTypToken.tryParse(t, afterTerr, ad);
            if (ty !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.orgTyp = ty;
                t = ty.endToken;
                lastTyp = ty;
            }
        }
        ad.oTRegime = true;
    }
    
    static tryParse(t, afterTerr, ad = null) {
        if (!(t instanceof TextToken)) 
            return null;
        if (t.lengthChar === 1 && !t.chars.isLetter) 
            return null;
        if ((t.lengthChar === 1 && t.chars.isAllLower && t.isChar('м')) && t.next !== null && t.next.isChar('.')) {
            if (MiscLocationHelper.isUserParamAddress(t)) {
                let tt = t.previous;
                if (tt !== null && tt.isComma) 
                    tt = tt.previous;
                if (tt instanceof ReferentToken) {
                    let _geo = Utils.as(tt.getReferent(), GeoReferent);
                    if (_geo !== null && _geo.isRegion) {
                        let mm = new OrgTypToken(t, t.next);
                        mm.vals.push("местечко");
                        return mm;
                    }
                }
            }
        }
        if (((t.lengthChar === 1 && t.next !== null && t.next.isHiphen) && t.isValue("П", null) && (t.next.next instanceof TextToken)) && t.next.next.isValue("Т", null)) {
            if (BracketHelper.isBracket(t.next.next.next, true)) 
                return new OrgTypToken(t, t.next.next, "пансионат");
            let tt = t.previous;
            if (tt !== null && tt.isComma) 
                tt = tt.previous;
            if (tt instanceof ReferentToken) {
                let _geo = Utils.as(tt.getReferent(), GeoReferent);
                if (_geo !== null && _geo.isCity && !_geo.isBigCity) 
                    return new OrgTypToken(t, t.next.next, "пансионат");
            }
        }
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad !== null && OrgTypToken.SPEED_REGIME && ((ad.oTRegime || ad.allRegime))) {
            let d = Utils.as(t.tag, GeoTokenData);
            if (d !== null) 
                return d.orgTyp;
            return null;
        }
        if (ad.oLevel > 2) 
            return null;
        ad.oLevel++;
        let res = OrgTypToken._TryParse(t, afterTerr, 0);
        ad.oLevel--;
        return res;
    }
    
    static _TryParse(t, afterTerr, lev = 0) {
        if (t === null) 
            return null;
        if (t instanceof TextToken) {
            let term = t.term;
            if (term === "СП") {
                if (!afterTerr && t.chars.isAllLower) 
                    return null;
            }
            if (term === "НП") {
                if (!afterTerr && t.chars.isAllLower) 
                    return null;
            }
            if (term === "АК") {
                if (t.next !== null && t.next.isChar('.')) 
                    return null;
                if (!afterTerr && t.chars.isCapitalUpper) 
                    return null;
            }
            if ((t.isValue("ОФИС", null) || term === "ФАД" || term === "АД") || t.isValue("КОРПУС", null)) 
                return null;
            if ((t.isValue("ФЕДЕРАЦИЯ", null) || t.isValue("СОЮЗ", null) || t.isValue("ПРЕФЕКТУРА", null)) || t.isValue("ОТДЕЛЕНИЕ", null)) 
                return null;
            if (t.isValue("РАДИО", null) || t.isValue("АППАРАТ", null)) 
                return null;
            if (t.isValue("ГОРОДОК", null) && !MiscLocationHelper.isUserParamAddress(t)) 
                return null;
            if (t.isValue2("СО", "СТ")) 
                return null;
            if (t.isValue("ПОЛЕ", null) && (t.previous instanceof TextToken)) {
                let npt = NounPhraseHelper.tryParse(t.previous, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endToken === t) 
                    return null;
            }
            if (term === "АО") {
                let cou = 5;
                for (let tt = t.previous; tt !== null && cou > 0; tt = tt.previous,cou--) {
                    let ter = TerrItemToken.checkOntoItem(tt);
                    if (ter !== null) {
                        if (ter.item !== null && ter.item.referent.toString().includes("округ")) 
                            return null;
                    }
                }
            }
            if (term.startsWith("УЛ")) {
                let sti = StreetItemToken.tryParse(t, null, false, null);
                if (sti !== null && sti.typ === StreetItemType.NOUN) {
                    let _next = OrgTypToken.tryParse(sti.endToken.next, afterTerr, null);
                    if (_next !== null) {
                        if (_next.vals.includes("ВЧ")) {
                            _next = _next.clone();
                            _next.beginToken = t;
                            return _next;
                        }
                    }
                }
            }
        }
        let t1 = null;
        let typs = null;
        let doubt = false;
        let notorg = false;
        let notgeo = false;
        let canbesingle = false;
        let _morph = null;
        let tok = OrgTypToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if ((tok === null && afterTerr && (t instanceof TextToken)) && t.term === "СТ") 
            tok = TerminToken._new712(t, t, OrgTypToken.m_St);
        if (tok !== null) {
            let val = tok.termin.canonicText.toLowerCase();
            if (val === "гаражное товарищество" && (tok.lengthChar < 6)) {
                let tt1 = t.previous;
                if (tt1 !== null && tt1.isChar('.')) 
                    tt1 = tt1.previous;
                if (tt1 !== null && tt1.isValue("П", null)) 
                    return null;
            }
            for (let tt = tok.endToken.next; tt !== null; tt = tt.next) {
                if (!(tt instanceof TextToken) || tt.whitespacesBeforeCount > 2) 
                    break;
                if ((tt.isValue("ГРАЖДАНИН", null) || tt.isValue("ЗАСТРОЙЩИК", null) || tt.isValue("ГАРАЖ", null)) || tt.isValue("СОБСТВЕННИК", null)) {
                    if (!tt.chars.isAllLower) {
                        if (tt.next === null || tt.next.isComma) 
                            break;
                    }
                    tok.endToken = tt;
                    val = (val + " " + tt.term.toLowerCase());
                }
                else 
                    break;
            }
            t1 = tok.endToken;
            typs = new Array();
            _morph = tok.morph;
            notorg = tok.termin.tag3 !== null;
            notgeo = tok.termin.tag2 !== null;
            if ((tok.termin.tag instanceof StreetItemType) && (StreetItemType.of(tok.termin.tag)) === StreetItemType.STDNAME) 
                canbesingle = true;
            typs.push(val);
            if (tok.termin.acronym !== null) 
                typs.push(tok.termin.acronym);
            if (tok.endToken === t) {
                if ((t.lengthChar < 4) && (t instanceof TextToken) && LanguageHelper.endsWith(t.term, "К")) {
                    let oi = TerrItemToken.checkOntoItem(t.next);
                    if (oi !== null) {
                        if (t.next.getMorphClassInDictionary().isAdjective && oi.beginToken === oi.endToken) {
                        }
                        else 
                            return null;
                    }
                    if ((!afterTerr && t.chars.isAllUpper && t.next !== null) && t.next.chars.isAllUpper && t.next.lengthChar > 1) 
                        return null;
                }
            }
            if (tok.termin.canonicText === "МЕСТОРОЖДЕНИЕ" && (tok.endToken.next instanceof TextToken) && tok.endToken.next.chars.isAllLower) {
                let npt = NounPhraseHelper.tryParse(tok.endToken.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.chars.isAllLower) 
                    tok.endToken = npt.endToken;
            }
            if (((t.lengthChar === 1 && t.next !== null && t.next.isChar('.')) && (t.next.next instanceof TextToken) && t.next.next.lengthChar === 1) && t.next.next.next === tok.endToken && tok.endToken.isChar('.')) {
                let ok2 = false;
                if (canbesingle) 
                    ok2 = OrgTypToken._checkPiter(t);
                if (!ok2) {
                    if (t.chars.isAllUpper && t.next.next.chars.isAllUpper) 
                        return null;
                    if (tok.termin.canonicText === "ГАРАЖНОЕ ТОВАРИЩЕСТВО") {
                        if (!t.isWhitespaceBefore && t.previous !== null && t.previous.isChar('.')) 
                            return null;
                    }
                }
            }
        }
        else {
            if (StreetItemToken.checkKeyword(t)) 
                return null;
            let rtok = t.kit.processReferent("ORGANIZATION", t, "MINTYPE");
            if (rtok !== null) {
                if (t.isValue("ДИВИЗИЯ", null) || t.isValue("АРМИЯ", null) || t.isValue("СЕКТОР", null)) 
                    return null;
                if (rtok.endToken === t && t.isValue("ТК", null)) {
                    if (TerrItemToken.checkOntoItem(t.next) !== null) 
                        return null;
                    if (t.chars.isAllUpper && t.next !== null && t.next.chars.isAllUpper) 
                        return null;
                }
                if (rtok.beginToken !== rtok.endToken) {
                    for (let tt = rtok.beginToken.next; tt !== null && tt.endChar <= rtok.endChar; tt = tt.next) {
                        if (tt.lengthChar > 3) 
                            continue;
                        let _next = OrgTypToken.tryParse(tt, afterTerr, null);
                        if (_next !== null && _next.endChar > rtok.endChar) 
                            return null;
                    }
                }
                let prof = rtok.referent.getStringValue("PROFILE");
                if (Utils.compareStrings((prof != null ? prof : ""), "UNIT", true) === 0) 
                    doubt = true;
                t1 = rtok.endToken;
                typs = rtok.referent.getStringValues("TYPE");
                _morph = rtok.morph;
                if (t.isValue("БРИГАДА", null)) 
                    doubt = true;
            }
        }
        if (((t1 === null && (t instanceof TextToken) && t.lengthChar >= 2) && t.lengthChar <= 4 && t.chars.isAllUpper) && t.chars.isCyrillicLetter) {
            if (AddressItemToken.tryParsePureItem(t, null, null) !== null) 
                return null;
            if (t.lengthChar === 2) 
                return null;
            if (TerrItemToken.checkOntoItem(t) !== null) 
                return null;
            typs = new Array();
            typs.push(t.term);
            t1 = t;
            doubt = true;
        }
        if (t1 === null) 
            return null;
        if (_morph === null) 
            _morph = t1.morph;
        let res = OrgTypToken._new1272(t, t1, doubt, typs, _morph, notorg, notgeo, canbesingle);
        if (t.isValue("ОБЪЕДИНЕНИЕ", null)) 
            res.isDoubt = true;
        else if ((t instanceof TextToken) && t.term === "СО") 
            res.isDoubt = true;
        if (canbesingle) {
            if (res.lengthChar < 6) {
                if (!OrgTypToken._checkPiter(t)) 
                    return null;
            }
            return res;
        }
        if ((t === t1 && (t.lengthChar < 3) && t.next !== null) && t.next.isChar('.')) 
            res.endToken = t1.next;
        if ((lev < 2) && (res.whitespacesAfterCount < 3)) {
            let _next = OrgTypToken.tryParse(res.endToken.next, afterTerr, null);
            if (_next !== null && _next.vals.includes("участок")) 
                _next = null;
            if (_next !== null && !_next.beginToken.chars.isAllLower) {
                let nam = NameToken.tryParse(_next.endToken.next, GeoTokenType.ORG, 0, false);
                if (nam === null || _next.whitespacesAfterCount > 3) 
                    _next = null;
                else if ((nam.number !== null && nam.name === null && _next.lengthChar > 2) && _next.isDoubt) 
                    _next = null;
            }
            if (_next !== null) {
                if (!_next.isDoubt) 
                    res.isDoubt = false;
                res.mergeWith(_next);
            }
            else {
                t1 = res.endToken.next;
                if (t1 !== null && (t1.whitespacesBeforeCount < 3)) {
                    if (t1.isValue("СН", null)) 
                        res.endToken = t1;
                }
            }
        }
        t1 = res.endToken;
        if ((t1.next !== null && t1.next.isAnd && t1.next.next !== null) && ((t1.next.next.isValue("ПОСТРОЙКА", null) || t1.next.next.isValue("ХОЗПОСТРОЙКА", null)))) 
            res.endToken = t1.next.next;
        return res;
    }
    
    static _checkPiter(t) {
        if (MiscLocationHelper.isUserParamGarAddress(t)) 
            return true;
        let cou = 0;
        for (let ttt = t.previous; ttt !== null && (cou < 20); ttt = ttt.previous,cou++) {
            if (ttt.isValue("ПЕТЕРБУРГ", null) || ttt.isValue("СПБ", null) || ttt.isValue("ЛЕНИНГРАД", null)) 
                return true;
        }
        for (let ttt = t.next; ttt !== null && cou > 0; ttt = ttt.next,cou--) {
            if (ttt.isValue("ПЕТЕРБУРГ", null) || ttt.isValue("СПБ", null) || ttt.isValue("ЛЕНИНГРАД", null)) 
                return true;
        }
        return false;
    }
    
    mergeWith(ty) {
        for (const v of ty.vals) {
            if (!this.vals.includes(v)) 
                this.vals.push(v);
        }
        if (!ty.notOrg) 
            this.notOrg = false;
        this.endToken = ty.endToken;
    }
    
    static findTerminByAcronym(abbr) {
        let te = Termin._new1262(abbr, abbr);
        return OrgTypToken.m_Ontology.findTerminsByTermin(te);
    }
    
    static initialize() {
        OrgTypToken.m_Ontology = new TerminCollection();
        let t = Termin._new1262("САДОВОЕ ТОВАРИЩЕСТВО", "СТ");
        t.addVariant("САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        t.acronym = "СТ";
        t.addAbridge("С/ТОВ");
        t.addAbridge("ПК СТ");
        t.addAbridge("САД.ТОВ.");
        t.addAbridge("САДОВ.ТОВ.");
        t.addAbridge("С/Т");
        t.addVariant("ВЕДЕНИЕ ГРАЖДАНАМИ САДОВОДСТВА ИЛИ ОГОРОДНИЧЕСТВА ДЛЯ СОБСТВЕННЫХ НУЖД", false);
        OrgTypToken.m_St = t;
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ДАЧНОЕ ТОВАРИЩЕСТВО", "ДТ", true);
        t.addAbridge("Д/Т");
        t.addAbridge("ДАЧ/Т");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ЖИЛИЩНОЕ ТОВАРИЩЕСТВО", "ЖТ", true);
        t.addAbridge("Ж/Т");
        t.addAbridge("ЖИЛ/Т");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("САДОВЫЙ КООПЕРАТИВ", "СК", true);
        t.addVariant("САДОВОДЧЕСКИЙ КООПЕРАТИВ", false);
        t.addAbridge("С/К");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", "ПК", true);
        t.addVariant("ПОТРЕБКООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("САДОВОЕ ОБЩЕСТВО", "СО", true);
        t.addVariant("САДОВОДЧЕСКОЕ ОБЩЕСТВО", false);
        t.addVariant("САДОВОДСТВО", false);
        t.addAbridge("С/О");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ПОТРЕБИТЕЛЬСКОЕ САДОВОДЧЕСКОЕ ОБЩЕСТВО", "ПСО", true);
        t.addVariant("ПОТРЕБИТЕЛЬСКОЕ САДОВОЕ ОБЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("САДОВОЕ ТОВАРИЩЕСКОЕ ОБЩЕСТВО", "СТО", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("САДОВОЕ ПОТРЕБИТЕЛЬСКОЕ ОБЩЕСТВО", "СПО", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ ДАЧНОЕ ТОВАРИЩЕСТВО", "СДТ", true, true);
        t.addVariant("САДОВОЕ ДАЧНОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ОБЪЕДИНЕНИЕ", "ДНО", true, true);
        t.addVariant("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ОБЪЕДИНЕНИЕ ГРАЖДАН", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО", "ДНП", true, true);
        t.addVariant("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО ГРАЖДАН", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", "ДНТ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ДАЧНЫЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ");
        t.acronym = "ДПК";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", "ДСК", true, true);
        t.addVariant("ДАЧНЫЙ СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("СТРОИТЕЛЬНО ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", "СПК", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ВОДНО МОТОРНЫЙ КООПЕРАТИВ", "ВМК", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", "СНТ", true, true);
        t.addVariant("САДОВОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        t.addAbridge("САДОВ.НЕКОМ.ТОВ.");
        t.addVariant("ТСНСТ", false);
        t.addAbridge("САДОВОЕ НЕКОМ-Е ТОВАРИЩЕСТВО");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ОБЪЕДИНЕНИЕ", "СНО", true, true);
        t.addVariant("САДОВОЕ НЕКОММЕРЧЕСКОЕ ОБЪЕДИНЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО", "СНП", true, true);
        t.addVariant("САДОВОЕ НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКИЙ НЕКОММЕРЧЕСКИЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", "СНПК", true, true);
        t.addVariant("САДОВЫЙ НЕКОММЕРЧЕСКИЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", "СНТ", true, true);
        t.addVariant("САДОВОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКОЕ ОГОРОДНИЧЕСКОЕ ТОВАРИЩЕСТВО", "СОТ", true, true);
        t.addVariant("САДОВОЕ ОГОРОДНИЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", "ДНТ", true, true);
        t.addVariant("ДАЧНО НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("НЕКОММЕРЧЕСКОЕ САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО", "НСТ", true, true);
        t.addVariant("НЕКОММЕРЧЕСКОЕ САДОВОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ОБЪЕДИНЕННОЕ НЕКОММЕРЧЕСКОЕ САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО", "ОНСТ", true, true);
        t.addVariant("ОБЪЕДИНЕННОЕ НЕКОММЕРЧЕСКОЕ САДОВОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("САДОВОДЧЕСКАЯ ПОТРЕБИТЕЛЬСКАЯ КООПЕРАЦИЯ", "СПК", true, true);
        t.addVariant("САДОВАЯ ПОТРЕБИТЕЛЬСКАЯ КООПЕРАЦИЯ", false);
        t.addVariant("САДОВОДЧЕСКИЙ ПОТРЕБИТЕЛЬНЫЙ КООПЕРАТИВ", false);
        t.addVariant("САДОВОДЧЕСКИЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ДАЧНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", "ДСК", true, true);
        t.addVariant("ДАЧНЫЙ СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1283("ДАЧНО СТРОИТЕЛЬНО ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", "ДСПК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ЖИЛИЩНЫЙ СТРОИТЕЛЬНО ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", "ЖСПК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ЖИЛИЩНЫЙ СТРОИТЕЛЬНО ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ", "ЖСПКИЗ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ЖИЛИЩНЫЙ СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", "ЖСК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ЖИЛИЩНЫЙ СТРОИТЕЛЬНЫЙ КООПЕРАТИВ ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ", "ЖСКИЗ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ЖИЛИЩНОЕ СТРОИТЕЛЬНОЕ ТОВАРИЩЕСТВО", "ЖСТ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ПОТРЕБИТЕЛЬСКОЕ ОБЩЕСТВО ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ", "ПОТЗ", true, true));
        t = Termin._new1283("ОГОРОДНИЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ОБЪЕДИНЕНИЕ", "ОНО", true, true);
        t.addVariant("ОГОРОДНИЧЕСКОЕ ОБЪЕДИНЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ОГОРОДНИЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО", "ОНП", true, true);
        t.addVariant("ОГОРОДНИЧЕСКОЕ ПАРТНЕРСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ОГОРОДНИЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО", "ОНТ", true, true);
        t.addVariant("ОГОРОДНИЧЕСКОЕ ТОВАРИЩЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ОГОРОДНИЧЕСКИЙ ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", "ОПК", true, true);
        t.addVariant("ОГОРОДНИЧЕСКИЙ КООПЕРАТИВ", false);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1283("ТОВАРИЩЕСТВО СОБСТВЕННИКОВ НЕДВИЖИМОСТИ", "СТСН", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО СОБСТВЕННИКОВ НЕДВИЖИМОСТИ", "ТСН", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("САДОВОДЧЕСКОЕ ТОВАРИЩЕСТВО ЧАСТНЫХ ВЛАДЕЛЬЦЕВ", "СТЧВ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ТОВАРИЩЕСТВО СОБСТВЕННИКОВ ЖИЛЬЯ", "ТСЖ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ТОВАРИЩЕСТВО СОБСТВЕННИКОВ ЖИЛЬЯ КЛУБНОГО ПОСЕЛКА", "ТСЖКП", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("САДОВЫЕ ЗЕМЕЛЬНЫЕ УЧАСТКИ", "СЗУ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1283("ТОВАРИЩЕСТВО ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ", "ТИЗ", true, true));
        t = Termin._new1283("КОЛЛЕКТИВ ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ", "КИЗ", true, true);
        t.addVariant("КИЗК", false);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1283("ОБЩЕСТВО ИНДИВИДУАЛЬНЫХ ЗАСТРОЙЩИКОВ ГАРАЖЕЙ", "ОИЗГ", true, true));
        t = Termin._new1283("САДОВОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО СОБСТВЕННИКОВ НЕДВИЖИМОСТИ", "СНТСН", true, true);
        t.addVariant("САДОВОДЧЕСКОЕ НЕКОММЕРЧЕСКОЕ ТОВАРИЩЕСТВО СОБСТВЕННИКОВ НЕДВИЖИМОСТИ", false);
        t.addVariant("СНТ СН", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ПОТРЕБИТЕЛЬСКОЕ ГАРАЖНО СТРОИТЕЛЬНОЕ ОБЩЕСТВО", "ПГСО", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ПОТРЕБИТЕЛЬСКОЕ КООПЕРАТИВНОЕ ОБЩЕСТВО ГАРАЖЕЙ", "ПКОГ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО ГАРАЖНЫЙ КООПЕРАТИВ", "НПГК", true, true);
        t.addAbridge("НП ГК");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО СОБСТВЕННИКОВ", "НПС", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("СУБЪЕКТ МАЛОГО ПРЕДПРИНИМАТЕЛЬСТВА", "СМП", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1283("ЛИЧНОЕ ПОДСОБНОЕ ХОЗЯЙСТВО", "ЛПХ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ИНДИВИДУАЛЬНОЕ САДОВОДСТВО", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("КОЛЛЕКТИВНЫЙ ГАРАЖ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("КОМПЛЕКС ГАРАЖЕЙ", 1);
        t.addVariant("РАЙОН ГАРАЖЕЙ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ГАРАЖНЫЙ МАССИВ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПЛОЩАДКА ГАРАЖЕЙ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("КОЛЛЕКТИВНЫЙ САД", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("САД", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("КОМПЛЕКС ЗДАНИЙ И СООРУЖЕНИЙ", 1);
        t.addVariant("КОМПЛЕКС СТРОЕНИЙ И СООРУЖЕНИЙ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ОБЪЕДИНЕНИЕ");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПРОМЫШЛЕННАЯ ПЛОЩАДКА", 1);
        t.addVariant("ПРОМПЛОЩАДКА", false);
        t.addAbridge("ПРОМ.ПЛОЩАДКА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПРОИЗВОДСТВЕННАЯ ПЛОЩАДКА", 1);
        t.addAbridge("ПРОИЗВ.ПЛОЩАДКА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ИМУЩЕСТВЕННЫЙ КОМПЛЕКС", 1);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СОВМЕСТНОЕ ПРЕДПРИЯТИЕ");
        t.acronym = "СП";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО");
        t.acronym = "НП";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("АВТОМОБИЛЬНЫЙ КООПЕРАТИВ");
        t.addVariant("АВТОКООПЕРАТИВ", false);
        t.addVariant("АВТО КООПЕРАТИВ", false);
        t.addAbridge("А/К");
        t.acronym = "АК";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ГАРАЖНЫЙ КООПЕРАТИВ");
        t.addAbridge("Г/К");
        t.addAbridge("ГР.КОП.");
        t.addAbridge("ГАР.КОП.");
        t.addAbridge("ГАР.КООП.");
        t.addVariant("ГАРАЖНЫЙ КООП", false);
        t.addVariant("ГАРАЖНЫЙ КВАРТАЛ", false);
        t.acronym = "ГК";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("АВТОГАРАЖНЫЙ КООПЕРАТИВ");
        t.addVariant("АВТО ГАРАЖНЫЙ КООПЕРАТИВ", false);
        t.acronym = "АГК";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ГАРАЖНОЕ ТОВАРИЩЕСТВО");
        t.addAbridge("Г/Т");
        t.addAbridge("ГР.ТОВ.");
        t.addAbridge("ГАР.ТОВ.");
        t.addAbridge("ГАР.ТОВ-ВО");
        t.acronym = "ГТ";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПЛОЩАДКА ГАРАЖЕЙ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ГАРАЖНЫЙ КОМПЛЕКС", 1);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПРОИЗВОДСТВЕННЫЙ СЕЛЬСКОХОЗЯЙСТВЕННЫЙ КООПЕРАТИВ");
        t.addVariant("ПРОИЗВОДСТВЕННО СЕЛЬСКОХОЗЯЙСТВЕННЫЙ КООПЕРАТИВ", false);
        t.acronym = "ПСК";
        t.acronymCanBeLower = true;
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1281("ГАРАЖНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", "ГСК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ГАРАЖНО ЭКСПЛУАТАЦИОННЫЙ КООПЕРАТИВ", "ГЭК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ГАРАЖНО ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", "ГПК", true, true));
        t = Termin._new1281("КООПЕРАТИВ ПО СТРОИТЕЛЬСТВУ И ЭКСПЛУАТАЦИИ ГАРАЖЕЙ", "КСЭГ", true, true);
        t.addVariant("КСИЭГ", false);
        t.addVariant("КССГ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("КООПЕРАТИВ ПО СТРОИТЕЛЬСТВУ ГАРАЖЕЙ", "КСГ", true, true);
        t.addVariant("КССГ", false);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1281("ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНО СТРОИТЕЛЬНЫЙ КООПЕРАТИВ", "ПГСК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНО ЭКСПЛУАТАЦИОННЫЙ КООПЕРАТИВ", "ПГЭК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ОБЩЕСТВЕННО ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНЫЙ КООПЕРАТИВ", "ОПГК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ГАРАЖНЫЙ СТРОИТЕЛЬНО ПОТРЕБИТЕЛЬСКИЙ КООПЕРАТИВ", "ГСПК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("КООПЕРАТИВ ПО СТРОИТЕЛЬСТВУ И ЭКСПЛУАТАЦИИ ИНДИВИДУАЛЬНЫХ ГАРАЖЕЙ", "КСЭИГ", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ПОТРЕБИТЕЛЬСКИЙ ГАРАЖНЫЙ КООПЕРАТИВ", "ПГК", true, true));
        OrgTypToken.m_Ontology.add(Termin._new1281("ИНДИВИДУАЛЬНОЕ ЖИЛИЩНОЕ СТРОИТЕЛЬСТВО", "ИЖС", true, true));
        OrgTypToken.m_Ontology.add(new Termin("ЖИВОТНОВОДЧЕСКАЯ ТОЧКА"));
        t = Termin._new1353("ДАЧНАЯ ЗАСТРОЙКА", "ДЗ", true, 1);
        t.addVariant("КВАРТАЛ ДАЧНОЙ ЗАСТРОЙКИ", false);
        t.addVariant("ЗОНА ДАЧНОЙ ЗАСТРОЙКИ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1354("КОТТЕДЖНЫЙ ПОСЕЛОК", "КП", true, 1, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1354("ДАЧНЫЙ ПОСЕЛОК", "ДП", true, 1, 1);
        t.addAbridge("Д/П");
        t.addVariant("ДАЧНЫЙ ПОСЕЛОК МАССИВ", false);
        t.addVariant("ДП МАССИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1356("САДОВОДЧЕСКИЙ МАССИВ", 1, 1);
        t.addVariant("САД. МАССИВ", false);
        t.addVariant("САДОВЫЙ МАССИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("САНАТОРИЙ");
        t.addAbridge("САН.");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПАНСИОНАТ");
        t.addAbridge("ПАНС.");
        t.addVariant("ТУРИСТИЧЕСКИЙ ПАНСИОНАТ", false);
        t.addAbridge("ТУР.ПАНСИОНАТ");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ДЕТСКИЙ ГОРОДОК", 1);
        t.addAbridge("ДЕТ.ГОРОДОК");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1262("ДОМ ОТДЫХА", "ДО");
        t.addAbridge("Д/О");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("БАЗА ОТДЫХА", "БО", true);
        t.addAbridge("Б/О");
        t.addVariant("БАЗА ОТДЫХА РЫБАКА И ОХОТНИКА", false);
        t.addVariant("БАЗА ОТДЫХА СЕМЕЙНОГО ТИПА", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ТУРИСТИЧЕСКАЯ БАЗА", "ТБ", true);
        t.addAbridge("Т/Б");
        t.addVariant("ТУРБАЗА", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ФЕРМЕРСКОЕ ХОЗЯЙСТВО", "ФХ", true, true);
        t.addAbridge("Ф/Х");
        t.addAbridge("ФЕРМЕРСКОЕ Х-ВО");
        t.addAbridge("ФЕРМЕРСКОЕ ХОЗ-ВО");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("КРЕСТЬЯНСКОЕ ХОЗЯЙСТВО", "КХ", true, true);
        t.addAbridge("К/Х");
        t.addAbridge("КРЕСТЬЯНСКОЕ Х-ВО");
        t.addAbridge("КРЕСТЬЯНСКОЕ ХОЗ-ВО");
        t.addAbridge("КР.Х-ВО");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("КРЕСТЬЯНСКОЕ ФЕРМЕРСКОЕ ХОЗЯЙСТВО", "КФХ", true, true);
        t.addVariant("КРЕСТЬЯНСКОЕ (ФЕРМЕРСКОЕ) ХОЗЯЙСТВО", false);
        t.addAbridge("К.Ф.Х.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("САД-ОГОРОД", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ОВЦЕВОДЧЕСКАЯ ТОВАРНАЯ ФЕРМА", "ОТФ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("УЧЕБНОЕ ХОЗЯЙСТВО", "УХ", true);
        t.addAbridge("У/Х");
        t.addVariant("УЧХОЗ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ЗАВОД");
        t.addVariant("ЗВД", false);
        t.addAbridge("З-Д");
        t.addAbridge("З-ДА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("НЕФТЕПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", "НПЗ", true, true);
        t.addVariant("НЕФТЕ ПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ГАЗОПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", "ГПЗ", true, true);
        t.addVariant("ГАЗО ПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ФАБРИКА");
        t.addVariant("Ф-КА", false);
        t.addVariant("Ф-КИ", false);
        t.addAbridge("ФАБР.");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СОВХОЗ");
        t.addVariant("СВХ", false);
        t.addAbridge("С-ЗА");
        t.addAbridge("С/ЗА");
        t.addAbridge("С/З");
        t.addAbridge("СХ.");
        t.addAbridge("С/Х");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("КОЛХОЗ");
        t.addVariant("КЛХ", false);
        t.addAbridge("К-ЗА");
        t.addAbridge("К/ЗА");
        t.addAbridge("К/З");
        t.addAbridge("КХ.");
        t.addAbridge("К/Х");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("РЫБНОЕ ХОЗЯЙСТВО");
        t.addVariant("РЫБХОЗ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ЖИВОТНОВОДЧЕСКИЙ КОМПЛЕКС");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ЖИВОТНОВОДЧЕСКАЯ СТОЯНКА");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ЖИВОТНОВОДЧЕСКОЕ ТОВАРИЩЕСТВО");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ХОЗЯЙСТВО");
        t.addAbridge("ХОЗ-ВО");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("СЕЛЬСКОХОЗЯЙСТВЕННАЯ ЗЕМЛЯ", 1);
        t.addVariant("СЕЛЬХОЗ ЗЕМЛЯ", false);
        t.addAbridge("С/Х ЗЕМЛЯ");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПИОНЕРСКИЙ ЛАГЕРЬ");
        t.addAbridge("П/Л");
        t.addAbridge("П.Л.");
        t.addAbridge("ПИОНЕР.ЛАГ.");
        t.addVariant("ПИОНЕРЛАГЕРЬ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СПОРТИВНЫЙ ЛАГЕРЬ");
        t.addVariant("СПОРТЛАГЕРЬ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ОЗДОРОВИТЕЛЬНЫЙ ЛАГЕРЬ", "ОЛ", true);
        t.addAbridge("О/Л");
        t.addAbridge("О.Л.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ОЗДОРОВИТЕЛЬНЫЙ КОМПЛЕКС", "ОК", true);
        t.addAbridge("О/К");
        t.addAbridge("О.К.");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СПОРТИВНО ОЗДОРОВИТЕЛЬНЫЙ ЛАГЕРЬ");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СПОРТИВНО ОЗДОРОВИТЕЛЬНАЯ БАЗА");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("КУРОРТ");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("КОЛЛЕКТИВ ИНДИВИДУАЛЬНЫХ ВЛАДЕЛЬЦЕВ", "КИВ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПОДСОБНОЕ ХОЗЯЙСТВО");
        t.addAbridge("ПОДСОБНОЕ Х-ВО");
        t.addAbridge("ПОДСОБНОЕ ХОЗ-ВО");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("БИЗНЕС ЦЕНТР", "БЦ", true, true);
        t.addVariant("БІЗНЕС ЦЕНТР", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ТОРГОВЫЙ ЦЕНТР", "ТЦ", true, true);
        t.addVariant("ТОРГОВИЙ ЦЕНТР", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ТОРГОВО ОФИСНЫЙ ЦЕНТР", "ТОЦ", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ТОРГОВО ОФИСНЫЙ КОМПЛЕКС", "ТОК", true, true);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ ЦЕНТР", "ТРЦ", true, true);
        t.addVariant("ТОРГОВО РОЗВАЖАЛЬНИЙ ЦЕНТР", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1281("ТОРГОВО РАЗВЛЕКАТЕЛЬНЫЙ КОМПЛЕКС", "ТРК", true, true);
        t.addVariant("ТОРГОВО РОЗВАЖАЛЬНИЙ КОМПЛЕКС", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("АЭРОПОРТ", 1);
        t.addAbridge("А/П");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("АЭРОДРОМ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ГИДРОУЗЕЛ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ВОДОЗАБОР", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ВОДОХРАНИЛИЩЕ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("МОРСКОЙ ПОРТ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("РЕЧНОЙ ПОРТ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("СКЛАД", 1);
        t.addVariant("ЦЕНТРАЛЬНЫЙ СКЛАД", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПОЛЕ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПОЛЕВОЙ СТАН", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЧАБАНСКАЯ СТОЯНКА", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЛИЦЕНЗИОННЫЙ УЧАСТОК", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("УРОЧИЩЕ", 1);
        t.addAbridge("УР-ЩЕ");
        t.addAbridge("УР.");
        t.addAbridge("УРОЧ.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПАДЬ", 1);
        t.addVariant("ПЯДЬ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПАРК", 1);
        t.addVariant("ПРИРОДНЫЙ ПАРК", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1394("ПАРК КУЛЬТУРЫ И ОТДЫХА", "ПКО", 1);
        t.addVariant("ПКИО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЗАИМКА", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ОСТРОВ", 1);
        t.addAbridge("О-В");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ИСТОРИЧЕСКИЙ РАЙОН", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("КЛАДБИЩЕ", 1);
        t.addAbridge("КЛ-ЩЕ");
        t.addVariant("ГОРОДСКОЕ КЛАДБИЩЕ", false);
        t.addVariant("ПРАВОСЛАВНОЕ КЛАДБИЩЕ", false);
        t.addVariant("МУСУЛЬМАНСКОЕ КЛАДБИЩЕ", false);
        t.addVariant("ВОИНСКОЕ КЛАДБИЩЕ", false);
        t.addVariant("МЕМОРИАЛЬНОЕ КЛАДБИЩЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("БАЗА");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПРОИЗВОДСТВЕННАЯ БАЗА");
        t.addVariant("БАЗА ПРОИЗВОДСТВЕННОГО ОБЕСПЕЧЕНИЯ", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ПРОМЫШЛЕННАЯ БАЗА");
        t.addVariant("ПРОМБАЗА", false);
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("СТРОИТЕЛЬНАЯ БАЗА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1262("СТРОИТЕЛЬНО МОНТАЖНОЕ УПРАВЛЕНИЕ", "СМУ");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ВОЙСКОВАЯ ЧАСТЬ", "ВЧ", true);
        t.addVariant("ВОИНСКАЯ ЧАСТЬ", false);
        t.addAbridge("В/Ч");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("ПОЖАРНАЯ ЧАСТЬ", "ПЧ", true);
        t.addAbridge("ПОЖ. ЧАСТЬ");
        t.addAbridge("П/Ч");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1356("ВОЕННЫЙ ГОРОДОК", 1, 1);
        t.addAbridge("В.ГОРОДОК");
        t.addAbridge("В/Г");
        t.addAbridge("В/ГОРОДОК");
        t.addAbridge("В/ГОР");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("СТРОИТЕЛЬНОЕ УПРАВЛЕНИЕ", "СУ", true);
        t.addAbridge("С/У");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("МЕСТЕЧКО", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1356("ГОРОДОК", 1, 1);
        t.addVariant("ВАГОН ГОРОДОК", false);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1406("МІСТЕЧКО", MorphLang.UA, 1, MorphGender.NEUTER, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1356("HILL", 1, 1);
        t.addAbridge("HL.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1199("КВАРТИРНО ЭКСПЛУАТАЦИОННАЯ ЧАСТЬ", "КЭЧ", true);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1328("КАРЬЕР", 1));
        OrgTypToken.m_Ontology.add(Termin._new1328("РУДНИК", 1));
        OrgTypToken.m_Ontology.add(Termin._new1328("ПРИИСК", 1));
        OrgTypToken.m_Ontology.add(Termin._new1328("РАЗРЕЗ", 1));
        OrgTypToken.m_Ontology.add(Termin._new1328("ФАКТОРИЯ", 1));
        t = Termin._new1328("МЕСТОРОЖДЕНИЕ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЛОКАЛЬНОЕ ПОДНЯТИЕ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("НЕФТЯНОЕ МЕСТОРОЖДЕНИЕ", 1);
        t.addVariant("МЕСТОРОЖДЕНИЕ НЕФТИ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1417("ГАЗОВОЕ МЕСТОРОЖДЕНИЕ", "ГМ", true, true, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1417("НЕФТЕГАЗОВОЕ МЕСТОРОЖДЕНИЕ", "НГМ", true, true, 1);
        t.addVariant("НЕФТЯНОЕ ГАЗОВОЕ МЕСТОРОЖДЕНИЕ", false);
        t.addVariant("ГАЗОНЕФТЯНОЕ МЕСТОРОЖДЕНИЕ", false);
        t.addVariant("ГАЗОВО НЕФТЯНОЕ МЕСТОРОЖДЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1417("НЕФТЕГАЗОКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", "НГКМ", true, true, 1);
        t.addVariant("НЕФТЕГАЗОВОЕ КОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        t.addVariant("НЕФТЕГАЗОВОКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        t.addVariant("НЕФТЕГАЗКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1417("ГАЗОВОНЕФТЕКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", "ГНКМ", true, true, 1);
        t.addVariant("ГАЗОВО НЕФТЕ КОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1417("ГАЗОКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", "ГКМ", true, true, 1);
        t.addVariant("ГАЗОВОЕ КОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        t.addVariant("ГАЗОВОКОНДЕНСАТНОЕ МЕСТОРОЖДЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("НЕФТЕПЕРЕКАЧИВАЮЩАЯ СТАНЦИЯ", 1);
        OrgTypToken.m_Ontology.add(t);
        OrgTypToken.m_Ontology.add(Termin._new1328("ЛЕСНОЙ ТЕРМИНАЛ", 1));
        OrgTypToken.m_Ontology.add(Termin._new1328("МОЛОЧНЫЙ КОМПЛЕКС", 1));
        t = Termin._new1328("МЕСТОРОЖДЕНИЕ", 1);
        t.addAbridge("МЕСТОРОЖД.");
        t.addVariant("МЕСТОРОЖДЕНИЕ ЗОЛОТА", false);
        t.addVariant("МЕСТОРОЖДЕНИЕ РОССЫПНОГО ЗОЛОТА", false);
        t.addVariant("ЗОЛОТОЕ МЕСТОРОЖДЕНИЕ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("МЕСТНОСТЬ", StreetItemType.NOUN, MorphGender.FEMINIE, 1);
        t.addAbridge("МЕСТН.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЛЕСНИЧЕСТВО", 1);
        t.addAbridge("ЛЕС-ВО");
        t.addAbridge("ЛЕСН-ВО");
        t.addVariant("УЧАСТКОВОЕ ЛЕСНИЧЕСТВО", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЛЕСОПАРК", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЛЕСОУЧАСТОК", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЗАПОВЕДНИК", 1);
        t.addAbridge("ЗАП-К");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЦЕНТРАЛЬНАЯ УСАДЬБА", 1);
        t.addVariant("УСАДЬБА", false);
        t.addAbridge("ЦЕНТР.УС.");
        t.addAbridge("ЦЕНТР.УСАДЬБА");
        t.addAbridge("Ц/У");
        t.addAbridge("УС-БА");
        t.addAbridge("ЦЕНТР.УС-БА");
        OrgTypToken.m_Ontology.add(t);
        t = new Termin("ЦЕНТРАЛЬНОЕ ОТДЕЛЕНИЕ");
        t.addAbridge("Ц/О");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("СЕКТОР", 1);
        t.addAbridge("СЕК.");
        t.addAbridge("СЕКТ.");
        t.addAbridge("С-Р");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("МАССИВ", StreetItemType.NOUN, MorphGender.MASCULINE, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("ЗОНА", StreetItemType.NOUN, MorphGender.FEMINIE, 1);
        t.addVariant("ЗОНА (МАССИВ)", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("ЗОНА ГАРАЖЕЙ", StreetItemType.NOUN, MorphGender.FEMINIE, 1);
        t.addVariant("ЗОНА (МАССИВ) ГАРАЖЕЙ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ГАРАЖНАЯ ПЛОЩАДКА", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПОЛЕВОЙ МАССИВ", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ПОЛЕВОЙ УЧАСТОК", 1);
        t.addAbridge("ПОЛЕВОЙ УЧ-К");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("ПРОМЗОНА", StreetItemType.NOUN, MorphGender.FEMINIE, 1);
        t.addVariant("ПРОМЫШЛЕННАЯ ЗОНА", false);
        t.addVariant("ПРОИЗВОДСТВЕННАЯ ЗОНА", false);
        t.addVariant("ПРОМЫШЛЕННО КОММУНАЛЬНАЯ ЗОНА", false);
        t.addVariant("ЗОНА ПРОИЗВОДСТВЕННОГО ИСПОЛЬЗОВАНИЯ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1426("ПРОМУЗЕЛ", StreetItemType.NOUN, MorphGender.MASCULINE, 1);
        t.addVariant("ПРОМЫШЛЕННЫЙ УЗЕЛ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ПРОМЫШЛЕННЫЙ РАЙОН", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addVariant("ПРОМРАЙОН", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ПЛАНИРОВОЧНЫЙ РАЙОН", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addAbridge("П/Р");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ПРОИЗВОДСТВЕННО АДМИНИСТРАТИВНАЯ ЗОНА", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addAbridge("ПРОИЗВ. АДМ. ЗОНА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ЖИЛАЯ ЗОНА", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addVariant("ЖИЛЗОНА", false);
        t.addVariant("ЖИЛ.ЗОНА", false);
        t.addVariant("Ж.ЗОНА", false);
        t.addAbridge("Ж/З");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1445("ОСОБАЯ ЭКОНОМИЧЕСКАЯ ЗОНА", "ОЭЗ", true, true, 1, 1);
        t.addVariant("ОСОБАЯ ЭКОНОМИЧЕСКАЯ ЗОНА ПРОМЫШЛЕННО ПРОИЗВОДСТВЕННОГО ТИПА", false);
        t.addVariant("ОЭЗ ППТ", false);
        t.addVariant("ОЭЖЗППТ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ЗОНА ОТДЫХА", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addAbridge("З/О");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("КОММУНАЛЬНАЯ ЗОНА", StreetItemType.NOUN, 1, MorphGender.FEMINIE, 1);
        t.addVariant("КОМЗОНА", false);
        t.addAbridge("КОММУН. ЗОНА");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ЖИЛОЙ МАССИВ", StreetItemType.NOUN, 1, MorphGender.MASCULINE, 1);
        t.addAbridge("Ж.М.");
        t.addAbridge("Ж/М");
        t.addVariant("ЖИЛМАССИВ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1356("ЖИЛГОРОДОК", 1, 1);
        t.addVariant("ЖИЛИЩНЫЙ ГОРОДОК", false);
        t.addVariant("ЖИЛОЙ ГОРОДОК", false);
        t.addAbridge("Ж/Г");
        t.addAbridge("ЖИЛ.ГОР.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЖИЛРАЙОН", 1);
        t.addVariant("ЖИЛИЩНЫЙ РАЙОН", false);
        t.addVariant("ЖИЛОЙ РАЙОН", false);
        t.addAbridge("Ж/Р");
        t.addAbridge("ЖИЛ.РАЙОН");
        t.addAbridge("ЖИЛ.Р-Н");
        t.addAbridge("Ж/Р-Н");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1328("ЗАГОРОДНЫЙ КОМПЛЕКС", 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1441("ИНДУСТРИАЛЬНЫЙ ПАРК", StreetItemType.NOUN, 1, MorphGender.MASCULINE, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1453("КВАРТАЛ ДАЧНОЙ ЗАСТРОЙКИ", "КВАРТАЛ", StreetItemType.NOUN, 0, MorphGender.MASCULINE, 1);
        t.addVariant("ПРОМЫШЛЕННЫЙ КВАРТАЛ", false);
        t.addVariant("ИНДУСТРИАЛЬНЫЙ КВАРТАЛ", false);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1454("ЖИЛОЙ КОМПЛЕКС", StreetItemType.NOUN, "ЖК", 0, MorphGender.MASCULINE, 1);
        t.addVariant("ЖИЛКОМПЛЕКС", false);
        t.addAbridge("ЖИЛ.К.");
        t.addAbridge("Ж/К");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1454("ВАХТОВЫЙ ЖИЛОЙ КОМПЛЕКС", StreetItemType.NOUN, "ВЖК", 0, MorphGender.MASCULINE, 1);
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1456("ВАСИЛЬЕВСКИЙ ОСТРОВ", StreetItemType.STDNAME, "ВО", 1);
        t.addAbridge("В.О.");
        OrgTypToken.m_Ontology.add(t);
        t = Termin._new1457("ПЕТРОГРАДСКАЯ СТОРОНА", StreetItemType.STDNAME, 1);
        t.addAbridge("П.С.");
        OrgTypToken.m_Ontology.add(t);
    }
    
    static _new1272(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgTypToken(_arg1, _arg2);
        res.isDoubt = _arg3;
        res.vals = _arg4;
        res.morph = _arg5;
        res.notOrg = _arg6;
        res.notGeo = _arg7;
        res.canBeSingle = _arg8;
        return res;
    }
    
    static static_constructor() {
        OrgTypToken.SPEED_REGIME = false;
        OrgTypToken.m_St = null;
        OrgTypToken.m_Ontology = null;
    }
}


OrgTypToken.static_constructor();

module.exports = OrgTypToken