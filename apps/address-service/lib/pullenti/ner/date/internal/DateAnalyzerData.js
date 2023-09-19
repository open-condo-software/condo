/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const AnalyzerData = require("./../../core/AnalyzerData");

class DateAnalyzerData extends AnalyzerData {
    
    constructor() {
        super();
        this.m_Hash = new Hashtable();
        this.dRegime = false;
    }
    
    get referents() {
        return this.m_Hash.values;
    }
    
    registerReferent(referent) {
        let key = referent.toString();
        let dr = null;
        let wrapdr932 = new RefOutArgWrapper();
        let inoutres933 = this.m_Hash.tryGetValue(key, wrapdr932);
        dr = wrapdr932.value;
        if (inoutres933) 
            return dr;
        this.m_Hash.put(key, referent);
        return referent;
    }
}


module.exports = DateAnalyzerData