/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

class GeoTokenData {
    
    constructor(t) {
        this.tok = null;
        this.npt = null;
        this.terr = null;
        this.cit = null;
        this.orgTyp = null;
        this.org = null;
        this.street = null;
        this.addr = null;
        this.noGeo = false;
        this.tok = t;
        t.tag = this;
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.tok.toString());
        if (this.npt !== null) 
            tmp.append(" \r\nNpt: ").append(this.npt.toString());
        if (this.terr !== null) 
            tmp.append(" \r\nTerr: ").append(this.terr.toString());
        if (this.cit !== null) 
            tmp.append(" \r\nCit: ").append(this.cit.toString());
        if (this.org !== null) 
            tmp.append(" \r\nOrg: ").append(this.org.toString());
        if (this.orgTyp !== null) 
            tmp.append(" \r\nOrgTyp: ").append(this.orgTyp.toString());
        if (this.street !== null) 
            tmp.append(" \r\nStreet: ").append(this.street.toString());
        if (this.addr !== null) 
            tmp.append(" \r\nAddr: ").append(this.addr.toString());
        if (this.noGeo) 
            tmp.append(" \r\nNO GEO!!!");
        return tmp.toString();
    }
}


module.exports = GeoTokenData