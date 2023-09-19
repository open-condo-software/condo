/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const TextAnnotation = require("./../../TextAnnotation");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const MiscHelper = require("./../../core/MiscHelper");
const KeywordType = require("./../KeywordType");
const TextToken = require("./../../TextToken");
const KeywordReferent = require("./../KeywordReferent");

class AutoannoSentToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.rank = 0;
        this.value = null;
    }
    
    toString() {
        return (String(this.rank) + ": " + this.value);
    }
    
    static tryParse(t) {
        if (t === null || !MiscHelper.canBeStartOfSentence(t)) 
            return null;
        let res = new AutoannoSentToken(t, t);
        let hasVerb = false;
        for (; t !== null; t = t.next) {
            if (MiscHelper.canBeStartOfSentence(t) && t !== res.beginToken) 
                break;
            let r = t.getReferent();
            if (r instanceof KeywordReferent) {
                res.rank += r.rank;
                if (r.typ === KeywordType.PREDICATE) 
                    hasVerb = true;
            }
            else if (t instanceof TextToken) {
                let mc = t.getMorphClassInDictionary();
                if (mc.isPronoun || mc.isPersonalPronoun) 
                    res.rank -= (1);
                else if (t.lengthChar > 1) 
                    res.rank -= 0.1;
            }
            res.endToken = t;
        }
        if (!hasVerb) 
            res.rank /= (3);
        res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.of((GetTextAttr.KEEPREGISTER.value()) | (GetTextAttr.KEEPQUOTES.value())));
        return res;
    }
    
    static createAnnotation(_kit, maxSents) {
        let sents = new Array();
        for (let t = _kit.firstToken; t !== null; t = t.next) {
            let sent = AutoannoSentToken.tryParse(t);
            if (sent === null) 
                continue;
            if (sent.rank > 0) 
                sents.push(sent);
            t = sent.endToken;
        }
        if (sents.length < 2) 
            return null;
        for (let i = 0; i < sents.length; i++) {
            sents[i].rank *= (((sents.length - i)) / (sents.length));
        }
        if ((maxSents * 3) > sents.length) {
            maxSents = Utils.intDiv(sents.length, 3);
            if (maxSents === 0) 
                maxSents = 1;
        }
        while (sents.length > maxSents) {
            let mini = 0;
            let min = sents[0].rank;
            for (let i = 1; i < sents.length; i++) {
                if (sents[i].rank <= min) {
                    min = sents[i].rank;
                    mini = i;
                }
            }
            sents.splice(mini, 1);
        }
        let ano = new KeywordReferent();
        ano.typ = KeywordType.ANNOTATION;
        let tmp = new StringBuilder();
        for (const s of sents) {
            if (tmp.length > 0) 
                tmp.append(' ');
            tmp.append(s.value);
            ano.occurrence.push(TextAnnotation._new1577(s.beginChar, s.endChar, ano, _kit.sofa));
        }
        ano.addSlot(KeywordReferent.ATTR_VALUE, tmp.toString(), true, 0);
        return ano;
    }
}


module.exports = AutoannoSentToken