/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");
const Stream = require("./../../unisharp/Stream");
const MemoryStream = require("./../../unisharp/MemoryStream");

const MorphTense = require("./../MorphTense");
const MorphVoice = require("./../MorphVoice");
const MorphMood = require("./../MorphMood");
const MorphPerson = require("./../MorphPerson");
const MorphNumber = require("./../MorphNumber");
const ByteArrayWrapper = require("./ByteArrayWrapper");
const MorphDeserializer = require("./MorphDeserializer");
const MorphMiscInfo = require("./../MorphMiscInfo");
const PullentiMorphInternalPropertiesResources = require("./properties/PullentiMorphInternalPropertiesResources");
const MorphLang = require("./../MorphLang");
const MorphGender = require("./../MorphGender");
const MorphCase = require("./../MorphCase");
const MorphRule = require("./MorphRule");
const MorphTreeNode = require("./MorphTreeNode");
const MorphBaseInfo = require("./../MorphBaseInfo");
const LanguageHelper = require("./../LanguageHelper");
const MorphClass = require("./../MorphClass");
const MorphWordForm = require("./../MorphWordForm");

class MorphEngine {
    
    constructor() {
        this.m_Lock = new Object();
        this.m_LazyBuf = null;
        this.m_Root = new MorphTreeNode();
        this.m_RootReverce = new MorphTreeNode();
        this.m_Rules = new Array();
        this.m_MiscInfos = new Array();
        this.language = new MorphLang();
    }
    
    getLazyBuf() {
        return this.m_LazyBuf;
    }
    
    addRule(r) {
        this.m_Rules.push(r);
    }
    
    getRule(id) {
        if (id > 0 && id <= this.m_Rules.length) 
            return this.m_Rules[id - 1];
        return null;
    }
    
    getMutRule(id) {
        if (id > 0 && id <= this.m_Rules.length) 
            return this.m_Rules[id - 1];
        return null;
    }
    
    getRuleVar(rid, vid) {
        let r = this.getRule(rid);
        if (r === null) 
            return null;
        return r.findVar(vid);
    }
    
    addMiscInfo(mi) {
        if (mi.id === 0) 
            mi.id = this.m_MiscInfos.length + 1;
        this.m_MiscInfos.push(mi);
    }
    
    getMiscInfo(id) {
        if (id > 0 && id <= this.m_MiscInfos.length) 
            return this.m_MiscInfos[id - 1];
        return null;
    }
    
    initialize(lang, lazyLoad) {
        if (!this.language.isUndefined) 
            return false;
        /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
            if (!this.language.isUndefined) 
                return false;
            this.language = lang;
            
            let rsname = ("m_" + lang.toString() + ".dat");
            let names = PullentiMorphInternalPropertiesResources.getNames();
            for (const n of names) {
                if (Utils.endsWithString(n, rsname, true)) {
                    let inf = PullentiMorphInternalPropertiesResources.getResourceInfo(n);
                    if (inf === null) 
                        continue;
                    let stream = PullentiMorphInternalPropertiesResources.getStream(n); 
                    try {
                        stream.position = 0;
                        this.deserialize(stream, false, lazyLoad);
                    }
                    finally {
                        stream.close();
                    }
                    return true;
                }
            }
            return false;
        }
    }
    
    _loadTreeNode(tn) {
        /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
            let pos = tn.lazyPos;
            if (pos > 0) {
                let wrappos221 = new RefOutArgWrapper(pos);
                tn.deserializeLazy(this.m_LazyBuf, this, wrappos221);
                pos = wrappos221.value;
            }
            tn.lazyPos = 0;
        }
    }
    
    calcTotalWords() {
        if (this.m_Root === null) 
            return 0;
        return this._calcWordsCount(this.m_Root);
    }
    
    _calcWordsCount(tn) {
        if (tn.lazyPos > 0) 
            this._loadTreeNode(tn);
        let res = 0;
        if (tn.ruleIds !== null) {
            for (const id of tn.ruleIds) {
                let rule = this.getRule(id);
                if (rule !== null) {
                    if (rule.morphVars !== null) {
                        for (const v of rule.morphVars) {
                            res += (v.length);
                        }
                    }
                }
            }
        }
        if (tn.nodes !== null) {
            for (const kp of tn.nodes.entries) {
                res += this._calcWordsCount(kp.value);
            }
        }
        return res;
    }
    
    process(word, ignoreNoDict = false) {
        if (Utils.isNullOrEmpty(word)) 
            return null;
        let res = null;
        let i = 0;
        if (word.length > 1) {
            for (i = 0; i < word.length; i++) {
                let ch = word[i];
                if (LanguageHelper.isCyrillicVowel(ch) || LanguageHelper.isLatinVowel(ch)) 
                    break;
            }
            if (i >= word.length) 
                return res;
        }
        let mvs = [ ];
        let tn = this.m_Root;
        for (i = 0; i <= word.length; i++) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.ruleIds !== null) {
                let wordBegin = null;
                let wordEnd = null;
                if (i === 0) 
                    wordEnd = word;
                else if (i < word.length) 
                    wordEnd = word.substring(i);
                else 
                    wordEnd = "";
                if (res === null) 
                    res = new Array();
                for (const rid of tn.ruleIds) {
                    let r = this.getRule(rid);
                    mvs = r.getVars(wordEnd);
                    if (mvs === null) 
                        continue;
                    if (wordBegin === null) {
                        if (i === word.length) 
                            wordBegin = word;
                        else if (i > 0) 
                            wordBegin = word.substring(0, 0 + i);
                        else 
                            wordBegin = "";
                    }
                    this.processResult(res, wordBegin, mvs);
                }
            }
            if (tn.nodes === null || i >= word.length) 
                break;
            let ch = word.charCodeAt(i);
            let wraptn222 = new RefOutArgWrapper();
            let inoutres223 = tn.nodes.tryGetValue(ch, wraptn222);
            tn = wraptn222.value;
            if (!inoutres223) 
                break;
        }
        let needTestUnknownVars = true;
        if (res !== null) {
            for (const r of res) {
                if ((r._class.isPronoun || r._class.isNoun || r._class.isAdjective) || (r._class.isMisc && r._class.isConjunction) || r._class.isPreposition) 
                    needTestUnknownVars = false;
                else if (r._class.isAdverb && r.normalCase !== null) {
                    if (!LanguageHelper.endsWithEx(r.normalCase, "О", "А", null, null)) 
                        needTestUnknownVars = false;
                    else if (r.normalCase === "МНОГО") 
                        needTestUnknownVars = false;
                }
                else if (r._class.isVerb && res.length > 1) {
                    let ok = false;
                    for (const rr of res) {
                        if (rr !== r && !rr._class.equals(r._class)) {
                            ok = true;
                            break;
                        }
                    }
                    if (ok && !LanguageHelper.endsWith(word, "ИМ")) 
                        needTestUnknownVars = false;
                }
            }
        }
        if (needTestUnknownVars && LanguageHelper.isCyrillicChar(word[0])) {
            let gl = 0;
            let sog = 0;
            for (let j = 0; j < word.length; j++) {
                if (LanguageHelper.isCyrillicVowel(word[j])) 
                    gl++;
                else 
                    sog++;
            }
            if ((gl < 2) || (sog < 2)) 
                needTestUnknownVars = false;
        }
        if (needTestUnknownVars && res !== null && res.length === 1) {
            if (res[0]._class.isVerb) {
                if (res[0].misc.attrs.includes("н.вр.") && res[0].misc.attrs.includes("нес.в.") && !res[0].misc.attrs.includes("страд.з.")) 
                    needTestUnknownVars = false;
                else if (res[0].misc.attrs.includes("б.вр.") && res[0].misc.attrs.includes("сов.в.")) 
                    needTestUnknownVars = false;
                else if (res[0].misc.attrs.includes("инф.") && res[0].misc.attrs.includes("сов.в.")) 
                    needTestUnknownVars = false;
                else if (res[0].normalCase !== null && LanguageHelper.endsWith(res[0].normalCase, "СЯ")) 
                    needTestUnknownVars = false;
            }
            if (res[0]._class.isUndefined && res[0].misc.attrs.includes("прдктв.")) 
                needTestUnknownVars = false;
        }
        if (needTestUnknownVars) {
            if (this.m_RootReverce === null) 
                return res;
            if (ignoreNoDict) 
                return res;
            tn = this.m_RootReverce;
            let tn0 = this.m_RootReverce;
            for (i = word.length - 1; i >= 0; i--) {
                if (tn.lazyPos > 0) 
                    this._loadTreeNode(tn);
                let ch = word.charCodeAt(i);
                if (tn.nodes === null) 
                    break;
                if (!tn.nodes.containsKey(ch)) 
                    break;
                tn = tn.nodes.get(ch);
                if (tn.lazyPos > 0) 
                    this._loadTreeNode(tn);
                if (tn.reverceVariants !== null) {
                    tn0 = tn;
                    break;
                }
            }
            if (tn0 !== this.m_RootReverce) {
                let glas = i < 4;
                for (; i >= 0; i--) {
                    if (LanguageHelper.isCyrillicVowel(word[i]) || LanguageHelper.isLatinVowel(word[i])) {
                        glas = true;
                        break;
                    }
                }
                if (glas) {
                    for (const mvref of tn0.reverceVariants) {
                        let mv = this.getRuleVar(mvref.ruleId, mvref.variantId);
                        if (mv === null) 
                            continue;
                        if (((!mv._class.isVerb && !mv._class.isAdjective && !mv._class.isNoun) && !mv._class.isProperSurname && !mv._class.isProperGeo) && !mv._class.isProperSecname) 
                            continue;
                        let ok = false;
                        for (const rr of res) {
                            if (rr.isInDictionary) {
                                if (rr._class.equals(mv._class) || rr._class.isNoun) {
                                    ok = true;
                                    break;
                                }
                                if (!mv._class.isAdjective && rr._class.isVerb) {
                                    ok = true;
                                    break;
                                }
                            }
                        }
                        if (ok) 
                            continue;
                        if (mv.tail.length > 0 && !LanguageHelper.endsWith(word, mv.tail)) 
                            continue;
                        let r = new MorphWordForm(mv, word, this.getMiscInfo(mv.miscInfoId));
                        if (!r.hasMorphEquals(res)) {
                            r.undefCoef = mvref.coef;
                            if (res === null) 
                                res = new Array();
                            res.push(r);
                        }
                    }
                }
            }
        }
        if (word === "ПРИ" && res !== null) {
            for (i = res.length - 1; i >= 0; i--) {
                if (res[i]._class.isProperGeo) 
                    res.splice(i, 1);
            }
        }
        if (res === null || res.length === 0) 
            return null;
        this.sort(res, word);
        for (const v of res) {
            if (v.normalCase === null) 
                v.normalCase = word;
            if (v._class.isVerb) {
                if (v.normalFull === null && LanguageHelper.endsWith(v.normalCase, "ТЬСЯ")) 
                    v.normalFull = v.normalCase.substring(0, 0 + v.normalCase.length - 2);
            }
            v.language = this.language;
            if (v._class.isPreposition) 
                v.normalCase = LanguageHelper.normalizePreposition(v.normalCase);
        }
        let mc = new MorphClass();
        for (i = res.length - 1; i >= 0; i--) {
            if (!res[i].isInDictionary && res[i]._class.isAdjective && res.length > 1) {
                if (res[i].misc.attrs.includes("к.ф.") || res[i].misc.attrs.includes("неизм.")) {
                    res.splice(i, 1);
                    continue;
                }
            }
            if (res[i].isInDictionary) 
                mc.value |= res[i]._class.value;
        }
        if (mc.equals(MorphClass.VERB) && res.length > 1) {
            for (const r of res) {
                if (r.undefCoef > (100) && r._class.equals(MorphClass.ADJECTIVE)) 
                    r.undefCoef = 0;
            }
        }
        if (res.length === 0) 
            return null;
        return res;
    }
    
    processResult(res, wordBegin, mvs) {
        for (const mv of mvs) {
            let r = new MorphWordForm(mv, null, this.getMiscInfo(mv.miscInfoId));{
                    if (mv.normalTail !== null && mv.normalTail.length > 0 && mv.normalTail[0] !== '-') 
                        r.normalCase = wordBegin + mv.normalTail;
                    else 
                        r.normalCase = wordBegin;
                }
            if (mv.fullNormalTail !== null) {
                if (mv.fullNormalTail.length > 0 && mv.fullNormalTail[0] !== '-') 
                    r.normalFull = wordBegin + mv.fullNormalTail;
                else 
                    r.normalFull = wordBegin;
            }
            if (!r.hasMorphEquals(res)) {
                r.undefCoef = 0;
                res.push(r);
            }
        }
    }
    
    getAllWordforms(word) {
        let res = new Array();
        let i = 0;
        let tn = this.m_Root;
        for (i = 0; i <= word.length; i++) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.ruleIds !== null) {
                let wordBegin = "";
                let wordEnd = "";
                if (i > 0) 
                    wordBegin = word.substring(0, 0 + i);
                else 
                    wordEnd = word;
                if (i < word.length) 
                    wordEnd = word.substring(i);
                else 
                    wordBegin = word;
                for (const rid of tn.ruleIds) {
                    let r = this.getRule(rid);
                    if (r.containsVar(wordEnd)) {
                        for (const vl of r.morphVars) {
                            for (const v of vl) {
                                let wf = new MorphWordForm(v, null, this.getMiscInfo(v.miscInfoId));
                                if (!wf.hasMorphEquals(res)) {
                                    wf.normalCase = wordBegin + v.tail;
                                    wf.undefCoef = 0;
                                    res.push(wf);
                                }
                            }
                        }
                    }
                }
            }
            if (tn.nodes === null || i >= word.length) 
                break;
            let ch = word.charCodeAt(i);
            let wraptn224 = new RefOutArgWrapper();
            let inoutres225 = tn.nodes.tryGetValue(ch, wraptn224);
            tn = wraptn224.value;
            if (!inoutres225) 
                break;
        }
        for (i = 0; i < res.length; i++) {
            let wf = res[i];
            if (wf.containsAttr("инф.", null)) 
                continue;
            let cas = wf._case;
            for (let j = i + 1; j < res.length; j++) {
                let wf1 = res[j];
                if (wf1.containsAttr("инф.", null)) 
                    continue;
                if ((wf._class.equals(wf1._class) && wf.gender === wf1.gender && wf.number === wf1.number) && wf.normalCase === wf1.normalCase) {
                    cas = MorphCase.ooBitor(cas, wf1._case);
                    res.splice(j, 1);
                    j--;
                }
            }
            if (!cas.equals(wf._case)) 
                res[i]._case = cas;
        }
        for (i = 0; i < res.length; i++) {
            let wf = res[i];
            if (wf.containsAttr("инф.", null)) 
                continue;
            for (let j = i + 1; j < res.length; j++) {
                let wf1 = res[j];
                if (wf1.containsAttr("инф.", null)) 
                    continue;
                if ((wf._class.equals(wf1._class) && wf._case.equals(wf1._case) && wf.number === wf1.number) && wf.normalCase === wf1.normalCase) {
                    wf.gender = MorphGender.of((wf.gender.value()) | (wf1.gender.value()));
                    res.splice(j, 1);
                    j--;
                }
            }
        }
        return res;
    }
    
    getWordform(word, cla, gender, cas, num, addInfo) {
        let i = 0;
        let tn = this.m_Root;
        let find = false;
        let res = null;
        let maxCoef = -10;
        for (i = 0; i <= word.length; i++) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.ruleIds !== null) {
                let wordBegin = "";
                let wordEnd = "";
                if (i > 0) 
                    wordBegin = word.substring(0, 0 + i);
                else 
                    wordEnd = word;
                if (i < word.length) 
                    wordEnd = word.substring(i);
                else 
                    wordBegin = word;
                for (const rid of tn.ruleIds) {
                    let r = this.getRule(rid);
                    if (r !== null && r.containsVar(wordEnd)) {
                        for (const li of r.morphVars) {
                            for (const v of li) {
                                if ((((cla.value) & (v._class.value))) !== 0 && v.normalTail !== null) {
                                    if (cas.isUndefined) {
                                        if (v._case.isNominative || v._case.isUndefined) {
                                        }
                                        else 
                                            continue;
                                    }
                                    else if ((MorphCase.ooBitand(v._case, cas)).isUndefined) 
                                        continue;
                                    let sur = cla.isProperSurname;
                                    let sur0 = v._class.isProperSurname;
                                    if (sur || sur0) {
                                        if (sur !== sur0) 
                                            continue;
                                    }
                                    find = true;
                                    if (gender !== MorphGender.UNDEFINED) {
                                        if (((gender.value()) & (v.gender.value())) === (MorphGender.UNDEFINED.value())) {
                                            if (num === MorphNumber.PLURAL) {
                                            }
                                            else 
                                                continue;
                                        }
                                    }
                                    if (num !== MorphNumber.UNDEFINED) {
                                        if (((num.value()) & (v.number.value())) === (MorphNumber.UNDEFINED.value())) 
                                            continue;
                                    }
                                    let re = wordBegin + v.tail;
                                    let co = 0;
                                    if (addInfo !== null) 
                                        co = this._calcEqCoef(v, addInfo);
                                    if (res === null || co > maxCoef) {
                                        res = re;
                                        maxCoef = co;
                                    }
                                    if (maxCoef === 0) {
                                        if ((wordBegin + v.normalTail) === word) 
                                            return wordBegin + v.tail;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (tn.nodes === null || i >= word.length) 
                break;
            let ch = word.charCodeAt(i);
            let wraptn226 = new RefOutArgWrapper();
            let inoutres227 = tn.nodes.tryGetValue(ch, wraptn226);
            tn = wraptn226.value;
            if (!inoutres227) 
                break;
        }
        if (find) 
            return res;
        tn = this.m_RootReverce;
        let tn0 = this.m_RootReverce;
        for (i = word.length - 1; i >= 0; i--) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            let ch = word.charCodeAt(i);
            if (tn.nodes === null) 
                break;
            if (!tn.nodes.containsKey(ch)) 
                break;
            tn = tn.nodes.get(ch);
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.reverceVariants !== null) {
                tn0 = tn;
                break;
            }
        }
        if (tn0 === this.m_RootReverce) 
            return null;
        for (const mvr of tn0.reverceVariants) {
            let rule = this.getRule(mvr.ruleId);
            if (rule === null) 
                continue;
            let mv = rule.findVar(mvr.variantId);
            if (mv === null) 
                continue;
            if ((((mv._class.value) & (cla.value))) !== 0) {
                if (mv.tail.length > 0 && !LanguageHelper.endsWith(word, mv.tail)) 
                    continue;
                let wordBegin = word.substring(0, 0 + word.length - mv.tail.length);
                for (const liv of rule.morphVars) {
                    for (const v of liv) {
                        if ((((v._class.value) & (cla.value))) !== 0) {
                            let sur = cla.isProperSurname;
                            let sur0 = v._class.isProperSurname;
                            if (sur || sur0) {
                                if (sur !== sur0) 
                                    continue;
                            }
                            if (!cas.isUndefined) {
                                if ((MorphCase.ooBitand(cas, v._case)).isUndefined && !v._case.isUndefined) 
                                    continue;
                            }
                            if (num !== MorphNumber.UNDEFINED) {
                                if (v.number !== MorphNumber.UNDEFINED) {
                                    if (((v.number.value()) & (num.value())) === (MorphNumber.UNDEFINED.value())) 
                                        continue;
                                }
                            }
                            if (gender !== MorphGender.UNDEFINED) {
                                if (v.gender !== MorphGender.UNDEFINED) {
                                    if (((v.gender.value()) & (gender.value())) === (MorphGender.UNDEFINED.value())) 
                                        continue;
                                }
                            }
                            if (addInfo !== null) {
                                if (this._calcEqCoef(v, addInfo) < 0) 
                                    continue;
                            }
                            res = wordBegin + v.tail;
                            if (res === word) 
                                return word;
                            return res;
                        }
                    }
                }
            }
        }
        if (cla.isProperSurname) {
            if ((gender === MorphGender.FEMINIE && cla.isProperSurname && !cas.isUndefined) && !cas.isNominative) {
                if (word.endsWith("ВА") || word.endsWith("НА")) {
                    if (cas.isAccusative) 
                        return word.substring(0, 0 + word.length - 1) + "У";
                    return word.substring(0, 0 + word.length - 1) + "ОЙ";
                }
            }
            if (gender === MorphGender.FEMINIE) {
                let last = word[word.length - 1];
                if (last === 'А' || last === 'Я' || last === 'О') 
                    return word;
                if (LanguageHelper.isCyrillicVowel(last)) 
                    return word.substring(0, 0 + word.length - 1) + "А";
                else if (last === 'Й') 
                    return word.substring(0, 0 + word.length - 2) + "АЯ";
                else 
                    return word + "А";
            }
        }
        return res;
    }
    
    correctWordByMorph(word, oneVar) {
        let vars = new Array();
        let tmp = new StringBuilder();
        for (let ch = 0; ch < word.length; ch++) {
            tmp.length = 0;
            tmp.append(word);
            tmp.setCharAt(ch, '*');
            let _var = this._checkCorrVar(tmp.toString(), this.m_Root, 0);
            if (_var !== null) {
                if (!vars.includes(_var)) 
                    vars.push(_var);
            }
        }
        if (vars.length === 0 || !oneVar) {
            for (let ch = 1; ch < word.length; ch++) {
                tmp.length = 0;
                tmp.append(word);
                tmp.insert(ch, '*');
                let _var = this._checkCorrVar(tmp.toString(), this.m_Root, 0);
                if (_var !== null) {
                    if (!vars.includes(_var)) 
                        vars.push(_var);
                }
            }
        }
        if (vars.length === 0 || !oneVar) {
            for (let ch = 0; ch < (word.length - 1); ch++) {
                tmp.length = 0;
                tmp.append(word);
                tmp.remove(ch, 1);
                let _var = this._checkCorrVar(tmp.toString(), this.m_Root, 0);
                if (_var !== null) {
                    if (!vars.includes(_var)) 
                        vars.push(_var);
                }
            }
        }
        if (vars.length === 0) 
            return null;
        return vars;
    }
    
    _checkCorrVar(word, tn, i) {
        for (; i <= word.length; i++) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.ruleIds !== null) {
                let wordBegin = "";
                let wordEnd = "";
                if (i > 0) 
                    wordBegin = word.substring(0, 0 + i);
                else 
                    wordEnd = word;
                if (i < word.length) 
                    wordEnd = word.substring(i);
                else 
                    wordBegin = word;
                for (const rid of tn.ruleIds) {
                    let r = this.getRule(rid);
                    if (r.containsVar(wordEnd)) 
                        return wordBegin + wordEnd;
                    if (wordEnd.indexOf('*') >= 0) {
                        for (const v of r.tails) {
                            if (v.length === wordEnd.length) {
                                let j = 0;
                                for (j = 0; j < v.length; j++) {
                                    if (wordEnd[j] === '*' || wordEnd[j] === v[j]) {
                                    }
                                    else 
                                        break;
                                }
                                if (j >= v.length) 
                                    return wordBegin + v;
                            }
                        }
                    }
                }
            }
            if (tn.nodes === null || i >= word.length) 
                break;
            let ch = word.charCodeAt(i);
            if (ch !== (0x2A)) {
                if (!tn.nodes.containsKey(ch)) 
                    break;
                tn = tn.nodes.get(ch);
                continue;
            }
            if (tn.nodes !== null) {
                for (const tnn of tn.nodes.entries) {
                    let ww = Utils.replaceString(word, '*', String.fromCharCode(tnn.key));
                    let res = this._checkCorrVar(ww, tnn.value, i + 1);
                    if (res !== null) 
                        return res;
                }
            }
            break;
        }
        return null;
    }
    
    processSurnameVariants(word, res) {
        this.processProperVariants(word, res, false);
    }
    
    processGeoVariants(word, res) {
        this.processProperVariants(word, res, true);
    }
    
    processProperVariants(word, res, geo) {
        let tn = this.m_RootReverce;
        let nodesWithVars = null;
        let i = 0;
        for (i = word.length - 1; i >= 0; i--) {
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            let ch = word.charCodeAt(i);
            if (tn.nodes === null) 
                break;
            if (!tn.nodes.containsKey(ch)) 
                break;
            tn = tn.nodes.get(ch);
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            if (tn.reverceVariants !== null) {
                if (nodesWithVars === null) 
                    nodesWithVars = new Array();
                nodesWithVars.push(tn);
            }
        }
        if (nodesWithVars === null) 
            return;
        for (let j = nodesWithVars.length - 1; j >= 0; j--) {
            tn = nodesWithVars[j];
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
            let ok = false;
            for (const vr of tn.reverceVariants) {
                let v = this.getRuleVar(vr.ruleId, vr.variantId);
                if (v === null) 
                    continue;
                if (geo && v._class.isProperGeo) {
                }
                else if (!geo && v._class.isProperSurname) {
                }
                else 
                    continue;
                let r = new MorphWordForm(v, word, this.getMiscInfo(v.miscInfoId));
                if (!r.hasMorphEquals(res)) {
                    r.undefCoef = vr.coef;
                    res.push(r);
                }
                ok = true;
            }
            if (ok) 
                break;
        }
    }
    
    _compare(x, y) {
        if (x.isInDictionary && !y.isInDictionary) 
            return -1;
        if (!x.isInDictionary && y.isInDictionary) 
            return 1;
        if (x.undefCoef > (0)) {
            if (x.undefCoef > ((y.undefCoef) * 2)) 
                return -1;
            if (((x.undefCoef) * 2) < y.undefCoef) 
                return 1;
        }
        if (!x._class.equals(y._class)) {
            if ((x._class.isPreposition || x._class.isConjunction || x._class.isPronoun) || x._class.isPersonalPronoun) 
                return -1;
            if ((y._class.isPreposition || y._class.isConjunction || y._class.isPronoun) || y._class.isPersonalPronoun) 
                return 1;
            if (x._class.isVerb) 
                return 1;
            if (y._class.isVerb) 
                return -1;
            if (x._class.isNoun) 
                return -1;
            if (y._class.isNoun) 
                return 1;
        }
        let cx = this._calcCoef(x);
        let cy = this._calcCoef(y);
        if (cx > cy) 
            return -1;
        if (cx < cy) 
            return 1;
        if (x.number === MorphNumber.PLURAL && y.number !== MorphNumber.PLURAL) 
            return 1;
        if (y.number === MorphNumber.PLURAL && x.number !== MorphNumber.PLURAL) 
            return -1;
        return 0;
    }
    
    _calcCoef(wf) {
        let k = 0;
        if (!wf._case.isUndefined) 
            k++;
        if (wf.gender !== MorphGender.UNDEFINED) 
            k++;
        if (wf.number !== MorphNumber.UNDEFINED) 
            k++;
        if (wf.misc.isSynonymForm) 
            k -= 3;
        if (wf.normalCase === null || (wf.normalCase.length < 4)) 
            return k;
        if (wf._class.isAdjective && wf.number !== MorphNumber.PLURAL) {
            let last = wf.normalCase[wf.normalCase.length - 1];
            let last1 = wf.normalCase[wf.normalCase.length - 2];
            let ok = false;
            if (wf.gender === MorphGender.FEMINIE) {
                if (last === 'Я') 
                    ok = true;
            }
            if (wf.gender === MorphGender.MASCULINE) {
                if (last === 'Й') {
                    if (last1 === 'И') 
                        k++;
                    ok = true;
                }
            }
            if (wf.gender === MorphGender.NEUTER) {
                if (last === 'Е') 
                    ok = true;
            }
            if (ok) {
                if (LanguageHelper.isCyrillicVowel(last1)) 
                    k++;
            }
        }
        else if (wf._class.isAdjective && wf.number === MorphNumber.PLURAL) {
            let last = wf.normalCase[wf.normalCase.length - 1];
            let last1 = wf.normalCase[wf.normalCase.length - 2];
            if (last === 'Й' || last === 'Е') 
                k++;
        }
        return k;
    }
    
    _calcEqCoef(v, wf) {
        if (wf._class.value !== (0)) {
            if ((((v._class.value) & (wf._class.value))) === 0) 
                return -1;
        }
        if (v.miscInfoId !== wf.misc.id) {
            let vi = this.getMiscInfo(v.miscInfoId);
            if (vi.mood !== MorphMood.UNDEFINED && wf.misc.mood !== MorphMood.UNDEFINED) {
                if (vi.mood !== wf.misc.mood) 
                    return -1;
            }
            if (vi.tense !== MorphTense.UNDEFINED && wf.misc.tense !== MorphTense.UNDEFINED) {
                if (((vi.tense.value()) & (wf.misc.tense.value())) === (MorphTense.UNDEFINED.value())) 
                    return -1;
            }
            if (vi.voice !== MorphVoice.UNDEFINED && wf.misc.voice !== MorphVoice.UNDEFINED) {
                if (vi.voice !== wf.misc.voice) 
                    return -1;
            }
            if (vi.person !== MorphPerson.UNDEFINED && wf.misc.person !== MorphPerson.UNDEFINED) {
                if (((vi.person.value()) & (wf.misc.person.value())) === (MorphPerson.UNDEFINED.value())) 
                    return -1;
            }
            return 0;
        }
        if (!v.checkAccord(wf, false, false)) 
            return -1;
        return 1;
    }
    
    sort(res, word) {
        if (res === null || (res.length < 2)) 
            return;
        for (let k = 0; k < res.length; k++) {
            let ch = false;
            for (let i = 0; i < (res.length - 1); i++) {
                let j = this._compare(res[i], res[i + 1]);
                if (j > 0) {
                    let r1 = res[i];
                    let r2 = res[i + 1];
                    res[i] = r2;
                    res[i + 1] = r1;
                    ch = true;
                }
            }
            if (!ch) 
                break;
        }
        for (let i = 0; i < (res.length - 1); i++) {
            for (let j = i + 1; j < res.length; j++) {
                if (this.comp1(res[i], res[j])) {
                    if ((res[i]._class.isAdjective && res[j]._class.isNoun && !res[j].isInDictionary) && !res[i].isInDictionary) 
                        res.splice(j, 1);
                    else if ((res[i]._class.isNoun && res[j]._class.isAdjective && !res[j].isInDictionary) && !res[i].isInDictionary) 
                        res.splice(i, 1);
                    else if (res[i]._class.isAdjective && res[j]._class.isPronoun) 
                        res.splice(i, 1);
                    else if (res[i]._class.isPronoun && res[j]._class.isAdjective) {
                        if (res[j].normalFull === "ОДИН" || res[j].normalCase === "ОДИН") 
                            continue;
                        res.splice(j, 1);
                    }
                    else 
                        continue;
                    i--;
                    break;
                }
            }
        }
    }
    
    comp1(r1, r2) {
        if (r1.number !== r2.number || r1.gender !== r2.gender) 
            return false;
        if (!r1._case.equals(r2._case)) 
            return false;
        if (r1.normalCase !== r2.normalCase) 
            return false;
        return true;
    }
    
    deserialize(str0, ignoreRevTree, lazyLoad) {
        let tmp = new MemoryStream();
        MorphDeserializer.deflateGzip(str0, tmp);
        let arr = tmp.toByteArray();
        let buf = new ByteArrayWrapper(arr);
        let pos = 0;
        let wrappos236 = new RefOutArgWrapper(pos);
        let cou = buf.deserializeInt(wrappos236);
        pos = wrappos236.value;
        for (; cou > 0; cou--) {
            let mi = new MorphMiscInfo();
            let wrappos228 = new RefOutArgWrapper(pos);
            mi.deserialize(buf, wrappos228);
            pos = wrappos228.value;
            this.addMiscInfo(mi);
        }
        let wrappos235 = new RefOutArgWrapper(pos);
        cou = buf.deserializeInt(wrappos235);
        pos = wrappos235.value;
        for (; cou > 0; cou--) {
            let wrappos230 = new RefOutArgWrapper(pos);
            let p1 = buf.deserializeInt(wrappos230);
            pos = wrappos230.value;
            let r = new MorphRule();
            if (lazyLoad) {
                r.lazyPos = pos;
                pos = p1;
            }
            else {
                let wrappos229 = new RefOutArgWrapper(pos);
                r.deserialize(buf, wrappos229);
                pos = wrappos229.value;
            }
            this.addRule(r);
        }
        let root = new MorphTreeNode();
        if (lazyLoad) {
            let wrappos231 = new RefOutArgWrapper(pos);
            root.deserializeLazy(buf, this, wrappos231);
            pos = wrappos231.value;
        }
        else {
            let wrappos232 = new RefOutArgWrapper(pos);
            root.deserialize(buf, wrappos232);
            pos = wrappos232.value;
        }
        this.m_Root = root;
        if (!ignoreRevTree) {
            let rootRev = new MorphTreeNode();
            if (lazyLoad) {
                let wrappos233 = new RefOutArgWrapper(pos);
                rootRev.deserializeLazy(buf, this, wrappos233);
                pos = wrappos233.value;
            }
            else {
                let wrappos234 = new RefOutArgWrapper(pos);
                rootRev.deserialize(buf, wrappos234);
                pos = wrappos234.value;
            }
            this.m_RootReverce = rootRev;
        }
        tmp.close();
        if (lazyLoad) 
            this.m_LazyBuf = buf;
    }
}


module.exports = MorphEngine