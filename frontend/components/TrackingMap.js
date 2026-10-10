'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function TrackingMap({ routeId }) {
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch stops for the route
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/tracking/route/${routeId}/stops`
        );
        const data = await res.json();
        setStops(data.stops || []);
      } catch (err) {
        console.error('Failed to fetch stops:', err);
        setError('Could not load stops');
      }
    };

    if (routeId) {
      fetchStops();
    }
  }, [routeId]);

  // Fetch bus locations and refresh every 5 seconds
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/tracking/${routeId}`
        );
        const data = await res.json();
        setBuses(data.buses || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch buses:', err);
        setError('Could not load bus locations');
        setLoading(false);
      }
    };

    if (routeId) {
      fetchBuses();
      const interval = setInterval(fetchBuses, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [routeId]);

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map and place markers
  useEffect(() => {
    if (!mapLoaded || stops.length === 0) return;

    const mapContainer = document.getElementById('tracking-map');
    if (!mapContainer) return;

    const map = new window.google.maps.Map(mapContainer, {
      zoom: 13,
      center: { lat: stops[0].latitude, lng: stops[0].longitude },
      mapTypeControl: true,
      fullscreenControl: true,
    });

    // Add stop markers (blue)
    stops.forEach((stop) => {
      new window.google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map,
        title: `${stop.name} (Stop ${stop.stop_order})`,
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        label: `${stop.stop_order}`,
      });
    });

    // Add bus markers (red) with info windows
    buses.forEach((bus) => {
      const marker = new window.google.maps.Marker({
        position: { lat: bus.latitude, lng: bus.longitude },
        map,
        title: bus.bus_id,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; font-family: Arial;">
            <strong>${bus.bus_id}</strong><br/>
            <strong>${bus.vehicle_name}</strong><br/>
            Speed: ${bus.speed_kmh || 0} km/h<br/>
            Last updated: ${new Date(bus.updated_at).toLocaleTimeString()}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Draw route line connecting all stops
    if (stops.length > 1) {
      const stopCoordinates = stops.map((stop) => ({
        lat: stop.latitude,
        lng: stop.longitude,
      }));

      const polyline = new window.google.maps.Polyline({
        path: stopCoordinates,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      });
    }
  }, [mapLoaded, stops, buses]);

  if (loading) {
    return <div className="p-4 text-center">Loading map...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="w-full">
      <div className="bg-gray-100 p-4 rounded-t-lg">
        <h2 className="text-xl font-bold text-gray-800">
          📍 Live Bus Tracking
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Blue markers: Stops | Red markers: Buses | Updating every 5 seconds
        </p>
      </div>

      <div
        id="tracking-map"
        className="w-full bg-gray-300"
        style={{ height: '500px' }}
      ></div>

      <div className="bg-white p-4 border-t">
        <h3 className="font-semibold text-gray-800 mb-3">🚌 Active Buses</h3>
        {buses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {buses.map((bus) => (
              <div key={bus.bus_id} className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-semibold text-red-700">{bus.bus_id}</div>
                <div className="text-sm text-gray-600">
                  <div>{bus.vehicle_name}</div>
                  <div>Speed: {bus.speed_kmh || 0} km/h</div>
                  <div>Updated: {new Date(bus.updated_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No buses currently running on this route</p>
        )}
      </div>

      <div className="bg-white p-4 border-t">
        <h3 className="font-semibold text-gray-800 mb-3">🛑 Route Stops</h3>
        <div className="space-y-2">
          {stops.map((stop) => (
            <div key={stop.id} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <span className="font-semibold text-blue-700">{stop.stop_order}.</span>
              <span className="ml-2">{stop.name}</span>
              <span className="ml-2 text-gray-500">
                ETA: {stop.eta_minutes_from_start} min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
