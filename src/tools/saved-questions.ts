import { z } from 'zod';
import { getSavedQuestions, getSavedQuestionResults } from '../rest/platform.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const ListSavedQuestionsInput = z.object({
  count: z.number().int().optional().describe('Number to return'),
  start: z.number().int().optional().describe('Offset start'),
});

export const GetSavedQuestionResultsInput = z.object({
  saved_question_id: z.string().describe('Saved question ID'),
});

export async function listSavedQuestions(
  input: z.infer<typeof ListSavedQuestionsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const questions = await getSavedQuestions({ count: input.count, start: input.start });
    return { success: true, data: { savedQuestions: questions } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function getSavedQuestionResultsHandler(
  input: z.infer<typeof GetSavedQuestionResultsInput>
): Promise<ToolOutput<unknown>> {
  try {
    const results = await getSavedQuestionResults(input.saved_question_id);
    return { success: true, data: { results } };
  } catch (err) {
    return handleToolError(err);
  }
}
