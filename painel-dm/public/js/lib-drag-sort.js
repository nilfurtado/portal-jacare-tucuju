/**
 * Drag-and-drop para reordenar itens em uma lista
 * Padrão: mixin que adiciona capacidade de drag ao container
 */

export function enableDragSort(container, options = {}) {
  const {
    itemSelector = '[data-sort-item]',
    onReorder = null,
    dragOverClass = 'is-drag-over',
    draggingClass = 'is-dragging'
  } = options;

  let draggedElement = null;
  let draggedIndex = -1;

  const items = Array.from(container.querySelectorAll(itemSelector));

  items.forEach((item, idx) => {
    item.setAttribute('draggable', 'true');
    item.setAttribute('data-item-index', idx);

    // Drag start
    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      draggedIndex = idx;
      item.classList.add(draggingClass);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.innerHTML);
    });

    // Drag end
    item.addEventListener('dragend', (e) => {
      item.classList.remove(draggingClass);
      items.forEach(i => i.classList.remove(dragOverClass));
    });

    // Drag over
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (item !== draggedElement) {
        item.classList.add(dragOverClass);
      }
    });

    // Drag leave
    item.addEventListener('dragleave', (e) => {
      if (e.target === item) {
        item.classList.remove(dragOverClass);
      }
    });

    // Drop
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (item === draggedElement) return;

      const newIndex = parseInt(item.getAttribute('data-item-index'), 10);
      const fromIndex = draggedIndex;

      // Reordenar no DOM
      if (fromIndex < newIndex) {
        item.parentNode.insertBefore(draggedElement, item.nextSibling);
      } else {
        item.parentNode.insertBefore(draggedElement, item);
      }

      // Atualizar data-item-index de todos os itens
      Array.from(container.querySelectorAll(itemSelector)).forEach((el, i) => {
        el.setAttribute('data-item-index', i);
      });

      // Callback
      if (onReorder) {
        const newOrder = Array.from(container.querySelectorAll(itemSelector)).map(
          el => el.getAttribute('data-item-id') || el.dataset.itemId
        );
        onReorder(newOrder);
      }

      item.classList.remove(dragOverClass);
    });
  });
}

/**
 * Desabilitar drag-sort
 */
export function disableDragSort(container, options = {}) {
  const { itemSelector = '[data-sort-item]' } = options;

  container.querySelectorAll(itemSelector).forEach((item) => {
    item.setAttribute('draggable', 'false');
    item.removeAttribute('data-item-index');
  });
}

/**
 * Obter ordem atual dos itens
 */
export function getCurrentOrder(container, options = {}) {
  const { itemSelector = '[data-sort-item]', idAttribute = 'data-item-id' } = options;

  return Array.from(container.querySelectorAll(itemSelector)).map((el, idx) => ({
    index: idx,
    id: el.getAttribute(idAttribute) || el.dataset.itemId,
    element: el
  }));
}
