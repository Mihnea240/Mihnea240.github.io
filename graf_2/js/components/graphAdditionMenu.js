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
            box-shadow: 1px 1px 3px black;
        }
        span[contenteditable="true"]{
            outline: none;
            padding: .1rem;
            background-color: var(--ui-select);
            
        }
        .tabs{
            grid-area: d;
        }
        .tabs [name="Matrix tab"] table{
            border: 1px solid white;
            width: 100%; height: 100%;
        }
        td{

        }

        
    </style>
    <dialog>
        <div class="container">
            <h2 class="header">Add new graph <hr/></h2>
            <div class="main">
                <label>
                    Name :
                    <input type="text" name="name" maxLength=32 size=16 spellcheck=false>
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
                    <select name="input mode">
                        <option>Matrix</option>
                        <option>Edge list</option>
                        <option>Adjacency list</option>
                        <option>Parent array</option>
                    </select>
                </label>
                <div class ="tabs">

                    <div name="Matrix tab">
                        <label>
                            Number of nodes :
                            <input type="text" name="nodes" value="1" maxLength="4" size="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                        </label>
                        <table>
                            <tr>
                                <td>1</td>
                            </tr>
                        </table>

                    </div>
                    <div name="Edge list tab" class="hide"></div>
                    <div name="Adjacency list tab" class="hide"></div>
                    <div name="Parent array tab" class="hide"></div>
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

        shadow.querySelector("[name='name']").value = "Graph " + (Graph.id + 1);
        this.modes = {
            Matrix: {
                tab: shadow.querySelector("[name='Matrix tab']"),
                nrNodes: shadow.querySelector("[name='nodes']"),
                table: shadow.querySelector("[name='Matrix tab'] table"),
                valueMatrix: createMatrix(2, 2),
                size: 1
            },
            Edge_list: {
                tab: shadow.querySelector("[name='Edge list tab']"),
                nrNodes: shadow.querySelector("[name='nodes']"),
                table: shadow.querySelector("[name='Edge list tab'] table")
            },
        };

        this.modeSelection = shadow.querySelector("[name='input mode']");
        this.selectedMode = "matrix";
        
        this.modeSelection.addEventListener("change", (ev) => {
            this.modes[this.selectedMode].tab.classList.toggle("hide");
            this.selectedMode = ev.target.value.replaceAll(" ","_");
            this.modes[this.selectedMode].tab.classList.toggle("hide");            
        })

        this.modes.Matrix.nrNodes.addEventListener("change",(ev) => {
            //copy values from old to new
            let oldn = this.modes.Matrix.size;
            let newn = ev.target.value;
            if (oldn < newn) {
                let newMatrix = createMatrix(newn + 1, newn + 1);
                for (let i = 1; i <= oldn; i++)
                    for (let j = 1; j <= oldn; j++)newMatrix[i][j] = this.modes.Matrix.valueMatrix[i][j];
                this.modes.Matrix.valueMatrix = newMatrix;
            }
            this.modes.size = newn;
            
            let tr = document.createElement("tr");
            let td = elementFromHtml(`<td><input type="checkbox"></td>`);
            let table = this.modes.Matrix.table;

            table.classList.add("hide");
            table.innerHTML = '';
            //td.contentEditable = true;
            //td.textContent = "0";

            for (let j = 1; j <= newn; j++){
                tr.appendChild(td.cloneNode(true));
            }
            for (let i = 1; i <= newn; i++){
                table.appendChild(tr.cloneNode(true));  
            }
            
            table.classList.remove("hide");
        })


    }
}

customElements.define("graph-menu", graphAdditionMenu);