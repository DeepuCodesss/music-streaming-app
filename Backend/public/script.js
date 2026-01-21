const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");
const playlistSelect = document.getElementById("playlistSelect");

let allSongs = [];
let filteredSongs = [];

let currentSongFile = null;
let currentLi = null;

// infinite scroll
let visibleCount = 20;
const LOAD_SIZE = 20;
let isLoading = false;

// playlists (localStorage)
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};
let activePlaylist = null;

// ---------------- FETCH SONGS ----------------
fetch("/songs-list")
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    filteredSongs = songs;
    renderSongs();
    renderPlaylists();
    renderPlaylistDropdown();
  });

// ---------------- RENDER SONGS ----------------
function renderSongs() {
  songsList.innerHTML = "";

  filteredSongs.slice(0, visibleCount).forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    const btn = document.createElement("button");

    if (activePlaylist) {
      btn.textContent = "❌";
      btn.onclick = (e) => {
        e.stopPropagation();
        removeSongFromPlaylist(index);
      };
    } else {
      btn.textContent = "+";
      btn.onclick = (e) => {
        e.stopPropagation();
        addSongToSelectedPlaylist(song);
      };
    }

    li.appendChild(btn);
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
  if (isLoading || activePlaylist) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    if (visibleCount < filteredSongs.length) {
      isLoading = true;
      setTimeout(() => {
        visibleCount += LOAD_SIZE;
        renderSongs();
        isLoading = false;
      }, 300);
    }
  }
});

// ---------------- SEARCH ----------------
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  activePlaylist = null;
  filteredSongs = allSongs.filter(s => s.title.toLowerCase().includes(q));
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
  renderPlaylistDropdown();
};

function addSongToSelectedPlaylist(song) {
  const name = playlistSelect.value;
  if (!name) {
    alert("Select a playlist first");
    return;
  }
  playlists[name].push(song);
  savePlaylists();
}

function removeSongFromPlaylist(index) {
  playlists[activePlaylist].splice(index, 1);
  savePlaylists();
  filteredSongs = playlists[activePlaylist];
  visibleCount = filteredSongs.length;
  renderSongs();
}

// 🗑 DELETE ENTIRE PLAYLIST
function deletePlaylist(name) {
  if (!confirm(`Delete playlist "${name}"?`)) return;

  delete playlists[name];
  savePlaylists();

  if (activePlaylist === name) {
    activePlaylist = null;
    filteredSongs = allSongs;
    visibleCount = 20;
    renderSongs();
  }

  renderPlaylists();
  renderPlaylistDropdown();
}

function renderPlaylists() {
  playlistsList.innerHTML = "";

  Object.keys(playlists).forEach(name => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const span = document.createElement("span");
    span.textContent = name;
    span.style.cursor = "pointer";
    span.onclick = () => {
      activePlaylist = name;
      filteredSongs = playlists[name];
      visibleCount = filteredSongs.length;
      renderSongs();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deletePlaylist(name);
    };

    li.appendChild(span);
    li.appendChild(delBtn);
    playlistsList.appendChild(li);
  });
}

function renderPlaylistDropdown() {
  playlistSelect.innerHTML = `<option value="">Select playlist</option>`;
  Object.keys(playlists).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    playlistSelect.appendChild(opt);
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
