class XmlAttribute {
    
    constructor() {
        this.local_name = null;
        this.name = null;
        this.value = null;
    }
    
    static _new1(_arg1, _arg2, _arg3) {
        let res = new XmlAttribute();
        res.name = _arg1;
        res.local_name = _arg2;
        res.value = _arg3;
        return res;
    }
}


module.exports = XmlAttribute
