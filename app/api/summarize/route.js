import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { videoUrl } = await req.json();

  let transcriptData;
  try {
    const response = await fetch(
      `http://localhost:8080/api/transcript?url=${encodeURIComponent(videoUrl)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcript from external API.");
    }

    const data = await response.json();

    if (!data.transcript || !Array.isArray(data.transcript)) {
      throw new Error("Invalid transcript format received.");
    }

    transcriptData = data.transcript;
  } catch (error) {
    console.error("Error fetching transcript:", error.message);
    return NextResponse.json(
      {
        error:
          "Error fetching transcript. Please make sure the video has subtitles and the link is correct.",
      },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  let text = "";
  for (let i = 0; i < transcriptData.length; i++) {
    text += `Timestamp: ${transcriptData[i].offset}, Text: ${transcriptData[i].text}\n`;
  }

  console.log(text);

  const prompt = `
You are a skilled summarizer. Your task is to create a clear, concise, and well-organized summary of the following YouTube video transcript.

Please follow this structured format for the summary:

1. **Introduction**
  a. Briefly introduce the main topic of the video.
  b. Mention the speaker (if relevant) and the context of the discussion.

2. **Main Points / Key Topics**
  a. Use numbered headings for each key topic or section covered in the video.
  b. For each heading, provide subpoints starting with lowercase letters (a., b., c., etc.).
  c. Place headings and subpoints on separate lines, with subpoints slightly indented.
  d. Keep the language easy to understand with short, informative sentences.

3. **Conclusion / Takeaways**
  a. Summarize the final thoughts, conclusions, or recommendations made in the video.
  b. Mention any calls to action or final messages shared by the speaker.

Example format:
1. Introduction  
  a. This video explores the causes and effects of urban air pollution in India.  
  b. Hosted by an environmental researcher sharing recent findings.

2. Health Impact of Air Pollution  
  a. Airborne particles like PM2.5 deeply affect lung health.  
  b. Children and elderly are most at risk.

3. Conclusion  
  a. The speaker urges government intervention and public awareness.  
  b. Long-term action is critical to mitigate effects.

Here is the transcript:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    console.log(response.text);
    return NextResponse.json({ summary: response.text });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      {
        error: "Error generating summary. Please try again.",
      },
      { status: 400 }
    );
  }
}
