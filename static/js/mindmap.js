document.addEventListener('DOMContentLoaded', () => {
  const netDiv       = document.getElementById('network');
  const selectFrom   = document.getElementById('selectFrom');
  const selectTo     = document.getElementById('selectTo');
  const addRelBtn    = document.getElementById('addRelBtn');
  const delRelBtn    = document.getElementById('delRelBtn');
  const modal        = document.getElementById('detailModal');
  const modalContent = document.getElementById('modalContent');

  // vis Network 초기화
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const network = new vis.Network(netDiv, { nodes, edges }, {
    physics:{ stabilization:false },
    interaction:{ hover:true }
  });

  let currentSubId = null;

  // --- loadData 수정 ---
  async function loadData() {
    nodes.clear(); 
    edges.clear();
    selectFrom.innerHTML = ''; 
    selectTo.innerHTML   = '';

    // 1) 카테고리 → 중분류 → 소분류로 순회해야 합니다
    const cats = await (await fetch('/api/categories')).json();
    const subs = [];
    cats.forEach(cat => {
      (cat.midcategories || []).forEach(mid => {
        (mid.subcategories || []).forEach(sub => {
          subs.push({
            ...sub,
            catId: cat.id,
            midId: mid.id
          });
        });
      });
    });

    // 2) 노드 추가 (catId, midId 속성도 함께 저장)
    subs.forEach(sub => {
      nodes.add({
        id: sub.id,
        label: sub.name,
        catId: sub.catId,
        midId: sub.midId
      });
      const o = document.createElement('option');
      o.value = sub.id;
      o.text  = sub.name;
      selectFrom.add(o);
      selectTo.add(o.cloneNode(true));
    });

    // 3) 관계 엣지 로드
    const rels = await (await fetch('/api/relationships')).json();
    rels.forEach(r => edges.add({ from: r.from_id, to: r.to_id }));
  }

  // 관계 추가/삭제 이벤트 (변경 없음)
  addRelBtn.onclick = async () => {
    const from_id = +selectFrom.value, to_id = +selectTo.value;
    if (from_id === to_id) return alert('같은 노드를 연결할 수 없습니다.');
    await fetch('/api/relationship', {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ from_id, to_id })
    });
    await loadData();
  };
  delRelBtn.onclick = async () => {
    const from_id = +selectFrom.value, to_id = +selectTo.value;
    if (!confirm('관계를 삭제할까요?')) return;
    await fetch('/api/relationship', {
      method: 'DELETE',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ from_id, to_id })
    });
    await loadData();
  };

  // 처음 데이터 로드
  loadData();

  // 더블클릭 시 모달 토글
  network.on('doubleClick', params => {
    if (!params.nodes.length) return;
    const subId = params.nodes[0];
    if (currentSubId === subId) {
      modal.classList.add('hidden');
      currentSubId = null;
    } else {
      currentSubId = subId;
      showModal(subId);
    }
  });

  // --- showModal URL 수정 ---
  async function showModal(subId) {
    const node = nodes.get(subId);
    // catId, midId 둘 다 필요합니다
    const res  = await fetch(
      `/api/categories/${node.catId}/midcategories/${node.midId}/subcategories/${subId}`
    );
    const data = await res.json();

    let html = `<h3>${data.name}</h3><ul>`;
    for (const [k, v] of Object.entries(data.notes || {})) {
      if (k === 'models' || v === '') continue;
      html += `<li><strong>${k}</strong>: ${v}</li>`;
    }
    html += `</ul>`;

    if (Array.isArray(data.notes.models) && data.notes.models.length) {
      html += `<h4>Models</h4><ul>`;
      data.notes.models.forEach(m => {
        html += `<li>${m.name}: ${m.description} (${m.application})</li>`;
      });
      html += `</ul>`;
    }

    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
  }

  // 모달 드래그 (생략)
  let isDragging = false, ox = 0, oy = 0;
  modal.addEventListener('mousedown', e => {
    isDragging = true;
    ox = e.clientX - modal.offsetLeft;
    oy = e.clientY - modal.offsetTop;
    modal.style.transition = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    modal.style.left = `${e.clientX - ox}px`;
    modal.style.top  = `${e.clientY - oy}px`;
    modal.style.transform = 'none';
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      modal.style.transition = '';
    }
  });
});
