/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const MetaToken = require("./../MetaToken");
const TextToken = require("./../TextToken");
const Referent = require("./../Referent");
const TerminParseAttr = require("./../core/TerminParseAttr");
const GetTextAttr = require("./../core/GetTextAttr");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const VacanceTokenType = require("./../vacance/internal/VacanceTokenType");
const NumberToken = require("./../NumberToken");
const MiscHelper = require("./../core/MiscHelper");
const ProcessorService = require("./../ProcessorService");
const AddressReferent = require("./../address/AddressReferent");
const GeoReferent = require("./../geo/GeoReferent");
const MoneyReferent = require("./../money/MoneyReferent");
const NumberHelper = require("./../core/NumberHelper");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const BracketParseAttr = require("./../core/BracketParseAttr");
const BracketHelper = require("./../core/BracketHelper");
const StreetReferent = require("./../address/StreetReferent");
const ResumeItemReferent = require("./ResumeItemReferent");
const Analyzer = require("./../Analyzer");
const MetaResume = require("./MetaResume");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const ReferentToken = require("./../ReferentToken");
const VacanceToken = require("./../vacance/internal/VacanceToken");
const Token = require("./../Token");
const ResumeItemType = require("./ResumeItemType");

/**
 * Анализатор резюме (специфический анализатор)
 */
class ResumeAnalyzer extends Analyzer {
    
    get name() {
        return ResumeAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Резюме";
    }
    
    get description() {
        return "Текст содержит одно резюме";
    }
    
    clone() {
        return new ResumeAnalyzer();
    }
    
    get isSpecific() {
        return true;
    }
    
    get typeSystem() {
        return [MetaResume.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaResume.IMAGE_ID.toString(), PullentiNerCoreInternalResourceHelper.getBytes("resume.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === ResumeItemReferent.OBJ_TYPENAME) 
            return new ResumeItemReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let hasSex = false;
        let hasMoney = false;
        let hasPos = false;
        let hasSpec = false;
        let hasSkills = false;
        let hasExp = false;
        let hasEdu = false;
        let hasAbout = false;
        let rt = null;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (!t.isNewlineBefore) 
                continue;
            if (!hasSex) {
                rt = ResumeAnalyzer._parseSex(t, ad);
                if (rt !== null) {
                    hasSex = true;
                    t = rt;
                    continue;
                }
            }
            if (ResumeAnalyzer._checkGeo(t)) 
                continue;
            if (!hasMoney && (t.getReferent() instanceof MoneyReferent)) {
                let _money = new ResumeItemReferent();
                hasMoney = true;
                _money.typ = ResumeItemType.MONEY;
                _money.ref = t.getReferent();
                rt = new ReferentToken(ad.registerReferent(_money), t, t);
                kit.embedToken(rt);
                t = rt;
                continue;
            }
            if (!hasExp) {
                rt = ResumeAnalyzer._parseExperience(t, ad);
                if (rt !== null) {
                    hasExp = true;
                    t = rt;
                    continue;
                }
            }
            if (!hasSpec && t.isValue("СПЕЦИАЛИЗАЦИЯ", null)) {
                if (t.next !== null && t.next.isChar(':')) 
                    t = t.next;
                rt = ResumeAnalyzer._parseList(t.next, ad, ResumeItemType.SPECIALITY);
                if (rt !== null) {
                    hasSpec = true;
                    t = rt;
                    continue;
                }
            }
            if (!hasSkills && t.isValue2("КЛЮЧЕВЫЕ", "НАВЫКИ")) {
                rt = ResumeAnalyzer._parseList(t.next.next, ad, ResumeItemType.SKILL);
                if (rt !== null) {
                    hasSkills = true;
                    t = rt;
                    continue;
                }
            }
            if (!hasAbout && ((t.isValue2("О", "МНЕ") || t.isValue2("О", "СЕБЕ")))) {
                rt = ResumeAnalyzer._parseAboutMe(t.next.next, ad);
                if (rt !== null) {
                    hasAbout = true;
                    t = rt;
                    continue;
                }
            }
            if (!hasSpec && hasSex && !hasPos) {
                rt = ResumeAnalyzer._parseList(t, ad, ResumeItemType.POSITION);
                if (rt !== null) {
                    hasPos = true;
                    t = rt;
                    continue;
                }
            }
            if (!hasEdu) {
                let mt = ResumeAnalyzer._parseEducation(t);
                if (mt !== null) {
                    let edu = new ResumeItemReferent();
                    hasEdu = true;
                    edu.typ = ResumeItemType.EDUCATION;
                    edu.value = Utils.asString(mt.tag);
                    rt = new ReferentToken(ad.registerReferent(edu), mt.beginToken, mt.endToken);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            rt = ResumeAnalyzer._parseDriving(t, ad);
            if (rt !== null) {
                t = rt;
                continue;
            }
        }
    }
    
    static _parseSex(t, ad) {
        if (!t.isValue("МУЖЧИНА", null) && !t.isValue("ЖЕНЩИНА", null)) 
            return null;
        let sex = new ResumeItemReferent();
        sex.typ = ResumeItemType.SEX;
        sex.value = (t.isValue("МУЖЧИНА", null) ? "муж" : "жен");
        let rt = new ReferentToken(ad.registerReferent(sex), t, t);
        t.kit.embedToken(rt);
        t = rt;
        for (let tt = t.next; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) 
                break;
            if ((tt instanceof NumberToken) && tt.next !== null) {
                if (tt.next.isValue("ГОД", null) || tt.next.isValue("ЛЕТ", null)) {
                    let age = new ResumeItemReferent();
                    age.typ = ResumeItemType.AGE;
                    age.value = tt.value;
                    rt = new ReferentToken(ad.registerReferent(age), tt, tt.next);
                    t.kit.embedToken(rt);
                    t = rt;
                    break;
                }
            }
        }
        return rt;
    }
    
    static _parseExperience(t, ad) {
        if (!t.isValue2("ОПЫТ", "РАБОТЫ")) 
            return null;
        for (let tt = t.next; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) 
                break;
            if ((tt instanceof NumberToken) && tt.next !== null) {
                if (tt.next.isValue("ГОД", null) || tt.next.isValue("ЛЕТ", null)) {
                    let experience = new ResumeItemReferent();
                    experience.typ = ResumeItemType.EXPERIENCE;
                    experience.value = tt.value;
                    let tt1 = tt.next;
                    if ((tt1.next instanceof NumberToken) && tt1.next.next !== null && tt1.next.next.isValue("МЕСЯЦ", null)) {
                        let d = Utils.mathRound(tt.realValue + ((tt1.next.realValue / (12))), 1);
                        experience.value = NumberHelper.doubleToString(d);
                        tt1 = tt1.next.next;
                    }
                    let rt = new ReferentToken(ad.registerReferent(experience), tt, tt1);
                    t.kit.embedToken(rt);
                    return rt;
                }
            }
        }
        return null;
    }
    
    static _parseEducation(t) {
        let hi = false;
        let middl = false;
        let prof = false;
        let spec = false;
        let tech = false;
        let neok = false;
        let _keyword = false;
        let t0 = t;
        let t1 = t;
        for (; t !== null; t = t.next) {
            if (t0 !== t && t.isNewlineBefore) 
                break;
            if (t.isValue("СРЕДНИЙ", null) || t.isValue("СРЕДНЕ", null) || t.isValue("СРЕДН", null)) 
                middl = true;
            else if (t.isValue("ВЫСШИЙ", null) || t.isValue("ВЫСШ", null)) 
                hi = true;
            else if (t.isValue("НЕОКОНЧЕННЫЙ", null)) 
                neok = true;
            else if (t.isValue("ПРОФЕССИОНАЛЬНЫЙ", null) || t.isValue("ПРОФ", null) || t.isValue("ПРОФИЛЬНЫЙ", null)) 
                prof = true;
            else if ((t.isValue("СПЕЦИАЛЬНЫЙ", null) || t.isValue("СПЕЦ", null) || t.isValue2("ПО", "СПЕЦИАЛЬНОСТЬ")) || t.isValue2("ПО", "НАПРАВЛЕНИЕ")) 
                spec = true;
            else if ((t.isValue("ТЕХНИЧЕСКИЙ", null) || t.isValue("ТЕХ", null) || t.isValue("ТЕХН", null)) || t.isValue("ТЕХНИЧ", null)) 
                tech = true;
            else if (t.isValue("ОБРАЗОВАНИЕ", null)) {
                _keyword = true;
                t1 = t;
            }
            else 
                break;
        }
        if (!_keyword) 
            return null;
        if (!hi && !middl) {
            if ((spec || prof || tech) || neok) 
                middl = true;
            else 
                return null;
        }
        let val = (hi ? "ВО" : "СО");
        if (spec) 
            val += ",спец";
        if (prof) 
            val += ",проф";
        if (tech) 
            val += ",тех";
        if (neok) 
            val += ",неоконч";
        return MetaToken._new806(t0, t1, val);
    }
    
    static _parseMoral(t) {
        let tok = VacanceToken.M_TERMINS.tryParse(t, TerminParseAttr.NO);
        if (tok === null || tok.termin.tag2 !== null) 
            return null;
        let ty = VacanceTokenType.of(tok.termin.tag);
        if (ty !== VacanceTokenType.MORAL) 
            return null;
        let val = (tok.termin.canonicText[0] + tok.termin.canonicText.substring(1).toLowerCase());
        let t1 = tok.endToken;
        for (let tt = tok.endToken.next; tt !== null; tt = tt.next) {
            if (tt.whitespacesBeforeCount > 2) 
                break;
            if (VacanceToken.M_TERMINS.tryParse(tt, TerminParseAttr.NO) !== null) 
                break;
            let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPREPOSITION.value()) | (NounPhraseParseAttr.PARSEPRONOUNS.value())), 0, null);
            if (npt === null) 
                break;
            tt = (t1 = npt.endToken);
        }
        if (t1.endChar > tok.endChar) 
            val = (val + " " + MiscHelper.getTextValue(tok.endToken.next, t1, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value()))));
        return MetaToken._new806(t, t1, val);
    }
    
    static _parseDriving(t, ad) {
        if (t === null) 
            return null;
        let t1 = null;
        if ((t.isValue2("ВОДИТЕЛЬСКИЕ", "ПРАВА") || t.isValue2("ПРАВА", "КАТЕГОРИИ") || t.isValue2("ВОДИТЕЛЬСКОЕ", "УДОСТОВЕРЕНИЕ")) || t.isValue2("УДОСТОВЕРЕНИЕ", "ВОДИТЕЛЯ") || t.isValue2("ПРАВА", "ВОДИТЕЛЯ")) 
            t1 = t.next.next;
        if (t1 === null) 
            return null;
        let t0 = t;
        let val = null;
        for (t = t1; t !== null; t = t.next) {
            if ((t.isHiphen || t.isCharOf(":.") || t.isValue("КАТЕГОРИЯ", null)) || t.isValue("КАТ", null)) 
                continue;
            if ((t instanceof TextToken) && t.lengthChar <= 3 && t.chars.isLetter) {
                val = t.term;
                t1 = t;
                for (t = t.next; t !== null; t = t.next) {
                    if (t.whitespacesBeforeCount > 2) 
                        break;
                    else if (t.isChar('.') || t.isCommaAnd) 
                        continue;
                    else if (t.lengthChar === 1 && t.chars.isAllUpper && t.chars.isLetter) {
                        val = (val + t.term);
                        t1 = t;
                    }
                    else 
                        break;
                }
                val = Utils.replaceString(Utils.replaceString(Utils.replaceString(val, "А", "A"), "В", "B"), "С", "C");
                break;
            }
            break;
        }
        if (val === null) 
            return null;
        let drv = new ResumeItemReferent();
        drv.typ = ResumeItemType.DRIVINGLICENSE;
        drv.value = val;
        let rt = new ReferentToken(ad.registerReferent(drv), t0, t1);
        t0.kit.embedToken(rt);
        return rt;
    }
    
    static _parseOnto(t) {
        if (t === null) 
            return null;
        if (t.kit.ontology === null) 
            return null;
        let lii = t.kit.ontology.attachToken(ResumeAnalyzer.ANALYZER_NAME, t);
        if (lii === null || lii.length === 0) 
            return null;
        if (!(lii[0].item.referent instanceof ResumeItemReferent)) 
            return null;
        let val = lii[0].item.referent.value;
        val = (val[0] + val.substring(1).toLowerCase());
        return MetaToken._new806(t, lii[0].endToken, val);
    }
    
    static _parseList(t, ad, typ) {
        let rt = null;
        let spec = null;
        let t0 = t;
        for (; t !== null; t = t.next) {
            if (t.isNewlineBefore) {
                if (t.newlinesBeforeCount > 1 && t !== t0) 
                    break;
                if (t.isValue2("О", "МНЕ") || t.isValue2("О", "СЕБЕ")) 
                    break;
                if (t === t0 && typ === ResumeItemType.POSITION) {
                }
                else if (typ === ResumeItemType.SKILL) {
                }
                else 
                    break;
            }
            if (t.isCharOf(";,")) 
                continue;
            if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    spec = new ResumeItemReferent();
                    spec.typ = typ;
                    spec.value = Utils.replaceString(MiscHelper.getTextValue(t.next, br.endToken.previous, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value()))), " - ", "-");
                    rt = new ReferentToken(ad.registerReferent(spec), t, br.endToken);
                    t.kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            let t1 = t;
            for (let tt = t.next; tt !== null; tt = tt.next) {
                if (tt.isNewlineBefore) 
                    break;
                if (tt.isCharOf(";,")) 
                    break;
                t1 = tt;
            }
            if (t1 === null) 
                break;
            let rt1 = ResumeAnalyzer._parseDriving(t, ad);
            if (rt1 !== null) {
                t = rt1;
                rt = rt1;
                continue;
            }
            let mt = ResumeAnalyzer._parseMoral(t);
            if (mt !== null) {
                let mor = new ResumeItemReferent();
                mor.typ = ResumeItemType.MORAL;
                mor.value = Utils.asString(mt.tag);
                rt = new ReferentToken(ad.registerReferent(mor), t, mt.endToken);
            }
            else {
                spec = new ResumeItemReferent();
                spec.typ = typ;
                spec.value = Utils.replaceString(MiscHelper.getTextValue(t, t1, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value()))), " - ", "-");
                rt = new ReferentToken(ad.registerReferent(spec), t, t1);
            }
            t.kit.embedToken(rt);
            t = rt;
        }
        return rt;
    }
    
    static _parseAboutMe(t, ad) {
        let t0 = t;
        let rt = null;
        for (; t !== null; t = t.next) {
            if (t.isNewlineBefore) {
                if (ResumeAnalyzer._parseEducation(t) !== null) 
                    break;
            }
            let mt = ResumeAnalyzer._parseMoral(t);
            if (mt !== null) {
                let mor = new ResumeItemReferent();
                mor.typ = ResumeItemType.MORAL;
                mor.value = Utils.asString(mt.tag);
                rt = new ReferentToken(ad.registerReferent(mor), t, mt.endToken);
                t.kit.embedToken(rt);
                t = rt;
                continue;
            }
            mt = ResumeAnalyzer._parseOnto(t);
            if (mt !== null) {
                let mor = new ResumeItemReferent();
                mor.typ = ResumeItemType.SKILL;
                mor.value = Utils.asString(mt.tag);
                rt = new ReferentToken(ad.registerReferent(mor), t, mt.endToken);
                t.kit.embedToken(rt);
                t = rt;
                continue;
            }
        }
        return rt;
    }
    
    static _checkGeo(t) {
        if (t === null) 
            return false;
        if (t.isValue2("УКАЗАН", "ПРИМЕРНЫЙ")) 
            return true;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt !== t && tt.isNewlineBefore) 
                break;
            let r = tt.getReferent();
            if ((r instanceof GeoReferent) || (r instanceof StreetReferent) || (r instanceof AddressReferent)) 
                return true;
            if (tt.isValue("ГОТОВ", null) || tt.isValue("ПЕРЕЕЗД", null) || tt.isValue("КОМАНДИРОВКА", null)) 
                return true;
        }
        return false;
    }
    
    processOntologyItem(begin) {
        for (let t = begin; t !== null; t = t.next) {
            if (t.next === null) {
                let re = new ResumeItemReferent();
                re.value = MiscHelper.getTextValue(begin, t, GetTextAttr.NO);
                return new ReferentToken(re, begin, t);
            }
        }
        return null;
    }
    
    static initialize() {
        /* this is synchronized block by ResumeAnalyzer.m_Lock, but this feature isn't supported in JS */ {
            if (ResumeAnalyzer.m_Initialized) 
                return;
            ResumeAnalyzer.m_Initialized = true;
            MetaResume.initialize();
            VacanceToken.initialize();
            ProcessorService.registerAnalyzer(new ResumeAnalyzer());
        }
    }
    
    static static_constructor() {
        ResumeAnalyzer.ANALYZER_NAME = "RESUME";
        ResumeAnalyzer.m_Initialized = false;
        ResumeAnalyzer.m_Lock = new Object();
    }
}


ResumeAnalyzer.static_constructor();

module.exports = ResumeAnalyzer