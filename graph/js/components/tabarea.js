const _tabArea_template = /*html*/`
    <style>
        
    </style>
    <slot></slot>
`

class TabArea extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _tabArea_template;
        this.scrollBehavior = { behavior: 'smooth', block: 'nearest', inline: 'center' };
    }

    connectedCallback() {
        this.header = this.querySelector(".header");
        this.tabs = this.querySelector(".tabs");

        this.header?.addEventListener("click", (ev) => {
            let name = ev.target.getAttribute("for");
            if (!name) return;
            this.selectTab(name);
            ev.target.scrollIntoView(this.scrollBehavior);
        })
    }

    selectTab(name) {
        let newSelected = this.querySelector(`.tabs > [name="${name}"]`);
        if (!newSelected) return;

        this.active?.classList.add("hide");
        this.active = newSelected;
        this.active.classList.remove("hide");
        return true;
    }
}

customElements.define("tab-area", TabArea);