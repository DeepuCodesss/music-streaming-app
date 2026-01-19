const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use("/songs", express.static(path.join(__dirname, "songs")));

const songs = [
  { id: 1, title: "Song One", file: "song1.mp3" },
  { id: 2, title: "Song Two", file: "song2.mp3" },
  { id: 3, title: "Song Three", file: "song3.mp3" }
];

app.get("/songs-list", (req, res) => {
  res.json(songs);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
