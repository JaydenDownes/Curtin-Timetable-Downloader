let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarData = {}; // To store fetched calendar data

async function getTimetable() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;

    const authResponse = await fetch('https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': generateUUID(),
            'User-Agent': navigator.userAgent
        },
        body: JSON.stringify({ curtinId: user, password: pass })
    });

    if (authResponse.status === 415) {
        alert('Unsupported Media Type. Make sure your request headers and body are correct.');
        return;
    }

    const authData = await authResponse.json();

    if (authData.errors) {
        alert('Authentication Error: ' + authData.errors.join(' '));
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
        alert('Error: ' + timetableData.errors.join(' '));
        return;
    }

    // Store fetched data in calendarData
    calendarData = timetableData.data;

    renderCalendar(calendarData);

    // Enable download button
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = 'block';
    downloadButton.onclick = () => downloadCalendar(user, token);
}

function renderCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    const titleEl = document.getElementById('calendar-title');
    calendarEl.innerHTML = ''; // Clear previous calendar content

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get the current month and year
    const month = currentMonth;
    const year = currentYear;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    titleEl.innerHTML = `<span>${monthName}</span> <span class="year">${year}</span>`;

    // Generate calendar grid
    let calendarGrid = `
        <div class="calendar-grid">
            ${daysOfWeek.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
        </div>
        <div class="calendar-grid">`;

    // Calculate the first day of the month and the number of days in the month
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarGrid += '<div class="calendar-day"></div>';
    }

    // Add days of the month
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
}

function downloadCalendar(user, token) {
    const cal = new ics();
    calendarData.forEach(event => {
        cal.addEvent(
            `${event.unit.unitCode} ${event.unit.abbreviatedTitle} ${event.activityType}`,
            `${event.location.buildingNumber}.${event.location.roomNumber}`,
            event.startDateTime,
            event.endDateTime
        );
    });
    cal.download('calendar');
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    fetchCalendarData(currentYear, currentMonth);
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    fetchCalendarData(currentYear, currentMonth);
}

async function fetchCalendarData(year, month) {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;

    const tokenResponse = await fetch('https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': generateUUID(),
            'User-Agent': navigator.userAgent
        },
        body: JSON.stringify({ curtinId: user, password: pass })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.errors) {
        alert('Authentication Error: ' + tokenData.errors.join(' '));
        return;
    }

    const token = tokenData.data.token;

    const calendarResponse = await fetch(`https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/students/${user}/study-activities`, {
        method: 'GET',
        headers: {
            'User-Agent': navigator.userAgent,
            'X-Correlation-ID': generateUUID(),
            'Authorization': `Bearer ${token}`
        }
    });

    const calendarData = await calendarResponse.json();

    if (calendarData.errors) {
        alert('Error fetching calendar data: ' + calendarData.errors.join(' '));
        return;
    }

    renderCalendar(calendarData.data);
}
