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

        if (!authResponse.ok) {
            showToastWithError(`Authentication failed with status ${authResponse.status}`);
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

        if (!timetableResponse.ok) {
            showToastWithError(`Failed to fetch timetable with status ${timetableResponse.status}`);
            return;
        }

        const timetableData = await timetableResponse.json();

        if (timetableData.errors) {
            showToastWithError('Error: ' + timetableData.errors.join(' '));
            return;
        }

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
            <div class="calendar-header-grid">
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

document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const originalText = button.innerHTML; // Save the original button text
        // Show loading state
        button.innerHTML = `
            <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
            </svg>
            Loading...
        `;

        try {
            await downloadCalendar();
        } catch (error) {
            console.error('Error downloading calendar:', error);
        } finally {
            // Revert to original text after download
            button.innerHTML = originalText;
        }
    });
});

async function downloadCalendar() {
    try {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        const url = `https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/students/${user}/study-activities`;
        const userAgent = navigator.userAgent;
        const correlationId = generateUUID();

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': userAgent,
                'X-Correlation-ID': correlationId
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const activities = data.data || [];

        let calendar = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Sample Corp//NONSGML Event//EN\n';
        activities.forEach(activity => {
            calendar += 'BEGIN:VEVENT\n';
            calendar += `DTSTART:${formatDateTime(activity.startDateTime)}\n`;
            calendar += `DTEND:${formatDateTime(activity.endDateTime)}\n`;
            calendar += `SUMMARY:${activity.unit.unitCode} ${activity.unit.abbreviatedTitle} ${activity.activityType}\n`;
            calendar += `LOCATION:${activity.location.buildingNumber}.${activity.location.roomNumber} (${activity.location.name})\n`;
            calendar += 'END:VEVENT\n';
        });
        calendar += 'END:VCALENDAR';

        const blob = new Blob([calendar], { type: 'text/calendar' });
        const urlBlob = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = 'calendar.ics';
        a.click();

        URL.revokeObjectURL(urlBlob);
    } catch (error) {
        console.error('Error downloading calendar:', error);
    }
}

function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // Format: 20240722T123000Z
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

function showToastWithError(errorMessage) {
    const toast = document.getElementById('toast-warning');
    const messageElement = document.getElementById('toast-message');
    const closeButton = document.getElementById('toast-close');
    
    // Update the message
    messageElement.textContent = `${errorMessage}`;
    
    // Show the toast
    toast.classList.remove('hidden');
    
    // Hide the toast after 10 seconds
    const hideToastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 10000); // 10 seconds
    
    // Event listener for the close button
    closeButton.addEventListener('click', () => {
        clearTimeout(hideToastTimeout); // Clear the timeout if user closes it early
        toast.classList.add('hidden');
    });
}

function handleLogin(event) {
    event.preventDefault(); // Prevent the default form submission
    getTimetable(); // Call your login function
}
