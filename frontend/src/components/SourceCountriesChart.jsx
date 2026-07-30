import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SourceCountriesChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm h-[350px]">
      <h3 className="text-xl font-semibold mb-4">
        Most Viewed Countries
      </h3>

      {hasData ? (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}>
            <XAxis dataKey="country" />
            <YAxis allowDecimals={false} />
            <Tooltip />

            <Bar
              dataKey="views"
              fill="#2F4F4F"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 text-sm">No views logged yet.</p>
      )}
    </div>
  );
}
