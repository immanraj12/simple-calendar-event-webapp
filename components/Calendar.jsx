// components/Calendar.jsx
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

function loadEvents(uid) {
  try {
    const raw = localStorage.getItem(`events:${uid}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveEvents(uid, events) {
  localStorage.setItem(`events:${uid}`, JSON.stringify(events));
}

export default function Calendar({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState(() => loadEvents(user.uid)); // { '2025-09-24': [ {title,time,id} ] }

  useEffect(() => {
    // Persist when events change
    saveEvents(user.uid, events);
  }, [events, user.uid]);

  const monthDates = useMemo(() => {
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
    const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });

    const rows = [];
    let day = startDate;
    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [currentMonth]);

  const eventsForDate = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    const list = events[key] || [];
    // sort by time if present
    return list.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  function openAddModal(date) {
    setSelectedDate(date);
  }

  function closeModal() {
    setSelectedDate(null);
  }

  function addEvent(title, time) {
    const key = format(selectedDate, 'yyyy-MM-dd');
    const id = Date.now().toString(36);
    const next = { ...(events || {}) };
    next[key] = [...(next[key] || []), { id, title, time }];
    setEvents(next);
    setSelectedDate(null);
  }

  function deleteEvent(dateKey, id) {
    const next = { ...(events || {}) };
    next[dateKey] = (next[dateKey] || []).filter(e => e.id !== id);
    if (next[dateKey].length === 0) delete next[dateKey];
    setEvents(next);
  }

  return (
    <div style={{ background: 'var(--card)', padding: 16, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>◀</button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>▶</button>
        </div>
        <h2 style={{ margin: 0 }}>{format(currentMonth, 'MMMM yyyy')}</h2>
        <div />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #eee', borderLeft: '1px solid #eee' }}>
        {/* day headers */}
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ padding: 8, borderRight: '1px solid #eee', borderBottom: '1px solid #eee', fontWeight: 600, textAlign: 'center' }}>{d}</div>
        ))}

        {monthDates.flat().map((dateItem) => {
          const inMonth = isSameMonth(dateItem, currentMonth);
          const key = format(dateItem, 'yyyy-MM-dd');
          const dayEvents = eventsForDate(dateItem);
          return (
            <div
              key={key}
              onClick={() => openAddModal(dateItem)}
              style={{
                minHeight: 88,
                borderRight: '1px solid #eee',
                borderBottom: '1px solid #eee',
                padding: 8,
                background: inMonth ? 'transparent' : '#f9f9f9',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', right: 8, top: 8, fontSize: 12, color: '#666' }}>{format(dateItem, 'd')}</div>

              <div style={{ marginTop: 20 }}>
                {dayEvents.slice(0,3).map(ev => (
                  <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div title={ev.title} style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.time ? `(${ev.time}) ` : ''}{ev.title}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteEvent(key, ev.id); }} style={{ marginLeft: 6, padding: '2px 6px', fontSize: 12 }}>×</button>
                  </div>
                ))}
                {dayEvents.length > 3 && <div style={{ fontSize: 12, color: '#666' }}>+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedDate && (
        <AddEventModal date={selectedDate} onClose={closeModal} onSave={addEvent} />
      )}
    </div>
  );
}

/* Small inline modal — keeps things simple */
function AddEventModal({ date, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', zIndex: 50
    }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: 20, borderRadius: 8, width: 340 }}>
        <h3 style={{ marginTop: 0 }}>Add event — {format(date, 'MMM d, yyyy')}</h3>
        <div style={{ marginBottom: 8 }}>
          <input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, background: '#e5e7eb', border: 'none' }}>Cancel</button>
          <button onClick={() => { if (!title.trim()) return alert('Add a title'); onSave(title.trim(), time); }} style={{ padding: '8px 12px', borderRadius: 6, background: '#111', color: '#fff', border: 'none' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
