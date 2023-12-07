const _menu_template = /* html */`
    <style>
        :host{
            color: inherit;
            --accent-color: var(--ui-select);
        }
        *{
            color: inherit;
            background-color: inherit;
            box-sizing: border-box;
        }
        .hide{
            display: none;
        }
        ::-webkit-scrollbar{
            background-color: inherit;
            width: 12px;    height: 12px;
        }
        ::-webkit-scrollbar-thumb{
            background-color: rgba(0, 0, 0, 0.47);
            border-radius: .2em;
        }
        input, textarea{
            width: auto;
            border: none;
            outline: none;
            box-shadow: 0 0 1px 1px var(--accent-color);
        }
        input:focus{
            background-color: var(--accent-color);
        }
        select{
            border-color: var(--accent-color);
        }
        select:focus{
            outline:none;
            box-shadow: 0px 0px 5px var(--accent-color);
        }
        
        dialog{
            width: 75%; height: 75%;
            border: none;
            border-radius: 5px;
            background-color: var(--menu-background);
            padding-bottom: 0;

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

        .footer{
            display: flex;
            align-items: center;
            justify-content: end;
            margin-top: 2px;
        }
        .header,.header input{
            font-size: 1rem;
        }
        .inputs {
            padding: .7rem 0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        .tabs{
            flex: 1;
        }
        textarea{
            resize: none;
            width: 100%; height: 100%;
        }
        
    </style>
    <dialog>
        <div class="container">
            <div class="header">
                <span>Add new graph : </span>
                <input type="text" name="name" maxLength=32 size=16 spellcheck=false>
                <hr/>
            </div>
            <div class="inputs">
                <label>
                    Type :
                    <select>
                        <option>Unordered</option>
                        <option>Ordered</option>
                    </select>
                </label>
                <label>
                    Input :
                    <select name="input mode">
                        <option>Matrix</option>
                        <option>Edge list</option>
                        <option>Adjacency list</option>
                        <option>Parent array</option>
                    </select>
                </label>
                <label>
                    Nodes :
                    <input type="text" name="nodes" value="1" maxLength="4" size="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                </label>
            </div>

            <div class ="tabs">
                <textarea>0</textarea>
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
        const shadow = this.attachShadow({ mode: "open"});
        shadow.innerHTML = _menu_template;
        this.dialog = shadow.querySelector("dialog");

        //stop textarea from being disabled on enter
        this.dialog.addEventListener("keydown", (ev) => {
            if(ev.target.tagName==="TEXTAREA") ev.stopPropagation();
        })

        //close when clicked outside
        let rect = this.dialog.getBoundingClientRect();
        this.dialog.addEventListener("click", (ev) => {
            console.log(ev.target.tagName);
            if (ev.target.tagName !== "DIALOG") return;
            if ((ev.clientX > rect.left + rect.width || ev.clientX < rect.left) &&
                ((ev.clientY > rect.top + rect.height || ev.clientY < rect.top))) this.close();
        })

        shadow.querySelector(`button[name="submit"]`).onclick = (ev) => {
            this.close();
            createGraph();
        }

        let name = shadow.querySelector("[name='name']");
        name.value = "Graph " + (Graph.id + 1);
        name.select();

        this.data = {
            nameI: shadow.querySelector("[name='name']"),
            typeI: shadow.querySelector("[name='input mode']"),
            nrNodes: shadow.querySelector("[name='nodes']"),
            textarea: shadow.querySelector("textarea")
        }
    }
    open() {
        this.dialog.showModal();
    }
    close() {
        this.dialog.close();
    }
    format(text) {
        
    }
    info() {
        return {
            type: this.data.typeI.value,
            nrNodes: this.data.nrNodes.value,
            name: this.data.nameI.value,
            text: this.data.textarea.value
        }; 
    }
}

customElements.define("graph-menu", graphAdditionMenu);