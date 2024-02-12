
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

    }


    observe(element) {
        let menu;
        switch (element.tagName) {
            case "GRAPH-NODE": {
                this.viewMode = "node";
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