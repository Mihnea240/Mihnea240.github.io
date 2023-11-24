const _menu_template = /* html */`
    <style>
        :host{
            color: white;
        }
        *{
            color: inherit;
            background-color: inherit;
        }
        input{
            backdrop-filter: blur(5px);
            width: auto;
            border: none;
            outline: none;
        }
        input:focus{
            background-color: var(--ui-select);
            border-bottom: 1px double white;
        }
        select{

        }
        .hide{
            display: none;
        }
        dialog{
            width: 50%; height: 50%;
            border: none;
            border-radius: 5px;
            background-color: var(--menu-background);

        }
        dialog::backdrop{
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(2px);
        }
        .container{
            display: flex;
            flex-direction: column;
            height: 100%; width: 100%;
        }

        .footer, .header{
            margin: 0;
            flex-basis: 10%;
        }
        .main{
            display: grid;
            grid-template-columns: repeat(3,1fr);
            flex-grow: 1;
            gap: 10px;
            grid-template-rows: min-content auto;
            grid-template-areas: "a b c"
                                 "d d d";
        }
        button[name="submit"]{
            position: absolute;
            margin-left: auto;
        }
        [name="rows"], [name="columns"]{
            outline: 1px solid white;
            border-radius: 0;
        }
        span[contenteditable="true"]{
            outline: none;
            padding: .1rem;
            background-color: var(--ui-select);
            width: 10px;
        }
        .tabs{
            grid-area: d;
        }
        table{
        }

        
    </style>
    <dialog>
        <div class="container">
            <h2 class="header">Add new graph <hr/></h2>
            <div class="main">
                <label>
                    Name :
                    <span name="name">New graph</span>
                </label>
                <label>
                    Type :
                    <select>
                        <option>Unordered</option>
                        <option>Ordered</option>
                    </select>
                </label>
                <label>
                    Input mode :
                    <select>
                        <option>Matrix</option>
                        <option>Edge list</option>
                        <option>Adjacency list</option>
                        <option>Parent array</option>
                    </select>
                </label>
                <div class ="tabs">
                    <div class=matrix-tab>
                        <label>
                            Input mode :
                           <!--  <--<input type="text" name="rows" value="1" maxLength="4" size="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" name="columns" value="1" maxLength="4" size="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')"> -->
                            <span name="rows">1</span>
                            <span> , </span>
                            <span name="columns">1</span>
                        </label>
                        <table></table>
                        </div>
                    </div>
                    
    
                </div>
            <div class="footer">
                <button name="submit">Submit</button>
            </div>

        </div>
        
    </dialog>

`

class graphAdditionMenu extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _menu_template;
        this.dialog = shadow.querySelector("dialog");
        
        shadow.querySelector(`button[name="submit"]`).onclick = (ev) => {
            this.dialog.close();
            createGraph();
        }

        shadow.querySelectorAll(`[name="rows"], [name="columns"]`).forEach((el) => {
            contentEdit(el, { maxSize: 4, minSize: 0, pattern: /[^0-9]/g , empty: "1"});
            el.addEventListener("click", (ev) => {
                el.contentEditable = true;
                el.focus();
            })
        })
        let nameSpan = shadow.querySelector("[name='name']");
        nameSpan.contentEditable = true;
        nameSpan.focus();
        contentEdit(nameSpan, { maxSize: 16, empty: "Graph " + (Graph.id + 1) });
        nameSpan.addEventListener("click", (ev) => {
            nameSpan.contentEditable = true;
            nameSpan.focus();
        })
    }
}

customElements.define("graph-menu", graphAdditionMenu);