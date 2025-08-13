"use client"

import { useState, useEffect, useCallback } from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon, 
  BarChart3,
  Package,
  TrendingUp,
  RefreshCw,
  PieChart
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface CategoryRevenue {
  mainCategoryCode: string;
  mainCategoryName: string;
  subCategoryCode: string;
  subCategoryName: string;
  brand: string | null;
  itemCount: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  // Backward compatibility
  categoryCode: string;
  categoryName: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#FF7300', '#00FF88', '#FF0088'
];

export default function CategoryRevenuePage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const [categoryData, setCategoryData] = useState<CategoryRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryRevenue = useCallback(async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    setCategoryData([]);
    setError(null);

    const startDate = date.from;
    const endDate = date.to;
    const dateRange = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Kategori verilerini biriktir
    const accumulatedCategoryData: { [key: string]: CategoryRevenue } = {};

    for (const day of dateRange) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      
      try {
        const response = await fetch(`/api/category-revenue?startDate=${formattedDate}&endDate=${formattedDate}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`API Error for ${formattedDate}:`, errorData);
          setError(`API hatası: ${errorData.details || errorData.error || 'Bilinmeyen hata'}`);
          continue;
        }
        
        const dailyData = await response.json();
        console.log(`Category data for ${formattedDate}:`, dailyData);

        if (Array.isArray(dailyData)) {
          dailyData.forEach(category => {
            // Ana kategori + Alt kategori kombinasyonu ile unique key oluştur
            const key = `${category.mainCategoryCode}_${category.subCategoryCode}`;
            if (!accumulatedCategoryData[key]) {
              accumulatedCategoryData[key] = {
                mainCategoryCode: category.mainCategoryCode,
                mainCategoryName: category.mainCategoryName,
                subCategoryCode: category.subCategoryCode,
                subCategoryName: category.subCategoryName,
                brand: category.brand,
                itemCount: 0,
                totalQuantity: 0,
                totalRevenue: 0,
                averagePrice: 0,
                categoryCode: category.categoryCode,
                categoryName: category.categoryName
              };
            }
            
            accumulatedCategoryData[key].itemCount += category.itemCount;
            accumulatedCategoryData[key].totalQuantity += category.totalQuantity;
            accumulatedCategoryData[key].totalRevenue += category.totalRevenue;
          });
        } else {
          console.warn(`No category data found for ${formattedDate}`);
        }
      } catch (error) {
        console.error(`Failed to fetch category data for ${formattedDate}:`, error);
        setError(`Veri çekme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    }

    // Ortalama fiyatları hesapla
    const finalCategoryData = Object.values(accumulatedCategoryData).map(category => ({
      ...category,
      averagePrice: category.totalQuantity > 0 ? category.totalRevenue / category.totalQuantity : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    setCategoryData(finalCategoryData);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchCategoryRevenue();
  }, [fetchCategoryRevenue]);

  const totalRevenue = categoryData.reduce((sum, category) => sum + category.totalRevenue, 0);
  const totalItems = categoryData.reduce((sum, category) => sum + category.itemCount, 0);

  // Ana kategori bazlı özet
  const mainCategorySummary = categoryData.reduce((acc, category) => {
    const mainKey = category.mainCategoryCode;
    if (!acc[mainKey]) {
      acc[mainKey] = {
        name: category.mainCategoryName,
        totalRevenue: 0,
        itemCount: 0,
        subCategories: 0
      };
    }
    acc[mainKey].totalRevenue += category.totalRevenue;
    acc[mainKey].itemCount += category.itemCount;
    acc[mainKey].subCategories++;
    return acc;
  }, {} as Record<string, { name: string; totalRevenue: number; itemCount: number; subCategories: number }>);

  const mainCategoryData = Object.values(mainCategorySummary).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Pie chart için ana kategori verisi hazırla
  const pieChartData = mainCategoryData.map(category => ({
    name: category.name,
    value: category.totalRevenue,
    percentage: totalRevenue > 0 ? ((category.totalRevenue / totalRevenue) * 100).toFixed(1) : '0'
  }));

  // Bar chart için ana kategori verisi hazırla
  const barChartData = mainCategoryData.slice(0, 10).map(category => ({
    name: category.name.length > 15 ? category.name.substring(0, 12) + '...' : category.name,
    revenue: category.totalRevenue,
    quantity: category.itemCount
  }));

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Kategori Bazlı Satış Raporu</h2>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-[300px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Tarih Seçin</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setDate({from: new Date(), to: new Date()})}>Bugün</Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchCategoryRevenue}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Veri Yükleme Hatası</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">
              Satış yapılan kategori sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalRevenue.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              Tüm kategorilerden toplam gelir
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Satılan toplam ürün sayısı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana Kategori Özeti */}
      <Card>
        <CardHeader>
          <CardTitle>Ana Kategori Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainCategoryData.slice(0, 6).map((category, index) => (
                <div key={category.name} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <h4 className="font-medium text-sm">{category.name}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ciro:</span>
                      <span className="font-medium">₺{category.totalRevenue.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alt Kategori:</span>
                      <span>{category.subCategories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ürün:</span>
                      <span>{category.itemCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Kategori Dağılımı (Ciro)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">Yükleniyor...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              En Çok Satış Yapan Kategoriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">Yükleniyor...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Kategori Raporu (Ana &gt; Alt Kategori)</CardTitle>
          <p className="text-sm text-gray-600">
            Her satır bir ana kategori &gt; alt kategori &gt; marka kombinasyonunu gösterir
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ana Kategori</TableHead>
                    <TableHead>Alt Kategori</TableHead>
                    <TableHead>Marka</TableHead>
                    <TableHead className="text-right">Ürün Sayısı</TableHead>
                    <TableHead className="text-right">Toplam Miktar</TableHead>
                    <TableHead className="text-right">Toplam Ciro</TableHead>
                    <TableHead className="text-right">Ortalama Fiyat</TableHead>
                    <TableHead className="text-right">Pay (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((category, index) => {
                    const percentage = totalRevenue > 0 ? ((category.totalRevenue / totalRevenue) * 100).toFixed(1) : '0';
                    return (
                      <TableRow key={`${category.mainCategoryCode}_${category.subCategoryCode}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-semibold">{category.mainCategoryName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {category.subCategoryName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {category.brand ? (
                            <Badge variant="secondary" className="text-xs">
                              {category.brand}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{category.itemCount}</TableCell>
                        <TableCell className="text-right">{category.totalQuantity.toLocaleString('tr-TR')}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₺{category.totalRevenue.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₺{category.averagePrice.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{percentage}%</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
