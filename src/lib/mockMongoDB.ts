// Mock MongoDB implementation for development
interface MockDocument {
  _id: string;
  [key: string]: any;
}

// Mock cursor implementation
class MockCursor<T = any> {
  private documents: T[];

  constructor(documents: T[]) {
    this.documents = documents;
  }

  async toArray(): Promise<T[]> {
    return this.documents;
  }

  async forEach(callback: (doc: T) => void): Promise<void> {
    this.documents.forEach(callback);
  }

  async limit(count: number): Promise<MockCursor<T>> {
    return new MockCursor(this.documents.slice(0, count));
  }

  async skip(count: number): Promise<MockCursor<T>> {
    return new MockCursor(this.documents.slice(count));
  }
}

class MockCollection<T = any> {
  private documents: MockDocument[] = [];
  private nextId = 1;

  async find(query: any = {}): Promise<MockCursor<T>> {
    // Simple mock filtering
    const filtered = this.documents.filter(doc => {
      if (Object.keys(query).length === 0) return true;
      return Object.entries(query).every(([key, value]) => doc[key] === value);
    });
    return new MockCursor<T>(filtered as T[]);
  }

  async findOne(query: any): Promise<T | null> {
    const cursor = await this.find(query);
    const docs = await cursor.toArray();
    return docs.length > 0 ? docs[0] : null;
  }

  async insertOne(document: T): Promise<{ insertedId: string }> {
    const id = `mock_${this.nextId++}`;
    const mockDoc = { _id: id, ...document, createdAt: new Date() };
    this.documents.push(mockDoc);
    return { insertedId: id };
  }

  async insertMany(documents: T[]): Promise<{ insertedIds: string[] }> {
    const ids: string[] = [];
    for (const doc of documents) {
      const result = await this.insertOne(doc);
      ids.push(result.insertedId);
    }
    return { insertedIds: ids };
  }

  async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
    const cursor = await this.find(query);
    const docs = await cursor.toArray();
    let modifiedCount = 0;
    
    for (const doc of docs) {
      if (update.$set) {
        Object.assign(doc, update.$set);
        modifiedCount++;
      }
    }
    
    return { modifiedCount };
  }

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    const cursor = await this.find(query);
    const docs = await cursor.toArray();
    if (docs.length > 0) {
      const doc = docs[0] as any;
      const index = this.documents.findIndex(d => d._id === doc._id);
      if (index !== -1) {
        this.documents.splice(index, 1);
      }
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query: any): Promise<{ deletedCount: number }> {
    const cursor = await this.find(query);
    const docs = await cursor.toArray();
    const deletedCount = docs.length;
    
    for (const doc of docs) {
      const mockDoc = doc as any;
      const index = this.documents.findIndex(d => d._id === mockDoc._id);
      if (index !== -1) {
        this.documents.splice(index, 1);
      }
    }
    
    return { deletedCount };
  }
}

class MockDatabase {
  private collections: Map<string, MockCollection> = new Map();

  collection<T = any>(name: string): MockCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection<T>());
    }
    return this.collections.get(name) as MockCollection<T>;
  }

  async admin() {
    return {
      ping: async () => {
        // Simulate successful ping
        return { ok: 1 };
      }
    };
  }
}

class MockMongoClient {
  private database: MockDatabase;

  constructor(uri: string, options?: any) {
    this.database = new MockDatabase();
  }

  async connect(): Promise<this> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return this;
  }

  db(name?: string): MockDatabase {
    return this.database;
  }

  async close(): Promise<void> {
    // Mock close
  }
}

// Mock client promise for development
const mockClient = new MockMongoClient('mongodb://localhost:27017/cos-alpha-dev');
const mockClientPromise = mockClient.connect();

export default mockClientPromise;

export async function getDatabase(): Promise<MockDatabase> {
  const client = await mockClientPromise;
  return client.db('cos-alpha');
}

export async function getCollection<T = any>(collectionName: string) {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}
