# Traffic Incidents Monitor

A real-time web application that displays live traffic incidents for any location worldwide using the TomTom Maps API.

## Features

- 🗺️ **Interactive Vector Maps** - High-quality TomTom vector maps with detailed street information
- � **Live Traffic Visualization** - Real-time traffic flow with color-coded congestion levels
- 🚨 **Live Traffic Incidents** - Real-time incident overlays and detailed incident information  
- � **Global Location Search** - Search and monitor traffic incidents in any city worldwide
- �📱 **Responsive Design** - Works seamlessly on mobile and desktop devices
- 🎛️ **Traffic Layer Controls** - Toggle traffic flow and incident overlays on/off
- 🔄 **Manual Refresh** - Get the latest incident data on demand
- 📍 **Detailed Incident Information** - View severity levels, descriptions, and precise locations
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations
- 🧭 **Enhanced Map Controls** - Navigation, geolocation, scale, and fullscreen controls
- 📊 **Traffic Legend** - Visual guide for understanding traffic flow colors

## Demo

The application shows traffic incidents including:
- Road accidents and collisions
- Construction and road works
- Lane closures and restrictions
- Weather-related incidents (fog, ice, flooding)
- Traffic congestion and clusters

## Prerequisites

- Node.js (version 14 or higher)
- TomTom Developer API key (free from [developer.tomtom.com](https://developer.tomtom.com/))

## Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Get TomTom API Key**
   - Visit [TomTom Developer Portal](https://developer.tomtom.com/)
   - Create a free account
   - Generate an API key for Maps SDK

3. **Configure API Key**
   - Copy your TomTom API key
   - Open the `.env` file in the project root
   - Replace `YOUR_TOMTOM_API_KEY_HERE` with your actual API key:
     ```
     VITE_TOMTOM_API_KEY=your_actual_api_key_here
     ```

4. **Run the Application**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Navigate to `http://localhost:5173`
   - The application will load with the default location (Sinhgad Road, Pune)

## Usage

- **Search Locations**: Use the search bar to find traffic incidents in any city (e.g., "Mumbai", "Delhi", "Bangalore", "London", "New York")
- **View Live Traffic**: See real-time traffic flow with color-coded roads:
  - 🟢 **Green**: Free flow traffic
  - 🟡 **Yellow**: Moderate traffic  
  - 🟠 **Orange**: Heavy traffic
  - 🔴 **Red**: Very heavy traffic/congestion
- **Toggle Traffic Layers**: Use the "Traffic Flow" and "Traffic Incidents" buttons to show/hide overlays
- **View Incidents**: Traffic incidents appear in the right panel with comprehensive details
- **Refresh Data**: Click "Refresh Data" to get the latest incidents for the current location
- **Map Navigation**: Use zoom, pan, and geolocation controls for easy navigation
- **Map Markers**: Click on markers to see incident details in interactive popups
- **Severity Levels**: Color-coded incidents (🟢 low, 🟠 medium, 🔴 high, 🟣 critical)

## Demo Mode

If no API key is configured, the application will show demo data with sample incidents to demonstrate the functionality.

## Project Structure

```
src/
├── main.js          # Main application logic
├── style.css        # Application styles
└── ...

public/              # Static assets
.env                 # Environment variables (API key)
index.html          # Main HTML template
package.json        # Project dependencies
```

## API Integration

The application uses the TomTom Traffic API to fetch real-time incident data:
- **Endpoint**: Traffic Incident Details API
- **Area**: Sinhgad Road, Pune (bounded box)
- **Data**: Incident type, location, severity, description, timestamps

## Customization

### Change Location
To monitor a different area, update the coordinates in `src/main.js`:

```javascript
const CONFIG = {
  sinhgadRoad: {
    center: { lat: YOUR_LAT, lon: YOUR_LON },
    bbox: {
      minLat: YOUR_MIN_LAT,
      maxLat: YOUR_MAX_LAT,
      minLon: YOUR_MIN_LON,
      maxLon: YOUR_MAX_LON
    }
  }
};
```

### Styling
Modify `src/style.css` to customize the appearance, colors, and layout.

## Development

- **Development Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Preview Production Build**: `npm run preview`

## Technologies Used

- **Vite** - Fast build tool and development server
- **Vanilla JavaScript** - No framework dependencies
- **TomTom Maps SDK** - Interactive maps and traffic data
- **CSS3** - Modern styling with flexbox and grid
- **HTML5** - Semantic markup

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

**Map not loading?**
- Check if TomTom API key is correctly configured
- Verify internet connection
- Check browser console for errors

**No incidents showing?**
- Verify API key has traffic API access
- Check if there are actual incidents in the Sinhgad Road area
- Try the refresh button

**Demo data showing?**
- This indicates the API key is not configured or invalid
- Follow the setup instructions to add your TomTom API key

## License

MIT License - feel free to use and modify for your projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues related to:
- **TomTom API**: Check [TomTom Developer Documentation](https://developer.tomtom.com/traffic-api/documentation)
- **Application bugs**: Open an issue in this repository
