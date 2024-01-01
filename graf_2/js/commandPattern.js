class Command{
    undo(){}
    redo(){}
}

class CommandStack{
    constructor(graph) {
        this.undoStack = [];
        this.redoStack = [];
        this.groupItems = false;
        this.graph = graph;
    }
    startGroup() {
        this.undoStack.push(new GroupCommands());
        this.groupItems = true;
    }
    endGroup() {
        this.groupItems = false;
        if (!this.undoStack.at(-1).commands.length) this.pop();
    }

    push(command) {
        if (this.groupItems) {
            this.undoStack.at(-1).push(command);
        } else this.undoStack.push(command);
        this.redoStack = [];
    }

    undo(resolve = true) {
        if (this.undoStack.length <= 0) return;
        let c = this.undoStack.pop();
        if (resolve) {
            c.undo(this.graph);
            this.redoStack.push(c);
            return c;
        }
    }
    redo(resolve=true) {
        if (this.redoStack.length <= 0) return;
        let c = this.redoStack.pop();
        if (resolve) {
            c.redo(this.graph);
            this.undoStack.push(c);
            return c;
        }
    }
    pop() {
        return this.undoStack.pop();
    }

    clear() {
        this.commands = [];
    }
}

class GroupCommands extends Command{
    constructor(...args) {
        super();
        if (args[0]?.constructor.name=="Array") this.commands = args[0];
        else this.commands = args;
    }
    push(command) {
        this.commands.push(command);
    }
    redo(graph) {
        for (let c of this.commands) c.redo(graph);
    }
    undo(graph) {
        for (let c of this.commands) c.undo(graph);
    }
}

class AddNodesCommand extends Command{
    constructor(...args) {
        super();
        if (args[0]?.constructor.name=="Array") this.nodeIds = args[0];
        else this.nodeIds = args;
    }
    redo(graph) {
        for (let i of this.nodeIds) graph.addNode(i, false);
    }
    undo(graph) {
        for (let i of this.nodeIds) graph.removeNode(i, false);
    }

}

class RemoveNodesCommand extends Command{
    constructor(...args) {
        super();
        if (args[0]?.constructor.name=="Array") this.nodeIds = args[0];
        else this.nodeIds = args;
    }
    redo(graph) {
        for (let i of this.nodeIds) graph.removeNode(i,false);
    }
    undo(graph) {
        for (let i of this.nodeIds) graph.addNode(i,false);
    }
}


class AddEdgesCommand extends Command{
    constructor(...args) {
        super();
        this.edgeIds = args;
    }
    redo(graph) {
        for (let [x,y] of this.edgeIds) graph.addEdge(x,y,false);
    }
    undo(graph) {
        for (let [x,y] of this.edgeIds) graph.removeEdge(x,y,false);
    }

}

class RemoveEdgesCommand extends Command{
    constructor(...args) {
        super();
        this.edgeIds = args;
    }
    redo(graph) {
        for (let [x,y] of this.edgeIds) graph.removeEdge(x,y,false);
    }
    undo(graph) {
        for (let [x,y] of this.edgeIds) graph.addEdge(x,y,false);
    }
}

class NodePropsChangedCommand extends Command{
    constructor(id, props) {
        super();
        this.props = props;
    }
    undo(graph) {
        let n = graph.getNodeUI();
    }
}

class SettingsChangedCommand extends Command{
    constructor(category, prop, oldValue, newValue) {
        super();
        this.category = category;
        this.prop = prop;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
    redo(graph){
        graph.settings[this.category][this.prop] = this.oldValue;
    }
    undo(graph) {
        graph.settings[this.category][this.prop] = this.newValue;
    }
}