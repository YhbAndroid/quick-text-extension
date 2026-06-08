/**
 * 弹出窗口主逻辑
 * 处理快捷文本列表和复制操作，支持动态增删改和标签分类
 */
document.addEventListener('DOMContentLoaded', () => {
  const textListContainer = document.getElementById('textList');
  const status = document.getElementById('status');
  const newTextInput = document.getElementById('newText');
  const newTagInput = document.getElementById('newTag');
  const addBtn = document.getElementById('addBtn');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const tagsContainer = document.getElementById('tagsContainer');
  const tagDropdown = document.getElementById('tagDropdown');

  let quickTexts = [];
  let nextId = 1;
  let currentTagFilter = '';
  let editingId = null;

  /**
   * 从 Chrome storage 加载数据
   */
  function loadTexts() {
    chrome.storage.local.get(['quickTexts', 'lastTagFilter'], (result) => {
      if (result.quickTexts && result.quickTexts.length > 0) {
        quickTexts = result.quickTexts;
        quickTexts = quickTexts.map(item => ({
          ...item,
          tag: item.tag || ''
        }));
        const maxId = Math.max(...quickTexts.map(item => item.id));
        nextId = maxId + 1;
      }
      if (result.lastTagFilter !== undefined) {
        currentTagFilter = result.lastTagFilter;
      }
      renderTags();
      renderList();
      updateStorageInfo();
    });
  }

  /**
   * 保存数据到 Chrome storage
   */
  function saveTexts() {
    chrome.storage.local.set({ quickTexts });
    updateStorageInfo();
  }

  /**
   * 更新容量显示
   */
  function updateStorageInfo() {
    chrome.storage.local.getBytesInUse('quickTexts', (bytesInUse) => {
      const maxBytes = 5 * 1024 * 1024;
      const usedKB = (bytesInUse / 1024).toFixed(2);
      const maxKB = (maxBytes / 1024).toFixed(0);
      const percent = ((bytesInUse / maxBytes) * 100).toFixed(1);
      const percentNum = parseFloat(percent);
      
      const storageBarFill = document.getElementById('storageBarFill');
      const storageText = document.getElementById('storageText');
      
      if (storageBarFill) {
        storageBarFill.style.width = `${percent}%`;
        storageBarFill.className = 'storage-bar-fill';
        if (percentNum >= 90) {
          storageBarFill.classList.add('danger');
        } else if (percentNum >= 70) {
          storageBarFill.classList.add('warning');
        }
      }
      
      if (storageText) {
        storageText.textContent = `${usedKB}KB / ${maxKB}KB`;
      }
    });
  }

  /**
   * 获取所有标签
   */
  function getAllTags() {
    const tags = new Set();
    quickTexts.forEach(item => {
      if (item.tag) {
        tags.add(item.tag);
      }
    });
    return Array.from(tags);
  }

  /**
   * 设置标签输入框的下拉框事件
   */
  function setupTagInputEvents(tagInput, dropdownElement) {
    tagInput.addEventListener('focus', () => {
      showDropdown(dropdownElement, tagInput.value);
    });
    
    tagInput.addEventListener('click', (e) => {
      e.stopPropagation();
      showDropdown(dropdownElement, tagInput.value);
    });

    tagInput.addEventListener('input', () => {
      showDropdown(dropdownElement, tagInput.value);
    });
  }

  /**
   * 显示标签下拉框
   */
  function showDropdown(dropdownElement, filterText = '') {
    hideAllDropdowns();
    renderTagDropdown(dropdownElement, filterText);
    dropdownElement.classList.add('show');
  }
  
  /**
   * 渲染标签下拉框
   */
  function renderTagDropdown(dropdownElement, filterText = '') {
    const allTags = getAllTags();
    // 模糊搜索过滤
    const tags = filterText 
      ? allTags.filter(tag => tag.toLowerCase().includes(filterText.toLowerCase()))
      : allTags;
    
    dropdownElement.innerHTML = '';
    
    if (allTags.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.className = 'tag-option no-tags';
      emptyOption.textContent = '暂无标签';
      dropdownElement.appendChild(emptyOption);
    } else if (tags.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.className = 'tag-option no-tags';
      emptyOption.textContent = '无匹配标签';
      dropdownElement.appendChild(emptyOption);
    } else {
      tags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'tag-option';
        option.textContent = tag;
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const tagInput = dropdownElement.previousElementSibling;
          tagInput.value = tag;
          tagInput.focus();
          hideAllDropdowns();
        });
        dropdownElement.appendChild(option);
      });
    }
  }

  /**
   * 隐藏所有标签下拉框
   */
  function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.tag-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }

  /**
   * 渲染标签筛选器
   */
  function renderTags() {
    const tags = getAllTags();
    tagsContainer.innerHTML = '';
    
    const allTagElement = document.createElement('span');
    allTagElement.className = currentTagFilter === '' ? 'filter-tag active' : 'filter-tag';
    allTagElement.dataset.tag = '';
    allTagElement.textContent = '全部';
    allTagElement.addEventListener('click', () => {
      setTagFilter('');
    });
    tagsContainer.appendChild(allTagElement);
    
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = currentTagFilter === tag ? 'filter-tag active' : 'filter-tag';
      tagElement.dataset.tag = tag;
      tagElement.textContent = tag;
      tagElement.addEventListener('click', () => {
        setTagFilter(tag);
      });
      tagsContainer.appendChild(tagElement);
    });
  }

  /**
   * 设置标签筛选
   */
  function setTagFilter(tag) {
    currentTagFilter = tag;
    document.querySelectorAll('.filter-tag').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelector(`[data-tag="${tag}"]`)?.classList.add('active');
    chrome.storage.local.set({ lastTagFilter: tag });
    renderList();
  }

  /**
   * 获取筛选后的文本列表
   */
  function getFilteredTexts() {
    if (!currentTagFilter) {
      return quickTexts;
    }
    return quickTexts.filter(item => item.tag === currentTagFilter);
  }

  /**
   * 获取标签样式类
   */
  function getTagClass(tag) {
    const tagMap = {
      '工作': 'tag-work',
      '个人': 'tag-personal',
      '重要': 'tag-important'
    };
    return tagMap[tag] || 'tag-default';
  }

  /**
   * 渲染列表
   */
  function renderList() {
    textListContainer.innerHTML = '';
    const filteredTexts = getFilteredTexts();
    
    if (filteredTexts.length === 0) {
      textListContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无快捷文本</div>';
      return;
    }

    filteredTexts.forEach(item => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      listItem.dataset.id = item.id;
      listItem.dataset.text = encodeURIComponent(item.text);
      listItem.setAttribute('draggable', 'true');
      listItem.innerHTML = `
        <span class="drag-handle">⋮⋮</span>
        ${item.tag ? `<span class="tag ${getTagClass(item.tag)}">${escapeHtml(item.tag)}</span>` : ''}
        <span class="text-content">${escapeHtml(item.text)}</span>
        <div class="actions">
          <button class="btn btn-sm btn-edit" data-action="edit" data-id="${item.id}">编辑</button>
          <button class="btn btn-sm btn-delete" data-action="delete" data-id="${item.id}">删除</button>
        </div>
      `;
      textListContainer.appendChild(listItem);
    });
    dragDropModule.initDragAndDrop();
  }

  /**
   * HTML转义函数，防止XSS攻击
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  const dragDropModule = (() => {
    let draggedItem = null;
    
    /**
     * 初始化拖动排序功能
     */
    function initDragAndDrop() {
      const items = textListContainer.querySelectorAll('.list-item');
      
      items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
      });
    }
    
    /**
     * 拖动开始
     */
    function handleDragStart(event) {
      draggedItem = event.target;
      draggedItem.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * 拖动经过
     */
    function handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      const items = textListContainer.querySelectorAll('.list-item:not(.dragging)');
      items.forEach(item => {
        item.classList.remove('drag-over');
      });
      
      const dropTarget = getDropTarget(event.target);
      if (dropTarget) {
        dropTarget.classList.add('drag-over');
      }
    }
    
    /**
     * 获取放置目标
     */
    function getDropTarget(target) {
      let item = target;
      while (item) {
        if (item.classList.contains('list-item') && !item.classList.contains('dragging')) {
          return item;
        }
        item = item.parentElement;
      }
      return null;
    }
    
    /**
     * 放置
     */
    function handleDrop(event) {
      event.preventDefault();
      
      const dropTarget = getDropTarget(event.target);
      if (!dropTarget || !draggedItem) return;

      const draggedId = parseInt(draggedItem.dataset.id);
      const targetId = parseInt(dropTarget.dataset.id);

      const draggedIndex = quickTexts.findIndex(item => item.id === draggedId);
      const targetIndex = quickTexts.findIndex(item => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedItemData] = quickTexts.splice(draggedIndex, 1);
      quickTexts.splice(targetIndex, 0, draggedItemData);

      saveTexts();
      renderTags();
      // 优化：仅调整DOM顺序而不重新渲染整个列表
      reorderListItem(draggedItem, dropTarget);
    }
    
    /**
     * 调整列表项DOM顺序
     */
    function reorderListItem(draggedEl, targetEl) {
      draggedEl.classList.remove('dragging');
      draggedEl.classList.remove('drag-over');
      targetEl.classList.remove('drag-over');
      
      // 将拖拽项移动到目标位置
      if (draggedItem === targetEl.nextSibling) {
        textListContainer.insertBefore(draggedEl, targetEl);
      } else if (draggedItem === targetEl.previousSibling) {
        textListContainer.insertBefore(draggedEl, targetEl.nextSibling);
      } else {
        const targetNext = targetEl.nextSibling;
        if (targetNext) {
          textListContainer.insertBefore(draggedEl, targetNext);
        } else {
          textListContainer.appendChild(draggedEl);
        }
      }
    }
    
    /**
     * 拖动结束
     */
    function handleDragEnd() {
      if (draggedItem) {
        draggedItem.classList.remove('dragging');
        const items = textListContainer.querySelectorAll('.list-item');
        items.forEach(item => {
          item.classList.remove('drag-over');
        });
        draggedItem = null;
      }
    }
    
    return {
      initDragAndDrop
    };
  })();

  /**
   * 处理列表点击事件
   */
  function handleListClick(event) {
    const target = event.target;
    const listItem = target.closest('.list-item');
    
    // 如果点击的是按钮（编辑、删除等），交给 handleListButtonClick 处理
    if (target.classList.contains('btn')) {
      handleListButtonClick(event);
      return;
    }
    
    // 如果点击的是列表项本身，执行复制
    if (listItem) {
      const text = decodeURIComponent(listItem.dataset.text);
      copyText(text);
    }
  }

  /**
   * 处理列表按钮点击事件
   */
  function handleListButtonClick(event) {
    const target = event.target;
    if (target.classList.contains('btn')) {
      const action = target.dataset.action;
      const id = parseInt(target.dataset.id);
      
      if (action === 'edit') {
        editText(id);
      } else if (action === 'delete') {
        deleteText(id);
      }
    }
  }

  /**
   * 添加新文本
   */
  function addText() {
    const text = newTextInput.value.trim();
    if (!text) {
      showStatus('请输入文本内容');
      return;
    }
    
    const tag = newTagInput.value.trim();
    const newItem = { id: nextId++, text, tag };
    quickTexts.unshift(newItem);
    saveTexts();
    renderTags();
    renderList();
    newTextInput.value = '';
    newTagInput.value = '';
    showStatus('添加成功！');
  }

  /**
   * 编辑文本
   */
  function editText(id) {
    editingId = id;
    const item = quickTexts.find(t => t.id === id);
    if (!item) return;

    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    listItem.innerHTML = `
      <span class="drag-handle">⋮⋮</span>
      <input type="text" class="edit-input" value="${escapeHtml(item.text)}" maxlength="200">
      <div class="tag-select-container">
        <input type="text" class="tag-input" value="${escapeHtml(item.tag || '')}" placeholder="标签" maxlength="10">
        <div class="tag-dropdown edit-tag-dropdown"></div>
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-save" data-id="${id}">保存</button>
        <button class="btn btn-sm btn-cancel" data-id="${id}">取消</button>
      </div>
    `;

    const editInput = listItem.querySelector('.edit-input');
    const editTagInput = listItem.querySelector('.tag-input');
    const editTagDropdown = listItem.querySelector('.edit-tag-dropdown');
    const saveBtn = listItem.querySelector('.btn-save');
    const cancelBtn = listItem.querySelector('.btn-cancel');
    
    editInput.focus();
    editInput.select();
    
    // 使用通用函数设置标签输入框事件
    setupTagInputEvents(editTagInput, editTagDropdown);
    
    // 单独绑定保存和取消按钮事件
    saveBtn.addEventListener('click', () => saveEdit(id));
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      renderList();
    });
  }

  /**
   * 保存编辑
   */
  function saveEdit(id) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const textInput = listItem.querySelectorAll('input')[0];
    const tagInput = listItem.querySelectorAll('input')[1];
    const newText = textInput.value.trim();
    const newTag = tagInput.value.trim();
    
    if (!newText) {
      showStatus('请输入文本内容');
      return;
    }

    const item = quickTexts.find(t => t.id === id);
    if (item) {
      item.text = newText;
      item.tag = newTag;
      saveTexts();
      renderTags();
      renderList();
      showStatus('修改成功！');
    }
  }

  /**
   * 删除文本
   */
  function deleteText(id) {
    if (!confirm('确定要删除这条快捷文本吗？')) return;
    
    quickTexts = quickTexts.filter(t => t.id !== id);
    saveTexts();

    // 如果当前有筛选标签，且筛选后列表为空，自动切换到"全部"
    if (currentTagFilter) {
      const filteredTexts = quickTexts.filter(item => item.tag === currentTagFilter);
      if (filteredTexts.length === 0) {
        setTagFilter('');
      }
    }

    renderTags();
    renderList();
    showStatus('删除成功！');
  }

  /**
   * 复制文本到剪贴板
   */
  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      showStatus('已复制到剪贴板！');
      setTimeout(() => {
        window.close();
      }, 300);
    }).catch(() => {
      showStatus('复制失败');
    });
  }

  /**
   * 显示状态消息
   */
  function showStatus(msg) {
    status.textContent = msg;
    status.classList.add('visible');
    setTimeout(() => {
      status.classList.remove('visible');
      setTimeout(() => {
        status.textContent = '';
      }, 300);
    }, 2000);
  }

  /**
   * 导出数据
   */
  function exportData() {
    const content = quickTexts.map(item => {
      return item.tag ? `[${item.tag}] ${item.text}` : item.text;
    }).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-texts-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('导出成功！');
  }

  /**
   * 导入数据
   */
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
          showStatus('文件内容为空');
          return;
        }

        const newItems = lines.map((line, index) => {
          let tag = '';
          let text = line;
          const match = line.match(/^\[(.+?)\]\s*(.+)$/);
          if (match) {
            tag = match[1];
            text = match[2];
          }
          return {
            id: nextId + index,
            text,
            tag
          };
        });
        
        // 去重：检查已存在的文本
        const existingTexts = new Set(quickTexts.map(item => item.text));
        const uniqueItems = newItems.filter(item => !existingTexts.has(item.text));
        
        if (uniqueItems.length === 0) {
          showStatus('导入的文本已存在');
          return;
        }
        
        const duplicateCount = newItems.length - uniqueItems.length;
        quickTexts = [...uniqueItems, ...quickTexts];
        nextId += newItems.length;
        
        saveTexts();
        renderTags();
        renderList();
        
        const msg = duplicateCount > 0 
          ? `成功导入 ${uniqueItems.length} 条数据（${duplicateCount} 条重复已跳过）` 
          : `成功导入 ${uniqueItems.length} 条数据！`;
        showStatus(msg);
      } catch (error) {
        showStatus('导入失败');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    textListContainer.addEventListener('click', handleListClick);
    addBtn.addEventListener('click', addText);
    newTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addText();
      }
    });
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    importFile.addEventListener('change', importData);
    
    // 使用通用函数设置标签输入框事件
    setupTagInputEvents(newTagInput, tagDropdown);
    
    // 点击外部关闭下拉框
    document.addEventListener('click', (e) => {
      const target = e.target;
      const isTagInput = target.classList.contains('tag-input');
      const isDropdown = target.classList.contains('tag-dropdown') || target.classList.contains('tag-option');
      
      if (!isTagInput && !isDropdown) {
        hideAllDropdowns();
      }
    });
  }

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadTexts();
  }

  init();
});