

const _pop_menu_template =/* html */`
    <style>
        .wrapper {
            position: absolute;
            transform: scaleY(0);
            transform-origin: 0 0;
            transition: transform 100ms ease-out;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .wrapper.open {
            transform: scaleY(1);
            transition: transform 0.5s ease-out;
        }
    </style>

    <div class="header">
        <slot name="title"></slot>
    </div>
    
    <div class="wrapper" part="wrapper">
        <slot></slot>
    </div>      
`


class PopMenu extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _pop_menu_template;
        this.open = false;

        this._internals = this.attachInternals();
        this.wrapper = shadow.querySelector(".wrapper");        
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
        this.wrapper.classList.add("open");
        if (x !== undefined && y !== undefined) {
            this.wrapper.style.cssText += `left: ${x}px; top: ${y}px`;
        }
    }
    
    close() {
        this.open = false;
        this._internals.states.delete("--open");
        this.wrapper.classList.remove("open");
    }

    toggle(x,y) {
        if (this.open) this.close();
        else this.show(x,y);
    }
}

customElements.define("pop-menu", PopMenu);


