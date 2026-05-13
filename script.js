// ==========================================
// AURAFLOW CORE SYSTEM - DARK GLASS EDITION
// ==========================================

// --- 1. DATABASE & STATE MANAGEMENT ---
const defaultUsers = {
    "master": { pass: "master", role: "Master", name: "System Overlord" },
    "friday": { pass: "ai", role: "Master", name: "Friday (System AI)" },
    "dev": { pass: "dev123", role: "Developer", name: "System Developer" },
    "admin": { pass: "admin", role: "Admin", name: "Principal System" },
    "teach1": { pass: "123", role: "Teacher", name: "Mr. Sharma", subject: "Math", classTeacherOf: "10-A" },
    "stud1": { pass: "123", role: "Student", name: "Rahul", classGrade: "10", section: "A", msgs: [], files: [], timetable: [], marks: [] }
};

let users = JSON.parse(localStorage.getItem('auraUsers')) || defaultUsers;
if (!users["dev"]) { users["dev"] = defaultUsers["dev"]; saveDB(); }

let meetings = JSON.parse(localStorage.getItem('auraMeetings')) || [];
let timetables = JSON.parse(localStorage.getItem('auraTimetables')) || []; 
let currentUser = null;
let originalUser = null;

function saveDB() {
    localStorage.setItem('auraUsers', JSON.stringify(users));
    localStorage.setItem('auraMeetings', JSON.stringify(meetings));
    localStorage.setItem('auraTimetables', JSON.stringify(timetables));
}

// --- 2. UI UTILITIES (Toasts) ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
               type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
               '<i class="fas fa-info-circle"></i>';
               
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 3. AUTHENTICATION ---
function login() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('login-error');
    
    if (users[u] && users[u].pass === p) {
        errorMsg.style.display = 'none';
        enterSystem(u);
        showToast(`Welcome back, ${users[u].name}!`, 'success');
    } else {
        errorMsg.style.display = 'block';
        errorMsg.innerText = "Invalid Credentials";
        document.getElementById('password').value = '';
    }
}

function enterSystem(username) {
    currentUser = { ...users[username], id: username };
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
    
    updateSidebar(currentUser.role);
    checkImpersonationStatus();
    
    document.getElementById('master-panel').classList.add('hidden');
    document.getElementById('generic-welcome').classList.add('hidden');

    if (['Master', 'Admin', 'Developer'].includes(currentUser.role)) {
        document.getElementById('master-panel').classList.remove('hidden');
        document.getElementById('welcome-msg-master').innerText = `${currentUser.role} Dashboard`;
        if (currentUser.role === 'Developer') renderDevTimetableLog();
        renderSurveillanceLog();
        renderUserList();
    } else {
        document.getElementById('generic-welcome').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser.name}`;
    }

    if (currentUser.role === 'Student') {
        showSection('student-tools'); renderStudentData();
    } else if (currentUser.role === 'Teacher') { 
        showSection('tools'); renderTeacherTimetable(); 
    } else if (currentUser.role === 'Developer') {
        showSection('developer'); 
    } else {
        showSection('home');
    }
}

function updateSidebar(role) {
    document.getElementById('admin-links').classList.add('hidden');
    document.getElementById('teacher-links').classList.add('hidden');
    document.getElementById('student-links').classList.add('hidden');
    document.getElementById('dev-links').classList.add('hidden');
    
    if (['Master', 'Admin'].includes(role)) document.getElementById('admin-links').classList.remove('hidden');
    if (role === 'Teacher') document.getElementById('teacher-links').classList.remove('hidden');
    if (role === 'Student') document.getElementById('student-links').classList.remove('hidden');
    if (role === 'Developer') document.getElementById('dev-links').classList.remove('hidden');
}

function checkImpersonationStatus() {
    if (originalUser) {
        document.getElementById('return-section').classList.remove('hidden');
        document.getElementById('logout-btn').classList.add('hidden');
    } else {
        document.getElementById('return-section').classList.add('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
    }
}

function logout() { location.reload(); }
function loginAs(targetId) { originalUser = currentUser; enterSystem(targetId); showToast(`Logged in as ${users[targetId].name}`, 'info'); }
function returnToAdmin() { if (originalUser) { const adminId = originalUser.id; originalUser = null; enterSystem(adminId); showToast('Returned to main account', 'info'); } }

// --- 4. TEACHER FUNCTIONS ---
function findUser(query) {
    if (!query) return null;
    if (users[query]) return { id: query, ...users[query] };
    const foundKey = Object.keys(users).find(k => users[k].name.toLowerCase().includes(query.toLowerCase()));
    if (foundKey) return { id: foundKey, ...users[foundKey] };
    return null;
}

function addMarks() {
    const query = document.getElementById('rm-search').value.trim();
    const sub = document.getElementById('rm-sub').value.trim();
    const score = document.getElementById('rm-score').value.trim();
    if (!query || !sub || !score) return showToast("Please fill all fields", "error");
    const student = findUser(query);
    if (student && student.role === 'Student') {
        if (!users[student.id].marks) users[student.id].marks = [];
        users[student.id].marks.push({ subject: sub, score: score });
        saveDB(); showToast(`Mark added for ${student.name}`, 'success');
        document.getElementById('rm-sub').value = ''; document.getElementById('rm-score').value = '';
    } else { showToast("Student not found", "error"); }
}

function clearMarks() {
    const student = findUser(document.getElementById('rm-search').value);
    if (student && student.role === 'Student') {
        if (confirm(`Clear ALL marks for ${student.name}?`)) { users[student.id].marks = []; saveDB(); showToast("Marks cleared", "success"); }
    } else { showToast("Student not found", "error"); }
}

function loadClassroom() {
    const cls = document.getElementById('t-filter-class').value;
    const sec = document.getElementById('t-filter-sec').value;
    const list = document.getElementById('classroom-list');
    let html = "";
    Object.keys(users).forEach(key => {
        const u = users[key];
        if (u.role === 'Student' && u.classGrade === cls && u.section === sec) {
            html += `<tr><td>${key}</td><td>${u.name}</td><td><button class="btn-action btn-green" onclick="quickAttend('${key}')"><i class="fas fa-check"></i> Present</button></td></tr>`;
        }
    });
    list.innerHTML = html || "<tr><td colspan='3' style='text-align:center; padding: 20px; color: #888;'>No students found.</td></tr>";
}
function quickAttend(id) { users[id].msgs.push(`Attendance marked Present on ${new Date().toLocaleDateString()}`); saveDB(); showToast(`Attendance marked for ${users[id].name}`, 'success'); }

function createMeeting() {
    const topic = document.getElementById('m-topic').value;
    const link = document.getElementById('m-link').value;
    if (topic && link) { 
        meetings.unshift({ id: Date.now(), host: currentUser.name, topic, link, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }); 
        saveDB(); showToast("Live class started!", "success");
        document.getElementById('m-topic').value = ''; document.getElementById('m-link').value = '';
    } else { showToast("Provide topic and link", "error"); }
}

function renderTeacherTimetable() {
    const tbody = document.getElementById('t-timetable-body');
    if (tbody) tbody.innerHTML = timetables.length ? timetables.map(t => `<tr><td><strong style="color:white;">${t.day}</strong></td><td>Period ${t.time}</td><td>${t.subject}</td><td>${t.teacher}</td></tr>`).join('') : "<tr><td colspan='4' style='text-align:center;'>Schedule empty.</td></tr>";
}

// --- 5. ADMIN & DEV FUNCTIONS ---
function toggleAdminFields(role) {
    document.getElementById('field-student').classList.add('hidden'); document.getElementById('field-teacher').classList.add('hidden');
    if (role === 'Student') document.getElementById('field-student').classList.remove('hidden');
    if (role === 'Teacher') document.getElementById('field-teacher').classList.remove('hidden');
}

function registerUser() {
    const u = document.getElementById('new-user').value.trim(), n = document.getElementById('new-name').value.trim(), r = document.getElementById('new-role').value;
    if (!u || !n) return showToast("Provide ID and Name", "error");
    if (users[u]) return showToast("ID already exists", "error");
    let cls = "", sec = "", sub = "", tOf = "";
    if (r === 'Student') { cls = document.getElementById('new-class').value; sec = document.getElementById('new-sec').value; }
    if (r === 'Teacher') { sub = document.getElementById('new-subject').value; tOf = document.getElementById('new-class-teacher').value; }
    users[u] = { pass: "123", role: r, name: n, classGrade: cls, section: sec, subject: sub, classTeacherOf: tOf, msgs: [], files: [], marks: [] };
    saveDB(); renderUserList(); showToast(`User created!`, "success");
}

function renderUserList() {
    const list = document.getElementById('user-list'); list.innerHTML = "";
    Object.keys(users).forEach(key => {
        if (currentUser.role !== 'Master' && ['MASTER','DEVELOPER'].includes(users[key].role.toUpperCase())) return; 
        const u = users[key];
        let extra = u.role === 'Student' ? `<span>${u.classGrade}-${u.section}</span>` : u.role === 'Teacher' ? `<span>${u.subject}</span>` : "";
        let loginBtn = key === currentUser.id ? "" : `<button class="btn-db btn-login-as" onclick="loginAs('${key}')"><i class="fas fa-sign-in-alt"></i></button>`;
        list.innerHTML += `<div class="db-row"><div class="user-details" style="color:white;">${u.name} <span>${u.role}</span> ${extra}</div><div class="action-btns">${loginBtn}<button class="btn-db btn-pass" onclick="showToast('Pass: ${u.pass}', 'info')"><i class="fas fa-key"></i></button><button class="btn-db btn-del" onclick="deleteUser('${key}')"><i class="fas fa-trash"></i></button></div></div>`;
    });
}
function deleteUser(key) { if (confirm(`Delete ${users[key].name}?`)) { delete users[key]; saveDB(); renderUserList(); showToast("Deleted", "success"); } }
function devAddTimetable() { /* implementation same as previous */ }
function clearTimetable() { /* implementation same as previous */ }
function renderDevTimetableLog() { /* implementation same as previous */ }
function devAddStudent() { /* implementation same as previous */ }

// --- 6. STUDENT VIEWS ---
function renderStudentData() {
    document.getElementById('s-meeting-list').innerHTML = meetings.length ? meetings.map(m => `<li><span style="font-weight:600; color:white;"><i class="fas fa-video" style="color:var(--accent-pink)"></i> ${m.topic}</span> <a href="${m.link}" class="join-link" target="_blank">JOIN CLASS</a></li>`).join('') : "<li>No active classes.</li>";
    document.getElementById('s-msg-list').innerHTML = currentUser.msgs && currentUser.msgs.length ? currentUser.msgs.reverse().map(m => `<li><i class="fas fa-bell text-warning"></i> ${m}</li>`).join('') : "<li>No new notices.</li>";
    document.getElementById('s-file-list').innerHTML = currentUser.files && currentUser.files.length ? currentUser.files.reverse().map(f => `<li><a href="#" style="color:var(--accent-blue);" onclick="showToast('Downloading ${f}...', 'info')"><i class="fas fa-paperclip"></i> ${f}</a></li>`).join('') : "<li>No files available.</li>";
    const tbody = document.getElementById('s-report-body');
    let total = 0;
    if (currentUser.marks && currentUser.marks.length > 0) {
        tbody.innerHTML = currentUser.marks.map(m => {
            total += parseInt(m.score); let isPass = m.score >= 35;
            return `<tr><td><strong style="color:white;">${m.subject}</strong></td><td>${m.score}</td><td style="color:${isPass?'var(--success)':'var(--danger)'}; font-weight:bold;">${isPass?'PASS':'FAIL'}</td></tr>`;
        }).join('');
        document.getElementById('s-overall-pct').innerText = Math.round((total / (currentUser.marks.length * 100)) * 100) + "%";
    } else { tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>No marks.</td></tr>"; document.getElementById('s-overall-pct').innerText = "0%"; }
}
function renderSurveillanceLog() { document.getElementById('surveillance-log').innerHTML = meetings.length ? meetings.map(m => `<li><span style="color:var(--accent-blue);">[${m.time}]</span> <strong style="color:white;">${m.host}</strong> initiated <em>${m.topic}</em></li>`).join('') : "<li>System idle.</li>"; }
function showSection(id) { document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden')); document.getElementById(`section-${id}`).classList.remove('hidden'); document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active')); if (document.getElementById(`nav-${id}`)) document.getElementById(`nav-${id}`).classList.add('active'); }

// --- 7. INITIALIZATION & 3D BACKGROUND ENGINE ---
window.onload = () => { 
    // Handle Boot Screen Fade out
    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        boot.style.opacity = '0';
        setTimeout(() => boot.style.display = 'none', 800);
    }, 2500); 

    // Handle Curated.Media 3D Interactive Background Parallax
    const interactiveObject = document.getElementById('interactive-object');
    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate percentage of mouse position across screen
        const xPercent = (mouseX / windowWidth) - 0.5;
        const yPercent = (mouseY / windowHeight) - 0.5;
        
        // Move the center object slightly based on mouse position
        if(interactiveObject) {
            interactiveObject.style.transform = `translate(calc(-50% + ${xPercent * 80}px), calc(-50% + ${yPercent * 80}px)) rotateX(${-yPercent * 40}deg) rotateY(${xPercent * 40}deg)`;
        }
    });
};
