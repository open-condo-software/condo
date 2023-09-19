/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const CityItemTokenItemType = require("./../../ner/geo/internal/CityItemTokenItemType");
const SearchLevel = require("./SearchLevel");
const TextToken = require("./../../ner/TextToken");
const TerrItemToken = require("./../../ner/geo/internal/TerrItemToken");
const CityItemToken = require("./../../ner/geo/internal/CityItemToken");
const AddrLevel = require("./../AddrLevel");
const SourceOfAnalysis = require("./../../ner/SourceOfAnalysis");
const ProcessorService = require("./../../ner/ProcessorService");
const NameAnalyzer = require("./NameAnalyzer");
const StreetItemType = require("./../../ner/address/internal/StreetItemType");
const StreetItemToken = require("./../../ner/address/internal/StreetItemToken");
const GarHelper = require("./GarHelper");

class AddrSearchFormal {
    
    toString() {
        let res = new StringBuilder();
        if (this.typname !== null) 
            res.append(this.typname).append(" ");
        for (const w of this.words) {
            res.append(w).append(" ");
        }
        if (this.stdAdj !== null) 
            res.append(this.stdAdj).append(" ");
        if (this.number !== null) 
            res.append(this.number).append(" ");
        return res.toString().trim();
    }
    
    constructor(_src) {
        this.src = null;
        this.words = new Array();
        this.stdAdj = null;
        this.number = null;
        this.typname = null;
        this.regId = 0;
        this.src = _src;
        let ar = null;
        try {
            ar = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis(_src.text), null, null);
        } catch (ex100) {
        }
        if (ar === null) 
            return;
        if (GarHelper.GAR_INDEX === null) 
            return;
        for (let t = ar.firstToken; t !== null; t = t.next) {
            let sit = StreetItemToken.tryParse(t, null, true, null);
            if ((sit !== null && ((sit.typ === StreetItemType.STDADJECTIVE || sit.typ === StreetItemType.STDPARTOFNAME)) && sit.termin !== null) && ((t.previous !== null || t.next !== null))) {
                this.stdAdj = NameAnalyzer.correctAdj(sit.termin.canonicText);
                if (this.stdAdj === null) 
                    this.words.push(sit.termin.canonicText);
                t = sit.endToken;
                continue;
            }
            if (sit !== null && sit.typ === StreetItemType.NUMBER) {
                this.number = sit.value;
                t = sit.endToken;
                continue;
            }
            if (this.typname === null) {
                if (sit !== null && sit.typ === StreetItemType.NOUN && this.src.level === SearchLevel.STREET) {
                    this.typname = sit.termin.canonicText.toLowerCase();
                    t = sit.endToken;
                    continue;
                }
                if (this.src.level === SearchLevel.CITY) {
                    let cit = CityItemToken.tryParse(t, null, false, null);
                    if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) {
                        this.typname = cit.value.toLowerCase();
                        t = cit.endToken;
                        continue;
                    }
                }
                if (this.src.level === SearchLevel.DISTRICT) {
                    let ter = TerrItemToken.tryParse(t, null, null);
                    if (ter !== null && ter.terminItem !== null) {
                        this.typname = ter.terminItem.canonicText.toLowerCase();
                        t = ter.endToken;
                        continue;
                    }
                }
            }
            if ((t instanceof TextToken) && t.lengthChar > 1) 
                this.words.push(t.term);
        }
        if (this.words.length > 1 && ((Utils.isDigit(this.words[0][0]) || this.words[0].length === 1))) {
            let n = this.words[0];
            this.words.splice(0, 1);
            this.words.push(n);
        }
        for (let i = 0; i < this.words.length; i++) {
            this.words[i] = NameAnalyzer.corrName(this.words[i]);
        }
    }
    
    check(ao, lite) {
        return true;
    }
    
    search() {
        if (this.words.length === 0) 
            return new Array();
        let res = new Array();
        if (this.words.length > 1) {
            let vars = new Array();
            NameAnalyzer.createSearchVariants(vars, null, null, (this.words[0] + " " + this.words[1]), null);
            for (const v of vars) {
                res = GarHelper.GAR_INDEX.getAllStringEntriesByStart(v, this.stdAdj, this.number, this.src.level === SearchLevel.STREET, this.regId);
                if (res.length > 0) 
                    break;
            }
        }
        else 
            res = GarHelper.GAR_INDEX.getAllStringEntriesByStart(this.words[0], this.stdAdj, this.number, this.src.level === SearchLevel.STREET, this.regId);
        if (this.words.length > 1 && res.length === 0) {
            let res2 = GarHelper.GAR_INDEX.getAllStringEntriesByStart(this.words[1], this.stdAdj, this.number, this.src.level === SearchLevel.STREET, this.regId);
            if (res.length === 0) 
                res = res2;
            else if (res2.length > 0) {
                let hash = new Hashtable();
                for (const r of res2) {
                    if (!hash.containsKey(r.id)) 
                        hash.put(r.id, true);
                }
                let res3 = new Array();
                for (let i = res.length - 1; i >= 0; i--) {
                    if (hash.containsKey(res[i].id)) 
                        res3.push(res[i]);
                }
                res = res3;
            }
        }
        if (this.typname !== null) {
            for (let i = res.length - 1; i >= 0; i--) {
                let r = res[i];
                let ok = false;
                if (r.typs !== null) {
                    for (const ty of r.typs) {
                        if (ty.includes(this.typname) || this.typname.includes(ty)) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (!ok) 
                    res.splice(i, 1);
            }
        }
        if (this.src.ignoreTerritories) {
            for (let i = res.length - 1; i >= 0; i--) {
                let r = res[i];
                if (r.level === AddrLevel.TERRITORY) 
                    res.splice(i, 1);
            }
        }
        return res;
    }
}


module.exports = AddrSearchFormal