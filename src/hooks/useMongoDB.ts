import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCollection, getDatabase } from '@/lib/mongodb';
import { Db, Collection, MongoClient } from 'mongodb';

// Generic hook for MongoDB operations
export function useMongoCollection<T = any>(collectionName: string) {
  const queryClient = useQueryClient();

  // Find documents
  const findQuery = useQuery({
    queryKey: ['mongo', collectionName, 'find'],
    queryFn: async () => {
      const collection = await getCollection<T>(collectionName);
      const cursor = await collection.find({});
      return cursor.toArray();
    },
    enabled: false, // Don't fetch automatically
  });

  // Insert document
  const insertMutation = useMutation({
    mutationFn: async (document: T) => {
      const collection = await getCollection<T>(collectionName);
      const result = await collection.insertOne(document as any);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collectionName] });
    },
  });

  // Update document
  const updateMutation = useMutation({
    mutationFn: async ({ id, update }: { id: string; update: Partial<T> }) => {
      const collection = await getCollection<T>(collectionName);
      const result = await collection.updateOne(
        { _id: id } as any,
        { $set: update } as any
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collectionName] });
    },
  });

  // Delete document
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const collection = await getCollection<T>(collectionName);
      const result = await collection.deleteOne({ _id: id } as any);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mongo', collectionName] });
    },
  });

  return {
    find: findQuery,
    insert: insertMutation,
    update: updateMutation,
    delete: deleteMutation,
  };
}

// Hook for database connection status
export function useMongoConnection() {
  return useQuery({
    queryKey: ['mongo', 'connection'],
    queryFn: async () => {
      const db = await getDatabase();
      const admin = await db.admin();
      await admin.ping();
      return 'connected';
    },
    retry: 3,
  });
}
