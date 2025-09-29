// components/Calendar.jsx
import {
  addDays, addMonths,
  endOfMonth,
  endOfWeek, format,
  isSameDay, startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/firebaseClient';

/**
 * Helper: static Tamil month ranges for mapping Tamil month names (approximate).
 * These are used to display Tamil month name for each date cell.
 */
const TAMIL_MONTH_RANGES = [
  { name: 'Thai', start: '-01-14', end: '-02-12' },
  { name: 'Maasi', start: '-02-13', end: '-03-14' },
  { name: 'Panguni', start: '-03-15', end: '-04-13' },
  { name: 'Chithirai', start: '-04-14', end: '-05-14' },
  { name: 'Vaikasi', start: '-05-15', end: '-06-14' },
  { name: 'Aani', start: '-06-15', end: '-07-15' },
  { name: 'Aadi', start: '-07-16', end: '-08-16' },
  { name: 'Avani', start: '-08-17', end: '-09-16' },
  { name: 'Purattasi', start: '-09-17', end: '-10-17' },
  { name: 'Aippasi', start: '-10-18', end: '-11-16' },
  { name: 'Karthigai', start: '-11-17', end: '-12-15' },
  { name: 'Margazhi', start: '-12-16', end: '-01-13' },
];

function getTamilMonthName(date) {
  const y = date.getFullYear();
  for (const r of TAMIL_MONTH_RANGES) {
    const [sM, sD] = r.start.slice(1).split('-').map(Number);
    const [eM, eD] = r.end.slice(1).split('-').map(Number);
    const start = new Date(y, sM - 1, sD);
    let endYear = y;
    if (eM < sM) endYear = y + 1;
    const end = new Date(endYear, eM - 1, eD);
    if (date >= start && date <= end) return r.name;
  }
  return '';
}

function safeParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export default function Calendar({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month'); // 'month'|'week'|'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsMap, setEventsMap] = useState({}); // keyed by 'yyyy-MM-dd'
  const [holidaysMap, setHolidaysMap] = useState({}); // keyed by 'yyyy-MM-dd' -> {name, icon}
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Realtime listener for user's events
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingEvents(true);
    const eventsRef = collection(db, 'users', user.uid, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach(docSnap => {
        const data = docSnap.data();
        // ensure date field exists
        const d = data.date || format(new Date(), 'yyyy-MM-dd');
        if (!map[d]) map[d] = [];
        map[d].push({ id: docSnap.id, title: data.title, time: data.time });
      });
      setEventsMap(map);
      setLoadingEvents(false);
    }, (err) => {
      console.error('events onSnapshot error', err);
      setLoadingEvents(false);
    });

    return () => unsub();
  }, [user?.uid]);

  // Fetch India + Tamil Nadu holidays from Nager.Date and local Tamil festivals API
  useEffect(() => {
    const year = currentMonth.getFullYear();

    const fetchSafe = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        // parse tolerant
        const text = await res.text();
        const parsed = safeParseJSON(text);
        return parsed || [];
      } catch (err) {
        console.error('fetch error', url, err);
        return [];
      }
    };

    (async () => {
      const india = await fetchSafe(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
      const tn = await fetchSafe(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN-TN`);
      // local tamil festivals API (guaranteed to respond)
      const localTamil = await fetchSafe(`/api/tamilFestivals?year=${year}`);

      // merge india + tn (avoid duplicates)
      const merged = [...india];
      for (const h of tn) {
        if (!merged.find(m => m.date === h.date)) merged.push(h);
      }

      // map date-> {name, icon}
      const map = {};
      merged.forEach(h => {
        const name = h.localName || h.name || '';
        const lower = name.toLowerCase();
        let icon = '📅';
        if (lower.includes('diwali') || lower.includes('deepavali')) icon = '🪔';
        else if (lower.includes('pongal')) icon = '🌾';
        else if (lower.includes('independence')) icon = '🇮🇳';
        else if (lower.includes('republic')) icon = '🗳️';
        else if (lower.includes('new year')) icon = '🎉';
        map[h.date] = { name, icon };
      });

      // merge local tamil festivals and override/augment
      (localTamil || []).forEach(f => {
        if (f?.date && f?.name) {
          map[f.date] = { name: f.name, icon: f.icon || '🎉' };
        }
      });

      setHolidaysMap(map);
    })();
  }, [currentMonth]);

  // dates for current view
  const calendarDates = useMemo(() => {
    if (view === 'month') {
      const startMonth = startOfMonth(currentMonth);
      const endMonth = endOfMonth(currentMonth);
      const start = startOfWeek(startMonth, { weekStartsOn: 0 });
      const end = endOfWeek(endMonth, { weekStartsOn: 0 });
      const arr = [];
      let d = start;
      while (d <= end) {
        arr.push(new Date(d));
        d = addDays(d, 1);
      }
      return arr;
    } else if (view === 'week') {
      const start = startOfWeek(selectedDate || new Date(), { weekStartsOn: 0 });
      const arr = [];
      let d = start;
      for (let i = 0; i < 7; i++) {
        arr.push(new Date(d));
        d = addDays(d, 1);
      }
      return arr;
    } else {
      return [startOfDay(selectedDate || new Date())];
    }
  }, [currentMonth, view, selectedDate]);

  function eventsForDate(date) {
    const key = format(date, 'yyyy-MM-dd');
    return (eventsMap[key] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }

  // add event (Firestore)
  async function handleAddEvent(title, time) {
    if (!user?.uid) return alert('Not signed in');
    const dateKey = format(selectedDate || new Date(), 'yyyy-MM-dd');
    try {
      await addDoc(collection(db, 'users', user.uid, 'events'), {
        title,
        time,
        date: dateKey,
        createdAt: new Date()
      });
      // realtime listener will update UI
    } catch (err) {
      console.error('addDoc error', err);
      alert('Failed to add event');
    }
  }

  // delete event
  async function handleDeleteEvent(dateKey, id) {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', id));
      // realtime listener will update UI
    } catch (err) {
      console.error('deleteDoc error', err);
      alert('Failed to delete event');
    }
  }

  // helper to render a day cell
  function DayCell({ dateItem }) {
    const dateKey = format(dateItem, 'yyyy-MM-dd');
    const dayEvents = eventsForDate(dateItem);
    const holiday = holidaysMap[dateKey];
    const today = isSameDay(dateItem, new Date());
    const tamilMonth = getTamilMonthName(dateItem);

    return (
      <div
        key={dateKey}
        className={`calendar-day ${holiday ? 'holiday' : ''} ${today ? 'today' : ''}`}
        onClick={() => setSelectedDate(dateItem)}
      >
        <div className="day-number">{format(dateItem, 'd')}</div>
        <div className="tamil-line"><strong>{tamilMonth}</strong></div>

        {holiday && (
          <div className="holiday-line">
            <span className="holiday-icon">{holiday.icon}</span>
            <span className="holiday-name">{holiday.name}</span>
          </div>
        )}

        {dayEvents.map(ev => (
          <div className="event-card" key={ev.id}>
            <div className="event-left">
              <span className="event-icon">🗓️</span>
              <span className="event-title">{ev.time ? `(${ev.time}) ` : ''}{ev.title}</span>
            </div>
            <button className="delete-event" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(dateKey, ev.id); }}>×</button>
          </div>
        ))}
      </div>
    );
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    setModalOpen(Boolean(selectedDate));
  }, [selectedDate]);

  return (
    <div className="calendar-container">
      <div className="calendar-top">
        <div className="nav">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>◀</button>
          <div className="title">{format(currentMonth, 'MMMM yyyy')}</div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>▶</button>
        </div>

        <div className="controls">
          <div className="views">
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
            <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
          </div>
          <div className="help">
            <button onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()); }}>Today</button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${view}`}>
        {view !== 'day' && ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="day-header">{d}</div>)}

        {calendarDates.map(d => <DayCell key={format(d,'yyyy-MM-dd')} dateItem={d} />)}
      </div>

      {/* Add Event Modal */}
      {modalOpen && selectedDate && (
        <AddEventModal
          date={selectedDate}
          onClose={() => { setSelectedDate(null); setModalOpen(false); }}
          onSave={(title, time) => { handleAddEvent(title, time); setModalOpen(false); setSelectedDate(null); }}
        />
      )}
    </div>
  );
}

// AddEventModal component
function AddEventModal({ date, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Add Event — {format(date, 'MMM d, yyyy')}</h3>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => { if (!title.trim()) return alert('Add a title'); onSave(title.trim(), time); setTitle(''); setTime(''); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
