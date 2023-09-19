/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const MorphCase = require("./../../morph/MorphCase");
const MorphGender = require("./../../morph/MorphGender");
const GetTextAttr = require("./../core/GetTextAttr");
const MorphNumber = require("./../../morph/MorphNumber");
const Token = require("./../Token");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const NumberToken = require("./../NumberToken");
const MetaToken = require("./../MetaToken");
const MiscHelper = require("./../core/MiscHelper");
const NounPhraseHelper = require("./../core/NounPhraseHelper");

// Для поддержки выделений тезисов с числовыми данными
class DefinitionWithNumericToken extends MetaToken {
    
    toString() {
        return (String(this.number) + " " + ((this.noun != null ? this.noun : "?")) + " (" + ((this.nounsGenetive != null ? this.nounsGenetive : "?")) + ")");
    }
    
    constructor(b, e) {
        super(b, e, null);
        this.number = 0;
        this.numberBeginChar = 0;
        this.numberEndChar = 0;
        this.noun = null;
        this.nounsGenetive = null;
        this.numberSubstring = null;
        this.text = null;
    }
    
    static tryParse(t) {
        if (!MiscHelper.canBeStartOfSentence(t)) 
            return null;
        let tt = t;
        let _noun = null;
        let num = null;
        for (; tt !== null; tt = tt.next) {
            if (tt !== t && MiscHelper.canBeStartOfSentence(tt)) 
                return null;
            if (!(tt instanceof NumberToken)) 
                continue;
            if (tt.whitespacesAfterCount > 2 || tt === t) 
                continue;
            if (tt.morph._class.isAdjective) 
                continue;
            let nn = NounPhraseHelper.tryParse(tt.next, NounPhraseParseAttr.NO, 0, null);
            if (nn === null) 
                continue;
            num = Utils.as(tt, NumberToken);
            _noun = nn;
            break;
        }
        if (num === null || num.intValue === null) 
            return null;
        let res = new DefinitionWithNumericToken(t, _noun.endToken);
        res.number = num.intValue;
        res.numberBeginChar = num.beginChar;
        res.numberEndChar = num.endChar;
        res.noun = _noun.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
        res.nounsGenetive = Utils.notNull(_noun.getMorphVariant(MorphCase.GENITIVE, true), (res !== null ? res.noun : null));
        res.text = MiscHelper.getTextValue(t, num.previous, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value())));
        if (num.isWhitespaceBefore) 
            res.text += " ";
        res.numberSubstring = MiscHelper.getTextValue(num, _noun.endToken, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value())));
        res.text += res.numberSubstring;
        for (tt = _noun.endToken; tt !== null; tt = tt.next) {
            if (MiscHelper.canBeStartOfSentence(tt)) 
                break;
            res.endToken = tt;
        }
        if (res.endToken !== _noun.endToken) {
            if (_noun.isWhitespaceAfter) 
                res.text += " ";
            res.text += MiscHelper.getTextValue(_noun.endToken.next, res.endToken, GetTextAttr.of((GetTextAttr.KEEPQUOTES.value()) | (GetTextAttr.KEEPREGISTER.value())));
        }
        return res;
    }
}


module.exports = DefinitionWithNumericToken