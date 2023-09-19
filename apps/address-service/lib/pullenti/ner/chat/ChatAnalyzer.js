/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const MetaToken = require("./../MetaToken");
const ReferentToken = require("./../ReferentToken");
const Referent = require("./../Referent");
const ProcessorService = require("./../ProcessorService");
const TextToken = require("./../TextToken");
const Termin = require("./../core/Termin");
const VerbType = require("./VerbType");
const ChatReferent = require("./ChatReferent");
const PullentiNerBusinessInternalResourceHelper = require("./../business/internal/PullentiNerBusinessInternalResourceHelper");
const MetaChat = require("./internal/MetaChat");
const ChatType = require("./ChatType");
const ChatItemToken = require("./internal/ChatItemToken");
const Analyzer = require("./../Analyzer");

class ChatAnalyzer extends Analyzer {
    
    get name() {
        return ChatAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Элемент диалога";
    }
    
    get description() {
        return "";
    }
    
    clone() {
        return new ChatAnalyzer();
    }
    
    get typeSystem() {
        return [MetaChat.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaChat.IMAGE_ID, PullentiNerBusinessInternalResourceHelper.getBytes("chat.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === ChatReferent.OBJ_TYPENAME) 
            return new ChatReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    get isSpecific() {
        return true;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let toks = new Array();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            let cit = ChatItemToken.tryParse(t);
            if (cit === null) 
                continue;
            toks.push(cit);
            t = cit.endToken;
        }
        for (let i = 0; i < (toks.length - 1); i++) {
            if (((toks[i].typ === ChatType.ACCEPT || toks[i].typ === ChatType.CANCEL)) && ChatAnalyzer._canMerge(toks[i], toks[i + 1])) {
                if (toks[i + 1].typ === toks[i].typ) {
                    toks[i].endToken = toks[i + 1].endToken;
                    toks.splice(i + 1, 1);
                    i--;
                    continue;
                }
                if (toks[i + 1].typ === ChatType.CANCEL || ((toks[i + 1].typ === ChatType.VERB && toks[i + 1].not))) {
                    toks[i + 1].beginToken = toks[i].beginToken;
                    toks.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        for (const cit of toks) {
            let cr = ChatReferent._new684(cit.typ);
            if (cit.value !== null) 
                cr.value = cit.value;
            if (cit.vTyp !== VerbType.UNDEFINED) 
                cr.addVerbType(cit.vTyp);
            if (cit.not) 
                cr.not = true;
            cr = Utils.as(ad.registerReferent(cr), ChatReferent);
            let rt = new ReferentToken(cr, cit.beginToken, cit.endToken);
            kit.embedToken(rt);
        }
    }
    
    static _canMerge(t1, t2) {
        for (let t = t1.endToken.next; t !== null && (t.endChar < t2.beginChar); t = t.next) {
            if (!(t instanceof TextToken)) 
                return false;
            if (t.lengthChar < 2) 
                continue;
            let mc = t.getMorphClassInDictionary();
            if (((mc.isAdverb || mc.isPreposition || mc.isPronoun) || mc.isPersonalPronoun || mc.isMisc) || mc.isConjunction) 
                continue;
            return false;
        }
        return true;
    }
    
    static initialize() {
        if (ChatAnalyzer.m_Inited) 
            return;
        ChatAnalyzer.m_Inited = true;
        try {
            MetaChat.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            ChatItemToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new ChatAnalyzer());
    }
    
    static static_constructor() {
        ChatAnalyzer.ANALYZER_NAME = "CHAT";
        ChatAnalyzer.m_Inited = false;
    }
}


ChatAnalyzer.static_constructor();

module.exports = ChatAnalyzer