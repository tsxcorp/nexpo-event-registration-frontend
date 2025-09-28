import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const fieldName = searchParams.get('fieldName');
    const filename = searchParams.get('filename');
    const directUrl = searchParams.get('directUrl');
    const format = searchParams.get('format');
    const quality = searchParams.get('quality');

    // Handle both formats: directUrl (production) or recordId/fieldName/filename (local)
    if (!directUrl && (!recordId || !fieldName || !filename)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build backend URL - handle both local and production
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 
                      (process.env.NODE_ENV === 'production' 
                        ? 'https://nexpo-event-registration-backend-production.up.railway.app'
                        : 'http://localhost:3000');
    
    let backendImageUrl: string;
    
    if (directUrl) {
      // Production format: directUrl parameter
      const backendParams = new URLSearchParams({
        directUrl,
        ...(format && { format }),
        ...(quality && { quality })
      });
      backendImageUrl = `${backendUrl}/api/proxy-image?${backendParams.toString()}`;
    } else {
      // Local format: recordId, fieldName, filename parameters
      const backendParams = new URLSearchParams({
        recordId,
        fieldName,
        filename,
        ...(format && { format }),
        ...(quality && { quality })
      });
      backendImageUrl = `${backendUrl}/api/proxy-image?${backendParams.toString()}`;
    }
    
    
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
