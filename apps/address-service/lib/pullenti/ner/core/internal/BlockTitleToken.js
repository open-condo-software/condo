/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const TextToken = require("./../../TextToken");
const GetTextAttr = require("./../GetTextAttr");
const MetaToken = require("./../../MetaToken");
const MiscHelper = require("./../MiscHelper");
const BlkTyps = require("./BlkTyps");
const TerminCollection = require("./../TerminCollection");
const BlockLine = require("./BlockLine");

class BlockTitleToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = BlkTyps.UNDEFINED;
        this.value = null;
    }
    
    toString() {
        return (String(this.typ) + " " + ((this.value != null ? this.value : "")) + " " + this.getSourceText());
    }
    
    static tryAttachList(t) {
        let content = null;
        let intro = null;
        let lits = null;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) {
                let btt = BlockTitleToken.tryAttach(tt, false, null);
                if (btt === null) 
                    continue;
                if (btt.typ === BlkTyps.INDEX) {
                    content = btt;
                    break;
                }
                if (btt.typ === BlkTyps.INTRO) {
                    let tt2 = btt.endToken.next;
                    for (let k = 0; k < 5; k++) {
                        let li = BlockLine.create(tt2, null);
                        if (li === null) 
                            break;
                        if (li.hasContentItemTail || li.typ === BlkTyps.INDEXITEM) {
                            content = btt;
                            break;
                        }
                        if (li.hasVerb) 
                            break;
                        if (li.typ !== BlkTyps.UNDEFINED) {
                            if ((li.beginChar - btt.endChar) < 400) {
                                content = btt;
                                break;
                            }
                        }
                        tt2 = li.endToken.next;
                    }
                    if (content === null) 
                        intro = btt;
                    break;
                }
                if (btt.typ === BlkTyps.LITERATURE) {
                    if (lits === null) 
                        lits = new Array();
                    lits.push(btt);
                }
            }
        }
        if (content === null && intro === null && ((lits === null || lits.length !== 1))) 
            return null;
        let res = new Array();
        let chapterNames = new TerminCollection();
        let t0 = null;
        if (content !== null) {
            res.push(content);
            let cou = 0;
            let err = 0;
            for (let tt = content.endToken.next; tt !== null; tt = tt.next) {
                if (!tt.isNewlineBefore) 
                    continue;
                let li = BlockLine.create(tt, null);
                if (li === null) 
                    break;
                if (li.hasVerb) {
                    if (li.endToken.isChar('.')) 
                        break;
                    if (li.lengthChar > 100) 
                        break;
                }
                let btt = BlockTitleToken.tryAttach(tt, true, null);
                if (btt === null) 
                    continue;
                err = 0;
                if (btt.typ === BlkTyps.INTRO) {
                    if (content.typ === BlkTyps.INTRO || cou > 2) 
                        break;
                }
                cou++;
                tt = content.endToken = btt.endToken;
                if (btt.value !== null) 
                    chapterNames.addString(btt.value, null, null, false);
            }
            content.typ = BlkTyps.INDEX;
            t0 = content.endToken.next;
        }
        else if (intro !== null) 
            t0 = intro.beginToken;
        else if (lits !== null) 
            t0 = t;
        else 
            return null;
        let first = true;
        for (let tt = t0; tt !== null; tt = tt.next) {
            if (!tt.isNewlineBefore) 
                continue;
            if (tt.isValue("СЛАБОЕ", null)) {
            }
            let btt = BlockTitleToken.tryAttach(tt, false, chapterNames);
            if (btt === null) 
                continue;
            if (res.length === 104) {
            }
            tt = btt.endToken;
            if (content !== null && btt.typ === BlkTyps.INDEX) 
                continue;
            if (res.length > 0 && res[res.length - 1].typ === BlkTyps.LITERATURE) {
                if (btt.typ !== BlkTyps.APPENDIX && btt.typ !== BlkTyps.MISC && btt.typ !== BlkTyps.LITERATURE) {
                    if (btt.typ === BlkTyps.CHAPTER && (res[res.length - 1].endChar < (Utils.intDiv(tt.kit.sofa.text.length * 3, 4)))) {
                    }
                    else 
                        continue;
                }
            }
            if (first) {
                if ((tt.beginChar - t0.beginChar) > 300) {
                    let btt0 = new BlockTitleToken(t0, (t0.previous === null ? t0 : t0.previous));
                    btt0.typ = BlkTyps.CHAPTER;
                    btt0.value = "Похоже на начало";
                    res.push(btt0);
                }
            }
            res.push(btt);
            tt = btt.endToken;
            first = false;
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === BlkTyps.LITERATURE && res[i + 1].typ === res[i].typ) {
                res.splice(i + 1, 1);
                i--;
            }
        }
        return res;
    }
    
    static tryAttach(t, isContentItem = false, names = null) {
        if (t === null) 
            return null;
        if (!t.isNewlineBefore) 
            return null;
        if (t.chars.isAllLower) 
            return null;
        let li = BlockLine.create(t, names);
        if (li === null) 
            return null;
        if (li.words === 0 && li.typ === BlkTyps.UNDEFINED) 
            return null;
        if (li.typ === BlkTyps.INDEX) {
        }
        if (li.isExistName) 
            return BlockTitleToken._new694(t, li.endToken, li.typ);
        if (li.endToken === li.numberEnd || ((li.endToken.isCharOf(".:") && li.endToken.previous === li.numberEnd))) {
            let res2 = BlockTitleToken._new694(t, li.endToken, li.typ);
            if (li.typ === BlkTyps.CHAPTER || li.typ === BlkTyps.APPENDIX) {
                let li2 = BlockLine.create(li.endToken.next, names);
                if ((li2 !== null && li2.typ === BlkTyps.UNDEFINED && li2.isAllUpper) && li2.words > 0) {
                    res2.endToken = li2.endToken;
                    for (let tt = res2.endToken.next; tt !== null; tt = tt.next) {
                        li2 = BlockLine.create(tt, names);
                        if (li2 === null) 
                            break;
                        if (li2.typ !== BlkTyps.UNDEFINED || !li2.isAllUpper || li2.words === 0) 
                            break;
                        tt = res2.endToken = li2.endToken;
                    }
                }
            }
            return res2;
        }
        if (li.numberEnd === null) 
            return null;
        let res = BlockTitleToken._new694(t, li.endToken, li.typ);
        if (res.typ === BlkTyps.UNDEFINED) {
            if (li.words < 1) 
                return null;
            if (li.hasVerb) 
                return null;
            if (!isContentItem) {
                if (!li.isAllUpper || li.notWords > (Utils.intDiv(li.words, 2))) 
                    return null;
            }
            res.typ = BlkTyps.CHAPTER;
            if ((li.numberEnd.endChar - t.beginChar) === 7 && li.numberEnd.next !== null && li.numberEnd.next.isHiphen) 
                res.typ = BlkTyps.UNDEFINED;
        }
        if (li.hasContentItemTail && isContentItem) 
            res.typ = BlkTyps.INDEXITEM;
        if (res.typ === BlkTyps.CHAPTER || res.typ === BlkTyps.APPENDIX) {
            if (li.hasVerb) 
                return null;
            if (li.notWords > li.words && !isContentItem) 
                return null;
            for (t = li.endToken.next; t !== null; t = t.next) {
                let li2 = BlockLine.create(t, names);
                if (li2 === null) 
                    break;
                if (li2.hasVerb || (li2.words < 1)) 
                    break;
                if (!li2.isAllUpper && !isContentItem) 
                    break;
                if (li2.typ !== BlkTyps.UNDEFINED || li2.numberEnd !== null) 
                    break;
                t = res.endToken = li2.endToken;
                if (isContentItem && li2.hasContentItemTail) {
                    res.typ = BlkTyps.INDEXITEM;
                    break;
                }
            }
        }
        for (let tt = res.endToken; tt !== null && tt.beginChar > li.numberEnd.endChar; tt = tt.previous) {
            if ((tt instanceof TextToken) && tt.chars.isLetter) {
                res.value = MiscHelper.getTextValue(li.numberEnd.next, tt, GetTextAttr.NO);
                break;
            }
        }
        if ((res.typ === BlkTyps.INDEX || res.typ === BlkTyps.INTRO || res.typ === BlkTyps.CONSLUSION) || res.typ === BlkTyps.LITERATURE) {
            if (res.value !== null && res.value.length > 100) 
                return null;
            if (li.words < li.notWords) 
                return null;
        }
        return res;
    }
    
    static _new694(_arg1, _arg2, _arg3) {
        let res = new BlockTitleToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
}


module.exports = BlockTitleToken