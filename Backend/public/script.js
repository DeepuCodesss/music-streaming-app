const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

let allSongs = [];
let currentSongFile = null;
let currentLi = null;

// fetch songs
fetch("/songs-list")
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    renderSongs(allSongs);
  });

// render songs
function renderSongs(songs) {
  songsList.innerHTML = "";

  songs.forEach(song => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    li.onclick = () => {
      // SAME SONG → TOGGLE PLAY / PAUSE
      if (currentSongFile === song.file) {
        if (audio.paused) {
          audio.play();
          li.textContent = "⏸ " + song.title;
        } else {
          audio.pause();
          li.textContent = "▶ " + song.title;
        }
        return;
      }

      // NEW SONG → SWITCH
      if (currentLi) {
        currentLi.classList.remove("active");
        currentLi.textContent =
          "▶ " + currentLi.textContent.replace("▶ ", "").replace("⏸ ", "");
      }

      currentSongFile = song.file;
      currentLi = li;

      li.classList.add("active");
      li.textContent = "⏸ " + song.title;

      audio.src = `/songs/${song.file}`;
      audio.play();
    };

    songsList.appendChild(li);
  });
}

// search logic
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filtered = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );

  renderSongs(filtered);
});

// reset UI when song ends
audio.addEventListener("ended", () => {
  if (currentLi) {
    currentLi.classList.remove("active");
    currentLi.textContent =
      "▶ " + currentLi.textContent.replace("⏸ ", "").replace("▶ ", "");
  }
  currentSongFile = null;
  currentLi = null;
});
