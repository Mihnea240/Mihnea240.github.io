
function initInspector() {
    let width = 100;
    addCustomDrag(inspector, {
        onstart(ev, delta) {
            if (ev.offsetX > 5) return false;
            return true;
        },
        onmove(ev, delta) {
            width -= delta.x;
            inspector.style.minWidth = width + "px";
        }
    });

}

class Inspector extends HTMLElement{
    constructor() {
        super();
        this.observed = null;
    }

    observe(element) {
        let menu;
        switch (element.tagName) {
            case "GRAPH-NODE": {
                menu = createOptionsMenu(nodeTemplates.default);
                
                
            }
        }
        this.appendChild(menu);
        menu.show();
        menu.closeOnClick = false;
    }
}

customElements.define("graph-inspector", Inspector);