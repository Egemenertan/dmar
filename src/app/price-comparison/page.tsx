'use client';

import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import FileUploadParser, { ParsedRow } from '@/components/FileUploadParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';

interface ComparisonResult {
  stockCode: string;
  found: boolean;
  uploaded: {
    uploadedPurchasePrice?: number;
    uploadedSalesPrice?: number;
    uploadedShelfPrice?: number;
    uploadedDate?: string;
    calculatedMargin: number | null;
  };
  current: {
    stockId: number;
    stockCode: string;
    stockName: string;
    categoryCode: string | null;
    subCategory: string | null;
    currentPurchasePrice: number | null;
    currentSalesPrice: number | null;
    avgSalesPrice30Days: number | null;
    currentMargin: number | null;
    lastUpdateDate: string | null;
  } | null;
  comparison: {
    purchasePriceDiff: number | null;
    purchasePriceDiffPercent: number | null;
    salesPriceDiff: number | null;
    salesPriceDiffPercent: number | null;
    marginDiff: number | null;
    recommendation: string;
    suggestedSalesPrice: number | null;
  } | null;
}

interface SummaryStats {
  totalProducts: number;
  foundProducts: number;
  notFoundProducts: number;
  avgPurchasePriceDiff: number;
  avgSalesPriceDiff: number;
  productsWithPriceIncrease: number;
  productsWithPriceDecrease: number;
  productsNeedingUpdate: number;
}

export default function PriceComparisonPage() {
  const { user, supabase } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadedData, setUploadedData] = useState<ParsedRow[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [suggestionsSent, setSuggestionsSent] = useState(false);
  const [editedSuggestions, setEditedSuggestions] = useState<{ [key: string]: number }>({});
  const [savedComparisons, setSavedComparisons] = useState<Array<{
    id: string;
    fileName: string;
    savedAt: string;
    results: ComparisonResult[];
    summary: SummaryStats;
  }>>([]);
  const [editedSavedSuggestions, setEditedSavedSuggestions] = useState<{ [comparisonId: string]: { [stockCode: string]: number } }>({});
  const [updatingPrices, setUpdatingPrices] = useState<{ [key: string]: boolean }>({});
  const [bulkUpdating, setBulkUpdating] = useState<{ [comparisonId: string]: boolean }>({});
  const [loadingComparisons, setLoadingComparisons] = useState(true);

  // Hybrid: LocalStorage + Supabase (fallback)
  useEffect(() => {
    const loadComparisons = async () => {
      setLoadingComparisons(true);
      
      // 1. Önce LocalStorage'dan yükle (hızlı)
      try {
        const localData = localStorage.getItem('priceComparisons');
        if (localData) {
          const parsed = JSON.parse(localData);
          setSavedComparisons(parsed);
          console.log('✅ LocalStorage\'dan yüklendi:', parsed.length, 'karşılaştırma');
        }
      } catch (err) {
        console.error('LocalStorage okuma hatası:', err);
      }

      // 2. Eğer kullanıcı giriş yapmışsa Supabase'den de dene (optional)
      if (user?.id && supabase) {
        try {
          const { data, error } = await supabase
            .from('price_comparisons')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const formattedComparisons = data.map((item) => ({
              id: item.id,
              fileName: item.file_name,
              savedAt: item.created_at,
              results: item.comparison_data as ComparisonResult[],
              summary: {
                totalProducts: item.total_products || 0,
                foundProducts: item.found_products || 0,
                notFoundProducts: (item.total_products || 0) - (item.found_products || 0),
                avgPurchasePriceDiff: item.avg_price_difference || 0,
                avgSalesPriceDiff: 0,
                productsWithPriceIncrease: 0,
                productsWithPriceDecrease: 0,
                productsNeedingUpdate: 0,
              },
            }));
            setSavedComparisons(formattedComparisons);
            // LocalStorage'a da kaydet (sync)
            localStorage.setItem('priceComparisons', JSON.stringify(formattedComparisons));
            console.log('✅ Supabase\'den yüklendi:', formattedComparisons.length, 'karşılaştırma');
          }
        } catch (err) {
          // Supabase hatası - LocalStorage verisi varsa sorun yok
          console.log('ℹ️ Supabase yüklenemedi, LocalStorage kullanılıyor');
        }
      }
      
      setLoadingComparisons(false);
    };

    loadComparisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Sadece user.id değiştiğinde çağır

  // LocalStorage'a kaydet (her değişiklikte)
  useEffect(() => {
    if (savedComparisons.length > 0) {
      localStorage.setItem('priceComparisons', JSON.stringify(savedComparisons));
    }
  }, [savedComparisons]);

  const handleDataParsed = async (data: ParsedRow[], uploadedFileName: string) => {
    setUploadedData(data);
    setFileName(uploadedFileName);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/price-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockCodes: data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Fiyat karşılaştırması başarısız oldu');
      }

      const result = await response.json();
      console.log('API Result:', result);
      setComparisonResults(result.products);
      setSummary(result.summary);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedData([]);
    setComparisonResults([]);
    setSummary(null);
    setError('');
    setFileName('');
    setSuggestionsSent(false);
    setEditedSuggestions({});
  };

  const handleSaveComparison = async () => {
    if (!comparisonResults.length || !summary) return;

    try {
      setLoading(true);

      // Kullanıcının düzenlediği önerileri kaydet veya tavsiye raf fiyatını kullan
      const resultsWithEditedSuggestions = comparisonResults.map((item) => {
        const finalSuggestedPrice = editedSuggestions[item.stockCode] !== undefined
          ? editedSuggestions[item.stockCode]
          : item.uploaded.uploadedShelfPrice
          || item.comparison?.suggestedSalesPrice;

        if (finalSuggestedPrice !== undefined) {
          return {
            ...item,
            comparison: item.comparison ? {
              ...item.comparison,
              suggestedSalesPrice: finalSuggestedPrice,
            } : null,
          };
        }
        return item;
      });

      let newComparisonId = Date.now().toString();
      let savedAt = new Date().toISOString();

      // 1. Önce Supabase'e kaydetmeyi dene (opsiyonel)
      if (user?.id && supabase) {
        try {
          const { data, error: insertError } = await supabase
            .from('price_comparisons')
            .insert({
              user_id: user.id,
              file_name: fileName || 'Karşılaştırma',
              total_products: summary.totalProducts,
              found_products: summary.foundProducts,
              avg_price_difference: summary.avgPurchasePriceDiff,
              comparison_data: resultsWithEditedSuggestions,
            })
            .select()
            .single();

          if (!insertError && data) {
            newComparisonId = data.id;
            savedAt = data.created_at;
            console.log('✅ Supabase\'e kaydedildi:', data.id);
          } else {
            console.log('ℹ️ Supabase kayıt başarısız, LocalStorage kullanılıyor');
          }
        } catch (err) {
          console.log('ℹ️ Supabase hata, LocalStorage kullanılıyor');
        }
      }

      // 2. LocalStorage'a kaydet (her zaman)
      const newComparison = {
        id: newComparisonId,
        fileName: fileName || 'Karşılaştırma',
        savedAt: savedAt,
        results: resultsWithEditedSuggestions,
        summary: summary,
      };

      setSavedComparisons((prev) => [newComparison, ...prev]);
      setSuggestionsSent(true);
      console.log('✅ Karşılaştırma kaydedildi (ID:', newComparisonId, ')');

      // Telegram mesajı gönder
      try {
        // Mesaj içeriğini oluştur
        let telegramMessage = `📊 *FİYAT KARŞILAŞTIRMA RAPORU*\n\n`;
        telegramMessage += `📁 *Dosya:* ${fileName || 'Karşılaştırma'}\n`;
        telegramMessage += `📅 *Tarih:* ${new Date().toLocaleString('tr-TR')}\n`;
        telegramMessage += `📦 *Toplam:* ${summary.totalProducts} ürün\n`;
        telegramMessage += `✅ *Bulunan:* ${summary.foundProducts} ürün\n`;
        telegramMessage += `💰 *Ort. Fark:* ₺${summary.avgPurchasePriceDiff.toFixed(2)}\n\n`;
        telegramMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Tüm bulunan ürünleri ekle
        const foundProducts = resultsWithEditedSuggestions
          .filter(item => item.found)
          .slice(0, 20); // İlk 20 ürün
        
        if (foundProducts.length > 0) {
          foundProducts.forEach((item, index) => {
            telegramMessage += `*${index + 1}. ${item.current?.stockName}*\n`;
            telegramMessage += `📌 Kod: \`${item.stockCode}\`\n`;
            telegramMessage += `\n`;
            telegramMessage += `💵 *Yüklenen Alış:* ₺${item.uploaded.uploadedPurchasePrice?.toFixed(2) || '-'}\n`;
            telegramMessage += `💵 *Güncel Alış:* ₺${item.current?.currentPurchasePrice?.toFixed(2) || '-'}\n`;
            telegramMessage += `💵 *Güncel Satış:* ₺${item.current?.currentSalesPrice?.toFixed(2) || '-'}\n`;
            
            if (item.uploaded.uploadedShelfPrice) {
              telegramMessage += `🏷️ *Tavsiye Raf:* ₺${item.uploaded.uploadedShelfPrice.toFixed(2)}\n`;
            }
            
            if (item.comparison?.suggestedSalesPrice) {
              telegramMessage += `✨ *Önerilen Satış:* ₺${item.comparison.suggestedSalesPrice.toFixed(2)}\n`;
            }
            
            if (item.comparison?.purchasePriceDiffPercent) {
              const diffIcon = item.comparison.purchasePriceDiffPercent > 0 ? '🔴' : '🟢';
              telegramMessage += `${diffIcon} *Fark:* ${item.comparison.purchasePriceDiffPercent.toFixed(1)}%\n`;
            }
            
            telegramMessage += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
          });
          
          if (resultsWithEditedSuggestions.filter(item => item.found).length > 20) {
            telegramMessage += `_... ve ${resultsWithEditedSuggestions.filter(item => item.found).length - 20} ürün daha_\n`;
          }
        }

        console.log('📤 Telegram mesajı gönderiliyor...');
        const telegramResponse = await fetch('/api/send-telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: telegramMessage,
          }),
        });

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json();
          console.error('❌ Telegram API error:', errorData);
        } else {
          console.log('✅ Telegram mesajı başarıyla gönderildi!');
        }
      } catch (err) {
        console.error('❌ Telegram mesajı gönderilemedi:', err);
        // Hata olsa bile kayıt devam etsin
      }
    } catch (err) {
      console.error('❌ Karşılaştırma kaydedilemedi:', err);
      setError(`Kaydetme hatası: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionChange = (stockCode: string, value: number) => {
    setEditedSuggestions((prev) => ({
      ...prev,
      [stockCode]: value,
    }));
  };

  const handleSavedSuggestionChange = (comparisonId: string, stockCode: string, value: number) => {
    setEditedSavedSuggestions((prev) => ({
      ...prev,
      [comparisonId]: {
        ...(prev[comparisonId] || {}),
        [stockCode]: value,
      },
    }));
  };

  const handleUpdatePrice = async (comparisonId: string, item: ComparisonResult) => {
    const key = `${comparisonId}-${item.stockCode}`;
    setUpdatingPrices((prev) => ({ ...prev, [key]: true }));

    try {
      // Düzenlenmiş fiyatı al veya önce tavsiye raf fiyatını, sonra önerilen satış fiyatını kullan
      const newSalesPrice = editedSavedSuggestions[comparisonId]?.[item.stockCode] 
        || item.uploaded.uploadedShelfPrice
        || item.comparison?.suggestedSalesPrice;
      const newPurchasePrice = item.uploaded.uploadedPurchasePrice;

      console.log('🔄 Güncelleme başlatılıyor:', {
        stockCode: item.stockCode,
        newPurchasePrice,
        newSalesPrice,
        editedValue: editedSavedSuggestions[comparisonId]?.[item.stockCode],
        shelfPrice: item.uploaded.uploadedShelfPrice,
        originalSuggestion: item.comparison?.suggestedSalesPrice,
      });

      if (!newSalesPrice || !newPurchasePrice) {
        alert('Fiyat bilgileri eksik!');
        return;
      }

      // API'ye fiyat güncelleme isteği gönder
      const response = await fetch('/api/update-stock-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockCode: item.stockCode,
          stockName: item.current?.stockName,
          purchasePrice: newPurchasePrice,
          salesPrice: newSalesPrice,
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.details || 'Fiyat güncellenemedi');
        } catch {
          throw new Error('Fiyat güncellenemedi: ' + errorText.substring(0, 200));
        }
      }

      const result = await response.json();
      console.log('✅ API Success Response:', result);

      alert(`✅ ${item.stockCode} - Fiyatlar başarıyla güncellendi!\n\nAlış: ₺${newPurchasePrice.toFixed(2)}\nSatış: ₺${newSalesPrice.toFixed(2)}`);
      return true;
    } catch (err) {
      console.error('❌ Fiyat güncelleme hatası:', err);
      alert(`❌ Fiyat güncellenemedi: ${(err as Error).message}`);
      return false;
    } finally {
      setUpdatingPrices((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleBulkUpdate = async (comparisonId: string, results: ComparisonResult[]) => {
    if (!confirm(`⚠️ ${results.filter(r => r.found).length} ürünün fiyatları toplu olarak güncellenecek. Devam etmek istiyor musunuz?`)) {
      return;
    }

    setBulkUpdating((prev) => ({ ...prev, [comparisonId]: true }));
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      // Bulunan ve güncellenebilir ürünleri filtrele
      const updateableItems = results.filter(item => {
        const hasPrice = editedSavedSuggestions[comparisonId]?.[item.stockCode]
          || item.uploaded.uploadedShelfPrice
          || item.comparison?.suggestedSalesPrice;
        return item.found && hasPrice && item.uploaded.uploadedPurchasePrice;
      });

      console.log(`🔄 Toplu güncelleme başlatılıyor: ${updateableItems.length} ürün`);

      // Her ürünü sırayla güncelle
      for (const item of updateableItems) {
        try {
          const newSalesPrice = editedSavedSuggestions[comparisonId]?.[item.stockCode]
            || item.uploaded.uploadedShelfPrice
            || item.comparison?.suggestedSalesPrice;
          const newPurchasePrice = item.uploaded.uploadedPurchasePrice;

          if (!newSalesPrice || !newPurchasePrice) continue;

          const response = await fetch('/api/update-stock-price', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stockCode: item.stockCode,
              stockName: item.current?.stockName,
              purchasePrice: newPurchasePrice,
              salesPrice: newSalesPrice,
            }),
          });

          if (response.ok) {
            successCount++;
            console.log(`✅ ${item.stockCode} güncellendi`);
          } else {
            failCount++;
            const errorData = await response.json().catch(() => ({}));
            errors.push(`${item.stockCode}: ${errorData.error || 'Hata'}`);
            console.error(`❌ ${item.stockCode} güncellenemedi:`, errorData);
          }

          // Her 5 üründe bir kısa bekleme (API yükünü azaltmak için)
          if ((successCount + failCount) % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (err) {
          failCount++;
          errors.push(`${item.stockCode}: ${(err as Error).message}`);
          console.error(`❌ ${item.stockCode} hatası:`, err);
        }
      }

      // Sonuç mesajı
      let resultMessage = `✅ Toplu Güncelleme Tamamlandı!\n\n`;
      resultMessage += `✔️ Başarılı: ${successCount} ürün\n`;
      if (failCount > 0) {
        resultMessage += `❌ Başarısız: ${failCount} ürün\n`;
        if (errors.length > 0) {
          resultMessage += `\nHatalar:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            resultMessage += `\n... ve ${errors.length - 5} hata daha`;
          }
        }
      }

      alert(resultMessage);
    } catch (err) {
      console.error('❌ Toplu güncelleme hatası:', err);
      alert(`❌ Toplu güncelleme başarısız: ${(err as Error).message}`);
    } finally {
      setBulkUpdating((prev) => ({ ...prev, [comparisonId]: false }));
    }
  };



  const handleExportExcel = () => {
    const exportData = comparisonResults.map((item) => ({
      'Stok Kodu': item.stockCode,
      'Ürün Adı': item.current?.stockName || 'Bulunamadı',
      'Kategori': item.current?.categoryCode || '-',
      'Yüklenen Alış Fiyatı': item.uploaded.uploadedPurchasePrice || '-',
      'Güncel Alış Fiyatı': item.current?.currentPurchasePrice || '-',
      'Alış Fiyat Farkı': item.comparison?.purchasePriceDiff?.toFixed(2) || '-',
      'Alış Fiyat Farkı (%)': item.comparison?.purchasePriceDiffPercent?.toFixed(2) || '-',
      'Yüklenen Satış Fiyatı': item.uploaded.uploadedSalesPrice || '-',
      'Güncel Satış Fiyatı': item.current?.currentSalesPrice || '-',
      'Satış Fiyat Farkı': item.comparison?.salesPriceDiff?.toFixed(2) || '-',
      'Satış Fiyat Farkı (%)': item.comparison?.salesPriceDiffPercent?.toFixed(2) || '-',
      'Yüklenen Kar Marjı (%)': item.uploaded.calculatedMargin?.toFixed(2) || '-',
      'Güncel Kar Marjı (%)': item.current?.currentMargin?.toFixed(2) || '-',
      'Kar Marjı Farkı (%)': item.comparison?.marginDiff?.toFixed(2) || '-',
      Öneri: item.comparison?.recommendation || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fiyat Karşılaştırma');
    XLSX.writeFile(wb, `fiyat_karsilastirma_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ALIŞ FİYATI İÇİN: Yüklenen - Güncel
  // Pozitif = Yüklenen daha yüksek = KÖTÜ (kırmızı ↑)
  // Negatif = Yüklenen daha düşük = İYİ (yeşil ↓)
  const getPriceChangeIcon = (diffPercent: number | null | undefined) => {
    if (!diffPercent) return <Minus className="h-4 w-4 text-gray-400" />;
    // Yüklenen > Güncel (pozitif) = Yüklenen fiyat yüksek = KÖTÜ (kırmızı yukarı)
    if (diffPercent > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    // Yüklenen < Güncel (negatif) = Yüklenen fiyat düşük = İYİ (yeşil aşağı)
    if (diffPercent < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getPriceChangeBadge = (diffPercent: number | null | undefined) => {
    if (!diffPercent) return null;
    if (Math.abs(diffPercent) < 5)
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Stabil
        </Badge>
      );
    // Yüklenen > Güncel (pozitif) = Yüklenen fiyat yüksek = KÖTÜ (kırmızı)
    if (diffPercent > 0)
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Yüksek
        </Badge>
      );
    // Yüklenen < Güncel (negatif) = Yüklenen fiyat düşük = İYİ (yeşil)
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Düşük
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fiyat Karşılaştırma ve Analiz</h1>
        <p className="text-gray-500 mt-2">
          CSV/Excel dosyanızı yükleyerek ürün fiyatlarınızı güncel verilerle karşılaştırın
        </p>
      </div>

        {!comparisonResults.length ? (
          <FileUploadParser onDataParsed={handleDataParsed} onReset={handleReset} />
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Detaylı Karşılaştırma</CardTitle>
                  <div className="flex gap-2">
                    {!suggestionsSent ? (
                      <Button
                        onClick={handleSaveComparison}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Kaydet
                      </Button>
                    ) : (
                      <Button disabled className="bg-gray-400">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Kaydedildi
                      </Button>
                    )}
                    <Button onClick={handleExportExcel} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Excel İndir
                    </Button>
                    <Button onClick={handleReset} variant="outline">
                      Yeni Analiz
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2" style={{ background: 'linear-gradient(to right, #f9fafb, #f3f4f6)', borderBottomColor: '#63A860' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stok Kodu</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ürün Adı</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Yüklenen Alış</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Güncel Alış</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Fark %</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Güncel Satış</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Kar Marjı</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Durum</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tavsiye Raf</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Önerilen Satış</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comparisonResults.map((item, index) => (
                        <tr key={index} className={`
                          transition-all duration-150 hover:bg-[#63A860]/5
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                        `}>
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {item.stockCode}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {item.current?.stockName ? (
                              <span className="text-sm font-medium text-gray-900">{item.current.stockName}</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Bulunamadı</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold" style={{ color: '#63A860' }}>
                              ₺{item.uploaded.uploadedPurchasePrice?.toFixed(2) || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold text-gray-700">
                              ₺{item.current?.currentPurchasePrice?.toFixed(2) || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {getPriceChangeIcon(item.comparison?.purchasePriceDiffPercent)}
                              <span className="text-sm font-bold">
                                {item.comparison?.purchasePriceDiffPercent?.toFixed(1) || '-'}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold text-gray-700">
                              ₺{item.current?.currentSalesPrice?.toFixed(2) || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#63A860', color: 'white' }}>
                              {item.current?.currentMargin?.toFixed(1) || '-'}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getPriceChangeBadge(item.comparison?.purchasePriceDiffPercent)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold text-purple-600">
                              {item.uploaded.uploadedShelfPrice ? `₺${item.uploaded.uploadedShelfPrice.toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {item.found ? (
                              <input
                                type="number"
                                step="0.01"
                                placeholder="₺ Fiyat"
                                value={
                                  editedSuggestions[item.stockCode] !== undefined
                                    ? editedSuggestions[item.stockCode]
                                    : item.uploaded.uploadedShelfPrice
                                    ? item.uploaded.uploadedShelfPrice.toFixed(2)
                                    : item.comparison?.suggestedSalesPrice
                                    ? item.comparison.suggestedSalesPrice.toFixed(2)
                                    : ''
                                }
                                onChange={(e) =>
                                  handleSuggestionChange(item.stockCode, parseFloat(e.target.value))
                                }
                                className="w-28 px-3 py-2 text-right border-2 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:border-transparent
                                         bg-white text-sm font-semibold
                                         hover:border-[#63A860] transition-colors"
                                style={{ borderColor: '#63A860', color: '#63A860', '--tw-ring-color': '#63A860' } as React.CSSProperties}
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Veriler analiz ediliyor...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Kaydedilmiş Karşılaştırmalar */}
        {loadingComparisons && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Kaydedilmiş karşılaştırmalar yükleniyor...</p>
          </div>
        )}

        {!loadingComparisons && savedComparisons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Kaydedilmiş Karşılaştırmalar ({savedComparisons.length})</h2>
            {savedComparisons.map((saved) => (
              <Card key={saved.id} className="border-blue-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{saved.fileName}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Kaydedilme: {new Date(saved.savedAt).toLocaleString('tr-TR')}
                      </p>
                      <div className="flex gap-4 mt-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {saved.summary.totalProducts} Ürün
                        </Badge>
                        <Badge variant="outline" className="bg-green-50">
                          {saved.summary.foundProducts} Bulundu
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50">
                          Ort. Fark: ₺{saved.summary.avgPurchasePriceDiff.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#63A860] hover:bg-[#507d4e] text-white"
                        onClick={() => handleBulkUpdate(saved.id, saved.results)}
                        disabled={bulkUpdating[saved.id]}
                      >
                        {bulkUpdating[saved.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Güncelleniyor...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Toplu Güncelle ({saved.results.filter(r => r.found).length})
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const ws = XLSX.utils.json_to_sheet(
                            saved.results.map((item) => ({
                              'Stok Kodu': item.stockCode,
                              'Ürün Adı': item.current?.stockName || 'Bulunamadı',
                              'Yüklenen Alış': item.uploaded.uploadedPurchasePrice || '-',
                              'Güncel Alış': item.current?.currentPurchasePrice || '-',
                              'Güncel Satış': item.current?.currentSalesPrice || '-',
                              'Marj %': item.current?.currentMargin?.toFixed(1) || '-',
                              'Fark %': item.comparison?.purchasePriceDiffPercent?.toFixed(1) || '-',
                              'Önerilen Satış': item.comparison?.suggestedSalesPrice?.toFixed(2) || '-',
                            }))
                          );
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Karşılaştırma');
                          XLSX.writeFile(wb, `${saved.fileName}_${saved.id}.xlsx`);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel İndir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        onClick={async () => {
                          if (confirm('Bu karşılaştırmayı silmek istediğinize emin misiniz?')) {
                            try {
                              // 1. Supabase'den silmeyi dene (UUID ise)
                              if (user?.id && supabase && saved.id.includes('-')) {
                                try {
                                  await supabase
                                    .from('price_comparisons')
                                    .delete()
                                    .eq('id', saved.id);
                                  console.log('✅ Supabase\'den silindi:', saved.id);
                                } catch (err) {
                                  console.log('ℹ️ Supabase silme hatası (devam ediliyor)');
                                }
                              }

                              // 2. LocalStorage ve State'den sil (her zaman)
                              setSavedComparisons((prev) => prev.filter((c) => c.id !== saved.id));
                              console.log('✅ Karşılaştırma silindi');
                            } catch (err) {
                              console.error('❌ Silme hatası:', err);
                              alert('Silme işlemi başarısız oldu!');
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2" style={{ background: 'linear-gradient(to right, #f9fafb, #f3f4f6)', borderBottomColor: '#63A860' }}>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kod</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ürün</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Yük. Alış</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Güncel Alış</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Fark</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Satış</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Marj</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Durum</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Raf</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Öneri</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {saved.results.map((item, index) => (
                          <tr key={index} className={`
                            transition-all duration-150 hover:bg-[#63A860]/5
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                          `}>
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {item.stockCode}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs font-medium text-gray-900">
                              {item.current?.stockName || (
                                <span className="text-red-500">Bulunamadı</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-xs font-semibold" style={{ color: '#63A860' }}>
                                ₺{item.uploaded.uploadedPurchasePrice?.toFixed(2) || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-xs font-semibold text-gray-700">
                                ₺{item.current?.currentPurchasePrice?.toFixed(2) || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {getPriceChangeIcon(item.comparison?.purchasePriceDiffPercent)}
                                <span className="text-xs font-bold">
                                  {item.comparison?.purchasePriceDiffPercent?.toFixed(1) || '-'}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-xs font-semibold text-gray-700">
                                ₺{item.current?.currentSalesPrice?.toFixed(2) || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#63A860', color: 'white' }}>
                                {item.current?.currentMargin?.toFixed(1) || '-'}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {getPriceChangeBadge(item.comparison?.purchasePriceDiffPercent)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-xs font-semibold text-purple-600">
                                {item.uploaded.uploadedShelfPrice ? `₺${item.uploaded.uploadedShelfPrice.toFixed(2)}` : '-'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {item.found && (item.uploaded.uploadedShelfPrice || item.comparison?.suggestedSalesPrice || item.uploaded.uploadedPurchasePrice) ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="₺"
                                  value={
                                    editedSavedSuggestions[saved.id]?.[item.stockCode] !== undefined
                                      ? editedSavedSuggestions[saved.id][item.stockCode]
                                      : item.uploaded.uploadedShelfPrice
                                      ? item.uploaded.uploadedShelfPrice.toFixed(2)
                                      : item.comparison?.suggestedSalesPrice?.toFixed(2) || ''
                                  }
                                  onChange={(e) =>
                                    handleSavedSuggestionChange(saved.id, item.stockCode, parseFloat(e.target.value))
                                  }
                                  className="w-20 px-2 py-1 text-xs text-right border-2 rounded focus:outline-none focus:ring-1"
                                  style={{ borderColor: '#63A860', color: '#63A860' }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {item.found && (item.uploaded.uploadedShelfPrice || item.comparison?.suggestedSalesPrice || item.uploaded.uploadedPurchasePrice) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 hover:bg-[#63A860]/10"
                                  style={{ borderColor: '#63A860', color: '#63A860' }}
                                  onClick={() => handleUpdatePrice(saved.id, item)}
                                  disabled={updatingPrices[`${saved.id}-${item.stockCode}`]}
                                >
                                  {updatingPrices[`${saved.id}-${item.stockCode}`] ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: '#63A860' }} />
                                  ) : (
                                    'Güncelle'
                                  )}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

