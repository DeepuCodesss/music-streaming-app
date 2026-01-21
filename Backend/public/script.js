const audio = document.getElementById("audio");
const songsList = document.getElementById("songs");
const searchInput = document.getElementById("search");

let allSongs = [];
let filteredSongs = [];

let currentSongFile = null;
let currentLi = null;

// pagination state
let currentPage = 1;
const PAGE_SIZE = 20;

// fetch songs
fetch("/songs-list")
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    filteredSongs = songs;
    renderPage();
    renderPaginationControls();
  });

// render only ONE PAGE
function renderPage() {
  songsList.innerHTML = "";

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageSongs = filteredSongs.slice(start, end);

  pageSongs.forEach(song => {
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

// pagination buttons
function renderPaginationControls() {
  let controls = document.getElementById("pagination");

  if (!controls) {
    controls = document.createElement("div");
    controls.id = "pagination";
    controls.style.marginTop = "20px";
    controls.style.display = "flex";
    controls.style.gap = "10px";
    songsList.after(controls);
  }

  controls.innerHTML = "";

  const totalPages = Math.ceil(filteredSongs.length / PAGE_SIZE);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "⬅ Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderPage();
    renderPaginationControls();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next ➡";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderPage();
    renderPaginationControls();
  };

  const pageInfo = document.createElement("span");
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  pageInfo.style.alignSelf = "center";

  controls.appendChild(prevBtn);
  controls.appendChild(pageInfo);
  controls.appendChild(nextBtn);
}

// search logic (works with pagination)
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );

  currentPage = 1;
  renderPage();
  renderPaginationControls();
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
