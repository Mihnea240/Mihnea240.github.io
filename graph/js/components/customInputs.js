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