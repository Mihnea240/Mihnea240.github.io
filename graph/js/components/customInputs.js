class TextInput extends HTMLElement{
    static observedAttributes = ["inputmode"];
    constructor() {
        super();
        this.contentEditable = true;
        this.oldValue = "";
        this.isNumber = false;

        this.addEventListener("keydown", (ev) => {
            let len = this.textContent.length, add = 0, remove = 0;
            switch (ev.key) {
                case "Enter": {
                    ev.preventDefault();
                    return;
                }
                case "ArrowLeft": case "ArrowRight": return;
                case "Delete": case "Backspace": remove = 1; break;
                case "ArrowUp": {
                    if (this.isNumber) this.value++;
                    break;
                }
                case "ArrowDown": {
                    if (this.isNumber) this.value--;
                    break;
                }
                default: add = 1;
            }
            this.oldValue = this.textContent;
        })
        this.addEventListener("input", (ev) => {
            this.value = ev.target.value;
        })
        this.addEventListener("blur", (ev) => {
            if (this.isNumber) {
                let rez = 0;
                try {
                    rez = eval(this.textContent);
                } catch (error) {
                    console.log(error);
                }
                let string = "" + rez;
                let maxLength = parseInt(this.getAttribute("maxLength")), minLength = parseInt(this.getAttribute("minLength"));
                let max = parseInt(this.getAttribute("max")), min = parseInt(this.getAttribute("min"));
                if (string.length > maxLength) string.slice(maxLength);
                if (string.length < minLength) string.padEnd(minLength, "0");

                rez = parseFloat(string);
                if (rez > max) rez = max;
                if (rez < min) rez = min;
                this.value = "" + rez;
            }
            this.dispatchEvent(new Event("change",{bubbles: true}));
        })
    }

    set value(text) {
        text += "";
        let pattern = this.getAttribute("pattern"), check = true;
        let maxLength = parseInt(this.getAttribute("maxLength")), minLength = parseInt(this.getAttribute("minLength"));

        if (pattern) text = text.replace(new RegExp(pattern), "");
        if (this.isNumber) text = text.replace(/[^0-9*.+-\/]+/g, "");
        if (text.length < minLength) text = this.oldValue;
        if (text.length > maxLength) text = this.oldValue;

        this.textContent = text;
    }
    get value() {
        if (this.isNumber) return parseFloat(this.textContent);
        return this.textContent;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "inputmode": {
                this.isNumber = Boolean(newValue === "numeric" || newValue === "decimal");
            }
        }
    }

}

customElements.define("text-input", TextInput);



class CustomInputs{

    static initTemplate(name,template,input,tag="div") {
        let display = template._display || name.replace("_"," ") || "";
        let rez = elementFromHtml(`<${tag} name="${name}"><span>${display}</span></${tag}>`);

        for (let key in template || []) {
            if (key[0]=="_") continue;
            input.setAttribute(key, template[key]);
        }
        rez._condition = template._condition;
        rez.appendChild(input);

        rez.set = function (value) { this.children[1].value = value}
        rez.get = function () { return this.children[1].value }
        rez.validate = function () { this.classList.toggle("hide", this._condition?.()) }

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
        el.addEventListener("input", function (ev) { this.setAttribute("value",this.value) });

        let rez = CustomInputs.initTemplate(name, template, el);
        rez.set = function (value) {
            let input = this.querySelector("input");
            input.setAttribute("value", input.value = value);
        }
        return rez;
    }
    static checkbox(name, template) {
        let el = CustomInputs.initTemplate(name, template, elementFromHtml("<input type='checkbox'> </input>"));
        el.get = function () { return this.querySelector("input").checked }
        el.set = function (value) {
            let el = this.querySelector("input");
            el.setAttribute("value", value);
            el.checked = value;
        }
        return el;
    }
    static select(name, template) {
        let el = elementFromHtml("<select></select>");
        for (let opt of template.options) {
            el.appendChild(elementFromHtml(`<option>${opt}</option>`))
        }
        return CustomInputs.initTemplate(name, template, el);
    }
    static button(name,template) {
        return CustomInputs.initTemplate(name,template, 
            elementFromHtml("<button style='display: none'></button>"),
            "label"
        );
    }

    static category(name, {display="", categoryCollapse = true,_condition, ...rest }) {
        display ||= name;
        
        let element = elementFromHtml(`<div class="category" name="${name}"><div>${display} ${categoryCollapse ? `<input type="checkbox" checked>` : ''}</div></div>`);
        for (let i in rest) {
            if (typeof rest[i] !== 'object') continue;
            let type = rest[i].type || "category";
            element.appendChild(CustomInputs[type]?.(i, rest[i]));
        }
        element._condition=_condition;
        
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
            if(this._condition) this.classList.toggle("hide", this._condition(param));

            let n=this.children.length;
            for (let el of this.children) {
                el.classList.remove("hide");
                if(!el.validate)continue;
                if(!el.validate(param))n--;
            }
            if(n==0)this.classList.add("hide");
        }
        return element;
    }

    static getChainFromEvent(root,ev) {
        let value = [],name;
        for (let t of ev.composedPath()) {
            name = t.getAttribute("name");
            if (name) value.push(name);
            if (t == root) return value;
        }
    }

    static getFromChain(object,chain, offsetBack=0) {
        let target = object, n = chain.length;
        while (n > offsetBack && (target = target[chain[--n]]));
        return target;
    }
}