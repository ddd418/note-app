// static/js/detail.js

document.addEventListener('DOMContentLoaded', async () => {
  // URL 파라미터 파싱
  const params    = new URLSearchParams(window.location.search);
  const catId     = params.get('cat');
  const midId     = params.get('mid');
  const subId     = params.get('sub');
  if (!catId || !midId || !subId) {
    alert('잘못된 접근입니다.');
    return window.location.href = '/';
  }

  // DOM 요소 참조
  const titleEl         = document.getElementById('title');
  const tplSelect       = document.getElementById('tplSelect');
  const dynamicFields   = document.getElementById('dynamicFields');
  const modelsSection   = document.getElementById('modelsSection');
  const modelList       = document.getElementById('modelList');
  const newNameInput    = document.getElementById('newModelName');
  const newDescInput    = document.getElementById('newModelDesc');
  const newAppInput     = document.getElementById('newModelApp');
  const addModelBtn     = document.getElementById('addModelBtn');
  const attachInput     = document.getElementById('attachFile');
  const uploadBtn       = document.getElementById('uploadBtn');
  const attachList      = document.getElementById('attachList');
  const form            = document.getElementById('noteForm');
  const backBtn         = document.getElementById('backBtn');
  const openTplBtn      = document.getElementById('openTplModalBtn');
  const tplModal        = document.getElementById('tplModal');
  const tplNameInput    = document.getElementById('tplNameInput');
  const tplFieldInput   = document.getElementById('tplFieldInput');
  const addFieldBtn     = document.getElementById('addFieldToPreview');
  const fieldPreview    = document.getElementById('fieldPreviewList');
  const tplIncludeCb    = document.getElementById('tplIncludeModels');
  const createTplBtn    = document.getElementById('createTplInModal');
  const closeTplBtn     = document.getElementById('closeTplModalBtn');

  let subData = {}, templates = [], newFields = [];

  // 템플릿 모달 열기/닫기
  openTplBtn.onclick = () => {
    newFields = [];
    tplNameInput.value = '';
    tplFieldInput.value = '';
    tplIncludeCb.checked = false;
    fieldPreview.innerHTML = '';
    tplModal.style.display = 'block';
  };
  closeTplBtn.onclick = () => tplModal.style.display = 'none';
  addFieldBtn.onclick = () => {
    const f = tplFieldInput.value.trim();
    if (!f) return;
    newFields.push(f);
    const li = document.createElement('li');
    li.textContent = f;
    fieldPreview.appendChild(li);
    tplFieldInput.value = '';
  };
  createTplBtn.onclick = async () => {
    const nm = tplNameInput.value.trim();
    if (!nm || newFields.length===0) return alert('이름과 필드를 모두 입력하세요.');
    const id = Date.now();
    const newTpl = { id, name:nm, fields:newFields, include_models:tplIncludeCb.checked };
    const res = await fetch('/api/template', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(newTpl)
    });
    if (!res.ok) return alert('템플릿 생성 실패');
    templates.push(newTpl);
    const opt = document.createElement('option'); opt.value = id; opt.textContent = nm;
    tplSelect.appendChild(opt);
    tplSelect.value = id;
    tplModal.style.display = 'none';
    renderFields(); renderModels();
  };

  // 데이터 + 템플릿 로드
  const [subRes, tplRes] = await Promise.all([
    fetch(`/api/categories/${catId}/midcategories/${midId}/subcategories/${subId}`),
    fetch('/api/templates')
  ]);
  subData   = await subRes.json();
  templates = await tplRes.json();

  titleEl.textContent = `${subData.name} 노트 편집`;

  tplSelect.innerHTML = `<option value="">--템플릿 선택--</option>`;
  templates.forEach(t => {
    const o = document.createElement('option'); o.value = t.id; o.textContent = t.name;
    tplSelect.appendChild(o);
  });
  tplSelect.value = subData.template_id || '';

  tplSelect.onchange = () => {
    if (!confirm('템플릿 변경 시 기존 내용이 초기화됩니다. 계속하시겠습니까?')) {
      tplSelect.value = subData.template_id || '';
      return;
    }
    renderFields(); renderModels();
  };

  // 동적 필드
  function renderFields() {
    dynamicFields.innerHTML = '';
    const tpl = templates.find(t => t.id == tplSelect.value);
    subData.template_id = tpl ? tpl.id : null;
    subData.notes = subData.notes || {};
    modelsSection.style.display = tpl && tpl.include_models ? 'block' : 'none';
    if (!tpl) return;
    tpl.fields.forEach(f => {
      const wr = document.createElement('div'); wr.className = 'dynamic-field';
      const lbl = document.createElement('label'); lbl.className = 'field-label'; lbl.textContent = f;
      const ta = document.createElement('textarea'); ta.style.minHeight = '120px';
      ta.value = subData.notes[f] || '';
      ta.oninput = () => subData.notes[f] = ta.value;
      wr.append(lbl, ta);
      dynamicFields.appendChild(wr);
    });
  }

  // 모델 리스트
  function renderModels() {
    modelList.innerHTML = '';
    const tpl = templates.find(t => t.id == tplSelect.value);
    if (!tpl || !tpl.include_models) return;
    subData.notes.models = subData.notes.models || [];
    subData.notes.models.forEach((m, idx) => {
      const item = document.createElement('div'); item.className = 'model-item';
      let editing = false;
      function redraw() {
        item.innerHTML = '';
        if (editing) {
          const ni = document.createElement('input'); ni.value = m.name;
          const di = document.createElement('input'); di.value = m.description;
          const ai = document.createElement('input'); ai.value = m.application;
          const sb = document.createElement('button'); sb.className = 'edit-btn'; sb.textContent = '저장';
          sb.onclick = () => {
            const nn = ni.value.trim(), dd = di.value.trim(), aa = ai.value.trim();
            if (!nn||!dd||!aa) return alert('빈 칸은 불가');
            subData.notes.models[idx] = { name:nn, description:dd, application:aa };
            editing = false; redraw();
          };
          const cb = document.createElement('button'); cb.textContent = '취소'; cb.onclick = () => { editing=false; redraw(); };
          item.append(ni, di, ai, sb, cb);
        } else {
          const txt = document.createElement('span'); txt.className = 'model-text';
          txt.textContent = `${m.name} : ${m.description} : ${m.application}`;
          const ug = document.createElement('div'); ug.style.display='flex'; ug.style.gap='3px';
          const up = document.createElement('button'); up.textContent='↑'; up.onclick=()=>{ if(idx>0){ [subData.notes.models[idx-1],subData.notes.models[idx]]=[subData.notes.models[idx],subData.notes.models[idx-1]]; renderModels(); } };
          const dn = document.createElement('button'); dn.textContent='↓'; dn.onclick=()=>{ if(idx<subData.notes.models.length-1){ [subData.notes.models[idx+1],subData.notes.models[idx]]=[subData.notes.models[idx],subData.notes.models[idx+1]]; renderModels(); } };
          const eb = document.createElement('button'); eb.className='edit-btn'; eb.textContent='수정'; eb.onclick=()=>{ editing=true; redraw(); };
          const db = document.createElement('button'); db.className='delete-btn'; db.textContent='삭제'; db.onclick=()=>{ subData.notes.models.splice(idx,1); renderModels(); };
          ug.append(up,dn,eb,db);
          item.append(txt,ug);
        }
      }
      redraw();
      modelList.appendChild(item);
    });
  }

  // 새 모델 추가
  addModelBtn.onclick = () => {
    const tpl = templates.find(t => t.id == tplSelect.value);
    if (!tpl || !tpl.include_models) return alert('모델 섹션이 활성화되지 않았습니다.');
    const n = newNameInput.value.trim();
    const d = newDescInput.value.trim();
    const a = newAppInput.value.trim();
    if (!n || !d || !a) return alert('모델명, 설명, 적용분야를 모두 입력하세요');
    subData.notes.models = subData.notes.models || [];
    subData.notes.models.push({ name: n, description: d, application: a });
    newNameInput.value = '';
    newDescInput.value = '';
    newAppInput.value = '';
    renderModels();
  };

  // 첨부파일 리스트 렌더링
  function renderAttachments() {
    attachList.innerHTML = '';
    (subData.attachments || []).forEach(att => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${att.url}" target="_blank">${att.filename}</a>
        <button class="delete-btn">삭제</button>
      `;
      li.querySelector('button').onclick = async () => {
        if (!confirm('삭제하시겠습니까?')) return;
        await fetch(
          `/api/categories/${catId}/midcategories/${midId}/subcategories/${subId}/attachment`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(att)
          }
        );
        subData.attachments = subData.attachments.filter(a => a.url !== att.url);
        renderAttachments();
      };
      attachList.appendChild(li);
    });
  }

  // 파일 업로드
  uploadBtn.onclick = async () => {
    const file = attachInput.files[0];
    if (!file) return alert('파일을 선택하세요.');
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(
      `/api/categories/${catId}/midcategories/${midId}/subcategories/${subId}/attachment`, {
        method: 'POST', body: fd
      }
    );
    if (!res.ok) return alert('업로드 실패');
    const newAtt = await res.json();
    subData.attachments.push(newAtt);
    renderAttachments(); attachInput.value = '';
  };

  // 저장(PATCH)
  form.onsubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(
        `/api/categories/${catId}/midcategories/${midId}/subcategories/${subId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subData)
        }
      );
      if (res.status === 403) {
        const { detail } = await res.json();
        return alert(detail || '권한이 없습니다.');
      }
      if (!res.ok) throw new Error('저장 실패');
      alert('저장되었습니다.');
    } catch(err) {
      alert(err.message);
    }
  };

  // 뒤로
  backBtn.onclick = () => window.location.href = '/';

  // 초기 렌더
  renderFields();
  renderModels();
  renderAttachments();
});
