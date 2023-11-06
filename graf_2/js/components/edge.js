
const _edge_template = /* html */`
    <style>
        :host{
            position: absolute;
            width: 100%;height: 100%;
        }
        svg{
            width: 100%;height: 100%;
        }

        path{
            fill: none;
            stroke: white;
            stroke-width: 2px;
        }
        .hit-area{
            stroke-width: 10px;
            stroke-opacity: 0;
        }
        .hit-area:hover{
            stroke-opacity: 0.3;
        }
        .point{
            width: var(--point-width, 10px);
            aspect-ratio: 1;

        }
    </style>

    <div class="point"></div>
    <div class="point"></div>
    <svg>
        <path class="visible" d="M 10 200 C 100 100, 100 200, 500 500"/>
        <path class="hit-area"d="M 10 200 C 100 100, 100 200, 500 500"/>
    </svg>


`

class edgeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;
        this.controlPoints = [];
        this.fromCoord = { x: 0, y: 0 };
        this.toCoord = { x: 0, y: 0 };


        shadow.querySelector("path").onclick = () => {
            console.log(this);
        }
    }

    connectedCallback() {

    }
}

customElements.define("graph-edge", edgeUI);