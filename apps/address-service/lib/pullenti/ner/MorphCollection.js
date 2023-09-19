/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const MorphGender = require("./../morph/MorphGender");
const MorphVoice = require("./../morph/MorphVoice");
const MorphNumber = require("./../morph/MorphNumber");
const LanguageHelper = require("./../morph/LanguageHelper");
const MorphMiscInfo = require("./../morph/MorphMiscInfo");
const MorphLang = require("./../morph/MorphLang");
const MorphClass = require("./../morph/MorphClass");
const MorphCase = require("./../morph/MorphCase");
const MorphBaseInfo = require("./../morph/MorphBaseInfo");
const MorphWordForm = require("./../morph/MorphWordForm");

/**
 * Коллекция морфологических вариантов
 * Морфология токена
 */
class MorphCollection extends MorphBaseInfo {
    
    constructor(source = null) {
        super();
        this.m_Class = new MorphClass();
        this.m_Gender = MorphGender.UNDEFINED;
        this.m_Number = MorphNumber.UNDEFINED;
        this.m_Case = new MorphCase();
        this.m_Language = new MorphLang();
        this.m_Voice = MorphVoice.UNDEFINED;
        this.m_NeedRecalc = true;
        this.m_Items = null;
        if (source === null) 
            return;
        for (const it of source.items) {
            let mi = null;
            if (it instanceof MorphWordForm) {
                let wf = new MorphWordForm();
                wf.copyFromWordForm(Utils.as(it, MorphWordForm));
                mi = wf;
            }
            else {
                mi = new MorphBaseInfo();
                mi.copyFrom(it);
            }
            if (this.m_Items === null) 
                this.m_Items = new Array();
            this.m_Items.push(mi);
        }
        this.m_Class = MorphClass._new266(source.m_Class.value);
        this.m_Gender = source.m_Gender;
        this.m_Case = MorphCase._new242(source.m_Case.value);
        this.m_Number = source.m_Number;
        this.m_Language = MorphLang._new269(source.m_Language.value);
        this.m_Voice = source.m_Voice;
        this.m_NeedRecalc = false;
    }
    
    toString() {
        let res = super.toString();
        if (this.voice !== MorphVoice.UNDEFINED) {
            if (this.voice === MorphVoice.ACTIVE) 
                res += " действ.з.";
            else if (this.voice === MorphVoice.PASSIVE) 
                res += " страд.з.";
            else if (this.voice === MorphVoice.MIDDLE) 
                res += " сред. з.";
        }
        return res;
    }
    
    /**
     * Создать копию
     * @return 
     */
    clone() {
        let res = new MorphCollection();
        if (this.m_Items !== null) {
            res.m_Items = new Array();
            try {
                res.m_Items.splice(res.m_Items.length, 0, ...this.m_Items);
            } catch (ex) {
            }
        }
        if (!this.m_NeedRecalc) {
            res.m_Class = MorphClass._new266(this.m_Class.value);
            res.m_Gender = this.m_Gender;
            res.m_Case = MorphCase._new242(this.m_Case.value);
            res.m_Number = this.m_Number;
            res.m_Language = MorphLang._new269(this.m_Language.value);
            res.m_NeedRecalc = false;
            res.m_Voice = this.m_Voice;
        }
        return res;
    }
    
    get itemsCount() {
        return (this.m_Items === null ? 0 : this.m_Items.length);
    }
    
    getIndexerItem(ind) {
        if (this.m_Items === null || (ind < 0) || ind >= this.m_Items.length) 
            return null;
        else 
            return this.m_Items[ind];
    }
    
    get items() {
        return (this.m_Items != null ? this.m_Items : MorphCollection.m_EmptyItems);
    }
    
    addItem(item) {
        if (this.m_Items === null) 
            this.m_Items = new Array();
        this.m_Items.push(item);
        this.m_NeedRecalc = true;
    }
    
    insertItem(ind, item) {
        if (this.m_Items === null) 
            this.m_Items = new Array();
        this.m_Items.splice(ind, 0, item);
        this.m_NeedRecalc = true;
    }
    
    removeItem(o) {
        if ((typeof o === 'number' || o instanceof Number)) 
            this._removeItemInt(o);
        else if (o instanceof MorphBaseInfo) 
            this._removeItemMorphBaseInfo(Utils.as(o, MorphBaseInfo));
    }
    
    _removeItemInt(i) {
        if (this.m_Items !== null && i >= 0 && (i < this.m_Items.length)) {
            this.m_Items.splice(i, 1);
            this.m_NeedRecalc = true;
        }
    }
    
    _removeItemMorphBaseInfo(item) {
        if (this.m_Items !== null && this.m_Items.includes(item)) {
            Utils.removeItem(this.m_Items, item);
            this.m_NeedRecalc = true;
        }
    }
    
    _recalc() {
        this.m_NeedRecalc = false;
        if (this.m_Items === null || this.m_Items.length === 0) 
            return;
        this.m_Class = new MorphClass();
        this.m_Gender = MorphGender.UNDEFINED;
        let g = this.m_Gender === MorphGender.UNDEFINED;
        this.m_Number = MorphNumber.UNDEFINED;
        let n = this.m_Number === MorphNumber.UNDEFINED;
        this.m_Case = new MorphCase();
        let ca = this.m_Case.isUndefined;
        let la = this.m_Language === null || this.m_Language.isUndefined;
        this.m_Voice = MorphVoice.UNDEFINED;
        let verbHasUndef = false;
        if (this.m_Items !== null) {
            for (const it of this.m_Items) {
                this.m_Class.value |= it._class.value;
                if (g) 
                    this.m_Gender = MorphGender.of((this.m_Gender.value()) | (it.gender.value()));
                if (ca) 
                    this.m_Case = MorphCase.ooBitor(this.m_Case, it._case);
                if (n) 
                    this.m_Number = MorphNumber.of((this.m_Number.value()) | (it.number.value()));
                if (la) 
                    this.m_Language.value |= it.language.value;
                if (it._class.isVerb) {
                    if (it instanceof MorphWordForm) {
                        let v = it.misc.voice;
                        if (v === MorphVoice.UNDEFINED) 
                            verbHasUndef = true;
                        else 
                            this.m_Voice = MorphVoice.of((this.m_Voice.value()) | (v.value()));
                    }
                }
            }
        }
        if (verbHasUndef) 
            this.m_Voice = MorphVoice.UNDEFINED;
    }
    
    get _class() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Class;
    }
    set _class(value) {
        this.m_Class = value;
        return value;
    }
    
    get _case() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Case;
    }
    set _case(value) {
        this.m_Case = value;
        return value;
    }
    
    get gender() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Gender;
    }
    set gender(value) {
        this.m_Gender = value;
        return value;
    }
    
    get number() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Number;
    }
    set number(value) {
        this.m_Number = value;
        return value;
    }
    
    get language() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Language;
    }
    set language(value) {
        this.m_Language = value;
        return value;
    }
    
    get voice() {
        if (this.m_NeedRecalc) 
            this._recalc();
        return this.m_Voice;
    }
    set voice(value) {
        if (this.m_NeedRecalc) 
            this._recalc();
        this.m_Voice = value;
        return value;
    }
    
    containsAttr(attrValue, cla = null) {
        for (const it of this.items) {
            if (cla !== null && cla.value !== (0) && (((it._class.value) & (cla.value))) === 0) 
                continue;
            if (it.containsAttr(attrValue, cla)) 
                return true;
        }
        return false;
    }
    
    checkAccord(v, ignoreGender = false, ignoreNumber = false) {
        for (const it of this.items) {
            if (v instanceof MorphCollection) {
                if (v.checkAccord(it, ignoreGender, ignoreNumber)) 
                    return true;
            }
            else if (it.checkAccord(v, ignoreGender, ignoreNumber)) 
                return true;
        }
        if (this.items.length > 0) 
            return false;
        return super.checkAccord(v, ignoreGender, ignoreNumber);
    }
    
    check(cl) {
        return (((this._class.value) & (cl.value))) !== 0;
    }
    
    /**
     * Удалить элементы, не соответствующие элементу
     * @param it 
     */
    removeItems(it, eq = false) {
        if (it instanceof MorphCase) 
            this._removeItemsMorphCase(it);
        else if (it instanceof MorphClass) 
            this._removeItemsMorphClass(it, eq);
        else if (it instanceof MorphBaseInfo) 
            this._removeItemsMorphBaseInfo(it);
        else if (it instanceof MorphNumber) 
            this._removeItemsMorphNumber(MorphNumber.of(it));
        else if (it instanceof MorphGender) 
            this._removeItemsMorphGender(MorphGender.of(it));
    }
    
    _removeItemsMorphCase(cas) {
        if (this.m_Items === null) 
            return;
        if (this.m_Items.length === 0) 
            this.m_Case = MorphCase.ooBitand(this.m_Case, cas);
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if ((MorphCase.ooBitand(this.m_Items[i]._case, cas)).isUndefined) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
            else if (!(MorphCase.ooBitand(this.m_Items[i]._case, cas)).equals(this.m_Items[i]._case)) {
                if (this.m_Items[i] instanceof MorphWordForm) {
                    let wf = new MorphWordForm();
                    wf.copyFromWordForm(Utils.as(this.m_Items[i], MorphWordForm));
                    wf._case = MorphCase.ooBitand(wf._case, cas);
                    this.m_Items[i] = wf;
                }
                else {
                    let bi = new MorphBaseInfo();
                    bi.copyFrom(this.m_Items[i]);
                    bi._case = MorphCase.ooBitand(bi._case, cas);
                    this.m_Items[i] = bi;
                }
                this.m_NeedRecalc = true;
            }
        }
        this.m_NeedRecalc = true;
    }
    
    _removeItemsMorphClass(cl, eq) {
        if (this.m_Items === null) 
            return;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            let ok = false;
            if ((((this.m_Items[i]._class.value) & (cl.value))) === 0) 
                ok = true;
            else if (eq && this.m_Items[i]._class.value !== cl.value) 
                ok = true;
            if (ok) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
        }
        this.m_NeedRecalc = true;
    }
    
    _removeItemsMorphBaseInfo(inf) {
        if (this.m_Items === null) 
            return;
        if (this.m_Items.length === 0) {
            if (inf.gender !== MorphGender.UNDEFINED) 
                this.m_Gender = MorphGender.of((this.m_Gender.value()) & (inf.gender.value()));
            if (inf.number !== MorphNumber.UNDEFINED) 
                this.m_Number = MorphNumber.of((this.m_Number.value()) & (inf.number.value()));
            if (!inf._case.isUndefined) 
                this.m_Case = MorphCase.ooBitand(this.m_Case, inf._case);
            return;
        }
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            let ok = true;
            let it = this.m_Items[i];
            if (inf.gender !== MorphGender.UNDEFINED) {
                if (((it.gender.value()) & (inf.gender.value())) === (MorphGender.UNDEFINED.value())) 
                    ok = false;
            }
            let chNum = false;
            if (inf.number !== MorphNumber.PLURAL && inf.number !== MorphNumber.UNDEFINED) {
                if (((it.number.value()) & (inf.number.value())) === (MorphNumber.UNDEFINED.value())) 
                    ok = false;
                chNum = true;
            }
            if (!inf._class.isUndefined) {
                if ((MorphClass.ooBitand(inf._class, it._class)).isUndefined) 
                    ok = false;
            }
            if (!inf._case.isUndefined) {
                if ((MorphCase.ooBitand(inf._case, it._case)).isUndefined) 
                    ok = false;
            }
            if (!ok) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
            else {
                if (!inf._case.isUndefined) {
                    if (!it._case.equals(MorphCase.ooBitand(inf._case, it._case))) {
                        it._case = (MorphCase.ooBitand(inf._case, it._case));
                        this.m_NeedRecalc = true;
                    }
                }
                if (inf.gender !== MorphGender.UNDEFINED) {
                    if ((it.gender.value()) !== ((inf.gender.value()) & (it.gender.value()))) {
                        it.gender = MorphGender.of((inf.gender.value()) & (it.gender.value()));
                        this.m_NeedRecalc = true;
                    }
                }
                if (chNum) {
                    if ((it.number.value()) !== ((inf.number.value()) & (it.number.value()))) {
                        it.number = MorphNumber.of((inf.number.value()) & (it.number.value()));
                        this.m_NeedRecalc = true;
                    }
                }
            }
        }
    }
    
    /**
     * Убрать элементы, не соответствующие по падежу предлогу
     * @param prep 
     */
    removeItemsByPreposition(prep) {
        const TextToken = require("./TextToken");
        if (!(prep instanceof TextToken)) 
            return;
        let mc = LanguageHelper.getCaseAfterPreposition(prep.lemma);
        if ((MorphCase.ooBitand(mc, this._case)).isUndefined) 
            return;
        this.removeItems(mc, false);
    }
    
    /**
     * Удалить элементы не из словаря (если все не из словаря, то ничего не удаляется). 
     * То есть оставить только словарный вариант.
     */
    removeNotInDictionaryItems() {
        if (this.m_Items === null) 
            return;
        let hasInDict = false;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if ((this.m_Items[i] instanceof MorphWordForm) && this.m_Items[i].isInDictionary) {
                hasInDict = true;
                break;
            }
        }
        if (hasInDict) {
            for (let i = this.m_Items.length - 1; i >= 0; i--) {
                if ((this.m_Items[i] instanceof MorphWordForm) && !this.m_Items[i].isInDictionary) {
                    this.m_Items.splice(i, 1);
                    this.m_NeedRecalc = true;
                }
            }
        }
    }
    
    removeProperItems() {
        if (this.m_Items === null) 
            return;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if (this.m_Items[i]._class.isProper) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
        }
    }
    
    _removeItemsMorphNumber(num) {
        if (this.m_Items === null) 
            return;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if (((this.m_Items[i].number.value()) & (num.value())) === (MorphNumber.UNDEFINED.value())) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
        }
    }
    
    _removeItemsMorphGender(gen) {
        if (this.m_Items === null) 
            return;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if (((this.m_Items[i].gender.value()) & (gen.value())) === (MorphGender.UNDEFINED.value())) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
        }
    }
    
    /**
     * Удалить элементы, не соответствующие заданным параметрам
     * @param bis 
     * @param cla 
     */
    removeItemsListCla(bis, cla) {
        if (this.m_Items === null) 
            return;
        for (let i = this.m_Items.length - 1; i >= 0; i--) {
            if (cla !== null && !cla.isUndefined) {
                if ((((this.m_Items[i]._class.value) & (cla.value))) === 0) {
                    if (((this.m_Items[i]._class.isProper || this.m_Items[i]._class.isNoun)) && ((cla.isProper || cla.isNoun))) {
                    }
                    else {
                        this.m_Items.splice(i, 1);
                        this.m_NeedRecalc = true;
                        continue;
                    }
                }
            }
            let ok = false;
            for (const it of bis) {
                if (!it._case.isUndefined && !this.m_Items[i]._case.isUndefined) {
                    if ((MorphCase.ooBitand(this.m_Items[i]._case, it._case)).isUndefined) 
                        continue;
                }
                if (it.gender !== MorphGender.UNDEFINED && this.m_Items[i].gender !== MorphGender.UNDEFINED) {
                    if (((it.gender.value()) & (this.m_Items[i].gender.value())) === (MorphGender.UNDEFINED.value())) 
                        continue;
                }
                if (it.number !== MorphNumber.UNDEFINED && this.m_Items[i].number !== MorphNumber.UNDEFINED) {
                    if (((it.number.value()) & (this.m_Items[i].number.value())) === (MorphNumber.UNDEFINED.value())) 
                        continue;
                }
                ok = true;
                break;
            }
            if (!ok) {
                this.m_Items.splice(i, 1);
                this.m_NeedRecalc = true;
            }
        }
    }
    
    /**
     * Удалить элементы, не соответствующие другой морфологической коллекции
     * @param col 
     */
    removeItemsEx(col, cla) {
        this.removeItemsListCla(col.items, cla);
    }
    
    findItem(cas, num = MorphNumber.UNDEFINED, gen = MorphGender.UNDEFINED) {
        if (this.m_Items === null) 
            return null;
        let res = null;
        let maxCoef = 0;
        for (const it of this.m_Items) {
            if (!cas.isUndefined) {
                if ((MorphCase.ooBitand(it._case, cas)).isUndefined) 
                    continue;
            }
            if (num !== MorphNumber.UNDEFINED) {
                if (((num.value()) & (it.number.value())) === (MorphNumber.UNDEFINED.value())) 
                    continue;
            }
            if (gen !== MorphGender.UNDEFINED) {
                if (((gen.value()) & (it.gender.value())) === (MorphGender.UNDEFINED.value())) 
                    continue;
            }
            let wf = Utils.as(it, MorphWordForm);
            if (wf !== null && wf.undefCoef > (0)) {
                if (wf.undefCoef > maxCoef) {
                    maxCoef = wf.undefCoef;
                    res = it;
                }
                continue;
            }
            return it;
        }
        return res;
    }
    
    serialize(stream) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        SerializerHelper.serializeShort(stream, this.m_Class.value);
        SerializerHelper.serializeShort(stream, this.m_Case.value);
        SerializerHelper.serializeShort(stream, this.m_Gender.value());
        SerializerHelper.serializeShort(stream, this.m_Number.value());
        SerializerHelper.serializeShort(stream, this.m_Voice.value());
        SerializerHelper.serializeShort(stream, this.m_Language.value);
        if (this.m_Items === null) 
            this.m_Items = new Array();
        SerializerHelper.serializeInt(stream, this.m_Items.length);
        for (const it of this.m_Items) {
            this.serializeItem(stream, it);
        }
    }
    
    deserialize(stream) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        this.m_Class = MorphClass._new266(SerializerHelper.deserializeShort(stream));
        this.m_Case = MorphCase._new242(SerializerHelper.deserializeShort(stream));
        this.m_Gender = MorphGender.of(SerializerHelper.deserializeShort(stream));
        this.m_Number = MorphNumber.of(SerializerHelper.deserializeShort(stream));
        this.m_Voice = MorphVoice.of(SerializerHelper.deserializeShort(stream));
        this.m_Language = MorphLang._new269(SerializerHelper.deserializeShort(stream));
        let cou = SerializerHelper.deserializeInt(stream);
        this.m_Items = new Array();
        for (let i = 0; i < cou; i++) {
            let it = this.deserializeItem(stream);
            if (it !== null) 
                this.m_Items.push(it);
        }
        this.m_NeedRecalc = false;
    }
    
    serializeItem(stream, bi) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        let ty = 0;
        if (bi instanceof MorphWordForm) 
            ty = 1;
        stream.writeByte(ty);
        SerializerHelper.serializeShort(stream, bi._class.value);
        SerializerHelper.serializeShort(stream, bi._case.value);
        SerializerHelper.serializeShort(stream, bi.gender.value());
        SerializerHelper.serializeShort(stream, bi.number.value());
        SerializerHelper.serializeShort(stream, bi.language.value);
        let wf = Utils.as(bi, MorphWordForm);
        if (wf === null) 
            return;
        SerializerHelper.serializeString(stream, wf.normalCase);
        SerializerHelper.serializeString(stream, wf.normalFull);
        SerializerHelper.serializeShort(stream, wf.undefCoef);
        SerializerHelper.serializeInt(stream, (wf.misc === null ? 0 : wf.misc.attrs.length));
        if (wf.misc !== null) {
            for (const a of wf.misc.attrs) {
                SerializerHelper.serializeString(stream, a);
            }
        }
    }
    
    deserializeItem(stream) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        let ty = stream.readByte();
        let res = (ty === 0 ? new MorphBaseInfo() : new MorphWordForm());
        res._class = MorphClass._new266(SerializerHelper.deserializeShort(stream));
        res._case = MorphCase._new242(SerializerHelper.deserializeShort(stream));
        res.gender = MorphGender.of(SerializerHelper.deserializeShort(stream));
        res.number = MorphNumber.of(SerializerHelper.deserializeShort(stream));
        res.language = MorphLang._new269(SerializerHelper.deserializeShort(stream));
        if (ty === 0) 
            return res;
        let wf = Utils.as(res, MorphWordForm);
        wf.normalCase = SerializerHelper.deserializeString(stream);
        wf.normalFull = SerializerHelper.deserializeString(stream);
        wf.undefCoef = SerializerHelper.deserializeShort(stream);
        let cou = SerializerHelper.deserializeInt(stream);
        for (let i = 0; i < cou; i++) {
            if (wf.misc === null) 
                wf.misc = new MorphMiscInfo();
            wf.misc.attrs.push(SerializerHelper.deserializeString(stream));
        }
        return res;
    }
    
    static _new828(_arg1) {
        let res = new MorphCollection();
        res._class = _arg1;
        return res;
    }
    
    static _new2432(_arg1) {
        let res = new MorphCollection();
        res.gender = _arg1;
        return res;
    }
    
    static _new2483(_arg1) {
        let res = new MorphCollection();
        res._case = _arg1;
        return res;
    }
    
    static static_constructor() {
        MorphCollection.m_EmptyItems = new Array();
    }
}


MorphCollection.static_constructor();

module.exports = MorphCollection