import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://cynoiot.com/api/timedata/ESP32-S2-100_995b489e/getoverview',
      {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ6ZWwuZGEuc3VwYWtyb25AZ21haWwuY29tIiwiaWF0IjoxNzY5NjgwODc5ODU3fQ.7JiZMArrUJ54b9acaKBUUCmstNt-Z8erfgV_Jw4SzNY',
        },
        cache: 'no-store', // Disable caching to always get fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch air quality data' },
      { status: 500 }
    );
  }
}
