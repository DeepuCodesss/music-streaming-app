const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

let allSongs = [];
let filteredSongs = [];

let currentSongFile = null;
let currentLi = null;

// infinite scroll state
let visibleCount = 20;
const LOAD_SIZE = 20;
let isLoading = false;

// fetch songs
fetch("/songs-list")
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    filteredSongs = songs;
    renderSongs();
  });

// render songs up to visibleCount
function renderSongs() {
  songsList.innerHTML = "";

  const songsToShow = filteredSongs.slice(0, visibleCount);

  songsToShow.forEach(song => {
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

// infinite scroll listener
window.addEventListener("scroll", () => {
  if (isLoading) return;

  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200;

  if (nearBottom && visibleCount < filteredSongs.length) {
    isLoading = true;

    // simulate smooth loading
    setTimeout(() => {
      visibleCount += LOAD_SIZE;
      renderSongs();
      isLoading = false;
    }, 300);
  }
});

// search logic (resets infinite scroll)
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );

  visibleCount = 20;
  renderSongs();
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
