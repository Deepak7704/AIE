import "dotenv/config";
import * as z from "zod";

import { createAgent, tool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const searchTool = tool(
    async({query}:{query:string})=>{
        return `1. openai released a new gpt model improving reasoning
        2. Google announced advancements in gemini ai
        3. AI regulations are being discussed gloablly`
    },{
        name:"search",
        description:"search for recent AI related news",
        schema: z.object({
            query:z.string().describe("search query"),
        }),
    }
)

const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2
})
const agent = createAgent({
    model,
    tools:[searchTool]
})

//streaming invocation
async function runStreamingAgent(){
    const stream = await agent.stream({
        messages:[{
            role: 'user',
            content: "Search AI news and summarize the findings"
        }]
    },{streamMode:"values"});

    for await (const chunk of stream){
        const lastMessage = chunk.messages.at(-1);
        if(!lastMessage){
            continue;
        }
        if(lastMessage.content){
            console.log(`Agent ${lastMessage.content}`)
        }else if ("tool_calls" in lastMessage && (lastMessage as any).tool_calls?.length > 0){
            const toolCalls = (lastMessage as any).tool_calls;
            console.log(`Agent calling tools: ${toolCalls.map((tc: any) => tc.name).join(", ")}`);
        }
    }
}
runStreamingAgent();