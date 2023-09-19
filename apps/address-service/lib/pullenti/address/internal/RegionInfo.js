/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const AreaAttributes = require("./../AreaAttributes");
const NameAnalyzer = require("./NameAnalyzer");

class RegionInfo {
    
    constructor() {
        this.attrs = new AreaAttributes();
        this.names = null;
        this.acronims = new Array();
        this.capital = null;
        this.cities = new Array();
        this.districts = new Array();
        this.termCities = null;
    }
    
    toString() {
        return (this.attrs.toString() + " (" + (this.acronims.length > 0 ? this.acronims[0] : "?") + ") - " + ((this.capital != null ? this.capital : "?")) + " (" + this.cities.length + "/" + this.districts.length + ")");
    }
    
    addCity(nam) {
        nam = Utils.replaceString(nam, 'ё', 'е');
        if (!this.cities.includes(nam)) 
            this.cities.push(nam);
    }
    
    addDistrict(nam) {
        nam = Utils.replaceString(nam, 'ё', 'е');
        if (!this.districts.includes(nam)) 
            this.districts.push(nam);
    }
    
    serialize(xml) {
        xml.writeStartElement("reg");
        this.attrs.serialize(xml);
        for (const a of this.acronims) {
            xml.writeElementString("acr", a);
        }
        if (this.capital !== null) 
            xml.writeElementString("capital", this.capital);
        for (const c of this.cities) {
            xml.writeElementString("city", c);
        }
        for (const d of this.districts) {
            xml.writeElementString("distr", d);
        }
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "area") 
                this.attrs.deserialize(x);
            else if (x.local_name === "acr") 
                this.acronims.push(x.inner_text);
            else if (x.local_name === "capital") 
                this.capital = x.inner_text;
            else if (x.local_name === "city") 
                this.cities.push(x.inner_text);
            else if (x.local_name === "distr") 
                this.districts.push(x.inner_text);
        }
        this.names = new NameAnalyzer();
        if (this.attrs.types.length > 0) 
            this.names.process(this.attrs.names, this.attrs.types[0]);
        else {
        }
    }
    
    replaceCapitalByRegion(txt) {
        if (this.capital === null) 
            return null;
        let ii = txt.toUpperCase().indexOf(this.capital.toUpperCase());
        if (ii < 0) 
            return null;
        if (ii > 0 && (ii < 7) && txt[0].toUpperCase() === 'Г') 
            ii += this.capital.length;
        else if (ii === 0) {
            ii += this.capital.length;
            for (let j = ii + 1; j < txt.length; j++) {
                if (txt[j] === ',') 
                    break;
                else if (txt[j] === ' ') {
                }
                else if (txt[j] === 'Г' || txt[j] === 'г') {
                    let ss = txt.substring(j).toUpperCase();
                    if (ss.startsWith("ГОРОД")) 
                        ii = j + 5;
                    else if (ss.startsWith("ГОР")) 
                        ii = j + 3;
                    else if (ss.startsWith("Г") && ss.length > 1 && !Utils.isLetter(ss[1])) 
                        ii = j + 1;
                    break;
                }
                else 
                    break;
            }
        }
        else 
            return null;
        let res = (this.attrs.toString() + ", " + txt.substring(ii));
        return res;
    }
}


module.exports = RegionInfo