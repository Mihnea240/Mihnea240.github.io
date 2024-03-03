class TextInput extends HTMLElement{
    static observedAttributes = ["inputmode","allownewline","readonly","value","decimal"];
    constructor() {
        super();
        this.oldValue = "";
        this.isNumber = false;
        this._value = "";
        this.contentEditable = true;

        this.addEventListener("keydown", (ev) => {
            switch (ev.key) {
                case "Enter": {
                    if (!this.allownewline) ev.preventDefault();
                    return;
                }
                case "ArrowUp": if (this.isNumber) this.value++; break;
                case "ArrowDown": if (this.isNumber) this.value--; break;
            }
            ev.stopImmediatePropagation(); ev.stopPropagation();
            this.oldValue = this.textContent;
            return true;
        })
        this.addEventListener("input", (ev) => {
            //this.innerHTML.replace("</div>", "").replace("<div>", "\n");
            this.value = this.innerText;
        })
        this.addEventListener("blur", (ev) => {
            this.parseAsNumber();
            this.dispatchEvent(new Event("change",{bubbles: true}));
        })
        customElements.upgrade(this);
    }

    set value(text) {
        text += "";
        let pattern = this.getAttribute("pattern"), check = true;
        let maxLength = parseInt(this.getAttribute("maxLength")), minLength = parseInt(this.getAttribute("minLength"));

        if (pattern) text = text.replace(new RegExp(pattern), "");
        if (this.isNumber) {
            text = text.replace(/[^0-9*.+-\/]+/g, "");
            text = this.parseAsNumber(text) + "";
        }
        if (text.length < minLength || text.length > maxLength) text = this.oldValue;
        this.textContent = text;
    }
    get value() {
        if (this.isNumber) return parseFloat(this.textContent);
        return this.textContent;
    }
    parseAsNumber(text) {
        let rez = 0;
        try { rez = eval(text) || 0; }
        catch (error) { console.log(error) }

        let max = parseFloat(this.getAttribute("max")), min = parseFloat(this.getAttribute("min"));
        if (max && rez > max) rez = max;
        if (min && rez < min) rez = min;
        if (this.decimal != undefined) rez = rez.toFixed(this.decimal);
        return rez;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "inputmode": this.isNumber = Boolean(newValue === "numeric" || newValue === "decimal"); break;
            case "allownewline": this.allownewline = !!newValue; break;
            case "value": this.value = newValue; break;
            case "readonly": {
                if (newValue === "true" || newValue === true) this.setAttribute("contenteditable", false),console.log("dfmdk");
                else this.setAttribute("contenteditable", true);
                break;
            }
            case "decimal": this.decimal = parseInt(newValue); break;
            
        }
    }

    connectedCallback() {
        this.value = this.getAttribute("value") || "";
    }

}

customElements.define("text-input", TextInput);





class CustomInputs{

    static initTemplate(name,template,input,tag="div") {
        let display = template.display || name.replace("_", " ") || "",rez;
        
        rez = elementFromHtml(`<${tag} name="${name}"><span>${display}</span></${tag}>`);
        if (tag == "button") input = rez;
        else rez.appendChild(input);

        
        for (let key in template || []) {
            if (key[0] == "_") continue;
            switch (key) {
                case "title": rez.setAttribute("title", template.title); break;
                case "condition": rez.condition = template.condition; break;
                case "value": {
                    input.setAttribute("value", template.value);
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    break;
                }
                case "type": rez.setAttribute("type", template[key]); break;
                default: {
                    if (key.startsWith("on")) input[key] = template[key];
                    else input.setAttribute(key, template[key]);
                }
            }
        }
        rez.set = function (value) { this.children[1].value = value;}
        rez.get = function () { return this.children[1].value }
        rez.validate = function (param) {
            let v = this.condition?.(param);
            if (v === undefined) return true;
            this.classList.toggle("hide", !v);
            return v;
        }

        return rez;
    }

    static number(name,template) {
        return CustomInputs.initTemplate(name,template,elementFromHtml("<text-input inputmode='numeric'></text-input>"));
    }
    static text(name,template) {
        return CustomInputs.initTemplate(name,template,elementFromHtml("<text-input></text-input>"));
    }
    static color(name,template) {
        return CustomInputs.initTemplate(name,template, elementFromHtml("<input type='color'></input>"));
    }
    static range(name, template) {
        let el = elementFromHtml("<input type='range'></input>");
        el.addEventListener("input", function (ev) { this.setAttribute("value", this.value + (this.getAttribute("unit") || "")) });

        let rez = CustomInputs.initTemplate(name, template, el);
        rez.set = function (value) {
            let input = this.querySelector("input");
            input.setAttribute("value", input.value = value);
        }
        rez.get = function () { return parseFloat(this.children[1].value); }
        return rez;
    }
    static checkbox(name, template) {
        let el = CustomInputs.initTemplate(name, template, elementFromHtml("<input type='checkbox'> </input>"),"label");
        el.get = function () { return this.querySelector("input").checked }
        el.set = function (value) {
            let el = this.querySelector("input");
            el.setAttribute("value", value);
            el.checked = value;
        }
        return el;
    }
    static select(name, {options, ...template}) {
        let el = elementFromHtml("<select></select>");
        for (let opt of options) {
            el.appendChild(elementFromHtml(`<option>${opt}</option>`));
        }
        return CustomInputs.initTemplate(name, template, el);
    }
    static button(name,template) {
        return CustomInputs.initTemplate(name, template, "", "button");
    }
    static textarea(name, template) {
        return CustomInputs.initTemplate(name, template, elementFromHtml("<textarea></textarea>"));
    }

    static category(name, {display="", categoryCollapse = true,tupel,condition, ...rest }) {
        display ||= name;
        
        let element = elementFromHtml(`<div class="category" name="${name}"><div>${display} ${categoryCollapse ? `<input type="checkbox" checked>` : ''}</div></div>`);
        if (tupel) element.classList.add("tupel");
        for (let i in rest) {
            if (typeof rest[i] !== 'object') continue;
            let type = rest[i].type || "category";
            element.appendChild(CustomInputs[type]?.(i, rest[i]));
        }
        element.condition=condition;
        
        element.set = function (chain, value) {
            this.get(chain, true)?.set?.(value);
        }
        element.get = function (chain,leaf=false) {
            if (!chain) return this;
            let target = this, n = chain.length;
            while (n > 0 && (target = target.querySelector(`[name=${chain[--n]}]`)));
            return leaf ? target : target?.get();
        }
        element.load = function (object) {
            for (let key in object) {
                let el = this.get([key], true);
                if (!el) continue;
                if (el.matches(".category")) el.load(object[key]);
                else el.set(object[key]);
            }
        }
        element.validate = function (param) {
            this.classList.remove("hide");
            let value = false;
            if (this.condition) this.classList.toggle("hide", value = !this.condition(param));

            let children = this.querySelectorAll(":scope >[name]"), n=children.length;
            for (let el of children) {
                el.classList.remove("hide");
                if(!el.validate(param))n--;
            }
            if (n == 0) this.classList.add("hide");
            return (!n || !value);
        }
        return element;
    }

    static getChainFromEvent(root,ev) {
        let value = [], name;
        for (let t of ev.composedPath()) {
            if (t.matches?.(".category ,[type]") && ( name = t.getAttribute?.("name"))) value.push(name);
            if (t == root) return value;
        }
    }

    static getFromChain(object,chain, offsetBack=0) {
        let target = object, n = chain.length;
        while (n > offsetBack && (target = target[chain[--n]]));
        return target;
    }
    static setFromChain(object, chain, value) {
        let obj = CustomInputs.getFromChain(object, chain, 1); 
        return obj[chain[0]] = value;
    }
}