/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MorphAspect = require("./../../morph/MorphAspect");
const MorphTense = require("./../../morph/MorphTense");
const MorphVoice = require("./../../morph/MorphVoice");
const MorphClass = require("./../../morph/MorphClass");
const ControlModel = require("./ControlModel");
const MorphLang = require("./../../morph/MorphLang");
const DerivateWord = require("./DerivateWord");

/**
 * Дериватная группа - группа, содержащая однокоренные слова разных частей речи и языков, 
 * а также модель управления (что может идти за словом).
 * 
 * Дериватная группа
 */
class DerivateGroup {
    
    constructor() {
        this.words = new Array();
        this.prefix = null;
        this.isDummy = false;
        this.notGenerate = false;
        this.isGenerated = false;
        this.model = new ControlModel();
        this.lazyPos = 0;
        this.id = 0;
    }
    
    /**
     * Содержит ли группа слово
     * @param word слово в верхнем регистре и нормальной форме
     * @param lang возможный язык
     * @return да-нет
     */
    containsWord(word, lang) {
        for (const w of this.words) {
            if (w.spelling === word) {
                if (lang === null || lang.isUndefined || w.lang === null) 
                    return true;
                if (!(MorphLang.ooBitand(lang, w.lang)).isUndefined) 
                    return true;
            }
        }
        return false;
    }
    
    toString() {
        let res = "?";
        if (this.words.length > 0) 
            res = ("<" + this.words[0].spelling + ">");
        if (this.isDummy) 
            res = ("DUMMY: " + res);
        else if (this.isGenerated) 
            res = ("GEN: " + res);
        return res;
    }
    
    createByPrefix(pref, lang) {
        let res = DerivateGroup._new2996(true, pref);
        for (const w of this.words) {
            if (lang !== null && !lang.isUndefined && (MorphLang.ooBitand(w.lang, lang)).isUndefined) 
                continue;
            let rw = DerivateWord._new2997(pref + w.spelling, w.lang, w._class, w.aspect, w.reflexive, w.tense, w.voice, w.attrs);
            res.words.push(rw);
        }
        return res;
    }
    
    deserialize(str, pos) {
        let attr = str.deserializeShort(pos);
        if (((attr & 1)) !== 0) 
            this.isDummy = true;
        if (((attr & 2)) !== 0) 
            this.notGenerate = true;
        this.prefix = str.deserializeString(pos);
        this.model.deserialize(str, pos);
        let cou = str.deserializeShort(pos);
        for (; cou > 0; cou--) {
            let w = new DerivateWord();
            w.spelling = str.deserializeString(pos);
            let sh = str.deserializeShort(pos);
            w._class = new MorphClass();
            w._class.value = sh;
            sh = str.deserializeShort(pos);
            w.lang = new MorphLang();
            w.lang.value = sh;
            sh = str.deserializeShort(pos);
            w.attrs.value = sh;
            let b = str.deserializeByte(pos);
            w.aspect = MorphAspect.of(b);
            b = str.deserializeByte(pos);
            w.tense = MorphTense.of(b);
            b = str.deserializeByte(pos);
            w.voice = MorphVoice.of(b);
            b = str.deserializeByte(pos);
            let cou1 = b;
            for (; cou1 > 0; cou1--) {
                let n = str.deserializeString(pos);
                if (w.nextWords === null) 
                    w.nextWords = new Array();
                if (n !== null) 
                    w.nextWords.push(n);
            }
            this.words.push(w);
        }
    }
    
    static _new2996(_arg1, _arg2) {
        let res = new DerivateGroup();
        res.isGenerated = _arg1;
        res.prefix = _arg2;
        return res;
    }
}


module.exports = DerivateGroup