export default function TopDestinations({ data }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h3 className="font-semibold text-xl mb-4">
        Top Destinations (by real views)
      </h3>

      {!data || data.length === 0 ? (
        <p className="text-gray-400 text-sm">No views logged yet.</p>
      ) : (
        data.map((place) => (
          <div
            key={place.name}
            className="flex justify-between py-3 border-b"
          >
            <span>{place.name}</span>
            <span>{place.views} views</span>
          </div>
        ))
      )}
    </div>
  );
}
