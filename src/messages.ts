import "dotenv/config";
import * as z from "zod";
//dynamic system prompt middleware helps to route to the required system
//prompt based up on user input
import { createAgent,dynamicSystemPromptMiddleware, HumanMessage } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
 
const contextSchema = z.object({
    userRole:z.enum(["expert","beginner"]),
});

const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash"
})
const agent = createAgent({
    model,
    contextSchema,
    middleware:[
        dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>((state,runtime) => {
            // to fetch the user role in runtime (this middleware is invoked)
            const userRole = runtime.context.userRole || 'user';
            const basePrompt = "You are a helpful assistant.";
            if(userRole==="expert"){
                return `${basePrompt} Provide detailed technical response.`
            }else if(userRole==="beginner"){
                return `${basePrompt} Explain concepts simply and avoid jargon.`
            }
            return basePrompt;
        })
    ]
})
const result = await agent.invoke({
    messages:[
        new HumanMessage("Explain machine learning"),
    ],
},{
    context:{
        userRole:'expert'
    }
});
const final_result = result.messages.at(-1);
console.log(final_result?.content);