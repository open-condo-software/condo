/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const Stream = require("./../../unisharp/Stream");
const MemoryStream = require("./../../unisharp/MemoryStream");

const ByteArrayWrapper = require("./../../morph/internal/ByteArrayWrapper");
const DerivateGroup = require("./../utils/DerivateGroup");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MorphDeserializer = require("./../../morph/internal/MorphDeserializer");
const ExplanTreeNode = require("./ExplanTreeNode");
const PullentiSemanticUtilsPropertiesResources = require("./../utils/properties/PullentiSemanticUtilsPropertiesResources");
const MorphLang = require("./../../morph/MorphLang");

class DerivateDictionary {
    
    constructor() {
        this.lang = null;
        this.m_Inited = false;
        this.m_Buf = null;
        this.m_Root = new ExplanTreeNode();
        this.m_AllGroups = new Array();
        this.m_Lock = new Object();
    }
    
    load(dat) {
        let mem = new MemoryStream(dat); 
        try {
            this.m_AllGroups.splice(0, this.m_AllGroups.length);
            this.m_Root = new ExplanTreeNode();
            this.deserialize(mem, true);
            this.m_Inited = true;
        }
        finally {
            mem.close();
        }
    }
    
    init(_lang, lazy) {
        if (this.m_Inited) 
            return true;
        
        let rsname = ("d_" + _lang.toString() + ".dat");
        let names = PullentiSemanticUtilsPropertiesResources.getNames();
        for (const n of names) {
            if (Utils.endsWithString(n, rsname, true)) {
                let inf = PullentiSemanticUtilsPropertiesResources.getResourceInfo(n);
                if (inf === null) 
                    continue;
                let stream = PullentiSemanticUtilsPropertiesResources.getStream(n); 
                try {
                    stream.position = 0;
                    this.m_AllGroups.splice(0, this.m_AllGroups.length);
                    this.deserialize(stream, lazy);
                    this.lang = _lang;
                }
                finally {
                    stream.close();
                }
                this.m_Inited = true;
                return true;
            }
        }
        return false;
    }
    
    unload() {
        this.m_Root = new ExplanTreeNode();
        this.m_AllGroups.splice(0, this.m_AllGroups.length);
        this.lang = new MorphLang();
    }
    
    getGroup(id) {
        if (id >= 1 && id <= this.m_AllGroups.length) 
            return this.m_AllGroups[id - 1];
        return null;
    }
    
    _loadTreeNode(tn) {
        /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
            let pos = tn.lazyPos;
            if (pos > 0) {
                let wrappos2980 = new RefOutArgWrapper(pos);
                tn.deserialize(this.m_Buf, this, true, wrappos2980);
                pos = wrappos2980.value;
            }
            tn.lazyPos = 0;
        }
    }
    
    deserialize(str, lazyLoad) {
        let wr = null;
        let tmp = new MemoryStream(); 
        try {
            MorphDeserializer.deflateGzip(str, tmp);
            wr = new ByteArrayWrapper(tmp.toByteArray());
            let pos = 0;
            let wrappos2984 = new RefOutArgWrapper(pos);
            let cou = wr.deserializeInt(wrappos2984);
            pos = wrappos2984.value;
            for (; cou > 0; cou--) {
                let wrappos2982 = new RefOutArgWrapper(pos);
                let p1 = wr.deserializeInt(wrappos2982);
                pos = wrappos2982.value;
                let ew = new DerivateGroup();
                if (lazyLoad) {
                    ew.lazyPos = pos;
                    pos = p1;
                }
                else {
                    let wrappos2981 = new RefOutArgWrapper(pos);
                    ew.deserialize(wr, wrappos2981);
                    pos = wrappos2981.value;
                }
                ew.id = this.m_AllGroups.length + 1;
                this.m_AllGroups.push(ew);
            }
            this.m_Root = new ExplanTreeNode();
            let wrappos2983 = new RefOutArgWrapper(pos);
            this.m_Root.deserialize(wr, this, lazyLoad, wrappos2983);
            pos = wrappos2983.value;
        }
        finally {
            tmp.close();
        }
        this.m_Buf = wr;
    }
    
    find(word, tryCreate, _lang) {
        if (Utils.isNullOrEmpty(word)) 
            return null;
        let tn = this.m_Root;
        let i = 0;
        for (i = 0; i < word.length; i++) {
            let k = word.charCodeAt(i);
            if (tn.nodes === null) 
                break;
            if (!tn.nodes.containsKey(k)) 
                break;
            tn = tn.nodes.get(k);
            if (tn.lazyPos > 0) 
                this._loadTreeNode(tn);
        }
        let li = null;
        if (i >= word.length && tn.groups !== null) {
            li = new Array();
            for (const g of tn.groups) {
                li.push(this.getGroup(g));
            }
            let gen = false;
            let nogen = false;
            for (const g of li) {
                if (g.isGenerated) 
                    gen = true;
                else 
                    nogen = true;
            }
            if (gen && nogen) {
                for (i = li.length - 1; i >= 0; i--) {
                    if (li[i].isGenerated) 
                        li.splice(i, 1);
                }
            }
        }
        if (li !== null && _lang !== null && !_lang.isUndefined) {
            for (i = li.length - 1; i >= 0; i--) {
                if (!li[i].containsWord(word, _lang)) 
                    li.splice(i, 1);
            }
        }
        if (li !== null && li.length > 0) 
            return li;
        if (word.length < 4) 
            return null;
        let ch0 = word[word.length - 1];
        let ch1 = word[word.length - 2];
        let ch2 = word[word.length - 3];
        if (ch0 === 'О' || ((ch0 === 'И' && ch1 === 'К'))) {
            let word1 = word.substring(0, 0 + word.length - 1);
            if ((((li = this.find(word1 + "ИЙ", false, _lang)))) !== null) 
                return li;
            if ((((li = this.find(word1 + "ЫЙ", false, _lang)))) !== null) 
                return li;
            if (ch0 === 'О' && ch1 === 'Н') {
                if ((((li = this.find(word1 + "СКИЙ", false, _lang)))) !== null) 
                    return li;
            }
        }
        else if (((ch0 === 'Я' || ch0 === 'Ь')) && (word[word.length - 2] === 'С')) {
            let word1 = word.substring(0, 0 + word.length - 2);
            if (word1 === "ЯТЬ") 
                return null;
            if ((((li = this.find(word1, false, _lang)))) !== null) 
                return li;
        }
        else if (ch0 === 'Е' && ch1 === 'Ь') {
            let word1 = word.substring(0, 0 + word.length - 2) + "ИЕ";
            if ((((li = this.find(word1, false, _lang)))) !== null) 
                return li;
        }
        else if (ch0 === 'Й' && ch2 === 'Н' && tryCreate) {
            let ch3 = word[word.length - 4];
            let word1 = null;
            if (ch3 !== 'Н') {
                if (LanguageHelper.isCyrillicVowel(ch3)) 
                    word1 = word.substring(0, 0 + word.length - 3) + "Н" + word.substring(word.length - 3);
            }
            else 
                word1 = word.substring(0, 0 + word.length - 4) + word.substring(word.length - 3);
            if (word1 !== null) {
                if ((((li = this.find(word1, false, _lang)))) !== null) 
                    return li;
            }
        }
        if (ch0 === 'Й' && ch1 === 'О') {
            let word2 = word.substring(0, 0 + word.length - 2);
            if ((((li = this.find(word2 + "ИЙ", false, _lang)))) !== null) 
                return li;
            if ((((li = this.find(word2 + "ЫЙ", false, _lang)))) !== null) 
                return li;
        }
        if (!tryCreate) 
            return null;
        return null;
    }
}


module.exports = DerivateDictionary