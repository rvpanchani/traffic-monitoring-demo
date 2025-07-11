import './style.css'

// Configuration
const CONFIG = {
  // Default location: Sinhgad Road area coordinates (Pune, Maharashtra, India)
  defaultLocation: {
    name: 'Sinhgad Road, Pune',
    center: { lat: 18.4633, lon: 73.8070 },
    bbox: {
      minLat: 18.4200,
      maxLat: 18.5100,
      minLon: 73.7600,
      maxLon: 73.8500
    }
  },
  currentLocation: null, // Will be set dynamically
  // You'll need to get a TomTom API key from https://developer.tomtom.com/
  // Configure it in the .env file as VITE_TOMTOM_API_KEY
  tomtomApiKey: import.meta.env.VITE_TOMTOM_API_KEY || 'YOUR_TOMTOM_API_KEY_HERE'
};

// Initialize with default location
CONFIG.currentLocation = CONFIG.defaultLocation;

// Debug: Log the API key status
console.log('Environment variable VITE_TOMTOM_API_KEY:', import.meta.env.VITE_TOMTOM_API_KEY ? 'Loaded' : 'Not found');
console.log('Using API key:', CONFIG.tomtomApiKey.substring(0, 10) + '...');

class TrafficIncidentsApp {
  constructor() {
    this.map = null;
    this.incidents = [];
    this.markers = [];
    this.searchResults = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.initializeMap();
    await this.loadTrafficIncidents();
  }

  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('location-search');
    const toggleTrafficFlowBtn = document.getElementById('toggle-traffic-flow');
    const toggleTrafficIncidentsBtn = document.getElementById('toggle-traffic-incidents');

    refreshBtn.addEventListener('click', () => this.loadTrafficIncidents());
    searchBtn.addEventListener('click', () => this.handleLocationSearch());
    
    // Allow search on Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLocationSearch();
      }
    });

    // Traffic layer controls
    toggleTrafficFlowBtn.addEventListener('click', () => this.toggleTrafficFlow());
    toggleTrafficIncidentsBtn.addEventListener('click', () => this.toggleTrafficIncidents());
  }

  async initializeMap() {
    try {
      this.updateStatus('Initializing map...', 'loading');
      
      // Check if TomTom is available
      if (typeof tt === 'undefined') {
        throw new Error('TomTom Maps SDK not loaded');
      }

      // Initialize TomTom map with reliable configuration
      this.map = tt.map({
        key: CONFIG.tomtomApiKey,
        container: 'map',
        center: [CONFIG.currentLocation.center.lon, CONFIG.currentLocation.center.lat],
        zoom: 13
      });

      // Add enhanced map controls
      this.map.addControl(new tt.NavigationControl(), 'top-right');
      this.map.addControl(new tt.FullscreenControl(), 'top-right');
      
      // Add scale control
      this.map.addControl(new tt.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
      }), 'bottom-left');

      // Add geolocation control
      this.map.addControl(new tt.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'top-right');

      // Wait for map to load completely before adding traffic layers
      this.map.on('load', () => {
        console.log('Map load event fired');
        this.addTrafficLayers();
      });

      // Also try after a delay as a backup
      setTimeout(() => {
        if (this.map && this.map.isStyleLoaded()) {
          console.log('Backup timer: checking for traffic layers...');
          const hasFlowLayer = this.map.getLayer('traffic-flow') || this.map.getLayer('simple-traffic');
          const hasIncidentsLayer = this.map.getLayer('traffic-incidents-tiles');
          
          if (!hasFlowLayer && !hasIncidentsLayer) {
            console.log('No traffic layers found, trying to add them again...');
            this.addTrafficLayers();
          }
        }
      }, 3000);

      this.updateStatus('Map initialized successfully', 'success');
    } catch (error) {
      console.error('Error initializing map:', error);
      this.updateStatus(`Map error: ${error.message}`, 'error');
      this.showDemoMode();
    }
  }

  addTrafficLayers() {
    try {
      console.log('Adding traffic layers...');
      
      // Check if map is loaded
      if (!this.map.isStyleLoaded()) {
        console.log('Map style not loaded yet, waiting...');
        this.map.on('styledata', () => {
          if (this.map.isStyleLoaded()) {
            this.addTrafficLayers();
          }
        });
        return;
      }

      // Use TomTom's traffic services - updated URLs
      const trafficFlowUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${CONFIG.tomtomApiKey}`;
      const trafficIncidentsUrl = `https://api.tomtom.com/traffic/map/4/tile/incidents/{z}/{x}/{y}.png?key=${CONFIG.tomtomApiKey}`;

      // Add traffic flow layer (shows traffic speed/congestion with color coding)
      if (!this.map.getSource('traffic-flow')) {
        console.log('Adding traffic flow source...');
        this.map.addSource('traffic-flow', {
          'type': 'raster',
          'tiles': [trafficFlowUrl],
          'tileSize': 256,
          'attribution': 'Traffic data © TomTom'
        });

        this.map.addLayer({
          'id': 'traffic-flow',
          'type': 'raster',
          'source': 'traffic-flow',
          'paint': {
            'raster-opacity': 0.6
          }
        });
        console.log('Traffic flow layer added');
      }

      // Add traffic incidents overlay
      if (!this.map.getSource('traffic-incidents-tiles')) {
        console.log('Adding traffic incidents source...');
        this.map.addSource('traffic-incidents-tiles', {
          'type': 'raster',
          'tiles': [trafficIncidentsUrl],
          'tileSize': 256,
          'attribution': 'Incident data © TomTom'
        });

        this.map.addLayer({
          'id': 'traffic-incidents-tiles',
          'type': 'raster',
          'source': 'traffic-incidents-tiles',
          'paint': {
            'raster-opacity': 0.7
          }
        });
        console.log('Traffic incidents layer added');
      }

      console.log('All traffic layers added successfully');
      
      // Verify layers exist
      setTimeout(() => {
        const flowLayer = this.map.getLayer('traffic-flow');
        const incidentsLayer = this.map.getLayer('traffic-incidents-tiles');
        console.log('Layer verification - Flow layer:', !!flowLayer, 'Incidents layer:', !!incidentsLayer);
      }, 1000);
      
    } catch (error) {
      console.error('Error adding traffic layers:', error);
      // Try a simpler approach if the complex one fails
      this.addSimpleTrafficLayer();
    }
  }

  addSimpleTrafficLayer() {
    try {
      console.log('Trying simple traffic layer approach...');
      
      // Just add a simple traffic flow layer as a test
      if (!this.map.getSource('simple-traffic')) {
        this.map.addSource('simple-traffic', {
          'type': 'raster',
          'tiles': [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${CONFIG.tomtomApiKey}`],
          'tileSize': 256
        });

        this.map.addLayer({
          'id': 'simple-traffic',
          'type': 'raster',
          'source': 'simple-traffic',
          'paint': {
            'raster-opacity': 0.5
          }
        });
        
        console.log('Simple traffic layer added');
      }
    } catch (error) {
      console.error('Even simple traffic layer failed:', error);
    }
  }

  async handleLocationSearch() {
    const searchInput = document.getElementById('location-search');
    const searchBtn = document.getElementById('search-btn');
    const query = searchInput.value.trim();

    if (!query) {
      alert('Please enter a location to search');
      return;
    }

    try {
      this.updateStatus('Searching for location...', 'loading');
      searchBtn.disabled = true;

      // Use TomTom Geocoding API to find the location
      const location = await this.geocodeLocation(query);
      
      if (!location) {
        throw new Error('Location not found');
      }

      // Update current location
      CONFIG.currentLocation = location;
      
      // Update display
      this.updateCurrentLocationDisplay(location.name);
      
      // Move map to new location
      this.map.setCenter([location.center.lon, location.center.lat]);
      this.map.setZoom(13);
      
      // Load incidents for new location
      await this.loadTrafficIncidents();
      
      this.updateStatus(`Switched to ${location.name}`, 'success');

    } catch (error) {
      console.error('Error searching location:', error);
      this.updateStatus(`Search error: ${error.message}`, 'error');
    } finally {
      searchBtn.disabled = false;
    }
  }

  async geocodeLocation(query) {
    if (!CONFIG.tomtomApiKey || CONFIG.tomtomApiKey === 'YOUR_TOMTOM_API_KEY_HERE') {
      throw new Error('TomTom API key required for search');
    }

    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${CONFIG.tomtomApiKey}&limit=1`;
    
    console.log('Geocoding location:', query);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Geocoding response:', data);

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const position = result.position;
    const address = result.address;
    
    // Create bounding box around the location (approximately 5km radius)
    const radius = 0.045; // Roughly 5km in degrees
    
    return {
      name: address.freeformAddress || query,
      center: { lat: position.lat, lon: position.lon },
      bbox: {
        minLat: position.lat - radius,
        maxLat: position.lat + radius,
        minLon: position.lon - radius,
        maxLon: position.lon + radius
      }
    };
  }

  updateCurrentLocationDisplay(locationName) {
    const currentLocationElement = document.getElementById('current-location');
    currentLocationElement.textContent = `📍 Currently viewing: ${locationName}`;
  }

  toggleTrafficFlow() {
    const btn = document.getElementById('toggle-traffic-flow');
    
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn('Map not ready for layer toggle');
      return;
    }
    
    // Check for the main traffic flow layer first, then fallback to simple layer
    let layerId = null;
    if (this.map.getLayer('traffic-flow')) {
      layerId = 'traffic-flow';
    } else if (this.map.getLayer('simple-traffic')) {
      layerId = 'simple-traffic';
    }
    
    if (layerId) {
      const visibility = this.map.getLayoutProperty(layerId, 'visibility');
      
      if (visibility === 'visible' || visibility === undefined) {
        this.map.setLayoutProperty(layerId, 'visibility', 'none');
        btn.classList.remove('active');
        btn.textContent = 'Traffic Flow (OFF)';
        console.log(`${layerId} layer hidden`);
      } else {
        this.map.setLayoutProperty(layerId, 'visibility', 'visible');
        btn.classList.add('active');
        btn.textContent = 'Traffic Flow';
        console.log(`${layerId} layer shown`);
      }
    } else {
      console.warn('No traffic flow layer found. Available layers:', this.map.getStyle().layers.map(l => l.id));
      btn.textContent = 'Traffic Flow (Unavailable)';
    }
  }

  toggleTrafficIncidents() {
    const btn = document.getElementById('toggle-traffic-incidents');
    
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn('Map not ready for layer toggle');
      return;
    }
    
    if (this.map.getLayer('traffic-incidents-tiles')) {
      const visibility = this.map.getLayoutProperty('traffic-incidents-tiles', 'visibility');
      
      if (visibility === 'visible' || visibility === undefined) {
        this.map.setLayoutProperty('traffic-incidents-tiles', 'visibility', 'none');
        btn.classList.remove('active');
        btn.textContent = 'Traffic Incidents (OFF)';
        console.log('Traffic incidents layer hidden');
      } else {
        this.map.setLayoutProperty('traffic-incidents-tiles', 'visibility', 'visible');
        btn.classList.add('active');
        btn.textContent = 'Traffic Incidents';
        console.log('Traffic incidents layer shown');
      }
    } else {
      console.warn('Traffic incidents layer not found. Available layers:', this.map.getStyle().layers.map(l => l.id));
      btn.textContent = 'Traffic Incidents (Unavailable)';
    }
  }

  async loadTrafficIncidents() {
    try {
      this.updateStatus('Loading traffic incidents...', 'loading');
      const refreshBtn = document.getElementById('refresh-btn');
      refreshBtn.disabled = true;

      // Clear existing markers
      this.clearMarkers();

      // Get traffic incidents from TomTom API
      const incidents = await this.fetchTrafficIncidents();
      
      if (incidents.length === 0) {
        this.updateStatus('No incidents found', 'success');
        this.displayNoIncidents();
      } else {
        this.incidents = incidents;
        this.displayIncidents();
        this.addMarkersToMap();
        this.updateStatus(`Found ${incidents.length} incidents`, 'success');
      }

    } catch (error) {
      console.error('Error loading traffic incidents:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
      this.showDemoData();
    } finally {
      const refreshBtn = document.getElementById('refresh-btn');
      refreshBtn.disabled = false;
    }
  }

  async fetchTrafficIncidents() {
    // Check if we have a valid API key
    console.log('Checking API key:', CONFIG.tomtomApiKey.substring(0, 10) + '...');
    
    if (!CONFIG.tomtomApiKey || CONFIG.tomtomApiKey === 'YOUR_TOMTOM_API_KEY_HERE') {
      throw new Error('Please configure your TomTom API key in the .env file');
    }

    const bbox = CONFIG.currentLocation.bbox;
    const bboxString = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${CONFIG.tomtomApiKey}&bbox=${bboxString}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime}}}`;
    
    console.log('Fetching traffic data from TomTom API...');
    console.log('Bounding box:', bboxString);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('API Response error:', response.status, response.statusText);
      throw new Error(`TomTom API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('TomTom API response:', data);
    return this.processIncidentsData(data);
  }

  processIncidentsData(data) {
    if (!data.incidents) return [];

    return data.incidents.map(incident => {
      const properties = incident.properties;
      const geometry = incident.geometry;
      
      // Handle different geometry types from TomTom API
      let coords;
      if (geometry.type === 'Point') {
        coords = geometry.coordinates; // [lon, lat]
      } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        // For line strings, use the first coordinate as the location
        const coordArray = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0];
        coords = coordArray[0]; // [lon, lat]
      } else {
        // Fallback for other geometry types
        coords = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : geometry.coordinates;
      }

      // Ensure we have valid coordinates
      if (!Array.isArray(coords) || coords.length < 2) {
        console.warn('Invalid coordinates for incident:', incident);
        coords = [CONFIG.currentLocation.center.lon, CONFIG.currentLocation.center.lat]; // Default to current location center
      }
      
      return {
        id: incident.id || Math.random().toString(36),
        type: this.getIncidentType(properties.iconCategory),
        description: this.getIncidentDescription(properties.events),
        location: coords, // [lon, lat]
        severity: this.getSeverity(properties.magnitudeOfDelay),
        startTime: properties.startTime,
        endTime: properties.endTime,
        iconCategory: properties.iconCategory
      };
    });
  }

  getIncidentType(iconCategory) {
    const types = {
      0: 'Accident',
      1: 'Fog',
      2: 'Dangerous Conditions',
      3: 'Rain',
      4: 'Ice',
      5: 'Lane Restrictions',
      6: 'Lane Closure',
      7: 'Road Closure',
      8: 'Road Works',
      9: 'Wind',
      10: 'Flooding',
      11: 'Detour',
      14: 'Traffic Cluster'
    };
    return types[iconCategory] || 'Unknown Incident';
  }

  getIncidentDescription(events) {
    if (!events || events.length === 0) return 'No details available';
    return events.map(event => event.description).join('. ');
  }

  getSeverity(magnitudeOfDelay) {
    if (magnitudeOfDelay >= 4) return 'critical';
    if (magnitudeOfDelay >= 2) return 'high';
    if (magnitudeOfDelay >= 1) return 'medium';
    return 'low';
  }

  displayIncidents() {
    const incidentsList = document.getElementById('incidents-list');
    incidentsList.innerHTML = '';

    this.incidents.forEach(incident => {
      const incidentCard = this.createIncidentCard(incident);
      incidentsList.appendChild(incidentCard);
    });
  }

  createIncidentCard(incident) {
    const card = document.createElement('div');
    card.className = `incident-card severity-${incident.severity}`;
    
    const formatTime = (timestamp) => {
      if (!timestamp) return 'Unknown';
      return new Date(timestamp).toLocaleString();
    };

    // Safely format coordinates
    const formatCoords = (location) => {
      if (!Array.isArray(location) || location.length < 2) {
        return 'Location unavailable';
      }
      const lon = typeof location[0] === 'number' ? location[0].toFixed(4) : 'N/A';
      const lat = typeof location[1] === 'number' ? location[1].toFixed(4) : 'N/A';
      return `Lat: ${lat}, Lon: ${lon}`;
    };

    card.innerHTML = `
      <div class="incident-type">${incident.type}</div>
      <div class="incident-description">${incident.description}</div>
      <div class="incident-location">📍 ${formatCoords(incident.location)}</div>
      <div class="incident-time">⏰ Started: ${formatTime(incident.startTime)}</div>
    `;

    return card;
  }

  addMarkersToMap() {
    if (!this.map) return;

    this.incidents.forEach(incident => {
      // Validate coordinates before adding marker
      if (!Array.isArray(incident.location) || incident.location.length < 2) {
        console.warn('Invalid location for incident:', incident);
        return;
      }

      const [lon, lat] = incident.location;
      if (typeof lon !== 'number' || typeof lat !== 'number') {
        console.warn('Invalid coordinate values for incident:', incident);
        return;
      }

      try {
        const marker = new tt.Marker({
          color: this.getSeverityColor(incident.severity)
        })
        .setLngLat([lon, lat])
        .addTo(this.map);

        // Add popup with incident details
        const popup = new tt.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${incident.type}</h3>
            <p style="margin: 0 0 5px 0; font-size: 14px;">${incident.description}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Severity: ${incident.severity}</p>
          </div>
        `);

        marker.setPopup(popup);
        this.markers.push(marker);
      } catch (error) {
        console.warn('Error adding marker for incident:', incident, error);
      }
    });
  }

  getSeverityColor(severity) {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800', 
      high: '#f44336',
      critical: '#9c27b0'
    };
    return colors[severity] || '#666';
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  displayNoIncidents() {
    const incidentsList = document.getElementById('incidents-list');
    incidentsList.innerHTML = `
      <div class="no-incidents">
        No traffic incidents reported in this area at the moment.
      </div>
    `;
  }

  showDemoData() {
    // Show demo data when API is not available
    this.incidents = this.getDemoIncidents();
    this.displayIncidents();
    this.updateStatus('Showing demo data (API key required for live data)', 'success');
  }

  showDemoMode() {
    // Show a static map message when TomTom SDK is not available
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; padding: 2rem;">
        <div>
          <h3>Map View</h3>
          <p>TomTom Maps integration</p>
          <p><small>${CONFIG.currentLocation.name}</small></p>
        </div>
      </div>
    `;
  }

  getDemoIncidents() {
    const center = CONFIG.currentLocation.center;
    return [
      {
        id: 'demo1',
        type: 'Road Works',
        description: 'Construction work on the main carriageway. Expect delays.',
        location: [center.lon, center.lat],
        severity: 'medium',
        startTime: new Date().toISOString(),
        endTime: null
      },
      {
        id: 'demo2', 
        type: 'Lane Restrictions',
        description: 'One lane closed due to maintenance work.',
        location: [center.lon + 0.003, center.lat + 0.007],
        severity: 'low',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: null
      },
      {
        id: 'demo3',
        type: 'Accident',
        description: 'Minor vehicle collision reported. Traffic moving slowly.',
        location: [center.lon - 0.007, center.lat - 0.013],
        severity: 'high',
        startTime: new Date(Date.now() - 1800000).toISOString(),
        endTime: null
      }
    ];
  }

  updateStatus(message, type = 'loading') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TrafficIncidentsApp();
});
