
function initInspector() {
    let width = 100;
    addCustomDrag(inspector, {
        onstart(ev, delta) {
            if (ev.offsetX > 5) return false;
            return true;
        },
        onmove(ev, delta) {
            width -= delta.x;
            inspector.style.minWidth = width + "px";
        }
    });

}

class Inspector extends HTMLElement{
    constructor() {
        super();
        this.observed = null;
        this.viewTabs = {
            graph: this.querySelector("[name='graph']"),
            node: this.querySelector("[name='node']"),
            edge: this.querySelector("[name='edge']"),
        }
        this.viewModeToggle = this.querySelector("select");
        this.viewModeToggle.addEventListener("change", ev => this.viewMode = ev.target.value);

        /*this.nodeDetailsMenu = createOptionsMenu(nodeTemplates.default);
        this.nodeDetailsMenu.closeOnClick = false;
        this.viewTabs.node.appendChild(this.nodeDetailsMenu);
        this.nodeDetailsMenu.show();*/
    }


    observe(element) {
        let menu;
        switch (element.tagName) {
            case "GRAPH-NODE": {
                this.viewMode = "node";
                if (this.nodeDetailsMenu.get("details", "template") !== element.props.details.template) {
                    this.nodeDetailsMenu = createOptionsMenu(nodeTemplates.default);
                    this.nodeDetailsMenu.closeOnClick = false;
    
                    this.viewMode.textContent = "";
                    this.viewMode.appendChild(this.nodeDetailsMenu);
                    this.nodeDetailsMenu.show();
                }

                for (let category in element.props) {
                    let props = element.props[category]; 
                    for (let p in props) {
                        this.nodeDetailsMenu.set(category, p, props[p]);
                        if (p == "transform") {
                            this.nodeDetailsMenu.set("physics", "position", props[p].position);
                            this.nodeDetailsMenu.set("physics", "velocity", props[p].velocity);
                            this.nodeDetailsMenu.set("physics", "acceleration", props[p].acceleration);
                        }
                    }
                }
                this.nodeDetailsMenu.show(0,0);
                break;
            }
            case "GRAPH-TAB": {
                this.viewMode = "graph";
                break;
            }
            case "GRAPH-EDGE": {
                this.viewMode = "edge";
                break;
            }
        }
    }

    set viewMode(mode) {
        let newMode = this.viewTabs[mode];
        let current = this.viewMode;
        if (newMode === current) return;

        current?.classList.add("hide");
        newMode.classList.remove("hide");
        this.viewTabs.active = newMode;
        this.viewModeToggle.value = mode;
    }
    get viewMode() { return this.viewTabs.active }

    connectedCallback() {
        this.viewMode = "graph";
    }
}

customElements.define("graph-inspector", Inspector);