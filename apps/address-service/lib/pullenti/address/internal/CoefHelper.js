/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const GarLevel = require("./../GarLevel");
const NameAnalyzer = require("./NameAnalyzer");
const DetailType = require("./../DetailType");
const RegionHelper = require("./RegionHelper");
const AddrLevel = require("./../AddrLevel");
const HouseAttributes = require("./../HouseAttributes");
const AddressHelper = require("./../AddressHelper");
const AreaAttributes = require("./../AreaAttributes");
const GarHelper = require("./GarHelper");
const AddressService = require("./../AddressService");

class CoefHelper {
    
    static calcCoef(ah, res, one, txt, unknownNames) {
        if (one) 
            res.text = txt;
        else if (res.endChar > 0 && (res.endChar < txt.length)) 
            res.text = txt.substring(res.beginChar, res.beginChar + (res.endChar + 1) - res.beginChar);
        let dcoef = 100;
        let hasManyGars = false;
        let otherCountry = false;
        let msg = null;
        if (res.errorMessage !== null) {
            if (!res.errorMessage.startsWith("Смена")) 
                dcoef = 90;
            msg = new StringBuilder();
            msg.append(res.errorMessage);
        }
        for (let j = 0; j < res.items.length; j++) {
            let it = res.items[j];
            let noMsg = false;
            if (j === 0 && AddressHelper.compareLevels(it.level, AddrLevel.CITY) > 0) {
                dcoef /= (2);
                noMsg = true;
                if (msg === null) 
                    msg = new StringBuilder();
                msg.append("Первый объект '").append(it.toString()).append("' слишком низкого уровня (").append(AddressHelper.getAddrLevelString(it.level)).append("). ");
            }
            if ((j + 1) < res.items.length) {
                if (!it.canBeParentFor(res.items[j + 1], (j > 0 ? res.items[j - 1] : null))) {
                    let it1 = res.items[j + 1];
                    if (it.level === AddrLevel.DISTRICT && it1.level === AddrLevel.DISTRICT) {
                        if (it1.gars.length > 0) {
                            if (msg === null) 
                                msg = new StringBuilder();
                            msg.append("Объект '").append(it.toString()).append("' указан в адресе неправильно. ");
                            dcoef *= 0.9;
                            res.items.splice(j, 1);
                            j--;
                            continue;
                        }
                    }
                    if (((it.level === AddrLevel.CITY || it.level === AddrLevel.DISTRICT)) && it1.level === AddrLevel.DISTRICT) {
                        if (it1.gars.length === 0) {
                            res.items.splice(j + 1, 1);
                            j--;
                            continue;
                        }
                    }
                    if (it.level === AddrLevel.REGIONAREA && it1.level === AddrLevel.LOCALITY && it1.attrs.types.includes("город")) 
                        it1.level = AddrLevel.CITY;
                    else if (it.level === AddrLevel.BUILDING && it1.level === AddrLevel.BUILDING) {
                    }
                    else if (it1.gars.length <= 1) {
                        dcoef /= (2);
                        noMsg = true;
                        if (msg === null) 
                            msg = new StringBuilder();
                        msg.append("Объект '").append(it.toString()).append("' не может быть родителем для '").append(it1.toString()).append("'. ");
                    }
                }
            }
            if (GarHelper.GAR_INDEX === null) 
                continue;
            if (it.level === AddrLevel.ROOM || it.level === AddrLevel.CITYDISTRICT) 
                continue;
            let par = (j > 0 ? res.items[j - 1] : null);
            if (it.gars.length === 0) {
                if (j === 0 && it.level === AddrLevel.COUNTRY) {
                    otherCountry = true;
                    continue;
                }
                if (it.isReconstructed) 
                    continue;
                if (otherCountry) 
                    continue;
                if (((par !== null && par.gars.length > 0 && it.level === par.level) && it.level !== AddrLevel.TERRITORY && it.level !== AddrLevel.DISTRICT) && it.level !== AddrLevel.BUILDING) {
                    res.items.splice(j, 1);
                    j--;
                    continue;
                }
                if (par !== null) {
                    if (par.gars.length === 0 && par.level !== AddrLevel.DISTRICT) 
                        continue;
                    if (par.gars.length > 0 && par.gars[0].expired) {
                        if (it.level !== AddrLevel.STREET && it.level !== AddrLevel.TERRITORY) 
                            continue;
                    }
                    let ha = Utils.as(it.attrs, HouseAttributes);
                    if (ha !== null && ha.number !== null) {
                        if (ha.number === "б/н") 
                            continue;
                    }
                }
                let not = false;
                if (AddressHelper.compareLevels(it.level, AddrLevel.PLOT) >= 0) {
                    if (par !== null && par.gars.length === 1 && par.gars[0].childrenCount === 0) {
                    }
                    else if (it.level === AddrLevel.APARTMENT) {
                    }
                    else if (it.level === AddrLevel.BUILDING || it.level === AddrLevel.PLOT) {
                        not = true;
                        if (par !== null && par.gars.length > 0) {
                            if (par.level === AddrLevel.REGIONCITY) 
                                dcoef *= 0.9;
                        }
                    }
                    else {
                        dcoef *= 0.9;
                        not = true;
                    }
                }
                else if (AddressHelper.compareLevels(it.level, AddrLevel.TERRITORY) >= 0) {
                    let aa = Utils.as(it.attrs, AreaAttributes);
                    if (it.level === AddrLevel.STREET && ((((aa.types.includes("блок") || aa.types.includes("линия") || aa.types.includes("ряд")) || aa.types.includes("очередь") || aa.types.includes("поле")) || aa.types.includes("куст")))) {
                    }
                    else if (it.level === AddrLevel.TERRITORY && (((aa.miscs.includes("дорога") || aa.miscs.includes("лесничество") || aa.miscs.includes("месторождение")) || aa.miscs.includes("участок")))) {
                    }
                    else if (it.level === AddrLevel.STREET && aa.names.length === 0 && aa.number !== null) {
                    }
                    else if ((par !== null && ((it.level === AddrLevel.TERRITORY || ((it.level === AddrLevel.STREET && ((par.level === AddrLevel.LOCALITY || par.level === AddrLevel.CITY)))))) && par.gars.length > 0) && par.gars[0].expired) {
                    }
                    else if (j > 0 && it.level === AddrLevel.TERRITORY && res.items[j - 1].detailTyp !== DetailType.UNDEFINED) {
                    }
                    else if (((j + 1) < res.items.length) && res.items[j + 1].level === AddrLevel.TERRITORY && res.items[j + 1].gars.length > 0) {
                    }
                    else if (((j + 1) < res.items.length) && res.items[j + 1].level === AddrLevel.STREET && res.items[j + 1].gars.length === 1) {
                    }
                    else if (it.level === AddrLevel.TERRITORY && ((aa.miscs.includes("ВЧ") || aa.miscs.includes("ПЧ") || aa.miscs.includes("военный городок")))) {
                    }
                    else if (par !== null && par.gars.length > 0 && ((par.level === AddrLevel.TERRITORY || par.level === AddrLevel.LOCALITY))) {
                        let ok = par.gars[0].expired;
                        if (ok || par.gars[0].childrenCount === 0) 
                            ok = true;
                        else if (((j + 1) < res.items.length) && res.items[j + 1].gars.length === 1) 
                            ok = true;
                        else if (par.gars.length === 1) {
                            if (!par.attrs.hasEqualType(par.gars[0].attrs.types)) {
                            }
                            else {
                                ok = true;
                                let chis = AddressService.getObjects(par.gars[0].id, true);
                                if (chis !== null && chis.length > 0) 
                                    ok = false;
                            }
                        }
                        if (!ok) 
                            dcoef *= 0.8;
                    }
                    else 
                        dcoef *= 0.8;
                    not = true;
                }
                else if (((it.level === AddrLevel.LOCALITY || it.level === AddrLevel.SETTLEMENT)) && par !== null && par.gars.length === 1) {
                    if (((j + 1) < res.items.length) && res.items[j + 1].gars.length > 0 && res.items[j].detailTyp !== DetailType.UNDEFINED) {
                    }
                    else if (((j + 1) < res.items.length) && res.items[j + 1].gars.length === 1 && ((res.items[j + 1].level === AddrLevel.LOCALITY || res.items[0].level === AddrLevel.REGIONCITY))) {
                    }
                    else if (((!ah.createAltsRegime && it.level === AddrLevel.LOCALITY && ((j + 1) < res.items.length)) && res.items[j + 1].gars.length === 1 && j > 0) && res.items[j - 1].level === AddrLevel.CITY && res.items[j - 1].gars.length === 1) {
                    }
                    else 
                        dcoef *= 0.7;
                    not = true;
                }
                else if ((j > 0 && it.level === AddrLevel.DISTRICT && ((j + 1) < res.items.length)) && res.items[j + 1].gars.length > 0) {
                }
                else if ((j > 0 && ((j + 1) < res.items.length) && RegionHelper.isBigCityA(it) !== null) && res.items[j + 1].gars.length > 0) {
                    res.items.splice(j, 1);
                    j--;
                    continue;
                }
                else {
                    dcoef *= 0.6;
                    not = true;
                }
                if (not && !noMsg) {
                    if (msg === null) 
                        msg = new StringBuilder();
                    msg.append("Объект '").append(it.toString()).append("' не привязался к ГАР. ");
                }
                continue;
            }
            if ((j + 1) < res.items.length) {
                let it1 = res.items[j + 1];
                if (it1.gars.length > 0 && (it.attrs instanceof AreaAttributes) && (it1.attrs instanceof AreaAttributes)) {
                    let aa = Utils.as(it.attrs, AreaAttributes);
                    let aa1 = Utils.as(it1.attrs, AreaAttributes);
                    let ok = false;
                    for (const g of it1.gars) {
                        if (it.findGarByIds(g.parentIds) !== null) 
                            ok = true;
                        else if (g.parentIds.length > 0) {
                            let pp = ah.getGarObject(g.parentIds[0]);
                            if (pp !== null) {
                                if (it.findGarByIds(pp.parentIds) !== null) 
                                    ok = true;
                            }
                        }
                    }
                    if (!ok && it.level === AddrLevel.DISTRICT && it1.level === AddrLevel.CITY) {
                        if (aa.names.length > 0 && aa1.names.length > 0 && aa1.names[0].length > 3) {
                            if (aa.names[0].startsWith(aa1.names[0].substring(0, 0 + 3))) 
                                ok = true;
                        }
                        if (!ok && ((j + 2) < res.items.length)) {
                            let it2 = res.items[j + 2];
                            if (it2.level === AddrLevel.LOCALITY || it2.level === AddrLevel.CITY || it2.level === AddrLevel.SETTLEMENT) {
                                for (const g of it2.gars) {
                                    if (it.findGarByIds(g.parentIds) !== null) 
                                        ok = true;
                                }
                                if (ok) {
                                    res.items.splice(j + 1, 1);
                                    it1 = it2;
                                }
                            }
                        }
                    }
                    if (!ok && ((it.level === AddrLevel.DISTRICT || (((it.tag instanceof NameAnalyzer) && it.tag.level === AddrLevel.DISTRICT)))) && ((it1.level === AddrLevel.STREET || it1.level === AddrLevel.CITY))) {
                        res.items.splice(j, 1);
                        j--;
                        continue;
                    }
                    if ((!ok && it.level === AddrLevel.CITY && ((it1.level === AddrLevel.LOCALITY || it1.level === AddrLevel.TERRITORY))) && j > 0) {
                        let it0 = res.items[j - 1];
                        let aa0 = Utils.as(it0.attrs, AreaAttributes);
                        if (it0.level === AddrLevel.DISTRICT) {
                            for (const g of it1.gars) {
                                if (it0.findGarByIds(g.parentIds) !== null) 
                                    ok = true;
                            }
                            if (ok) {
                                res.items.splice(j, 1);
                                j--;
                                continue;
                            }
                        }
                    }
                    if (!ok && it.level === AddrLevel.LOCALITY && ((it1.level === AddrLevel.TERRITORY || it1.level === AddrLevel.STREET))) {
                        for (const g of it1.gars) {
                            let p = ah.getGarObject((g.parentIds.length > 0 ? g.parentIds[0] : null));
                            if (p !== null && it.findGarByIds(p.parentIds) !== null) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (!ok && it.level === AddrLevel.TERRITORY && it1.level === AddrLevel.STREET) 
                        ok = true;
                    if (!ok && it.level === AddrLevel.LOCALITY && it1.level === AddrLevel.LOCALITY) {
                        if (it.gars.length > 0 && it1.findGarById(it.gars[0].id) !== null) 
                            ok = true;
                    }
                    if (!ok && it1.gars.length > 1) 
                        ok = true;
                    else if ((!ok && it1.gars.length === 1 && it.gars.length > 0) && it.gars[0].expired) 
                        ok = true;
                    else if (it.detailTyp !== DetailType.UNDEFINED) 
                        ok = true;
                    else if (it.level === it1.level && it.level === AddrLevel.LOCALITY && res.additionalItems === null) {
                        let kk = 0;
                        for (kk = j + 1; kk < res.items.length; kk++) {
                            if (res.items[kk].level !== AddrLevel.LOCALITY) 
                                break;
                        }
                        if (kk >= res.items.length) {
                            ok = true;
                            res.additionalItems = new Array();
                            for (kk = j + 1; kk < res.items.length; kk++) {
                                res.additionalItems.push(res.items[kk]);
                            }
                            res.items.splice(j + 1, res.items.length - j - 1);
                        }
                    }
                    if (!ok) {
                        if ((it.level === AddrLevel.DISTRICT && j === 1 && ((res.items[0].level === AddrLevel.REGIONAREA || res.items[0].level === AddrLevel.REGIONCITY))) && it1.gars.length > 0 && (((it1.level === AddrLevel.CITY || it1.level === AddrLevel.DISTRICT || it1.level === AddrLevel.SETTLEMENT) || ((it1.level === AddrLevel.LOCALITY && it1.gars.length === 1))))) {
                        }
                        else if (it.level === AddrLevel.TERRITORY && it1.level === AddrLevel.TERRITORY) {
                        }
                        else 
                            dcoef *= 0.9;
                        if (!noMsg) {
                            if (msg === null) 
                                msg = new StringBuilder();
                            msg.append("Похоже, объект '").append(it.toString()).append("' указан в адресе неправильно. ");
                        }
                    }
                }
            }
            if (it.level === AddrLevel.TERRITORY && it.gars[0].level === GarLevel.STREET) {
                if ((j + 1) === res.items.length || AddressHelper.compareLevels(res.items[j + 1].level, AddrLevel.STREET) > 0) 
                    it.level = AddrLevel.STREET;
            }
            if (it.gars.length === 1 || it.gars[1].expired) 
                continue;
            if (AddressHelper.compareLevels(it.level, AddrLevel.BUILDING) >= 0) 
                continue;
            let pars = new Array();
            let hasPar = false;
            for (const pid of it.gars[0].parentIds) {
                let kk = 0;
                for (kk = 1; kk < it.gars.length; kk++) {
                    if (!it.gars[kk].parentIds.includes(pid)) 
                        break;
                }
                if (kk >= it.gars.length) {
                    hasPar = true;
                    break;
                }
            }
            if (!hasPar) {
                for (const g of it.gars) {
                    let id = (g.parentIds.length > 0 ? g.parentIds[0] : null);
                    if (g.parentIds.length > 1 && j > 0 && res.items[j - 1].findGarById(g.parentIds[1]) !== null) 
                        id = g.parentIds[1];
                    if (id !== null && !pars.includes(id)) 
                        pars.push(id);
                }
            }
            let co = 1 / ((pars.length === 0 ? 1 : pars.length));
            if (pars.length > 1) {
                if (pars.length === 2) 
                    co = 0.9;
                else if (pars.length === 3) 
                    co = 0.8;
                else 
                    co = 0.7;
                let nams = new Array();
                let pars2 = new Array();
                for (const p of pars) {
                    let oo = null;
                    if (par !== null) 
                        oo = par.findGarById(p);
                    if (oo === null) 
                        oo = ah.getGarObject(p);
                    if (oo === null) 
                        continue;
                    let ss = oo.toString().toUpperCase();
                    if (ss.indexOf('Ё') >= 0) 
                        ss = Utils.replaceString(ss, 'Ё', 'Е');
                    if (!nams.includes(ss)) 
                        nams.push(ss);
                    let pp = (oo.parentIds.length > 0 ? oo.parentIds[0] : "");
                    if (!pars2.includes(pp)) 
                        pars2.push(pp);
                    if (nams.length > 1 || pars2.length > 1) 
                        break;
                }
                if (nams.length === 1 && pars2.length === 1) 
                    co = 1;
                else {
                    if (msg === null) 
                        msg = new StringBuilder();
                    msg.append("К объекту '").append(it.toString()).append("' привязались ").append(it.gars.length).append(" разные объекта ГАР. ");
                    if (hasManyGars) 
                        co = 1;
                    hasManyGars = true;
                }
            }
            dcoef *= co;
        }
        if (res.additionalItems !== null) {
            let li = new Array();
            for (const ai of res.additionalItems) {
                if (ai.gars.length === 0) 
                    li.push(ai);
            }
            if (li.length > 0) {
                if (msg === null) 
                    msg = new StringBuilder();
                if (li.length === 1) 
                    msg.append("Объект '").append(li[0].toString()).append("' не привязался к ГАР. ");
                else {
                    msg.append("Объекты ");
                    for (const o of li) {
                        if (o !== li[0]) 
                            msg.append(", ");
                        msg.append("'").append(o.toString()).append("'");
                    }
                    msg.append(" не привязались к ГАР. ");
                }
            }
        }
        for (let j = 0; j < (res.items.length - 1); j++) {
            let it = res.items[j];
            if (it.level !== AddrLevel.DISTRICT || res.items[j + 1].level !== AddrLevel.CITY) 
                continue;
            let aa = Utils.as(it.attrs, AreaAttributes);
            let isCityDistr = false;
            if (it.gars.length === 0) {
                if (aa.types.includes("район")) 
                    isCityDistr = true;
            }
            else {
                let ga = Utils.as(it.gars[0].attrs, AreaAttributes);
                if (ga.types.length > 0 && ga.types[0].includes("внутригородск")) 
                    isCityDistr = true;
            }
            if (isCityDistr) {
                it.level = AddrLevel.CITYDISTRICT;
                res.items.splice(j, 1);
                res.items.splice(j + 1, 0, it);
            }
            break;
        }
        let totalChar = 0;
        let notChar = 0;
        let max = (txt === null ? 0 : txt.length);
        let i = 0;
        if (one && txt !== null) {
            if (res.beginChar > 0) {
                let sub = txt.substring(0, 0 + res.beginChar).trim().toUpperCase();
                if (sub.endsWith(",")) 
                    sub = sub.substring(0, 0 + sub.length - 1).trim();
                let rest = txt.substring(res.beginChar);
                if (rest.toUpperCase().includes(sub)) 
                    res.beginChar = 0;
                else if (res.toString().toUpperCase().includes(sub)) 
                    res.beginChar = 0;
                else if (dcoef === 100) 
                    res.beginChar = 0;
            }
            if ((((i = txt.indexOf("дом,корпус,кв.")))) > 0) 
                max = i;
            if ((((i = txt.indexOf("ТП-")))) > 0 && (i < max)) 
                max = i;
            if ((((i = txt.indexOf("РП-")))) > 0 && (i < max)) 
                max = i;
            if ((((i = txt.indexOf("ВЛ-")))) > 0 && (i < max)) 
                max = i;
            if ((((i = txt.indexOf("КЛ-")))) > 0 && (i < max)) 
                max = i;
            if ((((i = txt.indexOf("КТПН-")))) > 0 && (i < max)) 
                max = i;
            for (i = max - 1; i > 0; i--) {
                if ((Utils.isWhitespace(txt[i]) || txt[i] === ',' || txt[i] === '-') || txt[i] === '.') 
                    max = i;
                else 
                    break;
            }
            for (i = 0; i < max; i++) {
                if (CoefHelper._startsWith(txt, i, "РФ")) {
                    i += 2;
                    continue;
                }
                if (CoefHelper._startsWith(txt, i, "РОССИЯ")) {
                    i += 6;
                    continue;
                }
                if (CoefHelper._startsWith(txt, i, "Г ")) {
                    i += 2;
                    continue;
                }
                if (CoefHelper._startsWith(txt, i, "Г.")) {
                    i += 2;
                    continue;
                }
                if (Utils.isLetter(txt[i])) 
                    break;
            }
            let i0 = i;
            if (max > 10 && txt[max - 1] === '0') {
                for (let ii = max - 2; ii > 0; ii--) {
                    if (Utils.isLetterOrDigit(txt[ii])) 
                        break;
                    else if (txt[ii] === ' ' || txt[ii] === ',') {
                        max = ii;
                        break;
                    }
                }
            }
            if (max > 10) {
                for (let ii = max - 1; ii > 4; ii--) {
                    if (txt[ii].toUpperCase() === 'Т' && txt[ii - 1].toUpperCase() === 'Е' && txt[ii - 2].toUpperCase() === 'Н') {
                        max = ii - 2;
                        ii -= 3;
                    }
                    else if ((txt[ii].toUpperCase() === 'П' && txt[ii - 1].toUpperCase() === 'Р' && txt[ii - 2].toUpperCase() === 'О') && txt[ii - 2].toUpperCase() === 'К') {
                        max = ii - 3;
                        ii -= 4;
                    }
                    else if (txt[ii].toUpperCase() === 'Р' && txt[ii - 1].toUpperCase() === 'О' && txt[ii - 2].toUpperCase() === 'К') {
                        max = ii - 2;
                        ii -= 3;
                    }
                    else if (txt[ii].toUpperCase() === 'В' && txt[ii - 1].toUpperCase() === 'К') {
                        max = ii - 1;
                        ii -= 2;
                    }
                    else if (txt[ii].toUpperCase() === 'Л' && txt[ii - 1].toUpperCase() === 'У' && !Utils.isLetter(txt[ii - 2])) {
                        max = ii - 1;
                        ii -= 2;
                    }
                    else if (((txt[ii] === ' ' || txt[ii] === '.' || txt[ii] === ';') || txt[ii] === ',' || txt[ii] === '-') || txt[ii] === '\\' || txt[ii] === '/') 
                        max = ii;
                    else if (txt[ii] === '0' && !Utils.isLetterOrDigit(txt[ii - 1])) 
                        max = ii;
                    else if (txt[ii].toUpperCase() === 'Д' && !Utils.isLetterOrDigit(txt[ii - 1])) 
                        max = ii;
                    else 
                        break;
                }
            }
            if ((res.endChar + 1) < max) {
                let fff = txt.substring(res.endChar + 1, res.endChar + 1 + max - res.endChar - 1).trim();
                let aa = null;
                if (res.lastItem !== null) 
                    aa = Utils.as(res.lastItem.attrs, AreaAttributes);
                if (aa !== null && aa.types.length > 0 && Utils.startsWithString(aa.types[0], fff, true)) 
                    res.endChar = max - 1;
            }
            for (; i < max; i++) {
                if (Utils.isLetterOrDigit(txt[i])) {
                    totalChar++;
                    if ((i < res.beginChar) || i > res.endChar) 
                        notChar++;
                }
            }
            let notChangeCoef = false;
            if (((res.endChar + 1) < max) && res.errorMessage === null) {
                if (msg === null) 
                    msg = new StringBuilder();
                if (i0 < res.beginChar) 
                    msg.append("Непонятные фрагменты: '").append(txt.substring(i0, i0 + res.beginChar - i0).trim()).append("' и '").append(txt.substring(res.endChar + 1, res.endChar + 1 + max - res.endChar - 1).trim()).append("'. ");
                else {
                    let ppp = txt.substring(res.endChar + 1, res.endChar + 1 + max - res.endChar - 1).trim();
                    if (ppp.startsWith(",")) 
                        ppp = ppp.substring(1).trim();
                    if (Utils.isNullOrEmpty(ppp)) 
                        notChangeCoef = true;
                    else if (Utils.startsWithString(ppp, "номер учетной", true)) 
                        notChangeCoef = true;
                    else {
                        msg.append("Непонятный фрагмент: '").append(ppp).append("'. ");
                        if (ppp[0] === '/' || ppp[0] === '\\') 
                            ppp = ppp.substring(1).trim();
                        if (Utils.startsWithString(ppp, "ММ", true) || Utils.startsWithString(ppp, "MM", true)) 
                            notChangeCoef = true;
                    }
                }
            }
            else if (i0 < res.beginChar) {
                if (msg === null) 
                    msg = new StringBuilder();
                msg.append("Непонятный фрагмент: '").append(txt.substring(i0, i0 + res.beginChar - i0).trim()).append("'. ");
            }
            if (totalChar > 0 && notChar > 0 && !notChangeCoef) {
                if ((notChar < 4) && AddressHelper.compareLevels(res.lastItem.level, AddrLevel.PLOT) >= 0) {
                }
                else 
                    dcoef *= (((totalChar - notChar)) / (totalChar));
            }
        }
        if (unknownNames !== null && unknownNames.length > 0) {
            let all = res.toString().toUpperCase();
            for (let k = unknownNames.length - 1; k >= 0; k--) {
                if (all.includes(unknownNames[k].toUpperCase())) 
                    unknownNames.splice(k, 1);
            }
            if (unknownNames.length > 0) {
                if (dcoef === 100 && unknownNames.length === 1 && Utils.startsWithString(res.text, unknownNames[0], true)) {
                }
                else 
                    dcoef *= 0.8;
                if (msg === null) 
                    msg = new StringBuilder();
                if (unknownNames.length === 1) 
                    msg.append("Непонятный объект: '").append(unknownNames[0]).append("'");
                else 
                    msg.append("Непонятные объекты: '").append(unknownNames[0]).append("'");
                for (let k = 1; k < unknownNames.length; k++) {
                    msg.append(", '").append(unknownNames[k]).append("'");
                }
                msg.append(". ");
            }
        }
        res.coef = Math.floor(dcoef);
        if (msg !== null) 
            res.errorMessage = msg.toString().trim();
        return res;
    }
    
    static _startsWith(txt, i, sub) {
        for (let j = 0; j < sub.length; j++) {
            if ((i + j) >= txt.length) 
                return false;
            if (txt[i + j].toUpperCase() !== sub[j].toUpperCase()) 
                return false;
        }
        return true;
    }
}


module.exports = CoefHelper