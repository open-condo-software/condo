/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const DefinitionKind = require("./../DefinitionKind");
const GetTextAttr = require("./../../core/GetTextAttr");
const TextToken = require("./../../TextToken");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const Referent = require("./../../Referent");
const Token = require("./../../Token");
const DefinitionReferent = require("./../DefinitionReferent");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NounPhraseToken = require("./../../core/NounPhraseToken");
const BracketHelper = require("./../../core/BracketHelper");

class DefinitionAnalyzerEn {
    
    static process(kit, ad) {
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (!MiscHelper.canBeStartOfSentence(t)) 
                continue;
            let rt = DefinitionAnalyzerEn.tryParseThesis(t);
            if (rt === null) 
                continue;
            rt.referent = ad.registerReferent(rt.referent);
            kit.embedToken(rt);
            t = rt;
        }
    }
    
    static tryParseThesis(t) {
        if (t === null) 
            return null;
        let t0 = t;
        let tt = t;
        let mc = tt.getMorphClassInDictionary();
        let preamb = null;
        if (mc.isConjunction) 
            return null;
        if (t.isValue("LET", null)) 
            return null;
        if (mc.isPreposition || mc.isMisc || mc.isAdverb) {
            if (!MiscHelper.isEngArticle(tt)) {
                for (tt = tt.next; tt !== null; tt = tt.next) {
                    if (tt.isComma) 
                        break;
                    if (tt.isChar('(')) {
                        let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                        if (br !== null) {
                            tt = br.endToken;
                            continue;
                        }
                    }
                    if (MiscHelper.canBeStartOfSentence(tt)) 
                        break;
                    let npt0 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.REFERENTCANBENOUN.value())), 0, null);
                    if (npt0 !== null) {
                        tt = npt0.endToken;
                        continue;
                    }
                    if (tt.getMorphClassInDictionary().isVerb) 
                        break;
                }
                if (tt === null || !tt.isComma || tt.next === null) 
                    return null;
                preamb = new MetaToken(t0, tt.previous);
                tt = tt.next;
            }
        }
        let t1 = tt;
        mc = tt.getMorphClassInDictionary();
        let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.REFERENTCANBENOUN.value()) | (NounPhraseParseAttr.PARSEADVERBS.value())), 0, null);
        if (npt === null && (tt instanceof TextToken)) {
            if (tt.chars.isAllUpper) 
                npt = new NounPhraseToken(tt, tt);
            else if (!tt.chars.isAllLower) {
                if (mc.isProper || preamb !== null) 
                    npt = new NounPhraseToken(tt, tt);
            }
        }
        if (npt === null) 
            return null;
        if (mc.isPersonalPronoun) 
            return null;
        let t2 = npt.endToken.next;
        if (t2 === null || MiscHelper.canBeStartOfSentence(t2) || !(t2 instanceof TextToken)) 
            return null;
        if (!t2.getMorphClassInDictionary().isVerb) 
            return null;
        let t3 = t2;
        for (tt = t2.next; tt !== null; tt = tt.next) {
            if (!tt.getMorphClassInDictionary().isVerb) 
                break;
        }
        for (; tt !== null; tt = tt.next) {
            if (tt.next === null) {
                t3 = tt;
                break;
            }
            if (tt.isCharOf(".;!?")) {
                if (MiscHelper.canBeStartOfSentence(tt.next)) {
                    t3 = tt;
                    break;
                }
            }
            if (!(tt instanceof TextToken)) 
                continue;
            if (BracketHelper.canBeStartOfSequence(tt, false, false)) {
                let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                if (br !== null) {
                    tt = br.endToken;
                    continue;
                }
            }
        }
        tt = t3;
        if (t3.isCharOf(";.!?")) 
            tt = tt.previous;
        let txt = MiscHelper.getTextValue(t2, tt, GetTextAttr.of((GetTextAttr.KEEPREGISTER.value()) | (GetTextAttr.KEEPQUOTES.value())));
        if (txt === null || (txt.length < 15)) 
            return null;
        if (t0 !== t1) {
            tt = t1.previous;
            if (tt.isComma) 
                tt = tt.previous;
            let txt0 = MiscHelper.getTextValue(t0, tt, GetTextAttr.of((GetTextAttr.KEEPREGISTER.value()) | (GetTextAttr.KEEPQUOTES.value())));
            if (txt0 !== null && txt0.length > 10) {
                if (t0.chars.isCapitalUpper) 
                    txt0 = (txt0[0].toLowerCase()) + txt0.substring(1);
                txt = (txt + ", " + txt0);
            }
        }
        tt = t1;
        if (MiscHelper.isEngArticle(tt)) 
            tt = tt.next;
        let nam = MiscHelper.getTextValue(tt, t2.previous, GetTextAttr.KEEPQUOTES);
        if (nam.startsWith("SO-CALLED")) 
            nam = nam.substring(9).trim();
        let dr = new DefinitionReferent();
        dr.kind = DefinitionKind.ASSERTATION;
        dr.addSlot(DefinitionReferent.ATTR_TERMIN, nam, false, 0);
        dr.addSlot(DefinitionReferent.ATTR_VALUE, txt, false, 0);
        return new ReferentToken(dr, t0, t3);
    }
}


module.exports = DefinitionAnalyzerEn