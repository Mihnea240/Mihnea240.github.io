
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
    }

    connectedCallback() {
        this.viewTabs = {
            graph: this.querySelector("[name='graph']"),
            node: this.querySelector("[name='node']"),
            edge: this.querySelector("[name='edge']"),
        }
        this.activeTab = this.viewTabs.graph;
        this.firstElementChild.addEventListener("click", (ev) => {
            let name = ev.target.getAttribute("for");
            console.log(name);
            if (!name) return;
            let el = this.querySelector(`.tabs [name='${name}']`);
            if (!el) return;

            this.activeTab.classList.add("hide");
            this.firstElementChild.querySelector(`[for="${this.activeTab.getAttribute("name")}"]`).classList.remove("active");
            el.classList.remove("hide");
            ev.target.classList.add("active");
            this.activeTab = el;
            //ev.target.scrollIntoView()
        })
    }


    observe(element) {
        let menu;
        switch (element.tagName) {
            case "GRAPH-NODE": {
                this.viewMode = "node";
                let cat = CustomInputs.category("Node details",nodeInspectorTemplate);
                this.viewTabs.node.appendChild(cat);
                cat.load(element);
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
}

customElements.define("graph-inspector", Inspector);