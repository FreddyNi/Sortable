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
  if (!list) {
    console.error('initializeSortable: provided list is null');
    return;
  }
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
      saveTasks();
    }
  });
}

// Initialize Sortable on the main list
const mainList = document.getElementById('main-list');
initializeSortable(mainList);

// Initialize Sortable on existing nested lists (if any)
const nestedLists = Array.from(document.querySelectorAll('#main-list ul'));
nestedLists.forEach(function (list) {
  initializeSortable(list);
  list.classList.add('sortable-initialized');
});

// References
const addMainTaskButton = document.getElementById('add-main-task-button');
const taskTemplate = document.getElementById('task-template').content;

// Function to create a task element
function createTaskElement(taskName) {
  const newTask = document.importNode(taskTemplate, true);
  newTask.querySelector('.task-name').textContent = taskName;
  return newTask;
}

// Function to show the task input modal
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

// Update Add Main Task event to use modal
addMainTaskButton.addEventListener('click', function () {
  showTaskInputModal(function(taskName) {
    if (!taskName) return;

    const newTask = createTaskElement(taskName);
    mainList.appendChild(newTask);

    // Initialize Sortable on the new task's sublist
    const sublist = newTask.querySelector('ul');
    initializeSortable(sublist);
    sublist.classList.add('sortable-initialized');
    saveTasks();
  });
});

// Update Add Subtask event to use modal
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
      saveTasks();
    });
  }
});

// Handle task name clicks for editing
document.body.addEventListener('click', function (event) {
  if (event.target.classList.contains('task-name')) {
    const currentName = event.target.textContent;
    const newName = prompt('Edit task name:', currentName);
    if (newName) {
      event.target.textContent = newName;
      saveTasks();
    }
  }
});

// Handle Delete Task button clicks
document.body.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-task-button')) {
    const taskItem = event.target.closest('.task');
    if (confirm('Are you sure you want to delete this task?')) {
      taskItem.remove();
      saveTasks();
    }
  }
});

// Saving and loading tasks
function saveTasks() {
  const tasks = [];
  mainList.querySelectorAll(':scope > .task').forEach(function (task) {
    tasks.push(serializeTask(task));
  });
  localStorage.setItem('taskList', JSON.stringify(tasks));
}

function serializeTask(task) {
  const taskData = {
    name: task.querySelector('.task-name').textContent,
    subtasks: []
  };
  const sublist = task.querySelector('ul');
  if (sublist) {
    sublist.querySelectorAll(':scope > .task').forEach(function (subtask) {
      taskData.subtasks.push(serializeTask(subtask));
    });
  }
  return taskData;
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('taskList'));
  if (tasks && Array.isArray(tasks)) {
    mainList.innerHTML = '';
    tasks.forEach(function (taskData) {
      const taskElement = createTaskFromData(taskData);
      mainList.appendChild(taskElement);
    });
  }
}

function createTaskFromData(taskData) {
  const taskElement = createTaskElement(taskData.name);
  const sublist = taskElement.querySelector('ul');
  taskData.subtasks.forEach(function (subtaskData) {
    const subtaskElement = createTaskFromData(subtaskData);
    sublist.appendChild(subtaskElement);
  });
  initializeSortable(sublist);
  sublist.classList.add('sortable-initialized');
  return taskElement;
}

// Load tasks on page load
document.addEventListener('DOMContentLoaded', loadTasks);
