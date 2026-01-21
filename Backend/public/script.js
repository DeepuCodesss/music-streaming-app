/*************************************************
 * TAB NAV
 *************************************************/
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
    document.getElementById(id)?.classList.add("active");
  };
});

/*************************************************
 * ELEMENTS
 *************************************************/
const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");
const volumeSlider = document.getElementById("volumeSlider");

const playlistInput = document.getElementById("playlistName");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistsList = document.getElementById("playlists");
const playlistSelect = document.getElementById("playlistSelect");

const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const youtubeResults = document.getElementById("youtubeResults");

/*************************************************
 * YOUTUBE API
 *************************************************/
const YT_API_KEY = "AIzaSyD_Ua_hr7Gam0p2pU62cGyWfAyosWlge-c";

/*************************************************
 * STATE
 *************************************************/
let allSongs = [];
let filteredSongs = [];
let playlists = JSON.parse(localStorage.getItem("playlists")) || {};
let activePlaylist = null;

let currentSongFile = null;
let currentLi = null;
let currentIndex = -1;

let visibleCount = 20;
let isShuffle = false;
let repeatMode = 0; // 0 off | 1 repeat all | 2 repeat one

/*************************************************
 * FETCH LOCAL SONGS
 *************************************************/
fetch("/songs-list")
  .then(res => res.json())
  .then(data => {
    allSongs = data;
    filteredSongs = data;
    renderSongs();
    renderPlaylists();
    renderDropdown();
  });

/*************************************************
 * RENDER SONGS
 *************************************************/
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

/*************************************************
 * VOLUME
 *************************************************/
audio.volume = 0.7;
if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
  });
}

/*************************************************
 * PLAY SONG
 *************************************************/
function playSong(song, li, index) {
  currentIndex = index;

  if (currentSongFile === song.file) {
    audio.paused ? audio.play() : audio.pause();
    li.firstChild.textContent = audio.paused
      ? "▶ " + song.title
      : "⏸ " + song.title;
    return;
  }

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

  if (miniTitle) miniTitle.textContent = song.title;
}

/*************************************************
 * SEARCH (LOCAL + YOUTUBE)
 *************************************************/
let ytTimer = null;

searchInput.oninput = () => {
  const q = searchInput.value.trim().toLowerCase();

  activePlaylist = null;
  filteredSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(q)
  );

  visibleCount = 20;
  currentIndex = -1;
  renderSongs();

  clearTimeout(ytTimer);
  ytTimer = setTimeout(() => searchYouTube(q), 400);
};

/*************************************************
 * INFINITE SCROLL
 *************************************************/
window.addEventListener("scroll", () => {
  if (activePlaylist) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    visibleCount += 20;
    renderSongs();
  }
});

/*************************************************
 * AUTOPLAY / SHUFFLE / REPEAT
 *************************************************/
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

  currentIndex = isShuffle
    ? Math.floor(Math.random() * filteredSongs.length)
    : currentIndex + 1;

  if (currentIndex >= filteredSongs.length) {
    if (repeatMode === 1) currentIndex = 0;
    else return;
  }

  songsList.children[currentIndex]?.click();
}

function playPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    songsList.children[currentIndex]?.click();
  }
}

/*************************************************
 * CONTROLS
 *************************************************/
playPauseBtn.onclick = () => {
  if (!currentLi) return;
  audio.paused ? audio.play() : audio.pause();
};

nextBtn.onclick = playNext;
prevBtn.onclick = playPrev;

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
};

repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.textContent =
    repeatMode === 0 ? "🔁" : repeatMode === 1 ? "🔁 All" : "🔂 One";
};

/*************************************************
 * PLAYLISTS
 *************************************************/
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

/*************************************************
 * YOUTUBE SEARCH (LEGAL)
 *************************************************/
async function searchYouTube(query) {
  if (!query || !youtubeResults) {
    if (youtubeResults) youtubeResults.innerHTML = "";
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
    query
  )}&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    youtubeResults.innerHTML = "";

    data.items?.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${item.snippet.title}</strong><br>
        <small>${item.snippet.channelTitle}</small>
      `;
      li.onclick = () =>
        window.open(
          "https://www.youtube.com/watch?v=" + item.id.videoId,
          "_blank"
        );
      youtubeResults.appendChild(li);
    });
  } catch (e) {
    console.error("YouTube error", e);
  }
}
