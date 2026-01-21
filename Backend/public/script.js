// ---------- TAB NAV ----------
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

// ---------- MUSIC LOGIC ----------
const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");
const playlistSelect = document.getElementById("playlistSelect");

let allSongs = [];
let filteredSongs = [];
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};
let activePlaylist = null;

let currentSongFile = null;
let currentLi = null;
let visibleCount = 20;

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

  filteredSongs.slice(0, visibleCount).forEach((song, i) => {
    const li = document.createElement("li");
    li.textContent = "▶ " + song.title;

    const btn = document.createElement("button");
    btn.textContent = activePlaylist ? "❌" : "+";
    btn.onclick = e => {
      e.stopPropagation();
      activePlaylist ? removeSong(i) : addToPlaylist(song);
    };

    li.appendChild(btn);
    li.onclick = () => playSong(song, li);
    songsList.appendChild(li);
  });
}

// ---------- PLAY / PAUSE / STOP LOGIC ----------
function playSong(song, li) {
  // SAME SONG → TOGGLE PLAY / PAUSE
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

  // DIFFERENT SONG → STOP OLD
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
}

// ---------- SEARCH ----------
searchInput.oninput = () => {
  activePlaylist = null;
  filteredSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(searchInput.value.toLowerCase())
  );
  visibleCount = 20;
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

// ---------- AUTO PLAY NEXT SONG ----------
audio.addEventListener("ended", () => {
  if (!currentLi) return;

  const nextLi = currentLi.nextElementSibling;
  if (nextLi) {
    nextLi.click(); // autoplay next
  } else {
    currentSongFile = null;
    currentLi = null;
  }
});

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

function removeSong(i) {
  playlists[activePlaylist].splice(i, 1);
  save();
  filteredSongs = playlists[activePlaylist];
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
      visibleCount = playlists[name].length;
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
