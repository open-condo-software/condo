/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const Stopwatch = require("./../../unisharp/Stopwatch");

const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");
const GetTextAttr = require("./../core/GetTextAttr");
const BracketHelper = require("./../core/BracketHelper");
const MorphLang = require("./../../morph/MorphLang");
const StreetItemType = require("./../address/internal/StreetItemType");
const CityItemTokenItemType = require("./internal/CityItemTokenItemType");
const ProcessorService = require("./../ProcessorService");
const MetaAddress = require("./../address/internal/MetaAddress");
const MetaStreet = require("./../address/internal/MetaStreet");
const Termin = require("./../core/Termin");
const TerminParseAttr = require("./../core/TerminParseAttr");
const MiscHelper = require("./../core/MiscHelper");
const IntOntologyItem = require("./../core/IntOntologyItem");
const AddressItemType = require("./../address/internal/AddressItemType");
const ReferentToken = require("./../ReferentToken");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const MetaGeo = require("./internal/MetaGeo");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const GeoReferent = require("./GeoReferent");
const AnalyzerData = require("./../core/AnalyzerData");
const TextToken = require("./../TextToken");
const GeoOwnerHelper = require("./internal/GeoOwnerHelper");
const GeoAnalyzerData = require("./internal/GeoAnalyzerData");
const Referent = require("./../Referent");
const Token = require("./../Token");
const Analyzer = require("./../Analyzer");
const MetaToken = require("./../MetaToken");

/**
 * Анализатор географических объектов (стран, регионов, населённых пунктов)
 */
class GeoAnalyzer extends Analyzer {
    
    get name() {
        return GeoAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Страны, регионы, города";
    }
    
    clone() {
        return new GeoAnalyzer();
    }
    
    get typeSystem() {
        return [MetaGeo.globalMeta];
    }
    
    get usedExternObjectTypes() {
        return ["PHONE"];
    }
    
    static getData(t) {
        if (t === null) 
            return null;
        return Utils.as(t.kit.getAnalyzerDataByAnalyzerName(GeoAnalyzer.ANALYZER_NAME), GeoAnalyzerData);
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaGeo.COUNTRY_CITY_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("countrycity.png"));
        res.put(MetaGeo.COUNTRY_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("country.png"));
        res.put(MetaGeo.CITY_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("city.png"));
        res.put(MetaGeo.DISTRICT_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("district.png"));
        res.put(MetaGeo.REGION_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("region.png"));
        res.put(MetaGeo.UNION_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("union.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === GeoReferent.OBJ_TYPENAME) 
            return new GeoReferent();
        return null;
    }
    
    get progressWeight() {
        return 15;
    }
    
    createAnalyzerData() {
        return new GeoAnalyzerData();
    }
    
    process(kit) {
        const MiscLocationHelper = require("./internal/MiscLocationHelper");
        const StreetItemToken = require("./../address/internal/StreetItemToken");
        const TerrItemToken = require("./internal/TerrItemToken");
        const AddressItemToken = require("./../address/internal/AddressItemToken");
        const CityAttachHelper = require("./internal/CityAttachHelper");
        const TerrDefineHelper = require("./internal/TerrDefineHelper");
        const OrgTypToken = require("./internal/OrgTypToken");
        const CityItemToken = require("./internal/CityItemToken");
        const OrgItemToken = require("./internal/OrgItemToken");
        let ad = Utils.as(kit.getAnalyzerData(this), GeoAnalyzerData);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            t.innerBool = false;
        }
        let sw = new Stopwatch();
        sw.reset();
        sw.start();
        MiscLocationHelper.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("Npt: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(10, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        AddressItemToken.SPEED_REGIME = true;
        AddressItemToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("AddressItemToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(20, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        OrgTypToken.SPEED_REGIME = true;
        OrgTypToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("OrgTypToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(30, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        OrgItemToken.SPEED_REGIME = true;
        OrgItemToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("OrgItemToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(40, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        StreetItemToken.SPEED_REGIME = true;
        StreetItemToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("StreetItemToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(60, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        TerrItemToken.SPEED_REGIME = true;
        TerrItemToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("TerrItemToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(65, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        CityItemToken.SPEED_REGIME = true;
        CityItemToken.prepareAllData(kit.firstToken);
        sw.stop();
        kit.msgs.push(("CityItemToken: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(85, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        let nonRegistered = new Array();
        for (let step = 0; step < 2; step++) {
            ad.step = step;
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                if (ad.referents.length >= 2000) 
                    break;
                if (step > 0 && (t instanceof ReferentToken)) {
                    let _geo = Utils.as(t.getReferent(), GeoReferent);
                    if (((_geo !== null && t.next !== null && t.next.isChar('(')) && t.next.next !== null && _geo.canBeEquals(t.next.next.getReferent(), ReferentsEqualType.WITHINONETEXT)) && t.next.next.next !== null && t.next.next.next.isChar(')')) {
                        let rt0 = ReferentToken._new1092(_geo, t, t.next.next.next, t.morph);
                        kit.embedToken(rt0);
                        t = rt0;
                        continue;
                    }
                    if ((_geo !== null && t.next !== null && t.next.isHiphen) && t.next.next !== null && _geo.canBeEquals(t.next.next.getReferent(), ReferentsEqualType.WITHINONETEXT)) {
                        let rt0 = ReferentToken._new1092(_geo, t, t.next.next, t.morph);
                        kit.embedToken(rt0);
                        t = rt0;
                        continue;
                    }
                }
                let ok = false;
                if (step === 0 || t.innerBool) 
                    ok = true;
                else if ((t instanceof TextToken) && t.chars.isLetter && !t.chars.isAllLower) 
                    ok = true;
                let cli = null;
                if (ok) 
                    cli = TerrItemToken.tryParseList(t, 5, ad);
                if (cli === null) 
                    continue;
                t.innerBool = true;
                let rt = TerrDefineHelper.tryDefine(cli, ad, false, null, nonRegistered);
                if ((rt === null && cli.length === 1 && cli[0].isAdjective) && cli[0].ontoItem !== null) {
                    let tt = cli[0].endToken.next;
                    if (tt !== null) {
                        if (tt.isChar(',')) 
                            tt = tt.next;
                        else if (tt.morph._class.isConjunction) {
                            tt = tt.next;
                            if (tt !== null && tt.morph._class.isConjunction) 
                                tt = tt.next;
                        }
                        let cli1 = TerrItemToken.tryParseList(tt, 2, null);
                        if (cli1 !== null && cli1[0].ontoItem !== null) {
                            let g0 = Utils.as(cli[0].ontoItem.referent, GeoReferent);
                            let g1 = Utils.as(cli1[0].ontoItem.referent, GeoReferent);
                            if ((g0 !== null && g1 !== null && g0.isRegion) && g1.isRegion) {
                                if (g0.isCity === g1.isCity || g0.isRegion === g1.isRegion || g0.isState === g1.isState) 
                                    rt = TerrDefineHelper.tryDefine(cli, ad, true, null, null);
                            }
                        }
                        if (rt === null && cli[0].ontoItem.referent.isState) {
                            if ((rt === null && tt !== null && (tt.getReferent() instanceof GeoReferent)) && tt.whitespacesBeforeCount === 1) {
                                let geo2 = Utils.as(tt.getReferent(), GeoReferent);
                                if (GeoOwnerHelper.canBeHigher(Utils.as(cli[0].ontoItem.referent, GeoReferent), geo2, null, null)) {
                                    let cl = cli[0].ontoItem.referent.clone();
                                    cl.occurrence.splice(0, cl.occurrence.length);
                                    rt = ReferentToken._new1092(cl, cli[0].beginToken, cli[0].endToken, cli[0].morph);
                                }
                            }
                            if (rt === null && step === 0) {
                                let npt = MiscLocationHelper.tryParseNpt(cli[0].beginToken);
                                if (npt !== null && npt.endChar >= tt.beginChar) {
                                    let cits = CityItemToken.tryParseList(tt, 5, ad);
                                    let rt1 = (cits === null ? null : CityAttachHelper.tryDefine(cits, ad, false));
                                    if (rt1 !== null) {
                                        rt1.referent = ad.registerReferent(rt1.referent);
                                        kit.embedToken(rt1);
                                        let cl = cli[0].ontoItem.referent.clone();
                                        cl.occurrence.splice(0, cl.occurrence.length);
                                        rt = ReferentToken._new1092(cl, cli[0].beginToken, cli[0].endToken, cli[0].morph);
                                    }
                                }
                            }
                        }
                    }
                }
                if (rt === null) {
                    let cits = this.tryParseCityListBack(t.previous);
                    if (cits !== null) 
                        rt = TerrDefineHelper.tryDefine(cli, ad, false, cits, null);
                }
                if (rt === null && cli.length === 2) {
                    let te = cli[cli.length - 1].endToken.next;
                    if (te !== null) {
                        if (te.morph._class.isPreposition || te.isChar(',')) 
                            te = te.next;
                    }
                    let li = AddressItemToken.tryParseList(te, 2);
                    if (li !== null && li.length > 0) {
                        if (li[0].typ === AddressItemType.STREET || li[0].typ === AddressItemType.KILOMETER || li[0].typ === AddressItemType.HOUSE) {
                            let ad0 = StreetItemToken.tryParse(cli[0].beginToken.previous, null, false, null);
                            if (ad0 !== null && ad0.typ === StreetItemType.NOUN) {
                            }
                            else if (!cli[0].isAdjective) 
                                rt = TerrDefineHelper.tryDefine(cli, ad, true, null, null);
                            else {
                                let aaa = AddressItemToken.tryParse(cli[0].beginToken, false, null, null);
                                if (aaa !== null && aaa.typ === AddressItemType.STREET) {
                                }
                                else 
                                    rt = TerrDefineHelper.tryDefine(cli, ad, true, null, null);
                            }
                        }
                    }
                }
                if ((rt === null && cli.length > 2 && cli[0].terminItem === null) && cli[1].terminItem === null && cli[2].terminItem !== null) {
                    let cit = CityItemToken.tryParseBack(cli[0].beginToken.previous, false);
                    if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) {
                        if (((cli.length > 4 && cli[1].terminItem === null && cli[2].terminItem !== null) && cli[3].terminItem === null && cli[4].terminItem !== null) && cli[2].terminItem.canonicText.endsWith(cli[4].terminItem.canonicText)) {
                        }
                        else {
                            cli.splice(0, 1);
                            rt = TerrDefineHelper.tryDefine(cli, ad, true, null, null);
                        }
                    }
                }
                if (rt !== null) {
                    if (MiscLocationHelper.checkTerritory(rt.beginToken.previous) !== null) {
                        if (!rt.beginToken.previous.isValue("ГРАНИЦА", null)) 
                            rt.beginToken = rt.beginToken.previous;
                    }
                    let _geo = Utils.as(rt.referent, GeoReferent);
                    if ((!MiscLocationHelper.isUserParamAddress(rt) && !_geo.isCity && !_geo.isState) && _geo.findSlot(GeoReferent.ATTR_TYPE, "республика", true) === null) 
                        nonRegistered.push(_geo);
                    else 
                        rt.referent = ad.registerReferent(_geo);
                    let tt2 = rt.beginToken.previous;
                    if (tt2 !== null && tt2.isComma) 
                        tt2 = tt2.previous;
                    if (tt2 !== null && tt2.getReferent() === rt.referent) {
                        rt.beginToken = tt2;
                        tt2 = rt.endToken.next;
                        if (tt2 !== null && tt2.isChar(')')) {
                            if (rt.getSourceText().indexOf('(') >= 0) 
                                rt.endToken = tt2;
                        }
                    }
                    kit.embedToken(rt);
                    t = rt;
                    if (step === 0) {
                        let tt = t;
                        while (true) {
                            let rr = this.tryAttachTerritoryBeforeCity(tt, ad);
                            if (rr === null) 
                                break;
                            _geo = Utils.as(rr.referent, GeoReferent);
                            if (!_geo.isCity && !_geo.isState) 
                                nonRegistered.push(_geo);
                            else 
                                rr.referent = ad.registerReferent(_geo);
                            kit.embedToken(rr);
                            tt = rr;
                        }
                        if (t.next !== null && ((t.next.isComma || t.next.isChar('(')))) {
                            let rt1 = TerrDefineHelper.tryAttachStateUSATerritory(t.next.next);
                            if (rt1 !== null) {
                                rt1.referent = ad.registerReferent(rt1.referent);
                                kit.embedToken(rt1);
                                t = rt1;
                            }
                        }
                    }
                    continue;
                }
            }
        }
        for (let t = kit.firstToken; t !== null; t = (t === null ? null : t.next)) {
            if (t.isIgnored) 
                continue;
            let g = Utils.as(t.getReferent(), GeoReferent);
            if (g === null) 
                continue;
            if (t.next !== null && t.next.isCharOf("(/\\") && (t.next.next instanceof ReferentToken)) {
                let g2 = Utils.as(t.next.next.getReferent(), GeoReferent);
                if (g2 !== null && g2 === g) {
                    let rt2 = new ReferentToken(g, t, t.next.next);
                    if (rt2.endToken.next !== null && rt2.endToken.next.isCharOf(")/\\")) 
                        rt2.endToken = rt2.endToken.next;
                    t.kit.embedToken(rt2);
                    t = rt2;
                }
            }
            if (!(t.previous instanceof TextToken)) 
                continue;
            let t0 = null;
            if (t.previous.isValue("СОЮЗ", null)) 
                t0 = t.previous;
            else if (t.previous.isValue("ГОСУДАРСТВО", null) && t.previous.previous !== null && t.previous.previous.isValue("СОЮЗНЫЙ", null)) 
                t0 = t.previous.previous;
            if (t0 === null) 
                continue;
            let npt = MiscLocationHelper.tryParseNpt(t0.previous);
            if (npt !== null && npt.endToken === t.previous) 
                t0 = t0.previous;
            let uni = new GeoReferent();
            let typ = MiscHelper.getTextValue(t0, t.previous, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
            if (typ === null) 
                continue;
            uni.addTypUnion(t0.kit.baseLanguage);
            uni.addTyp(typ.toLowerCase());
            uni.addSlot(GeoReferent.ATTR_REF, g, false, 0);
            let t1 = t;
            let i = 1;
            for (t = t.next; t !== null; t = t.next) {
                if (t.isCommaAnd) 
                    continue;
                if ((((g = Utils.as(t.getReferent(), GeoReferent)))) === null) 
                    break;
                if (uni.findSlot(GeoReferent.ATTR_REF, g, true) !== null) 
                    break;
                if (t.isNewlineBefore) 
                    break;
                t1 = t;
                uni.addSlot(GeoReferent.ATTR_REF, g, false, 0);
                i++;
            }
            if (i < 2) 
                continue;
            uni = Utils.as(ad.registerReferent(uni), GeoReferent);
            let rt = new ReferentToken(uni, t0, t1);
            kit.embedToken(rt);
            t = rt;
        }
        sw.stop();
        kit.msgs.push(("Territories: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(90, 100, kit)) 
            return;
        sw.reset();
        sw.start();
        let newCities = false;
        let isCityBefore = false;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (t.isCharOf(".,")) 
                continue;
            if (t.isValue("ГЛАВА", null)) {
            }
            let li = null;
            li = CityItemToken.tryParseList(t, 5, ad);
            let rt = null;
            if (li !== null) {
                if ((((rt = CityAttachHelper.tryDefine(li, ad, false)))) !== null) {
                    let tt = t.previous;
                    if (tt !== null && tt.isComma) 
                        tt = tt.previous;
                    if (tt !== null && (tt.getReferent() instanceof GeoReferent)) {
                        if (tt.getReferent().canBeEquals(rt.referent, ReferentsEqualType.WITHINONETEXT)) {
                            rt.beginToken = tt;
                            rt.referent = ad.registerReferent(rt.referent);
                            kit.embedToken(rt);
                            t = rt;
                            continue;
                        }
                    }
                    if (ad.referents.length > 2000) 
                        break;
                    if (li.length === 2 && li[0].ortoCity !== null) {
                        li[0].ortoCity.referent = ad.registerReferent(li[0].ortoCity.referent);
                        let rt1 = new ReferentToken(li[0].ortoCity.referent, li[0].beginToken, li[1].beginToken.previous);
                        kit.embedToken(rt1);
                        rt.beginToken = li[1].beginToken;
                        rt.endToken = li[1].endToken;
                    }
                    rt.referent = Utils.as(ad.registerReferent(rt.referent), GeoReferent);
                    kit.embedToken(rt);
                    t = rt;
                    isCityBefore = true;
                    newCities = true;
                    tt = t;
                    while (true) {
                        let rr = this.tryAttachTerritoryBeforeCity(tt, ad);
                        if (rr === null) 
                            break;
                        let _geo = Utils.as(rr.referent, GeoReferent);
                        if (!_geo.isCity && !_geo.isState) 
                            nonRegistered.push(_geo);
                        else 
                            rr.referent = ad.registerReferent(_geo);
                        kit.embedToken(rr);
                        tt = rr;
                    }
                    rt = this.tryAttachTerritoryAfterCity(t, ad);
                    if (rt !== null) {
                        rt.referent = ad.registerReferent(rt.referent);
                        kit.embedToken(rt);
                        t = rt;
                    }
                    continue;
                }
            }
            if (!t.innerBool) {
                isCityBefore = false;
                continue;
            }
            if (!isCityBefore) 
                continue;
            let tts = TerrItemToken.tryParseList(t, 5, null);
            if (tts !== null && tts.length > 1 && ((tts[0].terminItem !== null || tts[1].terminItem !== null))) {
                if ((((rt = TerrDefineHelper.tryDefine(tts, ad, true, null, null)))) !== null) {
                    let _geo = Utils.as(rt.referent, GeoReferent);
                    if (!_geo.isCity && !_geo.isState) 
                        nonRegistered.push(_geo);
                    else 
                        rt.referent = ad.registerReferent(_geo);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            isCityBefore = false;
        }
        sw.stop();
        kit.msgs.push(("Cities: " + sw.elapsedMilliseconds + "ms"));
        sw.reset();
        sw.start();
        if (newCities && ad.localOntology.items.length > 0) {
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                if (!(t instanceof TextToken)) 
                    continue;
                if (t.chars.isAllLower) 
                    continue;
                let li = ad.localOntology.tryAttach(t, null, false);
                if (li === null) 
                    continue;
                let mc = t.getMorphClassInDictionary();
                if (mc.isProperSurname || mc.isProperName || mc.isProperSecname) 
                    continue;
                if (t.morph._class.isAdjective) 
                    continue;
                let _geo = Utils.as(li[0].item.referent, GeoReferent);
                if (_geo !== null) {
                    _geo = Utils.as(_geo.clone(), GeoReferent);
                    _geo.occurrence.splice(0, _geo.occurrence.length);
                    let rt = ReferentToken._new1092(_geo, li[0].beginToken, li[0].endToken, t.morph);
                    if (rt.beginToken === rt.endToken) 
                        _geo.addName(t.term);
                    if (rt.beginToken.previous !== null && rt.beginToken.previous.isValue("СЕЛО", null) && _geo.isCity) {
                        rt.beginToken = rt.beginToken.previous;
                        rt.morph = rt.beginToken.morph;
                        _geo.addSlot(GeoReferent.ATTR_TYPE, "село", true, 0);
                    }
                    kit.embedToken(rt);
                    t = li[0].endToken;
                }
            }
        }
        let goBack = false;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (goBack) {
                goBack = false;
                if (t.previous !== null) 
                    t = t.previous;
            }
            let _geo = Utils.as(t.getReferent(), GeoReferent);
            if (_geo === null) 
                continue;
            let geo1 = null;
            let tt = t.next;
            let bra = false;
            let comma1 = false;
            let comma2 = false;
            let inp = false;
            let adj = false;
            for (; tt !== null; tt = tt.next) {
                if (tt.isCharOf(",")) {
                    comma1 = true;
                    continue;
                }
                if (tt.isValue("IN", null) || tt.isValue("В", null)) {
                    inp = true;
                    continue;
                }
                if (MiscHelper.isEngAdjSuffix(tt)) {
                    adj = true;
                    tt = tt.next;
                    continue;
                }
                let det = AddressItemToken.tryParsePureItem(tt, null, ad);
                if (det !== null && det.typ === AddressItemType.DETAIL) {
                    tt = det.endToken;
                    comma1 = true;
                    continue;
                }
                if (tt.morph._class.isPreposition) 
                    continue;
                if (tt.isChar('(') && tt === t.next) {
                    bra = true;
                    continue;
                }
                if ((tt instanceof TextToken) && BracketHelper.isBracket(tt, true)) 
                    continue;
                geo1 = Utils.as(tt.getReferent(), GeoReferent);
                break;
            }
            if (geo1 === null) 
                continue;
            if (tt.whitespacesBeforeCount > 15) 
                continue;
            else if ((tt !== null && tt.next !== null && tt.next.isHiphen) && MiscLocationHelper.isUserParamAddress(tt)) {
                let sit = StreetItemToken.tryParseSpec(tt, null);
                if (sit !== null && sit[0].typ === StreetItemType.NAME) 
                    continue;
            }
            let ttt = tt.next;
            let geo2 = null;
            for (; ttt !== null; ttt = ttt.next) {
                if (ttt.isCommaAnd) {
                    comma2 = true;
                    continue;
                }
                let det = AddressItemToken.tryParsePureItem(ttt, null, ad);
                if (det !== null && det.typ === AddressItemType.DETAIL) {
                    ttt = det.endToken;
                    comma2 = true;
                    continue;
                }
                if (ttt.morph._class.isPreposition) 
                    continue;
                geo2 = Utils.as(ttt.getReferent(), GeoReferent);
                break;
            }
            if (ttt !== null && ttt.whitespacesBeforeCount > 15) 
                geo2 = null;
            else if ((ttt !== null && ttt.next !== null && ttt.next.isHiphen) && MiscLocationHelper.isUserParamAddress(ttt)) {
                let sit = StreetItemToken.tryParseSpec(ttt, null);
                if (sit !== null && sit[0].typ === StreetItemType.NAME) 
                    geo2 = null;
            }
            if (geo2 !== null) {
                let ok2 = comma1 && comma2;
                if (comma1 !== comma2) {
                    if (_geo.isRegion && geo1.isRegion && geo2.isCity) 
                        ok2 = true;
                }
                if (ok2 && GeoOwnerHelper.canBeHigherToken(t, tt) && GeoOwnerHelper.canBeHigherToken(tt, ttt)) {
                    geo2.higher = geo1;
                    geo1.higher = _geo;
                    let rt0 = ReferentToken._new1092(geo1, t, tt, tt.morph);
                    kit.embedToken(rt0);
                    let rt = ReferentToken._new1092(geo2, rt0, ttt, ttt.morph);
                    kit.embedToken(rt);
                    t = rt;
                    goBack = true;
                    continue;
                }
                else if (GeoOwnerHelper.canBeHigherToken(ttt, tt)) {
                    if (GeoOwnerHelper.canBeHigherToken(t, ttt)) {
                        if (geo2.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null && geo1.findSlot(GeoReferent.ATTR_TYPE, "район", true) !== null && _geo.isRegion) {
                            geo2.higher = geo1;
                            geo1.higher = _geo;
                            let rt0 = ReferentToken._new1092(geo1, t, tt, tt.morph);
                            kit.embedToken(rt0);
                            let rt = ReferentToken._new1092(geo2, rt0, ttt, ttt.morph);
                            kit.embedToken(rt);
                            t = rt;
                            goBack = true;
                            continue;
                        }
                        else {
                            geo2.higher = _geo;
                            geo1.higher = geo2;
                            let rt = ReferentToken._new1092(geo1, t, ttt, tt.morph);
                            kit.embedToken(rt);
                            t = rt;
                            goBack = true;
                            continue;
                        }
                    }
                    if (GeoOwnerHelper.canBeHigherToken(ttt, t) && GeoOwnerHelper.canBeHigherToken(t, tt)) {
                        if (ttt.isNewlineBefore) 
                            ttt = tt;
                        else 
                            _geo.higher = geo2;
                        geo1.higher = _geo;
                        let rt = ReferentToken._new1092(geo1, t, ttt, tt.morph);
                        kit.embedToken(rt);
                        t = rt;
                        goBack = true;
                        continue;
                    }
                    if (GeoOwnerHelper.canBeHigherToken(tt, t)) {
                        _geo.higher = geo1;
                        geo1.higher = geo2;
                        let rt0 = ReferentToken._new1092(geo1, tt, ttt, tt.morph);
                        kit.embedToken(rt0);
                        let rt = ReferentToken._new1092(_geo, t, rt0, t.morph);
                        kit.embedToken(rt);
                        t = rt;
                        goBack = true;
                        continue;
                    }
                    if (GeoOwnerHelper.canBeHigherToken(t, tt) && GeoOwnerHelper.canBeHigherToken(ttt, tt)) {
                        if (geo1.findSlot(GeoReferent.ATTR_TYPE, "муниципальный округ", true) !== null && _geo.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null && geo2.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null) {
                            if (geo2.findSlot(GeoReferent.ATTR_NAME, "МОСКВА", true) !== null) {
                                _geo.higher = geo1;
                                geo1.higher = geo2;
                                let rt0 = ReferentToken._new1092(geo1, tt, ttt, tt.morph);
                                kit.embedToken(rt0);
                                let rt = ReferentToken._new1092(_geo, t, rt0, t.morph);
                                kit.embedToken(rt);
                                t = rt;
                                goBack = true;
                                continue;
                            }
                            else {
                                geo2.higher = geo1;
                                geo1.higher = _geo;
                                let rt0 = ReferentToken._new1092(geo1, t, tt, tt.morph);
                                kit.embedToken(rt0);
                                let rt = ReferentToken._new1092(geo2, rt0, ttt, ttt.morph);
                                kit.embedToken(rt);
                                t = rt;
                                goBack = true;
                                continue;
                            }
                        }
                    }
                }
                if (comma2) 
                    continue;
            }
            if (GeoOwnerHelper.canBeHigherToken(t, tt) && ((!GeoOwnerHelper.canBeHigherToken(tt, t) || adj))) {
                geo1.higher = _geo;
                let rt = ReferentToken._new1092(geo1, t, tt, tt.morph);
                if ((geo1.isCity && !_geo.isCity && t.previous !== null) && t.previous.isValue("СТОЛИЦА", "СТОЛИЦЯ")) {
                    rt.beginToken = t.previous;
                    rt.morph = t.previous.morph;
                }
                kit.embedToken(rt);
                t = rt;
                goBack = true;
                continue;
            }
            if (GeoOwnerHelper.canBeHigherToken(tt, t) && ((!GeoOwnerHelper.canBeHigherToken(t, tt) || inp))) {
                if (_geo.higher === null) 
                    _geo.higher = geo1;
                else if (geo1.higher === null && GeoOwnerHelper.canBeHigher(_geo.higher, geo1, null, null) && !GeoOwnerHelper.canBeHigher(geo1, _geo.higher, null, null)) {
                    geo1.higher = _geo.higher;
                    _geo.higher = geo1;
                }
                else 
                    _geo.higher = geo1;
                if (bra && tt.next !== null && tt.next.isChar(')')) 
                    tt = tt.next;
                if ((bra && geo1.isRegion && geo1.higher === null) && _geo.isCity && MiscLocationHelper.isUserParamAddress(tt)) {
                    let tt2 = tt.next;
                    while (tt2 !== null) {
                        if (tt2.isComma) 
                            tt2 = tt2.next;
                        else 
                            break;
                    }
                    if (tt2 instanceof TextToken) {
                        let ter = TerrItemToken.tryParse(tt2, null, null);
                        if (ter !== null && ter.ontoItem === null && ter.terminItem === null) {
                            tt2 = ter.endToken.next;
                            while (tt2 !== null) {
                                if (tt2.isComma) 
                                    tt2 = tt2.next;
                                else 
                                    break;
                            }
                            if (tt2 !== null && (tt2.getReferent() instanceof GeoReferent)) {
                                if (GeoOwnerHelper.canBeHigher(Utils.as(tt2.getReferent(), GeoReferent), geo1, null, null)) {
                                    geo1.higher = Utils.as(tt2.getReferent(), GeoReferent);
                                    tt = tt2;
                                }
                            }
                        }
                    }
                }
                let rt = ReferentToken._new1092(_geo, t, tt, t.morph);
                kit.embedToken(rt);
                t = rt;
                goBack = true;
                continue;
            }
            if ((!tt.morph._class.isAdjective && !t.morph._class.isAdjective && tt.chars.isCyrillicLetter) && t.chars.isCyrillicLetter && !tt.morph._case.isInstrumental) {
                for (let geo0 = _geo; geo0 !== null; geo0 = geo0.higher) {
                    if (GeoOwnerHelper.canBeHigher(geo1, geo0, null, null)) {
                        geo0.higher = geo1;
                        let rt = ReferentToken._new1092(_geo, t, tt, t.morph);
                        kit.embedToken(rt);
                        t = rt;
                        goBack = true;
                        break;
                    }
                }
            }
        }
        let citiesSettls = new Hashtable();
        let citiesSettls2 = new Hashtable();
        for (const v of ad.localOntology.items) {
            let g = Utils.as(v.referent, GeoReferent);
            if (g === null || !g.isCity) 
                continue;
            if (g.findSlot(GeoReferent.ATTR_TYPE, "городское поселение", true) !== null) {
                for (const n of g.getStringValues(GeoReferent.ATTR_NAME)) {
                    if (!citiesSettls.containsKey(n)) 
                        citiesSettls.put(n, g);
                }
            }
        }
        for (const g of nonRegistered) {
            if (!g.isRegion) 
                continue;
            if (g.findSlot(GeoReferent.ATTR_TYPE, "городской округ", true) === null) 
                continue;
            for (const n of g.getStringValues(GeoReferent.ATTR_NAME)) {
                if (!citiesSettls2.containsKey(n)) 
                    citiesSettls2.put(n, g);
            }
        }
        for (const v of ad.localOntology.items) {
            let g = Utils.as(v.referent, GeoReferent);
            if (g === null || !g.isCity) 
                continue;
            if (g.higher !== null) 
                continue;
            if (g.findSlot(GeoReferent.ATTR_TYPE, "город", true) === null) 
                continue;
            for (const n of g.getStringValues(GeoReferent.ATTR_NAME)) {
                if (citiesSettls.containsKey(n)) {
                    g.higher = citiesSettls.get(n);
                    break;
                }
                else if (citiesSettls2.containsKey(n)) {
                    g.higher = citiesSettls2.get(n);
                    break;
                }
            }
        }
        for (let k = 0; k < nonRegistered.length; k++) {
            let ch = false;
            for (let i = 0; i < (nonRegistered.length - 1); i++) {
                if (GeoAnalyzer.geoComp(nonRegistered[i], nonRegistered[i + 1]) > 0) {
                    ch = true;
                    let v = nonRegistered[i];
                    nonRegistered[i] = nonRegistered[i + 1];
                    nonRegistered[i + 1] = v;
                }
            }
            if (!ch) 
                break;
        }
        for (const g of nonRegistered) {
            g.tag = null;
        }
        for (const ng of nonRegistered) {
            for (const s of ng.slots) {
                if (s.value instanceof GeoReferent) {
                    if (s.value.tag instanceof GeoReferent) 
                        ng.uploadSlot(s, Utils.as(s.value.tag, GeoReferent));
                }
            }
            let rg = Utils.as(ad.registerReferent(ng), GeoReferent);
            if (rg === ng) 
                continue;
            ng.tag = rg;
            for (const oc of ng.occurrence) {
                oc.occurenceOf = rg;
                rg.addOccurence(oc);
            }
        }
        if (nonRegistered.length > 0) {
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                let _geo = Utils.as(t.getReferent(), GeoReferent);
                if (_geo === null) 
                    continue;
                GeoAnalyzer._replaceTerrs(Utils.as(t, ReferentToken));
            }
        }
        ad.oRegime = false;
        ad.oTRegime = false;
        ad.tRegime = false;
        ad.cRegime = false;
        ad.sRegime = false;
        ad.aRegime = false;
        sw.stop();
        kit.msgs.push(("GeoMisc: " + sw.elapsedMilliseconds + "ms"));
        if (!this.onProgress(100, 100, kit)) 
            return;
    }
    
    static _replaceTerrs(mt) {
        if (mt === null) 
            return;
        let _geo = Utils.as(mt.referent, GeoReferent);
        if (_geo !== null && (_geo.tag instanceof GeoReferent)) 
            mt.referent = Utils.as(_geo.tag, GeoReferent);
        if (_geo !== null) {
            for (const s of _geo.slots) {
                if (s.value instanceof GeoReferent) {
                    let g = Utils.as(s.value, GeoReferent);
                    if (g.tag instanceof GeoReferent) 
                        _geo.uploadSlot(s, g.tag);
                }
            }
        }
        for (let t = mt.beginToken; t !== null; t = t.next) {
            if (t.endChar > mt.endToken.endChar) 
                break;
            else {
                if (t instanceof ReferentToken) 
                    GeoAnalyzer._replaceTerrs(Utils.as(t, ReferentToken));
                if (t === mt.endToken) 
                    break;
            }
        }
    }
    
    static geoComp(x, y) {
        let xcou = 0;
        for (let g = x.higher; g !== null; g = g.higher) {
            xcou++;
        }
        let ycou = 0;
        for (let g = y.higher; g !== null; g = g.higher) {
            ycou++;
        }
        if (xcou < ycou) 
            return -1;
        if (xcou > ycou) 
            return 1;
        return Utils.compareStrings(x.toStringEx(true, MorphLang.UNKNOWN, 0), y.toStringEx(true, MorphLang.UNKNOWN, 0), false);
    }
    
    tryParseCityListBack(t) {
        const CityItemToken = require("./internal/CityItemToken");
        if (t === null) 
            return null;
        while (t !== null && ((t.morph._class.isPreposition || t.isCharOf(",.") || t.morph._class.isConjunction))) {
            t = t.previous;
        }
        if (t === null) 
            return null;
        let res = null;
        for (let tt = t; tt !== null; tt = tt.previous) {
            if (!(tt instanceof TextToken)) 
                break;
            if (tt.previous !== null && tt.previous.isHiphen && (tt.previous.previous instanceof TextToken)) {
                if (!tt.isWhitespaceBefore && !tt.previous.isWhitespaceBefore) 
                    tt = tt.previous.previous;
            }
            let ci = CityItemToken.tryParseList(tt, 5, null);
            if (ci === null && tt.previous !== null) 
                ci = CityItemToken.tryParseList(tt.previous, 5, null);
            if (ci === null) 
                break;
            if (ci[ci.length - 1].endToken === t) 
                res = ci;
        }
        if (res !== null) 
            res.reverse();
        return res;
    }
    
    tryAttachTerritoryBeforeCity(t, ad) {
        const TerrItemToken = require("./internal/TerrItemToken");
        const TerrDefineHelper = require("./internal/TerrDefineHelper");
        if (t instanceof ReferentToken) 
            t = t.previous;
        for (; t !== null; t = t.previous) {
            if (!t.isCharOf(",.") && !t.morph._class.isPreposition) 
                break;
        }
        if (t === null) 
            return null;
        let i = 0;
        let res = null;
        for (let tt = t; tt !== null; tt = tt.previous) {
            i++;
            if (tt.isNewlineAfter && !tt.innerBool) 
                break;
            if (i > 10) 
                break;
            let tits0 = TerrItemToken.tryParseList(tt, 5, null);
            if (tits0 === null) 
                continue;
            if (tits0[tits0.length - 1].endToken !== t) 
                break;
            let tits1 = TerrItemToken.tryParseList(tt.previous, 5, null);
            if (tits1 !== null && tits1[tits1.length - 1].endToken === t && tits1.length === tits0.length) 
                tits0 = tits1;
            let rr = TerrDefineHelper.tryDefine(tits0, ad, false, null, null);
            if (rr !== null) 
                res = rr;
        }
        return res;
    }
    
    tryAttachTerritoryAfterCity(t, ad) {
        const TerrItemToken = require("./internal/TerrItemToken");
        const AddressItemToken = require("./../address/internal/AddressItemToken");
        const CityItemToken = require("./internal/CityItemToken");
        const TerrDefineHelper = require("./internal/TerrDefineHelper");
        if (t === null) 
            return null;
        let city = Utils.as(t.getReferent(), GeoReferent);
        if (city === null) 
            return null;
        if (!city.isCity) 
            return null;
        if (t.next === null || !t.next.isComma || t.next.whitespacesAfterCount > 1) 
            return null;
        let tt = t.next.next;
        if (tt === null || !tt.chars.isCapitalUpper || !(tt instanceof TextToken)) 
            return null;
        if (tt.chars.isLatinLetter) {
            let re1 = TerrDefineHelper.tryAttachStateUSATerritory(tt);
            if (re1 !== null) 
                return re1;
        }
        let t0 = tt;
        let t1 = tt;
        for (let i = 0; i < 2; i++) {
            let tit0 = TerrItemToken.tryParse(tt, null, null);
            if (tit0 === null || tit0.terminItem !== null) {
                if (i === 0) 
                    return null;
            }
            let cit0 = CityItemToken.tryParse(tt, null, false, null);
            if (cit0 === null || cit0.typ === CityItemTokenItemType.NOUN) {
                if (i === 0) 
                    return null;
            }
            let ait0 = AddressItemToken.tryParse(tt, false, null, null);
            if (ait0 !== null) 
                return null;
            if (tit0 === null) {
                if (!tt.chars.isCyrillicLetter) 
                    return null;
                let cla = tt.getMorphClassInDictionary();
                if (!cla.isNoun && !cla.isAdjective) 
                    return null;
                t1 = tt;
            }
            else 
                t1 = (tt = tit0.endToken);
            if (tt.next === null) 
                return null;
            if (tt.next.isComma) {
                tt = tt.next.next;
                break;
            }
            if (i > 0) 
                return null;
            tt = tt.next;
        }
        while (tt !== null) {
            if (tt.isComma) 
                tt = tt.next;
            else 
                break;
        }
        let ait = AddressItemToken.tryParse(tt, false, null, null);
        if (ait === null) 
            return null;
        if (ait.typ === AddressItemType.STREET && ait.refToken === null) {
            let reg = new GeoReferent();
            reg.addTyp("муниципальный район");
            reg.addName(MiscHelper.getTextValue(t0, t1, GetTextAttr.NO));
            return new ReferentToken(reg, t0, t1);
        }
        if (ait.typ === AddressItemType.REGION && (ait.referent instanceof GeoReferent)) {
            let reg = new GeoReferent();
            reg.addTyp("район");
            reg.addName(MiscHelper.getTextValue(t0, t1, GetTextAttr.NO));
            reg.higher = Utils.as(ait.referent, GeoReferent);
            return new ReferentToken(reg, t0, t1);
        }
        return null;
    }
    
    // Это привязка стран к прилагательным (например, "французский лидер")
    processReferent(begin, param) {
        const TerrItemToken = require("./internal/TerrItemToken");
        const CityItemToken = require("./internal/CityItemToken");
        const CityAttachHelper = require("./internal/CityAttachHelper");
        const TerrDefineHelper = require("./internal/TerrDefineHelper");
        if (!(begin instanceof TextToken)) 
            return null;
        let ad = GeoAnalyzer.getData(begin);
        if (ad === null) 
            return null;
        if (ad.level > 1) 
            return null;
        ad.level++;
        let toks = CityItemToken.M_CITY_ADJECTIVES.tryParseAll(begin, TerminParseAttr.FULLWORDSONLY);
        ad.level--;
        let res1 = null;
        if (toks !== null) {
            for (const tok of toks) {
                let cit = Utils.as(tok.termin.tag, IntOntologyItem);
                if (cit === null) 
                    continue;
                let city = new GeoReferent();
                city.addName(cit.canonicText);
                city.addTypCity(begin.kit.baseLanguage, true);
                res1 = ReferentToken._new1572(city, tok.beginToken, tok.endToken, tok.morph, begin.kit.getAnalyzerData(this));
                break;
            }
        }
        if (!begin.morph._class.isAdjective) {
            let te = Utils.as(begin, TextToken);
            if ((te.chars.isAllUpper && te.chars.isCyrillicLetter && te.lengthChar === 2) && te.getMorphClassInDictionary().isUndefined) {
                let abbr = te.term;
                let geo0 = null;
                let cou = 0;
                for (const t of ad.localOntology.items) {
                    let _geo = Utils.as(t.referent, GeoReferent);
                    if (_geo === null) 
                        continue;
                    if (!_geo.isRegion && !_geo.isState) 
                        continue;
                    if (_geo.checkAbbr(abbr)) {
                        cou++;
                        geo0 = _geo;
                    }
                }
                if (cou === 1 && res1 === null) 
                    res1 = ReferentToken._new1573(geo0, begin, begin, ad);
            }
            ad.level++;
            let tt0 = TerrItemToken.tryParse(begin, null, null);
            ad.level--;
            if (tt0 !== null && tt0.terminItem !== null && tt0.terminItem.canonicText === "РАЙОН") {
                ad.level++;
                let tt1 = TerrItemToken.tryParse(tt0.endToken.next, null, null);
                ad.level--;
                if ((tt1 !== null && tt1.chars.isCapitalUpper && tt1.terminItem === null) && tt1.ontoItem === null) {
                    let li = new Array();
                    li.push(tt0);
                    li.push(tt1);
                    let res = TerrDefineHelper.tryDefine(li, ad, true, null, null);
                    if (res === null) 
                        return null;
                    res.morph = begin.morph;
                    res.data = ad;
                    if (res1 === null || res.lengthChar > res1.lengthChar) 
                        res1 = res;
                }
            }
            ad.level++;
            let ctoks = CityItemToken.tryParseList(begin, 3, null);
            if (ctoks === null && begin.morph._class.isPreposition) 
                ctoks = CityItemToken.tryParseList(begin.next, 3, null);
            ad.level--;
            if (ctoks !== null) {
                if (((ctoks.length === 2 && ctoks[0].typ === CityItemTokenItemType.NOUN && ctoks[1].typ === CityItemTokenItemType.PROPERNAME)) || ((ctoks.length === 1 && ctoks[0].typ === CityItemTokenItemType.CITY))) {
                    if (ctoks.length === 1 && ctoks[0].beginToken.getMorphClassInDictionary().isProperSurname) {
                        let kk = begin.kit.processReferent("PERSON", ctoks[0].beginToken, null);
                        if (kk !== null) 
                            return null;
                    }
                    let res = CityAttachHelper.tryDefine(ctoks, ad, true);
                    if (res !== null) {
                        res.data = ad;
                        if (res1 === null || res.lengthChar > res1.lengthChar) 
                            res1 = res;
                    }
                }
            }
            if ((ctoks !== null && ctoks.length === 1 && ctoks[0].typ === CityItemTokenItemType.NOUN) && ctoks[0].value === "ГОРОД") {
                let cou = 0;
                for (let t = begin.previous; t !== null; t = t.previous) {
                    if ((++cou) > 500) 
                        break;
                    if (!(t instanceof ReferentToken)) 
                        continue;
                    let geos = t.getReferents();
                    if (geos === null) 
                        continue;
                    for (const g of geos) {
                        let gg = Utils.as(g, GeoReferent);
                        if (gg !== null) {
                            let res = null;
                            if (gg.isCity) 
                                res = ReferentToken._new1572(gg, begin, ctoks[0].endToken, ctoks[0].morph, ad);
                            if (gg.higher !== null && gg.higher.isCity) 
                                res = ReferentToken._new1572(gg.higher, begin, ctoks[0].endToken, ctoks[0].morph, ad);
                            if (res !== null && ((res1 === null || res.lengthChar > res1.lengthChar))) 
                                res1 = res;
                        }
                    }
                }
            }
            if (tt0 !== null && tt0.ontoItem !== null) {
            }
            else 
                return res1;
        }
        ad.level++;
        let tt = TerrItemToken.tryParse(begin, null, null);
        ad.level--;
        if (tt === null || tt.ontoItem === null) {
            let tok = TerrItemToken.m_TerrOntology.tryAttach(begin, null, false);
            if ((tok !== null && tok[0].item !== null && (tok[0].item.referent instanceof GeoReferent)) && tok[0].item.referent.isState) 
                tt = TerrItemToken._new1533(tok[0].beginToken, tok[0].endToken, tok[0].item);
        }
        if (tt === null) 
            return res1;
        if (tt.ontoItem !== null) {
            ad.level++;
            let li = TerrItemToken.tryParseList(begin, 3, null);
            let res = TerrDefineHelper.tryDefine(li, ad, true, null, null);
            ad.level--;
            if (res === null) 
                tt.ontoItem = null;
            else {
                if (res.beginToken === res.endToken) {
                    let mc = res.beginToken.getMorphClassInDictionary();
                    if (mc.isAdjective) {
                        let _geo = Utils.as(tt.ontoItem.referent, GeoReferent);
                        if (_geo.isCity || _geo.isState) {
                        }
                        else if (_geo.findSlot(GeoReferent.ATTR_TYPE, "федеральный округ", true) !== null) 
                            return null;
                    }
                }
                res.data = ad;
                if (res1 === null || res.lengthChar > res1.lengthChar) 
                    res1 = res;
            }
        }
        if (!tt.isAdjective) 
            return res1;
        if (tt.ontoItem === null) {
            let t1 = tt.endToken.next;
            if (t1 === null) 
                return res1;
            ad.level++;
            let ttyp = TerrItemToken.tryParse(t1, null, null);
            ad.level--;
            if (ttyp === null || ttyp.terminItem === null) {
                ad.level++;
                let cits = CityItemToken.tryParseList(begin, 2, null);
                ad.level--;
                if (cits !== null && cits[0].typ === CityItemTokenItemType.CITY) {
                    ad.level++;
                    let res2 = CityAttachHelper.tryDefine(cits, ad, true);
                    ad.level--;
                    if (res2 !== null) {
                        if (res1 === null || res2.lengthChar > res1.lengthChar) 
                            res1 = res2;
                    }
                }
                return res1;
            }
            if (t1.getMorphClassInDictionary().isAdjective) 
                return res1;
            let li = new Array();
            li.push(tt);
            li.push(ttyp);
            ad.level++;
            let res = TerrDefineHelper.tryDefine(li, ad, true, null, null);
            ad.level--;
            if (res === null) 
                return res1;
            res.morph = ttyp.morph;
            res.data = ad;
            if (res1 === null || res.lengthChar > res1.lengthChar) 
                res1 = res;
        }
        return res1;
    }
    
    processCitizen(begin) {
        const TerrItemToken = require("./internal/TerrItemToken");
        if (!(begin instanceof TextToken)) 
            return null;
        let tok = TerrItemToken.M_MANS_BY_STATE.tryParse(begin, TerminParseAttr.FULLWORDSONLY);
        if (tok !== null) 
            tok.morph.gender = tok.termin.gender;
        if (tok === null) 
            return null;
        let geo0 = Utils.as(tok.termin.tag, GeoReferent);
        if (geo0 === null) 
            return null;
        let _geo = new GeoReferent();
        _geo.mergeSlots2(geo0, begin.kit.baseLanguage);
        let res = new ReferentToken(_geo, tok.beginToken, tok.endToken);
        res.morph = tok.morph;
        let ad = Utils.as(begin.kit.getAnalyzerData(this), AnalyzerDataWithOntology);
        res.data = ad;
        return res;
    }
    
    processOntologyItem(begin) {
        const TerrItemToken = require("./internal/TerrItemToken");
        const CityItemToken = require("./internal/CityItemToken");
        const CityAttachHelper = require("./internal/CityAttachHelper");
        let li = CityItemToken.tryParseList(begin, 4, null);
        if (li !== null && li.length > 1 && li[0].typ === CityItemTokenItemType.NOUN) {
            let rt = CityAttachHelper.tryDefine(li, null, true);
            if (rt === null) 
                return null;
            let city = Utils.as(rt.referent, GeoReferent);
            for (let t = rt.endToken.next; t !== null; t = t.next) {
                if (!t.isChar(';')) 
                    continue;
                t = t.next;
                if (t === null) 
                    break;
                li = CityItemToken.tryParseList(t, 4, null);
                let rt1 = CityAttachHelper.tryDefine(li, null, false);
                if (rt1 !== null) {
                    t = rt.endToken = rt1.endToken;
                    city.mergeSlots2(rt1.referent, begin.kit.baseLanguage);
                }
                else {
                    let tt = null;
                    for (let ttt = t; ttt !== null; ttt = ttt.next) {
                        if (ttt.isChar(';')) 
                            break;
                        else 
                            tt = ttt;
                    }
                    if (tt !== null) {
                        let str = MiscHelper.getTextValue(t, tt, GetTextAttr.NO);
                        if (str !== null) 
                            city.addName(str);
                        t = rt.endToken = tt;
                    }
                }
            }
            return rt;
        }
        let typ = null;
        let terr = null;
        let te = null;
        for (let t = begin; t !== null; t = t.next) {
            let t0 = t;
            let t1 = null;
            let tn0 = null;
            let tn1 = null;
            for (let tt = t0; tt !== null; tt = tt.next) {
                if (tt.isCharOf(";")) 
                    break;
                let tit = TerrItemToken.tryParse(tt, null, null);
                if (tit !== null && tit.terminItem !== null) {
                    if (!tit.isAdjective) {
                        if (typ === null) 
                            typ = tit.terminItem.canonicText;
                        tt = tit.endToken;
                        t1 = tt;
                        continue;
                    }
                }
                else if (tit !== null && tit.ontoItem !== null) {
                }
                if (tn0 === null) 
                    tn0 = tt;
                if (tit !== null) 
                    tt = tit.endToken;
                t1 = (tn1 = tt);
            }
            if (t1 === null) 
                continue;
            if (terr === null) 
                terr = new GeoReferent();
            if (tn0 !== null) 
                terr.addName(MiscHelper.getTextValue(tn0, tn1, GetTextAttr.NO));
            t = (te = t1);
        }
        if (terr === null || te === null) 
            return null;
        if (typ !== null) 
            terr.addTyp(typ);
        if (!terr.isCity && !terr.isRegion && !terr.isState) 
            terr.addTypReg(begin.kit.baseLanguage);
        return new ReferentToken(terr, begin, te);
    }
    
    /**
     * Получить список всех стран из внутреннего словаря
     * @return 
     */
    static getAllCountries() {
        const TerrItemToken = require("./internal/TerrItemToken");
        return TerrItemToken.m_AllStates;
    }
    
    static initialize() {
        const MiscLocationHelper = require("./internal/MiscLocationHelper");
        const TerrItemToken = require("./internal/TerrItemToken");
        const CityItemToken = require("./internal/CityItemToken");
        const AddressAnalyzer = require("./../address/AddressAnalyzer");
        const NameToken = require("./internal/NameToken");
        const OrgTypToken = require("./internal/OrgTypToken");
        const OrgItemToken = require("./internal/OrgItemToken");
        if (GeoAnalyzer.m_Initialized) 
            return;
        GeoAnalyzer.m_Initialized = true;
        MetaGeo.initialize();
        MetaAddress.initialize();
        MetaStreet.initialize();
        try {
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
            MiscLocationHelper.initialize();
            OrgTypToken.initialize();
            NameToken.initialize();
            OrgItemToken.initialize();
            TerrItemToken.initialize();
            CityItemToken.initialize();
            AddressAnalyzer.initialize();
        } catch (ex) {
            throw new Error(ex.message);
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new GeoAnalyzer());
    }
    
    static static_constructor() {
        GeoAnalyzer.ANALYZER_NAME = "GEO";
        GeoAnalyzer.m_Initialized = false;
    }
}


GeoAnalyzer.static_constructor();

module.exports = GeoAnalyzer