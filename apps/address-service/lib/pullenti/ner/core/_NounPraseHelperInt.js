/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphCollection = require("./../MorphCollection");
const MorphClass = require("./../../morph/MorphClass");
const GetTextAttr = require("./GetTextAttr");
const NounPhraseItemTextVar = require("./internal/NounPhraseItemTextVar");
const MorphCase = require("./../../morph/MorphCase");
const MorphWordForm = require("./../../morph/MorphWordForm");
const NounPhraseToken = require("./NounPhraseToken");
const SemanticHelper = require("./../../semantic/core/SemanticHelper");
const ReferentToken = require("./../ReferentToken");
const NounPhraseHelper = require("./NounPhraseHelper");
const NumberToken = require("./../NumberToken");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const MiscHelper = require("./MiscHelper");
const PrepositionHelper = require("./PrepositionHelper");
const BracketParseAttr = require("./BracketParseAttr");
const Token = require("./../Token");
const MetaToken = require("./../MetaToken");
const TextToken = require("./../TextToken");
const BracketHelper = require("./BracketHelper");
const NounPhraseItem = require("./internal/NounPhraseItem");
const VerbPhraseHelper = require("./VerbPhraseHelper");

class _NounPraseHelperInt {
    
    static tryParse(first, typ, maxCharPos, noun) {
        if (first === null) 
            return null;
        if (first.notNounPhrase) {
            if (typ === NounPhraseParseAttr.NO) 
                return null;
        }
        let cou = 0;
        for (let t = first; t !== null; t = t.next) {
            if (maxCharPos > 0 && t.beginChar > maxCharPos) 
                break;
            if (t.morph.language.isCyrillic || (((t instanceof NumberToken) && t.morph._class.isAdjective && !t.chars.isLatinLetter)) || (((t instanceof ReferentToken) && (((typ.value()) & (NounPhraseParseAttr.REFERENTCANBENOUN.value()))) !== (NounPhraseParseAttr.NO.value()) && !t.chars.isLatinLetter))) {
                let res = _NounPraseHelperInt.tryParseRu(first, typ, maxCharPos, noun);
                if (res === null && typ === NounPhraseParseAttr.NO) 
                    first.notNounPhrase = true;
                return res;
            }
            else if (t.chars.isLatinLetter) {
                let res = _NounPraseHelperInt.tryParseEn(first, typ, maxCharPos);
                if (res === null && typ === NounPhraseParseAttr.NO) 
                    first.notNounPhrase = true;
                return res;
            }
            else if ((++cou) > 0) 
                break;
        }
        return null;
    }
    
    static tryParseRu(first, typ, maxCharPos, defNoun = null) {
        if (first === null) 
            return null;
        let items = null;
        let adverbs = null;
        let prep = null;
        let kak = false;
        let t0 = first;
        if ((((typ.value()) & (NounPhraseParseAttr.PARSEPREPOSITION.value()))) !== (NounPhraseParseAttr.NO.value()) && t0.isValue("КАК", null)) {
            t0 = t0.next;
            prep = PrepositionHelper.tryParse(t0);
            if (prep !== null) 
                t0 = prep.endToken.next;
            kak = true;
        }
        let internalNounPrase = null;
        let conjBefore = false;
        for (let t = t0; t !== null; t = t.next) {
            if (maxCharPos > 0 && t.beginChar > maxCharPos) 
                break;
            if ((t.morph._class.isConjunction && !t.morph._class.isAdjective && !t.morph._class.isPronoun) && !t.morph._class.isNoun) {
                if (conjBefore) 
                    break;
                if ((((typ.value()) & (NounPhraseParseAttr.CANNOTHASCOMMAAND.value()))) !== (NounPhraseParseAttr.NO.value())) 
                    break;
                if (items !== null && ((t.isAnd || t.isOr))) {
                    conjBefore = true;
                    if ((t.next !== null && t.next.isCharOf("\\/") && t.next.next !== null) && t.next.next.isOr) 
                        t = t.next.next;
                    if (((t.next !== null && t.next.isChar('(') && t.next.next !== null) && t.next.next.isOr && t.next.next.next !== null) && t.next.next.next.isChar(')')) 
                        t = t.next.next.next;
                    continue;
                }
                break;
            }
            else if (t.isComma) {
                if (conjBefore || items === null) 
                    break;
                if ((((typ.value()) & (NounPhraseParseAttr.CANNOTHASCOMMAAND.value()))) !== (NounPhraseParseAttr.NO.value())) 
                    break;
                let mc = t.previous.getMorphClassInDictionary();
                if (mc.isProperSurname || mc.isProperSecname) 
                    break;
                conjBefore = true;
                if (kak && t.next !== null && t.next.isValue("ТАК", null)) {
                    t = t.next;
                    if (t.next !== null && t.next.isAnd) 
                        t = t.next;
                    let pr = PrepositionHelper.tryParse(t.next);
                    if (pr !== null) 
                        t = pr.endToken;
                }
                if (items[items.length - 1].canBeNoun && items[items.length - 1].endToken.morph._class.isPronoun) 
                    break;
                continue;
            }
            else if (t.isChar('(')) {
                if (items === null) 
                    return null;
                let brr = BracketHelper.tryParse(t, BracketParseAttr.INTERNALUSAGE, 100);
                if (brr === null) 
                    break;
                if (brr.lengthChar > 100) 
                    break;
                t = brr.endToken;
                continue;
            }
            else if (t.isValue("НЕ", null) && (((typ.value()) & (NounPhraseParseAttr.PARSENOT.value()))) !== (NounPhraseParseAttr.NO.value())) 
                continue;
            if (t instanceof ReferentToken) {
                if ((((typ.value()) & (NounPhraseParseAttr.REFERENTCANBENOUN.value()))) === (NounPhraseParseAttr.NO.value())) 
                    break;
            }
            else if (t.chars.isLatinLetter) 
                break;
            let it = NounPhraseItem.tryParse(t, items, typ);
            if (it === null || ((!it.canBeAdj && !it.canBeNoun))) {
                if (((it !== null && items !== null && t.chars.isCapitalUpper) && (t.whitespacesBeforeCount < 3) && t.lengthChar > 3) && !t.getMorphClassInDictionary().isNoun && !t.getMorphClassInDictionary().isAdjective) {
                    it.canBeNoun = true;
                    items.push(it);
                    break;
                }
                if ((((typ.value()) & (NounPhraseParseAttr.PARSEADVERBS.value()))) !== (NounPhraseParseAttr.NO.value()) && (t instanceof TextToken) && ((t.morph._class.isAdverb || t.morph.containsAttr("неизм.", null)))) {
                    if (adverbs === null) 
                        adverbs = new Array();
                    adverbs.push(Utils.as(t, TextToken));
                    if (t.next !== null && t.next.isHiphen) 
                        t = t.next;
                    continue;
                }
                break;
            }
            it.conjBefore = conjBefore;
            conjBefore = false;
            if (!it.canBeAdj && !it.canBeNoun) 
                break;
            if (t.isNewlineBefore && t !== first) {
                if ((((typ.value()) & (NounPhraseParseAttr.MULTILINES.value()))) !== (NounPhraseParseAttr.NO.value())) {
                }
                else if (items !== null && !t.chars.equals(items[items.length - 1].chars)) {
                    if (t.chars.isAllLower && items[items.length - 1].chars.isCapitalUpper) {
                    }
                    else 
                        break;
                }
            }
            if (items === null) 
                items = new Array();
            else {
                let it0 = items[items.length - 1];
                if (it0.canBeNoun && it0.isPersonalPronoun) {
                    if (it.isPronoun) 
                        break;
                    if ((it0.beginToken.previous !== null && it0.beginToken.previous.getMorphClassInDictionary().isVerb && !it0.beginToken.previous.getMorphClassInDictionary().isAdjective) && !it0.beginToken.previous.getMorphClassInDictionary().isPreposition) {
                        if (t.morph._case.isNominative || t.morph._case.isAccusative) {
                        }
                        else 
                            break;
                    }
                    if (it.canBeNoun && it.isVerb) {
                        if (it0.previous === null) {
                        }
                        else if ((it0.previous instanceof TextToken) && !it0.previous.chars.isLetter) {
                        }
                        else 
                            break;
                    }
                }
            }
            items.push(it);
            t = it.endToken;
            if (t.isNewlineAfter && !t.chars.isAllLower) {
                let mc = t.getMorphClassInDictionary();
                if (mc.isProperSurname) 
                    break;
                if (t.morph._class.isProperSurname && mc.isUndefined) 
                    break;
            }
        }
        if (items === null) 
            return null;
        let tt1 = null;
        if (items.length === 1 && items[0].canBeAdj) {
            let and = false;
            for (tt1 = items[0].endToken.next; tt1 !== null; tt1 = tt1.next) {
                if (tt1.isAnd || tt1.isOr) {
                    and = true;
                    break;
                }
                if (tt1.isComma || tt1.isValue("НО", null) || tt1.isValue("ТАК", null)) 
                    continue;
                break;
            }
            if (and) {
                if (items[0].canBeNoun && items[0].isPersonalPronoun) 
                    and = false;
            }
            if (and) {
                let tt2 = tt1.next;
                if (tt2 !== null && tt2.morph._class.isPreposition) 
                    tt2 = tt2.next;
                let npt1 = _NounPraseHelperInt.tryParseRu(tt2, typ, maxCharPos, null);
                if (npt1 !== null && npt1.adjectives.length > 0) {
                    let ok1 = false;
                    for (const av of items[0].adjMorph) {
                        for (const v of npt1.noun.nounMorph) {
                            if (v.checkAccord(av, false, false)) {
                                items[0].morph.addItem(av);
                                ok1 = true;
                            }
                        }
                    }
                    if (ok1) {
                        npt1.beginToken = items[0].beginToken;
                        npt1.endToken = items[0].endToken;
                        npt1.adjectives.splice(0, npt1.adjectives.length);
                        npt1.adjectives.push(items[0]);
                        return npt1;
                    }
                }
            }
        }
        if (defNoun !== null) 
            items.push(defNoun);
        let last1 = items[items.length - 1];
        let check = true;
        for (const it of items) {
            if (!it.canBeAdj) {
                check = false;
                break;
            }
            else if (it.canBeNoun && it.isPersonalPronoun) {
                check = false;
                break;
            }
        }
        tt1 = last1.endToken.next;
        if ((tt1 !== null && check && ((tt1.morph._class.isPreposition || tt1.morph._case.isInstrumental))) && (tt1.whitespacesBeforeCount < 2)) {
            let inp = NounPhraseHelper.tryParse(tt1, NounPhraseParseAttr.of((typ.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), maxCharPos, null);
            if (inp !== null) {
                tt1 = inp.endToken.next;
                let npt1 = _NounPraseHelperInt.tryParseRu(tt1, typ, maxCharPos, null);
                if (npt1 !== null) {
                    let ok = true;
                    for (let ii = 0; ii < items.length; ii++) {
                        let it = items[ii];
                        if (NounPhraseItem.tryAccordAdjAndNoun(it, Utils.as(npt1.noun, NounPhraseItem))) 
                            continue;
                        if (ii > 0) {
                            let inp2 = NounPhraseHelper.tryParse(it.beginToken, typ, maxCharPos, null);
                            if (inp2 !== null && inp2.endToken === inp.endToken) {
                                items.splice(ii, items.length - ii);
                                inp = inp2;
                                break;
                            }
                        }
                        ok = false;
                        break;
                    }
                    if (ok) {
                        if (npt1.morph._case.isGenitive && !inp.morph._case.isInstrumental) 
                            ok = false;
                    }
                    if (ok) {
                        for (let i = 0; i < items.length; i++) {
                            npt1.adjectives.splice(i, 0, items[i]);
                        }
                        npt1.internalNoun = inp;
                        let mmm = new MorphCollection(npt1.morph);
                        for (const it of items) {
                            mmm.removeItems(it.adjMorph[0], false);
                        }
                        if (mmm.gender !== MorphGender.UNDEFINED || mmm.number !== MorphNumber.UNDEFINED || !mmm._case.isUndefined) 
                            npt1.morph = mmm;
                        if (adverbs !== null) {
                            if (npt1.adverbs === null) 
                                npt1.adverbs = adverbs;
                            else 
                                npt1.adverbs.splice(0, 0, ...adverbs);
                        }
                        npt1.beginToken = first;
                        return npt1;
                    }
                }
                if (tt1 !== null && tt1.morph._class.isNoun && !tt1.morph._case.isGenitive) {
                    let it = NounPhraseItem.tryParse(tt1, items, typ);
                    if (it !== null && it.canBeNoun) {
                        internalNounPrase = inp;
                        inp.beginToken = items[0].endToken.next;
                        items.push(it);
                    }
                }
            }
        }
        for (let i = 0; i < items.length; i++) {
            if (items[i].canBeAdj && items[i].beginToken.morph._class.isVerb) {
                let it = items[i].beginToken;
                if (!it.getMorphClassInDictionary().isVerb) 
                    continue;
                if (it.isValue("УПОЛНОМОЧЕННЫЙ", null)) 
                    continue;
                if ((((typ.value()) & (NounPhraseParseAttr.PARSEVERBS.value()))) === (NounPhraseParseAttr.NO.value())) 
                    continue;
                let inp = _NounPraseHelperInt.tryParseRu(items[i].endToken.next, NounPhraseParseAttr.NO, maxCharPos, null);
                if (inp === null) 
                    continue;
                if (inp.anafor !== null && i === (items.length - 1) && NounPhraseItem.tryAccordAdjAndNoun(items[i], Utils.as(inp.noun, NounPhraseItem))) {
                    inp.beginToken = first;
                    for (let ii = 0; ii < items.length; ii++) {
                        inp.adjectives.splice(ii, 0, items[ii]);
                    }
                    return inp;
                }
                if (inp.endToken.whitespacesAfterCount > 3) 
                    continue;
                let npt1 = _NounPraseHelperInt.tryParseRu(inp.endToken.next, NounPhraseParseAttr.NO, maxCharPos, null);
                if (npt1 === null) 
                    continue;
                let ok = true;
                for (let j = 0; j <= i; j++) {
                    if (!NounPhraseItem.tryAccordAdjAndNoun(items[j], Utils.as(npt1.noun, NounPhraseItem))) {
                        ok = false;
                        break;
                    }
                }
                if (!ok) 
                    continue;
                let verb = VerbPhraseHelper.tryParse(it, true, false, false);
                if (verb === null) 
                    continue;
                let vlinks2 = SemanticHelper.tryCreateLinks(verb, npt1, null);
                if (vlinks2.length > 0) 
                    continue;
                let vlinks = SemanticHelper.tryCreateLinks(verb, inp, null);
                let nlinks = SemanticHelper.tryCreateLinks(inp, npt1, null);
                if (vlinks.length === 0 && nlinks.length > 0) 
                    continue;
                for (let j = 0; j <= i; j++) {
                    npt1.adjectives.splice(j, 0, items[j]);
                }
                items[i].endToken = inp.endToken;
                let mmm = new MorphCollection(npt1.morph);
                let bil = new Array();
                for (let j = 0; j <= i; j++) {
                    bil.splice(0, bil.length);
                    for (const m of items[j].adjMorph) {
                        bil.push(m);
                    }
                    mmm.removeItemsListCla(bil, null);
                }
                if (mmm.gender !== MorphGender.UNDEFINED || mmm.number !== MorphNumber.UNDEFINED || !mmm._case.isUndefined) 
                    npt1.morph = mmm;
                if (adverbs !== null) {
                    if (npt1.adverbs === null) 
                        npt1.adverbs = adverbs;
                    else 
                        npt1.adverbs.splice(0, 0, ...adverbs);
                }
                npt1.beginToken = first;
                return npt1;
            }
        }
        let ok2 = false;
        if ((items.length === 1 && (((typ.value()) & (NounPhraseParseAttr.ADJECTIVECANBELAST.value()))) !== (NounPhraseParseAttr.NO.value()) && (items[0].whitespacesAfterCount < 3)) && !items[0].isAdverb) {
            if (!items[0].canBeAdj) 
                ok2 = true;
            else if (items[0].isPersonalPronoun && items[0].canBeNoun) 
                ok2 = true;
        }
        if (ok2) {
            let it = NounPhraseItem.tryParse(items[0].endToken.next, null, typ);
            if (it !== null && it.canBeAdj && it.beginToken.chars.isAllLower) {
                ok2 = true;
                if (it.isAdverb || it.isVerb) 
                    ok2 = false;
                if (it.isPronoun && items[0].isPronoun) {
                    ok2 = false;
                    if (it.canBeAdjForPersonalPronoun && items[0].isPersonalPronoun) 
                        ok2 = true;
                }
                if (ok2 && NounPhraseItem.tryAccordAdjAndNoun(it, items[0])) {
                    let npt1 = _NounPraseHelperInt.tryParseRu(it.beginToken, typ, maxCharPos, null);
                    if (npt1 !== null && ((npt1.endChar > it.endChar || npt1.adjectives.length > 0))) {
                    }
                    else 
                        items.splice(0, 0, it);
                }
            }
        }
        let noun = null;
        let adjAfter = null;
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].canBeNoun) {
                if (items[i].conjBefore) 
                    continue;
                let hasNoun = false;
                for (let j = i - 1; j >= 0; j--) {
                    if (items[j].canBeNoun && !items[j].canBeAdj) 
                        hasNoun = true;
                }
                if (hasNoun) 
                    continue;
                if (i > 0 && !items[i - 1].canBeAdj) 
                    continue;
                if (i > 0 && items[i - 1].canBeNoun) {
                    if (items[i - 1].isDoubtAdjective) 
                        continue;
                    if (items[i - 1].isPronoun && items[i].isPronoun) {
                        if (items[i].isPronoun && items[i - 1].canBeAdjForPersonalPronoun) {
                        }
                        else 
                            continue;
                    }
                }
                noun = items[i];
                items.splice(i, items.length - i);
                if (adjAfter !== null) 
                    items.push(adjAfter);
                else if (items.length > 0 && items[0].canBeNoun && !items[0].canBeAdj) {
                    noun = items[0];
                    items.splice(0, items.length);
                }
                break;
            }
        }
        if (noun === null) 
            return null;
        let res = NounPhraseToken._new769(first, noun.endToken, prep);
        if (adverbs !== null) {
            for (const a of adverbs) {
                if (a.beginChar < noun.beginChar) {
                    if (items.length === 0 && prep === null) 
                        return null;
                    if (res.adverbs === null) 
                        res.adverbs = new Array();
                    res.adverbs.push(a);
                }
            }
        }
        res.noun = noun;
        res.multiNouns = noun.multiNouns;
        if (kak) 
            res.multiNouns = true;
        res.internalNoun = internalNounPrase;
        for (const v of noun.nounMorph) {
            noun.morph.addItem(v);
        }
        res.morph = noun.morph;
        if (res.morph._case.isNominative && first.previous !== null && first.previous.morph._class.isPreposition) 
            res.morph._case = MorphCase.ooBitxor(res.morph._case, MorphCase.NOMINATIVE);
        if ((((typ.value()) & (NounPhraseParseAttr.PARSEPRONOUNS.value()))) === (NounPhraseParseAttr.NO.value()) && ((res.morph._class.isPronoun || res.morph._class.isPersonalPronoun))) 
            return null;
        let stat = null;
        if (items.length > 1) 
            stat = new Hashtable();
        let needUpdateMorph = false;
        if (items.length > 0) {
            let okList = new Array();
            let isNumNot = false;
            for (const vv of noun.nounMorph) {
                let i = 0;
                let v = vv;
                for (i = 0; i < items.length; i++) {
                    let ok = false;
                    for (const av of items[i].adjMorph) {
                        if (v.checkAccord(av, false, false)) {
                            ok = true;
                            if (!(MorphCase.ooBitand(av._case, v._case)).isUndefined && !av._case.equals(v._case)) 
                                v._case = av._case = MorphCase.ooBitand(av._case, v._case);
                            break;
                        }
                    }
                    if (!ok) {
                        if (items[i].canBeNumericAdj && items[i].tryAccordVar(v, false)) {
                            ok = true;
                            let v1 = new NounPhraseItemTextVar();
                            v1.copyFromItem(v);
                            v1.number = MorphNumber.PLURAL;
                            isNumNot = true;
                            v1._case = new MorphCase();
                            for (const a of items[i].adjMorph) {
                                v1._case = MorphCase.ooBitor(v1._case, a._case);
                            }
                            v = v1;
                        }
                        else 
                            break;
                    }
                }
                if (i >= items.length) 
                    okList.push(v);
            }
            if (okList.length > 0 && (((okList.length < res.morph.itemsCount) || isNumNot))) {
                res.morph = new MorphCollection();
                for (const v of okList) {
                    res.morph.addItem(v);
                }
                if (!isNumNot) 
                    noun.morph = res.morph;
            }
        }
        for (let i = 0; i < items.length; i++) {
            for (const av of items[i].adjMorph) {
                for (const v of noun.nounMorph) {
                    if (v.checkAccord(av, false, false)) {
                        if (!(MorphCase.ooBitand(av._case, v._case)).isUndefined && !av._case.equals(v._case)) {
                            v._case = av._case = MorphCase.ooBitand(av._case, v._case);
                            needUpdateMorph = true;
                        }
                        items[i].morph.addItem(av);
                        if (stat !== null && av.normalValue !== null && av.normalValue.length > 1) {
                            let last = av.normalValue[av.normalValue.length - 1];
                            if (!stat.containsKey(last)) 
                                stat.put(last, 1);
                            else 
                                stat.put(last, stat.get(last) + 1);
                        }
                    }
                }
            }
            if (items[i].isPronoun || items[i].isPersonalPronoun) {
                res.anafor = items[i].beginToken;
                if ((((typ.value()) & (NounPhraseParseAttr.PARSEPRONOUNS.value()))) === (NounPhraseParseAttr.NO.value())) 
                    continue;
            }
            let tt = Utils.as(items[i].beginToken, TextToken);
            if (tt !== null && !tt.term.startsWith("ВЫСШ")) {
                let err = false;
                for (const wf of tt.morph.items) {
                    if (wf._class.isAdjective) {
                        if (wf.containsAttr("прев.", null)) {
                            if ((((typ.value()) & (NounPhraseParseAttr.IGNOREADJBEST.value()))) !== (NounPhraseParseAttr.NO.value())) 
                                err = true;
                        }
                        if (wf.containsAttr("к.ф.", null) && tt.morph._class.isPersonalPronoun) 
                            return null;
                    }
                }
                if (err) 
                    continue;
            }
            if (res.morph._case.isNominative) {
                let v = MiscHelper.getTextValueOfMetaToken(items[i], GetTextAttr.KEEPQUOTES);
                if (!Utils.isNullOrEmpty(v)) {
                    if (items[i].getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false) !== v) {
                        let wf = new NounPhraseItemTextVar(items[i].morph, null);
                        wf.normalValue = v;
                        wf._class = MorphClass.ADJECTIVE;
                        wf._case = res.morph._case;
                        if (res.morph._case.isPrepositional || res.morph.gender === MorphGender.NEUTER || res.morph.gender === MorphGender.FEMINIE) 
                            items[i].morph.addItem(wf);
                        else 
                            items[i].morph.insertItem(0, wf);
                    }
                }
            }
            res.adjectives.push(items[i]);
            if (items[i].endChar > res.endChar) 
                res.endToken = items[i].endToken;
        }
        for (let i = 0; i < (res.adjectives.length - 1); i++) {
            if (res.adjectives[i].whitespacesAfterCount > 5) {
                if (!res.adjectives[i].chars.equals(res.adjectives[i + 1].chars)) {
                    if (!res.adjectives[i + 1].chars.isAllLower) 
                        return null;
                    if (res.adjectives[i].chars.isAllUpper && res.adjectives[i + 1].chars.isCapitalUpper) 
                        return null;
                    if (res.adjectives[i].chars.isCapitalUpper && res.adjectives[i + 1].chars.isAllUpper) 
                        return null;
                }
                if (res.adjectives[i].whitespacesAfterCount > 10) {
                    if (res.adjectives[i].newlinesAfterCount === 1) {
                        if (res.adjectives[i].chars.isCapitalUpper && i === 0 && res.adjectives[i + 1].chars.isAllLower) 
                            continue;
                        if (res.adjectives[i].chars.equals(res.adjectives[i + 1].chars)) 
                            continue;
                    }
                    return null;
                }
            }
        }
        if (needUpdateMorph) {
            noun.morph = new MorphCollection();
            for (const v of noun.nounMorph) {
                noun.morph.addItem(v);
            }
            res.morph = noun.morph;
        }
        if (res.adjectives.length > 0) {
            if (noun.beginToken.previous !== null) {
                if (noun.beginToken.previous.isCommaAnd) {
                    if (res.adjectives[0].beginChar > noun.beginChar) {
                    }
                    else 
                        return null;
                }
            }
            let zap = 0;
            let and = 0;
            let cou = 0;
            let lastAnd = false;
            for (let i = 0; i < (res.adjectives.length - 1); i++) {
                let te = res.adjectives[i].endToken.next;
                if (te === null) 
                    return null;
                if (te.isChar('(')) {
                }
                else if (te.isComma) {
                    zap++;
                    lastAnd = false;
                }
                else if (te.isAnd || te.isOr) {
                    and++;
                    lastAnd = true;
                }
                if (!res.adjectives[i].beginToken.morph._class.isPronoun) 
                    cou++;
            }
            if ((zap + and) > 0) {
                let err = false;
                if (and > 1) 
                    err = true;
                else if (and === 1 && !lastAnd) 
                    err = true;
                else if ((zap + and) !== cou) {
                    if (and === 1) {
                    }
                    else 
                        err = true;
                }
                else if (zap > 0 && and === 0) {
                }
                let last = Utils.as(res.adjectives[res.adjectives.length - 1], NounPhraseItem);
                if (last.isPronoun && !lastAnd) 
                    err = true;
                if (err) {
                    if ((((typ.value()) & (NounPhraseParseAttr.CANNOTHASCOMMAAND.value()))) === (NounPhraseParseAttr.NO.value())) 
                        return _NounPraseHelperInt.tryParseRu(first, NounPhraseParseAttr.of((typ.value()) | (NounPhraseParseAttr.CANNOTHASCOMMAAND.value())), maxCharPos, defNoun);
                    return null;
                }
            }
        }
        if (stat !== null) {
            for (const adj of items) {
                if (adj.morph.itemsCount > 1) {
                    let w1 = Utils.as(adj.morph.getIndexerItem(0), NounPhraseItemTextVar);
                    let w2 = Utils.as(adj.morph.getIndexerItem(1), NounPhraseItemTextVar);
                    if ((w1.normalValue.length < 2) || (w2.normalValue.length < 2)) 
                        break;
                    let l1 = w1.normalValue[w1.normalValue.length - 1];
                    let l2 = w2.normalValue[w2.normalValue.length - 1];
                    let i1 = 0;
                    let i2 = 0;
                    let wrapi1771 = new RefOutArgWrapper();
                    stat.tryGetValue(l1, wrapi1771);
                    i1 = wrapi1771.value;
                    let wrapi2770 = new RefOutArgWrapper();
                    stat.tryGetValue(l2, wrapi2770);
                    i2 = wrapi2770.value;
                    if (i1 < i2) {
                        adj.morph.removeItem(1);
                        adj.morph.insertItem(0, w2);
                    }
                }
            }
        }
        if (res.beginToken.getMorphClassInDictionary().isVerb && items.length > 0) {
            if (!res.beginToken.chars.isAllLower || res.beginToken.previous === null) {
            }
            else if (res.beginToken.previous.morph._class.isPreposition) {
            }
            else {
                let comma = false;
                for (let tt = res.beginToken.previous; tt !== null && tt.endChar <= res.endChar; tt = tt.previous) {
                    if (tt.morph._class.isAdverb) 
                        continue;
                    if (tt.isCharOf(".;")) 
                        break;
                    if (tt.isComma) {
                        comma = true;
                        continue;
                    }
                    if (tt.isValue("НЕ", null)) 
                        continue;
                    if (((tt.morph._class.isNoun || tt.morph._class.isProper)) && comma) {
                        for (const it of res.beginToken.morph.items) {
                            if (it._class.isVerb && (it instanceof MorphWordForm)) {
                                if (tt.morph.checkAccord(it, false, false)) {
                                    if (res.morph._case.isInstrumental) 
                                        return null;
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
        if (res.beginToken === res.endToken) {
            let mc = res.beginToken.getMorphClassInDictionary();
            if (mc.isAdverb) {
                if (res.beginToken.previous !== null && res.beginToken.previous.morph._class.isPreposition) {
                }
                else if (mc.isNoun && !mc.isPreposition && !mc.isConjunction) {
                }
                else if (res.beginToken.isValue("ВЕСЬ", null)) {
                }
                else 
                    return null;
            }
        }
        if (defNoun !== null && defNoun.endToken === res.endToken && res.adjectives.length > 0) 
            res.endToken = res.adjectives[res.adjectives.length - 1].endToken;
        return res;
    }
    
    static tryParseEn(first, typ, maxCharPos) {
        if (first === null) 
            return null;
        let items = null;
        let hasArticle = false;
        let hasProp = false;
        let hasMisc = false;
        if (first.previous !== null && first.previous.morph._class.isPreposition && (first.whitespacesBeforeCount < 3)) 
            hasProp = true;
        for (let t = first; t !== null; t = t.next) {
            if (maxCharPos > 0 && t.beginChar > maxCharPos) 
                break;
            if (!t.chars.isLatinLetter) 
                break;
            if (t !== first && t.whitespacesBeforeCount > 2) {
                if ((((typ.value()) & (NounPhraseParseAttr.MULTILINES.value()))) !== (NounPhraseParseAttr.NO.value())) {
                }
                else if (MiscHelper.isEngArticle(t.previous)) {
                }
                else 
                    break;
            }
            let tt = Utils.as(t, TextToken);
            if (t === first && tt !== null) {
                if (MiscHelper.isEngArticle(tt)) {
                    hasArticle = true;
                    continue;
                }
            }
            if (t instanceof ReferentToken) {
                if ((((typ.value()) & (NounPhraseParseAttr.REFERENTCANBENOUN.value()))) === (NounPhraseParseAttr.NO.value())) 
                    break;
            }
            else if (tt === null) 
                break;
            if ((t.isValue("SO", null) && t.next !== null && t.next.isHiphen) && t.next.next !== null) {
                if (t.next.next.isValue("CALL", null)) {
                    t = t.next.next;
                    continue;
                }
            }
            let mc = t.getMorphClassInDictionary();
            if (mc.isConjunction || mc.isPreposition) 
                break;
            if (mc.isPronoun || mc.isPersonalPronoun) {
                if ((((typ.value()) & (NounPhraseParseAttr.PARSEPRONOUNS.value()))) === (NounPhraseParseAttr.NO.value())) 
                    break;
            }
            else if (mc.isMisc) {
                if (t.isValue("THIS", null) || t.isValue("THAT", null)) {
                    hasMisc = true;
                    if ((((typ.value()) & (NounPhraseParseAttr.PARSEPRONOUNS.value()))) === (NounPhraseParseAttr.NO.value())) 
                        break;
                }
            }
            let isAdj = false;
            if (((hasArticle || hasProp || hasMisc)) && items === null) {
            }
            else if (t instanceof ReferentToken) {
            }
            else {
                if (!mc.isNoun && !mc.isAdjective) {
                    if (mc.isUndefined && hasArticle) {
                    }
                    else if (items === null && mc.isUndefined && t.chars.isCapitalUpper) {
                    }
                    else if (mc.isPronoun) {
                    }
                    else if (tt.term.endsWith("EAN")) 
                        isAdj = true;
                    else if (MiscHelper.isEngAdjSuffix(tt.next)) {
                    }
                    else 
                        break;
                }
                if (mc.isVerb) {
                    if (t.next !== null && t.next.morph._class.isVerb && (t.whitespacesAfterCount < 2)) {
                    }
                    else if (t.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(t)) {
                    }
                    else if ((t.chars.isCapitalUpper && mc.isNoun && (t.next instanceof TextToken)) && t.next.chars.isCapitalUpper) {
                    }
                    else if (t instanceof ReferentToken) {
                    }
                    else 
                        break;
                }
            }
            if (items === null) 
                items = new Array();
            let it = new NounPhraseItem(t, t);
            if (mc.isNoun) 
                it.canBeNoun = true;
            if (mc.isAdjective || mc.isPronoun || isAdj) 
                it.canBeAdj = true;
            items.push(it);
            t = it.endToken;
            if (items.length === 1) {
                if (MiscHelper.isEngAdjSuffix(t.next)) {
                    mc.isNoun = false;
                    mc.isAdjective = true;
                    t = t.next.next;
                }
            }
        }
        if (items === null) 
            return null;
        let noun = items[items.length - 1];
        let res = new NounPhraseToken(first, noun.endToken);
        res.noun = noun;
        res.morph = new MorphCollection();
        for (const v of noun.endToken.morph.items) {
            if (v._class.isVerb) 
                continue;
            if (v._class.isProper && noun.beginToken.chars.isAllLower) 
                continue;
            if (v instanceof MorphWordForm) {
                let wf = new MorphWordForm();
                wf.copyFromWordForm(Utils.as(v, MorphWordForm));
                if (hasArticle && v.number !== MorphNumber.SINGULAR) 
                    wf.number = MorphNumber.SINGULAR;
                res.morph.addItem(wf);
            }
            else {
                let bi = new MorphBaseInfo();
                bi.copyFrom(v);
                if (hasArticle && v.number !== MorphNumber.SINGULAR) 
                    bi.number = MorphNumber.SINGULAR;
                res.morph.addItem(bi);
            }
        }
        if (res.morph.itemsCount === 0 && hasArticle) 
            res.morph.addItem(MorphBaseInfo._new444(MorphClass.NOUN, MorphNumber.SINGULAR));
        for (let i = 0; i < (items.length - 1); i++) {
            res.adjectives.push(items[i]);
        }
        return res;
    }
}


module.exports = _NounPraseHelperInt