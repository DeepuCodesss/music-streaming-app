const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");

let allSongs = [];
let filteredSongs = [];

let currentSongFile = null;
let currentLi = null;

// infinite scroll
let visibleCount = 20;
const LOAD_SIZE = 20;
let isLoading = false;

// playlists (stored locally)
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};

// ---------------- FETCH SONGS ----------------
fetch("/songs-list")
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    filteredSongs = songs;
    renderSongs();
    renderPlaylists();
  });

// ---------------- RENDER SONGS ----------------
function renderSongs() {
  songsList.innerHTML = "";

  const songsToShow = filteredSongs.slice(0, visibleCount);

  songsToShow.forEach(song => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    // add to playlist button
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.style.marginLeft = "10px";
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addSongToPlaylist(song);
    };

    li.appendChild(addBtn);

    li.onclick = () => playSong(song, li);

    songsList.appendChild(li);
  });
}

// ---------------- PLAY SONG ----------------
function playSong(song, li) {
  if (currentSongFile === song.file) {
    if (audio.paused) {
      audio.play();
      li.firstChild.textContent = "⏸ " + song.title;
    } else {
      audio.pause();
      li.firstChild.textContent = "▶ " + song.title;
    }
    return;
  }

  if (currentLi) {
    currentLi.classList.remove("active");
    currentLi.firstChild.textContent =
      "▶ " + currentLi.firstChild.textContent.replace("▶ ", "").replace("⏸ ", "");
  }

  currentSongFile = song.file;
  currentLi = li;

  li.classList.add("active");
  li.firstChild.textContent = "⏸ " + song.title;

  audio.src = `/songs/${song.file}`;
  audio.play();
}

// ---------------- INFINITE SCROLL ----------------
window.addEventListener("scroll", () => {
  if (isLoading) return;

  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

  if (nearBottom && visibleCount < filteredSongs.length) {
    isLoading = true;
    setTimeout(() => {
      visibleCount += LOAD_SIZE;
      renderSongs();
      isLoading = false;
    }, 300);
  }
});

// ---------------- SEARCH ----------------
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );
  visibleCount = 20;
  renderSongs();
});

// ---------------- PLAYLIST LOGIC ----------------
createPlaylistBtn.onclick = () => {
  const name = playlistInput.value.trim();
  if (!name || playlists[name]) return;

  playlists[name] = [];
  savePlaylists();
  playlistInput.value = "";
  renderPlaylists();
};

function addSongToPlaylist(song) {
  const name = prompt("Add to which playlist?");
  if (!name || !playlists[name]) return;

  playlists[name].push(song);
  savePlaylists();
  alert(`Added to "${name}"`);
}

function renderPlaylists() {
  playlistsList.innerHTML = "";

  Object.keys(playlists).forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    li.style.cursor = "pointer";

    li.onclick = () => {
      filteredSongs = playlists[name];
      visibleCount = filteredSongs.length;
      renderSongs();
    };

    playlistsList.appendChild(li);
  });
}

function savePlaylists() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

// ---------------- AUDIO END ----------------
audio.addEventListener("ended", () => {
  if (currentLi) {
    currentLi.classList.remove("active");
    currentLi.firstChild.textContent =
      "▶ " + currentLi.firstChild.textContent.replace("⏸ ", "").replace("▶ ", "");
  }
  currentSongFile = null;
  currentLi = null;
});
