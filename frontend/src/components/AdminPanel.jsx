import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Upload, Download, Save, X, AlertCircle, CheckCircle, Trash2, Search, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { uwAPI, formatReturn, formatPrice, formatDate } from '../services/api';

const AdminPanel = () => {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isManagingData, setIsManagingData] = useState(false);
  const [uwData, setUwData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteRecordId, setDeleteRecordId] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [formData, setFormData] = useState({
    uw: '',
    code: '',
    companyName: '',
    ipoPrice: '',
    returnD1: '',
    returnD2: '',
    returnD3: '',
    returnD4: '',
    returnD5: '',
    returnD6: '',
    returnD7: '',
    listingBoard: '',
    listingDate: '',
    record: ''
  });
  const [bulkData, setBulkData] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Clear message after 5 seconds
  const showMessage = useCallback((type, content) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: '', content: '' }), 5000);
  }, []);

  // Fetch UW data from API
  const fetchUWData = useCallback(async (search = '') => {
    try {
      setIsLoading(true);
      const response = await uwAPI.getAllRecords(search, 50, 0);
      setUwData(response.data || []);
      setDisplayedCount(response.count || 0);
    } catch (err) {
      console.error('Error fetching UW data:', err);
      showMessage('error', `Failed to load data: ${err.message}`);
      setUwData([]);
      setDisplayedCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  // Load data when manage data panel is opened
  useEffect(() => {
    if (isManagingData) {
      fetchUWData(searchTerm);
    }
  }, [isManagingData, fetchUWData, searchTerm]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (isManagingData) {
      fetchUWData(value);
    }
  };

  // Handle delete record
  const handleDeleteRecord = async (recordId) => {
    try {
      setIsLoading(true);
      await uwAPI.deleteRecord(recordId);
      showMessage('success', 'Record deleted successfully');
      
      // Refresh data
      await fetchUWData(searchTerm);
      setDeleteRecordId(null);
      
    } catch (error) {
      showMessage('error', `Failed to delete record: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form data
  const validateForm = () => {
    const required = ['uw', 'code', 'companyName', 'ipoPrice', 'listingBoard', 'listingDate'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      showMessage('error', `Required fields missing: ${missing.join(', ')}`);
      return false;
    }

    if (isNaN(parseFloat(formData.ipoPrice)) || parseFloat(formData.ipoPrice) <= 0) {
      showMessage('error', 'IPO Price must be a positive number');
      return false;
    }

    return true;
  };

  // Submit new record
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const recordData = {
        uw: formData.uw.toUpperCase(),
        code: formData.code.toUpperCase(),
        companyName: formData.companyName,
        ipoPrice: parseFloat(formData.ipoPrice),
        returnD1: formData.returnD1 ? parseFloat(formData.returnD1) : null,
        returnD2: formData.returnD2 ? parseFloat(formData.returnD2) : null,
        returnD3: formData.returnD3 ? parseFloat(formData.returnD3) : null,
        returnD4: formData.returnD4 ? parseFloat(formData.returnD4) : null,
        returnD5: formData.returnD5 ? parseFloat(formData.returnD5) : null,
        returnD6: formData.returnD6 ? parseFloat(formData.returnD6) : null,
        returnD7: formData.returnD7 ? parseFloat(formData.returnD7) : null,
        listingBoard: formData.listingBoard,
        listingDate: new Date(formData.listingDate).toISOString(),
        record: formData.record || null
      };

      await uwAPI.createRecord(recordData);
      showMessage('success', `Successfully created record for ${formData.code}`);
      
      // Reset form
      setFormData({
        uw: '', code: '', companyName: '', ipoPrice: '',
        returnD1: '', returnD2: '', returnD3: '', returnD4: '',
        returnD5: '', returnD6: '', returnD7: '', listingBoard: '',
        listingDate: '', record: ''
      });
      setIsAddingRecord(false);
      
    } catch (error) {
      showMessage('error', `Failed to create record: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      showMessage('error', 'Please provide bulk data');
      return;
    }

    setIsLoading(true);
    try {
      // Parse JSON data
      const records = JSON.parse(bulkData);
      
      if (!Array.isArray(records)) {
        throw new Error('Data must be an array of records');
      }

      const result = await uwAPI.bulkUpload(records);
      showMessage('success', 
        `Bulk upload completed: ${result.success} successful, ${result.failed} failed`
      );
      
      if (result.errors.length > 0) {
        console.log('Upload errors:', result.errors);
      }
      
      setBulkData('');
      setIsBulkUploading(false);
      
    } catch (error) {
      if (error.message.includes('JSON')) {
        showMessage('error', 'Invalid JSON format. Please check your data.');
      } else {
        showMessage('error', `Bulk upload failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample JSON for bulk upload
  const generateSampleJSON = () => {
    const sample = [
      {
        uw: "GT",
        code: "SMPL",
        companyName: "PT Sample Company Tbk",
        ipoPrice: 500,
        returnD1: 0.15,
        returnD2: 0.12,
        returnD3: 0.08,
        returnD4: 0.05,
        returnD5: 0.03,
        returnD6: 0.01,
        returnD7: -0.02,
        listingBoard: "Utama",
        listingDate: "2024-01-15T00:00:00Z",
        record: "ARA 2x"
      }
    ];
    
    setBulkData(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Kelola data underwriter IPO</p>
      </div>

      {/* Messages */}
      {message.content && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.content}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={() => setIsAddingRecord(true)}
          className="flex items-center space-x-2"
          disabled={isAddingRecord}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Record Baru</span>
        </Button>
        
        <Button 
          onClick={() => setIsBulkUploading(true)}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={isBulkUploading}
        >
          <Upload className="h-4 w-4" />
          <span>Bulk Upload</span>
        </Button>
        
        <Button 
          onClick={() => setIsManagingData(true)}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={isManagingData}
        >
          <Eye className="h-4 w-4" />
          <span>Kelola Data</span>
        </Button>
      </div>

      {/* Add New Record Form */}
      {isAddingRecord && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tambah Record Baru</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsAddingRecord(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="uw">UW Code *</Label>
                  <Input
                    id="uw"
                    value={formData.uw}
                    onChange={(e) => handleInputChange('uw', e.target.value)}
                    placeholder="e.g., GT"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">Stock Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="e.g., GOTO"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="ipoPrice">IPO Price (IDR) *</Label>
                  <Input
                    id="ipoPrice"
                    type="number"
                    value={formData.ipoPrice}
                    onChange={(e) => handleInputChange('ipoPrice', e.target.value)}
                    placeholder="e.g., 346"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g., PT GoTo Gojek Tokopedia Tbk"
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div key={day}>
                    <Label htmlFor={`returnD${day}`}>D+{day} Return</Label>
                    <Input
                      id={`returnD${day}`}
                      type="number"
                      step="0.01"
                      value={formData[`returnD${day}`]}
                      onChange={(e) => handleInputChange(`returnD${day}`, e.target.value)}
                      placeholder="0.15"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="listingBoard">Listing Board *</Label>
                  <Select value={formData.listingBoard} onValueChange={(value) => handleInputChange('listingBoard', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Utama">Utama</SelectItem>
                      <SelectItem value="Pengembangan">Pengembangan</SelectItem>
                      <SelectItem value="Akselerasi">Akselerasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="listingDate">Listing Date *</Label>
                  <Input
                    id="listingDate"
                    type="date"
                    value={formData.listingDate}
                    onChange={(e) => handleInputChange('listingDate', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="record">Record</Label>
                  <Input
                    id="record"
                    value={formData.record}
                    onChange={(e) => handleInputChange('record', e.target.value)}
                    placeholder="e.g., ARA 5x"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingRecord(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Record
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Upload */}
      {isBulkUploading && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bulk Upload Records</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsBulkUploading(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Paste JSON array of records below:
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSampleJSON}
              >
                Generate Sample
              </Button>
            </div>
            
            <Textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="Paste your JSON data here..."
              rows={10}
              className="font-mono text-sm"
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsBulkUploading(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpload}
                disabled={isLoading || !bulkData.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Records
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      {isManagingData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Kelola Data UW Records</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsManagingData(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan UW, kode, atau nama perusahaan"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Menampilkan {displayedCount} record
              </p>
            </div>

            {/* Data Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : uwData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data yang tersedia'}
                </p>
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
                      <TableHead className="font-semibold text-gray-900">Papan</TableHead>
                      <TableHead className="font-semibold text-gray-900">Tanggal</TableHead>
                      <TableHead className="font-semibold text-gray-900">Record</TableHead>
                      <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uwData.map((item) => (
                      <TableRow key={item._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-indigo-600">
                          {Array.isArray(item.underwriters) ? (
                            <div className="flex flex-wrap gap-1">
                              {item.underwriters.map((uw, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {uw}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            item.uw || item.underwriters
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={item.companyName}>
                            {item.companyName}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatPrice(item.ipoPrice)}</TableCell>
                        <TableCell>
                          <Badge className={getBoardBadgeColor(item.listingBoard)}>
                            {item.listingBoard}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(item.listingDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {item.record || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus record ini?
                                  <br />
                                  <strong>{item.uw} - {item.code} ({item.companyName})</strong>
                                  <br />
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteRecord(item._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Utility function for board badge colors
  function getBoardBadgeColor(board) {
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
  }
};

export default AdminPanel;