// ---------- Elements ----------
const form = document.getElementById('taskForm');
const input = document.getElementById('taskInput');
const formError = document.getElementById('formError');
const list = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');
const counter = document.getElementById('counter');
const clearDoneBtn = document.getElementById('clearDone');
const filterButtons = document.querySelectorAll('.filter');

// ---------- State ----------
const STORAGE_KEY = 'task-manager-tasks';
let tasks = loadTasks();       // [{ id, text, done }]
let currentFilter = 'all';     // 'all' | 'active' | 'done'
let editingId = null;          // id of the task being edited, or null

// ---------- Saving and loading ----------
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // Storage can be blocked (private mode). The app still works, tasks just won't persist.
  }
}

// ---------- Actions ----------
function addTask(text) {
  tasks.push({ id: Date.now() + Math.random(), text: text, done: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function saveEdit(id, newText) {
  const text = newText.trim();
  if (text) {
    const task = tasks.find(t => t.id === id);
    if (task) task.text = text;
  }
  editingId = null;
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
}

// ---------- Drawing the list ----------
function createTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task' + (task.done ? ' done' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as done');
  checkbox.addEventListener('change', () => toggleTask(task.id));
  li.appendChild(checkbox);

  if (editingId === task.id) {
    // Edit mode: show a text box instead of the text
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.maxLength = 120;
    editInput.setAttribute('aria-label', 'Edit task');
    editInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') saveEdit(task.id, editInput.value);
      if (event.key === 'Escape') { editingId = null; render(); }
    });
    li.appendChild(editInput);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'icon-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => saveEdit(task.id, editInput.value));
    actions.appendChild(saveBtn);
    li.appendChild(actions);

    setTimeout(() => editInput.focus(), 0);
  } else {
    // Normal mode: text plus Edit and Delete buttons
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;   // textContent keeps user text safe
    li.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => { editingId = task.id; render(); });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);
  }

  return li;
}

function render() {
  const visible = tasks.filter(task => {
    if (currentFilter === 'active') return !task.done;
    if (currentFilter === 'done') return task.done;
    return true;
  });

  list.innerHTML = '';
  visible.forEach(task => list.appendChild(createTaskItem(task)));

  // Empty message
  if (visible.length === 0) {
    const messages = {
      all: 'No tasks yet. Add your first task above.',
      active: 'No active tasks. Everything is done.',
      done: 'No completed tasks yet.'
    };
    emptyMessage.textContent = messages[currentFilter];
    emptyMessage.hidden = false;
  } else {
    emptyMessage.hidden = true;
  }

  // Counter and Clear button
  const left = tasks.filter(t => !t.done).length;
  counter.textContent = left + (left === 1 ? ' task left' : ' tasks left');
  clearDoneBtn.hidden = !tasks.some(t => t.done);
}

// ---------- Events ----------
form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    formError.textContent = 'Enter a task before adding it.';
    input.focus();
    return;
  }
  formError.textContent = '';
  addTask(text);
  input.value = '';
  input.focus();
});

input.addEventListener('input', () => { formError.textContent = ''; });

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    render();
  });
});

clearDoneBtn.addEventListener('click', clearCompleted);

// ---------- Start ----------
render();
