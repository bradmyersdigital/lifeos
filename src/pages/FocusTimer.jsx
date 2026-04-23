import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function FocusTimer() {
  const [duration, setDuration] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [sessions, setSessions] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    supabase.from('focus_sessions').select('*').order('completed_at', { ascending: false }).limit(10).then(({ data }) => setSessions(data || []))
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setFinished(true)
            supabase.from('focus_sessions').insert({ duration_minutes: duration }).then(({ data }) => {
              if (data?.[0]) setSessions(prev => [data[0], ...prev])
            })
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = () => { setFinished(false); setRunning(true) }
  const pause = () => setRunning(false)
  const reset = () => { setRunning(false); setFinished(false); setSecondsLeft(duration * 60) }
  const setPreset = (mins) => { setDuration(mins); setSecondsLeft(mins * 60); setRunning(false); setFinished(false) }

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const pct = ((duration * 60 - secondsLeft) / (duration * 60)) * 100
  const circumference = 2 * Math.PI * 90

  return (
    <div>
      {/* Quote header */}
      <div style={{ background: '#161618', border: '1px solid #1e1208', borderLeft: '3px solid var(--accent)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#d4d2cc', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 6 }}>"You will never find time for anything. If you want time you must make it."</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, fontFamily: "'DM Mono'" }}>— Charles Buxton</div>
      </div>

      {/* Timer circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r="90" fill="none" stroke="#1e1e24" strokeWidth="10" />
            <circle cx="110" cy="110" r="90" fill="none" stroke="var(--accent)" strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={circumference - (pct / 100) * circumference}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 500, fontFamily: "'DM Mono'", color: finished ? '#16a34a' : '#e8e6e1', letterSpacing: -1 }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{finished ? '🎉 Session complete!' : running ? 'Focus time' : 'Ready'}</div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {[15,25,45,60,90].map(m => (
          <div key={m} onClick={() => setPreset(m)}
            style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: duration === m && !running ? 'var(--accent-dim)' : '#161618', borderColor: duration === m && !running ? 'var(--accent-border)' : '#242428', color: duration === m && !running ? 'var(--accent)' : '#666' }}>
            {m}m
          </div>
        ))}
      </div>

      {/* Custom duration */}
      {!running && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#242428' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={duration} min={1} max={180}
              onChange={e => { const v = parseInt(e.target.value)||1; setPreset(Math.min(180, Math.max(1,v))) }}
              style={{ width: 60, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '8px 10px', fontSize: 15, color: '#e8e6e1', fontFamily: "'DM Sans'", textAlign: 'center', outline: 'none' }} />
            <div style={{ fontSize: 13, color: '#555' }}>min custom</div>
          </div>
          <div style={{ flex: 1, height: 1, background: '#242428' }} />
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <div onClick={reset} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#161618', border: '1px solid #242428', color: '#666', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}>Reset</div>
        {!running
          ? <div onClick={start} className="btn-primary" style={{ flex: 2, padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}>{finished ? 'Start again' : secondsLeft < duration * 60 ? 'Resume' : 'Start focus'}</div>
          : <div onClick={pause} style={{ flex: 2, padding: 14, borderRadius: 14, background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}>Pause</div>
        }
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <div className="section-label">Recent sessions</div>
          {sessions.slice(0,5).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 18 }}>🎯</div>
                <div style={{ fontSize: 14, color: '#d4d2cc' }}>{s.duration_minutes} minute session</div>
              </div>
              <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'" }}>{new Date(s.completed_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
