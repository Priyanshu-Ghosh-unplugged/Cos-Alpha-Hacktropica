import { useState } from 'react';
import { useMongoCollection, useMongoConnection } from '@/hooks/useMongoDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface User {
  name: string;
  email: string;
  createdAt: Date;
}

export default function MongoExample() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { find, insert, delete: deleteMutation } = useMongoCollection<User>('users');
  const { data: connectionStatus, isLoading: connectionLoading } = useMongoConnection();

  const handleInsert = async () => {
    if (!name || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await insert.mutateAsync({
        name,
        email,
        createdAt: new Date(),
      });
      toast.success('User added successfully!');
      setName('');
      setEmail('');
      // Refresh the list
      find.refetch();
    } catch (error) {
      toast.error('Failed to add user');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('User deleted successfully!');
      find.refetch();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleLoadUsers = () => {
    find.refetch();
  };

  if (connectionLoading) {
    return <div>Connecting to MongoDB...</div>;
  }

  if (connectionStatus !== 'connected') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Database Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to connect to MongoDB Atlas. Please check your connection string.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MongoDB Atlas Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleInsert} disabled={insert.isPending}>
              {insert.isPending ? 'Adding...' : 'Add User'}
            </Button>
          </div>

          <div className="space-y-2">
            <Button onClick={handleLoadUsers} variant="outline">
              Load Users
            </Button>
            
            {find.data && find.data.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Users:</h3>
                {find.data.map((user, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Button
                      onClick={() => handleDelete((user as any)._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
