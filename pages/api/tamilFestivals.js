// pages/api/tamilFestivals.js
// Simple API route that returns Tamil festival dates (static/approximate).
// For production you might replace this with a proper astronomical API.

export default function handler(req, res) {
  const year = Number(req.query.year || new Date().getFullYear());

  // Common Tamil festival dates (approximate / typical). Add more years as needed.
  // Pongal typically Jan 14; Tamil New Year typically Apr 14. Some festivals vary — this is best-effort fallback.
  const map = {
    2024: [
      { date: '2024-01-15', name: 'Pongal', icon: '🌾' },
      { date: '2024-04-14', name: 'Tamil New Year', icon: '🎉' },
    ],
    2025: [
      { date: '2025-01-14', name: 'Pongal', icon: '🌾' },
      { date: '2025-04-14', name: 'Tamil New Year', icon: '🎉' },
    ],
    2026: [
      { date: '2026-01-14', name: 'Pongal', icon: '🌾' },
      { date: '2026-04-14', name: 'Tamil New Year', icon: '🎉' },
    ],
  };

  const data = map[year] || map[new Date().getFullYear()] || [];
  res.status(200).json(data);
}
