/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MetaToken = require("./../MetaToken");
const TextToken = require("./../TextToken");
const TerminParseAttr = require("./../core/TerminParseAttr");
const Token = require("./../Token");
const UriAnalyzer = require("./../uri/UriAnalyzer");
const LanguageHelper = require("./../../morph/LanguageHelper");
const Termin = require("./../core/Termin");
const ProcessorService = require("./../ProcessorService");
const NumberToken = require("./../NumberToken");
const PhoneHelper = require("./internal/PhoneHelper");
const PhoneItemTokenPhoneItemType = require("./internal/PhoneItemTokenPhoneItemType");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const Referent = require("./../Referent");
const MetaPhone = require("./internal/MetaPhone");
const PhoneReferent = require("./PhoneReferent");
const PhoneKind = require("./PhoneKind");
const ReferentToken = require("./../ReferentToken");
const PhoneItemToken = require("./internal/PhoneItemToken");
const AnalyzerData = require("./../core/AnalyzerData");
const Analyzer = require("./../Analyzer");

/**
 * Анализатор для выделения телефонных номеров
 */
class PhoneAnalyzer extends Analyzer {
    
    get name() {
        return PhoneAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Телефоны";
    }
    
    get description() {
        return "Телефонные номера";
    }
    
    clone() {
        return new PhoneAnalyzer();
    }
    
    get typeSystem() {
        return [MetaPhone.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaPhone.PHONE_IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("phone.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === PhoneReferent.OBJ_TYPENAME) 
            return new PhoneReferent();
        return null;
    }
    
    get progressWeight() {
        return 2;
    }
    
    createAnalyzerData() {
        return new PhoneAnalyzer.PhoneAnalizerData();
    }
    
    process(kit) {
        let ad = Utils.as(kit.getAnalyzerData(this), PhoneAnalyzer.PhoneAnalizerData);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let pli = PhoneItemToken.tryAttachAll(t, 15);
            if (pli === null || pli.length === 0) 
                continue;
            let prevPhone = null;
            let kkk = 0;
            for (let tt = t.previous; tt !== null; tt = tt.previous) {
                if (tt.getReferent() instanceof PhoneReferent) {
                    prevPhone = Utils.as(tt.getReferent(), PhoneReferent);
                    break;
                }
                else if (tt instanceof ReferentToken) {
                }
                else if (tt.isChar(')')) {
                    let ttt = tt.previous;
                    let cou = 0;
                    for (; ttt !== null; ttt = ttt.previous) {
                        if (ttt.isChar('(')) 
                            break;
                        else if ((++cou) > 100) 
                            break;
                    }
                    if (ttt === null || !ttt.isChar('(')) 
                        break;
                    tt = ttt;
                }
                else if (!tt.isCharOf(",;/\\") && !tt.isAnd) {
                    if ((++kkk) > 5) 
                        break;
                    if (tt.isNewlineBefore || tt.isNewlineAfter) 
                        break;
                }
            }
            let j = 0;
            let isPhoneBefore = false;
            let isPref = false;
            let ki = PhoneKind.UNDEFINED;
            let ki2 = PhoneKind.UNDEFINED;
            while (j < pli.length) {
                if (pli[j].itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                    if (ki === PhoneKind.UNDEFINED) 
                        ki = pli[j].kind;
                    isPref = true;
                    if (ki2 === PhoneKind.UNDEFINED) 
                        ki2 = pli[j].kind2;
                    isPhoneBefore = true;
                    j++;
                    if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                        j++;
                }
                else if (((j + 1) < pli.length) && pli[j + 1].itemType === PhoneItemTokenPhoneItemType.PREFIX && j === 0) {
                    if (ki === PhoneKind.UNDEFINED) 
                        ki = pli[0].kind;
                    isPref = true;
                    if (ki2 === PhoneKind.UNDEFINED) 
                        ki2 = pli[j].kind2;
                    pli.splice(0, 1);
                }
                else 
                    break;
            }
            if (prevPhone !== null) 
                isPhoneBefore = true;
            if (pli.length === 1 && pli[0].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
                let tt = t.previous;
                if ((tt instanceof TextToken) && !tt.chars.isLetter) 
                    tt = tt.previous;
                if (tt instanceof TextToken) {
                    if (UriAnalyzer.m_Schemes.tryParse(tt, TerminParseAttr.NO) !== null) 
                        continue;
                    if (pli[0].lengthChar === 6) 
                        continue;
                }
            }
            let rts = this.tryAttach(pli, j, isPhoneBefore, prevPhone);
            if (rts === null) {
                for (j = 1; j < pli.length; j++) {
                    if (pli[j].itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                        pli.splice(0, j);
                        rts = this.tryAttach(pli, 1, true, prevPhone);
                        break;
                    }
                }
            }
            if (rts === null) 
                t = pli[pli.length - 1].endToken;
            else {
                if (ki === PhoneKind.UNDEFINED && prevPhone !== null) {
                    if (prevPhone.tag instanceof PhoneKind) 
                        ki = PhoneKind.of(prevPhone.tag);
                    else if (!isPref && prevPhone.kind !== PhoneKind.MOBILE && kkk === 0) 
                        ki = prevPhone.kind;
                }
                for (const rt of rts) {
                    let ph = Utils.as(rt.referent, PhoneReferent);
                    if (ki2 !== PhoneKind.UNDEFINED) {
                        if (rt === rts[0]) 
                            ph.tag = ki2;
                        else 
                            ph.kind = ki2;
                    }
                    else if (ki !== PhoneKind.UNDEFINED) 
                        ph.kind = ki;
                    else {
                        if (rt === rts[0] && (rt.whitespacesBeforeCount < 3)) {
                            let tt1 = rt.beginToken.previous;
                            if (tt1 !== null && tt1.isTableControlChar) 
                                tt1 = tt1.previous;
                            if ((tt1 instanceof TextToken) && ((tt1.isNewlineBefore || ((tt1.previous !== null && tt1.previous.isTableControlChar))))) {
                                let term = tt1.term;
                                if (term === "T" || term === "Т") 
                                    rt.beginToken = tt1;
                                else if (term === "Ф" || term === "F") {
                                    ph.kind = (ki = PhoneKind.FAX);
                                    rt.beginToken = tt1;
                                }
                                else if (term === "M" || term === "М") {
                                    ph.kind = (ki = PhoneKind.MOBILE);
                                    rt.beginToken = tt1;
                                }
                            }
                        }
                        ph.correct();
                    }
                    rt.referent = ad.registerReferent(rt.referent);
                    kit.embedToken(rt);
                    t = rt;
                }
            }
        }
    }
    
    tryAttach(pli, ind, isPhoneBefore, prevPhone) {
        let rt = this._TryAttach_(pli, ind, isPhoneBefore, prevPhone, 0);
        if (rt === null) 
            return null;
        let res = new Array();
        res.push(rt);
        for (let i = 0; i < 5; i++) {
            let ph0 = Utils.as(rt.referent, PhoneReferent);
            if (ph0.addNumber !== null) 
                return res;
            let alt = PhoneItemToken.tryAttachAlternate(rt.endToken.next, ph0, pli);
            if (alt === null) 
                break;
            let ph = new PhoneReferent();
            for (const s of rt.referent.slots) {
                ph.addSlot(s.typeName, s.value, false, 0);
            }
            let num = ph.number;
            if (num === null || num.length <= alt.value.length) 
                break;
            ph.number = num.substring(0, 0 + num.length - alt.value.length) + alt.value;
            ph.m_Template = ph0.m_Template;
            let rt2 = new ReferentToken(ph, alt.beginToken, alt.endToken);
            res.push(rt2);
            rt = rt2;
        }
        let add = PhoneItemToken.tryAttachAdditional(rt.endToken.next);
        if (add !== null) {
            for (const rr of res) {
                rr.referent.addNumber = add.value;
            }
            res[res.length - 1].endToken = add.endToken;
        }
        return res;
    }
    
    processReferent(begin, param) {
        let pli = PhoneItemToken.tryAttachAll(begin, 15);
        if (pli === null || pli.length === 0) 
            return null;
        let i = 0;
        for (; i < pli.length; i++) {
            if (pli[i].itemType !== PhoneItemTokenPhoneItemType.PREFIX) 
                break;
        }
        let rt = this._TryAttach_(pli, i, true, null, 0);
        if (rt !== null) {
            rt.beginToken = begin;
            return rt;
        }
        return null;
    }
    
    _TryAttach_(pli, ind, isPhoneBefore, prevPhone, lev = 0) {
        if (ind >= pli.length || lev > 4) 
            return null;
        let countryCode = null;
        let cityCode = null;
        let j = ind;
        if (prevPhone !== null && prevPhone.m_Template !== null && pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
            let tmp = new StringBuilder();
            for (let jj = j; jj < pli.length; jj++) {
                if (pli[jj].itemType === PhoneItemTokenPhoneItemType.NUMBER) 
                    tmp.append(pli[jj].value.length);
                else if (pli[jj].itemType === PhoneItemTokenPhoneItemType.DELIM) {
                    if (pli[jj].value === " ") 
                        break;
                    tmp.append(pli[jj].value);
                    continue;
                }
                else 
                    break;
                let templ0 = tmp.toString();
                if (templ0 === prevPhone.m_Template) {
                    if ((jj + 1) < pli.length) {
                        if (pli[jj + 1].itemType === PhoneItemTokenPhoneItemType.PREFIX && (jj + 2) === pli.length) {
                        }
                        else 
                            pli.splice(jj + 1, pli.length - jj - 1);
                    }
                    break;
                }
            }
        }
        if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.COUNTRYCODE) {
            countryCode = pli[j].value;
            if (countryCode !== "8") {
                let cc = PhoneHelper.getCountryPrefix(countryCode);
                if (cc !== null && (cc.length < countryCode.length)) {
                    cityCode = countryCode.substring(cc.length);
                    countryCode = cc;
                }
            }
            j++;
        }
        else if ((j < pli.length) && pli[j].canBeCountryPrefix) {
            let k = j + 1;
            if ((k < pli.length) && pli[k].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                k++;
            let rrt = this._TryAttach_(pli, k, isPhoneBefore, null, lev + 1);
            if (rrt !== null) {
                if ((((isPhoneBefore && pli[j + 1].itemType === PhoneItemTokenPhoneItemType.DELIM && pli[j + 1].beginToken.isHiphen) && pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER && pli[j].value.length === 3) && ((j + 2) < pli.length) && pli[j + 2].itemType === PhoneItemTokenPhoneItemType.NUMBER) && pli[j + 2].value.length === 3) {
                }
                else {
                    countryCode = pli[j].value;
                    j++;
                }
            }
        }
        if (((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER && ((pli[j].value[0] === '8' || pli[j].value[0] === '7'))) && countryCode === null) {
            if (pli[j].value.length === 1) {
                countryCode = pli[j].value;
                j++;
            }
            else if (pli[j].value.length === 4) {
                countryCode = pli[j].value.substring(0, 0 + 1);
                if (cityCode === null) 
                    cityCode = pli[j].value.substring(1);
                else 
                    cityCode += pli[j].value.substring(1);
                j++;
            }
            else if (pli[j].value.length === 11 && j === (pli.length - 1) && isPhoneBefore) {
                let ph0 = new PhoneReferent();
                if (pli[j].value[0] !== '8') 
                    ph0.countryCode = pli[j].value.substring(0, 0 + 1);
                ph0.number = pli[j].value.substring(1, 1 + 3) + pli[j].value.substring(4);
                return new ReferentToken(ph0, pli[0].beginToken, pli[j].endToken);
            }
            else if (cityCode === null && pli[j].value.length > 3 && ((j + 1) < pli.length)) {
                let sum = 0;
                for (const it of pli) {
                    if (it.itemType === PhoneItemTokenPhoneItemType.NUMBER) 
                        sum += it.value.length;
                }
                if (sum === 11) {
                    cityCode = pli[j].value.substring(1);
                    j++;
                }
            }
        }
        if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.CITYCODE) {
            if (cityCode === null) 
                cityCode = pli[j].value;
            else 
                cityCode += pli[j].value;
            j++;
        }
        if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.DELIM) 
            j++;
        if ((countryCode === "8" && cityCode === null && ((j + 3) < pli.length)) && pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
            if (pli[j].value.length === 3 || pli[j].value.length === 4) {
                cityCode = pli[j].value;
                j++;
                if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                    j++;
            }
        }
        let normalNumLen = 0;
        if (countryCode === "421") 
            normalNumLen = 9;
        let num = new StringBuilder();
        let templ = new StringBuilder();
        let partLength = new Array();
        let delim = null;
        let ok = false;
        let additional = null;
        let std = false;
        if (countryCode !== null && ((j + 4) < pli.length) && j > 0) {
            if (((((pli[j - 1].value === "-" || pli[j - 1].itemType === PhoneItemTokenPhoneItemType.COUNTRYCODE)) && pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER && pli[j + 1].itemType === PhoneItemTokenPhoneItemType.DELIM) && pli[j + 2].itemType === PhoneItemTokenPhoneItemType.NUMBER && pli[j + 3].itemType === PhoneItemTokenPhoneItemType.DELIM) && pli[j + 4].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
                if ((((pli[j].value.length + pli[j + 2].value.length) === 6 || ((pli[j].value.length === 4 && pli[j + 2].value.length === 5)))) && ((pli[j + 4].value.length === 4 || pli[j + 4].value.length === 1))) {
                    num.append(pli[j].value);
                    num.append(pli[j + 2].value);
                    num.append(pli[j + 4].value);
                    templ.append(pli[j].value.length).append(pli[j + 1].value).append(pli[j + 2].value.length).append(pli[j + 3].value).append(pli[j + 4].value.length);
                    std = true;
                    ok = true;
                    j += 5;
                }
            }
        }
        for (; j < pli.length; j++) {
            if (std) 
                break;
            if (pli[j].itemType === PhoneItemTokenPhoneItemType.DELIM) {
                if (pli[j].isInBrackets) 
                    continue;
                if (j > 0 && pli[j - 1].isInBrackets) 
                    continue;
                if (templ.length > 0) 
                    templ.append(pli[j].value);
                if (delim === null) 
                    delim = pli[j].value;
                else if (pli[j].value !== delim) {
                    if ((partLength.length === 2 && ((partLength[0] === 3 || partLength[0] === 4)) && cityCode === null) && partLength[1] === 3) {
                        cityCode = num.toString().substring(0, 0 + partLength[0]);
                        num.remove(0, partLength[0]);
                        partLength.splice(0, 1);
                        delim = pli[j].value;
                        continue;
                    }
                    if (isPhoneBefore && ((j + 1) < pli.length) && pli[j + 1].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
                        if (num.length < 6) 
                            continue;
                        if (normalNumLen > 0 && (num.length + pli[j + 1].value.length) === normalNumLen) 
                            continue;
                    }
                    break;
                }
                else 
                    continue;
                ok = false;
            }
            else if (pli[j].itemType === PhoneItemTokenPhoneItemType.NUMBER) {
                if (num.length === 0 && pli[j].beginToken.previous !== null && pli[j].beginToken.previous.isTableControlChar) {
                    let tt = pli[pli.length - 1].endToken.next;
                    if (tt !== null && tt.isCharOf(",.")) 
                        tt = tt.next;
                    if (tt instanceof NumberToken) 
                        return null;
                }
                if ((num.length + pli[j].value.length) > 13) {
                    if (j > 0 && pli[j - 1].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                        j--;
                    ok = true;
                    break;
                }
                num.append(pli[j].value);
                partLength.push(pli[j].value.length);
                templ.append(pli[j].value.length);
                ok = true;
                if (num.length > 10) {
                    j++;
                    if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.ADDNUMBER) {
                        additional = pli[j].value;
                        j++;
                    }
                    break;
                }
            }
            else if (pli[j].itemType === PhoneItemTokenPhoneItemType.ADDNUMBER) {
                additional = pli[j].value;
                j++;
                break;
            }
            else 
                break;
        }
        if ((j === (pli.length - 1) && pli[j].isInBrackets && ((pli[j].value.length === 3 || pli[j].value.length === 4))) && additional === null) {
            additional = pli[j].value;
            j++;
        }
        if ((j < pli.length) && pli[j].itemType === PhoneItemTokenPhoneItemType.PREFIX && pli[j].isInBrackets) {
            isPhoneBefore = true;
            j++;
        }
        if ((countryCode === null && cityCode !== null && cityCode.length > 3) && (num.length < 8) && cityCode[0] !== '8') {
            if ((cityCode.length + num.length) === 10) {
            }
            else {
                let cc = PhoneHelper.getCountryPrefix(cityCode);
                if (cc !== null) {
                    if (cc.length > 1 && (cityCode.length - cc.length) > 1) {
                        countryCode = cc;
                        cityCode = cityCode.substring(cc.length);
                    }
                }
            }
        }
        if (countryCode === null && cityCode !== null && cityCode.startsWith("00")) {
            let cc = PhoneHelper.getCountryPrefix(cityCode.substring(2));
            if (cc !== null) {
                if (cityCode.length > (cc.length + 3)) {
                    countryCode = cc;
                    cityCode = cityCode.substring(cc.length + 2);
                }
            }
        }
        if (num.length === 0 && cityCode !== null) {
            if (cityCode.length === 10) {
                num.append(cityCode.substring(3));
                partLength.push(num.length);
                cityCode = cityCode.substring(0, 0 + 3);
                ok = true;
            }
            else if (((cityCode.length === 9 || cityCode.length === 11 || cityCode.length === 8)) && ((isPhoneBefore || countryCode !== null))) {
                num.append(cityCode);
                partLength.push(num.length);
                cityCode = null;
                ok = true;
            }
        }
        if (num.length < 4) 
            ok = false;
        if (num.length < 7) {
            if (cityCode !== null && (cityCode.length + num.length) > 7) {
                if (!isPhoneBefore && cityCode.length === 3) {
                    let ii = 0;
                    for (ii = 0; ii < partLength.length; ii++) {
                        if (partLength[ii] === 3) {
                        }
                        else if (partLength[ii] > 3) 
                            break;
                        else if ((ii < (partLength.length - 1)) || (partLength[ii] < 2)) 
                            break;
                    }
                    if (ii >= partLength.length) {
                        if (countryCode === "61") {
                        }
                        else 
                            ok = false;
                    }
                }
            }
            else if (((num.length === 6 || num.length === 5)) && ((partLength.length >= 1 && partLength.length <= 3)) && isPhoneBefore) {
                if (pli[0].itemType === PhoneItemTokenPhoneItemType.PREFIX && pli[0].kind === PhoneKind.HOME) 
                    ok = false;
                else if ((partLength.length === 1 && (num.length < 7) && pli[0].kind !== PhoneKind.UNDEFINED) && (pli[0].lengthChar < 3)) 
                    ok = false;
            }
            else if (prevPhone !== null && prevPhone.number !== null && ((prevPhone.number.length === num.length || prevPhone.number.length === (num.length + 3) || prevPhone.number.length === (num.length + 4)))) {
            }
            else if (num.length > 4 && prevPhone !== null && templ.toString() === prevPhone.m_Template) 
                ok = true;
            else 
                ok = false;
        }
        if (delim === "." && countryCode === null && cityCode === null) 
            ok = false;
        if ((isPhoneBefore && countryCode === null && cityCode === null) && num.length > 10) {
            let cc = PhoneHelper.getCountryPrefix(num.toString());
            if (cc !== null) {
                if ((num.length - cc.length) === 9) {
                    countryCode = cc;
                    num.remove(0, cc.length);
                    ok = true;
                }
            }
        }
        if (ok) {
            if (std) {
            }
            else if (prevPhone !== null && prevPhone.number !== null && (((prevPhone.number.length === num.length || prevPhone.number.length === (num.length + 3) || prevPhone.number.length === (num.length + 4)) || prevPhone.m_Template === templ.toString()))) {
            }
            else if ((partLength.length === 3 && partLength[0] === 3 && partLength[1] === 2) && partLength[2] === 2) {
            }
            else if (partLength.length === 3 && isPhoneBefore) {
            }
            else if ((partLength.length === 4 && ((partLength[0] + partLength[1]) === 3) && partLength[2] === 2) && partLength[3] === 2) {
            }
            else if ((partLength.length === 4 && partLength[0] === 3 && partLength[1] === 3) && partLength[2] === 2 && partLength[3] === 2) {
            }
            else if (partLength.length === 5 && (partLength[1] + partLength[2]) === 4 && (partLength[3] + partLength[4]) === 4) {
            }
            else if (partLength.length > 4) 
                ok = false;
            else if (partLength.length > 3 && cityCode !== null) 
                ok = false;
            else if ((isPhoneBefore || cityCode !== null || countryCode !== null) || additional !== null) 
                ok = true;
            else {
                ok = false;
                if (((num.length === 6 || num.length === 7)) && (partLength.length < 4) && j > 0) {
                    let nextPh = this.getNextPhone(pli[j - 1].endToken.next, lev + 1);
                    if (nextPh !== null) {
                        let d = nextPh.number.length - num.length;
                        if (d === 0 || d === 3 || d === 4) 
                            ok = true;
                    }
                }
            }
        }
        let end = (j > 0 ? pli[j - 1].endToken : null);
        if (end === null) 
            ok = false;
        if ((ok && cityCode === null && countryCode === null) && prevPhone === null && !isPhoneBefore) {
            if (!end.isWhitespaceAfter && end.next !== null) {
                let tt = end.next;
                if (tt.isCharOf(".,)") && tt.next !== null) 
                    tt = tt.next;
                if (!tt.isWhitespaceBefore) 
                    ok = false;
            }
        }
        if (ok) {
            let stempl = templ.toString().trim();
            if (stempl === "4 3.4" || ((((stempl === "2.4" || stempl === "3.4")) && pli[0].lengthChar === 4))) {
                if (pli[0].beginToken.previous !== null && pli[0].beginToken.previous.isChar('.') && (pli[0].beginToken.previous.previous instanceof NumberToken)) 
                    ok = false;
            }
            if (stempl === "4 3,4" || ((((stempl === "2,4" || stempl === "3,4")) && pli[0].lengthChar === 4))) {
                if (pli[0].beginToken.previous !== null && pli[0].beginToken.previous.isChar(',') && (pli[0].beginToken.previous.previous instanceof NumberToken)) 
                    ok = false;
            }
        }
        if (!ok) 
            return null;
        if (templ.length > 0 && !Utils.isDigit(templ.charAt(templ.length - 1))) 
            templ.length = templ.length - 1;
        if ((countryCode === null && cityCode !== null && cityCode.length > 3) && num.length > 6) {
            let cc = PhoneHelper.getCountryPrefix(cityCode);
            if (cc !== null && ((cc.length + 1) < cityCode.length)) {
                countryCode = cc;
                cityCode = cityCode.substring(cc.length);
            }
        }
        if (pli[0].beginToken.previous !== null) {
            if (pli[0].beginToken.previous.isValue("ГОСТ", null) || pli[0].beginToken.previous.isValue("ТУ", null)) 
                return null;
        }
        let ph = new PhoneReferent();
        if (countryCode !== null) 
            ph.countryCode = countryCode;
        let number = num.toString();
        if ((cityCode === null && num.length > 7 && partLength.length > 0) && (partLength[0] < 5)) {
            cityCode = number.substring(0, 0 + partLength[0]);
            number = number.substring(partLength[0]);
        }
        if (cityCode === null && num.length === 11 && num.charAt(0) === '8') {
            cityCode = number.substring(1, 1 + 3);
            number = number.substring(4);
        }
        if (cityCode === null && num.length === 10) {
            cityCode = number.substring(0, 0 + 3);
            number = number.substring(3);
        }
        if (cityCode !== null) 
            number = cityCode + number;
        else if (countryCode === null && prevPhone !== null) {
            let ok1 = false;
            if (prevPhone.number.length >= (number.length + 2)) 
                ok1 = true;
            else if (templ.length > 0 && prevPhone.m_Template !== null && LanguageHelper.endsWith(prevPhone.m_Template, templ.toString())) 
                ok1 = true;
            if (ok1 && prevPhone.number.length > number.length) 
                number = prevPhone.number.substring(0, 0 + prevPhone.number.length - number.length) + number;
        }
        if (ph.countryCode === null && prevPhone !== null && prevPhone.countryCode !== null) {
            if (prevPhone.number.length === number.length) 
                ph.countryCode = prevPhone.countryCode;
        }
        ok = false;
        for (const d of number) {
            if (d !== '0') {
                ok = true;
                break;
            }
        }
        if (!ok) 
            return null;
        if (countryCode !== null) {
            if (number.length < 7) 
                return null;
        }
        else {
            let s = PhoneHelper.getCountryPrefix(number);
            if (s !== null) {
                let num2 = number.substring(s.length);
                if (num2.length >= 10 && num2.length <= 11) {
                    number = num2;
                    if (s !== "7") 
                        ph.countryCode = s;
                }
            }
            if (number.length === 8 && prevPhone === null) 
                return null;
        }
        if (number.length > 11) {
            if ((number.length < 14) && ((countryCode === "1" || countryCode === "43"))) {
            }
            else 
                return null;
        }
        ph.number = number;
        if (additional !== null) 
            ph.addSlot(PhoneReferent.ATTR_ADDNUMBER, additional, true, 0);
        if (!isPhoneBefore && end.next !== null && !end.isNewlineAfter) {
            if (end.next.isCharOf("+=") || end.next.isHiphen) 
                return null;
        }
        if (countryCode !== null && countryCode === "7") {
            if (number.length !== 10) 
                return null;
        }
        ph.m_Template = templ.toString();
        if (j === (pli.length - 1) && pli[j].itemType === PhoneItemTokenPhoneItemType.PREFIX && !pli[j].isNewlineBefore) {
            end = pli[j].endToken;
            if (pli[j].kind !== PhoneKind.UNDEFINED) 
                ph.kind = pli[j].kind;
            if (pli[j].kind2 === PhoneKind.FAX) 
                ph.tag = pli[j].kind2;
        }
        let res = new ReferentToken(ph, pli[0].beginToken, end);
        if (pli[0].itemType === PhoneItemTokenPhoneItemType.PREFIX && pli[0].endToken.next.isTableControlChar) 
            res.beginToken = pli[1].beginToken;
        return res;
    }
    
    getNextPhone(t, lev) {
        if (t !== null && t.isChar(',')) 
            t = t.next;
        if (t === null || lev > 3) 
            return null;
        let its = PhoneItemToken.tryAttachAll(t, 15);
        if (its === null) 
            return null;
        let rt = this._TryAttach_(its, 0, false, null, lev + 1);
        if (rt === null) 
            return null;
        return Utils.as(rt.referent, PhoneReferent);
    }
    
    static initialize() {
        if (PhoneAnalyzer.m_Inited) 
            return;
        PhoneAnalyzer.m_Inited = true;
        MetaPhone.initialize();
        try {
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            PhoneHelper.initialize();
            PhoneItemToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new PhoneAnalyzer());
    }
    
    static static_constructor() {
        PhoneAnalyzer.ANALYZER_NAME = "PHONE";
        PhoneAnalyzer.m_Inited = false;
    }
}


PhoneAnalyzer.PhoneAnalizerData = class  extends AnalyzerData {
    
    constructor() {
        super();
        this.m_PhonesHash = new Hashtable();
    }
    
    registerReferent(referent) {
        const ReferentsEqualType = require("./../core/ReferentsEqualType");
        const Referent = require("./../Referent");
        const PhoneReferent = require("./PhoneReferent");
        let _phone = Utils.as(referent, PhoneReferent);
        if (_phone === null) 
            return null;
        let key = _phone.number;
        if (key.length >= 10) 
            key = key.substring(3);
        let phLi = [ ];
        let wrapphLi2748 = new RefOutArgWrapper();
        let inoutres2749 = this.m_PhonesHash.tryGetValue(key, wrapphLi2748);
        phLi = wrapphLi2748.value;
        if (!inoutres2749) 
            this.m_PhonesHash.put(key, (phLi = new Array()));
        for (const p of phLi) {
            if (p.canBeEquals(_phone, ReferentsEqualType.WITHINONETEXT)) {
                p.mergeSlots(_phone, true);
                return p;
            }
        }
        phLi.push(_phone);
        this.m_Referents.push(_phone);
        return _phone;
    }
}


PhoneAnalyzer.static_constructor();

module.exports = PhoneAnalyzer