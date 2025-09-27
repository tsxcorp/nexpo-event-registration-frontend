import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      );
    }

    // Call the backend REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/events-rest/?eventId=${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching events from REST API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events from REST API' },
      { status: 500 }
    );
  }
}
