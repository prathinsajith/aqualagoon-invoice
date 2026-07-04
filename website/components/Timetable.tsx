import type { TimetableContent } from "@/lib/site-content";

export default function Timetable({ timetable }: { timetable: TimetableContent }) {
  const { days, slots, rows } = timetable;
  const slotByKey = new Map(slots.map((s) => [s.key, s]));

  return (
    <div className="table-wrap">
      <table className="timetable">
        <thead>
          <tr>
            <th>Time</th>
            {days.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.time}>
              <td className="time">{row.time}</td>
              {days.map((day, di) => {
                const slot = slotByKey.get(row.cells[di] ?? "");
                return (
                  <td key={day}>
                    {slot ? (
                      <span className="chip" style={{ color: slot.color, background: slot.bg }}>
                        {slot.label}
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
