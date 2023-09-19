/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphGender = require("./../../../morph/MorphGender");
const MetaToken = require("./../../MetaToken");
const MorphNumber = require("./../../../morph/MorphNumber");
const Referent = require("./../../Referent");
const OrganizationKind = require("./../../org/OrganizationKind");
const NumberExType = require("./../../core/NumberExType");
const FundsReferent = require("./../FundsReferent");
const NumberToken = require("./../../NumberToken");
const FundsKind = require("./../FundsKind");
const ReferentToken = require("./../../ReferentToken");
const FundsItemTyp = require("./FundsItemTyp");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const OrganizationReferent = require("./../../org/OrganizationReferent");
const NumberHelper = require("./../../core/NumberHelper");
const OrganizationAnalyzer = require("./../../org/OrganizationAnalyzer");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const MoneyReferent = require("./../../money/MoneyReferent");

class FundsItemToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.typ = FundsItemTyp.UNDEFINED;
        this.kind = FundsKind.UNDEFINED;
        this.ref = null;
        this.numVal = null;
        this.stringVal = null;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.typ);
        if (this.kind !== FundsKind.UNDEFINED) 
            res.append(" K=").append(String(this.kind));
        if (this.numVal !== null) 
            res.append(" N=").append(this.numVal.value);
        if (this.ref !== null) 
            res.append(" R=").append(this.ref.toString());
        if (this.stringVal !== null) 
            res.append(" S=").append(this.stringVal);
        return res.toString();
    }
    
    static tryParse(t, prev = null) {
        if (t === null) 
            return null;
        let typ0 = FundsItemTyp.UNDEFINED;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.morph._class.isPreposition || tt.morph._class.isAdverb) 
                continue;
            if ((tt.isValue("СУММА", null) || tt.isValue("ОКОЛО", null) || tt.isValue("БОЛЕЕ", null)) || tt.isValue("МЕНЕЕ", null) || tt.isValue("СВЫШЕ", null)) 
                continue;
            if ((tt.isValue("НОМИНАЛ", null) || tt.isValue("ЦЕНА", null) || tt.isValue("СТОИМОСТЬ", null)) || tt.isValue("СТОИТЬ", null)) {
                typ0 = FundsItemTyp.PRICE;
                continue;
            }
            if (tt.isValue("НОМИНАЛЬНАЯ", null) || tt.isValue("ОБЩАЯ", null)) 
                continue;
            if (tt.isValue("СОСТАВЛЯТЬ", null)) 
                continue;
            let re = tt.getReferent();
            if (re instanceof OrganizationReferent) 
                return FundsItemToken._new641(t, tt, FundsItemTyp.ORG, re);
            if (re instanceof MoneyReferent) {
                if (typ0 === FundsItemTyp.UNDEFINED) 
                    typ0 = FundsItemTyp.SUM;
                if ((tt.next !== null && tt.next.isValue("ЗА", null) && tt.next.next !== null) && ((tt.next.next.isValue("АКЦИЯ", null) || tt.next.next.isValue("АКЦІЯ", null)))) 
                    typ0 = FundsItemTyp.PRICE;
                let res = FundsItemToken._new641(t, tt, typ0, re);
                return res;
            }
            if (re !== null) 
                break;
            let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.noun.isValue("ПАКЕТ", null)) 
                npt = NounPhraseHelper.tryParse(npt.endToken.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                let res = null;
                if (npt.noun.isValue("АКЦІЯ", null) || npt.noun.isValue("АКЦИЯ", null)) {
                    res = FundsItemToken._new643(t, npt.endToken, FundsItemTyp.NOUN, FundsKind.STOCK);
                    if (npt.adjectives.length > 0) {
                        for (const v of FundsItemToken.m_ActTypes) {
                            if (npt.adjectives[0].isValue(v, null)) {
                                res.stringVal = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false).toLowerCase();
                                if (res.stringVal === "голосовавшая акция") 
                                    res.stringVal = "голосующая акция";
                                break;
                            }
                        }
                    }
                }
                else if (((npt.noun.isValue("БУМАГА", null) || npt.noun.isValue("ПАПІР", null))) && npt.endToken.previous !== null && ((npt.endToken.previous.isValue("ЦЕННЫЙ", null) || npt.endToken.previous.isValue("ЦІННИЙ", null)))) 
                    res = FundsItemToken._new644(t, npt.endToken, FundsItemTyp.NOUN, FundsKind.STOCK, "ценные бумаги");
                else if (((npt.noun.isValue("КАПИТАЛ", null) || npt.noun.isValue("КАПІТАЛ", null))) && npt.adjectives.length > 0 && ((npt.adjectives[0].isValue("УСТАВНОЙ", null) || npt.adjectives[0].isValue("УСТАВНЫЙ", null) || npt.adjectives[0].isValue("СТАТУТНИЙ", null)))) 
                    res = FundsItemToken._new643(t, npt.endToken, FundsItemTyp.NOUN, FundsKind.CAPITAL);
                if (res !== null) {
                    let rt = res.kit.processReferent(OrganizationAnalyzer.ANALYZER_NAME, res.endToken.next, null);
                    if (rt !== null) {
                        res.ref = rt.referent;
                        res.endToken = rt.endToken;
                    }
                    return res;
                }
            }
            if (prev !== null && prev.typ === FundsItemTyp.COUNT) {
                let val = null;
                for (const v of FundsItemToken.m_ActTypes) {
                    if (tt.isValue(v, null)) {
                        val = v;
                        break;
                    }
                }
                if (val !== null) {
                    let cou = 0;
                    let ok = false;
                    for (let ttt = tt.previous; ttt !== null; ttt = ttt.previous) {
                        if ((++cou) > 100) 
                            break;
                        let refs = ttt.getReferents();
                        if (refs === null) 
                            continue;
                        for (const r of refs) {
                            if (r instanceof FundsReferent) {
                                ok = true;
                                break;
                            }
                        }
                        if (ok) 
                            break;
                    }
                    cou = 0;
                    if (!ok) {
                        for (let ttt = tt.next; ttt !== null; ttt = ttt.next) {
                            if ((++cou) > 100) 
                                break;
                            let fi = FundsItemToken.tryParse(ttt, null);
                            if (fi !== null && fi.kind === FundsKind.STOCK) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (ok) {
                        let res = FundsItemToken._new646(t, tt, FundsKind.STOCK, FundsItemTyp.NOUN);
                        res.stringVal = (val.substring(0, 0 + val.length - 2).toLowerCase() + "ая акция");
                        return res;
                    }
                }
            }
            if (tt instanceof NumberToken) {
                let num = NumberHelper.tryParseNumberWithPostfix(tt);
                if (num !== null) {
                    if (tt.previous !== null && tt.previous.isValue("НА", null)) 
                        break;
                    if (num.exTyp === NumberExType.PERCENT) {
                        let res = FundsItemToken._new647(t, num.endToken, FundsItemTyp.PERCENT, num);
                        t = num.endToken.next;
                        if (t !== null && ((t.isChar('+') || t.isValue("ПЛЮС", null))) && (t.next instanceof NumberToken)) {
                            res.endToken = t.next;
                            t = res.endToken.next;
                        }
                        if ((t !== null && t.isHiphen && t.next !== null) && t.next.chars.isAllLower && !t.isWhitespaceAfter) 
                            t = t.next.next;
                        if (t !== null && ((t.isValue("ДОЛЯ", null) || t.isValue("ЧАСТКА", null)))) 
                            res.endToken = t;
                        return res;
                    }
                    break;
                }
                let t1 = tt;
                if (t1.next !== null && t1.next.isValue("ШТУКА", null)) 
                    t1 = t1.next;
                return FundsItemToken._new647(t, t1, FundsItemTyp.COUNT, Utils.as(tt, NumberToken));
            }
            break;
        }
        return null;
    }
    
    static tryAttach(t) {
        if (t === null) 
            return null;
        let f = FundsItemToken.tryParse(t, null);
        if (f === null) 
            return null;
        if (f.typ === FundsItemTyp.ORG) 
            return null;
        if (f.typ === FundsItemTyp.PRICE || f.typ === FundsItemTyp.PERCENT || f.typ === FundsItemTyp.COUNT) {
            if (t.previous !== null && t.previous.isCharOf(",.") && (t.previous.previous instanceof NumberToken)) 
                return null;
        }
        let li = new Array();
        li.push(f);
        let isInBr = false;
        for (let tt = f.endToken.next; tt !== null; tt = tt.next) {
            if ((tt.isWhitespaceBefore && tt.previous !== null && tt.previous.isChar('.')) && tt.chars.isCapitalUpper) 
                break;
            let f0 = FundsItemToken.tryParse(tt, f);
            if (f0 !== null) {
                if (f0.kind === FundsKind.CAPITAL && isInBr) {
                    for (const l of li) {
                        if (l.typ === FundsItemTyp.NOUN) {
                            f0.kind = l.kind;
                            break;
                        }
                    }
                }
                li.push((f = f0));
                tt = f.endToken;
                continue;
            }
            if (tt.isChar('(')) {
                isInBr = true;
                continue;
            }
            if (tt.isChar(')')) {
                if (isInBr || ((t.previous !== null && t.previous.isChar('(')))) {
                    isInBr = false;
                    li[li.length - 1].endToken = tt;
                    continue;
                }
            }
            if (tt.morph._class.isVerb || tt.morph._class.isAdverb) 
                continue;
            break;
        }
        let funds = new FundsReferent();
        let res = new ReferentToken(funds, t, t);
        let orgProb = null;
        for (let i = 0; i < li.length; i++) {
            if (li[i].typ === FundsItemTyp.NOUN) {
                funds.kind = li[i].kind;
                if (li[i].stringVal !== null) 
                    funds.typ = li[i].stringVal;
                if (li[i].ref instanceof OrganizationReferent) 
                    orgProb = Utils.as(li[i].ref, OrganizationReferent);
                res.endToken = li[i].endToken;
            }
            else if (li[i].typ === FundsItemTyp.COUNT) {
                if (funds.count > 0 || li[i].numVal === null || li[i].numVal.intValue === null) 
                    break;
                funds.count = li[i].numVal.intValue;
                res.endToken = li[i].endToken;
            }
            else if (li[i].typ === FundsItemTyp.ORG) {
                if (funds.source !== null && funds.source !== li[i].ref) 
                    break;
                funds.source = Utils.as(li[i].ref, OrganizationReferent);
                res.endToken = li[i].endToken;
            }
            else if (li[i].typ === FundsItemTyp.PERCENT) {
                if (funds.percent > 0 || li[i].numVal === null || li[i].numVal.realValue === 0) 
                    break;
                funds.percent = li[i].numVal.realValue;
                res.endToken = li[i].endToken;
            }
            else if (li[i].typ === FundsItemTyp.SUM) {
                if (funds.sum !== null) 
                    break;
                funds.sum = Utils.as(li[i].ref, MoneyReferent);
                res.endToken = li[i].endToken;
            }
            else if (li[i].typ === FundsItemTyp.PRICE) {
                if (funds.price !== null) 
                    break;
                funds.price = Utils.as(li[i].ref, MoneyReferent);
                res.endToken = li[i].endToken;
            }
            else 
                break;
        }
        if (funds.percent > 0 && funds.source !== null && funds.kind === FundsKind.UNDEFINED) 
            funds.kind = FundsKind.STOCK;
        if (!funds.checkCorrect()) 
            return null;
        if (funds.source === null) {
            let cou = 0;
            for (let tt = res.beginToken.previous; tt !== null; tt = tt.previous) {
                if ((++cou) > 500) 
                    break;
                if (tt.isNewlineAfter) 
                    cou += 10;
                let fr = Utils.as(tt.getReferent(), FundsReferent);
                if (fr !== null && fr.source !== null) {
                    funds.source = fr.source;
                    break;
                }
            }
        }
        if (funds.source === null && orgProb !== null) 
            funds.source = orgProb;
        if (funds.source === null) {
            let cou = 0;
            for (let tt = res.beginToken.previous; tt !== null; tt = tt.previous) {
                if ((++cou) > 300) 
                    break;
                if (tt.isNewlineAfter) 
                    cou += 10;
                let refs = tt.getReferents();
                if (refs !== null) {
                    for (const r of refs) {
                        if (r instanceof OrganizationReferent) {
                            let ki = r.kind;
                            if (ki === OrganizationKind.JUSTICE || ki === OrganizationKind.GOVENMENT) 
                                continue;
                            funds.source = Utils.as(r, OrganizationReferent);
                            cou = 10000;
                            break;
                        }
                    }
                }
            }
        }
        return res;
    }
    
    static _new641(_arg1, _arg2, _arg3, _arg4) {
        let res = new FundsItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ref = _arg4;
        return res;
    }
    
    static _new643(_arg1, _arg2, _arg3, _arg4) {
        let res = new FundsItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.kind = _arg4;
        return res;
    }
    
    static _new644(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new FundsItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.kind = _arg4;
        res.stringVal = _arg5;
        return res;
    }
    
    static _new646(_arg1, _arg2, _arg3, _arg4) {
        let res = new FundsItemToken(_arg1, _arg2);
        res.kind = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new647(_arg1, _arg2, _arg3, _arg4) {
        let res = new FundsItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.numVal = _arg4;
        return res;
    }
    
    static static_constructor() {
        FundsItemToken.m_ActTypes = Array.from(["ОБЫКНОВЕННЫЙ", "ПРИВИЛЕГИРОВАННЫЙ", "ГОЛОСУЮЩИЙ", "ЗВИЧАЙНИЙ", "ПРИВІЛЕЙОВАНОГО", "ГОЛОСУЄ"]);
    }
}


FundsItemToken.static_constructor();

module.exports = FundsItemToken