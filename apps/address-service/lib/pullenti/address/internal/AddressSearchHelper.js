/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const SearchLevel = require("./SearchLevel");
const AreaObject = require("./gar/AreaObject");
const GarLevel = require("./../GarLevel");
const SearchResult = require("./../SearchResult");
const AddrSearchFormal = require("./AddrSearchFormal");
const GarParam = require("./../GarParam");
const GarHelper = require("./GarHelper");
const SearchAddressItem = require("./SearchAddressItem");

class AddressSearchHelper {
    
    static search(sp) {
        let res = SearchResult._new83(sp);
        if (sp.paramTyp !== GarParam.UNDEFINED && !Utils.isNullOrEmpty(sp.paramValue)) {
            if (GarHelper.GAR_INDEX === null) 
                return null;
            let ids = GarHelper.GAR_INDEX.findByParam(sp.paramTyp, sp.paramValue);
            if (ids === null) 
                return res;
            res.totalCount = ids.length;
            for (let i = 0; i < ids.length; i++) {
                if (res.objects.length >= sp.maxCount) 
                    break;
                let id = ids[i];
                if ((((id) & 0x80000000)) === 0) {
                    let aa = GarHelper.createGarAById(id);
                    if (aa !== null) 
                        res.objects.push(aa);
                    continue;
                }
                if ((((id) & 0x40000000)) === 0) {
                    let ho = GarHelper.GAR_INDEX.getHouse(((id) & 0x3FFFFFFF));
                    let gh = GarHelper.createGarHouse(ho);
                    if (gh !== null) 
                        res.objects.push(gh);
                }
                else {
                    let ro = GarHelper.GAR_INDEX.getRoom(((id) & 0x3FFFFFFF));
                    let rh = GarHelper.createGarRoom(ro);
                    if (rh !== null) 
                        res.objects.push(rh);
                }
            }
            return res;
        }
        let ain = new Array();
        if (sp.region > 0) 
            ain.push(SearchAddressItem._new84(SearchLevel.REGION, sp.region.toString()));
        if (!Utils.isNullOrEmpty(sp.area)) 
            ain.push(SearchAddressItem._new85(SearchLevel.DISTRICT, sp.area));
        if (!Utils.isNullOrEmpty(sp.city)) 
            ain.push(SearchAddressItem._new85(SearchLevel.CITY, sp.city));
        if (!Utils.isNullOrEmpty(sp.street)) 
            ain.push(SearchAddressItem._new85(SearchLevel.STREET, sp.street));
        if (ain.length > 0) 
            ain[ain.length - 1].search = true;
        let total = 0;
        let wraptotal88 = new RefOutArgWrapper();
        let sain = AddressSearchHelper.process(ain, sp.maxCount, wraptotal88);
        total = wraptotal88.value;
        res.totalCount = total;
        if (sain !== null) {
            for (const a of sain) {
                if (a.tag instanceof AreaObject) {
                    let ga = GarHelper.createGarArea(Utils.as(a.tag, AreaObject));
                    if (ga !== null) 
                        res.objects.push(ga);
                }
            }
        }
        return res;
    }
    
    static process(ain, maxCount, total) {
        total.value = 0;
        if (ain === null || ain.length === 0) 
            return null;
        let ain1 = new Array();
        let regId = 0;
        for (const a of ain) {
            if (a.level === SearchLevel.REGION) {
                if (AddressSearchHelper.M_ONTO_REGS !== null) {
                    for (const it of AddressSearchHelper.M_ONTO_REGS.values) {
                        if (it.text === a.text) {
                            let nn = 0;
                            let wrapnn89 = new RefOutArgWrapper();
                            let inoutres90 = Utils.tryParseInt((it.id != null ? it.id : ""), wrapnn89);
                            nn = wrapnn89.value;
                            if (inoutres90) {
                                regId = nn;
                                a.id = it.id;
                                a.text = null;
                            }
                            break;
                        }
                    }
                }
                if (regId === 0) {
                    let nn = 0;
                    let wrapnn91 = new RefOutArgWrapper();
                    let inoutres92 = Utils.tryParseInt((a.id != null ? a.id : ""), wrapnn91);
                    nn = wrapnn91.value;
                    if (inoutres92) 
                        regId = nn;
                }
            }
            else 
                ain1.push(a);
        }
        if (regId === 0 && ain1.length === 0) 
            return null;
        let inoutres93 = AddressSearchHelper._process(ain1, regId, maxCount, total);
        return inoutres93;
    }
    
    static _calcSearchLevel(ao) {
        let lev = GarLevel.of(ao.level);
        if (lev === GarLevel.REGION) 
            return SearchLevel.REGION;
        if (lev === GarLevel.ADMINAREA || lev === GarLevel.MUNICIPALAREA) 
            return SearchLevel.DISTRICT;
        if (lev === GarLevel.SETTLEMENT || lev === GarLevel.CITY) 
            return SearchLevel.CITY;
        if (lev === GarLevel.LOCALITY) {
            if (ao.typ !== null && ao.typ.name === "территория") 
                return SearchLevel.STREET;
            return SearchLevel.CITY;
        }
        if (lev === GarLevel.AREA || lev === GarLevel.STREET) 
            return SearchLevel.STREET;
        return SearchLevel.UNDEFINED;
    }
    
    static _getId(id) {
        return ("a" + id);
    }
    
    static _process(ain, regId, maxCount, total) {
        total.value = 0;
        let mai = null;
        for (const a of ain) {
            if (a.search) {
                mai = new AddrSearchFormal(a);
                mai.regId = regId;
                break;
            }
        }
        if (GarHelper.GAR_INDEX === null) 
            return null;
        if (mai === null) {
            if (regId === 0) 
                return null;
            let ao = GarHelper.GAR_INDEX.getAOByReg(regId);
            if (ao === null) 
                return null;
            let rr = SearchAddressItem._new94(AddressSearchHelper._getId(ao.id), SearchLevel.REGION, ao, (ao.names[0] + " " + ao.typ.name));
            if (AddressSearchHelper.M_ONTO_REGS.containsKey(rr.id)) {
                let reg = AddressSearchHelper.M_ONTO_REGS.get(rr.id);
                rr.text = reg.text;
                rr.id = (reg.id != null ? reg.id : reg.text);
            }
            let res0 = new Array();
            res0.push(rr);
            return res0;
        }
        if (Utils.isNullOrEmpty(mai.src.text) && mai.src.level !== SearchLevel.REGION && ain.length > 0) {
            let ain0 = new Array();
            let aiMax = null;
            for (const a of ain) {
                if (((a.level.value()) < (mai.src.level.value())) && !Utils.isNullOrEmpty(a.text)) {
                    let aa = SearchAddressItem._new85(a.level, a.text);
                    ain0.push(aa);
                    if (aiMax === null) 
                        aiMax = aa;
                    else if ((aa.level.value()) > (aiMax.level.value())) 
                        aiMax = aa;
                }
            }
            if (aiMax !== null) 
                aiMax.search = true;
            let res0 = AddressSearchHelper._process(ain0, regId, maxCount, total);
            if (res0 === null || res0.length !== 1) 
                return null;
            total.value = 0;
            let ao = Utils.as(res0[0].tag, AreaObject);
            if (ao === null) 
                return null;
            let all0 = GarHelper.GAR_INDEX.getAOChildren(ao);
            let res00 = new Array();
            let ggg0 = new Hashtable();
            if (all0 !== null) {
                for (const ao0 of all0) {
                    if (res00.length >= maxCount) {
                        total.value = all0.length;
                        break;
                    }
                    let slev = AddressSearchHelper._calcSearchLevel(ao0);
                    let ai0 = SearchAddressItem._new96(AddressSearchHelper._getId(ao0.id), ao0, slev, res0[0], (ao0.names[0] + " " + ao0.typ.name));
                    if (slev === mai.src.level) {
                        if (ggg0.containsKey(ao0.id)) 
                            continue;
                        res00.push(ai0);
                        ggg0.put(ao0.id, true);
                        continue;
                    }
                    if ((slev.value()) > (mai.src.level.value())) 
                        continue;
                    let all1 = GarHelper.GAR_INDEX.getAOChildren(ao0);
                    if (all1 !== null) {
                        for (const ao1 of all1) {
                            if (res00.length >= maxCount) {
                                total.value = res00.length + all1.length;
                                break;
                            }
                            slev = AddressSearchHelper._calcSearchLevel(ao1);
                            if (slev === mai.src.level) {
                                if (ggg0.containsKey(ao1.id)) 
                                    continue;
                                let sai1 = SearchAddressItem._new96(AddressSearchHelper._getId(ao1.id), ao1, slev, ai0, (ao1.names[0] + " " + ao1.typ.name));
                                res00.push(sai1);
                                ggg0.put(ao1.id, true);
                                continue;
                            }
                        }
                    }
                }
            }
            return res00;
        }
        let res = new Array();
        mai.regId = regId;
        let all = mai.search();
        if (all === null || all.length === 0) 
            return res;
        for (const a of ain) {
            if (!a.search && ((a.level.value()) < (mai.src.level.value()))) {
                let par = new AddrSearchFormal(a);
                let pars = par.search();
                if (pars.length === 0) 
                    continue;
                for (let i = all.length - 1; i >= 0; i--) {
                    let hasPar = false;
                    for (const p of pars) {
                        if (all[i].parentIds.includes(p.id)) {
                            hasPar = true;
                            break;
                        }
                        else if (all[i].parentParentIds !== null && all[i].parentParentIds.includes(p.id)) {
                            hasPar = true;
                            break;
                        }
                    }
                    if (!hasPar) 
                        all.splice(i, 1);
                }
            }
        }
        let ggg = new Hashtable();
        for (let k = 0; k < 2; k++) {
            for (const a of all) {
                if (res.length >= maxCount) {
                    total.value = all.length;
                    break;
                }
                let ao = GarHelper.GAR_INDEX.getAO(a.id);
                if (ao === null) 
                    continue;
                if (ggg.containsKey(ao.id)) 
                    continue;
                if (!mai.check(ao, k > 0)) 
                    continue;
                let slev = AddressSearchHelper._calcSearchLevel(ao);
                if (slev !== mai.src.level) {
                    if (slev === SearchLevel.REGION && mai.src.level === SearchLevel.CITY && ao.level === (1)) {
                    }
                    else 
                        continue;
                }
                let ai = SearchAddressItem._new98(AddressSearchHelper._getId(ao.id), ao, slev, (ao.names[0] + " " + ao.typ.name));
                res.push(ai);
                total.value = res.length;
                ggg.put(ao.id, true);
                let parids = a.parentIds;
                while (parids !== null && parids.length > 0) {
                    let ok = false;
                    for (const pid of parids) {
                        let pao = GarHelper.GAR_INDEX.getAO(pid);
                        if (pao === null) 
                            continue;
                        let slev0 = AddressSearchHelper._calcSearchLevel(pao);
                        if (slev0 === SearchLevel.UNDEFINED) 
                            continue;
                        if (slev0 === slev) 
                            continue;
                        let pai = SearchAddressItem._new98(AddressSearchHelper._getId(pao.id), pao, slev0, (pao.names[0] + " " + pao.typ.name));
                        ai.parent = pai;
                        ai = pai;
                        slev = slev0;
                        parids = pao.parentIds;
                        ok = true;
                        break;
                    }
                    if (slev === SearchLevel.REGION || !ok) 
                        break;
                }
                if (ai.level === SearchLevel.REGION && AddressSearchHelper.M_ONTO_REGS.containsKey(ai.id)) {
                    let reg = AddressSearchHelper.M_ONTO_REGS.get(ai.id);
                    ai.text = reg.text;
                    ai.id = (reg.id != null ? reg.id : reg.text);
                }
            }
            if (res.length > 0) 
                break;
        }
        res.sort((a, b) => a.compareTo(b));
        return res;
    }
    
    static static_constructor() {
        AddressSearchHelper.M_ONTO_REGS = new Hashtable();
    }
}


AddressSearchHelper.static_constructor();

module.exports = AddressSearchHelper