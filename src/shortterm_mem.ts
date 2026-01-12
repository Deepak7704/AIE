import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RemoveMessage } from "@langchain/core/messages";
import { createAgent,createMiddleware } from "langchain";
import { MemorySaver, REMOVE_ALL_MESSAGES } from "@langchain/langgraph";

const trimMessages = createMiddleware({
    name:"TrimMessage",
    beforeModel:(state) => {
        const messages = state.messages;

        if(messages.length <= 3) {
            return;
        }
        const firstMsg = messages[0];
        const recentMessages = messages.length % 2 === 0 ? messages.slice(-3) : messages.slice(-4);
        const newMessage = [firstMsg, ...recentMessages];
        return {
            messages: [
                new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
                ...newMessage
            ].filter((m) => m !== undefined) as any
        };
    }
})

const checkpointer = new MemorySaver();
const model = new ChatGoogleGenerativeAI({
    model:"gemini-2.5-flash",
    temperature:0.2
});
const agent = createAgent({
    model,
    tools:[],
    middleware:[trimMessages],
    checkpointer
});