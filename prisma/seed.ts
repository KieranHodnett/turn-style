// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching MTA station data...');
  
  try {
    // Fetch data from the API
    const response = await fetch('https://data.ny.gov/resource/39hk-dx4f.json');
    const stationData = await response.json();
    
    console.log(`Received response with ${stationData.length} items`);
    
    // Clear existing data if needed
    console.log('Clearing existing station data...');
    await prisma.report.deleteMany();
    await prisma.station.deleteMany();
    
    console.log('Inserting stations into the database...');
    
    // Insert stations directly without deduplication
    let counter = 0;
    let errorCount = 0;
    
    for (const station of stationData) {
      try {
        // Skip if no name
        if (!station.stop_name) {
          console.log('Skipping station with no name');
          continue;
        }
        
        // Get coordinates
        let lat, long;
        
        // Try to get coordinates from gtfs_latitude/longitude first
        if (station.gtfs_latitude && station.gtfs_longitude) {
          lat = parseFloat(station.gtfs_latitude);
          long = parseFloat(station.gtfs_longitude);
        } 
        // Try georeference as fallback
        else if (station.georeference?.coordinates && 
                 Array.isArray(station.georeference.coordinates) && 
                 station.georeference.coordinates.length >= 2) {
          [long, lat] = station.georeference.coordinates;
        }
        
        // Skip stations without valid coordinates
        if (isNaN(lat) || isNaN(long)) {
          console.log(`Skipping station ${station.stop_name} due to missing coordinates`);
          continue;
        }
        
        // Process train lines
        let lines = [];
        if (station.daytime_routes) {
          // Split by spaces (since the example shows "N W")
          lines = station.daytime_routes.split(' ').map(line => line.trim()).filter(line => line);
        }
        
        // Insert station directly
        await prisma.station.create({
          data: {
            name: station.stop_name.trim(),
            latitude: lat,
            longitude: long,
            lines: lines,
            policeRecent: false, // Default value
          },
        });
        
        counter++;
        
        if (counter %50 === 0) {
          console.log(`Inserted ${counter} stations so far...`);
        }
      } catch (error) {
        console.error(`Error inserting station ${station.stop_name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Successfully added ${counter} stations to the database. Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in seed process:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });