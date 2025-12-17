const grid = document.getElementById("grid");
const q = document.getElementById("q");

const modal = document.getElementById("modal");
const backdrop = document.getElementById("backdrop");
const closeBtn = document.getElementById("close");

const mainImg = document.getElementById("mainImg");
const thumbs = document.getElementById("thumbs");
const sareeTitle = document.getElementById("sareeTitle");
const countEl = document.getElementById("count");
const originalsBtn = document.getElementById("originals");

async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// Build items from originals-map.json + images folder naming convention.
async function buildItems(){
  const map = await loadJSON("originals-map.json");
  const ids = Object.keys(map).sort();

  // Convention: for each ID, we assume thumb.webp exists, and images are 1.webp,2.webp,... until missing.
  const items = [];
  for (const id of ids){
    const base = `images/${id}`;
    const images = [];

    // Try up to 20 photos per saree (adjust if you need more)
    for (let i=1; i<=20; i++){
      const url = `${base}/${i}.webp`;
      // We can’t “list” directories in pure GitHub Pages, so we probe by fetching HEAD.
      // If missing, we break.
      const ok = await fetch(url, { method: "HEAD" }).then(r => r.ok).catch(()=>false);
      if(!ok) break;
      images.push(url);
    }

    // If there are no numbered images, skip (prevents broken cards)
    if(images.length === 0) continue;

    items.push({
      id,
      thumb: `${base}/thumb.webp`,
      images,
      originals: map[id]
    });
  }
  return items;
}

function render(items){
  const term = q.value.trim().toUpperCase();
  const filtered = term ? items.filter(x => x.id.includes(term)) : items;

  grid.innerHTML = filtered.map(s => `
    <article class="card" data-id="${s.id}">
      <img src="${s.thumb}" alt="${s.id}">
      <div class="pad">
        <div class="id">${s.id}</div>
        <div class="meta">${s.images.length} photo(s)</div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".card").forEach(card=>{
    card.addEventListener("click", ()=> openModal(filtered.find(x=>x.id===card.dataset.id)));
  });
}

function openModal(s){
  if(!s) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  sareeTitle.textContent = `Saree ${s.id}`;
  countEl.textContent = `${s.images.length} photo(s)`;
  originalsBtn.href = s.originals || "#";

  // main image
  mainImg.src = s.images[0];

  // thumbnails (use the web images as thumbs inside modal; card uses thumb.webp)
  thumbs.innerHTML = s.images.map((src, i)=> `
    <img src="${src}" data-src="${src}" class="${i===0?"active":""}" alt="thumb">
  `).join("");

  thumbs.querySelectorAll("img").forEach(img=>{
    img.addEventListener("click", ()=>{
      thumbs.querySelectorAll("img").forEach(x=>x.classList.remove("active"));
      img.classList.add("active");
      mainImg.src = img.dataset.src;
    });
  });
}

function closeModal(){
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

(async function init(){
  const items = await buildItems();
  render(items);
  q.addEventListener("input", ()=> render(items));
  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e)=> { if(e.key==="Escape") closeModal(); });
})().catch(err=>{
  grid.innerHTML = `<p style="color:#ffb4b4">Error: ${err.message}</p>`;
});
