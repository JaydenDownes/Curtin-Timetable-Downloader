async function getTimetable() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;

    try {
        const url = `https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/sessions`;
        
        const authResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-ID': generateUUID(),
                'User-Agent': navigator.userAgent
            },
            body: JSON.stringify({ curtinId: user, password: pass })
        });

        if (!authResponse.ok) {
            throw new Error('Network response was not ok');
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
                'Authorization': `Bearer ${token}`,
                'User-Agent': navigator.userAgent,
                'X-Correlation-ID': generateUUID()
            }
        });

        if (!timetableResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const timetableData = await timetableResponse.json();

        if (timetableData.errors) {
            alert('Error: ' + timetableData.errors.join(' '));
            return;
        }

        renderCalendar(timetableData.data);

        // Enable download button
        const downloadButton = document.getElementById('downloadButton');
        downloadButton.style.display = 'block';
        downloadButton.onclick = () => downloadCalendar(user, token);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data. Please try again later.');
    }
}

function renderCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: data.map(activity => ({
            title: `${activity.unit.unitCode} ${activity.unit.abbreviatedTitle} ${activity.activityType}`,
            start: new Date(activity.startDateTime).toISOString(),
            end: new Date(activity.endDateTime).toISOString(),
            location: `${activity.location.buildingNumber}.${activity.location.roomNumber} (${activity.location.name})`
        }))
    });
    calendar.render();
}

function downloadCalendar(user, token) {
    const link = document.createElement('a');
    link.href = `https://curtin-timetable.scsa.workers.dev/?https://elsie.curtin.edu.au/api/calendar.ics?user=${user}&token=${token}`;
    link.download = 'calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
