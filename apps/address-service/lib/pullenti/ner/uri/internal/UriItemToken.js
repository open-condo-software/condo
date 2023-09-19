/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const TerminParseAttr = require("./../../core/TerminParseAttr");
const MetaToken = require("./../../MetaToken");
const MorphLang = require("./../../../morph/MorphLang");
const TextToken = require("./../../TextToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const NumberToken = require("./../../NumberToken");
const ReferentToken = require("./../../ReferentToken");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");

class UriItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.value = null;
    }
    
    static attachUriContent(t0, afterHttp) {
        let res = UriItemToken._AttachUriContent(t0, ".;:-_=+&%#@/\\?[]()!~", afterHttp);
        if (res === null) 
            return null;
        if (res.endToken.isCharOf(".;-:") && res.endChar > 3) {
            res.endToken = res.endToken.previous;
            res.value = res.value.substring(0, 0 + res.value.length - 1);
        }
        if (res.value.endsWith("/")) 
            res.value = res.value.substring(0, 0 + res.value.length - 1);
        if (res.value.endsWith("\\")) 
            res.value = res.value.substring(0, 0 + res.value.length - 1);
        if (res.value.indexOf('\\') > 0) 
            res.value = Utils.replaceString(res.value, '\\', '/');
        return res;
    }
    
    static attachISOContent(t0, specChars) {
        let t = t0;
        while (true) {
            if (t === null) 
                return null;
            if (t.isCharOf(":/\\") || t.isHiphen || t.isValue("IEC", null)) {
                t = t.next;
                continue;
            }
            break;
        }
        if (!(t instanceof NumberToken)) 
            return null;
        let t1 = t;
        let delim = String.fromCharCode(0);
        let txt = new StringBuilder();
        for (; t !== null; t = t.next) {
            if (t.isWhitespaceBefore && t !== t1) 
                break;
            if (t instanceof NumberToken) {
                if (delim !== (String.fromCharCode(0))) 
                    txt.append(delim);
                delim = String.fromCharCode(0);
                t1 = t;
                txt.append(t.getSourceText());
                continue;
            }
            if (!(t instanceof TextToken)) 
                break;
            if (!t.isCharOf(specChars)) 
                break;
            delim = t.getSourceText()[0];
        }
        if (txt.length === 0) 
            return null;
        return UriItemToken._new2790(t0, t1, txt.toString());
    }
    
    static _AttachUriContent(t0, _chars, canBeWhitespaces = false) {
        let txt = new StringBuilder();
        let t1 = t0;
        let dom = UriItemToken.attachDomainName(t0, true, canBeWhitespaces);
        if (dom !== null) {
            if (dom.value.length < 3) 
                return null;
        }
        let openChar = String.fromCharCode(0);
        let t = t0;
        if (dom !== null) 
            t = dom.endToken.next;
        for (; t !== null; t = t.next) {
            if (t !== t0 && t.isWhitespaceBefore) {
                if (t.isNewlineBefore || !canBeWhitespaces) 
                    break;
                if (dom === null) 
                    break;
                if (t.previous.isHiphen) {
                }
                else if (t.previous.isCharOf(",;")) 
                    break;
                else if (t.previous.isChar('.') && t.chars.isLetter && t.lengthChar === 2) {
                }
                else {
                    let ok = false;
                    let tt1 = t;
                    if (t.isCharOf("\\/")) 
                        tt1 = t.next;
                    let tt0 = tt1;
                    for (; tt1 !== null; tt1 = tt1.next) {
                        if (tt1 !== tt0 && tt1.isWhitespaceBefore) 
                            break;
                        if (tt1 instanceof NumberToken) 
                            continue;
                        if (!(tt1 instanceof TextToken)) 
                            break;
                        let term1 = tt1.term;
                        if (((term1 === "HTM" || term1 === "HTML" || term1 === "SHTML") || term1 === "ASP" || term1 === "ASPX") || term1 === "JSP") {
                            ok = true;
                            break;
                        }
                        if (!tt1.chars.isLetter) {
                            if (tt1.isCharOf("\\/")) {
                                ok = true;
                                break;
                            }
                            if (!tt1.isCharOf(_chars)) 
                                break;
                        }
                        else if (!tt1.chars.isLatinLetter) 
                            break;
                    }
                    if (!ok) 
                        break;
                }
            }
            if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                txt.append(nt.getSourceText());
                t1 = t;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) {
                let rt = Utils.as(t, ReferentToken);
                if (rt !== null && rt.beginToken.isValue("РФ", null)) {
                    if (txt.length > 0 && txt.charAt(txt.length - 1) === '.') {
                        txt.append(rt.beginToken.getSourceText());
                        t1 = t;
                        continue;
                    }
                }
                if (rt !== null && rt.chars.isLatinLetter && rt.beginToken === rt.endToken) {
                    txt.append(rt.beginToken.getSourceText());
                    t1 = t;
                    continue;
                }
                break;
            }
            let src = tt.getSourceText();
            let ch = src[0];
            if (!Utils.isLetter(ch)) {
                if (_chars.indexOf(ch) < 0) 
                    break;
                if (ch === '(' || ch === '[') 
                    openChar = ch;
                else if (ch === ')') {
                    if (openChar !== '(') 
                        break;
                    openChar = String.fromCharCode(0);
                }
                else if (ch === ']') {
                    if (openChar !== '[') 
                        break;
                    openChar = String.fromCharCode(0);
                }
            }
            txt.append(src);
            t1 = t;
        }
        if (txt.length === 0) 
            return dom;
        let i = 0;
        for (i = 0; i < txt.length; i++) {
            if (Utils.isLetterOrDigit(txt.charAt(i))) 
                break;
        }
        if (i >= txt.length) 
            return dom;
        if (txt.charAt(txt.length - 1) === '.' || txt.charAt(txt.length - 1) === '/') {
            txt.length = txt.length - 1;
            t1 = t1.previous;
        }
        if (dom !== null) 
            txt.insert(0, dom.value);
        let tmp = txt.toString();
        if (tmp.startsWith("\\\\")) {
            txt.replace("\\\\", "//");
            tmp = txt.toString();
        }
        if (tmp.startsWith("//")) 
            tmp = tmp.substring(2);
        if (Utils.compareStrings(tmp, "WWW", true) === 0) 
            return null;
        let res = UriItemToken._new2790(t0, t1, txt.toString());
        return res;
    }
    
    static attachDomainName(t0, _check, canBeWhitspaces) {
        let txt = new StringBuilder();
        let t1 = t0;
        let ipCount = 0;
        let isIp = true;
        for (let t = t0; t !== null; t = t.next) {
            if (t.isWhitespaceBefore && t !== t0) {
                let ok = false;
                if (!t.isNewlineBefore && canBeWhitspaces) {
                    for (let tt1 = t; tt1 !== null; tt1 = tt1.next) {
                        if (tt1.isChar('.') || tt1.isHiphen) 
                            continue;
                        if (tt1.isWhitespaceBefore) {
                            if (tt1.isNewlineBefore) 
                                break;
                            if (tt1.previous !== null && ((tt1.previous.isChar('.') || tt1.previous.isHiphen))) {
                            }
                            else 
                                break;
                        }
                        if (!(tt1 instanceof TextToken)) 
                            break;
                        if (UriItemToken.m_StdGroups.tryParse(tt1, TerminParseAttr.NO) !== null) {
                            ok = true;
                            break;
                        }
                        if (!tt1.chars.isLatinLetter) 
                            break;
                    }
                }
                if (!ok) 
                    break;
            }
            if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                if (nt.intValue === null) 
                    break;
                txt.append(nt.getSourceText());
                t1 = t;
                if (nt.typ === NumberSpellingType.DIGIT && nt.intValue >= 0 && (nt.intValue < 256)) 
                    ipCount++;
                else 
                    isIp = false;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            let src = tt.term;
            let ch = src[0];
            if (!Utils.isLetter(ch)) {
                if (".-_".indexOf(ch) < 0) 
                    break;
                if (ch !== '.') 
                    isIp = false;
                if (ch === '-') {
                    if (Utils.compareStrings(txt.toString(), "vk.com", true) === 0) 
                        return UriItemToken._new2790(t0, t1, txt.toString().toLowerCase());
                }
            }
            else 
                isIp = false;
            txt.append(src.toLowerCase());
            t1 = t;
        }
        if (txt.length === 0) 
            return null;
        if (ipCount !== 4) 
            isIp = false;
        let i = 0;
        let points = 0;
        for (i = 0; i < txt.length; i++) {
            if (txt.charAt(i) === '.') {
                if (i === 0) 
                    return null;
                if (i >= (txt.length - 1)) {
                    txt.length = txt.length - 1;
                    t1 = t1.previous;
                    break;
                }
                if (txt.charAt(i - 1) === '.' || txt.charAt(i + 1) === '.') 
                    return null;
                points++;
            }
        }
        if (points === 0) 
            return null;
        let _uri = txt.toString();
        if (_check) {
            let ok = isIp;
            if (!isIp) {
                if (txt.toString() === "localhost") 
                    ok = true;
            }
            if (!ok && t1.previous !== null && t1.previous.isChar('.')) {
                if (UriItemToken.m_StdGroups.tryParse(t1, TerminParseAttr.NO) !== null) 
                    ok = true;
            }
            if (!ok) 
                return null;
        }
        return UriItemToken._new2790(t0, t1, txt.toString().toLowerCase());
    }
    
    static attachMailUsers(t1) {
        if (t1 === null) 
            return null;
        if (t1.isChar('}')) {
            let res0 = UriItemToken.attachMailUsers(t1.previous);
            if (res0 === null) 
                return null;
            t1 = res0[0].beginToken.previous;
            for (; t1 !== null; t1 = t1.previous) {
                if (t1.isChar('{')) {
                    res0[0].beginToken = t1;
                    return res0;
                }
                if (t1.isCharOf(";,")) 
                    continue;
                let res1 = UriItemToken.attachMailUsers(t1);
                if (res1 === null) 
                    return null;
                res0.splice(0, 0, res1[0]);
                t1 = res1[0].beginToken;
            }
            return null;
        }
        let txt = new StringBuilder();
        let t0 = t1;
        for (let t = t1; t !== null; t = t.previous) {
            if (t.isWhitespaceAfter) 
                break;
            if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                txt.insert(0, nt.getSourceText());
                t0 = t;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            let src = tt.getSourceText();
            let ch = src[0];
            if (!Utils.isLetter(ch)) {
                if (".-_".indexOf(ch) < 0) 
                    break;
            }
            txt.insert(0, src);
            t0 = t;
        }
        if (txt.length === 0) 
            return null;
        let res = new Array();
        res.push(UriItemToken._new2790(t0, t1, txt.toString().toLowerCase()));
        return res;
    }
    
    static attachUrl(t0) {
        let srv = UriItemToken.attachDomainName(t0, true, false);
        if (srv === null) 
            return null;
        let txt = new StringBuilder(srv.value);
        let t1 = srv.endToken;
        if (t1.next !== null && t1.next.isChar(':') && (t1.next.next instanceof NumberToken)) {
            t1 = t1.next.next;
            txt.append(":").append(t1.value);
        }
        else if ((srv.value === "vk.com" && t1.next !== null && t1.next.isHiphen) && t1.next.next !== null) {
            t1 = t1.next.next;
            let dat = UriItemToken._AttachUriContent(t1, ".-_+%", false);
            if (dat !== null) {
                t1 = dat.endToken;
                txt.append("/").append(dat.value);
            }
        }
        for (let t = t1.next; t !== null; t = t.next) {
            if (t.isWhitespaceBefore) 
                break;
            if (!t.isChar('/')) 
                break;
            if (t.isWhitespaceAfter) {
                t1 = t;
                break;
            }
            let dat = UriItemToken._AttachUriContent(t.next, ".-_+%", false);
            if (dat === null) {
                t1 = t;
                break;
            }
            t = (t1 = dat.endToken);
            txt.append("/").append(dat.value);
        }
        if ((t1.next !== null && t1.next.isChar('?') && !t1.next.isWhitespaceAfter) && !t1.isWhitespaceAfter) {
            let dat = UriItemToken._AttachUriContent(t1.next.next, ".-_+%=&", false);
            if (dat !== null) {
                t1 = dat.endToken;
                txt.append("?").append(dat.value);
            }
        }
        if ((t1.next !== null && t1.next.isChar('#') && !t1.next.isWhitespaceAfter) && !t1.isWhitespaceAfter) {
            let dat = UriItemToken._AttachUriContent(t1.next.next, ".-_+%", false);
            if (dat !== null) {
                t1 = dat.endToken;
                txt.append("#").append(dat.value);
            }
        }
        let i = 0;
        for (i = 0; i < txt.length; i++) {
            if (Utils.isLetter(txt.charAt(i))) 
                break;
        }
        if (i >= txt.length) 
            return null;
        return UriItemToken._new2790(t0, t1, txt.toString());
    }
    
    static attachISBN(t0) {
        let txt = new StringBuilder();
        let t1 = t0;
        let digs = 0;
        for (let t = t0; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            if (t.isNewlineBefore && t !== t0) {
                if (t.previous !== null && t.previous.isHiphen) {
                }
                else 
                    break;
            }
            if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                if (nt.typ !== NumberSpellingType.DIGIT || !nt.morph._class.isUndefined) 
                    break;
                let d = nt.getSourceText();
                txt.append(d);
                digs += d.length;
                t1 = t;
                if (digs > 13) 
                    break;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            let s = tt.term;
            if (s !== "-" && s !== "Х" && s !== "X") 
                break;
            if (s === "Х") 
                s = "X";
            txt.append(s);
            t1 = t;
            if (s !== "-") 
                break;
        }
        let i = 0;
        let dig = 0;
        for (i = 0; i < txt.length; i++) {
            if (Utils.isDigit(txt.charAt(i))) 
                dig++;
        }
        if (dig < 7) 
            return null;
        return UriItemToken._new2790(t0, t1, txt.toString());
    }
    
    static attachBBK(t0) {
        let txt = new StringBuilder();
        let t1 = t0;
        let digs = 0;
        for (let t = t0; t !== null; t = t.next) {
            if (t.isNewlineBefore && t !== t0) 
                break;
            if (t.isTableControlChar) 
                break;
            if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                if (nt.typ !== NumberSpellingType.DIGIT || !nt.morph._class.isUndefined) 
                    break;
                let d = nt.getSourceText();
                txt.append(d);
                digs += d.length;
                t1 = t;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                break;
            if (tt.isChar(',')) 
                break;
            if (tt.isChar('(')) {
                if (!(tt.next instanceof NumberToken)) 
                    break;
            }
            let s = tt.getSourceText();
            if (Utils.isLetter(s[0])) {
                if (tt.isWhitespaceBefore) 
                    break;
            }
            txt.append(s);
            t1 = t;
        }
        if ((txt.length < 3) || (digs < 2)) 
            return null;
        if (txt.charAt(txt.length - 1) === '.') {
            txt.length = txt.length - 1;
            t1 = t1.previous;
        }
        return UriItemToken._new2790(t0, t1, txt.toString());
    }
    
    static attachSkype(t0) {
        if (t0.chars.isCyrillicLetter) 
            return null;
        let res = UriItemToken._AttachUriContent(t0, "._", false);
        if (res === null) 
            return null;
        if (res.value.length < 5) 
            return null;
        return res;
    }
    
    static attachIcqContent(t0) {
        if (!(t0 instanceof NumberToken)) 
            return null;
        let res = UriItemToken.attachISBN(t0);
        if (res === null) 
            return null;
        if (res.value.includes("-")) 
            res.value = Utils.replaceString(res.value, "-", "");
        for (const ch of res.value) {
            if (!Utils.isDigit(ch)) 
                return null;
        }
        if ((res.value.length < 6) || res.value.length > 10) 
            return null;
        return res;
    }
    
    static initialize() {
        if (UriItemToken.m_StdGroups !== null) 
            return;
        UriItemToken.m_StdGroups = new TerminCollection();
        let domainGroups = ["com;net;org;inf;biz;name;aero;arpa;edu;int;gov;mil;coop;museum;mobi;travel", "ac;ad;ae;af;ag;ai;al;am;an;ao;aq;ar;as;at;au;aw;az", "ba;bb;bd;be;bf;bg;bh;bi;bj;bm;bn;bo;br;bs;bt;bv;bw;by;bz", "ca;cc;cd;cf;cg;ch;ci;ck;cl;cm;cn;co;cr;cu;cv;cx;cy;cz", "de;dj;dk;dm;do;dz", "ec;ee;eg;eh;er;es;et;eu", "fi;fj;fk;fm;fo;fr", "ga;gd;ge;gf;gg;gh;gi;gl;gm;gn;gp;gq;gr;gs;gt;gu;gw;gy", "hk;hm;hn;hr;ht;hu", "id;ie;il;im;in;io;iq;ir;is;it", "je;jm;jo;jp", "ke;kg;kh;ki;km;kn;kp;kr;kw;ky;kz", "la;lb;lc;li;lk;lr;ls;lt;lu;lv;ly", "ma;mc;md;mg;mh;mk;ml;mm;mn;mo;mp;mq;mr;ms;mt;mu;mv;mw;mx;my;mz", "na;nc;ne;nf;ng;ni;nl;no;np;nr;nu;nz", "om", "pa;pe;pf;pg;ph;pk;pl;pm;pn;pr;ps;pt;pw;py", "qa", "re;ro;ru;rw", "sa;sb;sc;sd;se;sg;sh;si;sj;sk;sl;sm;sn;so;sr;st;su;sv;sy;sz", "tc;td;tf;tg;th;tj;tk;tm;tn;to;tp;tr;tt;tv;tw;tz", "ua;ug;uk;um;us;uy;uz", "va;vc;ve;vg;vi;vn;vu", "wf;ws", "ye;yt;yu", "za;zm;zw"];
        let separator = [';'];
        for (const domainGroup of domainGroups) {
            for (const domain of Utils.splitString(domainGroup.toUpperCase(), separator, true)) {
                UriItemToken.m_StdGroups.add(new Termin(domain, MorphLang.UNKNOWN, true));
            }
        }
    }
    
    static _new2790(_arg1, _arg2, _arg3) {
        let res = new UriItemToken(_arg1, _arg2);
        res.value = _arg3;
        return res;
    }
    
    static static_constructor() {
        UriItemToken.m_StdGroups = null;
    }
}


UriItemToken.static_constructor();

module.exports = UriItemToken