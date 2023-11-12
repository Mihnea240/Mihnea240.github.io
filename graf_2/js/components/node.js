
const _node_template = /* html */`
    <style>
        :host{
            position: absolute;
            z-index: 100;
        }
        div{
            color: var(--node-color);
            border: var(--node-border);
            display: grid;
            place-content: center;
            user-select: none;
        }
        .hide{
            display: none;
        }
        [name="id"]{
            width: var(--node-width);
            height: var(--node-height);
            border-radius: var(--node-border-radius);
            
        }



    </style>
    <div name="id" data-state="main"></div>
`

class nodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main = shadow.querySelector("[data-state='main']");
        this.computedStyles = getComputedStyle(this);
        this.pos = new Point();
        this.onmove = _ => true;
        this.curve = shadow.querySelector("curved-path");
        let auxP = new Point();


        addCustomDrag(this, {
            onstart: (ev) => {
                ev.stopPropagation();ev.preventDefault();
                if (ev.buttons == 2) {
                    this.initCurve();
                }
                return true;
            },
            onmove: (ev, delta) => {
                console.log(ev.buttons);
                switch (ev.buttons) {
                    case 1: {
                        this.position(this.pos.x + delta.x, this.pos.y + delta.y);
                        this.onmove(this.nodeId, this.middle());
                        break;
                    }
                    case 2: {
                        ev.preventDefault();
                        this.curve.to = auxP.set(ev.pageX-this.parentRect.left, ev.pageY-this.parentRect.top);
                    } 
                }
                
            },
            onend: () => {
                this.curve?.classList.add("hide");
            }
        })
    }

    initCurve() {
        if (!this.curve) this.curve = this.shadowRoot.appendChild(elementFromHtml('<curved-path></curved-path>'));
        else this.curve.classList.remove("hide");

        this.curve.from = this.middle();
    }
    middle() {
        return new Point(
            this.pos.x + parseFloat(this.computedStyles.width) / 2,
            this.pos.y + parseFloat(this.computedStyles.height) / 2
        );
            
    }

    position(x, y) {
        this.pos.set(x,y);
        this.style.cssText += `left: ${this.pos.x}px; top: ${this.pos.y}px`;
    }

    connectedCallback() {
        let ids = this.id.split('_');
        this.nodeId = parseInt(ids[1]);
        this.graphId = parseInt(ids[0]);
        this.parentRect = this.getBoundingClientRect(this.parentElement);
        this.graph = graphs.get(this.graphId);
        this.main.innerHTML = this.nodeId;
    }
}

customElements.define("graph-node", nodeUI);