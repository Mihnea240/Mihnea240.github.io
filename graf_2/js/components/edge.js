
const _edge_template = /* html */`
    <style>
        :host{

        }
    </style>


`

class edgeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;
        this.addEventListener("nodechange", (ev) => {
            console.log(ev);
        })
    }
}

customElements.define("graph-edge", edgeUI);