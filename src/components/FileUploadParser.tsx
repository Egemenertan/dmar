'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface ParsedRow {
  stockCode: string;
  uploadedPurchasePrice?: number;
  uploadedSalesPrice?: number;
  uploadedShelfPrice?: number;
  uploadedDate?: string;
  [key: string]: string | number | undefined;
}

interface FileUploadParserProps {
  onDataParsed: (data: ParsedRow[], fileName: string) => void;
  onReset?: () => void;
}

interface ColumnMapping {
  stockCode: string;
  purchasePrice: string;
  salesPrice: string;
  shelfPrice: string;
  date: string;
}

type RawDataRow = Record<string, string | number | null>;

export default function FileUploadParser({
  onDataParsed,
  onReset,
}: FileUploadParserProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<RawDataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    stockCode: '',
    purchasePrice: '',
    salesPrice: '',
    shelfPrice: '',
    date: '',
  });
  const [previewData, setPreviewData] = useState<RawDataRow[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setError('');
    setFile(uploadedFile);

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      // CSV dosyası parse et
      Papa.parse(uploadedFile, {
        complete: (result) => {
          if (result.data && result.data.length > 0) {
            const data = result.data as RawDataRow[];
            const headerRow = data[0];
            const dataRows = data.slice(1).filter((row: RawDataRow) =>
              Object.values(row).some((val) => val !== null && val !== '')
            );

            setHeaders(Object.keys(headerRow));
            setRawData(dataRows);
            setPreviewData(dataRows.slice(0, 5));
            setStep('mapping');
          }
        },
        header: true,
        skipEmptyLines: true,
        error: (err) => {
          setError(`CSV parse hatası: ${err.message}`);
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Excel dosyası parse et
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length > 0) {
            const headerRow = jsonData[0] as unknown[];
            const dataRows = (jsonData.slice(1) as unknown[]).filter((row: unknown) => {
              const rowArray = row as (string | number | null)[];
              return rowArray.some((cell) => cell !== null && cell !== '');
            });

            // Object formatına çevir
            const parsedData = dataRows.map((row: unknown) => {
              const rowArray = row as (string | number | null)[];
              const obj: RawDataRow = {};
              headerRow.forEach((header: unknown, index: number) => {
                obj[String(header)] = rowArray[index];
              });
              return obj;
            });

            setHeaders(headerRow.map(h => String(h)));
            setRawData(parsedData);
            setPreviewData(parsedData.slice(0, 5));
            setStep('mapping');
          }
        } catch (err) {
          setError(`Excel parse hatası: ${(err as Error).message}`);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      setError('Desteklenmeyen dosya formatı. Lütfen CSV veya Excel dosyası yükleyin.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    if (!columnMapping.stockCode) {
      setError('Stok Kodu sütunu zorunludur!');
      return;
    }

    setError('');
    setStep('preview');
  };

  const handleConfirm = () => {
    try {
      const mappedData: ParsedRow[] = rawData.map((row) => {
        const parsedRow: ParsedRow = {
          stockCode: String(row[columnMapping.stockCode] || '').trim(),
        };

        if (columnMapping.purchasePrice && row[columnMapping.purchasePrice]) {
          const price = parseFloat(String(row[columnMapping.purchasePrice]));
          if (!isNaN(price)) {
            parsedRow.uploadedPurchasePrice = price;
          }
        }

        if (columnMapping.salesPrice && row[columnMapping.salesPrice]) {
          const price = parseFloat(String(row[columnMapping.salesPrice]));
          if (!isNaN(price)) {
            parsedRow.uploadedSalesPrice = price;
          }
        }

        if (columnMapping.shelfPrice && row[columnMapping.shelfPrice]) {
          const price = parseFloat(String(row[columnMapping.shelfPrice]));
          if (!isNaN(price)) {
            parsedRow.uploadedShelfPrice = price;
          }
        }

        if (columnMapping.date && row[columnMapping.date]) {
          parsedRow.uploadedDate = String(row[columnMapping.date]);
        }

        return parsedRow;
      }).filter((row) => row.stockCode); // Boş stok kodlarını filtrele

      if (mappedData.length === 0) {
        setError('Geçerli veri bulunamadı. Lütfen dosyanızı kontrol edin.');
        return;
      }

      onDataParsed(mappedData, file?.name || 'unknown.csv');
    } catch (err) {
      setError(`Veri işleme hatası: ${(err as Error).message}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({
      stockCode: '',
      purchasePrice: '',
      salesPrice: '',
      shelfPrice: '',
      date: '',
    });
    setPreviewData([]);
    setStep('upload');
    setError('');
    if (onReset) onReset();
  };

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dosya Yükle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  Dosyayı buraya bırakın...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    CSV veya Excel dosyanızı sürükleyin veya seçin
                  </p>
                  <p className="text-sm text-gray-500">
                    Desteklenen formatlar: .csv, .xlsx, .xls
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Sütun Eşleştirme</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Dosyanızdaki sütunları ilgili alanlara eşleştirin. Stok Kodu zorunludur.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stok Kodu <span className="text-red-500">*</span>
              </label>
              <Select
                value={columnMapping.stockCode}
                onValueChange={(value) => handleColumnMappingChange('stockCode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sütun seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alış Fiyatı</label>
              <Select
                value={columnMapping.purchasePrice || '__NONE__'}
                onValueChange={(value) =>
                  handleColumnMappingChange('purchasePrice', value === '__NONE__' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sütun seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Yok</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Satış Fiyatı</label>
              <Select
                value={columnMapping.salesPrice || '__NONE__'}
                onValueChange={(value) => handleColumnMappingChange('salesPrice', value === '__NONE__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sütun seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Yok</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tavsiye Raf Fiyatı</label>
              <Select
                value={columnMapping.shelfPrice || '__NONE__'}
                onValueChange={(value) => handleColumnMappingChange('shelfPrice', value === '__NONE__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sütun seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Yok</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tarih</label>
              <Select
                value={columnMapping.date || '__NONE__'}
                onValueChange={(value) => handleColumnMappingChange('date', value === '__NONE__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sütun seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Yok</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline">
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button onClick={handlePreview} disabled={!columnMapping.stockCode}>
                Önizle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Veri Önizleme</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              İlk 5 satır gösteriliyor. Toplam {rawData.length} satır yüklenecek.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Stok Kodu</th>
                    {columnMapping.purchasePrice && (
                      <th className="border p-2 text-left">Alış Fiyatı</th>
                    )}
                    {columnMapping.salesPrice && (
                      <th className="border p-2 text-left">Satış Fiyatı</th>
                    )}
                    {columnMapping.date && <th className="border p-2 text-left">Tarih</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2">{row[columnMapping.stockCode]}</td>
                      {columnMapping.purchasePrice && (
                        <td className="border p-2">{row[columnMapping.purchasePrice]}</td>
                      )}
                      {columnMapping.salesPrice && (
                        <td className="border p-2">{row[columnMapping.salesPrice]}</td>
                      )}
                      {columnMapping.date && (
                        <td className="border p-2">{row[columnMapping.date]}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setStep('mapping')} variant="outline">
                Geri
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Onayla ve Karşılaştır
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

