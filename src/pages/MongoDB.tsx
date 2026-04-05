/**
 * MongoDB Cluster Dashboard Page
 * 
 * Displays comprehensive information about MongoDB cluster including:
 * - Connection status
 * - Database collections
 * - Collection statistics
 * - Document viewer
 * - CRUD operations
 */

import { useState } from 'react';
import { useMongoCollection, useMongoConnection } from '@/hooks/useMongoDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Server, 
  FileText, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CollectionInfo {
  name: string;
  count: number;
  size: string;
}

interface DocumentData {
  _id: string;
  [key: string]: any;
}

export default function MongoDBDashboard() {
  const { toast } = useToast();
  const { data: connectionStatus, isLoading: connectionLoading, error: connectionError } = useMongoConnection();
  
  // State for collection management
  const [selectedCollection, setSelectedCollection] = useState<string>('users');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for document operations
  const [newDocument, setNewDocument] = useState('');
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // MongoDB collections to monitor
  const collections = ['users', 'logs', 'sessions', 'commands', 'config'];
  
  // Get data for selected collection
  const { find, insert, update, delete: deleteMutation } = useMongoCollection(selectedCollection);
  
  // Mock collection statistics (since we're using mock MongoDB)
  const getCollectionStats = (): CollectionInfo[] => {
    return collections.map(name => ({
      name,
      count: Math.floor(Math.random() * 1000),
      size: `${(Math.random() * 10).toFixed(2)} MB`
    }));
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({ title: 'Error', description: 'Please enter a collection name', variant: 'destructive' });
      return;
    }
    
    // In a real MongoDB setup, you'd create the collection here
    // For mock, we'll just add it to our list
    if (!collections.includes(newCollectionName)) {
      collections.push(newCollectionName);
      setSelectedCollection(newCollectionName);
      setNewCollectionName('');
      toast({ title: 'Success', description: `Collection "${newCollectionName}" created` });
    }
  };

  const handleInsertDocument = async () => {
    try {
      const document = JSON.parse(newDocument);
      await insert.mutateAsync(document);
      setNewDocument('');
      find.refetch();
      toast({ title: 'Success', description: 'Document inserted successfully' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Invalid JSON format', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      find.refetch();
      toast({ title: 'Success', description: 'Document deleted successfully' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete document', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateDocument = async (id: string) => {
    try {
      const updateData = JSON.parse(editContent);
      await update.mutateAsync({ id, update: updateData });
      setEditingDocument(null);
      setEditContent('');
      find.refetch();
      toast({ title: 'Success', description: 'Document updated successfully' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Invalid JSON format', 
        variant: 'destructive' 
      });
    }
  };

  const filteredDocuments = find.data?.filter(doc => 
    JSON.stringify(doc).toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (connectionLoading) {
    return (
      <div className="container mx-auto p-6 min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p>Connecting to MongoDB Cluster...</p>
        </div>
      </div>
    );
  }

  if (connectionError || connectionStatus !== 'connected') {
    return (
      <div className="container mx-auto p-6 min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Connection Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to MongoDB Atlas cluster. Please check your connection string and network connectivity.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            MongoDB Cluster
          </h1>
          <p className="text-muted-foreground">
            Real-time cluster monitoring and data management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => find.refetch()}
            disabled={find.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${find.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cluster Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
            <p className="text-xs text-muted-foreground">Active collections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCollectionStats().reduce((sum, col) => sum + col.count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all collections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCollectionStats().reduce((sum, col) => sum + parseFloat(col.size), 0).toFixed(2)} MB
            </div>
            <p className="text-xs text-muted-foreground">Total storage used</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Cluster availability</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Collection Statistics</CardTitle>
                  <CardDescription>Overview of all database collections</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleCreateCollection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getCollectionStats().map((collection) => (
                  <div 
                    key={collection.name}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCollection === collection.name ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedCollection(collection.name)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{collection.name}</p>
                        <p className="text-sm text-muted-foreground">Collection</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{collection.count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">documents</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{collection.size}</p>
                        <p className="text-sm text-muted-foreground">storage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents in "{selectedCollection}"</CardTitle>
                  <CardDescription>View and manage collection documents</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button onClick={() => find.refetch()} disabled={find.isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${find.isLoading ? 'animate-spin' : ''}`} />
                    Load
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {find.data && find.data.length > 0 ? (
                <div className="space-y-4">
                  {filteredDocuments.map((doc: DocumentData) => (
                    <div key={doc._id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{doc._id}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Created: {new Date(doc.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDocument(doc._id);
                              setEditContent(JSON.stringify(doc, null, 2));
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingDocument === doc._id ? (
                        <div className="space-y-2">
                          <label htmlFor={`edit-document-${doc._id}`} className="text-sm font-medium">
                            Edit Document JSON
                          </label>
                          <textarea
                            id={`edit-document-${doc._id}`}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-32 p-2 border rounded font-mono text-sm"
                            aria-label={`Edit document ${doc._id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDocument(doc._id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDocument(null);
                                setEditContent('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documents found</p>
                  <p className="text-sm text-muted-foreground">Click "Load" to fetch documents from the collection</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Insert Document</CardTitle>
                <CardDescription>Add a new document to "{selectedCollection}"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="insert-document" className="text-sm font-medium">
                    Document JSON
                  </label>
                  <textarea
                    id="insert-document"
                    placeholder='{"name": "John Doe", "email": "john@example.com"}'
                    value={newDocument}
                    onChange={(e) => setNewDocument(e.target.value)}
                    className="w-full h-32 p-3 border rounded font-mono text-sm"
                    aria-label="Insert document JSON"
                  />
                </div>
                <Button 
                  onClick={handleInsertDocument}
                  disabled={insert.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {insert.isPending ? 'Inserting...' : 'Insert Document'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cluster Information</CardTitle>
                <CardDescription>MongoDB Atlas cluster details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cluster Name</span>
                    <span className="text-sm font-medium">cos-alpha-cluster</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Provider</span>
                    <span className="text-sm font-medium">AWS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Region</span>
                    <span className="text-sm font-medium">us-east-1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tier</span>
                    <span className="text-sm font-medium">M0 Sandbox</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">MongoDB Version</span>
                    <span className="text-sm font-medium">7.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connection Status</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
