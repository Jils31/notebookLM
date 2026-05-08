import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-flash-latest",
  });

  const result = await model.generateContent("hello");

  console.log(result.response.text());
}

test();

// import dotenv from "dotenv";
// dotenv.config({ path: "../.env" });

// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function listModels() {
//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
//   );

//   const data = await response.json();

//   console.log(JSON.stringify(data, null, 2));
// }

// listModels();