
class CustomInputs{

    static customAttributes = ["type", "display", "options", "update","property"];
    static initTemplate(name,template,input) {
        let display = template._display || name || "";
        let rez = elementFromHtml(`<div name="${name}"><span>${display}</span></div>`);

        for (let key in template || []) {
            if (CustomInputs.customAttributes.indexOf(key) >= 0) continue;
            input.setAttribute(key, template[key]);
        }
        rez.appendChild(input);

        rez.set = function (value) { this.children[1].value = value;}
        rez.get = function () { return this.children[1].value}
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
        let el = CustomInputs.initTemplate(name, template, elementFromHtml("<input type='checkbox'></input>"));
        el.get = function () { return this.checked }
        el.set = function (value) { this.setAttribute("value", value); this.checked = value }
        return el;
    }
    static select(name, template) {
        let el = elementFromHtml("<select></select>");
        for (let opt of template.options) {
            el.appendChild(elementFromHtml(`<option>${opt}</option>`))
        }
        return CustomInputs.initTemplate(name, template, el);
    }

    static category(name, {display="", categoryCollapse = true, ...rest }) {
        display ||= name;
        
        let element = elementFromHtml(`<div class="category" name="${name}"><div>${display} ${categoryCollapse ? `<input type="checkbox" checked>` : ''}</div></div>`);
        for (let i in rest) {
            if (typeof rest[i] !== 'object') continue;
            let type = rest[i].type || "category";
            element.appendChild(CustomInputs[type]?.(i, rest[i]));
        }
        
        element.set = function (chain, value) {
            this.get(chain, true)?.set?.(value);
        }
        element.get = function (chain,leaf=false) {
            if (!chain) return this;
            let nodes = chain.split("."), n = nodes.length;
            let target = this;
            for (let i = n; i >= 0; i--) {
                if (!nodes[i]) continue;
                target = target.querySelector(`[name=${nodes[i]}]`);
                if (!target) return;
            }
            return leaf ? target : target.get();
        }
        element.load = function (object) {
            for (let key in object) {
                let el = this.get(key, true);
                if (!el) continue;
                
                if (el.matches(".category")) el.load(object[key]);
                else el.set(object[key]);
            }
        }
        return element;
    }

    static getChainFromEvent(root,ev) {
        let value = "",name;
        for (let t of ev.composedPath()) {
            name = t.getAttribute("name");
            if (name) value += name + ".";
            if (t == root) return value.slice(0, -1);
        }
    }
}


const testTemplate = {
    graph: {
        name: {
            type: "text",
            maxLength: 32,
        },
        main_color: {
            type: "color",
            property: "--graph-main-color",
        },
        secondary_color: {
            type: "color",
            property: "--graph-secondary-color",
        },
        show_ruller: {
            type: "checkbox",
        },
        zoom: {
            type: "range",
            min: "0.1", max: "3", step: "0.1",
            unit: "none",
            property: "--zoom"
        }

    },
    node: {
        size: {
            type: "range",
            max: "60",
            property: "--node-width"
        },
        bg: {
            type: "color",
            property: "--node-background",
            display: "Background",
        },
        color: {
            type: "color",
            property: "--node-color",
            display: "Font color"
        },
        border_color: {
            type: "color",
            property: "--node-border-color"
        },
        border_radius: {
            type: "range",
            max: "50", unit: "%",
            property: "--node-border-radius"
        },
        border_width: {
            type: "range",
            max: "6", step: "0.1",
            property: "--node-border-width"
        },
        border_style: {
            type: "select",
            options: ["solid", "dashed", "double"],
            property: "--node-border-style"
        },
        emission: {
            value: "10",
            type: "range",
            max: "20",
            property: "--node-emission"
        }
    },
     edge: {
        width: {
            type: "range",
            max: "5", step: "0.1",
            property: "--edge-width"
        },
        emission: {
            type: "range",
            max: "10",
            property: "--edge-emission"
        },
        color: {
            type: "color",
            property: "--edge-color",

        },
        cp_symmetry: {
            type: "checkbox",
            display: "Control point symmetry",
            update(graph) {
                graph.tab.forEdges((edge) => edge.setAttribute("symmetry", graph.settings.edge.cp_symmetry))
            }
        },
        mode: {
            type: "select",
            options: ["absolute", "relative"],
            description: "Controls the motion of the control points when moving a node",
            update(graph) {
                graph.tab.forEdges((edge) => {
                    edge.setAttribute("mode", graph.settings.edge.mode);
                })
            }
        },
    }
}

function testInuts() {
    inspector.viewTabs.graph.appendChild(CustomInputs.category("settings",testTemplate));
}