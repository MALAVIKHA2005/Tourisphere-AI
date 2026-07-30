import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VisitorsRevenueChart({ data }) {
  const hasData = data?.some((point) => point.views > 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm h-[400px]">
      <h3 className="font-semibold text-xl mb-4">
        Platform Views (Last 14 Days)
      </h3>

      {hasData ? (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="views"
              name="Destination Views"
              stroke="#2F4F4F"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 text-sm">
          No views logged yet — this fills in as people browse destinations.
        </p>
      )}
    </div>
  );
}
