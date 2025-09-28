import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const fieldName = searchParams.get('fieldName');
    const filename = searchParams.get('filename');
    const format = searchParams.get('format');
    const quality = searchParams.get('quality');

    if (!recordId || !fieldName || !filename) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';
    const backendParams = new URLSearchParams({
      recordId,
      fieldName,
      filename,
      ...(format && { format }),
      ...(quality && { quality })
    });
    
    const backendImageUrl = `${backendUrl}/api/proxy-image?${backendParams.toString()}`;
    
    // Fetch image from backend
    const response = await fetch(backendImageUrl, {
      headers: {
        'User-Agent': 'Next.js Proxy',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    
    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
