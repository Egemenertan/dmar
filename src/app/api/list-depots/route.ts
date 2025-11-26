import { NextResponse } from 'next/server';

export async function GET() {
  // Tüm depoları listele
  const query = `SELECT DEPOTID, DEPOTNO, DEPOTNAME, DEPOTTYPE FROM VE_DEPOT ORDER BY DEPOTID`;

  try {
    const response = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Query: query,
        ApiKey: '8059858119',
        ReturnSchema: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the response (sometimes it's double-encoded)
    let depots = [];
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData)) {
          depots = parsedData;
        }
      } catch (e) {
        console.error("Error parsing depot data:", e);
      }
    } else if (Array.isArray(data)) {
      depots = data;
    }

    console.log('📦 Available Depots:', depots);

    return NextResponse.json({
      success: true,
      depots,
      count: depots.length,
    });
  } catch (error) {
    console.error('Failed to fetch depots:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch depots',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

