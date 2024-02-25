
function initInspector() {
    addCustomDrag(inspector, {
        onstart(ev, delta) {
            if (ev.offsetX > 5) return false;
            return true;
        },
        onmove(ev, delta) {
            inspector.size.x -= delta.x;
            inspector.style.width = inspector.size.x + "px";
            inspector.style.cssText += `width: ${inspector.size.x}px; min-width: none;`;
        }
    });

}

class Inspector extends HTMLElement{
    constructor() {
        super();
        this.observed = null;
        this.size = new Point();
        this.sizeObserver = new ResizeObserver(([item]) => this.size.set(item.borderBoxSize[0].inlineSize, item.borderBoxSize[0].blockSize));

        //tabArea.addEventListener("nodemoved",(ev))
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
            if (!name) return;
            let el = this.querySelector(`.tabs [name='${name}']`);
            if (!el) return;

            this.activeTab.classList.add("hide");
            this.firstElementChild.querySelector(`[for="${this.activeTab.getAttribute("name")}"]`).classList.remove("active");
            el.classList.remove("hide");
            ev.target.classList.add("active");
            this.activeTab = el;
            ev.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        });
        this.sizeObserver.observe(this);

        let scrollIntoView = () => {
            inspector.observed.scrollIntoView();
            Graph.selected.selection.toggle(inspector.observed);
        }
        let onchange = (ev) => {
            let chain = CustomInputs.getChainFromEvent(this, ev);
            chain.pop();
            let value = ev.target.parentElement.get();
            console.log(chain, value);
            CustomInputs.setFromChain(inspector.observed, chain, value);
            if (chain[0] == "x" || chain[0] == "y") inspector.observed.update();
        }

        this.nodeDetails = this.viewTabs.node.appendChild(CustomInputs.category("Viewing", nodeInspectorTemplate));
        this.nodeSpan = this.nodeDetails.firstElementChild.appendChild(elementFromHtml(`<span style="margin-left: 2rem;"></span>`));
        this.nodeSpan.addEventListener("click", scrollIntoView);
        this.nodeDetails.addEventListener("change", onchange);

        this.edgeDetails = this.viewTabs.edge.appendChild(CustomInputs.category("Viewing", edgeInspectorTemplate));
        this.edgeSpan = this.nodeDetails.firstElementChild.appendChild(elementFromHtml(`<span style="margin-left: 2rem;"></span>`));
        this.edgeSpan.addEventListener("click", scrollIntoView);
        this.edgeDetails.addEventListener("change", onchange);
    }




    observe(element=this.observed) {
        switch (element.tagName) {
            case "GRAPH-NODE": {
                
                this.nodeDetails.validate();
                this.nodeDetails.load(this.extractNodeData(element));
                this.nodeSpan.textContent = "#" + element.nodeId;

                this.querySelector("[for='node']").click();
                break;
            }
            case "GRAPH-TAB": {
                
                
                break;
            }
            case "GRAPH-EDGE": {
                this.edgeDetails.validate();
                this.edgeDetails.load(this.extractEdgeData(element));
                this.edgeSpan.textContent = `#${element.from} ${element.to}`;

                this.querySelector("[for='edge']").click();
                break;
            }
            default: return;
        }
        this.observed = element;
    }
    /**@param {NodeUI} node*/
    extractNodeData(node) {
        let rez={
            id: node.nodeId,
            mass: node.mass,
            template: node.template,
            description: node.description,
            transform: node.transform,
        }
        let g = node.getGraph();
        let degree = g.getDegree(rez.id);
        if (g.type == UNORDERED) rez.degree = degree;
        else {
            rez.degree = degree.inner + degree.outer;
            rez.inner = degree.inner;
            rez.outer = degree.outer;
        }
        //console.log(rez)
        return rez;
    }
    extractEdgeData(edge) {
        let rez = {
            from: edge.from,
            to: edge.to,
            symmetry: edge.symmetry,
            mode: edge.mode,
        }
        return rez;
    }
    extractGraphData(graph) {
        
    }
}

customElements.define("graph-inspector", Inspector);