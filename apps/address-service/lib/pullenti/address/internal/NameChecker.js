/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const INameChecker = require("./../../ner/geo/internal/INameChecker");
const NameAnalyzer = require("./NameAnalyzer");
const GarHelper = require("./GarHelper");

class NameChecker extends INameChecker {
    
    check(name, isStreet) {
        if (GarHelper.GAR_INDEX === null) 
            return false;
        let vars = new Array();
        let vars2 = new Array();
        NameAnalyzer.createSearchVariants(vars, null, vars2, name, null);
        for (const v of vars) {
            if (GarHelper.GAR_INDEX.checkName(v, isStreet)) 
                return true;
        }
        for (const v of vars2) {
            if (GarHelper.GAR_INDEX.checkName(v, isStreet)) 
                return true;
        }
        return false;
    }
}


module.exports = NameChecker