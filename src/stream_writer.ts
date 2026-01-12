import * as z from "zod";
import { createAgent, toolStrategy } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const ContactInfo = z.object({
    name:z.string().describe("person's name"),
    email : z.string().describe("Email address")
});
const EventDetails = z.object({
    event_name : z.string().describe("Name of the event"),
    date:z.string().describe("Event date"),
});

const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2,
})

const agent = createAgent({
    model,
    tools:[],
    // responseFormat:toolStrategy([ContactInfo,EventDetails])
    responseFormat:toolStrategy(ContactInfo,{
        handleError:"Please provide complete contact information"
    })
})

const results = await agent.invoke({
    messages:[{
        role:"human",
        content:"Extract information: Tester (tester@gamil.com) is organizing tech conference on March 15th"
    }]
})
console.log(results);