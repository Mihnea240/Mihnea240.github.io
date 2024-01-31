class Command {
    undo() { }
    redo() { }
}

class CommandStack {
    constructor(graph) {
        this.undoStack = [];
        this.redoStack = [];
        this.groupItems = 0;
        this.graph = graph;
        this.maxLength = 20;
    }
    startGroup() {
        this.push(new GroupCommands());
        this.groupItems++;
    }
    endGroup() {
        this.groupItems--;
        if (!this.undoStack.at(-1).commands.length) this.pop();
    }

    push(command) {
        if (this.groupItems) this.undoStack.at(-1).push(command);
        else this.undoStack.push(command);
        this.redoStack = [];

        if (this.undoStack.length > this.maxLength) this.undoStack.shift();
        return command;
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
    redo(resolve = true) {
        if (this.redoStack.length <= 0) return;
        let c = this.redoStack.pop();
        if (resolve) {
            c.redo(this.graph);
            this.undoStack.push(c);
            return c;
        }
    }
    top() {
        return this.undoStack.at(-1);
    }
    pop() {
        return this.undoStack.pop();
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}

class GroupCommands extends Command {
    constructor(...args) {
        super();
        if (args[0]?.constructor.name == "Array") this.commands = args[0];
        else this.commands = args;
    }
    push(command) {
        this.commands.push(command);
    }
    condition(c) {
        return (c.constructor.name == "AddNodesCommand" || c.constructor.name == "RemoveNodesCommand");
    }
    redo(graph) {
        for (let c of this.commands) if(this.condition(c))c.redo(graph);
        for (let c of this.commands) if(!this.condition(c))c.redo(graph);
    }
    undo(graph) {
        for (let c of this.commands) if(this.condition(c))c.undo(graph);
        for (let c of this.commands) if(!this.condition(c))c.undo(graph);
    }
}

class AddNodesCommand extends Command {
    constructor(props) {
        super();
        this.props = props;
    }
    redo(graph) {
        graph.addNode(this.props, false);
    }
    undo(graph) {
        graph.removeNode(this.props.id, false);
    }

}

class RemoveNodesCommand extends Command {
    constructor(props) {
        super();
        this.props = props;
    }
    redo(graph) {
        graph.removeNode(this.props.id, false);
    }
    undo(graph) {
        graph.addNode(this.props, false);
    }
}


class AddEdgesCommand extends Command {
    constructor(props) {
        super();
        this.props = props;
    }
    redo(graph) {
        graph.addEdge(this.props, false);
    }
    undo(graph) {
        graph.removeEdge(this.props.from, this.props.to, false);
    }

}

class RemoveEdgesCommand extends Command {
    constructor(props) {
        super();
        this.props = props;
    }
    redo(graph) {
        graph.removeEdge(this.props.from, this.props.to, false);
    }
    undo(graph) {
        graph.addEdge(this.props, false);
    }
}

class NodePropsChangedCommand extends Command {
    constructor(id, chain, oldVal, newVal) {
        super();
        this.id = id;
        this.chain = chain;
        this.newVal = newVal;
        this.oldVal = oldVal;
    }
    undo(graph) {
        let n = graph.getNodeUI(this.id);
        n.setProps(chain, this.newVal);
    }
    redo(graph) {
        let n = graph.getNodeUI(this.id);
        n.setProps(chain, this.oldVal);
    }
}

class SettingsChangedCommand extends Command {
    constructor(chain, oldValue, newValue) {
        super();
        this.chain = chain;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.acumulate = false;
    }
    redo(graph) {
        graph.setSettings(this.chain, this.newValue);
    }
    undo(graph) {
        graph.setSettings(this.chain, this.oldValue);
    }
}