function elementFromHtml(html){
    const template=document.createElement("template");
    template.innerHTML=html.trim();
    return template.content.firstElementChild;
}

function addCustomDrag(target,{onstart=(ev,delta)=>true,onmove=ev=>true,onend=ev=>true}){
    let pos={x:0,y:0},delta=pos;
    let moveHandle=(ev)=>{
        delta={x: ev.clientX-pos.x, y: ev.clientY-pos.y};
        pos = { x: ev.clientX, y: ev.clientY };
        onmove(ev,delta);
    }
    target.addEventListener("mousedown",(ev)=>{
        pos={x: ev.clientX, y: ev.clientY};
        
        if(!onstart(ev))return;
        target.addEventListener("mousemove",moveHandle);
        target.addEventListener("mouseup",(ev)=>{
            onend(ev)
                target.removeEventListener("mousemove", moveHandle);
        },{once:true});
        
    },false)
}


const tab_template =/*html*/`
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

    
    <number-line unit="100px" for="tab"></number-line>
    <number-line unit="100px" direction="vertical" for="tab"></number-line>
    
    <div id="tab" name="tab">
        <div id="square" draggable="false"></div>
        <slot></slot>
    </div>
    
`

class Tab extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML=tab_template;

        this.square = shadow.getElementById("square");
        const tab = this.shadowRoot.querySelector("#tab");

        addCustomDrag(this, {
            onmove: (ev,delta)=>{
                let rect=this.square.getBoundingClientRect();
                let dx=rect.width -delta.x;
                let dy=rect.height-delta.y;

                this.square.style.cssText += `width: ${dx}px; height: ${dy}px`;
                tab.scrollBy(-delta.x, -delta.y);
            }
        })

    }
    
}

customElements.define("graph-tab", Tab);