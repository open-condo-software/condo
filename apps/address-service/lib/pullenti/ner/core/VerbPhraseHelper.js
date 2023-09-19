/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const MorphClass = require("./../../morph/MorphClass");
const VerbPhraseToken = require("./VerbPhraseToken");
const MorphWordForm = require("./../../morph/MorphWordForm");
const PrepositionHelper = require("./PrepositionHelper");
const MorphCollection = require("./../MorphCollection");
const TextToken = require("./../TextToken");
const MorphCase = require("./../../morph/MorphCase");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const VerbPhraseItemToken = require("./VerbPhraseItemToken");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const Token = require("./../Token");
const MorphologyService = require("./../../morph/MorphologyService");
const MiscHelper = require("./MiscHelper");
const DerivateService = require("./../../semantic/utils/DerivateService");
const NounPhraseHelper = require("./NounPhraseHelper");

/**
 * Работа с глагольными группами (последовательность из глаголов и наречий)
 * Хелпер глагольных групп
 */
class VerbPhraseHelper {
    
    /**
     * Создать глагольную группу
     * @param t первый токен группы
     * @param canBePartition выделять ли причастия
     * @param canBeAdjPartition это бывают чистые прилагательные используются в режиме причастий (действия, опасные для жизни)
     * @param forceParse всегда ли пытаться выделять, даже при сомнительных случаях (false по умолчанию)
     * @return группа или null
     */
    static tryParse(t, canBePartition = false, canBeAdjPartition = false, forceParse = false) {
        if (!(t instanceof TextToken)) 
            return null;
        if (!t.chars.isLetter) 
            return null;
        if (t.chars.isCyrillicLetter) 
            return VerbPhraseHelper.tryParseRu(t, canBePartition, canBeAdjPartition, forceParse);
        return null;
    }
    
    static tryParseRu(t, canBePartition, canBeAdjPartition, forceParse) {
        let res = null;
        let t0 = t;
        let not = null;
        let hasVerb = false;
        let verbBeBefore = false;
        let prep = null;
        for (; t !== null; t = t.next) {
            if (!(t instanceof TextToken)) 
                break;
            let tt = Utils.as(t, TextToken);
            let isParticiple = false;
            if (tt.term === "НЕ") {
                not = t;
                continue;
            }
            let ty = 0;
            let norm = null;
            let mc = tt.getMorphClassInDictionary();
            if (tt.term === "НЕТ") {
                if (hasVerb) 
                    break;
                ty = 1;
            }
            else if (tt.term === "ДОПУСТИМО") 
                ty = 3;
            else if (mc.isAdverb && !mc.isVerb) 
                ty = 2;
            else if (tt.isPureVerb || tt.isVerbBe) {
                ty = 1;
                if (hasVerb) {
                    if (!tt.morph.containsAttr("инф.", null)) {
                        if (verbBeBefore) {
                        }
                        else 
                            break;
                    }
                }
            }
            else if (mc.isVerb) {
                if (mc.isPreposition || mc.isMisc || mc.isPronoun) {
                }
                else if (mc.isNoun) {
                    if (tt.term === "СТАЛИ" || tt.term === "СТЕКЛО" || tt.term === "БЫЛИ") 
                        ty = 1;
                    else if (!tt.chars.isAllLower && !MiscHelper.canBeStartOfSentence(tt)) 
                        ty = 1;
                    else if (mc.isAdjective && canBePartition) 
                        ty = 1;
                    else if (forceParse) 
                        ty = 1;
                }
                else if (mc.isProper) {
                    if (tt.chars.isAllLower) 
                        ty = 1;
                }
                else 
                    ty = 1;
                if (mc.isAdjective) 
                    isParticiple = true;
                if (!tt.morph._case.isUndefined) 
                    isParticiple = true;
                if (!canBePartition && isParticiple) 
                    break;
                if (hasVerb) {
                    if (tt.morph.containsAttr("инф.", null)) {
                    }
                    else if (!isParticiple) {
                    }
                    else 
                        break;
                }
            }
            else if ((mc.isAdjective && tt.morph.containsAttr("к.ф.", null) && tt.term.endsWith("О")) && NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null) === null) 
                ty = 2;
            else if (mc.isAdjective && ((canBePartition || canBeAdjPartition))) {
                if (tt.morph.containsAttr("к.ф.", null) && !canBeAdjPartition) 
                    break;
                norm = tt.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, MorphGender.MASCULINE, false);
                if (norm.endsWith("ЙШИЙ")) {
                }
                else {
                    let grs = DerivateService.findDerivates(norm, true, null);
                    if (grs !== null && grs.length > 0) {
                        let hVerb = false;
                        let hPart = false;
                        for (const gr of grs) {
                            for (const w of gr.words) {
                                if (w._class !== null && w._class.isAdjective && w._class.isVerb) {
                                    if (w.spelling === norm) 
                                        hPart = true;
                                }
                                else if (w._class !== null && w._class.isVerb) 
                                    hVerb = true;
                            }
                        }
                        if (hPart && hVerb) 
                            ty = 3;
                        else if (canBeAdjPartition) 
                            ty = 3;
                        if (ty !== 3 && !Utils.isNullOrEmpty(grs[0].prefix) && norm.startsWith(grs[0].prefix)) {
                            hVerb = false;
                            hPart = false;
                            let norm1 = norm.substring(grs[0].prefix.length);
                            grs = DerivateService.findDerivates(norm1, true, null);
                            if (grs !== null && grs.length > 0) {
                                for (const gr of grs) {
                                    for (const w of gr.words) {
                                        if (w._class.isAdjective && w._class.isVerb) {
                                            if (w.spelling === norm1) 
                                                hPart = true;
                                        }
                                        else if (w._class.isVerb) 
                                            hVerb = true;
                                    }
                                }
                            }
                            if (hPart && hVerb) 
                                ty = 3;
                        }
                    }
                }
            }
            if (ty === 0 && t === t0 && canBePartition) {
                prep = PrepositionHelper.tryParse(t);
                if (prep !== null) {
                    t = prep.endToken;
                    continue;
                }
            }
            if (ty === 0) 
                break;
            if (res === null) 
                res = new VerbPhraseToken(t0, t);
            res.endToken = t;
            let it = VerbPhraseItemToken._new927(t, t, new MorphCollection(t.morph));
            if (not !== null) {
                it.beginToken = not;
                it.not = true;
                not = null;
            }
            it.isAdverb = ty === 2;
            if (prep !== null && !t.morph._case.isUndefined && res.items.length === 0) {
                if ((MorphCase.ooBitand(prep.nextCase, t.morph._case)).isUndefined) 
                    return null;
                it.morph.removeItems(prep.nextCase, false);
                res.preposition = prep;
            }
            if (norm === null) {
                norm = t.getNormalCaseText((ty === 3 ? MorphClass.ADJECTIVE : (ty === 2 ? MorphClass.ADVERB : MorphClass.VERB)), MorphNumber.SINGULAR, MorphGender.MASCULINE, false);
                if (ty === 1 && !tt.morph._case.isUndefined) {
                    let mi = MorphWordForm._new928(MorphCase.NOMINATIVE, MorphNumber.SINGULAR, MorphGender.MASCULINE);
                    for (const mit of tt.morph.items) {
                        if (mit instanceof MorphWordForm) {
                            mi.misc = mit.misc;
                            break;
                        }
                    }
                    let nnn = null;
                    try {
                        nnn = MorphologyService.getWordform("КК" + t.term, mi);
                    } catch (ex929) {
                    }
                    if (nnn !== null) 
                        norm = nnn.substring(2);
                }
            }
            it.normal = norm;
            res.items.push(it);
            if (!hasVerb && ((ty === 1 || ty === 3))) {
                res.morph = it.morph;
                hasVerb = true;
            }
            if (ty === 1 || ty === 3) {
                if (ty === 1 && tt.isVerbBe) 
                    verbBeBefore = true;
                else 
                    verbBeBefore = false;
            }
        }
        if (!hasVerb) 
            return null;
        for (let i = res.items.length - 1; i > 0; i--) {
            if (res.items[i].isAdverb) {
                res.items.splice(i, 1);
                res.endToken = res.items[i - 1].endToken;
            }
            else 
                break;
        }
        return res;
    }
}


module.exports = VerbPhraseHelper