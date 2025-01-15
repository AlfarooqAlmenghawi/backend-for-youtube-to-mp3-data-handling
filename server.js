const express = require("express");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const youtubedl = require("youtube-dl-exec");

app.post("/convert", async (req, res) => {
  const { url } = req.body;

  try {
    const outputPath = `${Date.now()}.mp3`;

    // Download and convert the audio
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: outputPath,
    });

    res.download(outputPath, (err) => {
      if (!err) {
        fs.unlinkSync(outputPath); // Clean up file after download
      }
    });
  } catch (err) {
    console.error("Error downloading video:", err.message);
    res
      .status(500)
      .json({ error: "Failed to process video", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
