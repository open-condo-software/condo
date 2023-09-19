const Utils = require("./Utils");
const Stream = require("./Stream");
const FileStream = require("./FileStream");
const XmlNode = require("./XmlNode");
const XmlAttribute = require("./XmlAttribute");
const Hashtable = require("./Hashtable");
const RefOutArgWrapper = require("./RefOutArgWrapper");
const StringBuilder = require("./StringBuilder");

class XmlDocument {
    
    constructor() {
        this.document_element = null;
        this.preserve_whitespace = true;
    }
    
    loadFile(fname) {
        let fstr = new FileStream(fname, "r", false); 
        try {
            this.loadStream(fstr);
        }
        finally {
            fstr.close();
        }
    }
    
    loadStream(str) {
        let dat = Utils.readStream(str);
        let txt = Utils.decodeString("UTF-8", dat, 0, -1);
        this.loadXml(txt);
    }
    
    loadXml(xml) {
        let items = new Array();
        let pn = new XmlParserNode();
        let i = 0;
        let j = 0;
        for (i = 0; i < xml.length; i++) {
            let tag = null;
            if (((((i + 10) < xml.length) && xml[i] === '<' && xml[i + 1] === '?') && xml[i + 2] === 'x' && xml[i + 3] === 'm') && xml[i + 4] === 'l') {
                for (i += 5; i < xml.length; i++) {
                    if (xml[i] === '?' && ((i + 1) < xml.length) && xml[i + 1] === '>') {
                        i++;
                        break;
                    }
                }
                continue;
            }
            if (items.length === 47) {
            }
            if (!pn.analize(xml, i, tag, this.preserve_whitespace)) 
                break;
            i = pn.index_to;
            pn.whitespace_preserve = this.preserve_whitespace;
            if (pn.is_empty) 
                continue;
            items.push(pn);
            pn.close_tag_index = -1;
            pn = new XmlParserNode();
        }
        let stack = new Array();
        for (i = 0; i < items.length; i++) {
            pn = items[i];
            if (pn.tag_name === null) { 
                if(pn.pure_text != null && stack.length > 0) {
                    if (stack[stack.length - 1].value == null && stack[stack.length - 1].child_nodes.length == 0) 
                        stack[stack.length - 1].value = pn.pure_text;
                    else {
                        let tnod = new XmlNode();
                        tnod.local_name = '#text'; 
                        tnod.value = pn.pure_text;
                        tnod.parent_node = stack[stack.length - 1];
                        stack[stack.length - 1].value = null;
                        stack[stack.length - 1].child_nodes.push(tnod);
                    }
                }
                continue;
            }
            if (pn.tag_type === 2) {
                if (stack.length === 0 || stack[stack.length - 1].name !== pn.tag_name) 
                    break;
                stack.splice(stack.length - 1, 1);
                continue;
            }
            if (pn.tag_type === 0) 
                continue;
            let nod = new XmlNode();
            nod.local_name = (nod.name = pn.tag_name);
            let ii = nod.local_name.indexOf(':');
            if (ii > 0) 
                nod.local_name = nod.local_name.substring(ii + 1);
            if (pn.attributes !== null) {
                for (const kp of pn.attributes.entries) {
                    let nam = kp.key;
                    let loc = kp.key;
                    ii = loc.indexOf(':');
                    if (ii > 0) 
                        loc = loc.substring(ii + 1);
                    nod.attributes.push(XmlAttribute._new1(nam, loc, kp.value));
                }
            }
            if (this.document_element === null) 
                this.document_element = nod;
            else if (stack.length > 0) {
                if(stack[stack.length - 1].value != null) {
                    let tnod = new XmlNode();
                    tnod.local_name = '#text'; 
                    tnod.value = stack[stack.length - 1].value;
                    tnod.parent_node = stack[stack.length - 1];
                    stack[stack.length - 1].value = null;
                    stack[stack.length - 1].child_nodes.push(tnod);
                }
                stack[stack.length - 1].child_nodes.push(nod);
				nod.parent_node = stack[stack.length - 1];
			}
            if (pn.tag_type === 1) 
                stack.push(nod);
        }
        if (i < items.length || stack.length > 0) 
            throw new Error("Bad XML format");
    }
}

class XmlParserNode {
    
    constructor() {
        this.index_from = 0;
        this.index_to = 0;
        this.tag_name = null;
        this.tag_type = 0;
        this.close_tag_index = 0;
        this.attributes = new Hashtable();
        this.pure_text = null;
        this.whitespace_preserve = false;
    }
    
    get is_empty() {
        if (this.tag_name !== null) 
            return false;
        if (this.attributes !== null && this.attributes.length > 0) 
            return false;
        if (!Utils.isNullOrEmpty(this.pure_text)) {
            if (this.whitespace_preserve) 
                return false;
            for (let i = 0; i < this.pure_text.length; i++) {
                if (!Utils.isWhitespace(this.pure_text[i])) 
                    return false;
            }
        }
        return true;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.tag_type !== 0) {
            if (this.tag_type === 2) 
                res.append("</").append(this.tag_name).append(">");
            else {
                res.append("<").append(this.tag_name);
                if (this.attributes !== null) {
                    for (const kp of this.attributes.entries) {
                        res.append(" ").append(kp.key).append("='").append(kp.value).append("'");
                    }
                }
                if (this.tag_type === 1) 
                    res.append(">");
                else 
                    res.append("/>");
            }
        }
        else if (this.pure_text !== null) 
            res.append(this.pure_text);
        return res.toString();
    }
    
    analize(html, ind_from, end_tag, white_space_preserve) {
        if (ind_from >= html.length) 
            return false;
        this.index_from = ind_from;
        this.tag_name = null;
        this.tag_type = 0;
        if (this.attributes === null) 
            this.attributes = new Hashtable();
        else 
            this.attributes.clear();
        this.pure_text = null;
        let i = 0;
        let j = 0;
        let ch = html[ind_from];
        if (ch !== '<' || ((end_tag !== null && !XmlParserNode.isEndTag(html, ind_from, end_tag)))) {
            let str_tmp = null;
            let comment = false;
            let last_nbsp = 0;
            for (i = ind_from; i < html.length; i++) {
                let nbr = false;
                if (html[i] === '<') {
                    if (!comment) {
                        if (end_tag === null || XmlParserNode.isEndTag(html, i, end_tag)) 
                            break;
                    }
                    if ((((i + 3) < html.length) && html[i + 1] === '!' && html[i + 2] === '-') && html[i + 3] === '-') {
                        comment = true;
                        i += 3;
                        continue;
                    }
                    ch = html[i];
                    j = 1;
                }
                else {
                    if (comment && html[i] === '-') {
                        if (((i + 2) < html.length) && html[i + 1] === '-' && html[i + 2] === '>') {
                            comment = false;
                            i += 2;
                            continue;
                        }
                    }
                    let wrapch2 = new RefOutArgWrapper();
                    let wrapnbr3 = new RefOutArgWrapper();
                    let inoutres4 = XmlParserNode.parseChar(html, i, wrapch2, wrapnbr3);
                    ch = wrapch2.value;
                    nbr = wrapnbr3.value;
                    if ((((j = inoutres4))) < 1) 
                        break;
                }
                if (ch === ' ' && !white_space_preserve) {
                    let prev_sp = (str_tmp === null ? true : (str_tmp.charAt(str_tmp.length - 1) === ' '));
                    if (!prev_sp || nbr) {
                        if (str_tmp === null) 
                            str_tmp = new StringBuilder();
                        str_tmp.append(ch);
                    }
                    if (nbr) 
                        last_nbsp++;
                }
                else {
                    last_nbsp = 0;
                    if (str_tmp === null) 
                        str_tmp = new StringBuilder();
                    if (nbr && white_space_preserve && ch === ' ') 
                        ch = String.fromCharCode(0xA0);
                    str_tmp.append(ch);
                }
                if (white_space_preserve) 
                    this.whitespace_preserve = true;
                i += (j - 1);
            }
            if (last_nbsp === 0 && !white_space_preserve && str_tmp !== null) {
                for (let jj = str_tmp.length - 1; jj > 0; jj--) {
                    if (str_tmp.charAt(jj) !== ' ') 
                        break;
                    else 
                        str_tmp.length = str_tmp.length - 1;
                }
            }
            if (str_tmp !== null) 
                this.pure_text = str_tmp.toString();
            this.index_to = i - 1;
            return true;
        }
        if ((ind_from + 2) >= html.length) 
            return false;
        ch = html[ind_from + 1];
        if (Utils.isLetter(ch)) {
            this.tag_name = XmlParserNode.readLatinWord(html, ind_from + 1);
            if (this.tag_name === null) {
                this.index_to = ind_from + 1;
                return true;
            }
            this.tag_type = 1;
            let str_tmp = null;
            for (i = ind_from + 1 + this.tag_name.length; i < html.length; i++) {
                ch = html[i];
                if (Utils.isWhitespace(ch)) 
                    continue;
                if (ch === '>') {
                    i++;
                    break;
                }
                if (ch === '/') {
                    if ((i + 1) >= html.length) 
                        return false;
                    if (html[i + 1] === '>') 
                        i++;
                    this.tag_type = 3;
                    i++;
                    break;
                }
                let attr_name = XmlParserNode.readLatinWord(html, i);
                if (attr_name === null) 
                    continue;
                i += attr_name.length;
                if ((i + 2) >= html.length || html[i] !== '=') {
                    i--;
                    continue;
                }
                i++;
                if (str_tmp !== null) 
                    str_tmp.length = 0;
                let bracket = String.fromCharCode(0);
                if (html[i] === '\'' || html[i] === '"') {
                    bracket = html[i];
                    i++;
                }
                for (; i < html.length; i++) {
                    ch = html[i];
                    if (bracket !== (String.fromCharCode(0))) {
                        if (ch === bracket) {
                            i++;
                            break;
                        }
                    }
                    else if (ch === '>') 
                        break;
                    else if (Utils.isWhitespace(ch)) 
                        break;
                    else if (ch === '/' && ((i + 1) < html.length) && html[i + 1] === '>') {
                    }
                    let nbr = false;
                    let wrapch5 = new RefOutArgWrapper();
                    let wrapnbr6 = new RefOutArgWrapper();
                    let inoutres7 = XmlParserNode.parseChar(html, i, wrapch5, wrapnbr6);
                    ch = wrapch5.value;
                    nbr = wrapnbr6.value;
                    if ((((j = inoutres7))) < 1) {
                        ch = html[i];
                        j = 1;
                    }
                    if (str_tmp === null) 
                        str_tmp = new StringBuilder();
                    str_tmp.append(ch);
                    i += (j - 1);
                }
                i--;
                if (!this.attributes.containsKey(attr_name) && str_tmp !== null && str_tmp.length > 0) 
                    this.attributes.put(attr_name, str_tmp.toString());
            }
            this.index_to = i - 1;
            return true;
        }
        if (html[ind_from + 1] === '/') {
            i = ind_from + 2;
            this.tag_name = XmlParserNode.readLatinWord(html, i);
            if (this.tag_name !== null) {
                i += this.tag_name.length;
                if ((i < html.length) && html[i] === '>') {
                    i++;
                    this.tag_type = 2;
                }
            }
            this.index_to = i - 1;
            return true;
        }
        if ((((ind_from + 5) < html.length) && html[ind_from + 1] === '!' && html[ind_from + 2] === '-') && html[ind_from + 3] === '-') {
            for (i = ind_from + 4; i < (html.length - 3); i++) {
                if (html[i] === '-' && html[i + 1] === '-' && html[i + 2] === '>') {
                    this.index_to = i + 2;
                    return true;
                }
            }
            return false;
        }
        for (i = ind_from; i < html.length; i++) {
            if (html[i] === '>') {
                i++;
                break;
            }
        }
        this.index_to = i - 1;
        return true;
    }
    
    static parseChar(txt, ind, ch, nbsp) {
        ch.value = String.fromCharCode(0);
        nbsp.value = false;
        if (ind >= txt.length) 
            return -1;
        if (txt[ind] !== '&') {
            ch.value = txt[ind];
            return 1;
        }
        let str_tmp = new StringBuilder();
        let i = 0;
        for (i = ind + 1; i < txt.length; i++) {
            if (txt[i] === ';') 
                break;
            else {
                str_tmp.append(txt[i]);
                if (str_tmp.length > 7) 
                    break;
            }
        }
        if (i >= txt.length || txt[i] !== ';') {
            if (str_tmp.toString().startsWith("nbsp")) {
                ch.value = ' ';
                nbsp.value = true;
                return 5;
            }
            ch.value = '&';
            return 1;
        }
        let ret = (i + 1) - ind;
        if (str_tmp.length === 0) 
            return ret;
        let s = str_tmp.toString();
        if (XmlParserNode.m_spec_chars.containsKey(s)) {
            ch.value = XmlParserNode.m_spec_chars.get(s);
            if (s === "nbsp") 
                nbsp.value = true;
            return ret;
        }
        if (s[0] !== '#' || (str_tmp.length < 2)) {
            ch.value = '&';
            return ret;
        }
        if (Utils.isDigit(s[1])) {
            try {
                ch.value = String.fromCharCode(Utils.parseInt(s.substring(1)));
                nbsp.value = Utils.isWhitespace(ch.value);
            } catch (ex8) {
            }
            return ret;
        }
        if (s[1] === 'x' || s[1] === 'X') {
            try {
                let code = 0;
                s = s.toUpperCase();
                for (let ii = 2; ii < s.length; ii++) {
                    if (Utils.isDigit(s[ii])) 
                        code = ((code << 4)) + (((s.charCodeAt(ii)) - ('0'.charCodeAt(0))));
                    else if (s[ii] >= 'A' && s[ii] <= 'F') 
                        code = ((code << 4)) + ((((s.charCodeAt(ii)) - ('A'.charCodeAt(0))) + 10));
                }
                ch.value = String.fromCharCode(code);
                nbsp.value = Utils.isWhitespace(ch.value);
            } catch (ex9) {
            }
            return ret;
        }
        ch.value = s[1];
        return ret;
    }
    
    static readLatinWord(str, ind) {
        if ((ind + 1) >= str.length) 
            return null;
        let i = 0;
        for (i = ind; i < str.length; i++) {
            if (!Utils.isLetter(str[i]) && str[i] !== ':' && str[i] !== '_') {
                if (i === 0) 
                    break;
                if (!Utils.isDigit(str[i]) && str[i] !== '.' && str[i] !== '-') 
                    break;
            }
            else {
                let cod = str.charCodeAt(i);
                if (cod > 0x80) 
                    break;
            }
        }
        if (i <= ind) 
            return null;
        return str.substring(ind, ind + i - ind);
    }
    
    static isEndTag(html, pos, _tag_name) {
        if ((pos + 3) >= html.length || _tag_name === null) 
            return false;
        if (html[pos] !== '<' && html[pos + 1] !== '/') 
            return false;
        if (XmlParserNode.readLatinWord(html, pos + 2) !== _tag_name) 
            return false;
        return true;
    }
    static static_constructor() {
        XmlParserNode.m_spec_chars = new Hashtable();
        XmlParserNode.m_spec_chars.put("nbsp", ' ');
        XmlParserNode.m_spec_chars.put("lt", '<');
        XmlParserNode.m_spec_chars.put("gt", '>');
        XmlParserNode.m_spec_chars.put("quot", '"');
        XmlParserNode.m_spec_chars.put("apos", '\'');
    }
}

XmlParserNode.m_spec_chars = null;
XmlParserNode.static_constructor();


module.exports = XmlDocument
