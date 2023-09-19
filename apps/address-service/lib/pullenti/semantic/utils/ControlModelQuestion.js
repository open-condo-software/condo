/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const MorphCase = require("./../../morph/MorphCase");
const QuestionType = require("./QuestionType");

/**
 * Вопрос модели управления
 */
class ControlModelQuestion {
    
    toString() {
        return this.spelling;
    }
    
    /**
     * Проверить на соответствие вопросу предлога с падежом
     * @param prep предлог
     * @param cas падеж
     * @return да-нет
     */
    check(prep, cas) {
        if (this.isAbstract) {
            for (const it of ControlModelQuestion.ITEMS) {
                if (!it.isAbstract && it.question === this.question) {
                    if (it.check(prep, cas)) 
                        return true;
                }
            }
            return false;
        }
        if ((MorphCase.ooBitand(cas, this._case)).isUndefined) {
            if (this.preposition === "В" && prep === this.preposition) {
                if (this._case.isAccusative) {
                    if (cas.isUndefined || cas.isNominative) 
                        return true;
                }
            }
            return false;
        }
        if (prep !== null && this.preposition !== null) {
            if (prep === this.preposition) 
                return true;
            if (this.preposition === "ОТ" && prep === "ОТ ИМЕНИ") 
                return true;
        }
        return Utils.isNullOrEmpty(prep) && Utils.isNullOrEmpty(this.preposition);
    }
    
    checkAbstract(prep, cas) {
        for (const it of ControlModelQuestion.ITEMS) {
            if (!it.isAbstract && it.question === this.question) {
                if (it.check(prep, cas)) 
                    return it;
            }
        }
        return null;
    }
    
    constructor(prep, cas, typ = QuestionType.UNDEFINED) {
        this.question = QuestionType.UNDEFINED;
        this.preposition = null;
        this._case = null;
        this.spelling = null;
        this.spellingEx = null;
        this.id = 0;
        this.isBase = false;
        this.isAbstract = false;
        this.preposition = prep;
        this._case = cas;
        this.question = typ;
        if (prep !== null) {
            if (cas.isGenitive) 
                this.spelling = (prep.toLowerCase() + " чего");
            else if (cas.isDative) 
                this.spelling = (prep.toLowerCase() + " чему");
            else if (cas.isAccusative) 
                this.spelling = (prep.toLowerCase() + " что");
            else if (cas.isInstrumental) 
                this.spelling = (prep.toLowerCase() + " чем");
            else if (cas.isPrepositional) 
                this.spelling = (prep.toLowerCase() + " чём");
            this.spellingEx = this.spelling;
            if (typ === QuestionType.WHEN) 
                this.spellingEx = (this.spelling + "/когда");
            else if (typ === QuestionType.WHERE) 
                this.spellingEx = (this.spelling + "/где");
            else if (typ === QuestionType.WHEREFROM) 
                this.spellingEx = (this.spelling + "/откуда");
            else if (typ === QuestionType.WHERETO) 
                this.spellingEx = (this.spelling + "/куда");
        }
        else if (cas !== null) {
            if (cas.isNominative) {
                this.spelling = "кто";
                this.spellingEx = "кто/что";
            }
            else if (cas.isGenitive) {
                this.spelling = "чего";
                this.spellingEx = "кого/чего";
            }
            else if (cas.isDative) {
                this.spelling = "чему";
                this.spellingEx = "кому/чему";
            }
            else if (cas.isAccusative) {
                this.spelling = "что";
                this.spellingEx = "кого/что";
            }
            else if (cas.isInstrumental) {
                this.spelling = "чем";
                this.spellingEx = "кем/чем";
            }
        }
        else if (typ === QuestionType.WHATTODO) {
            this.spelling = "что делать";
            this.spellingEx = "что делать";
        }
        else if (typ === QuestionType.WHEN) {
            this.spelling = "когда";
            this.spellingEx = "когда";
        }
        else if (typ === QuestionType.WHERE) {
            this.spelling = "где";
            this.spellingEx = "где";
        }
        else if (typ === QuestionType.WHEREFROM) {
            this.spelling = "откуда";
            this.spellingEx = "откуда";
        }
        else if (typ === QuestionType.WHERETO) {
            this.spelling = "куда";
            this.spellingEx = "куда";
        }
    }
    
    static getBaseNominative() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseNominativeInd];
    }
    
    static getBaseGenetive() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseGenetiveInd];
    }
    
    static getBaseAccusative() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseAccusativeInd];
    }
    
    static getBaseInstrumental() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseInstrumentalInd];
    }
    
    static getBaseDative() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseDativeInd];
    }
    
    static getToDo() {
        return ControlModelQuestion.ITEMS[ControlModelQuestion.m_BaseToDoInd];
    }
    
    static initialize() {
        if (ControlModelQuestion.ITEMS !== null) 
            return;
        ControlModelQuestion.ITEMS = new Array();
        for (const s of ["ИЗ", "ОТ", "С", "ИЗНУТРИ"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.GENITIVE, QuestionType.WHEREFROM));
        }
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("В", MorphCase.ACCUSATIVE, QuestionType.WHERETO));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("НА", MorphCase.ACCUSATIVE, QuestionType.WHERETO));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("ПО", MorphCase.ACCUSATIVE, QuestionType.WHERETO));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("К", MorphCase.DATIVE, QuestionType.WHERETO));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("НАВСТРЕЧУ", MorphCase.DATIVE, QuestionType.WHERETO));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("ДО", MorphCase.GENITIVE, QuestionType.WHERETO));
        for (const s of ["У", "ОКОЛО", "ВОКРУГ", "ВОЗЛЕ", "ВБЛИЗИ", "МИМО", "ПОЗАДИ", "ВПЕРЕДИ", "ВГЛУБЬ", "ВДОЛЬ", "ВНЕ", "КРОМЕ", "МЕЖДУ", "НАПРОТИВ", "ПОВЕРХ", "ПОДЛЕ", "ПОПЕРЕК", "ПОСЕРЕДИНЕ", "СВЕРХ", "СРЕДИ", "СНАРУЖИ", "ВНУТРИ"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.GENITIVE, QuestionType.WHERE));
        }
        for (const s of ["ПАРАЛЛЕЛЬНО"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.DATIVE, QuestionType.WHERE));
        }
        for (const s of ["СКВОЗЬ", "ЧЕРЕЗ", "ПОД"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.ACCUSATIVE, QuestionType.WHERE));
        }
        for (const s of ["МЕЖДУ", "НАД", "ПОД", "ПЕРЕД", "ЗА"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.INSTRUMENTAL, QuestionType.WHERE));
        }
        for (const s of ["В", "НА", "ПРИ"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.PREPOSITIONAL, QuestionType.WHERE));
        }
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("ПРЕЖДЕ", MorphCase.GENITIVE, QuestionType.WHEN));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("ПОСЛЕ", MorphCase.GENITIVE, QuestionType.WHEN));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("НАКАНУНЕ", MorphCase.GENITIVE, QuestionType.WHEN));
        ControlModelQuestion.ITEMS.push(new ControlModelQuestion("СПУСТЯ", MorphCase.ACCUSATIVE, QuestionType.WHEN));
        for (const s of ["БЕЗ", "ДЛЯ", "РАДИ", "ИЗЗА", "ВВИДУ", "ВЗАМЕН", "ВМЕСТО", "ПРОТИВ", "СВЫШЕ", "ВСЛЕДСТВИЕ", "ПОМИМО", "ПОСРЕДСТВОМ", "ПУТЕМ"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.GENITIVE));
        }
        for (const s of ["ПО", "ПОДОБНО", "СОГЛАСНО", "СООТВЕТСТВЕННО", "СОРАЗМЕРНО", "ВОПРЕКИ"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.DATIVE));
        }
        for (const s of ["ПРО", "О", "ЗА", "ВКЛЮЧАЯ", "С"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.ACCUSATIVE));
        }
        for (const s of ["С"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.INSTRUMENTAL));
        }
        for (const s of ["О", "ПО"]) {
            ControlModelQuestion.ITEMS.push(new ControlModelQuestion(s, MorphCase.PREPOSITIONAL));
        }
        for (let i = 0; i < ControlModelQuestion.ITEMS.length; i++) {
            for (let j = 0; j < (ControlModelQuestion.ITEMS.length - 1); j++) {
                if (ControlModelQuestion.ITEMS[j].compareTo(ControlModelQuestion.ITEMS[j + 1]) > 0) {
                    let it = ControlModelQuestion.ITEMS[j];
                    ControlModelQuestion.ITEMS[j] = ControlModelQuestion.ITEMS[j + 1];
                    ControlModelQuestion.ITEMS[j + 1] = it;
                }
            }
        }
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseNominativeInd = 0), 0, ControlModelQuestion._new2985(null, MorphCase.NOMINATIVE, true));
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseGenetiveInd = 1), 0, ControlModelQuestion._new2985(null, MorphCase.GENITIVE, true));
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseAccusativeInd = 2), 0, ControlModelQuestion._new2985(null, MorphCase.ACCUSATIVE, true));
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseInstrumentalInd = 3), 0, ControlModelQuestion._new2985(null, MorphCase.INSTRUMENTAL, true));
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseDativeInd = 4), 0, ControlModelQuestion._new2985(null, MorphCase.DATIVE, true));
        ControlModelQuestion.ITEMS.splice((ControlModelQuestion.m_BaseToDoInd = 5), 0, new ControlModelQuestion(null, null, QuestionType.WHATTODO));
        ControlModelQuestion.ITEMS.splice(6, 0, ControlModelQuestion._new2990(null, null, QuestionType.WHERE, true));
        ControlModelQuestion.ITEMS.splice(7, 0, ControlModelQuestion._new2990(null, null, QuestionType.WHERETO, true));
        ControlModelQuestion.ITEMS.splice(8, 0, ControlModelQuestion._new2990(null, null, QuestionType.WHEREFROM, true));
        ControlModelQuestion.ITEMS.splice(9, 0, ControlModelQuestion._new2990(null, null, QuestionType.WHEN, true));
        ControlModelQuestion.m_HashBySpel = new Hashtable();
        for (let i = 0; i < ControlModelQuestion.ITEMS.length; i++) {
            let it = ControlModelQuestion.ITEMS[i];
            it.id = i + 1;
            ControlModelQuestion.m_HashBySpel.put(it.spelling, i);
        }
    }
    
    compareTo(other) {
        let i = Utils.compareStrings(this.preposition, other.preposition, false);
        if (i !== 0) 
            return i;
        if (this._casRank() < other._casRank()) 
            return -1;
        if (this._casRank() > other._casRank()) 
            return 1;
        return 0;
    }
    
    _casRank() {
        if (this._case.isGenitive) 
            return 1;
        if (this._case.isDative) 
            return 2;
        if (this._case.isAccusative) 
            return 3;
        if (this._case.isInstrumental) 
            return 4;
        if (this._case.isPrepositional) 
            return 5;
        return 0;
    }
    
    static getById(_id) {
        if (_id >= 1 && _id <= ControlModelQuestion.ITEMS.length) 
            return ControlModelQuestion.ITEMS[_id - 1];
        return null;
    }
    
    static findBySpel(spel) {
        let ind = 0;
        let wrapind2994 = new RefOutArgWrapper();
        let inoutres2995 = ControlModelQuestion.m_HashBySpel.tryGetValue(spel, wrapind2994);
        ind = wrapind2994.value;
        if (!inoutres2995) 
            return null;
        return ControlModelQuestion.ITEMS[ind];
    }
    
    static _new2985(_arg1, _arg2, _arg3) {
        let res = new ControlModelQuestion(_arg1, _arg2);
        res.isBase = _arg3;
        return res;
    }
    
    static _new2990(_arg1, _arg2, _arg3, _arg4) {
        let res = new ControlModelQuestion(_arg1, _arg2, _arg3);
        res.isAbstract = _arg4;
        return res;
    }
    
    static static_constructor() {
        ControlModelQuestion.m_BaseNominativeInd = 0;
        ControlModelQuestion.m_BaseGenetiveInd = 0;
        ControlModelQuestion.m_BaseAccusativeInd = 0;
        ControlModelQuestion.m_BaseInstrumentalInd = 0;
        ControlModelQuestion.m_BaseDativeInd = 0;
        ControlModelQuestion.m_BaseToDoInd = 0;
        ControlModelQuestion.ITEMS = null;
        ControlModelQuestion.m_HashBySpel = null;
    }
}


ControlModelQuestion.static_constructor();

module.exports = ControlModelQuestion