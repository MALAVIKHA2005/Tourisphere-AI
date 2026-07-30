import {
  FaHome,
  FaChartLine,
  FaMapMarkedAlt,
  FaUsers,
  FaSmile,
  FaDatabase
} from "react-icons/fa";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-8">
        Tourisphere
      </h1>

      <div className="space-y-3">
        <div className="bg-black text-white p-3 rounded-lg flex gap-3 items-center">
          <FaHome />
          Overview
        </div>

        <div className="p-3 flex gap-3 items-center">
          <FaChartLine />
          Forecasting
        </div>

        <div className="p-3 flex gap-3 items-center">
          <FaMapMarkedAlt />
          Recommendation
        </div>

        <div className="p-3 flex gap-3 items-center">
          <FaUsers />
          Segmentation
        </div>

        <div className="p-3 flex gap-3 items-center">
          <FaSmile />
          Sentiment
        </div>

        <div className="p-3 flex gap-3 items-center">
          <FaDatabase />
          Dataset
        </div>
      </div>
    </div>
  );
}