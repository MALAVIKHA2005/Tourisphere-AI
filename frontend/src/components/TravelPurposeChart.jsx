import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#2F4F4F",
  "#C15C3D",
  "#8B9A8B",
  "#D6D3D1",
  "#A34A2E",
  "#5B7B7A",
];

export default function TravelPurposeChart({ data }) {
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm h-[350px]">
      <h3 className="text-xl font-semibold mb-4">
        Search Interest Distribution
      </h3>

      {hasData ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 text-sm">No searches logged yet.</p>
      )}
    </div>
  );
}
