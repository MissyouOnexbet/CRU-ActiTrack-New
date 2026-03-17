// เก็บข้อมูลกิจกรรม
const EMOJIS = ['📚', '💻', '🔬', '✏️', '🎨', '🏃', '🎵', '📝', '🧮', '🌍'];
let activities = JSON.parse(localStorage.getItem('studytrack') || '[]');

// ฟังก์ชันสลับหน้าจอ (Dashboard / Log)
function showScreen(id, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'dashboard') renderDashboard();
}

// ฟังก์ชันแสดงข้อมูลบน Dashboard
function renderDashboard() {
  const list = document.getElementById('activity-list');
  const total = activities.reduce((s, a) => s + a.hours, 0);
  
  document.getElementById('total-hours').innerHTML = `${total}<span>hrs</span>`;
  document.getElementById('total-activities').textContent = activities.length;

  if (activities.length === 0) {
    list.innerHTML = '<p class="empty-state">No activities yet.</p>';
    return;
  }

  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map((a, i) => `
    <div class="activity-item">
      <div class="activity-icon">${EMOJIS[i % EMOJIS.length]}</div>
      <div class="activity-info">
        <div class="activity-name">${a.name}</div>
        <div class="activity-date">${a.date}</div>
      </div>
      <div class="activity-hours">${a.hours}<span>hr</span></div>
    </div>
  `).join('');
}

// ฟังก์ชันบันทึกข้อมูล
function saveActivity(e) {
  const name = document.getElementById('activity-name').value;
  const date = document.getElementById('activity-date').value;
  const hours = parseFloat(document.getElementById('activity-hours-input').value);

  if (!name || !date || isNaN(hours)) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  activities.push({ name, date, hours });
  localStorage.setItem('studytrack', JSON.stringify(activities));
  
  showToast('✅ Activity saved!');
  renderDashboard();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// เริ่มต้นโปรแกรม
renderDashboard();
function showToast() {
  const toast = document.querySelector('.toast');
  toast.classList.add('show');
  
  // ให้หายไปเองหลังจาก 3 วินาที
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
