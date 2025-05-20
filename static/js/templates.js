// static/js/templates.js

document.addEventListener('DOMContentLoaded', () => {
  const tplList     = document.getElementById('tplList');
  const newTplName  = document.getElementById('newTplName');
  const newField    = document.getElementById('newFieldName');
  const addFieldBtn = document.getElementById('addFieldBtn');
  const fieldPrev   = document.getElementById('fieldPreview');
  const createBtn   = document.getElementById('createTplBtn');

  let fields = [];

  // 1) 템플릿 목록 로드
  async function loadTemplates() {
    const res  = await fetch('/api/templates');
    const data = await res.json();
    tplList.innerHTML = '';

    data.forEach(t => {
      // 카드 루트
      const card = document.createElement('div');
      card.className = 'template-card';

      // 헤더
      const header = document.createElement('div');
      header.className = 'tpl-header';

      const nameEl = document.createElement('span');
      nameEl.className = 'tpl-name';
      nameEl.textContent = t.name;

      const ctrls = document.createElement('div');
      ctrls.className = 'template-controls';

      // 수정 버튼 → 편집 모드로 전환
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-tpl-btn';
      editBtn.textContent = '수정';
      editBtn.onclick = () => enterEditMode(card, t);

      // 삭제 버튼
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-tpl-btn';
      deleteBtn.textContent = '삭제';
      deleteBtn.onclick = async () => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        await fetch(`/api/template/${t.id}`, { method: 'DELETE' });
        loadTemplates();
      };

      ctrls.append(editBtn, deleteBtn);
      header.append(nameEl, ctrls);
      card.append(header);

      // 필드 표시
      const fieldsEl = document.createElement('div');
      fieldsEl.className = 'tpl-fields';
      fieldsEl.textContent = `필드: ${t.fields.join(', ')}`;
      card.append(fieldsEl);

      tplList.append(card);
    });
  }

  // 2) 새 필드 추가 (프리뷰)
  addFieldBtn.onclick = () => {
    const f = newField.value.trim();
    if (!f) return;
    fields.push(f);
    const li = document.createElement('li');
    li.textContent = f;
    fieldPrev.append(li);
    newField.value = '';
  };

  // 3) 새 템플릿 생성
  createBtn.onclick = async () => {
    const name = newTplName.value.trim();
    // 체크박스도 읽기
    const includeModels = document.getElementById('includeModels')?.checked || false;
    if (!name || fields.length === 0) {
      return alert('템플릿 이름과 하나 이상의 필드를 입력하세요.');
    }
    const id = Date.now();
    await fetch('/api/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, fields, include_models: includeModels })
    });
    // 초기화
    newTplName.value = '';
    fields = [];
    fieldPrev.innerHTML = '';
    if (document.getElementById('includeModels')) {
      document.getElementById('includeModels').checked = false;
    }
    loadTemplates();
  };

  // 4) 편집 모드 진입
  function enterEditMode(card, tpl) {
    card.innerHTML = '';

    // 이름 입력
    const nameInput = document.createElement('input');
    nameInput.value = tpl.name;
    nameInput.className = 'inline-input';

    // 필드 태그 컨테이너
    const fc = document.createElement('div');
    fc.className = 'fields-container';
    let tempFields = [...tpl.fields];
    function renderFieldTags() {
      fc.innerHTML = '';
      tempFields.forEach((f, i) => {
        const tag = document.createElement('span');
        tag.className = 'field-tag';
        tag.textContent = f;
        const btn = document.createElement('button');
        btn.textContent = '×';
        btn.onclick = () => {
          tempFields.splice(i, 1);
          renderFieldTags();
        };
        tag.append(btn);
        fc.append(tag);
      });
    }
    renderFieldTags();

    // 새 필드 추가
    const newFieldInput = document.createElement('input');
    newFieldInput.placeholder = '필드명';
    const addFldBtn = document.createElement('button');
    addFldBtn.textContent = '추가';
    addFldBtn.onclick = () => {
      const v = newFieldInput.value.trim();
      if (!v) return;
      tempFields.push(v);
      newFieldInput.value = '';
      renderFieldTags();
    };

    // include_models 체크박스
    const chkWrapper = document.createElement('div');
    chkWrapper.className = 'template-edit-checkbox';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = tpl.include_models || false;
    const chkLabel = document.createElement('label');
    chkLabel.textContent = '모델 표시 포함';
    chkWrapper.append(chk, chkLabel);

    // 저장/취소 버튼
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = '저장';
    saveBtn.onclick = async () => {
      const updated = {
        id: tpl.id,
        name: nameInput.value.trim(),
        fields: tempFields,
        include_models: chk.checked
      };
      await fetch(`/api/template/${tpl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      loadTemplates();
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.onclick = loadTemplates;

    // 조립
    card.append(
      nameInput,
      fc,
      newFieldInput,
      addFldBtn,
      chkWrapper,
      saveBtn,
      cancelBtn
    );
  }

  // 초기 로드
  loadTemplates();
});
