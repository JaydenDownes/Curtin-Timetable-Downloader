let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarData = {}; // To store fetched calendar data

async function getTimetable() {
    try {
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;

        const authResponse = await fetch('https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-ID': generateUUID(),
                'User-Agent': navigator.userAgent
            },
            body: JSON.stringify({
                curtinId: user,
                password: pass
            })
        });

        if (authResponse.status === 415) {
            showToastWithError('Unsupported Media Type. Make sure your request headers and body are correct.');
            return;
        }

        const authData = await authResponse.json();

        if (authData.errors) {
            showToastWithError('Authentication Error: ' + authData.errors.join(' '));
            return;
        }

        const token = authData.data.token;

        const timetableResponse = await fetch(`https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/students/${user}/study-activities`, {
            method: 'GET',
            headers: {
                'User-Agent': navigator.userAgent,
                'X-Correlation-ID': generateUUID(),
                'Authorization': `Bearer ${token}`
            }
        });

        const timetableData = await timetableResponse.json();

        if (timetableData.errors) {
            showToastWithError('Error: ' + timetableData.errors.join(' '));
            return;
        }

        // Store fetched data in calendarData
        calendarData = timetableData.data;
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('user', user);
        localStorage.setItem('token', token);

        window.location.href = 'app';
    } catch (error) {
        showToastWithError('An unexpected error occurred while fetching the timetable: ' + error.message);
    }
}

function renderCalendar(data) {
    try {
        const calendarEl = document.getElementById('calendar');
        const titleEl = document.getElementById('calendar-title');
        calendarEl.innerHTML = ''; // Clear previous calendar content

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const month = currentMonth;
        const year = currentYear;
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
        titleEl.innerHTML = `<span>${monthName}</span> <span class="year">${year}</span>`;

        let calendarGrid = `
            <div class="calendar-grid">
                ${daysOfWeek.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
            </div>
            <div class="calendar-grid">`;

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            calendarGrid += '<div class="calendar-day"></div>';
        }

        for (let day = 1; day <= lastDate; day++) {
            const dayDate = new Date(year, month, day);
            const isCurrentDay = new Date().toDateString() === dayDate.toDateString();
            const events = data.filter(event => {
                const eventDate = new Date(event.startDateTime);
                return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
            });
            const eventClass = events.length ? `bg${(day % 4) + 1}` : '';
            calendarGrid += `
                <div class="calendar-day ${isCurrentDay ? 'current' : ''}">
                    <div class="calendar-day-number">${day}${isCurrentDay ? '<span class="current-day-marker"></span>' : ''}</div>
                    ${events.map(event => `
                        <div class="calendar-event ${eventClass}">
                            ${event.unit.unitCode} ${event.unit.abbreviatedTitle} ${event.activityType}
                        </div>
                    `).join('')}
                </div>`;
        }

        calendarGrid += '</div>';
        calendarEl.innerHTML = calendarGrid;
    } catch (error) {
        showToastWithError('An unexpected error occurred while rendering the calendar: ' + error.message);
    }
}

function downloadCalendar(user, token) {
    try {
        const cal = new ics();
        calendarData.forEach(event => {
            cal.addEvent(`${event.unit.unitCode} ${event.unit.abbreviatedTitle} ${event.activityType}`, `${event.location.buildingNumber}.${event.location.roomNumber}`, event.startDateTime, event.endDateTime);
        });
        cal.download('calendar');
    } catch (error) {
        showToastWithError('An unexpected error occurred while downloading the calendar: ' + error.message);
    }
}

function generateUUID() {
    try {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    } catch (error) {
        showToastWithError('An unexpected error occurred while generating a UUID: ' + error.message);
    }
}

function prevMonth() {
    try {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(calendarData);
    } catch (error) {
        showToastWithError('An unexpected error occurred while changing to the previous month: ' + error.message);
    }
}

function nextMonth() {
    try {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(calendarData);
    } catch (error) {
        showToastWithError('An unexpected error occurred while changing to the next month: ' + error.message);
    }
}

function checkLogin() {
    try {
        if (localStorage.getItem('loggedIn') !== 'true') {
            window.location.href = 'index.html';
        } else {
            calendarData = JSON.parse(localStorage.getItem('calendarData'));
            renderCalendar(calendarData);
        }
    } catch (error) {
        showToastWithError('An unexpected error occurred while checking login status: ' + error.message);
    }
}

function logout() {
    try {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('calendarData');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    } catch (error) {
        showToastWithError('An unexpected error occurred while logging out: ' + error.message);
    }
}

// Run checkLogin() on calendar page load
if (window.location.pathname.includes('app')) {
    checkLogin();
}
