import React, { useState, useCallback } from 'react';
import { Plus, Upload, Download, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { uwAPI } from '../services/api';

const AdminPanel = () => {
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
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
    </div>
  );
};

export default AdminPanel;