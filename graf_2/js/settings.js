
const defaultSettings = {
    graph: {
        name: {
            value: "New graph",
            type: "text",
            maxLength: 32,
        },
        main_color: {
            value: "#ffd748",
            type: "color",
            property: "--graph-main-color"
        },
        secondary_color: {
            value: "#ffd748",
            type: "color",
            property: "--graph-secondary-color"
        },
        zoom: {
            value: 1,
            type: "range",
            min: "0.2", max: "4", step: "0.1",
            unit: "none",
            property: "--zoom"
        }
        
    },
    node: {
        size: {
            value: "25",
            type: "range",
            max: "60",
            property: "--node-width"
        },
        bg: {
            value: "#242424",
            type: "color",
            property: "--node-background"
        },
        color: {
            value: "#ffffff",
            type: "color",
            property: "--node-color"
        },
        border_radius :{
            value: "50",
            type: "range",
            max: "100",
            property: "--node-border-radius"
        },
        border_width: {
            value: "1",
            type: "range",
            max: "6", step: "0.1",
            property: "--node-border-width"
        },
        border_style: {
            value: "solid",
            type: "select",
            options: ["solid","dashed","double"],
            property: "--node-border-style"
        },
        border_color: {
            value: "#ffffff",
            type: "color",
            property: "--node-border-color"
        },
        node_emission: {
            value: "10",
            type: "range",
            max: "20",
            property: "--node-emission"
        }
    },
    edge: {
        width: {
            value: "1",
            type: "range",
            max: "5", step: "0.1",
            property: "--edge-width"
        },
        emission: {
            value: "10",
            type: "range",
            max: "20",
            property: "--edge-emission"
        },
        color: {
            value: "#ffffff",
            type: "color",
            property: "--edge-color",
        },
        cp_symmetry: {
            value: true,
            type: "checkbox",
            display: "Control point symmetry"
        },
        mode: {
            value: "absolute",
            type: "select",
            options: ["absolute", "relative"],
            description: "Controls the motion of the control points when moving a node"
        },
        min_drag_dist: 5,
        cp_offset: [0, 0],
    }
}


function createGraphSettings(graph, object=defaultSettings) {
    let obj = JSON.parse(JSON.stringify(object));
    let handler={
        get(target, key) {
            console.log(target, key);
            return target[key].value || target[key];
        },
        set(target, prop, value) {
            let i = target[prop];
            i.value = value;
            if (i.property) {
                let unit = "";
                if (i.unit!="none" && i.type == "range" || i.type == "number") unit = i.unit || "px";
                graph.tab.style.setProperty(i.property, value + unit);
            }
            if (graph === graphs.selected) {
                greatMenus.viewMenu.set(prop, value);
            }
            return true;
        },
    }
    for (let category in obj) { 
        let items = obj[category];
        obj[category] = new Proxy(obj[category], handler);
        //for (let i in items) items[i] = items[i];
    }
    return obj;
}


function createOptionsMenu(options,name) {
    let menu = document.createElement("pop-menu");
    let rangeUpdate = (ev) => { ev.target.setAttribute("value", ev.target.value) }
    if (name) menu.setAttribute("name", name);

    for (let category in options) {
        let c=menu.appendChild(elementFromHtml(`<div class="category" name=${category}>${category}</div>`));

        let items = options[category];
        for (let i in items) {
            if (!items[i].type) continue;

            let name = items[i].display || i.replace("_", " "), element;
            
            if (items[i].type !== "select") {
                element = menu.appendChild(
                    elementFromHtml(`<label>${name} <input type="${items[i].type}" name=${i} value="${items[i].value}"></label>`)
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
                case "checkbox": element.setAttribute("checked", items[i].value); break;
                case "select" :{
                    let select = elementFromHtml(`<select name=${i}></select>`);
                    element = elementFromHtml(`<label>${name}</label>`);
                    for (let opt of (items[i].options || [items[i].value])) select.appendChild(elementFromHtml(`<option>${opt}</option>`));
                    element.appendChild(select);
                    menu.appendChild(element);
                    break;
                }
            }

            if (items[i].description) {
                element.setAttribute("data-tooltip", items[i].description);
            }

        }
    }

    menu.set = (prop,value) => {
        menu.querySelector(`[name=${prop}]`).value = value;
    }
    menu.get = (prop) => {
        return menu.querySelector(`[name=${prop}]`).value;
    }
    return menu;
}