import * as z from "zod";
import{ tool, type Tool,type ToolRuntime } from "langchain";
import { createAgent } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const getWeather = tool(
    async ({city},config:ToolRuntime)=>{
        const writer = config.writer;
        if(writer){
            writer(`Looking up data for city:${city}`);
            writer(`Acquired data for city ${city}`)
        }
        return `It is always sunny in this ${city}`;
    },
    {
        name:"get_weather",
        description:"Get weather for a given city",
        schema:z.object({
            city:z.string(),
        })
    }
)
const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2
})
const agent = createAgent({
    model,
    tools:[getWeather],
})

const stream_responses = await agent.streamEvents({
    messages:[{ role:'human', content:'what is the weather in tokyo' }]});

for await (const chunk of stream_responses){
    if(chunk.event=="on_tool_writer"){
        console.log("WRITER",chunk.data);
    }
    //tool lifecycle
    if(chunk.event === 'on_tool_start'){
        console.log("Tool start:",chunk.name)
    }
    if(chunk.event === "on_tool_end"){
        console.log("TOOL END:",chunk.name)
    }
    if(chunk.event === "on_chat_model_end"){
        const message = chunk.data.output;
        if(message){
            console.log("MESSAGE",message.content);
        }
    }
}