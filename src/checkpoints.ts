import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { registry } from "zod";
import * as z from "zod";

const State = z.object({
    foo : z.string(),
    bar : z.array(z.string()).register(registry(),{
        reducer:{
            fn: (x:string[],y:string[]) => x.concat(y),
        },
        default: () => [] as string[]
    }),
})

const workflow = new StateGraph(State).addNode(
    "nodeA",(state)=>{
        return {foo:"a",bar:["a"]};
    }
).addNode("nodeB",(state)=>{
    return {foo:"b",bar:["b"]};
}).addEdge(START,"nodeA").addEdge("nodeA","nodeB").addEdge("nodeB",END);

const checkpointer = new MemorySaver();
const graph = workflow.compile({checkpointer});
const config = {configurable:{thread_id:"1"}};
await graph.invoke({foo:""},config);

// After we run the graph, we expect to see exactly 4 checkpoints:
// Empty checkpoint with START as the next node to be executed
// Checkpoint with the user input {'foo': '', 'bar': []} and nodeA as the next node to be executed
// Checkpoint with the outputs of nodeA {'foo': 'a', 'bar': ['a']} and nodeB as the next node to be executed
// Checkpoint with the outputs of nodeB {'foo': 'b', 'bar': ['a', 'b']} and no next nodes to be executed
// Note that the bar channel values contain outputs from both nodes as we have a reducer for the bar channel.

console.log(await graph.getState(config));
