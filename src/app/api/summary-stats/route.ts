import { NextResponse, NextRequest } from 'next/server';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const today = format(new Date(), 'yyyy-d-M');
  const isToday = startDate === today && endDate === today;

  const revenueQuery = isToday 
    ? `SELECT ISNULL(SUM(TOTAL), 0) AS TotalRevenue FROM VE_INVOICE WHERE TRANSDATE = convert(date, GETDATE()) AND DEPOTID IN (24, 25)`
    : `SELECT ISNULL(SUM(TOTAL), 0) AS TotalRevenue FROM VE_INVOICE WHERE TRANSDATE BETWEEN '${startDate}' AND '${endDate}' AND DEPOTID IN (24, 25)`;

  const ordersQuery = isToday
    ? `SELECT COUNT(*) AS TotalOrders FROM VE_INVOICE WHERE TRANSDATE = convert(date, GETDATE()) AND DEPOTID IN (24, 25)`
    : `SELECT COUNT(*) AS TotalOrders FROM VE_INVOICE WHERE TRANSDATE BETWEEN '${startDate}' AND '${endDate}' AND DEPOTID IN (24, 25)`;
  
  try {
    const [revenueRes, ordersRes] = await Promise.all([
      fetch('http://46.30.179.216:8640/TrexIntegrationService/REST/GetJson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Query: revenueQuery, ApiKey: '8059858119', ReturnSchema: false }),
      }).then(res => res.json()),
      fetch('http://46.30.179.216:8640/TrexIntegrationService/REST/GetJson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Query: ordersQuery, ApiKey: '8059858119', ReturnSchema: false }),
      }).then(res => res.json()),
    ]);

    const totalRevenue = JSON.parse(revenueRes)[0]?.TotalRevenue || 0;
    const totalOrders = JSON.parse(ordersRes)[0]?.TotalOrders || 0;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
    });
  } catch (error) {
    console.error('Failed to fetch summary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch summary stats' }, { status: 500 });
  }
}
