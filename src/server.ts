import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';

dotenv.config();

const port = process.env.PORT || 3001;
const apiKey = process.env.OPENAI_API_KEY;

// Check if the API key is defined
if (!apiKey) {
  console.error('OPENAI_API_KEY is not defined. Exiting...');
  process.exit(1);
}

const app = express();
app.use(express.json());

// TODO: Initialize the OpenAI model
let model: OpenAI = new OpenAI({ temperature: 0, openAIApiKey: apiKey, modelName: 'gpt-4o' });;
// TODO: Define the parser for the structured output
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  // Define the output variables and their descriptions
  Day1: "The weather forecast for today",
  Day2: "The weather forecast for tomorrow",
  Day3: "The weather forecast for 2 days from today",
  Day4: "The weather forecast for 3 days from today",
  Day5: "The weather forecast for 4 days from today"
});
// TODO: Get the format instructions from the parser
const formatInstructions = parser.getFormatInstructions();

// TODO: Define the prompt template
const promptTemplate = new PromptTemplate({
  template: "You're a meteorologist giving the 5-day weather forecast in the style of a sports announcer for any city or zipcode.\n{format_instructions}\n{text}",
  inputVariables: ["text"],
  partialVariables: { format_instructions: formatInstructions }
});
// Create a prompt function that takes the user input and passes it through the call method
const promptFunc = async (text: string) => {
  // TODO: Format the prompt with the user input
  // TODO: Call the model with the formatted prompt
  // TODO: return the JSON response
  // TODO: Catch any errors and log them to the console
  try {
    if (model) {
      const parsedInput = await promptTemplate.format({ text })
      const response = await model.invoke(parsedInput);
      try {
        return await parser.parse(response);
      } catch (err) {
        console.error('Error in parseResponse:', err);
        return { error: 'Failed to parse the response from the model.' };
      }
    };
    return "Error initializing OpenAI model"
  }

  catch (err) {
    console.error(err);
    throw err;
  }
};

// Endpoint to handle request
app.post('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const location: string = req.body.location;
    if (!location) {
      res.status(400).json({
        error: 'Please provide a location in the request body.',
      });
    }
    const result: any = await promptFunc(location);
    res.json({ result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
