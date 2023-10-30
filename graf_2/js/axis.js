
const _axis_template = /*html*/`
     <style>
        table{
            overflow: hidden;
            background-color:transparent;
            pointer-events: none;
            transition: all 120ms ease-in-out;
            user-select: none;
        }
        tr,td{
            padding: 0;
            width:0;height:0;
        }
        .v{
            margin-left: -1em
        }
        .h{
            margin-top: -1em
        }
        div{
            position: absolute;
            width: 1em;  height: 1em;
            overflow: visible;
            color: white;
            text-shadow: 0px 0px 5px white;
        }
    </style>

    <table draggable="false" sel></table>
`



class Axis extends HTMLElement{
    static td = elementFromHtml(/* html */`<td><div class="h">0</div></td>`);
    static tr = elementFromHtml(/* html */`<tr><td><div class="v">0</div></td></tr>`);
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _axis_template;
        this.table = shadow.querySelector("table");

        this.resizeObserver = new ResizeObserver(_=> this.fitElements());
        this.resizeObserver.observe(this.table);
        this.last = 0;
        window.addEventListener("resize", _ => this.fitElements());
    }

    static get observedAttributes() {
        return ["unit", "direction"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        newValue.toLowerCase();
        if (name === "direction" & oldValue !== newValue) {
            switch (newValue) {
                case "horizontal": this.table.style.width = "100%"; break;
                case "vertical": this.table.style.height = "100%"; break;
                default: return;
            }
        } else if (name === "unit") {
            this.table.style.cssText +=
            `
                border-spacing:${this.getAttribute("direction") == "vertical" ?"0px " + newValue: newValue + " 0px"  };
                margin-${this.getAttribute("direction") == "vertical" ? "top":"left"}: ${-parseInt(newValue)}px;
            `
        }
    }


    connectedCallback() {
        if(!this.getAttribute("direction"))this.setAttribute("direction", "horizontal");
        if (!this.getAttribute("unit")) this.setAttribute("unit", "10px");
        this.target = this.parentNode.querySelector(`[name=${this.getAttribute("for")}]`);
        
        this.target.addEventListener("scroll", (ev) => {
            let unit = 1 / parseInt(this.getAttribute("unit")),value;
            
            switch (this.getAttribute("direction")) {
                case "horizontal": {
                    value = this.target.scrollLeft * unit;
                    this.style.cssText += `transform: translate(${(Math.floor(value) - value)/unit}px,0px);`;
                    value = Math.floor(value);
                    break;
                }
                case "vertical": {
                    value = this.target.scrollTop * unit;
                    this.style.cssText += `transform: translate(0px,${(Math.floor(value) - value)/unit}px);`;
                    value = Math.floor(value);
                    break;
                }
            }
            this.table.childNodes.forEach((el, key) => {
                let div = el.querySelector("div");
                div.textContent = value + key + 1;
            });

        })
        this.fitElements();
    }
    disconnectedCallback() {
        
    }

    fitElements() {
        let size, lastElement;
        switch (this.getAttribute("direction")) {
            case "horizontal": {
                size = parseInt(getComputedStyle(this.target).width);
                lastElement = Axis.td;
                break;
            }
            case "vertical": {
                size = parseInt(getComputedStyle(this.target).height);
                lastElement = Axis.tr;
                break;
            }
        }
        let unit = parseInt(this.getAttribute("unit"));
        let div = lastElement.querySelector("div");
        size += unit;
        while (this.last < size) {
            this.last += unit;
            div.textContent++;
            this.table.appendChild(lastElement.cloneNode(true));
        }
    }

    
}

customElements.define("number-line", Axis);