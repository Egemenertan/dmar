import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8531462575:AAGfjr61CANhBfhETM5tE4dGn580Bw9xehQ';
const TELEGRAM_CHAT_ID = '1468860150';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    console.log('📱 Telegram API called');
    console.log('📝 Message length:', message?.length);

    if (!message) {
      console.error('❌ No message provided');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Sending to Telegram API...');
    
    // Telegram Bot API'ye direkt istek
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown', // Markdown formatını destekle
      }),
    });

    console.log('📡 Telegram response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Telegram API error:', errorData);
      throw new Error(`Telegram API returned ${response.status}: ${errorData.description || 'Unknown error'}`);
    }

    const responseData = await response.json();
    console.log('✅ Telegram response:', responseData);

    return NextResponse.json({ 
      success: true,
      messageId: responseData.result?.message_id,
    });
  } catch (error) {
    console.error('❌ Send Telegram error:', error);
    return NextResponse.json(
      { error: 'Failed to send Telegram message', details: (error as Error).message },
      { status: 500 }
    );
  }
}

