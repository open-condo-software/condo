/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const MorphLang = require("./../../morph/MorphLang");
const VerbPhraseItemToken = require("./../../ner/core/VerbPhraseItemToken");
const MetaToken = require("./../../ner/MetaToken");
const MorphCase = require("./../../morph/MorphCase");
const SemanticAbstractSlave = require("./SemanticAbstractSlave");
const SemanticRole = require("./SemanticRole");
const MorphPerson = require("./../../morph/MorphPerson");
const ControlModelItemType = require("./../utils/ControlModelItemType");
const SemanticLink = require("./SemanticLink");
const MorphClass = require("./../../morph/MorphClass");
const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const NounPhraseToken = require("./../../ner/core/NounPhraseToken");
const VerbPhraseToken = require("./../../ner/core/VerbPhraseToken");
const ControlModelQuestion = require("./../utils/ControlModelQuestion");
const MorphWordForm = require("./../../morph/MorphWordForm");
const DerivateService = require("./../utils/DerivateService");
const Token = require("./../../ner/Token");
const TextToken = require("./../../ner/TextToken");
const NumberToken = require("./../../ner/NumberToken");

/**
 * Полезные фукнции для семантического анализа
 * 
 * Хелпер семантики
 */
class SemanticHelper {
    
    static getKeyword(mt) {
        let vpt = Utils.as(mt, VerbPhraseToken);
        if (vpt !== null) 
            return (vpt.lastVerb.verbMorph.normalFull != null ? vpt.lastVerb.verbMorph.normalFull : vpt.lastVerb.verbMorph.normalCase);
        let npt = Utils.as(mt, NounPhraseToken);
        if (npt !== null) 
            return npt.noun.endToken.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
        return null;
    }
    
    static findDerivates(t) {
        let res = null;
        let cla = null;
        if (t instanceof NounPhraseToken) {
            t = t.noun.endToken;
            cla = MorphClass.NOUN;
            let mc = t.getMorphClassInDictionary();
            if (!mc.isNoun) 
                cla = mc;
        }
        if (t instanceof TextToken) {
            for (const f of t.morph.items) {
                if (f instanceof MorphWordForm) {
                    if (cla !== null) {
                        if ((MorphClass.ooBitand(cla, f._class)).isUndefined) 
                            continue;
                    }
                    res = DerivateService.findDerivates((f.normalFull != null ? f.normalFull : f.normalCase), true, null);
                    if (res !== null && res.length > 0) 
                        return res;
                }
            }
            return null;
        }
        if (t instanceof VerbPhraseToken) 
            return SemanticHelper.findDerivates(t.lastVerb);
        if (t instanceof VerbPhraseItemToken) {
            let vpt = Utils.as(t, VerbPhraseItemToken);
            if (vpt.verbMorph !== null) {
                res = DerivateService.findDerivates(vpt.verbMorph.normalCase, true, t.morph.language);
                if (res === null || (res.length === 0 && vpt.verbMorph.normalFull !== null && vpt.verbMorph.normalCase !== vpt.verbMorph.normalFull)) 
                    res = DerivateService.findDerivates(vpt.verbMorph.normalFull, true, t.morph.language);
            }
            return res;
        }
        if (t instanceof NumberToken) {
            if (t.value === "1") 
                return DerivateService.findDerivates("ОДИН", true, MorphLang.RU);
        }
        if (t instanceof MetaToken) 
            return SemanticHelper.findDerivates(t.endToken);
        return null;
    }
    
    static findWordInGroup(mt, gr) {
        if (gr === null || mt === null) 
            return null;
        let t = null;
        if (mt instanceof NounPhraseToken) 
            t = mt.noun.endToken;
        else if ((mt instanceof SemanticAbstractSlave) && (mt.source instanceof NounPhraseToken)) 
            t = mt.source.noun.endToken;
        else 
            t = mt.endToken;
        for (const w of gr.words) {
            if (w._class !== null && w._class.isNoun && ((w.lang === null || w.lang.isRu))) {
                if (t.isValue(w.spelling, null)) 
                    return w;
            }
        }
        return null;
    }
    
    static findControlItem(mt, gr) {
        if (gr === null) 
            return null;
        if (mt instanceof NounPhraseToken) {
            let t = mt.noun.endToken;
            for (const m of gr.model.items) {
                if (m.word !== null) {
                    if (t.isValue(m.word, null)) 
                        return m;
                }
            }
            for (const w of gr.words) {
                if (w.attrs.isVerbNoun) {
                    if (t.isValue(w.spelling, null)) 
                        return gr.model.findItemByTyp(ControlModelItemType.NOUN);
                }
            }
            return null;
        }
        if (mt instanceof VerbPhraseItemToken) {
            let ti = Utils.as(mt, VerbPhraseItemToken);
            let rev = ti.isVerbReversive || ti.isVerbPassive;
            for (const it of gr.model.items) {
                if (rev && it.typ === ControlModelItemType.REFLEXIVE) 
                    return it;
                else if (!rev && it.typ === ControlModelItemType.VERB) 
                    return it;
            }
        }
        return null;
    }
    
    /**
     * Попробовать создать семантическую связь между элементами. 
     * Элементом м.б. именная (NounPhraseToken) или глагольная группа (VerbPhraseToken).
     * @param master основной элемент
     * @param slave стыкуемый элемент (также м.б. SemanticAbstractSlave)
     * @param onto дополнительный онтологический словарь
     * @return список вариантов (возможно, пустой)
     * 
     */
    static tryCreateLinks(master, slave, onto = null) {
        let res = new Array();
        let vpt1 = Utils.as(master, VerbPhraseToken);
        let vpt2 = Utils.as(slave, VerbPhraseToken);
        let npt1 = Utils.as(master, NounPhraseToken);
        if (slave instanceof NounPhraseToken) 
            slave = SemanticAbstractSlave.createFromNoun(Utils.as(slave, NounPhraseToken));
        let sla2 = Utils.as(slave, SemanticAbstractSlave);
        if (vpt2 !== null) {
            if (!vpt2.firstVerb.isVerbInfinitive || !vpt2.lastVerb.isVerbInfinitive) 
                return res;
        }
        let grs = SemanticHelper.findDerivates(master);
        if (grs === null || grs.length === 0) {
            let rl = (vpt1 !== null ? SemanticHelper._tryCreateVerb(vpt1, slave, null) : SemanticHelper._tryCreateNoun(npt1, slave, null));
            if (rl !== null) 
                res.splice(res.length, 0, ...rl);
        }
        else 
            for (const gr of grs) {
                let rl = (vpt1 !== null ? SemanticHelper._tryCreateVerb(vpt1, slave, gr) : SemanticHelper._tryCreateNoun(npt1, slave, gr));
                if (rl === null || rl.length === 0) 
                    continue;
                res.splice(res.length, 0, ...rl);
            }
        if ((npt1 !== null && sla2 !== null && sla2.morph._case.isGenitive) && sla2.preposition === null) {
            if (npt1.noun.beginToken.getMorphClassInDictionary().isPersonalPronoun) {
            }
            else {
                let hasGen = false;
                for (const r of res) {
                    if (r.question === ControlModelQuestion.getBaseGenetive()) {
                        hasGen = true;
                        break;
                    }
                }
                if (!hasGen) 
                    res.push(SemanticLink._new2967(true, npt1, sla2, 0.5, ControlModelQuestion.getBaseGenetive()));
            }
        }
        if (onto !== null) {
            let str1 = SemanticHelper.getKeyword(master);
            let str2 = SemanticHelper.getKeyword(slave);
            if (str2 !== null) {
                if (onto.checkLink(str1, str2)) {
                    if (res.length > 0) {
                        for (const r of res) {
                            r.rank += (3);
                            if (r.role === SemanticRole.COMMON) 
                                r.role = SemanticRole.STRONG;
                        }
                    }
                    else 
                        res.push(SemanticLink._new2968(SemanticRole.STRONG, master, slave, 3));
                }
            }
        }
        if (npt1 !== null) {
            if (((npt1.adjectives.length > 0 && npt1.adjectives[0].beginToken.morph._class.isPronoun)) || npt1.anafor !== null) {
                for (const r of res) {
                    if (r.question === ControlModelQuestion.getBaseGenetive()) {
                        r.rank -= 0.5;
                        if (r.role === SemanticRole.STRONG) 
                            r.role = SemanticRole.COMMON;
                    }
                }
            }
        }
        for (const r of res) {
            if (r.role === SemanticRole.STRONG) {
                for (const rr of res) {
                    if (rr !== r && rr.role !== SemanticRole.STRONG) 
                        rr.rank /= (2);
                }
            }
        }
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < (res.length - 1); j++) {
                if (res[j].compareTo(res[j + 1]) > 0) {
                    let r = res[j];
                    res[j] = res[j + 1];
                    res[j + 1] = r;
                }
            }
        }
        for (const r of res) {
            r.master = master;
            r.slave = slave;
        }
        return res;
    }
    
    static _tryCreateInf(master, vpt2, gr) {
        let cit = SemanticHelper.findControlItem(master, gr);
        let res = new Array();
        let rol = SemanticRole.of(null);
        if (cit !== null && cit.links.containsKey(ControlModelQuestion.getToDo())) 
            rol = cit.links.get(ControlModelQuestion.getToDo());
        if (rol !== null) 
            res.push(SemanticLink._new2969((rol !== SemanticRole.COMMON ? 2 : 1), ControlModelQuestion.getToDo()));
        return res;
    }
    
    static _tryCreateNoun(npt1, slave, gr) {
        if (npt1 === null || slave === null) 
            return null;
        if (slave instanceof VerbPhraseToken) 
            return SemanticHelper._tryCreateInf(npt1, Utils.as(slave, VerbPhraseToken), gr);
        let sla2 = Utils.as(slave, SemanticAbstractSlave);
        let res = new Array();
        if (sla2 === null) 
            return res;
        let cit = SemanticHelper.findControlItem(npt1, gr);
        SemanticHelper._createRoles(cit, sla2.preposition, sla2.morph._case, res, false, false);
        if (res.length === 1 && res[0].role === SemanticRole.AGENT && res[0].question === ControlModelQuestion.getBaseInstrumental()) {
            if (gr.model.items.length > 0 && gr.model.items[0].typ === ControlModelItemType.VERB && gr.model.items[0].links.containsKey(ControlModelQuestion.getBaseInstrumental())) 
                res[0].role = gr.model.items[0].links.get(ControlModelQuestion.getBaseInstrumental());
        }
        let ok = false;
        let w = SemanticHelper.findWordInGroup(npt1, gr);
        if (w !== null && w.nextWords !== null && w.nextWords.length > 0) {
            for (const n of w.nextWords) {
                if (sla2.source !== null) {
                    if (sla2.source.endToken.isValue(n, null)) {
                        ok = true;
                        break;
                    }
                }
            }
        }
        if (gr !== null && gr.model.pacients.length > 0) {
            for (const n of gr.model.pacients) {
                if (sla2.source !== null) {
                    if (sla2.source.endToken.isValue(n, null)) {
                        ok = true;
                        break;
                    }
                }
            }
        }
        if (ok) {
            if (res.length === 0) 
                res.push(SemanticLink._new2970(ControlModelQuestion.getBaseGenetive(), SemanticRole.PACIENT, true));
            for (const r of res) {
                r.rank += (4);
                if (r.role === SemanticRole.COMMON) 
                    r.role = SemanticRole.STRONG;
                if (npt1.endToken.next === sla2.beginToken) 
                    r.rank += (2);
                r.idiom = true;
            }
        }
        return res;
    }
    
    static _tryCreateVerb(vpt1, slave, gr) {
        if (slave instanceof VerbPhraseToken) 
            return SemanticHelper._tryCreateInf(vpt1, Utils.as(slave, VerbPhraseToken), gr);
        let sla2 = Utils.as(slave, SemanticAbstractSlave);
        let res = new Array();
        if (sla2 === null) 
            return res;
        let cit = SemanticHelper.findControlItem(vpt1.lastVerb, gr);
        let prep = sla2.preposition;
        let _morph = sla2.morph;
        let isRev1 = vpt1.lastVerb.isVerbReversive || vpt1.lastVerb.isVerbPassive;
        let noNomin = false;
        let noInstr = false;
        if (prep === null && _morph._case.isNominative && !vpt1.firstVerb.isParticiple) {
            if (vpt1.firstVerb.verbMorph === null) 
                noNomin = true;
            else {
                let ok = true;
                let err = false;
                let vm = vpt1.firstVerb.verbMorph;
                if (vm.number === MorphNumber.SINGULAR) {
                    if (_morph.number === MorphNumber.PLURAL) {
                        if (!vpt1.firstVerb.isVerbInfinitive) 
                            ok = false;
                    }
                }
                if (!SemanticHelper.checkMorphAccord(_morph, false, vm, false)) {
                    if (!err && !vpt1.firstVerb.isVerbInfinitive) 
                        ok = false;
                }
                else if (vm.misc.person !== MorphPerson.UNDEFINED) {
                    if (((vm.misc.person.value()) & (MorphPerson.THIRD.value())) === (MorphPerson.UNDEFINED.value())) {
                        if (((vm.misc.person.value()) & (MorphPerson.FIRST.value())) === (MorphPerson.FIRST.value())) {
                            if (!_morph.containsAttr("1 л.", null)) 
                                ok = false;
                        }
                        if (((vm.misc.person.value()) & (MorphPerson.SECOND.value())) === (MorphPerson.SECOND.value())) {
                            if (!_morph.containsAttr("2 л.", null)) 
                                ok = false;
                        }
                    }
                }
                noNomin = true;
                if (ok) {
                    let cit00 = cit;
                    let isRev0 = isRev1;
                    if (vpt1.firstVerb !== vpt1.lastVerb && ((vpt1.firstVerb.isVerbReversive || vpt1.firstVerb.isVerbPassive || vpt1.firstVerb.normal === "ИМЕТЬ"))) {
                        cit00 = null;
                        isRev0 = true;
                        let grs = SemanticHelper.findDerivates(vpt1.firstVerb);
                        if (grs !== null) {
                            for (const gg of grs) {
                                if ((((cit00 = SemanticHelper.findControlItem(vpt1.firstVerb, gg)))) !== null) 
                                    break;
                            }
                        }
                    }
                    let sl = null;
                    let addagent = false;
                    if (cit00 === null) 
                        sl = SemanticLink._new2971(true, (isRev0 ? SemanticRole.PACIENT : SemanticRole.AGENT), 1, ControlModelQuestion.getBaseNominative(), isRev0);
                    else 
                        for (const kp of cit00.links.entries) {
                            let q = kp.key;
                            if (q.check(null, MorphCase.NOMINATIVE)) {
                                sl = SemanticLink._new2972(kp.value, 2, q, isRev0);
                                if (sl.role === SemanticRole.AGENT) 
                                    sl.isPassive = false;
                                else if (sl.role === SemanticRole.PACIENT && cit00.nominativeCanBeAgentAndPacient && vpt1.lastVerb.isVerbReversive) 
                                    addagent = true;
                                break;
                            }
                        }
                    if (sl !== null) {
                        if (cit00 === null && _morph._case.isInstrumental && isRev0) 
                            sl.rank -= 0.5;
                        if (_morph._case.isAccusative) 
                            sl.rank -= 0.5;
                        if (sla2.beginChar > vpt1.beginChar) 
                            sl.rank -= 0.5;
                        if (err) 
                            sl.rank -= 0.5;
                        res.push(sl);
                        if (addagent) 
                            res.push(SemanticLink._new2973(SemanticRole.AGENT, sl.rank, sl.question));
                    }
                }
            }
        }
        if (prep === null && isRev1 && _morph._case.isInstrumental) {
            noInstr = true;
            let cit00 = cit;
            let sl = null;
            if (cit00 === null) 
                sl = SemanticLink._new2971(true, SemanticRole.AGENT, 1, ControlModelQuestion.getBaseInstrumental(), true);
            else 
                for (const kp of cit00.links.entries) {
                    let q = kp.key;
                    if (q.check(null, MorphCase.INSTRUMENTAL)) {
                        sl = SemanticLink._new2973(kp.value, 2, q);
                        if (sl.role === SemanticRole.AGENT) 
                            sl.isPassive = true;
                        break;
                    }
                }
            if (sl !== null) {
                if (cit00 === null && _morph._case.isNominative) 
                    sl.rank -= 0.5;
                if (_morph._case.isAccusative) 
                    sl.rank -= 0.5;
                if (sla2.beginChar < vpt1.beginChar) 
                    sl.rank -= 0.5;
                res.push(sl);
                if ((gr !== null && gr.model.items.length > 0 && gr.model.items[0].typ === ControlModelItemType.VERB) && gr.model.items[0].links.containsKey(ControlModelQuestion.getBaseInstrumental())) {
                    sl.rank = 0;
                    let sl0 = SemanticLink._new2976(sl.question, 1, gr.model.items[0].links.get(ControlModelQuestion.getBaseInstrumental()));
                    res.splice(0, 0, sl0);
                }
            }
        }
        if (prep === null && _morph._case.isDative && ((cit === null || !cit.links.containsKey(ControlModelQuestion.getBaseDative())))) {
            let sl = SemanticLink._new2977(cit === null, SemanticRole.STRONG, 1, ControlModelQuestion.getBaseDative());
            if (_morph._case.isAccusative || _morph._case.isNominative) 
                sl.rank -= 0.5;
            if (vpt1.endToken.next !== sla2.beginToken) 
                sl.rank -= 0.5;
            if (cit !== null) 
                sl.rank -= 0.5;
            res.push(sl);
        }
        SemanticHelper._createRoles(cit, prep, _morph._case, res, noNomin, noInstr);
        if (gr !== null && gr.model.pacients.length > 0) {
            let ok = false;
            for (const n of gr.model.pacients) {
                if (sla2.source !== null) {
                    if (sla2.source.endToken.isValue(n, null)) {
                        ok = true;
                        break;
                    }
                }
                else if (sla2.endToken.isValue(n, null)) {
                    ok = true;
                    break;
                }
            }
            if (ok) {
                if (res.length === 0) {
                    ok = false;
                    if (prep === null && isRev1 && _morph._case.isNominative) 
                        ok = true;
                    else if (prep === null && !isRev1 && _morph._case.isAccusative) 
                        ok = true;
                    if (ok) 
                        res.push(SemanticLink._new2978(SemanticRole.PACIENT, (isRev1 ? ControlModelQuestion.getBaseNominative() : ControlModelQuestion.getBaseAccusative()), true));
                }
                else 
                    for (const r of res) {
                        r.rank += (4);
                        if (r.role === SemanticRole.COMMON) 
                            r.role = SemanticRole.STRONG;
                        if (vpt1.endToken.next === sla2.beginToken) 
                            r.rank += (2);
                        r.idiom = true;
                    }
            }
        }
        return res;
    }
    
    static _createRoles(cit, prep, cas, res, ignoreNominCase = false, ignoreInstrCase = false) {
        if (cit === null) 
            return;
        let roles = null;
        for (const li of cit.links.entries) {
            let q = li.key;
            if (q.check(prep, cas)) {
                if (ignoreNominCase && q._case.isNominative && q.preposition === null) 
                    continue;
                if (ignoreInstrCase && q._case.isInstrumental && q.preposition === null) 
                    continue;
                if (roles === null) 
                    roles = new Hashtable();
                let r = li.value;
                if (q.isAbstract) {
                    let qq = q.checkAbstract(prep, cas);
                    if (qq !== null) {
                        q = qq;
                        r = SemanticRole.COMMON;
                    }
                }
                if (!roles.containsKey(q)) 
                    roles.put(q, r);
                else if (r !== SemanticRole.COMMON) 
                    roles.put(q, r);
            }
        }
        if (roles !== null) {
            for (const kp of roles.entries) {
                let sl = SemanticLink._new2973(kp.value, 2, kp.key);
                if (kp.value === SemanticRole.AGENT) {
                    if (!kp.key.isBase) 
                        sl.role = SemanticRole.COMMON;
                }
                if (sl.role === SemanticRole.STRONG) 
                    sl.rank += (2);
                res.push(sl);
            }
        }
    }
    
    static checkMorphAccord(m, plural, vf, checkCase = false) {
        if (checkCase && !m._case.isUndefined && !vf._case.isUndefined) {
            if ((MorphCase.ooBitand(m._case, vf._case)).isUndefined) 
                return false;
        }
        let coef = 0;
        if (vf.number === MorphNumber.PLURAL) {
            if (plural) 
                coef++;
            else if (m.number !== MorphNumber.UNDEFINED) {
                if (((m.number.value()) & (MorphNumber.PLURAL.value())) === (MorphNumber.PLURAL.value())) 
                    coef++;
                else 
                    return false;
            }
        }
        else if (vf.number === MorphNumber.SINGULAR) {
            if (plural) 
                return false;
            if (m.number !== MorphNumber.UNDEFINED) {
                if (((m.number.value()) & (MorphNumber.SINGULAR.value())) === (MorphNumber.SINGULAR.value())) 
                    coef++;
                else 
                    return false;
            }
            if (m.gender !== MorphGender.UNDEFINED) {
                if (vf.gender !== MorphGender.UNDEFINED) {
                    if (m.gender === MorphGender.FEMINIE) {
                        if (((vf.gender.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) 
                            coef++;
                        else 
                            return false;
                    }
                    else if (((m.gender.value()) & (vf.gender.value())) !== (MorphGender.UNDEFINED.value())) 
                        coef++;
                    else if (m.gender === MorphGender.MASCULINE && vf.gender === MorphGender.FEMINIE) {
                    }
                    else 
                        return false;
                }
            }
        }
        return coef >= 0;
    }
}


module.exports = SemanticHelper