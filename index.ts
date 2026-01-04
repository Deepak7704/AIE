import { createAgent,createMiddleware } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { request } from "express";

const basicModel = new ChatGoogleGenerativeAI({
    model:"gemini-2.0-flash",
    temperature:0.2
})

const advancedModel = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2
})

const dynamicModelSelect = createMiddleware({
    name:"DynamicModelSelection",
    wrapModelCall: async (request,handler) =>{
        const messageCount = request.messages.length;
        return handler({
            ...request,
            model:messageCount>10 ? advancedModel : basicModel,
        })
    }
});
const agent = createAgent({
    model:basicModel, // which is selected as a default model
    middleware:[dynamicModelSelect]
})