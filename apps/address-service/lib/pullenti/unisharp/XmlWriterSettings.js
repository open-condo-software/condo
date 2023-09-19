
class XmlWriterSettings {
    
    constructor() {
        this._indent = false;
        this._encoding = null;
        this._indentchars = null;
    }
    
    get indent() {
        return this._indent;
    }
    set indent(value) {
        this._indent = value;
        return this._indent;
    }
    
    get encoding() {
        return this._encoding;
    }
    set encoding(value) {
        this._encoding = value;
        return this._encoding;
    }
    
    get indent_chars() {
        return this._indentchars;
    }
    set indent_chars(value) {
        this._indentchars = value;
        return this._indentchars;
    }
}


module.exports = XmlWriterSettings
