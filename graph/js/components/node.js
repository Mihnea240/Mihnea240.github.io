
const _node_template = /* html */`
    <style>
        :host{
            position: absolute;
            z-index: 100;
        }
        .hide{display:none;}
        div{
            color: var(--node-color);
            display: grid;
            place-content: center;
            user-select: none;
        }
        .hide{
            display: none;
        }

        [name="id"],div{
            width: var(--node-width);
            height: var(--node-height);
            border-radius: var(--node-border-radius);
            border: var(--node-border-width) var(--node-border-style) var(--node-border-color);
            background: var(--node-background);
            font-size: calc(var(--node-width) * 0.5);
        }
        :not(.hide).selected{
            box-shadow:
                0 0 var(--node-emission) var(--graph-main-color),
                0 0 calc(var(--node-emission) *0.9) var(--graph-main-color) inset;
        }



    </style>
    <div name="id" class="hide"></div>
`.trim();

class NodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main = shadow.querySelector(":not(.hide)");

        this.oncontextmenu = (ev) => ev.preventDefault();
        this.onmove = _ => true;
    }

    /**@param {NodeProps} props  */
    init(props=new NodeProps()) {
        this.props = props;
        
        let ids = this.id.split(' ');
        this.props.id = this.nodeId = parseInt(ids[1]);
        this.props.graphId = this.graphId = parseInt(ids[0].slice(1));

        this.viewMode = this.props.states.viewMode;
    }

    get transform() { return this.props.physics.transform }
    
    set selected(flag) { this.main.classList.toggle("selected", this.props.states.selected = flag) }
    get selected() { return this.props.states.selected }

    set active(flag) { this.props.states.active = flag }
    get active() { return this.props.states.active }

    set new_node_protocol(flag) { this.props.states.new_node_protocol = flag };
    get new_node_protocol() { return this.props.states.new_node_protocol };
    
    set viewMode(mode) {

        let newEl = this.shadowRoot.querySelector(`[name=${mode}]`);
        if (!newEl) return;
        this.props.viewMode = mode;

        this.main.classList.add("hide");
        this.main = newEl;
        this.main.classList.remove("hide");

        switch (mode) {
            case "id": this.main.textContent = this.nodeId; break;
        }
    }
    get viewMode() { return this.props.viewMode }

    initCurve() {
        this.parentElement.curve.classList.remove("hide");
        this.parentElement.curve.from = this.parentElement.curve.to = this.middle();
        this.new_node_protocol = true;
    }

    middle(x = 0.5, y = 0.5) {
        return new Point(
            this.transform.position.x + this.transform.size.x * x,
            this.transform.position.y + this.transform.size.y * y
        );   
    }

    position(x, y , updateEdges=true) {
        this.transform.position.set(x,y);
        this.update(updateEdges);
    }
    translate(x,y,update=true) {
        this.transform.position.translate(x, y);
        this.update(update);
    }
    update(updateEdges=true) {
        this.style.cssText += `left: ${this.transform.position.x}px; top: ${this.transform.position.y}px`;
        if(updateEdges)this.parentElement.recalculateEdges(this.nodeId, this.middle());
    }

    focus() {
        this.parentElement.focus(this.transform.position);
    }
    connectedCallback() {
        if (!this.props) this.init();
    }
}

customElements.define("graph-node", NodeUI);


class NodeProps{
    constructor(obj) {
        this.id=0,
        this.graphId = 0,
            
        this.physics = {
            mass: 1,
            isAffectedByGravity: true,
            transform: new Transform(),
        }
        this.states= {
            selected: false,
            active: false,
            new_node_protocol: false,
            viewMode: "id",
        }
        this.view = {
            
        }
        this.custom = { ...obj }
    }

    copy() {
        return Object.assign(new NodeProps(), JSON.parse(JSON.stringify(this)));
    }
}

const nodeTemplates = {
    default: {
        details: {
            "view mode": {
                type: "select",
                options: ["id"],
            }
        },
        physics: {
            mass: {
                value: 1,
                type: "number",
            },
            position: {
                type: "point",
                max: "200",
            },
            velocity: {
                type: "point",
                max: "200",
            },
            acceleration: {
                type: "point",
                max: "2",
            }
        }
    }
}
