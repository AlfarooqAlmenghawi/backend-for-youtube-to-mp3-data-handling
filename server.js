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

app.post("/convert", async (req, res) => {
  const { url } = req.body;

  console.log("Received URL:", url);

  if (!ytdl.validateURL(url)) {
    console.error("Invalid YouTube URL");
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);
    console.log("Video Info Retrieved:", videoInfo.videoDetails.title);

    const title = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize title
    const outputPath = path.resolve(__dirname, `${title}.mp3`);

    // Download and convert the audio
    const audioStream = ytdl(url, { filter: "audioonly" });

    ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .on("start", () => {
        console.log("FFmpeg started processing the audio.");
      })
      .on("end", () => {
        console.log("FFmpeg finished processing the audio.");
        res.download(outputPath, (err) => {
          if (!err) {
            fs.unlinkSync(outputPath); // Clean up the file after download
            console.log("File successfully sent and cleaned up.");
          }
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg Error:", err);
        res.status(500).json({ error: "Failed to process audio" });
      })
      .save(outputPath);
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
