/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const MorphGender = require("./../../morph/MorphGender");
const OrganizationReferent = require("./../org/OrganizationReferent");
const MorphNumber = require("./../../morph/MorphNumber");
const ReferentToken = require("./../ReferentToken");
const Referent = require("./../Referent");
const BracketParseAttr = require("./../core/BracketParseAttr");
const Termin = require("./../core/Termin");
const ProcessorService = require("./../ProcessorService");
const PersonReferent = require("./../person/PersonReferent");
const BracketHelper = require("./../core/BracketHelper");
const NumberToken = require("./../NumberToken");
const FundsItemTyp = require("./internal/FundsItemTyp");
const OrganizationAnalyzer = require("./../org/OrganizationAnalyzer");
const MoneyReferent = require("./../money/MoneyReferent");
const DateReferent = require("./../date/DateReferent");
const Token = require("./../Token");
const FundsReferent = require("./FundsReferent");
const MetaBusinessFact = require("./internal/MetaBusinessFact");
const Analyzer = require("./../Analyzer");
const FundsMeta = require("./internal/FundsMeta");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const BusinessFactReferent = require("./BusinessFactReferent");
const BusinessFactKind = require("./BusinessFactKind");
const TextToken = require("./../TextToken");
const DateRangeReferent = require("./../date/DateRangeReferent");
const BusinessFactItemTyp = require("./internal/BusinessFactItemTyp");
const MetaToken = require("./../MetaToken");
const FundsItemToken = require("./internal/FundsItemToken");
const BusinessFactItem = require("./internal/BusinessFactItem");

/**
 * Анализатор для бизнес-фактов (в реальных проектах не использовалось). 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor, 
 * указав имя анализатора.
 */
class BusinessAnalyzer extends Analyzer {
    
    get name() {
        return BusinessAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Бизнес-объекты";
    }
    
    get description() {
        return "Бизнес факты";
    }
    
    get isSpecific() {
        return true;
    }
    
    clone() {
        return new BusinessAnalyzer();
    }
    
    get typeSystem() {
        return [MetaBusinessFact.GLOBAL_META, FundsMeta.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaBusinessFact.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("businessfact.png"));
        res.put(FundsMeta.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("creditcards.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === BusinessFactReferent.OBJ_TYPENAME) 
            return new BusinessFactReferent();
        if (type === FundsReferent.OBJ_TYPENAME) 
            return new FundsReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let rt = FundsItemToken.tryAttach(t);
            if (rt !== null) {
                rt.referent = ad.registerReferent(rt.referent);
                kit.embedToken(rt);
                t = rt;
            }
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let rt = this.analizeFact(t);
            if (rt !== null) {
                rt.referent = ad.registerReferent(rt.referent);
                kit.embedToken(rt);
                t = rt;
                let rts = this._analizeLikelihoods(rt);
                if (rts !== null) {
                    for (const rt0 of rts) {
                        for (const s of rt0.referent.slots) {
                            if (s.typeName === BusinessFactReferent.ATTR_WHAT && (s.value instanceof FundsReferent)) 
                                rt0.referent.uploadSlot(s, ad.registerReferent(Utils.as(s.value, Referent)));
                        }
                        rt0.referent = ad.registerReferent(rt0.referent);
                        kit.embedToken(rt0);
                        t = rt0;
                    }
                }
                continue;
            }
        }
    }
    
    analizeFact(t) {
        if (t === null) 
            return null;
        let bfi = BusinessFactItem.tryParse(t);
        if (bfi === null) 
            return null;
        if (bfi.typ === BusinessFactItemTyp.BASE) {
            if (bfi.baseKind === BusinessFactKind.GET || bfi.baseKind === BusinessFactKind.SELL) 
                return this._analizeGet(bfi);
            if (bfi.baseKind === BusinessFactKind.HAVE) {
                if (bfi.isBasePassive || bfi.morph._class.isNoun) {
                    let re = this._analizeHave(bfi);
                    if (re !== null) 
                        return re;
                }
                return this._analizeGet(bfi);
            }
            if (bfi.baseKind === BusinessFactKind.PROFIT || bfi.baseKind === BusinessFactKind.DAMAGES) 
                return this._analizeProfit(bfi);
            if (bfi.baseKind === BusinessFactKind.AGREEMENT || bfi.baseKind === BusinessFactKind.LAWSUIT) 
                return this._analizeAgreement(bfi);
            if (bfi.baseKind === BusinessFactKind.SUBSIDIARY) 
                return this._analizeSubsidiary(bfi);
            if (bfi.baseKind === BusinessFactKind.FINANCE) 
                return this._analizeFinance(bfi);
        }
        return null;
    }
    
    _FindRefBefore(t) {
        if (t === null) 
            return null;
        let points = 0;
        let t0 = null;
        let t1 = t;
        for (; t !== null; t = t.previous) {
            if (t.isNewlineAfter) 
                break;
            if (t.morph._class.isAdverb || t.morph._class.isPreposition || t.isComma) 
                continue;
            if (t.morph._class.isPersonalPronoun) 
                break;
            if (t.isValue("ИНФОРМАЦИЯ", null) || t.isValue("ДАННЫЕ", null)) 
                continue;
            if (t.isValue("ІНФОРМАЦІЯ", null) || t.isValue("ДАНІ", null)) 
                continue;
            if (t instanceof TextToken) {
                if (t.morph._class.isVerb) 
                    break;
                if (t.isChar('.')) 
                    break;
                continue;
            }
            let r = t.getReferent();
            if ((r instanceof DateReferent) || (r instanceof DateRangeReferent)) 
                continue;
            break;
        }
        if (t === null) 
            return null;
        if (t.morph._class.isPersonalPronoun) {
            t0 = t;
            points = 1;
            t = t.previous;
        }
        else {
            if (t.morph._class.isPronoun) {
                t = t.previous;
                if (t !== null && t.isChar(',')) 
                    t = t.previous;
            }
            if (t === null) 
                return null;
            let refs = t.getReferents();
            if (refs !== null) {
                for (const r of refs) {
                    if ((r instanceof PersonReferent) || (r instanceof OrganizationReferent) || (r instanceof FundsReferent)) 
                        return new ReferentToken(r, t, t1);
                }
            }
            return null;
        }
        for (; t !== null; t = t.previous) {
            if (t.isChar('.')) {
                if ((--points) < 0) 
                    break;
                continue;
            }
            let refs = t.getReferents();
            if (refs !== null) {
                for (const r of refs) {
                    if ((r instanceof PersonReferent) || (r instanceof OrganizationReferent)) 
                        return new ReferentToken(r, t0, t1);
                }
            }
        }
        return null;
    }
    
    _FindSecRefBefore(rt) {
        let t = (rt === null ? null : rt.beginToken.previous);
        if (t === null || t.whitespacesAfterCount > 2) 
            return null;
        if ((rt.getReferent() instanceof PersonReferent) && (t.getReferent() instanceof OrganizationReferent)) 
            return Utils.as(t, ReferentToken);
        return null;
    }
    
    _findDate(bfr, t) {
        for (let tt = t; tt !== null; tt = tt.previous) {
            let r = tt.getReferent();
            if ((r instanceof DateReferent) || (r instanceof DateRangeReferent)) {
                bfr.when = r;
                return true;
            }
            if (tt.isChar('.')) 
                break;
            if (tt.isNewlineBefore) 
                break;
        }
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt !== t && tt.isNewlineBefore) 
                break;
            let r = tt.getReferent();
            if ((r instanceof DateReferent) || (r instanceof DateRangeReferent)) {
                bfr.when = r;
                return true;
            }
            if (tt.isChar('.')) 
                break;
        }
        return false;
    }
    
    _findSum(bfr, t) {
        for (; t !== null; t = t.next) {
            if (t.isChar('.') || t.isNewlineBefore) 
                break;
            let r = t.getReferent();
            if (r instanceof MoneyReferent) {
                let fu = Utils.as(bfr.getSlotValue(BusinessFactReferent.ATTR_WHAT), FundsReferent);
                if (fu !== null) {
                    if (fu.sum === null) {
                        fu.sum = Utils.as(r, MoneyReferent);
                        return true;
                    }
                }
                bfr.addSlot(BusinessFactReferent.ATTR_MISC, r, false, 0);
                return true;
            }
        }
        return false;
    }
    
    _analizeGet(bfi) {
        let bef = this._FindRefBefore(bfi.beginToken.previous);
        if (bef === null) 
            return null;
        let t1 = bfi.endToken.next;
        if (t1 === null) 
            return null;
        for (; t1 !== null; t1 = t1.next) {
            if (t1.morph._class.isAdverb) 
                continue;
            if (t1.isValue("ПРАВО", null) || t1.isValue("РАСПОРЯЖАТЬСЯ", null) || t1.isValue("РОЗПОРЯДЖАТИСЯ", null)) 
                continue;
            break;
        }
        if (t1 === null) 
            return null;
        if ((t1.getReferent() instanceof FundsReferent) && !(bef.referent instanceof FundsReferent)) {
            let fr = Utils.as(t1.getReferent(), FundsReferent);
            let bfr = BusinessFactReferent._new649(bfi.baseKind);
            bfr.who = bef.referent;
            let bef2 = this._FindSecRefBefore(bef);
            if (bef2 !== null) {
                bfr.addSlot(BusinessFactReferent.ATTR_WHO, bef2.referent, false, 0);
                bef = bef2;
            }
            if (fr.source === bef.referent && bef2 === null) {
                bef2 = this._FindRefBefore(bef.beginToken.previous);
                if (bef2 !== null) {
                    bef = bef2;
                    bfr.who = bef.referent;
                }
            }
            if (fr.source === bef.referent) {
                let cou = 0;
                for (let tt = bef.beginToken.previous; tt !== null; tt = tt.previous) {
                    if ((++cou) > 100) 
                        break;
                    let refs = tt.getReferents();
                    if (refs === null) 
                        continue;
                    for (const r of refs) {
                        if ((r instanceof OrganizationReferent) && r !== bef.referent) {
                            cou = 1000;
                            fr.source = Utils.as(r, OrganizationReferent);
                            break;
                        }
                    }
                }
            }
            bfr.addWhat(fr);
            bfr.typ = (bfi.baseKind === BusinessFactKind.GET ? "покупка ценных бумаг" : (bfi.baseKind === BusinessFactKind.SELL ? "продажа ценных бумаг" : "владение ценными бумагами"));
            this._findDate(bfr, bef.beginToken);
            this._findSum(bfr, bef.endToken);
            return new ReferentToken(bfr, bef.beginToken, t1);
        }
        if ((bfi.morph._class.isNoun && ((bfi.baseKind === BusinessFactKind.GET || bfi.baseKind === BusinessFactKind.SELL)) && (t1.getReferent() instanceof OrganizationReferent)) || (t1.getReferent() instanceof PersonReferent)) {
            if ((bef.referent instanceof FundsReferent) || (bef.referent instanceof OrganizationReferent)) {
                let bfr = BusinessFactReferent._new649(bfi.baseKind);
                if (bfi.baseKind === BusinessFactKind.GET) 
                    bfr.typ = (bef.referent instanceof FundsReferent ? "покупка ценных бумаг" : "покупка компании");
                else if (bfi.baseKind === BusinessFactKind.SELL) 
                    bfr.typ = (bef.referent instanceof FundsReferent ? "продажа ценных бумаг" : "продажа компании");
                bfr.who = t1.getReferent();
                bfr.addWhat(bef.referent);
                this._findDate(bfr, bef.beginToken);
                this._findSum(bfr, bef.endToken);
                t1 = BusinessAnalyzer._addWhosList(t1, bfr);
                return new ReferentToken(bfr, bef.beginToken, t1);
            }
        }
        if ((bef.referent instanceof OrganizationReferent) || (bef.referent instanceof PersonReferent)) {
            let tt = t1;
            if (tt !== null && tt.morph._class.isPreposition) 
                tt = tt.next;
            let slav = (tt === null ? null : tt.getReferent());
            if ((((slav instanceof PersonReferent) || (slav instanceof OrganizationReferent))) && tt.next !== null && (tt.next.getReferent() instanceof FundsReferent)) {
                let bfr = BusinessFactReferent._new649(bfi.baseKind);
                bfr.typ = (bfi.baseKind === BusinessFactKind.GET ? "покупка ценных бумаг" : "продажа ценных бумаг");
                bfr.who = bef.referent;
                let bef2 = this._FindSecRefBefore(bef);
                if (bef2 !== null) {
                    bfr.addSlot(BusinessFactReferent.ATTR_WHO, bef2.referent, false, 0);
                    bef = bef2;
                }
                bfr.whom = slav;
                bfr.addWhat(tt.next.getReferent());
                this._findDate(bfr, bef.beginToken);
                this._findSum(bfr, bef.endToken);
                return new ReferentToken(bfr, bef.beginToken, tt.next);
            }
            else if (slav instanceof OrganizationReferent) {
                let bfr = BusinessFactReferent._new649(bfi.baseKind);
                bfr.typ = (bfi.baseKind === BusinessFactKind.GET ? "покупка компании" : "продажа компании");
                bfr.who = bef.referent;
                let bef2 = this._FindSecRefBefore(bef);
                if (bef2 !== null) {
                    bfr.addSlot(BusinessFactReferent.ATTR_WHO, bef2.referent, false, 0);
                    bef = bef2;
                }
                bfr.addWhat(slav);
                this._findDate(bfr, bef.beginToken);
                this._findSum(bfr, bef.endToken);
                return new ReferentToken(bfr, bef.beginToken, tt.next);
            }
        }
        if ((bef.referent instanceof FundsReferent) && (((t1.getReferent() instanceof OrganizationReferent) || (t1.getReferent() instanceof PersonReferent)))) {
            let bfr = BusinessFactReferent._new649(bfi.baseKind);
            bfr.typ = (bfi.baseKind === BusinessFactKind.GET ? "покупка ценных бумаг" : (bfi.baseKind === BusinessFactKind.SELL ? "продажа ценных бумаг" : "владение ценными бумагами"));
            bfr.who = t1.getReferent();
            bfr.addWhat(bef.referent);
            this._findDate(bfr, bef.beginToken);
            this._findSum(bfr, bef.endToken);
            return new ReferentToken(bfr, bef.beginToken, t1);
        }
        return null;
    }
    
    static _addWhosList(t1, bfr) {
        if (t1 === null) 
            return null;
        if ((t1.next !== null && t1.next.isCommaAnd && (t1.next.next instanceof ReferentToken)) && t1.next.next.getReferent().typeName === t1.getReferent().typeName) {
            let li = new Array();
            li.push(t1.next.next.getReferent());
            if (t1.next.isAnd) 
                t1 = t1.next.next;
            else {
                let ok = false;
                for (let tt = t1.next.next.next; tt !== null; tt = tt.next) {
                    if (!tt.isCommaAnd) 
                        break;
                    if (!(tt.next instanceof ReferentToken)) 
                        break;
                    if (tt.next.getReferent().typeName !== t1.getReferent().typeName) 
                        break;
                    li.push(tt.next.getReferent());
                    if (tt.isAnd) {
                        ok = true;
                        t1 = tt.next;
                        break;
                    }
                }
                if (!ok) 
                    li = null;
            }
            if (li !== null) {
                for (const r of li) {
                    bfr.addSlot(BusinessFactReferent.ATTR_WHO, r, false, 0);
                }
            }
        }
        return t1;
    }
    
    _analizeGet2(t) {
        if (t === null) 
            return null;
        let tt = t.previous;
        let ts = t;
        if (tt !== null && tt.isComma) 
            tt = tt.previous;
        let bef = this._FindRefBefore(tt);
        let master = null;
        let slave = null;
        if (bef !== null && (bef.referent instanceof FundsReferent)) {
            slave = bef.referent;
            ts = bef.beginToken;
        }
        tt = t.next;
        if (tt === null) 
            return null;
        let te = tt;
        let r = tt.getReferent();
        if ((r instanceof PersonReferent) || (r instanceof OrganizationReferent)) {
            master = r;
            if (slave === null && tt.next !== null) {
                if ((((r = tt.next.getReferent()))) !== null) {
                    if ((r instanceof FundsReferent) || (r instanceof OrganizationReferent)) {
                        slave = Utils.as(r, FundsReferent);
                        te = tt.next;
                    }
                }
            }
        }
        if (master !== null && slave !== null) {
            let bfr = BusinessFactReferent._new649(BusinessFactKind.HAVE);
            bfr.who = master;
            if (slave instanceof OrganizationReferent) {
                bfr.addWhat(slave);
                bfr.typ = "владение компанией";
            }
            else if (slave instanceof FundsReferent) {
                bfr.addWhat(slave);
                bfr.typ = "владение ценными бумагами";
            }
            else 
                return null;
            return new ReferentToken(bfr, ts, te);
        }
        return null;
    }
    
    _analizeHave(bfi) {
        let t = bfi.endToken.next;
        let t1 = null;
        if (t !== null && ((t.isValue("КОТОРЫЙ", null) || t.isValue("ЯКИЙ", null)))) 
            t1 = t.next;
        else {
            for (let tt = bfi.beginToken; tt !== bfi.endToken; tt = tt.next) {
                if (tt.morph._class.isPronoun) 
                    t1 = t;
            }
            if (t1 === null) {
                if (bfi.isBasePassive && t !== null && (((t.getReferent() instanceof PersonReferent) || (t.getReferent() instanceof OrganizationReferent)))) {
                    t1 = t;
                    if (t.next !== null && (t.next.getReferent() instanceof FundsReferent)) {
                        let bfr = BusinessFactReferent._new649(BusinessFactKind.HAVE);
                        bfr.who = t.getReferent();
                        bfr.addWhat(t.next.getReferent());
                        bfr.typ = "владение ценными бумагами";
                        return new ReferentToken(bfr, bfi.beginToken, t.next);
                    }
                }
            }
        }
        let t0 = null;
        let slave = null;
        let musBeVerb = false;
        if (t1 !== null) {
            let tt0 = bfi.beginToken.previous;
            if (tt0 !== null && tt0.isChar(',')) 
                tt0 = tt0.previous;
            let bef = this._FindRefBefore(tt0);
            if (bef === null) 
                return null;
            if (!(bef.referent instanceof OrganizationReferent)) 
                return null;
            t0 = bef.beginToken;
            slave = bef.referent;
        }
        else if (bfi.endToken.getMorphClassInDictionary().isNoun && (t.getReferent() instanceof OrganizationReferent)) {
            slave = t.getReferent();
            t1 = t.next;
            t0 = bfi.beginToken;
            musBeVerb = true;
        }
        if (t0 === null || t1 === null || slave === null) 
            return null;
        if ((t1.isHiphen || t1.isValue("ЯВЛЯТЬСЯ", null) || t1.isValue("БУТИ", null)) || t1.isValue("Є", null)) 
            t1 = t1.next;
        else if (musBeVerb) 
            return null;
        let r = (t1 === null ? null : t1.getReferent());
        if ((r instanceof OrganizationReferent) || (r instanceof PersonReferent)) {
            let bfr = BusinessFactReferent._new649(BusinessFactKind.HAVE);
            bfr.who = r;
            bfr.addWhat(slave);
            if (bfi.endToken.isValue("АКЦИОНЕР", null) || bfi.endToken.isValue("АКЦІОНЕР", null)) 
                bfr.typ = "владение ценными бумагами";
            else 
                bfr.typ = "владение компанией";
            t1 = BusinessAnalyzer._addWhosList(t1, bfr);
            return new ReferentToken(bfr, t0, t1);
        }
        return null;
    }
    
    _analizeProfit(bfi) {
        if (bfi.endToken.next === null) 
            return null;
        let t0 = bfi.beginToken;
        let t1 = bfi.endToken;
        let typ = t1.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase();
        let org = null;
        org = Utils.as(t1.next.getReferent(), OrganizationReferent);
        let t = t1;
        if (org !== null) 
            t = t.next;
        else {
            let rt = t.kit.processReferent(OrganizationAnalyzer.ANALYZER_NAME, t.next, null);
            if (rt !== null) {
                org = Utils.as(rt.referent, OrganizationReferent);
                t = rt.endToken;
            }
        }
        let dt = null;
        let sum = null;
        for (t = t.next; t !== null; t = t.next) {
            if (t.isChar('.')) 
                break;
            if (t.isChar('(')) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    t = br.endToken;
                    continue;
                }
            }
            if ((((t.morph._class.isVerb || t.isValue("ДО", null) || t.isHiphen) || t.isValue("РАЗМЕР", null) || t.isValue("РОЗМІР", null))) && t.next !== null && (t.next.getReferent() instanceof MoneyReferent)) {
                if (sum !== null) 
                    break;
                sum = Utils.as(t.next.getReferent(), MoneyReferent);
                t1 = (t = t.next);
                continue;
            }
            let r = t.getReferent();
            if ((r instanceof DateRangeReferent) || (r instanceof DateReferent)) {
                if (dt === null) {
                    dt = r;
                    t1 = t;
                }
            }
            else if ((r instanceof OrganizationReferent) && org === null) {
                org = Utils.as(r, OrganizationReferent);
                t1 = t;
            }
        }
        if (sum === null) 
            return null;
        if (org === null) {
            for (let tt = t0.previous; tt !== null; tt = tt.previous) {
                if (tt.isChar('.')) 
                    break;
                let b0 = Utils.as(tt.getReferent(), BusinessFactReferent);
                if (b0 !== null) {
                    org = Utils.as(b0.who, OrganizationReferent);
                    break;
                }
                if ((((org = Utils.as(tt.getReferent(), OrganizationReferent)))) !== null) 
                    break;
            }
        }
        if (org === null) 
            return null;
        let bfr = BusinessFactReferent._new649(bfi.baseKind);
        bfr.who = org;
        bfr.typ = typ;
        bfr.addSlot(BusinessFactReferent.ATTR_MISC, sum, false, 0);
        if (dt !== null) 
            bfr.when = dt;
        else 
            this._findDate(bfr, bfi.beginToken);
        return new ReferentToken(bfr, t0, t1);
    }
    
    _analizeAgreement(bfi) {
        let first = null;
        let second = null;
        let t0 = bfi.beginToken;
        let t1 = bfi.endToken;
        let maxLines = 1;
        for (let t = bfi.beginToken.previous; t !== null; t = t.previous) {
            if (t.isChar('.') || t.isNewlineAfter) {
                if ((--maxLines) === 0) 
                    break;
                continue;
            }
            if (t.isValue("СТОРОНА", null) && t.previous !== null && ((t.previous.isValue("МЕЖДУ", null) || t.previous.isValue("МІЖ", null)))) {
                maxLines = 2;
                t0 = (t = t.previous);
                continue;
            }
            let r = t.getReferent();
            if (r instanceof BusinessFactReferent) {
                let b = Utils.as(r, BusinessFactReferent);
                if (b.who !== null && ((b.who2 !== null || b.whom !== null))) {
                    first = b.who;
                    second = Utils.notNull(b.who2, b.whom);
                    break;
                }
            }
            if (!(r instanceof OrganizationReferent)) 
                continue;
            if ((t.previous !== null && ((t.previous.isAnd || t.previous.isValue("К", null))) && t.previous.previous !== null) && (t.previous.previous.getReferent() instanceof OrganizationReferent)) {
                t0 = t.previous.previous;
                first = t0.getReferent();
                second = r;
                break;
            }
            else {
                t0 = t;
                first = r;
                break;
            }
        }
        if (second === null) {
            for (let t = bfi.endToken.next; t !== null; t = t.next) {
                if (t.isChar('.')) 
                    break;
                if (t.isNewlineBefore) 
                    break;
                let r = t.getReferent();
                if (!(r instanceof OrganizationReferent)) 
                    continue;
                if ((t.next !== null && ((t.next.isAnd || t.next.isValue("К", null))) && t.next.next !== null) && (t.next.next.getReferent() instanceof OrganizationReferent)) {
                    t1 = t.next.next;
                    first = r;
                    second = t1.getReferent();
                    break;
                }
                else {
                    t1 = t;
                    second = r;
                    break;
                }
            }
        }
        if (first === null || second === null) 
            return null;
        let bf = BusinessFactReferent._new649(bfi.baseKind);
        bf.who = first;
        if (bfi.baseKind === BusinessFactKind.LAWSUIT) 
            bf.whom = second;
        else 
            bf.who2 = second;
        this._findDate(bf, bfi.beginToken);
        this._findSum(bf, bfi.beginToken);
        return new ReferentToken(bf, t0, t1);
    }
    
    _analizeSubsidiary(bfi) {
        let t1 = bfi.endToken.next;
        if (t1 === null || !(t1.getReferent() instanceof OrganizationReferent)) 
            return null;
        let t = null;
        let org0 = null;
        for (t = bfi.beginToken.previous; t !== null; t = t.previous) {
            if (t.isChar('(') || t.isChar('%')) 
                continue;
            if (t.morph._class.isVerb) 
                continue;
            if (t instanceof NumberToken) 
                continue;
            org0 = Utils.as(t.getReferent(), OrganizationReferent);
            if (org0 !== null) 
                break;
        }
        if (org0 === null) 
            return null;
        let bfr = BusinessFactReferent._new649(bfi.baseKind);
        bfr.who = org0;
        bfr.whom = t1.getReferent();
        return new ReferentToken(bfr, t, t1);
    }
    
    _analizeFinance(bfi) {
        let bef = this._FindRefBefore(bfi.beginToken.previous);
        if (bef === null) 
            return null;
        if (!(bef.referent instanceof OrganizationReferent) && !(bef.referent instanceof PersonReferent)) 
            return null;
        let whom = null;
        let sum = null;
        let funds = null;
        for (let t = bfi.endToken.next; t !== null; t = t.next) {
            if (t.isNewlineBefore || t.isChar('.')) 
                break;
            let r = t.getReferent();
            if (r instanceof OrganizationReferent) {
                if (whom === null) 
                    whom = Utils.as(t, ReferentToken);
            }
            else if (r instanceof MoneyReferent) {
                if (sum === null) 
                    sum = Utils.as(r, MoneyReferent);
            }
            else if (r instanceof FundsReferent) {
                if (funds === null) 
                    funds = Utils.as(r, FundsReferent);
            }
        }
        if (whom === null) 
            return null;
        let bfr = new BusinessFactReferent();
        if (funds === null) 
            bfr.kind = BusinessFactKind.FINANCE;
        else {
            bfr.kind = BusinessFactKind.GET;
            bfr.typ = "покупка ценных бумаг";
        }
        bfr.who = bef.referent;
        bfr.whom = whom.referent;
        if (funds !== null) 
            bfr.addWhat(funds);
        if (sum !== null) 
            bfr.addSlot(BusinessFactReferent.ATTR_MISC, sum, false, 0);
        this._findDate(bfr, bef.beginToken);
        return new ReferentToken(bfr, bef.beginToken, whom.endToken);
    }
    
    _analizeLikelihoods(rt) {
        let bfr0 = Utils.as(rt.referent, BusinessFactReferent);
        if (bfr0 === null || bfr0.whats.length !== 1 || !(bfr0.whats[0] instanceof FundsReferent)) 
            return null;
        let funds0 = Utils.as(bfr0.whats[0], FundsReferent);
        let t = null;
        let whos = new Array();
        let funds = new Array();
        for (t = rt.endToken.next; t !== null; t = t.next) {
            if (t.isNewlineBefore || t.isChar('.')) 
                break;
            if (t.morph._class.isAdverb) 
                continue;
            if (t.isHiphen || t.isCommaAnd) 
                continue;
            if (t.morph._class.isConjunction || t.morph._class.isPreposition || t.morph._class.isMisc) 
                continue;
            let r = t.getReferent();
            if ((r instanceof OrganizationReferent) || (r instanceof PersonReferent)) {
                whos.push(Utils.as(t, ReferentToken));
                continue;
            }
            if (r instanceof FundsReferent) {
                funds0 = Utils.as(r, FundsReferent);
                funds.push(funds0);
                continue;
            }
            let it = FundsItemToken.tryParse(t, null);
            if (it === null) 
                break;
            let fu = Utils.as(funds0.clone(), FundsReferent);
            fu.occurrence.splice(0, fu.occurrence.length);
            fu.addOccurenceOfRefTok(new ReferentToken(fu, it.beginToken, it.endToken));
            if (it.typ === FundsItemTyp.PERCENT && it.numVal !== null) 
                fu.percent = it.numVal.realValue;
            else if (it.typ === FundsItemTyp.COUNT && it.numVal !== null && it.numVal.intValue !== null) 
                fu.count = it.numVal.intValue;
            else if (it.typ === FundsItemTyp.SUM) 
                fu.sum = Utils.as(it.ref, MoneyReferent);
            else 
                break;
            funds.push(fu);
            t = it.endToken;
        }
        if (whos.length === 0 || whos.length !== funds.length) 
            return null;
        let res = new Array();
        for (let i = 0; i < whos.length; i++) {
            let bfr = BusinessFactReferent._new660(bfr0.kind, bfr0.typ);
            bfr.who = whos[i].referent;
            bfr.addWhat(funds[i]);
            for (const s of bfr0.slots) {
                if (s.typeName === BusinessFactReferent.ATTR_MISC || s.typeName === BusinessFactReferent.ATTR_WHEN) 
                    bfr.addSlot(s.typeName, s.value, false, 0);
            }
            res.push(new ReferentToken(bfr, whos[i].beginToken, whos[i].endToken));
        }
        return res;
    }
    
    static initialize() {
        if (BusinessAnalyzer.m_Inited) 
            return;
        BusinessAnalyzer.m_Inited = true;
        MetaBusinessFact.initialize();
        FundsMeta.initialize();
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        BusinessFactItem.initialize();
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new BusinessAnalyzer());
    }
    
    static static_constructor() {
        BusinessAnalyzer.ANALYZER_NAME = "BUSINESS";
        BusinessAnalyzer.m_Inited = false;
    }
}


BusinessAnalyzer.static_constructor();

module.exports = BusinessAnalyzer