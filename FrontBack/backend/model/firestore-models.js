const { db, firestoreHelper } = require('../config/firebase-config');

class FirestoreModel {
  constructor(collectionName) {
    this.collection = db.collection(collectionName);
    this.collectionName = collectionName;
  }

  // CREATE
  async create(data, id = null) {
    try {
      let docRef;
      if (id) {
        docRef = this.collection.doc(id);
        await docRef.set({
          ...data,
          createdAt: firestoreHelper.timestamp(),
          updatedAt: firestoreHelper.timestamp()
        });
      } else {
        docRef = await this.collection.add({
          ...data,
          createdAt: firestoreHelper.timestamp(),
          updatedAt: firestoreHelper.timestamp()
        });
      }
      
      return {
        success: true,
        id: docRef.id,
        data: { id: docRef.id, ...data }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // FIND BY ID
  async findById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      return firestoreHelper.docWithId(doc);
    } catch (error) {
      console.error(`Error finding ${this.collectionName} by id:`, error);
      return null;
    }
  }

  // FIND ONE (with query)
  async findOne(query = {}) {
    try {
      let queryRef = this.collection;
      
      Object.keys(query).forEach(field => {
        queryRef = queryRef.where(field, '==', query[field]);
      });
      
      const snapshot = await queryRef.limit(1).get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return firestoreHelper.docWithId(doc);
    } catch (error) {
      console.error(`Error finding ${this.collectionName}:`, error);
      return null;
    }
  }

  // FIND MANY
  async find(query = {}, options = {}) {
    try {
      let queryRef = this.collection;
      
      // Add where conditions
      Object.keys(query).forEach(field => {
        if (query[field] !== undefined) {
          queryRef = queryRef.where(field, '==', query[field]);
        }
      });
      
      // Add order by
      if (options.sort) {
        queryRef = queryRef.orderBy(
          options.sort.field, 
          options.sort.direction || 'asc'
        );
      }
      
      // Add limit
      if (options.limit) {
        queryRef = queryRef.limit(options.limit);
      }
      
      const snapshot = await queryRef.get();
      return firestoreHelper.docsWithIds(snapshot);
    } catch (error) {
      console.error(`Error finding ${this.collectionName}:`, error);
      return [];
    }
  }

  // UPDATE
  async update(id, data) {
    try {
      await this.collection.doc(id).update({
        ...data,
        updatedAt: firestoreHelper.timestamp()
      });
      
      const updatedDoc = await this.findById(id);
      return {
        success: true,
        data: updatedDoc
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // DELETE
  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // COUNT
  async count(query = {}) {
    try {
      let queryRef = this.collection;
      
      Object.keys(query).forEach(field => {
        queryRef = queryRef.where(field, '==', query[field]);
      });
      
      const snapshot = await queryRef.get();
      return snapshot.size;
    } catch (error) {
      console.error(`Error counting ${this.collectionName}:`, error);
      return 0;
    }
  }

  // PAGINATION
  async paginate(page = 1, limit = 10, query = {}, sort = {}) {
    try {
      let queryRef = this.collection;
      
      // Add where conditions
      Object.keys(query).forEach(field => {
        queryRef = queryRef.where(field, '==', query[field]);
      });
      
      // Add order by
      if (sort.field) {
        queryRef = queryRef.orderBy(sort.field, sort.direction || 'asc');
      }
      
      const startAt = (page - 1) * limit;
      const snapshot = await queryRef.limit(limit).get();
      
      const total = await this.count(query);
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: firestoreHelper.docsWithIds(snapshot),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error(`Error paginating ${this.collectionName}:`, error);
      return { data: [], pagination: {} };
    }
  }
}

// Create model instances
const Shop = new FirestoreModel('shops');
const User = new FirestoreModel('users');
const Product = new FirestoreModel('products');
const Order = new FirestoreModel('orders');
const Withdraw = new FirestoreModel('withdraws');
const Category = new FirestoreModel('categories');

module.exports = {
  Shop,
  User,
  Product,
  Order,
  Withdraw,
  Category,
  FirestoreModel
};