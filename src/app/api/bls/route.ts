import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  if (!process.env.BLS_API_KEY) {
    console.error('BLS_API_KEY is not defined');
    return new Response('Internal Server Error', { status: 500 });
  }

  try {
    const requestData = {
      ...body,
      registration_key: process.env.BLS_API_KEY
    };

    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}