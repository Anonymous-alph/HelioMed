import { useState, useEffect } from 'react';
import styles from './StoreLocator.module.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { api } from '../../services/api';

const LOCATION_TYPES = [
  { id: 'hospital', icon: '🏥', label: 'Hospitals' },
  { id: 'clinic', icon: '🏪', label: 'Clinics' },
  { id: 'pharmacy', icon: '💊', label: 'Pharmacies' }
];

const RADIUS_OPTIONS = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
];

export default function StoreLocator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(['hospital', 'clinic', 'pharmacy']);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [searchedLabel, setSearchedLabel] = useState('');

  const { position, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();

  // When geolocation resolves, auto-search
  useEffect(() => {
    if (position) {
      searchByCoords(position.lat, position.lon);
    }
  }, [position]);

  const searchByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const types = activeFilters.join(',');
      const data = await api.getNearbyLocations({ lat, lon, radius: searchRadius, types });
      setLocations(data.results || []);
      setSearchedLabel(`Results near ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (err) {
      setError(err.message || 'Failed to fetch nearby locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByZipcode = async () => {
    const zip = searchQuery.trim();
    if (!zip) {
      setError('Please enter a 6-digit Indian zipcode');
      return;
    }
    if (!/^\d{6}$/.test(zip)) {
      setError('Invalid zipcode. Indian zipcodes are exactly 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const types = activeFilters.join(',');
      const data = await api.getNearbyLocations({ zipcode: zip, radius: searchRadius, types });
      setLocations(data.results || []);
      setSearchedLabel(`Results near ${zip}`);
    } catch (err) {
      setError(err.message || 'Could not find locations for this zipcode');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchByZipcode();
  };

  const toggleFilter = (filterId) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredLocations = locations.filter(loc =>
    activeFilters.includes(loc.type)
  );

  const handleGetDirections = (location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  const handleViewOnMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  return (
    <div className={styles.storeLocator}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLabel}>Find Healthcare Near You</div>
          <h1>Locate <span className={styles.highlight}>Nearby</span> Healthcare</h1>
          <p className={styles.heroDescription}>
            Search by Indian zipcode to find the nearest hospitals, clinics, and pharmacies.
          </p>
        </div>
      </section>

      {/* Main Locator */}
      <section className={styles.locatorMain}>
        <div className={styles.container}>
          <div className={styles.locatorWrapper}>
            {/* Search Panel */}
            <div className={styles.searchPanel}>
              <div className={styles.searchHeader}>
                <h3>Search Locations</h3>
              </div>

              <form className={styles.searchBox} onSubmit={handleSearch}>
                <div className={styles.searchInputWrapper}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder="Enter 6-digit Indian zipcode"
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="\d{6}"
                  />
                </div>

                <div className={styles.searchActions}>
                  <button
                    type="submit"
                    className={styles.searchBtn}
                    disabled={loading || !searchQuery.trim()}
                  >
                    {loading ? 'Searching...' : 'Search by Zipcode'}
                  </button>
                  <button
                    type="button"
                    className={styles.locateBtn}
                    onClick={getCurrentPosition}
                    disabled={geoLoading || loading}
                  >
                    <span className={styles.locateIcon}>📍</span>
                    {geoLoading ? 'Locating...' : 'Use My Location'}
                  </button>
                </div>

                {(error || geoError) && (
                  <p className={styles.geoError}>{error || geoError}</p>
                )}
              </form>

              {/* Radius selector */}
              <div className={styles.radiusSection}>
                <h4>Search Radius</h4>
                <div className={styles.radiusOptions}>
                  {RADIUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`${styles.radiusChip} ${searchRadius === opt.value ? styles.active : ''}`}
                      onClick={() => setSearchRadius(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <h4>Filter by Type</h4>
                <div className={styles.filterOptions}>
                  {LOCATION_TYPES.map(type => (
                    <label
                      key={type.id}
                      className={`${styles.filterChip} ${activeFilters.includes(type.id) ? styles.active : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.includes(type.id)}
                        onChange={() => toggleFilter(type.id)}
                      />
                      <span className={styles.chipIcon}>{type.icon}</span>
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Results label */}
              {searchedLabel && !loading && (
                <div className={styles.resultsLabel}>
                  <span>{searchedLabel}</span>
                  <span className={styles.resultCount}>
                    {filteredLocations.length} found
                  </span>
                </div>
              )}

              {/* Location Cards */}
              <div className={styles.locationList}>
                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Finding nearby locations...</p>
                  </div>
                ) : filteredLocations.length === 0 && searchedLabel ? (
                  <div className={styles.emptyState}>
                    <span>📍</span>
                    <p>No locations found. Try a different zipcode or increase the search radius.</p>
                  </div>
                ) : !searchedLabel ? (
                  <div className={styles.emptyState}>
                    <span>🔍</span>
                    <p>Enter a zipcode or use your location to find nearby healthcare facilities.</p>
                  </div>
                ) : (
                  filteredLocations.map(location => (
                    <div
                      key={location.id}
                      className={`${styles.locationCard} ${selectedLocation?.id === location.id ? styles.selected : ''}`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className={`${styles.locationBadge} ${styles[location.type]}`}>
                        {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                      </div>
                      <h4>{location.name}</h4>
                      <p className={styles.locationAddress}>📍 {location.address}</p>
                      <div className={styles.locationDetails}>
                        <span className={styles.distance}>📏 {location.distance} km</span>
                        {location.phone && (
                          <span className={styles.phone}>📞 {location.phone}</span>
                        )}
                      </div>
                      <div className={styles.locationHours}>
                        <span className={styles.status}>
                          🕐 {location.hours}
                        </span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={styles.btnDirections}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(location);
                          }}
                        >
                          Get Directions
                        </button>
                        <button
                          className={styles.btnViewMap}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOnMap(location);
                          }}
                        >
                          View on Map
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map Panel */}
            <div className={styles.mapPanel}>
              <div className={styles.mapPlaceholder}>
                <div className={styles.mapOverlay}>
                  <div className={styles.mapMarkers}>
                    {filteredLocations.slice(0, 20).map((loc, index) => (
                      <div
                        key={loc.id}
                        className={`${styles.marker} ${selectedLocation?.id === loc.id ? styles.markerSelected : ''}`}
                        style={{
                          top: `${15 + ((index * 17) % 70)}%`,
                          left: `${10 + ((index * 23) % 80)}%`
                        }}
                        onClick={() => setSelectedLocation(loc)}
                        title={loc.name}
                      >
                        <span>
                          {loc.type === 'hospital' ? '🏥' :
                           loc.type === 'clinic' ? '🏪' : '💊'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.mapGrid}></div>
                </div>

                {filteredLocations.length > 0 ? (
                  <div className={styles.mapNotice}>
                    <span>🗺️</span>
                    <p>Showing {filteredLocations.length} locations. Click "View on Map" or "Get Directions" for Google Maps.</p>
                  </div>
                ) : (
                  <div className={styles.mapNotice}>
                    <span>🗺️</span>
                    <p>Search to see nearby healthcare locations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
