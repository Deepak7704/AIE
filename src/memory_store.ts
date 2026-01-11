import * as z from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InMemoryStore } from "@langchain/langgraph";
import { createAgent,tool } from "langchain";

const store = new InMemoryStore();

const getUserInfor = tool (
    async ({user_id}) => {
        const value = await store.get(["users"],user_id);
        console.log("get_user_info",user_id,value);
        return value;
    },{
        name:"get_user_info",
        description:"look up user info",
        schema:z.object({
            user_id:z.string(),
        })
    }
);

const saveUserInfor = tool(
    async({user_id,name,age,email})=>{
        console.log("save_user_info",user_id, name, age, email);
        await store.put(["users"], user_id,{name,age,email});
        return "Successfully saved user info"
    },{
        name:"save_user_info",
        description:"Save user info",
        schema:z.object({
            user_id:z.string(),
            name:z.string(),
            age:z.number(),
            email:z.email(),
        })
    }
)
const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2
})
const agent = createAgent({
    model,
    tools:[getUserInfor,saveUserInfor],
    store,
});
await agent.invoke({
    messages:[
        {
            role:'human',
            content:'Save the following user: userid:abc123, name:tester, age:10, email:tester@gmail.com'
        },
    ]
})

const result = await agent.invoke({
    messages:[{
        role:'human',
        content:'Get the user info for user with id abc123'
    }]
})
console.log(result);