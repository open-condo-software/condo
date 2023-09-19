/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const ReferentToken = require("./../ReferentToken");
const AnalyzerData = require("./../core/AnalyzerData");
const TextAnnotation = require("./../TextAnnotation");
const Token = require("./../Token");
const Referent = require("./../Referent");
const MorphLang = require("./../../morph/MorphLang");
const ProcessorService = require("./../ProcessorService");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const DateItemTokenFirstLastTyp = require("./internal/DateItemTokenFirstLastTyp");
const TerminParseAttr = require("./../core/TerminParseAttr");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const NumberToken = require("./../NumberToken");
const BracketHelper = require("./../core/BracketHelper");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const MetaDateRange = require("./internal/MetaDateRange");
const MetaToken = require("./../MetaToken");
const MetaDate = require("./internal/MetaDate");
const TextToken = require("./../TextToken");
const Termin = require("./../core/Termin");
const Analyzer = require("./../Analyzer");
const DatePointerType = require("./DatePointerType");
const DateItemTokenDateItemType = require("./internal/DateItemTokenDateItemType");
const DateAnalyzerData = require("./internal/DateAnalyzerData");
const NumberHelper = require("./../core/NumberHelper");
const DateReferent = require("./DateReferent");
const DateRangeReferent = require("./DateRangeReferent");

/**
 * Анализатор для дат и их диапазонов
 */
class DateAnalyzer extends Analyzer {
    
    get name() {
        return DateAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Даты";
    }
    
    get description() {
        return "Даты и диапазоны дат";
    }
    
    clone() {
        return new DateAnalyzer();
    }
    
    get typeSystem() {
        return [MetaDate.GLOBAL_META, MetaDateRange.GLOBAL_META];
    }
    
    get usedExternObjectTypes() {
        return ["PHONE"];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaDate.DATE_FULL_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("datefull.png"));
        res.put(MetaDate.DATE_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("date.png"));
        res.put(MetaDate.DATE_REL_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("daterel.png"));
        res.put(MetaDateRange.DATE_RANGE_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("daterange.png"));
        res.put(MetaDateRange.DATE_RANGE_REL_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("daterangerel.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === DateReferent.OBJ_TYPENAME) 
            return new DateReferent();
        if (type === DateRangeReferent.OBJ_TYPENAME) 
            return new DateRangeReferent();
        return null;
    }
    
    get progressWeight() {
        return 10;
    }
    
    createAnalyzerData() {
        return new DateAnalyzerData();
    }
    
    static getData(t) {
        if (t === null) 
            return null;
        return Utils.as(t.kit.getAnalyzerDataByAnalyzerName(DateAnalyzer.ANALYZER_NAME), DateAnalyzerData);
    }
    
    process(kit) {
        const DateItemToken = require("./internal/DateItemToken");
        const DateExToken = require("./internal/DateExToken");
        const DateRelHelper = require("./internal/DateRelHelper");
        let ad = Utils.as(kit.getAnalyzerData(this), DateAnalyzerData);
        DateItemToken.SPEED_REGIME = false;
        DateItemToken.prepareAllData(kit.firstToken);
        ad.dRegime = true;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let rts = null;
            let about = null;
            let t1 = null;
            let pli = DateItemToken.tryParseList(t, 20);
            if (pli === null || pli.length === 0) {
            }
            else {
                let high = false;
                for (let tt = t.previous; tt !== null; tt = tt.previous) {
                    if (tt.isValue("ДАТА", null) || tt.isValue("DATE", null) || tt.isValue("ВЫДАТЬ", null)) {
                        high = true;
                        break;
                    }
                    if (tt.isChar(':') || tt.isHiphen) 
                        continue;
                    if (tt.isNewlineAfter) 
                        break;
                    if (tt.getReferent() instanceof DateReferent) {
                        high = true;
                        break;
                    }
                    if (!(tt instanceof TextToken)) 
                        break;
                    if (!(tt.morph._case.isGenitive)) 
                        break;
                }
                if (!high && DateAnalyzer.isUserParamDate(t)) 
                    high = true;
                if (pli.length > 1 && pli[0].ptr === DatePointerType.ABOUT) {
                    about = pli[0];
                    pli.splice(0, 1);
                }
                rts = DateAnalyzer.tryAttach(pli, high);
                if ((rts === null && pli.length > 2 && pli[2].typ === DateItemTokenDateItemType.DELIM) && pli[2].beginToken.isComma) {
                    pli.splice(2, pli.length - 2);
                    rts = DateAnalyzer.tryAttach(pli, high);
                }
                if (rts === null && DateAnalyzer.isUserParamDate(t)) {
                    for (let i = 0; i < (pli.length - 2); i++) {
                        if (pli[i].typ !== DateItemTokenDateItemType.NUMBER) 
                            break;
                        else if (pli[i + 1].canBeDay && pli[i + 2].typ === DateItemTokenDateItemType.MONTH) {
                            let pli1 = new Array();
                            pli1.splice(pli1.length, 0, ...pli);
                            pli1.splice(0, i + 1);
                            rts = DateAnalyzer.tryAttach(pli1, high);
                            break;
                        }
                    }
                }
                t1 = pli[pli.length - 1].endToken;
            }
            if (rts === null) {
                if (rts === null) {
                    if (t1 !== null) 
                        t = t1;
                    continue;
                }
            }
            let dat = null;
            let hi = null;
            for (let i = 0; i < rts.length; i++) {
                let rt = rts[i];
                if (rt.referent instanceof DateRangeReferent) {
                    let dr = Utils.as(rt.referent, DateRangeReferent);
                    if (dr.dateFrom !== null) 
                        dr.dateFrom = Utils.as(ad.registerReferent(dr.dateFrom), DateReferent);
                    if (dr.dateTo !== null) 
                        dr.dateTo = Utils.as(ad.registerReferent(dr.dateTo), DateReferent);
                    rt.referent = ad.registerReferent(rt.referent);
                    if (rt.beginToken.previous !== null && rt.beginToken.previous.isValue("ПЕРИОД", null)) 
                        rt.beginToken = rt.beginToken.previous;
                    kit.embedToken(rt);
                    t = rt;
                    break;
                }
                let dt = Utils.as(rt.referent, DateReferent);
                if (dt.higher !== null) 
                    dt.higher = Utils.as(ad.registerReferent(dt.higher), DateReferent);
                rt.referent = ad.registerReferent(dt);
                hi = Utils.as(rt.referent, DateReferent);
                if ((i < (rts.length - 1)) && rt.tag === null) 
                    rt.referent.addOccurence(TextAnnotation._new1070(kit.sofa, rt.beginChar, rt.endChar, rt.referent));
                else {
                    dat = Utils.as(rt.referent, DateReferent);
                    if (about !== null) {
                        if (rt.beginChar > about.beginChar) 
                            rt.beginToken = about.beginToken;
                        dat.pointer = DatePointerType.ABOUT;
                    }
                    kit.embedToken(rt);
                    t = rt;
                    for (let j = i + 1; j < rts.length; j++) {
                        if (rts[j].beginChar === t.beginChar) 
                            rts[j].beginToken = t;
                        if (rts[j].endChar === t.endChar) 
                            rts[j].endToken = t;
                    }
                }
            }
            if ((dat !== null && t.previous !== null && t.previous.isHiphen) && t.previous.previous !== null && (t.previous.previous.getReferent() instanceof DateReferent)) {
                let dat0 = Utils.as(t.previous.previous.getReferent(), DateReferent);
                let dr = Utils.as(ad.registerReferent(DateRangeReferent._new1071(dat0, dat)), DateRangeReferent);
                let diap = new ReferentToken(dr, t.previous.previous, t);
                kit.embedToken(diap);
                t = diap;
                continue;
            }
            if ((dat !== null && t.previous !== null && ((t.previous.isHiphen || t.previous.isValue("ПО", null) || t.previous.isValue("И", null)))) && (t.previous.previous instanceof NumberToken) && t.previous.previous.intValue !== null) {
                let t0 = t.previous.previous;
                let dat0 = null;
                let num = t0.intValue;
                if (dat.day > 0 && (num < dat.day) && num > 0) {
                    if (dat.higher !== null) 
                        dat0 = DateReferent._new1072(dat.higher, num);
                    else if (dat.month > 0) 
                        dat0 = DateReferent._new1073(dat.month, num);
                }
                else if (dat.year > 0 && (num < dat.year) && ((num > 1000 || ((t.previous.previous.previous !== null && t.previous.previous.previous.isValue("С", null)))))) 
                    dat0 = DateReferent._new1074(num);
                else if ((dat.year < 0) && num > (-dat.year)) 
                    dat0 = DateReferent._new1074(-num);
                if (dat0 !== null) {
                    let rt0 = new ReferentToken(ad.registerReferent(dat0), t0, t0);
                    kit.embedToken(rt0);
                    if (!t.previous.isHiphen && !t.previous.isValue("ПО", null)) 
                        continue;
                    dat0 = Utils.as(rt0.referent, DateReferent);
                    let dr = Utils.as(ad.registerReferent(DateRangeReferent._new1071(dat0, dat)), DateRangeReferent);
                    let diap = new ReferentToken(dr, rt0, t);
                    if (diap.beginToken.previous !== null && diap.beginToken.previous.isValue("С", null)) 
                        diap.beginToken = diap.beginToken.previous;
                    kit.embedToken(diap);
                    t = diap;
                    continue;
                }
            }
        }
        DateAnalyzer.applyDateRange0(kit, ad);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let det = DateExToken.tryParse(t);
            if (det === null) 
                continue;
            let rel = false;
            for (const it of det.itemsFrom) {
                if (it.isValueRelate) 
                    rel = true;
            }
            for (const it of det.itemsTo) {
                if (it.isValueRelate) 
                    rel = true;
            }
            if (!rel) {
                t = det.endToken;
                continue;
            }
            let rts = DateRelHelper.createReferents(det);
            if (rts === null || rts.length === 0) 
                continue;
            let root = Utils.as(rts[0].tag, Referent);
            for (let i = 0; i < rts.length; i++) {
                let rt = rts[i];
                let old = rt.referent;
                rt.referent = ad.registerReferent(rt.referent);
                if (old === root) 
                    root = rt.referent;
                if (old !== rt.referent) {
                    for (let j = i + 1; j < rts.length; j++) {
                        for (const s of rts[j].referent.slots) {
                            if (s.value === old) 
                                s.value = rt.referent;
                        }
                    }
                }
                if (root !== null) {
                    for (const s of root.slots) {
                        if (s.value === old) 
                            s.value = rt.referent;
                    }
                }
                if (rt.referent === root) {
                    if (rt.beginChar > t.beginChar) 
                        rt.beginToken = t;
                    if (rt.endChar < det.endChar) 
                        rt.endToken = det.endToken;
                    root = null;
                }
                kit.embedToken(rt);
                t = rt;
                for (let j = i + 1; j < rts.length; j++) {
                    if (rts[j].beginChar === t.beginChar) 
                        rts[j].beginToken = t;
                    if (rts[j].endChar === t.endChar) 
                        rts[j].endToken = t;
                }
            }
            if (root !== null) {
                if (t.beginChar > det.beginChar || (t.endChar < det.endChar)) {
                    let rt = new ReferentToken(root, (t.beginChar > det.beginChar ? det.beginToken : t), (t.endChar < det.endChar ? det.endToken : t));
                    kit.embedToken(rt);
                    t = rt;
                }
            }
        }
        ad.dRegime = false;
    }
    
    processReferent(begin, param) {
        return DateAnalyzer.processReferentStat(begin, param);
    }
    
    static processReferentStat(begin, param = null) {
        const DateItemToken = require("./internal/DateItemToken");
        if (begin === null) 
            return null;
        let ad = DateAnalyzer.getData(begin);
        if (ad === null) 
            return null;
        if (ad.level > 2) 
            return null;
        if (begin.isValue("ДО", null) && (begin.next instanceof ReferentToken) && (begin.next.getReferent() instanceof DateReferent)) {
            let drr = DateRangeReferent._new1077(Utils.as(begin.next.getReferent(), DateReferent));
            let res1 = new ReferentToken(drr, begin, begin.next);
            if (res1.endToken.next !== null && res1.endToken.next.isValue("ВКЛЮЧИТЕЛЬНО", null)) 
                res1.endToken = res1.endToken.next;
            else 
                drr.addSlot("@EXCLUDE", "true", true, 0);
            res1.data = ad;
            return res1;
        }
        if (begin.isValue("ПОСЛЕ", null) && (begin.next instanceof ReferentToken) && (begin.next.getReferent() instanceof DateReferent)) {
            let drr = DateRangeReferent._new1078(Utils.as(begin.next.getReferent(), DateReferent));
            let res1 = new ReferentToken(drr, begin, begin.next);
            if (res1.endToken.next !== null && res1.endToken.next.isValue("ВКЛЮЧИТЕЛЬНО", null)) 
                res1.endToken = res1.endToken.next;
            else 
                drr.addSlot("@EXCLUDE", "true", true, 0);
            res1.data = ad;
            return res1;
        }
        ad.level++;
        let pli = DateItemToken.tryParseList(begin, 10);
        ad.level--;
        if (pli === null || pli.length === 0) 
            return null;
        ad.level++;
        let rts = DateAnalyzer.tryAttach(pli, true);
        ad.level--;
        if (rts === null || rts.length === 0) 
            return null;
        let res = rts[rts.length - 1];
        for (let i = 0; i < (rts.length - 1); i++) {
            if ((res.referent instanceof DateReferent) && (rts[i].referent instanceof DateReferent)) 
                res.referent.mergeSlots(rts[i].referent, true);
            else 
                rts[i].data = ad;
        }
        res.referent.addSlot(DateReferent.ATTR_HIGHER, null, true, 0);
        res.data = ad;
        return res;
    }
    
    static tryAttach(dts, high) {
        const DateItemToken = require("./internal/DateItemToken");
        if (dts === null || dts.length === 0) 
            return null;
        if ((dts[0].canBeHour && dts.length > 2 && dts[1].typ === DateItemTokenDateItemType.DELIM) && dts[2].intValue >= 0 && (dts[2].intValue < 60)) {
            if (dts[0].typ === DateItemTokenDateItemType.HOUR || ((dts[0].typ === DateItemTokenDateItemType.NUMBER && ((dts[2].typ === DateItemTokenDateItemType.HOUR || dts[2].typ === DateItemTokenDateItemType.NUMBER))))) {
                if (dts.length > 3 && dts[3].typ === DateItemTokenDateItemType.DELIM && dts[3].stringValue === dts[1].stringValue) {
                }
                else if (!DateAnalyzer.isUserParamIgnoreTime(dts[0])) {
                    let dts1 = Array.from(dts);
                    dts1.splice(0, 3);
                    let res1 = DateAnalyzer.tryAttach(dts1, false);
                    if (res1 !== null && (res1[res1.length - 1].referent instanceof DateReferent) && res1[res1.length - 1].referent.day > 0) {
                        let time = DateReferent._new1079(dts[0].intValue, dts[2].intValue);
                        time.higher = Utils.as(res1[res1.length - 1].referent, DateReferent);
                        res1.push(new ReferentToken(time, dts[0].beginToken, res1[res1.length - 1].endToken));
                        return res1;
                    }
                }
            }
        }
        if ((dts[0].canBeDay && dts.length > 6 && dts[1].stringValue === "-") && dts[2].canBeDay && (dts[0].intValue < dts[2].intValue)) {
            let dts1 = Array.from(dts);
            dts1.splice(0, 2);
            let res1 = DateAnalyzer.tryAttach(dts1, false);
            if (res1 !== null && res1[res1.length - 1].beginToken === dts[2].beginToken && res1[res1.length - 1].referent.day > 0) {
                let day1 = Utils.as(res1[res1.length - 1].referent, DateReferent);
                let day0 = new DateReferent();
                day0.higher = day1.higher;
                day0.day = dts[0].intValue;
                let tend = res1[res1.length - 1].endToken;
                res1.push(new ReferentToken(day0, dts[0].beginToken, dts[0].endToken));
                let ra = new DateRangeReferent();
                ra.dateFrom = day0;
                ra.dateTo = day1;
                res1.push(new ReferentToken(ra, dts[0].beginToken, tend));
                return res1;
            }
        }
        if (dts[0].typ === DateItemTokenDateItemType.HOUR && dts.length > 2 && dts[1].typ === DateItemTokenDateItemType.MINUTE) {
            let ii = 2;
            if ((ii < dts.length) && dts[ii].typ === DateItemTokenDateItemType.SECOND) 
                ii++;
            let dts1 = Array.from(dts);
            dts1.splice(0, ii);
            let res1 = DateAnalyzer.tryAttach(dts1, false);
            if (res1 !== null && (res1[res1.length - 1].referent instanceof DateReferent) && res1[res1.length - 1].referent.day > 0) {
                let time = DateReferent._new1079(dts[0].intValue, dts[1].intValue);
                if (ii > 2) 
                    time.second = dts[2].intValue;
                time.higher = Utils.as(res1[res1.length - 1].referent, DateReferent);
                res1.push(new ReferentToken(time, dts[0].beginToken, res1[res1.length - 1].endToken));
                return res1;
            }
        }
        if ((dts[0].canBeDay && dts.length > 4 && dts[1].typ === DateItemTokenDateItemType.DELIM) && dts[1].beginToken.isCommaAnd && dts[2].canBeDay) {
            let hasMonth = false;
            let hasYear = false;
            for (let kk = 0; kk < 2; kk++) {
                for (let ii = 3; ii < dts.length; ii++) {
                    if (dts[ii].canBeDay || ((dts[ii].typ === DateItemTokenDateItemType.DELIM && dts[ii].beginToken.isCommaAnd))) {
                    }
                    else if (dts[ii].typ === DateItemTokenDateItemType.MONTH) 
                        hasMonth = true;
                    else if (dts[ii].typ === DateItemTokenDateItemType.YEAR) {
                        hasYear = true;
                        break;
                    }
                    else 
                        break;
                }
                if (hasYear) 
                    break;
                if (!hasMonth || kk > 0) 
                    break;
                if (dts.length < 17) 
                    break;
                let dts1 = DateItemToken.tryParseList(dts[0].beginToken, 100);
                if (dts1 !== null && dts1.length > dts.length) 
                    dts = dts1;
                else 
                    break;
            }
            if (hasYear && hasMonth) {
                let dts2 = Array.from(dts);
                dts2.splice(0, 2);
                let res2 = DateAnalyzer.tryAttach(dts2, high);
                if (res2 !== null && (res2[res2.length - 1].referent instanceof DateReferent)) {
                    let dd = new DateReferent();
                    dd.day = dts[0].intValue;
                    dd.higher = res2[res2.length - 1].referent.higher;
                    res2.push(new ReferentToken(dd, dts[0].beginToken, dts[0].endToken));
                    return res2;
                }
            }
        }
        if (((dts[0].canBeDay && dts.length > 5 && dts[1].typ === DateItemTokenDateItemType.MONTH) && dts[2].typ === DateItemTokenDateItemType.DELIM && dts[2].beginToken.isCommaAnd) && dts[3].canBeDay) {
            let hasMonth = false;
            let hasYear = false;
            for (let kk = 0; kk < 2; kk++) {
                for (let ii = 3; ii < dts.length; ii++) {
                    if (dts[ii].canBeDay || ((dts[ii].typ === DateItemTokenDateItemType.DELIM && dts[ii].beginToken.isCommaAnd))) {
                    }
                    else if (dts[ii].typ === DateItemTokenDateItemType.MONTH) 
                        hasMonth = true;
                    else if (dts[ii].typ === DateItemTokenDateItemType.YEAR) {
                        hasYear = true;
                        break;
                    }
                    else 
                        break;
                }
                if (hasYear) 
                    break;
                if (!hasMonth || kk > 0) 
                    break;
                if (dts.length < 17) 
                    break;
                let dts1 = DateItemToken.tryParseList(dts[0].beginToken, 100);
                if (dts1 !== null && dts1.length > dts.length) 
                    dts = dts1;
                else 
                    break;
            }
            if (hasYear && hasMonth) {
                let dts2 = Array.from(dts);
                dts2.splice(0, 3);
                let res2 = DateAnalyzer.tryAttach(dts2, high);
                if (res2 !== null && (res2[res2.length - 1].referent instanceof DateReferent)) {
                    let yy = res2[res2.length - 1].referent.higher;
                    if (yy !== null) 
                        yy = yy.higher;
                    if (yy !== null && yy.year > 0) {
                        let mm = new DateReferent();
                        mm.month = dts[1].intValue;
                        mm.higher = yy;
                        res2.push(new ReferentToken(mm, dts[1].beginToken, dts[1].endToken));
                        let dd = new DateReferent();
                        dd.day = dts[0].intValue;
                        dd.higher = mm;
                        res2.push(new ReferentToken(dd, dts[0].beginToken, dts[1].endToken));
                        return res2;
                    }
                }
            }
        }
        let year = null;
        let mon = null;
        let day = null;
        let cent = null;
        let tenyears = null;
        let point = null;
        let yearIsDif = false;
        let b = false;
        let wrapyear1143 = new RefOutArgWrapper();
        let wrapmon1144 = new RefOutArgWrapper();
        let wrapday1145 = new RefOutArgWrapper();
        b = DateAnalyzer.applyRuleFormal(dts, high, wrapyear1143, wrapmon1144, wrapday1145);
        year = wrapyear1143.value;
        mon = wrapmon1144.value;
        day = wrapday1145.value;
        if (b) {
            let tt = dts[0].beginToken.previous;
            if (tt !== null) {
                if (tt.isValue("№", null) || tt.isValue("N", null)) 
                    b = false;
            }
        }
        if (dts[0].typ === DateItemTokenDateItemType.CENTURY) {
            if (dts.length === 1) {
                if (dts[0].beginToken instanceof NumberToken) 
                    return null;
                if (NumberHelper.tryParseRoman(dts[0].beginToken) === null) 
                    return null;
            }
            cent = dts[0];
            b = true;
        }
        else if (dts[0].typ === DateItemTokenDateItemType.TENYEARS) {
            tenyears = dts[0];
            b = true;
        }
        if (dts.length === 1 && dts[0].ptr === DatePointerType.TODAY) {
            let res0 = new Array();
            res0.push(new ReferentToken(DateReferent._new1081(DatePointerType.TODAY), dts[0].beginToken, dts[0].endToken));
            return res0;
        }
        if (dts.length === 1 && dts[0].typ === DateItemTokenDateItemType.YEAR && dts[0].year <= 0) {
            let res0 = new Array();
            res0.push(new ReferentToken(DateReferent._new1081(DatePointerType.UNDEFINED), dts[0].beginToken, dts[0].endToken));
            return res0;
        }
        if (!b && dts[0].typ === DateItemTokenDateItemType.POINTER && dts.length > 1) {
            if (dts[1].typ === DateItemTokenDateItemType.YEAR) {
                year = dts[1];
                point = dts[0];
                b = true;
            }
            else if (dts[1].typ === DateItemTokenDateItemType.CENTURY) {
                cent = dts[1];
                point = dts[0];
                b = true;
            }
            else if (dts[1].typ === DateItemTokenDateItemType.TENYEARS) {
                tenyears = dts[1];
                point = dts[0];
                b = true;
            }
            else if (dts[1].typ === DateItemTokenDateItemType.MONTH) {
                mon = dts[1];
                point = dts[0];
                if (dts.length > 2 && ((dts[2].typ === DateItemTokenDateItemType.YEAR || dts[2].canBeYear))) 
                    year = dts[2];
                b = true;
            }
        }
        if (!b) {
            let wrapyear1083 = new RefOutArgWrapper();
            let wrapmon1084 = new RefOutArgWrapper();
            let wrapday1085 = new RefOutArgWrapper();
            let wrapyearIsDif1086 = new RefOutArgWrapper();
            b = DateAnalyzer.applyRuleWithMonth(dts, high, wrapyear1083, wrapmon1084, wrapday1085, wrapyearIsDif1086);
            year = wrapyear1083.value;
            mon = wrapmon1084.value;
            day = wrapday1085.value;
            yearIsDif = wrapyearIsDif1086.value;
        }
        if (!b) {
            let wrapyear1087 = new RefOutArgWrapper();
            let wrapmon1088 = new RefOutArgWrapper();
            let wrapday1089 = new RefOutArgWrapper();
            b = DateAnalyzer.applyRuleYearOnly(dts, wrapyear1087, wrapmon1088, wrapday1089);
            year = wrapyear1087.value;
            mon = wrapmon1088.value;
            day = wrapday1089.value;
        }
        if (!b) {
            if (dts.length === 2 && dts[0].typ === DateItemTokenDateItemType.HOUR && dts[1].typ === DateItemTokenDateItemType.MINUTE) {
                let t00 = dts[0].beginToken.previous;
                if (t00 !== null && (((t00.isValue("ТЕЧЕНИЕ", null) || t00.isValue("ПРОТЯГОМ", null) || t00.isValue("ЧЕРЕЗ", null)) || t00.isValue("ТЕЧІЮ", null)))) {
                }
                else {
                    let res0 = new Array();
                    let time = DateReferent._new1079(dts[0].intValue, dts[1].intValue);
                    res0.push(new ReferentToken(time, dts[0].beginToken, dts[1].endToken));
                    let cou = 0;
                    for (let tt = dts[0].beginToken.previous; tt !== null && (cou < 1000); tt = tt.previous,cou++) {
                        if (tt.getReferent() instanceof DateReferent) {
                            let dr = Utils.as(tt.getReferent(), DateReferent);
                            if (dr.findSlot(DateReferent.ATTR_DAY, null, true) === null && dr.higher !== null) 
                                dr = dr.higher;
                            if (dr.findSlot(DateReferent.ATTR_DAY, null, true) !== null) {
                                time.higher = dr;
                                break;
                            }
                        }
                    }
                    return res0;
                }
            }
            if ((dts.length === 4 && dts[0].typ === DateItemTokenDateItemType.MONTH && dts[1].typ === DateItemTokenDateItemType.DELIM) && dts[2].typ === DateItemTokenDateItemType.MONTH && dts[3].canBeYear) {
                let res0 = new Array();
                let yea = DateReferent._new1074(dts[3].intValue);
                res0.push(ReferentToken._new1092(yea, dts[3].beginToken, dts[3].endToken, dts[3].morph));
                let mon1 = DateReferent._new1093(dts[0].intValue, yea);
                res0.push(ReferentToken._new1094(mon1, dts[0].beginToken, dts[0].endToken, mon1));
                let mon2 = DateReferent._new1093(dts[2].intValue, yea);
                res0.push(new ReferentToken(mon2, dts[2].beginToken, dts[3].endToken));
                return res0;
            }
            if (((dts.length >= 4 && dts[0].typ === DateItemTokenDateItemType.NUMBER && dts[0].canBeDay) && dts[1].typ === DateItemTokenDateItemType.DELIM && dts[2].typ === DateItemTokenDateItemType.NUMBER) && dts[2].canBeDay && dts[3].typ === DateItemTokenDateItemType.MONTH) {
                if (dts.length === 4 || ((dts.length === 5 && dts[4].canBeYear))) {
                    let res0 = new Array();
                    let yea = null;
                    if (dts.length === 5) 
                        res0.push(new ReferentToken((yea = DateReferent._new1074(dts[4].year)), dts[4].beginToken, dts[4].endToken));
                    let mo = DateReferent._new1093(dts[3].intValue, yea);
                    res0.push(new ReferentToken(mo, dts[3].beginToken, dts[dts.length - 1].endToken));
                    let da1 = DateReferent._new1098(dts[0].intValue, mo);
                    res0.push(new ReferentToken(da1, dts[0].beginToken, dts[0].endToken));
                    let da2 = DateReferent._new1098(dts[2].intValue, mo);
                    res0.push(new ReferentToken(da2, dts[2].beginToken, dts[dts.length - 1].endToken));
                    let dr = new DateRangeReferent();
                    dr.dateFrom = da1;
                    dr.dateTo = da2;
                    res0.push(new ReferentToken(dr, dts[0].beginToken, dts[dts.length - 1].endToken));
                    return res0;
                }
            }
            if ((dts.length >= 3 && dts[0].canByMonth && dts[1].typ === DateItemTokenDateItemType.DELIM) && dts[2].canBeYear && dts[1].stringValue === ".") {
                if (((dts.length >= 7 && dts[3].beginToken.isHiphen && dts[4].canByMonth) && dts[5].stringValue === "." && dts[6].canBeYear) && dts[2].intValue <= dts[6].intValue) {
                    let res0 = new Array();
                    let yea1 = DateReferent._new1074(dts[2].year);
                    res0.push(new ReferentToken(yea1, dts[2].beginToken, dts[2].endToken));
                    let mon1 = DateReferent._new1093(dts[0].intValue, yea1);
                    res0.push(new ReferentToken(mon1, dts[0].beginToken, dts[2].endToken));
                    let yea2 = DateReferent._new1074(dts[6].year);
                    res0.push(new ReferentToken(yea2, dts[6].beginToken, dts[6].endToken));
                    let mon2 = DateReferent._new1093(dts[4].intValue, yea2);
                    res0.push(new ReferentToken(mon2, dts[4].beginToken, dts[6].endToken));
                    let dr = new DateRangeReferent();
                    dr.dateFrom = mon1;
                    dr.dateTo = mon2;
                    res0.push(new ReferentToken(dr, dts[0].beginToken, dts[6].endToken));
                    return res0;
                }
                let ok2 = false;
                if (dts.length === 5 && dts[3].beginToken.isHiphen && dts[4].typ === DateItemTokenDateItemType.POINTER) 
                    ok2 = true;
                if ((dts.length === 3 && dts[2].endToken.next !== null && dts[2].endToken.next.isHiphen) && dts[2].endToken.next.next !== null && dts[2].endToken.next.next.isValue("ПО", null)) 
                    ok2 = true;
                if (ok2) {
                    let res0 = new Array();
                    let yea1 = DateReferent._new1074(dts[2].year);
                    res0.push(new ReferentToken(yea1, dts[2].beginToken, dts[2].endToken));
                    let mon1 = DateReferent._new1093(dts[0].intValue, yea1);
                    res0.push(new ReferentToken(mon1, dts[0].beginToken, dts[2].endToken));
                    let tt2 = dts[2].endToken.next.next;
                    if (tt2.isValue("ПО", null)) 
                        tt2 = tt2.next;
                    let dts2 = DateItemToken.tryParseList(tt2, 20);
                    if (dts2 !== null && dts2.length === 1 && dts2[0].typ === DateItemTokenDateItemType.POINTER) {
                        let nows = DateAnalyzer.tryAttach(dts2, false);
                        if (nows !== null && nows.length === 1 && (nows[0].referent instanceof DateReferent)) {
                            let dr = new DateRangeReferent();
                            dr.dateFrom = mon1;
                            dr.dateTo = Utils.as(nows[0].referent, DateReferent);
                            res0.push(nows[0]);
                            res0.push(new ReferentToken(dr, dts[0].beginToken, nows[0].endToken));
                        }
                    }
                    return res0;
                }
            }
            if ((dts[0].typ === DateItemTokenDateItemType.MONTH && dts.length === 1 && dts[0].endToken.next !== null) && ((dts[0].endToken.next.isHiphen || dts[0].endToken.next.isValue("ПО", null) || dts[0].endToken.next.isValue("НА", null)))) {
                let rt = DateAnalyzer.processReferentStat(dts[0].endToken.next.next, null);
                if (rt !== null) {
                    let dr0 = Utils.as(rt.referent, DateReferent);
                    if ((dr0 !== null && dr0.year > 0 && dr0.month > 0) && dr0.day === 0 && dr0.month > dts[0].intValue) {
                        let drYear0 = DateReferent._new1074(dr0.year);
                        let res0 = new Array();
                        res0.push(new ReferentToken(drYear0, dts[0].endToken, dts[0].endToken));
                        let drMon0 = DateReferent._new1093(dts[0].intValue, drYear0);
                        res0.push(new ReferentToken(drMon0, dts[0].beginToken, dts[0].endToken));
                        return res0;
                    }
                }
            }
            if (((dts.length === 3 && dts[1].typ === DateItemTokenDateItemType.DELIM && dts[1].beginToken.isHiphen) && dts[0].canBeYear && dts[2].canBeYear) && (dts[0].intValue < dts[2].intValue)) {
                let ok = false;
                if (dts[2].typ === DateItemTokenDateItemType.YEAR) 
                    ok = true;
                else if (dts[0].lengthChar === 4 && dts[2].lengthChar === 4 && dts[0].beginToken.previous !== null) {
                    let tt0 = dts[0].beginToken.previous;
                    if (tt0.isChar('(') && dts[2].endToken.next !== null && dts[2].endToken.next.isChar(')')) 
                        ok = true;
                    else if (tt0.isValue("IN", null) || tt0.isValue("SINCE", null) || tt0.isValue("В", "У")) 
                        ok = true;
                }
                if (ok) {
                    let res0 = new Array();
                    res0.push(new ReferentToken(DateReferent._new1074(dts[0].year), dts[0].beginToken, dts[0].endToken));
                    res0.push(new ReferentToken(DateReferent._new1074(dts[2].year), dts[2].beginToken, dts[2].endToken));
                    return res0;
                }
            }
            if (dts.length > 1 && dts[0].typ === DateItemTokenDateItemType.YEAR) {
                let res0 = new Array();
                res0.push(new ReferentToken(DateReferent._new1074(dts[0].year), dts[0].beginToken, dts[0].endToken));
                return res0;
            }
            if (dts[0].lTyp !== DateItemTokenFirstLastTyp.NO && dts.length > 1) 
                high = true;
            if (((dts.length === 5 && dts[0].canBeDay && dts[1].typ === DateItemTokenDateItemType.MONTH) && dts[2].canBeHour && dts[3].typ === DateItemTokenDateItemType.DELIM) && dts[4].canBeMinute) {
                let res0 = new Array();
                let mm = DateReferent._new1111(dts[1].intValue);
                res0.push(new ReferentToken(mm, dts[1].beginToken, dts[1].endToken));
                let dd = DateReferent._new1098(dts[0].intValue, mm);
                res0.push(new ReferentToken(dd, dts[0].beginToken, dts[2].endToken));
                let hh = DateReferent._new1113(dts[2].intValue, dts[4].intValue, dd);
                res0.push(new ReferentToken(hh, dts[0].beginToken, dts[4].endToken));
                return res0;
            }
            if (high) {
                if (dts.length === 1 && dts[0].canBeYear && dts[0].typ === DateItemTokenDateItemType.NUMBER) {
                    let res0 = new Array();
                    res0.push(new ReferentToken(DateReferent._new1074(dts[0].year), dts[0].beginToken, dts[0].endToken));
                    return res0;
                }
                if ((((dts.length === 3 && dts[0].canBeYear && dts[0].typ === DateItemTokenDateItemType.NUMBER) && dts[2].canBeYear && dts[2].typ === DateItemTokenDateItemType.NUMBER) && (dts[0].year < dts[2].year) && dts[1].typ === DateItemTokenDateItemType.DELIM) && dts[1].beginToken.isHiphen) {
                    let res0 = new Array();
                    let y1 = DateReferent._new1074(dts[0].year);
                    res0.push(new ReferentToken(y1, dts[0].beginToken, dts[0].endToken));
                    let y2 = DateReferent._new1074(dts[2].year);
                    res0.push(new ReferentToken(y2, dts[2].beginToken, dts[2].endToken));
                    let ra = DateRangeReferent._new1071(y1, y2);
                    res0.push(new ReferentToken(ra, dts[0].beginToken, dts[2].endToken));
                    return res0;
                }
                if (DateAnalyzer.isUserParamDate(dts[0])) {
                    if (((dts.length === 3 && dts[0].canBeDay && dts[0].typ === DateItemTokenDateItemType.NUMBER) && dts[2].canByMonth && dts[2].typ === DateItemTokenDateItemType.NUMBER) && dts[1].typ === DateItemTokenDateItemType.DELIM && dts[1].beginToken.isCharOf("./\\")) {
                        if (dts[0].beginToken.previous !== null && dts[0].beginToken.previous.isValue("В", null)) {
                        }
                        else {
                            let res0 = new Array();
                            let y1 = DateReferent._new1111(dts[2].intValue);
                            res0.push(new ReferentToken(y1, dts[2].beginToken, dts[2].endToken));
                            let y2 = DateReferent._new1098(dts[0].intValue, y1);
                            res0.push(new ReferentToken(y2, dts[0].beginToken, dts[2].endToken));
                            return res0;
                        }
                    }
                    if (((((dts.length === 7 && dts[0].canBeDay && dts[0].typ === DateItemTokenDateItemType.NUMBER) && dts[2].canByMonth && dts[2].typ === DateItemTokenDateItemType.NUMBER) && dts[1].typ === DateItemTokenDateItemType.DELIM && dts[1].beginToken.isCharOf("./\\")) && dts[3].beginToken.isHiphen && dts[4].canBeDay) && dts[6].canByMonth && dts[5].beginToken.isCharOf("./\\")) {
                        let res0 = new Array();
                        let m1 = DateReferent._new1111(dts[2].intValue);
                        res0.push(new ReferentToken(m1, dts[2].beginToken, dts[2].endToken));
                        let d1 = DateReferent._new1098(dts[0].intValue, m1);
                        res0.push(new ReferentToken(d1, dts[0].beginToken, dts[2].endToken));
                        let m2 = DateReferent._new1111(dts[6].intValue);
                        res0.push(new ReferentToken(m2, dts[6].beginToken, dts[6].endToken));
                        let d2 = DateReferent._new1098(dts[4].intValue, m2);
                        res0.push(new ReferentToken(d1, dts[4].beginToken, dts[6].endToken));
                        let ra = DateRangeReferent._new1071(d1, d2);
                        res0.push(new ReferentToken(ra, dts[0].beginToken, dts[6].endToken));
                        return res0;
                    }
                }
            }
            if (dts[0].typ === DateItemTokenDateItemType.QUARTAL || dts[0].typ === DateItemTokenDateItemType.HALFYEAR || ((dts[0].typ === DateItemTokenDateItemType.MONTH && dts[0].lTyp !== DateItemTokenFirstLastTyp.NO))) {
                if (dts.length === 1 || dts[1].typ === DateItemTokenDateItemType.YEAR) {
                    let res0 = new Array();
                    let ii = 0;
                    let yea = null;
                    if (dts.length > 1) {
                        ii = 1;
                        yea = DateReferent._new1074(dts[1].intValue);
                        res0.push(ReferentToken._new1092(yea, dts[1].beginToken, dts[1].endToken, dts[1].morph));
                    }
                    else {
                        let cou = 0;
                        for (let tt = dts[0].beginToken; tt !== null; tt = tt.previous) {
                            if ((++cou) > 200) 
                                break;
                            if (tt instanceof ReferentToken) {
                                if ((((yea = DateAnalyzer._findYear_(tt.getReferent())))) !== null) 
                                    break;
                            }
                            if (tt.isNewlineBefore) 
                                break;
                        }
                    }
                    if (yea === null) 
                        return null;
                    let m1 = 0;
                    let m2 = 0;
                    if (dts[0].typ === DateItemTokenDateItemType.HALFYEAR) {
                        if (dts[0].intValue === 2 || dts[0].lTyp === DateItemTokenFirstLastTyp.LAST) {
                            m1 = 7;
                            m2 = 12;
                        }
                        else if (dts[0].intValue === 1) {
                            m1 = 1;
                            m2 = 6;
                        }
                        else 
                            return null;
                    }
                    else if (dts[0].typ === DateItemTokenDateItemType.QUARTAL) {
                        if (dts[0].lTyp === DateItemTokenFirstLastTyp.FIRST) {
                            m1 = 1;
                            m2 = dts[0].intValue * 3;
                        }
                        else if (dts[0].lTyp === DateItemTokenFirstLastTyp.LAST) {
                            m1 = 13 - (dts[0].intValue * 3);
                            m2 = 12;
                        }
                        else if (dts[0].intValue === 1) {
                            m1 = 1;
                            m2 = 3;
                        }
                        else if (dts[0].intValue === 2) {
                            m1 = 4;
                            m2 = 6;
                        }
                        else if (dts[0].intValue === 3) {
                            m1 = 7;
                            m2 = 9;
                        }
                        else if (dts[0].intValue === 4 || dts[0].lTyp === DateItemTokenFirstLastTyp.LAST) {
                            m1 = 10;
                            m2 = 12;
                        }
                        else 
                            return null;
                    }
                    else if (dts[0].typ === DateItemTokenDateItemType.MONTH && dts[0].lTyp !== DateItemTokenFirstLastTyp.NO) {
                        if (dts[0].lTyp === DateItemTokenFirstLastTyp.FIRST) {
                            m1 = 1;
                            m2 = dts[0].intValue;
                        }
                        else {
                            m1 = 13 - dts[0].intValue;
                            m2 = 12;
                        }
                    }
                    else 
                        return null;
                    let mon1 = DateReferent._new1093(m1, yea);
                    res0.push(new ReferentToken(mon1, dts[0].beginToken, dts[0].beginToken));
                    let mon2 = DateReferent._new1093(m2, yea);
                    res0.push(new ReferentToken(mon2, dts[0].endToken, dts[0].endToken));
                    let dr = new DateRangeReferent();
                    dr.dateFrom = mon1;
                    dr.dateTo = mon2;
                    res0.push(new ReferentToken(dr, dts[0].beginToken, dts[ii].endToken));
                    return res0;
                }
            }
            if (((dts.length === 3 && dts[1].typ === DateItemTokenDateItemType.DELIM && ((dts[1].stringValue === "." || dts[1].stringValue === ":"))) && dts[0].canBeHour && dts[2].canBeMinute) && !DateAnalyzer.isUserParamIgnoreTime(dts[0])) {
                let ok = false;
                if (dts[0].beginToken.previous !== null && ((dts[0].beginToken.previous.isValue("В", null) || dts[0].beginToken.previous.isValue("ОКОЛО", null)))) 
                    ok = true;
                if (ok) {
                    let time = DateReferent._new1079(dts[0].intValue, dts[2].intValue);
                    let t00 = dts[0].beginToken;
                    let cou = 0;
                    for (let tt = dts[0].beginToken.previous; tt !== null && (cou < 1000); tt = tt.previous,cou++) {
                        if (tt.getReferent() instanceof DateReferent) {
                            let dr = Utils.as(tt.getReferent(), DateReferent);
                            if (dr.findSlot(DateReferent.ATTR_DAY, null, true) === null && dr.higher !== null) 
                                dr = dr.higher;
                            if (dr.findSlot(DateReferent.ATTR_DAY, null, true) !== null) {
                                time.higher = dr;
                                if ((tt.endChar + 10) >= t00.beginChar) 
                                    t00 = tt;
                                break;
                            }
                        }
                    }
                    let tt1 = dts[2].endToken;
                    if (tt1.next !== null && tt1.next.isValue("ЧАС", null)) {
                        tt1 = tt1.next;
                        let dtsli = DateItemToken.tryParseList(tt1.next, 20);
                        if (dtsli !== null) {
                            let res1 = DateAnalyzer.tryAttach(dtsli, true);
                            if (res1 !== null && res1[res1.length - 1].referent.day > 0) {
                                time.higher = Utils.as(res1[res1.length - 1].referent, DateReferent);
                                res1.push(new ReferentToken(time, dts[0].beginToken, tt1));
                                return res1;
                            }
                        }
                    }
                    let tt2 = DateAnalyzer._corrTime(tt1.next, time);
                    if (tt2 !== null) 
                        tt1 = tt2;
                    let res0 = new Array();
                    res0.push(new ReferentToken(time, t00, tt1));
                    return res0;
                }
            }
            if ((dts.length === 1 && dts[0].typ === DateItemTokenDateItemType.MONTH && dts[0].beginToken.previous !== null) && dts[0].beginToken.previous.morph._class.isPreposition) {
                if (dts[0].chars.isLatinLetter && dts[0].chars.isAllLower) {
                }
                else {
                    let res0 = new Array();
                    res0.push(new ReferentToken(DateReferent._new1111(dts[0].intValue), dts[0].beginToken, dts[0].endToken));
                    return res0;
                }
            }
            return null;
        }
        let res = new Array();
        let drYear = null;
        let drMon = null;
        let drDay = null;
        let t0 = null;
        let t1 = null;
        if (cent !== null) {
            let ce = DateReferent._new1131((cent.newAge < 0 ? -cent.intValue : cent.intValue), cent.relate);
            let rt = new ReferentToken(ce, cent.beginToken, (t1 = cent.endToken));
            res.push(rt);
        }
        if (tenyears !== null) {
            let ce = DateReferent._new1132(tenyears.intValue, tenyears.relate);
            if (cent !== null) 
                ce.higher = Utils.as(res[res.length - 1].referent, DateReferent);
            let rt = new ReferentToken(ce, tenyears.beginToken, (t1 = tenyears.endToken));
            res.push(rt);
        }
        if (year !== null && year.year > 0) {
            drYear = DateReferent._new1074((year.newAge < 0 ? -year.year : year.year));
            if (!yearIsDif) {
                t1 = year.endToken;
                if (t1.next !== null && t1.next.isValue("ГОРОД", null)) {
                    let tt2 = t1.next.next;
                    if (tt2 === null) 
                        year.endToken = (t1 = t1.next);
                    else if ((tt2.whitespacesBeforeCount < 3) && ((tt2.morph._class.isPreposition || tt2.chars.isAllLower))) 
                        year.endToken = (t1 = t1.next);
                }
            }
            res.push(ReferentToken._new1092(drYear, (t0 = year.beginToken), year.endToken, year.morph));
            if (((dts.length === 3 && year === dts[2] && mon === null) && day === null && dts[0].year > 0) && dts[1].typ === DateItemTokenDateItemType.DELIM && dts[1].endToken.isHiphen) {
                let drYear0 = DateReferent._new1074((year.newAge < 0 ? -dts[0].year : dts[0].year));
                res.push(new ReferentToken(drYear0, (t0 = dts[0].beginToken), dts[0].endToken));
            }
        }
        if (mon !== null) {
            drMon = DateReferent._new1111(mon.intValue);
            if (drYear !== null) 
                drMon.higher = drYear;
            if (t0 === null || (mon.beginChar < t0.beginChar)) 
                t0 = mon.beginToken;
            if (t1 === null || mon.endChar > t1.endChar) 
                t1 = mon.endToken;
            if (drYear === null && t1.next !== null && ((t1.next.isValue("ПО", null) || t1.next.isValue("НА", null)))) {
                let rt = DateAnalyzer.processReferentStat(t1.next.next, null);
                if (rt !== null) {
                    let dr0 = Utils.as(rt.referent, DateReferent);
                    if (dr0 !== null && dr0.year > 0 && dr0.month > 0) {
                        drYear = DateReferent._new1074(dr0.year);
                        res.push(new ReferentToken(drYear, (t0 = t1), t1));
                        drMon.higher = drYear;
                    }
                }
            }
            res.push(ReferentToken._new1092(drMon, t0, t1, mon.morph));
            if (day !== null) {
                drDay = DateReferent._new1139(day.intValue);
                drDay.higher = drMon;
                if (day.beginChar < t0.beginChar) 
                    t0 = day.beginToken;
                if (day.endChar > t1.endChar) 
                    t1 = day.endToken;
                let tt = null;
                for (tt = t0.previous; tt !== null; tt = tt.previous) {
                    if (!tt.isCharOf(",.")) 
                        break;
                }
                let dow = DateItemToken.DAYS_OF_WEEK.tryParse(tt, TerminParseAttr.NO);
                if (dow !== null) {
                    t0 = tt;
                    drDay.dayOfWeek = dow.termin.tag;
                }
                res.push(ReferentToken._new1092(drDay, t0, t1, day.morph));
                if (dts[0].typ === DateItemTokenDateItemType.HOUR) {
                    let hou = DateReferent._new1141(drDay);
                    hou.hour = dts[0].intValue;
                    hou.minute = 0;
                    if (dts[1].typ === DateItemTokenDateItemType.MINUTE) {
                        hou.minute = dts[1].intValue;
                        if (dts[2].typ === DateItemTokenDateItemType.SECOND) 
                            hou.second = dts[2].intValue;
                    }
                    res.push(new ReferentToken(hou, dts[0].beginToken, t1));
                    return res;
                }
            }
        }
        if (point !== null && res.length > 0) {
            let poi = new DateReferent();
            poi.pointer = point.ptr;
            poi.higher = Utils.as(res[res.length - 1].referent, DateReferent);
            res.push(new ReferentToken(poi, point.beginToken, t1));
            return res;
        }
        if (drDay !== null && !yearIsDif) {
            let rt = DateAnalyzer.tryAttachTime(t1.next, true);
            if (rt !== null) {
                rt.referent.higher = drDay;
                rt.beginToken = t0;
                res.push(rt);
                if (rt.endToken.next !== null && rt.endToken.next.isHiphen) {
                    let rt1 = DateAnalyzer.tryAttachTime(rt.endToken.next.next, true);
                    if (rt1 !== null) {
                        rt1.referent.higher = drDay;
                        res.push(rt1);
                        let rr = new DateRangeReferent();
                        rr.dateFrom = Utils.as(rt.referent, DateReferent);
                        rr.dateTo = Utils.as(rt1.referent, DateReferent);
                        res.push(new ReferentToken(rr, rt.beginToken, rt1.endToken));
                    }
                }
            }
            else 
                for (let i = 1; i < dts.length; i++) {
                    if (t0.beginChar === dts[i].beginChar) {
                        if (i > 2) {
                            dts.splice(i, dts.length - i);
                            rt = DateAnalyzer.tryAttachTimeLi(dts, true);
                            if (rt !== null) {
                                rt.referent.higher = drDay;
                                rt.endToken = t1;
                                res.push(rt);
                            }
                            break;
                        }
                    }
                }
        }
        if (res.length === 1) {
            let dt0 = Utils.as(res[0].referent, DateReferent);
            if (dt0.month === 0) {
                let tt = res[0].beginToken.previous;
                if (tt !== null && tt.isChar('_') && !tt.isNewlineAfter) {
                    for (; tt !== null; tt = tt.previous) {
                        if (!tt.isChar('_')) 
                            break;
                        else 
                            res[0].beginToken = tt;
                    }
                    if (BracketHelper.canBeEndOfSequence(tt, true, null, false)) {
                        for (tt = tt.previous; tt !== null; tt = tt.previous) {
                            if (tt.isNewlineAfter) 
                                break;
                            else if (tt.isChar('_')) {
                            }
                            else {
                                if (BracketHelper.canBeStartOfSequence(tt, true, false)) 
                                    res[0].beginToken = tt;
                                break;
                            }
                        }
                    }
                }
                tt = res[0].endToken.next;
                if (tt !== null && tt.isCharOf("(,")) {
                    let dit = DateItemToken.tryParse(tt.next, null, false);
                    if (dit !== null && dit.typ === DateItemTokenDateItemType.MONTH) {
                        drMon = DateReferent._new1142(dt0, dit.intValue);
                        let prMon = new ReferentToken(drMon, res[0].beginToken, dit.endToken);
                        if (tt.isChar('(') && prMon.endToken.next !== null && prMon.endToken.next.isChar(')')) 
                            prMon.endToken = prMon.endToken.next;
                        res.push(prMon);
                    }
                }
            }
        }
        if (res.length > 0 && drDay !== null) {
            let la = res[res.length - 1];
            let tt = la.endToken.next;
            if (tt !== null && tt.isChar(',')) 
                tt = tt.next;
            let tok = DateItemToken.DAYS_OF_WEEK.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null) {
                la.endToken = tok.endToken;
                drDay.dayOfWeek = tok.termin.tag;
            }
        }
        return res;
    }
    
    static _findYear_(r) {
        let dr = Utils.as(r, DateReferent);
        if (dr !== null) {
            for (; dr !== null; dr = dr.higher) {
                if (dr.higher === null && dr.year > 0) 
                    return dr;
            }
            return null;
        }
        let drr = Utils.as(r, DateRangeReferent);
        if (drr !== null) {
            if ((((dr = DateAnalyzer._findYear_(drr.dateFrom)))) !== null) 
                return dr;
            if ((((dr = DateAnalyzer._findYear_(drr.dateTo)))) !== null) 
                return dr;
        }
        return null;
    }
    
    static tryAttachTime(t, afterDate) {
        const DateItemToken = require("./internal/DateItemToken");
        if (t === null) 
            return null;
        if (DateAnalyzer.isUserParamIgnoreTime(t)) 
            return null;
        if (t.isValue("ГОРОД", null) && t.next !== null) 
            t = t.next;
        while (t !== null && ((t.morph._class.isPreposition || t.morph._class.isAdverb || t.isComma))) {
            if (t.morph.language.isRu) {
                if (!t.isValue("ПО", null) && !t.isValue("НА", null)) 
                    t = t.next;
                else 
                    break;
            }
            else 
                t = t.next;
        }
        if (t === null) 
            return null;
        let dts = DateItemToken.tryParseList(t, 10);
        if (dts === null || dts.length === 0) 
            return null;
        if (dts[0].isNewlineBefore && dts[0].typ !== DateItemTokenDateItemType.HOUR && !DateAnalyzer.isUserParamDate(dts[0])) 
            return null;
        return DateAnalyzer.tryAttachTimeLi(dts, afterDate);
    }
    
    static _corrTime(t0, time) {
        const DateItemToken = require("./internal/DateItemToken");
        let t1 = null;
        for (let t = t0; t !== null; t = t.next) {
            if (!(t instanceof TextToken)) 
                break;
            let term = t.term;
            if (term === "МСК") {
                t1 = t;
                continue;
            }
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
            if (npt !== null && npt.endToken.isValue("ВРЕМЯ", null)) {
                t = (t1 = npt.endToken);
                continue;
            }
            if ((t.isCharOf("(") && t.next !== null && t.next.isValue("МСК", null)) && t.next.next !== null && t.next.next.isChar(')')) {
                t1 = (t = t.next.next);
                continue;
            }
            if ((term === "PM" || term === "РМ" || t.isValue("ВЕЧЕР", "ВЕЧІР")) || t.isValue("ДЕНЬ", null)) {
                if (time.hour < 12) 
                    time.hour = time.hour + 12;
                t1 = t;
                continue;
            }
            if ((term === "AM" || term === "АМ" || term === "Ч") || t.isValue("ЧАС", null)) {
                t1 = t;
                continue;
            }
            if (t.isChar('+')) {
                let ddd = DateItemToken.tryParseList(t.next, 20);
                if ((ddd !== null && ddd.length === 3 && ddd[0].typ === DateItemTokenDateItemType.NUMBER) && ddd[1].typ === DateItemTokenDateItemType.DELIM && ddd[2].typ === DateItemTokenDateItemType.NUMBER) {
                    t1 = ddd[2].endToken;
                    continue;
                }
            }
            if (t.isCharOf(",.")) 
                continue;
            break;
        }
        return t1;
    }
    
    static tryAttachTimeLi(dts, afterDate) {
        if (dts === null || (dts.length < 1)) 
            return null;
        let t0 = dts[0].beginToken;
        let t1 = null;
        let time = null;
        if (dts.length === 1) {
            if (dts[0].typ === DateItemTokenDateItemType.HOUR && afterDate) {
                time = DateReferent._new1079(dts[0].intValue, 0);
                t1 = dts[0].endToken;
            }
            else 
                return null;
        }
        else if (dts[0].typ === DateItemTokenDateItemType.HOUR && dts[1].typ === DateItemTokenDateItemType.MINUTE) {
            time = DateReferent._new1079(dts[0].intValue, dts[1].intValue);
            t1 = dts[1].endToken;
            if (dts.length > 2 && dts[2].typ === DateItemTokenDateItemType.SECOND) {
                t1 = dts[2].endToken;
                time.second = dts[2].intValue;
            }
        }
        else if ((((dts.length > 2 && dts[0].typ === DateItemTokenDateItemType.NUMBER && dts[1].typ === DateItemTokenDateItemType.DELIM) && ((dts[1].stringValue === ":" || dts[1].stringValue === "." || dts[1].stringValue === "-")) && dts[2].typ === DateItemTokenDateItemType.NUMBER) && (dts[0].intValue < 24) && (dts[2].intValue < 60)) && dts[2].lengthChar === 2 && afterDate) {
            if (dts.length >= 5) {
                let dat = DateAnalyzer.tryAttach(dts, false);
                if (dat !== null && dat.length > 0) 
                    return null;
            }
            time = DateReferent._new1079(dts[0].intValue, dts[2].intValue);
            t1 = dts[2].endToken;
            if ((dts.length > 4 && dts[3].stringValue === dts[1].stringValue && dts[4].typ === DateItemTokenDateItemType.NUMBER) && (dts[4].intValue < 60)) {
                time.second = dts[4].intValue;
                t1 = dts[4].endToken;
            }
        }
        if (time === null) 
            return null;
        let tt = DateAnalyzer._corrTime(t1.next, time);
        if (tt !== null) 
            t1 = tt;
        let cou = 0;
        for (tt = t0.previous; tt !== null && (cou < 1000); tt = tt.previous,cou++) {
            if (tt.getReferent() instanceof DateReferent) {
                let dr = Utils.as(tt.getReferent(), DateReferent);
                if (dr.findSlot(DateReferent.ATTR_DAY, null, true) === null && dr.higher !== null) 
                    dr = dr.higher;
                if (dr.findSlot(DateReferent.ATTR_DAY, null, true) !== null) {
                    time.higher = dr;
                    break;
                }
            }
        }
        if (t1.next !== null) {
            if (t1.next.isValue("ЧАС", null)) 
                t1 = t1.next;
        }
        return new ReferentToken(time, t0, t1);
    }
    
    static applyRuleFormal(its, high, year, mon, day) {
        const DateItemToken = require("./internal/DateItemToken");
        year.value = null;
        mon.value = null;
        day.value = null;
        if (!high && its.length === 5) {
            if (its[0].beginToken.previous !== null && its[0].beginToken.previous.isValue("ОТ", null)) 
                high = true;
        }
        let i = 0;
        let j = 0;
        for (i = 0; i < (its.length - 4); i++) {
            if ((its[i].beginToken.previous !== null && its[i].beginToken.previous.isChar(')') && (its[i].whitespacesBeforeCount < 2)) && i > 0) 
                return false;
            if (!its[i].canBeDay && !its[i].canBeYear && !its[i].canByMonth) 
                continue;
            if (!its[i].isWhitespaceBefore) {
                if (its[i].beginToken.previous !== null && ((its[i].beginToken.previous.isCharOf("(;,") || its[i].beginToken.previous.morph._class.isPreposition || its[i].beginToken.previous.isTableControlChar))) {
                }
                else if (i > 0) 
                    continue;
            }
            for (j = i; j < (i + 4); j++) {
                if (its[j].isWhitespaceAfter) {
                    if (high && !its[j].isNewlineAfter) 
                        continue;
                    if (i === 0 && its.length === 5 && ((j === 1 || j === 3))) {
                        if (its[j].whitespacesAfterCount < 2) 
                            continue;
                    }
                    break;
                }
            }
            if (j < (i + 4)) 
                continue;
            if (its[i + 1].typ !== DateItemTokenDateItemType.DELIM || its[i + 3].typ !== DateItemTokenDateItemType.DELIM || its[i + 1].stringValue !== its[i + 3].stringValue) 
                continue;
            j = i + 5;
            if ((j < its.length) && !its[j].isWhitespaceBefore) {
                if (its[j].typ === DateItemTokenDateItemType.DELIM && its[j].isWhitespaceAfter) {
                }
                else 
                    continue;
            }
            mon.value = (its[i + 2].canByMonth ? its[i + 2] : null);
            if (!its[i].canBeDay) {
                if (!its[i].canBeYear) 
                    continue;
                year.value = its[i];
                if (mon.value !== null && its[i + 4].canBeDay) 
                    day.value = its[i + 4];
                else if (its[i + 2].canBeDay && its[i + 4].canByMonth) {
                    day.value = its[i + 2];
                    mon.value = its[i + 4];
                }
                else 
                    continue;
            }
            else if (!its[i].canBeYear) {
                if (!its[i + 4].canBeYear) {
                    if (!high) 
                        continue;
                }
                year.value = its[i + 4];
                if (mon.value !== null && its[i].canBeDay) 
                    day.value = its[i];
                else if (its[i].canByMonth && its[i + 2].canBeDay) {
                    mon.value = its[i];
                    day.value = its[i + 2];
                }
                else 
                    continue;
            }
            else 
                continue;
            if ((mon.value.intValue < 10) && !mon.value.isZeroHeaded) {
                if (year.value.intValue < 1980) 
                    continue;
            }
            let delim = its[i + 1].stringValue[0];
            if ((delim !== '/' && delim !== '\\' && delim !== '.') && delim !== '-') 
                continue;
            if (delim === '.' || delim === '-') {
                if (year.value === its[i] && (year.value.intValue < 1900)) 
                    continue;
            }
            if ((i + 5) < its.length) 
                its.splice(i + 5, its.length - i - 5);
            if (i > 0) 
                its.splice(0, i);
            return true;
        }
        if (its.length >= 5 && its[0].isWhitespaceBefore && its[4].isWhitespaceAfter) {
            if (its[1].typ === DateItemTokenDateItemType.DELIM && its[2].typ === DateItemTokenDateItemType.DELIM) {
                if (its[0].lengthChar === 2 && its[2].lengthChar === 2 && ((its[4].lengthChar === 2 || its[4].lengthChar === 4))) {
                    if (its[0].canBeDay && its[2].canByMonth && its[4].typ === DateItemTokenDateItemType.NUMBER) {
                        if ((!its[0].isWhitespaceAfter && !its[1].isWhitespaceAfter && !its[2].isWhitespaceAfter) && !its[3].isWhitespaceAfter) {
                            let iyear = 0;
                            let y = its[4].intValue;
                            if (y > 80 && (y < 100)) 
                                iyear = 1900 + y;
                            else if (y <= (Utils.getDate(Utils.now()).getFullYear() - 2000)) 
                                iyear = y + 2000;
                            else 
                                return false;
                            its[4].year = iyear;
                            year.value = its[4];
                            mon.value = its[2];
                            day.value = its[0];
                            return true;
                        }
                    }
                }
            }
        }
        if (high && its[0].canBeYear && its.length === 1) {
            year.value = its[0];
            if (its[0].newStyle !== null && its[0].newStyle.length > 0) 
                year.value = DateItemToken._new1149(its[0].beginToken, its[0].beginToken, its[0].intValue);
            return true;
        }
        if (its[0].beginToken.previous !== null && its[0].beginToken.previous.isValue("ОТ", null) && its.length === 4) {
            if (its[0].canBeDay && its[3].canBeYear) {
                if (its[1].typ === DateItemTokenDateItemType.DELIM && its[2].canByMonth) {
                    year.value = its[3];
                    mon.value = its[2];
                    day.value = its[0];
                    return true;
                }
                if (its[2].typ === DateItemTokenDateItemType.DELIM && its[1].canByMonth) {
                    year.value = its[3];
                    mon.value = its[1];
                    day.value = its[0];
                    return true;
                }
            }
        }
        if ((its.length === 3 && its[0].typ === DateItemTokenDateItemType.NUMBER && its[0].canBeDay) && its[1].canByMonth) {
            if (its[2].typ === DateItemTokenDateItemType.YEAR || ((its[2].canBeYear && its[0].beginToken.previous !== null && its[0].beginToken.previous.isValue("ОТ", null)))) {
                if (((BracketHelper.isBracket(its[0].beginToken, false) && BracketHelper.isBracket(its[0].endToken, false))) || ((its[0].beginToken.previous !== null && its[0].beginToken.previous.getMorphClassInDictionary().isPreposition))) {
                    year.value = its[2];
                    mon.value = its[1];
                    day.value = its[0];
                    return true;
                }
            }
        }
        if (high) {
            if (((its.length >= 5 && its[0].canBeDay && its[1].stringValue === ".") && its[2].canByMonth && its[3].stringValue === ".") && its[4].typ === DateItemTokenDateItemType.NUMBER) {
                if (its.length === 5 || its[4].endToken.next.isHiphen) {
                    year.value = its[4];
                    mon.value = its[2];
                    day.value = its[0];
                    return true;
                }
            }
        }
        return false;
    }
    
    static applyRuleWithMonth(its, high, year, mon, day, yearIsDiff) {
        year.value = null;
        mon.value = null;
        day.value = null;
        yearIsDiff.value = false;
        let i = 0;
        if (its.length === 2) {
            if (its[0].typ === DateItemTokenDateItemType.MONTH && its[0].lTyp === DateItemTokenFirstLastTyp.NO && its[1].typ === DateItemTokenDateItemType.YEAR) {
                year.value = its[1];
                mon.value = its[0];
                return true;
            }
            if (its[0].canBeDay && its[1].typ === DateItemTokenDateItemType.MONTH) {
                mon.value = its[1];
                day.value = its[0];
                return true;
            }
        }
        for (i = 0; i < its.length; i++) {
            if (its[i].typ === DateItemTokenDateItemType.MONTH && its[i].lTyp === DateItemTokenFirstLastTyp.NO) 
                break;
        }
        if (i >= its.length) 
            return false;
        let lang = its[i].lang;
        year.value = null;
        day.value = null;
        mon.value = its[i];
        let i0 = i;
        let i1 = i;
        let yearVal = 0;
        if ((lang.isRu || lang.isIt || lang.isBy) || lang.isUa) {
            if (((i + 1) < its.length) && its[i + 1].typ === DateItemTokenDateItemType.YEAR) {
                year.value = its[i + 1];
                i1 = i + 1;
                if (i > 0 && its[i - 1].canBeDay) {
                    day.value = its[i - 1];
                    i0 = i - 1;
                }
            }
            else if (i > 0 && its[i - 1].typ === DateItemTokenDateItemType.YEAR) {
                year.value = its[i - 1];
                i0 = i - 1;
                if (((i + 1) < its.length) && its[i + 1].canBeDay) {
                    day.value = its[i + 1];
                    i1 = i + 1;
                }
            }
            else if (((i + 1) < its.length) && its[i + 1].canBeYear) {
                if (its[i + 1].typ === DateItemTokenDateItemType.NUMBER) {
                    let t00 = its[0].beginToken;
                    if (t00.previous !== null && t00.previous.isCharOf(".,")) 
                        t00 = t00.previous.previous;
                    if (t00 !== null && (t00.whitespacesAfterCount < 3)) {
                        if (((t00.isValue("УЛИЦА", null) || t00.isValue("УЛ", null) || t00.isValue("ПРОСПЕКТ", null)) || t00.isValue("ПРОСП", null) || t00.isValue("ПР", null)) || t00.isValue("ПЕРЕУЛОК", null) || t00.isValue("ПЕР", null)) 
                            return false;
                    }
                }
                year.value = its[i + 1];
                i1 = i + 1;
                if (i > 0 && its[i - 1].canBeDay) {
                    day.value = its[i - 1];
                    i0 = i - 1;
                }
            }
            else if ((i === 0 && its[0].typ === DateItemTokenDateItemType.MONTH && its.length === 3) && its[i + 1].typ === DateItemTokenDateItemType.DELIM && its[i + 2].canBeYear) {
                year.value = its[i + 2];
                i1 = i + 2;
            }
            else if (i > 1 && its[i - 2].canBeYear && its[i - 1].canBeDay) {
                year.value = its[i - 2];
                day.value = its[i - 1];
                i0 = i - 2;
            }
            else if (i > 0 && its[i - 1].canBeYear) {
                year.value = its[i - 1];
                i0 = i - 1;
                if (((i + 1) < its.length) && its[i + 1].canBeDay) {
                    day.value = its[i + 1];
                    i1 = i + 1;
                }
            }
            if (year.value === null && i === 1 && its[i - 1].canBeDay) {
                for (let j = i + 1; j < its.length; j++) {
                    if (its[j].typ === DateItemTokenDateItemType.DELIM) 
                        continue;
                    if (its[j].typ === DateItemTokenDateItemType.YEAR) {
                        year.value = its[j];
                        day.value = its[i - 1];
                        i0 = i - 1;
                        i1 = i;
                        yearIsDiff.value = true;
                        break;
                    }
                    if (!its[j].canBeDay) 
                        break;
                    if ((++j) >= its.length) 
                        break;
                    if (its[j].typ === DateItemTokenDateItemType.MONTH) 
                        continue;
                    if (its[j].typ === DateItemTokenDateItemType.DELIM && ((j + 1) < its.length) && its[j + 1].canBeDay) 
                        continue;
                    break;
                }
            }
        }
        else if (lang.isEn) {
            if (i === 1 && its[0].canBeDay) {
                i1 = 2;
                day.value = its[0];
                i0 = 0;
                if ((i1 < its.length) && its[i1].typ === DateItemTokenDateItemType.DELIM) 
                    i1++;
                if ((i1 < its.length) && its[i1].canBeYear) 
                    year.value = its[i1];
                if (year.value === null) {
                    i1 = 1;
                    yearVal = DateAnalyzer.findYear(its[0].beginToken);
                }
            }
            else if (i === 0) {
                if (its.length > 1 && its[1].canBeYear && !its[1].canBeDay) {
                    i1 = 2;
                    year.value = its[1];
                }
                else if (its.length > 1 && its[1].canBeDay) {
                    day.value = its[1];
                    i1 = 2;
                    if ((i1 < its.length) && its[i1].typ === DateItemTokenDateItemType.DELIM) 
                        i1++;
                    if ((i1 < its.length) && its[i1].canBeYear) 
                        year.value = its[i1];
                    if (year.value === null) {
                        i1 = 1;
                        yearVal = DateAnalyzer.findYear(its[0].beginToken);
                    }
                }
            }
        }
        if (year.value === null && yearVal === 0 && its.length === 3) {
            if (its[0].typ === DateItemTokenDateItemType.YEAR && its[1].canBeDay && its[2].typ === DateItemTokenDateItemType.MONTH) {
                i1 = 2;
                year.value = its[0];
                day.value = its[1];
            }
        }
        if (year.value !== null || yearVal > 0) 
            return true;
        if (day.value !== null && its.length === 2) 
            return true;
        return false;
    }
    
    static findYear(t) {
        let year = 0;
        let prevdist = 0;
        for (let tt = t; tt !== null; tt = tt.previous) {
            if (tt.isNewlineBefore) 
                prevdist += 10;
            prevdist++;
            if (tt instanceof ReferentToken) {
                if (tt.referent instanceof DateReferent) {
                    year = tt.referent.year;
                    break;
                }
            }
        }
        let dist = 0;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.isNewlineAfter) 
                dist += 10;
            dist++;
            if (tt instanceof ReferentToken) {
                if (tt.referent instanceof DateReferent) {
                    if (year > 0 && (prevdist < dist)) 
                        return year;
                    else 
                        return tt.referent.year;
                }
            }
        }
        return year;
    }
    
    static applyRuleYearOnly(its, year, mon, day) {
        year.value = null;
        mon.value = null;
        day.value = null;
        let i = 0;
        let doubt = false;
        for (i = 0; i < its.length; i++) {
            if (its[i].typ === DateItemTokenDateItemType.YEAR) 
                break;
            else if (its[i].typ === DateItemTokenDateItemType.NUMBER) 
                doubt = true;
            else if (its[i].typ !== DateItemTokenDateItemType.DELIM) 
                return false;
        }
        if (i >= its.length) {
            if (((its.length === 1 && its[0].canBeYear && its[0].intValue > 1900) && its[0].canBeYear && (its[0].intValue < 2100)) && its[0].beginToken.previous !== null) {
                if (((its[0].beginToken.previous.isValue("В", null) || its[0].beginToken.previous.isValue("У", null) || its[0].beginToken.previous.isValue("З", null)) || its[0].beginToken.previous.isValue("IN", null) || its[0].beginToken.previous.isValue("SINCE", null))) {
                    if (its[0].lengthChar === 4 || its[0].beginToken.morph._class.isAdjective) {
                        year.value = its[0];
                        return true;
                    }
                }
            }
            return false;
        }
        if ((i + 1) === its.length) {
            if (its[i].intValue > 1900 || its[i].newAge !== 0) {
                year.value = its[i];
                return true;
            }
            if (doubt) 
                return false;
            if (its[i].intValue > 10 && (its[i].intValue < 100)) {
                if (its[i].beginToken.previous !== null) {
                    if (its[i].beginToken.previous.isValue("В", null) || its[i].beginToken.previous.isValue("IN", null) || its[i].beginToken.previous.isValue("У", null)) {
                        year.value = its[i];
                        return true;
                    }
                }
                if (its[i].beginToken.isValue("В", null) || its[i].beginToken.isValue("У", null) || its[i].beginToken.isValue("IN", null)) {
                    year.value = its[i];
                    return true;
                }
            }
            if (its[i].intValue >= 100) {
                year.value = its[i];
                return true;
            }
            return false;
        }
        if (its.length === 1 && its[0].typ === DateItemTokenDateItemType.YEAR && its[0].year <= 0) {
            year.value = its[0];
            return true;
        }
        if (((its.length > 2 && its[0].canBeYear && its[1].typ === DateItemTokenDateItemType.DELIM) && its[1].beginToken.isHiphen && its[2].typ === DateItemTokenDateItemType.YEAR) && (its[0].year0 < its[2].year0)) {
            year.value = its[0];
            return true;
        }
        if (its[0].typ === DateItemTokenDateItemType.YEAR) {
            if ((its[0].beginToken.previous !== null && its[0].beginToken.previous.isHiphen && (its[0].beginToken.previous.previous instanceof ReferentToken)) && (its[0].beginToken.previous.previous.getReferent() instanceof DateReferent)) {
                year.value = its[0];
                return true;
            }
        }
        return false;
    }
    
    static applyDateRange(ad, its, lang) {
        lang.value = new MorphLang();
        if (its === null || (its.length < 3)) 
            return null;
        if ((its[0].canBeYear && its[1].stringValue === "-" && its[2].typ === DateItemTokenDateItemType.YEAR) && (its[0].year < its[2].year)) {
            let res = new DateRangeReferent();
            res.dateFrom = Utils.as(ad.registerReferent(DateReferent._new1074(its[0].year)), DateReferent);
            let rt1 = new ReferentToken(res.dateFrom, its[0].beginToken, its[0].endToken);
            res.dateTo = Utils.as(ad.registerReferent(DateReferent._new1074(its[2].year)), DateReferent);
            let rt2 = new ReferentToken(res.dateTo, its[2].beginToken, its[2].endToken);
            lang.value = its[2].lang;
            return res;
        }
        return null;
    }
    
    static applyDateRange0(kit, ad) {
        const DateItemToken = require("./internal/DateItemToken");
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (!(t instanceof TextToken)) 
                continue;
            let yearVal1 = 0;
            let yearVal2 = 0;
            let date1 = null;
            let date2 = null;
            let lang = new MorphLang();
            let t0 = t.next;
            let str = t.term;
            if (str === "ON" && (t0 instanceof TextToken)) {
                let tok = DateItemToken.DAYS_OF_WEEK.tryParse(t0, TerminParseAttr.NO);
                if (tok !== null) {
                    let dow = DateReferent._new1152(tok.termin.tag);
                    let rtd = new ReferentToken(ad.registerReferent(dow), t, tok.endToken);
                    kit.embedToken(rtd);
                    t = rtd;
                    continue;
                }
            }
            let isBetwen = false;
            if (str === "С" || str === "C") 
                lang = MorphLang.RU;
            else if (str === "МЕЖДУ") {
                lang = MorphLang.RU;
                isBetwen = true;
            }
            else if (str === "З") 
                lang = MorphLang.UA;
            else if (str === "ПОМІЖ" || str === "МІЖ") {
                lang = MorphLang.UA;
                isBetwen = true;
            }
            else if (str === "BETWEEN") {
                lang = MorphLang.EN;
                isBetwen = true;
            }
            else if (str === "IN") {
                lang = MorphLang.EN;
                if ((t0 !== null && t0.isValue("THE", null) && t0.next !== null) && t0.next.isValue("PERIOD", null)) 
                    t0 = t0.next.next;
            }
            else if (str === "ПО" || str === "ДО" || str === "BEFORE") {
                if ((t.next instanceof ReferentToken) && (t.next.getReferent() instanceof DateReferent)) {
                    let dr = DateRangeReferent._new1077(Utils.as(t.next.getReferent(), DateReferent));
                    let rt0 = new ReferentToken(ad.registerReferent(dr), t, t.next);
                    if (rt0.endToken.next !== null && rt0.endToken.next.isValue("ВКЛЮЧИТЕЛЬНО", null)) 
                        rt0.endToken = rt0.endToken.next;
                    else 
                        dr.addSlot("@EXCLUDE", "true", true, 0);
                    kit.embedToken(rt0);
                    t = rt0;
                    continue;
                }
            }
            else if (((str === "ПОСЛЕ" || str === "AFTER")) && (t.next instanceof ReferentToken) && (t.next.getReferent() instanceof DateReferent)) {
                let dr = DateRangeReferent._new1078(Utils.as(t.next.getReferent(), DateReferent));
                let rt0 = new ReferentToken(ad.registerReferent(dr), t, t.next);
                if (rt0.endToken.next !== null && rt0.endToken.next.isValue("ВКЛЮЧИТЕЛЬНО", null)) 
                    rt0.endToken = rt0.endToken.next;
                else 
                    dr.addSlot("@EXCLUDE", "true", true, 0);
                kit.embedToken(rt0);
                t = rt0;
                continue;
            }
            else 
                continue;
            if (t0 === null) 
                continue;
            if (t0 instanceof ReferentToken) 
                date1 = Utils.as(t0.referent, DateReferent);
            if (date1 === null) {
                if ((t0 instanceof NumberToken) && t0.intValue !== null) {
                    let v = t0.intValue;
                    if ((v < 1000) || v >= 2100) 
                        continue;
                    yearVal1 = v;
                }
                else 
                    continue;
            }
            else 
                yearVal1 = date1.year;
            let t1 = t0.next;
            if (t1 === null) 
                continue;
            if (t1.isValue("ПО", "ДО") || t1.isValue("ДО", null)) 
                lang = t1.morph.language;
            else if (t1.isValue("AND", null)) 
                lang = MorphLang.EN;
            else if (t1.isHiphen && lang.equals(MorphLang.EN)) {
            }
            else if (lang.isUa && t1.isValue("І", null)) {
            }
            else if (t1.isAnd && isBetwen) {
            }
            else 
                continue;
            t1 = t1.next;
            if (t1 === null) 
                continue;
            if (t1 instanceof ReferentToken) 
                date2 = Utils.as(t1.referent, DateReferent);
            if (date2 === null) {
                if ((t1 instanceof NumberToken) && t1.intValue !== null) {
                    let nt1 = NumberHelper.tryParseNumberWithPostfix(t1);
                    if (nt1 !== null) 
                        continue;
                    let v = t1.intValue;
                    if (v > 0 && (v < yearVal1)) {
                        let yy = yearVal1 % 100;
                        if (yy < v) 
                            v += (((Utils.intDiv(yearVal1, 100))) * 100);
                    }
                    if ((v < 1000) || v >= 2100) 
                        continue;
                    yearVal2 = v;
                }
                else 
                    continue;
            }
            else 
                yearVal2 = date2.year;
            if (yearVal1 > yearVal2 && yearVal2 > 0) 
                continue;
            if (yearVal1 === yearVal2) {
                if (date1 === null || date2 === null) 
                    continue;
                if (DateReferent.compare(date1, date2) >= 0) 
                    continue;
            }
            if (date1 === null) {
                date1 = Utils.as(ad.registerReferent(DateReferent._new1074(yearVal1)), DateReferent);
                let rt0 = new ReferentToken(date1, t0, t0);
                kit.embedToken(rt0);
                if (t0 === t) 
                    t = rt0;
            }
            if (date2 === null) {
                date2 = Utils.as(ad.registerReferent(DateReferent._new1074(yearVal2)), DateReferent);
                let rt1 = new ReferentToken(date2, t1, t1);
                kit.embedToken(rt1);
                t1 = rt1;
            }
            let rt = new ReferentToken(ad.registerReferent(DateRangeReferent._new1071(date1, date2)), t, t1);
            if (t.previous !== null) {
                if (t.previous.isValue("ПРОМЕЖУТОК", "ПРОМІЖОК") || t.previous.isValue("ДИАПАЗОН", "ДІАПАЗОН") || t.previous.isValue("ПЕРИОД", "ПЕРІОД")) 
                    rt.beginToken = t.previous;
            }
            kit.embedToken(rt);
            t = rt;
        }
    }
    
    static isUserParamDate(t) {
        if (t === null) 
            return false;
        if (t.kit.sofa.userParams !== null) {
            if (t.kit.sofa.userParams.includes("DATE")) 
                return true;
        }
        return false;
    }
    
    static isUserParamIgnoreTime(t) {
        if (t === null) 
            return false;
        if (t.kit.sofa.userParams !== null) {
            if (t.kit.sofa.userParams.includes("IGNORETIME")) 
                return true;
        }
        return false;
    }
    
    static initialize() {
        const DateItemToken = require("./internal/DateItemToken");
        const MeasureAnalyzer = require("./../measure/MeasureAnalyzer");
        /* this is synchronized block by DateAnalyzer.m_Lock, but this feature isn't supported in JS */ {
            if (DateAnalyzer.m_Inited) 
                return;
            DateAnalyzer.m_Inited = true;
            MeasureAnalyzer.initialize();
            MetaDate.initialize();
            MetaDateRange.initialize();
            try {
                Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
                DateItemToken.initialize();
                Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
            } catch (ex) {
                throw new Error(ex.message);
            }
            ProcessorService.registerAnalyzer(new DateAnalyzer());
        }
        MeasureAnalyzer.initialize();
    }
    
    static static_constructor() {
        DateAnalyzer.ANALYZER_NAME = "DATE";
        DateAnalyzer.m_Lock = new Object();
        DateAnalyzer.m_Inited = false;
    }
}


DateAnalyzer.static_constructor();

module.exports = DateAnalyzer