"use client";

import { useState } from "react";
import { FileText, Loader2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    if (
      !(
        videoUrl.includes("youtube.com/watch?v=") ||
        videoUrl.includes("youtu.be/")
      )
    ) {
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
        console.log(data);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Youtube className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
              YouTube Summarizer
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Paste a YouTube video URL and get an AI-generated summary of the
            content in seconds
          </p>
        </div>

        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">
              Enter YouTube URL
            </CardTitle>
            <CardDescription className="text-gray-400">
              Paste the full URL of any YouTube video you want to summarize
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-red-500"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Summarize"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-red-500 animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-12 w-12 text-orange-500 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-400 mt-6 text-lg animate-pulse">
              Generating summary...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This may take a moment depending on video length
            </p>
          </div>
        )}

        {error && (
          <Alert className="border-red-900/50 bg-red-900/10 text-red-400 mb-8">
            <AlertDescription className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {summary && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5 text-orange-500" />
                Summary
              </h2>
              <div className="h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full"></div>
            </div>

            <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {summary.replaceAll("*", "")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
