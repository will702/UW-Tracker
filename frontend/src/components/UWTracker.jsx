import React, { useState, useMemo } from 'react';
import { Search, FileText, TrendingUp } from 'lucide-react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { mockUWData, getUWStats, searchUWData, formatReturn, formatPrice } from '../data/mockData';

const UWTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = useMemo(() => {
    return searchUWData(searchTerm);
  }, [searchTerm]);

  const stats = getUWStats();

  const handleSearch = (value) => {
    setSearchTerm(value);
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const getReturnColor = (returnValue) => {
    if (returnValue > 0) return 'text-green-600';
    if (returnValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBoardBadgeColor = (board) => {
    switch (board) {
      case 'Utama':
        return 'bg-blue-100 text-blue-800';
      case 'Pengembangan':
        return 'bg-green-100 text-green-800';
      case 'Akselerasi':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">UW Tracker</h1>
                <p className="text-sm text-gray-500">Track Record Underwriter IPO</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Mode Tamu</span>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Track Record Underwriter IPO Indonesia
          </h2>
          <p className="text-gray-600 mb-8">
            Analisis performa historis underwriter IPO berdasarkan data listing dan performa saham
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cari berdasarkan kode UW, Penjamin Emisi, atau Saham"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-3 w-full rounded-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Stats */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Total Data:</span>
              <span className="text-lg font-bold text-indigo-600">{stats.totalData}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Menampilkan:</span>
              <span className="text-lg font-bold text-indigo-600">{filteredData.length}</span>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">UW</TableHead>
                    <TableHead className="font-semibold text-gray-900">Kode</TableHead>
                    <TableHead className="font-semibold text-gray-900">Nama Perusahaan</TableHead>
                    <TableHead className="font-semibold text-gray-900">Harga IPO</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+1</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+2</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+3</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+4</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+5</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+6</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+7</TableHead>
                    <TableHead className="font-semibold text-gray-900">Papan</TableHead>
                    <TableHead className="font-semibold text-gray-900">Tanggal Listing</TableHead>
                    <TableHead className="font-semibold text-gray-900">Record</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-indigo-600">{item.uw}</TableCell>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={item.companyName}>
                          {item.companyName}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(item.ipoPrice)}</TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD1)}`}>
                        {formatReturn(item.returnD1)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD2)}`}>
                        {formatReturn(item.returnD2)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD3)}`}>
                        {formatReturn(item.returnD3)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD4)}`}>
                        {formatReturn(item.returnD4)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD5)}`}>
                        {formatReturn(item.returnD5)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD6)}`}>
                        {formatReturn(item.returnD6)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD7)}`}>
                        {formatReturn(item.returnD7)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getBoardBadgeColor(item.listingBoard)}>
                          {item.listingBoard}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(item.listingDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {item.record}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredData.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada data yang sesuai dengan pencarian</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UWTracker;