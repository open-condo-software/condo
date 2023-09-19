/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const NumberSpellingType = require("./../NumberSpellingType");
const Token = require("./../Token");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const TextToken = require("./../TextToken");
const MorphLang = require("./../../morph/MorphLang");
const ProcessorService = require("./../ProcessorService");
const BracketParseAttr = require("./../core/BracketParseAttr");
const GetTextAttr = require("./../core/GetTextAttr");
const MetaToken = require("./../MetaToken");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const Analyzer = require("./../Analyzer");
const MetaUri = require("./internal/MetaUri");
const ReferentToken = require("./../ReferentToken");
const UriReferent = require("./UriReferent");
const NumberToken = require("./../NumberToken");
const MiscHelper = require("./../core/MiscHelper");
const Referent = require("./../Referent");
const BracketHelper = require("./../core/BracketHelper");
const TerminParseAttr = require("./../core/TerminParseAttr");
const Termin = require("./../core/Termin");
const TerminCollection = require("./../core/TerminCollection");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const UriItemToken = require("./internal/UriItemToken");

/**
 * Анализатор для выделения URI-объектов (схема:значение)
 */
class UriAnalyzer extends Analyzer {
    
    get name() {
        return UriAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "URI";
    }
    
    get description() {
        return "URI (URL, EMail), ISBN, УДК, ББК ...";
    }
    
    clone() {
        return new UriAnalyzer();
    }
    
    get progressWeight() {
        return 2;
    }
    
    get typeSystem() {
        return [MetaUri.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaUri.MAIL_IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("email.png"));
        res.put(MetaUri.URI_IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("uri.png"));
        return res;
    }
    
    get usedExternObjectTypes() {
        return ["PHONE"];
    }
    
    createReferent(type) {
        if (type === UriReferent.OBJ_TYPENAME) 
            return new UriReferent();
        return null;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let tt = t;
            let i = 0;
            let tok = UriAnalyzer.m_Schemes.tryParse(t, TerminParseAttr.NO);
            if (tok !== null) {
                i = tok.termin.tag;
                tt = tok.endToken;
                if (tt.next !== null && tt.next.isChar('(')) {
                    let tok1 = UriAnalyzer.m_Schemes.tryParse(tt.next.next, TerminParseAttr.NO);
                    if ((tok1 !== null && tok1.termin.canonicText === tok.termin.canonicText && tok1.endToken.next !== null) && tok1.endToken.next.isChar(')')) 
                        tt = tok1.endToken.next;
                }
                if (i === 0) {
                    if ((tt.next === null || ((!tt.next.isCharOf(":|") && !tt.isTableControlChar)) || tt.next.isWhitespaceBefore) || tt.next.whitespacesAfterCount > 2) 
                        continue;
                    let t1 = tt.next.next;
                    while (t1 !== null && t1.isCharOf("/\\")) {
                        t1 = t1.next;
                    }
                    if (t1 === null || t1.whitespacesBeforeCount > 2) 
                        continue;
                    let ut = UriItemToken.attachUriContent(t1, false);
                    if (ut === null) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2798(tok.termin.canonicText.toLowerCase(), ut.value)), UriReferent);
                    let rt = new ReferentToken(ad.registerReferent(ur), t, ut.endToken);
                    rt.beginToken = Utils.notNull(UriAnalyzer._siteBefore(t.previous), t);
                    if (rt.endToken.next !== null && rt.endToken.next.isCharOf("/\\")) 
                        rt.endToken = rt.endToken.next;
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                if (i === 10) {
                    tt = tt.next;
                    if (tt === null || !tt.isChar(':')) 
                        continue;
                    for (tt = tt.next; tt !== null; tt = tt.next) {
                        if (tt.isCharOf("/\\")) {
                        }
                        else 
                            break;
                    }
                    if (tt === null) 
                        continue;
                    if (tt.isValue("WWW", null) && tt.next !== null && tt.next.isChar('.')) 
                        tt = tt.next.next;
                    if (tt === null || tt.isNewlineBefore) 
                        continue;
                    let ut = UriItemToken.attachUriContent(tt, true);
                    if (ut === null) 
                        continue;
                    if (ut.value.length < 4) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2798(tok.termin.canonicText.toLowerCase(), ut.value)), UriReferent);
                    let rt = new ReferentToken(ad.registerReferent(ur), t, ut.endToken);
                    rt.beginToken = Utils.notNull(UriAnalyzer._siteBefore(t.previous), t);
                    if (rt.endToken.next !== null && rt.endToken.next.isCharOf("/\\")) 
                        rt.endToken = rt.endToken.next;
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                if (i === 2) {
                    if (tt.next === null || !tt.next.isChar('.') || tt.next.isWhitespaceBefore) 
                        continue;
                    if (tt.next.isWhitespaceAfter && tok.termin.canonicText !== "WWW") 
                        continue;
                    let ut = UriItemToken.attachUriContent(tt.next.next, true);
                    if (ut === null) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2798("http", ut.value)), UriReferent);
                    let rt = new ReferentToken(ur, t, ut.endToken);
                    rt.beginToken = Utils.notNull(UriAnalyzer._siteBefore(t.previous), t);
                    if (rt.endToken.next !== null && rt.endToken.next.isCharOf("/\\")) 
                        rt.endToken = rt.endToken.next;
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                if (i === 1) {
                    let sch = tok.termin.canonicText;
                    let ut = null;
                    if (sch === "ISBN") {
                        ut = UriItemToken.attachISBN(tt.next);
                        if ((ut === null && t.previous !== null && t.previous.isChar('(')) && t.next !== null && t.next.isChar(')')) {
                            for (let tt0 = t.previous.previous; tt0 !== null; tt0 = tt0.previous) {
                                if (tt0.whitespacesAfterCount > 2) 
                                    break;
                                if (tt0.isWhitespaceBefore) {
                                    ut = UriItemToken.attachISBN(tt0);
                                    if (ut !== null && ut.endToken.next !== t.previous) 
                                        ut = null;
                                    break;
                                }
                            }
                        }
                    }
                    else if ((sch === "RFC" || sch === "ISO" || sch === "ОКФС") || sch === "ОКОПФ") 
                        ut = UriItemToken.attachISOContent(tt.next, ":");
                    else if (sch === "ГОСТ") 
                        ut = UriItemToken.attachISOContent(tt.next, "-.");
                    else if (sch === "ТУ") {
                        if (tok.chars.isAllUpper) {
                            ut = UriItemToken.attachISOContent(tt.next, "-.");
                            if (ut !== null && (ut.lengthChar < 10)) 
                                ut = null;
                        }
                    }
                    else 
                        ut = UriItemToken.attachBBK(tt.next);
                    if (ut === null) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2801(ut.value, sch)), UriReferent);
                    let rt = null;
                    if (ut.beginChar < t.beginChar) {
                        rt = new ReferentToken(ur, ut.beginToken, t);
                        if (t.next !== null && t.next.isChar(')')) 
                            rt.endToken = t.next;
                    }
                    else 
                        rt = new ReferentToken(ur, t, ut.endToken);
                    if (t.previous !== null && t.previous.isValue("КОД", null)) 
                        rt.beginToken = t.previous;
                    if (ur.scheme.startsWith("ОК")) 
                        UriAnalyzer._checkDetail(rt);
                    kit.embedToken(rt);
                    t = rt;
                    if (ur.scheme.startsWith("ОК")) {
                        while (t.next !== null) {
                            if (t.next.isCommaAnd && (t.next.next instanceof NumberToken)) {
                            }
                            else 
                                break;
                            ut = UriItemToken.attachBBK(t.next.next);
                            if (ut === null) 
                                break;
                            ur = Utils.as(ad.registerReferent(UriReferent._new2801(ut.value, sch)), UriReferent);
                            rt = new ReferentToken(ur, t.next.next, ut.endToken);
                            UriAnalyzer._checkDetail(rt);
                            kit.embedToken(rt);
                            t = rt;
                        }
                    }
                    continue;
                }
                if (i === 3) {
                    let t0 = tt.next;
                    while (t0 !== null) {
                        if (t0.isCharOf(":|") || t0.isTableControlChar || t0.isHiphen) 
                            t0 = t0.next;
                        else 
                            break;
                    }
                    if (t0 === null) 
                        continue;
                    let ut = UriItemToken.attachSkype(t0);
                    if (ut === null) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2801(ut.value.toLowerCase(), (tok.termin.canonicText === "SKYPE" ? "skype" : tok.termin.canonicText))), UriReferent);
                    let rt = new ReferentToken(ur, t, ut.endToken);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                if (i === 4) {
                    let t0 = tt.next;
                    if (t0 !== null && ((t0.isChar(':') || t0.isHiphen))) 
                        t0 = t0.next;
                    if (t0 === null) 
                        continue;
                    let ut = UriItemToken.attachIcqContent(t0);
                    if (ut === null) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2801(ut.value, "ICQ")), UriReferent);
                    let rt = new ReferentToken(ur, t, t0);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                if (i === 5 || i === 6) {
                    let t0 = tt.next;
                    let hasTabCel = false;
                    let isIban = false;
                    for (; t0 !== null; t0 = t0.next) {
                        if ((((t0.isValue("БАНК", null) || t0.morph._class.isPreposition || t0.isHiphen) || t0.isCharOf(".:") || t0.isValue("РУБЛЬ", null)) || t0.isValue("РУБ", null) || t0.isValue("ДОЛЛАР", null)) || t0.isValue("№", null) || t0.isValue("N", null)) {
                        }
                        else if (t0.isTableControlChar) 
                            hasTabCel = true;
                        else if (t0.isCharOf("\\/") && t0.next !== null && t0.next.isValue("IBAN", null)) {
                            isIban = true;
                            t0 = t0.next;
                        }
                        else if (t0.isValue("IBAN", null)) 
                            isIban = true;
                        else if (t0 instanceof TextToken) {
                            let npt = NounPhraseHelper.tryParse(t0, NounPhraseParseAttr.NO, 0, null);
                            if (npt !== null && npt.morph._case.isGenitive) {
                                t0 = npt.endToken;
                                continue;
                            }
                            break;
                        }
                        else 
                            break;
                    }
                    if (t0 === null) 
                        continue;
                    let ur2 = null;
                    let ur2Begin = null;
                    let ur2End = null;
                    let t00 = t0;
                    let val = t0.getSourceText();
                    if (val.indexOf('(') > 0) 
                        continue;
                    if (Utils.isDigit(val[0]) && ((((i === 6 || tok.termin.canonicText === "ИНН" || tok.termin.canonicText === "БИК") || tok.termin.canonicText === "ОГРН" || tok.termin.canonicText === "СНИЛС") || tok.termin.canonicText === "ОКПО"))) {
                        if (t0.chars.isLetter) 
                            continue;
                        if (Utils.isNullOrEmpty(val) || !Utils.isDigit(val[0])) 
                            continue;
                        if (t0.lengthChar < 9) {
                            let tmp = new StringBuilder();
                            tmp.append(val);
                            for (let ttt = t0.next; ttt !== null; ttt = ttt.next) {
                                if (ttt.whitespacesBeforeCount > 1) 
                                    break;
                                if (ttt instanceof NumberToken) {
                                    tmp.append(ttt.getSourceText());
                                    t0 = ttt;
                                    continue;
                                }
                                if (ttt.isHiphen || ttt.isChar('.')) {
                                    if (ttt.next === null || !(ttt.next instanceof NumberToken)) 
                                        break;
                                    if (ttt.isWhitespaceAfter || ttt.isWhitespaceBefore) 
                                        break;
                                    continue;
                                }
                                break;
                            }
                            val = null;
                            if (tmp.length === 20) 
                                val = tmp.toString();
                            else if (tmp.length === 9 && tok.termin.canonicText === "БИК") 
                                val = tmp.toString();
                            else if (((tmp.length === 10 || tmp.length === 12)) && tok.termin.canonicText === "ИНН") 
                                val = tmp.toString();
                            else if (tmp.length >= 15 && tok.termin.canonicText === "Л/С") 
                                val = tmp.toString();
                            else if (tmp.length >= 11 && ((tok.termin.canonicText === "ОГРН" || tok.termin.canonicText === "СНИЛС"))) 
                                val = tmp.toString();
                            else if (tok.termin.canonicText === "ОКПО") 
                                val = tmp.toString();
                        }
                        if (val === null) 
                            continue;
                    }
                    else if (!(t0 instanceof NumberToken)) {
                        if ((t0 instanceof TextToken) && isIban) {
                            let tmp1 = new StringBuilder();
                            let t1 = null;
                            for (let ttt = t0; ttt !== null; ttt = ttt.next) {
                                if (ttt.isNewlineBefore && ttt !== t0) 
                                    break;
                                if (ttt.isHiphen) 
                                    continue;
                                if (!(ttt instanceof NumberToken)) {
                                    if (!(ttt instanceof TextToken) || !ttt.chars.isLatinLetter) 
                                        break;
                                }
                                tmp1.append(ttt.getSourceText());
                                t1 = ttt;
                                if (tmp1.length >= 34) 
                                    break;
                            }
                            if (tmp1.length < 10) 
                                continue;
                            let ur1 = UriReferent._new2801(tmp1.toString(), tok.termin.canonicText);
                            ur1.addSlot(UriReferent.ATTR_DETAIL, "IBAN", false, 0);
                            let rt1 = new ReferentToken(ad.registerReferent(ur1), t, t1);
                            kit.embedToken(rt1);
                            t = rt1;
                            continue;
                        }
                        if (!t0.isCharOf("/\\") || t0.next === null) 
                            continue;
                        let tok2 = UriAnalyzer.m_Schemes.tryParse(t0.next, TerminParseAttr.NO);
                        if (tok2 === null || !((typeof tok2.termin.tag === 'number' || tok2.termin.tag instanceof Number)) || (tok2.termin.tag) !== i) 
                            continue;
                        t0 = tok2.endToken.next;
                        while (t0 !== null) {
                            if (t0.isCharOf(":N№")) 
                                t0 = t0.next;
                            else if (t0.isTableControlChar) {
                                t0 = t0.next;
                                t00 = t0;
                                hasTabCel = true;
                            }
                            else 
                                break;
                        }
                        if (!(t0 instanceof NumberToken)) 
                            continue;
                        let tmp = new StringBuilder();
                        for (; t0 !== null; t0 = t0.next) {
                            if (!(t0 instanceof NumberToken)) 
                                break;
                            tmp.append(t0.getSourceText());
                        }
                        if (t0 === null || !t0.isCharOf("/\\,") || !(t0.next instanceof NumberToken)) 
                            continue;
                        val = tmp.toString();
                        tmp.length = 0;
                        ur2Begin = t0.next;
                        for (t0 = t0.next; t0 !== null; t0 = t0.next) {
                            if (!(t0 instanceof NumberToken)) 
                                break;
                            if (t0.whitespacesBeforeCount > 4 && tmp.length > 0) 
                                break;
                            tmp.append(t0.getSourceText());
                            ur2End = t0;
                        }
                        ur2 = Utils.as(ad.registerReferent(UriReferent._new2798(tok2.termin.canonicText, tmp.toString())), UriReferent);
                    }
                    if (val.length < 5) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2801(val, tok.termin.canonicText)), UriReferent);
                    let rt = new ReferentToken(ur, t, (ur2Begin === null ? t0 : ur2Begin.previous));
                    if (hasTabCel) 
                        rt.beginToken = t00;
                    if (ur.scheme.startsWith("ОК")) 
                        UriAnalyzer._checkDetail(rt);
                    for (let ttt = t.previous; ttt !== null; ttt = ttt.previous) {
                        if (ttt.isTableControlChar) 
                            break;
                        if (ttt.morph._class.isPreposition) 
                            continue;
                        if (ttt.isValue("ОРГАНИЗАЦИЯ", null)) 
                            continue;
                        if (ttt.isValue("НОМЕР", null) || ttt.isValue("КОД", null)) 
                            t = rt.beginToken = ttt;
                        break;
                    }
                    kit.embedToken(rt);
                    t = rt;
                    if (ur2 !== null) {
                        let rt2 = new ReferentToken(ur2, ur2Begin, ur2End);
                        kit.embedToken(rt2);
                        t = rt2;
                    }
                    while ((t.next !== null && t.next.isCommaAnd && (t.next.next instanceof NumberToken)) && t.next.next.lengthChar === val.length && t.next.next.typ === NumberSpellingType.DIGIT) {
                        let val2 = t.next.next.getSourceText();
                        ur2 = new UriReferent();
                        ur2.scheme = ur.scheme;
                        ur2.value = val2;
                        ur2 = Utils.as(ad.registerReferent(ur2), UriReferent);
                        let rt2 = new ReferentToken(ur2, t.next, t.next.next);
                        kit.embedToken(rt2);
                        t = rt2;
                    }
                    continue;
                }
                if (i === 7) {
                    let t0 = tt.next;
                    while (t0 !== null) {
                        if (t0.isCharOf(":|") || t0.isTableControlChar || t0.isHiphen) 
                            t0 = t0.next;
                        else 
                            break;
                    }
                    if (t0 === null) 
                        continue;
                    let rt = UriAnalyzer._TryAttachKadastr(t0);
                    if (rt === null) 
                        continue;
                    rt.referent = ad.registerReferent(rt.referent);
                    rt.beginToken = t;
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
                continue;
            }
            if (t.isChar('@')) {
                let u1s = UriItemToken.attachMailUsers(t.previous);
                if (u1s === null) 
                    continue;
                let u2 = UriItemToken.attachDomainName(t.next, false, true);
                if (u2 === null) 
                    continue;
                for (let ii = u1s.length - 1; ii >= 0; ii--) {
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2801((u1s[ii].value + "@" + u2.value).toLowerCase(), "mailto")), UriReferent);
                    let b = u1s[ii].beginToken;
                    let t0 = b.previous;
                    if (t0 !== null && t0.isChar(':')) 
                        t0 = t0.previous;
                    if (t0 !== null && ii === 0) {
                        let br = false;
                        for (let ttt = t0; ttt !== null; ttt = ttt.previous) {
                            if (!(ttt instanceof TextToken)) 
                                break;
                            if (ttt !== t0 && ttt.whitespacesAfterCount > 1) 
                                break;
                            if (ttt.isChar(')')) {
                                br = true;
                                continue;
                            }
                            if (ttt.isChar('(')) {
                                if (!br) 
                                    break;
                                br = false;
                                continue;
                            }
                            if (ttt.isValue("EMAIL", null) || ttt.isValue("MAILTO", null)) {
                                b = ttt;
                                break;
                            }
                            if (ttt.isValue("MAIL", null)) {
                                b = ttt;
                                if ((ttt.previous !== null && ttt.previous.isHiphen && ttt.previous.previous !== null) && ((ttt.previous.previous.isValue("E", null) || ttt.previous.previous.isValue("Е", null)))) 
                                    b = ttt.previous.previous;
                                break;
                            }
                            if (ttt.isValue("ПОЧТА", null) || ttt.isValue("АДРЕС", null)) {
                                b = t0;
                                ttt = ttt.previous;
                                if (ttt !== null && ttt.isChar('.')) 
                                    ttt = ttt.previous;
                                if (ttt !== null && ((t0.isValue("ЭЛ", null) || ttt.isValue("ЭЛЕКТРОННЫЙ", null)))) 
                                    b = ttt;
                                if (b.previous !== null && b.previous.isValue("АДРЕС", null)) 
                                    b = b.previous;
                                break;
                            }
                            if (ttt.morph._class.isPreposition) 
                                continue;
                            if (!ttt.chars.isAllLower) 
                                break;
                        }
                    }
                    let rt = new ReferentToken(ur, b, (ii === (u1s.length - 1) ? u2.endToken : u1s[ii].endToken));
                    kit.embedToken(rt);
                    t = rt;
                }
                continue;
            }
            if (!t.chars.isCyrillicLetter) {
                if (t.isWhitespaceBefore || ((t.previous !== null && t.previous.isCharOf(",(")))) {
                    let u1 = UriItemToken.attachUrl(t);
                    if (u1 !== null) {
                        if (u1.isWhitespaceAfter || u1.endToken.next === null || !u1.endToken.next.isChar('@')) {
                            if (u1.endToken.next !== null && u1.endToken.next.isCharOf("\\/")) {
                                let u2 = UriItemToken.attachUriContent(t, false);
                                if (u2 !== null) 
                                    u1 = u2;
                            }
                            let ur = Utils.as(ad.registerReferent(UriReferent._new2798("http", u1.value)), UriReferent);
                            let rt = new ReferentToken(ur, u1.beginToken, u1.endToken);
                            rt.beginToken = Utils.notNull(UriAnalyzer._siteBefore(u1.beginToken.previous), u1.beginToken);
                            kit.embedToken(rt);
                            t = rt;
                            continue;
                        }
                    }
                }
            }
            if ((t instanceof TextToken) && !t.isWhitespaceAfter && t.lengthChar > 2) {
                if (UriAnalyzer._siteBefore(t.previous) !== null) {
                    let ut = UriItemToken.attachUriContent(t, true);
                    if (ut === null || ut.value.indexOf('.') <= 0 || ut.value.indexOf('@') > 0) 
                        continue;
                    let ur = Utils.as(ad.registerReferent(UriReferent._new2798("http", ut.value)), UriReferent);
                    let rt = new ReferentToken(ur, t, ut.endToken);
                    rt.beginToken = UriAnalyzer._siteBefore(t.previous);
                    if (rt.endToken.next !== null && rt.endToken.next.isCharOf("/\\")) 
                        rt.endToken = rt.endToken.next;
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            if ((t.chars.isLatinLetter && !t.chars.isAllLower && t.next !== null) && !t.isWhitespaceAfter) {
                if (t.next.isChar('/')) {
                    let rt = UriAnalyzer._TryAttachLotus(Utils.as(t, TextToken));
                    if (rt !== null) {
                        rt.referent = ad.registerReferent(rt.referent);
                        kit.embedToken(rt);
                        t = rt;
                        continue;
                    }
                }
            }
            if (((((t instanceof NumberToken) && t.typ === NumberSpellingType.DIGIT && (t.lengthChar < 3)) && t.next !== null && t.next.isChar(':')) && !t.isWhitespaceAfter && !t.next.isWhitespaceAfter) && (t.next.next instanceof NumberToken)) {
                let rt = UriAnalyzer._TryAttachKadastr(t);
                if (rt !== null) {
                    rt.referent = ad.registerReferent(rt.referent);
                    kit.embedToken(rt);
                    t = rt;
                    continue;
                }
            }
            if (t.isValue("КАДАСТРОВЫЙ", null)) {
                tt = t.next;
                if ((tt !== null && tt.isChar('(') && tt.next !== null) && tt.next.next !== null && tt.next.next.isChar(')')) 
                    tt = tt.next.next.next;
                let t1 = MiscHelper.checkNumberPrefix(tt);
                if (t1 !== null) {
                    if (t1.isHiphen || t1.isTableControlChar) 
                        t1 = t1.next;
                    let rt = UriAnalyzer._TryAttachKadastr(t1);
                    if (rt !== null) {
                        rt.referent = ad.registerReferent(rt.referent);
                        rt.beginToken = t;
                        kit.embedToken(rt);
                        t = rt;
                        continue;
                    }
                }
            }
        }
    }
    
    static _checkDetail(rt) {
        if (rt.endToken.whitespacesAfterCount > 2 || rt.endToken.next === null) 
            return;
        if (rt.endToken.next.isChar('(')) {
            let br = BracketHelper.tryParse(rt.endToken.next, BracketParseAttr.NO, 100);
            if (br !== null) {
                rt.referent.detail = MiscHelper.getTextValue(br.beginToken.next, br.endToken.previous, GetTextAttr.NO);
                rt.endToken = br.endToken;
            }
        }
    }
    
    static _siteBefore(t) {
        if (t !== null && t.isChar(':')) 
            t = t.previous;
        if (t === null) 
            return null;
        if ((t.isValue("ВЕБСАЙТ", null) || t.isValue("WEBSITE", null) || t.isValue("WEB", null)) || t.isValue("WWW", null)) 
            return t;
        let t0 = null;
        if (t.isValue("САЙТ", null) || t.isValue("SITE", null)) {
            t0 = t;
            t = t.previous;
        }
        else if (t.isValue("АДРЕС", null)) {
            t0 = t.previous;
            if (t0 !== null && t0.isChar('.')) 
                t0 = t0.previous;
            if (t0 !== null) {
                if (t0.isValue("ЭЛ", null) || t0.isValue("ЭЛЕКТРОННЫЙ", null)) 
                    return t0;
            }
            return null;
        }
        else 
            return null;
        if (t !== null && t.isHiphen) 
            t = t.previous;
        if (t === null) 
            return t0;
        if (t.isValue("WEB", null) || t.isValue("ВЕБ", null)) 
            t0 = t;
        if (t0.previous !== null && t0.previous.morph._class.isAdjective && (t0.whitespacesBeforeCount < 3)) {
            let npt = NounPhraseHelper.tryParse(t0.previous, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) 
                t0 = npt.beginToken;
        }
        return t0;
    }
    
    static _TryAttachKadastr(t) {
        if (!(t instanceof NumberToken) || t.lengthChar > 2) 
            return null;
        if (t.isWhitespaceBefore) {
        }
        else if (t.previous !== null && t.previous.isComma) {
        }
        else 
            return null;
        let vals = new Array();
        let rt = new ReferentToken(null, t, t);
        for (; t !== null; t = t.next) {
            let num = Utils.as(t, NumberToken);
            if (num === null || num.typ !== NumberSpellingType.DIGIT || num.intValue === null) 
                break;
            vals.push(num.value);
            rt.endToken = t;
            if ((t.next !== null && t.next.isChar(':') && (t.next.next instanceof NumberToken)) && !t.isWhitespaceAfter && !t.next.isWhitespaceAfter) {
                t = t.next;
                continue;
            }
            break;
        }
        if (vals.length !== 4) 
            return null;
        let _uri = new UriReferent();
        _uri.value = (vals[0] + ":" + vals[1] + ":" + vals[2] + ":" + vals[3]);
        _uri.scheme = "КАДАСТР";
        rt.referent = _uri;
        for (let tt = rt.beginToken.previous; tt !== null; tt = tt.previous) {
            if (tt.isHiphen || tt.isCharOf(":.")) 
                continue;
            if (!(tt instanceof TextToken)) 
                break;
            let term = tt.term;
            if (term === "КН" || term.startsWith("КАД") || term.startsWith("АКТУАЛ")) {
                rt.beginToken = tt;
                continue;
            }
            break;
        }
        return rt;
    }
    
    static _TryAttachLotus(t) {
        if (t === null || t.next === null) 
            return null;
        let t1 = t.next.next;
        let tails = null;
        for (let tt = t1; tt !== null; tt = tt.next) {
            if (tt.isWhitespaceBefore) {
                if (!tt.isNewlineBefore) 
                    break;
                if (tails === null || (tails.length < 2)) 
                    break;
            }
            if (!tt.isLetters || tt.chars.isAllLower) 
                return null;
            if (!(tt instanceof TextToken)) 
                return null;
            if (tails === null) 
                tails = new Array();
            tails.push(tt.term);
            t1 = tt;
            if (tt.isWhitespaceAfter || tt.next === null) 
                break;
            tt = tt.next;
            if (!tt.isChar('/')) 
                break;
        }
        if (tails === null || (tails.length < 3)) 
            return null;
        let heads = new Array();
        heads.push(t.term);
        let t0 = t;
        let ok = true;
        for (let k = 0; k < 2; k++) {
            if (!(t0.previous instanceof TextToken)) 
                break;
            if (t0.whitespacesBeforeCount !== 1) {
                if (!t0.isNewlineBefore || k > 0) 
                    break;
            }
            if (!t0.isWhitespaceBefore && t0.previous.isChar('/')) 
                break;
            if (t0.previous.chars.equals(t.chars)) {
                t0 = t0.previous;
                heads.splice(0, 0, t0.term);
                ok = true;
                continue;
            }
            if ((t0.previous.chars.isLatinLetter && t0.previous.chars.isAllUpper && t0.previous.lengthChar === 1) && k === 0) {
                t0 = t0.previous;
                heads.splice(0, 0, t0.term);
                ok = false;
                continue;
            }
            break;
        }
        if (!ok) 
            heads.splice(0, 1);
        let tmp = new StringBuilder();
        for (let i = 0; i < heads.length; i++) {
            if (i > 0) 
                tmp.append(' ');
            tmp.append(MiscHelper.convertFirstCharUpperAndOtherLower(heads[i]));
        }
        for (const tail of tails) {
            tmp.append("/").append(tail);
        }
        if (((t1.next !== null && t1.next.isChar('@') && t1.next.next !== null) && t1.next.next.chars.isLatinLetter && !t1.next.isWhitespaceAfter) && !t1.isWhitespaceAfter) 
            t1 = t1.next.next;
        let _uri = UriReferent._new2798("lotus", tmp.toString());
        return new ReferentToken(_uri, t0, t1);
    }
    
    static initialize() {
        if (UriAnalyzer.m_Schemes !== null) 
            return;
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        MetaUri.initialize();
        try {
            UriAnalyzer.m_Schemes = new TerminCollection();
            let obj = PullentiNerBankInternalResourceHelper.getString("UriSchemes.csv");
            if (obj === null) 
                throw new Error(("Can't file resource file " + "UriSchemes.csv" + " in Organization analyzer"));
            for (const line0 of Utils.splitString(obj, '\n', false)) {
                let line = line0.trim();
                if (Utils.isNullOrEmpty(line)) 
                    continue;
                UriAnalyzer.m_Schemes.add(Termin._new850(line, MorphLang.UNKNOWN, true, 0));
            }
            for (const s of ["ISBN", "УДК", "ББК", "ТНВЭД", "ОКВЭД"]) {
                UriAnalyzer.m_Schemes.add(Termin._new850(s, MorphLang.UNKNOWN, true, 1));
            }
            UriAnalyzer.m_Schemes.add(Termin._new2814("Общероссийский классификатор форм собственности", "ОКФС", 1, "ОКФС"));
            UriAnalyzer.m_Schemes.add(Termin._new2814("Общероссийский классификатор организационно правовых форм", "ОКОПФ", 1, "ОКОПФ"));
            let t = null;
            UriAnalyzer.m_Schemes.add(Termin._new850("WWW", MorphLang.UNKNOWN, true, 2));
            UriAnalyzer.m_Schemes.add(Termin._new850("HTTP", MorphLang.UNKNOWN, true, 10));
            UriAnalyzer.m_Schemes.add(Termin._new850("HTTPS", MorphLang.UNKNOWN, true, 10));
            UriAnalyzer.m_Schemes.add(Termin._new850("SHTTP", MorphLang.UNKNOWN, true, 10));
            UriAnalyzer.m_Schemes.add(Termin._new850("FTP", MorphLang.UNKNOWN, true, 10));
            t = Termin._new850("SKYPE", MorphLang.UNKNOWN, true, 3);
            t.addVariant("СКАЙП", true);
            t.addVariant("SKYPEID", true);
            t.addVariant("SKYPE ID", true);
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new850("SWIFT", MorphLang.UNKNOWN, true, 3);
            t.addVariant("СВИФТ", true);
            UriAnalyzer.m_Schemes.add(t);
            UriAnalyzer.m_Schemes.add(Termin._new850("ICQ", MorphLang.UNKNOWN, true, 4));
            UriAnalyzer.m_Schemes.add(Termin._new2824("International Mobile Equipment Identity", "IMEI", 5, "IMEI", true));
            t = Termin._new2824("основной государственный регистрационный номер", "ОГРН", 5, "ОГРН", true);
            t.addVariant("ОГРН ИП", true);
            t.addVariant("ОГРНИП", false);
            UriAnalyzer.m_Schemes.add(t);
            UriAnalyzer.m_Schemes.add(Termin._new2824("Индивидуальный идентификационный номер", "ИИН", 5, "ИИН", true));
            t = Termin._new2824("Индивидуальный номер налогоплательщика", "ИНН", 5, "ИНН", true);
            t.addVariant("Идентификационный номер налогоплательщика", false);
            UriAnalyzer.m_Schemes.add(t);
            UriAnalyzer.m_Schemes.add(Termin._new2824("Код причины постановки на учет", "КПП", 5, "КПП", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("Банковский идентификационный код", "БИК", 5, "БИК", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("основной государственный регистрационный номер индивидуального предпринимателя", "ОГРНИП", 5, "ОГРНИП", true));
            t = Termin._new2824("Страховой номер индивидуального лицевого счёта", "СНИЛС", 5, "СНИЛС", true);
            t.addVariant("Свидетельство пенсионного страхования", false);
            t.addVariant("Страховое свидетельство обязательного пенсионного страхования", false);
            t.addVariant("Страховое свидетельство", false);
            UriAnalyzer.m_Schemes.add(t);
            UriAnalyzer.m_Schemes.add(Termin._new2824("Общероссийский классификатор предприятий и организаций", "ОКПО", 5, "ОКПО", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("Общероссийский классификатор объектов административно-территориального деления", "ОКАТО", 5, "ОКАТО", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("Общероссийский классификатор территорий муниципальных образований", "ОКТМО", 5, "ОКТМО", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("Общероссийский классификатор органов государственной власти и управления", "ОКОГУ", 5, "ОКОГУ", true));
            UriAnalyzer.m_Schemes.add(Termin._new2824("Общероссийский классификатор Отрасли народного хозяйства", "ОКОНХ", 5, "ОКОНХ", true));
            t = Termin._new2837("РАСЧЕТНЫЙ СЧЕТ", MorphLang.UNKNOWN, true, "Р/С", 6, 20);
            t.addAbridge("Р.С.");
            t.addAbridge("Р.СЧ.");
            t.addAbridge("P.C.");
            t.addAbridge("РАСЧ.СЧЕТ");
            t.addAbridge("РАС.СЧЕТ");
            t.addAbridge("РАСЧ.СЧ.");
            t.addAbridge("РАС.СЧ.");
            t.addAbridge("Р.СЧЕТ");
            t.addVariant("СЧЕТ ПОЛУЧАТЕЛЯ", false);
            t.addVariant("СЧЕТ ОТПРАВИТЕЛЯ", false);
            t.addVariant("СЧЕТ", false);
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new2838("ЛИЦЕВОЙ СЧЕТ", "Л/С", 6, 20);
            t.addAbridge("Л.С.");
            t.addAbridge("Л.СЧ.");
            t.addAbridge("Л/С");
            t.addAbridge("ЛИЦ.СЧЕТ");
            t.addAbridge("ЛИЦ.СЧ.");
            t.addAbridge("Л.СЧЕТ");
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new2837("СПЕЦИАЛЬНЫЙ ЛИЦЕВОЙ СЧЕТ", MorphLang.UNKNOWN, true, "СПЕЦ/С", 6, 20);
            t.addAbridge("СПЕЦ.С.");
            t.addAbridge("СПЕЦ.СЧЕТ");
            t.addAbridge("СПЕЦ.СЧ.");
            t.addVariant("СПЕЦСЧЕТ", true);
            t.addVariant("СПЕЦИАЛЬНЫЙ СЧЕТ", true);
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new2837("КОРРЕСПОНДЕНТСКИЙ СЧЕТ", MorphLang.UNKNOWN, true, "К/С", 6, 20);
            t.addAbridge("КОРР.СЧЕТ");
            t.addAbridge("КОР.СЧЕТ");
            t.addAbridge("КОРР.СЧ.");
            t.addAbridge("КОР.СЧ.");
            t.addAbridge("К.СЧЕТ");
            t.addAbridge("КОР.С.");
            t.addAbridge("К.С.");
            t.addAbridge("K.C.");
            t.addAbridge("К-С");
            t.addAbridge("К/С");
            t.addAbridge("К.СЧ.");
            t.addAbridge("К/СЧ");
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new2841("КОД БЮДЖЕТНОЙ КЛАССИФИКАЦИИ", "КБК", "КБК", 6, 20, true);
            UriAnalyzer.m_Schemes.add(t);
            t = Termin._new170("КАДАСТРОВЫЙ НОМЕР", 7);
            t.addVariant("КАДАСТРОВЫЙ НОМ.", false);
            UriAnalyzer.m_Schemes.add(t);
            UriItemToken.initialize();
        } catch (ex) {
            throw new Error(ex.message);
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new UriAnalyzer());
    }
    
    static static_constructor() {
        UriAnalyzer.ANALYZER_NAME = "URI";
        UriAnalyzer.m_Schemes = null;
    }
}


UriAnalyzer.static_constructor();

module.exports = UriAnalyzer