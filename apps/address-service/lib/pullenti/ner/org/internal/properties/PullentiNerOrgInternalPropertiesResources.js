/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const path = require('path');
const Utils = require("./../../../../unisharp/Utils");
const Stream = require("./../../../../unisharp/Stream");
const FileStream = require("./../../../../unisharp/FileStream");

class PullentiNerOrgInternalPropertiesResources {
    static getNames() { return this.names; }
    static getStream(name) {
        let fname = this.getResourceInfo(name);
        if(fname == null) throw new Exception('Resource ' + name + ' not found');
        return new FileStream(fname, 'r');
    }
    static getResourceInfo(name) {
        for (let k = 0; k < 2; k++) 
            for (let i = 0; i < this.names.length; i++) 
                if ((k == 0 && Utils.compareStrings(name, this.names[i]) == 0) || (k == 1 && name.endsWith('.' + this.names[i]))) 
                    return path.join(__dirname, this.names[i]);
        return null;
    }
}

PullentiNerOrgInternalPropertiesResources.names = ["festival.png", "train.png", "federation.png", "avia.png", "church.png", "holding.png", "hotel.png", "justice.png", "music.png", "politics.png", "science.png", "sport.png", "study.png", "dep.png", "medicine.png", "gov.png", "factory.png", "culture.png", "bank.png", "press.png", "org.png", "media.png", "military.png", "trade.png", "party.png", "NameNouns_ru.dat", "NameNouns_ua.dat", "Orgs_en.dat", "Orgs_ru.dat", "Orgs_ua.dat", "OrgTypes.dat", "pattrs_en.dat", "pattrs_ru.dat", "pattrs_ua.dat"]; 

module.exports = PullentiNerOrgInternalPropertiesResources