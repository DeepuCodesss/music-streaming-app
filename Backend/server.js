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

// 🎵 AUTO-LOAD + SORT SONGS
app.get("/songs-list", (req, res) => {
  const songsDir = path.join(__dirname, "songs");

  fs.readdir(songsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read songs folder" });
    }

    const songs = files
      .filter(file => file.toLowerCase().endsWith(".mp3"))
      .map(file => ({
        title: file.replace(".mp3", ""),
        file: file
      }))
      // 🔤 SORT ALPHABETICALLY (CASE-INSENSITIVE)
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
      // 🔢 ADD IDS AFTER SORTING
      .map((song, index) => ({
        id: index + 1,
        ...song
      }));

    res.json(songs);
  });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
