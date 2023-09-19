/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const MorphCase = require("./../../../morph/MorphCase");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphGender = require("./../../../morph/MorphGender");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphWordForm = require("./../../../morph/MorphWordForm");

// Морфологический вариант для элемента именной группы
class NounPhraseItemTextVar extends MorphBaseInfo {
    
    constructor(src = null, t = null) {
        super();
        this.normalValue = null;
        this.singleNumberValue = null;
        this.undefCoef = 0;
        if (src !== null) 
            this.copyFrom(src);
        let wf = Utils.as(src, MorphWordForm);
        if (wf !== null) {
            this.normalValue = wf.normalCase;
            if (wf.number === MorphNumber.PLURAL && wf.normalFull !== null) 
                this.singleNumberValue = wf.normalFull;
            this.undefCoef = wf.undefCoef;
        }
        else if (t !== null) 
            this.normalValue = t.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
        if (this._case.isUndefined && src !== null) {
            if (src.containsAttr("неизм.", null)) 
                this._case = MorphCase.ALL_CASES;
        }
    }
    
    toString() {
        return (this.normalValue + " " + super.toString());
    }
    
    copyFromItem(src) {
        this.copyFrom(src);
        this.normalValue = src.normalValue;
        this.singleNumberValue = src.singleNumberValue;
        this.undefCoef = src.undefCoef;
    }
    
    correctPrefix(t, ignoreGender) {
        if (t === null) 
            return;
        for (const v of t.morph.items) {
            if (v._class.equals(this._class) && this.checkAccord(v, ignoreGender, false)) {
                this.normalValue = (v.normalCase + "-" + this.normalValue);
                if (this.singleNumberValue !== null) 
                    this.singleNumberValue = (((v.normalFull != null ? v.normalFull : v.normalCase)) + "-" + this.singleNumberValue);
                return;
            }
        }
        this.normalValue = (t.term + "-" + this.normalValue);
        if (this.singleNumberValue !== null) 
            this.singleNumberValue = (t.term + "-" + this.singleNumberValue);
    }
}


module.exports = NounPhraseItemTextVar