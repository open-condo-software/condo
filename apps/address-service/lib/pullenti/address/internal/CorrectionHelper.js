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

const AddrLevel = require("./../AddrLevel");
const BaseAttributes = require("./../BaseAttributes");
const AddrObject = require("./../AddrObject");
const LanguageHelper = require("./../../morph/LanguageHelper");
const AbbrTreeNode = require("./AbbrTreeNode");
const AreaAttributes = require("./../AreaAttributes");
const RegionHelper = require("./RegionHelper");
const PullentiAddressInternalResourceHelper = require("./PullentiAddressInternalResourceHelper");

class CorrectionHelper {
    
    static correct(txt, secondVar, details) {
        secondVar.value = null;
        details.value = null;
        txt = txt.trim();
        if (Utils.isNullOrEmpty(txt)) 
            return txt;
        let ii = txt.indexOf("областьг");
        if (ii > 0) {
            let tmp = new StringBuilder(txt);
            tmp.insert(ii + 7, ' ');
            txt = tmp.toString();
        }
        if (txt.includes("снт Тверь")) 
            txt = Utils.replaceString(txt, "снт Тверь", "г.Тверь");
        if (txt.includes("Санкт-Петербур ")) 
            txt = Utils.replaceString(txt, "Санкт-Петербур ", "Санкт-Петербург ");
        txt = Utils.replaceString(txt, "кл-ще", "кладбище");
        txt = Utils.replaceString(txt, "областьасть", "область");
        txt = Utils.replaceString(txt, "ж/д_ст", "железнодорожная станция");
        txt = Utils.replaceString(txt, " - ", "-");
        txt = Utils.replaceString(txt, "\\\\", "\\");
        txt = Utils.replaceString(txt, "\\\"", "\"");
        txt = Utils.replaceString(txt, '\t', ' ');
        if (txt.endsWith("д., , ,")) 
            txt = txt.substring(0, 0 + txt.length - 7).trim();
        if (txt.indexOf('*') > 0) 
            txt = Utils.replaceString(txt, '*', '-');
        if (txt[txt.length - 1] === '/') 
            txt = txt.substring(0, 0 + txt.length - 1);
        if (Utils.startsWithString(txt, "НЕТ,", true)) 
            txt = txt.substring(4).trim();
        if (Utils.startsWithString(txt, "СУБЪЕКТ", true)) 
            txt = txt.substring(7).trim();
        if (Utils.startsWithString(txt, "ФЕДЕРАЦИЯ.", true)) 
            txt = (txt.substring(0, 0 + 9) + " " + txt.substring(10));
        let i0 = 0;
        if (Utils.startsWithString(txt, "РОССИЯ", true)) 
            i0 = 6;
        else if (Utils.startsWithString(txt, "РФ", true)) 
            i0 = 2;
        else if (Utils.startsWithString(txt, "RU", true)) 
            i0 = 2;
        else if (Utils.startsWithString(txt, "Р.Ф.", true)) 
            i0 = 4;
        else if (Utils.startsWithString(txt, "г. Москва и Московская область", true)) {
            i0 = 30;
            let txt1 = txt.substring(i0);
            if (txt1.includes("Москва") || txt1.includes("Москов")) {
            }
            else 
                i0 = 12;
        }
        else if (Utils.startsWithString(txt, "г. Санкт-Петербург и Ленинградская область", true)) 
            i0 = 42;
        if (i0 > 0 && ((i0 + 1) < txt.length) && ((!Utils.isLetter(txt[i0]) || ((txt.charCodeAt(i0 - 1)) < 0x80)))) {
            for (; i0 < txt.length; i0++) {
                if (Utils.isLetter(txt[i0])) {
                    txt = txt.substring(i0);
                    break;
                }
            }
        }
        if (Utils.startsWithString(txt, "МО", true) && txt.length > 3) {
            if (txt[2] === ' ' || txt[2] === ',') 
                txt = "Московская область" + txt.substring(2);
        }
        if (((Utils.startsWithString(txt, "М\\О", true) || (Utils.startsWithString(txt, "М/О", true)))) && txt.length > 3) 
            txt = "Московская область " + txt.substring(3);
        for (let i = 0; i < txt.length; i++) {
            if (txt[i] === ' ' || txt[i] === ',') {
                if (i < 4) 
                    break;
                let countr = null;
                let wrapcountr119 = new RefOutArgWrapper();
                let inoutres120 = CorrectionHelper.m_Cities.tryGetValue(txt.substring(0, 0 + i).toUpperCase(), wrapcountr119);
                countr = wrapcountr119.value;
                if (inoutres120) 
                    txt = (countr.toString() + ", город " + txt);
                break;
            }
        }
        if (CorrectionHelper.m_Root === null) 
            return txt;
        for (let i = 0; i < (txt.length - 5); i++) {
            if (txt[i] === 'у' && txt[i + 1] === 'л' && Utils.isUpperCase(txt[i + 2])) {
                txt = (txt.substring(0, 0 + i + 2) + "." + txt.substring(i + 2));
                break;
            }
        }
        for (let i = 10; i < (txt.length - 3); i++) {
            if (txt[i - 1] === ' ' || txt[i - 1] === ',') {
                if (((CorrectionHelper._isStartOf(txt, i, "паспорт", false) || CorrectionHelper._isStartOf(txt, i, "выдан", false) || CorrectionHelper._isStartOf(txt, i, "Выдан", false)) || CorrectionHelper._isStartOf(txt, i, "серия", false) || CorrectionHelper._isStartOf(txt, i, "док:", false)) || CorrectionHelper._isStartOf(txt, i, "док.:", false)) {
                    txt = Utils.trimEndString(txt.substring(0, 0 + i));
                    break;
                }
                else if (CorrectionHelper._isStartOf(txt, i, "ОКАТО", false) && i >= (txt.length - 20)) {
                    txt = Utils.trimEndString(txt.substring(0, 0 + i));
                    break;
                }
                else if (CorrectionHelper._isStartOf(txt, i, "адрес ориентира:", false)) {
                    details.value = txt.substring(0, 0 + i);
                    txt = txt.substring(i + 16).trim();
                    i = 0;
                }
                else if ((CorrectionHelper._isStartOf(txt, i, "ОВД", false) || CorrectionHelper._isStartOf(txt, i, "УВД", false) || CorrectionHelper._isStartOf(txt, i, "РОВД", false)) || CorrectionHelper._isStartOf(txt, i, "ГОВД", false)) {
                    let kk = 0;
                    let br = false;
                    for (kk = 10; kk < (i - 2); kk++) {
                        if (CorrectionHelper._isStartOf(txt, kk, "кв", false) || CorrectionHelper._isStartOf(txt, kk, "Кв", false)) {
                            if (txt[kk + 2] === '.' || txt[kk + 2] === ' ') {
                                kk += 2;
                                for (; kk < (i - 2); kk++) {
                                    if (txt[kk] !== ' ' && txt[kk] !== '.') 
                                        break;
                                }
                                if (Utils.isDigit(txt[kk])) {
                                    for (; kk < i; kk++) {
                                        if (!Utils.isDigit(txt[kk])) 
                                            break;
                                    }
                                    txt = txt.substring(0, 0 + kk);
                                    br = true;
                                }
                                break;
                            }
                        }
                    }
                    if (br) 
                        break;
                    let j = i - 2;
                    let sp = 0;
                    for (; j > 0; j--) {
                        if (txt[j] === ' ' && txt[j - 1] !== ' ') {
                            sp++;
                            if (sp >= 4) 
                                break;
                        }
                    }
                    if (j > 10 && sp === 4) {
                        txt = Utils.trimEndString(txt.substring(0, 0 + j));
                        break;
                    }
                }
            }
        }
        let txt0 = txt.toUpperCase();
        for (let i = 0; i < txt0.length; i++) {
            if (!Utils.isLetter(txt0[i])) 
                continue;
            if (((i > 10 && Utils.isDigit(txt[i - 1]) && Utils.isUpperCase(txt[i])) && ((i + 2) < txt.length) && txt[i + 1] === 'к') && Utils.isDigit(txt[i + 2])) {
                txt = (txt.substring(0, 0 + i + 1) + " " + txt.substring(i + 1));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "РНД", true)) {
                txt = (txt.substring(0, 0 + i) + "Ростов-на-Дону " + txt.substring(i + 3));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "РСО", true)) {
                txt = (txt.substring(0, 0 + i) + "республика Северная Осетия " + txt.substring(i + 3));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "РС(Я)", false)) {
                txt = (txt.substring(0, 0 + i) + "республика Саха (Якутия)" + txt.substring(i + 5));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "РС (Я)", false)) {
                txt = (txt.substring(0, 0 + i) + "республика Саха (Якутия)" + txt.substring(i + 6));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "СПБ", true)) {
                txt = (txt.substring(0, 0 + i) + "Санкт-Петербург " + txt.substring(i + 3));
                txt0 = txt.toUpperCase();
                continue;
            }
            if (CorrectionHelper._isStartOf(txt0, i, "ДО ВОСТРЕБ", false)) {
                txt = txt.substring(0, 0 + i).trim();
                txt0 = txt.toUpperCase();
                break;
            }
            if (i === 0 || txt[i - 1] === ',' || txt[i - 1] === ' ') {
            }
            else 
                continue;
            if (CorrectionHelper._isStartOf(txt0, i, "ХХХ", false) || CorrectionHelper._isStartOf(txt0, i, "XXX", false)) {
                txt = txt.substring(0, 0 + i) + txt.substring(i + 3);
                txt0 = txt.toUpperCase();
                continue;
            }
            let tn = CorrectionHelper.m_Root.find(txt0, i);
            if (tn === null) 
                continue;
            let j = i + tn.len;
            let ok = false;
            if (tn.len === 2 && txt0[i] === 'У' && txt0[i + 1] === 'Л') 
                continue;
            if (tn.len === 2 && txt0[i] === 'С' && txt0[i + 1] === 'Т') 
                continue;
            if ((tn.len === 3 && txt0[i] === 'П' && txt0[i + 1] === 'Е') && txt0[i + 2] === 'Р') 
                continue;
            for (; j < txt0.length; j++) {
                if (txt0[j] === '.' || txt0[j] === ' ') 
                    ok = true;
                else 
                    break;
            }
            if (j >= txt0.length || !ok || tn.corrs === null) 
                continue;
            for (const kp of tn.corrs.entries) {
                if (!CorrectionHelper._isStartOf(txt0, j, kp.key, false)) 
                    continue;
                if (tn.len === 8 && CorrectionHelper._isStartOf(txt0, i, "НОВГОРОД", false)) 
                    continue;
                if (tn.len === 2 && CorrectionHelper._isStartOf(txt0, i, "ПР", false)) 
                    continue;
                let tmp = new StringBuilder(txt);
                tmp.remove(i, tn.len);
                if (tmp.charAt(i) === '.') 
                    tmp.remove(i, 1);
                tmp.insert(i, kp.value + " ");
                txt = tmp.toString();
                txt0 = txt.toUpperCase();
                break;
            }
        }
        for (let i = 0; i < txt.length; i++) {
            if (!Utils.isLetter(txt[i]) && txt[i] !== '-') {
                let city = txt.substring(0, 0 + i);
                if (RegionHelper.isBigCity(city) === null) 
                    continue;
                let ok = false;
                for (let j = i; j < txt.length; j++) {
                    if (Utils.isWhitespace(txt[j])) 
                        continue;
                    if (txt[j] === 'г' || txt[j] === 'Г') 
                        ok = true;
                    break;
                }
                if (!ok) 
                    txt = ("г." + txt.substring(0, 0 + i) + "," + txt.substring(i));
                break;
            }
        }
        for (let i = 0; i < txt.length; i++) {
            if (txt[i] === ' ') {
                if (CorrectionHelper._isStartOf(txt, i + 1, "филиал", false) || CorrectionHelper._isStartOf(txt, i + 1, "ФИЛИАЛ", false)) {
                    let reg = txt.substring(0, 0 + i);
                    let city = null;
                    let tn = CorrectionHelper.m_Root.find(reg.toUpperCase(), 0);
                    if (tn !== null && tn.corrs !== null) {
                        for (const kp of tn.corrs.entries) {
                            if (kp.key === "ОБ") {
                                let nam = kp.value;
                                reg = nam + " область";
                                let r = RegionHelper.findRegionByAdj(nam);
                                if (r !== null && r.capital !== null) 
                                    city = r.capital;
                                break;
                            }
                        }
                    }
                    if (city !== null) 
                        secondVar.value = ("г." + city + ", " + txt.substring(i + 7));
                    let txt1 = (reg + ", " + txt.substring(i + 7));
                    txt = txt1;
                }
                break;
            }
        }
        txt0 = txt.toUpperCase();
        if (CorrectionHelper._isStartOf(txt0, 0, "ФИЛИАЛ ", false)) 
            txt = txt.substring(7);
        if (txt.length > 10 && txt[0] === 'г' && txt[1] === ',') 
            txt = "г." + txt.substring(2);
        if (txt.length < 20) 
            return txt;
        if (Utils.isLetter(txt[txt.length - 1])) {
            for (let i = txt.length - 7; i > 10; i--) {
                if (Utils.isLetter(txt[i])) {
                    if (txt[i - 1] === '.' && Utils.isUpperCase(txt[i]) && (txt.charCodeAt(i)) > 0x80) {
                        if (txt[i + 1] === '.') 
                            continue;
                        if (Utils.isUpperCase(txt[i - 2])) 
                            continue;
                        let hasCap = false;
                        for (let j = i - 3; j > 10; j--) {
                            if (txt[j] === ',') {
                                let p0 = txt.substring(0, 0 + j + 1);
                                let p1 = txt.substring(i);
                                let p2 = txt.substring(j + 1, j + 1 + i - j - 2);
                                txt = (p0 + p1 + "," + p2);
                                break;
                            }
                            else if (!hasCap && !Utils.isLetter(txt[j]) && Utils.isLetter(txt[j + 1])) {
                                if (!Utils.isUpperCase(txt[j + 1])) 
                                    break;
                                hasCap = true;
                            }
                        }
                        break;
                    }
                }
                else 
                    break;
            }
        }
        return txt;
    }
    
    static _isStartOf(txt, i, sub, checkNonLetSurr = false) {
        let noCasesens = false;
        if (i > 0 && txt[i - 1] === ' ') 
            noCasesens = true;
        for (let j = 0; j < sub.length; j++) {
            if ((i + j) >= txt.length) 
                return false;
            else if (sub[j] === txt[i + j]) {
            }
            else if (noCasesens && sub[j].toUpperCase() === txt[i + j].toUpperCase()) {
            }
            else 
                return false;
        }
        if (checkNonLetSurr) {
            if (i > 0 && Utils.isLetter(txt[i - 1])) 
                return false;
            if (((i + sub.length) < txt.length) && Utils.isLetter(txt[i + sub.length])) 
                return false;
        }
        return true;
    }
    
    static initialize() {
        CorrectionHelper.m_Root = new AbbrTreeNode();
        for (const r of RegionHelper.REGIONS) {
            let a = Utils.as(r.attrs, AreaAttributes);
            if (a === null) 
                continue;
            if (a.types.length === 0 || a.types.includes("город")) 
                continue;
            if (a.names.length === 0) 
                continue;
            if (a.types[0] === "республика") 
                CorrectionHelper._add(a.names[0], "респ");
            else if (a.types[0] === "край") {
                CorrectionHelper._add(a.names[0], "кр");
                if (a.names[0].endsWith("ий")) 
                    CorrectionHelper._add(a.names[0].substring(0, 0 + a.names[0].length - 2) + "ая", "об");
            }
            else if (a.types[0] === "область") {
                CorrectionHelper._add(a.names[0], "об");
                if (a.names[0].endsWith("ая")) 
                    CorrectionHelper._add(a.names[0].substring(0, 0 + a.names[0].length - 2) + "ий", "р");
            }
            else if (a.types[0] === "автономная область") {
                CorrectionHelper._add(a.names[0], "об");
                CorrectionHelper._add(a.names[0], "ао");
            }
            else if (a.types[0] === "автономный округ") {
                CorrectionHelper._add(a.names[0], "ок");
                CorrectionHelper._add(a.names[0], "ао");
            }
            else if (a.types[0] === "город") 
                CorrectionHelper._add(a.names[0], "г");
            else {
            }
        }
    }
    
    static initialize0() {
        let dat = PullentiAddressInternalResourceHelper.getString("CitiesNonRus.txt");
        let country = null;
        for (const line of Utils.splitString(dat, '\n', false)) {
            if (line.startsWith("//")) 
                continue;
            if (line.startsWith("*")) {
                let aa = new AreaAttributes();
                country = AddrObject._new118(aa, AddrLevel.COUNTRY);
                aa.names.push(line.substring(1).trim());
                continue;
            }
            if (country === null) 
                continue;
            for (const v of Utils.splitString(line, ';', false)) {
                let city = v.toUpperCase().trim();
                if (Utils.isNullOrEmpty(city)) 
                    continue;
                if (!CorrectionHelper.m_Cities.containsKey(city)) 
                    CorrectionHelper.m_Cities.put(city, country);
            }
        }
    }
    
    static findCountry(obj) {
        let aa = Utils.as(obj.attrs, AreaAttributes);
        if (aa === null) 
            return null;
        let res = null;
        for (const nam of aa.names) {
            let wrapres122 = new RefOutArgWrapper();
            let inoutres123 = CorrectionHelper.m_Cities.tryGetValue(nam.toUpperCase(), wrapres122);
            res = wrapres122.value;
            if (inoutres123) 
                return res;
        }
        return null;
    }
    
    static _add(corr, typ) {
        typ = typ.toUpperCase();
        corr = corr.toUpperCase();
        for (let i = 1; i < (corr.length - 2); i++) {
            if (!LanguageHelper.isCyrillicVowel(corr[i])) {
                let str = corr.substring(0, 0 + i + 1);
                if (RegionHelper.isBigCity(str) !== null) {
                }
                else 
                    CorrectionHelper.m_Root.add(str, 0, corr, typ);
            }
        }
    }
    
    static correctCountry(addr) {
        if (addr.items.length === 0) 
            return;
        if (addr.items[0].level === AddrLevel.COUNTRY) 
            return;
        if (addr.items[0].gars.length === 0) 
            return;
        let reg = addr.items[0].gars[0].regionNumber;
        if ((reg === 90 || reg === 93 || reg === 94) || reg === 95) 
            addr.items.splice(0, 0, CorrectionHelper.createCountry("UA", null));
        else 
            addr.items.splice(0, 0, CorrectionHelper.createCountry("RU", null));
    }
    
    static createCountry(alpha, geo) {
        let aa = new AreaAttributes();
        if (alpha === "RU") 
            aa.names.push("Россия");
        else if (alpha === "UA") 
            aa.names.push("Украина");
        else if (alpha === "BY") 
            aa.names.push("Белоруссия");
        else if (alpha === "KZ") 
            aa.names.push("Казахстан");
        else if (alpha === "MD") 
            aa.names.push("Молдавия");
        else if (alpha === "GE") 
            aa.names.push("Грузия");
        else if (alpha === "AZ") 
            aa.names.push("Азербайджан");
        else if (alpha === "AM") 
            aa.names.push("Армения");
        else if (geo !== null) 
            aa.names.push(geo.toString());
        else 
            return null;
        let res = new AddrObject(aa);
        res.level = AddrLevel.COUNTRY;
        return res;
    }
    
    static static_constructor() {
        CorrectionHelper.m_Root = null;
        CorrectionHelper.m_Cities = new Hashtable();
    }
}


CorrectionHelper.static_constructor();

module.exports = CorrectionHelper