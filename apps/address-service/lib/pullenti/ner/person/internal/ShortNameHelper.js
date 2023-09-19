/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const SourceOfAnalysis = require("./../../SourceOfAnalysis");
const TextToken = require("./../../TextToken");
const MorphGender = require("./../../../morph/MorphGender");
const AnalysisKit = require("./../../core/AnalysisKit");
const PullentiNerPersonInternalResourceHelper = require("./PullentiNerPersonInternalResourceHelper");

class ShortNameHelper {
    
    static getShortnamesForName(name) {
        let res = new Array();
        for (const kp of ShortNameHelper.m_Shorts_Names.entries) {
            for (const v of kp.value) {
                if (v.name === name) {
                    if (!res.includes(kp.key)) 
                        res.push(kp.key);
                }
            }
        }
        return res;
    }
    
    static getNamesForShortname(shortname) {
        let res = [ ];
        let wrapres2688 = new RefOutArgWrapper();
        let inoutres2689 = ShortNameHelper.m_Shorts_Names.tryGetValue(shortname, wrapres2688);
        res = wrapres2688.value;
        if (!inoutres2689) 
            return null;
        else 
            return res;
    }
    
    static initialize() {
        if (ShortNameHelper.m_Inited) 
            return;
        ShortNameHelper.m_Inited = true;
        let obj = PullentiNerPersonInternalResourceHelper.getString("ShortNames.txt");
        if (obj !== null) {
            let kit = new AnalysisKit(new SourceOfAnalysis(obj));
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isNewlineBefore) {
                    let g = (t.isValue("F", null) ? MorphGender.FEMINIE : MorphGender.MASCULINE);
                    t = t.next;
                    let nam = t.term;
                    let shos = new Array();
                    for (t = t.next; t !== null; t = t.next) {
                        if (t.isNewlineBefore) 
                            break;
                        else 
                            shos.push(t.term);
                    }
                    for (const s of shos) {
                        let li = null;
                        let wrapli2691 = new RefOutArgWrapper();
                        let inoutres2692 = ShortNameHelper.m_Shorts_Names.tryGetValue(s, wrapli2691);
                        li = wrapli2691.value;
                        if (!inoutres2692) 
                            ShortNameHelper.m_Shorts_Names.put(s, (li = new Array()));
                        li.push(ShortNameHelper.ShortnameVar._new2690(nam, g));
                    }
                    if (t === null) 
                        break;
                    t = t.previous;
                }
            }
        }
    }
    
    static static_constructor() {
        ShortNameHelper.m_Shorts_Names = new Hashtable();
        ShortNameHelper.m_Inited = false;
    }
}


ShortNameHelper.ShortnameVar = class  {
    
    constructor() {
        this.name = null;
        this.gender = MorphGender.UNDEFINED;
    }
    
    toString() {
        return this.name;
    }
    
    static _new2690(_arg1, _arg2) {
        let res = new ShortNameHelper.ShortnameVar();
        res.name = _arg1;
        res.gender = _arg2;
        return res;
    }
}


ShortNameHelper.static_constructor();

module.exports = ShortNameHelper