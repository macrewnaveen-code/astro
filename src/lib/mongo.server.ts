import { MongoClient, Db, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load env variables
config();

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoConnection() {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || import.meta.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in process.env or import.meta.env');
    }

    console.log('🔌 [BUILD] Establishing MongoDB connection...');
    const connectionStartTime = Date.now();

    const client = new MongoClient(mongoUri);
    await client.connect();

    const connectionEndTime = Date.now();
    const connectionDuration = ((connectionEndTime - connectionStartTime) / 1000).toFixed(2);
    console.log(`✅ [BUILD] MongoDB connected successfully in ${connectionDuration}s`);

    const db = client.db('lcdb');

    cachedClient = client;
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('❌ [BUILD] MongoDB connection error:', error);
    throw error;
  }
}

export async function getArticlesFromMongo(page = 1, limit = 10, categoryName?: string) {
  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');
    const categoriesCollection = db.collection('categories');
    const skip = (page - 1) * limit;

    let query = {};
    if (categoryName) {
      // Find the category by name
      const category = await categoriesCollection.findOne({
        name: new RegExp(categoryName, 'i')
      });

      if (category) {
        query = { categories: category._id };
      } else {
        // If category not found, return empty array
        return [];
      }
    }

    const articles = await articlesCollection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories'
          }
        },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    return articles.map(doc => ({
      _id: doc._id?.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error('❌ Error fetching articles from MongoDB:', error);
    return [];
  }
}

export async function getArticlesCountFromMongo(): Promise<number> {
  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');
    const count = await articlesCollection.countDocuments({});
    return count;
  } catch (error) {
    console.error('❌ Error fetching articles count from MongoDB:', error);
    return 0;
  }
}

export async function getRelatedArticlesFromMongo(categoryIds: any[], excludeArticleId: string, limit = 6) {
  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');

    const relatedArticles = await articlesCollection
      .aggregate([
        {
          $match: {
            'categories': { $in: categoryIds },
            '_id': { $ne: excludeArticleId },
            $or: [
              {
                $and: [
                  { title: { $exists: true } },
                  { title: { $ne: null } },
                  { title: { $ne: '' } }
                ]
              },
              { 'featured_image.asset': { $exists: true } }
            ]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        { $limit: limit }
      ])
      .toArray();

    return relatedArticles.map(doc => ({
      _id: doc._id?.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error('❌ Error fetching related articles from MongoDB:', error);
    return [];
  }
}

export async function getAllArticlesFromMongo() {
  const startTime = Date.now();
  console.log('📊 [BUILD] Starting to fetch ALL articles from MongoDB...');

  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');

    // Get total count first for progress tracking
    const totalCount = await articlesCollection.countDocuments();
    console.log(`📊 [BUILD] Found ${totalCount} articles in database`);

    // Fetch only essential fields for static path generation
    console.log('📊 [BUILD] Fetching articles from MongoDB (essential fields only)...');
    const articles = await articlesCollection.find(
      {},
      {
        projection: {
          _id: 1,
          slug: 1,
          title: 1,
          // Add other essential fields as needed
        }
      }
    ).toArray();

    const processedArticles = articles.map(doc => ({
      _id: doc._id?.toString(),
      slug: doc.slug,
      title: doc.title,
      // Add other essential fields
    }));

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ [BUILD] Successfully fetched ${processedArticles.length} articles in ${duration}s`);
    console.log(`📊 [BUILD] Average: ${(processedArticles.length / (endTime - startTime) * 1000).toFixed(0)} articles/second`);

    return processedArticles;
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`❌ [BUILD] Error fetching articles after ${duration}s:`, error);
    return [];
  }
}

export async function getArticleBySlugFromMongo(slug: string) {
  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');
    const article = await articlesCollection.findOne({ slug });

    if (!article) return null;

    return {
      _id: article._id?.toString(),
      ...article,
    };
  } catch (error) {
    console.error('❌ Error fetching article by slug from MongoDB:', error);
    return null;
  }
}

export async function getCommentsByArticleIdFromMongo(articleId: string) {
  try {
    const db = await getMongoConnection();
    const commentsCollection = db.collection('comments');

    const comments = await commentsCollection
      .find({ article: new ObjectId(articleId) })
      .sort({ createdAt: -1 })
      .toArray();

    return comments.map(doc => ({
      _id: doc._id?.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error('❌ Error fetching comments from MongoDB:', error);
    return [];
  }
}

export async function saveCommentToMongo(articleId: string, commentData: {
  author: string;
  email: string;
  text: string;
  rating: number;
}) {
  try {
    const db = await getMongoConnection();
    const commentsCollection = db.collection('comments');

    const comment = {
      article: new ObjectId(articleId),
      author: commentData.author,
      email: commentData.email,
      text: commentData.text,
      rating: commentData.rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await commentsCollection.insertOne(comment);

    return {
      _id: result.insertedId.toString(),
      ...comment,
      article: articleId, // Return article as string for consistency
    };
  } catch (error) {
    console.error('❌ Error saving comment to MongoDB:', error);
    throw error;
  }
}

export async function searchArticlesFromMongo(query: string, limit = 50) {
  try {
    const db = await getMongoConnection();
    const articlesCollection = db.collection('articles');

    // Create a regex pattern for case-insensitive search
    const searchRegex = new RegExp(query, 'i');

    const articles = await articlesCollection
      .aggregate([
        {
          $match: {
            $or: [
              { title: { $regex: searchRegex } },
              { excerpt: { $regex: searchRegex } },
              { content: { $regex: searchRegex } }
            ]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories'
          }
        },
        { $limit: limit }
      ])
      .toArray();

    return articles.map(doc => ({
      _id: doc._id?.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error('❌ Error searching articles from MongoDB:', error);
    return [];
  }
}

export async function getAllCategoriesFromMongo() {
  try {
    const db = await getMongoConnection();
    const categoriesCollection = db.collection('categories');

    const categories = await categoriesCollection.find({}).toArray();

    return categories.map(doc => ({
      _id: doc._id?.toString(),
      ...doc,
    }));
  } catch (error) {
    console.error('❌ Error fetching categories from MongoDB:', error);
    return [];
  }
}
