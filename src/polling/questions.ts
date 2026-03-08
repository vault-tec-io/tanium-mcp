import { getQuestionResultInfo, getQuestionResultData } from '../rest/platform.js';
import config from '../config.js';

export interface QuestionPollResult {
  resultData: unknown;
  respondedPercentage: number;
  respondedTotal: number;
  expectedTotal: number;
  timedOut: boolean;
}

interface ResultInfo {
  mr_passed: number;
  mr_tested: number;
  estimated_total: number;
}

export async function pollQuestionResults(
  questionId: string,
  timeoutMs = config.pollTimeoutMs,
  intervalMs = config.pollIntervalMs,
  threshold = 95
): Promise<QuestionPollResult> {
  const deadline = Date.now() + timeoutMs;
  let lastPercentage = -1;
  let sameCount = 0;

  while (true) {
    const info = await getQuestionResultInfo(questionId) as { data: { result_info: { question: ResultInfo } } };
    const qi = info?.data?.result_info?.question;

    const passed = qi?.mr_passed ?? 0;
    const tested = qi?.mr_tested ?? 0;
    const estimated = qi?.estimated_total ?? 0;

    const percentage = estimated > 0 ? Math.round((passed / estimated) * 100) : 0;

    const done =
      percentage >= threshold ||
      (percentage === lastPercentage && ++sameCount >= 2);

    if (done) {
      const resultData = await getQuestionResultData(questionId);
      return {
        resultData,
        respondedPercentage: percentage,
        respondedTotal: passed,
        expectedTotal: estimated,
        timedOut: false,
      };
    }

    if (percentage !== lastPercentage) {
      sameCount = 0;
      lastPercentage = percentage;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      const resultData = await getQuestionResultData(questionId);
      return {
        resultData,
        respondedPercentage: percentage,
        respondedTotal: passed,
        expectedTotal: estimated,
        timedOut: true,
      };
    }

    await sleep(Math.min(intervalMs, remaining));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
