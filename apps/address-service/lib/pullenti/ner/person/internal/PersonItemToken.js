/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphClass = require("./../../../morph/MorphClass");
const MorphCase = require("./../../../morph/MorphCase");
const MorphForm = require("./../../../morph/MorphForm");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const NumberSpellingType = require("./../../NumberSpellingType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const Referent = require("./../../Referent");
const GetTextAttr = require("./../../core/GetTextAttr");
const MorphNumber = require("./../../../morph/MorphNumber");
const CharsInfo = require("./../../../morph/CharsInfo");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const FioTemplateType = require("./FioTemplateType");
const MorphGender = require("./../../../morph/MorphGender");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphCollection = require("./../../MorphCollection");
const PersonAttrTokenPersonAttrAttachAttrs = require("./PersonAttrTokenPersonAttrAttachAttrs");
const Token = require("./../../Token");
const GeoReferent = require("./../../geo/GeoReferent");
const TextToken = require("./../../TextToken");
const MetaToken = require("./../../MetaToken");
const MiscHelper = require("./../../core/MiscHelper");
const ShortNameHelper = require("./ShortNameHelper");
const PersonReferent = require("./../PersonReferent");
const PullentiNerPersonInternalResourceHelper = require("./PullentiNerPersonInternalResourceHelper");
const BracketHelper = require("./../../core/BracketHelper");
const PersonItemTokenItemType = require("./PersonItemTokenItemType");
const NumberToken = require("./../../NumberToken");
const MailLine = require("./../../mail/internal/MailLine");
const ReferentToken = require("./../../ReferentToken");
const PersonItemTokenParseAttr = require("./PersonItemTokenParseAttr");
const PersonAnalyzer = require("./../PersonAnalyzer");
const PersonAttrToken = require("./PersonAttrToken");

class PersonItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = PersonItemTokenItemType.VALUE;
        this.value = null;
        this.isInDictionary = false;
        this.isHiphenBefore = false;
        this.isHiphenAfter = false;
        this.firstname = null;
        this.lastname = null;
        this.middlename = null;
        this.referent = null;
    }
    
    static initialize() {
        PersonItemToken.MorphPersonItem.initialize();
    }
    
    isAsianItem(last) {
        if (this.value === null || this.typ !== PersonItemTokenItemType.VALUE) 
            return false;
        if (this.chars.isAllLower) 
            return false;
        if (this.chars.isAllUpper && this.lengthChar > 1) 
            return false;
        let sogl = 0;
        let gl = 0;
        let prevGlas = false;
        for (let i = 0; i < this.value.length; i++) {
            let ch = this.value[i];
            if (!LanguageHelper.isCyrillicChar(ch)) 
                return false;
            else if (LanguageHelper.isCyrillicVowel(ch)) {
                if (!prevGlas) {
                    if (gl > 0) {
                        if (!last) 
                            return false;
                        if (i === (this.value.length - 1) && ((ch === 'А' || ch === 'У' || ch === 'Е'))) 
                            break;
                        else if (i === (this.value.length - 2) && ch === 'О' && this.value[i + 1] === 'М') 
                            break;
                    }
                    gl++;
                }
                prevGlas = true;
            }
            else {
                sogl++;
                prevGlas = false;
            }
        }
        if (gl !== 1) {
            if (last && gl === 2) {
            }
            else 
                return false;
        }
        if (sogl > 4) 
            return false;
        if (this.value.length === 1) {
            if (!this.chars.isAllUpper) 
                return false;
        }
        else if (!this.chars.isCapitalUpper) 
            return false;
        if (this.value.length > 5 && this.beginToken === this.endToken && !last) {
            let mc = this.beginToken.getMorphClassInDictionary();
            if (!mc.isUndefined) 
                return false;
        }
        return true;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.typ.toString()).append(" ").append(((this.value != null ? this.value : "")));
        if (this.firstname !== null) 
            res.append(" (First: ").append(this.firstname.toString()).append(")");
        if (this.middlename !== null) 
            res.append(" (Middle: ").append(this.middlename.toString()).append(")");
        if (this.lastname !== null) 
            res.append(" (Last: ").append(this.lastname.toString()).append(")");
        if (this.referent !== null) 
            res.append(" Ref: ").append(this.referent);
        return res.toString();
    }
    
    addPostfixInfo(postfix, gen) {
        if (this.value !== null) 
            this.value = (this.value + "-" + postfix);
        if (this.lastname !== null) 
            this.lastname.addPostfix(postfix, gen);
        if (this.firstname !== null) 
            this.firstname.addPostfix(postfix, gen);
        else if (this.lastname !== null) 
            this.firstname = this.lastname;
        else {
            this.firstname = PersonItemToken.MorphPersonItem._new2613(true);
            this.firstname.vars.push(new PersonItemToken.MorphPersonItemVariant(this.value, MorphBaseInfo._new2614(gen), false));
            if (this.lastname === null) 
                this.lastname = this.firstname;
        }
        if (this.middlename !== null) 
            this.middlename.addPostfix(postfix, gen);
        else if (this.firstname !== null && !this.chars.isLatinLetter) 
            this.middlename = this.firstname;
        this.isInDictionary = false;
    }
    
    mergeWithByHiphen(pi) {
        this.endToken = pi.endToken;
        this.value = (this.value + "-" + pi.value);
        if (this.lastname !== null) {
            if (pi.lastname === null || pi.lastname.vars.length === 0) 
                this.lastname.addPostfix(pi.value, MorphGender.UNDEFINED);
            else 
                this.lastname.mergeWithByHiphen(pi.lastname);
        }
        else if (pi.lastname !== null) {
            pi.lastname.addPrefix(this.value + "-");
            this.lastname = pi.lastname;
        }
        if (this.firstname !== null) {
            if (pi.firstname === null || pi.firstname.vars.length === 0) 
                this.firstname.addPostfix(pi.value, MorphGender.UNDEFINED);
            else 
                this.firstname.mergeWithByHiphen(pi.firstname);
        }
        else if (pi.firstname !== null) {
            pi.firstname.addPrefix(this.value + "-");
            this.firstname = pi.firstname;
        }
        if (this.middlename !== null) {
            if (pi.middlename === null || pi.middlename.vars.length === 0) 
                this.middlename.addPostfix(pi.value, MorphGender.UNDEFINED);
            else 
                this.middlename.mergeWithByHiphen(pi.middlename);
        }
        else if (pi.middlename !== null) {
            pi.middlename.addPrefix(this.value + "-");
            this.middlename = pi.middlename;
        }
    }
    
    removeNotGenitive() {
        if (this.lastname !== null) 
            this.lastname.removeNotGenitive();
        if (this.firstname !== null) 
            this.firstname.removeNotGenitive();
        if (this.middlename !== null) 
            this.middlename.removeNotGenitive();
    }
    
    static tryAttachLatin(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) {
            let mt = Utils.as(t, MetaToken);
            if (mt !== null && mt.beginToken === mt.endToken) {
                let res00 = PersonItemToken.tryAttachLatin(mt.beginToken);
                if (res00 !== null) {
                    res00.beginToken = res00.endToken = t;
                    return res00;
                }
            }
            return null;
        }
        if (!tt.chars.isLetter) 
            return null;
        if (tt.term === "THE") 
            return null;
        if (tt.term === "JR" || tt.term === "JNR" || tt.term === "JUNIOR") {
            let t1 = tt;
            if (tt.next !== null && tt.next.isChar('.')) 
                t1 = tt.next;
            return PersonItemToken._new2615(tt, t1, PersonItemTokenItemType.SUFFIX, "JUNIOR");
        }
        if ((tt.term === "SR" || tt.term === "SNR" || tt.term === "SENIOR") || tt.term === "FITZ" || tt.term === "FILS") {
            let t1 = tt;
            if (tt.next !== null && tt.next.isChar('.')) 
                t1 = tt.next;
            return PersonItemToken._new2615(tt, t1, PersonItemTokenItemType.SUFFIX, "SENIOR");
        }
        let initials = (tt.term === "YU" || tt.term === "YA" || tt.term === "CH") || tt.term === "SH";
        if (!initials && tt.term.length === 2 && tt.chars.isCapitalUpper) {
            if (!LanguageHelper.isLatinVowel(tt.term[0]) && !LanguageHelper.isLatinVowel(tt.term[1])) 
                initials = true;
        }
        if (initials) {
            let rii = PersonItemToken._new2617(tt, tt, PersonItemTokenItemType.INITIAL, tt.term, tt.chars);
            if (tt.next !== null && tt.next.isChar('.')) 
                rii.endToken = tt.next;
            return rii;
        }
        if (tt.chars.isAllLower) {
            if (!PersonItemToken.m_SurPrefixesLat.includes(tt.term)) 
                return null;
        }
        if (tt.chars.isCyrillicLetter) 
            return null;
        if (tt.lengthChar === 1) {
            if (tt.next === null) 
                return null;
            if (tt.next.isChar('.')) 
                return PersonItemToken._new2617(tt, tt.next, PersonItemTokenItemType.INITIAL, tt.term, tt.chars);
            if (!tt.next.isWhitespaceAfter && !tt.isWhitespaceAfter && ((tt.term === "D" || tt.term === "O" || tt.term === "M"))) {
                if (BracketHelper.isBracket(tt.next, false) && (tt.next.next instanceof TextToken)) {
                    if (tt.next.next.chars.isLatinLetter) {
                        let pit0 = PersonItemToken.tryAttachLatin(tt.next.next);
                        if (pit0 !== null && pit0.typ === PersonItemTokenItemType.VALUE) {
                            pit0.beginToken = tt;
                            let val = tt.term;
                            if (pit0.value !== null) {
                                if (val === "M" && pit0.value.startsWith("C")) {
                                    pit0.value = "MA" + pit0.value;
                                    val = "MA";
                                }
                                else 
                                    pit0.value = val + pit0.value;
                            }
                            if (pit0.lastname !== null) {
                                pit0.lastname.addPrefix(val);
                                pit0.lastname.isInDictionary = true;
                            }
                            else if (pit0.firstname !== null) {
                                pit0.lastname = pit0.firstname;
                                pit0.lastname.addPrefix(val);
                                pit0.lastname.isInDictionary = true;
                            }
                            pit0.firstname = (pit0.middlename = null);
                            if (!pit0.chars.isAllUpper && !pit0.chars.isCapitalUpper) 
                                pit0.chars.isCapitalUpper = true;
                            return pit0;
                        }
                    }
                }
            }
            if (!LanguageHelper.isLatinVowel(tt.term[0]) || tt.whitespacesAfterCount !== 1) {
                let nex = PersonItemToken.tryAttachLatin(tt.next);
                if (nex !== null && nex.typ === PersonItemTokenItemType.VALUE) 
                    return PersonItemToken._new2617(tt, tt, PersonItemTokenItemType.INITIAL, tt.term, tt.chars);
                return null;
            }
            if (tt.term === "I") 
                return null;
            return PersonItemToken._new2617(tt, tt, PersonItemTokenItemType.VALUE, tt.term, tt.chars);
        }
        if (!MiscHelper.hasVowel(tt)) 
            return null;
        let res = null;
        if (PersonItemToken.m_SurPrefixesLat.includes(tt.term)) {
            let te = tt.next;
            if (te !== null && te.isHiphen) 
                te = te.next;
            res = PersonItemToken.tryAttachLatin(te);
            if (res !== null) {
                res.value = (tt.term + "-" + res.value);
                res.beginToken = tt;
                res.lastname = new PersonItemToken.MorphPersonItem();
                res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, new MorphBaseInfo(), true));
                res.lastname.isLastnameHasHiphen = true;
                return res;
            }
        }
        if (MailLine.isKeyword(tt)) 
            return null;
        res = new PersonItemToken(tt, tt);
        res.value = tt.term;
        let cla = tt.getMorphClassInDictionary();
        if (cla.isProperName || ((cla.isProper && ((tt.morph.gender === MorphGender.MASCULINE || tt.morph.gender === MorphGender.FEMINIE))))) {
            res.firstname = PersonItemToken.MorphPersonItem._new2621(res.value);
            for (const wf of tt.morph.items) {
                if (wf.isInDictionary) {
                    if (wf._class.isProperName) 
                        res.firstname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, wf, false));
                }
            }
            if (res.firstname.vars.length === 0) 
                res.firstname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, null, false));
            res.firstname.isInDictionary = true;
        }
        if (cla.isProperSurname) {
            res.lastname = PersonItemToken.MorphPersonItem._new2621(res.value);
            for (const wf of tt.morph.items) {
                if (wf.isInDictionary) {
                    if (wf._class.isProperSurname) 
                        res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, wf, false));
                }
            }
            if (res.lastname.vars.length === 0) 
                res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, null, false));
            res.lastname.isInDictionary = true;
        }
        if ((!cla.isProperName && !cla.isProper && !cla.isProperSurname) && !cla.isUndefined) 
            res.isInDictionary = true;
        res.morph = tt.morph;
        let ots = null;
        if (t !== null && t.kit.ontology !== null && ots === null) 
            ots = t.kit.ontology.attachToken(PersonReferent.OBJ_TYPENAME, t);
        if (ots !== null) {
            if (ots[0].termin.ignoreTermsOrder) 
                return PersonItemToken._new2623(ots[0].beginToken, ots[0].endToken, PersonItemTokenItemType.REFERENT, Utils.as(ots[0].item.tag, PersonReferent), ots[0].morph);
            res.lastname = PersonItemToken.MorphPersonItem._new2624(ots[0].termin.canonicText, true);
            for (const ot of ots) {
                if (ot.termin !== null) {
                    let mi = ot.morph;
                    if (ot.termin.gender === MorphGender.MASCULINE || ot.termin.gender === MorphGender.FEMINIE) 
                        mi = MorphBaseInfo._new2614(ot.termin.gender);
                    res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(ot.termin.canonicText, mi, true));
                }
            }
        }
        if (res.value.startsWith("MC")) 
            res.value = "MAC" + res.value.substring(2);
        if (res.value.startsWith("MAC")) {
            res.firstname = (res.middlename = null);
            res.lastname = PersonItemToken.MorphPersonItem._new2613(true);
            res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(res.value, new MorphBaseInfo(), true));
        }
        return res;
    }
    
    static tryAttach(t, attrs = PersonItemTokenParseAttr.NO, prevList = null) {
        if (t === null) 
            return null;
        if (t instanceof TextToken) {
            let mc = t.getMorphClassInDictionary();
            if (mc.isPreposition || mc.isConjunction || mc.isMisc) {
                if (t.next !== null && (t.next instanceof ReferentToken)) {
                    if ((((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) !== (PersonItemTokenParseAttr.NO.value()) && !t.chars.isAllLower) {
                    }
                    else if (t.lengthChar === 1 && t.chars.isAllUpper) {
                    }
                    else 
                        return null;
                }
            }
        }
        if (t instanceof NumberToken) {
            let nt = Utils.as(t, NumberToken);
            if (nt.beginToken === nt.endToken && nt.typ === NumberSpellingType.WORDS && ((!nt.beginToken.chars.isAllLower || (((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) !== (PersonItemTokenParseAttr.NO.value())))) {
                let res00 = PersonItemToken.tryAttach(nt.beginToken, attrs, prevList);
                if (res00 !== null) {
                    res00.beginToken = res00.endToken = t;
                    return res00;
                }
            }
        }
        if (t instanceof ReferentToken) {
            let rt = Utils.as(t, ReferentToken);
            if (rt.beginToken === rt.endToken && rt.beginToken.chars.isCapitalUpper) {
                let res00 = PersonItemToken.tryAttach(rt.beginToken, attrs, prevList);
                if (res00 !== null) {
                    let res01 = PersonItemToken.tryAttach(t.next, attrs, prevList);
                    if ((res01 !== null && res01.lastname !== null && res01.firstname === null) && res01.middlename === null) 
                        return null;
                    res00.beginToken = res00.endToken = t;
                    res00.isInDictionary = true;
                    return res00;
                }
            }
        }
        if ((((t instanceof TextToken) && t.lengthChar === 2 && t.term === "JI") && t.chars.isAllUpper && !t.isWhitespaceAfter) && t.next !== null && t.next.isChar('.')) {
            let re1 = PersonItemToken._new2615(t, t.next, PersonItemTokenItemType.INITIAL, "Л");
            re1.chars.isCyrillicLetter = true;
            re1.chars.isAllUpper = true;
            return re1;
        }
        if ((((((t instanceof TextToken) && t.lengthChar === 1 && t.term === "J") && t.chars.isAllUpper && !t.isWhitespaceAfter) && (t.next instanceof NumberToken) && t.next.value === "1") && t.next.typ === NumberSpellingType.DIGIT && t.next.next !== null) && t.next.next.isChar('.')) {
            let re1 = PersonItemToken._new2615(t, t.next.next, PersonItemTokenItemType.INITIAL, "Л");
            re1.chars.isCyrillicLetter = true;
            re1.chars.isAllUpper = true;
            return re1;
        }
        if ((((((t instanceof TextToken) && t.lengthChar === 1 && t.term === "I") && t.chars.isAllUpper && !t.isWhitespaceAfter) && (t.next instanceof NumberToken) && t.next.value === "1") && t.next.typ === NumberSpellingType.DIGIT && t.next.next !== null) && t.next.next.isChar('.')) {
            if (prevList !== null && prevList[0].chars.isCyrillicLetter) {
                let re1 = PersonItemToken._new2615(t, t.next.next, PersonItemTokenItemType.INITIAL, "П");
                re1.chars.isCyrillicLetter = true;
                re1.chars.isAllUpper = true;
                return re1;
            }
        }
        let res = PersonItemToken._tryAttach(t, attrs, prevList);
        if (res !== null) 
            return res;
        if (t.chars.isLatinLetter && (((attrs.value()) & (PersonItemTokenParseAttr.CANBELATIN.value()))) !== (PersonItemTokenParseAttr.NO.value())) {
            let ots = null;
            let ad = PersonAnalyzer.getData(t);
            if (ad !== null) 
                ots = ad.localOntology.tryAttach(t, PersonReferent.OBJ_TYPENAME, false);
            if (t !== null && t.kit.ontology !== null && ots === null) 
                ots = t.kit.ontology.attachToken(PersonReferent.OBJ_TYPENAME, t);
            if (ots !== null && (t instanceof TextToken)) {
                if (ots[0].termin.ignoreTermsOrder) 
                    return PersonItemToken._new2623(ots[0].beginToken, ots[0].endToken, PersonItemTokenItemType.REFERENT, Utils.as(ots[0].item.tag, PersonReferent), ots[0].morph);
                res = PersonItemToken._new2631(ots[0].beginToken, ots[0].endToken, t.term, ots[0].chars);
                res.lastname = PersonItemToken.MorphPersonItem._new2624(ots[0].termin.canonicText, true);
                for (const ot of ots) {
                    if (ot.termin !== null) {
                        let mi = ot.morph;
                        if (ot.termin.gender === MorphGender.MASCULINE || ot.termin.gender === MorphGender.FEMINIE) 
                            mi = MorphBaseInfo._new2614(ot.termin.gender);
                        res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(ot.termin.canonicText, mi, true));
                    }
                }
                return res;
            }
            res = PersonItemToken.tryAttachLatin(t);
            if (res !== null) 
                return res;
        }
        if (((t instanceof NumberToken) && t.lengthChar === 1 && (((attrs.value()) & (PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()))) !== (PersonItemTokenParseAttr.NO.value())) && t.next !== null && t.next.isCharOf(".„")) {
            if (t.value === "1") 
                return PersonItemToken._new2617(t, t.next, PersonItemTokenItemType.INITIAL, "І", CharsInfo._new2634(true));
            if (t.value === "0") 
                return PersonItemToken._new2617(t, t.next, PersonItemTokenItemType.INITIAL, "О", CharsInfo._new2634(true));
            if (t.value === "3") 
                return PersonItemToken._new2617(t, t.next, PersonItemTokenItemType.INITIAL, "З", CharsInfo._new2634(true));
        }
        if ((((t instanceof NumberToken) && t.lengthChar === 1 && (((attrs.value()) & (PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()))) !== (PersonItemTokenParseAttr.NO.value())) && t.next !== null && t.next.chars.isAllLower) && !t.isWhitespaceAfter && t.next.lengthChar > 2) {
            let num = t.value;
            if (num === "3" && t.next.chars.isCyrillicLetter) 
                return PersonItemToken._new2617(t, t.next, PersonItemTokenItemType.VALUE, "З" + t.next.term, CharsInfo._new2640(true, true));
            if (num === "0" && t.next.chars.isCyrillicLetter) 
                return PersonItemToken._new2617(t, t.next, PersonItemTokenItemType.VALUE, "О" + t.next.term, CharsInfo._new2640(true, true));
        }
        if (((((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && t.chars.isAllUpper && (t.whitespacesAfterCount < 2)) && (t.next instanceof TextToken) && t.next.lengthChar === 1) && t.next.chars.isAllLower) {
            let cou = 0;
            let t1 = null;
            let lat = 0;
            let cyr = 0;
            let ch = t.getSourceText()[0];
            if (t.chars.isCyrillicLetter) {
                cyr++;
                if ((LanguageHelper.getLatForCyr(ch).charCodeAt(0)) !== 0) 
                    lat++;
            }
            else {
                lat++;
                if ((LanguageHelper.getCyrForLat(ch).charCodeAt(0)) !== 0) 
                    cyr++;
            }
            for (let tt = t.next; tt !== null; tt = tt.next) {
                if (tt.whitespacesBeforeCount > 1) 
                    break;
                if (!(tt instanceof TextToken) || tt.lengthChar !== 1 || !tt.chars.isAllLower) 
                    break;
                t1 = tt;
                cou++;
                ch = tt.getSourceText()[0];
                if (tt.chars.isCyrillicLetter) {
                    cyr++;
                    if ((LanguageHelper.getLatForCyr(ch).charCodeAt(0)) !== 0) 
                        lat++;
                }
                else {
                    lat++;
                    if ((LanguageHelper.getCyrForLat(ch).charCodeAt(0)) !== 0) 
                        cyr++;
                }
            }
            if (cou < 2) 
                return null;
            if (cou < 5) {
                if (prevList !== null && prevList.length > 0 && prevList[prevList.length - 1].typ === PersonItemTokenItemType.INITIAL) {
                }
                else {
                    let ne = PersonItemToken.tryAttach(t1.next, attrs, null);
                    if (ne === null || ne.typ !== PersonItemTokenItemType.INITIAL) 
                        return null;
                }
            }
            let isCyr = cyr >= lat;
            if (cyr === lat && t.chars.isLatinLetter) 
                isCyr = false;
            let val = new StringBuilder();
            for (let tt = t; tt !== null && tt.endChar <= t1.endChar; tt = tt.next) {
                ch = tt.getSourceText()[0];
                if (isCyr && LanguageHelper.isLatinChar(ch)) {
                    let chh = LanguageHelper.getCyrForLat(ch);
                    if ((chh.charCodeAt(0)) !== 0) 
                        ch = chh;
                }
                else if (!isCyr && LanguageHelper.isCyrillicChar(ch)) {
                    let chh = LanguageHelper.getLatForCyr(ch);
                    if ((chh.charCodeAt(0)) !== 0) 
                        ch = chh;
                }
                val.append(ch.toUpperCase());
            }
            res = PersonItemToken._new2615(t, t1, PersonItemTokenItemType.VALUE, val.toString());
            res.chars = CharsInfo._new2645(true, isCyr, !isCyr, true);
            return res;
        }
        if ((((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) !== (PersonItemTokenParseAttr.NO.value()) && (t instanceof TextToken) && !t.chars.isAllLower) {
            res = PersonItemToken._new2646(t, t, t.term);
            return res;
        }
        if (((t.chars.isAllUpper && (t instanceof TextToken) && t.lengthChar === 1) && prevList !== null && prevList.length > 0) && (t.whitespacesBeforeCount < 2) && prevList[0].chars.isCapitalUpper) {
            let last = prevList[prevList.length - 1];
            let ok = false;
            if ((last.typ === PersonItemTokenItemType.VALUE && last.lastname !== null && last.lastname.isInDictionary) && prevList.length === 1) 
                ok = true;
            else if (prevList.length === 2 && last.typ === PersonItemTokenItemType.INITIAL && prevList[0].lastname !== null) 
                ok = true;
            if (ok) 
                return PersonItemToken._new2647(t, t, t.term, PersonItemTokenItemType.INITIAL);
        }
        return null;
    }
    
    static _tryAttach(t, attrs, prevList = null) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) {
            if (t.chars.isLetter && t.chars.isCapitalUpper && (t instanceof ReferentToken)) {
                let rt = Utils.as(t, ReferentToken);
                if (rt.beginToken === rt.endToken && !(rt.referent instanceof PersonReferent)) {
                    let res0 = PersonItemToken._tryAttach(rt.beginToken, attrs, null);
                    if (res0 === null) {
                        res0 = PersonItemToken._new2648(rt, rt, rt.referent.toStringEx(true, t.kit.baseLanguage, 0).toUpperCase(), rt.chars, rt.morph);
                        res0.lastname = PersonItemToken.MorphPersonItem._new2621(res0.value);
                    }
                    else 
                        res0.beginToken = res0.endToken = rt;
                    if ((t.next !== null && t.next.isHiphen && (t.next.next instanceof TextToken)) && t.next.next.getMorphClassInDictionary().isProperSecname) {
                        let res1 = PersonItemToken.tryAttach(t.next.next, PersonItemTokenParseAttr.NO, null);
                        if (res1 !== null && res1.middlename !== null) {
                            res1.middlename.addPrefix(res0.value + "-");
                            res1.firstname = res1.middlename;
                            res1.beginToken = t;
                            return res1;
                        }
                    }
                    return res0;
                }
            }
            return null;
        }
        if (!tt.chars.isLetter) 
            return null;
        let canBeAllLower = false;
        if (tt.chars.isAllLower && (((attrs.value()) & (PersonItemTokenParseAttr.CANBELOWER.value()))) === (PersonItemTokenParseAttr.NO.value())) {
            if (!PersonItemToken.M_SUR_PREFIXES.includes(tt.term)) {
                let mc0 = tt.getMorphClassInDictionary();
                if (((tt.term === "Д" && !tt.isWhitespaceAfter && BracketHelper.isBracket(tt.next, true)) && !tt.next.isWhitespaceAfter && (tt.next.next instanceof TextToken)) && tt.next.next.chars.isCapitalUpper) {
                }
                else if (mc0.isProperSurname && !mc0.isNoun) {
                    if (tt.next !== null && (tt.whitespacesAfterCount < 3)) {
                        let mc1 = tt.next.getMorphClassInDictionary();
                        if (mc1.isProperName) 
                            canBeAllLower = true;
                    }
                    if (tt.previous !== null && (tt.whitespacesBeforeCount < 3)) {
                        let mc1 = tt.previous.getMorphClassInDictionary();
                        if (mc1.isProperName) 
                            canBeAllLower = true;
                    }
                    if (!canBeAllLower) 
                        return null;
                }
                else if (mc0.isProperSecname && !mc0.isNoun) {
                    if (tt.previous !== null && (tt.whitespacesBeforeCount < 3)) {
                        let mc1 = tt.previous.getMorphClassInDictionary();
                        if (mc1.isProperName) 
                            canBeAllLower = true;
                    }
                    if (!canBeAllLower) 
                        return null;
                }
                else if (mc0.isProperName && !mc0.isNoun) {
                    if (tt.next !== null && (tt.whitespacesAfterCount < 3)) {
                        let mc1 = tt.next.getMorphClassInDictionary();
                        if (mc1.isProperSurname || mc1.isProperSecname) 
                            canBeAllLower = true;
                    }
                    if (tt.previous !== null && (tt.whitespacesBeforeCount < 3)) {
                        let mc1 = tt.previous.getMorphClassInDictionary();
                        if (mc1.isProperSurname) 
                            canBeAllLower = true;
                    }
                    if (!canBeAllLower) 
                        return null;
                }
                else 
                    return null;
            }
        }
        if (tt.lengthChar === 1 || tt.term === "ДЖ") {
            if (tt.next === null) 
                return null;
            let ini = tt.term;
            let ci = CharsInfo._new2650(tt.chars.value);
            if (!tt.chars.isCyrillicLetter) {
                let cyr = LanguageHelper.getCyrForLat(ini[0]);
                if (cyr === (String.fromCharCode(0))) 
                    return null;
                ini = (cyr);
                ci.isLatinLetter = false;
                ci.isCyrillicLetter = true;
            }
            if (tt.next.isChar('.')) 
                return PersonItemToken._new2617(tt, tt.next, PersonItemTokenItemType.INITIAL, ini, ci);
            if ((tt.next.isCharOf(",;„") && prevList !== null && prevList.length > 0) && prevList[prevList.length - 1].typ === PersonItemTokenItemType.INITIAL) 
                return PersonItemToken._new2617(tt, tt, PersonItemTokenItemType.INITIAL, ini, ci);
            if ((tt.next.whitespacesAfterCount < 2) && (tt.whitespacesAfterCount < 2) && ((tt.term === "Д" || tt.term === "О" || tt.term === "Н"))) {
                if (BracketHelper.isBracket(tt.next, false) && (tt.next.next instanceof TextToken)) {
                    if (tt.next.next.chars.isCyrillicLetter) {
                        let pit0 = PersonItemToken.tryAttach(tt.next.next, PersonItemTokenParseAttr.of((attrs.value()) | (PersonItemTokenParseAttr.CANBELOWER.value())), prevList);
                        if (pit0 !== null) {
                            pit0.beginToken = tt;
                            if (pit0.value !== null) 
                                pit0.value = ini + pit0.value;
                            if (pit0.lastname !== null) {
                                pit0.lastname.addPrefix(ini);
                                pit0.lastname.isInDictionary = true;
                            }
                            else if (pit0.firstname !== null) {
                                pit0.lastname = pit0.firstname;
                                pit0.lastname.addPrefix(ini);
                                pit0.lastname.isInDictionary = true;
                            }
                            pit0.firstname = (pit0.middlename = null);
                            if (!pit0.chars.isAllUpper && !pit0.chars.isCapitalUpper) 
                                pit0.chars.isCapitalUpper = true;
                            return pit0;
                        }
                    }
                }
            }
            if (!LanguageHelper.isCyrillicVowel(tt.term[0])) 
                return null;
            if (tt.whitespacesAfterCount !== 1) {
                if (tt.next === null) {
                }
                else if ((!tt.isWhitespaceAfter && (tt.next instanceof TextToken) && !tt.next.isChar('.')) && !tt.next.chars.isLetter) {
                }
                else 
                    return null;
            }
            return PersonItemToken._new2617(tt, tt, PersonItemTokenItemType.VALUE, tt.term, tt.chars);
        }
        if (!tt.chars.isCyrillicLetter) 
            return null;
        if (!MiscHelper.hasVowel(tt)) 
            return null;
        let ots = null;
        let ad = PersonAnalyzer.getData(t);
        if (ad.localOntology.items.length < 1000) {
            ots = ad.localOntology.tryAttach(t, PersonReferent.OBJ_TYPENAME, false);
            if (ots !== null && ots[0].beginToken !== ots[0].endToken && !ots[0].beginToken.next.isHiphen) {
                if (PersonAttrToken.tryAttachWord(ots[0].beginToken, false) !== null) 
                    ots = null;
            }
        }
        if (t !== null && t.kit.ontology !== null && ots === null) 
            ots = t.kit.ontology.attachToken(PersonReferent.OBJ_TYPENAME, t);
        let surPrefix = null;
        let res = null;
        if (ots !== null) {
            if (ots[0].termin.ignoreTermsOrder) 
                return PersonItemToken._new2623(ots[0].beginToken, ots[0].endToken, PersonItemTokenItemType.REFERENT, Utils.as(ots[0].item.tag, PersonReferent), ots[0].morph);
            let mc = ots[0].beginToken.getMorphClassInDictionary();
            if (ots[0].beginToken === ots[0].endToken && mc.isProperName && !mc.isProperSurname) 
                ots = null;
        }
        if (ots !== null) {
            res = PersonItemToken._new2631(ots[0].beginToken, ots[0].endToken, tt.term, ots[0].chars);
            res.lastname = PersonItemToken.MorphPersonItem._new2656(true);
            res.lastname.term = Utils.replaceString(ots[0].termin.canonicText, " - ", "-");
            res.value = MiscHelper.getTextValueOfMetaToken(ots[0], GetTextAttr.NO);
            for (const ot of ots) {
                if (ot.termin !== null) {
                    let mi = ot.morph;
                    if (ot.termin.gender === MorphGender.MASCULINE) {
                        if (((t.morph.gender.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) 
                            continue;
                        mi = MorphBaseInfo._new2614(ot.termin.gender);
                    }
                    else if (ot.termin.gender === MorphGender.FEMINIE) {
                        if (((t.morph.gender.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) 
                            continue;
                        mi = MorphBaseInfo._new2614(ot.termin.gender);
                    }
                    else 
                        continue;
                    res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(ot.termin.canonicText, mi, true));
                }
            }
            if (ots[0].termin.canonicText.includes("-")) 
                return res;
        }
        else {
            res = PersonItemToken._new2648(t, t, tt.term, tt.chars, tt.morph);
            if (PersonItemToken.M_SUR_PREFIXES.includes(tt.term)) {
                if (((tt.isValue("БЕН", null) || tt.isValue("ВАН", null))) && (((attrs.value()) & (PersonItemTokenParseAttr.ALTVAR.value()))) !== (PersonItemTokenParseAttr.NO.value()) && ((tt.next === null || !tt.next.isHiphen))) {
                }
                else {
                    if (tt.next !== null) {
                        let t1 = tt.next;
                        if ((t1 instanceof TextToken) && ((t1.term === "Л" || t1.term === "ЛЬ" || PersonItemToken.M_SUR_PREFIXES.includes(t1.term)))) {
                            res.endToken = t1;
                            res.value += t1.term;
                            t1 = t1.next;
                        }
                        else if ((t1.isHiphen && (t1.next instanceof TextToken) && t1.next.next !== null) && ((t1.next.term === "Л" || t1.next.term === "ЛЬ" || PersonItemToken.M_SUR_PREFIXES.includes(t1.next.term)))) {
                            res.endToken = t1.next;
                            res.value += t1.next.term;
                            t1 = t1.next.next;
                        }
                        if (t1 !== null && t1.isHiphen) 
                            tt = Utils.as(t1.next, TextToken);
                        else if ((((attrs.value()) & (PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE.value()))) !== (PersonItemTokenParseAttr.NO.value()) && t1 !== null && t1.chars.isAllLower) 
                            tt = null;
                        else 
                            tt = Utils.as(t1, TextToken);
                        if ((tt === null || tt.isNewlineBefore || tt.chars.isAllLower) || !tt.chars.isCyrillicLetter || (tt.lengthChar < 3)) {
                        }
                        else {
                            surPrefix = res.value;
                            res.value = (res.value + "-" + tt.term);
                            res.morph = tt.morph;
                            res.chars = tt.chars;
                            res.endToken = tt;
                        }
                    }
                    if (surPrefix === null) {
                        if (t.chars.isCapitalUpper || t.chars.isAllUpper) 
                            return res;
                        return null;
                    }
                }
            }
        }
        if (tt.isValue("ФАМИЛИЯ", "ПРІЗВИЩЕ") || tt.isValue("ИМЯ", "ІМЯ") || tt.isValue("ОТЧЕСТВО", "БАТЬКОВІ")) 
            return null;
        if (tt.morph._class.isPreposition || tt.morph._class.isConjunction) {
            if (tt.getMorphClassInDictionary().isProperName) {
            }
            else if (tt.next === null || !tt.next.isChar('.')) {
                if (tt.lengthChar > 1 && tt.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(tt)) {
                }
                else 
                    return null;
            }
        }
        if ((((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) !== (PersonItemTokenParseAttr.NO.value())) {
        }
        else {
            if (tt.term.length > 6 && tt.term.startsWith("ЗД")) {
                if (MiscHelper.isNotMoreThanOneError("ЗДРАВСТВУЙТЕ", tt)) 
                    return null;
                if (MiscHelper.isNotMoreThanOneError("ЗДРАВСТВУЙ", tt)) 
                    return null;
            }
            if (tt.lengthChar > 6 && tt.term.startsWith("ПР")) {
                if (MiscHelper.isNotMoreThanOneError("ПРИВЕТСТВУЮ", tt)) 
                    return null;
            }
            if (tt.lengthChar > 6 && tt.term.startsWith("УВ")) {
                if (tt.isValue("УВАЖАЕМЫЙ", null)) 
                    return null;
            }
            if (tt.lengthChar > 6 && tt.term.startsWith("ДО")) {
                if (tt.isValue("ДОРОГОЙ", null)) 
                    return null;
            }
        }
        if (!tt.chars.isAllUpper && !tt.chars.isCapitalUpper && !canBeAllLower) {
            if ((((attrs.value()) & (PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()))) !== (PersonItemTokenParseAttr.NO.value()) && !tt.chars.isAllLower) {
            }
            else if ((((attrs.value()) & (PersonItemTokenParseAttr.CANBELOWER.value()))) === (PersonItemTokenParseAttr.NO.value())) 
                return null;
        }
        let adj = null;
        for (const wff of tt.morph.items) {
            let wf = Utils.as(wff, MorphWordForm);
            if (wf === null) 
                continue;
            if (wf._class.isAdjective && wf.containsAttr("к.ф.", null)) {
                if (wf.isInDictionary) {
                    if (LanguageHelper.endsWith(tt.term, "НО") || ((tt.next !== null && tt.next.isHiphen))) 
                        res.isInDictionary = true;
                }
                continue;
            }
            else if ((wf._class.isAdjective && adj === null && !((wf.normalFull != null ? wf.normalFull : wf.normalCase)).endsWith("ОВ")) && !((wf.normalFull != null ? wf.normalFull : wf.normalCase)).endsWith("ИН") && (((wf.isInDictionary || wf.normalCase.endsWith("ЫЙ") || wf.normalCase.endsWith("КИЙ")) || wf.normalCase.endsWith("АЯ") || wf.normalCase.endsWith("ЯЯ")))) 
                adj = wf;
            if (wf._class.isVerb) {
                if (wf.isInDictionary) 
                    res.isInDictionary = true;
                continue;
            }
            if (wf.isInDictionary) {
                if ((wf._class.isAdverb || wf._class.isPreposition || wf._class.isConjunction) || wf._class.isPronoun || wf._class.isPersonalPronoun) 
                    res.isInDictionary = true;
            }
            if (wf._class.isProperSurname || surPrefix !== null) {
                if (res.lastname === null) 
                    res.lastname = PersonItemToken.MorphPersonItem._new2621(tt.term);
                if (adj !== null) {
                    if (!wf.isInDictionary && adj.number === MorphNumber.SINGULAR) {
                        let val = adj.normalCase;
                        res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(val, adj, true));
                        if (val === tt.term) {
                            if (!PersonItemToken.MorphPersonItem.endsWithStdSurname(wf.normalCase)) 
                                break;
                        }
                    }
                    adj = null;
                }
                if ((((attrs.value()) & (PersonItemTokenParseAttr.NOMINATIVECASE.value()))) !== (PersonItemTokenParseAttr.NO.value())) {
                    if (!wf._case.isUndefined && !wf._case.isNominative) 
                        continue;
                }
                let v = new PersonItemToken.MorphPersonItemVariant(wf.normalCase, wf, true);
                if (wf.normalCase !== tt.term && LanguageHelper.endsWith(tt.term, "ОВ")) {
                    v.value = tt.term;
                    v.gender = MorphGender.MASCULINE;
                }
                else if ((wf.number === MorphNumber.PLURAL && wf.normalFull !== null && wf.normalFull !== wf.normalCase) && wf.normalFull.length > 1) {
                    v.value = wf.normalFull;
                    v.number = MorphNumber.SINGULAR;
                    if (wf.normalCase.length > tt.term.length) 
                        v.value = tt.term;
                }
                res.lastname.vars.push(v);
                if (wf.isInDictionary && v.gender === MorphGender.UNDEFINED && wf.gender === MorphGender.UNDEFINED) {
                    v.gender = MorphGender.MASCULINE;
                    let vv = new PersonItemToken.MorphPersonItemVariant(wf.normalCase, wf, true);
                    vv.value = v.value;
                    vv.shortValue = v.shortValue;
                    vv.gender = MorphGender.FEMINIE;
                    res.lastname.vars.push(vv);
                }
                else if ((v.gender === MorphGender.MASCULINE && !wf.isInDictionary && ((v.value.endsWith("ИН") || v.value.endsWith("ІН")))) && (t instanceof TextToken) && ((t.term.endsWith("ИНА") || t.term.endsWith("ІНА")))) {
                    let vv = new PersonItemToken.MorphPersonItemVariant(t.term, MorphBaseInfo._new2569(MorphCase.NOMINATIVE, MorphGender.MASCULINE), true);
                    vv.value = t.term;
                    vv.gender = MorphGender.MASCULINE;
                    res.lastname.vars.push(vv);
                }
                if (wf.isInDictionary) 
                    res.lastname.isInDictionary = true;
                if (tt.term.endsWith("ИХ") || tt.term.endsWith("ЫХ")) {
                    if (res.lastname.vars[0].value !== tt.term) 
                        res.lastname.vars.splice(0, 0, new PersonItemToken.MorphPersonItemVariant(tt.term, MorphBaseInfo._new2663(MorphCase.ALL_CASES, MorphGender.of((MorphGender.MASCULINE.value()) | (MorphGender.FEMINIE.value())), MorphClass._new2662(true)), true));
                }
            }
            if (surPrefix !== null) 
                continue;
            if (wf._class.isProperName && wf.number !== MorphNumber.PLURAL) {
                let ok = true;
                if (t.morph.language.isUa) {
                }
                else if (wf.normalCase === "ЯКОВ" || wf.normalCase === "ИОВ" || wf.normalCase === "ИАКОВ") {
                }
                else if (wf.normalCase !== null && (wf.normalCase.length < 5)) {
                }
                else {
                    ok = !LanguageHelper.endsWith(wf.normalCase, "ОВ") && wf.normalCase !== "АЛЛ";
                    if (ok) {
                        if (tt.chars.isAllUpper && (tt.lengthChar < 4)) 
                            ok = false;
                    }
                }
                if (ok) {
                    if (res.firstname === null) 
                        res.firstname = PersonItemToken.MorphPersonItem._new2621(tt.term);
                    res.firstname.vars.push(new PersonItemToken.MorphPersonItemVariant(wf.normalCase, wf, false));
                    if (wf.isInDictionary) {
                        if (!tt.chars.isAllUpper || tt.lengthChar > 4) 
                            res.firstname.isInDictionary = true;
                    }
                }
            }
            if (!PersonItemToken.MorphPersonItem.endsWithStdSurname(tt.term)) {
                if (wf._class.isProperSecname) {
                    if (res.middlename === null) 
                        res.middlename = PersonItemToken.MorphPersonItem._new2621(tt.term);
                    else if (wf.misc !== null && wf.misc.form === MorphForm.SYNONYM) 
                        continue;
                    let iii = new PersonItemToken.MorphPersonItemVariant(wf.normalCase, wf, false);
                    if (iii.value === tt.term) 
                        res.middlename.vars.splice(0, 0, iii);
                    else 
                        res.middlename.vars.push(iii);
                    if (wf.isInDictionary) 
                        res.middlename.isInDictionary = true;
                }
                if (!wf._class.isProper && wf.isInDictionary) 
                    res.isInDictionary = true;
            }
            else if (wf.isInDictionary && !wf._class.isProper && LanguageHelper.endsWith(tt.term, "КО")) 
                res.isInDictionary = true;
        }
        if (res.lastname !== null) {
            for (const v of res.lastname.vars) {
                if (PersonItemToken.MorphPersonItem.endsWithStdSurname(v.value)) {
                    res.lastname.isLastnameHasStdTail = true;
                    break;
                }
            }
            if (!res.lastname.isInDictionary) {
                if (((!res.lastname.isInDictionary && !res.lastname.isLastnameHasStdTail)) || PersonItemToken.MorphPersonItem.endsWithStdSurname(tt.term)) {
                    let v = new PersonItemToken.MorphPersonItemVariant(tt.term, null, true);
                    if (LanguageHelper.endsWithEx(tt.term, "ВА", "НА", null, null)) 
                        res.lastname.vars.splice(0, 0, v);
                    else 
                        res.lastname.vars.push(v);
                    if (PersonItemToken.MorphPersonItem.endsWithStdSurname(v.value) && !res.lastname.isInDictionary) 
                        res.lastname.isLastnameHasStdTail = true;
                }
            }
            res.lastname.correctLastnameVariants();
            if (surPrefix !== null) {
                res.lastname.isLastnameHasHiphen = true;
                res.lastname.term = (surPrefix + "-" + res.lastname.term);
                for (const v of res.lastname.vars) {
                    v.value = (surPrefix + "-" + v.value);
                }
            }
            if (tt.morph._class.isAdjective && !res.lastname.isInOntology) {
                let stdEnd = false;
                for (const v of res.lastname.vars) {
                    if (PersonItemToken.MorphPersonItem.endsWithStdSurname(v.value)) {
                        stdEnd = true;
                        break;
                    }
                }
                if (!stdEnd && (tt.whitespacesAfterCount < 2)) {
                    let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null && npt.endToken !== npt.beginToken) {
                        if ((prevList !== null && prevList.length === 1 && prevList[0].firstname !== null) && prevList[0].firstname.isInDictionary && tt.whitespacesBeforeCount === 1) {
                        }
                        else {
                            let nex = PersonItemToken._tryAttach(npt.endToken, attrs, null);
                            if (nex !== null && nex.firstname !== null) {
                            }
                            else 
                                res.lastname = null;
                        }
                    }
                }
            }
        }
        else if (tt.lengthChar > 2) {
            res.lastname = new PersonItemToken.MorphPersonItem();
            for (const wf of tt.morph.items) {
                if (!wf._class.isVerb) {
                    if (wf.containsAttr("к.ф.", null)) 
                        continue;
                    if (wf._case.isGenitive && wf.number === MorphNumber.PLURAL && tt.term.endsWith("ОВ")) {
                        res.lastname.vars.splice(0, res.lastname.vars.length);
                        res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(tt.term, MorphBaseInfo._new2588(MorphGender.MASCULINE, MorphCase.NOMINATIVE), true));
                        res.lastname.isLastnameHasStdTail = true;
                        break;
                    }
                    res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(wf.normalCase, wf, true));
                    if (!res.lastname.isLastnameHasStdTail) 
                        res.lastname.isLastnameHasStdTail = PersonItemToken.MorphPersonItem.endsWithStdSurname(wf.normalCase);
                }
            }
            res.lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(tt.term, null, true));
            if (!res.lastname.isLastnameHasStdTail) 
                res.lastname.isLastnameHasStdTail = PersonItemToken.MorphPersonItem.endsWithStdSurname(tt.term);
            if (surPrefix !== null) {
                res.lastname.addPrefix(surPrefix + "-");
                res.lastname.isLastnameHasHiphen = true;
            }
        }
        if (res.beginToken === res.endToken) {
            if (res.beginToken.getMorphClassInDictionary().isVerb && res.lastname !== null) {
                if (!res.lastname.isLastnameHasStdTail && !res.lastname.isInDictionary) {
                    if (res.isNewlineBefore) {
                    }
                    else if (res.beginToken.chars.isCapitalUpper && !MiscHelper.canBeStartOfSentence(res.beginToken)) {
                    }
                    else 
                        res.lastname = null;
                }
            }
            if (res.lastname !== null && res.beginToken.isValue("ЗАМ", null)) 
                return null;
            if (res.firstname !== null && (res.beginToken instanceof TextToken)) {
                if (res.beginToken.term === "ЛЮБОЙ") 
                    res.firstname = null;
            }
            if (res.beginToken.getMorphClassInDictionary().isAdjective && res.lastname !== null) {
                let npt = NounPhraseHelper.tryParse(res.beginToken, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) {
                    if (npt.beginToken !== npt.endToken) {
                        if (!res.lastname.isInOntology && !res.lastname.isInDictionary) 
                            res.lastname = null;
                    }
                }
            }
        }
        if (res.firstname !== null) {
            for (let i = 0; i < res.firstname.vars.length; i++) {
                let val = res.firstname.vars[i].value;
                let di = ShortNameHelper.getNamesForShortname(val);
                if (di === null) 
                    continue;
                let g = res.firstname.vars[i].gender;
                if (g !== MorphGender.MASCULINE && g !== MorphGender.FEMINIE) {
                    let fi = true;
                    for (const kp of di) {
                        if (fi) {
                            res.firstname.vars[i].shortValue = val;
                            res.firstname.vars[i].value = kp.name;
                            res.firstname.vars[i].gender = kp.gender;
                            fi = false;
                        }
                        else {
                            let mi = MorphBaseInfo._new2614(kp.gender);
                            res.firstname.vars.push(PersonItemToken.MorphPersonItemVariant._new2668(kp.name, mi, false, val));
                        }
                    }
                }
                else {
                    let cou = 0;
                    for (const kp of di) {
                        if (kp.gender === g) {
                            if ((++cou) < 2) {
                                res.firstname.vars[i].value = kp.name;
                                res.firstname.vars[i].shortValue = val;
                            }
                            else 
                                res.firstname.vars.splice(i + 1, 0, PersonItemToken.MorphPersonItemVariant._new2668(kp.name, res.firstname.vars[i], false, val));
                        }
                    }
                }
            }
        }
        if ((res !== null && res.isInDictionary && res.firstname === null) && (((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) === (PersonItemTokenParseAttr.NO.value())) {
            let wi = res.kit.statistics.getWordInfo(res.beginToken);
            if (wi !== null && wi.lowerCount > 0) {
                if (((t.morph._class.isPreposition || t.morph._class.isConjunction || t.morph._class.isPronoun)) && !MiscHelper.canBeStartOfSentence(t)) {
                }
                else 
                    return null;
            }
        }
        if (res.endToken.next !== null && res.endToken.next.isHiphen && (res.endToken.next.next instanceof TextToken)) {
            let ter = res.endToken.next.next.term;
            if (PersonItemToken.M_ARAB_POSTFIX.includes(ter) || PersonItemToken.M_ARAB_POSTFIX_FEM.includes(ter)) {
                res.endToken = res.endToken.next.next;
                res.addPostfixInfo(ter, (PersonItemToken.M_ARAB_POSTFIX_FEM.includes(ter) ? MorphGender.FEMINIE : MorphGender.MASCULINE));
                if ((((ter === "ОГЛЫ" || ter === "ОГЛИ" || ter === "КЫЗЫ") || ter === "ГЫЗЫ" || ter === "УГЛИ") || ter === "КЗЫ" || ter === "УЛЫ") || ter === "УУЛУ") {
                    if (res.middlename !== null) {
                        res.firstname = null;
                        res.lastname = null;
                    }
                }
            }
            else if ((!res.isWhitespaceAfter && !res.endToken.next.isWhitespaceAfter && res.endToken.next.next.chars.equals(res.beginToken.chars)) && res.beginToken === res.endToken) {
                let res1 = PersonItemToken.tryAttach(res.endToken.next.next, PersonItemTokenParseAttr.NO, null);
                if (res1 !== null && res1.beginToken === res1.endToken) {
                    if (res1.lastname !== null && res.lastname !== null && ((((res1.lastname.isHasStdPostfix || res1.lastname.isInDictionary || res1.lastname.isInOntology) || res.lastname.isHasStdPostfix || res.lastname.isInDictionary) || res.lastname.isInOntology))) {
                        res.lastname.mergeHiphen(res1.lastname);
                        if (res.value !== null && res1.value !== null) 
                            res.value = (res.value + "-" + res1.value);
                        res.firstname = null;
                        res.middlename = null;
                        res.endToken = res1.endToken;
                    }
                    else if (res.firstname !== null && ((res.firstname.isInDictionary || res.firstname.isInOntology))) {
                        if (res1.firstname !== null) {
                            if (res.value !== null && res1.value !== null) 
                                res.value = (res.value + "-" + res1.value);
                            res.firstname.mergeHiphen(res1.firstname);
                            res.lastname = null;
                            res.middlename = null;
                            res.endToken = res1.endToken;
                        }
                        else if (res1.middlename !== null) {
                            if (res.value !== null && res1.value !== null) 
                                res.value = (res.value + "-" + res1.value);
                            res.endToken = res1.endToken;
                            if (res.middlename !== null) 
                                res.middlename.mergeHiphen(res1.middlename);
                            if (res.firstname !== null) {
                                res.firstname.mergeHiphen(res1.middlename);
                                if (res.middlename === null) 
                                    res.middlename = res.firstname;
                            }
                            if (res.lastname !== null) {
                                res.lastname.mergeHiphen(res1.middlename);
                                if (res.middlename === null) 
                                    res.middlename = res.firstname;
                            }
                        }
                        else if (res1.lastname !== null && !res1.lastname.isInDictionary && !res1.lastname.isInOntology) {
                            if (res.value !== null && res1.value !== null) 
                                res.value = (res.value + "-" + res1.value);
                            res.firstname.mergeHiphen(res1.lastname);
                            res.lastname = null;
                            res.middlename = null;
                            res.endToken = res1.endToken;
                        }
                    }
                    else if ((res.firstname === null && res.middlename === null && res.lastname !== null) && !res.lastname.isInOntology && !res.lastname.isInDictionary) {
                        if (res.value !== null && res1.value !== null) 
                            res.value = (res.value + "-" + res1.value);
                        res.endToken = res1.endToken;
                        if (res1.firstname !== null) {
                            res.lastname.mergeHiphen(res1.firstname);
                            res.firstname = res.lastname;
                            res.lastname = (res.middlename = null);
                        }
                        else if (res1.middlename !== null) {
                            res.lastname.mergeHiphen(res1.middlename);
                            res.middlename = res.lastname;
                            res.firstname = null;
                        }
                        else if (res1.lastname !== null) 
                            res.lastname.mergeHiphen(res1.lastname);
                        else if (res1.value !== null) {
                            for (const v of res.lastname.vars) {
                                v.value = (v.value + "-" + res1.value);
                            }
                        }
                    }
                    else if (((res.firstname === null && res.lastname === null && res.middlename === null) && res1.lastname !== null && res.value !== null) && res1.value !== null) {
                        res.lastname = res1.lastname;
                        res.lastname.addPrefix(res.value + "-");
                        res.value = (res.value + "-" + res1.value);
                        res.firstname = null;
                        res.middlename = null;
                        res.endToken = res1.endToken;
                    }
                    else if (((res.firstname === null && res.lastname !== null && res.middlename === null) && res1.lastname === null && res.value !== null) && res1.value !== null) {
                        res.lastname.addPostfix("-" + res1.value, MorphGender.UNDEFINED);
                        res.value = (res.value + "-" + res1.value);
                        res.firstname = null;
                        res.middlename = null;
                        res.endToken = res1.endToken;
                    }
                }
            }
        }
        while ((res.endToken.whitespacesAfterCount < 3) && (res.endToken.next instanceof TextToken)) {
            let ter = res.endToken.next.term;
            if (((ter !== "АЛИ" && ter !== "ПАША")) || res.endToken.next.chars.isAllLower) {
                if (PersonItemToken.M_ARAB_POSTFIX.includes(ter) || PersonItemToken.M_ARAB_POSTFIX_FEM.includes(ter)) {
                    if (res.endToken.next.next !== null && res.endToken.next.next.isHiphen) {
                    }
                    else {
                        res.endToken = res.endToken.next;
                        res.addPostfixInfo(ter, (PersonItemToken.M_ARAB_POSTFIX_FEM.includes(ter) ? MorphGender.FEMINIE : MorphGender.MASCULINE));
                        if ((((ter === "ОГЛЫ" || ter === "ОГЛИ" || ter === "КЫЗЫ") || ter === "ГЫЗЫ" || ter === "УГЛИ") || ter === "КЗЫ" || ter === "УЛЫ") || ter === "УУЛУ") {
                            if (res.middlename !== null) {
                                res.firstname = null;
                                res.lastname = null;
                            }
                        }
                        continue;
                    }
                }
            }
            break;
        }
        return res;
    }
    
    static tryAttachList(t, attrs = PersonItemTokenParseAttr.NO, maxCount = 10) {
        if (t === null) 
            return null;
        if (((!(t instanceof TextToken) || !t.chars.isLetter)) && (((attrs.value()) & (PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()))) === (PersonItemTokenParseAttr.NO.value())) {
            if ((t instanceof ReferentToken) && (((t.getReferent() instanceof GeoReferent) || t.getReferent().typeName === "ORGANIZATION" || t.getReferent().typeName === "TRANSPORT"))) {
                if (t.beginToken === t.endToken) {
                }
                else 
                    return null;
            }
            else if (t instanceof NumberToken) {
                let nt = Utils.as(t, NumberToken);
                if (nt.beginToken === nt.endToken && nt.typ === NumberSpellingType.WORDS && !nt.beginToken.chars.isAllLower) {
                }
                else 
                    return null;
            }
            else 
                return null;
        }
        let pit = PersonItemToken.tryAttach(t, attrs, null);
        if (pit === null && t.chars.isLatinLetter) {
        }
        if (pit === null) 
            return null;
        let res = new Array();
        res.push(pit);
        t = pit.endToken.next;
        if ((t !== null && t.isChar('.') && pit.typ === PersonItemTokenItemType.VALUE) && pit.lengthChar > 3) {
            let str = pit.getSourceText();
            if (Utils.isUpperCase(str[0]) && Utils.isUpperCase(str[str.length - 1])) {
                let ok = true;
                for (let i = 1; i < (str.length - 1); i++) {
                    if (!Utils.isLowerCase(str[i])) 
                        ok = false;
                }
                if (ok) {
                    pit.value = pit.value.substring(0, 0 + pit.value.length - 1);
                    pit.firstname = (pit.middlename = (pit.lastname = null));
                    let pit2 = PersonItemToken._new2615(t, t, PersonItemTokenItemType.INITIAL, str.substring(str.length - 1));
                    res.push(pit2);
                    t = t.next;
                }
            }
        }
        let zap = false;
        for (; t !== null; t = (t === null ? null : t.next)) {
            if (t.whitespacesBeforeCount > 15) 
                break;
            let tt = t;
            if (tt.isHiphen && tt.next !== null) {
                if (!tt.isWhitespaceAfter && !tt.isWhitespaceBefore) 
                    tt = t.next;
                else if (tt.previous.chars.equals(tt.next.chars) && !tt.isNewlineAfter) 
                    tt = tt.next;
            }
            else if ((tt.isChar(',') && (tt.whitespacesAfterCount < 2) && tt.next !== null) && res.length === 1) {
                zap = true;
                tt = tt.next;
            }
            else if ((tt.isChar('(') && (tt.next instanceof TextToken) && tt.next.chars.equals(tt.previous.chars)) && tt.next.next !== null && tt.next.next.isChar(')')) {
                let pit0 = res[res.length - 1];
                let pit11 = PersonItemToken.tryAttach(tt.next, attrs, null);
                if (pit0.firstname !== null && pit11 !== null && pit11.firstname !== null) {
                    pit0.firstname.vars.splice(pit0.firstname.vars.length, 0, ...pit11.firstname.vars);
                    tt = tt.next.next;
                    pit0.endToken = tt;
                    tt = tt.next;
                }
                else if (pit0.firstname === null && pit0.lastname !== null && ((pit0.lastname.isInDictionary || pit0.lastname.isLastnameHasStdTail || pit0.lastname.isHasStdPostfix))) {
                    if (pit11 !== null && pit11.lastname !== null) {
                        let ok = false;
                        if ((pit11.lastname.isInDictionary || pit11.lastname.isLastnameHasStdTail || pit11.lastname.isHasStdPostfix)) 
                            ok = true;
                        else if (res.length === 1) {
                            let pit22 = PersonItemToken.tryAttach(tt.next.next.next, attrs, null);
                            if (pit22 !== null) {
                                if (pit22.firstname !== null) 
                                    ok = true;
                            }
                        }
                        if (ok) {
                            pit0.lastname.vars.splice(pit0.lastname.vars.length, 0, ...pit11.lastname.vars);
                            tt = tt.next.next;
                            pit0.endToken = tt;
                            tt = tt.next;
                        }
                    }
                }
            }
            let pit1 = PersonItemToken.tryAttach(tt, attrs, res);
            if (pit1 === null) 
                break;
            if (pit1.chars.isCyrillicLetter !== pit.chars.isCyrillicLetter) {
                let ok = false;
                if (pit1.typ === PersonItemTokenItemType.INITIAL) {
                    if (pit1.chars.isCyrillicLetter) {
                        let v = LanguageHelper.getLatForCyr(pit1.value[0]);
                        if (v !== (String.fromCharCode(0))) {
                            pit1.value = (v);
                            ok = true;
                            pit1.chars = CharsInfo._new2671(true);
                        }
                        else if (pit.typ === PersonItemTokenItemType.INITIAL) {
                            v = LanguageHelper.getCyrForLat(pit.value[0]);
                            if (v !== (String.fromCharCode(0))) {
                                pit.value = (v);
                                ok = true;
                                pit.chars = CharsInfo._new2634(true);
                                pit = pit1;
                            }
                        }
                    }
                    else {
                        let v = LanguageHelper.getCyrForLat(pit1.value[0]);
                        if (v !== (String.fromCharCode(0))) {
                            pit1.value = (v);
                            ok = true;
                            pit1.chars = CharsInfo._new2634(true);
                        }
                        else if (pit.typ === PersonItemTokenItemType.INITIAL) {
                            v = LanguageHelper.getLatForCyr(pit.value[0]);
                            if (v !== (String.fromCharCode(0))) {
                                pit.value = (v);
                                ok = true;
                                pit.chars = CharsInfo._new2671(true);
                                pit = pit1;
                            }
                        }
                    }
                }
                else if (pit.typ === PersonItemTokenItemType.INITIAL) {
                    if (pit.chars.isCyrillicLetter) {
                        let v = LanguageHelper.getLatForCyr(pit.value[0]);
                        if (v !== (String.fromCharCode(0))) {
                            pit.value = (v);
                            ok = true;
                        }
                        else if (pit1.typ === PersonItemTokenItemType.INITIAL) {
                            v = LanguageHelper.getCyrForLat(pit1.value[0]);
                            if (v !== (String.fromCharCode(0))) {
                                pit1.value = (v);
                                ok = true;
                                pit = pit1;
                            }
                        }
                    }
                    else {
                        let v = LanguageHelper.getCyrForLat(pit.value[0]);
                        if (v !== (String.fromCharCode(0))) {
                            pit.value = (v);
                            ok = true;
                        }
                        else if (pit1.typ === PersonItemTokenItemType.INITIAL) {
                            v = LanguageHelper.getLatForCyr(pit1.value[0]);
                            if (v !== (String.fromCharCode(0))) {
                                pit.value = (v);
                                ok = true;
                                pit = pit1;
                            }
                        }
                    }
                }
                if (!ok) 
                    break;
            }
            if (pit1.typ === PersonItemTokenItemType.VALUE || ((pit1.typ === PersonItemTokenItemType.SUFFIX && pit1.isNewlineBefore))) {
                if ((((attrs.value()) & (PersonItemTokenParseAttr.IGNOREATTRS.value()))) === (PersonItemTokenParseAttr.NO.value())) {
                    let pat = PersonAttrToken.tryAttach(pit1.beginToken, PersonAttrTokenPersonAttrAttachAttrs.NO);
                    if (pat !== null) {
                        if (pit1.isNewlineBefore) 
                            break;
                        if (pit1.lastname === null || !pit1.lastname.isLastnameHasStdTail) {
                            let ty = pit1.beginToken.getMorphClassInDictionary();
                            if (ty.isNoun) {
                                if (pit1.whitespacesBeforeCount > 1) 
                                    break;
                                if (pat.chars.isCapitalUpper && pat.beginToken === pat.endToken) {
                                }
                                else 
                                    break;
                            }
                        }
                    }
                }
            }
            if (tt !== t) {
                pit1.isHiphenBefore = true;
                res[res.length - 1].isHiphenAfter = true;
            }
            res.push(pit1);
            t = pit1.endToken;
            if (res.length > 15) 
                break;
            if (maxCount > 0 && res.length >= maxCount) 
                break;
        }
        if (res[0].isAsianItem(false) && res[0].value.length === 1) {
            if ((((attrs.value()) & (PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()))) === (PersonItemTokenParseAttr.NO.value())) {
                if (res.length < 2) 
                    return null;
                if (!res[1].isAsianItem(false) || res[1].value.length === 1) 
                    return null;
            }
        }
        if (zap && res.length > 1) {
            let ok = false;
            if (res[0].lastname !== null && res.length === 3) {
                if (res[1].typ === PersonItemTokenItemType.INITIAL || res[1].firstname !== null) {
                    if (res[2].typ === PersonItemTokenItemType.INITIAL || res[2].middlename !== null) 
                        ok = true;
                }
            }
            else if ((((attrs.value()) & (PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()))) !== (PersonItemTokenParseAttr.NO.value()) && res[0].typ === PersonItemTokenItemType.VALUE && res[1].typ === PersonItemTokenItemType.INITIAL) {
                if (res.length === 2) 
                    ok = true;
                else if (res.length === 3 && res[2].typ === PersonItemTokenItemType.INITIAL) 
                    ok = true;
                else if (res.length === 3 && res[2].isInDictionary) 
                    ok = true;
            }
            if (!ok) 
                res.splice(1, res.length - 1);
        }
        if (res.length === 1 && res[0].isNewlineBefore && res[0].isNewlineAfter) {
            if (res[0].lastname !== null && ((res[0].lastname.isHasStdPostfix || res[0].lastname.isInDictionary || res[0].lastname.isLastnameHasStdTail))) {
                let res1 = PersonItemToken.tryAttachList(res[0].endToken.next, PersonItemTokenParseAttr.CANBELATIN, maxCount);
                if (res1 !== null && res1.length > 0) {
                    if (res1.length === 2 && ((res1[0].firstname !== null || res1[1].middlename !== null)) && res1[1].isNewlineAfter) 
                        res.splice(res.length, 0, ...res1);
                    else if (res1.length === 1 && res1[0].isNewlineAfter) {
                        let res2 = PersonItemToken.tryAttachList(res1[0].endToken.next, PersonItemTokenParseAttr.CANBELATIN, maxCount);
                        if (res2 !== null && res2.length === 1 && res2[0].isNewlineAfter) {
                            if (res1[0].firstname !== null || res2[0].middlename !== null) {
                                res.push(res1[0]);
                                res.push(res2[0]);
                            }
                        }
                    }
                }
            }
        }
        for (let i = 0; i < res.length; i++) {
            if (res[i].firstname !== null && res[i].beginToken.isValue("СВЕТА", null)) {
                if (i > 0 && res[i - 1].lastname !== null) {
                }
                else if (((i + 1) < res.length) && ((res[i + 1].lastname !== null || res[i + 1].middlename !== null))) {
                }
                else 
                    continue;
                res[i].firstname.vars[0].value = "СВЕТЛАНА";
            }
            else if (res[i].typ === PersonItemTokenItemType.VALUE && ((i + 1) < res.length) && res[i + 1].typ === PersonItemTokenItemType.SUFFIX) {
                res[i].addPostfixInfo(res[i + 1].value, MorphGender.UNDEFINED);
                res[i].endToken = res[i + 1].endToken;
                if (res[i].lastname === null) {
                    res[i].lastname = PersonItemToken.MorphPersonItem._new2613(true);
                    res[i].lastname.vars.push(new PersonItemToken.MorphPersonItemVariant(res[i].value, new MorphBaseInfo(), true));
                    res[i].firstname = null;
                }
                res.splice(i + 1, 1);
            }
        }
        if (res.length > 1 && res[0].isInDictionary && (((attrs.value()) & (((PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value()) | (PersonItemTokenParseAttr.AFTERATTRIBUTE.value()))))) === (PersonItemTokenParseAttr.NO.value())) {
            let mc = res[0].beginToken.getMorphClassInDictionary();
            if (mc.isPronoun || mc.isPersonalPronoun) {
                if (res[0].beginToken.isValue("ТОМ", null)) {
                }
                else 
                    return null;
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === PersonItemTokenItemType.VALUE && res[i + 1].typ === PersonItemTokenItemType.VALUE && res[i].endToken.next.isHiphen) {
                let ok = false;
                if (i > 0 && res[i - 1].typ === PersonItemTokenItemType.INITIAL && (i + 2) === res.length) 
                    ok = true;
                else if (i === 0 && ((i + 2) < res.length) && res[i + 2].typ === PersonItemTokenItemType.INITIAL) 
                    ok = true;
                if (!ok) 
                    continue;
                res[i].endToken = res[i + 1].endToken;
                res[i].value = (res[i].value + "-" + res[i + 1].value);
                res[i].firstname = (res[i].lastname = (res[i].middlename = null));
                res[i].isInDictionary = false;
                res.splice(i + 1, 1);
                break;
            }
        }
        if (res.length === 1 && res[0].lengthChar === 1) 
            return null;
        if (((res.length >= 4 && res[0].typ === PersonItemTokenItemType.INITIAL && res[1].typ === PersonItemTokenItemType.INITIAL) && res[0].value === "М" && res[1].value === "П") && res[2].typ !== PersonItemTokenItemType.INITIAL) {
            res.splice(0, 1);
            res.splice(0, 1);
        }
        return res;
    }
    
    static tryParsePerson(t, prevPersTemplate = FioTemplateType.UNDEFINED) {
        if (t === null) 
            return null;
        if (t.getReferent() instanceof PersonReferent) {
            let rt = Utils.as(t, ReferentToken);
            if (rt.beginToken === rt.endToken) {
                let tt1 = t.next;
                if (tt1 !== null && tt1.isComma) 
                    tt1 = tt1.next;
                if (tt1 !== null && (tt1.whitespacesBeforeCount < 2)) {
                    let pits0 = PersonItemToken.tryAttachList(tt1, PersonItemTokenParseAttr.CANINITIALBEDIGIT, 10);
                    if (pits0 !== null && pits0[0].typ === PersonItemTokenItemType.INITIAL) {
                        let str = rt.referent.getStringValue(PersonReferent.ATTR_FIRSTNAME);
                        if (str !== null && str.startsWith(pits0[0].value)) {
                            let res = ReferentToken._new2676(rt.referent, t, pits0[0].endToken, FioTemplateType.SURNAMEI.value());
                            if (pits0.length > 1 && pits0[1].typ === PersonItemTokenItemType.INITIAL) {
                                str = rt.referent.getStringValue(PersonReferent.ATTR_MIDDLENAME);
                                if (str !== null && str.startsWith(pits0[1].value)) {
                                    res.endToken = pits0[1].endToken;
                                    res.miscAttrs = FioTemplateType.SURNAMEII.value();
                                }
                            }
                            return res;
                        }
                    }
                    if (((((tt1 instanceof TextToken) && tt1.lengthChar === 1 && tt1.chars.isAllUpper) && tt1.chars.isCyrillicLetter && (tt1.next instanceof TextToken)) && (tt1.whitespacesAfterCount < 2) && tt1.next.lengthChar === 1) && tt1.next.chars.isAllUpper && tt1.next.chars.isCyrillicLetter) {
                        let str = rt.referent.getStringValue(PersonReferent.ATTR_FIRSTNAME);
                        if (str !== null && str.startsWith(tt1.term)) {
                            let str2 = rt.referent.getStringValue(PersonReferent.ATTR_MIDDLENAME);
                            if (str2 === null || str2.startsWith(tt1.next.term)) {
                                let res = ReferentToken._new2676(rt.referent, t, tt1.next, FioTemplateType.NAMEISURNAME.value());
                                if (str2 === null) 
                                    rt.referent.addSlot(PersonReferent.ATTR_MIDDLENAME, tt1.next.term, false, 0);
                                if (res.endToken.next !== null && res.endToken.next.isChar('.')) 
                                    res.endToken = res.endToken.next;
                                return res;
                            }
                        }
                    }
                }
            }
            return rt;
        }
        if (t.getReferent() !== null && t.getReferent().typeName === "ORGANIZATION") {
            let rt = Utils.as(t, ReferentToken);
            let ppp = PersonItemToken.tryParsePerson(rt.beginToken, FioTemplateType.UNDEFINED);
            if (ppp !== null && ppp.endChar === rt.endChar) {
                ppp.beginToken = ppp.endToken = rt;
                return ppp;
            }
        }
        let pits = PersonItemToken.tryAttachList(t, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()) | (PersonItemTokenParseAttr.CANBELATIN.value())), 10);
        if ((pits === null && (t instanceof TextToken) && t.chars.isAllLower) && t.lengthChar > 3) {
            let pi = PersonItemToken.tryAttach(t, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()) | (PersonItemTokenParseAttr.CANBELATIN.value()) | (PersonItemTokenParseAttr.CANBELOWER.value())), null);
            if (pi !== null && pi.lastname !== null && ((pi.lastname.isInDictionary || pi.lastname.isLastnameHasStdTail))) {
                pits = PersonItemToken.tryAttachList(pi.endToken.next, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()) | (PersonItemTokenParseAttr.CANBELATIN.value())), 10);
                if (pits !== null && pits[0].typ === PersonItemTokenItemType.INITIAL && pits[0].chars.isLatinLetter === pi.chars.isLatinLetter) 
                    pits.splice(0, 0, pi);
                else 
                    pits = null;
            }
        }
        if (pits !== null && prevPersTemplate !== FioTemplateType.UNDEFINED && pits[0].typ === PersonItemTokenItemType.VALUE) {
            let tt1 = null;
            if (pits.length === 1 && prevPersTemplate === FioTemplateType.SURNAMEI) 
                tt1 = pits[0].endToken.next;
            if (tt1 !== null && tt1.isComma) 
                tt1 = tt1.next;
            if (((tt1 instanceof TextToken) && tt1.chars.isLetter && tt1.chars.isAllUpper) && tt1.lengthChar === 1 && (tt1.whitespacesBeforeCount < 2)) {
                let ii = PersonItemToken._new2617(tt1, tt1, PersonItemTokenItemType.INITIAL, tt1.term, tt1.chars);
                pits.push(ii);
            }
            if (pits.length === 1 && pits[0].isNewlineAfter && ((prevPersTemplate === FioTemplateType.SURNAMEI || prevPersTemplate === FioTemplateType.SURNAMEII))) {
                let ppp = PersonItemToken.tryAttachList(pits[0].endToken.next, PersonItemTokenParseAttr.CANBELATIN, 10);
                if (ppp !== null && ppp[0].typ === PersonItemTokenItemType.INITIAL) {
                    pits.push(ppp[0]);
                    if (ppp.length > 1 && ppp[1].typ === PersonItemTokenItemType.INITIAL) 
                        pits.push(ppp[1]);
                }
            }
        }
        if (pits !== null && pits.length > 1) {
            let tmpls = FioTemplateType.UNDEFINED;
            let first = null;
            let middl = null;
            let last = null;
            if (pits[0].typ === PersonItemTokenItemType.VALUE && pits[1].typ === PersonItemTokenItemType.INITIAL) {
                if (((t.isValue("ГЛАВА", null) || t.isValue("СТАТЬЯ", "СТАТТЯ") || t.isValue("РАЗДЕЛ", "РОЗДІЛ")) || t.isValue("ПОДРАЗДЕЛ", "ПІДРОЗДІЛ") || t.isValue("ЧАСТЬ", "ЧАСТИНА")) || t.isValue("ПРИЛОЖЕНИЕ", "ДОКЛАДАННЯ")) 
                    return null;
                if (((t.isValue("CHAPTER", null) || t.isValue("CLAUSE", null) || t.isValue("SECTION", null)) || t.isValue("SUBSECTION", null) || t.isValue("PART", null)) || t.isValue("LIST", null) || t.isValue("APPENDIX", null)) 
                    return null;
                first = pits[1];
                last = pits[0];
                tmpls = FioTemplateType.SURNAMEI;
                if (pits.length > 2 && pits[2].typ === PersonItemTokenItemType.INITIAL) {
                    middl = pits[2];
                    tmpls = FioTemplateType.SURNAMEII;
                }
            }
            else if (pits[0].typ === PersonItemTokenItemType.INITIAL && pits[1].typ === PersonItemTokenItemType.VALUE) {
                first = pits[0];
                last = pits[1];
                tmpls = FioTemplateType.ISURNAME;
            }
            else if ((pits.length > 2 && pits[0].typ === PersonItemTokenItemType.INITIAL && pits[1].typ === PersonItemTokenItemType.INITIAL) && pits[2].typ === PersonItemTokenItemType.VALUE) {
                first = pits[0];
                middl = pits[1];
                last = pits[2];
                tmpls = FioTemplateType.IISURNAME;
            }
            if (pits.length === 2 && pits[0].typ === PersonItemTokenItemType.VALUE && pits[1].typ === PersonItemTokenItemType.VALUE) {
                if (pits[0].chars.isLatinLetter && ((!pits[0].isInDictionary || !pits[1].isInDictionary))) {
                    if (!MiscHelper.isEngArticle(pits[0].beginToken)) {
                        first = pits[0];
                        last = pits[1];
                        tmpls = FioTemplateType.NAMESURNAME;
                    }
                }
            }
            if (last !== null) {
                let pers = new PersonReferent();
                pers.addSlot(PersonReferent.ATTR_LASTNAME, last.value, false, 0);
                pers.addSlot(PersonReferent.ATTR_FIRSTNAME, first.value, false, 0);
                if (middl !== null) 
                    pers.addSlot(PersonReferent.ATTR_MIDDLENAME, middl.value, false, 0);
                let res = new ReferentToken(pers, t, last.endToken);
                if (first.endChar > last.endChar) 
                    res.endToken = first.endToken;
                if (middl !== null && middl.endChar > res.endChar) 
                    res.endToken = middl.endToken;
                res.data = t.kit.getAnalyzerDataByAnalyzerName(PersonAnalyzer.ANALYZER_NAME);
                res.miscAttrs = tmpls.value();
                if ((res.endToken.whitespacesAfterCount < 2) && (res.endToken.next instanceof NumberToken)) {
                    let num = Utils.as(res.endToken.next, NumberToken);
                    if (num.value === "2" || num.value === "3") {
                        if (num.morph._class.isAdjective) {
                            pers.addSlot(PersonReferent.ATTR_NICKNAME, num.value.toString(), false, 0);
                            res.endToken = res.endToken.next;
                        }
                    }
                }
                return res;
            }
        }
        if (pits !== null && pits.length === 1 && pits[0].typ === PersonItemTokenItemType.VALUE) {
            let tt = pits[0].endToken.next;
            let comma = false;
            if (tt !== null && ((tt.isComma || tt.isChar('.')))) {
                tt = tt.next;
                comma = true;
            }
            if (((tt instanceof TextToken) && tt.lengthChar === 2 && tt.chars.isAllUpper) && tt.chars.isCyrillicLetter) {
                let pers = new PersonReferent();
                pers.addSlot(PersonReferent.ATTR_LASTNAME, pits[0].value, false, 0);
                pers.addSlot(PersonReferent.ATTR_FIRSTNAME, tt.term[0], false, 0);
                pers.addSlot(PersonReferent.ATTR_MIDDLENAME, tt.term[1], false, 0);
                let res = ReferentToken._new2676(pers, t, tt, FioTemplateType.SURNAMEII.value());
                if (tt.next !== null && tt.next.isChar('.')) 
                    res.endToken = (tt = tt.next);
                res.data = t.kit.getAnalyzerDataByAnalyzerName(PersonAnalyzer.ANALYZER_NAME);
                return res;
            }
            if ((((((tt instanceof TextToken) && (tt.whitespacesBeforeCount < 2) && tt.lengthChar === 1) && tt.chars.isAllUpper && tt.chars.isCyrillicLetter) && (tt.next instanceof TextToken) && (tt.whitespacesAfterCount < 2)) && tt.next.lengthChar === 1 && tt.next.chars.isAllUpper) && tt.next.chars.isCyrillicLetter) {
                let pers = new PersonReferent();
                pers.addSlot(PersonReferent.ATTR_LASTNAME, pits[0].value, false, 0);
                pers.addSlot(PersonReferent.ATTR_FIRSTNAME, tt.term, false, 0);
                pers.addSlot(PersonReferent.ATTR_MIDDLENAME, tt.next.term, false, 0);
                let res = ReferentToken._new2676(pers, t, tt.next, FioTemplateType.SURNAMEII.value());
                if (tt.next.next !== null && tt.next.next.isChar('.')) 
                    res.endToken = tt.next.next;
                res.data = t.kit.getAnalyzerDataByAnalyzerName(PersonAnalyzer.ANALYZER_NAME);
                return res;
            }
            if (comma && tt !== null && (tt.whitespacesBeforeCount < 2)) {
                let pits1 = PersonItemToken.tryAttachList(tt, PersonItemTokenParseAttr.of((PersonItemTokenParseAttr.CANINITIALBEDIGIT.value()) | (PersonItemTokenParseAttr.CANBELATIN.value())), 10);
                if (pits1 !== null && pits1.length > 0 && pits1[0].typ === PersonItemTokenItemType.INITIAL) {
                    if (prevPersTemplate !== FioTemplateType.UNDEFINED) {
                        if (prevPersTemplate !== FioTemplateType.SURNAMEI && prevPersTemplate !== FioTemplateType.SURNAMEII) 
                            return null;
                    }
                    let pers = new PersonReferent();
                    pers.addSlot(PersonReferent.ATTR_LASTNAME, pits[0].value, false, 0);
                    let nam = pits1[0].value;
                    if (pits1[0].chars.isCyrillicLetter !== pits[0].chars.isCyrillicLetter) {
                        let ch = '\0';
                        if (pits[0].chars.isCyrillicLetter) 
                            ch = LanguageHelper.getCyrForLat(nam[0]);
                        else 
                            ch = LanguageHelper.getLatForCyr(nam[0]);
                        if (ch !== (String.fromCharCode(0))) 
                            nam = (ch);
                    }
                    pers.addSlot(PersonReferent.ATTR_FIRSTNAME, nam, false, 0);
                    let res = ReferentToken._new2676(pers, t, pits1[0].endToken, FioTemplateType.SURNAMEI.value());
                    if (pits1.length > 1 && pits1[1].typ === PersonItemTokenItemType.INITIAL) {
                        let mid = pits1[1].value;
                        if (pits1[1].chars.isCyrillicLetter !== pits[0].chars.isCyrillicLetter) {
                            let ch = '\0';
                            if (pits[0].chars.isCyrillicLetter) 
                                ch = LanguageHelper.getCyrForLat(mid[0]);
                            else 
                                ch = LanguageHelper.getLatForCyr(mid[0]);
                            if (ch !== (String.fromCharCode(0))) 
                                mid = (ch);
                        }
                        pers.addSlot(PersonReferent.ATTR_MIDDLENAME, mid, false, 0);
                        res.endToken = pits1[1].endToken;
                        res.miscAttrs = FioTemplateType.SURNAMEII.value();
                    }
                    res.data = t.kit.getAnalyzerDataByAnalyzerName(PersonAnalyzer.ANALYZER_NAME);
                    return res;
                }
            }
        }
        return null;
    }
    
    static _new2615(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2617(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.chars = _arg5;
        return res;
    }
    
    static _new2623(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.referent = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new2631(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.value = _arg3;
        res.chars = _arg4;
        return res;
    }
    
    static _new2646(_arg1, _arg2, _arg3) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.value = _arg3;
        return res;
    }
    
    static _new2647(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.value = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2648(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonItemToken(_arg1, _arg2);
        res.value = _arg3;
        res.chars = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static static_constructor() {
        PersonItemToken.M_SUR_PREFIXES = Array.from(["АБД", "АБУ", "АБУЛЬ", "АБДУ", "АБДЕЛЬ", "УММ", "АЛ", "АЛЬ", "АН", "АТ", "АР", "АС", "АД", "БИН", "БЕН", "ИБН", "УЛЬД", "БИНТ", "ФОН", "ВАН", "ДЕ", "ДИ", "ДА", "ЛА", "ЛЕ", "ЛЯ", "ЭЛЬ", "УЛЬ"]);
        PersonItemToken.m_SurPrefixesLat = Array.from(["ABD", "AL", "BEN", "IBN", "VON", "VAN", "DE", "DI", "LA", "LE", "DA", "DE"]);
        PersonItemToken.M_ARAB_POSTFIX = Array.from(["АГА", "АЛИ", "АР", "АС", "АШ", "БЕЙ", "БЕК", "ЗАДЕ", "ОГЛЫ", "ОГЛИ", "УГЛИ", "ОЛЬ", "ООЛ", "ПАША", "БАША", "УЛЬ", "УЛЫ", "УУЛУ", "ХАН", "ХАДЖИ", "ШАХ", "ЭД", "ЭЛЬ"]);
        PersonItemToken.M_ARAB_POSTFIX_FEM = Array.from(["АСУ", "АЗУ", "ГЫЗЫ", "ЗУЛЬ", "КЫЗЫ", "КЫС", "КЗЫ"]);
    }
}


PersonItemToken.MorphPersonItemVariant = class  extends MorphBaseInfo {
    
    constructor(v, bi, _lastname) {
        super();
        this.value = null;
        this.shortValue = null;
        this.value = v;
        if (bi !== null) 
            this.copyFrom(bi);
    }
    
    toString() {
        return (((this.value != null ? this.value : "?")) + ": " + super.toString());
    }
    
    static _new2668(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonItemToken.MorphPersonItemVariant(_arg1, _arg2, _arg3);
        res.shortValue = _arg4;
        return res;
    }
}


PersonItemToken.MorphPersonItem = class  {
    
    constructor() {
        this.m_Morph = null;
        this.vars = new Array();
        this.term = null;
        this.isInDictionary = false;
        this.isInOntology = false;
        this.isLastnameHasStdTail = false;
        this.isLastnameHasHiphen = false;
        this.isHasStdPostfix = false;
    }
    
    get morph() {
        const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
        const MorphCollection = require("./../../MorphCollection");
        if (this.m_Morph !== null && this.m_Morph.itemsCount !== this.vars.length) 
            this.m_Morph = null;
        if (this.m_Morph === null) {
            this.m_Morph = new MorphCollection();
            for (const v of this.vars) {
                this.m_Morph.addItem(v);
            }
        }
        return this.m_Morph;
    }
    
    get isChinaSurname() {
        const PersonReferent = require("./../PersonReferent");
        let _term = this.term;
        if (_term === null && this.vars.length > 0) 
            _term = this.vars[0].value;
        if (_term === null) 
            return false;
        if (PersonItemToken.MorphPersonItem.m_LastnameAsian.indexOf(_term) >= 0) 
            return true;
        let tr = PersonReferent._DelSurnameEnd(_term);
        if (PersonItemToken.MorphPersonItem.m_LastnameAsian.indexOf(tr) >= 0) 
            return true;
        if (PersonItemToken.MorphPersonItem.m_LastnameAsian.indexOf(_term + "Ь") >= 0) 
            return true;
        if (_term[_term.length - 1] === 'Ь') {
            if (PersonItemToken.MorphPersonItem.m_LastnameAsian.indexOf(_term.substring(0, 0 + _term.length - 1)) >= 0) 
                return true;
        }
        return false;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.term !== null) 
            res.append(this.term);
        for (const v of this.vars) {
            res.append("; ").append(v.toString());
        }
        if (this.isInDictionary) 
            res.append(" - InDictionary");
        if (this.isInOntology) 
            res.append(" - InOntology");
        if (this.isLastnameHasStdTail) 
            res.append(" - IsLastnameHasStdTail");
        if (this.isHasStdPostfix) 
            res.append(" - IsHasStdPostfix");
        if (this.isChinaSurname) 
            res.append(" - IsChinaSurname");
        return res.toString();
    }
    
    mergeHiphen(second) {
        const MorphGender = require("./../../../morph/MorphGender");
        const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
        let addvars = new Array();
        for (const v of this.vars) {
            let ok = 0;
            for (const vv of second.vars) {
                if (((vv.gender.value()) & (v.gender.value())) !== (MorphGender.UNDEFINED.value())) {
                    v.value = (v.value + "-" + vv.value);
                    ok++;
                    break;
                }
            }
            if (ok > 0) 
                continue;
            if (v.gender !== MorphGender.UNDEFINED) {
                for (const vv of second.vars) {
                    if (vv.gender === MorphGender.UNDEFINED) {
                        v.value = (v.value + "-" + vv.value);
                        ok++;
                        break;
                    }
                }
                if (ok > 0) 
                    continue;
            }
            else {
                let val0 = v.value;
                for (const vv of second.vars) {
                    if (vv.gender !== MorphGender.UNDEFINED) {
                        if (ok === 0) {
                            v.value = (val0 + "-" + vv.value);
                            v.copyFrom(vv);
                        }
                        else 
                            addvars.push(new PersonItemToken.MorphPersonItemVariant((val0 + "-" + vv.value), vv, false));
                        ok++;
                    }
                }
                if (ok > 0) 
                    continue;
            }
            if (second.vars.length === 0) 
                continue;
            v.value = (v.value + "-" + second.vars[0].value);
        }
        this.vars.splice(this.vars.length, 0, ...addvars);
    }
    
    addPrefix(val) {
        if (this.term !== null) 
            this.term = val + this.term;
        for (const v of this.vars) {
            if (v.value !== null) 
                v.value = val + v.value;
        }
    }
    
    addPostfix(val, gen) {
        const MorphGender = require("./../../../morph/MorphGender");
        if (this.term !== null) 
            this.term = (this.term + "-" + val);
        for (const v of this.vars) {
            if (v.value !== null) {
                v.value = (v.value + "-" + val);
                if (gen !== MorphGender.UNDEFINED) 
                    v.gender = gen;
            }
        }
        this.isHasStdPostfix = true;
        this.isInDictionary = false;
    }
    
    mergeWithByHiphen(pi) {
        const MorphGender = require("./../../../morph/MorphGender");
        const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
        this.term = (((this.term != null ? this.term : "")) + "-" + ((pi.term != null ? pi.term : "")));
        if (pi.isInDictionary) 
            this.isInDictionary = true;
        if (pi.isHasStdPostfix) 
            this.isHasStdPostfix = true;
        this.isLastnameHasHiphen = true;
        if (pi.vars.length === 0) {
            if (pi.term !== null) 
                this.addPostfix(pi.term, MorphGender.UNDEFINED);
            return;
        }
        if (this.vars.length === 0) {
            if (this.term !== null) 
                pi.addPrefix(this.term + "-");
            this.vars = pi.vars;
            return;
        }
        let res = new Array();
        for (const v of this.vars) {
            for (const vv of pi.vars) {
                let vvv = new PersonItemToken.MorphPersonItemVariant((v.value + "-" + vv.value), v, false);
                res.push(vvv);
            }
        }
        this.vars = res;
    }
    
    correctLastnameVariants() {
        const MorphGender = require("./../../../morph/MorphGender");
        const LanguageHelper = require("./../../../morph/LanguageHelper");
        this.isLastnameHasStdTail = false;
        let strongStd = false;
        for (const v of this.vars) {
            if (v.value !== null) {
                if (PersonItemToken.MorphPersonItem.endsWithStdSurname(v.value) || LanguageHelper.endsWith(v.value, "АЯ") || LanguageHelper.endsWith(v.value, "ОЙ")) {
                    this.isLastnameHasStdTail = true;
                    strongStd = true;
                    break;
                }
                else if (LanguageHelper.endsWith(v.value, "КИЙ") || LanguageHelper.endsWith(v.value, "ЫЙ")) 
                    this.isLastnameHasStdTail = true;
            }
        }
        if (this.isLastnameHasStdTail) {
            for (let i = this.vars.length - 1; i >= 0; i--) {
                if ((((this.vars[i].value !== null && !PersonItemToken.MorphPersonItem.endsWithStdSurname(this.vars[i].value) && !LanguageHelper.endsWith(this.vars[i].value, "АЯ")) && !LanguageHelper.endsWith(this.vars[i].value, "ОЙ") && !LanguageHelper.endsWith(this.vars[i].value, "КИЙ")) && !LanguageHelper.endsWith(this.vars[i].value, "ЫЙ") && !LanguageHelper.endsWith(this.vars[i].value, "ИХ")) && !LanguageHelper.endsWith(this.vars[i].value, "ЫХ")) {
                    if (!this.vars[i]._class.isProperSurname || strongStd) {
                        this.vars.splice(i, 1);
                        continue;
                    }
                }
                if (this.vars[i].gender === MorphGender.UNDEFINED) {
                    let del = false;
                    for (let j = 0; j < this.vars.length; j++) {
                        if (j !== i && this.vars[j].value === this.vars[i].value && this.vars[j].gender !== MorphGender.UNDEFINED) {
                            del = true;
                            break;
                        }
                    }
                    if (del) {
                        this.vars.splice(i, 1);
                        continue;
                    }
                    let t = PersonItemToken.MorphPersonItem.findTail(this.vars[i].value);
                    if (t !== null) {
                        if (t.gender !== MorphGender.UNDEFINED) 
                            this.vars[i].gender = t.gender;
                    }
                    else if (LanguageHelper.endsWithEx(this.vars[i].value, "А", "Я", null, null)) 
                        this.vars[i].gender = MorphGender.FEMINIE;
                    else 
                        this.vars[i].gender = MorphGender.MASCULINE;
                }
            }
        }
    }
    
    removeNotGenitive() {
        let hasGen = false;
        for (const v of this.vars) {
            if (v._case.isGenitive) 
                hasGen = true;
        }
        if (hasGen) {
            for (let i = this.vars.length - 1; i >= 0; i--) {
                if (!this.vars[i]._case.isGenitive) 
                    this.vars.splice(i, 1);
            }
        }
    }
    
    static initialize() {
        const PullentiNerPersonInternalResourceHelper = require("./PullentiNerPersonInternalResourceHelper");
        const MorphGender = require("./../../../morph/MorphGender");
        PersonItemToken.MorphPersonItem.m_LastnameStdTails = new Array();
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ОВ", MorphGender.MASCULINE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ОВА", MorphGender.FEMINIE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ЕВ", MorphGender.MASCULINE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ЕВА", MorphGender.FEMINIE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ЄВ", MorphGender.MASCULINE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ЄВА", MorphGender.FEMINIE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ИН", MorphGender.MASCULINE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ИНА", MorphGender.FEMINIE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ІН", MorphGender.MASCULINE));
        PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail("ІНА", MorphGender.FEMINIE));
        for (const s of ["ЕР", "РН", "ДЗЕ", "ВИЛИ", "ЯН", "УК", "ЮК", "КО", "МАН", "АНН", "ЙН", "УН", "СКУ", "СКИ", "СЬКІ", "ИЛО", "ІЛО", "АЛО", "ИК", "СОН", "РА", "НДА", "НДО", "ЕС", "АС", "АВА", "ЛС", "ЛЮС", "ЛЬС", "ЙЗ", "ЕРГ", "ИНГ", "OR", "ER", "OV", "IN", "ERG"]) {
            PersonItemToken.MorphPersonItem.m_LastnameStdTails.push(new PersonItemToken.SurnameTail(s));
        }
        PersonItemToken.MorphPersonItem.m_LatsnameSexStdTails = Array.from(["ОВ", "ОВА", "ЕВ", "ЄВ", "ЕВА", "ЄВA", "ИН", "ИНА", "ІН", "ІНА", "КИЙ", "КАЯ"]);
        PersonItemToken.MorphPersonItem.m_LastnameAsian = new Array();
        for (const s of Utils.splitString(PullentiNerPersonInternalResourceHelper.getString("chinasurnames.txt"), '\n', false)) {
            let ss = Utils.replaceString(s.trim().toUpperCase(), "Ё", "Е");
            if (!Utils.isNullOrEmpty(ss)) 
                PersonItemToken.MorphPersonItem.m_LastnameAsian.push(ss);
        }
        let m_ChinaSurs = Array.from(Utils.splitString("Чон Чжао Цянь Сунь Ли Чжоу У Чжэн Ван Фэн Чэнь Чу Вэй Цзян Шэнь Хань Ян Чжу Цинь Ю Сюй Хэ Люй Ши Чжан Кун Цао Янь Хуа Цзинь Тао Ци Се Цзоу Юй Бай Шуй Доу Чжан Юнь Су Пань Гэ Си Фань Пэн Лан Лу Чан Ма Мяо Фан Жэнь Юань Лю Бао Ши Тан Фэй Лянь Цэнь Сюэ Лэй Хэ Ни Тэн Инь Ло Би Хао Ань Чан Лэ Фу Пи Бянь Кан Бу Гу Мэн Пин Хуан Му Сяо Яо Шао Чжань Мао Ди Ми Бэй Мин Ху Хван", ' ', false));
        for (const s of m_ChinaSurs) {
            let ss = Utils.replaceString(s.trim().toUpperCase(), "Ё", "Е");
            if (!Utils.isNullOrEmpty(ss)) {
                if (!PersonItemToken.MorphPersonItem.m_LastnameAsian.includes(ss)) 
                    PersonItemToken.MorphPersonItem.m_LastnameAsian.push(ss);
            }
        }
        PersonItemToken.MorphPersonItem.m_LastnameAsian.sort();
    }
    
    static findTail(val) {
        const LanguageHelper = require("./../../../morph/LanguageHelper");
        if (val === null) 
            return null;
        for (let i = 0; i < PersonItemToken.MorphPersonItem.m_LastnameStdTails.length; i++) {
            if (LanguageHelper.endsWith(val, PersonItemToken.MorphPersonItem.m_LastnameStdTails[i].tail)) 
                return PersonItemToken.MorphPersonItem.m_LastnameStdTails[i];
        }
        return null;
    }
    
    static endsWithStdSurname(val) {
        return PersonItemToken.MorphPersonItem.findTail(val) !== null;
    }
    
    static _new2613(_arg1) {
        let res = new PersonItemToken.MorphPersonItem();
        res.isHasStdPostfix = _arg1;
        return res;
    }
    
    static _new2621(_arg1) {
        let res = new PersonItemToken.MorphPersonItem();
        res.term = _arg1;
        return res;
    }
    
    static _new2624(_arg1, _arg2) {
        let res = new PersonItemToken.MorphPersonItem();
        res.term = _arg1;
        res.isInOntology = _arg2;
        return res;
    }
    
    static _new2656(_arg1) {
        let res = new PersonItemToken.MorphPersonItem();
        res.isInOntology = _arg1;
        return res;
    }
    
    static static_constructor() {
        PersonItemToken.MorphPersonItem.m_LastnameStdTails = null;
        PersonItemToken.MorphPersonItem.m_LatsnameSexStdTails = null;
        PersonItemToken.MorphPersonItem.m_LastnameAsian = null;
    }
}


PersonItemToken.MorphPersonItem.static_constructor();

PersonItemToken.SurnameTail = class  {
    
    constructor(t, g = MorphGender.UNDEFINED) {
        this.tail = null;
        this.gender = MorphGender.UNDEFINED;
        this.tail = t;
        this.gender = g;
    }
}


PersonItemToken.static_constructor();

module.exports = PersonItemToken