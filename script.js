// Function to calculate nesting depth
function getNestingDepth(el) {
  let depth = 0;
  while (el && el.id !== 'main-list') {
    if (el.tagName === 'UL') depth++;
    el = el.parentNode;
  }
  return depth;
}

// Function to initialize Sortable on a list
function initializeSortable(list) {
  new Sortable(list, {
    group: 'nested',
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    handle: '.task-header',
    onEnd: function (evt) {
      const item = evt.item;
      const depth = getNestingDepth(item);

      if (depth > 3) {
        evt.from.insertBefore(item, evt.from.children[evt.oldIndex]);
        alert('You cannot nest tasks more than 3 levels deep.');
      }
    }
  });
}

// Initialize Sortable on the main list
const mainList = document.getElementById('main-list');
initializeSortable(mainList);

// Initialize Sortable on existing nested lists (if any)
const nestedLists = [].slice.call(document.querySelectorAll('#main-list ul'));
nestedLists.forEach(function (list) {
  initializeSortable(list);
  list.classList.add('sortable-initialized');
});

// References
const addMainTaskButton = document.getElementById('add-main-task-button');
const taskTemplate = document.getElementById('task-template');

// Function to create a task element
function createTaskElement(taskName) {
  const newTask = taskTemplate.content.firstElementChild.cloneNode(true);
  newTask.querySelector('.task-name').textContent = taskName;
  return newTask;
}

// Show the task input modal
function showTaskInputModal(callback) {
  const modal = document.getElementById('task-input-modal');
  const input = document.getElementById('task-input');
  const confirmButton = document.getElementById('task-input-confirm');
  const cancelButton = document.getElementById('task-input-cancel');

  modal.style.display = 'block';
  input.value = '';
  input.focus();

  function addTask() {
    modal.style.display = 'none';
    confirmButton.removeEventListener('click', addTask);
    cancelButton.removeEventListener('click', hideModal);
    callback(input.value.trim());
  }

  function hideModal() {
    modal.style.display = 'none';
    confirmButton.removeEventListener('click', addTask);
    cancelButton.removeEventListener('click', hideModal);
  }

  confirmButton.addEventListener('click', addTask);
  cancelButton.addEventListener('click', hideModal);
}

// Update Add Main Task event
addMainTaskButton.addEventListener('click', function () {
  showTaskInputModal(function(taskName) {
    if (!taskName) return;

    const newTask = createTaskElement(taskName);
    mainList.appendChild(newTask);

    // Initialize Sortable on the new task's sublist
    const sublist = newTask.querySelector('ul');
    initializeSortable(sublist);
    sublist.classList.add('sortable-initialized');
  });
});

// Update Add Subtask event
document.body.addEventListener('click', function (event) {
  if (event.target.classList.contains('add-subtask-button')) {
    const parentTask = event.target.closest('.task');
    showTaskInputModal(function(taskName) {
      if (!taskName) return;

      const newSubtask = createTaskElement(taskName);

      const sublist = parentTask.querySelector('ul');
      sublist.appendChild(newSubtask);

      // Initialize Sortable on the sublist if not already initialized
      if (!sublist.classList.contains('sortable-initialized')) {
        initializeSortable(sublist);
        sublist.classList.add('sortable-initialized');
      }
    });
  }
});

// Handle double-click on task name to enable editing
document.body.addEventListener('dblclick', function (event) {
  if (event.target.classList.contains('task-name')) {
    const taskNameElement = event.target;
    const currentName = taskNameElement.textContent;

    // Create an input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'edit-input';

    // Replace the task name with the input field
    taskNameElement.replaceWith(input);
    input.focus();

    // Handle when the user finishes editing
    input.addEventListener('blur', function () {
      const newName = input.value.trim() || 'Unnamed Task';
      const newTaskNameElement = document.createElement('span');
      newTaskNameElement.className = 'task-name';
      newTaskNameElement.textContent = newName;

      input.replaceWith(newTaskNameElement);
    });

    // Optionally handle pressing Enter to finish editing
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  }
});
