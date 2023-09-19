/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const MorphWordForm = require("./../../morph/MorphWordForm");
const StatisticBigrammInfo = require("./StatisticBigrammInfo");
const MorphGender = require("./../../morph/MorphGender");
const StatisticWordInfo = require("./StatisticWordInfo");
const TextToken = require("./../TextToken");
const MiscHelper = require("./MiscHelper");

/**
 * Статистическая информация о словоформах и их биграммах в тексте - поле AnalysisKit.Statistic.
 * Статистика
 */
class StatisticCollection {
    
    constructor() {
        this.m_Items = new Hashtable();
        this.m_Bigramms = new Hashtable();
        this.m_BigrammsRev = new Hashtable();
        this.m_Initials = new Hashtable();
        this.m_InitialsRev = new Hashtable();
    }
    
    prepare(first) {
        let prev = null;
        let prevt = null;
        for (let t = first; t !== null; t = t.next) {
            if (t.isHiphen) 
                continue;
            let it = null;
            if (((t instanceof TextToken) && t.chars.isLetter && t.lengthChar > 1) && !t.chars.isAllLower) 
                it = this.addToken(Utils.as(t, TextToken));
            else if ((((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isAllUpper) && t.next !== null && t.next.isChar('.')) && !t.isWhitespaceAfter) {
                it = this.addToken(Utils.as(t, TextToken));
                t = t.next;
            }
            if (prev !== null && it !== null) {
                this.addBigramm(prev, it);
                if (prevt.chars.equals(t.chars)) {
                    prev.addAfter(it);
                    it.addBefore(prev);
                }
            }
            prev = it;
            prevt = t;
        }
        for (let t = first; t !== null; t = t.next) {
            if (t.chars.isLetter && (t instanceof TextToken)) {
                let it = this.findItem(Utils.as(t, TextToken), false);
                if (it !== null) {
                    if (t.chars.isAllLower) 
                        it.lowerCount++;
                    else if (t.chars.isAllUpper) 
                        it.upperCount++;
                    else if (t.chars.isCapitalUpper) 
                        it.capitalCount++;
                }
            }
        }
    }
    
    addToken(tt) {
        let vars = new Array();
        vars.push(tt.term);
        let s = MiscHelper.getAbsoluteNormalValue(tt.term, false);
        if (s !== null && !vars.includes(s)) 
            vars.push(s);
        for (const wff of tt.morph.items) {
            let wf = Utils.as(wff, MorphWordForm);
            if (wf === null) 
                continue;
            if (wf.normalCase !== null && !vars.includes(wf.normalCase)) 
                vars.push(wf.normalCase);
            if (wf.normalFull !== null && !vars.includes(wf.normalFull)) 
                vars.push(wf.normalFull);
        }
        let res = null;
        for (const v of vars) {
            let wrapres859 = new RefOutArgWrapper();
            let inoutres860 = this.m_Items.tryGetValue(v, wrapres859);
            res = wrapres859.value;
            if (inoutres860) 
                break;
        }
        if (res === null) 
            res = StatisticWordInfo._new861(tt.lemma);
        for (const v of vars) {
            if (!this.m_Items.containsKey(v)) 
                this.m_Items.put(v, res);
        }
        res.totalCount++;
        if ((tt.next instanceof TextToken) && tt.next.chars.isAllLower) {
            if (tt.next.chars.isCyrillicLetter && tt.next.getMorphClassInDictionary().isVerb) {
                let g = tt.next.morph.gender;
                if (g === MorphGender.FEMINIE) 
                    res.femaleVerbsAfterCount++;
                else if (((g.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                    res.maleVerbsAfterCount++;
            }
        }
        if (tt.previous !== null) {
            if ((tt.previous instanceof TextToken) && tt.previous.chars.isLetter && !tt.previous.chars.isAllLower) {
            }
            else 
                res.notCapitalBeforeCount++;
        }
        return res;
    }
    
    findItem(tt, doAbsolute = true) {
        if (tt === null) 
            return null;
        let res = null;
        let wrapres868 = new RefOutArgWrapper();
        let inoutres869 = this.m_Items.tryGetValue(tt.term, wrapres868);
        res = wrapres868.value;
        if (inoutres869) 
            return res;
        if (doAbsolute) {
            let s = MiscHelper.getAbsoluteNormalValue(tt.term, false);
            if (s !== null) {
                let wrapres862 = new RefOutArgWrapper();
                let inoutres863 = this.m_Items.tryGetValue(s, wrapres862);
                res = wrapres862.value;
                if (inoutres863) 
                    return res;
            }
        }
        for (const wff of tt.morph.items) {
            let wf = Utils.as(wff, MorphWordForm);
            if (wf === null) 
                continue;
            let wrapres866 = new RefOutArgWrapper();
            let inoutres867 = this.m_Items.tryGetValue((wf.normalCase != null ? wf.normalCase : ""), wrapres866);
            res = wrapres866.value;
            if (inoutres867) 
                return res;
            let wrapres864 = new RefOutArgWrapper();
            let inoutres865 = this.m_Items.tryGetValue(wf.normalFull, wrapres864);
            res = wrapres864.value;
            if (wf.normalFull !== null && inoutres865) 
                return res;
        }
        return null;
    }
    
    addBigramm(b1, b2) {
        let di = null;
        let wrapdi872 = new RefOutArgWrapper();
        let inoutres873 = this.m_Bigramms.tryGetValue(b1.normal, wrapdi872);
        di = wrapdi872.value;
        if (!inoutres873) 
            this.m_Bigramms.put(b1.normal, (di = new Hashtable()));
        if (di.containsKey(b2.normal)) 
            di.put(b2.normal, di.get(b2.normal) + 1);
        else 
            di.put(b2.normal, 1);
        let wrapdi870 = new RefOutArgWrapper();
        let inoutres871 = this.m_BigrammsRev.tryGetValue(b2.normal, wrapdi870);
        di = wrapdi870.value;
        if (!inoutres871) 
            this.m_BigrammsRev.put(b2.normal, (di = new Hashtable()));
        if (di.containsKey(b1.normal)) 
            di.put(b1.normal, di.get(b1.normal) + 1);
        else 
            di.put(b1.normal, 1);
    }
    
    /**
     * Получить статистическую информацию о биграмме токенов
     * @param t1 первый токен биграммы
     * @param t2 второй токен биграммы
     * @return информация о биграмме по всему тексту
     * 
     */
    getBigrammInfo(t1, t2) {
        let si1 = this.findItem(Utils.as(t1, TextToken), true);
        let si2 = this.findItem(Utils.as(t2, TextToken), true);
        if (si1 === null || si2 === null) 
            return null;
        return this._getBigramsInfo(si1, si2);
    }
    
    _getBigramsInfo(si1, si2) {
        let res = StatisticBigrammInfo._new874(si1.totalCount, si2.totalCount);
        let di12 = null;
        let wrapdi12876 = new RefOutArgWrapper();
        this.m_Bigramms.tryGetValue(si1.normal, wrapdi12876);
        di12 = wrapdi12876.value;
        let di21 = null;
        let wrapdi21875 = new RefOutArgWrapper();
        this.m_BigrammsRev.tryGetValue(si2.normal, wrapdi21875);
        di21 = wrapdi21875.value;
        if (di12 !== null) {
            if (!di12.containsKey(si2.normal)) 
                res.firstHasOtherSecond = true;
            else {
                res.pairCount = di12.get(si2.normal);
                if (di12.length > 1) 
                    res.firstHasOtherSecond = true;
            }
        }
        if (di21 !== null) {
            if (!di21.containsKey(si1.normal)) 
                res.secondHasOtherFirst = true;
            else if (!di21.containsKey(si1.normal)) 
                res.secondHasOtherFirst = true;
            else if (di21.length > 1) 
                res.secondHasOtherFirst = true;
        }
        return res;
    }
    
    getInitialInfo(ini, sur) {
        if (Utils.isNullOrEmpty(ini)) 
            return null;
        let si2 = this.findItem(Utils.as(sur, TextToken), true);
        if (si2 === null) 
            return null;
        let si1 = null;
        let wrapsi1877 = new RefOutArgWrapper();
        let inoutres878 = this.m_Items.tryGetValue(ini.substring(0, 0 + 1), wrapsi1877);
        si1 = wrapsi1877.value;
        if (!inoutres878) 
            return null;
        if (si1 === null) 
            return null;
        return this._getBigramsInfo(si1, si2);
    }
    
    /**
     * Получить информацию о словоформе токена
     * @param t токен
     * @return статистическая информация по тексту
     * 
     */
    getWordInfo(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        return this.findItem(tt, true);
    }
}


module.exports = StatisticCollection