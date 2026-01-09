import * as z from "zod";
import { createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const customStateSchema = z.object({  
    userId: z.string(),  
    preferences: z.record(z.string(), z.any()),  
});  

const stateExtensionMiddleware = createMiddleware({
    name: "StateExtension",
    stateSchema: customStateSchema,  
});

const checkpointer = new MemorySaver();
const model = new ChatGoogleGenerativeAI({
    model:'gemini-2.5-flash'
});
const agent = createAgent({
    model,
    tools: [],
    middleware: [stateExtensionMiddleware],  
    checkpointer,
});


const result = await agent.invoke({
    messages: [{ role: "user", content: "Hello" }],
    userId: "user_123",  
    preferences: { theme: "dark" },  
});