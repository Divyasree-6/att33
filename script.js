// Demo Configuration - Adjusted for immediate testing
const DEMO_CONFIG = {
    currentLocation: { lat: 40.7128, lng: -74.0060 },
    classLocations: {
        'CS101': { lat: 13.632451,lng: 78.482063 , name: 'Computer Science Lab' },
        'MATH201': { lat: 40.7130, lng: -74.0062, name: 'Mathematics Hall' },
        'PHY301': { lat: 40.7125, lng: -74.0058, name: 'Physics Laboratory' }
    },
    locationTolerance: 100
};

// Student Database (Demo)
const STUDENTS = {
    'CS001': {
        name: 'John Doe',
        password: 'pass123',
        rollNumber: 'CS001',
        biometricId: 'bio_001',
        classes: ['CS101', 'MATH201', 'PHY301'],
        parentEmail: 't.divyasree0601@gmail.com',
        mentorEmail: 'mentor.johndoe@email.com'
    },
    'CS002': {
        name: 'Jane Smith',
        password: 'pass456',
        rollNumber: 'CS002',
        biometricId: 'bio_002',
        classes: ['CS101', 'MATH201'],
        parentEmail: 'parent.janesmith@email.com',
        mentorEmail: 'mentor.janesmith@email.com'
    }
};

// Class Schedule (Demo - adjusted for current time)
function getCurrentTimeSlot() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    const endHour = currentHour + 2;
    const endTime = `${endHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    return `${startTime}-${endTime}`;
}

const CLASS_SCHEDULE = {
    'CS101': {
        name: 'Computer Science Fundamentals',
        time: getCurrentTimeSlot(),
        location: 'Computer Lab A',
        instructor: 'DR.DINESH'
    },
    'MATH201': {
        name: 'Advanced Mathematics',
        time: '11:00-12:00',
        location: 'ROOM 101',
        instructor: 'DR MANIKANDHAN'
    },
    'PHY301': {
        name: 'Physics Laboratory',
        time: '14:00-15:30',
        location: 'ROOM 202',
        instructor: 'MR ABDUL JALEEL'
    }
};

// Global Variables
let currentStudent = null;
let currentClass = null;
let userLocation = null;
let attendanceRecords = {}; // Store attendance status

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('backBtn').addEventListener('click', showDashboard);
    document.getElementById('verifyLocationBtn').addEventListener('click', verifyLocation);
    document.getElementById('scanBiometricBtn').addEventListener('click', startBiometricScan);
    document.getElementById('closeModal').addEventListener('click', closeLocationModal);
    document.getElementById('modalOkBtn').addEventListener('click', closeLocationModal);

    getUserLocation();
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('loginError');
    if (STUDENTS[rollNumber] && STUDENTS[rollNumber].password === password) {
        currentStudent = STUDENTS[rollNumber];
        showDashboard();
        errorDiv.classList.remove('show');
    } else {
        errorDiv.textContent = 'Invalid roll number or password';
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    currentStudent = null;
    currentClass = null;
    showPage('loginPage');
    document.getElementById('loginForm').reset();
}

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showDashboard() {
    document.getElementById('studentName').textContent = currentStudent.name;
    loadTodaysClasses();
    showPage('dashboardPage');
}

function showAttendancePage(classId) {
    currentClass = classId;
    setupAttendancePage();
    showPage('attendancePage');
}

// Time Management
function getClassStatus(classTime) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startTime, endTime] = classTime.split('-');
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const classStart = startHour * 60 + startMin;
    const classEnd = endHour * 60 + endMin;
    if (currentTime < classStart) {
        return { status: 'upcoming', text: 'UPCOMING' };
    } else if (currentTime >= classStart && currentTime <= classEnd) {
        return { status: 'live', text: 'LIVE' };
    } else {
        return { status: 'ended', text: 'Expired' };
    }
}

// Dashboard Functions
function loadTodaysClasses() {
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';
    currentStudent.classes.forEach(classId => {
        const classInfo = CLASS_SCHEDULE[classId];
        const classStatus = getClassStatus(classInfo.time);
        const attendanceKey = `${currentStudent.rollNumber}_${classId}`;
        const attendanceStatus = attendanceRecords[attendanceKey];
        // Auto-mark expired classes as absent
        if (classStatus.status === 'ended' && !attendanceStatus) {
            attendanceRecords[attendanceKey] = {
                status: 'absent',
                time: 'Auto-marked (Class Expired)',
                reason: 'Class time expired'
            };
        }
        const updatedAttendanceStatus = attendanceRecords[attendanceKey];
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        let attendanceStatusDisplay = '';
        let buttonDisplay = '';
        if (updatedAttendanceStatus) {
            attendanceStatusDisplay = `
                <div class="attendance-status">
                    <span class="status-badge ${updatedAttendanceStatus.status === 'present' ? 'status-present' : 'status-absent'}">
                        ${updatedAttendanceStatus.status === 'present' ? '✓ PRESENT' : '✗ ABSENT'}
                    </span>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">Marked at: ${updatedAttendanceStatus.time}</p>
                    <p style="font-size: 11px; color: #888; margin: 2px 0;">Reason: ${updatedAttendanceStatus.reason}</p>
                </div>
            `;
            buttonDisplay = `<button class="btn-primary btn-disabled" disabled>Attendance Taken</button>`;
        } else {
            attendanceStatusDisplay = `
                <div class="attendance-status">
                    <span class="status-badge status-pending">○ PENDING</span>
                </div>
            `;
            if (classStatus.status === 'live') {
                buttonDisplay = `<button class="btn-primary" onclick="showAttendancePage('${classId}')">Take Attendance</button>`;
            } else {
                buttonDisplay = `<button class="btn-primary btn-expired" disabled>Not Available</button>`;
            }
        }
        classCard.innerHTML = `
            <div class="class-status status-${classStatus.status}">
                ${classStatus.text}
            </div>
            <h3> ${classInfo.name}</h3>
            <div class="class-details">
                <p><strong>⏰ Time:</strong> ${classInfo.time}</p>
                <p><strong>📍 Location:</strong> ${classInfo.location}</p>
                <p><strong>👤 Instructor:</strong> ${classInfo.instructor}</p>
            </div>
            ${attendanceStatusDisplay}
            ${buttonDisplay}
        `;
        classesList.appendChild(classCard);
    });
}

// Location Functions
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            (error) => {
                console.log('Location access denied, using demo location');
                userLocation = DEMO_CONFIG.currentLocation;
            }
        );
    } else {
        userLocation = DEMO_CONFIG.currentLocation;
    }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
}

// Attendance Functions
function setupAttendancePage() {
    const classInfo = CLASS_SCHEDULE[currentClass];
    const classInfoDiv = document.getElementById('classInfo');
    const attendanceKey = `${currentStudent.rollNumber}_${currentClass}`;
    const attendanceStatus = attendanceRecords[attendanceKey];
    classInfoDiv.innerHTML = `
        <h2>${classInfo.name}</h2>
        <p><strong>Time:</strong> ${classInfo.time}</p>
        <p><strong>Location:</strong> ${classInfo.location}</p>
        <p><strong>Instructor:</strong> ${classInfo.instructor}</p>
    `;
    // Check if attendance is already taken
    if (attendanceStatus) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById('attendanceResult').classList.add('active');
        const finalResultDiv = document.getElementById('finalResult');
        if (attendanceStatus.status === 'present') {
            finalResultDiv.className = 'result-box show result-success';
            finalResultDiv.innerHTML = `
                <h3>Attendance Already Taken</h3>
                <p>You are marked <strong>PRESENT</strong> for ${classInfo.name}</p>
                <p>Time: ${attendanceStatus.time}</p>
                <button class="btn-primary" onclick="showDashboard()" style="margin-top: 20px;">Back to Dashboard</button>
            `;
        } else {
            finalResultDiv.className = 'result-box show result-error';
            finalResultDiv.innerHTML = `
                <h3>Attendance Already Marked</h3>
                <p>You are marked <strong>ABSENT</strong> for ${classInfo.name}</p>
                <p>Reason: ${attendanceStatus.reason || 'Class time expired'}</p>
                <button class="btn-primary" onclick="showDashboard()" style="margin-top: 20px;">Back to Dashboard</button>
            `;
        }
        return;
    }
    // Reset steps for new attendance
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('locationCheck').classList.add('active');
    document.querySelectorAll('.result-box').forEach(box => {
        box.classList.remove('show', 'result-success', 'result-error', 'result-warning');
    });
    const verifyBtn = document.getElementById('verifyLocationBtn');
    const biometricBtn = document.getElementById('scanBiometricBtn');
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify Location';
    verifyBtn.style.display = 'inline-block';
    verifyBtn.className = 'btn-primary';
    biometricBtn.disabled = false;
    biometricBtn.textContent = 'Start Biometric Scan';
    biometricBtn.style.display = 'inline-block';
    biometricBtn.className = 'btn-primary';
}

function verifyLocation() {
    const verifyBtn = document.getElementById('verifyLocationBtn');
    const resultDiv = document.getElementById('locationResult');
    const classLocation = DEMO_CONFIG.classLocations[currentClass];
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    
    if (!userLocation) {
        markAttendance(false, 'Location not available');
        showDashboardWithMessage('❌ Attendance Failed: Unable to get your location. You have been marked ABSENT.');
        return;
    }
    if (!classLocation) {
        markAttendance(false, 'Class location not configured');
        showDashboardWithMessage('❌ Attendance Failed: Class location not configured. You have been marked ABSENT.');
        return;
    }
    
    const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        classLocation.lat, classLocation.lng
    );
    
    if (distance <= DEMO_CONFIG.locationTolerance) {
        resultDiv.className = 'result-box show result-success';
        resultDiv.textContent = `Location verified! You are in ${classLocation.name} (${Math.round(distance)}m away)`;
        verifyBtn.style.display = 'none';
        setTimeout(() => {
            document.getElementById('locationCheck').classList.remove('active');
            document.getElementById('biometricCheck').classList.add('active');
        }, 1000);
    } else {
        markAttendance(false, `Wrong location - ${Math.round(distance)}m away from ${classLocation.name}`);
        showDashboardWithMessage(`❌ Attendance Failed: You are not in the correct location (${Math.round(distance)}m away). You have been marked ABSENT.`);
    }
}

// Ensure BiometricAuth is available
let biometricAuthInstance;
window.addEventListener('DOMContentLoaded', () => {
    biometricAuthInstance = new BiometricAuth();
    document.getElementById('scanBiometricBtn').addEventListener('click', startBiometricScan);
});





// Scan biometric for attendance
async function startBiometricScan() {
    const scannerBtn = document.getElementById('scanBiometricBtn');
    const resultDiv = document.getElementById('biometricResult');
    const scannerCircle = document.getElementById('scannerAnimation');
    
    // Start scanning animation
    scannerCircle.classList.add('scanning');
    scannerBtn.disabled = true;
    scannerBtn.textContent = 'Scanning...';
    resultDiv.className = 'result-box show';
    resultDiv.textContent = 'Place your finger on the scanner and hold still...';

    const rollNumber = currentStudent?.rollNumber;
    if (!rollNumber) {
        scannerCircle.classList.remove('scanning');
        markAttendance(false, 'Roll number not found');
        showDashboardWithMessage('❌ Attendance Failed: Roll number not found. You have been marked ABSENT.');
        return;
    }

    document.getElementById('login-username').value = rollNumber;

    try {
        // Check if biometric is registered, if not register first
        if (!biometricAuthInstance.hasStoredCredential(rollNumber)) {
            resultDiv.textContent = 'First time: Registering your fingerprint...';
            await biometricAuthInstance.register();
            resultDiv.textContent = 'Registration complete! Now scanning...';
        }
        
        // Simulate scanning delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        await biometricAuthInstance.authenticate();
        
        scannerCircle.classList.remove('scanning');
        scannerCircle.classList.add('success');
        resultDiv.className = 'result-box show result-success';
        resultDiv.textContent = 'Biometric authentication successful!';
        
        setTimeout(() => {
            markAttendance(true, 'Biometric verified');
            showDashboardWithMessage('✅ Attendance Successful: You have been marked PRESENT.');
        }, 1000);
    } catch (error) {
        scannerCircle.classList.remove('scanning');
        scannerCircle.classList.add('error');
        // Immediately mark absent when fingerprint doesn't match
        markAttendance(false, 'Biometric authentication failed');
        showDashboardWithMessage('❌ Attendance Failed: Fingerprint did not match. You have been marked ABSENT.');
    }
}

// Modal Functions
function showLocationError(message) {
    document.getElementById('modalMessage').innerHTML = message;
    document.getElementById('locationModal').style.display = 'block';
    setTimeout(() => {
        showDashboard();
    }, 3000);
}

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
}

// Mark Attendance
function markAttendance(isPresent, reason = null) {
    const attendanceKey = `${currentStudent.rollNumber}_${currentClass}`;
    const now = new Date();
    attendanceRecords[attendanceKey] = {
        status: isPresent ? 'present' : 'absent',
        time: now.toLocaleString(),
        reason: isPresent ? 'Successfully verified' : reason || 'Verification failed'
    };
    
    // Send notifications if absent
    if (!isPresent) {
        sendAbsentNotifications(reason);
    }
    
    // Return to dashboard immediately
    setTimeout(() => {
        showDashboard();
    }, 500);
}

// Show dashboard with popup message
function showDashboardWithMessage(message) {
    showDashboard();
    setTimeout(() => {
        showPopupMessage(message);
    }, 500);
}

// Show popup message on dashboard
function showPopupMessage(message) {
    // Create popup if it doesn't exist
    let popup = document.getElementById('dashboardPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'dashboardPopup';
        popup.className = 'dashboard-popup';
        document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
        <div class="popup-content">
            <span class="popup-close" onclick="closeDashboardPopup()">&times;</span>
            <p>${message}</p>
            <button class="btn-primary" onclick="closeDashboardPopup()">OK</button>
        </div>
    `;
    popup.style.display = 'block';
}

// Close dashboard popup
function closeDashboardPopup() {
    const popup = document.getElementById('dashboardPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Show bottom notification
function showBottomNotification(message) {
    let notification = document.getElementById('bottomNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'bottomNotification';
        notification.className = 'bottom-notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Send absent notifications to parent and mentor
function sendAbsentNotifications(reason) {
    const classInfo = CLASS_SCHEDULE[currentClass];
    const student = currentStudent;
    const now = new Date().toLocaleString();
    
    const message = {
        studentName: student.name,
        rollNumber: student.rollNumber,
        className: classInfo.name,
        time: now,
        reason: reason,
        instructor: classInfo.instructor
    };
    
    // Simulate sending email to parent
    console.log('📧 Email sent to Parent:', student.parentEmail);
    console.log('Subject: Attendance Alert - ' + student.name + ' marked ABSENT');
    console.log('Message:', `Dear Parent,\n\nYour child ${message.studentName} (${message.rollNumber}) was marked ABSENT for ${message.className} on ${message.time}.\n\nReason: ${message.reason}\n\nInstructor: ${message.instructor}\n\nPlease contact the school if you have any questions.\n\nBest regards,\nSmart Attendance System`);
    
    // Simulate sending email to mentor
    console.log('📧 Email sent to Mentor:', student.mentorEmail);
    console.log('Subject: Student Absence Alert - ' + student.name);
    console.log('Message:', `Dear Mentor,\n\nStudent ${message.studentName} (${message.rollNumber}) was marked ABSENT for ${message.className} on ${message.time}.\n\nReason: ${message.reason}\n\nPlease follow up with the student.\n\nBest regards,\nSmart Attendance System`);
    
    // Show notification sent confirmation as bottom popup
    setTimeout(() => {
        showBottomNotification('📧 Notifications sent to parent and mentor about absence.');
    }, 1000);
}

// Export demo functions for console testing
window.DEMO_CONFIG = DEMO_CONFIG;