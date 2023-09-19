/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphGender = require("./../../../morph/MorphGender");
const GetTextAttr = require("./../../core/GetTextAttr");
const MorphCase = require("./../../../morph/MorphCase");
const MorphClass = require("./../../../morph/MorphClass");
const MorphLang = require("./../../../morph/MorphLang");
const Token = require("./../../Token");
const PullentiNerOrgInternalResourceHelper = require("./PullentiNerOrgInternalResourceHelper");
const MetaToken = require("./../../MetaToken");
const DerivateService = require("./../../../semantic/utils/DerivateService");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const SemanticHelper = require("./../../../semantic/core/SemanticHelper");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const OrgItemEponymToken = require("./OrgItemEponymToken");
const NumberToken = require("./../../NumberToken");
const OrgProfile = require("./../OrgProfile");
const MiscHelper = require("./../../core/MiscHelper");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const OrgAnalyzerData = require("./OrgAnalyzerData");
const GeoReferent = require("./../../geo/GeoReferent");
const TextToken = require("./../../TextToken");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const OrganizationAnalyzer = require("./../OrganizationAnalyzer");
const OrgItemTypeToken = require("./OrgItemTypeToken");
const OrgItemEngItem = require("./OrgItemEngItem");

class OrgItemNameToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.value = null;
        this.isNounPhrase = false;
        this.isDenomination = false;
        this.isInDictionary = false;
        this.isStdTail = false;
        this.isStdName = false;
        this.isEmptyWord = false;
        this.isIgnoredPart = false;
        this.stdOrgNameNouns = 0;
        this.orgStdProf = OrgProfile.UNDEFINED;
        this.isAfterConjunction = false;
        this.preposition = null;
    }
    
    toString() {
        let res = new StringBuilder(this.value);
        if (this.isNounPhrase) 
            res.append(" NounPrase");
        if (this.isDenomination) 
            res.append(" Denom");
        if (this.isInDictionary) 
            res.append(" InDictionary");
        if (this.isAfterConjunction) 
            res.append(" IsAfterConjunction");
        if (this.isStdTail) 
            res.append(" IsStdTail");
        if (this.isStdName) 
            res.append(" IsStdName");
        if (this.isIgnoredPart) 
            res.append(" IsIgnoredPart");
        if (this.preposition !== null) 
            res.append(" IsAfterPreposition '").append(this.preposition).append("'");
        res.append(" ").append(this.chars.toString()).append(" (").append(this.getSourceText()).append(")");
        return res.toString();
    }
    
    static tryAttach(t, prev, extOnto, first) {
        if (t === null) 
            return null;
        if (t.isValue("ОРДЕНА", null) && t.next !== null) {
            let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                let t1 = npt.endToken;
                if (((t1.isValue("ЗНАК", null) || t1.isValue("ДРУЖБА", null))) && (t1.whitespacesAfterCount < 2)) {
                    npt = NounPhraseHelper.tryParse(t1.next, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null) 
                        t1 = npt.endToken;
                }
                return OrgItemNameToken._new1811(t, t1, true);
            }
            if (t.next.getMorphClassInDictionary().isProperSurname) 
                return OrgItemNameToken._new1811(t, t.next, true);
            let ppp = t.kit.processReferent("PERSON", t.next, null);
            if (ppp !== null) 
                return OrgItemNameToken._new1811(t, ppp.endToken, true);
            if ((t.whitespacesAfterCount < 2) && BracketHelper.canBeStartOfSequence(t.next, true, false)) {
                let br = BracketHelper.tryParse(t.next, BracketParseAttr.NEARCLOSEBRACKET, 10);
                if (br !== null && (br.lengthChar < 40)) 
                    return OrgItemNameToken._new1811(t, br.endToken, true);
            }
        }
        if (first && t.chars.isCyrillicLetter && t.morph._class.isPreposition) {
            if (!t.isValue("ПО", null) && !t.isValue("ПРИ", null)) 
                return null;
        }
        let res = OrgItemNameToken._TryAttach(t, prev, extOnto);
        if (res === null) {
            if (extOnto) {
                if ((t.getReferent() instanceof GeoReferent) || (((t instanceof TextToken) && !t.isChar(';')))) 
                    return OrgItemNameToken._new1815(t, t, t.getSourceText());
            }
            return null;
        }
        if (prev === null && !extOnto) {
            if (t.kit.ontology !== null) {
                let ad = Utils.as(t.kit.ontology._getAnalyzerData(OrganizationAnalyzer.ANALYZER_NAME), OrgAnalyzerData);
                if (ad !== null) {
                    let tok = ad.orgPureNames.tryParse(t, TerminParseAttr.NO);
                    if (tok !== null && tok.endChar > res.endChar) 
                        res.endToken = tok.endToken;
                }
            }
        }
        if (prev !== null && !extOnto) {
            if ((prev.chars.isAllLower && !res.chars.isAllLower && !res.isStdTail) && !res.isStdName) {
                if (prev.chars.isLatinLetter && res.chars.isLatinLetter) {
                }
                else if (OrgItemNameToken.m_StdNouns.tryParse(res.beginToken, TerminParseAttr.NO) !== null) {
                }
                else 
                    return null;
            }
        }
        if ((res.endToken.next !== null && !res.endToken.isWhitespaceAfter && res.endToken.next.isHiphen) && !res.endToken.next.isWhitespaceAfter) {
            let tt = Utils.as(res.endToken.next.next, TextToken);
            if (tt !== null) {
                if (tt.chars.equals(res.chars) || tt.chars.isAllUpper) {
                    res.endToken = tt;
                    res.value = (res.value + "-" + tt.term);
                }
            }
        }
        if ((res.endToken.next !== null && res.endToken.next.isAnd && res.endToken.whitespacesAfterCount === 1) && res.endToken.next.whitespacesAfterCount === 1) {
            let res1 = OrgItemNameToken._TryAttach(res.endToken.next.next, prev, extOnto);
            if (res1 !== null && res1.chars.equals(res.chars) && OrgItemTypeToken.tryAttach(res.endToken.next.next, false) === null) {
                if (!(MorphCase.ooBitand(res1.morph._case, res.morph._case)).isUndefined) {
                    res.endToken = res1.endToken;
                    res.value = (res.value + " " + (res.kit.baseLanguage.isUa ? "ТА" : "И") + " " + res1.value);
                }
            }
        }
        for (let tt = res.beginToken; tt !== null && tt.endChar <= res.endChar; tt = tt.next) {
            if (OrgItemNameToken.m_StdNouns.tryParse(tt, TerminParseAttr.NO) !== null) 
                res.stdOrgNameNouns++;
        }
        if (OrgItemNameToken.m_StdNouns.tryParse(res.endToken, TerminParseAttr.NO) !== null) {
            let cou = 1;
            let non = false;
            let et = res.endToken;
            if (!OrgItemNameToken._isNotTermNoun(res.endToken)) 
                non = true;
            let br = false;
            for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
                if (tt.isTableControlChar) 
                    break;
                if (tt.isChar('(')) {
                    if (!non) 
                        break;
                    br = true;
                    continue;
                }
                if (tt.isChar(')')) {
                    br = false;
                    et = tt;
                    break;
                }
                if (!(tt instanceof TextToken)) 
                    break;
                if (tt.whitespacesBeforeCount > 1) {
                    if (tt.newlinesBeforeCount > 1) 
                        break;
                    if (!tt.chars.equals(res.endToken.chars)) 
                        break;
                }
                if (tt.morph._class.isPreposition || tt.isCommaAnd) 
                    continue;
                let dd = tt.getMorphClassInDictionary();
                if (!dd.isNoun && !dd.isAdjective) 
                    break;
                let npt2 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt2 === null) {
                    if (dd.equals(MorphClass.ADJECTIVE)) 
                        continue;
                    break;
                }
                if (OrgItemNameToken.m_StdNouns.tryParse(npt2.endToken, TerminParseAttr.NO) === null) 
                    break;
                if (!npt2.endToken.chars.equals(res.endToken.chars)) 
                    break;
                if ((npt2.endToken.isValue("УПРАВЛЕНИЕ", null) || npt2.endToken.isValue("ИНСТИТУТ", null) || npt2.endToken.isValue("УПРАВЛІННЯ", null)) || npt2.endToken.isValue("ІНСТИТУТ", null) || tt.previous.isValue("ПРИ", null)) {
                    let rt = OrganizationAnalyzer.processReferentStat(tt, null);
                    if (rt !== null) 
                        break;
                }
                cou++;
                tt = npt2.endToken;
                if (!OrgItemNameToken._isNotTermNoun(tt)) {
                    non = true;
                    et = tt;
                }
            }
            if (non && !br) {
                res.stdOrgNameNouns += cou;
                res.endToken = et;
            }
        }
        return res;
    }
    
    static _isNotTermNoun(t) {
        if (!(t instanceof TextToken)) 
            return false;
        if (!(t.previous instanceof TextToken)) 
            return false;
        if (t.previous.term !== "ПО") 
            return false;
        for (const v of OrgItemNameToken.m_NotTerminateNouns) {
            if (t.isValue(v, null)) 
                return true;
        }
        return false;
    }
    
    static _TryAttach(t, prev, extOnto) {
        if (t === null) 
            return null;
        let r = t.getReferent();
        if (r !== null) {
            if (r.typeName === "DENOMINATION") 
                return OrgItemNameToken._new1816(t, t, r.toStringEx(true, t.kit.baseLanguage, 0), true);
            if ((r instanceof GeoReferent) && t.chars.isLatinLetter) {
                let res2 = OrgItemNameToken._TryAttach(t.next, prev, extOnto);
                if (res2 !== null && res2.chars.isLatinLetter) {
                    res2.beginToken = t;
                    res2.value = (MiscHelper.getTextValueOfMetaToken(Utils.as(t, MetaToken), GetTextAttr.NO) + " " + res2.value);
                    res2.isInDictionary = false;
                    return res2;
                }
            }
            return null;
        }
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let res = null;
        let tok = OrgItemNameToken.m_StdTails.tryParse(t, TerminParseAttr.NO);
        if (tok === null && t.isChar(',')) 
            tok = OrgItemNameToken.m_StdTails.tryParse(t.next, TerminParseAttr.NO);
        if (tok !== null) 
            return OrgItemNameToken._new1817(t, tok.endToken, tok.termin.canonicText, tok.termin.tag === null, tok.termin.tag !== null, tok.morph);
        if ((((tok = OrgItemNameToken.m_StdNames.tryParse(t, TerminParseAttr.NO)))) !== null) 
            return OrgItemNameToken._new1818(t, tok.endToken, tok.termin.canonicText, true);
        let eng = OrgItemEngItem.tryAttach(t, false);
        if (eng === null && t.isChar(',')) 
            eng = OrgItemEngItem.tryAttach(t.next, false);
        if (eng !== null) 
            return OrgItemNameToken._new1819(t, eng.endToken, eng.fullValue, true);
        if (tt.chars.isAllLower && prev !== null) {
            if (!prev.chars.isAllLower && !prev.chars.isCapitalUpper) 
                return null;
        }
        if (tt.isChar(',') && prev !== null) {
            let npt1 = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt1 === null || !npt1.chars.equals(prev.chars) || (MorphCase.ooBitand(npt1.morph._case, prev.morph._case)).isUndefined) 
                return null;
            let ty = OrgItemTypeToken.tryAttach(t.next, false);
            if (ty !== null) 
                return null;
            if (npt1.endToken.next === null || !npt1.endToken.next.isValue("И", null)) 
                return null;
            let t1 = npt1.endToken.next;
            let npt2 = NounPhraseHelper.tryParse(t1.next, NounPhraseParseAttr.NO, 0, null);
            if (npt2 === null || !npt2.chars.equals(prev.chars) || (MorphCase.ooBitand(npt2.morph._case, MorphCase.ooBitand(npt1.morph._case, prev.morph._case))).isUndefined) 
                return null;
            ty = OrgItemTypeToken.tryAttach(t1.next, false);
            if (ty !== null) 
                return null;
            res = OrgItemNameToken._new1820(npt1.beginToken, npt1.endToken, npt1.morph, npt1.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
            res.isNounPhrase = true;
            res.isAfterConjunction = true;
            if (prev.preposition !== null) 
                res.preposition = prev.preposition;
            return res;
        }
        if (((tt.isChar('&') || tt.isValue("AND", null) || tt.isValue("UND", null))) && prev !== null) {
            if ((tt.next instanceof TextToken) && tt.lengthChar === 1 && tt.next.chars.isLatinLetter) {
                res = OrgItemNameToken._new1821(tt, tt.next, tt.next.chars);
                res.isAfterConjunction = true;
                res.value = "& " + tt.next.term;
                return res;
            }
            res = OrgItemNameToken.tryAttach(tt.next, null, extOnto, false);
            if (res === null || !res.chars.equals(prev.chars)) 
                return null;
            res.isAfterConjunction = true;
            res.value = "& " + res.value;
            return res;
        }
        if (!tt.chars.isLetter) 
            return null;
        let expinf = null;
        if (prev !== null && prev.endToken.getMorphClassInDictionary().isNoun) {
            let wo = prev.endToken.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
            expinf = DerivateService.findDerivates(wo, true, prev.endToken.morph.language);
        }
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null && npt.internalNoun !== null) 
            npt = null;
        else if ((npt !== null && npt.adjectives.length > 0 && !npt.adjectives[0].chars.isAllUpper) && npt.noun.chars.isAllUpper) 
            npt = null;
        let explOk = false;
        if (npt !== null && prev !== null && prev.endToken.getMorphClassInDictionary().isNoun) {
            let npt0 = NounPhraseHelper.tryParse(prev.endToken, NounPhraseParseAttr.NO, 0, null);
            if (npt0 !== null) {
                let links = SemanticHelper.tryCreateLinks(npt0, npt, null);
                if (links.length > 0) 
                    explOk = true;
            }
        }
        if (npt !== null && ((explOk || npt.morph._case.isGenitive || ((prev !== null && !(MorphCase.ooBitand(prev.morph._case, npt.morph._case)).isUndefined))))) {
            let mc = npt.beginToken.getMorphClassInDictionary();
            if (mc.isVerb || mc.isPronoun) 
                return null;
            if (mc.isAdverb) {
                if (npt.beginToken.next !== null && npt.beginToken.next.isHiphen) {
                }
                else 
                    return null;
            }
            if (mc.isPreposition) 
                return null;
            if (mc.isNoun && npt.chars.isAllLower) {
                let ca = npt.morph._case;
                if ((!ca.isDative && !ca.isGenitive && !ca.isInstrumental) && !ca.isPrepositional) 
                    return null;
            }
            res = OrgItemNameToken._new1820(npt.beginToken, npt.endToken, npt.morph, npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
            res.isNounPhrase = true;
            if ((npt.endToken.whitespacesAfterCount < 2) && (npt.endToken.next instanceof TextToken)) {
                let npt2 = NounPhraseHelper.tryParse(npt.endToken.next, NounPhraseParseAttr.NO, 0, null);
                if (npt2 !== null && npt2.morph._case.isGenitive && npt2.chars.isAllLower) {
                    let typ = OrgItemTypeToken.tryAttach(npt.endToken.next, true);
                    let epo = OrgItemEponymToken.tryAttach(npt.endToken.next, false);
                    let rtt = t.kit.processReferent("PERSONPROPERTY", npt.endToken.next, null);
                    if (typ === null && epo === null && ((rtt === null || rtt.morph.number === MorphNumber.PLURAL))) {
                        res.endToken = npt2.endToken;
                        res.value = (res.value + " " + MiscHelper.getTextValueOfMetaToken(npt2, GetTextAttr.NO));
                    }
                }
                else if (npt.endToken.next.isComma && (npt.endToken.next.next instanceof TextToken)) {
                    let tt2 = npt.endToken.next.next;
                    let mv2 = tt2.getMorphClassInDictionary();
                    if (mv2.isAdjective && mv2.isVerb) {
                        let bi = MorphBaseInfo._new1823(npt.morph._case, npt.morph.gender, npt.morph.number);
                        if (tt2.morph.checkAccord(bi, false, false)) {
                            npt2 = NounPhraseHelper.tryParse(tt2.next, NounPhraseParseAttr.NO, 0, null);
                            if (npt2 !== null && ((npt2.morph._case.isDative || npt2.morph._case.isGenitive)) && npt2.chars.isAllLower) {
                                res.endToken = npt2.endToken;
                                res.value = (res.value + " " + MiscHelper.getTextValue(npt.endToken.next, res.endToken, GetTextAttr.NO));
                            }
                        }
                    }
                }
            }
            if (explOk) 
                res.isAfterConjunction = true;
        }
        else if (npt !== null && ((((prev !== null && prev.isNounPhrase && npt.morph._case.isInstrumental)) || extOnto))) {
            res = OrgItemNameToken._new1820(npt.beginToken, npt.endToken, npt.morph, npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
            res.isNounPhrase = true;
        }
        else if (tt.isAnd) {
            res = OrgItemNameToken.tryAttach(tt.next, prev, extOnto, false);
            if (res === null || !res.isNounPhrase || prev === null) 
                return null;
            if ((MorphCase.ooBitand(prev.morph._case, res.morph._case)).isUndefined) 
                return null;
            if (prev.morph.number !== MorphNumber.UNDEFINED && res.morph.number !== MorphNumber.UNDEFINED) {
                if (((prev.morph.number.value()) & (res.morph.number.value())) === (MorphNumber.UNDEFINED.value())) {
                    if (!prev.chars.equals(res.chars)) 
                        return null;
                    let ty = OrgItemTypeToken.tryAttach(res.endToken.next, false);
                    if (ty !== null) 
                        return null;
                }
            }
            let ci = res.chars;
            res.chars = ci;
            res.isAfterConjunction = true;
            return res;
        }
        else if (((tt.term === "ПО" || tt.term === "ПРИ" || tt.term === "ЗА") || tt.term === "С" || tt.term === "В") || tt.term === "НА") {
            npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                if (OrgItemNameToken.m_VervotWords.tryParse(npt.endToken, TerminParseAttr.NO) !== null) 
                    return null;
                let ok = false;
                if (tt.term === "ПО") 
                    ok = npt.morph._case.isDative;
                else if (tt.term === "С") 
                    ok = npt.morph._case.isInstrumental;
                else if (tt.term === "ЗА") 
                    ok = npt.morph._case.isGenitive | npt.morph._case.isInstrumental;
                else if (tt.term === "НА") 
                    ok = npt.morph._case.isPrepositional;
                else if (tt.term === "В") {
                    ok = npt.morph._case.isDative | npt.morph._case.isPrepositional;
                    if (ok) {
                        ok = false;
                        if (t.next.isValue("СФЕРА", null) || t.next.isValue("ОБЛАСТЬ", null)) 
                            ok = true;
                    }
                }
                else if (tt.term === "ПРИ") {
                    ok = npt.morph._case.isPrepositional;
                    if (ok) {
                        if (OrgItemTypeToken.tryAttach(tt.next, true) !== null) 
                            ok = false;
                        else {
                            let rt = OrganizationAnalyzer.processReferentStat(tt.next, null);
                            if (rt !== null) 
                                ok = false;
                        }
                    }
                    let s = npt.noun.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                    if (s === "ПОДДЕРЖКА" || s === "УЧАСТИЕ") 
                        ok = false;
                }
                else 
                    ok = npt.morph._case.isPrepositional;
                if (ok) {
                    res = OrgItemNameToken._new1825(t, npt.endToken, npt.morph, npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false), npt.chars);
                    res.isNounPhrase = true;
                    res.preposition = tt.term;
                    if (((res.value === "ДЕЛО" || res.value === "ВОПРОС")) && !res.isNewlineAfter) {
                        let res2 = OrgItemNameToken._TryAttach(res.endToken.next, res, extOnto);
                        if (res2 !== null && res2.morph._case.isGenitive) {
                            res.value = (res.value + " " + res2.value);
                            res.endToken = res2.endToken;
                            for (let ttt = res2.endToken.next; ttt !== null; ttt = ttt.next) {
                                if (!ttt.isCommaAnd) 
                                    break;
                                let res3 = OrgItemNameToken._TryAttach(ttt.next, res2, extOnto);
                                if (res3 === null) 
                                    break;
                                res.value = (res.value + " " + res3.value);
                                res.endToken = res3.endToken;
                                if (ttt.isAnd) 
                                    break;
                                ttt = res.endToken;
                            }
                        }
                    }
                }
            }
            if (res === null) 
                return null;
        }
        else if (tt.term === "OF") {
            let t1 = tt.next;
            if (t1 !== null && MiscHelper.isEngArticle(t1)) 
                t1 = t1.next;
            if (t1 !== null && t1.chars.isLatinLetter && !t1.chars.isAllLower) {
                res = OrgItemNameToken._new1826(t, t1, t1.chars, t1.morph);
                for (let ttt = t1.next; ttt !== null; ttt = ttt.next) {
                    if (ttt.whitespacesBeforeCount > 2) 
                        break;
                    if (MiscHelper.isEngAdjSuffix(ttt)) {
                        ttt = ttt.next;
                        continue;
                    }
                    if (!ttt.chars.isLatinLetter) 
                        break;
                    if (ttt.morph._class.isPreposition) 
                        break;
                    t1 = res.endToken = ttt;
                }
                res.value = MiscHelper.getTextValue(t, t1, GetTextAttr.IGNOREARTICLES);
                res.preposition = tt.term;
                return res;
            }
        }
        if (res === null) {
            if (tt.chars.isLatinLetter && tt.lengthChar === 1) {
            }
            else if (tt.chars.isAllLower || (tt.lengthChar < 2)) {
                if (!tt.chars.isLatinLetter || prev === null || !prev.chars.isLatinLetter) 
                    return null;
            }
            if (tt.chars.isCyrillicLetter) {
                let mc = tt.getMorphClassInDictionary();
                if (mc.isVerb || mc.isAdverb) 
                    return null;
            }
            else if (tt.chars.isLatinLetter && !tt.isWhitespaceAfter) {
                if (!tt.isWhitespaceAfter && (tt.lengthChar < 5)) {
                    if (tt.next instanceof NumberToken) 
                        return null;
                }
            }
            res = OrgItemNameToken._new1827(tt, tt, tt.term, tt.morph);
            for (t = tt.next; t !== null; t = t.next) {
                if ((((t.isHiphen || t.isCharOf("\\/"))) && t.next !== null && (t.next instanceof TextToken)) && !t.isWhitespaceBefore && !t.isWhitespaceAfter) {
                    t = t.next;
                    res.endToken = t;
                    res.value = (res.value + (t.previous.isChar('.') ? '.' : '-') + t.term);
                }
                else if (t.isChar('.')) {
                    if (!t.isWhitespaceAfter && !t.isWhitespaceBefore && (t.next instanceof TextToken)) {
                        res.endToken = t.next;
                        t = t.next;
                        res.value = (res.value + "." + t.term);
                    }
                    else if ((t.next !== null && !t.isNewlineAfter && t.next.chars.isLatinLetter) && tt.chars.isLatinLetter) 
                        res.endToken = t;
                    else 
                        break;
                }
                else 
                    break;
            }
        }
        for (let t0 = res.beginToken; t0 !== null; t0 = t0.next) {
            if ((((tt = Utils.as(t0, TextToken)))) !== null && tt.isLetters) {
                if (!tt.morph._class.isConjunction && !tt.morph._class.isPreposition) {
                    for (const mf of tt.morph.items) {
                        if (mf.isInDictionary) 
                            res.isInDictionary = true;
                    }
                }
            }
            if (t0 === res.endToken) 
                break;
        }
        if (res.beginToken === res.endToken && res.beginToken.chars.isAllUpper) {
            if (res.endToken.next !== null && !res.endToken.isWhitespaceAfter) {
                let t1 = res.endToken.next;
                if (t1.next !== null && !t1.isWhitespaceAfter && t1.isHiphen) 
                    t1 = t1.next;
                if (t1 instanceof NumberToken) {
                    res.value += t1.value.toString();
                    res.endToken = t1;
                }
            }
        }
        if (res.beginToken === res.endToken && res.beginToken.chars.isLastLower) {
            let src = res.beginToken.getSourceText();
            for (let i = src.length - 1; i >= 0; i--) {
                if (Utils.isUpperCase(src[i])) {
                    res.value = src.substring(0, 0 + i + 1);
                    break;
                }
            }
        }
        return res;
    }
    
    static initialize() {
        OrgItemNameToken.m_StdTails = new TerminCollection();
        OrgItemNameToken.m_StdNames = new TerminCollection();
        OrgItemNameToken.m_VervotWords = new TerminCollection();
        let t = null;
        t = new Termin("INCORPORATED");
        t.addAbridge("INC.");
        OrgItemNameToken.m_StdTails.add(t);
        t = new Termin("CORPORATION");
        t.addAbridge("CORP.");
        OrgItemNameToken.m_StdTails.add(t);
        t = new Termin("LIMITED");
        t.addAbridge("LTD.");
        OrgItemNameToken.m_StdTails.add(t);
        t = new Termin("AG");
        OrgItemNameToken.m_StdTails.add(t);
        t = new Termin("GMBH");
        OrgItemNameToken.m_StdTails.add(t);
        for (const s of ["ЗАКАЗЧИК", "ИСПОЛНИТЕЛЬ", "РАЗРАБОТЧИК", "БЕНЕФИЦИАР", "ПОЛУЧАТЕЛЬ", "ОТПРАВИТЕЛЬ", "ИЗГОТОВИТЕЛЬ", "ПРОИЗВОДИТЕЛЬ", "ПОСТАВЩИК", "АБОНЕНТ", "КЛИЕНТ", "ВКЛАДЧИК", "СУБЪЕКТ", "ПРОДАВЕЦ", "ПОКУПАТЕЛЬ", "АРЕНДОДАТЕЛЬ", "АРЕНДАТОР", "СУБАРЕНДАТОР", "НАЙМОДАТЕЛЬ", "НАНИМАТЕЛЬ", "АГЕНТ", "ПРИНЦИПАЛ", "ПРОДАВЕЦ", "ПОСТАВЩИК", "ПОДРЯДЧИК", "СУБПОДРЯДЧИК"]) {
            OrgItemNameToken.m_StdTails.add(Termin._new170(s, s));
        }
        for (const s of ["ЗАМОВНИК", "ВИКОНАВЕЦЬ", "РОЗРОБНИК", "БЕНЕФІЦІАР", "ОДЕРЖУВАЧ", "ВІДПРАВНИК", "ВИРОБНИК", "ВИРОБНИК", "ПОСТАЧАЛЬНИК", "АБОНЕНТ", "КЛІЄНТ", "ВКЛАДНИК", "СУБ'ЄКТ", "ПРОДАВЕЦЬ", "ПОКУПЕЦЬ", "ОРЕНДОДАВЕЦЬ", "ОРЕНДАР", "СУБОРЕНДАР", "НАЙМОДАВЕЦЬ", "НАЙМАЧ", "АГЕНТ", "ПРИНЦИПАЛ", "ПРОДАВЕЦЬ", "ПОСТАЧАЛЬНИК", "ПІДРЯДНИК", "СУБПІДРЯДНИК"]) {
            OrgItemNameToken.m_StdTails.add(Termin._new690(s, MorphLang.UA, s));
        }
        t = new Termin("РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ");
        t.addAbridge("РАЗРАБОТКИ ПО");
        OrgItemNameToken.m_StdNames.add(t);
        for (const s of ["СПЕЦИАЛЬНОСТЬ", "ДИАГНОЗ"]) {
            OrgItemNameToken.m_VervotWords.add(new Termin(s));
        }
        for (const s of ["СПЕЦІАЛЬНІСТЬ", "ДІАГНОЗ"]) {
            OrgItemNameToken.m_VervotWords.add(new Termin(s, MorphLang.UA));
        }
        OrgItemNameToken.m_StdNouns = new TerminCollection();
        for (let k = 0; k < 2; k++) {
            let name = (k === 0 ? "NameNouns_ru.dat" : "NameNouns_ua.dat");
            let dat = PullentiNerOrgInternalResourceHelper.getBytes(name);
            if (dat === null) 
                throw new Error(("Can't file resource file " + name + " in Organization analyzer"));
            let str = Utils.decodeString("UTF-8", OrgItemTypeToken.deflate(dat), 0, -1);
            for (const line0 of Utils.splitString(str, '\n', false)) {
                let line = line0.trim();
                if (Utils.isNullOrEmpty(line)) 
                    continue;
                if (k === 0) 
                    OrgItemNameToken.m_StdNouns.add(new Termin(line));
                else 
                    OrgItemNameToken.m_StdNouns.add(Termin._new1526(line, MorphLang.UA));
            }
        }
    }
    
    static _new1811(_arg1, _arg2, _arg3) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.isIgnoredPart = _arg3;
        return res;
    }
    
    static _new1815(_arg1, _arg2, _arg3) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        return res;
    }
    
    static _new1816(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.isDenomination = _arg4;
        return res;
    }
    
    static _new1817(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.isStdTail = _arg4;
        res.isEmptyWord = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new1818(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.isStdName = _arg4;
        return res;
    }
    
    static _new1819(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.isStdTail = _arg4;
        return res;
    }
    
    static _new1820(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.morph = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new1821(_arg1, _arg2, _arg3) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.chars = _arg3;
        return res;
    }
    
    static _new1825(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.morph = _arg3;
        res.value = _arg4;
        res.chars = _arg5;
        return res;
    }
    
    static _new1826(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.chars = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new1827(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static _new2428(_arg1, _arg2, _arg3) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.isStdName = _arg3;
        return res;
    }
    
    static _new2430(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemNameToken(_arg1, _arg2);
        res.value = _arg3;
        res.chars = _arg4;
        return res;
    }
    
    static static_constructor() {
        OrgItemNameToken.m_NotTerminateNouns = Array.from(["РАБОТА", "ВОПРОС", "ДЕЛО", "УПРАВЛЕНИЕ", "ОРГАНИЗАЦИЯ", "ОБЕСПЕЧЕНИЕ", "РОБОТА", "ПИТАННЯ", "СПРАВА", "УПРАВЛІННЯ", "ОРГАНІЗАЦІЯ", "ЗАБЕЗПЕЧЕННЯ"]);
        OrgItemNameToken.m_StdNames = null;
        OrgItemNameToken.m_StdTails = null;
        OrgItemNameToken.m_VervotWords = null;
        OrgItemNameToken.m_StdNouns = null;
        OrgItemNameToken.m_DepStdNames = null;
    }
}


OrgItemNameToken.static_constructor();

module.exports = OrgItemNameToken