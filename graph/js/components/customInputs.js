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
                    if (!this.allownewline) return ev.preventDefault();
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
                if (newValue === "true" || newValue === true) this.setAttribute("contenteditable", false);
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
        template.display ||= name.replace("_", " ") || "";
        
        let rez = elementFromHtml(`<${tag} ${template.is?`is="${template.is}"` : ""} name="${name}"><span></span></${tag}>`);
        if (tag == "button") input = rez;
        else rez.appendChild(input);

        
        for (let key in template || {}) if (key[0] != "_") CustomInputs.parseAttribute(rez, key, template[key]);

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
    static parseAttribute(target, name, value) {
        switch (name) {
            case "condition": target.condition = value; break;
            case "tupel": target.classList.add("tupel"); break;
            case "categoryCollapse": {
                if(value)target.appendChild(elementFromHtml(`<input type="checkbox" checked>`));
                break;
            }
            case "display": target.querySelector("span").textContent = value; break;
            case "value": target.querySelector("input")?.dispatchEvent(new Event("change", { bubbles: true })); //no break
            case "is": case "type": break;
            case "class": case "name": target.setAttribute(name, value); break;
            default: {
                if (name.startsWith("on")) target.querySelectorAll("input").forEach(i => i[name] = value);
                else target.children[1]?.setAttribute(name, value);
            }
        }
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

    static category(name, template,tag="div") {
        template.display ||= name.replace("_", " ") || "";
        
        let element = elementFromHtml(`<${tag} ${template.is ? `is="${template.is}"` : ""} class="category"><span></span></${tag}>`);
        CustomInputs.parseAttribute(element, "name", name);
        for (let i in template) {
            if (typeof template[i] !== 'object') CustomInputs.parseAttribute(element, i, template[i]);
            else element.appendChild(CustomInputs[template[i].type || "category"]?.(i, template[i]));
        }
        
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
            let value = this.condition ? this.condition(param) : true;
            let children = this.querySelectorAll(":scope >[name]"), n = children.length ||1;
            
            for (let el of children) {
                el.classList.remove("hide");
                if(!el.validate(param))n--;
            }
            if (n == 0 || !value) {
                console.log(this.classList)
                if(!this.classList.contains("hide"))this.classList.add("hide");
                return false;
            } else {
                this.classList.remove("hide");
                return true;
            }
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


class PopDialog extends HTMLDialogElement{
    constructor() {
        super();
        document.addEventListener("click", (ev)=>{
            let rect = this.getBoundingClientRect();
            if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) this.close();
        })
    }
    show(x,y) {
        if (x === undefined && y === undefined) return super.show();
        super.show();
        this.style.cssText += `left: ${x}px; top: ${y}px`;
    }
    showModal(x,y) {
        if (x === undefined && y === undefined) return super.showModal();
        super.showModal();
        this.style.cssText += `left: ${x}px; top: ${y}px`;
    }
    toggleModal(x,y) {
        if (this.open) this.close();
        else this.showModal(x, y);
        return this.open;
    }
    toggle(x,y) {
        if (this.open) this.close();
        else this.show(x, y);
        return this.open;
    }
}
customElements.define("pop-dialog", PopDialog, { extends: "dialog" });
