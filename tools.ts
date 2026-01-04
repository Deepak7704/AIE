import "dotenv/config"
import * as z from "zod";
import { createAgent,tool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


const search = tool(
    ({query}) => `Result for ${query}`,
    {
        name:'Search',
        description:'Find the relevant information',
        schema:z.object({
            query:z.string().describe('the query to search for'),
        }),
    }
);

const weather = tool(
    ({location,humidity}) => `Temperature at this ${location} and ${humidity}`,
    {
        name:'get_weather',
        description:'Get the weather details based up on the given location',
        schema:z.object({
            location:z.string().describe('this is the location we have to find the temperature for'),
            humidity:z.string().optional()
        })
    }
);

const model = new ChatGoogleGenerativeAI({
    model:'gemini-2.5-flash',
    temperature:0.2,
})
const agent = createAgent({
    model,
    tools:[search,weather],
});
const response = await agent.invoke({
    messages:[
        {
            role:'user',
            content:"what is the weather in tokyo"
        },
    ],
});
const lastMessage = response.messages[response.messages.length-1];
if(!lastMessage){
    throw new Error("Agent did not return a response")
}
console.log(lastMessage.content);