/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphCase = require("./../MorphCase");
const MorphNumber = require("./../MorphNumber");
const MorphGender = require("./../MorphGender");
const MorphClass = require("./../MorphClass");
const MorphBaseInfo = require("./../MorphBaseInfo");

class MorphRuleVariant extends MorphBaseInfo {
    
    constructor() {
        super();
        this.tail = null;
        this.miscInfoId = 0;
        this.ruleId = 0;
        this.id = 0;
        this.normalTail = null;
        this.fullNormalTail = null;
        this.tag = null;
    }
    
    copyFromVariant(src) {
        if (src === null) 
            return;
        this.tail = src.tail;
        this.copyFrom(src);
        this.miscInfoId = src.miscInfoId;
        this.normalTail = src.normalTail;
        this.fullNormalTail = src.fullNormalTail;
        this.ruleId = src.ruleId;
    }
    
    toString() {
        return this.toStringEx(false);
    }
    
    toStringEx(hideTails) {
        let res = new StringBuilder();
        if (!hideTails) {
            res.append("-").append(this.tail);
            if (this.normalTail !== null) 
                res.append(" [-").append(this.normalTail).append("]");
            if (this.fullNormalTail !== null && this.fullNormalTail !== this.normalTail) 
                res.append(" [-").append(this.fullNormalTail).append("]");
        }
        res.append(" ").append(super.toString());
        return res.toString().trim();
    }
    
    compare(mrv) {
        if ((!mrv._class.equals(this._class) || mrv.gender !== this.gender || mrv.number !== this.number) || !mrv._case.equals(this._case)) 
            return false;
        if (mrv.miscInfoId !== this.miscInfoId) 
            return false;
        if (mrv.normalTail !== this.normalTail) 
            return false;
        return true;
    }
    
    deserialize(str, pos) {
        let _id = str.deserializeShort(pos);
        if (_id <= 0) 
            return false;
        this.miscInfoId = _id;
        let iii = str.deserializeShort(pos);
        let mc = new MorphClass();
        mc.value = iii;
        if (mc.isMisc && mc.isProper) 
            mc.isMisc = false;
        this._class = mc;
        let bbb = 0;
        bbb = str.deserializeByte(pos);
        this.gender = MorphGender.of(bbb);
        bbb = str.deserializeByte(pos);
        this.number = MorphNumber.of(bbb);
        bbb = str.deserializeByte(pos);
        let mca = new MorphCase();
        mca.value = bbb;
        this._case = mca;
        let s = str.deserializeString(pos);
        this.normalTail = s;
        s = str.deserializeString(pos);
        this.fullNormalTail = s;
        return true;
    }
}


module.exports = MorphRuleVariant