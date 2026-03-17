// นำเข้า Firebase SDK จาก Google CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. นำ Firebase Config ของคุณมาใส่ตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyDv1u9Bm5pMIX6nY__xNk3OkLbxrINTUn0",
  authDomain: "cru-actitrack.firebaseapp.com",
  projectId: "cru-actitrack",
  storageBucket: "cru-actitrack.firebasestorage.app",
  messagingSenderId: "370601049848",
  appId: "1:370601049848:web:97c84785c3471bec06c50d",
  measurementId: "G-SVK8TCQZ1Q"
};

// 2. เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let unsubscribeSnapshot = null; // ตัวแปรสำหรับหยุดการดึงข้อมูลเมื่อล็อคเอาท์

// 3. ติดตามสถานะการล็อคอิน (รู้ได้ทันทีว่าใครเข้าสู่ระบบอยู่)
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    window.switchScreen('screen-main');
    loadActivities(); // ดึงข้อมูลของคนนั้นๆ มาแสดง
  } else {
    currentUser = null;
    window.switchScreen('screen-login');
    if (unsubscribeSnapshot) unsubscribeSnapshot(); // หยุดดึงข้อมูล
  }
});

// ================= ระบบล็อคอิน =================
window.handleGoogleLogin = async () => {
  try {
    await signInWithPopup(auth, provider);
    // เข้าสู่ระบบสำเร็จ ระบบจะไปทำงานที่ onAuthStateChanged อัตโนมัติ
  } catch (error) {
    console.error("Login Error:", error);
    alert("เกิดข้อผิดพลาดในการล็อคอิน: " + error.message);
  }
};

window.handleLogin = () => {
  alert("เพื่อความปลอดภัยและง่ายที่สุด แนะนำให้ใช้ 'เข้าสู่ระบบด้วย Google' ด้านล่างครับ!");
};

window.logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// ================= ระบบเปลี่ยนหน้าจอ =================
window.switchScreen = (screenId) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if (screenId === 'screen-add') {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('input-datetime').value = now.toISOString().slice(0, 16);
  }
};

// ================= ระบบฐานข้อมูล (Firestore) =================

// ฟังก์ชันบันทึกกิจกรรมลง Firebase
window.saveActivity = async () => {
  if (!currentUser) return alert("กรุณาล็อคอินก่อนบันทึกข้อมูล");

  const name = document.getElementById('input-name').value;
  const datetime = document.getElementById('input-datetime').value;
  const hours = parseFloat(document.getElementById('input-hours').value);

  if (!name || !datetime || isNaN(hours) || hours <= 0) {
    alert("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
    return;
  }

  const dateObj = new Date(datetime);
  const formattedDate = `${dateObj.getDate()} พ.ค. 2567 / ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  try {
    // บันทึกลง Collection ชื่อ 'activities'
    await addDoc(collection(db, "activities"), {
      userId: currentUser.uid, // เก็บว่าใครเป็นคนบันทึก
      name: name,
      dateText: formattedDate,
      hours: hours,
      createdAt: serverTimestamp() // เวลาที่บันทึก
    });

    // ล้างฟอร์มและกลับหน้าแรก
    document.getElementById('input-name').value = '';
    document.getElementById('input-hours').value = '';
    window.switchScreen('screen-main');

  } catch (error) {
    console.error("Error adding document: ", error);
    alert("บันทึกข้อมูลไม่สำเร็จ");
  }
};

// ฟังก์ชันดึงข้อมูลจาก Firebase มาแสดง (แบบ Real-time)
function loadActivities() {
  if (!currentUser) return;

  const listEl = document.getElementById('activity-list');
  const totalEl = document.getElementById('display-total-hours');

  // ดึงเฉพาะข้อมูลของคนที่ล็อคอินอยู่ เรียงตามเวลาที่สร้างล่าสุด
  const q = query(
    collection(db, "activities"), 
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  // onSnapshot จะดึงข้อมูลอัตโนมัติเมื่อมีการอัปเดต
  unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
    let activities = [];
    let totalHours = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push(data);
      totalHours += data.hours;
    });

    // อัปเดตชั่วโมงรวม
    totalEl.innerText = totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1);

    // อัปเดตรายการบนหน้าจอ
    if (activities.length === 0) {
      listEl.innerHTML = '<p style="text-align:center; color:#999; font-size:12px; margin-top:20px;">ยังไม่มีกิจกรรม กด + เพื่อเพิ่มเลย</p>';
    } else {
      listEl.innerHTML = activities.map(item => `
        <div class="card">
          <div class="card-left">
            <div class="card-icon">🗓️</div>
            <div class="card-info">
              <h4>${item.name}</h4>
              <p>${item.dateText}</p>
            </div>
          </div>
          <div class="card-hours">${item.hours} ชม.</div>
        </div>
      `).join('');
    }
  });
}
