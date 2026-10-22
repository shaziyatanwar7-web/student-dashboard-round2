// Candidate: CANDIDATE_ID
const STORAGE_KEY = 'students_CANDIDATE_ID';
let students = [];
let pendingDeleteId = null;

const $ = (id) => document.getElementById(id);

function normalize(r) {
  return {
    id: String(r.id ?? r.studentId ?? r.student_id ?? r.ID ?? ''),
    name: String(r.name ?? r.fullName ?? r.studentName ?? ''),
    course: String(r.course ?? r.program ?? ''),
    email: String(r.email ?? r.mail ?? '')
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

async function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    students = JSON.parse(saved).map(normalize);
    return;
  }
  try {
    const res = await fetch('students.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.students || []);
    students = list.map(normalize);
    save();
  } catch (err) {
    console.error('Could not load students.json:', err);
    students = [];
    $('notice').hidden = false;
    $('notice').textContent =
      'Could not load students.json. Open the page with Live Server. You can still add students.';
  }
}

function nextId() {
  const first = students.find(s => /\d+$/.test(s.id));
  const prefix = first ? first.id.replace(/\d+$/, '') : 'S';
  const width = first ? first.id.match(/\d+$/)[0].length : 3;
  let max = 0;
  students.forEach(s => {
    const m = s.id.match(/\d+$/);
    if (m) max = Math.max(max, parseInt(m[0], 10));
  });
  return prefix + String(max + 1).padStart(width, '0');
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const visible = students.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q));

  const rows = $('rows');
  rows.textContent = '';
  visible.forEach(s => {
    const tr = document.createElement('tr');
    [['ID', s.id], ['Name', s.name], ['Course', s.course], ['Email', s.email]].forEach(([label, val]) => {
      const td = document.createElement('td');
      td.dataset.label = label;
      td.textContent = val;
      tr.appendChild(td);
    });
    const act = document.createElement('td');
    act.dataset.label = 'Action';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'danger';
    btn.textContent = 'Delete';
    btn.addEventListener('click', () => askDelete(s));
    act.appendChild(btn);
    tr.appendChild(act);
    rows.appendChild(tr);
  });

  $('status').textContent = `Showing ${visible.length} of ${students.length} students`;
  const none = visible.length === 0;
  $('empty').hidden = !none;
  if (none) {
    $('empty').textContent = students.length === 0
      ? 'No students yet. Use the form above to add your first student.'
      : `No students match "${$('search').value.trim()}". Try a different name or course.`;
  }
}

function setError(field, msg) {
  $(field + 'Err').textContent = msg;
  $(field).classList.toggle('invalid', !!msg);
}

function handleAdd(e) {
  e.preventDefault(); // stop the page from reloading
  const name = $('name').value.trim();
  const email = $('email').value.trim();
  const course = $('course').value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  setError('name', name ? '' : 'Name is required.');
  setError('course', course ? '' : 'Course is required.');
  setError('email', !email ? 'Email is required.' : (emailOk ? '' : 'Enter a valid email like name@example.com.'));
  if (!name || !course || !emailOk) return;

  students.push({ id: nextId(), name, course, email });
  save();                 // saved to localStorage immediately
  $('addForm').reset();
  render();
}

function askDelete(s) {
  pendingDeleteId = s.id;
  $('confirmText').textContent = `Delete ${s.name} (${s.id})? This cannot be undone.`;
  $('confirmDlg').showModal();
}

function init() {
  $('addForm').addEventListener('submit', handleAdd);
  $('search').addEventListener('input', render);
  ['name', 'email', 'course'].forEach(f =>
    $(f).addEventListener('input', () => setError(f, '')));
  $('cancelBtn').addEventListener('click', () => {
    pendingDeleteId = null;
    $('confirmDlg').close();
  });
  $('okBtn').addEventListener('click', () => {
    students = students.filter(s => s.id !== pendingDeleteId);
    pendingDeleteId = null;
    save();
    $('confirmDlg').close();
    render();
  });
  load().then(render);
}

document.addEventListener('DOMContentLoaded', init);