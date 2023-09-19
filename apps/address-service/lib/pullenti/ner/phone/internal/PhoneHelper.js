/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const PullentiNerBankInternalResourceHelper = require("./../../bank/internal/PullentiNerBankInternalResourceHelper");

class PhoneHelper {
    
    static initialize() {
        if (PhoneHelper.m_PhoneRoot !== null) 
            return;
        PhoneHelper.m_PhoneRoot = new PhoneHelper.PhoneNode();
        PhoneHelper.m_AllCountryCodes = new Hashtable();
        let str = PullentiNerBankInternalResourceHelper.getString("CountryPhoneCodes.txt");
        if (str === null) 
            throw new Error(("Can't file resource file " + "CountryPhoneCodes.txt" + " in Organization analyzer"));
        for (const line0 of Utils.splitString(str, '\n', false)) {
            let line = line0.trim();
            if (Utils.isNullOrEmpty(line)) 
                continue;
            if (line.length < 2) 
                continue;
            let country = line.substring(0, 0 + 2);
            let cod = line.substring(2).trim();
            if (cod.length < 1) 
                continue;
            if (!PhoneHelper.m_AllCountryCodes.containsKey(country)) 
                PhoneHelper.m_AllCountryCodes.put(country, cod);
            let tn = PhoneHelper.m_PhoneRoot;
            for (let i = 0; i < cod.length; i++) {
                let dig = cod[i];
                let nn = null;
                let wrapnn2717 = new RefOutArgWrapper();
                let inoutres2718 = tn.children.tryGetValue(dig, wrapnn2717);
                nn = wrapnn2717.value;
                if (!inoutres2718) {
                    nn = new PhoneHelper.PhoneNode();
                    nn.pref = cod.substring(0, 0 + i + 1);
                    tn.children.put(dig, nn);
                }
                tn = nn;
            }
            if (tn.countries === null) 
                tn.countries = new Array();
            tn.countries.push(country);
        }
    }
    
    static getAllCountryCodes() {
        return PhoneHelper.m_AllCountryCodes;
    }
    
    static getCountryPrefix(fullNumber) {
        if (fullNumber === null) 
            return null;
        let nod = PhoneHelper.m_PhoneRoot;
        let maxInd = -1;
        for (let i = 0; i < fullNumber.length; i++) {
            let dig = fullNumber[i];
            let nn = null;
            let wrapnn2719 = new RefOutArgWrapper();
            let inoutres2720 = nod.children.tryGetValue(dig, wrapnn2719);
            nn = wrapnn2719.value;
            if (!inoutres2720) 
                break;
            if (nn.countries !== null && nn.countries.length > 0) 
                maxInd = i;
            nod = nn;
        }
        if (maxInd < 0) 
            return null;
        else 
            return fullNumber.substring(0, 0 + maxInd + 1);
    }
    
    static static_constructor() {
        PhoneHelper.m_AllCountryCodes = null;
        PhoneHelper.m_PhoneRoot = null;
    }
}


PhoneHelper.PhoneNode = class  {
    
    constructor() {
        this.pref = null;
        this.children = new Hashtable();
        this.countries = null;
    }
    
    toString() {
        if (this.countries === null) 
            return this.pref;
        let res = new StringBuilder(this.pref);
        for (const c of this.countries) {
            res.append(" ").append(c);
        }
        return res.toString();
    }
}


PhoneHelper.static_constructor();

module.exports = PhoneHelper