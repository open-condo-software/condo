/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const AddrLevel = require("./../AddrLevel");
const AreaAttributes = require("./../AreaAttributes");
const NameAnalyzer = require("./NameAnalyzer");
const GarHelper = require("./GarHelper");
const AddressService = require("./../AddressService");
const SearchParams = require("./../SearchParams");

class RestructHelper {
    
    static initialize() {
        
    }
    
    static getMoscow() {
        if (RestructHelper.m_Moscow !== null) 
            return RestructHelper.m_Moscow;
        let sp = new SearchParams();
        sp.city = "Москва";
        sp.region = 77;
        let sr = AddressService.searchObjects(sp);
        if (sr.objects.length !== 1) 
            return null;
        RestructHelper.m_Moscow = sr.objects[0];
        return RestructHelper.m_Moscow;
    }
    
    static restruct(ah, addr, i) {
        if (i === 0) 
            return false;
        let it0 = addr.items[0];
        if (it0.gars.length === 0) 
            return false;
        let reg = it0.gars[0].regionNumber;
        let it = addr.items[i];
        let it1 = addr.items[i - 1];
        if (reg === 50 && it.level === AddrLevel.CITY && it.attrs.names.includes("Юбилейный")) {
            let txt = "область Московская, городской округ Королёв, город Королёв, микрорайон Юбилейный";
            let addr1 = AddressService.processSingleAddressText(txt, null);
            if (addr1 === null || addr1.coef !== 100) 
                return false;
            addr.errorMessage = ("Смена объекта: '" + it.toString() + "' на '" + addr1.lastItem.toString() + "'. ");
            addr.items.splice(0, i + 1);
            if (addr1.items[0].level === AddrLevel.COUNTRY) 
                addr1.items.splice(0, 1);
            addr.items.splice(0, 0, ...addr1.items);
            return true;
        }
        if (reg === 50 && (((it.level === AddrLevel.CITY || it.level === AddrLevel.LOCALITY || it.level === AddrLevel.SETTLEMENT) || ((it.level === AddrLevel.STREET && i === 1))))) {
            let mos = RestructHelper.getMoscow();
            if (mos === null) 
                return false;
            let pars = new Array();
            pars.push(Utils.parseInt(mos.id.substring(1)));
            let regs = new Array();
            regs.push(77);
            let r = Utils.as(it.tag, NameAnalyzer);
            let probs = GarHelper.GAR_INDEX.getStringEntries(r, regs, pars, 10);
            if (probs === null) 
                return false;
            let distr = null;
            if (it.level !== AddrLevel.LOCALITY) {
                if (probs.length !== 1) 
                    return false;
            }
            else {
                if (probs.length > 10) 
                    return false;
                let ok = false;
                for (const pr of probs) {
                    for (const pid of pr.parentIds) {
                        let par = AddressService.getObject(("a" + pid));
                        if (par === null) 
                            continue;
                        let paa = Utils.as(par.attrs, AreaAttributes);
                        if (paa.names.length === 0) 
                            continue;
                        let nam = paa.names[0];
                        if (nam.length < 4) 
                            continue;
                        for (let ii = 1; ii < i; ii++) {
                            let xaa = Utils.as(addr.items[ii].attrs, AreaAttributes);
                            if (xaa.names.length === 0) 
                                continue;
                            if (xaa.names[0].startsWith(nam.substring(0, 0 + 4))) {
                                ok = true;
                                break;
                            }
                            if (xaa.names.includes("Наро-Фоминский")) {
                                if (nam.includes("Маруш")) 
                                    ok = true;
                            }
                        }
                        if (ok) {
                            if (probs.length > 1) 
                                distr = GarHelper.createAddrObject(par);
                            break;
                        }
                    }
                    if (ok) 
                        break;
                }
                if (!ok) 
                    return false;
            }
            addr.errorMessage = ("Смена объекта: '" + it0.toString() + "' на '" + mos.toString() + "'. ");
            addr.items.splice(0, i);
            addr.items.splice(0, 0, GarHelper.createAddrObject(mos));
            if (distr !== null) 
                addr.items.splice(1, 0, distr);
            return true;
        }
        if ((reg === 72 && i === 1 && it.level === AddrLevel.DISTRICT) && ((it.attrs.names.includes("Янао") || it.attrs.names.includes("Югра")))) {
            addr.items.splice(0, 1);
            it.level = AddrLevel.REGIONAREA;
            return true;
        }
        if (reg === 72 && it.level === AddrLevel.CITY) {
            let regs = new Array();
            regs.push(86);
            regs.push(89);
            let r = Utils.as(it.tag, NameAnalyzer);
            let probs = GarHelper.GAR_INDEX.getStringEntries(r, regs, null, 10);
            if (probs !== null && probs.length === 1) {
                let _gar = AddressService.getObject(("a" + probs[0].id));
                if (_gar === null) 
                    return false;
                addr.errorMessage = ("Смена объекта: '" + it0.toString() + "' на регион " + probs[0].region + ". ");
                it.gars.push(_gar);
                addr.items.splice(0, i);
                return true;
            }
        }
        return false;
    }
    
    static static_constructor() {
        RestructHelper.m_Moscow = null;
    }
}


RestructHelper.static_constructor();

module.exports = RestructHelper