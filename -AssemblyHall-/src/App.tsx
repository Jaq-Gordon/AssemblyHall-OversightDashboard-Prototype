import { useState, useMemo } from "react"
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import loginPhoto from "@/imports/workers.jpg"
import { ImageWithFallback } from "@/components/figma/ImageWithFallback"

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "login" | "dashboard" | "crew-calendar" | "volunteers"

type Volunteer = {
  id: number
  name: string
  role: string
  phone: string
  email: string
  availability: "available" | "unavailable" | "partial"
  daysAvailable: number
}

type Crew = {
  id: number
  name: string
  leader: string
  color: string
  volunteers: Volunteer[]
  monthData: MonthData[]
}

type MonthData = {
  month: string
  needed: number
  available: number
  unavailable: number
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function makeMonthData(seed: number): MonthData[] {
  return MONTHS.map((month, i) => {
    const needed = 12 + Math.floor(Math.sin(i * seed) * 4 + 4)
    const available = Math.max(2, Math.floor(needed * (0.55 + Math.cos(i + seed) * 0.2)))
    const unavailable = Math.max(1, Math.floor(needed * (0.2 + Math.sin(i * 2 + seed) * 0.1)))
    return { month, needed, available, unavailable }
  })
}

function makeVolunteers(crewId: number, names: string[], roles: string[]): Volunteer[] {
  return names.map((name, i) => {
    const avail = [10, 18, 22, 14, 20, 8, 16, 24, 12, 19, 7, 21, 15, 23, 11][i % 15]
    const status: Volunteer["availability"] = avail >= 18 ? "available" : avail >= 10 ? "partial" : "unavailable"
    return {
      id: crewId * 100 + i,
      name,
      role: roles[i % roles.length],
      phone: `+44 7${700 + crewId * 10 + i} ${100000 + i * 7331}`.slice(0, 15),
      email: `${name.split(" ")[0].toLowerCase()}@lahva.org`,
      availability: status,
      daysAvailable: avail,
    }
  })
}

const CREWS: Crew[] = [
  {
    id: 1, name: "Audio / Visual", leader: "Sarah Chen", color: "#4A90D9",
    volunteers: makeVolunteers(1,
      ["James Osei","Amara Diallo","Lena Fischer","Tom Reyes","Priya Menon","Carlos Vega","Nina Okonkwo","Ben Hartley","Yasmin Ali","Marco Rossi","Kenji Tanaka","Sofia Andrade","Luke Barnes","Fatima Hassan","Owen Clarke"],
      ["Sound Engineer","Camera Operator","AV Technician","Stage Manager"]),
    monthData: makeMonthData(1.3),
  },
  {
    id: 2, name: "Setup & Breakdown", leader: "Marcus White", color: "#E88C3A",
    volunteers: makeVolunteers(2,
      ["Rachel Kim","David Olu","Harriet Brown","Ivan Petrov","Mei Lin","Samuel Adeyemi","Grace O'Brien","Elijah Moore","Tara Singh","Felix Wagner","Aisha Bello","Connor Walsh","Yuki Nakamura","Beatriz Lima","Rian Murphy"],
      ["Crew Lead","Stage Hand","Equipment Rigger","Logistics"]),
    monthData: makeMonthData(2.1),
  },
  {
    id: 3, name: "Hospitality", leader: "Priya Nair", color: "#5BAD72",
    volunteers: makeVolunteers(3,
      ["Monica Torres","Abebe Girma","Claire Dupont","Hassan Yusuf","Rosa Jimenez","Andre Martins","Suki Park","Daniel Osei","Nadia Kovac","Patrick Flynn","Leila Rahimi","Tobias Braun","Chinara Eze","Mia Johnson","Arjun Sharma"],
      ["Host","Greeter","Coordinator","Floor Manager"]),
    monthData: makeMonthData(0.7),
  },
  {
    id: 4, name: "Parking & Traffic", leader: "James Okafor", color: "#9B6BBE",
    volunteers: makeVolunteers(4,
      ["Steve Mensah","Olivia Chan","Bruno Costa","Layla Ahmed","Derek Thompson","Zara Obi","Frank Miller","Amina Toure","Kyle Robertson","Diana Cruz","Emmanuel Asare","Petra Novak","Callum Reid","Ingrid Solberg","Josef Bauer"],
      ["Traffic Controller","Parking Lead","Zone Manager","Steward"]),
    monthData: makeMonthData(1.9),
  },
  {
    id: 5, name: "Tech Support", leader: "Lena Müller", color: "#D95B5B",
    volunteers: makeVolunteers(5,
      ["Alex Jordan","Mia Schulz","Kwame Asante","Lola Fernandez","Ravi Kapoor","Astrid Holm","Chidi Obi","Elena Popescu","Samuel Lee","Ingrid Berg","Tomás Rivera","Zoe Watts","Nour Abdel","Finn O'Hara","Yara Hassan"],
      ["IT Lead","Network Tech","Systems Support","Helpdesk"]),
    monthData: makeMonthData(2.6),
  },
  {
    id: 6, name: "Cleaning Crew", leader: "Tom Reyes", color: "#4BADA8",
    volunteers: makeVolunteers(6,
      ["Maria Santos","Abel Tesfaye","Brigitte Moreau","Kofi Mensah","Rosa Park","Declan Burke","Amara Camara","Jens Nielsen","Lucia Gomez","Piotr Kowalski","Asel Nurlanovna","Tobias Klein","Fatou Diop","Kieran Walsh","Mei Chen"],
      ["Section Lead","Cleaner","Equipment Operator","Supervisor"]),
    monthData: makeMonthData(0.4),
  },
]

// ── Calendar helpers ──────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function makeCalendarData(crew: Crew, year: number, month: number) {
  const days = getDaysInMonth(year, month)
  const data: Record<number, { available: number; unavailable: number }> = {}
  const total = crew.volunteers.length
  for (let d = 1; d <= days; d++) {
    const seed = (d * 7 + month * 31 + crew.id * 13) % 17
    const avail = Math.floor(total * 0.5 + (seed / 17) * total * 0.4)
    const unavail = Math.floor(total * 0.1 + ((d + month) % 5) * 1.2)
    data[d] = { available: Math.min(avail, total), unavailable: Math.min(unavail, total - avail) }
  }
  return data
}

// ── Shared components ─────────────────────────────────────────────────────────

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      style={{
        background: "none", border: "1px solid #E2D9C4", borderRadius: 6,
        padding: "6px 14px", cursor: "pointer", fontSize: 12, color: "#7A7060",
        fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#B94040"; e.currentTarget.style.color = "#B94040" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2D9C4"; e.currentTarget.style.color = "#7A7060" }}
    >
      Sign out
    </button>
  )
}

function Sidebar({
  activeCrew,
  screen,
  onSelectCrew,
  onHome,
}: {
  activeCrew: Crew | null
  screen: Screen
  onSelectCrew: (c: Crew) => void
  onHome: () => void
}) {
  function crewRatio(c: Crew) {
    const t = c.monthData.reduce((a, b) => a + b.needed, 0)
    const av = c.monthData.reduce((a, b) => a + b.available, 0)
    return av / t
  }
  return (
    <aside style={{ width: 220, flexShrink: 0, background: "#2D3F56", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Admin Console</div>
        <button
          onClick={onHome}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ fontSize: 13, color: "#E8D49A", fontFamily: "'DM Serif Display', serif", lineHeight: 1.3 }}>
            London Assembly Hall
          </div>
        </button>
      </div>

      <div style={{ padding: "12px 16px 6px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Crew Calendars</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {CREWS.map(c => {
          const ratio = crewRatio(c)
          const dotColor = ratio >= 0.8 ? "#3D7A55" : ratio >= 0.55 ? "#C9A84C" : "#B94040"
          const isActive = activeCrew?.id === c.id && screen !== "dashboard"
          return (
            <button
              key={c.id}
              onClick={() => onSelectCrew(c)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 16px",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none", borderLeft: isActive ? "3px solid #C9A84C" : "3px solid transparent",
                cursor: "pointer", display: "flex", flexDirection: "column", gap: 3,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)" }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                <span style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: isActive ? 500 : 400, fontSize: 13 }}>{c.name}</span>
              </div>
              <div style={{ paddingLeft: 15, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{c.volunteers.length} volunteers</div>
            </button>
          )
        })}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px" }}>
        <div
          onClick={onHome}
          style={{
            fontSize: 11, color: screen === "dashboard" ? "#C9A84C" : "rgba(255,255,255,0.4)",
            cursor: "pointer", marginBottom: 8, fontWeight: screen === "dashboard" ? 500 : 400,
          }}
        >
          ⬡ Org Dashboard
        </div>
      </div>
    </aside>
  )
}

// ── Screen 1: Org Dashboard ───────────────────────────────────────────────────

const CHART_COLORS = { needed: "#C9A84C", available: "#3D7A55", unavailable: "#B94040" }

function makePrevYearAvail(offset: number) {
  return MONTHS.map((_, mi) =>
    CREWS.reduce((sum, c) => {
      const base = c.monthData[mi].available
      const noise = Math.sin(mi * 1.7 + offset * 3.1 + c.id) * 6
      return sum + Math.max(2, Math.round(base + noise - offset * 4))
    }, 0)
  )
}

function OrgDashboard({ onDrillCrew, onLogout }: { onDrillCrew: (c: Crew) => void; onLogout: () => void }) {
  const [reportToast, setReportToast] = useState(false)

  function downloadReport() {
    setReportToast(true)
    setTimeout(() => setReportToast(false), 3000)
  }
  const totalVolunteers = CREWS.reduce((a, b) => a + b.volunteers.length, 0)
  const totalNeeded = CREWS.flatMap(c => c.monthData).reduce((a, b) => a + b.needed, 0)
  const totalAvail = CREWS.flatMap(c => c.monthData).reduce((a, b) => a + b.available, 0)
  const coverRate = Math.round((totalAvail / totalNeeded) * 100)

  const prev1 = makePrevYearAvail(1)
  const prev2 = makePrevYearAvail(2)

  const combinedData = MONTHS.map((month, mi) => ({
    month,
    needed: CREWS.reduce((a, c) => a + c.monthData[mi].needed, 0),
    available: CREWS.reduce((a, c) => a + c.monthData[mi].available, 0),
    unavailable: CREWS.reduce((a, c) => a + c.monthData[mi].unavailable, 0),
    "2024": prev1[mi],
    "2023": prev2[mi],
  }))

  const pieData = CREWS.map(c => {
    const needed = c.monthData.reduce((a, b) => a + b.needed, 0)
    const avail = c.monthData.reduce((a, b) => a + b.available, 0)
    return {
      name: c.name,
      value: Math.round((avail / needed) * 100),
      color: c.color,
    }
  })

  return (
    <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      {reportToast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 100,
          background: "#3B5170", color: "#fff", borderRadius: 8,
          padding: "12px 20px", fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "fadeIn 0.2s ease",
        }}>
          ✓ Report downloaded
        </div>
      )}
      <header style={{
        padding: "16px 28px", borderBottom: "1px solid #E2D9C4",
        background: "#fff", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "#1A1B18" }}>Organization Overview</h2>
          <div style={{ fontSize: 12, color: "#7A7060", marginTop: 2 }}>2025 · All crews · Admin view</div>
        </div>
        <LogoutButton onLogout={onLogout} />
      </header>

      <div style={{ padding: "24px 28px" }}>
        {/* Stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Volunteers", value: totalVolunteers },
            { label: "Active Crews", value: CREWS.length },
            { label: "Org Coverage Rate", value: `${coverRate}%` },
            { label: "Volunteer-Days Available", value: totalAvail },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#7A7060", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontFamily: "'DM Serif Display', serif", color: "#1A1B18" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Combined org chart + pie */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 8, padding: "18px 20px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7060", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              All Crews — Monthly Coverage
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>
              Bars: 2025 · Lines: available volunteers trend vs 2024 and 2023
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={combinedData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D9C4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A7060" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#7A7060" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1A1A18", border: "none", borderRadius: 6, color: "#F0E6C4", fontSize: 12 }} cursor={{ fill: "rgba(201,168,76,0.05)" }} />
                <Legend iconSize={7} wrapperStyle={{ fontSize: 12, color: "#7A7060", paddingTop: 8 }} />
                <Bar dataKey="needed" name="Needed '25" fill={CHART_COLORS.needed} radius={[3,3,0,0]} />
                <Bar dataKey="available" name="Available '25" fill={CHART_COLORS.available} radius={[3,3,0,0]} />
                <Bar dataKey="unavailable" name="Unavailable '25" fill={CHART_COLORS.unavailable} radius={[3,3,0,0]} />
                <Line type="monotone" dataKey="2024" name="Available '24" stroke="#6B96C8" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="2023" name="Available '23" stroke="#A08BC8" strokeWidth={2} dot={false} strokeDasharray="2 3" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                onClick={downloadReport}
                style={{
                  background: "#3B5170", border: "none", borderRadius: 6,
                  color: "#fff", fontSize: 12, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                  padding: "7px 16px", display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#4A6280")}
                onMouseLeave={e => (e.currentTarget.style.background = "#3B5170")}
              >
                ↓ Quarterly Report
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7060", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Monthly Coverage % by Crew
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val}%`, "Coverage"]}
                  contentStyle={{ background: "#1A1A18", border: "none", borderRadius: 6, color: "#F0E6C4", fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#7A7060" }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.value >= 75 ? "#3D7A55" : d.value >= 55 ? "#C9A84C" : "#B94040" }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Screen 2: Crew Calendar ───────────────────────────────────────────────────

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function CrewCalendar({
  crew,
  onViewVolunteers,
  onLogout,
}: {
  crew: Crew
  onViewVolunteers: () => void
  onLogout: () => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [viewMode, setViewMode] = useState<"month" | "year">("month")

  const calData = useMemo(() => makeCalendarData(crew, year, month), [crew, year, month])
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const totalNeeded = crew.monthData.reduce((a, b) => a + b.needed, 0)
  const totalAvail = crew.monthData.reduce((a, b) => a + b.available, 0)
  const coverRate = Math.round((totalAvail / totalNeeded) * 100)

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" })

  const yearChartData = useMemo(() => {
    return MONTHS.map((m, mi) => {
      const d = makeCalendarData(crew, year, mi)
      const days = getDaysInMonth(year, mi)
      let totalAvail = 0, totalUnavail = 0
      for (let day = 1; day <= days; day++) {
        totalAvail += d[day]?.available ?? 0
        totalUnavail += d[day]?.unavailable ?? 0
      }
      return { month: m, available: Math.round(totalAvail / days), unavailable: Math.round(totalUnavail / days) }
    })
  }, [crew, year])

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <header style={{
        padding: "16px 28px", borderBottom: "1px solid #E2D9C4",
        background: "#fff", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "#1A1B18" }}>{crew.name}</h2>
          <div style={{ fontSize: 12, color: "#7A7060", marginTop: 2 }}>Led by {crew.leader} · {crew.volunteers.length} volunteers</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onViewVolunteers}
            style={{
              padding: "7px 16px", background: "#3B5170", border: "none",
              borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View Volunteers
          </button>
          {(["month","year"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: "7px 14px",
              border: `1px solid ${viewMode === m ? "#3B5170" : "#E2D9C4"}`,
              borderRadius: 6, background: viewMode === m ? "#3B5170" : "transparent",
              color: viewMode === m ? "#fff" : "#7A7060",
              fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              {m === "month" ? "Month" : "Year"}
            </button>
          ))}
          <LogoutButton onLogout={onLogout} />
        </div>
      </header>

      <div style={{ padding: "24px 28px" }}>
        {viewMode === "month" ? (
          <>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
                style={{ background: "none", border: "1px solid #E2D9C4", borderRadius: 4, padding: "4px 10px", cursor: "pointer", color: "#7A7060" }}>‹</button>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1B18", minWidth: 140, textAlign: "center" }}>{monthName} {year}</span>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
                style={{ background: "none", border: "1px solid #E2D9C4", borderRadius: 4, padding: "4px 10px", cursor: "pointer", color: "#7A7060" }}>›</button>
            </div>

            {/* Calendar grid */}
            <div style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 10, overflow: "hidden" }}>
              {/* Weekday headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #E2D9C4" }}>
                {WEEKDAYS.map(d => (
                  <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em" }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: "1px solid #F3F0EA", borderBottom: "1px solid #F3F0EA" }} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const d = calData[day]
                  const col = (day + firstDay - 1) % 7
                  return (
                    <div key={day} style={{
                      minHeight: 80, padding: "8px 10px",
                      borderRight: col < 6 ? "1px solid #F3F0EA" : "none",
                      borderBottom: "1px solid #F3F0EA",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{day}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3D7A55", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#3D7A55" }}>{d.available}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B94040", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#B94040" }}>{d.unavailable}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3D7A55" }} />
                <span style={{ fontSize: 12, color: "#7A7060" }}>Volunteers available</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B94040" }} />
                <span style={{ fontSize: 12, color: "#7A7060" }}>Volunteers unavailable</span>
              </div>
            </div>
          </>
        ) : (
          /* Year view — bar chart per month */
          <div style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7060", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              {year} — Average daily availability
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D9C4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A7060" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#7A7060" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1A1A18", border: "none", borderRadius: 6, color: "#F0E6C4", fontSize: 12 }} cursor={{ fill: "rgba(201,168,76,0.07)" }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#7A7060", paddingTop: 8 }} />
                <Bar dataKey="available" name="Available" fill="#3D7A55" radius={[3,3,0,0]} />
                <Bar dataKey="unavailable" name="Unavailable" fill="#B94040" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reports */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7060", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Reports — {crew.name}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { label: "Annual coverage rate", value: `${coverRate}%`, color: coverRate >= 75 ? "#3D7A55" : "#B94040" },
              { label: "Total available days", value: totalAvail, color: "#1A1B18" },
              { label: "Total needed days", value: totalNeeded, color: "#1A1B18" },
              { label: "Peak month", value: crew.monthData.reduce((a, b) => a.needed > b.needed ? a : b).month, color: "#1A1B18" },
              { label: "Lowest coverage", value: crew.monthData.reduce((a, b) => (a.available/a.needed) < (b.available/b.needed) ? a : b).month, color: "#B94040" },
              { label: "Crew size", value: crew.volunteers.length, color: "#1A1B18" },
            ].map(r => (
              <div key={r.label} style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#7A7060", marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontFamily: "'DM Serif Display', serif", color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Screen 3: Volunteer Table ─────────────────────────────────────────────────

function VolunteerTable({ crew, onBack, onLogout }: { crew: Crew; onBack: () => void; onLogout: () => void }) {
  const [sort, setSort] = useState<keyof Volunteer>("name")
  const [dir, setDir] = useState<1 | -1>(1)

  function toggleSort(col: keyof Volunteer) {
    if (sort === col) setDir(d => (d === 1 ? -1 : 1) as 1 | -1)
    else { setSort(col); setDir(1) }
  }

  const sorted = [...crew.volunteers].sort((a, b) => {
    const av = a[sort], bv = b[sort]
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
    return 0
  })

  const availColor: Record<Volunteer["availability"], string> = {
    available: "#3D7A55", partial: "#C9A84C", unavailable: "#B94040",
  }
  const availBg: Record<Volunteer["availability"], string> = {
    available: "#EAF4EE", partial: "#FDF8EC", unavailable: "#FAEAEA",
  }

  const thStyle = (col: keyof Volunteer) => ({
    padding: "10px 14px", textAlign: "left" as const,
    fontSize: 11, fontWeight: 600, color: "#7A7060",
    letterSpacing: "0.07em", textTransform: "uppercase" as const,
    cursor: "pointer", userSelect: "none" as const,
    background: sort === col ? "#F9F8F4" : "transparent",
    borderBottom: "2px solid #E2D9C4",
  })

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <header style={{
        padding: "16px 28px", borderBottom: "1px solid #E2D9C4",
        background: "#fff", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "1px solid #E2D9C4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#7A7060", fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Calendar
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "#1A1B18" }}>{crew.name} — Volunteers</h2>
            <div style={{ fontSize: 12, color: "#7A7060", marginTop: 2 }}>{crew.volunteers.length} members · {crew.leader}</div>
          </div>
        </div>
        <LogoutButton onLogout={onLogout} />
      </header>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ background: "#fff", border: "1px solid #E2D9C4", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {(["name","role","phone","email","daysAvailable","availability"] as (keyof Volunteer)[]).map(col => (
                  <th key={col} style={thStyle(col)} onClick={() => toggleSort(col)}>
                    {col === "daysAvailable" ? "Days Avail." : col.charAt(0).toUpperCase() + col.slice(1)}
                    {sort === col ? (dir === 1 ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, i) => (
                <tr key={v.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#1A1B18", fontWeight: 500, borderBottom: "1px solid #F3F0EA" }}>{v.name}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#5A5248", borderBottom: "1px solid #F3F0EA" }}>{v.role}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#7A7060", fontFamily: "monospace", borderBottom: "1px solid #F3F0EA" }}>{v.phone}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#7A7060", borderBottom: "1px solid #F3F0EA" }}>{v.email}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#1A1B18", textAlign: "center", borderBottom: "1px solid #F3F0EA" }}>{v.daysAvailable}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F3F0EA" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                      background: availBg[v.availability],
                      color: availColor[v.availability],
                    }}>
                      {v.availability.charAt(0).toUpperCase() + v.availability.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [err, setErr] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (user.trim() && pass.trim()) { onLogin() }
    else { setErr(true); setTimeout(() => setErr(false), 1600) }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ImageWithFallback src={loginPhoto} alt="Volunteers reviewing plans" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,18,25,0.60)" }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "min(400px, 92vw)", background: "rgba(255,255,255,0.97)",
        borderRadius: 10, padding: "40px 40px 36px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A929E", marginBottom: 6 }}>
            London Assembly Hall
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "#1A1D21", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35 }}>
            Volunteer Availability
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>Sign in to access the admin console</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#4A6280" }}>Username</label>
            <input type="text" placeholder="Enter your username" value={user} onChange={e => setUser(e.target.value)}
              style={{ border: `1px solid ${err ? "#DC2626" : "#D1D5DB"}`, borderRadius: 6, padding: "9px 12px", fontSize: 14, outline: "none", color: "#111827", background: "#F9FAFB", fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.background = "#fff" }}
              onBlur={e => { e.currentTarget.style.borderColor = err ? "#DC2626" : "#D1D5DB"; e.currentTarget.style.background = "#F9FAFB" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#4A6280" }}>Password</label>
            <input type="password" placeholder="Enter your password" value={pass} onChange={e => setPass(e.target.value)}
              style={{ border: `1px solid ${err ? "#DC2626" : "#D1D5DB"}`, borderRadius: 6, padding: "9px 12px", fontSize: 14, outline: "none", color: "#111827", background: "#F9FAFB", fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.background = "#fff" }}
              onBlur={e => { e.currentTarget.style.borderColor = err ? "#DC2626" : "#D1D5DB"; e.currentTarget.style.background = "#F9FAFB" }}
            />
          </div>
          {err && <p style={{ margin: 0, fontSize: 12, color: "#DC2626" }}>Please enter your username and password.</p>}
          <button type="submit"
            style={{ marginTop: 8, background: "#3B5170", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: "10px 0", letterSpacing: "0.02em" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4A6280")}
            onMouseLeave={e => (e.currentTarget.style.background = "#3B5170")}
          >
            Sign in
          </button>
        </form>
        <div style={{ marginTop: 24, fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
          Internal use only · London Assembly Hall
        </div>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login")
  const [activeCrew, setActiveCrew] = useState<Crew | null>(null)

  function selectCrew(c: Crew) {
    setActiveCrew(c)
    setScreen("crew-calendar")
  }

  if (screen === "login") return <LoginScreen onLogin={() => setScreen("dashboard")} />

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F9F8F4" }}>
      <Sidebar
        activeCrew={activeCrew}
        screen={screen}
        onSelectCrew={selectCrew}
        onHome={() => setScreen("dashboard")}
      />
      {screen === "dashboard" && <OrgDashboard onDrillCrew={selectCrew} onLogout={() => setScreen("login")} />}
      {screen === "crew-calendar" && activeCrew && (
        <CrewCalendar crew={activeCrew} onViewVolunteers={() => setScreen("volunteers")} onLogout={() => setScreen("login")} />
      )}
      {screen === "volunteers" && activeCrew && (
        <VolunteerTable crew={activeCrew} onBack={() => setScreen("crew-calendar")} onLogout={() => setScreen("login")} />
      )}
    </div>
  )
}
