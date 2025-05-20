const API_BASE = "/api";

// Fuse 검색 관련 (생략 가능)
let allNotes = [], fuse;
async function loadDataForSearch() {
  const resp = await fetch(`${API_BASE}/categories`);
  const cats = await resp.json();
  allNotes = [];
  cats.forEach(cat => {
    (cat.midcategories || []).forEach(mid => {
      (mid.subcategories || []).forEach(sub => {
        const content = Object.values(sub.notes || {}).join(" ");
        allNotes.push({
          catId: cat.id,     catName: cat.name,
          midId: mid.id,     midName: mid.name,
          subId: sub.id,     subName: sub.name,
          content,
          path:   `?cat=${cat.id}&mid=${mid.id}&sub=${sub.id}`
        });
      });
    });
  });
}
function initFuse() {
  fuse = new Fuse(allNotes, {
    keys: [
      { name: "subName", weight: 0.7 },
      { name: "content", weight: 0.3 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2
  });
}
function bindSearch() {
  document
    .getElementById("searchInput")
    .addEventListener("input", e => {
      const q = e.target.value.trim();
      const container = document.getElementById("searchResults");
      container.innerHTML = "";
      if (q.length < 2) return;
      const results = fuse.search(q);
      if (!results.length) {
        container.innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
      }
      results.forEach(r => {
        const item = r.item;
        const el = document.createElement("div");
        el.className = "search-item";
        el.innerHTML = `
          <a href="/detail.html${item.path}">
            <strong>${item.catName} > ${item.midName} > ${item.subName}</strong><br>
            ${item.content.slice(0, 100)}...
          </a>`;
        container.appendChild(el);
      });
    });
}

// 열려있는 상태를 기억할 Set
const openCats = new Set();
const openMids = new Set();

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadDataForSearch();
  initFuse();
  bindSearch();
  bindCategoryActions();

  document.getElementById("addCatBtn").onclick = async () => {
    const inpt = document.getElementById("newCatName");
    const name = inpt.value.trim();
    if (!name) return alert("대분류 이름을 입력하세요.");
    const id = Date.now();
    await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, midcategories: [] })
    });
    inpt.value = "";
    openCats.add(id);
    bindCategoryActions();
  };
});

// 전체 카테고리 렌더링
async function bindCategoryActions() {
  const res = await fetch(`${API_BASE}/categories`);
  const cats = await res.json();
  const container = document.getElementById("categories");
  container.innerHTML = "";

  cats.forEach(cat => {
    // 카드
    const card = document.createElement("div");
    card.className = "category";

    // 헤더
    const header = document.createElement("div");
    header.className = "cat-header";
    const title = document.createElement("span");
    title.className = "cat-name";
    title.textContent = cat.name;
    header.appendChild(title);

    // 수정/삭제 버튼
    const btns = document.createElement("div");
    btns.className = "btn-group";
    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.onclick = async e => {
      e.stopPropagation();
      const newName = prompt("새 대분류 이름", cat.name);
      if (!newName || newName === cat.name) return;
      await fetch(`${API_BASE}/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          name: newName,
          midcategories: cat.midcategories
        })
      });
      bindCategoryActions();
    };
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.onclick = async e => {
      e.stopPropagation();
      if (!confirm(`"${cat.name}"을 삭제하시겠습니까?`)) return;
      await fetch(`${API_BASE}/categories/${cat.id}`, {
        method: "DELETE"
      });
      bindCategoryActions();
    };
    btns.append(editBtn, delBtn);
    header.appendChild(btns);
    card.appendChild(header);

    // 중분류 컨테이너
    const midBox = document.createElement("div");
    midBox.id = `mid-list-${cat.id}`;
    midBox.className = "mid-list";
    midBox.style.display = openCats.has(cat.id) ? "block" : "none";
    card.appendChild(midBox);

    // 제목 클릭 토글
    title.onclick = () => {
      const isOpen = midBox.style.display === "block";
      midBox.style.display = isOpen ? "none" : "block";
      if (isOpen) openCats.delete(cat.id);
      else openCats.add(cat.id);
      renderMids(cat, midBox);
    };

    // 최초 렌더링 시에도 안에 그려줘야 함
    if (openCats.has(cat.id)) {
      renderMids(cat, midBox);
    }

    container.appendChild(card);
  });
}

// 중분류 렌더링
function renderMids(cat, midBox) {
  midBox.innerHTML = "";
  cat.midcategories.forEach(mid => {
    const div = document.createElement("div");
    div.className = "mid-item";

    // 이름
    const span = document.createElement("span");
    span.className = "mid-label";
    span.textContent = mid.name;
    div.appendChild(span);

    // 버튼 그룹
    const btns = document.createElement("div");
    btns.className = "btn-group";
    const eBtn = document.createElement("button");
    eBtn.textContent = "수정";
    eBtn.onclick = async e => {
      e.stopPropagation();
      const n = prompt("새 중분류 이름", mid.name);
      if (!n || n === mid.name) return;
      await fetch(
        `${API_BASE}/categories/${cat.id}/midcategories/${mid.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: mid.id,
            name: n,
            subcategories: mid.subcategories
          })
        }
      );
      bindCategoryActions();
    };
    const dBtn = document.createElement("button");
    dBtn.textContent = "삭제";
    dBtn.onclick = async e => {
      e.stopPropagation();
      if (!confirm(`"${mid.name}"을 삭제하시겠습니까?`)) return;
      await fetch(
        `${API_BASE}/categories/${cat.id}/midcategories/${mid.id}`,
        { method: "DELETE" }
      );
      bindCategoryActions();
    };
    btns.append(eBtn, dBtn);
    div.appendChild(btns);

    // 소분류 박스
    const subBox = document.createElement("div");
    subBox.id = `sub-list-${cat.id}-${mid.id}`;
    subBox.className = "sub-list";
    subBox.style.display = openMids.has(mid.id) ? "block" : "none";
    div.appendChild(subBox);

    // span 클릭하면 서브 토글
    span.onclick = () => {
      const isOpen = subBox.style.display === "block";
      subBox.style.display = isOpen ? "none" : "block";
      if (isOpen) openMids.delete(mid.id);
      else openMids.add(mid.id);
      renderSubs(cat.id, mid, subBox);
    };

    // 이미 열려 있으면 렌더
    if (openMids.has(mid.id)) {
      renderSubs(cat.id, mid, subBox);
    }

    midBox.appendChild(div);
  });

  // 중분류 추가 입력
  const inp = document.createElement("input");
  inp.placeholder = "새 중분류 이름";
  inp.className = "new-mid-name";
  inp.dataset.cat = cat.id;

  const addBtn = document.createElement("button");
  addBtn.textContent = "추가";
  addBtn.onclick = async () => {
    const name = inp.value.trim();
    if (!name) return alert("중분류 이름을 입력하세요.");
    const id = Date.now();
    await fetch(`${API_BASE}/categories/${cat.id}/midcategories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, subcategories: [] })
    });
    inp.value = "";
    openCats.add(cat.id);
    openMids.add(id);
    bindCategoryActions();
  };

  midBox.append(inp, addBtn);
}

// 소분류 렌더링
function renderSubs(catId, mid, subBox) {
  subBox.innerHTML = "";
  mid.subcategories.forEach(sub => {
    const div = document.createElement("div");
    div.className = "sub-item";

    const a = document.createElement("a");
    a.href = `/detail.html?cat=${catId}&mid=${mid.id}&sub=${sub.id}`;
    a.textContent = sub.name;
    div.appendChild(a);

    const btns = document.createElement("div");
    btns.className = "btn-group";
    const eBtn = document.createElement("button");
    eBtn.textContent = "수정";
    eBtn.onclick = async e => {
      e.stopPropagation();
      const n = prompt("새 소분류 이름", sub.name);
      if (!n || n === sub.name) return;
      await fetch(
        `${API_BASE}/categories/${catId}/midcategories/${mid.id}/subcategories/${sub.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: sub.id,
            name: n,
            notes: sub.notes || {},
            attachments: sub.attachments || []
          })
        }
      );
      bindCategoryActions();
    };
    const dBtn = document.createElement("button");
    dBtn.textContent = "삭제";
    dBtn.onclick = async e => {
      e.stopPropagation();
      if (!confirm(`"${sub.name}"을 삭제하시겠습니까?`)) return;
      await fetch(
        `${API_BASE}/categories/${catId}/midcategories/${mid.id}/subcategories/${sub.id}`,
        { method: "DELETE" }
      );
      bindCategoryActions();
    };
    btns.append(eBtn, dBtn);
    div.appendChild(btns);
    subBox.appendChild(div);
  });

  const inp = document.createElement("input");
  inp.placeholder = "새 소분류 이름";
  inp.className = "new-sub-name";
  inp.dataset.cat = catId;
  inp.dataset.mid = mid.id;

  const addBtn = document.createElement("button");
  addBtn.textContent = "추가";
  addBtn.onclick = async () => {
    const name = inp.value.trim();
    if (!name) return alert("소분류 이름을 입력하세요.");
    const id = Date.now();
    await fetch(
      `${API_BASE}/categories/${catId}/midcategories/${mid.id}/subcategories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, notes: {}, attachments: [] })
      }
    );
    inp.value = "";
    openCats.add(catId);
    openMids.add(mid.id);
    bindCategoryActions();
  };

  subBox.append(inp, addBtn);
}
