import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface PriceSuggestion {
  stockCode: string;
  currentPurchasePrice?: number;
  suggestedPurchasePrice?: number;
  currentSalesPrice?: number;
  suggestedSalesPrice?: number;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Auth kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      comparisonId,
      suggestions,
      fileName,
      totalProducts,
      avgPriceDifference,
      analysisData,
    } = body;

    // price_comparisons kaydı oluştur
    let finalComparisonId = comparisonId;

    if (!finalComparisonId) {
      const { data: comparisonData, error: comparisonError } = await supabase
        .from('price_comparisons')
        .insert({
          user_id: user.id,
          file_name: fileName || 'unknown.csv',
          total_products: totalProducts || 0,
          avg_price_difference: avgPriceDifference || 0,
          analysis_data: analysisData || {},
        })
        .select()
        .single();

      if (comparisonError) {
        console.error('Comparison insert error:', comparisonError);
        throw new Error('Failed to save comparison data');
      }

      finalComparisonId = comparisonData.id;
    }

    // Önerileri kaydet
    if (suggestions && suggestions.length > 0) {
      const suggestionRecords = suggestions.map((suggestion: PriceSuggestion) => ({
        comparison_id: finalComparisonId,
        stock_code: suggestion.stockCode,
        current_purchase_price: suggestion.currentPurchasePrice,
        suggested_purchase_price: suggestion.suggestedPurchasePrice,
        current_sales_price: suggestion.currentSalesPrice,
        suggested_sales_price: suggestion.suggestedSalesPrice,
        reason: suggestion.reason,
        status: 'pending',
        created_by: user.id,
      }));

      const { error: suggestionsError } = await supabase
        .from('price_update_suggestions')
        .insert(suggestionRecords);

      if (suggestionsError) {
        console.error('Suggestions insert error:', suggestionsError);
        throw new Error('Failed to save suggestions');
      }
    }

    return NextResponse.json({
      success: true,
      comparisonId: finalComparisonId,
      message: 'Fiyat güncelleme önerileri başarıyla kaydedildi',
    });
  } catch (error) {
    console.error('Failed to save price update suggestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to save price update suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Auth kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const comparisonId = searchParams.get('comparisonId');

    let query = supabase
      .from('price_update_suggestions')
      .select('*, price_comparisons(file_name, upload_date)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (comparisonId) {
      query = query.eq('comparison_id', comparisonId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, suggestions: data });
  } catch (error) {
    console.error('Failed to fetch price update suggestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price update suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Auth kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { suggestionId, status } = body;

    if (!suggestionId || !status) {
      return NextResponse.json(
        { error: 'suggestionId and status are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('price_update_suggestions')
      .update({ status })
      .eq('id', suggestionId)
      .eq('created_by', user.id); // Sadece kendi önerilerini güncelleyebilir

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Öneri durumu güncellendi',
    });
  } catch (error) {
    console.error('Failed to update suggestion status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update suggestion status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

