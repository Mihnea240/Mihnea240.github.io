

const _pop_menu_template =/* html */`
    <style>
        :host{
            all: inherit;
            display: none;
            position: absolute;
            width: max-content;
            margin: 0; padding: 0; gap:0;
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
        this.open = false;
        this.cnt = 0;
        this.closeOnClick = false;
        this.closedEvent=new CustomEvent("menuclosed",{bubbles: true});


        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _pop_menu_template;
        this._internals = this.attachInternals();

        document.addEventListener("click", (ev) => {
            this.dispatchEvent(this.closedEvent);
            if(this.closeOnClick && this.open && !this.cnt  && !this.contains(ev.target))this.close();
            this.cnt = 0;
        })
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
    connectedCallback() {
        
    }

    show(x=0,y=0) {
        this.open = true;
        this._internals.states.add("--open");
        if (x !== undefined && y !== undefined) {
            this.style.cssText += `left: ${x}px; top: ${y}px`;
        }
        this.cnt = 1;
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


