const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

// enable CORS
app.use(cors());

// serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// serve song files
app.use("/songs", express.static(path.join(__dirname, "songs")));


app.get("/songs-list", (req, res) => {
  const songsDir = path.join(__dirname, "songs");

  fs.readdir(songsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read songs folder" });
    }

    const songs = files
      .filter(file => file.endsWith(".mp3"))
      .map((file, index) => ({
        id: index + 1,
        title: file.replace(".mp3", ""),
        file: file
      }));

    res.json(songs);
  });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
