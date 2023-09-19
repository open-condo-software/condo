/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const Referent = require("./../Referent");
const MetaToken = require("./../MetaToken");
const VacanceItemType = require("./VacanceItemType");
const ProcessorService = require("./../ProcessorService");
const ReferentToken = require("./../ReferentToken");
const VacanceTokenType = require("./internal/VacanceTokenType");
const MetaVacance = require("./MetaVacance");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const VacanceItemReferent = require("./VacanceItemReferent");
const VacanceToken = require("./internal/VacanceToken");
const Analyzer = require("./../Analyzer");

/**
 * Анализатор вакансий (специфический анализатор)
 */
class VacanceAnalyzer extends Analyzer {
    
    get name() {
        return VacanceAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Вакансия";
    }
    
    get description() {
        return "Текст содержит одну вакансию";
    }
    
    clone() {
        return new VacanceAnalyzer();
    }
    
    get isSpecific() {
        return true;
    }
    
    get typeSystem() {
        return [MetaVacance.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaVacance.IMAGE_ID.toString(), PullentiNerCoreInternalResourceHelper.getBytes("vacance.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === VacanceItemReferent.OBJ_TYPENAME) 
            return new VacanceItemReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let li = VacanceToken.tryParseList(kit.firstToken);
        if (li === null || (li.length < 1)) 
            return;
        let isExpired = false;
        for (const v of li) {
            if (v.typ === VacanceTokenType.EXPIRED) 
                isExpired = true;
        }
        let hasDate = false;
        let hasSkills = false;
        for (const v of li) {
            if (v.typ === VacanceTokenType.UNDEFINED || v.typ === VacanceTokenType.DUMMY) 
                continue;
            if (Utils.isNullOrEmpty(v.value) && v.refs.length === 0) 
                continue;
            let it = new VacanceItemReferent();
            if (v.typ === VacanceTokenType.DATE) {
                it.typ = VacanceItemType.DATE;
                hasDate = true;
            }
            else if (v.typ === VacanceTokenType.EXPIERENCE) 
                it.typ = VacanceItemType.EXPERIENCE;
            else if (v.typ === VacanceTokenType.MONEY) 
                it.typ = VacanceItemType.MONEY;
            else if (v.typ === VacanceTokenType.NAME) {
                it.typ = VacanceItemType.NAME;
                if (isExpired) 
                    it.expired = true;
            }
            else if (v.typ === VacanceTokenType.EDUCATION) 
                it.typ = VacanceItemType.EDUCATION;
            else if (v.typ === VacanceTokenType.LANGUAGE) 
                it.typ = VacanceItemType.LANGUAGE;
            else if (v.typ === VacanceTokenType.DRIVING) 
                it.typ = VacanceItemType.DRIVINGLICENSE;
            else if (v.typ === VacanceTokenType.LICENSE) 
                it.typ = VacanceItemType.LICENSE;
            else if (v.typ === VacanceTokenType.MORAL) 
                it.typ = VacanceItemType.MORAL;
            else if (v.typ === VacanceTokenType.PLUS) 
                it.typ = VacanceItemType.PLUS;
            else if (v.typ === VacanceTokenType.SKILL) {
                it.typ = VacanceItemType.SKILL;
                hasSkills = true;
            }
            else 
                continue;
            if (v.value !== null) 
                it.value = v.value;
            for (const r of v.refs) {
                it.addSlot(VacanceItemReferent.ATTR_REF, r, false, 0);
            }
            let rt = new ReferentToken(ad.registerReferent(it), v.beginToken, v.endToken);
            kit.embedToken(rt);
        }
    }
    
    static initialize() {
        /* this is synchronized block by VacanceAnalyzer.m_Lock, but this feature isn't supported in JS */ {
            if (VacanceAnalyzer.m_Initialized) 
                return;
            VacanceAnalyzer.m_Initialized = true;
            MetaVacance.initialize();
            VacanceToken.initialize();
            ProcessorService.registerAnalyzer(new VacanceAnalyzer());
        }
    }
    
    static static_constructor() {
        VacanceAnalyzer.ANALYZER_NAME = "VACANCE";
        VacanceAnalyzer.m_Initialized = false;
        VacanceAnalyzer.m_Lock = new Object();
    }
}


VacanceAnalyzer.static_constructor();

module.exports = VacanceAnalyzer