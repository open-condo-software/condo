/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const MorphCase = require("./../../morph/MorphCase");
const PrepositionHelper = require("./PrepositionHelper");
const Token = require("./../Token");
const NounPhraseParseAttr = require("./NounPhraseParseAttr");
const TextToken = require("./../TextToken");

/**
 * Выделение именных групп - это существительное с согласованными прилагательными (если они есть).
 * 
 * Хелпер именных групп
 */
class NounPhraseHelper {
    
    /**
     * Попробовать создать именную группу с указанного токена
     * @param t начальный токен
     * @param attrs атрибуты (можно битовую маску)
     * @param maxCharPos максимальная позиция в тексте, до которой выделять (если 0, то без ограничений)
     * @param noun это если нужно выделить только прилагательные для ранее выделенного существительного (из другой группы)
     * @return именная группа или null
     */
    static tryParse(t, attrs = NounPhraseParseAttr.NO, maxCharPos = 0, noun = null) {
        const NounPhraseItem = require("./internal/NounPhraseItem");
        const _NounPraseHelperInt = require("./_NounPraseHelperInt");
        if (t === null) 
            return null;
        if (attrs === NounPhraseParseAttr.NO && (t instanceof TextToken)) {
            let tt = Utils.as(t, TextToken);
            if (tt.noNpt) 
                return null;
            if (tt.npt !== null) {
                let ok = true;
                for (let ttt = tt; ttt !== null && ttt.beginChar <= tt.npt.endChar; ttt = ttt.next) {
                    if (!(ttt instanceof TextToken)) 
                        ok = false;
                }
                if (ok) 
                    return tt.npt.clone();
            }
        }
        let res = _NounPraseHelperInt.tryParse(t, attrs, maxCharPos, Utils.as(noun, NounPhraseItem));
        if (res !== null) {
            if (attrs === NounPhraseParseAttr.NO && (t instanceof TextToken)) {
                let tt = Utils.as(t, TextToken);
                tt.noNpt = false;
                tt.npt = res;
            }
            if ((((attrs.value()) & (NounPhraseParseAttr.PARSEPREPOSITION.value()))) !== (NounPhraseParseAttr.NO.value())) {
                if (res.beginToken === res.endToken && t.morph._class.isPreposition) {
                    let prep = PrepositionHelper.tryParse(t);
                    if (prep !== null) {
                        let res2 = _NounPraseHelperInt.tryParse(t.next, attrs, maxCharPos, Utils.as(noun, NounPhraseItem));
                        if (res2 !== null) {
                            if (!(MorphCase.ooBitand(prep.nextCase, res2.morph._case)).isUndefined) {
                                res2.morph.removeItems(prep.nextCase, false);
                                res2.preposition = prep;
                                res2.beginToken = t;
                                return res2;
                            }
                        }
                    }
                }
            }
            return res;
        }
        if ((((attrs.value()) & (NounPhraseParseAttr.PARSEPREPOSITION.value()))) !== (NounPhraseParseAttr.NO.value())) {
            let prep = PrepositionHelper.tryParse(t);
            if (prep !== null && (prep.newlinesAfterCount < 2)) {
                res = _NounPraseHelperInt.tryParse(prep.endToken.next, attrs, maxCharPos, Utils.as(noun, NounPhraseItem));
                if (res !== null) {
                    res.preposition = prep;
                    res.beginToken = t;
                    if (!(MorphCase.ooBitand(prep.nextCase, res.morph._case)).isUndefined) 
                        res.morph.removeItems(prep.nextCase, false);
                    else if (t.morph._class.isAdverb) 
                        return null;
                    return res;
                }
            }
        }
        if (attrs === NounPhraseParseAttr.NO && (t instanceof TextToken)) {
            let tt = Utils.as(t, TextToken);
            tt.noNpt = true;
        }
        return null;
    }
}


module.exports = NounPhraseHelper