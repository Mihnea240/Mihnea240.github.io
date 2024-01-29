
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
    <div name="id" class="hide main"></div>
`.trim();

class NodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main = shadow.querySelector(".main");

        this.oncontextmenu = (ev) => ev.preventDefault();
        this.onmove = _ => true;
    }

    /**@param {NodeProps} props  */
    init(props) {
        this.props = props;
        this.id = `g${this.graphId} ${this.nodeId}`;
        this.viewMode = this.props.states.viewMode;
        this.position(this.transform.position.x, this.transform.position.y, false);
    }
    get nodeId() { return this.props.details.id }
    get graphId() { return this.props.details.graphId }
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
}

customElements.define("graph-node", NodeUI);


class NodeProps{
    /**@type {Map<string,NodeProps>} */
    static templates = new Map();
    constructor(obj) {

        let type = obj?.constructor.name;
        switch (type) {
            case "NodeProps": return mergeDeep(new NodeProps(), this);
            case "String": return mergeDeep(new NodeProps(), NodeProps.templates.get(obj));
        }
        
        this.details = {
            id: 0,
            graphId: 0,
            template: "default",
        }
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
        this.custom = {};
        if (type==="Object") mergeDeep(this, obj);
    }

    createTemplate(name) {
        NodeProps.templates[name] = mergeDeep(new NodeProps(), this);
    }
}