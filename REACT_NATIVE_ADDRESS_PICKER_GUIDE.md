# 📍 QuickService - React Native Swiggy/Zomato Style Address Picker Guide

This document contains everything needed for the React Native mobile team to implement the address selection flow (Search Autocomplete, Center Pin Map, Reverse Geocoding, and Backend API Integration).

---

## 📌 1. Feature Workflow

1. **Address Search (Autocomplete)**: Customer types area/landmark -> Google Places Autocomplete displays suggestions -> Selecting an option animates the map to that exact location.
2. **Current Location (GPS)**: Clicking the GPS target icon uses device location and pans the map.
3. **Draggable Map with Center Fixed Pin (Swiggy / Zomato UX)**: The map pin stays fixed in the center of the screen while the user drags/pans the map. When dragging stops (`onRegionChangeComplete`), the app reverse-geocodes the center coordinates into a human-readable address.
4. **Address Details Form**: Bottom sheet to enter Flat/House No., Landmark, Receiver info, and Tag (`HOME`, `WORK`, `OTHER`).
5. **Save to Backend**: Submits the formatted address and GeoJSON coordinates `[longitude, latitude]`.

---

## 📦 2. Install Required Dependencies

Run in your React Native project root:

```bash
# Core Maps & Places Libraries
npm install react-native-maps react-native-google-places-autocomplete react-native-geolocation-service axios

# If using iOS, install pods
cd ios && pod install && cd ..
```

*(Note for Expo projects: Use `expo-location` and `react-native-maps` instead of `react-native-geolocation-service`)*

---

## ⚙️ 3. Native Permissions & Google Maps Key Configuration

### 🤖 Android Setup

1. Open `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 1. Location Permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application ...>
        <!-- 2. Google Maps API Key -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
    </application>
</manifest>
```

---

### 🍏 iOS Setup

1. Open `ios/YourAppName/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to deliver services to your exact address.</string>
```

2. In `ios/YourAppName/AppDelegate.mm` (or `AppDelegate.m`), add Google Maps initialization:
```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}
```

---

## 💻 4. Complete React Native Screen Code (`AddAddressScreen.jsx`)

Create `src/screens/AddAddressScreen.jsx` and paste the following code:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

// -------------------------------------------------------------
// CONFIGURATION: Replace with your actual values
// -------------------------------------------------------------
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/v1'; // e.g. http://10.0.2.2:3000/v1 on Android emulator

const AddAddressScreen = ({ navigation, route }) => {
  // Token passed via navigation params or your global auth state (Redux / Context)
  const userToken = route?.params?.token || 'YOUR_AUTH_TOKEN';

  const mapRef = useRef(null);

  // Map Coordinates & Region State
  const [region, setRegion] = useState({
    latitude: 19.0760, // Default fallback (e.g. Mumbai)
    longitude: 72.8777,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  });

  // Form Fields
  const [formattedAddress, setFormattedAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locationType, setLocationType] = useState('HOME');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // 1. Request GPS Permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'QuickService needs access to your location to set your address.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } else {
        Geolocation.requestAuthorization('whenInUse').then((res) => {
          if (res === 'granted') getCurrentLocation();
        });
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // 2. Fetch User Current Location
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        animateToLocation(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (error) => console.log('Location Error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 3. Smooth Pan Map to Coordinate
  const animateToLocation = (lat, lng) => {
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
  };

  // 4. Reverse Geocoding (Convert Lat/Lng -> Address components)
  const reverseGeocode = async (lat, lng) => {
    try {
      setFetchingAddress(true);
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (res.data?.results && res.data.results.length > 0) {
        const result = res.data.results[0];
        setFormattedAddress(result.formatted_address);

        // Parse address components
        result.address_components.forEach((component) => {
          if (component.types.includes('locality')) {
            setCity(component.long_name);
          }
          if (component.types.includes('administrative_area_level_1')) {
            setState(component.long_name);
          }
          if (component.types.includes('postal_code')) {
            setPinCode(component.long_name);
          }
        });
      }
    } catch (error) {
      console.log('Reverse Geocoding error:', error);
    } finally {
      setFetchingAddress(false);
    }
  };

  // 5. Called when user finishes dragging map under the center pin
  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  // 6. Submit Address to QuickService API
  const handleSaveAddress = async () => {
    if (!formattedAddress) {
      Alert.alert('Required', 'Please select a location on the map.');
      return;
    }
    if (!houseNumber.trim()) {
      Alert.alert('Required', 'Please enter your Flat / House / Building details.');
      return;
    }

    const payload = {
      address: formattedAddress,
      houseNumber: houseNumber.trim(),
      floor: floor.trim() || undefined,
      city: city || undefined,
      state: state || undefined,
      pinCode: pinCode || undefined,
      landmark: landmark.trim() || undefined,
      locationType, // 'HOME' | 'WORK' | 'OTHER'
      receiverName: receiverName.trim() || undefined,
      receiverMobile: receiverMobile ? Number(receiverMobile) : undefined,
      isDefault: true,
      latitude: region.latitude,
      longitude: region.longitude,
      location: {
        type: 'Point',
        coordinates: [region.longitude, region.latitude], // Mongo GeoJSON format: [lng, lat]
      },
    };

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/customer/address`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert('Success', 'Address added successfully!', [
          { text: 'OK', onPress: () => navigation?.goBack?.() },
        ]);
      }
    } catch (error) {
      console.error('Save Address Error:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || 'Failed to save address. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- TOP SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search area, apartment, street..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              const { lat, lng } = details.geometry.location;
              animateToLocation(lat, lng);
              reverseGeocode(lat, lng);
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            components: 'country:in', // Change country code if needed
          }}
          enablePoweredByContainer={false}
          styles={{
            container: { flex: 0 },
            textInput: styles.searchInput,
            listView: styles.searchListView,
          }}
        />
      </View>

      {/* --- MAP AREA WITH CENTER PIN --- */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        />

        {/* Fixed Center Pin (Swiggy / Zomato Pin) */}
        <View pointerEvents="none" style={styles.centerPinContainer}>
          <Text style={styles.pinIcon}>📍</Text>
          <View style={styles.pinShadow} />
        </View>

        {/* GPS Button */}
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.gpsIcon}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM SHEET FORM --- */}
      <ScrollView style={styles.bottomSheet} keyboardShouldPersistTaps="handled">
        <Text style={styles.sheetTitle}>SELECT DELIVERY LOCATION</Text>

        {/* Detected Formatted Address Box */}
        <View style={styles.addressBox}>
          {fetchingAddress ? (
            <ActivityIndicator size="small" color="#FF6B00" />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {formattedAddress || 'Move map to select location'}
            </Text>
          )}
        </View>

        {/* House / Flat No */}
        <TextInput
          style={styles.input}
          placeholder="House / Flat / Floor / Building *"
          placeholderTextColor="#999"
          value={houseNumber}
          onChangeText={setHouseNumber}
        />

        {/* Floor */}
        <TextInput
          style={styles.input}
          placeholder="Floor (Optional)"
          placeholderTextColor="#999"
          value={floor}
          onChangeText={setFloor}
        />

        {/* Landmark */}
        <TextInput
          style={styles.input}
          placeholder="Nearby Landmark (Optional)"
          placeholderTextColor="#999"
          value={landmark}
          onChangeText={setLandmark}
        />

        {/* Address Type Tag (HOME / WORK / OTHER) */}
        <Text style={styles.label}>SAVE AS</Text>
        <View style={styles.typeContainer}>
          {['HOME', 'WORK', 'OTHER'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeBtn,
                locationType === type && styles.typeBtnActive,
              ]}
              onPress={() => setLocationType(type)}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  locationType === type && styles.typeBtnTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Receiver Details */}
        <TextInput
          style={styles.input}
          placeholder="Receiver Name (Optional)"
          placeholderTextColor="#999"
          value={receiverName}
          onChangeText={setReceiverName}
        />
        <TextInput
          style={styles.input}
          placeholder="Receiver Mobile (Optional)"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
          value={receiverMobile}
          onChangeText={setReceiverMobile}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>SAVE & PROCEED</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 15,
    right: 15,
    zIndex: 999,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    color: '#000',
  },
  searchListView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    elevation: 5,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.42,
    width: '100%',
    position: 'relative',
  },
  map: { flex: 1 },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    alignItems: 'center',
  },
  pinIcon: { fontSize: 32 },
  pinShadow: {
    width: 8,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    marginTop: -2,
  },
  gpsButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gpsIcon: { fontSize: 20 },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetTitle: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  addressBox: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  addressText: { fontSize: 13, fontWeight: '600', color: '#222' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    fontSize: 14,
    color: '#000',
  },
  label: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 4, marginBottom: 8 },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },
  typeBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 35,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default AddAddressScreen;
```

---

## 📡 5. Backend API Reference

### **Endpoint**: `POST /v1/customer/address`
- **Method**: `POST`
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Payload Format**:
```json
{
  "address": "Shop 12, Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013",
  "houseNumber": "Flat 502, Tower B",
  "floor": "5th Floor",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400013",
  "locationType": "HOME",
  "landmark": "Near Palladium Mall",
  "receiverName": "John Doe",
  "receiverMobile": 9876543210,
  "isDefault": true,
  "latitude": 18.9930,
  "longitude": 72.8258,
  "location": {
    "type": "Point",
    "coordinates": [72.8258, 18.9930]
  }
}
```

---

## ⚠️ Important Notes for React Native Devs:
1. **Coordinates Format**: MongoDB standard expects **`[longitude, latitude]`** (Longitude first).
2. **Reverse Geocoding**: Automatically runs whenever user moves the map via `onRegionChangeComplete`.
3. **Google API Key**: Ensure that **Places API**, **Maps SDK for Android/iOS**, and **Geocoding API** are all enabled in Google Cloud Console.
