const defaultSettings = {
    graph: {
        name: "",
        main_color: "#ffd748",
        secondary_color: "#ffd748",
        zoom: 1,
        category: "graph",
    },
    node: {
        size: "25",
        bg: "#242424",
        color: "#ffffff",
        border_radius: "50",
        border_width: "1",
        border_style: "solid",
        border_color: "#ffffff",
        emission: "10",
        category: "node"
    },
    edge: {
        width: "1",
        emission: "3",
        color: "#ffffff",
        cp_symmetry: true,
        mode: "absolute",
        min_drag_dist: 5,
        cp_offset: [0, 0],
        category: "edge",
    }
}


const defaultSettingsTemplate = {
    graph: {
        name: {
            type: "text",
            maxLength: 32,
            update(graph) {
                let name = graph.settings.graph.name;
                graph.header.querySelector("span").textContent = name;
            }
        },
        main_color: {
            type: "color",
            property: "--graph-main-color",
            update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
        },
        secondary_color: {
            type: "color",
            property: "--graph-secondary-color",
            update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
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
                console.log(graph.settings.edge.cp_symmetry);
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
        min_drag_dist: 5,
        cp_offset: [0, 0],
    }
}, dummy = {
    graph: { category: "graph" },
    node: { category: "node" },
    edge: { category: "edge" },
}



/**@param {Graph} graph*/
function createGraphSettings(graph, object = JSON.parse(JSON.stringify(dummy))) {
    let handler = {
        get(target, prop) {
            return target[prop];
        },
        set(target, prop, value) {
            if (target[prop] == value) return true;

            if (graphs.selected === graph) greatMenus.viewMenu.set(target.category, prop, value);

            let c = target.category, template = defaultSettingsTemplate[c][prop];
            if (template.property) {
                let unit = "";
                if (template.unit !== "none" && template.type == "range" || template.type == "number") unit = template.unit || "px";
                if (template.unit == "none") value = parseFloat(value);
                graph.tab.style.setProperty(template.property, value + unit);
            }
            target[prop] = value;
            template.update?.(graph);
            return true;
        },
    }
    for (let category in object) {
        object[category] = new Proxy(object[category], handler);
    }
    return object;
}


function createOptionsMenu(options, name) {
    let menu = document.createElement("pop-menu");
    let rangeUpdate = (ev) => { ev.target.setAttribute("value", ev.target.value) };
    let checkBoxupdate = (ev) => { ev.target.setAttribute("value", ev.target.checked) };
    if (name) menu.setAttribute("name", name);

    for (let category in options) {
        let c = elementFromHtml(`<div class="category" name=${category}><div>${category}</div></div>`);

        let items = options[category];
        for (let i in items) {
            if (!items[i].type) continue;
            let value = items[i].value || '';

            let name = items[i].display || i.replace("_", " "), element;

            if (items[i].type !== "select") {
                element = c.appendChild(
                    elementFromHtml(`<label>${name} <input type="${items[i].type}" name=${i} value="${value}"></label>`)
                );
            }

            switch (items[i].type) {
                case "range": {
                    let range = element.firstElementChild;
                    if (items[i].max) range.setAttribute("max", items[i].max);
                    if (items[i].step) range.setAttribute("step", items[i].step);
                    range.oninput = rangeUpdate;
                    break;
                }
                case "checkbox": {
                    element.firstElementChild.setAttribute("checked", value);
                    element.firstElementChild.oninput = checkBoxupdate;
                    break;
                }
                case "select": {
                    let select = elementFromHtml(`<select name=${i}></select>`);
                    element = elementFromHtml(`<label>${name}</label>`);
                    for (let opt of (items[i].options || [items[i].value])) select.appendChild(elementFromHtml(`<option>${opt}</option>`));
                    element.appendChild(select);
                    c.appendChild(element);
                    break;
                }
                case "text": {
                    if (items[i].maxLength) element.firstElementChild.setAttribute("maxLength", items[i].maxLength);
                    break;
                }
            }

            if (items[i].description) {
                element.setAttribute("data-tooltip", items[i].description);
            }
            menu.appendChild(c);

        }
    }

    menu.set = (category, prop, value) => {
        let el = menu.querySelector(`.category[name=${category}] [name=${prop}]`);
        if (el && el.value !== undefined) {
            el.value = value;
            el.setAttribute("value", value);
        }
    }
    menu.get = (category, prop) => {
        return menu.querySelector(`.category[name=${category}] [name=${prop}]`).value;
    }
    let inputEvent = new CustomEvent("propertychanged", { detail: {}, bubbles: true, composed: true });
    menu.addEventListener("input", (ev) => {
        ev.stopPropagation();
        let c = ev.target.closest(".category").getAttribute("name");
        let prop = ev.target.getAttribute("name");
        inputEvent.detail.category = c;
        inputEvent.detail.property = prop;
        inputEvent.detail.originalTarget = ev.target;
        menu.dispatchEvent(inputEvent);
    })
    return menu;
}