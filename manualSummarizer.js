import OpenAI from "openai";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { OPENAI_API_KEY } = process.env;

const DISCORD_WEBHOOK_URL =
  "PAST DISCORD WEBHOOK HERE";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function getVideoSummary(text) {
  const messages = [
    {
      role: "system",
      content: `I will provide you with a transcript from a video made by a crypto influencer. 
      Your task are: 1) Identify Only Recommended Tokens. Extract all crypto tokens, coins, or projects that the influencer explicitly recommends or promotes as valuable or worth investing in. Ignore any tokens that are mentioned casually, in passing, or without a clear endorsement. 
      2) List of Tokens: Create a list of the recommended tokens using the format: $TICKER (Full Token/Project Name). Ensure that the ticker symbols and full names are accurate, use cross references if needed. 
      3) Summarize Endorsements: For each token in the list, provide a brief summary focusing on What the influencer says about it and any reasons or endorsements given for why it's valuable or worth investing in. Exclude any irrelevant information or general mentions. 
      If the speaker seems indecisive about a token, don't add it to the first list but add it to the Summarized part.`,
    },
    { role: "user", content: text },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-05-13",
      messages,
    });
    return { success: true, data: response.choices[0].message.content };
  } catch (error) {
    console.error("Error generating summary:", error);
    return { success: false, error };
  }
}

async function sendToDiscord(summary) {
  const summaryParts = summary.split(/\r?\n\r?\n/);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const part of summaryParts) {
    const content = `${part.trim()}\n\n`;
    await axios.post(DISCORD_WEBHOOK_URL, { content });
    await delay(2000);
  }
  await axios.post(DISCORD_WEBHOOK_URL, {
    content: "----------------------------",
  });
}

(async () => {
  const text = `
  PASTE TRANSCRIPT HERE
  `;

  const { success, data: summary } = await getVideoSummary(text);

  if (!success) {
    console.error("Failed to generate summary.");
    return;
  }

  console.log("Summary generated successfully.");
  await sendToDiscord(summary);
  console.log("Summary sent to Discord.");
})();
