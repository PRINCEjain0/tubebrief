"use client";
import { useState } from "react";
import { LoaderCircle, FileText } from "lucide-react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSummary("");
    if (!videoUrl) {
      setError("Please enter a YouTube video URL");
      setLoading(false);
      return;
    }
    if (!videoUrl.includes("youtube.com/watch?v=")) {
      setError("Please enter a valid YouTube video URL");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setSummary(data.summary);
      setLoading(false);
    } catch (error) {
      setError("An error occurred while fetching the summary");
      setLoading(false);
      console.error("Error fetching summary:", error);
    }
  };
  return (
    <div className="flex flex-col items-center  bg-[#121212] h-screen">
      <h1 className="text-white font-extrabold text-3xl mt-8">
        YouTube Video Summarizer
      </h1>
      <p className="text-gray-400 mt-4">
        Paste a YouTube video URL and get an AI-generated summary of the content
      </p>
      <div className="h-40 w-6xl flex flex-col items-start mt-8 border border-white rounded-lg p-4">
        <p className="text-2xl text-white ">Enter YouTube URL</p>
        <p className="mt-1 text-gray-400">
          Paste the full URL of any YouTube video you want to summarize
        </p>
        <div className="w-full flex gap-3 mt-4 ">
          <input
            className="w-4/5 h-12 text-white border-1 focus:border-4 focus:border-gray-600 rounded-lg pl-2 "
            placeholder="https://www.youtube.com/watch?v=..."
            type="text"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
            }}
          ></input>
          <button
            className="bg-white p-2 text-black rounded-xl h-12 w-1/5 hover:bg-gray-200"
            onClick={handleSubmit}
          >
            Summarize
          </button>
        </div>
      </div>
      {loading && (
        <div className="flex flex-col items-center mt-4">
          <LoaderCircle className="animate-spin h-16 w-16" />
          <p className="text-gray-400 mt-2">Generating summary...</p>
        </div>
      )}
      {error && (
        <div className="text-red-500 mt-4">
          <p>{error}</p>
        </div>
      )}
      {summary && (
        <>
          <p className="text-md text-white flex justify-center border-2 border-gray-600 w-6xl rounded-xl mt-8 p-2">
            <FileText className="mr-2" />
            Summary
          </p>
          <div className="w-6xl  mt-8 border border-white rounded-lg p-4">
            <p className="mt-2 text-gray-400">{summary}</p>
          </div>
        </>
      )}
    </div>
  );
}
