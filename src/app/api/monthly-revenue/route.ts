import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');

  // Use the provided date parameter, or default to today if not provided.
  const now = dateParam ? new Date(dateParam) : new Date();
  
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const query = `SELECT ISNULL(SUM(TOTAL), 0) AS MonthlyRevenue FROM VE_INVOICE WHERE TRANSDATE BETWEEN '${startDate}' AND '${endDate}' AND DEPOTID IN (24, 25)`;

  try {
    const response = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
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
    const monthlyRevenue = JSON.parse(data)[0]?.MonthlyRevenue || 0;

    return NextResponse.json({ monthlyRevenue });
  } catch (error) {
    console.error('Failed to fetch monthly revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly revenue' }, { status: 500 });
  }
}
