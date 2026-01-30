import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as z from "zod";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
});

const SentenceState = new StateSchema({
  text: z.string(),
  sentiment: z.string().default(""),
});

const sentenceAnalyzer = new StateGraph(SentenceState)
  .addNode("analyzeSentiment", async (state) => {
    const response = await model.invoke(
      `Analyze sentiment of this sentence in one word (positive/negative/neutral): "${state.text}"`
    );
    return { sentiment: response.content.toString().trim().toLowerCase() };
  })
  .addEdge(START, "analyzeSentiment")
  .addEdge("analyzeSentiment", END);

const sentenceGraph = sentenceAnalyzer.compile();

const ReviewState = new StateSchema({
  reviewText: z.string(),
  sentiments: z.array(z.string()).default([]),
  overallSentiment: z.string().default(""),
});

const reviewAnalyzer = new StateGraph(ReviewState)
  .addNode("splitAndAnalyze", async (state) => {
    const sentences = state.reviewText.split(/[.!?]+/).filter(s => s.trim());
    const sentiments: string[] = [];
    
    for (const sentence of sentences) {
      if (sentence.trim()) {
        const result = await sentenceGraph.invoke({
          text: sentence.trim(),
          sentiment: "",
        });
        sentiments.push(result.sentiment);
      }
    }
    
    return { sentiments };
  })
  .addNode("calculateOverall", (state) => {
    const positive = state.sentiments.filter(s => s.includes("positive")).length;
    const negative = state.sentiments.filter(s => s.includes("negative")).length;
    
    const overall = positive > negative ? "positive" : 
                   negative > positive ? "negative" : "neutral";
    
    return { overallSentiment: overall };
  })
  .addEdge(START, "splitAndAnalyze")
  .addEdge("splitAndAnalyze", "calculateOverall")
  .addEdge("calculateOverall", END);

const reviewGraph = reviewAnalyzer.compile();

const ProductState = new StateSchema({
  productName: z.string(),
  reviews: z.array(z.string()),
  report: z.string().default(""),
});

const productAnalyzer = new StateGraph(ProductState)
  .addNode("initialize", (state) => {
    return { report: `Product: ${state.productName}\n\n` };
  })
  .addNode("analyzeReviews", async (state) => {
    let report = state.report;
    
    for (let i = 0; i < state.reviews.length; i++) {
      const result = await reviewGraph.invoke({
        reviewText: state.reviews[i],
        sentiments: [],
        overallSentiment: "",
      });
      report += `Review ${i + 1}: ${result.overallSentiment}\n`;
    }
    
    return { report };
  })
  .addNode("generateSummary", async (state) => {
    const response = await model.invoke(
      `Summarize this product analysis in one sentence:\n${state.report}`
    );
    return { report: state.report + `\nSummary: ${response.content}` };
  })
  .addEdge(START, "initialize")
  .addEdge("initialize", "analyzeReviews")
  .addEdge("analyzeReviews", "generateSummary")
  .addEdge("generateSummary", END);

const productGraph = productAnalyzer.compile();

const result = await productGraph.invoke({
  productName: "Wireless Headphones",
  reviews: [
    "Great sound quality. Battery life is amazing.",
    "Comfortable fit. The noise cancellation works well.",
  ],
  report: "",
});

console.log(result.report);
