/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const Token = require("./../Token");
const TextToken = require("./../TextToken");
const NumberExType = require("./../core/NumberExType");
const ProcessorService = require("./../ProcessorService");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const ReferentToken = require("./../ReferentToken");
const Referent = require("./../Referent");
const MetaToken = require("./../MetaToken");
const MoneyReferent = require("./MoneyReferent");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const MoneyMeta = require("./internal/MoneyMeta");
const NumberToken = require("./../NumberToken");
const NumberHelper = require("./../core/NumberHelper");
const Analyzer = require("./../Analyzer");

/**
 * Анализатор для денежных сумм
 */
class MoneyAnalyzer extends Analyzer {
    
    get name() {
        return MoneyAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Деньги";
    }
    
    get description() {
        return "Деньги...";
    }
    
    clone() {
        return new MoneyAnalyzer();
    }
    
    get progressWeight() {
        return 1;
    }
    
    get typeSystem() {
        return [MoneyMeta.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MoneyMeta.IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("money2.png"));
        res.put(MoneyMeta.IMAGE2ID, PullentiNerBankInternalResourceHelper.getBytes("moneyerr.png"));
        return res;
    }
    
    get usedExternObjectTypes() {
        return ["GEO", "DATE"];
    }
    
    createReferent(type) {
        if (type === MoneyReferent.OBJ_TYPENAME) 
            return new MoneyReferent();
        return null;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let mon = MoneyAnalyzer.tryParse(t);
            if (mon !== null) {
                mon.referent = ad.registerReferent(mon.referent);
                kit.embedToken(mon);
                t = mon;
                continue;
            }
        }
    }
    
    static tryParse(t) {
        if (t === null) 
            return null;
        if (!(t instanceof NumberToken) && t.lengthChar !== 1) 
            return null;
        let nex = NumberHelper.tryParseNumberWithPostfix(t);
        if (nex === null || nex.exTyp !== NumberExType.MONEY) {
            if ((t instanceof NumberToken) && (t.next instanceof TextToken) && (t.next.next instanceof NumberToken)) {
                if (t.next.isHiphen || t.next.morph._class.isPreposition) {
                    let res1 = NumberHelper.tryParseNumberWithPostfix(t.next.next);
                    if (res1 !== null && res1.exTyp === NumberExType.MONEY) {
                        let res0 = new MoneyReferent();
                        if ((t.next.isHiphen && res1.realValue === 0 && res1.endToken.next !== null) && res1.endToken.next.isChar('(')) {
                            let nex2 = NumberHelper.tryParseNumberWithPostfix(res1.endToken.next.next);
                            if ((nex2 !== null && nex2.exTypParam === res1.exTypParam && nex2.endToken.next !== null) && nex2.endToken.next.isChar(')')) {
                                if (nex2.value === t.value) {
                                    res0.currency = nex2.exTypParam;
                                    res0.addSlot(MoneyReferent.ATTR_VALUE, nex2.value, true, 0);
                                    return new ReferentToken(res0, t, nex2.endToken.next);
                                }
                                if (t.previous instanceof NumberToken) {
                                    if (nex2.value === (((String(t.previous.realValue * (1000))) + t.value))) {
                                        res0.currency = nex2.exTypParam;
                                        res0.addSlot(MoneyReferent.ATTR_VALUE, nex2.value, true, 0);
                                        return new ReferentToken(res0, t.previous, nex2.endToken.next);
                                    }
                                    else if (t.previous.previous instanceof NumberToken) {
                                        if (nex2.realValue === (((t.previous.previous.realValue * (1000000)) + (t.previous.realValue * (1000)) + t.realValue))) {
                                            res0.currency = nex2.exTypParam;
                                            res0.addSlot(MoneyReferent.ATTR_VALUE, nex2.value, true, 0);
                                            return new ReferentToken(res0, t.previous.previous, nex2.endToken.next);
                                        }
                                    }
                                }
                            }
                        }
                        res0.currency = res1.exTypParam;
                        res0.addSlot(MoneyReferent.ATTR_VALUE, t.value, false, 0);
                        return new ReferentToken(res0, t, t);
                    }
                }
            }
            return null;
        }
        let res = new MoneyReferent();
        res.currency = nex.exTypParam;
        let val = nex.value;
        if (val.indexOf('.') > 0) 
            val = val.substring(0, 0 + val.indexOf('.'));
        res.addSlot(MoneyReferent.ATTR_VALUE, val, true, 0);
        let re = Math.floor(Utils.mathRound(((nex.realValue - res.value)) * (100), 6));
        if (re !== 0) 
            res.addSlot(MoneyReferent.ATTR_REST, re.toString(), true, 0);
        if (nex.realValue !== nex.altRealValue) {
            if (Math.floor(res.value) !== Math.floor(nex.altRealValue)) {
                val = NumberHelper.doubleToString(nex.altRealValue);
                if (val.indexOf('.') > 0) 
                    val = val.substring(0, 0 + val.indexOf('.'));
                res.addSlot(MoneyReferent.ATTR_ALTVALUE, val, true, 0);
            }
            re = Math.floor(Utils.mathRound(((nex.altRealValue - (Math.floor(nex.altRealValue)))) * (100), 6));
            if (re !== res.rest && re !== 0) 
                res.addSlot(MoneyReferent.ATTR_ALTREST, re.toString(), true, 0);
        }
        if (nex.altRestMoney > 0) 
            res.addSlot(MoneyReferent.ATTR_ALTREST, nex.altRestMoney.toString(), true, 0);
        let t1 = nex.endToken;
        if (t1.next !== null && t1.next.isChar('(')) {
            let rt = MoneyAnalyzer.tryParse(t1.next.next);
            if ((rt !== null && rt.referent.canBeEquals(res, ReferentsEqualType.WITHINONETEXT) && rt.endToken.next !== null) && rt.endToken.next.isChar(')')) 
                t1 = rt.endToken.next;
            else {
                rt = MoneyAnalyzer.tryParse(t1.next);
                if (rt !== null && rt.referent.canBeEquals(res, ReferentsEqualType.WITHINONETEXT)) 
                    t1 = rt.endToken;
            }
        }
        if (res.altValue !== null && res.altValue > res.value) {
            if (t.whitespacesBeforeCount === 1 && (t.previous instanceof NumberToken)) {
                let delt = Math.floor((res.altValue - res.value));
                if ((((res.value < 1000) && ((delt % 1000)) === 0)) || (((res.value < 1000000) && ((delt % 1000000)) === 0))) {
                    t = t.previous;
                    res.addSlot(MoneyReferent.ATTR_VALUE, res.getStringValue(MoneyReferent.ATTR_ALTVALUE), true, 0);
                    res.addSlot(MoneyReferent.ATTR_ALTVALUE, null, true, 0);
                }
            }
        }
        return new ReferentToken(res, t, t1);
    }
    
    processReferent(begin, param) {
        return MoneyAnalyzer.tryParse(begin);
    }
    
    static initialize() {
        if (MoneyAnalyzer.m_Inited) 
            return;
        MoneyAnalyzer.m_Inited = true;
        MoneyMeta.initialize();
        ProcessorService.registerAnalyzer(new MoneyAnalyzer());
    }
    
    static static_constructor() {
        MoneyAnalyzer.ANALYZER_NAME = "MONEY";
        MoneyAnalyzer.m_Inited = false;
    }
}


MoneyAnalyzer.static_constructor();

module.exports = MoneyAnalyzer