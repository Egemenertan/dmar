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

  const query = isToday
    ? `SELECT
          d.DEPOTNAME AS marketName,
          ISNULL(SUM(i.TOTAL), 0) AS totalRevenue,
          COUNT(*) AS totalOrders,
          CASE 
            WHEN COUNT(*) > 0 THEN ISNULL(SUM(i.TOTAL), 0) / COUNT(*)
            ELSE 0 
          END AS averageOrderAmount
        FROM VE_INVOICE i
        JOIN VE_DEPOT d ON i.DEPOTID = d.DEPOTID
        WHERE i.TRANSDATE = convert(date, GETDATE())
          AND i.DEPOTID IN (24, 25)
        GROUP BY d.DEPOTNAME`
    : `SELECT
          d.DEPOTNAME AS marketName,
          ISNULL(SUM(i.TOTAL), 0) AS totalRevenue,
          COUNT(*) AS totalOrders,
          CASE 
            WHEN COUNT(*) > 0 THEN ISNULL(SUM(i.TOTAL), 0) / COUNT(*)
            ELSE 0 
          END AS averageOrderAmount
        FROM VE_INVOICE i
        JOIN VE_DEPOT d ON i.DEPOTID = d.DEPOTID
        WHERE i.TRANSDATE BETWEEN '${startDate}' AND '${endDate}'
          AND i.DEPOTID IN (24, 25)
        GROUP BY d.DEPOTNAME`;

  try {
    const res = await fetch('http://185.110.241.184:8640/TrexIntegrationService/REST/GetJson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Query: query, ApiKey: '8059858119', ReturnSchema: false }),
    }).then(res => res.json());

    let depotStats = [];
    if (typeof res === 'string') {
      try {
        const parsedData = JSON.parse(res);
        if (Array.isArray(parsedData)) {
          depotStats = parsedData;
        }
      } catch (e) {
        console.error("Error parsing depot stats data:", e);
      }
    } else if (res && typeof res === 'object' && 'Message' in res) {
      console.error("API Error fetching depot stats:", (res as Record<string, unknown>).Message);
    }

    return NextResponse.json(depotStats);
  } catch (error) {
    console.error('Failed to fetch depot stats:', error);
    return NextResponse.json({ error: 'Failed to fetch depot stats' }, { status: 500 });
  }
}
