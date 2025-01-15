const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ENV variable for cookies.
const cookies = process.env.YOUTUBE_COOKIES;

app.post("/convert", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    const cookiesContent = process.env.YOUTUBE_COOKIES;
    const cookiesPath = `./temp_cookies_${Date.now()}.txt`; // Unique temporary file
    fs.writeFileSync(cookiesPath, cookiesContent);

    const outputPath = `./temp_audio_${Date.now()}.mp3`;

    // Download and convert the audio
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: outputPath,
      cookies: cookiesPath,
    });

    res.download(outputPath, (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
    });
  } catch (err) {
    console.error("Error downloading video:", err.message);

    // Clean up cookies file on error
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);

    res
      .status(500)
      .json({ error: "Failed to process video", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
