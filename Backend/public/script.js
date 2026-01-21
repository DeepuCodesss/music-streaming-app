// ---------- TAB NAV ----------
const miniTitle = document.getElementById("miniTitle");
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    const id =
      tab.dataset.tab === "playlists" ? "playlistsTab" : tab.dataset.tab;
    document.getElementById(id).classList.add("active");
  };
});

// ---------- ELEMENTS ----------
const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");
const playlistSelect = document.getElementById("playlistSelect");

// controls
const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

// ---------- STATE ----------
let allSongs = [];
let filteredSongs = [];
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};
let activePlaylist = null;

let currentSongFile = null;
let currentLi = null;
let currentIndex = -1;

let visibleCount = 20;

// shuffle / repeat
let isShuffle = false;
// 0 = off, 1 = repeat all, 2 = repeat one
let repeatMode = 0;

// ---------- FETCH SONGS ----------
fetch("/songs-list")
  .then(res => res.json())
  .then(data => {
    allSongs = data;
    filteredSongs = data;
    renderSongs();
    renderPlaylists();
    renderDropdown();
  });

// ---------- RENDER SONGS ----------
function renderSongs() {
  songsList.innerHTML = "";

  filteredSongs.slice(0, visibleCount).forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    const btn = document.createElement("button");
    btn.textContent = activePlaylist ? "❌" : "+";
    btn.onclick = e => {
      e.stopPropagation();
      activePlaylist ? removeSong(index) : addToPlaylist(song);
    };

    li.appendChild(btn);
    li.onclick = () => playSong(song, li, index);
    songsList.appendChild(li);
  });
}

// ---------- PLAY SONG ----------
function playSong(song, li, index) {
  currentIndex = index;

  // SAME SONG → TOGGLE
  if (currentSongFile === song.file) {
    if (audio.paused) {
      audio.play();
      li.classList.add("active");
      li.firstChild.textContent = "⏸ " + song.title;
    } else {
      audio.pause();
      li.classList.remove("active");
      li.firstChild.textContent = "▶ " + song.title;
    }
    return;
  }

  // STOP PREVIOUS
  if (currentLi) {
    currentLi.classList.remove("active");
    currentLi.firstChild.textContent =
      "▶ " +
      currentLi.firstChild.textContent.replace("▶ ", "").replace("⏸ ", "");
  }

  currentSongFile = song.file;
  currentLi = li;

  audio.src = `/songs/${song.file}`;
  audio.currentTime = 0;
  audio.play();

  li.classList.add("active");
  li.firstChild.textContent = "⏸ " + song.title;

  // ✅ UPDATE MINI PLAYER TITLE
  if (miniTitle) miniTitle.textContent = song.title;
}

// ---------- SEARCH ----------
searchInput.oninput = () => {
  activePlaylist = null;
  filteredSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(searchInput.value.toLowerCase())
  );
  visibleCount = 20;
  currentIndex = -1;
  renderSongs();
};

// ---------- INFINITE SCROLL ----------
window.addEventListener("scroll", () => {
  if (activePlaylist) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    visibleCount += 20;
    renderSongs();
  }
});

// ---------- AUTOPLAY / SHUFFLE / REPEAT ----------
audio.addEventListener("ended", () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  playNext();
});

function playNext() {
  if (!filteredSongs.length) return;

  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * filteredSongs.length);
  } else {
    currentIndex++;
  }

  if (currentIndex < filteredSongs.length) {
    const li = songsList.children[currentIndex];
    if (li) li.click();
  } else if (repeatMode === 1) {
    currentIndex = 0;
    const li = songsList.children[0];
    if (li) li.click();
  }
}

function playPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    const li = songsList.children[currentIndex];
    if (li) li.click();
  }
}

// ---------- CONTROLS ----------
playPauseBtn.onclick = () => {
  if (!currentLi) return;

  if (audio.paused) {
    audio.play();
    currentLi.firstChild.textContent =
      "⏸ " + currentLi.firstChild.textContent.replace("▶ ", "");
  } else {
    audio.pause();
    currentLi.firstChild.textContent =
      "▶ " + currentLi.firstChild.textContent.replace("⏸ ", "");
  }
};

nextBtn.onclick = playNext;
prevBtn.onclick = playPrev;

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
};

repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;

  if (repeatMode === 0) repeatBtn.textContent = "🔁";
  if (repeatMode === 1) repeatBtn.textContent = "🔁 All";
  if (repeatMode === 2) repeatBtn.textContent = "🔂 One";

  repeatBtn.classList.toggle("active", repeatMode !== 0);
};

// ---------- PLAYLISTS ----------
createPlaylistBtn.onclick = () => {
  const name = playlistInput.value.trim();
  if (!name || playlists[name]) return;

  playlists[name] = [];
  save();
  playlistInput.value = "";
  renderPlaylists();
  renderDropdown();
};

function addToPlaylist(song) {
  const name = playlistSelect.value;
  if (!name) return alert("Select playlist");
  playlists[name].push(song);
  save();
}

function removeSong(index) {
  playlists[activePlaylist].splice(index, 1);
  save();
  filteredSongs = playlists[activePlaylist];
  visibleCount = filteredSongs.length;
  currentIndex = -1;
  renderSongs();
}

function renderPlaylists() {
  playlistsList.innerHTML = "";

  Object.keys(playlists).forEach(name => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = name;
    span.onclick = () => {
      activePlaylist = name;
      filteredSongs = playlists[name];
      visibleCount = filteredSongs.length;
      currentIndex = -1;
      renderSongs();
    };

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = () => {
      if (confirm("Delete playlist?")) {
        delete playlists[name];
        activePlaylist = null;
        filteredSongs = allSongs;
        save();
        renderPlaylists();
        renderDropdown();
        renderSongs();
      }
    };

    li.append(span, del);
    playlistsList.appendChild(li);
  });
}

function renderDropdown() {
  playlistSelect.innerHTML = `<option value="">Select playlist</option>`;
  Object.keys(playlists).forEach(p => {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = p;
    playlistSelect.appendChild(o);
  });
}

function save() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
