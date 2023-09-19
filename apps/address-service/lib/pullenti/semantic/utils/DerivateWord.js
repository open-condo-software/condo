/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphVoice = require("./../../morph/MorphVoice");
const MorphTense = require("./../../morph/MorphTense");
const ExplanWordAttr = require("./ExplanWordAttr");
const MorphAspect = require("./../../morph/MorphAspect");

/**
 * Слово дериватной группы DerivateWord
 * 
 */
class DerivateWord {
    
    constructor() {
        this.spelling = null;
        this._class = null;
        this.aspect = MorphAspect.UNDEFINED;
        this.voice = MorphVoice.UNDEFINED;
        this.tense = MorphTense.UNDEFINED;
        this.reflexive = false;
        this.lang = null;
        this.attrs = new ExplanWordAttr();
        this.nextWords = null;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.spelling);
        if (this._class !== null && !this._class.isUndefined) 
            tmp.append(", ").append(this._class.toString());
        if (this.aspect !== MorphAspect.UNDEFINED) 
            tmp.append(", ").append((this.aspect === MorphAspect.PERFECTIVE ? "соверш." : "несоверш."));
        if (this.voice !== MorphVoice.UNDEFINED) 
            tmp.append(", ").append((this.voice === MorphVoice.ACTIVE ? "действ." : (this.voice === MorphVoice.PASSIVE ? "страдат." : "средн.")));
        if (this.tense !== MorphTense.UNDEFINED) 
            tmp.append(", ").append((this.tense === MorphTense.PAST ? "прош." : (this.tense === MorphTense.PRESENT ? "настоящ." : "будущ.")));
        if (this.reflexive) 
            tmp.append(", возвр.");
        if (this.attrs.value !== (0)) 
            tmp.append(", ").append(this.attrs.toString());
        return tmp.toString();
    }
    
    static _new2997(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new DerivateWord();
        res.spelling = _arg1;
        res.lang = _arg2;
        res._class = _arg3;
        res.aspect = _arg4;
        res.reflexive = _arg5;
        res.tense = _arg6;
        res.voice = _arg7;
        res.attrs = _arg8;
        return res;
    }
}


module.exports = DerivateWord