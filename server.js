const express = require("express");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/convert", async (req, res) => {
  const { url } = req.body;

  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);
    const title = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize title
    const outputPath = path.resolve(__dirname, `${title}.mp3`);

    // Download and convert the audio
    const audioStream = ytdl(url, { filter: "audioonly" });

    ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .on("end", () => {
        res.download(outputPath, (err) => {
          if (!err) {
            fs.unlinkSync(outputPath); // Clean up the file after download
          }
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Failed to process audio" });
      })
      .save(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
