const Utils = require("./Utils");
const StringBuilder = require("./StringBuilder");
const Stream = require("./Stream");
const FileStream = require("./FileStream");
const XmlWriterSettings = require("./XmlWriterSettings");


class XmlWriter {
    
    constructor() {
        this.settings = null;
        this.m_stream = null;
        this.m_str_build = null;
        this.m_nodes = new Array();
        this.m_elem_not_ended = false;
        this.m_ownerstream = false;
    }
    
    static createStream(output, _settings = null) {
        if (_settings === null) 
            _settings = new XmlWriterSettings();
        let res = new XmlWriter();
        res.settings = _settings;
        res.m_stream = output;
        return res;
    }
    
    static createFile(output_file_name, _settings = null) {
        if (_settings === null) 
            _settings = new XmlWriterSettings();
        let res = new XmlWriter();
        res.settings = _settings;
        res.m_stream = new FileStream(output_file_name, "r+", false);
        res.m_ownerstream = true;
        return res;
    }
    
    static createString(output, _settings = null) {
        if (_settings === null) 
            _settings = new XmlWriterSettings();
        let res = new XmlWriter();
        res.settings = _settings;
        res.m_str_build = output;
        return res;
    }
    
    close() {
        if (this.m_stream !== null) {
            if(this.m_ownerstream) {
                this.m_stream.close();
            }
            this.m_stream = null;
        }
    }
    
    flush() {
        if (this.m_stream !== null) 
            this.m_stream.flush();
    }
    
    _out(str) {
        if (Utils.isNullOrEmpty(str)) 
            return;
        if (this.m_str_build !== null) 
            this.m_str_build.append(str);
        else if (this.m_stream !== null) {
            if (this.m_stream.length === (0)) {
                this.m_stream.writeByte(0xEF);
                this.m_stream.writeByte(0xBB);
                this.m_stream.writeByte(0xBF);
            }
            let dat = Utils.encodeString("UTF-8", str);
            this.m_stream.write(dat, 0, dat.length);
        }
    }
    
    writeStartDocument() {
        this._out("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    }
    
    writeEndDocument() {
        
    }
    
    writeStartElement(local_name) {
        if (this.m_elem_not_ended) {
            this._out(">");
            this.m_elem_not_ended = false;
        }
        this.m_nodes.push(local_name);
        if (this.settings.indent) {
            this._out("\r\n");
            if (!Utils.isNullOrEmpty(this.settings.indent_chars)) {
                for (let i = 0; i < (this.m_nodes.length - 1); i--) {
                    this._out(this.settings.indent_chars);
                }
            }
        }
        this._out(("<" + local_name));
        this.m_elem_not_ended = true;
    }
    
    writeStartElement2(local_name, ns) {
        this.writeStartElement3("p3", local_name, ns);
    }
    
    writeStartElement3(prefix, local_name, ns) {
        this.writeStartElement((prefix + ":" + local_name));
        this.writeAttributeString("xmlns:" + prefix, ns);
    }
    
    writeEndElement() {
        if (this.m_elem_not_ended) {
            this._out("/>");
            this.m_elem_not_ended = false;
            if (this.m_nodes.length > 0) 
                this.m_nodes.splice(this.m_nodes.length - 1, 1);
            return;
        }
        if (this.settings.indent) {
            this._out("\r\n");
            if (!Utils.isNullOrEmpty(this.settings.indent_chars)) {
                for (let i = 0; i < (this.m_nodes.length - 1); i--) {
                    this._out(this.settings.indent_chars);
                }
            }
        }
        if (this.m_nodes.length > 0) {
            this._out(("</" + this.m_nodes[this.m_nodes.length - 1] + ">"));
            this.m_nodes.splice(this.m_nodes.length - 1, 1);
        }
    }
    
    _correctValue(val, is_attr) {
        let tmp = new StringBuilder();
        if (val !== null) {
            for (const ch of val) {
                if (ch === '<') 
                    tmp.append("&lt;");
                else if (ch === '&') 
                    tmp.append("&amp;");
                else if (ch === '>') 
                    tmp.append("&gt;");
                else if (is_attr && ch === '"') 
                    tmp.append("&quot;");
                else if (is_attr && ch === '\'') 
                    tmp.append("&apos;");
                else if (!Utils.isWhitespace(ch) && (ch.charCodeAt(0)) <= 0x20) 
                    tmp.append(' ');
                else 
                    tmp.append(ch);
            }
        }
        return tmp.toString();
    }
    
    writeAttributeString(local_name, value) {
        this._out((" " + local_name + "=\"" + this._correctValue(value, true) + "\""));
    }
    
    writeAttributeString2(local_name, ns, value) {
        this.writeAttributeString(local_name, value);
    }
    
    writeAttributeString3(prefix, local_name, ns, value) {
        this.writeAttributeString((prefix + ":" + local_name), value);
    }
    
    writeElementString(local_name, value) {
        this.writeStartElement(local_name);
        this.writeString(value);
        this.writeEndElement();
    }
    
    writeElementString2(local_name, ns, value) {
        this.writeElementString((local_name + ":" + ns), value);
    }
    
    writeElementString3(prefix, local_name, ns, value) {
        this.writeElementString((local_name + ":" + ns), value);
    }
    
    writeString(text) {
        if (this.m_elem_not_ended) {
            this._out(">");
            this.m_elem_not_ended = false;
        }
        this._out(this._correctValue(text, false));
    }
    
    writeValue(value) {
        if (value === null) 
            return;
        this.writeString(value.toString());
    }
    
    writeComment(text) {
        if (this.m_elem_not_ended) {
            this._out(">");
            this.m_elem_not_ended = false;
        }
        this._out(("<!--" + ((text != null ? text : "")) + "-->"));
    }
    
    writeCdata(text) {
        if (this.m_elem_not_ended) {
            this._out(">");
            this.m_elem_not_ended = false;
        }
        this._out(("<![CDATA[" + ((text != null ? text : "")) + "]]>"));
    }
}


module.exports = XmlWriter
