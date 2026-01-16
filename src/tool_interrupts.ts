import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { interrupt, StateGraph, START, END, MemorySaver, Command } from "@langchain/langgraph";
import * as z from "zod";

const sendEmailTool = tool(
  async ({ to, subject, body }) => {
    const response = interrupt({
      action: "send_email",
      to,
      subject,
      body,
      message: "Approve sending this email?",
    });

    if (response?.action === "approve") {
      const finalTo = response.to ?? to;
      const finalSubject = response.subject ?? subject;
      const finalBody = response.body ?? body;
      return `Email sent to ${finalTo} with subject '${finalSubject}' and body '${finalBody}'`;
    }

    return "Email cancelled by user";
  },
  {
    name: "send_email",
    description: "Send an email",
    schema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
  }
);

const State = z.object({
  messages: z.array(z.any()),
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.2,
});

const agentNode = async (state: any) => {
  const response = await model.invoke(state.messages, {
    tools: [sendEmailTool],
  });
  return { messages: [...state.messages, response] };
};

const workflow = new StateGraph(State)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END);

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

const config = { configurable: { thread_id: "email-thread-1" } };

const firstRun = await graph.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Send an email to test@example.com with subject Hello and body Welcome",
      },
    ],
  },
  config
);

console.log(firstRun);

const secondRun = await graph.invoke(
  new Command({
    resume: {
      action: "approve",
      to: "approved@example.com",
      subject: "Approved Subject",
      body: "Approved Body",
    },
  }),
  config
);