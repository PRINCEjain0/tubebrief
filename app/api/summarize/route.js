import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { Innertube } from "youtubei.js/web";

export async function POST(req) {
  const { videoUrl } = await req.json();

  let transcriptData;
  try {
    let videoId = videoUrl;
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      try {
        if (videoUrl.includes("youtube.com/watch?v=")) {
          videoId = new URL(videoUrl).searchParams.get("v");
        } else if (videoUrl.includes("youtu.be/")) {
          videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
        }
      } catch (e) {
        console.log("URL parsing failed, using original input");
      }
    }

    console.log(`Attempting to fetch video with ID/URL: ${videoId}`);

    const youtube = await Innertube.create({
      lang: "en",
      location: "US",
      retrieve_player: true,
      generate_session_locally: true,
      client: {
        hl: "en",
        gl: "US",
      },
    });

    const info = await youtube.getInfo(videoId);

    let captionsAvailable = false;
    if (
      info.captions &&
      info.captions.captionTracks &&
      info.captions.captionTracks.length > 0
    ) {
      captionsAvailable = true;
      console.log("Captions are available via caption tracks");
    }

    if (!captionsAvailable) {
      try {
        const transcript = await youtube.getTranscript(videoId);
        if (transcript) {
          transcriptData = transcript.map((item) => ({
            text: item.text,
            offset: item.start * 1000,
          }));
          console.log("Retrieved transcript using direct method");
        }
      } catch (directError) {
        console.log("Direct transcript method failed:", directError.message);
      }
    }

    if (!transcriptData) {
      try {
        const transcript = await info.getTranscript();
        transcriptData =
          transcript.transcript.content.body.initial_segments.map(
            (segment) => ({
              text: segment.snippet.text,
              offset: segment.snippet.start_time_ms,
            })
          );
        console.log("Retrieved transcript using info.getTranscript()");
      } catch (transcriptError) {
        console.error(
          "Standard transcript retrieval failed:",
          transcriptError.message
        );
      }
    }

    if (!transcriptData || transcriptData.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract transcript data from this video. The video may not have captions enabled.",
        },
        { status: 404 }
      );
    }

    console.log(
      `Successfully retrieved ${transcriptData.length} transcript segments`
    );
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      {
        error: "Error fetching transcript: " + error.message,
        details:
          "The API may be temporarily unavailable or the video might not be accessible",
      },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  let text = "";
  for (let i = 0; i < transcriptData.length; i++) {
    text += `Timestamp: ${transcriptData[i].offset}, Text: ${transcriptData[i].text}\n`;
  }

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

Here is the transcript:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Error generating summary. Please try again." },
      { status: 400 }
    );
  }
}
