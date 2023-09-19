/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const NumberSpellingType = require("./../NumberSpellingType");
const MorphClass = require("./../../morph/MorphClass");
const MorphCase = require("./../../morph/MorphCase");
const CharsInfo = require("./../../morph/CharsInfo");
const Token = require("./../Token");
const MorphLang = require("./../../morph/MorphLang");
const OrgItemTypeTyp = require("./internal/OrgItemTypeTyp");
const MorphNumber = require("./../../morph/MorphNumber");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MetaToken = require("./../MetaToken");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphGender = require("./../../morph/MorphGender");
const OrgItemEponymToken = require("./internal/OrgItemEponymToken");
const AnalyzerData = require("./../core/AnalyzerData");
const Analyzer = require("./../Analyzer");
const OrgAnalyzerData = require("./internal/OrgAnalyzerData");
const TextAnnotation = require("./../TextAnnotation");
const MorphologyService = require("./../../morph/MorphologyService");
const NumberToken = require("./../NumberToken");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MorphCollection = require("./../MorphCollection");
const MetaOrganization = require("./internal/MetaOrganization");
const AddressReferent = require("./../address/AddressReferent");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const OrgProfile = require("./OrgProfile");
const ReferentToken = require("./../ReferentToken");
const BracketParseAttr = require("./../core/BracketParseAttr");
const TextToken = require("./../TextToken");
const MiscHelper = require("./../core/MiscHelper");
const BracketHelper = require("./../core/BracketHelper");
const TerminParseAttr = require("./../core/TerminParseAttr");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const NumberHelper = require("./../core/NumberHelper");
const GeoReferent = require("./../geo/GeoReferent");
const OrgOwnershipHelper = require("./internal/OrgOwnershipHelper");
const OrgItemNumberToken = require("./internal/OrgItemNumberToken");
const OrganizationAnalyzerAttachType = require("./OrganizationAnalyzerAttachType");
const ProcessorService = require("./../ProcessorService");
const GetTextAttr = require("./../core/GetTextAttr");
const Termin = require("./../core/Termin");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const OrganizationKind = require("./OrganizationKind");
const Referent = require("./../Referent");
const MiscLocationHelper = require("./../geo/internal/MiscLocationHelper");
const TerminCollection = require("./../core/TerminCollection");
const OrganizationReferent = require("./OrganizationReferent");

/**
 * Анализатор организаций
 */
class OrganizationAnalyzer extends Analyzer {
    
    static tryAttachPoliticParty(t, onlyAbbrs = false) {
        if (!(t instanceof TextToken)) 
            return null;
        let nameTok = null;
        let root = null;
        let prevToks = null;
        let prevWords = 0;
        let _geo = null;
        let t0 = t;
        let t1 = t;
        let coef = 0;
        let wordsAfter = 0;
        let isFraction = false;
        let isPolitic = false;
        for (; t !== null; t = t.next) {
            if (t !== t0 && t.isNewlineBefore) 
                break;
            if (onlyAbbrs) 
                break;
            if (t.isHiphen) {
                if (prevToks === null) 
                    return null;
                continue;
            }
            let tokN = OrganizationAnalyzer.m_PoliticNames.tryParse(t, TerminParseAttr.NO);
            if (tokN !== null) {
                if (!t.chars.isAllLower) 
                    break;
                t1 = tokN.endToken;
            }
            let tok = OrganizationAnalyzer.m_PoliticPrefs.tryParse(t, TerminParseAttr.NO);
            if (tok === null) {
                if (t.morph._class.isAdjective) {
                    let rt = t.kit.processReferent("GEO", t, null);
                    if (rt !== null) {
                        _geo = rt;
                        t1 = (t = rt.endToken);
                        coef += 0.5;
                        continue;
                    }
                }
                if (t.endChar < t1.endChar) 
                    continue;
                break;
            }
            if (tok.termin.tag !== null && tok.termin.tag2 !== null) {
                if (t.endChar < t1.endChar) 
                    continue;
                break;
            }
            if (tok.termin.tag === null && tok.termin.tag2 === null) 
                isPolitic = true;
            if (prevToks === null) 
                prevToks = new Array();
            prevToks.push(tok);
            if (tok.termin.tag === null) {
                coef += (1);
                prevWords++;
            }
            else if (tok.morph._class.isAdjective) 
                coef += 0.5;
            t = tok.endToken;
            if (t.endChar > t1.endChar) 
                t1 = t;
        }
        if (t === null) 
            return null;
        if (t.isValue("ПАРТИЯ", null) || t.isValue("ФРОНТ", null) || t.isValue("ГРУППИРОВКА", null)) {
            if (!t.isValue("ПАРТИЯ", null)) 
                isPolitic = true;
            root = t;
            coef += 0.5;
            if (t.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(t)) 
                coef += 0.5;
            t1 = t;
            t = t.next;
        }
        else if (t.isValue("ФРАКЦИЯ", null)) {
            root = (t1 = t);
            isFraction = true;
            if (t.next !== null && (t.next.getReferent() instanceof OrganizationReferent)) 
                coef += (2);
            else 
                return null;
        }
        let br = null;
        if ((((nameTok = OrganizationAnalyzer.m_PoliticNames.tryParse(t, TerminParseAttr.NO)))) !== null && !t.chars.isAllLower) {
            isPolitic = true;
            if (nameTok.beginToken === nameTok.endToken && !t.getMorphClassInDictionary().isUndefined) 
                coef += 0.1;
            else 
                coef += 0.5;
            if ((nameTok.endToken instanceof TextToken) && nameTok.endToken.term.includes("ПАРТИ")) 
                coef += 0.5;
            if (nameTok.lengthChar > 10) 
                coef += 0.5;
            else if (t.chars.isAllUpper) 
                coef += 0.5;
            t1 = nameTok.endToken;
            t = t1.next;
        }
        else if ((((br = BracketHelper.tryParse(t, BracketParseAttr.NO, 10)))) !== null) {
            if (!BracketHelper.canBeStartOfSequence(t, true, false)) 
                return null;
            if ((((nameTok = OrganizationAnalyzer.m_PoliticNames.tryParse(t.next, TerminParseAttr.NO)))) !== null) 
                coef += 1.5;
            else if (onlyAbbrs) 
                return null;
            else if (t.next !== null && t.next.isValue("О", null)) 
                return null;
            else 
                for (let tt = t.next; tt !== null && tt.endChar <= br.endChar; tt = tt.next) {
                    let tok2 = OrganizationAnalyzer.m_PoliticPrefs.tryParse(tt, TerminParseAttr.NO);
                    if (tok2 !== null && tok2.termin.tag === null) {
                        if (tok2.termin.tag2 === null) 
                            isPolitic = true;
                        coef += 0.5;
                        wordsAfter++;
                    }
                    else if (OrganizationAnalyzer.m_PoliticSuffs.tryParse(tt, TerminParseAttr.NO) !== null) {
                        coef += 0.5;
                        wordsAfter++;
                    }
                    else if (tt.getReferent() instanceof GeoReferent) 
                        coef += 0.5;
                    else if (tt instanceof ReferentToken) {
                        coef = 0;
                        break;
                    }
                    else {
                        let mc = tt.getMorphClassInDictionary();
                        if ((mc.equals(MorphClass.VERB) || mc.equals(MorphClass.ADVERB) || mc.isPronoun) || mc.isPersonalPronoun) {
                            coef = 0;
                            break;
                        }
                        if (mc.isNoun || mc.isUndefined) 
                            coef -= 0.5;
                    }
                }
            t1 = br.endToken;
            t = t1.next;
        }
        else if (onlyAbbrs) 
            return null;
        else if (root !== null) {
            for (let tt = t; tt !== null; tt = tt.next) {
                if (tt.chars.isAllLower && tt === t && tt.getMorphClassInDictionary().isPreposition) 
                    break;
                if (tt.isCommaAnd && tt === t) 
                    break;
                if (tt.getReferent() instanceof GeoReferent) 
                    break;
                if (tt.whitespacesBeforeCount > 2) 
                    break;
                if (tt.morph._class.isPreposition) {
                    if (tt !== root.next) 
                        break;
                    continue;
                }
                if (tt.isAnd) {
                    let npt2 = NounPhraseHelper.tryParse(tt.next, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null);
                    if (npt2 !== null && OrganizationAnalyzer.m_PoliticSuffs.tryParse(npt2.endToken, TerminParseAttr.NO) !== null && npt2.endToken.chars.equals(tt.previous.chars)) 
                        continue;
                    break;
                }
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null);
                if (npt === null) 
                    break;
                if (npt.noun.isValue("ПАРТИЯ", null) || npt.noun.isValue("ФРОНТ", null)) 
                    break;
                let co = 0;
                for (let ttt = tt; ttt !== null && ttt.endChar <= npt.endChar; ttt = ttt.next) {
                    let tok2 = OrganizationAnalyzer.m_PoliticPrefs.tryParse(ttt, TerminParseAttr.NO);
                    if (tok2 !== null && tok2.termin.tag === null) {
                        if (tok2.termin.tag2 === null) 
                            isPolitic = true;
                        co += 0.5;
                        wordsAfter++;
                    }
                    else if (OrganizationAnalyzer.m_PoliticSuffs.tryParse(ttt, TerminParseAttr.NO) !== null) {
                        co += 0.5;
                        wordsAfter++;
                    }
                    else if (ttt.getReferent() instanceof GeoReferent) 
                        co += 0.5;
                }
                if (co === 0) {
                    if (!npt.morph._case.isGenitive) 
                        break;
                    let lastSuf = OrganizationAnalyzer.m_PoliticSuffs.tryParse(tt.previous, TerminParseAttr.NO);
                    if (((wordsAfter > 0 && npt.endToken.chars.equals(tt.previous.chars))) || ((lastSuf !== null && lastSuf.termin.tag !== null)) || ((tt.previous === root && npt.endToken.chars.isAllLower && npt.morph.number === MorphNumber.PLURAL) && root.chars.isCapitalUpper)) {
                        let pp = tt.kit.processReferent("PERSON", tt, null);
                        if (pp !== null) 
                            break;
                        wordsAfter++;
                    }
                    else 
                        break;
                }
                t1 = (tt = npt.endToken);
                t = t1.next;
                coef += co;
            }
        }
        if (t !== null && (t.getReferent() instanceof GeoReferent) && (t.whitespacesBeforeCount < 3)) {
            t1 = t;
            coef += 0.5;
        }
        for (let tt = t0.previous; tt !== null; tt = tt.previous) {
            if (!(tt instanceof TextToken)) {
                let org1 = Utils.as(tt.getReferent(), OrganizationReferent);
                if (org1 !== null && org1.containsProfile(OrgProfile.POLICY)) 
                    coef += 0.5;
                continue;
            }
            if (!tt.chars.isLetter) 
                continue;
            if (tt.morph._class.isPreposition || tt.morph._class.isConjunction) 
                continue;
            if (OrganizationAnalyzer.m_PoliticPrefs.tryParse(tt, TerminParseAttr.NO) !== null) {
                coef += 0.5;
                if (tt.isValue("ФРАКЦИЯ", null)) 
                    coef += 0.5;
            }
            else 
                break;
        }
        if (coef < 1) 
            return null;{
                if (root === null) {
                    if (nameTok === null && br === null) 
                        return null;
                }
                else if ((nameTok === null && wordsAfter === 0 && br === null) && !isFraction) {
                    if ((coef < 2) || prevWords === 0) 
                        return null;
                }
            }
        let _org = new OrganizationReferent();
        if (br !== null && nameTok !== null && (nameTok.endChar < br.endToken.previous.endChar)) 
            nameTok = null;
        if (nameTok !== null) 
            isPolitic = true;
        if (isFraction) {
            _org.addProfile(OrgProfile.POLICY);
            _org.addProfile(OrgProfile.UNIT);
        }
        else if (isPolitic) {
            _org.addProfile(OrgProfile.POLICY);
            _org.addProfile(OrgProfile.UNION);
        }
        else 
            _org.addProfile(OrgProfile.UNION);
        if (nameTok !== null) {
            isPolitic = true;
            _org.addName(nameTok.termin.canonicText, true, null);
            if (nameTok.termin.additionalVars !== null) {
                for (const v of nameTok.termin.additionalVars) {
                    _org.addName(v.canonicText, true, null);
                }
            }
            if (nameTok.termin.acronym !== null) {
                let geo1 = Utils.as(nameTok.termin.tag, GeoReferent);
                if (geo1 === null) 
                    _org.addName(nameTok.termin.acronym, true, null);
                else if (_geo !== null) {
                    if (geo1.canBeEquals(_geo.referent, ReferentsEqualType.WITHINONETEXT)) 
                        _org.addName(nameTok.termin.acronym, true, null);
                }
                else if (t1.getReferent() instanceof GeoReferent) {
                    if (geo1.canBeEquals(t1.getReferent(), ReferentsEqualType.WITHINONETEXT)) 
                        _org.addName(nameTok.termin.acronym, true, null);
                }
                else if (nameTok.beginToken === nameTok.endToken && nameTok.beginToken.isValue(nameTok.termin.acronym, null)) {
                    _org.addName(nameTok.termin.acronym, true, null);
                    let rtg = new ReferentToken(geo1.clone(), nameTok.beginToken, nameTok.endToken);
                    rtg.setDefaultLocalOnto(t0.kit.processor);
                    _org.addGeoObject(rtg);
                }
            }
        }
        else if (br !== null) {
            let nam = MiscHelper.getTextValue(br.beginToken, br.endToken, GetTextAttr.NO);
            _org.addName(nam, true, null);
            if (root === null) {
                let nam2 = MiscHelper.getTextValue(br.beginToken, br.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                if (nam2 !== nam) 
                    _org.addName(nam, true, null);
            }
        }
        if (root !== null) {
            let typ1 = root;
            if (_geo !== null) 
                typ1 = _geo.beginToken;
            if (prevToks !== null) {
                for (const p of prevToks) {
                    if (p.termin.tag === null) {
                        if (p.beginChar < typ1.beginChar) 
                            typ1 = p.beginToken;
                        break;
                    }
                }
            }
            let typ = MiscHelper.getTextValue(typ1, root, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
            if (typ !== null) {
                if (br === null) {
                    let nam = null;
                    let t2 = t1;
                    if (t2.getReferent() instanceof GeoReferent) 
                        t2 = t2.previous;
                    if (t2.endChar > root.endChar) {
                        nam = (typ + " " + MiscHelper.getTextValue(root.next, t2, GetTextAttr.NO));
                        _org.addName(nam, true, null);
                    }
                }
                if (_org.names.length === 0 && typ1 !== root) 
                    _org.addName(typ, true, null);
                else 
                    _org.addTypeStr(typ.toLowerCase());
            }
            if (isFraction && (t1.next instanceof ReferentToken)) {
                _org.addTypeStr("фракция");
                t1 = t1.next;
                _org.higher = Utils.as(t1.getReferent(), OrganizationReferent);
                if (t1.next !== null && t1.next.isValue("В", null) && (t1.next.next instanceof ReferentToken)) {
                    let oo = Utils.as(t1.next.next.getReferent(), OrganizationReferent);
                    if (oo !== null && oo.kind === OrganizationKind.GOVENMENT) {
                        t1 = t1.next.next;
                        _org.addSlot(OrganizationReferent.ATTR_MISC, oo, false, 0);
                    }
                    else if (t1.next.next.getReferent() instanceof GeoReferent) {
                        t1 = t1.next.next;
                        _org.addSlot(OrganizationReferent.ATTR_MISC, t1.getReferent(), false, 0);
                    }
                }
            }
        }
        if (_geo !== null) 
            _org.addGeoObject(_geo);
        else if (t1.getReferent() instanceof GeoReferent) 
            _org.addGeoObject(t1.getReferent());
        return new ReferentToken(_org, t0, t1);
    }
    
    static _initPolitic() {
        OrganizationAnalyzer.m_PoliticPrefs = new TerminCollection();
        for (const s of ["либеральный", "либерал", "лейбористский", "демократический", "коммунистрический", "большевистский", "социальный", "социал", "национал", "националистическая", "свободный", "радикальный", "леворадикальный", "радикал", "революционная", "левый", "правый", "социалистический", "рабочий", "трудовой", "республиканский", "народный", "аграрный", "монархический", "анархический", "прогрессивый", "прогрессистский", "консервативный", "гражданский", "фашистский", "марксистский", "ленинский", "маоистский", "имперский", "славянский", "анархический", "баскский", "конституционный", "пиратский", "патриотический", "русский"]) {
            OrganizationAnalyzer.m_PoliticPrefs.add(new Termin(s.toUpperCase()));
        }
        for (const s of ["объединенный", "всероссийский", "общероссийский", "христианский", "независимый", "альтернативный"]) {
            OrganizationAnalyzer.m_PoliticPrefs.add(Termin._new2419(s.toUpperCase(), s));
        }
        for (const s of ["политический", "правящий", "оппозиционный", "запрешенный", "террористический", "запрещенный", "экстремистский"]) {
            OrganizationAnalyzer.m_PoliticPrefs.add(Termin._new170(s.toUpperCase(), s));
        }
        for (const s of ["активист", "член", "руководство", "лидер", "глава", "демонстрация", "фракция", "съезд", "пленум", "террорист", "парламент", "депутат", "парламентарий", "оппозиция", "дума", "рада"]) {
            OrganizationAnalyzer.m_PoliticPrefs.add(Termin._new349(s.toUpperCase(), s, s));
        }
        OrganizationAnalyzer.m_PoliticSuffs = new TerminCollection();
        for (const s of ["коммунист", "социалист", "либерал", "республиканец", "националист", "радикал", "лейборист", "анархист", "патриот", "консерватор", "левый", "правый", "новый", "зеленые", "демократ", "фашист", "защитник", "труд", "равенство", "прогресс", "жизнь", "мир", "родина", "отечество", "отчизна", "республика", "революция", "революционер", "народовластие", "фронт", "сила", "платформа", "воля", "справедливость", "преображение", "преобразование", "солидарность", "управление", "демократия", "народ", "гражданин", "предприниматель", "предпринимательство", "бизнес", "пенсионер", "христианин"]) {
            OrganizationAnalyzer.m_PoliticSuffs.add(new Termin(s.toUpperCase()));
        }
        for (const s of ["реформа", "свобода", "единство", "развитие", "освобождение", "любитель", "поддержка", "возрождение", "независимость"]) {
            OrganizationAnalyzer.m_PoliticSuffs.add(Termin._new170(s.toUpperCase(), s));
        }
        OrganizationAnalyzer.m_PoliticNames = new TerminCollection();
        for (const s of ["Республиканская партия", "Демократическая партия;Демпартия", "Христианско демократический союз;ХДС", "Свободная демократическая партия;СвДП", "ЯБЛОКО", "ПАРНАС", "ПАМЯТЬ", "Движение против нелегальной иммиграции;ДПНИ", "НАЦИОНАЛ БОЛЬШЕВИСТСКАЯ ПАРТИЯ;НБП", "НАЦИОНАЛЬНЫЙ ФРОНТ;НАЦФРОНТ", "Национальный патриотический фронт", "Батькивщина;Батькiвщина", "НАРОДНАЯ САМООБОРОНА", "Гражданская платформа", "Народная воля", "Славянский союз", "ПРАВЫЙ СЕКТОР", "ПЕГИДА;PEGIDA", "Венгерский гражданский союз;ФИДЕС", "БЛОК ЮЛИИ ТИМОШЕНКО;БЮТ", "Аль Каида;Аль Каеда;Аль Кайда;Al Qaeda;Al Qaida", "Талибан;движение талибан", "Бригады мученников Аль Аксы", "Хезболла;Хезбалла;Хизбалла", "Народный фронт освобождения палестины;НФОП", "Организация освобождения палестины;ООП", "Союз исламского джихада;Исламский джихад", "Аль-Джихад;Египетский исламский джихад", "Братья-мусульмане;Аль Ихван альМуслимун", "ХАМАС", "Движение за освобождение Палестины;ФАТХ", "Фронт Аль Нусра;Аль Нусра", "Джабхат ан Нусра"]) {
            let pp = Utils.splitString(s.toUpperCase(), ';', false);
            let t = Termin._new170(pp[0], OrgProfile.POLICY);
            for (let i = 0; i < pp.length; i++) {
                if ((pp[i].length < 5) && t.acronym === null) {
                    t.acronym = pp[i];
                    if (t.acronym.endsWith("Р") || t.acronym.endsWith("РФ")) 
                        t.tag = MiscLocationHelper.getGeoReferentByName("RU");
                    else if (t.acronym.endsWith("У")) 
                        t.tag = MiscLocationHelper.getGeoReferentByName("UA");
                    else if (t.acronym.endsWith("СС")) 
                        t.tag = MiscLocationHelper.getGeoReferentByName("СССР");
                }
                else 
                    t.addVariant(pp[i], false);
            }
            OrganizationAnalyzer.m_PoliticNames.add(t);
        }
    }
    
    static tryAttachDepBeforeOrg(typ, rtOrg) {
        if (typ === null) 
            return null;
        let _org = (rtOrg === null ? null : Utils.as(rtOrg.referent, OrganizationReferent));
        let t = typ.endToken;
        if (_org === null) {
            t = t.next;
            if (t !== null && ((t.isValue("ПРИ", null) || t.isValue("AT", null) || t.isValue("OF", null)))) 
                t = t.next;
            if (t === null) 
                return null;
            _org = Utils.as(t.getReferent(), OrganizationReferent);
        }
        else 
            t = rtOrg.endToken;
        if (_org === null) 
            return null;
        let t1 = t;
        if (t1.next instanceof ReferentToken) {
            let geo0 = Utils.as(t1.next.getReferent(), GeoReferent);
            if (geo0 !== null && geo0.alpha2 === "RU") 
                t1 = t1.next;
        }
        let dep = new OrganizationReferent();
        dep.addType(typ, false);
        if (typ.name !== null) {
            let nam = typ.name;
            if (Utils.isDigit(nam[0])) {
                let i = nam.indexOf(' ');
                if (i > 0) {
                    dep.number = nam.substring(0, 0 + i);
                    nam = nam.substring(i + 1).trim();
                }
            }
            dep.addName(nam, true, null);
        }
        let ttt = (typ.root !== null ? typ.root.canonicText : typ.typ.toUpperCase());
        if ((((ttt === "ОТДЕЛЕНИЕ" || ttt === "ИНСПЕКЦИЯ" || ttt === "ВІДДІЛЕННЯ") || ttt === "ІНСПЕКЦІЯ")) && !t1.isNewlineAfter) {
            let num = OrgItemNumberToken.tryAttach(t1.next, false, typ);
            if (num !== null) {
                dep.number = num.number;
                t1 = num.endToken;
            }
        }
        if (dep.types.includes("главное управление") || dep.types.includes("головне управління") || dep.typeName.includes("пограничное управление")) {
            if (typ.beginToken === typ.endToken) {
                if (_org.kind !== OrganizationKind.GOVENMENT && _org.kind !== OrganizationKind.BANK) 
                    return null;
            }
        }
        if (!OrgOwnershipHelper.canBeHigher(_org, dep, false) && ((typ.root === null || !typ.root.canBeNormalDep))) {
            if (dep.types.length > 0 && _org.types.includes(dep.types[0]) && dep.canBeEquals(_org, ReferentsEqualType.FORMERGING)) 
                dep.mergeSlots(_org, false);
            else if (typ.typ === "управление" || typ.typ === "управління") 
                dep.higher = _org;
            else 
                return null;
        }
        else 
            dep.higher = _org;
        let res = new ReferentToken(dep, typ.beginToken, t1);
        if ((res.beginToken.previous instanceof ReferentToken) && _org !== null && _org.canBeEquals(res.beginToken.previous.getReferent(), ReferentsEqualType.WITHINONETEXT)) 
            res.beginToken = res.beginToken.previous;
        OrganizationAnalyzer.correctDepAttrs(res, typ, false);
        if (typ.root !== null && !typ.root.canBeNormalDep && dep.number === null) {
            if (typ.name !== null && typ.name.includes(" ")) {
            }
            else if (dep.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) {
            }
            else if (typ.root.coeff > 0 && typ.morph.number !== MorphNumber.PLURAL) {
            }
            else if (typ.typ === "управління" && typ.chars.isCapitalUpper) {
            }
            else 
                return null;
        }
        return res;
    }
    
    static tryAttachDepAfterOrg(typ) {
        if (typ === null) 
            return null;
        let t = typ.beginToken.previous;
        if (t !== null && t.isCharOf(":(")) 
            t = t.previous;
        if (t === null) 
            return null;
        let _org = Utils.as(t.getReferent(), OrganizationReferent);
        if (_org === null) 
            return null;
        let t1 = typ.endToken;
        let dep = new OrganizationReferent();
        dep.addType(typ, false);
        if (typ.name !== null) 
            dep.addName(typ.name, true, null);
        if (OrgOwnershipHelper.canBeHigher(_org, dep, false)) 
            dep.higher = _org;
        else if (OrgOwnershipHelper.canBeHigher(dep, _org, false) && _org.higher === null) {
            _org.higher = dep;
            t = t.next;
        }
        else 
            t = t.next;
        let res = new ReferentToken(dep, t, t1);
        OrganizationAnalyzer.correctDepAttrs(res, typ, false);
        if (dep.findSlot(OrganizationReferent.ATTR_GEO, null, true) === null) 
            return null;
        return res;
    }
    
    static tryAttachDep(typ, attachTyp, specWordBefore) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        if (typ === null) 
            return null;
        let afterOrg = null;
        let afterOrgTemp = false;
        if ((typ.isNewlineAfter && typ.name === null && typ.typ !== "курс") && ((typ.root === null || !typ.root.canBeNormalDep))) {
            let tt2 = typ.endToken.next;
            if (!specWordBefore || tt2 === null) 
                return null;
            if (BracketHelper.canBeStartOfSequence(tt2, false, false)) {
            }
            else 
                return null;
        }
        if (typ.endToken.next !== null && (typ.endToken.whitespacesAfterCount < 2)) {
            if (typ.endToken.next.getReferent() instanceof OrganizationReferent) 
                afterOrg = Utils.as(typ.endToken.next.getReferent(), OrganizationReferent);
            else {
                let na0 = OrgItemNameToken.tryAttach(typ.endToken.next, null, false, true);
                let inBr = false;
                if (na0 !== null && ((na0.stdOrgNameNouns > 0 || na0.isStdName))) 
                    specWordBefore = true;
                else {
                    let rt00 = OrganizationAnalyzer.tryAttachOrg(typ.endToken.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                    if (rt00 === null && BracketHelper.canBeStartOfSequence(typ.endToken.next, true, false)) {
                        rt00 = OrganizationAnalyzer.tryAttachOrg(typ.endToken.next.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                        if (rt00 !== null) {
                            inBr = true;
                            if (rt00.endToken.next === null) {
                            }
                            else if (BracketHelper.canBeEndOfSequence(rt00.endToken, true, null, false)) {
                            }
                            else if (BracketHelper.canBeEndOfSequence(rt00.endToken.next, true, null, false)) 
                                rt00.endToken = rt00.endToken.next;
                            else 
                                rt00 = null;
                            if (rt00 !== null) 
                                rt00.beginToken = typ.endToken.next;
                        }
                    }
                    if (rt00 !== null) {
                        afterOrg = Utils.as(rt00.referent, OrganizationReferent);
                        specWordBefore = true;
                        afterOrgTemp = true;
                        if (afterOrg.containsProfile(OrgProfile.UNIT) && inBr) {
                            afterOrg = null;
                            afterOrgTemp = false;
                        }
                    }
                    else if ((typ.endToken.next instanceof TextToken) && typ.endToken.next.chars.isAllUpper) {
                        let rrr = OrganizationAnalyzer.tryAttachOrgs(typ.endToken.next, 0);
                        if (rrr !== null && rrr.length === 1) {
                            afterOrg = Utils.as(rrr[0].referent, OrganizationReferent);
                            specWordBefore = true;
                            afterOrgTemp = true;
                        }
                    }
                }
            }
        }
        if ((((((((typ.root !== null && typ.root.canBeNormalDep && !specWordBefore) && typ.typ !== "отдел" && typ.typ !== "отделение") && typ.typ !== "инспекция" && typ.typ !== "филиал") && typ.typ !== "аппарат" && typ.typ !== "відділення") && typ.typ !== "інспекція" && typ.typ !== "філія") && typ.typ !== "апарат" && typ.typ !== "совет") && typ.typ !== "рада" && (typ.typ.indexOf(' ') < 0)) && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) 
            return null;
        if (typ.morph.number === MorphNumber.PLURAL) {
            if (!typ.beginToken.isValue("ОСП", null)) 
                return null;
        }
        let dep = null;
        let t0 = typ.beginToken;
        let t1 = typ.endToken;
        dep = new OrganizationReferent();
        dep.addTypeStr(typ.typ.toLowerCase());
        dep.addProfile(OrgProfile.UNIT);
        if (typ.number !== null) 
            dep.number = typ.number;
        else if (typ.typ === "курс" && !typ.isNewlineBefore) {
            let nnn = NumberHelper.tryParseRomanBack(typ.beginToken.previous);
            if (nnn !== null && nnn.intValue !== null) {
                if (nnn.intValue >= 1 && nnn.intValue <= 6) {
                    dep.number = nnn.value.toString();
                    t0 = nnn.beginToken;
                }
            }
        }
        let t = typ.endToken.next;
        t1 = typ.endToken;
        if ((typ.number === null && ((typ.typ === "отдел" || typ.typ === "лаборатория")) && (typ.endToken.next instanceof NumberToken)) && specWordBefore && (typ.whitespacesAfterCount < 3)) {
            t1 = typ.endToken.next;
            dep.number = t1.value;
            typ.coef = typ.coef + (2);
        }
        if ((t instanceof TextToken) && afterOrg === null && (((LanguageHelper.endsWith(typ.typ, "аппарат") || LanguageHelper.endsWith(typ.typ, "апарат") || LanguageHelper.endsWith(typ.typ, "совет")) || LanguageHelper.endsWith(typ.typ, "рада")))) {
            let tt1 = t;
            if (tt1.isValue("ПРИ", null)) 
                tt1 = tt1.next;
            let pr1 = t.kit.processReferent("PERSON", tt1, null);
            if (pr1 !== null && pr1.referent.typeName === "PERSONPROPERTY") {
                dep.addSlot(OrganizationReferent.ATTR_OWNER, pr1.referent, true, 0);
                pr1.setDefaultLocalOnto(t.kit.processor);
                dep.addExtReferent(pr1);
                if (LanguageHelper.endsWith(typ.typ, "рат")) 
                    return new ReferentToken(dep, t0, pr1.endToken);
                t1 = pr1.endToken;
                t = t1.next;
            }
        }
        let beforeOrg = null;
        for (let ttt = typ.beginToken.previous; ttt !== null; ttt = ttt.previous) {
            if (ttt.getReferent() instanceof OrganizationReferent) {
                beforeOrg = ttt.getReferent();
                break;
            }
            else if (!(ttt instanceof TextToken)) 
                break;
            else if (ttt.chars.isLetter) 
                break;
        }
        let num = null;
        let names = null;
        let br = null;
        let br00 = null;
        let pr = null;
        let ty0 = null;
        let isPureOrg = false;
        let isPureDep = false;
        if (typ.typ === "операционное управление" || typ.typ === "операційне управління") 
            isPureDep = true;
        let afterOrgTok = null;
        let brName = null;
        let coef = typ.coef;
        for (; t !== null; t = t.next) {
            if (afterOrgTemp) 
                break;
            if (t.isChar(':')) {
                if (t.isNewlineAfter) 
                    break;
                if (names !== null || typ.name !== null) 
                    break;
                continue;
            }
            if ((((num = OrgItemNumberToken.tryAttach(t, false, typ)))) !== null) {
                if (t.isNewlineBefore || typ.number !== null) 
                    break;
                if (typ.root !== null && !typ.root.canHasNumber) 
                    break;
                if ((typ.beginToken.previous instanceof NumberToken) && (typ.whitespacesBeforeCount < 2)) {
                    let typ2 = OrgItemTypeToken.tryAttach(num.endToken.next, true);
                    if (typ2 !== null && typ2.root !== null && ((typ2.root.canHasNumber || typ2.isDep))) {
                        typ.beginToken = typ.beginToken.previous;
                        typ.number = typ.beginToken.value;
                        dep.number = typ.number;
                        num = null;
                        coef += (1);
                        break;
                    }
                }
                t1 = num.endToken;
                t = num.endToken.next;
                break;
            }
            else if ((((ty0 = OrgItemTypeToken.tryAttach(t, true)))) !== null && ty0.morph.number !== MorphNumber.PLURAL && !ty0.isDoubtRootWord) 
                break;
            else if ((((br00 = BracketHelper.tryParse(t, BracketParseAttr.NO, 100)))) !== null && names === null) {
                br = br00;
                if (!br.isQuoteType || brName !== null) 
                    br = null;
                else if (t.isNewlineBefore && !specWordBefore) 
                    br = null;
                else {
                    let ok1 = true;
                    for (let tt = br.beginToken; tt !== br.endToken; tt = tt.next) {
                        if (tt instanceof ReferentToken) {
                            ok1 = false;
                            break;
                        }
                    }
                    if (ok1) {
                        brName = br;
                        t1 = br.endToken;
                        t = t1.next;
                    }
                    else 
                        br = null;
                }
                break;
            }
            else {
                let r = t.getReferent();
                if ((r === null && t.morph._class.isPreposition && t.next !== null) && (t.next.getReferent() instanceof GeoReferent)) {
                    dep.addGeoObject(t.next.getReferent());
                    t = t.next;
                    break;
                }
                if (r !== null) {
                    if (r instanceof OrganizationReferent) {
                        afterOrg = Utils.as(r, OrganizationReferent);
                        afterOrgTok = t;
                        if (names === null && (t.whitespacesAfterCount < 3) && BracketHelper.canBeStartOfSequence(t.next, true, false)) 
                            continue;
                        break;
                    }
                    if ((r instanceof GeoReferent) && names !== null && t.previous !== null) {
                        let isName = false;
                        if (t.previous.isValue("СУБЪЕКТ", null) || t.previous.isValue("СУБЄКТ", null)) 
                            isName = true;
                        if (!isName) 
                            break;
                    }
                    else 
                        break;
                }
                let epo = OrgItemEponymToken.tryAttach(t, true);
                if (epo !== null) {
                    for (const e of epo.eponyms) {
                        dep.addEponym(e);
                    }
                    t1 = epo.endToken;
                    break;
                }
                if (!typ.chars.isAllUpper && t.chars.isAllUpper) {
                    let na1 = OrgItemNameToken.tryAttach(t, pr, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, false);
                    if (na1 !== null && ((na1.isStdName || na1.stdOrgNameNouns > 0))) {
                    }
                    else 
                        break;
                }
                if ((t instanceof NumberToken) && typ.root !== null && dep.number === null) {
                    if (t.whitespacesBeforeCount > 1 || !typ.root.canHasNumber) 
                        break;
                    if ((typ.beginToken.previous instanceof NumberToken) && (typ.whitespacesBeforeCount < 2)) {
                        let typ2 = OrgItemTypeToken.tryAttach(t.next, true);
                        if (typ2 !== null && typ2.root !== null && ((typ2.root.canHasNumber || typ2.isDep))) {
                            typ.beginToken = typ.beginToken.previous;
                            dep.number = (typ.number = typ.beginToken.value);
                            coef += (1);
                            break;
                        }
                    }
                    dep.number = t.value.toString();
                    t1 = t;
                    continue;
                }
                if (isPureDep) 
                    break;
                if (!t.chars.isAllLower) {
                    let rtp = t.kit.processReferent("PERSON", t, null);
                    if (rtp !== null && rtp.referent.typeName === "PERSONPROPERTY") {
                        if (rtp.morph._case.isGenitive && t === typ.endToken.next && (t.whitespacesBeforeCount < 4)) 
                            rtp = null;
                    }
                    if (rtp !== null) 
                        break;
                }
                if (typ.typ === "генеральный штаб" || typ.typ === "генеральний штаб") {
                    let rtp = t.kit.processReferent("PERSONPROPERTY", t, null);
                    if (rtp !== null) 
                        break;
                }
                let na = OrgItemNameToken.tryAttach(t, pr, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, names === null);
                if (t.isValue("ПО", null) && t.next !== null) {
                    let tt = t.next;
                    if (tt.isValue("ОБСЛУЖИВАНИЕ", null) && tt.next !== null) 
                        tt = tt.next;
                    if (tt.isValue("РАЙОН", null) || tt.isValue("МИКРОРАЙОН", null)) 
                        na = OrgItemNameToken.tryAttach(tt.next, pr, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, true);
                }
                if (t.morph._class.isPreposition && ((t.isValue("ПРИ", null) || t.isValue("OF", null) || t.isValue("AT", null)))) {
                    if ((t.next instanceof ReferentToken) && (t.next.getReferent() instanceof OrganizationReferent)) {
                        afterOrg = Utils.as(t.next.getReferent(), OrganizationReferent);
                        break;
                    }
                    let rt0 = OrganizationAnalyzer.tryAttachOrg(t.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                    if (rt0 !== null) {
                        afterOrg = Utils.as(rt0.referent, OrganizationReferent);
                        afterOrgTemp = true;
                        break;
                    }
                }
                if (na === null) 
                    break;
                if (names === null) {
                    if (t.isNewlineBefore) 
                        break;
                    if (NumberHelper.tryParseRoman(t) !== null) 
                        break;
                    let rt0 = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                    if (rt0 !== null) {
                        afterOrg = Utils.as(rt0.referent, OrganizationReferent);
                        afterOrgTemp = true;
                        break;
                    }
                    names = new Array();
                }
                else {
                    if (t.whitespacesBeforeCount > 2 && !na.chars.equals(pr.chars)) 
                        break;
                    if (t.newlinesBeforeCount > 2) 
                        break;
                }
                names.push(na);
                pr = na;
                t1 = (t = na.endToken);
            }
        }
        if (afterOrg === null) {
            for (let ttt = t; ttt !== null; ttt = ttt.next) {
                if (ttt.getReferent() instanceof OrganizationReferent) {
                    afterOrg = Utils.as(ttt.getReferent(), OrganizationReferent);
                    break;
                }
                else if (!(ttt instanceof TextToken)) 
                    break;
                else if ((ttt.chars.isLetter && !ttt.isValue("ПРИ", null) && !ttt.isValue("В", null)) && !ttt.isValue("OF", null) && !ttt.isValue("AT", null)) 
                    break;
                else if (ttt.isChar(';') && attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) 
                    break;
            }
        }
        if ((afterOrg === null && t !== null && t !== t0) && (t.whitespacesBeforeCount < 2)) {
            let rt0 = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
            if (rt0 === null && (((t.isValue("В", null) || t.isValue("ПРИ", null) || t.isValue("OF", null)) || t.isValue("AT", null)))) 
                rt0 = OrganizationAnalyzer.tryAttachOrg(t.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
            if (rt0 !== null) {
                afterOrg = Utils.as(rt0.referent, OrganizationReferent);
                afterOrgTemp = true;
            }
        }
        if (typ.chars.isCapitalUpper) 
            coef += 0.5;
        else if (!typ.chars.isAllLower && typ.beginToken.chars.isCapitalUpper) 
            coef += 0.5;
        if (br !== null && names === null) {
            let nam = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
            if (!Utils.isNullOrEmpty(nam)) {
                if (nam.length > 100) 
                    return null;
                coef += (3);
                let na = OrgItemNameToken.tryAttach(br.beginToken.next, null, false, true);
                if (na !== null && na.isStdName) {
                    coef += (1);
                    if (typ.typ === "группа") {
                        dep.slots.splice(0, dep.slots.length);
                        typ.typ = "группа компаний";
                        isPureOrg = true;
                    }
                    else if (typ.typ === "група") {
                        dep.slots.splice(0, dep.slots.length);
                        typ.typ = "група компаній";
                        isPureOrg = true;
                    }
                }
                if (isPureOrg) {
                    dep.addType(typ, false);
                    dep.addName(nam, true, null);
                }
                else 
                    dep.addNameStr(nam, typ, 1);
            }
        }
        else if (names !== null) {
            let j = 0;
            if (afterOrg !== null || attachTyp === OrganizationAnalyzerAttachType.HIGH) {
                coef += (3);
                j = names.length;
            }
            else 
                for (j = 0; j < names.length; j++) {
                    if (((names[j].isNewlineBefore && !typ.isNewlineBefore && !names[j].isAfterConjunction)) || ((!names[j].chars.equals(names[0].chars) && names[j].stdOrgNameNouns === 0))) 
                        break;
                    else {
                        if (names[j].chars.equals(typ.chars) && !typ.chars.isAllLower) 
                            coef += (0.5);
                        if (names[j].isStdName) 
                            coef += (2);
                        if (names[j].stdOrgNameNouns > 0) {
                            if (!typ.chars.isAllLower) 
                                coef += (names[j].stdOrgNameNouns);
                        }
                    }
                }
            if (names[j - 1].endChar > t1.endChar) 
                t1 = names[j - 1].endToken;
            let s = MiscHelper.getTextValue(names[0].beginToken, t1, GetTextAttr.NO);
            if (!Utils.isNullOrEmpty(s)) {
                if (s.length > 150 && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) 
                    return null;
                dep.addNameStr(s, typ, 1);
            }
            if (num !== null) {
                dep.number = num.number;
                coef += (2);
                t1 = num.endToken;
            }
        }
        else if (num !== null) {
            dep.number = num.number;
            coef += (2);
            t1 = num.endToken;
            if (typ !== null && ((typ.typ === "лаборатория" || typ.typ === "лабораторія"))) 
                coef += (1);
            if (typ.name !== null) 
                dep.addNameStr(null, typ, 1);
        }
        else if (typ.name !== null) {
            if (typ.typ === "курс" && Utils.isDigit(typ.name[0])) 
                dep.number = typ.name.substring(0, 0 + typ.name.indexOf(' '));
            else 
                dep.addNameStr(null, typ, 1);
        }
        else if (typ.typ === "кафедра" || typ.typ === "факультет") {
            t = typ.endToken.next;
            if (t !== null && t.isChar(':')) 
                t = t.next;
            if ((t !== null && (t instanceof TextToken) && !t.isNewlineBefore) && t.morph._class.isAdjective) {
                if (typ.morph.gender === t.morph.gender) {
                    let s = t.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                    if (s !== null) {
                        dep.addNameStr((s + " " + typ.typ.toUpperCase()), null, 1);
                        coef += (2);
                        t1 = t;
                    }
                }
            }
        }
        else if (typ.typ === "курс") {
            t = typ.endToken.next;
            if (t !== null && t.isChar(':')) 
                t = t.next;
            if (t !== null && !t.isNewlineBefore) {
                let val = 0;
                if (t instanceof NumberToken) {
                    if (!t.morph._class.isNoun && t.intValue !== null) {
                        if (t.isWhitespaceAfter || t.next.isCharOf(";,")) 
                            val = t.intValue;
                    }
                }
                else {
                    let nt = NumberHelper.tryParseRoman(t);
                    if (nt !== null && nt.intValue !== null) {
                        val = nt.intValue;
                        t = nt.endToken;
                    }
                }
                if (val > 0 && (val < 8)) {
                    dep.number = val.toString();
                    t1 = t;
                    coef += (4);
                }
            }
            if (dep.number === null) {
                t = typ.beginToken.previous;
                if (t !== null && !t.isNewlineAfter) {
                    let val = 0;
                    if (t instanceof NumberToken) {
                        if (!t.morph._class.isNoun && t.intValue !== null) {
                            if (t.isWhitespaceBefore || t.previous.isCharOf(",")) 
                                val = t.intValue;
                        }
                    }
                    else {
                        let nt = NumberHelper.tryParseRomanBack(t);
                        if (nt !== null && nt.intValue !== null) {
                            val = nt.intValue;
                            t = nt.beginToken;
                        }
                    }
                    if (val > 0 && (val < 8)) {
                        dep.number = val.toString();
                        t0 = t;
                        coef += (4);
                    }
                }
            }
        }
        else if (typ.root !== null && typ.root.canBeNormalDep && afterOrg !== null) {
            coef += (3);
            if (!afterOrgTemp) 
                dep.higher = Utils.as(afterOrg, OrganizationReferent);
            else 
                dep.m_TempParentOrg = Utils.as(afterOrg, OrganizationReferent);
            if (afterOrgTok !== null) 
                t1 = afterOrgTok;
        }
        else if (typ.typ === "генеральный штаб" || typ.typ === "генеральний штаб") 
            coef += (3);
        if (beforeOrg !== null) 
            coef += (1);
        if (afterOrg !== null) {
            coef += (2);
            if (((typ.name !== null || ((typ.root !== null && typ.root.canBeNormalDep)))) && OrgOwnershipHelper.canBeHigher(Utils.as(afterOrg, OrganizationReferent), dep, false)) {
                coef += (1);
                if (!typ.chars.isAllLower) 
                    coef += 0.5;
            }
        }
        if (typ.typ === "курс" || typ.typ === "группа" || typ.typ === "група") {
            if (dep.number === null) 
                coef = 0;
            else if (typ.typ === "курс") {
                let n = 0;
                let wrapn2424 = new RefOutArgWrapper();
                let inoutres2425 = Utils.tryParseInt(dep.number, wrapn2424);
                n = wrapn2424.value;
                if (inoutres2425) {
                    if (n > 0 && (n < 9)) 
                        coef += (2);
                }
            }
        }
        if (t1.next !== null && t1.next.isChar('(')) {
            let ttt = t1.next.next;
            if ((ttt !== null && ttt.next !== null && ttt.next.isChar(')')) && (ttt instanceof TextToken)) {
                if (dep.nameVars.containsKey(ttt.term)) {
                    coef += (2);
                    dep.addName(ttt.term, true, ttt);
                    t1 = ttt.next;
                }
            }
        }
        let ep = OrgItemEponymToken.tryAttach(t1.next, false);
        if (ep !== null) {
            coef += (2);
            for (const e of ep.eponyms) {
                dep.addEponym(e);
            }
            t1 = ep.endToken;
        }
        if (brName !== null) {
            let str1 = MiscHelper.getTextValue(brName.beginToken.next, brName.endToken.previous, GetTextAttr.NO);
            if (str1 !== null) 
                dep.addName(str1, true, null);
        }
        if (dep.slots.length === 0) 
            return null;
        let res = new ReferentToken(dep, t0, t1);
        OrganizationAnalyzer.correctDepAttrs(res, typ, afterOrgTemp);
        if (afterOrg !== null && dep.higher === null && !afterOrgTemp) {
            if (OrgOwnershipHelper.canBeHigher(afterOrg, dep, false)) 
                dep.higher = afterOrg;
        }
        if (dep.number !== null) 
            coef += (2);
        if (isPureDep) 
            coef += (2);
        if (specWordBefore) {
            if (dep.findSlot(OrganizationReferent.ATTR_NAME, null, true) !== null) 
                coef += (2);
        }
        if ((typ !== null && typ.root !== null && typ.root.canBeNormalDep) && typ.name !== null && typ.name.indexOf(' ') > 0) 
            coef += (4);
        if (((typ !== null && typ.root !== null && !typ.root.canBeNormalDep) && dep.higher === null && !afterOrgTemp) && afterOrg === null && dep.number === null) {
            if (typ.typ === "руководство") 
                return null;
        }
        if (coef > 3 || attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) 
            return res;
        else 
            return null;
    }
    
    static correctDepAttrs(res, typ, afterTempOrg = false) {
        let t0 = res.beginToken;
        let dep = Utils.as(res.referent, OrganizationReferent);
        if ((((((((typ !== null && typ.root !== null && typ.root.canHasNumber)) || dep.types.includes("офис") || dep.types.includes("офіс")) || dep.types.includes("отдел") || dep.types.includes("отделение")) || dep.types.includes("инспекция") || dep.types.includes("лаборатория")) || dep.types.includes("управление") || dep.types.includes("управління")) || dep.types.includes("відділ") || dep.types.includes("відділення")) || dep.types.includes("інспекція") || dep.types.includes("лабораторія")) {
            if (((t0.previous instanceof NumberToken) && (t0.whitespacesBeforeCount < 3) && !t0.previous.morph._class.isNoun) && t0.previous.isWhitespaceBefore) {
                let nn = t0.previous.value.toString();
                if (dep.number === null || dep.number === nn) {
                    dep.number = nn;
                    t0 = t0.previous;
                    res.beginToken = t0;
                }
            }
            if (MiscHelper.checkNumberPrefix(res.endToken.next) !== null && (res.endToken.whitespacesAfterCount < 3) && dep.number === null) {
                let num = OrgItemNumberToken.tryAttach(res.endToken.next, false, typ);
                if (num !== null) {
                    dep.number = num.number;
                    res.endToken = num.endToken;
                }
            }
        }
        if (dep.types.includes("управление") || dep.types.includes("департамент") || dep.types.includes("управління")) {
            for (const s of dep.slots) {
                if (s.typeName === OrganizationReferent.ATTR_GEO && (s.value instanceof GeoReferent)) {
                    let g = Utils.as(s.value, GeoReferent);
                    if (g.isState && g.alpha2 === "RU") {
                        Utils.removeItem(dep.slots, s);
                        break;
                    }
                }
            }
        }
        let t1 = res.endToken;
        if (t1.next === null || afterTempOrg) 
            return;
        let br = BracketHelper.tryParse(t1.next, BracketParseAttr.NO, 100);
        if (br !== null && (t1.whitespacesAfterCount < 2) && br.isQuoteType) {
            let g = OrganizationAnalyzer.isGeo(br.beginToken.next, false);
            if (g instanceof ReferentToken) {
                if (g.endToken.next === br.endToken) {
                    dep.addGeoObject(g);
                    t1 = res.endToken = br.endToken;
                }
            }
            else if ((g instanceof Referent) && br.beginToken.next.next === br.endToken) {
                dep.addGeoObject(g);
                t1 = res.endToken = br.endToken;
            }
            else if (br.beginToken.next.isValue("О", null) || br.beginToken.next.isValue("ОБ", null)) {
            }
            else {
                let nam = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                if (nam !== null) {
                    dep.addName(nam, true, br.beginToken.next);
                    t1 = res.endToken = br.endToken;
                }
            }
        }
        let prep = false;
        if (t1.next !== null) {
            if (t1.next.morph._class.isPreposition) {
                if (t1.next.isValue("В", null) || t1.next.isValue("ПО", null)) {
                    t1 = t1.next;
                    prep = true;
                }
            }
            if (t1.next !== null && (t1.next.whitespacesBeforeCount < 3)) {
                if (t1.next.isValue("НА", null) && t1.next.next !== null && t1.next.next.isValue("ТРАНСПОРТ", null)) 
                    res.endToken = (t1 = t1.next.next);
            }
        }
        for (let k = 0; k < 2; k++) {
            if (t1.next === null) 
                return;
            let _geo = Utils.as(t1.next.getReferent(), GeoReferent);
            let ge = false;
            if (_geo !== null) {
                if (!dep.addGeoObject(_geo)) 
                    return;
                res.endToken = t1.next;
                ge = true;
            }
            else {
                let rgeo = t1.kit.processReferent("GEO", t1.next, null);
                if (rgeo !== null) {
                    if (!rgeo.morph._class.isAdjective) {
                        if (!dep.addGeoObject(rgeo)) 
                            return;
                        res.endToken = rgeo.endToken;
                        ge = true;
                    }
                }
            }
            if (!ge) 
                return;
            t1 = res.endToken;
            if (t1.next === null) 
                return;
            let isAnd = false;
            if (t1.next.isAnd) 
                t1 = t1.next;
            if (t1 === null) 
                return;
        }
    }
    
    static tryAttachOrg(t, attachTyp, multTyp = null, isAdditionalAttach = false, step = -1) {
        let ad = OrganizationAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad.level > 4) 
            return null;
        ad.level++;
        let res = OrganizationAnalyzer._TryAttachOrgInt(t, attachTyp, multTyp, isAdditionalAttach, step);
        ad.level--;
        return res;
    }
    
    static _TryAttachOrgInt(t, attachTyp, multTyp, isAdditionalAttach, step) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (t === null) 
            return null;
        if (t.chars.isLatinLetter && MiscHelper.isEngArticle(t)) {
            let re = OrganizationAnalyzer.tryAttachOrg(t.next, attachTyp, multTyp, isAdditionalAttach, step);
            if (re !== null) {
                re.beginToken = t;
                return re;
            }
        }
        let _org = null;
        let types = null;
        if (multTyp !== null) {
            types = new Array();
            types.push(multTyp);
        }
        let t0 = t;
        let t1 = t;
        let otExLi = null;
        let typ = null;
        let hiph = false;
        let specWordBefore = false;
        let ok = false;
        let inBrackets = false;
        let rt0 = null;
        let ad = OrganizationAnalyzer.getData(t);
        for (; t !== null; t = t.next) {
            if (t.getReferent() instanceof OrganizationReferent) 
                break;
            rt0 = OrganizationAnalyzer.attachGlobalOrg(t, attachTyp, null);
            if ((rt0 === null && typ !== null && typ.geo !== null) && typ.beginToken.next === typ.endToken) {
                rt0 = OrganizationAnalyzer.attachGlobalOrg(typ.endToken, attachTyp, typ.geo);
                if (rt0 !== null) 
                    rt0.beginToken = typ.beginToken;
            }
            if (rt0 !== null) {
                if (attachTyp === OrganizationAnalyzerAttachType.MULTIPLE) {
                    if (types === null || types.length === 0) 
                        return null;
                    if (!OrgItemTypeToken.isTypeAccords(Utils.as(rt0.referent, OrganizationReferent), types[0])) 
                        return null;
                    rt0.referent.addType(types[0], false);
                    if ((rt0.beginToken.beginChar - types[0].endToken.next.endChar) < 3) 
                        rt0.beginToken = types[0].beginToken;
                    break;
                }
                if (typ !== null && !typ.endToken.morph._class.isVerb) {
                    if (OrganizationAnalyzer._isMvdOrg(Utils.as(rt0.referent, OrganizationReferent)) !== null && typ.typ !== null && typ.typ.includes("служба")) {
                        rt0 = null;
                        break;
                    }
                    if (OrgItemTypeToken.isTypeAccords(Utils.as(rt0.referent, OrganizationReferent), typ)) {
                        rt0.beginToken = typ.beginToken;
                        rt0.referent.addType(typ, false);
                    }
                }
                break;
            }
            if (t.isHiphen) {
                if (t === t0 || types === null) {
                    if (otExLi !== null) 
                        break;
                    return null;
                }
                if (t.isWhitespaceBefore && t.isWhitespaceAfter) {
                    if (OrgItemTypeToken.tryAttach(t.next, false) !== null) 
                        break;
                }
                if ((typ !== null && typ.root !== null && typ.root.canHasNumber) && (t.next instanceof NumberToken)) {
                }
                else 
                    hiph = true;
                continue;
            }
            if (ad !== null && otExLi === null) {
                let ok1 = false;
                let tt = t;
                if (t.innerBool) 
                    ok1 = true;
                else if (t.chars.isAllLower) {
                }
                else if (t.chars.isLetter) 
                    ok1 = true;
                else if (t.previous !== null && BracketHelper.isBracket(t.previous, false)) 
                    ok1 = true;
                else if (BracketHelper.canBeStartOfSequence(t, true, false) && t.next !== null) {
                    ok1 = true;
                    tt = t.next;
                }
                if (ok1 && tt !== null) {
                    otExLi = ad.locOrgs.tryAttach(tt, null, false);
                    if (otExLi === null && t.kit.ontology !== null) {
                        if ((((otExLi = t.kit.ontology.attachToken(OrganizationReferent.OBJ_TYPENAME, tt)))) !== null) {
                        }
                    }
                    if ((otExLi === null && tt.lengthChar === 2 && tt.chars.isAllUpper) && (ad.localOntology.items.length < 1000)) {
                        otExLi = ad.localOntology.tryAttach(tt, null, false);
                        if (otExLi !== null) {
                            if (tt.kit.sofa.text.length > 300) 
                                otExLi = null;
                        }
                    }
                }
                if (otExLi !== null) 
                    t.innerBool = true;
            }
            if ((step >= 0 && !t.innerBool && t === t0) && (t instanceof TextToken)) 
                typ = null;
            else {
                typ = OrgItemTypeToken.tryAttach(t, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY);
                if (typ === null && BracketHelper.canBeStartOfSequence(t, false, false)) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        typ = OrgItemTypeToken.tryAttach(t.next, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY);
                        if (typ !== null && typ.endToken === br.endToken.previous && ((BracketHelper.canBeStartOfSequence(br.endToken.next, true, false) || t.isChar('(')))) {
                            typ = typ.clone();
                            typ.endToken = br.endToken;
                            typ.beginToken = t;
                        }
                        else 
                            typ = null;
                    }
                }
            }
            if (typ === null) 
                break;
            if (types === null) {
                if ((((typ.typ === "главное управление" || typ.typ === "главное территориальное управление" || typ.typ === "головне управління") || typ.typ === "головне територіальне управління" || typ.typ === "пограничное управление")) && otExLi !== null) 
                    break;
                types = new Array();
                t0 = typ.beginToken;
                if (typ.isNotTyp && typ.endToken.next !== null) 
                    t0 = typ.endToken.next;
                if (OrgItemTypeToken.checkOrgSpecialWordBefore(typ.beginToken.previous)) 
                    specWordBefore = true;
            }
            else {
                ok = true;
                for (const ty of types) {
                    if (OrgItemTypeToken.isTypesAntagonisticTT(ty, typ)) {
                        ok = false;
                        break;
                    }
                }
                if (!ok) 
                    break;
                if (typ.isDep) 
                    break;
                if (inBrackets) 
                    break;
                let typ0 = OrganizationAnalyzer._lastTyp(types);
                if (hiph && ((t.whitespacesBeforeCount > 0 && ((typ0 !== null && typ0.isDoubtRootWord))))) 
                    break;
                if (typ.endToken === typ.beginToken) {
                    if (typ.isValue("ОРГАНИЗАЦИЯ", "ОРГАНІЗАЦІЯ") || typ.isValue("УПРАВЛІННЯ", "")) 
                        break;
                }
                if (typ0.typ === "банк" && typ.root !== null && typ.root.typ === OrgItemTypeTyp.PREFIX) {
                    let rt = OrganizationAnalyzer.tryAttachOrg(typ.beginToken, attachTyp, null, false, -1);
                    if (rt !== null && rt.referent.toString().includes("Сбербанк")) 
                        return null;
                }
                if (typ0.isDep || typ0.typ === "департамент") 
                    break;
                if ((typ0.root !== null && typ0.root.isPurePrefix && typ.root !== null) && !typ.root.isPurePrefix && !typ.beginToken.chars.isAllLower) {
                    if (typ0.typ.includes("НИИ")) 
                        break;
                }
                let pref0 = typ0.root !== null && typ0.root.isPurePrefix;
                let pref = typ.root !== null && typ.root.isPurePrefix;
                if (!pref0 && !pref) {
                    if (typ0.name !== null && typ0.name.length !== typ0.typ.length) {
                        if (t.whitespacesBeforeCount > 1) 
                            break;
                    }
                    if (!typ0.morph._case.isUndefined && !typ.morph._case.isUndefined) {
                        if (!(MorphCase.ooBitand(typ0.morph._case, typ.morph._case)).isNominative && !hiph) {
                            if (!typ.morph._case.isNominative) 
                                break;
                        }
                    }
                    if (typ0.morph.number !== MorphNumber.UNDEFINED && typ.morph.number !== MorphNumber.UNDEFINED) {
                        if (((typ0.morph.number.value()) & (typ.morph.number.value())) === (MorphNumber.UNDEFINED.value())) 
                            break;
                    }
                }
                if (!pref0 && pref && !hiph) {
                    let nom = false;
                    for (const m of typ.morph.items) {
                        if (m.number === MorphNumber.SINGULAR && m._case.isNominative) {
                            nom = true;
                            break;
                        }
                    }
                    if (!nom) {
                        if (LanguageHelper.endsWith(typ0.typ, "фракция") || LanguageHelper.endsWith(typ0.typ, "фракція") || typ0.typ === "банк") {
                        }
                        else 
                            break;
                    }
                }
                for (const ty of types) {
                    if (OrgItemTypeToken.isTypesAntagonisticTT(ty, typ)) 
                        return null;
                }
            }
            types.push(typ);
            inBrackets = false;
            if (typ.name !== null) {
                if (BracketHelper.canBeStartOfSequence(typ.beginToken.previous, true, false) && BracketHelper.canBeEndOfSequence(typ.endToken.next, false, null, false)) {
                    typ = typ.clone();
                    typ.beginToken = typ.beginToken.previous;
                    typ.endToken = typ.endToken.next;
                    if (typ.beginToken.endChar < t0.beginChar) 
                        t0 = typ.beginToken;
                    inBrackets = true;
                }
            }
            t = typ.endToken;
            hiph = false;
        }
        if ((types === null && otExLi === null && ((attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP))) && rt0 === null) {
            ok = false;
            if (!ok) {
                if (t0 !== null && t0.morph._class.isAdjective && t0.next !== null) {
                    if ((((rt0 = OrganizationAnalyzer.tryAttachOrg(t0.next, attachTyp, multTyp, isAdditionalAttach, step)))) !== null) {
                        if (rt0.beginToken === t0) 
                            return rt0;
                    }
                }
                if (attachTyp === OrganizationAnalyzerAttachType.NORMAL) {
                    if ((((rt0 = OrganizationAnalyzer.tryAttachOrgMed(t)))) !== null) 
                        return rt0;
                }
                if ((((t0 instanceof TextToken) && t0.previous !== null && t0.lengthChar > 2) && !t0.chars.isAllLower && !t0.isNewlineAfter) && !MiscHelper.canBeStartOfSentence(t0)) {
                    typ = OrgItemTypeToken.tryAttach(t0.next, false);
                    if (typ !== null) {
                        let rrr = OrganizationAnalyzer.tryAttachOrg(t0.next, attachTyp, multTyp, isAdditionalAttach, step);
                        if (rrr === null) {
                            if (specWordBefore || t0.previous.isValue("ТЕРРИТОРИЯ", null)) {
                                let org0 = new OrganizationReferent();
                                org0.addType(typ, false);
                                org0.addName(t0.term, false, t0);
                                t1 = typ.endToken;
                                t1 = Utils.notNull(OrganizationAnalyzer.attachTailAttributes(org0, t1.next, false, OrganizationAnalyzerAttachType.NORMAL, false), t1);
                                return new ReferentToken(org0, t0, t1);
                            }
                        }
                    }
                }
                for (let tt = t; tt !== null; tt = tt.next) {
                    if (tt.isAnd) {
                        if (tt === t) 
                            break;
                        continue;
                    }
                    if ((((tt instanceof TextToken) && tt.chars.isLetter && !tt.chars.isAllLower) && !tt.chars.isCapitalUpper && tt.lengthChar > 1) && (tt.whitespacesAfterCount < 2)) {
                        let term = tt.term;
                        if (term === "СНВ") 
                            break;
                        let mc = tt.getMorphClassInDictionary();
                        if (mc.isUndefined) {
                        }
                        else if (((tt.lengthChar < 5) && !mc.isConjunction && !mc.isPreposition) && !mc.isNoun) {
                        }
                        else if ((tt.lengthChar <= 3 && (tt.previous instanceof TextToken) && tt.previous.chars.isLetter) && !tt.previous.chars.isAllUpper) {
                        }
                        else 
                            break;
                    }
                    else 
                        break;
                    if ((tt.next instanceof ReferentToken) && (tt.next.getReferent() instanceof OrganizationReferent)) {
                        let ttt = t.previous;
                        if ((((ttt instanceof TextToken) && tt.chars.isLetter && !ttt.chars.isAllLower) && !ttt.chars.isCapitalUpper && ttt.lengthChar > 1) && ttt.getMorphClassInDictionary().isUndefined && (ttt.whitespacesAfterCount < 2)) 
                            break;
                        let tt0 = t;
                        for (t = t.previous; t !== null; t = t.previous) {
                            if (!(t instanceof TextToken) || t.whitespacesAfterCount > 2) 
                                break;
                            else if (t.isAnd) {
                            }
                            else if ((t.chars.isLetter && !t.chars.isAllLower && !t.chars.isCapitalUpper) && t.lengthChar > 1 && t.getMorphClassInDictionary().isUndefined) 
                                tt0 = t;
                            else 
                                break;
                        }
                        let nam = MiscHelper.getTextValue(tt0, tt, GetTextAttr.NO);
                        if (nam === "СЭД" || nam === "ЕОСЗ") 
                            break;
                        let own = Utils.as(tt.next.getReferent(), OrganizationReferent);
                        if (own.profiles.includes(OrgProfile.UNIT)) 
                            break;
                        if (own.toString().toUpperCase().includes("СОЮЗ")) 
                            break;
                        if (nam === "НК" || nam === "ГК") 
                            return new ReferentToken(own, t, tt.next);
                        let org0 = new OrganizationReferent();
                        org0.addProfile(OrgProfile.UNIT);
                        org0.addName(nam, true, null);
                        if (nam.indexOf(' ') > 0) 
                            org0.addName(Utils.replaceString(nam, " ", ""), true, null);
                        org0.higher = own;
                        t1 = tt.next;
                        let ttt1 = OrganizationAnalyzer.attachTailAttributes(org0, t1, true, attachTyp, false);
                        if (tt0.kit.ontology !== null) {
                            let li = tt0.kit.ontology.attachToken(OrganizationReferent.OBJ_TYPENAME, tt0);
                            if (li !== null) {
                                for (const v of li) {
                                }
                            }
                        }
                        return new ReferentToken(org0, tt0, (ttt1 != null ? ttt1 : t1));
                    }
                }
                if (((t instanceof TextToken) && t.isNewlineBefore && t.lengthChar > 1) && !t.chars.isAllLower && t.getMorphClassInDictionary().isUndefined) {
                    t1 = t.next;
                    if (t1 !== null && !t1.isNewlineBefore && (t1 instanceof TextToken)) 
                        t1 = t1.next;
                    if (t1 !== null && t1.isNewlineBefore) {
                        let typ0 = OrgItemTypeToken.tryAttach(t1, false);
                        if ((typ0 !== null && typ0.root !== null && typ0.root.typ === OrgItemTypeTyp.PREFIX) && typ0.isNewlineAfter) {
                            if (OrganizationAnalyzer.tryAttachOrg(t1, OrganizationAnalyzerAttachType.NORMAL, null, false, -1) === null) {
                                _org = new OrganizationReferent();
                                _org.addType(typ0, false);
                                _org.addName(MiscHelper.getTextValue(t, t1.previous, GetTextAttr.NO), true, null);
                                t1 = typ0.endToken;
                                let ttt1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                                return new ReferentToken(_org, t, (ttt1 != null ? ttt1 : t1));
                            }
                        }
                        if (t1.isChar('(')) {
                            if ((((typ0 = OrgItemTypeToken.tryAttach(t1.next, false)))) !== null) {
                                if (typ0.endToken.next !== null && typ0.endToken.next.isChar(')') && typ0.endToken.next.isNewlineAfter) {
                                    _org = new OrganizationReferent();
                                    _org.addType(typ0, false);
                                    _org.addName(MiscHelper.getTextValue(t, t1.previous, GetTextAttr.NO), true, null);
                                    t1 = typ0.endToken.next;
                                    let ttt1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                                    return new ReferentToken(_org, t, (ttt1 != null ? ttt1 : t1));
                                }
                            }
                        }
                    }
                }
                if ((t instanceof TextToken) && t.isNewlineBefore && BracketHelper.canBeStartOfSequence(t, false, false)) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null && br.isNewlineAfter && (br.lengthChar < 100)) {
                        t1 = br.endToken.next;
                        let typ0 = OrgItemTypeToken.tryAttach(t1, false);
                        if ((typ0 !== null && typ0.root !== null && typ0.root.typ === OrgItemTypeTyp.PREFIX) && typ0.isNewlineAfter) {
                            if (OrganizationAnalyzer.tryAttachOrg(t1, OrganizationAnalyzerAttachType.NORMAL, null, false, -1) === null) {
                                _org = new OrganizationReferent();
                                _org.addType(typ0, false);
                                _org.addName(MiscHelper.getTextValue(t, t1.previous, GetTextAttr.NO), true, null);
                                t1 = typ0.endToken;
                                let ttt1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                                return new ReferentToken(_org, t, (ttt1 != null ? ttt1 : t1));
                            }
                        }
                        if (t1 !== null && t1.isChar('(')) {
                            if ((((typ0 = OrgItemTypeToken.tryAttach(t1.next, false)))) !== null) {
                                if (typ0.endToken.next !== null && typ0.endToken.next.isChar(')') && typ0.endToken.next.isNewlineAfter) {
                                    _org = new OrganizationReferent();
                                    _org.addType(typ0, false);
                                    _org.addName(MiscHelper.getTextValue(t, t1.previous, GetTextAttr.NO), true, null);
                                    t1 = typ0.endToken.next;
                                    let ttt1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                                    return new ReferentToken(_org, t, (ttt1 != null ? ttt1 : t1));
                                }
                            }
                        }
                    }
                }
                return null;
            }
        }
        if (types !== null && types.length > 1 && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) {
            if (types[0].typ === "предприятие" || types[0].typ === "підприємство") {
                types.splice(0, 1);
                t0 = types[0].beginToken;
            }
        }
        if (rt0 === null) {
            rt0 = OrganizationAnalyzer._TryAttachOrg_(t0, t, types, specWordBefore, attachTyp, multTyp, isAdditionalAttach);
            if (rt0 !== null && otExLi !== null) {
                for (const ot of otExLi) {
                    if ((ot.endChar > rt0.endChar && ot.item !== null && ot.item.owner !== null) && ot.item.owner.isExtOntology) {
                        rt0 = null;
                        break;
                    }
                    else if (ot.endChar < rt0.beginChar) {
                        otExLi = null;
                        break;
                    }
                    else if (ot.endChar < rt0.endChar) {
                        if (ot.endToken.next.getMorphClassInDictionary().isPreposition) {
                            rt0 = null;
                            break;
                        }
                    }
                }
            }
            if (rt0 !== null) {
                if (types !== null && rt0.beginToken === types[0].beginToken) {
                    for (const ty of types) {
                        rt0.referent.addType(ty, true);
                    }
                }
                if ((rt0.beginToken === t0 && t0.previous !== null && t0.previous.morph._class.isAdjective) && (t0.whitespacesBeforeCount < 2)) {
                    if (rt0.referent.geoObjects.length === 0) {
                        let _geo = OrganizationAnalyzer.isGeo(t0.previous, true);
                        if (_geo !== null) {
                            if (rt0.referent.addGeoObject(_geo)) 
                                rt0.beginToken = t0.previous;
                        }
                    }
                }
            }
        }
        if (otExLi !== null && rt0 === null && (otExLi.length < 10)) {
            for (const ot of otExLi) {
                let org0 = Utils.as(ot.item.referent, OrganizationReferent);
                if (org0 === null) 
                    continue;
                if (org0.names.length === 0 && org0.eponyms.length === 0) 
                    continue;
                let tyty = OrgItemTypeToken.tryAttach(ot.beginToken, true);
                if (tyty !== null && tyty.beginToken === ot.endToken) 
                    continue;
                let ts = ot.beginToken;
                let te = ot.endToken;
                let isQuots = false;
                let isVeryDoubt = false;
                let nameEq = false;
                if (BracketHelper.canBeStartOfSequence(ts.previous, false, false) && BracketHelper.isBracket(ts.previous, false)) {
                    if (BracketHelper.canBeEndOfSequence(te.next, false, null, false)) {
                        if (ot.lengthChar < 2) 
                            continue;
                        if (ot.lengthChar === 2 && !org0.names.includes(te.getSourceText())) {
                        }
                        else {
                            isQuots = true;
                            ts = ts.previous;
                            te = te.next;
                        }
                    }
                    else 
                        continue;
                }
                ok = types !== null;
                if (ot.endToken.next !== null && (ot.endToken.next.getReferent() instanceof OrganizationReferent)) 
                    ok = true;
                else if (ot.endToken !== ot.beginToken) {
                    if (step === 0) {
                        if (!ot.kit.miscData.containsKey("o2step")) 
                            ot.kit.miscData.put("o2step", null);
                        continue;
                    }
                    if (!ot.beginToken.chars.isAllLower) 
                        ok = true;
                    else if (specWordBefore || isQuots) 
                        ok = true;
                }
                else if (ot.beginToken instanceof TextToken) {
                    if (step === 0) {
                        if (!t.kit.miscData.containsKey("o2step")) 
                            t.kit.miscData.put("o2step", null);
                        continue;
                    }
                    ok = false;
                    let len = ot.beginToken.lengthChar;
                    if (!ot.chars.isAllLower) {
                        if (!ot.chars.isAllUpper && ot.morph._class.isPreposition) 
                            continue;
                        for (const n of org0.names) {
                            if (ot.beginToken.isValue(n, null)) {
                                nameEq = true;
                                break;
                            }
                        }
                        let ano = org0.findNearOccurence(ot.beginToken);
                        if (ano === null) {
                            if (!ot.item.owner.isExtOntology) {
                                if (len < 3) 
                                    continue;
                                else 
                                    isVeryDoubt = true;
                            }
                        }
                        else {
                            if (len === 2 && !t.chars.isAllUpper) 
                                continue;
                            let d = ano.beginChar - ot.beginToken.beginChar;
                            if (d < 0) 
                                d = -d;
                            if (d > 2000) {
                                if (len < 3) 
                                    continue;
                                else if (len < 5) 
                                    isVeryDoubt = true;
                            }
                            else if (d > 300) {
                                if (len < 3) 
                                    continue;
                            }
                            else if (len < 3) {
                                if (d > 100 || !ot.beginToken.chars.isAllUpper) 
                                    isVeryDoubt = true;
                            }
                        }
                        if (((ot.beginToken.chars.isAllUpper || ot.beginToken.chars.isLastLower)) && ((len > 3 || ((len === 3 && ((nameEq || ano !== null))))))) 
                            ok = true;
                        else if ((specWordBefore || types !== null || isQuots) || nameEq) 
                            ok = true;
                        else if ((ot.lengthChar < 3) && isVeryDoubt) 
                            continue;
                        else if (ot.item.owner.isExtOntology && ot.beginToken.getMorphClassInDictionary().isUndefined && ((len > 3 || ((len === 3 && ((nameEq || ano !== null))))))) 
                            ok = true;
                        else if (ot.beginToken.chars.isLatinLetter) 
                            ok = true;
                        else if ((nameEq && !ot.chars.isAllLower && !ot.item.owner.isExtOntology) && !MiscHelper.canBeStartOfSentence(ot.beginToken)) 
                            ok = true;
                    }
                }
                else if (ot.beginToken instanceof ReferentToken) {
                    let r = ot.beginToken.getReferent();
                    if (r.typeName !== "DENOMINATION" && !isQuots) 
                        ok = false;
                }
                if (!ok) {
                }
                if (ok) {
                    ok = false;
                    _org = new OrganizationReferent();
                    if (types !== null) {
                        for (const ty of types) {
                            _org.addType(ty, false);
                        }
                        if (!_org.canBeEquals(org0, ReferentsEqualType.FORMERGING)) 
                            continue;
                    }
                    else 
                        for (const ty of org0.types) {
                            _org.addTypeStr(ty);
                        }
                    if (org0.number !== null && (ot.beginToken.previous instanceof NumberToken) && _org.number === null) {
                        if (org0.number !== ot.beginToken.previous.value.toString() && (ot.beginToken.whitespacesBeforeCount < 2)) {
                            if (_org.names.length > 0 || _org.higher !== null) {
                                isVeryDoubt = false;
                                ok = true;
                                _org.number = ot.beginToken.previous.value.toString();
                                if (org0.higher !== null) 
                                    _org.higher = org0.higher;
                                t0 = ot.beginToken.previous;
                            }
                        }
                    }
                    if (_org.number === null) {
                        let ttt = ot.endToken.next;
                        let nnn = OrgItemNumberToken.tryAttach(ttt, (org0.number !== null || !ot.isWhitespaceAfter), null);
                        if (nnn === null && !ot.isWhitespaceAfter && ttt !== null) {
                            if (ttt.isHiphen && ttt.next !== null) 
                                ttt = ttt.next;
                            if (ttt instanceof NumberToken) 
                                nnn = OrgItemNumberToken._new1831(ot.endToken.next, ttt, ttt.value.toString());
                        }
                        if (nnn !== null) {
                            _org.number = nnn.number;
                            te = nnn.endToken;
                        }
                    }
                    let norm = (ot.endToken.endChar - ot.beginToken.beginChar) > 5;
                    let s = MiscHelper.getTextValueOfMetaToken(ot, GetTextAttr.of(((norm ? GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE : GetTextAttr.NO).value()) | (GetTextAttr.IGNOREARTICLES.value())));
                    _org.addName(s, true, (norm ? null : ot.beginToken));
                    if (types === null || types.length === 0) {
                        let s1 = MiscHelper.getTextValueOfMetaToken(ot, GetTextAttr.IGNOREARTICLES);
                        if (s1 !== s && norm) 
                            _org.addName(s1, true, ot.beginToken);
                    }
                    t1 = te;
                    if (t1.isChar(')') && t1.isNewlineAfter) {
                    }
                    else {
                        t1 = Utils.notNull(OrganizationAnalyzer.attachMiddleAttributes(_org, t1.next), t1);
                        if (attachTyp !== OrganizationAnalyzerAttachType.NORMALAFTERDEP) 
                            t1 = Utils.notNull(OrganizationAnalyzer.attachTailAttributes(_org, t1.next, false, OrganizationAnalyzerAttachType.NORMAL, false), t1);
                    }
                    let hi = null;
                    if (t1.next !== null) 
                        hi = Utils.as(t1.next.getReferent(), OrganizationReferent);
                    if (org0.higher !== null && hi !== null && otExLi.length === 1) {
                        if (hi.canBeEquals(org0.higher, ReferentsEqualType.WITHINONETEXT)) {
                            _org.higher = hi;
                            t1 = t1.next;
                        }
                    }
                    if ((_org.eponyms.length === 0 && _org.number === null && isVeryDoubt) && !nameEq && types === null) 
                        continue;
                    if (!_org.canBeEqualsEx(org0, true, ReferentsEqualType.WITHINONETEXT)) {
                        if (t !== null && OrgItemTypeToken.checkOrgSpecialWordBefore(t.previous)) 
                            ok = true;
                        else if (!isVeryDoubt && ok) {
                        }
                        else {
                            if (!isVeryDoubt) {
                                if (_org.eponyms.length > 0 || _org.number !== null || _org.higher !== null) 
                                    ok = true;
                            }
                            ok = false;
                        }
                    }
                    else if (_org.canBeEquals(org0, ReferentsEqualType.DIFFERENTTEXTS)) {
                        _org.mergeSlots(org0, false);
                        ok = true;
                    }
                    else if (org0.higher === null || _org.higher !== null || ot.item.owner.isExtOntology) {
                        ok = true;
                        _org.mergeSlots(org0, false);
                    }
                    else if (!ot.item.owner.isExtOntology && _org.canBeEquals(org0, ReferentsEqualType.WITHINONETEXT)) {
                        if (org0.higher === null) 
                            _org.mergeSlots(org0, false);
                        ok = true;
                    }
                    if (!ok) 
                        continue;
                    if (ts.beginChar < t0.beginChar) 
                        t0 = ts;
                    rt0 = new ReferentToken(_org, t0, t1);
                    if (_org.kind === OrganizationKind.DEPARTMENT) 
                        OrganizationAnalyzer.correctDepAttrs(rt0, typ, false);
                    OrganizationAnalyzer._correctAfter(rt0);
                    if (ot.item.owner.isExtOntology) {
                        for (const sl of _org.slots) {
                            if (sl.value instanceof Referent) {
                                let ext = false;
                                for (const ss of org0.slots) {
                                    if (ss.value === sl.value) {
                                        ext = true;
                                        break;
                                    }
                                }
                                if (!ext) 
                                    continue;
                                let rr = sl.value.clone();
                                rr.occurrence.splice(0, rr.occurrence.length);
                                _org.uploadSlot(sl, rr);
                                let rtEx = new ReferentToken(rr, t0, t1);
                                rtEx.setDefaultLocalOnto(t0.kit.processor);
                                _org.addExtReferent(rtEx);
                                for (const sss of rr.slots) {
                                    if (sss.value instanceof Referent) {
                                        let rrr = sss.value.clone();
                                        rrr.occurrence.splice(0, rrr.occurrence.length);
                                        rr.uploadSlot(sss, rrr);
                                        let rtEx2 = new ReferentToken(rrr, t0, t1);
                                        rtEx2.setDefaultLocalOnto(t0.kit.processor);
                                        sl.value.addExtReferent(rtEx2);
                                    }
                                }
                            }
                        }
                    }
                    OrganizationAnalyzer._correctAfter(rt0);
                    return rt0;
                }
            }
        }
        if ((rt0 === null && types !== null && types.length === 1) && types[0].name === null) {
            let tt0 = null;
            if (MiscHelper.isEngArticle(types[0].beginToken)) 
                tt0 = types[0].beginToken;
            else if (MiscHelper.isEngAdjSuffix(types[0].endToken.next)) 
                tt0 = types[0].beginToken;
            else {
                let tt00 = types[0].beginToken.previous;
                if (tt00 !== null && (tt00.whitespacesAfterCount < 2) && tt00.chars.isLatinLetter === types[0].chars.isLatinLetter) {
                    if (MiscHelper.isEngArticle(tt00)) 
                        tt0 = tt00;
                    else if (tt00.morph._class.isPreposition || tt00.morph._class.isPronoun) 
                        tt0 = tt00.next;
                }
            }
            let cou = 100;
            if (tt0 !== null) {
                for (let tt00 = tt0.previous; tt00 !== null && cou > 0; tt00 = tt00.previous,cou--) {
                    if (tt00.getReferent() instanceof OrganizationReferent) {
                        if (OrgItemTypeToken.isTypeAccords(Utils.as(tt00.getReferent(), OrganizationReferent), types[0])) {
                            if ((types[0].whitespacesAfterCount < 3) && OrgItemTypeToken.tryAttach(types[0].endToken.next, true) !== null) {
                            }
                            else 
                                rt0 = new ReferentToken(tt00.getReferent(), tt0, types[0].endToken);
                        }
                        break;
                    }
                }
            }
        }
        if (rt0 !== null) 
            OrganizationAnalyzer.correctOwnerBefore(rt0);
        if (hiph && !inBrackets && ((attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP))) {
            let ok1 = false;
            if (rt0 !== null && BracketHelper.canBeEndOfSequence(rt0.endToken, true, null, false)) {
                if (types.length > 0) {
                    let ty = types[types.length - 1];
                    if (ty.endToken.next !== null && ty.endToken.next.isHiphen && BracketHelper.canBeStartOfSequence(ty.endToken.next.next, true, false)) 
                        ok1 = true;
                }
            }
            else if (rt0 !== null && rt0.endToken.next !== null && rt0.endToken.next.isHiphen) {
                let ty = OrgItemTypeToken.tryAttach(rt0.endToken.next.next, false);
                if (ty === null) 
                    ok1 = true;
            }
            if (!ok1) 
                return null;
        }
        if (attachTyp === OrganizationAnalyzerAttachType.MULTIPLE && t !== null) {
            if (t.chars.isAllLower) 
                return null;
        }
        if (rt0 === null) 
            return rt0;
        let doubt = rt0.tag !== null;
        _org = Utils.as(rt0.referent, OrganizationReferent);
        if (doubt && ad !== null && (ad.localOntology.items.length < 1000)) {
            let rli = ad.localOntology.tryAttachByReferent(_org, null, true);
            if (rli !== null && rli.length > 0) 
                doubt = false;
            else 
                for (const it of ad.localOntology.items) {
                    if (it.referent !== null) {
                        if (it.referent.canBeEquals(_org, ReferentsEqualType.WITHINONETEXT)) {
                            doubt = false;
                            break;
                        }
                    }
                }
        }
        if ((t !== null && t.kit.ontology !== null && attachTyp === OrganizationAnalyzerAttachType.NORMAL) && doubt) {
            let rli = t.kit.ontology.attachReferent(_org);
            if (rli !== null) {
                if (rli.length >= 1) 
                    doubt = false;
            }
        }
        if (doubt) 
            return null;
        OrganizationAnalyzer._correctAfter(rt0);
        return rt0;
    }
    
    static _correctAfter(rt0) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (rt0 === null) 
            return;
        if (!rt0.isNewlineAfter && rt0.endToken.next !== null && rt0.endToken.next.isChar('(')) {
            let tt = rt0.endToken.next.next;
            if (tt instanceof TextToken) {
                if (tt.isChar(')')) 
                    rt0.endToken = tt;
                else if ((tt.lengthChar > 2 && (tt.lengthChar < 7) && tt.chars.isLatinLetter) && tt.chars.isAllUpper) {
                    let act = tt.getSourceText().toUpperCase();
                    if ((tt.next instanceof NumberToken) && !tt.isWhitespaceAfter && tt.next.typ === NumberSpellingType.DIGIT) {
                        tt = tt.next;
                        act += tt.getSourceText();
                    }
                    if (tt.next !== null && tt.next.isChar(')')) {
                        rt0.referent.addSlot(OrganizationReferent.ATTR_MISC, act, false, 0);
                        rt0.endToken = tt.next;
                    }
                }
                else {
                    let _org = Utils.as(rt0.referent, OrganizationReferent);
                    if (_org.kind === OrganizationKind.BANK && tt.chars.isLatinLetter) {
                    }
                    let rt1 = OrganizationAnalyzer.tryAttachOrg(tt, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
                    if (rt1 !== null && rt1.endToken.next !== null && rt1.endToken.next.isChar(')')) {
                        if (_org.canBeEquals(rt1.referent, ReferentsEqualType.FORMERGING)) {
                            _org.mergeSlots(rt1.referent, true);
                            rt0.endToken = rt1.endToken.next;
                        }
                    }
                }
            }
        }
        if (rt0.isNewlineBefore && rt0.isNewlineAfter && rt0.endToken.next !== null) {
            let t1 = rt0.endToken.next;
            let typ1 = OrgItemTypeToken.tryAttach(t1, false);
            if ((typ1 !== null && typ1.isNewlineAfter && typ1.root !== null) && typ1.root.typ === OrgItemTypeTyp.PREFIX) {
                if (OrganizationAnalyzer.tryAttachOrg(t1, OrganizationAnalyzerAttachType.NORMAL, null, false, -1) === null) {
                    rt0.referent.addType(typ1, false);
                    rt0.endToken = typ1.endToken;
                }
            }
            if (t1.isChar('(')) {
                if ((((typ1 = OrgItemTypeToken.tryAttach(t1.next, false)))) !== null) {
                    if ((typ1.root !== null && typ1.root.typ === OrgItemTypeTyp.PREFIX && typ1.endToken.next !== null) && typ1.endToken.next.isChar(')') && typ1.endToken.next.isNewlineAfter) {
                        rt0.referent.addType(typ1, false);
                        rt0.endToken = typ1.endToken.next;
                    }
                }
            }
        }
    }
    
    static _lastTyp(types) {
        if (types === null) 
            return null;
        for (let i = types.length - 1; i >= 0; i--) {
            return types[i];
        }
        return null;
    }
    
    static _TryAttachOrg_(t0, t, types, specWordBefore, attachTyp, multTyp, isAdditionalAttach) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        const OrgGlobal = require("./internal/OrgGlobal");
        if (t0 === null) 
            return null;
        let t1 = t;
        let typ = OrganizationAnalyzer._lastTyp(types);
        if (typ !== null) {
            if (typ.isDep) {
                let rt0 = OrganizationAnalyzer.tryAttachDep(typ, attachTyp, specWordBefore);
                if (rt0 !== null) 
                    return rt0;
                if (typ.typ === "группа" || typ.typ === "група") {
                    typ = typ.clone();
                    typ.isDep = false;
                }
                else 
                    return null;
            }
            if (typ.isNewlineAfter && typ.name === null) {
                if (t1 !== null && (t1.getReferent() instanceof GeoReferent) && typ.profiles.includes(OrgProfile.STATE)) {
                }
                else if (typ.root !== null && ((typ.root.coeff >= 3 || typ.root.isPurePrefix))) {
                }
                else if (typ.coef >= 4) {
                }
                else if ((typ.coef >= 3 && (typ.newlinesAfterCount < 2) && typ.endToken.next !== null) && typ.endToken.next.morph._class.isPreposition) {
                }
                else if (specWordBefore) {
                }
                else 
                    return null;
            }
            if (typ !== multTyp && ((typ.morph.number === MorphNumber.PLURAL && !Utils.isUpperCase(typ.typ[0])))) {
                if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                }
                else if (typ.endToken.isValue("ВЛАСТЬ", null)) {
                }
                else 
                    return null;
            }
            if (attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
                if (((typ.typ === "предприятие" || typ.typ === "підприємство")) && !specWordBefore && types.length === 1) 
                    return null;
            }
        }
        let _org = new OrganizationReferent();
        if (types !== null) {
            for (const ty of types) {
                _org.addType(ty, false);
            }
        }
        if (typ !== null && typ.root !== null && typ.root.isPurePrefix) {
            if ((t instanceof TextToken) && t.chars.isAllUpper && !t.isNewlineAfter) {
                let b = BracketHelper.tryParse(t.next, BracketParseAttr.NO, 100);
                if (b !== null && b.isQuoteType) {
                    _org.addTypeStr(t.term);
                    t = t.next;
                }
                else {
                    let s = t.term;
                    if (s.length === 2 && s[s.length - 1] === 'К') {
                        _org.addTypeStr(s);
                        t = t.next;
                    }
                    else if (((t.getMorphClassInDictionary().isUndefined && t.next !== null && (t.next instanceof TextToken)) && t.next.chars.isCapitalUpper && t.next.next !== null) && !t.next.isNewlineAfter) {
                        if (t.next.next.isCharOf(",.;") || BracketHelper.canBeEndOfSequence(t.next.next, false, null, false)) {
                            _org.addTypeStr(s);
                            t = t.next;
                        }
                    }
                }
            }
            else if ((t instanceof TextToken) && t.morph._class.isAdjective && !t.chars.isAllLower) {
                let rtg = Utils.as(OrganizationAnalyzer.isGeo(t, true), ReferentToken);
                if (rtg !== null && BracketHelper.canBeStartOfSequence(rtg.endToken.next, false, false)) {
                    _org.addGeoObject(rtg);
                    t = rtg.endToken.next;
                }
            }
            else if ((t !== null && (t.getReferent() instanceof GeoReferent) && t.next !== null) && BracketHelper.canBeStartOfSequence(t.next, true, false)) {
                _org.addGeoObject(t.getReferent());
                t = t.next;
            }
        }
        let te = null;
        let ki0 = _org.kind;
        if (((((ki0 === OrganizationKind.GOVENMENT || ki0 === OrganizationKind.AIRPORT || ki0 === OrganizationKind.FACTORY) || ki0 === OrganizationKind.SEAPORT || ki0 === OrganizationKind.PARTY) || ki0 === OrganizationKind.JUSTICE || ki0 === OrganizationKind.MILITARY)) && t !== null) {
            let g = OrganizationAnalyzer.isGeo(t, false);
            if (g === null && t.morph._class.isPreposition && t.next !== null) 
                g = OrganizationAnalyzer.isGeo(t.next, false);
            if (g !== null) {
                if (_org.addGeoObject(g)) {
                    te = (t1 = OrganizationAnalyzer.getGeoEndToken(g, t));
                    t = t1.next;
                    let gt = OrgGlobal.GLOBAL_ORGS.tryAttach(t, null, false);
                    if (gt === null && t !== null && t.kit.baseLanguage.isUa) 
                        gt = OrgGlobal.GLOBAL_ORGS_UA.tryAttach(t, null, false);
                    if (gt !== null && gt.length === 1) {
                        if (_org.canBeEquals(gt[0].item.referent, ReferentsEqualType.FORMERGING)) {
                            _org.mergeSlots(gt[0].item.referent, false);
                            return new ReferentToken(_org, t0, gt[0].endToken);
                        }
                    }
                }
            }
        }
        if (typ !== null && typ.root !== null && ((typ.root.canBeSingleGeo && !typ.root.canHasSingleName))) {
            if (_org.geoObjects.length > 0 && te !== null) 
                return new ReferentToken(_org, t0, te);
            let r = null;
            te = (t1 = (typ !== multTyp ? typ.endToken : t0.previous));
            if (t !== null && t1.next !== null) {
                r = OrganizationAnalyzer.isGeo(t1.next, false);
                if (r === null && t1.next.morph._class.isPreposition) 
                    r = OrganizationAnalyzer.isGeo(t1.next.next, false);
            }
            if (r !== null) {
                if (!_org.addGeoObject(r)) 
                    return null;
                te = OrganizationAnalyzer.getGeoEndToken(r, t1.next);
            }
            if (_org.geoObjects.length > 0 && te !== null) {
                let npt11 = NounPhraseHelper.tryParse(te.next, NounPhraseParseAttr.NO, 0, null);
                if (npt11 !== null && (te.whitespacesAfterCount < 2) && npt11.noun.isValue("ДЕПУТАТ", null)) {
                }
                else {
                    let res11 = new ReferentToken(_org, t0, te);
                    if (_org.findSlot(OrganizationReferent.ATTR_TYPE, "посольство", true) !== null || _org.findSlot(OrganizationReferent.ATTR_TYPE, "консульство", true) !== null) {
                        if (te.next !== null && te.next.isValue("В", null)) {
                            r = OrganizationAnalyzer.isGeo(te.next.next, false);
                            if (_org.addGeoObject(r)) 
                                res11.endToken = OrganizationAnalyzer.getGeoEndToken(r, te.next.next);
                        }
                    }
                    if (typ.root.canHasNumber) {
                        let num11 = OrgItemNumberToken.tryAttach(res11.endToken.next, false, null);
                        if (num11 !== null) {
                            res11.endToken = num11.endToken;
                            _org.number = num11.number;
                        }
                    }
                    return res11;
                }
            }
        }
        if (typ !== null && (((typ.typ === "милиция" || typ.typ === "полиция" || typ.typ === "міліція") || typ.typ === "поліція"))) {
            if (_org.geoObjects.length > 0 && te !== null) 
                return new ReferentToken(_org, t0, te);
            else 
                return null;
        }
        if (t !== null && t.morph._class.isProperName) {
            let rt1 = t.kit.processReferent("PERSON", t, null);
            if (rt1 !== null && (rt1.whitespacesAfterCount < 2)) {
                if (BracketHelper.canBeStartOfSequence(rt1.endToken.next, true, false)) 
                    t = rt1.endToken.next;
                else if (rt1.endToken.next !== null && rt1.endToken.next.isHiphen && BracketHelper.canBeStartOfSequence(rt1.endToken.next.next, true, false)) 
                    t = rt1.endToken.next.next;
            }
        }
        else if ((t !== null && t.chars.isCapitalUpper && t.morph._class.isProperSurname) && t.next !== null && (t.whitespacesAfterCount < 2)) {
            if (BracketHelper.canBeStartOfSequence(t.next, true, false)) 
                t = t.next;
            else if (((t.next.isCharOf(":") || t.next.isHiphen)) && BracketHelper.canBeStartOfSequence(t.next.next, true, false)) 
                t = t.next.next;
        }
        let tMax = null;
        let br = null;
        if (t !== null) {
            br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (typ !== null && br === null && BracketHelper.canBeStartOfSequence(t, false, false)) {
                if (t.next !== null && (t.next.getReferent() instanceof OrganizationReferent)) {
                    let org0 = Utils.as(t.next.getReferent(), OrganizationReferent);
                    if (!OrgItemTypeToken.isTypesAntagonisticOO(_org, org0)) {
                        org0.mergeSlots(_org, false);
                        return new ReferentToken(org0, t0, t.next);
                    }
                }
                if (((typ.typ === "компания" || typ.typ === "предприятие" || typ.typ === "организация") || typ.typ === "компанія" || typ.typ === "підприємство") || typ.typ === "організація") {
                    if (OrgItemTypeToken.isDecreeKeyword(t0.previous, 1)) 
                        return null;
                }
                let ty2 = OrgItemTypeToken.tryAttach(t.next, false);
                if (ty2 !== null) {
                    let typs2 = new Array();
                    typs2.push(ty2);
                    let rt2 = OrganizationAnalyzer._TryAttachOrg_(t.next, ty2.endToken.next, typs2, true, OrganizationAnalyzerAttachType.HIGH, null, isAdditionalAttach);
                    if (rt2 !== null) {
                        let org0 = Utils.as(rt2.referent, OrganizationReferent);
                        if (!OrgItemTypeToken.isTypesAntagonisticOO(_org, org0)) {
                            org0.mergeSlots(_org, false);
                            rt2.beginToken = t0;
                            if (BracketHelper.canBeEndOfSequence(rt2.endToken.next, false, null, false)) 
                                rt2.endToken = rt2.endToken.next;
                            return rt2;
                        }
                    }
                }
            }
        }
        if (br !== null && typ !== null && _org.kind === OrganizationKind.GOVENMENT) {
            if (typ.root !== null && !typ.root.canHasSingleName) 
                br = null;
        }
        if (br !== null && br.isQuoteType) {
            if (br.beginToken.next.isValue("О", null) || br.beginToken.next.isValue("ОБ", null)) 
                br = null;
            else if (br.beginToken.previous !== null && br.beginToken.previous.isChar(':')) 
                br = null;
        }
        if (br !== null && br.isQuoteType && ((br.openChar !== '<' || ((typ !== null && typ.root !== null && typ.root.isPurePrefix)) || (((types !== null && types.length > 0 && types[0].root !== null) || types[0].root.isPurePrefix))))) {
            if (t.isNewlineBefore && ((attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP))) {
                if (!br.isNewlineAfter) {
                    if (typ === null) 
                        return null;
                    if (typ.isNewlineBefore || ((typ.beginToken.previous !== null && typ.beginToken.previous.isTableControlChar))) {
                    }
                    else 
                        return null;
                }
            }
            if (_org.findSlot(OrganizationReferent.ATTR_TYPE, "организация", true) !== null || _org.findSlot(OrganizationReferent.ATTR_TYPE, "організація", true) !== null) {
                if (typ.beginToken === typ.endToken) {
                    if (!specWordBefore) 
                        return null;
                }
            }
            if (typ !== null && ((((typ.typ === "компания" || typ.typ === "предприятие" || typ.typ === "организация") || typ.typ === "компанія" || typ.typ === "підприємство") || typ.typ === "організація"))) {
                if (OrgItemTypeToken.isDecreeKeyword(t0.previous, 1)) 
                    return null;
            }
            let nn = OrgItemNameToken.tryAttach(t.next, null, false, true);
            if (nn !== null && nn.isIgnoredPart) 
                t = nn.endToken;
            let org0 = Utils.as(t.next.getReferent(), OrganizationReferent);
            if (org0 !== null) {
                if (!OrgItemTypeToken.isTypesAntagonisticOO(_org, org0) && t.next.next !== null) {
                    if (BracketHelper.canBeEndOfSequence(t.next.next, false, null, false)) {
                        org0.mergeSlots(_org, false);
                        return new ReferentToken(org0, t0, t.next.next);
                    }
                    if ((t.next.next.getReferent() instanceof OrganizationReferent) && BracketHelper.canBeEndOfSequence(t.next.next.next, false, null, false)) {
                        org0.mergeSlots(_org, false);
                        return new ReferentToken(org0, t0, t.next);
                    }
                }
                return null;
            }
            let na0 = OrgItemNameToken.tryAttach(br.beginToken.next, null, false, true);
            if (na0 !== null && na0.isEmptyWord && na0.endToken.next === br.endToken) 
                return null;
            let rt0 = OrganizationAnalyzer.tryAttachOrg(t.next, attachTyp, null, isAdditionalAttach, -1);
            if (br.internal.length > 1) {
                if (rt0 !== null && BracketHelper.canBeEndOfSequence(rt0.endToken, false, null, false)) 
                    br.endToken = rt0.endToken;
                else 
                    return null;
            }
            let abbr = null;
            let tt00 = (rt0 === null ? null : rt0.beginToken);
            if (((rt0 === null && t.next !== null && (t.next instanceof TextToken)) && t.next.chars.isAllUpper && t.next.lengthChar > 2) && t.next.chars.isCyrillicLetter) {
                rt0 = OrganizationAnalyzer.tryAttachOrg(t.next.next, attachTyp, null, isAdditionalAttach, -1);
                if (rt0 !== null && rt0.beginToken === t.next.next) {
                    tt00 = t.next;
                    abbr = t.next.getSourceText();
                }
                else 
                    rt0 = null;
            }
            let ok2 = false;
            if (rt0 !== null) {
                if (rt0.endToken === br.endToken.previous || rt0.endToken === br.endToken) 
                    ok2 = true;
                else if (BracketHelper.canBeEndOfSequence(rt0.endToken, false, null, false) && rt0.endChar > br.endChar) {
                    let br2 = BracketHelper.tryParse(br.endToken.next, BracketParseAttr.NO, 100);
                    if (br2 !== null && rt0.endToken === br2.endToken) 
                        ok2 = true;
                }
            }
            if (ok2 && (rt0.referent instanceof OrganizationReferent)) {
                org0 = Utils.as(rt0.referent, OrganizationReferent);
                if (typ !== null && typ.typ === "служба" && ((org0.kind === OrganizationKind.MEDIA || org0.kind === OrganizationKind.PRESS))) {
                    if (br.beginToken === rt0.beginToken && br.endToken === rt0.endToken) 
                        return rt0;
                }
                let typ1 = null;
                if (tt00 !== t.next) {
                    typ1 = OrgItemTypeToken.tryAttach(t.next, false);
                    if (typ1 !== null && typ1.endToken.next === tt00) 
                        _org.addType(typ1, false);
                }
                let hi = false;
                if (OrgOwnershipHelper.canBeHigher(org0, _org, true)) {
                    if (OrgItemTypeToken.isTypesAntagonisticOO(org0, _org)) 
                        hi = true;
                }
                if (hi) {
                    _org.higher = org0;
                    rt0.setDefaultLocalOnto(t.kit.processor);
                    _org.addExtReferent(rt0);
                    if (typ1 !== null) 
                        _org.addType(typ1, true);
                    if (abbr !== null) 
                        _org.addName(abbr, true, null);
                }
                else if (!OrgItemTypeToken.isTypesAntagonisticOO(org0, _org)) {
                    _org.mergeSlots(org0, true);
                    if (abbr !== null) {
                        for (const s of _org.slots) {
                            if (s.typeName === OrganizationReferent.ATTR_NAME) 
                                _org.uploadSlot(s, (abbr + " " + s.value));
                        }
                    }
                }
                else 
                    rt0 = null;
                if (rt0 !== null) {
                    let t11 = br.endToken;
                    if (rt0.endChar > t11.endChar) 
                        t11 = rt0.endToken;
                    let ep11 = OrgItemEponymToken.tryAttach(t11.next, true);
                    if (ep11 !== null) {
                        t11 = ep11.endToken;
                        for (const e of ep11.eponyms) {
                            _org.addEponym(e);
                        }
                    }
                    t1 = OrganizationAnalyzer.attachTailAttributes(_org, t11.next, true, attachTyp, false);
                    if (t1 === null) 
                        t1 = t11;
                    if (typ !== null) {
                        if ((typ.name !== null && typ.geo === null && _org.names.length > 0) && !_org.names.includes(typ.name)) 
                            _org.addTypeStr(typ.name.toLowerCase());
                    }
                    return new ReferentToken(_org, t0, t1);
                }
            }
            if (rt0 !== null && (rt0.endChar < br.endToken.previous.endChar)) {
                let rt1 = OrganizationAnalyzer.tryAttachOrg(rt0.endToken.next, attachTyp, null, isAdditionalAttach, -1);
                if (rt1 !== null && rt1.endToken.next === br.endToken) 
                    return rt1;
                let org1 = Utils.as(rt0.endToken.next.getReferent(), OrganizationReferent);
                if (org1 !== null && br.endToken.previous === rt0.endToken) {
                }
            }
            for (let step = 0; step < 2; step++) {
                let tt0 = t.next;
                let tt1 = null;
                let pref = true;
                let notEmpty = 0;
                for (t1 = t.next; t1 !== null && t1 !== br.endToken; t1 = t1.next) {
                    if (t1.isChar('(')) {
                        if (notEmpty === 0) 
                            break;
                        let r = null;
                        if (t1.next !== null) 
                            r = t1.next.getReferent();
                        if (r !== null && t1.next.next !== null && t1.next.next.isChar(')')) {
                            if (r.typeName === OrganizationAnalyzer.gEONAME) {
                                _org.addGeoObject(r);
                                break;
                            }
                        }
                        let rt = OrganizationAnalyzer.tryAttachOrg(t1.next, OrganizationAnalyzerAttachType.HIGH, null, false, -1);
                        if (rt !== null && rt.endToken.next !== null && rt.endToken.next.isChar(')')) {
                            if (!OrganizationReferent.canBeSecondDefinition(_org, Utils.as(rt.referent, OrganizationReferent))) 
                                break;
                            _org.mergeSlots(rt.referent, false);
                        }
                        break;
                    }
                    else if ((((org0 = Utils.as(t1.getReferent(), OrganizationReferent)))) !== null) {
                        if (((t1.previous instanceof NumberToken) && t1.previous.previous === br.beginToken && !OrgItemTypeToken.isTypesAntagonisticOO(_org, org0)) && org0.number === null) {
                            org0.number = t1.previous.value.toString();
                            org0.mergeSlots(_org, false);
                            if (BracketHelper.canBeEndOfSequence(t1.next, false, null, false)) 
                                t1 = t1.next;
                            return new ReferentToken(org0, t0, t1);
                        }
                        let ne = OrgItemNameToken.tryAttach(br.beginToken.next, null, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, true);
                        if (ne !== null && ne.isIgnoredPart && ne.endToken.next === t1) {
                            org0.mergeSlots(_org, false);
                            if (BracketHelper.canBeEndOfSequence(t1.next, false, null, false)) 
                                t1 = t1.next;
                            return new ReferentToken(org0, t0, t1);
                        }
                        return null;
                    }
                    else {
                        typ = OrgItemTypeToken.tryAttach(t1, false);
                        if (typ !== null && types !== null) {
                            for (const ty of types) {
                                if (OrgItemTypeToken.isTypesAntagonisticTT(ty, typ)) {
                                    typ = null;
                                    break;
                                }
                            }
                        }
                        if (typ !== null) {
                            if (typ.isDoubtRootWord && ((typ.endToken.next === br.endToken || ((typ.endToken.next !== null && typ.endToken.next.isHiphen))))) 
                                typ = null;
                            else if (typ.morph.number === MorphNumber.PLURAL) 
                                typ = null;
                            else if (!typ.morph._case.isUndefined && !typ.morph._case.isNominative) 
                                typ = null;
                            else if (typ.typ === "управление") 
                                typ = null;
                            else if (typ.beginToken === typ.endToken) {
                                let ttt = typ.endToken.next;
                                if (ttt !== null && ttt.isHiphen) 
                                    ttt = ttt.next;
                                if (ttt !== null) {
                                    if (ttt.isValue("БАНК", null)) 
                                        typ = null;
                                }
                            }
                        }
                        let ep = null;
                        if (typ === null) 
                            ep = OrgItemEponymToken.tryAttach(t1, false);
                        let nu = OrgItemNumberToken.tryAttach(t1, false, null);
                        if (nu !== null && !(t1 instanceof NumberToken)) {
                            _org.number = nu.number;
                            tt1 = t1.previous;
                            t1 = nu.endToken;
                            notEmpty += 2;
                            continue;
                        }
                        let brSpec = false;
                        if ((br.internal.length === 0 && (br.endToken.next instanceof TextToken) && ((!br.endToken.next.chars.isAllLower && br.endToken.next.chars.isLetter))) && BracketHelper.canBeEndOfSequence(br.endToken.next.next, true, null, false)) 
                            brSpec = true;
                        if (typ !== null && ((pref || !typ.isDep))) {
                            if (notEmpty > 1) {
                                let rrr = OrganizationAnalyzer.tryAttachOrg(typ.beginToken, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
                                if (rrr !== null) {
                                    br.endToken = (t1 = typ.beginToken.previous);
                                    break;
                                }
                            }
                            if (((attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY || attachTyp === OrganizationAnalyzerAttachType.HIGH)) && ((typ.root === null || !typ.root.isPurePrefix))) 
                                pref = false;
                            else if (typ.name === null) {
                                _org.addType(typ, false);
                                if (pref) 
                                    tt0 = typ.endToken.next;
                                else if (typ.root !== null && typ.root.isPurePrefix) {
                                    tt1 = typ.beginToken.previous;
                                    break;
                                }
                            }
                            else if (typ.endToken.next !== br.endToken) {
                                _org.addType(typ, false);
                                if (typ.typ === "банк") 
                                    pref = false;
                                else {
                                    _org.addTypeStr(typ.name.toLowerCase());
                                    _org.addTypeStr(typ.altTyp);
                                    if (pref) 
                                        tt0 = typ.endToken.next;
                                }
                            }
                            else if (brSpec) {
                                _org.addType(typ, false);
                                _org.addTypeStr(typ.name.toLowerCase());
                                notEmpty += 2;
                                tt0 = br.endToken.next;
                                t1 = tt0.next;
                                br.endToken = t1;
                                break;
                            }
                            if (typ !== multTyp) {
                                t1 = typ.endToken;
                                if (typ.geo !== null) 
                                    _org.addType(typ, false);
                            }
                        }
                        else if (ep !== null) {
                            for (const e of ep.eponyms) {
                                _org.addEponym(e);
                            }
                            notEmpty += 3;
                            t1 = ep.beginToken.previous;
                            break;
                        }
                        else if (t1 === t.next && (t1 instanceof TextToken) && t1.chars.isAllLower) 
                            return null;
                        else if (t1.chars.isLetter || (t1 instanceof NumberToken)) {
                            if (brSpec) {
                                tt0 = br.beginToken;
                                t1 = br.endToken.next.next;
                                let ss = MiscHelper.getTextValue(br.endToken, t1, GetTextAttr.NO);
                                if (!Utils.isNullOrEmpty(ss)) {
                                    _org.addName(ss, true, br.endToken.next);
                                    br.endToken = t1;
                                }
                                break;
                            }
                            pref = false;
                            notEmpty++;
                        }
                    }
                }
                let canHasNum = false;
                let canHasLatinName = false;
                if (types !== null) {
                    for (const ty of types) {
                        if (ty.root !== null) {
                            if (ty.root.canHasNumber) 
                                canHasNum = true;
                            if (ty.root.canHasLatinName) 
                                canHasLatinName = true;
                        }
                    }
                }
                te = (tt1 != null ? tt1 : t1);
                if (te !== null && tt0 !== null && (tt0.beginChar < te.beginChar)) {
                    for (let ttt = tt0; ttt !== te && ttt !== null; ttt = ttt.next) {
                        let oin = OrgItemNameToken.tryAttach(ttt, null, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, ttt === tt0);
                        if (oin !== null) {
                            if (oin.isIgnoredPart && ttt === tt0) {
                                tt0 = oin.endToken.next;
                                if (tt0 === null) 
                                    break;
                                ttt = tt0.previous;
                                continue;
                            }
                            if (oin.isStdTail) {
                                let ei = OrgItemEngItem.tryAttach(oin.beginToken, false);
                                if (ei === null && oin.beginToken.isComma) 
                                    ei = OrgItemEngItem.tryAttach(oin.beginToken.next, false);
                                if (ei !== null) {
                                    _org.addTypeStr(ei.fullValue);
                                    if (ei.shortValue !== null) 
                                        _org.addTypeStr(ei.shortValue);
                                }
                                te = ttt.previous;
                                break;
                            }
                        }
                        if ((ttt !== tt0 && (ttt instanceof ReferentToken) && ttt.next === te) && (ttt.getReferent() instanceof GeoReferent)) {
                            if (ttt.previous !== null && ttt.previous.getMorphClassInDictionary().isAdjective) 
                                continue;
                            let npt = NounPhraseHelper.tryParse(ttt.previous, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null);
                            if (npt !== null && npt.endToken === ttt) {
                            }
                            else {
                                te = ttt.previous;
                                if (te.morph._class.isPreposition && te.previous !== null) 
                                    te = te.previous;
                            }
                            _org.addGeoObject(ttt.getReferent());
                            break;
                        }
                    }
                }
                if (te !== null && tt0 !== null && (tt0.beginChar < te.beginChar)) {
                    if ((te.previous instanceof NumberToken) && canHasNum) {
                        let err = false;
                        let num1 = Utils.as(te.previous, NumberToken);
                        if (_org.number !== null && _org.number !== num1.value.toString()) 
                            err = true;
                        else if (te.previous.previous === null) 
                            err = true;
                        else if (!te.previous.previous.isHiphen && !te.previous.previous.chars.isLetter) 
                            err = true;
                        else if (num1.value === "0") 
                            err = true;
                        if (!err) {
                            _org.number = num1.value.toString();
                            te = te.previous.previous;
                            if (te !== null && ((te.isHiphen || te.isValue("N", null) || te.isValue("№", null)))) 
                                te = te.previous;
                        }
                    }
                }
                let s = (te === null ? null : MiscHelper.getTextValue(tt0, te, GetTextAttr.NO));
                let s1 = (te === null ? null : MiscHelper.getTextValue(tt0, te, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE));
                if ((te !== null && (te.previous instanceof NumberToken) && canHasNum) && _org.number === null) {
                    _org.number = te.previous.value.toString();
                    let tt11 = te.previous;
                    if (tt11.previous !== null && tt11.previous.isHiphen) 
                        tt11 = tt11.previous;
                    if (tt11.previous !== null) {
                        s = MiscHelper.getTextValue(tt0, tt11.previous, GetTextAttr.NO);
                        s1 = MiscHelper.getTextValue(tt0, tt11.previous, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                    }
                }
                if (!Utils.isNullOrEmpty(s)) {
                    if (tt0.morph._class.isPreposition && tt0 !== br.beginToken.next) {
                        for (const ty of _org.types) {
                            if (!ty.includes(" ") && Utils.isLowerCase(ty[0])) {
                                s = (ty.toUpperCase() + " " + s);
                                s1 = null;
                                break;
                            }
                        }
                    }
                    if (s.length > OrganizationAnalyzer.maxOrgName) 
                        return null;
                    if (s1 !== null && s1 !== s && s1.length <= s.length) 
                        _org.addName(s1, true, null);
                    _org.addName(s, true, tt0);
                    typ = OrganizationAnalyzer._lastTyp(types);
                    if (typ !== null && typ.root !== null && typ.root.canonicText.startsWith("ИНДИВИДУАЛЬН")) {
                        let pers = typ.kit.processReferent("PERSON", tt0, null);
                        if (pers !== null && pers.endToken.next === te) {
                            _org.addExtReferent(pers);
                            _org.addSlot(OrganizationReferent.ATTR_OWNER, pers.referent, false, 0);
                        }
                    }
                    let ok1 = false;
                    for (const c of s) {
                        if (Utils.isLetterOrDigit(c)) {
                            ok1 = true;
                            break;
                        }
                    }
                    if (!ok1) 
                        return null;
                    if (br.beginToken.next.chars.isAllLower) 
                        return null;
                    if (_org.types.length === 0) {
                        let ty = OrganizationAnalyzer._lastTyp(types);
                        if (ty !== null && ty.coef >= 4) {
                        }
                        else {
                            if (attachTyp === OrganizationAnalyzerAttachType.NORMAL) 
                                return null;
                            if (_org.names.length === 1 && (_org.names[0].length < 2) && (br.lengthChar < 5)) 
                                return null;
                        }
                    }
                }
                else if (BracketHelper.canBeStartOfSequence(t1, false, false)) {
                    let br1 = BracketHelper.tryParse(t1, BracketParseAttr.NO, 100);
                    if (br1 === null) 
                        break;
                    t = br1.beginToken;
                    br = br1;
                    continue;
                }
                else if (((_org.number !== null || _org.eponyms.length > 0)) && t1 === br.endToken) {
                }
                else if (_org.geoObjects.length > 0 && _org.types.length > 2) {
                }
                else 
                    return null;
                t1 = br.endToken;
                if (_org.number === null && t1.next !== null && (t1.whitespacesAfterCount < 2)) {
                    let num1 = (OrgItemTypeToken.isDecreeKeyword(t0.previous, 1) ? null : OrgItemNumberToken.tryAttach(t1.next, false, typ));
                    if (num1 !== null) {
                        _org.number = num1.number;
                        t1 = num1.endToken;
                    }
                    else 
                        t1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                }
                else 
                    t1 = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                if (t1 === null) 
                    t1 = br.endToken;
                let ok0 = false;
                if (types !== null) {
                    for (const ty of types) {
                        if (ty.name !== null) 
                            _org.addTypeStr(ty.name.toLowerCase());
                        if (attachTyp !== OrganizationAnalyzerAttachType.MULTIPLE && (ty.beginChar < t0.beginChar) && !ty.isNotTyp) 
                            t0 = ty.beginToken;
                        if (!ty.isDoubtRootWord || ty.coef > 0 || ty.geo !== null) 
                            ok0 = true;
                        else if (ty.typ === "движение" && ((!br.beginToken.next.chars.isAllLower || !ty.chars.isAllLower))) {
                            if (!br.beginToken.next.morph._case.isGenitive) 
                                ok0 = true;
                        }
                        else if (ty.typ === "АО") {
                            if (ty.beginToken.chars.isAllUpper && (ty.whitespacesAfterCount < 2) && BracketHelper.isBracket(ty.endToken.next, true)) 
                                ok0 = true;
                            else 
                                for (let tt2 = t1.next; tt2 !== null; tt2 = tt2.next) {
                                    if (tt2.isComma) 
                                        continue;
                                    if (tt2.isValue("ИМЕНОВАТЬ", null)) 
                                        ok0 = true;
                                    if (tt2.isValue("В", null) && tt2.next !== null) {
                                        if (tt2.next.isValue("ЛИЦО", null) || tt2.next.isValue("ДАЛЬШЕЙШЕМ", null) || tt2.next.isValue("ДАЛЕЕ", null)) 
                                            ok0 = true;
                                    }
                                    break;
                                }
                        }
                    }
                }
                if (_org.eponyms.length === 0 && (t1.whitespacesAfterCount < 2)) {
                    let ep = OrgItemEponymToken.tryAttach(t1.next, false);
                    if (ep !== null) {
                        for (const e of ep.eponyms) {
                            _org.addEponym(e);
                        }
                        ok0 = true;
                        t1 = ep.endToken;
                    }
                }
                if (_org.names.length === 0) {
                    s = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                    s1 = (te === null ? null : MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE));
                    _org.addName(s, true, br.beginToken.next);
                    _org.addName(s1, true, null);
                }
                if (!ok0) {
                    if (OrgItemTypeToken.checkOrgSpecialWordBefore(t0.previous)) 
                        ok0 = true;
                }
                if (!ok0 && attachTyp !== OrganizationAnalyzerAttachType.NORMAL) 
                    ok0 = true;
                typ = OrganizationAnalyzer._lastTyp(types);
                if (typ !== null && typ.beginToken !== typ.endToken) 
                    ok0 = true;
                if (ok0) 
                    return new ReferentToken(_org, t0, t1);
                else 
                    return ReferentToken._new1094(_org, t0, t1, _org);
            }
        }
        let num = null;
        let _num = null;
        let epon = null;
        let _epon = null;
        let names = null;
        let pr = null;
        let ownOrg = null;
        if (t1 === null) 
            t1 = t0;
        else if (t !== null && t.previous !== null && t.previous.beginChar >= t0.beginChar) 
            t1 = t.previous;
        br = null;
        let ok = false;
        for (; t !== null; t = t.next) {
            if (t.getReferent() instanceof OrganizationReferent) {
            }
            let rt = null;
            if ((((rt = OrganizationAnalyzer.attachGlobalOrg(t, attachTyp, null)))) !== null) {
                if (t === t0) {
                    if (!t.chars.isAllLower) 
                        return rt;
                    return null;
                }
                rt = OrganizationAnalyzer.tryAttachOrg(t, attachTyp, multTyp, isAdditionalAttach, -1);
                if (rt !== null) 
                    return rt;
            }
            if ((((_num = OrgItemNumberToken.tryAttach(t, typ !== null && typ.root !== null && typ.root.canHasNumber, typ)))) !== null) {
                if ((typ === null || typ.root === null || !typ.root.canHasNumber) || num !== null) 
                    break;
                if (t.whitespacesBeforeCount > 2) {
                    if (typ.endToken.next === t && MiscHelper.checkNumberPrefix(t) !== null) {
                    }
                    else 
                        break;
                }
                if (typ.root.canonicText === "СУД" && typ.name !== null) {
                    if ((((typ.name.startsWith("ВЕРХОВНЫЙ") || typ.name.startsWith("АРБИТРАЖНЫЙ") || typ.name.startsWith("ВЫСШИЙ")) || typ.name.startsWith("КОНСТИТУЦИОН") || typ.name.startsWith("ВЕРХОВНИЙ")) || typ.name.startsWith("АРБІТРАЖНИЙ") || typ.name.startsWith("ВИЩИЙ")) || typ.name.startsWith("КОНСТИТУЦІЙН")) {
                        typ.coef = 3;
                        break;
                    }
                }
                num = _num;
                t1 = (t = num.endToken);
                continue;
            }
            if ((((_epon = OrgItemEponymToken.tryAttach(t, false)))) !== null) {
                epon = _epon;
                t1 = (t = epon.endToken);
                continue;
            }
            if ((((typ = OrgItemTypeToken.tryAttach(t, false)))) !== null) {
                if (typ.morph._case.isGenitive) {
                    if (typ.endToken.isValue("СЛУЖБА", null) || typ.endToken.isValue("УПРАВЛЕНИЕ", "УПРАВЛІННЯ") || typ.endToken.isValue("ХОЗЯЙСТВО", null)) 
                        typ = null;
                }
                if (typ !== null) {
                    if (!typ.isDoubtRootWord && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) 
                        break;
                    if (types === null && t0 === t) 
                        break;
                    if (OrganizationAnalyzer._lastTyp(types) !== null && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                        if (OrgItemTypeToken.isTypesAntagonisticTT(typ, OrganizationAnalyzer._lastTyp(types))) {
                            if (names !== null && ((typ.morph._case.isGenitive || typ.morph._case.isInstrumental)) && (t.whitespacesBeforeCount < 2)) {
                            }
                            else 
                                break;
                        }
                    }
                }
            }
            if ((((br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100)))) !== null) {
                if (ownOrg !== null && !ownOrg.referent.isFromGlobalOntos) 
                    break;
                if (t.isNewlineBefore && ((attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP))) 
                    break;
                typ = OrganizationAnalyzer._lastTyp(types);
                if ((_org.findSlot(OrganizationReferent.ATTR_TYPE, "организация", true) !== null || _org.findSlot(OrganizationReferent.ATTR_TYPE, "движение", true) !== null || _org.findSlot(OrganizationReferent.ATTR_TYPE, "організація", true) !== null) || _org.findSlot(OrganizationReferent.ATTR_TYPE, "рух", true) !== null) {
                    if (((typ === null || (typ.coef < 2))) && !specWordBefore) 
                        return null;
                }
                if (br.isQuoteType) {
                    if (br.openChar === '<' || br.whitespacesBeforeCount > 1) 
                        break;
                    rt = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.HIGH, null, false, -1);
                    if (rt === null) 
                        break;
                    let org0 = Utils.as(rt.referent, OrganizationReferent);
                    if (names !== null && names.length === 1) {
                        if (((!names[0].isNounPhrase && names[0].chars.isAllUpper)) || org0.names.length > 0) {
                            if (!names[0].beginToken.morph._class.isPreposition) {
                                if (org0.names.length === 0) 
                                    _org.addTypeStr(names[0].value);
                                else if (org0.names.length < 6) {
                                    for (const n of org0.names) {
                                        _org.addName((names[0].value + " " + n), true, null);
                                        if (typ !== null && typ.root !== null && typ.root.typ !== OrgItemTypeTyp.PREFIX) 
                                            _org.addName((typ.typ.toUpperCase() + " " + MiscHelper.getTextValueOfMetaToken(names[0], GetTextAttr.NO) + " " + n), true, null);
                                    }
                                    if (typ !== null) 
                                        typ.coef = 4;
                                }
                                names = null;
                            }
                        }
                    }
                    if (names !== null && names.length > 0 && !specWordBefore) 
                        break;
                    if (!_org.canBeEquals(org0, ReferentsEqualType.FORMERGING)) 
                        break;
                    _org.mergeSlots(org0, true);
                    t1 = (tMax = (t = rt.endToken));
                    ok = true;
                    continue;
                }
                else if (br.openChar === '(') {
                    if (t.next.getReferent() !== null && t.next.next === br.endToken) {
                        let r = t.next.getReferent();
                        if (r.typeName === OrganizationAnalyzer.gEONAME) {
                            _org.addGeoObject(r);
                            tMax = (t1 = (t = br.endToken));
                            continue;
                        }
                    }
                    else if (((t.next instanceof TextToken) && t.next.chars.isLetter && !t.next.chars.isAllLower) && t.next.next === br.endToken) {
                        typ = OrgItemTypeToken.tryAttach(t.next, true);
                        if (typ !== null) {
                            let or0 = new OrganizationReferent();
                            or0.addType(typ, false);
                            if (or0.kind !== OrganizationKind.UNDEFINED && _org.kind !== OrganizationKind.UNDEFINED) {
                                if (_org.kind !== or0.kind) 
                                    break;
                            }
                            if (MiscHelper.testAcronym(t.next, t0, t.previous)) 
                                _org.addName(t.next.getSourceText(), true, null);
                            else 
                                _org.addType(typ, false);
                            t1 = (t = (tMax = br.endToken));
                            continue;
                        }
                        else {
                            let nam = OrgItemNameToken.tryAttach(t.next, null, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, true);
                            if (nam !== null && nam.isEmptyWord) 
                                break;
                            if (attachTyp === OrganizationAnalyzerAttachType.NORMAL) {
                                let org0 = new OrganizationReferent();
                                org0.addName(t.next.term, true, t.next);
                                if (!OrganizationReferent.canBeSecondDefinition(_org, org0)) 
                                    break;
                            }
                            _org.addName(t.next.term, true, t.next);
                            tMax = (t1 = (t = br.endToken));
                            continue;
                        }
                    }
                }
                break;
            }
            if (ownOrg !== null) {
                if (names === null && t.isValue("ПО", null)) {
                }
                else if (names !== null && t.isCommaAnd) {
                }
                else 
                    break;
            }
            typ = OrganizationAnalyzer._lastTyp(types);
            if (typ !== null && typ.root !== null && typ.root.isPurePrefix) {
                if (pr === null && names === null) {
                    pr = new OrgItemNameToken(t, t);
                    pr.morph._case = MorphCase.NOMINATIVE;
                }
            }
            let na = OrgItemNameToken.tryAttach(t, pr, attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY, names === null);
            if (na === null && t !== null) {
                if (_org.kind === OrganizationKind.CHURCH || ((typ !== null && typ.typ !== null && typ.typ.includes("фермер")))) {
                    let prt = t.kit.processReferent("PERSON", t, null);
                    if (prt !== null) {
                        na = OrgItemNameToken._new2428(t, prt.endToken, true);
                        na.value = MiscHelper.getTextValueOfMetaToken(na, GetTextAttr.NO);
                        na.chars = CharsInfo._new2429(true);
                        na.morph = prt.morph;
                        let sur = prt.referent.getStringValue("LASTNAME");
                        if (sur !== null) {
                            for (let tt = t; tt !== null && tt.endChar <= prt.endChar; tt = tt.next) {
                                if (tt.isValue(sur, null)) {
                                    na.value = MiscHelper.getTextValue(tt, tt, GetTextAttr.NO);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (na === null) {
                if (attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                    if (t.isChar(',') || t.isAnd) 
                        continue;
                }
                if (t.getReferent() instanceof OrganizationReferent) {
                    ownOrg = Utils.as(t, ReferentToken);
                    continue;
                }
                if (t.isValue("ПРИ", null) && (t.next instanceof ReferentToken) && (t.next.getReferent() instanceof OrganizationReferent)) {
                    t = t.next;
                    ownOrg = Utils.as(t, ReferentToken);
                    continue;
                }
                if ((((names === null && t.isChar('/') && (t.next instanceof TextToken)) && !t.isWhitespaceAfter && t.next.chars.isAllUpper) && t.next.lengthChar >= 3 && (t.next.next instanceof TextToken)) && !t.next.isWhitespaceAfter && t.next.next.isChar('/')) 
                    na = OrgItemNameToken._new2430(t, t.next.next, t.next.getSourceText().toUpperCase(), t.next.chars);
                else if (names === null && typ !== null && ((typ.typ === "движение" || _org.kind === OrganizationKind.PARTY))) {
                    let tt1 = null;
                    if (t.isValue("ЗА", null) || t.isValue("ПРОТИВ", null)) 
                        tt1 = t.next;
                    else if (t.isValue("В", null) && t.next !== null) {
                        if (t.next.isValue("ЗАЩИТА", null) || t.next.isValue("ПОДДЕРЖКА", null)) 
                            tt1 = t.next;
                    }
                    else if (typ.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(typ.beginToken)) {
                        let mc = t.getMorphClassInDictionary();
                        if ((mc.isAdverb || mc.isPronoun || mc.isPersonalPronoun) || mc.isVerb || mc.isConjunction) {
                        }
                        else if (t.chars.isLetter) 
                            tt1 = t;
                        else if (typ.beginToken !== typ.endToken) 
                            typ.coef = typ.coef + (3);
                    }
                    if (tt1 !== null) {
                        na = OrgItemNameToken.tryAttach(tt1, pr, true, false);
                        if (na !== null) {
                            na.beginToken = t;
                            typ.coef = typ.coef + (3);
                        }
                    }
                }
                if (na === null) 
                    break;
            }
            if (num !== null || epon !== null) 
                break;
            if (attachTyp === OrganizationAnalyzerAttachType.MULTIPLE || attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
                if (!na.isStdTail && !na.chars.isLatinLetter && na.stdOrgNameNouns === 0) {
                    if (t.morph._class.isProperName && !t.chars.isAllUpper) 
                        break;
                    let cla = t.getMorphClassInDictionary();
                    if (cla.isProperSurname || ((t.morph.language.isUa && t.morph._class.isProperSurname))) {
                        if (names === null && ((_org.kind === OrganizationKind.AIRPORT || _org.kind === OrganizationKind.SEAPORT))) {
                        }
                        else if (typ !== null && typ.root !== null && typ.root.acronym === "ФОП") {
                        }
                        else if (typ !== null && typ.typ.includes("фермер")) {
                        }
                        else 
                            break;
                    }
                    if (cla.isUndefined && na.chars.isCyrillicLetter && na.chars.isCapitalUpper) {
                        if ((t.previous !== null && !t.previous.morph._class.isPreposition && !t.previous.morph._class.isConjunction) && t.previous.chars.isAllLower) {
                            if ((t.next !== null && (t.next instanceof TextToken) && t.next.chars.isLetter) && !t.next.chars.isAllLower) 
                                break;
                        }
                    }
                    if (typ !== null && typ.typ === "союз" && !t.morph._case.isGenitive) 
                        break;
                    let pit = t.kit.processReferent("PERSONPROPERTY", t, null);
                    if (pit !== null) {
                        if (pit.morph.number === MorphNumber.SINGULAR && pit.beginToken !== pit.endToken) {
                            if (typ !== null && typ.typ === "служба" && pit.morph._case.isGenitive) {
                            }
                            else 
                                break;
                        }
                    }
                    pit = t.kit.processReferent("DECREE", t, null);
                    if (pit !== null) {
                        let nptt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                        if (nptt !== null && nptt.endToken.isValue("РЕШЕНИЕ", null)) {
                        }
                        else 
                            break;
                    }
                    pit = t.kit.processReferent("NAMEDENTITY", t, null);
                    if (pit !== null && pit.endToken !== t) 
                        break;
                    if (t.isValue("АО", null)) 
                        break;
                    if (t.newlinesBeforeCount > 1) 
                        break;
                }
            }
            if (t.isValue("ИМЕНИ", "ІМЕНІ") || t.isValue("ИМ", "ІМ")) 
                break;
            pr = na;
            if (attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                if (names === null) 
                    names = new Array();
                names.push(na);
                t1 = (t = na.endToken);
                continue;
            }
            if (names === null) {
                if (tMax !== null) 
                    break;
                if (t.previous !== null && t.isNewlineBefore && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                    if (typ !== null && typ.endToken.next === t && ((typ.isNewlineBefore || BracketHelper.canBeStartOfSequence(typ.beginToken.previous, false, false)))) {
                    }
                    else {
                        if (t.newlinesAfterCount > 1 || !t.chars.isAllLower) 
                            break;
                        if (t.newlinesBeforeCount > 1) 
                            break;
                        if (t.morph._class.isPreposition && typ !== null && (((typ.typ === "комитет" || typ.typ === "комиссия" || typ.typ === "комітет") || typ.typ === "комісія"))) {
                        }
                        else if (na.stdOrgNameNouns > 0) {
                        }
                        else 
                            break;
                    }
                }
                else if (t.previous !== null && t.whitespacesBeforeCount > 1 && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                    if (t.whitespacesBeforeCount > 10) 
                        break;
                    if (!t.chars.equals(t.previous.chars)) 
                        break;
                }
                if (t.chars.isAllLower && _org.kind === OrganizationKind.JUSTICE) {
                    if (t.isValue("ПО", null) && t.next !== null && t.next.isValue("ПРАВО", null)) {
                    }
                    else if (t.isValue("З", null) && t.next !== null && t.next.isValue("ПРАВ", null)) {
                    }
                    else 
                        break;
                }
                if (_org.kind === OrganizationKind.FEDERATION) {
                    if (t.morph._class.isPreposition || t.morph._class.isConjunction) 
                        break;
                }
                if (t.chars.isAllLower && ((_org.kind === OrganizationKind.AIRPORT || _org.kind === OrganizationKind.SEAPORT || _org.kind === OrganizationKind.HOTEL))) 
                    break;
                if ((typ !== null && typ.lengthChar === 2 && ((typ.typ === "АО" || typ.typ === "СП"))) && !specWordBefore && attachTyp === OrganizationAnalyzerAttachType.NORMAL) {
                    if (!na.chars.isLatinLetter) 
                        break;
                }
                if (t.chars.isLatinLetter && typ !== null && LanguageHelper.endsWithEx(typ.typ, "служба", "сервис", "сервіс", null)) 
                    break;
                if (typ !== null && ((typ.root === null || !typ.root.isPurePrefix))) {
                    if (typ.chars.isLatinLetter && na.chars.isLatinLetter) {
                        if (!t.isValue("OF", null)) 
                            break;
                    }
                    if ((na.isInDictionary && na.morph.language.isCyrillic && na.chars.isAllLower) && !na.morph._case.isUndefined) {
                        if (na.preposition === null) {
                            if (!na.morph._case.isGenitive) 
                                break;
                            if (_org.kind === OrganizationKind.PARTY && !specWordBefore) {
                                if (typ.typ === "лига") {
                                }
                                else 
                                    break;
                            }
                            if (na.morph.number !== MorphNumber.PLURAL) {
                                let prr = t.kit.processReferent("PERSONPROPERTY", t, null);
                                if (prr !== null) {
                                    if (OrgItemEponymToken.tryAttach(na.endToken.next, false) !== null) {
                                    }
                                    else if (typ !== null && typ.typ === "служба") 
                                        typ.coef = typ.coef + (3);
                                    else 
                                        break;
                                }
                            }
                        }
                    }
                    if (na.preposition !== null) {
                        if (_org.kind === OrganizationKind.PARTY) {
                            if (na.preposition === "ЗА" || na.preposition === "ПРОТИВ") {
                            }
                            else if (na.preposition === "В") {
                                if (na.value.startsWith("ЗАЩИТ") && na.value.startsWith("ПОДДЕРЖ")) {
                                }
                                else 
                                    break;
                            }
                            else 
                                break;
                        }
                        else {
                            if (na.preposition === "В") 
                                break;
                            if (typ.isDoubtRootWord) {
                                if (LanguageHelper.endsWithEx(typ.typ, "комитет", "комиссия", "комітет", "комісія") && ((t.isValue("ПО", null) || t.isValue("З", null)))) {
                                }
                                else if (names === null && na.stdOrgNameNouns > 0) {
                                }
                                else 
                                    break;
                            }
                        }
                    }
                    else if (na.chars.isCapitalUpper && na.chars.isCyrillicLetter) {
                        let prt = na.kit.processReferent("PERSON", na.beginToken, null);
                        if (prt !== null) {
                            if (_org.kind === OrganizationKind.CHURCH) {
                                na.endToken = prt.endToken;
                                na.isStdName = true;
                                na.value = MiscHelper.getTextValueOfMetaToken(na, GetTextAttr.NO);
                            }
                            else if ((typ !== null && typ.typ !== null && typ.typ.includes("фермер")) && names === null) 
                                na.endToken = prt.endToken;
                            else 
                                break;
                        }
                    }
                }
                if (na.isEmptyWord) 
                    break;
                if (na.isStdTail) {
                    if (na.chars.isLatinLetter && na.chars.isAllUpper && (na.lengthChar < 4)) {
                        na.isStdTail = false;
                        na.value = na.getSourceText().toUpperCase();
                    }
                    else 
                        break;
                }
                names = new Array();
            }
            else {
                let na0 = names[names.length - 1];
                if (na0.isStdTail) 
                    break;
                if (na.preposition === null) {
                    if ((!na.chars.isLatinLetter && na.chars.isAllLower && !na.isAfterConjunction) && !na.morph._case.isGenitive) 
                        break;
                }
            }
            names.push(na);
            t1 = (t = na.endToken);
        }
        typ = OrganizationAnalyzer._lastTyp(types);
        let doHigherAlways = false;
        if (typ !== null) {
            if (((attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP)) && typ.morph.number === MorphNumber.PLURAL) {
                if (names !== null && names.length > 0 && names[names.length - 1].isNewlineAfter) {
                }
                else if (num !== null && num.isNewlineAfter) {
                }
                else 
                    return null;
            }
            if (LanguageHelper.endsWithEx(typ.typ, "комитет", "комиссия", "комітет", "комісія")) {
            }
            else if (typ.typ === "служба" && ownOrg !== null && typ.name !== null) {
                let ki = ownOrg.referent.kind;
                if (ki === OrganizationKind.PRESS || ki === OrganizationKind.MEDIA) {
                    typ.coef = typ.coef + (3);
                    doHigherAlways = true;
                }
                else 
                    ownOrg = null;
            }
            else if ((typ.typ === "служба" && ownOrg !== null && num === null) && OrganizationAnalyzer._isMvdOrg(Utils.as(ownOrg.referent, OrganizationReferent)) !== null && (((((typ.beginToken.previous instanceof NumberToken) && (typ.whitespacesBeforeCount < 3))) || names !== null))) {
                typ.coef = typ.coef + (4);
                if (typ.beginToken.previous instanceof NumberToken) {
                    t0 = typ.beginToken.previous;
                    num = OrgItemNumberToken._new1831(t0, t0, typ.beginToken.previous.value);
                }
            }
            else if ((((typ.isDoubtRootWord || typ.typ === "организация" || typ.typ === "управление") || typ.typ === "служба" || typ.typ === "общество") || typ.typ === "союз" || typ.typ === "організація") || typ.typ === "керування" || typ.typ === "суспільство") 
                ownOrg = null;
            if (_org.kind === OrganizationKind.GOVENMENT) {
                if (names === null && ((typ.name === null || Utils.compareStrings(typ.name, typ.typ, true) === 0))) {
                    if ((attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY && typ.typ !== "следственный комитет" && typ.typ !== "кабинет министров") && typ.typ !== "слідчий комітет") {
                        if (((typ.typ === "администрация" || typ.typ === "адміністрація")) && (typ.endToken.next instanceof TextToken)) {
                            let rt1 = typ.kit.processReferent("PERSONPROPERTY", typ.endToken.next, null);
                            if (rt1 !== null && typ.endToken.next.morph._case.isGenitive) {
                                let _geo = Utils.as(rt1.referent.getSlotValue("REF"), GeoReferent);
                                if (_geo !== null) {
                                    _org.addName("АДМИНИСТРАЦИЯ " + typ.endToken.next.term, true, null);
                                    _org.addGeoObject(_geo);
                                    return new ReferentToken(_org, typ.beginToken, rt1.endToken);
                                }
                            }
                        }
                        if ((typ.coef < 5) || typ.chars.isAllLower) 
                            return null;
                    }
                }
            }
        }
        else if (names !== null && names[0].chars.isAllLower) {
            if (attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) 
                return null;
        }
        let always = false;
        let _name = null;
        if (((num !== null || _org.number !== null || epon !== null) || attachTyp === OrganizationAnalyzerAttachType.HIGH || attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) || ownOrg !== null) {
            let cou0 = _org.slots.length;
            if (names !== null) {
                if ((names.length === 1 && names[0].chars.isAllUpper && attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY) && isAdditionalAttach) 
                    _org.addName(MiscHelper.getTextValue(names[0].beginToken, names[names.length - 1].endToken, GetTextAttr.NO), true, names[0].beginToken);
                else {
                    _name = MiscHelper.getTextValue(names[0].beginToken, names[names.length - 1].endToken, GetTextAttr.NO);
                    if ((names[0].isNounPhrase && typ !== null && typ.root !== null) && !typ.root.isPurePrefix && multTyp === null) 
                        _name = (((typ.name != null ? typ.name : (typ !== null && typ.typ !== null ? typ.typ.toUpperCase() : null))) + " " + _name);
                }
            }
            else if (typ !== null && typ.name !== null && ((typ.root === null || !typ.root.isPurePrefix))) {
                if (typ.chars.isAllLower && !typ.canBeOrganization && (typ.nameWordsCount < 3)) 
                    _org.addTypeStr(typ.name.toLowerCase());
                else 
                    _name = typ.name;
                if (typ !== multTyp) {
                    if (t1.endChar < typ.endToken.endChar) 
                        t1 = typ.endToken;
                }
            }
            if (_name !== null) {
                if (_name.length > OrganizationAnalyzer.maxOrgName) 
                    return null;
                _org.addName(_name, true, null);
            }
            if (num !== null) 
                _org.number = num.number;
            if (epon !== null) {
                for (const e of epon.eponyms) {
                    _org.addEponym(e);
                }
            }
            ok = attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY;
            if (typ !== null && typ.root !== null && typ.root.canBeNormalDep) 
                ok = true;
            for (const a of _org.slots) {
                if (a.typeName === OrganizationReferent.ATTR_NUMBER) {
                    if (typ !== null && typ.typ === "корпус") {
                    }
                    else 
                        ok = true;
                }
                else if (a.typeName === OrganizationReferent.ATTR_GEO) {
                    if (typ.root !== null && typ.root.canBeSingleGeo) 
                        ok = true;
                }
                else if (a.typeName !== OrganizationReferent.ATTR_TYPE && a.typeName !== OrganizationReferent.ATTR_PROFILE) {
                    ok = true;
                    break;
                }
            }
            if (attachTyp === OrganizationAnalyzerAttachType.NORMAL) {
                if (typ === null) 
                    ok = false;
                else if ((typ.endChar - typ.beginChar) < 2) {
                    if (num === null && epon === null) 
                        ok = false;
                    else if (epon === null) {
                        if (t1.isWhitespaceAfter || t1.next === null) {
                        }
                        else if (t1.next.isCharOf(".,;") && t1.next.isWhitespaceAfter) {
                        }
                        else 
                            ok = false;
                    }
                }
            }
            if ((!ok && typ !== null && typ.canBeDepBeforeOrganization) && ownOrg !== null) {
                _org.addTypeStr((ownOrg.kit.baseLanguage.isUa ? "підрозділ" : "подразделение"));
                _org.higher = Utils.as(ownOrg.referent, OrganizationReferent);
                t1 = ownOrg;
                ok = true;
            }
            else if (typ !== null && ownOrg !== null && OrgOwnershipHelper.canBeHigher(Utils.as(ownOrg.referent, OrganizationReferent), _org, true)) {
                if (OrgItemTypeToken.isTypesAntagonisticOO(Utils.as(ownOrg.referent, OrganizationReferent), _org)) {
                    if (_org.kind === OrganizationKind.DEPARTMENT && !typ.canBeDepBeforeOrganization) {
                    }
                    else {
                        _org.higher = Utils.as(ownOrg.referent, OrganizationReferent);
                        if (t1.endChar < ownOrg.endChar) 
                            t1 = ownOrg;
                        ok = true;
                    }
                }
                else if (typ.root !== null && ((typ.root.canBeNormalDep || ownOrg.referent.toString().includes("Сбербанк")))) {
                    _org.higher = Utils.as(ownOrg.referent, OrganizationReferent);
                    if (t1.endChar < ownOrg.endChar) 
                        t1 = ownOrg;
                    ok = true;
                }
            }
        }
        else if (names !== null) {
            if (typ === null) {
                if (names[0].isStdName && specWordBefore) {
                    _org.addName(names[0].value, true, null);
                    t1 = names[0].endToken;
                    t = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                    if (t !== null) 
                        t1 = t;
                    return new ReferentToken(_org, t0, t1);
                }
                return null;
            }
            if (typ.root !== null && typ.root.mustHasCapitalName) {
                if (names[0].chars.isAllLower) 
                    return null;
            }
            if (names[0].chars.isLatinLetter) {
                if (typ.root !== null && !typ.root.canHasLatinName) {
                    if (!typ.chars.isLatinLetter) 
                        return null;
                }
                if (names[0].chars.isAllLower && !typ.chars.isLatinLetter) 
                    return null;
                let tmp = new StringBuilder();
                tmp.append(names[0].value);
                t1 = names[0].endToken;
                for (let j = 1; j < names.length; j++) {
                    if (!names[j].isStdTail && ((names[j].isNewlineBefore || !names[j].chars.isLatinLetter))) {
                        tMax = names[j].beginToken.previous;
                        if (typ.geo === null && _org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) 
                            Utils.removeItem(_org.slots, _org.findSlot(OrganizationReferent.ATTR_GEO, null, true));
                        break;
                    }
                    else {
                        t1 = names[j].endToken;
                        if (names[j].isStdTail) {
                            let ei = OrgItemEngItem.tryAttach(names[j].beginToken, false);
                            if (ei !== null) {
                                _org.addTypeStr(ei.fullValue);
                                if (ei.shortValue !== null) 
                                    _org.addTypeStr(ei.shortValue);
                            }
                            break;
                        }
                        if (names[j - 1].endToken.isChar('.') && !names[j - 1].value.endsWith(".")) 
                            tmp.append(".").append(names[j].value);
                        else 
                            tmp.append(" ").append(names[j].value);
                    }
                }
                if (tmp.length > OrganizationAnalyzer.maxOrgName) 
                    return null;
                let nnn = tmp.toString();
                if (nnn.startsWith("OF ") || nnn.startsWith("IN ")) 
                    tmp.insert(0, ((typ.name != null ? typ.name : typ.typ)).toUpperCase() + " ");
                if (tmp.length < 3) {
                    if (tmp.length < 2) 
                        return null;
                    if (types !== null && names[0].chars.isAllUpper) {
                    }
                    else 
                        return null;
                }
                ok = true;
                _org.addName(tmp.toString(), true, null);
            }
            else if (typ.root !== null && typ.root.isPurePrefix) {
                let tt = Utils.as(typ.endToken, TextToken);
                if (tt === null) 
                    return null;
                if (tt.isNewlineAfter) {
                    if (names[0].isNewlineAfter && typ.isNewlineBefore) {
                    }
                    else 
                        return null;
                }
                if (typ.beginToken === typ.endToken && tt.chars.isAllLower) 
                    return null;
                if (names[0].chars.isAllLower) {
                    if (!names[0].morph._case.isGenitive) 
                        return null;
                }
                t1 = names[0].endToken;
                for (let j = 1; j < names.length; j++) {
                    if (names[j].isNewlineBefore || !names[j].chars.equals(names[0].chars)) 
                        break;
                    else 
                        t1 = names[j].endToken;
                }
                ok = true;
                _name = MiscHelper.getTextValue(names[0].beginToken, t1, GetTextAttr.NO);
                if (num === null && (t1 instanceof NumberToken) && t1.typ === NumberSpellingType.DIGIT) {
                    let tt1 = t1.previous;
                    if (tt1 !== null && tt1.isHiphen) 
                        tt1 = tt1.previous;
                    if (tt1 !== null && tt1.endChar > names[0].beginChar && (tt1 instanceof TextToken)) {
                        _name = MiscHelper.getTextValue(names[0].beginToken, tt1, GetTextAttr.NO);
                        _org.number = t1.value.toString();
                    }
                }
                if (_name.length > OrganizationAnalyzer.maxOrgName) 
                    return null;
                _org.addName(_name, true, names[0].beginToken);
            }
            else {
                if (typ.isDep) 
                    return null;
                if (typ.morph.number === MorphNumber.PLURAL && attachTyp !== OrganizationAnalyzerAttachType.MULTIPLE) 
                    return null;
                let tmp = new StringBuilder();
                let koef = typ.coef;
                if (koef >= 4) 
                    always = true;
                if (_org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) 
                    koef += (1);
                if (specWordBefore) 
                    koef += (1);
                if (names[0].chars.isAllLower && typ.chars.isAllLower && !specWordBefore) {
                    if (koef >= 3) {
                        if (t !== null && (t.getReferent() instanceof GeoReferent)) {
                        }
                        else 
                            koef -= (3);
                    }
                }
                if (typ.charsRoot.isCapitalUpper) 
                    koef += (0.5);
                if (types.length > 1) 
                    koef += (types.length - 1);
                if (typ.name !== null) {
                    for (let to = typ.beginToken; to !== typ.endToken && to !== null; to = to.next) {
                        if (OrgItemTypeToken.isStdAdjective(to, false)) 
                            koef += (2);
                        if (to.chars.isCapitalUpper) 
                            koef += (0.5);
                    }
                }
                let ki = _org.kind;
                if (attachTyp === OrganizationAnalyzerAttachType.MULTIPLE && ((typ.name === null || typ.name.length === typ.typ.length))) {
                }
                else if ((((((ki === OrganizationKind.MEDIA || ki === OrganizationKind.PARTY || ki === OrganizationKind.PRESS) || ki === OrganizationKind.FACTORY || ki === OrganizationKind.AIRPORT) || ki === OrganizationKind.SEAPORT || ((typ.root !== null && typ.root.mustHasCapitalName))) || ki === OrganizationKind.BANK || typ.typ.includes("предприятие")) || typ.typ.includes("организация") || typ.typ.includes("підприємство")) || typ.typ.includes("організація")) {
                    if (typ.name !== null) 
                        _org.addTypeStr(typ.name.toLowerCase());
                }
                else 
                    tmp.append((typ.name != null ? typ.name : (typ !== null && typ.typ !== null ? typ.typ.toUpperCase() : null)));
                if (typ !== multTyp) 
                    t1 = typ.endToken;
                for (let j = 0; j < names.length; j++) {
                    if (names[j].isNewlineBefore && j > 0) {
                        if (names[j].newlinesBeforeCount > 1) 
                            break;
                        if (names[j].chars.isAllLower) {
                        }
                        else 
                            break;
                    }
                    if (!names[j].chars.equals(names[0].chars) && !names[j].beginToken.chars.equals(names[0].chars)) 
                        break;
                    if (names[j].isNounPhrase !== names[0].isNounPhrase) 
                        break;
                    if (j === 0 && names[j].preposition === null && names[j].isInDictionary) {
                        if (!names[j].morph._case.isGenitive && ((typ.root !== null && !typ.root.canHasSingleName))) 
                            break;
                    }
                    if (j === 0 && names[0].preposition === "ПО" && (((typ.typ === "комитет" || typ.typ === "комиссия" || typ.typ === "комітет") || typ.typ === "комісія"))) 
                        koef += 2.5;
                    if ((j === 0 && names[j].whitespacesBeforeCount > 2 && names[j].newlinesBeforeCount === 0) && names[j].beginToken.previous !== null) 
                        koef -= ((names[j].whitespacesBeforeCount) / (2));
                    if (names[j].isStdName) 
                        koef += (4);
                    else if (names[j].stdOrgNameNouns > 0 && ((ki === OrganizationKind.GOVENMENT || LanguageHelper.endsWith(typ.typ, "центр")))) 
                        koef += (names[j].stdOrgNameNouns);
                    if (((ki === OrganizationKind.AIRPORT || ki === OrganizationKind.SEAPORT)) && j === 0) 
                        koef++;
                    t1 = names[j].endToken;
                    if (names[j].isNounPhrase) {
                        if (!names[j].chars.isAllLower) {
                            let ca = names[j].morph._case;
                            if ((ca.isDative || ca.isGenitive || ca.isInstrumental) || ca.isPrepositional) 
                                koef += (0.5);
                            else 
                                continue;
                        }
                        else if (((j === 0 || names[j].isAfterConjunction)) && names[j].morph._case.isGenitive && names[j].preposition === null) 
                            koef += (0.5);
                        if (j === (names.length - 1)) {
                            if (names[j].endToken.next instanceof TextToken) {
                                if (names[j].endToken.next.getMorphClassInDictionary().isVerb) 
                                    koef += 0.5;
                            }
                        }
                    }
                    for (let to = names[j].beginToken; to !== null; to = to.next) {
                        if (to instanceof TextToken) {
                            if (attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
                                if (to.chars.isCapitalUpper) 
                                    koef += (0.5);
                                else if ((j === 0 && ((to.chars.isAllUpper || to.chars.isLastLower)) && to.lengthChar > 2) && typ.root !== null && typ.root.canHasLatinName) 
                                    koef += (1);
                            }
                            else if (to.chars.isAllUpper || to.chars.isCapitalUpper) 
                                koef += (1);
                        }
                        if (to === names[j].endToken) 
                            break;
                    }
                }
                for (let ttt = typ.beginToken.previous; ttt !== null; ttt = ttt.previous) {
                    if (ttt.getReferent() instanceof OrganizationReferent) {
                        koef += (1);
                        break;
                    }
                    else if (!(ttt instanceof TextToken)) 
                        break;
                    else if (ttt.chars.isLetter) 
                        break;
                }
                let oki = _org.kind;
                if (oki === OrganizationKind.GOVENMENT || oki === OrganizationKind.STUDY || oki === OrganizationKind.PARTY) 
                    koef += (names.length);
                if (attachTyp !== OrganizationAnalyzerAttachType.NORMAL && attachTyp !== OrganizationAnalyzerAttachType.NORMALAFTERDEP) 
                    koef += (3);
                let br1 = null;
                if ((t1.whitespacesAfterCount < 2) && BracketHelper.canBeStartOfSequence(t1.next, true, false)) {
                    br1 = BracketHelper.tryParse(t1.next, BracketParseAttr.NO, 100);
                    if (br1 !== null && (br1.lengthChar < 30)) {
                        let sss = MiscHelper.getTextValueOfMetaToken(br1, GetTextAttr.NO);
                        if (sss !== null && sss.length > 2) {
                            _org.addName(sss, true, br1.beginToken.next);
                            koef += (1);
                            t1 = br1.endToken;
                        }
                        else 
                            br1 = null;
                    }
                }
                if (koef >= 3 && t1.next !== null) {
                    let r = t1.next.getReferent();
                    if (r !== null && ((r.typeName === OrganizationAnalyzer.gEONAME || r.typeName === OrganizationReferent.OBJ_TYPENAME))) 
                        koef += (1);
                    else if (OrganizationAnalyzer.isGeo(t1.next, false) !== null) 
                        koef += (1);
                    else if (t1.next.isChar('(') && OrganizationAnalyzer.isGeo(t1.next.next, false) !== null) 
                        koef += (1);
                    else if (specWordBefore && t1.kit.processReferent("PERSON", t1.next, null) !== null) 
                        koef += (1);
                }
                if (koef >= 4) 
                    ok = true;
                if (!ok) {
                    if ((oki === OrganizationKind.PRESS || oki === OrganizationKind.FEDERATION || _org.types.includes("агентство")) || ((oki === OrganizationKind.PARTY && OrgItemTypeToken.checkOrgSpecialWordBefore(t0.previous)))) {
                        if (!names[0].isNewlineBefore && !names[0].morph._class.isProper) {
                            if (names[0].morph._case.isGenitive && names[0].isInDictionary) {
                                if (typ.chars.isAllLower && !names[0].chars.isAllLower) {
                                    ok = true;
                                    t1 = names[0].endToken;
                                }
                            }
                            else if (!names[0].isInDictionary && names[0].chars.isAllUpper) {
                                ok = true;
                                tmp.length = 0;
                                t1 = names[0].endToken;
                            }
                        }
                    }
                }
                if ((!ok && oki === OrganizationKind.FEDERATION && names[0].morph._case.isGenitive) && koef > 0) {
                    if (OrganizationAnalyzer.isGeo(names[names.length - 1].endToken.next, false) !== null) 
                        ok = true;
                }
                if (!ok && typ !== null && typ.root !== null) {
                    if (names.length === 1 && ((names[0].chars.isAllUpper || names[0].chars.isLastLower))) {
                        if ((ki === OrganizationKind.BANK || ki === OrganizationKind.CULTURE || ki === OrganizationKind.HOTEL) || ki === OrganizationKind.MEDIA || ki === OrganizationKind.MEDICAL) 
                            ok = true;
                    }
                }
                if (((!ok && typ !== null && typ.typ === "компания") && names.length === 1 && !names[0].chars.isAllLower) && (typ.whitespacesAfterCount < 3)) 
                    ok = true;
                if (ok) {
                    let tt1 = t1;
                    if (br1 !== null) 
                        tt1 = br1.beginToken.previous;
                    if ((tt1.getReferent() instanceof GeoReferent) && tt1.getReferent().isState) {
                        if (names[0].beginToken !== tt1) {
                            tt1 = t1.previous;
                            _org.addGeoObject(t1.getReferent());
                        }
                    }
                    let s = MiscHelper.getTextValue(names[0].beginToken, tt1, GetTextAttr.NO);
                    if ((tt1 === names[0].endToken && typ !== null && typ.typ !== null) && typ.typ.includes("фермер") && names[0].value !== null) 
                        s = names[0].value;
                    let cla = tt1.getMorphClassInDictionary();
                    if ((names[0].beginToken === t1 && s !== null && t1.morph._case.isGenitive) && t1.chars.isCapitalUpper) {
                        if (cla.isUndefined || cla.isProperGeo) {
                            if (ki === OrganizationKind.MEDICAL || ki === OrganizationKind.JUSTICE) {
                                let _geo = new GeoReferent();
                                _geo.addSlot(GeoReferent.ATTR_NAME, t1.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), false, 0);
                                _geo.addSlot(GeoReferent.ATTR_TYPE, (t1.kit.baseLanguage.isUa ? "місто" : "город"), false, 0);
                                let rt = new ReferentToken(_geo, t1, t1);
                                rt.data = OrganizationAnalyzer.getData(t1);
                                _org.addGeoObject(rt);
                                s = null;
                            }
                        }
                    }
                    if (s !== null) {
                        if (tmp.length === 0) {
                            if (names[0].morph._case.isGenitive || names[0].preposition !== null) {
                                if (names[0].chars.isAllLower) 
                                    tmp.append((typ.name != null ? typ.name : typ.typ));
                            }
                        }
                        if (tmp.length > 0) 
                            tmp.append(' ');
                        tmp.append(s);
                    }
                    if (tmp.length > OrganizationAnalyzer.maxOrgName) 
                        return null;
                    _org.addName(tmp.toString(), true, names[0].beginToken);
                    if (types.length > 1 && types[0].name !== null) 
                        _org.addTypeStr(types[0].name.toLowerCase());
                }
            }
        }
        else {
            if (typ === null) 
                return null;
            if (types.length === 2 && types[0].coef > typ.coef) 
                typ = types[0];
            if ((typ.typ === "банк" && (t instanceof ReferentToken) && !t.isNewlineBefore) && typ.morph.number === MorphNumber.SINGULAR) {
                if (typ.name !== null) {
                    if (typ.beginToken.chars.isAllLower) 
                        _org.addTypeStr(typ.name.toLowerCase());
                    else {
                        _org.addName(typ.name, true, null);
                        let s0 = MiscHelper.getTextValueOfMetaToken(typ, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                        if (s0 !== typ.name) 
                            _org.addName(s0, true, null);
                    }
                }
                let r = t.getReferent();
                if (r.typeName === OrganizationAnalyzer.gEONAME && !t.morph._case.equals(MorphCase.NOMINATIVE)) {
                    _org.addGeoObject(r);
                    if (types.length === 1 && (t.whitespacesAfterCount < 3)) {
                        let typ1 = OrgItemTypeToken.tryAttach(t.next, false);
                        if (typ1 !== null && typ1.root !== null && typ1.root.typ === OrgItemTypeTyp.PREFIX) {
                            _org.addType(typ1, false);
                            t = typ1.endToken;
                        }
                    }
                    return new ReferentToken(_org, t0, t);
                }
            }
            if (((typ.root !== null && typ.root.isPurePrefix)) && (typ.coef < 4)) 
                return null;
            if (typ.root !== null && typ.root.mustHasCapitalName) 
                return null;
            if (typ.name === null) {
                if (((typ.typ.endsWith("университет") || typ.typ.endsWith("університет"))) && OrganizationAnalyzer.isGeo(typ.endToken.next, false) !== null) 
                    always = true;
                else if (((_org.kind === OrganizationKind.JUSTICE || _org.kind === OrganizationKind.AIRPORT || _org.kind === OrganizationKind.SEAPORT)) && _org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) {
                }
                else if (typ.coef >= 4) 
                    always = true;
                else if (typ.chars.isCapitalUpper) {
                    if (typ.endToken.next !== null && ((typ.endToken.next.isHiphen || typ.endToken.next.isCharOf(":")))) {
                    }
                    else {
                        let ad = OrganizationAnalyzer.getData(t);
                        let li = (ad === null || ad.localOntology.items.length > 1000 ? null : ad.localOntology.tryAttachByItem(_org.createOntologyItem()));
                        if (li !== null && li.length > 0) {
                            for (const ll of li) {
                                let r = (ll.referent != null ? ll.referent : (Utils.as(ll.tag, Referent)));
                                if (r !== null) {
                                    if (_org.canBeEquals(r, ReferentsEqualType.FORMERGING)) {
                                        let ttt = typ.endToken;
                                        let nu = OrgItemNumberToken.tryAttach(ttt.next, true, null);
                                        if (nu !== null) {
                                            if (r.number !== nu.number) 
                                                ttt = null;
                                            else {
                                                _org.number = nu.number;
                                                ttt = nu.endToken;
                                            }
                                        }
                                        else if (li.length > 1) 
                                            ttt = null;
                                        if (ttt !== null) 
                                            return new ReferentToken(r, typ.beginToken, ttt);
                                    }
                                }
                            }
                        }
                    }
                    return null;
                }
                else {
                    let cou = 0;
                    for (let tt = typ.beginToken.previous; tt !== null && (cou < 200); tt = tt.previous,cou++) {
                        let org0 = Utils.as(tt.getReferent(), OrganizationReferent);
                        if (org0 === null) 
                            continue;
                        if (!org0.canBeEquals(_org, ReferentsEqualType.WITHINONETEXT)) 
                            continue;
                        tt = Utils.notNull(OrganizationAnalyzer.attachTailAttributes(_org, typ.endToken.next, false, attachTyp, false), typ.endToken);
                        if (!org0.canBeEquals(_org, ReferentsEqualType.WITHINONETEXT)) 
                            break;
                        _org.mergeSlots(org0, true);
                        return new ReferentToken(_org, typ.beginToken, tt);
                    }
                    if (typ.root !== null && typ.root.canBeSingleGeo && t1.next !== null) {
                        let ggg = OrganizationAnalyzer.isGeo(t1.next, false);
                        if (ggg !== null) {
                            _org.addGeoObject(ggg);
                            t1 = OrganizationAnalyzer.getGeoEndToken(ggg, t1.next);
                            return new ReferentToken(_org, t0, t1);
                        }
                    }
                    return null;
                }
            }
            if (typ.morph.number === MorphNumber.PLURAL || typ === multTyp) 
                return null;
            let koef = typ.coef;
            if (typ.nameWordsCount === 1 && typ.name !== null && typ.name.length > typ.typ.length) 
                koef++;
            if (specWordBefore) 
                koef += (1);
            ok = false;
            if (typ.charsRoot.isCapitalUpper) {
                koef += (0.5);
                if (typ.nameWordsCount === 1) 
                    koef += (0.5);
            }
            if (epon !== null) 
                koef += (2);
            let hasNonstdWords = false;
            for (let to = typ.beginToken; to !== typ.endToken && to !== null; to = to.next) {
                if (OrgItemTypeToken.isStdAdjective(to, false)) {
                    if (typ.root !== null && typ.root.coeff > 0) 
                        koef += ((OrgItemTypeToken.isStdAdjective(to, true) ? 1 : Math.floor(0.5)));
                }
                else 
                    hasNonstdWords = true;
                if (to.chars.isCapitalUpper && !to.morph._class.isPronoun) 
                    koef += (0.5);
            }
            if (!hasNonstdWords && _org.kind === OrganizationKind.GOVENMENT) 
                koef -= (2);
            if (typ.chars.isAllLower && (typ.coef < 4)) 
                koef -= (2);
            if (koef > 1 && typ.nameWordsCount > 2) 
                koef += (2);
            for (let ttt = typ.beginToken.previous; ttt !== null; ttt = ttt.previous) {
                if (ttt.getReferent() instanceof OrganizationReferent) {
                    koef += (1);
                    break;
                }
                else if (!(ttt instanceof TextToken)) 
                    break;
                else if (ttt.chars.isLetter) 
                    break;
            }
            for (let ttt = typ.endToken.next; ttt !== null; ttt = ttt.next) {
                if (ttt.getReferent() instanceof OrganizationReferent) {
                    koef += (1);
                    break;
                }
                else if (!(ttt instanceof TextToken)) 
                    break;
                else if (ttt.chars.isLetter) 
                    break;
            }
            if (typ.whitespacesBeforeCount > 4 && typ.whitespacesAfterCount > 4) 
                koef += (0.5);
            if (typ.canBeOrganization) {
                for (const s of _org.slots) {
                    if ((s.typeName === OrganizationReferent.ATTR_EPONYM || s.typeName === OrganizationReferent.ATTR_NAME || s.typeName === OrganizationReferent.ATTR_GEO) || s.typeName === OrganizationReferent.ATTR_NUMBER) {
                        koef += (3);
                        break;
                    }
                }
            }
            _org.addType(typ, false);
            if (((_org.kind === OrganizationKind.BANK || _org.kind === OrganizationKind.JUSTICE)) && typ.name !== null && typ.name.length > typ.typ.length) 
                koef += (1);
            if (_org.kind === OrganizationKind.JUSTICE && _org.geoObjects.length > 0) 
                always = true;
            if (_org.kind === OrganizationKind.AIRPORT || _org.kind === OrganizationKind.SEAPORT) {
                for (const g of _org.geoObjects) {
                    if (g.isCity) 
                        always = true;
                }
            }
            if (koef > 3 || always) 
                ok = true;
            if (((_org.kind === OrganizationKind.PARTY || _org.kind === OrganizationKind.JUSTICE)) && typ.morph.number === MorphNumber.SINGULAR) {
                if (_org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null && typ.name !== null && typ.name.length > typ.typ.length) 
                    ok = true;
                else if (typ.coef >= 4) 
                    ok = true;
                else if (typ.nameWordsCount > 2) 
                    ok = true;
            }
            if (ok) {
                if (typ.name !== null && !typ.isNotTyp) {
                    if (typ.name.length > OrganizationAnalyzer.maxOrgName || Utils.compareStrings(typ.name, typ.typ, true) === 0) 
                        return null;
                    _org.addName(typ.name, true, null);
                }
                t1 = typ.endToken;
            }
        }
        if (!ok || _org.slots.length === 0) 
            return null;
        if (attachTyp === OrganizationAnalyzerAttachType.NORMAL || attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
            ok = always;
            for (const s of _org.slots) {
                if (s.typeName !== OrganizationReferent.ATTR_TYPE && s.typeName !== OrganizationReferent.ATTR_PROFILE) {
                    ok = true;
                    break;
                }
            }
            if (!ok) 
                return null;
        }
        if (tMax !== null && (t1.endChar < tMax.beginChar)) 
            t1 = tMax;
        t = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
        if (t !== null) 
            t1 = t;
        if (ownOrg !== null && _org.higher === null) {
            if (doHigherAlways || OrgOwnershipHelper.canBeHigher(Utils.as(ownOrg.referent, OrganizationReferent), _org, false)) {
                _org.higher = Utils.as(ownOrg.referent, OrganizationReferent);
                if (ownOrg.beginChar > t1.beginChar) {
                    t1 = ownOrg;
                    t = OrganizationAnalyzer.attachTailAttributes(_org, t1.next, true, attachTyp, false);
                    if (t !== null) 
                        t1 = t;
                }
            }
        }
        if (((ownOrg !== null && typ !== null && typ.typ === "банк") && typ.geo !== null && _org.higher === ownOrg.referent) && ownOrg.referent.toString().includes("Сбербанк")) {
            let tt2 = t1.next;
            if (tt2 !== null) {
                if (tt2.isComma || tt2.isValue("В", null)) 
                    tt2 = tt2.next;
            }
            if (tt2 !== null && (tt2.getReferent() instanceof GeoReferent)) {
                let s = _org.findSlot(OrganizationReferent.ATTR_GEO, null, true);
                if (s !== null) 
                    Utils.removeItem(_org.slots, s);
                if (_org.addGeoObject(tt2)) 
                    t1 = tt2;
            }
        }
        if (t1.isNewlineAfter && t0.isNewlineBefore) {
            let typ1 = OrgItemTypeToken.tryAttach(t1.next, false);
            if (typ1 !== null && typ1.isNewlineAfter) {
                if (OrganizationAnalyzer.tryAttachOrg(t1.next, OrganizationAnalyzerAttachType.NORMAL, null, false, -1) === null) {
                    _org.addType(typ1, false);
                    t1 = typ1.endToken;
                }
            }
            if (t1.next !== null && t1.next.isChar('(')) {
                if ((((typ1 = OrgItemTypeToken.tryAttach(t1.next.next, false)))) !== null) {
                    if (typ1.endToken.next !== null && typ1.endToken.next.isChar(')') && typ1.endToken.next.isNewlineAfter) {
                        _org.addType(typ1, false);
                        t1 = typ1.endToken.next;
                    }
                }
            }
        }
        if (attachTyp === OrganizationAnalyzerAttachType.NORMAL && ((typ === null || (typ.coef < 4)))) {
            if (_org.findSlot(OrganizationReferent.ATTR_GEO, null, true) === null || ((typ !== null && typ.geo !== null))) {
                let isAllLow = true;
                for (t = t0; t !== null && t.endChar <= t1.endChar; t = t.next) {
                    if (t.chars.isLetter) {
                        if (!t.chars.isAllLower) 
                            isAllLow = false;
                    }
                    else if (!(t instanceof TextToken)) 
                        isAllLow = false;
                }
                if (isAllLow && !specWordBefore) 
                    return null;
            }
        }
        let res = new ReferentToken(_org, t0, t1);
        if (types !== null && types.length > 0) {
            res.morph = types[0].morph;
            if (types[0].isNotTyp && types[0].beginToken === t0 && (types[0].endChar < t1.endChar)) 
                res.beginToken = types[0].endToken.next;
        }
        else 
            res.morph = t0.morph;
        if ((_org.number === null && t1.next !== null && (t1.whitespacesAfterCount < 2)) && typ !== null && ((typ.root === null || typ.root.canHasNumber))) {
            let num1 = OrgItemNumberToken.tryAttach(t1.next, false, typ);
            if (num1 === null && t1.next.isHiphen) 
                num1 = OrgItemNumberToken.tryAttach(t1.next.next, false, typ);
            if (num1 !== null) {
                if (OrgItemTypeToken.isDecreeKeyword(t0.previous, 2)) {
                }
                else {
                    _org.number = num1.number;
                    t1 = num1.endToken;
                    res.endToken = t1;
                }
            }
        }
        return res;
    }
    
    tryAttachOrgBefore(t) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (t === null || t.previous === null || (t.previous instanceof ReferentToken)) 
            return null;
        let org0 = Utils.as(t.getReferent(), OrganizationReferent);
        let minEndChar = t.previous.endChar;
        let maxEndChar = t.endChar;
        let t0 = t.previous;
        if ((t0 instanceof ReferentToken) && (t0.getReferent() instanceof OrganizationReferent) && t0.previous !== null) {
            minEndChar = t0.previous.endChar;
            t0 = t0.previous;
        }
        let res = null;
        for (; t0 !== null; t0 = t0.previous) {
            if (t0.whitespacesAfterCount > 1) 
                break;
            let cou = 0;
            let tt0 = t0;
            let num = null;
            let numEt = null;
            for (let ttt = t0; ttt !== null; ttt = ttt.previous) {
                if (ttt.whitespacesAfterCount > 1) 
                    break;
                if (ttt instanceof ReferentToken) 
                    break;
                if (ttt.isHiphen || ttt.isChar('.')) 
                    continue;
                if (ttt instanceof NumberToken) {
                    if (num !== null) 
                        break;
                    num = ttt.value.toString();
                    numEt = ttt;
                    tt0 = ttt.previous;
                    continue;
                }
                let nn = OrgItemNumberToken.tryAttach(ttt, false, null);
                if (nn !== null) {
                    num = nn.number;
                    numEt = nn.endToken;
                    tt0 = ttt.previous;
                    continue;
                }
                if ((++cou) > 10) 
                    break;
                if (ttt.isValue("НАПРАВЛЕНИЕ", "НАПРЯМОК")) {
                    if (num !== null || (((ttt.previous instanceof NumberToken) && (ttt.whitespacesBeforeCount < 3)))) {
                        let oo = new OrganizationReferent();
                        oo.addProfile(OrgProfile.UNIT);
                        oo.addTypeStr((ttt.morph.language.isUa ? "НАПРЯМОК" : "НАПРАВЛЕНИЕ").toLowerCase());
                        let rt0 = new ReferentToken(oo, ttt, ttt);
                        if (numEt !== null && num !== null) {
                            oo.addSlot(OrganizationReferent.ATTR_NUMBER, num, false, 0);
                            rt0.endToken = numEt;
                            return rt0;
                        }
                        if (ttt.previous instanceof NumberToken) {
                            rt0.beginToken = ttt.previous;
                            oo.addSlot(OrganizationReferent.ATTR_NUMBER, ttt.previous.value.toString(), false, 0);
                            return rt0;
                        }
                    }
                }
                let mc = ttt.getMorphClassInDictionary();
                if (mc.isVerb && !mc.isPreposition) 
                    break;
                let typ1 = OrgItemTypeToken.tryAttach(ttt, true);
                if (typ1 === null || typ1.beginToken !== ttt) {
                    if (cou === 1) 
                        break;
                    continue;
                }
                if (typ1.endToken === tt0) 
                    t0 = ttt;
            }
            if ((t0.getReferent() instanceof OrganizationReferent) && org0 !== null) {
                let oo = Utils.as(t0.getReferent(), OrganizationReferent);
                if (oo.higher === null && OrgOwnershipHelper.canBeHigher(org0, oo, false)) {
                    oo.higher = org0;
                    return new ReferentToken(oo, t0, t);
                }
            }
            if (t0 instanceof ReferentToken) 
                break;
            let rt = OrganizationAnalyzer.tryAttachOrg(t0, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
            if (rt !== null) {
                if (rt.beginToken !== t0) 
                    return null;
                if (rt.endChar >= minEndChar && rt.endChar <= maxEndChar) {
                    let oo = Utils.as(rt.referent, OrganizationReferent);
                    if (oo.higher !== null && oo.higher.higher !== null && oo.higher === rt.endToken.getReferent()) 
                        return rt;
                    if (rt.beginChar < t.beginChar) 
                        return rt;
                    res = rt;
                }
                else 
                    break;
            }
            else if (!(t0 instanceof TextToken)) 
                break;
            else if (!t0.chars.isLetter) {
                if (!BracketHelper.isBracket(t0, false)) 
                    break;
            }
            else {
                let mc = t0.getMorphClassInDictionary();
                if (mc.isVerb && !mc.isPreposition) 
                    break;
                if (mc.isAdverb || mc.isConjunction) 
                    break;
            }
        }
        if (res !== null) 
            return null;
        let typ = null;
        for (t0 = t.previous; t0 !== null; t0 = t0.previous) {
            if (t0.whitespacesAfterCount > 1) 
                break;
            if (t0 instanceof NumberToken) 
                continue;
            if (t0.isChar('.') || t0.isHiphen) 
                continue;
            if (!(t0 instanceof TextToken)) 
                break;
            if (!t0.chars.isLetter) 
                break;
            let ty = OrgItemTypeToken.tryAttach(t0, true);
            if (ty !== null) {
                let nn = OrgItemNumberToken.tryAttach(ty.endToken.next, true, ty);
                if (nn !== null) {
                    ty.endToken = nn.endToken;
                    ty.number = nn.number;
                }
                else if ((ty.endToken.next instanceof NumberToken) && (ty.whitespacesAfterCount < 2)) {
                    ty.endToken = ty.endToken.next;
                    ty.number = ty.endToken.value.toString();
                }
                if (typ !== null && ty.beginChar > typ.beginChar) 
                    break;
                if (ty.endChar >= minEndChar && ty.endChar <= maxEndChar) 
                    typ = ty;
                else 
                    break;
            }
        }
        if (typ !== null && typ.isDep) 
            res = OrganizationAnalyzer.tryAttachDepBeforeOrg(typ, null);
        return res;
    }
    
    static attachGlobalOrg(t, attachTyp, extGeo = null) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        const OrgGlobal = require("./internal/OrgGlobal");
        if ((t instanceof TextToken) && t.chars.isLatinLetter) {
            if (MiscHelper.isEngArticle(t)) {
                let res11 = OrganizationAnalyzer.attachGlobalOrg(t.next, attachTyp, extGeo);
                if (res11 !== null) {
                    res11.beginToken = t;
                    return res11;
                }
            }
        }
        let rt00 = OrganizationAnalyzer.tryAttachPoliticParty(t, true);
        if (rt00 !== null) 
            return rt00;
        if (!(t instanceof TextToken)) {
            if (t !== null && t.getReferent() !== null && t.getReferent().typeName === "URI") {
                let rt = OrganizationAnalyzer.attachGlobalOrg(t.beginToken, attachTyp, null);
                if (rt !== null && rt.endChar === t.endChar) {
                    rt.beginToken = rt.endToken = t;
                    return rt;
                }
            }
            return null;
        }
        let term = t.term;
        if (t.chars.isAllUpper && term === "ВС") {
            if (t.previous !== null) {
                if (t.previous.isValue("ПРЕЗИДИУМ", null) || t.previous.isValue("ПЛЕНУМ", null) || t.previous.isValue("СЕССИЯ", null)) {
                    let org00 = new OrganizationReferent();
                    let te = OrganizationAnalyzer.attachTailAttributes(org00, t.next, false, OrganizationAnalyzerAttachType.NORMAL, true);
                    if (org00.geoObjects.length === 1 && org00.geoObjects[0].alpha2 === "SU") {
                        org00.addName("ВЕРХОВНЫЙ СОВЕТ", true, null);
                        org00.addName("ВС", true, null);
                        org00.addTypeStr("совет");
                        org00.addProfile(OrgProfile.STATE);
                    }
                    else {
                        org00.addName("ВЕРХОВНЫЙ СУД", true, null);
                        org00.addName("ВС", true, null);
                        org00.addTypeStr("суд");
                        org00.addProfile(OrgProfile.JUSTICE);
                    }
                    return new ReferentToken(org00, t, (te != null ? te : t));
                }
            }
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let isVc = false;
                let ad = OrganizationAnalyzer.getData(t);
                if (t.previous !== null && (t.previous.getReferent() instanceof OrganizationReferent) && t.previous.getReferent().kind === OrganizationKind.MILITARY) 
                    isVc = true;
                else if (ad !== null) {
                    for (const r of ad.referents) {
                        if (r.findSlot(OrganizationReferent.ATTR_NAME, "ВООРУЖЕННЫЕ СИЛЫ", true) !== null) {
                            isVc = true;
                            break;
                        }
                    }
                }
                if (isVc) {
                    let org00 = new OrganizationReferent();
                    org00.addName("ВООРУЖЕННЫЕ СИЛЫ", true, null);
                    org00.addName("ВС", true, null);
                    org00.addTypeStr("армия");
                    org00.addProfile(OrgProfile.ARMY);
                    let te = OrganizationAnalyzer.attachTailAttributes(org00, t.next, false, OrganizationAnalyzerAttachType.NORMAL, true);
                    return new ReferentToken(org00, t, (te != null ? te : t));
                }
            }
        }
        if ((t.chars.isAllUpper && ((term === "АН" || term === "ВАС" || term === "АМН")) && t.next !== null) && (t.next.getReferent() instanceof GeoReferent)) {
            let org00 = new OrganizationReferent();
            if (term === "АН") {
                org00.addName("АКАДЕМИЯ НАУК", true, null);
                org00.addTypeStr("академия");
                org00.addProfile(OrgProfile.SCIENCE);
            }
            else if (term === "АМН") {
                org00.addName("АКАДЕМИЯ МЕДИЦИНСКИХ НАУК", true, null);
                org00.addTypeStr("академия");
                org00.addProfile(OrgProfile.SCIENCE);
            }
            else {
                org00.addName("ВЫСШИЙ АРБИТРАЖНЫЙ СУД", true, null);
                org00.addName("ВАС", true, null);
                org00.addTypeStr("суд");
                org00.addProfile(OrgProfile.JUSTICE);
            }
            let te = OrganizationAnalyzer.attachTailAttributes(org00, t.next, false, OrganizationAnalyzerAttachType.NORMAL, true);
            return new ReferentToken(org00, t, (te != null ? te : t));
        }
        if (t.chars.isAllUpper && term === "ГД" && t.previous !== null) {
            let rt = t.kit.processReferent("PERSONPROPERTY", t.previous, null);
            if (rt !== null && rt.referent !== null && rt.referent.typeName === "PERSONPROPERTY") {
                let org00 = new OrganizationReferent();
                org00.addName("ГОСУДАРСТВЕННАЯ ДУМА", true, null);
                org00.addName("ГОСДУМА", true, null);
                org00.addName("ГД", true, null);
                org00.addTypeStr("парламент");
                org00.addProfile(OrgProfile.STATE);
                let te = OrganizationAnalyzer.attachTailAttributes(org00, t.next, false, OrganizationAnalyzerAttachType.NORMAL, true);
                return new ReferentToken(org00, t, (te != null ? te : t));
            }
        }
        if (t.chars.isAllUpper && term === "МЮ") {
            let ok = false;
            if ((t.previous !== null && t.previous.isValue("В", null) && t.previous.previous !== null) && t.previous.previous.isValue("ЗАРЕГИСТРИРОВАТЬ", null)) 
                ok = true;
            else if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) 
                ok = true;
            if (ok) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("министерство");
                org00.addProfile(OrgProfile.STATE);
                org00.addName("МИНИСТЕРСТВО ЮСТИЦИИ", true, null);
                org00.addName("МИНЮСТ", true, null);
                let t1 = t;
                if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                    t1 = t.next;
                    org00.addGeoObject(t1.getReferent());
                }
                return new ReferentToken(org00, t, t1);
            }
        }
        if (t.chars.isAllUpper && term === "ФС") {
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("парламент");
                org00.addProfile(OrgProfile.STATE);
                org00.addName("ФЕДЕРАЛЬНОЕ СОБРАНИЕ", true, null);
                org00.addGeoObject(t.next.getReferent());
                return new ReferentToken(org00, t, t.next);
            }
        }
        if (t.chars.isAllUpper && term === "МП") {
            let tt0 = t.previous;
            if (tt0 !== null && tt0.isChar('(')) 
                tt0 = tt0.previous;
            let org0 = null;
            let prev = false;
            if (tt0 !== null) {
                org0 = Utils.as(tt0.getReferent(), OrganizationReferent);
                if (org0 !== null) 
                    prev = true;
            }
            if (t.next !== null && org0 === null) 
                org0 = Utils.as(t.next.getReferent(), OrganizationReferent);
            if (org0 !== null && org0.kind === OrganizationKind.CHURCH) {
                let glob = new OrganizationReferent();
                glob.addTypeStr("патриархия");
                glob.addName("МОСКОВСКАЯ ПАТРИАРХИЯ", true, null);
                glob.higher = org0;
                glob.addProfile(OrgProfile.RELIGION);
                let res = new ReferentToken(glob, t, t);
                if (!prev) 
                    res.endToken = t.next;
                else {
                    res.beginToken = tt0;
                    if (tt0 !== t.previous && res.endToken.next !== null && res.endToken.next.isChar(')')) 
                        res.endToken = res.endToken.next;
                }
                return res;
            }
        }
        if (t.chars.isAllUpper && term === "ГШ") {
            if (t.next !== null && (t.next.getReferent() instanceof OrganizationReferent) && t.next.getReferent().kind === OrganizationKind.MILITARY) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("генеральный штаб");
                org00.addProfile(OrgProfile.ARMY);
                org00.higher = Utils.as(t.next.getReferent(), OrganizationReferent);
                return new ReferentToken(org00, t, t.next);
            }
        }
        if (t.chars.isAllUpper && term === "ЗС") {
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("парламент");
                org00.addProfile(OrgProfile.STATE);
                org00.addName("ЗАКОНОДАТЕЛЬНОЕ СОБРАНИЕ", true, null);
                org00.addGeoObject(t.next.getReferent());
                return new ReferentToken(org00, t, t.next);
            }
        }
        if (t.chars.isAllUpper && term === "СФ") {
            t.innerBool = true;
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("совет");
                org00.addProfile(OrgProfile.STATE);
                org00.addName("СОВЕТ ФЕДЕРАЦИИ", true, null);
                org00.addGeoObject(t.next.getReferent());
                return new ReferentToken(org00, t, t.next);
            }
            if (t.next !== null) {
                if (t.next.isValue("ФС", null) || (((t.next.getReferent() instanceof OrganizationReferent) && t.next.getReferent().findSlot(OrganizationReferent.ATTR_NAME, "ФЕДЕРАЛЬНОЕ СОБРАНИЕ", true) !== null))) {
                    let org00 = new OrganizationReferent();
                    org00.addTypeStr("совет");
                    org00.addProfile(OrgProfile.STATE);
                    org00.addName("СОВЕТ ФЕДЕРАЦИИ", true, null);
                    return new ReferentToken(org00, t, t);
                }
            }
        }
        if (t.chars.isAllUpper && term === "ФК") {
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("казначейство");
                org00.addProfile(OrgProfile.FINANCE);
                org00.addName("ФЕДЕРАЛЬНОЕ КАЗНАЧЕЙСТВО", true, null);
                org00.addGeoObject(t.next.getReferent());
                return new ReferentToken(org00, t, t.next);
            }
            if (attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("казначейство");
                org00.addProfile(OrgProfile.FINANCE);
                org00.addName("ФЕДЕРАЛЬНОЕ КАЗНАЧЕЙСТВО", true, null);
                return new ReferentToken(org00, t, t);
            }
        }
        if (t.chars.isAllUpper && ((term === "СК" || term === "CK"))) {
            if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                let ok1 = false;
                let ad = t.kit.getAnalyzerDataByAnalyzerName("ORGANIZATION");
                for (const e of ad.referents) {
                    for (const s of e.slots) {
                        if ((typeof s.value === 'string' || s.value instanceof String)) {
                            if (s.value.toUpperCase().includes("СЛЕДСТВЕННЫЙ КОМИТЕТ")) {
                                ok1 = true;
                                break;
                            }
                        }
                    }
                    if (ok1) 
                        break;
                }
                for (let tt = t.previous; tt !== null; tt = tt.previous) {
                    if (tt instanceof TextToken) {
                        if (ok1) 
                            break;
                        if (tt.isCommaAnd) 
                            continue;
                        if (tt instanceof NumberToken) 
                            continue;
                        if (!tt.chars.isLetter) 
                            continue;
                        if ((tt.isValue("ЧАСТЬ", null) || tt.isValue("СТАТЬЯ", null) || tt.isValue("ПУНКТ", null)) || tt.isValue("СТ", null) || tt.isValue("П", null)) 
                            return null;
                        break;
                    }
                }
                let org00 = new OrganizationReferent();
                org00.addTypeStr("комитет");
                org00.addProfile(OrgProfile.UNIT);
                org00.addName("СЛЕДСТВЕННЫЙ КОМИТЕТ", true, null);
                org00.addGeoObject(t.next.getReferent());
                return new ReferentToken(org00, t, t.next);
            }
            let gt1 = OrgGlobal.GLOBAL_ORGS.tryAttach(t.next, null, false);
            if (gt1 === null && t.next !== null && t.kit.baseLanguage.isUa) 
                gt1 = OrgGlobal.GLOBAL_ORGS_UA.tryAttach(t.next, null, false);
            let ok = false;
            if (gt1 !== null && gt1[0].item.referent.findSlot(OrganizationReferent.ATTR_NAME, "МВД", true) !== null) 
                ok = true;
            if (ok) {
                let org00 = new OrganizationReferent();
                org00.addTypeStr("комитет");
                org00.addName("СЛЕДСТВЕННЫЙ КОМИТЕТ", true, null);
                org00.addProfile(OrgProfile.UNIT);
                return new ReferentToken(org00, t, t);
            }
        }
        let gt = OrgGlobal.GLOBAL_ORGS.tryAttach(t, null, true);
        if (gt === null) 
            gt = OrgGlobal.GLOBAL_ORGS.tryAttach(t, null, false);
        if (gt === null && t !== null && t.kit.baseLanguage.isUa) {
            gt = OrgGlobal.GLOBAL_ORGS_UA.tryAttach(t, null, true);
            if (gt === null) 
                gt = OrgGlobal.GLOBAL_ORGS_UA.tryAttach(t, null, false);
        }
        if (gt === null) 
            return null;
        for (const ot of gt) {
            let org0 = Utils.as(ot.item.referent, OrganizationReferent);
            if (org0 === null) 
                continue;
            if (ot.beginToken === ot.endToken) {
                if (gt.length === 1) {
                    if ((ot.beginToken instanceof TextToken) && ot.beginToken.term === "МГТУ") {
                        let ty = OrgItemTypeToken.tryAttach(ot.beginToken, false);
                        if (ty !== null) 
                            continue;
                    }
                }
                else {
                    let ad = OrganizationAnalyzer.getData(t);
                    if (ad === null) 
                        return null;
                    let ok = false;
                    for (const o of ad.referents) {
                        if (o.canBeEquals(org0, ReferentsEqualType.DIFFERENTTEXTS)) {
                            ok = true;
                            break;
                        }
                    }
                    if (!ok) 
                        return null;
                }
            }
            if (((t.chars.isAllLower && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY && extGeo === null) && !t.isValue("МИД", null) && !org0._typesContains("факультет")) && org0.kind !== OrganizationKind.JUSTICE) {
                if (ot.beginToken === ot.endToken) 
                    continue;
                if (ot.morph.number === MorphNumber.PLURAL) 
                    continue;
                let okk = false;
                let tyty = OrgItemTypeToken.tryAttach(t, true);
                if (tyty !== null && tyty.endToken === ot.endToken) {
                    if (tyty.name === "ТАМОЖЕННЫЙ СОЮЗ" || tyty.name === "МИТНИЙ СОЮЗ") 
                        okk = true;
                    else 
                        continue;
                }
                if (t.next !== null && (t.next.getReferent() instanceof GeoReferent)) {
                }
                else if (OrgItemTypeToken.checkOrgSpecialWordBefore(t.previous)) {
                }
                else if (tyty !== null && tyty.endToken.next !== null && (tyty.endToken.next.getReferent() instanceof GeoReferent)) {
                }
                else if (!okk) 
                    continue;
            }
            if ((ot.beginToken === ot.endToken && (t.lengthChar < 6) && !t.chars.isAllUpper) && !t.chars.isLastLower) {
                if (org0.findSlot(OrganizationReferent.ATTR_NAME, t.term, true) === null) {
                    if (t.isValue("МИД", null)) {
                    }
                    else 
                        continue;
                }
                else if (t.chars.isAllLower) 
                    continue;
                else if (t.lengthChar < 3) 
                    continue;
                else if (t.lengthChar === 4) {
                    let hasVow = false;
                    for (const ch of t.term) {
                        if (LanguageHelper.isCyrillicVowel(ch) || LanguageHelper.isLatinVowel(ch)) 
                            hasVow = true;
                    }
                    if (hasVow) 
                        continue;
                }
            }
            if (ot.beginToken === ot.endToken && term === "МЭР") 
                continue;
            if (ot.beginToken === ot.endToken) {
                if (t.previous === null || t.isWhitespaceBefore) {
                }
                else if ((t.previous instanceof TextToken) && ((t.previous.isCharOf(",:") || BracketHelper.canBeStartOfSequence(t.previous, false, false)))) {
                }
                else if (t.getMorphClassInDictionary().isUndefined && t.chars.isCapitalUpper) {
                }
                else 
                    continue;
                if (t.next === null || t.isWhitespaceAfter) {
                }
                else if ((t.next instanceof TextToken) && ((t.next.isCharOf(",.") || BracketHelper.canBeEndOfSequence(t.next, false, null, false)))) {
                }
                else if (t.getMorphClassInDictionary().isUndefined && t.chars.isCapitalUpper) {
                }
                else 
                    continue;
                if (t instanceof TextToken) {
                    let hasName = false;
                    for (const n of org0.names) {
                        if (t.isValue(n, null)) {
                            hasName = true;
                            break;
                        }
                    }
                    if (!hasName) 
                        continue;
                    if (t.lengthChar < 3) {
                        let ok1 = true;
                        if (t.next !== null && !t.isNewlineBefore) {
                            if (MiscHelper.checkNumberPrefix(t.next) !== null) 
                                ok1 = false;
                            else if (t.next.isHiphen || (t.next instanceof NumberToken)) 
                                ok1 = false;
                        }
                        if (!ok1) 
                            continue;
                    }
                }
                let rt = t.kit.processReferent("TRANSPORT", t, null);
                if (rt !== null) 
                    continue;
            }
            let _org = null;
            if (t instanceof TextToken) {
                if ((t.isValue("ДЕПАРТАМЕНТ", null) || t.isValue("КОМИТЕТ", "КОМІТЕТ") || t.isValue("МИНИСТЕРСТВО", "МІНІСТЕРСТВО")) || t.isValue("КОМИССИЯ", "КОМІСІЯ")) {
                    let nnn = OrgItemNameToken.tryAttach(t.next, null, true, true);
                    if (nnn !== null && nnn.endChar > ot.endChar) {
                        _org = new OrganizationReferent();
                        for (const p of org0.profiles) {
                            _org.addProfile(p);
                        }
                        _org.addTypeStr(t.lemma.toLowerCase());
                        _org.addName(MiscHelper.getTextValue(t, nnn.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE), true, null);
                        ot.endToken = nnn.endToken;
                    }
                }
            }
            if (_org === null) {
                _org = Utils.as(org0.clone(), OrganizationReferent);
                if (_org.geoObjects.length > 0) {
                    for (const s of _org.slots) {
                        if (s.typeName === OrganizationReferent.ATTR_GEO && (s.value instanceof GeoReferent)) {
                            let gg = s.value.clone();
                            gg.occurrence.splice(0, gg.occurrence.length);
                            let rtg = new ReferentToken(gg, t, t);
                            rtg.data = t.kit.getAnalyzerDataByAnalyzerName("GEO");
                            Utils.removeItem(_org.slots, s);
                            _org.addGeoObject(rtg);
                            break;
                        }
                    }
                }
                _org.addName(ot.termin.canonicText, true, null);
                let sl = _org.findSlot("NAME", "МИНКУЛЬТ", true);
                if (sl !== null) 
                    Utils.removeItem(_org.slots, sl);
            }
            if (extGeo !== null) 
                _org.addGeoObject(extGeo);
            _org.isFromGlobalOntos = true;
            for (let tt = ot.beginToken; tt !== null && (tt.endChar < ot.endChar); tt = tt.next) {
                if (tt.getReferent() instanceof GeoReferent) {
                    _org.addGeoObject(tt);
                    break;
                }
            }
            if ((t.previous instanceof TextToken) && (t.whitespacesBeforeCount < 2) && t.previous.morph._class.isAdjective) {
                let gg = t.kit.processReferent("GEO", t.previous, null);
                if (gg !== null && gg.morph._class.isAdjective) {
                    t = t.previous;
                    _org.addGeoObject(gg);
                }
            }
            let t1 = null;
            if (!org0.types.includes("академия") && attachTyp !== OrganizationAnalyzerAttachType.NORMALAFTERDEP && attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) 
                t1 = OrganizationAnalyzer.attachTailAttributes(_org, ot.endToken.next, false, OrganizationAnalyzerAttachType.NORMAL, true);
            else if ((((((org0.types.includes("министерство") || org0.types.includes("парламент") || org0.types.includes("совет")) || org0.kind === OrganizationKind.SCIENCE || org0.kind === OrganizationKind.GOVENMENT) || org0.kind === OrganizationKind.STUDY || org0.kind === OrganizationKind.JUSTICE) || org0.kind === OrganizationKind.MILITARY)) && (ot.endToken.next instanceof ReferentToken)) {
                let _geo = Utils.as(ot.endToken.next.getReferent(), GeoReferent);
                if (_geo !== null && _geo.isState) {
                    _org.addGeoObject(_geo);
                    t1 = ot.endToken.next;
                }
            }
            if (t1 === null) 
                t1 = ot.endToken;
            let epp = OrgItemEponymToken.tryAttach(t1.next, false);
            if (epp !== null) {
                let exi = false;
                for (const v of epp.eponyms) {
                    if (_org.findSlot(OrganizationReferent.ATTR_EPONYM, v, true) !== null) {
                        exi = true;
                        break;
                    }
                }
                if (!exi) {
                    for (let i = _org.slots.length - 1; i >= 0; i--) {
                        if (_org.slots[i].typeName === OrganizationReferent.ATTR_EPONYM) 
                            _org.slots.splice(i, 1);
                    }
                    for (const vv of epp.eponyms) {
                        _org.addEponym(vv);
                    }
                }
                t1 = epp.endToken;
            }
            if (t1.whitespacesAfterCount < 2) {
                let typ = OrgItemTypeToken.tryAttach(t1.next, false);
                if (typ !== null) {
                    if (OrgItemTypeToken.isTypeAccords(_org, typ)) {
                        if (typ.chars.isLatinLetter && typ.root !== null && typ.root.canBeNormalDep) {
                        }
                        else {
                            let rrr = OrganizationAnalyzer.processReferentStat(t1.next, null);
                            if (rrr !== null && !rrr.referent.canBeEquals(_org, ReferentsEqualType.WITHINONETEXT)) {
                            }
                            else {
                                _org.addType(typ, false);
                                t1 = typ.endToken;
                            }
                        }
                    }
                }
            }
            if (_org.geoObjects.length === 0 && t.previous !== null && t.previous.morph._class.isAdjective) {
                let grt = t.kit.processReferent("GEO", t.previous, null);
                if (grt !== null && grt.endToken.next === t) {
                    _org.addGeoObject(grt);
                    t = t.previous;
                }
            }
            if (_org.findSlot(OrganizationReferent.ATTR_NAME, "ВТБ", true) !== null && t1.next !== null) {
                let tt = t1.next;
                if (tt.isHiphen && tt.next !== null) 
                    tt = tt.next;
                if (tt instanceof NumberToken) {
                    _org.number = tt.value.toString();
                    t1 = tt;
                }
            }
            if (!t.isWhitespaceBefore && !t1.isWhitespaceAfter) {
                if (BracketHelper.canBeStartOfSequence(t.previous, true, false) && BracketHelper.canBeEndOfSequence(t1.next, true, null, false)) {
                    t = t.previous;
                    t1 = t1.next;
                }
            }
            gt = OrgGlobal.GLOBAL_ORGS.tryAttach(t1.next, null, true);
            if (gt !== null && gt[0].item.referent === org0 && (t1.whitespacesAfterCount < 3)) 
                t1 = gt[0].endToken;
            else if (BracketHelper.canBeStartOfSequence(t1.next, false, false)) {
                gt = OrgGlobal.GLOBAL_ORGS.tryAttach(t1.next.next, null, true);
                if (gt !== null && gt[0].item.referent === org0) {
                    if (BracketHelper.canBeEndOfSequence(gt[0].endToken.next, false, null, false)) 
                        t1 = gt[0].endToken.next;
                }
            }
            return new ReferentToken(_org, t, t1);
        }
        return null;
    }
    
    static _tryAttachOrgMedTyp(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let s = t.term;
        if (((t !== null && s === "Г" && t.next !== null) && t.next.isCharOf("\\/.") && t.next.next !== null) && t.next.next.isValue("Б", null)) {
            let t1 = t.next.next;
            if (t.next.isChar('.') && t1.next !== null && t1.next.isChar('.')) 
                t1 = t1.next;
            return MetaToken._new2433(t, t1, "городская больница", MorphCollection._new2432(MorphGender.FEMINIE));
        }
        if ((s === "ИН" && t.next !== null && t.next.isHiphen) && t.next.next !== null && t.next.next.isValue("Т", null)) 
            return MetaToken._new2433(t, t.next.next, "институт", MorphCollection._new2432(MorphGender.MASCULINE));
        if ((s === "Б" && t.next !== null && t.next.isHiphen) && (t.next.next instanceof TextToken) && ((t.next.next.isValue("ЦА", null) || t.next.next.isValue("ЦУ", null)))) 
            return MetaToken._new2433(t, t.next.next, "больница", MorphCollection._new2432(MorphGender.FEMINIE));
        if (s === "ГКБ") 
            return MetaToken._new2433(t, t, "городская клиническая больница", MorphCollection._new2432(MorphGender.FEMINIE));
        if (t.isValue("ПОЛИКЛИНИКА", null)) 
            return MetaToken._new2433(t, t, "поликлиника", MorphCollection._new2432(MorphGender.FEMINIE));
        if (t.isValue("БОЛЬНИЦА", null)) 
            return MetaToken._new2433(t, t, "больница", MorphCollection._new2432(MorphGender.FEMINIE));
        if (t.isValue("ДЕТСКИЙ", null)) {
            let mt = OrganizationAnalyzer._tryAttachOrgMedTyp(t.next);
            if (mt !== null) {
                mt.beginToken = t;
                mt.tag = ((mt.morph.gender === MorphGender.FEMINIE ? "детская" : "детский") + " " + mt.tag);
                return mt;
            }
        }
        return null;
    }
    
    static tryAttachOrgMed(t) {
        if (t === null) 
            return null;
        if (t.previous === null || t.previous.previous === null) 
            return null;
        if ((t.previous.morph._class.isPreposition && t.previous.previous.isValue("ДОСТАВИТЬ", null)) || t.previous.previous.isValue("ПОСТУПИТЬ", null)) {
        }
        else 
            return null;
        if (t.isValue("ТРАВМПУНКТ", null)) 
            t = t.next;
        else if (t.isValue("ТРАВМ", null)) {
            if ((t.next !== null && t.next.isChar('.') && t.next.next !== null) && t.next.next.isValue("ПУНКТ", null)) 
                t = t.next.next.next;
        }
        if (t instanceof NumberToken) {
            let tt = OrganizationAnalyzer._tryAttachOrgMedTyp(t.next);
            if (tt !== null) {
                let org1 = new OrganizationReferent();
                org1.addTypeStr(tt.tag.toLowerCase());
                org1.number = t.value.toString();
                return new ReferentToken(org1, t, tt.endToken);
            }
        }
        let typ = OrganizationAnalyzer._tryAttachOrgMedTyp(t);
        let adj = null;
        if (typ === null && t.chars.isCapitalUpper && t.morph._class.isAdjective) {
            typ = OrganizationAnalyzer._tryAttachOrgMedTyp(t.next);
            if (typ !== null) 
                adj = t.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, typ.morph.gender, false);
        }
        if (typ === null) 
            return null;
        let _org = new OrganizationReferent();
        let s = Utils.asString(typ.tag);
        _org.addTypeStr(s.toLowerCase());
        if (adj !== null) 
            _org.addName((adj + " " + s.toUpperCase()), true, null);
        let t1 = typ.endToken;
        let epo = OrgItemEponymToken.tryAttach(t1.next, false);
        if (epo !== null) {
            for (const v of epo.eponyms) {
                _org.addEponym(v);
            }
            t1 = epo.endToken;
        }
        if (t1.next instanceof TextToken) {
            if (t1.next.isValue("СКЛИФОСОФСКОГО", null) || t1.next.isValue("СЕРБСКОГО", null) || t1.next.isValue("БОТКИНА", null)) {
                _org.addEponym(t1.next.term);
                t1 = t1.next;
            }
        }
        let num = OrgItemNumberToken.tryAttach(t1.next, false, null);
        if (num !== null) {
            _org.number = num.number;
            t1 = num.endToken;
        }
        if (_org.slots.length > 1) 
            return new ReferentToken(_org, t, t1);
        return null;
    }
    
    static tryAttachPropNames(t) {
        let rt = OrganizationAnalyzer._tryAttachOrgSportAssociations(t);
        if (rt === null) 
            rt = OrganizationAnalyzer._tryAttachOrgNames(t);
        if (rt === null) 
            return null;
        let t0 = rt.beginToken.previous;
        if ((t0 instanceof TextToken) && (t0.whitespacesAfterCount < 2) && t0.morph._class.isAdjective) {
            let rt0 = t0.kit.processReferent("GEO", t0, null);
            if (rt0 !== null && rt0.morph._class.isAdjective) {
                rt.beginToken = rt0.beginToken;
                rt.referent.addGeoObject(rt0);
            }
        }
        if (rt.endToken.whitespacesAfterCount < 2) {
            let tt1 = OrganizationAnalyzer.attachTailAttributes(Utils.as(rt.referent, OrganizationReferent), rt.endToken.next, true, OrganizationAnalyzerAttachType.NORMAL, true);
            if (tt1 !== null) 
                rt.endToken = tt1;
        }
        return rt;
    }
    
    static _tryAttachOrgNames(t) {
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        if (t === null) 
            return null;
        let t0 = t;
        let br = null;
        let tName1 = null;
        let prof = OrgProfile.UNDEFINED;
        let prof2 = OrgProfile.UNDEFINED;
        let typ = null;
        let ok = false;
        let uri = null;
        if (!(t instanceof TextToken) || !t.chars.isLetter) {
            if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                if ((((br = BracketHelper.tryParse(t, BracketParseAttr.NO, 15)))) !== null) 
                    t = t0.next;
                else 
                    return null;
            }
            else if (t.getReferent() !== null && t.getReferent().typeName === "URI") {
                let r = t.getReferent();
                let s = r.getStringValue("SCHEME");
                if (s === "HTTP") {
                    prof = OrgProfile.MEDIA;
                    tName1 = t;
                }
            }
            else if ((t.getReferent() instanceof GeoReferent) && t.chars.isLetter) {
                if ((t.next !== null && (t.next.whitespacesAfterCount < 3) && t.next.chars.isLatinLetter) && ((t.next.isValue("POST", null) || t.next.isValue("TODAY", null)))) {
                    tName1 = t.next;
                    if (OrganizationAnalyzer._isStdPressEnd(tName1)) 
                        prof = OrgProfile.MEDIA;
                }
                else 
                    return null;
            }
            else 
                return null;
        }
        else if (t.chars.isAllUpper && t.term === "ИА") {
            prof = OrgProfile.MEDIA;
            t = t.next;
            typ = "информационное агенство";
            if (t === null || t.whitespacesBeforeCount > 2) 
                return null;
            let re = OrganizationAnalyzer._tryAttachOrgNames(t);
            if (re !== null) {
                re.beginToken = t0;
                re.referent.addTypeStr(typ);
                return re;
            }
            if (t.chars.isLatinLetter) {
                let nam = OrgItemEngItem.tryAttach(t, false);
                if (nam !== null) {
                    ok = true;
                    tName1 = nam.endToken;
                }
                else {
                    let nam1 = OrgItemNameToken.tryAttach(t, null, false, true);
                    if (nam1 !== null) {
                        ok = true;
                        tName1 = nam1.endToken;
                    }
                }
            }
        }
        else if (((t.chars.isLatinLetter && t.next !== null && t.next.isChar('.')) && !t.next.isWhitespaceAfter && t.next.next !== null) && t.next.next.chars.isLatinLetter) {
            tName1 = t.next.next;
            prof = OrgProfile.MEDIA;
            if (tName1.next === null) {
            }
            else if (tName1.whitespacesAfterCount > 0) {
            }
            else if (tName1.next.isChar(',')) {
            }
            else if (tName1.lengthChar > 1 && tName1.next.isCharOf(".") && tName1.next.isWhitespaceAfter) {
            }
            else if (br !== null && br.endToken.previous === tName1) {
            }
            else 
                return null;
        }
        else if (t.chars.isAllLower && br === null) 
            return null;
        let t00 = t0.previous;
        if (t00 !== null && t00.morph._class.isAdjective) 
            t00 = t00.previous;
        if (t00 !== null && t00.morph._class.isPreposition) 
            t00 = t00.previous;
        let tok = OrganizationAnalyzer.m_PropNames.tryParse(t, TerminParseAttr.NO);
        if (tok === null && t.chars.isLatinLetter && t.isValue("THE", null)) 
            tok = OrganizationAnalyzer.m_PropNames.tryParse(t.next, TerminParseAttr.NO);
        if (tok !== null && t.isValue("ВЕДУЩИЙ", null) && tok.beginToken === tok.endToken) 
            tok = null;
        if (tok !== null) 
            prof = OrgProfile.of(tok.termin.tag);
        if (br !== null) {
            if (br.lengthChar > 30) 
                return null;
            let t1 = br.endToken.previous;
            for (let tt = br.beginToken; tt !== null && tt.endChar <= br.endChar; tt = tt.next) {
                let mc = tt.getMorphClassInDictionary();
                if (mc.equals(MorphClass.VERB)) 
                    return null;
                if (mc.equals(MorphClass.ADVERB)) 
                    return null;
                if (tt.isCharOf("?:")) 
                    return null;
                if (tt === br.beginToken.next || tt === br.endToken.previous) {
                    if (((tt.isValue("ЖУРНАЛ", null) || tt.isValue("ГАЗЕТА", null) || tt.isValue("ПРАВДА", null)) || tt.isValue("ИЗВЕСТИЯ", null) || tt.isValue("НОВОСТИ", null)) || tt.isValue("ВЕДОМОСТИ", null)) {
                        ok = true;
                        prof = OrgProfile.MEDIA;
                        prof2 = OrgProfile.PRESS;
                    }
                }
            }
            if (!ok && OrganizationAnalyzer._isStdPressEnd(t1)) {
                if (br.beginToken.next.chars.isCapitalUpper && (br.lengthChar < 15)) {
                    ok = true;
                    prof = OrgProfile.MEDIA;
                    prof2 = OrgProfile.PRESS;
                }
            }
            else if (t1.isValue("FM", null)) {
                ok = true;
                prof = OrgProfile.MEDIA;
                typ = "радиостанция";
            }
            else if (((t1.isValue("РУ", null) || t1.isValue("RU", null) || t1.isValue("NET", null))) && t1.previous !== null && t1.previous.isChar('.')) 
                prof = OrgProfile.MEDIA;
            let b = br.beginToken.next;
            if (b.isValue("THE", null)) 
                b = b.next;
            if (OrganizationAnalyzer._isStdPressEnd(b) || b.isValue("ВЕЧЕРНИЙ", null)) {
                ok = true;
                prof = OrgProfile.MEDIA;
            }
        }
        if ((tok === null && !ok && tName1 === null) && prof === OrgProfile.UNDEFINED) {
            if (br === null || !t.chars.isCapitalUpper) 
                return null;
            if (!(t00 instanceof TextToken)) 
                return null;
            let tok1 = OrganizationAnalyzer.m_PropPref.tryParse(t00, TerminParseAttr.NO);
            if (tok1 !== null) {
                let pr = OrgProfile.of(tok1.termin.tag);
                if (prof !== OrgProfile.UNDEFINED && prof !== pr) 
                    return null;
            }
            else {
                if (t.chars.isLetter && !t.chars.isCyrillicLetter) {
                    for (let tt = t.next; tt !== null; tt = tt.next) {
                        if (tt.getReferent() instanceof GeoReferent) 
                            continue;
                        if (tt.whitespacesBeforeCount > 2) 
                            break;
                        if (!tt.chars.isLetter || tt.chars.isCyrillicLetter) 
                            break;
                        if (OrganizationAnalyzer._isStdPressEnd(tt)) {
                            tName1 = tt;
                            prof = OrgProfile.MEDIA;
                            ok = true;
                            break;
                        }
                    }
                }
                if (tName1 === null) 
                    return null;
            }
        }
        if (tok !== null) {
            if (tok.beginToken.chars.isAllLower && br === null) {
            }
            else if (tok.beginToken !== tok.endToken) 
                ok = true;
            else if (MiscHelper.canBeStartOfSentence(tok.beginToken)) 
                return null;
            else if (br === null && BracketHelper.canBeStartOfSequence(tok.beginToken.previous, false, false)) 
                return null;
            else if (tok.chars.isAllUpper) 
                ok = true;
        }
        if (!ok) {
            let cou = 0;
            for (let tt = t0.previous; tt !== null && (cou < 100); tt = tt.previous,cou++) {
                if (MiscHelper.canBeStartOfSentence(tt.next)) 
                    break;
                let tok1 = OrganizationAnalyzer.m_PropPref.tryParse(tt, TerminParseAttr.NO);
                if (tok1 !== null) {
                    let pr = OrgProfile.of(tok1.termin.tag);
                    if (prof !== OrgProfile.UNDEFINED && prof !== pr) 
                        continue;
                    if (tok1.termin.tag2 !== null && prof === OrgProfile.UNDEFINED) 
                        continue;
                    prof = pr;
                    ok = true;
                    break;
                }
                let org1 = Utils.as(tt.getReferent(), OrganizationReferent);
                if (org1 !== null && org1.findSlot(OrganizationReferent.ATTR_PROFILE, null, true) !== null) {
                    if ((org1.containsProfile(prof) || prof === OrgProfile.UNDEFINED)) {
                        ok = true;
                        prof = org1.profiles[0];
                        break;
                    }
                }
            }
            cou = 0;
            if (!ok) {
                for (let tt = t.next; tt !== null && (cou < 10); tt = tt.next,cou++) {
                    if (MiscHelper.canBeStartOfSentence(tt) && prof !== OrgProfile.SPORT) 
                        break;
                    let tok1 = OrganizationAnalyzer.m_PropPref.tryParse(tt, TerminParseAttr.NO);
                    if (tok1 !== null) {
                        let pr = OrgProfile.of(tok1.termin.tag);
                        if (prof !== OrgProfile.UNDEFINED && prof !== pr) 
                            continue;
                        if (tok1.termin.tag2 !== null && prof === OrgProfile.UNDEFINED) 
                            continue;
                        prof = pr;
                        ok = true;
                        break;
                    }
                    let org1 = Utils.as(tt.getReferent(), OrganizationReferent);
                    if (org1 !== null && org1.findSlot(OrganizationReferent.ATTR_PROFILE, null, true) !== null) {
                        if ((org1.containsProfile(prof) || prof === OrgProfile.UNDEFINED)) {
                            ok = true;
                            prof = org1.profiles[0];
                            break;
                        }
                    }
                }
            }
            if (!ok) 
                return null;
        }
        if (prof === OrgProfile.UNDEFINED) 
            return null;
        let _org = new OrganizationReferent();
        _org.addProfile(prof);
        if (prof2 !== OrgProfile.UNDEFINED) 
            _org.addProfile(prof2);
        if (prof === OrgProfile.SPORT) 
            _org.addTypeStr("спортивный клуб");
        if (typ !== null) 
            _org.addTypeStr(typ);
        if (br !== null && ((tok === null || tok.endToken !== br.endToken.previous))) {
            let nam = null;
            if (tok !== null) {
                nam = MiscHelper.getTextValue(tok.endToken.next, br.endToken, GetTextAttr.NO);
                if (nam !== null) 
                    nam = (tok.termin.canonicText + " " + nam);
                else 
                    nam = tok.termin.canonicText;
            }
            else 
                nam = MiscHelper.getTextValue(br.beginToken, br.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
            if (nam !== null) 
                _org.addName(nam, true, null);
        }
        else if (tName1 !== null) {
            let nam = MiscHelper.getTextValue(t, tName1, GetTextAttr.NO);
            if (nam !== null) 
                nam = Utils.replaceString(nam, ". ", ".");
            _org.addName(nam, true, null);
        }
        else if (tok !== null) {
            _org.addName(tok.termin.canonicText, true, null);
            if (tok.termin.acronym !== null) 
                _org.addName(tok.termin.acronym, true, null);
            if (tok.termin.additionalVars !== null) {
                for (const v of tok.termin.additionalVars) {
                    _org.addName(v.canonicText, true, null);
                }
            }
        }
        else 
            return null;
        if (((((prof.value()) & (OrgProfile.MEDIA.value()))) !== (OrgProfile.UNDEFINED.value())) && t0.previous !== null) {
            if (t0.previous.isValue("ГРУППА", null) || t0.previous.isValue("РОКГРУППА", null)) {
                t0 = t0.previous;
                _org.addTypeStr(t0.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase());
                _org.addProfile(OrgProfile.CULTURE);
            }
            else if ((t0.previous.isValue("ЖУРНАЛ", null) || t0.previous.isValue("ИЗДАНИЕ", null) || t0.previous.isValue("ИЗДАТЕЛЬСТВО", null)) || t0.previous.isValue("АГЕНТСТВО", null)) {
                t0 = t0.previous;
                _org.addTypeStr(t0.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase());
                if (t0.previous === null || !t0.previous.isValue("АГЕНТСТВО", null)) 
                    _org.addProfile(OrgProfile.PRESS);
            }
        }
        let res = new ReferentToken(_org, t0, t);
        if (br !== null) 
            res.endToken = br.endToken;
        else if (tok !== null) 
            res.endToken = tok.endToken;
        else if (tName1 !== null) 
            res.endToken = tName1;
        else 
            return null;
        return res;
    }
    
    static _isStdPressEnd(t) {
        if (!(t instanceof TextToken)) 
            return false;
        let str = t.term;
        if ((((((((str === "NEWS" || str === "PRESS" || str === "PRESSE") || str === "ПРЕСС" || str === "НЬЮС") || str === "TIMES" || str === "TIME") || str === "ТАЙМС" || str === "POST") || str === "ПОСТ" || str === "TODAY") || str === "ТУДЕЙ" || str === "DAILY") || str === "ДЕЙЛИ" || str === "ИНФОРМ") || str === "INFORM") 
            return true;
        return false;
    }
    
    static _tryAttachOrgSportAssociations(t) {
        if (t === null) 
            return null;
        let cou = 0;
        let typ = null;
        let t1 = null;
        let _geo = null;
        if (t.getReferent() instanceof GeoReferent) {
            let rt = Utils.as(t, ReferentToken);
            if (rt.endToken.isValue("ФЕДЕРАЦИЯ", null) || rt.beginToken.isValue("ФЕДЕРАЦИЯ", null)) {
                typ = "федерация";
                _geo = Utils.as(t.getReferent(), GeoReferent);
            }
            t1 = t;
            if (t.previous !== null && t.previous.morph._class.isAdjective) {
                if (OrganizationAnalyzer.m_Sports.tryParse(t.previous, TerminParseAttr.NO) !== null) {
                    cou++;
                    t = t.previous;
                }
            }
        }
        else {
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt === null) 
                return null;
            if (npt.morph.number === MorphNumber.PLURAL) 
                return null;
            if (((npt.noun.isValue("АССОЦИАЦИЯ", null) || npt.noun.isValue("ФЕДЕРАЦИЯ", null) || npt.noun.isValue("СОЮЗ", null)) || npt.noun.isValue("СБОРНАЯ", null) || npt.noun.isValue("КОМАНДА", null)) || npt.noun.isValue("КЛУБ", null)) 
                typ = npt.noun.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase();
            else if ((t instanceof TextToken) && t.chars.isAllUpper && t.term === "ФК") 
                typ = "команда";
            else 
                return null;
            if (typ === "команда") 
                cou--;
            for (const a of npt.adjectives) {
                let tok = OrganizationAnalyzer.m_Sports.tryParse(a.beginToken, TerminParseAttr.NO);
                if (tok !== null) 
                    cou++;
                else if (a.beginToken.isValue("ОЛИМПИЙСКИЙ", null)) 
                    cou++;
            }
            if (t1 === null) 
                t1 = npt.endToken;
        }
        let t11 = t1;
        let propname = null;
        let delWord = null;
        for (let tt = t1.next; tt !== null; tt = tt.next) {
            if (tt.whitespacesBeforeCount > 3) 
                break;
            if (tt.isCommaAnd) 
                continue;
            if (tt.morph._class.isPreposition && !tt.morph._class.isAdverb && !tt.morph._class.isVerb) 
                continue;
            if (tt.getReferent() instanceof GeoReferent) {
                t1 = tt;
                _geo = Utils.as(tt.getReferent(), GeoReferent);
                if (typ === "сборная") 
                    cou++;
                continue;
            }
            if (tt.isValue("СТРАНА", null) && (tt instanceof TextToken)) {
                t1 = (t11 = tt);
                delWord = tt.term;
                continue;
            }
            let tok = OrganizationAnalyzer.m_Sports.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) {
                cou++;
                t1 = (t11 = (tt = tok.endToken));
                continue;
            }
            if (tt.chars.isAllLower || tt.getMorphClassInDictionary().isVerb) {
            }
            else 
                tok = OrganizationAnalyzer.m_PropNames.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) {
                propname = tok.termin.canonicText;
                cou++;
                t1 = (tt = tok.endToken);
                if (cou === 0 && typ === "команда") 
                    cou++;
                continue;
            }
            if (BracketHelper.canBeStartOfSequence(tt, true, false)) {
                let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                if (br === null) 
                    break;
                tok = OrganizationAnalyzer.m_PropNames.tryParse(tt.next, TerminParseAttr.NO);
                if (tok !== null || cou > 0) {
                    propname = MiscHelper.getTextValue(tt.next, br.endToken, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
                    cou++;
                    tt = (t1 = br.endToken);
                    continue;
                }
                break;
            }
            let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
            if (npt1 === null) 
                break;
            tok = OrganizationAnalyzer.m_Sports.tryParse(npt1.noun.beginToken, TerminParseAttr.NO);
            if (tok === null) 
                break;
            cou++;
            t1 = (t11 = (tt = tok.endToken));
        }
        if (cou <= 0) 
            return null;
        let _org = new OrganizationReferent();
        _org.addTypeStr(typ);
        if (typ === "федерация") 
            _org.addTypeStr("ассоциация");
        let _name = MiscHelper.getTextValue(t, t11, GetTextAttr.of((GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()) | (GetTextAttr.IGNOREGEOREFERENT.value())));
        if (_name !== null && delWord !== null) {
            if (_name.includes(" " + delWord)) 
                _name = Utils.replaceString(_name, " " + delWord, "");
        }
        if (_name !== null) 
            _name = Utils.replaceString(Utils.replaceString(_name, " РОССИЯ", ""), " РОССИИ", "");
        if (propname !== null) {
            _org.addName(propname, true, null);
            if (_name !== null) 
                _org.addTypeStr(_name.toLowerCase());
        }
        else if (_name !== null) 
            _org.addName(_name, true, null);
        if (_geo !== null) 
            _org.addGeoObject(_geo);
        _org.addProfile(OrgProfile.SPORT);
        return new ReferentToken(_org, t, t1);
    }
    
    static _initSport() {
        OrganizationAnalyzer.m_Sports = new TerminCollection();
        for (const s of ["акробатика;акробатический;акробат", "бадминтон;бадминтонный;бадминтонист", "баскетбол;баскетбольный;баскетболист", "бейсбол;бейсбольный;бейсболист", "биатлон;биатлонный;биатлонист", "бильярд;бильярдный;бильярдист", "бобслей;бобслейный;бобслеист", "боулинг", "боевое искуство", "бокс;боксерский;боксер", "борьба;борец", "водное поло", "волейбол;волейбольный;волейболист", "гандбол;гандбольный;гандболист", "гольф;гольфный;гольфист", "горнолыжный спорт", "слалом;;слаломист", "сквош", "гребля", "дзюдо;дзюдоистский;дзюдоист", "карате;;каратист", "керлинг;;керлингист", "коньки;конькобежный;конькобежец", "легкая атлетика;легкоатлетический;легкоатлет", "лыжных гонок", "мотоцикл;мотоциклетный;мотоциклист", "тяжелая атлетика;тяжелоатлетический;тяжелоатлет", "ориентирование", "плавание;;пловец", "прыжки", "регби;;регбист", "пятиборье", "гимнастика;гимнастический;гимнаст", "самбо;;самбист", "сумо;;сумист", "сноуборд;сноубордический;сноубордист", "софтбол;софтбольный;софтболист", "стрельба;стрелковый", "спорт;спортивный", "теннис;теннисный;теннисист", "триатлон", "тхэквондо", "ушу;;ушуист", "фехтование;фехтовальный;фехтовальщик", "фигурное катание;;фигурист", "фристайл;фристальный", "футбол;футбольный;футболист", "мини-футбол", "хоккей;хоккейный;хоккеист", "хоккей на траве", "шахматы;шахматный;шахматист", "шашки;шашечный"]) {
            let pp = Utils.splitString(s.toUpperCase(), ';', false);
            let t = new Termin();
            t.initByNormalText(pp[0], MorphLang.RU);
            if (pp.length > 1 && !Utils.isNullOrEmpty(pp[1])) 
                t.addVariant(pp[1], true);
            if (pp.length > 2 && !Utils.isNullOrEmpty(pp[2])) 
                t.addVariant(pp[2], true);
            OrganizationAnalyzer.m_Sports.add(t);
        }
        for (const s of ["байдарка", "каноэ", "лук", "трава", "коньки", "трамплин", "двоеборье", "батут", "вода", "шпага", "сабля", "лыжи", "скелетон"]) {
            OrganizationAnalyzer.m_Sports.add(Termin._new2419(s.toUpperCase(), s));
        }
        OrganizationAnalyzer.m_PropNames = new TerminCollection();
        for (const s of ["СПАРТАК", "ЦСКА", "ЗЕНИТ!", "ТЕРЕК", "КРЫЛЬЯ СОВЕТОВ", "ДИНАМО", "АНЖИ", "КУБАНЬ", "АЛАНИЯ", "ТОРПЕДО", "АРСЕНАЛ!", "ЛОКОМОТИВ", "МЕТАЛЛУРГ!", "РОТОР", "СКА", "СОКОЛ!", "ХИМИК!", "ШИННИК", "РУБИН", "ШАХТЕР", "САЛАВАТ ЮЛАЕВ", "ТРАКТОР!", "АВАНГАРД!", "АВТОМОБИЛИСТ!", "АТЛАНТ!", "ВИТЯЗЬ!", "НАЦИОНАЛЬНАЯ ХОККЕЙНАЯ ЛИГА;НХЛ", "КОНТИНЕНТАЛЬНАЯ ХОККЕЙНАЯ ЛИГА;КХЛ", "СОЮЗ ЕВРОПЕЙСКИХ ФУТБОЛЬНЫХ АССОЦИАЦИЙ;УЕФА;UEFA", "Женская теннисная ассоциация;WTA", "Международная федерация бокса;IBF", "Всемирная боксерская организация;WBO", "РЕАЛ", "МАНЧЕСТЕР ЮНАЙТЕД", "манчестер сити", "БАРСЕЛОНА!", "БАВАРИЯ!", "ЧЕЛСИ", "ЛИВЕРПУЛЬ!", "ЮВЕНТУС", "НАПОЛИ", "БОЛОНЬЯ", "ФУЛХЭМ", "ЭВЕРТОН", "ФИЛАДЕЛЬФИЯ", "ПИТТСБУРГ", "ИНТЕР!", "Аякс", "ФЕРРАРИ;FERRARI", "РЕД БУЛЛ;RED BULL", "МАКЛАРЕН;MCLAREN", "МАКЛАРЕН-МЕРСЕДЕС;MCLAREN-MERCEDES"]) {
            let ss = s.toUpperCase();
            let isBad = false;
            if (ss.endsWith("!")) {
                isBad = true;
                ss = ss.substring(0, 0 + ss.length - 1);
            }
            let pp = Utils.splitString(ss, ';', false);
            let t = Termin._new170(pp[0], OrgProfile.SPORT);
            if (!isBad) 
                t.tag2 = ss;
            if (pp.length > 1) {
                if (pp[1].length < 4) 
                    t.acronym = pp[1];
                else 
                    t.addVariant(pp[1], false);
            }
            OrganizationAnalyzer.m_PropNames.add(t);
        }
        for (const s of ["ИТАР ТАСС;ТАСС;Телеграфное агентство советского союза", "Интерфакс;Interfax", "REGNUM", "ЛЕНТА.РУ;Lenta.ru", "Частный корреспондент;ЧасКор", "РИА Новости;Новости!;АПН", "Росбалт;RosBalt", "УНИАН", "ИНФОРОС;inforos", "Эхо Москвы", "Сноб!", "Серебряный дождь", "Вечерняя Москва;Вечерка", "Московский Комсомолец;Комсомолка", "Коммерсантъ;Коммерсант", "Афиша", "Аргументы и факты;АИФ", "Викиновости", "РосБизнесКонсалтинг;РБК", "Газета.ру", "Русский Репортер!", "Ведомости", "Вести!", "Рамблер Новости", "Живой Журнал;ЖЖ;livejournal;livejournal.ru", "Новый Мир", "Новая газета", "Правда!", "Известия!", "Бизнес!", "Русская жизнь!", "НТВ Плюс", "НТВ", "ВГТРК", "ТНТ", "Муз ТВ;МузТВ", "АСТ", "Эксмо", "Астрель", "Терра!", "Финанс!", "Собеседник!", "Newsru.com", "Nature!", "Россия сегодня;Russia Today;RT!", "БЕЛТА", "Ассошиэйтед Пресс;Associated Press", "France Press;France Presse;Франс пресс;Agence France Presse;AFP", "СИНЬХУА", "Gallup", "Cable News Network;CNN", "CBS News", "ABC News", "GoogleNews;Google News", "FoxNews;Fox News", "Reuters;Рейтер", "British Broadcasting Corporation;BBC;БиБиСи;BBC News", "MSNBC", "Голос Америки", "Аль Джазира;Al Jazeera", "Радио Свобода", "Радио Свободная Европа", "Guardian;Гардиан", "Daily Telegraph", "Times;Таймс!", "Independent!", "Financial Times", "Die Welt", "Bild!", "La Pepublica;Република!", "Le Monde", "People Daily", "BusinessWeek", "Economist!", "Forbes;Форбс", "Los Angeles Times", "New York Times", "Wall Street Journal;WSJ", "Washington Post", "Le Figaro;Фигаро", "Bloomberg", "DELFI!"]) {
            let ss = s.toUpperCase();
            let isBad = false;
            if (ss.endsWith("!")) {
                isBad = true;
                ss = ss.substring(0, 0 + ss.length - 1);
            }
            let pp = Utils.splitString(ss, ';', false);
            let t = Termin._new170(pp[0], OrgProfile.MEDIA);
            if (!isBad) 
                t.tag2 = ss;
            for (let ii = 1; ii < pp.length; ii++) {
                if ((pp[ii].length < 4) && t.acronym === null) 
                    t.acronym = pp[ii];
                else 
                    t.addVariant(pp[ii], false);
            }
            OrganizationAnalyzer.m_PropNames.add(t);
        }
        for (const s of ["Машина времени!", "ДДТ", "Биттлз;Bittles", "ABBA;АББА", "Океан Эльзы;Океан Эльзи", "Аквариум!", "Крематорий!", "Наутилус;Наутилус Помпилиус!", "Пусси Райот;Пусси Риот;Pussy Riot", "Кино!", "Алиса!", "Агата Кристи!", "Чайф", "Ария!", "Земфира!", "Браво!", "Черный кофе!", "Воскресение!", "Урфин Джюс", "Сплин!", "Пикник!", "Мумий Троль", "Коррозия металла", "Арсенал!", "Ночные снайперы!", "Любэ", "Ласковый май!", "Noize MC", "Linkin Park", "ac dc", "green day!", "Pink Floyd;Пинк Флойд", "Depeche Mode", "Bon Jovi", "Nirvana;Нирвана!", "Queen;Квин!", "Nine Inch Nails", "Radioheads", "Pet Shop Boys", "Buggles"]) {
            let ss = s.toUpperCase();
            let isBad = false;
            if (ss.endsWith("!")) {
                isBad = true;
                ss = ss.substring(0, 0 + ss.length - 1);
            }
            let pp = Utils.splitString(ss, ';', false);
            let t = Termin._new170(pp[0], OrgProfile.MUSIC);
            if (!isBad) 
                t.tag2 = ss;
            for (let ii = 1; ii < pp.length; ii++) {
                if ((pp[ii].length < 4) && t.acronym === null) 
                    t.acronym = pp[ii];
                else 
                    t.addVariant(pp[ii], false);
            }
            OrganizationAnalyzer.m_PropNames.add(t);
        }
        OrganizationAnalyzer.m_PropPref = new TerminCollection();
        for (const s of ["ФАНАТ", "БОЛЕЛЬЩИК", "гонщик", "вратарь", "нападающий", "голкипер", "полузащитник", "полу-защитник", "центрфорвард", "центр-форвард", "форвард", "игрок", "легионер", "спортсмен"]) {
            OrganizationAnalyzer.m_PropPref.add(Termin._new170(s.toUpperCase(), OrgProfile.SPORT));
        }
        for (const s of ["защитник", "капитан", "пилот", "игра", "поле", "стадион", "гонка", "чемпионат", "турнир", "заезд", "матч", "кубок", "олипмиада", "финал", "полуфинал", "победа", "поражение", "разгром", "дивизион", "олипмиада", "финал", "полуфинал", "играть", "выигрывать", "выиграть", "проигрывать", "проиграть", "съиграть"]) {
            OrganizationAnalyzer.m_PropPref.add(Termin._new349(s.toUpperCase(), OrgProfile.SPORT, s));
        }
        for (const s of ["корреспондент", "фотокорреспондент", "репортер", "журналист", "тележурналист", "телеоператор", "главный редактор", "главред", "телеведущий", "редколлегия", "обозреватель", "сообщать", "сообщить", "передавать", "передать", "писать", "написать", "издавать", "пояснить", "пояснять", "разъяснить", "разъяснять", "сказать", "говорить", "спрашивать", "спросить", "отвечать", "ответить", "выяснять", "выяснить", "цитировать", "процитировать", "рассказать", "рассказывать", "информировать", "проинформировать", "поведать", "напечатать", "напоминать", "напомнить", "узнать", "узнавать", "репортаж", "интервью", "информации", "сведение", "ИА", "информагенство", "информагентство", "информационный", "газета", "журнал"]) {
            OrganizationAnalyzer.m_PropPref.add(Termin._new170(s.toUpperCase(), OrgProfile.MEDIA));
        }
        for (const s of ["сообщение", "статья", "номер", "журнал", "издание", "издательство", "агентство", "цитата", "редактор", "комментатор", "по данным", "оператор", "вышедший", "отчет", "вопрос", "читатель", "слушатель", "телезритель", "источник", "собеедник"]) {
            OrganizationAnalyzer.m_PropPref.add(Termin._new349(s.toUpperCase(), OrgProfile.MEDIA, s));
        }
        for (const s of ["музыкант", "певец", "певица", "ударник", "гитарист", "клавишник", "солист", "солистка", "исполнять", "исполнить", "концерт", "гастроль", "выступление", "известный", "известнейший", "популярный", "популярнейший", "рокгруппа", "панкгруппа", "артгруппа", "группа", "пластинка", "грампластинка", "концертный", "музыка", "запись", "студия"]) {
            OrganizationAnalyzer.m_PropPref.add(Termin._new170(s.toUpperCase(), OrgProfile.MUSIC));
        }
    }
    
    static tryAttachArmy(t) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (!(t instanceof NumberToken) || t.whitespacesAfterCount > 2) 
            return null;
        let typ = OrgItemTypeToken.tryAttach(t.next, true);
        if (typ === null) 
            return null;
        if (typ.root !== null && typ.root.profiles.includes(OrgProfile.ARMY)) {
            let rt = OrganizationAnalyzer.tryAttachOrg(t.next, OrganizationAnalyzerAttachType.HIGH, null, false, -1);
            if (rt !== null) {
                if (rt.beginToken === typ.beginToken) {
                    rt.beginToken = t;
                    rt.referent.number = t.value.toString();
                }
                return rt;
            }
            if (typ.typ === "корпус") 
                return null;
            let _org = new OrganizationReferent();
            _org.addType(typ, true);
            _org.number = t.value.toString();
            return new ReferentToken(_org, t, typ.endToken);
        }
        return null;
    }
    
    get name() {
        return OrganizationAnalyzer.ANALYZER_NAME;
    }
    
    clone() {
        return new OrganizationAnalyzer();
    }
    
    get caption() {
        return "Организации";
    }
    
    get description() {
        return "Организации, предприятия, компании...";
    }
    
    get typeSystem() {
        return [MetaOrganization.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(OrgProfile.UNIT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("dep.png"));
        res.put(OrgProfile.UNION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("party.png"));
        res.put(OrgProfile.COMPETITION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("festival.png"));
        res.put(OrgProfile.HOLDING.toString(), PullentiNerCoreInternalResourceHelper.getBytes("holding.png"));
        res.put(OrgProfile.STATE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("gov.png"));
        res.put(OrgProfile.FINANCE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("bank.png"));
        res.put(OrgProfile.EDUCATION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("study.png"));
        res.put(OrgProfile.SCIENCE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("science.png"));
        res.put(OrgProfile.INDUSTRY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("factory.png"));
        res.put(OrgProfile.TRADE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("trade.png"));
        res.put(OrgProfile.POLICY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("politics.png"));
        res.put(OrgProfile.JUSTICE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("justice.png"));
        res.put(OrgProfile.ENFORCEMENT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("gov.png"));
        res.put(OrgProfile.ARMY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("military.png"));
        res.put(OrgProfile.SPORT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("sport.png"));
        res.put(OrgProfile.RELIGION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("church.png"));
        res.put(OrgProfile.MUSIC.toString(), PullentiNerCoreInternalResourceHelper.getBytes("music.png"));
        res.put(OrgProfile.MEDIA.toString(), PullentiNerCoreInternalResourceHelper.getBytes("media.png"));
        res.put(OrgProfile.PRESS.toString(), PullentiNerCoreInternalResourceHelper.getBytes("press.png"));
        res.put(OrgProfile.HOTEL.toString(), PullentiNerCoreInternalResourceHelper.getBytes("hotel.png"));
        res.put(OrgProfile.MEDICINE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("medicine.png"));
        res.put(OrgProfile.TRANSPORT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("train.png"));
        res.put(OrganizationKind.BANK.toString(), PullentiNerCoreInternalResourceHelper.getBytes("bank.png"));
        res.put(OrganizationKind.CULTURE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("culture.png"));
        res.put(OrganizationKind.DEPARTMENT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("dep.png"));
        res.put(OrganizationKind.FACTORY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("factory.png"));
        res.put(OrganizationKind.GOVENMENT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("gov.png"));
        res.put(OrganizationKind.MEDICAL.toString(), PullentiNerCoreInternalResourceHelper.getBytes("medicine.png"));
        res.put(OrganizationKind.PARTY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("party.png"));
        res.put(OrganizationKind.STUDY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("study.png"));
        res.put(OrganizationKind.FEDERATION.toString(), PullentiNerCoreInternalResourceHelper.getBytes("federation.png"));
        res.put(OrganizationKind.CHURCH.toString(), PullentiNerCoreInternalResourceHelper.getBytes("church.png"));
        res.put(OrganizationKind.MILITARY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("military.png"));
        res.put(OrganizationKind.AIRPORT.toString(), PullentiNerCoreInternalResourceHelper.getBytes("avia.png"));
        res.put(OrganizationKind.FESTIVAL.toString(), PullentiNerCoreInternalResourceHelper.getBytes("festival.png"));
        res.put(MetaOrganization.ORG_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("org.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === OrganizationReferent.OBJ_TYPENAME) 
            return new OrganizationReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return [GeoReferent.OBJ_TYPENAME, AddressReferent.OBJ_TYPENAME];
    }
    
    get progressWeight() {
        return 45;
    }
    
    createAnalyzerData() {
        return new OrgAnalyzerData();
    }
    
    static getData(t) {
        if (t === null) 
            return null;
        return Utils.as(t.kit.getAnalyzerDataByAnalyzerName(OrganizationAnalyzer.ANALYZER_NAME), OrgAnalyzerData);
    }
    
    process(kit) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        OrgItemTypeToken.initialize();
        let ad = Utils.as(kit.getAnalyzerData(this), OrgAnalyzerData);
        let tlen = kit.sofa.text.length;
        if (kit.sofa.ignoredEndChar > 0) 
            tlen = kit.sofa.ignoredBeginChar + ((tlen - kit.sofa.ignoredEndChar));
        if (tlen > 400000) 
            ad.largeTextRegim = true;
        else 
            ad.largeTextRegim = false;
        OrgItemTypeToken.SPEED_REGIME = true;
        OrgItemTypeToken.prepareAllData(kit.firstToken);
        ad.tRegime = true;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            t.innerBool = false;
        }
        let steps = 2;
        let max = steps;
        let delta = 100000;
        let parts = Utils.intDiv(((tlen + delta) - 1), delta);
        if (parts === 0) 
            parts = 1;
        max *= parts;
        let cur = 0;
        for (let step = 0; step < steps; step++) {
            let nextPos = delta;
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                if (t.beginChar > nextPos) {
                    nextPos += delta;
                    if (nextPos <= t.beginChar) 
                        nextPos = t.beginChar + delta;
                    cur++;
                    if (cur > max) 
                        cur = max;
                    if (!this.onProgress(cur, max, kit)) 
                        return;
                }
                if (t.isValue("СК", null)) {
                }
                if (step > 0 && (t instanceof ReferentToken) && (t.getReferent() instanceof OrganizationReferent)) {
                    let mt = OrganizationAnalyzer._checkAliasAfter(Utils.as(t, ReferentToken), t.next);
                    if (mt !== null) {
                        if (ad !== null) {
                            let term = new Termin();
                            term.initBy(mt.beginToken, mt.endToken.previous, t.getReferent(), false);
                            ad.aliases.add(term);
                        }
                        let rt = ReferentToken._new1092(t.getReferent(), t, mt.endToken, t.morph);
                        kit.embedToken(rt);
                        t = rt;
                    }
                }
                for (let kk = 0; kk < 5; kk++) {
                    let rts = OrganizationAnalyzer.tryAttachOrgs(t, step);
                    if (rts === null || rts.length === 0) 
                        break;
                    if (!MetaToken.check(rts)) 
                        break;
                    let emb = false;
                    let tt0 = t;
                    for (const rt of rts) {
                        if (!rt.referent.checkCorrection()) 
                            continue;
                        rt.referent = ad.registerReferent(rt.referent);
                        if (rt.beginToken.getReferent() === rt.referent || rt.endToken.getReferent() === rt.referent) 
                            continue;
                        kit.embedToken(rt);
                        emb = true;
                        if (rt.beginChar <= t.beginChar) 
                            t = rt;
                    }
                    if ((rts.length === 1 && t === rts[0] && (t.next instanceof ReferentToken)) && (t.next.getReferent() instanceof OrganizationReferent)) {
                        let org0 = Utils.as(rts[0].referent, OrganizationReferent);
                        let org1 = Utils.as(t.next.getReferent(), OrganizationReferent);
                        if (org1.higher === null && OrgOwnershipHelper.canBeHigher(org0, org1, false) && !OrgOwnershipHelper.canBeHigher(org1, org0, false)) {
                            let rtt = Utils.as(t.next, ReferentToken);
                            kit.debedToken(rtt);
                            org1.higher = org0;
                            let rt1 = ReferentToken._new1092(ad.registerReferent(org1), t, rtt.endToken, t.next.morph);
                            kit.embedToken(rt1);
                            t = rt1;
                        }
                    }
                    if (emb && !(t instanceof ReferentToken)) 
                        continue;
                    break;
                }
                if (step > 0) {
                    let rt = OrganizationAnalyzer.checkOwnership(t);
                    if (rt !== null) {
                        kit.embedToken(rt);
                        t = rt;
                    }
                }
                if ((t instanceof ReferentToken) && (t.getReferent() instanceof OrganizationReferent)) {
                    let rt0 = Utils.as(t, ReferentToken);
                    for (let kk = 0; rt0 !== null && (kk < 4); kk++) {
                        let rt00 = this.tryAttachOrgBefore(rt0);
                        if (rt00 === null) 
                            break;
                        rt0 = rt00;
                        OrganizationAnalyzer._doPostAnalyze(rt0);
                        rt0.referent = ad.registerReferent(rt0.referent);
                        kit.embedToken(rt0);
                        t = rt0;
                    }
                }
                if (step > 0 && (t instanceof ReferentToken) && (t.getReferent() instanceof OrganizationReferent)) {
                    let mt = OrganizationAnalyzer._checkAliasAfter(Utils.as(t, ReferentToken), t.next);
                    if (mt !== null) {
                        if (ad !== null) {
                            let term = new Termin();
                            term.initBy(mt.beginToken, mt.endToken.previous, t.getReferent(), false);
                            ad.aliases.add(term);
                        }
                        let rt = ReferentToken._new1092(t.getReferent(), t, mt.endToken, t.morph);
                        kit.embedToken(rt);
                        t = rt;
                    }
                }
            }
            if (ad.referents.length === 0) {
                if (!kit.miscData.containsKey("o2step")) 
                    break;
            }
        }
        let list = new Array();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let _org = Utils.as(t.getReferent(), OrganizationReferent);
            if (_org === null) 
                continue;
            let t1 = t.next;
            if (((t1 !== null && t1.isChar('(') && t1.next !== null) && (t1.next.getReferent() instanceof OrganizationReferent) && t1.next.next !== null) && t1.next.next.isChar(')')) {
                let org0 = Utils.as(t1.next.getReferent(), OrganizationReferent);
                if (org0 === _org || _org.higher === org0) {
                    let rt1 = ReferentToken._new1092(_org, t, t1.next.next, t.morph);
                    kit.embedToken(rt1);
                    t = rt1;
                    t1 = t.next;
                }
                else if (_org.higher === null && OrgOwnershipHelper.canBeHigher(org0, _org, false) && !OrgOwnershipHelper.canBeHigher(_org, org0, false)) {
                    _org.higher = org0;
                    let rt1 = ReferentToken._new1092(_org, t, t1.next.next, t.morph);
                    kit.embedToken(rt1);
                    t = rt1;
                    t1 = t.next;
                }
            }
            let ofTok = null;
            if (t1 !== null) {
                if (t1.isCharOf(",") || t1.isHiphen) 
                    t1 = t1.next;
                else if (!kit.ontoRegime && t1.isChar(';')) 
                    t1 = t1.next;
                else if (t1.isValue("ПРИ", null) || t1.isValue("OF", null) || t1.isValue("AT", null)) {
                    ofTok = Utils.as(t1, TextToken);
                    t1 = t1.next;
                }
            }
            if (t1 === null) 
                break;
            let org1 = Utils.as(t1.getReferent(), OrganizationReferent);
            if (org1 === null) 
                continue;
            if (ofTok === null) {
                if (_org.higher === null) {
                    if (!OrgOwnershipHelper.canBeHigher(org1, _org, false)) {
                        let ok = false;
                        if (t1.previous === t && (t1.whitespacesAfterCount < 3)) {
                            let pp = t.kit.processReferent("PERSON", t1.next, null);
                            if (pp !== null) 
                                ok = true;
                        }
                        if ((t1.previous === t && (t1.whitespacesBeforeCount < 3) && _org.names.length === 0) && _org.number === null && _org.profiles.includes(OrgProfile.UNIT)) {
                            if (OrgOwnershipHelper.canBeHigher(org1, _org, false)) 
                                ok = true;
                        }
                        if (!ok) 
                            continue;
                    }
                }
            }
            if (_org.higher !== null) {
                if (!_org.higher.canBeEquals(org1, ReferentsEqualType.WITHINONETEXT)) 
                    continue;
            }
            list.splice(0, list.length);
            list.push(Utils.as(t, ReferentToken));
            list.push(Utils.as(t1, ReferentToken));
            if (ofTok !== null && _org.higher === null) {
                for (let t2 = t1.next; t2 !== null; t2 = t2.next) {
                    if (((t2 instanceof TextToken) && t2.term === ofTok.term && t2.next !== null) && (t2.next.getReferent() instanceof OrganizationReferent)) {
                        t2 = t2.next;
                        if (org1.higher !== null) {
                            if (!org1.higher.canBeEquals(t2.getReferent(), ReferentsEqualType.WITHINONETEXT)) 
                                break;
                        }
                        list.push(Utils.as(t2, ReferentToken));
                        org1 = Utils.as(t2.getReferent(), OrganizationReferent);
                    }
                    else 
                        break;
                }
            }
            let rt0 = list[list.length - 1];
            for (let i = list.length - 2; i >= 0; i--) {
                _org = Utils.as(list[i].referent, OrganizationReferent);
                org1 = Utils.as(rt0.referent, OrganizationReferent);
                if (_org.higher === null) {
                    _org.higher = org1;
                    _org = Utils.as(ad.registerReferent(_org), OrganizationReferent);
                }
                let rt = new ReferentToken(_org, list[i], rt0);
                kit.embedToken(rt);
                t = rt;
                rt0 = rt;
            }
        }
        let owners = new Hashtable();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let _org = Utils.as(t.getReferent(), OrganizationReferent);
            if (_org === null) 
                continue;
            let hi = _org.higher;
            if (hi === null) 
                continue;
            for (const ty of _org.types) {
                let li = [ ];
                let wrapli2458 = new RefOutArgWrapper();
                let inoutres2459 = owners.tryGetValue(ty, wrapli2458);
                li = wrapli2458.value;
                if (!inoutres2459) 
                    owners.put(ty, (li = new Array()));
                let childs = null;
                if (!li.includes(hi)) {
                    li.push(hi);
                    hi.tag = (childs = new Array());
                }
                else 
                    childs = Utils.as(hi.tag, Array);
                if (childs !== null && !childs.includes(_org)) 
                    childs.push(_org);
            }
        }
        let owns = new Array();
        let lastMvdOrg = null;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let _org = Utils.as(t.getReferent(), OrganizationReferent);
            if (_org === null) 
                continue;
            if (OrganizationAnalyzer._isMvdOrg(_org) !== null) 
                lastMvdOrg = t;
            if (_org.higher !== null) 
                continue;
            owns.splice(0, owns.length);
            for (const ty of _org.types) {
                let li = [ ];
                let wrapli2460 = new RefOutArgWrapper();
                let inoutres2461 = owners.tryGetValue(ty, wrapli2460);
                li = wrapli2460.value;
                if (!inoutres2461) 
                    continue;
                for (const h of li) {
                    if (!owns.includes(h)) 
                        owns.push(h);
                }
            }
            if (owns.length !== 1) 
                continue;
            if (OrgOwnershipHelper.canBeHigher(owns[0], _org, true)) {
                let childs = Utils.as(owns[0].tag, Array);
                if (childs === null) 
                    continue;
                let hasNum = false;
                let hasGeo = false;
                for (const oo of childs) {
                    if (oo.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) 
                        hasGeo = true;
                    if (oo.findSlot(OrganizationReferent.ATTR_NUMBER, null, true) !== null) 
                        hasNum = true;
                }
                if (hasNum !== (_org.findSlot(OrganizationReferent.ATTR_NUMBER, null, true) !== null)) 
                    continue;
                if (hasGeo !== (_org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null)) 
                    continue;
                _org.higher = owns[0];
                if (_org.kind !== OrganizationKind.DEPARTMENT) 
                    _org.higher = null;
            }
        }
        for (let t = lastMvdOrg; t !== null; t = t.previous) {
            if (t.isIgnored) 
                continue;
            if (!(t instanceof ReferentToken)) 
                continue;
            let mvd = OrganizationAnalyzer._isMvdOrg(Utils.as(t.getReferent(), OrganizationReferent));
            if (mvd === null) 
                continue;
            let t1 = null;
            let br = false;
            for (let tt = t.previous; tt !== null; tt = tt.previous) {
                if (tt.isChar(')')) {
                    br = true;
                    continue;
                }
                if (br) {
                    if (tt.isChar('(')) 
                        br = false;
                    continue;
                }
                if (!(tt instanceof TextToken)) 
                    break;
                if (tt.lengthChar < 2) 
                    continue;
                if (tt.chars.isAllUpper || ((!tt.chars.isAllUpper && !tt.chars.isAllLower && !tt.chars.isCapitalUpper))) 
                    t1 = tt;
                break;
            }
            if (t1 === null) 
                continue;
            let t0 = t1;
            if ((t0.previous instanceof TextToken) && (t0.whitespacesBeforeCount < 2) && t0.previous.lengthChar >= 2) {
                if (t0.previous.chars.isAllUpper || ((!t0.previous.chars.isAllUpper && !t0.previous.chars.isAllLower && !t0.previous.chars.isCapitalUpper))) 
                    t0 = t0.previous;
            }
            let nam = MiscHelper.getTextValue(t0, t1, GetTextAttr.NO);
            if ((nam === "ОВД" || nam === "ГУВД" || nam === "УВД") || nam === "ГУ" || nam === "МУ") 
                continue;
            let mc = t0.getMorphClassInDictionary();
            if (!mc.isUndefined) 
                continue;
            mc = t1.getMorphClassInDictionary();
            if (!mc.isUndefined) 
                continue;
            let _org = new OrganizationReferent();
            _org.addProfile(OrgProfile.UNIT);
            _org.addName(nam, true, null);
            _org.higher = mvd;
            let rt = new ReferentToken(ad.registerReferent(_org), t0, t1);
            kit.embedToken(rt);
            t = rt.next;
            if (t === null) 
                break;
        }
        ad.tRegime = false;
    }
    
    static _isMvdOrg(_org) {
        if (_org === null) 
            return null;
        let res = null;
        for (let i = 0; i < 5; i++) {
            if (res === null) {
                for (const s of _org.slots) {
                    if (s.typeName === OrganizationReferent.ATTR_TYPE) {
                        res = _org;
                        break;
                    }
                }
            }
            if (_org.findSlot(OrganizationReferent.ATTR_NAME, "МВД", true) !== null || _org.findSlot(OrganizationReferent.ATTR_NAME, "ФСБ", true) !== null) 
                return (res != null ? res : _org);
            _org = _org.higher;
            if (_org === null) 
                break;
        }
        return null;
    }
    
    static _checkAliasAfter(rt, t) {
        if ((t !== null && t.isChar('<') && t.next !== null) && t.next.next !== null && t.next.next.isChar('>')) 
            t = t.next.next.next;
        if (t === null || t.next === null || !t.isChar('(')) 
            return null;
        t = t.next;
        let isNext = false;
        if (t.isValue("ДАЛЕЕ", null) || t.isValue("ДАЛІ", null)) {
            t = t.next;
            isNext = true;
        }
        else if (t.isValue("HEREINAFTER", null) || t.isValue("ABBREVIATED", null) || t.isValue("HEREAFTER", null)) {
            t = t.next;
            if (t !== null && t.isValue("REFER", null)) 
                t = t.next;
        }
        else 
            return null;
        while (t !== null) {
            if (!(t instanceof TextToken)) 
                break;
            else if (!t.chars.isLetter) 
                t = t.next;
            else if ((t.morph._class.isPreposition || t.morph._class.isMisc || t.isValue("ИМЕНОВАТЬ", null)) || t.isValue("ТЕКСТ", null) || t.isValue("ТАКЖЕ", null)) 
                t = t.next;
            else 
                break;
        }
        if (t === null) 
            return null;
        if (isNext) {
            if (t.isValue("ПОЛОЖЕНИЕ", null)) 
                return null;
        }
        let t1 = null;
        let nli = 0;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) {
                nli++;
                if (nli > 1) 
                    break;
            }
            else if (tt.isChar(')')) {
                t1 = tt.previous;
                break;
            }
        }
        if (t1 === null) 
            return null;
        let mt = new MetaToken(t, t1.next);
        let nam = MiscHelper.getTextValue(t, t1, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
        mt.tag = nam;
        if (nam.indexOf(' ') < 0) {
            for (let tt = rt.beginToken; tt !== null && tt.endChar <= rt.endChar; tt = tt.next) {
                if (tt.isValue(Utils.asString(mt.tag), null)) 
                    return mt;
            }
            return null;
        }
        return mt;
    }
    
    processReferent(begin, param) {
        return OrganizationAnalyzer.processReferentStat(begin, param);
    }
    
    static processReferentStat(begin, param = null) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        if (begin === null) 
            return null;
        let ad = OrganizationAnalyzer.getData(begin);
        if (ad === null) 
            return null;
        if (ad.level > 2) 
            return null;
        if (param === "TYPE") {
            ad.level++;
            let ty = OrgItemTypeToken.tryAttach(begin, false);
            ad.level--;
            if (ty !== null && ty.beginToken === begin) {
                let _org = new OrganizationReferent();
                _org.addType(ty, false);
                return ReferentToken._new1092(_org, begin, ty.endToken, ty.morph);
            }
        }
        if (param === "MINTYPE") {
            ad.level++;
            let ty = OrgItemTypeToken.tryAttachPureKeywords(begin);
            ad.level--;
            if (ty === null) 
                return null;
            let _org = new OrganizationReferent();
            _org.addType(ty, false);
            return ReferentToken._new1092(_org, begin, ty.endToken, ty.morph);
        }
        ad.level++;
        let rt = OrganizationAnalyzer.tryAttachOrg(begin, (param === "STRONG" ? OrganizationAnalyzerAttachType.HIGH : OrganizationAnalyzerAttachType.NORMAL), null, false, -1);
        if (rt === null) 
            rt = OrgItemEngItem.tryAttachOrg(begin, false);
        if (rt === null) 
            rt = OrgItemEngItem.tryAttachOrg(begin, true);
        if (rt === null) 
            rt = OrgItemTypeToken.tryAttachReferenceToExistOrg(begin);
        ad.level--;
        if (rt === null) 
            return null;
        rt.data = ad;
        return rt;
    }
    
    static tryAttachOrgs(t, step) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        if (t === null) 
            return null;
        if (t.chars.isLatinLetter && MiscHelper.isEngArticle(t)) {
            let res11 = OrganizationAnalyzer.tryAttachOrgs(t.next, step);
            if (res11 !== null && res11.length > 0) {
                res11[0].beginToken = t;
                return res11;
            }
        }
        let rt = null;
        let typ = null;
        if (step === 0 || t.innerBool || t.tag !== null) {
            typ = OrgItemTypeToken.tryAttach(t, false);
            if (typ !== null) 
                t.innerBool = true;
            if (typ === null || typ.chars.isLatinLetter) {
                let ltyp = OrgItemEngItem.tryAttach(t, false);
                if (ltyp !== null) 
                    t.innerBool = true;
                else if (t.chars.isLatinLetter) {
                    let rte = OrgItemEngItem.tryAttachOrg(t, false);
                    if (rte !== null) {
                        OrganizationAnalyzer._doPostAnalyze(rte);
                        let ree = new Array();
                        ree.push(rte);
                        return ree;
                    }
                }
            }
        }
        let rt00 = OrganizationAnalyzer.tryAttachSpec(t);
        if (rt00 === null) 
            rt00 = OrganizationAnalyzer._tryAttachOrgByAlias(t);
        if (rt00 !== null) {
            let res0 = new Array();
            OrganizationAnalyzer._doPostAnalyze(rt00);
            res0.push(rt00);
            return res0;
        }
        if (typ !== null) {
            if (typ.root === null || !typ.root.isPurePrefix) {
                if (((typ.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) {
                    let t1 = typ.endToken;
                    let ok = true;
                    let ok1 = false;
                    if (t1.next !== null && t1.next.isChar(',')) {
                        t1 = t1.next;
                        ok1 = true;
                        if (t1.next !== null && t1.next.isValue("КАК", null)) 
                            t1 = t1.next;
                        else 
                            ok = false;
                    }
                    if (t1.next !== null && t1.next.isValue("КАК", null)) {
                        t1 = t1.next;
                        ok1 = true;
                    }
                    if (t1.next !== null && t1.next.isChar(':')) 
                        t1 = t1.next;
                    if (t1 === t && t1.isNewlineAfter) 
                        ok = false;
                    rt = null;
                    if (ok) {
                        if (!ok1 && typ.coef > 0) 
                            ok1 = true;
                        if (ok1) 
                            rt = OrganizationAnalyzer.tryAttachOrg(t1.next, OrganizationAnalyzerAttachType.MULTIPLE, typ, false, -1);
                    }
                    if (rt !== null) {
                        OrganizationAnalyzer._doPostAnalyze(rt);
                        let res = new Array();
                        res.push(rt);
                        let _org = Utils.as(rt.referent, OrganizationReferent);
                        if (ok1) 
                            rt.beginToken = t;
                        t1 = rt.endToken.next;
                        ok = true;
                        for (; t1 !== null; t1 = t1.next) {
                            if (t1.isNewlineBefore) {
                                ok = false;
                                break;
                            }
                            let last = false;
                            if (t1.isChar(',')) {
                            }
                            else if (t1.isAnd || t1.isOr) 
                                last = true;
                            else {
                                if (res.length < 2) 
                                    ok = false;
                                break;
                            }
                            t1 = t1.next;
                            let typ1 = OrgItemTypeToken.tryAttach(t1, true);
                            if (typ1 !== null) {
                                ok = false;
                                break;
                            }
                            rt = OrganizationAnalyzer.tryAttachOrg(t1, OrganizationAnalyzerAttachType.MULTIPLE, typ, false, -1);
                            if (rt !== null && rt.beginToken === rt.endToken) {
                                if (!rt.beginToken.getMorphClassInDictionary().isUndefined && rt.beginToken.chars.isAllUpper) 
                                    rt = null;
                            }
                            if (rt === null) {
                                if (res.length < 2) 
                                    ok = false;
                                break;
                            }
                            OrganizationAnalyzer._doPostAnalyze(rt);
                            res.push(rt);
                            if (res.length > 100) {
                                ok = false;
                                break;
                            }
                            _org = Utils.as(rt.referent, OrganizationReferent);
                            _org.addType(typ, false);
                            if (last) 
                                break;
                            t1 = rt.endToken;
                        }
                        if (ok && res.length > 1) 
                            return res;
                    }
                }
            }
        }
        rt = null;
        if (typ !== null && ((typ.isDep || typ.canBeDepBeforeOrganization))) {
            rt = OrganizationAnalyzer.tryAttachDepBeforeOrg(typ, null);
            if (rt === null) 
                rt = OrganizationAnalyzer.tryAttachDepAfterOrg(typ);
            if (rt === null) 
                rt = OrganizationAnalyzer.tryAttachOrg(typ.endToken.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
        }
        let ad = OrganizationAnalyzer.getData(t);
        let tt = Utils.as(t, TextToken);
        if (((step === 0 && rt === null && tt !== null) && !tt.chars.isAllLower && tt.chars.isCyrillicLetter) && tt.getMorphClassInDictionary().isUndefined) {
            let s = tt.term;
            if ((((s.startsWith("ГУ") || s.startsWith("РУ") || s.startsWith("МУ")) || s.startsWith("МО"))) && s.length > 3 && ((s.length > 4 || s === "ГУВД"))) {
                tt.term = (s === "ГУВД" ? "МВД" : tt.term.substring(2));
                let inv = tt.invariantPrefixLengthOfMorphVars;
                tt.invariantPrefixLengthOfMorphVars = 0;
                let max = tt.maxLengthOfMorphVars;
                tt.maxLengthOfMorphVars = tt.term.length;
                OrgItemTypeToken.recalcData(tt);
                rt = OrganizationAnalyzer.tryAttachOrg(tt, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                tt.term = s;
                tt.invariantPrefixLengthOfMorphVars = inv;
                tt.maxLengthOfMorphVars = max;
                OrgItemTypeToken.recalcData(tt);
                if (rt !== null) {
                    if (ad !== null && ad.locOrgs.tryAttach(tt, null, false) !== null) 
                        rt = null;
                    if (t.kit.ontology !== null && t.kit.ontology.attachToken(OrganizationReferent.OBJ_TYPENAME, tt) !== null) 
                        rt = null;
                }
                if (rt !== null) {
                    typ = new OrgItemTypeToken(tt, tt);
                    typ.typ = (s.startsWith("ГУ") ? "главное управление" : (s.startsWith("МУ") ? "межмуниципальное" : (s.startsWith("МО") ? "межмуниципальное отделение" : "региональное управление")));
                    if (s.startsWith("МО")) 
                        typ.root = OrgItemTypeToken.M_MEJMUN_OTDEL;
                    let rt0 = OrganizationAnalyzer.tryAttachDepBeforeOrg(typ, rt);
                    if (rt0 !== null) {
                        if (ad !== null) 
                            rt.referent = ad.registerReferent(rt.referent);
                        rt.referent.addOccurence(new TextAnnotation(t, rt.endToken, rt.referent));
                        rt0.referent.higher = Utils.as(rt.referent, OrganizationReferent);
                        let li2 = new Array();
                        OrganizationAnalyzer._doPostAnalyze(rt0);
                        li2.push(rt0);
                        return li2;
                    }
                }
            }
            else if ((((((((((s[0] === 'У' && s.length > 3 && tt.getMorphClassInDictionary().isUndefined)) || s === "ОВД" || s === "РОВД") || s === "ОМВД" || s === "ОСБ") || s === "УПФ" || s === "УФНС") || s === "ИФНС" || s === "ИНФС") || s === "УВД" || s === "УФМС") || s === "УФСБ" || s === "ОУФМС") || s === "ОФМС" || s === "УФК") || s === "УФССП") {
                if (s === "ОВД" || s === "УВД" || s === "РОВД") 
                    tt.term = "МВД";
                else if (s === "ОСБ") 
                    tt.term = "СБЕРБАНК";
                else if (s === "УПФ") 
                    tt.term = "ПФР";
                else if (s === "УФНС" || s === "ИФНС" || s === "ИНФС") 
                    tt.term = "ФНС";
                else if (s === "УФМС" || s === "ОУФМС" || s === "ОФМС") 
                    tt.term = "ФМС";
                else 
                    tt.term = tt.term.substring(1);
                let inv = tt.invariantPrefixLengthOfMorphVars;
                tt.invariantPrefixLengthOfMorphVars = 0;
                let max = tt.maxLengthOfMorphVars;
                tt.maxLengthOfMorphVars = tt.term.length;
                OrgItemTypeToken.recalcData(tt);
                rt = OrganizationAnalyzer.tryAttachOrg(tt, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                tt.term = s;
                tt.invariantPrefixLengthOfMorphVars = inv;
                tt.maxLengthOfMorphVars = max;
                OrgItemTypeToken.recalcData(tt);
                if (rt !== null) {
                    let org1 = Utils.as(rt.referent, OrganizationReferent);
                    if (org1.geoObjects.length === 0 && rt.endToken.next !== null) {
                        let g = Utils.as(rt.endToken.next.getReferent(), GeoReferent);
                        if (g !== null && g.isState) {
                            org1.addGeoObject(g);
                            rt.endToken = rt.endToken.next;
                        }
                    }
                    typ = new OrgItemTypeToken(tt, tt);
                    typ.typ = (s[0] === 'О' ? "отделение" : (s[0] === 'И' ? "инспекция" : "управление"));
                    let gen = (s[0] === 'И' ? MorphGender.FEMINIE : MorphGender.NEUTER);
                    if (s.startsWith("ОУ")) 
                        typ.typ = "управление";
                    else if (s.startsWith("РО")) {
                        typ.typ = "отдел";
                        typ.altTyp = "районный отдел";
                        typ.nameIsName = true;
                        gen = MorphGender.MASCULINE;
                    }
                    let rt0 = OrganizationAnalyzer.tryAttachDepBeforeOrg(typ, rt);
                    if (rt0 !== null) {
                        let org0 = Utils.as(rt0.referent, OrganizationReferent);
                        org0.addProfile(OrgProfile.UNIT);
                        if (org0.number === null && !tt.isNewlineAfter) {
                            let num = OrgItemNumberToken.tryAttach(tt.next, true, typ);
                            if (num !== null) {
                                org0.number = num.number;
                                rt0.endToken = num.endToken;
                            }
                        }
                        let _geo = null;
                        if (rt0.referent.findSlot(OrganizationReferent.ATTR_GEO, null, true) === null) {
                            if ((((_geo = OrganizationAnalyzer.isGeo(rt0.endToken.next, false)))) !== null) {
                                if (rt0.referent.addGeoObject(_geo)) 
                                    rt0.endToken = OrganizationAnalyzer.getGeoEndToken(_geo, rt0.endToken.next);
                            }
                            else if (rt0.endToken.whitespacesAfterCount < 3) {
                                let nam = OrgItemNameToken.tryAttach(rt0.endToken.next, null, false, true);
                                if (nam !== null && !nam.value.startsWith("СУБЪЕКТ")) {
                                    if ((((_geo = OrganizationAnalyzer.isGeo(nam.endToken.next, false)))) !== null) {
                                        if (rt0.referent.addGeoObject(_geo)) 
                                            rt0.endToken = OrganizationAnalyzer.getGeoEndToken(_geo, nam.endToken.next);
                                        rt0.referent.addName(nam.value, true, null);
                                    }
                                }
                            }
                        }
                        if (rt0.referent.slots.length > 3) {
                            if (tt.previous !== null && ((tt.previous.morph._class.isAdjective && !tt.previous.morph._class.isVerb)) && tt.whitespacesBeforeCount === 1) {
                                let adj = null;
                                try {
                                    adj = MorphologyService.getWordform(tt.previous.getSourceText().toUpperCase(), MorphBaseInfo._new2464(MorphClass.ADJECTIVE, gen, tt.previous.morph.language));
                                } catch (ex2465) {
                                }
                                if (adj !== null && !adj.startsWith("УПОЛНОМОЧ") && !adj.startsWith("ОПЕРУПОЛНОМОЧ")) {
                                    let tyy = (adj.toLowerCase() + " " + typ.typ);
                                    rt0.beginToken = tt.previous;
                                    if (rt0.beginToken.previous !== null && rt0.beginToken.previous.isHiphen && rt0.beginToken.previous.previous !== null) {
                                        let tt0 = rt0.beginToken.previous.previous;
                                        if (tt0.chars.equals(rt0.beginToken.chars) && (tt0 instanceof TextToken)) {
                                            adj = tt0.term;
                                            if (tt0.morph._class.isAdjective && !tt0.morph.containsAttr("неизм.", null)) {
                                                try {
                                                    adj = MorphologyService.getWordform(adj, MorphBaseInfo._new2464(MorphClass.ADJECTIVE, gen, tt0.morph.language));
                                                } catch (ex2467) {
                                                }
                                            }
                                            tyy = (adj.toLowerCase() + " " + tyy);
                                            rt0.beginToken = tt0;
                                        }
                                    }
                                    if (typ.nameIsName) 
                                        org0.addName(tyy.toUpperCase(), true, null);
                                    else 
                                        org0.addTypeStr(tyy);
                                }
                            }
                            for (const g of org1.geoObjects) {
                                if (!g.isState) {
                                    let sl = org1.findSlot(OrganizationReferent.ATTR_GEO, g, true);
                                    if (sl !== null) 
                                        Utils.removeItem(org1.slots, sl);
                                    if (rt.beginToken.beginChar < rt0.beginToken.beginChar) 
                                        rt0.beginToken = rt.beginToken;
                                    org0.addGeoObject(g);
                                    org1.moveExtReferent(org0, g);
                                }
                            }
                            if (ad !== null) 
                                rt.referent = ad.registerReferent(rt.referent);
                            rt.referent.addOccurence(new TextAnnotation(t, rt.endToken, rt.referent));
                            rt0.referent.higher = Utils.as(rt.referent, OrganizationReferent);
                            OrganizationAnalyzer._doPostAnalyze(rt0);
                            let li2 = new Array();
                            li2.push(rt0);
                            return li2;
                        }
                    }
                    rt = null;
                }
            }
        }
        if (rt === null) {
            if (step > 0 && typ === null) {
                if (!BracketHelper.isBracket(t, false)) {
                    if (!t.chars.isLetter) 
                        return null;
                    if (t.chars.isAllLower) 
                        return null;
                }
            }
            rt = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.NORMAL, null, false, step);
            if (rt === null && step === 0) 
                rt = OrgItemEngItem.tryAttachOrg(t, false);
            if (rt !== null) {
            }
        }
        if (((rt === null && step === 1 && typ !== null) && typ.isDep && typ.root !== null) && !typ.root.canBeNormalDep) {
            if (OrgItemTypeToken.checkOrgSpecialWordBefore(typ.beginToken.previous)) 
                rt = OrganizationAnalyzer.tryAttachDep(typ, OrganizationAnalyzerAttachType.HIGH, true);
        }
        if (rt === null && step === 0 && t !== null) {
            let ok = false;
            if (t.lengthChar > 2 && !t.chars.isAllLower && t.chars.isLatinLetter) 
                ok = true;
            else if (BracketHelper.canBeStartOfSequence(t, true, false)) 
                ok = true;
            if (ok && t.whitespacesBeforeCount !== 1) 
                ok = false;
            if (ok && !OrgItemTypeToken.checkPersonProperty(t.previous)) 
                ok = false;
            if (ok) {
                let _org = new OrganizationReferent();
                rt = new ReferentToken(_org, t, t);
                if (t.chars.isLatinLetter && NumberHelper.tryParseRoman(t) === null) {
                    let nam = OrgItemNameToken.tryAttach(t, null, false, true);
                    if (nam !== null) {
                        let _name = new StringBuilder();
                        _name.append(nam.value);
                        rt.endToken = nam.endToken;
                        for (let ttt = nam.endToken.next; ttt !== null; ttt = ttt.next) {
                            if (!ttt.chars.isLatinLetter) 
                                break;
                            nam = OrgItemNameToken.tryAttach(ttt, null, false, false);
                            if (nam === null) 
                                break;
                            rt.endToken = nam.endToken;
                            if (!nam.isStdTail) 
                                _name.append(" ").append(nam.value);
                            else {
                                let ei = OrgItemEngItem.tryAttach(nam.beginToken, false);
                                if (ei !== null) {
                                    _org.addTypeStr(ei.fullValue);
                                    if (ei.shortValue !== null) 
                                        _org.addTypeStr(ei.shortValue);
                                }
                            }
                        }
                        _org.addName(_name.toString(), true, null);
                    }
                }
                else {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        let rt11 = OrganizationAnalyzer.tryAttachOrg(t.next, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
                        if (rt11 !== null && ((rt11.endToken === br.endToken.previous || rt11.endToken === br.endToken))) {
                            rt11.beginToken = t;
                            rt11.endToken = br.endToken;
                            rt = rt11;
                            _org = Utils.as(rt11.referent, OrganizationReferent);
                        }
                        else {
                            _org.addName(MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE), true, null);
                            _org.addName(MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO), true, br.beginToken.next);
                            if (br.beginToken.next === br.endToken.previous && br.beginToken.next.getMorphClassInDictionary().isUndefined) {
                                for (const wf of br.beginToken.next.morph.items) {
                                    if (wf._case.isGenitive && (wf instanceof MorphWordForm)) 
                                        _org.addName(wf.normalCase, true, null);
                                }
                            }
                            rt.endToken = br.endToken;
                        }
                    }
                }
                if (_org.slots.length === 0) 
                    rt = null;
            }
        }
        if (rt === null) {
            if (BracketHelper.canBeStartOfSequence(t, false, false)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br === null || br.lengthChar > 100) 
                    br = null;
                if (br !== null) {
                    let t1 = br.endToken.next;
                    if (t1 !== null && t1.isComma) 
                        t1 = t1.next;
                    if (t1 !== null && (t1.whitespacesBeforeCount < 3)) {
                        if ((((typ = OrgItemTypeToken.tryAttach(t1, false)))) !== null && typ.root !== null && typ.root.typ === OrgItemTypeTyp.PREFIX) {
                            let t2 = typ.endToken.next;
                            let ok = false;
                            if (t2 === null || t2.isNewlineBefore) 
                                ok = true;
                            else if (t2.isCharOf(".,:;")) 
                                ok = true;
                            else if (t2 instanceof ReferentToken) 
                                ok = true;
                            if (ok) {
                                let _org = new OrganizationReferent();
                                rt = new ReferentToken(_org, t, typ.endToken);
                                _org.addType(typ, false);
                                let nam = MiscHelper.getTextValue(br.beginToken.next, br.endToken.previous, GetTextAttr.NO);
                                _org.addName(nam, true, null);
                                let rt11 = OrganizationAnalyzer.tryAttachOrg(br.beginToken.next, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
                                if (rt11 !== null && rt11.endChar <= typ.endChar) 
                                    _org.mergeSlots(rt11.referent, true);
                            }
                        }
                    }
                }
            }
            if (rt === null) 
                return null;
        }
        OrganizationAnalyzer._doPostAnalyze(rt);
        if (step > 0) {
            let mt = OrganizationAnalyzer._checkAliasAfter(rt, rt.endToken.next);
            if (mt !== null) {
                if (ad !== null) {
                    let term = new Termin();
                    term.initBy(mt.beginToken, mt.endToken.previous, rt.referent, false);
                    ad.aliases.add(term);
                }
                rt.endToken = mt.endToken;
            }
        }
        let li = new Array();
        li.push(rt);
        let tt1 = rt.endToken.next;
        if (tt1 !== null && tt1.isChar('(')) {
            let br = BracketHelper.tryParse(tt1, BracketParseAttr.NO, 100);
            if (br !== null) 
                tt1 = br.endToken.next;
        }
        if (tt1 !== null && tt1.isCommaAnd) {
            if (BracketHelper.canBeStartOfSequence(tt1.next, true, false)) {
                if (BracketHelper.canBeEndOfSequence(rt.endToken, true, null, false)) {
                    let ok = false;
                    for (let ttt = tt1; ttt !== null; ttt = ttt.next) {
                        if (ttt.isChar('.')) {
                            ok = true;
                            break;
                        }
                        if (ttt.isChar('(')) {
                            let br1 = BracketHelper.tryParse(ttt, BracketParseAttr.NO, 100);
                            if (br1 !== null) {
                                ttt = br1.endToken;
                                continue;
                            }
                        }
                        if (!ttt.isCommaAnd) 
                            break;
                        if (!BracketHelper.canBeStartOfSequence(ttt.next, true, false)) 
                            break;
                        let br = BracketHelper.tryParse(ttt.next, BracketParseAttr.NO, 100);
                        if (br === null) 
                            break;
                        let addTyp = false;
                        let rt1 = OrganizationAnalyzer._TryAttachOrg_(ttt.next.next, ttt.next.next, null, true, OrganizationAnalyzerAttachType.NORMAL, null, false);
                        if (rt1 === null || (rt1.endChar < (br.endChar - 1))) {
                            addTyp = true;
                            rt1 = OrganizationAnalyzer._TryAttachOrg_(ttt.next, ttt.next, null, true, OrganizationAnalyzerAttachType.HIGH, null, false);
                        }
                        if (rt1 === null || (rt1.endChar < (br.endChar - 1))) 
                            break;
                        li.push(rt1);
                        let org1 = Utils.as(rt1.referent, OrganizationReferent);
                        if (typ !== null) 
                            ok = true;
                        if (org1.types.length === 0) 
                            addTyp = true;
                        if (addTyp) {
                            if (typ !== null) 
                                org1.addType(typ, false);
                            let s = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                            if (s !== null) {
                                let ex = false;
                                for (const n of org1.names) {
                                    if (s.startsWith(n)) {
                                        ex = true;
                                        break;
                                    }
                                }
                                if (!ex) 
                                    org1.addName(s, true, br.beginToken.next);
                            }
                        }
                        if (ttt.isAnd) {
                            ok = true;
                            break;
                        }
                        ttt = rt1.endToken;
                    }
                    if (!ok && li.length > 1) 
                        li.splice(1, li.length - 1);
                }
            }
        }
        return li;
    }
    
    static tryAttachSpec(t) {
        let rt = OrganizationAnalyzer.tryAttachPropNames(t);
        if (rt === null) 
            rt = OrganizationAnalyzer.tryAttachPoliticParty(t, false);
        if (rt === null) 
            rt = OrganizationAnalyzer.tryAttachArmy(t);
        return rt;
    }
    
    static _corrBrackets(rt) {
        if (!BracketHelper.canBeStartOfSequence(rt.beginToken.previous, true, false) || !BracketHelper.canBeEndOfSequence(rt.endToken.next, true, null, false)) 
            return false;
        rt.beginToken = rt.beginToken.previous;
        rt.endToken = rt.endToken.next;
        return true;
    }
    
    static _doPostAnalyze(rt) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (rt.morph._case.isUndefined) {
            if (!rt.beginToken.chars.isAllUpper) {
                let npt1 = NounPhraseHelper.tryParse(rt.beginToken, NounPhraseParseAttr.NO, 0, null);
                if (npt1 === null) 
                    npt1 = NounPhraseHelper.tryParse(rt.beginToken.next, NounPhraseParseAttr.NO, 0, null);
                if (npt1 !== null) 
                    rt.morph = npt1.morph;
            }
        }
        let o = Utils.as(rt.referent, OrganizationReferent);
        if ((rt.kit.ontology !== null && o.ontologyItems === null && o.higher === null) && o.m_TempParentOrg === null) {
            let ot = rt.kit.ontology.attachReferent(o);
            if (ot !== null && ot.length === 1 && (ot[0].referent instanceof OrganizationReferent)) {
                let oo = Utils.as(ot[0].referent, OrganizationReferent);
                o.mergeSlots(oo, false);
                o.ontologyItems = ot;
                for (const sl of o.slots) {
                    if (sl.value instanceof Referent) {
                        let ext = false;
                        for (const ss of oo.slots) {
                            if (ss.value === sl.value) {
                                ext = true;
                                break;
                            }
                        }
                        if (!ext) 
                            continue;
                        let rr = sl.value.clone();
                        rr.occurrence.splice(0, rr.occurrence.length);
                        o.uploadSlot(sl, rr);
                        let rtEx = new ReferentToken(rr, rt.beginToken, rt.endToken);
                        rtEx.setDefaultLocalOnto(rt.kit.processor);
                        o.addExtReferent(rtEx);
                        for (const sss of rr.slots) {
                            if (sss.value instanceof Referent) {
                                let rrr = sss.value.clone();
                                rrr.occurrence.splice(0, rrr.occurrence.length);
                                rr.uploadSlot(sss, rrr);
                                let rtEx2 = new ReferentToken(rrr, rt.beginToken, rt.endToken);
                                rtEx2.setDefaultLocalOnto(rt.kit.processor);
                                sl.value.addExtReferent(rtEx2);
                            }
                        }
                    }
                }
            }
        }
        if (o.higher === null && o.m_TempParentOrg === null) {
            if ((rt.beginToken.previous instanceof ReferentToken) && (rt.beginToken.previous.getReferent() instanceof OrganizationReferent)) {
                let oo = Utils.as(rt.beginToken.previous.getReferent(), OrganizationReferent);
                if (OrgOwnershipHelper.canBeHigher(oo, o, false)) 
                    o.m_TempParentOrg = oo;
            }
            if (o.m_TempParentOrg === null && (rt.endToken.next instanceof ReferentToken) && (rt.endToken.next.getReferent() instanceof OrganizationReferent)) {
                let oo = Utils.as(rt.endToken.next.getReferent(), OrganizationReferent);
                if (OrgOwnershipHelper.canBeHigher(oo, o, false)) 
                    o.m_TempParentOrg = oo;
            }
            if (o.m_TempParentOrg === null) {
                let rt1 = OrganizationAnalyzer.tryAttachOrg(rt.endToken.next, OrganizationAnalyzerAttachType.NORMALAFTERDEP, null, false, -1);
                if (rt1 !== null && rt.endToken.next === rt1.beginToken) {
                    if (OrgOwnershipHelper.canBeHigher(Utils.as(rt1.referent, OrganizationReferent), o, false)) 
                        o.m_TempParentOrg = Utils.as(rt1.referent, OrganizationReferent);
                }
            }
        }
        if (rt.endToken.next === null) 
            return;
        OrganizationAnalyzer._corrBrackets(rt);
        if (rt.beginToken.previous !== null && rt.beginToken.previous.morph._class.isAdjective && (rt.whitespacesBeforeCount < 2)) {
            if (rt.referent.geoObjects.length === 0) {
                let _geo = OrganizationAnalyzer.isGeo(rt.beginToken.previous, true);
                if (_geo !== null) {
                    if (rt.referent.addGeoObject(_geo)) 
                        rt.beginToken = rt.beginToken.previous;
                }
            }
        }
        let ttt = rt.endToken.next;
        let errs = 1;
        let br = false;
        if (ttt !== null && ttt.isChar('(')) {
            br = true;
            ttt = ttt.next;
        }
        let refs = new Array();
        let _keyword = false;
        let hasInn = false;
        let hasOk = 0;
        let te = null;
        for (; ttt !== null; ttt = ttt.next) {
            if (ttt.isCharOf(",;") || ttt.morph._class.isPreposition) 
                continue;
            if (ttt.isChar(')')) {
                if (br) 
                    te = ttt;
                break;
            }
            let rr = ttt.getReferent();
            if (rr !== null) {
                if (rr.typeName === "ADDRESS" || rr.typeName === "DATE" || ((rr.typeName === "GEO" && br))) {
                    if (_keyword || br || (ttt.whitespacesBeforeCount < 2)) {
                        refs.push(rr);
                        te = ttt;
                        continue;
                    }
                    break;
                }
                if (rr.typeName === "URI") {
                    let sch = rr.getStringValue("SCHEME");
                    if (sch === null) 
                        break;
                    if (sch === "ИНН") {
                        errs = 5;
                        hasInn = true;
                    }
                    else if (sch.startsWith("ОК")) 
                        hasOk++;
                    else if (sch !== "КПП" && sch !== "ОГРН" && !br) 
                        break;
                    refs.push(rr);
                    te = ttt;
                    if (ttt.next !== null && ttt.next.isChar('(')) {
                        let brrr = BracketHelper.tryParse(ttt.next, BracketParseAttr.NO, 100);
                        if (brrr !== null) 
                            ttt = brrr.endToken;
                    }
                    continue;
                }
                else if (rr === rt.referent) 
                    continue;
            }
            if (ttt.isNewlineBefore && !br) 
                break;
            if (ttt instanceof TextToken) {
                let npt = NounPhraseHelper.tryParse(ttt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) {
                    if ((npt.endToken.isValue("ДАТА", null) || npt.endToken.isValue("РЕГИСТРАЦИЯ", null) || npt.endToken.isValue("ЛИЦО", null)) || npt.endToken.isValue("ЮР", null) || npt.endToken.isValue("АДРЕС", null)) {
                        ttt = npt.endToken;
                        _keyword = true;
                        continue;
                    }
                }
                if (ttt.isValue("REGISTRATION", null) && ttt.next !== null && ttt.next.isValue("NUMBER", null)) {
                    let tmp = new StringBuilder();
                    for (let tt3 = ttt.next.next; tt3 !== null; tt3 = tt3.next) {
                        if (tt3.isWhitespaceBefore && tmp.length > 0) 
                            break;
                        if (((tt3.isCharOf(":") || tt3.isHiphen)) && tmp.length === 0) 
                            continue;
                        if (tt3 instanceof TextToken) 
                            tmp.append(tt3.term);
                        else if (tt3 instanceof NumberToken) 
                            tmp.append(tt3.getSourceText());
                        else 
                            break;
                        rt.endToken = (ttt = tt3);
                    }
                    if (tmp.length > 0) 
                        rt.referent.addSlot(OrganizationReferent.ATTR_MISC, tmp.toString(), false, 0);
                    continue;
                }
                if ((ttt.isValue("REGISTERED", null) && ttt.next !== null && ttt.next.isValue("IN", null)) && (ttt.next.next instanceof ReferentToken) && (ttt.next.next.getReferent() instanceof GeoReferent)) {
                    rt.referent.addSlot(OrganizationReferent.ATTR_MISC, ttt.next.next.getReferent(), false, 0);
                    rt.endToken = (ttt = ttt.next.next);
                    continue;
                }
                if (br) {
                    let otyp = OrgItemTypeToken.tryAttach(ttt, true);
                    if (otyp !== null && (ttt.whitespacesBeforeCount < 2) && otyp.geo === null) {
                        let or1 = new OrganizationReferent();
                        or1.addType(otyp, false);
                        if (!OrgItemTypeToken.isTypesAntagonisticOO(o, or1) && otyp.endToken.next !== null && otyp.endToken.next.isChar(')')) {
                            o.addType(otyp, false);
                            rt.endToken = (ttt = otyp.endToken);
                            if (br && ttt.next !== null && ttt.next.isChar(')')) {
                                rt.endToken = ttt.next;
                                break;
                            }
                            continue;
                        }
                    }
                }
            }
            _keyword = false;
            if ((--errs) <= 0) 
                break;
        }
        if (te !== null && refs.length > 0 && ((te.isChar(')') || hasInn || hasOk > 0))) {
            for (const rr of refs) {
                if (rr.typeName === OrganizationAnalyzer.gEONAME) 
                    rt.referent.addGeoObject(rr);
                else 
                    rt.referent.addSlot(OrganizationReferent.ATTR_MISC, rr, false, 0);
            }
            rt.endToken = te;
        }
        if ((rt.whitespacesBeforeCount < 2) && (rt.beginToken.previous instanceof TextToken) && rt.beginToken.previous.chars.isAllUpper) {
            let term = rt.beginToken.previous.term;
            for (const s of o.slots) {
                if ((typeof s.value === 'string' || s.value instanceof String)) {
                    let a = MiscHelper.getAbbreviation(Utils.asString(s.value));
                    if (a !== null && a === term) {
                        rt.beginToken = rt.beginToken.previous;
                        break;
                    }
                }
            }
        }
    }
    
    static _tryAttachOrgByAlias(t) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        if (t === null) 
            return null;
        let t0 = t;
        let br = false;
        if (t0.next !== null && BracketHelper.canBeStartOfSequence(t0, true, false)) {
            t = t0.next;
            br = true;
        }
        if ((t instanceof TextToken) && t.chars.isLetter && !t.chars.isAllLower) {
            if (t.lengthChar > 3) {
            }
            else if (t.lengthChar > 1 && t.chars.isAllUpper) {
            }
            else 
                return null;
        }
        else 
            return null;
        let ad = OrganizationAnalyzer.getData(t);
        if (ad !== null) {
            let tok = ad.aliases.tryParse(t, TerminParseAttr.NO);
            if (tok !== null) {
                let rt0 = new ReferentToken(Utils.as(tok.termin.tag, Referent), t0, tok.endToken);
                if (br) {
                    if (BracketHelper.canBeEndOfSequence(tok.endToken.next, true, null, false)) 
                        rt0.endToken = tok.endToken.next;
                    else 
                        return null;
                }
                return rt0;
            }
        }
        if (!br) {
            if (MiscHelper.canBeStartOfSentence(t)) 
                return null;
            if (!OrgItemTypeToken.checkOrgSpecialWordBefore(t0.previous)) 
                return null;
            if (t.chars.isLatinLetter) {
                if (t.next !== null && t.next.chars.isLatinLetter) 
                    return null;
            }
            else if (t.next !== null && ((t.next.chars.isCyrillicLetter || !t.next.chars.isAllLower))) 
                return null;
        }
        else if (!BracketHelper.canBeEndOfSequence(t.next, true, null, false)) 
            return null;
        let cou = 0;
        for (let ttt = t.previous; ttt !== null && (cou < 100); ttt = ttt.previous,cou++) {
            let org00 = Utils.as(ttt.getReferent(), OrganizationReferent);
            if (org00 === null) 
                continue;
            for (const n of org00.names) {
                let str = n;
                let ii = n.indexOf(' ');
                if (ii > 0) 
                    str = n.substring(0, 0 + ii);
                if (t.isValue(str, null)) {
                    if (ad !== null) 
                        ad.aliases.add(Termin._new170(str, org00));
                    let term = t.term;
                    if (ii < 0) 
                        org00.addName(term, true, t);
                    if (br) 
                        t = t.next;
                    let rt = new ReferentToken(org00, t0, t);
                    return rt;
                }
            }
        }
        return null;
    }
    
    static attachMiddleAttributes(_org, t) {
        let te = null;
        for (; t !== null; t = t.next) {
            let ont = OrgItemNumberToken.tryAttach(t, false, null);
            if (ont !== null) {
                _org.number = ont.number;
                te = (t = ont.endToken);
                continue;
            }
            let oet = OrgItemEponymToken.tryAttach(t, false);
            if (oet !== null) {
                for (const v of oet.eponyms) {
                    _org.addEponym(v);
                }
                te = (t = oet.endToken);
                continue;
            }
            break;
        }
        return te;
    }
    
    static isGeo(t, canBeAdjective = false) {
        if (t === null) 
            return null;
        if (t.isValue("В", null) && t.next !== null) 
            t = t.next;
        let r = t.getReferent();
        if (r !== null) {
            if (r.typeName === OrganizationAnalyzer.gEONAME) {
                if (t.beginToken.isValue("ТЕРРИТОРИЯ", null)) 
                    return null;
                if (t.whitespacesBeforeCount <= 20 || t.morph._case.isGenitive) 
                    return r;
            }
            if (r instanceof AddressReferent) {
                let tt = t.beginToken;
                if (tt.getReferent() !== null && tt.getReferent().typeName === OrganizationAnalyzer.gEONAME) {
                    if (t.whitespacesBeforeCount < 3) 
                        return tt.getReferent();
                }
            }
            return null;
        }
        if (t.whitespacesBeforeCount > 15 && !canBeAdjective) 
            return null;
        if (t.isValue("ТЕРРИТОРИЯ", null) || t.isValue("ПОСЕЛЕНИЕ", null)) 
            return null;
        let rt = t.kit.processReferent("GEO", t, null);
        if (rt === null) 
            return null;
        if (t.previous !== null && t.previous.isValue("ОРДЕН", null)) 
            return null;
        if (!canBeAdjective) {
            if (rt.morph._class.isAdjective) 
                return null;
        }
        return rt;
    }
    
    static getGeoEndToken(_geo, t) {
        if (_geo instanceof ReferentToken) {
            if (_geo.getReferent() instanceof AddressReferent) 
                return t.previous;
            return _geo.endToken;
        }
        else if (t !== null && t.next !== null && t.morph._class.isPreposition) 
            return t.next;
        else 
            return t;
    }
    
    static attachTailAttributes(_org, t, attachForNewOrg, attachTyp, isGlobal = false) {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        let t1 = null;
        let ki = _org.kind;
        let canHasGeo = true;
        if (!canHasGeo) {
            if (_org._typesContains("комитет") || _org._typesContains("академия") || _org._typesContains("инспекция")) 
                canHasGeo = true;
        }
        for (; t !== null; t = (t === null ? null : t.next)) {
            if (((t.isValue("ПО", null) || t.isValue("В", null) || t.isValue("IN", null))) && t.next !== null) {
                if (attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) 
                    break;
                if (!canHasGeo) 
                    break;
                let r = OrganizationAnalyzer.isGeo(t.next, false);
                if (r === null) 
                    break;
                if (!_org.addGeoObject(r)) 
                    break;
                t1 = OrganizationAnalyzer.getGeoEndToken(r, t.next);
                t = t1;
                continue;
            }
            if (t.isValue("ИЗ", null) && t.next !== null) {
                if (attachTyp === OrganizationAnalyzerAttachType.NORMALAFTERDEP) 
                    break;
                if (!canHasGeo) 
                    break;
                let r = OrganizationAnalyzer.isGeo(t.next, false);
                if (r === null) 
                    break;
                if (!_org.addGeoObject(r)) 
                    break;
                t1 = OrganizationAnalyzer.getGeoEndToken(r, t.next);
                t = t1;
                continue;
            }
            if (canHasGeo && _org.findSlot(OrganizationReferent.ATTR_GEO, null, true) === null && !t.isNewlineBefore) {
                let r = OrganizationAnalyzer.isGeo(t, false);
                if (r !== null) {
                    if (!_org.addGeoObject(r)) 
                        break;
                    t = (t1 = OrganizationAnalyzer.getGeoEndToken(r, t));
                    continue;
                }
                if (t.isChar('(')) {
                    r = OrganizationAnalyzer.isGeo(t.next, false);
                    if ((r instanceof ReferentToken) && r.endToken.next !== null && r.endToken.next.isChar(')')) {
                        if (!_org.addGeoObject(r)) 
                            break;
                        t = (t1 = r.endToken.next);
                        continue;
                    }
                    if ((r instanceof GeoReferent) && t.next.next !== null && t.next.next.isChar(')')) {
                        if (!_org.addGeoObject(r)) 
                            break;
                        t = (t1 = t.next.next);
                        continue;
                    }
                }
            }
            if ((t.getReferent() instanceof GeoReferent) && (t.whitespacesBeforeCount < 2)) {
                if (_org.findSlot(OrganizationReferent.ATTR_GEO, t.getReferent(), true) !== null) {
                    t1 = t;
                    continue;
                }
            }
            if (((t.isValue("ПРИ", null) || t.isValue("В", null))) && t.next !== null && (t.next instanceof ReferentToken)) {
                let r = t.next.getReferent();
                if (r instanceof OrganizationReferent) {
                    if (t.isValue("В", null) && !OrgOwnershipHelper.canBeHigher(Utils.as(r, OrganizationReferent), _org, false)) {
                    }
                    else {
                        _org.higher = Utils.as(r, OrganizationReferent);
                        t1 = t.next;
                        t = t1;
                        continue;
                    }
                }
            }
            if (t.chars.isLatinLetter && (t.whitespacesBeforeCount < 2)) {
                let hasLatinName = false;
                for (const s of _org.names) {
                    if (LanguageHelper.isLatinChar(s[0])) {
                        hasLatinName = true;
                        break;
                    }
                }
                if (hasLatinName) {
                    let eng = OrgItemEngItem.tryAttach(t, false);
                    if (eng !== null) {
                        _org.addTypeStr(eng.fullValue);
                        if (eng.shortValue !== null) 
                            _org.addTypeStr(eng.shortValue);
                        t = (t1 = eng.endToken);
                        continue;
                    }
                }
            }
            let re = OrganizationAnalyzer.isGeo(t, false);
            if (re === null && t.isChar(',')) 
                re = OrganizationAnalyzer.isGeo(t.next, false);
            if (re !== null) {
                if (attachTyp !== OrganizationAnalyzerAttachType.NORMALAFTERDEP) {
                    if ((!canHasGeo && ki !== OrganizationKind.BANK && ki !== OrganizationKind.FEDERATION) && !_org.types.includes("университет")) 
                        break;
                    if (_org.toString().includes("Сбербанк") && _org.findSlot(OrganizationReferent.ATTR_GEO, null, true) !== null) 
                        break;
                    if (!_org.addGeoObject(re)) 
                        break;
                    if (t.isChar(',')) 
                        t = t.next;
                    t1 = OrganizationAnalyzer.getGeoEndToken(re, t);
                    if (t1.endChar <= t.endChar) 
                        break;
                    t = t1;
                    continue;
                }
                else 
                    break;
            }
            if (t.isChar('(')) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br === null) 
                    break;
                if (t.next !== null && t.next.getReferent() !== null) {
                    if (t.next.next !== br.endToken) 
                        break;
                    let r = t.next.getReferent();
                    if (r.typeName === OrganizationAnalyzer.gEONAME) {
                        if (!_org.addGeoObject(r)) 
                            break;
                        t = (t1 = br.endToken);
                        continue;
                    }
                    if ((r instanceof OrganizationReferent) && !isGlobal) {
                        if (!attachForNewOrg && !_org.canBeEquals(r, ReferentsEqualType.WITHINONETEXT)) 
                            break;
                        _org.mergeSlots(r, true);
                        t = (t1 = br.endToken);
                        continue;
                    }
                    break;
                }
                if (!isGlobal) {
                    if (attachTyp !== OrganizationAnalyzerAttachType.EXTONTOLOGY) {
                        let typ = OrgItemTypeToken.tryAttach(t.next, true);
                        if (typ !== null && typ.endToken === br.endToken.previous && !typ.isDep) {
                            _org.addType(typ, false);
                            if (typ.name !== null) 
                                _org.addTypeStr(typ.name.toLowerCase());
                            t = (t1 = br.endToken);
                            continue;
                        }
                    }
                    let rte = OrgItemEngItem.tryAttachOrg(br.beginToken, false);
                    if (rte !== null) {
                        if (_org.canBeEquals(rte.referent, ReferentsEqualType.FORMERGING)) {
                            _org.mergeSlots(rte.referent, true);
                            t = (t1 = rte.endToken);
                            continue;
                        }
                    }
                    let nam = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                    if (nam !== null) {
                        let eq = false;
                        for (const s of _org.slots) {
                            if (s.typeName === OrganizationReferent.ATTR_NAME) {
                                if (MiscHelper.canBeEqualCyrAndLatSS(nam, String(s.value))) {
                                    _org.addName(nam, true, br.beginToken.next);
                                    eq = true;
                                    break;
                                }
                            }
                        }
                        if (eq) {
                            t = (t1 = br.endToken);
                            continue;
                        }
                    }
                    let oldName = false;
                    let tt0 = t.next;
                    if (tt0 !== null) {
                        if (tt0.isValue("РАНЕЕ", null)) {
                            oldName = true;
                            tt0 = tt0.next;
                        }
                        else if (tt0.morph._class.isAdjective && tt0.next !== null && ((tt0.next.isValue("НАЗВАНИЕ", null) || tt0.next.isValue("НАИМЕНОВАНИЕ", null)))) {
                            oldName = true;
                            tt0 = tt0.next.next;
                        }
                        if (oldName && tt0 !== null) {
                            if (tt0.isHiphen || tt0.isCharOf(",:")) 
                                tt0 = tt0.next;
                        }
                    }
                    let rt = OrganizationAnalyzer.tryAttachOrg(tt0, OrganizationAnalyzerAttachType.HIGH, null, false, 0);
                    if (rt === null) 
                        break;
                    if (!_org.canBeEquals(rt.referent, ReferentsEqualType.FORMERGING)) 
                        break;
                    if (rt.endToken !== br.endToken.previous) 
                        break;
                    if (!attachForNewOrg && !_org.canBeEquals(rt.referent, ReferentsEqualType.WITHINONETEXT)) 
                        break;
                    if (attachTyp === OrganizationAnalyzerAttachType.NORMAL) {
                        if (!oldName && !OrganizationReferent.canBeSecondDefinition(_org, Utils.as(rt.referent, OrganizationReferent))) 
                            break;
                        let typ = OrgItemTypeToken.tryAttach(t.next, true);
                        if (typ !== null && typ.isDouterOrg) 
                            break;
                    }
                    _org.mergeSlots(rt.referent, true);
                    t = (t1 = br.endToken);
                    continue;
                }
                break;
            }
            else if (attachTyp === OrganizationAnalyzerAttachType.EXTONTOLOGY && BracketHelper.canBeStartOfSequence(t, true, false)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br === null) 
                    break;
                let nam = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                if (nam !== null) 
                    _org.addName(nam, true, br.beginToken.next);
                let rt1 = OrganizationAnalyzer.tryAttachOrg(t.next, OrganizationAnalyzerAttachType.HIGH, null, true, -1);
                if (rt1 !== null && rt1.endToken.next === br.endToken) {
                    _org.mergeSlots(rt1.referent, true);
                    t = (t1 = br.endToken);
                }
            }
            else 
                break;
        }
        if (t !== null && (t.whitespacesBeforeCount < 2) && ((ki === OrganizationKind.UNDEFINED || ki === OrganizationKind.BANK))) {
            let ty1 = OrgItemTypeToken.tryAttach(t, false);
            if (ty1 !== null && ty1.root !== null && ty1.root.isPurePrefix) {
                let rt22 = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
                if (rt22 === null) {
                    _org.addType(ty1, false);
                    t1 = ty1.endToken;
                }
            }
        }
        return t1;
    }
    
    static correctOwnerBefore(res) {
        if (res === null) 
            return;
        if (res.referent.kind === OrganizationKind.PRESS) {
            if (res.beginToken.isValue("КОРРЕСПОНДЕНТ", null) && res.beginToken !== res.endToken) 
                res.beginToken = res.beginToken.next;
        }
        let _org = Utils.as(res.referent, OrganizationReferent);
        if (_org.higher !== null || _org.m_TempParentOrg !== null) 
            return;
        let hiBefore = null;
        let couBefore = 0;
        let t0 = null;
        for (let t = res.beginToken.previous; t !== null; t = t.previous) {
            couBefore += t.whitespacesAfterCount;
            if (t.isChar(',')) {
                couBefore += 5;
                continue;
            }
            else if (t.isValue("ПРИ", null)) 
                return;
            if (t instanceof ReferentToken) {
                if ((((hiBefore = Utils.as(t.getReferent(), OrganizationReferent)))) !== null) 
                    t0 = t;
            }
            break;
        }
        if (t0 === null) 
            return;
        if (!OrgOwnershipHelper.canBeHigher(hiBefore, _org, false)) 
            return;
        if (OrgOwnershipHelper.canBeHigher(_org, hiBefore, false)) 
            return;
        let hiAfter = null;
        let couAfter = 0;
        for (let t = res.endToken.next; t !== null; t = t.next) {
            couBefore += t.whitespacesBeforeCount;
            if (t.isChar(',') || t.isValue("ПРИ", null)) {
                couAfter += 5;
                continue;
            }
            if (t instanceof ReferentToken) {
                hiAfter = Utils.as(t.getReferent(), OrganizationReferent);
                break;
            }
            let rt = OrganizationAnalyzer.tryAttachOrg(t, OrganizationAnalyzerAttachType.NORMAL, null, false, -1);
            if (rt !== null) 
                hiAfter = Utils.as(rt.referent, OrganizationReferent);
            break;
        }
        if (hiAfter !== null) {
            if (OrgOwnershipHelper.canBeHigher(hiAfter, _org, false)) {
                if (couBefore >= couAfter) 
                    return;
            }
        }
        if (_org.kind === hiBefore.kind && _org.kind !== OrganizationKind.UNDEFINED) {
            if (_org.kind !== OrganizationKind.DEPARTMENT & _org.kind !== OrganizationKind.GOVENMENT) 
                return;
        }
        _org.higher = hiBefore;
        res.beginToken = t0;
    }
    
    static checkOwnership(t) {
        if (t === null) 
            return null;
        let res = null;
        let _org = Utils.as(t.getReferent(), OrganizationReferent);
        if (_org === null) 
            return null;
        let tt0 = t;
        for (; t !== null; ) {
            let tt = t.next;
            let always = false;
            let br = false;
            if (tt !== null && tt.morph._class.isPreposition) {
                if (tt.isValue("ПРИ", null)) 
                    always = true;
                else if (tt.isValue("В", null)) {
                }
                else 
                    break;
                tt = tt.next;
            }
            if ((tt !== null && tt.isChar('(') && (tt.next instanceof ReferentToken)) && tt.next.next !== null && tt.next.next.isChar(')')) {
                br = true;
                tt = tt.next;
            }
            if (tt instanceof ReferentToken) {
                let org2 = Utils.as(tt.getReferent(), OrganizationReferent);
                if (org2 !== null) {
                    let ok = OrgOwnershipHelper.canBeHigher(org2, _org, false);
                    if (always || ok) 
                        ok = true;
                    else if (OrgOwnershipHelper.canBeHigher(org2, _org, true)) {
                        let t0 = t.previous;
                        if (t0 !== null && t0.isChar(',')) 
                            t0 = t0.previous;
                        let rt = t.kit.processReferent("PERSON", t0, null);
                        if (rt !== null && rt.referent.typeName === "PERSONPROPERTY" && rt.morph.number === MorphNumber.SINGULAR) 
                            ok = true;
                    }
                    if (ok && ((_org.higher === null || _org.higher.canBeEquals(org2, ReferentsEqualType.WITHINONETEXT)))) {
                        _org.higher = org2;
                        if (br) 
                            tt = tt.next;
                        if (_org.higher === org2) {
                            if (res === null) 
                                res = ReferentToken._new1092(_org, t, tt, tt0.morph);
                            else 
                                res.endToken = tt;
                            t = tt;
                            if (_org.geoObjects.length === 0) {
                                let ttt = t.next;
                                if (ttt !== null && ttt.isValue("В", null)) 
                                    ttt = ttt.next;
                                if (OrganizationAnalyzer.isGeo(ttt, false) !== null) {
                                    _org.addGeoObject(ttt);
                                    res.endToken = ttt;
                                    t = ttt;
                                }
                            }
                            _org = org2;
                            continue;
                        }
                    }
                    if (_org.higher !== null && _org.higher.higher === null && OrgOwnershipHelper.canBeHigher(org2, _org.higher, false)) {
                        _org.higher.higher = org2;
                        res = new ReferentToken(_org, t, tt);
                        if (br) 
                            res.endToken = tt.next;
                        return res;
                    }
                    if ((_org.higher !== null && org2.higher === null && OrgOwnershipHelper.canBeHigher(_org.higher, org2, false)) && OrgOwnershipHelper.canBeHigher(org2, _org, false)) {
                        org2.higher = _org.higher;
                        _org.higher = org2;
                        res = new ReferentToken(_org, t, tt);
                        if (br) 
                            res.endToken = tt.next;
                        return res;
                    }
                }
            }
            break;
        }
        if (res !== null) 
            return res;
        if (_org.kind === OrganizationKind.DEPARTMENT && _org.higher === null && _org.m_TempParentOrg === null) {
            let cou = 0;
            for (let tt = tt0.previous; tt !== null; tt = tt.previous) {
                if (tt.isNewlineAfter) 
                    cou += 10;
                if ((++cou) > 100) 
                    break;
                let org0 = Utils.as(tt.getReferent(), OrganizationReferent);
                if (org0 === null) 
                    continue;
                let tmp = new Array();
                for (; org0 !== null; org0 = org0.higher) {
                    if (OrgOwnershipHelper.canBeHigher(org0, _org, false)) {
                        _org.higher = org0;
                        break;
                    }
                    if (org0.kind !== OrganizationKind.DEPARTMENT) 
                        break;
                    if (tmp.includes(org0)) 
                        break;
                    tmp.push(org0);
                }
                break;
            }
        }
        return null;
    }
    
    processOntologyItem(begin) {
        if (begin === null) 
            return null;
        let rt = OrganizationAnalyzer.tryAttachOrg(begin, OrganizationAnalyzerAttachType.EXTONTOLOGY, null, begin.previous !== null, -1);
        if (rt !== null) {
            let r = Utils.as(rt.referent, OrganizationReferent);
            if (r.higher === null && rt.endToken.next !== null) {
                let h = Utils.as(rt.endToken.next.getReferent(), OrganizationReferent);
                if (h !== null) {
                    if (OrgOwnershipHelper.canBeHigher(h, r, true) || !OrgOwnershipHelper.canBeHigher(r, h, true)) {
                        r.higher = h;
                        rt.endToken = rt.endToken.next;
                    }
                }
            }
            if (rt.beginToken !== begin) {
                let nam = MiscHelper.getTextValue(begin, rt.beginToken.previous, GetTextAttr.NO);
                if (!Utils.isNullOrEmpty(nam)) {
                    let org0 = new OrganizationReferent();
                    org0.addName(nam, true, begin);
                    org0.higher = r;
                    rt = new ReferentToken(org0, begin, rt.endToken);
                }
            }
            return rt;
        }
        let t = begin;
        let et = begin;
        for (; t !== null; t = t.next) {
            if (t.isCharOf(",;")) 
                break;
            et = t;
        }
        let _name = MiscHelper.getTextValue(begin, et, GetTextAttr.NO);
        if (Utils.isNullOrEmpty(_name)) 
            return null;
        let _org = new OrganizationReferent();
        _org.addName(_name, true, begin);
        return new ReferentToken(_org, begin, et);
    }
    
    static initialize() {
        const OrgItemTypeToken = require("./internal/OrgItemTypeToken");
        const OrgGlobal = require("./internal/OrgGlobal");
        const OrgItemEngItem = require("./internal/OrgItemEngItem");
        const OrgItemNameToken = require("./internal/OrgItemNameToken");
        if (OrganizationAnalyzer.m_Inited) 
            return;
        OrganizationAnalyzer.m_Inited = true;
        MetaOrganization.initialize();
        try {
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            OrganizationAnalyzer._initSport();
            OrganizationAnalyzer._initPolitic();
            OrgItemTypeToken.initialize();
            OrgItemEngItem.initialize();
            OrgItemNameToken.initialize();
            OrgGlobal.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new OrganizationAnalyzer());
    }
    
    static static_constructor() {
        OrganizationAnalyzer.m_PoliticPrefs = null;
        OrganizationAnalyzer.m_PoliticSuffs = null;
        OrganizationAnalyzer.m_PoliticNames = null;
        OrganizationAnalyzer.maxOrgName = 200;
        OrganizationAnalyzer.m_Sports = null;
        OrganizationAnalyzer.m_PropNames = null;
        OrganizationAnalyzer.m_PropPref = null;
        OrganizationAnalyzer.ANALYZER_NAME = "ORGANIZATION";
        OrganizationAnalyzer.BAN_AUTO_ABBREVIATIONS = false;
        OrganizationAnalyzer.gEONAME = "GEO";
        OrganizationAnalyzer.m_Inited = false;
    }
}


OrganizationAnalyzer.static_constructor();

module.exports = OrganizationAnalyzer