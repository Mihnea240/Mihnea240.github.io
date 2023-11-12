
const _tab_template =/*html*/`
    <style>
        :host{
            position: absolute;
            width: 100%;  height:100%;
        }
        #square{
            position: absolute;
            width: 100%;  height:100%;
            background-color: transparent;
            user-select: none;
            z-index: -1;
        }
        #tab{
            position: absolute;
            overflow: scroll;
            width: 100%;  height:100%;
            background: inherit;
            
        }
        ::-webkit-scrollbar{
            background-color: inherit;
            width: 12px;    height: 12px;
            z-index: 5;
        }
        ::-webkit-scrollbar-corner{

        }
        ::-webkit-scrollbar-thumb{
            background-color: rgba(0, 0, 0, 0.47);
            border-radius: .2em;
        }
        .hide{display: none}
        number-line{
            position: absolute; z-index:10;
            font-size: 10px;
            border: .1px solid white;
        }
        number-line[direction="horizontal"]{
            bottom: 0; left:0;
        }
        number-line[direction="vertical"]{
            right: 0; top:0;
        }
    </style>

    
    
    <div id="tab" name="tab">
        <div id="square" draggable="false"></div>
        <curved-path class="hide" style="position: absolute"></curved-path>
        <slot></slot>
  
    </div>
    <number-line unit="100px" for="tab"></number-line>
    <number-line unit="100px" direction="vertical" for="tab"></number-line>
    
`

class Tab extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML=_tab_template;

        this.square = shadow.getElementById("square");
        this.css = getComputedStyle(this);
        const tab = shadow.querySelector("#tab");
        this.curve = shadow.querySelector("curved-path");

        addCustomDrag(this, {
            onmove: (ev,delta)=>{
                let rect=this.square.getBoundingClientRect();
                let dx=rect.width -delta.x;
                let dy=rect.height-delta.y;

                this.square.style.cssText += `width: ${dx}px; height: ${dy}px`;
                tab.scrollBy(-delta.x, -delta.y);
            }
        })

        this.oncontextmenu = (ev)=>{
            ev.preventDefault();
        }
    }


    connectedCallback() {
        this.rect = this.getBoundingClientRect();
    }
    
}

customElements.define("graph-tab", Tab);