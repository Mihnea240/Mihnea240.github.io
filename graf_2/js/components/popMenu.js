

const _pop_menu_template =/* html */`
    <style>
        :host{
            all: inherit;
            display: none;
            position: absolute;
            width: max-content;
            margin: 0;
            --direction: column;
        }
        :host(:--open){
            display: flex;
            flex-direction: var(--direction);
        }
    </style>
    
    <slot></slot>    
`


class PopMenu extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _pop_menu_template;
        console.log(this.shadowRoot)
        this.open = false;
        this.tabIndex = 0;
        this.closedEvent=new CustomEvent("menuclosed",{bubbles: true});

        this._internals = this.attachInternals();
        this.wrapper = shadow.querySelector(".wrapper");  

        document.addEventListener("click", (ev) => {
            if(this.open && !this.contains(ev.target)){
                this.dispatchEvent(this.closedEvent);
                this.close();
            }
        },false)
    }

    static observedAttributes = ["position","open"];
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "open": {
                if (newValue) this.show();
                else this.close();
                break;
            }
        }
    }
    get header(){return this.shadowRoot.querySelector("header")}

    show(x,y) {
        this.open = true;
        this._internals.states.add("--open");
        if (x !== undefined && y !== undefined) {
            this.style.cssText += `left: ${x}px; top: ${y}px`;
        }
    }
    
    close() {
        this.open = false;
        this._internals.states.delete("--open");
    }

    toggle(x,y) {
        if (this.open) this.close();
        else this.show(x,y);
    }
}

customElements.define("pop-menu", PopMenu);


