// Reference: javascript_database integration
import {
  audioFiles,
  affirmations,
  activities,
  jokes,
  ttsSettings,
  children,
  emotionCheckIns,
  families,
  parents,
  familySettings,
  assetDistributions,
  type AudioFile,
  type InsertAudioFile,
  type Affirmation,
  type InsertAffirmation,
  type Activity,
  type InsertActivity,
  type Joke,
  type InsertJoke,
  type TtsSetting,
  type InsertTtsSetting,
  type Child,
  type InsertChild,
  type EmotionCheckIn,
  type InsertEmotionCheckIn,
  type EmotionCategory,
  type Family,
  type InsertFamily,
  type Parent,
  type InsertParent,
  type FamilySetting,
  type InsertFamilySetting,
  type AssetDistribution,
  type InsertAssetDistribution,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc } from "drizzle-orm";
import type { Gender, UserRole } from "@shared/schema";
import * as bcrypt from "bcryptjs";

export interface IStorage {
  // Audio Files
  getAllAudio(): Promise<AudioFile[]>;
  getAudioByCategory(category: EmotionCategory): Promise<AudioFile[]>;
  getAudioById(id: string): Promise<AudioFile | undefined>;
  createAudio(data: InsertAudioFile): Promise<AudioFile>;
  updateAudio(id: string, data: Partial<InsertAudioFile>): Promise<AudioFile | undefined>;
  deleteAudio(id: string): Promise<void>;

  // Affirmations
  getAllAffirmations(): Promise<Affirmation[]>;
  getAffirmationsByCategory(category: EmotionCategory): Promise<Affirmation[]>;
  getAffirmationById(id: string): Promise<Affirmation | undefined>;
  createAffirmation(data: InsertAffirmation): Promise<Affirmation>;
  updateAffirmation(id: string, data: Partial<InsertAffirmation>): Promise<Affirmation | undefined>;
  deleteAffirmation(id: string): Promise<void>;

  // Activities
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByCategory(category: EmotionCategory): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
  createActivity(data: InsertActivity): Promise<Activity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<void>;

  // Jokes
  getAllJokes(): Promise<Joke[]>;
  getJokesByCategory(category: EmotionCategory): Promise<Joke[]>;
  getJokeById(id: string): Promise<Joke | undefined>;
  createJoke(data: InsertJoke): Promise<Joke>;
  updateJoke(id: string, data: Partial<InsertJoke>): Promise<Joke | undefined>;
  deleteJoke(id: string): Promise<void>;

  // TTS Settings
  getTtsSettings(): Promise<TtsSetting | undefined>;
  updateTtsSettings(data: InsertTtsSetting): Promise<TtsSetting>;

  // Children
  getAllChildren(): Promise<Child[]>;
  getChildrenByFamilyCode(familyCode: string): Promise<Child[]>;
  getChildById(id: string): Promise<Child | undefined>;
  createChild(data: InsertChild): Promise<Child>;
  updateChild(id: string, data: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: string): Promise<void>;

  // Emotion Check-Ins
  createCheckIn(data: InsertEmotionCheckIn): Promise<EmotionCheckIn>;
  getCheckInsByChild(childId: string, limit?: number): Promise<EmotionCheckIn[]>;
  getCheckInsByFamilyCode(familyCode: string, limit?: number): Promise<EmotionCheckIn[]>;
  
  // Families
  createFamily(data: InsertFamily): Promise<Family>;
  getFamilyByCode(familyCode: string): Promise<Family | undefined>;
  getFamilyById(id: string): Promise<Family | undefined>;
  validateFamilyPin(familyCode: string, pin: string): Promise<boolean>;
  
  // Parents
  createParent(data: InsertParent): Promise<Parent>;
  getParentsByFamily(familyId: string): Promise<Parent[]>;
  getParentById(id: string): Promise<Parent | undefined>;
  validateParentPin(parentId: string, pin: string): Promise<boolean>;
  
  // Family Settings
  getFamilySettings(familyId: string): Promise<FamilySetting | undefined>;
  upsertFamilySettings(familyId: string, data: InsertFamilySetting): Promise<FamilySetting>;
  
  // Asset Distributions
  createAssetDistribution(data: InsertAssetDistribution): Promise<AssetDistribution>;
  getAssetDistributions(familyId: string): Promise<AssetDistribution[]>;
  updateAssetDistribution(id: string, data: Partial<InsertAssetDistribution>): Promise<AssetDistribution | undefined>;
  deleteAssetDistribution(id: string): Promise<void>;
  getFilteredAssetsForChild(childId: string, assetType: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // Audio Files
  async getAllAudio(): Promise<AudioFile[]> {
    return await db.select().from(audioFiles);
  }

  async getAudioByCategory(category: EmotionCategory): Promise<AudioFile[]> {
    return await db
      .select()
      .from(audioFiles)
      .where(or(eq(audioFiles.category, category), eq(audioFiles.category, "general")));
  }

  async getAudioById(id: string): Promise<AudioFile | undefined> {
    const [audio] = await db.select().from(audioFiles).where(eq(audioFiles.id, id));
    return audio || undefined;
  }

  async createAudio(data: InsertAudioFile): Promise<AudioFile> {
    const [audio] = await db.insert(audioFiles).values({
      ...data,
      category: data.category as EmotionCategory
    }).returning();
    return audio;
  }

  async updateAudio(id: string, data: Partial<InsertAudioFile>): Promise<AudioFile | undefined> {
    const updateData: any = { ...data };
    if (data.category) {
      updateData.category = data.category as EmotionCategory;
    }
    const [audio] = await db
      .update(audioFiles)
      .set(updateData)
      .where(eq(audioFiles.id, id))
      .returning();
    return audio || undefined;
  }

  async deleteAudio(id: string): Promise<void> {
    await db.delete(audioFiles).where(eq(audioFiles.id, id));
  }

  // Affirmations
  async getAllAffirmations(): Promise<Affirmation[]> {
    return await db.select().from(affirmations);
  }

  async getAffirmationsByCategory(category: EmotionCategory): Promise<Affirmation[]> {
    return await db
      .select()
      .from(affirmations)
      .where(or(eq(affirmations.category, category), eq(affirmations.category, "general")));
  }

  async getAffirmationById(id: string): Promise<Affirmation | undefined> {
    const [affirmation] = await db.select().from(affirmations).where(eq(affirmations.id, id));
    return affirmation || undefined;
  }

  async createAffirmation(data: InsertAffirmation): Promise<Affirmation> {
    const [affirmation] = await db.insert(affirmations).values({
      ...data,
      category: data.category as EmotionCategory
    }).returning();
    return affirmation;
  }

  async updateAffirmation(id: string, data: Partial<InsertAffirmation>): Promise<Affirmation | undefined> {
    const updateData: any = { ...data };
    if (data.category) {
      updateData.category = data.category as EmotionCategory;
    }
    const [affirmation] = await db
      .update(affirmations)
      .set(updateData)
      .where(eq(affirmations.id, id))
      .returning();
    return affirmation || undefined;
  }

  async deleteAffirmation(id: string): Promise<void> {
    await db.delete(affirmations).where(eq(affirmations.id, id));
  }

  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivitiesByCategory(category: EmotionCategory): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(or(eq(activities.category, category), eq(activities.category, "general")));
  }

  async getActivityById(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values({
      ...data,
      category: data.category as EmotionCategory
    }).returning();
    return activity;
  }

  async updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    const updateData: any = { ...data };
    if (data.category) {
      updateData.category = data.category as EmotionCategory;
    }
    const [activity] = await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Jokes
  async getAllJokes(): Promise<Joke[]> {
    return await db.select().from(jokes);
  }

  async getJokesByCategory(category: EmotionCategory): Promise<Joke[]> {
    return await db
      .select()
      .from(jokes)
      .where(or(eq(jokes.category, category), eq(jokes.category, "general")));
  }

  async getJokeById(id: string): Promise<Joke | undefined> {
    const [joke] = await db.select().from(jokes).where(eq(jokes.id, id));
    return joke || undefined;
  }

  async createJoke(data: InsertJoke): Promise<Joke> {
    const [joke] = await db.insert(jokes).values({
      ...data,
      category: data.category as EmotionCategory
    }).returning();
    return joke;
  }

  async updateJoke(id: string, data: Partial<InsertJoke>): Promise<Joke | undefined> {
    const updateData: any = { ...data };
    if (data.category) {
      updateData.category = data.category as EmotionCategory;
    }
    const [joke] = await db
      .update(jokes)
      .set(updateData)
      .where(eq(jokes.id, id))
      .returning();
    return joke || undefined;
  }

  async deleteJoke(id: string): Promise<void> {
    await db.delete(jokes).where(eq(jokes.id, id));
  }

  // TTS Settings
  async getTtsSettings(): Promise<TtsSetting | undefined> {
    const [settings] = await db.select().from(ttsSettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(ttsSettings)
        .values({
          voiceProfile: "alloy",
          speed: 100,
          pitch: 100,
          volume: 80,
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateTtsSettings(data: InsertTtsSetting): Promise<TtsSetting> {
    const existing = await this.getTtsSettings();
    if (existing) {
      const [updated] = await db
        .update(ttsSettings)
        .set(data)
        .where(eq(ttsSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(ttsSettings).values(data).returning();
      return created;
    }
  }

  // Children
  async getAllChildren(): Promise<Child[]> {
    return await db.select().from(children);
  }

  async getChildrenByFamilyCode(familyCode: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.familyCode, familyCode));
  }

  async getChildById(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async createChild(data: InsertChild): Promise<Child> {
    const [child] = await db.insert(children).values({
      ...data,
      gender: data.gender as Gender | undefined
    }).returning();
    return child;
  }

  async updateChild(id: string, data: Partial<InsertChild>): Promise<Child | undefined> {
    const updateData: any = { ...data };
    if (data.gender) {
      updateData.gender = data.gender as Gender;
    }
    const [child] = await db
      .update(children)
      .set(updateData)
      .where(eq(children.id, id))
      .returning();
    return child || undefined;
  }

  async deleteChild(id: string): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  // Emotion Check-Ins
  async createCheckIn(data: InsertEmotionCheckIn): Promise<EmotionCheckIn> {
    const [checkIn] = await db.insert(emotionCheckIns).values({
      ...data,
      emotionCategory: data.emotionCategory as EmotionCategory,
      detectedEmotion: data.detectedEmotion as EmotionCategory
    }).returning();
    return checkIn;
  }

  async getCheckInsByChild(childId: string, limit: number = 50): Promise<EmotionCheckIn[]> {
    return await db
      .select()
      .from(emotionCheckIns)
      .where(eq(emotionCheckIns.childId, childId))
      .orderBy(desc(emotionCheckIns.createdAt))
      .limit(limit);
  }

  async getCheckInsByFamilyCode(familyCode: string, limit: number = 100): Promise<EmotionCheckIn[]> {
    const childrenInFamily = await this.getChildrenByFamilyCode(familyCode);
    const childIds = childrenInFamily.map(c => c.id);
    
    if (childIds.length === 0) return [];
    
    return await db
      .select()
      .from(emotionCheckIns)
      .where(or(...childIds.map(id => eq(emotionCheckIns.childId, id))))
      .orderBy(desc(emotionCheckIns.createdAt))
      .limit(limit);
  }

  // Families
  async createFamily(data: InsertFamily): Promise<Family> {
    // Hash the PIN before storing
    const hashedData = {
      ...data,
      pin: await bcrypt.hash((data as any).pin, 10)
    };
    const [family] = await db.insert(families).values(hashedData).returning();
    return family;
  }

  async getFamilyByCode(familyCode: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.familyCode, familyCode));
    return family || undefined;
  }

  async getFamilyById(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

  async validateFamilyPin(familyCode: string, pin: string): Promise<boolean> {
    console.log(`[validateFamilyPin] Checking familyCode: ${familyCode}, pin: ${pin}`);
    const family = await this.getFamilyByCode(familyCode);
    if (!family) {
      console.log(`[validateFamilyPin] Family not found for code: ${familyCode}`);
      return false;
    }
    console.log(`[validateFamilyPin] Found family: ${family.id}, name: ${family.familyName}`);
    
    // Work with existing 'pin' column in database
    const storedPin = (family as any).pin;
    if (!storedPin) {
      console.log(`[validateFamilyPin] No PIN stored for family`);
      return false;
    }
    
    console.log(`[validateFamilyPin] Stored PIN starts with: ${storedPin.substring(0, 7)}, length: ${storedPin.length}`);
    
    // If the PIN is not hashed yet (legacy plaintext), compare directly then update to hash
    if (!storedPin.startsWith('$2')) {
      console.log(`[validateFamilyPin] PIN not hashed, comparing plaintext`);
      if (storedPin === pin) {
        // Update to hashed PIN for next time
        const hash = await bcrypt.hash(pin, 10);
        await db.update(families)
          .set({ pin: hash } as any)
          .where(eq(families.id, family.id));
        console.log(`[validateFamilyPin] Plaintext match, updated to hash`);
        return true;
      }
      console.log(`[validateFamilyPin] Plaintext mismatch`);
      return false;
    }
    // Compare with bcrypt hash
    console.log(`[validateFamilyPin] Comparing hashed PIN with bcrypt`);
    const result = await bcrypt.compare(pin, storedPin);
    console.log(`[validateFamilyPin] bcrypt.compare result: ${result}`);
    return result;
  }

  // Parents
  async createParent(data: InsertParent): Promise<Parent> {
    // Parents don't have their own PINs - they use family PIN
    const [parent] = await db.insert(parents).values({
      ...data,
      role: (data.role || 'parent') as UserRole
    }).returning();
    return parent;
  }

  async getParentsByFamily(familyId: string): Promise<Parent[]> {
    return await db.select().from(parents).where(eq(parents.familyId, familyId));
  }

  async getParentById(id: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent || undefined;
  }

  async validateParentPin(parentId: string, pin: string): Promise<boolean> {
    const parent = await this.getParentById(parentId);
    if (!parent) return false;
    
    // Parents use family PIN for authentication
    const family = await this.getFamilyById(parent.familyId);
    if (!family) return false;
    
    // Use the same bcrypt comparison logic for family PIN
    const familyPin = (family as any).pin;
    if (!familyPin) return false;
    
    // Handle legacy non-hashed PINs
    if (!familyPin.startsWith('$2')) {
      return familyPin === pin;
    }
    
    // Compare with bcrypt hash
    return await bcrypt.compare(pin, familyPin);
  }

  // Family Settings
  async getFamilySettings(familyId: string): Promise<FamilySetting | undefined> {
    const [settings] = await db.select().from(familySettings).where(eq(familySettings.familyId, familyId));
    return settings || undefined;
  }

  async upsertFamilySettings(familyId: string, data: InsertFamilySetting): Promise<FamilySetting> {
    const existing = await this.getFamilySettings(familyId);
    if (existing) {
      const [updated] = await db
        .update(familySettings)
        .set(data)
        .where(eq(familySettings.familyId, familyId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(familySettings).values({ ...data, familyId }).returning();
      return created;
    }
  }

  // Asset Distributions
  async createAssetDistribution(data: InsertAssetDistribution): Promise<AssetDistribution> {
    const [distribution] = await db.insert(assetDistributions).values({
      ...data,
      genderFilter: data.genderFilter as Gender | undefined
    }).returning();
    return distribution;
  }

  async getAssetDistributions(familyId: string): Promise<AssetDistribution[]> {
    return await db.select().from(assetDistributions).where(eq(assetDistributions.familyId, familyId));
  }

  async updateAssetDistribution(id: string, data: Partial<InsertAssetDistribution>): Promise<AssetDistribution | undefined> {
    const updateData: any = { ...data };
    if (data.genderFilter) {
      updateData.genderFilter = data.genderFilter as Gender;
    }
    const [distribution] = await db
      .update(assetDistributions)
      .set(updateData)
      .where(eq(assetDistributions.id, id))
      .returning();
    return distribution || undefined;
  }

  async deleteAssetDistribution(id: string): Promise<void> {
    await db.delete(assetDistributions).where(eq(assetDistributions.id, id));
  }

  async getFilteredAssetsForChild(childId: string, assetType: string): Promise<string[]> {
    const child = await this.getChildById(childId);
    if (!child) return [];

    const family = await this.getFamilyById(child.familyId);
    if (!family) return [];

    const distributions = await this.getAssetDistributions(family.id);
    const activeDistributions = distributions.filter(d => d.isActive && d.assetType === assetType);

    const assetIds: Set<string> = new Set();

    for (const dist of activeDistributions) {
      // Check if this distribution applies to this child
      let applies = false;

      if (dist.distributionType === 'all') {
        applies = true;
      } else if (dist.distributionType === 'include' && dist.profileIds?.includes(childId)) {
        applies = true;
      } else if (dist.distributionType === 'exclude' && !dist.profileIds?.includes(childId)) {
        applies = true;
      }

      // Check gender filter
      if (applies && dist.genderFilter && child.gender && dist.genderFilter !== child.gender) {
        applies = false;
      }

      // Check age filter
      if (applies && child.age) {
        if (dist.ageMin && child.age < dist.ageMin) applies = false;
        if (dist.ageMax && child.age > dist.ageMax) applies = false;
      }

      if (applies) {
        assetIds.add(dist.assetId);
      }
    }

    return Array.from(assetIds);
  }
}

export const storage = new DatabaseStorage();
