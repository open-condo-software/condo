/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const Token = require("./../Token");
const UriReferent = require("./../uri/UriReferent");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const ProcessorService = require("./../ProcessorService");
const NumberToken = require("./../NumberToken");
const TextToken = require("./../TextToken");
const Referent = require("./../Referent");
const PullentiNerBankInternalResourceHelper = require("./internal/PullentiNerBankInternalResourceHelper");
const Termin = require("./../core/Termin");
const BankDataReferent = require("./BankDataReferent");
const MetaBank = require("./internal/MetaBank");
const TerminCollection = require("./../core/TerminCollection");
const MetaToken = require("./../MetaToken");
const TerminParseAttr = require("./../core/TerminParseAttr");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const ReferentToken = require("./../ReferentToken");
const Analyzer = require("./../Analyzer");

/**
 * Анализатор банковских данных (счетов, платёжных реквизитов...)
 */
class BankAnalyzer extends Analyzer {
    
    get name() {
        return BankAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Банковские данные";
    }
    
    get description() {
        return "Банковские реквизиты, счета и пр.";
    }
    
    clone() {
        return new BankAnalyzer();
    }
    
    get progressWeight() {
        return 1;
    }
    
    get typeSystem() {
        return [MetaBank.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaBank.IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("dollar.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === BankDataReferent.OBJ_TYPENAME) 
            return new BankDataReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return ["URI", "ORGANIZATION"];
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let rt = null;
            if (t.chars.isLetter) {
                let tok = BankAnalyzer.m_Ontology.tryParse(t, TerminParseAttr.NO);
                if (tok !== null) {
                    let tt = tok.endToken.next;
                    if (tt !== null && tt.isChar(':')) 
                        tt = tt.next;
                    rt = this.tryAttach(tt, true);
                    if (rt !== null) 
                        rt.beginToken = t;
                }
            }
            if (rt === null && (((t instanceof ReferentToken) || t.isNewlineBefore))) 
                rt = this.tryAttach(t, false);
            if (rt !== null) {
                rt.referent = ad.registerReferent(rt.referent);
                kit.embedToken(rt);
                t = rt;
            }
        }
    }
    
    static _isBankReq(txt) {
        if (((((((txt === "Р/С" || txt === "К/С" || txt === "Л/С") || txt === "ОКФС" || txt === "ОКАТО") || txt === "ОГРН" || txt === "БИК") || txt === "SWIFT" || txt === "ОКПО") || txt === "ОКВЭД" || txt === "ОКОНХ") || txt === "КБК" || txt === "ИНН") || txt === "КПП") 
            return true;
        else 
            return false;
    }
    
    tryAttach(t, keyWord) {
        if (t === null) 
            return null;
        let t0 = t;
        let t1 = t;
        let urisKeys = null;
        let uris = null;
        let org = null;
        let corOrg = null;
        let orgIsBank = false;
        let empty = 0;
        let lastUri = null;
        for (; t !== null; t = t.next) {
            if (t.isTableControlChar && t !== t0) 
                break;
            if (t.isComma || t.morph._class.isPreposition || t.isCharOf("/\\")) 
                continue;
            let bankKeyword = false;
            if (t.isValue("ПОЛНЫЙ", null) && t.next !== null && ((t.next.isValue("НАИМЕНОВАНИЕ", null) || t.next.isValue("НАЗВАНИЕ", null)))) {
                t = t.next.next;
                if (t === null) 
                    break;
            }
            if (t.isValue("БАНК", null)) {
                if ((t instanceof ReferentToken) && t.getReferent().typeName === "ORGANIZATION") 
                    bankKeyword = true;
                let tt = t.next;
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) 
                    tt = npt.endToken.next;
                if (tt !== null && tt.isChar(':')) 
                    tt = tt.next;
                if (tt !== null) {
                    if (!bankKeyword) {
                        t = tt;
                        bankKeyword = true;
                    }
                    else if (tt.getReferent() !== null && tt.getReferent().typeName === "ORGANIZATION") 
                        t = tt;
                }
            }
            let r = t.getReferent();
            if (r !== null && r.typeName === "ORGANIZATION") {
                let isBank = false;
                let kk = 0;
                for (let rr = r; rr !== null && (kk < 4); rr = rr.parentReferent,kk++) {
                    isBank = Utils.compareStrings(Utils.notNull(rr.getStringValue("KIND"), ""), "Bank", true) === 0;
                    if (isBank) 
                        break;
                }
                if (!isBank && bankKeyword) 
                    isBank = true;
                if (!isBank && uris !== null && urisKeys.includes("ИНН")) 
                    return null;
                if ((lastUri !== null && lastUri.scheme === "К/С" && t.previous !== null) && t.previous.isValue("В", null)) {
                    corOrg = r;
                    t1 = t;
                }
                else if (org === null || ((!orgIsBank && isBank))) {
                    org = r;
                    t1 = t;
                    orgIsBank = isBank;
                    if (isBank) 
                        continue;
                }
                if (uris === null && !keyWord) 
                    return null;
                continue;
            }
            if (r instanceof UriReferent) {
                let u = Utils.as(r, UriReferent);
                if (uris === null) {
                    if (!BankAnalyzer._isBankReq(u.scheme)) 
                        return null;
                    if (u.scheme === "ИНН" && t.isNewlineAfter) 
                        return null;
                    uris = new Array();
                    urisKeys = new Array();
                }
                else {
                    if (!BankAnalyzer._isBankReq(u.scheme)) 
                        break;
                    if (urisKeys.includes(u.scheme)) 
                        break;
                    if (u.scheme === "ИНН") {
                        if (empty > 0) 
                            break;
                    }
                }
                urisKeys.push(u.scheme);
                uris.push(u);
                lastUri = u;
                t1 = t;
                empty = 0;
                continue;
            }
            else if (uris === null && !keyWord && !orgIsBank) 
                return null;
            if (r !== null && ((r.typeName === "GEO" || r.typeName === "ADDRESS"))) {
                empty++;
                continue;
            }
            if (t instanceof TextToken) {
                if (t.isValue("ПОЛНЫЙ", null) || t.isValue("НАИМЕНОВАНИЕ", null) || t.isValue("НАЗВАНИЕ", null)) {
                }
                else if (t.chars.isLetter) {
                    let tok = BankAnalyzer.m_Ontology.tryParse(t, TerminParseAttr.NO);
                    if (tok !== null) {
                        t = tok.endToken;
                        empty = 0;
                    }
                    else {
                        empty++;
                        if (t.isNewlineBefore) {
                            let nnn = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                            if (nnn !== null && nnn.endToken.next !== null && nnn.endToken.next.isChar(':')) 
                                break;
                        }
                    }
                    if (uris === null) 
                        break;
                }
            }
            if (empty > 2) 
                break;
            if (empty > 0 && t.isChar(':') && t.isNewlineAfter) 
                break;
            if (((t instanceof NumberToken) && t.isNewlineBefore && t.next !== null) && !t.next.chars.isLetter) 
                break;
        }
        if (uris === null) 
            return null;
        if (!urisKeys.includes("Р/С") && !urisKeys.includes("Л/С")) 
            return null;
        let ok = false;
        if ((uris.length < 2) && org === null) 
            return null;
        let bdr = new BankDataReferent();
        for (const u of uris) {
            bdr.addSlot(BankDataReferent.ATTR_ITEM, u, false, 0);
        }
        if (org !== null) 
            bdr.addSlot(BankDataReferent.ATTR_BANK, org, false, 0);
        if (corOrg !== null) 
            bdr.addSlot(BankDataReferent.ATTR_CORBANK, corOrg, false, 0);
        let org0 = (t0.previous === null ? null : t0.previous.getReferent());
        if (org0 !== null && org0.typeName === "ORGANIZATION") {
            for (const s of org0.slots) {
                if (s.value instanceof UriReferent) {
                    let u = Utils.as(s.value, UriReferent);
                    if (BankAnalyzer._isBankReq(u.scheme)) {
                        if (!urisKeys.includes(u.scheme)) 
                            bdr.addSlot(BankDataReferent.ATTR_ITEM, u, false, 0);
                    }
                }
            }
        }
        return new ReferentToken(bdr, t0, t1);
    }
    
    static initialize() {
        if (BankAnalyzer.m_Ontology !== null) 
            return;
        MetaBank.initialize();
        BankAnalyzer.m_Ontology = new TerminCollection();
        let t = new Termin("БАНКОВСКИЕ РЕКВИЗИТЫ", null, true);
        t.addVariant("ПЛАТЕЖНЫЕ РЕКВИЗИТЫ", false);
        t.addVariant("РЕКВИЗИТЫ", false);
        BankAnalyzer.m_Ontology.add(t);
        ProcessorService.registerAnalyzer(new BankAnalyzer());
    }
    
    static static_constructor() {
        BankAnalyzer.ANALYZER_NAME = "BANKDATA";
        BankAnalyzer.m_Ontology = null;
    }
}


BankAnalyzer.static_constructor();

module.exports = BankAnalyzer