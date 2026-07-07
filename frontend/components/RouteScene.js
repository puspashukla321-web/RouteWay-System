export default function RouteScene() {
  return (
    <div className="route-scene">
      <div className="scene-skyline">
        <span className="scene-building scene-building-lg" />
        <span className="scene-building" />
        <span className="scene-building scene-building-sm" />
        <span className="scene-building" />
      </div>

      <div className="scene-road-band">
        <div className="scene-route-label">
          Route 5 · Ratnapark → Koteshwor · 8.3 km
        </div>
        <div className="scene-road">
          <div className="scene-lane scene-lane-top" />
          <div className="scene-lane scene-lane-bottom" />

          <div className="scene-vehicle scene-vehicle-bus bus-a">
            <span className="vehicle-window" />
            <span className="vehicle-window" />
            <span className="vehicle-window" />
          </div>

          <div className="scene-vehicle scene-vehicle-car car-a">
            <span className="vehicle-window vehicle-window-sm" />
            <span className="vehicle-window vehicle-window-sm" />
          </div>

          <div className="scene-vehicle scene-vehicle-van van-a">
            <span className="vehicle-window vehicle-window-sm" />
            <span className="vehicle-window vehicle-window-sm" />
          </div>

          <div className="road-mark road-mark-one" />
          <div className="road-mark road-mark-two" />
          <div className="road-mark road-mark-three" />
          <div className="road-mark road-mark-four" />
        </div>
      </div>

      <div className="scene-stop-tags">
        <span>Ratnapark</span>
        <span>Sundhara</span>
        <span>Baneshwor</span>
        <span>Koteshwor</span>
      </div>
    </div>
  );
}
