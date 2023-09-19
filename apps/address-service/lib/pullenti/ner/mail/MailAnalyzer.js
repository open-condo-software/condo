/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

const MetaToken = require("./../MetaToken");
const ReferentToken = require("./../ReferentToken");
const GetTextAttr = require("./../core/GetTextAttr");
const ProcessorService = require("./../ProcessorService");
const Termin = require("./../core/Termin");
const PersonReferent = require("./../person/PersonReferent");
const MailKind = require("./MailKind");
const MiscHelper = require("./../core/MiscHelper");
const PullentiNerPersonInternalResourceHelper = require("./../person/internal/PullentiNerPersonInternalResourceHelper");
const MetaLetter = require("./internal/MetaLetter");
const Referent = require("./../Referent");
const MailReferent = require("./MailReferent");
const MailLineTypes = require("./internal/MailLineTypes");
const Analyzer = require("./../Analyzer");
const MailLine = require("./internal/MailLine");

/**
 * Анализатор текстов электронных писем и их блоков. Восстановление структуры, разбиение на блоки, 
 * анализ блока подписи. 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor, 
 * указав имя анализатора.
 */
class MailAnalyzer extends Analyzer {
    
    get name() {
        return MailAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Блок письма";
    }
    
    get description() {
        return "Блоки писем (e-mail) и их атрибуты";
    }
    
    clone() {
        return new MailAnalyzer();
    }
    
    get typeSystem() {
        return [MetaLetter.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaLetter.IMAGE_ID, PullentiNerPersonInternalResourceHelper.getBytes("mail.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === MailReferent.OBJ_TYPENAME) 
            return new MailReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return ["ORGANIZATION", "GEO", "ADDRESS", "PERSON"];
    }
    
    get isSpecific() {
        return true;
    }
    
    get progressWeight() {
        return 1;
    }
    
    process(kit) {
        let lines = new Array();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            let ml = MailLine.parse(t, 0, 0);
            if (ml === null) 
                continue;
            if (lines.length === 91) {
            }
            lines.push(ml);
            t = ml.endToken;
        }
        if (lines.length === 0) 
            return;
        let i = 0;
        let blocks = new Array();
        let blk = null;
        for (i = 0; i < lines.length; i++) {
            let ml = lines[i];
            if (ml.typ === MailLineTypes.FROM) {
                let isNew = ml.mustBeFirstLine || i === 0;
                if (((i + 2) < lines.length) && (((lines[i + 1].typ === MailLineTypes.FROM || lines[i + 2].typ === MailLineTypes.FROM || lines[i + 1].typ === MailLineTypes.HELLO) || lines[i + 2].typ === MailLineTypes.HELLO))) 
                    isNew = true;
                if (!isNew) {
                    for (let j = i - 1; j >= 0; j--) {
                        if (lines[j].typ !== MailLineTypes.UNDEFINED) {
                            if (lines[j].typ === MailLineTypes.BESTREGARDS) 
                                isNew = true;
                            break;
                        }
                    }
                }
                if (!isNew) {
                    for (let tt = ml.beginToken; tt !== null && tt.endChar <= ml.endChar; tt = tt.next) {
                        if (tt.getReferent() !== null) {
                            if (tt.getReferent().typeName === "DATE" || tt.getReferent().typeName === "URI") 
                                isNew = true;
                        }
                    }
                }
                if (isNew) {
                    blk = new Array();
                    blocks.push(blk);
                    for (; i < lines.length; i++) {
                        if (lines[i].typ === MailLineTypes.FROM) {
                            if (blk.length > 0 && lines[i].mustBeFirstLine) 
                                break;
                            blk.push(lines[i]);
                        }
                        else if (((i + 1) < lines.length) && lines[i + 1].typ === MailLineTypes.FROM) {
                            let j = 0;
                            for (j = 0; j < blk.length; j++) {
                                if (blk[j].typ === MailLineTypes.FROM) {
                                    if (blk[j].isRealFrom || blk[j].mustBeFirstLine || blk[j].mailAddr !== null) 
                                        break;
                                }
                            }
                            if (j >= blk.length) {
                                blk.push(lines[i]);
                                continue;
                            }
                            let ok = false;
                            for (j = i + 1; j < lines.length; j++) {
                                if (lines[j].typ !== MailLineTypes.FROM) 
                                    break;
                                if (lines[j].isRealFrom || lines[j].mustBeFirstLine) {
                                    ok = true;
                                    break;
                                }
                                if (lines[j].mailAddr !== null) {
                                    ok = true;
                                    break;
                                }
                            }
                            if (ok) 
                                break;
                            blk.push(lines[i]);
                        }
                        else 
                            break;
                    }
                    i--;
                    continue;
                }
            }
            if (blk === null) 
                blocks.push((blk = new Array()));
            blk.push(lines[i]);
        }
        if (blocks.length === 0) 
            return;
        let ad = kit.getAnalyzerData(this);
        for (let j = 0; j < blocks.length; j++) {
            lines = blocks[j];
            if (lines.length === 0) 
                continue;
            i = 0;
            if (lines[0].typ === MailLineTypes.FROM) {
                let t1 = lines[0].endToken;
                for (; i < lines.length; i++) {
                    if (lines[i].typ === MailLineTypes.FROM) 
                        t1 = lines[i].endToken;
                    else if (((i + 1) < lines.length) && lines[i + 1].typ === MailLineTypes.FROM) {
                    }
                    else 
                        break;
                }
                let _mail = MailReferent._new1588(MailKind.HEAD);
                let mt = new ReferentToken(_mail, lines[0].beginToken, t1);
                _mail.text = MiscHelper.getTextValueOfMetaToken(mt, GetTextAttr.KEEPREGISTER);
                ad.registerReferent(_mail);
                _mail.addOccurenceOfRefTok(mt);
            }
            let i0 = i;
            let t2 = null;
            let err = 0;
            for (i = lines.length - 1; i >= i0; i--) {
                let li = lines[i];
                if (li.typ === MailLineTypes.BESTREGARDS) {
                    t2 = lines[i].beginToken;
                    for (--i; i >= i0; i--) {
                        if (lines[i].typ === MailLineTypes.BESTREGARDS && (lines[i].words < 2)) 
                            t2 = lines[i].beginToken;
                        else if ((i > i0 && (lines[i].words < 3) && lines[i - 1].typ === MailLineTypes.BESTREGARDS) && (lines[i - 1].words < 2)) {
                            i--;
                            t2 = lines[i].beginToken;
                        }
                        else 
                            break;
                    }
                    break;
                }
                if (li.refs.length > 0 && (li.words < 3) && i > i0) {
                    err = 0;
                    t2 = li.beginToken;
                    continue;
                }
                if (li.words > 10) {
                    t2 = null;
                    continue;
                }
                if (li.words > 2) {
                    if ((++err) > 2) 
                        t2 = null;
                }
            }
            if (t2 === null) {
                for (i = lines.length - 1; i >= i0; i--) {
                    let li = lines[i];
                    if (li.typ === MailLineTypes.UNDEFINED) {
                        if (li.refs.length > 0 && (li.refs[0] instanceof PersonReferent)) {
                            if (li.words === 0 && i > i0) {
                                t2 = li.beginToken;
                                break;
                            }
                        }
                    }
                }
            }
            for (let ii = i0; ii < lines.length; ii++) {
                if (lines[ii].typ === MailLineTypes.HELLO) {
                    let _mail = MailReferent._new1588(MailKind.HELLO);
                    let mt = new ReferentToken(_mail, lines[i0].beginToken, lines[ii].endToken);
                    if (mt.lengthChar > 0) {
                        _mail.text = MiscHelper.getTextValueOfMetaToken(mt, GetTextAttr.KEEPREGISTER);
                        ad.registerReferent(_mail);
                        _mail.addOccurenceOfRefTok(mt);
                        i0 = ii + 1;
                    }
                    break;
                }
                else if (lines[ii].typ !== MailLineTypes.UNDEFINED || lines[ii].words > 0 || lines[ii].refs.length > 0) 
                    break;
            }
            if (i0 < lines.length) {
                if (t2 !== null && t2.previous === null) {
                }
                else {
                    let _mail = MailReferent._new1588(MailKind.BODY);
                    let mt = new ReferentToken(_mail, lines[i0].beginToken, (t2 !== null && t2.previous !== null ? t2.previous : lines[lines.length - 1].endToken));
                    if (mt.lengthChar > 0) {
                        _mail.text = MiscHelper.getTextValueOfMetaToken(mt, GetTextAttr.KEEPREGISTER);
                        ad.registerReferent(_mail);
                        _mail.addOccurenceOfRefTok(mt);
                    }
                }
                if (t2 !== null) {
                    let _mail = MailReferent._new1588(MailKind.TAIL);
                    let mt = new ReferentToken(_mail, t2, lines[lines.length - 1].endToken);
                    if (mt.lengthChar > 0) {
                        _mail.text = MiscHelper.getTextValueOfMetaToken(mt, GetTextAttr.KEEPREGISTER);
                        ad.registerReferent(_mail);
                        _mail.addOccurenceOfRefTok(mt);
                    }
                    for (i = i0; i < lines.length; i++) {
                        if (lines[i].beginChar >= t2.beginChar) {
                            for (const r of lines[i].refs) {
                                _mail.addRef(r, 0);
                            }
                        }
                    }
                }
            }
        }
    }
    
    static initialize() {
        if (MailAnalyzer.m_Inited) 
            return;
        MailAnalyzer.m_Inited = true;
        try {
            MetaLetter.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            MailLine.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new MailAnalyzer());
    }
    
    static static_constructor() {
        MailAnalyzer.ANALYZER_NAME = "MAIL";
        MailAnalyzer.m_Inited = false;
    }
}


MailAnalyzer.static_constructor();

module.exports = MailAnalyzer