// 전시 사이트 동작 코드 — 학생 정보는 students.json 에서만 수정하세요.
const ORG = "ongo-gamedev2026";

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
let students = [];
let filter = "all";

function urlsFor(s) {
  const pages = `https://${ORG}.github.io/${s.repo}/`;
  const repo = `https://github.com/${ORG}/${s.repo}`;
  return {
    play: pages,
    thumb: pages + "thumbnail.png",
    devlog: `${repo}/tree/main/devlog`,
    plan: `${repo}/blob/main/docs/기획서.md`,
    repo
  };
}

function esc(t = "") {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function card(s) {
  const u = urlsFor(s);
  const done = s.status === "done";
  const week = Math.max(0, Math.min(6, Number(s.week) || 0));
  const bars = Array.from({ length: 6 }, (_, i) => `<i class="${i < week ? "fill" : ""}"></i>`).join("");
  return `
  <article class="card">
    <div class="thumb">
      <span class="ph">${esc(s.emoji || "🎮")}</span>
      <img src="${u.thumb}" alt="${esc(s.title)} 게임 화면" loading="lazy" onerror="this.remove()">
      <span class="badge ${done ? "done" : "wip"}">${done ? "완성" : "개발 중"}</span>
    </div>
    <div class="body">
      <h2 class="title">${esc(s.title || "제목 미정")}</h2>
      <p class="maker">by ${esc(s.name)}${s.genre ? ` · <span class="genre">${esc(s.genre)}</span>` : ""}</p>
      <p class="desc">${esc(s.description || "")}</p>
      <div class="progress">${bars}<span>${week}/6주</span></div>
      <div class="actions">
        <a class="btn play ${s.playable === false ? "disabled" : ""}" href="${u.play}" target="_blank" rel="noopener">▶ 플레이</a>
        <a class="btn" href="${u.devlog}" target="_blank" rel="noopener">개발일지</a>
        <a class="btn" href="${u.plan}" target="_blank" rel="noopener">기획서</a>
        <button class="btn" data-qr="${esc(s.repo)}">QR</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const list = students.filter(s =>
    filter === "all" ? true : filter === "done" ? s.status === "done" : s.status !== "done");
  grid.innerHTML = list.map(card).join("");
  empty.hidden = list.length > 0;
  empty.textContent = "아직 이 칸에 올라온 게임이 없어요.";

  const doneCount = students.filter(s => s.status === "done").length;
  document.getElementById("stats").innerHTML = `
    <span class="stat">PLAYER <b>${students.length}</b></span>
    <span class="stat">CLEAR <b>${doneCount}</b></span>`;
}

document.getElementById("filters").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll("#filters button").forEach(x => x.classList.toggle("on", x === b));
  render();
});

// QR 코드
const dlg = document.getElementById("qrDialog");
const qrBox = document.getElementById("qrBox");
grid.addEventListener("click", e => {
  const b = e.target.closest("[data-qr]");
  if (!b) return;
  const s = students.find(x => x.repo === b.dataset.qr);
  const url = urlsFor(s).play;
  document.getElementById("qrTitle").textContent = s.title || s.name;
  document.getElementById("qrUrl").textContent = url;
  qrBox.innerHTML = "";
  if (window.QRCode) {
    new QRCode(qrBox, { text: url, width: 220, height: 220 });
  } else {
    // QR 라이브러리를 못 불러온 경우 대체 이미지 사용
    qrBox.innerHTML = `<img width="220" height="220" alt="QR 코드" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}">`;
  }
  dlg.dataset.name = s.repo;
  dlg.showModal();
});
document.getElementById("qrClose").onclick = () => dlg.close();
document.getElementById("qrSave").onclick = () => {
  const c = qrBox.querySelector("canvas");
  const img = qrBox.querySelector("img");
  const a = document.createElement("a");
  if (c) a.href = c.toDataURL("image/png");
  else if (img) { window.open(img.src, "_blank"); return; }
  else return;
  a.download = `${dlg.dataset.name}-qr.png`;
  a.click();
};

fetch("students.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => { students = data.students || []; render(); })
  .catch(() => {
    empty.hidden = false;
    empty.textContent = "students.json 을 불러오지 못했어요. GitHub Pages에 올린 뒤 확인해 주세요.";
  });
